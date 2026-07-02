# FilterTube Managed Controls Extension MVP Handoff

**Date**: 2026-06-21
**Scope**: Extension-owned managed parent/caregiver controls, local P2P,
optional configured pickup-provider clients, rule-list imports, time limits, and release
handoff boundaries.
**Runtime behavior changed**: no.

## Status

The extension-side MVP is implemented for the current extension release
boundary and is ready for installed-extension smoke and release-readiness
review. The full product goal is not complete until the manual/provider
transport and downstream app lanes below are proven.

Current state:

```text
extension policy authority: implemented
parent/caregiver Family Controls UI: implemented
live Nanah Send Update: implemented for eligible connected verified devices
Internet Pickup/Home Pickup clients: implemented behind explicit provider setup
Home Pickup visible readiness Check: required by release smoke artifact
reference provider: implemented as self-hosted proof only
automatic LAN peer discovery: not implemented
hosted Internet Pickup service: not owned/deployed in this repo
native Android/iOS parity: downstream lane
native runtime sync handoff: extension-side artifact required before app-side sync commit
manual installed-extension smoke: still required before release claim
```

## 2026-06-26 Checkpoint

The extension work is now in final verification territory rather than large
feature construction. The parent-facing copy has been cleaned up to use
`protected profile`/`protected device` consistently while internal `child`
profile type keys remain unchanged for storage and migration compatibility.

Remaining release blockers are concrete:

```text
installed-extension parent/protected-device smoke: still required
real Internet Pickup provider ownership/deployment: not proven
automatic LAN peer discovery: intentionally absent
native Android/iOS parity: downstream app lane
liquid-glass/device-map visual polish: optional future UI lane
```

The extension can be described as having local protected-profile controls,
signed live Send Update, explicit optional pickup-provider clients, rule-list
imports, time limits, route gates, timeout overlay, and protected redacted
history. It still must not be described as a fully hosted remote-management
service, an automatic LAN discovery system, or complete mobile/tablet parity.

## Requirement Matrix

| Requirement | Current extension evidence | Release status |
| --- | --- | --- |
| Parent/account manages protected profiles locally | Family Controls can edit rules, Main/Kids access, time limits, and history for manageable protected profiles after parent/account re-auth. | Extension implemented; needs installed smoke. |
| Protected profile cannot become admin | Protected-profile surfaces are receive-only for device updates, cannot change profile policy, and global admin handlers reject protected-edit bypasses. | Extension implemented; needs installed smoke. |
| Sibling profiles cannot mutate each other | Profile management remains scoped by `canActiveProfileManageProfile(...)` and parent/account unlock checks. | Extension implemented; needs installed smoke. |
| Remote videos/keywords/channels use validated rule paths | Signed managed-policy envelopes cover keyword, channel, video, rule bundle, and active/full profile-policy sends; list imports materialize into ordinary profile rule rows first. | Extension implemented; needs installed two-device smoke. |
| Protected devices keep last valid policy offline | Receive paths reject unavailable/untrusted/stale candidates without deleting last accepted policy. | Extension implemented; needs installed smoke. |
| Later delivery without plaintext rules | Internet Pickup stores ciphertext mailbox items through explicit configured provider clients; reference provider rejects plaintext policy fields. | Hook/reference proof implemented; hosted service not owned. |
| Same-network delivery | Home Pickup can publish/discover/ack signed candidates through an explicit configured provider and local validation gate. Final smoke must record the visible Home Pickup Check action, redacted readiness result, and no authority from network reachability. | Hook/reference proof implemented; automatic peer discovery absent. |
| Main/Kids access enforcement | Managed viewing-space route gate exists for active protected profiles. | Extension implemented; needs installed smoke. |
| Daily YouTube time limits | Background-owned time budget, protected timeout overlay, parent extra-time grants, and signed time-limit sends exist. | Extension implemented; needs installed smoke. |
| Protected action history | Local edits, remote apply/reject, provider setup, send attempts, failed unlocks, and receipt rows are redacted and parent-accessible. | Extension implemented; needs installed smoke. |
| App parity contract | Managed app policy contract and verifier define fields apps must preserve. | Contract implemented; native app execution remains downstream. |
| Native runtime sync handoff | `npm run sync:native-runtime` can mirror extension runtime into the downstream app repo, then `npm run managed:native-handoff -- --confirm-sync-command-passed` records the contract hash and generated file manifest without claiming native enforcement. | Extension handoff generator/gate implemented; app repo commit and installed app smoke remain downstream. |
| No-policy/no-work performance | Optional pickup checks are dashboard/profile/open visibility gated, not YouTube-page hot-path polling. | Extension implemented; keep release no-work smoke. |

