# FilterTube JSON-First Hide Endscreen Videowall Boundary Current Behavior - 2026-05-22

Status: release-fix proof slice. Runtime behavior changed on 2026-05-31 for
watch autoplay endpoint sets during active JSON filtering. This is not an
unrelated optimization patch, DOM fallback patch, settings schema patch, or
selector cleanup patch.

This slice promotes the JSON-first feature audit into
`hideEndscreenVideowall` proof. It isolates how the player end-screen videowall
toggle currently crosses shared settings, background compile, background cache
invalidation, content storage refresh, seed active-work predicates, JSON
`endScreenVideoRenderer` traversal, unsupported `compactAutoplayRenderer`
traversal, DOM fallback CSS, whitelist mode, and ordinary `/youtubei/v1/next`
endpoint behavior.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/background.js` | 6343 | 286370 | `ce17fee7a80398be91f89e286ef0dea8c85deff0b4363729d79a957c9989cd36` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/content/bridge_settings.js` | 845 | 34241 | `aea46dd241248db1d1d9bcbdfdf65320d1399ecd84cc7792678f29b1b26ee092` |

## Evidence Counts

hideEndscreenVideowall boundary source files: 6

hideEndscreenVideowall source/effect blocks: 13

filter_logic shared video renderer rules block lines: 8

filter_logic shared video renderer rules block bytes: 415

filter_logic category renderer allowlist block lines: 8

filter_logic category renderer allowlist block bytes: 618

filter_logic nested known keys block lines: 10

filter_logic nested known keys block bytes: 427

filter_logic content renderer allowlist block lines: 8

filter_logic content renderer allowlist block bytes: 618

seed active JSON rules block lines: 13

seed active JSON rules block bytes: 463

DOM fallback endscreen-videowall CSS rules block lines: 8

DOM fallback endscreen-videowall CSS rules block bytes: 253

DOM fallback active boolean keys block lines: 28

DOM fallback active boolean keys block bytes: 905

background storage read keys block lines: 44

background storage read keys block bytes: 1408

background boolean pass-through block lines: 35

background boolean pass-through block bytes: 3596

background storage refresh keys block lines: 16

background storage refresh keys block bytes: 461

settings_shared settings keys block lines: 38

settings_shared settings keys block bytes: 1031

settings_shared build compiled settings block lines: 64

settings_shared build compiled settings block bytes: 2438

content bridge storage refresh keys block lines: 44

content bridge storage refresh keys block bytes: 1263

filter_logic total hideEndscreenVideowall tokens: 1

seed total hideEndscreenVideowall tokens: 0

DOM fallback total hideEndscreenVideowall tokens: 2

background total hideEndscreenVideowall tokens: 12

settings_shared total hideEndscreenVideowall tokens: 23

bridge_settings total hideEndscreenVideowall token: 1

filter_logic total endScreenVideoRenderer tokens: 4

filter_logic total compactAutoplayRenderer tokens: 0

DOM fallback endscreen-videowall CSS block #movie_player .ytp-endscreen-content tokens: 1

DOM fallback endscreen-videowall CSS block #movie_player .ytp-fullscreen-grid-stills-container tokens: 1

runtime hideEndscreenVideowall fixtures: 8

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation changes |
| --- | --- | --- |
| JSON end-screen renderer decision | `js/filter_logic.js` now has direct `hideEndscreenVideowall` authority for watch autoplay endpoint sets. Direct and nested `endScreenVideoRenderer` rows are still covered by ordinary shared video rules, category allowlists, content allowlists, and nested unwrap keys; `compactAutoplayRenderer` is not covered by those direct allowlists today. | A follow-up renderer inventory proving whether `compactAutoplayRenderer` should share the same endpoint-set authority. |
| Feature toggle interaction | `hideEndscreenVideowall` can remove watch autoplay endpoint sets during an already-running JSON pass. Ordinary keyword/channel/list-mode rules can still remove supported `endScreenVideoRenderer` rows independently of the feature toggle. | A player-overlay interaction report proving visible videowall, end-screen cards, compact autoplay, and JSON end-screen renderers across real watch captures. |
| Whitelist mode | Empty whitelist mode can remove direct supported `endScreenVideoRenderer` rows, while unsupported `compactAutoplayRenderer` rows can pass through. The DOM videowall CSS block is not gated by `listMode !== 'whitelist'`. | A whitelist-mode report proving supported and unsupported end-screen renderer behavior, player overlay visibility, and allow-mode false-hide/leak boundaries. |
| Seed active JSON work | Seed JSON active-work detection still does not include `hideEndscreenVideowall`. `/youtubei/v1/next` still bypasses `processData` with only `hideEndscreenVideowall` enabled because the no-active-JSON-work gate passes through before JSON parse. When whitelist/blocklist work already activates JSON filtering, endpoint-set removal runs inside `filter_logic.js`. | A watch-route no-work budget that proves when `/next` may parse/stringify, harvest only, mutate, or pass through. |
| DOM fallback | DOM fallback owns the visible player videowall hide with `#movie_player .ytp-endscreen-content` and `#movie_player .ytp-fullscreen-grid-stills-container`. | A JSON/DOM parity report for player end-screen videowall DOM, direct JSON end-screen rows, compact autoplay, and end-screen cards. |
| Background compile and invalidation | Background storage reads and compiles `hideEndscreenVideowall`. Background storage-change invalidation does not include `hideEndscreenVideowall` today. | A cache invalidation report that either adds the dependency or explicitly classifies it as DOM-only with a bounded refresh path. |
| Content bridge refresh | `js/content/bridge_settings.js` includes `hideEndscreenVideowall` in its storage refresh key list. This can refresh active content scripts but does not make the background compiler invalidation list complete. | A settings parity report across background, content bridge, shared settings, StateManager, and UI save paths. |
| Shared settings | `js/settings_shared.js` lists and compiles `hideEndscreenVideowall`. | A schema-level owner for this flag, including profile/list-mode behavior and persistence revision evidence. |

