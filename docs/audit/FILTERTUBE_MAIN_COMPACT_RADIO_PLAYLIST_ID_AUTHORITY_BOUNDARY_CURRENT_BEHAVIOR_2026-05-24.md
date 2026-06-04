# FilterTube Main Compact Radio Playlist Id Authority Boundary Current Behavior - 2026-05-24

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged.
This is not an implementation patch.

This slice narrows the real `playlist.json` generated Mix proof to one
`compactRadioRenderer`. The important result is a primary-identity boundary:
the payload carries an `RD...` playlist id and seed video ids, but current JSON
filter decisions do not treat those ids as keyword-searchable content, channel
owner identity, or a JSON-side `hideMixPlaylists` decision.

## Source Evidence

| Evidence | Current value |
| --- | --- |
| Raw source | `playlist.json` |
| Raw SHA-256 | `f5766312bdddcceb20ecd2a4b54045843dfab89108b75c2f5bc8a0ee368d4ce5` |
| Raw bytes | `165443` |
| Logical lines | `3610` |
| Reduced fixture | `tests/runtime/fixtures/captures/main-compact-radio-renderer.json` |
| Fixture SHA-256 | `b30c66b9932c6a248e6b3221385323c37aa7d9517a3204ad1e5534aa404b6c7f` |
| Fixture bytes | `1186` |
| Fixture lines | `60` |
| Renderer | `compactRadioRenderer` |
| Route/surface | Main generated Mix/radio playlist card on watch/mix |

The reduced renderer carries:

```text
playlistId: RDEPo5wWmKEaI
navigationEndpoint.watchEndpoint.videoId: EPo5wWmKEaI
secondaryNavigationEndpoint.watchEndpoint.videoId: t4H_Zoh7G5A
shortBylineText: YouTube
longBylineText: YouTube
videoCountText: 50+ videos
```

The reduced renderer does not carry owner channel fields such as
`browseEndpoint`, `canonicalBaseUrl`, `channelId`, `externalChannelId`,
`ownerText`, or `authorEndpoint`.

## Current Behavior Matrix

| Mode | Current result | Risk pinned |
| --- | --- | --- |
| No rule | Preserves the `compactRadioRenderer` and queues no map side effects. | Mix rows are pass-through without a rule decision. |
| Blocklist title keyword | `Pitbull` removes the row. | Human-visible title text is active filter authority. |
| Blocklist playlist id keyword | `RDEPo5wWmKEaI` preserves the row. | The primary playlist id is not keyword-searchable content today. |
| Blocklist seed video id keyword | `EPo5wWmKEaI` preserves the row. | Seed video ids are not keyword-searchable content today. |
| Blocklist channel | A Pitbull-looking UC/handle rule preserves the row. | The generated Mix card has no creator channel identity to match. |
| Whitelist channel | The same Pitbull-looking channel allow rule removes the row. | Whitelist fails closed when creator identity is unresolved. |
| Whitelist title keyword | `Pitbull` preserves the row. | Keyword whitelist can allow display text without solving creator identity. |
| `hideMixPlaylists` | Preserves the JSON row. | Current Mix global hiding is DOM-side for this fixture, not JSON-first. |

## Optimization Implication

This is not permission to promote Mix playlist ids into hide or allow decisions.
It is evidence that any JSON-first Mix optimization needs an explicit policy
for three separate identities: playlist id, seed video id, and creator/channel
identity. The current behavior treats only title/byline text as filterable
content and treats the YouTube byline as display metadata, not creator channel
authority.

## Future Authority Tokens

These names are documentation-only anchors for the audit backlog and remain
absent from product runtime source in this slice:

```text
mainCompactRadioPlaylistIdentityContract
mainCompactRadioDecisionReport
mainCompactRadioPlaylistIdPolicy
mainCompactRadioDisplayBylinePolicy
mainCompactRadioWhitelistIdentityPolicy
mainCompactRadioHideMixJsonParityGate
mainCompactRadioSideEffectBudget
mainCompactRadioJsonFirstGate
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this playlist/mix/player-panel surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5830
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5830
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, playlist or Mix filtering behavior,
player-panel behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
