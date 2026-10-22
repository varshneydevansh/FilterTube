# Automatic native playback and playlist preservation — 2026-10-23

Status: implemented and built; source/package checks passed. Installed automatic-playback and navigation acceptance awaits the manual extension reload. Nothing pushed, submitted, published or posted to GitHub. FilterTubeApp was not modified or synchronized.

## User-facing change

The earlier “Refresh main video source (experimental)” control ran a one-shot source transaction only after a per-video click. Its “Main video loaded” message acknowledged that transaction, not permanent source selection across all navigation.

That foreground panel is removed. **Content Controls → Player → Content-only playback (Experimental)** is enabled by default when advert filtering is enabled. A saved explicit false remains false per profile. The existing popup/dashboard toggle handlers and parent/child UI locks own edits. Backup, import, compilation and settings delivery carry the preference; another profile or a stale legacy root value cannot silently override a valid profile’s choice.

Automatic selection preserves healthy native playback. With fresh admission, exact native video ID, explicit inactive native advert state, matching finite duration, readyState at least 3 and a content position beyond one second, the existing video stays untouched—including when paused. The diagnostic state is `native_ready`, not a source-swap success. This check runs before extraction and again before commit if playback became ready during the request. Existing advert sanitization remains active. Otherwise an admitted, bounded fresh-source transaction can proceed automatically.

The setting describes automatic source selection when needed. It does not promise that every healthy stream is replaced, that all later interruptions are automatically recovered, or that YouTube cannot change its delivery. If playback has trouble, the user can turn the preference off and reload the video.

## Previous and Next regression

The native API’s default source reload clears its existing playlist. The earlier one-argument `loadVideoByPlayerVars(args)` call therefore dropped the queue and its navigation controls. It also omitted the native watch-next response.

The source commit now calls `loadVideoByPlayerVars(args, true)` to preserve the actual existing playlist/index/queue, and passes a bounded detached copy of the current native `raw_watch_next_response` when available. It does not rebuild playlists or implement private Previous/Next controls. Foreign, malformed, oversized or circular navigation context is refused before media mutation. Native controls and existing route admission continue to govern the next video.

## Automatic admission and scheduling

- Automatic start requires a strict synchronous isolated-world preference callback and a fresh opaque profile admission lease. Page/source metadata cannot opt into it. Manual controller callers retain the original trusted-action contract.
- The preference and route/profile/lease identity are checked again before apply and resume. Paused intent stays paused. Autoplay refusal does not trigger a mute workaround or repeated play attempts.
- One source attempt is allowed per route/video/profile context. Metadata/settings churn and handoff completion cannot repeatedly reload a playing video. An explicit off→on transition can initiate a new bounded attempt.
- Native readiness/admission waiting is bounded to 15 seconds with 500 ms retries. Unknown native metadata has at most three preflight requests. Failed extraction/commit is not retried automatically. Genuine later direct/category permission release or a fresh authoritative managed permit can wake an unattempted route.
- Genuine native-control input cancels preparation. Navigation, settings/profile changes, preference-off and authoritative denial cancel pending work. Existing native admission/category/language/time owners retain ordinary playback after handoff.

## Validation boundaries

Focused tests cover preference default/persistence/import/profile isolation/locked edits, automatic permission and cancellation, exact native feature selections, healthy-playback preservation, bounded startup/deduplication, playlist preservation and watch-next ownership. Browser tests and final package counts are recorded separately below. Source and package tests are not installed Firefox or physical parent/child-device acceptance.

## Final local validation and remaining gate

- Smoke **954/954** and release/package **259/259** passed after all three browser builds.
- Settings lane: **645/740 passed**, with **95 failures**. Its failing test titles exactly match the previously recorded 95 baseline failures; no new failing titles appeared. This comparison does not prove checks masked by earlier assertions or installed behavior.
- All changed runtime source files and the English locale match their staged and ZIP bytes in Chrome, Firefox and Opera. No permission/host expansion was introduced. UI-locale structure validation passed, without claiming complete translations.
- A fresh live Chrome playlist had its native Previous and Next controls before applying the new build. Developer inspection of that disposable tab was unavailable while the browser tool was resolving its document; this was not bypassed. Installed automatic behavior and preserved navigation still require the new extension reload plus page refresh.

The final unpacked build is `dist/chrome`. Source and archives remain version 3.4.1 for local testing; nothing was pushed or submitted.

## Viewing-continuity priority

The user clarified that a modest startup wait is acceptable. The acceptance priority is optimized, efficient, uninterrupted viewing: retain working playback, position, audio/captions and native navigation; avoid repeated source replacement, retries and foreground prompts. Startup latency alone is not evidence of a defect or a reason to replace a healthy stream. The healthy-native skip and one-attempt-per-route limit implement this priority.
