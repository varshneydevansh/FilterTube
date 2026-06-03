# FilterTube Root Evidence / Source Taxonomy - 2026-05-20

Status: audit-only proof. Runtime behavior is unchanged.

The repository root intentionally contains both tracked package/source files and
ignored YouTube-derived evidence files. A broad search such as:

```text
find . -maxdepth 1 -name "*.json" -o -name "*.html" -o -name "*.txt"
```

is not a source boundary. It mixes current product source with local raw
evidence.

## Current Root File Taxonomy

```text
43 root JSON/HTML/TXT-like files are present locally
37 are ignored raw evidence files
6 are tracked source/package files
```

The six tracked root JSON source/package files are:

```text
manifest.chrome.json
manifest.firefox.json
manifest.json
manifest.opera.json
package-lock.json
package.json
```

These tracked files are release/build authority surfaces, not YouTube capture
evidence.

## Relationship To Existing Capture Counts

The existing capture documents count different things on purpose:

| Artifact | Count model | Meaning |
| --- | --- | --- |
| `.gitignore` capture block | 47 entries, 46 unique paths, 45 present locally | Raw capture/planning/evidence line inventory, including duplicate `playlist.json` and missing historical `post_opt1_logs.txt`. |
| Ignored root evidence corpus | 46 ignored evidence entries, 45 unique paths, 45 present locally | Filtered evidence corpus used by audit docs/tests; excludes the missing historical log from the current local-present corpus count. |
| Root JSON/HTML/TXT-like filesystem scan | 43 present root files | Mixed local filesystem view: ignored evidence plus tracked manifests/package metadata. |
| Tracked root JSON source/package files | 6 files | Active release/build/package source, not raw YouTube evidence. |
| Reduced committed fixtures | 44 files under `tests/runtime/fixtures/captures/` | Small executable fragments extracted from raw captures. |

These counts should not be collapsed into one number.

## Current Boundary Rule

```text
tracked root manifest/package JSON
        -> source and release/build authority

ignored root YouTube HTML/JSON/TXT/JS/MD
        -> local audit evidence only
        -> may be distilled into reduced committed fixtures

docs/json_paths_encyclopedia.md + docs/youtube_renderer_inventory.md
        -> discovery maps
        -> not automatic runtime coverage

tests/runtime/fixtures/captures/*
        -> committed executable proof fragments
```

## Why This Matters

Future audit, packaging, and release scripts must not classify every root JSON
file the same way:

- `manifest.chrome.json` is package source.
- `package.json` is version/script/dependency source.
- `YT_MAIN_NEXT.json` is ignored local evidence.
- `YTM-DOM.html` is ignored local evidence.
- `tests/runtime/fixtures/captures/*.json` are reduced proof fragments.

Confusing these categories can create two opposite risks:

1. treating raw local captures as release/runtime source, or
2. treating tracked manifests/package files as disposable evidence.

## Required Future Gate

Before adding capture-mining, release-packaging, fixture-generation, or
repository cleanup scripts, add a `rootEvidenceSourceTaxonomy` or equivalent
report that records:

```text
path
category: tracked-source | ignored-evidence | reduced-fixture | generated-output
trackedByGit
ignoredByGit
presentLocally
releaseInput
runtimeInput
fixtureInput
allowedConsumers
```

Any future script that reads root `*.json`, `*.html`, or `*.txt` must prove it
filters by this taxonomy instead of by extension alone.

## Executable Proof

Current behavior is pinned by:

```bash
node --test tests/runtime/root-evidence-source-taxonomy-current-behavior.test.mjs
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this root evidence source taxonomy can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, evidence taxonomy automation, cleanup
scripts, release packaging, or selector/renderer authority changes.
