# Spec: Managed Parent UI Surface

**Generated**: 2026-06-04
**Status**: Spec, dashboard child-row status, and a read-only parent command
center overview are present. Write controls still use the existing gated child
row actions; bulk/multi-profile command-center writes are not implemented yet.
**Goal slice**: Implementation order item 1 and Sprint 4 Task 4.1 from
`docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md`.

## Purpose

Managed parent and caregiver controls are becoming real runtime authority in
the extension. The dashboard must therefore show a parent what is happening
without turning protected profiles into an admin surface for the child.

The first increment is deliberately compact: the existing Accounts & Sync
profile manager gets a read-only managed status line on child profile rows and
a read-only parent command-center overview when the active parent/account
profile can manage protected profiles. These surfaces summarize policy state
without exposing plaintext rule values:

- local parent-managed Main/Kids revisions;
- remote accepted managed-policy scope/link counts and latest revision;
- protected action-history row counts and latest result/scope;
- viewing-space and time-limit status.

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
runtime read-only managed command-center overview: present
runtime managed command-center write/bulk apply controls: absent
runtime YouTube hot-path work from command-center UI: absent
```

## Command-Center Slice

The current command-center increment is a read-only parent/caregiver overview
inside the existing dashboard profile/settings surface. It makes managed state
easier to scan without weakening the authority model:

| Area | Parent/caregiver needs | Boundary |
| --- | --- | --- |
| Managed profile selection | See each protected profile, owner relationship, current lock state, and last policy revision. | Child/protected views still hide admin controls and detailed history. |
| Rule editing | Row actions still enter the existing managed child editor. | Writes must use the same validated local/remote managed-policy paths as current FilterTube controls. |
| Viewing spaces | Show Main, Kids, both, or neither per protected profile; row actions still change policy. | UI choice is not authority; runtime route gate remains the enforcement layer. |
| Time limits | Show daily YouTube budget state; row actions still set/disable the policy. | Runtime budget accounting remains background-owned; UI cannot reset consumed time without parent re-auth. |
| Sync status | Show trusted device, local-network provider, Nanah open-sync, and mailbox status. | Reachability is never authorization; offline state keeps the last valid policy active. |
| Action history | Show accepted, rejected, conflict, failed-auth, and expired-session counts/latest labels; detailed history remains gated by the History button. | History stays redacted, protected by parent/account re-auth, and never becomes policy authority. |
| Multi-profile apply | Not implemented in this slice. | Future bulk writes require each target to have its own target profile, trusted link, scope, revision, hash, and signature/integrity proof. |

Required UI states for that slice:

- empty managed profile list;
- locked parent/account session;
- successful local save status through row summaries/history;
- pending P2P/local-network delivery;
- offline trusted device;
- rejected or conflicted remote update;
- failed provider/mailbox pull through protected history/status labels;
- time limit exhausted via the existing runtime timeout overlay;
- no-policy/no-work state.

Design constraints:

- Mobile-first layout with a single-column protected-profile list before any
  wider dashboard grouping.
- Touch targets for actions, toggles, and profile selectors must remain at
  least 44px high.
- Use segmented controls for Main/Kids access, switches for enablement, numeric
  inputs or steppers for time budgets, and a dense table only for action
  history.
- Avoid nested cards and marketing-style hero sections; this is a working
  control surface.
- Avoid showing raw JSON, plaintext sensitive rule values, PINs, private keys,
  mailbox ciphertext, or YouTube DOM/debug identifiers.
- Do not add YouTube content-script observers, timers, DOM scans, or JSON work
  for dashboard-only managed-control UI.

## Design Notes

This is an operational control surface, not a marketing panel. It uses the
existing compact profile row layout, keeps labels literal, and avoids adding a
new card stack. The text must be able to wrap inside the dashboard profile row
without becoming a button-like element.

Future UI slices can add bulk write controls, but the same rules hold:
parent/caregiver authority must be explicit, protected-user views must not
expose admin details, and status/history cannot become policy authority.

## Verification

Focused test:

```bash
node --test tests/runtime/managed-parent-ui-surface-current-behavior.test.mjs
```

Settings lane:

```bash
npm run test:settings
```
