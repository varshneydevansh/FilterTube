# Spec: Managed Parent UI Surface

**Generated**: 2026-06-04
**Status**: Spec, dashboard protected-profile status, command-center overview,
delegated command-center action intents, delegated selected-profile rule editor
handoff, delegated same-budget bulk time-limit controls, delegated local
bulk viewing-space controls, delegated parent extra-time grants, command-center
verified-device send actions,
live P2P signed managed-policy push for connected verified replica devices,
provider-gated Internet Pickup/Home Bridge delivery handoff, and protected redacted push
history rows are present. The command center now also surfaces the latest
redacted delivery attempt in each protected profile row so parents can see
whether the last send went by Send Update, Home Bridge, Internet Pickup, partial
delivery, no-link, or unavailable send path without opening raw policy state.
The command center now includes a compact parent-facing protection strip, a
parent-reauthed Internet Pickup endpoint
configuration row, plus labeled Delivery/Device/History row details so parents
can scan `Send Update ready`, `Later Pickup set up`, same-network bridge setup,
re-pairing, conflicts, and history without reading raw policy state. Bulk local time-limit
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
controls, hides unconfigured Internet Pickup/Home Bridge setup, and uses row-level actions so
parents are not forced through advanced transport choices. Provider modals use
parent-facing wording only when an existing provider is being edited. The Help
page now includes plain-language Managed Parent Controls, time-finished, and
remote-update cards under Profiles/PINs. The runtime timeout and viewing-space
blocked overlays now reuse the bundled serene FilterTube hero video background
with a dark calm scrim while preserving the same lock/request authority.
Accounts & Sync is allowed while a parent is editing a protected profile, but
the banner now makes clear that this remains the parent/account authority
surface for pairing, history, and sending parent-approved updates; it is not a
child-authorized sync page.
Parent/account profiles can now set, change, or remove a protected profile's
switching PIN from the protected profile row after parent/account unlock. This PIN protects
entry into that protected profile and sibling privacy only; it does not become
parent/admin authority for policy, trusted links, time limits, rule edits, or
remote sends.
The first protected-device managed-link setup now defaults to a parent-facing
`Parent managed` behavior instead of a strict ask-every-time behavior: a saved
parent/caregiver source link uses fast reconnect, fixed protected-profile
targeting where required, matching signed updates while locked, and
profile-open update checks when a later-update provider exists. The stricter
`Ask on this device first` behavior remains available for families or
caregivers who want each later update to require local approval/unlock.
Issue 62 is now part of the managed-parent plan as a parent rule-library
feature: parents/caregivers should be able to import or subscribe to trusted
channel lists, preview the channels, apply a list to selected protected
profiles and Main/Kids surfaces, then send the resulting rule update to verified
devices through the existing managed-policy path. The normal dashboard wording
should say `Import List`, not expose provider/subscription authority language.
The first implementation slice now supports local pasted/text-file channel list
imports from the command center. It skips name-only rows for safety, applies
valid channel identifiers through the existing profile channel-rule arrays,
writes protected redacted `policy.channel_list.import` history rows, and can
offer the same signed verified-device send used by manual channel edits.
The reversible materialized-row slice now supports `Remove List` from the same
command center. It removes only rows tagged with the imported list's
`managedListId`, keeps manual channel rules intact, writes protected redacted
`policy.channel_list.remove` history rows, and can offer the existing
verified-device send path.
The command-center visibility slice now shows imported list status directly on
protected profile rows: each profile with materialized list rows gets a compact
`N lists (rows)` chip and a `Lists` detail line naming the first imported
lists. This is display-only and derives from saved row metadata; it does not
change blocking, whitelisting, import, remove, or verified-device send
authority.
The URL source slice now lets a parent/account profile load a public HTTPS list
URL into the same import preview box. GitHub `blob` URLs are normalized to raw
content URLs, CORS-capable hosts can be fetched without adding broad extension
host permissions, and the row metadata records `managedListSourceUrl` for
manual refresh plus later subscription work. A URL source is still only data: the parent must
preview, choose protected profiles/surfaces, unlock, and apply before any rule
changes.
The URL refresh slice now exposes `Refresh List` only for imported lists that
have saved `managedListSourceUrl` metadata. Refresh loads the saved public HTTPS
source, preserves the parent-approved `managedListId`, replaces only matching
list-derived rows on selected protected profiles, writes protected redacted
`policy.channel_list.refresh` history rows, and can offer the existing
verified-device send path. It is not a background subscription scheduler yet.
The command-center consolidation slice now presents a single `Lists` action for
import, manual refresh, and remove tasks. This keeps the parent-facing row short
while preserving the same underlying parent/account unlock, protected-history,
and verified-device send paths.
The first read-only library slice now adds `View Lists` inside the same `Lists`
chooser. It shows list name, source label, URL-backed/local status, channel
count, selected-profile count, and Main/Kids surfaces without exposing rule
contents or creating mutation authority.
The reversible enablement slice now adds `Pause List` and `Resume List` to the
same `Lists` chooser. Paused rows keep their `managedListId` and source
metadata for history, library visibility, removal, refresh, and verified-device
send, but runtime channel compilation and channel-derived `filterAll` keywords
skip rows marked `managedListPaused`. This makes list disablement real
enforcement state rather than a cosmetic dashboard flag.
The source-version visibility slice now stores `managedListLastCheckedAt` and
`managedListContentHash` on list-derived rows. The `View Lists` library and
command-center row details can show a compact last-checked/source-hash summary
without exposing plaintext list contents or treating the URL as authority.
The parent-triggered batch refresh slice now adds `Refresh All URLs` when
multiple saved URL-backed lists are present. It loads each URL-backed source,
shows the parent counts before any write, leaves failed sources unchanged,
replaces only matching list-derived rows after parent/account re-auth, records
`policy.channel_list.refresh` history, and can use the existing verified-device
send offer for changed profiles.
The app-contract parity slice now records managed channel lists in
`managed-app-policy-contract-v1.json` so downstream apps preserve list-derived
row metadata, skip paused list rows during native channel enforcement, keep
manual channel rules separate, and do not treat public list URLs as authority.
The stale-source parent hint slice now marks URL-backed lists older than seven
days as needing refresh in the command-center row and read-only list library.
Parents can choose `Refresh Stale URLs` to refresh only those loaded stale
sources after parent/account re-auth. This is a dashboard maintenance hint, not
a background subscription scheduler or runtime YouTube hot-path task.
The external-list compatibility slice now keeps optional source metadata from
plain-text list comments, such as title, version, and last-modified labels. The
parent library can show this compact context beside the source label, checked
date, stale hint, and content hash. The metadata helps a parent recognize the
upstream list revision they imported or refreshed; it is not policy authority
and does not remove the preview, re-auth, profile selection, or verified-device
send requirements.
The parent-clarity row layout slice renames the dashboard panel to `Family
Controls`, shortens transport-heavy status labels, and groups each profile's
delivery/list/request details into one stable details column. The follow-up
workflow strip now makes the parent path explicit: choose a profile, set rules
and time, then pair or send only when another device needs the update. This
keeps the parent model direct and prevents mailbox/LAN/provider language from
becoming the first mental model. The change does not add authority; it only
reduces copy and layout pressure in the Accounts & Sync surface.
The trusted-device status wording now follows that same parent model: the
visible card says `Control`, `Automatic saved updates`, and `Delivery receipts`
instead of `Direction`, separate `Open sync`/`Local network` rows, and raw
remote delivery wording. `Automatic saved updates` can still report `Internet
Pickup` and `Home Bridge` details when those optional providers are involved. Protocol
names such as mailbox, local-network, provider, candidate, and ack remain in
code, advanced docs, and tests where they describe exact transport boundaries;
they are no longer the first label a parent has to understand.
The Family Device Updates delivery-path strip now keeps the same parent model on
the pairing surface itself: `Live update` is the default path when both devices
are open. The first screen now says `If the other device opens later`, `Later
over internet`, and `Same network` instead of leading with provider names. Setup
buttons now use `Set Up Later Pickup` and `Set Up Same-Network Bridge` so the
parent sees the task before the transport name. If Internet Pickup or Home
Bridge is already configured, the disclosure opens automatically to keep that
existing send path visible. The strip is status and setup navigation only; it
does not create hidden background sync, LAN discovery authority, or YouTube
runtime work.
When Internet Pickup or Home Bridge is configured, the same disclosure can show
`Check waiting parent updates` for a protected-device profile that has already
saved a trusted parent link. That button only runs the existing manual
`manual_saved_update_check` Internet Pickup/Home Bridge receive paths; it does
not let the service, network, or UI bypass trusted-link validation, target
profile matching, scope, revision, hash, signature, or local apply gates.
Trusted-device cards also keep policy and transport readiness separate:
`Automatic saved updates` can be enabled on a saved parent link, but the manual
check stays disabled as `Set Up Pickup First` and reports `Needs pickup setup`
until a configured Internet Pickup reader or Home Bridge discovery provider is
available. Live Send Update remains the normal path when both devices are open.
The subscription-check slice changes URL-backed list refresh semantics from
blind replacement to hash-aware checking. When a checked URL returns the same
source hash, Family Controls updates last-checked/source metadata and writes a
protected history row, but leaves channel rows and remote send prompts alone.
When the source hash changes, the existing parent re-auth refresh path replaces
only matching list-derived rows and can offer the verified-device send path.
The channel-source visibility slice adds Main and Kids channel-management source
dropdowns for `All sources`, `Manual`, `Imported lists`, and individual saved
managed lists. List-derived channel rows now show a compact `List: ...` badge so
parents can see where an entry came from without opening Family Controls or
reading raw metadata. This is a visibility/filtering aid only; edits, deletes,
pause/resume, Kids application, and verified-device sends still use the existing
parent/account authority paths.
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
- verified child/protected-device link readiness for Send Update, Home Bridge,
  or Internet Pickup delivery.

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
| Send path unavailable | Show the verified device but explain that the send path is unavailable when no built-in Internet Pickup/Home Bridge provider is available. | Last accepted policy remains active; no weaker fallback applies. |
| Sync conflict | Future transport UI should show conflict/rejected state from protected history. | No clear-history control. |

