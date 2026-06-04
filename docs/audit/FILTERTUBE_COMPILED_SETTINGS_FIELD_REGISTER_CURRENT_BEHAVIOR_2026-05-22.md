# FilterTube Compiled Settings Field Register - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This slice promotes settings and JSON-first filter review from broad compiler
parity notes into a source-derived field register for the current compiled
settings surfaces. It covers fields emitted by the background compiler, fields
returned by the shared UI compiler, fields normalized by filter logic, and
settings fields consumed by seed/filter/bridge runtime code.

This is not completion proof for settings authority, compiler parity,
JSON-first field promotion, list-mode semantics, profile routing, no-work
budgets, mutation safety, storage revision ownership, or fixture provenance. It
is a current-behavior boundary before changing compiled settings shape, filter
field behavior, background/UI compiler parity, seed no-work gates, bridge
settings relays, or first-class JSON filtering.

## Source Boundary

```text
tracked product files scanned for compiled/settings fields: 6
raw compiled/settings field rows: 317
unique file-field-operation rows: 155
raw cachedSettingsRead rows: 12
raw compiledAssign rows: 58
raw currentSettingsRead rows: 56
raw processedAssign rows: 7
raw settingsRead rows: 148
raw sharedCompiledReturn rows: 36
unique cachedSettingsRead rows: 7
unique compiledAssign rows: 48
unique currentSettingsRead rows: 6
unique processedAssign rows: 7
unique settingsRead rows: 51
unique sharedCompiledReturn rows: 36
runtime behavior changed: no
```

The scan is intentionally limited to the current settings/compiler/runtime
surfaces that create or consume compiled settings fields:

```text
js/background.js
js/settings_shared.js
js/filter_logic.js
js/seed.js
js/content_bridge.js
js/content/bridge_settings.js
```

## Source Fingerprints

