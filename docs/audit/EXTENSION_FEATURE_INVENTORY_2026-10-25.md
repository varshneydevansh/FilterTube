# Extension feature inventory — 25 October 2026

## Scope and evidence

Read-only assessment of extension UI declarations, implementations and focused
existing tests at local HEAD `0cbb98dd`. The manifests identify the development
extension as version `3.4.1`; this does not establish what is currently published
in a browser store. No extension runtime, website, native-app, device settings or
profile data was changed by this assessment. Earlier uncommitted website work
remains paused. No build, install, pairing, push, deployment or store action ran.

The feature inventory below is confirmed in current source. It is not a fresh
installed-browser usability test or proof that every YouTube layout, video,
network condition or platform behaves correctly. The Android comparison uses
the earlier phone walkthrough and the app owner's current development inventory;
the phone and its offline-media work were left untouched during this assessment.

## What the extension is

FilterTube adds filtering, focus, family controls and selected device sharing to
YouTube's existing interface. It has its own popup, dashboard and Notes editor;
it does not replace YouTube with the Android app's complete browsing frontend.

| Entry | What the user can do |
| --- | --- |
| Toolbar popup | Toggle filtering where permitted; select the active profile and Blocklist/Whitelist mode; add/search keywords and channels; open Content Controls; see daily time remaining; open full settings; open the Android Play listing. |
| Full dashboard | Dashboard, Filters, Kids Mode, Settings, Accounts & Sync, What's New, Help, About and Donate. Dashboard includes statistics and shortcuts for adding rules and opening controls. |
| Inside YouTube | Optional hover Quick Block and a separate three-dot Block/Filter All menu entry. Supported collaboration cards can expose multiple channels. Main Watch pages can show Notes beside YouTube actions. |

Sources: [popup authoring source](../../src/extension-shell/popup.jsx),
[popup behavior](../../js/popup.js), [dashboard](../../html/tab-view.html),
[inline channel actions](../../js/content/block_channel.js).

## Filtering capabilities

| Area | Current capability | Boundary to explain |
| --- | --- | --- |
| Blocklist and Whitelist | Hide matches or limit viewing to approved rules. Separate Blocked and Allowed collections support exceptions. | Choosing which collection to edit does not itself change the active mode. Core restrictions can still override ordinary exceptions. |
| Channels | Channel IDs, handles and supported URLs; search/sort rules; manual/imported source labels; subscribed-channel import; Filter All and applicable commenter controls. | A channel's identity is distinct from title text; missing metadata can require resolution. |
| Keywords | Words/phrases, Exact matching, supported comment matching, upload-date conditions and broader matching when Exact is off. | Rule-list creation-date filtering is separate from filtering a video's upload date. |
| Specific videos | Saved blocked/allowed video identities and imported compatible video rules participate in admission. | Source support does not imply that every rule type has its own simple standalone authoring editor. |
| Metadata filters | Duration, upload date, uppercase title, minimum views and categories. | Missing/unknown metadata limits decisions. Do not promise semantic understanding of a video. |
| Categories | Fifteen YouTube categories, with independent Block selected / Allow only selected modes. | Category metadata is not always available on every card. |
| Language | Thirty-two selectable base languages using available source/default-audio metadata and bounded supporting evidence. | Experimental; not speech recognition or guaranteed identification. This UI is not exposed for Kids. |
| Main and Kids | Independent rule spaces/modes; optional mode-compatible use of Kids rules on Main. | A Kids allow-list must not silently become a Main blocklist, or vice versa. YouTube Kids' own parent-account blocks are separate. |
| Direct access | Admission checks for supported Watch, Shorts, channel, playlist/autoplay and embedded-player entry paths. | Do not market a claim that no future layout can bypass filtering. Ordinary external-page links are not a general website link-filtering feature. |
| Collaboration | Resolve supported multiple-creator cards and offer channel-specific/all-related actions. | Collaboration attribution depends on YouTube data and layout. |

Sources: [filter engine](../../js/filter_logic.js),
[rule rendering](../../js/render_engine.js),
[view counts](../../js/shared/view_count.js),
[collaboration UI](../../js/content/collab_dialog.js),
[embedded-player guard](../../js/content/external_youtube_guard.js),
[feature help](../../html/tab-view.html).

## Complete content-switch catalogue

The shared catalogue evaluates to **32 switches across seven groups**. These
are switches, not an invented count of every product feature. Category/language
and video-metadata filters sit outside this count.

