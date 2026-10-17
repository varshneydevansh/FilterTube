# Installed Account & sync acceptance — partial

Native UI inspection used a separate, signed-out Chrome profile named `FilterTube acceptance`, loading `/Users/devanshvarshney/FilterTube/dist/chrome`. Extension ID: `cllbijmimkbkbpmpbihgjgpcoigidbci`. No developer-console scripting or hidden storage inspection was used for these observations.

## Observed

- Created two synthetic protected profiles under Default: Acceptance child A and Acceptance child B. Renamed only A to Acceptance child A renamed; B remained unchanged.
- Opened A's Profile options. Rename, Delete, viewing access, time limit, History and profile PIN controls remained present. No deletion or PIN change was performed.
- Installed inspection caught CSS that visually placed Profiles before devices despite the DOM order. Corrected the section order and verified the rebuilt page with a screenshot: My Devices & Family is first, Profiles and Security follow.
- After rebuilding and reloading, the unused initial contextual review is absent. Pairing details and Connection options remain closed initially. Both child rows retain Switch, Edit Rules and Profile options. Family tools and bulk actions is closed after the rows.
- Edit Rules for Kids-only child A now opens Kids Mode directly, with `Editing Acceptance child A renamed as Default` and explicit local-save-versus-send copy. Default remains the active adult profile.
- Added synthetic Kids blocked keyword `acceptance-child-a-only` through that scoped editor. The UI showed one blocked rule and success; Account & sync recorded A's local Kids r1 and one accepted parent-edit history row.
- Opened child B's scoped editor. It showed `Editing Acceptance child B as Default`, zero blocked rules and `No keywords blocked`. B had no managed policy revision. Finished editing and returned to Account & sync as Default.
- Google Chrome for Testing became inspectable after the user's message. Native profile setup subsequently succeeded after rebinding the UI controls to each new window. Separate signed-out `FilterTube receiver acceptance` and `FilterTube parent acceptance` browser profiles now load the rebuilt extension. Their saved FilterTube data is isolated from personal browser profiles.

## Live personal-copy journey

Two isolated installed endpoints (Chrome acceptance and Chrome for Testing receiver acceptance) paired through the existing meeting service and WebRTC path on this one computer. The sending Default profile contained synthetic Main rule `acceptance-personal-copy`.

- Both endpoints displayed the same four-character code and safety phrase.
- Confirming the phrase on the receiver alone left Send disabled on the sender. Each endpoint required its own explicit confirmation.
- Send opened `Incoming FilterTube Sync` on the receiver naming Default (Master), with Merge/Replace/Decline choices. Cancelling showed `Incoming sync declined`; the receiver's Main list still had zero rules.
- Repeating Send and choosing Apply as Merge showed `Applied active settings`; the receiver's Main list then contained exactly the synthetic marker. This observed local UI result does not certify physical-network or all profile-scope behavior.
- Both endpoints still showed no saved trusted devices. One-time copy did not require saving permanent trust or creating a protected profile.
- End Session closed the other endpoint. Inspection caught generic messages falsely describing a completed connection as unfinished pairing; only those literal notices were changed to neutral connection-closed/stopped language.

## Receive-only display corrections

Switching an installed endpoint from adult personal mode to a protected profile correctly disabled Host/Send/Trust and parent administration, but initially retained outgoing wording. The map center, empty state, selected preview and target/session hint now describe receiving parent updates regardless of retained personal UI state. The rebuilt installed child page confirms the receiving center/empty copy; Enter parent code focuses its code field with the receiving-only session hint. Join, QR scan and QR image entry remain available.

Live-session tiles now use `Session device` / `Open session` instead of saved-device terminology. Phrase confirmation messages explicitly describe confirmation on this device; the client exposes no peer-confirmation flag. Three new localization keys and four explicit English fallback entries in each non-English catalog prevent older both-verified translations from overriding this correction. Existing translations were preserved; the added English entries are not completed translations.

After reload, the active child remained selected but the initial view changed to Help; opening Accounts & sync restored the receiving hub. The cause was startup's temporary Dashboard fallback overwriting the requested sync hash before route handling. Startup now retains that requested route and reapplies it through the existing access checks. Fifteen actual-router tests preserve child, adult, locked and self-control restrictions. The rebuilt installed child now reloads directly into Accounts & sync with receiving controls and disabled parent administration.

