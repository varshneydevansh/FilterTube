# Changelog

## Post-v3.3.5 source-history index

The following index records every commit after the v3.3.5 stability baseline
(`2fd04d3`) through the current unreleased checkpoint. The detailed contracts
remain in the existing topic documents linked below; this table is the
chronological index, not a replacement for those documents.

| Date | Commit | Recorded change | Canonical detail |
| --- | --- | --- | --- |
| 2026-07-05 | `4a658584` | Explicit MVP Android artifact reuse and honest version/code claims | [App release workflow](docs/APP_RELEASE_AND_RUNTIME_SYNC_WORKFLOW.md) |
| 2026-07-05 | `6f7d7b46` | Restore bounded collaborator warmup on identity fast paths | [Renderer inventory](docs/youtube_renderer_inventory.md) |
| 2026-07-06 | `54c35a22` | Simplify website language and add the internal Android testing ask | [Website surface changelog](docs/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md) |
| 2026-07-06 | `c0b3584c` | Add the website-style extension About surface | [Website surface changelog](docs/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md) |
| 2026-07-06 | `d73bd68c` | Move the Android testing CTA above dashboard statistics | [Website surface changelog](docs/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md) |
| 2026-07-06 | `9ac63173` | Align the dashboard Android CTA and stats panel | [Website surface changelog](docs/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md) |
| 2026-07-11 | `fdd98db8` | Add nearby-device discovery and simplify family controls | [Nanah plan](docs/NANAH_P2P_PROJECT_PLAN.md) |
| 2026-07-11 | `eb14f105` | Resolve camelCase YouTube Music collaborator rosters | [Renderer inventory](docs/youtube_renderer_inventory.md) |
| 2026-07-11 | `bd1cd6d4` | Link merged creator aliases for collaborator actions | [Functionality](docs/FUNCTIONALITY.md) |
| 2026-07-11 | `31033f7c` | Preserve collaborator avatars through alias merging | [Renderer inventory](docs/youtube_renderer_inventory.md) |
| 2026-07-15 | `7906a77c` | Document You/channel/account and channel-tab contracts | [JSON encyclopedia](docs/json_paths_encyclopedia.md) |
| 2026-07-18 | `3ba76a33` | Document age-verification-on-video evidence | [Renderer inventory](docs/youtube_renderer_inventory.md) |
| 2026-07-21 | `876d5a4c` | Bind managed policies to target devices | [Nanah plan](docs/NANAH_P2P_PROJECT_PLAN.md) |
| 2026-07-21 | `7953a9fd` | Record native managed-policy decisions | [Technical docs](docs/TECHNICAL.md) |
| 2026-07-21 | `c03ef03c` | Record native managed runtime synchronization | [Technical docs](docs/TECHNICAL.md) |
| 2026-07-21 | `762b6580` | Preserve managed mailbox target binding | [Nanah plan](docs/NANAH_P2P_PROJECT_PLAN.md) |
| 2026-07-21 | `d90a92f9` | Preserve keyed-profile managed decisions | [Technical docs](docs/TECHNICAL.md) |
| 2026-07-21 | `3e063a35` | Preserve managed Pickup target-device binding | [Nanah plan](docs/NANAH_P2P_PROJECT_PLAN.md) |
| 2026-07-21 | `21b71571` | Document mobile LIVE and ended-LIVE contracts | [JSON encyclopedia](docs/json_paths_encyclopedia.md) |
| 2026-07-21 | `86c4802e` | Clarify adaptive-quality preference versus effective quality | [JSON encyclopedia](docs/json_paths_encyclopedia.md) |
| 2026-07-22 | `a5b78c09` | Document mobile hashtag-browse contracts | [JSON encyclopedia](docs/json_paths_encyclopedia.md) |
| 2026-07-22 | `5e8a1fbb` | Map native hashtag-browse fields | [Renderer inventory](docs/youtube_renderer_inventory.md) |
| 2026-07-22 | `9466f9e0` | Document mobile Watch chapter contracts | [JSON encyclopedia](docs/json_paths_encyclopedia.md) |
| 2026-07-25 | `77fc9ed4` | Map dismissible Home rich-shelf feedback | [Renderer inventory](docs/youtube_renderer_inventory.md) |
| 2026-07-25 | `9b5168c0` | Add the independent Hide YouTube Playables control | [Playables audit](docs/audit/FILTERTUBE_HIDE_YOUTUBE_PLAYABLES_CONTROL_2026-07-25.md) |
| 2026-07-25 | `c550c04e` | Record optional rich-shelf feedback boundaries | [Renderer inventory](docs/youtube_renderer_inventory.md) |
| 2026-08-08 | `0f2f7349` | Improve JSON-first category filtering and document its scheduler/ownership contract | [Category behavior](docs/CATEGORY_FILTER_CURRENT_BEHAVIOR_2026-08-08.md) |
| 2026-08-23 | `0920969b` | Checkpoint direct access, time/self-control, rule collections, BlockTube migration, Advert Void, experimental language/audio, UI/help, and focused proof | [Functionality](docs/FUNCTIONALITY.md) |
| 2026-08-23 | `8c73613a` | Distribute the post-v3.3.5 work across canonical product, runtime, website, renderer, sync, and audit documentation | [Documentation index](docs/README.md) |
| 2026-08-23 | `73d4386c` | Add the reviewed device-wide update-refresh-reminder opt-out | [Update reminder audit](docs/audit/FILTERTUBE_UPDATE_REFRESH_NOTIFICATION_RELEASE_SETTING_2026-08-23.md) |
| 2026-08-23 | `828c19b0` | Preserve Aysajan Eziz's original PR #66 contribution in the integrated history | [PR #66](https://github.com/varshneydevansh/FilterTube/pull/66) |
| 2026-08-23 | `e72ea70c` | Apply maintainer-reviewed opt-out semantics, Help copy, rollback behavior, and focused proof to PR #66 | [Update reminder audit](docs/audit/FILTERTUBE_UPDATE_REFRESH_NOTIFICATION_RELEASE_SETTING_2026-08-23.md) |
| 2026-08-23 | `2f4612ea` | Merge the reviewed two-commit PR #66 history into master | [PR #66](https://github.com/varshneydevansh/FilterTube/pull/66) |

The `0920969b` checkpoint and its subsequent documentation and PR #66 review
commits form the v3.3.6 source train. Website edits are tracked in the
[website surface changelog](docs/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md), and
the [post-v3.3.5 ledger](docs/POST_3_3_5_CHANGE_LEDGER_2026-08-23.md) retains the
file-level cross-check behind the canonical topic documentation.

## Version 3.3.6 — Filtering, Protected Time, Advert Void, And UI Reliability

### Direct access and protected time

