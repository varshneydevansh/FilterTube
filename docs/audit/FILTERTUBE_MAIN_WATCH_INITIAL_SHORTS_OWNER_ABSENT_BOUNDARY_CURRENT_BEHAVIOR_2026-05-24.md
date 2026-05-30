# FilterTube Main Watch Initial Shorts Owner-Absent Boundary Current Behavior - 2026-05-24

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged.
This is not an implementation patch.

This slice narrows the earlier `YT_MAIN.json` watch-initial fixture to the
Shorts remix shelf only. The important result is a negative authority boundary:
the reduced `shortsLockupViewModel` rows carry stable video/title signals, but
the captured rows do not carry direct owner channel identity. Channel blocklist
rules therefore have no owner to match, and channel whitelist mode removes the
rows because identity remains unresolved.

## Source Evidence

| Evidence | Current value |
| --- | --- |
| Raw source | `YT_MAIN.json` |
| Raw SHA-256 | `64c7861ff6baa76816082479f5bdda591faef3e72e2510e6da80866cba1c3357` |
| Raw bytes | `4951099` |
| Logical lines | `50481` |
| Reduced fixture | `tests/runtime/fixtures/captures/main-watch-initial-lockup-shorts-json.json` |
| Fixture SHA-256 | `274f7b1f766aa43f7194fe0f8c601ac1316f713c43b1aff9a1a1e73b6128d1bb` |
| Fixture bytes | `12468` |
| Fixture lines | `296` |
| Isolated renderer path | `engagementPanels.5.engagementPanelSectionListRenderer.content.structuredDescriptionContentRenderer.items.3.reelShelfRenderer.items` |

The reduced shelf has two `shortsLockupViewModel` rows:

```text
_NsY2tXTveU
lJ4Ty2Xos08
```

Each row has `accessibilityText`, `onTap.innertubeCommand.reelWatchEndpoint.videoId`,
and `overlayMetadata.primaryText.content`. The reduced rows do not have
`browseEndpoint`, `canonicalBaseUrl`, `belowThumbnailMetadata`,
`decoratedAvatarViewModel`, `ownerText`, `shortBylineText`, `longBylineText`,
`channelId`, or `channelName`.

## Current Behavior Matrix

| Mode | Current result | Risk pinned |
| --- | --- | --- |
| Blocklist channel | An unmatched fabricated UC owner rule preserves both Shorts rows and queues no channel-map or video-channel-map side effects for the isolated shelf. | Channel blocklist behavior cannot be treated as owner-aware for these rows. |
| Blocklist keyword | A `watermelon` keyword removes only `lJ4Ty2Xos08`; `_NsY2tXTveU` remains. | Title/accessibility text authority is active and separate from owner authority. |
| `hideAllShorts` | Removes both isolated Shorts rows. | Shorts global hiding is active even when owner identity is absent. |
| Whitelist channel | A matching-looking fabricated channel allow rule removes both Shorts rows because no owner identity is available. | Whitelist can fail closed on owner-absent Shorts lockups. |
| Whitelist keyword | A `Big Tasty` keyword allow rule preserves `_NsY2tXTveU` and removes `lJ4Ty2Xos08`. | Keyword whitelist can work without owner authority; channel whitelist cannot. |

## Optimization Implication

This keeps the JSON-first optimization gate closed for Shorts owner behavior.
The current fixture is useful for proving title/video-id and `hideAllShorts`
behavior, but it is not owner-present Shorts proof. A future optimization needs
separate owner-present `shortsLockupViewModel` fixtures before promoting
`belowThumbnailMetadata`, decorated-avatar, or browse endpoint fields into
first-class channel decisions.

## Future Authority Tokens

These names are documentation-only anchors for the audit backlog and remain
absent from product runtime source in this slice:

```text
mainWatchInitialShortsOwnerAbsentContract
mainWatchInitialShortsOwnerDecisionReport
mainWatchInitialShortsChannelAuthorityPolicy
mainWatchInitialShortsWhitelistIdentityPolicy
mainWatchInitialShortsMapSideEffectBudget
shortsLockupOwnerAbsentJsonFirstGate
mainWatchInitialShortsOwnerAbsentMetricArtifact
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this Shorts/Reel/lockup surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, Shorts filtering behavior, Reel overlay
behavior, whitelist behavior, metric collectors, artifact creation, native
sync, release package changes, or public claims.
