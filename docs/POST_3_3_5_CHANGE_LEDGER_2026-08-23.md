# FilterTube post-v3.3.5 change ledger

**Baseline:** `2fd04d32155dbfd1e36278e4860b7c8cae14da6f` — **Release v3.3.5 YouTube stability fixes**
**Covered history:** every commit in `2fd04d3..0920969b` (28 commits)
**Current checked-out endpoint:** `0920969b` — **chore: checkpoint unreleased extension release train**
**Ledger date:** 2026-08-23
**Purpose:** retain a temporary evidence-oriented source-history cross-check
while the existing canonical documentation is updated. This ledger is not the
replacement for the changelog, functionality, technical, Nanah, app-release,
website, or renderer documents; those topic docs now carry the applicable
contracts directly.

This is a source-history ledger, not a claim that every surface has passed an
installed-browser, Android, iOS, or TV smoke test. Each entry distinguishes the
behavior or documentation changed from the proof that exists. The baseline
commit itself is intentionally excluded; it is the starting point for this
ledger.

## At a glance

The period covered this release train from a small Android artifact-reuse and
Shorts identity fix into a much broader unreleased extension checkpoint:

- release-artifact claims and app-version reuse became explicit;
- collaborator identity recovery expanded to current YouTube Music/camelCase
  surfaces, merged creator aliases, and avatar preservation;
- the website and extension received a calmer, more parent-readable product
  surface, About view, testing CTA, and family-device controls;
- Nanah managed policy delivery was bound to target devices, keyed profiles,
  mailbox targets, and native-runtime decisions;
- the JSON/DOM ledger grew to cover YTM, age verification, LIVE, hashtags,
  chapters, Home shelves, and Playables;
- official category filtering became a bounded, JSON-first feature;
- the unreleased checkpoint added direct-access admission, Self-Control
  Sessions, complete BlockTube migration handling, experimental language and
  original-audio controls, Advert Void playback handling, per-profile time
  enforcement, and the associated UI/help/tests.

The extension remains the runtime source of truth. `FilterTubeApp` consumes a
curated/generated subset through its sync workflow; it is not a second source
for these extension commits.

## Commit inventory

| # | Commit | Date | Change |
| ---: | --- | --- | --- |
| 1 | `4a658584` | 2026-07-05 | Allow explicit MVP Android artifact reuse |
| 2 | `6f7d7b46` | 2026-07-05 | Restore collaborator warmup during identity prefetch |
| 3 | `54c35a22` | 2026-07-06 | Website simplification and internal testing ask |
| 4 | `c0b3584c` | 2026-07-06 | Add website-style About page |
| 5 | `d73bd68c` | 2026-07-06 | Position Android testing CTA above dashboard stats |
| 6 | `9ac63173` | 2026-07-06 | Align dashboard Android testing CTA |
| 7 | `fdd98db8` | 2026-07-11 | Add nearby device sync and simplify family controls |
| 8 | `eb14f105` | 2026-07-11 | Resolve camelCase YTM collaborator rosters |
| 9 | `bd1cd6d4` | 2026-07-11 | Link merged creator channel aliases |
| 10 | `31033f7c` | 2026-07-11 | Preserve collaborator avatars with aliases |
| 11 | `7906a77c` | 2026-07-15 | Add YTM You and channel-page documentation |
| 12 | `3ba76a33` | 2026-07-18 | Document age verification on video |
| 13 | `876d5a4c` | 2026-07-21 | Bind managed policies to target devices |
| 14 | `7953a9fd` | 2026-07-21 | Record native managed policy decisions |
| 15 | `c03ef03c` | 2026-07-21 | Mark native managed runtime synchronized |
| 16 | `762b6580` | 2026-07-21 | Preserve managed mailbox target binding |
| 17 | `d90a92f9` | 2026-07-21 | Record managed decisions for keyed profiles |
| 18 | `3e063a35` | 2026-07-21 | Preserve managed Pickup target binding |
| 19 | `21b71571` | 2026-07-21 | Document mobile LIVE and ended-LIVE contracts |
| 20 | `86c4802e` | 2026-07-21 | Clarify adaptive-quality preference semantics |
| 21 | `a5b78c09` | 2026-07-21 | Document mobile hashtag browse contracts |
| 22 | `5e8a1fbb` | 2026-07-22 | Document native hashtag browse mapping |
| 23 | `9466f9e0` | 2026-07-22 | Document mobile Watch chapter contracts |
| 24 | `77fc9ed4` | 2026-07-25 | Map dismissible Home rich-shelf contract |
| 25 | `9b5168c0` | 2026-07-25 | Add Hide YouTube Playables control |
| 26 | `c550c04e` | 2026-07-25 | Record optional rich-shelf feedback |
| 27 | `0f2f7349` | 2026-08-08 | Improve and document category filtering |
| 28 | `0920969b` | 2026-08-23 | Checkpoint the unreleased extension release train |