## UI Boundaries

- The status line is read-only.
- Command-center action buttons are action intents only. They do not carry
  payloads, rule values, policy JSON, private keys, or direct mutation authority.
- Empty-state setup buttons are also action intents only. The parent-facing
  label is `Create Protected Profile`, and it routes to the existing protected
  child-profile creation flow without changing its parent/account unlock
  requirements. `Create Account` keeps its Master/default unlock boundary.
- Help uses protected-profile wording for the parent-facing model while keeping
  the storage/runtime `child` type as an implementation detail. The profile PIN
  is described as switching/privacy protection only; parent/account/Master
  unlock remains the rule, sync, time-limit, and profile-management authority.
- Bulk command-center buttons carry only selected protected profile ids, action
  name, scope, and `sensitiveAction: true`; the dashboard runtime still prompts
  for parent/account re-auth and builds one policy revision per target.
- After a selected-profile keyword/channel/video-ID bulk write, the runtime can
  offer an immediate verified-device push for only the matching granular rule
  scope. The parent chooses Main or Kids through an explicit button choice, not
  a typed prompt. That send binds the parent-selected Main/Kids surface instead
  of reading the visible Nanah granular-surface selector.
- Managed channel-list imports should use the same delegated action model as
  selected-profile channel writes. The command center may expose `Import List`
  for one or more selected protected profiles, but the helper must pass only
  selected profile ids and action intent metadata. The dashboard runtime still
  parses/previews the list, prompts for parent/account re-auth, writes one
  profile revision per target, and offers a normal verified-device send.