## Managed first-send failure reproduced

Using two isolated Chrome for Testing profiles, the parent Default created `Acceptance policy child`, entered its Edit Rules mode and saved Kids keyword `acceptance-managed-kids` (one visible rule, local Kids r1). The parent remained Default while editing that child, navigated to Account & sync, explicitly selected Family control, paired with the protected `Acceptance remote child` on the other endpoint, and confirmed the matching safety phrase on both endpoints. The session explicitly named Acceptance remote child as the receiving target.

Send Protected Update opened Save Parent Control Link on the receiver naming that child. Apply Once reported `Applied active settings once`, without saving a trusted link. Switching to the receiver's local Default and using Edit Rules for Acceptance remote child then showed **zero Kids rules**. The intended source child still had its marker. This contradicted successful selected-child transfer: the first portable send used the adult active snapshot rather than the scoped child being edited. The test session was ended before fixing and retesting below; an apply success toast alone is insufficient proof.

The same journey found that explicitly changing Copy once to Family control retained an obsolete personal hub/intent. The corrected explicit mode handler clears that selection without changing internal mode calls or authorization. The first parent-link approval also showed all advanced permission controls at once.

## Corrected managed first-send retest

Both isolated Chrome for Testing endpoints loaded the rebuilt packages. The source remained Default editing Acceptance policy child, whose Kids list still contained `acceptance-managed-kids`. Explicitly choosing Family control cleared the old Copy once selection and displayed the parent device hub. The receiving target was Acceptance remote child; both screens displayed and explicitly confirmed the same phrase.

- Send Protected Update opened a compact Save Parent Control Link approval naming Acceptance parent and Acceptance remote child. It explicitly distinguished applying once from granting future matching updates through a saved link.
- Update and saved-link options was closed initially. Expanding it exposed the existing area, default area, merge/replace, matching update, reconnect, pickup, fixed target, parent/review and locked-profile controls. Collapsing it returned to Decline, Apply Once and Apply + Save Parent Link.
- Review found the default update-area radio name was generated separately per option. A render crossing a millisecond could leave two options checked and return the older choice. One shared name per modal fixes the grouping; an advancing-clock actual-render test verifies selecting Time limits replaces Kids and returns the selected area. Defaults and permission semantics are unchanged.
- Apply Once reported success. The child row showed Kids-only access. Switching to the receiver's local Default and opening that child's Edit Rules showed exactly one Kids blocked rule: `acceptance-managed-kids`.
- Default's Main list still contained only `acceptance-personal-copy`. After ending the session and reloading, that parent marker and the child's separate Kids marker remained present. No permanent trusted link was saved.

The fix snapshots the selected child before asynchronous work, revalidates adult/source/recipient authority before sending, and exports only its portable settings. Twenty production-handler/adapter/import tests cover distinct receiver IDs, preserved local ownership/security and parent/sibling data, plus actor/source/session retarget races. The installed result proves this selected-child one-time path; it does not establish every saved-link or profile combination.

## Saved-link review prepared

The final build was paired again between the isolated Chrome for Testing parent and receiver profiles. Both screens matched and explicitly confirmed the phrase, the parent remained editing Acceptance policy child, and the receiving session fixed Acceptance remote child as its target. A new update reached the compact receiving approval. It remains at Save Parent Control Link; **Apply + Save Parent Link has not been pressed**. This would create persistent future-update authority, so the next UI action awaits explicit confirmation under the computer-use permission rules. Existing preset permissions include matching active-profile updates, quick reconnect, automatic pickup when configured, fixed child target, and allowing matching parent updates while locked. No permanent test link exists yet.

## Native keyboard follow-up

Without applying or saving the pending receiver approval, native Tab moved from
the last footer action to the closed options summary, then Decline and Apply
Once. Shift+Tab reversed that order and wrapped within the modal. Space opened
the summary, Tab reached the first enabled permission checkbox, and returning
to the summary with Shift+Tab and Space closed it without changing defaults.
The approval remained unsaved, with focus left on Decline.

