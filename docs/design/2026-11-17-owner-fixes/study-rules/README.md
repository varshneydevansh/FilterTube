# Study holds the rules (2026-11-17)

These shots come from a headless Chromium with a throwaway profile that was never signed in. A Gentle session (UBE and SAT packs) was seeded straight into `chrome.storage.local`. The `before-*` shots use `master` at 00d7f486; the `after-*` shots use this branch.

| Shot | What it shows |
| --- | --- |
| `before-popup-study-*.jpg`, `before-header-study-*.jpg` | During a study session the pill still said "Blocklist", and a tap switched the list. |
| `after-popup-study-*.jpg`, `after-header-study-*.jpg` | The pill shows the effective mode: "Study" in sage with the timer icon. Its tooltip reads "Study · only your plan's channels and topics until 8:47 PM". |
| `after-pill-opens-study-*.jpg` | Tapping the pill opens the Study page instead of switching the list. |
| `after-loosening-sheet-*.jpg` | A blocked word was removed during the session. The background put it back, and the page shows the app's sheet: "This would loosen your study rules", with End session and Keep studying. |

## What changed

- **Skip break.** A skipped break now counts as study time, as on Android (`StudyClock.withSkips`). The allow list stays on, the time is credited, and Undo brings the break back. Before this, the rest of the break used the normal rules.
- **Loosening during study.** A change that loosens the rules is refused while a Gentle or Locked session runs, or while a parent's plan holds the profile. The extension uses a port of `StudyRuleLoosening.loosens` (`study_model.ruleLoosens`) and puts the old rules back. It also compiles from the rules held at that moment, so a looser write never takes effect, even briefly. Switching the list mode, importing an allow list, and adding a Kids allowed channel get the same refusal.
- **Effective mode.** `js/shared/effective_mode.js` works out the mode in one place: Study during a round, a rest break, the plan's limit or a clock hold, and the profile's own mode at all other times. The popup, the dashboard header, the left-pane rows and the Home greeting all read it.
- **Study page.** It says plainly when FilterTube isn't allowed in private windows. It also names the browser policies a family can use: ExtensionSettings and IncognitoModeAvailability.
- **Uninstall.** Uninstalling FilterTube opens https://filtertube.in/uninstalled.
