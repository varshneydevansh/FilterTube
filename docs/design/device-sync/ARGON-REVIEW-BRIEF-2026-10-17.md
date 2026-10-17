# Final Argon UX review brief

Requested model: Argon, Chat mode, Medium effort. This is a review of the
implemented interaction contract; do not imply that a text-only review inspected
the live screen or code. The native Gemini chat **FilterTube UX Review** completed this review using
**Argon Medium**, followed by a clarification/debate. This was a text-contract
review, not a screen or code audit. The separate TV-image draft was preserved.

Review FilterTube Account & sync for parents, retaining multiple independent
parents and children per device and all personal/managed/backup capabilities.
Keep the answer under 350 words, with at most two concrete changes. No broad
redesign, file edits or speculative infrastructure work.

- Device map first; quiet bounded rings; saved/live/nearby tiles with one short
  state. Selecting a tile reveals one review action. Review opens controls and
  focuses separate explicit Send; it never sends. Mixed outcomes appear in review.
- Setup/pairing controls and advanced options are closed initially. Code/QR and
  explicit matching safety phrase remain. Nearby presence grants no trust.
  Discovery is opt-in and explains the optional helper. Internet pairing needs
  both devices open; universal NAT reachability is not promised.
- A parent sees `Editing [local child] as [parent]`. The receiving destination
  names `[receiving profile] on [device]`, even if another profile is open there.
  Personal Copy once uses the open own profile; Family control uses the selected
  parent-owned child rules; Move account stays separate.
- Profiles show Switch/Edit Rules; maintenance and bulk actions are disclosed.
  Children can pair/receive/status only. Settings, trust and administration stay
  under parent authority.
- First approval names sender device and exact recipient, explains future
  permission, and offers Decline / Apply Once / Apply + Save Parent Link.
  All advanced permissions remain in a closed disclosure.
- Native controls, large wrapping targets, focus handoff/Escape return, modal
  containment and reduced motion support reuse on TV. Physical TV testing is open.
- Engineering corrections bind links to both devices, source parent and fixed
  recipient. First-save acknowledgment requires the exact pending proposal,
  session, peer, key, actor and target. Two locally approved parents sharing one
  source device remain distinct. Existing IDs/keys stay unchanged.

Does this journey make which local profile goes to which receiving profile clear
without overload? Identify the most important remaining navigation/copy risk, if
any, with one precise minimal remedy compatible with keyboard/TV. Preserve every
capability and trust boundary. Acceptable as-is is a valid conclusion.

Implementation evidence is separate: 609 focused checks pass; all three browser
packages match 129 current assets. Real signing/storage tests cover first save,
manual trust, two parents updating one child and another child, stale grants and
true duplicate rejection. Installed Apply Once preserves child/parent isolation;
installed saved-link repeat and physical-network/camera/TV acceptance remain open.

## Completed review and decision

Argon identified directional source/recipient ambiguity as the main remaining
usability risk and proposed an explicit route summary. Its initial extra radio
switch was rejected because the existing modes have different paired roles and
fresh authority requirements. Its claimed active-versus-fixed target contradiction
was also corrected: opening the child is the ordinary first-pairing route;
subsequent fixed-target updates can reach that child while another profile is open.
Separate child links already have separate tiles.

After clarification, Argon agreed to preserve the mode boundary and recommended
one read-only line above Send, associated with the action using aria-describedby:
local rules profile, approving parent where relevant, receiving profile and
device. Codex implemented this bounded recommendation with branch-correct
sources for managed, personal and full-account operations. No new source/mode
radio, role inference, permission expansion or transport change was accepted.
The remaining live question is whether parents notice an unintended source and
can exit to change it; actual TV/device acceptance is still required.

The accepted line is implemented. Eleven summary cases cover actual managed, personal and backup branches plus edit/navigation refresh. Installed final-build testing in a separate tab confirmed child source on return to Account & sync and parent source after Done editing, before pairing. Native live review also showed the exact selected child → receiving child/device route and focused a separate explicit Send. It did not save new persistent trust.

## Follow-up: duplicate live and saved tile

The same Argon Medium chat completed a bounded follow-up about two visually
identical tiles for the same saved parent/child link. It approved merging only
an unambiguous verified match across device/role/source-parent/fixed-recipient
identity, preserving distinct parents and children. Its single warning was TV
focus loss during presence transitions. The implementation refinement is a
stable saved-link tile/key while Open now presence changes, preserving equivalent
selection/focus rather than moving focus unnecessarily to a header. Ambiguous
or unrelated sessions remain separate; trust/send authority is unchanged.

The coalescing/focus refinement is implemented and independently reviewed. Twenty-one actual builder/renderer/navigation cases pass. Installed final-build reconnect shows one Agreement child tile, successful Applied repeats, and native Escape returning to the same saved recipient. Argon's broad “zero layout shift” phrasing is not treated as measured proof: the code retains logical tile identity and deliberately restores focus during native DOM rerenders.

## Follow-up: receiving child instructions

The next installed journey exposed sender instructions on the receive-only child
screen: the retained disabled personal-copy mode card, selected-path detail and
session-intent detail still mentioned copying, sending or saving parent trust.
Those actions remained blocked; this was a display mismatch.

The existing FilterTube UX Review chat was explicitly returned to Argon Medium
before submitting a bounded text-contract review. Argon agreed with receiving
labels and cautioned against implying a parent grant solely from a connected
session. Its initial two-endpoint stage wording and requirement for new approval
on every incoming update were not adopted: actual `sasConfirmed` is local only,
and saved grants can permit matching validated updates automatically.

The clarified proposal keeps the existing state and gates:

- After local confirmation: “Phrase confirmed here. Keep both devices open.
  Waiting for a parent update.”
- Helper: “Updates follow the permissions approved by a parent on this device.”
- Retained disabled mode card: “Receive only / This protected profile / Parent
  sends changes.” Adult labels must return when leaving the child profile.

Argon's completed final verdict approved this exact revision. An intervening
errored/interrupted response is not completion evidence. A separate completed
GPT-OSS 120B API wording check found no contradiction; neither model performed a
live code audit or authored the current Codex implementation. Source and installed
verification remain Codex's responsibility.


The clarified receiving copy is now implemented. Independent scoped review found
no concrete regression; integrated checks pass 666/666. Installed confirmation on
the child before the parent displayed the exact approved local-only waiting
message and kept child send/trust controls disabled. Adult mode labels returned
after the session ended and the receiver switched to Default. Locale-change and
static-node preservation are covered by the real localization VM regression.
See RECEIVE-COPY-REVIEW-2026-10-17.md for the complete bounded evidence.