- The first local import slice accepts pasted text or a local text-like file.
  It normalizes `UC...`, `@handle`, `/channel/UC...`, `/c/name`, `/user/name`,
  and YouTube channel URLs. Rows that only provide display names are skipped
  because they are weaker identity and could false-hide content.
- `Remove List` is the first undo path for list imports. It is not yet the final
  subscribed-list enable/disable overlay, but it gives parents a one-action
  reversal for materialized imports and prevents hundreds of manual deletes.
- The list UI should feel like a small library, not a transport console:
  `Lists`, `View Lists`, `Import List`, `Preview`, `Apply to profiles`,
  `Refresh List`, `Remove List`, `Send Update`. Source URL, revision hash,
  stale refresh state, skipped malformed rows, and delivery details belong in
  compact preview/history details rather than first-screen copy.
- URL-based channel lists are data sources only. They do not create authority,
  trusted devices, or remote admin rights. The current UI supports local
  pasted/file import, public HTTPS URL load into preview, and parent-approved
  manual refresh for saved URL-backed lists. Scheduled subscription refresh and
  enable/disable overlays remain future work.
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
- When a parent grants extra time while the target profile has an unresolved
  protected `policy.time_limit.request_extra` row, the resulting
  `policy.time_limit.update` history row includes only a redacted
  `resolvedRequestCount` marker. This explains that the grant answered the
  visible request without storing a child message or making history authority.
