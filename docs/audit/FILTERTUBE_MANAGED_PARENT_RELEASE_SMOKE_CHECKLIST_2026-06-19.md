# Checklist: Managed Parent/Caregiver Release Smoke

**Generated**: 2026-06-19
**Status**: Release-smoke checklist for the managed parent/caregiver control
goal. This is a proof handoff, not a claim that complete remote management is
release-ready across every transport.
**Scope**: Extension-installed manual smoke plus focused automated proof for
Family Controls, Family Device Updates, Later Pickup, Same-Home Pickup,
rule-list imports, viewing-space gates, time limits, and action history.

## Why This Exists

The managed-control work now spans local profile authority, Nanah live sends,
optional saved-update providers, list imports, route gates, time budgets, and
protected history. A release can look correct in the dashboard while still
overclaiming one of these paths.

This checklist keeps the release decision concrete:

```text
edit protected profile
  -> apply local parent-approved rules/time/access
  -> send only through a verified device path when needed
  -> receive only after trusted-link validation
  -> keep last accepted policy offline
  -> record redacted accepted/rejected history
```

## Parent-Facing Delivery Model

Use these terms in release notes and support replies:

| Parent wording | Internal transport | What it can safely mean |
| --- | --- | --- |
| Send Update | Live Nanah P2P | Parent and protected devices are open, paired, phrase-verified, and a signed update is sent now. |
| Later Pickup | Encrypted pickup provider | A compatible HTTPS pickup service stores unreadable saved updates until the verified protected device opens later or away. |
| Same-Home Pickup | Local-network pickup provider | A compatible home/school/clinic bridge on the same network can hold or relay signed updates for already trusted protected devices. |

Use the same Family Device Map for devices that are ready now, same-home, or
away/later. Do not describe Same-Home Pickup as Wi-Fi authority, automatic LAN
control, or a network scan. Do not describe Later Pickup as hosted authority or
always-on sync. The protected device still validates trusted link, target
profile, scope, revision, device binding, policy hash, and signature before
applying anything.

## Automated Preflight

Run these before installed-extension manual smoke for any managed-control
release slice:

```bash
node --check js/tab-view.js
node --check js/managed_parent_command_center.js
node --check js/nanah_managed_live_policy.js
node --check js/nanah_managed_open_sync.js
node --check js/nanah_managed_mailbox_client.js
node --check js/nanah_managed_local_network_client.js
node --test tests/runtime/managed-parent-ui-surface-current-behavior.test.mjs
node --test tests/runtime/managed-policy-sync-remote-delivery-smoke-artifact-verifier-current-behavior.test.mjs
node --test tests/runtime/managed-policy-sync-remote-delivery-readiness-gate-current-behavior.test.mjs
git diff --check
```

For broader release branches, use the lane matrix as the source of truth:

```bash
npm run test:changed
npm run test:settings
npm run test:release
npm run test:smoke
```

## Installed Extension Smoke

Record the result in:

```text
docs/audit/artifacts/managed-remote-delivery-smoke/template.json
```

Then verify the executed artifact with:

```bash
node docs/audit/artifacts/managed-remote-delivery-smoke/verify-managed-smoke-artifact.mjs path/to/executed-artifact.json
```

Required manual rows:

| Row | Manual proof |
| --- | --- |
| 1. Protected profile setup | Create or use a protected profile from a parent/account profile. Confirm child/protected PIN does not unlock parent/admin controls. |
| 2. Local rules | Add keyword, channel, and video rules while editing the protected profile. Confirm local Main/Kids/Both target choice is clear. |
| 3. Rule-list import | Import or refresh CSV/TXT/JSON/URL list data, preview accepted and skipped rows, apply to Main, Kids, or both, and confirm imported rows show source metadata. |
| 4. Viewing space | Set Main-only, Kids-only, or Main + Kids. Confirm the blocked viewing space is route-gated before the protected user can use YouTube there. |
| 5. Time limit | Set a daily YouTube limit and a zero/reduced budget. Confirm YouTube is blocked by the FilterTube timeout screen when the budget is exhausted. |
| 6. Live Send Update | Pair parent and protected devices, verify the same phrase, send the reviewed protected-profile update, and confirm the protected device applies only the newer signed policy. |
| 7. Offline policy | Disconnect delivery and confirm the protected device keeps the last accepted policy active. |
| 8. Later Pickup | If configured, send a saved update through the explicit HTTPS provider and confirm profile-open pickup applies only after local trusted-link validation. |
| 9. Same-Home Pickup | If configured, send or discover through the explicit local provider and confirm same-network reachability alone does not grant authority. |
| 10. Rejection path | Try a stale, wrong-target, revoked-link, or wrong-key update and confirm it is rejected without weakening the active policy. |
| 11. Action history | Confirm parent-visible history records accepted/rejected outcomes without PINs, private keys, plaintext rule values, raw policy JSON, decrypted payloads, or ciphertext blobs. |
| 12. No-work performance | With no eligible provider or pending policy, open YouTube and confirm there are no provider polling loops, LAN fetch loops, new YouTube observers, or visible lag from managed-control code. |

## Timeout Screen Expectation

When a protected profile reaches its daily YouTube budget, the expected user
experience is a calm FilterTube-owned timeout screen over the YouTube surface.
It should say that YouTube time is finished for today, show when access can
resume, and provide only safe actions such as opening FilterTube, switching
profile through the normal locked flow, or requesting more time when that
request path is available.

Do not redirect the protected user to arbitrary websites. Do not let the
protected profile bypass the limit by SPA navigation, reload, browser restart,
sleep/wake, or switching between Main YouTube and YouTube Kids when the policy
budget covers both.

## Release Claim Boundaries

Allowed after this smoke passes for one transport:

```text
Managed parent/caregiver controls support local protected-profile rules,
viewing-space gates, daily YouTube time limits, protected action history, and
verified-device Send Update for the tested transport.
```

Still not allowed unless separately proven:

```text
automatic LAN peer discovery
always-on background sync
network-wide YouTube filtering
school-wide gateway filtering
complete Android/iOS parity
guaranteed later delivery without a configured provider
untrusted public lists applying without parent review
```

## Current Release Decision

```text
local protected-profile authority: GO for extension-owned flows
live Nanah Send Update: GO after installed two-device smoke
Later Pickup: GO only with explicit configured-provider smoke
Same-Home Pickup: GO only with explicit configured-provider smoke
built-in automatic LAN discovery: NO-GO
network-wide filtering product: OUT OF THIS EXTENSION RELEASE
downstream app parity: separate native sync/parity lane
```