- **Self-Control Session**: any active profile can start a voluntary 30/60/120-minute or custom commitment session that enables and snapshots its current filters, pins that profile, blocks rule/mode/import/settings changes, and exposes no early-cancel action until the persisted deadline expires.
- **Background-owned strict enforcement**: popup and dashboard disabling are presentation only; the background restores the pinned profile snapshot if a stale page, import, sync path, or other extension mutation attempts to change it. The popup and dashboard show the same countdown after browser restarts.
- **Honest browser boundary**: unmanaged browser owners can still disable/uninstall an extension or clear its data. FilterTube documents this limitation instead of describing the voluntary session as an operating-system-level lock.
- **Account-profile timer activation**: a valid daily limit now follows whichever profile is active, including `Default (Master)` and other account profiles. Previously the dashboard could save `2m/day` on an account profile while runtime silently discarded it as non-child.
- **Playlist direct-access behavior**: when the selected Watch/playlist item is blocked, FilterTube keeps it paused and advances to the next allowed queue item when one exists. With no allowed successor, the blocked state remains.
- **External-site boundary**: ordinary YouTube links on Google or other websites remain visible. The direct-access gate applies after navigation reaches YouTube, while matching `youtube.com/embed/` and `youtube-nocookie.com/embed/` frames are guarded in place. Removing external-page links remains a separate opt-in permission surface.
- **Full-page serene timeout**: any exhausted active profile now sees a stable, responsive full-page pause surface using FilterTube's serene landscape, real FilterTube mark, and About-page editorial typography instead of a small utility card.
- **Profile-safe escape path**: the timeout surface offers an in-page **Switch profile** picker and retains the destination profile's normal PIN check. The exhausted profile cannot dismiss the lock, approve itself, or resume underlying playback.
- **Profile-neutral language**: the timeout explains that the active profile used its own YouTube allowance; it no longer incorrectly describes every account or protected-profile limit as parent-managed time.
- **Visible remaining time**: the popup shows the active profile's exact remaining daily YouTube time and updates it while the popup stays open.
- **Playback-aware accounting**: actively playing YouTube video consumes the daily allowance even when DevTools, FilterTube settings, or another window temporarily has focus. Competing tabs cannot keep a stale usage owner alive.
- **Per-profile accounting preserved**: each profile with a configured limit keeps its own daily policy, timezone day, usage, and parent grant. Switching profiles re-evaluates the destination profile instead of carrying over the exhausted profile's timer.
- **Stable enforcement presentation**: the timeout background is excluded from content-video pausing, page video play events are rejected while timed out, repeated heartbeats reuse the existing screen instead of rebuilding it, and reduced-motion users receive a static scenic treatment.

### Clear keyword and channel rule editing

- **Full-tab rule collection browser**: Main and YouTube Kids now present `Blocked rules` and `Allowed rules` as views of two independent saved collections. Switching the view never switches the active filtering mode, and Kids rules remain separate from Main.
- **Non-destructive mode flip**: when an empty Allowed list is enabled from the top policy pill, FilterTube can copy the current blocked channels and keywords into Allowed rules as a starting point. The Blocked rules remain intact, and switching back never transfers or clears either collection. Bootstrap copies are ignored as exceptions in Block-selected mode so they cannot neutralize their retained source blocks.
- **Individual rule ownership**: every full-tab rule row shows a `Blocked` or `Always allowed` badge and provides a `Move to…` action that transfers only that entry while preserving its saved metadata.
- **Focused popup**: the popup no longer exposes advanced exception-list selection. The top pill uses the distinct `Blocklist` or `Whitelist` mode labels, while `Blocked rules` and `Allowed rules` remain collection views in the full Filters page.
- **Advert Void**: the existing sponsored-content control now removes the observed YouTube Player ad plan before scheduling on Main and Kids, without creating extra requests. The guarded player-state suppression remains as a fallback for escaped adverts, but no intermediate FilterTube banner is displayed. Pre-roll, mid-roll, and post-roll fallback interruptions each receive a diagnostic session, while advert cleanup and requested-content readiness are timed separately. Inline previews and recommendation players are excluded.
- **Advert Void on by default**: new installs enable advert removal immediately, and a one-time upgrade migration enables it for every existing profile. It remains independently user-disableable and works in both Blocklist and Whitelist modes.
- **Advert Void stability maintenance**: the player fallback now requires the paired YouTube `ad-showing` and `ad-interrupting` state, preventing stale SPA classes from hiding requested content. Sponsored-card cleanup remains dedicated to its CSS/MAIN-world paths instead of activating the generic renderer mutation observer, reducing scroll-time flashes and card reflow.
- **Faster direct Watch admission**: direct-access checks reuse the current loaded Player response and rendered Watch description before another Player API request. `Block selected` now evaluates known title/channel text immediately and lets playback continue while missing description metadata resolves in the background, without repeatedly re-pausing the same video; `Allow only selected` remains fail-closed.
- **Responsive and accessible controls**: the segmented rule editor uses touch-sized targets, mobile stacking, visible focus treatment, and keyboard arrow navigation.

### Reliable large BlockTube migration

- **No false-success imports**: BlockTube and FilterTube backup imports now fail with the browser's real storage error instead of reporting completion after a rejected profile or compiled-settings write.
- **Transactional rollback**: imports snapshot extension-local state before mutation and restore it if any compatibility, active-profile, identity-map, or trusted-device recovery write fails.
- **Verified apply receipt**: successful BlockTube imports are read back from the selected profile and report added, duplicate, skipped, channel, keyword/comment, regex, and video-ID counts.
- **Large local rule capacity**: browser manifests grant `unlimitedStorage` for explicitly reviewed local imports; the importer still measures current/estimated storage before mutation and performs no per-channel network fan-out.
- **Theme isolation**: importing BlockTube rules does not silently replace the user's FilterTube theme.

### Official YouTube category filtering

- **Category filtering is working end to end**: FilterTube reads the official category from `microformat.playerMicroformatRenderer.category`, preserves it in `videoMetaMap`, and applies the user's selected category mode to ordinary video cards, the current Watch video, and Watch recommendations.
- **Independent mode selection**: Category Filters now use their own `Block selected` or `Allow only selected` mode independently of the profile's normal Blocklist/Whitelist mode.
- **Full-page and popup controls**: the Category Filters card appears directly below Core and before Feeds in Content Controls, while the popup exposes the same enable switch, mode, selected-category summary, clear action, searchable category chips, and link to the full controls.
- **Clear selection state**: selected category chips use explicit checked styling and accessible pressed state; the UI states whether categories are Allowed or Blocked and names the current selection.

### Experimental spoken-language filtering

- **Deliberately experimental**: the Language Filters card and Help entry are visibly marked Experimental because YouTube does not provide dependable spoken-language evidence for every recommendation.
- **Lower-priority placement**: Language Filters now sits at the bottom of Main Content Controls in both the full Filters view and popup, after the stable controls.
- **Fail-open unknowns**: a resolved language follows the selected Block/Allow-only policy, while unavailable language stays visible instead of blanking feeds, Watch, or the recommendation rail.
- **YouTube Kids boundary**: no Kids language picker is exposed. The inspected `WEB_KIDS` Player captures contain playable audio streams but no defensible original/default-language field; the Kids Polymer bundle exposes caption-selection UI, not per-video spoken-language metadata.

### Reliable viewport hydration

- **Structured Player bridge**: uncached visible cards request category, duration/date, and video-owner identity through the page's same-origin `/youtubei/v1/player` JSON endpoint. FilterTube no longer fetches redirected `/watch` HTML for category hydration.
- **Bounded request scheduler**: visible metadata work uses priority, deduplication, cache-satisfaction checks, negative caching, scroll-idle pacing, batches of at most three active requests, and a hard 24-start rolling-minute ceiling.
- **Next-chunk reliability**: each paced drain fills the next bounded three-card batch. A queued card remains pending instead of aging into an unavailable state before its lookup can run.
- **No disallowed-content flash in allow-only mode**: newly appended cards receive a synchronous pending veil before the debounced DOM pass. The Watch shell gate is installed before initial fallback delay, resolved blocked cards collapse, and genuinely unavailable cards remain hidden without repeated sentinel text.
- **Metadata preservation**: category-only updates merge with existing duration and publish/upload dates instead of erasing them; later partial Player responses cannot erase a known category.

### Watch, Mix, comments, and renderer ownership

