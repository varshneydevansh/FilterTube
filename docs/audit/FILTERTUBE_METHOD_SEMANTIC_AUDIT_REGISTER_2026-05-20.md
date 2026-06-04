# FilterTube Method Semantic Audit Register - 2026-05-20

Status: audit artifact only. This file does not change product behavior.

The repo-wide callable index proves that tracked source files are visible to
the audit. It does not prove that each method is safe to optimize, delete,
merge, or trust. This register promotes the highest-risk callable families from
"counted" to "semantic audit candidate" by naming their owner, trigger,
inputs, side effects, disabled/no-rule behavior, teardown boundary, and proof
gate.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 71
method semantic proof gap lexical callables covered: 6073
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6073
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

The current identity model remains a waterfall:

```text
XHR JSON / ytInitial* snapshots
        |
        v
learned maps and renderer/player joins
        |
        v
DOM anchors, bylines, stamped attributes, visible text
        |
        v
bounded background resolver fetches
```

That waterfall is intentional current behavior. A JSON-first method may not be
changed as if JSON were always complete. Watch and Shorts DOM can be
video-id-only. Mix can be playlist/seed identity rather than owner identity.
Kids/YTM/collaborator surfaces can expose different fields. Those differences
must be recorded before a method becomes implementation-ready.

## Required Semantic Fields

Every behavior-changing method row must record:

- owner family and source file,
- representative callable or source token,
- trigger path and caller class,
- settings/profile/list-mode inputs,
- route/surface scope,
- observable side effects such as DOM writes, fetches, storage writes, page
  messages, tab opens, timers, observers, RAFs, intervals, media/player
  actions, or stats writes,
- active, disabled, no-rule, and empty-list behavior,
- teardown, idempotence, or restore behavior for lifecycle work,
- positive fixtures,
- negative fixtures, including non-matching content and sibling-visible proof
  where the method can hide or mutate UI.

## High-Risk Method Families

| Callable family | Representative current source tokens | Owner / caller class | Trigger path | Settings/profile/list-mode inputs | Route/surface scope | Side effects | Disabled/no-rule boundary | Teardown/idempotence requirement | Proof gate before changes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Seed page-global transport | `setupFetchInterception`, `setupXhrInterception`, `ensureXhrResponseProcessed`, `processWithEngine`, `establishDataHooks`, `updateSettings` in `js/seed.js` | Main-world seed runtime | document-start injection, fetch/XHR hooks, `ytInitial*` setters, settings relay | compiled settings, raw enabled flags, list mode, content controls, surface flags | YouTubei `browse`, `search`, `next`, `player`, `guide`, Kids/YTM drift | response clone/JSON parse/stringify, renderer mutation, harvest maps, queued replay, page-global API patching | no-rule skip is partial; harvest-only can still run; XHR endpoint marking can happen before settings are complete | one patch owner, idempotent install, restore/report proof, queued snapshot budget | `endpointPolicy` plus `compiledRuleState` fixtures proving disabled/no-rule pass-through before body work and preserving required harvest |
| Background message and mutation actions | `chrome.runtime.onMessage.addListener`, `FilterTube_SetListMode`, `FilterTube_ApplySettings`, `fetchChannelDetails`, `recordTimeSaved`, `schedulePostBlockEnrichment`, `handleAddFilteredChannel` in `js/background.js` | Background/service-worker authority | extension UI messages, content-script messages, page-action follow-ups, resolver requests | profile id/type, active surface, lock/session state, list mode, Kids/Main, syncKidsToMain | Main, Kids, YTM, watch/Shorts resolver, subscription import, backups | storage writes, cache writes, tab broadcasts, YouTube fetches, stats writes, backup scheduling, script injection | trusted sender and lock gates are uneven; caller-pushed settings can overwrite cache | sender-class report, mutation revision, cache source/revision, backup dedupe | `mutationAuthority`, `ruleMutationAuthority`, `networkAuthority`, and `messageSenderClass` fixtures for every action branch |
| Content bridge menu, quick action, and identity methods | `extractChannelFromCard`, `injectFilterTubeMenuItem`, `handleBlockChannelClick`, `fetchChannelFromWatchUrl`, `fetchChannelFromShortsUrl`, `applyDOMFallback` calls in `js/content_bridge.js` | Isolated content bridge | YouTube menu open, quick block, fallback menu, same-window page messages, route changes | current settings, mode, quick/menu visibility flags, profile target, channel maps | home/search, watch, Shorts, playlists, comments, posts, YTM/Kids drift | DOM reads/writes, page messages, background messages, direct/fallback fetch requests, map stamps, menu insertion, forced DOM reruns | hidden affordance gates do not always prevent setup/sweeps; weak identity can escalate to resolver | one action gate, owned page-message request id, route-scope scan budget, duplicate menu idempotence | menu/quick action fixtures with valid/invalid identity, no-rule, whitelist, locked profile, and spoofed message negatives |
| DOM fallback and hide/restore decisions | `applyDOMFallback`, `shouldHideContent`, `toggleVisibility`, `updateContainerVisibility` in `js/content/dom_fallback.js` and `js/content/dom_helpers.js` | Page DOM fallback and visual writer | settings refresh, mutation observer, startup fallback, background refresh, manual forced rerun | active rule predicates, canonical and legacy aliases, content/category controls, whitelist fail-closed state | cards, shelves, watch shell, comments, guide, playlists, Shorts, Kids/YTM selector families | hide classes, inline display writes, parent collapse, stats writes, metadata fetch scheduling, playlist/player clicks | `hasActiveDOMFallbackWork` is useful but lifecycle and pending scans can still wake before final gate | writer registry, exact target ownership, stale marker cleanup, sibling restore | `hideDecisionAuthority`, `selectorAuthority`, and `hideRestoreAuthority` fixtures with positive/negative/sibling-visible cases |
| Quick-block and fallback-menu lifecycle | quick-block setup/sweep/listener tokens in `js/content/block_channel.js`; fallback menu warmup/scroll/mutation tokens in `js/content_bridge.js` | Page affordance lifecycle | document-start timers, scroll/click/resize/mutation, menu discovery | `showQuickBlockButton`, `showBlockMenuItem`, list mode, native overlay/fullscreen flags | Main home/search/watch/playlist/cards, app native overlays | observers, intervals, RAFs, scroll/touch listeners, injected styles, button/menu DOM | action gates exist later than some setup work; whitelist/native overlays can still need quieting | lifecycle owner id, install predicate, pause/resume, teardown/disconnect/clear proof | `lifecycleBudget` fixtures proving disabled/hidden/no-rule zero lifecycle or intentional setup budget |
| UI/settings mutation and render methods | `StateManager`, `RenderEngine`, `saveSettings`, `FilterTube_SetListMode`, row actions in `js/state_manager.js`, `js/render_engine.js`, `js/tab-view.js`, `js/settings_shared.js` | Extension UI/settings runtime | dashboard/tab/popup controls, list-mode switch, row actions, profile switch, storage reload | mode, visible canonical rows, legacy aliases, profile id/type, lock/session, Kids/Main, theme | extension pages and pushed runtime settings | storage writes, background messages, cache refresh, backup scheduling, UI rerender, profile V3/V4 writes | visible empty rows can diverge from stale runtime aliases | single mutation report, revision, dependency invalidation, save queue/dedupe | settings-mode, visible-empty, compiler-parity, storage-cache, lock, and row-action fixtures |
| Import, export, backup, and Nanah sync | `importV3`, `importV3Encrypted`, `FilterTubeNanahAdapter`, `applyNanahEnvelope`, `resolveTrustedNanahManagedApply`, trusted-link policy tokens | IO/Nanah UI runtime | manual import/export, encrypted restore, Nanah pairing, trusted reconnect, managed-child update | scope, strategy, target profile, trusted link policy, lock mode, child profile policy | extension settings plus app/native sync payloads | storage writes, trusted-device recovery writes, profile mutation, refresh, backup state, P2P apply | target-profile and locked-child gates are not one authority | import preview, mutation report, target-profile proof, trusted-link revision | import/export/Nanah fixtures proving merge/replace, target profile, lock, replay, and invalid envelope negatives |
| Prompt, onboarding, release-note methods | `first_run_prompt`, `release_notes_prompt`, `FilterTube_OpenWhatsNew`, prompt acknowledgement tokens | Prompt/onboarding runtime | install/update, settings replay, release banner, help actions | prompt version, extension version, user acknowledgement, URL target | extension content pages and dashboard | DOM overlays, storage ack writes, tab opens, external navigation | multiple prompt owners can be eligible without one coordinator | prompt queue/coordinator, sender class, URL allowlist, viewport fit | prompt/onboarding fixtures for first-run, replay, update, ack spoofing, URL routing, mobile viewport |
| Build, release, website, and native sync methods | `maybePromptRelease`, `createGitHubRelease`, `uploadReleaseAsset`, `sync-native-runtime`, website downloads/privacy components | Build/release/public surface | local build script, GitHub release, Vercel website build, native runtime mirror | version, artifact paths, checksums, package target, website copy state | browser package, website, Android/iOS app release docs | file writes, README mutation, release creation, upload, asset staging, public claims | public claims can exceed artifact proof; package roots can include quarantined files | release manifest, source/output freshness, checksum, draft-first release proof | release/static/native fixtures before publishing app/browser/download/privacy claims |
| Vendor and generated output boundaries | `js/vendor/nanah.bundle.js`, `js/vendor/qrcode.bundle.js`, `src/extension-shell/*`, `js/ui-shell/*`, `js/layout.js` | Provenance/generated boundary | vendor build, UI shell build, package copy | source hash, generated output version, package manifest | extension UI, sync pairing, QR display | packaged code execution, generated UI behavior, vendor globals | not product-owned line-by-line behavior; still shipped if packaged | source hash and generated-output freshness proof | vendor provenance and generated freshness fixtures before cleanup or runtime trust changes |

