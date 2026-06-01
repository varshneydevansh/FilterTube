# FilterTube P0 Manifest / Permission Current Behavior - 2026-05-19

Status: current-behavior proof. This is not an implementation patch.

This slice converts the P0 manifest/permission fixture family from the
implementation-readiness gate into runnable proof. The purpose is to keep
browser package startup, host scope, web-accessible resources, build-time
manifest mutation, and permission claims from drifting while runtime filtering
is being stabilized.

Runtime proof:

```text
tests/runtime/p0-manifest-permission-current-behavior.test.mjs
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Source Surface

| Source | Current role |
| --- | --- |
| `manifest.json:25-59` | Default package loads `js/seed.js` in `MAIN` world, then the isolated helper stack at `document_start`. |
| `manifest.chrome.json:25-59` | Chrome package currently mirrors the default package startup model. |
| `manifest.firefox.json:30-50` | Firefox package has one isolated content-script stack and relies on fallback page-script injection for the page runtime. |
| `manifest.opera.json:29-61` | Opera package has two content-script entries but no explicit `world` declarations. |
| `manifest*.json:18-24` | All browser packages request `storage`, `activeTab`, `scripting`, `tabs`, and `downloads`. |
| `manifest*.json:82-85` | All browser packages host-permit YouTube, YouTube NoCookie, and YouTube Kids. |
| `manifest*.json:61-75` | Web-accessible runtime resources are exposed only to YouTube and YouTube Kids matches today. |
| `js/content/bridge_injection.js:75-103` | Fallback injection loads shared identity, filter logic, Firefox seed, and injector into the page. |
| `build.js:120-179` | Build copies browser-specific manifests and only repairs collaborator-before-bridge script order. |

## Current Behavior Matrix

| P0 fixture | Current result | Evidence | Risk |
| --- | --- | --- | --- |
| `chrome_manifest_main_world_seed_ready` | Source-local satisfied for default/Chrome. | Default and Chrome manifests declare `js/seed.js` as the first `MAIN` content script at `document_start`, followed by isolated helpers. | Startup parity can still drift if only one manifest is edited or packaged. |
| `firefox_fallback_injection_reports_seed_ready` | Not satisfied as a readiness report. | Firefox has no manifest `MAIN` world entry; `bridge_injection.js` pushes `seed` only inside the Firefox fallback list. | Firefox can fail differently from Chrome, and the current source has no structured seed-ready or failure report. |
| `opera_world_model_is_proven_or_not_claimed` | Not satisfied. | Opera content-script entries omit explicit `world` declarations. | Opera runtime world behavior is ambiguous, so Chrome parity should not be claimed as proven. |
| `youtube_nocookie_host_scope_is_classified` | Not satisfied. | All manifests host-permit `youtube-nocookie.com`, but content-script and web-accessible matches do not include it. | Store/privacy claims can overstate active runtime coverage if host permission is confused with injected filtering. |
| `web_accessible_resources_are_allowlisted` | Partially source-local. | Runtime JS resources are listed, but there is no committed authority report with per-resource reason, owner, and browser parity. Opera also differs for `icons/file.svg`. | Page-accessible code surface can grow accidentally with no reviewable reason. |
| `build_rejects_manifest_permission_drift` | Not satisfied. | Build copies manifests and repairs only `collab_dialog.js` before `content_bridge.js`; no permission, host, world, or resource validation exists. | Release ZIPs can preserve manifest drift silently. |
| `permissions_map_to_trusted_sender_features` | Not satisfied. | Permissions are shared across browser packages, but no matrix maps `tabs`, `scripting`, `downloads`, `activeTab`, and host permissions to trusted sender classes. | Permission breadth can amplify message-trust gaps around tab opening, script injection, downloads, and background fetches. |

## Why This Blocks Behavior Changes

Browser manifests decide the first runtime owner:

```text
manifest package
        |
        +--> page world or isolated world
        +--> document_start order
        +--> fallback script injection
        +--> active host scope
        +--> web-accessible runtime surface
        +--> privileged background permissions
        |
        v
seed JSON interception + DOM fallback + prompt overlays + message/injection authority
```

If runtime cleanup assumes the Chrome/default startup model, Firefox and Opera
can regress even when local Chrome tests pass. If host permission claims are not
classified, YouTube NoCookie can look supported because it is host-permitted
even though no content-script or web-accessible match currently runs there. If
web-accessible resources and permissions are not reasoned, future script
injection or tab-opening hardening can miss a browser package.

## Required Future Contract

Before manifest or permission behavior changes, add one manifest authority:

```text
manifestAuthority({
  browserPackage,
  contentScriptWorld,
  runAt,
  startupOrder,
  seedReady,
  fallbackInjectionReady,
  hostScopeClass,
  webAccessibleResourceReason,
  permissionFeatureOwner,
  trustedSenderClass,
  buildValidationResult
})
```

This report should be derivable before:

- changing content-script order,
- changing browser-specific manifests,
- claiming browser parity,
- adding or removing host permissions,
- changing web-accessible resources,
- changing script injection behavior,
- changing tab/window navigation behavior,
- packaging browser ZIPs.

## Implementation Boundary

Allowed now:

- keep this current-behavior proof green,
- add read-only manifest validation reports,
- add package-specific startup readiness counters,
- add per-resource and per-permission reason manifests.

Blocked now:

- changing manifest permissions or host permissions,
- changing content-script world/order,
- changing Firefox fallback injection semantics,
- claiming Opera world parity without proof,
- claiming YouTube NoCookie active filtering coverage,
- adding web-accessible resources without a reason/owner report,
- changing build packaging around manifests.