- Normal viewing-space and time-limit saves also offer the same scoped
  verified-device push when the changed protected profiles have delivery ready.
- `Send Update` and `Send selected updates` use saved managed Source -> Replica
  links only. A live connected verified replica receives signed envelopes over
  Nanah immediately. Optional Internet Pickup/Home Bridge providers receive ciphertext items or
  signed local-network candidates only when those provider hooks exist.
- Internet Pickup and Home Bridge setup rows are explanatory transport controls only and remain
  hidden from the normal parent command center unless a provider is already
  configured. The visible parent workflow is protected profile -> rules/access/
  time -> verified-device Send Update. Internet Pickup and Home Bridge providers
  remain optional advanced delivery hooks, not the default parent path.
- The Delivery row preview is a redacted status summary only. It can say Send Update ready, Later Pickup set up, Same-network bridge set up, Send path unavailable, Re-pair
  trusted device, Refresh trusted device, Review conflict first, or Pair only for another device;
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
- `Set Up Later Pickup`/`Edit Later Pickup`
  save or clear only the encrypted pick-up-later endpoint configuration after
  parent/account re-auth. They do not create a sync account, publish rules,
  expose tokens in the UI, or turn the mailbox server into policy authority.
  Status, history, and provider checks can still identify the precise transport
  as Internet Pickup.
- `Set Up Same-Network Bridge`/`Edit Bridge` save or clear only the explicit
  same-network bridge endpoint configuration after parent/account re-auth. They
  do not create authority from network reachability, expose tokens in the UI, or
  let a LAN gateway choose profiles/rules. Status, history, and provider checks
  can still identify the precise transport as Home Bridge where that precision is
  useful.
- Send-path setup copy uses parent/user language and avoids presenting revision,
  hash, or signature details in the decision modal. Audit docs retain those
  proof details; the product surface says that protected devices accept only
  trusted parent updates.
- First-time and manual managed replica/source link setup use parent-facing
  wording: `Save Parent Control Link`, `Parent managed`, and `Ask on this
  device first`. The default protected-device policy is `Parent managed`, which
  still writes only a trusted-link policy and does not bypass trusted link,
  target profile, scope, revision, device binding, or signature validation.
- Checking for parent updates on profile open now writes an eligible protected
  profile policy even when the target is an independent protected account
  rather than a child profile; the policy stores `allow_trusted_updates` only
  when the profile-open check is enabled.
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
- A protected-profile PIN is a profile-switching lock. It may unlock entry into
  that profile and the receive-only protected Accounts & Sync surface, but it must
  not authorize rule edits, viewing-space changes, time-limit changes, trusted
  parent links, managed sends, backups, imports, exports, or provider config.
