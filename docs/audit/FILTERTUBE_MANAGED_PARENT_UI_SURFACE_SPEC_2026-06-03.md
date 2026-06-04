# Spec: Managed Parent UI Surface

**Generated**: 2026-06-04
**Status**: Spec plus first dashboard child-row status increment present.
**Goal slice**: Implementation order item 1 and Sprint 4 Task 4.1 from
`docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md`.

## Purpose

Managed parent and caregiver controls are becoming real runtime authority in
the extension. The dashboard must therefore show a parent what is happening
without turning protected profiles into an admin surface for the child.

The first increment is deliberately compact: the existing Accounts & Sync
profile manager gets a read-only managed status line on child profile rows when
the active parent/account profile can manage that child. The line summarizes
policy state without exposing plaintext rule values:

- local parent-managed Main/Kids revisions;
- remote accepted managed-policy scope/link counts and latest revision;
- protected action-history row counts and latest result/scope.

## Parent-Facing States

| State | Parent/account surface | Protected child surface |
| --- | --- | --- |
| Empty | Show `Managed status: no parent-managed policy revisions yet.` | No detailed status line. |
| Local edit present | Show local Main/Kids revision and date. | No detailed status line. |
| Remote policy present | Show remote accepted scope count, link count, and latest revision. | No detailed status line. |
| Recent actions present | Show total/protected row counts and latest result/scope. | No detailed status line. |
| Locked parent/account | Status may render, but edits/history still require re-auth. | No admin controls. |
| Offline or unreachable peer | Future transport UI should show stale/offline status without weakening policy. | No override. |
| Sync conflict | Future transport UI should show conflict/rejected state from protected history. | No clear-history control. |

## UI Boundaries

- The status line is read-only.
- The status line must not include keyword text, channel names, video ids, PINs,
  mailbox ciphertext, decrypted payloads, or raw policy JSON.
- The status line appears only when `canActiveProfileManageProfile(...)`
  accepts the active profile as parent/account authority and the dashboard is
  not currently acting as a child admin surface.
- Child profiles still cannot rename/delete profiles, change viewing space,
  change time limits, manage PIN rules, edit child rules, or view protected
  history from child authority.
- The existing `History` button remains the detailed protected-history access
  path and still requires parent/account re-auth.

## Current Runtime Binding

```text
runtime managed parent child-row status helper: present
runtime managed parent child-row status render: present
runtime child/protected detailed status suppression: present
runtime status plaintext rule value exposure: absent
runtime status admin mutation authority: absent
runtime detailed history modal re-auth gate: present
```

## Design Notes

This is an operational control surface, not a marketing panel. It uses the
existing compact profile row layout, keeps labels literal, and avoids adding a
new card stack. The text must be able to wrap inside the dashboard profile row
without becoming a button-like element.

Future UI slices can add a dedicated managed-control panel, but the same rules
hold: parent/caregiver authority must be explicit, protected-user views must
not expose admin details, and status/history cannot become policy authority.

## Verification

Focused test:

```bash
node --test tests/runtime/managed-parent-ui-surface-current-behavior.test.mjs
```

Settings lane:

```bash
npm run test:settings
```
