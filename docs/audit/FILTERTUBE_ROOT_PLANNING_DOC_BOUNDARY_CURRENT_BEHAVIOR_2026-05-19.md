# FilterTube Root Planning Doc Boundary - 2026-05-19

Status: current-behavior audit artifact only. This document does not change extension, website, or native-app behavior.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 73
method semantic proof gap lexical callables covered: 6282
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6282
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Why This Exists

The repository root contains a mix of product metadata, release docs, and local
planning/evidence notes. During the full FilterTube audit, those files must not
be confused with runtime source or with the ignored raw YouTube capture corpus.

This matters because the channel identity, watch, Mix, collaborator, whitelist,
and DOM fallback investigations rely on old root notes and raw captures for
context, but implementation authority still has to come from tracked runtime
source and executable current-behavior tests.

## Current Root Markdown Boundary

```text
root markdown files from git ls-files
  README.md
  CHANGELOG.md
  channel-identity-watch-mix-collab-recovery-plan.md

ignored local root planning/evidence notes
  watcher-collab-watchlist-spa-fix-plan.md
  cher.md
```

`README.md` and `CHANGELOG.md` are public/release metadata. They are copied by
`build.js` because `COMMON_FILES` includes `README.md`, `CHANGELOG.md`, and
`LICENSE`.

`channel-identity-watch-mix-collab-recovery-plan.md` is a tracked historical engineering plan. It is classified as root project metadata by the tracked-file
coverage fixture, but it is not copied by the extension package common-file
list, is not referenced by manifests, and is not runtime code.

`watcher-collab-watchlist-spa-fix-plan.md` and `cher.md` are ignored local
planning/evidence files under `.gitignore`. They can inform audit thinking, but
they must not become release source unless deliberately converted into a tracked
doc or a minimal source-cited fixture.

## Current Evidence Chain

```text
ignored raw/planning evidence
  |
  +--> tracked planning note may cite it for historical context
          |
          +--> executable current-behavior tests must prove the actual runtime
```

The tracked plan currently references `stash.txt` as historical evidence. That
is allowed only as an audit clue. `stash.txt` is ignored raw/local evidence, not
runtime source.

## Current Finding

Root planning docs are useful for explaining why a behavior was attempted, but
they are not behavior proof. The audit should continue converting any important
claim from these notes into:

- a source line reference,
- a current-behavior runtime test,
- a source-cited capture fixture, or
- an explicit unsupported/quarantined classification.

## Proof Fixture

Executable coverage lives in:

```text
tests/runtime/root-planning-doc-boundary-current-behavior.test.mjs
```

It pins that:

- root markdown files are classified into public metadata vs historical plan,
- ignored root planning/evidence notes remain ignored and untracked,
- historical planning notes may cite ignored evidence but do not become runtime
  source,
- the browser release package common files include public docs but not the
  historical channel-identity plan,
- manifests do not reference root planning docs.
