# FilterTube Background Message Action Semantic Register - Current Behavior - 2026-05-21

Status: audit-only proof. This is not an implementation patch.
Runtime behavior is unchanged.

## Purpose

This register promotes the background message/mutation method family from
representative method coverage to a source-derived semantic action inventory.
It covers the current `js/background.js` runtime message surface:

```text
runtime.onMessage listeners: 2
current action/type branches: 31
extraction rule: action === "...", request.action === "...", message.type === "..."
```

This is not completion proof for every background method. It records the current
action router, sender/guard shape, observable side effects, and the proof still
needed before any background message, mutation, fetch, cache, script-injection,
prompt, stats, backup, or rule path is changed.

## Semantic Action Inventory

| Action/type | Receiver | Source proof | Semantic class | Current sender/guard shape | Current observable effects | Missing proof before behavior changes |
| --- | --- | --- | --- | --- | --- | --- |
| `FilterTube_ReleaseNotesCheck` | listener #1, `action = request.action || request.type` | `js/background.js:3171` | `promptOrRelease` | Any runtime sender with action/type shape. | Reads release note storage, can build/cache release payload, returns banner state. | Prompt/release caller class, version freshness, storage write, and duplicate-prompt proof. |
| `FilterTube_ReleaseNotesAck` | listener #1 | `js/background.js:3200` | `promptOrRelease` | Any runtime sender with action/type shape. | Writes `releaseNotesSeenVersion` and clears cached payload. | Trusted acknowledgement actor, version target, replay, and prompt-coordinator proof. |
| `FilterTube_FirstRunCheck` | listener #1 | `js/background.js:3210` | `promptOrRelease` | Any runtime sender with action/type shape. | Reads `firstRunRefreshNeeded` and returns prompt eligibility. | Prompt coordinator, install/update state, and duplicate prompt proof. |
| `FilterTube_FirstRunComplete` | listener #1 | `js/background.js:3215` | `promptOrRelease` | Any runtime sender with action/type shape. | Writes `firstRunRefreshNeeded: false`. | Trusted acknowledgement actor and replay/rollback proof. |
| `FilterTube_OpenWhatsNew` | listener #1 | `js/background.js:3223` | `tabOpen` | Any runtime sender with action/type shape; accepts caller `request.url`. | Opens a new active tab. | Trusted UI sender and fixed allowlisted release URL proof. |
| `FilterTube_SubscriptionsImportProgress` | listener #1 | `js/background.js:3235` | `progressRelay` | Any runtime sender with action/type shape. | Logs import progress and acknowledges. | Import request correlation, source tab, payload shape, and spoof-negative proof. |
| `getCompiledSettings` | listener #1 | `js/background.js:3244` | `settingsCompileCache` | Sender URL and optional `request.profileType` determine Main/Kids profile. | Reads/compiles settings, can return cached payload, assigns `compiledSettingsCache`. | Background-owned revision, profile identity, cache provenance, and no-work proof. |
| `FilterTube_SessionPinAuth` | listener #1 | `js/background.js:3268` | `securitySession` | `isTrustedUiSender(sender)`. | Verifies PIN and writes session PIN cache. | Session actor, profile target, lock state, expiry, and failed-attempt proof. |
| `FilterTube_ClearSessionPin` | listener #1 | `js/background.js:3281` | `securitySession` | `isTrustedUiSender(sender)`. | Deletes session PIN cache entry. | Session actor, profile target, and lock state proof. |
| `FilterTube_SetListMode` | listener #1 | `js/background.js:3292` | `ruleMutation` | `isTrustedUiSender(sender)`. | Writes V4/legacy list state, can merge/clear lists, nulls caches, schedules backup, broadcasts refresh. | Transition report, `copyBlocklist` policy, active profile/lock, before/after list, backup, and refresh proof. |
| `addWhitelistChannelPersistent` | listener #1 | `js/background.js:3506` | `ruleMutation` | `isTrustedUiSender(sender)`. | Calls `handleAddFilteredChannel()` for Main whitelist and can schedule backup. | Target profile/list, duplicate identity, lock/session, and channel provenance proof. |
| `FilterTube_BatchImportWhitelistChannels` | listener #1 | `js/background.js:3545` | `ruleMutation` | `isTrustedUiSender(sender)`, active profile check, session authorization. | Writes Main whitelist, V3/V4 profiles, channel map, cache invalidation, backup, and tab refresh. | Import request correlation, inactive-while-blocklist result, rollback, and negative spoof proof. |
| `FilterTube_KidsWhitelistChannel` | listener #1 | `js/background.js:3714` | `ruleMutation` | `isTrustedUiSender(sender)`. | Calls shared channel helper for Kids whitelist and can schedule backup. | Kids profile lock/session, route/surface, identity confidence, and list-target proof. |
| `FilterTube_TransferWhitelistToBlocklist` | listener #1 | `js/background.js:3767` | `ruleMutation` | `isTrustedUiSender(sender)`. | Moves whitelist entries into blocklist, clears whitelist arrays, nulls caches, refreshes tabs, schedules backup. | Destructive transition report, legacy parity, channel-derived keyword preservation, and rollback proof. |
| `FilterTube_ScheduleAutoBackup` | listener #1 | `js/background.js:3964` | `backupSchedule` | Any runtime sender with action/type shape. | Schedules background backup using caller trigger, options, and delay. | Trusted/internal actor, delay clamp, dedupe key, mutation revision, and rate-limit proof. |
| `fetchShortsIdentity` | listener #1 | `js/background.js:3975` | `identityNetworkResolver` | Any runtime sender with action/type shape. | Validates video id, checks session/pending caches, may perform credentialed Shorts HTML fetch. | Route/profile/list mode, unresolved identity reason, fetch budget, cache provenance, and negative sender proof. |
| `fetchWatchIdentity` | listener #1 | `js/background.js:3978` | `identityNetworkResolver` | Any runtime sender with action/type shape. | Validates video id/profile, may perform credentialed YouTube or Kids watch HTML fetch. | Watch/Kids route proof, active resolver need, credentials policy, cache budget, and negative sender proof. |
| `FilterTube_KidsBlockChannel` | listener #1 | `js/background.js:3981` | `ruleMutation` | Any runtime sender with action/type shape. | Calls shared channel helper for Kids blocklist and can schedule backup. | Allowed Kids/native sender, Kids profile lock, identity confidence, backup, and refresh proof. |
| `injectScripts` | listener #1 | `js/background.js:4023` | `scriptInjection` | Sender tab/frame shape; caller supplies script names. | Maps caller names to `js/*.js` and executes them in `world: 'MAIN'`. | Static allowlist, trusted caller class, target tab URL, frame scope, and duplicate injection proof. |
| `FilterTube_EnsureSubscriptionsImportBridge` | listener #1 | `js/background.js:4069` | `scriptInjection` | Caller supplies numeric `tabId`. | Injects fixed import bridge files in `world: 'ISOLATED'`. | Trusted UI import actor, target URL allowlist, request correlation, and duplicate injection proof. |
| `processFetchData` | listener #1 | `js/background.js:4101` | `legacyDiagnostic` | Any runtime sender with action/type shape. | Logs URL/data presence and returns without processing. | Explicit deprecation or ownership proof before deletion, centralization, or behavior reuse. |
| `addChannelPersistent` | listener #1 | `js/background.js:4109` | `ruleMutation` | Any runtime sender with action/type shape. | Normalizes channel input, may fetch channel info, writes Main blocklist/V4 state, updates `channelMap`, schedules backup. | Sender class, target list, resolver reason, lock/session, duplicate identity, and backup proof. |
| `FilterTube_ApplySettings` | listener #1 | `js/background.js:4395` | `settingsCompileCache` | Any runtime sender with `request.settings`. | Clears the target cache, recompiles background settings from storage, and broadcasts compiled settings to tabs. | Background-owned compile revision, sender gate, stale payload rejection, and tab broadcast authority. |
| `updateChannelMap` | listener #1 | `js/background.js:4423` | `learnedIdentityWrite` | Any runtime sender with mappings payload. | Enqueues channel-map writes. | Valid handle/UC shape, source provenance, active need, cap, stale identity, and sender proof. |
| `updateVideoChannelMap` | listener #1 | `js/background.js:4426` | `learnedIdentityWrite` | Any runtime sender with video/channel ids. | Enqueues video-channel map writes. | Video id/UC validation, renderer/card provenance, route/surface reason, and cache invalidation proof. |
| `updateVideoMetaMap` | listener #1 | `js/background.js:4433` | `learnedIdentityWrite` | Any runtime sender with metadata entries. | Enqueues video metadata writes. | Active metadata-filter reason, schema cap, route/surface provenance, and stale metadata proof. |
| `recordTimeSaved` | listener #1 | `js/background.js:4449` | `statsMutation` | Any runtime sender with seconds payload. | Reads/writes legacy `stats.savedSeconds` using caller seconds. | Structured hide decision, finite/range clamp, surface scope, trusted sender, and restore decrement proof. |
| `fetchChannelDetails` | listener #1 | `js/background.js:4463` | `identityNetworkResolver` | Any runtime sender with channel id/handle. | Calls `fetchChannelInfo()` and can fetch credentialed YouTube channel HTML. | Explicit user action or active resolver need, input validation, credentials policy, cache budget, and negative sender proof. |
| `getBrowserInfo` | listener #1 | `js/background.js:4475` | `diagnosticResponse` | Any runtime sender with action shape. | Returns browser-family booleans/labels. | Low filtering risk, but still needs receiver ownership if exposed as a public API. |
| `addFilteredChannel` | listener #2, `message.type` only | `js/background.js:5244` | `ruleMutation` | Any runtime sender with `message.type`; secondary listener now forwards normalized `message.listType`. | Calls `handleAddFilteredChannel()`, can write rules/learned identity and schedule list-target backup. | Sender class, list target authority, lock/session, menu-action target, and duplicate identity proof. |
| `toggleChannelFilterAll` | listener #2, `message.type` only | `js/background.js:5282` | `ruleMutation` | Any runtime sender with `message.type`. | Calls `handleToggleChannelFilterAll()` and can schedule backup. | Channel row authority, sender class, lock/session, target profile/list, and backup proof. |

