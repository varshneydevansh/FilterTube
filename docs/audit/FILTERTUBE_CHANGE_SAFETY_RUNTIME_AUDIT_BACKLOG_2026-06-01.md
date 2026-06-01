# FilterTube Change-Safety Runtime Audit Backlog

Date: 2026-06-01
Status: broad audit backlog, not a release-lane gate

## Command

```bash
node --test --test-reporter=tap tests/runtime/*.test.mjs > /tmp/filtertube-runtime.tap 2>&1
```

## Result

```text
tests: 4737
pass: 4708
fail: 29
duration_ms: 74250.065667
```

This refresh reduces the pinned broad-suite failure count from 30 failures to
29 failures after retiring the stale Nanah vendor runtime session dashboard HTML
fingerprint row: the Nanah session lifecycle proof now expects the current
`html/tab-view.html` hash while line count, byte count, Nanah vendor transport
blocks, dashboard Nanah consumer blocks, crypto/listener/chunking primitive
counts, and missing future session authority remain unchanged. The previous
refresh reduced the pinned broad-suite failure count from 31 failures to
30 failures after retiring the stale manifest permission feature-map source
fingerprint row: the feature-map proof now expects the current browser manifest
fingerprints and current `build.js` fingerprint while keeping permission
declarations, host declarations, content-script matches, web-accessible resource
matches, runtime permission consumer counts, `activeTab` absence, and missing
build validation authority unchanged. The previous refresh reduced the pinned
broad-suite failure count from 32 failures to 31 failures after retiring the
stale manifest version baseline row: the
manifest-permission authority proof now expects all browser manifests to declare
`3.3.2` and records that baseline in the manifest authority audit while keeping
permissions, host permissions, world declarations, web-accessible resource
parity, and build-script guard behavior unchanged. The previous refresh reduced
the suite from 33 failures to 32 failures after retiring the stale Main Filter
All comments source anchor row: the Main Filter All comments proof now expects
the current `js/filter_logic.js:2214` decision block location while the block
hash, byte count, line count, token counts, storage behavior, and missing future
authority symbols remain unchanged. The previous refresh reduced the suite from
34 failures to 33 failures after retiring the stale legacy layout quarantine
package manifest count rows: the package-boundary proof now expects the current
active and dist content-script JS reference totals while keeping `js/layout.js`
absent from active manifest loads, dist manifest loads, web-accessible
resources, popup HTML, dashboard HTML, and non-doc runtime callers. The previous
refresh reduced the suite from 36 failures to 34 failures after retiring the
stale Kids browse malformed-fragment source
fingerprint and token-count rows: the Kids malformed browse proof now expects
the current `js/filter_logic.js` line count, byte count, hash, and
`videoChannelMap` token count already visible in source while keeping Kids owner
rail policy, malformed-container authority, fragment extraction policy, native
parity, metric artifacts, and first-class Kids browse authority explicitly
absent. The previous refresh reduced the suite from 37 failures to 36 failures
after retiring the stale JSON path authority and audit-completion
source pin rows: the JSON path authority proof now expects current
`js/filter_logic.js` owner-flow line ranges, and the audit-completion register
now asserts those same current ranges while keeping JSON-first promotion at
NO-GO. The previous refresh reduced the suite from 38 failures to 37 failures
after retiring the stale JSON-first video-meta revision boundary source pin row:
the revision-boundary proof test now expects the current
`js/filter_logic.js` line count, byte count, and hash already recorded in the
audit doc while content persistence, filter-logic queueing, background compiled
cache patching, and unpartitioned metadata-map fixtures remain unchanged and
first-class video-meta revision authority remains absent. The previous refresh
reduced the suite from 39 failures to 38 failures after retiring the stale
JSON-first video-meta profile/surface source pin row: the profile/surface proof
test now expects the current `js/filter_logic.js` line count, byte count, and
hash already recorded in the audit doc while content-side persistence, Kids-host
scheduling, background cache patching, filter-logic consumption, and DOM category
fixtures remain unchanged and first-class video-meta profile/surface authority
remains absent. The previous refresh reduced the suite from 40 failures to 39
failures after retiring the stale JSON-first video-meta no-work budget source pin
row: the no-work budget proof test now expects the current `js/filter_logic.js`
line count, byte count, and hash already recorded in the audit doc while
scheduler, duplicate, DOM upload-date/duration callsite fixtures remain
unchanged and first-class video-meta no-work budget authority remains absent. The
previous refresh reduced
the suite from 41 failures to 40 failures
after retiring the stale JSON-first video-meta merge schema source pin row: the
merge-schema proof test now expects the current `js/filter_logic.js` line count,
byte count, and hash already recorded in the audit doc while partial metadata
merge and category forwarding fixtures remain unchanged and first-class
video-meta merge schema authority remains absent. The previous refresh reduced
the suite from 42 failures to 41 failures after retiring the stale JSON-first
video-meta freshness eviction source pin row: the freshness-eviction proof test
now expects the current `js/filter_logic.js` line count, byte count, and hash
already recorded in the audit doc while persistence, scheduling, background
storage, and queue fixtures remain unchanged and first-class video-meta
freshness eviction authority remains absent. The previous refresh reduced the
suite from 43 failures to 42 failures
after retiring the stale JSON-first video-meta fetch policy source pin row: the
fetch policy proof test now expects the current `js/filter_logic.js` line count,
byte count, and hash already recorded in the
audit doc while fetch scheduling and watch-metadata fixture behavior remains
unchanged and first-class video-meta fetch policy authority remains absent. The
previous refresh reduced the suite from 44 failures to 43 failures after
retiring the stale JSON-first video-meta content parity source pin row: the
content parity proof test now expects the current `js/filter_logic.js` line
count, byte count, and hash already recorded in the audit doc while content
decision fixture behavior remains unchanged and first-class video-meta content
parity authority remains absent. The previous refresh reduced the suite from 45
failures to 44 failures after retiring the
stale JSON-first video-meta category parity source pin row: the category parity
proof test now expects the current `js/filter_logic.js` line count, byte count,
and hash already recorded in the audit doc while category decision fixture
behavior remains unchanged and first-class video-meta category parity authority
remains absent. The previous refresh reduced the suite from 46 failures to 45
failures after retiring the
stale JSON-first uppercase title boundary source pin row: the uppercase-title
proof test now expects the current `js/filter_logic.js` line count, byte count,
and hash already recorded in the audit doc while runtime uppercase-title fixture
behavior remains unchanged and first-class uppercase-title authority remains
absent. The previous refresh reduced the suite from 47 failures to 46 failures
after retiring the stale
JSON-first route/surface metric artifact contract coverage ledger row: the
objective coverage ledger now matches the active-goal and tracked-file ledgers at
69 method semantic proof gap files covered, while route/surface metric artifacts,
runtime metric collectors, JSON-first implementation, and whitelist optimization
remain NO-GO. The previous refresh reduced the suite from 49 failures to 47
failures after retiring the stale JSON-first reference doc surface rows: the
reference proof now points at the current `docs/youtube_renderer_inventory.md`
newline count, byte count, hash, inline-code count, and dot-index count while
reference docs remain evidence maps, not runtime authority. The previous refresh
reduced the suite from 51 failures to 49 failures after retiring the stale
JSON-first metric artifact gate rows: the
metric proof now points at the current performance-claim and no-work crosswalk
doc hashes plus the current `js/filter_logic.js` `processData()` source line
while metric artifact authority remains absent. The previous refresh reduced the
suite from 52 failures to 51 failures after retiring the stale implementation
readiness gate lifecycle count row: the readiness proof now points at the current
524 tracked lifecycle
primitive instances, 469 install-or-schedule rows, and 55 explicit teardown rows
while runtime cleanup and optimization approval remains at NO-GO. The previous
refresh reduced the suite from 55 failures to 52 failures after retiring the
stale generated local output dependency surface rows: the proof now points at
the current ignored `dist` v3.3.2 package output and current `website/.next`
local build fingerprints while generated output remains non-authoritative. The
previous refresh reduced the suite from 56 failures to 55 failures after
retiring the stale source-locus teardown anchor row: the
teardown proof now points at the current `js/filter_logic.js` video-channel and
video-meta flush timer lines while source-locus teardown approval remains at
NO-GO. The previous refresh reduced the suite from 57 failures to 56 failures
after retiring the stale source-locus side-effect anchor row: the
side-effect proof now points at the current `js/filter_logic.js` map flush,
metadata, JSON whitelist console, category fetch, harvest, and filter lines plus
the current `build.js` UI-shell and zip artifact lines while side-effect budget
approval remains at NO-GO. The previous refresh reduced the suite from 58
failures to 57 failures after retiring the stale source-locus parity/release
verification anchor row: the parity/release proof now points at the current `build.js`
UI-shell, zip artifact, and mobile artifact collection lines while parity,
release, and verification approval remains at NO-GO. The previous refresh
reduced the suite from 59 failures to 58 failures after retiring the stale
source-locus no-work anchor row: the
no-work ownership proof now points at the current `js/filter_logic.js` harvest,
disabled, filter, and JSON whitelist console lines plus the current `build.js`
UI-shell and zip artifact lines while source-locus no-work approval remains at
NO-GO. The previous refresh reduced the suite from 60 failures to 59 failures
after retiring the stale source-locus fingerprint fixture row: the fingerprint
proof now pins current bytes, lines, and hashes for
`js/filter_logic.js`, `build.js`, and the source-owner proof doc/test while
source-owner approval remains at NO-GO. The previous refresh reduced the suite
from 61 failures to 60 failures after retiring the stale source-locus diagnostic
privacy anchor row:
the source-locus diagnostic privacy proof now points at the current diagnostic
logging matrix owner-family rows and current `js/filter_logic.js` console line
anchors while keeping diagnostic privacy approval at NO-GO. The previous refresh
reduced the suite from 62 failures to 61 failures after retiring the stale first
optimization collector verification output approval objective-ledger row: the
objective coverage ledger now pins the current 69 method semantic proof gap file
count for that approval boundary, matching the active-goal and tracked-file
ledgers while keeping collector verification output approval at NO-GO. The
previous refresh reduced the suite from 63 failures to 62 failures after
retiring the stale external navigation surface boundary row:
`html/tab-view.html`, `website/components/site-footer.js`,
`website/app/page.js`, and `website/app/downloads/page.js` now pin current
source fingerprints while selected navigation primitive counts and split
extension/website navigation policy proof remain unchanged. The previous refresh
reduced the suite from 64 failures to 63 failures after retiring the stale
extension UI CSS page-state boundary row: `html/tab-view.html` now pins the
current same-size dashboard loader shell hash, while popup/tab-view loader order
and the generated shell versus hand-owned UI runtime state split remain
unchanged. Earlier broad refreshes reduced the suite from 65 failures to 64
failures after retiring the stale design-token build-configuration boundary row,
from 66 failures to 65 failures after retiring the stale current-dirty worktree
package-version row, from 67 failures to 66 failures after retiring the stale
content-filter field semantics contract dependency on the older
compiled/settings field-register row count, from 69 failures to 67 failures
after retiring the stale function-coverage source backlog row and the stale
`compress-video` package/build boundary row, from 76 failures to 69 failures
after refreshing release-note/package-version proof for the `3.3.2` release
alignment, and from 115 failures to 76 failures after refreshing stale method
semantic proof gap counts from 5,673 to 5,681 lexical callables. The broad suite
is not clean enough to be used as a release gate, but the current baseline is
narrower and more useful for retiring backlog slices.

