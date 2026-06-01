# FilterTube Function Coverage Artifact - 2026-05-17

Generated from the current worktree. This is an audit artifact, not an implementation change. It maps lexical functions and nested helpers in the page-resident hot runtime stack to audit families and required proof gates.

Scope: `js/seed.js`, `js/injector.js`, `js/content_bridge.js`, `js/content/dom_fallback.js`, `js/content/block_channel.js`, `js/content/bridge_settings.js`, `js/content/handle_resolver.js`, `js/background.js`, `js/filter_logic.js`.

Limitations: detection is lexical. Nested helper ranges end at the next detected function start, so marker detection is conservative. A row proves a function exists and has a proposed audit family; it does not prove runtime safety until fixtures/counters exist.

Important scope boundary: this artifact is not complete codebase function
coverage yet. It currently maps the hottest page-resident and background
runtime stack, then records every known JS/MJS source file outside that lexical
map as an explicit follow-up surface. That boundary is intentional audit
evidence: unlisted callable files must not disappear from the complete-codebase
goal just because they are outside the first hot-path parser.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Summary

- Total lexical functions / nested helpers: 788
- js/seed.js: 21
- js/injector.js: 103
- js/content_bridge.js: 330
- js/content/dom_fallback.js: 80
- js/content/block_channel.js: 61
- js/content/bridge_settings.js: 22
- js/content/handle_resolver.js: 7
- js/background.js: 139
- js/filter_logic.js: 25

## Family Counts

| Family | Count | Required proof gate |
| --- | ---: | --- |
| background storage/action | 29 | backgroundActionRegistry declaration |
| filter/hide decision | 155 | activeRuntimeReport + structured hide reason |
| general helper | 151 | covered by caller family or promote to named family |
| identity/metadata extraction | 231 | channelMatchResult confidence + route scope |
| import/export/trust | 14 | trusted UI action token + import report |
| lifecycle/scheduling | 37 | install/pause/resume/teardown counters |
| network/json transport | 55 | explicit endpoint decision + side-effect budget |
| settings/runtime authority | 65 | background-owned revision / one apply |
| ui/dom affordance | 51 | visible affordance + user action gate |

## Files Not Yet Lexically Mapped

These source files are classified by source-surface inventory, but their
individual functions/helpers have not yet been expanded into the table below.
They are not exempt from the audit; they are the next callable-surface backlog.

| Family | Files | Audit risk |
| --- | --- | --- |
| Content runtime helpers | `js/content/bridge_injection.js`, `js/content/collab_dialog.js`, `js/content/dom_extractors.js`, `js/content/dom_helpers.js`, `js/content/first_run_prompt.js`, `js/content/menu.js`, `js/content/release_notes_prompt.js`, `js/shared/identity.js` | Content-page lifecycle, identity extraction, menu/prompt behavior, and shared identity constants still need function-level rows. |
| Extension UI and settings runtime | `js/content_controls_catalog.js`, `js/io_manager.js`, `js/nanah_sync_adapter.js`, `js/popup.js`, `js/render_engine.js`, `js/security_manager.js`, `js/settings_shared.js`, `js/state_manager.js`, `js/tab-view.js`, `js/ui_components.js` | UI mutation, import/export, Nanah sync, settings migration, profile persistence, and dashboard affordances need callable-level proof. |
| Generated or quarantined UI files | `src/extension-shell/popup.jsx`, `src/extension-shell/tab-view-decor.jsx`, `src/extension-shell/shared/runtime.js`, `js/layout.js`, `js/ui-shell/popup-shell.js`, `js/ui-shell/tab-view-decor.js` | `layout.js` is packaged but quarantined; generated shell source and generated output need freshness/source proof rather than hand-audited behavior assumptions. |
| Vendor bundles | `js/vendor/nanah.bundle.js`, `js/vendor/qrcode.bundle.js` | Vendor bundles need source-revision and API-boundary proof, not line-by-line product logic ownership. |
| Build and sync scripts | `scripts/build-extension-ui.mjs`, `scripts/build-nanah-vendor.mjs`, `scripts/sync-native-runtime.mjs` | Release/build/sync automation can change shipped code and native app parity; function-level release gates are still pending. |
| Website app routes | `website/app/[slug]/page.js`, `website/app/downloads/page.js`, `website/app/layout.js`, `website/app/not-found.js`, `website/app/page.js`, `website/app/privacy/page.js`, `website/app/robots.js`, `website/app/sitemap.js`, `website/app/terms/page.js` | Public policy/download/platform claims and metadata generation need callable-level classification for release truth. |
| Website components | `website/components/browser-logo-rail.js`, `website/components/marketing-ui.js`, `website/components/reveal.js`, `website/components/route-content.js`, `website/components/scene-controller.js`, `website/components/scenic-detail-page.js`, `website/components/scenic-illustration.js`, `website/components/scenic-tones.js`, `website/components/site-data.js`, `website/components/site-footer.js`, `website/components/site-header.js`, `website/components/site-shell-data.js`, `website/components/theme-toggle.js` | Public navigation/copy/theme/animation components need separate website-audited callable proof. |

## UI / Settings Callable Expansion Pass 1

The UI/settings runtime has a dedicated first-pass callable artifact:
`docs/audit/FILTERTUBE_UI_SETTINGS_CALLABLE_AUDIT_2026-05-18.md`.

That pass does not replace this hot-path map and does not complete every UI
method's behavioral proof. It does move the `Extension UI and settings runtime`
backlog from "unclassified" to source-counted and public-surface classified:

- 10 UI/settings files accounted for.
- 621 lexical UI/settings callables pinned by
  `tests/runtime/ui-settings-callable-current-behavior.test.mjs`.
- Public surfaces pinned: `FilterTubeSettings`, `FilterTubeIO`,
  `FilterTubeNanahAdapter`, `FilterTubeSecurity`, `StateManager`,
  `RenderEngine`, `UIComponents`, and `FilterTubeContentControlsCatalog`.

Remaining UI/settings proof still required: action-level fixtures for import,
export, Nanah apply, profile switching, list-mode changes, row actions,
settings saves, and UI listener idempotence.

## Content Helper Callable Expansion Pass 1

The content-helper runtime has a dedicated first-pass callable artifact:
`docs/audit/FILTERTUBE_CONTENT_HELPER_CALLABLE_AUDIT_2026-05-18.md`.

That pass moves the `Content runtime helpers` backlog from "unclassified" to
source-counted and public/global-surface classified:

- 8 content-helper files accounted for.
- 81 lexical content-helper callables pinned by
  `tests/runtime/content-helper-callable-current-behavior.test.mjs`.
- Public/global surfaces pinned: `injectMainWorldScripts`,
  `window.collabDialogModule`, DOM extractor globals, DOM hide helpers, prompt
  scripts, menu style helper, and `FilterTubeIdentity`.

Remaining content-helper proof still required: action-level fixtures for
page-message authentication, collaborator dialog late init, cached identity
freshness, route-scoped selector families, `innerText` scan budgets,
hide/restore side effects, prompt queueing, and menu CSS scoping.

## Build / Website Callable Expansion Pass 1

The build/release and website public-surface runtime has a dedicated first-pass
callable artifact:
`docs/audit/FILTERTUBE_BUILD_WEBSITE_CALLABLE_AUDIT_2026-05-18.md`.

That pass moves the `Build and sync scripts`, `Website app routes`, and
`Website components` backlog from "unclassified" to source-counted and
public-surface classified:

- 26 build/website files accounted for.
- 82 lexical build/website callables pinned by
  `tests/runtime/build-website-callable-current-behavior.test.mjs`.
- Public/release surfaces pinned: extension packaging, generated UI shell,
  README badge mutation, mobile artifact staging, GitHub release creation,
  Nanah vendor bundle generation, native runtime sync delegation, website-only
  analytics, downloads CTAs, remote browser-logo CDN requests, hero video
  preload, platform status copy, and sitemap dates.

Remaining build/website proof still required: action-level fixtures for
release asset manifests, draft-first GitHub release publishing, vendor/source
hash provenance, native app runtime freshness, local-vs-remote website assets,
download CTA gating, website video budgets, and public status copy gates.

## Static / Generated / Vendor Expansion Pass 1

The static/generated/vendor surface has a dedicated first-pass artifact:
`docs/audit/FILTERTUBE_STATIC_GENERATED_VENDOR_AUDIT_2026-05-18.md`.

That pass moves the generated-shell, vendor, active CSS, quarantined CSS, HTML,
release-note data, and static-asset families from source-only accounting into
current-behavior fixture coverage:

- Extension HTML load order and external request surfaces pinned.
- `src/extension-shell/*` and `js/ui-shell/*` source/output boundary pinned.
- `css/filter.css`, `css/content.css`, and `css/layout.css` default-hide risk
  pinned as quarantined, not manifest-loaded.
- Nanah/QR vendor globals, staged release-note version drift, and Opera
  web-accessible resource parity pinned by
  `tests/runtime/static-generated-vendor-current-behavior.test.mjs`.

Remaining static/generated/vendor proof still required: generated-output
freshness check, vendor/source hash manifest, extension-page local-font or
disclosure decision, static asset budgets, and a decision on the empty
`html/troubleshoot.html` support surface.

## Source Boundary Expansion Pass 1

The source/evidence boundary has a dedicated current-behavior artifact:
`docs/audit/FILTERTUBE_SOURCE_BOUNDARY_AUDIT_2026-05-18.md`.

