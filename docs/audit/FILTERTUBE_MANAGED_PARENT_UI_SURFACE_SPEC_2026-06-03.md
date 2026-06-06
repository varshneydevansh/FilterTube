# Spec: Managed Parent UI Surface

**Generated**: 2026-06-04
**Status**: Spec, dashboard protected-profile status, command-center overview,
delegated command-center action intents, delegated selected-profile rule editor
handoff, delegated same-budget bulk time-limit controls, delegated local
bulk viewing-space controls, delegated parent extra-time grants, command-center
verified-device send actions,
live P2P signed managed-policy push for connected verified replica devices,
provider-gated mailbox/LAN delivery handoff, and protected redacted push
history rows are present. The command center now also surfaces the latest
redacted delivery attempt in each protected profile row so parents can see
whether the last send went live, LAN, mailbox, partial, no-link, or
provider-missing without opening raw policy state. The command center now includes a compact
parent-facing protection strip, a parent-reauthed encrypted mailbox endpoint
configuration row, plus labeled Delivery/Device/History row details so parents
can scan live delivery, later-delivery provider readiness, re-pairing,
conflicts, and history without reading raw policy state. Bulk local time-limit
and viewing-space actions cover all manageable protected profiles, including
Default/Master-managed independent account profiles. Direct rule bulk writes
for keyword, channel, and video ID rules are now present behind a
review-confirmation step and parent/account re-auth, and changed profiles with
verified delivery can immediately push the matching Main/Kids rule scope to
their saved devices. Parents can also grant temporary extra YouTube time to
profiles with active limits and optionally push the updated `time_limits`
policy to verified devices. Local viewing-space and normal time-limit edits now
use the same post-save verified-device push offer for their matching scopes.
When a protected user asks for more time from the timeout overlay, the command
center now surfaces the latest unresolved redacted request as a warning chip and
Request detail, the overview strip counts pending requests, the bulk selector
can select only requesting profiles, and the row's extra-time action reads
`Grant Time`. When selected profiles include unresolved time requests, the bulk
status also shows the selected request count and the bulk extra-time action
reads `Grant selected time` while still using the same parent/account re-auth
grant path.
When no protected profile is available yet, the command center now shows setup
handoffs for creating a child profile and, for Default/Master, creating an
independent account profile through the existing gated profile-creation flows.
The zero-profile state now hides optional delivery-provider rows and shows a
short parent setup checklist first. The normal one-profile state hides bulk
controls, hides unconfigured mailbox/LAN setup, and uses row-level actions so
parents are not forced through advanced transport choices. Provider modals use
parent-facing wording only when an existing provider is being edited. The Help
page now includes plain-language Managed Parent Controls, time-finished, and
remote-update cards under Profiles/PINs. The runtime timeout and viewing-space
blocked overlays now reuse the bundled serene FilterTube hero video background
with a dark calm scrim while preserving the same lock/request authority.
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
- latest redacted delivery attempt status/counts;
- viewing-space and time-limit status.
- verified child/protected-device link readiness for live P2P, LAN provider,
  or mailbox provider delivery.

## Parent-Facing States

| State | Parent/account surface | Protected child surface |
| --- | --- | --- |
| Empty | Show `Managed status: no parent-managed policy revisions yet.` and, when the command center has no protected rows, setup handoffs for creating the first child/protected profile through existing gated flows. | No detailed status line. |
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
- Empty-state setup buttons are also action intents only. They route to the
  existing Create Child Profile or Create Account flows, which keep their
  current parent/account or Master unlock requirements.
- Bulk command-center buttons carry only selected protected profile ids, action
  name, scope, and `sensitiveAction: true`; the dashboard runtime still prompts
  for parent/account re-auth and builds one policy revision per target.
- After a selected-profile keyword/channel/video-ID bulk write, the runtime can
  offer an immediate verified-device push for only the matching granular rule
  scope. The parent chooses Main or Kids through an explicit button choice, not
  a typed prompt. That send binds the parent-selected Main/Kids surface instead
  of reading the visible Nanah granular-surface selector.