## Cross-Feature Risk Shape

The current background action router is a cross-feature junction:

```text
message action/type
  -> prompt/release state
  -> settings compile/cache and tab broadcasts
  -> profile/list/rule mutations
  -> learned identity maps and metadata
  -> credentialed identity fetches
  -> script injection and import bridge injection
  -> stats and backup scheduling
```

Changing one action without the whole action contract can leave an equivalent
side effect reachable through a sibling branch. For example, hardening
`addWhitelistChannelPersistent` does not harden secondary `addFilteredChannel`;
optimizing identity fetches does not classify `fetchShortsIdentity`,
`fetchWatchIdentity`, and `fetchChannelDetails` together; treating UI settings
as canonical does not close `FilterTube_ApplySettings` cache authority.

## Required Future Action Contract

Before any behavior change to this surface, each action needs:

```text
actionName
receiverId
senderClass
routeOrOrigin
profileType
profileId
listMode
targetList
lockSessionState
inputSchema
storageKeysTouched
networkAuthority
scriptInjectionAuthority
tabBroadcastAuthority
compiledCacheRevision
learnedIdentityProvenance
statsOrBackupReason
positiveFixture
negativeSenderFixture
negativePayloadFixture
restoreOrRollbackProof
```

## Runtime Authority Status

No runtime symbol exists yet for:

- `backgroundMessageActionAuthority`
- `backgroundActionSemanticReport`
- `messageActionEffectDecision`
- `messageActionSenderContract`

This register does not permit message hardening, mutation refactors, cache
rewrites, network resolver changes, script-injection changes, stats changes,
backup scheduling changes, or list-mode behavior changes. It is a current-state
semantic inventory and a fixture gate.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
