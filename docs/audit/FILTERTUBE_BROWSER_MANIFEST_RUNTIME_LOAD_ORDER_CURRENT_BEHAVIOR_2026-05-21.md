# FilterTube Browser Manifest Runtime Load Order - Current Behavior

Date: 2026-05-21

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch, manifest change, package release gate, browser parity
claim, or JSON-first promotion.

This slice extends the active audit goal for the four tracked browser manifest
files. Manifest load order determines which code can intercept page JSON first,
which code runs in isolated extension context, what the page can request as
web-accessible resources, and which hosts are permitted but not actually
content-script matched.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Manifest File Fingerprints

The tracked manifest surface has 4 files, 340 newline counts, and 9,573 bytes:

| Path | Lines | Bytes | SHA-256 | Current package role |
| --- | ---: | ---: | --- | --- |
| `manifest.json` | 88 | 2,513 | `282bbf5f84819af6af4edcab1c7a21f16c1f6f50501492226c1065125c287734` | Default/unpacked Chromium-style manifest |
| `manifest.chrome.json` | 88 | 2,513 | `282bbf5f84819af6af4edcab1c7a21f16c1f6f50501492226c1065125c287734` | Build input for Chrome/Edge/Brave ZIP |
| `manifest.firefox.json` | 75 | 2,029 | `c84368c9db6a4900bb6ff055b66a645a88176d3533e307eee0dcb8d230fae2bb` | Build input for Firefox ZIP |
| `manifest.opera.json` | 89 | 2,518 | `0f0b77df312bf8b45a40e652bd7fc4ee4af270945b4e38e9353ebfdc1caf1e2b` | Build input for Opera ZIP |

`manifest.json` and `manifest.chrome.json` are byte-identical today. The build
script does not read `manifest.json` for browser ZIP creation; it reads
`manifest.${browser}.json` and writes `dist/${browser}/manifest.json`.

## Common Permission And Host Surface

All four manifests currently share:

- `manifest_version: 3`
- `version: 3.3.2`
- permissions: `storage`, `activeTab`, `scripting`, `tabs`, `downloads`
- host permissions: `*://*.youtube.com/*`,
  `*://*.youtube-nocookie.com/*`, `*://*.youtubekids.com/*`
- action popup: `html/popup.html`
- action icons: `icons/icon-16.png`, `icons/icon-48.png`,
  `icons/icon-128.png`
- extension icons: `icons/icon-16.png`, `icons/icon-32.png`,
  `icons/icon-48.png`, `icons/icon-128.png`

All content-script and web-accessible-resource matches are currently only:

- `*://*.youtube.com/*`
- `*://*.youtubekids.com/*`

Therefore `youtube-nocookie.com` is host-permitted but not content-script or
web-resource matched. That is a public-claim and host-scope classification gap,
not active filtering coverage proof.

## Runtime Load-Order Matrix

| Manifest | Background owner | Content-script entries | Page-runtime seed path | Isolated/helper stack | Web-accessible resources |
| --- | --- | ---: | --- | --- | --- |
| `manifest.json` | MV3 `service_worker: js/background.js` | 2 | first entry: `js/seed.js`, `world: MAIN`, `document_start` | second entry: 14 scripts, `world: ISOLATED`, `document_start` | `js/injector.js`, `js/filter_logic.js`, `js/seed.js`, `js/shared/identity.js`, `icons/file.svg` |
| `manifest.chrome.json` | MV3 `service_worker: js/background.js` | 2 | first entry: `js/seed.js`, `world: MAIN`, `document_start` | second entry: 14 scripts, `world: ISOLATED`, `document_start` | same as default |
| `manifest.firefox.json` | `background.scripts`: `js/shared/identity.js`, `js/background.js` | 1 | no manifest MAIN-world seed; fallback injection pushes `seed` in `js/content/bridge_injection.js` | one 14-script stack with no `world` field, `document_start` | same as default |
| `manifest.opera.json` | MV3 `service_worker: js/background.js` | 2 | first entry: `js/seed.js`, no explicit `world`, `document_start` | second entry: 14 scripts, no explicit `world`, `document_start` | runtime JS resources only; no `icons/file.svg` |

