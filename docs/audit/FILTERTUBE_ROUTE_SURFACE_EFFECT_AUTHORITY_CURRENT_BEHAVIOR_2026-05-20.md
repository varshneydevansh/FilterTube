# FilterTube Route/Surface Effect Authority Current Behavior - 2026-05-20

Status: current-behavior audit artifact. This is not an implementation patch.

This slice connects three separate audit layers:

```text
information availability  ->  lifecycle budget  ->  allowed effect
```

The current runtime has many local route checks, but no shared authority that
answers: "on this route and surface, with this profile/list mode/rule state,
which effects may run?"

## Current Route/Surface Effect Classes

| Route or surface | Current source gates | Current effects | Current gap |
| --- | --- | --- | --- |
| YouTubei endpoints | Seed intercepts `/search`, `/guide`, `/browse`, `/next`, and `/player` by URL substring/path, then applies the no-work gate before fetch clone/body parsing and XHR body processing. | Parse/clone JSON, harvest identity, mutate response bodies, hide comments when comment continuations are detected for active work. | Endpoint family is not tied to one route/surface effect report even though inactive body work is now bypassed. |
| Main home/search | JSON renderers, DOM fallback global card scan, quick-block, primary menu, fallback menu, prefetch, and search/channel JSON fast paths. | Hide cards/shelves, inject quick/menu affordances, harvest identity, restore stale hidden state, hide search shelves. | Search/home work is split across endpoint, DOM, menu, quick, and lifecycle gates. |
| Main watch/current video | Player `/player` and `/next`, watch DOM owner extraction, current-watch owner enforcement, playlist guards, watch rail cleanup, player CSS controls. | Hide current owner metadata, pause video, click next/playlist targets, hide rails/end-screen/comment surfaces, restore whitelist scaffolding. | Watch surface has the heaviest side effects but no single watch-surface authority before pause/click/hide work. |
| Shorts | Renderer JSON, video-id joins, Shorts DOM extraction, quick-block/menu actions, Shorts identity fallback. | Hide Shorts, block/allow via joined identity, fetch owner fallback for actions. | DOM may expose only `/shorts/VIDEO_ID`; effects still need a source-confidence and action budget. |
| Playlist/Mix | Playlist panel JSON/DOM, selected row checks, current-watch skip logic, Mix identity cleanup, compact playlist gaps. | Hide playlist rows, skip hidden next entries, clear stale collaborator metadata, inject fallback menus. | Playlist row, Mix playlist, and current-video effects are mixed with watch logic. |
| Comments/posts/community | Comment JSON, hide-all comment continuations, DOM comment/post targets, primary/fallback menu targets. | Hide comments, hide threads, inject action menu rows, possibly use global keyword paths. | Comments have separate filter semantics and still share broad menu/fallback paths. |
| YouTube Kids | Kids JSON, Kids DOM, Kids passive block listener, Kids watch fallback fetch, app/native shell paths. | Mirror native Kids block actions, block/allow Kids cards, preserve public Kids layout. | Kids is a separate surface but shares some global selectors/lifecycle and has sparse DOM information. |
| YouTube Music/mobile `ytm-*` | Mobile/YTM JSON and DOM renderers, fallback menu, quick-block, YTM compact surfaces. | Hide mobile cards, inject fallback menus, joined identity where video ids exist. | `ytm-*` tags share global selectors with Main/Kids and need route-specific effect proof. |
| Native overlays/fullscreen/app shells | Local quiet guards in content bridge and native attributes, quick-block resize/orientation listeners, DOM fallback timers. | Pause some scans under native overlay, but not all route/surface work. | Fullscreen/native-overlay pause is not owned by one route/surface effect authority. |

## Current Effect Chain

```text
settings + route + surface
        |
        +--> seed endpoint branch may bypass inactive work or parse/mutate active JSON
        +--> filter logic may remove renderer nodes
        +--> DOM fallback may scan/hide/restore visible DOM
        +--> quick-block may inject cross buttons
        +--> primary/fallback menu may inject block actions
        +--> identity resolvers may fetch and write learned maps
        +--> watch/playlist guards may pause/click
        +--> stats may count hides

Missing center:
        routeSurfaceEffectAuthority
        routeSurfaceEffectDecision
        watchSurfaceEffectBudget
        menuAffordanceSurfaceAuthority
        routeInactiveNoWorkCounter
        sideEffectRouteBudget
```

