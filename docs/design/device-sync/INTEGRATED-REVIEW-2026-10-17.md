# Integrated sync review — evidence and limits

This continuation uses synthetic profiles and isolated storage. It does not save
the pending browser parent link or change personal browser data.

## Saved-link storage journey

`managed-saved-link-storage-journey-current-behavior.test.mjs` combines real
Ed25519 signing/verification, the production trusted-link persistence path,
receiver context/handler, settings runtime and `io_manager` profile storage.
It covers two remote signing parents whose IDs differ from both receiver-local
parent IDs and both fixed child targets. Four cases verify repeat/duplicate,
stale/conflicting revision rejection, active-profile switching without retargeting,
independent sibling links and persisted revocation while verification waits.

The browser's pending Save Parent Control Link action remains a separate gate.
Fixture persistence is not installed-browser or physical-network evidence.

Native keyboard checking subsequently found and fixed a review-action mismatch:
three connected preview branches invoked Send directly despite promising a
review step. They now open the controls and focus explicit Send. The rebuilt
installed session verified that Review produces no incoming approval, while
activating the separate Send does. The receiving approval remains unsaved.
Tab/Shift+Tab wrapping and Space disclosure handling were also observed in the
real approval modal. These are desktop keyboard checks, not physical TV proof.

## Multi-child selection and focus

The initial renderer probe supplied duplicate physical-device row IDs. That
input did not represent the current producer: saved rows use their distinct
link IDs. No ordinary production failure was established, and the proposed
defensive focus-key change was not retained.

`family-device-multiple-recipient-focus-current-behavior.test.mjs` now runs the
actual builder, selection renderer and navigation together with two child links
on one physical device. It verifies one selected tile, the correct child review,
Escape return and focus preservation across a refresh. Native keyboard,
screen-reader and TV remote acceptance remain separate.

## Independent model proposal checked against intended behavior

A completed bounded GPT-OSS 120B checklist proposal suggested duplicate,
revocation and out-of-order revision checks. It also incorrectly proposed
rejecting a fixed-target update whenever its child was not the currently active
profile. That suggestion was rejected: an authorized saved link must continue
to update its pinned child while another profile is open. The new storage
journey explicitly tests that capability and preserves the other active profile.

Model text is advisory; production behavior and executed regressions determine
the result. Argon's new chat review remains quota-limited, with Medium effort
required when it becomes available.

## Receipt and pickup follow-up

Production probes found that receiving-device identity was dropped from Home
Pickup candidates and from Home/Internet pickup receipt records. A device-bound
candidate search could therefore miss the update. Additive field passthrough
preserves the actual receiver ID without inferring missing IDs from a current
profile, trusted link or nested envelope.

`managed-delivery-receipt-identity-roundtrip-current-behavior.test.mjs` exercises
the actual pickup producers, client sanitizers, reference HTTP service, temporary
persistent store restart and receipt readback. Five cases retain all four
device/profile identities, separate sibling targets, preserve missing values and
reject wrong-device discovery. The mailbox client retains its HTTPS configuration
while the test fetch is routed to a loopback fixture; this proves neither TLS nor
internet delivery.

The receipt recorder now requires the saved source device/profile and fixed
receiving device/profile. Incomplete or mismatched new receipts remain
unconfirmed. Both live-send callers use a shared wrapper that registers the
exact outgoing tuple before transport, queues matching early receipts, and
records them only after send bookkeeping succeeds. Failure or revocation clears
the pending receipts. The paired client is captured before asynchronous envelope
preparation; a replacement session cannot receive the prepared batch.

`managed-receipt-identity-current-behavior.test.mjs` covers 46 identity, early/late
receipt, retry, failure, concurrent-send and revocation cases.
`nanah-live-send-ui-callers-current-behavior.test.mjs` runs both actual UI handlers
through 12 dispatch/client-replacement cases. A separate agent reviewed the final
helper and callers and found no blocker; 71 related review cases passed.

The combined focused run passes **499 tests**. Three browser builds, catalog
structure and duplicate-key checks pass. Package comparison covers **129**
current runtime/catalog assets in each of the three archives, including all
top-level locale catalogs. Helper source hashes record provenance only.

