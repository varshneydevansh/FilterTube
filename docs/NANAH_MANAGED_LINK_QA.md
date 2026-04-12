# Nanah Managed Link QA

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
- open the `Nanah Sync` page on both devices
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
  - `Apply + Save Managed Link`
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
- if B chooses `Apply + Save Managed Link`, the saved managed link shows:
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
- `main`, `kids`, and `active` still apply into the receiver's current active profile
- Help page still explains managed-link behavior clearly

## Ship gate

Treat Nanah managed-link changes as ready only if:

1. all five tests pass
2. no stale trusted-link data causes contradictory UI
3. no send/apply path bypasses local unlock requirements
4. no managed link can be saved without the currently approved incoming scope remaining allowed