## Background Message Action Addendum

`docs/audit/FILTERTUBE_BACKGROUND_MESSAGE_ACTION_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/background-message-action-semantic-register-current-behavior.test.mjs`
promote the background message/mutation row above from representative tokens to
a source-derived semantic inventory. The addendum pins the two current
`runtime.onMessage` listener shapes and all 31 current `js/background.js`
action/type branches, including prompt/release checks, `getCompiledSettings`,
`FilterTube_SetListMode`, `FilterTube_ApplySettings`, Shorts/watch identity
fetches, `processFetchData`, learned-map writes, stats writes, script injection,
subscription-import bridge injection, and the secondary `addFilteredChannel` /
`toggleChannelFilterAll` listener. Each action row records semantic class,
sender/guard shape, observable side effects, and missing proof before changes.
It also records that `backgroundMessageActionAuthority`,
`backgroundActionSemanticReport`, `messageActionEffectDecision`, and
`messageActionSenderContract` do not exist in runtime source yet.

## Background Method Addendum

`docs/audit/FILTERTUBE_BACKGROUND_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/background-method-semantic-register-current-behavior.test.mjs`
promote the background runtime row above from representative action/mutation
tokens to a source-derived top-level method inventory. The addendum pins that
`js/background.js` currently has 75 top-level function declarations: 62 plain
function declarations, 13 async function declarations, and 12 semantic method groups. It separates defensive helpers and messaging, profile backup/export
state, subscription import and sender normalization, security session/PIN,
backup download/scheduling, migration/versioning, post-block enrichment and
channel-derived keywords, profile compile/storage, learned identity map caches,
release notes/runtime info, identity resolver network work, and rule mutation/channel persistence. It also records that
`backgroundMethodAuthority`, `backgroundMethodEffectReport`,
`backgroundMethodNoWorkBudget`, `backgroundStorageRevisionReport`,
`backgroundNetworkResolverBudget`, `backgroundRuleMutationContract`, and
`backgroundBackupScheduleAuthority` do not exist in runtime source yet.

## Content Bridge Top-Level Method Addendum

`docs/audit/FILTERTUBE_CONTENT_BRIDGE_TOP_LEVEL_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/content-bridge-top-level-method-semantic-register-current-behavior.test.mjs`
promote the largest callable source file from representative tokens to a
source-derived top-level method inventory. The addendum pins that
`js/content_bridge.js` currently has 1,189 lexical callable forms, 187
top-level function declarations, 186 unique top-level function names, one
duplicate top-level name (`injectCollaboratorPlaceholderMenu` at lines 599 and
7788), and 14 semantic groups. It classifies debug/startup, identity metadata
normalization, menu dropdown lifecycle, prefetch/metadata work, collaboration
roster state, stats/media side effects, renderer hydration, main-world message
bridging, startup DOM fallback, fallback playlist popovers, background
resolvers, card identity extraction, menu injection/action binding, and clicked
hide/rule mutation as separate method families. It also records that
`contentBridgeMethodAuthority`, `contentBridgeMethodEffectReport`,
`contentBridgeCallerContract`, `contentBridgeLifecycleBudget`, and
`contentBridgeIdentityConfidenceReport` do not exist in runtime source yet.

## Content Bridge Lifecycle Callback Addendum

`docs/audit/FILTERTUBE_CONTENT_BRIDGE_LIFECYCLE_CALLBACK_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/content-bridge-lifecycle-callback-semantic-register-current-behavior.test.mjs`
extend the method audit from top-level declarations into nested callback-bearing lifecycle rows that the top-level method inventory explicitly
did not complete. The addendum pins 87 current lifecycle instances in
`js/content_bridge.js` across listener, observer, timer, and frame primitives,
then groups them into source-derived callback/effect families for prefetch
route hooks, main-world bridge waits, DOM fallback startup and whitelist
timers, fallback menus/popovers, menu item action handlers, block-click
followups, and global bootstrap. It records that
`contentBridgeLifecycleCallbackAuthority`,
`contentBridgeLifecycleEffectReport`, `contentBridgeCallbackOwnerContract`,
`contentBridgeNoRuleLifecycleBudget`, and
`contentBridgeCallbackTeardownRegistry` do not exist in runtime source yet.

## Filter Logic Method Addendum

`docs/audit/FILTERTUBE_FILTER_LOGIC_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/filter-logic-method-semantic-register-current-behavior.test.mjs`
promote the filter engine method row above from representative tokens to a
source-derived method and entrypoint inventory. The addendum pins that
`js/filter_logic.js` currently has 55 method and entrypoint rows: 12 top-level
helper function declarations, 41 `YouTubeDataFilter` class methods, 2
`FilterTubeEngine` global interface functions, and 11 semantic method groups.
It separates debug/log relay queues, path/text helpers, handle extraction,
settings construction, channel matching, harvest/map writes, candidate unwrap,
block decisions, field parsing, recursion/entrypoints, and whitelist/debug
telemetry. It also records that `filterLogicMethodAuthority`,
`filterLogicMethodEffectReport`, `filterLogicNoRuleMethodBudget`,
`filterLogicHarvestMutationDecision`, `filterLogicEntrypointContract`, and
`filterLogicMethodFixtureProvenance` do not exist in runtime source yet.

## Seed Method Addendum

`docs/audit/FILTERTUBE_SEED_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/seed-method-semantic-register-current-behavior.test.mjs`
promote the seed page-global transport row above from representative tokens to
a source-derived method and callback inventory. The addendum pins that
`js/seed.js` currently has 35 method and callback rows: 13 top-level function
declarations, 6 local helper functions, 5 page/prototype patch functions, 6
property accessor functions, 1 timer callback, 1 local wrapped-listener
callback, 1 global object method, and 2 bootstrap entrypoints across 8 semantic
method groups. It separates bootstrap/idempotency, snapshot/replay queue,
debug/clone helpers, engine dispatch/no-work boundaries, `ytInitial*` data
hooks/accessors, fetch interception, XHR interception, and settings/global
interface relay. It also records that `seedMethodAuthority`,
`seedMethodEffectReport`, `seedNoWorkBudget`, `seedTransportPatchOwner`,
`seedReplayQueueBudget`, `seedAccessorContract`, and
`seedPageGlobalFixtureProvenance` do not exist in runtime source yet.

## DOM Fallback Method Addendum

`docs/audit/FILTERTUBE_DOM_FALLBACK_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/dom-fallback-method-semantic-register-current-behavior.test.mjs`
promote the DOM fallback and visual helper row above from representative
hide/restore tokens to a source-derived method inventory. The addendum pins that
`js/content/dom_fallback.js` and `js/content/dom_helpers.js` currently have 49
top-level function declarations: 46 in `dom_fallback.js`, 3 in
`dom_helpers.js`, and 11 semantic method groups spanning run-state/tracking,
identity normalization and compiled rules, playlist/watch route identity,
blocked markers and stale restore, dynamic style controls, text/keyword
matching, fallback surface handlers, active-work cleanup, the main DOM fallback
pipeline, the hide decision engine, and shared visual writers. It also records
that `domFallbackMethodAuthority`, `domFallbackEffectReport`,
`domFallbackNoWorkBudget`, `domFallbackLifecycleOwner`,
`domFallbackHideDecisionReport`, `domFallbackSelectorTargetReport`,
`domFallbackGlobalDependencyContract`, and `domHelperVisualWriterReport` do not
exist in runtime source yet.

## DOM Extractors Method Addendum

`docs/audit/FILTERTUBE_DOM_EXTRACTORS_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/dom-extractors-method-semantic-register-current-behavior.test.mjs`
promote `js/content/dom_extractors.js` from a content-helper callable row to a
source-derived method inventory. The addendum pins 1,103 source lines, 18
top-level function declarations, 0 async function declarations, 5 local const
arrow or IIFE result declarations, 23 arrow token sites, 47
`VIDEO_CARD_SELECTORS` entries, and 5 semantic method groups spanning card
identity stamping and recycled-node cleanup, card selector and title
extraction, duration parsing and cache behavior, channel metadata
normalization and cache behavior, and the video id extraction waterfall. It
also records 2 `document` literal occurrences, 2 `window` literal occurrences,
3 `location` literal occurrences, 21 `querySelector` calls, 4
`querySelectorAll` calls, 9 `closest` calls, 20 `getAttribute` calls, 7
`setAttribute` calls, 59 `removeAttribute` calls, 8 `hasAttribute` calls, 2
`classList.remove` calls, 2 `style.display` references, 10 `textContent`
references, 3 `innerText` references, 87 `data-filtertube-*` token
occurrences, 0 `setTimeout` calls, 0 `addEventListener` calls, 0
`MutationObserver` references, 0 `postMessage` calls, 0 runtime sendMessage
calls, and 0 `fetch` calls. Current behavior remains that recycled-node video
id stamping can clear stale channel, hidden, blocked, collaborator, processed,
and pending attributes; channel metadata extraction can trust or remove cached
handle/id values and write new DOM channel stamps; duration extraction uses an
empty `data-filtertube-duration` negative cache; and video id extraction
prefers Kids/current hrefs before falling back to stamped, dataset, attribute,
and selected data-host slots. It also records that
`domExtractorMethodAuthority`, `domExtractorIdentityConfidenceReport`,
`domExtractorSelectorScopeContract`, `domExtractorCacheFreshnessContract`,
`domExtractorVideoStampMutationReport`, `domExtractorChannelMetadataReport`,
`domExtractorDurationCacheBudget`, `domExtractorInnerTextBudget`,
`domExtractorRecycledNodeRestoreProof`, and `domExtractorFixtureProvenance` do
not exist in runtime source yet.

