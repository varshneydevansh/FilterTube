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
