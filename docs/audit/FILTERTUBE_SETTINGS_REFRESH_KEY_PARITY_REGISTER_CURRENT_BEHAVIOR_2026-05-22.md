# FilterTube Settings Refresh Key Parity Register - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This slice promotes settings refresh and invalidation review from split gap
tests into a source-derived key parity register. It ties the background
compiler read list, background cache invalidation listener, shared settings
load/change keys, content bridge storage refresh keys, and StateManager
external reload keys into one current-behavior matrix.

This is not completion proof for storage-key authority, settings revision
ownership, dirty-key decisions, no-op refresh detection, DOM reprocess budgets,
main-world relay safety, UI reload correctness, or fixture provenance. It is a
current-behavior boundary before changing compiled settings fields, refresh
fanout, no-work optimizations, storage invalidation, or first-class JSON filter
behavior.

## Source Boundary

```text
source files with settings refresh key sets: 4
settings refresh key owner sets: 7
unique keys across owner sets: 49
background compiler storage-get keys: 43
background storage invalidation keys: 14
shared SETTINGS_KEYS entries: 36
shared SETTINGS_CHANGE_KEYS expanded entries: 38
shared loadSettings read keys expanded entries: 40
content bridge storage refresh keys: 42
StateManager external reload keys: 39
background compiler keys not invalidated by background listener: 30
background compiler keys not watched by content bridge refresh: 3
background compiler keys not watched by StateManager reload: 6
background compiler keys not present in shared SETTINGS_KEYS: 10
background compiler keys not present in shared loadSettings reads: 8
content bridge refresh keys not invalidated by background listener: 29
StateManager reload keys not invalidated by background listener: 28
shared SETTINGS_KEYS not read by background compiler: 3
runtime behavior changed: no
```

## Source Fingerprints