On the paired parent page, selecting the live device moved focus to Review and
send. Escape returned focus to that device. Down reached Connection options and
Up reached the review action, demonstrating actual directional-key movement in
this layout. However, pressing Return on Review and send immediately produced a
new Sent toast, despite help promising that this action did not send by itself.
Only the synthetic pending test update was resent; no receiver approval or saved
link was granted. The three connected preview branches now open the existing
controls and focus the separate Send button; receiving and reconnect behavior
remain unchanged.

After rebuilding, both endpoints were refreshed and paired again. Selecting the
live device focused Review and send. Pressing Return on that review action
focused the explicit Send Protected Update button and produced no send toast.
The receiver still showed its ordinary receive hub, without an incoming approval.
Only pressing Return on the explicit Send button produced Sent active settings
and opened Save Parent Control Link on the receiver. That new approval remains
unsaved pending the previously requested confirmation. The stale and duplicate
test approvals were declined before this retest; no persistent link was created.

## Resumed saved-link acceptance

The user subsequently authorized continuing the isolated saved-link test. On
resuming native inspection, both endpoints already displayed the saved parent
link; the approval was no longer open. The agent did not press Save during that
resume. Receiver policy showed a fixed Acceptance remote child target and the
previously reviewed parent-managed defaults.

The source remained Default editing Acceptance policy child. Adding synthetic
Kids marker `acceptance-managed-repeat` produced two local Kids rules and local
Kids r2. Returning to Account & sync refreshed the saved-device tile, but the
verified-device count remained zero. Send Protected Update produced a receiver
rejection. Switching the receiver to its local Default and opening the child's
History showed `Remote policy rejected (wrong_link_id)` for viewing space.

An independent production-path probe reproduced the cause with distinct device
IDs: receiver save derived its link ID from the parent device, while the source
save derived its ID from the child device. A real Ed25519 signature validated,
but strict link-ID comparison correctly rejected the mismatched sender entry.
Tests that preseeded an identical link ID on both endpoints had missed this
handshake gap. The shared identity handoff is being corrected; strict receiving
validation must remain in place. A successful saved-link repeat is not yet
established by the installed test.

## Shared-link correction and fresh receiving profile

The production regression now covers the previously missing first receiver
save → decision → source save → real signed repeat, with real profile/trust
storage. New managed links derive one compact versioned identity from both
device IDs, the source parent ID and the fixed receiving profile ID. Existing
rows and IDs remain unchanged. Source adoption requires the matching pending
proposal, authenticated session, peer, adult authority, signing key and target.

Independent review reproduced two multi-parent gaps: a device-only lookup could
borrow another parent's/child's row, and duplicate-device detection could reject
two independently approved parents on one physical device. Exact managed context
matching and the known parent identity now distinguish these cases. Unknown
identities and true duplicate grants still fail closed. The new 31-case suite
exercises both parents updating the same child, then another child, with
independent signed revision state. This is executed production-function evidence,
not installed multi-parent acceptance.

A third signed-out Chrome for Testing profile, **FilterTube agreement
acceptance**, was created without an online account. Its device name is
**Agreement receiver**, with **Agreement child** owned by its local Default.
No existing profile or saved link was deleted or reset. The rebuilt parent,
still editing Acceptance policy child, paired with this fresh receiver. Both
screens showed and explicitly confirmed the same phrase. Explicit Send opened
the compact approval naming Agreement child, with options initially closed.
**Apply Once** succeeded; **Apply + Save Parent Link was not pressed**.

The receiving local Default's Edit Rules showed exactly
`acceptance-managed-kids` and `acceptance-managed-repeat` in Agreement child's
Kids list. Reloading the final build preserved both child rules and Kids-only
access. Default retained Main + Kids access and its own Kids list remained
empty. The send/apply occurred before the final duplicate-parent-only patch;
the persistence/isolation inspection loaded the final build afterward. This
fresh endpoint has no saved parent trust. A new persistent grant requires its
own action-time confirmation under the computer-use rules; the earlier
authorization concerned the existing Acceptance receiver link.

## Remaining limits

This proves only the listed local UI, one-computer live personal-copy, first selected-child managed apply and profile-isolation observations. Latest saved-link repeat delivery, multiple named parents, pending-update cancellation/revocation, real QR camera permission, physical LAN/NAT and TV/mobile interaction remain open. Earlier behavioral/installed traces and the helper loopback probe are separate evidence. No universal reachability or complete security claim follows from this check.

