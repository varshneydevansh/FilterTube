# Audit: Managed Parent/Caregiver Controls Completion State

**Generated**: 2026-06-21
**Status**: Extension-owned managed-control runtime, policy, UI, and proof
lanes are mostly implemented. Whole-goal completion is not proven because
installed two-device smoke, hosted Internet Pickup ownership, automatic
same-network peer discovery, and native Android/iOS parity remain separate
provider/app/manual lanes.
**Runtime behavior changed**: no.
**Goal slice**: Managed parent/caregiver controls, local P2P/local-network
sync, time-limit safety, and downstream app policy parity.

## Purpose

This audit answers whether the active managed-control goal is complete. It does
not redefine the goal around the implemented extension pieces. It maps each
requirement to current evidence and states what is still missing before release
copy can claim complete remote parent/caregiver management across extension and
apps.

## Status Legend

```text
EXTENSION-PRESENT        current extension runtime/UI/proof exists
PARTIAL-PROVIDER         extension hook/client exists; real provider/deployment or smoke remains
DOWNSTREAM-PENDING       downstream Android/iOS app parity remains
MANUAL-SMOKE-PENDING     requires installed real-device/manual proof
NOT-CLAIMED              deliberately blocked from public/release wording
```

## Requirement Matrix

| Requirement | Current status | Evidence | Remaining proof |
| --- | --- | --- | --- |
| Parent/account profiles can manage protected profiles locally. | EXTENSION-PRESENT | `docs/audit/FILTERTUBE_MANAGED_CHILD_LOCAL_AUTHORITY_CONTRACT_2026-06-03.md`; `tests/runtime/managed-child-local-authority-current-behavior.test.mjs`; `js/managed_parent_command_center.js`; `js/tab-view.js`. | Installed-extension parent flow smoke. |
| Protected-user PIN never becomes admin authority; siblings cannot mutate each other. | EXTENSION-PRESENT | `docs/audit/FILTERTUBE_MANAGED_CHILD_LOCAL_AUTHORITY_CONTRACT_2026-06-03.md`; `tests/runtime/managed-admin-authority-helper-current-behavior.test.mjs`; `tests/runtime/managed-child-local-authority-current-behavior.test.mjs`. | Manual profile-switch and protected-history smoke. |
| Admin actions require parent/account PIN/session, TTL, sensitive re-auth, rate limiting, and failed-attempt logging. | EXTENSION-PRESENT | `js/managed_admin_authority.js`; `js/tab-view.js`; `js/background.js`; `tests/runtime/managed-admin-authority-helper-current-behavior.test.mjs`; `tests/runtime/security-pin-lock-authority-current-behavior.test.mjs`. | Installed smoke for failed parent unlock and sensitive re-auth prompts. |
| Trusted parent/caregiver devices can send protected-device policy through Nanah live P2P. | EXTENSION-PRESENT plus MANUAL-SMOKE-PENDING | `docs/audit/FILTERTUBE_NANAH_MANAGED_SIGNING_KEYPAIR_2026-06-04.md`; `docs/audit/FILTERTUBE_NANAH_MANAGED_LIVE_SIGNED_SEND_2026-06-04.md`; `tests/runtime/managed-nanah-live-signed-send-current-behavior.test.mjs`; `docs/audit/artifacts/managed-extension-installed-smoke/template.json`; `docs/audit/artifacts/managed-extension-installed-smoke/verify-managed-extension-smoke-artifact.mjs`. | Execute the installed-extension smoke artifact with real parent/protected browser evidence. |
| Remote management can update keywords, channels, videos, viewing space, and time limits through the same validated rule paths as local controls. | EXTENSION-PRESENT plus MANUAL-SMOKE-PENDING | `docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md`; `tests/runtime/managed-nanah-live-signed-send-current-behavior.test.mjs`; `tests/runtime/managed-policy-schema-revision-contract-current-behavior.test.mjs`. | Installed remote delivery smoke and app parity artifact. |
| Protected devices keep the last valid parent/caregiver policy while offline. | EXTENSION-PRESENT plus MANUAL-SMOKE-PENDING | `docs/audit/FILTERTUBE_NANAH_MANAGED_PULL_ON_OPEN_2026-06-04.md`; `docs/audit/artifacts/managed-remote-delivery-smoke/template.json`; `tests/runtime/managed-policy-sync-remote-delivery-smoke-artifact-verifier-current-behavior.test.mjs`. | Executed managed remote-delivery smoke artifact. |
| Optional encrypted Internet Pickup can deliver later updates without plaintext rules. | PARTIAL-PROVIDER | `docs/audit/FILTERTUBE_MANAGED_POLICY_ENCRYPTED_MAILBOX_PROTOCOL_2026-06-03.md`; `docs/audit/FILTERTUBE_MANAGED_MAILBOX_SOURCE_UPLOAD_HANDOFF_2026-06-05.md`; `docs/audit/FILTERTUBE_NANAH_MANAGED_POLICY_REMOTE_DELIVERY_RELEASE_READINESS_GATE_2026-06-05.md`; `docs/audit/FILTERTUBE_MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_2026-06-21.md`; `scripts/managed-delivery-provider.mjs`. | Execute provider ownership artifact with endpoint deployment, provider smoke, and release wording review before hosted/guaranteed later-delivery claims. |
| Home Pickup can support explicitly configured same-network delivery without making LAN discovery authority. | PARTIAL-PROVIDER | `docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PROVIDER_HOOK_2026-06-05.md`; `docs/audit/FILTERTUBE_LOCAL_NETWORK_DISCOVERY_AUTHORITY_BOUNDARY_2026-06-03.md`; `tests/runtime/managed-local-network-provider-current-behavior.test.mjs`; `tests/runtime/managed-transport-provider-clients-current-behavior.test.mjs`. | Explicit provider smoke. Automatic LAN peer discovery remains app/provider work and NOT-CLAIMED. |
| Local-network discovery is not authority; stale, replayed, revoked, mismatched, spoofed, or untrusted policies are rejected. | EXTENSION-PRESENT | `docs/audit/FILTERTUBE_LOCAL_NETWORK_DISCOVERY_AUTHORITY_BOUNDARY_2026-06-03.md`; `tests/runtime/local-network-discovery-authority-boundary-current-behavior.test.mjs`; `tests/runtime/managed-policy-schema-revision-contract-current-behavior.test.mjs`; `tests/runtime/managed-nanah-open-sync-current-behavior.test.mjs`. | Provider hostile-LAN smoke before any automatic discovery claim. |
| Main YouTube and YouTube Kids access are enforced per protected profile. | EXTENSION-PRESENT plus DOWNSTREAM-PENDING | `docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md`; `tests/runtime/managed-viewing-space-route-gate-current-behavior.test.mjs`; `docs/audit/artifacts/managed-extension-installed-smoke/template.json`; `docs/audit/FILTERTUBE_MANAGED_APP_POLICY_CONTRACT_PARITY_2026-06-04.md`. | Execute installed extension smoke and native Android/iOS route-gate smoke. |
| YouTube time limits are enforced per protected profile. | EXTENSION-PRESENT plus DOWNSTREAM-PENDING | `docs/audit/FILTERTUBE_MANAGED_CHILD_TIME_LIMIT_SCHEMA_CONTRACT_2026-06-03.md`; `tests/runtime/managed-child-time-limit-schema-current-behavior.test.mjs`; `tests/runtime/managed-time-budget-enforcement-current-behavior.test.mjs`; `docs/audit/artifacts/managed-extension-installed-smoke/template.json`. | Execute installed extension timeout smoke and native Android/iOS startup/resume/heartbeat/pause smoke. |
| Timeout surface is visible and protected user cannot bypass it through profile-owned settings. | EXTENSION-PRESENT plus MANUAL-SMOKE-PENDING | `js/content_bridge.js`; `docs/audit/FILTERTUBE_MANAGED_CHILD_TIME_LIMIT_SCHEMA_CONTRACT_2026-06-03.md`; `tests/runtime/managed-time-budget-enforcement-current-behavior.test.mjs`; `docs/audit/artifacts/managed-extension-installed-smoke/verify-managed-extension-smoke-artifact.mjs`. | Execute installed-extension timeout UI smoke. |
| Parent/caregiver action history records accepted/rejected policy changes and is not policy authority. | EXTENSION-PRESENT plus DOWNSTREAM-PENDING | `docs/audit/FILTERTUBE_MANAGED_POLICY_ACTION_HISTORY_MODEL_2026-06-03.md`; `tests/runtime/managed-policy-action-history-model-current-behavior.test.mjs`; `docs/audit/FILTERTUBE_MANAGED_TRANSPORT_APP_PARITY_GATE_2026-06-05.md`. | Installed smoke for parent-only history and app parity history proof. |
| Extension and apps share one policy contract without forking authority. | EXTENSION-PRESENT plus DOWNSTREAM-PENDING | `docs/audit/artifacts/managed-app-policy-contract-v1.json`; `docs/audit/FILTERTUBE_MANAGED_APP_POLICY_CONTRACT_PARITY_2026-06-04.md`; `scripts/verify-managed-app-policy-contract.mjs`; `tests/runtime/managed-app-policy-contract-parity-current-behavior.test.mjs`. | Run native runtime sync and execute Android/iOS app parity smoke artifacts. |
| Family Device Updates UI uses one parent-facing model for Send Update, Home Pickup, Internet Pickup, and offline last-valid-policy state. | EXTENSION-PRESENT plus DOWNSTREAM-PENDING | `html/tab-view.html`; `js/managed_parent_command_center.js`; `css/serene-shell.css`; `docs/audit/artifacts/managed-app-parity-smoke/template.json`; `tests/runtime/managed-app-parity-smoke-artifact-verifier-current-behavior.test.mjs`. | Manual installed-extension UI smoke and installed app parity smoke. |
| No-policy/no-work performance remains intact. | EXTENSION-PRESENT plus MANUAL-SMOKE-PENDING | `docs/audit/FILTERTUBE_NANAH_MANAGED_POLICY_REMOTE_DELIVERY_RELEASE_READINESS_GATE_2026-06-05.md`; `docs/audit/artifacts/managed-extension-installed-smoke/template.json`; `docs/audit/artifacts/managed-remote-delivery-smoke/template.json`; `tests/runtime/managed-app-parity-smoke-artifact-verifier-current-behavior.test.mjs`. | Execute installed extension smoke with no providers/rules and SPA navigation. |
| Public docs must not overclaim control outside extension/app-owned surfaces. | EXTENSION-PRESENT | `docs/audit/FILTERTUBE_MANAGED_TRANSPORT_APP_PARITY_GATE_2026-06-05.md`; `tests/runtime/managed-remote-transport-app-parity-gate-current-behavior.test.mjs`. | Final release wording review after provider/app smoke. |

