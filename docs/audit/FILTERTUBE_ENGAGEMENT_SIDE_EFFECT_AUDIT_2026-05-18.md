# FilterTube Engagement Side-Effect Audit - 2026-05-18

Status: current-behavior audit. This is not an implementation patch.

This slice answers a specific product risk: whether FilterTube can make YouTube
observe extra activity while it is trying to hide or skip blocked content. The
review symptom was that blocking content seemed to make recommendations worse.
This file does not prove YouTube's recommendation model. It records the
FilterTube-owned surfaces that can produce observable side effects: synthetic
clicks, direct watch/shorts fetches, media pause/play/stop calls, scroll/import
automation, and persistent identity map writes.

## Current Side-Effect Map

```text
rule/settings decision
        |
        +--> JSON filtering
        |       + response mutation
        |       + harvest-only map writes
        |
        +--> DOM fallback
        |       + hide / restore
        |       + media pause
        |       + playlist next-link click
        |       + player next-button click
        |
        +--> content bridge identity enrichment
        |       + IntersectionObserver card prefetch queue
        |       + mostly no-network DOM / ytInitialData search
        |       + video-channel map persistence
        |       + watch metadata fetch from YouTube HTML when needed
        |
        +--> menu/block action recovery
                + background watch resolver
                + legacy direct watch/shorts fetch fallback
```

## Findings

| Area | Current behavior | Engagement/performance risk | Required proof before change |
| --- | --- | --- | --- |
| Card identity prefetch | `queuePrefetchForCard()` starts from `IntersectionObserver`, de-dupes for 30 seconds, caps the queue at 10, and runs with concurrency 2. | CPU/storage work can still happen for visible cards, but current `prefetchIdentityForCard()` uses DOM, saved maps, and main-world `ytInitialData` search rather than direct network fetch. | Preserve the no-network prefetch property while adding active-state and route budgets. |
| Whitelist pending hide | Whitelist pending cards call `queuePrefetchForCard()` before hiding unresolved cards. | Empty/incomplete whitelist can do identity work before a card is allowed or denied. | Add whitelist pending budget counters and route fixtures. |
| Watch metadata fetch | `fetchVideoMetaFromWatchUrl()` fetches `https://www.youtube.com/watch?v=...` HTML for metadata extraction. | This can be YouTube-visible request activity, even if it is not a user click. | Gate on validated active content-filter need and avoid duplicate fetches. |
| Shorts/watch identity fallback | `fetchChannelFromShortsUrlDirect()` and `fetchChannelFromWatchUrl()` fetch `/shorts/...` and `/watch?v=...` HTML in legacy fallback paths. | A failed block action can fall back to direct YouTube page fetches for identity. | Prefer background/API resolver paths; keep direct fetch fallback opt-in and measured. |
| Current watch owner block | `enforceCurrentWatchOwnerBlock()` can pause the video, hide the selected playlist row, click the next allowed playlist link, open a collapsed playlist panel, retry DOM fallback, click the player next button, or hide the watch shell. | A false owner match can change playback/navigation and can plausibly look like extra watch/next activity. | Exact owner-confidence fixture and selected-row policy before changing behavior. |
| Playlist guards | DOM fallback installs playlist next/prev and video-ended guards; when hidden playlist items are next, it pauses video and clicks alternate links/buttons. | Correct for skipping blocked playlist entries, but this is synthetic navigation. | Route-scoped lifecycle owner plus counters for synthetic navigation. |
| Subscription import | The main-world subscription importer intentionally clicks expansion buttons, scrolls, dispatches scroll, and posts YouTubei browse requests. | This is explicit user-triggered import work, but it must never run during normal filtering. | Keep it gated to subscription import requests only. |
| Hide helper media behavior | `toggleVisibility()` calls `handleMediaPlayback()`, and that path pauses media / movie player on hide. | A broad false hide can affect playback state. | Structured hide reason and media policy for every hide path. |

## Important Current Safety Boundary

The card prefetch path is not the same as direct watch-page fetching:

```text
IntersectionObserver
  -> queuePrefetchForCard(card)
  -> prefetchIdentityForCard({ videoId, card })
       -> saved videoChannelMap?
       -> DOM extraction?
       -> main-world ytInitialData search?
       -> persist mapping if identity found
       -> no direct fetch in this function
```

This is a useful property and should be preserved. The remaining YouTube-visible
fetches are currently in metadata/identity fallback paths, not the normal card
prefetch function itself.

## Future Rule

Every YouTube-observable side effect should report an owner and budget:

```text
sideEffect = {
  owner: "dom_fallback.current_watch" | "playlist_skip_guard" | "watch_meta_fetch" | "identity_fallback" | "subscription_import",
  trigger: "active rule" | "explicit user action" | "pending whitelist identity" | "content-filter metadata",
  route: "watch" | "playlist" | "shorts" | "search" | "import",
  observableType: "click" | "fetch" | "scroll" | "pause" | "map-write",
  userInitiated: true | false,
  dedupeKey: "...",
  maxPerNavigation: number,
  disabledWhenNoRules: true | false
}
```

Do not remove skip/navigation behavior until the product decision is explicit:
playlist skip can be the correct user experience. The audit issue is that the
runtime currently cannot prove, count, or centrally gate all of those side
effects.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this engagement side-effect authority can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
