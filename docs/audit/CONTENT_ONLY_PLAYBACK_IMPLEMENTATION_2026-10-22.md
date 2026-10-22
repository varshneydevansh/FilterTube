# Content-only playback implementation — 2026-10-22

Status: opt-in progressive-VOD pilot implemented; broad YouTube source resolution and installed acceptance remain gates. This is not Android playback parity or a guarantee against future YouTube changes. No publish, push, native-runtime synchronization or external issue posting is authorized.

## User experience and default behavior

On desktop `www.youtube.com/watch`, enabled FilterTube with sponsored filtering offers a closed **FilterTube playback options** disclosure. **Try content player (experimental)** requests a source only after the user chooses it and existing profile admission permits the video. The user can cancel while checking/preparing, or return to YouTube's player afterward. No automatic player replacement, new host permission, remote library or account mutation is introduced. Mobile, Kids, embeds, live/protected streams and unsupported source/feature combinations retain their existing playback path.

The pilot accepts an exact-current-video, playable, browser-compatible combined audio/video HTTPS Googlevideo source already provided by the page. It rejects unresolved cipher/throttling transforms, SABR-only, adaptive-only and manifest-only sources. It also requires explicit caption/audio evidence and a proven current content timeline; it never copies an advert's playback position into main content. Therefore the pilot does not yet eliminate the reported initial streaming backoff.

## Owned components

- `js/shared/content_playback_source.js`: bounded pure source planning; no network, player-code execution or admission grants. Unsupported plans expose reasons/counts without signed URLs.
- `js/content/content_playback_response.js`: MAIN-world, current-route-only projection of loaded Player data and existing audio/caption selections. It copies no advert plans or tracking envelopes, makes no requests and cannot authorize playback.
- `js/content/content_playback_admission.js`: opaque, renewable one-second leases in the isolated context, bound to the actual settings reference, route epoch, exact video, active profile and the existing direct/category/managed authorities.
- `js/content/content_playback_captions.js`: abortable same-origin YouTube WebVTT preparation; exact video ID, bounded eight-second request budget, at most 32 tracks and 2 MiB aggregate. It retains signed query bytes except the requested VTT format. Failed or stale preparation does not partially authorize a handoff.
- `js/content/content_playback_player.js`: muted candidate staging, native controls, exact selected caption ID/language, Blob cleanup, explicit audio choice checks, finite source expiry and repeated lease validation. The original keeps playing during preparation. Only a genuinely playing/positioned candidate can replace it. Returning or failing before takeover leaves native media untouched; authority loss never seeks or resumes a newly selected route/profile.
- `js/content/content_playback.js`: isolated coordinator, user action, request generation/cancellation, native timeline/ownership rechecks and the accessible experimental disclosure. User interaction with the native controls during preparation cancels the candidate, preserving the latest intent.

All four manifests load the isolated helpers in dependency order on non-embed YouTube pages; the MAIN data bridge is bundled and included in the existing injection path. Other surfaces retain their prior script chain. No native app build or synchronization was run.

## Parent/child policy boundaries

The pilot does not create or edit profiles, rules, PINs, trusted devices or parent commands. A page message supplies media metadata only. It cannot supply a lease, an allow decision, profile identity or time authority.

Pending/blocked direct admission, unresolved enabled category/language policies, stale settings/profile/route identity, managed route denial and native-owned playback refuse handoff. Configured managed time limits currently retain the existing player until a fresh, authoritative time allowance is explicitly integrated. A child with no configured time policy still requires a known inactive time state and the same explicit content admission as an account profile.

Synchronous invalidation hooks cover route transitions, direct/category pauses, settings delivery, managed denial/timeouts and relevant storage changes before a delayed refresh. Pure metadata enrichment remains exempt. During that review a pre-existing fast path was corrected: an enrichment revision marker alone could incorrectly classify simultaneous profile/rule changes as metadata-only. The bridge now verifies equality after stripping only established enrichment fields. Other independent metadata classifiers were not broadened in this change.

## Acceptance checklist

