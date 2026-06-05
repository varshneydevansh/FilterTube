# Spec: Managed Parent UI Surface

**Generated**: 2026-06-04
**Status**: Spec, dashboard child-row status, command-center overview,
delegated command-center action intents, delegated same-budget bulk
time-limit controls, and delegated local bulk viewing-space controls are
present. Rule and remote-delivery bulk writes are not implemented yet.
**Goal slice**: Implementation order item 1 and Sprint 4 Task 4.1 from
`docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md`.

## Purpose

Managed parent and caregiver controls are becoming real runtime authority in
the extension. The dashboard must therefore show a parent what is happening
without turning protected profiles into an admin surface for the child.

The first increment is deliberately compact: the existing Accounts & Sync
profile manager gets a read-only managed status line on child profile rows and
a parent command-center overview when the active parent/account profile can
manage protected profiles. The command-center row buttons, selected-profile
bulk time-limit buttons, and selected-profile bulk viewing-space buttons are
delegated action intents; they call the same gated runtime paths as the
existing child row actions and do not write policy from the overview helper
itself. These surfaces summarize policy state without exposing plaintext rule
values:

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
- Command-center action buttons are action intents only. They do not carry
  payloads, rule values, policy JSON, private keys, or direct mutation authority.
- Bulk command-center buttons carry only selected protected profile ids, action
  name, scope, and `sensitiveAction: true`; the dashboard runtime still prompts
  for parent/account re-auth and builds one policy revision per target.
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
runtime managed command-center overview: present
runtime managed command-center delegated action intents: present
runtime managed command-center bulk time-limit controls: present via delegated runtime gate
runtime managed command-center bulk viewing-space controls: present via delegated runtime gate
runtime managed command-center direct policy writes: absent
runtime managed command-center rule/remote bulk writes: absent
runtime YouTube hot-path work from command-center UI: absent
```

## Command-Center Slice

The current command-center increment is a parent/caregiver overview inside the
existing dashboard profile/settings surface. It makes managed state easier to
scan and gives parents a shorter path to existing guarded actions without
weakening the authority model:

| Area | Parent/caregiver needs | Boundary |
| --- | --- | --- |
| Managed profile selection | See each protected profile, owner relationship, current lock state, and last policy revision. | Child/protected views still hide admin controls and detailed history. |
| Rule editing | Command-center and row actions still enter the existing managed child editor. | Writes must use the same validated local/remote managed-policy paths as current FilterTube controls. |
| Viewing spaces | Show Main, Kids, both, or neither per protected profile; row actions still change policy and selected-profile bulk actions can apply Main + Kids, Kids only, or Main only locally. | UI choice is not authority; runtime route gate remains the enforcement layer; every selected target gets its own redacted revision/history row after parent re-auth. |
| Time limits | Show daily YouTube budget state; command-center row actions still set/disable one profile and bulk selected-profile actions can apply the same daily budget or disable existing limits. | Runtime budget accounting remains background-owned; every target gets its own revision/history row after parent re-auth. |
| Sync status | Show trusted device, local-network provider, Nanah open-sync, and mailbox status. | Reachability is never authorization; offline state keeps the last valid policy active. |
| Action history | Show accepted, rejected, conflict, failed-auth, and expired-session counts/latest labels; detailed history remains gated by the History action. | History stays redacted, protected by parent/account re-auth, and never becomes policy authority. |
| Multi-profile apply | Present for same-budget local time-limit changes and same-access local viewing-space changes on selected protected profiles. | Future rule, remote, mailbox, or LAN bulk writes require each target to have its own target profile, trusted link, scope, revision, hash, and signature/integrity proof. |

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

Future UI slices can add broader bulk write controls, but the same rules hold:
parent/caregiver authority must be explicit, protected-user views must not
expose admin details, each target needs its own revision/history row, and
status/history cannot become policy authority.

## Verification

Focused test:

```bash
node --test tests/runtime/managed-parent-ui-surface-current-behavior.test.mjs
```

Settings lane:

```bash
npm run test:settings
```
