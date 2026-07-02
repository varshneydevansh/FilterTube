# FilterTube Date-Based Keyword Filtering

Date: 2026-07-02

## Scope

This documents the first implementation slice for GitHub issue #63: a keyword
can optionally apply only to videos released on or after a date, on or before a
date, or between two dates.

This is separate from the existing global upload-date content filter. The
global filter blocks by date regardless of keyword. The new keyword date filter
only gates that one keyword.

## Storage Shape

Old keyword rows remain valid.

```json
{
  "word": "Deltarune",
  "exact": false,
  "comments": true
}
```

Date-limited keyword rows add optional metadata.

```json
{
  "word": "Deltarune",
  "exact": false,
  "comments": true,
  "dateFilter": {
    "enabled": true,
    "condition": "after",
    "fromDate": "2025-06-10",
    "toDate": ""
  }
}
```

Supported conditions:

```text
after   -> released on or after fromDate
before  -> released on or before toDate
between -> released between fromDate and toDate, inclusive
```

## Runtime Evidence Order

The runtime uses the same date evidence family already documented for upload
date filtering in `docs/json_paths_encyclopedia.md`:

```text
1. videoMetaMap[videoId].uploadDate / publishDate
2. JSON renderer publishedTimeText
3. DOM metadata text fallback
```

`videoMetaMap` is populated from `/player` microformat fields when available:

```text
microformat.playerMicroformatRenderer.uploadDate
microformat.playerMicroformatRenderer.publishDate
```

Renderer relative dates use paths such as:

```text
publishedTimeText.simpleText
publishedTimeText.runs[0].text
```

Comment keyword filtering is anchored to the parent video date, not the
comment posted date. For comment JSON and DOM fallback paths, a date-limited
comment keyword first checks the current/linked watch video in `videoMetaMap`.
If that video date is unknown, the date-limited comment keyword does not match
by itself and DOM fallback may request `/player` metadata for the current watch
video. This avoids treating comment labels such as "2 days ago" as the release
date of the video.

## Safety Policy

If a keyword has no date filter, behavior is unchanged.

If a keyword has an enabled date filter but FilterTube cannot prove the video's
date, that keyword does not match. This avoids false hides from unknown dates.

In whitelist mode this also means a date-limited whitelist keyword only allows
content when the date is known and inside the allowed date window. Channel
whitelist rules and other whitelist rules are evaluated separately.

## UI Surface

Keyword rows now expose a `Date` pill beside `Exact`. The editor explains that
the rule uses video release/upload date, not the date the keyword was added.

The `Date` pill is not an optimistic toggle. Clicking it opens the editor, but
the row only stays active after a valid date rule is saved. Canceling the modal
or trying to save without the required date boundary leaves the pill inactive.

Managed child-profile editing uses the same row control, so a parent can set a
date-limited keyword while virtually editing a protected profile and then send
that managed policy to a verified device through the existing device-update
flow.

## Compatibility Notes

- Existing string keywords remain accepted.
- Existing object keywords without `dateFilter` remain accepted.
- FilterTube backup JSON preserves `dateFilter` inside keyword entries during
export/import because it is part of profile rule data.
- Device update / managed profile sync preserves `dateFilter` when the parent
sends a protected profile policy to a verified device.
- Rule-list imports from CSV, TXT, raw URLs, and simple public JSON currently
create plain keyword/channel rows. They do not silently attach date windows;
parents can add a Date rule after preview/import.
- BlockTube migration JSON remains a channel/title list migration path and does
not infer FilterTube keyword date windows.
- Main and Kids profiles both support the metadata.
- Channel-derived keywords do not expose this editor because their source of
truth remains the channel `Filter All` toggle.
