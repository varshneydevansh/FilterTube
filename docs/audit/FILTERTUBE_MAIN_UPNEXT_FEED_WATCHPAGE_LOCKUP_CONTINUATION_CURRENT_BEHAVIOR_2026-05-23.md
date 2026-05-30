# FilterTube Main Upnext Feed Watchpage Lockup Continuation Current Behavior - 2026-05-23

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged. This is not an implementation patch.

This slice reduces `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json` into a small committed fixture for the late-loaded Main desktop watch up-next feed. The raw file is not direct JSON; it is prose plus balanced JSON fragments, and the parsed `/youtubei/v1/next` fragment appends `lockupViewModel` rows into `watch-next-feed`.

This is not completion proof for watch-surface authority. It proves one watch-next-feed lockup continuation shape, not all watch-page, player, end-screen, compact-autoplay, playlist-panel, or DOM rail behavior.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json` | 19918 | 852491 | `3732b657182676a97adfa527d19c6f32408ba90509dc8221504a3658db13b6d2` |
| `js/filter_logic.js` | 3498 | 165151 | `4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641` |
| `tests/runtime/fixtures/captures/main-upnext-feed-watchpage-lockup-continuation.json` | 151 | 5455 | `e3a412472da1fee0f6f9ed95599798d4c2a48f117308d0aaf0437737fea69404` |

## Current Counts

```text
Main upnext watchpage lockup source/fixture files: 3
raw direct JSON parse ok: false
raw balanced top-level JSON fragments: 2
raw watch-next fragment index: 1
raw watch-next fragment start line: 139
raw watch-next fragment bytes: 840530
parsed continuation targetId: watch-next-feed
parsed continuation items: 22
parsed lockupViewModel keys: 20
parsed reelShelfRenderer keys: 1
parsed continuationItemRenderer keys: 1
parsed compactAutoplayRenderer keys: 0
parsed endScreenVideoRenderer keys: 0
parsed playlistPanelVideoRenderer keys: 0
raw watch-next-feed literal tokens: 6
runtime fixture rows: 7
runtime behavior changed: no
not completion proof for watch-surface authority
```

## Reduced Fixture

`tests/runtime/fixtures/captures/main-upnext-feed-watchpage-lockup-continuation.json` keeps the parsed continuation wrapper:

```text
onResponseReceivedEndpoints.0.appendContinuationItemsAction.targetId = watch-next-feed
onResponseReceivedEndpoints.0.appendContinuationItemsAction.continuationItems.0.lockupViewModel
onResponseReceivedEndpoints.0.appendContinuationItemsAction.continuationItems.1.lockupViewModel
```

The first lockup is a video row:

```text
contentId: rI2gQ7K4F8g
title: NYUSHA с живым концертом на Авторадио (2024)
display channel: Авторадио
channel id: UC9D_41XZiozyLLeRKVQIBmQ
handle: /@AvtoradioMoscow
```

The second lockup is a Mix playlist row:

```text
contentId: RDGMEM0s70dY0AfCwh3LqQ-Bv1xg
contentType: LOCKUP_CONTENT_TYPE_PLAYLIST
title: Mix – K-pop
display metadata: BTS, BLACKPINK, j-hope and more
watchEndpoint.videoId: IHNzOHi8sJs
watchEndpoint.playlistId: RDGMEM0s70dY0AfCwh3LqQ-Bv1xg
creator channel identity: absent in the reduced row
```

## Current Runtime Findings

| Finding | Proof |
| --- | --- |
| Raw capture admission | `JSON.parse(YT_MAIN_UPNEXT_FEED_WATCHPAGE.json)` throws, but balanced fragment extraction finds two top-level JSON fragments and parses fragment index 1 as the watch-next continuation. |
| Target id classification | The parsed action path is `onResponseReceivedEndpoints.0.appendContinuationItemsAction`, and `targetId` is `watch-next-feed`. |
| Lockup blocklist title/channel decisions | Blocklist keyword `Авторадио` and channel ID `UC9D_41XZiozyLLeRKVQIBmQ` remove the matching first `lockupViewModel` while preserving the Mix sibling. |
| Mix display-only metadata identity boundary | Keyword `BLACKPINK` is searchable through display metadata, but a fake channel rule does not remove the Mix row because no creator channel identity exists in this reduced row. |
| Whitelist fail-closed unresolved Mix | In whitelist mode, allowing `UC9D_41XZiozyLLeRKVQIBmQ` preserves the matching first row and removes the unresolved Mix sibling. |
| Map side effects | No-rule processing queues one `FilterTube_UpdateChannelMap` entry for `UC9D_41XZiozyLLeRKVQIBmQ` and one `FilterTube_UpdateVideoChannelMap` entry for `rI2gQ7K4F8g`. |
| Capture status | `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json` is now partially extracted for watch-next-feed lockup continuation; it still has zero parsed `compactAutoplayRenderer`, `endScreenVideoRenderer`, `playlistPanelVideoRenderer`, `autoplayVideo`, `nextButtonVideo`, and `previousButtonVideo` keys in this parsed fragment. |

## Risks

| Risk area | Current risk |
| --- | --- |
| Reliability | Watch-next-feed data can arrive as a continuation fragment inside a non-direct-JSON capture, so JSON admission needs explicit fragment classification before optimization work trusts capture shape. |
| False-hide/leak | Supported video lockups and unresolved Mix lockups make different decisions in whitelist mode; optimizing whitelist without preserving this distinction can either leak unresolved rows or hide intended allowed rows. |
| Performance | The current no-rule path still traverses the continuation and queues channel/video map messages for resolvable lockups. Any optimization should account for no-rule traversal cost and side-effect budgets. |
| Code burden | Watch-page proof now spans direct watch responses, embedded `ytInitialData`, and late continuation fragments. A single generic watch label is too coarse for future maintenance. |

## Missing Runtime Authority Symbols

These names are audit labels for missing future contract points. They are intentionally absent from product runtime source today.

```text
mainUpnextWatchpageLockupContinuationContract
mainUpnextWatchpageLockupDecisionReport
mainUpnextWatchpageTargetIdPolicy
mainUpnextWatchpageMixIdentityPolicy
mainUpnextWatchpageMapSideEffectReport
mainUpnextWatchpageSiblingPreservationFixture
mainUpnextWatchpageMetricArtifact
mainUpnextWatchpageJsonFirstGate
```

## Runnable Proof

```bash
node --test tests/runtime/main-upnext-feed-watchpage-lockup-continuation-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this Shorts/Reel/lockup surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, Shorts filtering behavior, Reel overlay
behavior, whitelist behavior, metric collectors, artifact creation, native
sync, release package changes, or public claims.