| Source file | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6641 | 298986 | `837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content_bridge.js` | 13636 | 604184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/content/bridge_settings.js` | 1113 | 44087 | `f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853` |

## Unique File Counts

| File | Unique rows |
| --- | ---: |
| `js/background.js` | 54 |
| `js/content/bridge_settings.js` | 7 |
| `js/content_bridge.js` | 16 |
| `js/filter_logic.js` | 26 |
| `js/seed.js` | 16 |
| `js/settings_shared.js` | 36 |

## Field Sets By Operation

```text
cachedSettingsRead (7): enabled,filterChannels,filterKeywords,hideAllComments,hideAllShorts,listMode,profileType
compiledAssign (48): activeProfileId,activeProfileKind,categoryFilters,channelMap,contentFilters,disableAnnotations,disableAutoplay,enabled,filterChannels,filterComments,filterKeywords,filterKeywordsComments,hideAllComments,hideAllShorts,hideAskButton,hideEndscreenCards,hideEndscreenVideowall,hideExploreTrending,hideHomeFeed,hideLiveChat,hideMembersOnly,hideMerchTicketsOffers,hideMixPlaylists,hideMoreFromYouTube,hideNotificationBell,hidePlaylistCards,hideRecommended,hideSearchShelves,hideSponsoredCards,hideSubscriptions,hideTopHeader,hideVideoButtonsBar,hideVideoChannelRow,hideVideoDescription,hideVideoInfo,hideVideoSidebar,hideWatchPlaylistPanel,listMode,managedTimeLimitPolicy,managedViewingRouteGate,profileType,showBlockMenuItem,showQuickBlockButton,useExactWordMatching,videoChannelMap,videoMetaMap,whitelistChannels,whitelistKeywords
currentSettingsRead (6): channelMap,filterChannels,listMode,showBlockMenuItem,videoChannelMap,videoMetaMap
processedAssign (7): categoryFilters,contentFilters,filterChannels,filterKeywords,videoMetaMap,whitelistChannels,whitelistKeywords
settingsRead (51 rows; 29 fields): activeProfileKind,autoBackupEnabled,autoBackupFormat,autoBackupMode,categoryFilters,channelMap,contentFilters,disableAutoplay,enabled,filterChannels,filterComments,filterKeywords,filterKeywordsComments,ftProfilesV4,hideAllComments,hideAllShorts,hideComments,hideEndscreenCards,hideEndscreenVideowall,listMode,managedTimeLimitPolicy,managedViewingRouteGate,minWordLength,mode,profileType,videoChannelMap,videoMetaMap,whitelistChannels,whitelistKeywords
sharedCompiledReturn (36): categoryFilters,contentFilters,disableAnnotations,disableAutoplay,enabled,filterChannels,filterComments,filterKeywords,filterKeywordsComments,hideAllComments,hideAllShorts,hideAskButton,hideEndscreenCards,hideEndscreenVideowall,hideExploreTrending,hideHomeFeed,hideLiveChat,hideMembersOnly,hideMerchTicketsOffers,hideMixPlaylists,hideMoreFromYouTube,hideNotificationBell,hidePlaylistCards,hideRecommended,hideSearchShelves,hideSponsoredCards,hideSubscriptions,hideTopHeader,hideVideoButtonsBar,hideVideoChannelRow,hideVideoDescription,hideVideoInfo,hideVideoSidebar,hideWatchPlaylistPanel,showBlockMenuItem,showQuickBlockButton
```

Background-only compiled fields not returned by `buildCompiledSettings(...)` in
`js/settings_shared.js`:

```text
activeProfileId,activeProfileKind,channelMap,listMode,managedTimeLimitPolicy,managedViewingRouteGate,profileType,useExactWordMatching,videoChannelMap,videoMetaMap,whitelistChannels,whitelistKeywords
```

Shared-only compiled fields not assigned by the background compiler:

```text
none
```

## Unique Field Rows

```text
js/seed.js:269:cachedSettingsRead:listMode:2
js/seed.js:411:cachedSettingsRead:enabled:3
js/seed.js:439:cachedSettingsRead:profileType:1
js/seed.js:441:cachedSettingsRead:filterKeywords:1
js/seed.js:442:cachedSettingsRead:filterChannels:1
js/seed.js:443:cachedSettingsRead:hideAllComments:3
js/seed.js:444:cachedSettingsRead:hideAllShorts:1
js/background.js:2179:compiledAssign:filterKeywords:6
js/background.js:2215:compiledAssign:filterKeywordsComments:6
js/background.js:2282:compiledAssign:listMode:1
js/background.js:2283:compiledAssign:profileType:1
js/background.js:2284:compiledAssign:activeProfileId:1
js/background.js:2285:compiledAssign:activeProfileKind:1
js/background.js:2290:compiledAssign:managedViewingRouteGate:1
js/background.js:2302:compiledAssign:managedTimeLimitPolicy:1
js/background.js:2329:compiledAssign:whitelistKeywords:1
js/background.js:2530:compiledAssign:whitelistChannels:1
js/background.js:2648:compiledAssign:filterChannels:1
js/background.js:2729:compiledAssign:channelMap:1
js/background.js:2742:compiledAssign:videoChannelMap:1
js/background.js:2745:compiledAssign:videoMetaMap:1
js/background.js:2795:compiledAssign:enabled:1
js/background.js:2796:compiledAssign:hideAllComments:1
js/background.js:2797:compiledAssign:filterComments:1
js/background.js:2798:compiledAssign:useExactWordMatching:1
js/background.js:2799:compiledAssign:hideAllShorts:1
js/background.js:2800:compiledAssign:hideHomeFeed:1
js/background.js:2801:compiledAssign:hideSponsoredCards:1
js/background.js:2802:compiledAssign:hideWatchPlaylistPanel:1
js/background.js:2803:compiledAssign:hidePlaylistCards:1
js/background.js:2804:compiledAssign:hideMembersOnly:1
js/background.js:2805:compiledAssign:hideMixPlaylists:1
js/background.js:2806:compiledAssign:hideVideoSidebar:1
js/background.js:2807:compiledAssign:hideRecommended:1
js/background.js:2808:compiledAssign:hideLiveChat:1
js/background.js:2809:compiledAssign:hideVideoInfo:1
js/background.js:2810:compiledAssign:hideVideoButtonsBar:1
js/background.js:2811:compiledAssign:hideAskButton:1
js/background.js:2812:compiledAssign:hideVideoChannelRow:1
js/background.js:2813:compiledAssign:hideVideoDescription:1
js/background.js:2814:compiledAssign:hideMerchTicketsOffers:1
js/background.js:2815:compiledAssign:hideEndscreenVideowall:1
js/background.js:2816:compiledAssign:hideEndscreenCards:1
js/background.js:2817:compiledAssign:disableAutoplay:1
js/background.js:2818:compiledAssign:disableAnnotations:1
js/background.js:2819:compiledAssign:hideTopHeader:1
js/background.js:2820:compiledAssign:hideNotificationBell:1
js/background.js:2821:compiledAssign:hideExploreTrending:1
js/background.js:2822:compiledAssign:hideMoreFromYouTube:1
js/background.js:2823:compiledAssign:hideSubscriptions:1
js/background.js:2824:compiledAssign:showQuickBlockButton:1
js/background.js:2825:compiledAssign:showBlockMenuItem:1
js/background.js:2826:compiledAssign:hideSearchShelves:1
js/background.js:2845:compiledAssign:contentFilters:1
js/background.js:2867:compiledAssign:categoryFilters:1
js/content_bridge.js:262:currentSettingsRead:channelMap:8
js/content_bridge.js:291:currentSettingsRead:videoChannelMap:24
js/content_bridge.js:424:currentSettingsRead:filterChannels:5
js/content_bridge.js:1220:currentSettingsRead:listMode:7
js/content_bridge.js:1654:currentSettingsRead:videoMetaMap:11
js/content_bridge.js:10743:currentSettingsRead:showBlockMenuItem:1
js/filter_logic.js:977:processedAssign:contentFilters:1
js/filter_logic.js:995:processedAssign:categoryFilters:1
js/filter_logic.js:1007:processedAssign:filterKeywords:1
js/filter_logic.js:1021:processedAssign:whitelistKeywords:1
js/filter_logic.js:1036:processedAssign:filterChannels:1
js/filter_logic.js:1052:processedAssign:whitelistChannels:1
js/filter_logic.js:1065:processedAssign:videoMetaMap:1
js/background.js:856:settingsRead:autoBackupEnabled:1
js/background.js:879:settingsRead:ftProfilesV4:1
js/background.js:882:settingsRead:autoBackupFormat:2
js/background.js:907:settingsRead:autoBackupMode:2
js/background.js:1148:settingsRead:filterComments:1
js/background.js:1148:settingsRead:hideComments:1
js/content_bridge.js:1016:settingsRead:enabled:2
js/content_bridge.js:1017:settingsRead:listMode:2
js/content_bridge.js:1018:settingsRead:filterChannels:2
js/content_bridge.js:1027:settingsRead:contentFilters:4
js/content_bridge.js:1038:settingsRead:categoryFilters:2
js/content_bridge.js:1047:settingsRead:filterKeywords:1
js/content_bridge.js:1049:settingsRead:filterKeywordsComments:1
js/content_bridge.js:1050:settingsRead:hideAllComments:1
js/content_bridge.js:1051:settingsRead:hideAllShorts:1
js/content_bridge.js:8392:settingsRead:videoChannelMap:2
js/content/bridge_settings.js:295:settingsRead:profileType:4
js/content/bridge_settings.js:329:settingsRead:listMode:1
js/content/bridge_settings.js:332:settingsRead:whitelistChannels:2
js/content/bridge_settings.js:333:settingsRead:whitelistKeywords:2
js/content/bridge_settings.js:394:settingsRead:activeProfileKind:2
js/content/bridge_settings.js:395:settingsRead:managedViewingRouteGate:1
js/content/bridge_settings.js:569:settingsRead:managedTimeLimitPolicy:1
js/filter_logic.js:857:settingsRead:channelMap:10
js/filter_logic.js:858:settingsRead:filterChannels:13
js/filter_logic.js:859:settingsRead:whitelistChannels:10
js/filter_logic.js:973:settingsRead:contentFilters:5
js/filter_logic.js:992:settingsRead:categoryFilters:5
js/filter_logic.js:1006:settingsRead:filterKeywords:6
js/filter_logic.js:1020:settingsRead:whitelistKeywords:7
js/filter_logic.js:1065:settingsRead:videoMetaMap:17
js/filter_logic.js:1385:settingsRead:videoChannelMap:9
js/filter_logic.js:1581:settingsRead:listMode:3
js/filter_logic.js:1932:settingsRead:disableAutoplay:1
js/filter_logic.js:1932:settingsRead:hideEndscreenCards:1
js/filter_logic.js:1932:settingsRead:hideEndscreenVideowall:1
js/filter_logic.js:2045:settingsRead:hideAllShorts:1
js/filter_logic.js:2215:settingsRead:hideAllComments:1
js/filter_logic.js:2222:settingsRead:filterKeywordsComments:2
js/filter_logic.js:2999:settingsRead:mode:1
js/filter_logic.js:3000:settingsRead:minWordLength:1
js/filter_logic.js:3603:settingsRead:enabled:2
js/seed.js:204:settingsRead:contentFilters:4
js/seed.js:215:settingsRead:categoryFilters:2
js/seed.js:224:settingsRead:filterKeywords:1
js/seed.js:225:settingsRead:filterChannels:1
js/seed.js:226:settingsRead:filterKeywordsComments:1
js/seed.js:227:settingsRead:hideAllComments:1
js/seed.js:228:settingsRead:hideAllShorts:1
js/seed.js:235:settingsRead:enabled:1
js/seed.js:236:settingsRead:listMode:1
js/settings_shared.js:525:sharedCompiledReturn:enabled:1
js/settings_shared.js:526:sharedCompiledReturn:filterKeywords:1
js/settings_shared.js:527:sharedCompiledReturn:filterKeywordsComments:1
js/settings_shared.js:528:sharedCompiledReturn:filterChannels:1
js/settings_shared.js:529:sharedCompiledReturn:hideAllShorts:1
js/settings_shared.js:530:sharedCompiledReturn:hideAllComments:1
js/settings_shared.js:531:sharedCompiledReturn:filterComments:1
js/settings_shared.js:532:sharedCompiledReturn:hideHomeFeed:1
js/settings_shared.js:533:sharedCompiledReturn:hideSponsoredCards:1
js/settings_shared.js:534:sharedCompiledReturn:hideWatchPlaylistPanel:1
js/settings_shared.js:535:sharedCompiledReturn:hidePlaylistCards:1
js/settings_shared.js:536:sharedCompiledReturn:hideMembersOnly:1
js/settings_shared.js:537:sharedCompiledReturn:hideMixPlaylists:1
js/settings_shared.js:538:sharedCompiledReturn:hideVideoSidebar:1
js/settings_shared.js:539:sharedCompiledReturn:hideRecommended:1
js/settings_shared.js:540:sharedCompiledReturn:hideLiveChat:1
js/settings_shared.js:541:sharedCompiledReturn:hideVideoInfo:1
js/settings_shared.js:542:sharedCompiledReturn:hideVideoButtonsBar:1
js/settings_shared.js:543:sharedCompiledReturn:hideAskButton:1
js/settings_shared.js:544:sharedCompiledReturn:hideVideoChannelRow:1
js/settings_shared.js:545:sharedCompiledReturn:hideVideoDescription:1
js/settings_shared.js:546:sharedCompiledReturn:hideMerchTicketsOffers:1
js/settings_shared.js:547:sharedCompiledReturn:hideEndscreenVideowall:1
js/settings_shared.js:548:sharedCompiledReturn:hideEndscreenCards:1
js/settings_shared.js:549:sharedCompiledReturn:disableAutoplay:1
js/settings_shared.js:550:sharedCompiledReturn:disableAnnotations:1
js/settings_shared.js:551:sharedCompiledReturn:hideTopHeader:1
js/settings_shared.js:552:sharedCompiledReturn:hideNotificationBell:1
js/settings_shared.js:553:sharedCompiledReturn:hideExploreTrending:1
js/settings_shared.js:554:sharedCompiledReturn:hideMoreFromYouTube:1
js/settings_shared.js:555:sharedCompiledReturn:hideSubscriptions:1
js/settings_shared.js:556:sharedCompiledReturn:showQuickBlockButton:1
js/settings_shared.js:557:sharedCompiledReturn:showBlockMenuItem:1
js/settings_shared.js:558:sharedCompiledReturn:hideSearchShelves:1
js/settings_shared.js:559:sharedCompiledReturn:contentFilters:1
js/settings_shared.js:560:sharedCompiledReturn:categoryFilters:1
```

## Current Behavior Boundaries

- The background compiler currently assigns 48 unique compiled fields.
- The shared UI compiler currently returns 36 unique compiled fields.
- The background-only compiled fields are map/list/profile/exactness, managed
  time, managed route, and whitelist fields: `channelMap`, `listMode`,
  `managedTimeLimitPolicy`, `managedViewingRouteGate`, `profileType`,
  `useExactWordMatching`, `videoChannelMap`, `videoMetaMap`,
  `whitelistChannels`, and `whitelistKeywords`.
- `filter_logic.js` spreads incoming settings before normalizing seven fields:
  `contentFilters`, `categoryFilters`, `filterKeywords`,
  `whitelistKeywords`, `filterChannels`, `whitelistChannels`, and
  `videoMetaMap`.
- `seed.js` uses 7 cached settings fields in current no-work and route gates:
  list mode, keyword/channel rule arrays, comment/Shorts booleans, enabled,
  and profile type.
- `content_bridge.js` reads current settings heavily for learned map and list
  behavior, especially `videoChannelMap` and `videoMetaMap`.
- `js/content/bridge_settings.js` reads profile, list mode, and whitelist
  fields while relaying settings and normalizing empty Kids whitelist behavior.

## Risk Notes

Reliability risk follows from split compiler surfaces. The background compiler
adds fields that the shared compiler does not return, while filter logic accepts
incoming spread fields before normalizing only a subset. A future JSON-first
field contract needs to say which compiler owns each field and which runtime
consumer is allowed to rely on it.

False-hide/leak risk follows from field effect ambiguity. List mode,
whitelist fields, learned maps, content/category filters, and keyword/channel
arrays affect allow/block decisions across seed, filter logic, bridge code,
DOM fallback, and menu/quick-block behavior. Without per-field effect fixtures,
adding or pruning a field can either hide a visible sibling or leak a target.

Performance risk follows from active-rule gates. Seed has cached settings
checks, filter logic has processed settings normalization, and content bridge
has map/list consumers, but there is no compiled field manifest tying fields to
parse, harvest, DOM, storage, message, network, hide, restore, or no-work
budgets.

Code-burden risk follows from duplicated settings vocabulary. Background,
shared UI, seed, filter logic, content bridge, and bridge settings each encode
local field rules. Field cleanup or JSON-first promotion needs row equivalence
proof before fields can be merged, deleted, renamed, or treated as first-class
filter inputs.

## Content Filter Enabled Normalization Addendum - 2026-05-27

This addendum is audit-only. It follows the `contentFilters.*.enabled` fields
from storage/profile inputs through compiler output and JSON/DOM consumers,
because JSON-first active-work predicates currently disagree on truthy versus
strict boolean admission.

```text
stored/profile contentFilters
        |
        v
