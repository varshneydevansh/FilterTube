# Extension screen parity with the Android app, pass 2 (2026-11-17)

Follows `../2026-11-17-ext-screen/PARITY.md` (Study home, Controls hub, profile picker, Study toasts).
Same method: the Android source on `feature/android-3.6.2-study`, captures from `emulator-5582` (the
app's own debug previews where they exist; nothing on the shared emulator was changed), and the
extension's `dist/chrome` in headless Chromium with a throwaway test profile. Files: `android-*`,
`before-*`, `after-*`.

## 1. Page titles

Checked every sidebar row's page title against the screen the matching Controls tile opens on Android.

| Row | Android screen title | Extension (after) |
| --- | --- | --- |
| Controls | Controls | Controls |
| Filters | Filters | Filters |
| Content Controls | Filters (its tab) | Filters |
| Kids Mode | Kids Mode | Kids Mode |
| Settings | Settings | Settings |
| Study and focus | Study and focus | Study and focus |
| Backup & restore | Settings (its category) | Settings |
| Accounts & Sync / Profiles & PIN | Accounts & Sync | Accounts & Sync |
| What's New, Help, About, Support | the same names | the same names |

- Before: the in-page titles already matched after pass 1, but the browser tab was still titled
  "FilterTube Dashboard" on every page, and the page opened with "Dashboard" until a route changed it.
- Ported: the browser tab follows the page ("FilterTube · Controls", "FilterTube · Study and focus", …).
- Still different: a few Help answers still say "Dashboard" in their running text (with their own
  translations); renaming them needs a translation pass of those Help answers.

## 2. Study leftovers

Android: `StudyDayRingView.sealRound/exhale/ripple/scribble`, `StudyFocusActivity.heroMoments`,
`StudyRipple`, `StudyRingModel.completedRounds/roundsToReplay`, `StudyCountrySheet`.

Captures: `study/android-setup-country-card.jpg`, `study/android-country-sheet.jpg`,
`study/before-setup-country-select.jpg`, `study/after-setup-card.jpg`, `study/after-setup-sheet.jpg`,
`study/after-setup-sheet-search.jpg`, `study/after-skip-break-next-round.jpg`.

Ported (`js/study_ui.js` `ringMoments`, `dayRing`; `css/study.css`):
- Round sealing: when a round completes, its hatch turns solid sage over 300 ms with Kriti's giggle;
  a round that finished while the page was closed replays once; the first look at a session replays none.
- The break "exhale": the ring scales 100 → 97 → 100 % as a break arrives.
- The five-minute ripple: the running round's stroke swells 16 % and settles over 600 ms at every
  five minutes from the round's start (checked on each 20-second redraw, never twice for one beat).
- Skip break's scribble: a sage zigzag over the skipped span draws on and fades.
- After Skip break the home shows the next round running (the app's state), not "On a break until …".
- The setup country card: the country, "Picked from your browser's language" when it came from the
  browser, and "Change", which opens the "Where are you studying?" sheet: a search field, the browser's
  country first, Anywhere, then every country with packs A to Z, the current one in brick with a check.
  The sheet closes with Escape, the ×, or a tap outside.
- Strings: "Search countries" from the app in 38 locales; the two "browser's language" lines are the
  extension's own wording of the app's "phone's region" lines, translated by hand into all 38 locales.

Removed: the country drop-down (`.ft-setup-country__select`).

All motion is off with reduced motion, as on Android.

## 3. PIN gate

Android: `PinGateActivity.kt`, `res/layout/activity_pin_gate.xml`, `strings.xml` (`pin_gate_*`, `pin_hint_*`).
No Android capture: the shared emulator's profile has no PIN and must not get one. The PIN for these
captures (2468) was set only in the headless test profile, with `FilterTubeSecurity.createPinVerifier`.

Captures: `pin/before-pin-prompt.jpg`, `pin/before-popup-locked.jpg`, `pin/after-pin-prompt.jpg`,
`pin/after-pin-wrong.jpg`.

| Area | Android (layout and code) | Extension before |
| --- | --- | --- |
| Header | Eyebrow in brick ("Master access" / "Protected profile") over the card title | Eyebrow and title side by side, the title pushed to the right |
| Field | `numberPassword`, digits centred | Text field, left-aligned, no numeric keyboard hint |
| Error | "Try again" line in the danger colour under the field | The line existed but read in ink on the page tones |
| Action | One full-width Unlock (profile switch and close are separate icons) | Cancel and Unlock side by side |
| Wrong PIN | Field shakes, clears, line shows | Same (ported earlier) |

Ported (`js/tab-view.js` and `js/popup.js` `showPromptModal` for `inputType: 'password'`, `css/paperkit.css`
`.ft-modal.is-pin`): a dialog role, the stacked brick eyebrow and hand-lettered title, the centred
numeric field, the brick "That PIN didn't work. Try again." line, Unlock across the card with Cancel as
a quiet text button under it.

Still different: the app's title names where the PIN leads ("Enter Master PIN for Main Viewing"); the
extension's says "Enter Master PIN" because its gate is for the whole options page. The app's gate has
the avatar button that opens the profile picker; in the extension the page's own avatar does that.

## 4. Dialogs, toasts, support, parent mode and Nearby

### Dialogs (FilterTubeMessageDialog)

Android `FilterTubeMessageDialog.kt`: a paper card, an optional mascot only on a failure notice, the
title (card title) over the message (body ink), the brick primary across the card, the secondary under it.

- Before: confirm dialogs (`showConfirmModal` on the options page, the popup's yes/no prompt) put the
  title in a header row and Cancel / Confirm side by side, small.
- Ported: `.ft-modal.is-message` (`css/paperkit.css`), set by `showConfirmModal` (with `role="alertdialog"`)
  and the popup's question prompt: stacked header, message in ink, the primary across the card with the
  secondary full width under it.
- Capture: `dialogs/after-confirm-dialog-fixture.jpg` (the markup `showConfirmModal` builds, drawn in
  place, because no confirm can be reached in a fresh profile without changing data). No Android capture:
  every message dialog on the emulator sits behind an action that changes the shared device.

### Toasts

- Study's toasts became the paper toast in pass 1. The general `UIComponents.showToast` (success with a
  check, error with Uljhan) is already the app's notice look (`dialogs/current-toast-success.jpg`,
  `dialogs/current-toast-error.jpg`) and was not changed; the filters' Undo uses the paper undo bar.
- Still different: Android shows plain confirmations (no Undo) as a paper toast at the bottom centre;
  the extension's general toasts sit at the bottom right of the options page.

### Support page

Captures: `support/android-support.jpg` (store build), `support/current-support.jpg`.

- Different by distribution, so not ported: the app's page is the store build's (Google Play
  subscriptions, "A subscription simply keeps the project going"); the extension's is Ko-fi with the
  app's support-sheet variants (Kriti's "been sieving all day" and the others), which is the app's own
  direct-build sheet.
