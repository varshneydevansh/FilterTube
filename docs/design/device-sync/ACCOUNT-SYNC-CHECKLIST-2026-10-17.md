# Account & sync — careful simplification checklist

Goal: AirDrop/Xender-like selection and review while keeping FilterTube's full multi-profile and parent-control capabilities. One family may have multiple parent and child profiles; one device may contain multiple profiles. Simpler navigation does not mean merging recipients, removing modes, changing saved identities or granting child administration.

## Implemented

- [x] Device-first selection; one contextual next action/review; short tile states and detailed receipt outcomes in review.
- [x] Code/QR + phrase pairing, personal copy, managed updates, full-account transfer and advanced pickup paths remain available under their existing authorities.
- [x] Child mode keeps pairing/receive/status entries; changes to child rules require parent authority.
- [x] Profile rows retain Switch/Edit Rules. Profile options discloses the existing maintenance controls; independent per-profile open states survive rerender.
- [x] Existing family overview and bulk actions remain intact under a closed-by-default disclosure after the ordinary profile rows. Its open state is independent of Profile options.
- [x] Edit Rules opens Kids for a Kids-only child and Filters for Main; the existing edit scope and authorization are unchanged.
- [x] Actual renderer tests preserve multiple-parent/child grouping and all existing maintenance action hooks.
- [x] Two receiving profiles on one device retain separate links and independent local rules mappings; selection cannot become a device-wide broadcast.
- [x] Owning parents can rename/delete their own child with fresh adult approval. Other parents/children cannot. Default cannot be deleted; account deletion with dependent children is blocked instead of creating new orphans.
- [x] Rule saves, viewing access, time limits and profile PIN mutations bind the actor/target/owner across waits, recheck sensitive approval and preserve unrelated current data.
- [x] Current trust is checked after signature verification and before managed apply. Removal or authority/key/scope changes invalidate the pending update.
- [x] Saving locally and sending remotely use separate, explicit language. Failed/cancelled managed filter saves cannot claim success.
- [x] Two executable TLA+ models cover bounded authority/receipt and multi-profile binding; four deliberately unsafe configurations produce intended counterexamples.
- [x] First selected-child managed send uses an immutable portable child snapshot rather than the active adult. Real import regressions preserve receiver ownership/security and unrelated parent/sibling data; installed retest confirms the selected child marker and viewing policy after reload.
- [x] Explicit Copy once / Family control changes clear stale selection. Session tiles and phrase labels distinguish local confirmation from saved trust. Child session copy describes receive-only authority.
- [x] First parent-link approval shows sender, fixed receiving profile, future-permission explanation and three actions; every advanced field/default remains in a closed disclosure.
- [x] Update-area radios share one native group even when rendering spans milliseconds; the newly selected default is the value returned by the approval.
- [x] Reloading a child at Account & sync preserves its requested receive hub; initial route restoration still passes through the existing child/lock/self-control access gates. Installed reload confirms the correction.
- [x] Real signing plus real profile/trust storage fixtures verify repeat/duplicate/stale/conflicting updates, distinct parent identity namespaces, fixed-target writes across active-profile switches and revocation during signature verification.
- [x] Real builder/render/navigation integration keeps two child links on one physical device distinct through selection, review, Escape and polling. No defensive focus-key rewrite was shipped for malformed fixture input.
- [x] Home Pickup candidates and pickup receipts preserve the actual receiving device ID through producers, clients, reference service persistence/restart and readback. Wrong-device discovery returns no candidates; missing identities remain missing.
- [x] New receipts require the saved sender and recipient identities. Both live callers bind a captured session client and defer early receipts until send bookkeeping succeeds; failed or revoked sends cannot drain them into Applied.
- [x] Connected live/peer review actions open the existing controls and focus explicit Send instead of dispatching immediately. Installed keyboard retest confirms no receiver approval until the separate Send is activated; approval Tab/Shift+Tab/Space behavior was checked without saving trust.

- [x] New saved parent links agree on one versioned device/parent/fixed-recipient identity. First-save acknowledgments bind the exact pending proposal, session, peer, key, actor and target; unsolicited or stale adoption is refused.
- [x] Actual first-save/manual-trust/sign/repeat tests cover two parents on one physical source updating the same child and another child. Managed lookup cannot borrow another parent/target row; ambiguous duplicates still reject before and after signature waits.
- [x] Existing link IDs stay unchanged. Legacy adult one-time portable updates and bounded existing adult-link status remain available; unsupported signed adult management is not newly enabled.
- [x] Fresh installed child Apply Once preserves its two rules after final-build reload and leaves the receiving parent's own Kids list empty. No new persistent link was granted at that earlier checkpoint; the resumed first-save and repeat are recorded below.

