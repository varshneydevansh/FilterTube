# FilterTube Managed Import List Format

Date: 2026-06-18
Scope: parent/caregiver-managed protected profiles, local profile rules, Nanah live sync handoff, and future app parity.

## Goal

Keep imports simple enough for parents and caregivers:

1. The file provides rule values.
2. FilterTube previews what it understood.
3. The parent chooses protected profiles.
4. The parent chooses Main YouTube, YouTube Kids, or both.
5. FilterTube applies the rules locally after parent/account unlock.
6. FilterTube can then send the changed profile policy to verified devices.

The file must not decide parent authority, target child profile, PIN behavior, sync delivery, list mode, or Main/Kids access. Those decisions stay in the UI.

## User-Facing Name

Use `Import List` in the UI.

Avoid making parents choose between many importer types. The importer can accept:

- channel lists
- keyword lists
- mixed CSV rule lists
- URL-backed lists

The preview should explain the result in plain counts:

```text
48 channels
12 keywords
3 rows skipped
Applies to: Main + Kids
Profiles: Asha, Kabir
```

## Recommended CSV Format

CSV is for explicit channel identifiers and explicit keywords. It is not semantic inference.

Recommended header:

```csv
channel_id,keyword,notes
UCxxxxxxxxxxxxxxxxxxxxxx,,block this channel
@SomeChannel,,handle is accepted
https://www.youtube.com/@AnotherChannel,,URL is accepted
,spider,hide this topic keyword
,brainrot,hide this keyword
```

Rules:

- `channel_id` can contain:
  - `UC...` channel ID
  - `@handle`
  - `/channel/UC...`
  - `/c/name`
  - `/user/name`
  - YouTube channel URL
- `keyword` can contain a plain keyword or phrase.
- `notes` is ignored by runtime and exists only so list authors can explain rows.
- A row may contain a channel, a keyword, or both.
- Empty rows and comment rows are skipped.
- Name-only channel rows are skipped for safety.

Accepted channel column aliases:

```text
channel
channel_id
channelId
channel_url
youtube_url
url
handle
uc_id
```

Accepted keyword column aliases:

```text
keyword
keywords
term
terms
phrase
phrases
```

## Alternate CSV Format

For list maintainers who prefer one value column:

```csv
type,value,notes
channel,UCxxxxxxxxxxxxxxxxxxxxxx,channel id
channel,@SomeChannel,handle
keyword,spider,topic keyword
keyword,brainrot,topic keyword
```

This is readable, but the UI should still recommend `channel_id,keyword,notes` because it is easier for spreadsheet users.

## Plain Text Format

Plain text remains channel-first for safety.

```text
# title: Family channel block list
# version: 2026.06.18
UCxxxxxxxxxxxxxxxxxxxxxx
@SomeChannel
https://www.youtube.com/@AnotherChannel
```

Do not treat arbitrary plain text rows as keywords. A note like `bad thumbnails` should not silently become a keyword rule.

## JSON Format

JSON can support both channels and keywords.

```json
{
  "title": "Family safety starter list",
  "version": "2026.06.18",
  "homepage": "https://example.com/filtertube-list",
  "channels": [
    "UCxxxxxxxxxxxxxxxxxxxxxx",
    "@SomeChannel",
    "https://www.youtube.com/@AnotherChannel"
  ],
  "keywords": [
    "spider",
    "brainrot"
  ]
}
```

Simple arrays remain channel lists for backward compatibility:

```json
[
  "UCxxxxxxxxxxxxxxxxxxxxxx",
  "@SomeChannel"
]
```

## Not In The File

These must not be accepted from the import file:

- protected profile id
- parent profile id
- PIN or password
- Nanah trusted-device id
- sync destination
- list mode change
- Main/Kids access mode
- daily time limit
- allow/deny authority
- remote command

Reason: a downloaded list should never become authority. It is only a source of suggested rules.

## How It Applies

Parent UI owns the final choices:

