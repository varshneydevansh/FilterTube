# FilterTube Main Next Reload Modern Comments Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged.
This is not an implementation patch, comment behavior patch, endpoint patch,
renderer-rule patch, no-work optimization, or watch/autoplay patch.

## Purpose

This slice narrows one raw-capture obligation for `YT_MAIN_NEXT.json`. Despite
the filename, the capture is not a watch rail, playlist, autoplay, or end-screen
payload. It is a direct JSON `/youtubei/v1/next` comment reload response with
two `reloadContinuationItemsCommand` roots:

- header slot: one `commentsHeaderRenderer`
- body slot: modern `commentThreadRenderer` rows wrapping nested
  `commentViewModel` objects, plus a `continuationItemRenderer`

That classification matters because treating this file as generic watch-next
evidence would not prove any autoplay, compact-autoplay, right-rail, playlist,
or player end-screen behavior.

## Source Proof

| Raw capture | Shape | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | --- |
| `YT_MAIN_NEXT.json` | direct JSON response | 53976 | 4218389 | `8efea8f6fb83ad38847b12e05b07b04a00a4d8bd39e9046b562eb5522701f7bc` |

Raw token and parsed-key counts:

```text
reloadContinuationItemsCommand raw tokens: 2
reloadContinuationItemsCommand parsed keys: 2
appendContinuationItemsAction raw tokens: 0
appendContinuationItemsAction parsed keys: 0
commentThreadRenderer raw tokens: 21
commentThreadRenderer parsed keys: 20
commentViewModel raw tokens: 41
commentViewModel parsed keys: 40
commentRenderer raw tokens: 0
commentRenderer parsed keys: 0
commentsHeaderRenderer raw tokens: 2
commentsHeaderRenderer parsed keys: 1
continuationItemRenderer raw tokens: 20
continuationItemRenderer parsed keys: 19
twoColumnWatchNextResults parsed keys: 0
playlistPanelVideoRenderer parsed keys: 0
endScreenVideoRenderer parsed keys: 0
compactAutoplayRenderer parsed keys: 0
autoplayVideo parsed keys: 0
nextButtonVideo parsed keys: 0
previousButtonVideo parsed keys: 0
```

Reduced fixture:

```text
tests/runtime/fixtures/captures/main-next-reload-modern-comments.json
```

It preserves the header slot, two body `commentThreadRenderer` rows with modern
nested comment ids `UgzDXgm-fr-N5JK99f14AaABAg` and
`UgyyyK520KB5LXsiteR4AaABAg`, and one body continuation item.

## Current Behavior Matrix

| Mode | Current behavior | Risk |
| --- | --- | --- |
| No rules | Header, two modern comment threads, and continuation item pass through unchanged. | No-rule behavior is not watch/autoplay proof. |
| `hideAllComments:true` through the JSON engine | Both top-level `commentThreadRenderer` items are removed, while `commentsHeaderRenderer` and `continuationItemRenderer` remain. | The body is cleaned differently from fetch's append shortcut synthetic-end behavior. |
| Comments-only keyword matching only modern ViewModel payload | The reduced modern comment rows remain because no direct `commentViewModel` text rule exists. | Modern comment payload text can leak unless a future ViewModel policy exists. |
| Global keyword matching only modern ViewModel payload | The reduced modern comment rows remain for the same no-rule reason. | Global keyword behavior differs by classic versus modern comment shape. |
| Watch/autoplay classification | The raw capture has no `twoColumnWatchNextResults`, playlist-panel, end-screen, compact-autoplay, autoplay, next-button, or previous-button parsed keys. | Watch/player fixes cannot cite this file as direct watch-next proof. |

## Risks Identified

- Reliability: a filename-level watch/next assumption can point future fixes at
  the wrong endpoint family.
- False-hide/leak: classic comment containers and modern ViewModel payloads have
  different direct-rule coverage, so visible results depend on wrapper shape.
- Performance: comment reload responses still enter JSON processing even when
  the actionable modern text/author payload is not represented by current
  direct rules.
- Code burden: seed fetch shortcuts, XHR generic processing, JSON renderer
  rules, DOM comment selectors, and raw-capture ledgers each classify comment
  shapes separately.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
mainNextReloadModernCommentsContract
mainNextReloadModernCommentsClassificationReport
mainNextReloadModernCommentsDecisionReport
mainNextReloadModernCommentsContinuationPolicy
mainNextReloadModernCommentsKeywordPolicy
mainNextReloadModernCommentsHeaderPolicy
mainNextReloadModernCommentsSyntheticEndParityReport
mainNextReloadModernCommentsFixtureProvenance
mainNextReloadModernCommentsMetricArtifact
mainNextReloadModernCommentsJsonFirstGate
```

## Verification

Current proof command:

```bash
node --test tests/runtime/main-next-reload-modern-comments-current-behavior.test.mjs --test-reporter=spec
```

This slice is not a completion claim. It moves `YT_MAIN_NEXT.json` from
unextracted watch-next-looking evidence to a committed comments-reload proof
slice, while leaving watch end-screen DOM wall, compact autoplay, direct
watch-card renderers, playlist-panel header policy, and player metadata-only
proof open.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this comment/continuation surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