## What Can Be Claimed Now

- Parents/caregivers can create and manage protected profiles locally.
- Protected profiles can be limited to Main YouTube, YouTube Kids, or both.
- Protected profiles can receive daily YouTube time budgets and extra-time grants.
- Rule-list imports can add parent-approved channel/keyword rules after preview.
- Verified devices can receive signed updates through live Nanah when both devices
  are open and connected.
- Internet Pickup and Home Pickup are optional configured delivery paths.
- Delivery paths are never policy authority; local trusted-link, target-profile,
  scope, revision, hash, device binding, and signature checks decide apply/reject.

## What Must Not Be Claimed Yet

- Automatic LAN device discovery.
- Wi-Fi presence as authority.
- Hosted FilterTube Internet Pickup service availability.
- Guaranteed later delivery when no provider is configured.
- Complete Android/iOS parity.
- Release-ready cross-device managed controls without installed two-device smoke.

## Remaining Lanes

### Release Smoke Lane

Before release, run the installed extension against a real Chrome profile:

```text
1. Create protected profile.
2. Set Main/Kids access.
3. Set a daily YouTube time limit.
4. Import a small rule list and apply to Main, Kids, and both in separate passes.
5. Pair a second verified device/profile.
6. Send keyword/channel/video/viewing-space/time-limit updates over live Nanah.
7. If Home Pickup is configured, click the visible Check action and record the
   redacted readiness result before sending through that provider.
8. Confirm accepted/rejected protected history rows.
9. Confirm denied Main/Kids surface shows the route gate.
10. Confirm exhausted time shows the timeout overlay and records a request.
11. Confirm empty/no-policy YouTube remains snappy after SPA navigation.
```

Use `docs/audit/artifacts/managed-extension-installed-smoke/observation-template.json`
as the fillable redacted input, then generate the executed artifact with:

```bash
npm run managed:extension-smoke -- --input <redacted-observation.json> --confirm-manual-smoke-passed
```

### Provider Lane

The extension has explicit provider clients and a reference provider, but a real
family/school deployment still needs ownership:

```text
Provider ownership gate
  -> docs/audit/FILTERTUBE_MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_2026-06-21.md
  -> docs/audit/artifacts/managed-pickup-provider-ownership/template.json
  -> docs/audit/artifacts/managed-pickup-provider-ownership/observation-template.json
  -> docs/audit/artifacts/managed-pickup-provider-ownership/verify-provider-ownership-artifact.mjs
```

```text
Internet Pickup service
  -> HTTPS endpoint
  -> durable encrypted item queue
  -> redacted receipt queue
  -> purge/revocation behavior
  -> installed two-device proof

Home Pickup service
  -> explicit same-network endpoint
  -> visible parent Check action and redacted health result
  -> signed candidate queue
  -> redacted receipt queue
  -> no automatic LAN scan
  -> installed two-device proof
```

### App Lane

Downstream apps must preserve the extension-owned contract and prove native
enforcement:

```text
Extension handoff first
  -> docs/audit/artifacts/managed-native-runtime-sync-handoff/template.json
  -> docs/audit/artifacts/managed-native-runtime-sync-handoff/verify-native-runtime-sync-handoff-artifact.mjs
  -> records contract hash, sync command, generated manifest, and no native claim
```

```text
Android
  -> settings locks
  -> Main/Kids route gate
  -> time-budget startup/resume/heartbeat/pause
  -> native timeout UI
  -> managed rule-list source metadata
  -> protected history access boundary

iOS
  -> same parity set as Android
```

Use `docs/audit/artifacts/managed-app-parity-smoke/observation-template.json`
as the fillable redacted input for each installed Android or iOS app parity
smoke. One executed artifact proves one platform only.

## Release Decision

Treat the extension repo as ready for a final installed-extension smoke pass, not
as fully complete cross-platform remote management. If the installed extension
smoke passes, the release copy can describe the extension MVP and optional
configured pickup paths. Hosted pickup and app parity should stay documented as
separate lanes until their own artifacts pass.
