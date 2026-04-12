# Nanah Post-Implementation Concerns Tracker

## Purpose

This document captures the concerns raised after the original Nanah `Implementation decisions required next` phase.

It exists so we can track:

- what concern was raised
- what is already implemented
- what is only partially addressed
- what remains an explicit product decision
- what the next action should be

Status keys used below:

- `Done`
- `Partial`
- `Open decision`
- `Future`

## 1. Nanah page layout and readability

| Concern | Current status | Current state | Next action |
| --- | --- | --- | --- |
| Sync page too cramped | `Partial` | Shell width, Nanah card spacing, intro flow, and panel stacking were improved. | Keep refining with live screenshots after reloads; remaining issues are visual tuning, not missing structure. |
| Step numbering / overlap / bad alignment | `Done` | Step strip was rebuilt into proper step cards with cleaner numbering and spacing. | Only revisit if a new responsive break appears. |
| Setup form overlapping session-state card | `Done` | Left setup panel now stacks status below the setup/actions block instead of beside it. | Verify across medium laptop widths in manual QA. |
| Sync controls not using custom dropdown feel | `Partial` | Nanah controls were routed into the existing selection system styling, but still need ongoing polish parity with the rest of the extension. | Keep harmonizing hover/focus/disabled states during future UI passes. |
| Buttons/hover feedback felt weak | `Partial` | Button states were improved, but this is still a taste/consistency pass, not a completed product decision. | Continue as part of global extension design cleanup. |
| Help page spacing / alignment weak | `Partial` | Help copy and clusters were improved, but page-wide rhythm may still need design refinement. | Continue with broader help-page visual QA. |

## 2. Managed-link trust behavior

| Concern | Current status | Current state | Next action |
| --- | --- | --- | --- |
| First-time managed-link creation needed a better receiver approval sheet | `Done` | Replica now gets a dedicated managed approval sheet instead of only the generic peer merge/replace prompt. | Validate with parent/replica device tests. |
| Managed-link editing UI needed to exist inside trusted cards | `Done` | Trusted managed links now expose `Edit Policy`. | Continue improving clarity, not core behavior. |
| Allowed scopes needed to be explicit per link | `Done` | Managed links now store and edit `allowedScopes` and `defaultScope`. | Validate sender/receiver blocking on mismatched scopes. |
| Trusted cards needed to explain policy clearly | `Done` | Cards now show direction, allowed scopes, default scope, apply mode, and auto-apply state. | Keep if useful; condense later only if it becomes noisy. |
| Sender-vs-receiver authority needed to be defined clearly | `Done` | Peer/untrusted = receiver decides. Trusted managed source/replica = saved managed policy decides. | Preserve this as a core invariant. |

## 3. Session lifecycle and refresh behavior

| Concern | Current status | Current state | Next action |
| --- | --- | --- | --- |
| Refresh breaks the live connection | `Done` | This is the current expected behavior. Refresh ends the live WebRTC session. | Documented; future reconnection UX can improve but should remain explicit. |
| Trusted devices should persist even if the live session ends | `Done` | Trusted links persist in local extension storage. | Consider future reconnect shortcuts; do not imply live-session persistence. |
| Reconnect after refresh feels unclear | `Partial` | Docs now explain that refresh ends live pairing while trust remains saved, and trusted-device cards expose `Reconnect` to start the next fresh session with saved defaults. | Keep tightening the cross-device handoff copy so users do not mistake reconnect for background sync. |
| Need clarity on whether relay compute stays active forever | `Done` | Docs now state the relay is intended for short-lived signaling and low-duty coordination only. | Later optimize immediate signaling shutdown if needed. |
| Saved trust looked like it might mean always-on parent -> child sync | `Done` | UI/docs now explicitly state trusted links remember policy for later live sessions only; they do not keep a background connection alive. | Keep this wording explicit in future mobile/native clients too. |
| Need a practical reconnect shortcut after trust | `Partial` | Trusted-device cards now expose `Reconnect`, which starts a fresh live session with the saved role/policy defaults. Managed links also persist `fast` vs `approval-needed` reconnect policy. | Future work: make reconnect smoother across devices without implying hidden background sync. |
| Approval-needed reconnect needed to be enforced on the replica side | `Done` | Managed source -> replica links with `approval-needed` now block incoming managed updates until the replica approves that reconnect for the current session. | Preserve this as the child-safe reconnect path. |
| Sender needed to see the same saved managed link after the receiver approved it | `Done` | First managed `Apply + Save Managed Link` now mirrors the managed-link record back to the sender side as well, so both devices keep the same saved relationship. | Keep source/replica trust records symmetric for later reconnect UX. |

