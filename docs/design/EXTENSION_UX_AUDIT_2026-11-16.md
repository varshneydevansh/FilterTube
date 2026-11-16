# Extension UX audit and mascot pass, 2026-11-16

Branch `feature/ext-ux-mascots`, on top of the first PaperKit pass (`f4111820`). This is the design lead's audit of every surface the extension owns, what was wrong, what changed, and what is left. Screenshots are in [`screens-2026-11-16/`](screens-2026-11-16/) (light and dark for each surface; `before/` holds the four baseline captures referred to below).

The Android app is the source of truth for look and feel (`docs/app/design-system/` in the app repository: PaperKit, icons, doodles, terminology, sounds, interaction and animation plans). The character rules come from the aKriti brand library's `BIBLE.md`.

## How it was checked

- The unpacked extension was loaded in Chromium (Chrome for Testing) and every options section, the popup and the first-run state were captured at 1360 px wide, in light and dark, with the Companion setting on Lively. Dashboard, Support and popup were captured again with the Companion Off, and the dashboard with Quiet.
- The in-page surfaces (blocked video, the check before playback, the study gate, the study break, the first-run prompt) were rendered on a stand-in page with a stub extension API, because they need a video page and a rule to trigger.
- Offline and back-online were produced by switching the page's network off and on. Toasts were raised through `UIComponents.showToast`.
- `prefers-reduced-motion` was checked in code and tests: every sheet rests on one still, and the hop, strip and chip animations are switched off.

## The rules this pass applies

1. **Kriti and Uljhan are the only characters.** No Kagaz, Mohar, Phoolu, Bindu or Rekha, in pictures, copy or code names. Doodles (sparkle, tick, wavy underline) are marks, never characters.
2. **Present, characterful, never in the way.** A pose never covers a control, never moves the layout when it speaks, is never focusable unless it has something to say, and is always `aria-hidden` when it is decoration. No character on a lock, a PIN prompt, the time-limit screen, a clock hold or the in-session strip.
3. **One Companion setting governs all of it** (Settings, Companion): Lively plays a sheet once and allows a little idle life, Quiet (the default) shows stills only, Off removes every character and leaves the words. The in-page surfaces read the same setting.
4. **Motion** is swapped stills plus transform and opacity. A sheet plays once at 180 ms a frame and rests on its last frame. Idle life is three small hops on the dashboard pair, seven to nine seconds apart, then rest; nothing loops. Reduced motion shows the resting still at once.
5. **Paper, not glass, for anything you read or press**; cream and brick by day, one navy at night; brick is the only action colour.
6. **Poses are cut-outs.** Every file is a WebP with an alpha channel (a test reads the header), so nothing carries a white card or halo on navy. Uljhan's ink limbs would vanish on navy, so at night a soft pool of paper light sits *behind* his picture, never on its edge.
7. **Sounds stay optional** (Off by default; Gentle or Playful). This pass adds one use: the success sound with "Saved for {name}".
8. **Copy is honest.** Support copy says FilterTube is free and that support is optional, every time. It may say "no servers keeping your data"; it never says "no servers", because device sync uses a small relay.

## Where Kriti and Uljhan are now

