# YouTube VEVO Handle/UC ID Mismatch Bug

## Summary

YouTube's collaborator data contains a known inconsistency where VEVO channels
display the **artist's vanity handle** (e.g., `@Shakira`) in the subtitle but link
to the **VEVO channel's UC ID** (e.g., `UCGnjeahCJW1AF34HBmQTJ-Q` = shakiraVEVO).

Related issue: https://github.com/varshneydevansh/FilterTube/issues/25

## The Mismatch

In the collaborator dialog JSON:

```
title.content:        "shakiraVEVO"              ← VEVO channel name
canonicalBaseUrl:     "/@shakiraVEVO"             ← VEVO channel handle
browseEndpoint.browseId: "UCGnjeahCJW1AF34HBmQTJ-Q"  ← VEVO channel UC ID
subtitle.content:     "@Shakira • 1.82 crore subscribers" ← ARTIST handle (different channel!)
```

The real `@Shakira` handle resolves to `UCYLNGLIzMhRTi6ZOLjAPSmw` (the artist
channel), **NOT** `UCGnjeahCJW1AF34HBmQTJ-Q` (the VEVO channel). YouTube mixes
the artist's vanity handle with the VEVO channel's UC ID.

## Impact on FilterTube

- FilterTube correctly extracts `browseId` and `canonicalBaseUrl` — these are
  consistent and authoritative
- The `@Shakira` handle from the subtitle points to a different channel entirely
- If a user blocks "Shakira" (the artist), the VEVO channel
  (`UCGnjeahCJW1AF34HBmQTJ-Q`) may not be caught, and vice versa
- Channel avatar/logo may show the VEVO logo instead of the artist's profile photo

## Why FilterTube Cannot Fully Fix This

- The `browseEndpoint.browseId` is the canonical source of truth in YouTube's
  data model — it's the only reliable channel identifier
- The subtitle `@handle` is display text, not a navigation endpoint
- Parsing the subtitle to extract a separate handle would require heuristic
  matching against a different channel, risking false positives
- This is fundamentally a YouTube data quality issue

## Known Affected Patterns

| Artist | VEVO Channel | Artist Channel |
|--------|-------------|----------------|
| Shakira | `UCGnjeahCJW1AF34HBmQTJ-Q` (@shakiraVEVO) | `UCYLNGLIzMhRTi6ZOLjAPSmw` (@Shakira) |

This pattern likely affects most VEVO-affiliated music artists.

## Possible Workarounds (Not Implemented)

1. **Subtitle handle extraction**: Parse `@Handle` from `subtitle.content` and
   resolve it as an additional channel identity
2. **VEVO suffix stripping**: If a collaborator name ends in "VEVO", also check
   for blocks against the name without the "VEVO" suffix
3. **Dual-block**: When blocking a VEVO channel, also offer to block the
   underlying artist channel (and vice versa)

All workarounds are heuristic and may produce false positives.