- Parent/account or Master PIN is the policy-authority PIN for protected
  profile edits. Parent/account profiles can set or remove a protected profile's
  switching PIN from the protected profile row only after parent/account re-auth.
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
runtime managed command-center latest history source labels: present for Parent edit, Approved list, Remote update, Send Update, Internet Pickup, Home Bridge, trusted-device, admin-access, and history rows
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
runtime managed command-center parent-facing provider route guidance: present for Send Update, encrypted later mailbox delivery, and same-network gateway delivery
runtime managed command-center focused conflict review: present as parent-reauthed redacted history filter
runtime managed command-center blank mailbox endpoint disables provider config: present after parent re-auth
runtime managed command-center post-rule-write granular verified-device push: present with selected surface binding
runtime managed command-center post-viewing/time-limit verified-device push: present
runtime connected verified-device live P2P managed policy send: present
runtime provider-gated Internet Pickup/Home Bridge delivery handoff from command center: present
runtime Family Device Updates later-delivery disclosure: present and auto-opens only for configured Internet Pickup/Home Bridge providers
runtime Family Device Updates manual waiting-update check: present through existing manual_saved_update_check receive helpers and saved trusted parent-link eligibility
runtime automatic saved-update checks on dashboard/profile open: present through a non-blocking gated helper for matching protected-device receive targets or source-side delivery receipts
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
| Managed profile selection | See each protected profile, owner relationship, current lock state, verified-device readiness, last policy revision, and one stable details column for delivery/list/request status. | Child/protected views still hide admin controls and detailed history. The `Family Controls` label is parent-facing copy only; authority remains the existing managed-profile gates. |
| Protected edit on Accounts & Sync | When a parent opens Accounts & Sync while editing a protected profile, show a compact boundary strip: rules/time/history/send target the protected profile through Family Controls, device trust remains parent-owned, and the profile PIN is only a switch lock. Global account policy, create-profile, and Master PIN controls are disabled until the edit session ends. | This does not make the protected profile an account administrator. Nanah pairing and Send Update still require parent/account authority; global admin controls resume only after `Done editing`. |
| Protection scan strip | Quickly see protected profile count, sync-ready profiles, profiles needing setup, time requests, and remote conflicts before acting. Copy avoids provider-first language: local control works now, and pairing is only needed when updates must reach another device. | Strip values are aggregate status only; they do not include rule text, policy payloads, keys, or mutation authority. |
| Rule editing | Command-center row actions still enter the existing managed protected-profile editor, selected-profile bulk controls can hand off one selected protected profile to the same editor, and selected-profile bulk keyword/channel/video-ID additions can apply one reviewed rule to selected protected profiles. Parent/caregiver bulk rule writes choose YouTube Main or YouTube Kids with explicit buttons before value entry. Changed profiles with verified delivery can then push the matching rule scope immediately. | Writes must use the same validated local/remote managed-policy paths as current FilterTube controls; bulk rule writes require review confirmation, parent/account re-auth, per-target revision/history rows, selected Main/Kids surface binding for granular sends, and no child authority. |
| Managed filter lists | Parent can use one `Lists` action to view imported-list summaries with title/version/last-checked/hash/source-format metadata, import pasted/file/public-HTTPS channel lists, import simple JSON lists with channel arrays, preview valid rows, apply them to selected protected profiles and Main/Kids surfaces, see compact list status, filter Main and Kids channel pages by `Manual`, `Imported lists`, or one saved list, pause/resume saved lists, see stale URL-backed list hints, use the row-level `Check Lists` action when a protected profile has stale URL-backed lists, check one/stale/all saved URL-backed lists manually, refresh changed source hashes, send checked freshness/status metadata to verified devices even when rule rows are unchanged, remove list-derived rows without touching manual rules, and push resulting channel policy changes to verified devices. Future UI should add scheduled subscription refresh. | A list URL/file/JSON document is only a rule source. It must not become authority, executable code, or an invisible global block. Parent/admin approval, source labeling, source-format labeling, display-only source metadata, revision/hash metadata, hash-aware no-row-churn checks, disable/revert behavior, and protected action history are required. |
| Remote send | Parent can send one protected profile or selected protected profiles to saved verified devices and see whether the next attempt is live, later via Home Bridge/Internet Pickup, blocked by conflict, blocked by stale/revoked pairing, missing a verified device, or has redacted source-side delivery receipt feedback. Row copy now says `Pair to sync` / `Pair only for another device` so parents do not read Internet Pickup/Home Bridge as required setup. The row also shows the latest redacted send attempt from protected history so parents can see success, partial delivery, no-link, and unavailable-send-path outcomes without opening the detailed history modal. | Delivery links, preview labels, latest-attempt labels, and ack labels are not authority; each envelope still requires Source -> Replica trust, fixed target profile, allowed scope, signature/integrity proof, and newer revision/hash. |
| Conflict review | `Review Conflict` opens a parent/account re-authed conflict review modal that filters history to conflict and rejected remote-policy rows first. | This is read-only redacted history triage; it does not resolve, clear, merge, retry, or accept policy. |
| Internet Pickup | Parent can configure, edit, or clear the HTTPS pick-up-later endpoint from the command center after parent/account re-auth. | The endpoint stores only encrypted pending-update rows and metadata; it cannot read policy, choose targets, bypass trust, or become authority. |
| Viewing spaces | Show Main, Kids, both, or neither per protected profile; row actions still change policy and selected-profile bulk actions can apply Main + Kids, Kids only, or Main only locally, then offer a scoped verified-device push when delivery exists. | UI choice is not authority; runtime route gate remains the enforcement layer; every selected target gets its own redacted revision/history row after parent re-auth. |
| Time limits | Show daily YouTube budget state; command-center row actions still set/disable one profile, can add temporary extra time to one active limit, and bulk selected-profile actions can apply the same daily budget, disable existing limits, or add temporary extra time to selected active limits, then offer a scoped verified-device push when delivery exists. Daily limits now use preset choices for 30 minutes, 1 hour, 2 hours, parent-approval/0 minutes, or custom minutes; extra-time grants use 15 minute, 30 minute, 1 hour, or custom choices. | Runtime budget accounting remains background-owned; every target gets its own revision/history row after parent re-auth, zero-minute daily limits remain valid immediate-timeout policies, and extra-time grants are bounded by expiry. |
| Sync status | Show trusted device, delivery preview, Home Bridge, Nanah open-sync, and Internet Pickup status. | Reachability is never authorization; offline state keeps the last valid policy active. |
| Action history | Show accepted, rejected, conflict, failed-auth, and expired-session counts/latest labels. Latest labels include the safe source category, such as Parent edit, Approved list, Remote update, Send Update, Internet Pickup, Home Bridge, trusted-device, admin-access, or history, so parents can tell whether a change was manual/list-derived/remote/sent without opening raw policy data. Detailed history remains gated by the History action. Time-limit updates and protected extra-time requests show redacted daily budget, used/remaining time, Main/Kids surface, date, parent-grant counts, and whether a parent grant answered a pending request. | History stays redacted, protected by parent/account re-auth, and never becomes policy authority. Source labels are display context only and cannot grant delivery, rule, profile, or trust authority. |
| Multi-profile apply | Present for selected-profile rule editor handoff, same-budget local time-limit changes, same-access local viewing-space changes, selected-profile keyword/channel/video-ID rule additions, and selected-profile signed-policy sends on selected protected profiles. The command center groups selected-profile actions into Rules, Send, Time, and Access so parent/caregiver bulk work stays scannable without adding a separate page. | Local bulk rule writes are one reviewed rule at a time and every local or remote target still needs its own target profile, revision/history row, and authority gate; remote sends additionally require trusted link, scope, revision, hash, and signature/integrity proof. Group labels are navigation aids only and do not create authority. |

Required UI states for that slice:

- empty managed profile list;
- locked parent/account session;
- successful local save status through row summaries/history;
- pending P2P/local-network delivery;
- connected verified-device send success;
- redacted latest delivery attempt feedback for Send Update/Home Bridge/Internet Pickup/partial/no-link/unavailable-send-path;
- redacted source-side delivery ack status;
- unavailable send path when the extension has no Internet Pickup/Home Bridge provider hook;
- configured, invalid, and disabled mailbox endpoint states;
- offline trusted device;
- rejected or conflicted remote update;
- failed provider/mailbox pull through protected history/status labels;
- time limit exhausted via the runtime timeout overlay, including the serene
  video background, a plain-language protected-user pause state, and a
  `Request more time` path that saves a parent-review request without granting
  authority or dismissing the lock;
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
  follow-up Send Update confirmation pushes only the matching keyword/channel/video
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