## Shared Identity Method Addendum

`docs/audit/FILTERTUBE_SHARED_IDENTITY_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/shared-identity-method-semantic-register-current-behavior.test.mjs`
promote `js/shared/identity.js` from content-helper callable coverage to a
source-derived method inventory. The addendum pins that `js/shared/identity.js`
currently has 808 source lines, 22 IIFE-scoped named function declarations, 22
plain function declarations, 0 async function declarations, 5 const arrow helper
declarations, 1 returned arrow helper declaration, 8 arrow token sites, 14
public `FilterTubeIdentity` API entries, and 6 semantic method groups. It
separates handle normalization, canonical UC/custom URL input handling, channel
filter index construction, indexed channel matching, direct one-filter matching,
and fast HTML fragment identity extraction.

It also records 0 `document` literal occurrences, 3 `window` literal
occurrences, 3 `self` literal occurrences, 1 `globalThis` literal occurrence, 4
`new URL` calls, 1 `JSON.parse` call, 3 `decodeURIComponent` calls, 1
`new RegExp` call, 8 `new Set` calls, 0 `new Map` calls, 2 `Array.isArray`
calls, 9 try/catch blocks, 0 listeners, 0 observers, 0 timers, 0 fetches, 0
runtime messages, 0 page messages, and 1 `Object.assign` export merge. Current
behavior keeps `normalizeUcIdForComparison` internal despite a `StateManager`
optional probe, preserves existing extra `root.FilterTubeIdentity` keys while
overwriting shared API keys, can normalize encoded zero-width handles, returns
`@some` for `normalizeHandleValue('@Some Handle')`, has an indexed stable-name
guard when metadata has a different UC id, but direct `channelMatchesFilter`
can match object filters by equal name even when filter and metadata ids differ.
Name-only strings can match through `buildChannelFilterIndex` plus
`channelMetaMatchesIndex`, while direct `channelMatchesFilter` does not match a
plain string name by metadata name. Fast HTML extraction returns null unless it
finds an id, handle, or custom URL. It also records that
`sharedIdentityMethodAuthority`, `sharedIdentityApiManifest`,
`sharedIdentityNormalizationContract`, `sharedIdentityMatchDecisionReport`,
`sharedIdentityIndexParityReport`, `sharedIdentityCallerParityReport`,
`sharedIdentityHtmlExtractionProvenance`, `sharedIdentityNameFallbackPolicy`,
`sharedIdentityUnicodeFixtureProvenance`, and
`sharedIdentityLoadOrderContract` do not exist in runtime source yet.

## Prompt Onboarding Method Addendum

`docs/audit/FILTERTUBE_PROMPT_ONBOARDING_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/prompt-onboarding-method-semantic-register-current-behavior.test.mjs`
promote prompt/onboarding coverage from a P0 prompt surface row to a
source-derived method inventory for `js/content/first_run_prompt.js` and
`js/content/release_notes_prompt.js`. The addendum pins 440 combined source
lines, 2 prompt content-script modules, 9 named function declarations, 9 plain
function declarations, 0 async function declarations, 1 const arrow callback
declaration, 14 arrow token sites, and 4 semantic method groups. It separates
theme palette selection, DOM overlay assembly, dismissal/ack behavior, and
eligibility requests.

It also records 31 `document` literal occurrences, 6 `window` literal
occurrences, 2 `location` literal occurrences, 18 `document.createElement`
calls, 3 `document.getElementById` calls, 18 `appendChild` calls, 6 `onclick`
assignments, 2 `addEventListener` calls, 0 `removeEventListener` calls, 0
`MutationObserver` references, 3 `setTimeout` calls, 0 intervals, 0 fetches, 5
runtime sendMessage calls, 1 runtime `getURL` call, 1 `window.open` call, 1
`location.href` write, and 1 `window.location.reload` call. Current behavior
loads `release_notes_prompt.js` before `first_run_prompt.js`, injects only
`first_run_prompt.js` from the install/update background path, guards duplicate
overlays only by each prompt's own `PROMPT_ID`, gives first-run a higher
z-index than the release banner, appends anonymous style nodes without style
teardown, sends first-run completion before reload without waiting for ack, and
lets the release-note learn action send `FilterTube_OpenWhatsNew` with
`targetLink` before falling back to `window.open`/`location.href` on
`lastError`. It also records that `PromptCoordinator`, `promptQueue`,
`activePromptOwner`, `promptOnboardingMethodAuthority`,
`promptOnboardingQueueContract`, `promptOnboardingSenderClassContract`,
`promptOnboardingStorageAckReport`,
`promptOnboardingUrlNavigationPolicy`,
`promptOnboardingDomLifecycleContract`,
`promptOnboardingViewportFitProof`,
`promptOnboardingDuplicateOverlayRegistry`,
`promptOnboardingStyleTeardownRegistry`, and
`promptOnboardingFixtureProvenance` do not exist in runtime source yet.

## DOM Fallback Lifecycle Callback Addendum

`docs/audit/FILTERTUBE_DOM_FALLBACK_LIFECYCLE_CALLBACK_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/dom-fallback-lifecycle-callback-semantic-register-current-behavior.test.mjs`
promote the DOM fallback lifecycle row above from representative timer/listener
tokens to a source-derived callback/effect inventory. The addendum pins that
`js/content/dom_fallback.js` currently has 13 lifecycle instances: 3 addEventListener instances, 10 setTimeout instances, and 7 semantic callback groups
spanning current-watch owner retry/navigation timers, the main pipeline yield
timer, page-lifetime scroll state, playlist click/ended guards, deferred playlist autoplay clicks, pending metadata and selected-row timers, and serialized pending reruns. It also records that
`domFallbackLifecycleCallbackAuthority`,
`domFallbackLifecycleEffectReport`, `domFallbackCallbackOwnerContract`,
`domFallbackNoRuleLifecycleBudget`, `domFallbackCallbackTeardownRegistry`,
`domFallbackPlaylistGuardPolicy`, `domFallbackPendingRunBudget`, and
`domFallbackSyntheticNavigationBudget` do not exist in runtime source yet.

## Implementation Boundary

A method cannot be optimized, deleted, broadened, or used as the single source
of truth until the exact source row has:

```text
owner + trigger + caller class
settings/profile/list-mode inputs
route/surface scope
side-effect list
disabled/no-rule/empty-list budget
teardown/idempotence/restore proof
positive fixture
negative fixture
```

This is especially important for the current user-reported symptoms:

- empty-install lag can come from methods that still parse, scan, observe, or
  schedule before the no-rule boundary;
- false hiding can come from stale aliases, broad DOM parents, pending whitelist
  hides, or content/category predicates even when visible keyword/channel rows
  look empty;
- end-screen and watch gaps can be alternate renderer or DOM/player overlay
  gaps, not proof that the direct `endScreenVideoRenderer` rule is broken;
- engagement side effects can come from methods that fetch, click, pause,
  navigate, stamp learned maps, or count stats as part of a hide path.

## Missing Runtime Authorities

The following authority names intentionally do not exist in current source yet:

- `methodSemanticAuthority`
- `callableEffectReport`
- `callableNoWorkBudget`
- `callableTeardownRegistry`

They are names for future contracts, not current implementation.

## Subagent Review Inputs

Read-only review outputs converged on the same register shape:

- JSON-first is true only when the surface exposes enough fields; watch,
  Shorts, Mix, Kids, YTM, and collaborator surfaces require waterfall
  confidence records.
- Empty install is not zero-work because seed endpoint hooks, fallback menu,
  quick-block, and whitelist-pending lifecycles can still install or schedule
  work.
- Broad DOM selectors and parent-collapse paths remain false-hide risks until
  exact target and sibling-visible fixtures exist.
- Renderer coverage is mixed: direct `endScreenVideoRenderer` is covered, while
  `compactPlaylistRenderer`, `compactAutoplayRenderer`, direct watch-card
  variants, and `showSheetCommand` collaborator rosters remain gaps.
- Feature rows must include hidden dependency workflows: endpoint/no-work,
  identity maps, selector/hide authority, content predicates, prompts, stats,
  profiles/PIN, import/export, Nanah, release/static, and native sync.

## Current Harness

Executable current-behavior fixture:

```text
tests/runtime/method-semantic-audit-register-current-behavior.test.mjs
```

That fixture pins this register as audit-only, verifies representative source
tokens exist, and keeps runtime authority names absent until they are designed
with fixtures.

## State Manager Method Addendum