| Surface | Trigger | Who | Pose | Line | Notes |
|---|---|---|---|---|---|
| Options, first open after install | Once | Kriti | Holds the logo | "I'll keep what you block out of sight." | From the first pass; unchanged |
| Dashboard hero | Every open | Kriti and Uljhan | The sieve sheet, standing on the profile card's top edge | "Hi, I'm Kriti. I keep the good stuff flowing." on hover, focus or click | Lively: sheet once, then three hops. Quiet: the last frame |
| Sidebar footer | Every page | Kriti | Peek, 36 px, beside the version | none | Sits inside the footer's own height |
| Empty blocked list (options) | List is empty | Kriti | Peek | "Add a word to start filtering." | First pass |
| Empty blocked list (popup) | List is empty | Kriti | Peek, 48 px | none (the list says it) | New |
| Search with no matches | No result | Uljhan | Shrug | "Nothing here. Try fewer words." | First pass |
| Loading (`moment('loading')`) | A list is fetching | Uljhan | Fetch sheet | One of six lines; never one of the last three | New. Lively shows the line; Quiet the pose only |
| Error (`moment('error')`) | Something didn't load | Uljhan | Shrug | "That didn't load. Try again." | First pass |
| Success toast | Any success toast | Kriti | Thumbs up, 36 px | the toast's own words | New |
| Error toast | Any error toast | Uljhan | Shrug, 36 px | the toast's own words | New |
| Parent session bar | A change to a child's space saves | Kriti | Thumbs up, 28 px | "Saved for {name}" | New. The key existed and nothing used it |
| Connection strip (options and popup) | Offline | Uljhan | Sad | "You're offline" and "Your filters still work. Sync will wait." | New |
| Connection strip | Slow (2g) | Uljhan | Front | "Slow connection, still sifting…" | New |
| Connection strip | Back online | Uljhan | Happy | "Back online" | New. Shows for 3.5 s |
| Study status card (options) | By state | Kriti | Reading (no session), notebook (a round), mug (a break), thumbs up (done) | none | New. A clock hold has no character |
| Support page and dashboard card | Each open | Kriti | Rotates with the copy | Title, body and the "free and optional" note | New. Five variants |
| About | Always | Kriti and Uljhan | Wave and front | Who they are | New |
| Backup import | Done | Kriti | Thumbs up | "Settings imported." | First pass |
| Profiles, one profile only | Always | Kriti | Wave | "Just you so far" | First pass |
| Popup counter | 100, 1,000, 10,000 hidden | Kriti | Sieve loop | "{count} things kept out of your way." | First pass |
| Popup | Allow list turns on | Kriti | Upside-down sieve | "Only allowed channels get through." | First pass |
| In page: blocked video | A blocked video opens | Kriti and Uljhan | The shoo sheet: he sneaks up, she waves him off, he hops away | none (the card explains) | New |
| In page: study gate, off the plan | Off-plan video | Kriti | Points at the plan | none | New |
| In page: study gate, not now | Break, limit, clock check | Kriti | Mug | none | New |
| In page: study break | Break screen | Kriti | Mug | none | New |
| In page: done for today | Daily limit | Kriti | Thumbs up | none | New |
| In page: study pack unavailable | Pack can't load | Uljhan | Shrug | none | New |
| In page: first-run prompt | First tab after install | Kriti | Wave | none | New |

Not placed, on purpose: the short "Checking before playback" card, the managed time-limit screen and its status chip, the viewing-route gate, PIN and lock prompts, decision dialogs, the release-notes banner, the three-dot menu, and the study strip in the popup.

## Surface by surface

### Toolbar popup
![popup, light](screens-2026-11-16/popup-light.jpg) ![popup, dark](screens-2026-11-16/popup-dark.jpg)

- **Found:** the list card ended in square corners inside the rounded frame (`before/popup-light.jpg`); the empty list was a bare italic line; nothing told you when the browser was offline.
- **Changed:** the list card is a paper sheet with its own 16 px corners; Kriti peeks beside "No keywords blocked" and "No channels blocked"; the connection strip sits under the hidden counter, inside the frame ([offline](screens-2026-11-16/popup-offline-light.jpg), [offline, dark](screens-2026-11-16/popup-offline-dark.jpg)).
- **Left:** the popup's night panels are navy now; the header chip keeps its green "enabled" tile.

### First run
![first run](screens-2026-11-16/first-run-light.jpg) ![first run, dark](screens-2026-11-16/first-run-dark.jpg)

- **Found:** the welcome card works. On a truly fresh profile the Android announcement dialog opens over it (`before/tab-dashboard-dark.jpg`), so the first thing a new person sees is an advert for another product rather than Kriti.
- **Changed:** nothing in the dialog's logic. Recommended follow-up below.