## Detailed commit record

### 1. `4a658584` — Allow explicit MVP Android artifact reuse

**What changed:** release tooling now accepts an explicit mobile artifact
version through `--mobile-artifact-version=` / `FILTERTUBE_MOBILE_ARTIFACT_VERSION`.
The normal path still requires an exact version/code match. When no exact match
exists, the interactive path lists available artifacts and asks before reusing
the latest one; an explicit mismatch is warned about rather than silently
renamed.

**Why it matters:** a browser-extension release can deliberately attach an
already-built Android APK/AAB without claiming that a new Android binary was
rebuilt. The release body and audit wording preserve the artifact's actual
version and code (for example, an extension release can reuse the recorded
v3.3.2/code30312 artifact).

**Surfaces:** `build.js`, `README.md`,
`docs/APP_RELEASE_AND_RUNTIME_SYNC_WORKFLOW.md`, and
`docs/audit/FILTERTUBE_RELEASE_BUILD_ARTIFACT_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`.

### 2. `6f7d7b46` — Restore collaborator warmup during identity prefetch

**What changed:** `content_bridge.js` now carries `warmCollaborators: true`
through identity prefetch and runs the collaborator-only warmup before every
early return, including the fast path where channel identity is already cached.
The collaborator-only timeout is bounded at 1.2 seconds; the combined identity
and collaborator path remains bounded at 1.8 seconds.

**Preserved safeguards:** the existing queue/concurrency limits, Mix/radio
false-positive guards, and roster validation remain in force. This restores
menu/roster readiness without turning every card into an unbounded request.

**Surfaces:** `js/content_bridge.js`,
`docs/audit/FILTERTUBE_SHORTS_CHANNEL_IDENTITY_PREFETCH_2026-07-05.md`, and
`docs/youtube_renderer_inventory.md`.

### 3. `54c35a22` — Website simplification and internal testing ask

**What changed:** the public website navigation was rewritten in ordinary
product language (`Start here`, `Controls`, `Apps`, `Downloads`), a Reddit link
was added, and the website copy split everyday setup from technical/project
details. The homepage now explains that desktop extensions are live and that
the Android custom app is seeking internal testers instead of implying public
store availability.

**Surfaces:** `website/app/page.js`,
`website/components/route-content.js`, `site-data.js`, `site-header.js`,
`site-shell-data.js`, and the README badge update.

### 4. `c0b3584c` — Add website-style About page

**What changed:** the extension gained an `About` view and navigation entry,
including the project portrait, maintainer links, work-in-progress material,
and the independent/open-source context. The view is allowed for protected and
child profiles as a safe informational surface. The serene shell received the
large About-page visual treatment.

**Surfaces:** `html/tab-view.html`, `js/tab-view.js`,
`css/serene-shell.css`, and the new `assets/images/devansh-varshney.png`.

### 5. `d73bd68c` — Position Android testing CTA above dashboard stats

**What changed:** the Android closed-testing action moved into a dedicated
dashboard hero action area above the stats card. The action is a first-class
dashboard call-to-action rather than a secondary item below the metrics.

**Surfaces:** `html/tab-view.html` and `css/serene-shell.css`.

### 6. `9ac63173` — Align dashboard Android testing CTA

**What changed:** the CTA and stats surface were aligned for the dashboard's
right column: the action is capped and right-aligned, while the stats surface
stretches consistently beneath it. This is a layout follow-up to the previous
CTA relocation, not a second Android release claim.

**Surface:** `css/serene-shell.css`.

### 7. `fdd98db8` — Nearby device sync and simpler family controls

