# FilterTube P0 Obligation Status Ledger - 2026-05-20

Status: audit-only ledger. This is not an implementation patch.

Runtime behavior is unchanged.

This ledger sits between the readiness gate, the P0 family proof index, and the
per-obligation index. The family proof index shows that every P0 family has at
least one current-behavior slice. The per-obligation index expands the
readiness-gate wall into one row for every named obligation. This ledger records
the more important release rule: none of the 217 named P0 obligations are
future-proof or implementation-ready yet.

## Why This Exists

A current-behavior fixture can prove a gap. It does not prove a fix.

```text
P0 obligation name
        |
        v
current-behavior proof exists for the family
        |
        v
known behavior or known gap is pinned
        |
        v
future behavior still blocked
        |
        v
positive + negative + route + mode + side-effect + restore proof required
```

The implementation gate remains closed until the exact obligation affected by
a future patch has future-behavior proof.

## Status Definitions

| Status | Meaning | Behavior-change permission |
| --- | --- | --- |
| `family-current-proof` | The P0 family has a current-behavior doc/test pair that pins today's behavior or gaps. | No |
| `obligation-current-gap` | A named fixture obligation is known from the readiness gate, but only current behavior or missing proof is established. | No |
| `future-proof-missing` | The named obligation lacks positive and negative future-behavior fixtures plus side-effect/route/mode proof. | No |
| `implementation-ready` | The named obligation has current and future proof for the exact behavior being changed. | Not present today |

Current aggregate:

```text
P0 fixture families: 23
P0 named obligations: 217
families with current-behavior proof: 23
obligations with future-behavior proof: 0
implementation-ready obligations: 0
```

## Family Obligation Status

| P0 family | Named obligations | Current proof state | Future proof state | Implementation state |
| --- | ---: | --- | --- | --- |
| no-work | 4 | family-current-proof | future-proof-missing | blocked |
| endpoint policy | 5 | family-current-proof | future-proof-missing | blocked |
| network/fetch authority | 12 | family-current-proof | future-proof-missing | blocked |
| external navigation/link authority | 10 | family-current-proof | future-proof-missing | blocked |
| release package parity | 10 | family-current-proof | future-proof-missing | blocked |
| native runtime sync authority | 9 | family-current-proof | future-proof-missing | blocked |
| content/category predicates | 10 | family-current-proof | future-proof-missing | blocked |
| keyword match authority | 10 | family-current-proof | future-proof-missing | blocked |
| stats/time-saved authority | 10 | family-current-proof | future-proof-missing | blocked |
| backup/export authority | 12 | family-current-proof | future-proof-missing | blocked |
| profile/viewing-space authority | 10 | family-current-proof | future-proof-missing | blocked |
| watch/player control authority | 12 | family-current-proof | future-proof-missing | blocked |
| capture fixture traceability | 11 | family-current-proof | future-proof-missing | blocked |
| message trust | 14 | family-current-proof | future-proof-missing | blocked |
| lifecycle | 5 | family-current-proof | future-proof-missing | blocked |
| hide/restore authority | 12 | family-current-proof | future-proof-missing | blocked |
| selector authority | 12 | family-current-proof | future-proof-missing | blocked |
| storage/cache key authority | 12 | family-current-proof | future-proof-missing | blocked |
| mutation | 4 | family-current-proof | future-proof-missing | blocked |
| prompt/onboarding | 7 | family-current-proof | future-proof-missing | blocked |
| manifest/permission | 7 | family-current-proof | future-proof-missing | blocked |
| security/PIN lock | 8 | family-current-proof | future-proof-missing | blocked |
| rule mutation authority | 11 | family-current-proof | future-proof-missing | blocked |

## Per-Obligation Rule

Every named fixture in `docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md`
currently has this status:

```text
obligation-current-gap
future-proof-missing
implementation-ready: false
```

For example:

- `empty_blocklist_desktop_home_no_work` is not ready until counters prove zero
  parse, clone, rewrite, scan, menu/quick sweep, observer work, fetch, storage
  write, and side-effect work for the exact route/mode.
- `seed_next_watch_no_rule_pass_through` is not ready until `/next` route
  fixtures prove recommendation payloads pass through in no-rule states while
  active watch/comment rules still mutate only intended fields.
- `keyword_exact_unicode_boundary_matches_json_and_dom` is not ready until JSON
  regex matching and DOM normalized fallback matching agree on positive and
  negative Unicode boundary cases.
- `watch_fullscreen_pauses_non_player_dom_work` is not ready until fullscreen
  fixtures prove non-player observers/scans/timers are paused without breaking
  player controls or route recovery.
- `release_package_parity_github_release_is_draft_until_all_assets_upload` is
  not ready until release automation proves draft-first behavior and upload
  failure rollback, not just current release-risk documentation.

## Future Proof Requirements

A P0 obligation can move out of `future-proof-missing` only when the future
fixture set names:

- the exact feature or method family,
- route/surface and endpoint family,
- settings mode and profile/lock state,
- JSON/DOM/map/fallback source confidence,
- side effects including DOM writes, fetches, storage writes, stats, messages,
  tab opens, media/player actions, observers, listeners, timers, and RAFs,
- positive fixtures for intended hide/show/mutate behavior,
- negative fixtures for non-matching content and false-hide/leak prevention,
- teardown/restore/idempotence proof where lifecycle or visual writers are
  involved,
- release/package/provenance proof for public artifacts and app/native sync.

## Current Runtime Authority Status

No runtime authority exists yet for:

- `p0ObligationStatusAuthority`
- `futureBehaviorProofRegistry`
- `implementationReadyObligation`

This ledger is a proof map for audit planning, not an implementation switch.

## Linked Proof

- Readiness source: `docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md`
- Counted fixture wall: `docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md`
- Family proof index: `docs/audit/FILTERTUBE_P0_FAMILY_PROOF_COVERAGE_2026-05-19.md`
- Obligation index: `docs/audit/FILTERTUBE_P0_OBLIGATION_INDEX_2026-05-20.md`
- Runtime test: `tests/runtime/p0-obligation-status-ledger-current-behavior.test.mjs`
- Runtime index test: `tests/runtime/p0-obligation-index-current-behavior.test.mjs`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this P0 obligation ledger can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