settings_shared buildCompiledSettings
        |  safeObject only; no deep enabled coercion
        v
background getCompiledSettings
        |  profile or legacy contentFilters copied as object
        v
seed / injector / content_bridge / filter_logic / DOM fallback
        |  seed/injector/bridge lifecycle is strict; filter effects still have truthy checks
        v
JSON parse admission, renderer filtering, DOM fallback, MAIN-world injection
```

```mermaid
flowchart TD
  A["Stored/profile contentFilters"] --> B["settings_shared safeObject"]
  A --> C["background profile/legacy contentFilters"]
  B --> D["compiled contentFilters"]
  C --> D
  D --> E["seed strict active-work check"]
  D --> F["injector strict active-work check"]
  D --> G["bridge strict MAIN-world check"]
  D --> H["filter_logic truthy renderer checks"]
  D --> I["DOM fallback strict lifecycle check"]
  E --> J["Fetch/XHR JSON body admission"]
  F --> K["Queued replay admission"]
  G --> L["MAIN-world runtime injection"]
  H --> M["Renderer content filtering"]
  I --> N["DOM scan lifecycle"]
```

| Row | Source pins | Current behavior | Risk boundary |
| --- | --- | --- | --- |
| `content_enabled_shared_pass_through` | `js/settings_shared.js:522-560` | `contentFilters` becomes `safeObject(contentFilters)` and is returned as `contentFilters: sanitizedContentFilters`; nested `enabled` values are not coerced. | Shared compiler output cannot prove boolean-normalized content filters. |
| `content_enabled_background_pass_through` | `js/background.js:2511-2531` | Background chooses profile content filters, then legacy content filters, then defaults; selected profile/legacy objects pass through without deep enabled coercion. | V4, legacy, import, and sync payloads can carry non-boolean `enabled` unless another owner proves normalization. |
| `content_enabled_filter_logic_pass_through` | `js/filter_logic.js:940-979` | Filter logic overlays incoming subobjects on defaults; nested `enabled` values are preserved. | Renderer filtering can see truthy non-boolean content-filter values. |
| `content_enabled_seed_strict_admission` | `js/seed.js:202-210` | Seed JSON body admission now requires `duration.enabled`, `uploadDate.enabled`, and `uppercase.enabled` to be exactly `true`. | Malformed truthy content-filter values no longer wake seed fetch/XHR body work. |
| `content_enabled_truthy_effect_consumers` | `js/filter_logic.js:2724`; `js/filter_logic.js:2804`; `js/filter_logic.js:2846`; `js/content/dom_fallback.js:3497`; `js/content/dom_fallback.js:3600-3602` | Filter logic and some DOM effect checks still treat truthy `enabled` as active after another path has admitted work. | Truthy strings or numbers can still affect renderer filtering/effect code if another rule admits the runtime path. |
| `content_enabled_strict_consumers` | `js/seed.js:202-210`; `js/injector.js:153-164`; `js/content_bridge.js:1017-1028`; `js/content/dom_fallback.js:1985-1987` | Seed, injector, bridge MAIN-world admission, and DOM fallback lifecycle active-work use `=== true`. | The same malformed value now fails to wake passive admission, but schema authority is still absent. |
| `content_enabled_schema_gap` | `docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md` | The active-work predicate parity addendum pins the duplicate helper drift, but no runtime schema authority owns the deep content-filter boolean contract. | First-class JSON promotion needs one schema owner before predicates are merged. |

Current normalization status:

```text
content-filter enabled normalization rows: 7
deep content-filter enabled coercion in shared compiler: absent
deep content-filter enabled coercion in background compiler: absent
deep content-filter enabled coercion in filter_logic processing: absent
seed content-filter enabled admission: strict
truthy content-filter enabled effect consumer group: present
strict content-filter enabled consumer group: present
schema authority for content-filter enabled values: NO-GO
JSON-first predicate merge approval from this addendum: NO-GO
runtime behavior changed by normalization addendum: yes; seed JSON admission ignores malformed truthy enabled values
```

The current release implication is narrow: seed body work now follows the
strict passive-admission contract used by injector, bridge, and DOM lifecycle
checks. JSON-first active-work optimization still needs either deep
normalization at a named settings owner or a source-backed decision that every
remaining runtime effect consumer must keep its current truthy/strict behavior.

## Content Filter Value Normalization Addendum - 2026-05-28

Status: audit-only current-behavior continuation. Runtime behavior is
unchanged. This addendum follows duration thresholds and upload-date relative
date fields from dashboard save paths into StateManager, compiler output, and
runtime consumers. It does not approve a settings schema change, UI behavior
change, stale-threshold cleanup, JSON-first promotion, or optimization patch.

The current value boundary is:

```text
dashboard content-control form
        |
        v
