# Post-3.3.7 release audit: 3.4.0 preparation

Baseline: August 29, 2026 release commit `70cdb405` (v3.3.7). Prepared version: **3.4.0**, October 1, 2026. The version bump does not publish a GitHub release, upload store packages or update Android/iOS apps.

## Product and runtime changes

- **Video admission:** Global Disabled is checked before side effects. Active video/channel/keyword/allow-only/duration/upload-date/category/language/uppercase rules use selected-video verified metadata. Checking, verified rejection and unverifiable metadata remain distinct. Layout toggles never constitute video rejection. No timeout-based allowance is introduced.
- **SPA/direct entry and caches:** current-player retries avoid repeated full Watch scans; streamed `get_watch` responses are accepted only for the exact route video. Back/Forward cannot inherit another video's admission. Verified metadata survives settings snapshots while rule decisions are recomputed. Held playback intent is preserved for subsequently verified allowed media.
- **External playback:** supported Google/YouTube embedded playback remains on the originating page. Intercepted Player/Next data and bounded loaded-response recovery use selected-media identity. Hover previews, prefetched data and unrelated thumbnail/media owners cannot create a selected-player recovery candidate or page-wide admission banner. Explicit blocked IDs reject without waiting for irrelevant metadata; ID-only passing rules skip owner metadata when no other active rule needs it.
- **Blocked navigation:** final source keeps the current video paused. Generic Next and autonomous verified-playlist-successor navigation were removed. Explicit user navigation remains. Earlier commits that allowed a verified successor are superseded, not final behavior.
- **Cards and Shorts:** targeted Watch/Search candidate refreshes preserve structural full-pass fallback. Members-only handling hides its matching card rather than the containing page/section. Search Shorts and mobile reels read actual nested owner identity and wrapped Player metadata, not the query/title as channel identity.
- **Advert Void:** selected-player content/advert role assignment and quarantine ownership were narrowed. Arbitrary second-video promotion was removed; decorative media stays outside quarantine. These changes are not a guarantee against ad leakage or YouTube ad-block detection. See [media ownership](ADVERT_VOID_MEDIA_OWNERSHIP_2026-09-22.md).
- **Hard Timer Whitelist:** explicit protected Main allow-only sessions preserve and restore their prior profile snapshot. The extension implementation and downstream native installed parity are separate claims.
- **Comments:** serialized comment-only keyword matchers are reconstructed through the existing pattern/date compiler. Sentence matching, Unicode exact boundaries, Disabled and comment/video separation have focused regressions. See [issue validation](ISSUE_VALIDATION_2026-10-01.md).

## Localization and interface changes

All 38 target languages have bundled interface catalogs and selectable settings options, including Russian, Tamil and Gujarati. Coverage work includes static dashboard copy, popup controls, generated rule editors, import reports, backup/import/export, managed-link policy and delivery controls, family-device statuses, PIN/self-control dialogs, menus, help/tooltips, viewing overlays and historical release entries. The 3.4.0 release entry is included in every non-English release catalog.

The interface preference is device-local, with English fallback and locale-aware date/count formatting. RTL spacing and overlay language/direction metadata were aligned. User-entered rules, IDs, names and metadata remain unchanged. Translation is bundled text, not runtime model inference or a remote API. Translation drafts are excluded from extension packages. Fluent-speaker accuracy and installed layout review are still quality gates; a selectable language is not proof of those reviews.

Two startup errors introduced during dynamic localization were repaired: the compact-condition helper omitted `labelKey`, and Kids initialization referenced Main-only `channelsContent`. Their live observations and test boundaries are recorded in [dashboard startup fixes](DASHBOARD_STARTUP_LOCALIZATION_FIX_2026-10-01.md).

## Supporting work and scope exclusions

FundingJSON and institutional funding documentation were added. Regression fixtures, source-aware test repairs and issue validation records were expanded. The local-only semantic filtering design and historical worktree handoff are checkpointed; **semantic ML remains disabled**, no Jev API is enabled, and no model or inference runtime is promised in 3.4.0. Earlier managed delivery/list-import features were reviewed but must not be advertised as first introduced after August 29 when their implementations predate this baseline.

## Open issue and release boundaries