## Current Completion Verdict

```text
extension local protected-profile controls: EXTENSION-PRESENT
extension live Nanah signed send: EXTENSION-PRESENT, MANUAL-SMOKE-PENDING
extension provider-gated Internet Pickup/Home Pickup clients: PARTIAL-PROVIDER
hosted Internet Pickup service ownership/deployment: NOT-CLAIMED
automatic same-network peer discovery: NOT-CLAIMED, DOWNSTREAM-PENDING
native Android/iOS settings lock and time-limit parity: DOWNSTREAM-PENDING
installed two-device extension smoke: MANUAL-SMOKE-PENDING
whole goal complete: NO
```

## Installed Extension Smoke Artifact

Manual parent/protected-profile smoke is now a strict artifact instead of loose
notes:

- Template: `docs/audit/artifacts/managed-extension-installed-smoke/template.json`
- Verifier:
  `docs/audit/artifacts/managed-extension-installed-smoke/verify-managed-extension-smoke-artifact.mjs`
- Test:
  `tests/runtime/managed-extension-installed-smoke-artifact-verifier-current-behavior.test.mjs`

This artifact proves only installed extension behavior for one parent/protected
browser smoke. It requires redacted evidence for protected-profile setup, live
Nanah Send Update, route gates, timeout overlay, protected history, no-policy
YouTube SPA responsiveness, quick-block/3-dot menu regression checks, and
provider-status authority boundaries. It still does not prove hosted Internet
Pickup, automatic LAN discovery, or native Android/iOS parity.

