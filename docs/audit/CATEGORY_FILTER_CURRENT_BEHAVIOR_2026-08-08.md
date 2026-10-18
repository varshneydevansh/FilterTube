# Category Filter Current Behavior

Date: 2026-08-08

Status: implemented and covered by focused extension tests

## User contract

Category Filters use the official YouTube category associated with an individual video. The control is available in both the full Content Controls page and the extension popup.

The stored setting is:

```javascript
categoryFilters: {
    enabled: true,
    mode: 'block', // 'block' or 'allow'
    selected: ['Music', 'Education']
}
```

`Block selected` hides resolved videos in the selected categories. `Allow only selected` shows only resolved videos in the selected categories. This mode is independent of the profile-level Blocklist/Whitelist mode.

The shared category catalog contains Film & Animation, Autos & Vehicles, Music, Pets & Animals, Sports, Travel & Events, Gaming, People & Blogs, Comedy, Entertainment, News & Politics, Howto & Style, Education, Science & Technology, and Nonprofits & Activism.

## UI behavior

- The full Category Filters card is placed directly after Core and before Feeds.
- The popup contains the same enabled state, mode, search, selected categories, clear action, and category chips.
- The selection summary says `Allowed:` or `Blocked:` and lists the selected categories.
- Selected chips expose visible checked styling and `aria-pressed="true"`.
- An empty category selection is described as inactive.
- The popup can open the full Category Filters card directly.

## Metadata authority

The authoritative field is:

```text
microformat.playerMicroformatRenderer.category
```

FilterTube can harvest it from initial Player data, captured Player responses, and MWEB streamed `get_watch` items containing `playerResponse`. The value is stored per video in `videoMetaMap`.

Browse, Search, Home, and Watch-next card JSON often provides a video ID but omits category. For an uncached visible video, the MAIN-world bridge sends a same-origin `POST /youtubei/v1/player` request with the active YouTube client context and returns only normalized metadata:

- video ID;
- duration;
- publish and upload dates;
- category;
- channel ID, name, and handle.

The bridge does not return streaming URLs or the complete Player response. The category path no longer fetches redirected `/watch` HTML, which avoids the CORS-heavy request pattern seen during earlier experiments.

## Request and performance policy

Category hydration is viewport-driven rather than response-wide. JSON filtering never fans out one Player request for every renderer in a Browse/Search payload.

The scheduler provides:

- per-video pending and queued deduplication;
- merged metadata needs, so category/date/duration callers share one request;
- cache satisfaction checks both before enqueue and immediately before dispatch;
- high priority for visible category work;
- offscreen and playlist-queue rejection;
- scroll-idle delay;
- at most three simultaneous Player requests;
- a 100 ms join window for one visible micro-batch;
- 1.2 second early-batch cadence and 3.5 second sustained cadence;
- a hard limit of 24 starts in a rolling 60-second window;
- a 15-minute negative cache when a successful Player response contains no category;
- one debounced DOM reconciliation for a group of completed metadata results.

Each paced drain fills up to three available slots. A card that is still queued or running remains pending and cannot time out into an unavailable state before its scheduled request executes.

## Visibility and enforcement

In `Allow only selected`, a newly added uncached card is veiled synchronously in the mutation observer before the normal debounced DOM pass. This prevents a disallowed card from appearing first and disappearing after metadata arrives.

On Watch pages, a root shell gate is installed before the initial one-second fallback delay. Watch recommendations move through explicit `pending`, `allowed`, `blocked`, or `unavailable` states. Resolved blocked and genuinely unavailable cards collapse without leaving repeated “Filtered by category” or “Category unavailable” sentinel cards.

For the current Watch video:

- FilterTube pauses while category is unresolved in allow-only mode;
- an allowed result releases the guard;
- a blocked result remains paused behind a stable explanation;
- no category decision clicks YouTube controls, mutates a queue, or redirects playback.

## Ownership boundaries

- Modern nested lockup hosts and metadata nodes resolve to one outer visual card owner.
- Comments, comment sheets, channels, community posts, navigation chips, and shelf containers are not category targets.
- The global Home chip rail and an inner “Explore more topics” chip rail are navigation/refinement controls, not official categories.
- A Mix/radio discovery card can use its seed video's video ID and category.
- The seed video's category is not assigned to the Mix or playlist queue; each queue row remains owned by YouTube playback state.
- Player metadata learned for a Mix seed also warms its channel identity, improving FilterTube's three-dot channel action without another request.

## Metadata and settings preservation

Category updates merge with existing duration and publish/upload dates. A later partial metadata response cannot erase an already known category.

V4 profile settings remain authoritative for `Hide All Comments`. Saving category settings cannot resurrect a stale legacy root `hideAllComments` value. Comment surfaces also clear stale category markers and explicitly reject category ownership.

## Documentation inventory added with this work

`docs/json_paths_encyclopedia.md` now records the available YouTube Kids onboarding, account/persona, browse, Search, Player/next, subscription, settings, and parent-gate captures, including which source files concatenate annotations, responses, and DOM fragments rather than forming one valid JSON document.

`docs/youtube_renderer_inventory.md` records the matching Kids DOM/renderers plus the desktop global Home chip bar and the separate horizontally scrollable “Explore more topics” chip/video shelf.

## Verification

Focused category and metadata tests cover:

- block-selected and allow-only intent;
- popup and full-page selection state;
- official Player metadata extraction;
- metadata merge/preservation;
- immediate pending veil and early Watch shell gate;
- current Watch and Watch-rail enforcement;
- comments and camelCase comment hosts;
- Mix seed and playlist-queue boundaries;
- three-request bounded batches, next-batch draining, rate limits, deduplication, negative caching, and cache revalidation.

The Chrome extension package builds successfully. Installed/live YouTube behavior still requires reloading the unpacked extension and refreshing the YouTube tab after source changes.
