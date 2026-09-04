# Current-video admission behavior

Date: 2026-09-02

Status: source implementation updated on 2026-09-03; focused tests pass; installed-browser acceptance remains open

## Product contract

FilterTube applies the same current-video admission policy whenever a YouTube player reaches a Watch, Shorts, or supported embed route. The route may have come from:

- a pasted URL, bookmark, notification, Google result, or another external site;
- a link opened in a new tab;
- a normal YouTube click or other single-page-app navigation; or
- a playlist or autoplay transition.

The referrer is not a policy input. Once a route has a current video ID, that video may play only after the active video-admission rules can verify an allowed result. A direct entry is therefore not a special weaker or stronger policy; it is the case most likely to begin without already-cached Player metadata.

This gate does not remove or rewrite links on Google, Bing, or other external sites. It starts inside the matching YouTube page or YouTube embed frame.

## Rules owned by current-video admission

The player gate evaluates rules whose result determines whether the current video itself may play:

| Rule family | Metadata required when the route video ID is not sufficient | Verified blocked message |
| --- | --- | --- |
| Explicit video block/allow | Route video ID only | `Blocked video` |
| Channel block/allow | Exact current-video channel identity | `Blocked channel` |
| Keyword block/allow, including date gates | Exact Player title, description, keywords, and dates when gated | `Blocked keyword` |
| Main `Allow only selected` policy | Exact video/channel/text evidence needed by the configured allow rules | `Not in Allow only selected` |
| Duration | Player duration | `Blocked by Duration Filter` |
| Upload date | Player publish/upload date | `Blocked by Upload Date Filter` |
| Uppercase title | Verified Player title | `Blocked by Uppercase Title Filter` |
| Category | Player category | `Blocked by Category Filter` |
| Language | Player language code | `Blocked by Language Filter` |

An overlay saying that a video is blocked is a decision receipt. It is shown only after a specific rejection is verified. Missing or delayed metadata must never be presented as a blocked channel, keyword, language, category, or other positive match.

## Rules that do not own playback admission

Presentation controls alter YouTube layout but do not decide whether the current video may play. They must not pause the player or create a blocked-video banner. Examples include hiding comments, the recommendation rail, the description, video buttons, the channel row, playlists, navigation/header elements, end-screen elements, Shorts shelves, playables, live chat, or adverts.

These controls continue to run in their existing route/CSS/DOM owners. They are intentionally absent from `getDirectAccessRuleRequirements()`.

## Admission state machine

| State | Player | UI | Exit condition |
| --- | --- | --- | --- |
| Disabled | Released | Admission overlays and markers removed | Filtering is enabled again |
| No active admission rules | Released immediately | No admission UI | An admission rule becomes active |
| Verified allowed | Allowed immediately, or resumed if FilterTube had paused an attempted play | No admission UI | Route or policy changes |
| Unresolved | Paused; capturing `play` events prevents a cold-entry, browser-history, or SPA race from starting playback | No UI for the first 180 ms, then neutral `Checking...` status | Exact metadata produces an allowed or blocked decision, Disabled is selected, or the route changes |
| Metadata unavailable after 6 seconds | Still paused | Neutral `Unable to verify required metadata` status; never a blocked-rule claim | Metadata arrives, Disabled is selected, or the route changes |
| Verified blocked | Paused | Reason-specific blocked message | Route or policy changes, or Disabled is selected |

The six-second value is a status threshold, not an authorization timeout. There is no timeout-to-allow or `failOpenVideoId` path for the current player. FilterTube continues bounded rechecks because allowing an unresolved video would recreate the direct-link loophole.

## Evidence and precedence

Admission is bound to the route video ID. Identity and text are accepted from `videoMetaMap[routeVideoId]` only when the Player extraction marked them `identityVerified` and `textVerified` for that same response video ID. A persisted `videoId -> channelId` mapping or visible DOM left from the previous SPA item cannot, by itself, authorize or reject the new item.

The existing rule precedence is preserved:

1. explicit video;
2. channel;
3. keyword;
4. equal-specificity allow wins a block.

A verified specific allow decision wins an equal-or-less-specific block/allow-list conflict, but it does not bypass independent duration, upload-date, uppercase-title, category, or language rules. Every active video-admission rule must pass before playback is released.

All metadata required by the active rules is requested together for the current video. A duration-only policy does not wait for category or language, and a text-only policy does not request unrelated fields. Loaded Player responses are reused before a player metadata request is made. Current-video metadata uses a dedicated bounded request owner and is not held behind the card scheduler's queue, rate budget, or one-minute same-ID cooldown.

Desktop flat Player responses and MWEB/experiment `get_watch` streamed arrays are both accepted. For a streamed response, admission examines only its bounded top-level items and their `playerResponse` wrapper, then still requires the extracted video ID to equal the current route video ID. It does not recursively treat Watch-next recommendations as current-video authority.

## SPA and direct-entry performance

Normal YouTube SPA playback should not acquire a visible checking step when route-bound Player metadata already proves the result. The verified path releases an allowed item immediately. A newly intercepted Player or streamed `get_watch` record for the current route reruns admission immediately; it does not wait for the card/UI metadata debounce.

