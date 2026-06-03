# FilterTube Keyword Match Authority Audit - 2026-05-18

Status: current-behavior audit. This is not an implementation patch.

This pass isolates keyword matching because keyword rules are one of the most
visible user controls and one of the easiest places to create false hides. A
single user-facing keyword can travel through UI state, shared settings,
background compilation, the JSON engine, DOM fallback, comment filtering,
channel-derived `Filter All` keywords, whitelist matching, and Kids/Main sync.

The main finding is split matcher authority. There is no single
`keywordMatchAuthority` that owns these questions:

- whether a keyword is exact or substring,
- whether it applies to comments,
- whether it came from a user row or a channel-derived `Filter All` rule,
- whether it applies to Main, Kids, or synced Kids-to-Main state,
- whether JSON and DOM fallback should match the same text boundaries.

## Current Keyword Flow

```text
UI keyword row
  |
  +--> StateManager list-mode branch
  |
  +--> settings_shared compileKeywords()
        |
        +--> filterKeywords
        +--> filterKeywordsComments
  |
  +--> background getCompiledSettings()
        |
        +--> legacy compiled keyword migration
        +--> V4 active profile compile
        +--> channel-derived keyword merge/persist
  |
  +--> seed / injector settings relay
  |
  +--> filter_logic.js JSON matching
  |
  +--> dom_fallback.js DOM matching
```

## Exact Versus Substring Matching

Source references:

- `js/settings_shared.js:380-392`
- `js/background.js:1839-1847`
- `js/filter_logic.js:1807-1819`

Shared settings and background both compile exact keywords into a Unicode-aware
boundary pattern:

```text
(^|[^\p{L}\p{N}_])KEYWORD(?=$|[^\p{L}\p{N}_])
```

Non-exact keywords are compiled as escaped raw substring regexes with `i`
flags. That means a keyword like `bug` currently matches `debugging`. This may
be expected for broad keyword blocking, but it must be explicit because users
often interpret keyword rows as word-ish rules.

The JSON engine does not decide exactness. It only receives RegExp objects and
calls `_regexMatches()`. So exactness is a compile-time/settings authority, not
engine policy.

## DOM Fallback Boundary Drift

Source reference: `js/content/dom_fallback.js:1431-1514`.

DOM fallback has a separate `matchesKeyword()` helper. It first tests the regex
against raw text and normalized text. If those fail, it extracts a plain
keyword and tries a normalized `includes()` fallback.

That fallback returns true when either side of the match has a boundary:

```text
hasLeftBoundary || hasRightBoundary
```

This is broader than exact JSON boundary behavior, which requires both a left
and right boundary through the compiled regex. It can hide content differently
from the JSON engine for normalized or accent-stripped text.

## Comment Keyword Authority

Source references:

- `js/filter_logic.js:996-1023`
- `js/filter_logic.js:2076-2097`
- `js/background.js:1927-1960`
- `js/background.js:2071-2075`
- `js/settings_shared.js:526-527`

Background and shared settings compile a separate `filterKeywordsComments` list
from keywords whose `comments === true`. But the JSON engine reconstructs
serialized `filterKeywords` and `whitelistKeywords`; it does not reconstruct
serialized `filterKeywordsComments` inside `processSettings()`.

Current behavior already has fixtures showing:

- direct `RegExp` comment keyword lists work,
- serialized comment keyword lists can be ignored in direct engine calls,
- global keywords can still remove comments even when the explicit comment list
  is empty.

That means comment keyword behavior depends on how settings reached the engine.

## Channel-Derived Keyword Drift

Source references:

- `js/settings_shared.js:412-481`
- `js/background.js:2282-2285`
- `js/background.js:2330-2397`
- `js/background.js:2453-2471`
- `js/state_manager.js:1553-1570`

Shared settings treats channel-derived `Filter All` keywords as first-class
keyword rows:

- `source: "channel"`,
- `channelRef`,
- `exact: true`,
- `comments` defaults from `filterAllComments`, otherwise true.

Background also creates exact compiled keyword patterns from channel names, but
its Main-profile persistence path converts compiled patterns back into stored
keywords as:

- `source: "filterAll_channel"`,
- `exact: false`,
- `comments: false`.

So the runtime compiled pattern can be exact while the persisted row metadata
can say non-exact and no-comments. This is a schema drift risk and a code-burden
risk, especially before simultaneous allow/block migration.

## Whitelist Keyword Authority

Source reference: `js/filter_logic.js:1986-1999`.

Whitelist keyword matching uses the same `_regexMatches()` helper as blocklist
matching, but it is evaluated inside the fail-closed whitelist decision path.
If no whitelist keyword/channel matches and identity is unresolved, the engine
can block the item as `block:unresolved_identity` or `block:no_whitelist_match`.

That behavior may be correct for strict profiles, but it means keyword matcher
drift affects whitelist even more strongly than blocklist: a missed allow
keyword can hide content that otherwise looks unrelated to the visible filter
rows.

## Why This Matters For The Reported Disease

The symptoms include false hides, confusing whitelist behavior, and YouTube
feeling slower even when a visible list is empty. Keyword authority contributes
to that disease because:

1. substring keywords can match words the user did not intend,
2. DOM fallback can match broader normalized boundaries than JSON exactness,
3. comment keyword behavior differs by settings path,
4. channel-derived keyword rows can change metadata as they move through
   background compile/persist paths,
5. Kids-to-Main sync can merge keyword sources across surfaces,
6. whitelist mode turns keyword misses into fail-closed hides.

## Required Future Contract

Add one implementation-neutral keyword report before changing matcher behavior:

```text
keywordMatchAuthority({
  profileId,
  surface: "main" | "kids" | "ytm",
  route,
  listMode,
  source: "user" | "channel-derived" | "import" | "sync" | "legacy-compiled",
  target: "video" | "short" | "comment" | "post" | "playlist" | "shelf",
  keyword: {
    word,
    exact,
    comments,
    semantic,
    channelRef,
    action: "block" | "allow"
  },
  compiled: {
    pattern,
    flags,
    boundaryModel: "substring" | "unicode-word" | "normalized-dom-fallback"
  },
  match: {
    matched,
    field,
    textSample,
    normalized,
    reason
  }
})
```

JSON and DOM fallback should consume the same report or prove why a route needs
a different boundary policy.

## Proof Gates Before Fixing

Add and flip behavior fixtures only after these current-behavior baselines are
covered:

```text
keyword_non_exact_substring_policy_is_explicit
keyword_exact_unicode_boundary_matches_json_and_dom
keyword_dom_normalized_fallback_requires_both_boundaries
keyword_comment_serialized_rules_are_reconstructed
keyword_global_rules_do_not_affect_comments_unless_enabled
keyword_channel_derived_metadata_round_trips
keyword_channel_derived_comments_policy_round_trips
keyword_kids_to_main_sync_preserves_source_and_action
keyword_whitelist_keyword_miss_reports_fail_closed_reason
keyword_import_legacy_compiled_exactness_round_trips
```

The first safe implementation direction is:

1. make substring versus exact policy explicit in UI and compiled settings,
2. share the compiled boundary model between JSON and DOM fallback,
3. reconstruct `filterKeywordsComments` in the same way as `filterKeywords`,
4. preserve channel-derived metadata through background compile/persist paths,
5. then add behavior changes behind fixtures for each route and list mode.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this keyword-match authority surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, keyword policy changes, comment keyword
reconstruction changes, whitelist behavior changes, or selector/renderer
authority changes.