`docs/audit/FILTERTUBE_STATE_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/state-manager-method-semantic-register-current-behavior.test.mjs`
promote the UI/settings mutation row above from representative `StateManager`
tokens to a source-derived method inventory. The addendum pins that
`js/state_manager.js` currently has 55 IIFE-scoped function declarations: 21 plain function declarations, 34 async function declarations, 30 public API
entries, and 9 semantic method groups. It separates lock/backup/access helpers,
settings save/profile/broadcast work, channel enrichment queue work, Kids
keyword/channel mutations, Main keyword mutations, Main channel/import/map
mutations, toggle/content/category mutations, theme/listener APIs, and
storage-sync reload handling. It also records that
`stateManagerMethodAuthority`, `stateManagerMutationEffectReport`,
`stateManagerSaveQueueContract`, `stateManagerProfileRevisionReport`,
`stateManagerRefreshBroadcastAuthority`, `stateManagerStorageReloadBudget`,
`stateManagerListenerEventContract`, and
`stateManagerChannelEnrichmentBudget` do not exist in runtime source yet.

## Render Engine Method Addendum

`docs/audit/FILTERTUBE_RENDER_ENGINE_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/render-engine-method-semantic-register-current-behavior.test.mjs`
promote the UI/settings mutation and render row above from representative
`RenderEngine` tokens to a source-derived method inventory. The addendum pins
that `js/render_engine.js` currently has 35 IIFE-scoped declarations: 30 plain
function declarations, 5 const arrow helper declarations, 0 async function
declarations, 4 public API entries, and 6 semantic method groups. It separates
dependency/scheduling helpers, badge/source decoration, channel display identity
helpers, keyword rendering and row actions, channel rendering and row actions,
and collaboration grouping. It also records 7 row-action listener sites, 26 direct `StateManager` optional calls across 11 unique `StateManager` methods,
idle batching, 10 `innerHTML` writes, 12 `setAttribute` calls, 0 `querySelector`
calls, and that `renderEngineMethodAuthority`,
`renderEngineRowActionContract`, `renderEngineDomEffectReport`,
`renderEngineIdleRenderBudget`, `renderEngineVisibleRowParityReport`,
`renderEngineAccessibilityContract`, and `renderEngineIdentityDisplayPolicy`
do not exist in runtime source yet.

## Tab View Method Addendum

`docs/audit/FILTERTUBE_TAB_VIEW_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/tab-view-method-semantic-register-current-behavior.test.mjs`
promote the UI/settings mutation and dashboard row above from representative
`tab-view` tokens to a source-derived named method inventory. The addendum pins
that `js/tab-view.js` currently has 311 named declarations: 210 plain function
declarations, 70 async function declarations, 29 const arrow helper
declarations, 2 async const arrow helper declarations, and 22 semantic method
groups. It separates responsive navigation, Main/Kids filter and content
controls, route/release note handling, runtime/browser-tab messaging,
subscription import, profile dropdowns, managed child editing, lock/navigation
gates, modal helpers, Nanah mode/scope/target/session/apply flows, PIN/profile
management, import/export downloads, account policy handlers, managed row and
list-mode rendering, dashboard stats, date filters, navigation, and toasts. It
also records 147 listener sites, 14 `setTimeout` calls, 1 `setInterval` call,
11 `requestAnimationFrame` calls, 333 `document.createElement` calls, 39
`innerHTML` writes, 61 `setAttribute` calls, 42 direct `StateManager` calls
across 14 unique `StateManager` methods, 4 `RenderEngine` calls, 8
`sendRuntimeMessage` calls, and that `tabViewMethodAuthority`,
`tabViewListenerLifecycleContract`, `tabViewListModeMutationReport`,
`tabViewManagedChildEditContract`, `tabViewNanahSyncPolicyReport`,
`tabViewImportExportMutationPlan`, `tabViewProfileLockAccessReport`,
`tabViewDashboardRenderBudget`, and `tabViewNavigationStateContract` do not
exist in runtime source yet.

## Settings Shared Method Addendum

`docs/audit/FILTERTUBE_SETTINGS_SHARED_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/settings-shared-method-semantic-register-current-behavior.test.mjs`
promote the UI/settings mutation row above from representative
`settings_shared` tokens to a source-derived method inventory. The addendum
pins that `js/settings_shared.js` currently has 29 named declarations:
27 IIFE-scoped function declarations, 2 local const arrow helper declarations,
0 async function declarations, 21 public `FilterTubeSettings` entries, and
9 semantic method groups. It separates defensive object helpers, keyword normalization and compilation,
channel normalization, profile migration helpers, compiled settings building,
settings load/read-path migration, settings save/storage persistence,
theme preference/change helpers, and storage change detection. It also records
36 `SETTINGS_KEYS` entries, 38 effective
`SETTINGS_CHANGE_KEYS` entries, 3 `STORAGE_NAMESPACE.get` calls,
5 `STORAGE_NAMESPACE.set` calls, 2 `chrome.runtime.lastError` reads,
4 `buildCompiledSettings` calls,
3 `buildProfilesV4FromLegacyState` calls, 1 theme DOM attribute write,
0 listener/timer/selector calls, and that
`settingsSharedMethodAuthority`, `settingsSharedStorageDependencyManifest`,
`settingsSharedProfileMigrationReport`, `settingsSharedReadPathWriteBudget`,
`settingsSharedSaveResultContract`, `settingsSharedCompiledSettingsReport`,
`settingsSharedThemePreferenceContract`, and
`settingsSharedChangeDetectionContract` do not exist in runtime source yet.

## IO Manager Method Addendum

`docs/audit/FILTERTUBE_IO_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/io-manager-method-semantic-register-current-behavior.test.mjs`
promote the import/export and backup tokens above from representative
`io_manager` coverage to a source-derived method inventory. The addendum pins
that `js/io_manager.js` currently has 52 named declarations:
46 IIFE-scoped function declarations, 30 plain function declarations,
16 async function declarations, 6 local const arrow helper declarations,
11 public `FilterTubeIO` entries, and 12 semantic method groups. It separates
primitive defensive helpers, download runtime helpers,
keyword/channel normalization, profile scope and security,
legacy profile derivation and V3 persistence, storage access wrappers,
profiles V4 migration and sanitization, import format parsing,
export serialization, import merge and persistence, encrypted/Nanah state,
and auto-backup download/rotation. It also records
4 storage key constants, 5 `readStorage` occurrences, 8 `writeStorage` occurrences,
1 `STORAGE_NAMESPACE.get` call, 1 `STORAGE_NAMESPACE.set` call,
1 `chrome.runtime.lastError` read, 2 `runtimeAPI.downloads.download` calls,
1 `runtimeAPI.downloads.search` call, 2 `runtimeAPI.downloads.erase` calls,
2 `URL.createObjectURL` calls, 1 `URL.revokeObjectURL` call, 2 `Blob`
constructor calls, 2 `setTimeout` calls, 1 `clearTimeout` call,
0 listener/interval/selector calls, and that `ioManagerMethodAuthority`,
`ioManagerProfileMigrationReport`, `ioManagerImportMutationPlan`,
`ioManagerExportScopeContract`, `ioManagerPinAuthContract`,
`ioManagerEncryptedBackupContract`, `ioManagerNanahRestorePolicy`,
`ioManagerDownloadLifecycleBudget`, `ioManagerAutoBackupScheduleAuthority`,
`ioManagerBackupRotationReport`, `ioManagerStorageWriteEffectReport`, and
`ioManagerFixtureProvenance` do not exist in runtime source yet.

## Popup Method Addendum

`docs/audit/FILTERTUBE_POPUP_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/popup-method-semantic-register-current-behavior.test.mjs`
promote popup UI/settings mutation coverage from representative `popup` tokens
to a source-derived method inventory. The addendum pins that `js/popup.js`
currently has 53 named declarations: 36 plain function declarations,
11 async function declarations, 3 const arrow helper declarations,
3 async const arrow helper declarations, 0 public exported API entries, and
11 semantic method groups. It separates popup bootstrap/content DOM,
video filter controls, content-control visibility, runtime messaging/session unlock,
list mode controls, defensive helpers, profile metadata helpers,
dropdown/modal/PIN unlock, lock gate/profile switch, rendering/search sync, and
enabled toggle. It also records 52 `document.getElementById` calls,
23 unique getElementById ids, 82 `document.createElement` calls,
30 `addEventListener` calls, 3 `document.addEventListener` calls,
2 `setTimeout` calls, 1 `requestAnimationFrame` call, 5 `innerHTML` writes,
34 `setAttribute` calls, 19 `StateManager` references, 2 `RenderEngine`
references, 13 `UIComponents` references, 4 `sendRuntimeMessage` occurrences,
and that `popupMethodAuthority`, `popupDomEffectReport`,
`popupListenerLifecycleContract`, `popupListModeMutationReport`,
`popupProfileLockAccessReport`, `popupProfileSwitchMutationPlan`,
`popupContentControlVisibilityReport`, `popupVideoFilterRoutePolicy`,
`popupRuntimeMessageContract`, `popupRenderStateDependencyReport`,
`popupAccessibilityContract`, and `popupFixtureProvenance` do not exist in
runtime source yet.

## UI Components Method Addendum

