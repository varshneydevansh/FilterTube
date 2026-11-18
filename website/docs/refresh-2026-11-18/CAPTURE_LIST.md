# Screenshots to capture

Six screens on each of five devices, from the latest builds. Every screen the site shows today comes from an older build, so all 30 are needed.

| Slot | What to show |
|---|---|
| Home | Main Home with a few filtered cards. Include the "blocked" count if it shows. |
| Study home | Study running with a pack chosen (SAT, UBE, GATE or a school subject). Show the round ring and the lesson feed. |
| Watch | A video playing, with Up next or the recommendations. Use a nature or study video. |
| Kids | Kids Viewing home with the child's profile. |
| Controls | FilterTube Controls overview. |
| Sangeet player | Sangeet's now playing screen with album art and controls. |

## Per device

| Device | Size and orientation | File names | Today on the site |
|---|---|---|---|
| iPhone | 1206 × 2622, portrait | `ios/iphone-<slot>.webp` | Controls (old build), plus viewing spaces and filters as extras. 5 slots empty. |
| iPad | 2732 × 2048 or the simulator's landscape size | `ios/ipad-<slot>.webp` | Nothing. The site shows a "screens are on the way" card. |
| Android phone | 1080 × 2424, portrait | `android/phone-<slot>.webp` | Watch, Kids, Controls and Sangeet from 3.5.0. Home and Study home are empty. |
| Android tablet | 2560 × 1600, landscape | `android/tablet-<slot>.webp` | Watch, Kids, Controls and Sangeet Explore (not the player) from 3.5.0. Home and Study home are empty. |
| Android TV | 1920 × 1080 | `android/tv-<slot>.webp` | Home, Watch, Kids and Controls from 3.5.0. Study home and Sangeet are empty. Skip any screen TV doesn't have. |

`<slot>` is one of `home`, `study`, `watch`, `kids`, `controls`, `sangeet`. Files go in `website/public/apps/screenshots/`.

## Before you capture

- Use the light theme and a clean status bar (no notifications), with the battery full if possible.
- Use a test profile, not a personal account. Don't show names, emails or watch history you'd rather keep private.
- Pick calm, neutral content: nature documentaries, study lessons and music.

## Dropping them in

1. Convert each capture to WebP, keeping its width: `cwebp -q 78 capture.png -o android/phone-home.webp`.
2. In `website/data/screenshots.js`, point the device's slot at the file, set the real `width` and `height`, and set `current: true`. Write a short `alt` that says what's on screen, without naming the video site.
3. The home device strip, the platform galleries and the iPad placeholder update on their own. Run `npm run build` to check.

## Status (updated 2026-11-18, extras refresh)

Fresh captures from the latest builds (Android 3.6.2 debug on Pixel_9a-class and Pixel_Tablet emulators, TV debug on a 1080p TV emulator, iOS feature/ios-parity on an iPhone simulator). Phone Sangeet shots are the owner's own Pixel captures.

| Device | Done | Still open |
|---|---|---|
| iPhone | Home, Study, Watch, Kids, Controls, Sangeet, plus extras: viewing spaces, keyword filters, search, player, player settings, You, Sangeet moods, Sangeet search, channel rules, content controls, Accounts & Sync, settings, integrations, Kids Mode, study session, session done | Chapters and channel page (the sample lecture has no chapters; the channel page was not captured), Study break screen (needs a timed break), Sangeet Home and queue (the Home feed shows explicit items) |
| iPad | Home, Study, Watch, Kids, Controls, Sangeet | None |
| Android phone | Study, Watch, Controls, Sangeet (owner Pixel), extras: viewing spaces, search, player, player settings, chapters, channel + mini player, Sangeet Explore, moods, podcasts, focus, playlist, queue (owner Pixel), You, channel rules, content controls, Accounts & Sync, pairing, Kids Mode, Self-Control, settings, integrations | Home and Kids Home (owner is capturing on a real phone); Kids screens (home, parent PIN, search, watch, rules) |
| Android tablet | Home, Study, Watch, Controls, Sangeet, Sangeet Explore, search grid, block menu | Kids home, search and two-pane watch |
| Android TV | Controls, Home, Kids Home, viewing spaces, search, search results, You, filters, Kids Mode, settings, Accounts & Sync, Kids search, Kids watch | Watch (the ambient glow did not render on the emulator, so the old capture stays), Subscriptions (the feed is a personal one with gaming items) |