## Boundary

The focused release lanes are the per-change proof system. The broad
`audit:runtime` suite is older current-boundary inventory and is still useful,
but it is not clean enough to be treated as a release blocker today.

Adjacent fingerprint proof is now cleaner than the broad suite result. This
command currently reports no stale source fingerprint proof rows:

```bash
node scripts/audit-proof-drift.mjs --all --report-only
```

## Failure Clusters

Current failing subtests are spread across 19 runtime test files. A lightweight
name-based parse of `/tmp/filtertube-runtime-current-after-nanah-session-refresh.tap` gives this
non-exclusive family snapshot:

| Family | Current failing subtests |
|---|---:|
| generated/release/package/docs surfaces | 19 |
| source-locus/optimization/index contracts | 1 |
| JSON/video-meta/path/reference | 2 |
| website/public-doc/source inventory | 10 |
| settings/content-control/DOM lifecycle | 7 |
| native/Nanah/Kids/YTM | 6 |

The previous Nanah vendor runtime session dashboard fingerprint row is now
retired from the broad failure snapshot: `html/tab-view.html` now matches the
current dashboard shell hash in the Nanah session lifecycle proof while Nanah
transport, crypto/listener/chunking, dashboard consumer, JSON-filter separation,
and future authority gaps remain pinned.
The previous manifest permission feature-map fingerprint row is now retired from
the broad failure snapshot: manifest and `build.js` source fingerprints now
match the current release/build baseline while permission declarations, host
scope, runtime consumer counts, `activeTab` absence, and missing feature-map
authority remain pinned.
The previous manifest permission authority version row is now retired from the
broad failure snapshot: all browser manifests now match the current `3.3.2`
release baseline in the proof lane while the permission, host, world,
web-accessible, and build-order invariants remain pinned.
The previous Main Filter All comments scope source-anchor row is now retired
from the broad failure snapshot: the proof lane now matches the moved
`filterLogicCommentDecision` block anchor while preserving the source hash,
effect fixtures, token counts, and audit-only authority gap.
The previous legacy layout quarantine package row is now retired from the broad
failure snapshot: the proof lane now matches current manifest content-script JS
reference totals while preserving the load/exposure invariant that `js/layout.js`
is packaged but inactive and not web-accessible.
The previous method-proof/family blocker row is now retired from the broad
failure snapshot: the direct method semantic proof lane passes with 5,681
current lexical callables and 0 complete per-callable semantic proof files.
The previous release-note/package-version drift rows are also retired from this
snapshot: package metadata, browser manifests, and `data/release_notes.json`
now align on `3.3.2`.
The previous function-coverage source backlog row is retired from this snapshot:
every current product-owned JS/JSX/MJS source file is either cited in the hot
function map or listed as callable backlog. The previous `compress-video`
package/build boundary row is also retired: release/build/website media callers
remain absent while the test-lane classifier mention is recognized as workflow
classification, not package integration.
The previous content-filter field semantics contract row is retired: its
dependency on the compiled/settings field-register source input now tracks the
current 309 raw compiled/settings field rows instead of the older 296-row
baseline.
The previous current-dirty package-script row is retired: the audit now
separates the `9816c34` one-line `audit:runtime` script diff from the later
`3.3.2` package version bump.
The previous design-token build-configuration row is retired: the design-token
boundary now pins the current release mobile artifact constants and text-file
extension sets in `build.js` while preserving the no-generator/no-package-copy
boundary for `design/design_tokens.json`.
The previous extension UI CSS page-state row is retired: the selected
`html/tab-view.html` same-size dashboard shell hash now matches current source,
and the proof still preserves CSS loader order plus generated-shell/runtime
state-token separation.
The previous external navigation surface row is retired: selected extension,
website component, and website route fingerprints now match current source while
the proof still preserves uneven static-link policy and split navigation-owner
behavior as current state.
The previous collector verification output approval row is retired: the
objective coverage ledger now matches the 69-file method semantic proof gap
count already present in adjacent ledgers, while collector verification output
approval remains explicitly absent.
The previous source-locus diagnostic privacy row is retired: the diagnostic
privacy ownership proof now uses current diagnostic logging matrix line anchors
and current `js/filter_logic.js` console anchor lines while diagnostic privacy
approval remains explicitly absent.
The previous source-locus fingerprint row is retired: the fingerprint boundary
now pins current source bytes, line counts, and SHA-256 hashes for the changed
filter/build/source-owner proof files while source-owner approval remains
explicitly absent.
The previous source-locus no-work row is retired: the no-work ownership proof
now uses current `js/filter_logic.js` and `build.js` line anchors while
source-locus no-work approval remains explicitly absent.
The previous source-locus parity/release verification row is retired: the
parity/release ownership proof now uses current `build.js` line anchors while
parity, release, and verification approval remains explicitly absent.
The previous source-locus side-effect row is retired: the side-effect ownership
proof now uses current `js/filter_logic.js` and `build.js` line anchors while
side-effect budget approval remains explicitly absent.
The previous source-locus teardown row is retired: the teardown ownership proof
now uses current `js/filter_logic.js` video-channel and video-meta timer line
anchors while source-locus teardown approval remains explicitly absent.
The previous JSON-first reference doc surface rows are retired: the reference
proof now pins the current `docs/youtube_renderer_inventory.md` fingerprint and
syntax counts while keeping reference docs as evidence maps, not runtime
authority.
The previous JSON-first route/surface metric artifact contract coverage row is
retired: the objective coverage ledger now matches the adjacent 69-file method
semantic proof gap count while route/surface metric artifacts, runtime metric
collectors, JSON-first implementation, and whitelist optimization remain
explicitly NO-GO.
The previous JSON-first uppercase title boundary row is retired: the
uppercase-title proof test now matches the current `js/filter_logic.js`
fingerprint already present in the audit doc while runtime uppercase-title
fixture behavior remains unchanged and first-class uppercase-title authority
remains explicitly absent.
The previous JSON-first video-meta category parity row is retired: the category
parity proof test now matches the current `js/filter_logic.js` fingerprint
already present in the audit doc while category decision fixture behavior
remains unchanged and first-class video-meta category parity authority remains
explicitly absent.
The previous JSON-first video-meta content parity row is retired: the content
parity proof test now matches the current `js/filter_logic.js` fingerprint
already present in the audit doc while content decision fixture behavior remains
unchanged and first-class video-meta content parity authority remains explicitly
absent.
The previous JSON-first video-meta fetch policy row is retired: the fetch policy
proof test now matches the current `js/filter_logic.js` fingerprint already
present in the audit doc while fetch scheduling and watch-metadata fixture
behavior remains unchanged and first-class video-meta fetch policy authority
remains explicitly absent.
The previous JSON-first video-meta freshness eviction row is retired: the
freshness-eviction proof test now matches the current `js/filter_logic.js`
fingerprint already present in the audit doc while persistence, scheduling,
background storage, and queue fixtures remain unchanged and first-class
video-meta freshness eviction authority remains explicitly absent.
The previous JSON-first video-meta merge schema row is retired: the merge-schema
proof test now matches the current `js/filter_logic.js` fingerprint already
present in the audit doc while partial metadata merge and category forwarding
fixtures remain unchanged and first-class video-meta merge schema authority
remains explicitly absent.
The previous JSON-first video-meta no-work budget row is retired: the no-work
budget proof test now matches the current `js/filter_logic.js` fingerprint
already present in the audit doc while scheduler, duplicate,
DOM upload-date/duration callsite fixtures remain unchanged and first-class
video-meta no-work budget authority remains explicitly absent.
The previous JSON-first video-meta profile/surface row is retired: the
profile/surface proof test now matches the current `js/filter_logic.js`
fingerprint already present in the audit doc while content-side persistence,
Kids-host scheduling, background cache patching, filter-logic consumption, and
DOM category fixtures remain unchanged and first-class video-meta profile/surface
authority remains explicitly absent.
The previous JSON-first video-meta revision boundary row is retired: the
revision-boundary proof test now matches the current `js/filter_logic.js`
fingerprint already present in the audit doc while content persistence,
filter-logic queueing, background compiled cache patching, and unpartitioned
metadata-map fixtures remain unchanged and first-class video-meta revision
authority remains explicitly absent.
The previous JSON path authority and audit-completion rows are retired: the JSON
path authority owner-flow proof now matches the current `js/filter_logic.js`
line ranges for path syntax, direct rules, candidate extraction, decision effects,
content/category effects, learned maps, collaboration identity, and `processData`;
the audit-completion register now asserts those same source pins while keeping
JSON-first promotion, generated path manifests, unsupported renderer policy,
field-effect authority, and JSON-vs-DOM ownership at `NO-GO`.
The previous Kids browse malformed-fragment rows are retired: the Kids malformed
browse proof now matches the current `js/filter_logic.js` fingerprint and
`videoChannelMap` token count while compact video blocklist/whitelist behavior,
owner rail visibility, malformed direct-JSON capture handling, and map side
effects remain unchanged. Kids browse raw-container contracts, fragment
extraction policy, native WebView parity, metric artifacts, and first-class Kids
browse malformed-fragment authority remain explicitly absent.
The previous JSON-first metric artifact gate rows are retired: the metric proof
now pins current performance-claim and no-work crosswalk hashes plus the current
`js/filter_logic.js` `processData()` anchor while metric artifact authority
remains explicitly absent.
The previous implementation readiness gate row is retired: the readiness proof
now uses the current lifecycle register totals and keeps runtime cleanup,
JSON-first promotion, whitelist/cache optimization, release claims, and broad
behavior changes explicitly blocked.
The previous generated local output dependency surface rows are retired: the
proof now pins the current ignored `dist` v3.3.2 ZIP/package tree snapshot and
current `website/.next` local build fingerprints while preserving the
non-authority boundary for generated output and dependency caches.

