# Contract: Managed Viewing-Space Route Gate

**Generated**: 2026-06-03
**Status**: Contract/proof fixture only. Runtime behavior is unchanged.
**Goal slice**: Implementation order item 7 prerequisite, "Add Main/Kids
route-gate fixtures".
**Primary inputs**:
`docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md`,
`docs/audit/FILTERTUBE_P0_PROFILE_VIEWING_SPACE_CURRENT_BEHAVIOR_2026-05-19.md`,
and
`docs/audit/FILTERTUBE_MANAGED_POLICY_SCHEMA_REVISION_CONTRACT_2026-06-03.md`.

## Purpose

This contract pins the profile viewing-space route gate that must exist before
FilterTube can enforce protected-profile Main YouTube or YouTube Kids access.
The current extension UI can store `allowMainViewing` and `allowKidsViewing`,
but content/background runtime does not yet block routes from those flags.

The route gate is a runtime authority requirement, not a settings-label
feature. A child/protected-user PIN cannot grant a denied viewing space, and
local-network discovery cannot change the policy.

## Route Classification

Only extension-owned/scripted YouTube surfaces are in scope:

| Surface | Hosts | Notes |
| --- | --- | --- |
| `main` | `youtube.com`, `www.youtube.com`, `m.youtube.com`, and other active `*.youtube.com` script hosts | Includes YouTube Music until a future policy splits it. Excludes `youtubekids.com`. |
| `kids` | `youtubekids.com` and `*.youtubekids.com` | YouTube Kids route space. |
| `external` | Non-YouTube hosts and host-permission-only surfaces without active route gate | No managed route work should run. |

`youtube-nocookie.com` is host-permitted in manifests but is not an active
content-script match today. This contract does not claim route-gate enforcement
there until a future active-surface proof exists.

## Required Route Decisions

| Fixture id | Policy | Main route decision | Kids route decision |
| --- | --- | --- | --- |
| `managed_viewing_both_allowed` | `allowMainViewing: true`, `allowKidsViewing: true` | Allow. | Allow. |
| `managed_viewing_main_only` | Main true, Kids false. | Allow. | Deny with protected overlay/redirect after implementation. |
| `managed_viewing_kids_only` | Main false, Kids true. | Deny with protected overlay/redirect after implementation. | Allow. |
| `managed_viewing_neither_invalid` | Main false, Kids false. | Reject before policy write; if encountered at runtime, deny both and require parent repair. | Reject before policy write; if encountered at runtime, deny both and require parent repair. |
| `managed_viewing_missing_policy_no_work` | No profile policy. | No route-gate work; preserve current page behavior. | No route-gate work; preserve current page behavior. |
| `managed_viewing_external_no_work` | Any policy. | No route-gate work on non-owned routes. | No route-gate work on non-owned routes. |

## Runtime Enforcement Requirements

Future runtime enforcement must satisfy these requirements before shipping:

- Route decisions are evaluated from the active protected profile policy, not
  from child PIN state or UI labels.
- Main denial blocks active `*.youtube.com` surfaces that the extension scripts
  own, including SPA navigation after a profile or policy change.
- Kids denial blocks active `*.youtubekids.com` surfaces.
- Missing policy is a no-work state and must not install observers, timers, or
  overlays.
- External or unsupported hosts are no-work states.
- Runtime gate changes must listen for profile/policy refresh and re-evaluate
  already-open tabs.
- Any visible denial UI must be child-safe, accessible, and not dismissible as
  admin authority by a child/protected user.
- Public docs must describe only extension/app-owned surfaces, not general
  internet-wide blocking.

## Current Runtime Boundary

Current product runtime source does not yet implement this gate:

```text
runtime managed viewing-space route gate: absent
runtime managed Main route denial: absent
runtime managed Kids route denial: absent
runtime managed viewing-space deny overlay: absent
runtime managed viewing-space SPA revalidation: absent
runtime behavior changed by this contract: no
```

The existing UI/storage behavior remains:

- Profile settings can store `allowMainViewing` and `allowKidsViewing`.
- The dashboard can label Main/Kids access.
- The tab-view UI prevents saving a profile with both viewing spaces disabled
  through that specific UI path.
- Background runtime compile still does not enforce the flags.

## Verification

Focused test:

```bash
node --test tests/runtime/managed-viewing-space-route-gate-current-behavior.test.mjs
```

Settings and performance lanes:

```bash
npm run test:settings
npm run test:performance
```
