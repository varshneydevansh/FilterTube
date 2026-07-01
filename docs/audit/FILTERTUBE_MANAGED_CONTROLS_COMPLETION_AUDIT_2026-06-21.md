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
| Extension and apps share one policy contract without forking authority. | EXTENSION-PRESENT plus DOWNSTREAM-PENDING | `docs/audit/artifacts/managed-app-policy-contract-v1.json`; `docs/audit/FILTERTUBE_MANAGED_APP_POLICY_CONTRACT_PARITY_2026-06-04.md`; `scripts/verify-managed-app-policy-contract.mjs`; `scripts/create-managed-native-runtime-sync-handoff.mjs`; `scripts/create-managed-app-parity-smoke-artifact.mjs`; `docs/audit/artifacts/managed-native-runtime-sync-handoff/template.json`; `tests/runtime/managed-native-runtime-sync-handoff-current-behavior.test.mjs`; `tests/runtime/managed-native-runtime-sync-handoff-generator-current-behavior.test.mjs`; `tests/runtime/managed-app-parity-smoke-artifact-generator-current-behavior.test.mjs`; `tests/runtime/managed-app-policy-contract-parity-current-behavior.test.mjs`. | Execute `npm run sync:native-runtime`, then `npm run managed:native-handoff -- --confirm-sync-command-passed`, then execute Android/iOS app parity smoke artifacts through `npm run managed:app-parity-smoke -- --input <redacted-app-smoke.json> --confirm-installed-app-smoke-passed`. |
| Family Device Updates UI uses one parent-facing model for Send Update, Home Pickup, Internet Pickup, and offline last-valid-policy state. | EXTENSION-PRESENT plus DOWNSTREAM-PENDING | `html/tab-view.html`; `js/managed_parent_command_center.js`; `css/serene-shell.css`; `docs/audit/artifacts/managed-app-parity-smoke/template.json`; `scripts/create-managed-app-parity-smoke-artifact.mjs`; `tests/runtime/managed-app-parity-smoke-artifact-verifier-current-behavior.test.mjs`; `tests/runtime/managed-app-parity-smoke-artifact-generator-current-behavior.test.mjs`. | Manual installed-extension UI smoke and installed app parity smoke. |
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

## 2026-06-26 Remaining Work Check

The remaining work is no longer a vague feature backlog. Current evidence shows
the extension-side managed-control implementation is mostly present, but the
whole goal still cannot be closed because these proof gaps remain:

| Gap | Why it remains open | Required close-out evidence |
| --- | --- | --- |
| Installed extension parent/protected-device smoke | Runtime tests prove contracts, but not a real Chrome parent/protected profile flow. | Generated `managed-extension-installed-smoke` artifact with redacted screenshots/observations and verifier pass. |
| Real Internet Pickup ownership/deployment | The extension has provider hooks and a reference provider, but no hosted FilterTube provider claim is proven. | `managed-pickup-provider-ownership` artifact with endpoint, operator, retention, purge/revocation, redacted receipt, and round-trip proof. |
| Automatic LAN peer discovery | Explicit Home Pickup provider hooks exist; automatic same-network discovery remains intentionally absent so Wi-Fi presence never becomes authority. | Future provider/app design and hostile-LAN smoke before any discovery claim. |
| Native Android/iOS parity | The extension policy contract and handoff generator exist, but downstream runtime/app enforcement is not proven here. | Native runtime sync handoff artifact plus installed Android/iOS parity smoke artifacts. |
| Final public release wording | Public claims must follow the evidence after smoke/provider/app artifacts. | Release wording review that avoids hosted-service, automatic-discovery, and complete-app-parity claims until proven. |

This checkpoint does not change runtime behavior. It narrows the remaining
release decision to manual smoke, provider ownership, downstream app parity, and
claim review.

## 2026-07-02 Parent-First UX Check

Parent-facing copy and Help onboarding were simplified after user feedback that
FilterTube worked, but the dashboard/docs felt too technical for parents. The
focused evidence is now tracked in:

- `docs/audit/FILTERTUBE_PARENT_FIRST_HELP_AND_CONTROL_SURFACE_SIMPLIFICATION_2026-07-02.md`

This changes copy, Help structure, and shared keyword-toggle help text only. It
does not close hosted Internet Pickup ownership, automatic LAN discovery, native
Android/iOS parity, or installed two-device smoke gaps.

## 2026-06-26 Pickup Runtime Update

The extension-owned Home Pickup and Internet Pickup provider path now has the
remaining local queue behavior expected for later managed updates:

- acknowledged Internet Pickup mailbox items are removed from the waiting queue
  while their redacted receipts remain available to the parent/source device
- acknowledged Home Pickup candidates are removed from the waiting queue while
  their redacted receipts remain available to the parent/source device
- parent/source sends silently refresh provider health so Accounts & Sync shows
  current waiting-update counts after saving an update
- protected-device receives silently refresh provider health so Accounts & Sync
  does not keep stale waiting-update counts after pickup
- source-side receipt checks normalize provider receipt rows into the managed
  ack-envelope shape before recording them, then purge only successfully
  recorded receipt rows from the provider

This still does not prove or claim a hosted FilterTube Internet Pickup service,
automatic LAN peer discovery, or downstream Android/iOS parity.

## 2026-06-26 Extension-Owned Local/Internet Sync Close-Out

The extension-owned device-sync feature work for local intranet and
user-owned internet pickup is now closed for the current release boundary:

- live `Send Update` remains the default parent/caregiver path when both
  verified devices are open together
- `Internet Pickup` can use an explicitly configured trusted HTTPS pickup
  address for verified protected devices that open later or away