`docs/audit/FILTERTUBE_UI_COMPONENTS_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/ui-components-method-semantic-register-current-behavior.test.mjs`
promote shared UI primitive coverage from representative `UIComponents` tokens
to a source-derived method inventory. The addendum pins that
`js/ui_components.js` currently has 33 named declarations:
22 plain function declarations, 11 const arrow helper declarations,
0 async function declarations, 19 public `UIComponents` entries, and
7 semantic method groups. It separates
module theme/profile helpers, button/icon factories, input/select factories,
tab factories, list/card factories, enhanced select dropdown helpers, and
toast lifecycle. It also records 36 `document.createElement` calls,
1 `document.querySelectorAll` call, 17 `addEventListener` calls,
1 `document.addEventListener` call, 2 `window.addEventListener` calls,
3 `setTimeout` calls, 4 `requestAnimationFrame` calls,
1 `cancelAnimationFrame` call, 1 `MutationObserver` constructor,
0 `disconnect` calls, 5 `innerHTML` writes, 21 `setAttribute` calls,
2 `document.body.appendChild` calls, 2 `dispatchEvent` calls, and that
`uiComponentsMethodAuthority`, `uiComponentsDomEffectReport`,
`uiComponentsListenerLifecycleContract`, `uiComponentsDropdownTeardownRegistry`,
`uiComponentsToastLifecycleBudget`, `uiComponentsAccessibilityContract`,
`uiComponentsSelectorScopeReport`, `uiComponentsPublicApiManifest`,
`uiComponentsRawHtmlPolicy`, `uiComponentsProfileColorContract`, and
`uiComponentsFixtureProvenance` do not exist in runtime source yet.

## Security Manager Method Addendum

`docs/audit/FILTERTUBE_SECURITY_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/security-manager-method-semantic-register-current-behavior.test.mjs`
promote PIN and encrypted JSON helper coverage from representative
`FilterTubeSecurity` tokens to a source-derived method inventory. The addendum
pins that `js/security_manager.js` currently has 12 named declarations:
6 plain function declarations, 6 async function declarations,
0 const arrow helper declarations, 4 public `FilterTubeSecurity` entries, and
5 semantic method groups. It separates crypto defensive helpers,
byte encoding helpers, PBKDF2 derivation, PIN verifier lifecycle, and
encrypted JSON lifecycle. It also records 3 `TextEncoder` constructions,
1 `TextDecoder` construction, 1 `btoa` call, 1 `atob` call,
1 `cryptoApi.getRandomValues` call, 2 `subtle.importKey` calls,
1 `subtle.deriveBits` call, 1 `subtle.deriveKey` call,
1 `subtle.encrypt` call, 1 `subtle.decrypt` call, 1 `JSON.stringify` call,
1 `JSON.parse` call, 7 `throw new Error` statements,
0 `addEventListener` calls, 0 `setTimeout` calls, 0 `document` references,
0 `window` references, and that `securityManagerMethodAuthority`,
`securityManagerCryptoAvailabilityContract`, `securityManagerPinVerifierContract`,
`securityManagerEncryptedJsonContract`, `securityManagerKdfCompatibilityReport`,
`securityManagerTimingComparisonPolicy`, `securityManagerPayloadValidationReport`,
`securityManagerCallerMutationGate`, and `securityManagerFixtureProvenance` do
not exist in runtime source yet.

## Content Controls Catalog Method Addendum

`docs/audit/FILTERTUBE_CONTENT_CONTROLS_CATALOG_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/content-controls-catalog-method-semantic-register-current-behavior.test.mjs`
promote content-control catalog coverage from representative
`FilterTubeContentControlsCatalog` tokens to a source-derived catalog and method
inventory. The addendum pins that `js/content_controls_catalog.js` currently
has 3 named declarations: 3 plain function declarations,
0 async function declarations, 0 const arrow helper declarations,
3 public `FilterTubeContentControlsCatalog` entries, and
2 semantic method groups. It also records 7 catalog groups,
29 catalog controls, group ids `core`, `feed`, `watch`, `video_info`, `player`,
`navigation`, and `search`, 7 `accentColor` entries, 1 empty description entry,
1 escaped-newline description entry, 2 `map` calls, 1 `flatMap` call,
1 `find` call, 1 `Array.isArray` call, 0 `document` references,
0 `window` references, 0 `addEventListener` calls, 0 `setTimeout` calls,
0 `MutationObserver` references, and that `getCatalog()` currently copies group
objects and control arrays while preserving nested control object identity.
`contentControlsCatalogMethodAuthority`,
`contentControlsCatalogRuntimeSemanticsManifest`,
`contentControlsCatalogKeyParityReport`,
`contentControlsCatalogRouteScopeReport`,
`contentControlsCatalogControlEffectBudget`,
`contentControlsCatalogAccessorCopyContract`,
`contentControlsCatalogUiRuntimeAlignmentReport`, and
`contentControlsCatalogFixtureProvenance` do not exist in runtime source yet.

## Nanah Sync Adapter Method Addendum

`docs/audit/FILTERTUBE_NANAH_SYNC_ADAPTER_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/nanah-sync-adapter-method-semantic-register-current-behavior.test.mjs`
promote the Nanah adapter row above from representative import/export sync
tokens to a source-derived method inventory. The addendum pins that
`js/nanah_sync_adapter.js` currently has 23 named declarations: 16 plain function declarations, 7 async function declarations, 0 const arrow helper declarations, 10 public `FilterTubeNanahAdapter` entries, and 5 semantic method groups. It separates defensive normalization/merge helpers, scoped profile transfer, runtime/device descriptor helpers, envelope build/summary, and incoming envelope apply. It also records 3 `JSON.stringify` calls, 3 `JSON.parse` calls, 8 `throw new Error` statements, 2 `new Map` calls, 2 `await io.loadProfilesV4` calls, 1 `await io.saveProfilesV4` call, 1 `await io.exportV3` call, 1 `return io.importV3` call, 0 `document` references, 0 `addEventListener` calls, and 0 `setTimeout` calls. Current behavior remains
that preview strategy writes no storage, Main/Kids route to scoped V4 apply,
and active/full route to `io.importV3()`. It also records that
`nanahAdapterMethodAuthority`, `nanahAdapterEnvelopeContract`,
`nanahAdapterScopedMutationReport`,
`nanahAdapterPreviewApplyEquivalenceReport`,
`nanahAdapterTargetProfileAuthority`, `nanahAdapterTrustedSenderContract`,
`nanahAdapterProfileLockGate`, `nanahAdapterRuntimeRefreshContract`,
`nanahAdapterSanitizerParityReport`, and `nanahAdapterFixtureProvenance` do not
exist in runtime source yet.

## Block Channel Method Addendum

`docs/audit/FILTERTUBE_BLOCK_CHANNEL_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/block-channel-method-semantic-register-current-behavior.test.mjs`
promote quick-block, native dropdown, Kids native block, selector, lifecycle,
and mutation coverage from representative block-channel tokens to a
source-derived method inventory. The addendum pins that
`js/content/block_channel.js` currently has 61 named method/helper/callback
declarations in scope: 40 function declarations in scope,
35 plain function declarations, 5 async function declarations,
21 const helper/callback declarations, 19 const arrow helper/callback
declarations, 2 local const IIFE result declarations, and
9 semantic method groups. It separates module state/mode gates,
surface overlay/visibility helpers, card target/anchor resolution,
viewport hover/occlusion work, quick-block identity/action builders,
mutation and optimistic hide paths, quick-block DOM lifecycle,
dropdown injection lifecycle, and Kids native block sync. It also records
34 `addEventListener` calls, 6 `MutationObserver` references,
6 `observe` calls, 2 `disconnect` calls, 11 `setTimeout` calls,
1 `setInterval` call, 3 `requestAnimationFrame` calls,
5 `document.createElement` occurrences, 17 `setAttribute` calls,
11 `style.display` references, 2 `chrome.runtime?.sendMessage` calls,
2 `addChannelDirectly` references, and 2 `applyDOMFallback` references.
Current behavior remains that delayed boot starts menu and quick-block
observers after 1000ms, the quick-block gate requires
`showQuickBlockButton === true` and non-whitelist mode, optimistic hide writes
`style.display = 'none'`, Kids native block sends
`FilterTube_KidsBlockChannel`, and there is no `removeEventListener` path and
no `clearInterval` path. It also records that
`blockChannelMethodAuthority`, `blockChannelQuickBlockLifecycleContract`,
`blockChannelQuickBlockActionReport`, `blockChannelAffordanceNoWorkBudget`,
`blockChannelSelectorTargetReport`, `blockChannelOptimisticHideReport`,
`blockChannelDropdownObserverRegistry`, `blockChannelKidsNativeSyncContract`,
`blockChannelMutationSenderContract`, and `blockChannelFixtureProvenance` do
not exist in runtime source yet.

## Collaborator Dialog Method Addendum