- [x] Trusted-link mutations serialize within this page, build detached candidates from checked storage, and publish success only after confirmed persistence. Failed unlink retains a page-local denial and does not purge revision assertions first. Reload/re-pair is explicit; existing link identities are preserved.
- [x] Stable device identity uses checked, single-flight persistence. Trusted backup restoration shares the mutation queue, waits for pending identity provisioning and reloads trusted rows before queued writes resume. Failed checked reload invalidates prior loaded state.
- [x] Parent first approval offers persistent trust only for supported child targets; adult portable copies retain Apply Once. Family setup explains opening the intended receiving child first.
- [x] Read-only source → receiving profile/device summaries follow actual managed/personal/full-account sources and refresh on edit entry, Done editing and navigation without sending or moving focus. Final installed no-pairing Edit Rules → Account & sync → Done editing confirms immediate source refresh.

- [x] Exact live/saved managed recipients render once, retaining saved identity, source mapping and receipt status. Other parents/children and ambiguous matches remain separate; unique parent/profile/device aliases preserve Escape focus.
- [x] Concurrent duplicate same-policy receipts merge only receipt fields; newest receipt time wins, committed send metadata stays intact, and older/wrong-target updates stay rejected. Installed final-build repeat shows Applied and no new source console messages.

- [x] Native 360px/768px extension viewport inspection: device/review text fits; narrow managed-edit banner now stacks copy and full-width Done editing at <=640px. Rebuilt phone UI visually retested; physical-device acceptance remains separate.
- [x] Installed local QR-image file picker: valid pairing QR fills the code and focuses explicit Join Session; unrelated URL QR is rejected without changing the code or starting a session. Test code cleared and pairing details closed afterward; camera acceptance remains separate.
- [x] Every queued trust mutation rereads checked storage. Production two-page regressions prove a later stale page cannot sequentially resurrect a removed grant or erase another page's newly committed row; read failure writes nothing. Shared locking below also covers overlapping participating writers.
- [x] Participating extension trust/identity/signing writers and whole IO imports now share an origin-scoped exclusive lock, including rollback and explicit nested rotation ownership. Production two-page regressions cover overlapping removal/adds and identity/key provisioning; unavailable locking fails before mutation.
- [x] Trusted recovery preserves multiple parent/child links on one physical device, keeps existing IDs, and rejects conflicting same-ID bindings before mutation. Required recovery/snapshot/rollback reads cannot silently replace unseen state.
- [x] Child pairing cards and confirmed-session instructions describe receiving parent updates. Local confirmation never claims remote confirmation. Original adult labels and static text nodes survive child/adult and live language changes; five new strings are present in all 38 target catalogs. Installed local-first confirmation and adult restoration pass. See RECEIVE-COPY-REVIEW-2026-10-17.md.

## Compatibility boundaries retained

No profile schema migration, account merge, automatic reparenting, trust reset, new mandatory PIN flow, relay replacement, native-runtime mirror update, framework migration or publication. Behavior probes use fixtures; installed checks use synthetic profiles in a separate signed-out browser profile. Personal FilterTube data is not part of those checks. The account/sync changes are checkpointed separately as described in COMMIT-SCOPE-2026-10-17.md; publication remains on hold.

Parent PIN setup remains optional under the existing policy. A child switching PIN alone does not protect an unprotected Default or parent account. Security copy now makes this explicit. Mandatory setup/recovery changes need a separate reviewed design, rather than surprising existing families or stranding child devices.

Local profile deletion does not revoke remote trust or delete profiles on other devices. The confirmation says so; missing local targets fail closed. Existing historical orphan profiles are not silently reassigned or deleted.

## Additional acceptance evidence

