# FilterTube Shared Post Renderer Source-Only Boundary Current Behavior - 2026-05-24

Status: audit-only current-behavior source and fixture-gap slice. Runtime behavior is unchanged.
This is not an implementation patch.

This slice separates documented `sharedPostRenderer` JSON paths from current
runtime filter authority. The JSON path encyclopedia documents shared-post
sharer identity and nested original-post shapes, but the product runtime has no
direct `FILTER_RULES.sharedPostRenderer` entry and the committed capture fixture
corpus has no real `sharedPostRenderer` row.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Source Evidence

| Evidence | Current value |
| --- | --- |
| Documented shared post path | `docs/json_paths_encyclopedia.md` documents `onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[i].sharedPostRenderer` |
| Documented sharer identity | The same section documents `endpoint.browseEndpoint.browseId` and `displayName.runs[0].text` as sharer fields |
| Documented original post identity | The original content is nested under `originalPost.postRenderer` or `originalPost.backstagePostRenderer` |
| Runtime legacy post coverage | `js/filter_logic.js` covers `backstagePostThreadRenderer` and `backstagePostRenderer` |
| Runtime modern/shared post gap | `js/filter_logic.js` has no direct `postRenderer` or `sharedPostRenderer` rule |
| Fixture corpus | `tests/runtime/fixtures/captures/main-watchpage-embedded-post-renderer.json` proves modern `postRenderer`, while the committed fixture corpus has zero real `sharedPostRenderer` rows |

## Current Synthetic Behavior Matrix

| Mode | Current result | Risk pinned |
| --- | --- | --- |
| No rule | Preserves a synthetic `sharedPostRenderer` row and can harvest both sharer and original channel-map identities. | Map side effects and hide/allow authority are separate effects. |
| Blocklist keyword | Preserves the shared row even when the nested original post text matches a blocked keyword. | Nested original text currently leaks because the direct shared renderer has no rule. |
| Blocklist original channel | Preserves the shared row even when the nested original author matches a blocked channel. | Original-author channel blocking is not direct shared-post authority. |
| Blocklist sharer channel | Preserves the shared row even when the sharer identity matches a blocked channel. | Sharer-author channel blocking is not direct shared-post authority. |
| Whitelist match | Preserves the shared row when sharer/original identity matches a whitelist channel. | Matching allow behavior is indistinguishable from unsupported pass-through without a decision report. |
| Whitelist nonmatch | Preserves the shared row even when no whitelist identity or keyword matches. | Unsupported pass-through can become a whitelist leak. |
| Supported legacy sibling | A `backstagePostRenderer` sibling can still be removed while the synthetic shared post remains visible. | Legacy post support does not prove shared-post support. |

## Optimization Implication

Do not add shared-post filtering by blindly reusing modern post or legacy
backstage paths. A future implementation needs an explicit sharer-versus-original
policy, list-mode behavior for both roles, sibling preservation proof, route
fixtures, DOM/menu interaction proof, and a side-effect budget for map harvest
versus hide/allow decisions.

## Future Authority Tokens

These names are documentation-only anchors for the audit backlog and remain
absent from product runtime source in this slice:

```text
sharedPostRendererRouteFixtureContract
sharedPostRendererDecisionReport
sharedPostRendererSharerOriginalPolicy
sharedPostRendererWhitelistPolicy
sharedPostRendererSiblingFixture
sharedPostRendererDomInsertionFixture
sharedPostRendererNoRuleBudget
sharedPostRendererJsonFirstGate
```