| Source file | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6711 | 301840 | `b27206ec2b6927fc33f823c4832ff95ace7c97bd4284eb950fc5964baf666346` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/content/bridge_settings.js` | 1113 | 44087 | `f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853` |
| `js/state_manager.js` | 2491 | 99780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |

## Key Owner Sets

```text
backgroundCompilerStorageGet (43): enabled,filterKeywords,uiKeywords,filterChannels,contentFilters,useExactWordMatching,filterKeywordsComments,filterChannelsAdditionalKeywords,uiChannels,hideAllShorts,hideAllComments,filterComments,hideHomeFeed,hideSponsoredCards,hideWatchPlaylistPanel,hidePlaylistCards,hideMembersOnly,hideMixPlaylists,hideVideoSidebar,hideRecommended,hideLiveChat,hideVideoInfo,hideVideoButtonsBar,hideAskButton,hideVideoChannelRow,hideVideoDescription,hideMerchTicketsOffers,hideEndscreenVideowall,hideEndscreenCards,disableAutoplay,disableAnnotations,hideTopHeader,hideNotificationBell,hideExploreTrending,hideMoreFromYouTube,hideSubscriptions,hideSearchShelves,channelMap,videoChannelMap,videoMetaMap,stats,ftProfilesV3,ftProfilesV4
backgroundStorageInvalidation (14): uiKeywords,filterKeywords,filterKeywordsComments,uiChannels,filterChannels,contentFilters,hideMembersOnly,hideAllShorts,hideComments,filterComments,hideHomeFeed,hideSponsoredCards,ftProfilesV3,ftProfilesV4
sharedSettingsKeys (36): enabled,filterKeywords,uiKeywords,filterChannels,hideAllShorts,hideAllComments,hideHomeFeed,hideSponsoredCards,hideWatchPlaylistPanel,hidePlaylistCards,hideMembersOnly,hideMixPlaylists,hideVideoSidebar,hideRecommended,hideLiveChat,hideVideoInfo,hideVideoButtonsBar,hideAskButton,hideVideoChannelRow,hideVideoDescription,hideMerchTicketsOffers,hideEndscreenVideowall,hideEndscreenCards,disableAutoplay,disableAnnotations,hideTopHeader,hideNotificationBell,hideExploreTrending,hideMoreFromYouTube,hideSubscriptions,showQuickBlockButton,showBlockMenuItem,hideSearchShelves,stats,statsBySurface,channelMap
sharedSettingsChangeKeysExpanded (38): channelMap,disableAnnotations,disableAutoplay,enabled,filterChannels,filterKeywords,ftAutoBackupEnabled,ftThemePreference,hideAllComments,hideAllShorts,hideAskButton,hideEndscreenCards,hideEndscreenVideowall,hideExploreTrending,hideHomeFeed,hideLiveChat,hideMembersOnly,hideMerchTicketsOffers,hideMixPlaylists,hideMoreFromYouTube,hideNotificationBell,hidePlaylistCards,hideRecommended,hideSearchShelves,hideSponsoredCards,hideSubscriptions,hideTopHeader,hideVideoButtonsBar,hideVideoChannelRow,hideVideoDescription,hideVideoInfo,hideVideoSidebar,hideWatchPlaylistPanel,showBlockMenuItem,showQuickBlockButton,stats,statsBySurface,uiKeywords
sharedLoadSettingsReadKeysExpanded (40): channelMap,disableAnnotations,disableAutoplay,enabled,filterChannels,filterKeywords,ftAutoBackupEnabled,ftProfilesV3,ftProfilesV4,ftThemePreference,hideAllComments,hideAllShorts,hideAskButton,hideEndscreenCards,hideEndscreenVideowall,hideExploreTrending,hideHomeFeed,hideLiveChat,hideMembersOnly,hideMerchTicketsOffers,hideMixPlaylists,hideMoreFromYouTube,hideNotificationBell,hidePlaylistCards,hideRecommended,hideSearchShelves,hideSponsoredCards,hideSubscriptions,hideTopHeader,hideVideoButtonsBar,hideVideoChannelRow,hideVideoDescription,hideVideoInfo,hideVideoSidebar,hideWatchPlaylistPanel,showBlockMenuItem,showQuickBlockButton,stats,statsBySurface,uiKeywords
contentBridgeStorageRefreshKeys (42): enabled,uiKeywords,filterKeywords,filterKeywordsComments,filterChannels,contentFilters,uiChannels,ftProfilesV3,ftProfilesV4,channelMap,videoChannelMap,videoMetaMap,hideAllComments,filterComments,hideAllShorts,hideHomeFeed,hideSponsoredCards,hideWatchPlaylistPanel,hidePlaylistCards,hideMembersOnly,hideMixPlaylists,hideVideoSidebar,hideRecommended,hideLiveChat,hideVideoInfo,hideVideoButtonsBar,hideAskButton,hideVideoChannelRow,hideVideoDescription,hideMerchTicketsOffers,hideEndscreenVideowall,hideEndscreenCards,disableAutoplay,disableAnnotations,hideTopHeader,hideNotificationBell,hideExploreTrending,hideMoreFromYouTube,hideSubscriptions,showQuickBlockButton,showBlockMenuItem,hideSearchShelves
stateManagerExternalReloadKeys (39): enabled,uiKeywords,filterKeywords,filterKeywordsComments,filterChannels,hideAllShorts,hideAllComments,filterComments,hideHomeFeed,hideSponsoredCards,hideWatchPlaylistPanel,hidePlaylistCards,hideMembersOnly,hideMixPlaylists,hideVideoSidebar,hideRecommended,hideLiveChat,hideVideoInfo,hideVideoButtonsBar,hideAskButton,hideVideoChannelRow,hideVideoDescription,hideMerchTicketsOffers,hideEndscreenVideowall,hideEndscreenCards,disableAutoplay,disableAnnotations,hideTopHeader,hideNotificationBell,hideExploreTrending,hideMoreFromYouTube,hideSubscriptions,showQuickBlockButton,showBlockMenuItem,hideSearchShelves,stats,channelMap,ftProfilesV3,ftProfilesV4
```

## Current Parity Deltas

```text
backgroundCompilerNotBackgroundInvalidation (30): channelMap,disableAnnotations,disableAutoplay,enabled,filterChannelsAdditionalKeywords,hideAllComments,hideAskButton,hideEndscreenCards,hideEndscreenVideowall,hideExploreTrending,hideLiveChat,hideMerchTicketsOffers,hideMixPlaylists,hideMoreFromYouTube,hideNotificationBell,hidePlaylistCards,hideRecommended,hideSearchShelves,hideSubscriptions,hideTopHeader,hideVideoButtonsBar,hideVideoChannelRow,hideVideoDescription,hideVideoInfo,hideVideoSidebar,hideWatchPlaylistPanel,stats,useExactWordMatching,videoChannelMap,videoMetaMap
backgroundCompilerNotContentBridgeRefresh (3): filterChannelsAdditionalKeywords,stats,useExactWordMatching
backgroundCompilerNotStateManagerReload (6): contentFilters,filterChannelsAdditionalKeywords,uiChannels,useExactWordMatching,videoChannelMap,videoMetaMap
backgroundCompilerNotSharedSettingsKeys (10): contentFilters,filterChannelsAdditionalKeywords,filterComments,filterKeywordsComments,ftProfilesV3,ftProfilesV4,uiChannels,useExactWordMatching,videoChannelMap,videoMetaMap
backgroundCompilerNotSharedLoadSettingsReads (8): contentFilters,filterChannelsAdditionalKeywords,filterComments,filterKeywordsComments,uiChannels,useExactWordMatching,videoChannelMap,videoMetaMap
contentBridgeRefreshNotBackgroundInvalidation (29): channelMap,disableAnnotations,disableAutoplay,enabled,hideAllComments,hideAskButton,hideEndscreenCards,hideEndscreenVideowall,hideExploreTrending,hideLiveChat,hideMerchTicketsOffers,hideMixPlaylists,hideMoreFromYouTube,hideNotificationBell,hidePlaylistCards,hideRecommended,hideSearchShelves,hideSubscriptions,hideTopHeader,hideVideoButtonsBar,hideVideoChannelRow,hideVideoDescription,hideVideoInfo,hideVideoSidebar,hideWatchPlaylistPanel,showBlockMenuItem,showQuickBlockButton,videoChannelMap,videoMetaMap
stateManagerReloadNotBackgroundInvalidation (28): channelMap,disableAnnotations,disableAutoplay,enabled,hideAllComments,hideAskButton,hideEndscreenCards,hideEndscreenVideowall,hideExploreTrending,hideLiveChat,hideMerchTicketsOffers,hideMixPlaylists,hideMoreFromYouTube,hideNotificationBell,hidePlaylistCards,hideRecommended,hideSearchShelves,hideSubscriptions,hideTopHeader,hideVideoButtonsBar,hideVideoChannelRow,hideVideoDescription,hideVideoInfo,hideVideoSidebar,hideWatchPlaylistPanel,showBlockMenuItem,showQuickBlockButton,stats
sharedSettingsKeysNotBackgroundCompiler (3): showBlockMenuItem,showQuickBlockButton,statsBySurface
```

## Presence Matrix

Columns: key, background compiler read, background invalidates, shared settings
key, shared change key, shared load key, content bridge refresh, StateManager
reload. `1` means present and `0` means absent.

```text
channelMap:1:0:1:1:1:1:1
contentFilters:1:1:0:0:0:1:0
disableAnnotations:1:0:1:1:1:1:1
disableAutoplay:1:0:1:1:1:1:1
enabled:1:0:1:1:1:1:1
filterChannels:1:1:1:1:1:1:1
filterChannelsAdditionalKeywords:1:0:0:0:0:0:0
filterComments:1:1:0:0:0:1:1
filterKeywords:1:1:1:1:1:1:1
filterKeywordsComments:1:1:0:0:0:1:1
ftAutoBackupEnabled:0:0:0:1:1:0:0
ftProfilesV3:1:1:0:0:1:1:1
ftProfilesV4:1:1:0:0:1:1:1
ftThemePreference:0:0:0:1:1:0:0
hideAllComments:1:0:1:1:1:1:1
hideAllShorts:1:1:1:1:1:1:1
hideAskButton:1:0:1:1:1:1:1
hideComments:0:1:0:0:0:0:0
hideEndscreenCards:1:0:1:1:1:1:1
hideEndscreenVideowall:1:0:1:1:1:1:1
hideExploreTrending:1:0:1:1:1:1:1
hideHomeFeed:1:1:1:1:1:1:1
hideLiveChat:1:0:1:1:1:1:1
hideMembersOnly:1:1:1:1:1:1:1
hideMerchTicketsOffers:1:0:1:1:1:1:1
hideMixPlaylists:1:0:1:1:1:1:1
hideMoreFromYouTube:1:0:1:1:1:1:1
hideNotificationBell:1:0:1:1:1:1:1
hidePlaylistCards:1:0:1:1:1:1:1
hideRecommended:1:0:1:1:1:1:1
hideSearchShelves:1:0:1:1:1:1:1
hideSponsoredCards:1:1:1:1:1:1:1
hideSubscriptions:1:0:1:1:1:1:1
hideTopHeader:1:0:1:1:1:1:1
hideVideoButtonsBar:1:0:1:1:1:1:1
hideVideoChannelRow:1:0:1:1:1:1:1
hideVideoDescription:1:0:1:1:1:1:1
hideVideoInfo:1:0:1:1:1:1:1
hideVideoSidebar:1:0:1:1:1:1:1
hideWatchPlaylistPanel:1:0:1:1:1:1:1
showBlockMenuItem:0:0:1:1:1:1:1
showQuickBlockButton:0:0:1:1:1:1:1
stats:1:0:1:1:1:0:1
statsBySurface:0:0:1:1:1:0:0
uiChannels:1:1:0:0:0:1:0
uiKeywords:1:1:1:1:1:1:1
useExactWordMatching:1:0:0:0:0:0:0
videoChannelMap:1:0:0:0:0:1:0
videoMetaMap:1:0:0:0:0:1:0
```

## Current Behavior Boundaries

- Background compile reads 43 storage keys, but the background storage listener
  invalidates only 14 keys. Several watch/player, quick-block, map, exact-match,
  and stats inputs are outside background invalidation.
- Content bridge refresh watches 42 keys and can force a background pull plus DOM
  fallback reprocess. `videoChannelMap` and `videoMetaMap` are map-only
  refreshes that avoid forced DOM reprocess; `channelMap` alone returns early.
- StateManager external reload watches 39 keys and skips `channelMap`-only
  changes, but it does not watch `contentFilters`, `uiChannels`,
  `useExactWordMatching`, `videoChannelMap`, `videoMetaMap`, or
  `filterChannelsAdditionalKeywords`.
- Shared settings `SETTINGS_KEYS` has 36 entries and includes stats/dashboard
  keys that are not part of the background compiler read list, while omitting
  several runtime compiler dependencies.
- `hideComments` is a legacy background invalidation key that is not part of the
  current background compiler storage-get list. `hideAllComments` is a compiler
  input but is not a background invalidation key.
- No owner currently emits a dirty-key report, revision id, no-op refresh result,
  active-rule diff, DOM reprocess decision, or per-key work budget.

## Risk Notes

Reliability risk follows from split refresh ownership. A field can be read by
the background compiler, watched by content bridge, ignored by StateManager, and
not invalidate the background cache. Without one key manifest, a save can leave
one consumer stale while another reprocesses immediately.

False-hide/leak risk follows from mode and map drift. List mode, whitelist
sources, learned maps, exact-match behavior, content/category filters, and
watch/player booleans can change allow/block behavior. If a key refreshes one
surface but not another, old settings can hide visible siblings or allow blocked
targets until a broader refresh happens.

Performance risk follows from over-broad refresh. Content bridge storage
changes can force a background settings pull and DOM fallback reprocess, and
background mutation broadcasts can still send `FilterTube_RefreshNow` without a
changed-key payload. Without no-op and active-rule deltas, optimization work
cannot prove which refreshes are safe to skip.

Code-burden risk follows from duplicated key lists. Background, shared settings,
content bridge, and StateManager each encode their own key vocabulary. Any
first-class JSON filter field or compiled-settings cleanup needs proof that its
storage key, compiler field, refresh listener, bridge relay, seed update, DOM
rerun, and UI reload behavior are all aligned.

## Future Proof Fields

Each refresh-affecting key must eventually be backed by owner, reason, revision,
consumer, and fixture evidence:

```text
settingsRefreshKeyReference
storageKey
keyOwner
compilerDependency
backgroundInvalidationDependency
sharedSettingsDependency
contentBridgeRefreshDependency
stateManagerReloadDependency
jsonFirstFieldDecision
dirtyKeyDecision
settingsRevisionBefore
settingsRevisionAfter
noOpRefreshDecision
activeRuleDelta
domReprocessDecision
seedUpdateDecision
mainWorldRelayDecision
uiReloadDecision
networkWorkBudget
domWorkBudget
messageWorkBudget
positiveFixture
negativeNoOpFixture
negativeDisabledFixture
negativeSiblingFixture
```

## Missing Runtime Authority Symbols

No product source currently defines:

```text
settingsRefreshKeyParityAuthority
settingsRefreshKeyManifest
settingsRefreshRevisionContract
settingsDirtyKeyDecision
settingsNoOpRefreshReport
settingsConsumerRefreshMatrix
settingsRefreshWorkBudget
settingsRefreshFixtureProvenance
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