```text
Import List
  -> preview channels/keywords/skipped rows
  -> choose protected profiles
  -> choose Main / Kids / Both
  -> parent/account unlock
  -> apply rows to each target profile's current mode
  -> optionally send update to verified device
```

### Parent/Caregiver User Flow

```mermaid
flowchart TD
    A["Parent opens Accounts and Sync"] --> B["Choose protected profile or selected profiles"]
    B --> C["Open Lists"]
    C --> D["Import List"]
    D --> E["Paste, choose file, load HTTPS URL, or download CSV template"]
    E --> F["FilterTube previews channels, keywords, skipped rows"]
    F --> G{"Parent accepts preview?"}
    G -- "No" --> H["Cancel with no profile changes"]
    G -- "Yes" --> I["Choose Main, Kids, or Both"]
    I --> J["Parent/account unlock"]
    J --> K["Apply explicit rules to selected protected profiles"]
    K --> L{"Verified device path available?"}
    L -- "No" --> M["Keep local profile policy ready"]
    L -- "Yes" --> N["Offer Send Update"]
    N --> O["Send managed-policy JSON through existing verified-device path"]
```

### Rule Import Behavior Flow

```mermaid
flowchart TD
    A["Input text/file/URL"] --> B{"Looks like JSON?"}
    B -- "Yes" --> C["Parse channels and keywords arrays"]
    B -- "No" --> D{"CSV headers found?"}
    D -- "Yes" --> E["Parse channel_id and keyword columns or type/value rows"]
    D -- "No" --> F["Plain text channel-only parser"]
    C --> G["Normalize explicit channel identifiers"]
    E --> G
    F --> G
    C --> H["Normalize explicit keywords"]
    E --> H
    G --> I["Deduplicate against target profile surface"]
    H --> I
    I --> J["Decorate rows with managedListId, source hash, source label"]
    J --> K["Save rows under current Blocklist or Whitelist mode"]
```

### Verified-Device Sync Flow

Imported list rows do not create a second sync protocol. After rules are applied
to a protected profile, FilterTube sends the changed policy through the existing
managed-policy JSON path when the parent chooses to send now.

```mermaid
sequenceDiagram
    participant Parent as Parent profile
    participant Runtime as FilterTube extension runtime
    participant Nanah as Nanah verified path
    participant Child as Protected device/profile

    Parent->>Runtime: Apply imported rule list after unlock
    Runtime->>Runtime: Update protected profile channels/keywords
    Runtime->>Runtime: Record protected action history
    Runtime->>Parent: Offer Send Update when verified path exists
    Parent->>Runtime: Confirm send
    Runtime->>Nanah: Send signed managed-policy JSON envelope
    Nanah->>Child: Deliver to verified target profile path
    Child->>Child: Verify trusted link, target profile, scope, revision, hash
    Child->>Child: Apply only if newer and trusted
```

Mode behavior:

- If the target surface is in blocklist mode, imported channels go to block channels and imported keywords go to block keywords.
- If the target surface is in whitelist mode, imported channels go to whitelist channels and imported keywords go to whitelist keywords.
- The import does not switch modes.

Pause/resume/remove behavior:

- Rows from the same imported list share `managedListId`.
- Pause disables list-derived channel and keyword rows without deleting manual rules.
- Resume re-enables them.
- Remove deletes only rows with that `managedListId`.
- URL refresh replaces only rows from that list.

## Semantic ML Boundary

This CSV format is deterministic. It does not infer related channels or related keywords.

Later semantic ML can build a separate `suggested rules` layer:

```text
seed term -> suggested keywords/channels -> parent review -> explicit rules
```

That future layer should still end at the same explicit rule model before it affects a child/protected profile.

## UI Simplification

Use one modal with four clear areas:

```text
1. List source
   Paste, choose file, or load public HTTPS URL.

2. Preview
   Channels found, keywords found, rows skipped.

3. Apply to
   Main, Kids, or Both.

4. Finish
   Apply locally, then optionally Send to verified devices.
```

Avoid showing mailbox/LAN/provider wording inside the import flow. Import is local first; delivery is the next optional step.