That pass does not add product callable coverage, but it prevents false
callable accounting:

- `git ls-files` is the source authority for method-level auditing.
- Ignored root HTML/JSON/TXT/JS captures are raw evidence, not runtime source.
- `dist/`, dependency caches, website build output, and dotfile caches are
  generated/dependency output, not source authority.
- Current nonignored untracked files are audit docs/tests only.

This matters for the complete audit because files such as
`WHITELIST_content.JS`, `playlist.js`, and `dist/*/js/filter_logic.js` should
not be counted as additional current runtime implementations. They can inform
fixtures or release-package parity, but source behavior must trace back to the
tracked files.

## All Callable Index Pass 1

The repo-wide callable surface has a dedicated index:
`docs/audit/FILTERTUBE_ALL_CALLABLE_INDEX_2026-05-18.md`.

That pass does not prove behavior, but it closes the first accounting gap: every
tracked JS/JSX/MJS file now has a lexical callable count and family assignment.

- 69 tracked JS/JSX/MJS files accounted for by `git ls-files`.
- 5,681 lexical callables pinned by
  `tests/runtime/all-callable-index-current-behavior.test.mjs`.
- Family totals: hot runtime 2,930, content helpers 298, UI/settings 1,556,
  generated/quarantined UI 147, vendor bundles 279, build/sync scripts 52,
  and website routes/components/config 56.
- Ignored raw captures and generated/dependency output are explicitly excluded
  from callable source authority.

Remaining proof still required: promote the lexical rows into behavior fixtures
and counters, especially for route policy, DOM/JSON hide authority, settings
mutation authority, page-message trust, lifecycle teardown, release artifact
truth, vendor provenance, and website asset budgets.

## js/seed.js

| Line | Function/helper | Family | Detected markers | Required proof gate |
| ---: | --- | --- | --- | --- |
| 23 | `filterTubeSeedDebugEnabled` | settings/runtime authority | none detected | background-owned revision / one apply |
| 41 | `stashNetworkSnapshot` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 98 | `replayPendingQueueIfReady` | lifecycle/scheduling | none detected | install/pause/resume/teardown counters |
| 127 | `scheduleReplay` | lifecycle/scheduling | timer/raf | install/pause/resume/teardown counters |
| 138 | `isSeedDebugEnabled` | settings/runtime authority | none detected | background-owned revision / one apply |
| 149 | `seedDebugLog` | settings/runtime authority | message | background-owned revision / one apply |
| 179 | `cloneData` | general helper | none detected | covered by caller family or promote to named family |
| 195 | `shouldSkipEngineProcessing` | general helper | none detected | covered by caller family or promote to named family |
| 334 | `processWithEngine` | general helper | none detected | covered by caller family or promote to named family |
| 340 | `queueForLater` | lifecycle/scheduling | none detected | install/pause/resume/teardown counters |
| 437 | `basicProcessing` | general helper | none detected | covered by caller family or promote to named family |
| 496 | `establishDataHooks` | lifecycle/scheduling | none detected | install/pause/resume/teardown counters |
| 605 | `setupFetchInterception` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 613 | `getPathname` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 690 | `setupXhrInterception` | network/json transport | network | explicit endpoint decision + side-effect budget |
| 712 | `getPathname` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 723 | `getWrappedListener` | lifecycle/scheduling | none detected | install/pause/resume/teardown counters |
| 733 | `wrapped` | general helper | none detected | covered by caller family or promote to named family |
| 746 | `ensureXhrResponseProcessed` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 871 | `processIfReady` | lifecycle/scheduling | none detected | install/pause/resume/teardown counters |
| 901 | `updateSettings` | settings/runtime authority | engagement | background-owned revision / one apply |

## js/injector.js