`docs/audit/FILTERTUBE_COLLAB_DIALOG_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/collab-dialog-method-semantic-register-current-behavior.test.mjs`
promote collaborator dialog coverage from lifecycle-only tokens to a
source-derived method inventory. The addendum pins that
`js/content/collab_dialog.js` currently has 13 named function declarations in
scope: 13 plain function declarations, 0 async function declarations,
0 const helper/callback declarations, 9 arrow callback sites in scope, and
6 semantic method groups. It separates refresh and boot lifecycle,
trigger capture and queueing, entry resolution, card mutation and propagation,
broadcast and extraction, and dialog acceptance/observer dispatch. It also
records 7 `document` literal occurrences, 14 `window` literal occurrences,
1 `document.querySelectorAll` call, 6 element `querySelector` calls,
1 `querySelector?.` call, 2 `closest` calls, 1 `matches` call,
3 `addEventListener` calls, 0 `removeEventListener` calls,
1 `MutationObserver` reference, 1 `observe` call, 0 `disconnect` calls,
2 `setTimeout` calls, 2 `clearTimeout` calls, 0 `setInterval` calls,
0 `requestAnimationFrame` calls, 7 `setAttribute` calls,
4 `removeAttribute` calls, 1 `postMessage` call, 2 `applyDOMFallback`
references, 7 `pendingCollabCards` references,
12 `pendingCollabDialogTrigger` references,
2 `resolvedCollaboratorsByVideoId` references, and
1 `refreshActiveCollaborationMenu` reference. Current behavior remains that
boot only runs from `DOMContentLoaded`, `window.collabDialogModule` exports
4 helpers, document click/keydown capture listeners have no removal path, the
dialog observer has no disconnect path, collaborator cards can be mutated,
`resolvedCollaboratorsByVideoId` can be updated, active collaboration menus can
be refreshed, and `FilterTube_CollabDialogData` is posted with wildcard target.
It also records that `collabDialogMethodAuthority`,
`collabDialogLifecycleContract`, `collabDialogPendingCardAuthority`,
`collabDialogMutationReport`, `collabDialogMessageTrustContract`,
`collabDialogSelectorTargetReport`, `collabDialogIdentityConfidenceReport`,
`collabDialogNoWorkBudget`, `collabDialogTeardownRegistry`, and
`collabDialogFixtureProvenance` do not exist in runtime source yet.

## Injector Method Addendum

`docs/audit/FILTERTUBE_INJECTOR_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/injector-method-semantic-register-current-behavior.test.mjs`
promote main-world injector coverage from representative settings capability
tokens to a source-derived method inventory. The addendum pins that
`js/injector.js` currently has 103 named method/helper/callback declarations in
scope: 64 function declarations in scope, 61 plain function declarations,
3 async function declarations, 39 const helper/callback declarations,
31 const arrow helper/callback declarations, 1 async const arrow helper/callback
declaration, 7 const IIFE result declarations, 100 arrow callback sites in
scope, and 12 semantic method groups. It separates bridge lifecycle and logging,
collaborator identity sanitization, subscription context helpers, subscription
seed collection, subscription expansion/wait work, subscription entry
normalization and summary, credentialed YouTubei fetch queueing, collaborator
matcher/cache work, collaborator data extraction, channel snapshot identity
search, collaborator snapshot/DOM search, and seed hook/queue lifecycle. It also
records 15 `document` literal occurrences, 123 `window` literal occurrences,
10 `location` literal occurrences, 1 `document.querySelector` call,
3 `document.querySelectorAll` calls, 1 element `querySelector` call,
2 `querySelectorAll?.` calls, 2 `window.addEventListener` calls,
0 `removeEventListener` calls, 0 `MutationObserver` references,
5 `setTimeout` calls, 2 `clearTimeout` calls, 1 `setInterval` call,
2 `clearInterval` calls, 1 `fetch` call, 2 `AbortController` references,
10 `postMessage` calls, 10 wildcard postMessage target calls,
2 `dispatchEvent` calls, 1 click call, 3 `scrollTo` calls,
2 `Object.defineProperty` calls, 4 `JSON.parse` calls,
2 `JSON.stringify` calls, 7 `new Map` calls, 19 `new Set` calls,
7 `WeakSet` references, 58 `window.filterTube` references,
15 `FilterTubeEngine` references, 7 `initialDataQueue` references, and
6 `collaboratorCache` references. Current behavior remains that subscription
import bridge installation runs before the duplicate-run idempotency guard,
settings messages merge caller payload into `currentSettings` without a revision
gate, subscription import can scroll/click and issue credentialed
`/youtubei/v1/browse?prettyPrint=false` requests, collaborator/channel lookup
responses use wildcard page messages, `connectToSeedGlobal()` writes
`window.filterTube.processFetchResponse` and `processXhrResponse`, the backup
`ytInitialData` hook uses `Object.defineProperty`, the engine readiness interval
polls every 100ms with a 5000ms timeout, and there is no listener teardown path.
It also records that `injectorMethodAuthority`,
`injectorBridgeMessageTrustContract`, `injectorSettingsRevisionContract`,
`injectorSubscriptionImportActionToken`,
`injectorSubscriptionImportWorkBudget`, `injectorYoutubeiFetchPolicy`,
`injectorSnapshotSearchProvenance`,
`injectorCollaboratorIdentityConfidenceReport`,
`injectorChannelLookupAuthority`, `injectorSeedHookLifecycleContract`,
`injectorPageGlobalPatchReport`, and `injectorFixtureProvenance` do not exist
in runtime source yet.

## Content Menu Method Addendum

`docs/audit/FILTERTUBE_CONTENT_MENU_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/content-menu-method-semantic-register-current-behavior.test.mjs`
promote content menu helper coverage from helper-count tokens to a
source-derived method inventory. The addendum pins that `js/content/menu.js`
currently has 2 named function declarations in scope: 2 plain function
declarations, 0 async function declarations, 0 const helper/callback
declarations, 1 module-scoped state declaration, 0 arrow callback sites in
scope, and 2 semantic method groups. It separates HTML escaping and shared menu
style injection. It also records 3 `document` literal occurrences,
0 `window` literal occurrences, 0 `location` literal occurrences,
0 selector API calls, 1 `document.createElement` call,
1 `document.documentElement` reference, 0 `addEventListener` calls,
0 `removeEventListener` calls, 0 `MutationObserver` references,
0 `setTimeout` calls, 0 `setInterval` calls, 0 `innerHTML` references,
1 `textContent` reference, 1 `appendChild` call, 0 `postMessage` calls,
0 `chrome.runtime` references, 0 `fetch` calls, 5 `.replace` calls,
1 `String` call, 1 `styleTag.id` assignment,
3 `filterTubeMenuStylesInjected` references, 2 `styleContent` references,
21 `filtertube-menu-item` selector token occurrences,
31 `filtertube-block-channel-item` selector token occurrences,
9 `filtertube-modern-bottom-sheet-item` selector token occurrences,
14 `filtertube-filter-all-toggle` selector token occurrences,
17 `filtertube-collab-selected` selector token occurrences, and
114 `!important` declarations. Current behavior remains that
`js/content/menu.js` is manifest-loaded before `js/content_bridge.js`,
`escapeHtml()` replaces five HTML-sensitive characters for caller templates,
`ensureFilterTubeMenuStyles()` uses a boolean-only injection guard, appends
`#filtertube-menu-styles` to `document.documentElement`, has no duplicate DOM
check beyond the boolean, has no style teardown path, and exports no CommonJS
module or explicit browser global. It also records that
`contentMenuMethodAuthority`, `contentMenuStyleInjectionContract`,
`contentMenuHtmlEscapingContract`, `contentMenuStyleScopeReport`,
`contentMenuLoadOrderContract`, `contentMenuThemeParityReport`,
`contentMenuTeardownRegistry`, and `contentMenuFixtureProvenance` do not exist
in runtime source yet.

## Bridge Injection Method Addendum

`docs/audit/FILTERTUBE_BRIDGE_INJECTION_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/bridge-injection-method-semantic-register-current-behavior.test.mjs`
promote bridge injection coverage from startup and content-helper tokens to a
source-derived method inventory. The addendum pins that
`js/content/bridge_injection.js` currently has 5 named method/helper
declarations in scope: 1 plain function declaration, 2 async function
declarations, 1 named function expression declaration, 1 async named function
expression declaration, 0 const helper/callback declarations, 0 const arrow
helper/callback declarations, 8 arrow callback sites in scope, and 4 semantic
method groups. It separates debug/global bootstrap, background scripting,
fallback DOM script injection, and main-world orchestration. It also records
15 `globalThis` literal occurrences, 15 `bridgeState` references,
5 `scriptsInjected` references, 3 `injectionInProgress` references,
7 `injectionPromise` references, 4 `browserAPI_BRIDGE` references,
4 `IS_FIREFOX_BRIDGE` references, 5 `currentSettings` references,
7 `debugLog` references, 4 `injectMainWorldScripts` references,
2 `requestSettingsFromBackground` references, 1 `api.runtime.sendMessage`
call, 1 `api.runtime.getURL` call, 1 `api.scripting?.executeScript`
reference, 4 `document` literal occurrences, 1 `document.createElement` call,
1 `appendChild` call, 2 `setTimeout` calls, 0 `addEventListener` calls,
0 `removeEventListener` calls, 0 `MutationObserver` references,
0 `postMessage` calls, 2 `new Promise` calls, 2 `new Error` calls, 3 try
blocks, 3 catch blocks, 1 finally block, 2 await expressions, 1
`script.onload` assignment, and 1 `script.onerror` assignment. Current
behavior remains that Chromium injection sends background action
`injectScripts`, background maps caller script names to `js/*.js` and executes
them in `MAIN` world, fallback browsers append web-accessible script tags to
`document.head || document.documentElement`, Firefox adds `seed` only in the
fallback list, successful injection schedules `requestSettingsFromBackground()`
after 100ms, failed injection clears `injectionPromise`, and
`injectionInProgress` is state-only while guard decisions use
`scriptsInjected` and `injectionPromise`. It also records that
`bridgeInjectionMethodAuthority`, `bridgeInjectionScriptManifest`,
`bridgeInjectionMainWorldLoadOrderContract`, `bridgeInjectionSenderContract`,
`bridgeInjectionFallbackDomLifecycleReport`, `bridgeInjectionRetryBudget`,
`bridgeInjectionSettingsReplayContract`, `bridgeInjectionGlobalAliasContract`,
and `bridgeInjectionFixtureProvenance` do not exist in runtime source yet.

