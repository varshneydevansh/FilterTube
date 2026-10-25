# Nanah Managed Link QA

## Current acceptance status — 26 October 2026

This is a checklist, not a completed test report. Automated controlled-peer and
isolated WebRTC checks exist; two installed Chrome profiles have not completed
pairing/Auto-sync acceptance. Reloading both extensions does not close this gate.
Record sender and receiver build, exact source/target profiles, transport, stored
receiver values, receipts and observed permission failures for each scenario.
Use disposable test profiles and harmless notes/rules.

The original five manual-link tests remain regression coverage. The Auto-sync
scenarios below are additional gates. Native/TV acceptance is separate.

## Purpose

This checklist covers the current high-risk Nanah flows in FilterTube after the managed-link pass.

Use it before shipping changes to:

- parent/source -> replica/kids behavior
- first-time managed-link approval
- trusted managed-link editing
- PIN-protected send/apply
- reconnect behavior after trust exists

## Preconditions

- reload the unpacked extension in every browser under test
- open the `Accounts & Sync` page on both devices
- verify both devices are on the same current build
- clear stale trusted links only if the scenario explicitly needs a first-time run

## Test 1: Parent source -> replica with `kids` + `replace`

### Setup

- Device A role: `Source / Parent`
- Device B role: `Replica / Kids device`
- Scope on A: `kids`
- Apply mode on A: `replace`
- no existing trusted link

### Expected

- pair and verify SAS successfully
- first send on A opens the dedicated first-time managed approval sheet on B
- B can choose:
  - `Apply Once`
  - `Apply + Save Parent Control`
  - `Decline`
- if B saves the link:
  - `kids` remains included in `allowedScopes`
  - `defaultScope` can be reviewed
  - `replace` is visible as the managed policy
- after apply, Kids rules on B match the incoming snapshot

## Test 2: Parent source -> replica with `active` + `merge`

### Setup

- Device A role: `Source / Parent`
- Device B role: `Replica / Kids device`
- Scope on A: `active`
- Apply mode on A: `merge`

### Expected

- first-time managed approval on B shows `active` as the currently required scope
- if B chooses `Apply Once`, no trusted link is saved
- if B chooses `Apply + Save Parent Control`, the saved managed link shows:
  - allowed scopes
  - default scope
  - apply mode
  - auto-apply on/off
- after apply, the receiver's current active profile is updated without switching the active profile ID

## Test 3: Locked profile send/apply

### Send side

- lock the active profile on the sending device
- attempt Nanah send

### Expected

- sender must unlock locally before export/send continues
- no PIN value is sent over Nanah

### Receive side

- lock the active profile on the receiving device
- accept an incoming proposal

### Expected

- receiver must unlock locally before apply continues
- for `full`, receiver must still satisfy stricter master/default rules

## Test 4: Trusted managed link with auto-apply off/on

### Auto-apply off

- save a managed link with auto-apply disabled
- reconnect and send a matching allowed scope

### Expected

- receiver still sees a managed approval prompt
- prompt describes the saved managed policy
- receiver does not get generic peer merge/replace choices

### Auto-apply on

- edit the same managed link and enable auto-apply
- reconnect and send the same matching allowed scope

### Expected

- receiver applies automatically
- receiver shows success feedback for trusted source apply
- no extra review prompt appears

## Test 5: Reconnect behavior after trusted managed link exists

### Setup

- save a managed link on both devices
- end the session
- start a new pairing session with the same devices

### Expected

- after reconnect and hello exchange, the trusted link is recognized again
- trusted-device card still shows:
  - direction
  - allowed scopes
  - default scope
  - apply mode
  - auto-apply state
- sender cannot push a scope that is outside `allowedScopes`
- receiver blocks mismatched managed scope proposals if they arrive anyway

## Regression checks

- peer <-> peer still uses receiver-chosen merge/replace
- untrusted source/replica still remains receiver-reviewed
- `full` still requires `Default` profile context
- legacy one-time `main`, `kids`, and `active` proposals honor the reviewed receiver profile; managed fixed targets and personal Auto-sync must not fall back to an unrelated active profile
- Help page still explains managed-link behavior clearly

## Ship gate

Treat Nanah managed-link changes as ready only if:

