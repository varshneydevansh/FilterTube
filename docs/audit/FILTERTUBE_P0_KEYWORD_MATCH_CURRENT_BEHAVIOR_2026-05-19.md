# FilterTube P0 Keyword Match Current Behavior - 2026-05-19

Status: current-behavior proof slice. This is not an implementation patch.

This slice converts the P0 keyword match authority family into runnable proof.
It exists because keyword rules are a high-trust user-facing control: a single
word can affect JSON filtering, DOM fallback, comments, channel-derived
`Filter All` rows, Kids-to-Main sync, import migration, and whitelist
fail-closed decisions.

## Verdict

```text
P0 keyword match slice is not green.
Current behavior is proof-pinned.
Runtime behavior remains unchanged.
Implementation gate remains closed.
```

The product has several useful keyword behaviors, but there is no central
`keywordMatchAuthority` report that owns boundary policy, comments scope,
source/action metadata, surface, list mode, JSON/DOM parity, and whitelist
fail-closed reasons.

## Current Authority Shape

```text
keyword row / channel Filter All / import / sync
        |
        +--> shared settings compiler
        |       + exact unicode boundary regex
        |       + substring regex
        |       + comments-only compiled list
        |
        +--> background compiler and persistence
        |       + legacy keyword parsing
        |       + V4 profile compile
        |       + channel-derived keyword merge
        |
        +--> JSON engine
        |       + regex-only matching
        |       + comments fallback to global keywords
        |       + whitelist fail-closed match/miss
        |
        +--> DOM fallback
                + raw regex test
                + normalized regex test
                + plain-keyword includes fallback
                + either-side boundary fallback
```

## P0 Fixture Status

| P0 fixture | Current behavior pinned here | Future green condition |
| --- | --- | --- |
| `keyword_non_exact_substring_policy_is_explicit` | Non-exact keywords compile as substring regexes and can match inside larger words. | UI/runtime report explicitly states substring policy or changes behavior behind fixtures. |
| `keyword_exact_unicode_boundary_matches_json_and_dom` | JSON exact matching honors the compiled Unicode boundary regex; DOM has extra normalized fallback authority. | JSON and DOM share the same boundary model or record a route-specific divergence reason. |
| `keyword_dom_normalized_fallback_requires_both_boundaries` | DOM fallback currently accepts either a left or right boundary after normalized includes matching. | DOM normalized fallback requires the intended boundary policy and is fixture-proven. |
| `keyword_comment_serialized_rules_are_reconstructed` | The engine reconstructs serialized `filterKeywords` and `whitelistKeywords`, but not serialized `filterKeywordsComments`. | Serialized comment keyword lists are reconstructed through the same authority as main keywords. |
| `keyword_global_rules_do_not_affect_comments_unless_enabled` | Comment filtering falls back to global `filterKeywords` when `filterKeywordsComments` is absent or not an array; an empty array is currently explicit. | Global keyword-to-comment behavior is an explicit policy, not a fallback accident. |
| `keyword_channel_derived_metadata_round_trips` | Shared settings preserves channel-derived `source/channelRef/exact`; background persistence can convert source to `filterAll_channel`, exact to false, and drop `channelRef`. | Channel-derived keyword metadata round-trips across shared settings, background, import, and UI. |
| `keyword_channel_derived_comments_policy_round_trips` | Shared settings preserves `filterAllComments`; background persistence writes `comments: false` for channel-derived persisted keywords. | Channel-derived comments policy round-trips without drift. |
| `keyword_kids_to_main_sync_preserves_source_and_action` | Kids-to-Main sync can merge Kids channels into Main channel-derived keyword recomputation when modes match, but no keyword source/action report exists. | Sync reports surface/source/action so Main rows can distinguish user, Main channel, and Kids-derived keyword origins. |
| `keyword_whitelist_keyword_miss_reports_fail_closed_reason` | Whitelist keyword misses are logged as `block:no_whitelist_match` or unresolved identity paths, but no structured keyword miss report exists. | Whitelist miss carries keyword/search fields, identity state, and fail-closed reason. |
| `keyword_import_legacy_compiled_exactness_round_trips` | Legacy compiled patterns can be parsed into exact keyword rows, but import/migration exactness is not represented by one keyword authority report. | Legacy exactness, flags, comments, and source metadata round-trip with fixture proof. |

## Risk Interpretation

The key risk is not that substring matching is always wrong. Some users want
broad substring blocking. The risk is that substring, exact, comments,
channel-derived, sync, DOM normalized fallback, and whitelist miss behavior are
owned by different code paths. A user can therefore see a row that looks simple
while the runtime evaluates it through several different policies.

## Safe Next Proof

Before changing keyword behavior, add fixtures for:

- visible UI copy and runtime report for substring versus exact keywords
- JSON and DOM parity for exact Unicode boundaries
- normalized/accented DOM fallback with both-boundary expectations
- serialized comment keyword reconstruction
- explicit global-keyword-to-comments policy
- channel-derived `Filter All` metadata across shared settings, background,
  import/export, and Nanah
- Kids-to-Main channel-derived keyword provenance
- whitelist keyword misses with structured fail-closed reasons
- legacy compiled keyword import exactness and flags

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this P0 keyword-match surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, keyword semantics changes, exact-match
policy changes, comment keyword changes, or whitelist behavior changes.