## Runtime Fixtures

Watch end-screen renderer rows still pass through unchanged when only
`hideEndscreenVideowall` is enabled.

Watch autoplay endpoint sets are removed during active JSON processing when
`hideEndscreenVideowall` is enabled.

`/youtubei/v1/next` now bypasses `processData` with only
`hideEndscreenVideowall` enabled.

1. JSON `endScreenVideoRenderer` and `compactAutoplayRenderer` rows pass
   through unchanged when only `hideEndscreenVideowall` is enabled.
2. Watch autoplay endpoint sets are removed during an active JSON pass when
   `hideEndscreenVideowall` is enabled.
3. Ordinary keyword rules can remove a matching `endScreenVideoRenderer` row
   while a matching `compactAutoplayRenderer` row remains because that renderer
   has no direct JSON rule today.
4. Empty whitelist mode can remove supported `endScreenVideoRenderer` rows
   while `compactAutoplayRenderer` remains even when `hideEndscreenVideowall`
   is enabled.
5. `/youtubei/v1/next` now bypasses `processData` with only
   `hideEndscreenVideowall` enabled.
6. That same watch-next fixture performs no harvest-only skip for
   `hideEndscreenVideowall`.
7. The DOM selector block proves the visible videowall hide is owned by broad
   `#movie_player` CSS selectors, not per-card JSON or ordinary card DOM
   selector authority.
8. Product runtime source still lacks the first-class endscreen videowall
   authority symbols listed below.

## Risk Notes

- Reliability risk: supported JSON `endScreenVideoRenderer` rows, unsupported
  `compactAutoplayRenderer` rows, and visible player videowall DOM are separate
  boundaries, so one layer can leak while another appears covered.
- False-hide risk: whitelist mode can fail closed for supported end-screen JSON
  rows while unsupported compact autoplay rows pass through, and the visible
  player-overlay CSS block is independent of that JSON decision.
- Performance risk: the no-active-JSON gate still avoids parse/traverse work
  when only `hideEndscreenVideowall` is enabled. When another rule already
  activates JSON filtering, endpoint-set removal adds bounded object-key checks
  rather than an additional network pass.
- Code-burden risk: background compile, background invalidation, content bridge
  refresh, shared settings, seed active-work, JSON renderer rules, category and
  content allowlists, nested unwrap, and DOM player-overlay selectors all
  express part of the end-screen boundary independently.

## Missing Runtime Authority

No `jsonFirstHideEndscreenVideowallContract`,
`jsonFirstHideEndscreenVideowallDecisionReport`,
`jsonFirstEndscreenVideowallRendererInventoryPolicy`,
`jsonFirstEndscreenVideowallJsonDomParityReport`,
`jsonFirstEndscreenVideowallDomOnlyPolicy`,
`jsonFirstEndscreenVideowallWhitelistModeReport`,
`jsonFirstEndscreenVideowallPlayerOverlayPolicy`,
`jsonFirstEndscreenVideowallNoWorkBudget`,
`jsonFirstEndscreenVideowallCacheInvalidationReport`,
`jsonFirstEndscreenVideowallRoutePolicy`,
`jsonFirstEndscreenVideowallSettingsParityReport`,
`jsonFirstEndscreenVideowallFixtureProvenance`, or
`jsonFirstEndscreenVideowallMetricArtifact` exists in product runtime source
yet.

## Implementation Boundary

This file and
`tests/runtime/json-first-hide-endscreen-videowall-boundary-current-behavior.test.mjs`
pin the #57 endpoint-set release fix. They do not authorize deleting DOM
selectors, adding `compactAutoplayRenderer` rules, changing background cache
invalidation, or merging player controls into a broader shared authority
without follow-up implementation proof.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this watch/player/end-screen surface can
support runtime optimization. Current proof has been consumed for this #57
endpoint-set fix slice and now pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: yes, 2026-05-31
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, watch-card behavior, player behavior,
end-screen behavior, whitelist behavior, metric collectors, artifact creation,
native sync, release package changes, or public claims.
