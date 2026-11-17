# Owner fixes and design pass (2026-11-17)

Branch `feature/ext-owner-fixes` from master `00d7f486`. The look follows the earlier passes: paper and
crayon, warm white (slightly less yellow now), ink, brick, sage, Delius and Outfit. Captures come from
headless Chromium with a throwaway profile, never signed in; in-page captures are from the live site,
read-only. `before-*` is master, `after-*` this branch, light and dark unless a folder says otherwise.

| Folder | Owner item | What it shows |
| --- | --- | --- |
| `popup/` | 1, 2, 3 | Enabled/Disabled switch on (sage) and off (brick); the third tab scrolls to its end; hover and keyboard focus |
| `polish/` | 3, 5, 6 | Hover, focus and press states ("Receive nearby", "Find nearby"); warmer white paper; the Kids Filters card removed |
| `content-controls/` | (follow-up) | Each Content Controls group has its own tint again, popup and dashboard |
| `avatar-ring/` | 4 | Android's crayon ring on every profile avatar |
| `mascots/` | 7 | Kriti and Uljhan moments: popup tally, empty lists, loading, support |
| `dashboard/` | redesign, 8, 9, 10 | Home (greeting, stats, Study today, What Uljhan tried today, quick actions, apps, support strip), the tinted sidebar, About (Why FilterTube exists; Kriti and Uljhan), Support, Help, Kids |
| `study-slider/` | 11 | Study length slider on the Study home; plan-bar handles that drag like the app's |
| `feed/` | 12 | The allow-list / study feed, the empty-feed guard in both modes, the page updating when study ends |
| `study-rules/` | review P0 | The Study pill (effective mode) and the loosening sheet |
| `search-suggestions/`, `channel-search/` | review P0/P1 | Suggestions under the rules in every mode; allowed and study searches ask their own channels |

Folder notes without their own README:

- `popup/`: `*-popup-enabled-*` and `*-popup-disabled-*` (the brand card's switch), `*-popup-tab3-top/end-*`
  (the list scrolls past "Hide All Comments"), `*-popup-hover-play-*` and `*-popup-focus-*`.
- `polish/`: `*-sync-{receive,find}-nearby-{rest,hover,focus}-*` are close-ups of the Accounts & Sync buttons;
  `*-kids-*` shows the Kids page without the "Kids Filters" card; `*-filters-*` and `*-sync-*` show the paper.
- `content-controls/`: `*-dashboard-content-controls-{1..4}-*` and `*-popup-content-controls-{1..3}-*`.
- `study-slider/`: `after-length-card-*` (rest, dragging, keyboard), `after-plan-*` (the day bar's START /
  END / LIMIT handles), `android-plan-page-reference.jpg` from the earlier parity capture.
