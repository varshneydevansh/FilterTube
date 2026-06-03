# FilterTube Main Upnext Feed Watchpage2 Claim-Prefaced Lockup Continuation Current Behavior - 2026-05-23

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged. This is not an implementation patch.

This slice reduces `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json` into a small committed fixture for the late-loaded Main desktop watch up-next feed. The raw file starts with collaborator and implementation prose, then contains one balanced `/youtubei/v1/next` JSON fragment whose `appendContinuationItemsAction.targetId` is `watch-next-feed`.

The prose prelude is not collaborator proof. It contains suggested paths and collaborator claims, but the parsed JSON fragment has primary decorated-avatar channel identity only in the inspected rows and no parsed `showDialogCommand`, `coAuthors`, `ownerText`, `bylineText`, or `avatarStackViewModel` roster fields.

This is not completion proof for watch-surface authority. It proves one claim-prefaced watch-next-feed lockup continuation shape, not all watch-page, player, end-screen, compact-autoplay, playlist-panel, collaborator, or DOM rail behavior.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json` | 20079 | 863854 | `3916ffe4978ebaed0397d9f45d090541545f126ba4153dedfbecb9859d9ec8e8` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `tests/runtime/fixtures/captures/main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation.json` | 185 | 6857 | `3d327389d733d5e775cb81680de70925dfecf8c27cbb26508029776cfe856f74` |

## Current Counts

```text
Main upnext watchpage2 claim-prefaced source/fixture files: 3
raw direct JSON parse ok: false
raw balanced top-level JSON fragments: 1
raw fragment index: 0
raw fragment start line: 63
raw fragment bytes: 857711
parsed continuation targetId: watch-next-feed
parsed continuation items: 22
parsed lockupViewModel keys: 20
parsed shortsLockupViewModel keys: 3
parsed reelShelfRenderer keys: 1
parsed continuationItemRenderer keys: 1
parsed browseEndpoint keys: 20
parsed decoratedAvatarViewModel keys: 20
parsed compactAutoplayRenderer keys: 0
parsed autoplayVideo keys: 0
parsed nextButtonVideo keys: 0
parsed previousButtonVideo keys: 0
parsed endScreenVideoRenderer keys: 0
parsed playlistPanelVideoRenderer keys: 0
raw collaborator prose tokens: showDialogCommand=1, coAuthors=2, ownerText=1, bylineText=1
parsed collaborator roster keys: showDialogCommand=0, coAuthors=0, ownerText=0, bylineText=0, avatarStackViewModel=0
runtime fixture rows: 8
runtime behavior changed: no
not collaborator proof
not completion proof for watch-surface authority
```

## Reduced Fixture

`tests/runtime/fixtures/captures/main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation.json` keeps the parsed continuation wrapper:

```text
onResponseReceivedEndpoints.0.appendContinuationItemsAction.targetId = watch-next-feed
onResponseReceivedEndpoints.0.appendContinuationItemsAction.continuationItems.0.lockupViewModel
onResponseReceivedEndpoints.0.appendContinuationItemsAction.continuationItems.1.lockupViewModel
```

The first lockup is a video row:

```text
contentId: AM6n0J6ZXNo
title: Tron: Legacy - Ultimate Action Suite | Daft Punk
display channel: SuiteSound Music
channel id: UCkAQ2Y2bRUI4Cqyj5pc9wJQ
handle: /@SuiteSound_Music
watchEndpoint.videoId: AM6n0J6ZXNo
```

The second lockup is a video row:

```text
contentId: rI2gQ7K4F8g
title: NYUSHA с живым концертом на Авторадио (2024)
display channel: Авторадио
channel id: UC9D_41XZiozyLLeRKVQIBmQ
handle: /@AvtoradioMoscow
watchEndpoint.videoId: rI2gQ7K4F8g
```

## Current Runtime Findings

| Finding | Proof |
| --- | --- |
| Raw capture admission | `JSON.parse(YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json)` throws on the `Fantastic!` prose prelude, but balanced fragment extraction finds one top-level JSON fragment and parses it as a watch-next continuation. |
| Target id classification | The parsed action path is `onResponseReceivedEndpoints.0.appendContinuationItemsAction`, and `targetId` is `watch-next-feed`. |
| Prose collaborator boundary | The raw prelude names collaborator concepts, but those tokens do not appear as parsed roster keys in the JSON fragment; this capture must not be used as collaborator support without a separate parsed collaborator fixture. |
| Primary decorated-avatar identity path | Both reduced rows expose creator identity through `metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint`. |
| Blocklist SuiteSound decisions | Blocklist keyword `SuiteSound` and channel ID `UCkAQ2Y2bRUI4Cqyj5pc9wJQ` remove the matching first `lockupViewModel` while preserving the Avtoradio sibling. |
| Blocklist Avtoradio decisions | Blocklist keyword `Авторадио` and channel ID `UC9D_41XZiozyLLeRKVQIBmQ` remove the matching second `lockupViewModel` while preserving the SuiteSound sibling. |
| Whitelist row isolation | In whitelist mode, allowing either channel ID preserves only that matching row and removes the nonmatching sibling. |
| Map side effects | No-rule processing queues two `FilterTube_UpdateChannelMap` messages, one per creator, and one `FilterTube_UpdateVideoChannelMap` payload containing both video-to-channel pairs. |
| Capture status | `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json` is now partially extracted for claim-prefaced watch-next-feed lockup continuation; it still has zero parsed compact-autoplay, autoplay endpoint, end-screen, playlist-panel, or collaborator roster keys in this fragment. |

## Risks

| Risk area | Current risk |
| --- | --- |
| Reliability | Claim-prefaced capture files mix prose and JSON. Any future optimization that admits the whole raw file as direct JSON would fail, while any optimization that trusts the prose as parsed evidence would overstate collaborator coverage. |
| False-hide/leak | Whitelist and blocklist behavior currently works for two primary-channel video lockups, but the capture does not prove collaborator roster handling. A collaborator-aware change could leak or falsely hide rows if it treats prose-only claims as runtime data. |
| Performance | The no-rule path still traverses both lockups and emits channel/video map messages. JSON-first optimization needs to preserve required side effects while avoiding repeated expensive traversal on no-op rows. |
| Code burden | The watch/up-next family now includes prose-plus-fragments, claim-prefaced prose-plus-one-fragment, embedded `ytInitialData`, direct watch responses, and comment reload responses. A single watch-next bucket is too coarse for maintenance or release gates. |

## Missing Runtime Authority Symbols

These names are audit labels for missing future contract points. They are intentionally absent from product runtime source today.

```text
mainUpnextWatchpage2ClaimPrefacedContract
mainUpnextWatchpage2RawClaimClassifier
mainUpnextWatchpage2LockupDecisionReport
mainUpnextWatchpage2CollaboratorClaimPolicy
mainUpnextWatchpage2TargetIdPolicy
mainUpnextWatchpage2MapSideEffectReport
mainUpnextWatchpage2SiblingPreservationFixture
mainUpnextWatchpage2JsonFirstGate
```

## Runnable Proof

```bash
node --test tests/runtime/main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this Shorts/Reel/lockup surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, Shorts filtering behavior, Reel overlay
behavior, whitelist behavior, metric collectors, artifact creation, native
sync, release package changes, or public claims.
