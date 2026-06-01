import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function assertSettingsModeStopGoPropagation(source) {
  const stopGoDoc = read('docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md');
  const modeSurfaceDoc = read('docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md');

  assert.match(source, /Settings Mode Stop\/Go Propagation Continuation/);
  assert.match(source, /2026-05-28 settings-mode stop\/go propagation continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md'));
  assert.match(source, /ASCII and Mermaid stop\/go\s+flows/);
  assert.match(source, /6 settings-mode cross-feature rows covering\s+empty blocklist, empty whitelist, disabled settings, content-control flags/);
  assert.match(source, /quick block plus normal menu, and native overlay\/fullscreen\/app shell/);
  assert.match(source, /broad empty-state shortcut approval,\s+JSON-first promotion approval, lifecycle pruning approval, release\/public-claim\s+use, and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior\s+changed by this propagation: no; the broad audit remains active/);
  assert.match(source, /2026-05-30 settings-mode and cross-feature packet current-source rerun/);
  assert.ok(source.includes('node --test --test-reporter=spec tests/runtime/settings-mode-coverage-matrix-current-behavior.test.mjs tests/runtime/settings-mode-source-effect-current-behavior.test.mjs tests/runtime/mode-surface-effect-matrix-current-behavior.test.mjs tests/runtime/cross-feature-authority-matrix-current-behavior.test.mjs tests/runtime/enabled-master-switch-disabled-runtime-boundary-current-behavior.test.mjs tests/runtime/json-first-list-mode-matrix-boundary-current-behavior.test.mjs tests/runtime/content-control-active-work-matrix-current-behavior.test.mjs tests/runtime/compiled-settings-profile-list-mode-assembly-boundary-current-behavior.test.mjs tests/runtime/settings-authority-source-current-behavior.test.mjs tests/runtime/settings-refresh-key-parity-register-current-behavior.test.mjs tests/runtime/settings-refresh-cross-context-consumer-boundary-current-behavior.test.mjs'));
  assert.match(source, /passed 86\/86 tests/);
  assert.match(source, /current-source settings-mode coverage,\s+settings source\/effect rows, mode\/surface effects, cross-feature authority\s+families, disabled master-switch runtime boundaries, list-mode blocklist versus\s+whitelist semantics/);
  assert.match(source, /content-control active-work gates, compiled profile\/list\s+mode assembly, settings authority source gaps, refresh key parity, and\s+cross-context refresh consumers/);
  assert.match(source, /Settings-mode implementation authority, broad empty-state shortcut approval,\s+JSON-first promotion, lifecycle pruning, whitelist\/cache optimization,\s+release\/public-claim use, and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(stopGoDoc, /Settings Mode Cross-Feature Stop\/Go Continuation - 2026-05-28/);
  assert.match(stopGoDoc, /ASCII decision flow:/);
  assert.match(stopGoDoc, /Mermaid decision flow:/);
  assert.match(stopGoDoc, /flowchart TD/);
  assert.match(modeSurfaceDoc, /Settings Mode Cross-Feature Continuation - 2026-05-28/);
  assert.match(modeSurfaceDoc, /Native quieting cannot be treated as a global lifecycle off switch/);
}

function assertListenerOptionShapeContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Event Listener Option Shape Continuation/);
  assert.match(source, /2026-05-28 listener-option shape continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /third-argument option shape for all 288 current `addEventListener` installs/);
  assert.match(source, /232 omitted-option listeners, 23 boolean capture listeners, 30\s+object-option listeners, 1 explicit bubble listener, and 2 generated\s+expression\/identifier option listeners/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Listener\s+option cleanup authority, broad lifecycle pruning, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Event Listener Option Shape Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /addEventListener option rows: 288/);
  assert.match(lifecycleDoc, /listener option cleanup approval: NO-GO/);
}

function assertListenerEventTypeContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Event Listener Event-Type Continuation/);
  assert.match(source, /2026-05-28 listener-event type continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /first-argument event type for all 288 current `addEventListener` installs/);
  assert.match(source, /114 click listeners, 55 change listeners, 20 input listeners, 14\s+keydown listeners, 8 `DOMContentLoaded` listeners, 1 `ended` media listener, 72\s+other literal event listeners, 4 non-literal event expressions, and 0 missing\s+event arguments/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Listener event cleanup authority, broad lifecycle pruning, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Event Listener Event-Type Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /addEventListener event rows: 288/);
  assert.match(lifecycleDoc, /listener event cleanup approval: NO-GO/);
}

function assertListenerTargetContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Event Listener Target Continuation/);
  assert.match(source, /2026-05-28 listener-target continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /receiver\/target expression for all 288 current `addEventListener` installs/);
  assert.match(source, /203 local element targets, 17 optional local element targets, 39\s+document targets, 19 window targets, 8 vendor transport targets, and 2\s+generated shell targets/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Listener\s+target cleanup authority, broad lifecycle pruning, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Event Listener Target Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /addEventListener target rows: 288/);
  assert.match(lifecycleDoc, /listener target cleanup approval: NO-GO/);
}

function assertListenerEventTargetMatrixContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Event Listener Event-Target Matrix Continuation/);
  assert.match(source, /2026-05-28 listener event-target matrix continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /event type and target expression for all 288 current `addEventListener`\s+installs/);
  assert.match(source, /10 document click pairs, 7 document `DOMContentLoaded`\s+pairs, 3 document keydown pairs, 4 document pointer\/mouse pairs, 4 window\s+message pairs, 2 window route pairs, 9 window scroll\/resize\/orientation pairs,\s+1 window storage\/visibility pair, 104 local click pairs, 68 local\s+change\/input\/keydown pairs, 8 vendor transport lifecycle pairs, and 2\s+generated shell nonliteral pairs/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Listener event-target cleanup authority, broad lifecycle\s+pruning, route teardown authority, native\/menu timing authority, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Event Listener Event-Target Matrix Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /addEventListener event-target matrix rows: 288/);
  assert.match(lifecycleDoc, /listener event-target cleanup approval: NO-GO/);
}

function assertObserverObserveTargetContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Observer Observe Target Continuation/);
  assert.match(source, /2026-05-28 observer-observe target continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /target expression for all 17 current tracked `\.observe\(\.\.\.\)` activation\s+calls/);
  assert.match(source, /4 card\/row observe targets, 3 `document\.body` observe\s+targets, 4 dropdown observe targets, 3 generic target expressions, 2\s+panel\/rail observe targets, and 1 select observe target/);
  assert.match(source, /ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /Observer observe target cleanup authority,\s+broad lifecycle pruning, route teardown authority, dropdown\/native menu\s+authority, and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime\s+behavior changed by this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Observer Observe Target Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /observer observe rows: 17/);
  assert.match(lifecycleDoc, /observer observe target cleanup approval: NO-GO/);
}

function assertObserverObserveOptionShapeContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Observer Observe Option Shape Continuation/);
  assert.match(source, /2026-05-28 observer observe option-shape continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /option shape for all 17 current tracked `\.observe\(\.\.\.\)` activation calls/);
  assert.match(source, /9 `childList \+ subtree` observer option rows, 1 `childList`-only\s+option row, 2 no-option visibility observer rows, 5 attribute-filter observer\s+rows, 2 style\/hidden attribute filter rows, 1 `aria-hidden` attribute filter\s+row, 1 `disabled` attribute filter row, 1 collaborator identity attribute\s+filter row, 16 content-runtime observer observe option rows, and 1 extension\s+UI\/background observer observe option row/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Observer observe option-shape cleanup authority, broad lifecycle\s+pruning, route teardown authority, dropdown\/native menu authority, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Observer Observe Option Shape Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /observer observe option rows: 17/);
  assert.match(lifecycleDoc, /observer observe option-shape cleanup approval: NO-GO/);
}

function assertListenerCallbackIdentityContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Event Listener Callback Identity Continuation/);
  assert.match(source, /2026-05-28 listener-callback identity continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /callback argument shape for all 288 current tracked `addEventListener`\s+installs/);
  assert.match(source, /252 inline arrow callbacks, 33 identifier callback\s+references, 1 member callback reference, 2 generated expression callbacks, 74\s+content-runtime callbacks, 201 extension UI\/background callbacks, 2\s+generated-output callbacks, 8 vendor-bundle callbacks, and 3 website-component\s+callbacks/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Listener callback cleanup authority, broad lifecycle\s+pruning, route teardown authority, native\/menu timing authority, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Event Listener Callback Identity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /addEventListener callback rows: 288/);
  assert.match(lifecycleDoc, /listener callback cleanup approval: NO-GO/);
}

function assertListenerAddRemoveParityContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Event Listener Add\/Remove Parity Continuation/);
  assert.match(source, /2026-05-28 listener add\/remove parity continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /current add\/remove parity for all 288 tracked `addEventListener`\s+installs\s+and 9 tracked `removeEventListener` teardowns/);
  assert.match(source, /279\s+install-minus-remove delta, 9 capture-equivalent remove pairs, 8 exact\s+option-shape remove pairs, 1 capture-equivalent option-shape mismatch pair, 0\s+remove rows without a capture-equivalent add pair, 51 page-global listener\s+installs without explicit remove, 252 inline listener installs without remove\s+handle, 70 content-runtime add\/remove delta, 201 extension UI\/background\s+delta, 0 generated-output delta, 8 vendor-bundle delta, 0 website-component\s+delta, 5 document listener removes, 2 window listener removes, and 2 generated\s+shell listener removes/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Listener\s+add\/remove cleanup authority, broad lifecycle pruning, route teardown\s+authority, native\/menu timing authority, and `update_goal\(status='complete'\)`\s+remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by this continuation: no; the broad\s+audit remains active/);
  assert.match(lifecycleDoc, /Event Listener Add\/Remove Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /addEventListener install rows for parity: 288/);
  assert.match(lifecycleDoc, /capture-equivalent listener remove pairs: 9/);
  assert.match(lifecycleDoc, /listener add\/remove cleanup approval: NO-GO/);
}

function assertContentRuntimePageGlobalListenerBoundaryContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Content Runtime Page-Global Listener Boundary Continuation/);
  assert.match(source, /2026-05-28 content-runtime page-global listener boundary continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /source-derived boundary evidence for all 42 current content-runtime\s+`document`\/`window` listener rows/);
  assert.match(source, /32 document listener rows, 10\s+window listener rows, 8 source files, 12 quick-block global listener rows, 3\s+native menu global listener rows, 1 Kids passive menu listener row, 5 content\s+bridge prefetch\/whitelist listener rows, 7 content bridge fallback menu\s+listener rows, 1 content bridge main-world message listener row, 2 injector\s+main-world message listener rows, 7 click listener rows, 6 DOMContentLoaded\s+listener rows, 5 `yt-navigate-finish` listener rows, 4 message listener rows,\s+and 4 scroll listener rows/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Content-runtime page-global listener cleanup authority, broad\s+lifecycle pruning, route teardown authority, native\/menu timing authority,\s+page-message trust authority, and `update_goal\(status='complete'\)` remain\s+`NO-GO`/);
  assert.match(source, /Runtime behavior changed by this continuation: no; the broad\s+audit remains active/);
  assert.match(lifecycleDoc, /Content Runtime Page-Global Listener Boundary Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /content runtime page-global listener rows: 42/);
  assert.match(lifecycleDoc, /content runtime page-global listener cleanup approval: NO-GO/);
}

function assertContentRuntimePageGlobalListenerRowContextContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Content Runtime Page-Global Listener Row Context Continuation/);
  assert.match(source, /2026-05-28 content-runtime page-global listener row-context continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /source-derived row context for all 42 current content-runtime\s+`document`\/`window` listener rows/);
  assert.match(source, /42 row-context rows, 16 route\s+scopes, 16 surface scopes, 14 active predicate classes, 20 duplicate-install\s+boundary classes, 12 quick-block enabled-gated rows, 6 fallback menu\s+eager-or-hover gated rows, 4 main-world message source-gated rows, 3 identity\s+prefetch-work gated rows, and 2 whitelist non-watch gated rows/);
  assert.match(source, /ASCII and\s+Mermaid flow diagrams/);
  assert.match(source, /Content-runtime page-global row-context cleanup authority, native\/menu impact\s+authority, page-message trust authority, no-work budget authority, fixture\s+authority, teardown\/page-lifetime justification authority, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Content Runtime Page-Global Listener Row Context Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /content runtime page-global row-context rows: 42/);
  assert.match(lifecycleDoc, /content runtime page-global row-context cleanup approval: NO-GO/);
}

function assertContentRuntimePageGlobalListenerImpactFixtureContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Content Runtime Page-Global Listener Impact And Fixture Continuation/);
  assert.match(source, /2026-05-28 content-runtime page-global listener impact and fixture\s+continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /source-derived impact, trust, no-work, fixture, and page-lifetime evidence for\s+all 42 current content-runtime `document`\/`window` listener rows/);
  assert.match(source, /42 impact rows, 10 native\/menu impact classes, 6 page-message trust\s+classes, 14 no-work budget classes, 13 positive fixture classes, 12 negative\s+fixture classes, 6 page-lifetime classes, 12 quick-block affordance impact\s+rows, 7 custom fallback menu impact rows, 5 page-message impact rows, 37 no\s+page-message trust impact rows, and 30 module singleton page-lifetime rows/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Content-runtime page-global\s+impact\/fixture cleanup authority, native\/menu authority, page-message trust\s+authority, no-work budget authority, fixture authority,\s+teardown\/page-lifetime justification authority, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Content Runtime Page-Global Listener Impact And Fixture Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /content runtime page-global impact rows: 42/);
  assert.match(lifecycleDoc, /content runtime page-global impact\/fixture cleanup approval: NO-GO/);
}

function assertObserverDisconnectContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Observer Disconnect Continuation/);
  assert.match(source, /2026-05-28 observer-disconnect continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /all 10 current tracked observer `\.disconnect\(\)` and optional-chain\s+`\.disconnect\?\.\(\)` invocations/);
  assert.match(source, /5 local `observer` variable\s+disconnects, 2 dropdown close observer disconnects, 1 dropdown discovery\s+observer disconnect, 1 collaborator dialog observer disconnect, and 1 playlist\s+fallback row observer state disconnect/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Observer disconnect cleanup authority, broad\s+lifecycle pruning, route teardown authority, dropdown\/native menu authority,\s+and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed\s+by this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Observer Disconnect Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /observer disconnect rows: 10/);
  assert.match(lifecycleDoc, /observer disconnect cleanup approval: NO-GO/);
}

function assertObserverObserveReleaseParityContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Observer Observe\/Release Parity Continuation/);
  assert.match(source, /2026-05-28 observer observe\/release parity continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /current observe\/release parity for all 17 tracked observer `\.observe\(\.\.\.\)`\s+activation rows and 11 release rows/);
  assert.match(source, /10 `\.disconnect\(\.\.\.\)` or\s+`\.disconnect\?\.\(\.\.\.\)` release rows, 1 `\.unobserve\(\.\.\.\)` release row, a 6\s+observe-minus-release delta, 10 local `observer` observe rows, 2 local `obs`\s+observe rows, 5 exact named observer observe rows, 4 exact named observer\s+observe rows with release, 1 exact named observer observe row without release,\s+1 `prefetchObserver\.observe\(card\)` row without release, 5 content-runtime\s+observe\/release delta, and 1 extension UI\/background observe\/release delta/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Observer\s+observe\/release cleanup authority, broad lifecycle pruning, route teardown\s+authority, dropdown\/native menu authority, and `update_goal\(status='complete'\)`\s+remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by this continuation: no; the broad\s+audit remains active/);
  assert.match(lifecycleDoc, /Observer Observe\/Release Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /observer observe rows for release parity: 17/);
  assert.match(lifecycleDoc, /observer release rows for parity: 11/);
  assert.match(lifecycleDoc, /observer observe-minus-release delta: 6/);
  assert.match(lifecycleDoc, /observer observe\/release cleanup approval: NO-GO/);
}

function assertObserverConstructorObserveTypeParityContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Observer Constructor\/Observe Type Parity Continuation/);
  assert.match(source, /2026-05-28 observer constructor\/observe type parity continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /current constructor\/observe type parity for all 17 observer constructor\s+rows and all 17 tracked observer `\.observe\(\.\.\.\)` activation rows/);
  assert.match(source, /15 `MutationObserver` constructor rows, 2 `IntersectionObserver`\s+constructor rows, 15 mutation observer observe rows, 2 intersection observer\s+observe rows, 0 overall constructor-minus-observe delta, 0 mutation observer\s+constructor-minus-observe delta, 0 intersection observer\s+constructor-minus-observe delta, 0 content-runtime constructor\/observe delta,\s+and 0 extension UI\/background constructor\/observe delta/);
  assert.match(source, /ASCII and Mermaid\s+flow diagrams/);
  assert.match(source, /Observer constructor\/observe type cleanup authority, broad\s+lifecycle pruning, route teardown authority, dropdown\/native menu authority,\s+and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed\s+by this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Observer Constructor\/Observe Type Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /observer constructor rows for type parity: 17/);
  assert.match(lifecycleDoc, /observer constructor-minus-observe delta: 0/);
  assert.match(lifecycleDoc, /observer constructor\/observe type cleanup approval: NO-GO/);
}

function assertObserverConstructorCallbackIdentityContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Observer Constructor Callback Identity Continuation/);
  assert.match(source, /2026-05-28 observer constructor callback identity continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /current callback argument shape for all 17 observer constructors/);
  assert.match(source, /17 inline arrow observer constructor callbacks, 0 identifier observer\s+constructor callbacks, 0 missing observer constructor callbacks, 9 observer\s+callbacks with a `mutations` parameter, 2 observer callbacks with an `entries`\s+parameter, 6 observer callbacks with no parameter, 16 content-runtime observer\s+constructor callbacks, and 1 extension UI\/background observer constructor\s+callback/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Observer constructor callback cleanup authority, broad lifecycle\s+pruning, route teardown authority, dropdown\/native menu authority, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Observer Constructor Callback Identity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /observer constructor callback rows: 17/);
  assert.match(lifecycleDoc, /inline arrow observer constructor callbacks: 17/);
  assert.match(lifecycleDoc, /observer constructor callback cleanup approval: NO-GO/);
}

function assertTimerDelayShapeContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Timer Delay Shape Continuation/);
  assert.match(source, /2026-05-28 timer-delay shape continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /delay argument shape for all 126 current tracked `setTimeout` and\s+`setInterval` schedules/);
  assert.match(source, /123 `setTimeout` delay rows, 3\s+`setInterval` delay rows, 16 zero-delay timers, 16 1-99ms timers, 18\s+100-199ms timers, 17 200-999ms timers, 13 1000-4999ms timers, 4 5000ms-plus\s+timers, 37 named\/expression timers, 5 `Math\.max\(\.\.\.\)` expression timers, and\s+0 missing delay arguments/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Timer\s+delay cleanup authority, broad lifecycle pruning, route teardown authority,\s+native\/menu timing authority, and `update_goal\(status='complete'\)` remain\s+`NO-GO`/);
  assert.match(source, /Runtime behavior changed by this continuation: no; the broad audit\s+remains active/);
  assert.match(lifecycleDoc, /Timer Delay Shape Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /timer delay rows: 126/);
  assert.match(lifecycleDoc, /timer delay cleanup approval: NO-GO/);
}

function assertTimerCallbackIdentityContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Timer Callback Identity Continuation/);
  assert.match(source, /2026-05-28 timer-callback identity continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /callback argument shape for all 126 current tracked `setTimeout` and\s+`setInterval` schedules/);
  assert.match(source, /123 `setTimeout` callback rows, 3\s+`setInterval` callback rows, 107 inline arrow timer callbacks, 19 identifier\s+timer callbacks, 0 inline function timer callbacks, 0 member-reference timer\s+callbacks, 0 missing callback arguments, 86 content-runtime timer callbacks,\s+39 extension UI\/background timer callbacks, and 1 website-component timer\s+callback/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Timer callback cleanup authority, broad lifecycle pruning, route\s+teardown authority, native\/menu timing authority, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Timer Callback Identity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /timer callback rows: 126/);
  assert.match(lifecycleDoc, /timer callback cleanup approval: NO-GO/);
}

function assertTimerScheduleClearParityContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Timer Schedule\/Clear Parity Continuation/);
  assert.match(source, /2026-05-28 timer schedule\/clear parity continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /current schedule\/clear parity for all 123 tracked `setTimeout` schedules,\s+34 tracked `clearTimeout` rows, 3 tracked `setInterval` schedules, and 4\s+tracked `clearInterval` rows/);
  assert.match(source, /89 timeout schedule-minus-clear\s+delta, -1 interval schedule-minus-clear delta, 11 timeout schedules with\s+assigned local id handles, 24 assigned named state handles, 10 assigned\s+property-held handles, 63 fire-and-forget schedules, 14 promise sleep\/timeout\s+schedules, 1 returned timer handle schedule, 3 interval schedules with assigned\s+named state handles, 32 `clearTimeout` rows with direct schedule handle, 2\s+`clearTimeout` rows without direct schedule handle, 26 handled timeout schedule\s+rows with clear handle, 19 handled timeout schedule rows without clear handle,\s+18 distinct scheduled timeout handles without clear, 4 `clearInterval` rows\s+with direct schedule handle, 0 `clearInterval` rows without direct schedule\s+handle, 3 handled interval schedule rows with clear handle, 0 handled interval\s+schedule rows without clear handle, and 0 distinct scheduled interval handles\s+without clear/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Timer schedule\/clear cleanup authority,\s+broad lifecycle pruning, route teardown authority, native\/menu timing\s+authority, and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime\s+behavior changed by this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Timer Schedule\/Clear Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /setTimeout schedule rows for parity: 123/);
  assert.match(lifecycleDoc, /timer schedule\/clear cleanup approval: NO-GO/);
}

function assertTimerOwnerDomainContextContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Timer Owner Domain Context Continuation/);
  assert.match(source, /2026-05-30 timer owner-domain context continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /owner-domain context for all 126 current tracked timer schedule\s+rows/);
  assert.match(source, /123 `setTimeout` rows, 3 `setInterval` rows, 13 timer\s+owner domains, 86 content-runtime timer owner-context rows, 39 extension\s+UI\/background timer owner-context rows, 1 website component timer owner-context\s+row/);
  assert.match(source, /37 content bridge timer rows, 16 quick\/menu timer rows, 15 dashboard timer\s+rows, 10 background timer rows, 10 DOM fallback timer rows/);
  assert.match(source, /Timer\s+owner-context cleanup authority, timer pruning, route teardown authority,\s+native\/menu timing authority, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Timer Owner Domain Context Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer owner-context rows: 126/);
  assert.match(lifecycleDoc, /timer owner domains: 13/);
  assert.match(lifecycleDoc, /timer owner-context cleanup approval: NO-GO/);
}

function assertTimerOwnerDelayBudgetContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Timer Owner Delay Budget Continuation/);
  assert.match(source, /2026-05-30 timer owner delay-budget continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /delay-budget context for all 126 current tracked timer schedule\s+rows by owner domain/);
  assert.match(source, /16 immediate-zero timer rows, 34\s+short-under-200ms timer rows, 17 medium-200-999ms timer rows, 17\s+long-1000ms-plus timer rows, 5 bounded-expression timer rows, 37\s+named-or-expression timer rows/);
  assert.match(source, /13 content bridge immediate-or-short timer\s+rows, 9 quick\/menu immediate-or-short timer rows, 6 DOM fallback\s+immediate-or-short timer rows, and 5 dashboard immediate-or-short timer rows/);
  assert.match(source, /Timer\s+owner delay-budget cleanup authority, timer pruning, route teardown authority,\s+native\/menu timing authority, whitelist\/cache optimization, JSON-first\s+promotion, release\/public-claim use, and `update_goal\(status='complete'\)`\s+remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by this continuation: no; the broad\s+audit remains active/);
  assert.match(lifecycleDoc, /Timer Owner Delay Budget Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer owner delay-budget rows: 126/);
  assert.match(lifecycleDoc, /timer owner short-under-200ms budget rows: 34/);
  assert.match(lifecycleDoc, /timer owner delay-budget cleanup approval: NO-GO/);
}

function assertTimerImmediateShortRowContextContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Timer Immediate\/Short Row Context Continuation/);
  assert.match(source, /2026-05-30 timer immediate\/short row-context continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /side-effect context for the 50 current zero-delay and\s+sub-200ms timer rows/);
  assert.match(source, /50 immediate\/short timer context rows, 10\s+owner domains, 31 side-effect classes, 13 content bridge context rows, 9\s+quick\/menu context rows, 6 DOM fallback context rows/);
  assert.match(source, /3 native dropdown\s+injection timer rows, 4 DOM fallback playlist navigation timer rows, and 2\s+content bridge whitelist refresh timer rows/);
  assert.match(source, /Immediate\/short timer cleanup authority, timer delay\s+changes, route teardown authority, native\/menu timing authority,\s+whitelist\/cache optimization, JSON-first promotion, release\/public-claim use,\s+and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed\s+by this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Timer Immediate\/Short Row Context Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer immediate-short context rows: 50/);
  assert.match(lifecycleDoc, /timer immediate-short side-effect classes: 31/);
  assert.match(lifecycleDoc, /timer immediate-short context cleanup approval: NO-GO/);
}

function assertTimerImmediateShortAdmissionGateContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Timer Immediate\/Short Admission Gate Continuation/);
  assert.match(source, /2026-05-30 timer immediate\/short admission-gate continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /50 zero-delay and sub-200ms timer rows to their source-derived\s+admission trigger families/);
  assert.match(source, /50 immediate\/short timer admission\s+rows, 4 admission families, 29 admission trigger classes, 22 user\/menu\/\s+navigation admission rows, 11 DOM rerun\/scan admission rows, 9 bootstrap\/\s+readiness admission rows, 8 storage\/cache admission rows/);
  assert.match(source, /2 whitelist\s+non-watch observer admission rows, 3 native dropdown injection trigger rows,\s+and 4 watch playlist navigation admission rows/);
  assert.match(source, /boot\/readiness work, menu\/user work,\s+DOM rerun work, and storage\/cache work are not interchangeable optimization\s+targets/);
  assert.match(source, /Immediate\/short timer admission cleanup authority, timer delay\s+changes, route teardown authority, native\/menu timing authority,\s+whitelist\/cache optimization, JSON-first promotion, release\/public-claim use,\s+and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed\s+by this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Timer Immediate\/Short Admission Gate Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer immediate-short admission rows: 50/);
  assert.match(lifecycleDoc, /timer immediate-short admission trigger classes: 29/);
  assert.match(lifecycleDoc, /timer immediate-short admission cleanup approval: NO-GO/);
}

function assertTimerImmediateShortNoWorkPredicateContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Timer Immediate\/Short No-Work Predicate Continuation/);
  assert.match(source, /2026-05-30 timer immediate\/short no-work predicate continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /50 zero-delay and sub-200ms timer rows to their source-derived\s+active\/no-work predicate classes/);
  assert.match(source, /50 immediate\/short timer\s+no-work predicate rows, 7 predicate classes, 20 direct user-action gated rows,\s+2 page-global user-input gated rows, 2 explicit list-mode route-gated rows, 4\s+eager surface-gated rows/);
  assert.match(source, /5 DOM fallback inherited rows, 9\s+bootstrap\/readiness gated rows, and 8 storage dirty-state gated rows/);
  assert.match(source, /some are user-action correctness paths, some are bootstrap\/setup paths, some\s+are storage freshness paths, and some inherit DOM fallback caller risk/);
  assert.match(source, /Immediate\/short timer no-work predicate cleanup authority, timer delay changes,\s+route teardown authority, native\/menu timing authority, whitelist\/cache\s+optimization, JSON-first promotion, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Timer Immediate\/Short No-Work Predicate Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer immediate-short no-work predicate rows: 50/);
  assert.match(lifecycleDoc, /timer immediate-short no-work predicate classes: 7/);
  assert.match(lifecycleDoc, /timer immediate-short no-work predicate cleanup approval: NO-GO/);
}

function assertTimerImmediateShortSurfaceOwnershipContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Timer Immediate\/Short Surface Ownership Continuation/);
  assert.match(source, /2026-05-30 timer immediate\/short surface ownership continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /same 50 zero-delay and sub-200ms timer rows to their source-derived\s+route\/surface ownership classes/);
  assert.match(source, /50 immediate\/short timer\s+surface rows, 7 surface classes, 33 YouTube SPA content runtime rows, 5\s+extension dashboard UI rows, 2 extension popup UI rows/);
  assert.match(source, /3 content prompt\s+overlay rows, 2 background storage runtime rows, 4 state\/import runtime rows,\s+and 1 extension UI render-engine row/);
  assert.match(source, /the\s+hot timer set is not all YouTube SPA work, but 33 rows are still YouTube\s+content-surface owned/);
  assert.match(source, /Immediate\/short timer surface cleanup authority, timer delay\s+changes, route teardown authority, native\/menu timing authority,\s+whitelist\/cache optimization, JSON-first promotion, release\/public-claim use,\s+and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed\s+by this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /Timer Immediate\/Short Surface Ownership Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer immediate-short surface rows: 50/);
  assert.match(lifecycleDoc, /YouTube SPA content immediate-short timer rows: 33/);
  assert.match(lifecycleDoc, /timer immediate-short surface cleanup approval: NO-GO/);
}

function assertYouTubeSpaImmediateShortPredicateCrosswalkContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /YouTube SPA Immediate\/Short Predicate Crosswalk Continuation/);
  assert.match(source, /2026-05-30 YouTube SPA immediate\/short predicate crosswalk continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /narrows\s+the 50 immediate\/short timer rows to the 33 YouTube SPA content-surface rows\s+and cross-checks them against the source-derived active\/no-work predicates/);
  assert.match(source, /33 YouTube SPA immediate\/short predicate crosswalk rows, 7\s+predicate classes, 12 direct user-action gated rows, 6 bootstrap\/readiness\s+gated rows, 5 DOM fallback inherited rows/);
  assert.match(source, /4 eager surface-gated rows, 2\s+explicit list-mode route-gated rows, 2 page-global user-input gated rows, and\s+2 storage dirty-state gated rows/);
  assert.match(source, /separating\s+idle-lag candidates from user-action correctness paths, setup readiness paths,\s+storage freshness paths, and whitelist route\/mode paths/);
  assert.match(source, /YouTube SPA\s+immediate\/short predicate crosswalk cleanup authority, timer delay changes,\s+route teardown authority, native\/menu timing authority, whitelist\/cache\s+optimization, JSON-first promotion, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /YouTube SPA Immediate\/Short Predicate Crosswalk Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA immediate-short predicate crosswalk rows: 33/);
  assert.match(lifecycleDoc, /YouTube SPA direct user-action gated hot timer rows: 12/);
  assert.match(lifecycleDoc, /YouTube SPA immediate-short predicate crosswalk cleanup approval: NO-GO/);
}

function assertYouTubeSpaEagerHotTimerCandidateContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /YouTube SPA Eager Hot Timer Candidate Continuation/);
  assert.match(source, /2026-05-30 YouTube SPA eager hot timer candidate continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /narrows\s+the 33 YouTube SPA immediate\/short timer rows to the 4 rows whose active\s+predicate is `eager-surface-gated`/);
  assert.match(source, /4 YouTube SPA eager hot\s+timer rows, 2 candidate classes, 3 fallback menu eager hot timer rows, 1\s+quick-block eager sweep hot timer row/);
  assert.match(source, /4 rule-list independent YouTube SPA\s+eager hot timer rows/);
  assert.match(source, /identifying the strongest\s+timer cleanup candidates while preserving the current `NO-GO` boundary/);
  assert.match(source, /fallback menu controls and quick-block controls are user-facing affordances,\s+not safe deletion targets without route, surface, no-rule, and false-hide\/leak\s+proof/);
  assert.match(source, /YouTube SPA eager hot timer cleanup authority, timer delay changes,\s+route teardown authority, native\/menu timing authority, quick-block affordance\s+changes, whitelist\/cache optimization, JSON-first promotion,\s+release\/public-claim use, and `update_goal\(status='complete'\)` remain\s+`NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Eager Hot Timer Candidate Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA eager hot timer rows: 4/);
  assert.match(lifecycleDoc, /fallback menu eager hot timer rows: 3/);
  assert.match(lifecycleDoc, /YouTube SPA eager hot timer cleanup approval: NO-GO/);
}

function assertYouTubeSpaEagerHotTimerRouteAdmissionContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /YouTube SPA Eager Hot Timer Route Admission Continuation/);
  assert.match(source, /2026-05-30 YouTube SPA eager hot timer route admission continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /binds\s+the 4 YouTube SPA eager hot timer candidates to their route\/surface admission\s+predicates/);
  assert.match(source, /4 route admission rows, 3 fallback menu\s+mobile\/coarse route-admitted rows, 1 quick-block mobile\/coarse route-admitted\s+row, 0 source-admitted desktop hover\/fine eager hot timer rows/);
  assert.match(source, /no shared eager\s+surface classifier exists/);
  assert.match(source, /these 4 candidates are plausible on mobile\/coarse or\s+coarse-reported desktops, but current source does not admit them as normal\s+desktop hover\/fine idle work/);
  assert.match(source, /Route admission cleanup authority, timer delay\s+changes, route teardown authority, native\/menu timing authority, quick-block\s+affordance changes, whitelist\/cache optimization, JSON-first promotion,\s+release\/public-claim use, and `update_goal\(status='complete'\)` remain\s+`NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Eager Hot Timer Route Admission Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA eager hot timer route admission rows: 4/);
  assert.match(lifecycleDoc, /source-admitted desktop hover\/fine eager hot timer rows: 0/);
  assert.match(lifecycleDoc, /YouTube SPA eager hot timer route admission cleanup approval: NO-GO/);
}

function assertYouTubeSpaDesktopResidualHotTimerContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /YouTube SPA Desktop Hover\/Fine Residual Hot Timer Continuation/);
  assert.match(source, /2026-05-30 YouTube SPA desktop hover\/fine residual hot timer continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /classifies the 29 residual YouTube SPA immediate\/short timer rows that remain\s+after excluding the 4 mobile\/coarse eager-surface rows/);
  assert.match(source, /29\s+desktop hover\/fine residual hot timer rows, 6 residual predicate classes, 12\s+direct user-action gated rows, 6 bootstrap\/readiness gated rows, 5 DOM\s+fallback inherited rows/);
  assert.match(source, /2 explicit list-mode route-gated rows, 2 page-global\s+user-input gated rows, 2 storage dirty-state gated rows, and 0 residual\s+eager-surface gated rows/);
  assert.match(source, /normal desktop\s+hover\/fine lag investigation should focus on startup\/readiness, inherited DOM\s+fallback, storage dirty-state, page-global input, whitelist route, and\s+user-action timing, not mobile\/coarse eager rows/);
  assert.match(source, /Desktop residual cleanup\s+authority, timer delay changes, route teardown authority, native\/menu timing\s+authority, quick-block affordance changes, whitelist\/cache optimization,\s+JSON-first promotion, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Hover\/Fine Residual Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA desktop hover\/fine residual hot timer rows: 29/);
  assert.match(lifecycleDoc, /desktop residual eager-surface gated hot timer rows: 0/);
  assert.match(lifecycleDoc, /YouTube SPA desktop hover\/fine residual cleanup approval: NO-GO/);
}

function assertYouTubeSpaDesktopDirectUserActionHotTimerContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /YouTube SPA Desktop Direct User-Action Hot Timer Continuation/);
  assert.match(source, /2026-05-30 YouTube SPA desktop direct user-action hot timer continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /classifies the 12 `direct-user-action-gated` rows inside the 29 desktop\s+hover\/fine residual hot timer rows/);
  assert.match(source, /12 desktop direct\s+user-action hot timer rows, 12 `setTimeout` rows, 4 `content_bridge` rows,\s+4 `block_channel` rows, 4 `dom_fallback` rows, 3 native dropdown injection\s+rows, 2 block-action menu close rows, 4 watch playlist navigation rows/);
  assert.match(source, /explicit menu\/navigation timers must be separated from startup\/readiness,\s+DOM-fallback inherited reruns, storage dirty-state debounces, explicit\s+list-mode route refresh, page-global quick-block input refresh, and\s+mobile\/coarse eager affordance work/);
  assert.match(source, /Desktop direct user-action cleanup\s+authority, native\/menu timing rewrites, timer delay changes, menu close\s+rewrites, playlist navigation rewrites, quick-block fallback rewrites,\s+whitelist\/cache optimization, JSON-first promotion, release\/public-claim use,\s+and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Direct User-Action Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA desktop direct user-action hot timer rows: 12/);
  assert.match(lifecycleDoc, /desktop direct user-action watch playlist navigation rows: 4/);
  assert.match(lifecycleDoc, /desktop direct user-action cleanup approval: NO-GO/);
}

function assertYouTubeSpaDesktopStartupReadinessHotTimerContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /YouTube SPA Desktop Startup\/Readiness Hot Timer Continuation/);
  assert.match(source, /2026-05-30 YouTube SPA desktop startup\/readiness hot timer continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /classifies the 6 bootstrap\/readiness gated rows inside the 29 desktop\s+hover\/fine residual hot timer rows/);
  assert.match(source, /6 desktop startup\/readiness\s+hot timer rows, 5 `setTimeout` rows, 1 `setInterval` row, 1 content bridge\s+startup row, 2 bridge injection rows, 2 quick\/menu body readiness rows, and\s+1 injector readiness poll row/);
  assert.match(source, /startup\/injection\/body readiness timing must be measured separately from\s+per-card rule matching, JSON filtering, DOM fallback scans, and user-action\s+menu timing/);
  assert.match(source, /Desktop startup\/readiness cleanup authority, timer delay changes,\s+route teardown authority, native\/menu timing authority, bridge injection\s+changes, whitelist\/cache optimization, JSON-first promotion,\s+release\/public-claim use, and `update_goal\(status='complete'\)` remain\s+`NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Startup\/Readiness Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA desktop startup\/readiness hot timer rows: 6/);
  assert.match(lifecycleDoc, /desktop startup\/readiness setTimeout rows: 5/);
  assert.match(lifecycleDoc, /desktop startup\/readiness cleanup approval: NO-GO/);
}

function assertYouTubeSpaDesktopDomFallbackInheritedHotTimerContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /YouTube SPA Desktop DOM-Fallback Inherited Hot Timer Continuation/);
  assert.match(source, /2026-05-30 YouTube SPA desktop DOM-fallback inherited hot timer continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /classifies the 5 `dom-fallback-run-inherited` rows inside the 29 desktop\s+hover\/fine residual hot timer rows/);
  assert.match(source, /5 desktop DOM-fallback\s+inherited hot timer rows, 5 `setTimeout` rows, 3 `content_bridge` rows,\s+2 `dom_fallback` rows, 2 collaborator rerun rows, 1 identity stamp rerun row,\s+1 active yield row, and 1 pending rerun row/);
  assert.match(source, /inherited DOM fallback work must be separated from\s+startup\/readiness, mobile\/coarse eager affordance work, JSON filtering,\s+whitelist route timing, and direct user-action menu timing/);
  assert.match(source, /Desktop\s+DOM-fallback inherited cleanup authority, timer delay changes, route teardown\s+authority, collaborator rerun changes, identity-stamp rerun changes,\s+whitelist\/cache optimization, JSON-first promotion, release\/public-claim use,\s+and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop DOM-Fallback Inherited Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA desktop DOM-fallback inherited hot timer rows: 5/);
  assert.match(lifecycleDoc, /desktop DOM-fallback collaborator rerun rows: 2/);
  assert.match(lifecycleDoc, /desktop DOM-fallback inherited cleanup approval: NO-GO/);
}

function assertYouTubeSpaDesktopStorageDirtyStateHotTimerContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /YouTube SPA Desktop Storage Dirty-State Hot Timer Continuation/);
  assert.match(source, /2026-05-30 YouTube SPA desktop storage dirty-state hot timer continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /classifies the 2 `storage-dirty-state-gated` rows inside the 29 desktop\s+hover\/fine residual hot timer rows/);
  assert.match(source, /2 desktop storage\s+dirty-state hot timer rows, 2 `setTimeout` rows, 2 `filter_logic` rows,\s+1 `videoChannelMap` flush row, 1 `videoMetaMap` flush row, and 2 bridge\s+message consumers/);
  assert.match(source, /page-world learned metadata batching must be separated from DOM fallback\s+scans, startup\/readiness, mobile\/coarse eager affordance work, whitelist route\s+timing, and direct user-action menu timing/);
  assert.match(source, /Desktop storage dirty-state\s+cleanup authority, timer delay changes, route teardown authority, map\s+freshness rewrites, bridge message rewrites, whitelist\/cache optimization,\s+JSON-first promotion, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Storage Dirty-State Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA desktop storage dirty-state hot timer rows: 2/);
  assert.match(lifecycleDoc, /desktop storage dirty-state videoMetaMap flush rows: 1/);
  assert.match(lifecycleDoc, /desktop storage dirty-state cleanup approval: NO-GO/);
}

function assertYouTubeSpaDesktopExplicitListModeRouteHotTimerContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /YouTube SPA Desktop Explicit List-Mode Route Hot Timer Continuation/);
  assert.match(source, /2026-05-30 YouTube SPA desktop explicit list-mode route hot timer\s+continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /classifies the 2 `explicit-list-mode-route-gated` rows inside the 29 desktop\s+hover\/fine residual hot timer rows/);
  assert.match(source, /2 desktop explicit\s+list-mode route hot timer rows, 2 `setTimeout` rows, 1 immediate refresh row,\s+1 follow-up refresh row, 2 `content_bridge` rows, and 2 force-reprocess rows/);
  assert.match(source, /whitelist-mode non-watch\s+route refresh timing must be separated from storage dirty-state debounces, DOM\s+fallback inherited reruns, startup\/readiness, mobile\/coarse eager affordance\s+work, page-global quick-block input refresh, and direct user-action menu\s+timing/);
  assert.match(source, /Desktop explicit list-mode route cleanup authority, timer delay\s+changes, route teardown authority, whitelist refresh rewrites, DOM fallback\s+pruning, whitelist\/cache optimization, JSON-first promotion,\s+release\/public-claim use, and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Explicit List-Mode Route Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA desktop explicit list-mode route hot timer rows: 2/);
  assert.match(lifecycleDoc, /desktop explicit list-mode route force reprocess rows: 2/);
  assert.match(lifecycleDoc, /desktop explicit list-mode route cleanup approval: NO-GO/);
}

function assertYouTubeSpaDesktopPageGlobalQuickBlockRefreshHotTimerContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /YouTube SPA Desktop Page-Global Quick-Block Refresh Hot Timer Continuation/);
  assert.match(source, /2026-05-30 YouTube SPA desktop page-global quick-block refresh hot timer\s+continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /classifies the 2 `page-global-user-input-gated` rows inside the 29 desktop\s+hover\/fine residual hot timer rows/);
  assert.match(source, /2 desktop page-global\s+quick-block refresh hot timer rows, 2 `setTimeout` rows, 1 focusout refresh\s+row, 1 click refresh row, and 2 runtime refresh rows/);
  assert.match(source, /broad page-level quick-block refresh work must be\s+separated from storage dirty-state debounces, DOM fallback scans,\s+startup\/readiness, mobile\/coarse eager affordance work, whitelist route\s+timing, and direct block-action menu timing/);
  assert.match(source, /Desktop page-global quick-block\s+cleanup authority, timer delay changes, route teardown authority, native\/menu\s+timing rewrites, quick-block refresh rewrites, whitelist\/cache optimization,\s+JSON-first promotion, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Page-Global Quick-Block Refresh Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA desktop page-global quick-block refresh hot timer rows: 2/);
  assert.match(lifecycleDoc, /desktop page-global quick-block click refresh rows: 1/);
  assert.match(lifecycleDoc, /desktop page-global quick-block cleanup approval: NO-GO/);
}

function assertYouTubeSpaDesktopResidualHotTimerClassClosureContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /YouTube SPA Desktop Residual Hot Timer Class-Closure Continuation/);
  assert.match(source, /2026-05-30 YouTube SPA desktop residual hot timer class-closure continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /joins the six predicate-specific desktop residual timer addenda back to the\s+full 29-row desktop hover\/fine residual set/);
  assert.match(source, /29 desktop\s+residual class-closure hot timer rows, 6 predicate classes, 6 source files,\s+12 direct user-action rows, 6 startup\/readiness rows, 5 DOM-fallback inherited\s+rows, 2 storage dirty-state rows, 2 page-global quick-block rows, 2 explicit\s+list-mode route rows/);
  assert.match(source, /10 `content_bridge` rows, 8 `block_channel` rows,\s+6 `dom_fallback` rows, 2 `bridge_injection` rows, 2 `filter_logic` rows, and\s+1 `injector` row/);
  assert.match(source, /the full residual set is\s+classified, but cleanup authority must stay per predicate\/source owner rather\s+than becoming a blanket timer rewrite/);
  assert.match(source, /Desktop residual class-closure cleanup\s+authority, timer delay changes, owner merges, route teardown authority,\s+native\/menu timing rewrites, whitelist\/cache optimization, JSON-first\s+promotion, release\/public-claim use, and `update_goal\(status='complete'\)`\s+remain `NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Residual Hot Timer Class-Closure Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA desktop residual class-closure hot timer rows: 29/);
  assert.match(lifecycleDoc, /desktop residual class-closure source files: 6/);
  assert.match(lifecycleDoc, /desktop residual class-closure cleanup approval: NO-GO/);
}

function assertYouTubeSpaRuntimeOptimizationBoundaryContinuation(source) {
  const readinessDoc = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');

  assert.match(source, /YouTube SPA Runtime Optimization Boundary Continuation/);
  assert.match(source, /2026-05-30 YouTube SPA runtime optimization boundary continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/implementation-readiness-gate-current-behavior.test.mjs'));
  assert.match(source, /pull the hot YouTube SPA lifecycle findings into the global implementation\s+gate/);
  assert.match(source, /8 YouTube SPA runtime optimization rows, 33 classified\s+YouTube SPA hot timer lifecycle rows, 29 classified desktop residual lifecycle\s+rows, 4 classified mobile\/coarse eager lifecycle rows/);
  assert.match(source, /0 implementation-ready\s+YouTube SPA runtime optimization rows, and ASCII\/Mermaid runtime optimization\s+boundary flow diagrams/);
  assert.match(source, /broad timer cleanup,\s+observer\/listener cleanup, DOM fallback pruning, whitelist cache optimization,\s+JSON-first promotion, quick-block behavior changes, native menu timing changes,\s+release\/public-claim use, and `update_goal\(status='complete'\)` remain\s+`NO-GO`/);
  assert.match(readinessDoc, /YouTube SPA Runtime Optimization Boundary - 2026-05-30/);
  assert.match(readinessDoc, /YouTube SPA runtime optimization boundary rows: 8/);
  assert.match(readinessDoc, /implementation-ready YouTube SPA runtime optimization rows: 0/);
  assert.match(readinessDoc, /runtime YouTube SPA optimization patch approval: NO-GO/);
}

function assertExplicitTeardownHandleContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Explicit Teardown Handle Continuation/);
  assert.match(source, /2026-05-28 explicit-teardown handle continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /handle or target expression shape for all 50 current tracked\s+`removeEventListener`, `clearTimeout`, `clearInterval`, and\s+`cancelAnimationFrame` rows/);
  assert.match(source, /9 `removeEventListener` rows, 34\s+`clearTimeout` rows, 4 `clearInterval` rows, 3 `cancelAnimationFrame` rows, 5\s+listener document targets, 2 listener window targets, 2 generated shell\s+listener targets, 12 local timeout id handles, 14 named timeout state handles,\s+8 property-held timeout handles, 2 engine-check interval handles, 1 warmup\s+interval handle, 1 dashboard rotation interval handle, 2 profile dropdown\s+frame handles, and 1 generic position frame handle/);
  assert.match(source, /ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /Explicit teardown cleanup\s+authority, broad lifecycle pruning, route teardown authority, native\/menu\s+timing authority, and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by this continuation: no; the broad audit remains\s+active/);
  assert.match(lifecycleDoc, /Explicit Teardown Handle Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /explicit teardown handle rows: 50/);
  assert.match(lifecycleDoc, /explicit teardown cleanup approval: NO-GO/);
}

function assertAnimationFrameScheduleContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Animation Frame Schedule Continuation/);
  assert.match(source, /2026-05-28 animation-frame schedule continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /callback or handle shape for all 29 current tracked `requestAnimationFrame`\s+schedules/);
  assert.match(source, /2 assigned positioning frame handles, 15 inline\s+anonymous frame callbacks, 5 identifier callback frames, 5 inline\s+`scrollIntoView` frames, 2 inline timeout-hop frames, 13 content-runtime frame\s+schedules, 16 extension UI\/background frame schedules, 1 `positionRaf`\s+assignment, and 1 `profileDropdownPositionRaf` assignment/);
  assert.match(source, /ASCII and\s+Mermaid flow diagrams/);
  assert.match(source, /Animation\s+frame schedule cleanup authority, broad lifecycle pruning, route teardown\s+authority, native\/menu timing authority, and `update_goal\(status='complete'\)`\s+remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by this continuation: no; the broad\s+audit remains active/);
  assert.match(lifecycleDoc, /Animation Frame Schedule Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /requestAnimationFrame schedule rows: 29/);
  assert.match(lifecycleDoc, /animation frame schedule cleanup approval: NO-GO/);
}

function assertAnimationFrameScheduleCancelParityContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Animation Frame Schedule\/Cancel Parity Continuation/);
  assert.match(source, /2026-05-28 animation-frame schedule\/cancel parity continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /joins all\s+29 current tracked `requestAnimationFrame` schedule rows and 3 current\s+`cancelAnimationFrame` rows by direct lexical handle where one exists/);
  assert.match(source, /26 frame schedule-minus-cancel delta, 27 frame schedules without\s+assigned handles, 2 frame schedules with assigned handles, 3\s+`cancelAnimationFrame` rows with direct schedule handles, 0\s+`cancelAnimationFrame` rows without direct schedule handles, 2 handled frame\s+schedule rows with cancel handles, 0 handled frame schedule rows without cancel\s+handles, 0 distinct scheduled frame handles without cancel, 13 content-runtime\s+frame schedule\/cancel delta, 13 extension UI\/background frame schedule\/cancel\s+delta, 1 `positionRaf` cancel row, and 2 `profileDropdownPositionRaf` cancel\s+rows/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Animation frame schedule\/cancel cleanup\s+authority, broad lifecycle pruning, route teardown authority, native\/menu\s+timing authority, and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by this continuation: no; the broad audit remains\s+active/);
  assert.match(lifecycleDoc, /Animation Frame Schedule\/Cancel Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /requestAnimationFrame schedule rows for parity: 29/);
  assert.match(lifecycleDoc, /cancelAnimationFrame rows for parity: 3/);
  assert.match(lifecycleDoc, /animation frame schedule\/cancel cleanup approval: NO-GO/);
}

function assertBackgroundTimerOwnerReasonContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Background Timer Owner\/Reason Continuation/);
  assert.match(source, /2026-05-28 background timer owner\/reason continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /owner domain and reason for all 14 current tracked `js\/background\.js`\s+timer lifecycle rows/);
  assert.match(source, /10 `setTimeout` schedule rows, 4\s+`clearTimeout` rows, 3 backup\/download lifecycle rows, 2 post-block enrichment\s+rows, 3 identity map flush lifecycle rows, 6 identity fetch network timeout\s+rows/);
  assert.match(source, /1 auto-backup debounce schedule row, 1 auto-backup debounce clear row,\s+1 blob URL revoke delay row, 1 post-block enrichment wait-cap row, 1\s+post-block enrichment jitter row, 1 channel map flush debounce row, 1 video\s+channel map flush debounce row, 1 video meta map flush debounce row, 3 fetch\s+abort timeout schedule rows, 3 fetch abort timeout clear rows, and 0 explicit\s+revision-token rows/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Background timer owner\/reason cleanup\s+authority, broad lifecycle pruning, background cache revision authority,\s+release\/public-claim use, and `update_goal\(status='complete'\)` remain\s+`NO-GO`/);
  assert.match(source, /Runtime behavior changed by this continuation: no; the broad audit\s+remains active/);
  assert.match(lifecycleDoc, /Background Timer Owner\/Reason Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /background timer lifecycle rows: 14/);
  assert.match(lifecycleDoc, /background timer owner\/reason cleanup approval: NO-GO/);
}

function assertGeneratedVendorLifecycleFreshnessContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Generated\/Vendor Lifecycle Freshness Continuation/);
  assert.match(source, /2026-05-28 generated\/vendor lifecycle freshness continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /source-derived freshness class evidence for all 12 generated\/vendor lifecycle\s+rows/);
  assert.match(source, /8 vendor-bundle lifecycle rows, 4 generated-shell output\s+lifecycle rows, 8 vendor `addEventListener` rows, 0 vendor\s+`removeEventListener` rows, 2 generated-shell `addEventListener` rows, 2\s+generated-shell `removeEventListener` rows/);
  assert.match(source, /2 generated-shell lifecycle files,\s+1 vendor lifecycle file, 3 generated-shell source files, 2 generated-shell\s+output files, 1 generated UI build script file, 2 vendor bundle files, and 0\s+committed generated freshness manifest files/);
  assert.match(source, /ASCII and Mermaid flow\s+diagrams/);
  assert.match(source, /Generated\/vendor lifecycle freshness cleanup\s+authority, broad lifecycle pruning, release package freshness authority,\s+release\/public-claim use, and `update_goal\(status='complete'\)` remain\s+`NO-GO`/);
  assert.match(source, /Runtime behavior changed by this continuation: no; the broad audit\s+remains active/);
  assert.match(lifecycleDoc, /Generated\/Vendor Lifecycle Freshness Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /generated\/vendor lifecycle rows: 12/);
  assert.match(lifecycleDoc, /generated\/vendor lifecycle freshness cleanup approval: NO-GO/);
}

function assertWebsiteComponentLifecycleBoundaryContinuation(source) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(source, /Website Component Lifecycle Boundary Continuation/);
  assert.match(source, /2026-05-28 website component lifecycle boundary continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(source, /source-derived lifecycle boundary evidence for all 9 current website component\s+lifecycle rows/);
  assert.match(source, /4 install-or-schedule rows, 5\s+explicit-teardown rows, 3 website component `addEventListener` rows, 3 website\s+component `removeEventListener` rows, 1 website component `setTimeout` row, 2\s+website component `clearTimeout` rows, 2 website lifecycle source files, 5\s+scene scheduler lifecycle rows, 4 theme sync lifecycle rows, 2 scene scheduler\s+install-or-schedule rows, 3 scene scheduler explicit-teardown rows, 2 theme\s+sync install-or-schedule rows, and 2 theme sync explicit-teardown rows/);
  assert.match(source, /ASCII and Mermaid flow diagrams/);
  assert.match(source, /Website component lifecycle cleanup authority, broad lifecycle pruning, website\s+deploy\/public-claim use, route hydration authority, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by this continuation: no; the broad audit remains\s+active/);
  assert.match(lifecycleDoc, /Website Component Lifecycle Boundary Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /website component lifecycle rows: 9/);
  assert.match(lifecycleDoc, /website component lifecycle cleanup approval: NO-GO/);
}

test('active goal completion audit is audit-only and keeps goal open', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /This is not an implementation patch/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /Completion is not proven/);
  assert.match(source, /Do not call `update_goal\(status='complete'\)`/);
  assert.match(source, /Green `npm run audit:runtime` proves that current-behavior claims are pinned/);
  assert.match(source, /does not prove that every future implementation change is safe/);
  assert.match(source, /5 route\/surface-specific per-file metric artifact\s+contract docs covered/);
  assert.match(source, /5 route\/surface-specific per-file metric artifact\s+contract tests covered/);
  assert.equal(source.includes('0 route/surface-specific per-file metric artifact contract docs covered'), false);
  assertSettingsModeStopGoPropagation(source);
  assertListenerOptionShapeContinuation(source);
  assertListenerEventTypeContinuation(source);
  assertListenerTargetContinuation(source);
  assertListenerEventTargetMatrixContinuation(source);
  assertListenerCallbackIdentityContinuation(source);
  assertListenerAddRemoveParityContinuation(source);
  assertContentRuntimePageGlobalListenerBoundaryContinuation(source);
  assertContentRuntimePageGlobalListenerRowContextContinuation(source);
  assertContentRuntimePageGlobalListenerImpactFixtureContinuation(source);
  assertObserverObserveTargetContinuation(source);
  assertObserverObserveOptionShapeContinuation(source);
  assertObserverDisconnectContinuation(source);
  assertObserverObserveReleaseParityContinuation(source);
  assertObserverConstructorObserveTypeParityContinuation(source);
  assertObserverConstructorCallbackIdentityContinuation(source);
  assertTimerDelayShapeContinuation(source);
  assertTimerCallbackIdentityContinuation(source);
  assertTimerScheduleClearParityContinuation(source);
  assertTimerOwnerDomainContextContinuation(source);
  assertTimerOwnerDelayBudgetContinuation(source);
  assertTimerImmediateShortRowContextContinuation(source);
  assertTimerImmediateShortAdmissionGateContinuation(source);
  assertTimerImmediateShortNoWorkPredicateContinuation(source);
  assertTimerImmediateShortSurfaceOwnershipContinuation(source);
  assertYouTubeSpaImmediateShortPredicateCrosswalkContinuation(source);
  assertYouTubeSpaEagerHotTimerCandidateContinuation(source);
  assertYouTubeSpaEagerHotTimerRouteAdmissionContinuation(source);
  assertYouTubeSpaDesktopResidualHotTimerContinuation(source);
  assertYouTubeSpaDesktopDirectUserActionHotTimerContinuation(source);
  assertYouTubeSpaDesktopStartupReadinessHotTimerContinuation(source);
  assertYouTubeSpaDesktopDomFallbackInheritedHotTimerContinuation(source);
  assertYouTubeSpaDesktopStorageDirtyStateHotTimerContinuation(source);
  assertYouTubeSpaDesktopExplicitListModeRouteHotTimerContinuation(source);
  assertYouTubeSpaDesktopPageGlobalQuickBlockRefreshHotTimerContinuation(source);
  assertYouTubeSpaDesktopResidualHotTimerClassClosureContinuation(source);
  assertYouTubeSpaRuntimeOptimizationBoundaryContinuation(source);
  assertExplicitTeardownHandleContinuation(source);
  assertAnimationFrameScheduleContinuation(source);
  assertAnimationFrameScheduleCancelParityContinuation(source);
  assertBackgroundTimerOwnerReasonContinuation(source);
  assertGeneratedVendorLifecycleFreshnessContinuation(source);
  assertWebsiteComponentLifecycleBoundaryContinuation(source);
});

test('active goal completion audit records whitelist cache hot-path boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Whitelist Cache Hot Path Boundary Addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_WHITELIST_CACHE_HOT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md'));
  assert.ok(source.includes('tests/runtime/whitelist-cache-hot-path-boundary-current-behavior.test.mjs'));
  assert.match(source, /remaining cache hot paths behind the reported whitelist\/cache SPA slowdown/);
  assert.match(source, /5 whitelist\s+cache hot-path source files/);
  assert.match(source, /7 cache hot-path source\/effect blocks/);
  assert.match(source, /3 content\s+bridge cache hot-path blocks/);
  assert.match(source, /2 background map cache blocks/);
  assert.match(source, /1 bridge settings\s+refresh block/);
  assert.match(source, /1 handle resolver cache block/);
  assert.match(source, /21 selected cache hot-path token\s+counts/);
  assert.match(source, /runtime behavior changed: yes for duplicate learned-map persistence\s+only/);
  assert.match(source, /narrow learned-map persistence\/deduped-DOM approval: GO/);
  assert.match(source, /broader runtime\s+whitelist cache optimization approval: NO-GO/);
  assert.match(source, /runtime JSON-first cache\s+optimization approval: NO-GO/);
  assert.match(source, /whitelistCacheHotPathAuthority/);
  assert.match(source, /jsonFirstCacheWriteEffectReport/);
  assert.match(source, /Whitelist Cache SPA Metric Packet Gate Continuation/);
  assert.match(source, /2026-05-30 whitelist\/cache SPA metric packet gate continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_WHITELIST_CACHE_SPA_METRIC_PACKET_GATE_CURRENT_BEHAVIOR_2026-05-29.md'));
  assert.ok(source.includes('tests/runtime/whitelist-cache-spa-metric-packet-gate-current-behavior.test.mjs'));
  assert.match(source, /bind the reported release lag, whitelist cache hot paths, live YouTube SPA\s+smoke boundary, route\/surface metric artifacts, behavior invariants, and\s+JSON-first first-class promotion boundary/);
  assert.match(source, /whitelist\/cache SPA\s+metric packet rows: 12/);
  assert.match(source, /live YouTube SPA smoke rows required: 6/);
  assert.match(source, /route\/surface\s+metric artifact files required: 5/);
  assert.match(source, /committed whitelist\/cache SPA metric packet\s+files: 0/);
  assert.match(source, /committed live YouTube SPA smoke result files: 0/);
  assert.match(source, /runtime metric\s+collectors approved: 0/);
  assert.match(source, /runtime whitelist\/cache optimization approvals: 0/);
  assert.match(source, /runtime JSON-first first-class promotion approvals: 0/);
  assert.match(source, /release readiness from\s+this gate: NO-GO/);
  assert.match(source, /installed\s+byte parity gate rows: 12/);
  assert.match(source, /required installed byte parity fields: 14/);
  assert.match(source, /route\s+sequence rows required: 6/);
  assert.match(source, /list-mode states required: 6/);
  assert.match(source, /route-mode observation\s+cells required: 36/);
  assert.match(source, /transport budget rows required: 8/);
  assert.match(source, /DOM lifecycle budget\s+rows required: 10/);
  assert.match(source, /pending-hide rail rows required: 10/);
  assert.match(source, /cache refresh rows\s+required: 10/);
  assert.match(source, /settings mutation rows required: 10/);
  assert.match(source, /behavior invariant rows\s+required: 10/);
  assert.match(source, /JSON-first promotion rows required: 10/);
  assert.match(source, /rollout nonclaim rows\s+required: 10/);
  assert.match(source, /packet row expansion rows: 7/);
  assert.match(source, /packet rows covered by expansion\s+rows: 12/);
  assert.match(source, /packet row expansion closure: ROW-EXPANSION-CLOSED/);
  assert.match(source, /release\s+readiness from expansion closure: NO-GO/);
  assert.match(source, /current-source freshness rows: 8/);
  assert.match(source, /installed-tab byte parity trace: MISSING/);
  assert.match(source, /release\s+readiness from current-source freshness: NO-GO/);
  assert.match(source, /whitelist\/cache optimization, JSON-first first-class\s+filter authority, public performance claims, release ship decisions, and\s+runtime behavior changes at `NO-GO`/);
  assert.match(source, /May 5 Commit-History Whitelist Lag Boundary Continuation/);
  assert.match(source, /2026-05-30 May 5 commit-history whitelist lag boundary continuation/);
  assert.ok(source.includes("git log --since='2026-05-05' --date=short"));
  assert.match(source, /returns 36 path-filtered commits across 2026-05-05 through 2026-05-17/);
  assert.match(source, /date distribution is 10 commits on 2026-05-05, 10 commits on 2026-05-06, 2\s+commits on 2026-05-09, 11 commits on 2026-05-10, 2 commits on 2026-05-11, and\s+1 commit on 2026-05-17/);
  assert.match(source, /May 6 whitelist\/JSON\/watch\s+activation group is `f87729d`, `dd1568f`, `011fdfe`, `b3de84e`, `35c1ee4`,\s+`0a9978d`, and `bf95385`/);
  assert.match(source, /later hot-path mitigation and observer\s+quieting group includes `2241042`, `326d921`, `777ad8a`, `884fb11`, `72e4c25`,\s+`f3ba0ad`, `038346c`, `c26fca6`, `27f1639`, `3dc4a51`, `7333cae`, and\s+`e88414e`/);
  assert.match(source, /recent whitelist\/JSON work exposed the YouTube SPA lag, but does not prove\s+that whitelist was the only cause/);
  assert.match(source, /older always-on no-rule DOM fallback,\s+native menu, quick-block, JSON queue\/cache, and SPA lifecycle risks remain the\s+deeper audit target/);
  assert.match(source, /Runtime behavior changed by this continuation: no; broad whitelist\s+optimization, JSON-first first-class promotion, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /ASCII attribution boundary/);
  assert.match(source, /Mermaid attribution boundary/);
});

test('active goal completion audit maps every exact objective requirement', () => {
  const source = doc();

  for (const requirement of [
    'every feature',
    'every file',
    'every method',
    'every JSON path',
    'every DOM selector',
    'every runtime observer/listener/timer',
    'every settings mode',
    'every cross-feature interaction',
    'reliability risks',
    'false-hide risks',
    'leak risks',
    'performance risks',
    'code-burden risks',
    'before making implementation changes'
  ]) {
    assert.ok(
      source.includes(`| ${requirement} |`),
      `missing completion row for ${requirement}`
    );
  }
});

test('active goal completion audit cites current authoritative evidence categories', () => {
  const source = doc();

  for (const artifact of [
    'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
    'docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md',
    'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md',
    'docs/audit/FILTERTUBE_ALL_CALLABLE_INDEX_2026-05-18.md',
    'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md',
    'docs/audit/FILTERTUBE_BACKGROUND_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_SEED_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_DOM_FALLBACK_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_STATE_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_RENDER_ENGINE_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_TAB_VIEW_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_SETTINGS_SHARED_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_IO_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_POPUP_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_UI_COMPONENTS_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_SECURITY_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_CONTENT_CONTROLS_CATALOG_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_BLOCK_CHANNEL_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_COLLAB_DIALOG_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_INJECTOR_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_CONTENT_MENU_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_BRIDGE_SETTINGS_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_HANDLE_RESOLVER_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_DOM_EXTRACTORS_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_SHARED_IDENTITY_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_PROMPT_ONBOARDING_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_BUILD_RELEASE_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_GENERATED_UI_SHELL_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_NANAH_VENDOR_BUILD_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_MANIFEST_FRESHNESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_PATH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_DIRECT_RENDERER_RULE_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_DOM_SELECTOR_INSTANCE_REGISTER_2026-05-18.md',
    'docs/audit/FILTERTUBE_CONTENT_BRIDGE_SELECTOR_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_DOM_FALLBACK_SELECTOR_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md',
    'docs/audit/FILTERTUBE_CONTENT_BRIDGE_LIFECYCLE_CALLBACK_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_DOM_FALLBACK_LIFECYCLE_CALLBACK_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md',
    'docs/audit/FILTERTUBE_P0_OBLIGATION_STATUS_LEDGER_2026-05-20.md',
    'docs/audit/FILTERTUBE_FEATURE_SOURCE_DEPENDENCY_REGISTER_2026-05-20.md',
    'docs/audit/FILTERTUBE_CODE_BURDEN_DECLUTTER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_NETWORK_FETCH_REASON_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md',
    'docs/audit/FILTERTUBE_STATIC_HTML_SUPPORT_SCRIPT_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_GENERATED_LOCAL_OUTPUT_DEPENDENCY_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_WEBSITE_PACKAGE_CONFIG_DEPENDENCY_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_WEBSITE_CLIENT_LIFECYCLE_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_WEBSITE_ROUTE_COMPONENT_RENDER_GRAPH_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md'
  ]) {
    assert.ok(source.includes(artifact), `missing evidence artifact ${artifact}`);
  }
});

test('active goal completion audit records no implementation-ready claim', () => {
  const source = doc();

  assert.match(source, /implementation-ready obligations: 0/);
  assert.match(source, /217\/217 P0 obligations remain `future-proof-missing`/);
  assert.match(source, /149 tracked files still have open obligations/);
  assert.match(source, /5,473 lexical callables are not semantic method proof/);
  assert.match(source, /63 tracked JS\/JSX\/MJS files/);
  assert.match(source, /0 files with complete\s+per-callable semantic proof/);
  assert.match(source, /5,473 lexical callables still requiring\s+semantic proof before behavior changes/);
  assert.match(source, /643 selector sites and 489 lifecycle instances are source-enumerated/);
  assert.match(source, /first optimization structural burden queue with 12 source-locus rows/);
  assert.match(source, /0 implementation-ready structural cleanup rows/);
  assert.match(source, /JSON-first structural optimization approvals/);
  assert.match(source, /Do not call `update_goal\(status='complete'\)` because/);
});

test('active goal completion audit records current dirty worktree boundary without declaring readiness', () => {
  const source = doc();

  assert.match(source, /Current dirty worktree audit boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CURRENT_DIRTY_WORKTREE_AUDIT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/current-dirty-worktree-audit-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /16 modified tracked files, 321 additions, 170 deletions/);
  assert.match(source, /14 public\/core documentation claim-surface rows/);
  assert.match(source, /one `js\/state_manager\.js` comment-only header edit with 2 additions and 2 deletions/);
  assert.match(source, /one `package\.json` audit-script addition with 1 addition and 0 deletions/);
  assert.match(source, /no executable StateManager token, branch, storage key, message action/);
  assert.match(source, /`package\.json` only adds `audit:runtime -> node --test tests\/runtime\/\*\.test\.mjs`/);
  assert.match(source, /existing build\/dev\/browser\/native-sync scripts and package dependency metadata remain unchanged/);
  assert.match(source, /dirty-worktree optimization still needs diff classification contracts/);
  assert.match(source, /`currentDirtyWorktreeImplementationChangeGate`/);
  assert.match(source, /exists in product runtime source yet/);
});

test('active goal completion audit records content bridge selector semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content bridge selector semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_SELECTOR_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/content-bridge-selector-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /largest selector file/);
  assert.match(source, /244 current `js\/content_bridge\.js` selector API sites/);
  assert.match(source, /13 source-derived selector\/effect groups/);
  assert.match(source, /36 dynamic\/non-literal selectors across 11 dynamic selector families/);
  assert.match(source, /repository-wide broad\/dynamic selector semantics are not fully proven/);
  assert.match(source, /`contentBridgeSelectorSemanticAuthority`, `contentBridgeSelectorEffectReport`, `contentBridgeSelectorOwnerContract`, `contentBridgeDynamicSelectorEscapePolicy`, `contentBridgeSelectorNoRuleBudget`, or `contentBridgeSelectorRestoreProof`/);
});

test('active goal completion audit records DOM fallback selector semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /DOM fallback selector semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_DOM_FALLBACK_SELECTOR_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/dom-fallback-selector-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /DOM selector, hide\/restore, false-hide, lifecycle, and performance objectives/);
  assert.match(source, /`js\/content\/dom_fallback\.js` and `js\/content\/dom_helpers\.js`/);
  assert.match(source, /164 current selector API sites/);
  assert.match(source, /161 in `dom_fallback\.js`/);
  assert.match(source, /3 in `dom_helpers\.js`/);
  assert.match(source, /152 static literal args/);
  assert.match(source, /12 dynamic\/non-literal args/);
  assert.match(source, /120 unique static selector literals/);
  assert.match(source, /11 semantic selector groups/);
  assert.match(source, /12 dynamic selector families/);
  assert.match(source, /comments, current-watch controls, guide subscriptions/);
  assert.match(source, /main card identity, Mix\/playlist\/watch identity/);
  assert.match(source, /stale restore and broad controls/);
  assert.match(source, /Shorts\/survey\/chip selectors/);
  assert.match(source, /selector target ownership, dynamic escape policy, no-rule budgets/);
  assert.match(source, /sibling-visible fixtures, and shared restore authority are not complete/);
  assert.match(source, /content-bridge plus DOM fallback\/helper addenda group 408 of them/);
  assert.match(source, /`domFallbackSelectorSemanticAuthority`, `domFallbackSelectorEffectReport`, `domFallbackSelectorOwnerContract`, `domFallbackDynamicSelectorEscapePolicy`, `domFallbackSelectorNoRuleBudget`, `domFallbackSelectorRestoreProof`, `domFallbackSiblingVisibleFixtureReport`, or `domHelperSelectorInputContract`/);
});

test('active goal completion audit records current-source DOM selector rerun without declaring completion', () => {
  const source = doc();

  assert.match(source, /2026-05-30 DOM selector and hide\/restore packet current-source rerun/);
  assert.ok(source.includes('node --test --test-reporter=spec tests/runtime/selector-authority-current-behavior.test.mjs tests/runtime/p0-selector-authority-current-behavior.test.mjs tests/runtime/dom-selector-instance-register-current-behavior.test.mjs tests/runtime/dom-target-source-current-behavior.test.mjs tests/runtime/dom-route-scope-current-behavior.test.mjs tests/runtime/content-bridge-selector-semantic-register-current-behavior.test.mjs tests/runtime/dom-fallback-selector-semantic-register-current-behavior.test.mjs tests/runtime/content-control-dom-style-selector-matrix-current-behavior.test.mjs tests/runtime/css-style-hide-authority-current-behavior.test.mjs tests/runtime/dom-broad-hide-boundary-current-behavior.test.mjs tests/runtime/dom-hide-side-effect-current-behavior.test.mjs tests/runtime/p0-hide-restore-current-behavior.test.mjs tests/runtime/hide-restore-authority-current-behavior.test.mjs tests/runtime/source-tier-effect-authority-current-behavior.test.mjs tests/runtime/dom-identity-confidence-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/comments-dom-cleanup-boundary-current-behavior.test.mjs tests/runtime/navigation-header-search-dom-cleanup-boundary-current-behavior.test.mjs tests/runtime/video-info-dom-cleanup-boundary-current-behavior.test.mjs tests/runtime/watch-playlist-panel-dom-cleanup-boundary-current-behavior.test.mjs tests/runtime/playlist-mix-dom-cleanup-boundary-current-behavior.test.mjs tests/runtime/sponsored-cards-dom-cleanup-boundary-current-behavior.test.mjs tests/runtime/live-chat-dom-cleanup-boundary-current-behavior.test.mjs tests/runtime/player-endscreen-dom-cleanup-boundary-current-behavior.test.mjs tests/runtime/video-sidebar-dom-cleanup-boundary-current-behavior.test.mjs tests/runtime/shorts-dom-cleanup-boundary-current-behavior.test.mjs tests/runtime/recommended-dom-cleanup-boundary-current-behavior.test.mjs tests/runtime/home-feed-dom-cleanup-boundary-current-behavior.test.mjs tests/runtime/members-only-dom-cleanup-boundary-current-behavior.test.mjs tests/runtime/tab-view-lifecycle-selector-boundary-current-behavior.test.mjs tests/runtime/popup-lifecycle-selector-boundary-current-behavior.test.mjs'));
  assert.match(source, /passed 224\/224 tests/);
  assert.match(source, /current-source selector authority, P0 selector gates, DOM selector instance enumeration/);
  assert.match(source, /DOM target\/source rows, route scope rows, content-bridge and DOM fallback selector semantics/);
  assert.match(source, /CSS\/style hide boundaries, broad hide boundaries, hide side effects/);
  assert.match(source, /comments\/navigation\/video-info\/playlist\/Mix\/sponsored\/live-chat\/player\/sidebar\/Shorts\/recommended\/home-feed\/members-only\/tab-view\/popup selector cleanup boundaries/);
  assert.match(source, /Runtime behavior changed by this rerun: no/);
  assert.match(source, /Selector implementation authority, DOM target mutation approval, broad hide pruning,\s+hide\/restore registry authority, whitelist\/cache optimization, JSON-first promotion,\s+release\/public-claim use, and `update_goal\(status='complete'\)` remain\s+`NO-GO`/);
});

test('active goal completion audit records filter logic direct renderer rules without declaring completion', () => {
  const source = doc();

  assert.match(source, /Filter logic direct renderer rule semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_FILTER_LOGIC_DIRECT_RENDERER_RULE_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/filter-logic-direct-renderer-rule-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /JSON path objective/);
  assert.match(source, /all 45 current top-level `FILTER_RULES` source declarations/);
  assert.match(source, /44 unique renderer keys/);
  assert.match(source, /duplicate `gridVideoRenderer` declarations at lines 431 and 604/);
  assert.match(source, /7 `BASE_VIDEO_RULES` aliases/);
  assert.match(source, /38 object literal rules/);
  assert.match(source, /11 semantic rule groups/);
  assert.match(source, /direct renderer keys are not every documented JSON path/);
  assert.match(source, /no executable JSON path authority or per-field manifest exists/);
  assert.match(source, /`filterLogicDirectRuleAuthority`, `filterLogicRendererRuleReport`, `rendererRuleDuplicatePolicy`, `rendererRuleFieldPathManifest`, `rendererRuleEffectDecision`, or `rendererRuleFixtureProvenance`/);
});

test('active goal completion audit records filter logic rule paths without declaring completion', () => {
  const source = doc();

  assert.match(source, /Filter logic rule path semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/filter-logic-rule-path-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /executable runtime path-string proof/);
  assert.match(source, /440 effective runtime path rows after duplicate override/);
  assert.match(source, /174 unique effective path literals/);
  assert.match(source, /177 renderer-field pairs/);
  assert.match(source, /151 text-match path rows/);
  assert.match(source, /152 channel identity path rows/);
  assert.match(source, /34 video identity path rows/);
  assert.match(source, /103 metadata predicate path rows/);
  assert.match(source, /`gridVideoRenderer` duplicate source declarations make source counts differ from effective runtime rows/);
  assert.match(source, /current runtime paths use dot-index syntax with 0 bracket-index path rows/);
  assert.match(source, /documented encyclopedia paths are not loaded by runtime\/build source/);
  assert.match(source, /DOM fallback parity, native runtime parity, no-rule budgets/);
  assert.match(source, /future simultaneous allow\/block semantics are not complete/);
  assert.match(source, /`filterLogicRulePathAuthority`, `filterLogicRulePathManifest`, `filterLogicRulePathSyntaxContract`, `filterLogicEffectiveRendererPathReport`, `filterLogicDuplicatePathOverridePolicy`, `filterLogicJsonDomParityReport`, `filterLogicPathFixtureProvenance`, `filterLogicJsonFirstReadinessGate`, `filterLogicPathEffectDecision`, or `filterLogicPathNoRuleBudget`/);
  assert.match(source, /effective runtime path strings are now inventoried/);
  assert.match(source, /DOM fallback parity, native runtime parity, no-rule budgets/);
});

test('active goal completion audit records filter logic rule field effects without declaring completion', () => {
  const source = doc();

  assert.match(source, /Filter logic rule field effect semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/filter-logic-rule-field-effect-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /path-string inventory toward field-effect proof/);
  assert.match(source, /11 rule fields with runtime consumers/);
  assert.match(source, /9 consumer methods with `rules\.<field>` references/);
  assert.match(source, /20 method-field consumer pairs/);
  assert.match(source, /63 `rules\.<field>` token references/);
  assert.match(source, /`title`, `description`, `commentText`, `channelName`, `duration`, `publishedTime`, `viewCount`, and `metadataRows` can enter candidate search text/);
  assert.match(source, /`channelName`\/`channelId`\/`channelHandle` feed channel-policy evidence only after extraction and matching/);
  assert.match(source, /`videoId` is a join key rather than channel identity/);
  assert.match(source, /`viewCount` has no current view-count threshold predicate/);
  assert.match(source, /`_checkCategoryFilters\(\)` can schedule category metadata fetches/);
  assert.match(source, /`processData\(\)` harvests before the disabled-filtering skip/);
  assert.match(source, /field availability is not effect authority/);
  assert.match(source, /category fetch budgets/);
  assert.match(source, /field-effect decision, category fetch budget, and no-work proof for each path class/);
  assert.match(source, /`filterLogicRuleFieldEffectAuthority`, `filterLogicRuleFieldEffectManifest`, `filterLogicJsonPathEffectDecision`, `filterLogicFieldConsumerReport`, `filterLogicViewCountPredicateAuthority`, `filterLogicCategoryFetchBudget`, `filterLogicWhitelistFieldEffectReport`, `filterLogicRuleFieldFixtureProvenance`, `filterLogicRuleFieldNoWorkBudget`, or `filterLogicJsonFirstEffectGate`/);
});

test('active goal completion audit records filter logic method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Filter logic method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_FILTER_LOGIC_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/filter-logic-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method objective/);
  assert.match(source, /55 current method and entrypoint rows/);
  assert.match(source, /12 top-level helper function declarations/);
  assert.match(source, /41 `YouTubeDataFilter` class methods/);
  assert.match(source, /2 `FilterTubeEngine` global interface functions/);
  assert.match(source, /11 semantic method groups/);
  assert.match(source, /harvest\/map writes/);
  assert.match(source, /block decisions/);
  assert.match(source, /nested local callbacks, per-field JSON effects, map-write permission/);
  assert.match(source, /disabled\/no-rule budgets, and method fixture provenance are not complete/);
  assert.match(source, /`filterLogicMethodAuthority`, `filterLogicMethodEffectReport`, `filterLogicNoRuleMethodBudget`, `filterLogicHarvestMutationDecision`, `filterLogicEntrypointContract`, or `filterLogicMethodFixtureProvenance`/);
});

test('active goal completion audit records seed method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Seed method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SEED_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/seed-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method and runtime lifecycle objectives/);
  assert.match(source, /35 current method\/callback rows/);
  assert.match(source, /13 top-level function declarations/);
  assert.match(source, /6 local helper functions/);
  assert.match(source, /5 page\/prototype patch functions/);
  assert.match(source, /6 property accessor functions/);
  assert.match(source, /1 timer callback/);
  assert.match(source, /1 local wrapped-listener callback/);
  assert.match(source, /2 bootstrap entrypoints/);
  assert.match(source, /8 semantic method groups/);
  assert.match(source, /engine dispatch\/no-work boundaries/);
  assert.match(source, /`ytInitial\*` hooks\/accessors/);
  assert.match(source, /fetch interception, XHR interception/);
  assert.match(source, /inline predicate callbacks, per-endpoint JSON path effects/);
  assert.match(source, /fetch\/XHR no-work budgets, page-global patch teardown/);
  assert.match(source, /`seedMethodAuthority`, `seedMethodEffectReport`, `seedNoWorkBudget`, `seedTransportPatchOwner`, `seedReplayQueueBudget`, `seedAccessorContract`, or `seedPageGlobalFixtureProvenance`/);
});

test('active goal completion audit records DOM fallback method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /DOM fallback method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_DOM_FALLBACK_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/dom-fallback-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, DOM selector, lifecycle, hide\/restore, and performance objectives/);
  assert.match(source, /`js\/content\/dom_fallback\.js` and `js\/content\/dom_helpers\.js`/);
  assert.match(source, /49 current top-level function declarations/);
  assert.match(source, /46 in `dom_fallback\.js`/);
  assert.match(source, /3 in `dom_helpers\.js`/);
  assert.match(source, /11 semantic method groups/);
  assert.match(source, /run-state\/tracking/);
  assert.match(source, /identity normalization and compiled rules/);
  assert.match(source, /playlist\/watch route identity/);
  assert.match(source, /blocked markers and stale restore/);
  assert.match(source, /dynamic style controls/);
  assert.match(source, /fallback surface handlers/);
  assert.match(source, /main DOM fallback pipeline/);
  assert.match(source, /hide decision engine/);
  assert.match(source, /shared visual writers/);
  assert.match(source, /inline callbacks, selector target semantics, route\/mode negative fixtures/);
  assert.match(source, /direct display writers, stats\/media side effects/);
  assert.match(source, /page-lifetime guard teardown, and no-rule budgets are not complete/);
  assert.match(source, /`domFallbackMethodAuthority`, `domFallbackEffectReport`, `domFallbackNoWorkBudget`, `domFallbackLifecycleOwner`, `domFallbackHideDecisionReport`, `domFallbackSelectorTargetReport`, `domFallbackGlobalDependencyContract`, or `domHelperVisualWriterReport`/);
  assert.match(source, /Direct hide writer external dependency addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_DIRECT_HIDE_WRITER_REGISTER_2026-05-20\.md/);
  assert.match(source, /tests\/runtime\/direct-hide-writer-register-current-behavior\.test\.mjs/);
  assert.match(source, /shared-helper external dependency boundary for `toggleVisibility\(\)`/);
  assert.match(source, /5 external shared-helper dependency symbols/);
  assert.match(source, /9 external shared-helper side-effect callsites/);
  assert.match(source, /4 `content_bridge\.js`-provided dependency symbols/);
  assert.match(source, /1 `dom_extractors\.js`-provided dependency symbol/);
  assert.match(source, /5 `skipStats`-guarded stats\/tracker callsites/);
  assert.match(source, /2 `skipStats`-unguarded media callsites/);
  assert.match(source, /provider load-order proof/);
  assert.match(source, /missing-provider behavior proof/);
  assert.match(source, /structured hide-decision ids/);
  assert.match(source, /no `sharedHideSideEffectAuthority` exists in runtime source yet/);
  assert.match(source, /Direct hide missing-provider executable continuation/);
  assert.match(source, /0 provider guard checks in `toggleVisibility\(\)`/);
  assert.match(source, /0 provider try\/catch wrappers in `toggleVisibility\(\)`/);
  assert.match(source, /4 executable missing-provider scenarios/);
  assert.match(source, /3 missing-provider paths that mutate before throwing/);
  assert.match(source, /1 missing-provider path that throws before visual mutation/);
  assert.match(source, /not permission to change load order, provider guards, stats\/media coupling, restore semantics, or direct hide writer policy/);
  assert.match(source, /Direct hide manifest load-order continuation/);
  assert.match(source, /4 manifest helper-stack rows/);
  assert.match(source, /4 rows with `dom_helpers\.js` before `dom_extractors\.js`/);
  assert.match(source, /4 rows with `dom_extractors\.js` before `content_bridge\.js`/);
  assert.match(source, /1 provider symbol available from a pre-bridge provider file/);
  assert.match(source, /4 provider symbols defined only in `content_bridge\.js`/);
  assert.match(source, /not call-time provider authority or permission to change hide timing/);
});

test('active goal completion audit records DOM fallback lifecycle callbacks without declaring completion', () => {
  const source = doc();

  assert.match(source, /DOM fallback lifecycle callback addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_DOM_FALLBACK_LIFECYCLE_CALLBACK_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/dom-fallback-lifecycle-callback-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /runtime observer\/listener\/timer objective/);
  assert.match(source, /all 13 current lifecycle instances/);
  assert.match(source, /3 addEventListener instances/);
  assert.match(source, /10 setTimeout instances/);
  assert.match(source, /2 primitive families/);
  assert.match(source, /7 semantic callback groups/);
  assert.match(source, /0 explicit teardown or clear instances/);
  assert.match(source, /3 page-lifetime listener guards/);
  assert.match(source, /synthetic playlist navigation, media pause coupling, pending metadata reruns/);
  assert.match(source, /route\/list-mode negative fixtures, no-rule budgets/);
  assert.match(source, /fullscreen\/native pause policy, and teardown ownership are not complete/);
  assert.match(source, /`domFallbackLifecycleCallbackAuthority`, `domFallbackLifecycleEffectReport`, `domFallbackCallbackOwnerContract`, `domFallbackNoRuleLifecycleBudget`, `domFallbackCallbackTeardownRegistry`, `domFallbackPlaylistGuardPolicy`, `domFallbackPendingRunBudget`, or `domFallbackSyntheticNavigationBudget`/);
  assert.match(source, /`js\/content_bridge\.js` plus `js\/content\/dom_fallback\.js` now have source-derived callback\/effect groups for 100 instances/);
});

test('active goal completion audit records background method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Background method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_BACKGROUND_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/background-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, settings-mode, storage\/cache, network, mutation, backup, reliability, performance, and cross-feature objectives/);
  assert.match(source, /all 75 current top-level function declarations/);
  assert.match(source, /62 plain function declarations/);
  assert.match(source, /13 async function declarations/);
  assert.match(source, /12 semantic method groups/);
  assert.match(source, /defensive helpers\/messaging/);
  assert.match(source, /profile backup\/export state/);
  assert.match(source, /subscription import\/sender normalization/);
  assert.match(source, /security session\/PIN/);
  assert.match(source, /post-block enrichment and channel-derived keywords/);
  assert.match(source, /profile compile\/storage/);
  assert.match(source, /learned identity map caches/);
  assert.match(source, /identity resolver network work/);
  assert.match(source, /rule mutation\/channel persistence/);
  assert.match(source, /inline listener callbacks, message action branches, storage revision policy/);
  assert.match(source, /sender trust, route\/profile\/list-mode negative fixtures/);
  assert.match(source, /resolver network budgets, backup scheduling authority, and mutation rollback proof are not complete/);
  assert.match(source, /`backgroundMethodAuthority`, `backgroundMethodEffectReport`, `backgroundMethodNoWorkBudget`, `backgroundStorageRevisionReport`, `backgroundNetworkResolverBudget`, `backgroundRuleMutationContract`, or `backgroundBackupScheduleAuthority`/);
  assert.match(source, /`js\/background\.js`/);
  assert.match(source, /`js\/content\/menu\.js` now have source-derived method inventories/);
});

test('active goal completion audit records state manager method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /State manager method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_STATE_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/state-manager-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, settings-mode, storage\/cache, message\/mutation, profile, import, lifecycle/);
  assert.match(source, /reliability, false-hide\/leak, performance, code-burden, and cross-feature objectives/);
  assert.match(source, /representative `StateManager` tokens/);
  assert.match(source, /all 55 current IIFE-scoped function declarations/);
  assert.match(source, /21 plain function declarations/);
  assert.match(source, /34 async function declarations/);
  assert.match(source, /30 public API entries/);
  assert.match(source, /9 semantic method groups/);
  assert.match(source, /lock\/backup\/access helpers/);
  assert.match(source, /settings save\/profile\/broadcast work/);
  assert.match(source, /channel enrichment queue work/);
  assert.match(source, /Kids keyword\/channel mutations/);
  assert.match(source, /Main keyword mutations/);
  assert.match(source, /Main channel\/import\/map mutations/);
  assert.match(source, /toggle\/content\/category mutations/);
  assert.match(source, /theme\/listener APIs/);
  assert.match(source, /storage-sync reload handling/);
  assert.match(source, /inline callbacks, storage key parity, V3\/V4 profile revision policy/);
  assert.match(source, /dropped concurrent saves, refresh\/broadcast authority/);
  assert.match(source, /listener event contracts, channel enrichment budgets/);
  assert.match(source, /import target-profile proof, route\/profile\/list-mode negative fixtures/);
  assert.match(source, /rollback proof are not complete/);
  assert.match(source, /`stateManagerMethodAuthority`, `stateManagerMutationEffectReport`, `stateManagerSaveQueueContract`, `stateManagerProfileRevisionReport`, `stateManagerRefreshBroadcastAuthority`, `stateManagerStorageReloadBudget`, `stateManagerListenerEventContract`, or `stateManagerChannelEnrichmentBudget`/);
});

test('active goal completion audit records render engine method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Render engine method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_RENDER_ENGINE_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/render-engine-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, settings-mode, UI row-action, DOM write, lifecycle\/timer/);
  assert.match(source, /accessibility, performance, false-hide\/leak, code-burden, and cross-feature objectives/);
  assert.match(source, /representative `RenderEngine` tokens/);
  assert.match(source, /all 35 current IIFE-scoped declarations/);
  assert.match(source, /30 plain function declarations/);
  assert.match(source, /5 const arrow helper declarations/);
  assert.match(source, /0 async function declarations/);
  assert.match(source, /4 public API entries/);
  assert.match(source, /6 semantic method groups/);
  assert.match(source, /dependency\/scheduling helpers/);
  assert.match(source, /badge\/source decoration/);
  assert.match(source, /channel display identity helpers/);
  assert.match(source, /keyword rendering and row actions/);
  assert.match(source, /channel rendering and row actions/);
  assert.match(source, /collaboration grouping/);
  assert.match(source, /inline callbacks, UIComponents fallback policy/);
  assert.match(source, /row-action mutation authority/);
  assert.match(source, /state override provenance/);
  assert.match(source, /Main\/Kids list-mode visual parity/);
  assert.match(source, /idle render budget/);
  assert.match(source, /accessibility proof/);
  assert.match(source, /channel display identity policy/);
  assert.match(source, /collaboration row proof/);
  assert.match(source, /route\/profile\/list-mode negative fixtures/);
  assert.match(source, /sibling-visible row fixtures are not complete/);
  assert.match(source, /`renderEngineMethodAuthority`, `renderEngineRowActionContract`, `renderEngineDomEffectReport`, `renderEngineIdleRenderBudget`, `renderEngineVisibleRowParityReport`, `renderEngineAccessibilityContract`, or `renderEngineIdentityDisplayPolicy`/);
});

test('active goal completion audit records tab-view method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Tab-view method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_TAB_VIEW_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/tab-view-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, settings-mode, dashboard UI, profile\/lock, import\/export, Nanah sync/);
  assert.match(source, /list-mode, DOM selector, lifecycle\/timer, accessibility, performance/);
  assert.match(source, /false-hide\/leak, code-burden, and cross-feature objectives/);
  assert.match(source, /representative `tab-view` tokens/);
  assert.match(source, /all 311 current named declarations/);
  assert.match(source, /210 plain function declarations/);
  assert.match(source, /70 async function declarations/);
  assert.match(source, /29 const arrow helper declarations/);
  assert.match(source, /2 async const arrow helper declarations/);
  assert.match(source, /22 semantic method groups/);
  assert.match(source, /responsive navigation/);
  assert.match(source, /Main\/Kids filter and content controls/);
  assert.match(source, /runtime\/browser-tab messaging/);
  assert.match(source, /subscription import/);
  assert.match(source, /managed child editing/);
  assert.match(source, /lock\/navigation gates/);
  assert.match(source, /Nanah mode\/scope\/target\/session\/apply flows/);
  assert.match(source, /PIN\/profile management/);
  assert.match(source, /import\/export downloads/);
  assert.match(source, /managed row and list-mode rendering/);
  assert.match(source, /dashboard stats/);
  assert.match(source, /inline callbacks, 147 listener sites/);
  assert.match(source, /runtime message action authority/);
  assert.match(source, /managed-child row\/action authority/);
  assert.match(source, /list-mode transfer\/copy proof/);
  assert.match(source, /Nanah apply policy/);
  assert.match(source, /import\/export mutation planning/);
  assert.match(source, /profile lock\/session proof/);
  assert.match(source, /interval\/frame\/timeout lifecycle/);
  assert.match(source, /route\/profile\/list-mode negative fixtures/);
  assert.match(source, /dashboard render budgets are not complete/);
  assert.match(source, /`tabViewMethodAuthority`, `tabViewListenerLifecycleContract`, `tabViewListModeMutationReport`, `tabViewManagedChildEditContract`, `tabViewNanahSyncPolicyReport`, `tabViewImportExportMutationPlan`, `tabViewProfileLockAccessReport`, `tabViewDashboardRenderBudget`, or `tabViewNavigationStateContract`/);
});

test('active goal completion audit records settings shared method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Settings shared method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SETTINGS_SHARED_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/settings-shared-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, settings-mode, storage\/cache, compiler, migration, profile, theme/);
  assert.match(source, /reliability, false-hide\/leak, performance, code-burden, and cross-feature objectives/);
  assert.match(source, /representative `settings_shared` tokens/);
  assert.match(source, /all 29 current named declarations/);
  assert.match(source, /27 IIFE-scoped function declarations/);
  assert.match(source, /2 local const arrow helper declarations/);
  assert.match(source, /0 async function declarations/);
  assert.match(source, /21 public `FilterTubeSettings` entries/);
  assert.match(source, /9 semantic method groups/);
  assert.match(source, /defensive object helpers/);
  assert.match(source, /keyword normalization and compilation/);
  assert.match(source, /channel normalization/);
  assert.match(source, /profile migration helpers/);
  assert.match(source, /compiled settings building/);
  assert.match(source, /settings load\/read-path migration/);
  assert.match(source, /settings save\/storage persistence/);
  assert.match(source, /theme preference\/change helpers/);
  assert.match(source, /storage change detection/);
  assert.match(source, /inline storage callbacks/);
  assert.match(source, /settings key completeness/);
  assert.match(source, /V3\/V4 migration defaults/);
  assert.match(source, /read-path storage writes/);
  assert.match(source, /save result\/rollback policy/);
  assert.match(source, /background cache revision/);
  assert.match(source, /bridge\/StateManager invalidation parity/);
  assert.match(source, /content\/category dependency proof/);
  assert.match(source, /stale alias policy/);
  assert.match(source, /theme DOM side effects/);
  assert.match(source, /route\/profile\/list-mode negative fixtures/);
  assert.match(source, /storage error fixtures are not complete/);
  assert.match(source, /`settingsSharedMethodAuthority`, `settingsSharedStorageDependencyManifest`, `settingsSharedProfileMigrationReport`, `settingsSharedReadPathWriteBudget`, `settingsSharedSaveResultContract`, `settingsSharedCompiledSettingsReport`, `settingsSharedThemePreferenceContract`, or `settingsSharedChangeDetectionContract`/);
});

test('active goal completion audit records io manager method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /IO manager method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_IO_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/io-manager-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, import\/export, backup, profile migration, settings-mode, storage\/cache/);
  assert.match(source, /encryption, Nanah restore, download/);
  assert.match(source, /reliability, false-hide\/leak, performance, code-burden, and cross-feature objectives/);
  assert.match(source, /representative `io_manager` tokens/);
  assert.match(source, /all 52 current named declarations/);
  assert.match(source, /46 IIFE-scoped function declarations/);
  assert.match(source, /30 plain function declarations/);
  assert.match(source, /16 async function declarations/);
  assert.match(source, /6 local const arrow helper declarations/);
  assert.match(source, /11 public `FilterTubeIO` entries/);
  assert.match(source, /12 semantic method groups/);
  assert.match(source, /primitive defensive helpers/);
  assert.match(source, /download runtime helpers/);
  assert.match(source, /keyword\/channel normalization/);
  assert.match(source, /profile scope and security/);
  assert.match(source, /legacy profile derivation and V3 persistence/);
  assert.match(source, /storage access wrappers/);
  assert.match(source, /profiles V4 migration and sanitization/);
  assert.match(source, /import format parsing/);
  assert.match(source, /export serialization/);
  assert.match(source, /import merge and persistence/);
  assert.match(source, /encrypted\/Nanah state/);
  assert.match(source, /auto-backup download\/rotation/);
  assert.match(source, /inline callbacks/);
  assert.match(source, /import strategy coverage/);
  assert.match(source, /active\/full\/target profile scope/);
  assert.match(source, /PIN auth policy/);
  assert.match(source, /V3\/V4 parity/);
  assert.match(source, /list-mode and whitelist preservation/);
  assert.match(source, /atomic import rollback/);
  assert.match(source, /encrypted container schema/);
  assert.match(source, /Nanah trusted-state restore permission/);
  assert.match(source, /runtime downloads cleanup/);
  assert.match(source, /blob URL lifecycle/);
  assert.match(source, /backup rotation filesystem proof/);
  assert.match(source, /timer teardown/);
  assert.match(source, /route\/profile\/list-mode negative fixtures/);
  assert.match(source, /storage\/download error fixtures are not complete/);
  assert.match(source, /`ioManagerMethodAuthority`, `ioManagerProfileMigrationReport`, `ioManagerImportMutationPlan`, `ioManagerExportScopeContract`, `ioManagerPinAuthContract`, `ioManagerEncryptedBackupContract`, `ioManagerNanahRestorePolicy`, `ioManagerDownloadLifecycleBudget`, `ioManagerAutoBackupScheduleAuthority`, `ioManagerBackupRotationReport`, `ioManagerStorageWriteEffectReport`, or `ioManagerFixtureProvenance`/);
});

test('active goal completion audit records popup method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Popup method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_POPUP_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/popup-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, settings-mode, popup UI, DOM selector, lifecycle\/timer/);
  assert.match(source, /profile\/lock, list-mode, runtime message, content-control, video-filter/);
  assert.match(source, /accessibility, reliability, false-hide\/leak, performance, code-burden, and cross-feature objectives/);
  assert.match(source, /representative `popup` tokens/);
  assert.match(source, /all 53 current named declarations/);
  assert.match(source, /36 plain function declarations/);
  assert.match(source, /11 async function declarations/);
  assert.match(source, /3 const arrow helper declarations/);
  assert.match(source, /3 async const arrow helper declarations/);
  assert.match(source, /0 public exported API entries/);
  assert.match(source, /11 semantic method groups/);
  assert.match(source, /popup bootstrap\/content DOM/);
  assert.match(source, /video filter controls/);
  assert.match(source, /content-control visibility/);
  assert.match(source, /runtime messaging\/session unlock/);
  assert.match(source, /list mode controls/);
  assert.match(source, /profile metadata helpers/);
  assert.match(source, /dropdown\/modal\/PIN unlock/);
  assert.match(source, /lock gate\/profile switch/);
  assert.match(source, /rendering\/search sync/);
  assert.match(source, /enabled toggle/);
  assert.match(source, /inline callbacks, 30 listener sites/);
  assert.match(source, /23 popup DOM ids/);
  assert.match(source, /modal teardown/);
  assert.match(source, /profile lock\/session proof/);
  assert.match(source, /list-mode transfer\/copy proof/);
  assert.match(source, /active YouTube\/Kids route decisions/);
  assert.match(source, /content-control visibility\/search parity/);
  assert.match(source, /runtime message action authority/);
  assert.match(source, /tab-open\/window fallback policy/);
  assert.match(source, /row mutation authority/);
  assert.match(source, /popup\/tab-view parity/);
  assert.match(source, /keyboard\/accessibility fixtures/);
  assert.match(source, /route\/profile\/list-mode negative fixtures/);
  assert.match(source, /render\/state dependency proof are not complete/);
  assert.match(source, /`popupMethodAuthority`, `popupDomEffectReport`, `popupListenerLifecycleContract`, `popupListModeMutationReport`, `popupProfileLockAccessReport`, `popupProfileSwitchMutationPlan`, `popupContentControlVisibilityReport`, `popupVideoFilterRoutePolicy`, `popupRuntimeMessageContract`, `popupRenderStateDependencyReport`, `popupAccessibilityContract`, or `popupFixtureProvenance`/);
});

test('active goal completion audit records UI components method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /UI components method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_UI_COMPONENTS_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/ui-components-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, settings-mode, shared UI, DOM selector, lifecycle\/timer, observer/);
  assert.match(source, /accessibility, toast, dropdown/);
  assert.match(source, /reliability, false-hide\/leak, performance, code-burden, and cross-feature objectives/);
  assert.match(source, /representative `UIComponents` tokens/);
  assert.match(source, /all 33 current named declarations/);
  assert.match(source, /22 plain function declarations/);
  assert.match(source, /11 const arrow helper declarations/);
  assert.match(source, /0 async function declarations/);
  assert.match(source, /19 public `UIComponents` entries/);
  assert.match(source, /7 semantic method groups/);
  assert.match(source, /module theme\/profile helpers/);
  assert.match(source, /button\/icon factories/);
  assert.match(source, /input\/select factories/);
  assert.match(source, /tab factories/);
  assert.match(source, /list\/card factories/);
  assert.match(source, /enhanced select dropdown helpers/);
  assert.match(source, /toast lifecycle/);
  assert.match(source, /inline callbacks, 17 listener sites/);
  assert.match(source, /raw HTML label\/content\/icon inputs/);
  assert.match(source, /dropdown portal teardown/);
  assert.match(source, /disabled-state observer disconnect/);
  assert.match(source, /scroll\/resize listener budget/);
  assert.match(source, /nested frame positioning/);
  assert.match(source, /toast timer cleanup/);
  assert.match(source, /profile color\/theme parity/);
  assert.match(source, /keyboard\/accessibility fixtures/);
  assert.match(source, /duplicate enhancement proof/);
  assert.match(source, /popup\/tab-view\/render-engine caller parity/);
  assert.match(source, /route\/profile\/list-mode negative UI fixtures are not complete/);
  assert.match(source, /`uiComponentsMethodAuthority`, `uiComponentsDomEffectReport`, `uiComponentsListenerLifecycleContract`, `uiComponentsDropdownTeardownRegistry`, `uiComponentsToastLifecycleBudget`, `uiComponentsAccessibilityContract`, `uiComponentsSelectorScopeReport`, `uiComponentsPublicApiManifest`, `uiComponentsRawHtmlPolicy`, `uiComponentsProfileColorContract`, or `uiComponentsFixtureProvenance`/);
});

test('active goal completion audit records security manager method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Security manager method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SECURITY_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/security-manager-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, profile\/lock, import\/export, encrypted backup, Nanah restore/);
  assert.match(source, /reliability, performance, code-burden, cross-feature, and implementation-change objectives/);
  assert.match(source, /representative `FilterTubeSecurity` tokens/);
  assert.match(source, /all 12 current named declarations/);
  assert.match(source, /6 plain function declarations/);
  assert.match(source, /6 async function declarations/);
  assert.match(source, /0 const arrow helper declarations/);
  assert.match(source, /4 public `FilterTubeSecurity` entries/);
  assert.match(source, /5 semantic method groups/);
  assert.match(source, /crypto defensive helpers/);
  assert.match(source, /byte encoding helpers/);
  assert.match(source, /PBKDF2 derivation/);
  assert.match(source, /PIN verifier lifecycle/);
  assert.match(source, /encrypted JSON lifecycle/);
  assert.match(source, /caller authorization paths/);
  assert.match(source, /profile lock gate/);
  assert.match(source, /parent\/child mutation gate/);
  assert.match(source, /import preview/);
  assert.match(source, /Nanah trust decision/);
  assert.match(source, /backup rotation effect/);
  assert.match(source, /encrypted payload compatibility/);
  assert.match(source, /wrong-PIN UX/);
  assert.match(source, /timing comparison policy/);
  assert.match(source, /browser WebCrypto compatibility are not complete/);
  assert.match(source, /`securityManagerMethodAuthority`, `securityManagerCryptoAvailabilityContract`, `securityManagerPinVerifierContract`, `securityManagerEncryptedJsonContract`, `securityManagerKdfCompatibilityReport`, `securityManagerTimingComparisonPolicy`, `securityManagerPayloadValidationReport`, `securityManagerCallerMutationGate`, or `securityManagerFixtureProvenance`/);
});

test('active goal completion audit records content controls catalog method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content controls catalog method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_CONTROLS_CATALOG_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/content-controls-catalog-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, settings-mode, UI catalog, content-control, route\/surface/);
  assert.match(source, /reliability, false-hide\/leak, performance, code-burden, cross-feature, and implementation-change objectives/);
  assert.match(source, /representative `FilterTubeContentControlsCatalog` tokens/);
  assert.match(source, /all 3 current named declarations/);
  assert.match(source, /3 plain function declarations/);
  assert.match(source, /0 async function declarations/);
  assert.match(source, /0 const arrow helper declarations/);
  assert.match(source, /3 public `FilterTubeContentControlsCatalog` entries/);
  assert.match(source, /2 semantic method groups/);
  assert.match(source, /content-control snapshot accessors/);
  assert.match(source, /lookup accessors/);
  assert.match(source, /7 catalog groups/);
  assert.match(source, /29 catalog controls/);
  assert.match(source, /7 `accentColor` entries/);
  assert.match(source, /1 empty description entry/);
  assert.match(source, /1 escaped-newline description entry/);
  assert.match(source, /no DOM\/listener\/timer\/storage ownership/);
  assert.match(source, /nested control objects remain shared/);
  assert.match(source, /route scope, runtime enforcement, default values/);
  assert.match(source, /settings compiler parity, background cache invalidation/);
  assert.match(source, /DOM fallback selector ownership, JSON endpoint support/);
  assert.match(source, /watch\/player route policy, Kids\/YTM surface behavior/);
  assert.match(source, /popup\/tab-view visual parity/);
  assert.match(source, /future simultaneous allow\/block semantics are not complete/);
  assert.match(source, /`contentControlsCatalogMethodAuthority`, `contentControlsCatalogRuntimeSemanticsManifest`, `contentControlsCatalogKeyParityReport`, `contentControlsCatalogRouteScopeReport`, `contentControlsCatalogControlEffectBudget`, `contentControlsCatalogAccessorCopyContract`, `contentControlsCatalogUiRuntimeAlignmentReport`, or `contentControlsCatalogFixtureProvenance`/);
});

test('active goal completion audit records Nanah sync adapter method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Nanah sync adapter method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_NANAH_SYNC_ADAPTER_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/nanah-sync-adapter-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, settings-mode, import\/export, Nanah sync, profile mutation/);
  assert.match(source, /envelope, preview\/apply, reliability, false-hide\/leak, performance/);
  assert.match(source, /code-burden, cross-feature, and implementation-change objectives/);
  assert.match(source, /representative `FilterTubeNanahAdapter` tokens/);
  assert.match(source, /all 23 current named declarations/);
  assert.match(source, /16 plain function declarations/);
  assert.match(source, /7 async function declarations/);
  assert.match(source, /0 const arrow helper declarations/);
  assert.match(source, /10 public `FilterTubeNanahAdapter` entries/);
  assert.match(source, /5 semantic method groups/);
  assert.match(source, /defensive normalization\/merge helpers/);
  assert.match(source, /scoped profile transfer/);
  assert.match(source, /runtime\/device descriptor helpers/);
  assert.match(source, /envelope build\/summary/);
  assert.match(source, /incoming envelope apply/);
  assert.match(source, /3 `JSON.stringify` calls/);
  assert.match(source, /3 `JSON.parse` calls/);
  assert.match(source, /8 `throw new Error` statements/);
  assert.match(source, /2 `new Map` calls/);
  assert.match(source, /2 `await io.loadProfilesV4` calls/);
  assert.match(source, /1 `await io.saveProfilesV4` call/);
  assert.match(source, /1 `await io.exportV3` call/);
  assert.match(source, /1 `return io.importV3` call/);
  assert.match(source, /no DOM\/listener\/timer\/storage ownership/);
  assert.match(source, /preview strategy writes no storage/);
  assert.match(source, /Main\/Kids route to scoped V4 apply/);
  assert.match(source, /active\/full route to `io.importV3\(\)`/);
  assert.match(source, /trusted-link sender class/);
  assert.match(source, /profile lock gate/);
  assert.match(source, /target-profile authorization/);
  assert.match(source, /preview\/apply equivalence/);
  assert.match(source, /mutation revision/);
  assert.match(source, /runtime refresh/);
  assert.match(source, /V3\/V4 sanitizer parity/);
  assert.match(source, /empty-whitelist warning/);
  assert.match(source, /unsupported envelope diagnostics/);
  assert.match(source, /JSON parse provenance/);
  assert.match(source, /peer device identity/);
  assert.match(source, /future simultaneous allow\/block semantics are not complete/);
  assert.match(source, /`nanahAdapterMethodAuthority`, `nanahAdapterEnvelopeContract`, `nanahAdapterScopedMutationReport`, `nanahAdapterPreviewApplyEquivalenceReport`, `nanahAdapterTargetProfileAuthority`, `nanahAdapterTrustedSenderContract`, `nanahAdapterProfileLockGate`, `nanahAdapterRuntimeRefreshContract`, `nanahAdapterSanitizerParityReport`, or `nanahAdapterFixtureProvenance`/);
});

test('active goal completion audit records block channel method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Block channel method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_BLOCK_CHANNEL_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/block-channel-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, settings-mode, quick-block, native dropdown, Kids native block/);
  assert.match(source, /DOM selector, lifecycle\/timer\/observer\/listener, mutation, optimistic hide/);
  assert.match(source, /reliability, false-hide\/leak, performance, code-burden, cross-feature, and implementation-change objectives/);
  assert.match(source, /representative block-channel tokens/);
  assert.match(source, /all 61 current named method\/helper\/callback declarations/);
  assert.match(source, /40 function declarations in scope/);
  assert.match(source, /35 plain function declarations/);
  assert.match(source, /5 async function declarations/);
  assert.match(source, /21 const helper\/callback declarations/);
  assert.match(source, /19 const arrow helper\/callback declarations/);
  assert.match(source, /2 local const IIFE result declarations/);
  assert.match(source, /9 semantic method groups/);
  assert.match(source, /module state\/mode gates/);
  assert.match(source, /surface overlay\/visibility helpers/);
  assert.match(source, /card target\/anchor resolution/);
  assert.match(source, /viewport hover\/occlusion work/);
  assert.match(source, /quick-block identity\/action builders/);
  assert.match(source, /mutation and optimistic hide paths/);
  assert.match(source, /quick-block DOM lifecycle/);
  assert.match(source, /dropdown injection lifecycle/);
  assert.match(source, /Kids native block sync/);
  assert.match(source, /34 `addEventListener` calls/);
  assert.match(source, /6 `MutationObserver` references/);
  assert.match(source, /6 `observe` calls/);
  assert.match(source, /2 `disconnect` calls/);
  assert.match(source, /11 `setTimeout` calls/);
  assert.match(source, /1 `setInterval` call/);
  assert.match(source, /3 `requestAnimationFrame` calls/);
  assert.match(source, /5 `document.createElement` occurrences/);
  assert.match(source, /17 `setAttribute` calls/);
  assert.match(source, /11 `style.display` references/);
  assert.match(source, /2 `chrome.runtime\?\.sendMessage` calls/);
  assert.match(source, /2 `addChannelDirectly` references/);
  assert.match(source, /2 `applyDOMFallback` references/);
  assert.match(source, /delayed boot starts menu and quick-block observers after 1000ms/);
  assert.match(source, /quick-block gate requires `showQuickBlockButton === true` and non-whitelist mode/);
  assert.match(source, /optimistic hide writes `style.display = 'none'`/);
  assert.match(source, /Kids native block sends `FilterTube_KidsBlockChannel`/);
  assert.match(source, /no `removeEventListener` path and no `clearInterval` path/);
  assert.match(source, /quick-block route ownership, disabled\/no-rule lifecycle budgets/);
  assert.match(source, /whitelist zero-observer behavior, overlay pause policy/);
  assert.match(source, /dropdown observer teardown, per-card identity confidence/);
  assert.match(source, /sibling-visible hide proof, Kids\/native sender trust/);
  assert.match(source, /mutation revision, and future simultaneous allow\/block semantics are not complete/);
  assert.match(source, /`blockChannelMethodAuthority`, `blockChannelQuickBlockLifecycleContract`, `blockChannelQuickBlockActionReport`, `blockChannelAffordanceNoWorkBudget`, `blockChannelSelectorTargetReport`, `blockChannelOptimisticHideReport`, `blockChannelDropdownObserverRegistry`, `blockChannelKidsNativeSyncContract`, `blockChannelMutationSenderContract`, or `blockChannelFixtureProvenance`/);
});

test('active goal completion audit records collaborator dialog method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Collaborator dialog method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_COLLAB_DIALOG_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/collab-dialog-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, collaborator lifecycle, learned identity, page-message trust/);
  assert.match(source, /DOM selector, mutation, reliability, false-hide\/leak, performance/);
  assert.match(source, /code-burden, cross-feature, and implementation-change objectives/);
  assert.match(source, /lifecycle-only collaborator dialog tokens/);
  assert.match(source, /all 13 current named function declarations/);
  assert.match(source, /13 plain function declarations/);
  assert.match(source, /0 async function declarations/);
  assert.match(source, /0 const helper\/callback declarations/);
  assert.match(source, /9 arrow callback sites in scope/);
  assert.match(source, /6 semantic method groups/);
  assert.match(source, /refresh and boot lifecycle/);
  assert.match(source, /trigger capture and queueing/);
  assert.match(source, /entry resolution/);
  assert.match(source, /card mutation and propagation/);
  assert.match(source, /broadcast and extraction/);
  assert.match(source, /dialog acceptance\/observer dispatch/);
  assert.match(source, /3 `addEventListener` calls/);
  assert.match(source, /1 `MutationObserver` reference/);
  assert.match(source, /1 `observe` call/);
  assert.match(source, /0 `disconnect` calls/);
  assert.match(source, /2 `setTimeout` calls/);
  assert.match(source, /2 `clearTimeout` calls/);
  assert.match(source, /1 `document.querySelectorAll` call/);
  assert.match(source, /6 element `querySelector` calls/);
  assert.match(source, /7 `setAttribute` calls/);
  assert.match(source, /4 `removeAttribute` calls/);
  assert.match(source, /1 `postMessage` call/);
  assert.match(source, /2 `applyDOMFallback` references/);
  assert.match(source, /7 `pendingCollabCards` references/);
  assert.match(source, /12 `pendingCollabDialogTrigger` references/);
  assert.match(source, /2 `resolvedCollaboratorsByVideoId` references/);
  assert.match(source, /1 `refreshActiveCollaborationMenu` reference/);
  assert.match(source, /boot only runs from `DOMContentLoaded`/);
  assert.match(source, /`window.collabDialogModule` exports 4 helpers/);
  assert.match(source, /document click\/keydown capture listeners have no removal path/);
  assert.match(source, /dialog observer has no disconnect path/);
  assert.match(source, /collaborator cards can be mutated/);
  assert.match(source, /`resolvedCollaboratorsByVideoId` can be updated/);
  assert.match(source, /active collaboration menus can be refreshed/);
  assert.match(source, /`FilterTube_CollabDialogData` is posted with wildcard target/);
  assert.match(source, /collaborator lifecycle ownership, page-message trust, pending-card provenance/);
  assert.match(source, /dialog title\/header acceptance, learned identity confidence/);
  assert.match(source, /Mix\/avatar-stack false-hide boundaries/);
  assert.match(source, /route\/profile\/list-mode negative fixtures/);
  assert.match(source, /disabled\/no-rule lifecycle budgets, observer\/listener teardown/);
  assert.match(source, /future simultaneous allow\/block semantics are not complete/);
  assert.match(source, /`collabDialogMethodAuthority`, `collabDialogLifecycleContract`, `collabDialogPendingCardAuthority`, `collabDialogMutationReport`, `collabDialogMessageTrustContract`, `collabDialogSelectorTargetReport`, `collabDialogIdentityConfidenceReport`, `collabDialogNoWorkBudget`, `collabDialogTeardownRegistry`, or `collabDialogFixtureProvenance`/);
});

test('active goal completion audit records injector method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Injector method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_INJECTOR_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/injector-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, main-world bridge, settings relay, subscription import/);
  assert.match(source, /page-message trust, learned identity lookup, DOM selector/);
  assert.match(source, /lifecycle\/timer, network\/fetch, page-global hook/);
  assert.match(source, /reliability, false-hide\/leak, performance, code-burden/);
  assert.match(source, /representative injector settings capability tokens/);
  assert.match(source, /`js\/injector\.js`/);
  assert.match(source, /all 103 current named method\/helper\/callback declarations/);
  assert.match(source, /64 function declarations in scope/);
  assert.match(source, /61 plain function declarations/);
  assert.match(source, /3 async function declarations/);
  assert.match(source, /39 const helper\/callback declarations/);
  assert.match(source, /31 const arrow helper\/callback declarations/);
  assert.match(source, /1 async const arrow helper\/callback declaration/);
  assert.match(source, /7 const IIFE result declarations/);
  assert.match(source, /100 arrow callback sites in scope/);
  assert.match(source, /12 semantic method groups/);
  assert.match(source, /bridge lifecycle\/logging/);
  assert.match(source, /collaborator identity sanitization/);
  assert.match(source, /subscription context helpers/);
  assert.match(source, /subscription seed collection/);
  assert.match(source, /subscription expansion\/wait work/);
  assert.match(source, /subscription entry normalization\/summary/);
  assert.match(source, /credentialed YouTubei fetch queueing/);
  assert.match(source, /collaborator matcher\/cache work/);
  assert.match(source, /collaborator data extraction/);
  assert.match(source, /channel snapshot identity search/);
  assert.match(source, /collaborator snapshot\/DOM search/);
  assert.match(source, /seed hook\/queue lifecycle/);
  assert.match(source, /2 `window.addEventListener` calls/);
  assert.match(source, /0 `removeEventListener` calls/);
  assert.match(source, /5 `setTimeout` calls/);
  assert.match(source, /1 `setInterval` call/);
  assert.match(source, /1 `fetch` call/);
  assert.match(source, /10 `postMessage` calls/);
  assert.match(source, /10 wildcard postMessage target calls/);
  assert.match(source, /2 `dispatchEvent` calls/);
  assert.match(source, /1 click call/);
  assert.match(source, /3 `scrollTo` calls/);
  assert.match(source, /2 `Object.defineProperty` calls/);
  assert.match(source, /58 `window.filterTube` references/);
  assert.match(source, /15 `FilterTubeEngine` references/);
  assert.match(source, /7 `initialDataQueue` references/);
  assert.match(source, /6 `collaboratorCache` references/);
  assert.match(source, /subscription import bridge install runs before the duplicate-run guard/);
  assert.match(source, /settings messages merge caller payload into `currentSettings` without a revision gate/);
  assert.match(source, /subscription import can scroll\/click and issue credentialed `\/youtubei\/v1\/browse\?prettyPrint=false` requests/);
  assert.match(source, /collaborator\/channel lookup responses use wildcard page messages/);
  assert.match(source, /`connectToSeedGlobal\(\)` writes seed processing hooks/);
  assert.match(source, /backup `ytInitialData` hook uses `Object.defineProperty`/);
  assert.match(source, /engine readiness interval polls every 100ms with a 5000ms timeout/);
  assert.match(source, /there is no listener teardown path/);
  assert.match(source, /injector message authority, settings revision ownership/);
  assert.match(source, /subscription import action ownership, YouTubei fetch budget/);
  assert.match(source, /snapshot provenance, identity confidence, page-global patch ownership/);
  assert.match(source, /route\/profile\/list-mode negative fixtures/);
  assert.match(source, /disabled\/no-rule budgets, listener teardown/);
  assert.match(source, /future simultaneous allow\/block semantics are not complete/);
  assert.match(source, /`injectorMethodAuthority`, `injectorBridgeMessageTrustContract`, `injectorSettingsRevisionContract`, `injectorSubscriptionImportActionToken`, `injectorSubscriptionImportWorkBudget`, `injectorYoutubeiFetchPolicy`, `injectorSnapshotSearchProvenance`, `injectorCollaboratorIdentityConfidenceReport`, `injectorChannelLookupAuthority`, `injectorSeedHookLifecycleContract`, `injectorPageGlobalPatchReport`, or `injectorFixtureProvenance`/);
  assert.match(source, /`js\/injector\.js`, and `js\/content\/menu\.js` now have source-derived method inventories/);
});

test('active goal completion audit records content menu method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content menu method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_MENU_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/content-menu-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, content helper, menu CSS, HTML escaping/);
  assert.match(source, /DOM style injection, load-order, theme\/menu vocabulary/);
  assert.match(source, /reliability, false-hide\/leak, performance, code-burden/);
  assert.match(source, /helper-count `js\/content\/menu\.js` tokens/);
  assert.match(source, /all 2 current named function declarations/);
  assert.match(source, /2 plain function declarations/);
  assert.match(source, /0 async function declarations/);
  assert.match(source, /0 const helper\/callback declarations/);
  assert.match(source, /1 module-scoped state declaration/);
  assert.match(source, /0 arrow callback sites in scope/);
  assert.match(source, /2 semantic method groups/);
  assert.match(source, /HTML escaping/);
  assert.match(source, /shared menu style injection/);
  assert.match(source, /3 `document` literal occurrences/);
  assert.match(source, /0 `window` literal occurrences/);
  assert.match(source, /0 selector API calls/);
  assert.match(source, /1 `document.createElement` call/);
  assert.match(source, /1 `document.documentElement` reference/);
  assert.match(source, /0 `addEventListener` calls/);
  assert.match(source, /0 `MutationObserver` references/);
  assert.match(source, /0 `setTimeout` calls/);
  assert.match(source, /0 `setInterval` calls/);
  assert.match(source, /1 `textContent` reference/);
  assert.match(source, /1 `appendChild` call/);
  assert.match(source, /5 `\.replace` calls/);
  assert.match(source, /3 `filterTubeMenuStylesInjected` references/);
  assert.match(source, /21 `filtertube-menu-item` selector token occurrences/);
  assert.match(source, /31 `filtertube-block-channel-item` selector token occurrences/);
  assert.match(source, /9 `filtertube-modern-bottom-sheet-item` selector token occurrences/);
  assert.match(source, /14 `filtertube-filter-all-toggle` selector token occurrences/);
  assert.match(source, /114 `!important` declarations/);
  assert.match(source, /`js\/content\/menu\.js` is manifest-loaded before `js\/content_bridge\.js`/);
  assert.match(source, /`escapeHtml\(\)` escapes five HTML-sensitive characters/);
  assert.match(source, /`ensureFilterTubeMenuStyles\(\)` appends `#filtertube-menu-styles` to `document.documentElement`/);
  assert.match(source, /boolean-only injection guard/);
  assert.match(source, /no duplicate DOM check beyond the boolean/);
  assert.match(source, /no style teardown path/);
  assert.match(source, /there is no explicit export/);
  assert.match(source, /menu affordance authority, style scope, load-order ownership/);
  assert.match(source, /theme parity, block\/allow vocabulary, native menu surface coverage/);
  assert.match(source, /disabled\/no-rule budgets, duplicate injection behavior, style teardown/);
  assert.match(source, /future simultaneous allow\/block semantics are not complete/);
  assert.match(source, /`contentMenuMethodAuthority`, `contentMenuStyleInjectionContract`, `contentMenuHtmlEscapingContract`, `contentMenuStyleScopeReport`, `contentMenuLoadOrderContract`, `contentMenuThemeParityReport`, `contentMenuTeardownRegistry`, or `contentMenuFixtureProvenance`/);
});

test('active goal completion audit records bridge settings method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Bridge settings method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_BRIDGE_SETTINGS_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/bridge-settings-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, settings relay, runtime message, subscription import/);
  assert.match(source, /page-message trust, seed relay, storage refresh, profile\/host/);
  assert.match(source, /representative `js\/content\/bridge_settings\.js` tokens/);
  assert.match(source, /all 23 current named method\/helper\/callback declarations/);
  assert.match(source, /12 plain function declarations/);
  assert.match(source, /1 named function expression declaration/);
  assert.match(source, /10 const helper\/callback declarations/);
  assert.match(source, /5 const arrow helper\/callback declarations/);
  assert.match(source, /5 const IIFE result declarations/);
  assert.match(source, /0 async function declarations/);
  assert.match(source, /0 async const arrow declarations/);
  assert.match(source, /39 arrow callback sites in scope/);
  assert.match(source, /7 semantic method groups/);
  assert.match(source, /import readiness waiters/);
  assert.match(source, /subscription import requests/);
  assert.match(source, /runtime action profile gates/);
  assert.match(source, /host normalization/);
  assert.match(source, /background settings fetch\/debug work/);
  assert.match(source, /seed relay lifecycle/);
  assert.match(source, /storage refresh fanout/);
  assert.match(source, /2 `window.addEventListener` calls/);
  assert.match(source, /0 `removeEventListener` calls/);
  assert.match(source, /1 runtime `onMessage.addListener` call/);
  assert.match(source, /1 storage `onChanged.addListener` call/);
  assert.match(source, /6 `setTimeout` calls/);
  assert.match(source, /2 `clearTimeout` calls/);
  assert.match(source, /0 `MutationObserver` references/);
  assert.match(source, /2 wildcard `postMessage` calls/);
  assert.match(source, /2 runtime sendMessage calls/);
  assert.match(source, /6 `applyDOMFallback` references/);
  assert.match(source, /4 `injectMainWorldScripts` references/);
  assert.match(source, /5 `sendSettingsToMainWorld` references/);
  assert.match(source, /3 `scheduleSeedRetry` references/);
  assert.match(source, /import request clamping/);
  assert.match(source, /`event.source === window` plus `data.source === 'injector'` message gates/);
  assert.match(source, /`getCompiledSettings` background fetches/);
  assert.match(source, /Kids empty-whitelist normalization to blocklist mode/);
  assert.match(source, /wildcard `FilterTube_SettingsToInjector` settings relay/);
  assert.match(source, /250ms seed retries/);
  assert.match(source, /ignored `channelMap`-only storage writes/);
  assert.match(source, /video-map storage refresh without forced DOM reprocess/);
  assert.match(source, /sender trust, settings revision ownership/);
  assert.match(source, /subscription import action token and progress budget/);
  assert.match(source, /runtime action sender authority, storage refresh authority/);
  assert.match(source, /profile\/host authority, seed retry budget/);
  assert.match(source, /future simultaneous allow\/block semantics are not complete/);
  assert.match(source, /`bridgeSettingsMethodAuthority`, `bridgeSettingsMessageTrustContract`, `bridgeSettingsSubscriptionImportActionToken`, `bridgeSettingsSubscriptionImportProgressBudget`, `bridgeSettingsRuntimeActionSenderContract`, `bridgeSettingsSettingsRevisionContract`, `bridgeSettingsSeedRelayBudget`, `bridgeSettingsStorageRefreshAuthority`, `bridgeSettingsProfileHostContract`, or `bridgeSettingsFixtureProvenance`/);
  assert.match(source, /`js\/content\/bridge_settings\.js` now has settings relay\/import\/storage method semantics/);
});

test('active goal completion audit records handle resolver method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Handle resolver method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_HANDLE_RESOLVER_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/handle-resolver-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, learned-identity, network, storage\/cache/);
  assert.match(source, /page-message trust, DOM fallback rerun/);
  assert.match(source, /representative `js\/content\/handle_resolver\.js` tokens/);
  assert.match(source, /all 7 current named method\/helper declarations/);
  assert.match(source, /6 plain function declarations/);
  assert.match(source, /1 async function declaration/);
  assert.match(source, /0 const helper\/callback declarations/);
  assert.match(source, /0 const arrow helper\/callback declarations/);
  assert.match(source, /5 arrow callback sites in scope/);
  assert.match(source, /4 semantic method groups/);
  assert.match(source, /learned map persistence/);
  assert.match(source, /handle normalization/);
  assert.match(source, /DOM fallback rerun scheduling/);
  assert.match(source, /resolver fetch\/cache behavior/);
  assert.match(source, /0 `document` literal occurrences/);
  assert.match(source, /5 `window` literal occurrences/);
  assert.match(source, /4 `browserAPI_BRIDGE` references/);
  assert.match(source, /8 `currentSettings` references/);
  assert.match(source, /3 `applyDOMFallback` references/);
  assert.match(source, /15 `resolvedHandleCache` references/);
  assert.match(source, /4 `pendingDomFallbackRerunTimer` references/);
  assert.match(source, /2 `FilterTube_UpdateChannelMap` references/);
  assert.match(source, /1 `fetchChannelDetails` reference/);
  assert.match(source, /12 `channelMap` references/);
  assert.match(source, /4 `PENDING` token occurrences/);
  assert.match(source, /1 `setTimeout` call/);
  assert.match(source, /0 `addEventListener` calls/);
  assert.match(source, /0 `MutationObserver` references/);
  assert.match(source, /2 wildcard `postMessage` calls/);
  assert.match(source, /2 runtime sendMessage calls/);
  assert.match(source, /1 same-origin `fetch` call/);
  assert.match(source, /1 `browserAPI_BRIDGE.storage.local.get` reference/);
  assert.match(source, /1 `response.text` reference/);
  assert.match(source, /1 `text.match` reference/);
  assert.match(source, /resolver reads `channelMap` before network work/);
  assert.match(source, /`PENDING` sentinel that returns null to callers/);
  assert.match(source, /delegate `backgroundOnly` repair to `fetchChannelDetails`/);
  assert.match(source, /fetch `\/@handle\/about` and `\/@handle`/);
  assert.match(source, /posts `FilterTube_UpdateChannelMap` with wildcard target/);
  assert.match(source, /mutates `currentSettings.channelMap`/);
  assert.match(source, /250ms forced DOM fallback rerun/);
  assert.match(source, /no listener, observer, interval, teardown/);
  assert.match(source, /settings revision, network budget, or message trust token/);
  assert.match(source, /resolver network authority, learned-map write authority/);
  assert.match(source, /page-message trust, identity confidence, background fetch sender trust/);
  assert.match(source, /no-rule budgets, cache revision, DOM fallback rerun ownership/);
  assert.match(source, /future simultaneous allow\/block semantics are not complete/);
  assert.match(source, /`handleResolverMethodAuthority`, `handleResolverNetworkPolicy`, `handleResolverCacheContract`, `handleResolverMapWriteAuthority`, `handleResolverPageMessageTrustContract`, `handleResolverDomFallbackRerunBudget`, `handleResolverBackgroundFetchContract`, `handleResolverIdentityConfidenceReport`, `handleResolverNoRuleBudget`, or `handleResolverFixtureProvenance`/);
  assert.match(source, /`js\/content\/handle_resolver\.js` now has identity repair\/network\/cache method semantics/);
});

test('active goal completion audit records DOM extractors method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /DOM extractors method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_DOM_EXTRACTORS_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/dom-extractors-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, DOM selector, learned-identity/);
  assert.match(source, /hide\/restore, reliability, false-hide\/leak/);
  assert.match(source, /representative `js\/content\/dom_extractors\.js` tokens/);
  assert.match(source, /semantic proof for DOM identity extraction and cached stamps/);
  assert.match(source, /18 current top-level function declarations/);
  assert.match(source, /0 async function declarations/);
  assert.match(source, /5 local const arrow or IIFE result declarations/);
  assert.match(source, /23 arrow token sites/);
  assert.match(source, /47 `VIDEO_CARD_SELECTORS` entries/);
  assert.match(source, /5 semantic method groups/);
  assert.match(source, /card identity stamping and recycled-node cleanup/);
  assert.match(source, /card selector and title extraction/);
  assert.match(source, /duration parsing and cache behavior/);
  assert.match(source, /channel metadata normalization and cache behavior/);
  assert.match(source, /video id extraction waterfall/);
  assert.match(source, /21 `querySelector` calls/);
  assert.match(source, /4 `querySelectorAll` calls/);
  assert.match(source, /9 `closest` calls/);
  assert.match(source, /20 `getAttribute` calls/);
  assert.match(source, /7 `setAttribute` calls/);
  assert.match(source, /59 `removeAttribute` calls/);
  assert.match(source, /8 `hasAttribute` calls/);
  assert.match(source, /2 `classList.remove` calls/);
  assert.match(source, /2 `style.display` references/);
  assert.match(source, /10 `textContent` references/);
  assert.match(source, /3 `innerText` references/);
  assert.match(source, /87 `data-filtertube-\*` token occurrences/);
  assert.match(source, /0 timers/);
  assert.match(source, /0 listeners/);
  assert.match(source, /0 observers/);
  assert.match(source, /0 page messages/);
  assert.match(source, /0 runtime messages/);
  assert.match(source, /0 fetches/);
  assert.match(source, /video-id stamping can clear stale recycled-node channel/);
  assert.match(source, /channel metadata extraction can trust or remove cached handle\/id values/);
  assert.match(source, /write new DOM channel stamps/);
  assert.match(source, /empty `data-filtertube-duration` negative cache/);
  assert.match(source, /prefers Kids\/current hrefs/);
  assert.match(source, /stamped, dataset, attribute, and selected data-host slots/);
  assert.match(source, /selector scope, identity confidence, cache freshness/);
  assert.match(source, /video stamp mutation reporting, channel metadata provenance/);
  assert.match(source, /duration cache budgets, innerText fallback budgets/);
  assert.match(source, /recycled-node restore proof/);
  assert.match(source, /future simultaneous allow\/block semantics are not complete/);
  assert.match(source, /`domExtractorMethodAuthority`, `domExtractorIdentityConfidenceReport`, `domExtractorSelectorScopeContract`, `domExtractorCacheFreshnessContract`, `domExtractorVideoStampMutationReport`, `domExtractorChannelMetadataReport`, `domExtractorDurationCacheBudget`, `domExtractorInnerTextBudget`, `domExtractorRecycledNodeRestoreProof`, or `domExtractorFixtureProvenance`/);
  assert.match(source, /`js\/content\/dom_extractors\.js` now has DOM identity\/cache\/stamp method semantics/);
});

test('active goal completion audit records shared identity method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Shared identity method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SHARED_IDENTITY_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/shared-identity-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, shared identity, learned-identity/);
  assert.match(source, /settings-mode, false-hide\/leak, performance/);
  assert.match(source, /representative `js\/shared\/identity\.js` tokens/);
  assert.match(source, /semantic proof for identity normalization and channel matching/);
  assert.match(source, /22 current IIFE-scoped named function declarations/);
  assert.match(source, /22 plain function declarations/);
  assert.match(source, /0 async function declarations/);
  assert.match(source, /5 const arrow helper declarations/);
  assert.match(source, /1 returned arrow helper declaration/);
  assert.match(source, /8 arrow token sites/);
  assert.match(source, /14 public `FilterTubeIdentity` API entries/);
  assert.match(source, /6 semantic method groups/);
  assert.match(source, /handle normalization/);
  assert.match(source, /canonical UC\/custom URL input handling/);
  assert.match(source, /channel filter index construction/);
  assert.match(source, /indexed channel matching/);
  assert.match(source, /direct one-filter matching/);
  assert.match(source, /fast HTML fragment identity extraction/);
  assert.match(source, /0 `document` literal occurrences/);
  assert.match(source, /3 `window` literal occurrences/);
  assert.match(source, /3 `self` literal occurrences/);
  assert.match(source, /1 `globalThis` literal occurrence/);
  assert.match(source, /4 `new URL` calls/);
  assert.match(source, /1 `JSON.parse` call/);
  assert.match(source, /3 `decodeURIComponent` calls/);
  assert.match(source, /8 `new Set` calls/);
  assert.match(source, /0 `new Map` calls/);
  assert.match(source, /2 `Array.isArray` calls/);
  assert.match(source, /9 try\/catch blocks/);
  assert.match(source, /0 listeners/);
  assert.match(source, /0 observers/);
  assert.match(source, /0 timers/);
  assert.match(source, /0 fetches/);
  assert.match(source, /0 runtime messages/);
  assert.match(source, /0 page messages/);
  assert.match(source, /1 `Object.assign` export merge/);
  assert.match(source, /`normalizeUcIdForComparison` is internal/);
  assert.match(source, /`StateManager` optional probe/);
  assert.match(source, /existing extra `root.FilterTubeIdentity` keys are preserved/);
  assert.match(source, /encoded zero-width handles normalize/);
  assert.match(source, /`normalizeHandleValue\('@Some Handle'\)` returns `@some`/);
  assert.match(source, /indexed matching protects stable-name matches/);
  assert.match(source, /direct `channelMatchesFilter` can match object filters by equal name/);
  assert.match(source, /name-only strings can match through `buildChannelFilterIndex`/);
  assert.match(source, /direct `channelMatchesFilter` does not match a plain string name/);
  assert.match(source, /fast HTML extraction returns null unless it finds an id, handle, or custom URL/);
  assert.match(source, /shared identity authority, API\/export parity/);
  assert.match(source, /normalization contracts, match decision reporting/);
  assert.match(source, /index\/direct parity, caller fallback parity/);
  assert.match(source, /HTML extraction provenance, name-fallback policy/);
  assert.match(source, /unicode fixtures, load-order proof/);
  assert.match(source, /future simultaneous allow\/block semantics are not complete/);
  assert.match(source, /`sharedIdentityMethodAuthority`, `sharedIdentityApiManifest`, `sharedIdentityNormalizationContract`, `sharedIdentityMatchDecisionReport`, `sharedIdentityIndexParityReport`, `sharedIdentityCallerParityReport`, `sharedIdentityHtmlExtractionProvenance`, `sharedIdentityNameFallbackPolicy`, `sharedIdentityUnicodeFixtureProvenance`, or `sharedIdentityLoadOrderContract`/);
  assert.match(source, /`js\/shared\/identity\.js` now has matching\/normalization method semantics/);
});

test('active goal completion audit records prompt onboarding method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Prompt onboarding method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_PROMPT_ONBOARDING_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/prompt-onboarding-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, prompt\/onboarding, runtime lifecycle/);
  assert.match(source, /message\/mutation, external navigation, DOM overlay/);
  assert.match(source, /representative prompt surface tokens/);
  assert.match(source, /semantic proof for prompt overlays and navigation/);
  assert.match(source, /both current prompt content-script modules/);
  assert.match(source, /440 combined source lines/);
  assert.match(source, /9 named function declarations/);
  assert.match(source, /9 plain function declarations/);
  assert.match(source, /0 async function declarations/);
  assert.match(source, /1 const arrow callback declaration/);
  assert.match(source, /14 arrow token sites/);
  assert.match(source, /4 semantic method groups/);
  assert.match(source, /theme palette/);
  assert.match(source, /DOM overlay assembly/);
  assert.match(source, /dismissal\/ack behavior/);
  assert.match(source, /eligibility requests/);
  assert.match(source, /18 `document\.createElement` calls/);
  assert.match(source, /3 `document\.getElementById` calls/);
  assert.match(source, /18 `appendChild` calls/);
  assert.match(source, /6 `onclick` assignments/);
  assert.match(source, /2 `addEventListener` calls/);
  assert.match(source, /0 `removeEventListener` calls/);
  assert.match(source, /0 `MutationObserver` references/);
  assert.match(source, /3 `setTimeout` calls/);
  assert.match(source, /0 intervals/);
  assert.match(source, /0 fetches/);
  assert.match(source, /5 runtime sendMessage calls/);
  assert.match(source, /1 runtime `getURL` call/);
  assert.match(source, /1 `window\.open` call/);
  assert.match(source, /1 `location\.href` write/);
  assert.match(source, /1 `window\.location\.reload` call/);
  assert.match(source, /release prompt loads before first-run prompt/);
  assert.match(source, /install\/update background paths inject only `first_run_prompt\.js`/);
  assert.match(source, /duplicate guards are per-prompt ids/);
  assert.match(source, /anonymous style nodes have no teardown/);
  assert.match(source, /first-run completion is sent before reload/);
  assert.match(source, /`FilterTube_OpenWhatsNew` uses caller `targetLink`/);
  assert.match(source, /`window\.open`\/`location\.href` fallback/);
  assert.match(source, /prompt priority, replay ownership, sender trust/);
  assert.match(source, /storage ack reporting, URL allowlisting, viewport fit/);
  assert.match(source, /duplicate overlay ownership, style teardown/);
  assert.match(source, /future simultaneous allow\/block semantics are not complete/);
  assert.match(source, /`PromptCoordinator`, `promptQueue`, `activePromptOwner`, `promptOnboardingMethodAuthority`, `promptOnboardingQueueContract`, `promptOnboardingSenderClassContract`, `promptOnboardingStorageAckReport`, `promptOnboardingUrlNavigationPolicy`, `promptOnboardingDomLifecycleContract`, `promptOnboardingViewportFitProof`, `promptOnboardingDuplicateOverlayRegistry`, `promptOnboardingStyleTeardownRegistry`, or `promptOnboardingFixtureProvenance`/);
  assert.match(source, /`js\/content\/first_run_prompt\.js` plus `js\/content\/release_notes_prompt\.js` now have prompt overlay\/navigation method semantics/);
});

test('active goal completion audit records bridge injection method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Bridge injection method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_BRIDGE_INJECTION_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/bridge-injection-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, startup injection, main-world script injection/);
  assert.match(source, /manifest load order, background message, fallback DOM script lifecycle/);
  assert.match(source, /settings relay, runtime lifecycle\/timer/);
  assert.match(source, /representative startup\/content-helper tokens/);
  assert.match(source, /semantic proof for isolated bridge injection/);
  assert.match(source, /`js\/content\/bridge_injection\.js`/);
  assert.match(source, /127 source lines/);
  assert.match(source, /5 named method\/helper declarations/);
  assert.match(source, /1 plain function declaration/);
  assert.match(source, /2 async function declarations/);
  assert.match(source, /1 named function expression declaration/);
  assert.match(source, /1 async named function expression declaration/);
  assert.match(source, /0 const helper\/callback declarations/);
  assert.match(source, /0 const arrow helper\/callback declarations/);
  assert.match(source, /8 arrow callback sites/);
  assert.match(source, /4 semantic method groups/);
  assert.match(source, /debug\/global bootstrap/);
  assert.match(source, /background scripting/);
  assert.match(source, /fallback DOM script injection/);
  assert.match(source, /main-world orchestration/);
  assert.match(source, /15 `globalThis` literal occurrences/);
  assert.match(source, /15 `bridgeState` references/);
  assert.match(source, /5 `scriptsInjected` references/);
  assert.match(source, /3 `injectionInProgress` references/);
  assert.match(source, /7 `injectionPromise` references/);
  assert.match(source, /4 `browserAPI_BRIDGE` references/);
  assert.match(source, /4 `IS_FIREFOX_BRIDGE` references/);
  assert.match(source, /5 `currentSettings` references/);
  assert.match(source, /7 `debugLog` references/);
  assert.match(source, /4 `injectMainWorldScripts` references/);
  assert.match(source, /2 `requestSettingsFromBackground` references/);
  assert.match(source, /1 `api\.runtime\.sendMessage` call/);
  assert.match(source, /1 `api\.runtime\.getURL` call/);
  assert.match(source, /1 `api\.scripting\?\.executeScript` reference/);
  assert.match(source, /4 `document` literal occurrences/);
  assert.match(source, /1 `document\.createElement` call/);
  assert.match(source, /1 `appendChild` call/);
  assert.match(source, /2 `setTimeout` calls/);
  assert.match(source, /0 listeners/);
  assert.match(source, /0 observers/);
  assert.match(source, /0 page messages/);
  assert.match(source, /2 `new Promise` calls/);
  assert.match(source, /2 `new Error` calls/);
  assert.match(source, /Chromium injection delegates to background action `injectScripts`/);
  assert.match(source, /background maps caller script names to `js\/\*\.js`/);
  assert.match(source, /executes them in `MAIN` world/);
  assert.match(source, /fallback browsers append web-accessible script tags/);
  assert.match(source, /`document\.head \|\| document\.documentElement`/);
  assert.match(source, /Firefox adds `seed` only in the fallback list/);
  assert.match(source, /fallback load spacing is fixed at 50ms/);
  assert.match(source, /schedules `requestSettingsFromBackground\(\)` after 100ms/);
  assert.match(source, /failed injection clears `injectionPromise`/);
  assert.match(source, /`injectionInProgress` is state-only/);
  assert.match(source, /script injection trust, MAIN-world load-order authority/);
  assert.match(source, /Firefox\/Chromium parity, settings replay ownership/);
  assert.match(source, /retry\/backoff, global alias freshness/);
  assert.match(source, /fallback script lifecycle, sender-class policy/);
  assert.match(source, /future simultaneous allow\/block semantics are not complete/);
  assert.match(source, /`bridgeInjectionMethodAuthority`, `bridgeInjectionScriptManifest`, `bridgeInjectionMainWorldLoadOrderContract`, `bridgeInjectionSenderContract`, `bridgeInjectionFallbackDomLifecycleReport`, `bridgeInjectionRetryBudget`, `bridgeInjectionSettingsReplayContract`, `bridgeInjectionGlobalAliasContract`, or `bridgeInjectionFixtureProvenance`/);
  assert.match(source, /`js\/content\/bridge_injection\.js` now has main-world injection\/bootstrap method semantics/);
});

test('active goal completion audit records build release method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Build release method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_BUILD_RELEASE_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/build-release-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, release\/package, public release claim/);
  assert.match(source, /static\/generated\/source boundary, mobile artifact/);
  assert.match(source, /README\/docs mutation, manifest parity/);
  assert.match(source, /representative build\/release tokens/);
  assert.match(source, /semantic proof for `build\.js`/);
  assert.match(source, /`build\.js`/);
  assert.match(source, /686 source lines/);
  assert.match(source, /25 named method\/helper\/callback declarations/);
  assert.match(source, /17 plain function declarations/);
  assert.match(source, /4 async function declarations/);
  assert.match(source, /4 const arrow helper\/callback declarations/);
  assert.match(source, /37 arrow token sites/);
  assert.match(source, /35 callback-like sites/);
  assert.match(source, /6 semantic method groups/);
  assert.match(source, /package assembly/);
  assert.match(source, /mobile artifact staging/);
  assert.match(source, /release prompt\/body generation/);
  assert.match(source, /GitHub release transport/);
  assert.match(source, /interactive prompt helpers/);
  assert.match(source, /README badge\/LoC mutation/);
  assert.match(source, /3 `fs\.copySync` references/);
  assert.match(source, /1 `fs\.readJsonSync` reference/);
  assert.match(source, /1 `fs\.writeJsonSync` reference/);
  assert.match(source, /2 `fs\.writeFileSync` references/);
  assert.match(source, /8 `fs\.existsSync` references/);
  assert.match(source, /2 `https\.request` references/);
  assert.match(source, /2 `readline\.createInterface` references/);
  assert.match(source, /2 `process\.stdout\.isTTY` references/);
  assert.match(source, /9 await expressions/);
  assert.match(source, /5 `new Promise` references/);
  assert.match(source, /1 `archive\.glob` reference/);
  assert.match(source, /1 `archive\.finalize` reference/);
  assert.match(source, /2 `GITHUB_TOKEN` references/);
  assert.match(source, /1 `draft: false` reference/);
  assert.match(source, /1 `prerelease: false` reference/);
  assert.match(source, /4 `\.sha256` references/);
  assert.match(source, /0 listeners/);
  assert.match(source, /0 timers/);
  assert.match(source, /0 observers/);
  assert.match(source, /0 fetch calls/);
  assert.match(source, /normal builds mutate README badges before copying packages/);
  assert.match(source, /single-target builds preserve the rest of `dist`/);
  assert.match(source, /package roots are broad directories/);
  assert.match(source, /repairs only `collab_dialog\.js` before `content_bridge\.js`/);
  assert.match(source, /ZIP creation lacks a checksum manifest/);
  assert.match(source, /mobile artifact staging is opt-in and filename\/versionCode based/);
  assert.match(source, /non-interactive release prompting is skipped/);
  assert.match(source, /public GitHub releases are created before asset uploads/);
  assert.match(source, /failed asset uploads have no rollback\/delete path/);
  assert.match(source, /package manifest authority, README mutation policy/);
  assert.match(source, /release draft-first safety, mobile claim gating/);
  assert.match(source, /asset upload manifest proof, generated UI freshness/);
  assert.match(source, /browser manifest parity, native\/vendor freshness/);
  assert.match(source, /release fixture provenance/);
  assert.match(source, /future simultaneous allow\/block semantics are not complete/);
  assert.match(source, /`buildReleaseMethodAuthority`, `buildPackageManifestAuthority`, `buildReadmeMutationContract`, `buildReleaseDraftFirstContract`, `buildMobileArtifactClaimGate`, `buildGitHubAssetUploadManifest`, `buildGeneratedUiFreshnessReport`, `buildManifestParityReport`, `buildVendorNativeFreshnessContract`, or `buildReleaseFixtureProvenance`/);
});

test('active goal completion audit records generated UI shell method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Generated UI shell method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_GENERATED_UI_SHELL_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/generated-ui-shell-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, static\/generated\/source boundary/);
  assert.match(source, /release\/package, popup\/dashboard UI/);
  assert.match(source, /HTML load order/);
  assert.match(source, /generated marker checks/);
  assert.match(source, /semantic proof for the extension shell build\/source\/output chain/);
  assert.match(source, /`scripts\/build-extension-ui\.mjs`/);
  assert.match(source, /`src\/extension-shell\/popup\.jsx`/);
  assert.match(source, /`src\/extension-shell\/tab-view-decor\.jsx`/);
  assert.match(source, /`src\/extension-shell\/shared\/runtime\.js`/);
  assert.match(source, /`js\/ui-shell\/popup-shell\.js`/);
  assert.match(source, /`js\/ui-shell\/tab-view-decor\.js`/);
  assert.match(source, /249 authoring\/build source lines/);
  assert.match(source, /697 generated output lines/);
  assert.match(source, /7,615 authoring\/build bytes/);
  assert.match(source, /39,369 generated output bytes/);
  assert.match(source, /8 named method\/helper\/component declarations/);
  assert.match(source, /3 plain function declarations/);
  assert.match(source, /2 async function declarations/);
  assert.match(source, /3 export function declarations/);
  assert.match(source, /2 arrow token sites/);
  assert.match(source, /4 semantic method groups/);
  assert.match(source, /esbuild UI build script/);
  assert.match(source, /popup shell render/);
  assert.match(source, /tab-view ambient shell render/);
  assert.match(source, /shared shell runtime/);
  assert.match(source, /6 `document` literal occurrences in authoring\/build source/);
  assert.match(source, /1 `window` literal occurrence in authoring\/build source/);
  assert.match(source, /12 style property writes in authoring\/build source/);
  assert.match(source, /6 dataset writes\/reads in authoring\/build source/);
  assert.match(source, /2 render calls in authoring\/build source/);
  assert.match(source, /2 video JSX elements in authoring\/build source/);
  assert.match(source, /20 `document` literal occurrences in generated output/);
  assert.match(source, /2 `window` literal occurrences in generated output/);
  assert.match(source, /28 style property writes in generated output/);
  assert.match(source, /12 dataset writes\/reads in generated output/);
  assert.match(source, /4 render calls in generated output/);
  assert.match(source, /`npm run build:ui` and `build\.js` invoke the shell build/);
  assert.match(source, /two browser IIFE esbuild outputs into `js\/ui-shell`/);
  assert.match(source, /HTML load generated scripts before hand-owned runtime scripts/);
  assert.match(source, /generated output is tracked source/);
  assert.match(source, /missing mount nodes skip rendering silently/);
  assert.match(source, /build failure sets `process\.exitCode` without deleting stale output/);
  assert.match(source, /no source\/output freshness manifest/);
  assert.match(source, /generated output hash manifest/);
  assert.match(source, /`sourceMappingURL` exists today/);
  assert.match(source, /source\/output freshness, generated output hash provenance/);
  assert.match(source, /package parity, popup\/dashboard render fixtures/);
  assert.match(source, /build failure contract, stale output policy/);
  assert.match(source, /future simultaneous allow\/block semantics are not complete/);
  assert.match(source, /`generatedUiShellMethodAuthority`, `uiShellFreshnessManifest`, `uiShellSourceHashManifest`, `uiShellGeneratedOutputHash`, `uiShellGeneratedOutputOwner`, `uiShellPackageParityReport`, `uiShellBrowserRenderFixture`, `uiShellBuildFailureContract`, `uiShellSourceOutputDriftReport`, or `uiShellReleaseFixtureProvenance`/);
  assert.match(source, /generated UI shell build\/source\/output now has generated shell method\/artifact semantics/);
});

test('active goal completion audit records Nanah vendor build method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Nanah vendor build method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_NANAH_VENDOR_BUILD_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/nanah-vendor-build-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, static\/generated\/vendor boundary/);
  assert.match(source, /release\/package, dashboard Nanah sync/);
  assert.match(source, /QR generation, HTML load order/);
  assert.match(source, /vendor marker checks/);
  assert.match(source, /semantic proof for the Nanah\/QR build\/source\/output chain/);
  assert.match(source, /`scripts\/build-nanah-vendor\.mjs`/);
  assert.match(source, /`js\/vendor\/nanah\.bundle\.js`/);
  assert.match(source, /`js\/vendor\/qrcode\.bundle\.js`/);
  assert.match(source, /`html\/tab-view\.html`/);
  assert.match(source, /`js\/tab-view\.js`/);
  assert.match(source, /`js\/nanah_sync_adapter\.js`/);
  assert.match(source, /65 build script lines/);
  assert.match(source, /2,961 vendor output lines/);
  assert.match(source, /1,818 build script bytes/);
  assert.match(source, /94,657 vendor output bytes/);
  assert.match(source, /4 named method\/helper declarations/);
  assert.match(source, /0 plain function declarations/);
  assert.match(source, /4 async function declarations/);
  assert.match(source, /1 arrow token site/);
  assert.match(source, /4 semantic method groups/);
  assert.match(source, /vendor directory preparation/);
  assert.match(source, /QR vendor bundle build/);
  assert.match(source, /Nanah vendor bundle build/);
  assert.match(source, /vendor build orchestration/);
  assert.match(source, /8 `path\.resolve` occurrences/);
  assert.match(source, /2 `esbuild\.build` occurrences/);
  assert.match(source, /6 await expressions/);
  assert.match(source, /1 `fs\.mkdir` occurrence/);
  assert.match(source, /1 `window` literal occurrence/);
  assert.match(source, /0 `document` literal occurrences/);
  assert.match(source, /0 listeners/);
  assert.match(source, /0 timers/);
  assert.match(source, /0 observers/);
  assert.match(source, /0 fetch calls/);
  assert.match(source, /`npm run build:nanah-vendor` is a separate package script/);
  assert.match(source, /normal `npm run build` does not invoke `scripts\/build-nanah-vendor\.mjs`/);
  assert.match(source, /QR bundling uses `qrcode \^1\.5\.4` with lockfile version `qrcode 1\.5\.4`/);
  assert.match(source, /Nanah bundling depends on sibling `\.\.\/nanah`/);
  assert.match(source, /dashboard HTML loads `qrcode\.bundle\.js` before `nanah\.bundle\.js` before `nanah_sync_adapter\.js` before `tab-view\.js`/);
  assert.match(source, /dashboard code consumes `window\.FilterTubeQrCode\?\.toCanvas` and `window\.FilterTubeNanah`/);
  assert.match(source, /tracked vendor output has no `sourceMappingURL`/);
  assert.match(source, /build failure sets `process\.exitCode` without deleting stale vendor output/);
  assert.match(source, /Nanah sibling revision provenance, QR package\/version hash provenance/);
  assert.match(source, /output hash authority, package parity, release\/native freshness/);
  assert.match(source, /global API surface fixtures, stale output policy/);
  assert.match(source, /future simultaneous allow\/block semantics are not complete/);
  assert.match(source, /`nanahVendorBuildMethodAuthority`, `nanahVendorSourceRevisionManifest`, `nanahVendorOutputHashManifest`, `nanahVendorPackageVersionManifest`, `nanahVendorSiblingRepoContract`, `nanahVendorQrCodePackageContract`, `nanahVendorGlobalApiContract`, `nanahVendorBuildFreshnessReport`, `nanahVendorPackageParityReport`, or `nanahVendorFixtureProvenance`/);
});

test('active goal completion audit records legacy layout method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Legacy layout method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_LEGACY_LAYOUT_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/legacy-layout-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, DOM selector, visual hide\/restore/);
  assert.match(source, /packaged-but-manifest-inactive layout repair script/);
  assert.match(source, /`js\/layout\.js`/);
  assert.match(source, /680 source lines/);
  assert.match(source, /30,604 source bytes/);
  assert.match(source, /5 exported method declarations on `window\.filterTubeLayout`/);
  assert.match(source, /0 plain function declarations/);
  assert.match(source, /5 function expression properties/);
  assert.match(source, /0 async function declarations/);
  assert.match(source, /18 arrow token sites/);
  assert.match(source, /5 semantic method groups/);
  assert.match(source, /search\/watch layout repair/);
  assert.match(source, /Shorts shelf layout repair/);
  assert.match(source, /homepage Shorts layout rewrite/);
  assert.match(source, /extreme hide writer/);
  assert.match(source, /post-filter hide sweep/);
  assert.match(source, /63 selector API sites/);
  assert.match(source, /63 static selector sites/);
  assert.match(source, /0 dynamic selector sites/);
  assert.match(source, /52 unique static selector literals/);
  assert.match(source, /42 `querySelector` calls/);
  assert.match(source, /18 `querySelectorAll` calls/);
  assert.match(source, /3 `closest` calls/);
  assert.match(source, /0 `matches` calls/);
  assert.match(source, /146 direct style property writes/);
  assert.match(source, /34 `style\.display` writes/);
  assert.match(source, /3 `classList\.add` calls/);
  assert.match(source, /32 `filter-tube-visible` token occurrences/);
  assert.match(source, /10 `:not\(\.filter-tube-visible\)` selector clauses/);
  assert.match(source, /0 listeners, 0 timers, 0 observers, and 0 fetch calls/);
  assert.match(source, /absent from active and dist browser manifest content scripts/);
  assert.match(source, /copied into `dist\/chrome\/js\/layout\.js`, `dist\/firefox\/js\/layout\.js`, and `dist\/opera\/js\/layout\.js`/);
  assert.match(source, /`build\.js` broad `COMMON_DIRS` package copying/);
  assert.match(source, /has no current non-doc source caller/);
  assert.match(source, /can hide broad renderer families solely because `\.filter-tube-visible` is absent/);
  assert.match(source, /manifest load ownership, package quarantine/);
  assert.match(source, /visible-marker decision policy, extreme hide restore proof/);
  assert.match(source, /inventory coverage policy, native sync gating, deletion readiness/);
  assert.match(source, /`legacyLayoutMethodAuthority`, `legacyLayoutManifestLoadContract`, `legacyLayoutPackageQuarantineManifest`, `legacyLayoutSelectorEffectReport`, `legacyLayoutVisibleMarkerDecisionContract`, `legacyLayoutExtremeHideRestoreProof`, `legacyLayoutInventoryCoveragePolicy`, `legacyLayoutNativeSyncGate`, `legacyLayoutFixtureProvenance`, or `legacyLayoutDeletionReadinessReport`/);
});

test('active goal completion audit records native runtime sync method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Native runtime sync method semantic addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_NATIVE_RUNTIME_SYNC_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/native-runtime-sync-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /method, release\/package, native app sync/);
  assert.match(source, /JSON-first filtering parity/);
  assert.match(source, /public native sync delegation path/);
  assert.match(source, /`scripts\/sync-native-runtime\.mjs`/);
  assert.match(source, /34 source lines/);
  assert.match(source, /1,070 source bytes/);
  assert.match(source, /4 script-level semantic phases/);
  assert.match(source, /0 named method declarations/);
  assert.match(source, /0 plain function declarations/);
  assert.match(source, /0 async function declarations/);
  assert.match(source, /0 arrow token sites/);
  assert.match(source, /3 import declarations/);
  assert.match(source, /6 const declarations/);
  assert.match(source, /app repo path resolution/);
  assert.match(source, /sync script existence gating/);
  assert.match(source, /process delegation/);
  assert.match(source, /status propagation/);
  assert.match(source, /2 `path\.resolve` occurrences/);
  assert.match(source, /1 `path\.join` occurrence/);
  assert.match(source, /1 `fs\.existsSync` occurrence/);
  assert.match(source, /1 `spawnSync` call site/);
  assert.match(source, /3 `process\.exit` calls/);
  assert.match(source, /5 `console\.error` calls/);
  assert.match(source, /1 `console\.log` call/);
  assert.match(source, /0 listeners, 0 timers, 0 observers, 0 fetch calls/);
  assert.match(source, /0 write\/copy\/remove file mutation calls in the public wrapper/);
  assert.match(source, /`npm run sync:native-runtime` invokes the wrapper/);
  assert.match(source, /normal `npm run build` does not invoke it/);
  assert.match(source, /`FILTERTUBE_APP_REPO` or sibling `\.\.\/FilterTubeApp`/);
  assert.match(source, /delegates with `spawnSync\(process\.execPath, \[syncScript\]\)`/);
  assert.match(source, /inherits env and stdio/);
  assert.match(source, /exits `result\.status \?\? 1`/);
  assert.match(source, /does not read the app runtime manifest directly/);
  assert.match(source, /\/Users\/devanshvarshney\/FilterTubeApp\/tools\/sync-runtime-from-extension\.mjs/);
  assert.match(source, /1,758 lines/);
  assert.match(source, /76,587 bytes/);
  assert.match(source, /17 total named function declarations/);
  assert.match(source, /15 `runtimeBundleOrder` entries/);
  assert.match(source, /current app manifest has 28 entries all sourced from `\/Users\/devanshvarshney\/FilterTube`/);
  assert.match(source, /0 `destinationKind` fields/);
  assert.match(source, /includes `js\/layout\.js`, `js\/vendor\/nanah\.bundle\.js`, and `js\/vendor\/qrcode\.bundle\.js`/);
  assert.match(source, /excludes `data\/release_notes\.json`/);
  assert.match(source, /app repo contract, source\/app revision provenance/);
  assert.match(source, /manifest hash report, destination-kind metadata/);
  assert.match(source, /generated runtime freshness, native release gating/);
  assert.match(source, /raw-capture exclusion reporting, JSON-first filtering parity in native assets/);
  assert.match(source, /`nativeSyncWrapperMethodAuthority`, `nativeSyncWrapperAppRepoContract`, `nativeSyncWrapperAppRevisionReport`, `nativeSyncWrapperManifestHashReport`, `nativeSyncWrapperDestinationKindManifest`, `nativeSyncWrapperBuildIntegrationGate`, `nativeSyncWrapperReleaseFreshnessReport`, `nativeSyncWrapperStatusContract`, `nativeSyncWrapperFixtureProvenance`, or `nativeSyncWrapperRawCaptureExclusionReport`/);
});

test('active goal completion audit records native runtime sync manifest freshness without declaring completion', () => {
  const source = doc();

  assert.match(source, /Native runtime sync manifest freshness addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_NATIVE_RUNTIME_SYNC_MANIFEST_FRESHNESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/native-runtime-sync-manifest-freshness-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /native sync, release\/package, generated runtime/);
  assert.match(source, /first-class JSON parity/);
  assert.match(source, /direct app manifest freshness proof/);
  assert.match(source, /app repo HEAD `[0-9a-f]{40}`/);
  assert.match(source, /46 dirty app paths/);
  assert.match(source, /28 runtime sync manifest entries/);
  assert.match(source, /0 `destinationKind` fields/);
  assert.match(source, /28 direct source\/destination hash matches/);
  assert.match(source, /43 broad extension-source mirror matches/);
  assert.match(source, /15 `runtimeBundleOrder` entries including `js\/layout\.js`/);
  assert.match(source, /6 generated app runtime artifact hashes/);
  assert.match(source, /public `data\/release_notes\.json` has 316 lines/);
  assert.match(source, /current Android\/iOS native release-note resources have 301 lines/);
  assert.match(source, /direct-copy equality and mirror equality are not a release freshness authority/);
  assert.match(source, /app worktree is dirty/);
  assert.match(source, /source revision, app revision, manifest hash, destination hashes, generated runtime hashes, and release artifacts/);
  assert.match(source, /`nativeRuntimeSyncManifestFreshnessContract`, `nativeRuntimeSyncDirectCopyHashReport`, `nativeRuntimeSyncGeneratedRuntimeHashReport`, `nativeRuntimeSyncAppDirtyStateReport`, `nativeRuntimeSyncReleaseNotesParityReport`, `nativeRuntimeSyncDestinationKindManifest`, `nativeRuntimeSyncSourceMirrorReport`, `nativeRuntimeSyncRuntimeBundleOrderGate`, `nativeRuntimeSyncLayoutQuarantineGate`, or `nativeRuntimeSyncFirstClassJsonParityGate`/);
});

test('runtime source lacks active goal completion authority symbols', () => {
  const runtime = [
    'build.js',
    'scripts/build-extension-ui.mjs',
    'scripts/build-nanah-vendor.mjs',
    'scripts/sync-native-runtime.mjs',
    'src/extension-shell/popup.jsx',
    'src/extension-shell/tab-view-decor.jsx',
    'src/extension-shell/shared/runtime.js',
    'js/ui-shell/popup-shell.js',
    'js/ui-shell/tab-view-decor.js',
    'js/vendor/nanah.bundle.js',
    'js/vendor/qrcode.bundle.js',
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/background.js',
    'js/settings_shared.js',
    'js/state_manager.js',
    'js/tab-view.js',
    'js/io_manager.js',
    'js/popup.js',
    'js/ui_components.js',
    'js/security_manager.js',
    'js/content_controls_catalog.js',
    'js/nanah_sync_adapter.js',
    'js/content/block_channel.js',
    'js/content/collab_dialog.js',
    'js/injector.js',
    'js/content/menu.js',
    'js/content/bridge_injection.js',
    'js/content/bridge_settings.js',
    'js/content/handle_resolver.js',
    'js/content/dom_extractors.js',
    'js/shared/identity.js',
    'js/content/first_run_prompt.js',
    'js/content/release_notes_prompt.js',
    'js/layout.js'
  ].map(read).join('\n');

  for (const missingAuthority of [
    'activeGoalCompletionAuthority',
    'goalCompletionProofRegistry',
    'auditCompletionAuthority',
    'implementationGateOpen',
    'futureBehaviorProofRegistry'
  ]) {
    assert.doesNotMatch(runtime, new RegExp(missingAuthority));
  }
});

test('active goal completion audit records JSON-first filter readiness without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first filter readiness gate addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/json-first-filter-readiness-gate-current-behavior\.test\.mjs/);
  assert.match(source, /first-class JSON filter promotion gate/);
  assert.match(source, /13 promotion rows blocked/);
  assert.match(source, /normalized path syntax/);
  assert.match(source, /renderer ownership/);
  assert.match(source, /field-effect authority/);
  assert.match(source, /route\/surface scope/);
  assert.match(source, /list-mode semantics/);
  assert.match(source, /identity confidence/);
  assert.match(source, /mutation effect/);
  assert.match(source, /category\/network budget/);
  assert.match(source, /no-rule\/no-work budget/);
  assert.match(source, /fixture provenance/);
  assert.match(source, /DOM fallback parity/);
  assert.match(source, /native parity/);
  assert.match(source, /optimization budget/);
  assert.match(source, /`viewCount` is metadata\/search text only/);
  assert.match(source, /`videoId` is not channel identity/);
  assert.match(source, /category filtering can schedule metadata fetch work/);
  assert.match(source, /harvest can occur before disabled filtering/);
  assert.match(source, /whitelist mode bypasses the old no-rule fast path/);
  assert.match(source, /`rendererKey`, `runtimePath`, `documentedPath`, `endpoint`, `route`, `surface`, `profileType`, `listMode`, `ruleState`, `fieldEffect`, `identityConfidence`, `allowedEffects`, `forbiddenEffects`, `networkBudget`, `noWorkBudget`, `positiveFixture`, `negativeSiblingFixture`, `domParity`, `nativeParity`, and `rollbackOrRestoreProof`/);
  assert.match(source, /`jsonFirstFilterReadinessGate`, `jsonFirstPathSyntaxManifest`, `jsonFirstRendererCoverageDecision`, `jsonFirstFieldEffectDecision`, `jsonFirstRouteSurfaceReport`, `jsonFirstListModeMatrix`, `jsonFirstIdentityConfidenceReport`, `jsonFirstMutationEffectReport`, `jsonFirstCategoryFetchBudget`, `jsonFirstNoWorkBudget`, `jsonFirstFixtureProvenance`, `jsonFirstDomParityReport`, `jsonFirstNativeParityReport`, or `jsonFirstOptimizationBudget`/);
  assert.match(source, /blocked JSON-first promotion slices/);
});

test('active goal completion audit records JSON-first no-work optimization crosswalk without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first no-work optimization crosswalk addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/json-first-no-work-optimization-crosswalk-current-behavior\.test\.mjs/);
  assert.match(source, /concrete optimization locations found by codebase inspection/);
  assert.match(source, /seed fetch pass-through/);
  assert.match(source, /seed XHR pass-through/);
  assert.match(source, /engine harvest split/);
  assert.match(source, /DOM lifecycle gate/);
  assert.match(source, /quick-block lifecycle gate/);
  assert.match(source, /category metadata fetch gate/);
  assert.match(source, /metric artifact gate/);
  assert.match(source, /missing settings and disabled mode still allow fetch parse\/stringify work/);
  assert.match(source, /XHR can mark\/wrap\/hook before late guards/);
  assert.match(source, /DOM fallback considers whitelist, broad boolean controls, strict content-filter booleans, and selected-category gates active/);
  assert.match(source, /fallback menu and quick-block lifecycle work need separate budgets/);
  assert.match(source, /category filtering can become metadata network work/);
  assert.match(source, /source owner, route, surface, endpoint, profile type, list mode, rule state/);
  assert.match(source, /parse\/stringify\/processData\/harvest\/listener\/observer\/timer\/network\/storage\/hide\/restore budgets/);
  assert.match(source, /DOM parity, native parity, and metric artifacts/);
  assert.match(source, /`jsonFirstNoWorkOptimizationCrosswalk`, `jsonFirstWorkDecision`, `jsonFirstSeedPassThroughBudget`, `jsonFirstXhrPassThroughBudget`, `jsonFirstHarvestDecision`, `jsonFirstDomLifecycleBudget`, `jsonFirstQuickBlockLifecycleBudget`, `jsonFirstCategoryMetadataBudget`, `jsonFirstMetricArtifactReport`, or `jsonFirstNoWorkOptimizationBudget`/);
  assert.match(source, /optimization\/no-work slices/);
});

test('active goal completion audit records JSON-first implementation source loci without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first implementation locus register addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_LOCUS_REGISTER_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/json-first-implementation-locus-register-current-behavior\.test\.mjs/);
  assert.match(source, /JSON-first, optimization, endpoint\/XHR, method\/callable, lifecycle/);
  assert.match(source, /candidate classes toward exact source-locus proof/);
  assert.match(source, /`js\/seed\.js:197`, `js\/seed\.js:336`, `js\/seed\.js:606`, `js\/seed\.js:692`/);
  assert.match(source, /`js\/filter_logic\.js:154`, `js\/filter_logic\.js:426`, `js\/filter_logic\.js:2126`, `js\/filter_logic\.js:3434`/);
  assert.match(source, /`js\/content_bridge\.js:1621`, `js\/content_bridge\.js:5717`, `js\/content_bridge\.js:6061`/);
  assert.match(source, /`js\/content\/dom_fallback\.js:1933`, `js\/content\/dom_fallback\.js:2487`/);
  assert.match(source, /`js\/content\/block_channel\.js:808`, `js\/content\/block_channel\.js:1454`, and `js\/content\/block_channel\.js:2359`/);
  assert.match(source, /current code-inspection anchors for future first-class JSON filter contracts/);
  assert.match(source, /source-locus, endpoint, active-rule, renderer rule, path syntax/);
  assert.match(source, /transport, harvest\/mutation, metadata fetch, DOM active-work/);
  assert.match(source, /menu lifecycle, quick-block lifecycle, metric, parity, and rollback proof/);
  assert.match(source, /`jsonFirstImplementationLocusRegister`, `jsonFirstSourceLocusDecision`, `jsonFirstEndpointDecision`, `jsonFirstActiveRuleReport`, `jsonFirstRendererRuleManifest`, `jsonFirstWorkDecision`, `jsonFirstTransportBudget`, `jsonFirstHarvestMutationBudget`, `jsonFirstMetadataFetchBudget`, `jsonFirstDomActiveWorkReport`, `jsonFirstMenuLifecycleBudget`, `jsonFirstQuickBlockLifecycleBudget`, or `jsonFirstMetricFixtureReport`/);
});

test('active goal completion audit records current-source JSON path rerun without declaring completion', () => {
  const source = doc();

  assert.match(source, /2026-05-30 JSON path and JSON-first packet current-source rerun/);
  assert.ok(source.includes('node --test --test-reporter=spec tests/runtime/json-path-authority-current-behavior.test.mjs tests/runtime/json-dom-inventory-truth-current-behavior.test.mjs tests/runtime/json-runtime-coverage-gap-current-behavior.test.mjs tests/runtime/json-section-coverage-index-current-behavior.test.mjs tests/runtime/filter-logic-direct-renderer-rule-semantic-register-current-behavior.test.mjs tests/runtime/filter-logic-rule-path-semantic-register-current-behavior.test.mjs tests/runtime/filter-logic-rule-field-effect-semantic-register-current-behavior.test.mjs tests/runtime/json-first-*.test.mjs tests/runtime/json-comment-*.test.mjs'));
  assert.ok(source.includes('tests/runtime/xhr-comment-continuation-parity-boundary-current-behavior.test.mjs tests/runtime/main-watch-html-embedded-playlist-endscreen-json-current-behavior.test.mjs tests/runtime/main-watch-initial-lockup-shorts-json-current-behavior.test.mjs tests/runtime/main-next-reload-modern-comments-current-behavior.test.mjs tests/runtime/kids-latest-json-owner-extension-fixture-boundary-current-behavior.test.mjs tests/runtime/playlist-json-player-metadata-boundary-current-behavior.test.mjs tests/runtime/ytm-watch-playlist-panel-json-parity-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/content-control-json-first-boundary-index-current-behavior.test.mjs tests/runtime/content-filter-field-effect-manifest-gate-current-behavior.test.mjs tests/runtime/content-filter-field-effect-route-surface-matrix-current-behavior.test.mjs tests/runtime/endpoint-decision-matrix-current-behavior.test.mjs tests/runtime/p0-endpoint-policy-current-behavior.test.mjs tests/runtime/main-guide-endpoint-no-work-boundary-current-behavior.test.mjs tests/runtime/main-watch-autoplay-video-endpoint-current-behavior.test.mjs tests/runtime/network-fetch-xhr-callsite-register-current-behavior.test.mjs tests/runtime/xhr-no-work-boundary-current-behavior.test.mjs tests/runtime/seed-xhr-no-work-list-mode-boundary-current-behavior.test.mjs'));
  assert.match(source, /passed 896\/896 tests/);
  assert.match(source, /current-source JSON path authority gaps, JSON\/DOM inventory boundaries/);
  assert.match(source, /direct renderer declarations, effective rule paths, rule field effects/);
  assert.match(source, /endpoint matching, URL normalization, response mutation, XHR response overrides/);
  assert.match(source, /network snapshot stash\/permission\/freshness\/source-precedence\/traversal\/application\/stale-cache\/stale-marker boundaries/);
  assert.match(source, /video metadata storage\/fetch\/content\/category\/revision\/profile\/freshness\/merge\/no-work boundaries/);
  assert.match(source, /comment keyword\/author\/ViewModel\/structural\/entity\/continuation parity/);
  assert.match(source, /route\/surface fixture and metric gates/);
  assert.match(source, /Runtime behavior changed by this rerun: no/);
  assert.match(source, /JSON path authority, first-class JSON promotion, route\/surface implementation authority,\s+JSON fixture\/metric artifact approval, whitelist\/cache optimization, native parity,\s+release\/public-claim use, and `update_goal\(status='complete'\)` remain\s+`NO-GO`/);
});

test('active goal completion audit records current-source static package public-claim rerun without declaring completion', () => {
  const source = doc();

  assert.match(source, /2026-05-30 static\/package and public-claim packet current-source rerun/);
  assert.match(source, /node --test --test-reporter=spec tests\/runtime\/static-html-support-script-surface-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/compress-video-script-failure-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/media-asset-duplicate-derivative-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/website-route-asset-surface-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/css-load-style-surface-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/extension-asset-data-package-surface-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/extension-icon-logo-package-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/browser-manifest-runtime-load-order-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/design-token-json-css-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/package-lock-script-optional-dependency-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/root-package-metadata-script-surface-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/tracked-public-doc-claim-surface-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/generated-local-output-dependency-surface-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/website-package-config-dependency-surface-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/website-client-lifecycle-surface-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/website-route-component-render-graph-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/website-route-build-smoke-artifact-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/website-remote-request-privacy-performance-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/release-notes-json-version-gate-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/manifest-permission-authority-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/p0-manifest-permission-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/manifest-permission-feature-map-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/external-navigation-authority-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/p0-external-navigation-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/external-navigation-surface-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/extension-ui-css-page-state-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/legacy-layout-quarantine-package-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/quarantined-content-css-package-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /passed 172\/172 tests/);
  assert.match(source, /static HTML\/support-script boundaries/);
  assert.match(source, /compress-video failure modes/);
  assert.match(source, /media duplicate\/derivative byte budgets/);
  assert.match(source, /website route\/asset and build-smoke artifacts/);
  assert.match(source, /CSS load\/style surfaces/);
  assert.match(source, /extension assets\/data\/icons/);
  assert.match(source, /browser manifest load order/);
  assert.match(source, /design-token JSON\/CSS drift/);
  assert.match(source, /package-lock lifecycle and optional dependency boundaries/);
  assert.match(source, /root package metadata/);
  assert.match(source, /tracked public docs/);
  assert.match(source, /generated local output\/dependency caches/);
  assert.match(source, /website package\/config dependencies/);
  assert.match(source, /website client lifecycle/);
  assert.match(source, /website route render graph/);
  assert.match(source, /website remote\/privacy\/performance surfaces/);
  assert.match(source, /release-note JSON version gates/);
  assert.match(source, /manifest permission authority and P0 gaps/);
  assert.match(source, /external navigation authority and P0 gaps/);
  assert.match(source, /legacy layout quarantine/);
  assert.match(source, /Runtime behavior changed by this rerun: no/);
  assert.match(source, /Package artifact authority, manifest permission feature ownership,\s+public-claim parity, release-note version parity, design-token parity,\s+website build\/deploy artifact authority, media deletion\/readiness,\s+external-navigation policy, static HTML loader authority, release\/package\s+readiness, JSON-first public claims, native\/release parity, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
});

test('active goal completion audit records static HTML and support script surfaces without declaring completion', () => {
  const source = doc();

  assert.match(source, /Static HTML\/support script surface addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_STATIC_HTML_SUPPORT_SCRIPT_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/static-html-support-script-surface-current-behavior\.test\.mjs/);
  assert.match(source, /every-file objective/);
  assert.match(source, /extension HTML and a manual support script/);
  assert.match(source, /`html\/popup\.html`, `html\/tab-view\.html`, `html\/troubleshoot\.html`, and `scripts\/compress-video\.swift`/);
  assert.match(source, /popup is the default popup in all four manifests/);
  assert.match(source, /`#popupRoot`/);
  assert.match(source, /one external Google Fonts stylesheet/);
  assert.match(source, /9 hand-authored scripts/);
  assert.match(source, /current runtime openers for dashboard, Kids content, filter categories, and What New/);
  assert.match(source, /100 unique IDs/);
  assert.match(source, /9 `data-tab` values including hidden future `semantic`/);
  assert.match(source, /8 external URL occurrences across 7 unique URLs/);
  assert.match(source, /7 `target="_blank"` anchors with three source-level `rel` states/);
  assert.match(source, /12 hand-authored scripts including QR\/Nanah vendor load order/);
  assert.match(source, /troubleshoot is empty and lacks a current product opener/);
  assert.match(source, /`compress-video\.swift` deletes existing output before `\.mp4` support is checked/);
  assert.match(source, /lacking package-script, dry-run, temporary-output, atomic replacement, and failure-mode proof/);
  assert.match(source, /extension HTML still needs loader, resource\/CSP, route-state, external navigation, UI smoke, and package proof/);
  assert.match(source, /support script still needs dry-run\/atomic\/failure-mode contracts/);
  assert.match(source, /`staticHtmlSurfaceAuthority`, `extensionHtmlLoaderOrderManifest`, `extensionHtmlCspResourceReport`, `extensionHtmlRouteStateReport`, `extensionHtmlExternalNavigationReport`, `extensionHtmlSmokeFixture`, `troubleshootHtmlSurfaceDecision`, `compressVideoScriptAuthority`, `compressVideoDryRunContract`, `compressVideoAtomicOutputContract`, or `supportScriptFailureModeReport`/);
});

test('active goal completion audit records compress-video failure-mode boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Compress-video script failure-mode boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_COMPRESS_VIDEO_SCRIPT_FAILURE_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/compress-video-script-failure-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct failure-mode proof for `scripts\/compress-video\.swift`/);
  assert.match(source, /97 counted source lines/);
  assert.match(source, /3,339 bytes/);
  assert.match(source, /196c1ebf918b94e3d36fd2bd04658c4fa4762a85ad5657b49ede7aaa93e2e36b/);
  assert.match(source, /1 `CompressionError` enum/);
  assert.match(source, /5 error cases/);
  assert.match(source, /1 `presetName\(for:\)` function/);
  assert.match(source, /4 `AVAssetExportPreset\*` tokens/);
  assert.match(source, /1 `CommandLine\.arguments` read/);
  assert.match(source, /1 `AVURLAsset` construction/);
  assert.match(source, /2 `AVAssetExportSession` tokens/);
  assert.match(source, /1 `fileExists` check/);
  assert.match(source, /1 `removeItem` call/);
  assert.match(source, /1 `\.mp4` support check/);
  assert.match(source, /1 `shouldOptimizeForNetworkUse` write/);
  assert.match(source, /1 modern `export\(to:as:\)` call/);
  assert.match(source, /1 legacy `exportAsynchronously` call/);
  assert.match(source, /3 `DispatchSemaphore`\/semaphore tokens/);
  assert.match(source, /1 `exporter\.status` switch/);
  assert.match(source, /2 `attributesOfItem` reads/);
  assert.match(source, /1 stdout print/);
  assert.match(source, /1 stderr write/);
  assert.match(source, /1 `exit\(1\)` call/);
  assert.match(source, /0 package scripts referencing `compress-video`/);
  assert.match(source, /0 `build\.js` references/);
  assert.match(source, /0 tracked non-doc source callers outside the script itself/);
  assert.match(source, /exporter creation, existing output deletion, `\.mp4` support check, export configuration/);
  assert.match(source, /modern or legacy AVFoundation output write/);
  assert.match(source, /preset manifests/);
  assert.match(source, /output destruction reports/);
  assert.match(source, /dry-run plans/);
  assert.match(source, /temporary-output contracts/);
  assert.match(source, /atomic replacement contracts/);
  assert.match(source, /source-output media manifests/);
  assert.match(source, /package-script gates/);
  assert.match(source, /media budgets/);
  assert.match(source, /failure fixtures/);
  assert.match(source, /`compressVideoFailureModeBoundaryContract`, `compressVideoPresetManifest`, `compressVideoOutputDestructionReport`, `compressVideoDryRunPlan`, `compressVideoTemporaryOutputContract`, `compressVideoAtomicReplacementContract`, `compressVideoSourceOutputManifest`, `compressVideoPackageScriptGate`, `compressVideoMediaBudgetReport`, or `compressVideoFailureFixtureProvenance`/);
});

test('active goal completion audit records media asset duplicate derivative boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Media asset duplicate\/derivative boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_MEDIA_ASSET_DUPLICATE_DERIVATIVE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/media-asset-duplicate-derivative-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /media optimization, website asset, extension package, release\/package/);
  assert.match(source, /support-script, source\/evidence, and implementation-change objectives/);
  assert.match(source, /direct MP4 duplicate and derivative proof/);
  assert.match(source, /10 tracked media\/provenance files/);
  assert.match(source, /6 tracked MP4 files/);
  assert.match(source, /50,128,618 MP4 bytes/);
  assert.match(source, /4 text provenance files/);
  assert.match(source, /5,999 text provenance bytes/);
  assert.match(source, /3 byte-identical website homepage MP4 files/);
  assert.match(source, /37,258,272 homepage duplicate-group bytes/);
  assert.match(source, /24,838,848 duplicate overhead beyond one retained copy/);
  assert.match(source, /6,152,963 bytes to 2,179,940 bytes/);
  assert.match(source, /3,973,023 iOS derivative byte reduction/);
  assert.match(source, /4 extension ambient video source\/output references/);
  assert.match(source, /2 website served media URL families/);
  assert.match(source, /0 current source references to `\/videos\/homepage\/homepage_hero_day\.mp4`/);
  assert.match(source, /0 package scripts referencing `compress-video`/);
  assert.match(source, /0 `build\.js` `compress-video` references/);
  assert.match(source, /0 tracked non-doc callers outside `scripts\/compress-video\.swift`/);
  assert.match(source, /root extension builds copy `assets` wholesale/);
  assert.match(source, /generated shells refer to `\.\.\/assets\/images\/homepage_hero_day\.mp4`/);
  assert.match(source, /serves `\/videos\/homepage\/day\/homepage_hero_day\.mp4` and `\/videos\/ios\/ios_hero_slow_540\.mp4`/);
  assert.match(source, /byte-identical public homepage alias is currently unreferenced/);
  assert.match(source, /iOS compression provenance is changelog text plus file hashes/);
  assert.match(source, /route\/render evidence/);
  assert.match(source, /package\/deploy artifact proof/);
  assert.match(source, /reduced-motion and startup budgets/);
  assert.match(source, /duplicate-cleanup gates/);
  assert.match(source, /browser ZIP size budgets/);
  assert.match(source, /public-claim artifact gates/);
  assert.match(source, /`mediaAssetDuplicateDerivativeBoundaryContract`, `mediaAssetProvenanceManifest`, `mediaDerivativeManifest`, `mediaByteBudgetReport`, `mediaRouteConsumerReport`, `extensionWebsiteMediaSplitPolicy`, `mediaDuplicateCleanupGate`, `mediaCompressionCommandProvenance`, `mediaReducedMotionBudget`, `mediaPackageSizeBudget`, or `mediaArtifactHashManifest`/);
});

test('active goal completion audit records website route and asset surfaces without declaring completion', () => {
  const source = doc();

  assert.match(source, /Website route\/asset surface addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_WEBSITE_ROUTE_ASSET_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/website-route-asset-surface-current-behavior\.test\.mjs/);
  assert.match(source, /every-file, public claim, performance, code-burden, release, and implementation-change objectives/);
  assert.match(source, /website routes, components, assets, remotes, lifecycle hooks, and ignored generated output/);
  assert.match(source, /42 tracked website files/);
  assert.match(source, /9 platform slugs\/detail pages/);
  assert.match(source, /13 sitemap routes with static `lastModified: "2026-05-16"`/);
  assert.match(source, /duplicate logo and homepage video hashes/);
  assert.match(source, /iOS source\/derivative video split/);
  assert.match(source, /22 source remote URL strings outside package-lock metadata/);
  assert.match(source, /three client components with theme\/scene cleanup/);
  assert.match(source, /unused `website\/components\/site-data\.js` as legacy public-copy burden/);
  assert.match(source, /route screenshots\/build proof/);
  assert.match(source, /public claim artifact gates/);
  assert.match(source, /asset provenance/);
  assert.match(source, /media derivative manifests/);
  assert.match(source, /external navigation policy/);
  assert.match(source, /remote request policy/);
  assert.match(source, /performance budgets/);
  assert.match(source, /deploy evidence/);
  assert.match(source, /legacy data deletion proof/);
  assert.match(source, /`websiteRouteSurfaceAuthority`, `websiteRouteManifest`, `websitePlatformClaimManifest`, `websiteAssetProvenanceManifest`, `websiteMediaDerivativeManifest`, `websiteExternalNavigationAuthority`, `websiteRemoteRequestManifest`, `websitePublicClaimArtifactGate`, `websiteGeneratedOutputBoundary`, or `websiteLegacyDataDeletionDecision`/);
});

test('active goal completion audit records CSS load and style surfaces without declaring completion', () => {
  const source = doc();

  assert.match(source, /CSS load\/style surface addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CSS_LOAD_STYLE_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/css-load-style-surface-current-behavior\.test\.mjs/);
  assert.match(source, /every-file, DOM selector, style\/hide, extension UI, website/);
  assert.match(source, /all tracked CSS files/);
  assert.match(source, /9 tracked CSS files/);
  assert.match(source, /11,077 counted source lines/);
  assert.match(source, /296,952 bytes/);
  assert.match(source, /1,548 lexical rule blocks/);
  assert.match(source, /593 `!important` declarations/);
  assert.match(source, /47 `display:none` declarations/);
  assert.match(source, /72 `:not\(\.filter-tube-visible\)` clauses/);
  assert.match(source, /167 `filter-tube-visible` tokens/);
  assert.match(source, /6 `filtertube-hidden` tokens/);
  assert.match(source, /37 `@media` blocks/);
  assert.match(source, /7 `@keyframes` blocks/);
  assert.match(source, /3 `\[hidden\]` selectors/);
  assert.match(source, /popup\/dashboard visual fixtures/);
  assert.match(source, /responsive\/accessibility proof/);
  assert.match(source, /manifest\/package proof/);
  assert.match(source, /false-hide fixtures/);
  assert.match(source, /dynamic style lifecycle ownership/);
  assert.match(source, /website\/extension boundary proof/);
  assert.match(source, /deletion readiness/);
  assert.match(source, /release\/native boundary proof/);
  assert.match(source, /`cssLoadSurfaceAuthority`, `cssPackageQuarantineManifest`, `cssExtensionPageLoadManifest`, `cssContentScriptActivationGate`, `cssLegacyRevealModelDecision`, `cssSelectorEffectReport`, `cssImportantDebtBudget`, `cssResponsiveVisualFixtureReport`, `cssDynamicStyleLifecycleRegistry`, `cssWebsiteExtensionBoundaryReport`, or `cssDeletionReadinessReport`/);
});

test('active goal completion audit records extension asset and data package surfaces without declaring completion', () => {
  const source = doc();

  assert.match(source, /Extension asset\/data package surface addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_EXTENSION_ASSET_DATA_PACKAGE_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/extension-asset-data-package-surface-current-behavior\.test\.mjs/);
  assert.match(source, /every-file, release\/package, public claim, performance, code-burden/);
  assert.match(source, /tracked extension static assets and packaged data/);
  assert.match(source, /12 tracked asset\/data files/);
  assert.match(source, /8,372,067 bytes/);
  assert.match(source, /3 root `assets\/images` files totaling 8,327,776 bytes/);
  assert.match(source, /7 icon files totaling 19,342 bytes/);
  assert.match(source, /`data\/release_notes\.json` with one comment row plus 23 version rows/);
  assert.match(source, /`design\/design_tokens\.json` as a non-package-copied design input/);
  assert.match(source, /4,537,443-byte ambient video is used by generated popup\/dashboard shells/);
  assert.match(source, /Android and iOS 1536x1024 PNGs are used directly in tab-view app cards/);
  assert.match(source, /action\/extension manifest icons use only `icon-16`, `icon-32`, `icon-48`, and `icon-128` PNGs/);
  assert.match(source, /`icons\/file\.svg` is web-accessible in default\/Chrome\/Firefox but not Opera/);
  assert.match(source, /release notes stage `3\.3\.2` while package\/browser versions remain `3\.3\.1`/);
  assert.match(source, /design JSON token values diverge from current `css\/design_tokens\.css`/);
  assert.match(source, /package artifact proof/);
  assert.match(source, /asset byte\/startup budgets/);
  assert.match(source, /reduced-motion and visual fixtures/);
  assert.match(source, /manifest\/store icon parity/);
  assert.match(source, /release-version gating/);
  assert.match(source, /native\/app parity/);
  assert.match(source, /design-token parity/);
  assert.match(source, /deletion readiness/);
  assert.match(source, /`extensionAssetPackageAuthority`, `extensionStaticAssetManifest`, `extensionAssetByteBudget`, `extensionMediaReducedMotionProof`, `extensionIconManifestParityReport`, `extensionWebAccessibleIconParityDecision`, `extensionReleaseNotesSchemaAuthority`, `extensionReleaseNotesVersionGate`, `extensionDesignTokenParityReport`, or `extensionAssetDeletionReadinessReport`/);
});

test('active goal completion audit records browser manifest runtime load order without declaring completion', () => {
  const source = doc();

  assert.match(source, /Browser manifest runtime load-order addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_BROWSER_MANIFEST_RUNTIME_LOAD_ORDER_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/browser-manifest-runtime-load-order-current-behavior\.test\.mjs/);
  assert.match(source, /every-file, JSON-first startup, manifest\/package/);
  assert.match(source, /host-scope, permission, web-accessible resource, browser parity/);
  assert.match(source, /all four tracked browser manifests/);
  assert.match(source, /4 manifest files/);
  assert.match(source, /336 newline counts/);
  assert.match(source, /9,409 bytes/);
  assert.match(source, /byte-identical default\/Chrome manifests/);
  assert.match(source, /Firefox's single no-`world` helper stack plus fallback `seed` injection/);
  assert.match(source, /Opera's two no-`world` entries/);
  assert.match(source, /55 content-script file references across all manifests/);
  assert.match(source, /14 unique tracked content-script files/);
  assert.match(source, /no `content_scripts\.css`/);
  assert.match(source, /shared permissions and host permissions/);
  assert.match(source, /`youtube-nocookie\.com` host permission without active content-script or web-resource matches/);
  assert.match(source, /`icons\/file\.svg` web-accessible drift/);
  assert.match(source, /build-time manifest handling that only repairs collaborator-before-bridge order/);
  assert.match(source, /browser package artifacts/);
  assert.match(source, /startup readiness reports/);
  assert.match(source, /host classification/);
  assert.match(source, /resource reasons/);
  assert.match(source, /permission-feature mapping/);
  assert.match(source, /package quarantine proof/);
  assert.match(source, /browser-specific smoke fixtures/);
  assert.match(source, /`browserManifestRuntimeLoadOrderAuthority`, `browserManifestPackageParityReport`, `browserManifestContentScriptWorldReport`, `browserManifestSeedReadyReport`, `browserManifestHostScopeClassification`, `browserManifestWebAccessibleResourceDecision`, `browserManifestPermissionFeatureMap`, `browserManifestBuildValidationReport`, `browserManifestPackageQuarantineReport`, or `browserManifestJsonFirstStartupGate`/);
});

test('active goal completion audit records root package metadata script surface without declaring completion', () => {
  const source = doc();

  assert.match(source, /Root package metadata script surface addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_ROOT_PACKAGE_METADATA_SCRIPT_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/root-package-metadata-script-surface-current-behavior\.test\.mjs/);
  assert.match(source, /every-file, release\/package, public claim, dependency, performance, code-burden, JSON-first claim/);
  assert.match(source, /root project metadata/);
  assert.match(source, /7 tracked root metadata files/);
  assert.match(source, /2,902 newline counts/);
  assert.match(source, /129,416 bytes/);
  assert.match(source, /`package\.json` version `3\.3\.1`/);
  assert.match(source, /12 package scripts including `audit:runtime`/);
  assert.match(source, /no conventional `test` script/);
  assert.match(source, /no `private`\/`engines`\/`packageManager` declarations/);
  assert.match(source, /2 runtime dependencies/);
  assert.match(source, /3 development dependencies/);
  assert.match(source, /lockfile version 3 with 112 package entries/);
  assert.match(source, /all non-root lockfile entries carrying integrity values/);
  assert.match(source, /two deprecated locked packages \(`glob` and `inflight`\)/);
  assert.match(source, /README version\/license\/line-count\/download\/JSON-first claims/);
  assert.match(source, /changelog top version `3\.3\.1`/);
  assert.match(source, /build packaging of only `README\.md`, `CHANGELOG\.md`, and `LICENSE`/);
  assert.match(source, /ignored local raw JSON evidence captures/);
  assert.match(source, /tracked `package-lock\.json`/);
  assert.match(source, /historical channel-identity plan as audit context only/);
  assert.match(source, /package script execution proof/);
  assert.match(source, /dependency reproducibility\/deprecation review/);
  assert.match(source, /public claim parity/);
  assert.match(source, /release-version gating/);
  assert.match(source, /reduced JSON fixture provenance/);
  assert.match(source, /dev-manifest dirty-worktree gates/);
  assert.match(source, /first-class JSON filter promotion gates/);
  assert.match(source, /`rootPackageMetadataAuthority`, `packageScriptExecutionGate`, `packageLockReproducibilityReport`, `rootDocClaimParityReport`, `rootGitignoreEvidenceBoundary`, `rootReleaseClaimGate`, `rootJsonFirstClaimGate`, or `rootMetadataDeletionReadinessReport`/);
});

test('active goal completion audit records JSON-first reference docs without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first reference doc surface addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_REFERENCE_DOC_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/json-first-reference-doc-surface-current-behavior\.test\.mjs/);
  assert.match(source, /every-file, tracked-doc, JSON path, renderer inventory, optimization, performance, code-burden/);
  assert.match(source, /source\/evidence boundary, and implementation-change objectives/);
  assert.match(source, /4 tracked JSON-first reference docs/);
  assert.match(source, /6,486 newline counts/);
  assert.match(source, /402,371 bytes/);
  assert.match(source, /`docs\/JSON_FIRST_FILTERING_PLAN\.md`, `docs\/json_paths_encyclopedia\.md`, `docs\/watch_json_paths\.md`, and `docs\/youtube_renderer_inventory\.md`/);
  assert.match(source, /JSON-first plan line-205 authority-style wording/);
  assert.match(source, /264 bracket-index snippets and 54 dot-index snippets/);
  assert.match(source, /watch collaborator `showDialogCommand`\/`showSheetCommand` variants/);
  assert.match(source, /renderer inventory status wording/);
  assert.match(source, /not loaded by product runtime or build source/);
  assert.match(source, /reduced fixtures/);
  assert.match(source, /syntax conversion proof/);
  assert.match(source, /blocklist\/whitelist\/empty\/disabled\/sibling-visible fixtures/);
  assert.match(source, /route\/surface\/profile\/list-mode proof/);
  assert.match(source, /identity-confidence and allowed-effect records/);
  assert.match(source, /no-work budgets/);
  assert.match(source, /metric artifacts/);
  assert.match(source, /runtime parity/);
  assert.match(source, /DOM fallback parity/);
  assert.match(source, /claim gates/);
  assert.match(source, /deletion readiness/);
  assert.match(source, /first-class JSON filter promotion remain incomplete/);
  assert.match(source, /`jsonReferenceDocSurfaceAuthority`, `jsonReferenceDocRuntimeParityReport`, `jsonReferenceDocFixtureProvenance`, `jsonReferenceDocSyntaxClassifier`, `jsonReferenceDocClaimGate`, `jsonReferenceDocOptimizationGate`, or `jsonReferenceDocDeletionReadinessReport`/);
});

test('active goal completion audit records tracked public doc claims without declaring completion', () => {
  const source = doc();

  assert.match(source, /Tracked public doc claim surface addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_TRACKED_PUBLIC_DOC_CLAIM_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/tracked-public-doc-claim-surface-current-behavior\.test\.mjs/);
  assert.match(source, /every-file, tracked-doc, public-claim, release\/package/);
  assert.match(source, /native sync, runtime lifecycle, network\/lifecycle/);
  assert.match(source, /source\/evidence boundary, cross-feature, and implementation-change objectives/);
  assert.match(source, /29 tracked product\/public docs/);
  assert.match(source, /16,059 newline counts/);
  assert.match(source, /692,767 bytes/);
  assert.match(source, /29 H1 headings/);
  assert.match(source, /376 H2 headings/);
  assert.match(source, /676 H3 headings/);
  assert.match(source, /3,090 inline-code spans/);
  assert.match(source, /144 absolute local path strings/);
  assert.match(source, /291 product\/build\/site file-reference tokens/);
  assert.match(source, /11 s\/t phrase tokens/);
  assert.match(source, /41 `complete`/);
  assert.match(source, /13 `guarantee`/);
  assert.match(source, /17 `zero`/);
  assert.match(source, /25 `instant`/);
  assert.match(source, /35 `performance`/);
  assert.match(source, /93 `release`/);
  assert.match(source, /108 `native`/);
  assert.match(source, /182 `sync`/);
  assert.match(source, /217 `fetch`/);
  assert.match(source, /11 `observer`/);
  assert.match(source, /8 `listener`/);
  assert.match(source, /4 `timer`/);
  assert.match(source, /website\/assets\/videos\/README\.md/);
  assert.match(source, /docs\/filtertube-scenic-media-prompt-brief\.md/);
  assert.match(source, /`build\.js` not package-copying `docs`/);
  assert.match(source, /ignored local docs excluded from tracked-doc obligations/);
  assert.match(source, /claim-to-runtime traceability/);
  assert.match(source, /line-specific reliability proof/);
  assert.match(source, /route\/surface\/profile\/list-mode fixtures/);
  assert.match(source, /release artifact parity/);
  assert.match(source, /native app revision and generated-runtime freshness proof/);
  assert.match(source, /performance metric artifacts/);
  assert.match(source, /network\/lifecycle no-work budgets/);
  assert.match(source, /ignored-doc migration decisions/);
  assert.match(source, /public docs deletion readiness/);
  assert.match(source, /first-class JSON filter promotion gates remain incomplete/);
  assert.match(source, /`trackedPublicDocClaimAuthority`, `trackedPublicDocRuntimeParityReport`, `trackedPublicDocReleaseParityReport`, `trackedPublicDocNativeParityReport`, `trackedPublicDocMetricAuthority`, `trackedPublicDocLifecycleBudget`, `trackedPublicDocIgnoredBoundaryReport`, `trackedPublicDocDeletionReadinessReport`, or `trackedPublicDocJsonFirstPromotionGate`/);
});

test('active goal completion audit records generated local output and dependency surfaces without declaring completion', () => {
  const source = doc();

  assert.match(source, /Generated local output\/dependency surface addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_GENERATED_LOCAL_OUTPUT_DEPENDENCY_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/generated-local-output-dependency-surface-current-behavior\.test\.mjs/);
  assert.match(source, /every-file, release\/package, website build\/deploy, dependency, performance, code-burden/);
  assert.match(source, /JSON-first package gate, source\/evidence boundary, and implementation-change objectives/);
  assert.match(source, /`dist`, `node_modules`, `website\/\.next`, `website\/\.vercel`, and `website\/node_modules` are ignored and absent from `git ls-files`/);
  assert.match(source, /177\/61,137,712/);
  assert.match(source, /956\/26,325,623/);
  assert.match(source, /2,288\/346,208,509/);
  assert.match(source, /291\/29,815,128/);
  assert.match(source, /18,619\/325,539,259/);
  assert.match(source, /each browser `dist` tree has 58 files/);
  assert.match(source, /broad `js`, `css`, `html`, `icons`, `data`, `assets`/);
  assert.match(source, /three `v3\.3\.1` ZIP hashes are pinned/);
  assert.match(source, /`\.next` and `\.vercel` artifacts are local build evidence only/);
  assert.match(source, /root\/website `node_modules` contain 92 and 295 package manifests/);
  assert.match(source, /package manifest authority/);
  assert.match(source, /ZIP checksum release gates/);
  assert.match(source, /clean dependency reproducibility/);
  assert.match(source, /website route screenshot\/deploy evidence/);
  assert.match(source, /generated output freshness/);
  assert.match(source, /cleanup decisions/);
  assert.match(source, /first-class JSON filter artifact gates/);
  assert.match(source, /`generatedLocalOutputBoundaryAuthority`, `localDependencyCacheAuthority`, `distPackageFreshnessReport`, `distZipChecksumManifest`, `nextBuildArtifactFreshnessReport`, `vercelOutputReleaseAuthority`, `nodeModulesDependencyProof`, `generatedOutputCleanupDecision`, or `firstClassJsonFilterPackageGate`/);
});

test('active goal completion audit records website package config dependency surface without declaring completion', () => {
  const source = doc();

  assert.match(source, /Website package\/config dependency surface addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_WEBSITE_PACKAGE_CONFIG_DEPENDENCY_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/website-package-config-dependency-surface-current-behavior\.test\.mjs/);
  assert.match(source, /every-file, website config, dependency, build\/deploy, public-claim/);
  assert.match(source, /analytics-scope, performance, code-burden, release, and implementation-change objectives/);
  assert.match(source, /7 tracked website package\/config files/);
  assert.match(source, /1,733 newline counts/);
  assert.match(source, /56,283 bytes/);
  assert.match(source, /private `filtertube-website` version `1\.0\.0`/);
  assert.match(source, /only `dev`, `build`, and `start` scripts/);
  assert.match(source, /Node engine `22\.x`/);
  assert.match(source, /8 direct dependencies/);
  assert.match(source, /locked Next `16\.1\.6`, React\/React DOM `19\.2\.4`, Tailwind `4\.2\.1`, and Vercel Analytics `2\.0\.1`/);
  assert.match(source, /lockfile version 3 with 101 package entries/);
  assert.match(source, /100 non-root entries/);
  assert.match(source, /65 optional entries/);
  assert.match(source, /0 dev entries/);
  assert.match(source, /0 deprecated entries/);
  assert.match(source, /6 bundled optional Tailwind wasm nested entries without top-level integrity/);
  assert.match(source, /simple Next\/PostCSS\/jsconfig\/Vercel ignore boundaries/);
  assert.match(source, /website-only analytics import\/rendering/);
  assert.match(source, /no app\/components `fetch\(\)` or `MutationObserver` usage/);
  assert.match(source, /clean dependency reproducibility/);
  assert.match(source, /build proof/);
  assert.match(source, /route smoke proof/);
  assert.match(source, /analytics scope proof/);
  assert.match(source, /config parity/);
  assert.match(source, /deploy artifact gates/);
  assert.match(source, /first-class JSON public-claim gates/);
  assert.match(source, /`websitePackageConfigAuthority`, `websiteDependencyReproducibilityReport`, `websiteLockfileIntegrityReport`, `websiteNodeEngineContract`, `websiteBuildScriptProof`, `websiteRouteSmokeProof`, `websiteAnalyticsScopeAuthority`, `websiteDeployArtifactGate`, or `websiteFirstClassJsonClaimGate`/);
});

test('active goal completion audit records website client lifecycle surface without declaring completion', () => {
  const source = doc();

  assert.match(source, /Website client lifecycle surface addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_WEBSITE_CLIENT_LIFECYCLE_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/website-client-lifecycle-surface-current-behavior\.test\.mjs/);
  assert.match(source, /every-file, website component, runtime observer\/listener\/timer/);
  assert.match(source, /localStorage, hydration, menu interaction, public-claim, performance, code-burden/);
  assert.match(source, /first-class JSON public-claim objectives/);
  assert.match(source, /22 tracked website app\/component JavaScript files/);
  assert.match(source, /three `"use client";` files/);
  assert.match(source, /`website\/app\/layout\.js`, `website\/components\/scene-controller\.js`, `website\/components\/site-header\.js`, and `website\/components\/theme-toggle\.js`/);
  assert.match(source, /3 `useEffect\(\.\.\.\)` calls/);
  assert.match(source, /1 `useEffectEvent\(\.\.\.\)` call/);
  assert.match(source, /2 `useState\(\.\.\.\)` calls/);
  assert.match(source, /1 `startTransition\(\.\.\.\)` call/);
  assert.match(source, /3 `addEventListener\(\.\.\.\)` calls/);
  assert.match(source, /3 `removeEventListener\(\.\.\.\)` calls/);
  assert.match(source, /1 `window\.setTimeout\(\.\.\.\)` call/);
  assert.match(source, /2 `window\.clearTimeout\(\.\.\.\)` calls/);
  assert.match(source, /2 `localStorage\.getItem\(\.\.\.\)` calls/);
  assert.match(source, /1 `localStorage\.setItem\(\.\.\.\)` call/);
  assert.match(source, /1 `window\.dispatchEvent\(\.\.\.\)` call/);
  assert.match(source, /4 JSX `onClick=` props/);
  assert.match(source, /no `fetch\(\.\.\.\)`, observer, interval, animation-frame, or `sessionStorage` references/);
  assert.match(source, /2026-05-27 method-semantic continuation/);
  assert.match(source, /22 website client method\/callback rows/);
  assert.match(source, /8 scene controller rows/);
  assert.match(source, /8 theme toggle rows/);
  assert.match(source, /5 site header rows/);
  assert.match(source, /1 reveal row/);
  assert.match(source, /3 listener rows/);
  assert.match(source, /1 timer row/);
  assert.match(source, /1 storage-write row/);
  assert.match(source, /1 dispatch row/);
  assert.match(source, /ASCII and Mermaid lifecycle diagrams/);
  assert.match(source, /layout bootstrap, scene scheduling, theme storage, header menu state, and reveal rendering boundaries/);
  assert.match(source, /website client method semantic proof PARTIAL/);
  assert.match(source, /lifecycle cleanup, theme preference authority, timer\/listener budgets, and first-class JSON public-claim use at NO-GO/);
  assert.match(source, /route smoke proof/);
  assert.match(source, /browser screenshots/);
  assert.match(source, /accessibility fixtures/);
  assert.match(source, /timer\/listener budgets/);
  assert.match(source, /localStorage error and cross-tab fixtures/);
  assert.match(source, /analytics\/remote request policy/);
  assert.match(source, /deploy artifact evidence/);
  assert.match(source, /public-claim parity proof/);
  assert.match(source, /`websiteClientLifecycleAuthority`, `websiteHydrationScriptContract`, `websiteSceneScheduleBudget`, `websiteThemePreferenceAuthority`, `websiteClientListenerRegistry`, `websiteClientTimerBudget`, `websiteLocalStorageContract`, `websiteHeaderMenuInteractionAuthority`, `websiteClientLifecycleFixtureProvenance`, or `websiteFirstClassJsonPublicClaimGate`/);
});

test('active goal completion audit records website route component render graph without declaring completion', () => {
  const source = doc();

  assert.match(source, /Website route\/component render graph addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_WEBSITE_ROUTE_COMPONENT_RENDER_GRAPH_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/website-route-component-render-graph-current-behavior\.test\.mjs/);
  assert.match(source, /every-file, website route, website component, method\/callable/);
  assert.match(source, /render primitive, import graph, public-claim, performance, code-burden/);
  assert.match(source, /first-class JSON public-claim objectives/);
  assert.match(source, /22 tracked website app\/component JavaScript files/);
  assert.match(source, /4,608 newline counts/);
  assert.match(source, /185,419 bytes/);
  assert.match(source, /9 route\/app files/);
  assert.match(source, /13 component\/data files/);
  assert.match(source, /44 function declarations/);
  assert.match(source, /24 exported function declarations/);
  assert.match(source, /20 local function declarations/);
  assert.match(source, /31 `export const` declarations/);
  assert.match(source, /1 re-export declaration/);
  assert.match(source, /9 default route exports/);
  assert.match(source, /55 import lines/);
  assert.match(source, /12 JSX `<Link>` sites/);
  assert.match(source, /1 JSX `<Image>` site/);
  assert.match(source, /2 JSX `<video>` sites/);
  assert.match(source, /1 JSX `<Script>` site/);
  assert.match(source, /14 literal `<a>` sites/);
  assert.match(source, /2 `<button>` sites/);
  assert.match(source, /35 `\.map\(\.\.\.\)` calls/);
  assert.match(source, /2 `\.filter\(\.\.\.\)` calls/);
  assert.match(source, /dynamic `\/:slug` static-param\/metadata\/notFound path/);
  assert.match(source, /sitemap 13-route generation with static `lastModified: "2026-05-16"`/);
  assert.match(source, /`@\/components\/site-data` as an unimported 7-export legacy public-copy module/);
  assert.match(source, /2026-05-27 `BrowserLogoRail` method-semantic addendum/);
  assert.match(source, /one exported website callable/);
  assert.match(source, /three prop defaults/);
  assert.match(source, /six `browserLinks` rows/);
  assert.match(source, /one plain image render site/);
  assert.match(source, /`rel="noreferrer"` without `rel="noopener"`/);
  assert.match(source, /ASCII flow showing browser-link data moving into external logo anchors/);
  assert.match(source, /route smoke\/build proof/);
  assert.match(source, /browser screenshots/);
  assert.match(source, /accessibility fixtures/);
  assert.match(source, /external-navigation policy/);
  assert.match(source, /media budgets/);
  assert.match(source, /deploy artifact evidence/);
  assert.match(source, /runtime\/native parity/);
  assert.match(source, /first-class JSON public-claim gates/);
  assert.match(source, /`websiteRouteComponentGraphAuthority`, `websiteRouteRenderManifest`, `websiteRouteScreenshotProof`, `websiteStaticParamMetadataContract`, `websiteRouteDataOwnershipReport`, `websiteComponentImportGraphManifest`, `websiteLegacySiteDataDeletionDecision`, `websiteRenderMapAccessibilityReport`, `websitePublicCopyRuntimeParityGate`, or `websiteJsonFirstPublicClaimGate`/);
});

test('active goal completion audit records website dynamic route method semantics without declaring completion', () => {
  const source = doc();

  assert.match(source, /Website dynamic route method semantic register addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_WEBSITE_DYNAMIC_ROUTE_METHOD_SEMANTIC_REGISTER_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/website-dynamic-route-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /every-file, method\/callable, website route, public-claim/);
  assert.match(source, /source\/evidence boundary, first-class JSON public-claim, and implementation-change objectives/);
  assert.match(source, /method-level proof for `website\/app\/\[slug\]\/page\.js`/);
  assert.match(source, /4 dynamic-route boundary source files/);
  assert.match(source, /`website\/app\/\[slug\]\/page\.js` at 54 lines and 1,229 bytes/);
  assert.match(source, /3 route method rows/);
  assert.match(source, /3 import lines/);
  assert.match(source, /1 `export const` declaration/);
  assert.match(source, /3 exported function declarations/);
  assert.match(source, /2 async exported functions/);
  assert.match(source, /1 default async route export/);
  assert.match(source, /9 platform slugs/);
  assert.match(source, /9 detail-page entries/);
  assert.match(source, /22 related-page references/);
  assert.match(source, /0 unresolved related-page references/);
  assert.match(source, /2 `\.map\(\.\.\.\)` callsites/);
  assert.match(source, /1 `\.filter\(\.\.\.\)` callsite/);
  assert.match(source, /1 `notFound\(\)` callsite/);
  assert.match(source, /2 `await params` callsites/);
  assert.match(source, /0 `fetch`, timer, listener, or `MutationObserver` primitives/);
  assert.match(source, /`generateStaticParams\(\)`, `generateMetadata\(\{ params \}\)`, and `DetailPage\(\{ params \}\)`/);
  assert.match(source, /closed static route params/);
  assert.match(source, /metadata `\{\}` for unknown pages/);
  assert.match(source, /render-time `notFound\(\)`/);
  assert.match(source, /related-page filtering/);
  assert.match(source, /static route manifests/);
  assert.match(source, /metadata\/public-claim parity/);
  assert.match(source, /related-page negative fixtures/);
  assert.match(source, /route screenshots/);
  assert.match(source, /accessibility proof/);
  assert.match(source, /media budgets/);
  assert.match(source, /release artifact references/);
  assert.match(source, /native runtime freshness/);
  assert.match(source, /first-class JSON public-claim gates/);
  assert.match(source, /`websiteDynamicRouteMethodAuthority`, `websiteDynamicRouteStaticParamManifest`, `websiteDynamicRouteMetadataParityReport`, `websiteDynamicRouteRelatedPageIntegrityReport`, `websiteDynamicRouteNotFoundFixture`, `websiteDynamicRouteScreenshotProof`, `websiteDynamicRouteAccessibilityReport`, `websiteDynamicRoutePublicClaimGate`, `websiteDynamicRouteMediaBudget`, or `websiteDynamicRouteFirstClassJsonClaimGate`/);
});

test('active goal completion audit records website route build smoke artifacts without declaring completion', () => {
  const source = doc();

  assert.match(source, /Website route build-smoke artifact boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_WEBSITE_ROUTE_BUILD_SMOKE_ARTIFACT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/website-route-build-smoke-artifact-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /every-file, website route, generated-output, build\/deploy/);
  assert.match(source, /accessibility, media, source\/evidence boundary, first-class JSON public-claim/);
  assert.match(source, /current local route artifact proof/);
  assert.match(source, /ignored `\.next` route artifacts without treating them as product authority/);
  assert.match(source, /7 tracked website route source files compared/);
  assert.match(source, /2 route data files compared/);
  assert.match(source, /6 generated manifest files pinned/);
  assert.match(source, /13-route public source set/);
  assert.match(source, /18 generated prerender routes/);
  assert.match(source, /1 generated dynamic route/);
  assert.match(source, /0 generated `notFoundRoutes`/);
  assert.match(source, /10 generated app-path manifest entries/);
  assert.match(source, /15 generated `\.html` files/);
  assert.match(source, /15 generated `\.rsc` files/);
  assert.match(source, /18 generated `\.meta` files/);
  assert.match(source, /13 public source routes with generated html\/rsc\/meta triplets/);
  assert.match(source, /13 sitemap `<loc>` entries/);
  assert.match(source, /build id `mU-54AWzEaOTVx1n8fwjP`/);
  assert.match(source, /generated `\/\[slug\]` expansion boundary/);
  assert.match(source, /no fresh build command, browser screenshot proof, accessibility fixture, or deploy artifact proof is captured/);
  assert.match(source, /fresh build command reports/);
  assert.match(source, /clean dependency reproducibility/);
  assert.match(source, /route screenshots/);
  assert.match(source, /accessibility checks/);
  assert.match(source, /hydration proof/);
  assert.match(source, /media budgets/);
  assert.match(source, /deploy artifact references/);
  assert.match(source, /public-claim parity/);
  assert.match(source, /native runtime freshness/);
  assert.match(source, /first-class JSON public-claim gates/);
  assert.match(source, /`websiteRouteBuildSmokeAuthority`, `websiteFreshBuildCommandReport`, `websiteRouteArtifactManifest`, `websiteRouteSmokeScreenshotProof`, `websiteRouteAccessibilityProof`, `websiteRouteHydrationSmokeProof`, `websiteRouteMediaLoadBudget`, `websiteRouteDeployArtifactReport`, `websiteRoutePublicClaimParityReport`, or `websiteRouteFirstClassJsonClaimGate`/);
});

test('active goal completion audit records storage access callsite register without declaring completion', () => {
  const source = doc();

  assert.match(source, /Storage access callsite register addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_STORAGE_ACCESS_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(source, /tests\/runtime\/storage-access-callsite-register-current-behavior\.test\.mjs/);
  assert.match(source, /storage\/cache, settings-mode, learned-identity, import\/export, Nanah/);
  assert.match(source, /dashboard refresh, runtime listener, performance, false-hide\/leak/);
  assert.match(source, /code-burden, cross-feature interaction, and implementation-change objectives/);
  assert.match(source, /8 tracked non-vendor JavaScript files with current storage access/);
  assert.match(source, /57 raw direct storage rows/);
  assert.match(source, /27 wrapper callsite rows/);
  assert.match(source, /84 combined current storage access rows/);
  assert.match(source, /21 direct `local\.get` rows/);
  assert.match(source, /33 direct `local\.set` rows/);
  assert.match(source, /3 direct `onChanged\.addListener` rows/);
  assert.match(source, /16 `storageGet\(\.\.\.\)` wrapper rows/);
  assert.match(source, /4 `readStorage\(\.\.\.\)` wrapper rows/);
  assert.match(source, /7 `writeStorage\(\.\.\.\)` wrapper rows/);
  assert.match(source, /`backgroundCacheInvalidationListener`, `contentSettingsRefreshListener`, and `dashboardExternalReloadListener`/);
  assert.match(source, /`compiledSettingsReadPathWrite`/);
  assert.match(source, /`channelMapFlushWrite`, `videoChannelMapFlushWrite`, `videoMetaMapFlushWrite`, `subscriptionImportChannelMapWrite`, and `nanahChannelMapMergeWrite`/);
  assert.match(source, /dynamic Nanah trusted-link storage through `\[key\]`/);
  assert.match(source, /row-level fixtures/);
  assert.match(source, /storage schema ownership/);
  assert.match(source, /listener parity/);
  assert.match(source, /settings-mode matrices/);
  assert.match(source, /revision reports/);
  assert.match(source, /map-only budgets/);
  assert.match(source, /no-work evidence/);
  assert.match(source, /`storageAccessCallsiteAuthority`, `storageOperationEffectReport`, `storageKeySchemaManifest`, `storageKeyStaticDynamicClassifier`, `storageListenerParityReport`, `storageWriteRevisionContract`, `storageReadPathMutationReport`, `storageWrapperParityContract`, `storageMapOnlyBudget`, or `storageSettingsModeGate`/);
});

test('active goal completion audit records message transport callsite register without declaring completion', () => {
  const source = doc();

  assert.match(source, /Message transport callsite register addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_MESSAGE_TRANSPORT_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/message-transport-callsite-register-current-behavior\.test\.mjs/);
  assert.match(source, /message transport, runtime listener, page-message bridge, tab broadcast/);
  assert.match(source, /settings-mode, learned-identity, performance, false-hide\/leak/);
  assert.match(source, /code-burden, cross-feature interaction, and implementation-change objectives/);
  assert.match(source, /61 tracked product JS\/JSX\/MJS files scanned/);
  assert.match(source, /14 files with current message transport rows/);
  assert.match(source, /64 total rows/);
  assert.match(source, /4 `runtime\.onMessage\.addListener` rows/);
  assert.match(source, /27 `runtime\.sendMessage` rows/);
  assert.match(source, /3 `tabs\.sendMessage` rows/);
  assert.match(source, /4 `window\.addEventListener\("message"\)` rows/);
  assert.match(source, /26 `window\.postMessage` rows/);
  assert.match(source, /`primaryBackgroundActionReceiver`, `secondaryBackgroundTypeReceiver`, `contentRuntimeActionReceiver`, `dashboardRuntimeMessageReceiver`, `contentBridgeMainWorldMessageReceiver`, `subscriptionImportMainWorldReceiver`, and `mainWorldBridgeReceiver`/);
  assert.match(source, /`addChannelPersistentRuntimeMutation`, `kidsBlockChannelRuntimeMutation`, and list-mode\/whitelist mutation rows/);
  assert.match(source, /learned-map page-message rows/);
  assert.match(source, /settings relay/);
  assert.match(source, /subscription import/);
  assert.match(source, /tab-message rows/);
  assert.match(source, /sender-class fixtures/);
  assert.match(source, /pending-request proof/);
  assert.match(source, /nonce\/origin policy/);
  assert.match(source, /tab-route proof/);
  assert.match(source, /settings-revision ownership/);
  assert.match(source, /no-work budgets/);
  assert.match(source, /teardown decisions/);
  assert.match(source, /negative-spoof fixtures/);
  assert.match(source, /`messageTransportCallsiteAuthority`, `messageTransportEffectReport`, `runtimeMessageSenderContract`, `pageMessageNonceContract`, `messageTransportReceiverManifest`, `messageTransportTabBroadcastAuthority`, `messageTransportPendingRequestRegistry`, `messageTransportNoWorkBudget`, `messageTransportSpoofFixtureReport`, or `messageTransportTeardownRegistry`/);
});

test('active goal completion audit records network fetch/xhr callsite register without declaring completion', () => {
  const source = doc();

  assert.match(source, /Network fetch\/XHR callsite register addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_NETWORK_FETCH_XHR_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/network-fetch-xhr-callsite-register-current-behavior\.test\.mjs/);
  assert.match(source, /network, endpoint\/XHR, JSON-first, settings-mode, learned-identity/);
  assert.match(source, /performance, false-hide\/leak, code-burden, cross-feature interaction/);
  assert.match(source, /source-derived request\/body proof/);
  assert.match(source, /61 tracked product JS\/JSX\/MJS files scanned/);
  assert.match(source, /6 files with current network fetch\/XHR rows/);
  assert.match(source, /29 total rows/);
  assert.match(source, /16 request primitive rows/);
  assert.match(source, /13 response consumption rows/);
  assert.match(source, /13 `fetch` rows/);
  assert.match(source, /3 XHR prototype rows/);
  assert.match(source, /3 `response\.body\.getReader` rows/);
  assert.match(source, /3 `response\.json` rows/);
  assert.match(source, /7 `response\.text` rows/);
  assert.match(source, /extension release-note fetches/);
  assert.match(source, /background watch\/Shorts\/Kids\/channel HTML fetches/);
  assert.match(source, /direct content-script handle\/watch\/Shorts fetches/);
  assert.match(source, /main-world subscription import POST/);
  assert.match(source, /seed passive fetch JSON decode/);
  assert.match(source, /seed XHR prototype patches/);
  assert.match(source, /excluding `runtime\.getURL\(\.\.\.\)`, `URL\.createObjectURL\(\.\.\.\)`, and local `file\.text\(\)` from network counts/);
  assert.match(source, /network owner, reason, route, profile, list mode, credentials/);
  assert.match(source, /body-parse budget, XHR patch budget, JSON-first body decision/);
  assert.match(source, /no-rule\/disabled proof/);
  assert.match(source, /sibling-visible fixtures/);
  assert.match(source, /`networkFetchXhrCallsiteAuthority`, `networkRequestPrimitiveRegister`, `networkResponseConsumptionDecision`, `networkFetchNoWorkBudget`, `networkXhrPatchBudget`, `networkCredentialPolicyReport`, `networkJsonFirstBodyDecision`, or `networkFetchFixtureProvenance`/);
});

test('active goal completion audit records current-source transport storage cross-context rerun without declaring completion', () => {
  const source = doc();

  assert.match(source, /2026-05-30 transport\/storage and cross-context packet current-source rerun/);
  assert.match(source, /node --test --test-reporter=spec tests\/runtime\/storage-access-callsite-register-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/message-transport-callsite-register-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/background-message-authority-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/network-fetch-xhr-callsite-register-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/settings-refresh-cross-context-consumer-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/background-compiled-cache-invalidation-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/state-manager-request-refresh-fanout-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-bridge-main-world-message-dispatch-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/injector-main-world-message-dispatch-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/background-identity-fetch-network-budget-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/json-first-network-snapshot-consumer-request-transport-current-behavior\.test\.mjs/);
  assert.match(source, /passed 287\/287 tests/);
  assert.match(source, /storage access\/key\/cache\/quota rows/);
  assert.match(source, /forced refresh coalescing/);
  assert.match(source, /message transport\/side-effect\/sender\/trust rows/);
  assert.match(source, /network fetch\/XHR and credential\/reason rows/);
  assert.match(source, /seed fetch\/XHR no-work gates/);
  assert.match(source, /settings refresh fanout and cross-context consumers/);
  assert.match(source, /background compiled-cache invalidation/);
  assert.match(source, /StateManager request refresh fanout and storage reload\/enrichment/);
  assert.match(source, /background script injection trust/);
  assert.match(source, /subscription import lifecycle/);
  assert.match(source, /backup\/Nanah trusted-state and blob URL lifecycle/);
  assert.match(source, /network-snapshot request transport/);
  assert.match(source, /Runtime behavior changed by this rerun: no/);
  assert.match(source, /Transport authority, storage schema authority, sender-class capability policy,\s+page-message nonce\/origin policy, settings refresh pruning approval,\s+compiled-cache revision authority, request-fanout pruning, network credential\/reason\s+authority, identity fetch budget approval, backup\/Nanah trust policy,\s+JSON-first promotion, whitelist\/cache optimization, release\/public-claim use,\s+and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /2026-05-30 settings refresh fanout metric sample linkage/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(source.includes('tests/runtime/first-optimization-metric-sample-contract-current-behavior.test.mjs'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_READINESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-29.md'));
  assert.match(source, /without creating metric files or approving collectors/);
  assert.match(source, /settings refresh fanout metric sample linkage rows: 9/);
  assert.match(source, /source settings-refresh\s+fanout rows linked: 9/);
  assert.match(source, /inline `domLifecycleCounters` fanout fields linked: 8/);
  assert.match(source, /committed metric sample files from fanout linkage: 0/);
  assert.match(source, /runtime behavior changed\s+by fanout linkage: no/);
  assert.match(source, /runtime collector insertion from fanout linkage: NO-GO/);
  assert.match(source, /observer\/menu\/quick pruning from fanout linkage: NO-GO/);
  assert.match(source, /whitelist optimization\s+from fanout linkage: NO-GO/);
  assert.match(source, /JSON-first promotion from fanout linkage:\s+NO-GO/);
  assert.match(source, /metric collector insertion, observer\/menu\/quick pruning,\s+whitelist optimization, JSON-first promotion, release\/public-claim use, and\s+`update_goal\(status='complete'\)` at `NO-GO`/);
});

test('active goal completion audit records compiled settings field register without declaring completion', () => {
  const source = doc();

  assert.match(source, /Compiled settings field register addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_COMPILED_SETTINGS_FIELD_REGISTER_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/compiled-settings-field-register-current-behavior\.test\.mjs/);
  assert.match(source, /settings-mode, JSON-first, no-work, learned-identity/);
  assert.match(source, /performance, false-hide\/leak, code-burden, cross-feature interaction/);
  assert.match(source, /current source-derived field proof/);
  assert.match(source, /6 settings\/compiler\/runtime files/);
  assert.match(source, /274 raw compiled\/settings field rows/);
  assert.match(source, /130 unique file-field-operation rows/);
  assert.match(source, /44 background compiled fields/);
  assert.match(source, /36 shared UI compiled fields/);
  assert.match(source, /8 background-only compiled fields/);
  assert.match(source, /7 filter-logic processed fields/);
  assert.match(source, /10 seed cached-settings fields/);
  assert.match(source, /6 content-bridge current-settings fields/);
  assert.match(source, /4 bridge-settings settings fields/);
  assert.match(source, /`channelMap`, `listMode`, `profileType`, `useExactWordMatching`, `videoChannelMap`, `videoMetaMap`, `whitelistChannels`, and `whitelistKeywords`/);
  assert.match(source, /no shared-only compiled fields/);
  assert.match(source, /field ownership/);
  assert.match(source, /compiler parity/);
  assert.match(source, /JSON-first field decisions/);
  assert.match(source, /list-mode\/profile routing/);
  assert.match(source, /active-rule reasons/);
  assert.match(source, /storage revision policy/);
  assert.match(source, /message relay policy/);
  assert.match(source, /seed\/filter\/bridge work budgets/);
  assert.match(source, /DOM\/native parity/);
  assert.match(source, /positive\/negative fixtures/);
  assert.match(source, /`compiledSettingsFieldRegisterAuthority`, `compiledSettingsSchemaManifest`, `compiledSettingsFieldParityReport`, `compiledSettingsConsumerManifest`, `settingsJsonFirstFieldDecision`, `settingsJsonFirstNoWorkBudget`, `compiledSettingsRevisionContract`, or `compiledSettingsFixtureProvenance`/);
});

test('active goal completion audit records settings refresh key parity register without declaring completion', () => {
  const source = doc();

  assert.match(source, /Settings refresh key parity register addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SETTINGS_REFRESH_KEY_PARITY_REGISTER_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/settings-refresh-key-parity-register-current-behavior\.test\.mjs/);
  assert.match(source, /storage-key, settings-mode, JSON-first, no-work/);
  assert.match(source, /performance, false-hide\/leak, code-burden, cross-feature interaction/);
  assert.match(source, /current source-derived refresh parity proof/);
  assert.match(source, /4 settings refresh key source files/);
  assert.match(source, /7 key owner sets/);
  assert.match(source, /49 unique keys/);
  assert.match(source, /43 background compiler read keys/);
  assert.match(source, /14 background invalidation keys/);
  assert.match(source, /36 shared settings keys/);
  assert.match(source, /38 expanded shared change keys/);
  assert.match(source, /40 expanded shared load keys/);
  assert.match(source, /42 content bridge refresh keys/);
  assert.match(source, /39 StateManager reload keys/);
  assert.match(source, /30 background compiler keys not invalidated by the background listener/);
  assert.match(source, /3 compiler keys not watched by content bridge refresh/);
  assert.match(source, /6 compiler keys not watched by StateManager reload/);
  assert.match(source, /`channelMap` early return/);
  assert.match(source, /`videoChannelMap`\/`videoMetaMap` map-only refresh policy/);
  assert.match(source, /`hideComments`\/`hideAllComments` invalidation drift/);
  assert.match(source, /dirty-key, revision, no-op, active-rule, DOM reprocess, seed update, main-world relay, UI reload, and work-budget decisions/);
  assert.match(source, /one refresh key manifest/);
  assert.match(source, /settings revision contract/);
  assert.match(source, /consumer refresh matrix/);
  assert.match(source, /per-key work budgets/);
  assert.match(source, /positive\/negative fixtures/);
  assert.match(source, /`settingsRefreshKeyParityAuthority`, `settingsRefreshKeyManifest`, `settingsRefreshRevisionContract`, `settingsDirtyKeyDecision`, `settingsNoOpRefreshReport`, `settingsConsumerRefreshMatrix`, `settingsRefreshWorkBudget`, or `settingsRefreshFixtureProvenance`/);
});

test('active goal completion audit records learned identity map cache persistence boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Learned identity map cache persistence boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_LEARNED_IDENTITY_MAP_CACHE_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/learned-identity-map-cache-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct cache persistence proof/);
  assert.match(source, /5 learned identity map cache persistence source files/);
  assert.match(source, /7 source\/effect blocks/);
  assert.match(source, /264 background map cache cluster block lines/);
  assert.match(source, /8987 background map cache cluster block bytes/);
  assert.match(source, /27 background map message receiver block lines/);
  assert.match(source, /1185 background map message receiver block bytes/);
  assert.match(source, /92 content_bridge map persistence helpers block lines/);
  assert.match(source, /3966 content_bridge map persistence helpers block bytes/);
  assert.match(source, /103 content_bridge main-world map receiver block lines/);
  assert.match(source, /4981 content_bridge main-world map receiver block bytes/);
  assert.match(source, /58 bridge_settings map storage-change block lines/);
  assert.match(source, /1855 bridge_settings map storage-change block bytes/);
  assert.match(source, /16 state_manager persistChannelMap block lines/);
  assert.match(source, /468 state_manager persistChannelMap block bytes/);
  assert.match(source, /95 filter_logic map producer cluster block lines/);
  assert.match(source, /3795 filter_logic map producer cluster block bytes/);
  assert.match(source, /38 selected background compiledSettingsCache tokens/);
  assert.match(source, /93 selected background channelMap tokens/);
  assert.match(source, /46 selected background videoChannelMap tokens/);
  assert.match(source, /40 selected background videoMetaMap tokens/);
  assert.match(source, /31 selected content_bridge applyDOMFallback tokens/);
  assert.match(source, /11 runtime learned identity map cache persistence fixtures/);
  assert.match(source, /filter_logic producers validate and batch before page messages/);
  assert.match(source, /background uses three debounced flush timers without revision reports/);
  assert.match(source, /background map message receivers accept updates without sender policy or profile gates/);
  assert.match(source, /content_bridge helpers patch local settings before background persistence/);
  assert.match(source, /page-message receivers can stamp DOM, rerun fallback, and bypass background cache through direct custom URL storage/);
  assert.match(source, /bridge_settings plus StateManager map storage paths have asymmetric refresh behavior/);
  assert.match(source, /cache persistence contract/);
  assert.match(source, /direct storage bypass report/);
  assert.match(source, /producer\/receiver parity report/);
  assert.match(source, /`learnedIdentityMapCachePersistenceContract`, `learnedIdentityMapCacheFlushReport`, `learnedIdentityMapCacheRevisionPolicy`, `learnedIdentityMapDirectStorageBypassReport`, `learnedIdentityMapStorageRefreshPolicy`, `learnedIdentityMapCompiledCachePatchReport`, `learnedIdentityMapProducerReceiverParityReport`, `learnedIdentityMapFixtureProvenance`, or `learnedIdentityMapMetricArtifact`/);
  assert.match(source, /2026-05-30 content-filter route\/surface no-work chain continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_SEMANTICS_CONTRACT_GATE_CURRENT_BEHAVIOR_2026-05-29.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_MANIFEST_GATE_CURRENT_BEHAVIOR_2026-05-29.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_ROUTE_SURFACE_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_CONTENT_FILTER_ROUTE_SURFACE_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-29.md'));
  assert.ok(source.includes('tests/runtime/content-filter-field-semantics-contract-gate-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/content-filter-field-effect-manifest-gate-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/content-filter-field-effect-route-surface-matrix-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/content-filter-route-surface-no-work-budget-current-behavior.test.mjs'));
  assert.match(source, /link content-filter field meaning, side-effect ownership, route\/surface\s+behavior, and no-work budgets without declaring JSON-first promotion ready/);
  assert.match(source, /12 content-filter field semantics contract rows/);
  assert.match(source, /16\s+content\/category semantic callable rows already lifted into the method gate/);
  assert.match(source, /0\s+JSON-first content-filter first-class approvals/);
  assert.match(source, /0 DOM fallback content-filter\s+deletion approvals/);
  assert.match(source, /0 settings ingress content-filter normalization\s+approvals/);
  assert.match(source, /12 content-filter field-effect manifest rows/);
  assert.match(source, /3 JSON pure decision\s+rows/);
  assert.match(source, /1 JSON metadata-fetch side-effect row/);
  assert.match(source, /5 DOM side-effect rows/);
  assert.match(source, /2\s+bridge\/background metadata side-effect rows/);
  assert.match(source, /12 content-filter route\/surface\s+rows/);
  assert.match(source, /9 route\/surface classes/);
  assert.match(source, /12 route\/surface closure rows/);
  assert.match(source, /0 runtime\s+route\/surface closure approvals/);
  assert.match(source, /0 implementation-ready route\/surface rows/);
  assert.match(source, /content-filter route\/surface closure `ROUTE-SURFACE-CHAIN-CLOSED`/);
  assert.match(source, /content-filter route\/surface implementation readiness from closure `NO-GO`/);
  assert.match(source, /12 content-filter route\/surface no-work budget rows/);
  assert.match(source, /7 current cheap\s+no-work gate families covered/);
  assert.match(source, /6 known over-work gap families covered/);
  assert.match(source, /0\s+runtime no-work authority approvals/);
  assert.match(source, /content-filter no-work budget approval\s+`NO-GO`/);
  assert.match(source, /7 content-filter no-work closure rows/);
  assert.match(source, /12 budget rows covered by\s+closure rows/);
  assert.match(source, /7 source input families linked/);
  assert.match(source, /0 committed no-work metric\s+artifacts/);
  assert.match(source, /0 committed live trace artifacts/);
  assert.match(source, /0 runtime no-work closure\s+approvals/);
  assert.match(source, /content-filter no-work closure `BUDGET-CHAIN-CLOSED`/);
  assert.match(source, /content-filter implementation readiness from closure `NO-GO`/);
  assert.match(source, /JSON-first content-filter first-class authority, JSON-first no-work authority,\s+DOM fallback content-filter deletion/);
  assert.match(source, /metadata scheduler fetch authority, YTM\/Kids\/native\/comment route parity/);
});

test('active goal completion audit records JSON-first active work predicate register without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first active work predicate register addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-active-work-predicate-register-current-behavior\.test\.mjs/);
  assert.match(source, /JSON-first, no-work, settings-mode, endpoint\/XHR/);
  assert.match(source, /DOM fallback, quick-block, category metadata, lifecycle/);
  assert.match(source, /source-locus proof toward active-work predicate proof/);
  assert.match(source, /5 source files with active-work predicates/);
  assert.match(source, /11 predicate anchors/);
  assert.match(source, /2 endpoint key sets with 5 entries each/);
  assert.match(source, /3 seed content-filter branches/);
  assert.match(source, /6 seed JSON active-rule branches/);
  assert.match(source, /3 seed skip route classes/);
  assert.match(source, /4 `processWithEngine\(\)` work classes/);
  assert.match(source, /36 DOM fallback active triggers/);
  assert.match(source, /28 DOM fallback boolean keys/);
  assert.match(source, /8 fallback menu warmup scans at 1500 ms/);
  assert.match(source, /1000 ms quick-block setup delay/);
  assert.match(source, /no quick-block periodic timer after the 2026-05-25 SPA drag optimization addendum/);
  assert.match(source, /fetch body parsing before disabled\/no-settings decisions/);
  assert.match(source, /XHR mark\/wrap work before late guards/);
  assert.match(source, /category enabled checks without selected-value proof/);
  assert.match(source, /whitelist DOM fallback activity/);
  assert.match(source, /engine harvest before disabled checks/);
  assert.match(source, /fallback menu lifecycle work before later `showBlockMenuItem` checks/);
  assert.match(source, /quick-block lifecycle setup before per-card action gates/);
  assert.match(source, /no unified active-work decision exists/);
  assert.match(source, /parse, stringify, harvest, mutation, DOM scan, menu repair/);
  assert.match(source, /quick-block lifecycle, metadata fetch, listener, observer, timer/);
  assert.match(source, /fixtures, or metric artifacts/);
  assert.match(source, /`jsonFirstActiveWorkPredicateAuthority`, `jsonFirstActiveRulePredicateReport`, `jsonFirstNoWorkDecisionMatrix`, `jsonFirstEndpointActiveRuleDecision`, `jsonFirstDomActiveWorkPredicate`, `jsonFirstQuickBlockLifecyclePredicate`, `jsonFirstFallbackMenuLifecyclePredicate`, `jsonFirstCategorySelectedDecision`, `jsonFirstDisabledModeWorkBudget`, or `jsonFirstActiveWorkFixtureProvenance`/);
  assert.match(source, /2026-05-30 JSON-first work-class decision linkage/);
  assert.match(source, /passive JSON body parsing, queued initial-data replay, MAIN-world runtime injection/);
  assert.match(source, /filter-logic harvest, filter-logic mutation, DOM fallback scan\/stale cleanup/);
  assert.match(source, /quick\/menu user-action affordance work/);
  assert.match(source, /`jsonFirstWorkClassDecisionReport` is absent/);
  assert.match(source, /predicate merging, JSON-first first-class promotion, DOM fallback pruning/);
});

test('active goal completion audit records JSON-first metric artifact gate without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first metric artifact gate addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_METRIC_ARTIFACT_GATE_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-metric-artifact-gate-current-behavior\.test\.mjs/);
  assert.match(source, /no-work crosswalk and performance-claim proof toward metric-artifact proof/);
  assert.match(source, /11 metric artifact boundary files/);
  assert.match(source, /9 runtime metric boundary source files/);
  assert.match(source, /10 source\/effect blocks/);
  assert.match(source, /0 `performance\.now\(\)` callsites/);
  assert.match(source, /0 `console\.time\(\)` callsites/);
  assert.match(source, /77 `Date\.now\(\)` callsites/);
  assert.match(source, /21 `statsBySurface` token occurrences/);
  assert.match(source, /76 `setTimeout` callsites/);
  assert.match(source, /2 `setInterval` callsites/);
  assert.match(source, /13 `MutationObserver` tokens/);
  assert.match(source, /12 `fetch\(\)` callsites/);
  assert.match(source, /2 `XMLHttpRequest` tokens/);
  assert.match(source, /seed debug timing/);
  assert.match(source, /filter-logic debug elapsed time/);
  assert.match(source, /StateManager debug enrichment duration/);
  assert.match(source, /background identity timeout\/stream limits/);
  assert.match(source, /handle resolver pending\/fetch\/rerun behavior/);
  assert.match(source, /content saved-time stats/);
  assert.match(source, /debug diagnostics and product stats/);
  assert.match(source, /not a committed JSON-first metric artifact contract/);
  assert.match(source, /route\/surface\/list-mode sample artifacts/);
  assert.match(source, /parse\/stringify\/processData\/harvest\/listener\/observer\/timer\/network\/storage\/hide\/restore counters/);
  assert.match(source, /DOM\/native parity measurement/);
  assert.match(source, /resolver budget metrics/);
  assert.match(source, /storage budget metrics/);
  assert.match(source, /optimization measurement fixtures/);
  assert.match(source, /`jsonFirstMetricArtifactGate`, `jsonFirstMetricArtifactReport`, `jsonFirstRuntimeMetricSample`, `jsonFirstRouteWorkBudgetReport`, `jsonFirstOptimizationMeasurementFixture`, `jsonFirstPerformanceClaimAuthority`, `jsonFirstNoWorkMetricArtifact`, `jsonFirstDomMetricParityReport`, `jsonFirstResolverMetricBudget`, or `jsonFirstStorageMetricBudget`/);
});

test('active goal completion audit records JSON-first response mutation contract without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first response mutation contract addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-response-mutation-contract-current-behavior\.test\.mjs/);
  assert.match(source, /JSON-first, endpoint\/XHR, settings-mode, no-work/);
  assert.match(source, /response mutation proof/);
  assert.match(source, /1 response-mutation source file/);
  assert.match(source, /5 fetch endpoint entries/);
  assert.match(source, /5 XHR endpoint entries/);
  assert.match(source, /1 fetch endpoint substring gate/);
  assert.match(source, /2 XHR endpoint substring gates/);
  assert.match(source, /1 raw `\/youtubei\/v1\/next` shortcut/);
  assert.match(source, /1 fetch JSON decode site/);
  assert.match(source, /2 fetch response replacement branches/);
  assert.match(source, /3 preserved response metadata fields/);
  assert.match(source, /1 fetch parse-failure pass-through branch/);
  assert.match(source, /1 fetch non-OK pass-through branch/);
  assert.match(source, /2 XHR body parse modes/);
  assert.match(source, /1 XHR `JSON\.parse` site/);
  assert.match(source, /1 XHR `JSON\.stringify` replacement site/);
  assert.match(source, /2 XHR modified response fields/);
  assert.match(source, /2 per-instance XHR property override sites/);
  assert.match(source, /4 listener hook sites/);
  assert.match(source, /nonmatching fetch skips clone\/parse\/stringify\/process work/);
  assert.match(source, /non-OK fetch skips body parsing/);
  assert.match(source, /invalid JSON returns the original response/);
  assert.match(source, /active matching fetch rebuilds the body while preserving status\/statusText\/headers/);
  assert.match(source, /harvest-only matching fetch still parses and stringifies/);
  assert.match(source, /parsed endpoint policy/);
  assert.match(source, /content-type\/cache\/stream contract/);
  assert.match(source, /XHR override compatibility proof/);
  assert.match(source, /disabled\/no-rule budgets/);
  assert.match(source, /sibling-visible fixtures/);
  assert.match(source, /metric artifacts/);
  assert.match(source, /`jsonFirstResponseMutationAuthority`, `jsonFirstResponseMutationContract`, `jsonFirstEndpointParserContract`, `jsonFirstFetchResponseDecision`, `jsonFirstXhrResponseDecision`, `jsonFirstResponseMetadataReport`, `jsonFirstResponsePassThroughReason`, `jsonFirstCommentContinuationDecision`, or `jsonFirstResponseMutationFixtureProvenance`/);
});

test('active goal completion audit records JSON-first endpoint match policy without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first endpoint match policy addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_ENDPOINT_MATCH_POLICY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-endpoint-match-policy-current-behavior\.test\.mjs/);
  assert.match(source, /JSON-first, endpoint\/XHR, settings-mode, no-work/);
  assert.match(source, /endpoint classifier proof/);
  assert.match(source, /1 endpoint-match source file/);
  assert.match(source, /5 fetch endpoint entries/);
  assert.match(source, /5 XHR endpoint entries/);
  assert.match(source, /2 identical endpoint arrays/);
  assert.match(source, /1 fetch raw substring endpoint gate/);
  assert.match(source, /2 XHR raw substring endpoint gates/);
  assert.match(source, /1 raw `\/youtubei\/v1\/next` shortcut/);
  assert.match(source, /2 parsed pathname helper definitions/);
  assert.match(source, /2 parsed pathname label callsites/);
  assert.match(source, /0 pre-match origin\/pathname\/segment-boundary gates/);
  assert.match(source, /2 query-only positive fixtures/);
  assert.match(source, /2 longer-path positive fixtures/);
  assert.match(source, /2 nonmatching bypass fixtures/);
  assert.match(source, /1 Request-object fetch positive fixture/);
  assert.match(source, /1 URL-object XHR positive fixture/);
  assert.match(source, /nonmatching fetch skips clone\/parse\/stringify\/process work/);
  assert.match(source, /query-only fetch endpoint text still intercepts with `fetch:\/log`/);
  assert.match(source, /longer-path fetch endpoint text still intercepts with `fetch:\/youtubei\/v1\/searchExtra`/);
  assert.match(source, /`Request\.url` can admit fetch processing/);
  assert.match(source, /XHR query-only and longer-path endpoint text mark processing true/);
  assert.match(source, /URL-object XHR values are stringified/);
  assert.match(source, /XHR `send\(\)` can restore the process mark/);
  assert.match(source, /parsed origin\/hostname\/pathname\/search policy/);
  assert.match(source, /endpoint boundary proof/);
  assert.match(source, /exact endpoint positive fixtures/);
  assert.match(source, /query-only and longer-path negative fixtures/);
  assert.match(source, /malformed\/relative URL fixtures/);
  assert.match(source, /shared fetch\/XHR\/comment shortcut parity/);
  assert.match(source, /route\/surface\/list-mode permission/);
  assert.match(source, /body-work permission/);
  assert.match(source, /metric artifacts/);
  assert.match(source, /`jsonFirstEndpointMatchPolicy`, `jsonFirstEndpointParserContract`, `jsonFirstParsedEndpointDecision`, `jsonFirstRawUrlMatchReport`, `jsonFirstEndpointBoundaryFixtureProvenance`, `jsonFirstEndpointNegativeFixtureReport`, `jsonFirstFetchEndpointDecision`, `jsonFirstXhrEndpointDecision`, or `jsonFirstCommentEndpointDecision`/);
});

test('active goal completion audit records JSON-first URL normalization contract without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first URL normalization contract addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_URL_NORMALIZATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-url-normalization-contract-current-behavior\.test\.mjs/);
  assert.match(source, /JSON-first, endpoint\/XHR, settings-mode, no-work/);
  assert.match(source, /parsed URL normalization proof/);
  assert.match(source, /1 URL-normalization source file/);
  assert.match(source, /2 parsed pathname helper definitions/);
  assert.match(source, /1 unique parsed pathname helper body/);
  assert.match(source, /0 pre-match parsed pathname callsites/);
  assert.match(source, /2 post-match parsed pathname label callsites/);
  assert.match(source, /2 parsed URL base-origin fallback sites/);
  assert.match(source, /2 parsed URL catch fallback split-query sites/);
  assert.match(source, /3 raw URL stringification sites before match/);
  assert.match(source, /1 Request\.url extraction site/);
  assert.match(source, /1 raw object includes shortcut site/);
  assert.match(source, /0 origin\/hostname\/hash\/query gates before match/);
  assert.match(source, /2 relative URL positive fixtures/);
  assert.match(source, /2 cross-origin exact-path positive fixtures/);
  assert.match(source, /2 hash-fragment endpoint-text positive fixtures/);
  assert.match(source, /2 malformed raw endpoint positive fixtures/);
  assert.match(source, /1 fetch URL-object parse-without-process fixture/);
  assert.match(source, /1 fetch Request-object process fixture/);
  assert.match(source, /1 XHR URL-object mark fixture/);
  assert.match(source, /relative endpoint paths enter fetch\/XHR matching/);
  assert.match(source, /cross-origin exact endpoint paths enter fetch\/XHR matching/);
  assert.match(source, /hash-fragment endpoint text enters matching while fetch labels `fetch:\/watch`/);
  assert.match(source, /malformed raw endpoint text enters matching while fetch labels `fetch:http:\/\/\[\/youtubei\/v1\/search`/);
  assert.match(source, /fetch URL objects parse response JSON but skip `processWithEngine\(\)` and stringify/);
  assert.match(source, /fetch Request objects process through `Request\.url`/);
  assert.match(source, /XHR URL objects are stringified and marked/);
  assert.match(source, /one parsed URL decision/);
  assert.match(source, /same-origin and cross-origin policy/);
  assert.match(source, /relative and malformed URL policy/);
  assert.match(source, /hash\/query endpoint-text negative fixtures/);
  assert.match(source, /URL value-kind policy/);
  assert.match(source, /shared fetch\/XHR parser parity/);
  assert.match(source, /comment shortcut permission/);
  assert.match(source, /body-work permission/);
  assert.match(source, /metric artifacts/);
  assert.match(source, /`jsonFirstUrlNormalizationContract`, `jsonFirstEndpointUrlParserContract`, `jsonFirstParsedUrlDecision`, `jsonFirstEndpointUrlValueKind`, `jsonFirstFetchUrlObjectDecision`, `jsonFirstXhrUrlObjectDecision`, `jsonFirstRelativeEndpointDecision`, `jsonFirstMalformedUrlDecision`, or `jsonFirstUrlFragmentQueryPolicy`/);
});

test('active goal completion audit records JSON-first comment continuation shortcut without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first comment continuation shortcut addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_COMMENT_CONTINUATION_SHORTCUT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-comment-continuation-shortcut-current-behavior\.test\.mjs/);
  assert.match(source, /JSON-first, endpoint\/XHR, settings-mode, no-work/);
  assert.match(source, /comment-continuation mutation proof/);
  assert.match(source, /1 comment-continuation source file/);
  assert.match(source, /1 fetch-only shortcut branch/);
  assert.match(source, /1 raw `\/youtubei\/v1\/next` shortcut gate/);
  assert.match(source, /1 `hideAllComments` guard/);
  assert.match(source, /1 response collection root checked by the shortcut/);
  assert.match(source, /1 continuation command shape checked by the shortcut/);
  assert.match(source, /2 comment renderer item shapes checked by the shortcut/);
  assert.match(source, /1 synthetic response replacement branch/);
  assert.match(source, /1 synthetic end marker continuation item/);
  assert.match(source, /1 `continuationEndpoint: null` writer site/);
  assert.match(source, /3 metadata fields preserved by the shortcut response/);
  assert.match(source, /2 append endpoint comment positive fixtures/);
  assert.match(source, /2 non-append command miss fixtures/);
  assert.match(source, /1 non-endpoints collection miss fixture/);
  assert.match(source, /1 non-comment append fallback fixture/);
  assert.match(source, /1 `hideAllComments` false fallback fixture/);
  assert.match(source, /1 non-next endpoint fallback fixture/);
  assert.match(source, /2 engine bypass fixtures/);
  assert.match(source, /5 engine fallback fixtures/);
  assert.match(source, /append `commentThreadRenderer` and direct `commentRenderer` endpoint continuations return one synthetic end marker without `processData\(\)`/);
  assert.match(source, /reload and replace comment continuations fall through to normal engine processing/);
  assert.match(source, /`onResponseReceivedActions` append comment continuations miss the shortcut/);
  assert.match(source, /shortcut responses preserve status\/statusText\/headers/);
  assert.match(source, /parsed endpoint policy/);
  assert.match(source, /collection-root parity/);
  assert.match(source, /append\/reload\/replace command parity/);
  assert.match(source, /XHR parity/);
  assert.match(source, /comment renderer shape provenance/);
  assert.match(source, /sibling-preservation proof/);
  assert.match(source, /no-work budgets/);
  assert.match(source, /response metadata\/body-mode proof/);
  assert.match(source, /route\/surface\/list-mode permission/);
  assert.match(source, /metric artifacts/);
  assert.match(source, /`jsonFirstCommentContinuationContract`, `jsonFirstCommentContinuationDecision`, `jsonFirstCommentShortcutShapeReport`, `jsonFirstCommentSyntheticEndDecision`, `jsonFirstCommentSiblingPreservationReport`, `jsonFirstCommentContinuationNoWorkBudget`, `jsonFirstCommentCommandParityReport`, `jsonFirstCommentContinuationFixtureProvenance`, or `jsonFirstCommentContinuationMetricArtifact`/);
});

test('active goal completion audit records JSON-first XHR response override contract without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first XHR response override contract addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_XHR_RESPONSE_OVERRIDE_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-xhr-response-override-contract-current-behavior\.test\.mjs/);
  assert.match(source, /page-visible XHR override proof/);
  assert.match(source, /1 XHR response-override source file/);
  assert.match(source, /5 XHR endpoint entries/);
  assert.match(source, /2 XHR mark sites before body guards/);
  assert.match(source, /2 send-time ready\/load hook installs/);
  assert.match(source, /2 listener wrapper hook sites/);
  assert.match(source, /1 response processor definition/);
  assert.match(source, /7 pre-parse guard branches/);
  assert.match(source, /2 response body parse modes/);
  assert.match(source, /1 text `JSON\.parse` site/);
  assert.match(source, /1 `processWithEngine\(\)` XHR callsite/);
  assert.match(source, /2 modified response backing fields/);
  assert.match(source, /2 per-instance response getter override sites/);
  assert.match(source, /3 response getter return branches after mutation/);
  assert.match(source, /2 fallback prototype getter branches/);
  assert.match(source, /1 `responseProcessed` terminal write site/);
  assert.match(source, /1 text response override positive fixture/);
  assert.match(source, /1 JSON response override positive fixture/);
  assert.match(source, /5 late guard no-mutation fixtures/);
  assert.match(source, /1 listener wrapper invocation fixture/);
  assert.match(source, /text-like XHR mutation returns a string from both `response` and `responseText`/);
  assert.match(source, /JSON XHR mutation returns an object from `response` and a string from `responseText`/);
  assert.match(source, /no-settings\/disabled\/error\/invalid-JSON\/unsupported-type cases remain marked and hookable/);
  assert.match(source, /marked load listeners observe modified `responseText`/);
  assert.match(source, /shared endpoint policy/);
  assert.match(source, /body-mode decision records/);
  assert.match(source, /getter compatibility proof/);
  assert.match(source, /override lifetime\/teardown proof/);
  assert.match(source, /`jsonFirstXhrResponseOverrideContract`, `jsonFirstXhrResponseOverrideDecision`, `jsonFirstXhrBodyModeReport`, `jsonFirstXhrGetterCompatibilityReport`, `jsonFirstXhrListenerOrderReport`, `jsonFirstXhrPassThroughReason`, `jsonFirstXhrOverrideLifetimeRegistry`, `jsonFirstXhrResponseOverrideFixtureProvenance`, or `jsonFirstXhrResponseOverrideMetricArtifact`/);
});

test('active goal completion audit records JSON-first fetch response rebuild metadata contract without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first fetch response rebuild metadata contract addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_FETCH_RESPONSE_REBUILD_METADATA_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-fetch-response-rebuild-metadata-contract-current-behavior\.test\.mjs/);
  assert.match(source, /fetch response metadata and body-mode proof/);
  assert.match(source, /1 fetch response rebuild source file/);
  assert.match(source, /5 fetch endpoint entries/);
  assert.match(source, /1 fetch response clone body-read site/);
  assert.match(source, /2 fetch response rebuild branches/);
  assert.match(source, /2 `new Response` body writer sites/);
  assert.match(source, /2 `JSON\.stringify` rebuild body sites/);
  assert.match(source, /3 selected metadata fields preserved per rebuild/);
  assert.match(source, /6 selected metadata assignment sites/);
  assert.match(source, /2 headers object pass-through sites/);
  assert.match(source, /0 headers clone\/copy sites/);
  assert.match(source, /0 content-type decision sites/);
  assert.match(source, /0 body mode decision sites/);
  assert.match(source, /0 response identity metadata writer sites/);
  assert.match(source, /3 pass-through branches returning the original response/);
  assert.match(source, /1 normal rebuild positive fixture/);
  assert.match(source, /1 comment shortcut rebuild positive fixture/);
  assert.match(source, /3 pass-through original-response fixtures/);
  assert.match(source, /normal processed rebuilds return a new response with stringified processed JSON/);
  assert.match(source, /preserve status\/statusText\/the same headers object/);
  assert.match(source, /do not preserve original `url`, `redirected`, or `type`/);
  assert.match(source, /comment shortcut rebuilds use the same selected metadata shape/);
  assert.match(source, /nonmatching and non-OK fetches return the original response/);
  assert.match(source, /invalid JSON reads clone JSON once and returns the original response/);
  assert.match(source, /body-mode decision records/);
  assert.match(source, /content-type policy/);
  assert.match(source, /header clone\/copy policy/);
  assert.match(source, /response identity compatibility proof/);
  assert.match(source, /stream\/cache\/trailer\/body-used policy/);
  assert.match(source, /`jsonFirstFetchResponseRebuildContract`, `jsonFirstFetchResponseMetadataDecision`, `jsonFirstFetchBodyModeReport`, `jsonFirstFetchHeaderClonePolicy`, `jsonFirstFetchResponseIdentityReport`, `jsonFirstFetchPassThroughReason`, `jsonFirstFetchRebuildFixtureProvenance`, `jsonFirstFetchResponseMetricArtifact`, or `jsonFirstFetchContentTypeDecision`/);
});

test('active goal completion audit records JSON-first pending queue replay contract without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first pending queue replay contract addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_PENDING_QUEUE_REPLAY_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-pending-queue-replay-contract-current-behavior\.test\.mjs/);
  assert.match(source, /startup queue\/replay proof/);
  assert.match(source, /1 pending queue source file/);
  assert.match(source, /1 queue state declaration/);
  assert.match(source, /2 replay timer state declarations/);
  assert.match(source, /1 replay function/);
  assert.match(source, /1 schedule function/);
  assert.match(source, /a 250 ms replay delay/);
  assert.match(source, /1 direct no-settings queue push site/);
  assert.match(source, /0 direct no-settings cap sites/);
  assert.match(source, /0 direct no-settings schedule sites/);
  assert.match(source, /1 `queueForLater\(\)` push site/);
  assert.match(source, /a 60-item helper cap threshold/);
  assert.match(source, /a 40-item retained tail/);
  assert.match(source, /1 engine-missing helper callsite/);
  assert.match(source, /1 harvest-missing helper callsite/);
  assert.match(source, /1 replay no-engine reschedule site/);
  assert.match(source, /2 queued data clone sites/);
  assert.match(source, /2 queued data suffixes/);
  assert.match(source, /1 settings-update queue drain site/);
  assert.match(source, /2 queued global assignment branches/);
  assert.match(source, /1 fetch no-settings queue fixture/);
  assert.match(source, /1 direct no-settings over-cap fixture/);
  assert.match(source, /1 engine-missing cap\/timer fixture/);
  assert.match(source, /1 global setter queued assignment fixture/);
  assert.match(source, /matching fetches before settings clone JSON, stringify an unchanged response/);
  assert.match(source, /settings update drains queued fetch work with a `-queued` suffix/);
  assert.match(source, /cannot change the already-returned response/);
  assert.match(source, /65 matching fetches before settings leave 65 queued items/);
  assert.match(source, /65 matching fetches with engine missing after settings retain 44 helper-capped items/);
  assert.match(source, /queued `ytInitialData` drains through updateSettings and then re-enters the installed setter/);
  assert.match(source, /queue admission reasons/);
  assert.match(source, /settings revision at admission\/replay/);
  assert.match(source, /timer install\/teardown policy/);
  assert.match(source, /response-already-returned effect policy/);
  assert.match(source, /global assignment guard/);
  assert.match(source, /setter reentry policy/);
  assert.match(source, /`jsonFirstPendingQueueReplayContract`, `jsonFirstPendingQueueAdmissionDecision`, `jsonFirstPendingQueueCapPolicy`, `jsonFirstPendingQueueReplayBudget`, `jsonFirstPendingQueueResponseEffectReport`, `jsonFirstPendingQueueSettingsRevision`, `jsonFirstPendingQueueTimerPolicy`, `jsonFirstPendingQueueGlobalAssignmentGuard`, `jsonFirstPendingQueueFixtureProvenance`, or `jsonFirstPendingQueueMetricArtifact`/);
});

test('active goal completion audit records JSON-first network snapshot stash contract without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first network snapshot stash contract addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_STASH_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-network-snapshot-stash-contract-current-behavior\.test\.mjs/);
  assert.match(source, /network snapshot consumer proof/);
  assert.match(source, /2 snapshot source files/);
  assert.match(source, /1 seed snapshot writer function/);
  assert.match(source, /4 seed endpoint families written/);
  assert.match(source, /1 intercepted fetch endpoint family not written/);
  assert.match(source, /4 latest snapshot response fields/);
  assert.match(source, /4 latest snapshot name fields/);
  assert.match(source, /4 latest snapshot timestamp fields/);
  assert.match(source, /2 recent snapshot arrays/);
  assert.match(source, /a 12-entry recent snapshot retained tail/);
  assert.match(source, /3 recent entry fields/);
  assert.match(source, /3 `processWithEngine\(\)` stash callsites/);
  assert.match(source, /2 settings-update initial-global snapshot assignments/);
  assert.match(source, /3 injector snapshot consumer clusters/);
  assert.match(source, /2 recent browse consumer clusters/);
  assert.match(source, /2 recent search consumer clusters/);
  assert.match(source, /2 latest search consumer clusters/);
  assert.match(source, /2 latest next consumer clusters/);
  assert.match(source, /3 latest browse consumer clusters/);
  assert.match(source, /2 latest player consumer clusters/);
  assert.match(source, /4 latest snapshot fixtures/);
  assert.match(source, /2 recent array cap fixtures/);
  assert.match(source, /1 missing guide snapshot fixture/);
  assert.match(source, /1 harvest-only snapshot fixture/);
  assert.match(source, /search and browse fetches stash processed latest objects and retain the last 12 recent entries/);
  assert.match(source, /next and player keep latest processed objects without recent arrays/);
  assert.match(source, /guide fetches are processed and returned but create no guide snapshot family/);
  assert.match(source, /harvest-only search paths stash original data rather than processed engine results/);
  assert.match(source, /snapshot admission decisions/);
  assert.match(source, /endpoint-to-snapshot policy/);
  assert.match(source, /freshness and timestamp policy/);
  assert.match(source, /clone\/mutation isolation/);
  assert.match(source, /consumer route\/profile permission/);
  assert.match(source, /source-effect provenance/);
  assert.match(source, /`jsonFirstNetworkSnapshotStashContract`, `jsonFirstNetworkSnapshotAdmissionDecision`, `jsonFirstNetworkSnapshotEndpointPolicy`, `jsonFirstNetworkSnapshotFreshnessReport`, `jsonFirstNetworkSnapshotClonePolicy`, `jsonFirstNetworkSnapshotConsumerPermission`, `jsonFirstNetworkSnapshotGuidePolicy`, `jsonFirstNetworkSnapshotFixtureProvenance`, or `jsonFirstNetworkSnapshotMetricArtifact`/);
});

test('active goal completion audit records JSON-first network snapshot consumer freshness without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first network snapshot consumer freshness addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_FRESHNESS_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-network-snapshot-consumer-freshness-current-behavior\.test\.mjs/);
  assert.match(source, /consumer freshness proof/);
  assert.match(source, /1 snapshot consumer source file/);
  assert.match(source, /4 consumer functions with direct snapshot reads/);
  assert.match(source, /2 subscription import snapshot seed functions/);
  assert.match(source, /2 identity snapshot consumer functions/);
  assert.match(source, /a writer-retained recent browse read horizon/);
  assert.match(source, /a 6-entry recent search read horizon/);
  assert.match(source, /0 latest search timestamp consumer reads/);
  assert.match(source, /0 latest next timestamp consumer reads/);
  assert.match(source, /0 latest browse timestamp consumer reads outside the subscription import timestamp picker/);
  assert.match(source, /0 latest player timestamp consumer reads/);
  assert.match(source, /0 explicit snapshot max age checks/);
  assert.match(source, /0 explicit settings revision gates/);
  assert.match(source, /0 explicit current-route permission gates for identity snapshots/);
  assert.match(source, /2 stale import fixtures/);
  assert.match(source, /2 stale identity fixtures/);
  assert.match(source, /subscription import on `\/feed\/channels` consumes stale latest and recent browse snapshot data with timestamp 1/);
  assert.match(source, /subscription import returns empty seed rows on `\/watch` while its timestamp picker still returns stale browse timestamp 1/);
  assert.match(source, /channel identity on `\/watch\?v=currentVideo` consumes a recent search snapshot for `staleVideo42`/);
  assert.match(source, /channel identity reads latest search, next, and browse roots even when matching timestamp fields are set to 1/);
  assert.match(source, /consumer cluster authority/);
  assert.match(source, /max-age policy/);
  assert.match(source, /route permission/);
  assert.match(source, /profile permission/);
  assert.match(source, /settings revision gates/);
  assert.match(source, /current-video gates/);
  assert.match(source, /import age budgets/);
  assert.match(source, /stale\/missing snapshot reasons/);
  assert.match(source, /`jsonFirstNetworkSnapshotConsumerFreshnessContract`, `jsonFirstNetworkSnapshotAgePolicy`, `jsonFirstNetworkSnapshotRoutePermission`, `jsonFirstNetworkSnapshotProfilePermission`, `jsonFirstNetworkSnapshotSettingsRevisionGate`, `jsonFirstNetworkSnapshotStaleFixture`, `jsonFirstNetworkSnapshotCurrentVideoGate`, or `jsonFirstNetworkSnapshotImportAgeBudget`/);
});

test('active goal completion audit records JSON-first network snapshot clone isolation without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first network snapshot clone isolation addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CLONE_ISOLATION_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-network-snapshot-clone-isolation-current-behavior\.test\.mjs/);
  assert.match(source, /snapshot mutation-isolation proof/);
  assert.match(source, /2 source files with snapshot clone\/reference surface/);
  assert.match(source, /1 snapshot writer function/);
  assert.match(source, /4 direct latest snapshot object assignment sites/);
  assert.match(source, /2 direct recent entry data writes/);
  assert.match(source, /2 direct recent array tail writes/);
  assert.match(source, /0 snapshot writer clone callsites/);
  assert.match(source, /0 snapshot writer object freeze or seal callsites/);
  assert.match(source, /1 engine-result direct stash callsite/);
  assert.match(source, /1 harvest-only direct stash callsite/);
  assert.match(source, /1 fallback direct stash callsite/);
  assert.match(source, /1 normal fetch response stringify site after processing/);
  assert.match(source, /1 subscription import object-identity dedupe site/);
  assert.match(source, /2 latest\/recent alias fixtures/);
  assert.match(source, /2 latest-only alias fixtures/);
  assert.match(source, /1 fallback direct-reference fixture/);
  assert.match(source, /1 harvest-only direct-reference fixture/);
  assert.match(source, /5 response body isolation fixtures/);
  assert.match(source, /search and browse latest fields alias their newest recent entries and the exact `processData\(\)` result object/);
  assert.match(source, /next and player latest snapshots alias their exact `processData\(\)` result objects without recent arrays/);
  assert.match(source, /fallback stashes the same parsed object passed through failed engine processing and `basicProcessing\(\)`/);
  assert.match(source, /harvest-only stashes the same parsed object passed to `harvestOnly\(\)`/);
  assert.match(source, /parsed response JSON is separate from later snapshot mutations/);
  assert.match(source, /clone policy/);
  assert.match(source, /mutation isolation reports/);
  assert.match(source, /reference alias reports/);
  assert.match(source, /freeze\/read-only policy/);
  assert.match(source, /consumer mutation budgets/);
  assert.match(source, /response-body isolation policy/);
  assert.match(source, /`jsonFirstNetworkSnapshotCloneIsolationContract`, `jsonFirstNetworkSnapshotClonePolicy`, `jsonFirstNetworkSnapshotMutationIsolationReport`, `jsonFirstNetworkSnapshotReferenceAliasReport`, `jsonFirstNetworkSnapshotConsumerMutationBudget`, `jsonFirstNetworkSnapshotResponseBodyIsolationReport`, `jsonFirstNetworkSnapshotObjectFreezePolicy`, or `jsonFirstNetworkSnapshotCloneFixtureProvenance`/);
});

test('active goal completion audit records JSON-first network snapshot endpoint admission without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first network snapshot endpoint admission addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_ENDPOINT_ADMISSION_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-network-snapshot-endpoint-admission-current-behavior\.test\.mjs/);
  assert.match(source, /endpoint admission proof/);
  assert.match(source, /1 source file with snapshot endpoint admission surface/);
  assert.match(source, /5 fetch endpoint entries/);
  assert.match(source, /5 XHR endpoint entries/);
  assert.match(source, /4 snapshot writer endpoint branches/);
  assert.match(source, /1 fetch endpoint family without a snapshot branch/);
  assert.match(source, /1 raw fetch endpoint gate/);
  assert.match(source, /2 raw XHR endpoint mark sites/);
  assert.match(source, /2 parsed data label callsites/);
  assert.match(source, /4 snapshot label substring branch sites/);
  assert.match(source, /4 exact endpoint snapshot fixtures/);
  assert.match(source, /1 guide no-snapshot fixture/);
  assert.match(source, /1 longer-path snapshot fixture/);
  assert.match(source, /3 query\/hash\/relative no-snapshot fixtures/);
  assert.match(source, /1 cross-origin exact snapshot fixture/);
  assert.match(source, /2 XHR raw mark fixtures/);
  assert.match(source, /exact search, browse, next, and player fetches create their matching snapshot families/);
  assert.match(source, /exact guide fetches process without creating a snapshot/);
  assert.match(source, /`\/youtubei\/v1\/searchExtra` processes and becomes a search snapshot/);
  assert.match(source, /query\/hash\/relative endpoint text can process without creating any snapshot family/);
  assert.match(source, /cross-origin exact `\/youtubei\/v1\/browse` creates a browse snapshot/);
  assert.match(source, /parsed endpoint family decisions/);
  assert.match(source, /endpoint boundary policy/);
  assert.match(source, /guide endpoint policy/);
  assert.match(source, /false-positive reports/);
  assert.match(source, /fetch\/XHR transport parity/);
  assert.match(source, /body-work versus snapshot-admission parity/);
  assert.match(source, /`jsonFirstNetworkSnapshotEndpointAdmissionContract`, `jsonFirstNetworkSnapshotParsedFamilyDecision`, `jsonFirstNetworkSnapshotEndpointFamilyPolicy`, `jsonFirstNetworkSnapshotGuideEndpointPolicy`, `jsonFirstNetworkSnapshotFalsePositiveReport`, `jsonFirstNetworkSnapshotTransportParityReport`, `jsonFirstNetworkSnapshotEndpointFixtureProvenance`, or `jsonFirstNetworkSnapshotEndpointMetricArtifact`/);
});

test('active goal completion audit records JSON-first network snapshot permission boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first network snapshot permission boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_PERMISSION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-network-snapshot-permission-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /producer permission proof/);
  assert.match(source, /1 source file with snapshot permission boundary surface/);
  assert.match(source, /1 snapshot writer function/);
  assert.match(source, /0 snapshot writer route or hostname reads/);
  assert.match(source, /0 snapshot writer profile or list-mode reads/);
  assert.match(source, /0 snapshot writer enabled-state reads/);
  assert.match(source, /2 pre-writer settings gates/);
  assert.match(source, /0 settings-update endpoint snapshot clear sites/);
  assert.match(source, /0 global endpoint snapshot initializers/);
  assert.match(source, /4 route\/surface snapshot fixtures/);
  assert.match(source, /3 host snapshot fixtures/);
  assert.match(source, /4 profile\/list-mode snapshot fixtures/);
  assert.match(source, /1 no-settings no-snapshot fixture/);
  assert.match(source, /1 disabled no-snapshot fixture/);
  assert.match(source, /1 settings-change retention fixture/);
  assert.match(source, /search snapshots are written on `\/watch`, `\/feed\/channels`, `\/shorts`, and `\/results` when settings are enabled/);
  assert.match(source, /browse snapshots are written on `www\.youtube\.com`, `music\.youtube\.com`, and `m\.youtube\.com` when settings are enabled/);
  assert.match(source, /search snapshots are written for main\/blocklist, main\/whitelist, kids\/blocklist, and kids\/whitelist settings/);
  assert.match(source, /matching fetches before settings or with `enabled=false` create no endpoint snapshot/);
  assert.match(source, /switching settings to disabled kids whitelist keeps the previous search snapshot and recent search entry/);
  assert.match(source, /producer and consumer permission decisions/);
  assert.match(source, /route\/surface\/host\/profile\/list-mode policy/);
  assert.match(source, /settings revision gates/);
  assert.match(source, /disabled-state invalidation/);
  assert.match(source, /retention policy/);
  assert.match(source, /read\/write permission parity/);
  assert.match(source, /`jsonFirstNetworkSnapshotPermissionBoundaryContract`, `jsonFirstNetworkSnapshotProducerPermissionDecision`, `jsonFirstNetworkSnapshotRoutePermission`, `jsonFirstNetworkSnapshotSurfacePermission`, `jsonFirstNetworkSnapshotHostPermission`, `jsonFirstNetworkSnapshotProfilePermission`, `jsonFirstNetworkSnapshotSettingsRevisionGate`, `jsonFirstNetworkSnapshotRetentionPolicy`, `jsonFirstNetworkSnapshotDisabledInvalidationReport`, or `jsonFirstNetworkSnapshotPermissionMetricArtifact`/);
});

test('active goal completion audit records JSON-first network snapshot consumer permission without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first network snapshot consumer permission addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_PERMISSION_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-network-snapshot-consumer-permission-current-behavior\.test\.mjs/);
  assert.match(source, /consumer read-permission proof/);
  assert.match(source, /1 consumer source file with snapshot permission surface/);
  assert.match(source, /4 consumer functions with direct snapshot reads/);
  assert.match(source, /1 subscription import route gate/);
  assert.match(source, /1 identity watch-context calculation/);
  assert.match(source, /1 identity current-video calculation/);
  assert.match(source, /0 snapshot consumer `currentSettings` reads/);
  assert.match(source, /0 snapshot consumer `settingsReceived` reads/);
  assert.match(source, /0 snapshot consumer profile\/list-mode reads/);
  assert.match(source, /0 snapshot consumer enabled-state reads/);
  assert.match(source, /3 host-agnostic import fixtures/);
  assert.match(source, /1 settings-mirror import fixture/);
  assert.match(source, /3 route-agnostic identity fixtures/);
  assert.match(source, /2 settings-mirror identity fixtures/);
  assert.match(source, /1 collaborator snapshot permission fixture/);
  assert.match(source, /subscription import consumes browse snapshots on `www\.youtube\.com`, `music\.youtube\.com`, and `m\.youtube\.com` when pathname is `\/feed\/channels`/);
  assert.match(source, /subscription import consumes browse snapshots even when `window\.filterTube\.settings` is disabled kids whitelist/);
  assert.match(source, /channel identity consumes search snapshots on `\/watch`, `\/results`, and `\/shorts` with a disabled kids whitelist settings mirror/);
  assert.match(source, /collaborator identity consumes a search snapshot on `\/shorts` with disabled kids whitelist settings mirror/);
  assert.match(source, /consumer permission decisions/);
  assert.match(source, /consumer cluster reports/);
  assert.match(source, /route\/host\/profile\/list-mode policy/);
  assert.match(source, /settings revision gates/);
  assert.match(source, /read-denial reasons/);
  assert.match(source, /producer\/consumer revision parity/);
  assert.match(source, /`jsonFirstNetworkSnapshotConsumerPermissionContract`, `jsonFirstNetworkSnapshotConsumerPermissionDecision`, `jsonFirstNetworkSnapshotConsumerClusterReport`, `jsonFirstNetworkSnapshotConsumerSettingsRevisionGate`, `jsonFirstNetworkSnapshotConsumerRoutePolicy`, `jsonFirstNetworkSnapshotConsumerHostPolicy`, `jsonFirstNetworkSnapshotConsumerProfilePolicy`, `jsonFirstNetworkSnapshotConsumerReadReason`, `jsonFirstNetworkSnapshotConsumerFixtureProvenance`, or `jsonFirstNetworkSnapshotConsumerMetricArtifact`/);
});

test('active goal completion audit records JSON-first network snapshot consumer source precedence without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first network snapshot consumer source precedence addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_SOURCE_PRECEDENCE_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-network-snapshot-consumer-source-precedence-current-behavior\.test\.mjs/);
  assert.match(source, /consumer source-precedence proof/);
  assert.match(source, /1 consumer source file with snapshot source-precedence surface/);
  assert.match(source, /1 subscription import ordered seed candidate array/);
  assert.match(source, /5 fixed subscription import candidate slots before the recent spread/);
  assert.match(source, /1 recent browse spread slot/);
  assert.match(source, /1 subscription import merge function/);
  assert.match(source, /1 channel identity ordered target array/);
  assert.match(source, /10 channel identity root push sites/);
  assert.match(source, /1 channel identity first-result break site/);
  assert.match(source, /1 collaborator identity ordered root array/);
  assert.match(source, /7 collaborator identity root push sites/);
  assert.match(source, /1 collaborator identity score arbitration site/);
  assert.match(source, /1 collaborator identity strict-greater score update site/);
  assert.match(source, /1 subscription maxChannels precedence fixture/);
  assert.match(source, /1 subscription duplicate-merge precedence fixture/);
  assert.match(source, /2 channel first-root precedence fixtures/);
  assert.match(source, /1 collaborator equal-score tie fixture/);
  assert.match(source, /1 collaborator higher-score later-root fixture/);
  assert.match(source, /subscription import with `maxChannels=1` returns `lastYtBrowseResponse` before later recent browse entries/);
  assert.match(source, /subscription import duplicate merge keeps the earlier strong display name for the same channel id/);
  assert.match(source, /channel identity returns `lastYtSearchResponse` before `lastYtNextResponse` for the same video id/);
  assert.match(source, /channel identity returns `ytInitialData` before snapshot roots for the same video id/);
  assert.match(source, /collaborator identity keeps the earlier root when a later root has equal score/);
  assert.match(source, /collaborator identity replaces the earlier root when a later root has a higher score/);
  assert.match(source, /source-precedence decisions/);
  assert.match(source, /root-order decisions/);
  assert.match(source, /winning-root reports/);
  assert.match(source, /rejected-root reports/);
  assert.match(source, /score reports/);
  assert.match(source, /explicit tie policy/);
  assert.match(source, /merge policy/);
  assert.match(source, /freshness override policy/);
  assert.match(source, /`jsonFirstNetworkSnapshotConsumerSourcePrecedenceContract`, `jsonFirstNetworkSnapshotConsumerRootOrderDecision`, `jsonFirstNetworkSnapshotConsumerWinningRootReport`, `jsonFirstNetworkSnapshotConsumerRejectedRootReport`, `jsonFirstNetworkSnapshotConsumerScoreReport`, `jsonFirstNetworkSnapshotConsumerTiePolicy`, `jsonFirstNetworkSnapshotConsumerMergePolicy`, `jsonFirstNetworkSnapshotConsumerFreshnessOverridePolicy`, `jsonFirstNetworkSnapshotConsumerSourceFixtureProvenance`, or `jsonFirstNetworkSnapshotConsumerSourceMetricArtifact`/);
});

test('active goal completion audit records JSON-first network snapshot consumer traversal budget without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first network snapshot consumer traversal budget addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_TRAVERSAL_BUDGET_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-network-snapshot-consumer-traversal-budget-current-behavior\.test\.mjs/);
  assert.match(source, /consumer traversal-budget proof/);
  assert.match(source, /1 consumer source file with snapshot traversal-budget surface/);
  assert.match(source, /1 subscription artifact recursive visitor/);
  assert.match(source, /1 subscription artifact visited set/);
  assert.match(source, /0 subscription artifact explicit depth caps/);
  assert.match(source, /0 subscription artifact array slice caps/);
  assert.match(source, /1 channel identity root recursive search function/);
  assert.match(source, /1 channel identity root search visited WeakSet/);
  assert.match(source, /0 channel identity root search explicit depth caps/);
  assert.match(source, /1 channel identity recent-search retained-root cap/);
  assert.match(source, /1 collaborator identity root-search depth cap/);
  assert.match(source, /1 collaborator identity recent-search retained-root cap/);
  assert.match(source, /2 collaborator extractor nested depth caps/);
  assert.match(source, /2 collaborator extractor nested array caps/);
  assert.match(source, /1 deep subscription traversal fixture/);
  assert.match(source, /1 deep channel traversal fixture/);
  assert.match(source, /2 collaborator depth-boundary fixtures/);
  assert.match(source, /2 channel recent-search cap fixtures/);
  assert.match(source, /2 collaborator recent-search cap fixtures/);
  assert.match(source, /subscription import can collect a `channelRenderer` nested deeper than 20 object levels/);
  assert.match(source, /channel identity can find a `videoRenderer` nested deeper than 20 object levels/);
  assert.match(source, /collaborator identity finds a collaborator video object at depth 12 but drops the same object at depth 13/);
  assert.match(source, /channel identity ignores a matching recent search entry outside the last six entries and consumes one inside that horizon/);
  assert.match(source, /traversal decisions/);
  assert.match(source, /visited-node reports/);
  assert.match(source, /depth policy/);
  assert.match(source, /array-cap policy/);
  assert.match(source, /recent-root horizon policy/);
  assert.match(source, /cutoff reasons/);
  assert.match(source, /traversal metric artifacts/);
  assert.match(source, /traversal duration reports/);
  assert.match(source, /`jsonFirstNetworkSnapshotConsumerTraversalBudgetContract`, `jsonFirstNetworkSnapshotConsumerTraversalDecision`, `jsonFirstNetworkSnapshotConsumerVisitedNodeReport`, `jsonFirstNetworkSnapshotConsumerDepthPolicy`, `jsonFirstNetworkSnapshotConsumerArrayCapPolicy`, `jsonFirstNetworkSnapshotConsumerRecentRootHorizon`, `jsonFirstNetworkSnapshotConsumerCutoffReason`, `jsonFirstNetworkSnapshotConsumerTraversalMetricArtifact`, `jsonFirstNetworkSnapshotConsumerTraversalFixtureProvenance`, or `jsonFirstNetworkSnapshotConsumerTraversalDurationReport`/);
});

test('active goal completion audit records JSON-first network snapshot consumer effect boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first network snapshot consumer effect boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-network-snapshot-consumer-effect-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /consumer effect-boundary proof/);
  assert.match(source, /2 consumer effect-boundary source files/);
  assert.match(source, /1 injector channel info response postMessage site/);
  assert.match(source, /0 injector channel info storage\/message\/persist\/stamp\/rerun sites/);
  assert.match(source, /1 injector collaborator info response postMessage site/);
  assert.match(source, /2 injector collaborator cache update callsites inside request handling/);
  assert.match(source, /1 content bridge channel response pending resolve site/);
  assert.match(source, /0 content bridge channel response persist\/stamp\/rerun sites/);
  assert.match(source, /1 content bridge collaborator response pending resolve site/);
  assert.match(source, /1 content bridge collaborator response `applyResolvedCollaborators` site/);
  assert.match(source, /1 content bridge update video-channel map persist site/);
  assert.match(source, /2 content bridge update video-channel map stamp sites/);
  assert.match(source, /2 content bridge update video-channel map DOM fallback mentions/);
  assert.match(source, /2 content bridge prefetch snapshot lookup sites/);
  assert.match(source, /3 content bridge prefetch persist video-channel map sites/);
  assert.match(source, /1 content bridge search wrapper positive cache write/);
  assert.match(source, /2 content bridge search wrapper negative cache writes/);
  assert.match(source, /1 runtime channel request no-cache fixture/);
  assert.match(source, /1 runtime collaborator local-cache fixture/);
  assert.match(source, /injector channel-info requests emit `FilterTube_ChannelInfoResponse` for matching snapshot evidence but do not retain that result after the snapshot root is removed/);
  assert.match(source, /injector collaborator-info requests can emit `FilterTube_CollaboratorInfoResponse` from a later injector-local collaborator cache read after the snapshot root is removed/);
  assert.match(source, /response effect decisions/);
  assert.match(source, /cache effect reports/);
  assert.match(source, /map-write effect reports/);
  assert.match(source, /DOM stamp reports/);
  assert.match(source, /DOM rerun reports/);
  assert.match(source, /target scope reports/);
  assert.match(source, /allowed\/blocked effect records/);
  assert.match(source, /metric artifacts/);
  assert.match(source, /`jsonFirstNetworkSnapshotConsumerEffectBoundaryContract`, `jsonFirstNetworkSnapshotConsumerEffectDecision`, `jsonFirstNetworkSnapshotConsumerResponseEffectReport`, `jsonFirstNetworkSnapshotConsumerCacheEffectReport`, `jsonFirstNetworkSnapshotConsumerMapWriteEffectReport`, `jsonFirstNetworkSnapshotConsumerDomStampEffectReport`, `jsonFirstNetworkSnapshotConsumerDomRerunEffectReport`, `jsonFirstNetworkSnapshotConsumerTargetScopeReport`, `jsonFirstNetworkSnapshotConsumerEffectFixtureProvenance`, or `jsonFirstNetworkSnapshotConsumerEffectMetricArtifact`/);
});

test('active goal completion audit records JSON-first network snapshot consumer request transport without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first network snapshot consumer request transport addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_REQUEST_TRANSPORT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-network-snapshot-consumer-request-transport-current-behavior\.test\.mjs/);
  assert.match(source, /consumer request-transport proof/);
  assert.match(source, /2 consumer request-transport source files/);
  assert.match(source, /2 pending snapshot request maps/);
  assert.match(source, /2 snapshot request id counters/);
  assert.match(source, /2 snapshot request functions/);
  assert.match(source, /2 request timeout constants at 2000 ms/);
  assert.match(source, /2 request retry delays at 250 ms/);
  assert.match(source, /2 request retry delays at 1000 ms/);
  assert.match(source, /2 request postMessage wildcard targets/);
  assert.match(source, /1 injector same-window request listener gate/);
  assert.match(source, /2 injector content_bridge request source gates/);
  assert.match(source, /2 injector response postMessage wildcard targets/);
  assert.match(source, /2 bridge response clearTimeout sites/);
  assert.match(source, /2 bridge response pending delete sites/);
  assert.match(source, /2 bridge response pending resolve sites/);
  assert.match(source, /1 runtime channel retry and timeout fixture/);
  assert.match(source, /1 runtime channel response clear fixture/);
  assert.match(source, /1 runtime collaborator retry and timeout fixture/);
  assert.match(source, /1 runtime unsolicited collaborator response fixture/);
  assert.match(source, /channel requests post immediately, retry at 250 ms and 1000 ms while pending, then resolve `null` at 2000 ms/);
  assert.match(source, /channel responses clear timeout, delete pending state, resolve by request id, and suppress later retries/);
  assert.match(source, /collaborator requests follow the same retry\/timeout shape with expected collaborator fields/);
  assert.match(source, /unsolicited collaborator responses with non-empty collaborator arrays can still call `applyResolvedCollaborators`/);
  assert.match(source, /request transport decisions/);
  assert.match(source, /request nonces/);
  assert.match(source, /pending request registries/);
  assert.match(source, /retry policy/);
  assert.match(source, /timeout policy/);
  assert.match(source, /response correlation reports/);
  assert.match(source, /sender capability/);
  assert.match(source, /metric artifacts/);
  assert.match(source, /`jsonFirstNetworkSnapshotConsumerRequestTransportContract`, `jsonFirstNetworkSnapshotConsumerRequestTransportDecision`, `jsonFirstNetworkSnapshotConsumerRequestNonce`, `jsonFirstNetworkSnapshotConsumerPendingRequestRegistry`, `jsonFirstNetworkSnapshotConsumerRetryPolicy`, `jsonFirstNetworkSnapshotConsumerTimeoutPolicy`, `jsonFirstNetworkSnapshotConsumerResponseCorrelationReport`, `jsonFirstNetworkSnapshotConsumerTransportSenderCapability`, `jsonFirstNetworkSnapshotConsumerRequestFixtureProvenance`, or `jsonFirstNetworkSnapshotConsumerRequestMetricArtifact`/);
});

test('active goal completion audit records JSON-first network snapshot consumer application without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first network snapshot consumer application addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_APPLICATION_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-network-snapshot-consumer-application-current-behavior\.test\.mjs/);
  assert.match(source, /consumer application proof/);
  assert.match(source, /1 consumer application source file/);
  assert.match(source, /1 resolved collaborator cache map/);
  assert.match(source, /1 active collaboration menu map/);
  assert.match(source, /7 `applyResolvedCollaborators` token occurrences/);
  assert.match(source, /6 `applyResolvedCollaborators` callsites outside declaration/);
  assert.match(source, /4 `refreshActiveCollaborationMenu` token occurrences/);
  assert.match(source, /3 `refreshActiveCollaborationMenu` callsites outside declaration/);
  assert.match(source, /5 resolved collaborator map set callsites/);
  assert.match(source, /8 resolved collaborator map get callsites/);
  assert.match(source, /1 direct card collaborator serialized write site/);
  assert.match(source, /1 direct card collaborator source-label write site/);
  assert.match(source, /1 direct card collaborator timestamp write site/);
  assert.match(source, /1 direct card resolved-state write site/);
  assert.match(source, /1 direct card pending-dialog cleanup site/);
  assert.match(source, /1 direct card requested cleanup site/);
  assert.match(source, /1 active menu refresh callsite/);
  assert.match(source, /1 playlist fallback refresh callsite/);
  assert.match(source, /1 zero-delay DOM fallback rerun timer/);
  assert.match(source, /5 runtime application fixtures/);
  assert.match(source, /matching cards are stamped, pending collaborator attributes are cleared, the resolved map is updated, playlist fallback state is refreshed, and DOM fallback is scheduled/);
  assert.match(source, /no-card collaborator application can still update the resolved map and schedule follow-on work while returning `false`/);
  assert.match(source, /a richer global resolved cache blocks lower-quality incoming collaborators without `force`/);
  assert.match(source, /`force: true` bypasses the global richer-cache gate but does not overwrite a richer per-card cache/);
  assert.match(source, /active menu refresh can prefer a richer resolved-map roster over incoming and card-cache rosters/);
  assert.match(source, /application decisions/);
  assert.match(source, /resolved-cache reports/);
  assert.match(source, /DOM stamp reports/);
  assert.match(source, /active-menu refresh reports/);
  assert.match(source, /playlist popover refresh reports/);
  assert.match(source, /DOM fallback rerun budgets/);
  assert.match(source, /cache downgrade policies/);
  assert.match(source, /card-stamp correlation reports/);
  assert.match(source, /metric artifacts/);
  assert.match(source, /`jsonFirstNetworkSnapshotConsumerApplicationContract`, `jsonFirstNetworkSnapshotConsumerApplicationDecision`, `jsonFirstNetworkSnapshotConsumerResolvedCacheReport`, `jsonFirstNetworkSnapshotConsumerDomStampReport`, `jsonFirstNetworkSnapshotConsumerActiveMenuRefreshReport`, `jsonFirstNetworkSnapshotConsumerPlaylistPopoverRefreshReport`, `jsonFirstNetworkSnapshotConsumerDomFallbackRerunBudget`, `jsonFirstNetworkSnapshotConsumerCacheDowngradePolicy`, `jsonFirstNetworkSnapshotConsumerCardStampCorrelationReport`, or `jsonFirstNetworkSnapshotConsumerApplicationMetricArtifact`/);
});

test('active goal completion audit records JSON-first network snapshot consumer stale cache cleanup without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first network snapshot consumer stale cache cleanup addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_STALE_CACHE_CLEANUP_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-network-snapshot-consumer-stale-cache-cleanup-current-behavior\.test\.mjs/);
  assert.match(source, /stale-cache cleanup proof/);
  assert.match(source, /1 consumer stale-cache cleanup source file/);
  assert.match(source, /6 stale-cache cleanup functions/);
  assert.match(source, /71 reset block lines/);
  assert.match(source, /34 reset removeAttribute callsites/);
  assert.match(source, /1 reset setAttribute callsite/);
  assert.match(source, /2 reset classList\.remove callsites/);
  assert.match(source, /2 reset style\.removeProperty callsites/);
  assert.match(source, /33 should-stamp block lines/);
  assert.match(source, /62 validated-cache block lines/);
  assert.match(source, /24 validated-cache removeAttribute callsites/);
  assert.match(source, /13 collaborator-only cleanup block lines/);
  assert.match(source, /7 collaborator-only cleanup removeAttribute callsites/);
  assert.match(source, /2 card video-id removeAttribute literal sites/);
  assert.match(source, /3 card video-id setAttribute literal sites/);
  assert.match(source, /8 reset token occurrences/);
  assert.match(source, /2 card-link proof token occurrences/);
  assert.match(source, /9 `extractVideoIdFromCard\(card\)` token occurrences/);
  assert.match(source, /1 resolved-map stale check site/);
  assert.match(source, /7 runtime stale-cache cleanup fixtures/);
  assert.match(source, /broad stale reset clears collaborator, hidden, style, wrapper, and channel metadata before stamping the supplied id/);
  assert.match(source, /live-id mismatch rejects stale stamping and cleans to the live id/);
  assert.match(source, /stamped-id mismatch rejects the write but retains old collaborator cache/);
  assert.match(source, /no-live validation clears collaborator fields but retains cached video id/);
  assert.match(source, /live\/cached mismatch clears many fields but retains collaborator source\/timestamp markers and global resolved-map entries/);
  assert.match(source, /matched validation returns sanitized cache/);
  assert.match(source, /collaborator-only cleanup leaves video id and hidden state untouched/);
  assert.match(source, /stale-cache cleanup decisions/);
  assert.match(source, /card video-id evidence reports/);
  assert.match(source, /stale marker reports/);
  assert.match(source, /global cache retention policies/);
  assert.match(source, /stamp rejection cleanup policies/);
  assert.match(source, /no-live cache retention policies/);
  assert.match(source, /recycled-card restore proof/);
  assert.match(source, /metric artifacts/);
  assert.match(source, /`jsonFirstNetworkSnapshotConsumerStaleCacheCleanupContract`, `jsonFirstNetworkSnapshotConsumerStaleCacheDecision`, `jsonFirstNetworkSnapshotConsumerCardVideoIdEvidenceReport`, `jsonFirstNetworkSnapshotConsumerStaleMarkerReport`, `jsonFirstNetworkSnapshotConsumerGlobalCacheRetentionPolicy`, `jsonFirstNetworkSnapshotConsumerStampRejectionCleanupPolicy`, `jsonFirstNetworkSnapshotConsumerNoLiveCacheRetentionPolicy`, `jsonFirstNetworkSnapshotConsumerRecycledCardRestoreProof`, `jsonFirstNetworkSnapshotConsumerStaleCleanupFixtureProvenance`, or `jsonFirstNetworkSnapshotConsumerStaleCleanupMetricArtifact`/);
});

test('active goal completion audit records JSON-first network snapshot consumer card video-id evidence without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first network snapshot consumer card video-id evidence addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_CARD_VIDEO_ID_EVIDENCE_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-network-snapshot-consumer-card-video-id-evidence-current-behavior\.test\.mjs/);
  assert.match(source, /video-id evidence proof/);
  assert.match(source, /2 consumer card video-id evidence source files/);
  assert.match(source, /148 ensureVideoIdForCard block lines/);
  assert.match(source, /50 ensure removeAttribute callsites/);
  assert.match(source, /1 ensure setAttribute callsite/);
  assert.match(source, /2 ensure classList\.remove callsites/);
  assert.match(source, /2 ensure style\.display references/);
  assert.match(source, /8 ensure hasAttribute callsites/);
  assert.match(source, /20 ensure high-risk tag comparisons/);
  assert.match(source, /156 extractVideoIdFromCard block lines/);
  assert.match(source, /6 extractor querySelector callsites/);
  assert.match(source, /1 extractor querySelectorAll callsite/);
  assert.match(source, /5 extractor href regex match callsites/);
  assert.match(source, /1 extractor scanDataForVideoId callsite/);
  assert.match(source, /14 cardContainsVideoIdLink block lines/);
  assert.match(source, /4 card-link selector templates/);
  assert.match(source, /33 should-stamp block lines/);
  assert.match(source, /4 should-stamp reset callsites/);
  assert.match(source, /21 content_bridge ensureVideoIdForCard token occurrences/);
  assert.match(source, /19 content_bridge extractVideoIdFromCard token occurrences/);
  assert.match(source, /32 all-product ensureVideoIdForCard token occurrences/);
  assert.match(source, /29 all-product extractVideoIdFromCard token occurrences/);
  assert.match(source, /8 content_bridge video-id setAttribute literal sites/);
  assert.match(source, /3 content_bridge video-id removeAttribute literal sites/);
  assert.match(source, /5 runtime video-id evidence fixtures/);
  assert.match(source, /href evidence can beat stale stamped video id/);
  assert.match(source, /inline display remains hidden/);
  assert.match(source, /cached mismatch restores display but retains collaborator payload\/source\/timestamp markers/);
  assert.match(source, /lower-risk cached ids can fast-return without anchor scans or stale cleanup/);
  assert.match(source, /link proof can stamp a requested id/);
  assert.match(source, /video-id evidence reports/);
  assert.match(source, /evidence contracts/);
  assert.match(source, /live-id provenance reports/);
  assert.match(source, /href proof policies/);
  assert.match(source, /stamped-id trust policies/);
  assert.match(source, /ensure-video-id side-effect reports/);
  assert.match(source, /fast-return policies/);
  assert.match(source, /restore proof/);
  assert.match(source, /metric artifacts/);
  assert.match(source, /`jsonFirstNetworkSnapshotConsumerCardVideoIdEvidenceReport`, `jsonFirstNetworkSnapshotConsumerCardVideoIdEvidenceContract`, `jsonFirstNetworkSnapshotConsumerCardVideoIdEvidenceDecision`, `jsonFirstNetworkSnapshotConsumerLiveVideoIdProvenanceReport`, `jsonFirstNetworkSnapshotConsumerHrefProofPolicy`, `jsonFirstNetworkSnapshotConsumerStampedVideoIdTrustPolicy`, `jsonFirstNetworkSnapshotConsumerEnsureVideoIdSideEffectReport`, `jsonFirstNetworkSnapshotConsumerVideoIdFastReturnPolicy`, `jsonFirstNetworkSnapshotConsumerVideoIdRestoreProof`, `jsonFirstNetworkSnapshotConsumerVideoIdEvidenceFixtureProvenance`, or `jsonFirstNetworkSnapshotConsumerVideoIdEvidenceMetricArtifact`/);
});

test('active goal completion audit records JSON-first network snapshot consumer stale marker matrix without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first network snapshot consumer stale marker matrix addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_STALE_MARKER_MATRIX_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-network-snapshot-consumer-stale-marker-matrix-current-behavior\.test\.mjs/);
  assert.match(source, /stale marker matrix proof/);
  assert.match(source, /3 consumer stale-marker matrix source files/);
  assert.match(source, /6 cleanup\/evidence blocks/);
  assert.match(source, /31 combined unique stale marker literals/);
  assert.match(source, /148 ensureVideoIdForCard marker block lines/);
  assert.match(source, /31 ensure marker literals/);
  assert.match(source, /50 ensure removeAttribute callsites/);
  assert.match(source, /71 resetCardIdentityIfStale marker block lines/);
  assert.match(source, /23 reset marker literals/);
  assert.match(source, /34 reset removeAttribute callsites/);
  assert.match(source, /62 validated-cache marker block lines/);
  assert.match(source, /19 validated-cache marker literals/);
  assert.match(source, /24 validated-cache removeAttribute callsites/);
  assert.match(source, /13 collaborator-only marker block lines/);
  assert.match(source, /7 collaborator-only marker literals/);
  assert.match(source, /7 collaborator-only removeAttribute callsites/);
  assert.match(source, /47 isExplicitlyHiddenByFilterTube marker block lines/);
  assert.match(source, /13 fallback hidden marker literals/);
  assert.match(source, /7 fallback hidden removeAttribute callsites/);
  assert.match(source, /152 DOM fallback processed-loop marker block lines/);
  assert.match(source, /17 processed-loop marker literals/);
  assert.match(source, /27 processed-loop removeAttribute callsites/);
  assert.match(source, /36 content_bridge video-id token occurrences/);
  assert.match(source, /5 dom_extractors video-id token occurrences/);
  assert.match(source, /5 dom_fallback video-id token occurrences/);
  assert.match(source, /5 runtime stale-marker matrix fixtures/);
  assert.match(source, /extractor no-cached high-risk cleanup clears stale markers but can leave inline display hidden/);
  assert.match(source, /extractor cached-mismatch cleanup restores display but retains collaborator marker family/);
  assert.match(source, /bridge reset cleanup leaves last-mode and whitelist-pending markers/);
  assert.match(source, /validated-cache mismatch leaves source\/timestamp, hidden, custom, and processed markers/);
  assert.match(source, /DOM fallback stale-hidden cleanup restores visibility only when explicit hide reason markers do not force an early return/);
  assert.match(source, /stale marker reports/);
  assert.match(source, /stale marker matrices/);
  assert.match(source, /cleanup decisions/);
  assert.match(source, /retention policies/);
  assert.match(source, /hidden-marker restore proof/);
  assert.match(source, /collaborator-marker retention policies/);
  assert.match(source, /processed-marker policies/);
  assert.match(source, /blocked-marker policies/);
  assert.match(source, /fixture provenance/);
  assert.match(source, /metric artifacts/);
  assert.match(source, /`jsonFirstNetworkSnapshotConsumerStaleMarkerReport`, `jsonFirstNetworkSnapshotConsumerStaleMarkerMatrix`, `jsonFirstNetworkSnapshotConsumerStaleMarkerCleanupDecision`, `jsonFirstNetworkSnapshotConsumerStaleMarkerRetentionPolicy`, `jsonFirstNetworkSnapshotConsumerHiddenMarkerRestoreProof`, `jsonFirstNetworkSnapshotConsumerCollaboratorMarkerRetentionPolicy`, `jsonFirstNetworkSnapshotConsumerProcessedMarkerPolicy`, `jsonFirstNetworkSnapshotConsumerBlockedMarkerPolicy`, `jsonFirstNetworkSnapshotConsumerStaleMarkerFixtureProvenance`, or `jsonFirstNetworkSnapshotConsumerStaleMarkerMetricArtifact`/);
});

test('active goal completion audit records JSON-first video meta DOM rerun without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first video meta DOM rerun addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_DOM_RERUN_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-video-meta-dom-rerun-current-behavior\.test\.mjs/);
  assert.match(source, /video-meta rerun proof/);
  assert.match(source, /3 video-meta DOM rerun source files/);
  assert.match(source, /8 source\/effect blocks/);
  assert.match(source, /62 persistVideoMetaMapping block lines/);
  assert.match(source, /10 persist block videoMetaMap tokens/);
  assert.match(source, /1 persist runtime sendMessage callsite/);
  assert.match(source, /16 rerun schedule block lines/);
  assert.match(source, /550 ms content DOM rerun debounce/);
  assert.match(source, /1 rerun setTimeout callsite/);
  assert.match(source, /1 rerun clearTimeout callsite/);
  assert.match(source, /57 touchDomForVideoMetaUpdate block lines/);
  assert.match(source, /3 touch removeAttribute callsites/);
  assert.match(source, /1 touch setAttribute callsite/);
  assert.match(source, /2 touch querySelectorAll callsites/);
  assert.match(source, /101 watch meta fetch queue block lines/);
  assert.match(source, /3 watch meta fetch concurrency limit/);
  assert.match(source, /60000 ms fetch cooldown/);
  assert.match(source, /98 fetchVideoMetaFromWatchUrl block lines/);
  assert.match(source, /1 watch fetch callsite/);
  assert.match(source, /1 watch JSON\.parse callsite/);
  assert.match(source, /26 FilterTube_UpdateVideoMetaMap branch lines/);
  assert.match(source, /39 DOM fallback category videoMetaMap block lines/);
  assert.match(source, /2 category-block scheduleVideoMetaFetch tokens/);
  assert.match(source, /41 background enqueueVideoMetaMapUpdate block lines/);
  assert.match(source, /75 ms background videoMetaMap flush debounce/);
  assert.match(source, /40 background videoMetaMap tokens/);
  assert.match(source, /5 runtime video-meta DOM rerun fixtures/);
  assert.match(source, /persistence stores and forwards only cleaned non-empty metadata rows/);
  assert.match(source, /targeted DOM touch clears duration, processed, last-processed, and channel markers/);
  assert.match(source, /retaining hidden, collaborator, blocked, and whitelist-pending markers/);
  assert.match(source, /rerun scheduling replaces a pending timer and calls `applyDOMFallback\(null\)` after 550 ms/);
  assert.match(source, /`FilterTube_UpdateVideoMetaMap` schedules a rerun only after a DOM touch/);
  assert.match(source, /fetch queue skips satisfied metadata, queues missing requested fields once, rejects invalid ids/);
  assert.match(source, /DOM rerun contracts/);
  assert.match(source, /DOM touch reports/);
  assert.match(source, /fetch budgets/);
  assert.match(source, /message effect reports/);
  assert.match(source, /map persistence policies/);
  assert.match(source, /timer registries/);
  assert.match(source, /category fetch policies/);
  assert.match(source, /background flush authority/);
  assert.match(source, /`jsonFirstVideoMetaDomRerunContract`, `jsonFirstVideoMetaDomTouchReport`, `jsonFirstVideoMetaFetchBudget`, `jsonFirstVideoMetaMessageEffectReport`, `jsonFirstVideoMetaMapPersistencePolicy`, `jsonFirstVideoMetaDomRerunTimerRegistry`, `jsonFirstVideoMetaFixtureProvenance`, `jsonFirstVideoMetaMetricArtifact`, `jsonFirstVideoMetaCategoryFetchPolicy`, or `jsonFirstVideoMetaBackgroundFlushAuthority`/);
});

test('active goal completion audit records JSON-first video meta background storage without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first video meta background storage addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_BACKGROUND_STORAGE_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-video-meta-background-storage-current-behavior\.test\.mjs/);
  assert.match(source, /background storage proof/);
  assert.match(source, /1 video-meta background storage source file/);
  assert.match(source, /8 source\/effect blocks/);
  assert.match(source, /19 videoMetaMap declaration block lines/);
  assert.match(source, /655 declaration block bytes/);
  assert.match(source, /19 ensureVideoMetaMapCache block lines/);
  assert.match(source, /15 ensure videoMetaMap tokens/);
  assert.match(source, /1 ensure storageGet callsite/);
  assert.match(source, /13 enforceVideoMetaMapCap block lines/);
  assert.match(source, /2000 maximum videoMetaMap entries/);
  assert.match(source, /500 eviction count/);
  assert.match(source, /21 flushVideoMetaMapUpdates block lines/);
  assert.match(source, /3 flush pending tokens/);
  assert.match(source, /1 flush storage set callsite/);
  assert.match(source, /7 scheduleVideoMetaMapFlush block lines/);
  assert.match(source, /1 schedule setTimeout callsite/);
  assert.match(source, /75 ms background flush debounce/);
  assert.match(source, /41 enqueueVideoMetaMapUpdate block lines/);
  assert.match(source, /11 enqueue videoMetaMap tokens/);
  assert.match(source, /6 enqueue compiledSettingsCache tokens/);
  assert.match(source, /16 updateVideoMetaMap branch lines/);
  assert.match(source, /1 branch enqueue callsite/);
  assert.match(source, /15 compiler pass-through block lines/);
  assert.match(source, /40 background videoMetaMap tokens/);
  assert.match(source, /5 pendingVideoMetaMapUpdates tokens/);
  assert.match(source, /4 videoMetaMapFlushTimer tokens/);
  assert.match(source, /38 compiledSettingsCache tokens/);
  assert.match(source, /5 runtime background video-meta storage fixtures/);
  assert.match(source, /cache load shallow-copies storage once and recovers to an empty object after storage errors/);
  assert.match(source, /enqueue cleans metadata, drops empty rows, patches loaded cache and cached Main\/Kids compiled settings/);
  assert.match(source, /flush merges pending updates, clears pending writes, enforces cap, and writes storage/);
  assert.match(source, /scheduler keeps one timer until the handler clears it/);
  assert.match(source, /array-form messages can carry category metadata while the legacy single-video request shape omits category/);
  assert.match(source, /storage contracts/);
  assert.match(source, /flush reports/);
  assert.match(source, /compiled-cache patch reports/);
  assert.match(source, /message schemas/);
  assert.match(source, /revision policies/);
  assert.match(source, /eviction reports/);
  assert.match(source, /content rerun parity/);
  assert.match(source, /`jsonFirstVideoMetaBackgroundStorageContract`, `jsonFirstVideoMetaBackgroundFlushReport`, `jsonFirstVideoMetaCompiledCachePatchReport`, `jsonFirstVideoMetaBackgroundMessageSchema`, `jsonFirstVideoMetaBackgroundRevisionPolicy`, `jsonFirstVideoMetaEvictionPolicyReport`, `jsonFirstVideoMetaStorageErrorReport`, `jsonFirstVideoMetaBackgroundFixtureProvenance`, `jsonFirstVideoMetaBackgroundMetricArtifact`, or `jsonFirstVideoMetaBackgroundContentRerunParity`/);
});

test('active goal completion audit records JSON-first video meta category parity without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first video meta category parity addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_CATEGORY_PARITY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-video-meta-category-parity-current-behavior\.test\.mjs/);
  assert.match(source, /JSON\/DOM category decision parity proof/);
  assert.match(source, /3 video-meta category parity source files/);
  assert.match(source, /57 filter_logic category method block lines/);
  assert.match(source, /2683 filter_logic category method block bytes/);
  assert.match(source, /3 filter_logic category method videoMetaMap tokens/);
  assert.match(source, /2 filter_logic scheduleVideoMetaFetch tokens/);
  assert.match(source, /9 filter_logic category tokens/);
  assert.match(source, /19 filter_logic category renderer allowlist entries/);
  assert.match(source, /12 filter_logic content\/category call block lines/);
  assert.match(source, /39 DOM fallback category block lines/);
  assert.match(source, /2136 DOM fallback category block bytes/);
  assert.match(source, /3 DOM fallback videoMetaMap tokens/);
  assert.match(source, /2 DOM fallback scheduleVideoMetaFetch tokens/);
  assert.match(source, /10 DOM fallback category tokens/);
  assert.match(source, /2 DOM fallback pendingCategory tokens/);
  assert.match(source, /75 DOM fallback pending metadata block lines/);
  assert.match(source, /4103 DOM fallback pending metadata block bytes/);
  assert.match(source, /2 DOM fallback pending metadata setTimeout callsites/);
  assert.match(source, /6 DOM fallback pending category attribute tokens/);
  assert.match(source, /8 DOM fallback category marker block lines/);
  assert.match(source, /333 DOM fallback category marker block bytes/);
  assert.match(source, /2 DOM fallback category marker attribute tokens/);
  assert.match(source, /94 content_bridge scheduleVideoMetaFetch function lines/);
  assert.match(source, /3689 content_bridge scheduleVideoMetaFetch function bytes/);
  assert.match(source, /4 content_bridge scheduleVideoMetaFetch category tokens/);
  assert.match(source, /4 runtime video-meta category parity fixtures/);
  assert.match(source, /JSON engine hides selected categories in block mode/);
  assert.match(source, /schedules category fetch while returning no hide decision when category metadata is missing/);
  assert.match(source, /DOM fallback uses the same present-category block\/allow decision/);
  assert.match(source, /adds pending category state in allow mode or on home\/search routes/);
  assert.match(source, /schedules an 8120 ms recheck/);
  assert.match(source, /`data-filtertube-hidden-by-category` is written only when category decision and final hide both hold/);
  assert.match(source, /category parity contracts/);
  assert.match(source, /JSON\/DOM category decision reports/);
  assert.match(source, /no-work budgets/);
  assert.match(source, /allow\/block parity reports/);
  assert.match(source, /`jsonFirstVideoMetaCategoryParityContract`, `jsonFirstVideoMetaJsonDomCategoryDecisionReport`, `jsonFirstVideoMetaCategoryPendingPolicy`, `jsonFirstVideoMetaCategoryMarkerReport`, `jsonFirstVideoMetaCategoryFetchPolicy`, `jsonFirstVideoMetaCategoryNoWorkBudget`, `jsonFirstVideoMetaCategoryFixtureProvenance`, `jsonFirstVideoMetaCategoryMetricArtifact`, `jsonFirstVideoMetaCategoryAllowBlockParity`, or `jsonFirstVideoMetaCategoryRevisionPolicy`/);
});

test('active goal completion audit records quick-block/block-menu affordance boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Quick-block\/block-menu affordance boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_QUICK_BLOCK_BLOCK_MENU_AFFORDANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/quick-block-block-menu-affordance-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /dedicated affordance-control proof/);
  assert.match(source, /7 quick-block\/block-menu affordance boundary source files/);
  assert.match(source, /16 quick-block\/block-menu affordance source\/effect blocks/);
  assert.match(source, /10 catalog feed affordance controls block lines/);
  assert.match(source, /488 catalog feed affordance controls block bytes/);
  assert.match(source, /2 settings_shared affordance compile block lines/);
  assert.match(source, /126 settings_shared affordance compile block bytes/);
  assert.match(source, /33 state manager valid setting keys block lines/);
  assert.match(source, /1063 state manager valid setting keys block bytes/);
  assert.match(source, /41 state manager external reload keys block lines/);
  assert.match(source, /1604 state manager external reload keys block bytes/);
  assert.match(source, /44 quick block card selectors block lines/);
  assert.match(source, /1519 quick block card selectors block bytes/);
  assert.match(source, /10 quick block enabled gate block lines/);
  assert.match(source, /296 quick block enabled gate block bytes/);
  assert.match(source, /209 quick block setup lifecycle block lines/);
  assert.match(source, /8699 quick block setup lifecycle block bytes/);
  assert.match(source, /14 normal menu injection gate block lines/);
  assert.match(source, /411 normal menu injection gate block bytes/);
  assert.match(source, /31 fallback menu button creation block lines/);
  assert.match(source, /1533 fallback menu button creation block bytes/);
  assert.match(source, /127 fallback menu scan lifecycle block lines/);
  assert.match(source, /4115 fallback menu scan lifecycle block bytes/);
  assert.match(source, /104 fallback popover open block lines/);
  assert.match(source, /3500 fallback popover open block bytes/);
  assert.match(source, /212 fallback perform block action block lines/);
  assert.match(source, /9930 fallback perform block action block bytes/);
  assert.match(source, /43 quick block selector entries/);
  assert.match(source, /11 quick block setup addEventListener callsites/);
  assert.match(source, /1 quick block setup MutationObserver callsite/);
  assert.match(source, /4 fallback menu scan addEventListener callsites/);
  assert.match(source, /18 fallback menu scan selector literals/);
  assert.match(source, /background compiles both but background storage-change invalidation omits both/);
  assert.match(source, /quick-block lifecycle setup installs listener\/observer\/timer\/frame work/);
  assert.match(source, /fallback actions can hide rows, mutate block state, refresh settings, and force DOM fallback reruns/);
  assert.match(source, /first-class affordance authority gates/);
  assert.match(source, /`contentAffordanceControlsContract`, `quickBlockMenuAffordanceDecisionReport`, `quickBlockLifecycleBudget`, `blockMenuActionGateReport`, `fallbackMenuActionGateParityReport`, `affordanceSettingsCacheInvalidationReport`, `quickBlockDomSelectorInventoryPolicy`, `fallbackMenuFalseHideRestoreReport`, `affordanceRoutePausePolicy`, `affordanceFixtureProvenance`, or `affordanceMetricArtifact`/);
});

test('active goal completion audit records current-source rule mutation action-layer rerun without declaring completion', () => {
  const source = doc();

  assert.match(source, /2026-05-30 rule mutation and action-layer packet current-source rerun/);
  assert.match(source, /node --test --test-reporter=spec tests\/runtime\/rule-mutation-entrypoint-authority-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/p0-rule-mutation-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/fallback-menu-action-gate-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/quick-block-default-migration-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/quick-block-block-menu-affordance-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-bridge-menu-injection-action-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-bridge-menu-blocked-state-list-shape-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-bridge-menu-action-list-target-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/background-add-filtered-channel-list-target-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/filter-all-toggle-list-target-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/main-filter-all-comments-scope-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/add-filtered-channel-filter-all-comments-default-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/kids-comments-filter-all-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/batch-whitelist-import-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/list-mode-transition-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/single-channel-rule-mutation-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/profile-management-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-bridge-collaborator-identity-promotion-handoff-current-behavior\.test\.mjs/);
  assert.match(source, /passed 192\/192 tests/);
  assert.match(source, /rule mutation entrypoints/);
  assert.match(source, /P0 mutation blockers/);
  assert.match(source, /fallback-menu action gates/);
  assert.match(source, /quick-block default migration and hover lifecycle/);
  assert.match(source, /quick-block\/block-menu affordance gates/);
  assert.match(source, /menu blocked-state list-shape/);
  assert.match(source, /menu action list-target behavior/);
  assert.match(source, /background `addFilteredChannel` list-target behavior/);
  assert.match(source, /Filter All list-target behavior/);
  assert.match(source, /Main and Kids comment-scope behavior/);
  assert.match(source, /add-time Filter All comments defaults/);
  assert.match(source, /keyword-comments migration/);
  assert.match(source, /batch whitelist import persistence/);
  assert.match(source, /list-mode transition persistence/);
  assert.match(source, /single-channel rule mutation persistence/);
  assert.match(source, /profile-management persistence/);
  assert.match(source, /collaborator identity promotion handoff/);
  assert.match(source, /Runtime behavior changed by this rerun: no/);
  assert.match(source, /Rule mutation authority, sender\/session policy, list-target authority,\s+fallback-menu action parity, quick-block lifecycle\/action budgets, Filter All\s+comments provenance, whitelist import mode authority, list-mode transition copy\s+policy, profile revision authority, collaborator route\/surface parity,\s+installed-tab parity, JSON-first promotion, whitelist\/cache optimization,\s+release\/public-claim use, and `update_goal\(status='complete'\)` remain\s+`NO-GO`/);
});

test('active goal completion audit records current-source collaborator menu YTM native rerun without declaring completion', () => {
  const source = doc();

  assert.match(source, /2026-05-30 collaborator\/menu\/YTM\/native packet current-source rerun/);
  assert.match(source, /node --test --test-reporter=spec tests\/runtime\/collab-dialog-lifecycle-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/collab-dialog-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-menu-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/fallback-menu-action-gate-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-bridge-menu-injection-action-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-bridge-menu-blocked-state-list-shape-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-bridge-menu-action-list-target-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/quick-block-block-menu-affordance-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-bridge-collaborator-enrichment-retry-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-bridge-collaborator-metadata-extraction-side-effect-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-bridge-collaborator-identity-promotion-handoff-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-bridge-collaborator-main-world-merge-mutation-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/main-collab-resolved-search-card-dialog-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/main-watch-tmp-playlist-collab-dialog-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/ytm-show-sheet-collaborator-roster-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/ytm-show-sheet-injector-filter-logic-parity-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/ytm-show-sheet-enrichment-handoff-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/ytm-logs-playlist-bottom-sheet-stale-identity-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/native-dropdown-close-state-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/native-overlay-fullscreen-quiet-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /passed 162\/162 tests/);
  assert.match(source, /collaborator dialog lifecycle and method semantics/);
  assert.match(source, /content menu method semantics/);
  assert.match(source, /fallback-menu action gates/);
  assert.match(source, /menu injection\/action\/list-target and blocked-state behavior/);
  assert.match(source, /quick-block\/block-menu affordance behavior/);
  assert.match(source, /collaborator enrichment retry/);
  assert.match(source, /collaborator metadata extraction/);
  assert.match(source, /collaborator identity promotion/);
  assert.match(source, /collaborator main-world merge mutation/);
  assert.match(source, /Main resolved-collab and TMP watch playlist fixtures/);
  assert.match(source, /YTM showSheet roster\/parity\/enrichment gaps/);
  assert.match(source, /YTM stale bottom-sheet identity/);
  assert.match(source, /native dropdown close-state behavior/);
  assert.match(source, /native overlay\/fullscreen quiet-mode boundaries/);
  assert.match(source, /Runtime behavior changed by this rerun: no/);
  assert.match(source, /Collaborator grammar authority, broader non-Topic collaborator provenance,\s+YTM showSheet filter authority, menu\/action parity authority, quick-block full\s+parity, stale open-tab cache cleanup, installed visible-tab byte parity,\s+native dropdown\/menu timing authority, JSON-first promotion, whitelist\/cache\s+optimization, release\/public-claim use, and `update_goal\(status='complete'\)`\s+remain `NO-GO`/);
});

test('active goal completion audit records current-source lifecycle observer listener timer rerun without declaring completion', () => {
  const source = doc();

  assert.match(source, /2026-05-30 lifecycle observer\/listener\/timer packet current-source rerun/);
  assert.match(source, /node --test --test-reporter=spec tests\/runtime\/p0-lifecycle-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/lifecycle-source-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/lifecycle-instance-register-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/lifecycle-owner-matrix-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/repo-lifecycle-primitive-coverage-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/lifecycle-effect-budget-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/page-runtime-lifecycle-authority-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/lifecycle-teardown-decision-register-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/dom-fallback-lifecycle-callback-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-bridge-lifecycle-callback-semantic-register-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/bridge-settings-listener-timer-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-bridge-startup-timing-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/seed-page-global-patch-teardown-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/page-global-patch-authority-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-bridge-prefetch-identity-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/background-compiled-cache-invalidation-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/state-manager-storage-reload-enrichment-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/background-auto-backup-scheduler-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/backup-download-blob-url-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/nanah-vendor-runtime-session-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/subscription-import-request-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/ui-components-portal-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/website-client-lifecycle-surface-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/tab-view-lifecycle-selector-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/popup-lifecycle-selector-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/collab-dialog-lifecycle-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-control-dom-style-lifecycle-restore-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/right-rail-whitelist-observer-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/quick-block-hover-lifecycle-timer-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/menu-observer-kids-passive-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/ytm-watch-player-observer-timer-budget-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/empty-install-idle-observer-budget-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/native-overlay-fullscreen-quiet-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /passed 241\/241 tests/);
  assert.match(source, /P0 lifecycle gates/);
  assert.match(source, /lifecycle source\/instance\/owner matrices/);
  assert.match(source, /repo-wide observer\/listener\/timer\/frame primitive coverage/);
  assert.match(source, /lifecycle effect budgets/);
  assert.match(source, /page-runtime lifecycle authority gaps/);
  assert.match(source, /teardown decision rows/);
  assert.match(source, /DOM fallback and content-bridge lifecycle callbacks/);
  assert.match(source, /bridge settings listener\/timer behavior/);
  assert.match(source, /content bridge startup timing/);
  assert.match(source, /seed and page-global patch teardown gaps/);
  assert.match(source, /prefetch identity lifecycle/);
  assert.match(source, /background compiled-cache invalidation/);
  assert.match(source, /StateManager storage reload\/enrichment/);
  assert.match(source, /background auto-backup scheduling/);
  assert.match(source, /backup blob URL cleanup/);
  assert.match(source, /Nanah vendor sessions/);
  assert.match(source, /subscription import lifecycle/);
  assert.match(source, /UI portal lifecycles/);
  assert.match(source, /website\/tab-view\/popup\/collab dialog lifecycles/);
  assert.match(source, /right-rail whitelist observer behavior/);
  assert.match(source, /quick-block hover timers/);
  assert.match(source, /YTM watch\/player observer-timer budgets/);
  assert.match(source, /empty-install idle observer budgets/);
  assert.match(source, /native overlay\/fullscreen quiet-mode boundaries/);
  assert.match(source, /Runtime behavior changed by this rerun: no/);
  assert.match(source, /Shared lifecycle registry authority, listener add\/remove cleanup authority,\s+observer release parity approval, timer\/frame budget authority, route teardown\s+authority, page-global patch teardown authority, native menu timing authority,\s+no-work lifecycle budgets, metric artifacts, JSON-first promotion,\s+whitelist\/cache optimization, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
});

test('active goal completion audit records current-source settings mode cross feature rerun without declaring completion', () => {
  const source = doc();

  assert.match(source, /2026-05-30 settings-mode\/cross-feature packet current-source rerun/);
  assert.match(source, /node --test --test-reporter=spec tests\/runtime\/settings-mode-coverage-matrix-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/settings-mode-source-effect-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/mode-surface-effect-matrix-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/cross-feature-authority-matrix-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/enabled-master-switch-disabled-runtime-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/json-first-list-mode-matrix-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/content-control-active-work-matrix-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/compiled-settings-profile-list-mode-assembly-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/compiled-settings-field-register-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/settings-authority-source-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/settings-refresh-key-parity-register-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/settings-refresh-cross-context-consumer-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/active-rule-authority-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/profile-viewing-space-authority-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/ui-row-list-mode-authority-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/p0-settings-mutation-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/settings-refresh-fanout-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/profile-management-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/list-mode-transition-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/batch-whitelist-import-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/whitelist-optimization-readiness-gap-matrix-current-behavior\.test\.mjs/);
  assert.match(source, /tests\/runtime\/optimization-stop-go-decision-record-current-behavior\.test\.mjs/);
  assert.match(source, /passed 176\/176 tests/);
  assert.match(source, /settings-mode coverage/);
  assert.match(source, /settings source\/effect behavior/);
  assert.match(source, /mode\/surface effects/);
  assert.match(source, /cross-feature authority rows/);
  assert.match(source, /enabled-master disabled-runtime boundaries/);
  assert.match(source, /JSON-first list-mode behavior/);
  assert.match(source, /content-control active-work decisions/);
  assert.match(source, /compiled settings profile\/list-mode assembly and field registers/);
  assert.match(source, /settings authority source/);
  assert.match(source, /settings refresh key parity and cross-context consumers/);
  assert.match(source, /active-rule authority/);
  assert.match(source, /profile viewing-space authority/);
  assert.match(source, /UI row list-mode authority/);
  assert.match(source, /P0 settings mutation blockers/);
  assert.match(source, /settings refresh fanout/);
  assert.match(source, /profile-management persistence/);
  assert.match(source, /list-mode transition persistence/);
  assert.match(source, /batch whitelist import persistence/);
  assert.match(source, /whitelist optimization readiness gaps/);
  assert.match(source, /stop\/go decision rows/);
  assert.match(source, /Runtime behavior changed by this rerun: no/);
  assert.match(source, /Settings authority, revision\/dirty-key authority, list-mode transition copy\s+policy, profile revision authority, active-rule authority, cross-feature authority,\s+disabled\/no-work runtime authority, whitelist\/cache optimization, JSON-first\s+promotion, release\/public-claim use, and `update_goal\(status='complete'\)`\s+remain `NO-GO`/);
});

test('active goal completion audit records quick-block default migration boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Quick-block default migration boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_QUICK_BLOCK_DEFAULT_MIGRATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/quick-block-default-migration-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /executed migration proof/);
  assert.match(source, /1 quick-block default migration boundary source file/);
  assert.match(source, /7 source\/effect blocks/);
  assert.match(source, /7 migration constants block lines/);
  assert.match(source, /379 migration constants bytes/);
  assert.match(source, /18 compareSemver block lines/);
  assert.match(source, /513 compareSemver bytes/);
  assert.match(source, /4 isVersionAtLeast block lines/);
  assert.match(source, /98 isVersionAtLeast bytes/);
  assert.match(source, /53 applyQuickBlockDefaultMigrationOnce block lines/);
  assert.match(source, /2485 migration block bytes/);
  assert.match(source, /93 onInstalled handler block lines/);
  assert.match(source, /4239 onInstalled handler bytes/);
  assert.match(source, /47 install branch block lines/);
  assert.match(source, /2072 install branch bytes/);
  assert.match(source, /41 update branch block lines/);
  assert.match(source, /2010 update branch bytes/);
  assert.match(source, /6 runtime quick-block default migration fixtures/);
  assert.match(source, /applied marker skips writes/);
  assert.match(source, /installs below version `3\.2\.9` skip writes/);
  assert.match(source, /updates from `3\.2\.9` or later skip writes/);
  assert.match(source, /updates from pre-target versions write root `showQuickBlockButton: true`/);
  assert.match(source, /mark `quickBlockDefaultV327Applied: true`/);
  assert.match(source, /set every V4 profile `settings\.showQuickBlockButton = true`/);
  assert.match(source, /install writes root quick-block and block-menu defaults before calling the migration/);
  assert.match(source, /update calls the migration with `details\.previousVersion \|\| ''`/);
  assert.match(source, /root-versus-profile precedence policy/);
  assert.match(source, /marker\/version intent report/);
  assert.match(source, /failure\/rollback report/);
  assert.match(source, /first-class affordance migration gate/);
  assert.match(source, /`quickBlockDefaultMigrationContract`, `quickBlockDefaultMigrationReport`, `quickBlockDefaultProfileMutationReport`, `quickBlockDefaultInstallUpdateGate`, `quickBlockDefaultRootProfilePrecedencePolicy`, `quickBlockDefaultMarkerVersionReport`, `quickBlockDefaultFailureRollbackReport`, `quickBlockDefaultStorageRevision`, `quickBlockDefaultFixtureProvenance`, or `quickBlockDefaultMetricArtifact`/);
});

test('active goal completion audit records keyword-comments scope migration boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Keyword-comments scope migration boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_KEYWORD_COMMENTS_SCOPE_MIGRATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/keyword-comments-scope-migration-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /executed migration proof/);
  assert.match(source, /1 keyword-comments scope migration boundary source file/);
  assert.match(source, /5 source\/effect blocks/);
  assert.match(source, /7 migration constants block lines/);
  assert.match(source, /379 migration constants bytes/);
  assert.match(source, /87 applyKeywordCommentsScopeMigrationOnce block lines/);
  assert.match(source, /4395 migration block bytes/);
  assert.match(source, /93 onInstalled handler block lines/);
  assert.match(source, /4239 onInstalled handler bytes/);
  assert.match(source, /47 install branch block lines/);
  assert.match(source, /2072 install branch bytes/);
  assert.match(source, /41 update branch block lines/);
  assert.match(source, /2010 update branch bytes/);
  assert.match(source, /7 runtime keyword-comments scope migration fixtures/);
  assert.match(source, /applied marker skips writes/);
  assert.match(source, /disabled-comments root migration writes marker plus root `filterComments: false`/);
  assert.match(source, /root keyword `comments: false`/);
  assert.match(source, /root channel `filterAllComments: false`/);
  assert.match(source, /comments-enabled root migration preserves row comment flags/);
  assert.match(source, /V4 profile migration deletes `settings\.filterComments`/);
  assert.match(source, /migrates `main\.channels`, `main\.keywords`, `main\.whitelistChannels`, and `main\.whitelistKeywords`/);
  assert.match(source, /preserves alias rows outside the local migration target/);
  assert.match(source, /catch path writes only marker plus root `filterComments: false`/);
  assert.match(source, /install and update both call the migration after quick-block migration/);
  assert.match(source, /root\/profile comments-scope decision report/);
  assert.match(source, /list-mode parity report/);
  assert.match(source, /alias row policy/);
  assert.match(source, /Kids row policy/);
  assert.match(source, /first-class comments-scope migration gate/);
  assert.match(source, /`keywordCommentsScopeMigrationContract`, `keywordCommentsScopeMigrationReport`, `keywordCommentsScopeRowMutationReport`, `keywordCommentsScopeRootProfileDecision`, `keywordCommentsScopeListModeParityReport`, `keywordCommentsScopeAliasRowPolicy`, `keywordCommentsScopeKidsRowPolicy`, `keywordCommentsScopeInstallUpdateSequence`, `keywordCommentsScopeFailureRollbackReport`, `keywordCommentsScopeStorageRevision`, `keywordCommentsScopeFixtureProvenance`, or `keywordCommentsScopeMetricArtifact`/);
});

test('active goal completion audit records Kids comments Filter All boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Kids comments Filter All boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_KIDS_COMMENTS_FILTER_ALL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/kids-comments-filter-all-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /executed Kids comments proof/);
  assert.match(source, /5 Kids comments Filter All boundary source files/);
  assert.match(source, /8 source\/effect blocks/);
  assert.match(source, /33 StateManager toggleKidsKeywordComments block lines/);
  assert.match(source, /1187 toggleKidsKeywordComments bytes/);
  assert.match(source, /35 StateManager toggleKidsChannelFilterAll block lines/);
  assert.match(source, /1184 toggleKidsChannelFilterAll bytes/);
  assert.match(source, /64 RenderEngine keyword comments gate block lines/);
  assert.match(source, /3192 keyword comments gate bytes/);
  assert.match(source, /47 background Kids compile block lines/);
  assert.match(source, /2401 background Kids compile bytes/);
  assert.match(source, /27 background compiled channel object block lines/);
  assert.match(source, /1850 background channel object bytes/);
  assert.match(source, /7 runtime Kids comments Filter All fixtures/);
  assert.match(source, /Kids blocklist keyword comments can toggle through StateManager/);
  assert.match(source, /rendered Kids keyword rows hide the comment toggle/);
  assert.match(source, /Kids whitelist keyword comments can also toggle through StateManager/);
  assert.match(source, /Kids channel Filter All toggles `filterAll` and preserves `filterAllComments`/);
  assert.match(source, /Kids channel Filter All in whitelist mode writes nothing/);
  assert.match(source, /background Kids compile merges channel-derived Filter All patterns into `filterKeywordsComments`/);
  assert.match(source, /shared compiler derives channel-derived comment reach from `filterAllComments`/);
  assert.match(source, /filter_logic consumes `filterKeywordsComments` without provenance/);
  assert.match(source, /Kids comments row contract/);
  assert.match(source, /row-action parity report/);
  assert.match(source, /JSON comment keyword provenance report/);
  assert.match(source, /first-class Kids comments Filter All gate/);
  assert.match(source, /`kidsCommentsFilterAllContract`, `kidsCommentsRowActionParityReport`, `kidsChannelCommentsScopePolicy`, `kidsCommentsCompilerParityReport`, `kidsCommentsListModeEffectReport`, `kidsCommentsManagedChildSurfaceReport`, `kidsCommentsKeywordProvenanceReport`, `kidsCommentsFixtureProvenance`, `kidsCommentsMetricArtifact`, `kidsCommentsMutationRefreshReport`, or `kidsCommentsFilterAllAuthorityGate`/);
});

test('active goal completion audit records JSON-first video meta fetch policy without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first video meta fetch policy addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_FETCH_POLICY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-video-meta-fetch-policy-current-behavior\.test\.mjs/);
  assert.match(source, /metadata fetch policy proof/);
  assert.match(source, /3 video-meta fetch policy source files/);
  assert.match(source, /76 content_bridge scheduleVideoMetaFetch body lines/);
  assert.match(source, /2960 schedule body bytes/);
  assert.match(source, /8 schedule needDuration tokens/);
  assert.match(source, /8 schedule needDates tokens/);
  assert.match(source, /8 schedule needCategory tokens/);
  assert.match(source, /5 last-attempt tokens/);
  assert.match(source, /17 processWatchMetaFetchQueue body lines/);
  assert.match(source, /727 queue body bytes/);
  assert.match(source, /98 fetchVideoMetaFromWatchUrl body lines/);
  assert.match(source, /3382 fetch body bytes/);
  assert.match(source, /1 fetch callsite/);
  assert.match(source, /1 JSON\.parse callsite/);
  assert.match(source, /1 persistence callsite/);
  assert.match(source, /1 DOM touch callsite/);
  assert.match(source, /1 DOM rerun callsite/);
  assert.match(source, /3 watch meta fetch concurrency limit/);
  assert.match(source, /60000 ms cooldown/);
  assert.match(source, /3000 attempt-map cap/);
  assert.match(source, /800 attempt-map trim count/);
  assert.match(source, /8 DOM fallback scheduleVideoMetaFetch token occurrences/);
  assert.match(source, /2 filter_logic scheduleVideoMetaFetch token occurrences/);
  assert.match(source, /1 DOM fallback upload-date fetch callsite/);
  assert.match(source, /1 DOM fallback default duration fetch callsite/);
  assert.match(source, /4 runtime video-meta fetch policy fixtures/);
  assert.match(source, /callsite matrix contains JSON category, DOM category, DOM upload-date, DOM explicit duration, and DOM default duration fetch requests/);
  assert.match(source, /satisfied metadata skips work/);
  assert.match(source, /invalid ids are rejected/);
  assert.match(source, /duplicate same-video work is suppressed/);
  assert.match(source, /default options request duration metadata/);
  assert.match(source, /only three active watch metadata fetches start before queued ids wait/);
  assert.match(source, /Kids hosts return before fetching/);
  assert.match(source, /fetch watch HTML with same-origin credentials/);
  assert.match(source, /schedule a DOM rerun only after a touch/);
  assert.match(source, /fetch policy contracts/);
  assert.match(source, /reason matrices/);
  assert.match(source, /budget reports/);
  assert.match(source, /need-flag reports/);
  assert.match(source, /no-work budgets/);
  assert.match(source, /`jsonFirstVideoMetaFetchPolicyContract`, `jsonFirstVideoMetaFetchReasonMatrix`, `jsonFirstVideoMetaFetchBudgetReport`, `jsonFirstVideoMetaFetchCallsiteAuthority`, `jsonFirstVideoMetaFetchNeedFlagReport`, `jsonFirstVideoMetaFetchConcurrencyPolicy`, `jsonFirstVideoMetaFetchKidsPolicy`, `jsonFirstVideoMetaFetchMetricArtifact`, `jsonFirstVideoMetaFetchRevisionPolicy`, or `jsonFirstVideoMetaFetchNoWorkBudget`/);
});

test('active goal completion audit records JSON-first video meta content parity without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first video meta content parity addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_CONTENT_PARITY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-video-meta-content-parity-current-behavior\.test\.mjs/);
  assert.match(source, /JSON\/DOM content decision parity proof/);
  assert.match(source, /3 video-meta content parity source files/);
  assert.match(source, /234 filter_logic extract duration block lines/);
  assert.match(source, /11823 extract duration block bytes/);
  assert.match(source, /4 extract duration videoMetaMap tokens/);
  assert.match(source, /7 extract duration lengthSeconds tokens/);
  assert.match(source, /126 extract published time block lines/);
  assert.match(source, /6495 extract published time block bytes/);
  assert.match(source, /3 extract published time videoMetaMap tokens/);
  assert.match(source, /2 extract published time uploadDate tokens/);
  assert.match(source, /2 extract published time publishDate tokens/);
  assert.match(source, /155 check content filters block lines/);
  assert.match(source, /7739 check content filters block bytes/);
  assert.match(source, /19 content renderer allowlist entries/);
  assert.match(source, /10 content call block lines/);
  assert.match(source, /170 DOM fallback upload-date block lines/);
  assert.match(source, /9701 DOM upload-date block bytes/);
  assert.match(source, /3 DOM upload-date videoMetaMap tokens/);
  assert.match(source, /2 DOM upload-date scheduleVideoMetaFetch tokens/);
  assert.match(source, /11 DOM upload-date parseDateMs tokens/);
  assert.match(source, /71 DOM fallback duration block lines/);
  assert.match(source, /4480 DOM duration block bytes/);
  assert.match(source, /4 DOM duration videoMetaMap tokens/);
  assert.match(source, /4 DOM duration scheduleVideoMetaFetch tokens/);
  assert.match(source, /1 DOM duration cache marker setAttribute callsite/);
  assert.match(source, /75 DOM pending metadata block lines/);
  assert.match(source, /4091 DOM pending metadata block bytes/);
  assert.match(source, /6 DOM pending upload-date attribute tokens/);
  assert.match(source, /2 DOM pending metadata setTimeout callsites/);
  assert.match(source, /5 runtime video-meta content parity fixtures/);
  assert.match(source, /JSON duration uses `videoMetaMap\.lengthSeconds` with block and allow semantics/);
  assert.match(source, /JSON upload-date uses `videoMetaMap\.uploadDate` and blank cutoffs no-op/);
  assert.match(source, /DOM upload-date uses metadata when present, schedules date fetch when missing, and marks pending only after a valid cutoff need/);
  assert.match(source, /DOM duration writes cached `data-filtertube-duration`/);
  assert.match(source, /pending upload-date markers stamp a timestamp, schedule an 8120 ms recheck, and clear stale state/);
  assert.match(source, /content parity contracts/);
  assert.match(source, /duration decision reports/);
  assert.match(source, /upload-date decision reports/);
  assert.match(source, /pending upload-date policies/);
  assert.match(source, /duration cache policies/);
  assert.match(source, /`jsonFirstVideoMetaContentParityContract`, `jsonFirstVideoMetaDurationDecisionReport`, `jsonFirstVideoMetaUploadDateDecisionReport`, `jsonFirstVideoMetaJsonDomContentDecisionReport`, `jsonFirstVideoMetaUploadDatePendingPolicy`, `jsonFirstVideoMetaDurationCachePolicy`, `jsonFirstVideoMetaContentNoWorkBudget`, `jsonFirstVideoMetaContentFixtureProvenance`, `jsonFirstVideoMetaContentMetricArtifact`, or `jsonFirstVideoMetaContentRevisionPolicy`/);
});

test('active goal completion audit records JSON-first video meta no-work budget without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first video meta no-work budget addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-video-meta-no-work-budget-current-behavior\.test\.mjs/);
  assert.match(source, /metadata work-budget proof/);
  assert.match(source, /3 video-meta no-work budget source files/);
  assert.match(source, /76 content_bridge scheduleVideoMetaFetch body lines/);
  assert.match(source, /2960 schedule body bytes/);
  assert.match(source, /1 schedule Date\.now callsite/);
  assert.match(source, /1 last-attempt get callsite/);
  assert.match(source, /1 last-attempt set callsite/);
  assert.match(source, /1 pending has callsite/);
  assert.match(source, /1 queued has callsite/);
  assert.match(source, /1 queue push callsite/);
  assert.match(source, /1 process queue callsite/);
  assert.match(source, /8 needDuration tokens/);
  assert.match(source, /8 needDates tokens/);
  assert.match(source, /8 needCategory tokens/);
  assert.match(source, /17 processWatchMetaFetchQueue body lines/);
  assert.match(source, /727 queue body bytes/);
  assert.match(source, /0 queue-to-fetch option forwarding callsites/);
  assert.match(source, /1 queue-to-fetch video-id-only callsite/);
  assert.match(source, /98 fetchVideoMetaFromWatchUrl body lines/);
  assert.match(source, /3382 fetch body bytes/);
  assert.match(source, /170 DOM fallback upload-date block lines/);
  assert.match(source, /9701 DOM upload-date block bytes/);
  assert.match(source, /1 DOM upload-date Date\.now callsite/);
  assert.match(source, /1 DOM upload-date fetch schedule callsite/);
  assert.match(source, /1 didScheduleMetaFetch token/);
  assert.match(source, /2 needsTimestamp tokens/);
  assert.match(source, /71 DOM fallback duration block lines/);
  assert.match(source, /4480 DOM duration block bytes/);
  assert.match(source, /1 explicit duration fetch callsite/);
  assert.match(source, /1 default duration fetch callsite/);
  assert.match(source, /57 filter_logic category method block lines/);
  assert.match(source, /2683 filter_logic category method block bytes/);
  assert.match(source, /1 selected-empty guard callsite/);
  assert.match(source, /5 runtime video-meta no-work budget fixtures/);
  assert.match(source, /invalid ids, satisfied metadata, and all-false need flags avoid timestamp\/cooldown\/queue\/fetch work/);
  assert.match(source, /no-options scheduling defaults to duration/);
  assert.match(source, /queue execution forwards only the video id and loses need flags/);
  assert.match(source, /duplicate pending calls can refresh cooldown without starting a second fetch/);
  assert.match(source, /blank upload-date cutoffs can still schedule date fetch work/);
  assert.match(source, /mix-like duration callsites schedule no-options metadata fetches/);
  assert.match(source, /scheduler skip reports/);
  assert.match(source, /need-reason reports/);
  assert.match(source, /queue reason-retention policies/);
  assert.match(source, /upload-date cutoff work gates/);
  assert.match(source, /default duration fetch policies/);
  assert.match(source, /`jsonFirstVideoMetaNoWorkBudgetContract`, `jsonFirstVideoMetaSchedulerSkipReport`, `jsonFirstVideoMetaSchedulerNeedReasonReport`, `jsonFirstVideoMetaSchedulerCooldownPolicy`, `jsonFirstVideoMetaQueueReasonRetentionPolicy`, `jsonFirstVideoMetaDuplicatePendingRetryPolicy`, `jsonFirstVideoMetaUploadDateCutoffWorkGate`, `jsonFirstVideoMetaDefaultDurationFetchPolicy`, `jsonFirstVideoMetaNoWorkMetricArtifact`, or `jsonFirstVideoMetaNoWorkRevisionPolicy`/);
});

test('active goal completion audit records JSON-first video meta revision boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first video meta revision boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_REVISION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-video-meta-revision-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /metadata revision-boundary proof/);
  assert.match(source, /3 video-meta revision boundary source files/);
  assert.match(source, /62 content_bridge persistVideoMetaMapping block lines/);
  assert.match(source, /2792 persist block bytes/);
  assert.match(source, /10 persist videoMetaMap tokens/);
  assert.match(source, /12 persist currentSettings tokens/);
  assert.match(source, /1 persist sendMessage callsite/);
  assert.match(source, /0 persist revision tokens/);
  assert.match(source, /5 content_bridge FilterTube_UpdateVideoMetaMap branch lines/);
  assert.match(source, /300 branch bytes/);
  assert.match(source, /41 background enqueueVideoMetaMapUpdate block lines/);
  assert.match(source, /1654 enqueue bytes/);
  assert.match(source, /11 enqueue videoMetaMap tokens/);
  assert.match(source, /6 enqueue compiledSettingsCache tokens/);
  assert.match(source, /0 enqueue revision tokens/);
  assert.match(source, /16 background updateVideoMetaMap receiver branch lines/);
  assert.match(source, /596 receiver branch bytes/);
  assert.match(source, /15 background compiler videoMetaMap pass-through block lines/);
  assert.match(source, /912 compiler pass-through bytes/);
  assert.match(source, /57 filter_logic queueVideoMetaMapping block lines/);
  assert.match(source, /2359 queue block bytes/);
  assert.match(source, /5 seenVideoMetaUpdates tokens/);
  assert.match(source, /4 pendingVideoMetaUpdates tokens/);
  assert.match(source, /1 queue postMessage callsite/);
  assert.match(source, /0 queue revision tokens/);
  assert.match(source, /3 filter_logic processed videoMetaMap pass-through lines/);
  assert.match(source, /240 processed pass-through bytes/);
  assert.match(source, /4 runtime video-meta revision boundary fixtures/);
  assert.match(source, /content persistence mutates disabled currentSettings and strips revision\/provenance fields/);
  assert.match(source, /filter logic queueing dedupes across revision-only changes/);
  assert.match(source, /background update patches both main and kids compiled caches with one unpartitioned metadata map/);
  assert.match(source, /consumers pass videoMetaMap by reference/);
  assert.match(source, /revision contracts/);
  assert.match(source, /settings revision policies/);
  assert.match(source, /profile scope policies/);
  assert.match(source, /message revision gates/);
  assert.match(source, /consumer revision decisions/);
  assert.match(source, /`jsonFirstVideoMetaRevisionBoundaryContract`, `jsonFirstVideoMetaRevisionReport`, `jsonFirstVideoMetaSettingsRevisionPolicy`, `jsonFirstVideoMetaProfileScopePolicy`, `jsonFirstVideoMetaSourceProvenanceReport`, `jsonFirstVideoMetaMessageRevisionGate`, `jsonFirstVideoMetaBackgroundRevisionGate`, `jsonFirstVideoMetaConsumerRevisionDecision`, `jsonFirstVideoMetaRevisionFixtureProvenance`, or `jsonFirstVideoMetaRevisionMetricArtifact`/);
});

test('active goal completion audit records JSON-first video meta profile surface boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first video meta profile\/surface boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_PROFILE_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-video-meta-profile-surface-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /profile\/surface permission proof/);
  assert.match(source, /4 video-meta profile\/surface boundary source files/);
  assert.match(source, /62 content_bridge persistVideoMetaMapping block lines/);
  assert.match(source, /2792 persist block bytes/);
  assert.match(source, /0 persist profile tokens/);
  assert.match(source, /0 persist listMode tokens/);
  assert.match(source, /76 scheduleVideoMetaFetch block lines/);
  assert.match(source, /2960 schedule block bytes/);
  assert.match(source, /0 schedule profile tokens/);
  assert.match(source, /0 schedule listMode tokens/);
  assert.match(source, /98 fetchVideoMetaFromWatchUrl block lines/);
  assert.match(source, /3382 fetch block bytes/);
  assert.match(source, /1 fetch hostname token/);
  assert.match(source, /1 fetch youtubekids token/);
  assert.match(source, /27 FilterTube_UpdateVideoMetaMap branch lines/);
  assert.match(source, /1030 receiver branch bytes/);
  assert.match(source, /24 background getCompiledSettings receiver branch lines/);
  assert.match(source, /1469 receiver branch bytes/);
  assert.match(source, /7 receiver profileType tokens/);
  assert.match(source, /15 background compiler videoMetaMap pass-through block lines/);
  assert.match(source, /912 compiler pass-through bytes/);
  assert.match(source, /41 background enqueueVideoMetaMapUpdate block lines/);
  assert.match(source, /1654 enqueue bytes/);
  assert.match(source, /3 filter_logic processed videoMetaMap pass-through lines/);
  assert.match(source, /252 processed pass-through bytes/);
  assert.match(source, /28 filter_logic _registerVideoMetaMapping block lines/);
  assert.match(source, /1217 register block bytes/);
  assert.match(source, /57 _checkCategoryFilters block lines/);
  assert.match(source, /2683 category block bytes/);
  assert.match(source, /170 DOM upload-date videoMetaMap block lines/);
  assert.match(source, /9701 DOM upload-date bytes/);
  assert.match(source, /71 DOM duration videoMetaMap block lines/);
  assert.match(source, /4492 DOM duration bytes/);
  assert.match(source, /5 runtime video-meta profile\/surface fixtures/);
  assert.match(source, /content persistence accepts Kids\/whitelist\/disabled settings without row profile fields/);
  assert.match(source, /Kids-host scheduling is admitted before the watch-fetch host guard/);
  assert.match(source, /background updates patch Main and Kids compiled caches with one unpartitioned map/);
  assert.match(source, /filter logic consumes the same map under a Kids profile without a scoped view/);
  assert.match(source, /DOM fallback route-local category logic reads a global metadata row/);
  assert.match(source, /profile\/surface contracts/);
  assert.match(source, /profile scope reports/);
  assert.match(source, /surface permission reports/);
  assert.match(source, /Kids policies/);
  assert.match(source, /consumer permission decisions/);
  assert.match(source, /`jsonFirstVideoMetaProfileSurfaceContract`, `jsonFirstVideoMetaProfileScopeReport`, `jsonFirstVideoMetaSurfacePermissionReport`, `jsonFirstVideoMetaKidsPolicy`, `jsonFirstVideoMetaListModePolicy`, `jsonFirstVideoMetaSettingsGate`, `jsonFirstVideoMetaConsumerPermissionDecision`, `jsonFirstVideoMetaFetchSurfaceBudget`, `jsonFirstVideoMetaProfileFixtureProvenance`, or `jsonFirstVideoMetaProfileMetricArtifact`/);
});

test('active goal completion audit records JSON-first video meta freshness eviction boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first video meta freshness\/eviction boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_FRESHNESS_EVICTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-video-meta-freshness-eviction-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /freshness\/eviction proof/);
  assert.match(source, /3 video-meta freshness\/eviction boundary source files/);
  assert.match(source, /10 freshness\/eviction source\/effect blocks/);
  assert.match(source, /62 content_bridge persistVideoMetaMapping block lines/);
  assert.match(source, /2792 persist block bytes/);
  assert.match(source, /0 persist Date\.now callsites/);
  assert.match(source, /0 persist fetchedAt tokens/);
  assert.match(source, /0 persist updatedAt tokens/);
  assert.match(source, /0 persist expiresAt tokens/);
  assert.match(source, /1 persist Object\.keys callsite/);
  assert.match(source, /1 persist eviction slice callsite/);
  assert.match(source, /76 scheduleVideoMetaFetch block lines/);
  assert.match(source, /2960 schedule block bytes/);
  assert.match(source, /1 schedule Date\.now callsite/);
  assert.match(source, /5 schedule lastWatchMetaFetchAttempt tokens/);
  assert.match(source, /0 schedule fetchedAt tokens/);
  assert.match(source, /0 schedule updatedAt tokens/);
  assert.match(source, /0 schedule expiresAt tokens/);
  assert.match(source, /17 processWatchMetaFetchQueue block lines/);
  assert.match(source, /727 queue block bytes/);
  assert.match(source, /19 background ensureVideoMetaMapCache block lines/);
  assert.match(source, /685 ensure block bytes/);
  assert.match(source, /13 background enforceVideoMetaMapCap block lines/);
  assert.match(source, /376 enforce block bytes/);
  assert.match(source, /1 enforce Object\.keys callsite/);
  assert.match(source, /1 enforce eviction slice callsite/);
  assert.match(source, /21 background flushVideoMetaMapUpdates block lines/);
  assert.match(source, /797 flush block bytes/);
  assert.match(source, /41 background enqueueVideoMetaMapUpdate block lines/);
  assert.match(source, /1654 enqueue block bytes/);
  assert.match(source, /0 enqueue fetchedAt tokens/);
  assert.match(source, /0 enqueue updatedAt tokens/);
  assert.match(source, /0 enqueue expiresAt tokens/);
  assert.match(source, /57 filter_logic queueVideoMetaMapping block lines/);
  assert.match(source, /2359 queue block bytes/);
  assert.match(source, /1 filter queue Date\.now callsite/);
  assert.match(source, /5 seenVideoMetaUpdates tokens/);
  assert.match(source, /28 filter_logic _registerVideoMetaMapping block lines/);
  assert.match(source, /1217 register block bytes/);
  assert.match(source, /3 filter_logic processed videoMetaMap pass-through lines/);
  assert.match(source, /252 processed pass-through bytes/);
  assert.match(source, /60000 ms watch fetch cooldown/);
  assert.match(source, /3000 attempt-map cap/);
  assert.match(source, /800 attempt-map trim count/);
  assert.match(source, /2000 videoMetaMap maximum entries/);
  assert.match(source, /500 videoMetaMap eviction count/);
  assert.match(source, /5 runtime video-meta freshness\/eviction fixtures/);
  assert.match(source, /content persistence row cleanup and first-key cap eviction/);
  assert.match(source, /stale parseable scheduler no-fetch behavior/);
  assert.match(source, /background stale load\/flush retention with cleaned new writes/);
  assert.match(source, /background first-key eviction independent of fetchedAt recency/);
  assert.match(source, /filter logic freshness-only dedupe with no freshness payload/);
  assert.match(source, /freshness contracts/);
  assert.match(source, /age policies/);
  assert.match(source, /row provenance reports/);
  assert.match(source, /fetch freshness gates/);
  assert.match(source, /eviction policy reports/);
  assert.match(source, /consumer freshness decisions/);
  assert.match(source, /`jsonFirstVideoMetaFreshnessEvictionContract`, `jsonFirstVideoMetaFreshnessReport`, `jsonFirstVideoMetaAgePolicy`, `jsonFirstVideoMetaRowProvenanceReport`, `jsonFirstVideoMetaFetchFreshnessGate`, `jsonFirstVideoMetaEvictionPolicyReport`, `jsonFirstVideoMetaAttemptCooldownReport`, `jsonFirstVideoMetaStaleRowFixtureProvenance`, `jsonFirstVideoMetaFreshnessMetricArtifact`, or `jsonFirstVideoMetaConsumerFreshnessDecision`/);
});

test('active goal completion audit records JSON-first video meta merge schema boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first video meta merge\/schema boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_MERGE_SCHEMA_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-video-meta-merge-schema-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /row merge\/schema proof/);
  assert.match(source, /3 video-meta merge\/schema boundary source files/);
  assert.match(source, /8 merge\/schema source\/effect blocks/);
  assert.match(source, /62 content_bridge persistVideoMetaMapping block lines/);
  assert.match(source, /2792 persist block bytes/);
  assert.match(source, /2 persist delete token occurrences/);
  assert.match(source, /1 persist spread token occurrence/);
  assert.match(source, /11 persist lengthSeconds tokens/);
  assert.match(source, /8 persist category tokens/);
  assert.match(source, /26 FilterTube_UpdateVideoMetaMap branch lines/);
  assert.match(source, /1025 branch bytes/);
  assert.match(source, /1 content update persist callsite/);
  assert.match(source, /2 content update touch callsites/);
  assert.match(source, /1 content update rerun callsite/);
  assert.match(source, /16 background updateVideoMetaMap receiver branch lines/);
  assert.match(source, /596 receiver branch bytes/);
  assert.match(source, /4 receiver entries tokens/);
  assert.match(source, /0 receiver category tokens/);
  assert.match(source, /0 receiver request\.category tokens/);
  assert.match(source, /41 background enqueueVideoMetaMapUpdate block lines/);
  assert.match(source, /1654 enqueue block bytes/);
  assert.match(source, /1 enqueue delete token occurrence/);
  assert.match(source, /0 enqueue spread token occurrences/);
  assert.match(source, /7 enqueue clean tokens/);
  assert.match(source, /6 enqueue category tokens/);
  assert.match(source, /21 background flushVideoMetaMapUpdates block lines/);
  assert.match(source, /797 flush block bytes/);
  assert.match(source, /15 background compiler videoMetaMap pass-through block lines/);
  assert.match(source, /912 compiler block bytes/);
  assert.match(source, /57 filter_logic queueVideoMetaMapping block lines/);
  assert.match(source, /2359 queue block bytes/);
  assert.match(source, /7 queue category tokens/);
  assert.match(source, /28 filter_logic _registerVideoMetaMapping block lines/);
  assert.match(source, /1217 register block bytes/);
  assert.match(source, /2 register spread token occurrences/);
  assert.match(source, /2 register same tokens/);
  assert.match(source, /0 register category tokens/);
  assert.match(source, /16 player video-meta harvest block lines/);
  assert.match(source, /952 harvest block bytes/);
  assert.match(source, /5 harvest category tokens/);
  assert.match(source, /5 runtime video-meta merge\/schema fixtures/);
  assert.match(source, /category-only content persistence replaces complete rows with partial clean metadata/);
  assert.match(source, /category-only background enqueue\/flush replaces loaded cache rows with partial clean metadata/);
  assert.match(source, /filter logic ignores category-only changes when duration and dates are unchanged/);
  assert.match(source, /filter logic can merge a partial row locally while queueing only the partial metadata outward/);
  assert.match(source, /background legacy single-video update shape omits category forwarding/);
  assert.match(source, /merge schema contracts/);
  assert.match(source, /row completeness reports/);
  assert.match(source, /partial update policies/);
  assert.match(source, /category merge decisions/);
  assert.match(source, /field-loss reports/);
  assert.match(source, /legacy message schemas/);
  assert.match(source, /consumer schema decisions/);
  assert.match(source, /`jsonFirstVideoMetaMergeSchemaContract`, `jsonFirstVideoMetaRowCompletenessReport`, `jsonFirstVideoMetaPartialUpdatePolicy`, `jsonFirstVideoMetaCategoryMergeDecision`, `jsonFirstVideoMetaFieldLossReport`, `jsonFirstVideoMetaLegacyMessageSchema`, `jsonFirstVideoMetaStorageMergeReport`, `jsonFirstVideoMetaConsumerSchemaDecision`, `jsonFirstVideoMetaMergeFixtureProvenance`, or `jsonFirstVideoMetaMergeMetricArtifact`/);
});

test('active goal completion audit records JSON-first renderer traversal mutation boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first renderer traversal\/mutation boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_RENDERER_TRAVERSAL_MUTATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-renderer-traversal-mutation-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /renderer traversal\/mutation proof/);
  assert.match(source, /2 renderer traversal\/mutation boundary source files/);
  assert.match(source, /5 traversal\/mutation source\/effect blocks/);
  assert.match(source, /40 filter_logic filter block lines/);
  assert.match(source, /1448 filter block bytes/);
  assert.match(source, /4 recursive filter call tokens/);
  assert.match(source, /1 _shouldBlock callsite/);
  assert.match(source, /1 Array\.isArray callsite/);
  assert.match(source, /1 filtered\.push callsite/);
  assert.match(source, /1 return filtered callsite/);
  assert.match(source, /1 return null callsite/);
  assert.match(source, /1 Object\.keys callsite/);
  assert.match(source, /1 Object\.entries callsite/);
  assert.match(source, /1 result\[key\] assignment/);
  assert.match(source, /32 processData block lines/);
  assert.match(source, /1232 processData block bytes/);
  assert.match(source, /2 processData Date\.now callsites/);
  assert.match(source, /1 processData filter callsite/);
  assert.match(source, /23 global interface block lines/);
  assert.match(source, /892 global interface block bytes/);
  assert.match(source, /2 global interface processData tokens/);
  assert.match(source, /2 global interface harvestOnly tokens/);
  assert.match(source, /44 unwrapRendererForFiltering block lines/);
  assert.match(source, /1907 unwrap block bytes/);
  assert.match(source, /2 preferredNestedRenderers tokens/);
  assert.match(source, /3 wrapperRendererType tokens/);
  assert.match(source, /3 ViewModel tokens/);
  assert.match(source, /301 _shouldBlock block lines/);
  assert.match(source, /15380 _shouldBlock block bytes/);
  assert.match(source, /11 _shouldBlock return true tokens/);
  assert.match(source, /11 _shouldBlock return false tokens/);
  assert.match(source, /20 _shouldBlock whitelist tokens/);
  assert.match(source, /5 _shouldBlock filterKeywords tokens/);
  assert.match(source, /4 _shouldBlock filterChannels tokens/);
  assert.match(source, /1 _checkContentFilters callsite/);
  assert.match(source, /1 _checkCategoryFilters callsite/);
  assert.match(source, /1 _shouldBlock postMessage callsite/);
  assert.match(source, /271 seed processWithEngine block lines/);
  assert.match(source, /12681 seed processWithEngine block bytes/);
  assert.match(source, /2 FilterTubeEngine\.processData tokens/);
  assert.match(source, /4 harvestOnly tokens/);
  assert.match(source, /4 JSON\.stringify tokens/);
  assert.match(source, /5 runtime renderer traversal\/mutation fixtures/);
  assert.match(source, /active no-match traversal rebuilds object and array containers/);
  assert.match(source, /disabled processing returns the original payload reference/);
  assert.match(source, /array traversal compacts blocked renderer items while preserving allowed siblings/);
  assert.match(source, /object property traversal omits nested blocked renderer children while retaining unrelated sibling properties/);
  assert.match(source, /richItemRenderer wrapper removal follows preferred nested renderer blocking/);
  assert.match(source, /traversal contracts/);
  assert.match(source, /mutation budgets/);
  assert.match(source, /recursive filter reports/);
  assert.match(source, /array compaction policies/);
  assert.match(source, /object omission policies/);
  assert.match(source, /renderer wrapper policies/);
  assert.match(source, /renderer sibling policies/);
  assert.match(source, /no-op identity policies/);
  assert.match(source, /`jsonFirstRendererTraversalContract`, `jsonFirstRendererMutationBudget`, `jsonFirstRecursiveFilterReport`, `jsonFirstArrayCompactionPolicy`, `jsonFirstObjectOmissionPolicy`, `jsonFirstRendererWrapperPolicy`, `jsonFirstRendererSiblingPolicy`, `jsonFirstFilterNoopIdentityPolicy`, `jsonFirstTraversalMetricArtifact`, or `jsonFirstRendererMutationFixtureProvenance`/);
});

test('active goal completion audit records JSON-first block decision effect boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first block decision\/effect boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_BLOCK_DECISION_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-block-decision-effect-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /block-decision\/effect proof/);
  assert.match(source, /1 block decision\/effect boundary source file/);
  assert.match(source, /9 block decision\/effect source\/effect blocks/);
  assert.match(source, /301 _shouldBlock block lines/);
  assert.match(source, /15380 _shouldBlock block bytes/);
  assert.match(source, /17 collaboration cache block lines/);
  assert.match(source, /786 collaboration cache block bytes/);
  assert.match(source, /6 Shorts decision block lines/);
  assert.match(source, /328 Shorts decision block bytes/);
  assert.match(source, /15 route exception block lines/);
  assert.match(source, /460 route exception block bytes/);
  assert.match(source, /105 whitelist decision block lines/);
  assert.match(source, /5392 whitelist decision block bytes/);
  assert.match(source, /17 channel decision block lines/);
  assert.match(source, /1090 channel decision block bytes/);
  assert.match(source, /21 keyword decision block lines/);
  assert.match(source, /1123 keyword decision block bytes/);
  assert.match(source, /34 comment decision block lines/);
  assert.match(source, /1947 comment decision block bytes/);
  assert.match(source, /13 content\/category decision block lines/);
  assert.match(source, /542 content\/category decision block bytes/);
  assert.match(source, /11 _shouldBlock return true tokens/);
  assert.match(source, /11 _shouldBlock return false tokens/);
  assert.match(source, /6 _logWhitelistDecision tokens/);
  assert.match(source, /4 _matchesAnyChannel tokens/);
  assert.match(source, /6 _regexMatches tokens/);
  assert.match(source, /1 postMessage token/);
  assert.match(source, /1 hideAllShorts token/);
  assert.match(source, /2 filterKeywordsComments tokens/);
  assert.match(source, /1 _checkContentFilters token/);
  assert.match(source, /1 _checkCategoryFilters token/);
  assert.match(source, /2 document\.location tokens/);
  assert.match(source, /6 runtime block decision\/effect fixtures/);
  assert.match(source, /`\/feed\/channels` preserves a video that empty whitelist mode would remove/);
  assert.match(source, /`hideAllShorts` blocks before that route exception/);
  assert.match(source, /channel-only renderers skip keyword filtering but honor channel rules/);
  assert.match(source, /comments bypass non-comment empty whitelist fail-closed behavior/);
  assert.match(source, /collaboration cache messages can post while a renderer remains allowed/);
  assert.match(source, /any matching collaborator can remove the whole renderer after the cache side effect is posted/);
  assert.match(source, /block-decision contracts/);
  assert.match(source, /effect reports/);
  assert.match(source, /decision-order reports/);
  assert.match(source, /side-effect budgets/);
  assert.match(source, /collaboration effect decisions/);
  assert.match(source, /route exception decisions/);
  assert.match(source, /comment policies/);
  assert.match(source, /channel-only field policies/);
  assert.match(source, /short-circuit reports/);
  assert.match(source, /`jsonFirstBlockDecisionContract`, `jsonFirstBlockDecisionEffectReport`, `jsonFirstDecisionOrderReport`, `jsonFirstDecisionSideEffectBudget`, `jsonFirstCollaborationEffectDecision`, `jsonFirstRouteExceptionDecision`, `jsonFirstCommentDecisionPolicy`, `jsonFirstChannelOnlyFieldPolicy`, `jsonFirstDecisionShortCircuitReport`, or `jsonFirstBlockDecisionFixtureProvenance`/);
});

test('active goal completion audit records JSON-first candidate extraction boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first candidate extraction boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_CANDIDATE_EXTRACTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-candidate-extraction-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /candidate-extraction proof/);
  assert.match(source, /1 candidate extraction boundary source file/);
  assert.match(source, /11 candidate extraction source\/effect blocks/);
  assert.match(source, /25 collect text block lines/);
  assert.match(source, /1249 collect text block bytes/);
  assert.match(source, /23 extract video id block lines/);
  assert.match(source, /1033 extract video id block bytes/);
  assert.match(source, /16 extract playlist id block lines/);
  assert.match(source, /670 extract playlist id block bytes/);
  assert.match(source, /80 build candidate block lines/);
  assert.match(source, /4260 build candidate block bytes/);
  assert.match(source, /15 candidate search text block lines/);
  assert.match(source, /655 candidate search text block bytes/);
  assert.match(source, /21 extract title block lines/);
  assert.match(source, /681 extract title block bytes/);
  assert.match(source, /34 extract description block lines/);
  assert.match(source, /1556 extract description block bytes/);
  assert.match(source, /318 extract channel info block lines/);
  assert.match(source, /18196 extract channel info block bytes/);
  assert.match(source, /101 avatar stack extraction block lines/);
  assert.match(source, /5289 avatar stack extraction block bytes/);
  assert.match(source, /117 showDialog extraction block lines/);
  assert.match(source, /7760 showDialog extraction block bytes/);
  assert.match(source, /94 rule channel extraction block lines/);
  assert.match(source, /4977 rule channel extraction block bytes/);
  assert.match(source, /11 build candidate _collectTextFromPaths tokens/);
  assert.match(source, /3 build candidate metadataText tokens/);
  assert.match(source, /1 build candidate extractChannelIdentity token/);
  assert.match(source, /3 extract channel info avatarStackViewModel tokens/);
  assert.match(source, /11 extract channel info showDialogCommand tokens/);
  assert.match(source, /4 extract channel info getByPath tokens/);
  assert.match(source, /3 extract channel info getTextFromPaths tokens/);
  assert.match(source, /3 extract channel info return collaborators tokens/);
  assert.match(source, /1 extract channel info return channelInfo token/);
  assert.match(source, /6 runtime candidate extraction fixtures/);
  assert.match(source, /`_buildCandidate\(\)` gates channel identity but still builds metadata text/);
  assert.match(source, /keyword filtering can match channelName metadata when identity extraction is skipped/);
  assert.match(source, /invalid video ids are rejected while valid endpoint ids and non-empty playlist ids feed mix flags/);
  assert.match(source, /showDialog extraction returns collaborators and emits mapping side effects/);
  assert.match(source, /documented showSheet collaborator rosters are not parsed by filter logic today/);
  assert.match(source, /avatar-stack collaborators can remove a mix-like radio renderer through channel rules/);
  assert.match(source, /extraction contracts/);
  assert.match(source, /candidate reports/);
  assert.match(source, /identity gates/);
  assert.match(source, /metadata search policies/);
  assert.match(source, /video-id policies/);
  assert.match(source, /playlist policies/);
  assert.match(source, /collaboration source policies/);
  assert.match(source, /avatar-stack policies/);
  assert.match(source, /showSheet policies/);
  assert.match(source, /`jsonFirstCandidateExtractionContract`, `jsonFirstCandidateExtractionReport`, `jsonFirstCandidateIdentityGate`, `jsonFirstCandidateMetadataSearchPolicy`, `jsonFirstCandidateVideoIdPolicy`, `jsonFirstCandidatePlaylistPolicy`, `jsonFirstCandidateCollaborationSourcePolicy`, `jsonFirstCandidateAvatarStackPolicy`, `jsonFirstCandidateShowSheetPolicy`, or `jsonFirstCandidateExtractionFixtureProvenance`/);
});

test('active goal completion audit records JSON-first channel match boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first channel match boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_CHANNEL_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-channel-match-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /channel-match proof/);
  assert.match(source, /2 channel match boundary source files/);
  assert.match(source, /7 channel match source\/effect blocks/);
  assert.match(source, /11 filter_logic build channel index block lines/);
  assert.match(source, /370 filter_logic build channel index block bytes/);
  assert.match(source, /19 filter_logic _matchesAnyChannel block lines/);
  assert.match(source, /719 filter_logic _matchesAnyChannel block bytes/);
  assert.match(source, /170 filter_logic _matchesChannel fallback block lines/);
  assert.match(source, /7880 filter_logic _matchesChannel fallback block bytes/);
  assert.match(source, /118 shared buildChannelFilterIndex block lines/);
  assert.match(source, /4624 shared buildChannelFilterIndex block bytes/);
  assert.match(source, /48 shared channelMetaMatchesIndex block lines/);
  assert.match(source, /1937 shared channelMetaMatchesIndex block bytes/);
  assert.match(source, /164 shared channelMatchesFilter block lines/);
  assert.match(source, /6948 shared channelMatchesFilter block bytes/);
  assert.match(source, /9 shared isChannelBlocked block lines/);
  assert.match(source, /467 shared isChannelBlocked block bytes/);
  assert.match(source, /17 filter_logic _matchesChannel return true tokens/);
  assert.match(source, /2 filter_logic _matchesChannel return false tokens/);
  assert.match(source, /17 filter_logic _matchesChannel channelMap tokens/);
  assert.match(source, /11 shared channelMetaMatchesIndex return true tokens/);
  assert.match(source, /2 shared channelMetaMatchesIndex return false tokens/);
  assert.match(source, /18 shared channelMatchesFilter return true tokens/);
  assert.match(source, /7 shared channelMatchesFilter return false tokens/);
  assert.match(source, /3 shared buildChannelFilterIndex nameOnlyNames tokens/);
  assert.match(source, /3 shared buildChannelFilterIndex stableNames tokens/);
  assert.match(source, /3 shared channelMetaMatchesIndex nameOnlyNames tokens/);
  assert.match(source, /3 shared channelMetaMatchesIndex stableNames tokens/);
  assert.match(source, /6 runtime channel match fixtures/);
  assert.match(source, /shared indexed matching admits stable ids and channelMap cross-links as booleans/);
  assert.match(source, /direct and indexed shared match paths diverge for object names and name-only strings/);
  assert.match(source, /direct `@handle` matching has weak name fallback not shared by indexed handle matching/);
  assert.match(source, /filter_logic uses the shared index path when an index exists/);
  assert.match(source, /legacy filter_logic fallback differs from shared direct matching while keeping handle\/name and map fallbacks/);
  assert.match(source, /full shared-index JSON path guards stable-name mismatch while blocking exact UC id matches/);
  assert.match(source, /channel match contracts/);
  assert.match(source, /decision reports/);
  assert.match(source, /confidence policies/);
  assert.match(source, /index\/direct parity/);
  assert.match(source, /fallback-scope reports/);
  assert.match(source, /name-only policies/);
  assert.match(source, /stable-name guards/);
  assert.match(source, /channelMap provenance reports/);
  assert.match(source, /caller matrices/);
  assert.match(source, /`jsonFirstChannelMatchContract`, `jsonFirstChannelMatchDecisionReport`, `jsonFirstChannelMatchConfidencePolicy`, `jsonFirstChannelMatchIndexDirectParity`, `jsonFirstChannelMatchFallbackScope`, `jsonFirstChannelMatchNameOnlyPolicy`, `jsonFirstChannelMatchStableNameGuard`, `jsonFirstChannelMapProvenanceReport`, `jsonFirstChannelMatchCallerMatrix`, or `jsonFirstChannelMatchFixtureProvenance`/);
});

test('active goal completion audit records JSON-first keyword match boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first keyword match boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_KEYWORD_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-keyword-match-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /keyword-match proof/);
  assert.match(source, /4 keyword match boundary source files/);
  assert.match(source, /10 keyword match source\/effect blocks/);
  assert.match(source, /29 filter_logic keyword regex reconstruction block lines/);
  assert.match(source, /1445 filter_logic keyword regex reconstruction block bytes/);
  assert.match(source, /15 filter_logic candidate search text block lines/);
  assert.match(source, /663 filter_logic candidate search text block bytes/);
  assert.match(source, /18 filter_logic _regexMatches block lines/);
  assert.match(source, /488 filter_logic _regexMatches block bytes/);
  assert.match(source, /15 filter_logic whitelist keyword block lines/);
  assert.match(source, /687 filter_logic whitelist keyword block bytes/);
  assert.match(source, /21 filter_logic blocklist keyword block lines/);
  assert.match(source, /1123 filter_logic blocklist keyword block bytes/);
  assert.match(source, /34 filter_logic comment keyword block lines/);
  assert.match(source, /1947 filter_logic comment keyword block bytes/);
  assert.match(source, /15 settings_shared compileKeywords block lines/);
  assert.match(source, /740 settings_shared compileKeywords block bytes/);
  assert.match(source, /23 background compileKeywordEntries block lines/);
  assert.match(source, /1040 background compileKeywordEntries block bytes/);
  assert.match(source, /35 background comments keyword fallback block lines/);
  assert.match(source, /1961 background comments keyword fallback block bytes/);
  assert.match(source, /36 DOM fallback matchesKeyword block lines/);
  assert.match(source, /1278 DOM fallback matchesKeyword block bytes/);
  assert.match(source, /7 filter_logic total _regexMatches tokens/);
  assert.match(source, /2 filter_logic total filterKeywordsComments tokens/);
  assert.match(source, /4 settings_shared compileKeywords tokens/);
  assert.match(source, /4 background compileKeywordEntries tokens/);
  assert.match(source, /4 DOM fallback matchesKeyword tokens/);
  assert.match(source, /8 runtime keyword match fixtures/);
  assert.match(source, /substring keywords can hide larger words/);
  assert.match(source, /exact Unicode-boundary patterns do not hide larger words but do hide standalone words/);
  assert.match(source, /global regex state resets across repeated JSON siblings/);
  assert.match(source, /candidate search text can match title, description, tags, metadata, and channel display text/);
  assert.match(source, /serialized `filterKeywordsComments` is ignored while direct `RegExp` comment lists block/);
  assert.match(source, /global keywords can still hide comments through candidate metadata/);
  assert.match(source, /whitelist keyword matches allow content while whitelist keyword misses fail closed/);
  assert.match(source, /channel-only renderers skip JSON keyword matching/);
  assert.match(source, /keyword match contracts/);
  assert.match(source, /decision reports/);
  assert.match(source, /boundary policies/);
  assert.match(source, /comment-scope reports/);
  assert.match(source, /source provenance/);
  assert.match(source, /JSON\/DOM parity reports/);
  assert.match(source, /whitelist miss reports/);
  assert.match(source, /regex state reports/);
  assert.match(source, /channel-derived keyword provenance/);
  assert.match(source, /`jsonFirstKeywordMatchContract`, `jsonFirstKeywordDecisionReport`, `jsonFirstKeywordBoundaryPolicy`, `jsonFirstKeywordCommentScopeReport`, `jsonFirstKeywordSourceProvenance`, `jsonFirstKeywordDomParityReport`, `jsonFirstKeywordWhitelistMissReport`, `jsonFirstKeywordRegexStateReport`, `jsonFirstChannelDerivedKeywordProvenance`, or `jsonFirstKeywordFixtureProvenance`/);
});

test('active goal completion audit records JSON-first uppercase title boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first uppercase title boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_UPPERCASE_TITLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-uppercase-title-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /uppercase-title proof/);
  assert.match(source, /4 uppercase title boundary source files/);
  assert.match(source, /9 uppercase title source\/effect blocks/);
  assert.match(source, /6 filter_logic content filter defaults block lines/);
  assert.match(source, /395 filter_logic content filter defaults block bytes/);
  assert.match(source, /19 filter_logic content filter merge block lines/);
  assert.match(source, /1098 filter_logic content filter merge block bytes/);
  assert.match(source, /155 filter_logic check content filters block lines/);
  assert.match(source, /7747 filter_logic check content filters block bytes/);
  assert.match(source, /31 filter_logic uppercase-title method block lines/);
  assert.match(source, /1342 filter_logic uppercase-title method block bytes/);
  assert.match(source, /9 seed active content-filter predicate block lines/);
  assert.match(source, /365 seed active content-filter predicate block bytes/);
  assert.match(source, /11 DOM fallback active content-filter predicate block lines/);
  assert.match(source, /395 DOM fallback active content-filter predicate block bytes/);
  assert.match(source, /18 DOM fallback loop content-filter predicate block lines/);
  assert.match(source, /906 DOM fallback loop content-filter predicate block bytes/);
  assert.match(source, /280 DOM fallback shouldHideContent tail block lines/);
  assert.match(source, /14598 DOM fallback shouldHideContent tail block bytes/);
  assert.match(source, /6 background content filter default block lines/);
  assert.match(source, /390 background content filter default block bytes/);
  assert.match(source, /11 filter_logic total uppercase tokens/);
  assert.match(source, /2 filter_logic total _checkUppercaseTitle tokens/);
  assert.match(source, /7 filter_logic total contentFilters tokens/);
  assert.match(source, /2 DOM fallback total uppercase tokens/);
  assert.match(source, /0 DOM fallback total _checkUppercaseTitle tokens/);
  assert.match(source, /18 DOM fallback total contentFilters tokens/);
  assert.match(source, /1 seed total uppercase token/);
  assert.match(source, /4 seed total contentFilters tokens/);
  assert.match(source, /1 background total uppercase token/);
  assert.match(source, /9 background total contentFilters tokens/);
  assert.match(source, /8 runtime uppercase-title fixtures/);
  assert.match(source, /`single_word` mode hides standalone uppercase ASCII words while allowing lowercase/);
  assert.match(source, /ASCII-only heuristic leaves non-ASCII uppercase-looking words visible/);
  assert.match(source, /`all_caps` hides all-ASCII uppercase titles and allows mixed-case titles with one uppercase word/);
  assert.match(source, /`both` mode hides all-caps titles or a single uppercase word/);
  assert.match(source, /`minWordLength: 0` falls back to 2/);
  assert.match(source, /channel-only renderers skip uppercase content filtering/);
  assert.match(source, /seed and DOM active predicates wake on uppercase enabled/);
  assert.match(source, /DOM `shouldHideContent\(\)` contains no uppercase enforcement branch/);
  assert.match(source, /uppercase title contracts/);
  assert.match(source, /decision reports/);
  assert.match(source, /boundary policies/);
  assert.match(source, /DOM parity reports/);
  assert.match(source, /locale policies/);
  assert.match(source, /renderer-scope reports/);
  assert.match(source, /no-work budgets/);
  assert.match(source, /settings validity reports/);
  assert.match(source, /`jsonFirstUppercaseTitleContract`, `jsonFirstUppercaseDecisionReport`, `jsonFirstUppercaseBoundaryPolicy`, `jsonFirstUppercaseDomParityReport`, `jsonFirstUppercaseLocalePolicy`, `jsonFirstUppercaseRendererScope`, `jsonFirstUppercaseNoWorkBudget`, `jsonFirstUppercaseFixtureProvenance`, `jsonFirstUppercaseMetricArtifact`, or `jsonFirstUppercaseSettingsValidityReport`/);
});

test('active goal completion audit records JSON-first hideAllShorts boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideAllShorts boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_ALL_SHORTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-all-shorts-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-all-Shorts proof/);
  assert.match(source, /4 hideAllShorts boundary source files/);
  assert.match(source, /17 hideAllShorts source\/effect blocks/);
  assert.match(source, /15 filter_logic Shorts rules block lines/);
  assert.match(source, /653 filter_logic Shorts rules block bytes/);
  assert.match(source, /10 filter_logic renderer discovery block lines/);
  assert.match(source, /464 filter_logic renderer discovery block bytes/);
  assert.match(source, /21 filter_logic unwrap preferred nested block lines/);
  assert.match(source, /932 filter_logic unwrap preferred nested block bytes/);
  assert.match(source, /5 filter_logic build candidate Shorts block lines/);
  assert.match(source, /219 filter_logic build candidate Shorts block bytes/);
  assert.match(source, /12 filter_logic videoChannelMap Shorts block lines/);
  assert.match(source, /556 filter_logic videoChannelMap Shorts block bytes/);
  assert.match(source, /5 filter_logic hideAllShorts decision block lines/);
  assert.match(source, /326 filter_logic hideAllShorts decision block bytes/);
  assert.match(source, /5 filter_logic whitelist Shorts exception block lines/);
  assert.match(source, /251 filter_logic whitelist Shorts exception block bytes/);
  assert.match(source, /10 seed active JSON rules block lines/);
  assert.match(source, /634 seed active JSON rules block bytes/);
  assert.match(source, /27 DOM fallback active boolean keys block lines/);
  assert.match(source, /874 DOM fallback active boolean keys block bytes/);
  assert.match(source, /4 DOM fallback hidden marker block lines/);
  assert.match(source, /125 DOM fallback hidden marker block bytes/);
  assert.match(source, /2 DOM fallback restore selector block lines/);
  assert.match(source, /80 DOM fallback restore selector block bytes/);
  assert.match(source, /12 DOM fallback disguised Shorts detection block lines/);
  assert.match(source, /788 DOM fallback disguised Shorts detection block bytes/);
  assert.match(source, /18 DOM fallback global short video decision block lines/);
  assert.match(source, /885 DOM fallback global short video decision block bytes/);
  assert.match(source, /275 DOM fallback Shorts section block lines/);
  assert.match(source, /13317 DOM fallback Shorts section block bytes/);
  assert.match(source, /35 background boolean pass-through block lines/);
  assert.match(source, /3596 background boolean pass-through block bytes/);
  assert.match(source, /1 background install default block line/);
  assert.match(source, /34 background install default block bytes/);
  assert.match(source, /16 background storage refresh keys block lines/);
  assert.match(source, /461 background storage refresh keys block bytes/);
  assert.match(source, /2 filter_logic total hideAllShorts tokens/);
  assert.match(source, /7 filter_logic total shortsLockupViewModelV2 tokens/);
  assert.match(source, /5 seed total hideAllShorts tokens/);
  assert.match(source, /8 DOM fallback total hideAllShorts tokens/);
  assert.match(source, /1 DOM fallback total hideShorts token/);
  assert.match(source, /15 DOM fallback total hidden-by-hide-all-shorts marker tokens/);
  assert.match(source, /8 background total hideAllShorts tokens/);
  assert.match(source, /6 background total hideShorts tokens/);
  assert.match(source, /6 runtime hideAllShorts fixtures/);
  assert.match(source, /discovered direct `shortsLockupViewModel` and `reelItemRenderer` are removed/);
  assert.match(source, /direct `shortsLockupViewModelV2` remains because recursive discovery only checks `Renderer` and `ViewModel` suffixes/);
  assert.match(source, /nested `shortsLockupViewModelV2` under `richItemRenderer` is removed through unwrap/);
  assert.match(source, /ordinary `videoRenderer` rows with `\/shorts\/` URL evidence remain visible to the JSON engine/);
  assert.match(source, /background compiles V4 `hideShorts` into `hideAllShorts`/);
  assert.match(source, /DOM fallback owns separate global Shorts selectors, markers, restore cleanup, disguised-card detection, and yielding loops/);
  assert.match(source, /hide-all-Shorts contracts/);
  assert.match(source, /renderer discovery policies/);
  assert.match(source, /JSON\/DOM parity reports/);
  assert.match(source, /V2 leak reports/);
  assert.match(source, /disguised Shorts policies/);
  assert.match(source, /marker restore proof/);
  assert.match(source, /`jsonFirstHideAllShortsContract`, `jsonFirstHideAllShortsDecisionReport`, `jsonFirstHideAllShortsRendererDiscoveryPolicy`, `jsonFirstHideAllShortsJsonDomParityReport`, `jsonFirstHideAllShortsV2LeakReport`, `jsonFirstHideAllShortsDisguisedShortPolicy`, `jsonFirstHideAllShortsNoWorkBudget`, `jsonFirstHideAllShortsMarkerRestoreProof`, `jsonFirstHideAllShortsFixtureProvenance`, or `jsonFirstHideAllShortsMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideAllComments boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideAllComments boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_ALL_COMMENTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-all-comments-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-all-comments proof/);
  assert.match(source, /4 hideAllComments boundary source files/);
  assert.match(source, /21 hideAllComments source\/effect blocks/);
  assert.match(source, /9 filter_logic comment rules block lines/);
  assert.match(source, /380 filter_logic comment rules block bytes/);
  assert.match(source, /1 filter_logic candidate comment flag block line/);
  assert.match(source, /100 filter_logic candidate comment flag block bytes/);
  assert.match(source, /105 filter_logic whitelist comment bypass block lines/);
  assert.match(source, /5392 filter_logic whitelist comment bypass block bytes/);
  assert.match(source, /34 filter_logic comment decision block lines/);
  assert.match(source, /1947 filter_logic comment decision block bytes/);
  assert.match(source, /10 seed active JSON rules block lines/);
  assert.match(source, /634 seed active JSON rules block bytes/);
  assert.match(source, /7 seed engine settings log block lines/);
  assert.match(source, /394 seed engine settings log block bytes/);
  assert.match(source, /28 seed basic comment hide block lines/);
  assert.match(source, /1574 seed basic comment hide block bytes/);
  assert.match(source, /37 seed comment continuation block lines/);
  assert.match(source, /2266 seed comment continuation block bytes/);
  assert.match(source, /16 DOM fallback comments CSS block lines/);
  assert.match(source, /671 DOM fallback comments CSS block bytes/);
  assert.match(source, /30 DOM fallback collect mobile comments block lines/);
  assert.match(source, /1386 DOM fallback collect mobile comments block bytes/);
  assert.match(source, /42 DOM fallback comments global block lines/);
  assert.match(source, /1934 DOM fallback comments global block bytes/);
  assert.match(source, /17 DOM fallback comments restore and inputs block lines/);
  assert.match(source, /781 DOM fallback comments restore and inputs block bytes/);
  assert.match(source, /76 DOM fallback comments thread filtering block lines/);
  assert.match(source, /3674 DOM fallback comments thread filtering block bytes/);
  assert.match(source, /77 DOM fallback comments renderer filtering block lines/);
  assert.match(source, /4223 DOM fallback comments renderer filtering block bytes/);
  assert.match(source, /99 DOM fallback comments view-model filtering block lines/);
  assert.match(source, /5312 DOM fallback comments view-model filtering block bytes/);
  assert.match(source, /28 DOM fallback active boolean keys block lines/);
  assert.match(source, /905 DOM fallback active boolean keys block bytes/);
  assert.match(source, /44 background storage read keys block lines/);
  assert.match(source, /1408 background storage read keys block bytes/);
  assert.match(source, /35 background comments keyword fallback block lines/);
  assert.match(source, /1961 background comments keyword fallback block bytes/);
  assert.match(source, /22 background V4 comments compile block lines/);
  assert.match(source, /1515 background V4 comments compile block bytes/);
  assert.match(source, /3 background boolean comments block lines/);
  assert.match(source, /182 background boolean comments block bytes/);
  assert.match(source, /16 background storage refresh keys block lines/);
  assert.match(source, /461 background storage refresh keys block bytes/);
  assert.match(source, /3 filter_logic total hideAllComments tokens/);
  assert.match(source, /1 filter_logic total filterComments token/);
  assert.match(source, /2 filter_logic total filterKeywordsComments tokens/);
  assert.match(source, /2 filter_logic total commentRenderer tokens/);
  assert.match(source, /1 filter_logic total commentThreadRenderer token/);
  assert.match(source, /0 filter_logic total commentViewModel tokens/);
  assert.match(source, /9 seed total hideAllComments tokens/);
  assert.match(source, /2 seed total filterKeywordsComments tokens/);
  assert.match(source, /1 seed total commentRenderer token/);
  assert.match(source, /1 seed total commentThreadRenderer token/);
  assert.match(source, /3 DOM fallback total hideAllComments tokens/);
  assert.match(source, /1 DOM fallback total hideComments token/);
  assert.match(source, /1 DOM fallback total filterComments token/);
  assert.match(source, /3 DOM fallback total filterKeywordsComments tokens/);
  assert.match(source, /3 DOM fallback total commentRenderer tokens/);
  assert.match(source, /2 DOM fallback total commentViewModel tokens/);
  assert.match(source, /5 DOM fallback total mobile-comments-card marker tokens/);
  assert.match(source, /9 background total hideAllComments tokens/);
  assert.match(source, /15 background total hideComments tokens/);
  assert.match(source, /12 background total filterComments tokens/);
  assert.match(source, /11 background total filterKeywordsComments tokens/);
  assert.match(source, /7 runtime hideAllComments fixtures/);
  assert.match(source, /direct `commentRenderer` and `commentThreadRenderer` are removed/);
  assert.match(source, /`itemSectionRenderer` comment section remains as an empty structural wrapper/);
  assert.match(source, /ordinary `videoRenderer` rows remain visible when only `hideAllComments` is true/);
  assert.match(source, /direct `commentViewModel` rows remain under `hideAllComments` and comment keyword rules/);
  assert.match(source, /`filterKeywordsComments` removes matching comments without removing ordinary videos/);
  assert.match(source, /comment author channel rules remove matching comment rows/);
  assert.match(source, /background compiles V4 `hideComments` into `hideAllComments`/);
  assert.match(source, /seed wakes JSON work and rewrites comment continuations/);
  assert.match(source, /DOM fallback owns separate comment containers, threads, renderers, ViewModels, and mobile card markers/);
  assert.match(source, /hide-all-comments contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM comment parity reports/);
  assert.match(source, /modern comment ViewModel leak reports/);
  assert.match(source, /structural wrapper cleanup policies/);
  assert.match(source, /comment continuation response contracts/);
  assert.match(source, /marker restore proof/);
  assert.match(source, /`jsonFirstHideAllCommentsContract`, `jsonFirstHideAllCommentsDecisionReport`, `jsonFirstCommentsRendererInventoryPolicy`, `jsonFirstCommentsJsonDomParityReport`, `jsonFirstCommentsViewModelLeakReport`, `jsonFirstCommentsStructuralWrapperPolicy`, `jsonFirstCommentsContinuationResponseContract`, `jsonFirstCommentsNoWorkBudget`, `jsonFirstCommentsMarkerRestoreProof`, `jsonFirstCommentsFixtureProvenance`, or `jsonFirstCommentsMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideMixPlaylists boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideMixPlaylists boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_MIX_PLAYLISTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-mix-playlists-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-mix-playlists proof/);
  assert.match(source, /4 hideMixPlaylists boundary source files/);
  assert.match(source, /16 hideMixPlaylists source\/effect blocks/);
  assert.match(source, /17 filter_logic radio rules block lines/);
  assert.match(source, /833 filter_logic radio rules block bytes/);
  assert.match(source, /4 filter_logic unwrap mix nested block lines/);
  assert.match(source, /183 filter_logic unwrap mix nested block bytes/);
  assert.match(source, /15 filter_logic extract playlist id block lines/);
  assert.match(source, /676 filter_logic extract playlist id block bytes/);
  assert.match(source, /7 filter_logic candidate mix flag block lines/);
  assert.match(source, /314 filter_logic candidate mix flag block bytes/);
  assert.match(source, /48 DOM fallback mix helper block lines/);
  assert.match(source, /2207 DOM fallback mix helper block bytes/);
  assert.match(source, /15 DOM fallback mix CSS rules block lines/);
  assert.match(source, /588 DOM fallback mix CSS rules block bytes/);
  assert.match(source, /27 DOM fallback playlist cards exclude radio block lines/);
  assert.match(source, /1459 DOM fallback playlist cards exclude radio block bytes/);
  assert.match(source, /21 DOM fallback mix chip direct block lines/);
  assert.match(source, /1127 DOM fallback mix chip direct block bytes/);
  assert.match(source, /14 DOM fallback mix card decision block lines/);
  assert.match(source, /566 DOM fallback mix card decision block bytes/);
  assert.match(source, /24 DOM fallback chip filtering block lines/);
  assert.match(source, /968 DOM fallback chip filtering block bytes/);
  assert.match(source, /0 filter_logic total hideMixPlaylists tokens/);
  assert.match(source, /0 seed total hideMixPlaylists tokens/);
  assert.match(source, /3 DOM fallback total hidden-by-mix-radio marker tokens/);
  assert.match(source, /10 DOM fallback total start_radio markers/);
  assert.match(source, /12 background total hideMixPlaylists tokens/);
  assert.match(source, /6 runtime hideMixPlaylists fixtures/);
  assert.match(source, /does not remove JSON `radioRenderer` rows/);
  assert.match(source, /does not remove JSON `compactRadioRenderer` rows/);
  assert.match(source, /playlist rows with `RD` playlist ids/);
  assert.match(source, /Mix-like titles/);
  assert.match(source, /ordinary playlist and video rows remain visible/);
  assert.match(source, /classifies radio, compact radio, `RD` playlist ids, and Mix title-prefix playlist rows as `isMix`/);
  assert.match(source, /background compiles the setting while storage refresh keys omit it/);
  assert.match(source, /`data-filtertube-hidden-by-mix-radio` marker/);
  assert.match(source, /hide-mix-playlists contracts/);
  assert.match(source, /JSON\/DOM Mix parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /stale background cache reports/);
  assert.match(source, /`jsonFirstHideMixPlaylistsContract`, `jsonFirstHideMixPlaylistsDecisionReport`, `jsonFirstMixRendererInventoryPolicy`, `jsonFirstMixJsonDomParityReport`, `jsonFirstMixDomOnlyPolicy`, `jsonFirstMixBackgroundCacheReport`, `jsonFirstMixPlaylistInteractionPolicy`, `jsonFirstMixNoWorkBudget`, `jsonFirstMixMarkerRestoreProof`, `jsonFirstMixFixtureProvenance`, or `jsonFirstMixMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideMembersOnly boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideMembersOnly boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_MEMBERS_ONLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-members-only-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-members-only proof/);
  assert.match(source, /5 hideMembersOnly boundary source files/);
  assert.match(source, /9 hideMembersOnly source\/effect blocks/);
  assert.match(source, /79 filter_logic candidate builder block lines/);
  assert.match(source, /4266 filter_logic candidate builder block bytes/);
  assert.match(source, /10 seed active JSON rules block lines/);
  assert.match(source, /634 seed active JSON rules block bytes/);
  assert.match(source, /41 DOM fallback members CSS rules block lines/);
  assert.match(source, /2483 DOM fallback members CSS rules block bytes/);
  assert.match(source, /81 DOM fallback members direct block lines/);
  assert.match(source, /5060 DOM fallback members direct block bytes/);
  assert.match(source, /35 background boolean pass-through block lines/);
  assert.match(source, /3596 background boolean pass-through block bytes/);
  assert.match(source, /16 background storage refresh keys block lines/);
  assert.match(source, /461 background storage refresh keys block bytes/);
  assert.match(source, /38 settings_shared settings keys block lines/);
  assert.match(source, /1031 settings_shared settings keys block bytes/);
  assert.match(source, /54 settings_shared build compiled settings block lines/);
  assert.match(source, /1916 settings_shared build compiled settings block bytes/);
  assert.match(source, /0 filter_logic total hideMembersOnly tokens/);
  assert.match(source, /0 seed total hideMembersOnly tokens/);
  assert.match(source, /3 DOM fallback total hideMembersOnly tokens/);
  assert.match(source, /13 DOM fallback total yt-badge-shape--membership tokens/);
  assert.match(source, /7 DOM fallback total data-filtertube-members-only-hidden marker tokens/);
  assert.match(source, /3 DOM fallback total UUMO markers/);
  assert.match(source, /13 background total hideMembersOnly tokens/);
  assert.match(source, /23 settings_shared total hideMembersOnly tokens/);
  assert.match(source, /6 runtime hideMembersOnly fixtures/);
  assert.match(source, /does not remove JSON `videoRenderer` rows with Members-only badge or accessibility evidence/);
  assert.match(source, /does not remove JSON `playlistRenderer` rows titled `Members-only videos` or carrying a `UUMO` playlist id/);
  assert.match(source, /generic metadata while exposing no `isMembersOnly` field/);
  assert.match(source, /background compiles and refreshes the setting/);
  assert.match(source, /DOM fallback owns membership badge selectors, `UUMO` selectors, broad watch\/shelf targets/);
  assert.match(source, /hide-members-only contracts/);
  assert.match(source, /JSON\/DOM parity reports/);
  assert.match(source, /broad-hide reports/);
  assert.match(source, /settings parity reports/);
  assert.match(source, /`jsonFirstHideMembersOnlyContract`, `jsonFirstHideMembersOnlyDecisionReport`, `jsonFirstMembersOnlyRendererInventoryPolicy`, `jsonFirstMembersOnlyJsonDomParityReport`, `jsonFirstMembersOnlyDomOnlyPolicy`, `jsonFirstMembersOnlyBroadHideReport`, `jsonFirstMembersOnlyNoWorkBudget`, `jsonFirstMembersOnlyMarkerRestoreProof`, `jsonFirstMembersOnlySettingsParityReport`, `jsonFirstMembersOnlyFixtureProvenance`, or `jsonFirstMembersOnlyMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideSponsoredCards boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideSponsoredCards boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_SPONSORED_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-sponsored-cards-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-sponsored-cards proof/);
  assert.match(source, /5 hideSponsoredCards boundary source files/);
  assert.match(source, /7 hideSponsoredCards source\/effect blocks/);
  assert.match(source, /10 seed active JSON rules block lines/);
  assert.match(source, /634 seed active JSON rules block bytes/);
  assert.match(source, /15 DOM fallback sponsored CSS rules block lines/);
  assert.match(source, /567 DOM fallback sponsored CSS rules block bytes/);
  assert.match(source, /28 DOM fallback active boolean keys block lines/);
  assert.match(source, /905 DOM fallback active boolean keys block bytes/);
  assert.match(source, /35 background boolean pass-through block lines/);
  assert.match(source, /3596 background boolean pass-through block bytes/);
  assert.match(source, /16 background storage refresh keys block lines/);
  assert.match(source, /461 background storage refresh keys block bytes/);
  assert.match(source, /38 settings_shared settings keys block lines/);
  assert.match(source, /1031 settings_shared settings keys block bytes/);
  assert.match(source, /54 settings_shared build compiled settings block lines/);
  assert.match(source, /1916 settings_shared build compiled settings block bytes/);
  assert.match(source, /0 filter_logic total hideSponsoredCards tokens/);
  assert.match(source, /0 filter_logic total sponsored-ad-renderer tokens/);
  assert.match(source, /0 seed total hideSponsoredCards tokens/);
  assert.match(source, /0 seed total sponsored-ad-renderer tokens/);
  assert.match(source, /2 DOM fallback total hideSponsoredCards tokens/);
  assert.match(source, /1 DOM fallback total ytd-ad-slot-renderer token/);
  assert.match(source, /2 DOM fallback total ytd-promoted selector tokens/);
  assert.match(source, /1 DOM fallback total ytd-search-pyv-renderer token/);
  assert.match(source, /1 DOM fallback total ytd-display-ad-renderer token/);
  assert.match(source, /1 DOM fallback total ytd-companion-slot-renderer token/);
  assert.match(source, /1 DOM fallback total engagement-panel-ads token/);
  assert.match(source, /13 background total hideSponsoredCards tokens/);
  assert.match(source, /23 settings_shared total hideSponsoredCards tokens/);
  assert.match(source, /5 runtime hideSponsoredCards fixtures/);
  assert.match(source, /does not remove JSON `adSlotRenderer`, `promotedSparklesWebRenderer`, or `searchPyvRenderer` rows/);
  assert.match(source, /does not remove nested promoted content inside an ad slot wrapper/);
  assert.match(source, /ordinary video rows remain visible/);
  assert.match(source, /seed active JSON rules have no sponsored-card decision/);
  assert.match(source, /DOM fallback owns the ad slot, promoted sparkles, search PYV, display ad, companion ad, action companion ad, and engagement-panel ad selectors/);
  assert.match(source, /hide-sponsored-cards contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /ad-surface reports/);
  assert.match(source, /CSS target reports/);
  assert.match(source, /`jsonFirstHideSponsoredCardsContract`, `jsonFirstHideSponsoredCardsDecisionReport`, `jsonFirstSponsoredRendererInventoryPolicy`, `jsonFirstSponsoredJsonDomParityReport`, `jsonFirstSponsoredDomOnlyPolicy`, `jsonFirstSponsoredAdSurfaceReport`, `jsonFirstSponsoredNoWorkBudget`, `jsonFirstSponsoredCssTargetReport`, `jsonFirstSponsoredSettingsParityReport`, `jsonFirstSponsoredFixtureProvenance`, or `jsonFirstSponsoredMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideHomeFeed boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideHomeFeed boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_HOME_FEED_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-home-feed-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-home-feed proof/);
  assert.match(source, /5 hideHomeFeed boundary source files/);
  assert.match(source, /9 hideHomeFeed source\/effect blocks/);
  assert.match(source, /37 seed desktop home browse skip block lines/);
  assert.match(source, /1625 seed desktop home browse skip block bytes/);
  assert.match(source, /12 DOM fallback home-feed CSS rules block lines/);
  assert.match(source, /622 DOM fallback home-feed CSS rules block bytes/);
  assert.match(source, /23 DOM fallback home-feed marker block lines/);
  assert.match(source, /1286 DOM fallback home-feed marker block bytes/);
  assert.match(source, /0 filter_logic total hideHomeFeed tokens/);
  assert.match(source, /0 seed total hideHomeFeed tokens/);
  assert.match(source, /3 DOM fallback total hideHomeFeed tokens/);
  assert.match(source, /4 DOM fallback total data-filtertube-hidden-by-hide-home-feed tokens/);
  assert.match(source, /4 DOM fallback total ytd-browse home selector tokens/);
  assert.match(source, /9 DOM fallback total data-filtertube-route-home tokens/);
  assert.match(source, /13 background total hideHomeFeed tokens/);
  assert.match(source, /23 settings_shared total hideHomeFeed tokens/);
  assert.match(source, /5 runtime hideHomeFeed fixtures/);
  assert.match(source, /does not remove JSON `richItemRenderer`, home section, or lockup rows/);
  assert.match(source, /desktop home browse continuations with only `hideHomeFeed` run harvest-only/);
  assert.match(source, /active keyword rule call the JSON engine/);
  assert.match(source, /mobile home browse continuations with only `hideHomeFeed` still call the JSON engine/);
  assert.match(source, /seed active JSON rules have no hide-home-feed decision/);
  assert.match(source, /DOM fallback owns desktop `ytd-browse\[page-subtype="home"\]`, mobile `data-filtertube-route-home`, and `data-filtertube-hidden-by-hide-home-feed` marker behavior/);
  assert.match(source, /hide-home-feed contracts/);
  assert.match(source, /route policies/);
  assert.match(source, /JSON\/DOM parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /mobile parity reports/);
  assert.match(source, /`jsonFirstHideHomeFeedContract`, `jsonFirstHideHomeFeedDecisionReport`, `jsonFirstHomeFeedRoutePolicy`, `jsonFirstHomeFeedJsonDomParityReport`, `jsonFirstHomeFeedDomOnlyPolicy`, `jsonFirstHomeFeedNoWorkBudget`, `jsonFirstHomeFeedMarkerRestoreProof`, `jsonFirstHomeFeedMobileParityReport`, `jsonFirstHomeFeedFixtureProvenance`, or `jsonFirstHomeFeedMetricArtifact`/);
});

test('active goal completion audit records JSON-first hidePlaylistCards boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hidePlaylistCards boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_PLAYLIST_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-playlist-cards-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-playlist-cards proof/);
  assert.match(source, /5 hidePlaylistCards boundary source files/);
  assert.match(source, /8 hidePlaylistCards source\/effect blocks/);
  assert.match(source, /16 DOM fallback playlist-card CSS rules block lines/);
  assert.match(source, /998 DOM fallback playlist-card CSS rules block bytes/);
  assert.match(source, /26 DOM fallback playlist-card direct block lines/);
  assert.match(source, /1457 DOM fallback playlist-card direct block bytes/);
  assert.match(source, /0 filter_logic total hidePlaylistCards tokens/);
  assert.match(source, /0 seed total hidePlaylistCards tokens/);
  assert.match(source, /3 DOM fallback total hidePlaylistCards tokens/);
  assert.match(source, /1 DOM fallback total ytd-playlist-renderer token/);
  assert.match(source, /1 DOM fallback total ytd-grid-playlist-renderer token/);
  assert.match(source, /1 DOM fallback total ytd-compact-playlist-renderer token/);
  assert.match(source, /19 DOM fallback total yt-lockup-view-model tokens/);
  assert.match(source, /2 DOM fallback total yt-collection-thumbnail-view-model tokens/);
  assert.match(source, /2 DOM fallback total yt-collections-stack tokens/);
  assert.match(source, /10 DOM fallback total start_radio=1 tokens/);
  assert.match(source, /12 background total hidePlaylistCards tokens/);
  assert.match(source, /23 settings_shared total hidePlaylistCards tokens/);
  assert.match(source, /6 runtime hidePlaylistCards fixtures/);
  assert.match(source, /does not remove JSON `playlistRenderer`, `compactPlaylistRenderer`, collection-stack `lockupViewModel`, or radio renderer rows/);
  assert.match(source, /desktop home browse continuations with only `hidePlaylistCards` run harvest-only/);
  assert.match(source, /active keyword rule call the JSON engine/);
  assert.match(source, /seed active JSON rules have no hide-playlist-cards decision/);
  assert.match(source, /background compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /DOM fallback owns classic playlist selectors, collection-stack lockup selectors, direct `list=` lockup hiding, shelf\/horizontal-list container hiding, and `start_radio=1` Mix\/radio exclusion/);
  assert.match(source, /hide-playlist-cards contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /Mix exclusion policies/);
  assert.match(source, /settings parity reports/);
  assert.match(source, /`jsonFirstHidePlaylistCardsContract`, `jsonFirstHidePlaylistCardsDecisionReport`, `jsonFirstPlaylistCardsRendererInventoryPolicy`, `jsonFirstPlaylistCardsJsonDomParityReport`, `jsonFirstPlaylistCardsDomOnlyPolicy`, `jsonFirstPlaylistCardsNoWorkBudget`, `jsonFirstPlaylistCardsMixExclusionPolicy`, `jsonFirstPlaylistCardsMarkerRestoreProof`, `jsonFirstPlaylistCardsSettingsParityReport`, `jsonFirstPlaylistCardsFixtureProvenance`, or `jsonFirstPlaylistCardsMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideRecommended boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideRecommended boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_RECOMMENDED_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-recommended-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-recommended proof/);
  assert.match(source, /6 hideRecommended boundary source files/);
  assert.match(source, /9 hideRecommended source\/effect blocks/);
  assert.match(source, /8 DOM fallback recommended CSS rules block lines/);
  assert.match(source, /215 DOM fallback recommended CSS rules block bytes/);
  assert.match(source, /44 background storage read keys block lines/);
  assert.match(source, /1408 background storage read keys block bytes/);
  assert.match(source, /57 settings_shared build compiled settings block lines/);
  assert.match(source, /2056 settings_shared build compiled settings block bytes/);
  assert.match(source, /44 content bridge storage refresh keys block lines/);
  assert.match(source, /1263 content bridge storage refresh keys block bytes/);
  assert.match(source, /0 filter_logic total hideRecommended tokens/);
  assert.match(source, /0 seed total hideRecommended tokens/);
  assert.match(source, /2 DOM fallback total hideRecommended tokens/);
  assert.match(source, /1 DOM fallback total #related token/);
  assert.match(source, /1 DOM fallback total #items\.ytd-watch-next-secondary-results-renderer token/);
  assert.match(source, /12 background total hideRecommended tokens/);
  assert.match(source, /23 settings_shared total hideRecommended tokens/);
  assert.match(source, /1 bridge_settings total hideRecommended token/);
  assert.match(source, /9 filter_logic total compactVideoRenderer tokens/);
  assert.match(source, /4 filter_logic total watchCardCompactVideoRenderer tokens/);
  assert.match(source, /4 filter_logic total endScreenVideoRenderer tokens/);
  assert.match(source, /6 runtime hideRecommended fixtures/);
  assert.match(source, /does not remove JSON `compactVideoRenderer`, `watchCardCompactVideoRenderer`, or nested `secondarySearchContainerRenderer` rows/);
  assert.match(source, /watch recommendation JSON filtering currently belongs to ordinary keyword rules, not `hideRecommended`/);
  assert.match(source, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideRecommended` enabled/);
  assert.match(source, /seed active JSON rules have no hide-recommended decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `#related` plus `#items\.ytd-watch-next-secondary-results-renderer`/);
  assert.match(source, /hide-recommended contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM watch recommendation parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /endpoint no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /`jsonFirstHideRecommendedContract`, `jsonFirstHideRecommendedDecisionReport`, `jsonFirstWatchRecommendationsRendererInventoryPolicy`, `jsonFirstWatchRecommendationsJsonDomParityReport`, `jsonFirstWatchRecommendationsDomOnlyPolicy`, `jsonFirstWatchRecommendationsNoWorkBudget`, `jsonFirstWatchRecommendationsCacheInvalidationReport`, `jsonFirstWatchRecommendationsRoutePolicy`, `jsonFirstWatchRecommendationsSettingsParityReport`, `jsonFirstWatchRecommendationsFixtureProvenance`, or `jsonFirstWatchRecommendationsMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideVideoSidebar boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideVideoSidebar boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_SIDEBAR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-video-sidebar-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-video-sidebar proof/);
  assert.match(source, /6 hideVideoSidebar boundary source files/);
  assert.match(source, /9 hideVideoSidebar source\/effect blocks/);
  assert.match(source, /7 DOM fallback video-sidebar CSS rules block lines/);
  assert.match(source, /172 DOM fallback video-sidebar CSS rules block bytes/);
  assert.match(source, /44 background storage read keys block lines/);
  assert.match(source, /1408 background storage read keys block bytes/);
  assert.match(source, /57 settings_shared build compiled settings block lines/);
  assert.match(source, /2056 settings_shared build compiled settings block bytes/);
  assert.match(source, /44 content bridge storage refresh keys block lines/);
  assert.match(source, /1263 content bridge storage refresh keys block bytes/);
  assert.match(source, /0 filter_logic total hideVideoSidebar tokens/);
  assert.match(source, /0 seed total hideVideoSidebar tokens/);
  assert.match(source, /2 DOM fallback total hideVideoSidebar tokens/);
  assert.match(source, /1 DOM fallback total #secondary\.ytd-watch-flexy token/);
  assert.match(source, /12 background total hideVideoSidebar tokens/);
  assert.match(source, /23 settings_shared total hideVideoSidebar tokens/);
  assert.match(source, /1 bridge_settings total hideVideoSidebar token/);
  assert.match(source, /9 filter_logic total compactVideoRenderer tokens/);
  assert.match(source, /4 filter_logic total watchCardCompactVideoRenderer tokens/);
  assert.match(source, /4 filter_logic total endScreenVideoRenderer tokens/);
  assert.match(source, /6 runtime hideVideoSidebar fixtures/);
  assert.match(source, /does not remove JSON `compactVideoRenderer`, `watchCardCompactVideoRenderer`, or nested `secondarySearchContainerRenderer` rows/);
  assert.match(source, /watch sidebar JSON filtering currently belongs to ordinary keyword rules, not `hideVideoSidebar`/);
  assert.match(source, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideVideoSidebar` enabled/);
  assert.match(source, /seed active JSON rules have no hide-video-sidebar decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `#secondary\.ytd-watch-flexy`/);
  assert.match(source, /hide-video-sidebar contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM watch sidebar parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /endpoint no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /`jsonFirstHideVideoSidebarContract`, `jsonFirstHideVideoSidebarDecisionReport`, `jsonFirstWatchSidebarRendererInventoryPolicy`, `jsonFirstWatchSidebarJsonDomParityReport`, `jsonFirstWatchSidebarDomOnlyPolicy`, `jsonFirstWatchSidebarNoWorkBudget`, `jsonFirstWatchSidebarCacheInvalidationReport`, `jsonFirstWatchSidebarRoutePolicy`, `jsonFirstWatchSidebarSettingsParityReport`, `jsonFirstWatchSidebarFixtureProvenance`, or `jsonFirstWatchSidebarMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideLiveChat boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideLiveChat boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_LIVE_CHAT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-live-chat-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-live-chat proof/);
  assert.match(source, /6 hideLiveChat boundary source files/);
  assert.match(source, /9 hideLiveChat source\/effect blocks/);
  assert.match(source, /8 DOM fallback live-chat CSS rules block lines/);
  assert.match(source, /195 DOM fallback live-chat CSS rules block bytes/);
  assert.match(source, /44 background storage read keys block lines/);
  assert.match(source, /1408 background storage read keys block bytes/);
  assert.match(source, /57 settings_shared build compiled settings block lines/);
  assert.match(source, /2056 settings_shared build compiled settings block bytes/);
  assert.match(source, /44 content bridge storage refresh keys block lines/);
  assert.match(source, /1263 content bridge storage refresh keys block bytes/);
  assert.match(source, /0 filter_logic total hideLiveChat tokens/);
  assert.match(source, /0 seed total hideLiveChat tokens/);
  assert.match(source, /2 DOM fallback total hideLiveChat tokens/);
  assert.match(source, /1 DOM fallback total ytd-live-chat-frame#chat token/);
  assert.match(source, /1 DOM fallback total #chat-container token/);
  assert.match(source, /12 background total hideLiveChat tokens/);
  assert.match(source, /23 settings_shared total hideLiveChat tokens/);
  assert.match(source, /1 bridge_settings total hideLiveChat token/);
  assert.match(source, /0 filter_logic total engagementPanelSectionListRenderer tokens/);
  assert.match(source, /0 filter_logic total liveChatRenderer tokens/);
  assert.match(source, /6 runtime hideLiveChat fixtures/);
  assert.match(source, /does not remove JSON `engagementPanelSectionListRenderer` or nested `liveChatRenderer` rows/);
  assert.match(source, /ordinary keyword rules can remove a neighboring `compactVideoRenderer` row while live chat JSON remains/);
  assert.match(source, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideLiveChat` enabled/);
  assert.match(source, /seed active JSON rules have no hide-live-chat decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `ytd-live-chat-frame#chat` and `#chat-container`/);
  assert.match(source, /hide-live-chat contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM live chat parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /endpoint no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /`jsonFirstHideLiveChatContract`, `jsonFirstHideLiveChatDecisionReport`, `jsonFirstLiveChatRendererInventoryPolicy`, `jsonFirstLiveChatJsonDomParityReport`, `jsonFirstLiveChatDomOnlyPolicy`, `jsonFirstLiveChatNoWorkBudget`, `jsonFirstLiveChatCacheInvalidationReport`, `jsonFirstLiveChatRoutePolicy`, `jsonFirstLiveChatSettingsParityReport`, `jsonFirstLiveChatFixtureProvenance`, or `jsonFirstLiveChatMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideWatchPlaylistPanel boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideWatchPlaylistPanel boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_WATCH_PLAYLIST_PANEL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-watch-playlist-panel-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-watch-playlist-panel proof/);
  assert.match(source, /6 hideWatchPlaylistPanel boundary source files/);
  assert.match(source, /11 hideWatchPlaylistPanel source\/effect blocks/);
  assert.match(source, /7 filter_logic shared video renderer rules block lines/);
  assert.match(source, /344 filter_logic shared video renderer rules block bytes/);
  assert.match(source, /20 filter_logic playlist panel harvest block lines/);
  assert.match(source, /949 filter_logic playlist panel harvest block bytes/);
  assert.match(source, /9 DOM fallback watch-playlist-panel CSS rules block lines/);
  assert.match(source, /264 DOM fallback watch-playlist-panel CSS rules block bytes/);
  assert.match(source, /44 background storage read keys block lines/);
  assert.match(source, /1408 background storage read keys block bytes/);
  assert.match(source, /57 settings_shared build compiled settings block lines/);
  assert.match(source, /2056 settings_shared build compiled settings block bytes/);
  assert.match(source, /44 content bridge storage refresh keys block lines/);
  assert.match(source, /1263 content bridge storage refresh keys block bytes/);
  assert.match(source, /0 filter_logic total hideWatchPlaylistPanel tokens/);
  assert.match(source, /0 seed total hideWatchPlaylistPanel tokens/);
  assert.match(source, /2 DOM fallback total hideWatchPlaylistPanel tokens/);
  assert.match(source, /12 background total hideWatchPlaylistPanel tokens/);
  assert.match(source, /23 settings_shared total hideWatchPlaylistPanel tokens/);
  assert.match(source, /1 bridge_settings total hideWatchPlaylistPanel token/);
  assert.match(source, /1 filter_logic total playlistPanelRenderer token/);
  assert.match(source, /6 filter_logic total playlistPanelVideoRenderer tokens/);
  assert.match(source, /2 DOM fallback total ytd-playlist-panel-renderer tokens/);
  assert.match(source, /4 DOM fallback total ytm-playlist-panel-renderer tokens/);
  assert.match(source, /2 DOM fallback total ytm-playlist-panel-renderer-v2 tokens/);
  assert.match(source, /6 runtime hideWatchPlaylistPanel fixtures/);
  assert.match(source, /does not remove JSON `playlistPanelRenderer` or nested `playlistPanelVideoRenderer` rows/);
  assert.match(source, /ordinary keyword rules can remove a nested `playlistPanelVideoRenderer` row while the playlist panel header remains/);
  assert.match(source, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideWatchPlaylistPanel` enabled/);
  assert.match(source, /seed active JSON rules have no hide-watch-playlist-panel decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `ytd-playlist-panel-renderer`, `ytm-playlist-panel-renderer`, and `ytm-playlist-panel-renderer-v2`/);
  assert.match(source, /hide-watch-playlist-panel contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM watch playlist panel parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /selected\/current row reports/);
  assert.match(source, /endpoint no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /route policies/);
  assert.match(source, /first-class hide-watch-playlist-panel authority gates/);
  assert.match(source, /`jsonFirstHideWatchPlaylistPanelContract`, `jsonFirstHideWatchPlaylistPanelDecisionReport`, `jsonFirstWatchPlaylistPanelRendererInventoryPolicy`, `jsonFirstWatchPlaylistPanelJsonDomParityReport`, `jsonFirstWatchPlaylistPanelDomOnlyPolicy`, `jsonFirstWatchPlaylistPanelNoWorkBudget`, `jsonFirstWatchPlaylistPanelCacheInvalidationReport`, `jsonFirstWatchPlaylistPanelRoutePolicy`, `jsonFirstWatchPlaylistPanelSettingsParityReport`, `jsonFirstWatchPlaylistPanelFixtureProvenance`, or `jsonFirstWatchPlaylistPanelMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideVideoInfo boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideVideoInfo boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_INFO_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-video-info-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-video-info proof/);
  assert.match(source, /6 hideVideoInfo boundary source files/);
  assert.match(source, /11 hideVideoInfo source\/effect blocks/);
  assert.match(source, /10 filter_logic watch primary metadata rules block lines/);
  assert.match(source, /431 filter_logic watch primary metadata rules block bytes/);
  assert.match(source, /6 filter_logic whitelist watch scaffolding block lines/);
  assert.match(source, /449 filter_logic whitelist watch scaffolding block bytes/);
  assert.match(source, /49 DOM fallback video-info CSS rules block lines/);
  assert.match(source, /1516 DOM fallback video-info CSS rules block bytes/);
  assert.match(source, /44 background storage read keys block lines/);
  assert.match(source, /1408 background storage read keys block bytes/);
  assert.match(source, /58 settings_shared build compiled settings block lines/);
  assert.match(source, /2100 settings_shared build compiled settings block bytes/);
  assert.match(source, /44 content bridge storage refresh keys block lines/);
  assert.match(source, /1263 content bridge storage refresh keys block bytes/);
  assert.match(source, /0 filter_logic total hideVideoInfo tokens/);
  assert.match(source, /0 seed total hideVideoInfo tokens/);
  assert.match(source, /2 DOM fallback total hideVideoInfo tokens/);
  assert.match(source, /12 background total hideVideoInfo tokens/);
  assert.match(source, /23 settings_shared total hideVideoInfo tokens/);
  assert.match(source, /1 bridge_settings total hideVideoInfo token/);
  assert.match(source, /2 filter_logic total videoPrimaryInfoRenderer tokens/);
  assert.match(source, /2 filter_logic total videoSecondaryInfoRenderer tokens/);
  assert.match(source, /6 DOM fallback video-info CSS block hideInfoMaster tokens/);
  assert.match(source, /7 runtime hideVideoInfo fixtures/);
  assert.match(source, /does not remove JSON `videoPrimaryInfoRenderer` or `videoSecondaryInfoRenderer` rows/);
  assert.match(source, /ordinary keyword rules can remove a matching `videoPrimaryInfoRenderer` row while nonmatching watch metadata JSON remains/);
  assert.match(source, /whitelist mode preserves `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` rows with an empty whitelist even when `hideVideoInfo` is enabled/);
  assert.match(source, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideVideoInfo` enabled/);
  assert.match(source, /seed active JSON rules have no hide-video-info decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `#actions\.ytd-watch-metadata`, `#info > #menu-container`, `a\[aria-label="Ask"\]`, `button\[aria-label="Ask"\]`, `#owner\.ytd-watch-metadata`/);
  assert.match(source, /hide-video-info contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM video-info parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /whitelist-mode reports/);
  assert.match(source, /child-control interaction reports/);
  assert.match(source, /endpoint no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /route policies/);
  assert.match(source, /first-class hide-video-info authority gates/);
  assert.match(source, /`jsonFirstHideVideoInfoContract`, `jsonFirstHideVideoInfoDecisionReport`, `jsonFirstVideoInfoRendererInventoryPolicy`, `jsonFirstVideoInfoJsonDomParityReport`, `jsonFirstVideoInfoDomOnlyPolicy`, `jsonFirstVideoInfoWhitelistModeReport`, `jsonFirstVideoInfoNoWorkBudget`, `jsonFirstVideoInfoCacheInvalidationReport`, `jsonFirstVideoInfoRoutePolicy`, `jsonFirstVideoInfoSettingsParityReport`, `jsonFirstVideoInfoFixtureProvenance`, or `jsonFirstVideoInfoMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideVideoButtonsBar boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideVideoButtonsBar boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_BUTTONS_BAR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-video-buttons-bar-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-video-buttons-bar proof/);
  assert.match(source, /6 hideVideoButtonsBar boundary source files/);
  assert.match(source, /12 hideVideoButtonsBar source\/effect blocks/);
  assert.match(source, /10 filter_logic watch primary metadata rules block lines/);
  assert.match(source, /431 filter_logic watch primary metadata rules block bytes/);
  assert.match(source, /6 filter_logic whitelist watch scaffolding block lines/);
  assert.match(source, /449 filter_logic whitelist watch scaffolding block bytes/);
  assert.match(source, /8 DOM fallback video-buttons-bar CSS rules block lines/);
  assert.match(source, /263 DOM fallback video-buttons-bar CSS rules block bytes/);
  assert.match(source, /11 DOM fallback video-info mode declaration block lines/);
  assert.match(source, /445 DOM fallback video-info mode declaration block bytes/);
  assert.match(source, /44 background storage read keys block lines/);
  assert.match(source, /1408 background storage read keys block bytes/);
  assert.match(source, /59 settings_shared build compiled settings block lines/);
  assert.match(source, /2156 settings_shared build compiled settings block bytes/);
  assert.match(source, /44 content bridge storage refresh keys block lines/);
  assert.match(source, /1263 content bridge storage refresh keys block bytes/);
  assert.match(source, /0 filter_logic total hideVideoButtonsBar tokens/);
  assert.match(source, /0 seed total hideVideoButtonsBar tokens/);
  assert.match(source, /2 DOM fallback total hideVideoButtonsBar tokens/);
  assert.match(source, /12 background total hideVideoButtonsBar tokens/);
  assert.match(source, /23 settings_shared total hideVideoButtonsBar tokens/);
  assert.match(source, /1 bridge_settings total hideVideoButtonsBar token/);
  assert.match(source, /2 filter_logic total videoPrimaryInfoRenderer tokens/);
  assert.match(source, /2 filter_logic total videoSecondaryInfoRenderer tokens/);
  assert.match(source, /1 DOM fallback video-buttons-bar CSS block hideInfoMaster token/);
  assert.match(source, /7 runtime hideVideoButtonsBar fixtures/);
  assert.match(source, /does not remove JSON `videoPrimaryInfoRenderer` or `videoSecondaryInfoRenderer` rows/);
  assert.match(source, /ordinary keyword rules can remove a matching `videoPrimaryInfoRenderer` row while nonmatching watch metadata JSON remains/);
  assert.match(source, /whitelist mode preserves `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` rows with an empty whitelist even when `hideVideoButtonsBar` is enabled/);
  assert.match(source, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideVideoButtonsBar` enabled/);
  assert.match(source, /seed active JSON rules have no hide-video-buttons-bar decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `#actions\.ytd-watch-metadata` and `#info > #menu-container`/);
  assert.match(source, /DOM fallback hides the same buttons bar selectors when `hideInfoMaster` is true or when `settings\.hideVideoButtonsBar` is true/);
  assert.match(source, /hide-video-buttons-bar contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM video-buttons-bar parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /whitelist-mode reports/);
  assert.match(source, /child-control interaction reports/);
  assert.match(source, /endpoint no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /route policies/);
  assert.match(source, /first-class hide-video-buttons-bar authority gates/);
  assert.match(source, /`jsonFirstHideVideoButtonsBarContract`, `jsonFirstHideVideoButtonsBarDecisionReport`, `jsonFirstVideoButtonsBarRendererInventoryPolicy`, `jsonFirstVideoButtonsBarJsonDomParityReport`, `jsonFirstVideoButtonsBarDomOnlyPolicy`, `jsonFirstVideoButtonsBarWhitelistModeReport`, `jsonFirstVideoButtonsBarChildControlInteractionReport`, `jsonFirstVideoButtonsBarNoWorkBudget`, `jsonFirstVideoButtonsBarCacheInvalidationReport`, `jsonFirstVideoButtonsBarRoutePolicy`, `jsonFirstVideoButtonsBarSettingsParityReport`, `jsonFirstVideoButtonsBarFixtureProvenance`, or `jsonFirstVideoButtonsBarMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideVideoChannelRow boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideVideoChannelRow boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_CHANNEL_ROW_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-video-channel-row-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-video-channel-row proof/);
  assert.match(source, /6 hideVideoChannelRow boundary source files/);
  assert.match(source, /12 hideVideoChannelRow source\/effect blocks/);
  assert.match(source, /10 filter_logic watch primary metadata rules block lines/);
  assert.match(source, /431 filter_logic watch primary metadata rules block bytes/);
  assert.match(source, /6 filter_logic whitelist watch scaffolding block lines/);
  assert.match(source, /449 filter_logic whitelist watch scaffolding block bytes/);
  assert.match(source, /8 DOM fallback video-channel-row CSS rules block lines/);
  assert.match(source, /280 DOM fallback video-channel-row CSS rules block bytes/);
  assert.match(source, /11 DOM fallback video-info mode declaration block lines/);
  assert.match(source, /445 DOM fallback video-info mode declaration block bytes/);
  assert.match(source, /44 background storage read keys block lines/);
  assert.match(source, /1408 background storage read keys block bytes/);
  assert.match(source, /61 settings_shared build compiled settings block lines/);
  assert.match(source, /2256 settings_shared build compiled settings block bytes/);
  assert.match(source, /44 content bridge storage refresh keys block lines/);
  assert.match(source, /1263 content bridge storage refresh keys block bytes/);
  assert.match(source, /0 filter_logic total hideVideoChannelRow tokens/);
  assert.match(source, /0 seed total hideVideoChannelRow tokens/);
  assert.match(source, /2 DOM fallback total hideVideoChannelRow tokens/);
  assert.match(source, /12 background total hideVideoChannelRow tokens/);
  assert.match(source, /23 settings_shared total hideVideoChannelRow tokens/);
  assert.match(source, /1 bridge_settings total hideVideoChannelRow token/);
  assert.match(source, /2 filter_logic total videoPrimaryInfoRenderer tokens/);
  assert.match(source, /2 filter_logic total videoSecondaryInfoRenderer tokens/);
  assert.match(source, /1 DOM fallback video-channel-row CSS block hideInfoMaster token/);
  assert.match(source, /7 runtime hideVideoChannelRow fixtures/);
  assert.match(source, /does not remove JSON `videoPrimaryInfoRenderer` or `videoSecondaryInfoRenderer` rows/);
  assert.match(source, /ordinary keyword or channel rules can remove a matching `videoSecondaryInfoRenderer` row while nonmatching watch metadata JSON remains/);
  assert.match(source, /whitelist mode preserves `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` rows with an empty whitelist even when `hideVideoChannelRow` is enabled/);
  assert.match(source, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideVideoChannelRow` enabled/);
  assert.match(source, /seed active JSON rules have no hide-video-channel-row decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `#owner\.ytd-watch-metadata` and `#top-row\.ytd-video-secondary-info-renderer`/);
  assert.match(source, /DOM fallback hides the same channel row selectors when `hideInfoMaster` is true or when `settings\.hideVideoChannelRow` is true/);
  assert.match(source, /hide-video-channel-row contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM video-channel-row parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /whitelist-mode reports/);
  assert.match(source, /child-control interaction reports/);
  assert.match(source, /endpoint no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /route policies/);
  assert.match(source, /first-class hide-video-channel-row authority gates/);
  assert.match(source, /`jsonFirstHideVideoChannelRowContract`, `jsonFirstHideVideoChannelRowDecisionReport`, `jsonFirstVideoChannelRowRendererInventoryPolicy`, `jsonFirstVideoChannelRowJsonDomParityReport`, `jsonFirstVideoChannelRowDomOnlyPolicy`, `jsonFirstVideoChannelRowWhitelistModeReport`, `jsonFirstVideoChannelRowChildControlInteractionReport`, `jsonFirstVideoChannelRowNoWorkBudget`, `jsonFirstVideoChannelRowCacheInvalidationReport`, `jsonFirstVideoChannelRowRoutePolicy`, `jsonFirstVideoChannelRowSettingsParityReport`, `jsonFirstVideoChannelRowFixtureProvenance`, or `jsonFirstVideoChannelRowMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideVideoDescription boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideVideoDescription boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_DESCRIPTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-video-description-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-video-description proof/);
  assert.match(source, /6 hideVideoDescription boundary source files/);
  assert.match(source, /12 hideVideoDescription source\/effect blocks/);
  assert.match(source, /10 filter_logic watch primary metadata rules block lines/);
  assert.match(source, /431 filter_logic watch primary metadata rules block bytes/);
  assert.match(source, /6 filter_logic whitelist watch scaffolding block lines/);
  assert.match(source, /449 filter_logic whitelist watch scaffolding block bytes/);
  assert.match(source, /8 DOM fallback video-description CSS rules block lines/);
  assert.match(source, /291 DOM fallback video-description CSS rules block bytes/);
  assert.match(source, /11 DOM fallback video-info mode declaration block lines/);
  assert.match(source, /445 DOM fallback video-info mode declaration block bytes/);
  assert.match(source, /44 background storage read keys block lines/);
  assert.match(source, /1408 background storage read keys block bytes/);
  assert.match(source, /62 settings_shared build compiled settings block lines/);
  assert.match(source, /2314 settings_shared build compiled settings block bytes/);
  assert.match(source, /44 content bridge storage refresh keys block lines/);
  assert.match(source, /1263 content bridge storage refresh keys block bytes/);
  assert.match(source, /0 filter_logic total hideVideoDescription tokens/);
  assert.match(source, /0 seed total hideVideoDescription tokens/);
  assert.match(source, /2 DOM fallback total hideVideoDescription tokens/);
  assert.match(source, /12 background total hideVideoDescription tokens/);
  assert.match(source, /23 settings_shared total hideVideoDescription tokens/);
  assert.match(source, /1 bridge_settings total hideVideoDescription token/);
  assert.match(source, /2 filter_logic total videoPrimaryInfoRenderer tokens/);
  assert.match(source, /2 filter_logic total videoSecondaryInfoRenderer tokens/);
  assert.match(source, /1 DOM fallback video-description CSS block hideInfoMaster token/);
  assert.match(source, /7 runtime hideVideoDescription fixtures/);
  assert.match(source, /does not remove JSON `videoPrimaryInfoRenderer` or `videoSecondaryInfoRenderer` rows/);
  assert.match(source, /ordinary keyword rules can remove a matching `videoPrimaryInfoRenderer` row while nonmatching watch metadata JSON remains/);
  assert.match(source, /whitelist mode preserves `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` rows with an empty whitelist even when `hideVideoDescription` is enabled/);
  assert.match(source, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideVideoDescription` enabled/);
  assert.match(source, /seed active JSON rules have no hide-video-description decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `#description\.ytd-watch-metadata` and `ytd-expander\.ytd-video-secondary-info-renderer`/);
  assert.match(source, /DOM fallback hides the same description selectors when `hideInfoMaster` is true or when `settings\.hideVideoDescription` is true/);
  assert.match(source, /hide-video-description contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM video-description parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /whitelist-mode reports/);
  assert.match(source, /child-control interaction reports/);
  assert.match(source, /endpoint no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /route policies/);
  assert.match(source, /first-class hide-video-description authority gates/);
  assert.match(source, /`jsonFirstHideVideoDescriptionContract`, `jsonFirstHideVideoDescriptionDecisionReport`, `jsonFirstVideoDescriptionRendererInventoryPolicy`, `jsonFirstVideoDescriptionJsonDomParityReport`, `jsonFirstVideoDescriptionDomOnlyPolicy`, `jsonFirstVideoDescriptionWhitelistModeReport`, `jsonFirstVideoDescriptionChildControlInteractionReport`, `jsonFirstVideoDescriptionNoWorkBudget`, `jsonFirstVideoDescriptionCacheInvalidationReport`, `jsonFirstVideoDescriptionRoutePolicy`, `jsonFirstVideoDescriptionSettingsParityReport`, `jsonFirstVideoDescriptionFixtureProvenance`, or `jsonFirstVideoDescriptionMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideAskButton boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideAskButton boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_ASK_BUTTON_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-ask-button-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-ask-button proof/);
  assert.match(source, /6 hideAskButton boundary source files/);
  assert.match(source, /12 hideAskButton source\/effect blocks/);
  assert.match(source, /10 filter_logic watch primary metadata rules block lines/);
  assert.match(source, /431 filter_logic watch primary metadata rules block bytes/);
  assert.match(source, /6 filter_logic whitelist watch scaffolding block lines/);
  assert.match(source, /449 filter_logic whitelist watch scaffolding block bytes/);
  assert.match(source, /8 DOM fallback Ask button CSS rules block lines/);
  assert.match(source, /218 DOM fallback Ask button CSS rules block bytes/);
  assert.match(source, /11 DOM fallback video-info mode declaration block lines/);
  assert.match(source, /445 DOM fallback video-info mode declaration block bytes/);
  assert.match(source, /44 background storage read keys block lines/);
  assert.match(source, /1408 background storage read keys block bytes/);
  assert.match(source, /60 settings_shared build compiled settings block lines/);
  assert.match(source, /2200 settings_shared build compiled settings block bytes/);
  assert.match(source, /44 content bridge storage refresh keys block lines/);
  assert.match(source, /1263 content bridge storage refresh keys block bytes/);
  assert.match(source, /0 filter_logic total hideAskButton tokens/);
  assert.match(source, /0 seed total hideAskButton tokens/);
  assert.match(source, /2 DOM fallback total hideAskButton tokens/);
  assert.match(source, /12 background total hideAskButton tokens/);
  assert.match(source, /23 settings_shared total hideAskButton tokens/);
  assert.match(source, /1 bridge_settings total hideAskButton token/);
  assert.match(source, /2 filter_logic total videoPrimaryInfoRenderer tokens/);
  assert.match(source, /2 filter_logic total videoSecondaryInfoRenderer tokens/);
  assert.match(source, /1 DOM fallback Ask button CSS block hideInfoMaster token/);
  assert.match(source, /7 runtime hideAskButton fixtures/);
  assert.match(source, /does not remove JSON `videoPrimaryInfoRenderer` or `videoSecondaryInfoRenderer` rows/);
  assert.match(source, /ordinary keyword rules can remove a matching `videoPrimaryInfoRenderer` row while nonmatching watch metadata JSON remains/);
  assert.match(source, /whitelist mode preserves `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` rows with an empty whitelist even when `hideAskButton` is enabled/);
  assert.match(source, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideAskButton` enabled/);
  assert.match(source, /seed active JSON rules have no hide-ask-button decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `a\[aria-label="Ask"\]` and `button\[aria-label="Ask"\]`/);
  assert.match(source, /DOM fallback hides Ask button selectors when `hideInfoMaster` is true or when `settings\.hideAskButton` is true/);
  assert.match(source, /explicit `settings\.hideAskButton` is not directly gated by `listMode !== 'whitelist'`/);
  assert.match(source, /hide-ask-button contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM Ask button parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /whitelist-mode reports/);
  assert.match(source, /child-control interaction reports/);
  assert.match(source, /endpoint no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /route policies/);
  assert.match(source, /first-class hide-ask-button authority gates/);
  assert.match(source, /`jsonFirstHideAskButtonContract`, `jsonFirstHideAskButtonDecisionReport`, `jsonFirstAskButtonRendererInventoryPolicy`, `jsonFirstAskButtonJsonDomParityReport`, `jsonFirstAskButtonDomOnlyPolicy`, `jsonFirstAskButtonWhitelistModeReport`, `jsonFirstAskButtonChildControlInteractionReport`, `jsonFirstAskButtonNoWorkBudget`, `jsonFirstAskButtonCacheInvalidationReport`, `jsonFirstAskButtonRoutePolicy`, `jsonFirstAskButtonSettingsParityReport`, `jsonFirstAskButtonFixtureProvenance`, or `jsonFirstAskButtonMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideMerchTicketsOffers boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideMerchTicketsOffers boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_MERCH_TICKETS_OFFERS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-merch-tickets-offers-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-merch-tickets-offers proof/);
  assert.match(source, /6 hideMerchTicketsOffers boundary source files/);
  assert.match(source, /12 hideMerchTicketsOffers source\/effect blocks/);
  assert.match(source, /10 filter_logic watch primary metadata rules block lines/);
  assert.match(source, /431 filter_logic watch primary metadata rules block bytes/);
  assert.match(source, /6 filter_logic whitelist watch scaffolding block lines/);
  assert.match(source, /449 filter_logic whitelist watch scaffolding block bytes/);
  assert.match(source, /10 DOM fallback Merch\/Tickets\/Offers CSS rules block lines/);
  assert.match(source, /274 DOM fallback Merch\/Tickets\/Offers CSS rules block bytes/);
  assert.match(source, /11 DOM fallback video-info mode declaration block lines/);
  assert.match(source, /445 DOM fallback video-info mode declaration block bytes/);
  assert.match(source, /44 background storage read keys block lines/);
  assert.match(source, /1408 background storage read keys block bytes/);
  assert.match(source, /63 settings_shared build compiled settings block lines/);
  assert.match(source, /2376 settings_shared build compiled settings block bytes/);
  assert.match(source, /44 content bridge storage refresh keys block lines/);
  assert.match(source, /1263 content bridge storage refresh keys block bytes/);
  assert.match(source, /0 filter_logic total hideMerchTicketsOffers tokens/);
  assert.match(source, /0 seed total hideMerchTicketsOffers tokens/);
  assert.match(source, /2 DOM fallback total hideMerchTicketsOffers tokens/);
  assert.match(source, /12 background total hideMerchTicketsOffers tokens/);
  assert.match(source, /23 settings_shared total hideMerchTicketsOffers tokens/);
  assert.match(source, /1 bridge_settings total hideMerchTicketsOffers token/);
  assert.match(source, /2 filter_logic total videoPrimaryInfoRenderer tokens/);
  assert.match(source, /2 filter_logic total videoSecondaryInfoRenderer tokens/);
  assert.match(source, /1 DOM fallback Merch\/Tickets\/Offers CSS block hideInfoMaster token/);
  assert.match(source, /7 runtime hideMerchTicketsOffers fixtures/);
  assert.match(source, /does not remove JSON `videoPrimaryInfoRenderer` or `videoSecondaryInfoRenderer` rows/);
  assert.match(source, /ordinary keyword rules can remove a matching `videoPrimaryInfoRenderer` row while nonmatching watch metadata JSON remains/);
  assert.match(source, /whitelist mode preserves `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` rows with an empty whitelist even when `hideMerchTicketsOffers` is enabled/);
  assert.match(source, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideMerchTicketsOffers` enabled/);
  assert.match(source, /seed active JSON rules have no hide-merch-tickets-offers decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `#ticket-shelf`, `ytd-merch-shelf-renderer`, `#offer-module`, and `#clarify-box`/);
  assert.match(source, /DOM fallback hides Merch\/Tickets\/Offers selectors when `hideInfoMaster` is true or when `settings\.hideMerchTicketsOffers` is true/);
  assert.match(source, /explicit `settings\.hideMerchTicketsOffers` is not directly gated by `listMode !== 'whitelist'`/);
  assert.match(source, /hide-merch-tickets-offers contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM Merch\/Tickets\/Offers parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /whitelist-mode reports/);
  assert.match(source, /child-control interaction reports/);
  assert.match(source, /endpoint no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /route policies/);
  assert.match(source, /first-class hide-merch-tickets-offers authority gates/);
  assert.match(source, /`jsonFirstHideMerchTicketsOffersContract`, `jsonFirstHideMerchTicketsOffersDecisionReport`, `jsonFirstMerchTicketsOffersRendererInventoryPolicy`, `jsonFirstMerchTicketsOffersJsonDomParityReport`, `jsonFirstMerchTicketsOffersDomOnlyPolicy`, `jsonFirstMerchTicketsOffersWhitelistModeReport`, `jsonFirstMerchTicketsOffersChildControlInteractionReport`, `jsonFirstMerchTicketsOffersNoWorkBudget`, `jsonFirstMerchTicketsOffersCacheInvalidationReport`, `jsonFirstMerchTicketsOffersRoutePolicy`, `jsonFirstMerchTicketsOffersSettingsParityReport`, `jsonFirstMerchTicketsOffersFixtureProvenance`, or `jsonFirstMerchTicketsOffersMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideEndscreenVideowall boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideEndscreenVideowall boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_ENDSCREEN_VIDEOWALL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-endscreen-videowall-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-endscreen-videowall proof/);
  assert.match(source, /6 hideEndscreenVideowall boundary source files/);
  assert.match(source, /13 hideEndscreenVideowall source\/effect blocks/);
  assert.match(source, /8 filter_logic shared video renderer rules block lines/);
  assert.match(source, /415 filter_logic shared video renderer rules block bytes/);
  assert.match(source, /8 filter_logic category renderer allowlist block lines/);
  assert.match(source, /618 filter_logic category renderer allowlist block bytes/);
  assert.match(source, /10 filter_logic nested known keys block lines/);
  assert.match(source, /427 filter_logic nested known keys block bytes/);
  assert.match(source, /8 filter_logic content renderer allowlist block lines/);
  assert.match(source, /618 filter_logic content renderer allowlist block bytes/);
  assert.match(source, /8 DOM fallback endscreen-videowall CSS rules block lines/);
  assert.match(source, /253 DOM fallback endscreen-videowall CSS rules block bytes/);
  assert.match(source, /65 settings_shared build compiled settings block lines/);
  assert.match(source, /2492 settings_shared build compiled settings block bytes/);
  assert.match(source, /0 filter_logic total hideEndscreenVideowall tokens/);
  assert.match(source, /0 seed total hideEndscreenVideowall tokens/);
  assert.match(source, /2 DOM fallback total hideEndscreenVideowall tokens/);
  assert.match(source, /12 background total hideEndscreenVideowall tokens/);
  assert.match(source, /23 settings_shared total hideEndscreenVideowall tokens/);
  assert.match(source, /1 bridge_settings total hideEndscreenVideowall token/);
  assert.match(source, /4 filter_logic total endScreenVideoRenderer tokens/);
  assert.match(source, /0 filter_logic total compactAutoplayRenderer tokens/);
  assert.match(source, /7 runtime hideEndscreenVideowall fixtures/);
  assert.match(source, /does not remove JSON `endScreenVideoRenderer` or `compactAutoplayRenderer` rows/);
  assert.match(source, /ordinary keyword rules can remove a matching supported `endScreenVideoRenderer` row while matching `compactAutoplayRenderer` remains/);
  assert.match(source, /empty whitelist mode can remove supported `endScreenVideoRenderer` while `compactAutoplayRenderer` still passes through/);
  assert.match(source, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideEndscreenVideowall` enabled/);
  assert.match(source, /seed active JSON rules have no hide-endscreen-videowall decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `#movie_player \.ytp-endscreen-content` and `#movie_player \.ytp-fullscreen-grid-stills-container`/);
  assert.match(source, /the DOM videowall CSS block is not gated by `listMode !== 'whitelist'`/);
  assert.match(source, /hide-endscreen-videowall contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM endscreen-videowall parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /whitelist-mode reports/);
  assert.match(source, /player overlay policies/);
  assert.match(source, /endpoint no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /route policies/);
  assert.match(source, /first-class hide-endscreen-videowall authority gates/);
  assert.match(source, /`jsonFirstHideEndscreenVideowallContract`, `jsonFirstHideEndscreenVideowallDecisionReport`, `jsonFirstEndscreenVideowallRendererInventoryPolicy`, `jsonFirstEndscreenVideowallJsonDomParityReport`, `jsonFirstEndscreenVideowallDomOnlyPolicy`, `jsonFirstEndscreenVideowallWhitelistModeReport`, `jsonFirstEndscreenVideowallPlayerOverlayPolicy`, `jsonFirstEndscreenVideowallNoWorkBudget`, `jsonFirstEndscreenVideowallCacheInvalidationReport`, `jsonFirstEndscreenVideowallRoutePolicy`, `jsonFirstEndscreenVideowallSettingsParityReport`, `jsonFirstEndscreenVideowallFixtureProvenance`, or `jsonFirstEndscreenVideowallMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideEndscreenCards boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideEndscreenCards boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_ENDSCREEN_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-endscreen-cards-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-endscreen-cards proof/);
  assert.match(source, /6 hideEndscreenCards boundary source files/);
  assert.match(source, /13 hideEndscreenCards source\/effect blocks/);
  assert.match(source, /8 filter_logic shared video renderer rules block lines/);
  assert.match(source, /415 filter_logic shared video renderer rules block bytes/);
  assert.match(source, /8 filter_logic category renderer allowlist block lines/);
  assert.match(source, /618 filter_logic category renderer allowlist block bytes/);
  assert.match(source, /10 filter_logic nested known keys block lines/);
  assert.match(source, /427 filter_logic nested known keys block bytes/);
  assert.match(source, /8 filter_logic content renderer allowlist block lines/);
  assert.match(source, /618 filter_logic content renderer allowlist block bytes/);
  assert.match(source, /7 DOM fallback endscreen-cards CSS rules block lines/);
  assert.match(source, /177 DOM fallback endscreen-cards CSS rules block bytes/);
  assert.match(source, /64 settings_shared build compiled settings block lines/);
  assert.match(source, /2438 settings_shared build compiled settings block bytes/);
  assert.match(source, /0 filter_logic total hideEndscreenCards tokens/);
  assert.match(source, /0 seed total hideEndscreenCards tokens/);
  assert.match(source, /2 DOM fallback total hideEndscreenCards tokens/);
  assert.match(source, /12 background total hideEndscreenCards tokens/);
  assert.match(source, /23 settings_shared total hideEndscreenCards tokens/);
  assert.match(source, /1 bridge_settings total hideEndscreenCards token/);
  assert.match(source, /4 filter_logic total endScreenVideoRenderer tokens/);
  assert.match(source, /0 filter_logic total compactAutoplayRenderer tokens/);
  assert.match(source, /7 runtime hideEndscreenCards fixtures/);
  assert.match(source, /does not remove JSON `endScreenVideoRenderer` or `compactAutoplayRenderer` rows/);
  assert.match(source, /ordinary keyword rules can remove a matching supported `endScreenVideoRenderer` row while matching `compactAutoplayRenderer` remains/);
  assert.match(source, /empty whitelist mode can remove supported `endScreenVideoRenderer` while `compactAutoplayRenderer` still passes through/);
  assert.match(source, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideEndscreenCards` enabled/);
  assert.match(source, /seed active JSON rules have no hide-endscreen-cards decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `#movie_player \.ytp-ce-element`/);
  assert.match(source, /the DOM end-screen card CSS block is not gated by `listMode !== 'whitelist'`/);
  assert.match(source, /hide-endscreen-cards contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM endscreen-cards parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /whitelist-mode reports/);
  assert.match(source, /player overlay policies/);
  assert.match(source, /endpoint no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /route policies/);
  assert.match(source, /first-class hide-endscreen-cards authority gates/);
  assert.match(source, /`jsonFirstHideEndscreenCardsContract`, `jsonFirstHideEndscreenCardsDecisionReport`, `jsonFirstEndscreenCardsRendererInventoryPolicy`, `jsonFirstEndscreenCardsJsonDomParityReport`, `jsonFirstEndscreenCardsDomOnlyPolicy`, `jsonFirstEndscreenCardsWhitelistModeReport`, `jsonFirstEndscreenCardsPlayerOverlayPolicy`, `jsonFirstEndscreenCardsNoWorkBudget`, `jsonFirstEndscreenCardsCacheInvalidationReport`, `jsonFirstEndscreenCardsRoutePolicy`, `jsonFirstEndscreenCardsSettingsParityReport`, `jsonFirstEndscreenCardsFixtureProvenance`, or `jsonFirstEndscreenCardsMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideTopHeader boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideTopHeader boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_TOP_HEADER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-top-header-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-top-header proof/);
  assert.match(source, /6 hideTopHeader boundary source files/);
  assert.match(source, /9 hideTopHeader source\/effect blocks/);
  assert.match(source, /10 seed active JSON rules block lines/);
  assert.match(source, /634 seed active JSON rules block bytes/);
  assert.match(source, /7 DOM fallback top-header CSS rules block lines/);
  assert.match(source, /162 DOM fallback top-header CSS rules block bytes/);
  assert.match(source, /3 settings_shared top-header compile block lines/);
  assert.match(source, /146 settings_shared top-header compile block bytes/);
  assert.match(source, /0 filter_logic total hideTopHeader tokens/);
  assert.match(source, /0 seed total hideTopHeader tokens/);
  assert.match(source, /2 DOM fallback total hideTopHeader tokens/);
  assert.match(source, /12 background total hideTopHeader tokens/);
  assert.match(source, /23 settings_shared total hideTopHeader tokens/);
  assert.match(source, /1 bridge_settings total hideTopHeader token/);
  assert.match(source, /0 filter_logic total desktopTopbarRenderer tokens/);
  assert.match(source, /0 filter_logic total topbarRenderer tokens/);
  assert.match(source, /1 DOM fallback total #masthead-container token/);
  assert.match(source, /6 runtime hideTopHeader fixtures/);
  assert.match(source, /does not remove JSON topbar objects or neighboring watch rows/);
  assert.match(source, /ordinary keyword rules can remove a matching watch row while topbar JSON remains/);
  assert.match(source, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideTopHeader` enabled/);
  assert.match(source, /seed active JSON rules have no hide-top-header decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `#masthead-container`/);
  assert.match(source, /hide-top-header contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM top-header parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /route no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /route policies/);
  assert.match(source, /first-class hide-top-header authority gates/);
  assert.match(source, /`jsonFirstHideTopHeaderContract`, `jsonFirstHideTopHeaderDecisionReport`, `jsonFirstTopHeaderRendererInventoryPolicy`, `jsonFirstTopHeaderJsonDomParityReport`, `jsonFirstTopHeaderDomOnlyPolicy`, `jsonFirstTopHeaderNoWorkBudget`, `jsonFirstTopHeaderCacheInvalidationReport`, `jsonFirstTopHeaderRoutePolicy`, `jsonFirstTopHeaderSettingsParityReport`, `jsonFirstTopHeaderFixtureProvenance`, or `jsonFirstTopHeaderMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideNotificationBell boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideNotificationBell boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_NOTIFICATION_BELL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-notification-bell-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-notification-bell proof/);
  assert.match(source, /6 hideNotificationBell boundary source files/);
  assert.match(source, /10 hideNotificationBell source\/effect blocks/);
  assert.match(source, /17 filter_logic notificationRenderer rule block lines/);
  assert.match(source, /899 filter_logic notificationRenderer rule block bytes/);
  assert.match(source, /8 DOM fallback notification-bell CSS rules block lines/);
  assert.match(source, /248 DOM fallback notification-bell CSS rules block bytes/);
  assert.match(source, /2 settings_shared notification-bell compile block lines/);
  assert.match(source, /102 settings_shared notification-bell compile block bytes/);
  assert.match(source, /0 filter_logic total hideNotificationBell tokens/);
  assert.match(source, /0 seed total hideNotificationBell tokens/);
  assert.match(source, /2 DOM fallback total hideNotificationBell tokens/);
  assert.match(source, /12 background total hideNotificationBell tokens/);
  assert.match(source, /23 settings_shared total hideNotificationBell tokens/);
  assert.match(source, /1 bridge_settings total hideNotificationBell token/);
  assert.match(source, /1 filter_logic total notificationRenderer token/);
  assert.match(source, /0 seed total notificationRenderer tokens/);
  assert.match(source, /1 DOM fallback total ytd-notification-topbar-button-renderer token/);
  assert.match(source, /1 DOM fallback total ytd-notification-topbar-button-shape-renderer token/);
  assert.match(source, /6 runtime hideNotificationBell fixtures/);
  assert.match(source, /does not remove JSON topbar notification button objects or `notificationRenderer` rows/);
  assert.match(source, /ordinary keyword rules can remove a matching `notificationRenderer` row while topbar notification button JSON remains/);
  assert.match(source, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideNotificationBell` enabled/);
  assert.match(source, /seed active JSON rules have no hide-notification-bell decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `ytd-notification-topbar-button-renderer` and `ytd-notification-topbar-button-shape-renderer`/);
  assert.match(source, /hide-notification-bell contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM notification-bell parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /route no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /route policies/);
  assert.match(source, /first-class hide-notification-bell authority gates/);
  assert.match(source, /`jsonFirstHideNotificationBellContract`, `jsonFirstHideNotificationBellDecisionReport`, `jsonFirstNotificationBellRendererInventoryPolicy`, `jsonFirstNotificationBellJsonDomParityReport`, `jsonFirstNotificationBellDomOnlyPolicy`, `jsonFirstNotificationBellNoWorkBudget`, `jsonFirstNotificationBellCacheInvalidationReport`, `jsonFirstNotificationBellRoutePolicy`, `jsonFirstNotificationBellSettingsParityReport`, `jsonFirstNotificationBellFixtureProvenance`, or `jsonFirstNotificationBellMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideExploreTrending boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideExploreTrending boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_EXPLORE_TRENDING_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-explore-trending-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-explore-trending proof/);
  assert.match(source, /6 hideExploreTrending boundary source files/);
  assert.match(source, /9 hideExploreTrending source\/effect blocks/);
  assert.match(source, /9 DOM fallback explore-trending CSS rules block lines/);
  assert.match(source, /297 DOM fallback explore-trending CSS rules block bytes/);
  assert.match(source, /1 settings_shared explore-trending compile block line/);
  assert.match(source, /56 settings_shared explore-trending compile block bytes/);
  assert.match(source, /0 filter_logic total hideExploreTrending tokens/);
  assert.match(source, /0 seed total hideExploreTrending tokens/);
  assert.match(source, /2 DOM fallback total hideExploreTrending tokens/);
  assert.match(source, /12 background total hideExploreTrending tokens/);
  assert.match(source, /23 settings_shared total hideExploreTrending tokens/);
  assert.match(source, /1 bridge_settings total hideExploreTrending token/);
  assert.match(source, /0 filter_logic total guideEntryRenderer tokens/);
  assert.match(source, /0 filter_logic total compactLinkRenderer tokens/);
  assert.match(source, /1 DOM fallback total \/feed\/explore token/);
  assert.match(source, /1 DOM fallback total \/feed\/trending token/);
  assert.match(source, /1 DOM fallback total ytd-browse\[page-subtype="trending"\] token/);
  assert.match(source, /6 runtime hideExploreTrending fixtures/);
  assert.match(source, /does not remove JSON Explore\/Trending guide entries or neighboring supported rows/);
  assert.match(source, /ordinary keyword rules can remove a neighboring supported row while Explore\/Trending guide JSON remains/);
  assert.match(source, /`\/youtubei\/v1\/browse` still enters `processData` and does not run harvest-only with only `hideExploreTrending` enabled on `\/feed\/explore`/);
  assert.match(source, /seed active JSON rules have no hide-explore-trending decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `\/feed\/explore`, `\/feed\/trending`, and `ytd-browse\[page-subtype="trending"\]`/);
  assert.match(source, /hide-explore-trending contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM Explore\/Trending parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /route no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /route policies/);
  assert.match(source, /first-class hide-explore-trending authority gates/);
  assert.match(source, /`jsonFirstHideExploreTrendingContract`, `jsonFirstHideExploreTrendingDecisionReport`, `jsonFirstExploreTrendingRendererInventoryPolicy`, `jsonFirstExploreTrendingJsonDomParityReport`, `jsonFirstExploreTrendingDomOnlyPolicy`, `jsonFirstExploreTrendingNoWorkBudget`, `jsonFirstExploreTrendingCacheInvalidationReport`, `jsonFirstExploreTrendingRoutePolicy`, `jsonFirstExploreTrendingSettingsParityReport`, `jsonFirstExploreTrendingFixtureProvenance`, or `jsonFirstExploreTrendingMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideMoreFromYouTube boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideMoreFromYouTube boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_MORE_FROM_YOUTUBE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-more-from-youtube-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-more-from-youtube proof/);
  assert.match(source, /6 hideMoreFromYouTube boundary source files/);
  assert.match(source, /9 hideMoreFromYouTube source\/effect blocks/);
  assert.match(source, /7 DOM fallback more-from-youtube CSS rules block lines/);
  assert.match(source, /205 DOM fallback more-from-youtube CSS rules block bytes/);
  assert.match(source, /1 settings_shared more-from-youtube compile block line/);
  assert.match(source, /56 settings_shared more-from-youtube compile block bytes/);
  assert.match(source, /0 filter_logic total hideMoreFromYouTube tokens/);
  assert.match(source, /0 seed total hideMoreFromYouTube tokens/);
  assert.match(source, /2 DOM fallback total hideMoreFromYouTube tokens/);
  assert.match(source, /12 background total hideMoreFromYouTube tokens/);
  assert.match(source, /23 settings_shared total hideMoreFromYouTube tokens/);
  assert.match(source, /1 bridge_settings total hideMoreFromYouTube token/);
  assert.match(source, /1 filter_logic total guideSectionRenderer token/);
  assert.match(source, /0 filter_logic total guideEntryRenderer tokens/);
  assert.match(source, /0 filter_logic total compactLinkRenderer tokens/);
  assert.match(source, /2 DOM fallback total ytd-guide-section-renderer tokens/);
  assert.match(source, /1 DOM fallback total nth-last-child\(2\) token/);
  assert.match(source, /6 runtime hideMoreFromYouTube fixtures/);
  assert.match(source, /does not remove JSON More from YouTube guide sections or neighboring supported rows/);
  assert.match(source, /ordinary keyword rules can remove a neighboring supported row while More from YouTube guide JSON remains/);
  assert.match(source, /`\/youtubei\/v1\/guide` still enters `processData` and does not run harvest-only with only `hideMoreFromYouTube` enabled/);
  assert.match(source, /seed active JSON rules have no hide-more-from-youtube decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `#sections > ytd-guide-section-renderer:nth-last-child\(2\)`/);
  assert.match(source, /hide-more-from-youtube contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM More from YouTube parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /route no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /route policies/);
  assert.match(source, /first-class hide-more-from-youtube authority gates/);
  assert.match(source, /`jsonFirstHideMoreFromYouTubeContract`, `jsonFirstHideMoreFromYouTubeDecisionReport`, `jsonFirstMoreFromYouTubeRendererInventoryPolicy`, `jsonFirstMoreFromYouTubeJsonDomParityReport`, `jsonFirstMoreFromYouTubeDomOnlyPolicy`, `jsonFirstMoreFromYouTubeNoWorkBudget`, `jsonFirstMoreFromYouTubeCacheInvalidationReport`, `jsonFirstMoreFromYouTubeRoutePolicy`, `jsonFirstMoreFromYouTubeSettingsParityReport`, `jsonFirstMoreFromYouTubeFixtureProvenance`, or `jsonFirstMoreFromYouTubeMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideSubscriptions boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideSubscriptions boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_SUBSCRIPTIONS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-subscriptions-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-subscriptions proof/);
  assert.match(source, /6 hideSubscriptions boundary source files/);
  assert.match(source, /9 hideSubscriptions source\/effect blocks/);
  assert.match(source, /9 DOM fallback subscriptions CSS rules block lines/);
  assert.match(source, /437 DOM fallback subscriptions CSS rules block bytes/);
  assert.match(source, /1 settings_shared subscriptions compile block line/);
  assert.match(source, /52 settings_shared subscriptions compile block bytes/);
  assert.match(source, /0 filter_logic total hideSubscriptions tokens/);
  assert.match(source, /0 seed total hideSubscriptions tokens/);
  assert.match(source, /2 DOM fallback total hideSubscriptions tokens/);
  assert.match(source, /12 background total hideSubscriptions tokens/);
  assert.match(source, /23 settings_shared total hideSubscriptions tokens/);
  assert.match(source, /1 bridge_settings total hideSubscriptions token/);
  assert.match(source, /1 filter_logic total guideSectionRenderer token/);
  assert.match(source, /0 filter_logic total guideEntryRenderer tokens/);
  assert.match(source, /0 filter_logic total compactLinkRenderer tokens/);
  assert.match(source, /2 DOM fallback total ytd-guide-section-renderer tokens/);
  assert.match(source, /1 DOM fallback subscriptions CSS block \/feed\/subscriptions token/);
  assert.match(source, /1 DOM fallback subscriptions CSS block page-subtype="subscriptions" token/);
  assert.match(source, /1 DOM fallback subscriptions CSS block ytd-guide-collapsible-section-entry-renderer token/);
  assert.match(source, /3 DOM fallback subscriptions CSS block :has\( tokens/);
  assert.match(source, /1 DOM fallback subscriptions CSS block \/feed\/history token/);
  assert.match(source, /1 DOM fallback subscriptions CSS block a\[href\^="\/@"\] token/);
  assert.match(source, /6 runtime hideSubscriptions fixtures/);
  assert.match(source, /does not remove JSON Subscriptions guide sections or neighboring supported rows/);
  assert.match(source, /ordinary keyword rules can remove a neighboring supported row while Subscriptions guide JSON remains/);
  assert.match(source, /`\/youtubei\/v1\/guide` still enters `processData` and does not run harvest-only with only `hideSubscriptions` enabled/);
  assert.match(source, /seed active JSON rules have no hide-subscriptions decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `\.yt-simple-endpoint\[href\^="\/feed\/subscriptions"\]`/);
  assert.match(source, /`ytd-browse\[page-subtype="subscriptions"\]`/);
  assert.match(source, /hide-subscriptions contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM Subscriptions parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /route no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /route policies/);
  assert.match(source, /first-class hide-subscriptions authority gates/);
  assert.match(source, /`jsonFirstHideSubscriptionsContract`, `jsonFirstHideSubscriptionsDecisionReport`, `jsonFirstSubscriptionsRendererInventoryPolicy`, `jsonFirstSubscriptionsJsonDomParityReport`, `jsonFirstSubscriptionsDomOnlyPolicy`, `jsonFirstSubscriptionsNoWorkBudget`, `jsonFirstSubscriptionsCacheInvalidationReport`, `jsonFirstSubscriptionsRoutePolicy`, `jsonFirstSubscriptionsSettingsParityReport`, `jsonFirstSubscriptionsFixtureProvenance`, or `jsonFirstSubscriptionsMetricArtifact`/);
});

test('active goal completion audit records JSON-first hideSearchShelves boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first hideSearchShelves boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_SEARCH_SHELVES_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-hide-search-shelves-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /hide-search-shelves proof/);
  assert.match(source, /6 hideSearchShelves boundary source files/);
  assert.match(source, /12 hideSearchShelves source\/effect blocks/);
  assert.match(source, /3 filter_logic shelfRenderer rule block lines/);
  assert.match(source, /103 filter_logic shelfRenderer rule block bytes/);
  assert.match(source, /3 filter_logic richShelfRenderer rule block lines/);
  assert.match(source, /93 filter_logic richShelfRenderer rule block bytes/);
  assert.match(source, /48 seed search skip block lines/);
  assert.match(source, /2438 seed search skip block bytes/);
  assert.match(source, /8 DOM fallback search-shelves CSS rules block lines/);
  assert.match(source, /314 DOM fallback search-shelves CSS rules block bytes/);
  assert.match(source, /1 settings_shared search-shelves compile block line/);
  assert.match(source, /51 settings_shared search-shelves compile block bytes/);
  assert.match(source, /0 filter_logic total hideSearchShelves tokens/);
  assert.match(source, /0 seed total hideSearchShelves tokens/);
  assert.match(source, /2 DOM fallback total hideSearchShelves tokens/);
  assert.match(source, /12 background total hideSearchShelves tokens/);
  assert.match(source, /23 settings_shared total hideSearchShelves tokens/);
  assert.match(source, /1 bridge_settings total hideSearchShelves token/);
  assert.match(source, /2 filter_logic total shelfRenderer tokens/);
  assert.match(source, /2 filter_logic total richShelfRenderer tokens/);
  assert.match(source, /0 filter_logic total gridShelfViewModel tokens/);
  assert.match(source, /1 seed total shelfRenderer token/);
  assert.match(source, /1 seed total richShelfRenderer token/);
  assert.match(source, /1 seed total gridShelfViewModel token/);
  assert.match(source, /13 DOM fallback total ytd-shelf-renderer tokens/);
  assert.match(source, /2 DOM fallback total ytd-horizontal-card-list-renderer tokens/);
  assert.match(source, /1 DOM fallback search-shelves CSS block ytd-shelf-renderer token/);
  assert.match(source, /1 DOM fallback search-shelves CSS block ytd-horizontal-card-list-renderer token/);
  assert.match(source, /2 DOM fallback search-shelves CSS block #primary > \.ytd-two-column-search-results-renderer tokens/);
  assert.match(source, /7 runtime hideSearchShelves fixtures/);
  assert.match(source, /does not remove JSON search shelves or neighboring supported rows/);
  assert.match(source, /ordinary keyword rules can remove a matching `shelfRenderer` while Search Shelves JSON control remains unrelated to that removal/);
  assert.match(source, /`\/youtubei\/v1\/search` runs harvest-only and does not call `processData` with only `hideSearchShelves` enabled on `\/results`/);
  assert.match(source, /`\/youtubei\/v1\/search` enters `processData` when an ordinary keyword rule is active with `hideSearchShelves` enabled/);
  assert.match(source, /seed active JSON rules have no hide-search-shelves decision/);
  assert.match(source, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(source, /content bridge storage refresh includes it/);
  assert.match(source, /DOM fallback owns `#primary > \.ytd-two-column-search-results-renderer ytd-shelf-renderer`/);
  assert.match(source, /`#primary > \.ytd-two-column-search-results-renderer ytd-horizontal-card-list-renderer`/);
  assert.match(source, /hide-search-shelves contracts/);
  assert.match(source, /renderer inventory policies/);
  assert.match(source, /JSON\/DOM Search Shelves parity reports/);
  assert.match(source, /DOM-only policy reports/);
  assert.match(source, /route no-work budgets/);
  assert.match(source, /cache invalidation reports/);
  assert.match(source, /route policies/);
  assert.match(source, /first-class hide-search-shelves authority gates/);
  assert.match(source, /`jsonFirstHideSearchShelvesContract`, `jsonFirstHideSearchShelvesDecisionReport`, `jsonFirstSearchShelvesRendererInventoryPolicy`, `jsonFirstSearchShelvesJsonDomParityReport`, `jsonFirstSearchShelvesDomOnlyPolicy`, `jsonFirstSearchShelvesNoWorkBudget`, `jsonFirstSearchShelvesCacheInvalidationReport`, `jsonFirstSearchShelvesRoutePolicy`, `jsonFirstSearchShelvesSettingsParityReport`, `jsonFirstSearchShelvesFixtureProvenance`, or `jsonFirstSearchShelvesMetricArtifact`/);
});

test('active goal completion audit records JSON-first disableAutoplay/disableAnnotations boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first disableAutoplay\/disableAnnotations boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_DISABLE_AUTOPLAY_ANNOTATIONS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-disable-autoplay-annotations-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /player-control proof/);
  assert.match(source, /6 disableAutoplay\/disableAnnotations boundary source files/);
  assert.match(source, /10 disableAutoplay\/disableAnnotations source\/effect blocks/);
  assert.match(source, /8 filter_logic shared video renderer rules block lines/);
  assert.match(source, /415 filter_logic shared video renderer rules block bytes/);
  assert.match(source, /8 DOM fallback autoplay CSS rules block lines/);
  assert.match(source, /235 DOM fallback autoplay CSS rules block bytes/);
  assert.match(source, /8 DOM fallback annotations CSS rules block lines/);
  assert.match(source, /185 DOM fallback annotations CSS rules block bytes/);
  assert.match(source, /2 settings_shared disable controls compile block lines/);
  assert.match(source, /102 settings_shared disable controls compile block bytes/);
  assert.match(source, /0 filter_logic total disableAutoplay tokens/);
  assert.match(source, /0 filter_logic total disableAnnotations tokens/);
  assert.match(source, /0 seed total disableAutoplay tokens/);
  assert.match(source, /0 seed total disableAnnotations tokens/);
  assert.match(source, /1 DOM fallback total disableAutoplay token/);
  assert.match(source, /1 DOM fallback total disableAnnotations token/);
  assert.match(source, /12 background total disableAutoplay tokens/);
  assert.match(source, /12 background total disableAnnotations tokens/);
  assert.match(source, /23 settings_shared total disableAutoplay tokens/);
  assert.match(source, /23 settings_shared total disableAnnotations tokens/);
  assert.match(source, /1 bridge_settings total disableAutoplay token/);
  assert.match(source, /1 bridge_settings total disableAnnotations token/);
  assert.match(source, /0 filter_logic total compactAutoplayRenderer tokens/);
  assert.match(source, /4 filter_logic total endScreenVideoRenderer tokens/);
  assert.match(source, /1 DOM fallback autoplay CSS block button\[data-tooltip-target-id="ytp-autonav-toggle-button"\] token/);
  assert.match(source, /1 DOM fallback autoplay CSS block \.autonav-endscreen token/);
  assert.match(source, /1 DOM fallback annotations CSS block \.annotation token/);
  assert.match(source, /1 DOM fallback annotations CSS block \.iv-branding token/);
  assert.match(source, /6 runtime disableAutoplay\/disableAnnotations fixtures/);
  assert.match(source, /compact autoplay and supported end-screen JSON rows pass through unchanged when only `disableAutoplay` and `disableAnnotations` are enabled/);
  assert.match(source, /ordinary keyword rules can remove a matching supported `endScreenVideoRenderer` while a matching `compactAutoplayRenderer` remains/);
  assert.match(source, /`\/youtubei\/v1\/next` still enters `processData` with only both disable controls enabled/);
  assert.match(source, /seed active JSON rules have no disable-autoplay or disable-annotations decision/);
  assert.match(source, /background reads and compiles both settings but storage-change invalidation omits both/);
  assert.match(source, /content bridge storage refresh includes both/);
  assert.match(source, /DOM fallback owns `button\[data-tooltip-target-id="ytp-autonav-toggle-button"\]`, `\.autonav-endscreen`, `\.annotation`, and `\.iv-branding`/);
  assert.match(source, /player-control contracts/);
  assert.match(source, /JSON\/DOM player control parity reports/);
  assert.match(source, /compact-autoplay gap reports/);
  assert.match(source, /first-class disable-autoplay\/annotations authority gates/);
  assert.match(source, /`jsonFirstDisableAutoplayAnnotationsContract`, `jsonFirstDisableAutoplayAnnotationsDecisionReport`, `jsonFirstPlayerControlRendererInventoryPolicy`, `jsonFirstPlayerControlJsonDomParityReport`, `jsonFirstPlayerControlDomOnlyPolicy`, `jsonFirstCompactAutoplayGapReport`, `jsonFirstPlayerControlNoWorkBudget`, `jsonFirstPlayerControlCacheInvalidationReport`, `jsonFirstPlayerControlRoutePolicy`, `jsonFirstPlayerControlSettingsParityReport`, `jsonFirstPlayerControlFixtureProvenance`, or `jsonFirstPlayerControlMetricArtifact`/);
});

test('active goal completion audit records enabled master switch disabled-runtime boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Enabled master switch disabled-runtime boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_ENABLED_MASTER_SWITCH_DISABLED_RUNTIME_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/enabled-master-switch-disabled-runtime-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /dedicated master-switch proof/);
  assert.match(source, /7 enabled disabled-runtime source files/);
  assert.match(source, /14 source\/effect blocks/);
  assert.match(source, /seed fetch disabled parse\/stringify work/);
  assert.match(source, /seed XHR disabled pre-body return/);
  assert.match(source, /engine harvest-before-disabled behavior/);
  assert.match(source, /DOM fallback active-work and disabled cleanup gates/);
  assert.match(source, /background compile inclusion/);
  assert.match(source, /background storage invalidation omission/);
  assert.match(source, /content bridge refresh inclusion/);
  assert.match(source, /StateManager external reload inclusion/);
  assert.match(source, /codebase inspection is finding future optimization locations and first-class JSON filter blockers/);
  assert.match(source, /disabled pass-through budgets/);
  assert.match(source, /XHR listener budgets/);
  assert.match(source, /engine harvest permission/);
  assert.match(source, /DOM restore proof/);
  assert.match(source, /settings refresh parity/);
  assert.match(source, /JSON-first promotion gates/);
  assert.match(source, /`enabledMasterSwitchRuntimeContract`, `enabledDisabledNoWorkDecisionReport`, `enabledSeedTransportNoWorkBudget`, `enabledEngineHarvestBeforeSkipReport`, `enabledDomFallbackActiveGateReport`, `enabledSettingsRefreshParityReport`, `enabledBackgroundCacheInvalidationReport`, `enabledDisabledRuntimeFixtureProvenance`, `enabledDisabledRuntimeMetricArtifact`, or `enabledRuntimeAuthorityGate`/);
});

test('active goal completion audit records stats surface legacy metric boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Stats surface legacy metric boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_STATS_SURFACE_LEGACY_METRIC_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/stats-surface-legacy-metric-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /source-pinned metric side-effect proof/);
  assert.match(source, /6 stats metric boundary source files/);
  assert.match(source, /14 source\/effect blocks/);
  assert.match(source, /2 content bridge storage reads for stats in pinned blocks/);
  assert.match(source, /1 content bridge storage write for stats in pinned blocks/);
  assert.match(source, /1 background legacy stats storage read/);
  assert.match(source, /1 background legacy stats storage write/);
  assert.match(source, /1 StateManager external reload `stats` entry/);
  assert.match(source, /0 StateManager external reload `statsBySurface` entries/);
  assert.match(source, /2 dashboard stats rotation listener callsites/);
  assert.match(source, /2 dashboard stats rotation timer callsites/);
  assert.match(source, /DOM hide\/restore still couples stats and media side effects/);
  assert.match(source, /content stats use `statsBySurface` with Main legacy fallback/);
  assert.match(source, /restore accounting depends on `data-filtertube-time-saved`/);
  assert.match(source, /legacy `recordTimeSaved` writes caller-provided seconds into `stats`/);
  assert.match(source, /StateManager loads but does not externally reload on `statsBySurface`/);
  assert.match(source, /dashboard falls back to legacy Main stats/);
  assert.match(source, /structured hide eligibility/);
  assert.match(source, /trusted\/ranged legacy metric writes/);
  assert.match(source, /dashboard refresh parity/);
  assert.match(source, /JSON-side metric eligibility/);
  assert.match(source, /`statsSurfaceMetricBoundaryContract`, `statsSideEffectAuthority`, `statsStructuredHideDecisionReport`, `statsLegacyRecordTimeSavedGate`, `statsSurfaceRefreshParityReport`, `statsStorageWriteBudget`, `statsDashboardFallbackDecision`, `statsNoRuleMetricEligibilityReport`, `statsMediaSideEffectSeparationReport`, or `statsMetricArtifact`/);
});

test('active goal completion audit records prompt release overlay boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Prompt release overlay boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_PROMPT_RELEASE_OVERLAY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/prompt-release-overlay-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /source-pinned prompt owner proof/);
  assert.match(source, /10 prompt release boundary source files/);
  assert.match(source, /12 source\/effect blocks/);
  assert.match(source, /4 browser manifest prompt load-order lists/);
  assert.match(source, /2 prompt content modules/);
  assert.match(source, /2 overlay prompt ids/);
  assert.match(source, /5 background prompt action branches/);
  assert.match(source, /24 release note data entries/);
  assert.match(source, /23 release note version rows/);
  assert.match(source, /staged newest release-note version `3\.3\.2`/);
  assert.match(source, /packaged extension\/browser version `3\.3\.1`/);
  assert.match(source, /release-before-first-run-before-content-bridge manifest order/);
  assert.match(source, /install\/update first-run prompt injection/);
  assert.match(source, /update release-note payload staging/);
  assert.match(source, /top-right adjacent overlay placement/);
  assert.match(source, /local mobile CSS/);
  assert.match(source, /release\/first-run acknowledgement storage writes/);
  assert.match(source, /direct `request\?\.url` What's New tab opening/);
  assert.match(source, /content fallback `window\.open`\/`location\.href`/);
  assert.match(source, /dashboard release-note rendering/);
  assert.match(source, /staged release-note\/public-claim drift/);
  assert.match(source, /prompt owner and priority/);
  assert.match(source, /acknowledgement sender-class proof/);
  assert.match(source, /URL navigation policy/);
  assert.match(source, /mobile viewport fit/);
  assert.match(source, /release version gates/);
  assert.match(source, /style-node teardown/);
  assert.match(source, /JSON-first public-claim gates/);
  assert.match(source, /`promptReleaseOverlayBoundaryContract`, `promptCoordinatorDecisionReport`, `promptPriorityQueueContract`, `promptAckSenderClassGate`, `promptWhatsNewUrlPolicy`, `promptViewportFitReport`, `promptReleaseNoteVersionGate`, `promptStyleTeardownRegistry`, `promptInstallUpdateFixtureProvenance`, or `promptFirstClassJsonClaimGate`/);
});

test('active goal completion audit records release build artifact claim boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Release build artifact claim boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_RELEASE_BUILD_ARTIFACT_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/release-build-artifact-claim-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /joined artifact-claim boundary/);
  assert.match(source, /9 release build artifact boundary source files/);
  assert.match(source, /11 source\/effect blocks/);
  assert.match(source, /browser\/package version `3\.3\.1`/);
  assert.match(source, /staged newest release-note version `3\.3\.2`/);
  assert.match(source, /24 release note data entries/);
  assert.match(source, /23 release note version rows/);
  assert.match(source, /broad package directories/);
  assert.match(source, /common package files/);
  assert.match(source, /build script README mutation/);
  assert.match(source, /browser ZIP checksum absence/);
  assert.match(source, /public non-draft release creation before asset upload proof/);
  assert.match(source, /mobile `\.sha256` staging/);
  assert.match(source, /0 package\/public-claim\/artifact manifests/);
  assert.match(source, /5 runtime guard fixtures/);
  assert.match(source, /codebase inspection is finding future optimization locations and first-class JSON filter blockers/);
  assert.match(source, /package manifests/);
  assert.match(source, /README mutation gates/);
  assert.match(source, /draft-first release flow/);
  assert.match(source, /upload rollback/);
  assert.match(source, /mobile artifact claim gates/);
  assert.match(source, /ZIP checksum manifests/);
  assert.match(source, /generated UI freshness/);
  assert.match(source, /browser manifest parity/);
  assert.match(source, /public claim fixtures/);
  assert.match(source, /first-class JSON claim gates/);
  assert.match(source, /`releaseBuildArtifactClaimContract`, `releasePackageManifestAuthority`, `releaseReadmeMutationGate`, `releaseDraftFirstGate`, `releaseAssetUploadRollbackPlan`, `releaseMobileArtifactClaimGate`, `releaseZipChecksumManifest`, `releaseGeneratedUiFreshnessGate`, `releaseBrowserManifestParityReport`, `releasePublicClaimFixtureProvenance`, or `releaseFirstClassJsonClaimGate`/);
  assert.match(source, /2026-05-27 release-package and installed-runtime provenance continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_P0_RELEASE_PACKAGE_CURRENT_BEHAVIOR_2026-05-19.md'));
  assert.ok(source.includes('tests/runtime/p0-release-package-current-behavior.test.mjs'));
  assert.match(source, /current ignored `dist\/` package tree and local Chrome Default profile evidence/);
  assert.match(source, /23 combined unique referenced paths/);
  assert.match(source, /0 unresolved manifest file references/);
  assert.match(source, /0 manifest referenced roots outside `COMMON_DIRS`/);
  assert.match(source, /5 exact permissions per manifest/);
  assert.match(source, /3 exact host permissions per manifest/);
  assert.match(source, /active matches limited to `youtube\.com` and `youtubekids\.com`/);
  assert.match(source, /4 host-only `youtube-nocookie\.com` gaps/);
  assert.match(source, /current MAIN\/ISOLATED content-script world split/);
  assert.match(source, /3 browser staged directories/);
  assert.match(source, /58 staged files per browser/);
  assert.match(source, /3 ZIP artifacts/);
  assert.match(source, /177 total `dist` files/);
  assert.match(source, /57 source-backed non-manifest staged files per browser/);
  assert.match(source, /57 byte-identical source-backed non-manifest staged files per browser/);
  assert.match(source, /extension id `gkgjigdfdccckblmglboobikfcpeelio`/);
  assert.match(source, /workspace root `\/Users\/devanshvarshney\/FilterTube`/);
  assert.match(source, /stored version `3\.3\.1`/);
  assert.match(source, /no packed `Default\/Extensions\/<id>` directory/);
  assert.match(source, /workspace ampersand Topic fix token/);
  assert.match(source, /Default installed permission parity evidence/);
  assert.match(source, /active\/granted API permissions `activeTab`, `downloads`, `scripting`, `storage`, and `tabs`/);
  assert.match(source, /explicit hosts `youtube-nocookie\.com`, `youtube\.com`, and `youtubekids\.com`/);
  assert.match(source, /scriptable hosts `youtube\.com` and `youtubekids\.com`/);
  assert.match(source, /known scriptable `youtube-nocookie\.com` gap/);
  assert.match(source, /no disable reasons, and no withholding permissions/);
  assert.match(source, /visible Default Chrome without remote debugging/);
  assert.match(source, /separate automation Chrome profile using `\/private\/tmp\/filtertube-live-spa-chrome-profile` on CDP port 9222/);
  assert.match(source, /loaded-browser package\/runtime parity authority/);
  assert.match(source, /active-tab permission use proof/);
  assert.match(source, /incognito runtime availability/);
  assert.match(source, /visible YouTube tab content-script byte parity/);
  assert.match(source, /extension reload timestamp authority/);
  assert.match(source, /release publication authority remain `NO-GO`/);
  assert.match(source, /2026-05-30 manifest incognito static boundary continuation/);
  assert.match(source, /all four source manifests lack an explicit\s+`incognito` key/);
  assert.match(source, /retaining YouTube and YouTube Kids content-script match\s+coverage and the existing host-only `youtube-nocookie\.com` gap/);
  assert.match(source, /repository manifests and Default-profile files cannot prove that an active\s+private\/incognito session loaded FilterTube/);
  assert.match(source, /Source manifest incognito runtime\s+authority, active incognito session runtime authority, active-tab byte parity,\s+and release\/public-claim use remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by this\s+continuation: no; the broad audit remains active/);
  assert.match(source, /2026-05-30 Chrome profile substitution proof continuation/);
  assert.match(source, /user-observed testing confusion to the active\s+release\/runtime gate/);
  assert.match(source, /visible Default Chrome process is recorded as\s+`\/Applications\/Google Chrome\.app\/Contents\/MacOS\/Google Chrome` with no explicit\s+`--user-data-dir`, no `--remote-debugging-port`, and no Default\s+`DevToolsActivePort` file/);
  assert.match(source, /separate automation Chrome process is recorded\s+with `--user-data-dir=\/private\/tmp\/filtertube-live-spa-chrome-profile`,\s+`--remote-debugging-port=9222`,\s+`--load-extension=\/Users\/devanshvarshney\/FilterTube`/);
  assert.match(source, /automation profile\s+extension id `gkgjigdfdccckblmglboobikfcpeelio`/);
  assert.match(source, /automation profile extension\s+path `\/Users\/devanshvarshney\/FilterTube`, CDP browser `Chrome\/148\.0\.7778\.179`,\s+protocol `1\.3`, WebSocket URL present, and CDP target count observed: 0/);
  assert.match(source, /This\s+proves profile substitution risk, not live YouTube parity/);
  assert.match(source, /Default profile\s+workspace path proof remains `PARTIAL`, automation profile proof remains\s+`PARTIAL`, visible Default Chrome CDP target list authority remains `NO-GO`/);
  assert.match(source, /visible YouTube tab content-script byte parity authority remains `NO-GO`,\s+visible YouTube tab extension reload timestamp authority remains `NO-GO`,\s+active incognito session runtime authority remains `NO-GO`/);
  assert.match(source, /Future lag, whitelist, menu, or incognito proof must be\s+labeled as visible Default-profile proof or automation-profile proof; the\s+latter cannot replace the former/);
  assert.match(source, /2026-05-30 release package\/profile parity current-source rerun/);
  assert.match(source, /passed 40\/40 tests/);
  assert.match(source, /node --test --test-reporter=spec tests\/runtime\/p0-release-package-current-behavior\.test\.mjs tests\/runtime\/release-package-parity-current-behavior\.test\.mjs tests\/runtime\/release-build-artifact-claim-boundary-current-behavior\.test\.mjs tests\/runtime\/build-release-method-semantic-register-current-behavior\.test\.mjs tests\/runtime\/prompt-release-overlay-boundary-current-behavior\.test\.mjs tests\/runtime\/release-notes-json-version-gate-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_P0_RELEASE_PACKAGE_CURRENT_BEHAVIOR_2026-05-19\.md`\s+for package\/profile provenance/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_RELEASE_PACKAGE_PARITY_AUDIT_2026-05-18\.md` for the\s+package-root and release-parity gate/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_RELEASE_BUILD_ARTIFACT_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md`\s+for package\/public-claim artifact limits/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_BUILD_RELEASE_METHOD_SEMANTIC_REGISTER_2026-05-21\.md`\s+for build\/release method semantics/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_PROMPT_RELEASE_OVERLAY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md`\s+for install\/update prompt ownership/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_RELEASE_NOTES_JSON_VERSION_GATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md`\s+for release-note version drift/);
  assert.match(source, /local package roots, manifest references, staged `dist\/` contents, Default\s+profile workspace path evidence, static incognito manifest absence, and\s+automation-profile substitution risk are documented/);
  assert.match(source, /no committed package\s+manifest authority, reproducible package build authority, loaded active-tab byte\s+parity, extension reload timestamp proof, active incognito runtime proof, public\s+claim manifest, release upload proof, or release publication authority exists/);
  assert.match(source, /Runtime behavior changed by this rerun: no/);
  assert.match(source, /Release readiness,\s+installed-visible-tab parity, incognito runtime availability,\s+whitelist\/cache optimization, JSON-first promotion, release\/public-claim use,\s+and `update_goal\(status='complete'\)` remain `NO-GO`/);
});

test('active goal completion audit records content control JSON-first boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content control JSON-first boundary index addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_CONTROL_JSON_FIRST_BOUNDARY_INDEX_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/content-control-json-first-boundary-index-current-behavior\.test\.mjs/);
  assert.match(source, /one catalog-to-boundary index/);
  assert.match(source, /4 content control JSON-first boundary source files/);
  assert.match(source, /7 catalog groups/);
  assert.match(source, /29 catalog controls/);
  assert.match(source, /27 catalog controls with JSON-first-named proof docs/);
  assert.match(source, /27 unique proof docs/);
  assert.match(source, /27 unique proof tests/);
  assert.match(source, /2 runtime alias controls/);
  assert.match(source, /27 direct runtime key controls/);
  assert.match(source, /2 default-on affordance controls/);
  assert.match(source, /`core=3`, `feed=6`, `watch=4`, `video_info=6`, `player=4`, `navigation=5`, and `search=1`/);
  assert.match(source, /every catalog key from `hideShorts` through `hideSearchShelves`/);
  assert.match(source, /`hideShorts` maps to runtime `hideAllShorts`/);
  assert.match(source, /`hideComments` maps to runtime `hideAllComments`/);
  assert.match(source, /`showQuickBlockButton` and `showBlockMenuItem` are action affordances rather than JSON row-filter controls/);
  assert.match(source, /shared settings uses `hideAllShorts` and `hideAllComments`/);
  assert.match(source, /StateManager valid UI keys use `hideShorts` and `hideComments`/);
  assert.match(source, /background storage-change invalidation includes `hideAllShorts` and `hideComments` but not `hideAllComments` or `hideShorts`/);
  assert.match(source, /catalog\/runtime key contract/);
  assert.match(source, /JSON\/DOM parity matrix/);
  assert.match(source, /settings invalidation parity report/);
  assert.match(source, /per-control no-work budgets/);
  assert.match(source, /`contentControlJsonFirstBoundaryIndex`, `contentControlRuntimeSettingContract`, `contentControlBoundaryProofManifest`, `contentControlAliasPolicy`, `contentControlJsonDomParityMatrix`, `contentControlNoWorkBudgetMatrix`, `contentControlSettingsInvalidationParityReport`, `contentControlFixtureProvenance`, or `contentControlFirstClassJsonGate`/);
});

test('active goal completion audit records content control active-work matrix without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content control active-work matrix addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_CONTROL_ACTIVE_WORK_MATRIX_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/content-control-active-work-matrix-current-behavior\.test\.mjs/);
  assert.match(source, /work-permission proof/);
  assert.match(source, /8 content control active-work matrix source files/);
  assert.match(source, /12 source\/effect blocks/);
  assert.match(source, /7 catalog groups/);
  assert.match(source, /29 catalog controls/);
  assert.match(source, /2 runtime alias controls/);
  assert.match(source, /2 seed active JSON predicate controls/);
  assert.match(source, /2 filter_logic direct content-control decision controls/);
  assert.match(source, /25 DOM active gate controls/);
  assert.match(source, /26 DOM style controls/);
  assert.match(source, /4 background exact-runtime invalidation controls/);
  assert.match(source, /1 background alias-only invalidation control/);
  assert.match(source, /24 background omitted invalidation controls/);
  assert.match(source, /29 content bridge refresh controls/);
  assert.match(source, /29 StateManager reload controls/);
  assert.match(source, /6 runtime content-control active-work matrix fixtures/);
  assert.match(source, /seed JSON and filter_logic direct decisions admit only `hideAllShorts` and `hideAllComments`/);
  assert.match(source, /DOM active gating omits `showQuickBlockButton`, `showBlockMenuItem`, `disableAutoplay`, and `disableAnnotations`/);
  assert.match(source, /DOM style branches omit `hideShorts`, `showQuickBlockButton`, and `showBlockMenuItem`/);
  assert.match(source, /background exact invalidation covers `hideAllShorts`, `hideHomeFeed`, `hideSponsoredCards`, and `hideMembersOnly`/);
  assert.match(source, /`hideComments` is alias-only invalidation for runtime `hideAllComments`/);
  assert.match(source, /content bridge plus StateManager watch all 29 controls without proving background cache freshness or JSON no-work behavior/);
  assert.match(source, /runtime key manifests/);
  assert.match(source, /JSON work decisions/);
  assert.match(source, /DOM work decisions/);
  assert.match(source, /background invalidation policies/);
  assert.match(source, /affordance-work policies/);
  assert.match(source, /player DOM-only policies/);
  assert.match(source, /first-class JSON promotion gates/);
  assert.match(source, /`contentControlActiveWorkMatrixContract`, `contentControlJsonWorkDecision`, `contentControlDomWorkDecision`, `contentControlRuntimeKeyManifest`, `contentControlNoWorkBudgetReport`, `contentControlBackgroundInvalidationPolicy`, `contentControlAffordanceWorkPolicy`, `contentControlPlayerDomOnlyPolicy`, `contentControlOptimizationMetricArtifact`, `contentControlActiveWorkFixtureProvenance`, or `contentControlFirstClassJsonPromotionGate`/);
});

test('active goal completion audit records content control DOM style selector matrix without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content control DOM style selector matrix addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_CONTROL_DOM_STYLE_SELECTOR_MATRIX_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/content-control-dom-style-selector-matrix-current-behavior\.test\.mjs/);
  assert.match(source, /selector\/effect proof/);
  assert.match(source, /2 content-control DOM style selector matrix source files/);
  assert.match(source, /27 source\/effect blocks/);
  assert.match(source, /7 catalog groups/);
  assert.match(source, /29 catalog controls/);
  assert.match(source, /26 controls that can affect DOM style output/);
  assert.match(source, /25 direct style selector branches/);
  assert.match(source, /3 catalog controls without DOM style branch/);
  assert.match(source, /1 catalog control resolved through DOM style runtime alias/);
  assert.match(source, /5 unconditional mobile open-app selector rows/);
  assert.match(source, /111 control-gated selector rows/);
  assert.match(source, /116 total selector rows/);
  assert.match(source, /46 `:has\(\)` selector tokens/);
  assert.match(source, /5 `:not\(:has\(\.\.\.\)\)` selector tokens/);
  assert.match(source, /6 runtime content-control DOM style selector matrix fixtures/);
  assert.match(source, /`ensureContentControlStyles\(\)` has 345 lines and 12583 bytes/);
  assert.match(source, /26 `rules\.push` callsites/);
  assert.match(source, /1 `style\.textContent` assignment/);
  assert.match(source, /`hideMembersOnly` is the largest branch with 31 selector rows/);
  assert.match(source, /catalog `hideComments` maps to runtime `hideAllComments`/);
  assert.match(source, /`hideVideoInfo` drives five child branches through `hideInfoMaster`/);
  assert.match(source, /explicit `hideAskButton` and `hideMerchTicketsOffers` are not directly wrapped by `listMode !== 'whitelist'`/);
  assert.match(source, /one shared `#filtertube-content-controls-style` node is rewritten from local settings/);
  assert.match(source, /selector ownership/);
  assert.match(source, /route\/surface scope/);
  assert.match(source, /negative sibling-visible fixtures/);
  assert.match(source, /JSON\/DOM parity decisions/);
  assert.match(source, /`contentControlDomStyleSelectorMatrix`, `contentControlDomStyleSelectorManifest`, `contentControlStyleSelectorOwnerReport`, `contentControlStyleSelectorEffectDecision`, `contentControlStyleRestoreProof`, `contentControlStyleSiblingFixtureReport`, `contentControlHasSelectorSupportPolicy`, `contentControlStyleNoWorkBudget`, `contentControlStyleMetricArtifact`, or `contentControlStyleFirstClassJsonGate`/);
});

test('active goal completion audit records content control DOM style lifecycle restore without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content control DOM style lifecycle restore addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_CONTROL_DOM_STYLE_LIFECYCLE_RESTORE_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/content-control-dom-style-lifecycle-restore-current-behavior\.test\.mjs/);
  assert.match(source, /style lifecycle and restore proof/);
  assert.match(source, /1 content-control DOM style lifecycle source file/);
  assert.match(source, /6 source\/effect blocks/);
  assert.match(source, /345 ensureContentControlStyles block lines/);
  assert.match(source, /12583 ensureContentControlStyles bytes/);
  assert.match(source, /68 hasActiveDOMFallbackWork block lines/);
  assert.match(source, /2333 hasActiveDOMFallbackWork bytes/);
  assert.match(source, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(source, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(source, /14 no-active cleanup branch lines/);
  assert.match(source, /629 no-active cleanup branch bytes/);
  assert.match(source, /21 disabled cleanup branch lines/);
  assert.match(source, /959 disabled cleanup branch bytes/);
  assert.match(source, /26 style writer rules\.push callsites/);
  assert.match(source, /1 style writer textContent assignment/);
  assert.match(source, /0 style writer rules\.length empty-state gates/);
  assert.match(source, /0 clear-stale style node removal callsites/);
  assert.match(source, /6 runtime content-control DOM style lifecycle fixtures/);
  assert.match(source, /writer creates one reusable `#filtertube-content-controls-style` node/);
  assert.match(source, /active writer calls always retain unconditional mobile open-app cleanup CSS/);
  assert.match(source, /toggling `hideHomeFeed` off rewrites CSS and drops home selectors while preserving open-app cleanup/);
  assert.match(source, /no-active branch can return before `ensureContentControlStyles\(\)` runs/);
  assert.match(source, /`enabled === false`, `disableAutoplay` alone, and `disableAnnotations` alone are not active DOM fallback work/);
  assert.match(source, /stale cleanup blanks the shared style node without removing it/);
  assert.match(source, /node lifecycle report/);
  assert.match(source, /selector-owner restore proof/);
  assert.match(source, /no-active cleanup budget/);
  assert.match(source, /player DOM-only policy/);
  assert.match(source, /`contentControlStyleLifecycleRestoreMatrix`, `contentControlStyleNodeLifecycleReport`, `contentControlStyleRestoreProof`, `contentControlStyleRouteAttributeReport`, `contentControlStyleNoActiveCleanupBudget`, `contentControlStyleDisabledCleanupBudget`, `contentControlStyleOpenAppCleanupPolicy`, `contentControlStyleRegenDecisionReport`, `contentControlStyleNoWorkMetricArtifact`, or `contentControlStyleJsonFirstParityGate`/);
});

test('active goal completion audit records open app cleanup boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Open App cleanup boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_OPEN_APP_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/open-app-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct app-shell cleanup proof/);
  assert.match(source, /1 open-app cleanup boundary source file/);
  assert.match(source, /4 source\/effect blocks/);
  assert.match(source, /345 ensureContentControlStyles block lines/);
  assert.match(source, /12583 ensureContentControlStyles bytes/);
  assert.match(source, /22 hideYouTubeOpenAppButtons block lines/);
  assert.match(source, /961 hideYouTubeOpenAppButtons block bytes/);
  assert.match(source, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(source, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(source, /21 disabled cleanup branch lines/);
  assert.match(source, /959 disabled cleanup branch bytes/);
  assert.match(source, /1 direct querySelectorAll callsite/);
  assert.match(source, /1 direct selector literal callsite/);
  assert.match(source, /5 Open App classification predicates/);
  assert.match(source, /1 nearest `ytm-button-renderer` target-promotion callsite/);
  assert.match(source, /1 inline `display:none!important` write/);
  assert.match(source, /1 marker write/);
  assert.match(source, /0 marker removal callsites/);
  assert.match(source, /0 shared `toggleVisibility\(\)` callsites/);
  assert.match(source, /1 swallowed catch block/);
  assert.match(source, /5 style-writer Open App CSS selector rows/);
  assert.match(source, /0 clear-stale marker references/);
  assert.match(source, /0 disabled-cleanup marker references/);
  assert.match(source, /1 product runtime marker reference/);
  assert.match(source, /6 runtime open-app cleanup fixtures/);
  assert.match(source, /style writer emits 5 Open App CSS selector rows and calls direct cleanup once/);
  assert.match(source, /fake DOM execution hides label, `intent:\/\/`, `youtube:\/\/`, `open_app`, and Play Store Open App candidates/);
  assert.match(source, /wrapper targets are hidden when `closest\('ytm-button-renderer'\)` succeeds/);
  assert.match(source, /safe candidates remain visible/);
  assert.match(source, /query failures are swallowed/);
  assert.match(source, /no restore owner for `data-filtertube-hidden-open-app`/);
  assert.match(source, /app-shell cleanup contract/);
  assert.match(source, /selector policy/);
  assert.match(source, /target-shape report/);
  assert.match(source, /route\/surface policy/);
  assert.match(source, /sibling-visible fixture/);
  assert.match(source, /CSS\/direct-writer parity report/);
  assert.match(source, /JSON\/DOM parity gate/);
  assert.match(source, /`openAppCleanupBoundaryContract`, `openAppCleanupDecisionReport`, `openAppCleanupRestoreProof`, `openAppCleanupSelectorPolicy`, `openAppCleanupSettingsGate`, `openAppCleanupRoutePolicy`, `openAppCleanupMetricArtifact`, `openAppCleanupShellVsContentPolicy`, `openAppCleanupNoWorkBudget`, or `openAppCleanupJsonParityGate`/);
});

test('active goal completion audit records members-only DOM cleanup boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Members-only DOM cleanup boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_MEMBERS_ONLY_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/members-only-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct Members-only DOM cleanup proof/);
  assert.match(source, /1 members-only DOM cleanup boundary source file/);
  assert.match(source, /5 source\/effect blocks/);
  assert.match(source, /345 ensureContentControlStyles block lines/);
  assert.match(source, /12583 ensureContentControlStyles bytes/);
  assert.match(source, /41 members-only CSS block lines/);
  assert.match(source, /2483 members-only CSS block bytes/);
  assert.match(source, /81 members-only direct cleanup block lines/);
  assert.match(source, /5060 members-only direct cleanup block bytes/);
  assert.match(source, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(source, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(source, /21 disabled cleanup branch lines/);
  assert.match(source, /959 disabled cleanup branch bytes/);
  assert.match(source, /1 CSS rules\.push callsite/);
  assert.match(source, /1 CSS display-none declaration/);
  assert.match(source, /11 CSS membership class tokens/);
  assert.match(source, /9 CSS `Members only` tokens/);
  assert.match(source, /9 CSS `Member-only` tokens/);
  assert.match(source, /1 CSS watch-shell selector/);
  assert.match(source, /2 CSS `list=UUMO` tokens/);
  assert.match(source, /5 direct querySelectorAll callsites/);
  assert.match(source, /5 direct forEach callsites/);
  assert.match(source, /5 direct inline display writes/);
  assert.match(source, /5 generic marker writes/);
  assert.match(source, /5 specialized marker writes/);
  assert.match(source, /1 local display restore callsite/);
  assert.match(source, /1 specialized marker removal callsite/);
  assert.match(source, /5 direct closest callsites/);
  assert.match(source, /0 clear-stale specialized marker references/);
  assert.match(source, /0 disabled-cleanup specialized marker references/);
  assert.match(source, /7 product runtime specialized marker references/);
  assert.match(source, /1 product runtime specialized marker removal callsite/);
  assert.match(source, /6 runtime members-only DOM cleanup fixtures/);
  assert.match(source, /fake DOM execution hides title-aria, membership-badge, `UUMO` link, and shelf-title evidence/);
  assert.match(source, /badge cleanup hides both an immediate host and a parent shelf/);
  assert.match(source, /non-membership badge host stays visible/);
  assert.match(source, /local `hideMembersOnly === false` branch removes inline display, `data-filtertube-hidden`, and `data-filtertube-members-only-hidden`/);
  assert.match(source, /stale cleanup plus disabled cleanup omit the specialized Members-only marker/);
  assert.match(source, /DOM cleanup contract/);
  assert.match(source, /broad-hide decision report/);
  assert.match(source, /explicit DOM-only policy/);
  assert.match(source, /`membersOnlyDomCleanupBoundaryContract`, `membersOnlyDomCleanupDecisionReport`, `membersOnlyDomCleanupRestoreProof`, `membersOnlyDomCleanupSelectorPolicy`, `membersOnlyDomCleanupTargetShapeReport`, `membersOnlyDomCleanupRoutePolicy`, `membersOnlyDomCleanupSiblingFixture`, `membersOnlyDomCleanupStaleCleanupBudget`, `membersOnlyDomCleanupMetricArtifact`, or `membersOnlyDomCleanupJsonParityGate`/);
});

test('active goal completion audit records playlist/Mix DOM cleanup boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Playlist\/Mix DOM cleanup boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_PLAYLIST_MIX_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/playlist-mix-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct playlist\/Mix DOM cleanup proof/);
  assert.match(source, /1 playlist\/Mix DOM cleanup boundary source file/);
  assert.match(source, /8 source\/effect blocks/);
  assert.match(source, /345 ensureContentControlStyles block lines/);
  assert.match(source, /12583 ensureContentControlStyles bytes/);
  assert.match(source, /16 playlist-card CSS block lines/);
  assert.match(source, /998 playlist-card CSS block bytes/);
  assert.match(source, /15 Mix CSS block lines/);
  assert.match(source, /588 Mix CSS block bytes/);
  assert.match(source, /48 playlist\/Mix direct cleanup block lines/);
  assert.match(source, /2586 playlist\/Mix direct cleanup block bytes/);
  assert.match(source, /26 playlist-card direct block lines/);
  assert.match(source, /1457 playlist-card direct block bytes/);
  assert.match(source, /21 Mix chip direct block lines/);
  assert.match(source, /1127 Mix chip direct block bytes/);
  assert.match(source, /13 Mix card decision block lines/);
  assert.match(source, /564 Mix card decision block bytes/);
  assert.match(source, /18 explicit marker guard block lines/);
  assert.match(source, /1301 explicit marker guard block bytes/);
  assert.match(source, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(source, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(source, /21 disabled cleanup branch lines/);
  assert.match(source, /959 disabled cleanup branch bytes/);
  assert.match(source, /playlist CSS excludes Mix\/radio through `start_radio=1`/);
  assert.match(source, /Mix CSS owns radio renderer and `start_radio=1` selectors/);
  assert.match(source, /fake DOM execution hides valid playlist collection-stack lockups plus shelf\/horizontal containers/);
  assert.match(source, /Mix chip cleanup hides and restores only normalized Mixes chips/);
  assert.match(source, /per-card path sets and removes `data-filtertube-hidden-by-mix-radio`/);
  assert.match(source, /stale cleanup plus disabled cleanup omit that specialized Mix\/radio marker/);
  assert.match(source, /playlist\/Mix interaction policy/);
  assert.match(source, /CSS\/direct-writer parity report/);
  assert.match(source, /JSON\/DOM parity gate/);
  assert.match(source, /explicit DOM-only policy/);
  assert.match(source, /`playlistMixDomCleanupBoundaryContract`, `playlistMixDomCleanupDecisionReport`, `playlistMixDomCleanupRestoreProof`, `playlistMixDomCleanupSelectorPolicy`, `playlistMixDomCleanupTargetShapeReport`, `playlistMixDomCleanupInteractionPolicy`, `playlistMixDomCleanupStaleCleanupBudget`, `playlistMixDomCleanupDisabledRestoreProof`, `playlistMixDomCleanupMetricArtifact`, or `playlistMixDomCleanupJsonParityGate`/);
});

test('active goal completion audit records home-feed DOM cleanup boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Home-feed DOM cleanup boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_HOME_FEED_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/home-feed-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct home-feed DOM cleanup proof/);
  assert.match(source, /1 home-feed DOM cleanup boundary source file/);
  assert.match(source, /8 source\/effect blocks/);
  assert.match(source, /345 ensureContentControlStyles block lines/);
  assert.match(source, /12583 ensureContentControlStyles bytes/);
  assert.match(source, /12 home-feed CSS block lines/);
  assert.match(source, /622 home-feed CSS block bytes/);
  assert.match(source, /23 home-feed fallback block lines/);
  assert.match(source, /1286 home-feed fallback block bytes/);
  assert.match(source, /68 active DOM fallback work block lines/);
  assert.match(source, /2333 active DOM fallback work block bytes/);
  assert.match(source, /14 no-active cleanup branch lines/);
  assert.match(source, /629 no-active cleanup branch bytes/);
  assert.match(source, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(source, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(source, /21 disabled cleanup branch lines/);
  assert.match(source, /959 disabled cleanup branch bytes/);
  assert.match(source, /1 home-feed fallback callsite block line/);
  assert.match(source, /46 home-feed fallback callsite block bytes/);
  assert.match(source, /home-feed CSS contains desktop home selectors and mobile route-home selectors/);
  assert.match(source, /fake DOM execution hides queried targets on `\/` when `hideHomeFeed` is true/);
  assert.match(source, /writes `data-filtertube-hidden-by-hide-home-feed`/);
  assert.match(source, /unmarked off-route targets remain untouched/);
  assert.match(source, /previously marked off-route targets are restored/);
  assert.match(source, /no-active branch can call stale cleanup before the style writer and home helper run/);
  assert.match(source, /stale cleanup plus disabled cleanup omit the specialized home-feed marker/);
  assert.match(source, /mobile parity report/);
  assert.match(source, /CSS\/direct-writer parity report/);
  assert.match(source, /JSON\/DOM parity gate/);
  assert.match(source, /explicit DOM-only policy/);
  assert.match(source, /`homeFeedDomCleanupBoundaryContract`, `homeFeedDomCleanupDecisionReport`, `homeFeedDomCleanupRestoreProof`, `homeFeedDomCleanupSelectorPolicy`, `homeFeedDomCleanupMarkerReport`, `homeFeedDomCleanupRoutePolicy`, `homeFeedDomCleanupMobileParityReport`, `homeFeedDomCleanupStaleCleanupBudget`, `homeFeedDomCleanupDisabledRestoreProof`, `homeFeedDomCleanupMetricArtifact`, or `homeFeedDomCleanupJsonParityGate`/);
});

test('active goal completion audit records comments DOM cleanup boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Comments DOM cleanup boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_COMMENTS_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/comments-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct comments DOM cleanup proof/);
  assert.match(source, /1 comments DOM cleanup boundary source file/);
  assert.match(source, /10 source\/effect blocks/);
  assert.match(source, /345 ensureContentControlStyles block lines/);
  assert.match(source, /12583 ensureContentControlStyles bytes/);
  assert.match(source, /16 comments CSS block lines/);
  assert.match(source, /671 comments CSS block bytes/);
  assert.match(source, /30 collectMobileCommentEntryCards block lines/);
  assert.match(source, /1386 collectMobileCommentEntryCards block bytes/);
  assert.match(source, /42 comments global hide block lines/);
  assert.match(source, /1934 comments global hide block bytes/);
  assert.match(source, /17 comments restore\/input block lines/);
  assert.match(source, /781 comments restore\/input block bytes/);
  assert.match(source, /68 active DOM fallback work block lines/);
  assert.match(source, /2333 active DOM fallback work block bytes/);
  assert.match(source, /14 no-active cleanup branch lines/);
  assert.match(source, /629 no-active cleanup branch bytes/);
  assert.match(source, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(source, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(source, /21 disabled cleanup branch lines/);
  assert.match(source, /959 disabled cleanup branch bytes/);
  assert.match(source, /1 comments fallback callsite block line/);
  assert.match(source, /46 comments fallback callsite block bytes/);
  assert.match(source, /mobile comments collector runs only on `\/watch`/);
  assert.match(source, /promotes comment-looking candidates to their closest mobile comment container/);
  assert.match(source, /`hideAllComments` hides containers, classic threads, and collected mobile cards while writing `data-filtertube-mobile-comments-card`/);
  assert.match(source, /global branch returns before reply renderers and modern comment view-model renderers are toggled/);
  assert.match(source, /toggle-off restore removes the marker only from collected cards/);
  assert.match(source, /whitelist mode locally restores containers and the composer/);
  assert.match(source, /stale cleanup plus disabled cleanup omit the mobile comments marker/);
  assert.match(source, /whitelist-mode comments policy/);
  assert.match(source, /CSS\/direct-writer parity report/);
  assert.match(source, /JSON\/DOM parity gate/);
  assert.match(source, /explicit DOM-only policy/);
  assert.match(source, /`commentsDomCleanupBoundaryContract`, `commentsDomCleanupDecisionReport`, `commentsDomCleanupRestoreProof`, `commentsDomCleanupSelectorPolicy`, `commentsDomCleanupMarkerReport`, `commentsDomCleanupRoutePolicy`, `commentsDomCleanupMobileParityReport`, `commentsDomCleanupWhitelistPolicy`, `commentsDomCleanupStaleCleanupBudget`, `commentsDomCleanupDisabledRestoreProof`, `commentsDomCleanupMetricArtifact`, or `commentsDomCleanupJsonParityGate`/);
});

test('active goal completion audit records Shorts DOM cleanup boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Shorts DOM cleanup boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SHORTS_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/shorts-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct Shorts DOM cleanup proof/);
  assert.match(source, /1 Shorts DOM cleanup boundary source file/);
  assert.match(source, /12 source\/effect blocks/);
  assert.match(source, /68 active DOM fallback work block lines/);
  assert.match(source, /2333 active DOM fallback work block bytes/);
  assert.match(source, /14 no-active cleanup branch lines/);
  assert.match(source, /629 no-active cleanup branch bytes/);
  assert.match(source, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(source, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(source, /21 disabled cleanup branch lines/);
  assert.match(source, /959 disabled cleanup branch bytes/);
  assert.match(source, /29 Shorts collection block lines/);
  assert.match(source, /1651 Shorts collection block bytes/);
  assert.match(source, /22 Shorts container toggle block lines/);
  assert.match(source, /1165 Shorts container toggle block bytes/);
  assert.match(source, /29 disguised Shorts detection block lines/);
  assert.match(source, /1409 disguised Shorts detection block bytes/);
  assert.match(source, /54 Shorts selector\/extract block lines/);
  assert.match(source, /2084 Shorts selector\/extract block bytes/);
  assert.match(source, /141 Shorts card decision block lines/);
  assert.match(source, /7008 Shorts card decision block bytes/);
  assert.match(source, /91 container cleanup block lines/);
  assert.match(source, /5464 container cleanup block bytes/);
  assert.match(source, /24 home Shorts shelf cleanup block lines/);
  assert.match(source, /1638 home Shorts shelf cleanup block bytes/);
  assert.match(source, /18 search Shorts shelf cleanup block lines/);
  assert.match(source, /1234 search Shorts shelf cleanup block bytes/);
  assert.match(source, /9 runtime Shorts DOM cleanup fixtures/);
  assert.match(source, /Shorts collection gathers shelves, desktop guide entries, and mobile nav entries/);
  assert.match(source, /`hideAllShorts` hides collected containers with `data-filtertube-hidden-by-hide-all-shorts`/);
  assert.match(source, /toggle-off restore removes that marker and restores only when the shelf-title marker is absent/);
  assert.match(source, /disguised normal video cards are stamped from Shorts href, `play short`, or `SHORTS` overlay evidence/);
  assert.match(source, /Shorts card decisions promote targets to rich-item or grid-shelf parents/);
  assert.match(source, /`extractShortsVideoId\(\)` can join card evidence to `videoChannelMap`/);
  assert.match(source, /home and search Shorts shelves can be hidden as `Empty Shorts shelf`/);
  assert.match(source, /stale cleanup includes the hide-all-Shorts marker/);
  assert.match(source, /disabled cleanup does not directly name that marker/);
  assert.match(source, /mobile navigation report/);
  assert.match(source, /video-id join decision/);
  assert.match(source, /shelf cleanup decision/);
  assert.match(source, /CSS\/direct-writer parity report/);
  assert.match(source, /JSON\/DOM parity gate/);
  assert.match(source, /explicit DOM-only policy/);
  assert.match(source, /`shortsDomCleanupBoundaryContract`, `shortsDomCleanupDecisionReport`, `shortsDomCleanupRestoreProof`, `shortsDomCleanupSelectorPolicy`, `shortsDomCleanupTargetShapeReport`, `shortsDomCleanupRoutePolicy`, `shortsDomCleanupMobileNavReport`, `shortsDomCleanupDisguisedPolicy`, `shortsDomCleanupVideoIdJoinDecision`, `shortsDomCleanupShelfDecisionReport`, `shortsDomCleanupStaleCleanupBudget`, `shortsDomCleanupDisabledRestoreProof`, `shortsDomCleanupMetricArtifact`, or `shortsDomCleanupJsonParityGate`/);
});

test('active goal completion audit records sponsored-card DOM cleanup boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Sponsored Cards DOM cleanup boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SPONSORED_CARDS_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/sponsored-cards-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct sponsored-card DOM cleanup proof/);
  assert.match(source, /1 sponsored-card DOM cleanup boundary source file/);
  assert.match(source, /6 source\/effect blocks/);
  assert.match(source, /345 ensureContentControlStyles block lines/);
  assert.match(source, /12583 ensureContentControlStyles bytes/);
  assert.match(source, /15 sponsored-card CSS block lines/);
  assert.match(source, /567 sponsored-card CSS block bytes/);
  assert.match(source, /68 active DOM fallback work block lines/);
  assert.match(source, /2333 active DOM fallback work block bytes/);
  assert.match(source, /14 no-active cleanup branch lines/);
  assert.match(source, /629 no-active cleanup branch bytes/);
  assert.match(source, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(source, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(source, /21 disabled cleanup branch lines/);
  assert.match(source, /959 disabled cleanup branch bytes/);
  assert.match(source, /6 runtime sponsored-card DOM cleanup fixtures/);
  assert.match(source, /`hideSponsoredCards` writes ad-slot, in-feed ad, promoted sparkles, search PYV, display ad, companion ad, action companion ad, and engagement-panel ad selectors into the shared style node/);
  assert.match(source, /style regeneration removes those selectors when the setting turns off/);
  assert.match(source, /whitelist mode still emits the sponsored-card CSS branch/);
  assert.match(source, /unsupported `:has\(\)` support does not suppress sponsored-card selectors/);
  assert.match(source, /each active style-writer pass also calls Open App cleanup/);
  assert.match(source, /`hasActiveDOMFallbackWork\(\)` treats `hideSponsoredCards` as active DOM fallback work/);
  assert.match(source, /stale cleanup, disabled cleanup, and product runtime source contain no sponsored-card feature marker/);
  assert.match(source, /style selector policy/);
  assert.match(source, /ad-surface report/);
  assert.match(source, /JSON\/DOM parity gate/);
  assert.match(source, /`sponsoredCardsDomCleanupBoundaryContract`, `sponsoredCardsDomCleanupDecisionReport`, `sponsoredCardsDomCleanupStyleSelectorPolicy`, `sponsoredCardsDomCleanupTargetShapeReport`, `sponsoredCardsDomCleanupRoutePolicy`, `sponsoredCardsDomCleanupAdSurfaceReport`, `sponsoredCardsDomCleanupRestoreProof`, `sponsoredCardsDomCleanupStaleCleanupBudget`, `sponsoredCardsDomCleanupDisabledRestoreProof`, `sponsoredCardsDomCleanupMetricArtifact`, or `sponsoredCardsDomCleanupJsonParityGate`/);
});

test('active goal completion audit records watch playlist panel DOM cleanup boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Watch Playlist Panel DOM cleanup boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_WATCH_PLAYLIST_PANEL_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/watch-playlist-panel-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct watch playlist panel DOM cleanup proof/);
  assert.match(source, /1 watch-playlist-panel DOM cleanup boundary source file/);
  assert.match(source, /6 source\/effect blocks/);
  assert.match(source, /345 ensureContentControlStyles block lines/);
  assert.match(source, /12583 ensureContentControlStyles bytes/);
  assert.match(source, /9 watch-playlist-panel CSS block lines/);
  assert.match(source, /264 watch-playlist-panel CSS block bytes/);
  assert.match(source, /68 active DOM fallback work block lines/);
  assert.match(source, /2333 active DOM fallback work block bytes/);
  assert.match(source, /14 no-active cleanup branch lines/);
  assert.match(source, /629 no-active cleanup branch bytes/);
  assert.match(source, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(source, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(source, /21 disabled cleanup branch lines/);
  assert.match(source, /959 disabled cleanup branch bytes/);
  assert.match(source, /6 runtime watch-playlist-panel DOM cleanup fixtures/);
  assert.match(source, /`hideWatchPlaylistPanel` writes `ytd-playlist-panel-renderer`, `ytm-playlist-panel-renderer`, and `ytm-playlist-panel-renderer-v2` selectors into the shared style node/);
  assert.match(source, /style regeneration removes those selectors when the setting turns off/);
  assert.match(source, /whitelist mode still emits the watch playlist panel CSS branch/);
  assert.match(source, /unsupported `:has\(\)` support does not suppress watch playlist panel selectors/);
  assert.match(source, /each active style-writer pass also calls Open App cleanup/);
  assert.match(source, /`hasActiveDOMFallbackWork\(\)` treats `hideWatchPlaylistPanel` as active DOM fallback work/);
  assert.match(source, /stale cleanup, disabled cleanup, and product runtime source contain no watch playlist panel feature marker/);
  assert.match(source, /style selector policy/);
  assert.match(source, /panel surface report/);
  assert.match(source, /JSON\/DOM parity gate/);
  assert.match(source, /`watchPlaylistPanelDomCleanupBoundaryContract`, `watchPlaylistPanelDomCleanupDecisionReport`, `watchPlaylistPanelDomCleanupStyleSelectorPolicy`, `watchPlaylistPanelDomCleanupTargetShapeReport`, `watchPlaylistPanelDomCleanupRoutePolicy`, `watchPlaylistPanelDomCleanupPanelSurfaceReport`, `watchPlaylistPanelDomCleanupRestoreProof`, `watchPlaylistPanelDomCleanupStaleCleanupBudget`, `watchPlaylistPanelDomCleanupDisabledRestoreProof`, `watchPlaylistPanelDomCleanupMetricArtifact`, or `watchPlaylistPanelDomCleanupJsonParityGate`/);
});

test('active goal completion audit records video sidebar DOM cleanup boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Video Sidebar DOM cleanup boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_VIDEO_SIDEBAR_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/video-sidebar-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct video sidebar DOM cleanup proof/);
  assert.match(source, /1 video-sidebar DOM cleanup boundary source file/);
  assert.match(source, /6 source\/effect blocks/);
  assert.match(source, /345 ensureContentControlStyles block lines/);
  assert.match(source, /12583 ensureContentControlStyles bytes/);
  assert.match(source, /7 video-sidebar CSS block lines/);
  assert.match(source, /172 video-sidebar CSS block bytes/);
  assert.match(source, /68 active DOM fallback work block lines/);
  assert.match(source, /2333 active DOM fallback work block bytes/);
  assert.match(source, /14 no-active cleanup branch lines/);
  assert.match(source, /629 no-active cleanup branch bytes/);
  assert.match(source, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(source, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(source, /21 disabled cleanup branch lines/);
  assert.match(source, /959 disabled cleanup branch bytes/);
  assert.match(source, /6 runtime video-sidebar DOM cleanup fixtures/);
  assert.match(source, /`hideVideoSidebar` writes `#secondary\.ytd-watch-flexy` into the shared style node/);
  assert.match(source, /style regeneration removes that selector when the setting turns off/);
  assert.match(source, /whitelist mode still emits the video sidebar CSS branch/);
  assert.match(source, /unsupported `:has\(\)` support does not suppress video sidebar selectors/);
  assert.match(source, /each active style-writer pass also calls Open App cleanup/);
  assert.match(source, /`hasActiveDOMFallbackWork\(\)` treats `hideVideoSidebar` as active DOM fallback work/);
  assert.match(source, /stale cleanup, disabled cleanup, and product runtime source contain no video sidebar feature marker/);
  assert.match(source, /style selector policy/);
  assert.match(source, /secondary-column report/);
  assert.match(source, /JSON\/DOM parity gate/);
  assert.match(source, /`videoSidebarDomCleanupBoundaryContract`, `videoSidebarDomCleanupDecisionReport`, `videoSidebarDomCleanupStyleSelectorPolicy`, `videoSidebarDomCleanupTargetShapeReport`, `videoSidebarDomCleanupRoutePolicy`, `videoSidebarDomCleanupSecondaryColumnReport`, `videoSidebarDomCleanupRestoreProof`, `videoSidebarDomCleanupStaleCleanupBudget`, `videoSidebarDomCleanupDisabledRestoreProof`, `videoSidebarDomCleanupMetricArtifact`, or `videoSidebarDomCleanupJsonParityGate`/);
});

test('active goal completion audit records live chat DOM cleanup boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Live Chat DOM cleanup boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_LIVE_CHAT_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/live-chat-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct live chat DOM cleanup proof/);
  assert.match(source, /1 live-chat DOM cleanup boundary source file/);
  assert.match(source, /6 source\/effect blocks/);
  assert.match(source, /345 ensureContentControlStyles block lines/);
  assert.match(source, /12583 ensureContentControlStyles bytes/);
  assert.match(source, /8 live-chat CSS block lines/);
  assert.match(source, /195 live-chat CSS block bytes/);
  assert.match(source, /68 active DOM fallback work block lines/);
  assert.match(source, /2333 active DOM fallback work block bytes/);
  assert.match(source, /14 no-active cleanup branch lines/);
  assert.match(source, /629 no-active cleanup branch bytes/);
  assert.match(source, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(source, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(source, /21 disabled cleanup branch lines/);
  assert.match(source, /959 disabled cleanup branch bytes/);
  assert.match(source, /6 runtime live-chat DOM cleanup fixtures/);
  assert.match(source, /`hideLiveChat` writes `ytd-live-chat-frame#chat` and `#chat-container` selectors into the shared style node/);
  assert.match(source, /style regeneration removes those selectors when the setting turns off/);
  assert.match(source, /whitelist mode still emits the live chat CSS branch/);
  assert.match(source, /unsupported `:has\(\)` support does not suppress live chat selectors/);
  assert.match(source, /each active style-writer pass also calls Open App cleanup/);
  assert.match(source, /`hasActiveDOMFallbackWork\(\)` treats `hideLiveChat` as active DOM fallback work/);
  assert.match(source, /stale cleanup, disabled cleanup, and product runtime source contain no live chat feature marker/);
  assert.match(source, /style selector policy/);
  assert.match(source, /chat surface report/);
  assert.match(source, /JSON\/DOM parity gate/);
  assert.match(source, /`liveChatDomCleanupBoundaryContract`, `liveChatDomCleanupDecisionReport`, `liveChatDomCleanupStyleSelectorPolicy`, `liveChatDomCleanupTargetShapeReport`, `liveChatDomCleanupRoutePolicy`, `liveChatDomCleanupChatSurfaceReport`, `liveChatDomCleanupRestoreProof`, `liveChatDomCleanupStaleCleanupBudget`, `liveChatDomCleanupDisabledRestoreProof`, `liveChatDomCleanupMetricArtifact`, or `liveChatDomCleanupJsonParityGate`/);
});

test('active goal completion audit records video info DOM cleanup boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Video Info DOM cleanup boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_VIDEO_INFO_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/video-info-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct video-info DOM cleanup proof/);
  assert.match(source, /1 video-info DOM cleanup boundary source file/);
  assert.match(source, /11 source\/effect blocks/);
  assert.match(source, /345 ensureContentControlStyles block lines/);
  assert.match(source, /12583 ensureContentControlStyles bytes/);
  assert.match(source, /49 video-info mode group block lines/);
  assert.match(source, /1516 video-info mode group block bytes/);
  assert.match(source, /8 video-buttons-bar CSS block lines/);
  assert.match(source, /263 video-buttons-bar CSS block bytes/);
  assert.match(source, /8 ask-button CSS block lines/);
  assert.match(source, /218 ask-button CSS block bytes/);
  assert.match(source, /8 video-channel-row CSS block lines/);
  assert.match(source, /280 video-channel-row CSS block bytes/);
  assert.match(source, /8 video-description CSS block lines/);
  assert.match(source, /291 video-description CSS block bytes/);
  assert.match(source, /10 merch-tickets-offers CSS block lines/);
  assert.match(source, /274 merch-tickets-offers CSS block bytes/);
  assert.match(source, /68 active DOM fallback work block lines/);
  assert.match(source, /2333 active DOM fallback work block bytes/);
  assert.match(source, /14 no-active cleanup branch lines/);
  assert.match(source, /629 no-active cleanup branch bytes/);
  assert.match(source, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(source, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(source, /21 disabled cleanup branch lines/);
  assert.match(source, /959 disabled cleanup branch bytes/);
  assert.match(source, /6 runtime video-info DOM cleanup fixtures/);
  assert.match(source, /`hideVideoInfo` is a master mode flag that emits all five child selector branches only in blocklist mode/);
  assert.match(source, /`hideVideoInfo` in whitelist mode emits no video-info child selectors/);
  assert.match(source, /explicit whitelist-mode child flags still emit Ask and Merch\/Tickets\/Offers selectors while Buttons Bar, Channel Row, and Description remain suppressed by direct whitelist guards/);
  assert.match(source, /style regeneration removes video-info selectors when mode or settings change/);
  assert.match(source, /each active style-writer pass also calls Open App cleanup/);
  assert.match(source, /`hasActiveDOMFallbackWork\(\)` treats all six video-info flags as active DOM fallback work/);
  assert.match(source, /stale cleanup, disabled cleanup, and product runtime source contain no video-info feature marker/);
  assert.match(source, /master-mode policy/);
  assert.match(source, /whitelist policy/);
  assert.match(source, /JSON\/DOM parity gate/);
  assert.match(source, /`videoInfoDomCleanupBoundaryContract`, `videoInfoDomCleanupDecisionReport`, `videoInfoDomCleanupMasterModePolicy`, `videoInfoDomCleanupStyleSelectorPolicy`, `videoInfoDomCleanupTargetShapeReport`, `videoInfoDomCleanupWhitelistPolicy`, `videoInfoDomCleanupRestoreProof`, `videoInfoDomCleanupStaleCleanupBudget`, `videoInfoDomCleanupDisabledRestoreProof`, `videoInfoDomCleanupMetricArtifact`, or `videoInfoDomCleanupJsonParityGate`/);
});

test('active goal completion audit records player/end-screen DOM cleanup boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Player\/End-screen DOM cleanup boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_PLAYER_ENDSCREEN_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/player-endscreen-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct player\/end-screen DOM cleanup proof/);
  assert.match(source, /1 player\/end-screen DOM cleanup boundary source file/);
  assert.match(source, /9 source\/effect blocks/);
  assert.match(source, /345 ensureContentControlStyles block lines/);
  assert.match(source, /12583 ensureContentControlStyles bytes/);
  assert.match(source, /34 player\/end-screen CSS group block lines/);
  assert.match(source, /856 player\/end-screen CSS group block bytes/);
  assert.match(source, /8 endscreen videowall CSS block lines/);
  assert.match(source, /253 endscreen videowall CSS block bytes/);
  assert.match(source, /7 endscreen cards CSS block lines/);
  assert.match(source, /177 endscreen cards CSS block bytes/);
  assert.match(source, /8 disable autoplay CSS block lines/);
  assert.match(source, /235 disable autoplay CSS block bytes/);
  assert.match(source, /8 disable annotations CSS block lines/);
  assert.match(source, /185 disable annotations CSS block bytes/);
  assert.match(source, /68 active DOM fallback work block lines/);
  assert.match(source, /2333 active DOM fallback work block bytes/);
  assert.match(source, /14 no-active cleanup branch lines/);
  assert.match(source, /629 no-active cleanup branch bytes/);
  assert.match(source, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(source, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(source, /21 disabled cleanup branch lines/);
  assert.match(source, /959 disabled cleanup branch bytes/);
  assert.match(source, /6 runtime player\/end-screen DOM cleanup fixtures/);
  assert.match(source, /all four player\/end-screen controls emit seven selector rows when the style writer runs/);
  assert.match(source, /direct style-writer execution can emit `disableAutoplay` and `disableAnnotations` selectors, but `hasActiveDOMFallbackWork\(\)` returns false for those flags alone in blocklist mode/);
  assert.match(source, /`hideEndscreenVideowall` and `hideEndscreenCards` are active DOM fallback keys/);
  assert.match(source, /style regeneration removes player\/end-screen selector rows when the settings are absent/);
  assert.match(source, /each active style-writer pass also calls Open App cleanup/);
  assert.match(source, /stale cleanup, disabled cleanup, and product runtime source contain no player\/end-screen feature marker/);
  assert.match(source, /active-work policy/);
  assert.match(source, /autoplay policy/);
  assert.match(source, /annotation policy/);
  assert.match(source, /JSON\/DOM parity gate/);
  assert.match(source, /`playerEndscreenDomCleanupBoundaryContract`, `playerEndscreenDomCleanupDecisionReport`, `playerEndscreenDomCleanupStyleSelectorPolicy`, `playerEndscreenDomCleanupTargetShapeReport`, `playerEndscreenDomCleanupActiveWorkPolicy`, `playerEndscreenDomCleanupAutoplayPolicy`, `playerEndscreenDomCleanupAnnotationPolicy`, `playerEndscreenDomCleanupRestoreProof`, `playerEndscreenDomCleanupStaleCleanupBudget`, `playerEndscreenDomCleanupDisabledRestoreProof`, `playerEndscreenDomCleanupMetricArtifact`, or `playerEndscreenDomCleanupJsonParityGate`/);
});

test('active goal completion audit records navigation/header/search DOM cleanup boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Navigation\/Header\/Search DOM cleanup boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_NAVIGATION_HEADER_SEARCH_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/navigation-header-search-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct navigation\/header\/search DOM cleanup proof/);
  assert.match(source, /1 navigation\/header\/search DOM cleanup boundary source file/);
  assert.match(source, /11 source\/effect blocks/);
  assert.match(source, /345 ensureContentControlStyles block lines/);
  assert.match(source, /12583 ensureContentControlStyles bytes/);
  assert.match(source, /53 navigation\/header\/search CSS group block lines/);
  assert.match(source, /1673 navigation\/header\/search CSS group block bytes/);
  assert.match(source, /7 top header CSS block lines/);
  assert.match(source, /162 top header CSS block bytes/);
  assert.match(source, /8 notification bell CSS block lines/);
  assert.match(source, /248 notification bell CSS block bytes/);
  assert.match(source, /9 explore trending CSS block lines/);
  assert.match(source, /297 explore trending CSS block bytes/);
  assert.match(source, /7 more from YouTube CSS block lines/);
  assert.match(source, /205 more from YouTube CSS block bytes/);
  assert.match(source, /9 subscriptions CSS block lines/);
  assert.match(source, /437 subscriptions CSS block bytes/);
  assert.match(source, /8 search shelves CSS block lines/);
  assert.match(source, /314 search shelves CSS block bytes/);
  assert.match(source, /68 active DOM fallback work block lines/);
  assert.match(source, /2333 active DOM fallback work block bytes/);
  assert.match(source, /14 no-active cleanup branch lines/);
  assert.match(source, /629 no-active cleanup branch bytes/);
  assert.match(source, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(source, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(source, /21 disabled cleanup branch lines/);
  assert.match(source, /959 disabled cleanup branch bytes/);
  assert.match(source, /6 runtime navigation\/header\/search DOM cleanup fixtures/);
  assert.match(source, /all six controls emit 12 selector rows when the style writer runs with `:has\(\)` support/);
  assert.match(source, /disabling `:has\(\)` support removes only the dynamic subscriptions guide-section selector while preserving fixed subscription selectors/);
  assert.match(source, /all six flags are active DOM fallback keys/);
  assert.match(source, /style regeneration removes navigation\/header\/search selector rows when the settings are absent/);
  assert.match(source, /each active style-writer pass also calls Open App cleanup/);
  assert.match(source, /stale cleanup, disabled cleanup, and product runtime source contain no navigation\/header\/search feature marker/);
  assert.match(source, /navigation surface report/);
  assert.match(source, /`:has\(\)` support policy/);
  assert.match(source, /positional guide-section policy/);
  assert.match(source, /JSON\/DOM parity gate/);
  assert.match(source, /`navigationHeaderSearchDomCleanupBoundaryContract`, `navigationHeaderSearchDomCleanupDecisionReport`, `navigationHeaderSearchDomCleanupStyleSelectorPolicy`, `navigationHeaderSearchDomCleanupTargetShapeReport`, `navigationHeaderSearchDomCleanupRoutePolicy`, `navigationHeaderSearchDomCleanupSurfaceReport`, `navigationHeaderSearchDomCleanupHasSelectorPolicy`, `navigationHeaderSearchDomCleanupGuidePositionPolicy`, `navigationHeaderSearchDomCleanupRestoreProof`, `navigationHeaderSearchDomCleanupStaleCleanupBudget`, `navigationHeaderSearchDomCleanupDisabledRestoreProof`, `navigationHeaderSearchDomCleanupMetricArtifact`, or `navigationHeaderSearchDomCleanupJsonParityGate`/);
});

test('active goal completion audit records recommended DOM cleanup boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Recommended DOM cleanup boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_RECOMMENDED_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/recommended-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct recommended DOM cleanup proof/);
  assert.match(source, /1 recommended DOM cleanup boundary source file/);
  assert.match(source, /6 source\/effect blocks/);
  assert.match(source, /345 ensureContentControlStyles block lines/);
  assert.match(source, /12583 ensureContentControlStyles bytes/);
  assert.match(source, /8 recommended CSS block lines/);
  assert.match(source, /215 recommended CSS block bytes/);
  assert.match(source, /68 active DOM fallback work block lines/);
  assert.match(source, /2333 active DOM fallback work block bytes/);
  assert.match(source, /14 no-active cleanup branch lines/);
  assert.match(source, /629 no-active cleanup branch bytes/);
  assert.match(source, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(source, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(source, /21 disabled cleanup branch lines/);
  assert.match(source, /959 disabled cleanup branch bytes/);
  assert.match(source, /6 runtime recommended DOM cleanup fixtures/);
  assert.match(source, /`hideRecommended` writes `#related` and `#items\.ytd-watch-next-secondary-results-renderer` selectors into the shared style node/);
  assert.match(source, /style regeneration removes those selectors when the setting turns off/);
  assert.match(source, /whitelist mode still emits the recommended CSS branch/);
  assert.match(source, /unsupported `:has\(\)` support does not suppress recommended selectors/);
  assert.match(source, /each active style-writer pass also calls Open App cleanup/);
  assert.match(source, /`hasActiveDOMFallbackWork\(\)` treats `hideRecommended` as active DOM fallback work/);
  assert.match(source, /stale cleanup, disabled cleanup, and product runtime source contain no recommended feature marker/);
  assert.match(source, /style selector policy/);
  assert.match(source, /watch rail report/);
  assert.match(source, /JSON\/DOM parity gate/);
  assert.match(source, /`recommendedDomCleanupBoundaryContract`, `recommendedDomCleanupDecisionReport`, `recommendedDomCleanupStyleSelectorPolicy`, `recommendedDomCleanupTargetShapeReport`, `recommendedDomCleanupRoutePolicy`, `recommendedDomCleanupWatchRailReport`, `recommendedDomCleanupRestoreProof`, `recommendedDomCleanupStaleCleanupBudget`, `recommendedDomCleanupDisabledRestoreProof`, `recommendedDomCleanupMetricArtifact`, or `recommendedDomCleanupJsonParityGate`/);
});

test('active goal completion audit records content control alias mutation boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content control alias mutation boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_CONTROL_ALIAS_MUTATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/content-control-alias-mutation-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /executed save\/load mutation proof/);
  assert.match(source, /7 content control alias mutation boundary source files/);
  assert.match(source, /13 source\/effect blocks/);
  assert.match(source, /79 settings_shared buildCompiledSettings block lines/);
  assert.match(source, /37 V4 save root payload block lines/);
  assert.match(source, /36 V4 profile settings block lines/);
  assert.match(source, /183 legacy save payload block lines/);
  assert.match(source, /40 load alias block lines/);
  assert.match(source, /37 StateManager saveSettings payload block lines/);
  assert.match(source, /452 background main compile alias block lines/);
  assert.match(source, /10 seed active JSON rules block lines/);
  assert.match(source, /12 filter_logic processed defaults block lines/);
  assert.match(source, /28 DOM fallback active boolean key block lines/);
  assert.match(source, /`saveSettings\({ hideShorts: true, hideComments: true }\)` returns compiled runtime `hideAllShorts` and `hideAllComments`/);
  assert.match(source, /writes root `hideAllShorts` and `hideAllComments`/);
  assert.match(source, /writes V4 profile `hideShorts` and `hideComments`/);
  assert.match(source, /does not write root `hideShorts` or `hideComments`/);
  assert.match(source, /legacy `loadSettings\(\)` maps root `hideAllShorts` and `hideAllComments` back to UI-facing aliases/);
  assert.match(source, /V4\/root precedence report/);
  assert.match(source, /background invalidation parity report/);
  assert.match(source, /JSON setting-field manifest/);
  assert.match(source, /DOM alias parity report/);
  assert.match(source, /per-alias no-work budgets/);
  assert.match(source, /`contentControlAliasMutationContract`, `contentControlStorageAliasPolicy`, `contentControlAliasReadWriteReport`, `contentControlStateManagerAliasMutationReport`, `contentControlBackgroundInvalidationParityReport`, `contentControlJsonSettingFieldManifest`, `contentControlDomAliasParityReport`, `contentControlAliasNoWorkBudget`, `contentControlAliasFixtureProvenance`, or `contentControlAliasFirstClassJsonGate`/);
});

test('active goal completion audit records content bridge prefetch identity lifecycle boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content bridge prefetch identity lifecycle boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_PREFETCH_IDENTITY_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/content-bridge-prefetch-identity-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct content bridge prefetch identity lifecycle proof/);
  assert.match(source, /1 content bridge prefetch identity lifecycle boundary source file/);
  assert.match(source, /11 source\/effect blocks/);
  assert.match(source, /363 prefetch lifecycle cluster block lines/);
  assert.match(source, /12782 prefetch lifecycle cluster block bytes/);
  assert.match(source, /20 startCardPrefetchObserver block lines/);
  assert.match(source, /621 startCardPrefetchObserver block bytes/);
  assert.match(source, /73 installRightRailWhitelistObserver block lines/);
  assert.match(source, /2409 installRightRailWhitelistObserver block bytes/);
  assert.match(source, /91 prefetchIdentityForCard block lines/);
  assert.match(source, /4064 prefetchIdentityForCard block bytes/);
  assert.match(source, /152 stamp\/reset identity block lines/);
  assert.match(source, /6313 stamp\/reset identity block bytes/);
  assert.match(source, /5 prefetch lifecycle cluster document\.addEventListener callsites/);
  assert.match(source, /2 prefetch lifecycle cluster MutationObserver callsites/);
  assert.match(source, /1 prefetch lifecycle cluster IntersectionObserver callsite/);
  assert.match(source, /6 runtime content bridge prefetch lifecycle fixtures/);
  assert.match(source, /one `IntersectionObserver`, one `visibilitychange` listener/);
  assert.match(source, /cap one pass at 120 cards/);
  assert.match(source, /right-rail refresh work is whitelist-aware and route-aware/);
  assert.match(source, /dedupes by video id for 30 seconds/);
  assert.match(source, /drains with concurrency 2 only while visible/);
  assert.match(source, /performs no direct `fetch\(\)` in `prefetchIdentityForCard\(\)`/);
  assert.match(source, /can stamp DOM identity, persist learned map entries, and schedule DOM fallback after a successful stamp/);
  assert.match(source, /active-work decision/);
  assert.match(source, /snapshot-effect report/);
  assert.match(source, /DOM-stamp report/);
  assert.match(source, /map-write report/);
  assert.match(source, /route pause policy/);
  assert.match(source, /`contentBridgePrefetchIdentityLifecycleContract`, `contentBridgePrefetchActiveWorkDecision`, `contentBridgePrefetchObserverBudget`, `contentBridgePrefetchQueueBudget`, `contentBridgePrefetchSnapshotEffectReport`, `contentBridgePrefetchDomStampReport`, `contentBridgePrefetchMapWriteReport`, `contentBridgePrefetchWhitelistPendingPolicy`, `contentBridgePrefetchRoutePausePolicy`, `contentBridgePrefetchFixtureProvenance`, or `contentBridgePrefetchMetricArtifact`/);
});

test('active goal completion audit records subscription import request lifecycle boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Subscription import request lifecycle boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SUBSCRIPTION_IMPORT_REQUEST_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/subscription-import-request-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct subscription import request lifecycle proof/);
  assert.match(source, /9 subscription import request lifecycle source files/);
  assert.match(source, /5 JS source files/);
  assert.match(source, /4 manifest files/);
  assert.match(source, /13 source\/effect blocks/);
  assert.match(source, /40 bridge_settings guarded requester block lines/);
  assert.match(source, /1938 bridge_settings guarded requester block bytes/);
  assert.match(source, /50 bridge_settings subscription listener block lines/);
  assert.match(source, /2295 bridge_settings subscription listener block bytes/);
  assert.match(source, /52 bridge_settings runtime import action block lines/);
  assert.match(source, /2614 bridge_settings runtime import action block bytes/);
  assert.match(source, /38 content_bridge requester block lines/);
  assert.match(source, /1648 content_bridge requester block bytes/);
  assert.match(source, /27 content_bridge subscription progress\/response block lines/);
  assert.match(source, /1412 content_bridge subscription progress\/response block bytes/);
  assert.match(source, /71 injector subscription bridge install block lines/);
  assert.match(source, /2766 injector subscription bridge install block bytes/);
  assert.match(source, /450 injector fetchSubscribedChannelsFromYoutubei block lines/);
  assert.match(source, /19755 injector fetchSubscribedChannelsFromYoutubei block bytes/);
  assert.match(source, /109 StateManager importSubscribedChannelsToWhitelist block lines/);
  assert.match(source, /4527 StateManager importSubscribedChannelsToWhitelist block bytes/);
  assert.match(source, /201 tab-view startSubscribedChannelsImport block lines/);
  assert.match(source, /8431 tab-view startSubscribedChannelsImport block bytes/);
  assert.match(source, /8 runtime subscription import lifecycle fixtures/);
  assert.match(source, /all four manifests load `js\/content\/bridge_settings\.js` before `js\/content_bridge\.js`/);
  assert.match(source, /bridge_settings defines a guarded requester while content_bridge later assigns the effective requester unconditionally/);
  assert.match(source, /effective timeout clamp drifts from 120000 ms to 150000 ms/);
  assert.match(source, /bridge_settings requires `source: 'injector'` while content_bridge accepts same-window `FilterTube_\*` messages unless `source: 'content_bridge'`/);
  assert.match(source, /performs one credentialed YouTubei POST path with abort timers and continuation delays/);
  assert.match(source, /StateManager and tab-view add lock, profile, tab, request id, and source tab gates/);
  assert.match(source, /page-message capability token/);
  assert.match(source, /YouTubei fetch budget/);
  assert.match(source, /manifest load-order report/);
  assert.match(source, /UI progress policy/);
  assert.match(source, /`subscriptionImportRequestLifecycleContract`, `subscriptionImportRequesterOverrideReport`, `subscriptionImportCapabilityToken`, `subscriptionImportPageMessageTrustReport`, `subscriptionImportProgressResponsePolicy`, `subscriptionImportTimeoutBudget`, `subscriptionImportYoutubeiFetchBudget`, `subscriptionImportManifestLoadOrderReport`, `subscriptionImportProfileMutationReport`, `subscriptionImportUiProgressPolicy`, `subscriptionImportFixtureProvenance`, or `subscriptionImportMetricArtifact`/);
});

test('active goal completion audit records batch whitelist import persistence boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Batch whitelist import persistence boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_BATCH_WHITELIST_IMPORT_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/batch-whitelist-import-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct batch whitelist import persistence proof/);
  assert.match(source, /2 batch whitelist import persistence source files/);
  assert.match(source, /6 source\/effect blocks/);
  assert.match(source, /57 background normalizeImportedWhitelistChannelEntry block lines/);
  assert.match(source, /2426 background normalizeImportedWhitelistChannelEntry block bytes/);
  assert.match(source, /29 background importedWhitelistEntriesMatch block lines/);
  assert.match(source, /1228 background importedWhitelistEntriesMatch block bytes/);
  assert.match(source, /33 background mergeImportedWhitelistChannelEntry block lines/);
  assert.match(source, /2544 background mergeImportedWhitelistChannelEntry block bytes/);
  assert.match(source, /44 background mergeImportedWhitelistChannels block lines/);
  assert.match(source, /1463 background mergeImportedWhitelistChannels block bytes/);
  assert.match(source, /170 background FilterTube_BatchImportWhitelistChannels action block lines/);
  assert.match(source, /7012 background FilterTube_BatchImportWhitelistChannels action block bytes/);
  assert.match(source, /109 StateManager importSubscribedChannelsToWhitelist block lines/);
  assert.match(source, /4527 StateManager importSubscribedChannelsToWhitelist block bytes/);
  assert.match(source, /1 selected isTrustedUiSender token/);
  assert.match(source, /1 selected isProfileSessionAuthorized token/);
  assert.match(source, /19 selected targetProfileId tokens/);
  assert.match(source, /2 selected mergeImportedWhitelistChannels tokens/);
  assert.match(source, /1 selected storage\.local\.set token/);
  assert.match(source, /2 selected compiledSettingsCache tokens/);
  assert.match(source, /1 selected scheduleAutoBackupInBackground token/);
  assert.match(source, /1 selected tabs\.query token/);
  assert.match(source, /1 selected sendMessageToTabQuietly token/);
  assert.match(source, /4 selected channelMap tokens/);
  assert.match(source, /3 selected ftProfilesV3 tokens/);
  assert.match(source, /3 selected FT_PROFILES_V4_KEY tokens/);
  assert.match(source, /7 runtime batch whitelist import persistence fixtures/);
  assert.match(source, /StateManager checks lock and profile stability/);
  assert.match(source, /background action requires trusted UI sender, active target profile equality, and session authorization/);
  assert.match(source, /merge helpers accept id\/handle\/custom URL identity/);
  assert.match(source, /preserve stronger existing names/);
  assert.match(source, /preserve existing `filterAllComments`/);
  assert.match(source, /OR `filterAll`/);
  assert.match(source, /writes V4 and V3 profile mirrors/);
  assert.match(source, /optionally writes `channelMap`/);
  assert.match(source, /returns `currentMode` without switching blocklist to whitelist/);
  assert.match(source, /rollback policy/);
  assert.match(source, /profile-lock report/);
  assert.match(source, /channel-map policy/);
  assert.match(source, /backup\/refresh budget/);
  assert.match(source, /`batchWhitelistImportPersistenceContract`, `batchWhitelistImportMutationReport`, `batchWhitelistImportRollbackPolicy`, `batchWhitelistImportProfileLockReport`, `batchWhitelistImportModeEffectReport`, `batchWhitelistImportChannelMapPolicy`, `batchWhitelistImportV3MirrorPolicy`, `batchWhitelistImportCacheInvalidationReport`, `batchWhitelistImportBackupRefreshBudget`, `batchWhitelistImportFixtureProvenance`, or `batchWhitelistImportMetricArtifact`/);
});

test('active goal completion audit records list-mode transition persistence boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /List-mode transition persistence boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_LIST_MODE_TRANSITION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/list-mode-transition-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct list-mode transition persistence proof/);
  assert.match(source, /4 list-mode transition persistence source files/);
  assert.match(source, /8 source\/effect blocks/);
  assert.match(source, /209 background FilterTube_SetListMode action block lines/);
  assert.match(source, /9626 background FilterTube_SetListMode action block bytes/);
  assert.match(source, /38 background SetListMode merge helper block lines/);
  assert.match(source, /2126 background SetListMode merge helper block bytes/);
  assert.match(source, /31 background SetListMode write\/side-effect block lines/);
  assert.match(source, /1151 background SetListMode write\/side-effect block bytes/);
  assert.match(source, /192 background FilterTube_TransferWhitelistToBlocklist action block lines/);
  assert.match(source, /9102 background FilterTube_TransferWhitelistToBlocklist action block bytes/);
  assert.match(source, /173 popup renderListModeControls block lines/);
  assert.match(source, /7911 popup renderListModeControls block bytes/);
  assert.match(source, /174 tab-view renderListModeControls block lines/);
  assert.match(source, /9296 tab-view renderListModeControls block bytes/);
  assert.match(source, /47 tab-view enableWhitelistModeAfterImport block lines/);
  assert.match(source, /1554 tab-view enableWhitelistModeAfterImport block bytes/);
  assert.match(source, /111 StateManager importSubscribedChannelsToWhitelist block lines/);
  assert.match(source, /4533 StateManager importSubscribedChannelsToWhitelist block bytes/);
  assert.match(source, /1 selected background shouldCopyBlocklist token/);
  assert.match(source, /0 selected background isProfileSessionAuthorized tokens/);
  assert.match(source, /8 runtime list-mode transition persistence fixtures/);
  assert.match(source, /subscription import mode enablement sends `copyBlocklist:false`/);
  assert.match(source, /background declares `shouldCopyBlocklist` but always calls `mergeAndClearBlocklistIntoWhitelist\(\)`/);
  assert.match(source, /Main whitelist transition clears root legacy blocklist mirrors/);
  assert.match(source, /blocklist mode does not transfer whitelist rows back unless the separate transfer action runs/);
  assert.match(source, /transfer moves whitelist rows into blocklist rows and clears whitelist arrays/);
  assert.match(source, /tab-view managed child editing uses `saveManagedChildSurface\(\)`/);
  assert.match(source, /StateManager batch import persistence returns `currentMode` without toggling mode/);
  assert.match(source, /copy-flag policy/);
  assert.match(source, /managed-child parity report/);
  assert.match(source, /`listModeTransitionPersistenceContract`, `listModeTransitionMutationReport`, `listModeTransitionCopyFlagPolicy`, `listModeTransitionRollbackPolicy`, `listModeTransitionProfileLockReport`, `listModeTransitionModeEffectReport`, `listModeTransitionLegacyMirrorPolicy`, `listModeTransitionCacheInvalidationReport`, `listModeTransitionBackupRefreshBudget`, `listModeTransitionManagedChildParityReport`, `listModeTransitionFixtureProvenance`, or `listModeTransitionMetricArtifact`/);
});

test('active goal completion audit records single-channel rule mutation persistence boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Single-channel rule mutation persistence boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SINGLE_CHANNEL_RULE_MUTATION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/single-channel-rule-mutation-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct single-channel persistence proof/);
  assert.match(source, /3 single-channel rule mutation persistence source files/);
  assert.match(source, /9 source\/effect blocks/);
  assert.match(source, /75 StateManager addChannel block lines/);
  assert.match(source, /3276 StateManager addChannel block bytes/);
  assert.match(source, /79 StateManager addKidsChannel block lines/);
  assert.match(source, /3400 StateManager addKidsChannel block bytes/);
  assert.match(source, /40 background addWhitelistChannelPersistent block lines/);
  assert.match(source, /1329 background addWhitelistChannelPersistent block bytes/);
  assert.match(source, /54 background FilterTube_KidsWhitelistChannel block lines/);
  assert.match(source, /2107 background FilterTube_KidsWhitelistChannel block bytes/);
  assert.match(source, /43 background FilterTube_KidsBlockChannel block lines/);
  assert.match(source, /1769 background FilterTube_KidsBlockChannel block bytes/);
  assert.match(source, /287 background addChannelPersistent action block lines/);
  assert.match(source, /13345 background addChannelPersistent action block bytes/);
  assert.match(source, /32 background secondary addFilteredChannel receiver block lines/);
  assert.match(source, /1186 background secondary addFilteredChannel receiver block bytes/);
  assert.match(source, /894 background handleAddFilteredChannel block lines/);
  assert.match(source, /45226 background handleAddFilteredChannel block bytes/);
  assert.match(source, /55 content_bridge addChannelDirectly block lines/);
  assert.match(source, /2662 content_bridge addChannelDirectly block bytes/);
  assert.match(source, /2 selected background isTrustedUiSender tokens/);
  assert.match(source, /0 selected background isProfileSessionAuthorized tokens/);
  assert.match(source, /5 selected background handleAddFilteredChannel tokens/);
  assert.match(source, /39 selected background channelMap tokens/);
  assert.match(source, /14 selected background targetListType tokens/);
  assert.match(source, /11 runtime single-channel rule mutation persistence fixtures/);
  assert.match(source, /StateManager chooses Main add action from `state\.mode`/);
  assert.match(source, /StateManager chooses Kids add action from Kids mode/);
  assert.match(source, /Main and Kids whitelist single adds are trusted-sender gated but not session-locked/);
  assert.match(source, /Kids block, legacy `addChannelPersistent`, and secondary `addFilteredChannel` paths lack matching trusted-sender\/session gates/);
  assert.match(source, /content quick-block `addFilteredChannel` defaults to blocklist list type/);
  assert.match(source, /legacy `addChannelPersistent` uses a separate inline persistence path/);
  assert.match(source, /mixes fetch\/identity repair, V4\/V3\/root storage writes, map writes, cache invalidation, and post-block enrichment/);
  assert.match(source, /can request a second backup after a successful background mutation/);
  assert.match(source, /sender policy/);
  assert.match(source, /post-enrichment policy/);
  assert.match(source, /`singleChannelRuleMutationPersistenceContract`, `singleChannelRuleMutationReport`, `singleChannelRuleMutationSenderPolicy`, `singleChannelRuleMutationProfileLockReport`, `singleChannelRuleMutationListTypePolicy`, `singleChannelRuleMutationStorageWriteReport`, `singleChannelRuleMutationCacheInvalidationReport`, `singleChannelRuleMutationNetworkBudget`, `singleChannelRuleMutationBackupPolicy`, `singleChannelRuleMutationPostEnrichmentPolicy`, `singleChannelRuleMutationFixtureProvenance`, or `singleChannelRuleMutationMetricArtifact`/);
});

test('active goal completion audit records profile management persistence boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Profile management persistence boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_PROFILE_MANAGEMENT_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/profile-management-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct profile management persistence proof/);
  assert.match(source, /4 profile management persistence source files/);
  assert.match(source, /9 source\/effect blocks/);
  assert.match(source, /357 tab-view renderProfilesManager block lines/);
  assert.match(source, /17731 tab-view renderProfilesManager block bytes/);
  assert.match(source, /24 tab-view refreshProfilesUI block lines/);
  assert.match(source, /954 tab-view refreshProfilesUI block bytes/);
  assert.match(source, /44 tab-view switchToProfile block lines/);
  assert.match(source, /1595 tab-view switchToProfile block bytes/);
  assert.match(source, /48 popup switchToProfile block lines/);
  assert.match(source, /1659 popup switchToProfile block bytes/);
  assert.match(source, /120 tab-view create account handler block lines/);
  assert.match(source, /5004 tab-view create account handler block bytes/);
  assert.match(source, /107 tab-view create child handler block lines/);
  assert.match(source, /4589 tab-view create child handler block bytes/);
  assert.match(source, /53 tab-view saveManagedChildSurface block lines/);
  assert.match(source, /2341 tab-view saveManagedChildSurface block bytes/);
  assert.match(source, /67 io_manager load\/save profiles block lines/);
  assert.match(source, /2563 io_manager load\/save profiles block bytes/);
  assert.match(source, /42 background profile storage invalidation block lines/);
  assert.match(source, /1464 background profile storage invalidation block bytes/);
  assert.match(source, /15 selected tab-view ensureProfileUnlocked tokens/);
  assert.match(source, /28 selected tab-view saveProfilesV4 tokens/);
  assert.match(source, /52 selected tab-view loadProfilesV4 tokens/);
  assert.match(source, /66 selected tab-view activeProfileId tokens/);
  assert.match(source, /38 selected background compiledSettingsCache tokens/);
  assert.match(source, /7 selected background getCompiledSettings tokens/);
  assert.match(source, /11 runtime profile management persistence fixtures/);
  assert.match(source, /tab-view and popup profile switches write `activeProfileId` only after local unlock/);
  assert.match(source, /profile delete resolves active profile back to Default without backup or revision report/);
  assert.match(source, /account creation copies backup policy and keeps the current profile active/);
  assert.match(source, /child creation requires a parent account and defaults Main denied\/Kids allowed/);
  assert.match(source, /managed child save writes the target surface locally without broadcast or compiled revision report/);
  assert.match(source, /IO profile load can write sanitized or migrated V4 during read-path loading/);
  assert.match(source, /invalid profile save writes an empty object instead of a structured error report/);
  assert.match(source, /background profile storage changes invalidate both compiled caches without a revision report/);
  assert.match(source, /switch revision report/);
  assert.match(source, /managed-child report/);
  assert.match(source, /`profileManagementPersistenceContract`, `profileManagementMutationReport`, `profileManagementSwitchRevisionReport`, `profileManagementLockPolicy`, `profileManagementCreateDeleteReport`, `profileManagementBackupPolicy`, `profileManagementCacheInvalidationReport`, `profileManagementManagedChildReport`, `profileManagementFixtureProvenance`, or `profileManagementMetricArtifact`/);
});

test('active goal completion audit records YouTube Music surface identity boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /YouTube Music surface identity boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_YOUTUBE_MUSIC_SURFACE_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/youtube-music-surface-identity-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct YTM surface identity proof/);
  assert.match(source, /6 YTM surface source files/);
  assert.match(source, /`js\/background\.js`/);
  assert.match(source, /`js\/content\/bridge_settings\.js`/);
  assert.match(source, /`js\/content\/dom_extractors\.js`/);
  assert.match(source, /`js\/filter_logic\.js`/);
  assert.match(source, /`js\/content_bridge\.js`/);
  assert.match(source, /`js\/content\/dom_fallback\.js`/);
  assert.match(source, /10 source\/effect blocks/);
  assert.match(source, /51 `VIDEO_CARD_SELECTORS` block lines/);
  assert.match(source, /1722 block bytes/);
  assert.match(source, /17 `videoWithContextRenderer` rule block lines/);
  assert.match(source, /1109 block bytes/);
  assert.match(source, /239 sheet-like collaborator extraction block lines/);
  assert.match(source, /12385 block bytes/);
  assert.match(source, /304 YTM style selector cluster block lines/);
  assert.match(source, /11188 block bytes/);
  assert.match(source, /14 `VIDEO_CARD_SELECTORS` `ytm-` tokens/);
  assert.match(source, /0 bridge profile classifier `music\.youtube\.com` tokens/);
  assert.match(source, /0 explicit manifest `music\.youtube\.com` patterns/);
  assert.match(source, /7 runtime YTM surface identity fixtures/);
  assert.match(source, /generic `\*\.youtube\.com` manifest scope and classified as Main/);
  assert.match(source, /compact playlist JSON remains partial/);
  assert.match(source, /show-sheet parity/);
  assert.match(source, /JSON\/DOM parity gates/);
  assert.match(source, /`youtubeMusicSurfaceIdentityContract`, `youtubeMusicSurfaceDecisionReport`, `youtubeMusicProfilePolicy`, `youtubeMusicRendererAuthority`, `youtubeMusicDomSelectorPolicy`, `youtubeMusicShowSheetParityReport`, `youtubeMusicCompactPlaylistDecision`, `youtubeMusicFixtureProvenance`, `youtubeMusicMetricArtifact`, or `youtubeMusicJsonDomParityGate`/);
});

test('active goal completion audit records backup Nanah trusted-state boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Backup Nanah trusted-state boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_BACKUP_NANAH_TRUSTED_STATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/backup-nanah-trusted-state-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct trusted-state recovery proof/);
  assert.match(source, /3 backup Nanah trusted-state source files/);
  assert.match(source, /`js\/io_manager\.js`/);
  assert.match(source, /`js\/tab-view\.js`/);
  assert.match(source, /`js\/nanah_sync_adapter\.js`/);
  assert.match(source, /8 source\/effect blocks/);
  assert.match(source, /16 `normalizeNanahBackupState\(\)` block lines/);
  assert.match(source, /492 block bytes/);
  assert.match(source, /485 `importV3\(\)` block lines/);
  assert.match(source, /30221 block bytes/);
  assert.match(source, /31 `exportV3Encrypted\(\)` block lines/);
  assert.match(source, /1415 block bytes/);
  assert.match(source, /152 `runImportV3FromFile\(\)` block lines/);
  assert.match(source, /6968 block bytes/);
  assert.match(source, /2 `includeTrustedNanahState` tokens/);
  assert.match(source, /0 `targetProfileId` tokens in `importV3Encrypted\(\)`/);
  assert.match(source, /5 runtime trusted-state boundary fixtures/);
  assert.match(source, /full encrypted export can include Nanah trusted links and device id only when trusted state is requested and export type is full/);
  assert.match(source, /full import leaves Nanah trust untouched unless `restoreTrustedNanahState` is true/);
  assert.match(source, /encrypted import helper does not forward `targetProfileId`/);
  assert.match(source, /same-device proof/);
  assert.match(source, /post-import revision/);
  assert.match(source, /`backupNanahTrustedStateBoundaryContract`, `backupNanahTrustedStateDecisionReport`, `backupNanahTrustedStateSameDeviceProof`, `backupNanahTrustedStateExportPolicy`, `backupNanahTrustedStateRestorePolicy`, `backupNanahTrustedStateProfileScopeReport`, `backupNanahTrustedStateTargetProfileReport`, `backupNanahTrustedStateStorageWriteReport`, `backupNanahTrustedStatePostImportRevision`, `backupNanahTrustedStateFixtureProvenance`, `backupNanahTrustedStateMetricArtifact`, or `nanahTrustedRecoveryAuthority`/);
});

test('active goal completion audit records manifest permission feature-map boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Manifest permission feature-map boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_MANIFEST_PERMISSION_FEATURE_MAP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/manifest-permission-feature-map-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct permission feature-map proof/);
  assert.match(source, /4 browser manifest files/);
  assert.match(source, /10 runtime permission consumer source files/);
  assert.match(source, /`build\.js`/);
  assert.match(source, /8 source\/effect blocks/);
  assert.match(source, /145 broad runtime permission API tokens/);
  assert.match(source, /56 runtime storage API tokens/);
  assert.match(source, /18 `storage\.local\.get` tokens/);
  assert.match(source, /28 `storage\.local\.set` tokens/);
  assert.match(source, /4 `storage\.onChanged` tokens/);
  assert.match(source, /61 runtime tabs API tokens/);
  assert.match(source, /17 `tabs\.query` tokens/);
  assert.match(source, /5 `tabs\.sendMessage` tokens/);
  assert.match(source, /10 `tabs\.create` tokens/);
  assert.match(source, /1 `tabs\.update` token/);
  assert.match(source, /9 `scripting\.executeScript` tokens/);
  assert.match(source, /17 runtime downloads API tokens/);
  assert.match(source, /8 `downloads\.download` tokens/);
  assert.match(source, /3 `downloads\.search` tokens/);
  assert.match(source, /3 `downloads\.erase` tokens/);
  assert.match(source, /4 manifest `activeTab` tokens/);
  assert.match(source, /0 product runtime `activeTab` tokens/);
  assert.match(source, /2 build `ensureCollabDialogScriptOrder` tokens/);
  assert.match(source, /0 build `validateManifestPermissions` tokens/);
  assert.match(source, /7 runtime manifest permission feature-map fixtures/);
  assert.match(source, /all manifests declare the same five permissions and three host patterns/);
  assert.match(source, /`youtube-nocookie\.com` is host-permitted but not content-script or web-resource matched/);
  assert.match(source, /`activeTab` is declared without a named runtime callsite/);
  assert.match(source, /build packaging repairs collaboration script order without validating permission, host, resource, or world drift/);
  assert.match(source, /trusted-sender matrices/);
  assert.match(source, /`manifestPermissionFeatureMapContract`, `manifestPermissionFeatureOwnerReport`, `manifestStoragePermissionOwnerReport`, `manifestTabsPermissionOwnerReport`, `manifestScriptingPermissionOwnerReport`, `manifestDownloadsPermissionOwnerReport`, `manifestActiveTabPermissionUseReport`, `manifestHostPermissionScopeReport`, `manifestPermissionTrustedSenderMatrix`, `manifestPermissionBuildValidationReport`, `manifestPermissionFixtureProvenance`, or `manifestPermissionMetricArtifact`/);
});

test('active goal completion audit records external navigation surface boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /External navigation surface boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_EXTERNAL_NAVIGATION_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/external-navigation-surface-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct open\/link surface proof/);
  assert.match(source, /15 external navigation source files/);
  assert.match(source, /10 source\/effect blocks/);
  assert.match(source, /5 runtime `tabs\.create` callsites/);
  assert.match(source, /7 runtime `window\.open` callsites/);
  assert.match(source, /1 runtime `location\.href` assignment/);
  assert.match(source, /8 runtime `runtime\.getURL` callsites/);
  assert.match(source, /2 `FilterTube_OpenWhatsNew` tokens/);
  assert.match(source, /2 `createBrowserTab\(\)` tokens/);
  assert.match(source, /5 `updateBrowserTab\(\)` tokens/);
  assert.match(source, /4 `queryBrowserTabs\(\)` tokens/);
  assert.match(source, /15 static\/component `target="_blank"` tokens/);
  assert.match(source, /4 static\/component `rel` tokens containing `noopener`/);
  assert.match(source, /14 static\/component `rel` tokens containing `noreferrer`/);
  assert.ok(source.includes('15 literal external `href="https://...` tokens'));
  assert.match(source, /2 `mailto:` href tokens/);
  assert.match(source, /33 HTTPS literal tokens/);
  assert.match(source, /7 runtime external-navigation surface fixtures/);
  assert.match(source, /background What.s New opens `request\?\.url \|\| WHATS_NEW_PAGE_URL`/);
  assert.match(source, /release banner has background message, `window\.open`, and `location\.href` paths/);
  assert.match(source, /extension target-blank anchors have uneven rel policy/);
  assert.match(source, /public URL literals are not classified by URL class/);
  assert.match(source, /`externalNavigationSurfaceBoundaryContract`, `externalNavigationDecisionReport`, `externalNavigationUrlClassReport`, `externalNavigationTrustedSenderReport`, `externalNavigationWhatsNewUrlPolicy`, `externalNavigationReleaseFallbackPolicy`, `externalNavigationExtensionHtmlLinkPolicy`, `externalNavigationWebsiteLinkPolicy`, `externalNavigationSubscriptionImportTabPolicy`, `externalNavigationPublicUrlDataReport`, `externalNavigationFixtureProvenance`, or `externalNavigationMetricArtifact`/);
});

test('active goal completion audit records tab-view lifecycle selector boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Tab-view lifecycle\/selector boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_TAB_VIEW_LIFECYCLE_SELECTOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/tab-view-lifecycle-selector-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct tab-view hot-file selector proof/);
  assert.match(source, /2 tab-view source files/);
  assert.match(source, /12 selected source\/effect blocks/);
  assert.match(source, /180 `js\/tab-view\.js` lifecycle primitives/);
  assert.match(source, /147 `addEventListener` callsites/);
  assert.match(source, /0 `removeEventListener` callsites/);
  assert.match(source, /0 `MutationObserver` tokens/);
  assert.match(source, /0 `IntersectionObserver` tokens/);
  assert.match(source, /1 `setInterval` callsite/);
  assert.match(source, /1 `clearInterval` callsite/);
  assert.match(source, /14 `setTimeout` callsites/);
  assert.match(source, /4 `clearTimeout` callsites/);
  assert.match(source, /11 `requestAnimationFrame` callsites/);
  assert.match(source, /2 `cancelAnimationFrame` callsites/);
  assert.match(source, /1 runtime `onMessage` listener/);
  assert.match(source, /5 `window\.addEventListener` callsites/);
  assert.match(source, /2 `document\.addEventListener` callsites/);
  assert.match(source, /3 `StateManager\.subscribe` callsites/);
  assert.match(source, /234 `document\.getElementById` tokens/);
  assert.match(source, /175 unique JS id literals/);
  assert.match(source, /100 static HTML ids/);
  assert.match(source, /85 JS id literals not present as static HTML ids/);
  assert.match(source, /10 static HTML ids not directly reached by JS id literals/);
  assert.match(source, /30 `querySelector` tokens/);
  assert.match(source, /27 `querySelectorAll` tokens/);
  assert.match(source, /6 runtime tab-view lifecycle\/selector fixtures/);
  assert.match(source, /responsive navigation uses a data-attribute idempotence guard/);
  assert.match(source, /dashboard stats owns the only tab-view interval/);
  assert.match(source, /subscription import progress uses one runtime message listener filtered by action, in-progress state, request id, and source tab id/);
  assert.match(source, /static HTML ids cannot prove the dynamic tab-view selector surface/);
  assert.match(source, /`tabViewLifecycleSelectorBoundaryContract`, `tabViewLifecycleDecisionReport`, `tabViewSelectorAuthorityReport`, `tabViewDynamicIdProvenanceReport`, `tabViewStaticIdParityReport`, `tabViewListenerOwnerReport`, `tabViewTimerBudgetReport`, `tabViewRuntimeMessageListenerPolicy`, `tabViewBootstrapSplitReport`, `tabViewSettingsSaveTimerReport`, `tabViewDashboardRotationMetricArtifact`, or `tabViewLifecycleFixtureProvenance`/);
});

test('active goal completion audit records popup lifecycle selector boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Popup lifecycle\/selector boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_POPUP_LIFECYCLE_SELECTOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/popup-lifecycle-selector-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct popup lifecycle\/selector proof/);
  assert.match(source, /2 popup source files/);
  assert.match(source, /11 selected source\/effect blocks/);
  assert.match(source, /33 `js\/popup\.js` lifecycle primitives/);
  assert.match(source, /30 `addEventListener` callsites/);
  assert.match(source, /0 `removeEventListener` callsites/);
  assert.match(source, /0 `MutationObserver` tokens/);
  assert.match(source, /0 `IntersectionObserver` tokens/);
  assert.match(source, /0 `setInterval` callsites/);
  assert.match(source, /0 `clearInterval` callsites/);
  assert.match(source, /2 `setTimeout` callsites/);
  assert.match(source, /0 `clearTimeout` callsites/);
  assert.match(source, /1 `requestAnimationFrame` callsite/);
  assert.match(source, /0 `cancelAnimationFrame` callsites/);
  assert.match(source, /3 `document\.addEventListener` callsites/);
  assert.match(source, /0 `window\.addEventListener` callsites/);
  assert.match(source, /2 `StateManager\.subscribe` callsites/);
  assert.match(source, /4 `sendRuntimeMessage` tokens/);
  assert.match(source, /1 `\.runtime\.sendMessage` callsite/);
  assert.match(source, /5 `window\.open` callsites/);
  assert.match(source, /52 `document\.getElementById` tokens/);
  assert.match(source, /23 unique JS id literals/);
  assert.match(source, /1 static HTML id/);
  assert.match(source, /23 JS id literals not present as static HTML ids/);
  assert.match(source, /1 static HTML id not directly reached by JS id literals/);
  assert.match(source, /4 `querySelector` tokens/);
  assert.match(source, /6 `querySelectorAll` tokens/);
  assert.match(source, /82 `document\.createElement` tokens/);
  assert.match(source, /5 `innerHTML` writes/);
  assert.match(source, /6 runtime popup lifecycle\/selector fixtures/);
  assert.match(source, /`html\/popup\.html` is a `#popupRoot` shell/);
  assert.match(source, /video filter controls bind after a fixed 100 ms delay/);
  assert.match(source, /list-mode controls send background mutations through a local runtime message helper/);
  assert.match(source, /static HTML cannot prove popup selector coverage/);
  assert.match(source, /`popupLifecycleSelectorBoundaryContract`, `popupLifecycleDecisionReport`, `popupSelectorAuthorityReport`, `popupDynamicIdProvenanceReport`, `popupGeneratedShellParityReport`, `popupListenerOwnerReport`, `popupDelayedBindingBudgetReport`, `popupRuntimeMessagePolicy`, `popupListModeMutationReport`, `popupProfileLockMutationReport`, `popupExternalOpenPolicy`, or `popupLifecycleFixtureProvenance`/);
});

test('active goal completion audit records extension UI CSS page-state boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Extension UI CSS page-state boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_EXTENSION_UI_CSS_PAGE_STATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/extension-ui-css-page-state-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /active UI page-state proof/);
  assert.match(source, /14 selected source files/);
  assert.match(source, /5 active extension UI CSS files/);
  assert.match(source, /2 extension HTML pages/);
  assert.match(source, /3 generated-shell source files/);
  assert.match(source, /2 generated-shell output files/);
  assert.match(source, /2 hand-owned UI runtime files/);
  assert.match(source, /9,329 counted active CSS lines/);
  assert.match(source, /240,541 active CSS bytes/);
  assert.match(source, /1,342 lexical rule blocks/);
  assert.match(source, /115 `!important` declarations/);
  assert.match(source, /25 `display:none` declarations/);
  assert.match(source, /36 `@media` blocks/);
  assert.match(source, /6 `@keyframes` blocks/);
  assert.match(source, /3 `\[hidden\]` selectors/);
  assert.match(source, /16 `:focus-visible` selectors/);
  assert.match(source, /134 `:hover` selectors/);
  assert.match(source, /255 dark-theme selector prefixes/);
  assert.match(source, /331 `data-theme` tokens/);
  assert.match(source, /54 `data-surface` tokens/);
  assert.match(source, /7 `data-scene` tokens/);
  assert.match(source, /47 `\.active` selectors/);
  assert.match(source, /56 `transition` declarations/);
  assert.match(source, /90 `transform` declarations/);
  assert.match(source, /5 runtime extension UI CSS page-state fixtures/);
  assert.match(source, /generated shell output loads before hand-owned popup\/dashboard runtime/);
  assert.match(source, /shell runtime sets `root\.dataset\.scene`, `root\.dataset\.theme`, `root\.dataset\.surface`, `body\.dataset\.surface`, `ft-extension-surface`, and popup width `392px`/);
  assert.match(source, /popup shell source\/output both carry 13 `ft-popup-shell` tokens/);
  assert.match(source, /tab-view decor source\/output both carry 11 `ft-tab-view-ambient` tokens/);
  assert.match(source, /static HTML cannot prove page-state coverage/);
  assert.match(source, /`extensionUiCssPageStateAuthority`, `extensionUiCssStateSelectorReport`, `extensionUiCssShellStateParityReport`, `extensionUiCssResponsiveFixtureReport`, `extensionUiCssAccessibilityFixtureReport`, `extensionUiCssMotionBudgetReport`, `extensionUiCssVisualRegressionReport`, `extensionUiCssGeneratedShellParityGate`, `extensionUiCssThemeScenePolicy`, `extensionUiCssRuntimeStateOwnerReport`, or `extensionUiCssFixtureProvenance`/);
});

test('active goal completion audit records legacy layout quarantine package boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Legacy layout quarantine\/package boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_LEGACY_LAYOUT_QUARANTINE_PACKAGE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/legacy-layout-quarantine-package-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /package\/load proof/);
  assert.match(source, /`js\/layout\.js` at 680 lines/);
  assert.match(source, /30,604 bytes/);
  assert.match(source, /48831ccdc2d62c75818d9c6a153d7bfacec9d7be9f2408485f74b1a7c13c57c7/);
  assert.match(source, /5 exported method declarations/);
  assert.match(source, /63 selector API sites/);
  assert.match(source, /52 unique static selector literals/);
  assert.match(source, /146 direct style property writes/);
  assert.match(source, /34 `style\.display` writes/);
  assert.match(source, /32 `filter-tube-visible` token occurrences/);
  assert.match(source, /0 listeners\/timers\/observers\/fetch calls/);
  assert.match(source, /4 active manifest files/);
  assert.match(source, /7 active content-script entries/);
  assert.match(source, /55 active content-script JS refs/);
  assert.match(source, /19 active web-accessible resource refs/);
  assert.match(source, /0 active `js\/layout\.js` load\/exposure refs/);
  assert.match(source, /3 dist manifest files/);
  assert.match(source, /5 dist content-script entries/);
  assert.match(source, /41 dist content-script JS refs/);
  assert.match(source, /14 dist web-accessible resource refs/);
  assert.match(source, /0 dist `js\/layout\.js` load\/exposure refs/);
  assert.match(source, /2 extension HTML files/);
  assert.match(source, /21 extension HTML script tags/);
  assert.match(source, /0 extension HTML `js\/layout\.js` script refs/);
  assert.match(source, /3 packaged dist copies/);
  assert.match(source, /3 renderer-inventory `js\/layout\.js` references/);
  assert.match(source, /`build\.js` copies the whole `js` directory/);
  assert.match(source, /active and dist manifests do not load or web-expose `js\/layout\.js`/);
  assert.match(source, /popup\/dashboard HTML do not load it/);
  assert.match(source, /no current non-doc runtime caller reaches `window\.filterTubeLayout` outside `js\/layout\.js` itself/);
  assert.match(source, /renderer inventory layout-fix rows are not active filtering coverage proof/);
  assert.match(source, /package cleanup proof/);
  assert.match(source, /activation\/deletion gates/);
  assert.match(source, /native\/runtime parity/);
  assert.match(source, /`legacyLayoutQuarantineBoundaryContract`, `legacyLayoutPackageInclusionReport`, `legacyLayoutActiveLoadReport`, `legacyLayoutDistCopyParityReport`, `legacyLayoutRuntimeCallerReport`, `legacyLayoutInventoryDependencyReport`, `legacyLayoutWebAccessiblePolicy`, `legacyLayoutNativeSyncParityReport`, `legacyLayoutReactivationFixtureProvenance`, or `legacyLayoutDeletionReadinessArtifact`/);
});

test('active goal completion audit records quarantined content CSS package boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Quarantined content CSS package boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_QUARANTINED_CONTENT_CSS_PACKAGE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/quarantined-content-css-package-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct package\/load proof for `css\/content\.css`, `css\/filter\.css`, and `css\/layout\.css`/);
  assert.match(source, /3 selected quarantined content CSS files/);
  assert.match(source, /1,262 counted source lines/);
  assert.match(source, /43,883 bytes/);
  assert.match(source, /137 lexical rule blocks/);
  assert.match(source, /478 `!important` declarations/);
  assert.match(source, /22 `display:none` declarations/);
  assert.match(source, /72 `:not\(\.filter-tube-visible\)` clauses/);
  assert.match(source, /167 `filter-tube-visible` tokens/);
  assert.match(source, /6 `filtertube-hidden` tokens/);
  assert.match(source, /14 `:has\(\.\.\.\)` selectors/);
  assert.match(source, /1 `clip-path` declaration/);
  assert.match(source, /8 `pointer-events:none` declarations/);
  assert.match(source, /10 `visibility:hidden` declarations/);
  assert.match(source, /10 `opacity:0` declarations/);
  assert.match(source, /4 active manifest files/);
  assert.match(source, /7 active content-script entries/);
  assert.match(source, /55 active content-script JS refs/);
  assert.match(source, /0 active content script CSS refs/);
  assert.match(source, /19 active web-accessible resource refs/);
  assert.match(source, /0 active quarantined CSS load\/exposure refs/);
  assert.match(source, /3 dist manifest files/);
  assert.match(source, /5 dist content-script entries/);
  assert.match(source, /41 dist content-script JS refs/);
  assert.match(source, /0 dist content script CSS refs/);
  assert.match(source, /14 dist web-accessible resource refs/);
  assert.match(source, /0 dist quarantined CSS load\/exposure refs/);
  assert.match(source, /3 extension HTML files/);
  assert.match(source, /10 extension HTML link tags/);
  assert.match(source, /0 extension HTML quarantined CSS links/);
  assert.match(source, /9 packaged dist CSS copies/);
  assert.match(source, /`js\/layout\.js` with 32 occurrences/);
  assert.match(source, /`build\.js` copies the whole `css` directory/);
  assert.match(source, /active and dist manifests do not load or web-expose the selected CSS/);
  assert.match(source, /extension HTML does not link it/);
  assert.match(source, /old default-hide\/reveal model/);
  assert.match(source, /active runtime hiding uses `\.filtertube-hidden` \/ `\.filtertube-hidden-shelf`/);
  assert.match(source, /package cleanup proof/);
  assert.match(source, /activation\/deletion gates/);
  assert.match(source, /first-class JSON\/DOM parity/);
  assert.match(source, /`quarantinedContentCssPackageBoundaryContract`, `quarantinedContentCssManifestLoadReport`, `quarantinedContentCssDistCopyParityReport`, `quarantinedContentCssLegacyRevealPolicy`, `quarantinedContentCssActivationFixtureProvenance`, `quarantinedContentCssDeletionReadinessArtifact`, `quarantinedContentCssNativeSyncParityReport`, `quarantinedContentCssFalseHideFixtureReport`, `quarantinedContentCssPackageCleanupGate`, or `quarantinedContentCssWebAccessiblePolicy`/);
});

test('active goal completion audit records storage payload quota boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Storage payload quota boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_STORAGE_PAYLOAD_QUOTA_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/storage-payload-quota-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /storage callsite\/cache proof toward direct payload-size and quota-adjacent proof/);
  assert.match(source, /5 storage payload quota source files/);
  assert.match(source, /14 source\/effect blocks/);
  assert.match(source, /background whole-map writes for `channelMap`, `videoChannelMap`, and `videoMetaMap`/);
  assert.match(source, /1000\/100 `videoChannelMap` entry cap/);
  assert.match(source, /2000\/500 `videoMetaMap` entry cap/);
  assert.match(source, /no equivalent `channelMap` entry cap/);
  assert.match(source, /full-object backup JSON creation through Blob\/data URLs/);
  assert.match(source, /backup rotation by record count rather than byte count/);
  assert.match(source, /Nanah `payload` JSON string envelopes/);
  assert.match(source, /StateManager direct whole-`channelMap` storage writes/);
  assert.match(source, /0 selected `getBytesInUse` tokens/);
  assert.match(source, /0 selected `QUOTA` tokens/);
  assert.match(source, /entry-count caps are not byte budgets/);
  assert.match(source, /backup\/export paths stringify entire payloads without payload-byte budgets/);
  assert.match(source, /Nanah envelopes stringify and parse payloads without size gates/);
  assert.match(source, /selected storage write paths lack shared quota authority/);
  assert.match(source, /byte-budget reports/);
  assert.match(source, /quota preflight/);
  assert.match(source, /quota error classification/);
  assert.match(source, /`storagePayloadQuotaBoundaryContract`, `storagePayloadByteBudgetReport`, `storageGetBytesInUsePreflight`, `storageQuotaErrorClassifier`, `storageMapEntryAndByteCapPolicy`, `storageBackupPayloadBudget`, `storageNanahEnvelopeSizePolicy`, `storageExportImportPayloadManifest`, `storageBackupRotationByteReport`, or `storageQuotaFixtureProvenance`/);
});

test('active goal completion audit records backup download blob URL lifecycle boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Backup download Blob URL lifecycle boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_BACKUP_DOWNLOAD_BLOB_URL_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/backup-download-blob-url-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /broad backup\/download proof toward direct Blob URL lifecycle proof/);
  assert.match(source, /3 backup download Blob URL lifecycle source files/);
  assert.match(source, /10 source\/effect blocks/);
  assert.match(source, /6 selected `URL\.createObjectURL` tokens/);
  assert.match(source, /6 selected `URL\.revokeObjectURL` tokens/);
  assert.match(source, /4 selected `Blob\(\[` tokens/);
  assert.match(source, /8 selected `downloads\.download` tokens/);
  assert.match(source, /3 selected `downloads\.search` tokens/);
  assert.match(source, /3 selected `downloads\.erase` tokens/);
  assert.match(source, /1 selected `data:application\/json` token/);
  assert.match(source, /0 selected `removeFile` tokens/);
  assert.match(source, /0 selected `clearObjectUrl` tokens/);
  assert.match(source, /background auto-backup creates an object URL or `data:application\/json` fallback/);
  assert.match(source, /schedules revocation only after the downloads API wrapper resolves/);
  assert.match(source, /separate Firefox\/promise and Chrome\/callback branches with settled guards but no timeout owner/);
  assert.match(source, /IO directory probing writes `FilterTube Backup\/\.test` before real backup save/);
  assert.match(source, /IO save creates the backup object URL before directory probing/);
  assert.match(source, /tab-view anchor fallback creates a hidden anchor/);
  assert.match(source, /removes it after 2000 ms/);
  assert.match(source, /schedules object URL revoke after 60000 ms/);
  assert.match(source, /resolves after 250 ms/);
  assert.match(source, /downloads API lastError revokes the first object URL then creates a second anchor object URL/);
  assert.match(source, /object URL registries/);
  assert.match(source, /revoke policy/);
  assert.match(source, /timeout budgets/);
  assert.match(source, /`backupDownloadBlobUrlLifecycleContract`, `backupDownloadObjectUrlRegistry`, `backupDownloadRevokePolicy`, `backupDownloadApiResultReport`, `backupDownloadAnchorFallbackPolicy`, `backupDownloadProbePolicy`, `backupDownloadFilesystemDeletionProof`, `backupDownloadTimeoutBudget`, `backupDownloadErrorClassificationReport`, or `backupDownloadCleanupMetricArtifact`/);
});

test('active goal completion audit records security crypto payload boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Security crypto payload boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SECURITY_CRYPTO_PAYLOAD_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/security-crypto-payload-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /method-level crypto coverage toward executable cryptographic container proof/);
  assert.match(source, /5 security crypto payload source files/);
  assert.match(source, /10 source\/effect blocks/);
  assert.match(source, /deterministic PIN verifier output for injected salt `AQIDBAUGBwgJCgsMDQ4PEA==`/);
  assert.match(source, /deterministic encrypted JSON output for injected IV `oKGio6Slpqeoqaqr`/);
  assert.match(source, /default 150000 iteration declarations/);
  assert.match(source, /PBKDF2\/SHA-256\/AES-GCM token counts/);
  assert.match(source, /16-byte salt and 12-byte IV behavior/);
  assert.match(source, /current `got === expected` PIN comparison/);
  assert.match(source, /0 `additionalData` tokens/);
  assert.match(source, /0 `version` tokens/);
  assert.match(source, /background encrypted auto-backup/);
  assert.match(source, /IO encrypted helpers/);
  assert.match(source, /tab-view decrypt/);
  assert.match(source, /popup\/tab PIN wrappers/);
  assert.match(source, /malformed payload failures/);
  assert.match(source, /schema reports/);
  assert.match(source, /iteration bounds/);
  assert.match(source, /timing policy/);
  assert.match(source, /associated-data policy/);
  assert.match(source, /encrypted payload size budgets/);
  assert.match(source, /`securityCryptoPayloadBoundaryContract`, `securityCryptoPayloadSchemaReport`, `securityPinVerifierTimingPolicy`, `securityPinVerifierIterationBounds`, `securityEncryptedJsonVersionPolicy`, `securityEncryptedJsonAadPolicy`, `securityEncryptedPayloadSizeBudget`, `securityEncryptedPayloadCompatibilityMatrix`, `securityEncryptedPayloadTamperFixture`, or `securityEncryptedPayloadCallerContract`/);
});

test('active goal completion audit records UI components portal lifecycle boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /UI components portal lifecycle boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_UI_COMPONENTS_PORTAL_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/ui-components-portal-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /method-level UI component proof toward direct portal\/timer proof/);
  assert.match(source, /1 UI components portal lifecycle source file/);
  assert.match(source, /3 source\/effect blocks/);
  assert.match(source, /26 `flashButtonSuccess` block lines/);
  assert.match(source, /1132 `flashButtonSuccess` block bytes/);
  assert.match(source, /378 `createDropdownFromSelect` block lines/);
  assert.match(source, /14973 dropdown block bytes/);
  assert.match(source, /20 `showToast` block lines/);
  assert.match(source, /633 toast block bytes/);
  assert.match(source, /10 selected `document\.createElement` tokens/);
  assert.match(source, /2 selected `document\.body\.appendChild` tokens/);
  assert.match(source, /7 selected `addEventListener` tokens/);
  assert.match(source, /2 selected `window\.addEventListener` tokens/);
  assert.match(source, /1 selected `document\.addEventListener` token/);
  assert.match(source, /3 selected `setTimeout` tokens/);
  assert.match(source, /0 selected `clearTimeout` tokens/);
  assert.match(source, /4 selected `requestAnimationFrame` tokens/);
  assert.match(source, /1 selected `cancelAnimationFrame` token/);
  assert.match(source, /1 selected `MutationObserver` token/);
  assert.match(source, /1 selected `observe` token/);
  assert.match(source, /0 selected `disconnect` tokens/);
  assert.match(source, /0 selected `removeEventListener` tokens/);
  assert.match(source, /button success feedback is restored by an uncancelled timer/);
  assert.match(source, /enhanced select setup has local duplicate guards/);
  assert.match(source, /dropdown is appended to `document\.body`/);
  assert.match(source, /window\/document\/select\/option listeners are installed without local removal/);
  assert.match(source, /disabled-state observation uses a `MutationObserver` without a local `disconnect\(\)` path/);
  assert.match(source, /toasts remove existing `\.ft-toast` nodes before scheduling nested removal timers/);
  assert.match(source, /portal lifecycle contracts/);
  assert.match(source, /listener owner reports/);
  assert.match(source, /observer teardown reports/);
  assert.match(source, /toast timer budgets/);
  assert.match(source, /`uiComponentsPortalLifecycleContract`, `uiComponentsDropdownPortalRegistry`, `uiComponentsDropdownListenerOwnerReport`, `uiComponentsDropdownObserverTeardownReport`, `uiComponentsFrameBudgetReport`, `uiComponentsToastTimerBudget`, `uiComponentsTransientButtonTimerReport`, `uiComponentsDuplicateEnhancementPolicy`, `uiComponentsBodyPortalCleanupProof`, `uiComponentsAccessibilityStateReport`, `uiComponentsFixtureProvenance`, or `uiComponentsLifecycleMetricArtifact`/);
});

test('active goal completion audit records StateManager storage reload enrichment lifecycle boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /StateManager storage reload\/enrichment lifecycle boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_STATE_MANAGER_STORAGE_RELOAD_ENRICHMENT_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/state-manager-storage-reload-enrichment-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /method-level StateManager proof toward direct storage reload and enrichment lifecycle proof/);
  assert.match(source, /1 StateManager storage reload\/enrichment lifecycle source file/);
  assert.match(source, /4 source\/effect blocks/);
  assert.match(source, /11 `scheduleChannelNameEnrichment` block lines/);
  assert.match(source, /343 `scheduleChannelNameEnrichment` block bytes/);
  assert.match(source, /57 `processChannelEnrichmentQueue` block lines/);
  assert.match(source, /2074 `processChannelEnrichmentQueue` block bytes/);
  assert.match(source, /58 `saveSettings` block lines/);
  assert.match(source, /2675 `saveSettings` block bytes/);
  assert.match(source, /120 `setupStorageListener` block lines/);
  assert.match(source, /5053 `setupStorageListener` block bytes/);
  assert.match(source, /5 selected `setTimeout` tokens/);
  assert.match(source, /0 selected `clearTimeout` tokens/);
  assert.match(source, /1 selected `chrome\.storage\.onChanged\.addListener` token/);
  assert.match(source, /4 selected `isSaving` tokens/);
  assert.match(source, /4 selected `notifyListeners` tokens/);
  assert.match(source, /39 selected storage key literal rows/);
  assert.match(source, /`saveSettings\(\)` drops concurrent calls while `isSaving`/);
  assert.match(source, /broadcasts only compiled settings/);
  assert.match(source, /channel enrichment uses zero-delay scheduling/);
  assert.match(source, /sends `addFilteredChannel`/);
  assert.match(source, /randomized 5000-6999 ms backoff/);
  assert.match(source, /storage listener skips non-local, saving, and map-only `channelMap` changes/);
  assert.match(source, /theme changes emit `themeChanged`/);
  assert.match(source, /external reload uses a 150 ms debounce/);
  assert.match(source, /loads with `notify:false`, `resetEnrichment:false`, and `scheduleEnrichment:false`/);
  assert.match(source, /reruns pending reloads with a zero-delay timer/);
  assert.match(source, /no clear\/remove teardown path exists in the selected block/);
  assert.match(source, /reload lifecycle contracts/);
  assert.match(source, /save queue contracts/);
  assert.match(source, /enrichment lifecycle contracts/);
  assert.match(source, /listener teardown registries/);
  assert.match(source, /`stateManagerStorageReloadLifecycleContract`, `stateManagerExternalReloadDecisionReport`, `stateManagerExternalReloadTimerBudget`, `stateManagerExternalReloadRaceReport`, `stateManagerExternalReloadTeardownReport`, `stateManagerSaveQueueContract`, `stateManagerChannelEnrichmentLifecycleContract`, `stateManagerChannelEnrichmentNetworkBudget`, `stateManagerChannelEnrichmentRetryPolicy`, `stateManagerStorageKeyParityReport`, `stateManagerListenerTeardownRegistry`, or `stateManagerLifecycleMetricArtifact`/);
});

test('active goal completion audit records background compiled cache invalidation lifecycle boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Background compiled cache invalidation lifecycle boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_BACKGROUND_COMPILED_CACHE_INVALIDATION_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/background-compiled-cache-invalidation-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /broad compiled-cache proof toward direct background compiled cache invalidation lifecycle proof/);
  assert.match(source, /1 background compiled cache invalidation lifecycle source file/);
  assert.match(source, /8 source\/effect blocks/);
  assert.match(source, /1 cacheShape block line/);
  assert.match(source, /56 cacheShape block bytes/);
  assert.match(source, /8 getCompiledSettingsCacheGate block lines/);
  assert.match(source, /414 getCompiledSettingsCacheGate block bytes/);
  assert.match(source, /44 getCompiledSettingsStorageKeys block lines/);
  assert.match(source, /1408 getCompiledSettingsStorageKeys block bytes/);
  assert.match(source, /4 getCompiledSettingsMigrationWrite block lines/);
  assert.match(source, /185 getCompiledSettingsMigrationWrite block bytes/);
  assert.match(source, /10 getCompiledSettingsCacheAssign block lines/);
  assert.match(source, /336 getCompiledSettingsCacheAssign block bytes/);
  assert.match(source, /24 runtimeGetCompiledSettingsBranch block lines/);
  assert.match(source, /1474 runtimeGetCompiledSettingsBranch block bytes/);
  assert.match(source, /16 applySettingsBranch block lines/);
  assert.match(source, /855 applySettingsBranch block bytes/);
  assert.match(source, /41 storageInvalidationListener block lines/);
  assert.match(source, /1464 storageInvalidationListener block bytes/);
  assert.match(source, /43 compiler storage key rows/);
  assert.match(source, /14 background invalidation key rows/);
  assert.match(source, /30 compiler-only storage key rows/);
  assert.match(source, /1 invalidation-only storage key row/);
  assert.match(source, /10 selected `compiledSettingsCache` tokens/);
  assert.match(source, /7 selected `getCompiledSettings` tokens/);
  assert.match(source, /2 selected `FilterTube_ApplySettings` tokens/);
  assert.match(source, /1 selected `browserAPI\.storage\.onChanged\.addListener` token/);
  assert.match(source, /1 selected `browserAPI\.storage\.local\.get` token/);
  assert.match(source, /1 selected `browserAPI\.storage\.local\.set` token/);
  assert.match(source, /1 selected `sendMessageToTabQuietly` token/);
  assert.match(source, /5 selected `forceRefresh` tokens/);
  assert.match(source, /3 selected `request\.settings` tokens/);
  assert.match(source, /0 selected `compiledSettingsRevision` tokens/);
  assert.match(source, /0 selected `cacheInvalidationReport` tokens/);
  assert.match(source, /background cache identity is only `main` and `kids`/);
  assert.match(source, /compiler and runtime message branch can return cache before storage read/);
  assert.match(source, /`getCompiledSettings\(\)` reads 43 direct storage keys/);
  assert.match(source, /can write `storageUpdates` during compilation/);
  assert.match(source, /compiler and message branch both assign cache/);
  assert.match(source, /`FilterTube_ApplySettings` assigns caller `request\.settings` into cache/);
  assert.match(source, /broadcasts it without sender or revision proof/);
  assert.match(source, /background storage invalidation watches 14 keys/);
  assert.match(source, /omits 30 direct compiler keys/);
  assert.match(source, /no clear\/remove teardown path/);
  assert.match(source, /key parity reports/);
  assert.match(source, /caller-payload policies/);
  assert.match(source, /recompile budgets/);
  assert.match(source, /`backgroundCompiledCacheInvalidationLifecycleContract`, `backgroundCompiledCacheKeyParityReport`, `backgroundCompiledCacheRevisionReport`, `backgroundCompiledCacheSourceReport`, `backgroundStorageInvalidationDecisionReport`, `backgroundStorageInvalidationKeyManifest`, `backgroundApplySettingsPayloadPolicy`, `backgroundCompiledCacheReadPathMutationReport`, `backgroundCompiledCacheRecompileBudget`, `backgroundCompiledCacheBroadcastPolicy`, or `backgroundCompiledCacheMetricArtifact`/);
});

test('active goal completion audit records StateManager request refresh fanout boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /StateManager request refresh fanout boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_STATE_MANAGER_REQUEST_REFRESH_FANOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/state-manager-request-refresh-fanout-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /broad StateManager refresh proof toward direct request-refresh fanout proof/);
  assert.match(source, /1 StateManager request refresh fanout source file/);
  assert.match(source, /10 source\/effect blocks/);
  assert.match(source, /59 saveSettingsBroadcastPath block lines/);
  assert.match(source, /2677 saveSettingsBroadcastPath block bytes/);
  assert.match(source, /11 broadcastSettings block lines/);
  assert.match(source, /309 broadcastSettings block bytes/);
  assert.match(source, /15 requestRefresh block lines/);
  assert.match(source, /486 requestRefresh block bytes/);
  assert.match(source, /302 kidsRequestRefreshMutations block lines/);
  assert.match(source, /11258 kidsRequestRefreshMutations block bytes/);
  assert.match(source, /214 mainKeywordRequestRefreshMutations block lines/);
  assert.match(source, /8120 mainKeywordRequestRefreshMutations block bytes/);
  assert.match(source, /18 requestRefresh callsite rows/);
  assert.match(source, /10 selected `await requestRefresh\('main'\)` tokens/);
  assert.match(source, /8 selected `await requestRefresh\('kids'\)` tokens/);
  assert.match(source, /3 selected `broadcastSettings\(` tokens/);
  assert.match(source, /1 selected `FilterTube_ApplySettings` token/);
  assert.match(source, /1 selected `getCompiledSettings` token/);
  assert.match(source, /1 selected `forceRefresh` token/);
  assert.match(source, /0 selected `settingsRevision` tokens/);
  assert.match(source, /`saveSettings\(\)` can broadcast `result\.compiledSettings` directly/);
  assert.match(source, /`broadcastSettings\(\)` sends caller payloads through `FilterTube_ApplySettings`/);
  assert.match(source, /`requestRefresh\(\)` asks background for `getCompiledSettings` with `forceRefresh:true`/);
  assert.match(source, /rebounds that response through the same apply-settings surface/);
  assert.match(source, /Main content\/category changes can produce direct save broadcast plus background force-refresh rebound/);
  assert.match(source, /StateManager refresh fanout still needs callsite reports/);
  assert.match(source, /direct compiled broadcast policies/);
  assert.match(source, /background refresh rebound policies/);
  assert.match(source, /`stateManagerRequestRefreshFanoutContract`, `stateManagerRequestRefreshCallsiteReport`, `stateManagerDirectCompiledBroadcastPolicy`, `stateManagerBackgroundRefreshReboundPolicy`, `stateManagerRefreshRevisionReport`, `stateManagerRefreshProfileScopeReport`, `stateManagerSaveVsRefreshDecisionReport`, `stateManagerContentCategoryRefreshBudget`, `stateManagerKidsMutationRefreshPolicy`, or `stateManagerRefreshFanoutMetricArtifact`/);
});

test('active goal completion audit records Nanah vendor runtime session lifecycle without declaring completion', () => {
  const source = doc();

  assert.match(source, /Nanah vendor runtime session lifecycle boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_NANAH_VENDOR_RUNTIME_SESSION_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/nanah-vendor-runtime-session-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /generated runtime session proof/);
  assert.match(source, /4 selected source files/);
  assert.match(source, /`js\/vendor\/nanah\.bundle\.js` at 876 lines and 27692 bytes/);
  assert.match(source, /1 `WebRtcDataChannelTransport` class at line 489 with 381 lines and 12964 bytes/);
  assert.match(source, /8 selected `addEventListener` tokens/);
  assert.match(source, /0 selected `removeEventListener` tokens/);
  assert.match(source, /0 selected timers/);
  assert.match(source, /18 selected `crypto\.subtle` tokens/);
  assert.match(source, /6 selected `getRandomValues` tokens/);
  assert.match(source, /6 selected `randomUUID` tokens/);
  assert.match(source, /6 selected `AES-GCM` tokens/);
  assert.match(source, /6 selected `HKDF` tokens/);
  assert.match(source, /7 selected `ECDH` tokens/);
  assert.match(source, /5 selected `MAX_DATA_CHANNEL_MESSAGE_CHARS` tokens/);
  assert.match(source, /4 selected `incomingChunks` tokens/);
  assert.match(source, /7 dashboard `client\.on` registrations/);
  assert.match(source, /3 `nanahClient\.send` call sites/);
  assert.match(source, /1 `nanahClient\.confirmSas` gate/);
  assert.match(source, /1 SAS relay impersonation warning/);
  assert.match(source, /Nanah carries settings payloads rather than YouTube response JSON/);
  assert.match(source, /connect timeout, reconnect policy, chunk expiry/);
  assert.match(source, /listener-owner teardown proof/);
  assert.match(source, /first-class JSON filter parity/);
  assert.match(source, /`nanahVendorRuntimeSessionLifecycleContract`, `nanahVendorWebSocketLifecycleReport`, `nanahVendorDataChannelListenerReport`, `nanahVendorPeerConnectionStateReport`, `nanahVendorCryptoHandshakeReport`, `nanahVendorSasConfirmationGate`, `nanahVendorChunkReassemblyBudget`, `nanahVendorRelayTimeoutPolicy`, `nanahVendorCloseTeardownReport`, or `nanahVendorFirstClassJsonFilterBoundary`/);
});

test('active goal completion audit records extension icon logo package parity without declaring completion', () => {
  const source = doc();

  assert.match(source, /Extension icon\/logo package parity boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_EXTENSION_ICON_LOGO_PACKAGE_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/extension-icon-logo-package-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct icon\/logo package parity proof/);
  assert.match(source, /10 selected binary\/vector files/);
  assert.match(source, /29,560 bytes/);
  assert.match(source, /7 root icon files/);
  assert.match(source, /3 website icon\/logo files/);
  assert.match(source, /4 byte-identical 128px PNG files/);
  assert.match(source, /13,624 duplicate-group bytes/);
  assert.match(source, /10,218 duplicate overhead bytes beyond one retained copy/);
  assert.match(source, /28 active manifest icon references across 4 manifests/);
  assert.match(source, /12 action icon entries/);
  assert.match(source, /16 extension icon entries/);
  assert.match(source, /`icons\/file\.svg` web-accessible exposure in default\/Chrome\/Firefox but not Opera/);
  assert.match(source, /2 packaged-but-manifest-inactive root icon files/);
  assert.match(source, /1 dashboard `\.\.\/icons\/icon-128\.png` consumer/);
  assert.match(source, /2 popup `\.\.\/icons\/icon-48\.png` source\/output consumers/);
  assert.match(source, /3 website `\/brand\/logo\.png` route\/header consumers/);
  assert.match(source, /icon\/logo changes still need package artifact proof/);
  assert.match(source, /manifest parity reports/);
  assert.match(source, /native\/store parity proof/);
  assert.match(source, /deletion-readiness gates/);
  assert.match(source, /`extensionIconLogoPackageParityContract`, `extensionIconManifestReferenceReport`, `extensionIconWebAccessibleParityReport`, `extensionIconPackageInclusionReport`, `extensionIconInactiveAssetDecision`, `websiteLogoDuplicateManifest`, `websiteLogoRouteConsumerReport`, `iconLogoReleaseArtifactParityReport`, `iconLogoVisualFixtureProvenance`, or `iconLogoDeletionReadinessGate`/);
});

test('active goal completion audit records release notes JSON version gate without declaring completion', () => {
  const source = doc();

  assert.match(source, /Release notes JSON version gate boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_RELEASE_NOTES_JSON_VERSION_GATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/release-notes-json-version-gate-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct release-note JSON version-gate proof/);
  assert.match(source, /`data\/release_notes\.json` at 317 lines/);
  assert.match(source, /23,039 bytes/);
  assert.match(source, /sha256 `e012f6c071fffa67958f55544ecae9bbb26e7ec91edd2066df4d06a62de69962`/);
  assert.match(source, /24 array rows/);
  assert.match(source, /1 comment row/);
  assert.match(source, /23 version rows/);
  assert.match(source, /7 current top-level keys/);
  assert.match(source, /110 highlight strings/);
  assert.match(source, /newest staged version `3\.3\.2`/);
  assert.match(source, /packaged extension\/browser version `3\.3\.1`/);
  assert.match(source, /one missing `detailsUrl` row for `3\.3\.2`/);
  assert.match(source, /19 release-tag details URLs/);
  assert.match(source, /3 commit details URLs/);
  assert.match(source, /4 manifest prompt loads/);
  assert.match(source, /13-line background JSON loader/);
  assert.match(source, /20-line background payload builder/);
  assert.match(source, /14-line update payload block/);
  assert.match(source, /64-line background release-note message branch/);
  assert.match(source, /104-line dashboard loader/);
  assert.match(source, /250-line content prompt/);
  assert.match(source, /release-note changes still need schema reports/);
  assert.match(source, /package\/manifest parity gates/);
  assert.match(source, /staged-entry policy/);
  assert.match(source, /details URL policy/);
  assert.match(source, /prompt sender gates/);
  assert.match(source, /What's New URL policy/);
  assert.match(source, /dashboard render fixtures/);
  assert.match(source, /native parity reports/);
  assert.match(source, /first-class JSON filter promotion gates/);
  assert.match(source, /`releaseNotesJsonVersionGateContract`, `releaseNotesJsonSchemaReport`, `releaseNotesPackageVersionParityReport`, `releaseNotesManifestVersionParityReport`, `releaseNotesCurrentVersionEntryReport`, `releaseNotesStagedEntryPolicy`, `releaseNotesDetailsUrlPolicy`, `releaseNotesRuntimeConsumerReport`, `releaseNotesPromptSenderGate`, `releaseNotesWhatsNewUrlPolicy`, `releaseNotesDashboardRenderFixture`, `releaseNotesNativeParityReport`, `releaseNotesPublicClaimGate`, or `releaseNotesFirstClassJsonClaimGate`/);
});

test('active goal completion audit records design token JSON CSS parity without declaring completion', () => {
  const source = doc();

  assert.match(source, /Design token JSON\/CSS parity boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_DESIGN_TOKEN_JSON_CSS_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/design-token-json-css-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct design-token JSON\/CSS parity proof/);
  assert.match(source, /`design\/design_tokens\.json` at 82 lines/);
  assert.match(source, /1,902 bytes/);
  assert.match(source, /sha256 `57bada64f3690a22fedea5f07aadc029e129f971465f8c66baab4a005984b3f0`/);
  assert.match(source, /metadata version `0\.1\.0`/);
  assert.match(source, /updated `2025-11-18`/);
  assert.match(source, /6 top-level keys/);
  assert.match(source, /53 leaf values/);
  assert.match(source, /`css\/design_tokens\.css` at 302 lines/);
  assert.match(source, /10,361 bytes/);
  assert.match(source, /80 base `--ft-\*` definitions/);
  assert.match(source, /192 total CSS variable declarations/);
  assert.match(source, /715 selected active `var\(--ft-\.\.\.\)` references/);
  assert.match(source, /82 unique referenced variables/);
  assert.match(source, /29 undefined referenced variables/);
  assert.match(source, /27 unreferenced CSS token definitions/);
  assert.match(source, /43 mapped JSON leaves/);
  assert.match(source, /3 exact JSON\/CSS matches/);
  assert.match(source, /40 divergent mapped values/);
  assert.match(source, /popup\/dashboard HTML design-token load order/);
  assert.match(source, /empty troubleshoot HTML/);
  assert.match(source, /`build\.js` package-copy of `css` but not `design`/);
  assert.match(source, /no design-token package script/);
  assert.match(source, /no `build\.js` reference to `design\/design_tokens\.json`/);
  assert.match(source, /design-token changes still need schema reports/);
  assert.match(source, /CSS generation reports/);
  assert.match(source, /undefined\/unused variable budgets/);
  assert.match(source, /theme\/scene parity reports/);
  assert.match(source, /visual fixture provenance/);
  assert.match(source, /first-class JSON promotion gates/);
  assert.match(source, /`designTokenJsonCssParityContract`, `designTokenJsonSchemaReport`, `designTokenCssGenerationReport`, `designTokenCssReferenceReport`, `designTokenUndefinedVarReport`, `designTokenUnusedVarBudget`, `designTokenPackageInclusionReport`, `designTokenHtmlLoadReport`, `designTokenThemeSceneParityReport`, `designTokenFirstClassJsonClaimGate`, `designTokenVisualFixtureProvenance`, or `designTokenDeletionReadinessGate`/);
});

test('active goal completion audit records package lock script optional dependency boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Package lock script\/optional dependency boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_PACKAGE_LOCK_SCRIPT_OPTIONAL_DEPENDENCY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/package-lock-script-optional-dependency-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct lockfile script\/optional dependency proof/);
  assert.match(source, /`package\.json` at 46 lines/);
  assert.match(source, /`package-lock\.json` at 1,461 lines/);
  assert.match(source, /`website\/package\.json` at 23 lines/);
  assert.match(source, /`website\/package-lock\.json` at 1,678 lines/);
  assert.match(source, /root lockfile version 3 with 112 package entries/);
  assert.match(source, /111 non-root entries/);
  assert.match(source, /1 install-script marker \(`node_modules\/esbuild`\)/);
  assert.match(source, /3 bin entries/);
  assert.match(source, /26 optional `@esbuild\/\*` entries/);
  assert.match(source, /0 missing integrity entries/);
  assert.match(source, /website lockfile version 3 with 101 package entries/);
  assert.match(source, /100 non-root entries/);
  assert.match(source, /1 install-script marker \(`node_modules\/sharp`\)/);
  assert.match(source, /5 bin entries/);
  assert.match(source, /65 optional entries/);
  assert.match(source, /6 no-integrity\/no-resolved bundled nested Tailwind wasm entries/);
  assert.match(source, /7 bundled marker entries/);
  assert.match(source, /5 peer dependency entries/);
  assert.match(source, /package-lock changes still need lifecycle-script allowlists/);
  assert.match(source, /clean-install transcripts/);
  assert.match(source, /integrity exception reports/);
  assert.match(source, /dependency-burden budgets/);
  assert.match(source, /first-class JSON config gates/);
  assert.match(source, /`packageLockScriptOptionalDependencyBoundaryContract`, `packageLockLifecycleScriptReport`, `packageLockOptionalPlatformPackageReport`, `packageLockBinEntryReport`, `packageLockIntegrityExceptionReport`, `packageLockReproducibleInstallGate`, `packageLockLicensePolicyReport`, `packageLockFirstClassJsonConfigGate`, `packageLockDependencyBurdenBudget`, or `packageLockReleaseArtifactDependencyReport`/);
});

test('active goal completion audit records website remote request privacy performance boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Website remote request privacy\/performance boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_WEBSITE_REMOTE_REQUEST_PRIVACY_PERFORMANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/website-remote-request-privacy-performance-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct website remote surface proof/);
  assert.match(source, /29 tracked website source\/config text files/);
  assert.match(source, /14 selected file fingerprints/);
  assert.match(source, /39 URL-like literal tokens/);
  assert.match(source, /23 unique URL-like literal tokens/);
  assert.match(source, /6 `cdnjs\.cloudflare\.com` browser-logo URL literals/);
  assert.match(source, /1 `@vercel\/analytics\/next` import/);
  assert.match(source, /1 `<Analytics \/>` render site/);
  assert.match(source, /1 `next\/font\/google` import/);
  assert.match(source, /1 raw `<img` path for `browser\.logo`/);
  assert.match(source, /1 Next `<Image` path for the local website logo/);
  assert.match(source, /0 tracked website `fetch\(` callsites/);
  assert.match(source, /0 `MutationObserver` tokens/);
  assert.match(source, /0 `new Image` tokens/);
  assert.match(source, /8 `target="_blank"` tokens/);
  assert.match(source, /8 `rel="noreferrer"` tokens/);
  assert.match(source, /0 `rel="noopener noreferrer"` tokens/);
  assert.match(source, /3 `window\.localStorage` tokens/);
  assert.match(source, /website remote-request changes still need analytics scope reports/);
  assert.match(source, /remote request manifests/);
  assert.match(source, /CDN-logo localization decisions/);
  assert.match(source, /font request policies/);
  assert.match(source, /privacy-copy parity/);
  assert.match(source, /route performance budgets/);
  assert.match(source, /public URL class reports/);
  assert.match(source, /browser-side request evidence/);
  assert.match(source, /deploy artifact gates/);
  assert.match(source, /first-class JSON public-claim gates/);
  assert.match(source, /`websiteRemoteRequestPrivacyPerformanceContract`, `websiteRemoteRequestManifest`, `websiteRemoteImageAssetPolicy`, `websiteAnalyticsScopeReport`, `websiteFontRequestPolicy`, `websitePrivacyClaimParityReport`, `websiteRemoteRequestPerformanceBudget`, `websiteNoRemoteAssetBuildGate`, `websiteExternalUrlClassReport`, or `websiteFirstClassJsonPublicClaimGate`/);
});

test('active goal completion audit records JSON-first whitelist decision identity boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first whitelist decision identity boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_WHITELIST_DECISION_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-whitelist-decision-identity-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct whitelist identity proof/);
  assert.match(source, /1 whitelist decision identity boundary source file/);
  assert.match(source, /301 _shouldBlock block lines/);
  assert.match(source, /15380 _shouldBlock block bytes/);
  assert.match(source, /105 whitelist decision branch lines/);
  assert.match(source, /5392 whitelist decision branch bytes/);
  assert.match(source, /9 whitelist no-rule block lines/);
  assert.match(source, /327 whitelist no-rule block bytes/);
  assert.match(source, /17 whitelist channel loop lines/);
  assert.match(source, /961 whitelist channel loop bytes/);
  assert.match(source, /15 whitelist keyword loop lines/);
  assert.match(source, /687 whitelist keyword loop bytes/);
  assert.match(source, /27 whitelist unresolved\/page fallback lines/);
  assert.match(source, /1379 whitelist unresolved\/page fallback bytes/);
  assert.match(source, /8 whitelist no-match tail lines/);
  assert.match(source, /288 whitelist no-match tail bytes/);
  assert.match(source, /6 _logWhitelistDecision tokens/);
  assert.match(source, /`allow:matched_channel`/);
  assert.match(source, /`allow:matched_keyword`/);
  assert.match(source, /`allow:creator_page_whitelisted`/);
  assert.match(source, /`block:no_whitelist_rules`/);
  assert.match(source, /`block:unresolved_identity`/);
  assert.match(source, /`block:no_whitelist_match`/);
  assert.match(source, /3 `pageChannelMeta` tokens/);
  assert.match(source, /5 whitelist-branch `return false` tokens/);
  assert.match(source, /3 whitelist-branch `return true` tokens/);
  assert.match(source, /6 runtime whitelist identity fixtures/);
  assert.match(source, /empty whitelist removes a normal video/);
  assert.match(source, /channel whitelist identity preserves it/);
  assert.match(source, /whitelist keyword allow can preserve identityless JSON while nonmatching keywords still block/);
  assert.match(source, /creator-page fallback requires matching `pageChannelMeta`/);
  assert.match(source, /unresolved channel-rule whitelist removes identityless JSON/);
  assert.match(source, /comments bypass empty whitelist fail-closed behavior/);
  assert.match(source, /whitelist changes still need decision contracts/);
  assert.match(source, /identity reports/);
  assert.match(source, /empty-rule policies/);
  assert.match(source, /channel allow reports/);
  assert.match(source, /keyword allow reports/);
  assert.match(source, /creator-page fallback reports/);
  assert.match(source, /unresolved identity policies/);
  assert.match(source, /comment policies/);
  assert.match(source, /no-match reasons/);
  assert.match(source, /`jsonFirstWhitelistDecisionContract`, `jsonFirstWhitelistIdentityDecisionReport`, `jsonFirstWhitelistEmptyRulePolicy`, `jsonFirstWhitelistChannelAllowReport`, `jsonFirstWhitelistKeywordAllowReport`, `jsonFirstWhitelistCreatorPageFallbackReport`, `jsonFirstWhitelistUnresolvedIdentityPolicy`, `jsonFirstWhitelistCommentPolicy`, `jsonFirstWhitelistNoMatchReason`, or `jsonFirstWhitelistDecisionFixtureProvenance`/);
});

test('active goal completion audit records JSON-first list-mode matrix boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first list-mode matrix boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/json-first-list-mode-matrix-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct list-mode matrix proof/);
  assert.match(source, /1 list-mode matrix boundary source file/);
  assert.match(source, /301 _shouldBlock block lines/);
  assert.match(source, /15380 _shouldBlock block bytes/);
  assert.match(source, /5 list-mode setup block lines/);
  assert.match(source, /368 list-mode setup block bytes/);
  assert.match(source, /105 whitelist decision branch lines/);
  assert.match(source, /5392 whitelist decision branch bytes/);
  assert.match(source, /85 blocklist decision tail lines/);
  assert.match(source, /4702 blocklist decision tail bytes/);
  assert.match(source, /32 processData block lines/);
  assert.match(source, /1240 processData block bytes/);
  assert.match(source, /7 enabled skip block lines/);
  assert.match(source, /387 enabled skip block bytes/);
  assert.match(source, /6 runtime list-mode matrix fixtures/);
  assert.match(source, /disabled settings return the original payload/);
  assert.match(source, /empty blocklist preserves a normal video while empty whitelist removes it/);
  assert.match(source, /unknown `listMode` falls back to blocklist/);
  assert.match(source, /blocklist mode does not let matching whitelist rows override a blocklist channel row/);
  assert.match(source, /whitelist mode does not let matching blocklist rows override a whitelist channel allow/);
  assert.match(source, /comments bypass empty whitelist fail-close while blocklist author rows still remove comments/);
  assert.match(source, /list-mode changes still need matrix contracts/);
  assert.match(source, /simultaneous allow\/block policies/);
  assert.match(source, /conflict reports/);
  assert.match(source, /comment list-mode policies/);
  assert.match(source, /`jsonFirstListModeMatrixContract`, `jsonFirstListModeDecisionReport`, `jsonFirstDisabledModeHarvestPolicy`, `jsonFirstEmptyBlocklistPolicy`, `jsonFirstEmptyWhitelistPolicy`, `jsonFirstUnknownListModeFallbackPolicy`, `jsonFirstSimultaneousAllowBlockPolicy`, `jsonFirstBlocklistWhitelistConflictReport`, `jsonFirstCommentListModePolicy`, or `jsonFirstListModeFixtureProvenance`/);
});

test('active goal completion audit records seed fetch no-work list-mode boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Seed fetch no-work\/list-mode boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SEED_FETCH_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/seed-fetch-no-work-list-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /fetch-transport no-work proof/);
  assert.match(source, /1 seed fetch no-work\/list-mode boundary source file/);
  assert.match(source, /139 shouldSkipEngineProcessing block lines/);
  assert.match(source, /6452 shouldSkipEngineProcessing block bytes/);
  assert.match(source, /99 processWithEngine block lines/);
  assert.match(source, /4797 processWithEngine block bytes/);
  assert.match(source, /86 setupFetchInterception block lines/);
  assert.match(source, /4263 setupFetchInterception block bytes/);
  assert.match(source, /8 fetch endpoint list block lines/);
  assert.match(source, /217 fetch endpoint list block bytes/);
  assert.match(source, /54 fetch body-work block lines/);
  assert.match(source, /3175 fetch body-work block bytes/);
  assert.match(source, /37 fetch comment shortcut block lines/);
  assert.match(source, /2266 fetch comment shortcut block bytes/);
  assert.match(source, /203 setupXhrInterception comparison block lines/);
  assert.match(source, /9658 setupXhrInterception comparison block bytes/);
  assert.match(source, /8 runtime seed fetch no-work\/list-mode fixtures/);
  assert.match(source, /matching search fetches with empty blocklist pass through without parse, stringify, or harvest-only work/);
  assert.match(source, /whitelist mode on the same search route runs `processData\(\)`/);
  assert.match(source, /boolean content-filter settings activate seed JSON work/);
  assert.match(source, /malformed truthy content-filter settings do not activate seed JSON work/);
  assert.match(source, /disabled and missing-settings fetches pass through without body work/);
  assert.match(source, /desktop and mobile home empty-blocklist fetches share pass-through no-work behavior/);
  assert.match(source, /empty selected category is inactive for search fetch JSON work/);
  assert.match(source, /append comment continuations with `hideAllComments` bypass the engine with a synthetic end marker/);
  assert.match(source, /reload comment continuations still call `processData\(\)`/);
  assert.match(source, /codebase inspection is finding optimization locations and first-class JSON filter promotion blockers/);
  assert.match(source, /seed fetch changes still need no-work\/list-mode contracts/);
  assert.match(source, /parse\/stringify budgets/);
  assert.match(source, /disabled pass-through policies/);
  assert.match(source, /missing-settings queue reports/);
  assert.match(source, /harvest-only policies/);
  assert.match(source, /mobile home policies/);
  assert.match(source, /category selected policies/);
  assert.match(source, /comment continuation policies/);
  assert.match(source, /metric artifacts/);
  assert.match(source, /`jsonFirstSeedFetchNoWorkListModeContract`, `jsonFirstSeedFetchWorkDecisionReport`, `jsonFirstSeedFetchParseStringifyBudget`, `jsonFirstSeedFetchDisabledPassThroughPolicy`, `jsonFirstSeedFetchMissingSettingsQueueReport`, `jsonFirstSeedFetchHarvestOnlyPolicy`, `jsonFirstSeedFetchMobileHomePolicy`, `jsonFirstSeedFetchCategorySelectedPolicy`, `jsonFirstSeedFetchCommentContinuationPolicy`, or `jsonFirstSeedFetchNoWorkFixtureProvenance`/);
});

test('active goal completion audit records seed XHR no-work list-mode boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Seed XHR no-work\/list-mode boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SEED_XHR_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/seed-xhr-no-work-list-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /XHR-transport no-work proof/);
  assert.match(source, /1 seed XHR no-work\/list-mode boundary source file/);
  assert.match(source, /139 shouldSkipEngineProcessing block lines/);
  assert.match(source, /6452 shouldSkipEngineProcessing block bytes/);
  assert.match(source, /99 processWithEngine block lines/);
  assert.match(source, /4797 processWithEngine block bytes/);
  assert.match(source, /203 setupXhrInterception block lines/);
  assert.match(source, /9658 setupXhrInterception block bytes/);
  assert.match(source, /8 XHR endpoint list block lines/);
  assert.match(source, /242 XHR endpoint list block bytes/);
  assert.match(source, /79 XHR processor block lines/);
  assert.match(source, /4199 XHR processor block bytes/);
  assert.match(source, /25 XHR listener wrapper block lines/);
  assert.match(source, /1010 XHR listener wrapper block bytes/);
  assert.match(source, /26 XHR prototype listener patch block lines/);
  assert.match(source, /1378 XHR prototype listener patch block bytes/);
  assert.match(source, /11 XHR open patch block lines/);
  assert.match(source, /529 XHR open patch block bytes/);
  assert.match(source, /26 XHR send patch block lines/);
  assert.match(source, /1186 XHR send patch block bytes/);
  assert.match(source, /8 runtime seed XHR no-work\/list-mode fixtures/);
  assert.match(source, /matching search XHRs with empty blocklist bypass hook\/body work/);
  assert.match(source, /whitelist search XHR runs `processData\(\)`/);
  assert.match(source, /disabled and missing-settings XHRs do not mark, hook, or do body work/);
  assert.match(source, /disabled page `load` listeners are not wrapped when XHR body work is bypassed/);
  assert.match(source, /desktop and mobile home empty-blocklist XHRs bypass body work/);
  assert.match(source, /empty selected category does not make search XHR active JSON work/);
  assert.match(source, /player, next, and guide XHRs with empty blocklist bypass body work/);
  assert.match(source, /seed XHR changes still need no-work\/list-mode contracts/);
  assert.match(source, /hook budgets/);
  assert.match(source, /listener-wrap budgets/);
  assert.match(source, /body-work budgets/);
  assert.match(source, /disabled no-work policies/);
  assert.match(source, /missing-settings policies/);
  assert.match(source, /endpoint-family policies/);
  assert.match(source, /`jsonFirstSeedXhrNoWorkListModeContract`, `jsonFirstSeedXhrWorkDecisionReport`, `jsonFirstSeedXhrHookBudget`, `jsonFirstSeedXhrListenerWrapBudget`, `jsonFirstSeedXhrBodyWorkBudget`, `jsonFirstSeedXhrDisabledNoWorkPolicy`, `jsonFirstSeedXhrMissingSettingsPolicy`, `jsonFirstSeedXhrHarvestOnlyPolicy`, `jsonFirstSeedXhrMobileHomePolicy`, or `jsonFirstSeedXhrEndpointFamilyPolicy`/);
});

test('active goal completion audit records seed initial global no-work list-mode boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Seed initial global no-work\/list-mode boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SEED_INITIAL_GLOBAL_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(source, /tests\/runtime\/seed-initial-global-no-work-list-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /page-global no-work proof/);
  assert.match(source, /1 seed initial global no-work\/list-mode boundary source file/);
  assert.match(source, /102 establishDataHooks block lines/);
  assert.match(source, /5012 establishDataHooks block bytes/);
  assert.match(source, /45 ytInitialData hook block lines/);
  assert.match(source, /2221 ytInitialData hook block bytes/);
  assert.match(source, /45 ytInitialPlayerResponse hook block lines/);
  assert.match(source, /2436 ytInitialPlayerResponse hook block bytes/);
  assert.match(source, /70 updateSettings block lines/);
  assert.match(source, /3450 updateSettings block bytes/);
  assert.match(source, /99 processWithEngine block lines/);
  assert.match(source, /4797 processWithEngine block bytes/);
  assert.match(source, /139 shouldSkipEngineProcessing block lines/);
  assert.match(source, /6452 shouldSkipEngineProcessing block bytes/);
  assert.match(source, /29 replayPendingQueueIfReady block lines/);
  assert.match(source, /993 replayPendingQueueIfReady block bytes/);
  assert.match(source, /17 cloneData block lines/);
  assert.match(source, /534 cloneData block bytes/);
  assert.match(source, /8 runtime seed initial global no-work\/list-mode fixtures/);
  assert.match(source, /search empty-blocklist `ytInitialData` setters bypass debug and engine work/);
  assert.match(source, /search whitelist `ytInitialData` runs `processData\(\)`/);
  assert.match(source, /boolean content-filter `ytInitialData` runs `processData\(\)`/);
  assert.match(source, /malformed truthy content-filter `ytInitialData` remains no-work/);
  assert.match(source, /disabled `ytInitialData` skips debug-size and engine work/);
  assert.match(source, /missing-settings `ytInitialData` queues and then empty settings clear without replay/);
  assert.match(source, /home `ytInitialData` with empty blocklist bypasses engine work/);
  assert.match(source, /`ytInitialPlayerResponse` with empty blocklist bypasses engine work/);
  assert.match(source, /existing `ytInitialData` before settings queues and then empty settings clear without replay/);
  assert.match(source, /codebase inspection is finding optimization locations and first-class JSON filter promotion blockers across page globals/);
  assert.match(source, /seed initial global changes still need no-work\/list-mode contracts/);
  assert.match(source, /debug-size budgets/);
  assert.match(source, /queue replay policies/);
  assert.match(source, /raw snapshot policies/);
  assert.match(source, /setter assignment guards/);
  assert.match(source, /home policies/);
  assert.match(source, /player-response policies/);
  assert.match(source, /metric artifacts/);
  assert.match(source, /`jsonFirstSeedInitialGlobalNoWorkListModeContract`, `jsonFirstSeedInitialGlobalWorkDecisionReport`, `jsonFirstSeedInitialGlobalDebugSizeBudget`, `jsonFirstSeedInitialGlobalQueueReplayPolicy`, `jsonFirstSeedInitialGlobalRawSnapshotPolicy`, `jsonFirstSeedInitialGlobalSetterAssignmentGuard`, `jsonFirstSeedInitialGlobalHomePolicy`, `jsonFirstSeedInitialPlayerResponsePolicy`, `jsonFirstSeedInitialGlobalFixtureProvenance`, or `jsonFirstSeedInitialGlobalMetricArtifact`/);
  assert.match(source, /2026-05-30 seed no-work gate current-source rerun/);
  assert.match(source, /passed 50\/50 tests/);
  assert.match(source, /`js\/seed\.js:220` for active JSON filter-rule detection/);
  assert.match(source, /`js\/seed\.js:234` for `hasNetworkJsonWork\(\)`/);
  assert.match(source, /`js\/seed\.js:253` for pre-parse network bypass/);
  assert.match(source, /`js\/seed\.js:263` for engine-skip decisions/);
  assert.match(source, /`js\/seed\.js:314` for search empty-rule skip/);
  assert.match(source, /`js\/seed\.js:337` for channel empty-rule skip/);
  assert.match(source, /`js\/seed\.js:406` for `processWithEngine\(\)` no-active-work return/);
  assert.match(source, /`js\/seed\.js:1002` for clearing queued globals and raw snapshots when settings have no active JSON work/);
  assert.match(source, /`js\/injector\.js:171` plus `js\/injector\.js:185` for the same main-world active-work predicate mirror/);
  assert.match(source, /no-settings, disabled, empty blocklist, empty category, malformed truthy content-filter, fetch, XHR, and initial-global page data now avoid parse\/stringify\/hook\/replay\/body work/);
  assert.match(source, /unless whitelist mode, strict content filters, active JSON rules, or comment-continuation rules require it/);
  assert.match(source, /Runtime behavior changed by this rerun: no/);
  assert.match(source, /Live SPA metric artifacts, installed visible-tab parity, route\/surface JSON parity, raw fixture provenance, whitelist optimization approval, JSON-first first-class promotion, release\/public-claim use, and `update_goal\(status='complete'\)` remain `NO-GO`/);
});

test('active goal completion audit records seed settings replay provenance boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Seed settings replay provenance boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SEED_SETTINGS_REPLAY_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/seed-settings-replay-provenance-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /cross-owner settings replay proof/);
  assert.match(source, /5 seed settings replay provenance source files/);
  assert.match(source, /70 seed updateSettings block lines/);
  assert.match(source, /3450 seed updateSettings block bytes/);
  assert.match(source, /25 seed global interface block lines/);
  assert.match(source, /867 seed global interface block bytes/);
  assert.match(source, /33 bridge apply-settings message block lines/);
  assert.match(source, /1454 bridge apply-settings message block bytes/);
  assert.match(source, /49 bridge seed relay block lines/);
  assert.match(source, /1284 bridge seed relay block bytes/);
  assert.match(source, /105 injector seed relay block lines/);
  assert.match(source, /3946 injector seed relay block bytes/);
  assert.match(source, /11 StateManager broadcastSettings block lines/);
  assert.match(source, /309 StateManager broadcastSettings block bytes/);
  assert.match(source, /16 background apply-settings block lines/);
  assert.match(source, /855 background apply-settings block bytes/);
  assert.match(source, /5 runtime seed settings replay provenance fixtures/);
  assert.match(source, /seed caches the incoming settings object/);
  assert.match(source, /first settings update drains queued globals, assigns through installed setters, then replays raw snapshots/);
  assert.match(source, /equivalent duplicate settings updates replay raw `ytInitialData` and `ytInitialPlayerResponse` again without revision or dirty-key proof/);
  assert.match(source, /public `window\.filterTube\.rawYtInitialData` and `rawYtInitialPlayerResponse` fields can feed replay/);
  assert.match(source, /disabled replay skips engine calls but still assigns raw snapshots through setters and pays setter stringify/);
  assert.match(source, /current relay source keeps StateManager, background, content bridge, and injector as split settings replay owners/);
  assert.match(source, /seed settings replay still needs provenance contracts/);
  assert.match(source, /revision reports/);
  assert.match(source, /dirty-key policies/);
  assert.match(source, /queue drain budgets/);
  assert.match(source, /raw snapshot replay policies/);
  assert.match(source, /setter reentry guards/);
  assert.match(source, /relay owner reports/);
  assert.match(source, /duplicate delivery policies/);
  assert.match(source, /`seedSettingsReplayProvenanceContract`, `seedSettingsReplayDecisionReport`, `seedSettingsRevisionReport`, `seedSettingsDirtyKeyPolicy`, `seedSettingsQueueDrainBudget`, `seedSettingsRawSnapshotReplayPolicy`, `seedSettingsSetterReentryGuard`, `seedSettingsRelayOwnerReport`, `seedSettingsDuplicateDeliveryPolicy`, `seedSettingsReplayFixtureProvenance`, or `seedSettingsReplayMetricArtifact`/);
});

test('active goal completion audit records seed page-global patch teardown boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Seed page-global patch teardown boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SEED_PAGE_GLOBAL_PATCH_TEARDOWN_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/seed-page-global-patch-teardown-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct page-global patch teardown proof/);
  assert.match(source, /1 seed page-global patch teardown source file/);
  assert.match(source, /102 establishDataHooks block lines/);
  assert.match(source, /5012 establishDataHooks block bytes/);
  assert.match(source, /86 setupFetchInterception block lines/);
  assert.match(source, /4263 setupFetchInterception block bytes/);
  assert.match(source, /203 setupXhrInterception block lines/);
  assert.match(source, /9658 setupXhrInterception block bytes/);
  assert.match(source, /25 seed global interface block lines/);
  assert.match(source, /867 seed global interface block bytes/);
  assert.match(source, /20 seed initialization block lines/);
  assert.match(source, /564 seed initialization block bytes/);
  assert.match(source, /5 runtime seed page-global patch teardown fixtures/);
  assert.match(source, /initial seed load patches fetch, four XHR prototype methods, both `ytInitial\*` accessors, readiness flags, and `window\.filterTube`/);
  assert.match(source, /ordinary duplicate seed load is guarded/);
  assert.match(source, /forced seed re-entry can rewrap fetch while XHR prototype methods stay stable/);
  assert.match(source, /processed XHR instances receive per-instance response accessors without a removal owner/);
  assert.match(source, /seed global interface exposes no restore\/unpatch\/dispose\/destroy\/teardown\/clear owner/);
  assert.match(source, /seed page-global patches still need teardown contracts/);
  assert.match(source, /fetch idempotence reports/);
  assert.match(source, /XHR idempotence reports/);
  assert.match(source, /initial-global accessor owner reports/);
  assert.match(source, /response accessor lifetime reports/);
  assert.match(source, /restore policies/);
  assert.match(source, /lifetime justifications/);
  assert.match(source, /`seedPageGlobalPatchTeardownContract`, `seedPageGlobalPatchOwnerReport`, `seedFetchPatchIdempotenceReport`, `seedXhrPatchIdempotenceReport`, `seedInitialGlobalAccessorOwnerReport`, `seedXhrResponseAccessorLifetimeReport`, `seedPageGlobalPatchRestorePolicy`, `seedPageGlobalPatchLifetimeJustification`, `seedPageGlobalPatchFixtureProvenance`, or `seedPageGlobalPatchMetricArtifact`/);
});

test('active goal completion audit records bridge settings listener timer boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Bridge settings listener\/timer boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_BRIDGE_SETTINGS_LISTENER_TIMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/bridge-settings-listener-timer-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct bridge listener\/timer proof/);
  assert.match(source, /1 bridge settings listener\/timer source file/);
  assert.match(source, /71 waiter cluster block lines/);
  assert.match(source, /2340 waiter cluster block bytes/);
  assert.match(source, /43 subscription request block lines/);
  assert.match(source, /1942 subscription request block bytes/);
  assert.match(source, /53 subscription message listener block lines/);
  assert.match(source, /2299 subscription message listener block bytes/);
  assert.match(source, /122 runtime listener block lines/);
  assert.match(source, /5684 runtime listener block bytes/);
  assert.match(source, /201 seed relay cluster block lines/);
  assert.match(source, /8139 seed relay cluster block bytes/);
  assert.match(source, /131 storage refresh cluster block lines/);
  assert.match(source, /4506 storage refresh cluster block bytes/);
  assert.match(source, /3 storage listener registration block lines/);
  assert.match(source, /96 storage listener registration block bytes/);
  assert.match(source, /6 runtime bridge settings listener\/timer fixtures/);
  assert.match(source, /5 storage admission executable continuation rows/);
  assert.match(source, /initial bridge settings load attaches the guarded window message listener, guarded runtime message listener, and storage change listener/);
  assert.match(source, /main-world readiness waiters resolve from injector ready messages while timeout callbacks remain armed but settled/);
  assert.match(source, /repeated failed sends can schedule multiple 250 ms retry timers/);
  assert.match(source, /seed retry callbacks recursively reschedule until `window\.filterTube\.updateSettings\(\)` succeeds/);
  assert.match(source, /storage refresh immediately force-refreshes outside the 250 ms interval/);
  assert.match(source, /storage admission ignores lone `channelMap` and non-`local` changes/);
  assert.match(source, /subscription import progress clears and rearms the request timeout/);
  assert.match(source, /bridge settings still needs listener\/timer contracts/);
  assert.match(source, /seed retry budget reports/);
  assert.match(source, /storage listener teardown reports/);
  assert.match(source, /readiness timeout budgets/);
  assert.match(source, /subscription request lifecycle reports/);
  assert.match(source, /`bridgeSettingsListenerTimerContract`, `bridgeSettingsSeedRetryBudgetReport`, `bridgeSettingsSeedReadyListenerOwnerReport`, `bridgeSettingsStorageRefreshDecisionReport`, `bridgeSettingsStorageListenerTeardownReport`, `bridgeSettingsReadinessTimeoutBudget`, `bridgeSettingsSubscriptionRequestLifecycleReport`, `bridgeSettingsRuntimeMessageDecisionReport`, `bridgeSettingsFixtureProvenance`, or `bridgeSettingsMetricArtifact`/);
});

test('active goal completion audit records content bridge startup timing boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content bridge startup timing boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_STARTUP_TIMING_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/content-bridge-startup-timing-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct content bridge startup timing proof/);
  assert.match(source, /2 content bridge startup timing source files/);
  assert.match(source, /bridge_injection at 127 lines and 4741 bytes/);
  assert.match(source, /content_bridge at 12985 lines and 579257 bytes/);
  assert.match(source, /23 fallback block lines/);
  assert.match(source, /904 fallback block bytes/);
  assert.match(source, /46 injectMainWorldScripts block lines/);
  assert.match(source, /1752 injectMainWorldScripts block bytes/);
  assert.match(source, /236 main-world handler block lines/);
  assert.match(source, /11060 main-world handler block bytes/);
  assert.match(source, /12 initialize block lines/);
  assert.match(source, /392 initialize block bytes/);
  assert.match(source, /341 initializeDOMFallback block lines/);
  assert.match(source, /16321 initializeDOMFallback block bytes/);
  assert.match(source, /26 DOM observer setup slice lines/);
  assert.match(source, /948 DOM observer setup slice bytes/);
  assert.match(source, /8 runtime content bridge startup timing fixtures/);
  assert.match(source, /fallback script injection spaces loads with a 50 ms timer and no cleanup owner/);
  assert.match(source, /successful MAIN-world injection schedules a fixed 100 ms settings replay/);
  assert.match(source, /content_bridge registers the message listener and starts initialize from a fixed 50 ms timer/);
  assert.match(source, /initialize awaits injection and settings but starts DOM fallback without awaiting it/);
  assert.match(source, /main-world handler refreshes on full injector ready while ignoring bridge-ready messages/);
  assert.match(source, /DOM fallback waits 1000 ms, can request settings again, applies fallback work, and installs fallback menu buttons/);
  assert.match(source, /observer setup attaches to body or waits for DOMContentLoaded once/);
  assert.match(source, /DOM fallback startup has no local singleton guard or shared startup owner report/);
  assert.match(source, /2026-05-28 startup no-work executable continuation/);
  assert.match(source, /startup no-work gate executable rows: 4/);
  assert.match(source, /startup explicit bridge request bypass rows: 1/);
  assert.match(source, /startup executable continuation behavior changed: no/);
  assert.match(source, /startup executable continuation approval: `NO-GO`/);
  assert.match(source, /Null, disabled, and empty blocklist startup settings skip MAIN-world injection/);
  assert.match(source, /whitelist startup and explicit bridge identity requests still inject and replay settings/);
  assert.match(source, /content bridge startup timing still needs startup timing contracts/);
  assert.match(source, /startup timer budget reports/);
  assert.match(source, /injection settings replay reports/);
  assert.match(source, /ready-message decision reports/);
  assert.match(source, /initialize promise contracts/);
  assert.match(source, /first DOM fallback policies/);
  assert.match(source, /DOM fallback singleton reports/);
  assert.match(source, /startup observer owner reports/);
  assert.match(source, /`contentBridgeStartupTimingContract`, `contentBridgeStartupTimerBudgetReport`, `contentBridgeInjectionSettingsReplayReport`, `contentBridgeReadyMessageDecisionReport`, `contentBridgeInitializePromiseContract`, `contentBridgeFirstDomFallbackPolicy`, `contentBridgeDomFallbackSingletonReport`, `contentBridgeStartupObserverOwnerReport`, `contentBridgeStartupFixtureProvenance`, or `contentBridgeStartupMetricArtifact`/);
});

test('active goal completion audit records background script injection trust boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Background script injection trust boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_BACKGROUND_SCRIPT_INJECTION_TRUST_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/background-script-injection-trust-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct background-mediated script injection trust proof/);
  assert.match(source, /2 background script injection trust source files/);
  assert.match(source, /background at 6270 lines and 282251 bytes/);
  assert.match(source, /bridge_injection at 127 lines and 4741 bytes/);
  assert.match(source, /4 manifest scripting permission carriers/);
  assert.match(source, /47 injectScripts block lines/);
  assert.match(source, /1612 injectScripts block bytes/);
  assert.match(source, /33 subscriptions bridge block lines/);
  assert.match(source, /1207 subscriptions bridge block bytes/);
  assert.match(source, /14 injectViaScriptingAPI block lines/);
  assert.match(source, /505 injectViaScriptingAPI block bytes/);
  assert.match(source, /23 injectViaFallback block lines/);
  assert.match(source, /904 injectViaFallback block bytes/);
  assert.match(source, /46 injectMainWorldScripts block lines/);
  assert.match(source, /1752 injectMainWorldScripts block bytes/);
  assert.match(source, /8 runtime background script injection trust fixtures/);
  assert.match(source, /bridge_injection requests `injectScripts` from background/);
  assert.match(source, /background derives the MAIN-world injection target from sender tab and frame/);
  assert.match(source, /missing sender tab and missing scripting API fail early/);
  assert.match(source, /caller-provided script names are trimmed and mapped to `js\/\*\.js`/);
  assert.match(source, /empty file list succeeds without executing scripts/);
  assert.match(source, /non-empty injection calls asynchronous MAIN-world `executeScript`/);
  assert.match(source, /unclassified path shapes are mapped before browser-side loading decides the result/);
  assert.match(source, /subscriptions bridge injects a fixed isolated-world file list into caller-supplied tab id/);
  assert.match(source, /background script injection trust still needs trusted sender contracts/);
  assert.match(source, /script allowlist reports/);
  assert.match(source, /sender class reports/);
  assert.match(source, /target scope reports/);
  assert.match(source, /world policies/);
  assert.match(source, /subscription bridge injection policies/);
  assert.match(source, /scripting permission owner reports/);
  assert.match(source, /web-accessible resource reason reports/);
  assert.match(source, /`backgroundScriptInjectionTrustContract`, `backgroundInjectScriptsAllowedScriptReport`, `backgroundInjectScriptsSenderClassReport`, `backgroundInjectScriptsTargetScopeReport`, `backgroundInjectScriptsWorldPolicy`, `backgroundSubscriptionsBridgeInjectionPolicy`, `backgroundScriptingPermissionOwnerReport`, `backgroundScriptInjectionFixtureProvenance`, `backgroundScriptInjectionMetricArtifact`, or `backgroundScriptInjectionWebAccessibleResourceReason`/);
});

test('active goal completion audit records content bridge main-world message dispatch boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content bridge main-world message dispatch boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_MAIN_WORLD_MESSAGE_DISPATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/content-bridge-main-world-message-dispatch-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct content bridge main-world receiver dispatch proof/);
  assert.match(source, /1 content bridge main-world dispatch source file/);
  assert.match(source, /content_bridge at 12985 lines and 579257 bytes/);
  assert.match(source, /236 handler lines/);
  assert.match(source, /11060 handler bytes/);
  assert.match(source, /12 handler `FilterTube_\*` branches/);
  assert.match(source, /1 startsWith `FilterTube_` token/);
  assert.match(source, /1 self-source exclusion token/);
  assert.match(source, /1 same-window guard/);
  assert.match(source, /0 event\.origin tokens/);
  assert.match(source, /0 nonce tokens/);
  assert.match(source, /0 trustedSource tokens/);
  assert.match(source, /0 allowedSource tokens/);
  assert.match(source, /5 pending request lookups/);
  assert.match(source, /1 pending collab-card lookup/);
  assert.match(source, /4 clearTimeout tokens/);
  assert.match(source, /1 setTimeout token/);
  assert.match(source, /1 requestAnimationFrame token/);
  assert.match(source, /3 applyDOMFallback tokens/);
  assert.match(source, /8 runtime content bridge main-world message dispatch fixtures/);
  assert.match(source, /receiver admits same-window `FilterTube_\*` messages while excluding only `source === 'content_bridge'`/);
  assert.match(source, /exact branch inventory contains 12 message types/);
  assert.match(source, /readiness and refresh messages request settings and refresh can force DOM fallback reprocess/);
  assert.match(source, /learned map messages persist channel\/video\/meta\/custom-url identity and can rerun DOM work/);
  assert.match(source, /pending response messages use request ids as local correlation/);
  assert.match(source, /subscription progress can rearm a timeout/);
  assert.match(source, /cache and dialog collaborator messages can apply collaborators without pending request ownership/);
  assert.match(source, /handler lacks origin, nonce, trusted-source, allowed-source, sender capability, route, host, and settings revision gates/);
  assert.match(source, /2026-05-28 content bridge message ingress executable continuation/);
  assert.match(source, /message dispatch executable ingress rows: 5/);
  assert.match(source, /message dispatch executable behavior changed: no/);
  assert.match(source, /message dispatch executable approval: `NO-GO`/);
  assert.match(source, /Off-window `FilterTube_\*`, same-window non-`FilterTube_\*`, and same-window self-source messages return without settings requests or DOM fallback/);
  assert.match(source, /`FilterTube_InjectorToBridge_Ready` requests settings/);
  assert.match(source, /`FilterTube_Refresh` requests settings then calls `applyDOMFallback\(\.\.\., \{ forceReprocess: true \}\)`/);
  assert.match(source, /content bridge main-world dispatch still needs page-message sender policies/);
  assert.match(source, /nonce reports/);
  assert.match(source, /side-effect reports/);
  assert.match(source, /refresh ownership reports/);
  assert.match(source, /learned-map message policies/);
  assert.match(source, /pending response correlation reports/);
  assert.match(source, /unsolicited collaborator policies/);
  assert.match(source, /`contentBridgeMainWorldMessageDispatchContract`, `contentBridgePageMessageSenderPolicy`, `contentBridgePageMessageNonceReport`, `contentBridgeMessageTypeSideEffectReport`, `contentBridgeRefreshOwnershipReport`, `contentBridgeLearnedMapMessagePolicy`, `contentBridgePendingResponseCorrelationReport`, `contentBridgeUnsolicitedCollaboratorPolicy`, `contentBridgeMessageDispatchMetricArtifact`, or `contentBridgeMainWorldMessageFixtureProvenance`/);
});

test('active goal completion audit records injector main-world message dispatch boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Injector main-world message dispatch boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_INJECTOR_MAIN_WORLD_MESSAGE_DISPATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/injector-main-world-message-dispatch-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct main-world injector dispatch proof/);
  assert.match(source, /1 injector main-world dispatch source file/);
  assert.match(source, /injector at 3536 lines and 153876 bytes/);
  assert.match(source, /46 subscription handler lines/);
  assert.match(source, /1795 subscription handler bytes/);
  assert.match(source, /7 install block lines/);
  assert.match(source, /355 install block bytes/);
  assert.match(source, /120 main listener block lines/);
  assert.match(source, /5391 main listener block bytes/);
  assert.match(source, /5 selected message types/);
  assert.match(source, /2 addEventListener tokens/);
  assert.match(source, /0 removeEventListener tokens/);
  assert.match(source, /3 postMessage tokens/);
  assert.match(source, /3 wildcard postMessage target tokens/);
  assert.match(source, /2 same-window guards/);
  assert.match(source, /2 injector self-guards/);
  assert.match(source, /4 content_bridge source gates/);
  assert.match(source, /1 filter_logic source gate/);
  assert.match(source, /0 event\.origin tokens/);
  assert.match(source, /0 nonce tokens/);
  assert.match(source, /0 capability tokens/);
  assert.match(source, /0 revision tokens/);
  assert.match(source, /9 requestId tokens/);
  assert.match(source, /8 runtime injector main-world message dispatch fixtures/);
  assert.match(source, /subscription import listener installation runs before the duplicate-run guard/);
  assert.match(source, /named subscription listener uses an installed flag but no removal path/);
  assert.match(source, /`FilterTube_RequestSubscriptionImport` from `content_bridge` calls `fetchSubscribedChannelsFromYoutubei\(\)`/);
  assert.match(source, /posts wildcard subscription responses/);
  assert.match(source, /anonymous listener accepts string source labels/);
  assert.match(source, /`FilterTube_SettingsToInjector` merges caller payload and drains queued work without revision/);
  assert.match(source, /`FilterTube_CacheCollaboratorInfo` mutates the collaborator cache from `filter_logic`/);
  assert.match(source, /collaborator and channel lookup requests post wildcard responses/);
  assert.match(source, /selected listener blocks lack origin, nonce, capability, sender capability, settings revision, route, host, profile, list-mode, and active-rule reason gates/);
  assert.match(source, /2026-05-28 injector message ingress executable continuation/);
  assert.match(source, /injector dispatch executable ingress rows: 8/);
  assert.match(source, /injector dispatch executable behavior changed: no/);
  assert.match(source, /injector dispatch executable approval: `NO-GO`/);
  assert.match(source, /Repeat subscription bridge install does not add another listener/);
  assert.match(source, /off-window, wrong-type, and self-source subscription messages do not fetch or respond/);
  assert.match(source, /same-window subscription import request from `content_bridge` calls `fetchSubscribedChannelsFromYoutubei\(requestId, payload\)` and posts a wildcard subscription response/);
  assert.match(source, /off-window, self-source, and wrong-source settings messages do not merge settings, update seed, or drain queued data/);
  assert.match(source, /same-window settings message from `content_bridge` merges payload, sets settings received, calls `updateSeedSettings\(\)`, checks `hasNetworkJsonWork\(\)`, and drains queued data when active/);
  assert.match(source, /injector main-world dispatch still needs page-message sender policies/);
  assert.match(source, /settings revision reports/);
  assert.match(source, /subscription import dispatch policies/);
  assert.match(source, /action-token reports/);
  assert.match(source, /collaborator cache message policies/);
  assert.match(source, /lookup request correlation reports/);
  assert.match(source, /`injectorMainWorldMessageDispatchContract`, `injectorPageMessageSenderPolicy`, `injectorPageMessageNonceReport`, `injectorSettingsMessageRevisionReport`, `injectorSubscriptionImportDispatchPolicy`, `injectorSubscriptionImportActionTokenReport`, `injectorCollaboratorCacheMessagePolicy`, `injectorLookupRequestCorrelationReport`, `injectorMainWorldDispatchMetricArtifact`, or `injectorMainWorldMessageFixtureProvenance`/);
});

test('active goal completion audit records ignored whitelist bundle boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Ignored whitelist bundle boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_IGNORED_WHITELIST_BUNDLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/ignored-whitelist-bundle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct ignored whitelist bundle exclusion proof/);
  assert.match(source, /2 ignored whitelist bundle files/);
  assert.match(source, /`WHITELIST_background\.js` at 32472 lines and 1700002 bytes/);
  assert.match(source, /`WHITELIST_content\.JS` at 9302 lines and 674344 bytes/);
  assert.match(source, /2 ignored git-status entries/);
  assert.match(source, /2 `git check-ignore -v` mappings/);
  assert.match(source, /34\/21 `chrome\.storage\.local\.get` tokens/);
  assert.match(source, /24\/9 `chrome\.storage\.local\.set` tokens/);
  assert.match(source, /16\/29 `chrome\.runtime\.sendMessage` tokens/);
  assert.match(source, /1\/4 `chrome\.runtime\.onMessage\.addListener` tokens/);
  assert.match(source, /0\/21 `MutationObserver` tokens/);
  assert.match(source, /1\/39 `querySelectorAll` tokens/);
  assert.match(source, /1\/146 `querySelector` tokens/);
  assert.match(source, /9\/64 `addEventListener` tokens/);
  assert.match(source, /25\/81 `setTimeout` tokens/);
  assert.match(source, /35\/2 `fetch\(` tokens/);
  assert.match(source, /588\/635 `WhitelistVideo` tokens/);
  assert.match(source, /7 active release-surface files with zero exact bundle-name or `WhitelistVideo` references/);
  assert.match(source, /0 current dist bundle copies/);
  assert.match(source, /7 runtime ignored whitelist bundle boundary fixtures/);
  assert.match(source, /both bundles are ignored root evidence rather than tracked release source/);
  assert.match(source, /active manifests, build script, package metadata, README, tracked product source, and current dist output do not reference the bundle names or marker/);
  assert.match(source, /ignored content bundle carries high lifecycle and selector density if ever reintroduced/);
  assert.match(source, /current whitelist optimization scope remains the active JSON-first runtime owners, not ignored historical bundles/);
  assert.match(source, /ignored whitelist bundles still need release-exclusion reports/);
  assert.match(source, /extraction decisions/);
  assert.match(source, /lifecycle budgets/);
  assert.match(source, /message\/storage reports/);
  assert.match(source, /optimization input policies/);
  assert.match(source, /`ignoredWhitelistBundleBoundaryContract`, `ignoredWhitelistBundleReleaseExclusionReport`, `ignoredWhitelistBundleExtractionDecision`, `ignoredWhitelistBundleLifecycleBudget`, `ignoredWhitelistBundleMessageStorageReport`, `ignoredWhitelistBundleFixtureProvenance`, `ignoredWhitelistBundleCurrentRuntimeParityReport`, `ignoredWhitelistBundleOptimizationInputPolicy`, `ignoredWhitelistBundleDeletionReadinessArtifact`, or `ignoredWhitelistBundleMetricArtifact`/);
});

test('active goal completion audit records ignored local planning text boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Ignored local planning text boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_IGNORED_LOCAL_PLANNING_TEXT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/ignored-local-planning-text-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct ignored local planning\/text exclusion proof/);
  assert.match(source, /7 ignored local planning\/text artifacts/);
  assert.match(source, /7 ignored git-status entries/);
  assert.match(source, /7 `git check-ignore -v` mappings/);
  assert.match(source, /line\/byte\/SHA-256 fingerprints for `docs\/MOBILE_APP_UI_SPEC\.md`, `docs\/spa-collab-watchlist-handoff\.md`, `docs\/subscribed-channels-whitelist-import-plan\.md`, `cher\.md`, `import_channels\.txt`, `extracted_watch_paths\.txt`, and `YTM-LOGS\.txt`/);
  assert.match(source, /selected token counts including `ytInitialData`, `channelId`, `MutationObserver`, `addEventListener`, `setTimeout`, `querySelector`, `youtubei`, `whitelist`, `JSON`, and `json`/);
  assert.match(source, /zero exact path references across active release surfaces/);
  assert.match(source, /zero current dist copies/);
  assert.match(source, /7 runtime ignored local planning text boundary fixtures/);
  assert.match(source, /all seven artifacts are ignored local evidence rather than tracked release source/);
  assert.match(source, /active manifests, build script, package metadata, README, product source, and current dist output do not reference or package them/);
  assert.match(source, /`build\.js` common package surfaces exclude them/);
  assert.match(source, /first-class JSON filtering and whitelist optimization cannot be based on these raw planning\/import\/log files without reduced reviewed fixtures/);
  assert.match(source, /ignored local planning text optimization still needs release-exclusion reports/);
  assert.match(source, /extraction decisions/);
  assert.match(source, /fixture provenance/);
  assert.match(source, /optimization input policies/);
  assert.match(source, /doc claim gates/);
  assert.match(source, /package boundary reports/);
  assert.match(source, /current-runtime parity reports/);
  assert.match(source, /`ignoredLocalPlanningTextBoundaryContract`, `ignoredLocalPlanningTextReleaseExclusionReport`, `ignoredLocalPlanningTextExtractionDecision`, `ignoredLocalPlanningTextFixtureProvenance`, `ignoredLocalPlanningTextOptimizationInputPolicy`, `ignoredLocalPlanningTextDocClaimGate`, `ignoredLocalPlanningTextPackageBoundaryReport`, `ignoredLocalPlanningTextMetricArtifact`, `ignoredLocalPlanningTextDeletionReadinessReport`, or `ignoredLocalPlanningTextCurrentRuntimeParityReport`/);
});

test('active goal completion audit records background auto-backup scheduler boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Background auto-backup scheduler boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_BACKGROUND_AUTO_BACKUP_SCHEDULER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/background-auto-backup-scheduler-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct background auto-backup scheduler proof/);
  assert.match(source, /5 scheduler source files/);
  assert.match(source, /9 source\/effect blocks/);
  assert.match(source, /97 background createAutoBackupInBackground block lines/);
  assert.match(source, /3751 create block bytes/);
  assert.match(source, /25 background scheduleAutoBackupInBackground block lines/);
  assert.match(source, /863 scheduler block bytes/);
  assert.match(source, /8 wait-policy block lines/);
  assert.match(source, /376 wait-policy block bytes/);
  assert.match(source, /11 post-block wait block lines/);
  assert.match(source, /336 wait block bytes/);
  assert.match(source, /12 FilterTube_ScheduleAutoBackup action block lines/);
  assert.match(source, /652 action block bytes/);
  assert.match(source, /StateManager\/content_bridge\/tab-view\/IO-manager scheduler blocks/);
  assert.match(source, /selected `setTimeout`, `clearTimeout`, `pendingAutoBackupTrigger`, `pendingAutoBackupOptions`, `sessionPinCache`, `missing_session_pin`, `encryptJson`, `downloadWithBrowserApi`, `rotateAutoBackups`, and `Number\.isFinite` token counts/);
  assert.match(source, /8 runtime background auto-backup scheduler fixtures/);
  assert.match(source, /`FilterTube_ScheduleAutoBackup` accepts caller trigger\/options and finite numeric delay without local trusted-sender, session, allowlist, or clamp policy/);
  assert.match(source, /`scheduleAutoBackupInBackground\(\)` clears the previous timer and lets the latest trigger\/options win/);
  assert.match(source, /channel-added triggers wait for post-block enrichment unless overridden/);
  assert.match(source, /encrypted auto-backup can skip with `missing_session_pin`/);
  assert.match(source, /backup scheduling is split across background, StateManager, content bridge, tab-view, and IO-manager owners/);
  assert.match(source, /background auto-backup scheduling still needs trigger policies/);
  assert.match(source, /sender policies/);
  assert.match(source, /delay-clamp reports/);
  assert.match(source, /timer lifecycle reports/);
  assert.match(source, /post-block wait budgets/);
  assert.match(source, /encryption skip reports/);
  assert.match(source, /download\/rotation reports/);
  assert.match(source, /split-owner reports/);
  assert.match(source, /`backgroundAutoBackupSchedulerContract`, `backgroundAutoBackupTriggerPolicy`, `backgroundAutoBackupSenderPolicy`, `backgroundAutoBackupDelayClampReport`, `backgroundAutoBackupTimerLifecycleReport`, `backgroundAutoBackupPostEnrichmentWaitBudget`, `backgroundAutoBackupEncryptionSkipReport`, `backgroundAutoBackupDownloadRotationReport`, `backgroundAutoBackupSplitOwnerReport`, or `backgroundAutoBackupMetricArtifact`/);
});

test('active goal completion audit records native overlay fullscreen quiet mode boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Native overlay\/fullscreen quiet mode boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_NATIVE_OVERLAY_FULLSCREEN_QUIET_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/native-overlay-fullscreen-quiet-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct native-overlay\/fullscreen quiet mode proof/);
  assert.match(source, /7 quiet-mode source files/);
  assert.match(source, /5 source\/effect blocks/);
  assert.match(source, /11 content_bridge native quiet predicate block lines/);
  assert.match(source, /468 predicate block bytes/);
  assert.match(source, /342 initializeDOMFallback quiet cluster block lines/);
  assert.match(source, /16323 initialize cluster bytes/);
  assert.match(source, /630 fallback menu quiet cluster block lines/);
  assert.match(source, /25685 fallback cluster bytes/);
  assert.match(source, /11 quick-block enabled predicate block lines/);
  assert.match(source, /298 quick predicate bytes/);
  assert.match(source, /225 quick-block lifecycle setup block lines/);
  assert.match(source, /9085 quick setup bytes/);
  assert.match(source, /selected content_bridge quiet\/lifecycle counts/);
  assert.match(source, /selected block_channel quiet\/lifecycle counts/);
  assert.match(source, /selected non-content-bridge zero quiet-token owner counts/);
  assert.match(source, /7 runtime native overlay\/fullscreen quiet mode fixtures/);
  assert.match(source, /`isFilterTubeNativeOverlayQuietMode\(\)` recognizes two native window flags and two document attributes/);
  assert.match(source, /content-bridge DOM fallback, pending whitelist refresh, fallback menu scans, and fallback menu warmups use local quiet checks after installation/);
  assert.match(source, /quick-block lifecycle setup installs styles and page-level listeners before action-level `isQuickBlockEnabled\(\)` checks/);
  assert.match(source, /quick-block action state uses `showQuickBlockButton === true` and `listMode !== 'whitelist'`/);
  assert.match(source, /DOM fallback, seed, bridge settings, first-run prompt, and release-notes prompt do not consume the native quiet predicate or native quiet attributes/);
  assert.match(source, /fixed prompt overlays can still render after runtime\/background checks without local fullscreen\/native-overlay suppression/);
  assert.match(source, /native-overlay\/fullscreen quiet mode still needs shared decision contracts/);
  assert.match(source, /per-owner consumer reports/);
  assert.match(source, /fullscreen non-player pause contracts/);
  assert.match(source, /quick-block pause reports/);
  assert.match(source, /DOM fallback pause reports/);
  assert.match(source, /seed no-work budgets/);
  assert.match(source, /prompt overlay policies/);
  assert.match(source, /timer\/listener\/observer pause budgets/);
  assert.match(source, /`nativeOverlayQuietModeContract`, `nativeOverlayQuietModeConsumerReport`, `fullscreenNonPlayerPauseContract`, `fullscreenNativeOverlayPauseAuthority`, `nonPlayerRuntimePauseReport`, `quickBlockNativeOverlayPauseReport`, `domFallbackFullscreenPauseReport`, `seedFullscreenNoWorkBudget`, `promptOverlayFullscreenPolicy`, or `nativeOverlayMetricArtifact`/);
});

test('active goal completion audit records background identity fetch network budget boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Background identity fetch network budget boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_BACKGROUND_IDENTITY_FETCH_NETWORK_BUDGET_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/background-identity-fetch-network-budget-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct background identity fetch network-budget proof/);
  assert.match(source, /4 identity-fetch source files/);
  assert.match(source, /13 source\/effect blocks/);
  assert.match(source, /42 handleFetchShortsIdentityMessage block lines/);
  assert.match(source, /1658 shorts message bytes/);
  assert.match(source, /28 handleFetchWatchIdentityMessage block lines/);
  assert.match(source, /1054 watch message bytes/);
  assert.match(source, /67 performShortsIdentityFetch block lines/);
  assert.match(source, /2543 shorts fetch bytes/);
  assert.match(source, /94 performKidsWatchIdentityFetch block lines/);
  assert.match(source, /3605 Kids fetch bytes/);
  assert.match(source, /93 performWatchIdentityFetch block lines/);
  assert.match(source, /3584 watch fetch bytes/);
  assert.match(source, /7 fetchShorts\/fetchWatch action branch lines/);
  assert.match(source, /272 action branch bytes/);
  assert.match(source, /12 fetchChannelDetails branch lines/);
  assert.match(source, /607 detail branch bytes/);
  assert.match(source, /744 fetchChannelInfo block lines/);
  assert.match(source, /32110 channel-info bytes/);
  assert.match(source, /content bridge watch\/Shorts\/direct fallback caller blocks/);
  assert.match(source, /handle_resolver fetchIdForHandle block/);
  assert.match(source, /DOM fallback unresolved-handle escalation block/);
  assert.match(source, /selected cache\/pending\/fetch\/credential\/direct-fallback\/escalation token counts/);
  assert.match(source, /selected zero policy token counts/);
  assert.match(source, /8 runtime background identity fetch network budget fixtures/);
  assert.match(source, /background Shorts\/watch identity actions validate video ids and use caches\/pending maps/);
  assert.match(source, /credentialed HTML fetches with `AbortController`, timers, stream-preview reads, and partial limits/);
  assert.match(source, /`fetchShortsIdentity`, `fetchWatchIdentity`, and `fetchChannelDetails` branches lack local sender\/reason\/route\/tab\/active-rule\/fetch-budget policy/);
  assert.match(source, /`fetchChannelInfo\(\)` can perform credentialed channel HTML fetches/);
  assert.match(source, /direct same-origin Shorts fallback only when `allowDirectFetch` reaches that path/);
  assert.match(source, /`fetchIdForHandle\(\)` can send `fetchChannelDetails`, post learned-map updates, and rerun DOM fallback/);
  assert.match(source, /`skipNetwork` does not mean no background network work/);
  assert.match(source, /background identity fetches still need sender policies/);
  assert.match(source, /reason reports/);
  assert.match(source, /route\/profile reports/);
  assert.match(source, /credential policies/);
  assert.match(source, /cache-budget reports/);
  assert.match(source, /active-rule gates/);
  assert.match(source, /direct fallback policies/);
  assert.match(source, /DOM escalation reports/);
  assert.match(source, /`backgroundIdentityFetchNetworkBudgetContract`, `backgroundIdentityFetchSenderPolicy`, `backgroundIdentityFetchReasonReport`, `backgroundIdentityFetchRouteProfileReport`, `backgroundIdentityFetchCredentialPolicy`, `backgroundIdentityFetchCacheBudgetReport`, `backgroundIdentityFetchActiveRuleGate`, `backgroundIdentityFetchDirectFallbackPolicy`, `backgroundIdentityFetchDomEscalationReport`, or `backgroundIdentityFetchMetricArtifact`/);
});

test('active goal completion audit records content direct identity fallback boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content direct identity fallback side-effect boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_DIRECT_IDENTITY_FALLBACK_SIDE_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/content-direct-identity-fallback-side-effect-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct content page-context fallback side-effect proof/);
  assert.match(source, /3 content direct identity fallback source files/);
  assert.match(source, /8 source\/effect blocks/);
  assert.match(source, /14 handle resolver rerun timer block lines/);
  assert.match(source, /429 rerun timer bytes/);
  assert.match(source, /134 handle resolver fetchIdForHandle block lines/);
  assert.match(source, /4787 fetchIdForHandle bytes/);
  assert.match(source, /45 handle resolver direct handle branch lines/);
  assert.match(source, /1310 direct handle bytes/);
  assert.match(source, /69 content bridge Shorts wrapper block lines/);
  assert.match(source, /2661 Shorts wrapper bytes/);
  assert.match(source, /124 content bridge Shorts direct fetch block lines/);
  assert.match(source, /6367 Shorts direct bytes/);
  assert.match(source, /44 content bridge watch fetch head block lines/);
  assert.match(source, /1789 watch fetch head bytes/);
  assert.match(source, /136 clicked-target direct fallback cluster lines/);
  assert.match(source, /7498 clicked-target cluster bytes/);
  assert.match(source, /50 DOM fallback background-only escalation block lines/);
  assert.match(source, /3656 DOM escalation bytes/);
  assert.match(source, /selected fetch\/same-origin\/allowDirectFetch\/skipNetwork\/backgroundOnly\/pending-map token counts/);
  assert.match(source, /8 runtime content direct identity fallback fixtures/);
  assert.match(source, /direct handle fallback can fetch/);
  assert.match(source, /same-origin credentials after cache and skipNetwork gates/);
  assert.match(source, /background-only handle repair can send `fetchChannelDetails`, post `FilterTube_UpdateChannelMap`, and schedule a DOM fallback rerun/);
  assert.match(source, /Shorts wrapper asks background first and calls direct Shorts fetch only when `allowDirectFetch` is true/);
  assert.match(source, /direct watch fetch skips Kids hosts and uses `pendingWatchFetches` before same-origin/);
  assert.match(source, /clicked-target fallback tries background watch before legacy direct watch/);
  assert.match(source, /post-action Shorts fanout keeps `allowDirectFetch` false/);
  assert.match(source, /DOM unresolved-handle repair uses `skipNetwork` plus `backgroundOnly` rather than page-context direct fetch/);
  assert.match(source, /content direct identity fallback still needs fetch policies/);
  assert.match(source, /user-action reports/);
  assert.match(source, /credential policies/);
  assert.match(source, /DOM repair budgets/);
  assert.match(source, /direct-fetch gates/);
  assert.match(source, /map-write reports/);
  assert.match(source, /rerun budgets/);
  assert.match(source, /fixture provenance/);
  assert.match(source, /`contentDirectIdentityFallbackContract`, `contentDirectIdentityFetchPolicy`, `contentDirectIdentityUserActionReport`, `contentDirectIdentityCredentialPolicy`, `contentDirectIdentityDomRepairBudget`, `contentDirectIdentityDirectFetchGate`, `contentDirectIdentityMapWriteReport`, `contentDirectIdentityRerunBudget`, `contentDirectIdentityFallbackFixtureProvenance`, or `contentDirectIdentityMetricArtifact`/);
});

test('active goal completion audit records settings refresh cross-context consumer boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Settings refresh cross-context consumer boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SETTINGS_REFRESH_CROSS_CONTEXT_CONSUMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/settings-refresh-cross-context-consumer-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct cross-context settings consumer side-effect proof/);
  assert.match(source, /7 settings refresh cross-context consumer source files/);
  assert.match(source, /13 source\/effect blocks/);
  assert.match(source, /28 background ApplySettings branch lines/);
  assert.match(source, /1487 background ApplySettings bytes/);
  assert.match(source, /41 background storage invalidation lines/);
  assert.match(source, /1464 background storage invalidation bytes/);
  assert.match(source, /121 bridge runtime listener lines/);
  assert.match(source, /5684 bridge runtime listener bytes/);
  assert.match(source, /115 bridge request settings lines/);
  assert.match(source, /5333 bridge request settings bytes/);
  assert.match(source, /51 bridge seed delivery lines/);
  assert.match(source, /1335 bridge seed delivery bytes/);
  assert.match(source, /92 bridge storage refresh lines/);
  assert.match(source, /3395 bridge storage refresh bytes/);
  assert.match(source, /11 content bridge page refresh lines/);
  assert.match(source, /538 page refresh bytes/);
  assert.match(source, /23 injector settings receiver lines/);
  assert.match(source, /871 receiver bytes/);
  assert.match(source, /21 injector seed update lines/);
  assert.match(source, /1003 seed update bytes/);
  assert.match(source, /60 injector process queue lines/);
  assert.match(source, /2108 process queue bytes/);
  assert.match(source, /98 seed updateSettings lines/);
  assert.match(source, /4640 seed updateSettings bytes/);
  assert.match(source, /63 DOM fallback apply-head lines/);
  assert.match(source, /2188 DOM fallback apply-head bytes/);
  assert.match(source, /34 filter logic processData lines/);
  assert.match(source, /1247 filter logic processData bytes/);
  assert.match(source, /selected settings refresh token counts/);
  assert.match(source, /selected zero policy token counts/);
  assert.match(source, /5 runtime settings refresh cross-context consumer fixtures/);
  assert.match(source, /3 settings refresh executable continuation rows/);
  assert.match(source, /background `FilterTube_ApplySettings` can replace compiled cache and push caller settings to matching tabs/);
  assert.match(source, /background storage invalidation nulls both profile caches and recompiles without broadcasting/);
  assert.match(source, /bridge `FilterTube_RefreshNow`, pushed settings, profile-mismatch pulls, and storage refresh can all deliver settings and force DOM fallback/);
  assert.match(source, /bridge seed delivery posts `FilterTube_SettingsToInjector`, calls or retries `window\.filterTube\.updateSettings`, and stores pending seed settings/);
  assert.match(source, /same-window page refresh can pull settings and force DOM fallback/);
  assert.match(source, /injector merges settings, updates seed, drains initial-data queue, and can call `FilterTubeEngine\.processData`/);
  assert.match(source, /settings refresh executable continuation pins off-window\/self-source settings messages as no-ops, no-work settings as queue-clearing without engine calls, and active settings as queued engine replay/);
  assert.match(source, /seed updateSettings can process pending data and reprocess stored `ytInitialData`\/`ytInitialPlayerResponse`/);
  assert.match(source, /DOM fallback serializes overlapping runs and can clear stale visibility/);
  assert.match(source, /filter logic harvests before disabled-check filtering/);
  assert.match(source, /settings refresh cross-context consumers still need consumer contracts/);
  assert.match(source, /revision policies/);
  assert.match(source, /dirty-key reports/);
  assert.match(source, /DOM fallback budgets/);
  assert.match(source, /seed replay budgets/);
  assert.match(source, /main-world capability gates/);
  assert.match(source, /profile scope reports/);
  assert.match(source, /no-op refresh decisions/);
  assert.match(source, /`settingsRefreshCrossContextConsumerContract`, `settingsRefreshCrossContextConsumerReport`, `settingsRefreshRevisionPolicy`, `settingsRefreshDirtyKeyReport`, `settingsRefreshDomFallbackBudget`, `settingsRefreshSeedReplayBudget`, `settingsRefreshMainWorldCapabilityGate`, `settingsRefreshProfileScopeReport`, `settingsRefreshNoOpDecisionReport`, or `settingsRefreshMetricArtifact`/);
  assert.match(source, /2026-05-30 settings refresh evidence packet contract continuation/);
  assert.match(source, /docs\/audit\/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_CANDIDATE_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-29\.md/);
  assert.match(source, /tests\/runtime\/settings-refresh-optimization-candidate-evidence-packet-contract-current-behavior\.test\.mjs/);
  assert.match(source, /settings refresh candidate evidence packet rows: 12/);
  assert.match(source, /settings refresh candidate binding rows covered: 12/);
  assert.match(source, /settings refresh readiness rows covered: 12/);
  assert.match(source, /first optimization evidence packet rows referenced: 10/);
  assert.match(source, /required settings refresh packet fields: 29/);
  assert.match(source, /implementation-ready settings refresh evidence packets: 0/);
  assert.match(source, /runtime settings refresh evidence packet approvals: 0/);
  assert.match(source, /settings refresh evidence packet approval: NO-GO/);
  assert.match(source, /settings refresh evidence chain closure: CHAIN-CLOSED/);
  assert.match(source, /settings refresh implementation readiness from chain closure: NO-GO/);
  assert.match(source, /`producerPath`, `consumerPath`, `changedKeys`, `forceReprocessPolicy`, `mapOnlyStaleProof`, `seedReplayBudget`, `lifecycleBudget`, `importSyncRollbackProof`, `noOpDecision`, `metricArtifact`, `sideEffectBudget`, `parityReport`, `diagnosticPrivacyClass`, and `rolloutClaimBoundary`/);
  assert.match(source, /whitelist optimization, JSON-first promotion, release\/public-claim use, and runtime behavior changes at `NO-GO`/);
  assert.match(source, /2026-05-30 settings refresh\/cache current-source rerun/);
  assert.match(source, /passed 76\/76 tests/);
  assert.match(source, /`js\/content\/bridge_settings\.js:223` for `FilterTube_RefreshNow`/);
  assert.match(source, /`js\/content\/bridge_settings\.js:283` for pushed `FilterTube_ApplySettings`/);
  assert.match(source, /`js\/content\/bridge_settings\.js:557` for storage refresh scheduling/);
  assert.match(source, /`js\/content\/bridge_settings\.js:572` for the pending force-reprocess upgrade bit/);
  assert.match(source, /`js\/content\/bridge_settings\.js:645` for map-only refresh demotion/);
  assert.match(source, /`js\/background\.js:1774` and `js\/background\.js:1779` for compiled settings cache admission/);
  assert.match(source, /`js\/background\.js:3249` for getCompiledSettings message cache admission/);
  assert.match(source, /`js\/background\.js:4395` and `js\/background\.js:4410` for UI-pushed settings invalidation\/recompile\/broadcast/);
  assert.match(source, /`js\/state_manager\.js:1231` for direct settings broadcast/);
  assert.match(source, /`js\/state_manager\.js:1246` for explicit forced refresh requests/);
  assert.match(source, /pending map-only storage refresh is upgraded when a keyword\/profile change arrives before the timer fires/);
  assert.match(source, /pending map-only storage refresh stays non-forcing when no rule-changing key arrives/);
  assert.match(source, /bridge settings source carries an explicit pending force-reprocess upgrade bit/);
  assert.match(source, /background compiled cache current cache gate behavior is pinned/);
  assert.match(source, /StateManager direct compiled broadcast and background refresh rebound remain pinned/);
  assert.match(source, /seed replay provenance remains bounded by current settings active-work\/no-work gates/);
  assert.match(source, /cross-context consumers still force DOM fallback on correctness-critical refresh paths/);
  assert.match(source, /settings refresh candidate evidence packet rows remain `NO-GO` for implementation/);
  assert.match(source, /Runtime behavior changed by this rerun: no/);
  assert.match(source, /Live visible-tab stale-card parity, metric artifacts, forced-refresh pruning approval, map-only pruning approval, seed replay pruning approval, import\/sync rollback proof, whitelist optimization, JSON-first promotion, release\/public-claim use, and `update_goal\(status='complete'\)` remain `NO-GO`/);
});

test('active goal completion audit records compiled settings profile list-mode assembly boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Compiled settings profile\/list-mode assembly boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_COMPILED_SETTINGS_PROFILE_LIST_MODE_ASSEMBLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/compiled-settings-profile-list-mode-assembly-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct compiled settings profile\/list-mode assembly proof/);
  assert.match(source, /3 compiled settings profile\/list-mode assembly source files/);
  assert.match(source, /6 source\/effect blocks/);
  assert.match(source, /55 background profile\/list-mode whitelist lines/);
  assert.match(source, /3428 background profile\/list-mode whitelist bytes/);
  assert.match(source, /65 background whitelist channel compiler lines/);
  assert.match(source, /3878 whitelist channel compiler bytes/);
  assert.match(source, /31 bridge host normalization lines/);
  assert.match(source, /1404 bridge host normalization bytes/);
  assert.match(source, /36 bridge request profile gate lines/);
  assert.match(source, /1758 request profile gate bytes/);
  assert.match(source, /125 filter process settings lines/);
  assert.match(source, /6348 filter process settings bytes/);
  assert.match(source, /145 filter list-mode identity admission lines/);
  assert.match(source, /7062 identity admission bytes/);
  assert.match(source, /selected compiled settings profile\/list-mode token counts/);
  assert.match(source, /selected zero policy token counts/);
  assert.match(source, /6 runtime compiled settings profile\/list-mode fixtures/);
  assert.match(source, /background assigns `compiledSettings\.listMode` and `compiledSettings\.profileType`/);
  assert.match(source, /background can merge Kids whitelist keyword\/channel rows into main under synced whitelist mode and tags synced Kids channels with `__ftFromKids`/);
  assert.match(source, /background compiles whitelist channels with identity, source, collaboration, and dedupe fields/);
  assert.match(source, /bridge normalization changes a main-profile empty whitelist on Kids hosts to blocklist/);
  assert.match(source, /bridge request profile gating retries mismatched compiled settings with `forceRefresh: true`/);
  assert.match(source, /filter logic rebuilds serialized whitelist keyword regexes, lowercases whitelist channel identity fields, preserves object video meta maps, and requires whitelist channel identity only in exact whitelist mode/);
  assert.match(source, /2026-05-30 blocklist\/whitelist invariant current-source rerun/);
  assert.match(source, /passed 45\/45 tests/);
  assert.match(source, /`js\/background\.js:1984` for profile mode derivation/);
  assert.match(source, /`js\/background\.js:2011` for whitelist keyword compilation/);
  assert.match(source, /`js\/background\.js:2062` for canonical Main blocklist keywords winning over\s+`blockedKeywords`/);
  assert.match(source, /`js\/background\.js:2212` for whitelist channel compilation/);
  assert.match(source, /`js\/filter_logic\.js:1846` for runtime list-mode selection/);
  assert.match(source, /`js\/filter_logic\.js:1933` for JSON whitelist fail-close on non-comment\s+renderers/);
  assert.match(source, /`js\/filter_logic\.js:2059` for blocklist keyword iteration/);
  assert.match(source, /`js\/content\/dom_fallback\.js:1938` for DOM fallback active-work admission in\s+whitelist mode/);
  assert.match(source, /`js\/content\/dom_fallback\.js:4596` for DOM whitelist\s+fail-close outside comment context/);
  assert.match(source, /`js\/content\/dom_fallback\.js:4699` for the\s+DOM whitelist no-match decision/);
  assert.match(source, /`js\/seed\.js:234` plus `js\/seed\.js:236` for\s+network JSON active-work admission in whitelist mode/);
  assert.match(source, /visible Main keyword rows are compiled before stale\s+aliases/);
  assert.match(source, /empty blocklist preserves while empty whitelist fail-closes normal\s+video JSON/);
  assert.match(source, /blocklist and whitelist rows do not override the active list mode/);
  assert.match(source, /comments bypass empty whitelist fail-close while retaining comment keyword\s+blocking/);
  assert.match(source, /whitelist keyword allows can preserve identityless JSON while misses\s+fail closed/);
  assert.match(source, /compiled profile\/list-mode assembly still supplies the\s+runtime mode and whitelist identities consumed by filter logic/);
  assert.match(source, /Runtime\s+behavior changed by this rerun: no/);
  assert.match(source, /Live YouTube visible-tab parity, installed\s+extension reload proof, route\/surface blocklist and whitelist screenshots,\s+DOM\/JSON parity across every renderer, stale-cache cleanup, metric artifacts,\s+whitelist optimization, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /compiled settings profile\/list-mode assembly still needs compiler contracts/);
  assert.match(source, /profile scope policies/);
  assert.match(source, /revision policies/);
  assert.match(source, /whitelist assembly reports/);
  assert.match(source, /Kids empty-whitelist policies/);
  assert.match(source, /bridge normalization reports/);
  assert.match(source, /filter consumer parity/);
  assert.match(source, /fixture provenance/);
  assert.match(source, /`compiledSettingsProfileListModeContract`, `compiledSettingsProfileListModeReport`, `compiledSettingsListModeProfileScopePolicy`, `compiledSettingsWhitelistAssemblyReport`, `compiledSettingsKidsEmptyWhitelistPolicy`, `compiledSettingsBridgeNormalizationReport`, `compiledSettingsFilterLogicConsumerParity`, `compiledSettingsProfileListModeFixtureProvenance`, `compiledSettingsProfileListModeMetricArtifact`, or `compiledSettingsProfileListModeRevisionPolicy`/);
});

test('active goal completion audit records DOM fallback run-state visibility cleanup boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /DOM fallback run-state visibility cleanup boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_DOM_FALLBACK_RUN_STATE_VISIBILITY_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/dom-fallback-run-state-visibility-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct fallback run-state\/cleanup proof/);
  assert.match(source, /2 DOM fallback run-state visibility cleanup source files/);
  assert.match(source, /10 source\/effect blocks/);
  assert.match(source, /84 helper toggleVisibility lines/);
  assert.match(source, /3286 helper toggleVisibility bytes/);
  assert.match(source, /53 helper container visibility lines/);
  assert.match(source, /2177 helper container visibility bytes/);
  assert.match(source, /58 explicit hidden detection lines/);
  assert.match(source, /2864 explicit hidden bytes/);
  assert.match(source, /68 active-work decision lines/);
  assert.match(source, /2333 active-work bytes/);
  assert.match(source, /33 stale cleanup lines/);
  assert.match(source, /1412 stale cleanup bytes/);
  assert.match(source, /63 apply run-head lines/);
  assert.match(source, /2188 run-head bytes/);
  assert.match(source, /71 scroll\/watch cleanup lines/);
  assert.match(source, /3055 scroll\/watch cleanup bytes/);
  assert.match(source, /21 disabled cleanup lines/);
  assert.match(source, /959 disabled cleanup bytes/);
  assert.match(source, /22 scroll restore lines/);
  assert.match(source, /893 scroll restore bytes/);
  assert.match(source, /11 finally lines/);
  assert.match(source, /342 finally bytes/);
  assert.match(source, /selected DOM fallback run-state visibility token counts/);
  assert.match(source, /selected zero policy token counts/);
  assert.match(source, /6 runtime DOM fallback run-state visibility cleanup fixtures/);
  assert.match(source, /`toggleVisibility\(\)` hides and restores the current class\/attribute\/inline-display markers/);
  assert.match(source, /recycled hidden rows without explicit reason markers are restored when live and processed video ids diverge/);
  assert.match(source, /disabled\/empty blocklist is no-work, exact whitelist and active lists\/toggles\/filters are work/);
  assert.match(source, /stale cleanup restores hidden\/pending nodes and clears content-control CSS/);
  assert.match(source, /`applyDOMFallback\(\)` serializes overlapping runs with `window\.__filtertubeDomFallbackRunState` and schedules a pending rerun from `finally`/);
  assert.match(source, /scroll restoration uses one scroll listener plus a recent-user-scroll gate/);
  assert.match(source, /codebase inspection is finding optimization locations and first-class JSON filter blockers/);
  assert.match(source, /DOM fallback run-state visibility cleanup still needs run-state contracts/);
  assert.match(source, /stale marker cleanup policies/);
  assert.match(source, /scroll budgets/);
  assert.match(source, /active-work decision reports/);
  assert.match(source, /visibility ownership reports/);
  assert.match(source, /selector budgets/);
  assert.match(source, /`domFallbackRunStateVisibilityCleanupContract`, `domFallbackRunStateReport`, `domFallbackStaleVisibilityCleanupPolicy`, `domFallbackScrollRestoreBudget`, `domFallbackPendingRerunBudget`, `domFallbackActiveWorkDecisionReport`, `domFallbackVisibilityOwnershipReport`, `domFallbackCleanupFixtureProvenance`, `domFallbackSelectorBudgetReport`, or `domFallbackMetricArtifact`/);
});

test('active goal completion audit records content bridge whitelist pending refresh boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content bridge whitelist pending refresh boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_WHITELIST_PENDING_REFRESH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/content-bridge-whitelist-pending-refresh-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct whitelist-pending refresh proof/);
  assert.match(source, /2 content bridge whitelist pending refresh source files/);
  assert.match(source, /9 source\/effect blocks/);
  assert.match(source, /75 right-rail observer lines/);
  assert.match(source, /2413 right-rail observer bytes/);
  assert.match(source, /60 fallback throttle lines/);
  assert.match(source, /2297 fallback throttle bytes/);
  assert.match(source, /69 whitelist pending queue lines/);
  assert.match(source, /3668 queue bytes/);
  assert.match(source, /111 whitelist pending apply lines/);
  assert.match(source, /5760 apply bytes/);
  assert.match(source, /93 fallback mutation observer lines/);
  assert.match(source, /4015 mutation observer bytes/);
  assert.match(source, /12 DOM fallback pending selector lines/);
  assert.match(source, /468 selector bytes/);
  assert.match(source, /54 pending state-reset lines/);
  assert.match(source, /3079 state-reset bytes/);
  assert.match(source, /16 pending identity-hide lines/);
  assert.match(source, /960 identity-hide bytes/);
  assert.match(source, /4 focused-return lines/);
  assert.match(source, /83 focused-return bytes/);
  assert.match(source, /selected whitelist pending refresh token counts/);
  assert.match(source, /selected zero policy token counts/);
  assert.match(source, /9 runtime content bridge whitelist pending refresh fixtures/);
  assert.match(source, /pending recheck coalesces to one timer and calls DOM fallback with `preserveScroll: true` plus `onlyWhitelistPending: true`/);
  assert.match(source, /pending hide applies temporary hidden and whitelist-pending markers outside excluded routes/);
  assert.match(source, /pending hide skips blocklist, home\/search\/feed-channels\/watch routes, selected playlist rows, processed, already pending, and already hidden nodes/);
  assert.match(source, /collects direct and nested card candidates from added mutations, ignores script\/style\/link\/svg\/path nodes, dedupes object references, caps candidates at 160/);
  assert.match(source, /fallback mutation observation queues pending hide for added-node batches and schedules immediate fallback only for relevant content/);
  assert.match(source, /DOM fallback narrows focused whitelist-pending rechecks, clears processed state, and returns before later broad passes/);
  assert.match(source, /content bridge whitelist pending refresh still needs refresh contracts/);
  assert.match(source, /queue budgets/);
  assert.match(source, /placeholder policies/);
  assert.match(source, /observer\/timer owner reports/);
  assert.match(source, /route exclusion policies/);
  assert.match(source, /focused-rerun parity/);
  assert.match(source, /`contentBridgeWhitelistPendingRefreshContract`, `contentBridgeWhitelistPendingRefreshReport`, `whitelistPendingHideQueueBudget`, `whitelistPendingPlaceholderPolicy`, `whitelistPendingObserverOwnerReport`, `whitelistPendingRouteExclusionPolicy`, `whitelistPendingRerunBudgetReport`, `whitelistPendingDomFallbackConsumerParity`, `whitelistPendingFixtureProvenance`, or `whitelistPendingMetricArtifact`/);
  assert.match(source, /Whitelist Pending Intake No-Work Contract Addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_WHITELIST_PENDING_INTAKE_NO_WORK_CONTRACT_CURRENT_BEHAVIOR_2026-05-25\.md/);
  assert.match(source, /tests\/runtime\/whitelist-pending-intake-no-work-contract-current-behavior\.test\.mjs/);
  assert.match(source, /12\s+whitelist pending\s+intake no-work contract rows/);
  assert.match(source, /10 release whitelist-pending\s+intake gate rows\s+covered/);
  assert.match(source, /9 runtime content bridge whitelist pending refresh\s+fixtures covered/);
  assert.match(source, /narrow implementation-ready whitelist pending intake rows: 1/);
  assert.match(source, /runtime whitelist\s+pending intake authority symbols: 0/);
  assert.match(source, /runtime\s+whitelist pending intake patch now: GO/);
  assert.match(source, /runtime whitelist optimization\s+patch now: NO-GO/);
  assert.match(source, /Whitelist Pending Intake Implementation Readiness Gate Addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_WHITELIST_PENDING_INTAKE_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-25\.md/);
  assert.match(source, /14 whitelist pending intake implementation readiness rows/);
  assert.match(source, /8 source\s+inputs covered/);
  assert.match(source, /10 required future no-work fixture names covered/);
  assert.match(source, /0 implemented runtime authority symbols/);
  assert.match(source, /release patch approval: NO-GO/);
  assert.match(source, /prepare narrow whitelist\s+pending-intake implementation patch: GO/);
  assert.match(source, /runtime whitelist pending intake\s+patch in this audit slice: GO/);
  assert.match(source, /Whitelist Pending Intake Patch Source Locus Boundary Addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_WHITELIST_PENDING_INTAKE_PATCH_SOURCE_LOCUS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25\.md/);
  assert.match(source, /12\s+whitelist pending intake patch source-locus rows/);
  assert.match(source, /1 allowed runtime source file\s+family/);
  assert.match(source, /`js\/content_bridge\.js` as the only allowed runtime file/);
  assert.match(source, /4 read-only\s+parity runtime source loci/);
  assert.match(source, /8 forbidden runtime source families/);
  assert.match(source, /narrow semantic-change approval rows: 1/);
  assert.match(source, /patch source locus approval: GO/);
});

test('active goal completion audit records whitelist optimization readiness current-source rerun without declaring completion', () => {
  const source = doc();

  assert.match(source, /Whitelist optimization readiness gap matrix addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_WHITELIST_OPTIMIZATION_READINESS_GAP_MATRIX_CURRENT_BEHAVIOR_2026-05-24\.md/);
  assert.match(source, /tests\/runtime\/whitelist-optimization-readiness-gap-matrix-current-behavior\.test\.mjs/);
  assert.match(source, /10 implementation-blocking whitelist gaps/);
  assert.match(source, /empty whitelist policy, unresolved identity policy, list-mode conflict policy, transition mutation policy, import dormant-mode policy, pending-hide lifecycle policy, watch right-rail policy, JSON\/DOM selected-row parity, surface parity, and metric\/entry gate/);
  assert.match(source, /whitelist optimization still has 0 implementation-ready rows/);
  assert.match(source, /2026-05-30 whitelist optimization readiness current-source rerun/);
  assert.match(source, /passed 97\/97 tests/);
  assert.match(source, /`js\/filter_logic\.js:1933` for whitelist JSON fail-close/);
  assert.match(source, /`js\/filter_logic\.js:1961` for `block:no_whitelist_rules`/);
  assert.match(source, /`js\/filter_logic\.js:1973` for `allow:matched_channel`/);
  assert.match(source, /`js\/filter_logic\.js:1990` for `allow:matched_keyword`/);
  assert.match(source, /`js\/filter_logic\.js:2007` for `allow:creator_page_whitelisted`/);
  assert.match(source, /`js\/filter_logic\.js:2018` for `block:unresolved_identity`/);
  assert.match(source, /`js\/content_bridge\.js:1217` for the right-rail whitelist observer/);
  assert.match(source, /`js\/content_bridge\.js:1228` and `js\/content_bridge\.js:1237` for the current watch-route skip/);
  assert.match(source, /`js\/content_bridge\.js:6148` and `js\/content_bridge\.js:6153` for pending-hide queue state and cap/);
  assert.match(source, /`js\/content_bridge\.js:6163` for focused `onlyWhitelistPending` DOM fallback recheck/);
  assert.match(source, /`js\/content_bridge\.js:6177` and `js\/content_bridge\.js:6224` for pending-hide route exclusions/);
  assert.match(source, /`js\/content\/dom_fallback\.js:2073` and `js\/content\/dom_fallback\.js:2076` for focused pending-only admission/);
  assert.match(source, /`js\/content\/dom_fallback\.js:3947` for focused pending-only early return/);
  assert.match(source, /`js\/background\.js:3304` and `js\/background\.js:3452` for list-mode transition mutation behavior/);
  assert.match(source, /`js\/background\.js:3545` plus `js\/state_manager\.js:1809` for batch whitelist import persistence/);
  assert.match(source, /whitelist readiness is still blocked by empty-whitelist policy, unresolved-identity policy, list-mode conflict policy, transition mutation policy, dormant import mode, pending-hide lifecycle policy, watch\/right-rail ownership, JSON\/DOM selected-row parity, route\/surface parity, and missing metric\/entry evidence/);
  assert.match(source, /Runtime behavior changed by this rerun: no/);
  assert.match(source, /Broad whitelist optimization, JSON-first promotion, release\/public-claim use, installed visible-tab parity, route\/surface metric artifacts, first optimization implementation approval, and `update_goal\(status='complete'\)` remain `NO-GO`/);
});

test('active goal completion audit records whitelist cache SPA packet rerun without declaring completion', () => {
  const source = doc();

  assert.match(source, /Whitelist Cache SPA Metric Packet Gate Continuation/);
  assert.match(source, /2026-05-30 whitelist\/cache SPA metric packet gate current-source rerun/);
  assert.match(source, /passed 35\/35 tests/);
  assert.match(source, /node --test --test-reporter=spec tests\/runtime\/whitelist-cache-spa-metric-packet-gate-current-behavior\.test\.mjs tests\/runtime\/whitelist-cache-hot-path-boundary-current-behavior\.test\.mjs tests\/runtime\/release-live-youtube-spa-smoke-boundary-current-behavior\.test\.mjs tests\/runtime\/json-first-route-surface-metric-artifact-contract-coverage-gate-current-behavior\.test\.mjs tests\/runtime\/json-first-route-surface-metric-artifact-approval-boundary-current-behavior\.test\.mjs tests\/runtime\/json-first-implementation-authority-boundary-current-behavior\.test\.mjs tests\/runtime\/optimization-stop-go-decision-record-current-behavior\.test\.mjs/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_WHITELIST_CACHE_SPA_METRIC_PACKET_GATE_CURRENT_BEHAVIOR_2026-05-29\.md`\s+for the 12-row release packet gate/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_WHITELIST_CACHE_HOT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25\.md`\s+for the remaining whitelist\/cache hot-path boundary/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_RELEASE_LIVE_YOUTUBE_SPA_SMOKE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25\.md`\s+and `docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/template\.json`\s+for the non-executed live SPA smoke boundary/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24\.md`\s+for the five reserved route\/surface metric artifact contracts/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24\.md`\s+for 0 runtime route\/surface metric artifact approvals/);
  assert.match(source, /whitelist\/cache SPA release packet is defined, but\s+no executed live smoke artifact, installed visible-tab byte parity trace,\s+route\/surface metric artifact, runtime metric collector approval,\s+whitelist\/cache optimization approval, JSON-first first-class promotion\s+approval, or release ship decision exists/);
  assert.match(source, /Runtime behavior changed by this\s+rerun: no/);
  assert.match(source, /Live installed-tab route-mode metrics, public performance claims,\s+release\/public-claim use, and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /2026-05-30 connected Chrome profile parity probe continuation/);
  assert.match(source, /read-only connected-Chrome profile probe/);
  assert.match(source, /Chrome profile label `Devansh`/);
  assert.match(source, /gkgjigdfdccckblmglboobikfcpeelio/);
  assert.match(source, /found 0 connected open-tab matches for\s+FilterTube or YouTube/);
  assert.match(source, /opened no new Chrome profile\/window, claimed no tab, and\s+changed no runtime behavior/);
  assert.match(source, /connected Chrome profile parity\s+probe rows: 5/);
  assert.match(source, /connected Chrome profile accepted as installed-byte parity:\s+NO-GO/);
  assert.match(source, /accept connected Chrome profile tab inventory as installed-byte parity\s+now: NO-GO/);
  assert.match(source, /accept missing relevant tabs as active YouTube tab proof now:\s+NO-GO/);
  assert.match(source, /accept user-visible screenshots as content-script byte proof now:\s+NO-GO/);
  assert.match(source, /accept scratch\/private Chrome profile as substitute proof now:\s+NO-GO/);
  assert.match(source, /nonmatching Chrome\s+endpoint, screenshots, or a scratch\/private profile as installed visible-tab\s+byte parity/);
});

test('active goal completion audit records first optimization metric artifact gate rerun without declaring completion', () => {
  const source = doc();

  assert.match(source, /First optimization metric artifact foundation packet addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_FOUNDATION_PACKET_CURRENT_BEHAVIOR_2026-05-24\.md/);
  assert.match(source, /tests\/runtime\/first-optimization-metric-artifact-foundation-packet-current-behavior\.test\.mjs/);
  assert.match(source, /12 foundation packet rows/);
  assert.match(source, /0 committed foundation metric artifacts/);
  assert.match(source, /0 runtime metric collectors approved/);
  assert.match(source, /0 implementation-ready foundation packet rows/);
  assert.match(source, /First optimization artifact commit readiness gate addendum/);
  assert.match(source, /0 committed metric foundation artifact files/);
  assert.match(source, /0 implementation-ready artifact commit rows/);
  assert.match(source, /First optimization source-owner approval boundary addendum/);
  assert.match(source, /0 runtime source-owner approvals/);
  assert.match(source, /First optimization source locus callable anchor boundary addendum/);
  assert.match(source, /9 listener\/observer\/timer surfaces pinned/);
  assert.match(source, /2026-05-30 first optimization metric\/artifact gate current-source rerun/);
  assert.match(source, /passed 156\/156 tests/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_FOUNDATION_PACKET_CURRENT_BEHAVIOR_2026-05-24\.md` for the 12-row foundation packet/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24\.md` for reserved artifact root `docs\/audit\/artifacts\/first-optimization\/metric-foundation\/`/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_FOUNDATION_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24\.md` for the nine artifact contract docs\/tests/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_FIRST_OPTIMIZATION_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24\.md` for artifact commit `NO-GO`/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24\.md` for 0 runtime metric collector approvals/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24\.md` for 0 runtime source-owner approvals/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24\.md` for 0 implementation-ready source-locus implementation rows/);
  assert.match(source, /The nine reserved files `packet-manifest\.json`, `metric-sample\.json`, `source-owner-map\.json`, `fixture-provenance\.json`, `no-work-preservation\.json`, `side-effect-budget\.json`, `diagnostic-privacy\.json`, `parity-rollout\.json`, and `verification-output\.tap` remain absent/);
  assert.match(source, /metric foundation contract chain is defined, but no metric artifact, runtime collector approval, source-owner approval, verification output, rollback approval, unclaimed-surface approval, artifact commit readiness, or first optimization implementation approval exists/);
  assert.match(source, /Runtime behavior changed by this rerun: no/);
  assert.match(source, /JSON-first promotion, whitelist\/cache optimization, release\/public-claim use, native sync claims, runtime collector insertion, artifact commit, and `update_goal\(status='complete'\)` remain `NO-GO`/);
});

test('active goal completion audit records JSON-first route surface fixture and metric rerun without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON-first route\/surface implementation authority boundary addendum/);
  assert.match(source, /JSON-first route\/surface fixture packet contract addendum/);
  assert.match(source, /JSON-first route\/surface fixture artifact contract coverage gate addendum/);
  assert.match(source, /JSON-First Route\/Surface Metric Artifact Approval Boundary Addendum/);
  assert.match(source, /2026-05-30 JSON-first route\/surface fixture and metric gate current-source rerun/);
  assert.match(source, /passed 120\/120 tests/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24\.md`\s+for 0 runtime JSON-first route\/surface approvals/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24\.md`\s+for the five route\/surface fixture artifact contracts/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24\.md`\s+for 0 runtime JSON-first fixture packet approvals/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24\.md`\s+for the five route\/surface metric artifact contracts/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24\.md`\s+for 0 runtime route\/surface metric artifact approvals/);
  assert.match(source, /The five reserved\s+fixture files `manifest\.json`, `fixture-sample\.json`, `provenance\.json`,\s+`parity-report\.json`, and `verification-output\.tap` remain absent under\s+`docs\/audit\/artifacts\/json-first\/route-surface-fixture-packet\/`/);
  assert.match(source, /The five\s+reserved metric files `metric-sample\.json`, `no-work-budget\.json`,\s+`side-effect-budget\.json`, `fixture-provenance\.json`, and\s+`verification-output\.tap` remain absent under\s+`docs\/audit\/artifacts\/json-first\/route-surface-metric-artifact\/`/);
  assert.match(source, /Runtime\s+behavior changed by this rerun: no/);
  assert.match(source, /JSON-first first-class promotion,\s+route\/surface implementation authority, whitelist\/cache optimization, metric\s+artifact approval, fixture packet approval, release\/public-claim use, native\s+sync claims, and `update_goal\(status='complete'\)` remain `NO-GO`/);
});

test('active goal completion audit records first optimization collector approval chain rerun without declaring completion', () => {
  const source = doc();

  assert.match(source, /First optimization metric collector insertion gate addendum/);
  assert.match(source, /First optimization metric collector no-work preservation matrix addendum/);
  assert.match(source, /First optimization metric collector side-effect budget matrix addendum/);
  assert.match(source, /First optimization metric collector fixture provenance matrix addendum/);
  assert.match(source, /First optimization metric collector parity rollout boundary addendum/);
  assert.match(source, /First optimization collector approval authority boundary addendum/);
  assert.match(source, /2026-05-30 first optimization collector approval chain current-source rerun/);
  assert.match(source, /passed 90\/90 tests/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24\.md`\s+for 0 runtime collector insertion points approved/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24\.md`\s+for 0 runtime collector no-work proofs approved/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24\.md`\s+for 0 runtime collector side-effect budgets approved/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24\.md`\s+for 0 runtime collector fixture packets approved/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24\.md`\s+for 0 runtime collector parity rollout proofs approved/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24\.md`\s+for 0 runtime metric collector approvals/);
  assert.match(source, /`docs\/audit\/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_ROLLBACK_UNCLAIMED_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24\.md`\s+for 0 runtime rollback approvals and 0 runtime unclaimed-surface approvals/);
  assert.match(source, /metric collector insertion,\s+collector no-work preservation, collector side-effect budgets, collector\s+fixture provenance, collector diagnostic privacy, collector parity rollout,\s+collector verification output, rollback ownership, unclaimed-surface ownership,\s+runtime source-owner approval, runtime metric collector approval, and\s+implementation-ready collector rows are all still absent/);
  assert.match(source, /Runtime behavior\s+changed by this rerun: no/);
  assert.match(source, /JSON-first promotion, whitelist\/cache optimization,\s+runtime metric collector insertion, artifact commit, release\/public-claim use,\s+native sync claims, and `update_goal\(status='complete'\)` remain `NO-GO`/);
});

test('active goal completion audit records quick-block hover lifecycle timer boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Quick-block hover lifecycle timer boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_QUICK_BLOCK_HOVER_LIFECYCLE_TIMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/quick-block-hover-lifecycle-timer-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct quick-block lifecycle proof/);
  assert.match(source, /1 quick-block hover lifecycle timer source file/);
  assert.match(source, /9 source\/effect blocks/);
  assert.match(source, /8 quick-block globals lines/);
  assert.match(source, /328 globals bytes/);
  assert.match(source, /31 surface predicate lines/);
  assert.match(source, /974 surface predicate bytes/);
  assert.match(source, /15 viewport RAF lines/);
  assert.match(source, /490 viewport RAF bytes/);
  assert.match(source, /64 hover-state lines/);
  assert.match(source, /1961 hover-state bytes/);
  assert.match(source, /34 action fallback lines/);
  assert.match(source, /1448 action fallback bytes/);
  assert.match(source, /14 wrap hover lines/);
  assert.match(source, /888 wrap hover bytes/);
  assert.match(source, /148 ensure-button lines/);
  assert.match(source, /6428 ensure-button bytes/);
  assert.match(source, /41 sweep schedule lines/);
  assert.match(source, /1342 sweep schedule bytes/);
  assert.match(source, /225 observer setup lines/);
  assert.match(source, /9085 observer setup bytes/);
  assert.match(source, /selected quick-block lifecycle token counts/);
  assert.match(source, /selected zero policy token counts/);
  assert.match(source, /9 runtime quick-block lifecycle fixtures/);
  assert.match(source, /active hover sets hover\/sticky markers and schedules sticky cleanup/);
  assert.match(source, /inactive leave clears hover while keeping sticky for the leave window/);
  assert.match(source, /overlay, mobile search, or viewport-hidden state clears hover\/sticky without scheduling a sticky timer/);
  assert.match(source, /viewport refresh coalesces behind one requestAnimationFrame/);
  assert.match(source, /sweep scheduling coalesces behind one 80 ms timer/);
  assert.match(source, /setup installs page-level listeners, a MutationObserver, and `yt-navigate-finish` sweep scheduling without local teardown/);
  assert.match(source, /fallback success can schedule `applyDOMFallback\(null, \{ preserveScroll: true \}\)` after 120 ms/);
  assert.match(source, /2026-05-30 quick-block Home\/Shorts affordance current-source rerun/);
  assert.match(source, /passed 24\/24 tests/);
  assert.match(source, /`js\/content\/block_channel\.js:411` for `scheduleQuickBlockHoverIntent\(\)`/);
  assert.match(source, /`js\/content\/block_channel\.js:515` for `resolveQuickBlockHost\(\)`/);
  assert.match(source, /`js\/content\/block_channel\.js:550` for `resolveOutermostShortsQuickBlockHost\(\)`/);
  assert.match(source, /`js\/content\/block_channel\.js:1183` for `findQuickBlockCardFromTarget\(\)`/);
  assert.match(source, /`js\/content\/block_channel\.js:1205` for `isQuickBlockEnabled`/);
  assert.match(source, /`js\/content\/block_channel\.js:1788` for `ensureQuickBlockButton\(\)`/);
  assert.match(source, /`js\/content\/block_channel\.js:1949` for `scheduleQuickBlockSweep\(\)`/);
  assert.match(source, /`js\/content\/block_channel\.js:1979` for `setupQuickBlockObserver\(\)`/);
  assert.match(source, /Home\/Shorts nested hover targets can\s+promote to the outer Shorts card before the duplicate-card guard/);
  assert.match(source, /quick-block\s+remains disabled in whitelist mode and when `showQuickBlockButton !== true`/);
  assert.match(source, /old `quickBlockPeriodicTimer` path is absent/);
  assert.match(source, /desktop work stays\s+hover-lazy instead of startup\/full-document-sweep driven/);
  assert.match(source, /Runtime behavior\s+changed by this rerun: no/);
  assert.match(source, /Installed visible-tab quick-cross parity, mobile and\s+desktop Home\/Shorts placement screenshots, stale open-tab reload proof,\s+route\/surface metric artifacts, rollback\/restore proof, whitelist optimization,\s+release\/public-claim use, and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /quick-block lifecycle still needs hover lifecycle contracts/);
  assert.match(source, /observer owner reports/);
  assert.match(source, /teardown registries/);
  assert.match(source, /fallback rerun budgets/);
  assert.match(source, /`quickBlockHoverLifecycleContract`, `quickBlockHoverLifecycleReport`, `quickBlockTimerBudget`, `quickBlockObserverOwnerReport`, `quickBlockPeriodicSweepBudget`, `quickBlockViewportRafBudget`, `quickBlockHoverStickyPolicy`, `quickBlockTeardownRegistry`, `quickBlockActionFallbackRerunBudget`, or `quickBlockLifecycleMetricArtifact`/);
});

test('active goal completion audit records menu observer Kids passive lifecycle boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Menu observer Kids passive lifecycle boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_MENU_OBSERVER_KIDS_PASSIVE_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/menu-observer-kids-passive-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct menu\/Kids lifecycle proof/);
  assert.match(source, /1 menu observer Kids passive lifecycle source file/);
  assert.match(source, /10 source\/effect blocks/);
  assert.match(source, /51 menu injection state lines/);
  assert.match(source, /1517 menu state bytes/);
  assert.match(source, /25 dropdown pending state lines/);
  assert.match(source, /762 dropdown state bytes/);
  assert.match(source, /124 normal menu observer lines/);
  assert.match(source, /5014 observer bytes/);
  assert.match(source, /46 Kids passive listener lines/);
  assert.match(source, /2558 Kids listener bytes/);
  assert.match(source, /123 Kids context capture lines/);
  assert.match(source, /5460 context bytes/);
  assert.match(source, /97 Kids native block handler lines/);
  assert.match(source, /3790 Kids handler bytes/);
  assert.match(source, /25 visible-dropdown retry lines/);
  assert.match(source, /1027 retry bytes/);
  assert.match(source, /16 dropdown lock lines/);
  assert.match(source, /526 lock bytes/);
  assert.match(source, /245 dropdown internal lines/);
  assert.match(source, /11707 internal bytes/);
  assert.match(source, /5 startup timer lines/);
  assert.match(source, /127 startup bytes/);
  assert.match(source, /selected menu\/Kids lifecycle token counts/);
  assert.match(source, /selected zero policy token counts/);
  assert.match(source, /9 runtime menu\/Kids lifecycle fixtures/);
  assert.match(source, /non-Kids setup installs a capture click listener, dropdown attribute observers, a body MutationObserver, and a 150 ms visible-dropdown retry/);
  assert.match(source, /Kids setup installs a capture click listener plus body MutationObserver and suppresses toast fallback for 2000 ms/);
  assert.match(source, /Kids native block handling uses a 1000 ms action throttle, 15000 ms context TTL, and 10000 ms dedupe timer/);
  assert.match(source, /dropdown appearance uses a WeakSet lock around internal injection/);
  assert.match(source, /whitelist mode cleans injected menu items before injection/);
  assert.match(source, /dropdown internals cancel pending dropdown fetches on `aria-hidden`/);
  assert.match(source, /startup timer still delays 1000 ms before calling both `setupMenuObserver\(\);` and `setupQuickBlockObserver\(\);`/);
  assert.match(source, /menu observer and Kids passive lifecycle still need lifecycle contracts/);
  assert.match(source, /pending-fetch cancellation policies/);
  assert.match(source, /Kids block dedupe budgets/);
  assert.match(source, /message authority/);
  assert.match(source, /`menuDropdownLifecycleContract`, `menuDropdownLifecycleReport`, `menuDropdownObserverOwnerReport`, `menuDropdownPendingFetchCancellationPolicy`, `menuDropdownInjectionStateReport`, `kidsPassiveBlockLifecycleContract`, `kidsNativeBlockDedupBudget`, `kidsBlockMessageAuthority`, `menuObserverTeardownRegistry`, or `menuDropdownLifecycleMetricArtifact`/);
  assert.match(source, /2026-05-28 menu bounded-discovery executable continuation/);
  assert.match(source, /2500 ms dropdown discovery shutdown timer/);
  assert.match(source, /no-helper outside-pointer Escape fallback/);
  assert.match(source, /native dropdown discovery stop executable rows:\s+1/);
  assert.match(source, /native dropdown escape fallback executable rows:\s+1/);
  assert.match(source, /native dropdown executable continuation behavior changed:\s+no/);
  assert.match(source, /native dropdown executable continuation approval:\s+`NO-GO`/);
  assert.match(source, /without approving menu lifecycle optimization, close-helper simplification,\s+outside-pointer policy changes, route\/surface authority, whitelist behavior changes,\s+or runtime behavior changes/);
  assert.match(source, /2026-05-30 native dropdown close-state ledger link/);
  assert.match(source, /tests\/runtime\/native-dropdown-close-state-current-behavior\.test\.mjs/);
  assert.match(source, /docs\/audit\/FILTERTUBE_RELEASE_REGRESSION_LAG_AND_BLOCKLIST_FIX_2026-05-26\.md/);
  assert.match(source, /comment 3-dot menu close regression/);
  assert.match(source, /`forceCloseDropdown\(\)` closes reusable desktop native dropdowns without writing poisoned inline hidden\/display state/);
  assert.match(source, /still hides mobile\/dialog dropdowns by marking `data-filtertube-force-hidden="true"`/);
  assert.match(source, /repairs only nodes explicitly marked with `data-filtertube-force-hidden`/);
  assert.match(source, /leaves normal YouTube outside-click hidden state alone/);
  assert.match(source, /outside-pointer fallback closes only visible dropdowns containing `\.filtertube-block-channel-item`/);
  assert.match(source, /leaves plain native YouTube dropdowns, hidden dropdowns, inside-dropdown clicks, and 3-dot menu-button clicks under YouTube control/);
  assert.match(source, /routes close through `forceCloseDropdown\(\)` when available or Escape when the helper is unavailable/);
  assert.match(source, /comment menu behavior, outside-click close behavior, menu lifecycle optimization, close-helper simplification, outside-pointer policy changes, route\/surface authority, whitelist behavior changes, and runtime behavior changes at `NO-GO`/);
  assert.match(source, /2026-05-30 native dropdown close-state current-source rerun/);
  assert.match(source, /passed 12\/12 tests/);
  assert.match(source, /`js\/content_bridge\.js:497` for `forceCloseDropdown\(\)`/);
  assert.match(source, /`js\/content_bridge\.js:557` for mobile\/dialog `data-filtertube-force-hidden` marking/);
  assert.match(source, /`js\/content_bridge\.js:562` and `js\/content_bridge\.js:563` for forced-hidden cleanup/);
  assert.match(source, /`js\/content\/block_channel\.js:2325` for `repairFilterTubeHiddenDropdownState\(\)`/);
  assert.match(source, /`js\/content\/block_channel\.js:2338` for the explicit FilterTube-forced hidden gate/);
  assert.match(source, /`js\/content\/block_channel\.js:2462` for discovery-time repair/);
  assert.match(source, /`js\/content\/block_channel\.js:2484` for the outside-pointer `\.filtertube-block-channel-item` gate/);
  assert.match(source, /`js\/content\/block_channel\.js:2488` for close helper use/);
  assert.match(source, /`js\/content\/block_channel\.js:2565` for the 2500 ms discovery stop timer/);
  assert.match(source, /FilterTube closes only its injected visible dropdown surface on outside pointer fallback/);
  assert.match(source, /avoids writing persistent hidden\/display state to reusable desktop native dropdown roots/);
  assert.match(source, /repairs only its own forced-hidden mobile\/dialog state/);
  assert.match(source, /leaves plain YouTube native dropdown state under YouTube ownership/);
  assert.match(source, /Runtime behavior changed by this rerun: no/);
  assert.match(source, /Live visible-tab comment-menu parity, installed extension reload proof, route\/surface menu screenshots, broad menu lifecycle optimization, close-helper simplification, outside-pointer policy changes, whitelist behavior changes, release\/public-claim use, and `update_goal\(status='complete'\)` remain `NO-GO`/);
});

test('active goal completion audit records content bridge menu injection action boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content bridge menu injection action boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_MENU_INJECTION_ACTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/content-bridge-menu-injection-action-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct menu action proof/);
  assert.match(source, /1 content bridge menu injection action source file/);
  assert.match(source, /7 source\/effect blocks/);
  assert.match(source, /76 metadata payload lines/);
  assert.match(source, /3754 metadata payload bytes/);
  assert.match(source, /123 dropdown cleanup lines/);
  assert.match(source, /4170 dropdown cleanup bytes/);
  assert.match(source, /735 menu injection lines/);
  assert.match(source, /34684 menu injection bytes/);
  assert.match(source, /71 menu handler lines/);
  assert.match(source, /2490 menu handler bytes/);
  assert.match(source, /119 blocked marker\/target lines/);
  assert.match(source, /5113 marker bytes/);
  assert.match(source, /1226 handleBlockChannelClick lines/);
  assert.match(source, /60722 click handler bytes/);
  assert.match(source, /54 addChannelDirectly lines/);
  assert.match(source, /2662 direct-add bytes/);
  assert.match(source, /selected content bridge menu action token counts/);
  assert.match(source, /selected zero policy token counts/);
  assert.match(source, /9 runtime content bridge menu action fixtures/);
  assert.match(source, /metadata payload keeps display handles strict and stores names separately/);
  assert.match(source, /dropdown cleanup cancels pending fetches and clears injected collaboration state/);
  assert.match(source, /menu injection remains gated by whitelist mode and `showBlockMenuItem === false`/);
  assert.match(source, /menu handlers gate disabled, toggle, placeholder, multi-step, and block-click paths/);
  assert.match(source, /blocked markers stamp current optimistic hide metadata/);
  assert.match(source, /direct add sends `type: 'addFilteredChannel'` and schedules `FilterTube_ScheduleAutoBackup`/);
  assert.match(source, /optimistic hide, restoration on failure, success dropdown close, settings refresh, DOM fallback rerun, and post-action Shorts\/playlist enrichment/);
  assert.match(source, /content bridge menu action still needs action contracts/);
  assert.match(source, /pending dropdown fetch policies/);
  assert.match(source, /optimistic hide reports/);
  assert.match(source, /mutation fanout budgets/);
  assert.match(source, /DOM fallback budgets/);
  assert.match(source, /backup scheduling policies/);
  assert.match(source, /identity enrichment policies/);
  assert.match(source, /`contentBridgeMenuActionContract`, `contentBridgeMenuActionReport`, `contentBridgePendingDropdownFetchPolicy`, `contentBridgeMenuOptimisticHideReport`, `contentBridgeMenuMutationFanoutBudget`, `contentBridgeMenuDomFallbackBudget`, `contentBridgeMenuBackupSchedulePolicy`, `contentBridgeMenuIdentityEnrichmentPolicy`, `contentBridgeMenuActionFixtureProvenance`, or `contentBridgeMenuActionMetricArtifact`/);
});

test('active goal completion audit records content bridge collaborator enrichment retry boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content bridge collaborator enrichment retry boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_ENRICHMENT_RETRY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/content-bridge-collaborator-enrichment-retry-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct collaborator enrichment retry proof/);
  assert.match(source, /1 content bridge collaborator enrichment retry source file/);
  assert.match(source, /6 source\/effect blocks/);
  assert.match(source, /58 pending dialog state lines/);
  assert.match(source, /2208 pending dialog bytes/);
  assert.match(source, /17 retry lines/);
  assert.match(source, /778 retry bytes/);
  assert.match(source, /54 lookup option lines/);
  assert.match(source, /2358 lookup bytes/);
  assert.match(source, /56 enrichment request lines/);
  assert.match(source, /2572 request bytes/);
  assert.match(source, /97 apply resolved lines/);
  assert.match(source, /3596 apply resolved bytes/);
  assert.match(source, /94 apply by video id lines/);
  assert.match(source, /3508 apply-by-video bytes/);
  assert.match(source, /selected collaborator enrichment retry token counts/);
  assert.match(source, /selected zero authority token counts/);
  assert.match(source, /10 runtime collaborator enrichment retry fixtures/);
  assert.match(source, /pending dialog enrichment creates `vid:` keys, pending attributes, partial collaborator storage, expected-count hints, and a 20000 ms expiry/);
  assert.match(source, /retry scheduling caps at three attempts, clears `data-filtertube-collab-requested`, and defaults to 700 ms/);
  assert.match(source, /lookup options merge partial, cached, and channel-info hints while parsing hidden-collaborator labels/);
  assert.match(source, /request enrichment marks pending before duplicate main-world suppression, applies non-empty responses, and retries empty or failed responses/);
  assert.match(source, /resolved application writes serialized collaborator state, refreshes active menus and playlist popovers, and schedules zero-delay forced DOM fallback/);
  assert.match(source, /video-id batch application can create pending entries, call `window\.collabDialogModule\.applyCollaboratorsToCard\(\)`, skip lower-quality rosters unless forced/);
  assert.match(source, /collaborator enrichment still needs enrichment contracts/);
  assert.match(source, /retry policies/);
  assert.match(source, /pending-card reports/);
  assert.match(source, /lookup option policies/);
  assert.match(source, /application reports/);
  assert.match(source, /DOM fallback budgets/);
  assert.match(source, /menu refresh reports/);
  assert.match(source, /`contentBridgeCollaboratorEnrichmentContract`, `contentBridgeCollaboratorRetryPolicy`, `contentBridgeCollaboratorPendingCardReport`, `contentBridgeCollaboratorLookupOptionsPolicy`, `contentBridgeCollaboratorApplicationReport`, `contentBridgeCollaboratorDomFallbackBudget`, `contentBridgeCollaboratorMenuRefreshReport`, `contentBridgeCollaboratorFixtureProvenance`, `contentBridgeCollaboratorMetricArtifact`, or `contentBridgeCollaboratorAuthorityGate`/);
});

test('active goal completion audit records content bridge collaborator metadata extraction side-effect boundary without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content bridge collaborator metadata extraction side-effect boundary addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_METADATA_EXTRACTION_SIDE_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/content-bridge-collaborator-metadata-extraction-side-effect-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /extraction side-effect proof/);
  assert.match(source, /1 content bridge collaborator metadata extraction source file/);
  assert.match(source, /5 source\/effect blocks/);
  assert.match(source, /242 renderer extraction lines/);
  assert.match(source, /12604 renderer extraction bytes/);
  assert.match(source, /45 renderer candidate inventory lines/);
  assert.match(source, /1996 renderer candidate inventory bytes/);
  assert.match(source, /484 element extraction lines/);
  assert.match(source, /24961 element extraction bytes/);
  assert.match(source, /78 cache\/enrich helper lines/);
  assert.match(source, /3331 cache\/enrich helper bytes/);
  assert.match(source, /88 YTM byline branch lines/);
  assert.match(source, /5456 YTM byline branch bytes/);
  assert.match(source, /selected collaborator metadata extraction token counts/);
  assert.match(source, /selected zero authority token counts/);
  assert.match(source, /11 runtime collaborator metadata extraction fixtures/);
  assert.match(source, /renderer JSON extraction rejects Mix renderer signals/);
  assert.match(source, /renderer JSON extraction can recover collaborators from bounded deep `showSheetCommand` scans/);
  assert.match(source, /element extraction can stamp card and wrapper video-id attrs/);
  assert.match(source, /renderer-derived collaborators cache lockup metadata and expected-count attrs/);
  assert.match(source, /renderer-derived collaborators can call `applyResolvedCollaborators\(\)` twice/);
  assert.match(source, /hidden DOM collaborator text can cache partial collaborators and request enrichment/);
  assert.match(source, /plain single-channel name containing `and` remains outside collaborator mode/);
  assert.match(source, /captured headerless YTM showSheet roster falls back to one partial `Shakira` enrichment seed/);
  assert.match(source, /collaborator metadata extraction still needs extraction contracts/);
  assert.match(source, /pure-read extraction/);
  assert.match(source, /renderer JSON path policies/);
  assert.match(source, /DOM selector policies/);
  assert.match(source, /enrichment opt-in policies/);
  assert.match(source, /`contentBridgeCollaboratorMetadataExtractionContract`, `contentBridgeCollaboratorMetadataExtractionDecision`, `contentBridgeCollaboratorExtractionSideEffectReport`, `contentBridgeCollaboratorPureReadMode`, `contentBridgeCollaboratorRendererJsonPathPolicy`, `contentBridgeCollaboratorDomSelectorPolicy`, `contentBridgeCollaboratorEnrichmentOptInPolicy`, `contentBridgeCollaboratorExtractionFixtureProvenance`, `contentBridgeCollaboratorExtractionMetricArtifact`, `contentBridgeCollaboratorExtractionAuthorityGate`, `contentBridgeShowSheetCapturedFixtureParityReport`, `contentBridgeShowSheetFilterAuthorityBoundary`, or `contentBridgeShowSheetSideEffectBudget`/);
});

test('active goal completion audit records content bridge collaborator identity promotion handoff without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content bridge collaborator identity promotion handoff addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_IDENTITY_PROMOTION_HANDOFF_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/content-bridge-collaborator-identity-promotion-handoff-current-behavior\.test\.mjs/);
  assert.match(source, /caller-side promotion proof/);
  assert.match(source, /1 content bridge collaborator identity promotion source file/);
  assert.match(source, /7 source\/effect blocks/);
  assert.match(source, /28 warmup lines/);
  assert.match(source, /1229 warmup bytes/);
  assert.match(source, /88 YTM promotion lines/);
  assert.match(source, /3141 YTM promotion bytes/);
  assert.match(source, /26 DOM signal lines/);
  assert.match(source, /1247 DOM signal bytes/);
  assert.match(source, /136 normalization lines/);
  assert.match(source, /5694 normalization bytes/);
  assert.match(source, /82 generic promotion lines/);
  assert.match(source, /2962 generic promotion bytes/);
  assert.match(source, /32 extract-channel priority handoff lines/);
  assert.match(source, /1622 priority handoff bytes/);
  assert.match(source, /24 lockup handoff lines/);
  assert.match(source, /1290 lockup handoff bytes/);
  assert.match(source, /selected collaborator identity promotion token counts/);
  assert.match(source, /selected zero authority token counts/);
  assert.match(source, /10 runtime collaborator identity promotion fixtures/);
  assert.match(source, /watch-like warmup parses two-name bylines but skips Mix cards/);
  assert.match(source, /YTM promotion calls collaborator extraction and returns collaboration-shaped identity with incomplete-roster enrichment needs/);
  assert.match(source, /generic promotion prefers richer resolved-cache data over weaker extraction/);
  assert.match(source, /normalization merges existing, resolved-cache, and avatar-stack rosters/);
  assert.match(source, /can inflate expected count from overlapping raw roster inputs/);
  assert.match(source, /Mix promotion\/normalization clears collaborator metadata while keeping base identity/);
  assert.match(source, /2026-05-28 topic stale collaborator state continuation/);
  assert.match(source, /same-video cached collaborator attrs or resolved collaborator cache state/);
  assert.match(source, /topic stale collaborator state rows: 5/);
  assert.match(source, /topic stale ampersand-topic guard rows: 4/);
  assert.match(source, /topic stale action-layer trust rows: 0/);
  assert.match(source, /topic stale installed-tab parity status: MISSING/);
  assert.match(source, /topic stale collaborator state risk: GATED_FOR_NAME_ONLY_AMPERSAND_TOPIC/);
  assert.match(source, /general cache evidence gates, grammar-version\/provenance stamps/);
  assert.match(source, /2026-05-28 collaborator cache provenance readiness continuation/);
  assert.match(source, /Same-video cache validation rejects literal ampersand Topic name-only rosters/);
  assert.match(source, /Block All cleanup branch deletes under a `!has\(videoId\)` guard/);
  assert.match(source, /collaborator cache provenance readiness rows: 7/);
  assert.match(source, /collaborator cache ampersand-topic guard rows: 1/);
  assert.match(source, /collaborator cache source-label write-only rows: 2/);
  assert.match(source, /collaborator cache stale-delete no-op rows: 1/);
  assert.match(source, /collaborator cache provenance validation rows: 1/);
  assert.match(source, /collaborator cache runtime behavior changed: yes/);
  assert.match(source, /collaborator cache provenance risk: PARTIAL/);
  assert.match(source, /2026-05-30 Topic guard current-source rerun/);
  assert.match(source, /passed 30\/30 tests/);
  assert.match(source, /`js\/content_bridge\.js:4996` for\s+`isAmpersandTopicNameOnlyCollaboratorState\(\)`/);
  assert.match(source, /`js\/content_bridge\.js:5010` for\s+`clearAmpersandTopicCollaboratorState\(\)`/);
  assert.match(source, /`js\/content_bridge\.js:5018` for\s+`rejectAmpersandTopicCollaboratorWrite\(\)`/);
  assert.match(source, /`js\/content_bridge\.js:13500` for\s+`contentBridgeAmpersandTopicSingleChannelMenuGuard\(\)`/);
  assert.match(source, /`js\/content\/block_channel\.js:1428` for `collectQuickBlockCollaborators\(\)`/);
  assert.match(source, /`js\/content\/block_channel\.js:1430` plus `js\/content\/block_channel\.js:1451` for\s+`skipAmpersandTopicNameOnlyRoster\(\)` admission and use/);
  assert.match(source, /fresh `Kully B & Gussy G - Topic` bylines stay\s+single-channel/);
  assert.match(source, /stale name-only ampersand Topic rosters are cleared before\s+writer\/menu\/quick-block handoff/);
  assert.match(source, /quick-block keeps the Topic action as a\s+single-channel action/);
  assert.match(source, /Runtime behavior changed by this rerun: no/);
  assert.match(source, /Installed\s+visible-tab byte parity, stale open-tab cache cleanup, route\/surface Topic\s+negative corpora, broader non-Topic collaborator provenance, JSON-first\s+collaborator authority, whitelist optimization, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /2026-05-30 installed Topic reload parity gap continuation/);
  assert.match(source, /Installed Topic Reload Parity\s+Gap Addendum - 2026-05-30/);
  assert.match(source, /current source and focused tests keep\s+`Kully B & Gussy G - Topic` as one Topic label/);
  assert.match(source, /installed Topic reload parity rows: 4/);
  assert.match(source, /source-focused Topic\s+guard tests: PASS/);
  assert.match(source, /runtime behavior changed by reload parity addendum: no/);
  assert.match(source, /installed reloaded-tab byte trace: MISSING/);
  assert.match(source, /uncovered writer-path proof:\s+MISSING/);
  assert.match(source, /menu-layer grammar fix approval: NO-GO/);
  assert.match(source, /installed-tab\s+byte parity, stale open-tab cache cleanup, uncovered writer-path proof,\s+menu-layer grammar ownership, release\/public-claim use, and\s+`update_goal\(status='complete'\)` at `NO-GO`/);
  assert.match(source, /2026-05-30 Topic writer-path source census continuation/);
  assert.match(source, /Topic Writer-Path Source Census\s+Addendum - 2026-05-30/);
  assert.match(source, /active-menu\s+refresh, `applyResolvedCollaborators\(\)`, `applyCollaboratorsByVideoId\(\)`/);
  assert.match(source, /Topic\s+writer-path source census rows: 9/);
  assert.match(source, /DOM collaborator attr writer rows covered:\s+6/);
  assert.match(source, /resolved-map writer rows covered:\s+5/);
  assert.match(source, /entrypoint funnel rows covered:\s+3/);
  assert.match(source, /known\s+content_bridge DOM attr writer coverage:\s+PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY/);
  assert.match(source, /uncovered writer-path proof from source\s+census:\s+PARTIAL_SOURCE_CENSUS/);
  assert.match(source, /runtime behavior changed by writer-path census addendum:\s+no/);
  assert.match(source, /stale installed bytes\/open-tab state or non-enumerated\s+main-world\/JSON provenance/);
  assert.match(source, /2026-05-30 ampersand Topic root-cause boundary continuation/);
  assert.match(source, /Ampersand Topic\s+Root-Cause Boundary Addendum - 2026-05-30/);
  assert.match(source, /false\s+`Kully B & Gussy G - Topic` collaborator menu requires upstream\s+collaborator-shaped state/);
  assert.match(source, /ampersand\s+Topic root-cause rows: 5/);
  assert.match(source, /menu root-cause status:\s+DOWNSTREAM_RENDERER_NOT_CLASSIFIER/);
  assert.match(source, /current source fresh parser status:\s+NO_PLAIN_AMPERSAND_SPLIT/);
  assert.match(source, /current source stale name-only roster status:\s+REJECTED_FOR_VISIBLE_TOPIC_LABEL/);
  assert.match(source, /true collaborator preservation status:\s+STRONGER_EVIDENCE_STILL_ADMITTED/);
  assert.match(source, /runtime behavior changed by root-cause\s+addendum: no/);
  assert.match(source, /2026-05-30 installed Chrome DOM evidence boundary continuation/);
  assert.match(source, /live connected-user\s+Chrome DOM evidence without claiming installed extension source-byte parity/);
  assert.match(source, /sampled user tab was `https:\/\/www\.youtube\.com\/watch\?v=aJOTlE1K90k`/);
  assert.match(source, /301 FilterTube-stamped DOM nodes, 236\s+`data-filtertube-video-id` attrs, 235 processed card attrs, 20 hidden attrs, 4\s+quick-block event wrapper attrs, and 0 collaborator attrs/);
  assert.match(source, /chrome-extension:\/\/gkgjigdfdccckblmglboobikfcpeelio\/js\/content_bridge\.js`/);
  assert.match(source, /installed Chrome DOM evidence rows: 5/);
  assert.match(source, /installed\s+Chrome extension activity status: OBSERVED_DOM_STAMPS/);
  assert.match(source, /installed Chrome source\s+resource probe: BLOCKED_BY_BROWSER_POLICY/);
  assert.match(source, /runtime behavior changed by\s+installed Chrome DOM evidence addendum: no/);
  assert.match(source, /Installed source byte parity, the\s+`Kully B & Gussy G - Topic` live negative fixture, allowed installed-resource\s+hashing, JSON-first collaborator authority, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /2026-05-30 ampersand Topic cross-feature matrix linkage/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CROSS_FEATURE_AUTHORITY_MATRIX_2026-05-18\.md/);
  assert.match(source, /Ampersand Topic Single-Channel Collaborator Boundary - 2026-05-30/);
  assert.match(source, /parser evidence gate, name-only writer reject, menu single-channel\s+guard, identity normalization guard, quick-block guard/);
  assert.match(source, /ampersand Topic boundary rows: 6/);
  assert.match(source, /literal `Kully B & Gussy G - Topic` without\s+avatar stack\/two links\/N-more: single-channel/);
  assert.match(source, /stale name-only ampersand Topic\s+roster behavior: clear-or-reject-before-writer-menu-quick-block/);
  assert.match(source, /true\s+collaborator behavior changed by this addendum: no/);
  assert.match(source, /runtime behavior changed\s+by this addendum: no/);
  assert.match(source, /collaborator JSON-first authority promotion: NO-GO/);
  assert.match(source, /installed open-tab parity proof: still required/);
  assert.match(source, /release\/public-claim use:\s+NO-GO/);
  assert.match(source, /collaborator identity promotion still needs promotion contracts/);
  assert.match(source, /pure-read promotion policies/);
  assert.match(source, /caller policies/);
  assert.match(source, /route-scope reports/);
  assert.match(source, /cache-write reports/);
  assert.match(source, /`contentBridgeCollaboratorIdentityPromotionContract`, `contentBridgeCollaboratorIdentityPromotionDecision`, `contentBridgeCollaboratorPromotionSideEffectReport`, `contentBridgeCollaboratorPromotionPureReadPolicy`, `contentBridgeCollaboratorPromotionCallerPolicy`, `contentBridgeCollaboratorPromotionRouteScopeReport`, `contentBridgeCollaboratorPromotionCacheWriteReport`, `contentBridgeCollaboratorPromotionFixtureProvenance`, `contentBridgeCollaboratorPromotionMetricArtifact`, or `contentBridgeCollaboratorPromotionAuthorityGate`/);
});

test('active goal completion audit records content bridge collaborator main-world merge mutation without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content bridge collaborator main-world merge mutation addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_MAIN_WORLD_MERGE_MUTATION_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/content-bridge-collaborator-main-world-merge-mutation-current-behavior\.test\.mjs/);
  assert.match(source, /enrichment-merge mutation proof/);
  assert.match(source, /1 content bridge collaborator main-world merge source file/);
  assert.match(source, /4 source\/effect blocks/);
  assert.match(source, /10 name-normalization lines/);
  assert.match(source, /293 name-normalization bytes/);
  assert.match(source, /142 main-world merge lines/);
  assert.match(source, /5989 merge bytes/);
  assert.match(source, /26 main-world enrich lines/);
  assert.match(source, /1235 enrich bytes/);
  assert.match(source, /55 menu enrichment handoff lines/);
  assert.match(source, /2880 handoff bytes/);
  assert.match(source, /selected collaborator main-world merge token counts/);
  assert.match(source, /selected zero authority token counts/);
  assert.match(source, /11 runtime collaborator main-world merge fixtures/);
  assert.match(source, /name normalization lowercases and collapses whitespace/);
  assert.match(source, /main-world merge mutates DOM-derived collaborators in place/);
  assert.match(source, /merge repairs weak collaborator names while preserving conflicting existing handle\/id values/);
  assert.match(source, /merge copies the first collaborator into primary fields/);
  assert.match(source, /merge recomputes `needsEnrichment`/);
  assert.match(source, /enrichment is inactive without collaboration identity or video id/);
  assert.match(source, /enrichment queries a source card by `data-filtertube-video-id`/);
  assert.match(source, /collaborator main-world merge still needs merge contracts/);
  assert.match(source, /mutation reports/);
  assert.match(source, /lookup policies/);
  assert.match(source, /primary identity policies/);
  assert.match(source, /conflict policies/);
  assert.match(source, /caller budgets/);
  assert.match(source, /`contentBridgeCollaboratorMainWorldMergeContract`, `contentBridgeCollaboratorMainWorldMergeDecision`, `contentBridgeCollaboratorMainWorldMutationReport`, `contentBridgeCollaboratorMainWorldLookupPolicy`, `contentBridgeCollaboratorMergePrimaryIdentityPolicy`, `contentBridgeCollaboratorMergeConflictPolicy`, `contentBridgeCollaboratorMergeCallerBudget`, `contentBridgeCollaboratorMergeFixtureProvenance`, `contentBridgeCollaboratorMergeMetricArtifact`, or `contentBridgeCollaboratorMergeAuthorityGate`/);
});

test('active goal completion audit records content bridge menu blocked-state list-shape without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content bridge menu blocked-state list-shape addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_MENU_BLOCKED_STATE_LIST_SHAPE_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/content-bridge-menu-blocked-state-list-shape-current-behavior\.test\.mjs/);
  assert.match(source, /menu list-shape proof/);
  assert.match(source, /1 content bridge menu blocked-state source file/);
  assert.match(source, /3 source\/effect blocks/);
  assert.match(source, /16 stored entry lookup lines/);
  assert.match(source, /581 stored entry bytes/);
  assert.match(source, /57 already-blocked check lines/);
  assert.match(source, /2949 already-blocked bytes/);
  assert.match(source, /33 blocked-element sync lines/);
  assert.match(source, /1521 blocked-element sync bytes/);
  assert.match(source, /selected menu blocked-state token counts/);
  assert.match(source, /selected zero mode\/list token counts/);
  assert.match(source, /11 runtime menu blocked-state fixtures/);
  assert.match(source, /`findStoredChannelEntry\(\)` returns entries from `currentSettings\.filterChannels`/);
  assert.match(source, /ignores whitelist arrays/);
  assert.match(source, /returns `null` when `filterChannels` is absent even if whitelist fields exist/);
  assert.match(source, /`checkIfChannelBlocked\(\)` reads only storage `filterChannels` and `channelMap`/);
  assert.match(source, /already-blocked check disables the menu item and hydrates filter-all controls/);
  assert.match(source, /fallback matching works by normalized handle or exact id/);
  assert.match(source, /`syncBlockedElementsWithFilters\(\)` keeps stamped blocked elements hidden while `filterChannels` still matches/);
  assert.match(source, /clears blocked attrs and restores visibility when only whitelist fields remain/);
  assert.match(source, /menu blocked-state still needs list-mode contracts/);
  assert.match(source, /list target policies/);
  assert.match(source, /stored-entry reports/);
  assert.match(source, /blocked-element sync reports/);
  assert.match(source, /whitelist interaction reports/);
  assert.match(source, /filter-all state policies/);
  assert.match(source, /`contentBridgeMenuBlockedStateListModeContract`, `contentBridgeMenuBlockedStateDecision`, `contentBridgeMenuBlockedStateListTargetPolicy`, `contentBridgeMenuStoredEntryReport`, `contentBridgeBlockedElementSyncReport`, `contentBridgeBlockedElementRestorePolicy`, `contentBridgeMenuWhitelistInteractionReport`, `contentBridgeMenuFilterAllStatePolicy`, `contentBridgeMenuBlockedStateFixtureProvenance`, or `contentBridgeMenuBlockedStateMetricArtifact`/);
});

test('active goal completion audit records content bridge menu action list-target without declaring completion', () => {
  const source = doc();

  assert.match(source, /Content bridge menu action list-target addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_MENU_ACTION_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/content-bridge-menu-action-list-target-current-behavior\.test\.mjs/);
  assert.match(source, /action list-target proof/);
  assert.match(source, /1 content bridge menu action list-target source file/);
  assert.match(source, /5 source\/effect blocks/);
  assert.match(source, /213 fallback performBlock lines/);
  assert.match(source, /9930 fallback performBlock bytes/);
  assert.match(source, /738 primary injection lines/);
  assert.match(source, /34747 primary injection bytes/);
  assert.match(source, /71 attached handler lines/);
  assert.match(source, /2490 attached handler bytes/);
  assert.match(source, /1226 block-click handler lines/);
  assert.match(source, /60722 block-click handler bytes/);
  assert.match(source, /54 direct-add lines/);
  assert.match(source, /2662 direct-add bytes/);
  assert.match(source, /selected menu action list-target token counts/);
  assert.match(source, /selected zero list-target token counts/);
  assert.match(source, /11 runtime menu action list-target fixtures/);
  assert.match(source, /primary dropdown injection returns in whitelist mode/);
  assert.match(source, /clears injected rows when the menu item is disabled/);
  assert.match(source, /delegate block clicks without repeating list-mode gates/);
  assert.match(source, /contains no `listMode`, no `showBlockMenuItem`, and no `whitelistChannels` token/);
  assert.match(source, /contains 8 `addChannelDirectly` callsites plus mutation fanout/);
  assert.match(source, /fallback `performBlock` contains no local list-mode gate/);
  assert.match(source, /sends `type: 'addFilteredChannel'` without `listMode`, `whitelistChannels`, `filterChannels`, or `listTarget` payload fields/);
  assert.match(source, /successful direct add schedules `FilterTube_ScheduleAutoBackup`/);
  assert.match(source, /YouTube Kids hostnames derive the `kids` profile/);
  assert.match(source, /menu action list-target still needs action list-target contracts/);
  assert.match(source, /fallback mutation gates/);
  assert.match(source, /direct-add list-target reports/);
  assert.match(source, /whitelist bypass reports/);
  assert.match(source, /mutation fanout metrics/);
  assert.match(source, /`contentBridgeMenuActionListTargetContract`, `contentBridgeMenuActionListTargetDecision`, `contentBridgeMenuActionProfileTargetReport`, `contentBridgeFallbackMenuMutationGate`, `contentBridgeFallbackMenuListModePolicy`, `contentBridgeMenuDirectAddListTargetReport`, `contentBridgeMenuActionWhitelistBypassReport`, `contentBridgeMenuActionOptimisticHideBudget`, `contentBridgeMenuActionMutationFanoutMetric`, or `contentBridgeMenuActionListTargetFixtureProvenance`/);
});

test('active goal completion audit records background addFilteredChannel list-target without declaring completion', () => {
  const source = doc();

  assert.match(source, /Background addFilteredChannel list-target addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_BACKGROUND_ADD_FILTERED_CHANNEL_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/background-add-filtered-channel-list-target-current-behavior\.test\.mjs/);
  assert.match(source, /background receiver\/helper proof/);
  assert.match(source, /1 background addFilteredChannel source file/);
  assert.match(source, /6 source\/effect blocks/);
  assert.match(source, /39 receiver lines/);
  assert.match(source, /1579 receiver bytes/);
  assert.match(source, /893 helper lines/);
  assert.match(source, /45226 helper bytes/);
  assert.match(source, /158 helper signature\/input lines/);
  assert.match(source, /6464 signature\/input bytes/);
  assert.match(source, /358 identity-repair lines/);
  assert.match(source, /19385 identity-repair bytes/);
  assert.match(source, /352 existing\/write lines/);
  assert.match(source, /18483 existing\/write bytes/);
  assert.match(source, /28 commit\/return lines/);
  assert.match(source, /894 commit\/return bytes/);
  assert.match(source, /selected background addFilteredChannel token counts/);
  assert.match(source, /selected sender\/list-forwarding token counts/);
  assert.match(source, /11 runtime background addFilteredChannel list-target fixtures/);
  assert.match(source, /forwards input, filter-all, collaborator metadata, profile, video id, and normalized list type/);
  assert.match(source, /declares `listType = 'blocklist'`/);
  assert.match(source, /caller-provided whitelist list type reaches the helper/);
  assert.match(source, /Main blocklist writes V4 `main\.channels`/);
  assert.match(source, /Main whitelist writes V4 `main\.whitelistChannels`/);
  assert.match(source, /Kids blocklist and whitelist write their matching V4\/V3 lists/);
  assert.match(source, /identity repair can read channel maps, fetch watch\/Shorts\/Kids identity/);
  assert.match(source, /null both compiled caches/);
  assert.match(source, /schedule list-target channel-add backups/);
  assert.match(source, /background addFilteredChannel still needs list-target contracts/);
  assert.match(source, /profile target reports/);
  assert.match(source, /storage-write reports/);
  assert.match(source, /identity-repair budgets/);
  assert.match(source, /`backgroundAddFilteredChannelListTargetContract`, `backgroundAddFilteredChannelReceiverReport`, `backgroundAddFilteredChannelSenderPolicy`, `backgroundAddFilteredChannelListTypeForwardingPolicy`, `backgroundAddFilteredChannelProfileTargetReport`, `backgroundAddFilteredChannelStorageWriteReport`, `backgroundAddFilteredChannelCacheInvalidationReport`, `backgroundAddFilteredChannelBackupPolicy`, `backgroundAddFilteredChannelIdentityRepairBudget`, or `backgroundAddFilteredChannelFixtureProvenance`/);
});

test('active goal completion audit records Filter All toggle list-target without declaring completion', () => {
  const source = doc();

  assert.match(source, /Filter All toggle list-target addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_FILTER_ALL_TOGGLE_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/filter-all-toggle-list-target-current-behavior\.test\.mjs/);
  assert.match(source, /per-channel Filter All mutation proof/);
  assert.match(source, /3 Filter All toggle source files/);
  assert.match(source, /5 source\/effect blocks/);
  assert.match(source, /14 background receiver lines/);
  assert.match(source, /413 receiver bytes/);
  assert.match(source, /95 background helper lines/);
  assert.match(source, /3435 helper bytes/);
  assert.match(source, /66 content bridge checkbox lines/);
  assert.match(source, /2391 checkbox bytes/);
  assert.match(source, /34 StateManager Main toggle lines/);
  assert.match(source, /988 Main toggle bytes/);
  assert.match(source, /36 StateManager Kids toggle lines/);
  assert.match(source, /1188 Kids toggle bytes/);
  assert.match(source, /selected Filter All toggle token counts/);
  assert.match(source, /selected zero whitelist\/sender token counts/);
  assert.match(source, /10 runtime Filter All toggle fixtures/);
  assert.match(source, /content bridge checkbox sends only `channelId` and `value`/);
  assert.match(source, /forwards only `message\.channelId` and `message\.value`/);
  assert.match(source, /schedules `filter_all_toggled` backup on success/);
  assert.match(source, /background helper reads root `filterChannels`/);
  assert.match(source, /finds exact id\/handle matches only there/);
  assert.match(source, /writes root `filterChannels` plus active V4 `main\.channels`/);
  assert.match(source, /does not update whitelist or Kids rows/);
  assert.match(source, /invalidates both compiled caches/);
  assert.match(source, /returns `Channel not found` for whitelist-only rows/);
  assert.match(source, /StateManager Main and Kids UI toggles return `false` in whitelist mode/);
  assert.match(source, /Kids UI toggles persist `kids\.blockedChannels`, refresh Kids, notify listeners, and schedule `kids_filter_all_toggled`/);
  assert.match(source, /Filter All toggle still needs list-target contracts/);
  assert.match(source, /row-action parity reports/);
  assert.match(source, /comment-scope reports/);
  assert.match(source, /`filterAllToggleListTargetContract`, `filterAllToggleReceiverReport`, `filterAllToggleSenderPolicy`, `filterAllToggleListTargetPolicy`, `filterAllToggleProfileTargetReport`, `filterAllToggleStorageWriteReport`, `filterAllToggleCacheInvalidationReport`, `filterAllToggleRowActionParityReport`, `filterAllToggleCommentScopeReport`, or `filterAllToggleFixtureProvenance`/);
});

test('active goal completion audit records Main Filter All comments scope without declaring completion', () => {
  const source = doc();

  assert.match(source, /Main Filter All comments scope addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_MAIN_FILTER_ALL_COMMENTS_SCOPE_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/main-filter-all-comments-scope-current-behavior\.test\.mjs/);
  assert.match(source, /comments-scope proof/);
  assert.match(source, /5 Main Filter All comments scope source files/);
  assert.match(source, /6 source\/effect blocks/);
  assert.match(source, /45 StateManager comments toggle lines/);
  assert.match(source, /1434 StateManager comments toggle bytes/);
  assert.match(source, /64 RenderEngine keyword comments toggle lines/);
  assert.match(source, /3192 keyword comments toggle bytes/);
  assert.match(source, /16 RenderEngine channel-ref lookup lines/);
  assert.match(source, /669 channel-ref lookup bytes/);
  assert.match(source, /72 settings_shared syncFilterAllKeywords lines/);
  assert.match(source, /2967 syncFilterAllKeywords bytes/);
  assert.match(source, /82 background syncStoredMainKeywordsWithChannels lines/);
  assert.match(source, /2534 background sync bytes/);
  assert.match(source, /33 filter_logic comment decision lines/);
  assert.match(source, /1902 comment decision bytes/);
  assert.match(source, /selected Main Filter All comments token counts/);
  assert.match(source, /10 runtime Main Filter All comments scope fixtures/);
  assert.match(source, /default missing `filterAllComments` to `true`, then persist `false`/);
  assert.match(source, /recompute saves a channel-derived keyword with `comments: false`/);
  assert.match(source, /Main whitelist mode returns `false` without save, broadcast, channel update event, or backup/);
  assert.match(source, /inactive `filterAll: false` rows can still persist latent `filterAllComments`/);
  assert.match(source, /settings_shared carries `filterAllComments` into `comments` and drops stale channel-derived keywords/);
  assert.match(source, /routes Main channel-derived comment toggles by `entry\.channelRef` through component, click, and keyboard paths/);
  assert.match(source, /while suppressing Kids comment controls/);
  assert.match(source, /mirrors the comments flag without explicit profile\/list-mode fields/);
  assert.match(source, /JSON comment filtering consumes compiled comment keyword regexes without row provenance/);
  assert.match(source, /Main Filter All comments scope still needs comments-scope contracts/);
  assert.match(source, /toggle mutation reports/);
  assert.match(source, /compiler parity reports/);
  assert.match(source, /JSON comment provenance reports/);
  assert.match(source, /inactive-row policies/);
  assert.match(source, /`mainFilterAllCommentsScopeContract`, `mainFilterAllCommentsToggleReport`, `mainFilterAllCommentsListModePolicy`, `mainFilterAllCommentsChannelRefPolicy`, `mainFilterAllCommentsCompilerParityReport`, `mainFilterAllCommentsJsonProvenanceReport`, `mainFilterAllCommentsInactiveFilterAllReport`, `mainFilterAllCommentsFixtureProvenance`, `mainFilterAllCommentsMetricArtifact`, or `mainFilterAllCommentsAuthorityGate`/);
});

test('active goal completion audit records addFilteredChannel Filter All comments default without declaring completion', () => {
  const source = doc();

  assert.match(source, /addFilteredChannel Filter All comments default addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_ADD_FILTERED_CHANNEL_FILTER_ALL_COMMENTS_DEFAULT_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/add-filtered-channel-filter-all-comments-default-current-behavior\.test\.mjs/);
  assert.match(source, /add-time comments default proof/);
  assert.match(source, /4 addFilteredChannel Filter All comments default source files/);
  assert.match(source, /8 source\/effect blocks/);
  assert.match(source, /54 content direct-add lines/);
  assert.match(source, /2662 content direct-add bytes/);
  assert.match(source, /39 background receiver lines/);
  assert.match(source, /1579 receiver bytes/);
  assert.match(source, /2 helper signature lines/);
  assert.match(source, /204 helper signature bytes/);
  assert.match(source, /21 existing-channel update lines/);
  assert.match(source, /1247 existing-channel update bytes/);
  assert.match(source, /20 new-channel object lines/);
  assert.match(source, /1081 new-channel object bytes/);
  assert.match(source, /106 background channel-derived helper\/sync lines/);
  assert.match(source, /3482 helper\/sync bytes/);
  assert.match(source, /12 StateManager enrichment message lines/);
  assert.match(source, /460 enrichment message bytes/);
  assert.match(source, /72 settings_shared syncFilterAllKeywords lines/);
  assert.match(source, /2967 syncFilterAllKeywords bytes/);
  assert.match(source, /selected addFilteredChannel Filter All comments token counts/);
  assert.match(source, /selected zero comments-scope token counts/);
  assert.match(source, /11 runtime addFilteredChannel Filter All comments default fixtures/);
  assert.match(source, /content `addChannelDirectly\(\)` sends `filterAll` and no `filterAllComments`/);
  assert.match(source, /YouTube Kids hostnames still omit `filterAllComments`/);
  assert.match(source, /secondary background receiver drops caller-provided `filterAllComments`, forwards eight helper arguments/);
  assert.match(source, /helper signature has no comments-scope parameter/);
  assert.match(source, /new channel rows store `filterAll: filterAll` without `filterAllComments`/);
  assert.match(source, /existing channel rows can enable `filterAll` while preserving any existing `filterAllComments`/);
  assert.match(source, /compilers default missing `filterAllComments` to `comments: true` and preserve explicit `false`/);
  assert.match(source, /StateManager enrichment sends `filterAll: false` with no comments-scope field/);
  assert.match(source, /backups do not distinguish add-time comments defaults/);
  assert.match(source, /JSON comment filtering later receives compiled comment regexes without add-time provenance/);
  assert.match(source, /addFilteredChannel Filter All comments defaults still need payload contracts/);
  assert.match(source, /default comments policies/);
  assert.match(source, /existing-row merge reports/);
  assert.match(source, /JSON comment provenance reports/);
  assert.match(source, /`addFilteredChannelFilterAllCommentsContract`, `addFilteredChannelFilterAllCommentsPayloadPolicy`, `addFilteredChannelFilterAllCommentsReceiverReport`, `addFilteredChannelFilterAllCommentsDefaultPolicy`, `addFilteredChannelFilterAllCommentsCompilerReport`, `addFilteredChannelFilterAllCommentsExistingRowReport`, `addFilteredChannelFilterAllCommentsJsonProvenanceReport`, `addFilteredChannelFilterAllCommentsBackupPolicy`, `addFilteredChannelFilterAllCommentsFixtureProvenance`, or `addFilteredChannelFilterAllCommentsAuthorityGate`/);
});

test('active goal completion audit records JSON comment keyword provenance without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON comment keyword provenance addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_COMMENT_KEYWORD_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/json-comment-keyword-provenance-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct JSON comment provenance proof/);
  assert.match(source, /3 JSON comment keyword provenance source files/);
  assert.match(source, /8 source\/effect blocks/);
  assert.match(source, /15 settings_shared compileKeywords lines/);
  assert.match(source, /740 compileKeywords bytes/);
  assert.match(source, /72 settings_shared syncFilterAllKeywords lines/);
  assert.match(source, /2971 syncFilterAllKeywords bytes/);
  assert.match(source, /2 buildCompiledSettings comments lines/);
  assert.match(source, /170 buildCompiledSettings comments bytes/);
  assert.match(source, /29 filter_logic processSettings regex lines/);
  assert.match(source, /1445 processSettings regex bytes/);
  assert.match(source, /95 filter_logic candidate metadata\/search lines/);
  assert.match(source, /4931 candidate metadata\/search bytes/);
  assert.match(source, /55 filter_logic global\/comment keyword branch lines/);
  assert.match(source, /3070 global\/comment keyword branch bytes/);
  assert.match(source, /7 background V4 comment compile lines/);
  assert.match(source, /370 V4 comment compile bytes/);
  assert.match(source, /35 background legacy comments fallback lines/);
  assert.match(source, /1961 legacy comments fallback bytes/);
  assert.match(source, /selected JSON comment keyword provenance token counts/);
  assert.match(source, /10 runtime JSON comment keyword provenance fixtures/);
  assert.match(source, /settings_shared keeps a `filterAllComments:false` channel-derived keyword in global `filterKeywords`/);
  assert.match(source, /excludes that keyword from `filterKeywordsComments`/);
  assert.match(source, /compiled keyword objects expose only `pattern` and `flags`/);
  assert.match(source, /filter_logic reconstructs global `filterKeywords` and `whitelistKeywords` but not serialized `filterKeywordsComments`/);
  assert.match(source, /comment text is included in JSON candidate metadata/);
  assert.match(source, /global keyword branch runs before the comment-specific branch/);
  assert.match(source, /comment mentioning a Filter All channel is removed by the global keyword branch even when that channel row has `filterAllComments:false`/);
  assert.match(source, /same comment survives when the global keyword list is removed/);
  assert.match(source, /serialized comments-only patterns are ignored while direct `RegExp` comment keywords still block/);
  assert.match(source, /background V4\/legacy comment compilers also emit compiled regex entries without row provenance/);
  assert.match(source, /JSON comment keyword provenance still needs provenance contracts/);
  assert.match(source, /global precedence reports/);
  assert.match(source, /false-hide budgets/);
  assert.match(source, /`jsonCommentKeywordProvenanceContract`, `jsonCommentKeywordGlobalPrecedenceReport`, `jsonCommentKeywordChannelScopePolicy`, `jsonCommentKeywordCompiledMetadataReport`, `jsonCommentKeywordSerializedReconstructionReport`, `jsonCommentKeywordDecisionOrderReport`, `jsonCommentKeywordFalseHideBudget`, `jsonCommentKeywordFixtureProvenance`, `jsonCommentKeywordMetricArtifact`, or `jsonCommentKeywordAuthorityGate`/);
});

test('active goal completion audit records JSON comment author channel provenance without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON comment author channel provenance addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_COMMENT_AUTHOR_CHANNEL_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/json-comment-author-channel-provenance-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct JSON comment author\/channel proof/);
  assert.match(source, /3 JSON comment author channel provenance source files/);
  assert.match(source, /8 source\/effect blocks/);
  assert.match(source, /5 filter_logic comment renderer rules lines/);
  assert.match(source, /229 comment renderer rules bytes/);
  assert.match(source, /17 filterChannels normalization lines/);
  assert.match(source, /1026 normalization bytes/);
  assert.match(source, /45 shouldBlock setup lines/);
  assert.match(source, /2191 setup bytes/);
  assert.match(source, /105 whitelist comment bypass lines/);
  assert.match(source, /5392 bypass bytes/);
  assert.match(source, /17 global channel branch lines/);
  assert.match(source, /1090 global channel bytes/);
  assert.match(source, /34 comment branch author lines/);
  assert.match(source, /1947 author branch bytes/);
  assert.match(source, /82 settings_shared sanitizeChannelEntry lines/);
  assert.match(source, /3619 sanitize bytes/);
  assert.match(source, /40 background compiled channel object lines/);
  assert.match(source, /2893 background object bytes/);
  assert.match(source, /selected JSON comment author channel token counts/);
  assert.match(source, /10 runtime JSON comment author channel provenance fixtures/);
  assert.match(source, /`commentRenderer` maps author browse id and author text to channel identity/);
  assert.match(source, /filter_logic preserves channel row fields during normalization/);
  assert.match(source, /whitelist fail-closed branch skips comment renderers/);
  assert.match(source, /global channel branch runs before comment-specific filtering/);
  assert.match(source, /matching `filterChannels` row removes a comment author even when `filterAll:false` and `filterAllComments:false`/);
  assert.match(source, /nonmatching row preserves the same comment/);
  assert.match(source, /whitelist mode still removes the comment when a matching dormant blocklist row remains/);
  assert.match(source, /empty whitelist without a blocklist row preserves the comment/);
  assert.match(source, /whitelist channel row alone does not route the comment author through the whitelist allow branch/);
  assert.match(source, /shared\/background compilers carry `filterAllComments` before filter_logic ignores it for author-channel comment decisions/);
  assert.match(source, /JSON comment author channel provenance still needs provenance contracts/);
  assert.match(source, /global branch reports/);
  assert.match(source, /whitelist-mode reports/);
  assert.match(source, /false-hide budgets/);
  assert.match(source, /`jsonCommentAuthorChannelProvenanceContract`, `jsonCommentAuthorChannelFilterAllCommentsPolicy`, `jsonCommentAuthorChannelGlobalBranchReport`, `jsonCommentAuthorChannelWhitelistModeReport`, `jsonCommentAuthorChannelCompiledMetadataReport`, `jsonCommentAuthorChannelDecisionOrderReport`, `jsonCommentAuthorChannelFalseHideBudget`, `jsonCommentAuthorChannelFixtureProvenance`, `jsonCommentAuthorChannelMetricArtifact`, or `jsonCommentAuthorChannelAuthorityGate`/);
});

test('active goal completion audit records JSON comment ViewModel parity without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON comment ViewModel parity addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_COMMENT_VIEW_MODEL_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/json-comment-view-model-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /modern comment-shape parity proof/);
  assert.match(source, /3 JSON comment ViewModel parity source files/);
  assert.match(source, /9 source\/effect blocks/);
  assert.match(source, /9 filter_logic comment rules lines/);
  assert.match(source, /380 comment rules bytes/);
  assert.match(source, /9 no-rule return lines/);
  assert.match(source, /411 no-rule return bytes/);
  assert.match(source, /34 comment decision lines/);
  assert.match(source, /1947 comment decision bytes/);
  assert.match(source, /10 seed active JSON rules lines/);
  assert.match(source, /634 active JSON bytes/);
  assert.match(source, /37 seed comment continuation shortcut lines/);
  assert.match(source, /2266 continuation shortcut bytes/);
  assert.match(source, /16 DOM fallback comments CSS lines/);
  assert.match(source, /671 comments CSS bytes/);
  assert.match(source, /12 DOM fallback comment setup lines/);
  assert.match(source, /877 setup bytes/);
  assert.match(source, /15 DOM fallback global hide lines/);
  assert.match(source, /535 global hide bytes/);
  assert.match(source, /99 DOM fallback ViewModel filtering lines/);
  assert.match(source, /5312 ViewModel filtering bytes/);
  assert.match(source, /selected JSON comment ViewModel parity token counts/);
  assert.match(source, /10 runtime JSON comment ViewModel parity fixtures/);
  assert.match(source, /direct JSON `commentViewModel` remains under `hideAllComments:true`/);
  assert.match(source, /direct JSON `commentRenderer` is removed under the same setting/);
  assert.match(source, /direct JSON `commentViewModel` remains under matching `filterKeywordsComments`/);
  assert.match(source, /direct JSON `commentRenderer` is removed by the same comments-only keyword/);
  assert.match(source, /direct JSON `commentViewModel` remains under matching global `filterKeywords`/);
  assert.match(source, /`commentThreadRenderer` wrapping a modern ViewModel survives comment-keyword filtering/);
  assert.match(source, /continuation response containing `commentViewModel` survives `hideAllComments:true`/);
  assert.match(source, /continuation response containing `commentRenderer` loses that item under `hideAllComments:true`/);
  assert.match(source, /source order keeps no-rule return before comment decisions/);
  assert.match(source, /DOM fallback contains a ViewModel-specific path while JSON renderer rules and seed continuation shortcut do not/);
  assert.match(source, /JSON comment ViewModel parity still needs parity contracts/);
  assert.match(source, /renderer-rule reports/);
  assert.match(source, /JSON decision reports/);
  assert.match(source, /false-hide\/leak budgets/);
  assert.match(source, /`jsonCommentViewModelParityContract`, `jsonCommentViewModelRendererRuleReport`, `jsonCommentViewModelJsonDecisionReport`, `jsonCommentViewModelContinuationPolicy`, `jsonCommentViewModelDomParityReport`, `jsonCommentViewModelGlobalHidePolicy`, `jsonCommentViewModelKeywordPolicy`, `jsonCommentViewModelStructuralWrapperReport`, `jsonCommentViewModelFalseHideLeakBudget`, or `jsonCommentViewModelAuthorityGate`/);
});

test('active goal completion audit records JSON comment structural wrapper cleanup without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON comment structural wrapper cleanup addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_COMMENT_STRUCTURAL_WRAPPER_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/json-comment-structural-wrapper-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /structural cleanup proof/);
  assert.match(source, /3 JSON comment structural wrapper cleanup source files/);
  assert.match(source, /10 source\/effect blocks/);
  assert.match(source, /10 filter_logic whitelist containers lines/);
  assert.match(source, /267 whitelist container bytes/);
  assert.match(source, /9 filter_logic comment rules lines/);
  assert.match(source, /380 comment rules bytes/);
  assert.match(source, /34 comment decision lines/);
  assert.match(source, /1947 comment decision bytes/);
  assert.match(source, /12 array recursion lines/);
  assert.match(source, /404 array recursion bytes/);
  assert.match(source, /11 object renderer removal lines/);
  assert.match(source, /536 object removal bytes/);
  assert.match(source, /9 recursive property copy lines/);
  assert.match(source, /347 property copy bytes/);
  assert.match(source, /5 seed engine catch lines/);
  assert.match(source, /220 engine catch bytes/);
  assert.match(source, /28 seed basic comment hide lines/);
  assert.match(source, /1574 basic comment hide bytes/);
  assert.match(source, /16 DOM fallback comments CSS lines/);
  assert.match(source, /671 comments CSS bytes/);
  assert.match(source, /15 DOM fallback global hide lines/);
  assert.match(source, /535 global hide bytes/);
  assert.match(source, /selected JSON comment structural cleanup token counts/);
  assert.match(source, /11 runtime JSON comment structural wrapper cleanup fixtures/);
  assert.match(source, /`hideAllComments:true` removes nested classic comments but leaves a top-level `itemSectionRenderer` comment section with empty `contents`/);
  assert.match(source, /preserves a mixed `itemSectionRenderer` wrapper when a non-comment sibling remains/);
  assert.match(source, /generic `itemSectionRenderer` wrapper also remains after nested comments are removed/);
  assert.match(source, /direct comment-keyword filtering can remove a nested direct `commentRenderer` while leaving the parent section wrapper empty/);
  assert.match(source, /`commentThreadRenderer` with raw comment fields survives comments-only keyword filtering/);
  assert.match(source, /continuation action wrappers can remain with empty `continuationItems` after engine filtering removes direct comment renderer items/);
  assert.match(source, /seed's engine-error fallback removes the whole watch-page comment section by splice while preserving a video sibling/);
  assert.match(source, /source order keeps renderer-object removal before recursive property copy/);
  assert.match(source, /DOM fallback has comment-section selectors and a global-hide branch without sharing JSON structural pruning/);
  assert.match(source, /JSON comment structural cleanup still needs structural cleanup contracts/);
  assert.match(source, /wrapper decision reports/);
  assert.match(source, /empty-wrapper pruning policies/);
  assert.match(source, /false-hide\/leak budgets/);
  assert.match(source, /`jsonCommentStructuralCleanupContract`, `jsonCommentStructuralWrapperDecisionReport`, `jsonCommentEmptyWrapperPruningPolicy`, `jsonCommentSectionSiblingPolicy`, `jsonCommentContinuationWrapperCleanupReport`, `jsonCommentSeedFallbackParityReport`, `jsonCommentDomStructuralParityReport`, `jsonCommentStructuralFalseHideLeakBudget`, `jsonCommentStructuralFixtureProvenance`, or `jsonCommentStructuralAuthorityGate`/);
});

test('active goal completion audit records XHR comment continuation parity without declaring completion', () => {
  const source = doc();

  assert.match(source, /XHR comment continuation parity addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_XHR_COMMENT_CONTINUATION_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/xhr-comment-continuation-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct transport parity proof/);
  assert.match(source, /2 XHR comment continuation parity source files/);
  assert.match(source, /6 source\/effect blocks/);
  assert.match(source, /86 seed fetch interception lines/);
  assert.match(source, /4259 fetch interception bytes/);
  assert.match(source, /38 seed fetch comment shortcut lines/);
  assert.match(source, /2266 shortcut bytes/);
  assert.match(source, /203 seed XHR interception lines/);
  assert.match(source, /9654 XHR interception bytes/);
  assert.match(source, /79 seed XHR processor lines/);
  assert.match(source, /4187 XHR processor bytes/);
  assert.match(source, /8 seed XHR endpoint lines/);
  assert.match(source, /242 endpoint bytes/);
  assert.match(source, /26 seed XHR send hook lines/);
  assert.match(source, /1186 send hook bytes/);
  assert.match(source, /selected fetch\/XHR shortcut token counts/);
  assert.match(source, /8 runtime XHR comment continuation parity fixtures/);
  assert.match(source, /fetch append comment continuation under `hideAllComments:true` bypasses the engine/);
  assert.match(source, /returns one synthetic end marker with `continuationEndpoint:null`/);
  assert.match(source, /XHR text and `responseType:"json"` append comment continuations call `processWithEngine\(\)`/);
  assert.match(source, /leave empty continuation arrays instead of a synthetic end marker/);
  assert.match(source, /XHR `commentViewModel` continuations survive `hideAllComments:true`/);
  assert.match(source, /XHR reload, replace, and `onResponseReceivedActions` append payloads share the generic engine path/);
  assert.match(source, /disabled XHR still marks and hooks the endpoint without response override/);
  assert.match(source, /XHR comment continuation parity still needs parity contracts/);
  assert.match(source, /transport parity reports/);
  assert.match(source, /synthetic-end policies/);
  assert.match(source, /body-mode reports/);
  assert.match(source, /ViewModel parity reports/);
  assert.match(source, /command parity reports/);
  assert.match(source, /`xhrCommentContinuationParityContract`, `xhrCommentContinuationDecisionReport`, `xhrCommentContinuationTransportParityReport`, `xhrCommentContinuationSyntheticEndPolicy`, `xhrCommentContinuationEngineBypassReport`, `xhrCommentContinuationBodyModeReport`, `xhrCommentContinuationViewModelParityReport`, `xhrCommentContinuationCommandParityReport`, `xhrCommentContinuationFixtureProvenance`, or `xhrCommentContinuationMetricArtifact`/);
});

test('active goal completion audit records JSON comment entity payload provenance without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON comment entity payload provenance addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_COMMENT_ENTITY_PAYLOAD_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/json-comment-entity-payload-provenance-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct entity payload proof/);
  assert.match(source, /3 JSON comment entity payload provenance source\/fixture files/);
  assert.match(source, /7 source\/effect blocks/);
  assert.match(source, /9 filter_logic comment renderer rule lines/);
  assert.match(source, /380 rule bytes/);
  assert.match(source, /46 candidate metadata lines/);
  assert.match(source, /2507 metadata bytes/);
  assert.match(source, /34 comment decision lines/);
  assert.match(source, /1947 decision bytes/);
  assert.match(source, /11 object renderer removal lines/);
  assert.match(source, /536 removal bytes/);
  assert.match(source, /9 recursive property copy lines/);
  assert.match(source, /347 copy bytes/);
  assert.match(source, /38 seed fetch comment shortcut lines/);
  assert.match(source, /2266 shortcut bytes/);
  assert.match(source, /47 fixture entity payload lines/);
  assert.match(source, /1834 fixture bytes/);
  assert.match(source, /selected runtime JS zero-token counts for entity payload authority strings/);
  assert.match(source, /selected fixture token counts/);
  assert.match(source, /10 runtime JSON comment entity payload provenance fixtures/);
  assert.match(source, /reduced fixture ties one visible `commentThreadRenderer` shell to one entity payload/);
  assert.match(source, /matching `commentKey`, `entityKey`, and payload key values/);
  assert.match(source, /product runtime JS lacks selected entity payload tokens/);
  assert.match(source, /global and comments-only keywords matching only entity payload text leave the response unchanged/);
  assert.match(source, /channel-id and handle filters matching only entity payload author fields leave the response unchanged/);
  assert.match(source, /`hideAllComments:true` removes the visible continuation item while preserving entity payload text and author identity/);
  assert.match(source, /`hideAllComments:true` plus the global entity keyword still preserves the entity payload/);
  assert.match(source, /fetch shortcut bypasses the engine, writes a synthetic end marker, and preserves `frameworkUpdates`/);
  assert.match(source, /JSON comment entity payload provenance still needs provenance contracts/);
  assert.match(source, /rule manifests/);
  assert.match(source, /text extraction policies/);
  assert.match(source, /author extraction policies/);
  assert.match(source, /join policies/);
  assert.match(source, /cleanup policies/);
  assert.match(source, /fetch shortcut policies/);
  assert.match(source, /`jsonCommentEntityPayloadProvenanceContract`, `jsonCommentEntityPayloadDecisionReport`, `jsonCommentEntityPayloadRuleManifest`, `jsonCommentEntityTextExtractionPolicy`, `jsonCommentEntityAuthorExtractionPolicy`, `jsonCommentEntityJoinPolicy`, `jsonCommentEntityCleanupPolicy`, `jsonCommentEntityFetchShortcutPolicy`, `jsonCommentEntityFixtureProvenance`, or `jsonCommentEntityMetricArtifact`/);
});

test('active goal completion audit records JSON comment continuation sibling preservation without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON comment continuation sibling preservation addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_COMMENT_CONTINUATION_SIBLING_PRESERVATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/json-comment-continuation-sibling-preservation-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct mixed-continuation proof/);
  assert.match(source, /2 JSON comment continuation sibling preservation source files/);
  assert.match(source, /6 source\/effect blocks/);
  assert.match(source, /38 seed fetch comment shortcut lines/);
  assert.match(source, /2266 shortcut bytes/);
  assert.match(source, /7 seed fetch normal processing lines/);
  assert.match(source, /417 normal-processing bytes/);
  assert.match(source, /12 filter_logic array recursion lines/);
  assert.match(source, /404 array recursion bytes/);
  assert.match(source, /11 object renderer removal lines/);
  assert.match(source, /536 removal bytes/);
  assert.match(source, /9 recursive property copy lines/);
  assert.match(source, /347 copy bytes/);
  assert.match(source, /34 comment decision lines/);
  assert.match(source, /1947 decision bytes/);
  assert.match(source, /selected seed\/filter_logic token counts/);
  assert.match(source, /fetch shortcut zero-token counts for header\/video sibling detection/);
  assert.match(source, /8 runtime JSON comment continuation sibling preservation fixtures/);
  assert.match(source, /engine filtering with `hideAllComments:true` removes a classic comment item from a mixed append continuation while preserving a header-like sibling/);
  assert.match(source, /fetch shortcut with the same mixed append continuation bypasses the engine and returns only the synthetic continuation item/);
  assert.match(source, /shortcut drops the header-like sibling, video sibling, and original continuation endpoint/);
  assert.match(source, /shortcut preserves response metadata and spread fields outside `onResponseReceivedEndpoints`/);
  assert.match(source, /fetch normal path with `hideAllComments:false` and a comments-only keyword removes the matching comment while preserving siblings/);
  assert.match(source, /non-comment-only append continuation reaches normal engine processing/);
  assert.match(source, /JSON comment continuation sibling preservation still needs sibling preservation contracts/);
  assert.match(source, /mixed collection policies/);
  assert.match(source, /header preservation policies/);
  assert.match(source, /video sibling policies/);
  assert.match(source, /endpoint preservation policies/);
  assert.match(source, /fetch replacement reports/);
  assert.match(source, /engine parity reports/);
  assert.match(source, /`jsonCommentContinuationSiblingPreservationContract`, `jsonCommentContinuationSiblingDecisionReport`, `jsonCommentContinuationMixedCollectionPolicy`, `jsonCommentContinuationHeaderPreservationPolicy`, `jsonCommentContinuationVideoSiblingPolicy`, `jsonCommentContinuationEndpointPreservationPolicy`, `jsonCommentContinuationFetchReplacementReport`, `jsonCommentContinuationEngineParityReport`, `jsonCommentContinuationSiblingFixtureProvenance`, or `jsonCommentContinuationSiblingMetricArtifact`/);
});

test('active goal completion audit records JSON comment continuation collection-root parity without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON comment continuation collection-root parity addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_COMMENT_CONTINUATION_COLLECTION_ROOT_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/json-comment-continuation-collection-root-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct collection-root proof/);
  assert.match(source, /2 JSON comment continuation collection-root parity source files/);
  assert.match(source, /5 source\/effect blocks/);
  assert.match(source, /38 seed fetch comment shortcut lines/);
  assert.match(source, /2266 shortcut bytes/);
  assert.match(source, /7 seed fetch normal processing lines/);
  assert.match(source, /417 normal-processing bytes/);
  assert.match(source, /12 filter_logic array recursion lines/);
  assert.match(source, /404 array recursion bytes/);
  assert.match(source, /11 object renderer removal lines/);
  assert.match(source, /536 removal bytes/);
  assert.match(source, /34 comment decision lines/);
  assert.match(source, /1947 decision bytes/);
  assert.match(source, /fetch shortcut onResponseReceivedEndpoints tokens: 2/);
  assert.match(source, /fetch shortcut onResponseReceivedActions tokens: 0/);
  assert.match(source, /fetch shortcut onResponseReceivedCommands tokens: 0/);
  assert.match(source, /fetch shortcut appendContinuationItemsAction tokens: 2/);
  assert.match(source, /fetch shortcut processWithEngine tokens: 0/);
  assert.match(source, /fetch normal processWithEngine tokens: 1/);
  assert.match(source, /selected seed\/filter_logic onResponseReceivedCommands tokens: 1/);
  assert.match(source, /selected seed\/filter_logic onResponseReceivedActions tokens: 2/);
  assert.match(source, /selected seed\/filter_logic onResponseReceivedEndpoints tokens: 4/);
  assert.match(source, /8 runtime JSON comment continuation collection-root parity fixtures/);
  assert.match(source, /endpoint-root append comments trigger the fetch shortcut and bypass the engine/);
  assert.match(source, /action-root append comments alone miss the shortcut and are removed by the normal engine path/);
  assert.match(source, /command-root append comments alone miss the shortcut and are removed by the normal engine path/);
  assert.match(source, /mixed endpoint\/action\/command roots with an endpoint-root comment trigger the shortcut and leave action-root and command-root comments unchanged/);
  assert.match(source, /endpoint-root non-comment append items do not trigger the shortcut, so action-root and command-root comments reach engine cleanup/);
  assert.match(source, /endpoint shortcut preserves non-endpoint roots and spread metadata/);
  assert.match(source, /shortcut source has no `onResponseReceivedActions` or `onResponseReceivedCommands` branch/);
  assert.match(source, /JSON comment continuation collection-root parity still needs collection-root contracts/);
  assert.match(source, /action-root policies/);
  assert.match(source, /command-root policies/);
  assert.match(source, /root precedence policies/);
  assert.match(source, /cross-root cleanup policies/);
  assert.match(source, /mixed-root leak budgets/);
  assert.match(source, /engine-bypass reports/);
  assert.match(source, /`jsonCommentContinuationCollectionRootParityContract`, `jsonCommentContinuationCollectionRootDecisionReport`, `jsonCommentContinuationActionRootPolicy`, `jsonCommentContinuationCommandRootPolicy`, `jsonCommentContinuationRootPrecedencePolicy`, `jsonCommentContinuationCrossRootCleanupPolicy`, `jsonCommentContinuationMixedRootLeakBudget`, `jsonCommentContinuationRootEngineBypassReport`, `jsonCommentContinuationCollectionRootFixtureProvenance`, or `jsonCommentContinuationCollectionRootMetricArtifact`/);
});

test('active goal completion audit records JSON comment continuation command-shape parity without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON comment continuation command-shape parity addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_COMMENT_CONTINUATION_COMMAND_SHAPE_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/json-comment-continuation-command-shape-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct command-shape proof/);
  assert.match(source, /2 JSON comment continuation command-shape parity source files/);
  assert.match(source, /5 source\/effect blocks/);
  assert.match(source, /38 seed fetch comment shortcut lines/);
  assert.match(source, /2266 shortcut bytes/);
  assert.match(source, /7 seed fetch normal processing lines/);
  assert.match(source, /417 normal-processing bytes/);
  assert.match(source, /12 filter_logic array recursion lines/);
  assert.match(source, /404 array recursion bytes/);
  assert.match(source, /11 object renderer removal lines/);
  assert.match(source, /536 removal bytes/);
  assert.match(source, /34 comment decision lines/);
  assert.match(source, /1947 decision bytes/);
  assert.match(source, /fetch shortcut appendContinuationItemsAction tokens: 2/);
  assert.match(source, /fetch shortcut reloadContinuationItemsCommand tokens: 0/);
  assert.match(source, /fetch shortcut replaceContinuationItemsCommand tokens: 0/);
  assert.match(source, /fetch shortcut processWithEngine tokens: 0/);
  assert.match(source, /fetch normal processWithEngine tokens: 1/);
  assert.match(source, /2 seed layout continuation-key rows with append\/reload\/replace/);
  assert.match(source, /6 runtime JSON comment continuation command-shape parity fixtures/);
  assert.match(source, /endpoint-root append classic comments trigger the fetch shortcut, bypass the engine, and return one synthetic append end marker/);
  assert.match(source, /endpoint-root reload classic comments do not trigger the shortcut and are removed by the normal engine path/);
  assert.match(source, /endpoint-root replace classic comments do not trigger the shortcut and are removed by the normal engine path/);
  assert.match(source, /endpoint-root append non-comment items plus reload\/replace comments do not trigger the shortcut/);
  assert.match(source, /endpoint-root append classic comments plus reload\/replace classic comments trigger the shortcut and drop reload\/replace entries through root replacement without engine decisions/);
  assert.match(source, /endpoint-root append classic comments plus reload\/replace non-comment items trigger the shortcut and drop non-comment reload\/replace siblings before engine traversal/);
  assert.match(source, /JSON comment continuation command-shape parity still needs command-shape contracts/);
  assert.match(source, /append command policies/);
  assert.match(source, /reload command policies/);
  assert.match(source, /replace command policies/);
  assert.match(source, /mixed-command cleanup policies/);
  assert.match(source, /non-comment command sibling policies/);
  assert.match(source, /command engine-bypass reports/);
  assert.match(source, /`jsonCommentContinuationCommandShapeParityContract`, `jsonCommentContinuationCommandShapeDecisionReport`, `jsonCommentContinuationAppendCommandPolicy`, `jsonCommentContinuationReloadCommandPolicy`, `jsonCommentContinuationReplaceCommandPolicy`, `jsonCommentContinuationMixedCommandCleanupPolicy`, `jsonCommentContinuationNonCommentCommandSiblingPolicy`, `jsonCommentContinuationCommandEngineBypassReport`, `jsonCommentContinuationCommandFixtureProvenance`, or `jsonCommentContinuationCommandMetricArtifact`/);
});

test('active goal completion audit records JSON comment continuation raw-URL admission without declaring completion', () => {
  const source = doc();

  assert.match(source, /JSON comment continuation raw-URL admission addendum/);
  assert.match(source, /docs\/audit\/FILTERTUBE_JSON_COMMENT_CONTINUATION_RAW_URL_ADMISSION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(source, /tests\/runtime\/json-comment-continuation-raw-url-admission-boundary-current-behavior\.test\.mjs/);
  assert.match(source, /direct comment-continuation URL admission proof/);
  assert.match(source, /1 JSON comment continuation raw-URL admission source file/);
  assert.match(source, /4 source\/effect blocks/);
  assert.match(source, /86 seed fetch interception lines/);
  assert.match(source, /4259 interception bytes/);
  assert.match(source, /8 seed fetch admission gate lines/);
  assert.match(source, /355 admission bytes/);
  assert.match(source, /38 seed fetch comment shortcut lines/);
  assert.match(source, /2266 shortcut bytes/);
  assert.match(source, /5 seed fetch catch fallback lines/);
  assert.match(source, /247 catch bytes/);
  assert.match(source, /1 fetch endpoint raw `urlStr\.includes` gate/);
  assert.match(source, /1 fetch comment shortcut raw `url\.includes` gate/);
  assert.match(source, /1 Request\.url extraction site/);
  assert.match(source, /1 response clone JSON site/);
  assert.match(source, /1 catch original-response return site/);
  assert.match(source, /0 shortcut `processWithEngine` tokens/);
  assert.match(source, /1 normal `processWithEngine` token/);
  assert.match(source, /9 runtime JSON comment continuation raw-URL admission fixtures/);
  assert.match(source, /exact string `\/youtubei\/v1\/next` returns one synthetic end marker/);
  assert.match(source, /query-only raw next text on `\/watch`/);
  assert.match(source, /hash-fragment raw next text on `\/watch`/);
  assert.match(source, /longer-path `\/youtubei\/v1\/nextExtra`/);
  assert.match(source, /cross-origin exact `\/youtubei\/v1\/next`/);
  assert.match(source, /fetch `Request` object follows the string URL shortcut path/);
  assert.match(source, /fetch `URL` object parses response JSON, skips `processWithEngine\(\)`, skips response rebuild, and returns the original comment body/);
  assert.match(source, /query-only raw endpoint text with `hideAllComments:false` still reaches normal processing with data label `fetch:\/watch`/);
  assert.match(source, /nonmatching raw URL avoids clone, parse, process, stringify, and shortcut work/);
  assert.match(source, /JSON comment continuation raw-URL admission still needs raw admission contracts/);
  assert.match(source, /parsed endpoint decisions/);
  assert.match(source, /query endpoint policies/);
  assert.match(source, /hash endpoint policies/);
  assert.match(source, /longer-path policies/);
  assert.match(source, /cross-origin policies/);
  assert.match(source, /URL object policies/);
  assert.match(source, /`jsonCommentContinuationRawUrlAdmissionContract`, `jsonCommentContinuationParsedEndpointDecision`, `jsonCommentContinuationRawUrlDecisionReport`, `jsonCommentContinuationQueryEndpointPolicy`, `jsonCommentContinuationHashEndpointPolicy`, `jsonCommentContinuationLongerPathPolicy`, `jsonCommentContinuationCrossOriginPolicy`, `jsonCommentContinuationUrlObjectPolicy`, `jsonCommentContinuationRawUrlFixtureProvenance`, or `jsonCommentContinuationRawUrlMetricArtifact`/);
});

test('active goal completion audit records Kids latest JSON owner-extension fixture without declaring completion', () => {
  const source = doc();

  assert.match(source, /Kids latest JSON owner-extension fixture addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_KIDS_LATEST_JSON_OWNER_EXTENSION_FIXTURE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(source.includes('tests/runtime/kids-latest-json-owner-extension-fixture-boundary-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/fixtures/captures/kids-latest-compact-video-owner-extension.json'));
  assert.match(source, /direct Kids JSON owner-extension proof/);
  assert.match(source, /3 source\/fixture files/);
  assert.match(source, /60 `compactVideoRenderer`/);
  assert.match(source, /60 `kidsVideoOwnerExtension`/);
  assert.match(source, /60 `externalChannelId`/);
  assert.match(source, /60 `KIDS_BLOCK`/);
  assert.match(source, /36 base video rules lines/);
  assert.match(source, /1575 base video rules bytes/);
  assert.match(source, /9 shared video renderer mapping lines/);
  assert.match(source, /415 shared mapping bytes/);
  assert.match(source, /55 harvest renderer mapping lines/);
  assert.match(source, /2535 harvest mapping bytes/);
  assert.match(source, /36 harvest Kids owner lines/);
  assert.match(source, /1887 harvest Kids owner bytes/);
  assert.match(source, /17 video channel map registration lines/);
  assert.match(source, /636 registration bytes/);
  assert.match(source, /13 video map fallback decision lines/);
  assert.match(source, /556 fallback bytes/);
  assert.match(source, /`kidsVideoOwnerExtension`: 2/);
  assert.match(source, /`compactVideoRenderer`: 9/);
  assert.match(source, /`videoChannelMap`: 8/);
  assert.match(source, /`FilterTube_UpdateVideoChannelMap`: 1/);
  assert.match(source, /6 runtime Kids latest owner extension fixtures/);
  assert.ok(source.includes('nGKm7EQ09rE` -> `UCO0vPDAqN7BTK9kNAeP3sKw'));
  assert.ok(source.includes('HgwlTY7M4og` -> `UChhs18W6Mp4MSB3FskumnXw'));
  assert.match(source, /matching blocklist owner removes the first and preserves the nonmatching sibling/);
  assert.match(source, /stripped byline endpoints still block through `kidsVideoOwnerExtension` harvest into `videoChannelMap` fallback in the same pass/);
  assert.match(source, /whitelist mode preserves the matching owner and removes the nonmatching sibling/);
  assert.match(source, /queues `FilterTube_UpdateVideoChannelMap` for both videos/);
  assert.ok(source.includes('yt_kids_latest.json` to partial-extracted'));
  assert.ok(source.includes('ytkids_browse?alt=json.json` remains unextracted/malformed direct JSON'));
  assert.match(source, /Kids latest JSON owner-extension proof still needs fixture contracts/);

  for (const symbol of [
    'kidsLatestJsonOwnerExtensionFixtureContract',
    'kidsLatestCompactVideoOwnerDecisionReport',
    'kidsLatestOwnerExtensionHarvestReport',
    'kidsLatestSiblingPreservationFixture',
    'kidsLatestWhitelistDecisionPolicy',
    'kidsLatestRawCaptureProvenance',
    'kidsLatestVideoChannelMapSideEffectReport',
    'kidsLatestNativeParityReport',
    'kidsLatestMetricArtifact',
    'kidsLatestJsonFirstAuthorityGate'
  ]) {
    assert.ok(source.includes(symbol), `missing future authority symbol ${symbol}`);
  }
});

test('active goal completion audit records Kids browse malformed fragment fixture without declaring completion', () => {
  const source = doc();

  assert.match(source, /Kids browse malformed fragment addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_KIDS_BROWSE_MALFORMED_FRAGMENT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(source.includes('tests/runtime/kids-browse-malformed-fragment-boundary-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/fixtures/captures/kids-browse-malformed-fragment-compact-video.json'));
  assert.match(source, /direct malformed Kids browse fragment proof/);
  assert.match(source, /3 source\/fixture files/);
  assert.match(source, /direct raw JSON parse failure/);
  assert.match(source, /5 balanced top-level JSON fragments/);
  assert.match(source, /browse fragment index 4 at line 688 with 423123 bytes/);
  assert.match(source, /40 `compactVideoRenderer`/);
  assert.match(source, /40 `kidsVideoOwnerExtension`/);
  assert.match(source, /40 `externalChannelId`/);
  assert.match(source, /40 `KIDS_BLOCK`/);
  assert.match(source, /5 `kidsSlimOwnerRenderer`/);
  assert.match(source, /1 `accounts_list\?alt=json`/);
  assert.match(source, /2 `next XHR -` markers/);
  assert.match(source, /`kidsSlimOwnerRenderer`: 0/);
  assert.match(source, /`kidsLibraryRenderer`: 0/);
  assert.match(source, /`compactVideoRenderer`: 9/);
  assert.match(source, /`kidsVideoOwnerExtension`: 2/);
  assert.match(source, /`videoChannelMap`: 8/);
  assert.match(source, /7 runtime Kids browse malformed fragment fixtures/);
  assert.ok(source.includes('Gh-XKNuvvC4` -> `UC5PYHgAzJ1wLEidB58SK6Xw'));
  assert.ok(source.includes('G-xKXHAWPYU` -> `UCw0Mbalwv25Zk756uAONAmg'));
  assert.match(source, /matching blocklist owner removes the matching compact video while owner rail entries remain visible/);
  assert.match(source, /whitelist mode preserves the matching compact video and removes the nonmatching compact sibling while owner rail entries remain visible/);
  assert.match(source, /queues three `FilterTube_UpdateChannelMap` messages and one `FilterTube_UpdateVideoChannelMap` message/);
  assert.match(source, /moves `ytkids_browse\?alt=json\.json` to partial-extracted while preserving the malformed direct-JSON warning/);
  assert.match(source, /Kids browse malformed fragment proof still needs raw-container contracts/);

  for (const symbol of [
    'kidsBrowseMalformedFragmentContract',
    'kidsBrowseRawContainerAdmissionReport',
    'kidsBrowseFragmentExtractionPolicy',
    'kidsBrowseCompactVideoDecisionReport',
    'kidsBrowseOwnerRailDecisionReport',
    'kidsBrowseOwnerRailWhitelistPolicy',
    'kidsBrowseVideoMapSideEffectReport',
    'kidsBrowseNativeWebViewParityReport',
    'kidsBrowseMetricArtifact',
    'kidsBrowseJsonFirstAuthorityGate'
  ]) {
    assert.ok(source.includes(symbol), `missing future authority symbol ${symbol}`);
  }
});

test('active goal completion audit records Main watch get-watch fixture without declaring completion', () => {
  const source = doc();

  assert.match(source, /Main watch get-watch playlist\/end-screen addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_MAIN_WATCH_GET_WATCH_PLAYLIST_END_SCREEN_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(source.includes('tests/runtime/main-watch-get-watch-playlist-end-screen-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/fixtures/captures/main-watch-get-watch-playlist-end-screen.json'));
  assert.match(source, /direct watch\/next fixture proof/);
  assert.match(source, /3 source\/fixture files/);
  assert.match(source, /`get_watch\?prettyPrint=false\.json` as a valid direct JSON array/);
  assert.match(source, /`watchpage\.json` as a Markdown\/`var ytInitialData` container warning/);
  assert.match(source, /25 traversed `playlistPanelVideoRenderer` rows/);
  assert.match(source, /8 traversed `endScreenVideoRenderer` rows/);
  assert.match(source, /0 `compactAutoplayRenderer` rows/);
  assert.match(source, /9 runtime Main watch get-watch fixtures/);
  assert.match(source, /no-rule processing passes through two playlist-panel siblings and two end-screen siblings unchanged/);
  assert.match(source, /blocklist mode removes matching playlist\/end-screen rows while preserving nonmatching siblings/);
  assert.match(source, /whitelist mode is global across the reduced response/);
  assert.match(source, /queues one `FilterTube_UpdateChannelMap` message and one `FilterTube_UpdateVideoChannelMap` message/);
  assert.match(source, /moves `get_watch\?prettyPrint=false\.json` to partial-extracted while `watchpage\.json` remains a separate embedded-container obligation/);
  assert.match(source, /Main watch get-watch proof still needs DOM wall/);

  for (const symbol of [
    'mainWatchGetWatchPlaylistEndScreenContract',
    'mainWatchGetWatchFixtureAdmissionReport',
    'mainWatchPlaylistPanelDecisionReport',
    'mainWatchEndScreenDecisionReport',
    'mainWatchWhitelistFamilyScopePolicy',
    'mainWatchVideoMapSideEffectReport',
    'mainWatchRawShapeClassifier',
    'mainWatchCompactAutoplayFixtureGate',
    'mainWatchDomWallParityReport',
    'mainWatchJsonFirstOptimizationBudget'
  ]) {
    assert.ok(source.includes(symbol), `missing future authority symbol ${symbol}`);
  }
});

test('active goal completion audit records Main upnext watchpage3 endpoint fixture without declaring completion', () => {
  const source = doc();

  assert.match(source, /Main upnext feed watchpage3 autoplay previous\/end-screen addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_MAIN_UPNEXT_FEED_WATCHPAGE3_AUTOPLAY_PREVIOUS_END_SCREEN_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(source.includes('tests/runtime/main-upnext-feed-watchpage3-autoplay-previous-end-screen-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/fixtures/captures/main-upnext-feed-watchpage3-autoplay-previous-end-screen.json'));
  assert.match(source, /embedded `ytInitialData` watch payload/);
  assert.match(source, /56516 raw source lines/);
  assert.match(source, /6000015 raw source bytes/);
  assert.match(source, /assignment span `23\.\.5942993`/);
  assert.match(source, /5945215 embedded bytes/);
  assert.match(source, /two `previousButtonVideo` tokens/);
  assert.match(source, /zero `compactAutoplayRenderer` tokens/);
  assert.match(source, /29 raw `playlistPanelVideoRenderer` tokens/);
  assert.match(source, /12 raw `endScreenVideoRenderer` tokens/);
  assert.match(source, /28 parsed playlist-panel keys/);
  assert.match(source, /11 parsed end-screen keys/);
  assert.match(source, /12 runtime watchpage3 fixtures/);
  assert.match(source, /endpoint-only autoplay\/next\/previous objects pass through and queue no map side effects/);
  assert.match(source, /whitelist nonmatch removes supported rows while `autoplayVideo`, `nextButtonVideo`, and `previousButtonVideo` remain/);
  assert.match(source, /whitelist match can preserve Stephen Barton rows while `previousButtonVideo` still points to nonmatching `TSHg9Kg_ciM`/);

  for (const symbol of [
    'mainUpnextWatchpage3YtInitialDataContract',
    'mainUpnextWatchpage3PreviousEndpointPolicy',
    'mainUpnextWatchpage3PlayerOverlayEndScreenParityReport',
    'mainUpnextWatchpage3WhitelistEndpointDecisionReport',
    'mainUpnextWatchpage3RawShapeExtractor',
    'mainUpnextWatchpage3EndpointSideEffectReport',
    'mainUpnextWatchpage3JsonFirstOptimizationBudget'
  ]) {
    assert.ok(source.includes(symbol), `missing future authority symbol ${symbol}`);
  }
});

test('active goal completion audit records Main upnext watchpage lockup continuation fixture without declaring completion', () => {
  const source = doc();

  assert.match(source, /Main upnext feed watchpage lockup continuation addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_MAIN_UPNEXT_FEED_WATCHPAGE_LOCKUP_CONTINUATION_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(source.includes('tests/runtime/main-upnext-feed-watchpage-lockup-continuation-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/fixtures/captures/main-upnext-feed-watchpage-lockup-continuation.json'));
  assert.match(source, /prose-plus-balanced-fragments/);
  assert.match(source, /watch-next-feed/);
  assert.match(source, /19918 raw source lines/);
  assert.match(source, /852491 raw source bytes/);
  assert.match(source, /direct raw JSON parse failure/);
  assert.match(source, /watch-next fragment start line 139/);
  assert.match(source, /840530 watch-next fragment bytes/);
  assert.match(source, /20 parsed `lockupViewModel` keys/);
  assert.match(source, /zero parsed `compactAutoplayRenderer`, `endScreenVideoRenderer`, and `playlistPanelVideoRenderer` keys/);
  assert.match(source, /7 runtime watchpage lockup continuation fixtures/);
  assert.match(source, /no-rule processing preserves the video lockup and Mix playlist sibling/);
  assert.match(source, /Mix display metadata is keyword-searchable but not creator-channel identity/);
  assert.match(source, /whitelist channel allow preserves the matching video lockup while removing the unresolved Mix sibling/);

  for (const symbol of [
    'mainUpnextWatchpageLockupContinuationContract',
    'mainUpnextWatchpageLockupDecisionReport',
    'mainUpnextWatchpageTargetIdPolicy',
    'mainUpnextWatchpageMixIdentityPolicy',
    'mainUpnextWatchpageMapSideEffectReport',
    'mainUpnextWatchpageSiblingPreservationFixture',
    'mainUpnextWatchpageMetricArtifact',
    'mainUpnextWatchpageJsonFirstGate'
  ]) {
    assert.ok(source.includes(symbol), `missing future authority symbol ${symbol}`);
  }
});

test('active goal completion audit records Main upnext watchpage2 claim-prefaced fixture without declaring completion', () => {
  const source = doc();

  assert.match(source, /Main upnext feed watchpage2 claim-prefaced lockup continuation addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_MAIN_UPNEXT_FEED_WATCHPAGE2_CLAIM_PREFACED_LOCKUP_CONTINUATION_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(source.includes('tests/runtime/main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/fixtures/captures/main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation.json'));
  assert.match(source, /claim-prefaced `\/youtubei\/v1\/next` payload/);
  assert.match(source, /20079 raw source lines/);
  assert.match(source, /863854 raw source bytes/);
  assert.match(source, /direct raw JSON parse failure/);
  assert.match(source, /fragment start line 63/);
  assert.match(source, /857711 fragment bytes/);
  assert.match(source, /20 parsed `lockupViewModel` keys/);
  assert.match(source, /three parsed `shortsLockupViewModel` keys/);
  assert.match(source, /zero parsed `compactAutoplayRenderer`, `autoplayVideo`, `nextButtonVideo`, `previousButtonVideo`, `endScreenVideoRenderer`, `playlistPanelVideoRenderer`, `showDialogCommand`, `coAuthors`, `ownerText`, `bylineText`, and `avatarStackViewModel` keys/);
  assert.match(source, /8 runtime watchpage2 claim-prefaced continuation fixtures/);
  assert.match(source, /prose collaborator tokens exist in the raw prelude but are not parsed collaborator roster proof/);
  assert.match(source, /no-rule processing preserves two video lockups and queues two channel-map messages plus one video-map payload/);
  assert.match(source, /whitelist channel allow preserves only the matching row/);
  assert.match(source, /parsed collaborator roster proof/);

  for (const symbol of [
    'mainUpnextWatchpage2ClaimPrefacedContract',
    'mainUpnextWatchpage2RawClaimClassifier',
    'mainUpnextWatchpage2LockupDecisionReport',
    'mainUpnextWatchpage2CollaboratorClaimPolicy',
    'mainUpnextWatchpage2TargetIdPolicy',
    'mainUpnextWatchpage2MapSideEffectReport',
    'mainUpnextWatchpage2SiblingPreservationFixture',
    'mainUpnextWatchpage2JsonFirstGate'
  ]) {
    assert.ok(source.includes(symbol), `missing future authority symbol ${symbol}`);
  }
});

test('active goal completion audit records Main search universal watch-card fixture without declaring completion', () => {
  const source = doc();

  assert.match(source, /Main search universal watch-card addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_MAIN_SEARCH_UNIVERSAL_WATCH_CARD_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(source.includes('tests/runtime/main-search-universal-watch-card-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/fixtures/captures/main-search-universal-watch-card-renderer.json'));
  assert.match(source, /direct search hero-card fixture proof/);
  assert.match(source, /3 source\/fixture files/);
  assert.match(source, /`strange_ytInitialData\.json` as a non-direct-JSON escaped `var ytInitialData` string literal/);
  assert.match(source, /2 `universalWatchCardRenderer`/);
  assert.match(source, /2 `watchCardRichHeaderRenderer`/);
  assert.match(source, /2 `watchCardHeroVideoRenderer`/);
  assert.match(source, /21 `searchRefinementCardRenderer`/);
  assert.match(source, /2 `compactChannelRenderer`/);
  assert.match(source, /121-line reduced fixture/);
  assert.match(source, /6 runtime Main search universal watch-card fixtures/);
  assert.match(source, /no-rule processing passes the hero card through unchanged with no map side effects/);
  assert.match(source, /blocklist keyword or channel identity removes the wrapper/);
  assert.match(source, /whitelist mode preserves a matching channel and removes a nonmatching one/);
  assert.match(source, /direct `watchCardHeroVideoRenderer`, `watchCardRichHeaderRenderer`, and `watchCardRHPanelVideoRenderer` remain absent from direct `FILTER_RULES`/);
  assert.match(source, /raw hero video ID sits under `navigationEndpoint\.watchEndpoint`/);
  assert.match(source, /Main search watch-card proof still needs direct child renderer policy/);

  for (const symbol of [
    'mainSearchUniversalWatchCardContract',
    'mainSearchUniversalWatchCardFixtureAdmissionReport',
    'mainSearchUniversalWatchCardDecisionReport',
    'mainSearchUniversalWatchCardWhitelistPolicy',
    'mainSearchUniversalWatchCardHeroVideoPathPolicy',
    'mainSearchDirectWatchCardChildRendererPolicy',
    'mainSearchEscapedYtInitialDataAdmissionReport',
    'mainSearchWatchCardSiblingLeakReport',
    'mainSearchWatchCardMetricArtifact',
    'mainSearchWatchCardJsonFirstOptimizationBudget'
  ]) {
    assert.ok(source.includes(symbol), `missing future authority symbol ${symbol}`);
  }
});

test('active goal completion audit records Main search compact channel fixture without declaring completion', () => {
  const source = doc();

  assert.match(source, /Main search compact channel addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_MAIN_SEARCH_COMPACT_CHANNEL_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(source.includes('tests/runtime/main-search-compact-channel-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/fixtures/captures/main-search-compact-channel-renderer.json'));
  assert.match(source, /direct search channel-card fixture proof/);
  assert.match(source, /3 source\/fixture files/);
  assert.match(source, /`strange_ytInitialData\.json` as a non-direct-JSON escaped `var ytInitialData` string literal/);
  assert.match(source, /2 `compactChannelRenderer`/);
  assert.match(source, /21 `searchRefinementCardRenderer`/);
  assert.match(source, /2 `universalWatchCardRenderer`/);
  assert.match(source, /90-line reduced fixture/);
  assert.match(source, /7 runtime Main search compact channel fixtures/);
  assert.match(source, /no-rule processing passes the channel card through unchanged while queuing one `FilterTube_UpdateChannelMap` side effect/);
  assert.match(source, /blocklist keyword and channel rules pass through the captured channel card/);
  assert.match(source, /whitelist mode preserves the channel card both when the channel matches and when it does not match/);
  assert.match(source, /matching channel rule removes the supported universal watch-card sibling while leaving the compact channel row visible/);
  assert.match(source, /`compactChannelRenderer` remains absent from direct `FILTER_RULES`/);
  assert.match(source, /Main search compact channel proof still needs direct rule policy/);

  for (const symbol of [
    'mainSearchCompactChannelContract',
    'mainSearchCompactChannelFixtureAdmissionReport',
    'mainSearchCompactChannelDecisionReport',
    'mainSearchCompactChannelWhitelistPolicy',
    'mainSearchCompactChannelSideEffectReport',
    'mainSearchCompactChannelSiblingLeakReport',
    'mainSearchCompactChannelEscapedYtInitialDataAdmissionReport',
    'mainSearchCompactChannelMetricArtifact',
    'mainSearchCompactChannelJsonFirstOptimizationBudget'
  ]) {
    assert.ok(source.includes(symbol), `missing future authority symbol ${symbol}`);
  }
});

test('active goal completion audit records DOMs.html classification without declaring completion', () => {
  const source = doc();

  assert.match(source, /DOMs\.html mutated Main DOM classification addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_DOMS_HTML_MUTATED_MAIN_DOM_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(source.includes('tests/runtime/doms-html-mutated-main-dom-classification-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/fixtures/captures/main-doms-mutated-main-dom.html'));
  assert.match(source, /stale post-obligation wording toward direct raw-shape classification proof/);
  assert.match(source, /3 source\/fixture files/);
  assert.match(source, /raw `DOMs\.html` sha256 `1e36cfc6bdf9272f1febe54445646ea26c482d4346114727a363cee8cf042c5e`/);
  assert.match(source, /6759 raw lines/);
  assert.match(source, /11 pinned raw headings/);
  assert.match(source, /10 FilterTube mutation markers/);
  assert.match(source, /8 absent post\/community tokens/);
  assert.match(source, /one reduced mixed-Main DOM fixture/);
  assert.match(source, /5 runtime DOMs\.html classification fixtures/);
  assert.match(source, /already mutated by FilterTube quick-block\/fallback-menu\/processed\/card identity markers/);
  assert.match(source, /lacks clean post\/backstage\/header\/action-menu\/permalink tokens/);
  assert.match(source, /raw capture indexing moves `DOMs\.html` to partial-extracted while keeping Main post\/community insertion proof blocked/);
  assert.match(source, /DOMs\.html classification still needs clean Main post\/community DOM fixtures/);

  for (const symbol of [
    'domsHtmlCaptureClassification',
    'rawDomMutationStateReport',
    'postCommunityFixtureReadinessReport',
    'mainPostMenuInsertionFixture',
    'mainPostSiblingVisibilityFixture',
    'mainDomMutatedCapturePolicy'
  ]) {
    assert.ok(source.includes(symbol), `missing future authority symbol ${symbol}`);
  }
});

test('active goal completion audit records watchpage embedded postRenderer proof without declaring completion', () => {
  const source = doc();

  assert.match(source, /Watchpage embedded postRenderer addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_WATCHPAGE_EMBEDDED_POST_RENDERER_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(source.includes('tests/runtime/watchpage-embedded-post-renderer-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/fixtures/captures/main-watchpage-embedded-post-renderer.json'));
  assert.match(source, /direct embedded postRenderer proof/);
  assert.match(source, /3 source\/fixture files/);
  assert.match(source, /raw `watchpage\.json` sha256 `baf8a78adbbc5509c3ab50e4a26131ba294293771b89666498f34324cbd82ab3`/);
  assert.match(source, /32116 raw lines/);
  assert.match(source, /4572676 raw bytes/);
  assert.match(source, /Markdown plus `var ytInitialData` container/);
  assert.match(source, /embedded object span `10468\.\.4572046`/);
  assert.match(source, /4561578 embedded bytes/);
  assert.match(source, /2 parsed `postRenderer` keys/);
  assert.match(source, /24 `lockupViewModel` keys/);
  assert.match(source, /18 `shortsLockupViewModel` keys/);
  assert.match(source, /3 raw text `postRenderer` tokens/);
  assert.match(source, /8 runtime watchpage embedded postRenderer fixtures/);
  assert.match(source, /direct raw JSON parsing throws/);
  assert.match(source, /twoColumnBrowseResultsRenderer` rich-grid content with `FEwhat_to_watch` values rather than `twoColumnWatchNextResults/);
  assert.match(source, /blocklist keyword and channel rules leave both posts visible/);
  assert.match(source, /whitelist matching and nonmatching modes leave both posts visible/);
  assert.match(source, /queues two `FilterTube_UpdateChannelMap` messages/);
  assert.match(source, /supported `backstagePostRenderer` sibling can be filtered while the captured modern `postRenderer` row remains visible/);

  for (const symbol of [
    'watchpageEmbeddedPostRendererContract',
    'watchpageEmbeddedPostRendererFixtureAdmissionReport',
    'watchpagePostRendererDecisionReport',
    'watchpagePostRendererWhitelistPolicy',
    'watchpagePostRendererRouteClassificationPolicy',
    'watchpagePostRendererSideEffectReport',
    'watchpagePostRendererSiblingFixture',
    'watchpagePostRendererDomInsertionFixture',
    'watchpagePostRendererNoRuleBudget',
    'watchpagePostRendererJsonFirstAuthorityGate'
  ]) {
    assert.ok(source.includes(symbol), `missing future authority symbol ${symbol}`);
  }
});

test('active goal completion audit records YTM browse channel-list proof without declaring completion', () => {
  const source = doc();

  assert.match(source, /YTM browse channelListItemRenderer addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_YTM_BROWSE_CHANNEL_LIST_ITEM_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(source.includes('tests/runtime/ytm-browse-channel-list-item-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/fixtures/captures/ytm-browse-channel-list-item-renderer.json'));
  assert.match(source, /unextracted browse evidence toward direct channel-list proof/);
  assert.match(source, /3 source\/fixture files/);
  assert.match(source, /raw `ytm_browse\?prettyPrint=false\.json` sha256 `4444c7dcb6b6a884846a19169bed286f1019cd7275a6d1292392b1c1de95bdf8`/);
  assert.match(source, /52334 raw lines/);
  assert.match(source, /3005515 raw bytes/);
  assert.match(source, /direct JSON object shape/);
  assert.match(source, /route `browse FEchannels`/);
  assert.match(source, /983 parsed `channelListItemRenderer` rows/);
  assert.match(source, /984 raw `channelListItemRenderer` tokens/);
  assert.match(source, /984 parsed `browseEndpoint` keys/);
  assert.match(source, /one shelf\/vertical-list root/);
  assert.match(source, /two adjacent reduced channel rows/);
  assert.match(source, /one 160-line reduced fixture/);
  assert.match(source, /8 runtime YTM browse channel-list fixtures/);
  assert.match(source, /no-rule processing preserves both rows while queuing two `FilterTube_UpdateChannelMap` messages/);
  assert.match(source, /matching keyword and channel blocklist rules preserve both rows/);
  assert.match(source, /whitelist matching and nonmatching modes preserve both rows/);
  assert.match(source, /`channelListItemRenderer` remains absent from direct `FILTER_RULES` while map harvest remains possible/);
  assert.match(source, /YTM browse channel-list proof still needs direct decision policy, whitelist policy, disabled\/no-work budgets/);

  for (const symbol of [
    'ytmBrowseChannelListItemContract',
    'ytmBrowseChannelListItemDecisionReport',
    'ytmBrowseChannelListItemWhitelistPolicy',
    'ytmBrowseChannelListItemSideEffectBudget',
    'ytmBrowseChannelListItemSiblingPreservationFixture',
    'ytmBrowseChannelListItemRoutePolicy',
    'ytmBrowseChannelListItemMetricArtifact',
    'ytmBrowseChannelListItemJsonFirstGate'
  ]) {
    assert.ok(source.includes(symbol), `missing future authority symbol ${symbol}`);
  }
});

test('active goal completion audit records YTM watch-player DOM proof without declaring completion', () => {
  const source = doc();

  assert.match(source, /YTM watch\/player DOM addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_DOM_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(source.includes('tests/runtime/ytm-watch-player-dom-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/fixtures/captures/ytm-watch-player-dom.html'));
  assert.match(source, /unextracted watch\/player evidence toward rendered-DOM proof/);
  assert.match(source, /3 source\/fixture files/);
  assert.match(source, /raw `YTM-WATCH PLAYER\.html` sha256 `d0600cc4b7bb5684b532f825d689d32a5c7b24b37c6da6477d0f4dc637303ea3`/);
  assert.match(source, /16412 raw logical lines/);
  assert.match(source, /16411 raw newline count/);
  assert.match(source, /2279232 raw bytes/);
  assert.match(source, /rendered mobile watch\/player DOM after FilterTube mutation/);
  assert.match(source, /2 `html5-video-player` tokens/);
  assert.match(source, /4 `movie_player` tokens/);
  assert.match(source, /1 `ytm-watch-player-controls` token/);
  assert.match(source, /25 playlist panel video rows/);
  assert.match(source, /30 related\/video-with-context rows/);
  assert.match(source, /70 quick-block buttons/);
  assert.match(source, /one 175-line reduced fixture/);
  assert.match(source, /preserves `#movie_player`, `ytm-watch-player-controls`, one hidden related row, one selected hidden playlist row/);
  assert.match(source, /confirmed block state, hidden markers, and channel id `UCfg5XmOVjJ4yoeE0XkqmGAQ`/);
  assert.match(source, /broad playlist-panel CSS, broad `#movie_player` end-screen CSS, selected-row skip\/click logic/);
  assert.match(source, /YTM watch\/player DOM proof still needs settings-mode pass-through, whitelist selected\/current-row behavior, no-playback side-effect proof/);

  for (const symbol of [
    'ytmWatchPlayerDomContract',
    'ytmWatchPlayerSelectedRowDecisionReport',
    'ytmWatchPlayerSiblingPreservationFixture',
    'ytmWatchPlayerWhitelistModeReport',
    'ytmWatchPlayerNoPlaybackSideEffectReport',
    'ytmWatchPlayerObserverBudget',
    'ytmWatchPlayerJsonDomParityReport',
    'ytmWatchPlayerJsonFirstGate'
  ]) {
    assert.ok(source.includes(symbol), `missing future authority symbol ${symbol}`);
  }
});

test('active goal completion audit records YTM selected-current-row side-effect proof without declaring completion', () => {
  const source = doc();

  assert.match(source, /YTM selected\/current-row side-effect boundary addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_SELECTED_ROW_SIDE_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(source.includes('tests/runtime/ytm-watch-player-selected-row-side-effect-boundary-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/fixtures/captures/ytm-watch-player-dom.html'));
  assert.match(source, /no-playback side-effect objective from a generic YTM watch\/player blocker to a named current-behavior owner map/);
  assert.match(source, /8 `aria-selected=true` tokens/);
  assert.match(source, /5 `data-filtertube-hidden=true` tokens/);
  assert.match(source, /1 confirmed block-state token/);
  assert.match(source, /1 `html5-main-video` token/);
  assert.match(source, /selected video `NLDFEkIvcbc`/);
  assert.match(source, /selected channel `UCfg5XmOVjJ4yoeE0XkqmGAQ`/);
  assert.match(source, /visible sibling `75NRE2KB8jc`/);
  assert.match(source, /hidden sibling `BRycGIKZzpQ`/);
  assert.match(source, /current-watch owner block can pause, hide, click alternate links, open collapsed panels, retry fallback, click next, or hide the shell/);
  assert.match(source, /manual click, autoplay-ended, selected-row scan, and hidden-selected-row retry paths remain separate side-effect owners/);

  for (const symbol of [
    'ytmWatchPlayerSelectedRowPlaybackPolicy',
    'ytmWatchPlayerNoPlaybackSideEffectReport',
    'ytmWatchPlayerPlaylistSkipDecisionReport',
    'ytmWatchPlayerSelectedRowModeMatrix',
    'ytmWatchPlayerAutoplayGuardBudget',
    'ytmWatchPlayerSyntheticNavigationBudget',
    'ytmWatchPlayerCollapsedPanelBudget',
    'ytmWatchPlayerSelectedRowRestoreReport'
  ]) {
    assert.ok(source.includes(symbol), `missing future authority symbol ${symbol}`);
  }
});

test('active goal completion audit records latest YTM stale menu and TMP collaborator identity gates without declaring completion', () => {
  const source = doc();

  assert.match(source, /YTM logs playlist bottom-sheet stale identity addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_YTM_LOGS_PLAYLIST_BOTTOM_SHEET_STALE_IDENTITY_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(source.includes('tests/runtime/ytm-logs-playlist-bottom-sheet-stale-identity-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/fixtures/captures/ytm-logs-playlist-bottom-sheet-stale-identity.html'));
  assert.match(source, /8322 raw logical lines/);
  assert.match(source, /500222 raw bytes/);
  assert.match(source, /visible playlist owner evidence for `@KillTony`/);
  assert.match(source, /observed injected bottom-sheet identity `UCWFKCr40YwOZQx8FHU_ZqqQ`/);
  assert.match(source, /observed label `@JerryRigEverything`/);
  assert.match(source, /trigger-card key reports/);
  assert.match(source, /stale-menu negative siblings/);

  assert.match(source, /TMP watch playlist collaborator dialog addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_MAIN_WATCH_TMP_PLAYLIST_COLLAB_DIALOG_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(source.includes('tests/runtime/main-watch-tmp-playlist-collab-dialog-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/fixtures/captures/main-watch-tmp-playlist-collab-dialog.json'));
  assert.match(source, /81428 logical lines/);
  assert.match(source, /10241427 raw bytes/);
  assert.match(source, /one `get_watch\?printPretty=Flase JSON` marker/);
  assert.match(source, /10 parsed `showDialogCommand`/);
  assert.match(source, /196 parsed `listItemViewModel`/);
  assert.match(source, /harvesting `UCGnjeahCJW1AF34HBmQTJ-Q -> @shakiraVEVO`/);
  assert.match(source, /renderer-context collaborator IDs such as `UCYLNGLIzMhRTi6ZOLjAPSmw`/);
  assert.match(source, /title-command Shakira ID alone does not block or allow the collaborator row/);

  assert.match(source, /YTM showSheet collaborator roster addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_YTM_SHOW_SHEET_COLLABORATOR_ROSTER_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(source.includes('tests/runtime/ytm-show-sheet-collaborator-roster-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/fixtures/captures/ytm-show-sheet-collab-video-with-context-renderer.json'));
  assert.match(source, /49806 raw logical lines/);
  assert.match(source, /5141307 raw bytes/);
  assert.match(source, /116 raw `showSheetCommand` tokens/);
  assert.match(source, /0 raw `showDialogCommand` tokens/);
  assert.match(source, /3-row roster for `UCGnjeahCJW1AF34HBmQTJ-Q -> @shakiraVEVO`/);
  assert.match(source, /no-rule and disabled modes preserve the row while queuing three channel-map side effects/);
  assert.match(source, /blocklist channel rules for any roster collaborator leak/);
  assert.match(source, /whitelist channel allow for any roster collaborator false-hides the row/);

  assert.match(source, /YTM showSheet injector\/filter-logic parity addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_YTM_SHOW_SHEET_INJECTOR_FILTER_LOGIC_PARITY_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(source.includes('tests/runtime/ytm-show-sheet-injector-filter-logic-parity-current-behavior.test.mjs'));
  assert.match(source, /`js\/injector\.js` at 3536 lines/);
  assert.match(source, /SHA-256 `cc46569b1fad3e1fed6041ae24b3e7078cb024b11825e76e54075d77b0aed515`/);
  assert.match(source, /injector token counts of 14 `showSheetCommand`/);
  assert.match(source, /filter-logic token counts of 0 `showSheetCommand`/);
  assert.match(source, /injector direct extraction and `lastYtNextResponse` snapshot search return the captured Shakira, Spotify, and Beele roster/);
  assert.match(source, /filter logic still uses display byline identity and diverges in blocklist and whitelist modes/);

  assert.match(source, /YTM showSheet enrichment handoff addendum/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_YTM_SHOW_SHEET_ENRICHMENT_HANDOFF_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(source.includes('tests/runtime/ytm-show-sheet-enrichment-handoff-current-behavior.test.mjs'));
  assert.match(source, /partial expected name `Shakira`/);
  assert.match(source, /expected count `3` promotes roster fallback to `true`/);
  assert.match(source, /fuzzy-matches `Shakira` to `shakiraVEVO`/);
  assert.match(source, /returns Shakira, Spotify, and Beele from `lastYtNextResponse`/);
  assert.match(source, /enrichment handoff still is not filter authority/);
  assert.match(source, /`filter_logic` still has zero `showSheetCommand` tokens/);

  for (const symbol of [
    'ytmLogsPlaylistBottomSheetIdentityContract',
    'ytmLogsPlaylistMenuStaleIdentityPolicy',
    'ytmLogsStaleMenuNegativeSiblingFixture',
    'mainWatchTmpPlaylistCollabIdentityReconciliationReport',
    'mainWatchTmpPlaylistCollabWhitelistDecisionReport',
    'mainWatchTmpMixedContainerAdmissionGate',
    'mainWatchTmpPlaylistCollabJsonFirstOptimizationBudget',
    'ytmShowSheetCollaboratorContract',
    'ytmShowSheetCollaboratorWhitelistPolicy',
    'ytmShowSheetCollaboratorBlocklistPolicy',
    'ytmShowSheetCollaboratorCandidateExtractionReport',
    'ytmShowSheetCollaboratorSideEffectBudget',
    'ytmShowSheetCollaboratorNoWorkBudget',
    'ytmShowSheetCollaboratorJsonFirstGate',
    'ytmShowSheetInjectorFilterLogicParityContract',
    'ytmShowSheetMainWorldRosterFilterParityReport',
    'ytmShowSheetSnapshotToFilterCandidateContract',
    'ytmShowSheetCollaboratorSharedExtractionPolicy',
    'ytmShowSheetWhitelistParityFixture',
    'ytmShowSheetBlocklistParityFixture',
    'ytmShowSheetParitySideEffectBudget',
    'ytmShowSheetParityNoWorkBudget',
    'ytmShowSheetParityJsonFirstGate',
    'ytmShowSheetEnrichmentHandoffContract',
    'ytmShowSheetBridgeLookupOptionReport',
    'ytmShowSheetInjectorMatcherReport',
    'ytmShowSheetEnrichmentApplicationReport',
    'ytmShowSheetFilterAuthorityBoundary',
    'ytmShowSheetHandoffSideEffectBudget',
    'ytmShowSheetHandoffNoWorkBudget',
    'ytmShowSheetSharedRosterDecisionGate'
  ]) {
    assert.ok(source.includes(symbol), `missing future authority symbol ${symbol}`);
  }

  assert.match(source, /Hot SPA Lifecycle Current-Source Rerun Continuation/);
  assert.match(source, /2026-05-30 hot SPA lifecycle current-source rerun/);
  assert.match(source, /63 tracked\s+JS\/JSX\/MJS files, 510 observer\/listener\/timer\/frame lifecycle instances, 856\s+broader lifecycle\/side-effect primitives, 42 content-runtime `document`\/`window`\s+listener rows, and 70\/70 focused lifecycle tests passing/);
  assert.match(source, /Lifecycle cleanup\s+authority, route teardown authority, route\/surface no-work budget authority,\s+JSON-first promotion, whitelist optimization, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(source, /2026-05-30 lifecycle teardown\/listener-frame packet current-source rerun/);
  assert.ok(source.includes('node --test --test-reporter=spec tests/runtime/lifecycle-instance-register-current-behavior.test.mjs tests/runtime/repo-lifecycle-primitive-coverage-current-behavior.test.mjs tests/runtime/lifecycle-effect-budget-current-behavior.test.mjs tests/runtime/page-runtime-lifecycle-authority-current-behavior.test.mjs tests/runtime/lifecycle-teardown-decision-register-current-behavior.test.mjs tests/runtime/menu-observer-kids-passive-lifecycle-boundary-current-behavior.test.mjs tests/runtime/quick-block-hover-lifecycle-timer-boundary-current-behavior.test.mjs tests/runtime/empty-install-idle-observer-budget-current-behavior.test.mjs'));
  assert.match(source, /passed 70\/70 tests in 10\.7s/);
  assert.match(source, /lifecycle instance enumeration, repo-wide primitive counts, lifecycle effect\s+budgets, page-runtime lifecycle authority gaps, teardown decision classes, menu\s+observer timing, quick-block hover timing, and empty-install observer budgets/);
  assert.match(source, /Lifecycle cleanup\/pruning approval, route teardown authority, native\/menu timing\s+authority, JSON-first promotion, whitelist\/cache optimization, release\/public\s+claim use, and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Full Runtime Freshness Rerun Continuation/);
  assert.match(source, /2026-05-30 full runtime freshness rerun/);
  assert.match(source, /4663\/4663 pass, 0 fail, 83\.213s/);
  assert.match(source, /generated runtime-test declaration\s+count of 4663/);
  assert.match(source, /This is\s+executable current-behavior proof/);
  assert.match(source, /JSON-first promotion, whitelist\/cache optimization, release readiness, public\s+claims, broad audit completion/);
  assert.match(source, /`update_goal\(status='complete'\)`/);
  assert.match(source, /Full Runtime Freshness Closure Continuation/);
  assert.match(source, /2026-05-30 full runtime freshness closure continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_METHOD_SEMANTIC_REGISTER_2026-05-21.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_SOURCE_OF_TRUTH_CLAIM_REGISTER_2026-05-20.md'));
  assert.match(source, /initial post-drift full runtime rerun returned 4665\/4667 pass, 2 fail/);
  assert.match(source, /native runtime sync app\s+HEAD fingerprint and truth-claim register exact line references/);
  assert.match(source, /focused drift repair proof passed 10\/10 tests/);
  assert.ok(source.includes('node --test --test-reporter=dot tests/runtime/*.test.mjs'));
  assert.match(source, /exited 0 for the\s+current 528 runtime test files and 4671 source top-level test declarations/);
  assert.match(source, /current full runtime proof for generated 4671 declaration set:\s+`GO`/);
  assert.match(source, /full codebase audit completion from full runtime proof:\s+`NO-GO`/);
  assert.match(source, /first optimization implementation approval from full runtime proof:\s+`NO-GO`/);
  assert.match(source, /JSON-first first-class promotion from full runtime proof: `NO-GO`/);
  assert.match(source, /whitelist\/cache optimization from full runtime proof: `NO-GO`/);
  assert.match(source, /release\/public-claim use from full runtime proof: `NO-GO`/);
  assert.match(source, /`update_goal\(status='complete'\)`: `NO-GO`/);
  assert.match(source, /Runtime Count Reconciliation Continuation/);
  assert.match(source, /2026-05-30 runtime count reconciliation continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_RUNTIME_TEST_FILE_PROVENANCE_INDEX_CURRENT_BEHAVIOR_2026-05-25.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_RELEASE_REGRESSION_LAG_AND_BLOCKLIST_FIX_2026-05-26.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_FOUNDATION_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.match(source, /historical first-optimization `4457` expected-test rows to the current\s+generated runtime-test provenance count/);
  assert.match(source, /legacy metric contract expected tests:\s+4457, current generated runtime test declarations: 4671, latest historical\s+4663 full runtime proof result: 4663\/4663 pass, 0 fail, 83\.213s, current full\s+runtime proof for generated 4671 declaration set after audit-drift repair:\s+GO/);
  assert.match(source, /runtime test file rows:\s+527, runtime results missing exact backticked\s+test-path rows: 0/);
  assert.match(source, /legacy runtime-count token 4457 occurrences: 1230, legacy\s+runtime-count token 4457 files: 167, current runtime-count token 4660\s+occurrences: 11, current runtime-count token 4660 files: 4/);
  assert.match(source, /count freshness\s+reconciliation status: CURRENT-FULL-PROOF-REFRESHED, runtime count\s+reconciliation as optimization authority: NO-GO/);
  assert.match(source, /first optimization\s+implementation approval from count rows: NO-GO, full codebase audit completion\s+from count reconciliation: NO-GO/);
  assert.match(source, /Old `4457`\s+rows remain dated historical contract evidence only; the fresh current 4671 runtime\s+pass proves executable current-behavior assertion freshness, not semantic\s+coverage, JSON-first promotion, whitelist\/cache optimization/);
  assert.match(source, /Feature\/File\/Method Dependency Packet Continuation/);
  assert.match(source, /2026-05-30 feature\/file\/method dependency packet current-source rerun/);
  assert.ok(source.includes('tests/runtime/source-boundary-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/feature-source-dependency-register-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/first-optimization-metric-foundation-contract-coverage-gate-current-behavior.test.mjs'));
  assert.match(source, /passed 609\/609 tests/);
  assert.match(source, /generated runtime-test declaration\s+evidence to 4660 at that time\. Later lifecycle-convergence proof tests moved\s+generated runtime-test declaration evidence to 4663, and the full runtime suite\s+was refreshed to current 4663\/4663 pass, 0 fail, 83\.213s\. Later content-filter\s+convergence proof tests moved generated runtime-test declaration evidence to\s+4671; the later full runtime freshness closure repaired audit-document drift\s+and reran the current 4671 declaration set to exit status 0/);
  assert.match(source, /source\s+boundary\/surface\/source-of-truth, tracked-file coverage and obligations,\s+objective coverage, P0 obligation index\/status, function and callable coverage,\s+method semantic register, feature source dependencies, candidate obligation\s+binding, audit completion gap count reconciliation, and first-optimization\s+metric foundation count reconciliation/);
  assert.match(source, /Full-suite freshness, tracked-file completion, affected-callable semantic\s+closure, feature source authority, JSON-first promotion, whitelist\/cache\s+optimization, release\/public-claim use, and `update_goal\(status='complete'\)`\s+remain `NO-GO`/);
  assert.match(source, /Audit Directory Placement Continuation/);
  assert.match(source, /2026-05-30 audit directory placement continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_AUDIT_DOC_LAYOUT_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(source.includes('tests/runtime/audit-doc-layout-current-behavior.test.mjs'));
  assert.match(source, /current root FilterTube audit docs: 0, current docs\/audit FilterTube audit\s+docs: 544, current root markdown docs: 36/);
  assert.match(source, /root-level FilterTube audit doc\s+placement: NO-GO, create new FilterTube audit markdown under docs\/audit: GO,\s+rewrite core product docs for audit bookkeeping: NO-GO, keep runtime tests\s+under tests\/runtime: GO/);
  assert.match(source, /root-level stale FilterTube audit path references: 0,\s+and runtime behavior changed: no/);
  assert.match(source, /Core product docs may cite `docs\/audit\/\.\.\.`\s+evidence, but they are not the destination for new audit ledger slices/);
  assert.match(source, /does not prove the broad codebase audit complete, does not authorize product\s+documentation rewrites for audit bookkeeping, does not authorize JSON-first\s+promotion, whitelist\/cache optimization, release\/public-claim use, or\s+`update_goal\(status='complete'\)`/);
  assert.match(source, /Method And JSON-First Freshness Continuation/);
  assert.match(source, /2026-05-30 method and JSON-first freshness continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.match(source, /63 tracked JS\/JSX\/MJS\s+files, 5,473 lexical callables requiring semantic proof, 0 complete\s+per-callable proof files/);
  assert.match(source, /affected callable rows, route\/surface fixture packets, blocklist behavior,\s+whitelist behavior, channel\/collaborator behavior, transport no-work budget,\s+DOM parity\/restore budget, menu\/quick-block action budget, category metadata\s+fetch budget, and metric artifact\/rollout proof/);
  assert.match(source, /Method semantic completion,\s+optimization approval, JSON-first promotion, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /2026-05-30 method semantic register packet current-source rerun/);
  assert.ok(source.includes('node --test --test-reporter=spec tests/runtime/all-callable-index-current-behavior.test.mjs tests/runtime/*method-semantic*.test.mjs'));
  assert.match(source, /passed 279\/279 tests/);
  assert.match(source, /native runtime sync sibling app HEAD\s+evidence/);
  assert.match(source, /63 tracked JS\/JSX\/MJS files, 5,473 lexical callables, 0\s+complete per-callable proof files/);
  assert.match(source, /Affected-callable closure,\s+optimization approval, JSON-first promotion, native release freshness,\s+release\/public-claim use, and `update_goal\(status='complete'\)` remain\s+`NO-GO`/);
  assert.match(source, /Method Semantic Convergence Continuation/);
  assert.match(source, /2026-05-30 method semantic convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/all-callable-index-current-behavior.test.mjs'));
  assert.match(source, /pins 10 method semantic convergence rows across repo census, zero\s+complete files, family weight, hot runtime dominance, selected\s+triage-not-closure, required field gate, parser visibility debt,\s+affected-callable packet gap, JSON-first blocker, and authority absence/);
  assert.match(source, /source-derived ASCII and Mermaid diagrams, 0 implementation-ready\s+method semantic convergence rows/);
  assert.match(source, /source absence for\s+`methodSemanticCoverageComplete`, `callableBehaviorProofReady`,\s+`behaviorPatchMayProceed`, `methodSemanticAuthority`, `callableEffectReport`,\s+`callableNoWorkBudget`, and `callableTeardownRegistry`/);
  assert.match(source, /Method deletion,\s+method merging, affected-callable closure, whitelist\/cache method optimization,\s+JSON-first method promotion, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(source, /JSON Path Convergence Continuation/);
  assert.match(source, /2026-05-30 JSON path convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_JSON_PATH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/json-path-authority-current-behavior.test.mjs'));
  assert.match(source, /pins 10 JSON path convergence rows across documentation-not-runtime authority,\s+syntax boundary, executable owner flow, runtime coverage classes, section\s+index, executable rule paths, field-effect gap, JSON-first promotion gate,\s+method dependency, and authority absence/);
  assert.match(source, /source-derived ASCII\s+and Mermaid diagrams, 0 implementation-ready JSON path convergence rows, 440\s+effective runtime path rows, 20 section rows, 5 unsupported\/direct-gap section\s+rows, 13 blocked JSON-first promotion rows/);
  assert.match(source, /source absence for\s+`jsonPathAuthority`, `rulePathManifest`, `jsonPathProvenance`,\s+`jsonRuntimeCoverageAuthority`, `rendererFieldCoverageClass`,\s+`jsonFieldEffectAuthority`, `jsonSectionCoverageDecision`,\s+`documentedJsonSectionAuthority`, `jsonFirstFilterReadinessGate`,\s+`jsonFirstPathSyntaxManifest`, and `jsonFirstOptimizationBudget`/);
  assert.match(source, /Renderer\s+promotion, JSON-first behavior, DOM fallback deletion, no-work optimization,\s+whitelist\/cache optimization, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(source, /Optimization Candidate Freshness Continuation/);
  assert.match(source, /2026-05-30 optimization candidate priority freshness continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(source.includes('tests/runtime/optimization-candidate-priority-register-current-behavior.test.mjs'));
  assert.match(source, /latest recorded 4663\/4663\s+runtime proof, the current 4671 generated declaration count, the later full\s+runtime freshness closure, and the May 30 whitelist\/cache live-profile blocker\s+map/);
  assert.match(source, /latest historical\s+4663 full runtime proof: 4663\/4663 pass, 0 fail, 83\.213s/);
  assert.match(source, /current generated\s+runtime-test declaration count: 4671/);
  assert.match(source, /current full runtime proof for generated\s+4671 declaration set after audit-drift repair: `GO`/);
  assert.match(source, /affected callable\s+packet rows: 12; affected source files covered: 8; transport no-work source\s+evidence rows: 8; live evidence execution blocker rows: 8/);
  assert.match(source, /connected Chrome\s+profile inventory acceptance: `NO-GO`/);
  assert.match(source, /scratch\/private Chrome profile acceptance: `NO-GO`/);
  assert.match(source, /source-only\s+affected-callable packet as live execution proof: `NO-GO`/);
  assert.match(source, /implementation-ready\s+optimization candidates after May 30 freshness: 0/);
  assert.match(source, /whitelist\/cache optimization\s+approval after May 30 freshness: `NO-GO`; JSON-first first-class promotion\s+after May 30 freshness: `NO-GO`/);
  assert.match(source, /green runtime tests prove current-behavior\s+freshness, not performance readiness/);
  assert.match(source, /source anchors prove affected-callable\s+ownership, not live SPA route\/mode budget evidence/);
  assert.match(source, /scratch\/private or\s+disconnected Chrome probes do not prove installed visible-tab byte parity/);
  assert.match(source, /Optimization approval, JSON-first promotion, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`; the broad audit remains\s+active/);
  assert.match(source, /Watch\/Player Route Convergence Continuation/);
  assert.match(source, /2026-05-30 watch\/player route convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_WATCH_PLAYER_CONTROL_AUTHORITY_AUDIT_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/watch-player-control-authority-current-behavior.test.mjs'));
  assert.match(source, /pins 8 watch\/player convergence rows across\s+UI\/settings\/cache split, content refresh compensation, `\/next` endpoint policy,\s+`\/player` metadata-only behavior, comment continuation\/scaffold ownership,\s+recommendation renderer topology, watch playlist selected-row side effects,\s+and whitelist\/fullscreen no-work policy/);
  assert.match(source, /pins source-derived ASCII and\s+Mermaid route convergence diagrams, 0 implementation-ready watch\/player\s+convergence rows, and source absence for `watchSurfaceControlAuthority`/);
  assert.match(source, /Route-scoped `\/next` optimization, metadata-only `\/player` optimization,\s+watch playlist selected-row JSON-first promotion, watch whitelist\/fullscreen\s+no-work approval, recommendation renderer generalization, release\/public-claim\s+use, and `update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Storage\/Cache Key Convergence Continuation/);
  assert.match(source, /2026-05-30 storage\/cache key convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_STORAGE_KEY_AUTHORITY_AUDIT_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/storage-key-authority-current-behavior.test.mjs'));
  assert.match(source, /pins 10 storage\/cache convergence rows\s+across compiler\/invalidation drift, content bridge map-only refresh,\s+force-reprocess coalescing, StateManager reload drift, shared settings load,\s+background map dirty-state, profile\/import\/Nanah revision gaps, stats\s+dashboard reload drift, settings-refresh evidence packets, and whitelist-cache\s+hot paths/);
  assert.match(source, /pins source-derived ASCII and Mermaid convergence diagrams,\s+0 implementation-ready storage\/cache convergence rows, 12 settings-refresh\s+evidence packet rows, 29 required settings-refresh packet fields, and source\s+absence for `storageKeyAuthority`/);
  assert.match(source, /Map-only pruning, compiled-cache\s+invalidation changes, broad whitelist\/cache optimization, JSON-first\s+promotion, release\/public-claim use, and `update_goal\(status='complete'\)`\s+remain `NO-GO`/);
  assert.match(source, /Message Side-Effect Convergence Continuation/);
  assert.match(source, /2026-05-30 message side-effect convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_MESSAGE_SIDE_EFFECT_REGISTER_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/message-side-effect-register-current-behavior.test.mjs'));
  assert.match(source, /pins 10 message side-effect\s+convergence rows across background receiver trust split, settings cache\s+broadcast, refresh\/DOM rerun broadcast, page-world request ownership, learned\s+identity writes, rule mutation storage\/backup\/refresh, stats storage,\s+script\/tab\/network authority, import\/Nanah\/backup trust, and negative spoof\s+fixture gaps/);
  assert.match(source, /pins source-derived ASCII and Mermaid convergence\s+diagrams, 0 implementation-ready message side-effect convergence rows, and\s+source absence for `messageSideEffectAuthority`, `trustedUi`,\s+`ownedPageWorldRequest`, and `backgroundInternal`/);
  assert.match(source, /Message trust hardening,\s+rule mutation optimization, storage\/cache optimization, JSON-first promotion,\s+release\/public-claim use, and `update_goal\(status='complete'\)` remain\s+`NO-GO`/);
  assert.match(source, /Rule Mutation Convergence Continuation/);
  assert.match(source, /2026-05-30 rule mutation convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_RULE_MUTATION_ENTRYPOINT_AUTHORITY_AUDIT_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/rule-mutation-entrypoint-authority-current-behavior.test.mjs'));
  assert.match(source, /pins 10 rule mutation convergence\s+rows across StateManager mode-inferred rows, background sender split,\s+quick\/menu action payloads, Filter All comment scope, list-mode transfer copy\s+policy, batch whitelist import mode behavior, managed child direct writes,\s+import\/Nanah apply paths, storage\/cache\/backup\/refresh fanout, and learned\s+identity rule inputs/);
  assert.match(source, /pins source-derived ASCII and Mermaid\s+convergence diagrams, 0 implementation-ready rule mutation convergence rows,\s+and source absence for `ruleMutationAuthority` and `mutationReport`/);
  assert.match(source, /Rule\s+mutation implementation, blocklist\/whitelist mutation optimization,\s+quick\/menu rewrites, Filter All optimization, import\/Nanah mutation\s+optimization, storage\/cache optimization from rule mutation, JSON-first\s+promotion, release\/public-claim use, and `update_goal\(status='complete'\)`\s+remain `NO-GO`/);
  assert.match(source, /Settings\/Profile\/List-Mode Convergence Continuation/);
  assert.match(source, /2026-05-30 settings\/profile\/list-mode convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md'));
  assert.ok(source.includes('tests/runtime/settings-mode-source-effect-current-behavior.test.mjs'));
  assert.match(source, /pins 10 settings\/profile\/list-mode\s+convergence rows across visible row versus compiled source drift, empty\s+blocklist versus empty whitelist policy, Main\/Kids profile selection,\s+`syncKidsToMain` merge behavior, list-mode transition storage, seed\/injector\s+JSON admission, JSON decision comment exceptions, DOM pending\/action gates,\s+content-control active-work, and refresh\/cache revision fanout/);
  assert.match(source, /pins source-derived ASCII and Mermaid convergence diagrams, 0\s+implementation-ready settings\/profile\/list-mode convergence rows, and source\s+absence for `settingsModeSourceEffectAuthority`,\s+`settingsSourceEffectDecision`, and `modeSurfaceEffectAuthority`/);
  assert.match(source, /Settings-mode implementation, alias cleanup, simultaneous allow\/block mode,\s+whitelist\/cache optimization, JSON-first promotion, refresh pruning,\s+release\/public-claim use, and `update_goal\(status='complete'\)` remain\s+`NO-GO`/);
  assert.match(source, /Selector Convergence Continuation/);
  assert.match(source, /2026-05-30 selector convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_SELECTOR_AUTHORITY_AUDIT_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/selector-authority-current-behavior.test.mjs'));
  assert.match(source, /pins 10 selector convergence rows across instance\s+census, page-runtime dominance, YouTube DOM contract ownership,\s+dynamic\/caller-owned selectors, content_bridge hot-file selectors, DOM\s+fallback hot-file selectors, quick\/menu release hot-path selectors,\s+watch\/comment\/playlist boundaries, extension UI mutation selectors, and\s+legacy\/inventory boundaries/);
  assert.match(source, /pins source-derived ASCII and Mermaid convergence diagrams, 0\s+implementation-ready selector convergence rows, and source absence for\s+`selectorAuthority`, `selectorEffectReport`, `selectorTargetDecision`,\s+`selectorRouteSurfaceAuthority`, and `selectorRestoreAuthority`/);
  assert.match(source, /Selector\s+rewrites, DOM fallback selector pruning, quick\/menu selector rewrites,\s+watch-shell selector behavior changes, legacy layout reactivation, JSON-first\s+selector promotion, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior\s+changed by this continuation: no; the broad audit remains active/);
});

test('active goal completion audit records runtime lifecycle convergence without declaring completion', () => {
  const source = doc();
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');
  const readinessDoc = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');

  assert.match(source, /Runtime Lifecycle Convergence Continuation/);
  assert.match(source, /2026-05-30 runtime lifecycle convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(source, /pins 10 runtime lifecycle convergence rows\s+across primitive census, listener surface, observer surface, timer\/frame\s+surface, hot YouTube SPA owners, mode\/surface budget, teardown\/effect budget,\s+menu\/overlay timing, method\/JSON dependency, and authority absence/);
  assert.match(source, /0 implementation-ready runtime\s+lifecycle convergence rows, 510 tracked lifecycle primitive instances, 460\s+install-or-schedule rows, 50 explicit teardown rows, 16 hot YouTube SPA\s+lifecycle owner rows, 33 YouTube SPA immediate\/short hot timer rows/);
  assert.match(source, /source absence for `lifecycleEffectBudget`, `lifecycleOwnerDecision`,\s+`routeSurfaceLifecycleScope`, `fullscreenPauseAuthority`,\s+`nativeOverlayPauseAuthority`, `noRuleLifecycleCounter`,\s+`lifecycleTeardownAuthority`, `listenerLifecycleAuthority`,\s+`observerLifecycleAuthority`, `timerLifecycleAuthority`, and\s+`routeTeardownAuthority`/);
  assert.match(source, /Observer\/listener\/timer\/frame cleanup, route\s+teardown, native-overlay pause rewrites, whitelist\/cache optimization,\s+JSON-first promotion, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(lifecycleDoc, /runtime lifecycle convergence rows: 10/);
  assert.match(lifecycleDoc, /implementation-ready runtime lifecycle convergence rows: 0/);
  assert.match(lifecycleDoc, /runtime lifecycle cleanup approval: NO-GO/);
  assert.match(readinessDoc, /Runtime lifecycle convergence boundary - 2026-05-30/);
});

test('active goal completion audit records content-filter route surface convergence without declaring completion', () => {
  const source = doc();
  const routeDoc = read('docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_ROUTE_SURFACE_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md');
  const noWorkDoc = read('docs/audit/FILTERTUBE_CONTENT_FILTER_ROUTE_SURFACE_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-29.md');
  const readinessDoc = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');
  const diagnosticDoc = read('docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md');

  assert.match(source, /Content-Filter Route\/Surface Convergence Continuation/);
  assert.match(source, /2026-05-30 content-filter route\/surface convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_ROUTE_SURFACE_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_CONTENT_FILTER_ROUTE_SURFACE_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-29.md'));
  assert.ok(source.includes('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md'));
  assert.ok(source.includes('tests/runtime/content-filter-field-effect-route-surface-matrix-current-behavior.test.mjs'));
  assert.ok(source.includes('tests/runtime/content-filter-route-surface-no-work-budget-current-behavior.test.mjs'));
  assert.match(source, /pins 10 content-filter route\/surface convergence rows,\s+12 field-effect route\/surface rows, 12 no-work budget rows, 9 route\/surface\s+classes, 7 cheap no-work gate families, and 6 known over-work gap families/);
  assert.match(source, /0 implementation-ready content-filter convergence rows, runtime\s+content-filter convergence approvals at 0/);
  assert.match(source, /source absence for\s+`contentFilterRouteSurfaceConvergenceAuthority`,\s+`contentFilterRouteSurfaceConvergenceReport`, and\s+`contentFilterRouteSurfaceNoWorkBudget`/);
  assert.match(source, /JSON-first content-filter authority,\s+DOM fallback deletion, metadata fetch pruning, watch\/YTM\/Kids parity,\s+whitelist\/cache optimization, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(source, /Runtime behavior changed by\s+this continuation: no; the broad audit remains active/);
  assert.match(routeDoc, /content-filter route\/surface convergence rows: 10/);
  assert.match(routeDoc, /implementation-ready content-filter convergence rows: 0/);
  assert.match(routeDoc, /content-filter JSON-first route authority: NO-GO/);
  assert.match(noWorkDoc, /content-filter no-work authority from convergence: NO-GO/);
  assert.match(readinessDoc, /Content-filter route\/surface convergence boundary - 2026-05-30/);
  assert.match(source, /Diagnostic Logging Convergence Continuation/);
  assert.match(source, /2026-05-30 diagnostic logging convergence continuation/);
  assert.ok(source.includes('docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(source.includes('tests/runtime/runtime-diagnostic-logging-policy-matrix-current-behavior.test.mjs'));
  assert.match(source, /pins 10 diagnostic logging convergence rows across console\s+inventory, hot runtime files, level split, source flow, identity privacy, JSON\s+decision diagnostics, no-work logging budget, release\/build diagnostics,\s+metric-foundation handoff, and authority absence/);
  assert.match(source, /21 diagnostic\s+logging policy source files, 419 active console callsites, 9 diagnostic\s+source-flow rows/);
  assert.match(source, /0\s+implementation-ready diagnostic logging convergence rows/);
  assert.match(source, /source absence\s+for `diagnosticLoggingConvergenceAuthority`,\s+`diagnosticLoggingConvergenceReport`, `diagnosticLogWorkBudget`,\s+`diagnosticMetricReplacementAuthority`, and\s+`diagnosticPrivacyRedactionAuthority`/);
  assert.match(source, /Diagnostic logging cleanup, diagnostic\s+metric replacement, privacy\/redaction promotion, whitelist\/cache optimization,\s+JSON-first promotion, release\/public-claim use, and\s+`update_goal\(status='complete'\)` remain `NO-GO`/);
  assert.match(diagnosticDoc, /Diagnostic Logging Convergence Boundary - 2026-05-30/);
  assert.match(diagnosticDoc, /diagnostic logging convergence rows: 10/);
  assert.match(readinessDoc, /Diagnostic logging convergence boundary - 2026-05-30/);
});