- `PACKAGE-PARITY-2026-10-17.json`: all three browser archives match 134 current runtime/catalog assets byte-for-byte, including the subsequent Android popup shortcut bundle and artwork. Package freshness is established; installation and interaction are separate.
- `HELPER-LOOPBACK-2026-10-17.json`: actual HTTP servers and loopback UDP sockets passed opt-in discovery, cross-helper invitation, wrong-token refusal and withdrawal. Receive tokens did not enter UDP packets and discovery created no settings deliveries. This uses one computer and synthetic data, not two physical devices.
- Reproduce the optional local helper probe with `node docs/design/device-sync/check-helper-loopback.mjs /tmp/filtertube-helper-result.json`. It binds temporary loopback HTTP endpoints and loopback multicast, disables inherited persistent-store/TLS configuration within its own process, and closes endpoints in `finally`. An independent review found the environment-inheritance risk; the corrected probe also passed with poisoned store/TLS paths and created no store file.
- `INSTALLED-ACCEPTANCE-2026-10-17.md`: latest installed extension visually places devices first and retains two child profiles. Parent edit/save affects only the chosen child. Separate signed-out Chrome for Testing endpoints completed personal copy/decline and selected-child managed Apply Once, including correct child contents and separate parent contents after reload. These are live endpoints on one computer; physical-network proof remains separate.
- The integrated focused suite passes 666 tests, including cross-window coordination, multi-profile recovery and receive-only localization regressions. An earlier broader run before the startup-navigation regressions passed 402/410; eight archival failures also occur against independently checked original HEAD. Existing audit expectations were preserved. The six additional BlockTube import/rollback behaviors pass; its separate old untranslated-title assertion still fails against both the preceding package and current source.
- Current bundled Nanah WebRTC transport configures STUN and no TURN relay. Same-network and internet support must not be read as guaranteed reachability through every firewall/NAT. Separate-network acceptance remains required.
- Home Pickup sends signed rule contents to the configured home service; that service must be trusted with those contents. Internet Pickup uses an encrypted signed envelope. Target/signature checks remain required for both; the user guide now distinguishes their confidentiality boundaries.

Latest additional installed acceptance: a distinct third child-rule marker was explicitly declined. Both endpoints reported decline; no saved trust appeared; receiving-parent inspection confirmed the original two child rules and absence of the third marker. Child direct navigation to rule editing redirected to Help. Following user continuation, the same-permission link was saved. Final-build reconnect and two distinct signed repeats completed with Applied receipts, including while the receiver parent was active; only the fixed child changed. Saved-link revocation/unlink acceptance remains open.

## Downstream integration handoff

[Native sync contract](DOWNSTREAM-SYNC-CONTRACT-2026-10-17.md) records the exact
shared-link identity, opposite endpoint orientation, first-save acknowledgment,
receipt and profile-authorization boundaries, and reusable focus behavior.
[Production-derived vectors](SHARED-LINK-VECTORS-2026-10-17.json) agree across
source/replica orientations and distinguish different parents/receiving children.
These are integration inputs, not native parity acceptance. A current read-only
ADB inventory exposed only the TV emulator; the active Complete FilterTube
Android TV chat owns its ongoing native work. This chat did not modify or control
that emulator or synchronize native runtime mirrors.

## Acceptance still open

- [x] Latest installed personal copy/decline and first selected-child managed Apply Once; receiver child rule/viewing policy and separate parent rule remain after reload.
- [x] Latest installed build: saved-link persistence, reconnect, signed repeat with Applied receipt, and fixed-child delivery while the receiving parent is active. Receiver child contents and separate parent rules were inspected after reload.
- [ ] Installed multiple named parents, same-device multiple receiving profiles, and revocation/unlink while a saved update is pending.
- [ ] Explicit owner repair/re-pair of the earlier mismatched test links; their IDs were preserved rather than silently rewritten. Confirm the new shared-ID acknowledgment contract in downstream native clients before claiming extension-to-TV/mobile managed-link parity.
- [ ] Two physical computers on a real LAN with helper availability/absence, isolation/firewall, visibility expiry and permission denial.
- [ ] Separate networks/NAT and configured offline pickup, receiver receipt/rejection/replay and revocation behavior.
- [ ] Real camera, mobile/tablet layouts, TV remote focus/back/QR/code and downstream native trust-context integration.
- [ ] Installed overlapping-window revocation/update/import rollback, Firefox/private-context lock behavior and downstream native transaction integration. Participating extension writers now use the shared origin lock; unrelated background/profile writers and general storage serializability remain outside its guarantee. See CROSS-WINDOW-STORAGE-REVIEW-2026-10-17.md.

Argon supplied the earlier design/code proposal and completed the final text-contract review in FilterTube UX Review at Medium effort. After clarification, its read-only source-to-recipient line was implemented by Codex; no new radio/mode switch or authority change was accepted. The separate TV-image draft was preserved; no design prompt was sent to Flash-Lite. API text proposals remain advisory: the truncated Qwen critique was rejected; the completed GPT-OSS two-sentence wording was checked against current behavior.