| Group | Count | UI labels |
| --- | ---: | --- |
| Core | 3 | Hide Shorts; Hide Homepage Feed; Hide All Comments |
| Feeds | 7 | Send adverts to The Void; Hide YouTube Playables; Hide Playlist cards; Hide Members-only videos; Hide Mix / Radio playlists; Quick Block button; 3 Dot Block menu item |
| Watch page | 4 | Hide Video Sidebar; Hide Recommended (Related Videos); Hide Live Chat; Hide Watch Playlist panel |
| Video info | 6 | Hide Video Info; Hide Video Buttons Bar; Hide Ask button; Hide Channel row; Hide Video Description; Hide Merch, Tickets, Offers |
| Player | 6 | Hide End Screen Videowall; Hide End Screen Cards; Disable Autoplay; Content-only playback (Experimental); Always Use Original Audio (Experimental); Disable Annotations |
| Navigation | 5 | Hide Top Header; Hide Notification Bell; Hide Explore and Trending; Hide More from YouTube; Hide Subscriptions |
| Search | 1 | Hide Irrelevant Search Results |

Source: [content catalogue](../../js/content_controls_catalog.js). Counts were
obtained by evaluating its exported accessors locally, rather than counting
labels in compiled or repeated UI markup.

Advert filtering and content-only source selection keep YouTube's native player
in the desktop Watch path. Original-audio preference is a separate experimental
control. Preserving captions, audio, playlists and normal user pauses is part of
the implementation contract; universal compatibility or permanent immunity to
YouTube changes is not established by the presence of these controls.

## Profiles, time, Notes and devices

| Area | Current capability | Important limit |
| --- | --- | --- |
| Profiles | Master/default, independent account and parent-owned protected child profiles; per-profile rules and Main/Kids access. Parent-side Edit Rules can target a child profile. | Child profile entry does not grant parent management authority. |
| PIN/security | Parent/account and Master unlocks; separate child switching PINs; temporary admin sessions; explicit Lock Admin Session; account-creation limits. | A child switching PIN does not unlock parent settings. Browser/device owners can still disable or uninstall an unmanaged extension. |
| Daily viewing time | Separate daily allowance per profile/installation; remaining-time display; exhausted-profile pause screen; parent-reviewed request for extra time. | This is not one pooled allowance across every device in a family. |
| Self-Control Session | Enable/pin the current profile and freeze its existing rules/settings for a reviewed countdown, surviving restart. | No in-app cancellation after activation; distinct from daily time. |
| Hard Timer Whitelist | Reviewed countdown allowing only existing selected Main Allowed channels; freezes changes/profile switching. | Distinct from ordinary Whitelist and the player's sleep timer in the mobile app. |
| Preference reset | Review ordinary display/playback defaults for the chosen profile, including relevant Auto-sync impact. | Preserves rules, modes, content restrictions, Notes, PINs, time limits, trusted devices and ownership; not a destructive factory reset. |
| Video Notes | Exact profile + video ID storage; editor with save, temporary draft handling, timestamps/seek, deletion/undo and concurrent-version review. Personal text lives in an extension-origin frame. | Injected UI is for admitted Main Watch pages on supported desktop/mobile YouTube hosts; not proven Music/Kids/Shorts Notes coverage. Protected access and time checks still apply. |
| Pair/share | Code or QR, matching safety phrase, verified devices, chosen profiles/scopes, one-time personal copy and managed parent updates. | Nearby visibility does not establish trust, and received does not mean applied. |
| Nearby discovery | Receive nearby / Find nearby and saved-device selection. | Needs the optional helper; same Wi-Fi alone does not provide automatic secure discovery or management authority. |
| Auto-sync | Opt-in approved parent updates and separately approved personal profile links; personal links can choose settings/filter rules and saved Notes; local offline queue and conflict review. | Direct transport needs both Accounts & Sync pages open and connected. Background alarms wake/reconcile eligible queues; they do not independently provide an always-on transport. |
| Optional pickup | Separately configured Home Pickup / Internet Pickup for approved managed updates. | Not a blanket replacement for personal Auto-sync connectivity, and not guaranteed delivery merely because a device goes online. |
| Ownership/privacy | Local rules and selected verified encrypted device transfer. PINs, ownership and device permissions remain local. | Connection, relay and optional pickup services may be involved; avoid saying no servers ever exist. |

Sources: [profile/admin UI](../../js/tab-view.js),
[preference reset](../../js/profile_preference_defaults.js),
[Notes admission](../../js/content/video_notes.js),
[Notes key contract](../../js/shared/saved_video_notes.js),
[Notes editor](../../js/video_notes_editor.js),
[Auto-sync UI](../../js/device_auto_sync_ui.js),
[personal sync scope](../../js/personal_sync.js),
[background wakeups](../../js/auto_sync_wakeup.js),
[managed update signatures and delivery](../../js/nanah_sync_adapter.js).

## Imports, backups and everyday settings

- Full FilterTube JSON and password-encrypted backup export/import; active-profile
  versus permitted broader export; automatic local backups with Latest/History
  and Auto/Plain JSON/Encrypted choices.
- **Private video Notes are not included in the extension's ordinary backup
  path.** Its importer explicitly rejects a notes-bearing app backup rather than
  silently dropping notes. Opt-in personal Notes sync is a separate capability.
- Reviewed rule-list imports from supported CSV, TXT, JSON, BlockTube JSON and
  raw HTTPS lists; target Main, Kids or both where permitted. Reports, list
  management, templates and reviewed URL refresh/staleness checks are available.
