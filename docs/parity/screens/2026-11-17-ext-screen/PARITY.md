# Extension screen parity with the Android app (2026-11-17)

The port ledger (`docs/parity/PORT_LEDGER.md`, `node tools/parity/ledger.mjs check`) lists 99 of 100
Android changes as ported. That says the features exist; it does not say the screens look and behave
like the app. This pass compares each screen by hand, Android first, and fixes what differs.

- Android source of truth: `~/FilterTubeApp`, branch `feature/android-3.6.2-study` (785223edb).
- Android captures: `adb -s emulator-5582` (debug build 3.6.2). Study states use the app's own debug
  preview (`StudyFocusActivity --es study_preview idle|round|last5|break|end`), so no profile on the
  shared emulator was changed.
- Extension captures: `dist/chrome` from `npm run build:chrome`, loaded unpacked in Chromium 1208
  (puppeteer-core, headless, a throwaway profile under the tools folder, never signed in). States are
  seeded straight into `chrome.storage.local` (a plan, a running session, an ended session).
- Files: `android-*` (app), `before-*` (extension at 09a52239), `after-*` (this branch).

---

## 1. Study

Android files: `StudyFocusActivity.kt` (the Study home and the Change plan page), `StudyDayRingView.kt`,
`StudyHomeModels.kt` (StudyRingModel), `StudyMascotView.kt` (poses and frame motions),
`StudyStateTheme.kt`, `StudySetupActivity.kt` / `StudySetupViews.kt`, `strings_study.xml`.

Captures: `study/android-study-{idle,round,last5,break,end,plan}.jpg`, `study/android-focus-1.jpg`
(no plan yet), `study/android-setup-1.jpg`; `study/before-study-tab.jpg`, `study/before-setup.jpg`;
`study/after-{nopack,idle,round,last5,break,end,plan}-light.jpg`, `study/after-{idle,break}-dark.jpg`,
`study/after-page-idle-light.jpg`.

### Differences found (before)

