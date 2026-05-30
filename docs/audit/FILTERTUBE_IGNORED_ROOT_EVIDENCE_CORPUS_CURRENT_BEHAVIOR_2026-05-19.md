# FilterTube Ignored Root Evidence Corpus Current Behavior - 2026-05-19

Status: current-behavior proof slice. This is not an implementation patch.
Runtime behavior remains unchanged.

This slice exists because the repository root contains many ignored
YouTube-derived HTML/JSON/TXT/JS/MD evidence files. They are useful for the
audit and for docs like `docs/json_paths_encyclopedia.md` and
`docs/youtube_renderer_inventory.md`, but they are not current runtime source,
not package inputs, and not release artifacts.

## Current Corpus Shape

The `.gitignore` evidence patterns currently resolve to:

```text
46 ignored evidence entries
45 unique ignored evidence paths
45 present locally
44 root-level entries
2 nested ignored documentation entries

By extension:
  JSON: 24
  HTML: 8
  TXT: 7
  JS/JS: 3
  MD: 4
```

The duplicate entry is `playlist.json`, which appears twice in `.gitignore`.
That is harmless, but the duplicate is now explicit proof that a plain
line-count of `.gitignore` is not the same as a unique source-corpus count.

## Boundary Model

```text
ignored root captures
  -> source evidence for audit reasoning
  -> may be reduced into tests/runtime/fixtures/captures/*
  -> may be cited by docs/json_paths_encyclopedia.md
  -> may be cited by docs/youtube_renderer_inventory.md

tracked runtime source
  -> manifest-loaded scripts, background, content scripts, UI, website, build
  -> must not import or reference ignored raw evidence filenames

release/package output
  -> must derive from tracked source and explicit package roots
  -> must not sweep ignored root captures into browser ZIPs, website output, or native sync
```

## Representative Evidence Entries

```text
DOMs.html
YT_MAIN.json
YT_MAIN_NEXT.json
YT_MAIN_WATCH.html
YT_MAIN_NEXT_RESPONSE_COMMENT.json
YTM.json
YTM-XHR.json
YTM-DOM.html
YT_KIDS.json
ytkids_browse?alt=json.json
comments.json
collab.json
collab.html
playlist.json
playlist.html
reel_item_watch?prettyPrint=False.JSON
WHITELIST_background.js
WHITELIST_content.js
guide?prettyPrint=false.json
get_watch?prettyPrint=false.json
import_channels.txt
extracted_watch_paths.txt
```

## Current Findings

| Finding | Current behavior | Why it matters |
| --- | --- | --- |
| Evidence is ignored | Every evidence entry is matched by `git check-ignore`, and none is tracked by `git ls-files`. | Broad filesystem searches can see these files, but they are not source authority. |
| Runtime source does not reference raw names | Current tracked runtime/release source does not reference these ignored evidence paths or basenames. | Prevents raw capture files from becoming accidental runtime inputs or public package claims. |
| Reduced fixtures are separate | `tests/runtime/fixtures/captures/*` contains reduced fragments with different names and bounded size. | Real capture evidence can become executable proof without committing full raw captures. |
| Inventory docs are evidence maps | `docs/json_paths_encyclopedia.md` and `docs/youtube_renderer_inventory.md` are discovery aids, not automatic runtime coverage. | Behavior changes still need reduced fixtures and runtime tests before implementation. |

## Rule For Future Work

```text
Raw root captures stay ignored.
Behavior changes must cite a reduced fixture, not a raw local capture name.
Inventory docs can guide investigation, but tests decide runtime authority.
```

Related artifacts:

- `docs/audit/FILTERTUBE_SOURCE_BOUNDARY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_RAW_CAPTURE_RELEASE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md`
- `tests/runtime/ignored-root-evidence-corpus-current-behavior.test.mjs`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this ignored root evidence corpus can support
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
optimization, JSON-first behavior, raw evidence promotion, release packaging,
whitelist behavior changes, or selector/renderer authority changes.
