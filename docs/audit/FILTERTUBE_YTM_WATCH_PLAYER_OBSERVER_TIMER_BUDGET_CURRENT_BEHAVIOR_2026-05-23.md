# FilterTube YTM Watch Player Observer Timer Budget - Current Behavior

Status: current-behavior fixture slice with 2026-05-25 SPA drag optimization addendum.

This is not an implementation patch, observer patch, quick-block patch,
whitelist patch, or JSON-first patch. It pins the current observer, listener,
and timer owners that can touch the YouTube Music watch/player DOM so later
optimization work has a concrete no-work and lifecycle budget to prove against.

## Evidence

| Evidence | Current pinned value |
| --- | --- |
| Raw capture | `YTM-WATCH PLAYER.html` |
| Raw SHA-256 | `d0600cc4b7bb5684b532f825d689d32a5c7b24b37c6da6477d0f4dc637303ea3` |
| Reduced fixture | `tests/runtime/fixtures/captures/ytm-watch-player-dom.html` |
| Raw `data-filtertube-observing=true` tokens | 6 |
| Raw quick-block button tokens | 70 |
| Raw YTM playlist panel rows | 25 |
| Raw YTM related video rows | 30 |
| Reduced fixture quick-block buttons | 3 |
| Reduced fixture observer markers | 0 |

## Source Blocks

| Owner | File | Lines | Bytes | Current role |
| --- | --- | ---: | ---: | --- |
| DOM playlist navigation guard | `js/content/dom_fallback.js` | 108 | 4954 | Installs capture-phase `click` and `ended` listeners once; can pause media and synthesize playlist navigation outside whitelist mode. |
| Whitelist pending queue | `js/content_bridge.js` | 181 | 9704 | Owns one whitelist recheck timer, one pending-hide timer, a 160-candidate queue, and route exclusions that skip watch routes. |
| Fallback mutation observer | `js/content_bridge.js` | 143 | 5592 | Owns a body/document mutation observer, `DOMContentLoaded` fallback, immediate DOM fallback scheduling, prefetch scan startup, runtime observer refresh, and no-active-fallback disconnect/restart gates. |
| YTM fallback menu scan | `js/content_bridge.js` | 282 | 9841 | Scans YTM playlist, related, compact, Shorts, radio, and comment rows; owns mutation, click, scroll, warmup interval, RAF, and timer-driven rescans with added-subtree, hover capability, viewport, and target-card scoped repair. |
| Quick-block card selectors | `js/content/block_channel.js` | 117 | 3885 | Admits 30 `ytm-` selector tokens, including YTM playlist panel rows and related video rows, plus active-work gates before quick-block enablement. |
| Quick-block observer setup | `js/content/block_channel.js` | 323 | 13896 | Installs page-level focus/input/click/scroll/resize/orientation/pointer listeners when active, gates desktop body observation, repairs stale menu state only during explicit menu-open scans, and uses route/mutation-scoped sweep scheduling. The previous 1800 ms periodic sweep interval is gone. |

## Current Boundary

The YTM watch/player DOM is not a quiet surface today. A single rendered capture
already carries 70 quick-block buttons and 6 observer markers, while runtime
source has several page-lifetime owners that can revisit the same rows.

Whitelist mode reduces some actions but does not remove all lifecycle work:

- DOM playlist click and autoplay guards remain installed, but return in
  whitelist mode before skip navigation.
- Content-bridge whitelist-pending hide explicitly skips watch routes, while the
  fallback mutation observer and immediate fallback scheduler remain page-level.
- Quick-block action eligibility requires `showQuickBlockButton === true` and
  `listMode !== 'whitelist'`, but quick-block observer setup still installs
  styles, page listeners, a mutation observer, and a route-navigation sweep
  owner. The previous periodic sweep owner is no longer present.
- The reduced fixture intentionally keeps only three quick-block buttons and no
  observer marker attrs, so it proves row shape and current markers but is not a
  complete lifecycle budget fixture.

## Optimization Risk

Optimizing the recent whitelist work before this surface has first-class
observer/timer authority can hide real costs. JSON may avoid DOM mutation for a
row, but the content bridge, quick-block owner, fallback menu owner, and DOM
playlist guard can still rescan, requeue, or synthesize side effects around the
same YTM watch/player surface.

## Still Missing

Before changing observer, whitelist, or JSON-first behavior here, the
implementation needs:

- `ytmWatchPlayerObserverTimerBudget`
- `ytmWatchPlayerLifecycleOwnerReport`
- `ytmWatchPlayerMutationObserverBudget`
- `ytmWatchPlayerQuickBlockObserverBudget`
- `ytmWatchPlayerPlaylistGuardListenerReport`
- `ytmWatchPlayerWhitelistNoWorkObserverReport`
- `ytmWatchPlayerRerunTimerBudget`
- `ytmWatchPlayerObserverMetricArtifact`

Until those exist, this slice keeps the implementation gate closed for YTM
watch/player observer/timer optimization.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this YouTube Music/YTM surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, YTM behavior, Music surface behavior,
whitelist behavior, metric collectors, artifact creation, native sync, release
package changes, or public claims.