- `Add Time` and `Add selected time` are delegated actions for profiles with
  active time limits. They require parent/account re-auth, write a revisioned
  redacted time-limit history row, and can offer an immediate verified-device
  `time_limits` push.
- A pending timeout-overlay request is shown as `Time request: Main/Kids` plus
  redacted used/limit counts only when the latest time-limit history row is the
  protected user's `policy.time_limit.request_extra` request. Any later
  `policy.time_limit.update` row clears the pending presentation. This status
  changes button wording only; granting still routes through the existing
  parent/account re-auth extra-time path.
- The overview `Requests` count and `Select requests` bulk control are
  selection aids only. They select profiles whose latest time-limit history row
  is an unresolved protected request; they do not grant time, expose history, or
  mutate policy without the existing parent/account re-auth grant path.
- The selected-profile bulk status and extra-time button may change wording to
  show how many selected profiles are asking for more time. This is only a
  parent-facing affordance; the same re-authenticated `time_limits` grant path
  remains the only policy mutation route.
- Normal viewing-space and time-limit saves also offer the same scoped
  verified-device push when the changed protected profiles have delivery ready.
- `Send Update` and `Send selected updates` use saved managed Source -> Replica
  links only. A live connected verified replica receives signed envelopes over
  Nanah immediately. Optional mailbox/LAN providers receive ciphertext items or
  signed local-network candidates only when those provider hooks exist.
- Mailbox and LAN setup rows are explanatory transport controls only and remain
  hidden from the normal parent command center unless a provider is already
  configured. The visible parent workflow is protected profile -> rules/access/
  time -> verified-device/live P2P. Later-update and same-network providers
  remain optional advanced delivery hooks, not the default parent path.
- The Delivery row preview is a redacted status summary only. It can say Live
  now, LAN provider ready, Mailbox later, Provider setup needed, Re-pair before
  sending, Refresh stale link, Review conflict first, or Pair verified device;
  it does not contain rule text, policy JSON, hashes, keys, ciphertext, or
  mutation authority.
- The extension includes a browser-side HTTPS mailbox client only when an
  endpoint is explicitly configured. LAN peer-discovery transport remains a
  provider/app/server integration surface, not hidden extension authority.
- The extension includes a browser-side local-network provider client only when
  a parent/account profile explicitly configures an endpoint. The client can
  publish/discover signed local-network candidates through HTTPS or private
  local HTTP gateways, but discovery remains transport only; target trust,
  source key, scope, revision, hash, and signature validation still happen in
  the local managed-policy apply path.
- `Configure Mailbox`/`Edit Mailbox` and their parent-facing Later Updates
  labels save or clear only the encrypted
  mailbox endpoint configuration after parent/account re-auth. They do not
  create a sync account, publish rules, expose tokens in the UI, or turn the
  mailbox server into policy authority. The setup flow first asks parents to
  Configure/Edit or explicitly Disable Mailbox, and the endpoint prompt also
  treats a blank endpoint as disabling mailbox delivery so the visible prompt
  matches runtime behavior.
- `Configure LAN`/`Edit LAN` and their parent-facing Same-Network labels save or clear only the local-network gateway
  endpoint configuration after parent/account re-auth. They do not create
  authority from network reachability, expose tokens in the UI, or let a LAN
  gateway choose profiles/rules. The setup flow now first asks parents to
  Configure/Edit or explicitly Disable LAN; an empty endpoint no longer acts
  as the disable command.
- Provider setup copy uses parent/user language and avoids presenting revision,
  hash, or signature details in the decision modal. Audit docs retain those
  proof details; the product surface says that protected devices accept only
  trusted parent updates.
- When there are zero manageable protected profiles, provider rows are hidden
  so mailbox or LAN setup cannot look like the first step.
- Accepted mailbox provider configure/disable actions write redacted history
  rows to every currently manageable protected profile. Those rows include only
  configured/disabled state, target count, and endpoint host when configured;
  they never include bearer tokens, full URLs, ciphertext, decrypted mailbox
  items, or policy payloads. When no protected profiles exist yet, there is no
  protected target history to write and the mailbox status row remains the
  feedback surface.