An additional Home Pickup source-wiring test still expected the old “saved and
reachable” copy. Its two wording assertions now match the implemented setup/
health distinction. An actual summary-function regression verifies that saving
configuration alone or a health result for another host cannot claim successful
health. Archival source fingerprints and metric expectations were not refreshed.

Receipt metadata is not a cryptographic receiver signature. Physical delivery,
provider honesty and receipt authentication are not certified by these checks.
The installed saved-link approval and repeat-delivery journey remain open; the
new receipt wrapper has production-handler/HTTP fixture evidence, not installed
cross-device acceptance.

## Saved-link handshake and multiple-parent follow-up

Installed repeat delivery exposed `wrong_link_id`: opposite endpoints derived
IDs from different peers even though the signed payload was valid. New links now
use `nm1-` plus a SHA-256 digest of a versioned, oriented tuple of source device,
receiving device, source parent and fixed receiving profile. Full logical tuple
collision checks prevent unrelated rows from being overwritten. Existing IDs,
keys and revision assertions remain unchanged; old mismatched links need explicit
owner repair/re-pairing. Older clients lacking this shared identity handoff are
not silently trusted; downstream native integration remains open.

The receiver returns its actual saved ID. The source accepts it only once for a
captured pending first proposal with matching authenticated session, peer,
source adult authority, signing key and fixed target. Manual pairing retains
the reviewed fixed target, offers a fresh locally manageable child selection,
and rechecks actor/owner/PIN-verifier/session changes across modal and digest
waits. No child self-trust or mandatory PIN was introduced.

Actual-function review found two additional multi-parent failures: physical-device
fallback could select another parent's/child's link, and duplicate-device checks
could reject two independently approved parents sharing one physical source.
Managed context lookup is exact; duplicate checks distinguish known source
parents while retaining ambiguous/same-parent rejection. Actual Ed25519 and IO
fixtures now exercise first save, second parent's first save to the same child,
both parents' signed repeats with independent revisions, and another child's
first save/repeat. Negative duplicate insertion runs both before validation and
during signature verification. Existing adult portable Apply Once and narrowly
bound existing adult-link status are preserved without creating signed adult
management capability.

`nanah-managed-shared-link-handshake-current-behavior.test.mjs` passes 31 cases.
The combined focused suite passes **531 tests**. All three final browser packages
build; 129 current assets match each archive. Independent final code review found
no remaining must-fix in the scoped change. The neutral device-list accessibility
label also avoids telling receive-only children to send.

Bounded API checking remained advisory. Truncated model responses were rejected;
a completed GPT-OSS test suggestion was checked against actual production cases,
and imprecise device-versus-profile wording was not adopted. Argon remains the
requested design reviewer, with Medium effort when its quota is available.

The fresh installed receiving profile completed Apply Once and retained exact
child rules after final-build reload; its parent rules stayed separate. That
endpoint has no new persistent grant. Installed saved-link repeat, physical
network/camera/mobile/TV acceptance and cross-context storage atomicity remain
separate open gates.

At this earlier checkpoint the app showed **Argon Medium**, but the prepared
`ARGON-REVIEW-BRIEF-2026-10-17.md` prompt had not yet been submitted.
The shared Gemini app is attaching TV-review images in another draft; that
workflow was left intact rather than submitting the wrong attachments or
replacing its draft. The user was asked asynchronously when control is available.

## Persistence, restore and final UX follow-up

Production failure probes found that failed trusted-link writes could publish an
in-memory grant/success; failed unlink could discard memory and purge assertions
while leaving disk trust; failed receipt/policy updates could report success.
All seven trusted-link mutation callers now use checked storage and a per-page
queue, detached candidate rows, and publication only after the write succeeds.
Unlink immediately denies the exact link within the page but purges assertions
only after durable removal. That denial lasts until reload, including after a
failed write; recovery copy explicitly says reload then pair again. This does
not provide cross-tab compare-and-swap or promise storage serializability.

Stable device IDs now use checked single-flight persistence. Trusted backup
restoration enters the same queue, waits for pending identity provisioning,
blocks new identity provisioning, invalidates cached/loaded state and reloads
trusted rows before queued mutations resume. A failed checked reload invalidates
an earlier successful load rather than allowing later writes against stale rows.
Real failure/ordering tests cover 20 link-mutation and 17 identity/restore cases.
An archival backup-boundary probe still has four unchanged original-HEAD failures;
its source fingerprints were not rewritten.

