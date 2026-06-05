# Spec: Managed Parent UI Surface

**Generated**: 2026-06-04
**Status**: Spec, dashboard protected-profile status, command-center overview,
delegated command-center action intents, delegated selected-profile rule editor
handoff, delegated same-budget bulk time-limit controls, delegated local
bulk viewing-space controls, command-center verified-device send actions,
live P2P signed managed-policy push for connected verified replica devices,
provider-gated mailbox/LAN delivery handoff, and protected redacted push
history rows are present. The command center now includes a compact
parent-facing protection strip plus labeled Device/History row details so
parents can scan readiness, re-pairing, conflicts, and history without reading
raw policy state. Bulk local time-limit and viewing-space actions cover all
manageable protected profiles, including Default/Master-managed independent
account profiles. Direct rule bulk writes remain intentionally absent.
**Goal slice**: Implementation order item 1 and Sprint 4 Task 4.1 from
`docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md`.

## Purpose

Managed parent and caregiver controls are becoming real runtime authority in
the extension. The dashboard must therefore show a parent what is happening
without turning protected profiles into an admin surface for the child.

The current increment is deliberately compact: the existing Accounts & Sync
profile manager gets a read-only managed status line on protected profile rows
and a parent command-center overview when the active master/parent/account
profile can manage protected profiles. Protected profiles include child
profiles and independent account profiles that the Default/Master profile can
manage. The command-center row buttons, selected-profile rule editor handoff,
selected-profile bulk time-limit buttons, selected-profile bulk viewing-space
buttons, and selected-profile send buttons are delegated action intents; they
call the same gated runtime paths as the existing profile actions and do not
write policy from the overview helper itself. These surfaces summarize policy
state without exposing plaintext rule values:

- local parent-managed Main/Kids revisions;
- remote accepted managed-policy scope/link counts and latest revision;
- protected action-history row counts and latest result/scope;
- viewing-space and time-limit status.
- verified child/protected-device link readiness for live P2P, LAN provider,
  or mailbox provider delivery.

## Parent-Facing States

| State | Parent/account surface | Protected child surface |
| --- | --- | --- |
| Empty | Show `Managed status: no parent-managed policy revisions yet.` | No detailed status line. |
| Local edit present | Show local Main/Kids revision and date. | No detailed status line. |
| Remote policy present | Show remote accepted scope count, link count, and latest revision. | No detailed status line. |
| Recent actions present | Show total/protected row counts and latest result/scope. | No detailed status line. |
| Locked parent/account | Status may render, but edits/history still require re-auth. | No admin controls. |
| Offline or unreachable peer | Future transport UI should show stale/offline status without weakening policy. | No override. |
| Verified device connected | Show the live/send-ready state; parent can push signed policy immediately after re-auth. | Receiving device still validates trusted link, signature, scope, revision, and target profile before apply. |
| Provider pending | Show verified device but provider pending when no built-in mailbox/LAN provider is available. | Last accepted policy remains active; no weaker fallback applies. |
| Sync conflict | Future transport UI should show conflict/rejected state from protected history. | No clear-history control. |

## UI Boundaries

- The status line is read-only.
- Command-center action buttons are action intents only. They do not carry
  payloads, rule values, policy JSON, private keys, or direct mutation authority.
- Bulk command-center buttons carry only selected protected profile ids, action
  name, scope, and `sensitiveAction: true`; the dashboard runtime still prompts
  for parent/account re-auth and builds one policy revision per target.
- `Send Update` and `Send selected updates` use saved managed Source -> Replica
  links only. A live connected verified replica receives signed envelopes over
  Nanah immediately. Optional mailbox/LAN providers receive ciphertext items or
  signed local-network candidates only when those provider hooks exist.