1. all five manual-link tests and the applicable Auto-sync scenarios below pass on installed endpoints
2. no stale trusted-link data causes contradictory UI
3. no send/apply path bypasses local unlock requirements
4. no managed link can be saved without the currently approved incoming scope remaining allowed

## Post-v3.3.5 target-binding regression (2026-08-23)

The managed-policy hardening commits add a target check that must be exercised
in addition to the original link tests:

1. Create two protected profiles on the receiver and save a managed link for
   only the first profile/device target.
2. Send a live update, then queue a mailbox/Home/Internet Pickup update while
   the receiver is offline.
3. Open the receiver with the second profile active and attempt to collect or
   apply the pending update.

Expected:

- the pending envelope is not offered to the wrong target device or profile;
- the receiver records a rejected target mismatch rather than silently
  applying it;
- a valid newer revision for the original target records native runtime
  synchronization and a receipt;
- nearby discovery alone cannot make the mismatched update eligible.

This covers the target-device, keyed-profile, mailbox, and Pickup bindings from
the July 21 managed-policy commits. It still requires two installed devices;
source tests or a provider status response are not a substitute for this
smoke test.

## Auto-sync acceptance additions

For each row, inspect stored receiver contents as well as visible status. Queue or
send success must not be reported as Applied before persistence is verified.

| Scenario | Required observation | Installed result |
| --- | --- | --- |
| Initial state | No automatic enrollment from saving trust; Auto-sync starts off. | Not run |
| Parent opt-in | Fresh parent authorization; explicit local-rules child → fixed remote child/device; approved scopes only. Receiver permission is unchanged by sender opt-in. | Not run |
| Parent changes | Main/Kids rule additions/removals and both mode directions; approved viewing/time-policy changes; siblings/PINs/ownership unchanged. | Not run |
| Receiver readiness | No automatic managed dispatch before exact current-session readiness/auto-apply permission. Strict reconnect approval remains required. | Not run |
| Personal consent | Active unlocked adult/account profiles, both exact reciprocal approvals, selected settings/rules/Notes areas only. Legacy clients cannot silently enroll. | Not run |
| Settings | Supported toggle, channel and keyword changes persist on the receiver; exclusions and unrelated profiles remain local. | Not run |
| Notes | Exact profile/video save, reverse edit, Unicode/timestamp text and deletion; drafts/writer credentials do not transfer. | Not run |
| Concurrent edits | Settings require review; stale decisions cannot overwrite newer data. Notes retain concurrent edit/delete heads. | Not run |
| Offline/restart | End the connection, make multiple changes, restart/reopen, then explicitly establish the verified channel. Latest eligible state arrives; network-online alone does not reconnect peers. | Not run |
| Lost/delayed receipt | Retry does not duplicate mutation or clear a newer queued revision/consent. Show waiting until receipt/application is known. | Not run |
| Persistence failure | Failed/dropped storage writes do not acknowledge Applied; retry preserves local and queued data. | Not run |
| Lock/switch/revoke | Expired unlock, profile switching, trust/key/scope changes and unlink invalidate or pause the affected work. No wrong-profile fallback or old-consent resurrection. | Not run |
| Multiple dashboards | Concurrent receivers/first invitations serialize correctly and require the exact current grant. | Not run |
| Turn off | Local enrollment/pending payloads stop; already applied remote data is not erased. Manual Send still works separately. | Not run |
| Scope exclusion | Child general preferences/Main filter groups and child Notes do not escape through a personal grant or broadened managed scope. | Not run |
| Discovery / networks | Helper absent versus present, nearby untrusted devices, physical LAN and separate restrictive NAT/firewall networks. No false connected/success state. | Not run |
| Pickup | Home service is trusted with rule contents; Internet envelope is encrypted. Wrong target/revision is rejected and pickup/receipt/application remain distinct. | Not run |
| Native clients | Actual compatible Android build and independent TV/iOS flows; PIN, background, persistence and focus behavior. No parity inferred from shared names. | Not run |

Current direct extension Auto-sync requires both Accounts & Sync pages open and
connected. No automatic saved-peer rendezvous or closed-browser wakeup is claimed.
Parent scope exclusions are recorded in the [Auto-sync contract](design/device-sync/AUTO-SYNC-2026-10-24.md).