| Issue / gate | Evidence boundary |
| --- | --- |
| #69 autonomous next video | Removed in source; installed playlist acceptance still needed. |
| #75 unrelated rejection | Exact identity safeguards exist; reporter-specific rules/reproduction still needed. |
| #76 search/import regressions | Large-list/import work is tested; affected reporter configuration remains missing. |
| #77 Disabled / repeated checking | Early guards and metadata retention exist; installed transition/tab-return testing remains. |
| #65 Firefox mobile filtering | Nested reel owner/Player coverage added; Firefox Android acceptance remains. |
| #79 comments and white areas | Comment matcher defect fixed; Firefox Android white-area cause remains unresolved. Public export: 1,408 channel rules, 529 keywords, 226 comment rules. Literal non-date comment sentence check: 28/28. |
| #62 lists / #60 management | Existing workflows were reviewed; unattended replacement, setup-free discovery, hosted delivery and native two-device parity are not newly claimed. |
| Broad regression lanes | Last recorded blocking 149/208 and smoke 273/302, not passing release gates. Historical fingerprints/extraction contracts and behavior assertions need individual triage. |
| Remaining audit checkpoint | Comments audit plus startup group passed 18/22, with four historical fingerprint/count failures. No blanket rebaseline was used to manufacture a release pass. |
| Installed dashboard | First startup fix passed its failing point live; final post-second-fix reload was interrupted by user browser activity. Full dashboard smoke remains required. |
| Languages | Catalog structure and packaging do not prove fluent-speaker accuracy or every installed/RTL layout. |
| Distribution / native apps | No push, tag, GitHub/store publication or Android/iOS version bump is part of this preparation. |

## Commit inventory

First-parent history after the exact v3.3.7 release commit through the pre-bump checkpoint. The immediate August 29 merge also includes the August 27 optimization commit `9e1c4243`; it is included by ancestry, not mislabeled as authored after the release date. This inventory records development steps, including superseded and draft-only work; final behavior is described above.

