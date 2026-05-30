# FilterTube Native Overlay / Fullscreen Quiet Mode Boundary - Current Behavior

Date: 2026-05-23

Status: current-behavior proof only. This is not an implementation patch, not
completion proof for native-overlay/fullscreen pause authority, and not approval
to change runtime filtering, JSON mutation, DOM mutation, storage, message,
lifecycle, network, prompt, or settings semantics.

## Scope

This slice pins the current fullscreen/native-overlay quiet behavior that can
affect whitelist optimization and first-class JSON filtering work. The current
runtime has a local quiet predicate in `js/content_bridge.js`, but the predicate
is not shared across all non-player owners.

native overlay/fullscreen quiet mode boundary source files: 7
native overlay/fullscreen quiet mode source/effect blocks: 5

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13535 | 600459 | `31e7234c6a4055bffb0b800bac43cf3dd1c496cb08d1d57d391ea027941277e9` |
| `js/content/block_channel.js` | 3175 | 127396 | `1b6fffa249a746c01686df0d6a05dc4b770a6f0c5ded08b78a7043c11e9cdd83` |
| `js/content/dom_fallback.js` | 4838 | 228332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/bridge_settings.js` | 651 | 26462 | `c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b` |
| `js/content/first_run_prompt.js` | 190 | 7453 | `5672d9060d29b08550ecfc3add54245212a5094ee5137f025b6f788f12e50409` |
| `js/content/release_notes_prompt.js` | 250 | 9866 | `30b624cbbda1004f354f98dbf3b4513f8ebc298adecbceb4358782f248f80474` |

## Source / Effect Blocks

- content_bridge native quiet predicate block: line 16, 11 lines, 468 bytes
- content_bridge initializeDOMFallback quiet cluster block: line 6088, 382 lines, 17601 bytes
- content_bridge fallback menu quiet cluster block: line 6489, 721 lines, 29321 bytes
- block_channel quick-block enabled predicate block: line 1205, 90 lines, 2943 bytes
- block_channel quick-block lifecycle setup block: line 1979, 322 lines, 13896 bytes

## Selected Token Counts

content_bridge full-file selected quiet/lifecycle counts:

- `isFilterTubeNativeOverlayQuietMode`: 22
- `data-filtertube-native-overlay-covered`: 1
- `data-filtertube-native-fullscreen`: 1
- `__filterTubeNativeOverlayCovered`: 1
- `__filterTubeNativeFullscreenActive`: 1
- `MutationObserver`: 17
- `IntersectionObserver`: 2
- `addEventListener`: 25
- `setTimeout`: 36
- `setInterval`: 1
- `requestAnimationFrame`: 10
- `applyDOMFallback`: 31
- `schedulePrefetchScan`: 5

block_channel full-file selected quiet/lifecycle counts:

- `isFilterTubeNativeOverlayQuietMode`: 0
- `data-filtertube-native-overlay-covered`: 0
- `data-filtertube-native-fullscreen`: 0
- `__filterTubeNativeOverlayCovered`: 0
- `__filterTubeNativeFullscreenActive`: 0
- `showQuickBlockButton`: 1
- `listMode === 'whitelist'`: 3
- `MutationObserver`: 6
- `addEventListener`: 37
- `setTimeout`: 17
- `setInterval`: 0
- `requestAnimationFrame`: 5

selected non-content-bridge owner quiet-token counts:

- `js/content/dom_fallback.js`: 0 native quiet predicate/attribute tokens, 1 player `ytp-fullscreen` selector token
- `js/seed.js`: 0 native quiet predicate/attribute tokens
- `js/content/bridge_settings.js`: 0 native quiet predicate/attribute tokens
- `js/content/first_run_prompt.js`: 0 native quiet predicate/attribute tokens
- `js/content/release_notes_prompt.js`: 0 native quiet predicate/attribute tokens

selected source/effect block token counts:

- native predicate block `isFilterTubeNativeOverlayQuietMode`: 1
- native predicate block `data-filtertube-native-overlay-covered`: 1
- native predicate block `data-filtertube-native-fullscreen`: 1
- native predicate block `__filterTubeNativeOverlayCovered`: 1
- native predicate block `__filterTubeNativeFullscreenActive`: 1
- initializeDOMFallback quiet cluster `isFilterTubeNativeOverlayQuietMode`: 8
- initializeDOMFallback quiet cluster `MutationObserver`: 11
- initializeDOMFallback quiet cluster `setTimeout`: 4
- initializeDOMFallback quiet cluster `requestAnimationFrame`: 1
- initializeDOMFallback quiet cluster `applyDOMFallback`: 6
- initializeDOMFallback quiet cluster `schedulePrefetchScan`: 2
- fallback menu quiet cluster `isFilterTubeNativeOverlayQuietMode`: 13
- fallback menu quiet cluster `MutationObserver`: 1
- fallback menu quiet cluster `addEventListener`: 7
- fallback menu quiet cluster `setTimeout`: 4
- fallback menu quiet cluster `setInterval`: 1
- quick-block enabled predicate `showQuickBlockButton`: 1
- quick-block enabled predicate `listMode === 'whitelist'`: 2
- quick-block lifecycle setup `MutationObserver`: 1
- quick-block lifecycle setup `addEventListener`: 12
- quick-block lifecycle setup `setTimeout`: 3
- quick-block lifecycle setup `setInterval`: 0
- quick-block lifecycle setup `requestAnimationFrame`: 1
- quick-block lifecycle setup `isYouTubeOverlaySurfaceOpen`: 0
- quick-block lifecycle setup `isMobileSearchSurfaceOpen`: 0

## Current Behavior Pinned

1. `isFilterTubeNativeOverlayQuietMode()` returns true when either
   `window.__filterTubeNativeOverlayCovered`,
   `data-filtertube-native-overlay-covered`,
   `window.__filterTubeNativeFullscreenActive`, or
   `data-filtertube-native-fullscreen` is present.
2. `initializeDOMFallback()` applies DOM fallback once before installing the
   local quiet-checked observer and scheduler cluster.
3. The content-bridge DOM fallback observer, immediate fallback scheduler,
   whitelist pending refresh path, and prefetch scan calls use local quiet
   checks after initialization.
4. `ensureFallbackMenuButtons()` installs the fallback menu owner once, then
   local quiet checks gate rescans, mutation callbacks, navigation/click/scroll
   callbacks, scheduled scans, and warmup scans.
5. `setupQuickBlockObserver()` installs quick-block styles and page-level
   lifecycle listeners before action-level `isQuickBlockEnabled()` checks.
6. Quick-block action state uses `showQuickBlockButton === true` and rejects
   `listMode === 'whitelist'`, while the selected quick-block lifecycle setup
   block does not consume the native overlay/fullscreen quiet predicate or the
   older direct search/overlay predicate calls.
7. `js/content/dom_fallback.js`, `js/seed.js`,
   `js/content/bridge_settings.js`, `js/content/first_run_prompt.js`, and
   `js/content/release_notes_prompt.js` do not consume the native quiet
   predicate or native quiet attributes in the current selected scan.
8. The prompt scripts can render fixed overlays after runtime/background checks
   without a local fullscreen/native-overlay suppression predicate.

## Risk Boundary

| Surface | Current behavior | Risk before optimization or JSON-first promotion |
| --- | --- | --- |
| Content bridge fallback | Local quiet checks exist after initial DOM fallback setup. | A future optimization can incorrectly claim page-wide quietness if it treats this local guard as a shared lifecycle authority. |
| Whitelist pending hides | Pending refresh and hide queues consult local quiet checks. | Empty-whitelist and unresolved-identity work still needs a route/list-mode/fullscreen decision report before behavior changes. |
| Fallback menu | Local quiet checks pause scans after installation. | Installed observers/listeners/timers remain page-owned; no no-affordance or teardown report exists. |
| Quick block | Action checks know `showQuickBlockButton` and whitelist rejection; active-rule context now lives in the same selected gate block. | Lifecycle work can still be installed before action checks and lacks native-overlay/fullscreen quiet checks in the selected setup block. |
| DOM fallback/seed/settings replay | Selected files lack native quiet predicate consumption. | JSON-first no-work claims cannot use the content-bridge predicate as proof that seed, DOM fallback, or settings replay work pauses during fullscreen/native overlays. |
| Prompt overlays | First-run and release-note scripts lack native quiet predicate consumption. | Fixed prompt UI can still need route/fullscreen/native overlay display policy before release or UX claims. |

## Non-Completion Boundary

This current-behavior slice does not close native-overlay/fullscreen quiet mode
or first-class JSON optimization readiness. Product runtime source still lacks:

- `nativeOverlayQuietModeContract`
- `nativeOverlayQuietModeConsumerReport`
- `fullscreenNonPlayerPauseContract`
- `fullscreenNativeOverlayPauseAuthority`
- `nonPlayerRuntimePauseReport`
- `quickBlockNativeOverlayPauseReport`
- `domFallbackFullscreenPauseReport`
- `seedFullscreenNoWorkBudget`
- `promptOverlayFullscreenPolicy`
- `nativeOverlayMetricArtifact`

Required proof before implementation work:

- a shared decision contract for native overlay and fullscreen quiet state,
- per-owner consumer reports for seed, DOM fallback, content bridge, quick block,
  fallback menu, bridge settings, and prompts,
- disabled/no-rule/list-mode/fullscreen/native-overlay lifecycle fixture
  provenance,
- timer/listener/observer teardown or pause budgets,
- prompt display policies for playback and native app shells,
- metrics proving no false-hide/leak and no avoidable runtime work during
  fullscreen/native overlays.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this native/runtime sync and overlay surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, native runtime sync behavior, native overlay
quiet-mode behavior, whitelist behavior, metric collectors, artifact creation,
release package changes, or public claims.
