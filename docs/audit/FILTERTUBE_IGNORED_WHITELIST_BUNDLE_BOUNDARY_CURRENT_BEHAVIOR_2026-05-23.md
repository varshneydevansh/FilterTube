# FilterTube Ignored Whitelist Bundle Boundary Current Behavior - 2026-05-23

Status: current-behavior proof only. This is not an implementation patch,
optimization patch, bundle cleanup patch, whitelist behavior patch, release
source patch, package patch, or fixture extraction patch.

Runtime, build, packaging, native sync, website, and whitelist decision behavior
are unchanged.

## Why This Slice Exists

The current worktree contains ignored root-level whitelist experiment bundles:
`WHITELIST_background.js` and `WHITELIST_content.JS`. They are large enough and
feature-shaped enough to confuse codebase inspection because they contain
storage, runtime-message, timer, observer, selector, tab, download, fetch, video,
and channel terms. This slice pins their current status: local ignored evidence,
not active FilterTube release source, not active browser manifest input, and not
a valid basis for optimizing the current JSON-first whitelist runtime without a
separate reduced fixture.

## Local Evidence Files

| Path | Local status | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | --- |
| `WHITELIST_background.js` | ignored root evidence | 32472 | 1700002 | `addf21588950e9fa73a121b08a4e0385f197abf77817f03345dbe3509111dada` |
| `WHITELIST_content.JS` | ignored root evidence | 9302 | 674344 | `87b3e2aed160342f818539718af3bad32e16d1ae11e54143d26e9ef069b81ef1` |

`git status --short --ignored WHITELIST_background.js WHITELIST_content.JS`
currently reports both paths as ignored. `git check-ignore -v` maps
`WHITELIST_background.js` to `.gitignore:53` and maps `WHITELIST_content.JS` to
the `.gitignore:54` `WHITELIST_content.js` rule in this workspace.

## Selected Token Matrix

| Token family | `WHITELIST_background.js` | `WHITELIST_content.JS` |
| --- | ---: | ---: |
| `chrome.storage.local.get` | 34 | 21 |
| `chrome.storage.local.set` | 24 | 9 |
| `chrome.runtime.sendMessage` | 16 | 29 |
| `chrome.runtime.onMessage.addListener` | 1 | 4 |
| `chrome.downloads` | 9 | 0 |
| `chrome.tabs` | 51 | 3 |
| `MutationObserver` | 0 | 21 |
| `querySelectorAll` | 1 | 39 |
| `querySelector` | 1 | 146 |
| `closest` | 0 | 20 |
| `addEventListener` | 9 | 64 |
| `removeEventListener` | 2 | 7 |
| `setTimeout` | 25 | 81 |
| `clearTimeout` | 13 | 19 |
| `setInterval` | 11 | 15 |
| `clearInterval` | 8 | 22 |
| `fetch(` | 35 | 2 |
| `postMessage` | 3 | 0 |
| `localStorage` | 9 | 0 |
| `sessionStorage` | 0 | 4 |
| `WhitelistVideo` | 588 | 635 |
| `whitelist` | 164 | 111 |
| `video` | 122 | 730 |
| `channel` | 497 | 598 |
| `chrome.scripting` | 1 | 0 |

The token density is evidence of code-burden and provenance risk only. It is not
evidence that these bundles run in the current product.

## Release Exclusion Evidence

Current tracked release/source surfaces contain zero exact references to the
ignored bundle names or the `WhitelistVideo` bundle marker:

```text
manifest.json: WHITELIST_background 0, WHITELIST_content 0, WhitelistVideo 0
manifest.chrome.json: WHITELIST_background 0, WHITELIST_content 0, WhitelistVideo 0
manifest.firefox.json: WHITELIST_background 0, WHITELIST_content 0, WhitelistVideo 0
manifest.opera.json: WHITELIST_background 0, WHITELIST_content 0, WhitelistVideo 0
build.js: WHITELIST_background 0, WHITELIST_content 0, WhitelistVideo 0
package.json: WHITELIST_background 0, WHITELIST_content 0, WhitelistVideo 0
README.md: WHITELIST_background 0, WHITELIST_content 0, WhitelistVideo 0
```

The current `dist` tree also has no local copies named
`WHITELIST_background.js`, `WHITELIST_content.JS`, or `WHITELIST_content.js`.

## Current Findings

| Boundary | Current behavior | Risk before optimization | Proof still missing |
| --- | --- | --- | --- |
| Local evidence status | Both bundle files are ignored root evidence, not tracked release source. | Manual inspection can accidentally treat old whitelist bundle behavior as current runtime behavior. | A reduced fixture/provenance report if any behavior is reused. |
| Active runtime linkage | Active manifests, package metadata, build script, and README do not reference the bundle names or `WhitelistVideo`. | Optimizing current whitelist code from these bundles would mix historical artifact behavior into active JSON-first runtime. | Explicit extraction decision with current source-owner mapping. |
| Lifecycle density | The ignored content bundle contains 21 `MutationObserver`, 64 `addEventListener`, 81 `setTimeout`, and 146 `querySelector` tokens. | If copied back into runtime, it would add high listener/timer/selector burden outside the current audited owners. | Lifecycle budget and teardown proof before any reuse. |
| Storage/message density | The ignored bundles contain storage, runtime messaging, tab, download, postMessage, and fetch terms. | If used as guidance, they can blur trusted sender, profile, and backup boundaries already being audited in active code. | Message/storage owner report before any migration. |
| Whitelist optimization relevance | The active optimization target remains `js/filter_logic.js`, `js/seed.js`, `js/content_bridge.js`, `js/injector.js`, `js/background.js`, `js/state_manager.js`, and related settings/profile surfaces, not these ignored bundles. | Wrong optimization scope could preserve old bundle assumptions instead of current JSON path/list-mode behavior. | Current-runtime metric artifact and fixture-backed JSON-first whitelist decision report. |

## Non-Completion Boundary

This slice does not make the ignored bundles safe to ship, delete, migrate, or
use as optimization authority. It only proves their current local evidence
status and release exclusion.

Still missing:

- `ignoredWhitelistBundleBoundaryContract`
- `ignoredWhitelistBundleReleaseExclusionReport`
- `ignoredWhitelistBundleExtractionDecision`
- `ignoredWhitelistBundleLifecycleBudget`
- `ignoredWhitelistBundleMessageStorageReport`
- `ignoredWhitelistBundleFixtureProvenance`
- `ignoredWhitelistBundleCurrentRuntimeParityReport`
- `ignoredWhitelistBundleOptimizationInputPolicy`
- `ignoredWhitelistBundleDeletionReadinessArtifact`
- `ignoredWhitelistBundleMetricArtifact`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this whitelist surface can support runtime
optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.

## Verification

```bash
node --test tests/runtime/ignored-whitelist-bundle-boundary-current-behavior.test.mjs
```
