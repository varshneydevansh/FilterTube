# The extension against the Android app: feature audit (2026-11-16)

Branch `feature/ext-parity-3`, from `feature/ext-parity` (`1560043c`), then pass 4 on `feature/ext-parity-4` (from `25f9cc56`). Source of truth: the Android app at `feature/android-3.6.2-study` (Release 3.6.2, 30605). Earlier passes: [EXTENSION_UX_AUDIT_2026-11-16.md](EXTENSION_UX_AUDIT_2026-11-16.md) (palette, characters, Support) and [PARITY_PASS2.md](PARITY_PASS2.md) (PaperKit, motion, sounds). The screens are in [PARITY_PASS3.md](PARITY_PASS3.md) and, for pass 4, [PARITY_PASS4.md](PARITY_PASS4.md).

Every user-facing Android feature that could apply to a browser extension is listed below. "At audit" is what the extension had on `1560043c`; "Now" is after pass 4. Paths: **A/** is `apps/android/app/src/main/java/com/filtertube/app/` in the app repository, everything else is in this repository.

- **Present**: the extension does what the app does, for the same rule or state.
- **Partial**: it exists but behaves differently, or covers only part of the app's feature.
- **Missing**: the app has it; the extension doesn't.
- **N/A**: it can't or shouldn't exist in an extension (the app's own player, its native screens, device features).

## Summary

| | At audit | After pass 3 | Now (pass 4) |
|---|---|---|---|
| Present | 29 | 53 | 63 |
| Partial | 24 | 11 | 5 |
| Missing | 15 | 4 | 0 |
| N/A | 5 | 5 | 5 |
| **Rows** | **73** | **73** | **73** |

Top gaps found, in the order they were fixed (all fixed on this branch unless marked):

1. **Kids allowed videos were blocked.** The extension read Kids `videoIds` as blocked videos; on the app they are the parent's allowed videos. Fixed.
2. **Kids words saved by the app filtered nothing.** The app stores Kids words as plain strings and sync copies them as is; the extension's Kids compiler read only `entry.word`, so every synced Kids word was dropped. Regex rows, date windows and paused rows were ignored on Kids too. Fixed.
3. **A child could switch profile out of a parent's lock or plan** (popup, options page or the time-limit switcher) without that parent's PIN, which ends Study for that tab. Fixed in the background, so any writer is checked.
4. **Allowed-only mode showed every comment.** The app shows only allowed authors or allowed words. Fixed in the data-level filter and the page scan.
5. **Paused managed-list words still filtered.** Fixed.
6. **A child could set Study up for itself** through the background message, and the popup's PIN prompt had no wrong-try limit. Fixed.
7. **No relay disclosure before internet sync.** Fixed (asked once, device-wide).
8. **A restore during a study round** went ahead. Fixed ("Restore after study").
9. Pass 4: a card whose channel isn't known yet now decides like the app (an allowed word waits under layered rules while a blocked channel could still match; an allow-mode Short never shows on a topic match; a display name alone never stands in for the channel). A collaboration still loading waits for the full list. Names match as one key set and "Filter all" derives the app's word. Cross-platform fixtures from the app's tests.
10. Pass 4: Family edits need a fresh parent unlock; "End and switch" ends a Gentle session after its 30-second pause and then switches.
11. Pass 4: Ask a parent and "Allow once" in the app's signed `filtertube.ask.v1` format over `study_family`; live-chat message filtering; "Skip this video"; "Comments from X hidden · Undo"; DoodleKit's heart and sparkle.
12. Pass 4, found on the live site: the compiler never read the passes (fixed); a Kids-site direct watch link during a Kids learning round now goes through the watch gate (fixed and checked).
13. **Still Partial:** Ask a parent covers video asks only (no ask from a blocked channel page, no Study "Ask for time", no notifications); see the Family table.

## Filters

| Feature | App | At audit | Now | Extension files |
|---|---|---|---|---|
| Word rules: substring, Exact (Unicode whole word), Han/Hangul/Kana anywhere, regex, Comments, Date window | A/NativeOwnedFilterDecider.kt `NativeCompiledKeywordRule.matches`, CjkKeyword.kt | Partial: the page scan folded accents ("cafe" hid "café") | Present | js/background.js `compileKeywordEntries`, js/filter_logic.js, js/content/dom_fallback.js `matchesKeyword` |
| Paused managed-list rows filter nothing | A/FilterPayloadCompiler.kt:425 | Partial: words still compiled | Present | js/background.js `compileKeywordEntries` |
| Channel rules: UC id, alternate ids, @handle, /c/, /user/, original input | A/NativeOwnedFilterSnapshot.kt:311 | Present | Present | js/shared/identity.js |
| Channel rule matched by display name when the card's UC id differs | A/NativeOwnedFilterDecider.kt:2635 | Partial | Present (names and handles meet as one key set, as the app; fixtures in tests/runtime/fixtures/app-parity/) | js/shared/identity.js `channelMetaMatchesIndex`, js/content/dom_fallback.js `channelMetaMatchesIndex` |
| Collab videos: any collaborator matches; waits while the list loads | A/NativeOwnedFilterDecider.kt:903 | Partial: decides on the partial list | Present ("A and 2 more" with fewer known waits unless a known collaborator hits a rule; with no channel rules nothing about the channel can change the outcome, so it shows) | js/shared/identity.js `channelIdentityStrength`, js/filter_logic.js `_pendingChannelIdentityDecision`, js/content/dom_fallback.js `domPendingChannelIdentityDecision` |
| Layered allow + block (any block wins; otherwise allow wins a tie) | A/StudyRules.kt `RuleLayerDecision` | Present | Present | js/filter_logic.js, js/content/dom_fallback.js `shouldHideContent` |
| Allowed word with the channel not known yet (Shorts included): waits hidden | A/NativeOwnedFilterDecider.kt:950-999, `ShortsAllowRule` | Partial: shows | Present (the extension keeps one fallback: an unmatched weak solo card in block mode still shows, since the site may never name its channel) | js/shared/identity.js `decidePendingChannelIdentity`, js/filter_logic.js, js/content/dom_fallback.js |
| "Filter all" word derived from a channel (falls back to handle, custom URL, id) | A/FilterPayloadCompiler.kt:346 | Partial | Present | js/shared/identity.js `channelFilterAllWord`, js/background.js, js/settings_shared.js |
| Allowed and blocked video ids | A/NativeOwnedFilterDecider.kt:913 | Present | Present | js/background.js, js/filter_logic.js |
| Remove a rule, then Undo (batched, 5 s, drain line, "Put back.") | A/PaperUndoBar.kt, A/FilterRemovalUndo.kt | Missing | Present | js/state_manager.js `undoRemoval`, js/ui_components.js `showUndoBar` |
| A new row: area wash 600 ms, fade 300 ms, crayon underline | A/FilterRowAnimator.kt `FilterRowWash` | Missing | Present | js/ui_components.js `highlightAddedRows` |
| Keyword row layout: word, then the chip row with delete at its end | res/layout/item_keyword.xml | Partial (one line) | Present | css/paperkit-parity.css, js/render_engine.js |
| Channel row layout: logo, name, subtitle, delete; mapping row; Filter all | res/layout/item_channel.xml | Partial | Partial (the extension keeps its node-mapping card) | js/render_engine.js `createFullChannelItem` |

## Content controls

| Feature | App | At audit | Now | Extension files |
|---|---|---|---|---|
| Duration (longer, shorter, between), upload date, ALL-CAPS (single word, all caps, both), minimum views (default 500) | A/NativeOwnedFilterDecider.kt `blockByCommonContentFilters` | Present | Present | js/filter_logic.js `_checkContentFilters`, js/content_controls_catalog.js |
| Category allow mode with the category unknown: waits | A/NativeOwnedFilterDecider.kt:1278 | Present (the page scan holds the card pending; the data-level filter can't fetch it) | Present | js/filter_logic.js `_checkCategoryFilters`, js/content/dom_fallback.js |
| Language filter | A/NativeOwnedFilterDecider.kt | Present | Present | js/filter_logic.js `_checkLanguageFilters` |
| Clips (Shorts), Playables, members-only, mixes, sponsored, playlists and the 39 toggles | A/ContentControls*, TERMINOLOGY.md | Present | Present | js/content_controls_catalog.js, js/content/dom_fallback.js |
| Hide all comments; comment words; blocked authors; "filter all comments" | A/FilterPayloadCompiler.kt:211 | Present | Present | js/filter_logic.js, js/content/dom_fallback.js `handleCommentsFallback` |
| Allowed-only mode: only allowed authors or allowed words show in comments | A/NativeMainCommentsProvider.kt `commentHidden` | Missing | Present | js/filter_logic.js, js/content/dom_fallback.js `commentHiddenByAllowList` |
| Live chat: each message under the full rules | A/NativeMainCommentsProvider.kt `liveChatBlocker` | Missing (hide-live-chat toggle only) | Present (checked on a live stream) | js/shared/live_chat_filter.js, js/content/live_chat_filter.js, js/content/live_chat_identity.js |
| "Comments from X hidden · Undo" note in the comment list | A/NativeCommentsHiddenNote.kt | Missing | Present (checked on the live site) | js/content_bridge.js `showCommentAuthorHiddenNote`, js/background.js `undoCommentAuthorBlock` |
| Neutral terms in the extension's own words (Clips, followers, no platform names) | docs/app/design-system/TERMINOLOGY.md | Present | Present | data/ui_locales/*.json |
| Count neutralizer on the site's own labels ("24K subscribers" to "followers") | A/PlatformCountNeutralizer.kt (native screens only; matching keeps raw text) | N/A: the extension doesn't rewrite the site's page | N/A | |

## Kids

| Feature | App | At audit | Now | Extension files |
|---|---|---|---|---|
| Kids allowed videos (`videoIds`) let a video through in Allowed only, never outranking a block | A/NativeOwnedFilterDecider.kt:1226 | Partial: treated as blocked | Present | js/background.js `kidsFallbackAllowedVideoIds`, js/filter_logic.js |
| Channels the child follows count as allowed | A/NativeOwnedFilterDecider.kt:1228 `kidsSubscriptionKeys` | Missing | Present | js/background.js `rawWhitelistChannels` |
| Kids words as plain strings, regex, date, paused | A/AppPreferences.kt:7767 | Partial: strings dropped | Present | js/background.js (Kids compile) |
| Kids content filters run before list rules | A/NativeOwnedFilterDecider.kt:1172 | Present | Present | js/filter_logic.js |
| Kids site: a direct watch link during a Kids learning round | (the app has no Kids website) | Partial | Present (the watch gate runs on the Kids site during a learning round: off-pack "Not part of today's study", a pack video plays; checked at the real Kids URL with a stand-in page, since the Kids site's parent setup can't be passed headless) | js/content/dom_fallback.js `isKidsLearningRound`, js/content/study_overlay.js |

## Study v3

| Feature | App | At audit | Now | Extension files |
|---|---|---|---|---|
| Study dashboard (ring, plan bar, week) | A/StudyPaper.kt, A/StudyHub* | Present | Present | js/study_ui.js `renderDashboard` |
| Planner | A/StudyPlanner* | Present | Present | js/study_ui.js `renderPlanner` |
| Setup explainers | A/StudySearchExplainer.kt, Kids note | Partial: the search explainer is missing | Partial | js/study_ui.js |
| Country packs (175 packs, 56 countries) | data/study/packs-v1.json | Present (same file) | Present | js/shared/study_packs.js |
| Branch rules | A/StudyRules.kt | Present | Present | js/shared/study_engine.js `studyBranchFilter` |
| Kids learning and study time on Kids | A/NativeKidsLearningLoader.kt | Present | Present | js/shared/study_engine.js, js/content/study_overlay.js |
| In-page gate, break, done for today, clock hold | A/StudyGate* | Present | Present | js/content/study_overlay.js, js/content/dom_fallback.js |
| Clock-change guard | A/StudyClockGuard* | Present | Present | js/shared/study_clock_guard.js |
| Study Family control (same device and remote) | A/StudyFamilyUi.kt | Present | Present | js/study_background.js, js/nanah_sync_adapter.js |
| Switching profile during study: parent's PIN typed now; Locked refuses; Gentle ends first | A/StudyProfileSwitch.kt, A/StudySwitchGate.kt | Missing (Self-Control check only) | Present ("End and switch": the session ends after its 30-second pause, then the background switches) | js/study_background.js `switchDecision`, js/background.js `enforceStudyProfileSwitch`, js/popup.js and js/tab-view.js `passStudySwitchGate` |
| A child can't set study up for itself; nobody loosens during a clock hold | A/StudySetupActivity.kt:94, A/StudyRuntime.kt `holdsLoosening` | Partial: only under a parent's plan | Present | js/study_background.js `update`, js/shared/study_model.js `tightenAllowed` |
| Parent edits need a fresh unlock of that parent | A/ParentModeChrome.kt:166 | Partial | Present (a PIN typed in the last 5 minutes, checked in the background for every edit) | js/study_background.js `parentContext`, js/background.js `isParentUnlockFresh`, js/study_ui.js `sendAsParent` |
| Restore waits while study runs | A/StudySwitchGate.kt `StudyRestoreGate` | Missing | Present | js/tab-view.js `studyHoldsRestore` |
| A parent's lock sent during a child's own Self-Control session | A/StudyRuntime.kt | Partial (may be reverted by the session snapshot; not reproduced) | Partial | js/background.js `enforceSelfControlProfileSnapshot` |
| "Skip this video" | A/StudyRuntime.kt `skipVideo` | Missing | Present (on the watch page while study runs; the app also offers it in a card's menu) | js/study_background.js `skipVideo`, js/content/study_overlay.js `renderSkip` |
| Music while studying | A/plan.music | N/A (no own player) | N/A | |
| Outside links held during study | A/StudySwitchGate.kt `StudyLinkGate` | N/A (the browser owns links) | N/A | |

## Family, profiles, sync, backup, time

| Feature | App | At audit | Now | Extension files |
|---|---|---|---|---|
| Parent mode frame (Managing, Done, "Saved for {name}") | A/ParentModeChrome.kt | Present | Present | js/tab-view.js |
| Ask a parent, Ask for time, "Allow once" | A/AskParent*.kt, A/AskParentPasses | Missing | Partial (video asks, "Allow once", "Always allow this channel", Requests with a fresh PIN, "Let Aarav ask", the signed `study_family` exchange with the apps; not yet: an ask from a blocked channel page, Study's "Ask for time", notifications) | js/shared/ask_parent.js, js/ask_parent_background.js, js/content/admission_overlay.js, js/tab-view.js `renderAskParentInbox`, js/popup.js `renderAskParentAnswer` |
| Profiles redesign and doodle avatars | A/Profile*, DoodleKit | Present | Present | js/doodles.js, js/ui_components.js |
| PIN: set, verify, lockout after wrong tries | A/Pin* | Partial: the popup had no limit | Present (the popup checks through the background) | js/security_manager.js, js/background.js `verifyAndCacheSessionPin`, js/popup.js |
| Nanah pairing and sync | A/Nanah* | Present | Present | js/nanah_*.js |
| Relay consent before internet sync | A/InternetSyncRelayConsent.kt | Missing | Present (devices already paired keep syncing) | js/tab-view.js `ensureInternetSyncConsent` |
| Kriti thinking while the other device is on its way | A/StudyFamilyUi.kt:192, A/AskParentUi.kt:267 | Partial (pose shipped, unused) | Present | js/nanah_pairing_ui.js |
| Personal-sync areas match the app (settings, notes, playlists) | A/NanahAutoSyncStore.kt:274 | Present (the screen offers those three; "study" exists only in the protocol) | Present | js/device_auto_sync_ui.js, js/personal_sync.js |
| Backup and restore (study merged, parent's lock kept) | A/BackupExportEnvelope.kt | Present | Present | js/io_manager.js |
| Time limits and extra-time grants | A/TimeLimit*, A/Managed* | Present | Present | js/background.js, js/content/bridge_settings.js |
| Managed time-limit screen and viewing-route gate in the app's look | A/ManagedTimeout*, PaperKit | Partial (glass, other fonts, no character) | Present (paper, Delius, Kriti with mug, thinking, pointing) | js/content/bridge_settings.js |

## Look, moments and words

| Feature | App | At audit | Now | Extension files |
|---|---|---|---|---|
| Hub: profile header, Today card, tiles; no hero copy, no Play promotion | A/NativeControlCenterView.kt, A/DashboardActivity.kt:176 | Partial (hero copy, Play button, apps and preview blocks) | Present | html/tab-view.html, css/paperkit-parity.css |
| Rolling numbers on the Today card and tiles | A/RollingCounterView.kt | Missing | Present | js/paperkit_parity.js `rollTo` |
| Kriti peeks over an empty hub (once a day per profile) | A/FirstFilterMoment.kt `buildHubPeek` | Missing | Present | js/mascots.js `mountHubPeek` |
| First-filter moment (once per profile) | A/FirstFilterMoment.kt | Missing | Present | js/mascots.js `firstFilterMoment` |
| In-page shoo at most three times a day, then Uljhan's shrug | A/MascotStates.kt `BLOCKED_DAILY_PLAYS` | Missing | Present | js/content/admission_overlay.js |
| Mascot moments (loading, empty, offline, error, nothing found, done, break) | A/MascotStates.kt, A/MascotMoments.kt | Present | Present | js/mascots.js `MOMENTS` |
| Sounds (13 cues, Gentle and Playful, gates) | A/UiSound.kt | Present | Present (the undo swish and giggle now have triggers) | js/mascots.js |
| Doodles: check, underline, scribble, heart, sparkle | A/DoodleKit.kt | Partial (no heart, no sparkle) | Present (heart and sparkle where the app plays them: the onboarding commit, the Support touches) | js/doodles.js, js/mascots.js |
| Support sheet variants (9, by hour, last three remembered) | A/SupportSheetVariants.kt | Partial (5) | Partial (5 on purpose: "caught" and "shoo" say "no data on servers", which the extension's copy rule forbids; "unlocked" promises the sheet stops showing; "tea" talks about cancelling) | js/mascots.js `SUPPORT_VARIANTS` |
| What's new | A/SettingsSectionActivity.kt `renderWhatsNew` | Present | Present | js/tab-view.js, data/release_notes.json |
| Onboarding, three pages | A/FirstInstallWelcomePlan.kt | Partial (one card, skipped with the Companion Off) | Present | js/mascots.js `mountWelcome` |
| Network states (offline, slow, back online) | A/MascotStateViews.kt, A/NativeOwnedNetworkExperiencePolicy.kt | Present (slow means 2g; the app measures requests) | Present | js/mascots.js |
| Popup fields at the app's 48 px | PaperKit field | Partial (63 px) | Present | css/paperkit-parity.css |
| No web-font request; Delius and Outfit bundled | PaperKit type | Partial (Google Fonts requested) | Present | html/popup.html, html/tab-view.html |
| Only Kriti and Uljhan; transparent art; "open source" only for the extension | BIBLE.md, about_open_source_body | Present | Present | assets/images/mascots |
| The app's own player, local media, Sangeet, downloads | A/Local*, A/Sangeet* | N/A | N/A | |
| Native count neutralizer | (see Content controls) | N/A | N/A | |

## How it was checked

- Each Android file named above was read on `feature/android-3.6.2-study`; each extension path was traced to the rule or screen it owns.
- Every fix has a test or a capture: `tests/runtime/study-background-controller.test.mjs` (switch decision, child setup), `tests/runtime/json-first-whitelist-decision-identity-boundary-current-behavior.test.mjs` (allowed-only comments), `tests/runtime/mascots.test.mjs` (the shoo cap); the undo, wash, first-filter, peek, onboarding, hub, pairing and managed screens are in [PARITY_PASS3.md](PARITY_PASS3.md).
- `npm test` after pass 3: 1,709 pass, 13 fail, the same 13 known failures as on `1560043c`.
- Pass 4: `tests/runtime/app-parity-*.test.mjs` port the app's own tests (NativeOwnedFilterDeciderTest, StudyRulesTest, AskParentTest, NativeMainLiveChatFilterRulesTest) with fixtures in `tests/runtime/fixtures/app-parity/`; the live-site walkthroughs and their captures are in [PARITY_PASS4.md](PARITY_PASS4.md). `npm test`: 1,756 pass, 13 fail, the same 13 known failures.