- The extension does not currently include a built-in server mailbox client or
  LAN peer-discovery transport. Those remain provider/app/server integration
  surfaces, not hidden extension authority.
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
runtime managed parent protected-row status helper: present
runtime managed parent protected-row status render: present
runtime child/protected detailed status suppression: present
runtime status plaintext rule value exposure: absent
runtime status admin mutation authority: absent
runtime detailed history modal re-auth gate: present
runtime managed command-center overview: present
runtime managed command-center protection strip: present
runtime managed command-center labeled device/history details: present
runtime managed command-center delegated action intents: present
runtime managed command-center selected-profile rule editor handoff: present via delegated runtime gate
runtime managed command-center bulk time-limit controls: present via delegated runtime gate
runtime managed command-center bulk viewing-space controls: present via delegated runtime gate
runtime managed command-center per-profile signed policy push: present
runtime managed command-center selected-profile signed policy push: present
runtime connected verified-device live P2P managed policy send: present
runtime provider-gated mailbox/LAN delivery handoff from command center: present
runtime protected redacted push-attempt history rows: present
runtime built-in server mailbox upload/pull client: absent
runtime built-in LAN discovery/transport client: absent
runtime managed command-center direct policy writes: absent
runtime managed command-center direct rule bulk writes: absent
runtime YouTube hot-path work from command-center UI: absent
```

## Command-Center Slice

The current command-center increment is a parent/caregiver overview inside the
existing dashboard profile/settings surface. It makes managed state easier to
scan and gives parents a shorter path to existing guarded actions without
weakening the authority model:

| Area | Parent/caregiver needs | Boundary |
| --- | --- | --- |
| Managed profile selection | See each protected profile, owner relationship, current lock state, verified-device readiness, and last policy revision. | Child/protected views still hide admin controls and detailed history. |
| Protection scan strip | Quickly see protected profile count, sync-ready profiles, profiles needing re-pairing, and remote conflicts before acting. | Strip values are aggregate status only; they do not include rule text, policy payloads, keys, or mutation authority. |
| Rule editing | Command-center row actions still enter the existing managed protected-profile editor, and selected-profile bulk controls can hand off one selected protected profile to the same editor. | Writes must use the same validated local/remote managed-policy paths as current FilterTube controls; multi-profile direct rule writes remain future work. |
| Remote send | Parent can send one protected profile or selected protected profiles to saved verified devices. | Delivery links are not authority; each envelope still requires Source -> Replica trust, fixed target profile, allowed scope, signature/integrity proof, and newer revision/hash. |
| Viewing spaces | Show Main, Kids, both, or neither per protected profile; row actions still change policy and selected-profile bulk actions can apply Main + Kids, Kids only, or Main only locally. | UI choice is not authority; runtime route gate remains the enforcement layer; every selected target gets its own redacted revision/history row after parent re-auth. |
| Time limits | Show daily YouTube budget state; command-center row actions still set/disable one profile and bulk selected-profile actions can apply the same daily budget or disable existing limits. | Runtime budget accounting remains background-owned; every target gets its own revision/history row after parent re-auth. |
| Sync status | Show trusted device, local-network provider, Nanah open-sync, and mailbox status. | Reachability is never authorization; offline state keeps the last valid policy active. |
| Action history | Show accepted, rejected, conflict, failed-auth, and expired-session counts/latest labels; detailed history remains gated by the History action. | History stays redacted, protected by parent/account re-auth, and never becomes policy authority. |
| Multi-profile apply | Present for selected-profile rule editor handoff, same-budget local time-limit changes, same-access local viewing-space changes, and selected-profile signed-policy sends on selected protected profiles. | Direct local rule bulk writes remain absent; every remote target still needs its own target profile, trusted link, scope, revision, hash, and signature/integrity proof. |

Required UI states for that slice:

- empty managed profile list;
- locked parent/account session;
- successful local save status through row summaries/history;
- pending P2P/local-network delivery;
- connected verified-device send success;
- provider pending when the extension has no mailbox/LAN provider hook;
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

Future UI slices can add broader direct bulk write controls, but the same rules
hold: parent/caregiver authority must be explicit, protected-user views must
not expose admin details, each target needs its own revision/history row, and
status/history cannot become policy authority.

## Manual Verification Focus

For the current feature-first slice, manual verification should cover:

- Default/Master can see and manage independent protected account profiles.
- A parent account can see and manage its child profiles.
- Protected/child authority cannot see command-center controls or clear
  protected history.
- `Send Update` works for a connected verified Source -> Replica Nanah session.
- `Send selected updates` records redacted history for success, no-link, and
  provider-pending cases.
- A receiving protected profile applies only trusted, signed, newer policy for
  its fixed target profile.
- YouTube hot paths stay idle when the dashboard command center is open.