- Provider configure/disable history covers child profiles under the active
  parent/account and independent account profiles that Default/Master can
  manage. It excludes Default/Master itself and the active actor profile.
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
runtime managed command-center labeled delivery/device/history details: present
runtime managed command-center delegated action intents: present
runtime managed command-center redacted delivery preview: present
runtime managed command-center latest delivery attempt summary: present as protected redacted history feedback
runtime managed command-center redacted delivery-ack status: present
runtime managed command-center selected-profile rule editor handoff: present via delegated runtime gate
runtime managed command-center bulk time-limit controls: present via delegated runtime gate
runtime managed command-center parent extra-time grants: present via delegated runtime gate
runtime managed command-center pending extra-time request chip/detail/count/select/bulk grant label: present as redacted status and delegated grant handoff
runtime managed command-center bulk viewing-space controls: present via delegated runtime gate
runtime managed command-center per-profile signed policy push: present
runtime managed command-center selected-profile signed policy push: present
runtime managed command-center direct rule bulk writes: present via confirmation plus delegated runtime gate
runtime managed command-center grouped bulk action rail: present
runtime managed command-center encrypted mailbox provider configuration: present via parent re-auth and explicit configure/disable choice
runtime managed command-center mailbox provider config history: present as redacted per-protected-profile rows, including Master-managed independent account profiles
runtime managed command-center local-network provider configuration: present via parent re-auth and explicit configure/disable choice
runtime managed command-center local-network provider config history: present as redacted per-protected-profile rows, including Master-managed independent account profiles
runtime managed command-center parent-facing provider route guidance: present for live P2P, encrypted later mailbox delivery, and same-network gateway delivery
runtime managed command-center focused conflict review: present as parent-reauthed redacted history filter
runtime managed command-center blank mailbox endpoint disables provider config: present after parent re-auth
runtime managed command-center post-rule-write granular verified-device push: present with selected surface binding
runtime managed command-center post-viewing/time-limit verified-device push: present
runtime connected verified-device live P2P managed policy send: present
runtime provider-gated mailbox/LAN delivery handoff from command center: present
runtime protected redacted push-attempt history rows: present
runtime protected redacted push-attempt row feedback in command center: present
runtime browser HTTPS mailbox upload/pull client: present behind explicit config
runtime browser local-network gateway publish/discover/ack client: present behind explicit config
runtime mailbox server authority: absent
runtime automatic LAN peer discovery authority: absent
runtime managed command-center direct policy writes: absent
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
| Rule editing | Command-center row actions still enter the existing managed protected-profile editor, selected-profile bulk controls can hand off one selected protected profile to the same editor, and selected-profile bulk keyword/channel/video-ID additions can apply one reviewed rule to selected protected profiles. Parent/caregiver bulk rule writes choose YouTube Main or YouTube Kids with explicit buttons before value entry. Changed profiles with verified delivery can then push the matching rule scope immediately. | Writes must use the same validated local/remote managed-policy paths as current FilterTube controls; bulk rule writes require review confirmation, parent/account re-auth, per-target revision/history rows, selected Main/Kids surface binding for granular sends, and no child authority. |
| Remote send | Parent can send one protected profile or selected protected profiles to saved verified devices and see whether the next attempt is live, later via LAN/mailbox provider, blocked by conflict, blocked by stale/revoked pairing, missing a verified device, or has redacted source-side delivery ack feedback. The row also shows the latest redacted send attempt from protected history so parents can see success, partial delivery, no-link, and provider-missing outcomes without opening the detailed history modal. | Delivery links, preview labels, latest-attempt labels, and ack labels are not authority; each envelope still requires Source -> Replica trust, fixed target profile, allowed scope, signature/integrity proof, and newer revision/hash. |
| Conflict review | `Review Conflict` opens a parent/account re-authed conflict review modal that filters history to conflict and rejected remote-policy rows first. | This is read-only redacted history triage; it does not resolve, clear, merge, retry, or accept policy. |
| Mailbox provider | Parent can configure, edit, or clear the HTTPS encrypted-mailbox endpoint from the command center after parent/account re-auth. | The endpoint stores only encrypted mailbox rows and metadata; it cannot read policy, choose targets, bypass trust, or become authority. |
| Viewing spaces | Show Main, Kids, both, or neither per protected profile; row actions still change policy and selected-profile bulk actions can apply Main + Kids, Kids only, or Main only locally, then offer a scoped verified-device push when delivery exists. | UI choice is not authority; runtime route gate remains the enforcement layer; every selected target gets its own redacted revision/history row after parent re-auth. |
| Time limits | Show daily YouTube budget state; command-center row actions still set/disable one profile, can add temporary extra time to one active limit, and bulk selected-profile actions can apply the same daily budget, disable existing limits, or add temporary extra time to selected active limits, then offer a scoped verified-device push when delivery exists. Daily limits now use preset choices for 30 minutes, 1 hour, 2 hours, parent-approval/0 minutes, or custom minutes; extra-time grants use 15 minute, 30 minute, 1 hour, or custom choices. | Runtime budget accounting remains background-owned; every target gets its own revision/history row after parent re-auth, zero-minute daily limits remain valid immediate-timeout policies, and extra-time grants are bounded by expiry. |
| Sync status | Show trusted device, delivery preview, local-network provider, Nanah open-sync, and mailbox status. | Reachability is never authorization; offline state keeps the last valid policy active. |
| Action history | Show accepted, rejected, conflict, failed-auth, and expired-session counts/latest labels; detailed history remains gated by the History action. Time-limit updates and protected extra-time requests show redacted daily budget, used/remaining time, Main/Kids surface, date, and parent-grant counts. | History stays redacted, protected by parent/account re-auth, and never becomes policy authority. |
| Multi-profile apply | Present for selected-profile rule editor handoff, same-budget local time-limit changes, same-access local viewing-space changes, selected-profile keyword/channel/video-ID rule additions, and selected-profile signed-policy sends on selected protected profiles. The command center groups selected-profile actions into Rules, Send, Time, and Access so parent/caregiver bulk work stays scannable without adding a separate page. | Local bulk rule writes are one reviewed rule at a time and every local or remote target still needs its own target profile, revision/history row, and authority gate; remote sends additionally require trusted link, scope, revision, hash, and signature/integrity proof. Group labels are navigation aids only and do not create authority. |