The shared helper stack order is:

```text
js/shared/identity.js
js/content/dom_state.js
js/content/menu.js
js/content/dom_helpers.js
js/content/dom_extractors.js
js/content/dom_fallback.js
js/content/block_channel.js
js/content/bridge_injection.js
js/content/bridge_settings.js
js/content/handle_resolver.js
js/content/collab_dialog.js
js/content/release_notes_prompt.js
js/content/first_run_prompt.js
js/content_bridge.js
```

Current source has 59 content-script file references across all manifests and
15 unique content-script files. All referenced content-script files are tracked.
No manifest declares `content_scripts.css`.

## Firefox And Opera Runtime Split

Firefox does not declare `js/seed.js` as a manifest content script. Its page
runtime path depends on `js/content/bridge_injection.js:85-93`, which builds:

```text
shared/identity, filter_logic, seed, injector
```

for Firefox fallback injection. That path depends on web-accessible resources
and script-tag injection rather than the Chrome/default manifest MAIN-world
content-script entry.

Opera has two content-script entries like default/Chrome, but neither entry has
an explicit `world` field. Opera also omits `icons/file.svg` from
`web_accessible_resources` and adds developer metadata with
`https://filtertube.in`.

## Build Manifest Handling

`build.js` currently:

- copies whole `js`, `css`, `html`, `icons`, `data`, and `assets` directories
  before writing the target manifest,
- reads `manifest.${browser}.json` for `chrome`, `firefox`, or `opera`,
- calls `ensureCollabDialogScriptOrder(manifestJSON)`,
- writes `dist/${browser}/manifest.json`,
- creates `filtertube-${browser}-v${version}.zip`.

`ensureCollabDialogScriptOrder()` only ensures
`js/content/collab_dialog.js` appears before `js/content_bridge.js` in manifest
entries that include `content_bridge.js`. It does not validate permissions,
host scope, content-script worlds, run order, web-accessible resources, icon
parity, package-copy quarantine, or browser parity.

## Reliability, Leak, Performance, And Code-Burden Findings

1. Default/Chrome MAIN-world seed startup is source-local proof, not all-browser
   parity. Firefox and Opera use different page-runtime paths today.
2. Firefox fallback injection can fail differently from manifest MAIN-world
   loading, and no manifest readiness report records `seed` injection success.
3. Opera omits explicit `world` declarations, so a Chrome-style JSON-first
   startup claim is not proven for Opera.
4. `youtube-nocookie.com` has host permission but no active content-script or
   web-resource match. Permission breadth and active runtime scope are distinct.
5. `icons/file.svg` web-accessible parity differs by browser.
6. Build packaging can silently preserve permission, host, world, resource, or
   icon drift because it only repairs collaborator-before-bridge order.
7. Whole-directory package copying means manifest-inactive JS/CSS/assets can
   still ship even when they are not loaded by browser manifests.

## Missing Authority Symbols

No product source currently implements:

- `browserManifestRuntimeLoadOrderAuthority`
- `browserManifestPackageParityReport`
- `browserManifestContentScriptWorldReport`
- `browserManifestSeedReadyReport`
- `browserManifestHostScopeClassification`
- `browserManifestWebAccessibleResourceDecision`
- `browserManifestPermissionFeatureMap`
- `browserManifestBuildValidationReport`
- `browserManifestPackageQuarantineReport`
- `browserManifestJsonFirstStartupGate`

## Completion Boundary

This register does not close browser-manifest tracked-file obligations. It pins
current content-script order, world declarations, fallback injection boundaries,
web-accessible-resource parity, host-scope mismatch, and build-time manifest
handling. Before changing manifests, claiming browser parity, optimizing package
contents, changing JSON-first startup behavior, adding/removing permissions, or
shipping browser ZIPs, future work still needs browser package artifacts,
startup readiness reports, host classification, resource reasons, permission to
feature mapping, package quarantine proof, and browser-specific smoke fixtures.