| Line | Function/helper | Family | Detected markers | Required proof gate |
| ---: | --- | --- | --- | --- |
| 6 | `announceSubscriptionsImportBridgeReady` | lifecycle/scheduling | message | install/pause/resume/teardown counters |
| 21 | `handleSubscriptionsImportBridgeMessage` | identity/metadata extraction | message | channelMatchResult confidence + route scope |
| 68 | `installSubscriptionsImportBridge` | lifecycle/scheduling | message | install/pause/resume/teardown counters |
| 106 | `postLog` | general helper | message | covered by caller family or promote to named family |
| 148 | `extractRawHandle` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 188 | `hasStrongCollaboratorIdentity` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 197 | `normalizeCompositeCollaboratorLabel` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 212 | `collaboratorCompositeLabelVariants` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 223 | `isPlaceholderCollaboratorEntry` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 232 | `isCompositeNameOnlyCollaborator` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 263 | `sanitizeCollaboratorList` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 287 | `markCollaboratorListSource` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 304 | `getCollaboratorListSource` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 308 | `getCollaboratorListQuality` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 321 | `normalizeLooseText` | general helper | none detected | covered by caller family or promote to named family |
| 326 | `normalizeExpectedHandle` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 333 | `safeStructuredClone` | general helper | none detected | covered by caller family or promote to named family |
| 348 | `sleep` | general helper | timer/raf | covered by caller family or promote to named family |
| 352 | `getYtcfgValue` | general helper | none detected | covered by caller family or promote to named family |
| 375 | `extractTextFromRenderer` | ui/dom affordance | none detected | visible affordance + user action gate |
| 388 | `normalizeThumbnailUrl` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 396 | `buildSubscriptionImportHeaders` | import/export/trust | none detected | trusted UI action token + import report |
| 418 | `buildSubscriptionImportRequestProfiles` | settings/runtime authority | none detected | background-owned revision / one apply |
| 496 | `isMobileHost` | general helper | none detected | covered by caller family or promote to named family |
| 516 | `isYoutubeChannelsFeedPath` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 524 | `detectLoggedOutBrowseResponse` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 552 | `collectSubscriptionImportArtifacts` | import/export/trust | none detected | trusted UI action token + import report |
| 559 | `pushContinuationRequest` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 574 | `visit` | general helper | none detected | covered by caller family or promote to named family |
| 643 | `collectSubscriptionImportDomSeed` | settings/runtime authority | none detected | background-owned revision / one apply |
| 654 | `addSource` | general helper | dom-query | covered by caller family or promote to named family |
| 722 | `collectSubscriptionImportPageSeed` | settings/runtime authority | none detected | background-owned revision / one apply |
| 818 | `buildSubscriptionImportContext` | import/export/trust | none detected | trusted UI action token + import report |
| 831 | `isElementVisibleForSubscriptionsImport` | ui/dom affordance | none detected | visible affordance + user action gate |
| 839 | `getSubscriptionImportMoreButtons` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 853 | `expandSubscriptionsImportPageSeed` | settings/runtime authority | none detected | background-owned revision / one apply |
| 864 | `performScrollStep` | general helper | engagement | covered by caller family or promote to named family |
| 931 | `getLatestSubscriptionImportBrowseSnapshotTs` | ui/dom affordance | none detected | visible affordance + user action gate |
| 948 | `waitForSubscriptionImportSeed` | settings/runtime authority | none detected | background-owned revision / one apply |
| 955 | `shouldKeepWaitingForGrowth` | lifecycle/scheduling | none detected | install/pause/resume/teardown counters |
| 1010 | `getSubscriptionImportEntryKey` | import/export/trust | none detected | trusted UI action token + import report |
| 1020 | `normalizeSubscriptionImportEntry` | import/export/trust | none detected | trusted UI action token + import report |
| 1078 | `mergeSubscriptionImportEntries` | import/export/trust | none detected | trusted UI action token + import report |
| 1111 | `getSubscriptionsImportTrackedMatches` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1150 | `buildSubscriptionsImportSample` | import/export/trust | none detected | trusted UI action token + import report |
| 1161 | `summarizeSubscriptionImportResponse` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 1183 | `visit` | general helper | none detected | covered by caller family or promote to named family |
| 1227 | `logSubscriptionsImport` | import/export/trust | none detected | trusted UI action token + import report |
| 1237 | `fetchSubscribedChannelsFromYoutubei` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 1259 | `postProgress` | general helper | message | covered by caller family or promote to named family |
| 1331 | `queueInitialProfile` | settings/runtime authority | none detected | background-owned revision / one apply |
| 1349 | `queueContinuation` | network/json transport | timer/raf, network | explicit endpoint decision + side-effect budget |
| 1688 | `tokenizeExpectedCollaboratorNames` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1692 | `pushToken` | general helper | none detected | covered by caller family or promote to named family |
| 1731 | `buildExpectedMatcher` | general helper | none detected | covered by caller family or promote to named family |
| 1777 | `isValidCollaboratorResponse` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 1820 | `scoreCollaboratorCandidate` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1852 | `cacheCollaboratorsIfBetter` | identity/metadata extraction | message | channelMatchResult confidence + route scope |
| 2007 | `extractCollaboratorsFromDataObject` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2009 | `extractFromAvatarStackViewModel` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2015 | `parseBrowseIdFromUrl` | ui/dom affordance | none detected | visible affordance + user action gate |
| 2021 | `pickEndpointUrl` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 2031 | `resolveBrowseEndpoint` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 2085 | `extractFromSheetLikeCommand` | general helper | none detected | covered by caller family or promote to named family |
| 2088 | `normalizeUcId` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2093 | `pickTextContent` | general helper | none detected | covered by caller family or promote to named family |
| 2105 | `pickTitleText` | general helper | none detected | covered by caller family or promote to named family |
| 2110 | `pickSubtitleText` | general helper | none detected | covered by caller family or promote to named family |
| 2115 | `resolveCommandContext` | general helper | none detected | covered by caller family or promote to named family |
| 2203 | `extractCollaboratorsFromListItems` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2332 | `scan` | general helper | none detected | covered by caller family or promote to named family |
| 2373 | `deepScanForShowDialog` | general helper | none detected | covered by caller family or promote to named family |
| 2447 | `normalizeChannelName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2451 | `extractCustomUrlFromCanonicalBaseUrl` | general helper | none detected | covered by caller family or promote to named family |
| 2456 | `decoded` | general helper | none detected | covered by caller family or promote to named family |
| 2482 | `extractChannelLogoFromObject` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2504 | `mergeChannelCandidates` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2518 | `searchYtInitialDataForVideoChannel` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2541 | `isWatchContext` | general helper | none detected | covered by caller family or promote to named family |
| 2549 | `isCurrentWatchVideo` | general helper | none detected | covered by caller family or promote to named family |
| 2558 | `extractOwnerCandidate` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2591 | `extractThumbnailOwnerCandidate` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2630 | `extractFromPlayerResponse` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 2647 | `watchOwnerCandidate` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2652 | `scan` | general helper | none detected | covered by caller family or promote to named family |
| 2728 | `matchesExpectations` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 2748 | `extractVideoIdFromNode` | general helper | none detected | covered by caller family or promote to named family |
| 2774 | `pickSingleChannelFromCollaborators` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2806 | `extractSingleChannelFromSheetLikeData` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2811 | `searchNode` | general helper | none detected | covered by caller family or promote to named family |
| 2987 | `searchRoot` | general helper | none detected | covered by caller family or promote to named family |
| 3003 | `playerCandidate` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 3054 | `searchYtInitialDataForCollaborators` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 3092 | `extractVideoIdFromNode` | general helper | none detected | covered by caller family or promote to named family |
| 3121 | `searchObject` | general helper | dom-query | covered by caller family or promote to named family |
| 3213 | `currentVideoId` | general helper | dom-query | covered by caller family or promote to named family |
| 3237 | `hydrateFromStampedAttributes` | general helper | none detected | covered by caller family or promote to named family |
| 3255 | `attemptExtraction` | general helper | dom-query | covered by caller family or promote to named family |
| 3335 | `updateSeedSettings` | settings/runtime authority | timer/raf | background-owned revision / one apply |
| 3357 | `processDataWithFilterLogic` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 3375 | `processInitialDataQueue` | lifecycle/scheduling | none detected | install/pause/resume/teardown counters |
| 3401 | `connectToSeedGlobal` | settings/runtime authority | timer/raf | background-owned revision / one apply |
| 3440 | `setupAdditionalHooks` | lifecycle/scheduling | timer/raf, message, engagement | install/pause/resume/teardown counters |

## js/content_bridge.js

| Line | Function/helper | Family | Detected markers | Required proof gate |
| ---: | --- | --- | --- | --- |
| 1 | `isFilterTubeDebugEnabled` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 9 | `filterTubeDebugLog` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 14 | `isFilterTubeNativeOverlayQuietMode` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 29 | `extractJsonObjectFromHtml` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 80 | `extractCustomUrlFromHref` | general helper | none detected | covered by caller family or promote to named family |
| 91 | `isLowConfidenceExpectedChannelLabel` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 117 | `buildChannelMetadataPayload` | settings/runtime authority | none detected | background-owned revision / one apply |
| 122 | `isHandleLike` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 127 | `isUcIdLike` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 132 | `isProbablyNotChannelName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 159 | `isProbablyNotDisplayHandle` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 193 | `pickMenuChannelDisplayName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 204 | `isHandleLike` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 209 | `isUcIdLike` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 214 | `isProbablyNotChannelName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 248 | `mappedHandle` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 278 | `hydrateChannelInfoFromCurrentMappings` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 343 | `collectCardTitleHints` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 357 | `isProbablyTitleHint` | general helper | none detected | covered by caller family or promote to named family |
| 378 | `addHint` | general helper | dom-query | covered by caller family or promote to named family |
| 408 | `upsertFilterChannel` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 430 | `registerActiveCollaborationMenu` | ui/dom affordance | none detected | visible affordance + user action gate |
| 457 | `unregisterActiveCollaborationMenu` | ui/dom affordance | none detected | visible affordance + user action gate |
| 469 | `cleanupDropdownState` | ui/dom affordance | none detected | visible affordance + user action gate |
| 486 | `forceCloseDropdown` | ui/dom affordance | none detected | visible affordance + user action gate |
| 490 | `hasVisibleMiniplayer` | general helper | timer/raf, hide-write, engagement, dom-query | covered by caller family or promote to named family |
| 553 | `clearFilterTubeMenuItems` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 558 | `waitForNextFrameDelay` | lifecycle/scheduling | none detected | install/pause/resume/teardown counters |
| 561 | `schedule` | lifecycle/scheduling | timer/raf | install/pause/resume/teardown counters |
| 569 | `injectCollaboratorPlaceholderMenu` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 573 | `buildPlaceholderContent` | general helper | none detected | covered by caller family or promote to named family |
| 586 | `makeItem` | general helper | dom-query | covered by caller family or promote to named family |
| 614 | `makeItem` | general helper | none detected | covered by caller family or promote to named family |
| 634 | `getMenuContainers` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 659 | `renderFilterTubeMenuEntries` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 706 | `hasIdentifier` | general helper | none detected | covered by caller family or promote to named family |
| 771 | `singleChannelInjectionOptions` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 789 | `updateInjectedMenuChannelName` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 805 | `isHandleLike` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 807 | `isUcIdLike` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 811 | `isProbablyNotChannelName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 844 | `refreshActiveCollaborationMenu` | settings/runtime authority | dom-query | background-owned revision / one apply |
| 948 | `getStatsSurfaceKey` | general helper | none detected | covered by caller family or promote to named family |
| 972 | `schedulePrefetchScan` | network/json transport | timer/raf | explicit endpoint decision + side-effect budget |
| 981 | `attachPrefetchObservers` | network/json transport | dom-query | explicit endpoint decision + side-effect budget |
| 1010 | `startCardPrefetchObserver` | network/json transport | observer | explicit endpoint decision + side-effect budget |
| 1036 | `installPlaylistPanelPrefetchHook` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 1040 | `schedule` | lifecycle/scheduling | observer, dom-query | install/pause/resume/teardown counters |
| 1060 | `attach` | general helper | dom-query | covered by caller family or promote to named family |
| 1080 | `installRightRailWhitelistObserver` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1084 | `scheduleWhitelistRefresh` | settings/runtime authority | observer, timer/raf | background-owned revision / one apply |
| 1114 | `attach` | general helper | dom-query | covered by caller family or promote to named family |
| 1143 | `queuePrefetchForCard` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 1197 | `drainPrefetchQueue` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 1209 | `withTimeout` | lifecycle/scheduling | timer/raf | install/pause/resume/teardown counters |
| 1216 | `prefetchIdentityForCard` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 1309 | `stampChannelIdentity` | identity/metadata extraction | timer/raf | channelMatchResult confidence + route scope |
| 1332 | `resetCardIdentityIfStale` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 1404 | `cardContainsVideoIdLink` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 1419 | `shouldStampCardForVideoId` | ui/dom affordance | none detected | visible affordance + user action gate |
| 1453 | `resolveIdFromHandle` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1463 | `persistVideoChannelMapping` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1475 | `persistVideoMetaMapping` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1540 | `scheduleVideoMetaDomRerun` | lifecycle/scheduling | timer/raf | install/pause/resume/teardown counters |
| 1554 | `touchDomForVideoMetaUpdate` | ui/dom affordance | none detected | visible affordance + user action gate |
| 1560 | `register` | general helper | dom-query | covered by caller family or promote to named family |
| 1619 | `scheduleVideoMetaFetch` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 1623 | `wants` | general helper | none detected | covered by caller family or promote to named family |
| 1696 | `processWatchMetaFetchQueue` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 1714 | `fetchVideoMetaFromWatchUrl` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 1720 | `extractJsonObjectFromHtml` | network/json transport | network, dom-query | explicit endpoint decision + side-effect budget |
| 1891 | `generateCollaborationGroupId` | general helper | none detected | covered by caller family or promote to named family |
| 1913 | `findStoredChannelEntry` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1929 | `scheduleDropdownCleanup` | lifecycle/scheduling | timer/raf | install/pause/resume/teardown counters |
| 1944 | `cancelDropdownCleanup` | ui/dom affordance | none detected | visible affordance + user action gate |
| 1953 | `getCollaboratorKey` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1959 | `clearMultiStepStateForDropdown` | ui/dom affordance | none detected | visible affordance + user action gate |
| 1968 | `updateMultiStepActionLabel` | general helper | dom-query | covered by caller family or promote to named family |
| 1985 | `setTitleParts` | general helper | none detected | covered by caller family or promote to named family |
| 2010 | `isFilterAllToggleActive` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 2018 | `applyFilterAllStateToToggle` | settings/runtime authority | none detected | background-owned revision / one apply |
| 2027 | `persistFilterAllStateForMenuItem` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 2046 | `hydrateFilterAllToggle` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 2056 | `getFilterAllPreference` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 2070 | `getFilterAllPreferenceForCollaborator` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 2076 | `refreshMultiStepSelections` | settings/runtime authority | dom-query | background-owned revision / one apply |
| 2095 | `setupMultiStepMenu` | lifecycle/scheduling | timer/raf, dom-query | install/pause/resume/teardown counters |
| 2141 | `toggleMultiStepSelection` | ui/dom affordance | none detected | visible affordance + user action gate |
| 2160 | `applyBlockedVisualState` | settings/runtime authority | dom-query | background-owned revision / one apply |
| 2177 | `forceDropdownResize` | ui/dom affordance | engagement, dom-query | visible affordance + user action gate |
| 2195 | `markMultiStepSelection` | general helper | dom-query | covered by caller family or promote to named family |
| 2218 | `applyHandleMetadata` | settings/runtime authority | none detected | background-owned revision / one apply |
| 2236 | `isPlaceholderCollaboratorEntry` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2246 | `hasStrongCollaboratorIdentity` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2255 | `normalizeCompositeCollaboratorLabel` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2270 | `collaboratorCompositeLabelVariants` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2281 | `isCompositeNameOnlyCollaborator` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2312 | `sanitizeCollaboratorListWithMeta` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2359 | `sanitizeCollaboratorList` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2363 | `resolveExpectedCollaboratorCount` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2378 | `getCollaboratorListQuality` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2391 | `extractCollaboratorsFromAvatarStackElement` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 2440 | `mergeCollaboratorLists` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2477 | `getCachedCollaboratorsFromCard` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2499 | `getValidatedCachedCollaborators` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2561 | `clearCollaboratorMetadataFromCard` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2575 | `buildCollaboratorSignature` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2583 | `hasCompleteCollaboratorRoster` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2590 | `parseCollaboratorNames` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2617 | `pushName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2647 | `hasAttributedCollaboratorSignal` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2658 | `normalizeLooseChannelLabel` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2669 | `extractYtmBylineFromAriaLabel` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2679 | `extractYtmBylineText` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 2698 | `getDesktopLockupMetadataRows` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 2723 | `normalizeMetadataRowText` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2727 | `isStatsMetadataRowText` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2738 | `extractDesktopLockupBylineText` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2748 | `isDesktopWatchPlaylistPanelCard` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 2767 | `isWatchPlaylistLikeCard` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 2774 | `extractDesktopWatchPlaylistBylineText` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 2797 | `extractDesktopWatchLikeBylineText` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2801 | `countDistinctChannelLinks` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 2827 | `textFromRendererTextLike` | ui/dom affordance | none detected | visible affordance + user action gate |
| 2838 | `normalizeChannelNameFromRendererData` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2856 | `extractChannelNameFromRendererData` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2909 | `isMixTitleText` | general helper | none detected | covered by caller family or promote to named family |
| 2913 | `hasMixRendererDataSignal` | ui/dom affordance | none detected | visible affordance + user action gate |
| 2990 | `getRendererDataCandidatesForElement` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2994 | `add` | general helper | none detected | covered by caller family or promote to named family |
| 3001 | `addElementSources` | ui/dom affordance | none detected | visible affordance + user action gate |
| 3036 | `isMixCardElement` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 3111 | `generateCollabEntryKey` | general helper | none detected | covered by caller family or promote to named family |
| 3122 | `markCardForDialogEnrichment` | ui/dom affordance | timer/raf | visible affordance + user action gate |
| 3169 | `scheduleCollaboratorRetry` | identity/metadata extraction | timer/raf | channelMatchResult confidence + route scope |
| 3186 | `buildCollaboratorLookupRequestOptions` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 3197 | `pushExpectedNameHints` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 3216 | `pushCollaboratorHints` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 3240 | `requestCollaboratorEnrichment` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 3297 | `applyResolvedCollaborators` | settings/runtime authority | none detected | background-owned revision / one apply |
| 3327 | `applyToCard` | settings/runtime authority | timer/raf, dom-query | background-owned revision / one apply |
| 3393 | `applyCollaboratorsByVideoId` | settings/runtime authority | dom-query | background-owned revision / one apply |
| 3434 | `updateCard` | ui/dom affordance | timer/raf, dom-query | visible affordance + user action gate |
| 3489 | `initializeStats` | lifecycle/scheduling | storage | install/pause/resume/teardown counters |
| 3524 | `getContentType` | general helper | dom-query | covered by caller family or promote to named family |
| 3576 | `estimateTimeSaved` | settings/runtime authority | none detected | background-owned revision / one apply |
| 3606 | `incrementHiddenStats` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 3679 | `decrementHiddenStats` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 3701 | `saveStats` | settings/runtime authority | storage | background-owned revision / one apply |
| 3736 | `handleMediaPlayback` | identity/metadata extraction | engagement, dom-query | channelMatchResult confidence + route scope |
| 3776 | `extractCollaboratorMetadataFromRenderer` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 3780 | `extractListItemsFromSheetLikeCommand` | general helper | none detected | covered by caller family or promote to named family |
| 3803 | `getSheetLikeCommandTitle` | general helper | none detected | covered by caller family or promote to named family |
| 3829 | `isCollaboratorsSheetLikeCommand` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 3834 | `extractFromSheetLikeCommand` | general helper | none detected | covered by caller family or promote to named family |
| 3981 | `scan` | general helper | none detected | covered by caller family or promote to named family |
| 4018 | `hydrateCollaboratorsFromRendererData` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 4063 | `extractCollaboratorMetadataFromElement` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 4154 | `hydrateCollaboratorsFromLinks` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 4197 | `cacheResultAndMaybeEnrich` | general helper | dom-query | covered by caller family or promote to named family |
| 4430 | `mappedId` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 4434 | `mappedHandle` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 4472 | `mappedId` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 4476 | `mappedHandle` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 4547 | `isYtmWatchLikeCollaboratorCard` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 4561 | `isDesktopWatchLikeCollaboratorCard` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 4579 | `getWatchLikeCollaborationWarmup` | general helper | dom-query | covered by caller family or promote to named family |
| 4607 | `promoteYtmWatchRowIdentityFromCollaboratorMetadata` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 4652 | `nameLooksWeak` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 4695 | `cardHasCollaborationDomSignal` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 4721 | `normalizeCollaboratorChannelInfoForCard` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 4857 | `promoteChannelInfoFromCollaboratorSignals` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 4894 | `bylineText` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 4939 | `normalizeHandleForComparison` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 4945 | `channelMatchesFilter` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 4955 | `addMetaHandle` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 4964 | `addFilterHandle` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 5145 | `requestCollaboratorInfoFromMainWorld` | network/json transport | timer/raf | explicit endpoint decision + side-effect budget |
| 5165 | `sendRequest` | network/json transport | timer/raf, message | explicit endpoint decision + side-effect budget |
| 5196 | `requestChannelInfoFromMainWorld` | network/json transport | timer/raf | explicit endpoint decision + side-effect budget |
| 5212 | `sendRequest` | network/json transport | timer/raf, message | explicit endpoint decision + side-effect budget |
| 5241 | `requestSubscribedChannelsFromMainWorld` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 5248 | `armTimeout` | lifecycle/scheduling | timer/raf, message | install/pause/resume/teardown counters |
| 5289 | `normalizeCollaboratorName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5299 | `mergeCollaboratorsWithMainWorld` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5309 | `tryMatch` | general helper | none detected | covered by caller family or promote to named family |
| 5320 | `normalizeUcIdForCollaborator` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5326 | `isHandleLikeForCollaborator` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5331 | `isUcIdLikeForCollaborator` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5336 | `isProbablyNotChannelNameForCollaborator` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5356 | `isWeakCollaboratorName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5441 | `enrichCollaboratorsWithMainWorld` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 5466 | `handleMainWorldMessages` | identity/metadata extraction | timer/raf, storage, dom-query | channelMatchResult confidence + route scope |
| 5702 | `initialize` | lifecycle/scheduling | none detected | install/pause/resume/teardown counters |
| 5715 | `initializeDOMFallback` | lifecycle/scheduling | timer/raf | install/pause/resume/teardown counters |
| 5742 | `scheduleImmediateFallback` | lifecycle/scheduling | timer/raf | install/pause/resume/teardown counters |
| 5782 | `scheduleWhitelistPendingRecheck` | filter/hide decision | timer/raf | activeRuntimeReport + structured hide reason |
| 5797 | `queueWhitelistPendingHide` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 5802 | `queueCandidate` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5808 | `collectCandidates` | identity/metadata extraction | timer/raf, dom-query | channelMatchResult confidence + route scope |
| 5844 | `applyWhitelistPendingHide` | settings/runtime authority | none detected | background-owned revision / one apply |
| 5855 | `shouldSkipPendingHide` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 5880 | `resolveTargetToHide` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 5899 | `hidePending` | filter/hide decision | hide-write, dom-query | activeRuntimeReport + structured hide reason |
| 5955 | `fallbackRelevantSelector` | general helper | none detected | covered by caller family or promote to named family |
| 5983 | `nodeLooksFallbackRelevant` | general helper | dom-query | covered by caller family or promote to named family |
| 6006 | `fallbackMutationSummary` | general helper | observer | covered by caller family or promote to named family |
| 6035 | `observeTarget` | general helper | none detected | covered by caller family or promote to named family |
| 6060 | `ensureFallbackMenuButtons` | ui/dom affordance | none detected | visible affordance + user action gate |
| 6263 | `cardHasNativeMenuButton` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 6272 | `cleanupFallbackArtifacts` | general helper | dom-query | covered by caller family or promote to named family |
| 6288 | `ensureInjectedSlot` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 6309 | `getMenuHostForCard` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 6401 | `createFallbackButton` | ui/dom affordance | none detected | visible affordance + user action gate |
| 6433 | `ensureFallbackButtonForCard` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 6496 | `scan` | general helper | dom-query | covered by caller family or promote to named family |
| 6540 | `scheduleScan` | lifecycle/scheduling | none detected | install/pause/resume/teardown counters |
| 6544 | `runScan` | general helper | observer, timer/raf | covered by caller family or promote to named family |
| 6566 | `observeTarget` | general helper | timer/raf | covered by caller family or promote to named family |
| 6627 | `refreshOpenPlaylistFallbackPopoverForVideo` | settings/runtime authority | timer/raf | background-owned revision / one apply |
| 6648 | `openFilterTubePlaylistFallbackPopover` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 6654 | `close` | general helper | none detected | covered by caller family or promote to named family |
| 6697 | `ensuredVideoId` | general helper | none detected | covered by caller family or promote to named family |
| 6709 | `fallbackTitleHint` | general helper | none detected | covered by caller family or promote to named family |
| 6716 | `getExpectedName` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 6739 | `title` | general helper | none detected | covered by caller family or promote to named family |
| 6750 | `hasIdentifier` | general helper | none detected | covered by caller family or promote to named family |
| 6752 | `createFallbackMenuRow` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 6844 | `performBlock` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 6846 | `hideRowImmediately` | filter/hide decision | hide-write | activeRuntimeReport + structured hide reason |
| 7059 | `bindFallbackRow` | ui/dom affordance | none detected | visible affordance + user action gate |
| 7061 | `pulsePressedState` | general helper | timer/raf | covered by caller family or promote to named family |
| 7099 | `resolveFallbackBaseInfo` | general helper | none detected | covered by caller family or promote to named family |
| 7123 | `renderFallbackRows` | ui/dom affordance | observer, dom-query | visible affordance + user action gate |
| 7260 | `injectCollaboratorPlaceholderMenu` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 7264 | `buildPlaceholderContent` | general helper | none detected | covered by caller family or promote to named family |
| 7277 | `makeItem` | general helper | none detected | covered by caller family or promote to named family |
| 7296 | `makeItem` | general helper | dom-query | covered by caller family or promote to named family |
| 7318 | `debounce` | lifecycle/scheduling | timer/raf | install/pause/resume/teardown counters |
| 7349 | `searchYtInitialDataForVideoChannel` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 7387 | `inFlight` | general helper | none detected | covered by caller family or promote to named family |
| 7406 | `normalizeName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 7461 | `extractChannelFromInitialData` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 7465 | `normalizeChannelName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 7476 | `matchesExpectations` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 7499 | `mergeCandidates` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 7518 | `extractMobileThumbnailOwnerCandidate` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 7556 | `pickSingleSheetCandidate` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 7585 | `searchNode` | general helper | none detected | covered by caller family or promote to named family |
| 7721 | `enrichVisibleShortsWithChannelInfo` | filter/hide decision | hide-write, dom-query | activeRuntimeReport + structured hide reason |
| 7866 | `fetchWatchIdentityFromBackground` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 7877 | `fetchPromise` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 7880 | `profileType` | settings/runtime authority | none detected | background-owned revision / one apply |
| 7922 | `enrichVisiblePlaylistRowsWithChannelInfo` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 7944 | `hideRow` | filter/hide decision | hide-write | activeRuntimeReport + structured hide reason |
| 8050 | `fetchChannelFromShortsUrl` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 8076 | `fetchPromise` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 8118 | `fetchChannelFromShortsUrlDirect` | network/json transport | network | explicit endpoint decision + side-effect budget |
| 8250 | `fetchChannelFromWatchUrl` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 8268 | `fetchPromise` | network/json transport | network | explicit endpoint decision + side-effect budget |
| 8285 | `decodeHtmlEntities` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 8294 | `decodeEmbeddedUrlValue` | general helper | none detected | covered by caller family or promote to named family |
| 8301 | `extractMetaContent` | general helper | none detected | covered by caller family or promote to named family |
| 8314 | `extractCanonicalHref` | general helper | none detected | covered by caller family or promote to named family |
| 8319 | `learnIdentityFromUrlLike` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 8343 | `withLearnedIdentity` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 8385 | `parseEmbeddedObject` | general helper | none detected | covered by caller family or promote to named family |
| 8560 | `extractChannelFromCard` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 8565 | `normalizeAvatarUrl` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 8573 | `extractImageUrl` | general helper | none detected | covered by caller family or promote to named family |
| 8593 | `extractAvatarUrl` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 8631 | `normalizeYtmChannelName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 8650 | `extractMobileChannelSurfaceInfo` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 8652 | `textFromRuns` | general helper | dom-query | covered by caller family or promote to named family |
| 8764 | `normalizeNameCandidate` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 8803 | `pickBestName` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 9065 | `deriveMixName` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 9402 | `mappedId` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 10030 | `mappedFallbackId` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 10036 | `mappedFallbackHandle` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 10089 | `injectFilterTubeMenuItem` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 10247 | `isUcIdLike` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 10251 | `isHandleLike` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 10295 | `waitForMenu` | lifecycle/scheduling | none detected | install/pause/resume/teardown counters |
| 10301 | `isDropdownOpen` | ui/dom affordance | none detected | visible affordance + user action gate |
| 10312 | `finalize` | general helper | none detected | covered by caller family or promote to named family |
| 10323 | `checkMenu` | ui/dom affordance | observer, timer/raf, dom-query | visible affordance + user action gate |
| 10572 | `fetchPromise` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 10602 | `videoCardStampedId` | ui/dom affordance | none detected | visible affordance + user action gate |
| 10610 | `videoCardStampedHandle` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 10683 | `isHandleLike` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 10688 | `isUcIdLike` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 10693 | `isProbablyNotChannelName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 10827 | `attachFilterTubeMenuHandlers` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 10852 | `handleInteraction` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 10897 | `createFilterTubeIconElement` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 10917 | `createFilterTubeTitleElement` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 10938 | `createFilterTubePlaceholderContent` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 10974 | `injectIntoNewMenu` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 11094 | `injectIntoOldMenu` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 11341 | `checkIfChannelBlocked` | filter/hide decision | storage, dom-query | activeRuntimeReport + structured hide reason |
| 11397 | `markElementAsBlocked` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 11417 | `clearBlockedElementAttributes` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 11436 | `isCommentContextTag` | general helper | none detected | covered by caller family or promote to named family |
| 11440 | `resolveCommentHideTarget` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 11447 | `isShortsContentElement` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 11475 | `extractShortsVideoIdFromElement` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 11490 | `resolveClickedContentHideTarget` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 11516 | `syncBlockedElementsWithFilters` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 11522 | `isStillBlocked` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 11557 | `handleBlockChannelClick` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 11573 | `clickSnapshot` | ui/dom affordance | none detected | visible affordance + user action gate |
| 11627 | `recordOptimisticHide` | filter/hide decision | hide-write | activeRuntimeReport + structured hide reason |
| 11648 | `restoreOptimisticHide` | filter/hide decision | hide-write | activeRuntimeReport + structured hide reason |
| 11666 | `restoreAttr` | general helper | none detected | covered by caller family or promote to named family |
| 11683 | `confirmOptimisticHide` | filter/hide decision | hide-write, dom-query | activeRuntimeReport + structured hide reason |
| 11735 | `isUcIdLike` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 11739 | `isHandleLike` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 11744 | `isProbablyNotChannelName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 11813 | `resolveFilterAllPreference` | filter/hide decision | timer/raf, hide-write, dom-query | activeRuntimeReport + structured hide reason |
| 11995 | `isUcIdLike` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 12000 | `isProbablyNotChannelName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 12014 | `clickedVideoCardId` | ui/dom affordance | none detected | visible affordance + user action gate |
| 12021 | `preserveIdentity` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 12117 | `broadcastChannelMapping` | identity/metadata extraction | message | channelMatchResult confidence + route scope |
| 12181 | `mappedWatchChannelId` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 12269 | `captureFilterAllSelection` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 12344 | `cacheTarget` | general helper | timer/raf, network, storage, hide-write, dom-query | covered by caller family or promote to named family |
| 12791 | `addChannelDirectly` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 12850 | `addFilterAllContentCheckbox` | filter/hide decision | timer/raf, dom-query | activeRuntimeReport + structured hide reason |