- "I've already supported FilterTube": on Android it silences the launcher's support reminder
  (`SupportOfferSheet`). The extension shows no support reminder, so the switch would have nothing to do.

### Parent mode / Ask a parent and Nearby sync

Not captured against the app: both need a child profile or a second device on the shared emulator,
which this pass must not create. Their ledger rows and earlier ports stand; parity is not claimed here.

## 5. Mascot moments outside Study and Controls

| Android moment (file) | Extension surface | State |
| --- | --- | --- |
| Loading with a loading line (`LoadingPersonality`, KRITI_SIEVE_LOOP, the loading lines) | `FilterTubeMascots.moment('loading')`: the Study page's first load, the followed-channels import while it fetches | Added here: the moment existed but nothing showed it |
| Uljhan fetch-more (`UljhanLoadMore`, ULJHAN_FETCH) | The followed-channels import (page after page) | Added here (the loading moment's Uljhan fetch). The site's own feeds load more by themselves; the extension doesn't own that footer |
| Empty lists (`MascotMoments.emptyState` + its one action) | Keyword and channel lists on the options page and in the popup (`decorateEmptyList`) | Already ported |
| "Shoo, Uljhan!" on a blocked video (DUO_SHOO, three a day, then Uljhan's shrug) | `js/content/admission_overlay.js` blocked card (`SHOO_FRAMES`, `SHOO_DAILY_PLAYS = 3`) | Already ported |
| Idle life (`MascotIdleInteraction`) | `idleLife()` on every mascot moment, the support art, the gate's Kriti | Already ported |
| First filter (DUO_SIEVE), allowed-only nod (KRITI_LOGO_SIEVE) | `firstFilterMoment` above the lists | Already ported |
| Hub peek (`FirstFilterMoment.buildHubPeek`) | Controls | Pass 1 |
| Break stretch (KRITI_STRETCH) | Break overlay on the video page | Pass 1 |
| Network offline / back online / slow | `mountNetwork` on the options page | Already ported |
| Good evening (KRITI_GOOD_EVENING) | The evening support variant | Already ported |
| Kids viewer motions (`KidsViewerMotion`) | None: the extension has no viewer of its own | Can't exist |

## 6. Other older surfaces found

- The Help page still names "Dashboard" in a few answers (see §1).
- The popup's study strip still says "End" (compact) where the app's session strip says "End session";
  kept because the popup row has no room for the 30-second note.
