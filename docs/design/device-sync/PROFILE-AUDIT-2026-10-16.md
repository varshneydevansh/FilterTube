# Profile workflow audit — 16 October 2026

Scope: device sync first, followed by a bounded profile simplification and authorization pass on 17 October. Two Codex subagents independently inspected authority, editing, pairing and delivery. Argon leads the device design and code proposal; Codex applies and reviews the edits. Argon receives this audit for parent-facing simplification. API critique is advisory only; source and behavioral checks decide correctness.

## Verified workflow

- `default` is the local master account. Other adult/parent profiles have type `account`; protected profiles have type `child` and a local `parentProfileId`.
- `js/managed_admin_authority.js:canActorManageProfile` denies child actors, allows Default, allows an account to manage itself, and allows that account to manage its own children. An unrelated account cannot manage another parent's child.
- `js/tab-view.js:startManagedChildEdit` authenticates the parent and enters a named child edit scope while keeping the parent active. `saveManagedChildSurface` writes to that selected child's Main/Kids surface. Done editing exits local edit scope; it does not transmit to a remote device.
- Switching into a protected profile uses its switching PIN and does not grant parent administration. Profile switching clears other unlock sessions and exits managed editing.
- A verified remote update separately names local source rules and a fixed remote receiving profile/device. These IDs can differ. The remote sender's profile ID is a cryptographic identity; it is not the receiving installation's local parent account ID.
- Child picker actions are restricted to entering a parent code, matching the safety phrase, and viewing receive status. Rules-source/send controls are parent-only. An additional behavioral matrix now exercises child actions against saved, live and nearby selections.

## Device-sync blockers being corrected in this pass

1. **Rules source changed during an asynchronous send.** A shared source override could change while signing or authorizing a provider, mixing target and rules selection. `js/nanah_managed_live_policy.js:createSendOperation` captures an immutable rules profile, actor and surface; the outer sender shares that operation across live/Home/Internet delivery. Nine snapshot regressions cover concurrent sources, nested rules, multiple scopes, sequential routes, captured child actors and pinned parent identity. The outer sender rereads the active actor and ownership after unlock/key waits; two additional regressions prove cancellation on an actor or ownership change.
2. **Remote parent ID incorrectly treated as a local account.** Adapter validation and fresh apply used remote `sourceProfileId` to look up a local account and compare local child ownership. Independent parent IDs could fail despite valid pairing. Correction must retain remote pinned identity/signature/device/key/scope/target/revision checks and bind the receiver's actual local parent only after local approval. Missing legacy grants must fail closed for foreign IDs. Implemented with local approval, legacy fail-closed behavior, metadata injection rejection and production save/normalize/context/rebuild tests using real Ed25519 signatures. Independent transport review approved the bounded fix.
3. **Valid live receipts hidden behind pickup status.** Current matching accepted receipts now show Applied; terminal rejection remains visible; mixed scopes remain partial/pending rather than whole-batch success. Old acknowledgment timestamps and coarse provider counters never prove a newer update applied. Eight receipt regressions cover this boundary.

4. **First-connection Apply Once approved the wrong authority/target.** The original basic child flow did request its own parent, but a different explicit child target or reparenting during approval could reach a different owner without that owner's approval. The corrected portable apply path resolves and approves the same actual target, requires fresh sensitive owner/master authorization, and keeps an operation-local target/owner/actor binding. It checks that binding again immediately before scoped writes and inside `importV3` before mutation and the final V4 write. Explicit nondefault imports bypass the compiled active-account save, so they cannot contaminate the currently active parent. The binding is not persisted as new device trust for Apply Once. Thirteen behavior regressions include the real settings/import path; an independent reviewer approved the correction. Ordinary personal profile copies and signed trusted policy applies remain separate.

## Profile findings — updated 17 October

### Owning-parent rename/delete — corrected

The handlers now use the same ownership decision as profile administration and authenticate the acting parent with sensitive approval. They reread the current profiles after prompts, bind actor/owner/type/PIN verifiers, and preserve unrelated current data. Another parent or a child cannot use this path. Twenty-three production-handler regressions cover success, denial, cancellation, actor/owner/target/PIN/session changes and account dependencies.

### Account deletion with children — guarded

Deletion is blocked while any profile still refers to that parent; the message lists the children. A second read catches children added while confirmation was pending. This prevents new orphan states without cascading deletes or silently reparenting profiles. Existing historical orphans are not migrated. Deleting a local profile does not delete remote profiles or saved device links; the confirmation now says so. Missing receiver targets continue to fail closed.