## js/content/dom_fallback.js

| Line | Function/helper | Family | Detected markers | Required proof gate |
| ---: | --- | --- | --- | --- |
| 14 | `getFilteringTracker` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 27 | `getListSignatureForRun` | general helper | none detected | covered by caller family or promote to named family |
| 71 | `normalizeUcIdForComparison` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 77 | `normalizeChannelNameForComparison` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 82 | `normalizeCustomUrlForComparison` | general helper | none detected | covered by caller family or promote to named family |
| 108 | `isFilterTubeMixOrRadioElement` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 157 | `isPlaylistPanelRowElement` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 169 | `getPlaylistPanelRow` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 185 | `getPlaylistPanelRows` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 197 | `getPlaylistPanelContainer` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 209 | `isSelectedPlaylistPanelRow` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 227 | `extractPlaylistPanelBylineChannelName` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 244 | `normalizeHandleForComparison` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 261 | `getCompiledKeywordRegexes` | settings/runtime authority | none detected | background-owned revision / one apply |
| 295 | `getChannelMapLookup` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 308 | `getCompiledChannelFilterIndex` | settings/runtime authority | none detected | background-owned revision / one apply |
| 334 | `addId` | general helper | none detected | covered by caller family or promote to named family |
| 339 | `addHandle` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 357 | `addCustomUrl` | general helper | none detected | covered by caller family or promote to named family |
| 364 | `addName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 447 | `channelMetaMatchesIndex` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 494 | `isCreatorChannelPagePath` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 504 | `getCurrentPageChannelMeta` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 578 | `getCurrentWatchVideoId` | general helper | none detected | covered by caller family or promote to named family |
| 591 | `getCurrentWatchOwnerMeta` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 613 | `mappedId` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 624 | `ownerName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 679 | `getPlaylistRowVideoId` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 695 | `getPlaylistRowChannelName` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 713 | `findNextAllowedWatchPlaylistLink` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 760 | `openWatchPlaylistPanelIfCollapsed` | filter/hide decision | engagement, dom-query | activeRuntimeReport + structured hide reason |
| 781 | `enforceCurrentWatchOwnerBlock` | filter/hide decision | engagement, dom-query | activeRuntimeReport + structured hide reason |
| 831 | `hasPlaylistRowsNow` | filter/hide decision | timer/raf, hide-write, engagement, dom-query | activeRuntimeReport + structured hide reason |
| 931 | `markedChannelIsStillBlocked` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 962 | `channelMatchesFilter` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 970 | `markElementAsBlocked` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 989 | `clearBlockedElementAttributes` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 999 | `isExplicitlyHiddenByFilterTube` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1047 | `hasExplicitHideReasonMarker` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1062 | `ensureContentControlStyles` | ui/dom affordance | none detected | visible affordance + user action gate |
| 1072 | `supportsHasSelector` | general helper | none detected | covered by caller family or promote to named family |
| 1407 | `hideYouTubeOpenAppButtons` | filter/hide decision | hide-write, dom-query | activeRuntimeReport + structured hide reason |
| 1429 | `normalizeTextForMatching` | general helper | none detected | covered by caller family or promote to named family |
| 1446 | `extractPlainKeyword` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1464 | `isAlphanumeric` | general helper | none detected | covered by caller family or promote to named family |
| 1478 | `matchesKeyword` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1518 | `collectMobileCommentEntryCards` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 1549 | `handleHomeFeedFallback` | identity/metadata extraction | hide-write, dom-query | channelMatchResult confidence + route scope |
| 1573 | `handleCommentsFallback` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 1793 | `readBlocked` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 1886 | `handleGuideSubscriptionsFallback` | identity/metadata extraction | dom-query | channelMatchResult confidence + route scope |
| 1931 | `hasActiveDOMFallbackWork` | ui/dom affordance | none detected | visible affordance + user action gate |
| 1938 | `hasList` | general helper | none detected | covered by caller family or promote to named family |
| 1999 | `clearStaleDOMFallbackVisibility` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 2034 | `applyDOMFallback` | settings/runtime authority | none detected | background-owned revision / one apply |
| 2054 | `yieldToMain` | general helper | timer/raf | covered by caller family or promote to named family |
| 2062 | `supportsHasSelector` | general helper | hide-write, dom-query | covered by caller family or promote to named family |
| 2328 | `isWatchPage` | general helper | dom-query | covered by caller family or promote to named family |
| 2363 | `pickNext` | general helper | timer/raf, engagement, dom-query | covered by caller family or promote to named family |
| 2472 | `isHomeOrSearch` | general helper | dom-query | covered by caller family or promote to named family |
| 2956 | `playlistMappedChannelId` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 3088 | `addRichMeta` | general helper | dom-query | covered by caller family or promote to named family |
| 3221 | `parseDateMs` | general helper | none detected | covered by caller family or promote to named family |
| 3226 | `parseRelativeTimeToTimestamp` | general helper | none detected | covered by caller family or promote to named family |
| 3267 | `resolvePublishTimestamp` | general helper | dom-query | covered by caller family or promote to named family |
| 3323 | `isWatchPlaylistRow` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 3366 | `needsTimestamp` | general helper | dom-query | covered by caller family or promote to named family |
| 3519 | `isKidsHost` | general helper | dom-query | covered by caller family or promote to named family |
| 3567 | `isKidsHost` | general helper | none detected | covered by caller family or promote to named family |
| 3575 | `debugEnabled` | general helper | none detected | covered by caller family or promote to named family |
| 3583 | `hasActiveBlockRules` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 3593 | `hasEnabledContentFilters` | filter/hide decision | timer/raf, hide-write, dom-query | activeRuntimeReport + structured hide reason |
| 3795 | `hasExplicitBlockMarker` | filter/hide decision | timer/raf, engagement, dom-query | activeRuntimeReport + structured hide reason |
| 3845 | `hasActiveListFilters` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 3855 | `hasExplicitHiddenMarker` | filter/hide decision | hide-write, dom-query | activeRuntimeReport + structured hide reason |
| 4116 | `extractShortsVideoId` | filter/hide decision | hide-write, dom-query | activeRuntimeReport + structured hide reason |
| 4482 | `pickNext` | general helper | timer/raf, engagement, dom-query | covered by caller family or promote to named family |
| 4535 | `shouldHideContent` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 4547 | `logWhitelistDecision` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 4550 | `debugEnabled` | general helper | none detected | covered by caller family or promote to named family |