## 4. Pairing code / self-join behavior

| Concern | Current status | Current state | Next action |
| --- | --- | --- | --- |
| Using the same live pairing code in the same device/browser should not silently fail | `Done` | FilterTube blocks reuse of the currently active code in the same UI session, and Nanah signaling now rejects same-device join attempts at the relay level. | Preserve the relay/client guard in future native clients. |
| Same-device self-join should show a clearer error | `Done` | The client now surfaces a specific same-device join error instead of a generic invalid session failure. | Keep wording aligned across desktop/mobile surfaces. |
| Same-device self-join appeared to burn the code for the real second device | `Done` | Nanah signaling now rejects same-device joins before occupying the host session, so the real second device can still join afterward. | Validate end-to-end on desktop browsers after reload. |
| A second join should not silently replace an already connected peer | `Done` | Nanah signaling now rejects joins when a peer is already attached to that code. | Keep this invariant when reconnect flows evolve. |

## 5. Device identity and live-session mutability

| Concern | Current status | Current state | Next action |
| --- | --- | --- | --- |
| Device label changed after connect but did not update remotely | `Done` | Device label is now locked for the life of the current session. Changes are for future sessions only. | Keep this rule; do not pretend live identity mutates after handshake. |
| Relationship changed after connect but did not affect the active session | `Done` | Relationship field is now locked during the live session. | Keep this rule; role is part of session identity. |
| Trusted links needed a stable device identifier across sessions | `Done` | Nanah device identity is now stored locally instead of using a fresh per-session random ID. | Preserve this across future native clients too. |

## 6. Role combinations and trust warnings

| Concern | Current status | Current state | Next action |
| --- | --- | --- | --- |
| `Source + Peer` could connect but not be saved, which was confusing | `Done` | Warning now explains that only `Peer + Peer` and `Source + Replica` are valid trusted combinations. | Keep the temporary-pair / invalid-trust distinction explicit. |
| Role compatibility needed to be defined more clearly | `Done` | Product spec and Help now define temporary combinations vs trusted combinations. | Preserve in future native/mobile clients. |

## 7. Master / account / child authority model

| Concern | Current status | Current state | Next action |
| --- | --- | --- | --- |
| Need clearer distinction between Master, independent account, and child profile | `Partial` | Model is now documented in FilterTube docs and Nanah spec. | Turn documentation into stricter enforcement where appropriate. |
| Independent accounts may have their own children | `Partial` | Current profile system already supports accounts owning children via `parentProfileId`. | Decide whether more child-specific restrictions should apply equally under Master-owned and account-owned children. |
| Child profiles should not behave like normal admin surfaces | `Partial` | Locked child profiles are replica-only for Nanah sending/trust behavior, unlocked child profiles may send only their own scoped snapshot, core account-management actions are disabled in Accounts & Sync / Settings, and unlocked child surfaces cannot rename/delete profiles or mutate trusted parent-link policy from the Accounts & Sync view. | Extend this into any remaining profile-management or restore surfaces where policy requires it. |
| Child profiles should not expose broad backup/import/export/admin actions | `Partial` | Child profiles now disable core backup/import/export/account-admin actions in Settings. | Continue reducing child surfaces where policy requires it. |
| Need a parent-oriented model, not only a single-user sync model | `Partial` | Product/docs now treat child as managed surface and parent/source as authority path. | Continue converting this into enforcement rules across the wider UI. |
| Need clarity on whether child-device behavior is child-profile-based or device-wide | `Partial` | Current rule is profile-based: if the active profile is a locked child profile, Nanah becomes replica-only for that UI session; if it is an unlocked child profile, it may send only that child profile's scoped snapshot. | Decide whether future device-wide child mode should exist beyond the active-profile rule. |

## 7B. Remote profile targeting and mapping

