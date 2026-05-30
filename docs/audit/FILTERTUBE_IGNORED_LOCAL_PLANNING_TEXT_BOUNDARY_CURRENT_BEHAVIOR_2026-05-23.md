# FilterTube Ignored Local Planning Text Boundary Current Behavior - 2026-05-23

Status: current-behavior proof only. This is not an implementation patch,
optimization patch, fixture extraction patch, release packaging patch, public
documentation patch, or whitelist behavior patch.

Runtime filtering, JSON mutation, DOM mutation, storage, message, lifecycle,
build, packaging, website, and native sync behavior are unchanged.

## Why This Slice Exists

The current workspace contains ignored local planning and capture-text artifacts
near the repository root and under `docs/`. Some are large, whitelist-shaped, or
JSON-adjacent enough to confuse codebase inspection. This slice pins their
current boundary: they are local ignored evidence/planning inputs, not active
release source, not browser package inputs, not public product docs, and not a
valid basis for current first-class JSON filtering or whitelist optimization
without reduced, reviewed fixtures.

## Local Evidence Files

| Path | Family | Local status | Lines | Bytes | SHA-256 |
| --- | --- | --- | ---: | ---: | --- |
| `docs/MOBILE_APP_UI_SPEC.md` | ignored local planning doc | ignored local evidence | 348 | 13660 | `013f7dcd12a0c005d4e7ff8477437f2faa18112adb8c3be5cb8218a029c552e8` |
| `docs/spa-collab-watchlist-handoff.md` | ignored local handoff doc | ignored local evidence | 86 | 4832 | `8629963b76e9d49fbdba5be531f0a78adc9e698dd527dca8e4f4b11825c96bb4` |
| `docs/subscribed-channels-whitelist-import-plan.md` | ignored local whitelist import plan | ignored local evidence | 457 | 22353 | `4989f77746272949ad6506d135d3f15a0d1fc754e9f41983cebb7b45ffc4f173` |
| `cher.md` | ignored root planning note | ignored local evidence | 67 | 5081 | `b319e0bdcfe59c0671a88f8285e31c501b500512ef96a0b4a0ddc42ba0d8033c` |
| `import_channels.txt` | ignored root channel list text | ignored local evidence | 8043 | 120066 | `ef88b54af41208c941a6871486d6c90a750dd9dc19b753e318ab96e3298484d9` |
| `extracted_watch_paths.txt` | ignored root watch-path extraction text | ignored local evidence | 677 | 191278 | `be92bbf6041b99088c9057ef77b1a190e30e2cec5ddb59dea4f127d5c8258613` |
| `YTM-LOGS.txt` | ignored root YouTube Music log text | ignored local evidence | 8322 | 500222 | `6b7a29766c22cc167301fd63c2732e91bfebec2fc5fd19647960c432d0e7ac09` |

`git status --short --ignored` currently reports all seven paths as ignored.
`git check-ignore -v` maps the paths to `.gitignore:48`, `.gitignore:76`,
`.gitignore:78`, `.gitignore:47`, `.gitignore:71`, `.gitignore:74`, and
`.gitignore:66` respectively.

## Selected Evidence Density

| Token family | Mobile spec | SPA handoff | Import plan | `cher.md` | Channel list | Watch paths | YTM logs |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `{` | 0 | 2 | 1 | 2 | 0 | 0 | 1810 |
| `[` | 0 | 5 | 0 | 44 | 0 | 1664 | 613 |
| `ytInitialData` | 0 | 1 | 0 | 0 | 0 | 0 | 33 |
| `videoRenderer` | 0 | 0 | 0 | 0 | 0 | 0 | 6 |
| `channelId` | 0 | 0 | 2 | 0 | 0 | 12 | 19 |
| `MutationObserver` | 0 | 0 | 0 | 0 | 0 | 0 | 5 |
| `addEventListener` | 0 | 0 | 0 | 0 | 0 | 0 | 24 |
| `setTimeout` | 0 | 0 | 0 | 0 | 0 | 0 | 21 |
| `querySelector` | 0 | 0 | 0 | 0 | 0 | 0 | 184 |
| `youtubei` | 0 | 0 | 2 | 0 | 0 | 26 | 42 |
| `whitelist` | 3 | 0 | 37 | 0 | 2 | 0 | 26 |
| `JSON` | 0 | 2 | 0 | 0 | 0 | 0 | 22 |
| `json` | 1 | 0 | 8 | 0 | 0 | 0 | 26 |

