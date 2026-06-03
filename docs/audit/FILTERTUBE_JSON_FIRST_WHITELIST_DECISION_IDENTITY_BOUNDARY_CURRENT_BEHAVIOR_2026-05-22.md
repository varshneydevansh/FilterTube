# FilterTube JSON-First Whitelist Decision Identity Boundary - Current Behavior - 2026-05-22

Status: release-fix evidence register. Runtime behavior changed on 2026-05-31
for the whitelisted channel Shorts page path and the watch autoplay endpoint
leak path. This is not a broad optimization patch, simultaneous allow/block
migration, renderer expansion, settings-mode change, or permission to alter
unrelated JSON filtering.

## Purpose

This register narrows the whitelist-mode part of
`YouTubeDataFilter._shouldBlock()` into direct current-behavior proof. It extends
the broader block-decision/effect proof by pinning how whitelist mode currently
decides JSON renderer visibility from rule presence, channel identity, keyword
matches, creator-page metadata, comments, and unresolved identity.

The current boundary is:

```text
non-comment whitelist mode fail-closes when no whitelist rules exist, permits
container and watch-scaffolding renderers, allows matching channels or matching
whitelist keywords, can fall back to pageChannelMeta on creator routes
including Shorts-like renderer cards, blocks unresolved identity when channel
rules exist, and otherwise blocks no-match items. Comment renderers bypass this
non-comment whitelist branch.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_BLOCK_DECISION_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_CANDIDATE_EXTRACTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_CHANNEL_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_KEYWORD_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md`
- `docs/audit/FILTERTUBE_FEATURE_SOURCE_DEPENDENCY_REGISTER_2026-05-20.md`

## Current Counts

```text
whitelist decision identity boundary source files: 1
filter_logic _shouldBlock block lines: 306
filter_logic _shouldBlock block bytes: 15523
whitelist decision branch lines: 110
whitelist decision branch bytes: 5535
whitelist no-rule block lines: 9
whitelist no-rule block bytes: 327
whitelist channel loop lines: 17
whitelist channel loop bytes: 961
whitelist keyword loop lines: 15
whitelist keyword loop bytes: 687
whitelist unresolved/page fallback lines: 32
whitelist unresolved/page fallback bytes: 1522
whitelist no-match tail lines: 8
whitelist no-match tail bytes: 288
whitelist branch _logWhitelistDecision tokens: 6
whitelist branch allow:matched_channel tokens: 1
whitelist branch allow:matched_keyword tokens: 1
whitelist branch allow:creator_page_whitelisted tokens: 1
whitelist branch block:no_whitelist_rules tokens: 1
whitelist branch block:unresolved_identity tokens: 1
whitelist branch block:no_whitelist_match tokens: 1
whitelist branch WHITELIST_CONTAINER_RENDERERS tokens: 1
whitelist branch videoPrimaryInfoRenderer tokens: 1
whitelist branch videoSecondaryInfoRenderer tokens: 1
whitelist branch hasStableChannelIdentity tokens: 2
whitelist branch hasNameSignal tokens: 2
whitelist branch isShortsLikeRenderer tokens: 2
whitelist branch _matchesAnyChannel tokens: 2
whitelist branch _regexMatches tokens: 1
whitelist branch pageChannelMeta tokens: 3
whitelist branch isCreatorPage tokens: 2
whitelist branch return false tokens: 5
whitelist branch return true tokens: 3
whitelist branch shouldTryCreatorPageFallback tokens: 2
runtime whitelist identity fixtures: 7
runtime behavior changed: yes, for whitelisted creator Shorts pages with hideAllShorts disabled and watch autoplay endpoint leaks
not completion proof for JSON-first whitelist decision authority
```

