# FilterTube Source Boundary Audit - 2026-05-18

Status: audit artifact only. This file does not change extension, website, or
runtime behavior.

This pass separates four local filesystem classes that are easy to confuse
during a complete audit:

1. Git-tracked product source.
2. Ignored raw YouTube capture evidence.
3. Ignored generated build/dependency output.
4. Current untracked audit artifacts.

The distinction matters because the complete-codebase audit needs to inspect
every shipped/runtime source file without accidentally treating large raw
captures or generated package output as product logic.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Boundary Model

```text
git ls-files
  -> product source, docs, website, packaged source, build scripts

git ignored root captures
  -> raw evidence used to build json_paths_encyclopedia.md and
     youtube_renderer_inventory.md

git ignored generated output
  -> dist/, node_modules/, website/.next/, website/node_modules/,
     dotfiles and local cache artifacts

git untracked nonignored audit files
  -> current proof artifacts and test fixtures being built during this audit
```

## Tracked Source Authority

The authoritative source list is `git ls-files`, not `find .` and not raw
filesystem search. The tracked source set includes:

- manifests,
- extension scripts under `js/`,
- generated shell source under `src/extension-shell/`,
- generated shell output under `js/ui-shell/`,
- vendor bundles under `js/vendor/`,
- extension HTML/CSS/static assets,
- build/sync scripts,
- website source under `website/`,
- existing product documentation.

The source surface inventory classifies these loaded or packaged source
families in `docs/audit/FILTERTUBE_SOURCE_SURFACE_INVENTORY_2026-05-17.md`.

## Ignored Raw Evidence Authority

The root HTML/JSON/TXT capture corpus is intentionally ignored. These files are
valid audit evidence, not release source. They are the local raw material behind:

- `docs/json_paths_encyclopedia.md`
- `docs/youtube_renderer_inventory.md`

Representative ignored evidence files include:

```text
DOMs.html
YT_MAIN.json
YT_MAIN_NEXT.json
YT_MAIN_WATCH.html
YT_MAIN_UPNEXT_FEED_WATCHPAGE.json
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
WHITELIST_content.JS
```

Rule:

```text
Raw captures stay ignored.
Small representative fragments can be extracted into tests/runtime/fixtures.
Each fragment must cite the source family and expected decision.
```

## Ignored Generated Output Authority

Local generated output is also ignored and must not be counted as source when
searching line-by-line behavior:

```text
dist/
node_modules/
website/.next/
website/node_modules/
website/.vercel/
*.zip
*.apk
*.aab
```

The current local workspace contains ignored extension build output under
`dist/`, including `dist/filtertube-chrome-v3.3.1.zip`,
`dist/filtertube-firefox-v3.3.1.zip`, and
`dist/filtertube-opera-v3.3.1.zip`. Those files are useful for release-package
inspection, but they are not source of truth for method-level runtime auditing.

## Current Untracked Audit Artifacts

The current nonignored untracked files are audit docs, runtime fixtures, and
test harness files under:

```text
docs/audit/FILTERTUBE_*.md
docs/audit/artifacts/release-live-youtube-spa-smoke/template.json
tests/runtime/**
```

Those files are intentional proof artifacts for this audit. They should remain
separate from product fixes until the baseline is accepted.

## High-Confidence Findings

1. **`git ls-files` is the source authority.**
   Root-level capture files appear in filesystem searches, but they are ignored
   and untracked. A broad `find` or editor search can over-count them as product
   logic.

2. **Ignored JavaScript-like evidence exists.**
   `WHITELIST_background.js`, `WHITELIST_content.JS`, and `playlist.js` are
   raw/historical evidence. They must not be audited as current runtime source
   unless a specific fragment is intentionally extracted.

3. **Ignored generated extension packages exist locally.**
   `dist/` contains full packaged copies of the extension. Those copies can be
   inspected for release parity, but product behavior should be traced back to
   tracked source files.

4. **Current audit files are untracked by design.**
   The worktree contains audit docs/tests that should eventually be committed
   together or explicitly discarded. They are not runtime changes.

## Required Follow-Up Proof

| Requirement | Proof needed |
| --- | --- |
| Source classification completeness | Every tracked loaded/packaged source file is classified in `FILTERTUBE_SOURCE_SURFACE_INVENTORY_2026-05-17.md`. |
| Raw capture safety | Raw captures remain ignored/untracked; extracted fixtures are minimal and source-cited. |
| Generated output safety | `dist/`, `website/.next/`, and dependency caches stay excluded from source audits and release commits. |
| Release package parity | Separate release-package fixtures compare `dist/` or ZIP contents back to tracked source and manifests. |

## Fixture Coverage

Executable current-boundary fixtures are in:

```text
tests/runtime/source-boundary-current-behavior.test.mjs
```

They pin:

- raw capture evidence is ignored and untracked,
- generated package/dependency output is ignored and untracked,
- nonignored untracked files are audit artifacts only,
- this document cites the tracked/ignored/generated boundary model.