When metadata is not ready, FilterTube must prefer correctness over speculative playback:

- playback is paused immediately;
- the neutral overlay is delayed 180 ms so short metadata races do not flicker;
- pending retries rerun only current-player admission and never force a full Watch/card scan or rewrite an unchanged overlay;
- an attempted `play` during the pending state is remembered; and
- if the final result is allowed, FilterTube resumes only when it had interrupted active or attempted playback.

This makes initial direct entry and a cache-miss SPA transition use the same policy without imposing the slow path on already-verifiable SPA transitions.

The document-level play guard also compares the route video ID with the last admitted video. If YouTube restores a buffered player during browser Back/Forward before its normal SPA mutation pass completes, a different route video is returned to `pending` and paused before the preceding route's allow decision can be reused.

Navigation start and `popstate` synchronously invalidate the preceding video's decision receipt: the old blocked overlay and markers are cleared, the recycled player remains paused, and its old video ID cannot authorize or reject the destination. `yt-navigate-finish` then evaluates the destination route. Cold direct Watch entry establishes the same guard immediately after compiled settings arrive, before the general one-second DOM hydration wait.

## Global Disabled boundary

Global Disabled is checked before Watch/Shorts/channel direct-access enforcement. Selecting it:

- releases the admission guard and resumes playback when FilterTube had paused an active attempt;
- removes Watch and Shorts overlays;
- removes current-watch blocked/hidden markers and restores affected elements;
- clears retained retry state; and
- clears direct-channel redirect state.

An enabled DOM pass that was yielded before the setting changed is stale. It aborts when it resumes and cannot restore an old admission decision or re-hide content after Disabled cleanup.

No saved channel, video, keyword, Allow-only, content, category, or language rule may continue admission activity while FilterTube is globally Disabled.

## Playlist and autoplay boundary

A verified blocked current item may move only to a playlist row that is positively verified as allowed. FilterTube no longer clicks YouTube's generic Next control. If no verified allowed successor exists, the current item remains blocked. This successor selection is a separate queue operation; it does not weaken the current-video decision.

## Implementation map

- `getDirectAccessRuleRequirements()` computes the exact metadata families required by active admission rules.
- `getCurrentWatchAdmissionDecision()` evaluates explicit video, channel, keyword, and Allow-only rules with the existing specificity contract.
- `getCurrentWatchContentFilterDecision()` evaluates duration, upload date, uppercase, category, and language rules.
- `enforceCurrentWatchOwnerBlock()` owns the route-bound state machine for Watch, Shorts, and embeds.
- `showCurrentVideoAdmissionPendingState()` owns the exact neutral checking/unavailable messages while `showDirectAccessPendingState()` owns the delayed display.
- `releaseDisabledDirectAccessState()` owns the Global Disabled cleanup boundary.
- `tests/runtime/direct-access-admission-current-behavior.test.mjs` pins current rule scope, exact metadata binding, pending behavior, Disabled cleanup, banner reasons, embed scope, and playlist successor behavior.

## Source verification recorded on 2026-09-03

- `node --test tests/runtime/direct-access-admission-current-behavior.test.mjs`: 25/25 passed, including exact reasons, cold direct-entry ordering, synchronous Back/SPA receipt invalidation, recycled-player transition isolation, all-rule evaluation, immediate current-Player admission, dedicated current metadata fetching, and stale-Disabled-pass coverage.
- The combined current-admission, player-language, and 15k large-rule runtime checks passed 40/40.
- `node --check js/content/dom_fallback.js` and `node --check js/content_bridge.js`: passed.
- `npm run build:chrome` and `npm run build:firefox`: passed and produced the v3.3.7 packages.
- `git diff --check`: passed for the implementation, tests, and documentation changes.

`npm run test:changed` reached the required release lane but remains red on unrelated, pre-existing source-fingerprint and audit-snapshot drift (50 failures in that lane). Those historical snapshots were not rewritten as part of this current-player fix.

These are source/build checks, not installed-browser proof.

## Acceptance checklist before release closure

- [ ] Reload the built unpacked Chrome extension; a pre-existing tab does not acquire source changes automatically.
- [ ] Verify a direct blocked-channel Watch URL cannot begin playback, using both a saved handle/name rule and the resolved UC channel ID.
- [ ] Verify explicit video, keyword, Allow-only, duration, upload-date, uppercase, category, and language rejections show the correct reason.
- [ ] Verify an allowed Watch item and an allowed SPA neighbor start without a visible checking overlay when exact Player metadata is already loaded.
- [ ] Verify a cold direct URL and a Google/new-tab URL remain paused while metadata is deliberately delayed, then resume only after an allowed decision.
- [ ] Verify missing metadata remains neutral after six seconds and never claims a false channel/rule match.
- [ ] Toggle Global Disabled while admission is pending and while it is blocked; both must release immediately.
- [ ] Repeat the Watch/Shorts matrix in Chrome and Firefox, including the reporter's Windows 10 / Chrome environment when available.
- [ ] Verify the exact Shakira/ShakiraVEVO example and one clearly allowed neighboring video.

Source tests and package builds are necessary but do not close this checklist. Issue closure requires installed-browser behavior on the reported route/browser combination.