- **Current Watch enforcement**: a disallowed current video is paused and covered with a stable category explanation without clicking YouTube controls, mutating a playlist, or starting navigation loops.
- **Watch rail ownership**: current compact and camelCase lockup hosts are canonicalized to one visual card, preventing nested duplicate processing. Playlist/Mix queue rows remain outside category ownership.
- **Mix seed behavior**: a Mix discovery lockup can resolve the category and channel identity of its seed video. That identity also improves the FilterTube three-dot menu, but it is not copied onto every queue item.
- **Comment safety**: comment sheets explicitly reject category ownership. V4 profile settings remain authoritative for `Hide All Comments`, preventing a stale legacy root value from silently re-enabling comment hiding during category saves.

### Documentation and proof

- **Current behavior record**: `docs/CATEGORY_FILTER_CURRENT_BEHAVIOR_2026-08-08.md` documents settings, sources, enforcement, scheduling, UI, ownership boundaries, and validation.
- **YouTube renderer inventory**: documentation now includes the global Home chip bar and the separate “Explore more topics” horizontal chip/video shelf, whose chips are navigation refinements rather than official video categories.
- **YouTube Kids capture ledger**: the JSON encyclopedia and renderer inventory record the available onboarding, persona, browse, Search, Watch, subscription, settings, parent-gate, and DOM capture files and their evidence boundaries.

## Version 3.3.5

### YouTube Breakage Recovery

- **Duplicate content-runtime injection fixed**: install/update/profile refresh now relies on manifest content scripts and ping/bridge checks instead of reinjecting isolated runtime files into already-open YouTube tabs. This prevents repeated `Identifier ... has already been declared` syntax failures such as `filterTubeMenuStylesInjected`, `VIDEO_CARD_SELECTORS`, `CHANNEL_ONLY_TAGS`, `pendingSeedSettings`, and `statsCountToday`.
- **Already-open tab behavior preserved**: managed time-limit checks and runtime refreshes can still reach open YouTube tabs without forcing duplicate content-script declarations.
- **Issue #64 investigation ledger**: `docs/audit/FILTERTUBE_POST_3_3_2_YOUTUBE_BREAKAGE_COMMIT_LEDGER_2026-07-05.md` records the post-v3.3.2 commits and the runtime-injection failure mode.

### Shorts Channel Blocking

- **Visible Shorts identity prefetch**: when channel rules or whitelist mode are active, visible/near-visible Shorts without channel identity now use the existing bounded background `/shorts/<videoId>` resolver.
- **Blocked-channel Shorts hide earlier**: learned `shortVideoId -> channelId` mappings are persisted to `videoChannelMap`, then DOM fallback reprocesses the card without waiting for hover, quick-block, or 3-dot menu interaction.
- **Current desktop Shorts hosts covered**: `.shortsLockupViewModelHost` and `.ytGridShelfViewModelGridShelfItem` are now included in the dedicated Shorts fallback/enrichment selector set.
- **Safety boundary**: blocklist mode does not hide unknown Shorts until identity resolves, whitelist mode remains stricter through the existing pending path, and no-rule/no-channel-rule sessions do not start Shorts identity work.
- **Audit trail**: `docs/audit/FILTERTUBE_SHORTS_CHANNEL_IDENTITY_PREFETCH_2026-07-05.md` records the implemented behavior and release boundary.

### Release Notes

- **Update notification setting**: a device-wide **Disable update notifications**
  opt-out suppresses reload reminders and What’s New banners on YouTube and
  YouTube Kids after an extension update. It is unchecked by default, and the
  dashboard’s manually opened What’s New page remains available; see the [current behavior audit](docs/audit/FILTERTUBE_UPDATE_REFRESH_NOTIFICATION_RELEASE_SETTING_2026-08-23.md).
- **v3.3.4 store rollback documented**: v3.3.4 was a store rollback to the v3.3.2 package while YouTube breakage reports were being investigated. It is documented for release history, not as a normal source-forward feature release.

## Version 3.3.4

### Store Rollback

- **Rollback package**: v3.3.4 was published through browser-store rollback controls as the earlier v3.3.2 package after a YouTube breakage report against v3.3.3.
- **Reason**: the rollback kept users off the suspected v3.3.3 package while the cause was investigated.
- **Follow-up**: user reports showed the rollback alone was not enough for every case, so v3.3.5 carries the source-forward duplicate-runtime-injection and Shorts identity fixes.
- **Source note**: this repository does not treat v3.3.4 as a feature-development source checkpoint. It is recorded here to keep store history understandable.

## Version 3.3.3

### Family Device Updates And Protected Profiles

- **Managed parent/caregiver controls**: parent/account profiles can create and manage protected profiles, edit their rules from the parent dashboard, and send approved policy updates to a verified protected device.
- **Family Device Updates**: Accounts & Sync now presents the live send path, explicit Home Pickup, and explicit Internet Pickup as one protected-device update model instead of separate technical concepts.
- **Saved-update checks**: protected profiles check for approved saved updates when the dashboard opens, profile visibility returns, or the profile switches, while still validating trusted link, target profile, scope, revision, and local policy before applying.
- **Home Pickup and Internet Pickup hooks**: the extension can talk to explicitly configured pickup providers for same-home/school/clinic or away/opens-later delivery. Automatic LAN peer discovery and a hosted FilterTube pickup service are not claimed in this release.
- **Two-PIN model clarified**: the child/protected profile PIN is for switching into that profile or opening receive-only sync. Parent/account/Master unlock remains the authority for rules, trusted devices, viewing access, time limits, and backups.

### Time Limits, Help, And Parent-First UI

- **Protected profile time limits**: daily YouTube access can be set per protected profile, old and newly opened YouTube tabs are checked, and the timeout screen explains the limit calmly.
- **Extra-time request history**: protected users can request more time, but that request is recorded for parent review instead of granting authority by itself.
- **Parent-first Help refresh**: the Help page now starts with plain-language parent flows, explains child profile control, receive-only sync, managed updates, exact keyword matching, date-limited keywords, and rule-list imports.
- **Fast help bubbles**: key controls across Dashboard, Filters, Settings, Accounts & Sync, profile rows, rule import, time limits, Family Device Updates, and pickup setup now expose short hover/focus/touch help text.
- **Accounts & Sync simplification**: Family control, Copy once, and Move account flows are described in user terms, with advanced transport and fixed-target options kept behind disclosure.

### Rule Lists, Import, And Issue #62 Foundation

- **Reviewed rule-list imports**: CSV, TXT, simple JSON, BlockTube-style JSON, and raw HTTPS list URLs can be previewed before they add channels or keywords.
- **Main/Kids/Both targeting**: imported rules can be applied to Main YouTube, YouTube Kids, or both for the current profile/protected profile.
- **List management**: imported lists can be labeled, paused, resumed, removed, checked for stale URLs, refreshed, and reviewed before refresh changes apply.
- **Templates and examples**: the import UI exposes CSV and JSON templates plus plain examples so parents can see what a supported file looks like before uploading.
- **Catalog boundary**: silent public auto-subscribe catalogs are still future governance work. A random public list URL never becomes authority without local review.

### Keyword Rules And Comments

- **Date-based keyword rules**: a keyword can apply only to videos released on/after a date, on/before a date, or between dates.
- **Comment date behavior**: when a date-limited keyword also filters comments, FilterTube uses the parent video upload/publish date from YouTube metadata rather than pretending each comment has an upload date.
- **Date UI validation**: date-limited keyword controls no longer activate without the required date for the chosen mode, and single-bound modes only require one date.

### YouTube And YTM DOM Compatibility

