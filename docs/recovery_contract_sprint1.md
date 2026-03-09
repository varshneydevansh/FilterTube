# Sprint 1 Recovery Contract

This note freezes the behavior recovered from the docs, `stash.txt`, and commit analysis so later edits do not re-introduce the same ambiguity.

## Checklist

- JSON-first authority:
  - HTML GET, `ytInitialData`, and JSON responses such as `/youtubei/v1/next`, `/browse`, `/player`, `get_watch?prettyPrint=false`, `next?prettyPrint=false`, and `search?prettyPrint=false` are the source of truth for blocking and restoring.
  - DOM prestamping is cosmetic UX only. It may improve visible labels and make the UI feel immediate, but it must not complete the authoritative identity pipeline by itself.

- Video identity message contract:
  - `FilterTube_UpdateVideoChannelMap` is reserved for validated `videoId -> UC...` mappings and associated confirmed identity.
  - Partial name/handle/custom URL hints must travel separately and must not be treated as proof that enrichment is complete.

- Enrichment contract:
  - A card with only seeded name/handle/custom URL hints must still flow through reliable main-world enrichment.
  - Only a confirmed mapping plus sufficiently rich secondary identity may skip re-enrichment.

- Stale-card contract:
  - Recycled DOM nodes must lose stale channel ID, authority, and display fields when the video context changes.
  - Same-video refreshes may preserve safe expected-name hints long enough for authoritative restamping to complete.

- Mix contract:
  - Mix cards are never collaborations.
  - Blocking from a Mix card applies only to the seed/uploader channel, not a collaborator roster.

- Watch/YTM collaboration contract:
  - Only explicit JSON collaborator rosters count as authoritative collaboration data.
  - Collapsed bylines such as `"and 2 more"` are hints, not proof of collaboration identity.

- Channel-name precedence:
  - Prefer real canonical channel name first.
  - Then use expected channel name.
  - Then fall back to handle or custom URL.
  - UC ID is the last-resort identity, not the preferred visible label.
  - Topic rows and stale handles must not overwrite a repaired real channel name.

- Filter All provenance:
  - Derived channel keywords must remain linked to the originating `channelRef`.
  - When canonical channel names are repaired, derived keyword display/provenance must refresh as well.
