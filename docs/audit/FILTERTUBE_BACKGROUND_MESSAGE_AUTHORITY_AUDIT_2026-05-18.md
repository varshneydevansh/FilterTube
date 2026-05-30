# FilterTube Background Message Authority Audit - 2026-05-18

Status: audit artifact only. This file does not change extension, website, or
runtime behavior.

This pass covers the background/service-worker message boundary in
`js/background.js`. The goal is to separate trusted UI mutations, content-script
runtime updates, learned-map writes, tab broadcasts, and script injection paths
before any optimization or whitelist/blocklist behavior changes.

## Source Boundary Note

The root HTML/JSON/TXT files listed in `.gitignore` are raw YouTube evidence
captures. They are useful for proving renderer and endpoint behavior, and they
were used to build:

- `docs/json_paths_encyclopedia.md`
- `docs/youtube_renderer_inventory.md`

They are not background message source. For executable proof, extract only
minimal fragments into `tests/runtime/fixtures/captures/` and keep the raw root
captures ignored.

## Current Message Shape

```text
js/background.js
  runtime.onMessage listener #1
    action = request.action || request.type
    release notes / first run / settings compile / UI mutations
    channel add paths / map writes / stats / fetch details / injection

  runtime.onMessage listener #2
    message.type only
    addFilteredChannel / toggleChannelFilterAll
```

The split matters because product actions do not pass through one mutation
schema. Some actions are guarded by `isTrustedUiSender(sender)`, while others
mutate storage, caches, maps, stats, or tabs from content-script/runtime entry
points.

## Guarded UI Paths

| Action | Current guard | Source proof | Authority |
| --- | --- | --- | --- |
| `FilterTube_SessionPinAuth` | `isTrustedUiSender(sender)` | `js/background.js:3266-3270` | Session PIN cache mutation. |
| `FilterTube_ClearSessionPin` | `isTrustedUiSender(sender)` | `js/background.js:3279-3283` | Session PIN cache deletion. |
| `FilterTube_SetListMode` | `isTrustedUiSender(sender)` | `js/background.js:3290-3302` | Main/Kids list-mode mutation, blocklist merge/clear, tab refresh broadcast. |
| `addWhitelistChannelPersistent` | `isTrustedUiSender(sender)` | `js/background.js:3498-3519` | Main whitelist channel add through the shared channel helper. |
| `FilterTube_BatchImportWhitelistChannels` | `isTrustedUiSender(sender)` | `js/background.js:3537-3545` | Subscription import merge into whitelist state. |
| `FilterTube_KidsWhitelistChannel` | `isTrustedUiSender(sender)` | `js/background.js:3706-3740` | Kids whitelist channel add. |
| `FilterTube_TransferWhitelistToBlocklist` | `isTrustedUiSender(sender)` | `js/background.js:3759-3767` | Whitelist-to-blocklist transfer. |

These are the paths closest to the intended future model: every mutating action
should name its caller, target profile, target list, storage writes, runtime
cache invalidation, broadcast scope, and rollback/failure result.

## Unguarded Or Split Mutation Paths

| Action | Current behavior | Source proof | Risk |
| --- | --- | --- | --- |
| `FilterTube_ApplySettings` | Caller-provided `request.settings` is treated as an invalidation signal; background clears the target cache, recompiles from storage, and broadcasts compiled settings to matching YouTube tabs. | `js/background.js:4395-4422` | Sender/revision proof is still missing, but UI/content payload no longer becomes runtime cache authority. |
| `FilterTube_KidsBlockChannel` | Adds a Kids blocked channel without the `isTrustedUiSender(sender)` guard used by Kids whitelist. | `js/background.js:3967-4008` | Kids block and Kids whitelist have different trust boundaries for similar native/UI actions. |
| `addChannelPersistent` | Legacy persistent blocklist add path writes `filterChannels` and maybe V4 profile data without the guarded UI check used by whitelist add. | `js/background.js:4095-4380` | Split channel-add authorities can diverge on normalization, list target, backup, and refresh behavior. |
| `addFilteredChannel` listener #2 | Calls `handleAddFilteredChannel(...)` from `message.type` without forwarding `message.listType`. | `js/background.js:5209-5237` | Shared 3-dot/native add path defaults to blocklist even though the helper supports whitelist. |
| `toggleChannelFilterAll` listener #2 | Mutates per-channel filter-all state from a separate message listener. | `js/background.js:5249-5258` | Another channel mutation authority outside the primary action switch. |
| `updateChannelMap` | Enqueues learned handle/UC mappings. | `js/background.js:4397-4399` | Learned identity writes should be active-need and source-attributed. |
| `updateVideoChannelMap` | Enqueues video-to-channel mappings. | `js/background.js:4400-4406` | Page/content identity writes can affect future whitelist/blocklist decisions. |
| `updateVideoMetaMap` | Enqueues video metadata writes. | `js/background.js:4407-4422` | Metadata writes can wake duration/date decisions later. |
| `recordTimeSaved` | Reads/writes `stats` from message-provided seconds without a finite-number or range clamp. | `js/background.js:4423-4434` | Stats are runtime-visible product state and need a hide-reason/budget owner. |
| `FilterTube_OpenWhatsNew` | Opens `request.url || WHATS_NEW_PAGE_URL` in a new tab. | `js/background.js:3221-3232` | A caller-provided URL should be allowlisted or ignored so this remains a release-notes action, not arbitrary tab-open authority. |

