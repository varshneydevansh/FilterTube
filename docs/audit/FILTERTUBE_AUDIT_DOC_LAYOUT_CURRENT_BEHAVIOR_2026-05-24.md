# FilterTube Audit Doc Layout - Current Behavior - 2026-05-24

Status: audit-only current-behavior layout proof. Runtime behavior is
unchanged. This is not an implementation patch, product documentation rewrite,
JSON-first behavior patch, whitelist patch, native sync patch, release package
patch, or public claim patch.

## Purpose

This slice records the documentation placement rule for the ongoing audit:
new FilterTube audit markdown artifacts belong under `docs/audit/`. Core
product docs may cite audit artifacts, but the audit corpus should not keep
adding root-level `FILTERTUBE_*.md` files under the plain `docs/` directory.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 72
method semantic proof gap lexical callables covered: 6107
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6107
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

The current boundary is:

```text
current root FilterTube audit docs: 0
current docs/audit FilterTube audit docs: 554
root-level FilterTube audit doc placement: NO-GO
new audit artifact placement: docs/audit
runtime behavior changed: no
```

## Source Boundary

| Source | Current proof used |
| --- | --- |
| `docs/` | Must not contain root-level `FILTERTUBE_*.md` audit artifacts. |
| `docs/audit/` | Owns the current FilterTube audit markdown corpus. |
| `tests/runtime/audit-doc-layout-current-behavior.test.mjs` | Scans the workspace text surface for stale audit references that skip `docs/audit`. |
| Core docs | May link to `docs/audit/...` artifacts, but do not become the destination for new audit slices. |
| Legacy reference docs | `docs/json_paths_encyclopedia.md` and `docs/youtube_renderer_inventory.md` remain reference inputs, not the destination for new audit addenda. |

## Current Decision

```text
create new FilterTube audit markdown under docs/audit: GO
create new root-level FilterTube audit markdown under docs root: NO-GO
rewrite core product docs for audit bookkeeping: NO-GO
move legacy reference docs during audit-only slice: NO-GO
keep runtime tests under tests/runtime: GO
continue proof-backed audit: GO
```

## Why This Matters

The audit is large enough that location drift becomes code-burden in its own
right. If audit slices are spread through core product docs, it becomes harder
to separate product guidance from current-behavior proof, harder to review
audit-only changes, and easier to mistake a current-behavior finding for
runtime authority.

This boundary does not claim the audit is complete. It only proves the current
placement rule for new audit artifacts.

## Verification

Current proof command:

```bash
node --test tests/runtime/audit-doc-layout-current-behavior.test.mjs --test-reporter=spec
```

The proof keeps the audit corpus grouped under `docs/audit`, rejects stale
root-level FilterTube audit references, and leaves runtime/product behavior
unchanged.