Earlier installed journeys preceded the later receipt/pickup integration described in INTEGRATED-REVIEW-2026-10-17.md. Current package-level validation: 585 combined behavior tests pass, all three browser packages build, locale catalog structure and duplicate-key validation pass, and 129 current runtime/catalog assets match all three ZIP archives byte-for-byte. The new receipt wrapper has actual-handler and HTTP/storage fixture evidence; its installed saved-link journey remains open. An earlier broader run before the startup-navigation regressions passed 402 of 410 checks; the eight archival audit failures were independently reproduced against unchanged HEAD source. Their expectations were not rewritten.

## Final route review and prepared saved-link approval

The 584-check build was loaded in the isolated parent and Agreement receiver. Both explicitly confirmed pairing code 5PJ4 and matching phrase raven-blue-1225. The source was Default editing Acceptance policy child; the route read `Managed rules: Acceptance policy child (by Default) → Agreement child on Agreement receiver`. Selecting the live tile focused Review; activating Review focused the separate Send Protected Update and did not open receiver approval. Explicit Send opened the compact receiver approval with its options closed.

The options were reviewed/prepared: active profile, Main, Kids, viewing access and time limits permitted; merge; fixed Agreement child; quick reconnect; matching parent-managed updates and locked-profile apply; automatic saved pickup where configured. Apply + Save Parent Link was not pressed. Specific action-time confirmation for this new persistent test recipient is pending; the earlier saved-link authorization concerned Acceptance receiver. This is preparation, not installed saved-repeat proof.

An earlier observation in this same 584-check build found the new route summary stale immediately after Edit Rules/navigation until Pair refreshed it. The final source correction uses the existing managed-banner hook; its actual-flow regression passes as part of 585 checks. The final correction was then retested in a separate tab of the same installed test profile: Edit Rules opened Kids; navigating to Account & sync and expanding Pairing details immediately showed Acceptance policy child (by Default), before Pair. Done editing immediately restored Default (by Default). The extra tab was closed and the original live pairing/receiver approval was preserved.

## Installed decline and receiving-child authority check

The prepared first Agreement child proposal was declined without saving trust.
Receiver showed `Incoming managed sync declined` and `No trusted devices yet`;
source showed `Agreement receiver declined the sync`. Then the source parent,
still editing Acceptance policy child, added the synthetic Kids-only marker
`acceptance-managed-decline` (Kids r3, three local rules), sent it, and the receiver
explicitly declined again. No persistent link was granted.

A separate receiving test tab attempted the Kids route while Agreement child
was active. The app redirected to Help rather than exposing rule-edit controls.
Through the ordinary parent switch and child's Edit Rules, the receiving parent
then inspected persisted rules: exactly `acceptance-managed-kids` and
`acceptance-managed-repeat`; the declined third marker was absent. Done editing
and the ordinary Switch restored Agreement child, and the extra tab was closed.
This verifies the distinct declined update did not alter the stored child rules;
it does not establish pending saved-link revocation/unlink behavior.

The source resent the same three-rule proposal after receiver inspection. The
new first-link approval is prepared again with exactly the permissions in the
pending confirmation (profile/Main/Kids/access/time, merge, fixed Agreement child,
quick reconnect, automatic saved pickup where configured, parent-managed and
locked-profile apply). It remains unsaved. Earlier expired/declined proposals
are not used to infer permission or successful application.

## Resumed saved-link acceptance and receipt failure

Following the user's `continue` at the prepared-link gate, the older proposal
was declined and the source resent it through the unchanged verified live
session. The receiver reviewed the same profile/Main/Kids/viewing/time scopes,
merge, fixed Agreement child, quick reconnect, parent-managed matching updates,
automatic pickup where configured, and locked-profile apply. Apply + Save Parent
Link was activated. Both endpoints acknowledged saved trust; source verified
count became one and the new Agreement child saved tile showed No sent policy.
No existing links or keys were removed, migrated or reset.

The source parent added `acceptance-managed-saved-repeat` as its fourth child
Kids rule (r4), selected the saved Agreement child tile and activated Send update.
The Review device update modal named Acceptance policy child → Agreement receiver
- Agreement child via Open now; its separate Send update dispatched the repeat.
Receiver parent inspection then showed all four child rules, including the new
marker. Parent's own Kids list remained empty after reload. This establishes
saved-link rule delivery for these isolated live endpoints on one computer.