- `Home Pickup` can use an explicitly configured same-network pickup address
  for verified protected devices on a home, clinic, or school network
- protected profiles with `syncOnProfileOpen` check configured pickup paths
  when Accounts & Sync opens, when the dashboard becomes visible again, and
  after profile switch
- parent/source devices can check redacted delivery receipts from configured
  pickup paths
- provider health/status, waiting-update counts, receipt counts, purge, expiry,
  token access, and browser-safe status confirmation are implemented in the
  self-hosted reference provider path

This close-out does not turn Wi-Fi/network reachability into authority. It also
does not claim a FilterTube-hosted Internet Pickup service, automatic LAN peer
discovery, or downstream native app parity. Those remain deployment/manual/app
lanes, not missing extension implementation in this slice.

## 2026-07-02 Release-Boundary Refresh

The current release boundary is now recorded in
`docs/audit/FILTERTUBE_MANAGED_SYNC_RELEASE_CLOSEOUT_2026-07-02.md`.

This refresh changes no runtime behavior. It clarifies that the extension
release path is complete for explicit configured delivery:

- live `Send Update` when both verified devices are open
- `Internet Pickup` through a parent/admin configured trusted HTTPS pickup
  service
- `Home Pickup` through a parent/admin configured same-network pickup service
- lazy profile-open saved-update checks when `syncOnProfileOpen` is enabled
- source-side receipt checks and redacted provider status feedback

Automatic LAN peer discovery is not a missing extension release item. It remains
future app/provider research because ambient network presence must never become
policy authority. Native Android/iOS parity also remains downstream app work.

## 2026-06-26 Provider Setup Status Update

The self-hosted reference provider now has enough operator-facing setup surface
for local intranet and user-owned internet pickup trials:

- `npm run managed:provider -- --help` prints the Home Pickup and Internet
  Pickup setup model, supported environment variables, and authority boundary
- `GET /filtertube` shows a safe browser status page and still returns a
  read-only JSON status payload to API callers, so a parent/admin can confirm
  the pickup service address before entering it into FilterTube
- the copied setup instructions in Accounts & Sync tell parents/admins to open
  the provider address first and confirm the status response
- README and technical docs now include the self-hosted provider command,
  Home Pickup address shape, Internet HTTPS boundary, persistent-store option,
  and status-page privacy rule
- provider ownership artifacts now require `providerStatusProof`, so
  self-hosted, user-supplied, or hosted pickup claims must show the safe
  status endpoint before release wording can rely on that provider path

This closes the extension-owned self-hosted provider usability gap. It still
does not create hosted FilterTube Internet Pickup, automatic LAN peer discovery,
or native app parity.

## Installed Extension Smoke Artifact

Manual parent/protected-profile smoke is now a strict artifact instead of loose
notes:

- Template: `docs/audit/artifacts/managed-extension-installed-smoke/template.json`
- Fillable observation input:
  `docs/audit/artifacts/managed-extension-installed-smoke/observation-template.json`
- Generator:
  `npm run managed:extension-smoke -- --input <redacted-observation.json> --confirm-manual-smoke-passed`
- Verifier:
  `docs/audit/artifacts/managed-extension-installed-smoke/verify-managed-extension-smoke-artifact.mjs`
- Test:
  `tests/runtime/managed-extension-installed-smoke-artifact-verifier-current-behavior.test.mjs`
  and
  `tests/runtime/managed-extension-installed-smoke-artifact-generator-current-behavior.test.mjs`

This artifact proves only installed extension behavior for one parent/protected
browser smoke. It requires redacted evidence for protected-profile setup, live
Nanah Send Update, route gates, timeout overlay, protected history, no-policy
YouTube SPA responsiveness, quick-block/3-dot menu regression checks, and
provider-status authority boundaries. The generator requires an explicit manual
pass confirmation, redacted recording fields, visible evidence paths, and a
policy revision/hash; it refuses sensitive keys and authority overclaims. It
still does not prove hosted Internet Pickup, automatic LAN discovery, or native
Android/iOS parity.

## Pickup Provider Ownership Artifact

Later-delivery provider ownership is now a separate gate:

- Gate: `docs/audit/FILTERTUBE_MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_2026-06-21.md`
- Template:
  `docs/audit/artifacts/managed-pickup-provider-ownership/template.json`
- Fillable observation input:
  `docs/audit/artifacts/managed-pickup-provider-ownership/observation-template.json`
- Generator:
  `npm run managed:provider-ownership -- --input <redacted-provider-ownership.json> --confirm-provider-ownership-reviewed`
- Verifier:
  `docs/audit/artifacts/managed-pickup-provider-ownership/verify-provider-ownership-artifact.mjs`
- Test:
  `tests/runtime/managed-pickup-provider-ownership-gate-current-behavior.test.mjs`
  `tests/runtime/managed-pickup-provider-ownership-generator-current-behavior.test.mjs`

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
1. Execute the installed-extension parent/protected-device smoke, record the
   redacted observation JSON, generate the artifact with
   `npm run managed:extension-smoke -- --input <redacted-observation.json> --confirm-manual-smoke-passed`,
   and verify it with
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

Installed app parity smoke starts from the fillable redacted input
`docs/audit/artifacts/managed-app-parity-smoke/observation-template.json` and
generates one platform-specific artifact through:

```bash
npm run managed:app-parity-smoke -- --input <redacted-app-smoke.json> --confirm-installed-app-smoke-passed
```

## Verification

```bash
node --test tests/runtime/managed-controls-completion-audit-current-behavior.test.mjs
```
