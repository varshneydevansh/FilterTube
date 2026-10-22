# YouTube advert content filtering — 2026-10-22

Status: source correction with executable regression coverage. Installed-extension retest remains required; this document does not establish release readiness.

## Observed failure and cause

The user reported adverts in `get_watch`, `browse`, and `next`, including a Home video masthead and a paused Watch advert. Read-only inspection of the linked Watch tab confirmed a sponsored player interruption and an adjacent sponsored recommendation. Its MAIN-world seed reported `settingsLoaded: false`, `hooksEstablished: true`, two queued globals, and `adVoid: disabled`; `FilterTubeEngine` was absent. This establishes missing initialization, rather than proving a user opt-out.

The startup predicate in `js/content_bridge.js` omitted `hideSponsoredCards`. With advert filtering as the only active feature it skipped the injector that forwards settings to the seed. Separately, the seed only removed four player-plan fields from Player/get_watch responses. It did not prune sponsored renderer owners from initial data, browse or next. General engine/route shortcuts also skipped advert-only work.

The live Watch data contained this structural path (content, identifiers and tracking values omitted):

```text
contents.twoColumnWatchNextResults.secondaryResults.secondaryResults
  .results[0].itemSectionRenderer.contents[0].adSlotRenderer
  .fulfillmentContent.fulfilledLayout.inFeedAdLayoutRenderer
```

Its initial player response also contained `playerAds` and `adPlacements[].adPlacementRenderer`. The user's masthead excerpt identifies `advertiserInfo.videoMastheadAdAdvertiserInfoRenderer`; its actual enclosing renderer was not captured in this run. Masthead regressions use an explicitly synthetic `videoMastheadAdV3Renderer` owner and preserve unrelated navigation mastheads.

## Correction and boundaries

- Advert-only settings now start MAIN-world initialization, while global Disabled and managed-route denial retain precedence.
- The seed sanitizes exact known advert owners before optional general-engine/restore shortcuts, including initial globals, browse, next, search, Player, get_watch and reel responses. It supports nested objects and top-level arrays, fetch and XHR. Empty ad-only wrappers with tracking/content-index metadata are removed; mixed content and continuations remain.
- Newly covered content responses remove player plans only inside explicit player response subtrees or a confirmed Player-shaped owner. Existing Player/get_watch plan handling is retained.
- Fetch work admission is checked when the response arrives, so settings arriving during a request can take effect. Disabled/no-work responses still avoid body parsing and serialization.
- DOM styles add exact advert masthead, promoted-video and mobile slot elements. Disabling or opting out clears their hiding styles. No generic header/masthead, title word, artist name or “Sponsored” text match is used.
- Original YouTube requests continue normally. There is no request cancellation, URL blocklist, extra API request, or new network-blocking permission.

The new tests execute production seed setters/fetch/XHR interception, actual startup/dispatch helpers and generated CSS. They preserve ordinary video/playability/streaming data, unrelated metadata, raw snapshot copies and pagination tokens. They are synthetic runtime fixtures, not installed-browser or physical-device proof. Opting out does not promise restoration of already-pruned initial JSON without reloading the page; that existing policy is unchanged.

## Validation

- Focused advert/startup/player/network checks: **90/90 passed**, including 46 new advert-specific checks. The original seed failed 15 of the first 18 interception regressions before the correction.
- `npm run test:smoke`: **360/360 passed**.
- `npm run test:blocking`: **299/299 passed**.
- `npm run test:release`: **252/252 passed**. These are source/package checks, not release approval.
- `npm run test:json`: **433/561 passed, 128 failed**. An isolated archive of pre-change HEAD `14f08c4b9734436ab1983ac84fad677dae24f668`, using the same locally available capture fixtures, produced **387/515 passed, 128 failed** without the 46 new advert tests. All 128 failure names match exactly. They include stale source records, broken fixture harnesses, output-shape mismatches and older semantic expectation conflicts; they are not all bookkeeping failures. Already-failing tests can mask later assertions, so this comparison is not proof that the broader JSON lane is healthy.
- `node --check` for the three modified runtime files and `git diff --check`: passed.
- `npm run build`: Chrome, Firefox and Opera v3.4.1 packages built locally. The three changed runtime files and generated README match source, staged output and each ZIP byte-for-byte.

Affected smoke/blocking/release audit fingerprints, anchors and lexical inventories were refreshed without removing semantic assertions. The path-ownership table was split into `scripts/test-lane-file-rules.mjs` because adding the regressions reached the existing 1,000-line workflow-file limit. The new module is included in classification and file-size checks. Existing Firefox Android JSON evidence also received explicit path ownership.

## Review and remaining acceptance

Two subagents reviewed interception, traversal, ownership and startup. A third requested model critique. Gemini failed upstream and Qwen returned truncated output; both were rejected. A completed GPT-OSS-120B response was generic and contained an incorrect guard criticism, which was rejected. Source inspection and executable tests own the conclusions here.

Browser automation could read the reported Watch page, but its URL policy rejected access to the installed extension settings page. No alternate route was used to bypass that restriction. A temporary Home tab also did not expose usable CDP diagnostics while its document response was paused. Therefore the patch has not been installed/reloaded and verified against live adverts in this run.

After reloading the locally built extension and YouTube, acceptance must verify that settings reach the seed, Advert Void activates only with consent, the reported paused interruption resolves without advancing the requested video, and Home/Watch continuations retain normal content with sponsored placements filtered. Confirm the masthead's actual enclosing renderer if it still appears. No GitHub issue comment, store submission, push or release publication is part of this correction.