The density is useful for provenance triage only. It does not prove current
runtime behavior, and it does not make these files packageable release inputs.

## Release Exclusion Evidence

Current active release/source surfaces contain zero exact references to these
ignored path names:

```text
manifest.json: 0
manifest.chrome.json: 0
manifest.firefox.json: 0
manifest.opera.json: 0
build.js: 0
package.json: 0
README.md: 0
js/: 0
html/: 0
scripts/: 0
website/: 0
css/: 0
data/: 0
assets/: 0
```

`build.js` currently copies common directories `js`, `css`, `html`, `icons`,
`data`, and `assets`, plus common files `README.md`, `CHANGELOG.md`, and
`LICENSE`. The ignored planning/text paths above are not in that common package
surface. The current `dist` tree also has no copies named after these seven
artifacts.

## Current Findings

| Boundary | Current behavior | Risk before optimization | Proof still missing |
| --- | --- | --- | --- |
| Local status | All seven artifacts are ignored local evidence/planning text. | Manual audit can accidentally treat scratch evidence as product docs or runtime proof. | Explicit fixture extraction decision for any reused claim. |
| JSON filtering relevance | Some files contain JSON-adjacent text, paths, logs, and whitelist terms. | Optimizing from raw text can encode stale assumptions into active JSON filtering. | Reduced fixture with current source-owner mapping and expected mutation behavior. |
| Release packaging | Active manifests, package metadata, build script, README, product source, and current `dist` output do not package or reference the paths. | A packaging cleanup or docs pass could accidentally promote ignored local files. | Release-exclusion report if any artifact is proposed for tracking. |
| Runtime lifecycle density | `YTM-LOGS.txt` contains observer, listener, timer, selector, and endpoint tokens. | Treating captured logs as active runtime code would distort listener/timer and selector budgets. | Runtime parity report separating captured text from executing owners. |
| Whitelist optimization scope | `docs/subscribed-channels-whitelist-import-plan.md`, `import_channels.txt`, and `YTM-LOGS.txt` include whitelist-shaped text. | Current whitelist optimization could chase planning/import artifacts instead of active settings, compiler, JSON, and DOM owners. | Optimization input policy and fixture provenance before implementation changes. |

## Non-Completion Boundary

This slice does not make the ignored local planning/text artifacts safe to ship,
delete, migrate, or use as optimization authority. It only proves their current
ignored evidence status and active release exclusion.

Still missing:

- `ignoredLocalPlanningTextBoundaryContract`
- `ignoredLocalPlanningTextReleaseExclusionReport`
- `ignoredLocalPlanningTextExtractionDecision`
- `ignoredLocalPlanningTextFixtureProvenance`
- `ignoredLocalPlanningTextOptimizationInputPolicy`
- `ignoredLocalPlanningTextDocClaimGate`
- `ignoredLocalPlanningTextPackageBoundaryReport`
- `ignoredLocalPlanningTextMetricArtifact`
- `ignoredLocalPlanningTextDeletionReadinessReport`
- `ignoredLocalPlanningTextCurrentRuntimeParityReport`

## Verification

```bash
node --test tests/runtime/ignored-local-planning-text-boundary-current-behavior.test.mjs
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this ignored local planning text boundary can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, local planning text promotion, whitelist
behavior changes, release packaging, or selector/renderer authority changes.
