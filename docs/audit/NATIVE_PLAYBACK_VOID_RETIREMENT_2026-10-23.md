# Native playback: retiring the competing Void fallback

Scope: FilterTube extension only. No FilterTubeApp files, native runtime sync, permissions, publication, or GitHub issue updates.

## Result and ownership

On exact desktop `www.youtube.com/watch` routes, the seed no longer runs the legacy advert media loop. It cannot hide/promote the native video, change its audio, click Skip, seek advert media, or resume a paused video. This remains true when Content-only playback is turned off: off means ordinary native playback, rather than restoration of the old loop.

Advert-plan and recognized sponsored-renderer filtering remain independent and active when the master and advert controls permit them. Streaming `get_watch` delivery remains unchanged. Native source selection still requires the existing isolated direct/category/language/managed-time admission and profile identity. Neither MAIN metadata nor the retirement predicate grants permission.

The coordinator retains a healthy native video. Otherwise it attempts one bounded source selection for the route/profile, checks the selected audio/captions and complete audio-program catalog again, commits to the same native player, and relinquishes ownership. YouTube retains captions, audio controls, position, pause intent, volume/rate and its playlist/Previous/Next behavior. Unsupported or unknown data leaves native playback in place. Uncertain source-commit failures retain the existing conservative paused fallback.

## Why this change was needed

The old MAIN fallback continued polling every 900 ms after native source handoff. It could mute media, seek a positively identified advert and repeatedly call `play()` on separate content, including 60 ms after a pause. It had no authoritative profile admission lease. An actual-function audit demonstrated five resume attempts against five parental-guard pauses. The guard kept the video paused, but two playback owners were competing.

The desktop fallback now clears its timer, promotion markers and style without restoring an old audio snapshot onto a new source. Navigation/pagehide cancel retained fallback ownership; pageshow/navigation finish can restart it only on retained surfaces. No automatic `play()` calls or pause-to-play retry remain anywhere in the seed. Mobile/Kids/Shorts/embed fallback stays scoped for separate validation, and may present already-playing content without starting paused content. Retained audio restoration requires the captured route, player, media node and source.

A second interruption risk was found during review: preflight might observe an advert, then YouTube could finish loading the main video while resolution was pending. The previous before-commit check reused stale advert state. One correlated, bounded native-state read now refreshes that observation. A newly healthy video is left alone, including if paused. Changed audio/captions/catalog, timeout, navigation, profile changes or permission revocation refuse the source commit; they do not start a resolver retry.

## Checks and evidence

- Three subagents reviewed media ownership, policy invariants and resolver/native behavior, then cross-reviewed the changes.
- Actual-seed advert/fallback tests: **50/50** pass, including parent/user pause retention, zero desktop media mutations/polling, route/lifecycle cleanup, and preservation of organic content, captions and audio data through advert filtering.
- Coordinator/native/MAIN-response tests: **225/225** pass. Fresh-state races, audio/caption/catalog changes, late replies, profile/route invalidation, playlist preservation and no post-handoff media mutation are covered.
- Smoke: **982/982**. Release/package: **271/271**. UI-locale structure passes; complete translation quality is not claimed.
- Settings: **660/755**, with the same **95 failing test titles** as the prior baseline. No new failing titles; assertions hidden behind earlier failures remain unproven.
- Extended seed/network selection: **333/344**, with 11 failures. A test-only HEAD-seed read substitution reproduced the same 11 titles (old audit count/hash pins and an incomplete older XHR DOM fixture). Those suites were not rewritten to make this change appear fully green.
- All seven changed/relevant runtime and copy files match source, staged and ZIP bytes for Chrome, Firefox and Opera: **21/21** comparisons.
- FreeLLMAPI copy review requested `gemini-3.8-flash`, the highest Gemini model exposed by its current catalog. Inference timed out after 20 seconds; no answer was used as review evidence and no Argon inference is claimed.

Machine-readable evidence: [validation-summary.json](artifacts/content-only-playback-void-2026-10-23/validation-summary.json), [build-parity.json](artifacts/content-only-playback-void-2026-10-23/build-parity.json).

## Live-browser boundary and remaining acceptance

Live Chrome inspection of the preceding installed native-playback build observed Jennifer Lopez `BofL1AaiTjo` in `native_active`, the original native video, 50-item playlist/index 25, native Previous/Next, decoded audio and visible English captions. Between samples, playback advanced from 140.034 to 196.496 seconds, decoded frames from 2141 to 3547 and audio bytes from 1421293 to 2346995. This proves working native feature behavior for that installed build, not acceptance of the new seed retirement.

An ordinary page refresh initially picked up the updated coordinator while the old MAIN seed remained. Later Chrome observations confirmed the new seed: `native-player-owned`, absent fallback style/promotion, and native source handoff. A separate disposable tab then verified Shakira `8OO1pOqRJkA` playing at 26.582 seconds/readyState 4, paused at 52.769 seconds and remaining at exactly that position. Native Next navigated to its advertised `kIDWgqDBNXA`; native Previous returned to Shakira from a paused zero-second position. Above three seconds, YouTube's ordinary Previous button restarts the current video; that behavior was not patched.

The lecture `w9MXqXBZy9U` retained its already-healthy source (`native_ready`). English captions were selected in YouTube's own settings and visibly rendered while playback advanced. Native mute and pause stayed applied at 303.741 seconds across samples; audio and the prior caption preference were restored afterward and the disposable test tab closed. The user's viewing tab was left alone. See [installed-chrome-observations.json](artifacts/content-only-playback-void-2026-10-23/installed-chrome-observations.json), [playlist screenshot](artifacts/content-only-playback-void-2026-10-23/shakira-native-paused.png), and [caption screenshot](artifacts/content-only-playback-void-2026-10-23/lecture-native-captions.png).

Raw CDP inspection on fresh test tabs was unavailable while browser tooling resolved a paused document response; it was not bypassed. The final live checks therefore use native UI actions and safe DOM-backed media/state observations, without claiming read-back hashes of all installed scripts. No further reload is needed for the Chrome behavior observed here. Full-length/midroll soak, multi-audio selection, fullscreen, installed Firefox/Opera and physical parent/child-device acceptance remain separate gates.

## Code and protocol provenance

No NewPipeExtractor, YouTube.js, yt-dlp, Piped or Invidious player/extractor dependency or vendored implementation was added. The JavaScript resolver, validation, isolated admission and native handoff are maintained in FilterTube. The fixed VisionOS client request strategy and protocol fields were informed by NewPipe's published protocol research; earlier range-query research also consulted YouTube.js. Those references are documented in [the implementation audit](CONTENT_ONLY_PLAYBACK_IMPLEMENTATION_2026-10-22.md). This is an implementation owned here, not a claim that its protocol research was wholly independent or that the existing extension has no OSS dependencies. Package manifests and lockfiles were unchanged by this work.

This change removes competing playback ownership. It does not establish that every future advert will be prevented or that YouTube cannot change its native interfaces and delivery protocol. No fake advert-impression/completion telemetry was introduced.
