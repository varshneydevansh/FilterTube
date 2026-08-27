# FilterTube rule-list import reporting current-behavior proof

Date: 2026-08-27

## Change boundary

This slice adds persistent, source-agnostic import reporting around the existing
reviewed rule-list mutation and background channel-enrichment paths. It does not
change content-script block/allow decisions, profile authorization, PIN
authority, managed-device delivery, or the one-request-at-a-time enrichment
network boundary.

Covered import sources:

- CSV and TXT templates;
- user-supplied CSV, TXT, JSON, `.list`, or Markdown text files;
- pasted text;
- raw public HTTPS lists;
- FilterTube rule-list JSON;
- BlockTube migration JSON.

Covered destinations:

- active-profile Main YouTube;
- active-profile YouTube Kids;
- active-profile Main + Kids;
- parent-managed profile Main, Kids, or both.

## Runtime ownership

`js/tab-view.js` remains the preview and authorized UI mutation coordinator.
It now retains source row numbers, rejected-row reasons, format-level duplicate
counts, and the selected targets when the save succeeds.

`js/rule_list_import_reports.js` owns the compact persisted report schema and
derives current row state from two authoritative snapshots:

1. the saved V4 profile rule rows, which prove whether a rule exists and whether
   channel metadata is complete; and
2. `ftBlockTubeEnrichmentJobV1`, which proves pending, in-flight, retrying, and
   per-row error state.

The report never decides whether content is blocked. A valid imported UC ID,
handle, or custom URL remains active before metadata is complete. A skipped row
is explicitly not imported. A name-only rule remains a name-boundary rule and
is never silently matched to a similar channel.

`js/imported_channel_enrichment.js` continues to own persisted wakeups and
serialized network work. Its task schema now retains `lastError` and
`lastErrorAt` per retrying row in addition to queue-wide diagnostics.

Legacy imported rows that predate `ftRuleListImportReportsV1` are recovered on
first report access. Recovery stores a compact selector by `managedListId` or
import source and resolves the current authoritative rows when the report is
opened; it does not copy a large channel list into the report store. BlockTube
channel-name rows are kept as name-only boundaries and are never sent to the
identity lookup queue.

## Performance boundary

- The report schema stores one imported channel entry plus shared targets; it
  does not duplicate every source row for each Main/Kids/profile destination.
- Current status builds per-target identity and queue indexes before joining
  rows; it does not scan a 15,000-row saved channel list for each report row.
- The modal mounts at most 200 result rows and expands in 200-row pages.
- Report history retains at most 12 reports and 50,000 total rows, always
  retaining the newest report.
- Existing Main/Kids rule-list virtualization remains the Channel Management
  renderer boundary.
- Imported metadata writes carry one small
  `ftImportedChannelMetadataRevision` with the completed row. StateManager and
  the popup/dashboard use it to patch visible rows in memory, while background
  and YouTube content contexts skip a full profile rescan, legacy projection,
  settings recompilation, and tab refresh for metadata-only work.
- Main/Kids and popup channel/keyword lists use the same large-list windowing
  boundary; metadata completion does not recreate the entire 15,000-row DOM
  when the changed row is outside the visible window.

## Parser and input boundary

- CSV recognizes channel/keyword columns and `type` + `value` rows, preserves
  quoted commas/escaped quotes, counts duplicates, and reports rejected source
  rows.
- TXT keeps bare rows channel-only and requires `keyword:` for broad keyword
  rules.
- JSON-looking malformed input is rejected as JSON instead of being
  reinterpreted as TXT.
- Local files and URL bodies share the same content parser and 1 MB ceiling.
- URL imports remain HTTPS-only, credential-omitting, timeout-bounded, and
  preview-only until explicit approval.
- The preview prevents continuation when no supported rule is present.

## Automated proof

- `tests/runtime/rule-list-parser-current-behavior.test.mjs` executes CSV, TXT,
  FilterTube JSON, rejected-row, duplicate, source-position, and malformed-JSON
  fixtures.
- `tests/runtime/rule-list-import-reports-current-behavior.test.mjs` executes
  Main + Kids report joins for complete, pending, retrying, name-only, and
  skipped rows; it also checks bounded history and bounded UI rendering hooks.
- `tests/runtime/imported-channel-enrichment-background-worker-current-behavior.test.mjs`
  proves per-row error persistence in the paced background queue.
- Existing BlockTube transaction, alias deduplication, background ownership,
  and large-list virtualization tests remain part of the focused command.
- Render-engine source-register proof covers imported provenance badges and the
  bounded virtual-list render surface.

Focused automated command at implementation time:

```text
node --test \
  tests/runtime/rule-list-import-reports-current-behavior.test.mjs \
  tests/runtime/rule-list-parser-current-behavior.test.mjs \
  tests/runtime/imported-channel-enrichment-background-worker-current-behavior.test.mjs \
  tests/runtime/blocktube-import-transaction-current-behavior.test.mjs \
  tests/runtime/blocktube-enrichment-route-current-behavior.test.mjs \
  tests/runtime/render-engine-method-semantic-register-current-behavior.test.mjs
```

Result: 44 passed, 0 failed.

## Manual proof boundary

The currently open FilterTube Chrome tab was identified, but the available
browser-control safety policy blocks automation against `chrome-extension://`
URLs. No installed-extension visual claim is made from that attempt. Manual
release proof still needs the unpacked extension reloaded and these checks:

1. preview a mixed CSV/TXT/JSON file and confirm exact rejected rows;
2. apply to Main, Kids, and Both and open **View Import Report**;
3. filter Complete/Pending/Retrying/Needs attention;
4. verify only 200 rows mount initially on a large BlockTube report;
5. download unresolved CSV;
6. close/reopen the dashboard and confirm report persistence;
7. confirm valid identifiers block while their details remain pending.
