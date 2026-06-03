# FilterTube Compact Autoplay Raw Corpus Census Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, renderer patch, JSON-first patch, endpoint
policy patch, or player/autoplay behavior patch.

This slice answers a narrow but important JSON-first question: does the current
ignored raw evidence corpus contain a real `compactAutoplayRenderer` JSON or
HTML capture that can be reduced into an executable fixture today?

Short verdict: no. The current ignored raw corpus has `compactAutoplayRenderer`
mentions only in historical text notes, not in any raw JSON or HTML capture.
Therefore `compactAutoplayRenderer` remains a real coverage gap, but there is
no actionable corpus-backed renderer fixture to implement against yet.

The paired verifier is
`tests/runtime/compact-autoplay-raw-corpus-census-current-behavior.test.mjs`.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Corpus Counts

```text
ignored evidence entries: 46
unique ignored evidence paths: 45
present ignored evidence entries: 45
unique present ignored evidence paths: 44
compactAutoplayRenderer total mentions in unique present ignored evidence: 4
compactAutoplayRenderer mentions in raw JSON/HTML captures: 0
committed compact autoplay fixtures: 0
```

## Mention Locations

| File | Lines | Bytes | SHA-256 | Mentions | Classification |
| --- | ---: | ---: | --- | ---: | --- |
| `text.txt` | 13827 | 725556 | `76c8ad940344c4a41608f031debabab826594e4ed07686d5361b4c19939522c3` | 2 | Historical scratch/planning text, not renderer payload proof. |
| `reset37.txt` | 20039 | 1579753 | `402576754fc18c116e8d6c770b84462617bf5dae4a0eea2f217cf30b8578fb1e` | 2 | Historical scratch/planning text, not renderer payload proof. |

The two files repeat planning/inventory language such as adding support for
`compactAutoplayRenderer`. They do not provide a parseable renderer object,
route context, sibling set, settings mode, expected decision, or side-effect
boundary.

## Watch Corpus Zero Coverage

The current Main watch/next raw sources used by this audit have zero literal
`compactAutoplayRenderer` tokens:

```text
YT_MAIN_WATCH.html: 0
YT_MAIN.json: 0
YT_MAIN_NEXT.json: 0
YT_MAIN_UPNEXT_FEED_WATCHPAGE.json: 0
YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json: 0
YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json: 0
get_watch?prettyPrint=false.json: 0
watchpage.json: 0
extracted_watch_paths.txt: 0
```

This is consistent with the newer watch/autoplay fixtures: they prove endpoint
objects such as `autoplayVideo`, `nextButtonVideo`, and `previousButtonVideo`,
not a literal compact autoplay renderer.

## Current Runtime Boundary

`compactAutoplayRenderer` remains unsupported in product runtime source today:

- no direct `FILTER_RULES` entry
- no nested unwrap key
- no content/category renderer allowlist entry
- no committed reduced capture fixture
- no compact autoplay authority or JSON-first gate

This means synthetic current-behavior tests can still prove pass-through for a
compact autoplay-shaped object, but synthetic payloads are not enough to add
support safely. A real capture is still required.

## Non-Completion Boundary

Before changing compact autoplay behavior, the audit still needs a real Main
watch/next compact autoplay capture with:

- raw source provenance
- minimal committed fixture
- route/surface classification
- blocklist keyword and channel decisions
- whitelist match and fail-closed decisions
- disabled/no-work and empty/no-rule budgets
- nonmatching sibling-visible proof
- no playback, prefetch, click, navigation, or player-state side effect proof

The following future authority symbols remain absent from product runtime
source today:

```text
compactAutoplayRawCorpusCensusContract
compactAutoplayRawCorpusDecisionReport
compactAutoplayFixtureAcquisitionGate
compactAutoplayHistoricalTextBoundary
compactAutoplayJsonHtmlCaptureGate
compactAutoplayJsonFirstAuthorityGate
compactAutoplayNoPlaybackSideEffectReport
```