## js/content/block_channel.js

| Line | Function/helper | Family | Detected markers | Required proof gate |
| ---: | --- | --- | --- | --- |
| 5 | `blockChannelDebugLog` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 26 | `isWhitelistModeActive` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 34 | `cleanupInjectedMenuItems` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 105 | `isMobileYouTubeSurface` | general helper | none detected | covered by caller family or promote to named family |
| 126 | `isHoverCapableDesktopSurface` | ui/dom affordance | none detected | visible affordance + user action gate |
| 135 | `isElementVisibleForQuickBlock` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 151 | `isMobileSearchSurfaceOpen` | general helper | dom-query | covered by caller family or promote to named family |
| 189 | `isYouTubeOverlaySurfaceOpen` | general helper | dom-query | covered by caller family or promote to named family |
| 220 | `syncQuickBlockSurfaceState` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 228 | `isMobileWatchNextQuickBlockHost` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 263 | `isPostLikeQuickBlockCard` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 275 | `isShortsQuickBlockCard` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 290 | `resolveQuickBlockHost` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 324 | `resolveQuickBlockHideTarget` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 350 | `isRenderableQuickBlockAnchor` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 367 | `resolveQuickBlockAnchor` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 438 | `getQuickBlockBoundsElement` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 460 | `getQuickBlockTopOcclusionPx` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 505 | `getQuickBlockSampledTopOcclusionPx` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 544 | `getQuickBlockBottomOcclusionTopPx` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 585 | `getQuickBlockSampledBottomOcclusionTopPx` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 632 | `pointInsideQuickBlockElementRect` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 648 | `pointInsideQuickBlockHost` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 653 | `updateQuickBlockViewportStateForHost` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 681 | `scheduleQuickBlockViewportRefresh` | settings/runtime authority | timer/raf, dom-query | background-owned revision / one apply |
| 696 | `setQuickBlockHoverStateForHost` | filter/hide decision | timer/raf | activeRuntimeReport + structured hide reason |
| 806 | `isQuickBlockEnabled` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 817 | `ensureQuickBlockStyles` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 930 | `removeQuickBlockButtons` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 939 | `createSyntheticQuickBlockMenuItem` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 949 | `collectQuickBlockCollaborators` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1040 | `buildQuickBlockContext` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 1062 | `isPostCard` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 1104 | `getQuickBlockActionInfo` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1138 | `buildQuickBlockFallbackMetadata` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1150 | `getQuickBlockInput` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1168 | `runQuickBlockFallback` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1222 | `applyQuickBlockImmediateHide` | settings/runtime authority | hide-write | background-owned revision / one apply |
| 1237 | `runQuickBlockAction` | filter/hide decision | timer/raf | activeRuntimeReport + structured hide reason |
| 1271 | `attachQuickBlockWrapHoverEvents` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1276 | `activate` | general helper | none detected | covered by caller family or promote to named family |
| 1277 | `release` | general helper | none detected | covered by caller family or promote to named family |
| 1285 | `ensureQuickBlockButton` | filter/hide decision | timer/raf, dom-query | activeRuntimeReport + structured hide reason |
| 1433 | `sweepQuickBlockButtons` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 1444 | `scheduleQuickBlockSweep` | filter/hide decision | timer/raf | activeRuntimeReport + structured hide reason |
| 1452 | `setupQuickBlockObserver` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1457 | `boot` | general helper | timer/raf | covered by caller family or promote to named family |
| 1509 | `clearLast` | general helper | none detected | covered by caller family or promote to named family |
| 1516 | `pickHostFromPoint` | general helper | dom-query | covered by caller family or promote to named family |
| 1547 | `tick` | general helper | observer, timer/raf, dom-query | covered by caller family or promote to named family |
| 1668 | `setupMenuObserver` | lifecycle/scheduling | timer/raf, dom-query | install/pause/resume/teardown counters |
| 1700 | `ensureDropdownVisibilityObserver` | lifecycle/scheduling | observer | install/pause/resume/teardown counters |
| 1734 | `startObserver` | lifecycle/scheduling | observer, timer/raf, dom-query | install/pause/resume/teardown counters |
| 1796 | `setupKidsPassiveBlockListener` | filter/hide decision | dom-query | activeRuntimeReport + structured hide reason |
| 1815 | `waitBody` | lifecycle/scheduling | observer, timer/raf, dom-query | install/pause/resume/teardown counters |
| 1841 | `captureKidsMenuContext` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 1880 | `decoded` | general helper | dom-query | covered by caller family or promote to named family |
| 1964 | `handleKidsNativeBlock` | filter/hide decision | timer/raf | activeRuntimeReport + structured hide reason |
| 2065 | `tryInjectIntoVisibleDropdown` | ui/dom affordance | dom-query | visible affordance + user action gate |
| 2093 | `handleDropdownAppeared` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2112 | `handleDropdownAppearedInternal` | identity/metadata extraction | observer, timer/raf, hide-write, dom-query | channelMatchResult confidence + route scope |