| Cluster | Examples | Current meaning |
|---|---|---|
| Callable, source-locus, and index drift | remaining source-locus ownership rows, route component callable/render primitive counts | `all-callable-index-current-behavior` has been refreshed and promoted into `test:smoke`; `first-optimization-source-locus-callable-anchor-boundary` has been refreshed and promoted into `test:performance`; remaining source-locus ownership closure rows and route component register rows need regenerated proof before they can become broad gates. |
| Audit goal and completion ledgers | audit completion gap register, collector verification output, JSON route/surface contract coverage links | Older goal ledgers still point at stale broad-suite counts or prerequisite gates. |
| Docs/audit boundary, packaging, and generated artifacts | audit markdown boundary, `compress-video`, design tokens, release notes, external navigation, generated main runtime assets, dist/website generated output | Release and generated-output proof remains useful, but several broad inventory rows need refresh. |
| Settings and content-control registers | settings mode source/effect, settings refresh cross-context consumer rows, source-of-truth claim register | `compiled-settings-field-register` has been refreshed and promoted into `test:settings`; `content-control-active-work-matrix` has been refreshed and promoted into `test:performance`; `content-control-alias-mutation-boundary` has been refreshed and promoted into `test:settings`; `settings-mode-source-effect`, `source-of-truth-claim-register`, `settings-refresh-cross-context-consumer-boundary`, `settings-refresh-key-parity-register`, `settings-refresh-dirty-key-producer-consumer-join-matrix`, `settings-refresh-optimization-readiness-boundary`, `settings-refresh-optimization-candidate-binding-matrix`, and `settings-refresh-optimization-candidate-evidence-packet-contract` have been refreshed and promoted into `test:settings`; remaining settings rows are older broad-ledger references, not unpromoted settings-refresh lane proof. |
| DOM selector, hide, and lifecycle registers | JSON content-control DOM hide boundary rows, tab-view lifecycle selector boundary, Shorts overlay owner proof | `direct-hide-writer-register` has been refreshed and promoted into `test:dom`; `dom-selector-instance-register` has been refreshed for `js/content/dom_state.js` selector patch sites and promoted into `test:dom`; `lifecycle-instance-register` and `repo-lifecycle-primitive-coverage` have been refreshed for website component lifecycle drift and promoted into `test:performance`; remaining lifecycle selector rows belong in smaller DOM batches. |
| JSON comment continuation and provenance registers | comment author/channel provenance, keyword provenance, entity payload provenance, structural wrapper cleanup, collection-root/command-shape/sibling continuation parity, continuation shortcut counts | Comment JSON proof rows have been refreshed and promoted into `test:json`; author/channel and keyword provenance are also promoted into `test:blocking`. Remaining broad-ledger failures in this family are older completion/obligation references, not unpromoted focused comment JSON proof. |
| JSON content-control hide boundary registers | hideAllComments, hideAskButton, hideHomeFeed, hideMixPlaylists, hideVideoInfo, hideWatchPlaylistPanel, and related boundaries | `content-control-json-first-boundary-index` plus the JSON-first content-control hide boundary set have been refreshed and promoted into `test:json`; remaining content-control surfaces are either already owned by whitelist/menu lanes or belong to older broad ledgers outside this hide-control batch. |
| JSON-first renderer, reference, metric, and video-meta registers | candidate extraction, implementation locus, metric artifact gate, reference docs, renderer traversal, video-meta parity/fetch/merge docs | `json-first-implementation-locus-register` has been refreshed and promoted into `test:json`; `json-first-implementation-authority-boundary` has been refreshed and promoted into `test:json`; `json-first-renderer-traversal-mutation-boundary` has been refreshed and promoted into `test:json`; `json-first-candidate-extraction-boundary` has been refreshed and promoted into `test:json`; `network-fetch-xhr-callsite-register` has been refreshed and promoted into `test:json` and `test:performance`; `shorts-reel-overlay-owner-authority-boundary` has been refreshed and promoted into `test:whitelist`, `test:blocking`, and `test:json`; remaining JSON-first proof is still split across older NO-GO gates and focused lane tests. |
| YTM and YouTube Music parity slices | YouTube Music surface identity, YTM showSheet enrichment, YTM injector/filter-logic parity, playlist selected-row parity | `youtube-music-surface-identity-boundary` has been refreshed and promoted into `test:whitelist` and `test:json`; `ytm-show-sheet-injector-filter-logic-parity` and `ytm-show-sheet-enrichment-handoff` have been refreshed and promoted into `test:json`; remaining YTM proof slices are still partial and should be refreshed in focused whitelist/JSON/menu batches. |

## Release Lane Decision

Keep using focused lanes for logical changes:

```text
test:release
test:whitelist
test:blocking
test:json
test:dom
test:menu
test:performance
test:settings
test:smoke
test:audit-drift
```

Use `audit:runtime` as a cleanup backlog until the stale proof clusters above
are refreshed in smaller, reviewable batches.
