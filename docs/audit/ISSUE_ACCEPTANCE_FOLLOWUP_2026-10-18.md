# Linked issue acceptance follow-up — October 18, 2026

This follows [the October 17 issue review](ISSUE_REVIEW_69_75_76_77_79_80_81_2026-10-17.md). Changes remain local. No GitHub issue reply/closure, push, release publication, store submission or downstream native-runtime synchronization is authorized by this report.

## Reproduced defects and corrections

- **#79, blank video-card areas:** the supplied export imports and compiles locally without invalid rules or data loss. Its category settings exercise the pending-card path. A queued metadata request returned `true` beyond the nominal eight-second placeholder deadline, preventing expiration. The processed-card shortcut could also skip the recheck. Pending visual state now has a per-card deadline keyed to video and category policy. Queued requests cannot extend it, rescans cannot restart it, and a delayed callback reprocesses current settings. Offscreen cards start a wait only when a visible lookup is requested; scrolling offscreen preserves an already-started deadline. Block-selected cards become usable after the deadline; actual metadata still applies category decisions. Allow-only unknown cards remain unavailable. Subsequent installed Firefox Android checks verified the actual backup import, rendered cards on Home/search/channel pages in mobile and desktop modes, scrolling, and thumbnail-to-watch navigation. See [installed acceptance and limits](FIREFOX_ANDROID_79_INSTALLED_ACCEPTANCE_2026-10-18.md). The reporter's physical-device session and an installed pre-fix comparison remain unverified.
- **Comment false blocking:** an actual compiled title-only channel rule could hide another author's comment mentioning that channel, despite an explicit empty comment-rule list. Comment renderers now use their dedicated keyword path. Author blocking, explicit comment rules, absent-list legacy fallback and Disabled behavior are preserved. Four failing cases were reproduced before the change; twelve regressions pass afterward.
- **#69, selected playlist row:** the current-watch owner enforcer hid the selected row despite the generic card pass protecting it. The actual enforcer and visibility helper reproduced this across desktop/mobile variants. The selected row now remains visible while current-video blocking metadata and player admission remain active. Modern mobile V2 rows use the same enumeration. Eight failures were reproduced before the change; nine regressions pass afterward. This removes a source-level trigger for YouTube-driven advancement; installed playlist behavior remains a separate check.

The new regression group contains **34 passing checks**: five category-lifetime cases, eight entire-DOM-pass/timer cases, twelve compiler-to-comment-engine cases and nine current-watch/selected-row cases. The DOM harness executes the production pass and callback with unrelated browser services stubbed; it does not establish compositor, network or physical-device behavior.

## Remaining acceptance boundaries

- Firefox 158 was downloaded from Mozilla's official archive and installed in the isolated `FilterTube_Firefox_Acceptance_20261018` phone emulator (`emulator-5556`). The user authorized its first-run Terms and subsequently authorized ADB/UI Automator controls after desktop pointer input failed. Remote Debugging via USB was enabled through Firefox Settings, and Mozilla's `web-ext` installed the current local 3.4.1 package. Actual file-picker import and UI readback showed **529 blocked keyword rules and 1,408 blocked channel rules**, including after removing a temporary watch-admission test keyword.
- Mobile and desktop Home/search/channel rendering, mobile and desktop thumbnail navigation, a playing regular mobile watch page, and confirmed global Disabled restoring the same matching-keyword watch without reload have installed-emulator evidence. This does not certify exact eight-second paint timing, forced allow-only unknown admission, every metadata-queue condition or the reporter's physical device. Desktop Home still has empty grid slots; one sampled slot did not navigate to an invisible video.
- The initial 2 GB phone emulator showed near-full RAM/swap and later exited with code 137. Both emulator processes were then absent. No command in this acceptance run targeted or stopped the existing TV emulator, and no Firefox/extension cause for their exit was established. Only the disposable phone was restarted with 4 GB for the remaining checks; native app sources and TV configuration were not changed.
- The exact #75 reporter-specific false block has not been reproduced. Exact current-video metadata, permitted adjacent-video metadata and the reporter's relevant rule settings remain necessary to establish that case.
- Installed BlockTube import/save/reopen, exact reporter-specific false blocking and native/physical-device parity remain open. A separate source-level concurrent-save race was reproduced during review and is recorded in the installed-acceptance report; it was not established as the cause of an installed interaction and is not fixed by the category-placeholder change.
- Argon Medium challenged deadline/tap behavior and recycled-card identity. The identity reset and explicit comment-list boundaries have executable coverage; installed thumbnail navigation and matching-keyword/Disabled admission checks now supplement it. API proposals that truncated or misstated the contracts were rejected as validation, including two truncated checklist requests to Gemini 3.8 Flash during installed testing.

