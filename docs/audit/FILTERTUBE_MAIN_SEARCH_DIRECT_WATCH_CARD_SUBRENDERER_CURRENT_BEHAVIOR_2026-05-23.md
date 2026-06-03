# FilterTube Main Search Direct Watch-Card Subrenderer Current Behavior - 2026-05-23

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch.

This slice turns the existing Main mobile search watch-card evidence into a
direct-renderer gap proof. It uses real nested watch-card child renderer objects
as direct top-level renderer keys in the reduced fixture, while explicitly
recording that this is not a raw-direct renderer observation.
In short: real nested watch-card child renderer objects as direct top-level renderer keys, not a raw-direct renderer observation.

## Source Boundary

| Source | Current shape | Count / fingerprint |
| --- | --- | --- |
| `strange_ytInitialData.json` | `var ytInitialData = '...'` string literal with escaped JSON; whole file is not direct JSON. | 141 lines; 244,201 bytes; sha256 `01e6010a3f46041c3bcb3b6b399e871b5aa2fc28a0f234eca237226162b476b7`. |
| `tests/runtime/fixtures/captures/main-search-direct-watch-card-rich-hero-subrenderers.json` | Reduced direct-gap fixture built from real nested child renderer objects. | 228 lines; 6,715 bytes; sha256 `3c3bfbf1ec8d077ab69a5346e863960918859c4df9c62450a4bf25282e1f0dcd`. |

Raw token counts in `strange_ytInitialData.json`:

```text
universalWatchCardRenderer: 2
watchCardRichHeaderRenderer: 2
watchCardHeroVideoRenderer: 2
watchCardRHPanelVideoRenderer: 0
```

The fixture provenance pins `directRootObservedInSource: false`. The source
proves real rich-header and hero child object shapes; it does not prove that the
raw capture sent those child renderers as top-level direct entries.

## Current Runtime Result

The direct fixture uses two top-level items:

| Direct renderer key | Captured value | Current result |
| --- | --- | --- |
| `watchCardRichHeaderRenderer` | Title `Nyusha`, channel `UCm9VWKAFz0aXpuEHPHMae7w`, handle `@NYUSHAmusic`. | Passes through no-rule, matching keyword, matching channel, and whitelist-nonmatch modes. |
| `watchCardHeroVideoRenderer` | Label `YouTube Mix`, hero video `XuHro6TjXww`, playlist `RDEMgF031uDlRkNZ1d0qT2a8QA`. | Passes through no-rule, matching keyword, and whitelist-nonmatch modes. |

Direct rich-header and hero subrenderers pass through matching blocklist rules today.
Wrapper filtering works for the same child values. The same child values are removable when they stay under the supported
`universalWatchCardRenderer` wrapper. That makes this a wrapper-versus-direct
parity gap, not a keyword/channel matching gap.

## JSON-First Optimization Boundary

This matters for the JSON-first work because a future optimization that skips
DOM fallback after seeing a watch-card family could leak direct child renderers
that the current JSON engine does not own. Conversely, broadening DOM selectors
without this renderer distinction can raise false-hide and scan-cost risk.

Direct `watchCardRHPanelVideoRenderer` remains unextracted. The raw search
capture has no RHS panel token, so RHS behavior is still covered only by the
older synthetic direct-watch-card authority proof and inventory gap docs.

The hero video ID path boundary is also still open: the real child object stores
the video ID at
`navigationEndpoint.watchEndpoint.videoId`, while the current wrapper rule names
`callToAction.watchCardHeroVideoRenderer.watchEndpoint.videoId`. That path
should not become video-map or endpoint authority without a future path-policy
fixture.

## Future Authority Tokens

No product runtime symbol exists yet for:

- `mainSearchDirectWatchCardSubrendererContract`
- `directWatchCardSubrendererDecisionReport`
- `directWatchCardSubrendererWhitelistPolicy`
- `watchCardHeroNavigationEndpointPolicy`
- `watchCardRhsPanelCaptureAuthority`
- `watchCardJsonFirstOptimizationBudget`

This document and test are audit evidence only. They do not permit adding direct
watch-card support, changing whitelist behavior, adding endpoint/video-map side
effects, treating the source as raw-direct evidence, or optimizing away DOM
fallback on watch-card surfaces.

## Executable Proof

```bash
node --test tests/runtime/main-search-direct-watch-card-subrenderer-current-behavior.test.mjs
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this watch/player/end-screen surface can
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
optimization, JSON-first behavior, watch-card behavior, player behavior,
end-screen behavior, whitelist behavior, metric collectors, artifact creation,
native sync, release package changes, or public claims.