- BlockTube migration has capacity checks, transaction/readback/receipt handling
  and unsupported-field reporting. Imported JavaScript is not executed and an
  imported UI password does not become a FilterTube PIN.
- Compatible BlockTube export covers reviewed supported rules from one profile
  and rule space; it is not a full FilterTube backup.
- Light/dark presentation, interface-language selection and update-notification
  preference. Translation previews should not be described as fully reviewed
  language parity. Interface language and video-language filtering are different.
- Help, What's New, Android availability/demo links, support and project details.

Sources: [settings UI](../../html/tab-view.html),
[backup/import implementation](../../js/io_manager.js),
[background import enrichment](../../js/imported_channel_enrichment.js).

## Extension versus custom mobile frontend

| User's page list | Extension | Android development app |
| --- | --- | --- |
| Home, Search, Watch | Enhances supported existing YouTube pages with rules, controls and admission. | Own custom browsing/search/watch interface and player. |
| Subscriptions, You, History, Playlists | Works with supported YouTube cards/routes; no replacement account/library frontend. | Dedicated app destinations, account-backed library and local history/resume paths. |
| Shorts | Filter/hide supported Shorts surfaces and check direct Shorts entry. | Own vertical Shorts viewing flow plus filtering. |
| Music Home, Explore, Artist, Library, Albums | No dedicated FilterTube Music frontend; broad host permissions are not proof of complete YouTube Music coverage. | Separate custom Music destinations and Now Playing controls in the candidate. |
| Offline media player | No local audio/video library or YouTube download feature. JSON backups are settings data. | Local-file library/player was observed earlier. YouTube offline saves remain separate ongoing Android work. |
| YouTube Kids | Adds local profile-specific Kids rules and controlled access alongside YouTube's own controls. | Separate Kids viewing experience; current phone runtime was not re-audited during this extension assessment. |
| Profiles, Notes, sync | Implemented extension-specific UI/contracts with the boundaries above. | Related native capabilities have their own implementation, build and interoperability gates. Shared concepts do not prove identical release support. |

iOS and TV require their own inventories and acceptance. Do not project this
extension inventory or an Android candidate onto those products automatically.

## Gaps and follow-up corrections

1. **Notes help — corrected in the authorized follow-up:**
   `html/video-notes.html:29` previously said backup and device sync were not
   connected. It now explains opt-in Notes sync, the open/connected direct path,
   and the separate ordinary-backup exclusion. The successful focused tests do
   not establish fresh cross-device installed acceptance.
2. **Migration help — corrected in the authorized follow-up:**
   `html/tab-view.html:1667` previously said channel-metadata enrichment paused
   with the dashboard closed, contradicting its detailed explanation at `:2495`.
   The short help now matches the persisted background scheduler installed at
   `js/background.js:8621`, preserving shutdown, authorization and wakeup caveats.
3. **Notes backup interoperability:** A native backup containing saved Notes is
   deliberately rejected by the extension importer. This is a real compatibility
   gap, not merely wording; preserve the original file and do not promise a full
   notes-inclusive app-to-extension restore today.
4. **Capability visibility — addressed in the authorized follow-up:** The
   extension overview now has six expandable groups covering Hard Timer
   Whitelist, managed imported lists, reviewed URL checks, independent Quick
   Block/menu controls, Notes, sync and interface/backup choices.
5. **Inactive roadmap:** Semantic ML navigation is hidden and runtime matching
   explicitly unimplemented. No active local-model filtering claim is justified.
6. **Open acceptance:** Fresh browser UI inspection, all-layout advert/playback
   behavior, real paired-device offline reconnect and cross-platform release
   availability are not completed by this source inventory.

## Validation and review

An independent subagent cross-checked the popup, dashboard, rule editors and
content-control inventory without editing files. A bounded FreeLLMAPI
`openai/gpt-oss-120b` copy-grouping review was advisory. Its first answer was
truncated and rejected; the completed retry's suggestion to combine Notes with
imports/backups/reset exclusions was not adopted because those operations have
different behavior. Source and tests determine the inventory.

Eight existing test files ran with **192 passing, zero failing** checks:

- `video-notes-contract.test.mjs`
- `video-notes-background.test.mjs`
- `video-notes-watch.test.mjs`
- `video-notes-editor.test.mjs`
- `auto-sync-two-endpoint.test.mjs`
- `personal-sync.test.mjs`
- `managed-time-usage-transactions.test.mjs`
- `profile-preference-reset.test.mjs`

These are focused automated checks, not a complete release suite or a fresh live
device/network test. Log: `/tmp/filtertube-extension-feature-assessment-tests.log`.

For later website work, a compact grouping is: **Filter what appears; Quiet
distractions; Profiles and protected time; Notes for useful moments; Connect your
devices; Keep and move your setup.** Keep the complete option list in expandable
details, and describe the custom app's Watch/Music/library experience separately.
