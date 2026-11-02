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
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Manifest File Fingerprints

The tracked manifest surface has 4 files, 360 newline counts, and 10,117 bytes:

| Path | Lines | Bytes | SHA-256 | Current package role |
| --- | ---: | ---: | --- | --- |
| `manifest.json` | 93 | 2,654 | `95496eac74d72fd90491302211b7dc07f492ed405d4eb1a001b8b600a02bc16b` | Default/unpacked Chromium-style manifest |
| `manifest.chrome.json` | 93 | 2,654 | `95496eac74d72fd90491302211b7dc07f492ed405d4eb1a001b8b600a02bc16b` | Build input for Chrome/Edge/Brave ZIP |
| `manifest.firefox.json` | 80 | 2,150 | `8368c4b520a07d1e5d9647f6c141f06f8fbd24a92c8b053d722488859f201c32` | Build input for Firefox ZIP |
| `manifest.opera.json` | 94 | 2,659 | `f9a3b4182521d8b1594d7975c327daf772e418e4869e8e3d33d286bfb25b486e` | Build input for Opera ZIP |

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
- optional host permissions: `http://*/*`, `https://*/*` for parent-configured
  Internet Pickup/Home Pickup endpoints only; these are not install-time host
  grants and are requested for the exact pickup origin during setup
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
| `manifest.json` | MV3 `service_worker: js/background.js` | 2 | first entry: `js/seed.js`, `world: MAIN`, `document_start` | second entry: 14 scripts, `world: ISOLATED`, `document_start` | `js/injector.js`, `js/filter_logic.js`, `js/seed.js`, `js/shared/identity.js`, `assets/images/homepage_hero_day.mp4`, `icons/file.svg` |
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


## October 18, 2026 source review

The May inventory above is historical. Current manifests use localized names, version3.4.1, view-count/admission dependencies, a dedicated embed path and Google Search preview guards. These source checks do not prove installed browser execution or native parity. CSS remains absent from all content-script entries. Firefox has5 entries, Chrome6, Opera7; their world declarations are tested separately. The existing missing-authority and release gates remain open.

| File | Newlines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| manifest.json | 154 | 5204 | d8dea8d10e715d01bab25ea12ff6fc3055d403f2486654fcb6907f94bd4f4627 |
| manifest.chrome.json | 154 | 5204 | d8dea8d10e715d01bab25ea12ff6fc3055d403f2486654fcb6907f94bd4f4627 |
| manifest.firefox.json | 128 | 4138 | 2c0fe680fe1d204250ce687ef29c00767d3ff6269024a410da5c9fccff4ebf79 |
| manifest.opera.json | 162 | 5393 | a7c541876ed54303d3a21613f5eaacbef536d694bf6061da207456eca476fce1 |


## Opt-In Content Player Load Order - 2026-10-22

Current normal isolated stacks add source planning, admission leases, the owned-player controller, caption preparation, and the coordinator in that order before content_bridge. Embed and Google preview stacks retain their previous exact dependencies; the experimental controller is not loaded there. The MAIN response bridge is a web-accessible resource injected before injector (and after Firefox seed), never an isolated content script. This data-only bridge supplies no admission authority. Existing permissions, hosts, worlds and browser-specific entry counts are unchanged. Source load-order checks do not establish installed playback, media availability, caption/audio success, native parity or release readiness. The historical tables above are preserved.

| File | Newlines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| manifest.json | 160 | 5545 | b5229834ae6c291dbc4ad69b212c5ef086d8214b199678a0c09a46ae0eaa80c9 |
| manifest.chrome.json | 160 | 5545 | b5229834ae6c291dbc4ad69b212c5ef086d8214b199678a0c09a46ae0eaa80c9 |
| manifest.firefox.json | 134 | 4431 | f5ae06e03e855cd3c8c4a88e4fcc832c70341d56eb2edab33211d380a6b5c2fb |
| manifest.opera.json | 168 | 5734 | 5f5809782261a21e8d8a6231178011c25a9de47fd8dfc8f4af834009a9084a07 |


## Owned Resolver And Transport Load Order - 2026-10-22