## js/content/bridge_settings.js

| Line | Function/helper | Family | Detected markers | Required proof gate |
| ---: | --- | --- | --- | --- |
| 32 | `markMainWorldImportBridgeReady` | lifecycle/scheduling | none detected | install/pause/resume/teardown counters |
| 44 | `markMainWorldSubscriptionsImportReady` | lifecycle/scheduling | none detected | install/pause/resume/teardown counters |
| 56 | `waitForMainWorldImportBridgeReady` | lifecycle/scheduling | none detected | install/pause/resume/teardown counters |
| 68 | `finish` | general helper | timer/raf | covered by caller family or promote to named family |
| 79 | `waitForMainWorldSubscriptionsImportReady` | lifecycle/scheduling | none detected | install/pause/resume/teardown counters |
| 91 | `finish` | general helper | timer/raf | covered by caller family or promote to named family |
| 110 | `armTimeout` | lifecycle/scheduling | timer/raf, message | install/pause/resume/teardown counters |
| 285 | `expectedProfile` | settings/runtime authority | none detected | background-owned revision / one apply |
| 320 | `normalizeSettingsForHost` | settings/runtime authority | none detected | background-owned revision / one apply |
| 334 | `debugEnabled` | general helper | none detected | covered by caller family or promote to named family |
| 351 | `requestSettingsFromBackground` | settings/runtime authority | none detected | background-owned revision / one apply |
| 354 | `safeResolveFailure` | general helper | none detected | covered by caller family or promote to named family |
| 357 | `sendRuntimeMessage` | settings/runtime authority | none detected | background-owned revision / one apply |
| 377 | `profileType` | settings/runtime authority | none detected | background-owned revision / one apply |
| 415 | `debugEnabled` | general helper | none detected | covered by caller family or promote to named family |
| 424 | `host` | general helper | none detected | covered by caller family or promote to named family |
| 466 | `tryApplySettingsToSeed` | settings/runtime authority | none detected | background-owned revision / one apply |
| 479 | `ensureSeedReadyListener` | settings/runtime authority | none detected | background-owned revision / one apply |
| 489 | `scheduleSeedRetry` | settings/runtime authority | timer/raf | background-owned revision / one apply |
| 499 | `sendSettingsToMainWorld` | settings/runtime authority | message | background-owned revision / one apply |
| 519 | `scheduleSettingsRefreshFromStorage` | settings/runtime authority | timer/raf | background-owned revision / one apply |
| 545 | `handleStorageChanges` | settings/runtime authority | none detected | background-owned revision / one apply |