## Current Source Proof

- `js/seed.js` intercepts the same YouTubei endpoint families independent of a
  route/surface effect report, with the current no-work gate bypassing inactive
  fetch clone/body parsing and XHR body processing before route/surface
  authority exists.
- `js/filter_logic.js` contains local route exceptions for `/feed/channels`,
  `/results` secondary search containers, and watch scaffolding in whitelist
  mode, while the generic engine remains endpoint-agnostic.
- `js/content/dom_fallback.js` makes whitelist mode active for DOM fallback on
  every route, treats many boolean controls as active before route relevance,
  scans `VIDEO_CARD_SELECTORS`, and owns watch playlist/current-video side
  effects.
- `js/content/block_channel.js` gates quick-block by
  `showQuickBlockButton && listMode !== whitelist`, then adds separate local
  mobile-watch, overlay, and search-surface checks.
- `js/content_bridge.js` gates primary menu injection by whitelist mode and
  `showBlockMenuItem`, while fallback menu scanning/buttons/rows use broader
  lifecycle and native-overlay guards.
- `js/content_bridge.js` and `js/background.js` can route unresolved watch,
  Shorts, Kids, playlist, and menu actions through identity resolvers that need
  their own route/action budgets.

## Required Future Decision Record

Before changing runtime behavior, every route/surface effect should be decided
by one record:

```text
route: home | search | watch | shorts | playlist | channel | comments | kids-browse | kids-watch | ytm | unknown
surface: main | kids | ytm | native-app | browser-extension
listMode: disabled | blocklist-empty | blocklist-active | whitelist-empty | whitelist-active
source confidence: canonical | joinedByVideoId | displayOnly | fallback | unknown
allowed effects:
  parseEndpoint | mutateJson | harvestOnly | scanDom | hideDom | restoreDom |
  injectQuick | injectMenu | resolveIdentity | fetchIdentity | pausePlayer |
  clickNavigation | countStats
negative budget:
  no parse/mutate/scan/inject/fetch/pause/click/count when route inactive,
  feature disabled,
  native overlay active,
  fullscreen active,
  or no matching active rule exists
```

## Implementation Boundary

Route/surface authority must come before:

- moving JSON rules between endpoints,
- changing whitelist fail-closed behavior,
- pruning DOM fallback on watch/Shorts/playlist/Kids surfaces,
- unifying or deleting quick-block and fallback-menu observers,
- changing current-watch pause/click behavior,
- adding compact playlist, compact autoplay, direct watch-card, or post rules,
- claiming empty-install or no-rule zero-work behavior.

## Current Verdict

```text
Completion is not proven.
Route/surface effect authority is documented but not implemented.
Runtime behavior remains not-ready-for-route-surface optimization.
```

## JSON-First Route/Surface Implementation Authority Boundary Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-implementation-authority-boundary-current-behavior.test.mjs`
bind this route/surface effect authority gap to the current JSON-first
implementation NO-GO. The addendum pins 12 JSON-first route/surface
implementation authority rows, 9 route/surface effect classes covered, 12
route/surface metric obligations covered, 0 runtime JSON-first route/surface
approvals, 0 runtime route/surface metric artifacts, 0 implementation-ready
JSON-first route/surface rows, expected runtime audit tests: 4457, expected
runtime audit pass 4457, and expected runtime audit fail 0.

## JSON-First Route/Surface Fixture Packet Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-packet-contract-current-behavior.test.mjs`
bind this route/surface effect authority gap to the future fixture packet
contract. The addendum pins 12 JSON-first route/surface fixture packet rows, 12
route/surface authority rows covered, 12 route/surface metric obligations
covered, 0 runtime JSON-first fixture packet approvals, 0 committed
route/surface fixture packet files, and 0 implementation-ready JSON-first
fixture packet rows, expected runtime audit tests: 4457, expected runtime audit
pass 4457, and expected runtime audit fail 0.

## JSON-First Route/Surface Fixture Artifact Path Boundary Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-artifact-path-boundary-current-behavior.test.mjs`
reserve the future route/surface fixture packet artifact location without
turning route/surface effect authority into implementation approval. The
addendum pins 6 fixture artifact path rows, 12 route/surface authority rows
covered, 5 reserved future artifact files, 0 committed route/surface fixture
packet files, and 0 implementation-ready route/surface fixture artifact path
rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, and
expected runtime audit fail 0.

