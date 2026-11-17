# Extension screen parity with the Android app, pass 3 (2026-11-17)

Follows `../2026-11-17-ext-screen/` and `../2026-11-17-ext-screen-2/`. Same method; Android on
`emulator-5582` only (test data), the extension's `dist/chrome` in a headless Chromium test profile.

Test data created on `emulator-5582`, through the app's own UI, with no account sign-in:
- a Kids profile named **TestKid** (Controls › Switch profile › Add a Kids profile, avatar Initial);
- **no PIN** was set: no flow used in this pass needed one.

Test data in the headless extension profile only: a child profile "Aarav" under Default (renamed "Mum"
for the answer capture), one ask and one answer seeded into `ftAskParentV1`.

## 1. Toasts

Captures: `toasts/android-paper-toast.jpg`, `toasts/before-toast-error.jpg`,
`toasts/after-toast-{success,error}.jpg`.

- Before: general toasts sat at the bottom right of the window with a coloured left stripe.
- After: bottom centre, a paper card with the crayon edge and ledge, like the app's toasts
  (`css/paperkit.css`, last block). Kriti (success) and Uljhan (error) stay beside the words.

## 2. Help answers that said "Dashboard"

The Help section list ("Dashboard: See status…") and two Accounts & Sync answers now say "Controls".
All 37 translated static catalogs were updated: the word for Controls replaces the word for Dashboard
(fr "les Contrôles", ru "раздел «Управление»", tr "Kontroller", ha "Ikon Sarrafawa", am "መቆጣጠሪያዎች"; locales
whose sentence kept the English section names now say "Controls"). `en_static.json` was regenerated
from the page, so the static catalogs match the English inventory again: the tab title "FilterTube ·
Controls" and the "Controls" title are translated, and 24 fragments no longer on the page (the removed
support card and older hero copy) were dropped from every catalog.

## 3. Ask a parent

Android: `AskParentUi.kt` (`buildAsk`, `flyAway`, `buildSent`, `requestCard`, `answerCard`),
`AskParentActivities.kt`, `strings_ask_parent.xml`. Capture of the app's create sheet for the Kids profile:
`ask/android-create-kids-profile.jpg`. The child's ask on Android starts from a blocked video in the
Kids viewer; that needs a blocking rule and a video opened in the app's viewer from the video site,
so its sheet was compared by source.

| Part | Android | Extension before | After |
| --- | --- | --- | --- |
| Child's ask sheet (blocked card on the video page) | Kriti with her crayon beside "Ask to watch"; the title and channel on a washed note; reasons; note; Not now / Send to Mum | Title only, no Kriti, no note of what's asked | Kriti with her crayon (`kriti_crayon.webp`, from the app), the washed note with title and channel |
| Sending | The note folds (scaleY .28, 220 ms), then flies up and aside turning −14° as it fades (420 ms) | A short rise and fade | The app's fold and fly (`js/content/admission_overlay.js`) |
| Sent | Kriti thinking, "Sent to Mum", a sage check, where it goes, OK | No check, no OK | Sage check and OK (OK leaves the waiting line) |
| Parent's request card | Title; "by channel"; the reason as a note badge; the note in italics; asked/ends time; Allow once and Always allow this channel full width; "Not now" opens a one-line kind reply with Send; "Open Aarav's space" | Reason and time in one meta line; the reply field always open; buttons in one wrapping row | As the app (`js/tab-view.js` `renderAskParentRequest`, `css/paperkit-parity.css`); "Send" from the app in 38 locales |
| Child's answer (popup) | Kriti happy (yes), reading (a note), front (no note); the parent's note on washed Family paper in the hand font; Watch now / OK | Kriti thumbs up / thinking; the note as one italic line | The app's poses (`kriti_front.webp` added from the app) and the washed note |

Captures: `ask/before-parent-request.jpg`, `ask/after-parent-request.jpg`, `ask/before-child-answer.jpg`,
`ask/after-child-answer.jpg`.

Removed: the always-open reply field on the request card; the one-line italic note on the answer.

Still different: the app's answer card stacks Kriti over a centred title; the popup keeps her beside
the words to fit 400 px. The child's ask sheet has no capture (above).

## 4. Parent mode (the framed session)

Captures: `parent-mode/android-parent-session.jpg` (Profiles › TestKid › Manage rules),
`parent-mode/current-parent-session.jpg` (the extension's Edit Rules for Aarav).

Compared and already matching (ported earlier): the sun crayon frame round the whole page, the slim bar
with the child's avatar and star, "{name}'s space", the "Managing" badge, "Changes here apply to
{name}.", where it runs ("On this phone" / "In this browser"), and one exit, Done. Nothing was changed.
Still different: the app's bar sits above the page title; the extension's sits under the page header,
and it adds the session's age ("In session 1 min").

## 5. Nearby sync and pairing

Captures: `nearby/android-sync-1.jpg` (Accounts & Sync categories), `nearby/android-nearby-{1,2}.jpg`
(Connect a device), `nearby/before-sync.jpg`, `nearby/after-sync.jpg`.

- Ported: the app's relay disclosure where pairing starts ("Internet sync uses a small relay run by
  FilterTube's developer… Google's STUN server… Nearby sync uses neither."), from `sync_relay_disclosure`
  in 38 locales. It is true for the extension too: code/QR pairing uses the same signalling relay
  (`nanah-signaling…workers.dev`) and Google's STUN server (`js/vendor/nanah.bundle.js`); nearby uses the
  local helper.
- Not ported, and why: the app's Connect page (Your devices, Send to nearby device / Connect by address,
  the three update kinds as cards, device label, Start Pairing, session state) is a different layout
  from the extension's device map (Add with code or QR / Receive nearby / Find nearby around "This
  device"). Both run the same pairing and safety-phrase flow. Rebuilding the extension's map as the
  app's page is a larger change than this pass; it is listed for the next one.
- No pairing was completed: nearby on the extension needs the optional desktop helper, which the headless
  test profile doesn't have, and code/QR pairing would register the test devices with the live relay.