| Date | Commit | Change |
| --- | --- | --- |
+| 2026-08-29 | `cdb956d1` | Merge remote-tracking branch 'origin/master' |
| 2026-09-02 | `006a61b5` | Fix direct access admission and add hard whitelist timer |
| 2026-09-02 | `b5a9668c` | Align late identity and channel surface filtering |
| 2026-09-02 | `8501582b` | Filter modern Search Shorts by owner identity |
| 2026-09-02 | `7e85404a` | Enforce verified current-video admission |
| 2026-09-02 | `794efba0` | Document current-video admission contract |
| 2026-09-02 | `bb66fca2` | Isolate current-video admission retries |
| 2026-09-04 | `6f7f608c` | Align current-video admission state |
| 2026-09-21 | `dc6efa2d` | Add FundingJSON manifest |
| 2026-09-21 | `1bddea9f` | Add institutional funding plan |
| 2026-09-22 | `4edfc734` | Document and checkpoint external YouTube playback admission |
| 2026-09-22 | `09bd05e9` | Constrain Advert Void quarantine to selected player media |
| 2026-09-29 | `8e5c87df` | Add bundled multilingual interface catalogs and preview controls |
| 2026-09-29 | `446cd24f` | Expand extension localization across generated controls |
| 2026-09-29 | `f50f3b4f` | Localize generated rule and import-report controls |
| 2026-09-29 | `9926b960` | Localize device-sync messages and Russian release history |
| 2026-09-29 | `a71246d5` | Translate historical release notes into Chinese and Hindi |
| 2026-09-29 | `081b1720` | Translate historical release notes into Spanish and Arabic |
| 2026-09-29 | `49c64de4` | Translate historical release notes into French |
| 2026-09-29 | `7422fe16` | Translate historical release notes into Bengali |
| 2026-09-29 | `72ea1239` | Translate historical release notes into Portuguese |
| 2026-09-29 | `ec62bf23` | Translate historical release notes into Indonesian |
| 2026-09-29 | `d970d899` | Translate historical release notes into Urdu |
| 2026-09-29 | `7f3943ee` | Translate historical release notes into German |
| 2026-09-29 | `f31e5351` | Translate historical release notes into Japanese |
| 2026-09-29 | `03447e74` | Translate historical release notes into Marathi and Italian |
| 2026-09-29 | `6aa7355e` | Translate historical release notes into Vietnamese |
| 2026-09-29 | `97c7dddd` | Translate historical release notes into Korean |
| 2026-09-29 | `0352aca9` | Translate historical release notes into Swahili |
| 2026-09-29 | `f2c0518d` | Translate historical release notes into Persian |
| 2026-09-29 | `d9f395de` | Translate historical release notes into Hausa |
| 2026-09-29 | `87b568bb` | Translate historical release notes into Thai and Turkish |
| 2026-09-29 | `a20349b7` | Translate historical release notes into Western Punjabi |
| 2026-09-29 | `e5620812` | Translate historical release notes into Filipino |
| 2026-09-29 | `6f9a55a0` | Translate historical release notes into Cantonese |
| 2026-09-29 | `e24f4811` | Translate historical release notes into Tamil |
| 2026-09-29 | `4dace02a` | Translate historical release notes into Wu Chinese |
| 2026-09-29 | `befeb20d` | Translate historical release notes into Telugu |
| 2026-09-29 | `c416e7fb` | Translate historical release notes into Nigerian Pidgin |
| 2026-09-29 | `2d66a6df` | Keep current release links canonical across translations |
| 2026-09-29 | `23077fab` | Translate historical release notes into Amharic |
| 2026-09-29 | `d1df5dfd` | Translate historical release notes into Egyptian Arabic |
| 2026-09-29 | `e6fc65e0` | Translate historical release notes into Javanese |
| 2026-09-29 | `905b70d0` | Translate historical release notes into Gujarati |
| 2026-09-29 | `ed9cddf0` | Translate historical release notes into Kannada |
| 2026-09-29 | `5d1dee5d` | Translate historical release notes into Levantine Arabic |
| 2026-09-29 | `0307619f` | Localize dashboard dynamic messages across 38 catalogs |
| 2026-09-29 | `bdfae97f` | Translate historical release notes into Sudanese Arabic |
| 2026-09-29 | `5a6f6c8f` | Localize popup list-mode tooltips across 38 catalogs |
| 2026-09-29 | `afd4a44e` | Translate historical release notes into Yoruba |
| 2026-09-29 | `7381d342` | Translate historical release notes into Bhojpuri |
| 2026-09-29 | `71aea0e6` | Document localization coverage and remaining runtime gaps |
| 2026-09-29 | `a8821cf9` | Resolve automatic locale safely in content overlays |
| 2026-09-29 | `ceb624b5` | Update localization audit for popup tooltip coverage |
| 2026-09-29 | `6f2ef716` | Localize content-menu action status |
| 2026-09-29 | `7a7b40b8` | Wire self-control messages for localization |
| 2026-09-29 | `e4fd8a6a` | Wire managed viewing overlays for localization |
| 2026-09-29 | `97515f20` | Keep content-menu auto locale on released language |
| 2026-09-29 | `a1128877` | Add managed overlay translation draft |
| 2026-09-29 | `da466421` | Add managed overlay locale translation draft A |
| 2026-09-29 | `2f29699d` | Add hard whitelist translation draft subset |
| 2026-09-30 | `35a35aae` | Add managed overlay translations to locale catalogs |
| 2026-09-30 | `6828bf68` | Add self-control translation draft for 29 locales |
| 2026-09-30 | `f4247ad8` | Preserve YouTube brand in Egyptian Arabic draft |
| 2026-09-30 | `332b00d8` | Localize rule-list move status toasts |
| 2026-09-30 | `e62ad9a6` | Add self-control and hard whitelist translations |
| 2026-09-30 | `e869e5ed` | Include managed overlay source in localization audit |
| 2026-09-30 | `7f9c5c1d` | Translate rule-list move status toasts |
| 2026-09-30 | `e7865169` | Localize managed link policy dialog |
| 2026-09-30 | `0cbf12df` | Complete Pidgin managed overlay labels |
| 2026-09-30 | `b7d495a7` | Localize popup language choice labels |
| 2026-09-30 | `92b9ca55` | Translate popup language choice labels |
| 2026-10-01 | `b1108ec6` | fix(admission): retain verified video metadata across settings refreshes |
| 2026-10-01 | `6f50a7ee` | fix(playlists): stop autonomous navigation when filtering current video |
| 2026-10-01 | `b7e5c1f8` | feat(i18n): complete managed link policy translations for all 38 locales |
| 2026-10-01 | `c5d9d294` | test(issues): validate mobile Shorts identity and record issue evidence |
| 2026-10-01 | `6b3a84d9` | fix(embeds): recover exact loaded player metadata on selected Google playback |
| 2026-10-01 | `c34d3a02` | test(i18n): preflight draft conflicts before catalog writes |
| 2026-10-01 | `21b31972` | fix(admission): consolidate player banners and scoped playback refreshes |
| 2026-10-01 | `c2de14ee` | feat(i18n): translate managed list loading and validation errors |
| 2026-10-01 | `02f9d564` | fix(shorts): read nested mobile reel channel identity and player metadata |
| 2026-10-01 | `06ecda1e` | fix(i18n): share translated list mode controls across popup and dashboard |
| 2026-10-01 | `db8e0d75` | fix(i18n): localize shared component feedback and accessible names |
| 2026-10-01 | `3fa3ca4f` | fix(i18n): reuse profile availability copy across dashboard actions |
| 2026-10-01 | `b7d23288` | test(i18n): avoid brittle count for reused profile messages |
| 2026-10-01 | `37f54e40` | docs(help): describe staying on blocked playlist videos |
| 2026-10-01 | `b160b1b2` | docs: record focused issue fixes and localization validation boundaries |
| 2026-10-01 | `c82d3e57` | test(shorts): validate wrapped reel metadata through the actual engine |
| 2026-10-01 | `8f3a6789` | feat(i18n): translate backup import and export flows across all 38 languages |
| 2026-10-01 | `b54c9b0c` | fix(i18n): format dashboard dates and counts in the selected language |
| 2026-10-01 | `5792778d` | docs(i18n): record selected locale formatting and remaining frozen batches |
| 2026-10-01 | `ee4ba75a` | fix(i18n): refresh generated controls when interface language changes |
| 2026-10-01 | `46be21b4` | fix(i18n): localize remote target options without changing profile identity |
| 2026-10-01 | `94c48a27` | refactor(i18n): wire Family Devices and remaining dashboard messages |
| 2026-10-01 | `bafb36b4` | docs: record current linked issue regression evidence and limits |
| 2026-10-01 | `430e6739` | fix(i18n): distinguish captured dashboard text in copy audit |
| 2026-10-01 | `4aa0b665` | feat(i18n): draft Russian translations for remaining dashboard actions |
| 2026-10-01 | `51ea0a3b` | refactor(i18n): key delivery readiness copy without changing policy state |
| 2026-10-01 | `af0262f3` | feat(i18n): draft Russian delivery control translations |
| 2026-10-01 | `1d776369` | fix(i18n): reuse existing keys for dashboard modal labels |
| 2026-10-01 | `e46d2649` | test(i18n): preserve delivery feature names during translation merges |
| 2026-10-01 | `5ada1ff0` | docs(i18n): track translation batches and remaining release gates |
| 2026-10-01 | `ce31c790` | fix(admission): reject explicit selected video IDs without metadata delay |
| 2026-10-01 | `40697a9b` | feat(i18n): translate Family Devices across all 38 interface languages |
| 2026-10-01 | `ac05ef4a` | perf(admission): skip unnecessary metadata for verified ID-only decisions |
| 2026-10-01 | `849c1ba1` | refactor(i18n): wire setup and approval dialog messages |
| 2026-10-01 | `bbdf4747` | test(i18n): protect import syntax in translated help |
| 2026-10-01 | `b38c6f56` | test(i18n): audit shared components and current Nanah catalog |
| 2026-10-01 | `fbbfb218` | feat(i18n): complete dashboard status messages in 38 locales |
| 2026-10-01 | `42a7e535` | refactor(i18n): share render-time status localization |
| 2026-10-01 | `bd7360d5` | feat(i18n): complete delivery controls in 38 locales |
| 2026-10-01 | `83be997d` | fix(i18n): localize managed target scope display |
| 2026-10-01 | `e8262bc3` | feat(i18n): complete provider setup dialogs in 38 locales |
| 2026-10-01 | `f8b2cb13` | docs: record focused issue checks and remaining release gates |
| 2026-10-01 | `6bfe6a8f` | feat(i18n): finish import copy and localize remaining help surfaces |
| 2026-10-01 | `306af313` | build: exclude translation drafts from extension packages |
| 2026-10-01 | `6d109320` | feat(i18n): complete approval and import dialogs in 38 locales |
| 2026-10-01 | `5db09a1b` | feat(i18n): complete generated statuses in 38 locales |
| 2026-10-01 | `7b3ab813` | fix(i18n): translate delivery action labels instead of treating them as brands |
| 2026-10-01 | `dd8c1600` | fix(i18n): align shared PIN copy and validate translated action labels |
| 2026-10-01 | `1ab44cac` | feat(i18n): complete help tooltips in all 38 interface languages |
| 2026-10-01 | `a76fc45d` | docs: record completed localization and browser package verification |
| 2026-10-01 | `abaf9e5b` | fix(i18n): align RTL spacing and overlay language metadata |
| 2026-10-01 | `29b53cc3` | test: reconcile current rule and metadata fixtures |
| 2026-10-01 | `500dee3d` | feat(i18n): enable all 38 bundled languages without preview gates |
| 2026-10-01 | `6a2e6ade` | Fix serialized comment keyword matchers and document issue 79 evidence |
| 2026-10-01 | `8ff79e23` | Fix dashboard localization startup scope errors |
| 2026-10-01 | `6bb434e7` | Checkpoint remaining audit reconciliation and local semantic design |

