# FilterTube Members-only DOM Cleanup Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch, selector
patch, cleanup patch, restore patch, members-only behavior patch, DOM fallback
patch, JSON filter patch, or settings patch.

This slice pins the DOM-owned Members-only cleanup boundary in
`js/content/dom_fallback.js`. The JSON-first `hideMembersOnly` slice proves that
the setting is not a JSON row-filter decision today. This slice proves the
direct DOM cleanup behavior: CSS and direct scans hide broad card, shelf, watch,
badge, title, and `UUMO` targets, write `data-filtertube-members-only-hidden`,
and remove that marker only through the local `hideMembersOnly === false`
restore branch. Stale and disabled cleanup currently omit that specialized
marker.

## Boundary Source Files

members-only DOM cleanup boundary source files: 1

members-only DOM cleanup boundary source/effect blocks: 5

runtime members-only DOM cleanup fixtures: 6

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

## Pinned Source Counts

ensureContentControlStyles block lines: 345

ensureContentControlStyles block bytes: 12583

members-only CSS block lines: 41

members-only CSS block bytes: 2483

members-only direct cleanup block lines: 81

members-only direct cleanup block bytes: 5060

clearStaleDOMFallbackVisibility block lines: 33

clearStaleDOMFallbackVisibility block bytes: 1412

disabled cleanup branch lines: 21

disabled cleanup branch bytes: 959

members-only CSS `rules.push` callsites: 1

members-only CSS display-none declarations: 1

members-only CSS membership class tokens: 11

members-only CSS `Members only` text tokens: 9

members-only CSS `Member-only` text tokens: 9

members-only CSS watch-shell selectors: 1

members-only CSS `list=UUMO` tokens: 2

members-only direct querySelectorAll callsites: 5

members-only direct forEach callsites: 5

members-only direct inline display writes: 5

members-only direct generic marker writes: 5

members-only direct specialized marker writes: 5

members-only direct local display restore callsites: 1

members-only direct generic marker removal callsites: 1

members-only direct specialized marker removal callsites: 1

members-only direct title selector callsites: 1

members-only direct badge selector callsites: 1

members-only direct `UUMO` link selector callsites: 1

members-only direct shelf title selector callsites: 1

members-only direct local restore selector callsites: 1

members-only direct closest callsites: 5

members-only direct membership class predicate callsites: 1

members-only direct membership text predicate callsites: 2

members-only direct membership aria predicate callsites: 4

members-only direct shelf title membership predicate callsites: 2

clear-stale cleanup specialized marker references: 0

disabled cleanup specialized marker references: 0

product runtime specialized marker references: 7

product runtime specialized marker removal callsites: 1

## Current Boundary Matrix

| Boundary | Current behavior | Reliability / optimization boundary |
| --- | --- | --- |
| CSS selectors | `ensureContentControlStyles()` emits one Members-only CSS rule group with card, lockup, playlist, watch, shelf, aria-label, badge, and `UUMO` selectors. | CSS can hide broad targets before a direct DOM decision report exists. |
| Title aria scan | Direct cleanup scans `#video-title`, `#video-title-link`, and `.yt-lockup-metadata-view-model__title`, then hides the closest video/card host when aria text says Members-only. | Title aria evidence can hide a broad card host without JSON renderer ownership. |
| Badge scan | Direct cleanup scans membership badge classes and badge-like renderers, then hides the closest card/watch host and, when present, its containing shelf. | A badge inside a watch or shelf container can escalate from a local badge to a broad visual hide. |
| `UUMO` link scan | Direct cleanup scans `list=UUMO`, `Members-only videos` titles, and matching href text, then hides the closest shelf/list section. | Playlist membership evidence can hide a container, not just the matched link. |
| Shelf title scan | Direct cleanup scans shelf headings and hides the closest shelf when title text contains Members-only wording. | Text-only shelf evidence needs negative sibling-visible proof before selector cleanup. |
| Direct write | Every hide path writes inline `display:none!important`, `data-filtertube-hidden="true"`, and `data-filtertube-members-only-hidden="true"`. | The write bypasses the shared `toggleVisibility()` hide helper and stats/media policy. |
| Local toggle-off restore | When `hideMembersOnly` is false, the local branch scans `[data-filtertube-members-only-hidden]`, removes inline display, removes the generic marker, and removes the specialized marker. | Restore exists only in this feature-local branch, not as shared cleanup authority. |
| Stale cleanup | `clearStaleDOMFallbackVisibility()` scans generic hidden/pending selectors and blanks the shared style node, but has no specialized Members-only marker reference. | A stale marker can remain after generic stale cleanup, so marker hygiene is not globally owned. |
| Disabled cleanup | The disabled branch scans generic hidden/pending selectors and blanks the shared style node, but has no specialized Members-only marker reference. | Disabled mode does not prove specialized marker cleanup for Members-only hides. |
| JSON-first status | Members-only cleanup remains DOM-owned today; JSON candidate extraction has no first-class `isMembersOnly` decision field. | First-class JSON promotion still needs JSON/DOM parity and broad-target policy proof. |

## Runtime Proof

The runtime guard proves:

1. The source blocks and primitive counts above match current
   `js/content/dom_fallback.js`.
2. The Members-only CSS branch still contains broad card, shelf, watch-shell,
   badge, aria-label, and `UUMO` selector evidence.
3. Fake DOM execution hides title-aria, membership-badge, `UUMO` link, and
   shelf-title candidates, while leaving a non-membership badge host untouched.
4. Badge cleanup hides both the immediate host and a parent shelf when both are
   present.
5. The local `hideMembersOnly === false` branch removes inline display,
   `data-filtertube-hidden`, and `data-filtertube-members-only-hidden` from
   previously hidden elements.
6. Stale cleanup and disabled cleanup currently omit the specialized
   `data-filtertube-members-only-hidden` marker.

## Non-Completion Boundary

Members-only DOM cleanup still needs a DOM cleanup contract, selector policy,
target-shape report, route/surface policy, sibling-visible fixture, broad-hide
decision report, shared restore owner, stale cleanup budget, disabled-state
restore proof, metric artifact, CSS/direct-writer parity report, JSON/DOM parity
gate, and explicit DOM-only policy before selector cleanup, restore cleanup,
no-work optimization, or first-class JSON promotion can proceed.

No `membersOnlyDomCleanupBoundaryContract`,
`membersOnlyDomCleanupDecisionReport`, `membersOnlyDomCleanupRestoreProof`,
`membersOnlyDomCleanupSelectorPolicy`, `membersOnlyDomCleanupTargetShapeReport`,
`membersOnlyDomCleanupRoutePolicy`, `membersOnlyDomCleanupSiblingFixture`,
`membersOnlyDomCleanupStaleCleanupBudget`,
`membersOnlyDomCleanupMetricArtifact`, or `membersOnlyDomCleanupJsonParityGate`
exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM cleanup/selector surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, DOM cleanup behavior, selector lifecycle
behavior, visibility side effects, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
