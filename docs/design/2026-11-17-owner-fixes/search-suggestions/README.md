# Search suggestions under the active rules (2026-11-17)

The search box asks `/complete/search?ds=yt&client=youtube&...&q=<prefix>` with `fetch` and gets JSONP text,
`window.google.ac.h(["<q>", [[text, 0, [512, ...], {zaf, zai, zao, zav, zal, ...}], ...], {...}])`.
With an empty `q` it lists past searches (signed in), some with a picture.

`js/shared/search_suggestions_filter.js` (main world, loaded before `js/seed.js`; Firefox: seed brings it in
from the same folder) rewrites that text in seed's `fetch` hook:

- Blocklist: a suggestion matching a blocked word is removed (the compiled patterns titles use, whole word
  or not). A suggestion's picture is stripped when its channel is blocked (UC id, @handle, or a video whose
  channel is already known); an unknown channel keeps it.
- Allow list and Study: blocked words go first, then only suggestions naming an allowed word or topic, or an
  allowed channel, stay; a typed prefix of a topic stays ("sat ma"), and topics starting with what was typed
  are added. The empty-query history keeps matching entries only.
- Kids: the stricter of both: history keeps allowed entries only; a picture stays only for an allowed channel.

Captures: live site, headless Chromium, throwaway profile, never signed in. `before-*` is the build from
`00d7f486`, `after-*` this branch, same rules. `*-report.json` lists the options each dropdown showed.

| Scenario | Rule | Typed | Before | After |
| --- | --- | --- | --- | --- |
| blocklist | block "song" | `sad s` | 14 options, 11 with "song" | `sad shayari`, `sad status` |
| allowlist | allow "sat math", "algebra", Khan Academy | `sat m` | 14 unrelated options | `sat math`, `sat ma` |
| allowlist-prefix | same | `alg` | 14 incl. `algo trading`, songs | 6 "algebra" options |

## Second pass (filter-modes review, section 5)

- The text rule is now Android's `allowsSearchText` (`RuleLayerDecision.allowsText`): a block list keeps a
  suggestion that names an allowed word even when a blocked one matches; layered rules (Study) never do.
  Allow lists made only of channels show those channels' names and handles.
- Study rounds also accept the plan's topic synonyms (`study_engine.planSearchTerms`, compiled as
  `studySearchTerms`); a rest break, the limit or a hold shows no suggestions at all.
- Pictures need a known channel (`videoChannelMap`, never fetched per suggestion) and, for a video, its own
  `i.ytimg.com` thumbnail; Kids never shows one.
- Three layers: the fetch/XHR text in `seed.js` (it waits up to 1.5 s for settings, then fails closed),
  `window.google.ac.h` trapped before the site defines it, and `content/search_suggestions_dom.js`, which
  hides dropdown rows that fail the rule.

| Scenario | Rule | Typed | Before | After |
| --- | --- | --- | --- | --- |
| study-gate-civil | GATE Civil round | `cement` | site list | every "cement" suggestion: "cement" is a Building materials term (the search then shows plan lessons, see `../channel-search/`) |
