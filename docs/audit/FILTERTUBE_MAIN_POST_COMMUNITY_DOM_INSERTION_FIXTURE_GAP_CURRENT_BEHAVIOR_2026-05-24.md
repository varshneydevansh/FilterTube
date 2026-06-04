# FilterTube Main Post Community DOM Insertion Fixture Gap Current Behavior - 2026-05-24

Status: audit-only current-behavior fixture-gap slice. Runtime behavior is unchanged.
This is not an implementation patch.

This slice separates post/community DOM source support from clean Main fixture
proof. Current source can recognize post renderers in native dropdown targeting
and has special DOM extraction logic for post author links, but the committed
fixture corpus still lacks a clean Main post/community action-menu fixture. The
available post DOM fixture is from `YTM-DOM.html`, while the available Main DOM
fixture from `DOMs.html` is already FilterTube-mutated and explicitly lacks post
header/action-menu/permalink evidence.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Source Evidence

| Evidence | Current value |
| --- | --- |
| Native menu target source | `js/content/block_channel.js` includes `ytd-post-renderer`, `ytm-post-renderer`, `ytm-backstage-post-renderer`, and `ytm-backstage-post-thread-renderer` in clicked-menu card targeting |
| Post author extraction source | `js/content_bridge.js` has a special post-card branch that reads `yt-post-header` author links and author thumbnails |
| Fallback scan gap | The content-bridge fallback 3-dot scan covers playlist/comment/mobile card surfaces but omits post renderers |
| YTM post DOM fixture | `tests/runtime/fixtures/captures/ytm-dom-post-card-with-menu.html` proves one mobile backstage post header/action-menu shape with no FilterTube menu item inserted |
| Main mutated DOM fixture | `tests/runtime/fixtures/captures/main-doms-mutated-main-dom.html` proves `DOMs.html` is already mutated and not a clean post/community fixture |
| Modern Main post JSON fixture | `tests/runtime/fixtures/captures/main-watchpage-embedded-post-renderer.json` proves embedded `postRenderer` JSON pass-through, not Main DOM insertion behavior |
| Missing historical source | `post_opt1_logs.txt` is still absent locally and remains the only missing ignored capture path |

## Current Boundary Matrix

| Surface | Current proof | Risk pinned |
| --- | --- | --- |
| Native clicked-menu target source | Post renderer selectors are present in source. | Source support is not proof of clean Main DOM insertion behavior. |
| Fallback 3-dot scan | Post renderers are omitted from fallback scan source. | Native and fallback insertion paths can diverge. |
| YTM post DOM | A mobile backstage post exposes author handle, `/post/...`, and native action menu. | Cross-surface YTM DOM does not replace Main desktop/community proof. |
| Main DOMs fixture | Mixed Main DOM capture carries FilterTube mutation markers but no post/header/action-menu/permalink tokens. | Already-mutated Main DOM cannot prove no-rule or insertion behavior for clean posts. |
| Main post JSON | Embedded modern `postRenderer` rows preserve under current JSON rules and queue map side effects. | JSON post pass-through is not DOM menu insertion proof. |
| Missing source | `post_opt1_logs.txt` is absent. | Historical post insertion evidence cannot be cited as current local proof. |

## Optimization Implication

Do not treat post/community menu insertion as proven merely because source has
post selectors or because YTM post DOM exists. A future implementation still
needs a clean Main post/community DOM fixture with native action menu, author
identity, no existing FilterTube menu item, blocklist and whitelist mode
behavior, fallback/native path parity, and a nonmatching sibling-visible proof.

## Future Authority Tokens

These names are documentation-only anchors for the audit backlog and remain
absent from product runtime source in this slice:

```text
mainPostCommunityDomInsertionFixtureContract
mainPostCommunityMenuInsertionDecisionReport
mainPostCommunityNativeFallbackParityReport
mainPostCommunityFallbackScanPolicy
mainPostCommunityAuthorIdentityPolicy
mainPostCommunityWhitelistNoWorkBudget
mainPostCommunitySiblingVisibilityFixture
mainPostCommunityDomInsertionJsonFirstGate
```