## Final source and package validation

| Check | Passing/total | Reproduction |
| --- | ---: | --- |
| Smoke | 314/314 | `node scripts/run-test-lane.mjs smoke` |
| Blocking | 299/299 | `node scripts/run-test-lane.mjs blocking` |
| Release/package | 252/252 | `node scripts/run-test-lane.mjs release` |
| New bug regressions | 34/34 | `Four new regression files listed below` |
| Selected account/sync regression | 785/787 | `72 files listed below` |

The smoke, blocking and release lanes now pass. Repairs classify previously unowned files, preserve seven relocated proof documents under `docs/audit`, correct source-extraction fixtures and obsolete contracts, and retain the distinction between lexical inventories and semantic/security proof. Independent review restored actual release-note Check/Ack/install/update behavior tests and malformed-record negative cases. No failure was converted into installed-device or security-completion evidence.

All three local 3.4.1 browser packages build. The package tests compare every ZIP entry with staged files and current source, compare manifests semantically, and reject duplicate/path errors. JSON duplicate-key validation (142files), UI catalog structure and release-note locale validation pass; catalog validity does not certify complete translation quality. The only production build-script change corrects a misleading success message when resuming an existing release: existing visibility stays unchanged, and no publication is claimed. The real workflow is tested with a stubbed GitHub command boundary; no release command was executed against GitHub.

### Native boundary remains open

The two remaining selected account/sync failures are in `managed-app-policy-contract-parity-current-behavior.test.mjs`. One expects an older Activity time-budget call chain, while the external app now delegates to `ManagedAppTimeBudgetSession`. The other detects stale native mirrors. Five of six checked managed helper mirrors differ from extension sources; all six extension helper sources are byte-identical to their task-start versions at `920ec56b`. These are separate downstream integration gates, not failures introduced by the three issue fixes. The native repository and existing TV emulator were not changed. The failing checks remain visible; their assertions were not suppressed or relabeled as passing.

### Repeatable focused commands

```sh
node --test tests/runtime/category-pending-lifetime.test.mjs tests/runtime/category-pending-dom-pipeline.test.mjs tests/runtime/json-comment-explicit-keyword-scope-current-behavior.test.mjs tests/runtime/watch-selected-playlist-row-admission.test.mjs
node scripts/check-json-keys.cjs
node scripts/check-ui-locales.mjs
node scripts/check-release-note-locales.mjs
node build.js
```

Local logs are in `/tmp/filtertube-release-2026-10-18/`; the reporter's rules remain transient and are not committed. Historical source inventories remain historical; current source reviews do not promote missing security, semantic or physical-device proof.

<details>
<summary>Selected account/sync regression file list (72 files)</summary>

