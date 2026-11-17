# Allow-list feed, empty-feed guard and live rule changes (owner item 12)

The owner's report: with "US bar exam (UBE / NextGen)" and "SAT" selected, Home kept loading forever.
Their console showed the allow list compiled correctly (20 allowed channels, 38 allowed words), and
every card on Home and in each continuation was hidden (28 of 28, then 32, 32, 24). The extension only
filtered the site's generic Home, which never contains the pack channels, so the page kept asking for
more and the loader never ended.

Android builds Home from the plan instead (`StudyHomeFeed`, `StudyFeedMix`,
`NativeMainStudyHomeProvider`). This pass does the same for every allow-list profile, with Study as one
source of it:

- `js/shared/feed_guard.js` (main world, before `seed.js`): a feed page or continuation that had cards
  and lost all of them counts as empty; after 3 in a row on one route (Android
  `NativeMainContinuationAutoLoadGuard.MAX_EMPTY_AUTO_LOADS`) its continuation is removed and the page
  stops asking. Both modes. It also says whether new rules are tighter or looser.
- `js/shared/allowlist_feed.js` + `js/content/allowlist_feed_view.js` (isolated world): the allowed
  channels' latest uploads (same-origin `videos.xml`), plus searches for the allowed words when the
  channels give little; at most 3 requests at once, paced, cached locally for 60 minutes; ranked like
  `StudyHomeFeed.rank` and spaced like `StudyFeedMix.spaced`. Every item goes through the page's own
  matcher (`shouldHideContent`), so blocked words in a layered allow list still hide. Nothing to show
  gives Kriti with Search and Open study plan / Review allowed channels; unreachable gives Uljhan with
  Try again. Never an endless loader.
- Block list: when the guard stops a page, Kriti says "Most of this page matched your filters" with
  Open subscriptions, Search and Review filters. No feed is built in block-list mode.
- Live rule changes: when rules loosen (a study session ends, a rule is removed, the list goes back to
  the block list) a feed page whose cards were removed at the data level loads again by itself; the
  built panel swaps out at once. Tighter rules hide at once without a reload. Watch pages are never
  reloaded (the video keeps playing).

Captures: headless Chromium 1208, a throwaway profile, never signed in, the live site read-only
(`~/FilterTubeWorktrees/ext-owner-fixes-tools/feed-e2e.mjs`). Signed out, the site's own Home is
"Try searching to get started" with no cards at all, so the owner's endless loader (a signed-in Home)
can't be shown here; the unit tests replay it with the owner's numbers.

| Case | Before | After |
| --- | --- | --- |
| Study round, UBE + SAT, Home | `before-study-home-ube-sat.jpg` | `after-study-home-ube-sat.jpg`: "Study feed · US bar exam (UBE / NextGen) + 1", 48 lessons from Kaplan Bar Review, Themis, College Board, ... |
| The session ends with the tab open | `before-study-ended-same-tab.jpg` | `after-study-ended-same-tab.jpg`: the panel leaves and the page reloads its data by itself |
| Allow list (Khan Academy, Scalar Learning, "algebra"), Home | `before-allowlist-home.jpg` | `after-allowlist-home.jpg` |
| Block list that hides everything, a search | `before-blocklist-everything-search.jpg` | `after-blocklist-everything-search.jpg`: stops after 3 hidden loads, calm state |

Tests: `tests/runtime/allowlist-feed.test.mjs` (guard in both modes through `seed.js`, the owner's
28/32/32 sequence, parsing, ranking, spacing, 3-at-once limiter, 60-minute cache, unreachable,
rule-change classes, the study-end reload and no reload on a watch page, manifest worlds).

Not done: Kids site (its pages are a different app; the guard runs there, the built feed does not),
a study Shorts reel (Android has one), and Up next top-up on the watch page.
