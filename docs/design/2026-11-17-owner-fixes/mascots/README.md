# Kriti and Uljhan across the extension (owner item 7)

The extension already had the app's frames, but most surfaces showed one Kriti still: peeking on every empty list, a plain sparkle on the popup counter, and stills on the support sheet. This pass maps moments to surfaces the way the app does (`MascotMoments`, `LoadingPersonality`, `UljhanLoadMore`, `SupportSheetVariants` and `StudyMascotView.Motion` on `feature/android-3.6.2-study`).

| Surface | Before | Now |
|---|---|---|
| Popup "hidden so far" card | Sparkle only; Kriti appeared only at 100/1,000/10,000 or with the allow list | Always has company (`popupTallyPose`). Nothing hidden yet: Kriti peeks low over the card. First look of the day: "Shoo, Uljhan!" plays once (Lively). Evening: her good-evening sheet. Morning: a wave. Otherwise the duo sieve's still. The allow list keeps the logo sieve, and milestones still play the sieve |
| Empty keyword list (options page and popup) | Kriti peeking | Kriti pointing (app: first keywords) |
| Empty channel list | Kriti peeking | Kriti reading (app: first channels) |
| Empty Kids lists | Kriti peeking | Kriti peeking (app: Kids empty page) |
| Search with no matches | Uljhan shrug | Unchanged (app) |
| Loading | General weighted set everywhere | The scene is read from where the wait sits: Kids (duo, shoo, jump, Uljhan's wave, Kriti's wave), Study (duo sieve, sieve, reading, notebook, pencil tap, opening the notebook), a search (Kriti's magnifier first), else general |
| Fetch-more (subscriptions import, any `[data-ft-fetch-more]`) | A general loading pick | Uljhan alone: he hops up from below the footer, then fetch (weight 4), wave, hop or wiggle, never the same twice in a row, with a bob between |
| Support sheet and page | Stills | The app's motions in Lively: the sieve loops three times, "one person" taps her pencil three times, evening says good night. Quiet and reduced motion keep the still |
| Sidebar footer | Kriti peek | Kriti peeking low over the edge |
| Toasts | Thumbs up with stamp (Lively), Uljhan shrug on errors | Unchanged; already as the app |
| Page cards (the new dashboard greeting) | none | `FilterTubeMascots.mountLoop(host, 'duoSieve'|'duoShoo', {height})` |

Every motion is a frame swap plus transform and opacity. Reduced motion shows the resting still. Companion Off shows no characters, Quiet shows poses without bubbles, and Lively adds the plays and idle life.

New art (byte for byte from the app's `drawable-nodpi`): `kriti_peek_low.webp` (13,748 B) and `kriti_magnifier.webp` (14,264 B). The mascot folder is now 1,599,372 bytes, still under the 1.6 MB budget, so the budget was not raised.

Files: `{before,after}-popup-zero-*`, `{before,after}-popup-hidden-*` (42 hidden, first look today; taken in the evening, so her good-evening sheet), `{before,after}-filters-empty-*`, `{before,after}-kids-empty-*`, `{before,after}-support-*`, and `after-moments-kids-*` (a Kids loading pick and the duo loop on a card).
