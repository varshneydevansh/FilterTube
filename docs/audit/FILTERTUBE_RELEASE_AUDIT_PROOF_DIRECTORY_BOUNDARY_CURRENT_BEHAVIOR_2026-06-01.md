# FilterTube Release Audit Proof Directory Boundary

Date: 2026-06-01
Status: audit-only proof
Runtime behavior is unchanged.

## Boundary

Audit proof belongs under `docs/audit/`.

Core product docs may link to audit evidence or summarize user-facing behavior,
but proof-style files should not be added beside product docs. This keeps the
release documentation readable and prevents audit snapshots, current-behavior
fixtures, boundary registers, and proof matrices from spreading back into the
product documentation tree.

## Current Contract

`tests/runtime/release-audit-proof-directory-boundary-current-behavior.test.mjs`
pins the current boundary:

- tracked proof-style Markdown files must live under `docs/audit/`;
- proof-style Markdown is detected by names that start with `FILTERTUBE_`,
  contain `_CURRENT_BEHAVIOR_`, or contain audit register tokens such as
  `_AUTHORITY_`, `_BOUNDARY_`, `_REGISTER_`, `_LEDGER_`, `_GAP_`,
  `_MATRIX_`, or `_INVENTORY_`;
- non-audit product docs under `docs/` remain allowed as release-facing
  reference material when their filenames do not claim to be proof artifacts;
- `docs/audit/TEST_LANE_MATRIX.md` remains the workflow matrix for change
  classification.

## Lane Ownership

This sentinel is owned by `test:release` and `test:smoke`.

Release ownership is intentional because misplaced proof docs can alter public
release review context and make the extension docs harder to ship cleanly.
Smoke ownership keeps the resumed change-safety goal visible in the small
release confidence lane.

## Future Work

If a future proof family needs a different filename shape, update this boundary,
the sentinel test, and `docs/audit/TEST_LANE_MATRIX.md` in the same logical
change. Do not weaken the rule by silently allowing proof-style docs outside
`docs/audit/`.
