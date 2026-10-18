# Firefox Android installed acceptance for issue #79 — October 18, 2026

This extends [the issue follow-up](ISSUE_ACCEPTANCE_FOLLOWUP_2026-10-18.md). It records observed emulator behavior, not a physical-device certification or a GitHub issue closure. No source runtime was changed during this installed check.

## Environment and input

- Official Mozilla Firefox 158.0, versionCode 2016189050, installed on an isolated API 37 phone emulator, `FilterTube_Firefox_Acceptance_20261018`, serial `emulator-5556`.
- Current local FilterTube 3.4.1 from `dist/firefox`, temporarily installed with Mozilla `web-ext`. Product fixes are at `f20861a7`; the subsequent audit/package corrections are at `71e1e6dd`. The [sanitized evidence manifest](FIREFOX_ANDROID_79_INSTALLED_EVIDENCE_2026-10-18.json) records relevant source hashes.
- The supplied 3,561,779-byte backup was imported through Settings → Choose JSON → Android's file picker. Its raw contents remain outside Git and were not sent to model reviewers. UI readback showed 529 blocked keyword rules and 1,408 blocked channel rules. The keyword count also survived a Firefox/emulator restart.
- The user approved Firefox Terms acceptance and separately approved Android-native test controls. Firefox was already past first run when observed. ADB/UI Automator was used only for the disposable phone, after desktop pointer input repeatedly failed with `noWindowsAvailable`.

## Observations

| Scenario | Observed result | Limit |
| --- | --- | --- |
| Default-rule baseline | Mobile and desktop search showed thumbnails before the backup import. Popup initially showed no blocked keywords. | Guest YouTube results are dynamic. |
| Actual backup import | 529 keywords and 1,408 channels appeared in the extension's on-device Filters UI. | Counts and sampled behavior do not prove every rule's intended meaning. |
| Imported mobile search | Science and physics results rendered thumbnails. An initial physics placeholder was visible, then had become a thumbnail at the observation after a 12-second wait. | This was not a measured eight-second paint deadline or a forced metadata-queue test. |
| Imported desktop search | Thumbnails rendered after initial loading. Tapping a visible regular-video thumbnail navigated to its watch URL, whose page/comments subsequently rendered. | Initial 2 GB run was under substantial memory pressure. |
| Mobile channel and scrolling | Science ABC's popular-video and other shelves rendered; scrolling revealed additional thumbnails and titles. | Does not exhaust every renderer/recycling variant. |
| Desktop channel | The channel's shelves and thumbnails rendered in desktop mode, including after scrolling. | No physical GPU/compositor parity claim. |
| Mobile card to playback | A channel thumbnail opened `watch?v=yuD34tEpRFw`; the regular video visibly played with filtering Enabled and the imported rules restored. A search thumbnail also opened a playing Short. | Not every category/language/allow-only combination was exercised. |
| Imported Home | Mobile and desktop Home displayed video thumbnails. Desktop retained some empty grid slots; tapping a sampled empty slot left the Home URL unchanged. | Empty-slot compaction remains a layout follow-up; one sample does not prove all hit targets. |
| Matching-keyword/Disabled admission | A temporary title keyword, `half yearly`, made the matching regular-watch player region unavailable with Enabled confirmed. After explicitly observing Disabled in the popup, the same watch displayed playing frames without reload or an unrelated-video jump. | The first attempted toggle had left Enabled saved; that attempt was excluded from the Disabled result. Absence of a visible blocking explanation was not certified as good UX. |
| Cleanup | The temporary keyword was deleted, Enabled was observed again, and UI totals returned to 529 keywords and 1,408 channels. | Only the disposable test profile was modified. |

The four focused production-function regression files were rerun after this check: **34/34 passed**. Duplicate-key validation passed for **142 JSON files**. These results supplement, and do not replace, the installed observations above. No additional runtime change required rebuilding the already-validated browser packages.

Screenshots are retained locally under `/tmp/filtertube-release-2026-10-18`; filenames, sizes and SHA-256 values are recorded in the evidence manifest. The screenshots are not embedded in this repository, so copying this document alone does not carry the image evidence. Captures containing imported keyword rows are excluded from that manifest.

## Resource-pressure observation

The initial phone had approximately 2 GB RAM. One `top` observation reported 2,042,240 KB total RAM with 97,952 KB free, and 1,531,664 KB swap with 688 KB free, alongside heavy I/O wait. That emulator later exited with code 137; both phone and pre-existing TV processes were absent afterward. This is process-termination evidence, not proof that Firefox, FilterTube or Android's low-memory killer caused it. No acceptance command targeted the TV emulator.

The disposable phone was restarted independently with 4 GB RAM and two cores. Mobile placeholder/card/tap checks, the regular playing watch, Home/channel checks and confirmed Disabled restoration were observed in that configuration. The resource change must not be used to erase the 2 GB result or claim low-memory performance is solved.

## Separate review finding: concurrent saves can drop a setting

A read-only harness extracted the actual `StateManager.saveSettings` and `updateSetting` functions with synthetic deferred storage. An earlier save captured `enabled:true`; a concurrent update set memory to false and emitted `settingUpdated`, but `saveSettings` returned early at its `isSaving` guard. Resolving the earlier write left storage at true with only one write. This is a demonstrated same-context persistence race in `js/state_manager.js`, not evidence of why the first installed toggle attempt remained Enabled. The confirmed Disabled watch restoration passed.

The temporary reproducer is `/tmp/filtertube-enabled-save-race.mjs`. Its observed result was memory false, stored true, one write after both callers completed. A fix needs queue/error/profile-switch semantics and regression coverage; no speculative global persistence rewrite was included in this visual-acceptance checkpoint.

## Remaining gates

- Physical reporter-device reproduction/confirmation, installed pre-fix comparison and low-memory performance attribution.
- Forced late-category rejection and allow-only unknown-video admission on the installed browser; their existing production-function tests remain separate evidence.
- Reporter-specific issue #75 reproduction, installed BlockTube import/save/reopen and the two native policy/mirror checks documented in the main follow-up.
- The separate concurrent-save race above and the desktop grid-slot layout follow-up.

Nothing was pushed, submitted to a store, published as a release, posted to GitHub or closed as an issue.