Installed review found an adult-target first approval offering unsupported saved
child trust. Adult portable copies now offer Apply Once/Decline only; supported
child trust keeps its existing fresh parent approval. Family setup explicitly
instructs the receiving device to open the intended child before code/QR pairing.

Argon completed a text-contract review in the native Gemini chat FilterTube UX
Review at Medium effort. After debate, the accepted minimal change is a read-only
source → receiving profile/device line above Send and in review, associated using
aria-describedby. Codex made the edits. Existing personal/family/backup modes and
authority requirements remain intact; Argon's additional radio was rejected.
The line follows actual child rules, approving parent and fixed recipient; it
also handles personal and full-account sources. An installed 584-check build
showed stale text after navigating from Edit Rules until another pairing event.
The final fix refreshes summaries synchronously through the existing managed
banner hook on edit entry, Done editing and navigation. Eleven actual-function
summary cases pass, including that real flow without sending or changing focus.
A separate installed tab then verified the final correction before any pairing: Edit Rules → Account & sync immediately showed Acceptance policy child, and Done editing immediately restored Default.

The final combined focused suite passes **585/585** checks. Three browser builds,
locale structure, duplicate-key and whitespace checks pass. All 129 current
runtime/catalog assets match all three packages byte-for-byte. These are scoped
checks, not a claim that every repository audit or physical-device test passes.

The 584-check installed endpoints completed code/phrase confirmation and the
explicit tile → Review → Send handoff with the correct selected-child route.
The fresh Agreement child saved-link approval was prepared with fixed target,
profile/Main/Kids/viewing/time permissions, merge, quick reconnect, parent-managed
matching updates, automatic pickup and locked-profile apply. No persistent grant
was saved by the agent. A specific asynchronous action-time confirmation is
pending; earlier authorization concerned a different Acceptance receiver link.
Saved-link installed repeat and physical-network/camera/mobile/TV remain open.

## Resumed installed repeat: receipt race and exact tile merge

After user continuation, the refreshed Agreement child first proposal was saved
with the previously reviewed permissions. Both endpoints acknowledged trust.
A distinct fourth Kids marker then arrived through saved tile → review → explicit
Send. The child's four rules were visible to the receiving parent; that parent's
own Kids list stayed empty after reload. The source nevertheless remained Waiting
for receipt. Native console inspection traced the error to optimistic policy
patch conflict, not signature or receiver-profile failure.

A real two-peer signing/IO/persistence reproduction found duplicate concurrent
receipts for identical scope/revision/hash with different receive timestamps.
The narrow correction merges only five receipt fields when baseline, incoming
and committed rows still refer to the same positive revision/hash and incoming
send metadata is unchanged. It preserves committed send data and newest receipt
time. Three new actual receiver/ACK/source-handler regressions pass; the existing
20 persistence cases keep real new-send conflicts rejected. Independent review
also tried changing sentAt, revision, hash or adding send metadata; all four
concurrent overwrite attempts were rejected. Installed retest follows rebuild.

Argon Medium completed a bounded follow-up in FilterTube UX Review and approved
coalescing duplicate live/saved tiles only for one fully matched managed logical
recipient, with existing saved link identity, source mapping and receipts retained.
Its focus concern was refined through discussion: preserve equivalent saved-tile
focus as presence changes; do not jump to a header when that target still exists.
A source-parent/profile-bound alias is being tested for live review → merge →
Escape; different children/parents and ambiguous matches remain separate.

A bounded Qwen397B checker response was truncated and rejected. A completed
GPT-OSS120B proposal suggested same-send concurrent ACK and stale/wrong-send
negative cases; actual field/identity checks and acceptance decisions remain
owned by Codex and independent production-function tests.

## Final verification after the resumed fixes

The final combined focused suite passes **609/609** checks, including 21 exact
live/saved coalescing/navigation cases and three real receipt-concurrency cases.
All three browser builds and syntax/whitespace checks pass. No catalog changes
were needed for these final JS-only corrections; previous locale structure and
142-file duplicate-key validation remain separate checks. Independent byte
verification rehashed all 129 current assets, 387 ZIP entries, all 114 catalogs,
three whole-package hashes/versions and two helper provenance hashes successfully.