| Concern | Current status | Current state | Next action |
| --- | --- | --- | --- |
| Sending profile `B` to a device currently active on profile `A` was ambiguous | `Done` | Docs/UI now state that v1 non-`full` sync applies to the receiver's current active profile only. | Keep warning users before send when remote active profile differs. |
| Need explicit remote profile mapping so `B -> B` works across devices with multiple profiles | `Done` | Managed `source -> replica` links on the receiving device can now choose `Current active profile` or `Always this local profile`. The fixed option pins the link to a specific local profile so later updates can land in `B` even if some other profile is active when the session reconnects. | Keep the model explicit and local; do not add automatic same-name guessing across devices. |
| Need sender visibility into the receiver's current active profile | `Done` | Live Nanah hello/session UI now surfaces the receiver's active profile context. Managed replica links also expose a fixed receiver-side target during the live session when that link pins one local profile. | Preserve this in future mobile/native implementations. |
| Parent/source needed to choose a remote child profile directly instead of relying only on the receiver's active profile | `Done` | Live sessions now exchange remote profile inventory and expose a sender-side `Remote target profile` picker so parent/source can aim a sync at a specific remote profile during the session. | Later simplification pass should hide this inside a clearer parent-control flow instead of exposing it as a raw sync control. |

## 8. PIN protection and child safety

| Concern | Current status | Current state | Next action |
| --- | --- | --- | --- |
| Kids must not learn or type the parent PIN for ordinary managed updates | `Done` | PINs remain local; Nanah never transmits reusable PIN material. | Preserve as non-negotiable rule. |
| Need parents to update child devices without exposing PIN | `Done` | Trusted managed `source -> replica` links can now save a local child-device rule that allows matching parent updates to apply while the child profile remains locked. The PIN still stays local and is never shared with the parent device. | Preserve this as a local child-side permission only. |
| Locked profiles should remain protected | `Done` | Locked profiles still gate views and mutations by default. Managed child links now also support a `Strict child protection` preset that forces approval-needed reconnect, no auto-apply, fixed local target, and local unlock required. | Keep this as the highest-safety preset for parent-managed child links. |
| Need to prevent kids from modifying parent-decided rules | `Done` | Current lock gate blocks restricted views and mutations while locked; child Nanah role is replica-only; unlocked child surfaces now also block profile rename/delete/PIN mutation, account-policy changes, backup import/export, and trusted parent-link edit/remove from Accounts & Sync. | Preserve the defense-in-depth model; future additions should default closed for child surfaces. |

## 9. Backup, uninstall, and trusted-link persistence

| Concern | Current status | Current state | Next action |
| --- | --- | --- | --- |
| Need to know whether trusted links are included in normal backups | `Done` | They are not included in normal/plain FilterTube export/import payloads. They are only included in encrypted full-account backup when the admin-grade recovery path is used. | Keep normal/plain exports trust-free by default. |
| Trusted-link backup should not become casual plaintext leakage | `Done` | Product docs now recommend against including trusted links in casual plaintext export. | Keep this as the default rule. |
| Uninstall/reinstall loses local trusted-link state | `Done` | This is the current expected behavior because trusted links are local extension state. | If needed later, design explicit encrypted restore for trusted links. |
| Need a strong restore story for parent-control reinstall cases | `Done` | Encrypted full-account backup can now carry Nanah trusted-link recovery data, and import asks whether to restore trusted devices/identity for same-device recovery. | Keep the restore prompt explicit so users do not clone a device identity onto a different device by accident. |

## 10. Help and product-spec alignment

| Concern | Current status | Current state | Next action |
| --- | --- | --- | --- |
| Help page needed managed-link docs | `Done` | Added managed-link, backup, refresh, parent/child, and PIN notes. | Keep updated as behavior evolves. |
| Product behavior spec needed refinement beyond the early model | `Done` | `PRODUCT_BEHAVIOR_SPEC.md` now includes current implementation, pending items, trusted-link persistence, and authority model notes. | Continue treating it as source of truth. |
| Need one place showing what is done vs remaining | `Done` | This tracker is that document. | Keep it updated after every major Nanah/parent-control change. |

## 11. Current high-priority open decisions

These are the remaining product decisions that still need deliberate design, not just UI cleanup:

1. Are there any remaining child-visible admin surfaces that should still be reduced even when the child profile is unlocked?
2. How much further should reconnect go beyond the current fast / approval-needed fresh-session flow without becoming hidden background sync?
3. How aggressively should the current Nanah controls be collapsed into a simpler guided parent/peer UX so normal users do not have to understand every advanced policy option?

## 12. Recommended next implementation order

1. Simplify the visible Nanah UX into guided parent/peer paths with advanced controls hidden by default.
2. Add any remaining child-profile UI restrictions for sensitive settings/Nanah actions.
3. Keep reconnect copy and onboarding simple so saved trust is not mistaken for background sync.