**What changed:** the Accounts & Sync family surface moved toward a simple
Xender-style device map and added a documented nearby-presence/discovery layer.
The local-network provider supports short-lived presence announce/discover,
pairing invitations, invitation pull, and withdrawal endpoints. Tokens are
hashed and compared in constant time; plaintext secrets are not exposed, and
candidate counts and TTLs are bounded.

`nanah_managed_local_network_client.js` exposes the corresponding nearby
operations and a discovery-only boundary. The provider routes presence and
pairing invitations; it does not itself send policy or create trust. Existing
phrase-verified pairing and signed policy admission remain the authority.

The commit also added family-device capture/evidence tooling, scripts and
runtime tests, and simplified the Family Controls/device-map UI and copy. It
does **not** claim a completed automatic Internet torrent-style sync service,
automatic trust, or policy delivery merely because devices are nearby or on the
same network.

**Surfaces:** `js/nanah_managed_local_network_client.js`,
`scripts/managed-delivery-provider.mjs`, the managed-delivery scripts and
tests, `html/tab-view.html`, `js/tab-view.js`, `css/tab-view.css`,
`css/serene-shell.css`, and the family-device audit/evidence documents under
`docs/audit/`.

### 8. `eb14f105` — Resolve camelCase YTM collaborator rosters

**What changed:** YouTube Music/Search collaborator extraction now recognizes
the newer camelCase DOM/API roster shapes in addition to the earlier renderer
names. The warmup and bridge paths share the same roster sanitation and
bounded enrichment behavior.

**Proof/docs:** the new
`docs/audit/FILTERTUBE_YTM_CAMELCASE_SEARCH_COLLABORATOR_WARMUP_2026-07-11.md`
and `tests/runtime/ytm-camelcase-search-collaborator-warmup-current-behavior.test.mjs`
record the contract. The JSON path encyclopedia and ignored-capture rules were
updated; raw captures remain evidence, not runtime dependencies.

### 9. `bd1cd6d4` — Link merged creator channel aliases

**What changed:** collaborator-derived identities can now retain linked creator
aliases. Identity normalization merges aliases, channel IDs, handles, custom
URLs, display names, and available metadata so block/allow actions target the
creator identity rather than only the currently visible composite label.

The background, content bridge, injector, IO/settings paths, and channel menu
persist and consume the linked alias record. Channel blocking can therefore
offer the best known linked creator identity without treating a weak composite
label as a new channel.

**Proof/docs:** `docs/CHANNEL_BLOCKING_SYSTEM.md`,
`docs/audit/FILTERTUBE_LINKED_CREATOR_CHANNEL_ALIAS_2026-07-11.md`,
`tests/runtime/linked-creator-channel-alias-current-behavior.test.mjs`, and
the JSON path encyclopedia.

### 10. `31033f7c` — Preserve collaborator avatars with aliases

**What changed:** linked alias records now preserve collaborator avatars and
related display metadata through the content bridge, injector, IO layer, and
settings persistence. This prevents an identity merge from losing the avatar
needed by menus, rows, and later alias resolution.

**Proof/docs:** the linked-alias audit and runtime test were extended together
with `content_bridge.js`, `injector.js`, `io_manager.js`, and
`settings_shared.js`.

### 11. `7906a77c` — Add YTM You and channel-page documentation

**What changed:** this documentation-only commit expanded the JSON path
encyclopedia and renderer inventory with YouTube Music's You page, account
switcher, history, playlists, settings, subscriber page, channel page, and
channel tabs (Home, Live, Playlists, Podcasts, Posts, Releases, Search, Shorts,
and Videos). The capture ignore rules were updated so local raw ledgers can be
kept without pretending they are source files.

**Boundary:** these records document observed request/renderer contracts. They
do not make the extension depend on one captured response or claim that every
YTM experiment has one permanent DOM shape.

### 12. `3ba76a33` — Document age verification on video

**What changed:** `docs/json_paths_encyclopedia.md` records the observed
on-video age-verification contract and its response paths, including the
evidence boundaries needed when YouTube changes the gate. This commit is
documentation only; it does not bypass provider verification.

### 13–18. Managed policy target and decision hardening

These six commits form one control-plane hardening sequence. They are listed
separately in history but should be read as one invariant: a nearby/available
transport is never enough to apply a managed policy.

#### `876d5a4c` — Bind managed policies to target devices