Sender completion is still defective in this build: the tile waits for a send
receipt, and its native console reports `A newer update or receipt was saved for
this area. Review the device status and try again.` at the trusted-policy update
helper/queue. No injected browser code or hidden storage was used. The repeat
must not be described as a fully successful end-to-end status journey yet.
Actual-function reproduction found concurrent duplicate ACKs for one logical
scope/revision/hash with different receive timestamps spuriously conflicting.
A narrow production correction and regression are in progress.

The installed strip also exposed separate live/saved tiles for that exact child.
Argon Medium approved merging only a unique fully matched saved recipient while
retaining all different child/parent links. It called out focus stability when
presence changes; implementation must keep the saved tile identity/focus stable.
This was a text-contract review, not a live/code audit.

## Final corrected installed repeat and inactive fixed target

Both endpoints reloaded the 609-check build with saved trust intact. Source
Default edited Acceptance policy child and added a fifth Kids marker,
`acceptance-managed-receipt-fixed` (local Kids r5). Open Send Session on the saved
Agreement link created code 2832. Both endpoints displayed and explicitly
confirmed `falcon-quartz-7575`. The saved link reconnected without a new grant.
The source now displayed one Agreement child tile with Open now presence and
its saved receipt state; the separate old Acceptance receiver link stayed intact.

Saved tile → Send update opened Review device update with the exact source,
fixed child and Open now path. Its separate Send update delivered the fifth
marker and the source changed to Applied with `Agreement receiver applied the
managed policy`. Receiving-parent Edit Rules showed all five persisted child
markers; no first-link approval appeared on repeat.

Then the receiving local Default was left active, with its own Kids list empty.
Source added sixth marker `acceptance-managed-inactive-target` (local Kids r6).
Its live session explicitly reported remote active Default, while the saved
route still named Agreement child. The same saved review/send completed Applied.
Reloading the receiving parent retained its empty Kids list; parent Edit Rules
showed all six markers in Agreement child, including the distinct sixth marker.
Thus the fixed child received the repeat while inactive; Default was not updated.
The normal switch restored Agreement child and the inspection tab was closed.

On return, the source again displayed just one Agreement child tile. Clicking
it focused Send update; native Escape returned to that exact saved tile. The
source's freshly loaded console showed zero messages after the corrected two
repeats. Pairing details were closed afterward. This is one-computer installed
behavior, not physical LAN/NAT/mobile/TV acceptance or cryptographic proof of
receipt honesty. No existing identity/key/link was deleted, migrated or reset.

## Responsive viewport follow-up

Chrome's native device toolbar was used to inspect 360×800 and 768×800 CSS-pixel
viewports. The device tiles and long source → recipient summary fit horizontally;
phone controls stack and tablet tiles use the available columns. These are
extension viewport observations, not Android/iOS or physical TV acceptance.

At 360px the managed edit banner kept its copy and Done editing button in two
cramped columns. A scoped css/tab-view.css media rule at <=640px now stacks copy
and button, permits long-word wrapping, and keeps a full-width minimum 44px action.
No HTML, JS, text, authority or send behavior changed. The rebuilt extension was
reloaded, Edit Rules opened Kids through the native action, and the phone menu
returned to Account & sync: the banner then visibly used full-width readable
copy and a wrapped Done editing button below it. The 768px layout is outside this
rule. Native DevTools interactions on the page were performed at 100% scale after
an auto-scaled click missed its intended target; unintended disclosure opening
was corrected and no data mutation was made by that missed click. Device mode
and DevTools were closed, and advanced family controls were left collapsed.

All three browser packages were rebuilt after this CSS-only correction; the
previous 609 focused JS behavior checks were not unnecessarily rerun. Package
parity now includes css/tab-view.css, increasing coverage to 130 current assets
and 390 ZIP entries. All 114 catalogs remain included. Physical mobile/tablet/TV,
real camera and physical LAN/NAT acceptance remain open.

## Installed QR-image file-picker follow-up

The installed Chrome for Testing extension read two synthetic 400px PNG files
through its native Read QR image file picker. A valid
`nanah://pair?app=filtertube&code=ABCD` image filled ABCD, displayed
“QR read. Check the code, then choose Join Session.” and focused Join Session.
The visible session remained Idle / Not connected / No active pairing session;
no Join, send, trust-save or camera permission action was performed.