## Release-preparation verification

Version consistency, locale checks, focused regressions and browser builds are recorded after the preparation run below. A successful archive build is not authorization to publish and does not waive the outstanding gates above.

October 1 final preparation results:

- `check:ui-locales:targets`: passes; 38/38 catalogs, 2,415 keyed entries each, 1,135 dashboard static fragments in every non-English static catalog. Structure only, not fluent review.
- `check:release-note-locales:complete`: passes; 29/29 release entries in each of 37 non-English catalogs. New entries retain the source's canonical release URL and translated CTA labels. Current-version static labels are updated to 3.4.0.
- Focused version consistency, dashboard startup, actual filter engine, direct admission and mobile Shorts owner suite: **96/96 pass**.
- `test:release`: **183/237 pass, 54 fail**. Failures include historical source hashes/counts, extraction contracts and lane-matrix expectations; the complete set has not been individually resolved. This is a failed release gate, not a publish-ready result.
- The existing historical release-notes boundary file separately passes 2/5 and fails three audit assertions; the new dynamic package/manifest/notice consistency tests pass 2/2. Historical assertions were not deleted or rewritten to manufacture success.
- Chrome, Firefox and Opera builds pass; local artifacts are `dist/filtertube-chrome-v3.4.0.zip`, `dist/filtertube-firefox-v3.4.0.zip` and `dist/filtertube-opera-v3.4.0.zip` (about 15.6 MB each). Rebuilt archives were inspected: each carries manifest version 3.4.0 and current release notes, includes the translated Russian 3.4.0 entry, and contains no `data/ui_locales/batches/` draft files.
- `git diff --check` passes. No push, tag, publication, installed settings change or native app bump was performed.

