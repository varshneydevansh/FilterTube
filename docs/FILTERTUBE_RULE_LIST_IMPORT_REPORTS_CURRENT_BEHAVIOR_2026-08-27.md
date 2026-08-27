# FilterTube rule-list import and completion reports

Date: 2026-08-27

## Scope

CSV, TXT, FilterTube rule-list JSON, BlockTube migration JSON, uploaded files,
pasted text, and raw public HTTPS lists converge on one reviewed import flow.
The parent/account chooses Main YouTube, YouTube Kids, or both; the file cannot
select a profile, reveal or replace a PIN, change viewing access or time limits,
pair a device, or choose a sync destination.

BlockTube migration remains Main-only because it also maps supported Main video
IDs and settings. Its channel rows still use the same metadata completion and
reporting model as other list formats.

## User flow

1. The user opens **Settings > Import / Export > Rule list imports**.
2. The user pastes a list, chooses a file, loads a raw HTTPS URL, or starts from
   the provided CSV/TXT/JSON template. Starter examples are inert: CSV/TXT
   examples stay commented and JSON examples stay outside the empty `rules`
   array until the user deliberately replaces and activates them.
3. FilterTube detects the content rather than trusting the filename extension.
4. Preview shows understood channels and keywords plus exact skipped source
   rows and reasons. Invalid JSON that looks like JSON is not reinterpreted as
   TXT.
5. The user chooses Main, Kids, or both and approves the reviewed mutation from
   an authorized parent/account profile.
6. Valid rules are written in one reviewed profile save. BlockTube additionally
   uses its verified rollback transaction. Duplicate identities are counted but
   are not inserted again. UC IDs, handles, custom URLs, and known aliases are
   compared as channel identities; name-only rules remain separate because a
   display name is not a unique YouTube identity.
7. Keywords are complete immediately. A channel rule with a valid identifier is
   active immediately, even if its name, handle/custom URL, or avatar is not
   complete yet.
8. Incomplete channel identifiers enter the persisted background queue for the
   selected Main/Kids targets. Lookups remain serialized with randomized 7–15
   second spacing while the extension worker is awake. Failed or partial
   responses retain a per-row error and retry timestamp.
9. The completion dialog distinguishes complete rows, background completion,
   and rows needing attention and offers **View Import Report**.
10. Reports remain available from Settings and from Main/Kids Channel
    Management notices. Closing the dashboard does not erase the report or stop
    the background-owned queue.
11. Existing imported rows created before report storage receive compact
    recovered reports. Recovery selects the authoritative profile rows by
    managed-list ID or import source instead of copying a 15,000-row list into
    report storage.
12. An open report refreshes its derived state every ten seconds. Visible
    Main/Kids channel rows rerender when imported names, handles/custom URLs, or
    avatars change, without requiring a hard dashboard refresh.

## Import report states

| State | Meaning | Filtering state | User action |
| --- | --- | --- | --- |
| Complete | Saved channel has UC ID, display name, alternate handle/custom URL, and avatar. | Active | None |
| Pending | Valid saved identifier is waiting in the paced queue. | Active | Wait or pause/resume the queue |
| Fetching | This row is the one serialized lookup currently in flight. | Active | None |
| Retrying | YouTube returned an error or incomplete metadata; attempt count, reason, and next retry are retained per row. | Active | Wait; inspect/export the report if it persists |
| Needs attention: permanent lookup | YouTube explicitly reported that the channel is missing, unavailable, or terminated. The exact reason is retained and this row is no longer retried automatically. | Active from its saved identifier | Verify the identifier on YouTube, then replace or remove the rule manually |
| Needs attention: name only | The source supplied a display-name boundary without a unique identity. | Active as a name rule | Add an exact channel link or UC ID if exact identity is required |
| Needs attention: skipped | The parser could not safely convert the source row. | Not imported | Correct the reported source row and import it again |
| Needs attention: queue missing | The rule is active but incomplete metadata is no longer represented in the persisted queue. | Active | Reopen/resume completion and inspect the row |

The report viewer filters by state and searches original values or reasons. A
permanent lookup row displays the exact YouTube response (for example, “This
channel does not exist.” or the terminated-account alert), a manual verification
instruction, and a direct **Verify channel** link when an identity URL can be
constructed. It renders at most 200 rows at once and offers another 200 on
demand, preventing a
large report from recreating the full-list DOM lag. Unresolved rows can be
downloaded as CSV. Reports retain the latest 12 imports subject to a 50,000-row
history budget; the newest report is always retained.

Queue/report-only storage writes do not reload the full profile. Imported
metadata writes carry a small revision marker and the completed channel row, so
the active dashboard or popup patches that row in memory and rerenders only its
bounded visible list. Other extension contexts avoid repeatedly parsing the
large channel list. Imported enrichment also avoids rewriting legacy list
projections; V4 remains authoritative.

The report modal uses an opaque bounded sheet with a fixed footer, so report
rows scroll inside the sheet while **Download unresolved CSV** and **Done** stay
anchored at the bottom. The report table is windowed to 200 visible rows and
uses an internal horizontal scroll on narrow surfaces; it does not recreate the
15,000-row Filters DOM.

## Parser behavior

### CSV

- Recognized channel headers include `channel`, `channel_id`, `channel_url`,
  `youtube_url`, `url`, `handle`, and `ucid` after punctuation/case
  normalization.
- Recognized keyword headers include `keyword`, `keywords`, `term`, `terms`,
  `phrase`, and `phrases`.
- `type` + `value` rows are supported for channel and keyword records.
- Quoted commas and escaped double quotes are accepted by the row parser.
- A row is accepted when at least one mapped channel or keyword cell is valid.
  Otherwise preview and the saved report keep its source row and reason.

### TXT

- `channel:` accepts UC IDs, handles, `/channel/UC...`, `c/...`, `user/...`, and
  YouTube channel URLs.
- `keyword:` is required for keyword rows.
- Bare rows remain channel-only so an ambiguous phrase cannot silently become a
  broad keyword filter.
- Blank rows and comment/metadata rows beginning with `#`, `!`, or `//` do not
  become rules.

### JSON

- FilterTube `schema: "filtertube_rule_list"` rule arrays, simple channel or
  keyword arrays/objects, and supported legacy shapes normalize into the same
  preview.
- Original rule-array positions are retained in reports.
- Malformed JSON is an explicit preview error instead of falling through to TXT
  interpretation.

### Files and public URLs

- File extensions do not decide semantics; loaded content runs through the same
  detector and preview.
- Local files and URL responses are capped at 1 MB.
- Public lists must use HTTPS. GitHub `blob` links are normalized to raw content
  links. Requests omit credentials, bypass cache, and time out after 15 seconds.
- A remote list never applies automatically after download or refresh; parent
  review remains required.

## Identity and duplicate boundary

Duplicate detection compares every known identity key on a channel: primary UC
ID, alternate UC IDs, handle variants, custom URL, and original input. If any
known alias overlaps, the row is treated as the same channel. Display-name-only
rules are compared only as name-boundary rules and are never automatically
matched to a similar-looking channel.

The same parser, report, identity, and background enrichment contracts apply to
the active account profile and parent-managed profiles, and to Main and Kids.
Only authorization and the selected destination differ.
