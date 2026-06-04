# FilterTube DOMs.html Mutated Main DOM Classification - 2026-05-23

Status: audit-only proof. Runtime behavior is unchanged. This is not an implementation patch.

This slice classifies `DOMs.html` before using it as capture proof. The raw file
is present locally and useful, but it is not the clean post/community DOM source
implied by the older obligation row. It is not a clean post/community DOM
fixture.

## Evidence

```text
raw capture: DOMs.html
raw sha256: 1e36cfc6bdf9272f1febe54445646ea26c482d4346114727a363cee8cf042c5e
raw line count: 6759
reduced fixture: tests/runtime/fixtures/captures/main-doms-mutated-main-dom.html
fixture kind: html
releaseInputAllowed: false
runtime DOMs.html classification fixtures: 5
```

## Current Classification

`DOMs.html` is a mixed Main YouTube DOM snapshot that already contains
FilterTube mutation markers. It includes home, search, watch right-rail,
playlist, Shorts, Mix/radio, collaboration, and quick-block/fallback-menu
markup.

Pinned raw headings include:

```text
MIX CARD DOM HOME PAGE
NORMAL VIDEO DOM HOME PAGE -
COLLAB VIDEO DOM HOME PAGE
PLAYLIST DOM SEARCH PAGE
NORMAL VIDEO DOM SERACH PAGE
SEARCH PAGE COLLAB VIDEO DOM
VIDEO IN MIX PLAYER WATCH PAGE
LIVE VIDEO IN RIGHT RAIL WATCH PAGE
PLAYLIST DOM ON WATHC PAGE RIGHT RAIL
MIX CARD ON WATCH PAGE RIGHT RAIL
SHORT VIDEO RIGHT RAIL WATCH PAGE
```

Pinned FilterTube mutation markers include:

```text
filtertube-quick-block-host
filtertube-quick-block-anchor
filtertube-quick-block-wrap
filtertube-quick-block-btn
filtertube-playlist-menu-fallback-btn
data-filtertube-processed
data-filtertube-last-processed-mode
data-filtertube-video-id
data-filtertube-channel-id
data-filtertube-collaborators
```

Pinned post/community absence checks:

```text
no <ytd-post-renderer>
no <ytm-backstage-post-thread-renderer>
no <ytm-backstage-post-renderer>
no <yt-post-header>
no ytPostHeaderHostActionMenu
no /post/ permalink
no postRenderer JSON token
no sharedPostRenderer JSON token
```

## Current Proof

| Fixture | Current result | Risk |
| --- | --- | --- |
| `doms_html_raw_shape_is_mixed_main_dom_already_mutated_by_filtertube` | The raw file has home/search/watch/playlist headings and existing FilterTube quick-block, fallback-menu, processed, channel, video, and collaborator markers. | Using this raw file as a no-rule or pre-insertion DOM source would overstate what it proves. |
| `doms_html_raw_shape_is_not_clean_post_or_community_capture` | The raw file lacks the post/backstage/header/action-menu/permalink tokens needed for Main post/community insertion proof. | The post insertion boundary remains incomplete even with this file present. |
| `doms_html_reduced_fixture_pins_mutated_main_surfaces` | The committed reduced fixture keeps one home Mix fallback-menu card, one home video native-menu card, one search collaboration video card, and one watch right-rail playlist lockup. | This supports broad selector and already-mutated DOM risk proof, not post authority. |
| `doms_html_updates_raw_capture_obligation_without_closing_post_gap` | The raw-capture obligation should treat `DOMs.html` as partial mixed-Main DOM extraction while keeping post/community proof blocked. | Optimization work could otherwise cite `DOMs.html` and accidentally skip the real post fixture requirement. |
| `doms_html_product_runtime_has_no_capture_classification_authority` | Product runtime has no `domsHtmlCaptureClassification`, `rawDomMutationStateReport`, or `postCommunityFixtureReadinessReport` authority. | The classification is audit evidence only; it does not permit selector or menu behavior changes. |

## Audit Meaning

`DOMs.html` can support a risk statement about broad DOM selectors, already
inserted quick-block controls, fallback playlist menu insertion, collaboration
identity markers, and watch right-rail lockup coverage.

It cannot support a claim that Main post/community native action-menu insertion
is proven. The only committed post-like DOM fixture still comes from
`YTM-DOM.html` as `ytm-dom-post-card-with-menu.html`, and that does not replace
a Main post/community fixture.

## Still Required

Before changing post menu insertion, post JSON filtering, quick-block post
behavior, whitelist post preservation, or post sibling visibility, add a real
Main post/community fixture with:

```text
rawSourceCapture
minimalFixturePath
route
surface
post renderer or DOM selector
author channel id or handle
native action menu selector
FilterTube insertion boundary
settings mode
expected decision
side effects
negative sibling visible fixture
```

## Runtime Authority Status

No runtime symbol exists yet for:

- `domsHtmlCaptureClassification`
- `rawDomMutationStateReport`
- `postCommunityFixtureReadinessReport`
- `mainPostMenuInsertionFixture`
- `mainPostSiblingVisibilityFixture`
- `mainDomMutatedCapturePolicy`

This document is a classification and traceability boundary only. It does not
permit DOM selector changes, menu insertion changes, JSON renderer expansion,
whitelist behavior changes, or post/community behavior changes.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.
