# Linked creator-channel aliases

Status: IMPLEMENTED_WITH_FOCUSED_AUTOMATED_PROOF; installed-extension and native-app smoke pending.

## Decision

When YouTube explicitly associates two UC IDs with the same visible creator on
one exact video, blocking or allowing that creator applies to both IDs.

The stored model is one creator rule:

```json
{
  "name": "shakiraVEVO",
  "handle": "@shakiraVEVO",
  "id": "UCGnjeahCJW1AF34HBmQTJ-Q",
  "alternateIds": ["UCYLNGLIzMhRTi6ZOLjAPSmw"]
}
```

This is not a third collaborator and not a second visible settings row.

The authoritative roster thumbnail is retained on that same visible row. A
missing avatar must be repaired by carrying the sheet `leadingAccessory` image
through collaborator sanitization and persistence; it is not a reason to split
the creator into two entries.

## Captured authority

For video `_Wcf2rKEB8E`, the retained Search XHR renderer supplies:

- a header-backed `Collaborators` sheet whose Shakira row is
  `UCGnjeahCJW1AF34HBmQTJ-Q` / `@shakiraVEVO`;
- a card-level channel thumbnail whose endpoint is
  `UCYLNGLIzMhRTi6ZOLjAPSmw` and whose accessibility label is
  `Go to channel shakiraVEVO`;
- a separate Spotify roster row, `UCRMqQWxCWE0VMvtUElm-rEA`;
- an adjacent generated MIX whose participant byline has no collaborator
  browse IDs.

The two Shakira IDs occur inside the same video renderer, and the card label
matches exactly one normalized authoritative roster member. That is the alias
link. The roster still contains exactly Shakira and Spotify.

## Evidence gate

Link two UC IDs only when all applicable conditions hold:

1. Both signals belong to the same exact `videoId` payload or retained renderer.
2. One is already an authoritative creator/roster identity.
3. Exact normalized name, handle, or custom URL corroborates exactly one member.
4. Neither signal comes only from MIX/radio descriptive byline text.

Zero matches, multiple matches, and loose similarity produce no alias. This
keeps ordinary channels separate and allows later stronger JSON to promote an
identity in place.

## Runtime flow

```text
video-scoped Search/Next/Player JSON
  -> authoritative creator or Collaborators roster
  -> exact card/owner/player identity corroboration
  -> one channel object: id + alternateIds
  -> isolated-world menu metadata
  -> background persistence and import/export preservation
  -> shared matcher indexes every linked UC ID
  -> either UC ID receives the same block/allow decision
```

`channelMap` also records each linked UC ID to the same handle when one is
available. The handle maps back to the primary stored ID; this does not change
roster size or UI labels.

## SOLO and collaboration behavior ledger

| Surface | Before | After |
|---|---|---|
| Collaboration renderer with card/sheet ID mismatch | One ID displaced or failed to match the other | One roster member retains primary plus alternate ID |
| Collaborator count/menu | Risk of an extra synthetic channel | Unchanged; alternate ID is metadata only |
| SOLO card/player ID mismatch | First UC ID won and the second was discarded | Exact corroborated second ID is retained |
| Different creators with different labels | Separate | Still separate |
| Generated MIX | Descriptive metadata only | Still excluded from alias and collaborator inference |
| Stored filter | Matched one UC ID | One visible rule matches either linked UC ID |
| Settings avatar | Sheet image could be discarded before persistence | The one creator row retains its authoritative roster thumbnail |

## CamelCase boundary

CamelCase is a selector compatibility concern, not an identity model. Current
YTM DOM names provide a signal that a non-MIX card may need enrichment and the
`videoId` used to query retained XHR snapshots. Plain `A and B` bylines remain
lookup hints only. The JSON roster and browse endpoints are the source of truth.

## Automated proof

- `tests/runtime/linked-creator-channel-alias-current-behavior.test.mjs`
  proves the positive Shakira association, zero/ambiguous-match rejection, SOLO
  candidate merge, different-creator rejection, bidirectional matching, and
  persistence-path retention.
- Existing YTM camelCase collaborator tests continue to prove sheet-required
  lookup and MIX exclusion.

Installed-extension and native-app smoke must confirm that blocking the Shakira
row hides content attributed to either UC ID while showing one Shakira rule and
two collaborator rows for `_Wcf2rKEB8E`.