The normal isolated stack now loads source planner, replaceable resolver, admission, indexed transport, player, captions and coordinator before content_bridge. The two new modules do not enter MAIN, embed or Google-preview stacks. Permissions, host scope, world assignments, web-accessible resources and CSS quarantine retain their asserted boundaries. Earlier rows describe dated source states, not current playback acceptance.

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `manifest.json` | 162 | 5663 | `f60a40c4344a7dd0390cb8dd88971b148b0600358c1d7b9bed609954f7ad633e` |
| `manifest.chrome.json` | 162 | 5663 | `f60a40c4344a7dd0390cb8dd88971b148b0600358c1d7b9bed609954f7ad633e` |
| `manifest.firefox.json` | 136 | 4533 | `f65bb52374d869f2b78f6a9b6b63679b68ef4fc0fb20e4725a536584c61d20ea` |
| `manifest.opera.json` | 170 | 5852 | `940b18bd821f9463260b6fb20f19bc32321132663a72f3de0d9cfee7b4eba30e` |


## Native Source Handoff Load Order - 2026-10-22

Normal isolated pages load source planner, resolver, admission, native source transaction and coordinator before content_bridge. Legacy transport, separate player and captions are absent from all active content script entries. MAIN response remains a web-accessible injected bridge; permissions, host scope, worlds, embed and Google-preview boundaries are unchanged. Earlier source snapshots describe the superseded overlay pilot.

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `manifest.json` | 160 | 5544 | `78e3025b7b5bc01db2d88ab79edcb6294c815bf721060d384b2905d4adb21337` |
| `manifest.chrome.json` | 160 | 5544 | `78e3025b7b5bc01db2d88ab79edcb6294c815bf721060d384b2905d4adb21337` |
| `manifest.firefox.json` | 134 | 4430 | `8f177b22836825420d6967945b83eaa7cba8c48cd615bed2b05cdd1f54de430c` |
| `manifest.opera.json` | 168 | 5733 | `9070a9af9b7bf4b218c6a618b0ddf8c42f20c4e0f60661db41308e21da901a4e` |

## Watch Notes source inventory update - 2026-10-23

| `manifest.json` | 162 | 5630 | `ba155d12e591c0306620bc57c59ad7378c5313084314a748414b5b1d39879d9d` |
| `manifest.chrome.json` | 162 | 5630 | `ba155d12e591c0306620bc57c59ad7378c5313084314a748414b5b1d39879d9d` |
| `manifest.firefox.json` | 136 | 4593 | `454805c26c62add8c1467d95ef41f1c4b6529b55ebcfbfbd81bfdcd93a0fb242` |
| `manifest.opera.json` | 170 | 5819 | `c516d8c0439a79016b0ed04ffb3658bbd40f8e0868fc146d8707a9da076636a4` |

Notes is an ISOLATED normal-watch helper before content_bridge. The extension-origin editor HTML alone is web-accessible; note text, store, writer and background are not. Firefox loads contract/store/adapter before background. Existing permissions, embeds, previews and MAIN playback stacks are unchanged.

## Auto-sync source inventory - 2026-10-24

| `manifest.json` | 162 | 5630 | `ba155d12e591c0306620bc57c59ad7378c5313084314a748414b5b1d39879d9d` |
| `manifest.chrome.json` | 162 | 5630 | `ba155d12e591c0306620bc57c59ad7378c5313084314a748414b5b1d39879d9d` |
| `manifest.firefox.json` | 136 | 4668 | `30b981228a8214e0721d8c29ca3a74cac369508b0aca702e6b55286bc87ee7b8` |
| `manifest.opera.json` | 170 | 5819 | `c516d8c0439a79016b0ed04ffb3658bbd40f8e0868fc146d8707a9da076636a4` |

Firefox background order now explicitly loads the private personal-sync validator, Auto-sync security helper, and wakeup scheduler before background.js. Existing YouTube content-script order/world/permissions remain independently asserted. This is source-load evidence only.


## Version 3.4.2 preview metadata inventory — 2026-10-27

This refresh records version, changelog and release-note changes only. Existing
audit boundaries and open installed/security/native gates remain unchanged.

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `manifest.json` | 162 | 5630 | `e3fb4474be24b84b4b742597f895c63324ba3dbf4de34e23815ff211e0cf7a04` |
| `manifest.chrome.json` | 162 | 5630 | `e3fb4474be24b84b4b742597f895c63324ba3dbf4de34e23815ff211e0cf7a04` |
| `manifest.firefox.json` | 136 | 4811 | `e9c73602d52997c19ac7ee24581f596ea4a764423ce5e61fae89d50969e1d68e` |
| `manifest.opera.json` | 170 | 5819 | `d5c29a055e6454aba5aed3f65da4de8bba9d98e2bfbec76071fa9887b206d037` |