- **Current desktop lockup DOM**: title, thumbnail/video id, byline, avatar label, and menu extraction were refreshed for YouTube's camelCase lockup classes such as `ytLockupMetadataViewModelTitle` and `ytLockupViewModelContentImage`.
- **Current playlist rows**: playlist panel rows with `ytd-playlist-panel-video-renderer[lockup]` and current byline/title structure are inventoried and documented for hide behavior.
- **YTM mobile DOM inventory**: mobile YouTube now shows camelCase classes such as `YtmChipCloudRendererHost`, `YtmBadgeAndBylineRendererHost`, and `YtmChannelThumbnailWithLinkRendererHost`; the inventory records how these map to existing YTM card filtering.
- **Watch chip boundary**: Home/Search chip labels can still be filtered where appropriate, but Watch-page related chips on desktop and YTM are treated as navigation refinements, not video cards, so chip changes do not wake DOM fallback or cause Watch scroll jumps.
- **Open-tab time-limit enforcement**: installed or updated extensions now send managed time-limit checks into already-open YouTube tabs instead of only affecting future tabs.

### Release Notes And Boundaries

- **Post-3.3.2 audit trail**: `docs/audit/FILTERTUBE_POST_3_3_2_RELEASE_CHANGELOG_AUDIT_2026-07-02.md` records the release lanes from the May 31 v3.3.2 tag to this release prep.
- **Native app parity boundary**: shared policy contracts and runtime sync expectations are documented, but Android/iOS native UI parity remains a downstream app release lane.
- **Known unclaimed work**: hosted Internet Pickup deployment, automatic LAN discovery, public list catalog governance, and installed two-device manual smoke evidence remain outside this changelog's completion claim.

## Version 3.3.2

### Mobile / Tablet App MVP Release Surface

- **App MVP release path finalized in the public repo**: `filtertube.in/downloads`, the website platform pages, release tooling, and the extension dashboard now point to the same browser, Android phone/tablet, and iOS/iPad release surface.
- **Android phone/tablet release setup**: public copy now describes Android as in final testing/release setup with YouTube Main, public YouTube Kids access, profiles, PIN rules, and Nanah sync.
- **iOS/iPad release setup**: public copy now separates the TestFlight/App Store path from Android and keeps Android TV / Fire TV out of the mobile/tablet release scope.
- **Extension dashboard app cards**: the dashboard control center now includes Android and iPhone/iPad status cards that route users to the downloads/status hub.
- **Release artifacts**: `build.js` can stage Android APK/AAB artifacts and `.sha256` checksums beside browser ZIPs when the release is cross-platform.

### YouTube Runtime Performance

- **Reduced no-rule work**: empty or inactive rule states now skip more JSON clone/parse/replay work, DOM fallback scans, quick-block sweeps, fallback menu warmups, and whitelist pending work.
- **Whitelist pending throttles**: pending-card rechecks are coalesced, batched outside mutation callbacks, capped, and trimmed to the relevant pending cards.
- **Overlay-aware observers**: fallback menu and quick-block work now backs off while native YouTube menus/overlays are open.
- **Production console gate**: routine `console.log`, `console.info`, and `console.debug` output is muted in production extension contexts unless explicit FilterTube debug mode is enabled.
- **Installed-profile parity gates**: release audits now track the difference between private automation Chrome and the real installed user Chrome profile so manual smoke tests run against the extension users actually have installed.

### Whitelist / Blocklist Correctness

- **Whitelist Shorts creator fallback**: whitelisted channel Shorts can use creator-page context when direct card identity is delayed, reducing false hides on allowed channel Shorts tabs.
- **Watch autoplay endpoint leaks**: compact autoplay/watch-next JSON endpoints are filtered when end-screen card/videowall controls are enabled, including whitelisted-channel watch sessions.
- **List-target forwarding**: `addFilteredChannel` now preserves blocklist/whitelist target intent across background paths so UI actions write to the expected list.
- **DOM state hardening**: runtime state moved away from broad stable `data-filtertube-*` signatures where possible, reducing externally visible extension fingerprints while preserving necessary local state.

### Profiles, Kids, And Nanah

- **Managed child authority**: child receive-only sync, parent-managed child rule editing, global child edit mode, and locked-profile prompts are now aligned across dashboard surfaces.
- **Nanah app metadata**: extension/native payloads preserve channel-derived `Filter All` keyword ownership, row tint, source badges, and pairing metadata across sync/import paths.
- **Kids whitelist guard**: Kids watch surfaces avoid playlist/watch pause side effects in whitelist mode while still honoring allowed content policy.

### Documentation

- **Post-April-12 validation register**: `docs/audit/FILTERTUBE_POST_APRIL_12_RELEASE_DOC_VALIDATION_2026-05-31.md` records every commit after the April 12 release baseline and maps code-only commits to current documentation coverage.
- **Release-facing docs refreshed**: README, release notes JSON, app release workflow docs, website/app release changelog, architecture, technical notes, functionality, and codemap now describe the May 31 release candidate state.
- **Known limitation**: Android phone/tablet and iOS/iPad should be described as final testing/release setup until public store/direct links are live. Android TV / Fire TV remain future separate app work.

## Version 3.3.1

### Whitelist Home & Watch Stability

- **Whitelist playback guard**: Watch pages no longer run current-watch owner blocking or playlist skip/redirect logic while in whitelist mode, so YouTube keeps ownership of video startup and navigation.
- **Home/watch loading guard**: Whitelist pending pre-hide is skipped on Home and Watch surfaces to avoid blank pages while YouTube is still resolving card identity.
- **Whitelist pending-pass throttle**: pending-card rechecks are now coalesced and only scheduled after new pending cards were actually hidden, reducing redundant DOM fallback scans on heavy YouTube pages.
- **Whitelist pending-only scan trim**: pending-card rechecks now exit after re-evaluating the pending video cards instead of continuing into survey, chip, Shorts, comments, guide, shelf, and duplicate cleanup passes.
- **Empty Shorts shelf cleanup**: Home Shorts shelves with no visible allowed items are collapsed so whitelist feeds do not leave empty section headers behind.
- **Comment keyword scope cleanup**: Removed the global `Filter Comments` content-control toggle. Keyword rows now own comment-text filtering through their `Comment` pill, while `Hide All Comments` remains the global comments-section control.

### Nanah Device Trust & Sync

- **Accounts & Sync simplification**: `Device Trust & Sync` now starts from three simpler paths: `Send this profile once`, `Parent controls child`, and `Move full account`.
- **Advanced controls moved behind disclosure**: low-level relationship/scope/policy controls are still available, but they are no longer the first thing ordinary users see.
- **Remote target profile flow**: live sessions can target a specific remote profile more clearly, especially for parent -> child updates.
- **Saved managed-link symmetry**: when the receiving device saves a managed link on first approval, the sender now stores the matching trusted relationship too.
- **Refresh/reconnect clarity**: trusted links remain saved, but refresh still ends the live session; reconnect is a fresh live session, not hidden background sync.
- **Same-device join protection**: self-join/session-burn behavior is blocked more clearly in signaling and the desktop UI.
- **Device label persistence**: the preferred Nanah device label now survives page refresh.

### Parent / Child Safety

- **Locked-child parent update path**: trusted parent/source links can update child replicas under a saved local child-side rule without sending the PIN.
- **Unlocked child rule**: unlocked child profiles may send their own scoped snapshot, but not full-account migration.
- **Child-surface restriction hardening**: child profiles now block more admin/account/import/export/trusted-link mutation paths in desktop UI surfaces.

### Documentation

- **Nanah user guide added**: a plain-language guide now lives in `docs/NANAH_USER_GUIDE.md`.
- **Docs refreshed**: README, Architecture, Technical, Functionality, Profiles & PIN, project plan, and the post-implementation concerns tracker now reflect the current Nanah desktop checkpoint.
- **Help copy refreshed**: the in-product Help page and Accounts & Sync wording now explain the relay as a meeting place and the real payload as device-to-device.

## Version 3.3.0

### Collaboration + 3-Dot Menu Recovery