Live policy/open-sync payloads, schema/revision artifacts, and the managed
adapter now carry and validate the intended target device. Discovery authority,
app parity, signed-send, apply, encrypted-mailbox, and schema tests were
updated.

#### `7953a9fd` — Record native managed policy decisions

`nanah_sync_adapter.js` records the native managed policy application decision,
and the apply test verifies the decision rather than treating a transport
response as proof of acceptance.

#### `c03ef03c` — Mark native managed runtime synchronized

The native managed runtime's synchronized state is recorded and reflected in
the managed app-policy parity artifacts and local-network parent-controls
documentation. Signing and apply tests were updated around that state.

#### `762b6580` — Preserve managed mailbox target binding

Encrypted mailbox delivery retains the target-device binding through the
mailbox client and transport tests. A mailbox receipt cannot be replayed for a
different target merely because the payload is otherwise valid.

#### `d90a92f9` — Record managed decisions for keyed profiles

Managed decisions are retained for the keyed profile they concern. Apply
validation and tests now distinguish a decision for one protected/profile key
from a generic device-level success.

#### `3e063a35` — Preserve managed Pickup target binding

Provider Pickup keeps the intended target-device binding, and the provider
reference test verifies that a pending update cannot be collected as an
unbound or different-device update.

**Shared surfaces:** `js/nanah_managed_live_policy.js`,
`js/nanah_managed_open_sync.js`, `js/nanah_sync_adapter.js`,
`js/nanah_managed_mailbox_client.js`, `scripts/managed-delivery-provider.mjs`,
managed policy schema/parity docs and artifacts, and the focused
`tests/runtime/managed-*` suites.

**Authority boundary:** these changes harden signed, target-bound policy
delivery. They do not turn LAN presence, a provider, or a mailbox into parent
authority, and they do not claim that Internet Pickup is hosted for every user.

### 19–24. Mobile API and renderer contract ledger

These commits extend the evidence ledger rather than adding a new filtering
algorithm:

- **`21b71571` — LIVE and ended-LIVE:** records mobile browse/watch/player
  contracts, live status and ended-live renderer mappings in both
  `docs/json_paths_encyclopedia.md` and `docs/youtube_renderer_inventory.md`.
- **`86c4802e` — adaptive quality:** clarifies that a quality preference is a
  user preference, while the effective stream quality is still selected by
  YouTube and device/network conditions; the two must not be documented as the
  same value.
- **`a5b78c09` — mobile hashtag browse:** documents the mobile hashtag browse
  request/response and renderer contracts.
- **`5e8a1fbb` — native hashtag mapping:** maps those hashtag contracts to the
  native-owned renderer/surface names used by the app documentation.
- **`9466f9e0` — Watch chapters:** documents mobile Watch chapter data and
  chapter-rendering contracts.
- **`77fc9ed4` — dismissible Home rich shelf:** records the Home rich-shelf
  renderer, dismiss action, and the fact that dismissal is an optional shelf
  feedback path rather than a general video-category decision.

All six are documentation-only changes to the JSON encyclopedia and renderer
inventory. They preserve the rule that a raw capture can name its source file,
but concatenated request/response/DOM ledgers are not necessarily one valid JSON
document.

### 25. `9b5168c0` — Add Hide YouTube Playables control

**What changed:** a dedicated content-control setting was added for YouTube
Playables. The setting is carried through the catalog, state/background/IO
settings, bridge, and DOM fallback, and it is exposed in the extension UI.
The fallback removes the Playables surface without treating every game-looking
thumbnail, advert, or unrelated video as a Playable.

**Proof/docs:**
`docs/audit/FILTERTUBE_HIDE_YOUTUBE_PLAYABLES_CONTROL_2026-07-25.md` and
`tests/runtime/hide-playables-control-current-behavior.test.mjs`.

### 26. `c550c04e` — Record optional rich-shelf feedback

**What changed:** the JSON encyclopedia and renderer inventory record optional
rich-shelf feedback fields associated with the Home shelf contract. The entry
keeps feedback/dismissal metadata separate from a video card's category or
blocking identity.

### 27. `0f2f7349` — Improve and document category filtering

This is the category-filter foundation that later checkpoint work relies on.

**Classification authority:** FilterTube uses YouTube's official
`microformat.playerMicroformatRenderer.category`, normalizes it once, and
preserves the result in `videoMetaMap`. It does not use title/author guesses as
the primary authority. The same loaded Player response can also provide
duration/date/description/owner needs.