### Scoped rule-save approval — corrected

`saveManagedChildSurface` rechecks sensitive actor approval, current ownership/type and edit scope before mutation and before save. Mutators edit a detached target, so a cancelled save cannot leak nested changes into cached data. An edit to the same target while the mutator waits cancels for review; unrelated current profiles survive. Twenty-four regressions use the real unlock and authority helpers, including PIN-free compatibility.

### Access, time and profile PIN writes — corrected

A production-function probe found the same stale-root pattern in time-limit/access changes. These two writers and profile Set/Remove PIN now capture immutable actor/target/owner/PIN-verifier authority before waits, then reread and validate it before writing current data. Thirty-five access/time regressions and twenty-four PIN regressions cover actor switches, reparenting, expired/cancelled approval, verifier changes, hashing waits and unrelated edits. No mandatory PIN flow or protection-policy migration was introduced.

### Revocation during signature verification — corrected in the extension

TLA+ review prompted a production-handler race test with real Ed25519 signatures. Removing trust while signature verification waited previously allowed one policy write. Fresh persisted and in-memory trust must now agree after verification; key identity and policy are revalidated after the final profile read. Fourteen handler tests plus six context-builder tests cover removal, changed key/source/target/scope and unchanged valid delivery. Standalone adapter callers without the optional fresh-trust callback retain their prior context contract; downstream native integration remains a gate.

### Save feedback and disclosure — simplified

Switch/Edit Rules remain prominent. Native Profile options details retain the other controls and preserve each profile’s open state. Seven renderer tests cover multiple parents/children and retained action dispatch. Four filter-save producers now show success only after confirmed persistence and remain retryable after denial; seventeen producer tests cover managed and personal behavior. The edit banner names both edited profile and acting parent and distinguishes local save from sending to another device.

### Parent PIN setup is optional, so protection depends on setup

Observed source: protected-profile creation calls `ensureProfileUnlocked` but does not require configuring the parent PIN. `ensureProfileUnlocked` returns true when the target account has no PIN verifier; `switchToProfile` uses that destination unlock. Thus a child switching PIN alone does not protect a PIN-free parent/master account from being selected. This is a setup-policy limitation, not a cryptographic bypass. The profile pass should make parent protection explicit before describing a child profile as parent-only, and verify parent-PIN setup, profile switching, unlock expiry and receiver trust approval together. No PIN policy was changed in the device UI pass.

### Parent identity on an existing verified link

Switching parent accounts and sending through an old link can correctly fail because the receiver pinned the original remote parent identity. Preflight should explain which parent needs to be active/unlocked. Do not silently change the link's remote identity.

## Simplifications for the profile pass

- Keep a visible `Editing [child] as [parent]` scope and a clear exit.
- Say `Saved on this device` after editing, and provide a separate device update action. Done editing is not Send.
- Explain parent/master unlock versus child switching PIN at setup.
- Use the same local source and remote recipient names in profile rows, device review and receipts.
- Explain deletion's effect on children, trust links and remote rules before offering it.

## Validation limits

Existing behavioral authority/apply tests and new send/receipt tests provide code-level evidence. Earlier two isolated browser-extension flows covered personal copying and managed parent/child updates with separate local/remote child IDs; they used Default parent identities, which did not expose the independent-parent namespace defect. Physical computers/router/NAT, real camera, mobile/tablet/TV apps, and hosted offline pickup are separate acceptance gates. This audit is scoped, not exhaustive.

## External model review quality

Gemini Argon supplied the design and a concrete HTML/CSS/focus-helper proposal. Its direct file-tool attempts stalled without saved project changes; Codex applied and tested the reviewed proposal. FreeLLMAPI Gemini 3.8 Flash returned an upstream 502; GPT-OSS 120B completed a narrow visibility/trust critique. A broader profile critique was truncated and confused application with receipt order; it was rejected. Correct order remains receiver validates and applies, then returns receipt; the parent uses that receipt to display Applied. We do not adopt model suggestions that contradict source behavior or weaken authority.

## Formal and integrated checks — 17 October

The two bounded TLA+ models and four unsafe variants are documented in formal/README.md. They check modeled safety, not the complete implementation, cryptography or network behavior. The integrated focused suite passed 299 tests after the profile/race changes; catalog structure passed. Browser package building is separate from installed-extension acceptance. The final checklist is ACCOUNT-SYNC-CHECKLIST-2026-10-17.md.
