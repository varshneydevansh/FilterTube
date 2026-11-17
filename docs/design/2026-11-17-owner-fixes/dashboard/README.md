# Dashboard Home, About, Support (owner-approved redesign; items 8, 9, 10)

Captures: headless Chromium, a throwaway local profile with no sign-in. The state was seeded in `chrome.storage.local`: 14 hidden today and 52 min saved, 3 words and 1 channel, four entries in the hidden log, and a SAT study plan from 20:00 to 22:00. `before-*` comes from the build at `00d7f486`, `after-*` from this branch. Each capture exists in light and dark. Captures taken after 18:00 show the evening hello and the support sheet's evening variant.

## Home (`after-home-*`, `after-home-full-*`)

The older dashboard (hero, stats row, quick actions, app cards) is combined with the app's tile system:

- **Left pane:** the Controls tiles are now the navigation rows, as small tinted cards.
  - Filters is rose, Content Controls sky, Kids Mode sun, Study and focus sage, Accounts & Sync lilac. Settings, Backup & restore and Profiles & PIN are plain paper.
  - Each row has its icon, a live count (Filters, Content Controls, Kids Mode) and its one-line status.
  - Home is at the top. What's New, Help, About ("Kriti and Uljhan") and Support are quiet text links at the bottom.
  - States: hover deepens the wash and darkens the edge, press sinks 1 px, focus shows the 2 px ink ring, and the selected row gets the full wash, an ink edge and a crayon tab on its leading edge (`after-sidebar-hover-*`, `after-sidebar-focus-*`).
- **Greeting:** a time-of-day hello and "N things kept out today", the profile card with the Main/Kids switch and Switch profile, and Kriti sieving Uljhan (`FilterTubeMascots.mountLoop`). Lively loops the sieve, Quiet plays it once, and reduced motion shows a still.
- **Stats row:** hidden today, time saved, words and channels, as Delius numerals on a brick crayon swoosh.
- **Study today:**
  - Shows the planned minutes, the next round, today's progress bar, Start now and Change plan, and fork A's study length slider (`FilterTubeStudyUi.mountLengthSlider`).
  - With no plan, it shows "Set up study" instead.
- **What Uljhan tried today:**
  - Lists the last five hides from today, from a 30-item log kept on this device only (`ftHiddenLogV1`, `js/shared/hidden_log.js`). Each one is written where the hide is counted (`content_bridge.incrementHiddenStats`).
  - Each item says what hid it: a blocked word, a blocked channel, a content control, or not being on the allowed list.
  - **Allow** adds that one video to the profile's `allowedVideoIds`. That is a precise exception, and it outranks a blocked word or channel. For a content control the button says **Change** and opens Content Controls.
  - A Kids profile or a running Self-Control Session can't allow.
- **Quick actions:** Add word, Add channel, Start study, Kids mode.
- **FilterTube everywhere:** the older app cards, now on paper.
  - Android phone and tablet, and Android TV, both point to the same Google Play listing.
  - iPhone and iPad point to the sideload guide at filtertube.in/ios, and the card says plainly that Apple hasn't approved the developer account yet.
- **Support strip:** "Even $1 a month keeps FilterTube going. About $10 a year works too." with the Ko-fi button.
- **Dropped:** the old marketing hero chips, and the tile grid. The "if filtering stops working" note moved to the top of Help (`after-help-*`).

## During a study session (`after-home-studying-*`)

The plan's window, 20:00 to 22:00, was running when these were taken, so the after captures show a session.

- The greeting adds the effective mode's line (`js/shared/effective_mode.js`): "Study · only your plan's channels and topics until 10:00 PM".
- The Home and Filters rows say Study instead of their usual status line.
- Study today shows Open study instead of Start now.

## About (`after-about-*`)

A short "Kriti and Uljhan" section, using the duo sieve's resting frame:

- Kriti is my sister, who looked out for me growing up. She stands for care and protection.
- Uljhan means tangle, or confusion, in Hindi. He isn't evil; he's the clutter Kriti helps clear away.
- The extension is open source and the apps are not. No servers keep your data, and there's no FilterTube sign-up.

## Support (`after-donate-*`)

The support sheet (`js/mascots.js` mountSupport, shown on the Support page) now ends with: "Even $1 a month on Ko-fi is a big help. A yearly option works too, about $10–12 a year." No Ko-fi account setting was changed.

## Kids (`after-kids-*`)

"YouTube Kids profiles" is now "Children's profiles on the Kids site". Its help line and status lines no longer name the site, and the domain youtubekids.com stays where a step needs it.

## Design critique (self-review), and what changed

- The small notes, "Kept on this device only" and "Kriti and Uljhan" under About, used the faint line colour (about 2.9:1). They now use muted ink, which passes AA.
- The Allow button is 40 px tall, up from 36 px.
- The Main/Kids switch was two full-width pills. It is now a compact segmented pair beside the profile.
- The quiet links at the bottom of the sidebar were squashed on top of each other in a short window, because the sidebar is a fixed-height column. Rows now keep their height (`flex-shrink: 0`), and the list scrolls instead.
- Left as is:
  - The Android and Android TV cards share the title "Available on Google Play"; the line above each title tells them apart.
  - Row statuses are cut to one line in the sidebar. The count carries the number, and the page carries the detail.