**Request path and budget:** the page/main-world bridge uses same-origin
`POST /youtubei/v1/player`; it does not fetch redirected `/watch` HTML for
category hydration. Visible/nearby cards are scheduled by priority, deduplicated
per video, cached, paced after scroll idle, limited to three active requests,
joined briefly when a request is already in flight, and protected by a hard
24-start rolling-minute budget plus negative caching.

**User intent:** Category Filters have their own `Block selected` and
`Allow only selected` mode, independent of the profile's keyword/channel
Blocklist or Whitelist mode. The full Content Controls card sits below Core;
the popup exposes the same switch, mode, selected summary, clear action,
searchable chips, and a link to full controls. Selected chips expose checked and
accessible pressed state.

**Feed/Watch behavior:** allow-only cards receive a synchronous pending veil so
newly appended disallowed content does not flash. The Watch root gate is
installed before the initial fallback delay. Resolved blocked cards collapse;
unavailable metadata does not create a permanent “filtered by category” or
“category unavailable” sentinel.

**Ownership boundaries:** Mix seed lockups can provide seed identity/category,
but the seed category is not copied onto every queue row. Nested lockup hosts are
canonicalized to one visual card. Playlist/Mix queue rows and comments reject
category ownership. CamelCase comment hosts and merged metadata preserve the
collaborator and comment fixes.

**Proof/docs:**
`docs/CATEGORY_FILTER_CURRENT_BEHAVIOR_2026-08-08.md`, updates to
`docs/FUNCTIONALITY.md`, `docs/json_paths_encyclopedia.md`, and
`docs/youtube_renderer_inventory.md`; tests include
`category-filter-user-intent-current-behavior.test.mjs`,
`video-meta-category-preservation.test.mjs`, and updates to the filter-engine
and network-reason tests.

### 28. `0920969b` — Checkpoint the unreleased extension release train

This commit is the current source endpoint. It consolidates the following
implemented or documented next-release surfaces. “Implemented” here means the
source and focused tests exist; installed-browser/native-store proof remains a
separate gate.

Git records this checkpoint as 61 changed files, including 10,019 insertions
and 937 deletions. That size is why the feature families below are listed
explicitly instead of being summarized as a generic “UI update”.

#### Direct access, timers, and controlled playback

- Direct YouTube Watch, Shorts, playlist/autoplay, channel-page, and matching
  `youtube.com/embed/` / `youtube-nocookie.com/embed/` entry paths use an early
  admission guard. Ordinary Google/Bing result pages remain visible; the gate
  applies when navigation reaches YouTube. A blocked playlist item stays paused
  and advances to the next allowed item when one exists.
- A direct Watch check reuses the current loaded Player response and rendered
  description before making another Player request. Block-selected mode applies
  known title/channel text immediately and resolves missing description text in
  the background; allow-only mode remains fail-closed.
- Self-Control Sessions let any active profile make a voluntary, explicit
  commitment for a preset or custom duration (1 minute–7 days). The session
  snapshots and pins the active profile, enables its current policy, blocks
  profile switching and FilterTube-owned rule/mode/import/settings mutations,
  survives browser restart, and has no in-extension early cancel. Background
  storage restoration is authoritative over stale popup/dashboard/import/sync
  writes. The browser-owner limitation (disable/uninstall/clear extension data)
  is documented honestly.
- Daily YouTube time is evaluated per active profile, including account/master
  profiles, with playback-aware accounting and visible remaining time. An
  exhausted profile receives the full-page serene timeout surface; a different
  profile may be selected only through the normal PIN path. Daily allowance and
  Self-Control Session are separate mechanisms.

#### Rule editing and import safety

- Main and Kids expose independent `Blocked rules` and `Allowed rules`
  collections in the full tab. Viewing a collection does not switch the active
  top-level Blocklist/Whitelist mode. Empty-list mode bootstrap copies rules
  without deleting the source collection; individual rows can be moved while
  retaining metadata.
- The popup stays focused on the active global mode and does not expose advanced
  exception-list editing. Main and Kids collections remain independent.