## Injection And Broadcast Paths

| Path | Current behavior | Source proof | Risk |
| --- | --- | --- | --- |
| `sendMessageToTabQuietly` | Broadcast helper swallows receiving-end errors and forwards payloads to tabs. | `js/background.js:44-55` | Useful but hides whether runtime receivers actually accepted a settings refresh. |
| List-mode refresh broadcast | After mode change, all matching YouTube/Kids tabs receive `FilterTube_RefreshNow`. | `js/background.js:3482-3488` | Correct broad invalidation today, but future revisioned settings should make the target/profile explicit. |
| `handleAddFilteredChannel` Kids broadcast | Kids channel mutation can broadcast `FilterTube_RefreshNow` to Kids tabs. | `js/background.js:6113-6119` | Mutation helper owns both storage and refresh side effects. |
| `injectScripts` | Executes caller-provided `js/...` files in `world: "MAIN"` for the sender tab/frame, with no current script allowlist or sender-tab URL validation in that branch. | `js/background.js:4009-4054` | Needs an explicit allowlist and caller contract before it is treated as a stable public background action. |
| `FilterTube_EnsureSubscriptionsImportBridge` | Executes a fixed isolated-file bridge into caller-provided `tabId`, without checking trusted UI sender or the target tab URL in that branch. | `js/background.js:4055-4086` | Useful for import, but tab ownership and trusted UI caller should be pinned by fixture. |
| `fetchChannelDetails` | Background fetches channel information for caller-provided ID/handle. | `js/background.js:4437-4445` | This is network-visible and should be tied to explicit user action or resolver budget. |
| `fetchChannelInfo` implementation | Channel detail lookup fetches YouTube HTML with credentials included. | `js/background.js:4617-4618` | Not arbitrary-domain fetch, but still caller-triggered authenticated YouTube activity. |

## Why This Matters For Lag And False Hides

```text
content/runtime message
        |
        +--> learned channel/video/meta map writes
        |       |
        |       +--> later DOM fallback / whitelist pending decisions
        |
        +--> background recompile before settings broadcast
        |       |
        |       +--> all matching tabs receive apply-settings broadcast
        |
        +--> channel add / filter-all / stats mutations
        |       |
        |       +--> backup scheduling, refresh broadcasts, future filter state
```

If these paths remain separate, a fix in JSON filtering or DOM fallback can still
be bypassed by a background mutation path that learns stale identity, applies
stale settings, or targets the wrong list mode.

## Required Future Contract

Before changing behavior, add a single background mutation contract:

```text
message action
  -> trusted sender class
  -> explicit mutation intent
  -> target profile
  -> target viewing surface
  -> target list type
  -> storage keys allowed to write
  -> compiled settings revision invalidated/generated
  -> tabs allowed to broadcast
  -> explicit response and error contract
```

No settings cache, profile state, learned map, or stats mutation should happen
without that contract. Content-script learned-map writes can remain supported,
but they need active-need gates, source attribution, caps, and stale-identity
fixtures.

## Fixture Coverage

Executable current-behavior fixtures are in:

```text
tests/runtime/background-message-authority-current-behavior.test.mjs
```

They pin:

- the two background message listeners,
- current trusted UI guard coverage,
- current unguarded/split mutation paths,
- caller-supplied release tab URL authority,
- `FilterTube_ApplySettings` cache and broadcast authority,
- script-injection and subscriptions-bridge boundaries,
- caller-triggered channel detail fetch authority,
- raw `recordTimeSaved` stats mutation,
- capture corpus files as ignored evidence, not message source.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