## Bridge Settings Method Addendum

`docs/audit/FILTERTUBE_BRIDGE_SETTINGS_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/bridge-settings-method-semantic-register-current-behavior.test.mjs`
promote bridge settings coverage from settings-refresh and import-relay tokens
to a source-derived method inventory. The addendum pins that
`js/content/bridge_settings.js` currently has 23 named method/helper/callback
declarations in scope: 12 plain function declarations, 1 named function
expression declaration, 10 const helper/callback declarations, 5 const arrow
helper/callback declarations, 5 const IIFE result declarations, 0 async
function declarations, 0 async const arrow declarations, 39 arrow callback
sites in scope, and 7 semantic method groups. It separates import readiness
waiters, subscription import requests, runtime action profile gates,
host-normalization behavior, background fetch/debug work, seed relay lifecycle,
and storage refresh fanout. It also records 5 `document` literal occurrences,
55 `window` literal occurrences, 6 `location` literal occurrences,
3 `globalThis` literal occurrences, 9 `browserAPI_BRIDGE` references,
10 `pendingSubscriptionImportRequests` references,
4 `subscriptionImportRequestId` references, 2 `window.addEventListener` calls,
0 `removeEventListener` calls, 1 runtime `onMessage.addListener` call,
1 storage `onChanged.addListener` call, 6 `setTimeout` calls,
2 `clearTimeout` calls, 0 `MutationObserver` references, 2 `postMessage`
calls, 2 wildcard postMessage target calls, 2 runtime sendMessage calls,
6 `applyDOMFallback` references, 4 `injectMainWorldScripts` references,
5 `sendSettingsToMainWorld` references, 4 `tryApplySettingsToSeed` references,
3 `scheduleSeedRetry` references, and 2 `handleStorageChanges` references.
Current behavior remains that subscription import is exposed through
`globalThis.FilterTubeRequestSubscribedChannelsFromMainWorld`, importer
messages require `event.source === window` and `data.source === 'injector'`,
runtime actions include `FilterTube_Ping`, `FilterTube_RefreshNow`,
`FilterTube_ImportSubscribedChannels`, and `FilterTube_ApplySettings`,
settings fetches call `getCompiledSettings`, Kids empty whitelist
normalization can flip to blocklist mode, settings are posted to
`FilterTube_SettingsToInjector` with wildcard target, seed settings retry every
250ms while pending, `channelMap`-only storage writes are ignored, and
`videoChannelMap`/`videoMetaMap` writes refresh without forced DOM reprocess.
It also records that `bridgeSettingsMethodAuthority`,
`bridgeSettingsMessageTrustContract`,
`bridgeSettingsSubscriptionImportActionToken`,
`bridgeSettingsSubscriptionImportProgressBudget`,
`bridgeSettingsRuntimeActionSenderContract`,
`bridgeSettingsSettingsRevisionContract`, `bridgeSettingsSeedRelayBudget`,
`bridgeSettingsStorageRefreshAuthority`, `bridgeSettingsProfileHostContract`,
and `bridgeSettingsFixtureProvenance` do not exist in runtime source yet.

## Handle Resolver Method Addendum

`docs/audit/FILTERTUBE_HANDLE_RESOLVER_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/handle-resolver-method-semantic-register-current-behavior.test.mjs`
promote handle resolver coverage from network/identity helper tokens to a
source-derived method inventory. The addendum pins that
`js/content/handle_resolver.js` currently has 7 named method/helper
declarations in scope: 6 plain function declarations, 1 async function
declaration, 0 const helper/callback declarations, 0 const arrow
helper/callback declarations, 5 arrow callback sites in scope, and 4 semantic
method groups. It separates learned map persistence, handle normalization,
DOM fallback rerun scheduling, and resolver fetch/cache behavior. It also
records 0 `document` literal occurrences, 5 `window` literal occurrences,
4 `browserAPI_BRIDGE` references, 8 `currentSettings` references,
3 `applyDOMFallback` references, 15 `resolvedHandleCache` references,
4 `pendingDomFallbackRerunTimer` references, 2 `FilterTube_UpdateChannelMap`
references, 1 `fetchChannelDetails` reference, 1 `updateChannelMap` reference,
12 `channelMap` references, 4 `PENDING` token occurrences, 2 `skipNetwork`
token occurrences, 3 `backgroundOnly` token occurrences, 1 `setTimeout` call,
0 `addEventListener` calls, 0 `MutationObserver` references, 2 `postMessage`
calls, 2 runtime sendMessage calls, 1 `fetch` call, 1
`browserAPI_BRIDGE.storage.local.get` reference, 1 `response.text` reference,
and 1 `text.match` reference. Current behavior remains that the resolver reads
`channelMap` before network work, uses a `PENDING` sentinel that returns null to
callers, can delegate `backgroundOnly` repair to `fetchChannelDetails`, can
fetch `/@handle/about` and `/@handle` with same-origin credentials, posts
`FilterTube_UpdateChannelMap` with wildcard target, mutates
`currentSettings.channelMap`, schedules a 250ms forced DOM fallback rerun, and
has no listener, observer, interval, teardown, settings revision, network
budget, or message trust token. It also records that
`handleResolverMethodAuthority`, `handleResolverNetworkPolicy`,
`handleResolverCacheContract`, `handleResolverMapWriteAuthority`,
`handleResolverPageMessageTrustContract`,
`handleResolverDomFallbackRerunBudget`,
`handleResolverBackgroundFetchContract`,
`handleResolverIdentityConfidenceReport`, `handleResolverNoRuleBudget`, and
`handleResolverFixtureProvenance` do not exist in runtime source yet.

## Build Release Method Addendum

`docs/audit/FILTERTUBE_BUILD_RELEASE_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/build-release-method-semantic-register-current-behavior.test.mjs`
promote build/release coverage from representative package and GitHub release
tokens to a source-derived method inventory. The addendum pins that `build.js`
currently has 25 named method/helper/callback declarations in scope: 17 plain
function declarations, 4 async function declarations, 4 const arrow
helper/callback declarations, 37 arrow token sites, 35 callback-like sites, and
6 semantic method groups. It separates package assembly, mobile artifact
staging, release prompt/body generation, GitHub release transport, interactive
prompt helpers, and README badge/LoC mutation. It also records 3 `fs.copySync`
references, 1 `fs.readJsonSync` reference, 1 `fs.writeJsonSync` reference,
2 `fs.writeFileSync` references, 8 `fs.existsSync` references,
2 `https.request` references, 2 `readline.createInterface` references,
2 `process.stdout.isTTY` references, 9 await expressions, 5 `new Promise`
references, 1 `archive.glob` reference, 1 `archive.finalize` reference,
2 `GITHUB_TOKEN` references, 1 `draft: false` reference, 1 `prerelease: false`
reference, 4 `.sha256` references, 0 listeners, 0 timers, 0 observers, and
0 fetch calls. Current behavior remains that normal builds mutate README badges
before copying packages, single-target builds do not remove the whole `dist`
directory, package roots are broad directories rather than only
manifest-referenced files, manifest validation repairs only `collab_dialog.js`
before `content_bridge.js`, ZIP creation does not emit a checksum manifest,
mobile artifact staging is opt-in and filename/versionCode based,
non-interactive terminals skip release prompting, GitHub releases are created as
public before asset uploads start, and failed asset uploads have no rollback or
delete path. It also records that `buildReleaseMethodAuthority`,
`buildPackageManifestAuthority`, `buildReadmeMutationContract`,
`buildReleaseDraftFirstContract`, `buildMobileArtifactClaimGate`,
`buildGitHubAssetUploadManifest`, `buildGeneratedUiFreshnessReport`,
`buildManifestParityReport`, `buildVendorNativeFreshnessContract`, and
`buildReleaseFixtureProvenance` do not exist in build/release source yet.

## Generated UI Shell Method Addendum

