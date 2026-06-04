# FilterTube Manifest And Permission Authority Audit - 2026-05-18

Status: current-behavior audit. This is not an implementation patch.

This artifact covers the extension manifests and package-time manifest handling.
Manifest choices define where FilterTube can run, which execution world owns the
first code, which files page scripts can load, and which public privacy claims
are actually true.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Source Map

| Surface | Files | Current owner |
| --- | --- | --- |
| Default/Chrome manifest | `manifest.json`, `manifest.chrome.json` | MV3 service worker, MAIN-world seed, isolated runtime, YouTube/Kids host scope |
| Firefox manifest | `manifest.firefox.json` | MV3 background scripts, isolated runtime, fallback page-script injection |
| Opera manifest | `manifest.opera.json` | MV3 service worker, no explicit `world` keys, Opera developer metadata |
| Build manifest mutation | `build.js:120-134`, `159-179` | Copies `manifest.${browser}.json` into `dist/${browser}/manifest.json` and only repairs collaborator script order |
| Runtime injection fallback | `js/content/bridge_injection.js:75-103` | Injects `shared/identity`, `filter_logic`, optional Firefox `seed`, then `injector` |

## Current Manifest Matrix

| Manifest | Background | Page runtime declaration | Web-accessible JS | Host permissions |
| --- | --- | --- | --- | --- |
| `manifest.json` | `service_worker: js/background.js` | `js/seed.js` in `MAIN`, isolated helper stack at `document_start` | `js/injector.js`, `js/filter_logic.js`, `js/seed.js`, `js/shared/identity.js`, `icons/file.svg` | `youtube.com`, `youtube-nocookie.com`, `youtubekids.com` |
| `manifest.chrome.json` | Same as default | Same as default | Same as default | Same as default |
| `manifest.firefox.json` | `scripts: [js/shared/identity.js, js/background.js]` | One isolated helper stack; no manifest `world: MAIN` entry | Same as default | Same as default |
| `manifest.opera.json` | `service_worker: js/background.js` | Two content-script entries but no explicit `world` keys | `js/injector.js`, `js/filter_logic.js`, `js/seed.js`, `js/shared/identity.js`; no `icons/file.svg` | Same as default |

All four browser manifests currently declare extension version `3.3.2`.

## Current Behavior Findings

| Area | Current behavior | Proof | Risk | Future gate |
| --- | --- | --- | --- | --- |
| Default/Chrome world split | Default and Chrome manifests load `js/seed.js` in `MAIN` at `document_start`, then isolated helpers ending with `content_bridge.js`. | `manifest.json:25-59`; `manifest.chrome.json:25-59` | This is the intended JSON-first path, but any order drift changes whether seed, DOM fallback, prompts, and bridge are ready at the same time. | Manifest-order fixture covering every browser package, not only default manifest. |
| Firefox page-world path | Firefox does not declare a separate `world: MAIN` seed content script. It loads isolated helpers and relies on `bridge_injection.js` fallback to inject `seed` as a page script. | `manifest.firefox.json:30-50`; `js/content/bridge_injection.js:85-93` | Firefox startup and filtering depend on fallback script injection and web-accessible resources, not the same path as Chrome. | Firefox-specific fixture for seed/injector ready state and failure reporting. |
| Opera world ambiguity | Opera manifest has two content-script entries but no explicit `world` keys. | `manifest.opera.json:29-61` | If Opera treats `js/seed.js` as isolated, the first-run JSON interception path differs from Chrome. | Opera manifest/runtime proof or explicit package policy before claiming parity. |
| Host/content mismatch | All manifests request `*://*.youtube-nocookie.com/*` as a host permission, but content scripts and web-accessible resource matches are only `youtube.com` and `youtubekids.com`. | `manifest.json:27-73`, `82-85`; same browser manifests | The extension may have permission for YouTube NoCookie without page runtime coverage there; privacy/store claims must distinguish permission scope from active filtering. | Manifest claim fixture: every host permission is classified as active runtime, resource-only, fetch-only, or reserved. |
| Web-accessible resource parity | Default/Chrome/Firefox expose `icons/file.svg`; Opera does not. All expose `injector`, `filter_logic`, `seed`, and shared identity to YouTube/Kids pages. | `manifest.json:61-74`; `manifest.firefox.json:51-61`; `manifest.opera.json:63-75` | Page-accessible code surface differs by browser; adding a packaged JS file later can unintentionally make it injectable if `injectScripts` remains caller-controlled. | Web-accessible allowlist fixture and package parity report. |
| Permission breadth | All manifests request `storage`, `activeTab`, `scripting`, `tabs`, and `downloads`. | `manifest.json:18-24`; browser manifest parity | These are justified by current features, but `scripting` and `tabs` amplify message-trust risks around caller-controlled injection and tab opening. | Permission-to-feature map plus sender-class fixtures for every `tabs`/`scripting` call. |
| Version parity | All browser manifests currently declare `3.3.2`. | `manifest.json:5`; browser manifest parity | Manifest version drift can make package, release-note, dashboard, and installed-profile evidence disagree. | Single release version source and package-time parity fixture before publishing. |
| Build-time manifest guard | Build copies browser-specific manifests and only repairs `collab_dialog.js` ordering before `content_bridge.js`. | `build.js:120-134`, `159-179` | Build can preserve manifest drift in permissions, hosts, web resources, and world declarations. | Build manifest validation fixture before ZIP packaging. |

## Authority Flow

```text
browser manifest
        |
        +--> where code runs (MAIN / isolated / fallback script tag)
        +--> when code runs (document_start)
        +--> where runtime is active (matches)
        +--> what page can load (web_accessible_resources)
        +--> what background may do (permissions + host_permissions)
        |
        v
seed interception + DOM fallback + prompt overlays + message/injection authority
```

## Required Before Manifest/Permission Changes

1. Browser-package parity fixture for default, Chrome, Firefox, and Opera.
2. Host scope classification for `youtube.com`, `music.youtube.com`,
   `youtube-nocookie.com`, and `youtubekids.com`.
3. Web-accessible resource allowlist with a reason for every resource.
4. Manifest build validation before ZIP creation.
5. Browser-specific seed/injector readiness proof, especially Firefox fallback
   injection and Opera world behavior.
6. Permission-to-feature matrix tying `tabs`, `scripting`, `downloads`,
   `activeTab`, and host permissions to trusted sender classes.

## Current Verdict

Manifest/permission authority is mapped but not implementation-ready. Runtime
cleanup must not assume all browser targets share Chrome’s MAIN-world startup
model until package-specific fixtures prove it.