A second QR containing `https://example.com/?code=ABCD` displayed
“This QR is not a FilterTube pairing code. Use the QR on your other device.”
The existing code stayed ABCD, focus stayed on Read QR image, and the session
remained idle. Both saved device rows and their prior Applied/Rejected receipts
were unchanged. The synthetic code was cleared, Escape closed the reader, and
Pairing details was collapsed afterward.

An independent source review confirmed the image callback only validates and
fills the code and focuses Join Session. This adds installed browser/file-picker
evidence to the existing generated-QR decoder regression; it does not establish
camera, physical-device or network interoperability. No production code changed
in this follow-up. The image decoder briefly reuses camera-oriented scanning
copy before its final result; this minor wording refinement remains optional.

A fresh read-only device inventory still exposed only the Android TV emulator
owned by the other active native-app chat. Physical and downstream acceptance
gates above remain open; no native runtime was copied or emulator controlled.

## Post-storage-correction reload

After the sequential stale-cache fix, the integrated focused suite passed
612/612 and all three browser packages were rebuilt. Native reload of the source
acceptance dashboard retained Agreement child / Applied, the older Acceptance
remote child / Rejected, the local Acceptance policy child, and collapsed Pairing
details. No trust was created, removed or broadened in this installed check.
The actual two-page removal/usage regression was exercised in production-function
shared-storage contexts, not by deleting these installed acceptance links.

## Shared coordinator reconnect and seventh child rule

Both acceptance endpoints were reloaded after the coordinator was added. Their
normal startup completed using the native Chrome Web Locks API; saved identities
and links remained available. Source selected its existing Agreement child link,
opened its send session, and the receiver joined code 27EC. Both displayed
`meadow-apple-1113`; both explicit Phrase Matches confirmations were completed.
No new persistent grant or expanded scope was requested.

The existing six-rule policy was sent first. Then the source's normal parent
Edit Rules context saved a distinct seventh Kids marker,
`acceptance-managed-shared-storage`, into Acceptance policy child. Back at sync,
the source read-only line named that child and Agreement receiver / Agreement
child. The separate Review device update named the same fixed destination and
Open now path; only its explicit Send update dispatched. Source returned Applied.

After ending the receiving session, ordinary Switch to Default → Edit Rules for
Agreement child showed seven blocked rules including the distinct seventh marker.
Done editing → Default's own Kids list showed zero rules. The receiving child
was restored at Account & sync, pairing details were closed on both endpoints,
and the source parent finished managed editing. The old mismatched Acceptance
receiver link stayed present with Rejected; no installed trust was deleted,
reset, migrated or broadened.

Final source validation is 657/657 focused checks; all three browser builds pass
and match 132 current assets / 396 archive entries. The installed run exercised
coordinator-backed startup, signing and trust bookkeeping, not an intentionally
overlapping browser-window removal or backup restore. Those overlap regressions
use separate production-function contexts sharing fixture storage and a test
LockManager. Physical LAN/NAT/camera/mobile/TV acceptance remains open.


## Receive-only copy and adult restoration — 666-check build

Reloaded both existing endpoints. Receiver Agreement child displayed the disabled
Receive only / This protected profile / Parent sends changes card. Joined the
existing parent's generated code and compared the identical safety phrase on
both screens. Receiver confirmation came first: its selected path and session
intent displayed “Phrase confirmed here. Keep both devices open. Waiting for a
parent update.” Parent remained unconfirmed at that checkpoint. Child Receive
Only, Parent Managed and trusted-policy editing remained disabled. After parent
confirmation the child reported Connected / Trusted device with the same accurate
local-only waiting copy. No send, new trust or permission change was performed.

Ended the session; receiver's ordinary Switch to Default restored Copy once /
This profile / Copy to your own device and all existing adult mode options.
Switched back to Agreement child, closed Pairing details on both endpoints and
left the older Rejected and existing Applied links intact. Live language changes
were exercised by the actual localization VM regression, not by changing this
installed browser's language. See RECEIVE-COPY-REVIEW-2026-10-17.md. This bounded
installed test does not substitute for physical/mobile/TV acceptance.