`docs/audit/FILTERTUBE_GENERATED_UI_SHELL_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/generated-ui-shell-method-semantic-register-current-behavior.test.mjs`
promote generated extension UI shell coverage from static marker checks to a
source-derived method and artifact inventory. The addendum pins
`scripts/build-extension-ui.mjs`, `src/extension-shell/popup.jsx`,
`src/extension-shell/tab-view-decor.jsx`,
`src/extension-shell/shared/runtime.js`, `js/ui-shell/popup-shell.js`, and
`js/ui-shell/tab-view-decor.js`: 249 authoring/build source lines, 697
generated output lines, 7,615 authoring/build bytes, 39,369 generated output
bytes, 8 named method/helper/component declarations in source scope, 3 plain
function declarations, 2 async function declarations, 3 export function
declarations, 2 arrow token sites, and 4 semantic method groups. It separates
the esbuild UI build script, popup shell render, tab-view ambient shell render,
and shared shell runtime. It also records 6 `document` literal occurrences in
authoring/build source, 1 `window` literal occurrence in authoring/build
source, 12 style property writes in authoring/build source, 6 dataset
writes/reads in authoring/build source, 2 render calls in authoring/build
source, 2 video JSX elements in authoring/build source, 20 `document` literal
occurrences in generated output, 2 `window` literal occurrences in generated
output, 28 style property writes in generated output, 12 dataset writes/reads
in generated output, and 4 render calls in generated output. Current behavior
remains that `npm run build:ui` and `build.js` run `scripts/build-extension-ui.mjs`,
the script writes two browser IIFE esbuild outputs into `js/ui-shell`, popup and
tab-view HTML load those generated scripts before the hand-owned popup/tab-view
runtime, generated output is tracked source, missing mount nodes skip rendering
silently, build failure sets `process.exitCode` without deleting stale output,
and no source/output freshness manifest, generated output hash manifest, or
`sourceMappingURL` exists today. It also records that
`generatedUiShellMethodAuthority`, `uiShellFreshnessManifest`,
`uiShellSourceHashManifest`, `uiShellGeneratedOutputHash`,
`uiShellGeneratedOutputOwner`, `uiShellPackageParityReport`,
`uiShellBrowserRenderFixture`, `uiShellBuildFailureContract`,
`uiShellSourceOutputDriftReport`, and `uiShellReleaseFixtureProvenance` do not
exist in generated UI shell source, generated output, build script, or HTML load
surfaces yet.

## Nanah Vendor Build Method Addendum

`docs/audit/FILTERTUBE_NANAH_VENDOR_BUILD_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/nanah-vendor-build-method-semantic-register-current-behavior.test.mjs`
promote Nanah/QR vendor build coverage from static vendor global checks to a
source-derived method, package, output, and load-order inventory. The addendum
pins `scripts/build-nanah-vendor.mjs`, `js/vendor/nanah.bundle.js`,
`js/vendor/qrcode.bundle.js`, `html/tab-view.html`, `js/tab-view.js`, and
`js/nanah_sync_adapter.js`: 65 build script lines, 2,961 vendor output lines,
1,818 build script bytes, 94,657 vendor output bytes, 4 named method/helper
declarations, 0 plain function declarations, 4 async function declarations,
1 arrow token site, and 4 semantic method groups. It separates vendor directory
preparation, QR vendor bundle build, Nanah vendor bundle build, and vendor build
orchestration. It also records 8 `path.resolve` occurrences, 2 `esbuild.build`
occurrences, 6 await expressions, 1 `fs.mkdir` occurrence, 1 `window` literal
occurrence, 0 `document` literal occurrences, 0 listeners, 0 timers,
0 observers, and 0 fetch calls in the build script. Current behavior remains
that `npm run build:nanah-vendor` is a separate package script, normal
`npm run build` does not invoke `scripts/build-nanah-vendor.mjs`, QR bundling
uses dependency range `qrcode ^1.5.4` with lockfile version `qrcode 1.5.4`,
Nanah bundling depends on sibling `../nanah`, dashboard HTML loads
`qrcode.bundle.js` before `nanah.bundle.js` before `nanah_sync_adapter.js`
before `tab-view.js`, dashboard code consumes `window.FilterTubeQrCode?.toCanvas`
and `window.FilterTubeNanah`, tracked vendor output has no `sourceMappingURL`,
and build failure sets `process.exitCode` without deleting stale vendor output.
It also records that `nanahVendorBuildMethodAuthority`,
`nanahVendorSourceRevisionManifest`, `nanahVendorOutputHashManifest`,
`nanahVendorPackageVersionManifest`, `nanahVendorSiblingRepoContract`,
`nanahVendorQrCodePackageContract`, `nanahVendorGlobalApiContract`,
`nanahVendorBuildFreshnessReport`, `nanahVendorPackageParityReport`, and
`nanahVendorFixtureProvenance` do not exist in the vendor build script, vendor
outputs, dashboard HTML, Nanah adapter, or tab-view Nanah consumer source yet.

## Legacy Layout Method Addendum

`docs/audit/FILTERTUBE_LEGACY_LAYOUT_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/legacy-layout-method-semantic-register-current-behavior.test.mjs`
promote `js/layout.js` from a quarantined legacy-layout marker to a
source-derived method, selector, visual side-effect, manifest, and package
quarantine inventory. The addendum pins `js/layout.js`: 680 source lines,
30,604 source bytes, 5 exported method declarations on `window.filterTubeLayout`,
0 plain function declarations, 5 function expression properties,
0 async function declarations, 18 arrow token sites, and 5 semantic method
groups. It separates search/watch layout repair, Shorts shelf layout repair,
homepage Shorts layout rewrite, the extreme hide writer, and the post-filter
hide sweep. It also records 63 selector API sites, 63 static selector sites,
0 dynamic selector sites, 52 unique static selector literals, 42
`querySelector` calls, 18 `querySelectorAll` calls, 3 `closest` calls, 0
`matches` calls, 12 `setAttribute` calls, 146 direct style property writes, 34
`style.display` writes, 3 `classList.add` calls, 32 `filter-tube-visible`
tokens, 10 `:not(.filter-tube-visible)` selector clauses, 15 `document` literal
occurrences, 4 `window` literal occurrences, 3 `location` literal occurrences,
0 listeners, 0 timers, 0 observers, and 0 fetch calls. Current behavior remains
that `js/layout.js` is absent from active and dist browser manifest content
scripts, copied into `dist/chrome/js/layout.js`, `dist/firefox/js/layout.js`,
and `dist/opera/js/layout.js` through `build.js` broad `COMMON_DIRS` package
copying, exposes `window.filterTubeLayout`, has no current non-doc source
caller, and can hide broad renderer families solely because
`.filter-tube-visible` is absent if reactivated. It also records that
`legacyLayoutMethodAuthority`, `legacyLayoutManifestLoadContract`,
`legacyLayoutPackageQuarantineManifest`, `legacyLayoutSelectorEffectReport`,
`legacyLayoutVisibleMarkerDecisionContract`,
`legacyLayoutExtremeHideRestoreProof`, `legacyLayoutInventoryCoveragePolicy`,
`legacyLayoutNativeSyncGate`, `legacyLayoutFixtureProvenance`, and
`legacyLayoutDeletionReadinessReport` do not exist in the layout source,
manifests, package script, or current dist manifests yet.

## Native Runtime Sync Method Addendum

`docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
and
`tests/runtime/native-runtime-sync-method-semantic-register-current-behavior.test.mjs`
promote `scripts/sync-native-runtime.mjs` from a release/native marker to a
source-derived method, package-script, delegation, manifest, and app-boundary
inventory. The addendum pins the public wrapper: 34 source lines, 1,070 source
bytes, 4 script-level semantic phases, 0 named method declarations,
0 plain function declarations, 0 async function declarations, 0 arrow token
sites, 3 import declarations, and 6 const declarations. It separates app repo
path resolution, sync script existence gating, process delegation, and status
propagation. It also records 2 `path.resolve` occurrences, 1 `path.join`
occurrence, 1 `fs.existsSync` occurrence, 2 `spawnSync` token occurrences,
1 `spawnSync` call site, 3 `process.exit` calls, 0 `process.exitCode`
occurrences, 5 `console.error` calls, 1 `console.log` call, 2 `process.env`
occurrences, 1 `process.cwd` occurrence, 1 `process.execPath` occurrence,
1 stdio inherit occurrence, 0 manifest literal reads in the public wrapper,
0 listeners, 0 timers, 0 observers, 0 fetch calls, and 0 write/copy/remove file
mutation calls in the public wrapper. Current behavior remains that
`npm run sync:native-runtime` invokes the wrapper, normal `npm run build` does
not invoke it, the wrapper resolves `FILTERTUBE_APP_REPO` or sibling
`../FilterTubeApp`, the selected app sync script is required before spawning,
delegation uses `spawnSync(process.execPath, [syncScript])` with `cwd: appRepo`,
inherited env, and inherited stdio, `result.error` exits `1`, and normal
completion exits `result.status ?? 1`. The addendum also records the sibling app
boundary: the app sync script at
`/Users/devanshvarshney/FilterTubeApp/tools/sync-runtime-from-extension.mjs`
has 2,284 lines, 109,397 bytes, 15 plain function declarations,
3 async function declarations, 18 total named function declarations,
16 `runtimeBundleOrder` entries, and reads
`runtime-sync-manifest.json`; the current app manifest has 32 entries, all
sourced from `/Users/devanshvarshney/FilterTube`, has 0 `destinationKind` fields,
includes `js/layout.js`, `js/vendor/nanah.bundle.js`, and
`js/vendor/qrcode.bundle.js`, includes the managed policy contract plus
`js/nanah_managed_live_policy.js` and `js/nanah_managed_open_sync.js`, and does
not include `data/release_notes.json`.
It also records that `nativeSyncWrapperMethodAuthority`,
`nativeSyncWrapperAppRepoContract`, `nativeSyncWrapperAppRevisionReport`,
`nativeSyncWrapperManifestHashReport`,
`nativeSyncWrapperDestinationKindManifest`,
`nativeSyncWrapperBuildIntegrationGate`,
`nativeSyncWrapperReleaseFreshnessReport`,
`nativeSyncWrapperStatusContract`, `nativeSyncWrapperFixtureProvenance`, and
`nativeSyncWrapperRawCaptureExclusionReport` do not exist in the public wrapper,
package file, build script, app sync script, or current app runtime manifest yet.
