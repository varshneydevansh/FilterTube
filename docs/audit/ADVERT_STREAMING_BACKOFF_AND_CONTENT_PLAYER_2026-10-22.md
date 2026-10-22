# Advert startup delay and independent content playback — 2026-10-22

Status: installed Chrome diagnosis and bounded fallback correction. Independent content playback is a proposed next architecture, not an implemented or validated extension backend. Nothing pushed, posted or submitted.

## What the installed replay established

The user initially reported normal popup width and prompt playback after reloading commit `3a441cc2`, then reported further startup delays. A new replay of Rabiosa (`8OO1pOqRJkA`) in the existing Chrome playlist recorded:

| Boundary | Observed value |
| --- | --- |
| Media loadstart → playing | 4,562 ms |
| First media request → next media request | 4,394 ms |
| First media response body | 104 decoded bytes; UMP parts 57, 67, 35 |
| Media payload in first response | No part 21 (MEDIA) |
| Part 35 numeric policy field 4 | 4,000 ms |
| Advert interruption during measured startup | None observed |

The [public protocol implementation](https://github.com/LuanRT/googlevideo/blob/main/protos/video_streaming/next_request_policy.proto) identifies part 35's field 4 as `backoff_time_ms`; its [part IDs](https://github.com/LuanRT/googlevideo/blob/main/protos/video_streaming/ump_part_id.proto) identify 35 as NEXT_REQUEST_POLICY and 21 as MEDIA. The trace is consistent with the web player honoring the server's four-second wait before receiving playable media. It does **not** establish why the server requested that wait, whether removal of advert metadata influenced it, or that all startup delays have this cause. The prior 27-second replay has no equivalent protocol-body capture and must not be retroactively attributed to this response.

[Redacted replay timings](artifacts/advert-streaming-backoff-2026-10-22/replay-summary.json) contain event timing, control part types and the numeric backoff only. Signed URLs, headers, cookies, request bodies and opaque streaming contexts are excluded. Temporary event listeners and Network observation were removed after collection; extension settings were not changed.

## What differs from a general ad blocker

The extension currently sanitizes exact advert owners and player scheduling fields in YouTube JSON, suppresses advert presentation and, when an advert still starts, uses official skip or a guarded seek. It can promote a separate requested-content video only when the existing player exposes one. These remain content-blocking techniques; naming the feature filtering or Advert Void supplies no technical immunity from site detection or upstream changes. The code does not establish a background impression/completion simulator.

Browser platform compatibility and a website's detection behavior are separate questions. Original uBlock Origin's Manifest V2 dependency and [uBO Lite's Manifest V3 implementation](https://github.com/uBlockOrigin/uBOL-home) should not be conflated into a claim that all ad blockers can no longer run.

Android normally selects `NATIVE_MEDIA3_SERVICE` in `NativeOwnedMainPlaybackBackendPolicy.kt`. `NativeOwnedMainYouTubeMediaSourceResolver.kt` obtains the requested video's content sources through NewPipe, and `NativeOwnedMainPlaybackService.kt` mounts those sources directly. That player does not depend on the website's advert transition. The retained WebView fallback uses a different quarantine/skip/advance path. Source review found no dedicated background-ad decoder or fabricated completion pipeline; a hidden resident WebView alone is not proof of either behavior.

## Safe fallback changes completed here

Two independent production-function failures reproduced before editing:

- Stale initial metadata for a previous video could override the current video's duration. Duration now requires an exact supported route and matching video ID. An early streamed Player/get_watch record can supply one private `{videoId, duration}` entry without retaining another raw response.
- A thrown seek latched advancement permanently; ignored writes could be reported as successful. Each freshly validated element/duration/route has at most three attempts, spaced at least 900 ms apart. Success requires reading back a time near the requested end. A rolled-back seek may retry within that same budget.

Existing settings, interruption, player ownership and requested-content duration guards remain. The player API seek still requires its own reported duration to match the confirmed advert. No profile admission, audio, parallel playback or advert scheduling defaults were replaced. These corrections improve fallback reliability; they do not fix the measured server backoff.

## A more durable content-only backend

The useful architectural distinction is ownership of the requested media source and playback lifecycle. Copying Android's Java NewPipe/Media3 classes into browser JavaScript is not a direct reuse path. No existing extension decipher/resolver, SABR playback client or native messaging transport was found in this review.

A second read-only sample from the already playing playlist matched route video `kIDWgqDBNXA`: one muxed MP4 format with a cipher and no direct URL, 16 adaptive formats with no direct URLs, a SABR endpoint, and no HLS/DASH manifest. [Source coverage evidence](artifacts/advert-streaming-backoff-2026-10-22/source-coverage.json) records presence/types only. This demonstrates why an independent `<video>` element alone does not deliver Android parity; it does not prove direct URLs are unavailable in every session.

The next implementation should be isolated behind an experimental opt-in and advance only through these gates:

1. Classify current-video Player responses into direct muxed, separate audio/video, ciphered, manifest, SABR or unavailable sources, without logging signed URLs. Measure coverage before selecting a backend.
2. Prove an already supplied, compatible direct muxed HTTPS VOD source in an owned player. Require existing profile admission to allow playback first. Keep unsupported sources on the existing backend; do not silently drop required captions or audio choices.
3. Prove first frame, seek/range requests, pause, volume, fullscreen, expiry recovery, no duplicate audio, and immediate teardown on SPA navigation, profile or policy changes in installed Chrome and Firefox. Test child-denied and pending content explicitly.
4. Only extend coverage to adaptive formats, captions, alternate audio and SABR after the independent source and lifecycle are proven. Chrome's [network rules](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests) distinguish page/content-script requests from privileged extension requests; media elements and scripted MSE fetches also need separate testing. Keep resolver implementation compatible with [bundled-code requirements](https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code).

Durability needs executable captured-response fixtures plus repeatable installed playback checks, separated into sanitization, source resolution, startup and admission failures. A content-only backend can remove dependency on the website's ad scheduler, but it still depends on YouTube source delivery and cannot honestly be promised permanent or undetectable.

## Validation

The new full-production-script duration/seek suite has 20 cases; combined with existing advert, startup and streaming suites, **106/106 pass**. Six of the initial regression cases failed against the previous seed. Independent source review found no blocking regression.

- Smoke lane: **407/407 passed**.
- Release lane: **257/257 passed** after refreshing the generated README's current fingerprint. Its first run had two README hash mismatches; no semantic assertions were removed.
- Focused current audit/registration/duration checks: **62/62 passed**.
- Runtime syntax and `git diff --check`: passed.
- Chrome, Firefox and Opera local v3.4.1 packages rebuilt; seed and README match source, staged output and ZIP bytes for each browser.
- The previously failing broader JSON/performance lanes were not rerun for this follow-up and remain open; see the preceding popup/streaming audit for their baseline failures.

The fallback correction has not been accepted in a newly reloaded installed browser. Installed observations above were collected with the previous build. No native assets were synchronized, no server backoff was rewritten, and no independent content player was shipped.

FreeLLMAPI `gemini-3.8-flash` was asked for a bounded critique of the timing inference and returned upstream HTTP 502. No failed or substituted model response was treated as validation. Source, protocol decoding and executable tests supply the evidence above.
