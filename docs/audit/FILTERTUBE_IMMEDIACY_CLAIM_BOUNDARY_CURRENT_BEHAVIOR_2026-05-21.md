# FilterTube Immediacy Claim Boundary - Current Behavior - 2026-05-21

Status: audit-only proof. This is not an implementation patch.

Runtime behavior is unchanged.

This slice separates valid local immediacy from unsafe global claims. FilterTube
can make some user-facing actions feel fast, but "instant", "zero delay",
"before render", and "nothing escapes" are not safe as global behavior claims.
They require route, mode, identity, side-effect, no-work, and restore proof for
the exact feature being changed.

## Correct Framing

| Claim class | Safe wording | Unsafe wording |
| --- | --- | --- |
| User action feedback | A clicked quick-block or menu target may hide optimistically after a user action when rollback and persistence result are tracked. | Every matching item disappears instantly everywhere. |
| JSON/player identity | JSON/player/page-global payloads are preferred when they expose stable channel or video fields. | XHR JSON always proves identity before the DOM renders. |
| Learned maps | Learned maps can bridge a `videoId` to a channel after a prior JSON/player/DOM/resolver source proves it. | A `videoId` by itself means channel identity is known. |
| DOM fallback | DOM fallback can be a visible-card safety net when selectors and identity confidence are proven for that route. | DOM fallback always succeeds and cannot false-hide. |
| Playlist/Shorts fanout | After a successful user block, visible Shorts and playlist rows may be enriched and hidden if the same blocked channel is proven. | Post-action fanout is exact-target only, zero cost, or guaranteed complete. |
| Empty/no-rule states | Empty blocklist should become a no-work path after future authority proves zero parse, scan, fetch, hide, and write work. | Installing FilterTube with no rules is already guaranteed zero-work. |

## Valid Narrow Immediate Effects Today

These are current-behavior effects, not blanket guarantees:

- Quick block has an optimistic hide path for the clicked card.
- The 3-dot block flow can optimistically hide the clicked video/card/comment
  target and restore it on failed persistence in some paths.
- Same-video and same-channel visible rows can be enriched after a successful
  block when a stable channel id is already known or can be resolved.
- JSON renderer removal can happen before paint only for renderer shapes and
  rule predicates already covered by the current source.

Every item above still needs a feature-specific authority before being expanded
or used to delete slower fallbacks.

## Unsafe Historical Claims

The following reference-doc phrases are unsafe as implementation authority:

```text
Instant playlist identity
nothing escapes during race conditions
hide any stray playlist rows instantaneously
nothing selectable remains
Zero-Flash guarantees for Shorts even when metadata is missing
Zero-delay enforcement
XHR JSON always has enough identity before DOM render
Network fetch is gone because proactive identity exists
```

They may describe an old intent or a narrow happy path, but not the complete
current runtime. Watch, Shorts, playlist, Kids, YTM, collaborator, post, and
weak menu surfaces can still need learned maps, DOM extraction, player payloads,
or scoped background resolvers.

## Why This Matters For The Current Lag And False-Hide Audit

An overbroad immediacy claim can create two classes of bug:

```text
Performance bug:
  "must be instant"
      -> install observers / scan DOM / parse JSON / fetch identities early
      -> work still happens when no active rule can use it
      -> empty install or blocklist-with-no-rules can feel slow

Reliability bug:
  "must hide before proof"
      -> use display-only text, stale maps, or video-id-only joins
      -> hide a card before channel identity is proven
      -> search/watch/playlist siblings can disappear incorrectly
```

That maps directly to the user-reported symptoms: YouTube Main can feel slower
even with no rules, and nonmatching search results can be hidden if a fallback
path treats incomplete identity as enough proof.

## Required Proof Before Any Future "Immediate" Optimization

Any future patch that claims faster or immediate behavior must show:

1. route and surface,
2. Main/Kids/YTM/profile/list-mode state,
3. active-rule state, including empty blocklist and empty whitelist behavior,
4. identity source tier and confidence,
5. whether the target is exact, sibling fanout, selected playlist row, or player
   surface,
6. allowed side effects: parse, mutate JSON, scan DOM, hide, restore, fetch,
   write map, count stats, click/pause, or persist settings,
7. no-work budget when no active rule can use the data,
8. positive fixture for the intended hide/allow,
9. negative sibling-visible fixture for nonmatching content,
10. restore/teardown proof for every DOM write, observer, timer, and listener.

## Implementation Boundary

The audit has not found a shared runtime authority for these claims. Current
source uses local paths and local guardrails instead.

Missing future authority symbols:

- `immediacyClaimAuthority`
- `immediateHideDecision`
- `noEscapeBehaviorAuthority`
- `exactTargetFanoutDecision`
- `noRuleImmediateWorkBudget`
- `optimisticHideTransactionAuthority`

Until those exist, "fast" and "immediate" must be scoped to the exact code path
and proof artifact. They cannot justify broad DOM scans, eager resolver work,
fallback deletion, or public release claims.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this static/generated/asset package and
immediacy-claim surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, asset optimization, generated-output
cleanup, package pruning, CSS activation/deletion, immediacy claims, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