Final installed acceptance now covers the saved first grant, persisted trust
across reload, explicit phrase reconnect, distinct saved repeats reporting Applied,
and a sixth rule landing in the inactive fixed child while the receiving parent
was active and retained zero own rules after reload. Native Escape returned to
the unified saved tile, and the freshly loaded source console had no messages.
See the final section of INSTALLED-ACCEPTANCE-2026-10-17.md. Pending approval and
receipt-error statements above describe earlier checkpoints, not current state.
Physical network/camera/mobile/TV, installed multi-parent/multiple-recipient
journeys and saved-update unlink/revocation acceptance remain open. The per-page
queue does not prove cross-window compare-and-swap or full storage serializability.

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

## Sequential two-page trust correction

A production-function/shared-storage repro showed a removed grant could return:
two receiver pages loaded the same grant; page A's actual remove persisted an
empty list; page B's later actual usage mutation rewrote its cached unrevoked
grant. This requires no overlapping storage operations.

`commitNanahTrustedLinkMutation` now invalidates loaded state and checks current
persisted rows at the start of every queued mutation, then overlays page-local
denials before building the detached candidate. Existing policy baseline guards,
durable-before-success ordering and authorization remain in place. The three
new regressions cover sequential removal, unrelated row preservation, and checked
read failure without writes followed by recovery. Related checks passed 161/161;
the integrated focused run passed 612/612. All three browser packages rebuilt and
matched 130 current source/catalog assets each, with helper provenance refreshed.

This fixes stale-cache overwrites after an already-completed change. It does not
serialize simultaneous read/modify/write across windows. Physical and native
acceptance gates remain open. Bounded Qwen 397B and Gemini 3.8 API responses were
truncated and were rejected; they supply no review evidence for this correction.
The provider CLI help now states Home contents are readable to its service and
Internet envelopes are encrypted, matching the existing guide and contract.

Independent review of this narrow correction found no blocker and passed 89/89
persistence, receipt-concurrency, device-identity and receipt-identity checks.
It confirmed checked reads precede candidate execution, failed reads leave loaded
false without writes, denial overlays remain, and existing same-scope policy
baseline rejection and bounded receipt merge are retained. Native dashboard
reload preserved both existing saved-device states and the local child profile;
installed trust deletion was not used as a test substitute.

## Shared cross-window coordination and multi-profile recovery

The overlap repro demonstrated why the sequential fresh-read correction alone
was insufficient. Participating trust/identity/signing operations and whole IO
imports now share the exclusive extension-origin Web Lock, including rollback.
Explicit lifetime-bound tokens handle nested rotation without implicit bypass;
missing support and checked-read failures stop before mutation. Trusted recovery
also preserves several parent/child links on one physical device rather than
deduplicating by device ID, and rejects conflicting same-ID bindings before any
import write. See CROSS-WINDOW-STORAGE-REVIEW-2026-10-17.md.

Final focused integration: **657/657**. Independent lock subset: **60/60**;
independent recovery/coordinator subset: **37/37**. Six actual BlockTube
import/rollback behaviors pass. Its old static untranslated-title assertion still
fails against both the preceding package and current source; no assertion was
weakened. Existing VM fixtures load the real coordinator using a test-only shared
LockManager, matching the new production script dependency.

All three browser builds pass and **132 source assets / 396 ZIP entries** match.
Native Chrome reconnect through the unchanged Agreement grant delivered a seventh
distinct child marker, with Applied on source, seven child rules and zero parent
Kids rules after ordinary parent inspection. No new trust was saved. This is
one-computer native-API execution, not installed concurrent-window or physical
network acceptance. Other origins/partitions, older code, native clients and
unrelated profile/background writers remain outside the coordinator guarantee.


## Receiving-screen wording and language-switching follow-up

Latest integration: **666/666** focused checks. Display-only receiving labels and
local-confirmation messages replace outgoing instructions on child screens.
Captured static text nodes survive child/adult transitions and language changes;
normal adult polls do not globally reapply localization. All five new strings
exist in all 38 target catalogs. Argon Medium's completed review and independent
scoped implementation/semantic reviews are recorded in
RECEIVE-COPY-REVIEW-2026-10-17.md. All three builds pass and match 132 source assets
in each archive. Installed existing-grant pairing confirms local-first waiting
text, child restrictions and original adult card restoration, without sending an
update or creating/changing grants. Earlier broader baseline failures and all
physical/native gates remain as documented.