- BlockTube/FilterTube imports now use a transaction: storage/profile/identity
  failures return the real error and roll back the snapshot. Successful imports
  read back the target profile and report counts for added, duplicate, skipped,
  channel, keyword/comment, regex, and video-ID entries. Browser manifests add
  reviewed local `unlimitedStorage` capacity, but imports do not fan out one
  network request per channel and imported JavaScript is never executed.

#### Advert Void

- Advert handling is independently configurable and enabled by default for new
  installs plus existing profiles through a one-time migration. It applies in
  both Blocklist and Whitelist modes and on Main and Kids.
- Before playback, observed Player responses are sanitized for `playerAds`,
  `adPlacements`, `adSlots`, and `adBreakHeartbeatParams` without creating extra
  YouTube requests. If an advert escapes, a guarded Main-world player fallback
  quarantines advert audio/frame state, keeps the requested content under
  normal player ownership when a separate content element is available, and
  uses YouTube's Skip control or a confirmed advert-only fallback when safe.
- Pre-roll, mid-roll, and post-roll interruptions get numbered diagnostic
  sessions. Advert cleanup and requested-content readiness are timed separately;
  inline previews and recommendation players are excluded. Transition-only
  diagnostics use `[FilterTube][Advert Void]` and retain the latest 100 entries
  in `window.__filtertubeAdVoidLog`.

#### Language and audio controls

- The Main spoken-language filter is explicitly **Experimental**, placed below
  stable Content Controls, and uses the same bounded Player response request as
  category/description hydration. It prefers default, non-auto-dubbed audio
  evidence, then linked caption/audio evidence, then strong writing-system
  evidence; unavailable/ambiguous language remains visible rather than blanking
  a feed or Watch rail. It ignores translation-language choices and interface
  locale. No Kids language picker is exposed because inspected `WEB_KIDS`
  responses do not provide a defensible original/default spoken-language field.
- **Always Use Original Audio (Experimental)** is a playback preference, not a
  language filter. It reuses the loaded Player response and YouTube's own
  `getAvailableAudioTracks()`, `getAudioTrack()`, and `setAudioTrack()` methods;
  it makes no extra metadata request and leaves playback untouched when proof is
  ambiguous. Kids is excluded until an equivalent contract exists.

#### UI, help, feedback, and release surfaces

- The parent-friendly guidance spec turns Reddit feedback, rule exceptions,
  maintained-list imports, BlockTube migration, and Firefox mobile Shorts into
  explicit product rules. Help coverage is version-neutral and explains exact
  matching, Blocked/Allowed collection views, time controls, import limits, and
  direct-access boundaries.
- Popup/tab-view/dashboard styles, responsive controls, keyboard/touch states,
  serene timeout artwork, profile/time summaries, language/category chips,
  About/help copy, and release prompts were updated. `App_Store_transparent.png`
  and website Android/iOS artwork were added to the release surfaces.
- At the checkpoint date, the website downloads/home routes described Android
  Play closed testing, iOS/iPad TestFlight status, and the difference between the
  feature-rich custom app and the simpler direct APK. These website files were
  committed in this checkpoint; the additional website edits below are not.

**Primary source areas:** `background.js`, `content_bridge.js`, `injector.js`,
`seed.js`, `filter_logic.js`, `dom_fallback.js`, `io_manager.js`,
`state_manager.js`, `settings_shared.js`, `tab-view.js`, `popup.js`, the
extension-shell popup, manifests, `CHANGELOG.md`, the dated docs above, and the
focused runtime tests added in this commit.

**Focused test inventory:** the checkpoint adds or updates
`ad-void-player-suppression-current-behavior.test.mjs`,
`blocktube-import-transaction-current-behavior.test.mjs`,
`direct-access-admission-current-behavior.test.mjs`,
`managed-device-picker-delivery-current-behavior.test.mjs`,
`original-audio-preference-current-behavior.test.mjs`,
`player-language-filter-current-behavior.test.mjs`,
`post-335-help-coverage-current-behavior.test.mjs`,
`self-control-session-current-behavior.test.mjs`,
`user-feedback-rule-exceptions-migration-shorts.test.mjs`,
`filter-engine-current-behavior.test.mjs`,
`managed-time-budget-enforcement-current-behavior.test.mjs`, and
`managed-trust-revocation-cleanup-current-behavior.test.mjs`. The release lane
configuration was also updated so changed-source validation can select the
appropriate focused lanes.

## Current local changes after `0920969b` (not committed)