## JSON-First Route/Surface Fixture Manifest Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-manifest-contract-current-behavior.test.mjs`
keep route/surface effect authority from becoming fixture manifest authority.
The addendum pins 12 fixture manifest contract rows, 12 route/surface authority
rows covered, 1 reserved manifest path, 0 committed route/surface fixture
manifest files, 0 runtime JSON-first fixture manifest approvals, and 0
implementation-ready JSON-first fixture manifest contract rows, expected
runtime audit tests 4457, expected runtime audit pass: 4457, and expected
runtime audit fail 0.

## JSON-First Route/Surface Fixture Artifact Commit Readiness Gate Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-artifact-commit-readiness-gate-current-behavior.test.mjs`
keep route/surface effect authority from becoming committed fixture artifact
authority. The addendum pins 10 fixture artifact commit readiness rows, 12
route/surface authority rows covered, 5 reserved future artifact files, 0
committed route/surface fixture packet files, 0 runtime JSON-first fixture
packet approvals, and 0 implementation-ready route/surface fixture artifact
commit rows, expected runtime audit tests: 4457, expected runtime audit pass
4457, and expected runtime audit fail 0.

## JSON-First Route/Surface Fixture Artifact Contract Coverage Gate Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-artifact-contract-coverage-gate-current-behavior.test.mjs`
keep route/surface effect authority from becoming fixture artifact contract
authority. The addendum pins 10 fixture artifact contract coverage rows, 12
route/surface authority rows covered, 5 reserved future artifact files, 0
per-file fixture artifact contract docs, 0 committed route/surface fixture
packet files, 0 runtime JSON-first fixture packet approvals, and 0
implementation-ready route/surface fixture artifact contract coverage rows,
expected runtime audit tests: 4457, expected runtime audit pass: 4457, and
expected runtime audit fail 0.

## JSON-First Route/Surface Fixture Sample Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-sample-contract-current-behavior.test.mjs`
keep route/surface effect authority from becoming fixture sample authority.
The addendum pins 12 fixture sample contract rows, 12 route/surface authority
rows covered, 1 reserved sample path, 0 committed route/surface fixture sample
files, 0 runtime JSON-first fixture sample approvals, and 0
implementation-ready JSON-first fixture sample contract rows, expected runtime
audit tests: 4457, expected runtime audit pass: 4457, and expected runtime
audit fail 0.

## JSON-First Route/Surface Fixture Provenance Artifact Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PROVENANCE_ARTIFACT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-provenance-artifact-contract-current-behavior.test.mjs`
keep route/surface effect authority from becoming fixture provenance artifact
authority. The addendum pins 12 fixture provenance artifact contract rows, 12
route/surface authority rows covered, 1 reserved provenance path, 0 committed
route/surface fixture provenance artifact files, 0 runtime JSON-first fixture
provenance approvals, and 0 implementation-ready JSON-first fixture
provenance artifact contract rows, expected runtime audit tests: 4457,
expected runtime audit pass: 4457, and expected runtime audit fail 0.

## JSON-First Route/Surface Fixture Parity Report Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PARITY_REPORT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-parity-report-contract-current-behavior.test.mjs`
keep route/surface effect authority from becoming fixture parity report
authority. The addendum pins 12 fixture parity report contract rows, 12
route/surface authority rows covered, 1 reserved parity report path, 0
committed route/surface fixture parity report files, 0 runtime JSON-first
fixture parity report approvals, and 0 implementation-ready JSON-first fixture
parity report contract rows, expected runtime audit tests: 4457, expected
runtime audit pass: 4457, and expected runtime audit fail 0.

## JSON-First Route/Surface Fixture Verification Output Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-verification-output-contract-current-behavior.test.mjs`
keep route/surface effect authority from becoming fixture verification output
authority. The addendum pins 12 fixture verification output contract rows, 12
route/surface authority rows covered, 1 reserved verification output path, 0
committed route/surface fixture verification output files, 0 runtime
JSON-first fixture verification output approvals, and 0 implementation-ready
JSON-first fixture verification output contract rows, expected runtime audit
tests: 4457, expected runtime audit pass: 4457, and expected runtime audit
fail 0.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this route/surface effect authority can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, route/surface effect changes, identity
source-tier changes, metric fixture approvals, no-work changes, or whitelist
behavior changes.