## Pickup Provider Ownership Artifact

Later-delivery provider ownership is now a separate gate:

- Gate: `docs/audit/FILTERTUBE_MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_2026-06-21.md`
- Template:
  `docs/audit/artifacts/managed-pickup-provider-ownership/template.json`
- Verifier:
  `docs/audit/artifacts/managed-pickup-provider-ownership/verify-provider-ownership-artifact.mjs`
- Test:
  `tests/runtime/managed-pickup-provider-ownership-gate-current-behavior.test.mjs`

This artifact records whether pickup is reference-only, user-supplied, or
FilterTube-hosted. Guaranteed later-delivery wording remains blocked unless a
FilterTube-hosted provider has endpoint, deployment, health, CORS, retention,
purge/revocation, redacted ack, and round-trip smoke proof. Provider
reachability still never becomes policy authority.

## Safe Release Wording

- FilterTube extension has protected-profile management, time limits, viewing
  space gates, signed live Send Update, optional configured pickup hooks, and
  redacted history.
- Internet Pickup and Home Pickup are optional delivery paths for verified
  devices and compatible providers.
- A protected device keeps the last accepted policy if no newer valid update is
  available.

## Blocked Release Wording

- Complete remote management across extension and mobile apps.
- Automatic Wi-Fi/LAN device discovery.
- Guaranteed later delivery without a configured Internet Pickup/Home Pickup
  provider.
- Hosted FilterTube cloud pickup service.
- Native Android/iOS parity without installed smoke artifacts.
- Provider, mailbox, LAN, URL list, or discovery layer as policy authority.

## Next Required Proof

```text
1. Execute `docs/audit/artifacts/managed-extension-installed-smoke/template.json`
   against the installed extension and verify it with
   `docs/audit/artifacts/managed-extension-installed-smoke/verify-managed-extension-smoke-artifact.mjs`.
2. Manual installed-extension smoke for timeout overlay and Main/Kids route gate
   is covered by the artifact rows `FT-MANAGED-EXT-08-main-kids-route-gate` and
   `FT-MANAGED-EXT-09-timeout-overlay`.
3. Managed remote-delivery smoke artifact using live Send Update and one configured provider path.
4. Execute the provider ownership artifact before any hosted Internet Pickup or
   guaranteed later-delivery claim.
5. Native Android/iOS runtime sync and app parity smoke.
6. Future provider/app design for automatic same-network discovery, if still desired.
```

## Verification

```bash
node --test tests/runtime/managed-controls-completion-audit-current-behavior.test.mjs
```