Required UI states for that slice:

- empty managed profile list;
- locked parent/account session;
- successful local save status through row summaries/history;
- pending P2P/local-network delivery;
- connected verified-device send success;
- redacted latest delivery attempt feedback for live/LAN/mailbox/partial/no-link/provider-missing;
- redacted source-side delivery ack status;
- provider pending when the extension has no mailbox/LAN provider hook;
- configured, invalid, and disabled mailbox endpoint states;
- offline trusted device;
- rejected or conflicted remote update;
- failed provider/mailbox pull through protected history/status labels;
- time limit exhausted via the runtime timeout overlay, including the serene
  video background and protected-user "Ask parent for more time" guidance state
  that does not grant authority or dismiss the lock;
- no-policy/no-work state.

Design constraints:

- Mobile-first layout with a single-column protected-profile list before any
  wider dashboard grouping.
- Selected-profile bulk actions must be grouped by parent task area so rule
  edits, delivery sends, time budgets, and viewing-space access do not become
  one flat command cluster.
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
- Selected-profile Add keyword/channel/video ID shows a review confirmation,
  uses explicit Main/Kids surface buttons, requires parent/account re-auth, and
  writes redacted per-target history.
- If verified delivery is available after a selected-profile rule write, the
  follow-up Send update confirmation pushes only the matching keyword/channel/video
  scope for the selected Main/Kids surface.
- Set Limit, Set selected limits, Add Time, and Add selected time appear only
  as delegated parent actions, use preset choices with a custom-minutes escape
  hatch, write redacted time-limit history, and can push `time_limits` to
  verified devices.
- Viewing-space and time-limit saves offer scoped verified-device pushes only
  for changed profiles with delivery ready.
- A receiving protected profile applies only trusted, signed, newer policy for
  its fixed target profile.
- YouTube hot paths stay idle when the dashboard command center is open.
