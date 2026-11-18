# Allowed and study channels in search (2026-11-17)

In allowed-only mode, or during a study round, a search also asks the allowed (or plan) channels' own
search, as the app does (`StudySearch.kt`: `StudySearchPlanner`, `ChannelSearchScope`):

- `js/shared/channel_search.js`: who to ask (packs whose topics the query is about first, round-robin,
  6 channels; "Search all" asks up to 30), the merge (one from each channel in turn, 6 each), the answer
  parser and a 10-minute cache.
- `js/content/channel_search_shelf.js`: asks through `js/shared/paced_fetch.js` (3 at once, 250 ms apart),
  same-origin, without the person's cookies, and draws "Showing your study channels" (or "allowed
  channels") above the site's results. Every video still passes the page matcher (`shouldHideContent`).
- Captures: live site, headless Chromium, throwaway profile, never signed in.
  `before-*-page.jpg` is the build from `00d7f486` (the plan's channels never appear; most results are
  hidden), `after-*` this branch. `after-report.json` lists the requests and the shelf's first cards.

| Scenario | Query | Before | After |
| --- | --- | --- | --- |
| Allowed: Khan Academy, Scalar Learning | algebra | site results only | 2 channel searches; 18 lessons from both channels |
| Study: GATE Civil round | cement | 2 site results, then a spinner | 6 plan channels asked; NPTEL, GATE Wallah, MADE EASY, ACE, … lessons first; "Search all your study channels for “cement”" |
