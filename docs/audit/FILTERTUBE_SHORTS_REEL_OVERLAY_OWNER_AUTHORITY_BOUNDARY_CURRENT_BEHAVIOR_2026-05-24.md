# FilterTube Shorts Reel Overlay Owner Authority Boundary Current Behavior - 2026-05-24

Status: audit-only current-behavior fixture slice. Runtime behavior is
unchanged. This is not an implementation patch, Shorts patch, JSON-first patch,
whitelist patch, or owner-identity authority patch.

## Scope

This slice follows the active Shorts/reel overlay owner identity captured from
`reel_item_watch?prettyPrint=False.JSON`. The reduced fixture proves the
captured `reelPlayerOverlayRenderer` carries canonical-looking owner evidence:
UC id `UC-6YsZ1GcOMIehkb8eHioUQ`, handle `@ElectricRevolution`, channel-name
command runs, subscribe-button channel id, canonical channel URL, and avatar
image evidence.

The current filter boundary is narrower:

```text
raw active overlay reelPlayerOverlayRenderer tokens: 2
fixture reelPlayerOverlayRenderer tokens: 2
fixture reelWatchEndpoint tokens: 0
fixture channelTitleText tokens: 0
fixture owner UC id tokens: 4
fixture owner handle tokens: 7
blocklist overlay channel-map side effects: 1
direct FILTER_RULES reelPlayerOverlayRenderer entries: 0
```

That means documented/captured owner fields are not first-class JSON filter
authority today. Direct active-overlay processing can harvest the owner into a
`FilterTube_UpdateChannelMap` side effect, but it still preserves the payload
under matching blocklist and whitelist channel rules. Wrapping the captured
overlay under a `reelItemRenderer` still cannot use the captured metapanel owner
fields for channel decisions. Title keyword filtering on the wrapper still works
through the existing `reelItemRenderer.headline.simpleText` rule.

## Source Facts

| Artifact | Lines | Bytes | SHA-256 | Role |
| --- | ---: | ---: | --- | --- |
| `reel_item_watch?prettyPrint=False.JSON` | 1971 | 149486 | `cc8befaef3cf44c893f3809af34cdc1c798a3b855e0aacfd9b2034381f0b1026` | Ignored raw active Shorts/reel overlay evidence. |
| `tests/runtime/fixtures/captures/main-reel-player-overlay-renderer.json` | 108 | 3706 | `99452336bec6d1be5a2242b9c3cefe06061fe980c256ac675fc721cb6a2a648e` | Reduced active overlay owner fixture. |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` | JSON filtering and direct renderer rule owner. |

## Current Field Matrix

| Field family | Captured fixture evidence | Current runtime effect |
| --- | --- | --- |
| Decorated avatar command | `metapanel.reelMetapanelViewModel.metadataItems[0].reelChannelBarViewModel.decoratedAvatarViewModel...browseEndpoint.browseId` resolves to `UC-6YsZ1GcOMIehkb8eHioUQ`. | No direct `reelPlayerOverlayRenderer` rule consumes it for hide/allow. |
| Channel-name command run | `channelName.content` is `@ElectricRevolution`, and its command run has the same browse id and canonical URL. | The current `reelItemRenderer` channel-name path does not read this metapanel path. |
| Subscribe button | `subscribeButtonViewModel.subscribeButtonViewModel.channelId` and nested endpoint channel ids match `UC-6YsZ1GcOMIehkb8eHioUQ`. | The current JSON rules do not promote subscribe-button identity into channel filtering authority. |
| Active overlay wrapper | The captured object is an active `overlay.reelPlayerOverlayRenderer`, not a full `reelItemRenderer` with `reelWatchEndpoint.videoId`. | Direct overlay processing preserves the payload even when the owner is blocked or whitelisted, while still queuing one channel-map side effect. |
| Existing Shorts rule | `reelItemRenderer` can still filter by `headline.simpleText`. | Keyword matching works for the wrapper, but owner identity remains weaker than the captured JSON fields. |

## Current Fixture Result

The paired verifier is
`tests/runtime/shorts-reel-overlay-owner-authority-boundary-current-behavior.test.mjs`.

It pins:

- Raw and fixture provenance for `reel_item_watch?prettyPrint=False.JSON` and
  `main-reel-player-overlay-renderer.json`.
- The captured owner fields: UC id `UC-6YsZ1GcOMIehkb8eHioUQ`, handle
  `@ElectricRevolution`, canonical `/@ElectricRevolution/shorts`, and avatar
  URL evidence.
- Direct overlay pass-through in blocklist and whitelist channel modes.
- Direct overlay channel-map side effect payload
  `[{ id: "UC-6YsZ1GcOMIehkb8eHioUQ", handle: "@ElectricRevolution" }]`.
- Wrapped `reelItemRenderer` pass-through for matching owner rules, contrasted
  with keyword removal through `headline.simpleText`.
- The absence of direct `reelPlayerOverlayRenderer` rule authority and the
  absence of named future authority symbols in product runtime source.

## Why This Matters

This is a JSON-first optimization trap. The raw YouTube JSON contains strong
owner evidence, and the current runtime can harvest that evidence into a map
side effect, but the current decision path does not consume those fields where
filtering decisions are made. Treating the documented metapanel paths as already
covered would overstate current authority and could leave Shorts owner leaks,
whitelist false-hides, or fallback fetch pressure in place.

## Future Proof Required

Before using active Shorts/reel overlay owner fields for behavior changes, add
a fixture-backed contract that names:

```text
shortsReelOverlayOwnerAuthorityContract
shortsReelOverlayDecisionReport
reelPlayerOverlayRendererFilterRulePromotion
shortsReelOverlayMetapanelOwnerPolicy
shortsReelOverlayWhitelistPolicy
shortsReelOverlayVideoIdJoinPolicy
shortsReelOverlaySideEffectBudget
shortsReelOverlayJsonFirstGate
```

None of those authority symbols exists in product runtime source today.

## Verification

Current proof command:

```bash
node --test tests/runtime/shorts-reel-overlay-owner-authority-boundary-current-behavior.test.mjs --test-reporter=spec
```

This report narrows one active Shorts/reel owner-identity boundary only. It does
not complete the broad audit or grant permission to change filtering behavior.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this Shorts/Reel/lockup surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, Shorts filtering behavior, Reel overlay
behavior, whitelist behavior, metric collectors, artifact creation, native
sync, release package changes, or public claims.