| Area | Android | Extension before |
| --- | --- | --- |
| Where it lives | Its own screen, "Study and focus" | A card inside Settings, under a "Study mode" eyebrow and a summary paragraph |
| Layout | One column: hero card, This week, "Session and channels" rows, Settings, Family | Status box, then the whole planner inline, then a Start now form, then a separate Self-Control card |
| Day Ring | 232 dp centred ring: big number + label ("165 min planned", "23 min left", "3:57 left of your break", "35 min studied"); sun beads for breaks; hatched live round; brick "now" pointer; the break drains inside | 120 px ring at the left with "Not studying" / "until 4:00 PM"; ink tick; no planned-day ring |
| Hero line | "Start a round" + "Next study 4:00 PM" pill; "Round 2 of 4" + "Break at …, done by …"; "On a break until …" + "Done by …" | "Not studying / No study session right now" |
| Hero action | One per moment: Set up, Start now + "50 min, Gentle · Change" (choices fold out), Open study + quiet End session, Skip break (brick pill) + its cost | Start now form always open (length chips, How it ends chips, hint, Start studying) |
| Kriti | Perched on the hero card: reading (idle), peeking over the top-left with her notebook and pencil tap (round), holding "5 min" (last five), mug (break), pointing (child under a parent's plan), salute after Skip break; one bubble a day | One still reading picture inside the status box |
| Continue lecture | Row with a sage play tile during a round | Missing |
| This week | Beads M–S, today ringed, count on the right ("1 study day" / "Your first round starts the week.") | Seven grey dots, count underneath |
| Session and channels | Change plan (time range), What you study, Daily limit, Self-Control Session, What search shows during study | Not there; the explainer was always open; Self-Control was a big separate card |
| Change plan page | Day bar with hour labels and two handles, "Right now · …" note, Days chips, Start/End ± steppers, choice chips with a check, Study round / Break steppers, Daily limit card | Slider rows with −15/+15, checkbox for the limit, segmented pills, no round/break length |
| End card | Full page: close ×, scalloped seal with the minutes, Kriti jumps onto the rim and keeps her medal, headline, rounds card, This week, Done, Plan tomorrow | Smaller seal inside the card, Kriti jump only |
| Settings | Show this week switch | Missing |
| Family | "Plan for {child}" rows | Only inside the Family command centre |
| Setup kind tiles | Chevron on each tile | No chevron |
| Popup "Open" | Opens Study | Opened Settings |

### Ported

- New `#studyView` page; the "Study and focus" sidebar row opens it (`data-tab="study"`, `#study`).
  Children and a running Self-Control Session can open it (read-only; the background already refuses
  every change they can't make).
- `js/study_ui.js`: `renderDashboard` rebuilt as the Study home (hero, Kriti's perch, Continue lecture,
  This week, Session and channels, Settings, Family) with a `home`/`plan` mode; `renderPlanPage` is the
  Change plan page and is also what a parent sees for a child (with "What you study" into setup and
  "Set by you"); `dayRing()` / `ringState()` / `heroLines()` follow `StudyDayRingView` and
  `StudyFocusActivity.ringState/heroLines`; the end card follows `showEndCard`.
- Kriti's perch poses and motions copied byte for byte from the app: `kriti_happy`, `kriti_sign_raised`,
  `kriti_salute`, `kriti_medal`, `kriti_pencil_01-06` (KRITI_OPEN_NOTEBOOK / KRITI_PENCIL_TAP),
  `kriti_stretch_01-05` (KRITI_STRETCH). The mascot budget test moved from 1.3 MB to 1.6 MB for them.
- Continue lecture: the round's last lecture is recorded with the study tick
  (`study_overlay.js` sends `videoId`; `study_background.js` keeps `runtime.lastVideo` and returns
  `lastVideoId` for this session only).
- 65 strings ported from `strings_study.xml` in all 38 locales (`tools: port_strings.py`); plural
  forms filled for every category.
- Setup kind tiles get the chevron.
- The break rest overlay on the video page: Kriti stretches once as the break opens (KRITI_STRETCH, 280 ms frames), then rests; none with Companion Off, a still with reduced motion.
- `src/extension-shell/popup.jsx` said "YouTube time" while the committed bundle said "Viewing time":
  the source now matches the bundle.

### Removed

- The Settings "Study mode" card (`#ftStudyCard` moved into `#studyView`; its eyebrow and summary paragraph are gone).
- The inline planner (`renderPlanner`, `timeRow` sliders, `renderPlanBar`), the old pack picker
  (`packPicker` chips with ×), the old Start now form (`startNow`, `lockHint`), the old small ring and
  end card, and 77 now-unused CSS rules in `css/study.css` (`.ft-study-dashboard*`, `.ft-study-ring*`,
  `.ft-study-bar*`, `.ft-study-time*`, `.ft-study-packs*`, `.ft-study-endcard*`, `.ft-study-seal*`, …).
- The Self-Control card stays in Settings (as on Android, where it is a Settings section); Study links to it.

### Still different

- Ring motion: the draw-on sweep, the round-sealing hatch-to-solid, the break "exhale", the 5-minute
  ripple and the Skip break scribble are not all ported. The draw-on (once a day and after Start), Kriti's
  arrival spring, the bead pop, the seal stamp, the jump-to-medal and the Skip break squash are.
- The wax grain texture on the ring is approximated with an SVG displacement filter.
- "Captions on during study" (Settings switch) is not offered: the extension does not control captions
  of the site's own player during study.
- Kriti's bubble line shows once a day in Lively only; there is no tap reaction on the perch.
- The setup country card keeps a drop-down instead of Android's "Change" sheet, and the exam tile's
  doodle is the extension's seal picture, not the app's drawn rosette.
- TV/tablet two-pane variants of this screen do not apply to a browser page; the page is a single
  680 px column.

---

## 2. Controls hub and its mascot moment

Android files: `DashboardActivity.kt` (`controlCenterTileText`, tile routes), `ControlCenterModel.kt`,
`NativeControlsLayout.kt`, `FirstFilterMoment.kt` (`buildHubPeek`), `strings_tv_controls.xml` /
`strings_controls_v2.xml`.

Captures: `controls/android-hub-{1,2,3}.jpg`; `controls/before-controls.jpg`;
`controls/after-controls-{lively,quiet}.jpg` (Companion Lively shows Kriti's bubble, Quiet her brick action).

### Differences found (before)

| Area | Android | Extension before |
| --- | --- | --- |
| Title | "Controls" | "Dashboard" (page title and sidebar row) |
| Mascot | Kriti with the logo sieve over the tiles when there are no rules (once a day): bubble in Lively, "Add a first filter" in Quiet; tap opens Filters | A Kriti-and-Uljhan "Hi, I'm Kriti" duo standing on the profile card on every visit; the hub peek used the small peek pose |
| Filters / Kids numerals | "0" shown | Hidden at 0 |
| Kids line | "No rules yet" / its counts | "Blocklist · Channels: 0" (the mode is the profile pill's job) |
| Study tile | Sage wash, "Self-Control is off" | Plain, "Off" |
| Backup | "Automatic backup is off" | "Auto backup off" |
| Accounts & Sync | "No saved devices. Pair with a code or QR." / "N trusted devices" | "No devices yet" / "N verified devices" |
| Profiles & PIN | "Default · 1 profile" | "Profiles: 1" |
| Help / About / Support | "Guides and filter tips" / "Version, links and licences" / "Support the build" | "Guides and answers" / "Who builds FilterTube" / "Optional support" |
| Support card | None on Controls (the Support tile opens the support sheet) | A full support promo card under the tiles |

### Ported

- `js/tab-view.js` `controlCenterSummary` uses the app's tile lines (10 strings from
  `strings_tv_controls.xml` in all 38 locales, plural forms filled); the page title and sidebar row say
  "Controls".
- `js/paperkit_parity.js`: numerals show 0; the Kids numeral is its rule count; Study's tile wears its
  sage wash.
- `js/mascots.js` hub peek follows `buildHubPeek` (KRITI_LOGO_SIEVE at 96 px, tappable, bubble or action
  by Companion mode).

### Removed

- The dashboard's "Hi, I'm Kriti" duo (`mountHero`, `.pk-hero-duo`, `.has-duo` spacing).
- The dashboard support promo card (`section.dashboard-support`); Support stays a tile and its page.

### Still different, and why

- "Sign in" row and the "Not signed in" half of the Accounts tile: the app signs in to the video site
  itself; the extension uses the browser's own session and has no FilterTube sign-up, so there is nothing
  to sign in to.
- "Open video links in FilterTube" card and the "YouTube still opens video links" banner: Android link
  handling (app links / DomainVerificationManager). An extension already runs inside the site's pages.
- "Return to Viewing" and "Exit to profiles": the app's viewer and profile launcher; the extension's
  equivalents are the browser tab itself and the popup's profile switcher.
- The tile grid is four columns on a wide window and two on a narrow one (Android phone is two).
- The Settings tile keeps the extension's own line (backup state): the app's "Language, appearance,
  startup and integrations" names settings the extension page does not have.

---

## 3. Profiles: the profile picker

Android files: `ProfileDropdownPopup.kt`, `ProfilePickerRow.kt`, `ProfilePickerFooter.kt`,
`ProfileVisuals.kt`, `strings_profiles.xml`.

Captures: `profiles/android-switch-profile.jpg`; `profiles/before-{tab,popup}-switch.jpg`;
`profiles/after-{tab,popup}-switch.jpg`.

### Differences found (before)

| Area | Android | Extension before |
| --- | --- | --- |
| Title | "Switch profile" | A group header "Default (Parent)" |
| Row | Name + quiet role chip ("Parent"), what the profile is for ("Holds the Master PIN and manages everyone"), a brick "You're here" pill | Name, "Parent profile", a sage "You're here" chip |
| Only Default | Kriti waves over "Just you so far", body, "Add a Kids profile" | Nothing in the picker (the card was only on the Profiles page) |
| Actions | "Add an adult profile" (Parent), "Manage profiles and PINs" | None |
| Popup placement | A sheet inside the window | Anchored to the badge and cut off at the popup's left edge |

### Ported

- `js/ui_components.js`: `profileRoleChip`, `profileAboutLine`, `profilePickerFooter` (the app's
  ProfilePickerFooter plan: no footer on a Kids profile or during a Self-Control Session; Add an adult
  profile for the Parent only).
- Both pickers (`js/popup.js`, `js/tab-view.js`) use them, with the "Switch profile" title; account
  group headers show only when there are several accounts.
- The popup's actions open the options page at Profiles & PIN (`?view=sync&flow=create-kids|create-adult|profiles`),
  where the existing create buttons and their PIN gate run; the options page runs them in place.
- The popup picker is a sheet across the popup (`#ftProfileDropdownPopup` fixed, 8 px from each side).
- "You're here" is the brick pill; "PIN" is paper with a line.
- 10 strings from `strings_profiles.xml` in all 38 locales.

### Removed

- The badge-anchored popup dropdown position (the shift-into-view transform no longer applies in the popup).
- The "Parent profile" / "Adult profile" / "Kids profile" subtitles in the picker rows (still used in labels elsewhere).

### Still different

- The PIN gate was compared by source only (`PinGateActivity.kt` against the extension's prompt, which
  already has the app's shake, "That PIN didn't work. Try again." and no mascot): the emulator's only
  profile has no PIN, and setting one on the shared emulator was out of bounds for this pass.
- Android's profile picker also shows the Self-Control "pinned" and "unavailable" row lines; the
  extension disables the other rows during a Self-Control Session with its own tooltip.