- **YTM 3-dot/Quick Block rollout**: Mobile YouTube home, watch-next, playlist, radio, and Mix-like cards now participate in the same menu/quick-block identity flow instead of falling back to incomplete single-channel handling.
- **Watch-page collaboration recovery**: Right-rail lockups, watch playlist rows, and watch-like menu surfaces can now recover the full collaborator roster from YouTube's dialog/sheet data instead of stopping at one visible uploader.
- **Active menu refresh**: If the 3-dot menu opens before collaborator enrichment finishes, the menu can now refresh in place once the full collaborator roster arrives.
- **Mix/watch recovery hardening**: Mix-like watch rows and fallback popovers now recover owner/collaborator context more consistently through watch-page data.
- **False-positive collab guardrails**: Plain single-channel names containing `&` or `and` no longer become fake collaboration menus unless explicit collaborator evidence exists.
- **Optional 3-dot menu item**: Added a new content-control toggle so users can hide FilterTube's injected 3-dot menu entry while keeping Quick Block enabled.

### Quick Block + Surface Stability

- **Quick Block visibility fixes**: Hover quick-block now stays above more desktop card overlays and no longer disappears behind complex YouTube surfaces.
- **YTM mobile search safety**: Quick Block now suppresses itself while mobile search suggestions are open, so it does not interfere with typing/search dropdown interaction.
- **Mobile watch-next anchoring**: Quick Block now positions more reliably on mobile watch-next cards instead of colliding with compact watch-side layouts.
- **Watch/YTM renderer recovery**: Restored and expanded YTM renderer handling across DOM extraction and fallback filtering so more mobile cards resolve identity and hide correctly.

### Whitelist + Subscriptions Import

- **Cross-browser import hardening**: Subscribed-channel import now keeps recent real browse responses, prefers active page-driven `/feed/channels` growth, and handles Chrome/Edge differences more safely.
- **`/feed/channels` exemption**: The All subscriptions page is treated as a management surface, so blocked channels remain visible there for audit/import purposes.
- **Creator-page whitelist improvements**: Whitelist mode handles unresolved cards more safely on creator/channel pages while still respecting page identity.
- **YTM whitelist correctness**: Additional mobile renderers are now evaluated consistently in whitelist mode, reducing cases where unresolved cards leaked through on YTD/YTM feeds.
- **Navigation/filter polish**: The subscriptions guide section and the `Mixes` chip now respect the related hide controls more consistently.

### Channel Management + Backups

- **Channel Management links**: Channel rows can now open the live YouTube channel page using the best available identifier (`@handle`, UCID, or custom URL).
- **Firefox encrypted export fix**: Manual encrypted export now uses a safer Firefox fallback path instead of relying only on the downloads API route.

## Version 3.2.9

### Subscribed Channels Import + Whitelist Flow

- **Subscribed channels import**: Added a Tab View flow that imports the active YouTube account's subscriptions into whitelist.
- **YouTube tab startup hardening**: The import now reuses or opens a YouTube tab, routes it to `/feed/channels`, and waits for the FilterTube bridge before starting.
- **Whitelist semantics clarified**: `Import Only` keeps the current blocklist untouched, while `Import + Turn On Whitelist` follows the existing blocklist-to-whitelist migration behavior.
- **Documentation refresh**: Added dedicated import docs plus updated architecture, technical, pipeline, renderer, and developer docs for the new flow.

## Version 3.2.8

### Theme Refresh + Scenic UI Shell Tuning

- **Scenic shell refresh**: Popup and dashboard surfaces now share the calmer product shell with the local homepage hero video as ambient background media.
- **Light + dark theme tuning**: Dark mode now keeps the scenic background visible without the washed center glow, while light mode uses cleaner transparency and softer shell opacity.
- **Popup UI refinement**: The popup was tightened into a quicker control surface with better spacing, improved header balance, clearer enabled/disabled branding, and a more compact profile selector.
- **Dashboard shell polish**: Top bar, sidebar, cards, and view container were rebalanced to feel more app-like and closer to the website hero direction.

### Responsive + Interaction Improvements

- **Mobile/tab-view fit fixes**: Filter surfaces, date/sort rows, stacked controls, and short-height sidebar layouts were adjusted for smaller screens and compressed-height devices.
- **Profile dropdown behavior**: The tab-view profile selector now opens as a viewport-positioned dropdown on mobile instead of clipping inside the header layout.
- **View switching cleanup**: Switching between Dashboard, Filters, Settings, Help, and other pages now resets scroll position instead of inheriting the previous page scroll.
- **Help/Support layout pass**: Desktop card placement was tightened so Help and Support sections read more evenly.

### Visual State + Control Updates

- **Tint fixes**: Enabled/disabled states, pill accents, and search/control surfaces were corrected to read properly across both themes.
- **Import/export button polish**: `Download JSON`, `Download Encrypted`, and `Choose JSON` were rebalanced for clearer tinting and more consistent sizing.
- **Dropdown + field consistency**: Custom selects, date inputs, and profile dropdown sizing were normalized to better match the refreshed shell.

### Tooling + Release Metadata

- **Badge logic fix**: README total line count now excludes binaries like local video assets and only counts tracked text/code files.
- **Version sync**: Package and browser manifests updated to `3.2.8`.
- **Release metadata refresh**: Added the `3.2.8` entry in `data/release_notes.json` and UI/UX refresh docs under `docs/`.

## Version 3.2.7

### Category Filters + Quick Block Hover Cross

- **Quick Block default ON (one-time migration)**: `showQuickBlockButton` now defaults to enabled in v3.2.7, while still allowing users to disable it anytime.
- **Safe migration behavior**: Added a one-time migration marker (`quickBlockDefaultV327Applied`) so this default is applied once and not re-forced on future updates.
- **Quick block card action hardening**: Improved card anchoring and hover lifecycle so the quick cross stays visible on complex YouTube surfaces.
- **Search/Home Shorts hover retention fix**: Pointer tracking now retains hover state while the pointer remains inside host/anchor bounds, reducing cross disappearance under overlay layers.

### Blocking Stability Fixes

- **Comment block isolation**: Comment-origin block actions are now context-isolated from watch/playlist card logic.
- **Playlist autoplay regression fix**: Blocking from comment menus no longer triggers unintended playlist row hide/next-video transitions.
- **Context-safe identity path**: Comment-origin actions skip video-card prefetch/identity merge paths that could leak currently-playing card identity.

### Release Notes + What’s New

- **v3.2.7 release note refreshed** in `data/release_notes.json` with short, feature-first highlights.

### Documentation Updates

- Updated quick-block behavior and reliability notes in:
  - `docs/FUNCTIONALITY.md`
  - `docs/ARCHITECTURE.md`
  - `docs/CODEMAP.md`
- Added README feature note for the quick block cross and updated badge/version metadata.

## Version 3.2.6

### UI/UX Beautification & Content-Based Filtering

- **Typography Overhaul**: Complete redesign from serif to modern sans-serif system using Inter font family for improved readability and consistency.
- **Font Scale Refinement**: Tighter increments (12px-30px) with optimized line heights and letter spacing for better visual hierarchy.
- **Content-Based Filters**: Three new advanced filtering capabilities:
  - **Duration Filter**: Hide videos by length (longer/shorter/between specific durations)
  - **Upload Date Filter**: Filter by publish date (newer/older/between specific dates)
  - **Uppercase Filter**: Detect and filter clickbait ALL CAPS titles (single_word/all_words/percentage modes)