The worktree was checkpointed before this release preparation: `8ff79e23` repairs dashboard startup and `6bb434e7` records the remaining audit/semantic design work. The four historical comments audit failures described above remain open; committing their partial reconciliation does not certify their completion.

## Build follow-up: concurrent cleanup protection

The user reported an ENOENT for `dist/chrome/data/ui_locales/ko_static.json` during `npm run build`. The source Korean catalog and copied file were present on inspection. Copying is synchronous, but ZIP reading is asynchronous; another full/browser build can remove the shared target directory while the first archive reads it. Overlap is a supported causal explanation, not a retrospective proof of which process removed that exact file.

All build targets now acquire one exclusive `.filtertube-build.lock` outside `dist` before UI generation, badge updates or cleanup. Competing processes fail clearly before touching build outputs. Normal completion, failure and SIGINT/SIGTERM release the lock. A forcibly killed process may leave a lock; the error requires checking no build remains before manual removal. Stale locks are not silently overwritten and missing files are not ignored.

After the change, full `npm run build` succeeds for Chrome, Firefox and Opera. Five build-lock/version consistency tests pass. A real overlapping Chrome/Firefox invocation confirms that the second build exits with the lock error before cleanup. Archive compressed-data checks pass for Firefox and Opera; Chrome is checked after the final owner build completes. No release is published by these checks.
