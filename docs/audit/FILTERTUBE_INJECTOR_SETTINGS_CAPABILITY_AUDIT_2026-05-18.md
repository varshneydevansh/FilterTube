# FilterTube Injector Settings Capability Audit - 2026-05-18

Status: audit artifact only. This file does not change extension, website, or
runtime behavior.

This pass covers the isolated-to-main-world bridge formed by
`bridge_injection.js`, `bridge_settings.js`, `injector.js`, and `seed.js`.
This boundary is important because it decides when settings become active in
the page runtime, when stored YouTube snapshots are reprocessed, and when
page-visible import/collaborator/channel capabilities can run.

## Current Flow

```text
background compiled settings
        |
        v
bridge_settings.js
        |
        +--> window.postMessage(FilterTube_SettingsToInjector, source: content_bridge)
        |       |
        |       v
        |   injector.js merges currentSettings, updates seed, drains queue
        |
        +--> direct window.filterTube.updateSettings(settings)
                |
                v
            seed.js stores settings and reprocesses raw snapshots
```

The current design makes both `bridge_settings.js` and `injector.js` capable of
calling `window.filterTube.updateSettings()`. That is useful for startup races,
but it means one background settings refresh can produce more than one seed
settings apply path.

## High-Confidence Findings

| Area | Current behavior | Source proof | Risk |
| --- | --- | --- | --- |
| Settings message trust | `sendSettingsToMainWorld()` posts settings with `source: "content_bridge"` and wildcard target. It does not include nonce, capability token, or background revision fields. | `js/content/bridge_settings.js:501-508` | A page-visible postMessage source label is not a durable authority boundary. |
| Direct seed apply | `sendSettingsToMainWorld()` also tries `window.filterTube.updateSettings(settings)` directly and retries with a timer if seed is not ready. | `js/content/bridge_settings.js:468-514` | A single refresh can have two apply paths: direct seed apply and injector relay. |
| Injector settings merge | Injector accepts `FilterTube_SettingsToInjector` from `source === "content_bridge"`, merges payload into `currentSettings`, updates seed, and drains queued data. | `js/injector.js:1873-1898` | Runtime state is payload-shaped and not revision-checked before queue processing. |
| Injector seed retry | `updateSeedSettings()` calls `window.filterTube.updateSettings(currentSettings)` immediately or retries after `300ms`. | `js/injector.js:3335-3355` | Duplicate seed settings applies can reprocess snapshots more than once. |
| Seed reprocess on update | `seed.js` stores incoming settings and reprocesses raw `ytInitialData` and `ytInitialPlayerResponse` snapshots when present. | `js/seed.js:902-969` | Repeated equivalent settings applies can repeat expensive JSON processing. |
| Queue lacks revision | Injector `initialDataQueue` stores `{ name, process }` closures and drains once settings and engine are ready; queue items do not carry the settings revision that should process them. | `js/injector.js:142-144`, `3375-3399`, `3449-3488` | Old queued data can be processed under newer settings after a profile/mode change. |
| Main-world lookup requests | Injector accepts collaborator/channel requests by `source === "content_bridge"` and responds with wildcard `postMessage`. | `js/injector.js:1913-1984` | Powerful deep snapshot/DOM lookup capabilities need action/active-rule reason and request ownership. |
| Subscription import request | The subscription import request crosses the page-visible message channel with `source: "content_bridge"` and request id, but no capability token. | `js/content/bridge_settings.js:104-139`; `js/injector.js:23-36` | The highest-cost import path must remain explicit-user-action only. |
| Import side effects | Subscription import expansion scrolls, dispatches scroll, clicks "More" buttons, fetches `/youtubei/v1/browse` with credentials, and loops with budgets. | `js/injector.js:855-930`, `1239-1688` | Acceptable for explicit import, but dangerous if reachable from passive startup or spoofed message. |
| Script injection capability | The isolated bridge asks background to inject caller-provided script names in Chromium and appends web-accessible script tags in fallback browsers. | `js/content/bridge_injection.js:36-72`, `75-103` | The script set must remain fixed/allowlisted and produce one settings request cycle per runtime revision. |

## Required Future Contract

The runtime needs a single settings apply contract:

```text
background compiled settings revision
        |
        v
one bridge delivery
        |
        v
one seed settings apply
        |
        v
one bounded reprocess pass, only if revision changed
```

Every main-world capability request should carry:

```text
capability: settings | collaborator_lookup | channel_lookup | subscriptions_import
requestId
background settings revision or action token
reason: explicit-user-action | active-rule-identity-needed | startup-settings-sync
surface and route
timeout / budget
```

The important invariant is:

```text
source: "content_bridge" is a label, not proof of authority
```

Future implementation should preserve the useful startup race handling, but
move it behind revision dedupe and capability-scoped requests.

## Fixture Coverage

Executable current-behavior fixtures are in:

```text
tests/runtime/injector-settings-capability-current-behavior.test.mjs
```

They pin:

- settings relay without nonce/revision,
- duplicate direct/injector seed apply paths,
- seed snapshot reprocessing on every update,
- revisionless injector queues,
- main-world lookup response authority,
- subscription import request/side-effect budget,
- fixed script injection set and post-injection settings request timing.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this menu/dialog/injector/quick-block
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, menu action behavior, dialog lifecycle
behavior, injector behavior, quick-block behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