```text
tests/runtime/account-sync-initial-navigation-current-behavior.test.mjs
tests/runtime/family-device-child-receive-copy-current-behavior.test.mjs
tests/runtime/family-device-explicit-mode-transition-current-behavior.test.mjs
tests/runtime/family-device-live-saved-coalescing-current-behavior.test.mjs
tests/runtime/family-device-multiple-recipient-focus-current-behavior.test.mjs
tests/runtime/family-device-navigation-current-behavior.test.mjs
tests/runtime/family-device-personal-pairing-current-behavior.test.mjs
tests/runtime/family-device-picker-actions-current-behavior.test.mjs
tests/runtime/family-device-receiver-setup-guide-current-behavior.test.mjs
tests/runtime/family-device-selection-preview-current-behavior.test.mjs
tests/runtime/family-device-session-labels-current-behavior.test.mjs
tests/runtime/family-device-tile-feedback-current-behavior.test.mjs
tests/runtime/family-device-transfer-summary-current-behavior.test.mjs
tests/runtime/managed-admin-authority-helper-current-behavior.test.mjs
tests/runtime/managed-app-policy-contract-parity-current-behavior.test.mjs
tests/runtime/managed-child-edit-initial-view-current-behavior.test.mjs
tests/runtime/managed-child-edit-save-authorization-current-behavior.test.mjs
tests/runtime/managed-child-local-authority-current-behavior.test.mjs
tests/runtime/managed-child-time-limit-schema-current-behavior.test.mjs
tests/runtime/managed-controls-extension-mvp-handoff-current-behavior.test.mjs
tests/runtime/managed-delivery-provider-reference-current-behavior.test.mjs
tests/runtime/managed-delivery-receipt-identity-roundtrip-current-behavior.test.mjs
tests/runtime/managed-device-picker-delivery-current-behavior.test.mjs
tests/runtime/managed-filter-save-feedback-current-behavior.test.mjs
tests/runtime/managed-lan-discovery-lifecycle.test.mjs
tests/runtime/managed-link-modal-disclosure-current-behavior.test.mjs
tests/runtime/managed-local-network-provider-current-behavior.test.mjs
tests/runtime/managed-locked-child-revision-gate-current-behavior.test.mjs
tests/runtime/managed-nanah-live-signed-send-current-behavior.test.mjs
tests/runtime/managed-nanah-open-sync-current-behavior.test.mjs
tests/runtime/managed-nanah-pairing-key-descriptor-current-behavior.test.mjs
tests/runtime/managed-nanah-signing-keypair-current-behavior.test.mjs
tests/runtime/managed-overlays-localization-current-behavior.test.mjs
tests/runtime/managed-parent-render-regression.test.mjs
tests/runtime/managed-parent-ui-surface-current-behavior.test.mjs
tests/runtime/managed-picker-actor-freshness-current-behavior.test.mjs
tests/runtime/managed-pickup-provider-ownership-gate-current-behavior.test.mjs
tests/runtime/managed-pickup-provider-ownership-generator-current-behavior.test.mjs
tests/runtime/managed-policy-action-history-model-current-behavior.test.mjs
tests/runtime/managed-policy-apply-current-behavior.test.mjs
tests/runtime/managed-policy-encrypted-mailbox-protocol-current-behavior.test.mjs
tests/runtime/managed-policy-schema-revision-contract-current-behavior.test.mjs
tests/runtime/managed-policy-source-snapshot-current-behavior.test.mjs
tests/runtime/managed-policy-sync-remote-delivery-readiness-gate-current-behavior.test.mjs
tests/runtime/managed-policy-trust-freshness-current-behavior.test.mjs
tests/runtime/managed-receipt-identity-current-behavior.test.mjs
tests/runtime/managed-receiver-parent-namespace-current-behavior.test.mjs
tests/runtime/managed-remote-transport-app-parity-gate-current-behavior.test.mjs
tests/runtime/managed-saved-link-storage-journey-current-behavior.test.mjs
tests/runtime/managed-time-budget-enforcement-current-behavior.test.mjs
tests/runtime/managed-transport-provider-clients-current-behavior.test.mjs
tests/runtime/managed-trust-revocation-cleanup-current-behavior.test.mjs
tests/runtime/managed-validation-fresh-trust-context-current-behavior.test.mjs
tests/runtime/managed-viewing-space-route-gate-current-behavior.test.mjs
tests/runtime/nanah-child-receiver-session-copy-current-behavior.test.mjs
tests/runtime/nanah-device-identity-persistence-current-behavior.test.mjs
tests/runtime/nanah-device-policy-source-current-behavior.test.mjs
tests/runtime/nanah-device-receipt-feedback-current-behavior.test.mjs
tests/runtime/nanah-first-managed-source-current-behavior.test.mjs
tests/runtime/nanah-first-update-parent-authorization-current-behavior.test.mjs
tests/runtime/nanah-host-relay-readiness-current-behavior.test.mjs
tests/runtime/nanah-live-receipt-concurrency-current-behavior.test.mjs
tests/runtime/nanah-live-send-ui-callers-current-behavior.test.mjs
tests/runtime/nanah-managed-shared-link-handshake-current-behavior.test.mjs
tests/runtime/nanah-qr-scanner-current-behavior.test.mjs
tests/runtime/nanah-storage-lock-current-behavior.test.mjs
tests/runtime/nanah-trusted-backup-multiple-profile-current-behavior.test.mjs
tests/runtime/nanah-trusted-link-persistence-current-behavior.test.mjs
tests/runtime/profile-control-fresh-authorization-current-behavior.test.mjs
tests/runtime/profile-maintenance-authorization-current-behavior.test.mjs
tests/runtime/profile-options-render-current-behavior.test.mjs
tests/runtime/profile-pin-row-save-authorization-current-behavior.test.mjs
```

</details>