## js/content/handle_resolver.js

| Line | Function/helper | Family | Detected markers | Required proof gate |
| ---: | --- | --- | --- | --- |
| 23 | `persistChannelMappings` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 48 | `normalizeHandleGlyphs` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 56 | `extractRawHandle` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 98 | `normalizeHandleValue` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 123 | `extractHandleFromString` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 135 | `scheduleDomFallbackRerun` | lifecycle/scheduling | timer/raf | install/pause/resume/teardown counters |
| 147 | `fetchIdForHandle` | network/json transport | network, message, storage | explicit endpoint decision + side-effect budget |

## js/background.js

| Line | Function/helper | Family | Detected markers | Required proof gate |
| ---: | --- | --- | --- | --- |
| 30 | `safeArray` | background storage/action | none detected | backgroundActionRegistry declaration |
| 34 | `safeObject` | background storage/action | none detected | backgroundActionRegistry declaration |
| 38 | `normalizeString` | background storage/action | none detected | backgroundActionRegistry declaration |
| 42 | `sendMessageToTabQuietly` | background storage/action | none detected | backgroundActionRegistry declaration |
| 55 | `nowTs` | background storage/action | none detected | backgroundActionRegistry declaration |
| 59 | `isValidProfilesV4` | settings/runtime authority | none detected | background-owned revision / one apply |
| 72 | `buildAutoBackupPayload` | settings/runtime authority | none detected | background-owned revision / one apply |
| 220 | `readAutoBackupState` | import/export/trust | storage | trusted UI action token + import report |
| 273 | `boolFromV4` | background storage/action | none detected | backgroundActionRegistry declaration |
| 283 | `enabledFromV4` | background storage/action | none detected | backgroundActionRegistry declaration |
| 367 | `isTrustedUiSender` | import/export/trust | none detected | trusted UI action token + import report |
| 379 | `buildSubscriptionsImportLogSample` | import/export/trust | none detected | trusted UI action token + import report |
| 390 | `getSubscriptionsImportTrackedMatches` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 429 | `isHandleLike` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 433 | `normalizeHandleForStorage` | settings/runtime authority | none detected | background-owned revision / one apply |
| 440 | `isProbablyNotChannelName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 457 | `sanitizeImportedWhitelistChannelName` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 465 | `normalizeImportedWhitelistChannelEntry` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 523 | `importedWhitelistEntriesMatch` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 553 | `mergeImportedWhitelistChannelEntry` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 587 | `mergeImportedWhitelistChannels` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 596 | `didEntryChange` | background storage/action | none detected | backgroundActionRegistry declaration |
| 632 | `extractPinVerifierFromProfilesV4` | settings/runtime authority | none detected | background-owned revision / one apply |
| 647 | `isProfileSessionAuthorized` | settings/runtime authority | none detected | background-owned revision / one apply |
| 653 | `verifyAndCacheSessionPin` | import/export/trust | storage | trusted UI action token + import report |
| 678 | `rotateAutoBackups` | import/export/trust | none detected | trusted UI action token + import report |
| 723 | `revokeBackgroundBlobUrlLater` | background storage/action | timer/raf | backgroundActionRegistry declaration |
| 733 | `downloadWithBrowserApi` | settings/runtime authority | none detected | background-owned revision / one apply |
| 742 | `finish` | background storage/action | none detected | backgroundActionRegistry declaration |
| 780 | `createAutoBackupInBackground` | import/export/trust | none detected | trusted UI action token + import report |
| 795 | `safePart` | background storage/action | none detected | backgroundActionRegistry declaration |
| 877 | `scheduleAutoBackupInBackground` | lifecycle/scheduling | timer/raf | install/pause/resume/teardown counters |
| 902 | `shouldWaitForPostBlockEnrichmentBeforeBackup` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 910 | `waitForPostBlockEnrichmentBeforeBackup` | filter/hide decision | timer/raf | activeRuntimeReport + structured hide reason |
| 944 | `compareSemver` | background storage/action | none detected | backgroundActionRegistry declaration |
| 946 | `toParts` | background storage/action | none detected | backgroundActionRegistry declaration |
| 962 | `isVersionAtLeast` | background storage/action | none detected | backgroundActionRegistry declaration |
| 966 | `applyQuickBlockDefaultMigrationOnce` | settings/runtime authority | storage | background-owned revision / one apply |
| 1019 | `applyKeywordCommentsScopeMigrationOnce` | settings/runtime authority | storage | background-owned revision / one apply |
| 1037 | `migrateKeywordList` | settings/runtime authority | none detected | background-owned revision / one apply |
| 1045 | `migrateChannelList` | settings/runtime authority | none detected | background-owned revision / one apply |
| 1053 | `sanitizeSettings` | settings/runtime authority | storage | background-owned revision / one apply |
| 1106 | `schedulePostBlockEnrichment` | filter/hide decision | timer/raf | activeRuntimeReport + structured hide reason |
| 1170 | `getChannelDerivedKeywordRef` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1176 | `getChannelDerivedKeywordWord` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1187 | `parsePackedChannelKeywordSource` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1194 | `syncStoredMainKeywordsWithChannels` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1310 | `isKidsUrl` | background storage/action | none detected | backgroundActionRegistry declaration |
| 1314 | `buildProfilesV4FromLegacyState` | settings/runtime authority | none detected | background-owned revision / one apply |
| 1356 | `parseCompiledKeywordPattern` | settings/runtime authority | none detected | background-owned revision / one apply |
| 1450 | `ensureChannelMapCache` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1470 | `flushChannelMapUpdates` | identity/metadata extraction | storage | channelMatchResult confidence + route scope |
| 1485 | `scheduleChannelMapFlush` | identity/metadata extraction | timer/raf | channelMatchResult confidence + route scope |
| 1493 | `enqueueChannelMapUpdate` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1513 | `enqueueChannelMapMappings` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1526 | `ensureVideoChannelMapCache` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1546 | `ensureVideoMetaMapCache` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1566 | `enforceVideoChannelMapCap` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1578 | `enforceVideoMetaMapCap` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1592 | `flushVideoChannelMapUpdates` | identity/metadata extraction | storage | channelMatchResult confidence + route scope |
| 1608 | `flushVideoMetaMapUpdates` | identity/metadata extraction | storage | channelMatchResult confidence + route scope |
| 1630 | `scheduleVideoChannelMapFlush` | identity/metadata extraction | timer/raf | channelMatchResult confidence + route scope |
| 1638 | `scheduleVideoMetaMapFlush` | identity/metadata extraction | timer/raf | channelMatchResult confidence + route scope |
| 1646 | `enqueueVideoChannelMapUpdate` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1671 | `enqueueVideoMetaMapUpdate` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1718 | `loadReleaseNotesData` | settings/runtime authority | network | background-owned revision / one apply |
| 1736 | `buildReleaseNotesPayload` | settings/runtime authority | none detected | background-owned revision / one apply |
| 1756 | `getBackgroundRuntimeLabel` | settings/runtime authority | none detected | background-owned revision / one apply |
| 1773 | `getCompiledSettings` | settings/runtime authority | storage | background-owned revision / one apply |
| 1837 | `escapeRegex` | background storage/action | none detected | backgroundActionRegistry declaration |
| 1839 | `exactKeywordPattern` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1840 | `compileKeywordPattern` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1847 | `parseCompiledKeywordPattern` | settings/runtime authority | none detected | background-owned revision / one apply |
| 1864 | `compileKeywordEntries` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 1888 | `sanitizeCompiledList` | settings/runtime authority | none detected | background-owned revision / one apply |
| 2019 | `keyFor` | background storage/action | none detected | backgroundActionRegistry declaration |
| 2034 | `boolFromV4` | background storage/action | none detected | backgroundActionRegistry declaration |
| 2044 | `enabledFromV4` | background storage/action | storage | backgroundActionRegistry declaration |
| 2105 | `dedupeChannels` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2111 | `normalized` | background storage/action | none detected | backgroundActionRegistry declaration |
| 2146 | `compileWhitelistChannels` | filter/hide decision | storage | activeRuntimeReport + structured hide reason |
| 2454 | `mergeWithChannels` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2457 | `pushUnique` | background storage/action | none detected | backgroundActionRegistry declaration |
| 2508 | `profileContentFilters` | settings/runtime authority | none detected | background-owned revision / one apply |
| 2529 | `profileCategoryFilters` | settings/runtime authority | none detected | background-owned revision / one apply |
| 2561 | `shouldSuppressFirstRunPromptInjectionError` | ui/dom affordance | storage | visible affordance + user action gate |
| 2662 | `handleFetchShortsIdentityMessage` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 2684 | `fetchPromise` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 2704 | `handleFetchWatchIdentityMessage` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 2732 | `storageGet` | settings/runtime authority | storage | background-owned revision / one apply |
| 2736 | `identityHasAlternateMetadata` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2748 | `mergeStoredVideoIdentity` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2783 | `buildStoredVideoIdentity` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2875 | `performShortsIdentityFetch` | network/json transport | timer/raf, network | explicit endpoint decision + side-effect budget |
| 2942 | `extractIdentityFromPreview` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2960 | `extractKidsWatchIdentityFromPreview` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 2976 | `performKidsWatchIdentityFetch` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 2999 | `fetchPromise` | network/json transport | timer/raf, network | explicit endpoint decision + side-effect budget |
| 3070 | `performWatchIdentityFetch` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 3084 | `fetchPromise` | network/json transport | timer/raf, network, storage | explicit endpoint decision + side-effect budget |
| 3339 | `sanitizeKeywordList` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 3371 | `dedupeKeywordList` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 3386 | `dedupeChannels` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 3404 | `mergeAndClearBlocklistIntoWhitelist` | filter/hide decision | storage | activeRuntimeReport + structured hide reason |
| 3799 | `sanitizeKeywordList` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 3831 | `dedupeKeywordList` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 3846 | `dedupeChannels` | identity/metadata extraction | storage | channelMatchResult confidence + route scope |
| 4099 | `normalizeChannelInput` | identity/metadata extraction | storage | channelMatchResult confidence + route scope |
| 4502 | `extractCustomUrlFromPath` | background storage/action | none detected | backgroundActionRegistry declaration |
| 4530 | `fetchChannelInfo` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 4543 | `assignCustomUrl` | background storage/action | none detected | backgroundActionRegistry declaration |
| 4553 | `normalizeHandleOutput` | identity/metadata extraction | network | channelMatchResult confidence + route scope |
| 4649 | `decodeHtmlEntities` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 4659 | `extractMeta` | background storage/action | none detected | backgroundActionRegistry declaration |
| 4675 | `extractCanonicalHref` | background storage/action | none detected | backgroundActionRegistry declaration |
| 4681 | `decodeEmbeddedUrlValue` | background storage/action | none detected | backgroundActionRegistry declaration |
| 4691 | `extractHandleFromUrlLikeValue` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 4708 | `learnIdentityFromCanonicalLikeValue` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 4726 | `learnIdentityFromHtml` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 4740 | `learnHandleFromHtmlFallback` | network/json transport | none detected | explicit endpoint decision + side-effect budget |
| 4744 | `pushMatches` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 4771 | `fetchPublicChannelHtmlForAlternateIdentity` | network/json transport | network | explicit endpoint decision + side-effect budget |
| 4857 | `extractJSON` | background storage/action | none detected | backgroundActionRegistry declaration |
| 5275 | `handleAddFilteredChannel` | filter/hide decision | none detected | activeRuntimeReport + structured hide reason |
| 5277 | `isHandleLike` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5281 | `normalizeChannelInput` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5292 | `extractSlug` | background storage/action | none detected | backgroundActionRegistry declaration |
| 5494 | `isUcIdLike` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5498 | `normalizeComparableName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5503 | `isProbablyNotChannelName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5522 | `sanitizePersistedChannelName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5532 | `pickPersistedChannelName` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5792 | `normalizeHandleForMatch` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5823 | `normalizeChannelForWriteComparison` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5825 | `sortedStrings` | background storage/action | none detected | backgroundActionRegistry declaration |
| 5828 | `sortedCollaborators` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5857 | `channelRecordsEqual` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 5878 | `mergedName` | identity/metadata extraction | storage | channelMatchResult confidence + route scope |
| 6174 | `handleToggleChannelFilterAll` | filter/hide decision | storage | activeRuntimeReport + structured hide reason |

