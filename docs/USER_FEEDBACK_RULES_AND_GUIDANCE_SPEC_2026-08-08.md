# Parent-Friendly Guidance, Rule Exceptions, Shared Lists, and Mobile Shorts Reliability

Date: 2026-08-08

Status: implementation baseline completed on 2026-08-09 for extension rule exceptions, safe complete-field BlockTube migration, the existing reviewed URL-list workflow, and source-level direct-Short admission; physical Firefox-for-Android proof and the larger isolated remote-list store remain release gates

Target: FilterTube extension first, followed by the shared runtime/native clients where the same profile contract applies

## 1. Why this spec exists

This specification converts four user reports into one coherent improvement program:

1. Parents and everyday users need a short, plain-language guide. The dashboard and website currently expose too much product behavior in developer-oriented language.
2. A user in Blocklist mode needs explicit exceptions for favorite channels, videos, and useful words without switching the whole profile to Whitelist mode.
3. Users want to subscribe to maintained channel filter lists instead of adding thousands of channels by hand.
4. A blacklisted Shorts creator can still play on Firefox for Android at a direct `m.youtube.com/shorts/VIDEO_ID` route.

Source reports:

- [Reddit: Some feedback](https://www.reddit.com/r/FilterTube/comments/1uhtqo7/some_feedback/)
- [Reddit: How do I create a whitelist when I am using blocklist mode?](https://www.reddit.com/r/FilterTube/comments/1varmzf/how_do_i_create_a_whitelist_when_im_using/)
- [GitHub issue #62: subscribe to or import channel filter lists](https://github.com/varshneydevansh/FilterTube/issues/62)
- [GitHub issue #65: blacklisted channel still appears on Firefox mobile](https://github.com/varshneydevansh/FilterTube/issues/65)

The unifying product principle is:

> Let people state a simple outcome: block this, always allow that, and tell me in ordinary language which rule won.

### Current status by report

| User need | Status on 2026-08-09 | Boundary |
| --- | --- | --- |
| Parent-friendly Quick Start and everyday/technical website split | Addressed | Preserve the shipped plain-language path and keep technical documentation secondary for ordinary setup. |
| Plain-language `Exact` explanation | Addressed | Preserve the current inline/help-bubble explanation and its `poop`/`poops`/`pooping` behavior. |
| Exceptions while Block selected remains active | Implemented and source-tested | The full Main and Kids pages expose separate `Blocked rules` / `Allowed rules` views, counts, per-entry status badges, and individual move actions. The selector only changes which saved list is shown; it does not change the active mode. Kids collections are independent from Main. The popup follows the global mode for quick additions. Block and allow arrays remain active and mode changes do not move or erase them. Video rule storage and precedence are active, while a dedicated ordinary-user video-list editor remains follow-up UI. |
| Import or subscribe to maintained channel lists | Addressed baseline | Reviewed CSV/TXT/simple JSON/URL imports and URL-backed parent-approved lists already retain source URL, hash, checked time, pause/resume/remove state, and replace changed list-derived rows without deleting manual rules. An isolated high-scale store and conditional HTTP remain future hardening. |
| Complete BlockTube backup migration | Implemented with transactional large-import coverage | Every known BlockTube `filterData`, `options`, `uiTheme`, and `uiPass` field receives a translated, inactive, unsupported, invalid, or unknown outcome; raw regex is validated, JavaScript is quarantined, and the report is downloadable before apply. Storage failures roll back, successful rules are read back from the target profile, and the UI reports an apply receipt instead of unconditional success. |
| YouTube direct-access enforcement | Implemented; installed-browser proof pending | Direct Watch, Shorts, playlist/autoplay, channel-page, `/embed/`, and `youtube-nocookie.com/embed/` entry paths use an early playback admission guard. A blocked current playlist/autoplay item advances to the next allowed item when one is available. One active-video metadata lookup is reused when identity/text is unresolved; ordinary Google/Bing result pages remain out of scope. Firefox-for-Android and cross-site embed evidence remain release gates. |

### Implementation snapshot (2026-08-09)

- `js/filter_logic.js` and `js/content/dom_fallback.js` apply the same specificity order: video, channel, keyword; allow wins an equal-specificity tie.
- `js/background.js`, `js/settings_shared.js`, and `js/state_manager.js` compile and preserve both rule sets, including blocked and allowed video IDs.
- `js/tab-view.js` changes policy without destructive copying and owns advanced channel/keyword exception editing, including managed-child edits. `js/popup.js` follows the active global mode and deliberately omits advanced rule-target selection.
- `js/io_manager.js` performs reviewed BlockTube migration and returns a migration report; imported JavaScript is never executed and a BlockTube UI password is never treated as a FilterTube PIN.
- `js/content/dom_fallback.js` recognizes direct Watch, Shorts, channel-page, and embed routes. It checks an explicit video ID before owner DOM exists, reuses cached/structured player metadata, and holds only the active player while identity or text is unresolved.
- Direct-access boundaries are deliberately narrow: external search-result links remain visible; the rule gate starts after navigation reaches YouTube. YouTube embeds are guarded inside matching `youtube.com/embed/` and `youtube-nocookie.com/embed/` frames. Removing links from external pages is a separate opt-in feature requiring additional site access and is not implied by direct-access blocking.
- When a blocked video is the selected item in a playlist or autoplay queue, FilterTube keeps it paused and selects the next allowed item when possible. If no allowed successor exists, the blocked state remains instead of resuming the video.
- Keyword decisions search title, available renderer description snippets, supplied player `videoDetails.shortDescription`, and `videoDetails.keywords`. Full player text is kept in the page session and reused; it does not create a description-only per-card request path or expand persistent metadata storage.
- `html/tab-view.html` documents the plain-language policy and exception workflow in Help.

Verification completed in this worktree:

- JavaScript syntax checks passed for every edited runtime/UI module.
- 77 focused rule-engine, description-metadata, migration, mode-preservation, popup-layout, Shorts, direct-access, and managed-time source-contract tests passed.
- Chrome and Firefox v3.3.5 packages built successfully.

Not yet claimed: a real Firefox-for-Android run of issue #65, native-client parity, or the optional IndexedDB/conditional-request subscription architecture described as future hardening below.

## 2. Current behavior that must be preserved

This proposal builds on current behavior rather than replacing it.

- Profiles have a global `blocklist` or `whitelist` mode for Main and Kids.
- Main profile storage and compiled settings already keep separate channel and keyword arrays for blocked and whitelisted entries, although ordinary decisions use the rule set selected by the active global mode.
- Category Filters have their own independent `Block selected` or `Allow only selected` policy. They must remain independent of the profile's channel/keyword mode.
- Keyword `Exact` is already implemented as a Unicode-aware whole-word boundary:
  - Exact on: `poop` matches the standalone word `poop`, not `poops` or `pooping`.
  - Exact off: `poop` is a substring and can match `poop`, `poops`, and `pooping` when YouTube exposes that text.
- The dashboard already supports hover, focus, and long-press help bubbles. The gap is discoverability and plain wording, not the complete absence of a help mechanism.
- FilterTube already learns `videoId -> channelId` mappings and has JSON, DOM, cache, and bounded Watch/Shorts identity resolvers.
- `*://*.youtube.com/*` covers both `www.youtube.com` and `m.youtube.com` in the browser manifests.
- Imported YouTube subscriptions already populate `main.whitelistChannels` without requiring a mode switch.

These facts matter because the requested work does not need a second filtering engine, an external YouTube API key, or one network request per list entry.

## 3. Goals and non-goals

### Goals

- Preserve the addressed five-minute parent setup path and keep it covered by regression checks.
- Preserve the addressed inline `Exact` explanation and its actual matching semantics.
- Allow explicit exceptions while Blocklist mode remains active.
- Preserve both block and allow rules when the user changes modes.
- Migrate complete BlockTube backups without silently losing fields or executing imported JavaScript.
- Import once or subscribe to remotely maintained channel lists with visible provenance and safe updates.
- Ensure a known blocked Shorts creator cannot begin or continue playback on the Firefox mobile direct-Short route.
- Preserve performance, privacy, profiles, PIN/managed-policy authority, collaborator handling, and existing category behavior.
- Provide a deterministic “Why was this hidden/allowed?” explanation for support and debugging.

### Non-goals for the first release

- Remote JavaScript, remote regular expressions, or remotely supplied CSS.
- Executing arbitrary ad-block syntax.
- A central FilterTube account or cloud service.
- Uploading browsing history or observed videos to a list maintainer.
- Silently trusting every public list URL.
- Automatically resolving every imported handle with a YouTube request.
- Replacing Category Filters, Kids controls, time limits, or managed-parent policy with exceptions.
- Claiming issue #65 is fixed before Firefox for Android has been tested on the reported direct URL.

## 4. Product model: policy, rules, and sources

The UI should stop presenting Blocklist and Whitelist as if only one kind of rule can exist at a time.

The profile still has a default policy:

- **Block selected**: show content unless a block rule matches.
- **Allow only selected**: hide content unless an allow rule matches.

Both policies may store both block and allow rules:

- In **Block selected**, allow rules are exceptions.
- In **Allow only selected**, block rules are exclusions from the otherwise allowed set.

The rule source is separate from the decision:

- `manual`: created by the user.
- `youtube_subscriptions`: imported from the signed-in YouTube account.
- `file_import`: imported once from a local file.
- `remote_subscription`: maintained by a URL and updated separately.
- `managed_parent`: delivered through a protected/managed profile flow.

This separation prevents remote-list entries from being mixed destructively into the user's own rules.

## 5. Deterministic precedence

Rules are evaluated by authority first. Within one authority layer, target specificity is `video > channel > keyword`, and an allow rule wins a tie at the same specificity.

1. Managed-parent restrictions and locked profile policy.
2. Explicit Core controls such as `Hide Shorts`, `Hide Homepage Feed`, and `Hide All Comments`.
3. Manual and one-time-import rules, ordered by video, channel, then keyword specificity.
4. Category, duration, upload-date, uppercase, and other content-filter policy.
5. Remote subscribed-list rules, ordered by target specificity.
6. Profile default policy.

Examples:

| Rules | Result | Reason |
| --- | --- | --- |
| Block keyword `poop`; allow channel `Science Class` | Allow videos from `Science Class` | A channel exception is more specific than a keyword block. |
| Allow channel `Favorite Music`; block one video ID | Block that video | A video rule is more specific than a channel rule. |
| Remote list blocks a channel; user manually allows it | Allow | Manual rule outranks remote subscription. |
| Allow keyword `math`; block channel `Spam Math` | Block the channel | Channel rule is more specific. |
| Hide Shorts is on; a Shorts channel is allowed | Hide | A Core content control is not bypassed by a channel exception. |
| Parent-managed policy blocks a channel; child profile allows it | Block | Managed authority wins. |

The long-term decision contract should return a structured explanation, not only a boolean. The current baseline implements deterministic decisions; persistent decision receipts remain diagnostics follow-up:

```javascript
{
  decision: "allow",
  reason: "manual_channel_exception",
  matchedRuleId: "rule_...",
  matchedSourceId: null,
  target: { type: "channel", id: "UC..." }
}
```

## 6. Feature A: plain-language Quick Start and contextual help

Status: addressed baseline; retain these requirements as regression and release-copy contracts rather than unimplemented work.

### 6.1 Dashboard Help structure

The Help page should open with an everyday-user section before technical material:

1. **Choose how FilterTube should work**
   - Block selected: “YouTube works normally, except for things you block.”
   - Allow only selected: “Only the channels and topics you approve can appear.”
2. **Add a channel**
3. **Add a keyword**
4. **Add an exception**
5. **Test it on YouTube**
6. **What to do if something is hidden by mistake**

Technical architecture belongs in a collapsed `For developers and advanced users` section or a separate documentation route.

### 6.2 Required `Exact` copy

Do not rely only on hover. Show one short line beside or below the keyword controls:

> Exact on matches the word by itself. For example, `poop` matches `poop`, but not `poops` or `pooping`. Exact off also matches those longer words.

The help bubble may personalize the example with the entered word, as the current renderer already does.

### 6.3 Website information architecture

The website should have two obvious paths:

- **I want to set up FilterTube**: plain-language guide, screenshots, common family setups, troubleshooting.
- **I want technical details**: architecture, source, privacy implementation, API/renderer documents, contributor guide.

The landing page should describe outcomes before implementation details. Developer transparency remains available without becoming the first-run manual.

### 6.4 Accessibility acceptance

- All explanations work with mouse, keyboard, touch, and screen reader.
- The meaning of a toggle is present in accessible text and does not depend on color.
- Help examples remain readable at 200% zoom and in the popup width.
- The `Exact` state uses `aria-pressed` and announces the effect of its current state.

## 7. Feature B: exceptions without changing the global mode

Status: channel and keyword target selection, non-destructive policy switching, dual-set compilation, and video-level runtime precedence are implemented. Dedicated dashboard/three-dot video exception controls and persistent decision receipts remain follow-up UI/diagnostics work.

### 7.1 User experience

Channel and keyword management now has a list target selector:

- `Blocked`
- `Always allowed`

Video actions should offer:

- `Block this video`
- `Always allow this video`

In Block selected mode, the dashboard summary should read, for example:

> Blocking 12 channels and 8 keywords · 3 exceptions

The three-dot/Quick Block UI should show the effective state and permit `Always allow channel` when a rule or keyword has hidden a favorite channel.

### 7.2 Storage contract

Extend the canonical V4 profile shape without removing the existing aliases:

```javascript
main: {
  mode: "blocklist",
  channels: [],
  keywords: [],
  whitelistChannels: [],
  whitelistKeywords: [],
  blockedVideoIds: [],
  allowedVideoIds: []
}
```

`channels`/`keywords` remain block rules for compatibility. `whitelistChannels`/`whitelistKeywords` become active allow rules in both modes rather than dormant storage used only in Whitelist mode.

Every newly written rule should also carry stable metadata where the existing sanitizer permits it:

```javascript
{
  ruleId: "rule_uuid",
  action: "allow",
  source: "manual",
  sourceId: null,
  addedAt: 1786200000000
}
```

### 7.3 Mode-switch migration

The current mode-switch behavior that copies one list into the other and clears a scope must not be used by the new UI.

Migration requirements:

- Read existing V4/V3 fields exactly as today.
- Preserve the user's block and allow arrays.
- Changing the default mode changes policy only; it does not move or delete rules.
- Perform a one-time backup before the first non-destructive mode migration.
- Keep legacy export/import aliases until extension and native clients share the new schema.

### 7.4 Empty-policy behavior

- Block selected + no block rules: ordinary YouTube visibility.
- Allow only selected + no allow rules: show a clear protected empty state, not an unexplained blank/shimmer page.
- Turning the master FilterTube switch off restores content regardless of local rule mode, subject to any separate managed-client authority.

## 8. Feature C: imported and subscribed filter lists

Status: one-time file/URL import and the existing URL-backed parent-approved list workflow are implemented with preview, provenance, content hash, checked time, pause/resume/remove, stale checks, and changed-source replacement. Sections 8.2-8.5 also define the future high-scale isolated-store architecture; those requirements must not be presented as shipped yet.

### 8.1 Two distinct actions

- **Import once**: parse a file or URL snapshot and create local rules with import provenance. The source is not contacted again.
- **Subscribe**: retain a source record and periodically update its isolated last-known-good snapshot.

The UI must not use “import” and “subscribe” interchangeably.

### 8.2 Safe V1 list scope

V1 remote subscriptions support channel rules only:

- UC channel IDs, preferred;
- YouTube handles;
- full YouTube channel URLs that normalize to either of the above;
- optional display name and note.

V1 does not accept remote regex, scripts, CSS, wildcard URLs, content-control toggles, PIN/profile settings, or managed-device commands.

### 8.3 Canonical subscription record

```javascript
{
  sourceId: "source_uuid",
  name: "AI-generated channel list",
  url: "https://example.org/filtertube-list.json",
  enabled: true,
  action: "block",
  profileScope: "main",
  format: "filtertube-channel-list-v1",
  updatePolicy: "daily",
  etag: "...",
  lastModified: "...",
  lastCheckedAt: 1786200000000,
  lastSuccessfulAt: 1786200000000,
  contentHash: "sha256:...",
  itemCount: 12000,
  lastError: null
}
```

Rules from this source remain in an isolated IndexedDB/source snapshot or another storage designed for large lists. They are not appended to `main.channels` one by one.

### 8.4 Update safety and privacy

- HTTPS by default; localhost development may be explicitly opted into.
- Conditional requests with `ETag`/`If-Modified-Since`.
- No more than one automatic check per source per 24 hours unless the user presses `Check now`.
- Apply size, row-count, parse-time, redirect-count, and timeout limits.
- Parse as inert data only.
- Validate the complete candidate snapshot before replacing the last-known-good snapshot.
- On failure, retain the last-known-good list and show the error.
- Preview first import: added, removed, invalid, duplicate, and total rows.
- Show source URL, last update, item count, and enabled state in the dashboard.
- Never send observed YouTube history, current page, profile rules, or exceptions to the list server.

### 8.5 Identity and performance

- Compile remote entries into a UC-ID/normalized-handle index.
- Do not issue one YouTube request per imported row.
- Join against identity already present in renderer JSON, `videoChannelMap`, `channelMap`, or DOM.
- Use existing bounded identity resolution only for a visible unresolved video, with pending-request deduplication and caches.
- A manual allow exception must be checked before the remote block index.

### 8.6 Interoperability

Provide a documented native format and conservative adapters:

```json
{
  "schema": "filtertube-channel-list",
  "version": 1,
  "name": "Example list",
  "updatedAt": "2026-08-08T00:00:00Z",
  "action": "block",
  "channels": [
    { "id": "UCxxxxxxxxxxxxxxxxxxxxxx", "handle": "@example", "note": "optional" }
  ]
}
```

Plaintext/CSV adapters may accept one channel identifier per row. The AiSList project is a motivating source, not an implicit trust anchor or a format contract; its repository and governance can change independently of FilterTube.

### 8.7 Complete BlockTube backup migration compatibility

This is separate from remote filter-list subscriptions. A BlockTube backup is a user-selected local migration artifact containing rules and extension options, not a remotely maintained source.

The current FilterTube adapter is partial. It reads:

- `filterData.channelId` as channel rules;
- `filterData.channelName` as name-based channel rules;
- `filterData.title` as keyword rules;
- `filterData.videoId` into the profile video-ID list.

The complete migration contract is based on the official [BlockTube repository](https://github.com/amitbl/blocktube) and the v0.4.8 source snapshot at commit [`d8a1bdba062ab603726b0ac3ea06c229d61fd710`](https://github.com/amitbl/blocktube/tree/d8a1bdba062ab603726b0ac3ea06c229d61fd710). Future BlockTube versions must be detected and audited rather than assumed compatible.

#### 8.7.1 Complete source-field inventory

The importer must detect and report every known field, including:

```text
filterData.title
filterData.channelName
filterData.channelId
filterData.videoId
filterData.comment
filterData.vidLength
filterData.javascript
filterData.percentWatchedHide        legacy/source variant

options.trending
options.mixes
options.shorts
options.movies
options.suggestions_only
options.autoplay
options.enable_javascript
options.block_message
options.block_feedback
options.disable_db_normalize
options.disable_you_there
options.disable_on_history
options.vidLength_type
options.percent_watched_hide         current UI field

uiTheme
uiPass
```

Unknown fields must appear in the preview as `Not recognized`; they must never disappear silently.

#### 8.7.2 Migration matrix

| BlockTube field | FilterTube destination | Required treatment |
| --- | --- | --- |
| `filterData.channelId` | Main blocked channels | Preserve exact UC identity; skip comments/blank rows; validate and deduplicate. |
| `filterData.channelName` | Main name-based channel rules | Preserve literal versus raw-regex intent; do not pretend a name is a UC ID. |
| `filterData.title` | Main keyword rules | Preserve literal versus raw-regex intent and flags. |
| `filterData.videoId` | `blockedVideoIds`/compatible Main video list | Preserve exact video IDs and enforce them after import. |
| `filterData.comment` | Comment-scoped keyword rules | Import as comment-only rules, preserving literal versus regex intent. |
| `filterData.vidLength` + `options.vidLength_type` | Duration content filter | Translate seconds and Block/Allow-between semantics exactly where representable. |
| `options.trending` | `hideExploreTrending` | Direct boolean translation. |
| `options.mixes` | `hideMixPlaylists` | Direct boolean translation. |
| `options.shorts` | `hideShorts` | Direct boolean translation. |
| `options.autoplay` | Review-only behavioral mapping | BlockTube means auto-play a next suggestion after a block; FilterTube's `disableAutoplay` is not its inverse. Do not map automatically. |
| `options.movies` | No current exact equivalent | Report as unsupported until a verified Movies control exists. |
| `options.suggestions_only` | No current exact equivalent | Report as unsupported; do not silently weaken direct-page blocking. |
| `options.block_message` | Optional imported blocked-overlay copy | Import only if FilterTube exposes reviewed custom overlay text; otherwise preserve in migration report. |
| `options.block_feedback` | No safe automatic equivalent | Never trigger YouTube `Not interested` or `Don't recommend channel` as an import side effect. |
| `options.disable_you_there` | No current exact equivalent | Report as unsupported. |
| `options.disable_db_normalize` | No current exact equivalent | Report as unsupported and do not introduce media/player mutation during import. |
| `options.disable_on_history` | No current exact equivalent | Report as unsupported until route-scoped rule suspension is deliberately supported. |
| `options.percent_watched_hide` / `filterData.percentWatchedHide` | No current exact equivalent | Report as unsupported until watched-percentage filtering exists. |
| `uiTheme` | FilterTube theme | Offer as an optional UI preference, unchecked by default during rule-only import. |
| `uiPass` | Never import as a FilterTube PIN | BlockTube stores a UI password string; FilterTube PIN verifiers use a different security contract. Warn and require a new FilterTube PIN. |
| `filterData.javascript` / `options.enable_javascript` | Quarantined migration attachment only | Never evaluate or translate arbitrary JavaScript automatically. Preserve for user download/review and clearly mark it inactive. |

#### 8.7.3 Literal and raw-regex compatibility

BlockTube treats ordinary title/channel/comment rows as whole-word-style matches and accepts raw `/pattern/flags` rows. FilterTube currently imports these rows as plain strings, which changes meaning and can even escape a raw regex into a literal.

Complete compatibility therefore requires an explicit normalized match contract:

```javascript
{
  word: "pattern or literal",
  matchMode: "literal" | "regex",
  exact: true,
  regexFlags: "i",
  scope: "title" | "channel_name" | "comment",
  source: "blocktube_import"
}
```

- Parse raw regex only with a strict `/pattern/flags` parser.
- Validate allowed flags and compilation before apply.
- Display every regex in the preview and require explicit confirmation.
- Reject invalid or excessively expensive patterns with a row-level reason.
- Keep regex execution bounded and shared between JSON-first and DOM fallback decisions.
- Do not convert advanced JavaScript into regex.

#### 8.7.4 Preview and no-silent-loss report

Before apply, show four groups:

1. **Will import exactly**
2. **Will translate with changed wording or representation**
3. **Will preserve but leave inactive**
4. **Cannot import**

The summary must include counts for channels, video IDs, title rules, comment rules, regex rules, duration settings, mapped options, inactive advanced JavaScript, unsupported options, invalid rows, duplicates, and unknown fields.

The user must be able to download the migration report. `Import` is enabled only after the preview finishes and the target FilterTube profile is fixed.

#### 8.7.5 Apply behavior

- Default to Merge into the selected Main profile.
- Never apply BlockTube rules to Kids or Both unless the user explicitly changes the target after reviewing the preview.
- Create a FilterTube backup before mutation.
- Preserve source provenance on every imported rule.
- Commit all accepted rows/settings in one background-owned transaction or roll back to the pre-import state.
- Recompile once and issue one runtime revision after success; do not refresh or reprocess once per row.
- Return an apply receipt with imported, skipped, translated, inactive, and unsupported counts.

#### 8.7.6 Definition of complete compatibility

“Complete BlockTube import” means that every field in a valid BlockTube backup is recognized and receives a visible outcome. It does **not** mean FilterTube will execute BlockTube's arbitrary JavaScript or silently invent equivalents for behaviors FilterTube does not support.

No field may be silently discarded. Safe equivalents migrate, unsafe executable content remains inactive, unsupported behavior is named, and the original backup remains untouched.

## 9. Feature D: Firefox mobile direct-Short enforcement

Status: the source-level admission path is implemented and focused tests pass. The physical Firefox-for-Android acceptance matrix in section 9.5 remains mandatory before issue #65 is called fixed.

### 9.1 Correct problem statement

The reported URL contains a stable video ID: `Ptng0VmOt-c`. The missing piece is not necessarily the Shorts video ID. The problem is ensuring that the current mobile Shorts playback owner is joined to strong creator identity before it is admitted.

Some Shorts renderers expose channel identity in JSON or DOM; others expose it late or only through the Watch/Shorts response. The runtime must use the strongest available path and must not assume either “always present” or “never present.”

### 9.2 Required admission state machine

For a direct `/shorts/VIDEO_ID` route when channel rules can affect admission:

```text
route detected
  -> read videoId from URL/endpoint
  -> check videoChannelMap and captured JSON
  -> if identity known, decide immediately
  -> if unresolved, place only the current player in pending state
  -> run one deduplicated bounded identity resolution
  -> allow: release pending state
  -> block: pause and cover player, suppress advance/replay
  -> unavailable/timeout in Block selected: fail open with diagnostic
  -> unavailable/timeout in Allow only selected: fail closed with explanation
```

Do not hide the entire Shorts application shell. Navigation and the ability to change settings must remain usable.

### 9.3 Identity order

1. Current route video ID.
2. Captured `player`, `next`, or initial data for the same video ID.
3. `videoChannelMap` and channel identity caches.
4. Current Shorts DOM/Polymer data with same-video proof.
5. One background Shorts/Watch identity request using existing host permission, timeout, streaming limit, cache, and in-flight deduplication.

Never match a creator name or channel ID from a neighboring Short without exact-video ownership proof.

### 9.4 Playback enforcement

When a resolved creator matches a channel block:

- pause the actual current video;
- render a stable FilterTube-owned cover inside the player owner;
- prevent autoplay/replay and immediate swipe restoration for that video;
- preserve the route and controls needed to navigate away;
- show `Blocked by channel rule` with the channel display name when known;
- remove the cover immediately when the rule is removed or FilterTube is disabled.

This is separate from `Hide Shorts`, which removes the Shorts feature/surfaces globally.

### 9.5 Required Firefox test matrix

At minimum, validate on Firefox for Android with a fresh extension reload:

| Route/surface | Block selected | Allow only selected |
| --- | --- | --- |
| Direct `m.youtube.com/shorts/VIDEO_ID` | Block known blocked creator; allow unrelated creator | Admit known allowed creator; hold/deny others |
| Swipe to next Short | Re-evaluate new video ID once | Re-evaluate before playback |
| Open from Home Shorts shelf | Same result as direct route | Same result as direct route |
| Refresh blocked Short | Remains covered and paused | Remains denied |
| Remove channel rule while open | Restores player without reload if safe | Re-evaluates policy |
| Collaborator Short | Block according to existing collaborator policy | Preserve existing collaborator allow semantics |

Also run desktop Firefox, Chromium desktop, mobile-emulation fixtures, Watch, Home, Search, comments, Mix, and collaborator regressions. Source and fixture tests are not a substitute for the Firefox/Android result.

### 9.6 Diagnostics

Debug mode should emit one compact decision chain per current Short:

```text
videoId -> identity source -> canonical channel key -> matched rule/source -> decision -> playback action
```

Do not log full response bodies, cookies, signed request context, or browsing history.

## 10. UI proposal

### Dashboard

- Rename the global mode labels in user-facing copy to `Block selected` and `Allow only selected`, while retaining internal compatibility values.
- Implemented for manual rule intent: Main and Kids Channels and Keywords use `Blocked rules` / `Allowed rules` list views with counts, per-entry status badges, and individual move actions. Changing the list view does not change either surface's mode, and Kids remains independent from Main. Channel source filtering continues to expose manual and imported-list provenance separately.
- Show provenance badges: `You`, `Imported`, `Subscribed list`, `Parent managed`.
- Add a `Why?` action in recent/filter statistics where a decision receipt is available.
- Add a `Filter lists` card with Import once, Add subscription, Check now, Disable, Preview changes, and Remove source.
- Keep advanced source details collapsed.

### Popup

- Show current policy and counts.
- Provide `Add exception from this page/video` when a strong current identity is available.
- Link to full Channel/Keyword/Filter list management.
- Do not attempt full remote-list editing in the popup.

### On YouTube

- Three-dot menu language reflects the rule action: `Block channel`, `Always allow channel`, `Remove exception`.
- A blocked overlay says which type of rule won without exposing technical renderer/API language.

## 11. Implementation map

Expected owners, to be confirmed against the live worktree before each slice:

- Profile state and migrations: `js/state_manager.js`, `js/io_manager.js`, `js/settings_shared.js`
- Background compilation, imports, resolver messages, and storage: `js/background.js`
- Shared decision semantics: `js/filter_logic.js`
- DOM fallback and current-player admission: `js/content/dom_fallback.js`, `js/content_bridge.js`
- Main-world JSON/identity capture: `js/injector.js`, `js/content/bridge_injection.js`
- Dashboard UI: `html/tab-view.html`, `js/tab-view.js`, `js/render_engine.js`
- Popup: `html/popup.html`, `js/popup.js`
- Help/website: dashboard Help plus the website repository/surface documented separately
- Native parity: shared runtime sync only after the extension schema and semantics are stable

No slice should create a second rule evaluator. JSON-first and DOM paths must consume the same compiled decision contract.

## 12. Delivery plan

### Phase 0: reproduce and instrument issue #65 — source investigation addressed, device reproduction pending

- Capture Firefox/Android version, extension version, signed-in state, direct URL behavior, current V4 profile rule, DOM/JSON identity sources, and playback owner.
- Add a fixture for the observed mobile Shorts shape.
- Record the first point where video ID, channel identity, rule match, or playback action is lost.

Exit: one evidence-backed root cause and a failing focused test.

### Phase 1: parent Quick Start and Exact explanation — addressed baseline

- Preserve the everyday-user-first Help flow.
- Preserve the persistent `Exact` example and plain mode descriptions.
- Keep user and technical website paths distinct.

Regression gate: a new user can understand Exact and configure a basic block from the guide without developer terminology. The exception walkthrough becomes active after Phase 2 ships.

### Phase 2: non-destructive dual rule sets — implemented baseline

- Add video allow/block storage.
- Compile allow exceptions in Block selected and block exclusions in Allow only selected.
- Implement precedence and decision receipts.
- Stop destructive list movement on mode change.

Exit: favorite channel/video exceptions work without switching mode; all old profiles migrate without lost rules.

### Phase 3: Firefox mobile Shorts fix — source implemented, device gate open

- Apply current-player admission state machine using the unified decision engine.
- Validate on Firefox for Android and regression surfaces.

Exit: issue #65 reproduction no longer plays the blocked Short; device evidence is recorded.

### Phase 4: complete BlockTube migration and one-time list import — implemented baseline

- Upgrade the partial BlockTube adapter to the complete recognition/preview/apply contract in section 8.7.
- Native FilterTube format plus conservative text/CSV adapters.
- Preview and provenance.

Exit: every BlockTube backup field receives a visible outcome, all safe supported data migrates transactionally, unsafe JavaScript remains inactive, and large imports work without per-channel network fan-out.

Implementation evidence: `tests/runtime/blocktube-import-transaction-current-behavior.test.mjs` exercises a multi-thousand-rule migration, verifies the V4 read-back receipt, forces a quota-style active-profile write failure, and proves the pre-import storage snapshot is restored.

### Phase 5: remote list subscriptions — existing reviewed URL-list baseline; high-scale hardening deferred

- Isolated source snapshots, conditional updates, last-known-good behavior, limits, and source management.
- Manual exceptions override subscribed blocks.

Exit: a source can update safely and reversibly; disabling/removing it does not delete manual rules.

### Phase 6: extension-to-native parity

- Version the shared profile/runtime contract.
- Sync through the existing upstream-authoritative workflow.
- Add native UI using platform conventions without creating a second policy model.

Exit: extension and native clients make the same decision from the same portable profile.

## 13. Acceptance criteria

### Guidance

- Status: addressed; retain as regression criteria.
- `Exact` has an inline, plain-language example.
- Help begins with a five-minute setup path and separates technical material.
- Instructions cover Block selected, Allow only selected, exceptions, Categories, and troubleshooting.

### Exceptions

- A manually allowed channel can override a blocked keyword in Block selected mode.
- A manually blocked video can override an allowed channel.
- Mode switching does not move, merge, or clear either list.
- Decision behavior is identical in JSON-first and DOM fallback paths.
- Existing profiles and exports migrate without data loss.

### Lists

- A complete BlockTube backup preview recognizes every known `filterData`, `options`, theme, and password field.
- Comment rules, video IDs, literal/regex intent, and duration settings are not silently dropped.
- Advanced JavaScript is never executed and unsupported options are named in a downloadable migration report.
- Import and Subscribe are distinct.
- Remote data is inert and limited to the documented schema.
- Failed updates retain last-known-good data.
- Source entries remain distinguishable and removable as a unit.
- No per-entry YouTube request fan-out occurs.
- Manual exceptions override a subscribed block.

### Firefox mobile Shorts

- The reported direct mobile Short is paused/covered when its resolved creator is blocked.
- A neighboring allowed Short is not falsely hidden.
- Reload, SPA navigation, swipe, and rule removal re-evaluate once without observer/fetch loops.
- Collaborator filtering, comments, normal Watch, and `Hide Shorts` behavior remain intact.
- Completion requires real Firefox/Android proof, not only build or fixture success.

## 14. Release and support notes

- Ship the guidance improvement independently if it is ready first.
- Describe exceptions as `Always allow` in release notes; avoid telling ordinary users to “mix whitelist semantics into blocklist mode.”
- Keep issue #62 open until subscription updates—not only one-time import—ship.
- Keep issue #65 open until the reporter scenario or an equivalent Firefox/Android device test passes.
- Add a troubleshooting export containing sanitized decision receipts and version information, never page bodies or personal viewing history.

## 15. Resolved decisions and remaining release decisions

1. Resolved: keyword and channel allow exceptions ship together, and the runtime also understands video-level allow/block precedence.
2. Resolved for the existing workflow: imported/list-derived entries retain provenance and manual exceptions remain independently editable. General-purpose remote allow-list subscriptions are not introduced silently.
3. Remaining: choose IndexedDB snapshot size, row-count, timeout, and conditional-request limits before advertising high-scale automatic subscriptions.
4. Resolved baseline: managed-child mutations use the explicit visible rule target; locked managed authority continues to outrank child-local choices.
5. Remaining: record Firefox/Android device evidence before closing issue #65.
6. Remaining: choose the website repository/owner so dashboard and website guidance share one reviewed source.