- **videoMetaMap System**: Persistent storage of video metadata (duration, publish dates) with intelligent batching (75ms window, 1500 entry cap).
- **Enhanced Dropdowns & Selects**: 3px left accent borders, floating shadows, improved hover effects, and mobile responsiveness.
- **Custom Date Inputs**: Styled to match select components with consistent visual language.
- **Button Improvements**:
  - Import button: Green accent for visual distinction
  - Primary button: Forced white text in dark mode for readability
  - Danger button: Improved contrast (#fca5a5)
- **Toggle Switch Refinements**: Better dark mode contrast with #e2e8f0 knob color.
- **Brand Toggle Button**: Visual extension status indicator with enabled/disabled states and 7px uppercase labels.
- **Dark Mode Enhancements**:
  - Search input: Orange accent highlighting (rgba(217, 119, 6, 0.7))
  - Card boundaries: Consistent #404040 borders across all cards
- **Kids Mode Theming**: Vibrant pink (#EC4899) and purple (#8B5CF6) gradient design system:
  - Tab navigation with gradient backgrounds
  - Input fields with gradient borders
  - List items with gradient hover effects
  - Sidebar navigation styling
  - Dark mode adaptations with lighter shades
- **Dashboard Improvements**:
  - Surface-specific stats tracking (separate for Main and Kids)
  - Enhanced stat cards with larger values (2.25rem) and better spacing
  - Donate promo card with gradient styling
- **Advance Video Filters Section**: Collapsible UI in popup with inline controls and full-width card-style radio options in tab view.

### Documentation Updates

- **ARCHITECTURE.md**: Added videoMetaMap extraction flow, content filters architecture, and fixed broken mermaid diagram.
- **TECHNICAL.md**: Comprehensive typography system documentation and UI component styling guide (~800 lines).
- **FUNCTIONALITY.md**: Complete content filters documentation with examples and use cases (~450 lines).
- **YOUTUBE_KIDS_INTEGRATION.md**: Kids Mode theming documentation with accessibility considerations (~200 lines).
- **CODEMAP.md**: Updated to v3.2.5 with feature overview.
- **README.md**: Added content-based filters to features list.

## Version 3.2.5

### Whitelist Mode Promoted + Stability

- **Promoted Whitelist Mode**: Removed experimental labels; whitelist mode is now the primary allow-only path.
- **3-Dot Menu Cleanup**: Disabled irrelevant "Block Channel" menus in whitelist mode to prevent user confusion.
- **Search Secondary Handling**: Added intelligent processing for right-rail watch cards on search pages.
- **Enhanced Channel Extraction**: Multi-source identity resolution with thumbnail anchors and parent containers.
- **Mode-Aware State Tracking**: Seamless switching between blocklist/whitelist with intelligent reprocessing.
- **Bridge-Level Optimizations**: Excluded search results from whitelist pending logic for better performance.
- **UI Confirmation Dialogs**: Added user confirmation when switching modes with intelligent transfer options.
- **Seed.js Intelligence**: Mode-aware search processing that skips unnecessary engine work in whitelist mode.
- **Kids Mode Whitelist Support**: Extended whitelist functionality to YouTube Kids profiles with zero-network architecture.
- **Filter Logic Enhancements**: Added chip renderer exclusion and watch page scaffolding protection.
- **Playlist Stability**: Selected rows stay visible; pending identities no longer unhide blocked rows.
- **Performance Improvements**: Selective processing and bridge-level exclusions reduce CPU usage.

## Version 3.2.4

### Enhanced Whitelist Mode (Experimental)

- **3-Dot Menu Cleanup**: Disabled irrelevant "Block Channel" menus in whitelist mode to prevent user confusion and improve interface clarity.
- **Search Secondary Handling**: Added intelligent processing for right-rail watch cards on search pages, preventing UI clutter in whitelist mode.
- **Enhanced Channel Extraction**: Improved multi-source channel identity resolution with thumbnail anchors and parent container data extraction.
- **Mode-Aware State Tracking**: Implemented seamless switching between blocklist/whitelist modes with intelligent reprocessing and state management.
- **Bridge-Level Optimizations**: Excluded search results from whitelist pending logic for better performance and reduced CPU usage.
- **UI Confirmation Dialogs**: Added user confirmation when switching modes to prevent accidental data loss, with intelligent transfer options.
- **Seed.js Intelligence**: Mode-aware search processing that skips unnecessary engine work in whitelist mode for better performance.
- **Kids Mode Whitelist Support**: Extended whitelist functionality to YouTube Kids profiles with zero-network architecture.
- **Filter Logic Enhancements**: Added chip renderer exclusion and watch page scaffolding protection for cleaner content filtering.

### Technical Improvements

- **Performance Optimizations**: Selective processing and bridge-level exclusions improve overall extension performance.
- **Enhanced Error Handling**: Better fallback mechanisms for edge cases in whitelist mode processing.
- **State Management**: Improved mode switching state tracking prevents unnecessary DOM reprocessing.

## Version 3.2.3

### Experimental Whitelist Mode (Alpha)

- **Dual Filtering Modes**: Introduced experimental whitelist mode alongside traditional blocklist mode - whitelist mode hides all content except explicitly allowed channels/keywords.
- **Mode-Aware UI Controls**: Added list mode toggles in popup and tab view interfaces for switching between blocklist and whitelist modes.
- **Staging Migration**: Users can temporarily switch to blocklist mode to browse normally and collect channels, then merge blocklist into whitelist when switching back.
- **Profile Storage Extension**: Extended Profiles V4 schema to support `mode`, `whitelistChannels`, and `whitelistKeywords` fields.
- **Mode-Aware Filtering Logic**: Updated render engine and DOM fallback to respect current filtering mode in content visibility decisions.

### Whitelist Mode Technical Improvements

- **Watch Page Protection**: Whitelist mode preserves watch page metadata (actions, channel row, description) to maintain video playback functionality.
- **Search Page Optimization**: Added indeterminate state handling for search results that render before channel identity is available, preventing page blanking.
- **Homepage Duplicate Removal**: Automatic duplicate content removal on homepage in whitelist mode to clean up mixed content feeds.
- **Whitelist-Pending Processing**: Optimized DOM fallback with `onlyWhitelistPending` option for efficient re-evaluation of content awaiting channel identity.
- **Whitelist-Pending Observer Batching**: Batched newly-added pending-card scans out of the MutationObserver callback to reduce synchronous DOM work while YouTube is loading large feeds.
- **Cross-World Mode Sync**: Enhanced channel stamping with `data-filtertube-list-mode` attributes for consistent mode awareness across execution worlds.

## Version 3.2.2

### UI/UX Improvements & Debug Gating

- **Optimistic UI Updates**: Added immediate visual feedback when blocking channels - content hides instantly with automatic restoration if blocking fails, eliminating user uncertainty.
- **Enhanced Mobile Menu Support**: Improved 3-dot menu injection for YouTube mobile (ytm-menu-popup-renderer) with proper renderer tags and scope handling.
- **Debug Gated Logging**: All console logs now gated behind `window.__filtertubeDebug` flag to reduce noise in production while maintaining full debug capabilities.
- **Scroll Preservation**: Enhanced DOM fallback processing to respect user scrolling during filtering operations, preventing jarring scroll position changes.
- **Channel Enrichment Limits**: Added per-session limits (10 enrichments) to prevent excessive background requests and improve performance.
- **Idle-Scheduled Rendering**: Channel list rendering now uses `requestIdleCallback` with batching for smoother UI updates in large lists.

### State Management Refinements

- **External Reload Debouncing**: Storage changes from other tabs now debounced with intelligent signature comparison to prevent unnecessary UI re-renders.
- **Selective Notifications**: External updates only trigger full 'load' events when channel signatures actually change, otherwise use lightweight 'externalUpdate' events.
- **Bridge State Management**: Improved script injection state tracking with globalThis-based shared state for better reliability.

## Version 3.2.1

### Performance Optimizations - Lag-Free Processing

- **Async DOM Processing**: Converted `applyDOMFallback()` to async with main thread yielding every 30-60 elements, preventing browser freezing during heavy filtering operations.
- **Compiled Caching System**: Added `compiledKeywordRegexCache` and `compiledChannelFilterIndexCache` for O(1) lookups, reducing CPU usage by 60-80%.
- **Batched Storage Updates**: Channel map updates now batched with 250ms intervals, reducing storage I/O operations by 70-90%.
- **Debounced Settings Refresh**: Settings updates throttled to prevent excessive DOM reprocessing with 250ms minimum intervals.
- **Run State Management**: Prevents overlapping DOM processing executions and queues subsequent requests.

### Browser Performance Characteristics

- **Chromium-based Browsers (Chrome, Edge, Opera)**: ✅ Excellent performance - lag virtually eliminated (90%+ reduction)
- **Firefox-based Browsers**: ⚠️ Good improvements but less dramatic, needs ongoing optimization work

### Technical Enhancements

- **Channel Map Caching**: Background script now uses in-memory caching with async flush for better performance.
- **Storage Optimization**: Reduced storage listener triggers and improved batching logic.
- **Error Handling**: Enhanced safety checks for non-configurable properties in injector and seed scripts.
- **Debug Control**: Conditional logging based on `window.__filtertubeDebug` flag.

### Documentation Updates

- **ARCHITECTURE.md**: Added performance architecture section with Mermaid diagrams showing async processing, caching, and storage batching flows.
- **TECHNICAL.md**: Comprehensive technical documentation of all performance optimizations with code examples.
- **CONTENT_HIDING_PLAYBOOK.md**: Updated with DOM fallback processing flow and browser-specific performance notes.
- **CODEMAP.md**: Enhanced with performance optimization details for each affected file.
- **NETWORK_REQUEST_PIPELINE.md**: Added performance enhancement context.
- **PROACTIVE_CHANNEL_IDENTITY.md**: Updated with performance optimization benefits.

---

## Version 3.2.0

### Proactive Channel Identity Architecture

- **Zero-delay blocking**: 3-dot menus now show correct channel names instantly—no more "Fetching..." delays—thanks to proactive XHR interception that extracts channel identity before rendering.
- **Network reduction**: Most channel identity comes from intercepted YouTube JSON responses (`/youtubei/v1/next`, `/browse`, `/player`), dramatically reducing the need for separate network fetches.
- **Zero-network Kids mode**: YouTube Kids works entirely without network fetches, relying only on intercepted JSON for reliable blocking.
- **Instant DOM stamping**: Channel info is broadcast across worlds and stamped on DOM cards immediately, enabling instant hiding and menu updates.
- **Post-block enrichment**: Missing metadata (handle, logo, name) is filled in the background at a controlled rate (6-hour cooldown per channel) to avoid spamming YouTube.
- **Topic channel handling**: Special case for auto-generated Topic channels (e.g., "Music - Topic") that don't have @handles or custom URLs.

### Developer Experience

- **New documentation**: Added comprehensive docs for the proactive pipeline, including ASCII and Mermaid flow diagrams, surface-by-surface examples, and extension guides.
- **Developer guide**: Created detailed guide for extending XHR snapshot stashing and renderer extraction.
- **Architecture updates**: Documented cross-world messaging protocol and snapshot stashing architecture.

### Fixes

- **Banner regression**: Fixed missing "What's New" and refresh banners after extension updates—both now show correctly on open YouTube/Kids tabs.
- **Message handlers**: Restored background message handlers for release notes and first-run prompts that were accidentally removed.

### Documentation

- **CHANNEL_BLOCKING_SYSTEM.md**: Updated with proactive XHR interception, data source waterfall, and Topic channel details.
- **PROACTIVE_CHANNEL_IDENTITY.md**: New comprehensive guide explaining the proactive pipeline with ASCII and Mermaid diagrams.
- **DEVELOPER_GUIDE.md**: New guide for extending FilterTube to support new YouTube features.
- **NETWORK_REQUEST_PIPELINE.md**: Refactored to reflect XHR-first proactive strategy.
- **ARCHITECTURE.md**: Updated with cross-world messaging and snapshot stashing details.
- **YOUTUBE_KIDS_INTEGRATION.md**: Updated for zero-network operation.
- **README.md**: Added proactive model overview and links to new documentation.
- **Website**: Updated website for better rediability and listed new features.

---

## Version 3.1.9

### Multi-Profiles, Auto-backup, and PIN Protct

- Auto-backup settings are now profile-aware: mode/format selectors disable when auto-backup is off or the profile is locked, and new profiles inherit auto-backup preferences correctly.
- Auto-backup scheduling triggers on profile creation and mode/format changes only when the active profile has auto-backup enabled, respecting per-profile PIN locks.
- Content-control toggles and auto-backup controls revert and stay disabled when a profile is locked, preventing unauthorized changes.
- Export scope UI enforces “Export active profile only” for non-master profiles; Master can toggle full exports.
- New Tab profile dropdown sits above the lock gate (z-index fix) so it stays clickable even when locked.
- Documentation updated to capture profile/PIN model, profile-scoped backups, and UI gating rules.

---

## Version 3.1.8

### Support + Backups

- Added a new Support page in the dashboard with Ko-fi embed.
- Auto-backups now overwrite a single rolling file: `Downloads/FilterTube Backup/FilterTube-Backup-Latest.json`.
- Auto-backup download URL handling is now cross-browser:
  - Uses Blob URLs when available.
  - Falls back to `data:` URLs in Chrome MV3 service worker contexts where `URL.createObjectURL` is unavailable.

### Fixes

- Fixed auto-backup failures in Chrome caused by `URL.createObjectURL is not a function`.
- Fixed download failures in Firefox caused by `data:` URL download restrictions.

---

## Version 3.1.7

### YouTube Kids & Backup support

- Added complete Channel & Keyword based blocking on YT Kids it block channels by passive listening to 3 dot menu UI in YT Kids content card i.e. "Block this video" and "Block this channel".
- Added a Settings toggle to enable/disable auto backups.
- Auto backups now save into `Downloads/FilterTube Backup/`.
- Manual exports now download into `Downloads/FilterTube Export/`.

### Fixes

- Hardened 3-dot menu channel-name labeling on watch Mix cards so Mix metadata strings don't replace channel names.

---

## Version 3.1.6

### Release Notes Experience

- Added a curated “What’s New” tab in the dashboard fed by `data/release_notes.json`, sharing the same content as the release banner.
- Release banner CTA now routes through the background script and lands inside `tab-view.html?view=whatsnew`, so no chrome-extension:// links are blocked by content blockers.
- Banner + dashboard documentation now lives in `/docs`, including UI/UX guidance on when the CTA appears and which fields drive the cards.

### Import / Export & Data Portability

- Documented the full import/export pipeline (including c/ChannelName normalization, merge rules, and adapters) with ASCII + Mermaid diagrams.
- `js/io_manager.js` centralizes sanitization helpers, making merge vs. replace imports reliable for UC IDs, @handles, and `/c/slug` values.
- Added contextual comments throughout IO helpers so future schema changes remain self-documented.

---

## Version 3.1.5

### Fixes: Shorts + Members-only (Watch/Sidebar)

- Watch-page sidebar now hides Shorts that are rendered as normal compact videos by checking `/shorts/` hrefs, SHORTS overlays, and aria-label hints before cards render.
- Members-only hiding hardened: detects via title aria-labels, badges, and UUMO membership playlists across compact/watch/sidebar/lockup renderers; shelves hide deterministically.
- Members-only toggle now persists correctly (StateManager save/broadcast path and background recompile) so UI selections stick across contexts.

---

## Version 3.1.4

### UI/UX & Responsiveness

- Added mobile-friendly tab view: hamburger nav toggle, overlay, tighter paddings, and responsive grids/inputs for smaller screens.
- Refined filter/search/input rows to wrap gracefully and keep buttons aligned on mobile.
- Tweaked toggle styling (lighter track, crisper borders, centered thumb) for better contrast in light/dark modes.
- Content control cards now use cleaner dividers/hover states and stronger headings while preserving per-group accents.

### Playlist/Mix Controls

- Playlist hiding now excludes Mix/Radio items (start_radio=1) while keeping standard playlists hidden.
- Mix/Radio toggle now also hides the “Mixes” chip in the filter bar when enabled.

### Note

- UI toggle for “Hide Members-only videos” is temporarily hidden; functionality remains wired for future release.

---

## Version 3.1.3

### UI/UX

- Aligned popup and tab search bars to full-width row sizing; added clearer pill/tooling docs in the Help page with accurate Exact/Comment/Filter All behavior and C/E chip samples.
- Popup content controls hide descriptions for a cleaner view; tab content controls now use title-only tooltips (not row-wide) for descriptions.
- Help legend updated to document badge tints (channel/comment/collab) and pill behaviors with matching colors/shapes.

---

## Version 3.1.2

### Watch Page (Playlists)

- Autoplay now skips blocked playlist items by triggering a safe Next-click only when the immediate next playlist row is hidden.
- Watch-page playlist panel rows are sticky-hidden across reprocessing cycles when identity is temporarily unresolved (prevents restored blocked items becoming playable).

### 3-Dot Menu UX

- Closing the YouTube 3-dot dropdown after blocking no longer closes/interrupts an active miniplayer.

---

## Version 3.1.1

### Watch Page (Playlists)

- Watch-page playlist panel rows now hide deterministically for blocked channels (playlist items are enriched via `videoChannelMap`).
- Next/Prev navigation skips blocked playlist items without visible playback flash.

### UI

- Added a Help section in the dashboard (new tab UI) documenting all features/toggles.

### Identity & Robustness

- Improved channel identity convergence (handle/customUrl ↔ UC ID mapping) so blocking is resilient to `/@handle/about` failures.

---

## Version 3.1.0

### Watch Page & Docs

- Documented that watch-page 3-dot menus now mirror Home/Search collaborator behavior and clarified the remaining single-channel label gap plus Shorts coverage (`docs/home_watch_collab_plan.md`, `docs/CHANNEL_BLOCKING_SYSTEM.md`, `docs/youtube_renderer_inventory.md`).
- Captured the outstanding playlist/mix regression (hidden rows reappearing after hard refresh) so it stays visible in watch-page plans.

### Misc

- Version bump to keep manifests, build tooling, and UI footer aligned with the new release.

---

## Version 3.0.9

### Refactor

- **3-dot menu module split**: Moved the dropdown observer/bootstrap logic into `js/content/block_channel.js` (loaded before `content_bridge.js`).

### Cleanup

- **Legacy observer removal**: Removed the old/disabled dropdown observer code from `content_bridge.js` after validating the new `block_channel.js` entry-point.

### Documentation

- Updated docs to reflect the new isolated-world module structure + load order.
- Expanded `docs/youtube_renderer_inventory.md` with additional menu DOM variants used by the 3-dot injection pipeline.

---

## Version 3.0.8

### Channel Blocking Hardening

- **404 Recovery Pipeline**: Added a four-layer strategy (cache-first lookup, ytInitialData replay, Shorts helpers, DOM cache reset) so blocking always resolves a UC ID even when `/@handle/about` fails.

- **DOM Reprocessing**: Cards now re-run the fallback when their `data-filtertube-last-processed-id` changes, preventing stale metadata from skipping new videos.

### Documentation

- Added `docs/handle-404-remediation.md` playbook and updated architecture/tech docs to reflect the new recovery flow.
- Expanded `CONTENT_HIDING_PLAYBOOK.md` and `CHANNEL_BLOCKING_SYSTEM.md` with channel identity guidance for Shorts/home surfaces.

---

## Version 3.0.7

### New Features

- **Posts Support**: Added proper channel extraction for YouTube community posts
  - "Block Channel" menu now works correctly on posts via 3-dot menu
  - Extracts channel info from post author links and thumbnails
- **Collaboration Videos**: Added support for videos with multiple channel collaborators
  - Detects and extracts all collaborating channels from `attributed-channel-name` element
  - Blocks video if ANY collaborator is in your blocked channels list
  - Menu shows "(Collab)" indicator for collaboration videos
  - Blocking a collaboration video blocks ALL collaborators automatically

### Documentation
- Updated `youtube_renderer_inventory.md` with collaboration videos section
- Marked posts as fully covered for menu blocking

## Version 3.0.6
- **Fix**: Fixed the Popup UI width for desktop and updated the website.

## Version 3.0.5

### Bug Fixes
- **Menu Injection**: Fixed issue where "Block Channel" menu item would not appear on first click, requiring 2-3 clicks
  - Added DOM verification before skipping injection to detect when YouTube clears menu items
  - Prevents stale state tracking causing false "already injected" detections
- **Focus Trap**: Fixed scroll functionality after blocking a video via 3-dot menu
  - Implemented 5-strategy dropdown closure (Escape key simulation, focus removal, YouTube close, force hide, simulated click)
  - Page now immediately regains scroll control after blocking without requiring manual click
- **Android Support**: Made popup UI responsive for Firefox for Android
  - Changed fixed width to fluid (100%, max-width: 400px, min-width: 320px)
  - Added `gecko_android` manifest support

## Version 3.0.4 - Shorts Blocking & Layout Fixes (November 2025)
- **Feature**: Enhanced Shorts blocking with immediate visual feedback (no more waiting).
- **Fix**: Resolved "blank space" issue where blocked Shorts left empty gaps in the grid.
- **Fix**: Improved channel extraction for handles with dots (e.g., `@user.name`).
- **Docs**: Added detailed ASCII flowcharts for Shorts blocking architecture.

## Version 3.0.3 - Shorts Menu Fixes & Stability (November 2025)
- **Feature**: Added "Block Channel" option to the 3-dot menu for YouTube Shorts, Posts, and Playlists.
- **Fix**: Resolved "ghost dropdown" issue where the menu remained visible after blocking.
- **Fix**: Fixed "Unable to block" error by implementing async channel fetching for Shorts.
- **Fix**: Silenced error logs for unsupported card types (Mixes/Playlists).
- **UX**: Immediate visual feedback (video hides instantly) when blocking via the menu.

## Version 3.0.0 - Hybrid Architecture & Documentation (November 2025)
- **Architecture**: Formalized the "Hybrid Filtering Architecture" combining Data Interception (Primary) with DOM Fallback (Secondary).
- **Documentation**: Major overhaul of `ARCHITECTURE.md`, `TECHNICAL.md`, and `CODEMAP.md` with detailed ASCII diagrams.
- **Visuals**: Added "Box-and-Line" ASCII diagrams for all major technical flows.
- **Refinement**: Improved code flow descriptions for non-technical accessibility.

## Version 2.0.0 - The "Zero DOM" Data Interception Architecture (December 2024)
- **Core**: Complete rewrite using `ytInitialData` and `fetch` interception.
- **Performance**: "Zero Flash" filtering by modifying data before rendering.
- **UI**: New Tab View interface for advanced filtering.
- **Fixes**: Resolved issues with YouTube Shorts and dynamic navigation.

## Version 1.5.0
- Added basic keyword filtering.
- Implemented channel blocking.

## Version 1.0.0
- Initial release.