At ledger creation, `git status --short` reports only these five files:

```text
 M website/app/globals.css
 M website/app/page.js
 M website/components/browser-logo-rail.js
 M website/components/route-content.js
 M website/components/scenic-detail-page.js
```

These edits are intentionally not attributed to `0920969b` or any released
version:

- **Hero copy and readability:** the homepage hero now says “Calmer, ad-free
  viewing / Your feed, your rules”, uses a translucent readable support panel,
  and states the practical controls (channels, keywords, Shorts, comments,
  categories, languages, and more). At the checkpoint date, the glass status
  line reported desktop availability, Android closed testing, and iPhone/iPad
  TestFlight finalization.
- **Android/iOS browser rail:** the browser-logo rail is four columns at wide
  widths instead of squeezing eight tiles into one row, adds internal Android
  and iOS route tiles, and keeps internal links in the same tab while external
  browser links open normally.
- **Opaque themed app cards:** Android and iOS release cards use explicit light
  green/blue gradients and matching dark surfaces, borders, and readable dark
  action buttons. This prevents the scenic page background from washing through
  the cards in either theme.
- **Mobile app preview:** the `/mobile` route receives an embedded privacy-mode
  YouTube preview for `SHvSICSMHL4` with an external “Open video on YouTube”
  fallback. `scenic-detail-page.js` renders the preview section only when the
  route data supplies it.

These edits were locally checked with the website production build and
`git diff --check` before this ledger was written. They remain uncommitted and
must be reviewed/committed separately.

## Cross-cutting documentation map

### Store-status update (2026-08-24)

Google Play approved and activated FilterTube 3.3.6 open testing for unlimited
testers in 177 countries and regions. The extension dashboard, its one-time
Android invitation, and the website home, mobile, Android, and downloads
surfaces now link directly to
`https://play.google.com/apps/testing/com.filtertube.app`. No email invitation
is required. The normal Play listing remains secondary because it may report
Not Found before a user enrolls or while rollout state propagates.

Use the following documents for behavior details rather than treating this
ledger as a replacement for their contracts:

- [Category filter current behavior](CATEGORY_FILTER_CURRENT_BEHAVIOR_2026-08-08.md)
- [Language filter current behavior](LANGUAGE_FILTER_CURRENT_BEHAVIOR_2026-08-18.md)
- [Original audio preference](ORIGINAL_AUDIO_PREFERENCE_2026-08-18.md)
- [Self-Control Session specification](SELF_CONTROL_SESSION_SPEC_2026-08-17.md)
- [Self-Control implementation proof](audit/SELF_CONTROL_SESSION_IMPLEMENTATION_PROOF_2026-08-17.md)
- [Parent-friendly guidance and rule exceptions](USER_FEEDBACK_RULES_AND_GUIDANCE_SPEC_2026-08-08.md)
- [Nanah user guide](NANAH_USER_GUIDE.md) and [Nanah project plan](NANAH_P2P_PROJECT_PLAN.md)
- [Subscribed channel import](SUBSCRIBED_CHANNELS_IMPORT.md)
- [Hide YouTube Playables audit](audit/FILTERTUBE_HIDE_YOUTUBE_PLAYABLES_CONTROL_2026-07-25.md)
- [Current worktree checkpoint](WORKTREE_CHECKPOINT_2026-08-23.md)
- [JSON path encyclopedia](json_paths_encyclopedia.md) and [renderer inventory](youtube_renderer_inventory.md)

## Verification boundary

The commits add focused runtime tests and source/audit records, but the
following are separate release gates and should not be inferred from this
ledger:

1. installed Chrome/Firefox/Edge/Opera behavior on real YouTube Main, YTM, and
   YouTube Kids pages;
2. first-, mid-, and post-roll Advert Void behavior across normal playback,
   LIVE, Mix/autoplay, and SPA transitions;
3. direct-access and time-limit behavior after browser restart and across
   profile switches;
4. physical Android, iOS, and Android TV builds and provider login/parent
   verification;
5. Google Play open-test real-device feedback and Apple TestFlight availability; and
6. production website DNS/deployment status after the current local website
   edits are reviewed and committed.

The honest release statement is therefore: the source contracts, implementation
paths, focused tests, and documentation are present through `0920969b`; live
browser/device/store proof still has to be recorded in its own validation
documents.
