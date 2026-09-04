# Current-video admission race fix proof

Date: 2026-09-03

Status: source and focused automated proof complete; installed-browser proof open

## Reported failure

Allowed videos could remain paused behind a blocked-looking banner for roughly one or two minutes. A short blocked flash could also occur after Global Disabled. Delayed or unavailable metadata could be mislabeled as a channel rejection even though no channel rule had been verified.

## Root cause

The Player and streamed `get_watch` responses already exposed the current video's route-bound identity, title, description, duration, dates, category, and language inputs. Admission nevertheless consumed that data through the general card-metadata cache and rerun machinery:

1. identity/text and content-rule fields were requested in separate admission phases;
2. the general metadata scheduler imposed a 60-second same-video cooldown;
3. an already-running narrow card request did not absorb stronger current-player requirements;
4. current Player metadata waited for the card/UI DOM debounce before admission reran;
5. unresolved identity could be converted into a blocked/Allow-only result; and
6. an enabled DOM pass captured before Global Disabled could resume and enforce its stale settings.

Two staged misses could therefore resemble a two-minute block. The banner was not evidence of a real rule match.

## What the earlier alignment missed

| Boundary | Previously missed behavior | Aligned behavior in this checkpoint |
| --- | --- | --- |
| Cold direct entry | Non-Home startup waited one second for general DOM hydration before establishing current-video admission. | Admission and the playback guard start as soon as compiled settings arrive, before the hydration wait. |
| Current-player metadata | The current video shared the browse-card queue, rate window, in-flight owner, and 60-second same-ID cooldown. Separate metadata phases could therefore produce two long stalls. | One dedicated current-video request gathers every metadata family required by active admission rules and retries on a bounded 1.5-second gate. |
| Metadata arrival | Exact Player or streamed `get_watch` metadata waited for the card/UI debounce before admission reran. | A route-matching Player record reruns current-video admission immediately; card reruns remain separate. |
| Unknown metadata | Unresolved identity could become a blocked-channel or Allow-only banner even though no rejecting rule had been verified. | Unknown remains `pending`; after the status threshold it says `Unable to verify required metadata` and remains paused. |
| Rule ownership | A generic DOM `shouldHideContent()` result could be promoted into a current-player block, and a verified allow match could skip independent content rules. | Only typed admission decisions create blocked banners, and every independent active video-content rule must pass. |
| Browser Back / SPA | The preceding route's receipt and banner could survive while YouTube recycled its player. A play event could bind the URL being left as if it were the destination. | Navigation start/`popstate` invalidates the old receipt and presentation synchronously. A transition latch pauses the recycled player without reading route identity until `yt-navigate-finish`. |
| Global Disabled | An older enabled DOM pass or retained play-guard settings could restore filtering after Disabled cleanup. | Disabled cleanup executes at every admission side-effect boundary, and yielded stale passes abort when they resume. |
| Presentation toggles | The current-player path did not enforce a sufficiently explicit separation between admission rules and layout-only controls. | Presentation-only controls are absent from admission requirements and cannot produce a player-block banner. |

These were independent ownership and timing gaps, not a lack of metadata in YouTube's Player response. The fix makes route-bound Player metadata authoritative without letting an unavailable field fabricate a rejection.

## Implemented boundary

- Current-video admission requests all metadata families required by active playback rules together.
- A Player or streamed `get_watch` update whose video ID equals the current route reruns player admission immediately. The card/UI debounce remains card-only.
- Current-player metadata has a dedicated bounded request owner and does not share the card scheduler's queue, rate budget, in-flight ownership, or one-minute same-ID cooldown.
- Cold direct Watch entry installs admission immediately after compiled settings arrive, before the general one-second DOM hydration delay.
- Navigation start and browser `popstate` synchronously invalidate the prior video's blocked receipt and keep the recycled player paused; destination admission runs at `yt-navigate-finish`.
- Missing metadata remains `pending`; after six seconds the neutral text is `Unable to verify required metadata` and playback stays paused.
- Only the typed admission decision can create a blocked banner. The generic DOM `shouldHideContent()` fallback is not a current-player verdict.
- A verified allow-list match still has to pass every independent active duration, upload-date, uppercase-title, category, and language rule.
- Disabled cleanup occurs before DOM-run coalescing. The play guard consults current settings, current-video enforcement replaces a stale settings argument with current settings, and yielded old passes abort when they resume.
- Presentation-only controls remain outside `getDirectAccessRuleRequirements()` and cannot own a player banner.

The BlockTube checkout at `/Users/devanshvarshney/Downloads/blocktube-master` was used only as an architectural comparison: its Player-response interception shows why playback admission belongs beside authoritative Player data. No GPL source was copied into the MIT FilterTube codebase.

## Automated proof

- `node --check js/content/dom_fallback.js`: passed.
- `node --check js/content_bridge.js`: passed.
- `node --test tests/runtime/direct-access-admission-current-behavior.test.mjs`: 25/25 passed.
- Combined current-admission, player-language, and 15k large-rule runtime checks: 40/40 passed.
- `npm run build:chrome` and `npm run build:firefox`: passed.
- `git diff --check`: passed.

The focused suite pins exact rule reasons, neutral unavailable behavior, no unknown-to-block conversion, all-rule evaluation after allow-list matches, immediate current-Player reruns, dedicated admission metadata ownership, cold-entry ordering, synchronous Back/SPA receipt invalidation, route isolation, Disabled cleanup ordering, and playlist successor safety.

`npm run test:changed` remains red because the required release lane currently contains 50 unrelated historical source-fingerprint/audit-snapshot failures. The failures include stale background injection, bridge-injection inventory, startup-injection, and test-lane coverage records; they do not identify a failure in this admission change. No unrelated audit snapshots were rewritten here.

## Installed-browser gate

Source proof does not establish timing in a loaded browser extension. Before release closure, reload the built extension and verify direct URL, new tab, Google/referrer entry, bookmark/pasted entry, playlist/autoplay, and YouTube SPA transitions for:

- one clearly allowed video;
- every active admission-rule family;
- deliberately delayed and unavailable metadata; and
- toggling Global Disabled while checking and while blocked.

The expected state machine is only `Checking -> Allowed`, `Checking -> Blocked by exact rule`, or `Checking -> Unable to verify required metadata`. Unknown metadata must never claim a blocked channel.

## Explicit scope boundary for the next checkpoint

This checkpoint covers top-level YouTube/YouTube Kids routes and explicit YouTube embed frames declared in the extension manifests. It does not claim enforcement for a Google Search-owned inline player whose top-level document remains on `google.com`. That external-media bypass requires separate host permission, document-start guarding, and—in locked/Kids mode—a network-level fail-closed policy. It must be implemented and validated separately so external-site enforcement does not get confused with the now-aligned YouTube current-video state machine.