## js/filter_logic.js

| Line | Function/helper | Family | Detected markers | Required proof gate |
| ---: | --- | --- | --- | --- |
| 20 | `postLogToBridge` | general helper | message | covered by caller family or promote to named family |
| 48 | `queueVideoChannelMapping` | identity/metadata extraction | timer/raf, message | channelMatchResult confidence + route scope |
| 84 | `queueVideoMetaMapping` | identity/metadata extraction | timer/raf, message | channelMatchResult confidence + route scope |
| 153 | `getByPath` | general helper | none detected | covered by caller family or promote to named family |
| 174 | `flattenText` | general helper | none detected | covered by caller family or promote to named family |
| 211 | `getTextFromPaths` | general helper | none detected | covered by caller family or promote to named family |
| 224 | `normalizeChannelHandle` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 260 | `findHandleInValue` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 294 | `extractChannelHandleFromPaths` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 303 | `flattenMetadataRow` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 334 | `flattenMetadataRowsContainer` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 353 | `getMetadataRowsText` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 1079 | `tryExtractCustomUrl` | general helper | none detected | covered by caller family or promote to named family |
| 1285 | `visit` | general helper | message | covered by caller family or promote to named family |
| 1557 | `enabled` | general helper | none detected | covered by caller family or promote to named family |
| 1572 | `debugEnabled` | general helper | message | covered by caller family or promote to named family |
| 2144 | `tryResolveVideoId` | general helper | none detected | covered by caller family or promote to named family |
| 2335 | `tryResolveVideoId` | general helper | none detected | covered by caller family or promote to named family |
| 2375 | `readNumericSeconds` | general helper | none detected | covered by caller family or promote to named family |
| 2438 | `scanThumbnailViewModelOverlays` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2573 | `tryResolveVideoId` | general helper | none detected | covered by caller family or promote to named family |
| 2731 | `parseRangeValue` | general helper | none detected | covered by caller family or promote to named family |
| 2808 | `parseDateMs` | general helper | none detected | covered by caller family or promote to named family |
| 2902 | `extractFromAvatarStack` | identity/metadata extraction | none detected | channelMatchResult confidence + route scope |
| 2965 | `scanForStack` | general helper | none detected | covered by caller family or promote to named family |

## Audit Interpretation

- Every row must eventually be covered by either a direct fixture or a named family fixture with line-range evidence.
- Functions with `observer`, `timer/raf`, `network`, `message`, `storage`, `hide-write`, or `engagement` markers are priority counter points.
- `general helper` rows are not automatically safe. They must be covered by their caller family or promoted to a more specific family when source fixes start.
- This artifact should be regenerated after large refactors and diffed against the audit checklist.