## Current Decision Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| No whitelist rows | When both channel and keyword whitelist arrays are empty, non-comment JSON renderers return `true` and are removed. | Empty whitelist product decision with route, renderer, profile, and user-facing mode proof. |
| Channel allow | If any collaborator or channel identity matches `whitelistChannels`, the item returns `false`. | Channel allow report with accepted field, confidence, learned-map use, and rejected sibling evidence. |
| Keyword allow | If `whitelistKeywords` exists and the candidate search text matches, the item returns `false`. | Keyword allow report with title/description/metadata source, exactness policy, and no-channel fallback decision. |
| Creator-page fallback | With channel rules but no stable item identity, creator routes can allow through `pageChannelMeta` when it matches the whitelist. Shorts-like renderers also try this fallback so whitelisted channel Shorts tabs do not empty out while `hideAllShorts` is disabled. | Creator-page identity provenance and stale-page metadata decision. |
| Unresolved identity | With channel rules, no stable identity, and no usable creator-page fallback, the item fail-closes as `block:unresolved_identity`. | Pending identity policy with fetch/observer budget, restore proof, and stale-marker cleanup. |
| No match | If none of the channel, keyword, or creator fallback checks allow the item, the branch returns `true` as `block:no_whitelist_match`. | Structured no-match reason with route/surface/list-mode and sibling-visible proof. |
| Comment bypass | `isCommentRenderer` skips the non-comment whitelist branch, so comments are governed by hide-all, comment keywords, and author-channel checks. | Comment whitelist policy deciding whether comments should fail-closed, pass through, or use author identity. |

## Runtime Fixture Summary

The empty whitelist fixture proves a normal `videoRenderer` is removed in
whitelist mode when both whitelist arrays are empty.

The channel allow fixture proves the same renderer remains visible when its
channel identity matches `whitelistChannels`.

The keyword allow/no-match fixture proves an identityless video can be allowed
by a whitelist keyword match and removed when the keyword does not match.

The creator-page fallback fixture proves a creator route still blocks without
`pageChannelMeta`, then allows the same identityless renderer when
`pageChannelMeta` matches the whitelist row.

The whitelisted channel Shorts fixture proves a `shortsLockupViewModel` on a
creator Shorts route still blocks without page identity, remains visible when
`pageChannelMeta` matches the whitelist row and `hideAllShorts` is disabled,
and is removed when `hideAllShorts` is enabled.

The unresolved identity fixture proves channel-rule whitelist mode removes a
non-Shorts video renderer that has no stable channel identity and no name
signal.

The comment bypass fixture proves empty whitelist mode preserves a neutral
`commentRenderer`, while a matching comment keyword still removes it through
the comment branch.

## Risks Identified

- Reliability: whitelist mode has several allow/block exits but no shared
  reason object that later DOM fallback, metrics, native sync, or UI copy can
  cite.
- False-hide/leak: identityless videos fail-close while comments bypass the
  branch, so route and renderer class determine whether missing identity hides
  or leaks.
- Performance: unresolved identity policy is mixed into the decision branch
  without one first-class pending-identity or no-work budget.
- Code burden: creator-page fallback, comment bypass, keyword allow, channel
  allow, empty-rule fail-close, and no-match fail-close all live in one branch
  without a reusable whitelist decision contract.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this whitelist surface can support runtime
optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstWhitelistDecisionContract
jsonFirstWhitelistIdentityDecisionReport
jsonFirstWhitelistEmptyRulePolicy
jsonFirstWhitelistChannelAllowReport
jsonFirstWhitelistKeywordAllowReport
jsonFirstWhitelistCreatorPageFallbackReport
jsonFirstWhitelistUnresolvedIdentityPolicy
jsonFirstWhitelistCommentPolicy
jsonFirstWhitelistNoMatchReason
jsonFirstWhitelistDecisionFixtureProvenance
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-whitelist-decision-identity-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first
filtering gap into current whitelist decision identity behavior and the missing
first-class authority needed before changing whitelist, optimization, or
simultaneous allow/block behavior.

## Whitelist Optimization Readiness Gap Matrix Addendum

Whitelist optimization readiness gap matrix addendum:
`docs/audit/FILTERTUBE_WHITELIST_OPTIMIZATION_READINESS_GAP_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/whitelist-optimization-readiness-gap-matrix-current-behavior.test.mjs`
carry this identity boundary into the broader optimization decision. The
readiness matrix keeps whitelist optimization blocked until empty whitelist,
unresolved identity, comment, pending-hide, selected-row, transition, import,
surface parity, side-effect, and metric evidence exists.