- [x] Pure source planner rejects malformed, mismatched, cipher/throttling, DRM/live, incompatible and expired sources.
- [x] Caption preparation checks actual VTT and cancels on abort, expiry, oversize or stale authority.
- [x] Controller checks actual playing/seek/caption readiness and preserves pause, volume, rate and position; pre-handoff failure leaves native playback alone.
- [x] Admission tests cover parent/child, pending/blocked, route/profile/settings changes, time-policy refusal and opaque token ownership.
- [x] Coordinator tests exercise real planner/lease modules and a mocked media-controller boundary, separately from the real controller DOM fixtures.
- [ ] Installed Chrome: supported real YouTube content source plays independently, seeks, pauses and returns without duplicate audio.
- [ ] Installed Chrome: exact selected captions and audio survive; unsupported combinations leave existing controls working.
- [ ] Installed parent/child profiles: deny/pending, profile switch, policy/rule updates and time limits cannot be bypassed during staging or active playback.
- [ ] Installed Firefox: repeat source, media, caption, audio and policy acceptance.
- [ ] Broad browser-compatible cipher, throttling, adaptive and SABR resolution. No arbitrary observed media URL, fake advert completion or unreviewed remote code is substituted for this work.

The existing Android source resolver and Media3 architecture informed the ownership boundary, not a claim that its Java extractor can be copied directly into an extension. The implementation remains a limited pilot while the unchecked gates remain open. The previous [streaming backoff evidence](ADVERT_STREAMING_BACKOFF_AND_CONTENT_PLAYER_2026-10-22.md) still applies: the four-second server policy has not been removed or explained by this pilot.

## Review and validation record

Independent subagents implemented/reviewed source planning, caption preparation, player lifecycle and parent/child admission. Review found and corrected exact-caption selection, stale native timeline restoration, native-control intent during preparation and metadata-marker profile changes. FreeLLMAPI `gemini-3.8-flash` returned upstream HTTP 502 for a bounded critique; no model response was accepted as validation.

Final checks:

- All six new playback suites: **203/203 passed**.
- Existing direct admission, settings-order, selected-playlist, managed viewing/time and external playback suites: **100/100 passed**.
- Smoke: **612/612 passed**; release: **259/259 passed**, after updating intentional current source/manifest fingerprints and inventories. The first runs had three smoke and seven release inventory mismatches; semantic assertions and historical evidence were retained.
- All changed runtime files and README match source, staged output and ZIP bytes for Chrome, Firefox and Opera v3.4.1. Runtime syntax and whitespace checks passed.
- The broader JSON/performance lanes were not rerun for this pilot; their previously documented failures remain open. Passing the listed lanes does not establish overall release readiness.

### Installed observations after the user reload

The user reported relatively quick playback and supplied a screenshot showing the experimental fallback on `-wK200l4KNc`. Live inspection confirmed **zero owned players**, the original player playing at readyState 4 and `ad-not-active`. The pilot's exact rejection was `throttling_transform_required`: a supplied direct itag-18 URL contained `n`. A bounded `Range: bytes=0-2047` request to that exact supplied source returned **403** with no media sample. This supports refusing that source in the tested context, not a claim that `n` is the sole cause. Token/session/protocol restrictions may also apply. One read-only WEB/Safari-context experiment returned UNPLAYABLE and no streams; no alternate-client strategy was shipped.

The user's subsequent Shakira (`8OO1pOqRJkA`) and Usher (`C-dvTjK_07c`) navigations produced exact get_watch advert-plan and sponsored-renderer removal records. Usher was playing with no advert interruption detected and no owned player. A deliberate pilot attempt on Usher retained the native player (`captions_unsupported`); its source metadata also contained an unresolved signature cipher and SABR. Caption/source preparation did not authorize a partial handoff. These observations establish the existing advert sanitization and safe refusal on those samples, **not successful independent main-media playback** or future detection immunity.

[Redacted installed evidence](artifacts/content-only-playback-2026-10-22/installed-summary.json) omits signed URLs, transforms, opaque tokens, cookies and headers. The test screenshot below shows the fallback while normal Usher playback continues. A temporary agent-created video tab was closed; user tabs and profile settings were preserved. Browser tooling blocked raw CDP for that temporary tab, so it supplied no additional player acceptance evidence.

![Installed Usher fallback, retaining the original player](artifacts/content-only-playback-2026-10-22/usher-fallback.jpg)

The unresolved resolver is a substantive gate. Permanent advert-filtering reliability cannot be guaranteed by this work, and the unchecked owned-player/caption/audio/parent-child/Firefox acceptance items remain open.