### Dashboard
![dashboard, light](screens-2026-11-16/tab-dashboard-light.jpg) ![dashboard, dark](screens-2026-11-16/tab-dashboard-dark.jpg)

- **Found:** no character on the page people open most; the night sidebar kept a cream brand tile; a 1 px rule ran down the left edge of the content column; the support card at the foot was the same paragraph every time.
- **Changed:** Kriti and Uljhan stand on the profile card (the card drops to the hero's foot and keeps 128 px above it, so the pose is never clipped; under 1180 px the same margin keeps it clear of the copy). The brand tile is a night sheet. The stray rule is gone. The support card takes this opening's variant.
- Companion Off: [dashboard](screens-2026-11-16/companion-off-dashboard-light.jpg). Quiet at night: [dashboard](screens-2026-11-16/companion-quiet-dashboard-dark.jpg).

### Filters: keywords, channels, content controls
![keywords, light](screens-2026-11-16/tab-filters-keywords-light.jpg) ![keywords, dark](screens-2026-11-16/tab-filters-keywords-dark.jpg)

- **Found:** at night this page was plum, not navy (each page tone brought its own dark panel colour).
- **Changed:** every page uses the palette's navy for page, panels, strokes and ink at night; tones keep their accent for chips and edges only. Empty search: [light](screens-2026-11-16/tab-filters-search-empty-light.jpg), [dark](screens-2026-11-16/tab-filters-search-empty-dark.jpg). Content controls: [light](screens-2026-11-16/tab-content-controls-light.jpg), [dark](screens-2026-11-16/tab-content-controls-dark.jpg).
- **Left:** "Hide Playables" keeps its name. It is the control that hides that shelf, and the app keeps the same wording for the same reason (TERMINOLOGY.md); nothing else names it.

### Kids
![kids, light](screens-2026-11-16/tab-kids-light.jpg) ![kids, dark](screens-2026-11-16/tab-kids-dark.jpg)

- **Found:** consistent with Filters. The profiles card names the Kids site, which it has to (it links a profile on that site).
- **Changed:** night parity only.

### Settings, Study and focus, Backup and restore
![settings](screens-2026-11-16/tab-settings-light.jpg) ![study](screens-2026-11-16/tab-study-light.jpg) ![backup](screens-2026-11-16/tab-backup-light.jpg)

- **Found:** the Study status card was a grey box with a ring and two lines.
- **Changed:** Kriti sits at the far end of the status card and changes with the state. Study data and logic were not touched (another branch owns them). Dark: [settings](screens-2026-11-16/tab-settings-dark.jpg), [study](screens-2026-11-16/tab-study-dark.jpg), [backup](screens-2026-11-16/tab-backup-dark.jpg).

### Accounts and sync, Profiles and PIN
![sync, dark](screens-2026-11-16/tab-sync-dark.jpg) ![profiles, light](screens-2026-11-16/tab-profiles-light.jpg)

- **Found:** "Connect a device" stayed a white card at night with unreadable text (`before/tab-sync-dark.jpg`). 137 strings on this page and the BlockTube export existed only in English, and 111 static fragments had no translation.
- **Changed:** the card is a night sheet. All of those strings are translated (see Copy). Light: [sync](screens-2026-11-16/tab-sync-light.jpg). Dark: [profiles](screens-2026-11-16/tab-profiles-dark.jpg).
- **Left:** no character on pairing, phrase checks or PIN prompts, by rule.

### What's New, Help
![what's new](screens-2026-11-16/tab-whatsnew-light.jpg) ![help, dark](screens-2026-11-16/tab-help-dark.jpg)

- **Found:** the page title stayed in English outside the first sections (it was set from a fixed English table). Help mixed navy and plum cards at night.
- **Changed:** the title is the section's own nav label from the same catalog key, in every language. Night parity. Dark: [what's new](screens-2026-11-16/tab-whatsnew-dark.jpg). Light: [help](screens-2026-11-16/tab-help-light.jpg).

### About
![about, light](screens-2026-11-16/tab-about-light.jpg) ![about, dark](screens-2026-11-16/tab-about-dark.jpg)

- **Found:** the headline ran to five lines at about 110 px, the portrait card stretched to match and showed a blank panel above the photo, and the top bar kept the previous page's title because About was missing from the title table.
- **Changed:** the headline is at most 64 px and three to four lines; the portrait keeps a 4:5 frame; the title reads "About". A sun-wash card introduces Kriti and Uljhan.

### Support (was "Donate")
![support, light](screens-2026-11-16/tab-support-light.jpg) ![support, dark](screens-2026-11-16/tab-support-dark.jpg)

- **Found:** the nav said "Donate" while the app and every button say "Support"; the hero was one long sentence with no character (`before/tab-support-light.jpg`).
- **Changed:** the section is "Support" in every language (the app's own word). The hero takes one of five variants (classic, sieve, one person, morning, evening), each with its pose and a note that always says free and optional. The first one ever shown is classic; none of the last two comes back; morning and evening keep to their hours; with the Companion Off only the variants that name no character are used ([off](screens-2026-11-16/companion-off-support-light.jpg); the popup with it off: [popup](screens-2026-11-16/companion-off-popup-light.jpg)). The app's "caught", "shoo", "unlocked" and "tea break" variants were left out: two say "no data on servers", one promises the prompt stops for supporters (the extension cannot know), and one says "cancel anytime", which is not what a one-time tip is.

### States
- Toasts: [success](screens-2026-11-16/state-toast-success-light.jpg), [success, dark](screens-2026-11-16/state-toast-success-dark.jpg), [error](screens-2026-11-16/state-toast-error-light.jpg), [error, dark](screens-2026-11-16/state-toast-error-dark.jpg).
- Connection: [offline](screens-2026-11-16/state-offline-light.jpg), [offline, dark](screens-2026-11-16/state-offline-dark.jpg), [back online](screens-2026-11-16/state-back-online-light.jpg), [back online, dark](screens-2026-11-16/state-back-online-dark.jpg).
- Moments (loading, error, nothing found, done, break, reading, slow): [light](screens-2026-11-16/state-moments-light.jpg), [dark](screens-2026-11-16/state-moments-dark.jpg).

### In-page surfaces
![blocked, light](screens-2026-11-16/inpage-blocked-video-light.jpg) ![blocked, dark](screens-2026-11-16/inpage-blocked-video-dark.jpg)

- **Blocked video. Found:** a frosted glass panel with light text over the scenery, the same in light and dark, and no character. **Changed:** a paper sheet (cream by day, navy at night), brick status line, rose reason box, and Kriti shooing Uljhan above the brand row. The scenery video stays behind it and still stops with reduced motion.
- **Check before playback:** [light](screens-2026-11-16/inpage-checking-light.jpg), [dark](screens-2026-11-16/inpage-checking-dark.jpg). Paper sheet, no character (it is on screen for a moment).
- **Study gate:** [off the plan](screens-2026-11-16/inpage-study-gate-off-plan-light.jpg), [off the plan, dark](screens-2026-11-16/inpage-study-gate-off-plan-dark.jpg), [not now](screens-2026-11-16/inpage-study-gate-not-now-light.jpg), [not now, dark](screens-2026-11-16/inpage-study-gate-not-now-dark.jpg). The card was white on mint; it is paper on canvas now, keeps its teal status and button (Study's colour), and Kriti stands at its corner.
- **Study break and done for today:** [break](screens-2026-11-16/inpage-study-break-light.jpg), [break, dark](screens-2026-11-16/inpage-study-break-dark.jpg), [done](screens-2026-11-16/inpage-study-done-for-today-light.jpg), [done, dark](screens-2026-11-16/inpage-study-done-for-today-dark.jpg). These screens had no night colours; they follow the page's theme now.
- **First-run prompt:** [light](screens-2026-11-16/inpage-first-run-prompt-light.jpg), [dark](screens-2026-11-16/inpage-first-run-prompt-dark.jpg). Paper, brick pill on its ledge, Kriti waving.
- **Session "Saved for…":** the catalogs carried `parentMode.savedFor` in every language and no code showed it. A save to a child's space now raises it on the session bar with Kriti's thumbs up. No Kagaz anywhere: none was found in pictures or copy, and the counter mark's class name (`__bindu`) was renamed.
- **Not restyled:** the managed time-limit screen, its status chip and the viewing-route gate (parent-control surfaces; no character by rule, and their layout is covered by their own tests).

## Night parity

| Found | Fix |
|---|---|
| Each page tone had its own dark panel (plum on Filters and Help, brown on amber pages) | One navy from the palette for page, panel, stroke and ink; tones keep only their accent |
| Cream brand tile in the dark sidebar | Night sheet, light wordmark, brick accent |
| White "Connect a device" card | Night sheet |
| Study break and limit screens had no dark colours | Sun-wash and navy night variants |
| Blocked card looked the same in light and dark | Paper by day, navy at night |
| Uljhan's limbs disappear on navy | A soft paper light behind his picture only |

## Copy

- **Neutral terms** were already in place from the earlier copy passes (Clips, Following, Saved, Auto playlist, Popular, Posts, Paid chat, Sangeet). This pass adds "Support" for the section that was "Donate".
- **New lines** (29 keys): six loading lines, four connection lines, three for the pair, fifteen support lines and the section name, plus the reuse of `parentMode.savedFor`. Twenty-seven come from the app's own translations in all 38 catalogs; two exist only in the extension ("Your filters still work. Sync will wait." and "Uljhan is the tangle of distraction she sieves out.") and were translated here.
- **Untranslated keys:** 137 catalog keys existed only in English (sync picker, QR scanner, BlockTube export, restore-preferences, profile manager). 53 matched app strings word for word and took the app's translations; 84 were translated here. 111 static fragments of the options page were missing from every language: 64 matched keyed strings and took those translations; 45 were translated here. Every catalog now has all 2,807 keys.
- **Honesty checks in tests:** every support note says "free" and "optional" (or "up to you"); no support line says "no servers" without "keeping your data"; nothing says open source, unlock or premium; no new line names the video site or a retired character.
- The extension itself is open source and may say so; nothing in this pass needed to.

## What is left

1. **Native review of the new translations.** The lines translated here (84 keys, 45 fragments, two mascot lines, in 37 languages) were checked for placeholders, protected terms and markup, not by native speakers. The smaller languages (Yoruba, Hausa, Amharic, Javanese, Bhojpuri, the Arabic varieties, Wu and Cantonese) need it most. "Receive nearby" follows each catalog's existing label for that button, which reads "Let this device appear".
2. **Release notes for 3.5.0 and 3.4.2** are English only in 37 languages (`npm run check:release-note-locales`). Not part of this pass.
3. **57 stale static translations per language** point at English text that no longer exists (`npm run check:ui-locales` lists them). Harmless at run time; pruning them is a separate clean-up.
4. **First-run order.** On a fresh install the Android announcement dialog covers Kriti's welcome. It should wait until the welcome is dismissed, or move into the dashboard's app cards.
5. **Light page tones.** By day each page still has its own pastel wash behind the paper cards. It reads as PaperKit because everything you touch is cream paper, but the app has one canvas; worth a decision.
6. **Loading moments are available but not yet wired to every wait.** `FilterTubeMascots.moment('loading')` is ready; the channel import, the Kids profile reader and device pairing still show their own text while they wait.
7. **Uljhan offline with the cord, tangled in a box, and Kriti's blink** are in the brand shot list and not drawn yet; the sad, shrug and front poses stand in.
8. **Managed time-limit screen and viewing-route gate** still use the older sky gradient. They should move to paper in a pass that owns their tests.
9. **Firefox and Opera** load the same pages and assets; the captures here are from Chromium only.
