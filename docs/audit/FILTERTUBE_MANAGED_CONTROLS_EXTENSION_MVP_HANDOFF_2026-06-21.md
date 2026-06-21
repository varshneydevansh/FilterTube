# FilterTube Managed Controls Extension MVP Handoff

**Date**: 2026-06-21
**Scope**: Extension-owned managed parent/caregiver controls, local P2P,
optional pickup-provider hooks, rule-list imports, time limits, and release
handoff boundaries.
**Runtime behavior changed**: no.

## Status

The extension-side MVP is implemented far enough for installed-extension smoke
and release-readiness review, but the full goal is not complete until the
manual/provided transport and downstream app lanes below are proven.

Current state:

```text
extension policy authority: implemented
parent/caregiver Family Controls UI: implemented
live Nanah Send Update: implemented for eligible connected verified devices
Internet Pickup/Home Pickup hooks: implemented behind explicit provider setup
reference provider: implemented as self-hosted proof only
automatic LAN peer discovery: not implemented
hosted Internet Pickup service: not owned/deployed in this repo
native Android/iOS parity: downstream lane
manual installed-extension smoke: still required before release claim
```

## Requirement Matrix

| Requirement | Current extension evidence | Release status |
| --- | --- | --- |
| Parent/account manages protected profiles locally | Family Controls can edit rules, Main/Kids access, time limits, and history for manageable protected profiles after parent/account re-auth. | Extension implemented; needs installed smoke. |
| Protected profile cannot become admin | Protected-profile surfaces are receive-only for device updates, cannot change profile policy, and global admin handlers reject protected-edit bypasses. | Extension implemented; needs installed smoke. |
| Sibling profiles cannot mutate each other | Profile management remains scoped by `canActiveProfileManageProfile(...)` and parent/account unlock checks. | Extension implemented; needs installed smoke. |
| Remote videos/keywords/channels use validated rule paths | Signed managed-policy envelopes cover keyword, channel, video, rule bundle, and active/full profile-policy sends; list imports materialize into ordinary profile rule rows first. | Extension implemented; needs installed two-device smoke. |
| Protected devices keep last valid policy offline | Receive paths reject unavailable/untrusted/stale candidates without deleting last accepted policy. | Extension implemented; needs installed smoke. |
| Later delivery without plaintext rules | Internet Pickup stores ciphertext mailbox items through explicit configured provider clients; reference provider rejects plaintext policy fields. | Hook/reference proof implemented; hosted service not owned. |
| Same-network delivery | Home Pickup can publish/discover/ack signed candidates through an explicit configured provider and local validation gate. | Hook/reference proof implemented; automatic peer discovery absent. |
| Main/Kids access enforcement | Managed viewing-space route gate exists for active protected profiles. | Extension implemented; needs installed smoke. |
| Daily YouTube time limits | Background-owned time budget, protected timeout overlay, parent extra-time grants, and signed time-limit sends exist. | Extension implemented; needs installed smoke. |
| Protected action history | Local edits, remote apply/reject, provider setup, send attempts, failed unlocks, and receipt rows are redacted and parent-accessible. | Extension implemented; needs installed smoke. |
| App parity contract | Managed app policy contract and verifier define fields apps must preserve. | Contract implemented; native app execution remains downstream. |
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
7. Confirm accepted/rejected protected history rows.
8. Confirm denied Main/Kids surface shows the route gate.
9. Confirm exhausted time shows the timeout overlay and records a request.
10. Confirm empty/no-policy YouTube remains snappy after SPA navigation.
```

### Provider Lane

The extension has explicit provider clients and a reference provider, but a real
family/school deployment still needs ownership:

```text
Internet Pickup service
  -> HTTPS endpoint
  -> durable encrypted item queue
  -> redacted receipt queue
  -> purge/revocation behavior
  -> installed two-device proof

Home Pickup service
  -> explicit same-network endpoint
  -> health check
  -> signed candidate queue
  -> redacted receipt queue
  -> no automatic LAN scan
  -> installed two-device proof
```

### App Lane

Downstream apps must preserve the extension-owned contract and prove native
enforcement:

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

## Release Decision

Treat the extension repo as ready for a final installed-extension smoke pass, not
as fully complete cross-platform remote management. If the installed extension
smoke passes, the release copy can describe the extension MVP and optional
configured pickup paths. Hosted pickup and app parity should stay documented as
separate lanes until their own artifacts pass.