saveVideoFilters / saveKidsVideoFilters
        |  spread prior duration/uploadDate first
        |  only overwrite value fields when parsePositiveFloat(value) > 0
        v
StateManager updateContentFilters / updateKidsContentFilters
        |  merge subobjects without clearing stale threshold/date fields
        v
compiler / filter_logic / DOM fallback
        |  sees preserved caller-shaped values
        v
active-work gates, JSON decisions, DOM decisions, and metadata fetch paths
```

```mermaid
flowchart TD
  A["Main/Kids content-control inputs"] --> B["parsePositiveFloat"]
  B -->|positive number| C["Overwrite min/max/value/fromDate/toDate"]
  B -->|blank, zero, invalid| D["Keep prior subobject fields"]
  D --> E["StateManager merges contentFilters"]
  C --> E
  E --> F["Compiled settings preserve contentFilters"]
  F --> G["Seed/injector/bridge strict enabled gates"]
  F --> H["filter_logic and DOM content decisions"]
  H --> I["Possible stale threshold/date effects"]
```

| Row | Source pins | Current behavior | Risk boundary |
| --- | --- | --- | --- |
| `content_value_main_duration_prior_spread` | `js/tab-view.js:1051-1106` | Main `nextDuration` starts with `...(prior.duration || {})`; blank, zero, or invalid duration inputs do not clear previous `minMinutes`, `maxMinutes`, or `value`. | UI can present an edited/blank control while persisted thresholds remain. |
| `content_value_main_upload_prior_spread` | `js/tab-view.js:1107-1158` | Main `nextUpload` starts with `...(prior.uploadDate || {})`; blank, zero, or invalid age inputs do not clear previous `value`, `valueMax`, `unit`, `unitMax`, `fromDate`, or `toDate`. | Upload-date active work can retain old cutoff fields after a blank edit. |
| `content_value_kids_duration_prior_spread` | `js/tab-view.js:2159-2214` | Kids `nextDuration` mirrors Main duration save semantics and keeps prior threshold fields when inputs do not parse as positive numbers. | Main and Kids can preserve stale thresholds consistently, so a fix needs shared behavior proof. |
| `content_value_kids_upload_prior_spread` | `js/tab-view.js:2215-2266` | Kids `nextUpload` mirrors Main upload-date save semantics and keeps prior cutoff fields when inputs do not parse as positive numbers. | Kids route/surface optimization cannot assume blank UI means blank runtime fields. |
| `content_value_main_state_merge` | `js/state_manager.js:2147-2150` | Main StateManager merges `nextContentFilters.duration`, `uploadDate`, and `uppercase` over existing subobjects. | State update does not act as a stale-field cleanup boundary. |
| `content_value_kids_state_merge` | `js/state_manager.js:2170-2174` | Kids StateManager merges incoming content-filter subobjects over current subobjects. | Kids state update also does not clear omitted stale fields. |
| `content_value_compiler_pass_through` | `js/settings_shared.js:522-560`; `js/background.js:2511-2531`; `js/filter_logic.js:940-979` | Shared compiler, background compiler, and filter-logic processing preserve nested content-filter value fields. | Runtime consumers can see stale threshold/date fields unless a dedicated normalizer is introduced. |

Current value-normalization status:

```text
content-filter value normalization rows: 7
dashboard blank duration clears prior threshold fields: no
dashboard blank upload-date clears prior cutoff fields: no
StateManager content-filter value cleanup owner: absent
compiled content-filter value cleanup owner: absent
JSON-first value-normalized content-filter approval: NO-GO
runtime behavior changed by value addendum: no
```

The release implication is narrow: value-level content-filter normalization is
still an open settings-mode and optimization blocker. Before duration or
upload-date can become first-class JSON work predicates, one owner must define
whether blank/zero controls clear stale runtime fields, preserve current
fields, or disable the corresponding content-filter family.

Additional future authority symbols intentionally absent from product runtime:

```text
contentFilterValueNormalizationAuthority
contentFilterDurationValueCleanupReport
contentFilterUploadDateValueCleanupReport
contentFilterStateManagerValueCleanupOwner
contentFilterDashboardBlankValuePolicy
contentFilterJsonFirstValueNormalizedPredicate
```

## Future Proof Fields

Each compiled settings field must eventually be backed by compiler ownership,
runtime ownership, allowed effects, and fixture evidence:

```text
compiledSettingsFieldReference
sourceFile
sourceLine
operation
fieldName
compilerOwner
emittedByBackgroundCompiler
emittedBySharedCompiler
normalizedByFilterLogic
consumedBySeed
consumedByContentBridge
consumedByBridgeSettings
jsonFirstFieldDecision
fieldEffectClass
targetProfile
targetListMode
activeRuleReason
storageKeyOwner
storageRevisionPolicy
messageRelayPolicy
seedNoWorkBudget
filterProcessBudget
bridgeLifecycleBudget
domFallbackParity
nativeRuntimeParity
positiveFixture
negativeDisabledFixture
negativeEmptyRuleFixture
negativeSiblingFixture
```

## Missing Runtime Authority Symbols

No product source currently defines:

```text
compiledSettingsFieldRegisterAuthority
compiledSettingsSchemaManifest
compiledSettingsFieldParityReport
compiledSettingsConsumerManifest
settingsJsonFirstFieldDecision
settingsJsonFirstNoWorkBudget
compiledSettingsRevisionContract
compiledSettingsFixtureProvenance
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
