# Contract: Managed Viewing-Space Route Gate

**Generated**: 2026-06-03
**Status**: Runtime route gate implemented for protected child profiles.
Runtime behavior changed: denied Main/Kids child routes now show a managed
profile overlay and skip heavier page-world/filter fallback work for that page.
**Goal slice**: Implementation order runtime prerequisite, "Enforce Main/Kids
route-gate fixtures".
**Primary inputs**:
`docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md`,
`docs/audit/FILTERTUBE_P0_PROFILE_VIEWING_SPACE_CURRENT_BEHAVIOR_2026-05-19.md`,
and
`docs/audit/FILTERTUBE_MANAGED_POLICY_SCHEMA_REVISION_CONTRACT_2026-06-03.md`.

## Purpose

This contract pins the profile viewing-space route gate used to enforce
protected-profile Main YouTube or YouTube Kids access. The extension UI stores
`allowMainViewing` and `allowKidsViewing`; background compile now exposes a
child-only `managedViewingRouteGate`, and the isolated content bridge blocks
denied routes before forwarding settings into the page-world runtime.

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
| `managed_viewing_main_only` | Main true, Kids false. | Allow. | Deny with protected overlay. |
| `managed_viewing_kids_only` | Main false, Kids true. | Deny with protected overlay. | Allow. |
| `managed_viewing_neither_invalid` | Main false, Kids false. | Reject before policy write; if encountered at runtime, deny both and require parent repair. | Reject before policy write; if encountered at runtime, deny both and require parent repair. |
| `managed_viewing_missing_policy_no_work` | No profile policy. | No route-gate work; preserve current page behavior. | No route-gate work; preserve current page behavior. |
| `managed_viewing_external_no_work` | Any policy. | No route-gate work on non-owned routes. | No route-gate work on non-owned routes. |

## Runtime Enforcement Requirements

Runtime enforcement in this slice satisfies:

- Route decisions are evaluated from the active protected profile policy, not
  from child PIN state or UI labels.
- Main denial blocks active `*.youtube.com` surfaces that the extension scripts
  own, including SPA navigation after a profile or policy change.
- Kids denial blocks active `*.youtubekids.com` surfaces.
- Missing policy is a no-work state and must not install observers, timers, or
  overlays.
- External or unsupported hosts are no-work states.
- Runtime gate changes listen for profile/policy refresh and YouTube SPA
  navigation events (`yt-navigate-finish`, `yt-page-data-updated`, `popstate`,
  and `hashchange`) and re-evaluate already-open tabs.
- The visible denial UI is child-safe, accessible, and does not include a child
  dismiss or admin bypass.
- The denial UI can open the FilterTube dashboard as a safe follow-up path, but
  that action does not unlock the protected profile, change access, clear the
  route gate, or mutate policy. Dashboard parent/account gates still own any
  change.
- Public docs must describe only extension/app-owned surfaces, not general
  internet-wide blocking.

## Current Runtime Boundary

Current product runtime source implements this first extension-side gate:

```text
runtime managed viewing-space route gate: present
runtime managed Main route denial: present
runtime managed Kids route denial: present
runtime managed viewing-space deny overlay: present
runtime managed viewing-space deny overlay Open FilterTube action: present
runtime managed viewing-space SPA revalidation: present
runtime managed time-limit budget counter: present in the separate managed time-limit contract
runtime behavior changed by this contract: yes
```

The existing UI/storage behavior remains, with runtime enforcement now attached:

- Profile settings can store `allowMainViewing` and `allowKidsViewing`.
- The dashboard can label Main/Kids access.
- The tab-view UI prevents saving a profile with both viewing spaces disabled
  through that specific UI path.
- Background runtime compile exposes child-only `managedViewingRouteGate`
  settings from those flags.
- The content bridge applies the route gate before forwarding settings to the
  page-world JSON runtime.

Related runtime boundaries:

- The managed time-limit budget counter and timeout overlay now exist in
  `docs/audit/FILTERTUBE_MANAGED_CHILD_TIME_LIMIT_SCHEMA_CONTRACT_2026-06-03.md`.
  They are related managed-profile runtime gates, but they do not replace this
  Main/Kids viewing-space route gate.

Remaining boundaries:

- This is local profile-setting enforcement, not a signed remote managed-policy
  envelope.
- Import/Nanah writes still need managed policy revision and integrity gates
  before remote route policy can be treated as authoritative.

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
