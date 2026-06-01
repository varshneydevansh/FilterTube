import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const ledgerPath = 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function ledger() {
  return read(ledgerPath);
}

function assertSettingsModeStopGoPropagation(doc) {
  const stopGoDoc = read('docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md');
  const modeSurfaceDoc = read('docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md');

  assert.match(doc, /Settings Mode Stop\/Go Propagation Continuation/);
  assert.match(doc, /2026-05-28 settings-mode stop\/go propagation continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(doc.includes('docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md'));
  assert.match(doc, /ASCII plus Mermaid decision flow/);
  assert.match(doc, /6 settings-mode cross-feature stop\/go rows/);
  assert.match(doc, /empty blocklist, empty whitelist, disabled settings, content-control flags/);
  assert.match(doc, /quick block plus normal menu, and native overlay\/fullscreen\/app shell/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Broad empty-state shortcut approval, broad JSON-first promotion, lifecycle\s+pruning, and release\/public-claim use remain `NO-GO`; continued audit remains\s+`GO`/);
  assert.match(stopGoDoc, /Settings Mode Cross-Feature Stop\/Go Continuation - 2026-05-28/);
  assert.match(stopGoDoc, /ASCII decision flow:/);
  assert.match(stopGoDoc, /Mermaid decision flow:/);
  assert.match(stopGoDoc, /flowchart TD/);
  assert.match(stopGoDoc, /settings-mode stop\/go continuation rows: 6/);
  assert.match(modeSurfaceDoc, /Settings Mode Cross-Feature Continuation - 2026-05-28/);
  assert.match(modeSurfaceDoc, /Do not collapse empty blocklist into a global zero-work state/);
}

function assertListenerOptionShapeContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Event Listener Option Shape Continuation/);
  assert.match(doc, /2026-05-28 listener-option shape continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid listener option diagrams/);
  assert.match(doc, /source-derived split for all\s+288 `addEventListener` installs/);
  assert.match(doc, /232 omitted-option listeners, 23\s+boolean capture listeners, 30 object-option listeners, 1 explicit bubble\s+listener, and 2 generated expression\/identifier option listeners/);
  assert.match(doc, /without\s+changing product runtime behavior/);
  assert.match(doc, /Listener option cleanup, lifecycle pruning,\s+and release\/public-claim use remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Event Listener Option Shape Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid listener option flow diagram: present/);
}

function assertListenerEventTypeContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Event Listener Event-Type Continuation/);
  assert.match(doc, /2026-05-28 listener-event type continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid listener event diagrams/);
  assert.match(doc, /source-derived split for all\s+288 `addEventListener` installs/);
  assert.match(doc, /114 click listeners, 55 change\s+listeners, 20 input listeners, 14 keydown listeners, 8 `DOMContentLoaded`\s+listeners, 1 `ended` media listener, 72 other literal event listeners, 4\s+non-literal event expressions, and 0 missing event arguments/);
  assert.match(doc, /without\s+changing product runtime behavior/);
  assert.match(doc, /Listener event cleanup, lifecycle pruning, media\s+side-effect authority, and release\/public-claim use remain `NO-GO`; continued\s+audit remains `GO`/);
  assert.match(lifecycleDoc, /Event Listener Event-Type Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid listener event flow diagram: present/);
}

function assertListenerTargetContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Event Listener Target Continuation/);
  assert.match(doc, /2026-05-28 listener-target continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid listener target diagrams/);
  assert.match(doc, /source-derived split for all\s+288 `addEventListener` installs/);
  assert.match(doc, /203 local element targets, 17\s+optional local element targets, 39 document targets, 19 window targets, 8\s+vendor transport targets, and 2 generated shell targets/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Listener target cleanup, lifecycle pruning, generated-output parity, vendor\s+session authority, and release\/public-claim use remain `NO-GO`; continued\s+audit remains `GO`/);
  assert.match(lifecycleDoc, /Event Listener Target Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid listener target flow diagram: present/);
}

function assertListenerEventTargetMatrixContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Event Listener Event-Target Matrix Continuation/);
  assert.match(doc, /2026-05-28 listener event-target matrix continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid listener event-target diagrams/);
  assert.match(doc, /source-derived joined\s+matrix for all 288 `addEventListener` installs/);
  assert.match(doc, /10 document click\s+pairs, 7 document `DOMContentLoaded` pairs, 3 document keydown pairs, 4\s+document pointer\/mouse pairs, 4 window message pairs, 2 window route pairs, 9\s+window scroll\/resize\/orientation pairs, 1 window storage\/visibility pair, 104\s+local click pairs, 68 local change\/input\/keydown pairs, 8 vendor transport\s+lifecycle pairs, and 2 generated shell nonliteral pairs/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Listener event-target cleanup, lifecycle pruning, route-teardown authority,\s+native\/menu timing authority, and release\/public-claim use remain `NO-GO`;\s+continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Event Listener Event-Target Matrix Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid listener event-target flow diagram: present/);
}

function assertObserverObserveTargetContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Observer Observe Target Continuation/);
  assert.match(doc, /2026-05-28 observer-observe target continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid observer observe target diagrams/);
  assert.match(doc, /source-derived split\s+for all 17 current tracked `\.observe\(\.\.\.\)` activation calls/);
  assert.match(doc, /4\s+card\/row observe targets, 3 `document\.body` observe targets, 4 dropdown observe\s+targets, 3 generic target expressions, 2 panel\/rail observe targets, and 1\s+select observe target/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Observer observe target\s+cleanup, lifecycle pruning, route-teardown authority, dropdown\/native menu\s+authority, and release\/public-claim use remain `NO-GO`; continued audit\s+remains `GO`/);
  assert.match(lifecycleDoc, /Observer Observe Target Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid observer observe target flow diagram: present/);
}

function assertObserverObserveOptionShapeContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Observer Observe Option Shape Continuation/);
  assert.match(doc, /2026-05-28 observer observe option-shape continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid observer observe option-shape diagrams/);
  assert.match(doc, /source-derived\s+split for all 17 current tracked `\.observe\(\.\.\.\)` activation calls/);
  assert.match(doc, /9 `childList \+ subtree` observer option rows, 1 `childList`-only option row, 2\s+no-option visibility observer rows, 5 attribute-filter observer rows, 2\s+style\/hidden attribute filter rows, 1 `aria-hidden` attribute filter row, 1\s+`disabled` attribute filter row, 1 collaborator identity attribute filter row,\s+16 content-runtime observer observe option rows, and 1 extension UI\/background\s+observer observe option row/);
  assert.match(doc, /without\s+changing product runtime behavior/);
  assert.match(doc, /Observer observe option-shape cleanup,\s+lifecycle pruning, route-teardown authority, dropdown\/native menu authority,\s+and release\/public-claim use remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Observer Observe Option Shape Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid observer observe option-shape flow diagram: present/);
}

function assertListenerCallbackIdentityContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Event Listener Callback Identity Continuation/);
  assert.match(doc, /2026-05-28 listener-callback identity continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid listener-callback diagrams/);
  assert.match(doc, /source-derived split for\s+all 288 current tracked `addEventListener` callback arguments/);
  assert.match(doc, /252\s+inline arrow callbacks, 33 identifier callback references, 1 member callback\s+reference, 2 generated expression callbacks, 74 content-runtime callbacks, 201\s+extension UI\/background callbacks, 2 generated-output callbacks, 8\s+vendor-bundle callbacks, and 3 website-component callbacks/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Listener callback cleanup, lifecycle pruning,\s+route-teardown authority, native\/menu timing authority, and release\/public-claim\s+use remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Event Listener Callback Identity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid listener callback flow diagram: present/);
}

function assertListenerAddRemoveParityContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Event Listener Add\/Remove Parity Continuation/);
  assert.match(doc, /2026-05-28 listener add\/remove parity continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid listener add\/remove parity diagrams/);
  assert.match(doc, /source-derived\s+join for all 288 tracked `addEventListener` installs and 9 tracked\s+`removeEventListener` teardowns/);
  assert.match(doc, /279 install-minus-remove delta,\s+9 capture-equivalent remove pairs, 8 exact option-shape remove pairs, 1\s+capture-equivalent option-shape mismatch pair, 0 remove rows without a\s+capture-equivalent add pair, 51 page-global listener installs without explicit\s+remove, 252 inline listener installs without remove handle, 70 content-runtime\s+add\/remove delta, 201 extension UI\/background delta, 0 generated-output delta,\s+8 vendor-bundle delta, 0 website-component delta, 5 document listener removes,\s+2 window listener removes, and 2 generated shell listener removes/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Listener add\/remove cleanup, lifecycle pruning, route-teardown authority,\s+native\/menu timing authority, and release\/public-claim use remain `NO-GO`;\s+continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Event Listener Add\/Remove Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid listener add\/remove parity flow diagram: present/);
}

function assertContentRuntimePageGlobalListenerBoundaryContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Content Runtime Page-Global Listener Boundary Continuation/);
  assert.match(doc, /2026-05-28 content-runtime page-global listener boundary continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid content-runtime page-global listener diagrams/);
  assert.match(doc, /source-derived split for all 42 current content-runtime `document`\/`window`\s+listener rows/);
  assert.match(doc, /32 document listener rows, 10 window listener rows,\s+8 source files, 12 quick-block global listener rows, 3 native menu global\s+listener rows, 1 Kids passive menu listener row, 5 content bridge\s+prefetch\/whitelist listener rows, 7 content bridge fallback menu listener\s+rows, 1 content bridge main-world message listener row, 2 injector main-world\s+message listener rows, 7 click listener rows, 6 DOMContentLoaded listener\s+rows, 5 `yt-navigate-finish` listener rows, 4 message listener rows, and 4\s+scroll listener rows/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Content-runtime page-global listener\s+cleanup, lifecycle pruning, route-teardown authority, native\/menu timing\s+authority, page-message trust authority, metric artifact use, and\s+release\/public-claim use remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Content Runtime Page-Global Listener Boundary Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid content runtime page-global listener flow diagram: present/);
}

function assertContentRuntimePageGlobalListenerRowContextContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Content Runtime Page-Global Listener Row Context Continuation/);
  assert.match(doc, /2026-05-28 content-runtime page-global listener row-context continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid content-runtime page-global row-context diagrams/);
  assert.match(doc, /source-derived split for all 42 current content-runtime `document`\/`window`\s+listener rows/);
  assert.match(doc, /42 row-context rows, 16 route scopes, 16 surface\s+scopes, 14 active predicate classes, 20 duplicate-install boundary classes, 12\s+quick-block enabled-gated rows, 6 fallback menu eager-or-hover gated rows, 4\s+main-world message source-gated rows, 3 identity prefetch-work gated rows, and\s+2 whitelist non-watch gated rows/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Content-runtime page-global row-context cleanup, native\/menu impact authority,\s+page-message trust authority, no-work budget authority, fixture authority,\s+teardown\/page-lifetime justification authority, metric artifact use, and\s+release\/public-claim use remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Content Runtime Page-Global Listener Row Context Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid content runtime page-global row-context flow diagram: present/);
}

function assertContentRuntimePageGlobalListenerImpactFixtureContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Content Runtime Page-Global Listener Impact And Fixture Continuation/);
  assert.match(doc, /2026-05-28 content-runtime page-global listener impact and fixture\s+continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid content-runtime page-global impact fixture diagrams/);
  assert.match(doc, /source-derived split for all 42 current content-runtime `document`\/`window`\s+listener rows/);
  assert.match(doc, /42 impact rows, 10 native\/menu impact classes, 6\s+page-message trust classes, 14 no-work budget classes, 13 positive fixture\s+classes, 12 negative fixture classes, 6 page-lifetime classes, 12 quick-block\s+affordance impact rows, 7 custom fallback menu impact rows, 5 page-message\s+impact rows, 37 no page-message trust impact rows, and 30 module singleton\s+page-lifetime rows/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Content-runtime page-global\s+impact\/fixture cleanup, native\/menu impact authority, page-message trust\s+authority, no-work budget authority, fixture authority, teardown\/page-lifetime\s+justification authority, metric artifact use, and release\/public-claim use\s+remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Content Runtime Page-Global Listener Impact And Fixture Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid content runtime page-global impact fixture flow diagram: present/);
}

function assertHotYouTubeSpaLifecycleOwnerMatrixContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Hot YouTube SPA Lifecycle Owner Matrix Continuation/);
  assert.match(doc, /2026-05-29 hot YouTube SPA lifecycle owner matrix continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid hot lifecycle owner diagrams/);
  assert.match(doc, /source-locus matrix for\s+16 high-risk YouTube SPA owners/);
  assert.match(doc, /quick-block setup, hover pointer\s+recovery, native menu setup, dropdown discovery, dropdown visibility,\s+identity prefetch, playlist prefetch, whitelist right rail, DOM fallback\s+observation, fallback menu scanning, video metadata reruns, DOM fallback\s+pending reruns, pending metadata rechecks, seed replay transport, injector\s+startup polling, and bridge settings refresh debounce/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Hot lifecycle source-locus proof is\s+`PARTIAL`; shared hot lifecycle registry authority, lifecycle cleanup\/pruning\s+approval, route\/surface no-work budget authority, metric artifact use, and\s+release\/public-claim use remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Hot YouTube SPA Lifecycle Owner Matrix Addendum - 2026-05-29/);
  assert.match(lifecycleDoc, /hot YouTube SPA lifecycle owner rows: 16/);
  assert.match(lifecycleDoc, /shared hot lifecycle registry authority: NO-GO/);
}

function assertObserverDisconnectContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Observer Disconnect Continuation/);
  assert.match(doc, /2026-05-28 observer-disconnect continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid observer disconnect diagrams/);
  assert.match(doc, /source-derived split for\s+all 10 current tracked observer `\.disconnect\(\)` and optional-chain\s+`\.disconnect\?\.\(\)` invocations/);
  assert.match(doc, /5 local `observer` variable\s+disconnects, 2 dropdown close observer disconnects, 1 dropdown discovery\s+observer disconnect, 1 collaborator dialog observer disconnect, and 1 playlist\s+fallback row observer state disconnect/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Observer disconnect cleanup, lifecycle pruning, route-teardown authority,\s+dropdown\/native menu authority, and release\/public-claim use remain `NO-GO`;\s+continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Observer Disconnect Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid observer disconnect flow diagram: present/);
}

function assertObserverObserveReleaseParityContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Observer Observe\/Release Parity Continuation/);
  assert.match(doc, /2026-05-28 observer observe\/release parity continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid observer observe\/release parity diagrams/);
  assert.match(doc, /source-derived row-count join for all 17 tracked observer `\.observe\(\.\.\.\)`\s+activation rows and 11 release rows/);
  assert.match(doc, /10 `\.disconnect\(\.\.\.\)` or\s+`\.disconnect\?\.\(\.\.\.\)` release rows, 1 `\.unobserve\(\.\.\.\)` release row, a 6\s+observe-minus-release delta, 10 local `observer` observe rows, 2 local `obs`\s+observe rows, 5 exact named observer observe rows, 4 exact named observer\s+observe rows with release, 1 exact named observer observe row without release,\s+1 `prefetchObserver\.observe\(card\)` row without release, 5 content-runtime\s+observe\/release delta, and 1 extension UI\/background observe\/release delta/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Observer observe\/release cleanup, lifecycle pruning,\s+route-teardown authority, dropdown\/native menu authority, and\s+release\/public-claim use remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Observer Observe\/Release Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid observer observe\/release parity flow diagram: present/);
}

function assertObserverConstructorObserveTypeParityContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Observer Constructor\/Observe Type Parity Continuation/);
  assert.match(doc, /2026-05-28 observer constructor\/observe type parity continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid observer constructor\/observe type parity diagrams/);
  assert.match(doc, /source-derived type split for all 17 observer constructor rows and all 17\s+tracked observer `\.observe\(\.\.\.\)` activation rows/);
  assert.match(doc, /15\s+`MutationObserver` constructor rows, 2 `IntersectionObserver` constructor rows,\s+15 mutation observer observe rows, 2 intersection observer observe rows, 0\s+overall constructor-minus-observe delta, 0 mutation observer\s+constructor-minus-observe delta, 0 intersection observer\s+constructor-minus-observe delta, 0 content-runtime constructor\/observe delta,\s+and 0 extension UI\/background constructor\/observe delta/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Observer constructor\/observe type cleanup, lifecycle pruning, route-teardown\s+authority, dropdown\/native menu authority, and release\/public-claim use remain\s+`NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Observer Constructor\/Observe Type Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid observer constructor\/observe type parity flow diagram: present/);
}

function assertObserverConstructorCallbackIdentityContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Observer Constructor Callback Identity Continuation/);
  assert.match(doc, /2026-05-28 observer constructor callback identity continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid observer constructor callback diagrams/);
  assert.match(doc, /source-derived\s+callback split for all 17 observer constructor callback arguments/);
  assert.match(doc, /17 inline arrow observer constructor callbacks, 0 identifier observer\s+constructor callbacks, 0 missing observer constructor callbacks, 9 observer\s+callbacks with a `mutations` parameter, 2 observer callbacks with an `entries`\s+parameter, 6 observer callbacks with no parameter, 16 content-runtime observer\s+constructor callbacks, and 1 extension UI\/background observer constructor\s+callback/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Observer constructor callback\s+cleanup, lifecycle pruning, route-teardown authority, dropdown\/native menu\s+authority, and release\/public-claim use remain `NO-GO`; continued audit\s+remains `GO`/);
  assert.match(lifecycleDoc, /Observer Constructor Callback Identity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid observer constructor callback flow diagram: present/);
}

function assertTimerDelayShapeContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Timer Delay Shape Continuation/);
  assert.match(doc, /2026-05-28 timer-delay shape continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid timer delay diagrams/);
  assert.match(doc, /source-derived split for all 126\s+current tracked `setTimeout` and `setInterval` delay arguments/);
  assert.match(doc, /123\s+`setTimeout` delay rows, 3 `setInterval` delay rows, 16 zero-delay timers, 16\s+1-99ms timers, 18 100-199ms timers, 17 200-999ms timers, 13 1000-4999ms\s+timers, 4 5000ms-plus timers, 37 named\/expression timers, 5 `Math\.max\(\.\.\.\)`\s+expression timers, and 0 missing delay arguments/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Timer\s+delay cleanup, lifecycle pruning, route-teardown authority, native\/menu timing\s+authority, and release\/public-claim use remain `NO-GO`; continued audit\s+remains `GO`/);
  assert.match(lifecycleDoc, /Timer Delay Shape Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid timer delay flow diagram: present/);
}

function assertTimerCallbackIdentityContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Timer Callback Identity Continuation/);
  assert.match(doc, /2026-05-28 timer-callback identity continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid timer-callback diagrams/);
  assert.match(doc, /source-derived split for all\s+126 current tracked `setTimeout` and `setInterval` callback arguments/);
  assert.match(doc, /123 `setTimeout` callback rows, 3 `setInterval` callback rows, 107\s+inline arrow timer callbacks, 19 identifier timer callbacks, 0 inline function\s+timer callbacks, 0 member-reference timer callbacks, 0 missing callback\s+arguments, 86 content-runtime timer callbacks, 39 extension UI\/background timer\s+callbacks, and 1 website-component timer callback/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Timer\s+callback cleanup, lifecycle pruning, route-teardown authority, native\/menu\s+timing authority, and release\/public-claim use remain `NO-GO`; continued audit\s+remains `GO`/);
  assert.match(lifecycleDoc, /Timer Callback Identity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid timer callback flow diagram: present/);
}

function assertTimerScheduleClearParityContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Timer Schedule\/Clear Parity Continuation/);
  assert.match(doc, /2026-05-28 timer schedule\/clear parity continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid timer schedule\/clear parity diagrams/);
  assert.match(doc, /source-derived\s+join for all 123 tracked `setTimeout` schedules, 34 tracked `clearTimeout`\s+rows, 3 tracked `setInterval` schedules, and 4 tracked `clearInterval` rows/);
  assert.match(doc, /89 timeout schedule-minus-clear delta, -1 interval\s+schedule-minus-clear delta, 11 timeout schedules with assigned local id\s+handles, 24 assigned named state handles, 10 assigned property-held handles, 63\s+fire-and-forget schedules, 14 promise sleep\/timeout schedules, 1 returned timer\s+handle schedule, 3 interval schedules with assigned named state handles, 32\s+`clearTimeout` rows with direct schedule handle, 2 `clearTimeout` rows without\s+direct schedule handle, 26 handled timeout schedule rows with clear handle, 19\s+handled timeout schedule rows without clear handle, 18 distinct scheduled\s+timeout handles without clear, 4 `clearInterval` rows with direct schedule\s+handle, 0 `clearInterval` rows without direct schedule handle, 3 handled\s+interval schedule rows with clear handle, 0 handled interval schedule rows\s+without clear handle, and 0 distinct scheduled interval handles without clear/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Timer schedule\/clear cleanup,\s+lifecycle pruning, route-teardown authority, native\/menu timing authority, and\s+release\/public-claim use remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Timer Schedule\/Clear Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid timer schedule\/clear parity flow diagram: present/);
}

function assertTimerOwnerDomainContextContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 timer owner-domain context continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for runtime timers, page-runtime lag analysis,\s+native\/menu timing, whitelist pending work, settings propagation, cache flush\s+timing/);
  assert.match(doc, /126 timer owner-context rows, 13 timer owner domains, 86\s+content-runtime timer owner-context rows, 39 extension UI\/background timer\s+owner-context rows, 1 website component timer owner-context row/);
  assert.match(doc, /37 content\s+bridge timer rows, 16 quick\/menu timer rows, 15 dashboard timer rows, 10\s+background timer rows, 10 DOM fallback timer rows/);
  assert.match(doc, /Timer owner-context cleanup, timer pruning, route\s+teardown authority, native\/menu timing authority, whitelist\/cache optimization,\s+JSON-first promotion, and release\/public-claim use remain `NO-GO`; continued\s+audit remains `GO`/);
  assert.match(lifecycleDoc, /Timer Owner Domain Context Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer owner-context cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /Mermaid timer owner-domain flow diagram: present/);
}

function assertTimerOwnerDelayBudgetContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 timer owner delay-budget continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for runtime timer delay budgets,\s+page-runtime lag\s+analysis,\s+native\/menu timing, whitelist pending work, DOM fallback scan\s+pressure/);
  assert.match(doc, /126 timer owner delay-budget\s+rows, 16 immediate-zero timer rows, 34 short-under-200ms timer rows, 17\s+medium-200-999ms timer rows, 17 long-1000ms-plus timer rows, 5\s+bounded-expression timer rows, 37 named-or-expression timer rows/);
  assert.match(doc, /13 content\s+bridge immediate-or-short timer rows, 9 quick\/menu immediate-or-short timer\s+rows, 6 DOM fallback immediate-or-short timer rows, 5 dashboard\s+immediate-or-short timer rows/);
  assert.match(doc, /Timer owner delay-budget cleanup, timer pruning, route\s+teardown authority, native\/menu timing authority, whitelist\/cache\s+optimization, JSON-first promotion, and release\/public-claim use remain\s+`NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Timer Owner Delay Budget Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer owner delay-budget cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /Mermaid timer owner delay-budget flow diagram: present/);
}

function assertTimerImmediateShortRowContextContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 timer immediate\/short row-context continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for immediate and sub-200ms timer side-effect\s+context,\s+page-runtime lag analysis, native\/dropdown menu timing, quick-block\s+responsiveness/);
  assert.match(doc, /50 immediate\/short timer\s+context rows, 10 owner domains, 31 side-effect classes, 13 content bridge\s+context rows, 9 quick\/menu context rows, 6 DOM fallback context rows/);
  assert.match(doc, /3 native dropdown injection timer rows, 4 DOM fallback playlist\s+navigation timer rows, 2 content bridge whitelist refresh timer rows/);
  assert.match(doc, /Immediate\/short timer\s+cleanup, timer delay changes, route teardown authority, native\/menu timing\s+authority, whitelist\/cache optimization, JSON-first promotion, and\s+release\/public-claim use remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Timer Immediate\/Short Row Context Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer immediate-short context cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /Mermaid immediate\/short timer row-context flow diagram: present/);
}

function assertTimerImmediateShortAdmissionGateContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 timer immediate\/short admission-gate continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for immediate and sub-200ms timer admission\s+triggers,\s+page-runtime lag analysis, native\/dropdown menu timing, quick-block\s+responsiveness/);
  assert.match(doc, /50 immediate\/short timer admission rows, 4 admission\s+families, 29 admission trigger classes, 22 user\/menu\/navigation admission\s+rows, 11 DOM rerun\/scan admission rows, 9 bootstrap\/readiness admission rows/);
  assert.match(doc, /8 storage\/cache admission rows, 2 whitelist non-watch observer admission rows,\s+3 native dropdown injection trigger rows, 4 watch playlist navigation\s+admission rows/);
  assert.match(doc, /Immediate\/short timer admission cleanup, timer delay changes, route\s+teardown authority, native\/menu timing authority, whitelist\/cache optimization,\s+JSON-first promotion, and release\/public-claim use remain `NO-GO`; continued\s+audit remains `GO`/);
  assert.match(lifecycleDoc, /Timer Immediate\/Short Admission Gate Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer immediate-short admission rows: 50/);
  assert.match(lifecycleDoc, /Mermaid immediate\/short timer admission flow diagram: present/);
}

function assertTimerImmediateShortNoWorkPredicateContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 timer immediate\/short no-work predicate continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for immediate and sub-200ms timer active\/no-work\s+predicates,\s+page-runtime lag analysis, native\/dropdown menu timing, quick-block\s+global input refresh/);
  assert.match(doc, /50 immediate\/short timer no-work predicate\s+rows, 7 predicate classes, 20 direct user-action gated rows, 2 page-global\s+user-input gated rows, 2 explicit list-mode route-gated rows/);
  assert.match(doc, /4 eager\s+surface-gated rows, 5 DOM fallback inherited rows, 9 bootstrap\/readiness gated\s+rows, 8 storage dirty-state gated rows/);
  assert.match(doc, /Immediate\/short timer no-work predicate\s+cleanup, timer delay changes, route teardown authority, native\/menu timing\s+authority, whitelist\/cache optimization, JSON-first promotion, and\s+release\/public-claim use remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Timer Immediate\/Short No-Work Predicate Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer immediate-short no-work predicate rows: 50/);
  assert.match(lifecycleDoc, /Mermaid immediate\/short timer no-work predicate flow diagram: present/);
}

function assertTimerImmediateShortSurfaceOwnershipContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 timer immediate\/short surface ownership continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for immediate and sub-200ms timer route\/surface\s+ownership, YouTube SPA lag attribution, native\/dropdown menu timing,\s+quick-block content runtime work/);
  assert.match(doc, /50\s+immediate\/short timer surface rows, 7 surface classes, 33 YouTube SPA content\s+runtime rows, 5 extension dashboard UI rows, 2 extension popup UI rows/);
  assert.match(doc, /3\s+content prompt overlay rows, 2 background storage runtime rows, 4 state\/import\s+runtime rows, 1 extension UI render-engine row/);
  assert.match(doc, /Immediate\/short timer\s+surface cleanup, timer delay changes, route teardown authority, native\/menu\s+timing authority, whitelist\/cache optimization, JSON-first promotion, and\s+release\/public-claim use remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Timer Immediate\/Short Surface Ownership Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer immediate-short surface classes: 7/);
  assert.match(lifecycleDoc, /Mermaid immediate\/short timer surface ownership flow diagram: present/);
}

function assertYouTubeSpaImmediateShortPredicateCrosswalkContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 YouTube SPA immediate\/short predicate crosswalk continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for YouTube SPA content-surface hot timer predicate\s+attribution, lag candidate triage, native\/dropdown menu timing, quick-block\s+runtime work/);
  assert.match(doc, /33 YouTube SPA immediate\/short predicate crosswalk rows, 7\s+predicate classes, 12 direct user-action gated rows, 6 bootstrap\/readiness\s+gated rows/);
  assert.match(doc, /5 DOM fallback inherited rows, 4 eager surface-gated rows, 2\s+explicit list-mode route-gated rows, 2 page-global user-input gated rows, 2\s+storage dirty-state gated rows/);
  assert.match(doc, /YouTube SPA immediate\/short\s+predicate crosswalk cleanup, timer delay changes, route teardown authority,\s+native\/menu timing authority, whitelist\/cache optimization, JSON-first\s+promotion, and release\/public-claim use remain `NO-GO`; continued audit\s+remains `GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Immediate\/Short Predicate Crosswalk Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA immediate-short predicate crosswalk classes: 7/);
  assert.match(lifecycleDoc, /Mermaid YouTube SPA immediate\/short predicate crosswalk flow diagram: present/);
}

function assertYouTubeSpaEagerHotTimerCandidateContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 YouTube SPA eager hot timer candidate continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for YouTube SPA eager-surface hot timer candidates,\s+lag cleanup triage, fallback menu scan work, quick-block sweep work/);
  assert.match(doc, /4 YouTube SPA eager hot timer rows, 2 candidate classes, 3\s+fallback menu eager hot timer rows, 1 quick-block eager sweep hot timer row, 4\s+rule-list independent YouTube SPA eager hot timer rows/);
  assert.match(doc, /YouTube SPA eager hot timer\s+cleanup, timer delay changes, route teardown authority, native\/menu timing\s+authority, quick-block affordance changes, whitelist\/cache optimization,\s+JSON-first promotion, and release\/public-claim use remain `NO-GO`; continued\s+audit remains `GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Eager Hot Timer Candidate Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA eager hot timer classes: 2/);
  assert.match(lifecycleDoc, /Mermaid YouTube SPA eager hot timer candidate flow diagram: present/);
}

function assertYouTubeSpaEagerHotTimerRouteAdmissionContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 YouTube SPA eager hot timer route admission continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for YouTube SPA eager hot timer route\/surface\s+admission, desktop hover\/fine exclusion, mobile\/coarse admission, no-rule\s+affordance timers/);
  assert.match(doc, /4 YouTube SPA eager hot timer route admission\s+rows, 3 fallback menu mobile\/coarse route-admitted hot timer rows, 1\s+quick-block mobile\/coarse route-admitted hot timer row/);
  assert.match(doc, /0 source-admitted\s+desktop hover\/fine eager hot timer rows, 4 rule-list independent YouTube SPA\s+eager hot timer rows, no shared eager surface classifier/);
  assert.match(doc, /YouTube SPA eager hot timer route admission\s+cleanup, timer delay changes, route teardown authority, native\/menu timing\s+authority, quick-block affordance changes, whitelist\/cache optimization,\s+JSON-first promotion, and release\/public-claim use remain `NO-GO`; continued\s+audit remains `GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Eager Hot Timer Route Admission Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /shared eager surface classifier exists: no/);
  assert.match(lifecycleDoc, /Mermaid YouTube SPA eager hot timer route admission flow diagram: present/);
}

function assertYouTubeSpaDesktopResidualHotTimerContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 YouTube SPA desktop hover\/fine residual hot timer continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for the normal desktop residual hot timer set after\s+mobile\/coarse eager rows are excluded, desktop lag attribution, startup and\s+readiness timers/);
  assert.match(doc, /29 YouTube SPA desktop hover\/fine residual hot timer rows, 6\s+residual predicate classes, 12 direct user-action gated rows, 6\s+bootstrap\/readiness gated rows/);
  assert.match(doc, /5 DOM fallback inherited rows, 2 explicit\s+list-mode route-gated rows, 2 page-global user-input gated rows, 2 storage\s+dirty-state gated rows, 0 residual eager-surface gated rows/);
  assert.match(doc, /YouTube SPA desktop hover\/fine\s+residual cleanup, timer delay changes, route teardown authority, native\/menu\s+timing authority, quick-block affordance changes, whitelist\/cache\s+optimization, JSON-first promotion, and release\/public-claim use remain\s+`NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Hover\/Fine Residual Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA desktop hover\/fine residual predicate classes: 6/);
  assert.match(lifecycleDoc, /Mermaid YouTube SPA desktop residual hot timer flow diagram: present/);
}

function assertYouTubeSpaDesktopDirectUserActionHotTimerContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 YouTube SPA desktop direct user-action hot timer continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for the direct user-action subset inside the normal\s+desktop residual hot timer set, native\/menu timing, 3-dot dropdown injection/);
  assert.match(doc, /12 YouTube SPA desktop direct user-action hot\s+timer rows, 12 `setTimeout` rows, 4 `content_bridge` rows, 4 `block_channel`\s+rows, 4 `dom_fallback` rows, 3 native dropdown injection rows/);
  assert.match(doc, /2 block-action menu close rows, 4 watch playlist navigation rows,\s+1 quick-block fallback rerun row, 1 fallback row feedback row, 1 native\s+focus-release row/);
  assert.match(doc, /YouTube SPA desktop direct user-action cleanup, native\/menu timing rewrites,\s+timer delay changes, menu close rewrites, playlist navigation rewrites,\s+quick-block fallback rewrites, whitelist\/cache optimization, JSON-first\s+promotion, and release\/public-claim use remain `NO-GO`; continued audit\s+remains `GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Direct User-Action Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /desktop direct user-action native dropdown injection rows: 3/);
  assert.match(lifecycleDoc, /Mermaid YouTube SPA desktop direct user-action hot timer flow diagram: present/);
}

function assertYouTubeSpaDesktopStartupReadinessHotTimerContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 YouTube SPA desktop startup\/readiness hot timer continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for the bootstrap\/readiness subset inside the normal\s+desktop residual hot timer set, desktop startup attribution,\s+startup\/injection\/body readiness timing/);
  assert.match(doc, /6 YouTube SPA desktop\s+startup\/readiness hot timer rows, 5 `setTimeout` rows, 1 `setInterval` row,\s+1 content bridge startup row, 2 bridge injection rows, 2 quick\/menu body\s+readiness rows, 1 injector readiness poll row/);
  assert.match(doc, /YouTube SPA desktop startup\/readiness\s+cleanup, timer delay changes, route teardown authority, native\/menu timing\s+authority, bridge injection changes, whitelist\/cache optimization,\s+JSON-first promotion, and release\/public-claim use remain `NO-GO`; continued\s+audit remains `GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Startup\/Readiness Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /desktop startup\/readiness injector readiness poll rows: 1/);
  assert.match(lifecycleDoc, /Mermaid YouTube SPA desktop startup\/readiness hot timer flow diagram: present/);
}

function assertYouTubeSpaDesktopDomFallbackInheritedHotTimerContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 YouTube SPA desktop DOM-fallback inherited hot timer continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for the DOM-fallback inherited subset inside the\s+normal desktop residual hot timer set, desktop SPA rerun attribution,\s+collaborator rerun timing, identity-stamp rerun timing/);
  assert.match(doc, /5 YouTube SPA desktop DOM-fallback inherited\s+hot timer rows, 5 `setTimeout` rows, 3 `content_bridge` rows,\s+2 `dom_fallback` rows, 2 collaborator rerun rows, 1 identity stamp rerun row,\s+1 active yield row, 1 pending rerun row/);
  assert.match(doc, /YouTube SPA desktop DOM-fallback inherited cleanup,\s+timer delay changes, route teardown authority, collaborator rerun changes,\s+identity-stamp rerun changes, whitelist\/cache optimization, JSON-first\s+promotion, and release\/public-claim use remain `NO-GO`; continued audit\s+remains `GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop DOM-Fallback Inherited Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /desktop DOM-fallback pending rerun rows: 1/);
  assert.match(lifecycleDoc, /Mermaid YouTube SPA desktop DOM-fallback inherited hot timer flow diagram: present/);
}

function assertYouTubeSpaDesktopStorageDirtyStateHotTimerContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 YouTube SPA desktop storage dirty-state hot timer continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for the storage dirty-state subset inside the\s+normal desktop residual hot timer set, cache\/SPA slowdown attribution,\s+page-world learned metadata batching/);
  assert.match(doc, /2 YouTube SPA\s+desktop storage dirty-state hot timer rows, 2 `setTimeout` rows,\s+2 `filter_logic` rows, 1 `videoChannelMap` flush row, 1 `videoMetaMap` flush\s+row, 2 bridge message consumers/);
  assert.match(doc, /YouTube SPA desktop storage dirty-state cleanup, timer delay\s+changes, route teardown authority, map freshness rewrites, bridge message\s+rewrites, whitelist\/cache optimization, JSON-first promotion, and\s+release\/public-claim use remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Storage Dirty-State Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /desktop storage dirty-state bridge message consumers: 2/);
  assert.match(lifecycleDoc, /Mermaid YouTube SPA desktop storage dirty-state hot timer flow diagram: present/);
}

function assertYouTubeSpaDesktopExplicitListModeRouteHotTimerContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 YouTube SPA desktop explicit list-mode route hot timer continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for the explicit list-mode route subset inside the\s+normal desktop residual hot timer set/);
  assert.match(doc, /2 YouTube SPA desktop explicit list-mode route hot timer rows,\s+2 `setTimeout` rows, 1 immediate refresh row, 1 follow-up refresh row,\s+2 `content_bridge` rows, 2 force-reprocess rows/);
  assert.match(doc, /YouTube SPA desktop explicit list-mode\s+route cleanup, timer delay changes, route teardown authority, whitelist\s+refresh rewrites, DOM fallback pruning, whitelist\/cache optimization,\s+JSON-first promotion, and release\/public-claim use remain `NO-GO`; continued\s+audit remains `GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Explicit List-Mode Route Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /desktop explicit list-mode route follow-up refresh rows: 1/);
  assert.match(lifecycleDoc, /Mermaid YouTube SPA desktop explicit list-mode route hot timer flow diagram: present/);
}

function assertYouTubeSpaDesktopPageGlobalQuickBlockRefreshHotTimerContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 YouTube SPA desktop page-global quick-block refresh hot timer continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for the page-global quick-block refresh subset\s+inside the normal desktop residual hot timer set/);
  assert.match(doc, /2 YouTube SPA desktop\s+page-global quick-block refresh hot timer rows, 2 `setTimeout` rows,\s+1 focusout refresh row, 1 click refresh row, 2 runtime refresh rows/);
  assert.match(doc, /YouTube SPA desktop\s+page-global quick-block cleanup, timer delay changes, route teardown\s+authority, native\/menu timing rewrites, quick-block refresh rewrites,\s+whitelist\/cache optimization, JSON-first promotion, and release\/public-claim\s+use remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Page-Global Quick-Block Refresh Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /desktop page-global quick-block runtime refresh rows: 2/);
  assert.match(lifecycleDoc, /Mermaid YouTube SPA desktop page-global quick-block refresh flow diagram: present/);
}

function assertYouTubeSpaDesktopResidualHotTimerClassClosureContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /2026-05-30 YouTube SPA desktop residual hot timer class-closure continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage by proving the six predicate-specific desktop\s+residual timer addenda cover the full 29-row desktop hover\/fine residual set/);
  assert.match(doc, /29 YouTube\s+SPA desktop residual class-closure hot timer rows, 6 predicate classes,\s+6 source files, 12 direct user-action rows, 6 startup\/readiness rows,\s+5 DOM-fallback inherited rows, 2 storage dirty-state rows, 2 page-global\s+quick-block rows, 2 explicit list-mode route rows/);
  assert.match(doc, /10 `content_bridge` rows,\s+8 `block_channel` rows, 6 `dom_fallback` rows, 2 `bridge_injection` rows,\s+2 `filter_logic` rows, 1 `injector` row/);
  assert.match(doc, /YouTube SPA desktop residual class-closure\s+cleanup, timer delay changes, owner merges, route teardown authority,\s+native\/menu timing rewrites, whitelist\/cache optimization, JSON-first\s+promotion, and release\/public-claim use remain `NO-GO`; continued audit\s+remains `GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Residual Hot Timer Class-Closure Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /desktop residual class-closure predicate classes: 6/);
  assert.match(lifecycleDoc, /Mermaid YouTube SPA desktop residual hot timer class-closure flow diagram: present/);
}

function assertExplicitTeardownHandleContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Explicit Teardown Handle Continuation/);
  assert.match(doc, /2026-05-28 explicit-teardown handle continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid explicit teardown diagrams/);
  assert.match(doc, /source-derived split for\s+all 50 current tracked `removeEventListener`, `clearTimeout`, `clearInterval`,\s+and `cancelAnimationFrame` rows/);
  assert.match(doc, /9 `removeEventListener` rows, 34\s+`clearTimeout` rows, 4 `clearInterval` rows, 3 `cancelAnimationFrame` rows, 5\s+listener document targets, 2 listener window targets, 2 generated shell\s+listener targets, 12 local timeout id handles, 14 named timeout state handles,\s+8 property-held timeout handles, 2 engine-check interval handles, 1 warmup\s+interval handle, 1 dashboard rotation interval handle, 2 profile dropdown\s+frame handles, and 1 generic position frame handle/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Explicit teardown cleanup,\s+lifecycle pruning, route-teardown authority, native\/menu timing authority, and\s+release\/public-claim use remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Explicit Teardown Handle Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid explicit teardown flow diagram: present/);
}

function assertAnimationFrameScheduleContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Animation Frame Schedule Continuation/);
  assert.match(doc, /2026-05-28 animation-frame schedule continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid animation-frame schedule diagrams/);
  assert.match(doc, /source-derived split\s+for all 29 current tracked `requestAnimationFrame` rows/);
  assert.match(doc, /2 assigned\s+positioning frame handles, 15 inline anonymous frame callbacks, 5 identifier\s+callback frames, 5 inline `scrollIntoView` frames, 2 inline timeout-hop frames,\s+13 content-runtime frame schedules, 16 extension UI\/background frame\s+schedules, 1 `positionRaf` assignment, and 1 `profileDropdownPositionRaf`\s+assignment/);
  assert.match(doc, /without changing\s+product runtime behavior/);
  assert.match(doc, /Animation frame schedule cleanup, lifecycle pruning,\s+route-teardown authority, native\/menu timing authority, and release\/public-claim\s+use remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Animation Frame Schedule Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid animation frame schedule flow diagram: present/);
}

function assertAnimationFrameScheduleCancelParityContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Animation Frame Schedule\/Cancel Parity Continuation/);
  assert.match(doc, /2026-05-28 animation-frame schedule\/cancel parity continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid animation-frame schedule\/cancel parity diagrams/);
  assert.match(doc, /source-derived direct-handle join for all 29 current\s+`requestAnimationFrame` schedule rows and 3 current `cancelAnimationFrame`\s+rows/);
  assert.match(doc, /26 frame schedule-minus-cancel delta, 27 frame schedules\s+without assigned handles, 2 frame schedules with assigned handles, 3\s+`cancelAnimationFrame` rows with direct schedule handles, 0\s+`cancelAnimationFrame` rows without direct schedule handles, 2 handled frame\s+schedule rows with cancel handles, 0 handled frame schedule rows without cancel\s+handles, 0 distinct scheduled frame handles without cancel, 13 content-runtime\s+frame schedule\/cancel delta, 13 extension UI\/background frame schedule\/cancel\s+delta, 1 `positionRaf` cancel row, and 2 `profileDropdownPositionRaf` cancel\s+rows/);
  assert.match(doc, /without changing\s+product runtime behavior/);
  assert.match(doc, /Animation frame schedule\/cancel cleanup, lifecycle\s+pruning, route-teardown authority, native\/menu timing authority, and\s+release\/public-claim use remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Animation Frame Schedule\/Cancel Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid animation frame schedule\/cancel parity flow diagram: present/);
}

function assertBackgroundTimerOwnerReasonContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Background Timer Owner\/Reason Continuation/);
  assert.match(doc, /2026-05-28 background timer owner\/reason continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid background timer owner\/reason diagrams/);
  assert.match(doc, /source-derived\s+split for all 14 current tracked `js\/background\.js` timer lifecycle rows/);
  assert.match(doc, /10 `setTimeout` schedule rows, 4 `clearTimeout` rows, 3\s+backup\/download lifecycle rows, 2 post-block enrichment lifecycle rows, 3\s+identity map flush lifecycle rows, 6 identity fetch network timeout rows/);
  assert.match(doc, /1\s+auto-backup debounce schedule row, 1 auto-backup debounce clear row, 1 blob\s+URL revoke delay row, 1 post-block enrichment wait-cap row, 1 post-block\s+enrichment jitter row, 1 channel map flush debounce row, 1 video channel map\s+flush debounce row, 1 video meta map flush debounce row, 3 fetch abort timeout\s+schedule rows, 3 fetch abort timeout clear rows, and 0 explicit revision-token\s+rows/);
  assert.match(doc, /without changing product runtime\s+behavior/);
  assert.match(doc, /Background timer owner\/reason cleanup, lifecycle pruning, background\s+cache revision authority, metric artifact use, and release\/public-claim use\s+remain `NO-GO`; continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Background Timer Owner\/Reason Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid background timer owner\/reason flow diagram: present/);
}

function assertGeneratedVendorLifecycleFreshnessContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Generated\/Vendor Lifecycle Freshness Continuation/);
  assert.match(doc, /2026-05-28 generated\/vendor lifecycle freshness continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid generated\/vendor lifecycle freshness diagrams/);
  assert.match(doc, /source-derived split for all 12 generated\/vendor lifecycle rows/);
  assert.match(doc, /8\s+vendor-bundle lifecycle rows, 4 generated-shell output lifecycle rows, 8 vendor\s+`addEventListener` rows, 0 vendor `removeEventListener` rows, 2\s+generated-shell `addEventListener` rows, 2 generated-shell\s+`removeEventListener` rows, 2 generated-shell lifecycle files, 1 vendor\s+lifecycle file, 3 generated-shell source files, 2 generated-shell output\s+files, 1 generated UI build script file, 2 vendor bundle files, and 0\s+committed generated freshness manifest files/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Generated\/vendor lifecycle\s+freshness cleanup, lifecycle pruning, release package freshness authority,\s+metric artifact use, and release\/public-claim use remain `NO-GO`; continued\s+audit remains `GO`/);
  assert.match(lifecycleDoc, /Generated\/Vendor Lifecycle Freshness Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid generated\/vendor lifecycle freshness flow diagram: present/);
}

function assertWebsiteComponentLifecycleBoundaryContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Website Component Lifecycle Boundary Continuation/);
  assert.match(doc, /2026-05-28 website component lifecycle boundary continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.match(doc, /ASCII plus Mermaid website component lifecycle boundary diagrams/);
  assert.match(doc, /source-derived split for all 9 current website component lifecycle rows/);
  assert.match(doc, /4 install-or-schedule rows, 5 explicit-teardown rows, 3 website\s+component `addEventListener` rows, 3 website component `removeEventListener`\s+rows, 1 website component `setTimeout` row, 2 website component\s+`clearTimeout` rows, 2 website lifecycle source files, 5 scene scheduler\s+lifecycle rows, 4 theme sync lifecycle rows, 2 scene scheduler\s+install-or-schedule rows, 3 scene scheduler explicit-teardown rows, 2 theme\s+sync install-or-schedule rows, and 2 theme sync explicit-teardown rows/);
  assert.match(doc, /without changing product runtime behavior/);
  assert.match(doc, /Website component lifecycle\s+cleanup, lifecycle pruning, website deploy\/public-claim use, route hydration\s+authority, metric artifact use, and release\/public-claim use remain `NO-GO`;\s+continued audit remains `GO`/);
  assert.match(lifecycleDoc, /Website Component Lifecycle Boundary Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /Mermaid website component lifecycle boundary flow diagram: present/);
}

test('objective coverage ledger explicitly refuses to declare audit completion', () => {
  const doc = ledger();

  assert.match(doc, /Completion is not proven/);
  assert.match(doc, /NOT READY for implementation changes/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /green current-behavior harness is\s+not mistaken for a complete codebase audit/i);
  assertSettingsModeStopGoPropagation(doc);
  assertListenerOptionShapeContinuation(doc);
  assertListenerEventTypeContinuation(doc);
  assertListenerTargetContinuation(doc);
  assertListenerEventTargetMatrixContinuation(doc);
  assertListenerCallbackIdentityContinuation(doc);
  assertListenerAddRemoveParityContinuation(doc);
  assertContentRuntimePageGlobalListenerBoundaryContinuation(doc);
  assertContentRuntimePageGlobalListenerRowContextContinuation(doc);
  assertContentRuntimePageGlobalListenerImpactFixtureContinuation(doc);
  assertHotYouTubeSpaLifecycleOwnerMatrixContinuation(doc);
  assertObserverObserveTargetContinuation(doc);
  assertObserverObserveOptionShapeContinuation(doc);
  assertObserverDisconnectContinuation(doc);
  assertObserverObserveReleaseParityContinuation(doc);
  assertObserverConstructorObserveTypeParityContinuation(doc);
  assertObserverConstructorCallbackIdentityContinuation(doc);
  assertTimerDelayShapeContinuation(doc);
  assertTimerCallbackIdentityContinuation(doc);
  assertTimerScheduleClearParityContinuation(doc);
  assertTimerOwnerDomainContextContinuation(doc);
  assertTimerOwnerDelayBudgetContinuation(doc);
  assertTimerImmediateShortRowContextContinuation(doc);
  assertTimerImmediateShortAdmissionGateContinuation(doc);
  assertTimerImmediateShortNoWorkPredicateContinuation(doc);
  assertTimerImmediateShortSurfaceOwnershipContinuation(doc);
  assertYouTubeSpaImmediateShortPredicateCrosswalkContinuation(doc);
  assertYouTubeSpaEagerHotTimerCandidateContinuation(doc);
  assertYouTubeSpaEagerHotTimerRouteAdmissionContinuation(doc);
  assertYouTubeSpaDesktopResidualHotTimerContinuation(doc);
  assertYouTubeSpaDesktopDirectUserActionHotTimerContinuation(doc);
  assertYouTubeSpaDesktopStartupReadinessHotTimerContinuation(doc);
  assertYouTubeSpaDesktopDomFallbackInheritedHotTimerContinuation(doc);
  assertYouTubeSpaDesktopStorageDirtyStateHotTimerContinuation(doc);
  assertYouTubeSpaDesktopExplicitListModeRouteHotTimerContinuation(doc);
  assertYouTubeSpaDesktopPageGlobalQuickBlockRefreshHotTimerContinuation(doc);
  assertYouTubeSpaDesktopResidualHotTimerClassClosureContinuation(doc);
  assertExplicitTeardownHandleContinuation(doc);
  assertAnimationFrameScheduleContinuation(doc);
  assertAnimationFrameScheduleCancelParityContinuation(doc);
  assertBackgroundTimerOwnerReasonContinuation(doc);
  assertGeneratedVendorLifecycleFreshnessContinuation(doc);
  assertWebsiteComponentLifecycleBoundaryContinuation(doc);
});

function assertBrowserManifestPackageReferenceClosure(doc) {
  assert.match(doc, /2026-05-27 browser manifest package reference closure/);
  assert.match(doc, /same P0 release-package doc and verifier now pin that all four browser manifests/);
  assert.match(doc, /23 combined unique referenced paths/);
  assert.match(doc, /0 unresolved manifest file references/);
  assert.match(doc, /0 manifest referenced roots outside `COMMON_DIRS`/);
  assert.match(doc, /0 manifest content-script CSS references/);
  assert.match(doc, /release package parity, manifest\/resource, file coverage, code-burden, and implementation-change rows/);
  assert.match(doc, /build-time manifest reference validation, committed package manifest authority,\s+installed-runtime byte parity, and reload\/package attestation remain `NO-GO`/);

  const releasePackageDoc = read('docs/audit/FILTERTUBE_P0_RELEASE_PACKAGE_CURRENT_BEHAVIOR_2026-05-19.md');
  assert.match(releasePackageDoc, /Browser Manifest Package Reference Closure Addendum - 2026-05-27/);
  assert.match(releasePackageDoc, /combined unique referenced paths across browser manifests: 23/);
  assert.match(releasePackageDoc, /unresolved manifest file references: 0/);
  assert.match(releasePackageDoc, /manifest referenced roots outside COMMON_DIRS: 0/);
  assert.match(releasePackageDoc, /manifest content-script CSS references: 0/);
  assert.match(releasePackageDoc, /build-time manifest reference validation: absent/);
}

function assertBrowserManifestPermissionResourceValidation(doc) {
  assert.match(doc, /2026-05-27 browser manifest permission\/resource validation snapshot/);
  assert.match(doc, /5 exact permissions per manifest/);
  assert.match(doc, /3 exact host permissions per manifest/);
  assert.match(doc, /active content-script and web-accessible-resource matches limited to `youtube\.com` and `youtubekids\.com`/);
  assert.match(doc, /4 host-only `youtube-nocookie\.com` gaps/);
  assert.match(doc, /0 content-script CSS references/);
  assert.match(doc, /Chrome\/default explicit `MAIN` plus `ISOLATED` world split/);
  assert.match(doc, /Firefox one implicit-world content script entry/);
  assert.match(doc, /Opera two implicit-world content script entries/);
  assert.match(doc, /release package parity, manifest\/permission, manifest\/resource, host-scope, false-hide\/leak, code-burden, and implementation-change rows/);
  assert.match(doc, /build-time permission, host, web-accessible-resource, content-script world,\s+committed package manifest, installed-runtime byte parity, and reload\/package validation remain `NO-GO`/);

  const releasePackageDoc = read('docs/audit/FILTERTUBE_P0_RELEASE_PACKAGE_CURRENT_BEHAVIOR_2026-05-19.md');
  assert.match(releasePackageDoc, /Browser Manifest Permission And Resource Validation Snapshot - 2026-05-27/);
  assert.match(releasePackageDoc, /exact permission list per manifest: storage, activeTab, scripting, tabs, downloads/);
  assert.match(releasePackageDoc, /host-only youtube-nocookie gap manifests: 4/);
  assert.match(releasePackageDoc, /content-script CSS references: 0/);
  assert.match(releasePackageDoc, /build-time permission\/resource\/world validation: absent/);
}

function assertCurrentLocalDistPackageSnapshot(doc) {
  assert.match(doc, /2026-05-27 current local dist package snapshot/);
  assert.match(doc, /existing ignored `dist\/` tree as local artifact evidence/);
  assert.match(doc, /3 browser staged directories/);
  assert.match(doc, /58 staged files per browser/);
  assert.match(doc, /3 ZIP artifacts/);
  assert.match(doc, /178 total `dist` files including ZIPs/);
  assert.match(doc, /57 source-backed non-manifest staged files per browser/);
  assert.match(doc, /57 byte-identical source-backed non-manifest staged files per browser/);
  assert.match(doc, /per-browser staged group counts/);
  assert.match(doc, /browser manifest hashes, and local ZIP hashes/);
  assert.match(doc, /release package parity, generated-output, package artifact, manifest\/resource, code-burden, source\/evidence, and implementation-change rows/);
  assert.match(doc, /committed package manifest authority, reproducible package build authority,\s+loaded-browser package\/runtime parity authority, upload proof, public-claim proof,\s+and release publication authority remain `NO-GO`/);

  const releasePackageDoc = read('docs/audit/FILTERTUBE_P0_RELEASE_PACKAGE_CURRENT_BEHAVIOR_2026-05-19.md');
  assert.match(releasePackageDoc, /Current Local Dist Package Snapshot - 2026-05-27/);
  assert.match(releasePackageDoc, /dist snapshot source: existing ignored local dist tree/);
  assert.match(releasePackageDoc, /browser staged directories: 3/);
  assert.match(releasePackageDoc, /browser staged files per directory: 58/);
  assert.match(releasePackageDoc, /total dist files including zips: 178/);
  assert.match(releasePackageDoc, /source-backed staged files per browser excluding manifest: 57/);
  assert.match(releasePackageDoc, /byte-identical source-backed staged files per browser excluding manifest: 50/);
  assert.match(releasePackageDoc, /zip checksum snapshot: yes/);
  assert.match(releasePackageDoc, /reproducible package build authority: NO-GO/);
  assert.match(releasePackageDoc, /loaded-browser package\/runtime parity authority: NO-GO/);
}

function assertChromeDefaultUnpackedWorkspaceByteSnapshot(doc) {
  assert.match(doc, /2026-05-27 Chrome Default unpacked workspace byte snapshot/);
  assert.match(doc, /local Default profile installed-path evidence for `gkgjigdfdccckblmglboobikfcpeelio`/);
  assert.match(doc, /Secure Preferences points at `\/Users\/devanshvarshney\/FilterTube`/);
  assert.match(doc, /path matches the current workspace root/);
  assert.match(doc, /stored version is 3\.3\.1/);
  assert.match(doc, /Local Extension Settings exists/);
  assert.match(doc, /no packed `Default\/Extensions\/<id>` directory is present/);
  assert.match(doc, /current `manifest\.json`, `package\.json`, and `js\/content_bridge\.js` hashes are recorded/);
  assert.match(doc, /workspace content bridge contains the ampersand Topic fix token/);
  assert.match(doc, /release package parity, installed-profile provenance, false-hide\/leak, reliability, and implementation-change rows/);
  assert.match(doc, /running-tab content-script byte authority and extension reload timestamp authority remain `NO-GO`/);

  const releasePackageDoc = read('docs/audit/FILTERTUBE_P0_RELEASE_PACKAGE_CURRENT_BEHAVIOR_2026-05-19.md');
  assert.match(releasePackageDoc, /Chrome Default Unpacked Workspace Byte Snapshot - 2026-05-27/);
  assert.match(releasePackageDoc, /secure preferences path matches workspace root: yes/);
  assert.match(releasePackageDoc, /Default Local Extension Settings directory exists: yes/);
  assert.match(releasePackageDoc, /Default packed Extensions directory for this id exists: no/);
  assert.match(releasePackageDoc, /workspace content_bridge ampersand Topic fix token present: yes/);
  assert.match(releasePackageDoc, /running-tab content-script byte authority: NO-GO/);
  assert.match(releasePackageDoc, /extension reload timestamp authority: NO-GO/);
}

function assertDefaultInstalledPermissionParityCrosscheck(doc) {
  assert.match(doc, /2026-05-30 Default installed permission parity crosscheck/);
  assert.match(doc, /active and granted API permissions are `activeTab`, `downloads`, `scripting`, `storage`, and `tabs`/);
  assert.match(doc, /active and granted explicit hosts are `youtube-nocookie\.com`, `youtube\.com`, and `youtubekids\.com`/);
  assert.match(doc, /active and granted scriptable hosts are `youtube\.com` and `youtubekids\.com`/);
  assert.match(doc, /scriptable `youtube-nocookie\.com` gap remains present/);
  assert.match(doc, /not from the Web Store, is not default-installed, has no disable reasons, and has no withholding permissions/);
  assert.match(doc, /installed-profile permission provenance, release package parity, manifest\/permission, false-hide\/leak, reliability, and implementation-change rows/);
  assert.match(doc, /active-tab permission use proof, incognito runtime availability, running-tab content-script byte authority, and extension reload timestamp authority remain `NO-GO`/);

  const releasePackageDoc = read('docs/audit/FILTERTUBE_P0_RELEASE_PACKAGE_CURRENT_BEHAVIOR_2026-05-19.md');
  assert.match(releasePackageDoc, /Default Installed Permission Parity Crosscheck - 2026-05-30/);
  assert.match(releasePackageDoc, /installed active API permissions: activeTab, downloads, scripting, storage, tabs/);
  assert.match(releasePackageDoc, /installed granted explicit hosts: youtube-nocookie\.com, youtube\.com, youtubekids\.com/);
  assert.match(releasePackageDoc, /installed active scriptable hosts: youtube\.com, youtubekids\.com/);
  assert.match(releasePackageDoc, /installed scriptable youtube-nocookie gap: yes/);
  assert.match(releasePackageDoc, /installed permission parity authority: PARTIAL/);
  assert.match(releasePackageDoc, /active-tab permission use proof: NO-GO/);
}

function assertLiveChromeProcessAttestationBoundary(doc) {
  assert.match(doc, /2026-05-27 live Chrome process attestation boundary/);
  assert.match(doc, /local process\/session distinction behind the browser runtime gate/);
  assert.match(doc, /Visible Default Chrome is observed as the user-profile process without `--remote-debugging-port`/);
  assert.match(doc, /without `DevToolsActivePort`/);
  assert.match(doc, /separate automation Chrome process uses `\/private\/tmp\/filtertube-live-spa-chrome-profile`/);
  assert.match(doc, /loads `\/Users\/devanshvarshney\/FilterTube`/);
  assert.match(doc, /uses the same extension id/);
  assert.match(doc, /exposes CDP on port 9222/);
  assert.match(doc, /installed-runtime provenance, live-smoke provenance, release package parity, false-hide\/leak, reliability, performance-risk, and implementation-change rows/);
  assert.match(doc, /automation-profile evidence from being treated as visible-user-tab proof/);
  assert.match(doc, /visible Default Chrome CDP target list authority, visible YouTube tab content-script byte parity authority, and visible YouTube tab extension reload timestamp authority at `NO-GO`/);

  const releasePackageDoc = read('docs/audit/FILTERTUBE_P0_RELEASE_PACKAGE_CURRENT_BEHAVIOR_2026-05-19.md');
  assert.match(releasePackageDoc, /Live Chrome Process Attestation Boundary - 2026-05-27/);
  assert.match(releasePackageDoc, /Default Chrome explicit --user-data-dir flag observed: no/);
  assert.match(releasePackageDoc, /Default Chrome --remote-debugging-port flag observed: no/);
  assert.match(releasePackageDoc, /automation profile extension id: gkgjigdfdccckblmglboobikfcpeelio/);
  assert.match(releasePackageDoc, /automation CDP webSocketDebuggerUrl present: yes/);
  assert.match(releasePackageDoc, /Automation proof cannot replace visible-tab proof/);
}

test('objective coverage ledger records whitelist cache hot-path boundary without opening optimization gate', () => {
  const doc = ledger();

  assert.match(doc, /Whitelist Cache Hot Path Boundary Addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_WHITELIST_CACHE_HOT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md'));
  assert.ok(doc.includes('tests/runtime/whitelist-cache-hot-path-boundary-current-behavior.test.mjs'));
  assert.match(doc, /reported whitelist\/cache SPA slowdown/);
  assert.match(doc, /without approving a broader cache optimization/);
  assert.match(doc, /5 whitelist cache hot-path source files/);
  assert.match(doc, /7 cache\s+hot-path source\/effect blocks/);
  assert.match(doc, /3 content bridge cache hot-path blocks/);
  assert.match(doc, /2\s+background map cache blocks/);
  assert.match(doc, /1 bridge settings refresh block/);
  assert.match(doc, /1 handle resolver\s+cache block/);
  assert.match(doc, /21 selected cache hot-path token counts/);
  assert.match(doc, /narrow learned-map persistence\s+dedupe approval: GO/);
  assert.match(doc, /broader runtime whitelist cache optimization approval:\s+NO-GO/);
  assert.match(doc, /runtime\s+JSON-first cache optimization approval: NO-GO/);
  assert.match(doc, /content `currentSettings` learned maps/);
  assert.match(doc, /handle resolver `PENDING`/);
});

test('objective coverage ledger maps every original objective term', () => {
  const doc = ledger();

  for (const term of [
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
    'the boundary before implementation changes'
  ]) {
    assert.ok(doc.includes(term), `missing objective term ${term}`);
  }

  assertBrowserManifestPackageReferenceClosure(doc);
  assertBrowserManifestPermissionResourceValidation(doc);
  assertCurrentLocalDistPackageSnapshot(doc);
  assertChromeDefaultUnpackedWorkspaceByteSnapshot(doc);
  assertDefaultInstalledPermissionParityCrosscheck(doc);
  assertLiveChromeProcessAttestationBoundary(doc);
});

test('objective coverage ledger has status and missing-proof columns for each required row', () => {
  const doc = ledger();

  assert.match(doc, /\| Objective term \| Current proof artifacts \| Current status \| Missing proof before completion \|/);

  for (const row of [
    'Feature coverage',
    'Tracked file coverage',
    'Method/callable coverage',
    'JSON path coverage',
    'DOM selector coverage',
    'Runtime lifecycle coverage',
    'Settings mode coverage',
    'Cross-feature interaction coverage',
    'Raw capture corpus boundary',
    'Reliability risks',
    'False-hide risks',
    'Leak risks',
    'Performance risks',
    'Code-burden risks',
    'Implementation-change boundary'
  ]) {
    assert.match(doc, new RegExp(`\\| ${row} \\|[\\s\\S]*?\\| (partial|proof-started|incomplete) \\|`), `missing ledger status for ${row}`);
  }
});

test('objective coverage ledger cites the current proof artifact families', () => {
  const doc = ledger();

  for (const artifact of [
    'docs/audit/FILTERTUBE_CROSS_FEATURE_AUTHORITY_MATRIX_2026-05-18.md',
    'docs/audit/FILTERTUBE_TRACKED_FILE_AUDIT_COVERAGE_2026-05-18.md',
    'tests/runtime/tracked-file-audit-coverage-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md',
    'tests/runtime/tracked-file-obligation-index-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_ALL_CALLABLE_INDEX_2026-05-18.md',
    'tests/runtime/all-callable-index-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_METHOD_SEMANTIC_AUDIT_REGISTER_2026-05-20.md',
    'tests/runtime/method-semantic-audit-register-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md',
    'docs/audit/FILTERTUBE_HANDLE_RESOLVER_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/handle-resolver-method-semantic-register-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_SEED_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/seed-method-semantic-register-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_DOM_FALLBACK_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/dom-fallback-method-semantic-register-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_NANAH_VENDOR_BUILD_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/nanah-vendor-build-method-semantic-register-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_LEGACY_LAYOUT_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/legacy-layout-method-semantic-register-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/native-runtime-sync-method-semantic-register-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_MANIFEST_FRESHNESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'tests/runtime/native-runtime-sync-manifest-freshness-boundary-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/filter-logic-rule-path-semantic-register-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/filter-logic-rule-field-effect-semantic-register-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_DOM_FALLBACK_SELECTOR_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/dom-fallback-selector-semantic-register-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_CODE_BURDEN_DECLUTTER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/json_paths_encyclopedia.md',
    'docs/youtube_renderer_inventory.md',
    'docs/audit/FILTERTUBE_SELECTOR_AUTHORITY_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_REPO_LIFECYCLE_PRIMITIVE_COVERAGE_2026-05-18.md',
    'docs/audit/FILTERTUBE_ACTIVE_RULE_AUTHORITY_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_UNIFIED_MUTATION_CONTRACT_AUDIT_2026-05-18.md',
    'docs/audit/FILTERTUBE_P0_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_P0_FAMILY_PROOF_COVERAGE_2026-05-19.md',
    'docs/audit/FILTERTUBE_SETTINGS_REFRESH_FANOUT_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_COMPILED_CACHE_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_COMPILER_PARITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_IDENTITY_INFORMATION_WATERFALL_CURRENT_BEHAVIOR_2026-05-19.md',
    'tests/runtime/identity-information-waterfall-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_IDENTITY_WATERFALL_ASSERTION_BOUNDARY_2026-05-20.md',
    'tests/runtime/identity-waterfall-assertion-boundary-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_IDENTITY_WATERFALL_REVIEW_CONVERGENCE_2026-05-20.md',
    'tests/runtime/identity-waterfall-review-convergence-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_DOCUMENT_START_ZERO_FLASH_BOUNDARY_2026-05-21.md',
    'tests/runtime/document-start-zero-flash-boundary-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_IDENTITY_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-20.md',
    'tests/runtime/identity-work-budget-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_IDENTITY_RESOLVER_FANOUT_CURRENT_BEHAVIOR_2026-05-20.md',
    'tests/runtime/identity-resolver-fanout-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_IDENTITY_RESOLVER_CACHE_DEDUPE_CURRENT_BEHAVIOR_2026-05-20.md',
    'tests/runtime/identity-resolver-cache-dedupe-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_LEARNED_IDENTITY_MAP_WRITE_ENTRYPOINT_REGISTER_2026-05-20.md',
    'tests/runtime/learned-identity-map-write-entrypoint-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_DOM_IDENTITY_CONFIDENCE_CURRENT_BEHAVIOR_2026-05-20.md',
    'tests/runtime/dom-identity-confidence-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_SURFACE_INFORMATION_AVAILABILITY_CURRENT_BEHAVIOR_2026-05-20.md',
    'tests/runtime/surface-information-availability-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md',
    'tests/runtime/audit-completion-gap-register-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_P0_OBLIGATION_STATUS_LEDGER_2026-05-20.md',
    'tests/runtime/p0-obligation-status-ledger-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_FEATURE_SOURCE_DEPENDENCY_REGISTER_2026-05-20.md',
    'tests/runtime/feature-source-dependency-register-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_SOURCE_TIER_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md',
    'tests/runtime/source-tier-effect-authority-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md',
    'tests/runtime/mode-surface-effect-matrix-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_NETWORK_FETCH_REASON_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md',
    'tests/runtime/network-fetch-reason-matrix-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_JSON_RUNTIME_COVERAGE_GAP_REGISTER_2026-05-20.md',
    'tests/runtime/json-runtime-coverage-gap-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_PERFORMANCE_CLAIM_EVIDENCE_BOUNDARY_2026-05-20.md',
    'tests/runtime/performance-claim-evidence-boundary-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_REFERENCE_DOC_CLAIM_DRIFT_CURRENT_BEHAVIOR_2026-05-19.md',
    'tests/runtime/reference-doc-claim-drift-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_HIDE_DECISION_PIPELINE_CURRENT_BEHAVIOR_2026-05-19.md',
    'tests/runtime/hide-decision-pipeline-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_DIRECT_HIDE_WRITER_REGISTER_2026-05-20.md',
    'tests/runtime/direct-hide-writer-register-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_SYNTHETIC_EVENT_ACTION_REGISTER_2026-05-20.md',
    'tests/runtime/synthetic-event-action-register-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md',
    'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md',
    'tests/runtime/raw-capture-extraction-obligation-index-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_SOURCE_OF_TRUTH_CLAIM_REGISTER_2026-05-20.md',
    'tests/runtime/source-of-truth-claim-register-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_LIFECYCLE_TEARDOWN_DECISION_REGISTER_2026-05-20.md',
    'tests/runtime/lifecycle-teardown-decision-register-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_STATIC_HTML_SUPPORT_SCRIPT_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md',
    'tests/runtime/static-html-support-script-surface-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md',
    'tests/runtime/implementation-readiness-gate-current-behavior.test.mjs'
  ]) {
    assert.ok(doc.includes(artifact), `missing artifact citation ${artifact}`);
  }
});

test('objective coverage ledger records lifecycle teardown decision as local cleanup not shared disposal authority', () => {
  const doc = ledger();

  assert.match(doc, /Lifecycle teardown decision register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_LIFECYCLE_TEARDOWN_DECISION_REGISTER_2026-05-20\.md/);
  assert.match(doc, /tests\/runtime\/lifecycle-teardown-decision-register-current-behavior\.test\.mjs/);
  assert.match(doc, /separates source counts and local cleanup from actual owner disposal/);
  assert.match(doc, /seed page transport, content-bridge prefetch\/hydration, whitelist pending refresh/);
  assert.match(doc, /fallback menu, quick block, normal menu\/Kids passive menu, DOM fallback/);
  assert.match(doc, /playlist\/player guards, collaborator dialog, extension UI, and website components/);
  assert.match(doc, /`explicit-teardown`, `bounded-warmup`, and `navigation-scoped` cleanup/);
  assert.match(doc, /not enough to delete or merge an owner while equivalent page-lifetime work remains elsewhere/);
  assert.match(doc, /`lifecycleTeardownDecision`, `lifecycleTeardownRegistry`, and `lifecycleOwnerTeardownReport`/);
  assert.match(doc, /do not exist in runtime source yet/);
});

test('objective coverage ledger records tracked file obligations as open per-file gates', () => {
  const doc = ledger();

  assert.match(doc, /Tracked file coverage/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20\.md/);
  assert.match(doc, /tests\/runtime\/tracked-file-obligation-index-current-behavior\.test\.mjs/);
  assert.match(doc, /149 tracked files are classified and now have one open per-file obligation row/);
  assert.match(doc, /not every tracked path has behavior, release, quarantine, or asset-budget fixtures/);
  assert.match(doc, /first optimization structural burden queue with 12 source-locus rows/);
  assert.match(doc, /5 large runtime source files/);
  assert.match(doc, /0 implementation-ready structural cleanup rows/);
  assert.match(doc, /JSON-first structural optimization/);
});

test('objective coverage ledger records feature source dependency register as a feature gate', () => {
  const doc = ledger();

  assert.match(doc, /Feature source dependency register addendum/);
  assert.match(doc, /rule-state source, content\/text source, identity source/);
  assert.match(doc, /DOM\/lifecycle source, side effects, dependency risk, and proof gate/);
  assert.match(doc, /visible features and hidden dependency workflows/);
  assert.match(doc, /endpoint\/no-work, collaborator recovery, subscribed-channel whitelist import/);
  assert.match(doc, /prompt\/onboarding, stats, profile\/PIN, YTM, Kids, release claims/);
  assert.match(doc, /simultaneous allow\/block future work/);
});

test('objective coverage ledger records source tier effect authority as information not permission', () => {
  const doc = ledger();

  assert.match(doc, /Source tier\/effect authority addendum/);
  assert.match(doc, /source waterfall is only an information priority order/);
  assert.match(doc, /YouTubei JSON, `ytInitial\*` snapshots, learned maps, DOM extraction, and network fallback/);
  assert.match(doc, /harvest, mutation, DOM hide, restore, map write, resolver fetch, optimistic hide, fanout, and stats/);
  assert.match(doc, /`sourceTierEffectAuthority`, `sourceTierEffectDecision`, `identityWorkBudgetDecision`/);
  assert.match(doc, /`hideDecisionAuthority`, and `resolverEffectBudget`/);
  assert.match(doc, /do not exist in runtime source yet/);
});

test('objective coverage ledger records mode surface effect matrix as profile route mode authority gap', () => {
  const doc = ledger();

  assert.match(doc, /Mode\/surface effect matrix addendum/);
  assert.match(doc, /channel-identity waterfall is source priority, not permission/);
  assert.match(doc, /Main\/Kids\/YTM\/watch\/Shorts\/playlist\/Mix\/comments\/posts\/native overlays/);
  assert.match(doc, /different source confidence and allowed effects/);
  assert.match(doc, /empty blocklist and empty whitelist have opposite policies/);
  assert.match(doc, /UI viewing-space flags are not runtime denial gates today/);
  assert.match(doc, /quick\/menu action gates do not bound lifecycle or post-action enrichment/);
  assert.match(doc, /`modeSurfaceEffectAuthority`, `modeSurfaceEffectDecision`, `emptyListModePolicy`/);
  assert.match(doc, /`surfaceModeEffectBudget`, and `runtimeViewingSpacePolicy`/);
  assert.match(doc, /do not exist in runtime source yet/);
});

test('objective coverage ledger records identity effect obligations as source confidence plus effect gates', () => {
  const doc = ledger();

  assert.match(doc, /Identity effect obligation crosswalk addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_IDENTITY_EFFECT_OBLIGATION_CROSSWALK_2026-05-20\.md/);
  assert.match(doc, /tests\/runtime\/identity-effect-obligation-crosswalk-current-behavior\.test\.mjs/);
  assert.match(doc, /14 blocked identity-effect obligations/);
  assert.match(doc, /endpoint body no-work, direct JSON renderer effects, harvest-only map writes/);
  assert.match(doc, /learned-map joins, stable DOM links, display-only names/);
  assert.match(doc, /network resolvers, post-action fanout, playlist\/Mix identity, Kids\/YTM identity/);
  assert.match(doc, /hide\/restore\/stats effects/);
  assert.match(doc, /future changes need an `identityEffectDecision`-style report/);
  assert.match(doc, /source confidence can authorize hide, allow, map write, DOM scan, restore, stats, network, or fanout effects/);
});

test('objective coverage ledger records document start zero flash as startup capability not guarantee', () => {
  const doc = ledger();

  assert.match(doc, /Document-start zero-flash boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_DOCUMENT_START_ZERO_FLASH_BOUNDARY_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/document-start-zero-flash-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /document-start seed injection is a startup capability, not a blanket guarantee/);
  assert.match(doc, /observe and sometimes mutate supported YouTube JSON\/page-global payloads before render/);
  assert.match(doc, /active rules and covered fields prove mutation is allowed/);
  assert.match(doc, /empty\/disabled states can still install hooks, mark endpoints, parse\/clone data/);
  assert.match(doc, /harvest metadata, queue work, and replay snapshots/);
  assert.match(doc, /`documentStartWorkDecision`, `prePaintMutationDecision`, `seedNoWorkDecision`/);
  assert.match(doc, /queue\/replay budget proof before changing early hooks or zero-flash claims/);
});

test('objective coverage ledger records JSON runtime coverage gaps separately from documented paths', () => {
  const doc = ledger();

  assert.match(doc, /JSON runtime coverage gap addendum/);
  assert.match(doc, /documented JSON fields are not automatically consumed by runtime rules/);
  assert.match(doc, /direct-rule, harvest-only, joined-by-video-id, documented-gap, and unsupported\/direct-gap/);
  assert.match(doc, /Shorts owner paths, reel owner id\/handle\/logo/);
  assert.match(doc, /showSheet collaborator rosters, compact playlist creator identity/);
  assert.match(doc, /Mix playlist identity, direct watch-card renderers, shared posts, and comment metadata/);
  assert.match(doc, /field effect must be named separately from field availability/);
  assert.match(doc, /`jsonRuntimeCoverageAuthority`, `rendererFieldCoverageClass`, and `jsonFieldEffectAuthority`/);
  assert.match(doc, /do not exist in runtime source yet/);
});

test('objective coverage ledger records JSON section coverage index across encyclopedia headings', () => {
  const doc = ledger();

  assert.match(doc, /JSON section coverage index addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_SECTION_COVERAGE_INDEX_2026-05-20\.md/);
  assert.match(doc, /tests\/runtime\/json-section-coverage-index-current-behavior\.test\.mjs/);
  assert.match(doc, /every current `###` section heading in `docs\/json_paths_encyclopedia\.md`/);
  assert.match(doc, /`direct-rule`, `direct-rule-partial`, `harvest-only`, `joined-by-video-id`, `support-model`, or `unsupported\/direct-gap`/);
  assert.match(doc, /current encyclopedia has 20 section headings/);
  assert.match(doc, /`compactPlaylistRenderer`, `reelPlayerOverlayRenderer`, `searchRefinementCardRenderer`, `compactChannelRenderer`, and `sharedPostRenderer` remain direct-rule gaps/);
  assert.match(doc, /direct rules still consume only partial documented fields/);
  assert.match(doc, /`jsonSectionCoverageDecision`, `jsonSectionCoverageIndex`, `documentedJsonSectionAuthority`, and `jsonSectionFieldEffectAuthority`/);
  assert.match(doc, /do not exist in runtime source yet/);
});

test('objective coverage ledger records filter logic direct renderer rules as source-derived semantic rows', () => {
  const doc = ledger();

  assert.match(doc, /Filter logic direct renderer rule semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_FILTER_LOGIC_DIRECT_RENDERER_RULE_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/filter-logic-direct-renderer-rule-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, renderer, method\/callable, source\/effect/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/filter_logic\.js` `FILTER_RULES`/);
  assert.match(doc, /45 top-level source declarations/);
  assert.match(doc, /44 unique renderer keys/);
  assert.match(doc, /duplicate `gridVideoRenderer` declarations at lines 431 and 604/);
  assert.match(doc, /7 `BASE_VIDEO_RULES` aliases/);
  assert.match(doc, /38 object literal rules/);
  assert.match(doc, /11 semantic rule groups/);
  assert.match(doc, /direct renderer keys are not every JSON path/);
  assert.match(doc, /unsupported direct gaps remain for `compactPlaylistRenderer`/);
  assert.match(doc, /`watchCardHeroVideoRenderer`, `watchCardRHPanelVideoRenderer`, `watchCardRichHeaderRenderer`/);
  assert.match(doc, /`filterLogicDirectRuleAuthority`, `filterLogicRendererRuleReport`, `rendererRuleDuplicatePolicy`, `rendererRuleFieldPathManifest`, `rendererRuleEffectDecision`, or `rendererRuleFixtureProvenance`/);
});

test('objective coverage ledger records filter logic rule paths as source-derived runtime path rows', () => {
  const doc = ledger();

  assert.match(doc, /Filter logic rule path semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/filter-logic-rule-path-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, renderer, source\/effect, settings-mode/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /source-derived runtime rule-path coverage/);
  assert.match(doc, /9 `BASE_VIDEO_RULES` field rows/);
  assert.match(doc, /27 `BASE_VIDEO_RULES` authored path rows/);
  assert.match(doc, /45 `FILTER_RULES` source declarations/);
  assert.match(doc, /467 `FILTER_RULES` source path rows before duplicate override/);
  assert.match(doc, /494 source-authored path rows including `BASE_VIDEO_RULES`/);
  assert.match(doc, /44 effective runtime renderer keys after duplicate override/);
  assert.match(doc, /6 effective `BASE_VIDEO_RULES` aliases/);
  assert.match(doc, /38 effective object literal rules/);
  assert.match(doc, /440 effective runtime path rows/);
  assert.match(doc, /174 effective unique path literals/);
  assert.match(doc, /177 effective renderer-field pairs/);
  assert.match(doc, /157 dot-index path rows/);
  assert.match(doc, /0 bracket-index path rows/);
  assert.match(doc, /151 text-match path rows/);
  assert.match(doc, /152 channel identity path rows/);
  assert.match(doc, /34 video identity path rows/);
  assert.match(doc, /103 metadata predicate path rows/);
  assert.match(doc, /duplicate `gridVideoRenderer` source declarations make source-row counts differ from effective runtime rows/);
  assert.match(doc, /current runtime path strings use `runs\.0\.text` syntax rather than `runs\[0\]\.text`/);
  assert.match(doc, /documented encyclopedia paths are not loaded by runtime\/build source/);
  assert.match(doc, /direct JSON path coverage still does not prove DOM fallback can be deleted/);
  assert.match(doc, /`filterLogicRulePathAuthority`, `filterLogicRulePathManifest`, `filterLogicRulePathSyntaxContract`, `filterLogicEffectiveRendererPathReport`, `filterLogicDuplicatePathOverridePolicy`, `filterLogicJsonDomParityReport`, `filterLogicPathFixtureProvenance`, `filterLogicJsonFirstReadinessGate`, `filterLogicPathEffectDecision`, or `filterLogicPathNoRuleBudget`/);
});

test('objective coverage ledger records filter logic rule field effects as current behavior only', () => {
  const doc = ledger();

  assert.match(doc, /Filter logic rule field effect semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/filter-logic-rule-field-effect-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /runtime path-string coverage to field-effect coverage/);
  assert.match(doc, /11 rule fields with runtime consumers/);
  assert.match(doc, /9 consumer methods with `rules\.<field>` references/);
  assert.match(doc, /20 method-field consumer pairs/);
  assert.match(doc, /63 `rules\.<field>` token references/);
  assert.match(doc, /440 inherited effective runtime path rows/);
  assert.match(doc, /174 inherited unique path literals/);
  assert.match(doc, /177 inherited renderer-field pairs/);
  assert.match(doc, /`viewCount` has no current view-count threshold predicate/);
  assert.match(doc, /`videoId` is a join key rather than channel identity/);
  assert.match(doc, /`_checkCategoryFilters\(\)` can schedule `scheduleVideoMetaFetch\(\)`/);
  assert.match(doc, /`processData\(\)` harvests channel mappings before the disabled-filtering skip/);
  assert.match(doc, /`filterLogicRuleFieldEffectAuthority`, `filterLogicRuleFieldEffectManifest`, `filterLogicJsonPathEffectDecision`, `filterLogicFieldConsumerReport`, `filterLogicViewCountPredicateAuthority`, `filterLogicCategoryFetchBudget`, `filterLogicWhitelistFieldEffectReport`, `filterLogicRuleFieldFixtureProvenance`, `filterLogicRuleFieldNoWorkBudget`, or `filterLogicJsonFirstEffectGate`/);
});

test('objective coverage ledger records filter logic methods as source-derived semantic rows', () => {
  const doc = ledger();

  assert.match(doc, /Filter logic method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_FILTER_LOGIC_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/filter-logic-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, JSON path, renderer, source\/effect/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/filter_logic\.js`/);
  assert.match(doc, /55 current method and entrypoint rows/);
  assert.match(doc, /12 top-level helper function declarations/);
  assert.match(doc, /41 `YouTubeDataFilter` class methods/);
  assert.match(doc, /2 `FilterTubeEngine` global interface functions/);
  assert.match(doc, /11 semantic method groups/);
  assert.match(doc, /harvest\/map writes/);
  assert.match(doc, /block decisions/);
  assert.match(doc, /`processData\(\)` harvests before the disabled filtering skip/);
  assert.match(doc, /delayed page-message batches/);
  assert.match(doc, /`filterLogicMethodAuthority`, `filterLogicMethodEffectReport`, `filterLogicNoRuleMethodBudget`, `filterLogicHarvestMutationDecision`, `filterLogicEntrypointContract`, or `filterLogicMethodFixtureProvenance`/);
});

test('objective coverage ledger records seed methods as source-derived transport callback rows', () => {
  const doc = ledger();

  assert.match(doc, /Seed method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SEED_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/seed-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, runtime lifecycle, JSON endpoint\/body-work/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/seed\.js`/);
  assert.match(doc, /35 current method\/callback rows/);
  assert.match(doc, /13 top-level function declarations/);
  assert.match(doc, /6 local helper functions/);
  assert.match(doc, /5 page\/prototype patch functions/);
  assert.match(doc, /6 property accessor functions/);
  assert.match(doc, /1 timer callback/);
  assert.match(doc, /1 local wrapped-listener callback/);
  assert.match(doc, /2 bootstrap entrypoints/);
  assert.match(doc, /8 semantic method groups/);
  assert.match(doc, /fetch interception clones\/parses matching endpoint bodies before disabled\/no-settings pass-through/);
  assert.match(doc, /harvest-only and mutation are separate seed effects/);
  assert.match(doc, /`ytInitial\*` accessors plus settings replay can reassign page globals/);
  assert.match(doc, /XHR interception installs per-object response accessors/);
  assert.match(doc, /`seedMethodAuthority`, `seedMethodEffectReport`, `seedNoWorkBudget`, `seedTransportPatchOwner`, `seedReplayQueueBudget`, `seedAccessorContract`, or `seedPageGlobalFixtureProvenance`/);
});

test('objective coverage ledger records DOM fallback methods as source-derived visual side-effect rows', () => {
  const doc = ledger();

  assert.match(doc, /DOM fallback method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_DOM_FALLBACK_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/dom-fallback-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, DOM selector, lifecycle, settings-mode/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/content\/dom_fallback\.js` and `js\/content\/dom_helpers\.js`/);
  assert.match(doc, /49 top-level function declarations/);
  assert.match(doc, /46 in `dom_fallback\.js`/);
  assert.match(doc, /3 in `dom_helpers\.js`/);
  assert.match(doc, /11 semantic method groups/);
  assert.match(doc, /run-state\/tracking/);
  assert.match(doc, /identity normalization and compiled rules/);
  assert.match(doc, /playlist\/watch route identity/);
  assert.match(doc, /blocked markers and stale restore/);
  assert.match(doc, /dynamic style controls/);
  assert.match(doc, /fallback surface handlers/);
  assert.match(doc, /main DOM fallback pipeline/);
  assert.match(doc, /hide decision engine/);
  assert.match(doc, /shared visual writers/);
  assert.match(doc, /`applyDOMFallback\(\)` installs page-lifetime scroll and playlist guards/);
  assert.match(doc, /writes direct display CSS beside `toggleVisibility\(\)`/);
  assert.match(doc, /`domFallbackMethodAuthority`, `domFallbackEffectReport`, `domFallbackNoWorkBudget`, `domFallbackLifecycleOwner`, `domFallbackHideDecisionReport`, `domFallbackSelectorTargetReport`, `domFallbackGlobalDependencyContract`, or `domHelperVisualWriterReport`/);
});

test('objective coverage ledger records network fetch reasons separately from source order', () => {
  const doc = ledger();

  assert.match(doc, /Network fetch reason matrix addendum/);
  assert.match(doc, /identity waterfall does not classify fetch reasons/);
  assert.match(doc, /passive interception, explicit import, metadata fetch, identity fallback/);
  assert.match(doc, /menu-open enrichment, DOM repair, clicked-target retry, post-block fanout/);
  assert.match(doc, /caller-requested channel fetch/);
  assert.match(doc, /owner, trigger, route, profile, credentials, budget, dedupe, and side-effect proof/);
  assert.match(doc, /`networkFetchReasonAuthority`, `networkFetchReasonDecision`, `metadataFetchReasonBudget`/);
  assert.match(doc, /`identityFallbackFetchBudget`, `postActionFetchFanoutBudget`, or `noRuleNetworkFetchCounter`/);
  assert.match(doc, /exists yet/);
});

test('objective coverage ledger records resolver cache dedupe separately from resolver authority', () => {
  const doc = ledger();

  assert.match(doc, /Identity resolver cache\/dedupe addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_IDENTITY_RESOLVER_CACHE_DEDUPE_CURRENT_BEHAVIOR_2026-05-20\.md/);
  assert.match(doc, /tests\/runtime\/identity-resolver-cache-dedupe-current-behavior\.test\.mjs/);
  assert.match(doc, /resolver work is partially cached, coalesced, queued, and rate-limited today/);
  assert.match(doc, /background Shorts\/watch\/Kids session caches and pending maps/);
  assert.match(doc, /content-side watch\/Shorts in-flight maps/);
  assert.match(doc, /handle resolver `PENDING` state, watch metadata queues, dropdown pending enrichment/);
  assert.match(doc, /post-block six-hour fanout/);
  assert.match(doc, /`identityResolverCacheDecision`, `identityResolverDedupeAuthority`, `resolverFetchBudget`/);
  assert.match(doc, /`noRuleResolverCounter`, `postActionResolverFanoutBudget`, and `handleResolverPendingPolicy`/);
  assert.match(doc, /do not exist in runtime source yet/);
});

test('objective coverage ledger records learned identity map write entrypoints separately from source order', () => {
  const doc = ledger();

  assert.match(doc, /Learned identity map write entrypoint addendum/);
  assert.match(doc, /FILTERTUBE_LEARNED_IDENTITY_MAP_WRITE_ENTRYPOINT_REGISTER_2026-05-20\.md/);
  assert.match(doc, /learned-identity-map-write-entrypoint-current-behavior\.test\.mjs/);
  assert.match(doc, /current write plane for `channelMap`, `videoChannelMap`, and `videoMetaMap`/);
  assert.match(doc, /engine harvest queues, channel\/custom URL harvest, card prefetch\/hydration/);
  assert.match(doc, /generic persistence helpers, same-window page messages, direct custom URL storage/);
  assert.match(doc, /post-block Shorts\/playlist fanout, menu\/action mapping broadcast/);
  assert.match(doc, /successful block video mapping, content handle resolver writes/);
  assert.match(doc, /background queues, background message receivers, compiled cache patching/);
  assert.match(doc, /channel-add resolver repair/);
  assert.match(doc, /passive harvest, visible DOM hydration, resolver repair, post-action fanout, metadata rerun, and direct storage bypass/);
  assert.match(doc, /`learnedIdentityMapWriteDecision`, `learnedIdentityMapWriteAuthority`, `identityMapProvenanceReport`/);
  assert.match(doc, /`mapWriteRevisionPolicy`, and `mapWriteEffectBudget`/);
  assert.match(doc, /do not exist in runtime source yet/);
});

test('objective coverage ledger records learned identity map cache persistence boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Learned identity map cache persistence boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_LEARNED_IDENTITY_MAP_CACHE_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/learned-identity-map-cache-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /learned-identity, storage\/cache, settings refresh, JSON path, no-work optimization/);
  assert.match(doc, /DOM stamp, DOM fallback rerun, performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct cache persistence proof/);
  assert.match(doc, /5 learned identity map cache persistence source files/);
  assert.match(doc, /7 source\/effect blocks/);
  assert.match(doc, /264 background map cache cluster block lines/);
  assert.match(doc, /8987 background map cache cluster block bytes/);
  assert.match(doc, /27 background map message receiver block lines/);
  assert.match(doc, /1185 background map message receiver block bytes/);
  assert.match(doc, /92 content_bridge map persistence helpers block lines/);
  assert.match(doc, /3966 content_bridge map persistence helpers block bytes/);
  assert.match(doc, /103 content_bridge main-world map receiver block lines/);
  assert.match(doc, /4981 content_bridge main-world map receiver block bytes/);
  assert.match(doc, /58 bridge_settings map storage-change block lines/);
  assert.match(doc, /1855 bridge_settings map storage-change block bytes/);
  assert.match(doc, /16 state_manager persistChannelMap block lines/);
  assert.match(doc, /468 state_manager persistChannelMap block bytes/);
  assert.match(doc, /95 filter_logic map producer cluster block lines/);
  assert.match(doc, /3795 filter_logic map producer cluster block bytes/);
  assert.match(doc, /11 runtime learned identity map cache persistence fixtures/);
  assert.match(doc, /filter_logic producers validate and batch before page messages/);
  assert.match(doc, /background uses three debounced flush timers without revision reports/);
  assert.match(doc, /background map message receivers accept updates without sender policy or profile gates/);
  assert.match(doc, /content_bridge helpers patch local settings before background persistence/);
  assert.match(doc, /page-message receivers can stamp DOM, rerun fallback, and bypass background cache through direct custom URL storage/);
  assert.match(doc, /bridge_settings treats `channelMap`-only changes differently from `videoChannelMap`\/`videoMetaMap` changes/);
  assert.match(doc, /StateManager can write `channelMap` directly/);
  assert.match(doc, /`learnedIdentityMapCachePersistenceContract`, `learnedIdentityMapCacheFlushReport`, `learnedIdentityMapCacheRevisionPolicy`, `learnedIdentityMapDirectStorageBypassReport`, `learnedIdentityMapStorageRefreshPolicy`, `learnedIdentityMapCompiledCachePatchReport`, `learnedIdentityMapProducerReceiverParityReport`, `learnedIdentityMapFixtureProvenance`, or `learnedIdentityMapMetricArtifact`/);
});

test('objective coverage ledger records raw capture extraction obligations as provenance-only gates', () => {
  const doc = ledger();

  assert.match(doc, /Raw capture extraction obligation index addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20\.md/);
  assert.match(doc, /tests\/runtime\/raw-capture-extraction-obligation-index-current-behavior\.test\.mjs/);
  assert.match(doc, /all 46 unique ignored capture paths as extraction obligations/);
  assert.match(doc, /45 present local raw captures and one missing historical path/);
  assert.match(doc, /out of release inputs/);
  assert.match(doc, /explicit fixture provenance instead of loose substring matching/);
  assert.match(doc, /source tier rather than source-of-truth wording/);
  assert.match(doc, /raw captures, XHR JSON, `ytInitial\*`, learned maps, DOM extraction, and network fallback/);
  assert.match(doc, /route, mode, expected-decision, side-effect, negative-sibling, and authority proof/);
});

test('objective coverage ledger records source-of-truth claim wording as an authority boundary', () => {
  const doc = ledger();

  assert.match(doc, /Source-of-truth claim register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SOURCE_OF_TRUTH_CLAIM_REGISTER_2026-05-20\.md/);
  assert.match(doc, /tests\/runtime\/source-of-truth-claim-register-current-behavior\.test\.mjs/);
  assert.match(doc, /all 89 exact `source of truth` \/ `source-of-truth` wording occurrences/);
  assert.match(doc, /narrow local ownership from historical planning/);
  assert.match(doc, /broad StateManager\/importer wording has been narrowed/);
  assert.match(doc, /historical planning, release-sync ownership, audit-boundary wording/);
  assert.match(doc, /misleading identity\/effect claims/);
  assert.match(doc, /route, surface, profile, list mode, source tier, confidence/);
  assert.match(doc, /allowed\/forbidden effects, positive\/negative fixtures, restore proof/);
  assert.match(doc, /no-rule budget, and teardown\/pause proof/);
});

test('objective coverage ledger records direct hide writers as exact visual-side-effect gates', () => {
  const doc = ledger();

  assert.match(doc, /Direct hide-writer register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_DIRECT_HIDE_WRITER_REGISTER_2026-05-20\.md/);
  assert.match(doc, /tests\/runtime\/direct-hide-writer-register-current-behavior\.test\.mjs/);
  assert.match(doc, /all 23 active page-runtime direct `display:none` writers/);
  assert.match(doc, /shared helper, shell\/menu cleanup, broad-control fallback/);
  assert.match(doc, /whitelist pending identity, user-action optimistic\/confirmed hides/);
  assert.match(doc, /post-action Shorts\/playlist enrichment/);
  assert.match(doc, /`hideWriterRegistry`, `hideWriterDecision`, `hideRestoreAuthority`/);
  assert.match(doc, /`directHideWriterReport`, `displayWriterStatsPolicy`, and `displayWriterRestoreOwner`/);
  assert.match(doc, /do not exist in runtime source yet/);
});

test('objective coverage ledger records synthetic event actions as observable engagement gates', () => {
  const doc = ledger();

  assert.match(doc, /Synthetic event\/action register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SYNTHETIC_EVENT_ACTION_REGISTER_2026-05-20\.md/);
  assert.match(doc, /tests\/runtime\/synthetic-event-action-register-current-behavior\.test\.mjs/);
  assert.match(doc, /all 15 active page-runtime synthetic `\.click\(\)` and `\.dispatchEvent\(\)` writes/);
  assert.match(doc, /menu cleanup events, watch\/playlist navigation clicks, generic target clicks/);
  assert.match(doc, /subscription-import automation, and readiness events/);
  assert.match(doc, /`syntheticEventActionAuthority`, `observableActionBudget`, `syntheticClickDecision`/);
  assert.match(doc, /`syntheticDispatchDecision`, `navigationSideEffectBudget`, and `userInitiatedActionProof`/);
  assert.match(doc, /do not exist in runtime source yet/);
});

test('objective coverage ledger records performance claim evidence as unmeasured until a metric authority exists', () => {
  const doc = ledger();

  assert.match(doc, /Performance claim evidence addendum/);
  assert.match(doc, /historical numeric claims/);
  assert.match(doc, /60-80% CPU reduction/);
  assert.match(doc, /70-90% I\/O reduction/);
  assert.match(doc, /90%\+ perceived-lag reduction/);
  assert.match(doc, /DOM extraction under 5ms/);
  assert.match(doc, /network fetch under 2000ms at p95/);
  assert.match(doc, /cache hit rate over 80%/);
  assert.match(doc, /`performanceClaimAuthority`, `runtimeMetricSample`, `emptyInstallNoWorkMetric`, and `routeWorkBudgetReport`/);
  assert.match(doc, /route, browser\/device, rule-state, sample-size, and artifact evidence/);
});

test('objective coverage ledger records audit completion gap register as a meta gate', () => {
  const doc = ledger();

  assert.match(doc, /Audit completion gap register addendum/);
  assert.match(doc, /active goal remains open/);
  assert.match(doc, /`npm run audit:runtime` is green/);
  assert.match(doc, /every feature, file, method, JSON path, DOM selector, lifecycle primitive/);
  assert.match(doc, /settings mode, cross-feature interaction, reliability risk, false-hide risk/);
  assert.match(doc, /leak risk, performance risk, code-burden risk, and implementation boundary/);
  assert.match(doc, /positive, negative, route, mode, side-effect, restore, provenance, and authority proof/);
  assert.match(doc, /before behavior changes/);
  assert.match(doc, /2026-05-30 settings refresh fanout metric sample linkage/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md'));
  assert.ok(doc.includes('docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_READINESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-29.md'));
  assert.match(doc, /without creating metric artifacts or runtime collectors/);
  assert.match(doc, /settings\s+refresh fanout metric sample linkage rows: 9/);
  assert.match(doc, /source settings-refresh fanout\s+rows linked: 9/);
  assert.match(doc, /inline `domLifecycleCounters` fanout fields linked: 8/);
  assert.match(doc, /committed metric sample files from fanout linkage: 0/);
  assert.match(doc, /runtime behavior changed\s+by fanout linkage: no/);
  assert.match(doc, /runtime collector insertion from fanout linkage: NO-GO/);
  assert.match(doc, /observer\/menu\/quick pruning from fanout linkage: NO-GO/);
  assert.match(doc, /whitelist optimization\s+from fanout linkage: NO-GO/);
  assert.match(doc, /JSON-first promotion from fanout linkage:\s+NO-GO/);
  assert.match(doc, /blocking collector insertion, observer\/menu\/quick pruning, whitelist\s+optimization, JSON-first promotion, release\/public-claim use, and broad goal\s+completion/);
});

test('objective coverage ledger records active goal completion audit as current-state completion gate', () => {
  const doc = ledger();

  assert.match(doc, /Active goal completion audit addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/active-goal-completion-audit-current-behavior\.test\.mjs/);
  assert.match(doc, /active-thread completion rule to the exact user objective/);
  assert.match(doc, /149 tracked files still have open obligations/);
  assert.match(doc, /69 tracked JS\/JSX\/MJS files have lexical callable accounting/);
  assert.match(doc, /5,673 callables are lexical rather than semantic method proof/);
  assert.match(doc, /0 files have complete per-callable semantic proof/);
  assert.match(doc, /5,673 lexical callables still require semantic proof before behavior changes/);
  assert.match(doc, /643 selector sites and 489 lifecycle instances/);
  assert.match(doc, /217\/217 P0 obligations remain `future-proof-missing`/);
  assert.match(doc, /`update_goal\(status='complete'\)` must not be called/);
});

test('objective coverage ledger records P0 obligation status as current proof not future proof', () => {
  const doc = ledger();

  assert.match(doc, /P0 obligation status ledger addendum/);
  assert.match(doc, /family-level current proof and obligation-level future proof/);
  assert.match(doc, /all 23 P0 families have current-behavior proof/);
  assert.match(doc, /all 217 named P0 obligations now have a per-obligation blocked index row/);
  assert.match(doc, /all 217 remain `future-proof-missing`/);
  assert.match(doc, /0 obligations are implementation-ready/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_P0_OBLIGATION_INDEX_2026-05-20\.md/);
  assert.match(doc, /tests\/runtime\/p0-obligation-index-current-behavior\.test\.mjs/);
});

test('objective coverage ledger records surface information availability as an audit category', () => {
  const doc = ledger();

  assert.match(doc, /Surface information availability addendum/);
  assert.match(doc, /field availability and source confidence/);
  assert.match(doc, /Main home\/search, Main watch, Shorts, watch rail\/end screen, playlist\/Mix/);
  assert.match(doc, /YouTube Kids, YouTube Music, collaborator surfaces, posts, comments/);
  assert.match(doc, /`canonical`, `joinedByVideoId`, `displayOnly`, `fallback`, and `unknown`/);
  assert.match(doc, /rather than runtime authority/);
});

test('objective coverage ledger records route identity decision index as route-level waterfall proof', () => {
  const doc = ledger();

  assert.match(doc, /Route identity decision index addendum/);
  assert.match(doc, /identity waterfall into a route-level decision map/);
  assert.match(doc, /Main home\/search, Main watch, Shorts/);
  assert.match(doc, /watch rail\/end screen\/compact autoplay, watch playlist\/Mix/);
  assert.match(doc, /YouTube Kids, YouTube Music, collaborator\/dialog\/sheet surfaces/);
  assert.match(doc, /posts\/comments\/community/);
  assert.match(doc, /`direct-json-decision`, `harvest-then-join`, `dom-target-extraction`/);
  assert.match(doc, /`resolver-recovery`, `post-action-fanout`, and `unsupported-route-gap`/);
  assert.match(doc, /`routeIdentityDecision`, `routeIdentityDecisionIndex`, `routeIdentityDecisionAuthority`, and `routeIdentitySourceEffectReport`/);
  assert.match(doc, /do not exist in runtime source yet/);
});

test('objective coverage ledger records identity flow diagrams as source-backed route proof', () => {
  const doc = ledger();

  assert.match(doc, /Identity flow diagram register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_IDENTITY_FLOW_DIAGRAM_REGISTER_2026-05-20\.md/);
  assert.match(doc, /tests\/runtime\/identity-flow-diagram-register-current-behavior\.test\.mjs/);
  assert.match(doc, /ASCII flow diagrams for endpoint body to learned maps/);
  assert.match(doc, /watch current video, Shorts, watch playlist\/Mix/);
  assert.match(doc, /collaborator dialogs\/sheets, Kids\/YTM, and post-action fanout/);
  assert.match(doc, /source-confidence class, join keys, fallback owner/);
  assert.match(doc, /exact target versus visible-sibling fanout/);
  assert.match(doc, /allowed\/forbidden effects, resolver reason, positive\/negative fixture/);
  assert.match(doc, /`identityFlowDiagramAuthority`, `identityFlowDecision`, and `identityFlowEffectReport`/);
  assert.match(doc, /do not exist in runtime source yet/);
});

test('objective coverage ledger records identity waterfall assertion boundary as priority not guarantee', () => {
  const doc = ledger();

  assert.match(doc, /Identity waterfall assertion boundary addendum/);
  assert.match(doc, /`XHR JSON -> ytInitial\* -> DOM -> network fetch` is a priority order/);
  assert.match(doc, /rather than an implementation guarantee/);
  assert.match(doc, /JSON\/player\/page-global data is preferred/);
  assert.match(doc, /`videoId` is a join key rather than channel identity/);
  assert.match(doc, /DOM text can be display-only/);
  assert.match(doc, /network fallback still exists/);
  assert.match(doc, /post-block Shorts\/playlist enrichment can fan out beyond the clicked target/);
  assert.match(doc, /source-confidence and work-budget proof before optimization or fallback deletion/);
});

test('objective coverage ledger records immediacy claims as scoped local behavior only', () => {
  const doc = ledger();

  assert.match(doc, /Immediacy claim boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_IMMEDIACY_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/immediacy-claim-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /local immediacy is valid only for scoped paths/);
  assert.match(doc, /user-action optimistic hides/);
  assert.match(doc, /already-proven JSON\/player\/learned-map identity/);
  assert.match(doc, /successful post-block same-channel fanout/);
  assert.match(doc, /Instant playlist identity/);
  assert.match(doc, /nothing escapes during race conditions/);
  assert.match(doc, /hide any stray playlist rows instantaneously/);
  assert.match(doc, /Zero-Flash guarantees for Shorts even when metadata is missing/);
  assert.match(doc, /route\/surface, list mode, active-rule state, identity confidence/);
  assert.match(doc, /exact-target versus sibling-fanout classification/);
  assert.match(doc, /no-work budget, negative sibling-visible proof, and restore\/teardown proof/);
});

test('objective coverage ledger records identity waterfall review convergence as source tier plus effect boundary', () => {
  const doc = ledger();

  assert.match(doc, /Identity waterfall review convergence addendum/);
  assert.match(doc, /source-confidence priority order/);
  assert.match(doc, /direct JSON rule fields/);
  assert.match(doc, /harvest-only JSON fields/);
  assert.match(doc, /`videoId` joins/);
  assert.match(doc, /display-only DOM/);
  assert.match(doc, /action fanout/);
  assert.match(doc, /background resolvers/);
  assert.match(doc, /name both source tier and allowed effect/);
});

test('objective coverage ledger records identity work budget as separate from source confidence', () => {
  const doc = ledger();

  assert.match(doc, /Identity work budget addendum/);
  assert.match(doc, /source confidence is not work permission/);
  assert.match(doc, /endpoint body work, harvest-only work, page-global hooks/);
  assert.match(doc, /learned-map writes, DOM stamping\/reruns, metadata reruns/);
  assert.match(doc, /target resolver fetches, post-action Shorts\/playlist fanout/);
  assert.match(doc, /stale restore scans/);
  assert.match(doc, /split across seed, content bridge, DOM fallback, background cache, and background fetch paths/);
  assert.match(doc, /`identityWorkBudget`, `identityWorkBudgetDecision`, `postActionIdentityFanoutBudget`, and `noRuleIdentityWorkCounter`/);
  assert.match(doc, /do not exist in runtime source yet/);
});

test('objective coverage ledger records identity resolver fanout as separate resolver classes', () => {
  const doc = ledger();

  assert.match(doc, /Identity resolver\/fanout addendum/);
  assert.match(doc, /network fallback is not one thing/);
  assert.match(doc, /menu-open main-world lookup, clicked-target watch\/Shorts recovery/);
  assert.match(doc, /retry fallbacks, DOM fallback handle repair/);
  assert.match(doc, /background Shorts\/watch\/Kids identity fetches/);
  assert.match(doc, /post-block Shorts\/playlist fanout/);
  assert.match(doc, /different trigger, target, storage, DOM, and user-action semantics/);
  assert.match(doc, /`identityResolverAuthority`, `identityResolverDecision`, `identityResolverNetworkPolicy`, and `postActionIdentityFanoutBudget`/);
  assert.match(doc, /do not exist in runtime source yet/);
});

test('objective coverage ledger records DOM identity confidence as display-versus-hide boundary', () => {
  const doc = ledger();

  assert.match(doc, /DOM identity confidence addendum/);
  assert.match(doc, /UC id, handle, custom URL, name, videoId, learned map, current-page identity, and pending whitelist/);
  assert.match(doc, /display-only identity from hide\/allow\/stamp\/persist authority/);
  assert.match(doc, /recycled-card resets, prefetch stamping, card ownership checks/);
  assert.match(doc, /low-confidence name normalization, menu mismatch guards/);
  assert.match(doc, /whitelist pending hides, current-page identity copy, whitelist name fallback/);
  assert.match(doc, /unresolved whitelist blocking/);
  assert.match(doc, /`domIdentityConfidenceAuthority`/);
  assert.match(doc, /does not exist in runtime source yet/);
});

test('objective coverage ledger separates draft audit artifacts from tracked source coverage', () => {
  const doc = ledger();

  assert.match(doc, /Worktree draft artifact boundary addendum/);
  assert.match(doc, /149-file `git ls-files` source universe/);
  assert.match(doc, /untracked local audit docs\/tests/);
  assert.match(doc, /git status --porcelain --untracked-files=all/);
  assert.match(doc, /not product source or release authority until staged, reviewed, and reclassified/);
});

test('objective coverage ledger separates lexical callable counts from semantic method proof', () => {
  const doc = ledger();

  assert.match(doc, /Semantic method boundary addendum/);
  assert.match(doc, /lexical callable accounting from semantic method proof/);
  assert.match(doc, /owner, trigger, caller class/);
  assert.match(doc, /settings\/profile\/list-mode inputs/);
  assert.match(doc, /route\/surface scope/);
  assert.match(doc, /side effects, active\/no-rule\/disabled behavior/);
  assert.match(doc, /teardown\/idempotence/);
  assert.match(doc, /positive\/negative fixtures/);
});

test('objective coverage ledger records method semantic audit register as the next method gate', () => {
  const doc = ledger();

  assert.match(doc, /Method semantic audit register addendum/);
  assert.match(doc, /high-risk method families/);
  assert.match(doc, /representative source tokens/);
  assert.match(doc, /owner\/caller classes/);
  assert.match(doc, /trigger paths/);
  assert.match(doc, /settings\/profile\/list-mode inputs/);
  assert.match(doc, /route\/surface scopes/);
  assert.match(doc, /side effects/);
  assert.match(doc, /disabled\/no-rule budgets/);
  assert.match(doc, /teardown\/idempotence requirements/);
  assert.match(doc, /future fixture gates/);
  assert.match(doc, /`methodSemanticAuthority`, `callableEffectReport`, `callableNoWorkBudget`, and `callableTeardownRegistry`/);
  assert.match(doc, /do not exist in runtime source yet/);
});

test('objective coverage ledger records background message actions as source-derived semantic method rows', () => {
  const doc = ledger();

  assert.match(doc, /Background message action semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BACKGROUND_MESSAGE_ACTION_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/background-message-action-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /two `js\/background\.js` runtime message listeners/);
  assert.match(doc, /all 31 current action\/type branches as source-derived semantic rows/);
  assert.match(doc, /prompt\/release, compiled-settings\/cache, security session, rule mutation/);
  assert.match(doc, /identity network resolver, script injection, learned-identity write, stats mutation/);
  assert.match(doc, /`backgroundMessageActionAuthority`, `backgroundActionSemanticReport`, `messageActionEffectDecision`, or `messageActionSenderContract`/);
});

test('objective coverage ledger records content bridge top-level methods as source-derived semantic method rows', () => {
  const doc = ledger();

  assert.match(doc, /Content bridge top-level method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_TOP_LEVEL_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-top-level-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /largest callable file, `js\/content_bridge\.js`/);
  assert.match(doc, /1,189 lexical callable forms/);
  assert.match(doc, /187 top-level function declarations/);
  assert.match(doc, /186 unique top-level function names/);
  assert.match(doc, /duplicate `injectCollaboratorPlaceholderMenu` declarations at lines 599 and 7788/);
  assert.match(doc, /14 semantic groups/);
  assert.match(doc, /main-world messages, DOM fallback startup, fallback popovers/);
  assert.match(doc, /clicked hide\/rule mutation/);
  assert.match(doc, /`contentBridgeMethodAuthority`, `contentBridgeMethodEffectReport`, `contentBridgeCallerContract`, `contentBridgeLifecycleBudget`, or `contentBridgeIdentityConfidenceReport`/);
});

test('objective coverage ledger records content bridge lifecycle callbacks as source-derived semantic rows', () => {
  const doc = ledger();

  assert.match(doc, /Content bridge lifecycle callback semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_LIFECYCLE_CALLBACK_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-lifecycle-callback-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, lifecycle, DOM selector, settings-mode, learned-identity/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/content_bridge\.js` hot-file lifecycle row from 87 source-counted listener\/timer\/observer\/frame instances/);
  assert.match(doc, /13 source-derived callback\/effect groups/);
  assert.match(doc, /prefetch observer and route hooks/);
  assert.match(doc, /DOM fallback startup and pending whitelist timers/);
  assert.match(doc, /menu item action handlers, block-click hide\/mutation followups, and global bootstrap/);
  assert.match(doc, /`contentBridgeLifecycleCallbackAuthority`, `contentBridgeLifecycleEffectReport`, `contentBridgeCallbackOwnerContract`, `contentBridgeNoRuleLifecycleBudget`, or `contentBridgeCallbackTeardownRegistry`/);
});

test('objective coverage ledger records content bridge selectors as source-derived semantic rows', () => {
  const doc = ledger();

  assert.match(doc, /Content bridge selector semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_SELECTOR_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-selector-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /DOM selector, method\/callable, lifecycle, settings-mode, learned-identity/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/content_bridge\.js` selector hot-file row from 244 source-counted selector API sites/);
  assert.match(doc, /13 source-derived selector\/effect groups/);
  assert.match(doc, /all 36 dynamic\/non-literal selectors across 11 dynamic selector families/);
  assert.match(doc, /runtime video-id templates, collaboration group templates/);
  assert.match(doc, /collaboration menu key templates, and channelInfo video-id href templates/);
  assert.match(doc, /`contentBridgeSelectorSemanticAuthority`, `contentBridgeSelectorEffectReport`, `contentBridgeSelectorOwnerContract`, `contentBridgeDynamicSelectorEscapePolicy`, `contentBridgeSelectorNoRuleBudget`, or `contentBridgeSelectorRestoreProof`/);
});

test('objective coverage ledger records DOM fallback selectors as source-derived semantic rows', () => {
  const doc = ledger();

  assert.match(doc, /DOM fallback selector semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_DOM_FALLBACK_SELECTOR_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/dom-fallback-selector-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /DOM selector, method\/callable, lifecycle, settings-mode, source\/effect/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/content\/dom_fallback\.js` and `js\/content\/dom_helpers\.js` selector hot-file rows/);
  assert.match(doc, /164 source-counted selector API sites/);
  assert.match(doc, /11 source-derived selector\/effect groups/);
  assert.match(doc, /all 12 dynamic\/non-literal selectors across 12 dynamic selector families/);
  assert.match(doc, /stale hidden selector arguments, video-card pending templates/);
  assert.match(doc, /mobile Shorts navigation arrays, disguised Shorts arrays/);
  assert.match(doc, /iterated Shorts selector candidates, and caller-provided child selectors/);
  assert.match(doc, /selector ownership, no-rule budgets, escape policy, sibling-visible proof, and shared restore authority remain incomplete/);
  assert.match(doc, /`domFallbackSelectorSemanticAuthority`, `domFallbackSelectorEffectReport`, `domFallbackSelectorOwnerContract`, `domFallbackDynamicSelectorEscapePolicy`, `domFallbackSelectorNoRuleBudget`, `domFallbackSelectorRestoreProof`, `domFallbackSiblingVisibleFixtureReport`, or `domHelperSelectorInputContract`/);
});

test('objective coverage ledger separates lifecycle counts from semantic lifecycle proof', () => {
  const doc = ledger();

  assert.match(doc, /Lifecycle instance semantic boundary addendum/);
  assert.match(doc, /lexical lifecycle instance counting from semantic lifecycle proof/);
  assert.match(doc, /observer\/listener\/timer\/frame\/patch/);
  assert.match(doc, /exact owner function\/module/);
  assert.match(doc, /install trigger, caller class/);
  assert.match(doc, /route\/surface scope/);
  assert.match(doc, /feature\/settings\/profile\/list-mode predicate/);
  assert.match(doc, /disabled\/no-rule\/empty-list budget/);
  assert.match(doc, /pause\/resume behavior/);
  assert.match(doc, /teardown\/disconnect\/remove\/clear\/restore proof/);
  assert.match(doc, /scheduled side effects/);
  assert.match(doc, /positive plus negative fixtures/);
});

test('objective coverage ledger separates settings mode rows from semantic settings proof', () => {
  const doc = ledger();

  assert.match(doc, /Settings mode semantic boundary addendum/);
  assert.match(doc, /mode coverage row from semantic settings-mode proof/);
  assert.match(doc, /mode value, profile id\/type/);
  assert.match(doc, /lock\/session state/);
  assert.match(doc, /viewing space, route\/surface/);
  assert.match(doc, /UI row source/);
  assert.match(doc, /canonical visible lists/);
  assert.match(doc, /legacy aliases/);
  assert.match(doc, /storage keys/);
  assert.match(doc, /background compiler fields/);
  assert.match(doc, /compiled payload\/cache revision/);
  assert.match(doc, /content refresh policy/);
  assert.match(doc, /JSON\/DOM active predicates/);
  assert.match(doc, /menu\/quick\/native action gates/);
  assert.match(doc, /mutation actor\/target\/backup side effects/);
  assert.match(doc, /positive plus negative no-rule\/non-matching fixtures/);
});

test('objective coverage ledger records settings mode source effect as mode plus effect proof', () => {
  const doc = ledger();

  assert.match(doc, /Settings mode source\/effect addendum/);
  assert.match(doc, /FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20\.md/);
  assert.match(doc, /settings-mode-source-effect-current-behavior\.test\.mjs/);
  assert.match(doc, /`listMode` is not just a label/);
  assert.match(doc, /selects rule sources and changes effects/);
  assert.match(doc, /Empty blocklist is intended no-rule/);
  assert.match(doc, /empty whitelist is fail-closed/);
  assert.match(doc, /stale `blocked\*` aliases over canonical visible rows/);
  assert.match(doc, /search\/channel JSON no-work fast paths are not shared with whitelist/);
  assert.match(doc, /comments use a separate branch/);
  assert.match(doc, /no `settingsModeSourceEffectAuthority` exists yet/);
});

test('objective coverage ledger records lifecycle effect budget as owner plus effect permission proof', () => {
  const doc = ledger();

  assert.match(doc, /Lifecycle effect budget addendum/);
  assert.match(doc, /FILTERTUBE_LIFECYCLE_EFFECT_BUDGET_CURRENT_BEHAVIOR_2026-05-20\.md/);
  assert.match(doc, /lifecycle-effect-budget-current-behavior\.test\.mjs/);
  assert.match(doc, /lifecycle primitive counts are not effect permission/);
  assert.match(doc, /seed transport/);
  assert.match(doc, /content-bridge prefetch/);
  assert.match(doc, /DOM fallback observer/);
  assert.match(doc, /fallback 3-dot menu/);
  assert.match(doc, /quick block/);
  assert.match(doc, /normal menu\/Kids passive menu/);
  assert.match(doc, /playlist guards/);
  assert.match(doc, /collaborator dialog/);
  assert.match(doc, /local gates/);
  assert.match(doc, /`lifecycleEffectBudget`, `lifecycleOwnerDecision`, `routeSurfaceLifecycleScope`, `fullscreenPauseAuthority`, `nativeOverlayPauseAuthority`, and `noRuleLifecycleCounter`/);
  assert.match(doc, /do not exist in runtime source yet/);
});

test('objective coverage ledger records route surface effect authority as route plus allowed-effect proof', () => {
  const doc = ledger();

  assert.match(doc, /Route\/surface effect authority addendum/);
  assert.match(doc, /FILTERTUBE_ROUTE_SURFACE_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20\.md/);
  assert.match(doc, /route-surface-effect-authority-current-behavior\.test\.mjs/);
  assert.match(doc, /information availability and lifecycle availability still do not decide allowed effects/);
  assert.match(doc, /YouTubei endpoints/);
  assert.match(doc, /Main home\/search/);
  assert.match(doc, /watch\/current video/);
  assert.match(doc, /Shorts/);
  assert.match(doc, /playlist\/Mix/);
  assert.match(doc, /comments\/posts\/community/);
  assert.match(doc, /YouTube Kids/);
  assert.match(doc, /YouTube Music\/mobile `ytm-\*`/);
  assert.match(doc, /native overlays\/fullscreen\/app shells/);
  assert.match(doc, /`parseEndpoint`, `mutateJson`, `harvestOnly`, `scanDom`, `hideDom`, `restoreDom`, `injectQuick`, `injectMenu`, `resolveIdentity`, `fetchIdentity`, `pausePlayer`, `clickNavigation`, and `countStats`/);
  assert.match(doc, /`routeSurfaceEffectAuthority`, `routeSurfaceEffectDecision`, `watchSurfaceEffectBudget`, `menuAffordanceSurfaceAuthority`, `routeInactiveNoWorkCounter`, and `sideEffectRouteBudget`/);
  assert.match(doc, /do not exist in runtime source yet/);
});

test('objective coverage ledger separates renderer headings from semantic JSON path proof', () => {
  const doc = ledger();

  assert.match(doc, /JSON path instance boundary addendum/);
  assert.match(doc, /renderer-heading or representative-rule coverage from semantic JSON path proof/);
  assert.match(doc, /normalized runtime syntax/);
  assert.match(doc, /renderer key, endpoint\/route family/);
  assert.match(doc, /source capture or fixture id/);
  assert.match(doc, /extraction owner/);
  assert.match(doc, /list-mode behavior/);
  assert.match(doc, /identity confidence/);
  assert.match(doc, /mutation effect/);
  assert.match(doc, /negative sibling-visible or false-hide proof/);
});

test('objective coverage ledger keeps ignored raw captures separate from behavior proof', () => {
  const doc = ledger();
  const gitignore = read('.gitignore');

  assert.match(doc, /ignored root-level HTML\/JSON\/TXT files listed in `.gitignore` are raw\s+evidence inputs/i);
  assert.match(doc, /not product source/i);
  assert.match(doc, /not release inputs/i);
  assert.match(doc, /only capture evidence that counts as runnable\s+behavior proof is a small committed fixture/i);
  assert.match(doc, /tests\/runtime\/fixtures\/captures\//);

  for (const rawCapture of [
    'YT_MAIN.json',
    'YT_MAIN_WATCH.html',
    'YT_MAIN_next?prettyPrint.json',
    'YT_KIDS.json',
    'YTM-XHR.json',
    'comments.json',
    'playlist.html',
    'collab.json'
  ]) {
    assert.ok(gitignore.includes(rawCapture), `${rawCapture} should remain ignored raw evidence`);
  }
});

test('objective coverage ledger records DOM fallback lifecycle callbacks as source-derived effect rows', () => {
  const doc = ledger();

  assert.match(doc, /DOM fallback lifecycle callback semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_DOM_FALLBACK_LIFECYCLE_CALLBACK_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/dom-fallback-lifecycle-callback-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /runtime lifecycle, method\/callable, DOM selector, settings-mode, source\/effect/);
  assert.match(doc, /hide\/restore, stats\/media, false-hide\/leak, performance-risk/);
  assert.match(doc, /code-burden, cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/content\/dom_fallback\.js` hot-file lifecycle row/);
  assert.match(doc, /13 source-counted listener\/timer instances/);
  assert.match(doc, /7 source-derived callback\/effect groups/);
  assert.match(doc, /current-watch owner retry\/navigation timers/);
  assert.match(doc, /main pipeline yield timer/);
  assert.match(doc, /page-lifetime scroll state/);
  assert.match(doc, /playlist click\/ended guards/);
  assert.match(doc, /deferred playlist autoplay clicks/);
  assert.match(doc, /pending metadata and selected-row timers/);
  assert.match(doc, /serialized pending reruns/);
  assert.match(doc, /pause media, synthesize playlist navigation, schedule forced reruns/);
  assert.match(doc, /page-lifetime listeners without a shared no-rule or teardown authority/);
  assert.match(doc, /`domFallbackLifecycleCallbackAuthority`, `domFallbackLifecycleEffectReport`, `domFallbackCallbackOwnerContract`, `domFallbackNoRuleLifecycleBudget`, `domFallbackCallbackTeardownRegistry`, `domFallbackPlaylistGuardPolicy`, `domFallbackPendingRunBudget`, or `domFallbackSyntheticNavigationBudget`/);
});

test('objective coverage ledger records background methods as source-derived cross-feature rows', () => {
  const doc = ledger();

  assert.match(doc, /Background method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BACKGROUND_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/background-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, settings-mode, storage\/cache, message\/mutation/);
  assert.match(doc, /learned-identity, network\/fetch, backup\/export, release\/prompt/);
  assert.match(doc, /reliability, false-hide\/leak, performance-risk, code-burden/);
  assert.match(doc, /cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/background\.js` from representative message and mutation tokens/);
  assert.match(doc, /75 top-level function declarations/);
  assert.match(doc, /62 plain function declarations/);
  assert.match(doc, /13 async function declarations/);
  assert.match(doc, /12 semantic method groups/);
  assert.match(doc, /defensive helpers\/messaging/);
  assert.match(doc, /profile backup\/export state/);
  assert.match(doc, /subscription import\/sender normalization/);
  assert.match(doc, /security session\/PIN/);
  assert.match(doc, /backup download\/scheduling/);
  assert.match(doc, /migration\/versioning/);
  assert.match(doc, /post-block enrichment and channel-derived keywords/);
  assert.match(doc, /profile compile\/storage/);
  assert.match(doc, /learned identity map caches/);
  assert.match(doc, /release notes\/runtime info/);
  assert.match(doc, /identity resolver network work/);
  assert.match(doc, /rule mutation\/channel persistence/);
  assert.match(doc, /return cached compiled settings before storage hydration/);
  assert.match(doc, /batch learned map writes through timers/);
  assert.match(doc, /schedule backups from caller-provided trigger\/options\/delay/);
  assert.match(doc, /perform credentialed YouTube\/YouTube Kids resolver fetches/);
  assert.match(doc, /invalidate compiled caches, refresh tabs, and write profile rule state/);
  assert.match(doc, /without one shared method authority/);
  assert.match(doc, /`backgroundMethodAuthority`, `backgroundMethodEffectReport`, `backgroundMethodNoWorkBudget`, `backgroundStorageRevisionReport`, `backgroundNetworkResolverBudget`, `backgroundRuleMutationContract`, or `backgroundBackupScheduleAuthority`/);
});

test('objective coverage ledger records state manager methods as source-derived cross-feature rows', () => {
  const doc = ledger();

  assert.match(doc, /State manager method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_STATE_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/state-manager-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, settings-mode, storage\/cache, message\/mutation/);
  assert.match(doc, /profile persistence, import, lifecycle, listener, backup/);
  assert.match(doc, /reliability, false-hide\/leak, performance-risk, code-burden/);
  assert.match(doc, /cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/state_manager\.js` from representative UI\/settings tokens/);
  assert.match(doc, /55 IIFE-scoped function declarations/);
  assert.match(doc, /21 plain function declarations/);
  assert.match(doc, /34 async function declarations/);
  assert.match(doc, /30 public API entries/);
  assert.match(doc, /9 semantic method groups/);
  assert.match(doc, /lock\/backup\/access helpers/);
  assert.match(doc, /settings save\/profile\/broadcast work/);
  assert.match(doc, /channel enrichment queue work/);
  assert.match(doc, /Kids keyword\/channel mutations/);
  assert.match(doc, /Main keyword mutations/);
  assert.match(doc, /Main channel\/import\/map mutations/);
  assert.match(doc, /toggle\/content\/category mutations/);
  assert.match(doc, /theme\/listener APIs/);
  assert.match(doc, /storage-sync reload handling/);
  assert.match(doc, /`saveSettings\(\)` can drop concurrent saves by returning while `isSaving`/);
  assert.match(doc, /profile persistence catches V3\/V4 write failures locally/);
  assert.match(doc, /channel enrichment sends background channel-add messages with a session cap and randomized delay/);
  assert.match(doc, /subscription import uses tab retries and target-profile rechecks/);
  assert.match(doc, /storage reload is debounced and skipped while saving/);
  assert.match(doc, /`stateManagerMethodAuthority`, `stateManagerMutationEffectReport`, `stateManagerSaveQueueContract`, `stateManagerProfileRevisionReport`, `stateManagerRefreshBroadcastAuthority`, `stateManagerStorageReloadBudget`, `stateManagerListenerEventContract`, or `stateManagerChannelEnrichmentBudget`/);
  assert.match(doc, /including `StateManager`, `RenderEngine`, `tab-view`, `settings_shared`, `io_manager`, `popup`, and `UIComponents` method slices/);
});

test('objective coverage ledger records render engine methods as source-derived UI rows', () => {
  const doc = ledger();

  assert.match(doc, /Render engine method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_RENDER_ENGINE_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/render-engine-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, settings-mode, UI row-action, DOM write/);
  assert.match(doc, /lifecycle\/timer, accessibility, false-hide\/leak, performance-risk/);
  assert.match(doc, /code-burden, cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/render_engine\.js` from representative UI\/render tokens/);
  assert.match(doc, /35 IIFE-scoped declarations/);
  assert.match(doc, /30 plain function declarations/);
  assert.match(doc, /5 const arrow helper declarations/);
  assert.match(doc, /0 async function declarations/);
  assert.match(doc, /4 public API entries/);
  assert.match(doc, /6 semantic method groups/);
  assert.match(doc, /dependency\/scheduling helpers/);
  assert.match(doc, /badge\/source decoration/);
  assert.match(doc, /channel display identity helpers/);
  assert.match(doc, /keyword rendering and row actions/);
  assert.match(doc, /channel rendering and row actions/);
  assert.match(doc, /collaboration grouping/);
  assert.match(doc, /`renderKeywordList\(\)` and `renderChannelList\(\)` choose visible rows/);
  assert.match(doc, /profile\/list-mode state and optional overrides/);
  assert.match(doc, /sync Kids rows into Main when modes match/);
  assert.match(doc, /clear containers through `innerHTML`/);
  assert.match(doc, /bind row actions directly to `StateManager` when callbacks are absent/);
  assert.match(doc, /hidden spacers for whitelist Filter All rows/);
  assert.match(doc, /batch channel DOM appends through idle callbacks and generation guards/);
  assert.match(doc, /`renderEngineMethodAuthority`, `renderEngineRowActionContract`, `renderEngineDomEffectReport`, `renderEngineIdleRenderBudget`, `renderEngineVisibleRowParityReport`, `renderEngineAccessibilityContract`, or `renderEngineIdentityDisplayPolicy`/);
  assert.match(doc, /including `StateManager`, `RenderEngine`, `tab-view`, `settings_shared`, `io_manager`, `popup`, and `UIComponents` method slices/);
});

test('objective coverage ledger records tab-view methods as source-derived dashboard rows', () => {
  const doc = ledger();

  assert.match(doc, /Tab-view method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_TAB_VIEW_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/tab-view-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, settings-mode, dashboard UI, profile\/lock/);
  assert.match(doc, /import\/export, Nanah sync, list-mode, DOM selector/);
  assert.match(doc, /lifecycle\/timer, accessibility, false-hide\/leak, performance-risk/);
  assert.match(doc, /code-burden, cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/tab-view\.js` from representative dashboard tokens/);
  assert.match(doc, /311 named declarations/);
  assert.match(doc, /210 plain function declarations/);
  assert.match(doc, /70 async function declarations/);
  assert.match(doc, /29 const arrow helper declarations/);
  assert.match(doc, /2 async const arrow helper declarations/);
  assert.match(doc, /22 semantic method groups/);
  assert.match(doc, /responsive navigation/);
  assert.match(doc, /Main\/Kids filter and content controls/);
  assert.match(doc, /runtime\/browser-tab messaging/);
  assert.match(doc, /subscription import/);
  assert.match(doc, /managed child editing/);
  assert.match(doc, /lock\/navigation gates/);
  assert.match(doc, /Nanah mode\/scope\/target\/session\/apply flows/);
  assert.match(doc, /PIN\/profile management/);
  assert.match(doc, /import\/export downloads/);
  assert.match(doc, /managed row and list-mode rendering/);
  assert.match(doc, /dashboard stats/);
  assert.match(doc, /147 listener sites/);
  assert.match(doc, /14 `setTimeout` calls/);
  assert.match(doc, /1 `setInterval` call/);
  assert.match(doc, /11 `requestAnimationFrame` calls/);
  assert.match(doc, /333 `document.createElement` calls/);
  assert.match(doc, /39 `innerHTML` writes/);
  assert.match(doc, /61 `setAttribute` calls/);
  assert.match(doc, /42 direct `StateManager` calls/);
  assert.match(doc, /14 unique `StateManager` methods/);
  assert.match(doc, /4 `RenderEngine` calls/);
  assert.match(doc, /8 `sendRuntimeMessage` calls/);
  assert.match(doc, /`tabViewMethodAuthority`, `tabViewListenerLifecycleContract`, `tabViewListModeMutationReport`, `tabViewManagedChildEditContract`, `tabViewNanahSyncPolicyReport`, `tabViewImportExportMutationPlan`, `tabViewProfileLockAccessReport`, `tabViewDashboardRenderBudget`, or `tabViewNavigationStateContract`/);
  assert.match(doc, /including `StateManager`, `RenderEngine`, `tab-view`, `settings_shared`, `io_manager`, `popup`, and `UIComponents` method slices/);
});

test('objective coverage ledger records settings shared methods as source-derived settings rows', () => {
  const doc = ledger();

  assert.match(doc, /Settings shared method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SETTINGS_SHARED_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/settings-shared-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, settings-mode, storage\/cache, compiler, migration, profile, theme/);
  assert.match(doc, /reliability, false-hide\/leak, performance-risk, code-burden/);
  assert.match(doc, /cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/settings_shared\.js` from representative shared settings tokens/);
  assert.match(doc, /29 named declarations/);
  assert.match(doc, /27 IIFE-scoped function declarations/);
  assert.match(doc, /2 local const arrow helper declarations/);
  assert.match(doc, /0 async function declarations/);
  assert.match(doc, /21 public `FilterTubeSettings` entries/);
  assert.match(doc, /9 semantic method groups/);
  assert.match(doc, /defensive object helpers/);
  assert.match(doc, /keyword normalization and compilation/);
  assert.match(doc, /channel normalization/);
  assert.match(doc, /profile migration helpers/);
  assert.match(doc, /compiled settings building/);
  assert.match(doc, /settings load\/read-path migration/);
  assert.match(doc, /settings save\/storage persistence/);
  assert.match(doc, /theme preference\/change helpers/);
  assert.match(doc, /storage change detection/);
  assert.match(doc, /`SETTINGS_KEYS` currently has 36 entries/);
  assert.match(doc, /`SETTINGS_CHANGE_KEYS` has 38 effective entries/);
  assert.match(doc, /3 `STORAGE_NAMESPACE.get` calls/);
  assert.match(doc, /5 `STORAGE_NAMESPACE.set` calls/);
  assert.match(doc, /`loadSettings\(\)` can write V4 profiles while reading/);
  assert.match(doc, /`buildProfilesV4FromLegacyState\(\)` defaults Main and Kids modes to `blocklist`/);
  assert.match(doc, /empty whitelist rows/);
  assert.match(doc, /`saveSettings\(\)` writes legacy compiled fields and V4 active profile state/);
  assert.match(doc, /`settingsSharedMethodAuthority`, `settingsSharedStorageDependencyManifest`, `settingsSharedProfileMigrationReport`, `settingsSharedReadPathWriteBudget`, `settingsSharedSaveResultContract`, `settingsSharedCompiledSettingsReport`, `settingsSharedThemePreferenceContract`, or `settingsSharedChangeDetectionContract`/);
  assert.match(doc, /including `StateManager`, `RenderEngine`, `tab-view`, `settings_shared`, `io_manager`, `popup`, and `UIComponents` method slices/);
});

test('objective coverage ledger records io manager methods as source-derived import export rows', () => {
  const doc = ledger();

  assert.match(doc, /IO manager method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_IO_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/io-manager-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, settings-mode, storage\/cache, import\/export/);
  assert.match(doc, /backup\/download, encryption, Nanah restore, profile migration/);
  assert.match(doc, /reliability, false-hide\/leak, performance-risk, code-burden/);
  assert.match(doc, /cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/io_manager\.js` from representative import\/export and backup tokens/);
  assert.match(doc, /52 named declarations/);
  assert.match(doc, /46 IIFE-scoped function declarations/);
  assert.match(doc, /30 plain function declarations/);
  assert.match(doc, /16 async function declarations/);
  assert.match(doc, /6 local const arrow helper declarations/);
  assert.match(doc, /11 public `FilterTubeIO` entries/);
  assert.match(doc, /12 semantic method groups/);
  assert.match(doc, /primitive defensive helpers/);
  assert.match(doc, /download runtime helpers/);
  assert.match(doc, /keyword\/channel normalization/);
  assert.match(doc, /profile scope and security/);
  assert.match(doc, /legacy profile derivation and V3 persistence/);
  assert.match(doc, /storage access wrappers/);
  assert.match(doc, /profiles V4 migration and sanitization/);
  assert.match(doc, /import format parsing/);
  assert.match(doc, /export serialization/);
  assert.match(doc, /import merge and persistence/);
  assert.match(doc, /encrypted\/Nanah state/);
  assert.match(doc, /auto-backup download\/rotation/);
  assert.match(doc, /4 storage key constants/);
  assert.match(doc, /5 `readStorage` occurrences/);
  assert.match(doc, /8 `writeStorage` occurrences/);
  assert.match(doc, /1 `STORAGE_NAMESPACE.get` call/);
  assert.match(doc, /1 `STORAGE_NAMESPACE.set` call/);
  assert.match(doc, /2 `runtimeAPI.downloads.download` calls/);
  assert.match(doc, /2 `setTimeout` calls/);
  assert.match(doc, /1 `clearTimeout` call/);
  assert.match(doc, /0 listener\/interval\/selector calls/);
  assert.match(doc, /V3\/V4 profile reads and writes/);
  assert.match(doc, /`SettingsAPI.saveSettings\(\)` import persistence/);
  assert.match(doc, /optional Nanah trusted-state writes/);
  assert.match(doc, /encrypted backup delegation to `FilterTubeSecurity`/);
  assert.match(doc, /runtime downloads blob writes/);
  assert.match(doc, /backup rotation via downloads records/);
  assert.match(doc, /`ioManagerMethodAuthority`, `ioManagerProfileMigrationReport`, `ioManagerImportMutationPlan`, `ioManagerExportScopeContract`, `ioManagerPinAuthContract`, `ioManagerEncryptedBackupContract`, `ioManagerNanahRestorePolicy`, `ioManagerDownloadLifecycleBudget`, `ioManagerAutoBackupScheduleAuthority`, `ioManagerBackupRotationReport`, `ioManagerStorageWriteEffectReport`, or `ioManagerFixtureProvenance`/);
  assert.match(doc, /including `StateManager`, `RenderEngine`, `tab-view`, `settings_shared`, `io_manager`, `popup`, and `UIComponents` method slices/);
});

test('objective coverage ledger records popup methods as source-derived popup UI rows', () => {
  const doc = ledger();

  assert.match(doc, /Popup method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_POPUP_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/popup-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, settings-mode, popup UI, DOM selector/);
  assert.match(doc, /lifecycle\/timer, profile\/lock, list-mode, runtime message/);
  assert.match(doc, /content-control, video-filter, accessibility, reliability/);
  assert.match(doc, /false-hide\/leak, performance-risk, code-burden/);
  assert.match(doc, /cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/popup\.js` from representative popup UI tokens/);
  assert.match(doc, /53 named declarations/);
  assert.match(doc, /36 plain function declarations/);
  assert.match(doc, /11 async function declarations/);
  assert.match(doc, /3 const arrow helper declarations/);
  assert.match(doc, /3 async const arrow helper declarations/);
  assert.match(doc, /0 public exported API entries/);
  assert.match(doc, /11 semantic method groups/);
  assert.match(doc, /popup bootstrap\/content DOM/);
  assert.match(doc, /video filter controls/);
  assert.match(doc, /content-control visibility/);
  assert.match(doc, /runtime messaging\/session unlock/);
  assert.match(doc, /list mode controls/);
  assert.match(doc, /defensive helpers/);
  assert.match(doc, /profile metadata helpers/);
  assert.match(doc, /dropdown\/modal\/PIN unlock/);
  assert.match(doc, /lock gate\/profile switch/);
  assert.match(doc, /rendering\/search sync/);
  assert.match(doc, /enabled toggle/);
  assert.match(doc, /52 `document.getElementById` calls/);
  assert.match(doc, /23 unique getElementById ids/);
  assert.match(doc, /82 `document.createElement` calls/);
  assert.match(doc, /30 `addEventListener` calls/);
  assert.match(doc, /3 `document.addEventListener` calls/);
  assert.match(doc, /2 `setTimeout` calls/);
  assert.match(doc, /1 `requestAnimationFrame` call/);
  assert.match(doc, /5 `innerHTML` writes/);
  assert.match(doc, /34 `setAttribute` calls/);
  assert.match(doc, /19 `StateManager` references/);
  assert.match(doc, /2 `RenderEngine` references/);
  assert.match(doc, /13 `UIComponents` references/);
  assert.match(doc, /4 `sendRuntimeMessage` occurrences/);
  assert.match(doc, /3 tab query calls/);
  assert.match(doc, /2 tab create calls/);
  assert.match(doc, /5 window open calls/);
  assert.match(doc, /profile switch V4 save paths/);
  assert.match(doc, /PIN verification through `FilterTubeSecurity`/);
  assert.match(doc, /`popupMethodAuthority`, `popupDomEffectReport`, `popupListenerLifecycleContract`, `popupListModeMutationReport`, `popupProfileLockAccessReport`, `popupProfileSwitchMutationPlan`, `popupContentControlVisibilityReport`, `popupVideoFilterRoutePolicy`, `popupRuntimeMessageContract`, `popupRenderStateDependencyReport`, `popupAccessibilityContract`, or `popupFixtureProvenance`/);
  assert.match(doc, /including `StateManager`, `RenderEngine`, `tab-view`, `settings_shared`, `io_manager`, `popup`, and `UIComponents` method slices/);
});

test('objective coverage ledger records UI components methods as source-derived shared UI rows', () => {
  const doc = ledger();

  assert.match(doc, /UI components method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_UI_COMPONENTS_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/ui-components-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, settings-mode, shared UI, DOM selector/);
  assert.match(doc, /lifecycle\/timer, observer, accessibility, toast, dropdown/);
  assert.match(doc, /reliability, false-hide\/leak, performance-risk, code-burden/);
  assert.match(doc, /cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/ui_components\.js` from representative shared UI tokens/);
  assert.match(doc, /33 named declarations/);
  assert.match(doc, /22 plain function declarations/);
  assert.match(doc, /11 const arrow helper declarations/);
  assert.match(doc, /0 async function declarations/);
  assert.match(doc, /19 public `UIComponents` entries/);
  assert.match(doc, /7 semantic method groups/);
  assert.match(doc, /module theme\/profile helpers/);
  assert.match(doc, /button\/icon factories/);
  assert.match(doc, /input\/select factories/);
  assert.match(doc, /tab factories/);
  assert.match(doc, /list\/card factories/);
  assert.match(doc, /enhanced select dropdown helpers/);
  assert.match(doc, /toast lifecycle/);
  assert.match(doc, /36 `document.createElement` calls/);
  assert.match(doc, /1 `document.querySelectorAll` call/);
  assert.match(doc, /17 `addEventListener` calls/);
  assert.match(doc, /1 `document.addEventListener` call/);
  assert.match(doc, /2 `window.addEventListener` calls/);
  assert.match(doc, /3 `setTimeout` calls/);
  assert.match(doc, /4 `requestAnimationFrame` calls/);
  assert.match(doc, /1 `cancelAnimationFrame` call/);
  assert.match(doc, /1 `MutationObserver` constructor/);
  assert.match(doc, /1 observe call/);
  assert.match(doc, /0 disconnect calls/);
  assert.match(doc, /5 `innerHTML` writes/);
  assert.match(doc, /16 `textContent` writes/);
  assert.match(doc, /21 `setAttribute` calls/);
  assert.match(doc, /6 `style.setProperty` calls/);
  assert.match(doc, /2 `document.body.appendChild` calls/);
  assert.match(doc, /2 `dispatchEvent` calls/);
  assert.match(doc, /`window.UIComponents` browser export/);
  assert.match(doc, /`module.exports` CommonJS export/);
  assert.match(doc, /raw tab label\/content HTML writes/);
  assert.match(doc, /enhanced select body portals/);
  assert.match(doc, /dropdown disabled-state observation/);
  assert.match(doc, /toast replacement\/removal/);
  assert.match(doc, /`uiComponentsMethodAuthority`, `uiComponentsDomEffectReport`, `uiComponentsListenerLifecycleContract`, `uiComponentsDropdownTeardownRegistry`, `uiComponentsToastLifecycleBudget`, `uiComponentsAccessibilityContract`, `uiComponentsSelectorScopeReport`, `uiComponentsPublicApiManifest`, `uiComponentsRawHtmlPolicy`, `uiComponentsProfileColorContract`, or `uiComponentsFixtureProvenance`/);
  assert.match(doc, /including `StateManager`, `RenderEngine`, `tab-view`, `settings_shared`, `io_manager`, `popup`, and `UIComponents` method slices/);
});

test('objective coverage ledger records security manager methods as source-derived security rows', () => {
  const doc = ledger();

  assert.match(doc, /Security manager method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SECURITY_MANAGER_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/security-manager-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, profile\/lock, import\/export, encrypted backup/);
  assert.match(doc, /Nanah restore, reliability, performance-risk, code-burden/);
  assert.match(doc, /cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/security_manager\.js` from representative `FilterTubeSecurity` tokens/);
  assert.match(doc, /12 named declarations/);
  assert.match(doc, /6 plain function declarations/);
  assert.match(doc, /6 async function declarations/);
  assert.match(doc, /0 const arrow helper declarations/);
  assert.match(doc, /4 public `FilterTubeSecurity` entries/);
  assert.match(doc, /5 semantic method groups/);
  assert.match(doc, /crypto defensive helpers/);
  assert.match(doc, /byte encoding helpers/);
  assert.match(doc, /PBKDF2 derivation/);
  assert.match(doc, /PIN verifier lifecycle/);
  assert.match(doc, /encrypted JSON lifecycle/);
  assert.match(doc, /3 `TextEncoder` constructions/);
  assert.match(doc, /1 `TextDecoder` construction/);
  assert.match(doc, /1 `btoa` call/);
  assert.match(doc, /1 `atob` call/);
  assert.match(doc, /1 `cryptoApi.getRandomValues` call/);
  assert.match(doc, /2 `subtle.importKey` calls/);
  assert.match(doc, /1 `subtle.deriveBits` call/);
  assert.match(doc, /1 `subtle.deriveKey` call/);
  assert.match(doc, /1 `subtle.encrypt` call/);
  assert.match(doc, /1 `subtle.decrypt` call/);
  assert.match(doc, /1 `JSON.stringify` call/);
  assert.match(doc, /1 `JSON.parse` call/);
  assert.match(doc, /7 `throw new Error` statements/);
  assert.match(doc, /0 `setTimeout` calls/);
  assert.match(doc, /0 `addEventListener` calls/);
  assert.match(doc, /0 `document` references/);
  assert.match(doc, /0 `window` references/);
  assert.match(doc, /default PBKDF2\/SHA-256 150000-iteration verifier creation/);
  assert.match(doc, /AES-GCM encrypted JSON payloads/);
  assert.match(doc, /direct base64 verifier comparison/);
  assert.match(doc, /unsupported KDF\/cipher rejection/);
  assert.match(doc, /invalid encrypted payload rejection/);
  assert.match(doc, /`global.FilterTubeSecurity` export/);
  assert.match(doc, /`securityManagerMethodAuthority`, `securityManagerCryptoAvailabilityContract`, `securityManagerPinVerifierContract`, `securityManagerEncryptedJsonContract`, `securityManagerKdfCompatibilityReport`, `securityManagerTimingComparisonPolicy`, `securityManagerPayloadValidationReport`, `securityManagerCallerMutationGate`, or `securityManagerFixtureProvenance`/);
  assert.match(doc, /plus `security_manager` PIN\/encrypted JSON method coverage/);
});

test('objective coverage ledger records content controls catalog methods as source-derived catalog rows', () => {
  const doc = ledger();

  assert.match(doc, /Content controls catalog method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_CONTROLS_CATALOG_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/content-controls-catalog-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, settings-mode, UI catalog, content-control/);
  assert.match(doc, /route\/surface, reliability, false-hide\/leak, performance-risk/);
  assert.match(doc, /code-burden, cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/content_controls_catalog\.js` from representative `FilterTubeContentControlsCatalog` tokens/);
  assert.match(doc, /3 named declarations/);
  assert.match(doc, /3 plain function declarations/);
  assert.match(doc, /0 async function declarations/);
  assert.match(doc, /0 const arrow helper declarations/);
  assert.match(doc, /3 public `FilterTubeContentControlsCatalog` entries/);
  assert.match(doc, /2 semantic method groups/);
  assert.match(doc, /7 catalog groups/);
  assert.match(doc, /29 catalog controls/);
  assert.match(doc, /core, feed, watch, video_info, player, navigation, and search groups/);
  assert.match(doc, /7 `accentColor` entries/);
  assert.match(doc, /1 empty description entry/);
  assert.match(doc, /1 escaped-newline description entry/);
  assert.match(doc, /2 `map` calls/);
  assert.match(doc, /1 `flatMap` call/);
  assert.match(doc, /1 `find` call/);
  assert.match(doc, /1 `Array.isArray` call/);
  assert.match(doc, /0 `document` references/);
  assert.match(doc, /0 `window` references/);
  assert.match(doc, /0 `addEventListener` calls/);
  assert.match(doc, /0 `setTimeout` calls/);
  assert.match(doc, /0 `MutationObserver` references/);
  assert.match(doc, /`global.FilterTubeContentControlsCatalog` export/);
  assert.match(doc, /`getCatalog\(\)` group-object and controls-array shallow copies/);
  assert.match(doc, /nested control objects shared/);
  assert.match(doc, /`getAllControls\(\)` individual control-object copies/);
  assert.match(doc, /`getControlByKey\(\)` falsy-key null return and strict key equality lookup/);
  assert.match(doc, /`contentControlsCatalogMethodAuthority`, `contentControlsCatalogRuntimeSemanticsManifest`, `contentControlsCatalogKeyParityReport`, `contentControlsCatalogRouteScopeReport`, `contentControlsCatalogControlEffectBudget`, `contentControlsCatalogAccessorCopyContract`, `contentControlsCatalogUiRuntimeAlignmentReport`, or `contentControlsCatalogFixtureProvenance`/);
  assert.match(doc, /`content_controls_catalog` catalog accessor coverage and `nanah_sync_adapter` sync envelope\/profile apply coverage/);
});

test('objective coverage ledger records Nanah sync adapter methods as source-derived sync rows', () => {
  const doc = ledger();

  assert.match(doc, /Nanah sync adapter method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_NANAH_SYNC_ADAPTER_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/nanah-sync-adapter-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, settings-mode, import\/export, Nanah sync/);
  assert.match(doc, /profile mutation, sync envelope, preview\/apply/);
  assert.match(doc, /reliability, false-hide\/leak, performance-risk/);
  assert.match(doc, /code-burden, cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/nanah_sync_adapter\.js` from representative `FilterTubeNanahAdapter` tokens/);
  assert.match(doc, /23 named declarations/);
  assert.match(doc, /16 plain function declarations/);
  assert.match(doc, /7 async function declarations/);
  assert.match(doc, /0 const arrow helper declarations/);
  assert.match(doc, /10 public `FilterTubeNanahAdapter` entries/);
  assert.match(doc, /5 semantic method groups/);
  assert.match(doc, /defensive normalization\/merge helpers/);
  assert.match(doc, /scoped profile transfer/);
  assert.match(doc, /runtime\/device descriptor helpers/);
  assert.match(doc, /envelope build\/summary/);
  assert.match(doc, /incoming envelope apply/);
  assert.match(doc, /3 `JSON.stringify` calls/);
  assert.match(doc, /3 `JSON.parse` calls/);
  assert.match(doc, /8 `throw new Error` statements/);
  assert.match(doc, /2 `new Map` calls/);
  assert.match(doc, /2 `await io.loadProfilesV4` calls/);
  assert.match(doc, /1 `await io.saveProfilesV4` call/);
  assert.match(doc, /1 `await io.exportV3` call/);
  assert.match(doc, /1 `return io.importV3` call/);
  assert.match(doc, /0 `document` references/);
  assert.match(doc, /0 `window` references/);
  assert.match(doc, /0 `addEventListener` calls/);
  assert.match(doc, /0 `setTimeout` calls/);
  assert.match(doc, /0 `MutationObserver` references/);
  assert.match(doc, /`global.FilterTubeNanahAdapter` export/);
  assert.match(doc, /preview strategy writes no storage/);
  assert.match(doc, /Main\/Kids route to scoped V4 apply/);
  assert.match(doc, /active\/full route to `io.importV3\(\)`/);
  assert.match(doc, /`nanahAdapterMethodAuthority`, `nanahAdapterEnvelopeContract`, `nanahAdapterScopedMutationReport`, `nanahAdapterPreviewApplyEquivalenceReport`, `nanahAdapterTargetProfileAuthority`, `nanahAdapterTrustedSenderContract`, `nanahAdapterProfileLockGate`, `nanahAdapterRuntimeRefreshContract`, `nanahAdapterSanitizerParityReport`, or `nanahAdapterFixtureProvenance`/);
  assert.match(doc, /and `nanah_sync_adapter` sync envelope\/profile apply coverage/);
});

test('objective coverage ledger records block channel methods as source-derived quick-block rows', () => {
  const doc = ledger();

  assert.match(doc, /Block channel method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BLOCK_CHANNEL_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/block-channel-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, settings-mode, quick-block, native dropdown/);
  assert.match(doc, /Kids native block, DOM selector, lifecycle\/listener\/observer\/timer/);
  assert.match(doc, /mutation, optimistic hide, reliability, false-hide\/leak/);
  assert.match(doc, /performance-risk, code-burden, cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/content\/block_channel\.js` from representative quick-block\/dropdown\/Kids tokens/);
  assert.match(doc, /61 named method\/helper\/callback declarations/);
  assert.match(doc, /40 function declarations in scope/);
  assert.match(doc, /35 plain function declarations/);
  assert.match(doc, /5 async function declarations/);
  assert.match(doc, /21 const helper\/callback declarations/);
  assert.match(doc, /19 const arrow helper\/callback declarations/);
  assert.match(doc, /2 local const IIFE result declarations/);
  assert.match(doc, /9 semantic method groups/);
  assert.match(doc, /module state\/mode gates/);
  assert.match(doc, /surface overlay\/visibility helpers/);
  assert.match(doc, /card target\/anchor resolution/);
  assert.match(doc, /viewport hover\/occlusion work/);
  assert.match(doc, /quick-block identity\/action builders/);
  assert.match(doc, /mutation and optimistic hide paths/);
  assert.match(doc, /quick-block DOM lifecycle/);
  assert.match(doc, /dropdown injection lifecycle/);
  assert.match(doc, /Kids native block sync/);
  assert.match(doc, /34 `addEventListener` calls/);
  assert.match(doc, /6 `MutationObserver` references/);
  assert.match(doc, /6 `observe` calls/);
  assert.match(doc, /2 `disconnect` calls/);
  assert.match(doc, /11 `setTimeout` calls/);
  assert.match(doc, /1 `setInterval` call/);
  assert.match(doc, /3 `requestAnimationFrame` calls/);
  assert.match(doc, /5 `document.createElement` occurrences/);
  assert.match(doc, /17 `setAttribute` calls/);
  assert.match(doc, /11 `style.display` references/);
  assert.match(doc, /2 `chrome.runtime\?\.sendMessage` calls/);
  assert.match(doc, /2 `addChannelDirectly` references/);
  assert.match(doc, /2 `applyDOMFallback` references/);
  assert.match(doc, /starts menu and quick-block observers after 1000ms/);
  assert.match(doc, /quick-block gate requiring `showQuickBlockButton === true` and non-whitelist mode/);
  assert.match(doc, /optimistic hide that writes `style.display = 'none'`/);
  assert.match(doc, /Kids native block sync through `FilterTube_KidsBlockChannel`/);
  assert.match(doc, /no `removeEventListener` path/);
  assert.match(doc, /no `clearInterval` path/);
  assert.match(doc, /`blockChannelMethodAuthority`, `blockChannelQuickBlockLifecycleContract`, `blockChannelQuickBlockActionReport`, `blockChannelAffordanceNoWorkBudget`, `blockChannelSelectorTargetReport`, `blockChannelOptimisticHideReport`, `blockChannelDropdownObserverRegistry`, `blockChannelKidsNativeSyncContract`, `blockChannelMutationSenderContract`, or `blockChannelFixtureProvenance`/);
  assert.match(doc, /and `block_channel` quick-block\/dropdown\/Kids lifecycle coverage/);
});

test('objective coverage ledger records collaborator dialog methods as source-derived lifecycle mutation rows', () => {
  const doc = ledger();

  assert.match(doc, /Collaborator dialog method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_COLLAB_DIALOG_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/collab-dialog-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, collaborator lifecycle, learned identity/);
  assert.match(doc, /page-message trust, DOM selector, mutation, reliability/);
  assert.match(doc, /false-hide\/leak, performance-risk, code-burden/);
  assert.match(doc, /cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/content\/collab_dialog\.js` from lifecycle-only collaborator dialog tokens/);
  assert.match(doc, /13 named function declarations/);
  assert.match(doc, /13 plain function declarations/);
  assert.match(doc, /0 async function declarations/);
  assert.match(doc, /0 const helper\/callback declarations/);
  assert.match(doc, /9 arrow callback sites in scope/);
  assert.match(doc, /6 semantic method groups/);
  assert.match(doc, /refresh and boot lifecycle/);
  assert.match(doc, /trigger capture and queueing/);
  assert.match(doc, /entry resolution/);
  assert.match(doc, /card mutation and propagation/);
  assert.match(doc, /broadcast and extraction/);
  assert.match(doc, /dialog acceptance\/observer dispatch/);
  assert.match(doc, /3 `addEventListener` calls/);
  assert.match(doc, /1 `MutationObserver` reference/);
  assert.match(doc, /1 `observe` call/);
  assert.match(doc, /0 `disconnect` calls/);
  assert.match(doc, /2 `setTimeout` calls/);
  assert.match(doc, /2 `clearTimeout` calls/);
  assert.match(doc, /1 `document.querySelectorAll` call/);
  assert.match(doc, /6 element `querySelector` calls/);
  assert.match(doc, /7 `setAttribute` calls/);
  assert.match(doc, /4 `removeAttribute` calls/);
  assert.match(doc, /1 `postMessage` call/);
  assert.match(doc, /2 `applyDOMFallback` references/);
  assert.match(doc, /7 `pendingCollabCards` references/);
  assert.match(doc, /12 `pendingCollabDialogTrigger` references/);
  assert.match(doc, /2 `resolvedCollaboratorsByVideoId` references/);
  assert.match(doc, /1 `refreshActiveCollaborationMenu` reference/);
  assert.match(doc, /`window.collabDialogModule` browser export/);
  assert.match(doc, /no CommonJS export/);
  assert.match(doc, /boot only from `DOMContentLoaded`/);
  assert.match(doc, /no `document.readyState` branch/);
  assert.match(doc, /no `removeEventListener` path/);
  assert.match(doc, /no `disconnect` path/);
  assert.match(doc, /wildcard `FilterTube_CollabDialogData` postMessage/);
  assert.match(doc, /`collabDialogMethodAuthority`, `collabDialogLifecycleContract`, `collabDialogPendingCardAuthority`, `collabDialogMutationReport`, `collabDialogMessageTrustContract`, `collabDialogSelectorTargetReport`, `collabDialogIdentityConfidenceReport`, `collabDialogNoWorkBudget`, `collabDialogTeardownRegistry`, or `collabDialogFixtureProvenance`/);
  assert.match(doc, /and `collab_dialog` collaborator dialog lifecycle\/mutation coverage/);
});

test('objective coverage ledger records injector methods as source-derived bridge import hook rows', () => {
  const doc = ledger();

  assert.match(doc, /Injector method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_INJECTOR_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/injector-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, main-world bridge, settings relay/);
  assert.match(doc, /subscription import, page-message trust, learned identity lookup/);
  assert.match(doc, /DOM selector, lifecycle\/timer, network\/fetch, page-global hook/);
  assert.match(doc, /reliability, false-hide\/leak, performance-risk, code-burden/);
  assert.match(doc, /cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/injector\.js` from representative injector settings capability tokens/);
  assert.match(doc, /103 named method\/helper\/callback declarations/);
  assert.match(doc, /64 function declarations in scope/);
  assert.match(doc, /61 plain function declarations/);
  assert.match(doc, /3 async function declarations/);
  assert.match(doc, /39 const helper\/callback declarations/);
  assert.match(doc, /31 const arrow helper\/callback declarations/);
  assert.match(doc, /1 async const arrow helper\/callback declaration/);
  assert.match(doc, /7 const IIFE result declarations/);
  assert.match(doc, /100 arrow callback sites in scope/);
  assert.match(doc, /12 semantic method groups/);
  assert.match(doc, /bridge lifecycle\/logging/);
  assert.match(doc, /collaborator identity sanitization/);
  assert.match(doc, /subscription context helpers/);
  assert.match(doc, /subscription seed collection/);
  assert.match(doc, /subscription expansion\/wait work/);
  assert.match(doc, /subscription entry normalization\/summary/);
  assert.match(doc, /credentialed YouTubei fetch queueing/);
  assert.match(doc, /collaborator matcher\/cache work/);
  assert.match(doc, /collaborator data extraction/);
  assert.match(doc, /channel snapshot identity search/);
  assert.match(doc, /collaborator snapshot\/DOM search/);
  assert.match(doc, /seed hook\/queue lifecycle/);
  assert.match(doc, /2 `window.addEventListener` calls/);
  assert.match(doc, /0 `removeEventListener` calls/);
  assert.match(doc, /5 `setTimeout` calls/);
  assert.match(doc, /1 `setInterval` call/);
  assert.match(doc, /1 `fetch` call/);
  assert.match(doc, /10 `postMessage` calls/);
  assert.match(doc, /10 wildcard postMessage target calls/);
  assert.match(doc, /2 `dispatchEvent` calls/);
  assert.match(doc, /1 click call/);
  assert.match(doc, /3 `scrollTo` calls/);
  assert.match(doc, /2 `Object.defineProperty` calls/);
  assert.match(doc, /58 `window.filterTube` references/);
  assert.match(doc, /15 `FilterTubeEngine` references/);
  assert.match(doc, /7 `initialDataQueue` references/);
  assert.match(doc, /6 `collaboratorCache` references/);
  assert.match(doc, /subscription import bridge install before the duplicate-run guard/);
  assert.match(doc, /caller settings merge into `currentSettings` without a revision gate/);
  assert.match(doc, /credentialed `\/youtubei\/v1\/browse\?prettyPrint=false` requests/);
  assert.match(doc, /wildcard collaborator\/channel lookup responses/);
  assert.match(doc, /seed processing hook writes/);
  assert.match(doc, /backup `ytInitialData` hook writes/);
  assert.match(doc, /100ms engine polling with a 5000ms timeout/);
  assert.match(doc, /no listener teardown path/);
  assert.match(doc, /`injectorMethodAuthority`, `injectorBridgeMessageTrustContract`, `injectorSettingsRevisionContract`, `injectorSubscriptionImportActionToken`, `injectorSubscriptionImportWorkBudget`, `injectorYoutubeiFetchPolicy`, `injectorSnapshotSearchProvenance`, `injectorCollaboratorIdentityConfidenceReport`, `injectorChannelLookupAuthority`, `injectorSeedHookLifecycleContract`, `injectorPageGlobalPatchReport`, or `injectorFixtureProvenance`/);
  assert.match(doc, /and `injector` main-world bridge\/import\/seed hook coverage/);
});

test('objective coverage ledger records content menu methods as source-derived load-order style rows', () => {
  const doc = ledger();

  assert.match(doc, /Content menu method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_MENU_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/content-menu-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, content helper, menu CSS/);
  assert.match(doc, /HTML escaping, DOM style injection, load-order/);
  assert.match(doc, /theme\/menu vocabulary, reliability, false-hide\/leak/);
  assert.match(doc, /performance-risk, code-burden, cross-feature interaction/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/content\/menu\.js` from helper-count content menu tokens/);
  assert.match(doc, /2 named function declarations/);
  assert.match(doc, /2 plain function declarations/);
  assert.match(doc, /0 async function declarations/);
  assert.match(doc, /0 const helper\/callback declarations/);
  assert.match(doc, /1 module-scoped state declaration/);
  assert.match(doc, /0 arrow callback sites in scope/);
  assert.match(doc, /2 semantic method groups/);
  assert.match(doc, /HTML escaping/);
  assert.match(doc, /shared menu style injection/);
  assert.match(doc, /3 `document` literal occurrences/);
  assert.match(doc, /0 `window` literal occurrences/);
  assert.match(doc, /0 selector API calls/);
  assert.match(doc, /1 `document.createElement` call/);
  assert.match(doc, /1 `document.documentElement` reference/);
  assert.match(doc, /0 `addEventListener` calls/);
  assert.match(doc, /0 `MutationObserver` references/);
  assert.match(doc, /0 `setTimeout` calls/);
  assert.match(doc, /0 `setInterval` calls/);
  assert.match(doc, /1 `textContent` reference/);
  assert.match(doc, /1 `appendChild` call/);
  assert.match(doc, /5 `\.replace` calls/);
  assert.match(doc, /3 `filterTubeMenuStylesInjected` references/);
  assert.match(doc, /21 `filtertube-menu-item` selector token occurrences/);
  assert.match(doc, /31 `filtertube-block-channel-item` selector token occurrences/);
  assert.match(doc, /9 `filtertube-modern-bottom-sheet-item` selector token occurrences/);
  assert.match(doc, /14 `filtertube-filter-all-toggle` selector token occurrences/);
  assert.match(doc, /114 `!important` declarations/);
  assert.match(doc, /manifest load order before `js\/content_bridge\.js`/);
  assert.match(doc, /boolean-only style injection guard/);
  assert.match(doc, /`#filtertube-menu-styles` append to `document.documentElement`/);
  assert.match(doc, /no duplicate DOM check beyond the boolean/);
  assert.match(doc, /no style teardown path/);
  assert.match(doc, /no explicit export path/);
  assert.match(doc, /`contentMenuMethodAuthority`, `contentMenuStyleInjectionContract`, `contentMenuHtmlEscapingContract`, `contentMenuStyleScopeReport`, `contentMenuLoadOrderContract`, `contentMenuThemeParityReport`, `contentMenuTeardownRegistry`, or `contentMenuFixtureProvenance`/);
  assert.match(doc, /and `content_menu` load-order\/style helper coverage/);
});

test('objective coverage ledger records bridge settings methods as source-derived relay import storage rows', () => {
  const doc = ledger();

  assert.match(doc, /Bridge settings method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BRIDGE_SETTINGS_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/bridge-settings-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, settings relay, runtime message/);
  assert.match(doc, /subscription import, page-message trust, seed relay/);
  assert.match(doc, /storage refresh, profile\/host, lifecycle\/timer/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/content\/bridge_settings\.js` from settings-refresh and import-relay tokens/);
  assert.match(doc, /23 named method\/helper\/callback declarations/);
  assert.match(doc, /12 plain function declarations/);
  assert.match(doc, /1 named function expression declaration/);
  assert.match(doc, /10 const helper\/callback declarations/);
  assert.match(doc, /5 const arrow helper\/callback declarations/);
  assert.match(doc, /5 const IIFE result declarations/);
  assert.match(doc, /0 async function declarations/);
  assert.match(doc, /0 async const arrow declarations/);
  assert.match(doc, /39 arrow callback sites in scope/);
  assert.match(doc, /7 semantic method groups/);
  assert.match(doc, /import readiness waiters/);
  assert.match(doc, /subscription import requests/);
  assert.match(doc, /runtime action profile gates/);
  assert.match(doc, /host normalization/);
  assert.match(doc, /background settings fetch\/debug work/);
  assert.match(doc, /seed relay lifecycle/);
  assert.match(doc, /storage refresh fanout/);
  assert.match(doc, /2 `window.addEventListener` calls/);
  assert.match(doc, /0 `removeEventListener` calls/);
  assert.match(doc, /1 runtime `onMessage.addListener` call/);
  assert.match(doc, /1 storage `onChanged.addListener` call/);
  assert.match(doc, /6 `setTimeout` calls/);
  assert.match(doc, /2 `clearTimeout` calls/);
  assert.match(doc, /0 `MutationObserver` references/);
  assert.match(doc, /2 wildcard `postMessage` calls/);
  assert.match(doc, /2 runtime sendMessage calls/);
  assert.match(doc, /6 `applyDOMFallback` references/);
  assert.match(doc, /4 `injectMainWorldScripts` references/);
  assert.match(doc, /5 `sendSettingsToMainWorld` references/);
  assert.match(doc, /import request clamping/);
  assert.match(doc, /injector page-message gates/);
  assert.match(doc, /`getCompiledSettings` background fetches/);
  assert.match(doc, /Kids empty-whitelist normalization to blocklist mode/);
  assert.match(doc, /wildcard `FilterTube_SettingsToInjector` settings relay/);
  assert.match(doc, /250ms seed retries/);
  assert.match(doc, /ignored `channelMap`-only storage writes/);
  assert.match(doc, /video-map storage refresh without forced DOM reprocess/);
  assert.match(doc, /`bridgeSettingsMethodAuthority`, `bridgeSettingsMessageTrustContract`, `bridgeSettingsSubscriptionImportActionToken`, `bridgeSettingsSubscriptionImportProgressBudget`, `bridgeSettingsRuntimeActionSenderContract`, `bridgeSettingsSettingsRevisionContract`, `bridgeSettingsSeedRelayBudget`, `bridgeSettingsStorageRefreshAuthority`, `bridgeSettingsProfileHostContract`, or `bridgeSettingsFixtureProvenance`/);
  assert.match(doc, /and `bridge_settings` settings relay\/import\/storage coverage/);
});

test('objective coverage ledger records handle resolver methods as source-derived identity repair network rows', () => {
  const doc = ledger();

  assert.match(doc, /Handle resolver method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_HANDLE_RESOLVER_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/handle-resolver-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, learned-identity, network/);
  assert.match(doc, /storage\/cache, page-message trust, DOM fallback rerun/);
  assert.match(doc, /lifecycle\/timer, reliability, false-hide\/leak/);
  assert.match(doc, /performance-risk, code-burden, cross-feature interaction/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/content\/handle_resolver\.js` from network\/identity helper tokens/);
  assert.match(doc, /7 named method\/helper declarations/);
  assert.match(doc, /6 plain function declarations/);
  assert.match(doc, /1 async function declaration/);
  assert.match(doc, /0 const helper\/callback declarations/);
  assert.match(doc, /0 const arrow helper\/callback declarations/);
  assert.match(doc, /5 arrow callback sites in scope/);
  assert.match(doc, /4 semantic method groups/);
  assert.match(doc, /learned map persistence/);
  assert.match(doc, /handle normalization/);
  assert.match(doc, /DOM fallback rerun scheduling/);
  assert.match(doc, /resolver fetch\/cache behavior/);
  assert.match(doc, /0 document literal occurrences/);
  assert.match(doc, /5 window literal occurrences/);
  assert.match(doc, /4 browserAPI_BRIDGE references/);
  assert.match(doc, /8 currentSettings references/);
  assert.match(doc, /3 applyDOMFallback references/);
  assert.match(doc, /15 resolvedHandleCache references/);
  assert.match(doc, /4 pendingDomFallbackRerunTimer references/);
  assert.match(doc, /2 FilterTube_UpdateChannelMap references/);
  assert.match(doc, /1 fetchChannelDetails reference/);
  assert.match(doc, /12 channelMap references/);
  assert.match(doc, /4 PENDING token occurrences/);
  assert.match(doc, /1 setTimeout call/);
  assert.match(doc, /0 addEventListener calls/);
  assert.match(doc, /0 MutationObserver references/);
  assert.match(doc, /2 wildcard postMessage calls/);
  assert.match(doc, /2 runtime sendMessage calls/);
  assert.match(doc, /1 same-origin fetch call/);
  assert.match(doc, /1 browserAPI_BRIDGE.storage.local.get reference/);
  assert.match(doc, /1 response.text reference/);
  assert.match(doc, /1 text.match reference/);
  assert.match(doc, /channelMap-first cache behavior/);
  assert.match(doc, /PENDING sentinel null-return behavior/);
  assert.match(doc, /backgroundOnly fetchChannelDetails delegation/);
  assert.match(doc, /\/@handle\/about direct fetch fallback/);
  assert.match(doc, /wildcard map update postMessage/);
  assert.match(doc, /currentSettings.channelMap mutation/);
  assert.match(doc, /250ms forced DOM fallback rerun/);
  assert.match(doc, /`handleResolverMethodAuthority`, `handleResolverNetworkPolicy`, `handleResolverCacheContract`, `handleResolverMapWriteAuthority`, `handleResolverPageMessageTrustContract`, `handleResolverDomFallbackRerunBudget`, `handleResolverBackgroundFetchContract`, `handleResolverIdentityConfidenceReport`, `handleResolverNoRuleBudget`, or `handleResolverFixtureProvenance`/);
  assert.match(doc, /and `handle_resolver` identity repair\/network\/cache coverage/);
});

test('objective coverage ledger records DOM extractors methods as source-derived identity cache stamp rows', () => {
  const doc = ledger();

  assert.match(doc, /DOM extractors method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_DOM_EXTRACTORS_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/dom-extractors-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, DOM selector, learned-identity/);
  assert.match(doc, /source\/effect, settings-mode, hide\/restore/);
  assert.match(doc, /reliability, false-hide\/leak, performance-risk/);
  assert.match(doc, /cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/content\/dom_extractors\.js` from content-helper callable tokens/);
  assert.match(doc, /1,103 source lines/);
  assert.match(doc, /18 top-level function declarations/);
  assert.match(doc, /0 async function declarations/);
  assert.match(doc, /5 local const arrow or IIFE result declarations/);
  assert.match(doc, /23 arrow token sites/);
  assert.match(doc, /47 `VIDEO_CARD_SELECTORS` entries/);
  assert.match(doc, /5 semantic method groups/);
  assert.match(doc, /card identity stamping and recycled-node cleanup/);
  assert.match(doc, /card selector and title extraction/);
  assert.match(doc, /duration parsing and cache behavior/);
  assert.match(doc, /channel metadata normalization and cache behavior/);
  assert.match(doc, /video id extraction waterfall/);
  assert.match(doc, /21 `querySelector` calls/);
  assert.match(doc, /4 `querySelectorAll` calls/);
  assert.match(doc, /59 `removeAttribute` calls/);
  assert.match(doc, /7 `setAttribute` calls/);
  assert.match(doc, /87 `data-filtertube-\*` token occurrences/);
  assert.match(doc, /3 `innerText` references/);
  assert.match(doc, /0 timers/);
  assert.match(doc, /0 listeners/);
  assert.match(doc, /0 observers/);
  assert.match(doc, /0 page messages/);
  assert.match(doc, /0 runtime messages/);
  assert.match(doc, /0 fetches/);
  assert.match(doc, /clear stale recycled-node channel\/hidden\/blocked\/collaborator state/);
  assert.match(doc, /trust or remove cached channel handle\/id stamps/);
  assert.match(doc, /write new DOM channel stamps/);
  assert.match(doc, /empty `data-filtertube-duration` negative cache/);
  assert.match(doc, /current Kids\/href video ids to stamped, dataset, attribute/);
  assert.match(doc, /selected data-host slots/);
  assert.match(doc, /`domExtractorMethodAuthority`, `domExtractorIdentityConfidenceReport`, `domExtractorSelectorScopeContract`, `domExtractorCacheFreshnessContract`, `domExtractorVideoStampMutationReport`, `domExtractorChannelMetadataReport`, `domExtractorDurationCacheBudget`, `domExtractorInnerTextBudget`, `domExtractorRecycledNodeRestoreProof`, or `domExtractorFixtureProvenance`/);
  assert.match(doc, /and `dom_extractors` identity\/cache\/stamp method coverage/);
});

test('objective coverage ledger records shared identity methods as source-derived match normalization rows', () => {
  const doc = ledger();

  assert.match(doc, /Shared identity method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SHARED_IDENTITY_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/shared-identity-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, shared identity, learned-identity/);
  assert.match(doc, /settings-mode, false-hide\/leak/);
  assert.match(doc, /performance-risk, code-burden, cross-feature interaction/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/shared\/identity\.js` from content-helper callable tokens/);
  assert.match(doc, /808 source lines/);
  assert.match(doc, /22 IIFE-scoped named function declarations/);
  assert.match(doc, /22 plain function declarations/);
  assert.match(doc, /0 async function declarations/);
  assert.match(doc, /5 const arrow helper declarations/);
  assert.match(doc, /1 returned arrow helper declaration/);
  assert.match(doc, /8 arrow token sites/);
  assert.match(doc, /14 public `FilterTubeIdentity` API entries/);
  assert.match(doc, /6 semantic method groups/);
  assert.match(doc, /handle normalization/);
  assert.match(doc, /canonical UC\/custom URL input handling/);
  assert.match(doc, /channel filter index construction/);
  assert.match(doc, /indexed channel matching/);
  assert.match(doc, /direct one-filter matching/);
  assert.match(doc, /fast HTML fragment identity extraction/);
  assert.match(doc, /0 document literal occurrences/);
  assert.match(doc, /3 window literal occurrences/);
  assert.match(doc, /3 self literal occurrences/);
  assert.match(doc, /1 globalThis literal occurrence/);
  assert.match(doc, /4 new URL calls/);
  assert.match(doc, /1 JSON.parse call/);
  assert.match(doc, /3 decodeURIComponent calls/);
  assert.match(doc, /8 new Set calls/);
  assert.match(doc, /0 new Map calls/);
  assert.match(doc, /2 Array.isArray calls/);
  assert.match(doc, /9 try\/catch blocks/);
  assert.match(doc, /0 listeners/);
  assert.match(doc, /0 observers/);
  assert.match(doc, /0 timers/);
  assert.match(doc, /0 fetches/);
  assert.match(doc, /0 runtime messages/);
  assert.match(doc, /0 page messages/);
  assert.match(doc, /1 Object.assign export merge/);
  assert.match(doc, /`normalizeUcIdForComparison` internal/);
  assert.match(doc, /`StateManager` optional probe/);
  assert.match(doc, /existing extra `root.FilterTubeIdentity` keys/);
  assert.match(doc, /encoded zero-width handles/);
  assert.match(doc, /`@some` for `normalizeHandleValue\('@Some Handle'\)`/);
  assert.match(doc, /indexed stable-name matches/);
  assert.match(doc, /direct `channelMatchesFilter` match object filters by equal name/);
  assert.match(doc, /Name-only strings can match through `buildChannelFilterIndex`/);
  assert.match(doc, /direct `channelMatchesFilter` does not match a plain string name/);
  assert.match(doc, /fast HTML extraction returns null unless it finds an id, handle, or custom URL/);
  assert.match(doc, /`sharedIdentityMethodAuthority`, `sharedIdentityApiManifest`, `sharedIdentityNormalizationContract`, `sharedIdentityMatchDecisionReport`, `sharedIdentityIndexParityReport`, `sharedIdentityCallerParityReport`, `sharedIdentityHtmlExtractionProvenance`, `sharedIdentityNameFallbackPolicy`, `sharedIdentityUnicodeFixtureProvenance`, or `sharedIdentityLoadOrderContract`/);
  assert.match(doc, /and `shared_identity` matching\/normalization method coverage/);
});

test('objective coverage ledger records prompt onboarding methods as source-derived overlay and navigation rows', () => {
  const doc = ledger();

  assert.match(doc, /Prompt onboarding method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_PROMPT_ONBOARDING_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/prompt-onboarding-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, prompt\/onboarding, runtime lifecycle/);
  assert.match(doc, /message\/mutation, external navigation, DOM overlay/);
  assert.match(doc, /release-note, reliability, false-hide\/leak/);
  assert.match(doc, /performance-risk, code-burden, cross-feature interaction/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/content\/first_run_prompt\.js` and `js\/content\/release_notes_prompt\.js`/);
  assert.match(doc, /440 combined source lines/);
  assert.match(doc, /2 prompt content-script modules/);
  assert.match(doc, /9 named function declarations/);
  assert.match(doc, /9 plain function declarations/);
  assert.match(doc, /0 async function declarations/);
  assert.match(doc, /1 const arrow callback declaration/);
  assert.match(doc, /14 arrow token sites/);
  assert.match(doc, /4 semantic method groups/);
  assert.match(doc, /theme palette/);
  assert.match(doc, /DOM overlay assembly/);
  assert.match(doc, /dismissal\/ack behavior/);
  assert.match(doc, /eligibility requests/);
  assert.match(doc, /18 `document\.createElement` calls/);
  assert.match(doc, /3 `document\.getElementById` calls/);
  assert.match(doc, /18 `appendChild` calls/);
  assert.match(doc, /6 `onclick` assignments/);
  assert.match(doc, /2 `addEventListener` calls/);
  assert.match(doc, /0 `removeEventListener` calls/);
  assert.match(doc, /0 `MutationObserver` references/);
  assert.match(doc, /3 `setTimeout` calls/);
  assert.match(doc, /0 intervals/);
  assert.match(doc, /0 fetches/);
  assert.match(doc, /5 runtime sendMessage calls/);
  assert.match(doc, /1 runtime `getURL` call/);
  assert.match(doc, /1 `window\.open` call/);
  assert.match(doc, /1 `location\.href` write/);
  assert.match(doc, /1 `window\.location\.reload` call/);
  assert.match(doc, /loads release prompt before first-run prompt/);
  assert.match(doc, /injects only first-run prompt from install\/update background paths/);
  assert.match(doc, /guards duplicates only by per-prompt ids/);
  assert.match(doc, /anonymous style nodes without teardown/);
  assert.match(doc, /`FilterTube_OpenWhatsNew` with caller `targetLink`/);
  assert.match(doc, /`window\.open`\/`location\.href` fallback/);
  assert.match(doc, /No `PromptCoordinator`, `promptQueue`, `activePromptOwner`/);
  assert.match(doc, /`promptOnboardingMethodAuthority`, `promptOnboardingQueueContract`, `promptOnboardingSenderClassContract`, `promptOnboardingStorageAckReport`, `promptOnboardingUrlNavigationPolicy`, `promptOnboardingDomLifecycleContract`, `promptOnboardingViewportFitProof`, `promptOnboardingDuplicateOverlayRegistry`, `promptOnboardingStyleTeardownRegistry`, or `promptOnboardingFixtureProvenance`/);
});

test('objective coverage ledger records bridge injection methods as source-derived startup rows', () => {
  const doc = ledger();

  assert.match(doc, /Bridge injection method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BRIDGE_INJECTION_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/bridge-injection-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, startup injection, main-world script injection/);
  assert.match(doc, /manifest load order, background message, fallback DOM script lifecycle/);
  assert.match(doc, /settings relay, runtime lifecycle\/timer/);
  assert.match(doc, /reliability, false-hide\/leak, performance-risk/);
  assert.match(doc, /code-burden, cross-feature interaction/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/content\/bridge_injection\.js`/);
  assert.match(doc, /5 named method\/helper declarations/);
  assert.match(doc, /1 plain function declaration/);
  assert.match(doc, /2 async function declarations/);
  assert.match(doc, /1 named function expression declaration/);
  assert.match(doc, /1 async named function expression declaration/);
  assert.match(doc, /0 const helper\/callback declarations/);
  assert.match(doc, /0 const arrow helper\/callback declarations/);
  assert.match(doc, /8 arrow callback sites/);
  assert.match(doc, /4 semantic method groups/);
  assert.match(doc, /debug\/global bootstrap/);
  assert.match(doc, /background scripting/);
  assert.match(doc, /fallback DOM script injection/);
  assert.match(doc, /main-world orchestration/);
  assert.match(doc, /15 `globalThis` literal occurrences/);
  assert.match(doc, /15 `bridgeState` references/);
  assert.match(doc, /5 `scriptsInjected` references/);
  assert.match(doc, /3 `injectionInProgress` references/);
  assert.match(doc, /7 `injectionPromise` references/);
  assert.match(doc, /4 `browserAPI_BRIDGE` references/);
  assert.match(doc, /4 `IS_FIREFOX_BRIDGE` references/);
  assert.match(doc, /5 `currentSettings` references/);
  assert.match(doc, /7 `debugLog` references/);
  assert.match(doc, /4 `injectMainWorldScripts` references/);
  assert.match(doc, /2 `requestSettingsFromBackground` references/);
  assert.match(doc, /1 `api\.runtime\.sendMessage` call/);
  assert.match(doc, /1 `api\.runtime\.getURL` call/);
  assert.match(doc, /1 `api\.scripting\?\.executeScript` reference/);
  assert.match(doc, /4 `document` literal occurrences/);
  assert.match(doc, /1 `document\.createElement` call/);
  assert.match(doc, /1 `appendChild` call/);
  assert.match(doc, /2 `setTimeout` calls/);
  assert.match(doc, /0 `addEventListener` calls/);
  assert.match(doc, /0 `removeEventListener` calls/);
  assert.match(doc, /0 `MutationObserver` references/);
  assert.match(doc, /0 `postMessage` calls/);
  assert.match(doc, /2 `new Promise` calls/);
  assert.match(doc, /2 `new Error` calls/);
  assert.match(doc, /Chromium `injectScripts` background delegation/);
  assert.match(doc, /fallback web-accessible script tags/);
  assert.match(doc, /Firefox-only fallback `seed`/);
  assert.match(doc, /fixed 50ms fallback load spacing/);
  assert.match(doc, /fixed 100ms settings request handoff/);
  assert.match(doc, /no fallback script removal/);
  assert.match(doc, /no explicit sender\/capability token/);
  assert.match(doc, /`bridgeInjectionMethodAuthority`, `bridgeInjectionScriptManifest`, `bridgeInjectionMainWorldLoadOrderContract`, `bridgeInjectionSenderContract`, `bridgeInjectionFallbackDomLifecycleReport`, `bridgeInjectionRetryBudget`, `bridgeInjectionSettingsReplayContract`, `bridgeInjectionGlobalAliasContract`, or `bridgeInjectionFixtureProvenance`/);
});

test('objective coverage ledger records build release methods as source-derived package rows', () => {
  const doc = ledger();

  assert.match(doc, /Build release method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BUILD_RELEASE_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/build-release-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, release\/package, public release claim/);
  assert.match(doc, /static\/generated\/source boundary, mobile artifact/);
  assert.match(doc, /README\/docs mutation, manifest parity/);
  assert.match(doc, /reliability, false-hide\/leak, performance-risk/);
  assert.match(doc, /code-burden, cross-feature interaction/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`build\.js`/);
  assert.match(doc, /25 named method\/helper\/callback declarations/);
  assert.match(doc, /17 plain function declarations/);
  assert.match(doc, /4 async function declarations/);
  assert.match(doc, /4 const arrow helper\/callback declarations/);
  assert.match(doc, /37 arrow token sites/);
  assert.match(doc, /35 callback-like sites/);
  assert.match(doc, /6 semantic method groups/);
  assert.match(doc, /package assembly/);
  assert.match(doc, /mobile artifact staging/);
  assert.match(doc, /release prompt\/body generation/);
  assert.match(doc, /GitHub release transport/);
  assert.match(doc, /interactive prompt helpers/);
  assert.match(doc, /README badge\/LoC mutation/);
  assert.match(doc, /normal builds mutate README badges/);
  assert.match(doc, /single-target builds preserve the rest of `dist`/);
  assert.match(doc, /package roots are broad directories/);
  assert.match(doc, /repairs only `collab_dialog\.js` before `content_bridge\.js`/);
  assert.match(doc, /ZIP creation lacks a checksum manifest/);
  assert.match(doc, /mobile artifact staging is filename\/versionCode based/);
  assert.match(doc, /non-interactive release prompting is skipped/);
  assert.match(doc, /public GitHub releases are created before asset uploads/);
  assert.match(doc, /asset upload failures have no rollback\/delete path/);
  assert.match(doc, /`buildReleaseMethodAuthority`, `buildPackageManifestAuthority`, `buildReadmeMutationContract`, `buildReleaseDraftFirstContract`, `buildMobileArtifactClaimGate`, `buildGitHubAssetUploadManifest`, `buildGeneratedUiFreshnessReport`, `buildManifestParityReport`, `buildVendorNativeFreshnessContract`, or `buildReleaseFixtureProvenance`/);
});

test('objective coverage ledger records generated UI shell methods as source-derived generated rows', () => {
  const doc = ledger();

  assert.match(doc, /Generated UI shell method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_GENERATED_UI_SHELL_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/generated-ui-shell-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, static\/generated\/source boundary/);
  assert.match(doc, /release\/package, extension popup\/dashboard UI/);
  assert.match(doc, /HTML load order, reliability, false-hide\/leak/);
  assert.match(doc, /performance-risk, code-burden, cross-feature interaction/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`scripts\/build-extension-ui\.mjs`/);
  assert.match(doc, /`src\/extension-shell\/popup\.jsx`/);
  assert.match(doc, /`src\/extension-shell\/tab-view-decor\.jsx`/);
  assert.match(doc, /`src\/extension-shell\/shared\/runtime\.js`/);
  assert.match(doc, /`js\/ui-shell\/popup-shell\.js`/);
  assert.match(doc, /`js\/ui-shell\/tab-view-decor\.js`/);
  assert.match(doc, /249 authoring\/build source lines/);
  assert.match(doc, /697 generated output lines/);
  assert.match(doc, /8 named method\/helper\/component declarations/);
  assert.match(doc, /3 plain function declarations/);
  assert.match(doc, /2 async function declarations/);
  assert.match(doc, /3 export function declarations/);
  assert.match(doc, /2 arrow token sites/);
  assert.match(doc, /4 semantic method groups/);
  assert.match(doc, /esbuild UI build script/);
  assert.match(doc, /popup shell render/);
  assert.match(doc, /tab-view ambient shell render/);
  assert.match(doc, /shared shell runtime/);
  assert.match(doc, /`npm run build:ui` and `build\.js` invoke the shell build/);
  assert.match(doc, /two browser IIFE esbuild outputs to `js\/ui-shell`/);
  assert.match(doc, /HTML load those generated scripts before hand-owned runtime scripts/);
  assert.match(doc, /generated output is tracked source/);
  assert.match(doc, /missing mount nodes skip rendering silently/);
  assert.match(doc, /build failure leaves stale output files in place/);
  assert.match(doc, /`generatedUiShellMethodAuthority`, `uiShellFreshnessManifest`, `uiShellSourceHashManifest`, `uiShellGeneratedOutputHash`, `uiShellGeneratedOutputOwner`, `uiShellPackageParityReport`, `uiShellBrowserRenderFixture`, `uiShellBuildFailureContract`, `uiShellSourceOutputDriftReport`, or `uiShellReleaseFixtureProvenance`/);
});

test('objective coverage ledger records Nanah vendor build methods as source-derived vendor rows', () => {
  const doc = ledger();

  assert.match(doc, /Nanah vendor build method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_NANAH_VENDOR_BUILD_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/nanah-vendor-build-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, static\/generated\/vendor boundary/);
  assert.match(doc, /release\/package, dashboard Nanah sync/);
  assert.match(doc, /QR generation, HTML load order/);
  assert.match(doc, /reliability, false-hide\/leak/);
  assert.match(doc, /performance-risk, code-burden, cross-feature interaction/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`scripts\/build-nanah-vendor\.mjs`/);
  assert.match(doc, /`js\/vendor\/nanah\.bundle\.js`/);
  assert.match(doc, /`js\/vendor\/qrcode\.bundle\.js`/);
  assert.match(doc, /`html\/tab-view\.html`/);
  assert.match(doc, /`js\/tab-view\.js`/);
  assert.match(doc, /`js\/nanah_sync_adapter\.js`/);
  assert.match(doc, /65 build script lines/);
  assert.match(doc, /2,961 vendor output lines/);
  assert.match(doc, /4 named method\/helper declarations/);
  assert.match(doc, /0 plain function declarations/);
  assert.match(doc, /4 async function declarations/);
  assert.match(doc, /1 arrow token site/);
  assert.match(doc, /4 semantic method groups/);
  assert.match(doc, /vendor directory preparation/);
  assert.match(doc, /QR vendor bundle build/);
  assert.match(doc, /Nanah vendor bundle build/);
  assert.match(doc, /vendor build orchestration/);
  assert.match(doc, /`npm run build:nanah-vendor` is separate from normal `npm run build`/);
  assert.match(doc, /QR bundling uses `qrcode \^1\.5\.4` with lockfile version `qrcode 1\.5\.4`/);
  assert.match(doc, /Nanah bundling depends on sibling `\.\.\/nanah`/);
  assert.match(doc, /dashboard HTML loads `qrcode\.bundle\.js` before `nanah\.bundle\.js` before `nanah_sync_adapter\.js` before `tab-view\.js`/);
  assert.match(doc, /dashboard code consumes `window\.FilterTubeQrCode\?\.toCanvas` and `window\.FilterTubeNanah`/);
  assert.match(doc, /build failure leaves stale vendor output files in place/);
  assert.match(doc, /`nanahVendorBuildMethodAuthority`, `nanahVendorSourceRevisionManifest`, `nanahVendorOutputHashManifest`, `nanahVendorPackageVersionManifest`, `nanahVendorSiblingRepoContract`, `nanahVendorQrCodePackageContract`, `nanahVendorGlobalApiContract`, `nanahVendorBuildFreshnessReport`, `nanahVendorPackageParityReport`, or `nanahVendorFixtureProvenance`/);
});

test('objective coverage ledger records legacy layout methods as source-derived quarantine rows', () => {
  const doc = ledger();

  assert.match(doc, /Legacy layout method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_LEGACY_LAYOUT_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/legacy-layout-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, DOM selector, visual hide\/restore/);
  assert.match(doc, /release\/package, static\/generated\/source boundary/);
  assert.match(doc, /renderer inventory, reliability, false-hide\/leak/);
  assert.match(doc, /performance-risk, code-burden, cross-feature interaction/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`js\/layout\.js`/);
  assert.match(doc, /680 source lines/);
  assert.match(doc, /30,604 source bytes/);
  assert.match(doc, /5 exported method declarations/);
  assert.match(doc, /0 plain function declarations/);
  assert.match(doc, /5 function expression properties/);
  assert.match(doc, /0 async function declarations/);
  assert.match(doc, /18 arrow token sites/);
  assert.match(doc, /5 semantic method groups/);
  assert.match(doc, /63 selector API sites/);
  assert.match(doc, /63 static selector sites/);
  assert.match(doc, /0 dynamic selector sites/);
  assert.match(doc, /52 unique static selector literals/);
  assert.match(doc, /146 direct style property writes/);
  assert.match(doc, /34 `style\.display` writes/);
  assert.match(doc, /3 `classList\.add` calls/);
  assert.match(doc, /32 `filter-tube-visible` token occurrences/);
  assert.match(doc, /10 `:not\(\.filter-tube-visible\)` selector clauses/);
  assert.match(doc, /not loaded by active or dist browser manifests/);
  assert.match(doc, /copied into `dist\/chrome\/js\/layout\.js`, `dist\/firefox\/js\/layout\.js`, and `dist\/opera\/js\/layout\.js`/);
  assert.match(doc, /through broad `build\.js` `COMMON_DIRS` package copying/);
  assert.match(doc, /exposes `window\.filterTubeLayout`/);
  assert.match(doc, /has no current non-doc source caller/);
  assert.match(doc, /can hide broad renderer families solely because `\.filter-tube-visible` is absent/);
  assert.match(doc, /`legacyLayoutMethodAuthority`, `legacyLayoutManifestLoadContract`, `legacyLayoutPackageQuarantineManifest`, `legacyLayoutSelectorEffectReport`, `legacyLayoutVisibleMarkerDecisionContract`, `legacyLayoutExtremeHideRestoreProof`, `legacyLayoutInventoryCoveragePolicy`, `legacyLayoutNativeSyncGate`, `legacyLayoutFixtureProvenance`, or `legacyLayoutDeletionReadinessReport`/);
});

test('objective coverage ledger records native runtime sync wrapper methods as source-derived app boundary rows', () => {
  const doc = ledger();

  assert.match(doc, /Native runtime sync method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_NATIVE_RUNTIME_SYNC_METHOD_SEMANTIC_REGISTER_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/native-runtime-sync-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /method\/callable, release\/package, native app sync/);
  assert.match(doc, /static\/generated\/source boundary, JSON-first filtering parity/);
  assert.match(doc, /reliability, false-hide\/leak/);
  assert.match(doc, /performance-risk, code-burden, cross-feature interaction/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`scripts\/sync-native-runtime\.mjs`/);
  assert.match(doc, /34 source lines/);
  assert.match(doc, /1,070 source bytes/);
  assert.match(doc, /4 script-level semantic phases/);
  assert.match(doc, /0 named method declarations/);
  assert.match(doc, /0 plain function declarations/);
  assert.match(doc, /0 async function declarations/);
  assert.match(doc, /0 arrow token sites/);
  assert.match(doc, /3 import declarations/);
  assert.match(doc, /6 const declarations/);
  assert.match(doc, /1 `spawnSync` call site/);
  assert.match(doc, /3 `process\.exit` calls/);
  assert.match(doc, /0 listeners, 0 timers, 0 observers, 0 fetch calls/);
  assert.match(doc, /0 write\/copy\/remove file mutation calls in the public wrapper/);
  assert.match(doc, /`npm run sync:native-runtime` invokes the wrapper/);
  assert.match(doc, /normal `npm run build` does not invoke it/);
  assert.match(doc, /`FILTERTUBE_APP_REPO` or sibling `\.\.\/FilterTubeApp`/);
  assert.match(doc, /delegates with `spawnSync\(process\.execPath, \[syncScript\]\)`/);
  assert.match(doc, /inherits env and stdio/);
  assert.match(doc, /exits `result\.status \?\? 1`/);
  assert.match(doc, /\/Users\/devanshvarshney\/FilterTubeApp\/tools\/sync-runtime-from-extension\.mjs/);
  assert.match(doc, /1,758 lines/);
  assert.match(doc, /76,587 bytes/);
  assert.match(doc, /17 total named function declarations/);
  assert.match(doc, /15 `runtimeBundleOrder` entries/);
  assert.match(doc, /current app manifest has 28 entries all sourced from `\/Users\/devanshvarshney\/FilterTube`/);
  assert.match(doc, /0 `destinationKind` fields/);
  assert.match(doc, /includes `js\/layout\.js`, `js\/vendor\/nanah\.bundle\.js`, and `js\/vendor\/qrcode\.bundle\.js`/);
  assert.match(doc, /excludes `data\/release_notes\.json`/);
  assert.match(doc, /`nativeSyncWrapperMethodAuthority`, `nativeSyncWrapperAppRepoContract`, `nativeSyncWrapperAppRevisionReport`, `nativeSyncWrapperManifestHashReport`, `nativeSyncWrapperDestinationKindManifest`, `nativeSyncWrapperBuildIntegrationGate`, `nativeSyncWrapperReleaseFreshnessReport`, `nativeSyncWrapperStatusContract`, `nativeSyncWrapperFixtureProvenance`, or `nativeSyncWrapperRawCaptureExclusionReport`/);
});

test('objective coverage ledger records native runtime sync manifest freshness as app parity gates', () => {
  const doc = ledger();

  assert.match(doc, /Native runtime sync manifest freshness boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_NATIVE_RUNTIME_SYNC_MANIFEST_FRESHNESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/native-runtime-sync-manifest-freshness-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /native sync, release\/package, generated runtime/);
  assert.match(doc, /release-note parity, first-class JSON filtering parity/);
  assert.match(doc, /direct app manifest freshness proof/);
  assert.match(doc, /app repo HEAD `[0-9a-f]{40}`/);
  assert.match(doc, /46 dirty app paths/);
  assert.match(doc, /28 runtime sync manifest entries/);
  assert.match(doc, /0 `destinationKind` fields/);
  assert.match(doc, /28 direct source\/destination hash matches/);
  assert.match(doc, /43 broad extension-source mirror hash matches/);
  assert.match(doc, /15 `runtimeBundleOrder` entries including `js\/layout\.js`/);
  assert.match(doc, /6 generated app runtime artifact hashes/);
  assert.match(doc, /release-note drift between public `data\/release_notes\.json` and current Android\/iOS native release-note resources/);
  assert.match(doc, /no emitted report ties public revision, app revision, dirty state, manifest hash, destination hashes, generated runtime hashes, and release artifacts together/);
  assert.match(doc, /generated Android\/iOS runtime assets are app-side outputs/);
  assert.match(doc, /native release notes are outside the direct runtime sync manifest/);
  assert.match(doc, /`nativeRuntimeSyncManifestFreshnessContract`, `nativeRuntimeSyncDirectCopyHashReport`, `nativeRuntimeSyncGeneratedRuntimeHashReport`, `nativeRuntimeSyncAppDirtyStateReport`, `nativeRuntimeSyncReleaseNotesParityReport`, `nativeRuntimeSyncDestinationKindManifest`, `nativeRuntimeSyncSourceMirrorReport`, `nativeRuntimeSyncRuntimeBundleOrderGate`, `nativeRuntimeSyncLayoutQuarantineGate`, or `nativeRuntimeSyncFirstClassJsonParityGate`/);
});

test('objective coverage ledger records JSON-first filter readiness as a blocked promotion gate', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first filter readiness gate addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/json-first-filter-readiness-gate-current-behavior\.test\.mjs/);
  assert.match(doc, /first-class JSON filter promotion matrix/);
  assert.match(doc, /13 blocked gate rows/);
  assert.match(doc, /normalized path syntax/);
  assert.match(doc, /renderer ownership/);
  assert.match(doc, /field-effect authority/);
  assert.match(doc, /route\/surface scope/);
  assert.match(doc, /list-mode semantics/);
  assert.match(doc, /identity confidence/);
  assert.match(doc, /mutation effect/);
  assert.match(doc, /category\/network budget/);
  assert.match(doc, /no-rule\/no-work budget/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /DOM fallback parity/);
  assert.match(doc, /native parity/);
  assert.match(doc, /optimization budget/);
  assert.match(doc, /`viewCount` is not a threshold predicate/);
  assert.match(doc, /`videoId` is not channel identity/);
  assert.match(doc, /category filtering can schedule metadata fetch work/);
  assert.match(doc, /harvest can occur before disabled filtering/);
  assert.match(doc, /whitelist mode bypasses the old no-rule fast path/);
  assert.match(doc, /`jsonFirstFilterReadinessGate`, `jsonFirstPathSyntaxManifest`, `jsonFirstRendererCoverageDecision`, `jsonFirstFieldEffectDecision`, `jsonFirstRouteSurfaceReport`, `jsonFirstListModeMatrix`, `jsonFirstIdentityConfidenceReport`, `jsonFirstMutationEffectReport`, `jsonFirstCategoryFetchBudget`, `jsonFirstNoWorkBudget`, `jsonFirstFixtureProvenance`, `jsonFirstDomParityReport`, `jsonFirstNativeParityReport`, or `jsonFirstOptimizationBudget`/);
});

test('objective coverage ledger records JSON-first no-work optimization candidates as audit-only gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first no-work optimization crosswalk addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/json-first-no-work-optimization-crosswalk-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON-first, no-work, performance-risk, runtime lifecycle/);
  assert.match(doc, /endpoint\/XHR, DOM fallback, quick-block/);
  assert.match(doc, /category fetch, false-hide\/leak, code-burden/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /optimization candidates discovered by codebase inspection/);
  assert.match(doc, /seed fetch pass-through/);
  assert.match(doc, /seed XHR pass-through/);
  assert.match(doc, /engine harvest split/);
  assert.match(doc, /DOM lifecycle gate/);
  assert.match(doc, /quick-block lifecycle gate/);
  assert.match(doc, /category metadata fetch gate/);
  assert.match(doc, /metric artifact gate/);
  assert.match(doc, /missing settings and disabled mode still do fetch body parse\/stringify work/);
  assert.match(doc, /XHR can mark\/wrap\/hook before late guards/);
  assert.match(doc, /DOM fallback treats whitelist, broad boolean controls, strict content-filter booleans, and selected-category gates as active work/);
  assert.match(doc, /fallback menu and quick-block lifecycle work is separately gated/);
  assert.match(doc, /category filtering can become network work through metadata fetches/);
  assert.match(doc, /`jsonFirstNoWorkOptimizationCrosswalk`, `jsonFirstWorkDecision`, `jsonFirstSeedPassThroughBudget`, `jsonFirstXhrPassThroughBudget`, `jsonFirstHarvestDecision`, `jsonFirstDomLifecycleBudget`, `jsonFirstQuickBlockLifecycleBudget`, `jsonFirstCategoryMetadataBudget`, `jsonFirstMetricArtifactReport`, or `jsonFirstNoWorkOptimizationBudget`/);
});

test('objective coverage ledger records JSON-first implementation source loci as audit-only gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first implementation locus register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_LOCUS_REGISTER_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/json-first-implementation-locus-register-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON-first, optimization, method\/callable, endpoint\/XHR/);
  assert.match(doc, /runtime lifecycle, DOM fallback, quick-block, category metadata/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /exact future implementation anchors for source inspection/);
  assert.match(doc, /`js\/seed\.js:197`, `js\/seed\.js:336`, `js\/seed\.js:606`, `js\/seed\.js:692`/);
  assert.match(doc, /`js\/filter_logic\.js:154`, `js\/filter_logic\.js:426`, `js\/filter_logic\.js:2126`, `js\/filter_logic\.js:3434`/);
  assert.match(doc, /`js\/content_bridge\.js:1621`, `js\/content_bridge\.js:5717`, `js\/content_bridge\.js:6061`/);
  assert.match(doc, /`js\/content\/dom_fallback\.js:1933`, `js\/content\/dom_fallback\.js:2487`/);
  assert.match(doc, /`js\/content\/block_channel\.js:808`, `js\/content\/block_channel\.js:1454`, and `js\/content\/block_channel\.js:2359`/);
  assert.match(doc, /source-locus, endpoint, active-rule, transport, harvest\/mutation/);
  assert.match(doc, /metadata fetch, DOM active-work, menu lifecycle, quick-block lifecycle/);
  assert.match(doc, /metric, parity, and rollback proof before code changes/);
  assert.match(doc, /`jsonFirstImplementationLocusRegister`, `jsonFirstSourceLocusDecision`, `jsonFirstEndpointDecision`, `jsonFirstActiveRuleReport`, `jsonFirstRendererRuleManifest`, `jsonFirstWorkDecision`, `jsonFirstTransportBudget`, `jsonFirstHarvestMutationBudget`, `jsonFirstMetadataFetchBudget`, `jsonFirstDomActiveWorkReport`, `jsonFirstMenuLifecycleBudget`, `jsonFirstQuickBlockLifecycleBudget`, or `jsonFirstMetricFixtureReport`/);
});

test('objective coverage ledger records static HTML and support script surfaces as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Static HTML\/support script surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_STATIC_HTML_SUPPORT_SCRIPT_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/static-html-support-script-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /tracked-file, extension HTML, release\/support-script/);
  assert.match(doc, /CSP\/resource, route-state, external navigation/);
  assert.match(doc, /reliability, performance-risk, code-burden/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`html\/popup\.html`, `html\/tab-view\.html`, `html\/troubleshoot\.html`, and `scripts\/compress-video\.swift`/);
  assert.match(doc, /popup is the default popup in all four manifests/);
  assert.match(doc, /`#popupRoot`/);
  assert.match(doc, /one external Google Fonts stylesheet/);
  assert.match(doc, /9 hand-authored scripts/);
  assert.match(doc, /tab-view is opened through current runtime routes/);
  assert.match(doc, /100 unique IDs/);
  assert.match(doc, /9 `data-tab` values including hidden future `semantic`/);
  assert.match(doc, /8 external URL occurrences across 7 unique URLs/);
  assert.match(doc, /7 `target="_blank"` anchors/);
  assert.match(doc, /no-rel, `noreferrer`, and `noopener noreferrer` variants/);
  assert.match(doc, /12 hand-authored scripts including QR\/Nanah vendor load order/);
  assert.match(doc, /troubleshoot is an empty tracked HTML file with no current product opener/);
  assert.match(doc, /`compress-video\.swift` deletes an existing output before `\.mp4` support is checked/);
  assert.match(doc, /lacking package-script, dry-run, temporary-output, atomic replacement, and failure-mode artifact proof/);
  assert.match(doc, /`staticHtmlSurfaceAuthority`, `extensionHtmlLoaderOrderManifest`, `extensionHtmlCspResourceReport`, `extensionHtmlRouteStateReport`, `extensionHtmlExternalNavigationReport`, `extensionHtmlSmokeFixture`, `troubleshootHtmlSurfaceDecision`, `compressVideoScriptAuthority`, `compressVideoDryRunContract`, `compressVideoAtomicOutputContract`, or `supportScriptFailureModeReport`/);
});

test('objective coverage ledger records compress-video failure-mode boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Compress-video script failure-mode boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_COMPRESS_VIDEO_SCRIPT_FAILURE_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/compress-video-script-failure-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /support-script, website media optimization, release\/package/);
  assert.match(doc, /performance-risk, reliability, code-burden/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct failure-mode proof for `scripts\/compress-video\.swift`/);
  assert.match(doc, /97 counted source lines/);
  assert.match(doc, /3,339 bytes/);
  assert.match(doc, /196c1ebf918b94e3d36fd2bd04658c4fa4762a85ad5657b49ede7aaa93e2e36b/);
  assert.match(doc, /1 `CompressionError` enum/);
  assert.match(doc, /5 error cases/);
  assert.match(doc, /1 `presetName\(for:\)` function/);
  assert.match(doc, /4 `AVAssetExportPreset\*` tokens/);
  assert.match(doc, /1 `CommandLine\.arguments` read/);
  assert.match(doc, /1 `AVURLAsset` construction/);
  assert.match(doc, /2 `AVAssetExportSession` tokens/);
  assert.match(doc, /1 `fileExists` check/);
  assert.match(doc, /1 `removeItem` call/);
  assert.match(doc, /1 `\.mp4` support check/);
  assert.match(doc, /1 `shouldOptimizeForNetworkUse` write/);
  assert.match(doc, /1 modern `export\(to:as:\)` call/);
  assert.match(doc, /1 legacy `exportAsynchronously` call/);
  assert.match(doc, /3 `DispatchSemaphore`\/semaphore tokens/);
  assert.match(doc, /1 `exporter\.status` switch/);
  assert.match(doc, /2 `attributesOfItem` reads/);
  assert.match(doc, /1 stdout print/);
  assert.match(doc, /1 stderr write/);
  assert.match(doc, /1 `exit\(1\)` call/);
  assert.match(doc, /0 package scripts referencing `compress-video`/);
  assert.match(doc, /0 `build\.js` references/);
  assert.match(doc, /0 tracked non-doc source callers outside the script itself/);
  assert.match(doc, /exporter creation, existing output deletion, `\.mp4` support check/);
  assert.match(doc, /modern or legacy AVFoundation output write/);
  assert.match(doc, /`compressVideoFailureModeBoundaryContract`, `compressVideoPresetManifest`, `compressVideoOutputDestructionReport`, `compressVideoDryRunPlan`, `compressVideoTemporaryOutputContract`, `compressVideoAtomicReplacementContract`, `compressVideoSourceOutputManifest`, `compressVideoPackageScriptGate`, `compressVideoMediaBudgetReport`, or `compressVideoFailureFixtureProvenance`/);
});

test('objective coverage ledger records media asset duplicate derivative boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Media asset duplicate\/derivative boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_MEDIA_ASSET_DUPLICATE_DERIVATIVE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/media-asset-duplicate-derivative-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /media optimization, website asset, extension package, release\/package/);
  assert.match(doc, /performance-risk, code-burden, support-script/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /10 tracked media\/provenance files/);
  assert.match(doc, /6 tracked MP4 files/);
  assert.match(doc, /50,128,618 MP4 bytes/);
  assert.match(doc, /4 text provenance files/);
  assert.match(doc, /5,999 text provenance bytes/);
  assert.match(doc, /3 byte-identical website homepage MP4 files/);
  assert.match(doc, /37,258,272 homepage duplicate-group bytes/);
  assert.match(doc, /24,838,848 duplicate overhead beyond one retained copy/);
  assert.match(doc, /6,152,963 bytes to 2,179,940 bytes/);
  assert.match(doc, /3,973,023 iOS derivative byte reduction/);
  assert.match(doc, /4 extension ambient video source\/output references/);
  assert.match(doc, /2 website served media URL families/);
  assert.match(doc, /0 current source references to `\/videos\/homepage\/homepage_hero_day\.mp4`/);
  assert.match(doc, /0 package scripts referencing `compress-video`/);
  assert.match(doc, /0 `build\.js` `compress-video` references/);
  assert.match(doc, /0 tracked non-doc callers outside `scripts\/compress-video\.swift`/);
  assert.match(doc, /root extension builds copy `assets` wholesale/);
  assert.match(doc, /generated extension shells refer to `\.\.\/assets\/images\/homepage_hero_day\.mp4`/);
  assert.match(doc, /website route data serves `\/videos\/homepage\/day\/homepage_hero_day\.mp4` and `\/videos\/ios\/ios_hero_slow_540\.mp4`/);
  assert.match(doc, /one byte-identical public homepage alias is unreferenced/);
  assert.match(doc, /iOS compression provenance is changelog text plus file hashes/);
  assert.match(doc, /`mediaAssetDuplicateDerivativeBoundaryContract`, `mediaAssetProvenanceManifest`, `mediaDerivativeManifest`, `mediaByteBudgetReport`, `mediaRouteConsumerReport`, `extensionWebsiteMediaSplitPolicy`, `mediaDuplicateCleanupGate`, `mediaCompressionCommandProvenance`, `mediaReducedMotionBudget`, `mediaPackageSizeBudget`, or `mediaArtifactHashManifest`/);
});

test('objective coverage ledger records website route and asset surfaces as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Website route\/asset surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WEBSITE_ROUTE_ASSET_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/website-route-asset-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /tracked-file, website route, website component, asset, public claim/);
  assert.match(doc, /external navigation, remote request, lifecycle, performance-risk/);
  assert.match(doc, /code-burden, release, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /42 tracked website files across 11 app, 13 component, 7 asset, 4 public, and 7 config files/);
  assert.match(doc, /9 platform slugs and detail pages/);
  assert.match(doc, /13 sitemap routes with static `lastModified: "2026-05-16"`/);
  assert.match(doc, /duplicate logo and homepage video hashes/);
  assert.match(doc, /iOS source\/derivative video hash split/);
  assert.match(doc, /22 source remote URL strings outside package-lock metadata/);
  assert.match(doc, /three client components with theme and scene lifecycle cleanup/);
  assert.match(doc, /ignored `\.next`, `node_modules`, `\.vercel`, and `\.DS_Store` outputs/);
  assert.match(doc, /unused `website\/components\/site-data\.js` as a legacy public-copy burden/);
  assert.match(doc, /`websiteRouteSurfaceAuthority`, `websiteRouteManifest`, `websitePlatformClaimManifest`, `websiteAssetProvenanceManifest`, `websiteMediaDerivativeManifest`, `websiteExternalNavigationAuthority`, `websiteRemoteRequestManifest`, `websitePublicClaimArtifactGate`, `websiteGeneratedOutputBoundary`, or `websiteLegacyDataDeletionDecision`/);
});

test('objective coverage ledger records CSS load and style surfaces as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /CSS load\/style surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CSS_LOAD_STYLE_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/css-load-style-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /tracked-file, DOM selector, style\/hide, extension UI, website/);
  assert.match(doc, /package\/quarantine, accessibility\/responsive, false-hide\/leak/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /all 9 tracked CSS files/);
  assert.match(doc, /11,077 counted source lines/);
  assert.match(doc, /296,952 bytes/);
  assert.match(doc, /1,548 lexical rule blocks/);
  assert.match(doc, /593 `!important` declarations/);
  assert.match(doc, /47 `display:none` declarations/);
  assert.match(doc, /72 `:not\(\.filter-tube-visible\)` clauses/);
  assert.match(doc, /167 `filter-tube-visible` tokens/);
  assert.match(doc, /6 `filtertube-hidden` tokens/);
  assert.match(doc, /37 `@media` blocks/);
  assert.match(doc, /7 `@keyframes` blocks/);
  assert.match(doc, /3 `\[hidden\]` selectors/);
  assert.match(doc, /active extension UI CSS load order/);
  assert.match(doc, /no manifest `content_scripts\.css` entries/);
  assert.match(doc, /seven dynamic style creation files/);
  assert.match(doc, /no `insertCSS`, `adoptedStyleSheets`, or `new CSSStyleSheet` product source usage/);
  assert.match(doc, /`cssLoadSurfaceAuthority`, `cssPackageQuarantineManifest`, `cssExtensionPageLoadManifest`, `cssContentScriptActivationGate`, `cssLegacyRevealModelDecision`, `cssSelectorEffectReport`, `cssImportantDebtBudget`, `cssResponsiveVisualFixtureReport`, `cssDynamicStyleLifecycleRegistry`, `cssWebsiteExtensionBoundaryReport`, or `cssDeletionReadinessReport`/);
});

test('objective coverage ledger records extension asset and data package surfaces as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Extension asset\/data package surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_EXTENSION_ASSET_DATA_PACKAGE_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/extension-asset-data-package-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /tracked-file, release\/package, public claim, extension UI/);
  assert.match(doc, /manifest\/resource parity, performance-risk, code-burden/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`assets\/images\/\*`, `icons\/\*`, `data\/release_notes\.json`, and `design\/design_tokens\.json`/);
  assert.match(doc, /source-derived package\/data inventory/);
  assert.match(doc, /12 tracked asset\/data files/);
  assert.match(doc, /8,372,067 bytes/);
  assert.match(doc, /3 root `assets\/images` files totaling 8,327,776 bytes/);
  assert.match(doc, /7 icon files totaling 19,342 bytes/);
  assert.match(doc, /`data\/release_notes\.json` with 1 comment row plus 23 version rows/);
  assert.match(doc, /`design\/design_tokens\.json` as a tracked design input that `build\.js` does not package-copy/);
  assert.match(doc, /direct UI consumers/);
  assert.match(doc, /browser manifest icon references/);
  assert.match(doc, /`icons\/file\.svg` web-accessible drift across browser manifests/);
  assert.match(doc, /staged `3\.3\.2` release notes while package\/browser versions remain `3\.3\.1`/);
  assert.match(doc, /JSON\/CSS design-token drift/);
  assert.match(doc, /`extensionAssetPackageAuthority`, `extensionStaticAssetManifest`, `extensionAssetByteBudget`, `extensionMediaReducedMotionProof`, `extensionIconManifestParityReport`, `extensionWebAccessibleIconParityDecision`, `extensionReleaseNotesSchemaAuthority`, `extensionReleaseNotesVersionGate`, `extensionDesignTokenParityReport`, or `extensionAssetDeletionReadinessReport`/);
});

test('objective coverage ledger records browser manifest runtime load order as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Browser manifest runtime load-order addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BROWSER_MANIFEST_RUNTIME_LOAD_ORDER_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/browser-manifest-runtime-load-order-current-behavior\.test\.mjs/);
  assert.match(doc, /tracked-file, JSON-first startup, manifest\/package/);
  assert.match(doc, /host-scope, permission, web-accessible resource, browser parity/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /all four tracked browser manifests/);
  assert.match(doc, /source-derived load-order inventory/);
  assert.match(doc, /4 manifest files/);
  assert.match(doc, /336 newline counts/);
  assert.match(doc, /9,409 bytes/);
  assert.match(doc, /byte-identical `manifest\.json` and `manifest\.chrome\.json`/);
  assert.match(doc, /Firefox's single no-`world` helper stack and fallback `seed` injection path/);
  assert.match(doc, /Opera's two no-`world` entries/);
  assert.match(doc, /55 content-script file references/);
  assert.match(doc, /14 unique tracked content-script files/);
  assert.match(doc, /no `content_scripts\.css`/);
  assert.match(doc, /shared permission and host-permission sets/);
  assert.match(doc, /`youtube-nocookie\.com` host permission without active runtime matches/);
  assert.match(doc, /`icons\/file\.svg` web-accessible browser drift/);
  assert.match(doc, /build-time manifest handling limited to collaborator-before-bridge order repair/);
  assert.match(doc, /`browserManifestRuntimeLoadOrderAuthority`, `browserManifestPackageParityReport`, `browserManifestContentScriptWorldReport`, `browserManifestSeedReadyReport`, `browserManifestHostScopeClassification`, `browserManifestWebAccessibleResourceDecision`, `browserManifestPermissionFeatureMap`, `browserManifestBuildValidationReport`, `browserManifestPackageQuarantineReport`, or `browserManifestJsonFirstStartupGate`/);
});

test('objective coverage ledger records root package metadata script surface as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Root package metadata script surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_ROOT_PACKAGE_METADATA_SCRIPT_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/root-package-metadata-script-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /tracked-file, release\/package, public claim, dependency/);
  assert.match(doc, /performance-risk, code-burden, JSON-first claim/);
  assert.match(doc, /source\/evidence boundary, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`.gitignore`, `CHANGELOG\.md`, `LICENSE`, `README\.md`, `channel-identity-watch-mix-collab-recovery-plan\.md`, `package\.json`, and `package-lock\.json`/);
  assert.match(doc, /7 tracked root metadata files/);
  assert.match(doc, /2,950 newline counts/);
  assert.match(doc, /134,214 bytes/);
  assert.match(doc, /27 package scripts including `test` and `audit:runtime`/);
  assert.match(doc, /`npm test` smoke-lane entrypoint/);
  assert.match(doc, /no `private`\/`engines`\/`packageManager`/);
  assert.match(doc, /2 runtime dependencies/);
  assert.match(doc, /3 development dependencies/);
  assert.match(doc, /lockfile version 3 with 112 package entries/);
  assert.match(doc, /all non-root lockfile entries carrying integrity values/);
  assert.match(doc, /two deprecated locked packages/);
  assert.match(doc, /README JSON-first\/performance claims/);
  assert.match(doc, /changelog top version `3\.3\.2`/);
  assert.match(doc, /release packaging of only `README\.md`, `CHANGELOG\.md`, and `LICENSE`/);
  assert.match(doc, /ignored local JSON\/HTML\/text captures/);
  assert.match(doc, /tracked `package-lock\.json`/);
  assert.match(doc, /historical channel-identity plan as audit context only/);
  assert.match(doc, /`rootPackageMetadataAuthority`, `packageScriptExecutionGate`, `packageLockReproducibilityReport`, `rootDocClaimParityReport`, `rootGitignoreEvidenceBoundary`, `rootReleaseClaimGate`, `rootJsonFirstClaimGate`, or `rootMetadataDeletionReadinessReport`/);
});

test('objective coverage ledger records JSON-first reference docs as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first reference doc surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_REFERENCE_DOC_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/json-first-reference-doc-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /tracked-file, tracked-doc, JSON path, renderer inventory/);
  assert.match(doc, /optimization, performance-risk, code-burden/);
  assert.match(doc, /source\/evidence boundary, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`docs\/JSON_FIRST_FILTERING_PLAN\.md`, `docs\/json_paths_encyclopedia\.md`, `docs\/watch_json_paths\.md`, and `docs\/youtube_renderer_inventory\.md`/);
  assert.match(doc, /4 tracked JSON-first reference docs/);
  assert.match(doc, /6,486 newline counts/);
  assert.match(doc, /402,371 bytes/);
  assert.match(doc, /JSON-first plan line-205 authority-style wording/);
  assert.match(doc, /264 bracket-index snippets and 54 dot-index snippets/);
  assert.match(doc, /watch collaborator `showDialogCommand`\/`showSheetCommand` variants/);
  assert.match(doc, /renderer inventory status wording/);
  assert.match(doc, /not loaded by product runtime or build source/);
  assert.match(doc, /reduced fixtures/);
  assert.match(doc, /syntax conversion proof/);
  assert.match(doc, /blocklist\/whitelist\/empty\/disabled\/sibling-visible fixtures/);
  assert.match(doc, /route\/surface\/profile\/list-mode proof/);
  assert.match(doc, /identity-confidence and allowed-effect records/);
  assert.match(doc, /no-work budgets/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /runtime parity/);
  assert.match(doc, /DOM fallback parity/);
  assert.match(doc, /claim gates/);
  assert.match(doc, /deletion readiness/);
  assert.match(doc, /first-class JSON filter promotion remain incomplete/);
  assert.match(doc, /`jsonReferenceDocSurfaceAuthority`, `jsonReferenceDocRuntimeParityReport`, `jsonReferenceDocFixtureProvenance`, `jsonReferenceDocSyntaxClassifier`, `jsonReferenceDocClaimGate`, `jsonReferenceDocOptimizationGate`, or `jsonReferenceDocDeletionReadinessReport`/);
});

test('objective coverage ledger records tracked public doc claims as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Tracked public doc claim surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_TRACKED_PUBLIC_DOC_CLAIM_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/tracked-public-doc-claim-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /tracked-file, tracked-doc, public-claim, release\/package/);
  assert.match(doc, /native sync, runtime lifecycle, network\/lifecycle/);
  assert.match(doc, /performance-risk, code-burden/);
  assert.match(doc, /source\/evidence boundary, cross-feature interaction, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /29 tracked product\/public docs/);
  assert.match(doc, /16,059 newline counts/);
  assert.match(doc, /692,767 bytes/);
  assert.match(doc, /29 H1 headings/);
  assert.match(doc, /376 H2 headings/);
  assert.match(doc, /676 H3 headings/);
  assert.match(doc, /3,090 inline-code spans/);
  assert.match(doc, /144 absolute local path strings/);
  assert.match(doc, /291 product\/build\/site file-reference tokens/);
  assert.match(doc, /11 s\/t phrase tokens/);
  assert.match(doc, /41 `complete`/);
  assert.match(doc, /13 `guarantee`/);
  assert.match(doc, /17 `zero`/);
  assert.match(doc, /25 `instant`/);
  assert.match(doc, /35 `performance`/);
  assert.match(doc, /93 `release`/);
  assert.match(doc, /108 `native`/);
  assert.match(doc, /182 `sync`/);
  assert.match(doc, /217 `fetch`/);
  assert.match(doc, /11 `observer`/);
  assert.match(doc, /8 `listener`/);
  assert.match(doc, /4 `timer`/);
  assert.match(doc, /website\/assets\/videos\/README\.md/);
  assert.match(doc, /docs\/filtertube-scenic-media-prompt-brief\.md/);
  assert.match(doc, /`build\.js` does not package-copy `docs`/);
  assert.match(doc, /ignored local docs remain outside tracked-doc obligations/);
  assert.match(doc, /`trackedPublicDocClaimAuthority`, `trackedPublicDocRuntimeParityReport`, `trackedPublicDocReleaseParityReport`, `trackedPublicDocNativeParityReport`, `trackedPublicDocMetricAuthority`, `trackedPublicDocLifecycleBudget`, `trackedPublicDocIgnoredBoundaryReport`, `trackedPublicDocDeletionReadinessReport`, or `trackedPublicDocJsonFirstPromotionGate`/);
});

test('objective coverage ledger records generated local output and dependency surfaces as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Generated local output\/dependency surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_GENERATED_LOCAL_OUTPUT_DEPENDENCY_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/generated-local-output-dependency-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /release\/package, website build\/deploy, dependency, performance-risk, code-burden/);
  assert.match(doc, /source\/evidence boundary, JSON-first package gate, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`dist`, `node_modules`, `website\/\.next`, `website\/\.vercel`, and `website\/node_modules` are absent from `git ls-files`/);
  assert.match(doc, /ignored by current gitignore files/);
  assert.match(doc, /178\/61,356,521/);
  assert.match(doc, /956\/26,325,623/);
  assert.match(doc, /2,288\/346,208,509/);
  assert.match(doc, /291\/29,815,128/);
  assert.match(doc, /18,619\/325,539,259/);
  assert.match(doc, /each current browser `dist` tree has 58 files from broad package roots/);
  assert.match(doc, /three `filtertube-\*-v3\.3\.1\.zip` hashes are pinned local artifacts/);
  assert.match(doc, /`\.next` and `\.vercel` are build\/deploy evidence rather than public-claim proof/);
  assert.match(doc, /root\/website `node_modules` contain 92 and 295 package manifests/);
  assert.match(doc, /`generatedLocalOutputBoundaryAuthority`, `localDependencyCacheAuthority`, `distPackageFreshnessReport`, `distZipChecksumManifest`, `nextBuildArtifactFreshnessReport`, `vercelOutputReleaseAuthority`, `nodeModulesDependencyProof`, `generatedOutputCleanupDecision`, or `firstClassJsonFilterPackageGate`/);
});

test('objective coverage ledger records website package config dependency surface as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Website package\/config dependency surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WEBSITE_PACKAGE_CONFIG_DEPENDENCY_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/website-package-config-dependency-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /tracked-file, website config, dependency, build\/deploy, public-claim/);
  assert.match(doc, /analytics-scope, performance-risk, code-burden, release/);
  assert.match(doc, /source\/evidence boundary, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`website\/\.gitignore`, `website\/\.vercelignore`, `website\/jsconfig\.json`, `website\/next\.config\.mjs`, `website\/package\.json`, `website\/package-lock\.json`, and `website\/postcss\.config\.mjs`/);
  assert.match(doc, /7 files/);
  assert.match(doc, /1,733 newline counts/);
  assert.match(doc, /56,283 bytes/);
  assert.match(doc, /package scripts limited to `dev`, `build`, and `start`/);
  assert.match(doc, /Node engine `22\.x`/);
  assert.match(doc, /8 direct dependencies/);
  assert.match(doc, /lockfile version 3 with 101 package entries/);
  assert.match(doc, /100 non-root entries/);
  assert.match(doc, /65 optional entries/);
  assert.match(doc, /0 dev entries/);
  assert.match(doc, /0 deprecated entries/);
  assert.match(doc, /6 bundled optional Tailwind wasm nested entries without top-level integrity/);
  assert.match(doc, /simple Next\/PostCSS\/jsconfig\/Vercel ignore boundaries/);
  assert.match(doc, /website-only Vercel Analytics import\/rendering/);
  assert.match(doc, /no tracked app\/components `fetch\(\)` or `MutationObserver` usage/);
  assert.match(doc, /`websitePackageConfigAuthority`, `websiteDependencyReproducibilityReport`, `websiteLockfileIntegrityReport`, `websiteNodeEngineContract`, `websiteBuildScriptProof`, `websiteRouteSmokeProof`, `websiteAnalyticsScopeAuthority`, `websiteDeployArtifactGate`, or `websiteFirstClassJsonClaimGate`/);
});

test('objective coverage ledger records website client lifecycle surface as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Website client lifecycle surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WEBSITE_CLIENT_LIFECYCLE_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/website-client-lifecycle-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /tracked-file, website component, runtime lifecycle, localStorage/);
  assert.match(doc, /hydration, menu interaction, public-claim, performance-risk, code-burden/);
  assert.match(doc, /source\/evidence boundary, first-class JSON public-claim, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /22 tracked website app\/component JavaScript files/);
  assert.match(doc, /3 `"use client";` files/);
  assert.match(doc, /`website\/app\/layout\.js` beforeInteractive bootstrap/);
  assert.match(doc, /`website\/components\/scene-controller\.js` scene timer\/listener owner/);
  assert.match(doc, /`website\/components\/theme-toggle\.js` storage\/custom-event owner/);
  assert.match(doc, /`website\/components\/site-header\.js` mobile menu owner/);
  assert.match(doc, /3 `useEffect\(\.\.\.\)` calls/);
  assert.match(doc, /1 `useEffectEvent\(\.\.\.\)` call/);
  assert.match(doc, /2 `useState\(\.\.\.\)` calls/);
  assert.match(doc, /1 `startTransition\(\.\.\.\)` call/);
  assert.match(doc, /3 add\/remove listener pairs across scene\/theme code/);
  assert.match(doc, /1 `window\.setTimeout\(\.\.\.\)` call/);
  assert.match(doc, /2 `window\.clearTimeout\(\.\.\.\)` calls/);
  assert.match(doc, /2 `localStorage\.getItem\(\.\.\.\)` calls/);
  assert.match(doc, /1 `localStorage\.setItem\(\.\.\.\)` call/);
  assert.match(doc, /1 `window\.dispatchEvent\(\.\.\.\)` call/);
  assert.match(doc, /4 JSX `onClick=` props/);
  assert.match(doc, /no tracked website app\/component `fetch\(\.\.\.\)`, observer, interval, animation-frame, or `sessionStorage` references/);
  assert.match(doc, /2026-05-27 method-semantic continuation/);
  assert.match(doc, /22 selected method\/callback rows/);
  assert.match(doc, /8 scene controller rows/);
  assert.match(doc, /8 theme toggle rows/);
  assert.match(doc, /5 site header rows/);
  assert.match(doc, /1 reveal row/);
  assert.match(doc, /3 listener rows/);
  assert.match(doc, /1 timer row/);
  assert.match(doc, /1 storage-write row/);
  assert.match(doc, /1 dispatch row/);
  assert.match(doc, /ASCII and Mermaid lifecycle diagrams/);
  assert.match(doc, /layout bootstrap, scene scheduling, theme storage, header menu state, and reveal rendering boundaries/);
  assert.match(doc, /website client method semantic proof PARTIAL/);
  assert.match(doc, /lifecycle cleanup, theme preference authority, timer\/listener budgets, and first-class JSON public-claim use at NO-GO/);
  assert.match(doc, /`websiteClientLifecycleAuthority`, `websiteHydrationScriptContract`, `websiteSceneScheduleBudget`, `websiteThemePreferenceAuthority`, `websiteClientListenerRegistry`, `websiteClientTimerBudget`, `websiteLocalStorageContract`, `websiteHeaderMenuInteractionAuthority`, `websiteClientLifecycleFixtureProvenance`, or `websiteFirstClassJsonPublicClaimGate`/);
});

test('objective coverage ledger records website route component render graph as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Website route\/component render graph addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WEBSITE_ROUTE_COMPONENT_RENDER_GRAPH_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/website-route-component-render-graph-current-behavior\.test\.mjs/);
  assert.match(doc, /tracked-file, website route, website component, method\/callable/);
  assert.match(doc, /render primitive, import graph, public-claim, performance-risk, code-burden/);
  assert.match(doc, /source\/evidence boundary, first-class JSON public-claim, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /22 tracked website app\/component JavaScript files/);
  assert.match(doc, /4,608 newline counts/);
  assert.match(doc, /185,419 bytes/);
  assert.match(doc, /9 route\/app files/);
  assert.match(doc, /13 component\/data files/);
  assert.match(doc, /44 function declarations/);
  assert.match(doc, /24 exported function declarations/);
  assert.match(doc, /20 local function declarations/);
  assert.match(doc, /31 `export const` declarations/);
  assert.match(doc, /1 re-export declaration/);
  assert.match(doc, /9 default route exports/);
  assert.match(doc, /55 import lines/);
  assert.match(doc, /12 JSX `<Link>` sites/);
  assert.match(doc, /1 JSX `<Image>` site/);
  assert.match(doc, /2 JSX `<video>` sites/);
  assert.match(doc, /1 JSX `<Script>` site/);
  assert.match(doc, /14 literal `<a>` sites/);
  assert.match(doc, /2 `<button>` sites/);
  assert.match(doc, /35 `\.map\(\.\.\.\)` calls/);
  assert.match(doc, /2 `\.filter\(\.\.\.\)` calls/);
  assert.match(doc, /dynamic `\/:slug` static-param\/metadata\/notFound route/);
  assert.match(doc, /sitemap 13-route generation with static `lastModified: "2026-05-16"`/);
  assert.match(doc, /`@\/components\/site-data` as an unimported 7-export legacy public-copy module/);
  assert.match(doc, /`route-content\.js` as the platform\/detail data owner/);
  assert.match(doc, /CDN browser-logo rendering through `BrowserLogoRail`/);
  assert.match(doc, /2026-05-27 `BrowserLogoRail` method-semantic addendum/);
  assert.match(doc, /one exported callable/);
  assert.match(doc, /six rendered browser rows/);
  assert.match(doc, /six remote logo URL rows/);
  assert.match(doc, /one target-blank external anchor/);
  assert.match(doc, /`rel="noreferrer"` without `rel="noopener"`/);
  assert.match(doc, /does not reduce the repo-wide method semantic gap count/);
  assert.match(doc, /`websiteRouteComponentGraphAuthority`, `websiteRouteRenderManifest`, `websiteRouteScreenshotProof`, `websiteStaticParamMetadataContract`, `websiteRouteDataOwnershipReport`, `websiteComponentImportGraphManifest`, `websiteLegacySiteDataDeletionDecision`, `websiteRenderMapAccessibilityReport`, `websitePublicCopyRuntimeParityGate`, or `websiteJsonFirstPublicClaimGate`/);
});

test('objective coverage ledger records website dynamic route method semantics as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Website dynamic route method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WEBSITE_DYNAMIC_ROUTE_METHOD_SEMANTIC_REGISTER_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/website-dynamic-route-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /tracked-file, website route, method\/callable, public-claim/);
  assert.match(doc, /source\/evidence boundary, first-class JSON public-claim, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /dynamic `\/:slug` route from broad render graph context into method-level proof/);
  assert.match(doc, /4 dynamic-route boundary source files/);
  assert.match(doc, /`website\/app\/\[slug\]\/page\.js` at 54 lines and 1,229 bytes/);
  assert.match(doc, /3 route method rows/);
  assert.match(doc, /3 import lines/);
  assert.match(doc, /1 `export const` declaration/);
  assert.match(doc, /3 exported function declarations/);
  assert.match(doc, /2 async exported functions/);
  assert.match(doc, /1 default async route export/);
  assert.match(doc, /9 platform slugs/);
  assert.match(doc, /9 detail-page entries/);
  assert.match(doc, /22 related-page references/);
  assert.match(doc, /0 unresolved related-page references/);
  assert.match(doc, /2 `\.map\(\.\.\.\)` callsites/);
  assert.match(doc, /1 `\.filter\(\.\.\.\)` callsite/);
  assert.match(doc, /1 `notFound\(\)` callsite/);
  assert.match(doc, /2 `await params` callsites/);
  assert.match(doc, /0 `fetch`, timer, listener, or `MutationObserver` primitives/);
  assert.match(doc, /`generateStaticParams\(\)`, `generateMetadata\(\{ params \}\)`, and `DetailPage\(\{ params \}\)`/);
  assert.match(doc, /closed static route params/);
  assert.match(doc, /unknown-metadata `\{\}`/);
  assert.match(doc, /render-time `notFound\(\)`/);
  assert.match(doc, /silent related-page filtering/);
  assert.match(doc, /`websiteDynamicRouteMethodAuthority`, `websiteDynamicRouteStaticParamManifest`, `websiteDynamicRouteMetadataParityReport`, `websiteDynamicRouteRelatedPageIntegrityReport`, `websiteDynamicRouteNotFoundFixture`, `websiteDynamicRouteScreenshotProof`, `websiteDynamicRouteAccessibilityReport`, `websiteDynamicRoutePublicClaimGate`, `websiteDynamicRouteMediaBudget`, or `websiteDynamicRouteFirstClassJsonClaimGate`/);
});

test('objective coverage ledger records website route build smoke artifacts as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Website route build-smoke artifact boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WEBSITE_ROUTE_BUILD_SMOKE_ARTIFACT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/website-route-build-smoke-artifact-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /tracked-file, website route, generated-output, build\/deploy/);
  assert.match(doc, /accessibility, media, source\/evidence boundary, first-class JSON public-claim/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /route smoke\/build proof from repeated gap text into current local artifact proof/);
  assert.match(doc, /7 tracked website route source files compared/);
  assert.match(doc, /2 route data files compared/);
  assert.match(doc, /6 generated manifest files pinned/);
  assert.match(doc, /13-route public source set/);
  assert.match(doc, /18 generated prerender routes/);
  assert.match(doc, /1 generated dynamic route/);
  assert.match(doc, /0 generated `notFoundRoutes`/);
  assert.match(doc, /10 generated app-path manifest entries/);
  assert.match(doc, /15 generated `\.html` files/);
  assert.match(doc, /15 generated `\.rsc` files/);
  assert.match(doc, /18 generated `\.meta` files/);
  assert.match(doc, /13 public source routes with generated html\/rsc\/meta triplets/);
  assert.match(doc, /13 sitemap `<loc>` entries/);
  assert.match(doc, /build id `mU-54AWzEaOTVx1n8fwjP`/);
  assert.match(doc, /`website\/\.next` is ignored local output/);
  assert.match(doc, /no fresh build command, browser screenshot proof, accessibility fixture, or deploy artifact proof is captured/);
  assert.match(doc, /`websiteRouteBuildSmokeAuthority`, `websiteFreshBuildCommandReport`, `websiteRouteArtifactManifest`, `websiteRouteSmokeScreenshotProof`, `websiteRouteAccessibilityProof`, `websiteRouteHydrationSmokeProof`, `websiteRouteMediaLoadBudget`, `websiteRouteDeployArtifactReport`, `websiteRoutePublicClaimParityReport`, or `websiteRouteFirstClassJsonClaimGate`/);
});

test('objective coverage ledger records storage access callsite register as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Storage access callsite register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_STORAGE_ACCESS_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/storage-access-callsite-register-current-behavior\.test\.mjs/);
  assert.match(doc, /storage\/cache, settings-mode, learned-identity, import\/export, Nanah/);
  assert.match(doc, /dashboard refresh, runtime lifecycle, performance-risk, false-hide\/leak/);
  assert.match(doc, /code-burden, cross-feature interaction, source\/evidence boundary, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /8 files with current storage access/);
  assert.match(doc, /57 raw direct storage rows/);
  assert.match(doc, /27 wrapper callsite rows/);
  assert.match(doc, /84 combined storage access rows/);
  assert.match(doc, /21 direct `local\.get` rows/);
  assert.match(doc, /33 direct `local\.set` rows/);
  assert.match(doc, /3 direct `onChanged\.addListener` rows/);
  assert.match(doc, /16 `storageGet\(\.\.\.\)` wrapper rows/);
  assert.match(doc, /4 `readStorage\(\.\.\.\)` wrapper rows/);
  assert.match(doc, /7 `writeStorage\(\.\.\.\)` wrapper rows/);
  assert.match(doc, /`backgroundCacheInvalidationListener`, `contentSettingsRefreshListener`, and `dashboardExternalReloadListener`/);
  assert.match(doc, /compile read-path write behavior/);
  assert.match(doc, /learned-map write surfaces/);
  assert.match(doc, /payload-shaped writes/);
  assert.match(doc, /dynamic Nanah trusted-link storage through `\[key\]`/);
  assert.match(doc, /`storageAccessCallsiteAuthority`, `storageOperationEffectReport`, `storageKeySchemaManifest`, `storageKeyStaticDynamicClassifier`, `storageListenerParityReport`, `storageWriteRevisionContract`, `storageReadPathMutationReport`, `storageWrapperParityContract`, `storageMapOnlyBudget`, or `storageSettingsModeGate`/);
});

test('objective coverage ledger records message transport callsite register as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Message transport callsite register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_MESSAGE_TRANSPORT_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/message-transport-callsite-register-current-behavior\.test\.mjs/);
  assert.match(doc, /message transport, runtime listener, page-message bridge, tab broadcast/);
  assert.match(doc, /settings-mode, learned-identity, performance-risk, false-hide\/leak/);
  assert.match(doc, /code-burden, cross-feature interaction, source\/evidence boundary, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /61 tracked product JS\/JSX\/MJS files scanned/);
  assert.match(doc, /14 files with current message transport rows/);
  assert.match(doc, /64 total rows/);
  assert.match(doc, /4 `runtime\.onMessage\.addListener` rows/);
  assert.match(doc, /27 `runtime\.sendMessage` rows/);
  assert.match(doc, /3 `tabs\.sendMessage` rows/);
  assert.match(doc, /4 `window\.addEventListener\("message"\)` rows/);
  assert.match(doc, /26 `window\.postMessage` rows/);
  assert.match(doc, /`primaryBackgroundActionReceiver`, `secondaryBackgroundTypeReceiver`, `contentRuntimeActionReceiver`, `dashboardRuntimeMessageReceiver`, `contentBridgeMainWorldMessageReceiver`, `subscriptionImportMainWorldReceiver`, and `mainWorldBridgeReceiver`/);
  assert.match(doc, /runtime mutation senders/);
  assert.match(doc, /learned-map page-message rows/);
  assert.match(doc, /settings relay/);
  assert.match(doc, /subscription import/);
  assert.match(doc, /tab-message rows/);
  assert.match(doc, /`messageTransportCallsiteAuthority`, `messageTransportEffectReport`, `runtimeMessageSenderContract`, `pageMessageNonceContract`, `messageTransportReceiverManifest`, `messageTransportTabBroadcastAuthority`, `messageTransportPendingRequestRegistry`, `messageTransportNoWorkBudget`, `messageTransportSpoofFixtureReport`, or `messageTransportTeardownRegistry`/);
});

test('objective coverage ledger records network fetch/xhr callsite register as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Network fetch\/XHR callsite register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_NETWORK_FETCH_XHR_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/network-fetch-xhr-callsite-register-current-behavior\.test\.mjs/);
  assert.match(doc, /network, endpoint\/XHR, JSON-first, settings-mode, learned-identity/);
  assert.match(doc, /performance-risk, false-hide\/leak, code-burden/);
  assert.match(doc, /source\/evidence boundary, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /61 tracked product JS\/JSX\/MJS files scanned/);
  assert.match(doc, /6 files with current network fetch\/XHR rows/);
  assert.match(doc, /29 total rows/);
  assert.match(doc, /16 request primitive rows/);
  assert.match(doc, /13 response consumption rows/);
  assert.match(doc, /13 `fetch` rows/);
  assert.match(doc, /3 XHR prototype rows/);
  assert.match(doc, /3 `response\.body\.getReader` rows/);
  assert.match(doc, /3 `response\.json` rows/);
  assert.match(doc, /7 `response\.text` rows/);
  assert.match(doc, /extension release-note fetches/);
  assert.match(doc, /background watch\/Shorts\/Kids\/channel HTML fetches/);
  assert.match(doc, /direct content-script handle\/watch\/Shorts fetches/);
  assert.match(doc, /main-world subscription import POST/);
  assert.match(doc, /seed passive fetch JSON decode/);
  assert.match(doc, /seed XHR prototype patches/);
  assert.match(doc, /explicit exclusion of `runtime\.getURL\(\.\.\.\)`, `URL\.createObjectURL\(\.\.\.\)`, and local `file\.text\(\)` from network counts/);
  assert.match(doc, /`networkFetchXhrCallsiteAuthority`, `networkRequestPrimitiveRegister`, `networkResponseConsumptionDecision`, `networkFetchNoWorkBudget`, `networkXhrPatchBudget`, `networkCredentialPolicyReport`, `networkJsonFirstBodyDecision`, or `networkFetchFixtureProvenance`/);
});

test('objective coverage ledger records compiled settings field register as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Compiled settings field register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_COMPILED_SETTINGS_FIELD_REGISTER_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/compiled-settings-field-register-current-behavior\.test\.mjs/);
  assert.match(doc, /settings-mode, JSON-first, no-work optimization, learned-identity/);
  assert.match(doc, /storage\/cache, message relay, performance-risk, false-hide\/leak/);
  assert.match(doc, /code-burden, cross-feature interaction, source\/evidence boundary/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /6 settings\/compiler\/runtime files/);
  assert.match(doc, /274 raw compiled\/settings field rows/);
  assert.match(doc, /130 unique file-field-operation rows/);
  assert.match(doc, /44 background compiled fields/);
  assert.match(doc, /36 shared UI compiled fields/);
  assert.match(doc, /8 background-only compiled fields/);
  assert.match(doc, /0 shared-only compiled fields/);
  assert.match(doc, /7 filter-logic processed fields/);
  assert.match(doc, /10 seed cached-settings fields/);
  assert.match(doc, /6 content-bridge current-settings fields/);
  assert.match(doc, /4 bridge-settings settings fields/);
  assert.match(doc, /background-only map\/list\/profile\/exactness and whitelist fields/);
  assert.match(doc, /filter logic's seven normalized fields/);
  assert.match(doc, /seed no-work\/profile reads/);
  assert.match(doc, /bridge learned-map\/list-mode reads/);
  assert.match(doc, /empty Kids whitelist normalization consumers/);
  assert.match(doc, /`compiledSettingsFieldRegisterAuthority`, `compiledSettingsSchemaManifest`, `compiledSettingsFieldParityReport`, `compiledSettingsConsumerManifest`, `settingsJsonFirstFieldDecision`, `settingsJsonFirstNoWorkBudget`, `compiledSettingsRevisionContract`, or `compiledSettingsFixtureProvenance`/);
});

test('objective coverage ledger records settings refresh key parity register as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Settings refresh key parity register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SETTINGS_REFRESH_KEY_PARITY_REGISTER_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/settings-refresh-key-parity-register-current-behavior\.test\.mjs/);
  assert.match(doc, /storage-key, settings-mode, JSON-first, no-work optimization/);
  assert.match(doc, /refresh fanout, learned-identity, performance-risk, false-hide\/leak/);
  assert.match(doc, /code-burden, cross-feature interaction, source\/evidence boundary/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /4 settings refresh key source files/);
  assert.match(doc, /7 key owner sets/);
  assert.match(doc, /49 unique keys/);
  assert.match(doc, /43 background compiler read keys/);
  assert.match(doc, /14 background invalidation keys/);
  assert.match(doc, /36 shared settings keys/);
  assert.match(doc, /38 expanded shared change keys/);
  assert.match(doc, /40 expanded shared load keys/);
  assert.match(doc, /42 content bridge refresh keys/);
  assert.match(doc, /39 StateManager reload keys/);
  assert.match(doc, /30 background compiler keys not invalidated by background/);
  assert.match(doc, /3 compiler keys not watched by content bridge refresh/);
  assert.match(doc, /6 compiler keys not watched by StateManager reload/);
  assert.match(doc, /`channelMap` early return/);
  assert.match(doc, /`videoChannelMap`\/`videoMetaMap` map-only refresh/);
  assert.match(doc, /missing dirty-key\/revision\/no-op\/active-rule\/DOM reprocess decisions/);
  assert.match(doc, /`settingsRefreshKeyParityAuthority`, `settingsRefreshKeyManifest`, `settingsRefreshRevisionContract`, `settingsDirtyKeyDecision`, `settingsNoOpRefreshReport`, `settingsConsumerRefreshMatrix`, `settingsRefreshWorkBudget`, or `settingsRefreshFixtureProvenance`/);
});

test('objective coverage ledger records JSON-first active work predicate register as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first active work predicate register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-active-work-predicate-register-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization, endpoint\/XHR/);
  assert.match(doc, /DOM selector, runtime lifecycle, quick-block\/menu action/);
  assert.match(doc, /category metadata, performance-risk, false-hide\/leak/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /5 source files with active-work predicates/);
  assert.match(doc, /11 predicate anchors/);
  assert.match(doc, /2 endpoint key sets with 5 entries each/);
  assert.match(doc, /3 seed content-filter branches/);
  assert.match(doc, /6 seed JSON active-rule branches/);
  assert.match(doc, /3 seed skip route classes/);
  assert.match(doc, /4 `processWithEngine\(\)` work classes/);
  assert.match(doc, /36 DOM fallback active triggers/);
  assert.match(doc, /28 DOM fallback boolean keys/);
  assert.match(doc, /8 fallback menu warmup scans at 1500 ms/);
  assert.match(doc, /1000 ms quick-block setup delay/);
  assert.match(doc, /no quick-block periodic timer after the 2026-05-25 SPA drag optimization addendum/);
  assert.match(doc, /fetch parse\/stringify work before disabled\/no-settings decisions/);
  assert.match(doc, /XHR mark\/wrap work before late guards/);
  assert.match(doc, /category enabled versus selected-value drift/);
  assert.match(doc, /whitelist DOM fallback activity/);
  assert.match(doc, /engine harvest before disabled checks/);
  assert.match(doc, /fallback menu lifecycle before later action gates/);
  assert.match(doc, /quick-block lifecycle setup before per-card action gates/);
  assert.match(doc, /`jsonFirstActiveWorkPredicateAuthority`, `jsonFirstActiveRulePredicateReport`, `jsonFirstNoWorkDecisionMatrix`, `jsonFirstEndpointActiveRuleDecision`, `jsonFirstDomActiveWorkPredicate`, `jsonFirstQuickBlockLifecyclePredicate`, `jsonFirstFallbackMenuLifecyclePredicate`, `jsonFirstCategorySelectedDecision`, `jsonFirstDisabledModeWorkBudget`, or `jsonFirstActiveWorkFixtureProvenance`/);
  assert.match(doc, /2026-05-30 JSON-first work-class decision linkage/);
  assert.match(doc, /passive JSON body parsing, queued initial-data replay, MAIN-world runtime\s+injection, identity prefetch observer, filter-logic harvest, filter-logic\s+mutation, DOM fallback scan\/stale cleanup, and quick\/menu user-action\s+affordances/);
  assert.match(doc, /JSON path, no-work, performance, false-hide\/leak,\s+settings-mode, lifecycle, cross-feature, and implementation-change rows/);
  assert.match(doc, /`jsonFirstWorkClassDecisionReport` is still absent/);
  assert.match(doc, /predicate\s+merging, JSON-first first-class promotion, DOM fallback pruning, identity\s+prefetch consolidation, quick\/menu lifecycle pruning/);
});

test('objective coverage ledger records JSON-first metric artifact gate as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first metric artifact gate addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_METRIC_ARTIFACT_GATE_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-metric-artifact-gate-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /no-work crosswalk and performance-claim proof into metric-artifact proof/);
  assert.match(doc, /11 metric artifact boundary files/);
  assert.match(doc, /9 runtime metric boundary source files/);
  assert.match(doc, /10 source\/effect blocks/);
  assert.match(doc, /0 `performance\.now\(\)` callsites/);
  assert.match(doc, /0 `console\.time\(\)` callsites/);
  assert.match(doc, /77 `Date\.now\(\)` callsites/);
  assert.match(doc, /21 `statsBySurface` token occurrences/);
  assert.match(doc, /76 `setTimeout` callsites/);
  assert.match(doc, /2 `setInterval` callsites/);
  assert.match(doc, /13 `MutationObserver` tokens/);
  assert.match(doc, /12 `fetch\(\)` callsites/);
  assert.match(doc, /2 `XMLHttpRequest` tokens/);
  assert.match(doc, /seed debug timing/);
  assert.match(doc, /filter-logic debug elapsed time/);
  assert.match(doc, /StateManager debug enrichment duration/);
  assert.match(doc, /background identity timeout\/stream limits/);
  assert.match(doc, /handle resolver pending\/fetch\/rerun behavior/);
  assert.match(doc, /content saved-time stats/);
  assert.match(doc, /debug diagnostics and product stats/);
  assert.match(doc, /not a committed JSON-first metric artifact contract/);
  assert.match(doc, /`jsonFirstMetricArtifactGate`, `jsonFirstMetricArtifactReport`, `jsonFirstRuntimeMetricSample`, `jsonFirstRouteWorkBudgetReport`, `jsonFirstOptimizationMeasurementFixture`, `jsonFirstPerformanceClaimAuthority`, `jsonFirstNoWorkMetricArtifact`, `jsonFirstDomMetricParityReport`, `jsonFirstResolverMetricBudget`, or `jsonFirstStorageMetricBudget`/);
});

test('objective coverage ledger records JSON-first response mutation contract as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first response mutation contract addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-response-mutation-contract-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /source\/evidence boundary, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /1 response-mutation source file/);
  assert.match(doc, /5 fetch endpoint entries/);
  assert.match(doc, /5 XHR endpoint entries/);
  assert.match(doc, /1 fetch endpoint substring gate/);
  assert.match(doc, /2 XHR endpoint substring gates/);
  assert.match(doc, /1 raw `\/youtubei\/v1\/next` shortcut/);
  assert.match(doc, /1 fetch JSON decode site/);
  assert.match(doc, /2 fetch response replacement branches/);
  assert.match(doc, /3 preserved response metadata fields/);
  assert.match(doc, /1 fetch parse-failure pass-through branch/);
  assert.match(doc, /1 fetch non-OK pass-through branch/);
  assert.match(doc, /2 XHR body parse modes/);
  assert.match(doc, /1 XHR `JSON\.parse` site/);
  assert.match(doc, /1 XHR `JSON\.stringify` replacement site/);
  assert.match(doc, /2 XHR modified response fields/);
  assert.match(doc, /2 per-instance XHR property override sites/);
  assert.match(doc, /4 listener hook sites/);
  assert.match(doc, /nonmatching\/non-OK\/invalid fetch pass-through behavior/);
  assert.match(doc, /active fetch body replacement with selected metadata preservation/);
  assert.match(doc, /harvest-only matching fetch parse\/stringify cost/);
  assert.match(doc, /substring endpoint matching/);
  assert.match(doc, /raw comment-continuation shortcut matching/);
  assert.match(doc, /XHR response override behavior/);
  assert.match(doc, /`jsonFirstResponseMutationAuthority`, `jsonFirstResponseMutationContract`, `jsonFirstEndpointParserContract`, `jsonFirstFetchResponseDecision`, `jsonFirstXhrResponseDecision`, `jsonFirstResponseMetadataReport`, `jsonFirstResponsePassThroughReason`, `jsonFirstCommentContinuationDecision`, or `jsonFirstResponseMutationFixtureProvenance`/);
});

test('objective coverage ledger records JSON-first endpoint match policy as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first endpoint match policy addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_ENDPOINT_MATCH_POLICY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-endpoint-match-policy-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /source\/evidence boundary, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /endpoint classifier proof/);
  assert.match(doc, /1 endpoint-match source file/);
  assert.match(doc, /5 fetch endpoint entries/);
  assert.match(doc, /5 XHR endpoint entries/);
  assert.match(doc, /2 identical endpoint arrays/);
  assert.match(doc, /1 fetch raw substring endpoint gate/);
  assert.match(doc, /2 XHR raw substring endpoint gates/);
  assert.match(doc, /1 raw `\/youtubei\/v1\/next` shortcut/);
  assert.match(doc, /2 parsed pathname helper definitions/);
  assert.match(doc, /2 parsed pathname label callsites/);
  assert.match(doc, /0 pre-match origin\/pathname\/segment-boundary gates/);
  assert.match(doc, /2 query-only positive fixtures/);
  assert.match(doc, /2 longer-path positive fixtures/);
  assert.match(doc, /2 nonmatching bypass fixtures/);
  assert.match(doc, /1 Request-object fetch positive fixture/);
  assert.match(doc, /1 URL-object XHR positive fixture/);
  assert.match(doc, /raw substring endpoint admission/);
  assert.match(doc, /parsed pathname label drift/);
  assert.match(doc, /query-only and longer-path current positive matches/);
  assert.match(doc, /nonmatching bypass behavior/);
  assert.match(doc, /non-string URL value behavior/);
  assert.match(doc, /duplicated fetch\/XHR endpoint arrays/);
  assert.match(doc, /raw comment shortcut matching/);
  assert.match(doc, /`jsonFirstEndpointMatchPolicy`, `jsonFirstEndpointParserContract`, `jsonFirstParsedEndpointDecision`, `jsonFirstRawUrlMatchReport`, `jsonFirstEndpointBoundaryFixtureProvenance`, `jsonFirstEndpointNegativeFixtureReport`, `jsonFirstFetchEndpointDecision`, `jsonFirstXhrEndpointDecision`, or `jsonFirstCommentEndpointDecision`/);
});

test('objective coverage ledger records JSON-first URL normalization contract as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first URL normalization contract addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_URL_NORMALIZATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-url-normalization-contract-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /source\/evidence boundary, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /parsed URL normalization proof/);
  assert.match(doc, /1 URL-normalization source file/);
  assert.match(doc, /2 parsed pathname helper definitions/);
  assert.match(doc, /1 unique parsed pathname helper body/);
  assert.match(doc, /0 pre-match parsed pathname callsites/);
  assert.match(doc, /2 post-match parsed pathname label callsites/);
  assert.match(doc, /2 parsed URL base-origin fallback sites/);
  assert.match(doc, /2 parsed URL catch fallback split-query sites/);
  assert.match(doc, /3 raw URL stringification sites before match/);
  assert.match(doc, /1 Request\.url extraction site/);
  assert.match(doc, /1 raw object includes shortcut site/);
  assert.match(doc, /0 origin\/hostname\/hash\/query gates before match/);
  assert.match(doc, /2 relative URL positive fixtures/);
  assert.match(doc, /2 cross-origin exact-path positive fixtures/);
  assert.match(doc, /2 hash-fragment endpoint-text positive fixtures/);
  assert.match(doc, /2 malformed raw endpoint positive fixtures/);
  assert.match(doc, /1 fetch URL-object parse-without-process fixture/);
  assert.match(doc, /1 fetch Request-object process fixture/);
  assert.match(doc, /1 XHR URL-object mark fixture/);
  assert.match(doc, /relative path admission/);
  assert.match(doc, /cross-origin admission/);
  assert.match(doc, /hash-fragment admission with parsed-label drift/);
  assert.match(doc, /malformed raw endpoint fallback labels/);
  assert.match(doc, /fetch URL-object parse-without-process behavior/);
  assert.match(doc, /fetch Request-object processing/);
  assert.match(doc, /XHR URL-object marking/);
  assert.match(doc, /duplicated local pathname helpers/);
  assert.match(doc, /absent pre-match URL component policy/);
  assert.match(doc, /`jsonFirstUrlNormalizationContract`, `jsonFirstEndpointUrlParserContract`, `jsonFirstParsedUrlDecision`, `jsonFirstEndpointUrlValueKind`, `jsonFirstFetchUrlObjectDecision`, `jsonFirstXhrUrlObjectDecision`, `jsonFirstRelativeEndpointDecision`, `jsonFirstMalformedUrlDecision`, or `jsonFirstUrlFragmentQueryPolicy`/);
});

test('objective coverage ledger records JSON-first comment continuation shortcut as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first comment continuation shortcut addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_COMMENT_CONTINUATION_SHORTCUT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-comment-continuation-shortcut-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /source\/evidence boundary, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /comment-continuation shortcut proof/);
  assert.match(doc, /1 comment-continuation source file/);
  assert.match(doc, /1 fetch-only shortcut branch/);
  assert.match(doc, /1 raw `\/youtubei\/v1\/next` shortcut gate/);
  assert.match(doc, /1 `hideAllComments` guard/);
  assert.match(doc, /1 response collection root checked by the shortcut/);
  assert.match(doc, /1 continuation command shape checked by the shortcut/);
  assert.match(doc, /2 comment renderer item shapes checked by the shortcut/);
  assert.match(doc, /1 synthetic response replacement branch/);
  assert.match(doc, /1 synthetic end marker continuation item/);
  assert.match(doc, /1 `continuationEndpoint: null` writer site/);
  assert.match(doc, /3 metadata fields preserved by the shortcut response/);
  assert.match(doc, /2 append endpoint comment positive fixtures/);
  assert.match(doc, /2 non-append command miss fixtures/);
  assert.match(doc, /1 non-endpoints collection miss fixture/);
  assert.match(doc, /1 non-comment append fallback fixture/);
  assert.match(doc, /1 `hideAllComments` false fallback fixture/);
  assert.match(doc, /1 non-next endpoint fallback fixture/);
  assert.match(doc, /2 engine bypass fixtures/);
  assert.match(doc, /5 engine fallback fixtures/);
  assert.match(doc, /append comment shortcut behavior/);
  assert.match(doc, /reload\/replace command misses/);
  assert.match(doc, /`onResponseReceivedActions` miss behavior/);
  assert.match(doc, /non-comment fallback behavior/);
  assert.match(doc, /disabled-shortcut fallback behavior/);
  assert.match(doc, /non-next endpoint fallback behavior/);
  assert.match(doc, /synthetic end marker shape/);
  assert.match(doc, /response metadata preservation/);
  assert.match(doc, /absent shared comment continuation authority/);
  assert.match(doc, /`jsonFirstCommentContinuationContract`, `jsonFirstCommentContinuationDecision`, `jsonFirstCommentShortcutShapeReport`, `jsonFirstCommentSyntheticEndDecision`, `jsonFirstCommentSiblingPreservationReport`, `jsonFirstCommentContinuationNoWorkBudget`, `jsonFirstCommentCommandParityReport`, `jsonFirstCommentContinuationFixtureProvenance`, or `jsonFirstCommentContinuationMetricArtifact`/);
});

test('objective coverage ledger records JSON-first XHR response override contract as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first XHR response override contract addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_XHR_RESPONSE_OVERRIDE_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-xhr-response-override-contract-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /source\/evidence boundary, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /XHR override proof/);
  assert.match(doc, /1 XHR response-override source file/);
  assert.match(doc, /5 XHR endpoint entries/);
  assert.match(doc, /2 XHR mark sites before body guards/);
  assert.match(doc, /2 send-time ready\/load hook installs/);
  assert.match(doc, /2 listener wrapper hook sites/);
  assert.match(doc, /1 response processor definition/);
  assert.match(doc, /7 pre-parse guard branches/);
  assert.match(doc, /2 response body parse modes/);
  assert.match(doc, /1 text `JSON\.parse` site/);
  assert.match(doc, /1 `processWithEngine\(\)` XHR callsite/);
  assert.match(doc, /2 modified response backing fields/);
  assert.match(doc, /2 per-instance response getter override sites/);
  assert.match(doc, /3 response getter return branches after mutation/);
  assert.match(doc, /2 fallback prototype getter branches/);
  assert.match(doc, /1 `responseProcessed` terminal write site/);
  assert.match(doc, /1 text response override positive fixture/);
  assert.match(doc, /1 JSON response override positive fixture/);
  assert.match(doc, /5 late guard no-mutation fixtures/);
  assert.match(doc, /1 listener wrapper invocation fixture/);
  assert.match(doc, /text-like response getter string behavior/);
  assert.match(doc, /JSON response getter object behavior/);
  assert.match(doc, /responseText string behavior/);
  assert.match(doc, /late guard no-mutation behavior/);
  assert.match(doc, /listener wrapper read-order behavior/);
  assert.match(doc, /per-instance getter installation/);
  assert.match(doc, /absent shared XHR override authority/);
  assert.match(doc, /`jsonFirstXhrResponseOverrideContract`, `jsonFirstXhrResponseOverrideDecision`, `jsonFirstXhrBodyModeReport`, `jsonFirstXhrGetterCompatibilityReport`, `jsonFirstXhrListenerOrderReport`, `jsonFirstXhrPassThroughReason`, `jsonFirstXhrOverrideLifetimeRegistry`, `jsonFirstXhrResponseOverrideFixtureProvenance`, or `jsonFirstXhrResponseOverrideMetricArtifact`/);
});

test('objective coverage ledger records JSON-first fetch response rebuild metadata contract as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first fetch response rebuild metadata contract addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_FETCH_RESPONSE_REBUILD_METADATA_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-fetch-response-rebuild-metadata-contract-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /source\/evidence boundary, and implementation-change rows/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /response metadata and body-mode proof/);
  assert.match(doc, /1 fetch response rebuild source file/);
  assert.match(doc, /5 fetch endpoint entries/);
  assert.match(doc, /1 fetch response clone body-read site/);
  assert.match(doc, /2 fetch response rebuild branches/);
  assert.match(doc, /2 `new Response` body writer sites/);
  assert.match(doc, /2 `JSON\.stringify` rebuild body sites/);
  assert.match(doc, /3 selected metadata fields preserved per rebuild/);
  assert.match(doc, /6 selected metadata assignment sites/);
  assert.match(doc, /2 headers object pass-through sites/);
  assert.match(doc, /0 headers clone\/copy sites/);
  assert.match(doc, /0 content-type decision sites/);
  assert.match(doc, /0 body mode decision sites/);
  assert.match(doc, /0 response identity metadata writer sites/);
  assert.match(doc, /3 pass-through branches returning the original response/);
  assert.match(doc, /1 normal rebuild positive fixture/);
  assert.match(doc, /1 comment shortcut rebuild positive fixture/);
  assert.match(doc, /3 pass-through original-response fixtures/);
  assert.match(doc, /selected metadata preservation/);
  assert.match(doc, /shared header object pass-through/);
  assert.match(doc, /missing content-type\/body-mode decisions/);
  assert.match(doc, /missing identity metadata writers/);
  assert.match(doc, /normal rebuild identity drift/);
  assert.match(doc, /comment shortcut rebuild identity drift/);
  assert.match(doc, /invalid-JSON original-response pass-through after one clone JSON read/);
  assert.match(doc, /absent shared fetch response rebuild authority/);
  assert.match(doc, /`jsonFirstFetchResponseRebuildContract`, `jsonFirstFetchResponseMetadataDecision`, `jsonFirstFetchBodyModeReport`, `jsonFirstFetchHeaderClonePolicy`, `jsonFirstFetchResponseIdentityReport`, `jsonFirstFetchPassThroughReason`, `jsonFirstFetchRebuildFixtureProvenance`, `jsonFirstFetchResponseMetricArtifact`, or `jsonFirstFetchContentTypeDecision`/);
});

test('objective coverage ledger records JSON-first pending queue replay contract as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first pending queue replay contract addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_PENDING_QUEUE_REPLAY_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-pending-queue-replay-contract-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /lifecycle\/timer, source\/evidence boundary/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /startup pending queue review into replay and response-effect proof/);
  assert.match(doc, /1 pending queue source file/);
  assert.match(doc, /1 queue state declaration/);
  assert.match(doc, /2 replay timer state declarations/);
  assert.match(doc, /1 replay function/);
  assert.match(doc, /1 schedule function/);
  assert.match(doc, /250 ms replay delay/);
  assert.match(doc, /1 direct no-settings queue push site/);
  assert.match(doc, /0 direct no-settings cap sites/);
  assert.match(doc, /0 direct no-settings schedule sites/);
  assert.match(doc, /1 `queueForLater\(\)` push site/);
  assert.match(doc, /60\/40 helper cap policy/);
  assert.match(doc, /2 helper reason callsites/);
  assert.match(doc, /1 replay no-engine reschedule site/);
  assert.match(doc, /2 queued data clone sites/);
  assert.match(doc, /2 queued data suffixes/);
  assert.match(doc, /1 settings drain site/);
  assert.match(doc, /2 queued global assignment branches/);
  assert.match(doc, /4 runtime queue fixtures/);
  assert.match(doc, /direct no-settings queueing without cap or timer/);
  assert.match(doc, /matching fetch parse\/stringify before settings/);
  assert.match(doc, /settings-update queued fetch replay that cannot change an already-returned response/);
  assert.match(doc, /helper-capped engine-missing queueing/);
  assert.match(doc, /one 250 ms scheduled replay/);
  assert.match(doc, /replay suffix processing after engine restore/);
  assert.match(doc, /queued `ytInitialData` setter reentry/);
  assert.match(doc, /absent shared pending queue replay authority/);
  assert.match(doc, /`jsonFirstPendingQueueReplayContract`, `jsonFirstPendingQueueAdmissionDecision`, `jsonFirstPendingQueueCapPolicy`, `jsonFirstPendingQueueReplayBudget`, `jsonFirstPendingQueueResponseEffectReport`, `jsonFirstPendingQueueSettingsRevision`, `jsonFirstPendingQueueTimerPolicy`, `jsonFirstPendingQueueGlobalAssignmentGuard`, `jsonFirstPendingQueueFixtureProvenance`, or `jsonFirstPendingQueueMetricArtifact`/);
});

test('objective coverage ledger records JSON-first network snapshot stash contract as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first network snapshot stash contract addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_STASH_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-stash-contract-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /learned-identity, source\/evidence boundary/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /stashed network response review into snapshot producer\/consumer proof/);
  assert.match(doc, /2 snapshot source files/);
  assert.match(doc, /1 seed snapshot writer function/);
  assert.match(doc, /4 seed endpoint families written/);
  assert.match(doc, /1 intercepted fetch endpoint family not written/);
  assert.match(doc, /12 latest snapshot field writers/);
  assert.match(doc, /2 recent snapshot arrays/);
  assert.match(doc, /12 retained recent entries/);
  assert.match(doc, /3 recent entry fields/);
  assert.match(doc, /3 process\/stash callsites/);
  assert.match(doc, /2 settings-update initial-global snapshot assignments/);
  assert.match(doc, /3 injector consumer clusters/);
  assert.match(doc, /2 recent browse consumer clusters/);
  assert.match(doc, /2 recent search consumer clusters/);
  assert.match(doc, /4 latest endpoint consumer families/);
  assert.match(doc, /8 runtime snapshot fixtures/);
  assert.match(doc, /endpoint-name substring snapshot admission/);
  assert.match(doc, /search\/browse recent cap behavior/);
  assert.match(doc, /next\/player latest-only behavior/);
  assert.match(doc, /missing guide snapshot behavior/);
  assert.match(doc, /injector consumer drift/);
  assert.match(doc, /harvest-only original-data stashing/);
  assert.match(doc, /processed-result stashing/);
  assert.match(doc, /absent shared network snapshot authority/);
  assert.match(doc, /`jsonFirstNetworkSnapshotStashContract`, `jsonFirstNetworkSnapshotAdmissionDecision`, `jsonFirstNetworkSnapshotEndpointPolicy`, `jsonFirstNetworkSnapshotFreshnessReport`, `jsonFirstNetworkSnapshotClonePolicy`, `jsonFirstNetworkSnapshotConsumerPermission`, `jsonFirstNetworkSnapshotGuidePolicy`, `jsonFirstNetworkSnapshotFixtureProvenance`, or `jsonFirstNetworkSnapshotMetricArtifact`/);
});

test('objective coverage ledger records JSON-first network snapshot consumer freshness as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first network snapshot consumer freshness addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_FRESHNESS_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-freshness-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /learned-identity, subscription import, source\/evidence boundary/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /snapshot producer\/consumer review into consumer freshness proof/);
  assert.match(doc, /1 snapshot consumer source file/);
  assert.match(doc, /4 consumer functions with direct snapshot reads/);
  assert.match(doc, /2 subscription import snapshot seed functions/);
  assert.match(doc, /2 identity snapshot consumer functions/);
  assert.match(doc, /a writer-retained recent browse read horizon/);
  assert.match(doc, /a 6-entry recent search read horizon/);
  assert.match(doc, /0 latest search timestamp consumer reads/);
  assert.match(doc, /0 latest next timestamp consumer reads/);
  assert.match(doc, /0 latest browse timestamp consumer reads outside the subscription import timestamp picker/);
  assert.match(doc, /0 latest player timestamp consumer reads/);
  assert.match(doc, /0 explicit snapshot max age checks/);
  assert.match(doc, /0 explicit settings revision gates/);
  assert.match(doc, /0 explicit current-route permission gates for identity snapshots/);
  assert.match(doc, /4 stale snapshot consumer fixtures/);
  assert.match(doc, /subscription import stale browse consumption on `\/feed\/channels`/);
  assert.match(doc, /route-only import seed gating on `\/watch`/);
  assert.match(doc, /stale browse timestamp reads outside seed collection/);
  assert.match(doc, /channel identity stale recent search consumption when the current watch URL differs/);
  assert.match(doc, /latest search\/next\/browse identity roots ignoring timestamp fields/);
  assert.match(doc, /split writer\/consumer read horizons/);
  assert.match(doc, /absent shared network snapshot consumer freshness authority/);
  assert.match(doc, /`jsonFirstNetworkSnapshotConsumerFreshnessContract`, `jsonFirstNetworkSnapshotAgePolicy`, `jsonFirstNetworkSnapshotRoutePermission`, `jsonFirstNetworkSnapshotProfilePermission`, `jsonFirstNetworkSnapshotSettingsRevisionGate`, `jsonFirstNetworkSnapshotStaleFixture`, `jsonFirstNetworkSnapshotCurrentVideoGate`, or `jsonFirstNetworkSnapshotImportAgeBudget`/);
});

test('objective coverage ledger records JSON-first network snapshot clone isolation as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first network snapshot clone isolation addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CLONE_ISOLATION_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-clone-isolation-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /learned-identity, subscription import, source\/evidence boundary/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /consumer freshness review into snapshot mutation-isolation proof/);
  assert.match(doc, /2 source files with snapshot clone\/reference surface/);
  assert.match(doc, /1 snapshot writer function/);
  assert.match(doc, /4 direct latest assignment sites/);
  assert.match(doc, /2 direct recent entry data writes/);
  assert.match(doc, /2 direct recent tail writes/);
  assert.match(doc, /0 snapshot writer clone callsites/);
  assert.match(doc, /0 snapshot writer freeze\/seal callsites/);
  assert.match(doc, /3 direct stash source-effect callsites/);
  assert.match(doc, /1 normal fetch response stringify site after processing/);
  assert.match(doc, /1 subscription import object-identity dedupe site/);
  assert.match(doc, /6 reference alias fixtures/);
  assert.match(doc, /5 response body isolation fixtures/);
  assert.match(doc, /latest\/recent aliasing for search and browse/);
  assert.match(doc, /latest-only direct references for next and player/);
  assert.match(doc, /direct fallback and harvest-only references/);
  assert.match(doc, /response-body separation from later snapshot mutations/);
  assert.match(doc, /object-identity import dedupe/);
  assert.match(doc, /absent shared clone\/mutation isolation authority/);
  assert.match(doc, /`jsonFirstNetworkSnapshotCloneIsolationContract`, `jsonFirstNetworkSnapshotClonePolicy`, `jsonFirstNetworkSnapshotMutationIsolationReport`, `jsonFirstNetworkSnapshotReferenceAliasReport`, `jsonFirstNetworkSnapshotConsumerMutationBudget`, `jsonFirstNetworkSnapshotResponseBodyIsolationReport`, `jsonFirstNetworkSnapshotObjectFreezePolicy`, or `jsonFirstNetworkSnapshotCloneFixtureProvenance`/);
});

test('objective coverage ledger records JSON-first network snapshot endpoint admission as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first network snapshot endpoint admission addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_ENDPOINT_ADMISSION_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-endpoint-admission-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /learned-identity, source\/evidence boundary/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /snapshot mutation-isolation review into endpoint admission proof/);
  assert.match(doc, /1 source file with snapshot endpoint admission surface/);
  assert.match(doc, /5 fetch endpoint entries/);
  assert.match(doc, /5 XHR endpoint entries/);
  assert.match(doc, /4 snapshot writer endpoint branches/);
  assert.match(doc, /1 fetch endpoint family without a snapshot branch/);
  assert.match(doc, /1 raw fetch endpoint gate/);
  assert.match(doc, /2 raw XHR endpoint mark sites/);
  assert.match(doc, /2 parsed data label callsites/);
  assert.match(doc, /4 snapshot label substring branch sites/);
  assert.match(doc, /4 exact endpoint snapshot fixtures/);
  assert.match(doc, /1 guide no-snapshot fixture/);
  assert.match(doc, /1 longer-path snapshot fixture/);
  assert.match(doc, /3 query\/hash\/relative no-snapshot fixtures/);
  assert.match(doc, /1 cross-origin exact snapshot fixture/);
  assert.match(doc, /2 XHR raw mark fixtures/);
  assert.match(doc, /exact endpoint snapshot families/);
  assert.match(doc, /guide processing without a snapshot family/);
  assert.match(doc, /longer path false-positive snapshot admission/);
  assert.match(doc, /query\/hash\/relative processing without snapshot admission/);
  assert.match(doc, /cross-origin exact snapshot admission/);
  assert.match(doc, /XHR raw marks before snapshot family creation/);
  assert.match(doc, /duplicated fetch\/XHR endpoint lists/);
  assert.match(doc, /absent shared snapshot endpoint admission authority/);
  assert.match(doc, /`jsonFirstNetworkSnapshotEndpointAdmissionContract`, `jsonFirstNetworkSnapshotParsedFamilyDecision`, `jsonFirstNetworkSnapshotEndpointFamilyPolicy`, `jsonFirstNetworkSnapshotGuideEndpointPolicy`, `jsonFirstNetworkSnapshotFalsePositiveReport`, `jsonFirstNetworkSnapshotTransportParityReport`, `jsonFirstNetworkSnapshotEndpointFixtureProvenance`, or `jsonFirstNetworkSnapshotEndpointMetricArtifact`/);
});

test('objective coverage ledger records JSON-first network snapshot permission boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first network snapshot permission boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_PERMISSION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-permission-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /learned-identity, profile\/surface, source\/evidence boundary/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /endpoint admission review into producer permission proof/);
  assert.match(doc, /1 source file with snapshot permission boundary surface/);
  assert.match(doc, /1 snapshot writer function/);
  assert.match(doc, /0 snapshot writer route or hostname reads/);
  assert.match(doc, /0 snapshot writer profile or list-mode reads/);
  assert.match(doc, /0 snapshot writer enabled-state reads/);
  assert.match(doc, /2 pre-writer settings gates/);
  assert.match(doc, /0 settings-update endpoint snapshot clear sites/);
  assert.match(doc, /0 global endpoint snapshot initializers/);
  assert.match(doc, /4 route\/surface snapshot fixtures/);
  assert.match(doc, /3 host snapshot fixtures/);
  assert.match(doc, /4 profile\/list-mode snapshot fixtures/);
  assert.match(doc, /1 no-settings no-snapshot fixture/);
  assert.match(doc, /1 disabled no-snapshot fixture/);
  assert.match(doc, /1 settings-change retention fixture/);
  assert.match(doc, /route\/surface-agnostic enabled snapshot writes/);
  assert.match(doc, /host-agnostic enabled snapshot writes/);
  assert.match(doc, /profile\/list-mode-agnostic enabled snapshot writes/);
  assert.match(doc, /no-settings and disabled pre-writer stop behavior/);
  assert.match(doc, /disabled profile switch snapshot retention/);
  assert.match(doc, /lazy endpoint snapshot fields/);
  assert.match(doc, /absent shared network snapshot permission authority/);
  assert.match(doc, /`jsonFirstNetworkSnapshotPermissionBoundaryContract`, `jsonFirstNetworkSnapshotProducerPermissionDecision`, `jsonFirstNetworkSnapshotRoutePermission`, `jsonFirstNetworkSnapshotSurfacePermission`, `jsonFirstNetworkSnapshotHostPermission`, `jsonFirstNetworkSnapshotProfilePermission`, `jsonFirstNetworkSnapshotSettingsRevisionGate`, `jsonFirstNetworkSnapshotRetentionPolicy`, `jsonFirstNetworkSnapshotDisabledInvalidationReport`, or `jsonFirstNetworkSnapshotPermissionMetricArtifact`/);
});

test('objective coverage ledger records JSON-first network snapshot consumer permission as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first network snapshot consumer permission addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_PERMISSION_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-permission-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /learned-identity, subscription import, profile\/surface/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /producer permission review into consumer read-permission proof/);
  assert.match(doc, /1 consumer source file with snapshot permission surface/);
  assert.match(doc, /4 consumer functions with direct snapshot reads/);
  assert.match(doc, /1 subscription import route gate/);
  assert.match(doc, /1 identity watch-context calculation/);
  assert.match(doc, /1 identity current-video calculation/);
  assert.match(doc, /0 snapshot consumer `currentSettings` reads/);
  assert.match(doc, /0 snapshot consumer `settingsReceived` reads/);
  assert.match(doc, /0 snapshot consumer profile\/list-mode reads/);
  assert.match(doc, /0 snapshot consumer enabled-state reads/);
  assert.match(doc, /3 host-agnostic import fixtures/);
  assert.match(doc, /1 settings-mirror import fixture/);
  assert.match(doc, /3 route-agnostic identity fixtures/);
  assert.match(doc, /2 settings-mirror identity fixtures/);
  assert.match(doc, /1 collaborator snapshot permission fixture/);
  assert.match(doc, /host-agnostic subscription import snapshot reads/);
  assert.match(doc, /disabled-settings mirror import reads/);
  assert.match(doc, /route-agnostic channel identity reads/);
  assert.match(doc, /disabled-settings mirror identity reads/);
  assert.match(doc, /collaborator snapshot reads on Shorts/);
  assert.match(doc, /route-only import blocking off `\/feed\/channels`/);
  assert.match(doc, /absent shared network snapshot consumer permission authority/);
  assert.match(doc, /`jsonFirstNetworkSnapshotConsumerPermissionContract`, `jsonFirstNetworkSnapshotConsumerPermissionDecision`, `jsonFirstNetworkSnapshotConsumerClusterReport`, `jsonFirstNetworkSnapshotConsumerSettingsRevisionGate`, `jsonFirstNetworkSnapshotConsumerRoutePolicy`, `jsonFirstNetworkSnapshotConsumerHostPolicy`, `jsonFirstNetworkSnapshotConsumerProfilePolicy`, `jsonFirstNetworkSnapshotConsumerReadReason`, `jsonFirstNetworkSnapshotConsumerFixtureProvenance`, or `jsonFirstNetworkSnapshotConsumerMetricArtifact`/);
});

test('objective coverage ledger records JSON-first network snapshot consumer source precedence as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first network snapshot consumer source precedence addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_SOURCE_PRECEDENCE_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-source-precedence-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /learned-identity, subscription import, profile\/surface/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /consumer read-permission review into consumer source-precedence proof/);
  assert.match(doc, /1 consumer source file with snapshot source-precedence surface/);
  assert.match(doc, /1 subscription import ordered seed candidate array/);
  assert.match(doc, /5 fixed subscription import candidate slots before the recent spread/);
  assert.match(doc, /1 recent browse spread slot/);
  assert.match(doc, /1 subscription import merge function/);
  assert.match(doc, /1 channel identity ordered target array/);
  assert.match(doc, /10 channel identity root push sites/);
  assert.match(doc, /1 channel identity first-result break site/);
  assert.match(doc, /1 collaborator identity ordered root array/);
  assert.match(doc, /7 collaborator identity root push sites/);
  assert.match(doc, /1 collaborator identity score arbitration site/);
  assert.match(doc, /1 collaborator identity strict-greater score update site/);
  assert.match(doc, /6 runtime source-precedence fixtures/);
  assert.match(doc, /maxChannels-first browse behavior/);
  assert.match(doc, /duplicate merge strong-name retention/);
  assert.match(doc, /channel search before next root precedence/);
  assert.match(doc, /page `ytInitialData` before snapshot roots/);
  assert.match(doc, /collaborator equal-score tie retention/);
  assert.match(doc, /collaborator higher-score later-root replacement/);
  assert.match(doc, /absent shared network snapshot consumer source-precedence authority/);
  assert.match(doc, /`jsonFirstNetworkSnapshotConsumerSourcePrecedenceContract`, `jsonFirstNetworkSnapshotConsumerRootOrderDecision`, `jsonFirstNetworkSnapshotConsumerWinningRootReport`, `jsonFirstNetworkSnapshotConsumerRejectedRootReport`, `jsonFirstNetworkSnapshotConsumerScoreReport`, `jsonFirstNetworkSnapshotConsumerTiePolicy`, `jsonFirstNetworkSnapshotConsumerMergePolicy`, `jsonFirstNetworkSnapshotConsumerFreshnessOverridePolicy`, `jsonFirstNetworkSnapshotConsumerSourceFixtureProvenance`, or `jsonFirstNetworkSnapshotConsumerSourceMetricArtifact`/);
});

test('objective coverage ledger records JSON-first network snapshot consumer traversal budget as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first network snapshot consumer traversal budget addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_TRAVERSAL_BUDGET_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-traversal-budget-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /learned-identity, subscription import, profile\/surface/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /consumer source-precedence review into consumer traversal-budget proof/);
  assert.match(doc, /1 consumer source file with snapshot traversal-budget surface/);
  assert.match(doc, /1 subscription artifact recursive visitor/);
  assert.match(doc, /1 subscription artifact visited set/);
  assert.match(doc, /0 subscription artifact explicit depth caps/);
  assert.match(doc, /0 subscription artifact array slice caps/);
  assert.match(doc, /1 channel identity root recursive search function/);
  assert.match(doc, /1 channel identity root search visited WeakSet/);
  assert.match(doc, /0 channel identity root search explicit depth caps/);
  assert.match(doc, /1 channel identity recent-search retained-root cap/);
  assert.match(doc, /1 collaborator identity root-search depth cap/);
  assert.match(doc, /1 collaborator identity recent-search retained-root cap/);
  assert.match(doc, /2 collaborator extractor nested depth caps/);
  assert.match(doc, /2 collaborator extractor nested array caps/);
  assert.match(doc, /8 runtime traversal-budget fixtures/);
  assert.match(doc, /deep subscription traversal/);
  assert.match(doc, /deep channel traversal/);
  assert.match(doc, /collaborator depth-12 acceptance/);
  assert.match(doc, /collaborator depth-13 cutoff/);
  assert.match(doc, /channel recent-search six-entry horizon behavior/);
  assert.match(doc, /collaborator recent-search six-entry horizon behavior/);
  assert.match(doc, /absent shared network snapshot consumer traversal-budget authority/);
  assert.match(doc, /`jsonFirstNetworkSnapshotConsumerTraversalBudgetContract`, `jsonFirstNetworkSnapshotConsumerTraversalDecision`, `jsonFirstNetworkSnapshotConsumerVisitedNodeReport`, `jsonFirstNetworkSnapshotConsumerDepthPolicy`, `jsonFirstNetworkSnapshotConsumerArrayCapPolicy`, `jsonFirstNetworkSnapshotConsumerRecentRootHorizon`, `jsonFirstNetworkSnapshotConsumerCutoffReason`, `jsonFirstNetworkSnapshotConsumerTraversalMetricArtifact`, `jsonFirstNetworkSnapshotConsumerTraversalFixtureProvenance`, or `jsonFirstNetworkSnapshotConsumerTraversalDurationReport`/);
});

test('objective coverage ledger records JSON-first network snapshot consumer effect boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first network snapshot consumer effect boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-effect-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /learned-identity, subscription import, profile\/surface/);
  assert.match(doc, /message\/effect, source\/evidence boundary/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /consumer traversal-budget proof into consumer effect-boundary proof/);
  assert.match(doc, /2 consumer effect-boundary source files/);
  assert.match(doc, /1 injector channel info response postMessage site/);
  assert.match(doc, /0 injector channel info storage\/message\/persist\/stamp\/rerun sites/);
  assert.match(doc, /1 injector collaborator info response postMessage site/);
  assert.match(doc, /2 injector collaborator cache update callsites inside request handling/);
  assert.match(doc, /1 content bridge channel response pending resolve site/);
  assert.match(doc, /0 content bridge channel response persist\/stamp\/rerun sites/);
  assert.match(doc, /1 content bridge collaborator response pending resolve site/);
  assert.match(doc, /1 content bridge collaborator response `applyResolvedCollaborators` site/);
  assert.match(doc, /1 content bridge update video-channel map persist site/);
  assert.match(doc, /2 content bridge update video-channel map stamp sites/);
  assert.match(doc, /2 content bridge update video-channel map DOM fallback mentions/);
  assert.match(doc, /2 content bridge prefetch snapshot lookup sites/);
  assert.match(doc, /3 content bridge prefetch persist video-channel map sites/);
  assert.match(doc, /1 content bridge search wrapper positive cache write/);
  assert.match(doc, /2 content bridge search wrapper negative cache writes/);
  assert.match(doc, /2 runtime effect-boundary fixtures/);
  assert.match(doc, /channel response no-cache behavior/);
  assert.match(doc, /collaborator response injector-local cache behavior/);
  assert.match(doc, /bridge channel response pending-only behavior/);
  assert.match(doc, /bridge collaborator response apply-resolved behavior/);
  assert.match(doc, /page-message videoChannelMap persist\/stamp\/rerun behavior/);
  assert.match(doc, /absent shared network snapshot consumer effect-boundary authority/);
  assert.match(doc, /`jsonFirstNetworkSnapshotConsumerEffectBoundaryContract`, `jsonFirstNetworkSnapshotConsumerEffectDecision`, `jsonFirstNetworkSnapshotConsumerResponseEffectReport`, `jsonFirstNetworkSnapshotConsumerCacheEffectReport`, `jsonFirstNetworkSnapshotConsumerMapWriteEffectReport`, `jsonFirstNetworkSnapshotConsumerDomStampEffectReport`, `jsonFirstNetworkSnapshotConsumerDomRerunEffectReport`, `jsonFirstNetworkSnapshotConsumerTargetScopeReport`, `jsonFirstNetworkSnapshotConsumerEffectFixtureProvenance`, or `jsonFirstNetworkSnapshotConsumerEffectMetricArtifact`/);
});

test('objective coverage ledger records JSON-first network snapshot consumer request transport as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first network snapshot consumer request transport addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_REQUEST_TRANSPORT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-request-transport-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /learned-identity, subscription import, profile\/surface/);
  assert.match(doc, /message\/effect, source\/evidence boundary, request\/response transport/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /consumer effect-boundary proof into consumer request-transport proof/);
  assert.match(doc, /2 consumer request-transport source files/);
  assert.match(doc, /2 pending snapshot request maps/);
  assert.match(doc, /2 snapshot request id counters/);
  assert.match(doc, /2 snapshot request functions/);
  assert.match(doc, /2 request timeout constants at 2000 ms/);
  assert.match(doc, /2 request retry delays at 250 ms/);
  assert.match(doc, /2 request retry delays at 1000 ms/);
  assert.match(doc, /2 request postMessage wildcard targets/);
  assert.match(doc, /1 injector same-window request listener gate/);
  assert.match(doc, /2 injector content_bridge request source gates/);
  assert.match(doc, /2 injector response postMessage wildcard targets/);
  assert.match(doc, /2 bridge response clearTimeout sites/);
  assert.match(doc, /2 bridge response pending delete sites/);
  assert.match(doc, /2 bridge response pending resolve sites/);
  assert.match(doc, /4 runtime request-transport fixtures/);
  assert.match(doc, /channel retry\/timeout behavior/);
  assert.match(doc, /channel response clear-and-suppress behavior/);
  assert.match(doc, /collaborator retry\/timeout behavior/);
  assert.match(doc, /unsolicited collaborator response apply-resolved behavior/);
  assert.match(doc, /absent shared network snapshot consumer request-transport authority/);
  assert.match(doc, /`jsonFirstNetworkSnapshotConsumerRequestTransportContract`, `jsonFirstNetworkSnapshotConsumerRequestTransportDecision`, `jsonFirstNetworkSnapshotConsumerRequestNonce`, `jsonFirstNetworkSnapshotConsumerPendingRequestRegistry`, `jsonFirstNetworkSnapshotConsumerRetryPolicy`, `jsonFirstNetworkSnapshotConsumerTimeoutPolicy`, `jsonFirstNetworkSnapshotConsumerResponseCorrelationReport`, `jsonFirstNetworkSnapshotConsumerTransportSenderCapability`, `jsonFirstNetworkSnapshotConsumerRequestFixtureProvenance`, or `jsonFirstNetworkSnapshotConsumerRequestMetricArtifact`/);
});

test('objective coverage ledger records JSON-first network snapshot consumer application as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first network snapshot consumer application addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_APPLICATION_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-application-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /learned-identity, subscription import, profile\/surface/);
  assert.match(doc, /request\/response transport, cache\/DOM application/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /consumer request-transport proof into consumer application proof/);
  assert.match(doc, /1 consumer application source file/);
  assert.match(doc, /1 resolved collaborator cache map/);
  assert.match(doc, /1 active collaboration menu map/);
  assert.match(doc, /7 `applyResolvedCollaborators` token occurrences/);
  assert.match(doc, /6 `applyResolvedCollaborators` callsites outside declaration/);
  assert.match(doc, /4 `refreshActiveCollaborationMenu` token occurrences/);
  assert.match(doc, /3 `refreshActiveCollaborationMenu` callsites outside declaration/);
  assert.match(doc, /5 resolved collaborator map set callsites/);
  assert.match(doc, /8 resolved collaborator map get callsites/);
  assert.match(doc, /1 direct card collaborator serialized write site/);
  assert.match(doc, /1 direct card collaborator source-label write site/);
  assert.match(doc, /1 direct card collaborator timestamp write site/);
  assert.match(doc, /1 direct card resolved-state write site/);
  assert.match(doc, /1 direct card pending-dialog cleanup site/);
  assert.match(doc, /1 direct card requested cleanup site/);
  assert.match(doc, /1 active menu refresh callsite/);
  assert.match(doc, /1 playlist fallback refresh callsite/);
  assert.match(doc, /1 zero-delay DOM fallback rerun timer/);
  assert.match(doc, /5 runtime application fixtures/);
  assert.match(doc, /matching-card stamp\/cache\/rerun behavior/);
  assert.match(doc, /no-card cache-and-rerun behavior with a `false` return/);
  assert.match(doc, /richer global cache rejection behavior/);
  assert.match(doc, /force-downgrade per-card skip behavior/);
  assert.match(doc, /active-menu richer resolved-cache behavior/);
  assert.match(doc, /absent shared network snapshot consumer application authority/);
  assert.match(doc, /`jsonFirstNetworkSnapshotConsumerApplicationContract`, `jsonFirstNetworkSnapshotConsumerApplicationDecision`, `jsonFirstNetworkSnapshotConsumerResolvedCacheReport`, `jsonFirstNetworkSnapshotConsumerDomStampReport`, `jsonFirstNetworkSnapshotConsumerActiveMenuRefreshReport`, `jsonFirstNetworkSnapshotConsumerPlaylistPopoverRefreshReport`, `jsonFirstNetworkSnapshotConsumerDomFallbackRerunBudget`, `jsonFirstNetworkSnapshotConsumerCacheDowngradePolicy`, `jsonFirstNetworkSnapshotConsumerCardStampCorrelationReport`, or `jsonFirstNetworkSnapshotConsumerApplicationMetricArtifact`/);
});

test('objective coverage ledger records JSON-first network snapshot consumer stale cache cleanup as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first network snapshot consumer stale cache cleanup addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_STALE_CACHE_CLEANUP_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-stale-cache-cleanup-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /cache\/DOM application, stale cache cleanup, recycled-card restore/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /consumer application proof into stale-cache cleanup proof/);
  assert.match(doc, /1 consumer stale-cache cleanup source file/);
  assert.match(doc, /6 stale-cache cleanup functions/);
  assert.match(doc, /71 reset block lines/);
  assert.match(doc, /34 reset removeAttribute callsites/);
  assert.match(doc, /1 reset setAttribute callsite/);
  assert.match(doc, /2 reset classList\.remove callsites/);
  assert.match(doc, /2 reset style\.removeProperty callsites/);
  assert.match(doc, /33 should-stamp block lines/);
  assert.match(doc, /62 validated-cache block lines/);
  assert.match(doc, /24 validated-cache removeAttribute callsites/);
  assert.match(doc, /13 collaborator-only cleanup block lines/);
  assert.match(doc, /7 collaborator-only cleanup removeAttribute callsites/);
  assert.match(doc, /2 card video-id removeAttribute literal sites/);
  assert.match(doc, /3 card video-id setAttribute literal sites/);
  assert.match(doc, /8 reset token occurrences/);
  assert.match(doc, /2 card-link proof token occurrences/);
  assert.match(doc, /9 `extractVideoIdFromCard\(card\)` token occurrences/);
  assert.match(doc, /1 resolved-map stale check site/);
  assert.match(doc, /7 runtime stale-cache cleanup fixtures/);
  assert.match(doc, /broad stale reset cleanup behavior/);
  assert.match(doc, /live-id mismatch cleanup behavior/);
  assert.match(doc, /stamped-id mismatch cache-retention behavior/);
  assert.match(doc, /no-live validation video-id retention behavior/);
  assert.match(doc, /mismatch validation source\/timestamp and resolved-map retention behavior/);
  assert.match(doc, /matched-cache return behavior/);
  assert.match(doc, /collaborator-only cleanup behavior/);
  assert.match(doc, /absent shared network snapshot consumer stale-cache cleanup authority/);
  assert.match(doc, /`jsonFirstNetworkSnapshotConsumerStaleCacheCleanupContract`, `jsonFirstNetworkSnapshotConsumerStaleCacheDecision`, `jsonFirstNetworkSnapshotConsumerCardVideoIdEvidenceReport`, `jsonFirstNetworkSnapshotConsumerStaleMarkerReport`, `jsonFirstNetworkSnapshotConsumerGlobalCacheRetentionPolicy`, `jsonFirstNetworkSnapshotConsumerStampRejectionCleanupPolicy`, `jsonFirstNetworkSnapshotConsumerNoLiveCacheRetentionPolicy`, `jsonFirstNetworkSnapshotConsumerRecycledCardRestoreProof`, `jsonFirstNetworkSnapshotConsumerStaleCleanupFixtureProvenance`, or `jsonFirstNetworkSnapshotConsumerStaleCleanupMetricArtifact`/);
});

test('objective coverage ledger records JSON-first network snapshot consumer card video-id evidence as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first network snapshot consumer card video-id evidence addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_CARD_VIDEO_ID_EVIDENCE_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-card-video-id-evidence-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /source\/evidence boundary, request\/response transport/);
  assert.match(doc, /cache\/DOM application, stale cache cleanup, card video-id evidence/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /stale-cache cleanup proof into video-id evidence proof/);
  assert.match(doc, /2 consumer card video-id evidence source files/);
  assert.match(doc, /148 ensureVideoIdForCard block lines/);
  assert.match(doc, /50 ensure removeAttribute callsites/);
  assert.match(doc, /1 ensure setAttribute callsite/);
  assert.match(doc, /2 ensure classList\.remove callsites/);
  assert.match(doc, /2 ensure style\.display references/);
  assert.match(doc, /8 ensure hasAttribute callsites/);
  assert.match(doc, /20 ensure high-risk tag comparisons/);
  assert.match(doc, /156 extractVideoIdFromCard block lines/);
  assert.match(doc, /6 extractor querySelector callsites/);
  assert.match(doc, /1 extractor querySelectorAll callsite/);
  assert.match(doc, /5 extractor href regex match callsites/);
  assert.match(doc, /1 extractor scanDataForVideoId callsite/);
  assert.match(doc, /14 cardContainsVideoIdLink block lines/);
  assert.match(doc, /4 card-link selector templates/);
  assert.match(doc, /33 should-stamp block lines/);
  assert.match(doc, /4 should-stamp reset callsites/);
  assert.match(doc, /21 content_bridge ensureVideoIdForCard token occurrences/);
  assert.match(doc, /19 content_bridge extractVideoIdFromCard token occurrences/);
  assert.match(doc, /32 all-product ensureVideoIdForCard token occurrences/);
  assert.match(doc, /29 all-product extractVideoIdFromCard token occurrences/);
  assert.match(doc, /8 content_bridge video-id setAttribute literal sites/);
  assert.match(doc, /3 content_bridge video-id removeAttribute literal sites/);
  assert.match(doc, /5 runtime video-id evidence fixtures/);
  assert.match(doc, /href-over-stale-stamp behavior/);
  assert.match(doc, /high-risk no-cached cleanup with retained inline display behavior/);
  assert.match(doc, /high-risk cached-mismatch display restore with retained collaborator marker behavior/);
  assert.match(doc, /lower-risk fast cached-return behavior/);
  assert.match(doc, /link-proof stamp behavior/);
  assert.match(doc, /direct collaborator-cache video-id stamping/);
  assert.match(doc, /absent shared network snapshot consumer card video-id evidence authority/);
  assert.match(doc, /`jsonFirstNetworkSnapshotConsumerCardVideoIdEvidenceReport`, `jsonFirstNetworkSnapshotConsumerCardVideoIdEvidenceContract`, `jsonFirstNetworkSnapshotConsumerCardVideoIdEvidenceDecision`, `jsonFirstNetworkSnapshotConsumerLiveVideoIdProvenanceReport`, `jsonFirstNetworkSnapshotConsumerHrefProofPolicy`, `jsonFirstNetworkSnapshotConsumerStampedVideoIdTrustPolicy`, `jsonFirstNetworkSnapshotConsumerEnsureVideoIdSideEffectReport`, `jsonFirstNetworkSnapshotConsumerVideoIdFastReturnPolicy`, `jsonFirstNetworkSnapshotConsumerVideoIdRestoreProof`, `jsonFirstNetworkSnapshotConsumerVideoIdEvidenceFixtureProvenance`, or `jsonFirstNetworkSnapshotConsumerVideoIdEvidenceMetricArtifact`/);
});

test('objective coverage ledger records JSON-first network snapshot consumer stale marker matrix as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first network snapshot consumer stale marker matrix addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_STALE_MARKER_MATRIX_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-stale-marker-matrix-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, endpoint\/XHR, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /source\/evidence boundary, request\/response transport/);
  assert.match(doc, /cache\/DOM application, stale cache cleanup, card video-id evidence, stale marker retention/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /video-id evidence proof into stale marker matrix proof/);
  assert.match(doc, /3 consumer stale-marker matrix source files/);
  assert.match(doc, /6 cleanup\/evidence blocks/);
  assert.match(doc, /31 combined unique stale marker literals/);
  assert.match(doc, /148 ensureVideoIdForCard marker block lines/);
  assert.match(doc, /31 ensure marker literals/);
  assert.match(doc, /50 ensure removeAttribute callsites/);
  assert.match(doc, /71 resetCardIdentityIfStale marker block lines/);
  assert.match(doc, /23 reset marker literals/);
  assert.match(doc, /34 reset removeAttribute callsites/);
  assert.match(doc, /62 validated-cache marker block lines/);
  assert.match(doc, /19 validated-cache marker literals/);
  assert.match(doc, /24 validated-cache removeAttribute callsites/);
  assert.match(doc, /13 collaborator-only marker block lines/);
  assert.match(doc, /7 collaborator-only marker literals/);
  assert.match(doc, /7 collaborator-only removeAttribute callsites/);
  assert.match(doc, /47 isExplicitlyHiddenByFilterTube marker block lines/);
  assert.match(doc, /13 fallback hidden marker literals/);
  assert.match(doc, /7 fallback hidden removeAttribute callsites/);
  assert.match(doc, /152 DOM fallback processed-loop marker block lines/);
  assert.match(doc, /17 processed-loop marker literals/);
  assert.match(doc, /27 processed-loop removeAttribute callsites/);
  assert.match(doc, /36 content_bridge video-id token occurrences/);
  assert.match(doc, /5 dom_extractors video-id token occurrences/);
  assert.match(doc, /5 dom_fallback video-id token occurrences/);
  assert.match(doc, /5 runtime stale-marker matrix fixtures/);
  assert.match(doc, /extractor no-cached retained-display behavior/);
  assert.match(doc, /extractor cached-mismatch retained-collaborator-marker behavior/);
  assert.match(doc, /bridge reset retained last-mode\/whitelist-pending behavior/);
  assert.match(doc, /validated-cache retained source\/timestamp\/hidden\/custom\/processed behavior/);
  assert.match(doc, /DOM fallback stale-hidden explicit-marker early-return boundary/);
  assert.match(doc, /absent shared network snapshot consumer stale-marker matrix authority/);
  assert.match(doc, /`jsonFirstNetworkSnapshotConsumerStaleMarkerReport`, `jsonFirstNetworkSnapshotConsumerStaleMarkerMatrix`, `jsonFirstNetworkSnapshotConsumerStaleMarkerCleanupDecision`, `jsonFirstNetworkSnapshotConsumerStaleMarkerRetentionPolicy`, `jsonFirstNetworkSnapshotConsumerHiddenMarkerRestoreProof`, `jsonFirstNetworkSnapshotConsumerCollaboratorMarkerRetentionPolicy`, `jsonFirstNetworkSnapshotConsumerProcessedMarkerPolicy`, `jsonFirstNetworkSnapshotConsumerBlockedMarkerPolicy`, `jsonFirstNetworkSnapshotConsumerStaleMarkerFixtureProvenance`, or `jsonFirstNetworkSnapshotConsumerStaleMarkerMetricArtifact`/);
});

test('objective coverage ledger records JSON-first video meta DOM rerun as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first video meta DOM rerun addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_DOM_RERUN_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-dom-rerun-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /category\/date\/duration metadata, lifecycle\/timer/);
  assert.match(doc, /message\/effect, network fetch, cache\/DOM application/);
  assert.match(doc, /processed-marker, background storage flush/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /stale-marker proof into video-meta rerun proof/);
  assert.match(doc, /3 video-meta DOM rerun source files/);
  assert.match(doc, /8 source\/effect blocks/);
  assert.match(doc, /62 persistVideoMetaMapping block lines/);
  assert.match(doc, /10 persist block videoMetaMap tokens/);
  assert.match(doc, /1 persist runtime sendMessage callsite/);
  assert.match(doc, /16 rerun schedule block lines/);
  assert.match(doc, /550 ms content DOM rerun debounce/);
  assert.match(doc, /57 touchDomForVideoMetaUpdate block lines/);
  assert.match(doc, /3 touch removeAttribute callsites/);
  assert.match(doc, /2 touch querySelectorAll callsites/);
  assert.match(doc, /101 watch meta fetch queue block lines/);
  assert.match(doc, /3 watch meta fetch concurrency limit/);
  assert.match(doc, /60000 ms fetch cooldown/);
  assert.match(doc, /98 fetchVideoMetaFromWatchUrl block lines/);
  assert.match(doc, /1 watch fetch callsite/);
  assert.match(doc, /1 watch JSON\.parse callsite/);
  assert.match(doc, /26 FilterTube_UpdateVideoMetaMap branch lines/);
  assert.match(doc, /39 DOM fallback category videoMetaMap block lines/);
  assert.match(doc, /41 background enqueueVideoMetaMapUpdate block lines/);
  assert.match(doc, /75 ms background videoMetaMap flush debounce/);
  assert.match(doc, /40 background videoMetaMap tokens/);
  assert.match(doc, /5 runtime video-meta DOM rerun fixtures/);
  assert.match(doc, /persistence cleaned-row forwarding/);
  assert.match(doc, /targeted DOM touch marker-retention behavior/);
  assert.match(doc, /550 ms rerun timer replacement behavior/);
  assert.match(doc, /message-triggered rerun only after DOM touch/);
  assert.match(doc, /satisfied-metadata no-fetch behavior/);
  assert.match(doc, /pending duplicate fetch suppression/);
  assert.match(doc, /invalid-id rejection/);
  assert.match(doc, /absent shared video-meta DOM rerun authority/);
  assert.match(doc, /`jsonFirstVideoMetaDomRerunContract`, `jsonFirstVideoMetaDomTouchReport`, `jsonFirstVideoMetaFetchBudget`, `jsonFirstVideoMetaMessageEffectReport`, `jsonFirstVideoMetaMapPersistencePolicy`, `jsonFirstVideoMetaDomRerunTimerRegistry`, `jsonFirstVideoMetaFixtureProvenance`, `jsonFirstVideoMetaMetricArtifact`, `jsonFirstVideoMetaCategoryFetchPolicy`, or `jsonFirstVideoMetaBackgroundFlushAuthority`/);
});

test('objective coverage ledger records JSON-first video meta background storage as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first video meta background storage addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_BACKGROUND_STORAGE_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-background-storage-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /category\/date\/duration metadata, lifecycle\/timer/);
  assert.match(doc, /background storage flush, compiled-cache, storage\/cache/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /content-side video-meta rerun proof into background storage proof/);
  assert.match(doc, /1 video-meta background storage source file/);
  assert.match(doc, /8 source\/effect blocks/);
  assert.match(doc, /19 videoMetaMap declaration block lines/);
  assert.match(doc, /655 declaration block bytes/);
  assert.match(doc, /19 ensureVideoMetaMapCache block lines/);
  assert.match(doc, /15 ensure videoMetaMap tokens/);
  assert.match(doc, /1 ensure storageGet callsite/);
  assert.match(doc, /13 enforceVideoMetaMapCap block lines/);
  assert.match(doc, /2000 maximum videoMetaMap entries/);
  assert.match(doc, /500 eviction count/);
  assert.match(doc, /21 flushVideoMetaMapUpdates block lines/);
  assert.match(doc, /3 flush pending tokens/);
  assert.match(doc, /1 flush storage set callsite/);
  assert.match(doc, /7 scheduleVideoMetaMapFlush block lines/);
  assert.match(doc, /1 schedule setTimeout callsite/);
  assert.match(doc, /75 ms background flush debounce/);
  assert.match(doc, /41 enqueueVideoMetaMapUpdate block lines/);
  assert.match(doc, /11 enqueue videoMetaMap tokens/);
  assert.match(doc, /6 enqueue compiledSettingsCache tokens/);
  assert.match(doc, /16 updateVideoMetaMap branch lines/);
  assert.match(doc, /1 branch enqueue callsite/);
  assert.match(doc, /15 compiler pass-through block lines/);
  assert.match(doc, /40 background videoMetaMap tokens/);
  assert.match(doc, /5 pendingVideoMetaMapUpdates tokens/);
  assert.match(doc, /4 videoMetaMapFlushTimer tokens/);
  assert.match(doc, /38 compiledSettingsCache tokens/);
  assert.match(doc, /5 runtime background video-meta storage fixtures/);
  assert.match(doc, /cache-load once behavior/);
  assert.match(doc, /storage-error empty-cache recovery/);
  assert.match(doc, /cleaned-row enqueue behavior/);
  assert.match(doc, /loaded-cache and compiled-cache patching/);
  assert.match(doc, /one-pending-timer scheduling/);
  assert.match(doc, /cap-enforced flush behavior/);
  assert.match(doc, /array-form category preservation/);
  assert.match(doc, /legacy single-video category omission/);
  assert.match(doc, /absent shared video-meta background storage authority/);
  assert.match(doc, /`jsonFirstVideoMetaBackgroundStorageContract`, `jsonFirstVideoMetaBackgroundFlushReport`, `jsonFirstVideoMetaCompiledCachePatchReport`, `jsonFirstVideoMetaBackgroundMessageSchema`, `jsonFirstVideoMetaBackgroundRevisionPolicy`, `jsonFirstVideoMetaEvictionPolicyReport`, `jsonFirstVideoMetaStorageErrorReport`, `jsonFirstVideoMetaBackgroundFixtureProvenance`, `jsonFirstVideoMetaBackgroundMetricArtifact`, or `jsonFirstVideoMetaBackgroundContentRerunParity`/);
});

test('objective coverage ledger records JSON-first video meta category parity as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first video meta category parity addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_CATEGORY_PARITY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-category-parity-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /category metadata, lifecycle\/timer, filter-logic, DOM fallback/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /video-meta storage proof into category decision parity proof/);
  assert.match(doc, /3 video-meta category parity source files/);
  assert.match(doc, /57 filter_logic category method block lines/);
  assert.match(doc, /2683 filter_logic category method block bytes/);
  assert.match(doc, /3 filter_logic category method videoMetaMap tokens/);
  assert.match(doc, /2 filter_logic scheduleVideoMetaFetch tokens/);
  assert.match(doc, /19 filter_logic category renderer allowlist entries/);
  assert.match(doc, /39 DOM fallback category block lines/);
  assert.match(doc, /2136 DOM fallback category block bytes/);
  assert.match(doc, /75 DOM fallback pending metadata block lines/);
  assert.match(doc, /4103 DOM fallback pending metadata block bytes/);
  assert.match(doc, /2 DOM fallback pending metadata setTimeout callsites/);
  assert.match(doc, /94 content_bridge scheduleVideoMetaFetch function lines/);
  assert.match(doc, /3689 content_bridge scheduleVideoMetaFetch function bytes/);
  assert.match(doc, /4 runtime video-meta category parity fixtures/);
  assert.match(doc, /JSON engine block\/allow decisions/);
  assert.match(doc, /JSON missing-category fetch scheduling with no hide decision/);
  assert.match(doc, /DOM fallback present-category parity/);
  assert.match(doc, /DOM fallback pending category state for allow mode or home\/search routes/);
  assert.match(doc, /pending-category timestamp and 8120 ms recheck behavior/);
  assert.match(doc, /category hidden-marker write conditions/);
  assert.match(doc, /absent shared video-meta category parity authority/);
  assert.match(doc, /`jsonFirstVideoMetaCategoryParityContract`, `jsonFirstVideoMetaJsonDomCategoryDecisionReport`, `jsonFirstVideoMetaCategoryPendingPolicy`, `jsonFirstVideoMetaCategoryMarkerReport`, `jsonFirstVideoMetaCategoryFetchPolicy`, `jsonFirstVideoMetaCategoryNoWorkBudget`, `jsonFirstVideoMetaCategoryFixtureProvenance`, `jsonFirstVideoMetaCategoryMetricArtifact`, `jsonFirstVideoMetaCategoryAllowBlockParity`, or `jsonFirstVideoMetaCategoryRevisionPolicy`/);
});

test('objective coverage ledger records quick-block/block-menu affordance boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Quick-block\/block-menu affordance boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_QUICK_BLOCK_BLOCK_MENU_AFFORDANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/quick-block-block-menu-affordance-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /quick-block affordance, 3-dot menu affordance, fallback menu action/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /7 quick-block\/block-menu affordance boundary source files/);
  assert.match(doc, /16 quick-block\/block-menu affordance source\/effect blocks/);
  assert.match(doc, /10 catalog feed affordance controls block lines/);
  assert.match(doc, /488 catalog feed affordance controls block bytes/);
  assert.match(doc, /2 settings_shared affordance compile block lines/);
  assert.match(doc, /126 settings_shared affordance compile block bytes/);
  assert.match(doc, /44 content bridge storage refresh keys block lines/);
  assert.match(doc, /1263 content bridge storage refresh keys block bytes/);
  assert.match(doc, /33 state manager valid setting keys block lines/);
  assert.match(doc, /1063 state manager valid setting keys block bytes/);
  assert.match(doc, /44 quick block card selectors block lines/);
  assert.match(doc, /1519 quick block card selectors block bytes/);
  assert.match(doc, /209 quick block setup lifecycle block lines/);
  assert.match(doc, /8699 quick block setup lifecycle block bytes/);
  assert.match(doc, /14 normal menu injection gate block lines/);
  assert.match(doc, /411 normal menu injection gate block bytes/);
  assert.match(doc, /31 fallback menu button creation block lines/);
  assert.match(doc, /1533 fallback menu button creation block bytes/);
  assert.match(doc, /127 fallback menu scan lifecycle block lines/);
  assert.match(doc, /4115 fallback menu scan lifecycle block bytes/);
  assert.match(doc, /212 fallback perform block action block lines/);
  assert.match(doc, /9930 fallback perform block action block bytes/);
  assert.match(doc, /1 content_controls_catalog total showQuickBlockButton token/);
  assert.match(doc, /1 content_controls_catalog total showBlockMenuItem token/);
  assert.match(doc, /23 settings_shared total showQuickBlockButton tokens/);
  assert.match(doc, /23 settings_shared total showBlockMenuItem tokens/);
  assert.match(doc, /1 block_channel total showQuickBlockButton token/);
  assert.match(doc, /0 block_channel total showBlockMenuItem tokens/);
  assert.match(doc, /0 content_bridge total showQuickBlockButton tokens/);
  assert.match(doc, /1 content_bridge total showBlockMenuItem token/);
  assert.match(doc, /quick-block lifecycle overwork/);
  assert.match(doc, /fallback menu gate drift/);
  assert.match(doc, /fallback row hide\/mutation\/rerun effects/);
  assert.match(doc, /`contentAffordanceControlsContract`, `quickBlockMenuAffordanceDecisionReport`, `quickBlockLifecycleBudget`, `blockMenuActionGateReport`, `fallbackMenuActionGateParityReport`, `affordanceSettingsCacheInvalidationReport`, `quickBlockDomSelectorInventoryPolicy`, `fallbackMenuFalseHideRestoreReport`, `affordanceRoutePausePolicy`, `affordanceFixtureProvenance`, or `affordanceMetricArtifact`/);
});

test('objective coverage ledger records quick-block default migration boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Quick-block default migration boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_QUICK_BLOCK_DEFAULT_MIGRATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/quick-block-default-migration-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /settings-mode, install\/update mutation, storage\/cache, quick-block affordance/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /default-on affordance proof into executed migration proof/);
  assert.match(doc, /1 quick-block default migration boundary source file/);
  assert.match(doc, /7 quick-block default migration source\/effect blocks/);
  assert.match(doc, /7 quick-block migration constants block lines/);
  assert.match(doc, /379 constants bytes/);
  assert.match(doc, /18 compareSemver block lines/);
  assert.match(doc, /513 compareSemver bytes/);
  assert.match(doc, /4 isVersionAtLeast block lines/);
  assert.match(doc, /98 isVersionAtLeast bytes/);
  assert.match(doc, /53 applyQuickBlockDefaultMigrationOnce block lines/);
  assert.match(doc, /2485 migration block bytes/);
  assert.match(doc, /93 onInstalled handler block lines/);
  assert.match(doc, /4239 onInstalled handler bytes/);
  assert.match(doc, /47 install branch block lines/);
  assert.match(doc, /2072 install branch bytes/);
  assert.match(doc, /41 update branch block lines/);
  assert.match(doc, /2010 update branch bytes/);
  assert.match(doc, /3 migration showQuickBlockButton tokens/);
  assert.match(doc, /4 migration-key tokens/);
  assert.match(doc, /1 migration storage\.local\.get callsite/);
  assert.match(doc, /2 migration storage\.local\.set callsites/);
  assert.match(doc, /6 runtime quick-block default migration fixtures/);
  assert.match(doc, /already-applied skip/);
  assert.match(doc, /current-version-below-target skip/);
  assert.match(doc, /previous-version-at-target skip/);
  assert.match(doc, /pre-target update root\/profile writes/);
  assert.match(doc, /install root default write before migration call/);
  assert.match(doc, /update migration call with `details\.previousVersion \|\| ''`/);
  assert.match(doc, /`quickBlockDefaultMigrationContract`, `quickBlockDefaultMigrationReport`, `quickBlockDefaultProfileMutationReport`, `quickBlockDefaultInstallUpdateGate`, `quickBlockDefaultRootProfilePrecedencePolicy`, `quickBlockDefaultMarkerVersionReport`, `quickBlockDefaultFailureRollbackReport`, `quickBlockDefaultStorageRevision`, `quickBlockDefaultFixtureProvenance`, or `quickBlockDefaultMetricArtifact`/);
});

test('objective coverage ledger records keyword-comments scope migration boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Keyword-comments scope migration boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_KEYWORD_COMMENTS_SCOPE_MIGRATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/keyword-comments-scope-migration-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /settings-mode, install\/update mutation, storage\/cache, keyword\/comment scope/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /keyword-match and comments proof into executed migration proof/);
  assert.match(doc, /1 keyword-comments scope migration boundary source file/);
  assert.match(doc, /5 keyword-comments scope migration source\/effect blocks/);
  assert.match(doc, /7 keyword-comments migration constants block lines/);
  assert.match(doc, /379 constants bytes/);
  assert.match(doc, /87 applyKeywordCommentsScopeMigrationOnce block lines/);
  assert.match(doc, /4395 migration block bytes/);
  assert.match(doc, /93 onInstalled handler block lines/);
  assert.match(doc, /4239 onInstalled handler bytes/);
  assert.match(doc, /47 install branch block lines/);
  assert.match(doc, /2072 install branch bytes/);
  assert.match(doc, /41 update branch block lines/);
  assert.match(doc, /2010 update branch bytes/);
  assert.match(doc, /4 marker tokens/);
  assert.match(doc, /6 filterComments tokens/);
  assert.match(doc, /2 hideAllComments tokens/);
  assert.match(doc, /4 uiKeywords tokens/);
  assert.match(doc, /4 filterChannels tokens/);
  assert.match(doc, /10 comments tokens/);
  assert.match(doc, /1 filterAllComments token/);
  assert.match(doc, /1 migration storage\.local\.get callsite/);
  assert.match(doc, /2 migration storage\.local\.set callsites/);
  assert.match(doc, /7 runtime keyword-comments scope migration fixtures/);
  assert.match(doc, /disabled-comments root row clearing/);
  assert.match(doc, /comments-enabled root row preservation plus root filterComments clearing/);
  assert.match(doc, /V4 profile settings filterComments deletion/);
  assert.match(doc, /V4 main row migration/);
  assert.match(doc, /alias-row preservation outside the local migration target/);
  assert.match(doc, /catch-path marker\/filterComments write/);
  assert.match(doc, /install\/update migration call sequencing/);
  assert.match(doc, /`keywordCommentsScopeMigrationContract`, `keywordCommentsScopeMigrationReport`, `keywordCommentsScopeRowMutationReport`, `keywordCommentsScopeRootProfileDecision`, `keywordCommentsScopeListModeParityReport`, `keywordCommentsScopeAliasRowPolicy`, `keywordCommentsScopeKidsRowPolicy`, `keywordCommentsScopeInstallUpdateSequence`, `keywordCommentsScopeFailureRollbackReport`, `keywordCommentsScopeStorageRevision`, `keywordCommentsScopeFixtureProvenance`, or `keywordCommentsScopeMetricArtifact`/);
});

test('objective coverage ledger records Kids comments Filter All boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Kids comments Filter All boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_KIDS_COMMENTS_FILTER_ALL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/kids-comments-filter-all-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /settings-mode, Kids row-action, keyword\/comment scope/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /executed Kids comments proof/);
  assert.match(doc, /5 Kids comments Filter All boundary source files/);
  assert.match(doc, /8 Kids comments Filter All source\/effect blocks/);
  assert.match(doc, /33 StateManager toggleKidsKeywordComments block lines/);
  assert.match(doc, /35 StateManager toggleKidsChannelFilterAll block lines/);
  assert.match(doc, /64 RenderEngine keyword comments gate block lines/);
  assert.match(doc, /44 RenderEngine channel Filter All toggle block lines/);
  assert.match(doc, /47 background Kids compile block lines/);
  assert.match(doc, /27 background compiled channel object block lines/);
  assert.match(doc, /72 settings_shared syncFilterAllKeywords block lines/);
  assert.match(doc, /34 filter_logic comment decision block lines/);
  assert.match(doc, /1 toggleKidsKeywordComments token/);
  assert.match(doc, /2 toggleKidsChannelFilterAll tokens/);
  assert.match(doc, /6 filterAllComments tokens/);
  assert.match(doc, /3 filterKeywordsComments tokens/);
  assert.match(doc, /2 additionalKeywordsFromChannels tokens/);
  assert.match(doc, /3 mergeWithChannels tokens/);
  assert.match(doc, /7 runtime Kids comments Filter All fixtures/);
  assert.match(doc, /Kids blocklist keyword comments API mutation/);
  assert.match(doc, /Kids whitelist keyword comments API mutation/);
  assert.match(doc, /Kids channel Filter All `filterAll` mutation with `filterAllComments` preservation/);
  assert.match(doc, /Kids whitelist write-silent Filter All/);
  assert.match(doc, /RenderEngine Kids comments toggle suppression/);
  assert.match(doc, /background Kids compile channel-derived comment merge/);
  assert.match(doc, /filter_logic comment keyword consumption without provenance/);
  assert.match(doc, /`kidsCommentsFilterAllContract`, `kidsCommentsRowActionParityReport`, `kidsChannelCommentsScopePolicy`, `kidsCommentsCompilerParityReport`, `kidsCommentsListModeEffectReport`, `kidsCommentsManagedChildSurfaceReport`, `kidsCommentsKeywordProvenanceReport`, `kidsCommentsFixtureProvenance`, `kidsCommentsMetricArtifact`, `kidsCommentsMutationRefreshReport`, or `kidsCommentsFilterAllAuthorityGate`/);
});

test('objective coverage ledger records JSON-first video meta fetch policy as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first video meta fetch policy addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_FETCH_POLICY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-fetch-policy-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /category\/date\/duration metadata, network fetch, lifecycle\/timer/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /category parity proof into metadata fetch policy proof/);
  assert.match(doc, /3 video-meta fetch policy source files/);
  assert.match(doc, /76 content_bridge scheduleVideoMetaFetch body lines/);
  assert.match(doc, /2960 schedule body bytes/);
  assert.match(doc, /8 schedule needDuration tokens/);
  assert.match(doc, /8 schedule needDates tokens/);
  assert.match(doc, /8 schedule needCategory tokens/);
  assert.match(doc, /17 processWatchMetaFetchQueue body lines/);
  assert.match(doc, /727 queue body bytes/);
  assert.match(doc, /98 fetchVideoMetaFromWatchUrl body lines/);
  assert.match(doc, /3382 fetch body bytes/);
  assert.match(doc, /3 watch meta fetch concurrency limit/);
  assert.match(doc, /60000 ms cooldown/);
  assert.match(doc, /3000 attempt-map cap/);
  assert.match(doc, /800 attempt-map trim count/);
  assert.match(doc, /1 DOM fallback category fetch callsite/);
  assert.match(doc, /1 DOM fallback upload-date fetch callsite/);
  assert.match(doc, /1 DOM fallback explicit duration fetch callsite/);
  assert.match(doc, /1 DOM fallback default duration fetch callsite/);
  assert.match(doc, /4 runtime video-meta fetch policy fixtures/);
  assert.match(doc, /JSON category, DOM category, DOM upload-date, DOM explicit duration, and DOM default duration callsite matrix/);
  assert.match(doc, /satisfied-metadata no-fetch behavior/);
  assert.match(doc, /duplicate same-video suppression/);
  assert.match(doc, /default duration-request behavior/);
  assert.match(doc, /three-active-fetch concurrency behavior/);
  assert.match(doc, /Kids host early return/);
  assert.match(doc, /YouTube watch HTML same-origin fetch behavior/);
  assert.match(doc, /parsed metadata persistence/);
  assert.match(doc, /DOM rerun after touch/);
  assert.match(doc, /absent shared video-meta fetch policy authority/);
  assert.match(doc, /`jsonFirstVideoMetaFetchPolicyContract`, `jsonFirstVideoMetaFetchReasonMatrix`, `jsonFirstVideoMetaFetchBudgetReport`, `jsonFirstVideoMetaFetchCallsiteAuthority`, `jsonFirstVideoMetaFetchNeedFlagReport`, `jsonFirstVideoMetaFetchConcurrencyPolicy`, `jsonFirstVideoMetaFetchKidsPolicy`, `jsonFirstVideoMetaFetchMetricArtifact`, `jsonFirstVideoMetaFetchRevisionPolicy`, or `jsonFirstVideoMetaFetchNoWorkBudget`/);
});

test('objective coverage ledger records JSON-first video meta content parity as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first video meta content parity addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_CONTENT_PARITY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-content-parity-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /duration\/upload-date metadata, network fetch, lifecycle\/timer/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /fetch policy proof into JSON\/DOM content decision parity proof/);
  assert.match(doc, /3 video-meta content parity source files/);
  assert.match(doc, /234 filter_logic extract duration block lines/);
  assert.match(doc, /11823 extract duration block bytes/);
  assert.match(doc, /126 extract published time block lines/);
  assert.match(doc, /6495 extract published time block bytes/);
  assert.match(doc, /155 check content filters block lines/);
  assert.match(doc, /7739 check content filters block bytes/);
  assert.match(doc, /19 content renderer allowlist entries/);
  assert.match(doc, /170 DOM fallback upload-date block lines/);
  assert.match(doc, /9701 DOM upload-date block bytes/);
  assert.match(doc, /2 DOM upload-date scheduleVideoMetaFetch tokens/);
  assert.match(doc, /11 DOM upload-date parseDateMs tokens/);
  assert.match(doc, /71 DOM fallback duration block lines/);
  assert.match(doc, /4480 DOM duration block bytes/);
  assert.match(doc, /4 DOM duration scheduleVideoMetaFetch tokens/);
  assert.match(doc, /75 DOM pending metadata block lines/);
  assert.match(doc, /4091 DOM pending metadata block bytes/);
  assert.match(doc, /6 DOM pending upload-date attribute tokens/);
  assert.match(doc, /5 runtime video-meta content parity fixtures/);
  assert.match(doc, /JSON duration block\/allow behavior from `videoMetaMap\.lengthSeconds`/);
  assert.match(doc, /JSON upload-date behavior from `videoMetaMap\.uploadDate`/);
  assert.match(doc, /blank-cutoff no-op behavior/);
  assert.match(doc, /DOM upload-date metadata\/fetch\/pending behavior/);
  assert.match(doc, /DOM duration cache-marker and fetch behavior/);
  assert.match(doc, /pending upload-date timestamp and 8120 ms recheck behavior/);
  assert.match(doc, /stale pending-marker cleanup/);
  assert.match(doc, /absent shared video-meta content parity authority/);
  assert.match(doc, /`jsonFirstVideoMetaContentParityContract`, `jsonFirstVideoMetaDurationDecisionReport`, `jsonFirstVideoMetaUploadDateDecisionReport`, `jsonFirstVideoMetaJsonDomContentDecisionReport`, `jsonFirstVideoMetaUploadDatePendingPolicy`, `jsonFirstVideoMetaDurationCachePolicy`, `jsonFirstVideoMetaContentNoWorkBudget`, `jsonFirstVideoMetaContentFixtureProvenance`, `jsonFirstVideoMetaContentMetricArtifact`, or `jsonFirstVideoMetaContentRevisionPolicy`/);
});

test('objective coverage ledger records JSON-first video meta no-work budget as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first video meta no-work budget addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-no-work-budget-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /duration\/upload-date\/category metadata, network fetch, lifecycle\/timer/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /content parity proof into metadata work-budget proof/);
  assert.match(doc, /3 video-meta no-work budget source files/);
  assert.match(doc, /76 content_bridge scheduleVideoMetaFetch body lines/);
  assert.match(doc, /2960 schedule body bytes/);
  assert.match(doc, /1 schedule Date\.now callsite/);
  assert.match(doc, /1 last-attempt get callsite/);
  assert.match(doc, /1 last-attempt set callsite/);
  assert.match(doc, /1 pending has callsite/);
  assert.match(doc, /1 queued has callsite/);
  assert.match(doc, /1 queue push callsite/);
  assert.match(doc, /1 process queue callsite/);
  assert.match(doc, /8 needDuration tokens/);
  assert.match(doc, /8 needDates tokens/);
  assert.match(doc, /8 needCategory tokens/);
  assert.match(doc, /17 processWatchMetaFetchQueue body lines/);
  assert.match(doc, /727 queue body bytes/);
  assert.match(doc, /0 queue-to-fetch option forwarding callsites/);
  assert.match(doc, /1 queue-to-fetch video-id-only callsite/);
  assert.match(doc, /98 fetchVideoMetaFromWatchUrl body lines/);
  assert.match(doc, /3382 fetch body bytes/);
  assert.match(doc, /170 DOM fallback upload-date block lines/);
  assert.match(doc, /9701 DOM upload-date block bytes/);
  assert.match(doc, /1 DOM upload-date Date\.now callsite/);
  assert.match(doc, /1 DOM upload-date fetch schedule callsite/);
  assert.match(doc, /1 didScheduleMetaFetch token/);
  assert.match(doc, /2 needsTimestamp tokens/);
  assert.match(doc, /71 DOM fallback duration block lines/);
  assert.match(doc, /4480 DOM duration block bytes/);
  assert.match(doc, /1 explicit duration fetch callsite/);
  assert.match(doc, /1 default duration fetch callsite/);
  assert.match(doc, /57 filter_logic category method block lines/);
  assert.match(doc, /2683 filter_logic category method block bytes/);
  assert.match(doc, /1 selected-empty guard callsite/);
  assert.match(doc, /5 runtime video-meta no-work budget fixtures/);
  assert.match(doc, /invalid-id, satisfied-metadata, and all-false need-flag no-work behavior/);
  assert.match(doc, /default duration scheduling/);
  assert.match(doc, /queue video-id-only execution with no need-flag forwarding/);
  assert.match(doc, /duplicate pending cooldown refresh behavior/);
  assert.match(doc, /blank-cutoff upload-date fetch admission/);
  assert.match(doc, /mix-like no-options duration fetch admission/);
  assert.match(doc, /absent shared video-meta no-work authority/);
  assert.match(doc, /`jsonFirstVideoMetaNoWorkBudgetContract`, `jsonFirstVideoMetaSchedulerSkipReport`, `jsonFirstVideoMetaSchedulerNeedReasonReport`, `jsonFirstVideoMetaSchedulerCooldownPolicy`, `jsonFirstVideoMetaQueueReasonRetentionPolicy`, `jsonFirstVideoMetaDuplicatePendingRetryPolicy`, `jsonFirstVideoMetaUploadDateCutoffWorkGate`, `jsonFirstVideoMetaDefaultDurationFetchPolicy`, `jsonFirstVideoMetaNoWorkMetricArtifact`, or `jsonFirstVideoMetaNoWorkRevisionPolicy`/);
});

test('objective coverage ledger records JSON-first video meta revision boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first video meta revision boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_REVISION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-revision-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /message\/effect, network fetch, storage\/cache, compiled-cache/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /no-work budget proof into metadata revision-boundary proof/);
  assert.match(doc, /3 video-meta revision boundary source files/);
  assert.match(doc, /62 content_bridge persistVideoMetaMapping block lines/);
  assert.match(doc, /2792 persist block bytes/);
  assert.match(doc, /10 persist videoMetaMap tokens/);
  assert.match(doc, /12 persist currentSettings tokens/);
  assert.match(doc, /1 persist sendMessage callsite/);
  assert.match(doc, /0 persist revision tokens/);
  assert.match(doc, /5 content_bridge FilterTube_UpdateVideoMetaMap branch lines/);
  assert.match(doc, /300 branch bytes/);
  assert.match(doc, /41 background enqueueVideoMetaMapUpdate block lines/);
  assert.match(doc, /1654 enqueue bytes/);
  assert.match(doc, /11 enqueue videoMetaMap tokens/);
  assert.match(doc, /6 enqueue compiledSettingsCache tokens/);
  assert.match(doc, /0 enqueue revision tokens/);
  assert.match(doc, /16 background updateVideoMetaMap receiver branch lines/);
  assert.match(doc, /596 receiver branch bytes/);
  assert.match(doc, /15 background compiler videoMetaMap pass-through block lines/);
  assert.match(doc, /912 compiler pass-through bytes/);
  assert.match(doc, /57 filter_logic queueVideoMetaMapping block lines/);
  assert.match(doc, /2359 queue block bytes/);
  assert.match(doc, /5 seenVideoMetaUpdates tokens/);
  assert.match(doc, /4 pendingVideoMetaUpdates tokens/);
  assert.match(doc, /1 queue postMessage callsite/);
  assert.match(doc, /0 queue revision tokens/);
  assert.match(doc, /3 filter_logic processed videoMetaMap pass-through lines/);
  assert.match(doc, /240 processed pass-through bytes/);
  assert.match(doc, /4 runtime video-meta revision boundary fixtures/);
  assert.match(doc, /content persistence mutates disabled currentSettings and strips revision\/provenance fields/);
  assert.match(doc, /filter logic queueing dedupes across revision-only changes/);
  assert.match(doc, /background update patches both main and kids compiled caches with one unpartitioned metadata map/);
  assert.match(doc, /consumers pass videoMetaMap by reference/);
  assert.match(doc, /absent shared video-meta revision boundary authority/);
  assert.match(doc, /`jsonFirstVideoMetaRevisionBoundaryContract`, `jsonFirstVideoMetaRevisionReport`, `jsonFirstVideoMetaSettingsRevisionPolicy`, `jsonFirstVideoMetaProfileScopePolicy`, `jsonFirstVideoMetaSourceProvenanceReport`, `jsonFirstVideoMetaMessageRevisionGate`, `jsonFirstVideoMetaBackgroundRevisionGate`, `jsonFirstVideoMetaConsumerRevisionDecision`, `jsonFirstVideoMetaRevisionFixtureProvenance`, or `jsonFirstVideoMetaRevisionMetricArtifact`/);
});

test('objective coverage ledger records JSON-first video meta profile surface boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first video meta profile\/surface boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_PROFILE_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-profile-surface-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /host\/Kids, list-mode/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /metadata revision-boundary proof into profile\/surface boundary proof/);
  assert.match(doc, /4 video-meta profile\/surface boundary source files/);
  assert.match(doc, /62 content_bridge persistVideoMetaMapping block lines/);
  assert.match(doc, /2792 persist block bytes/);
  assert.match(doc, /0 persist profile tokens/);
  assert.match(doc, /0 persist listMode tokens/);
  assert.match(doc, /76 scheduleVideoMetaFetch block lines/);
  assert.match(doc, /2960 schedule block bytes/);
  assert.match(doc, /0 schedule profile tokens/);
  assert.match(doc, /0 schedule listMode tokens/);
  assert.match(doc, /98 fetchVideoMetaFromWatchUrl block lines/);
  assert.match(doc, /3382 fetch block bytes/);
  assert.match(doc, /1 fetch hostname token/);
  assert.match(doc, /1 fetch youtubekids token/);
  assert.match(doc, /27 FilterTube_UpdateVideoMetaMap branch lines/);
  assert.match(doc, /1030 receiver branch bytes/);
  assert.match(doc, /24 background getCompiledSettings receiver branch lines/);
  assert.match(doc, /1469 receiver branch bytes/);
  assert.match(doc, /7 receiver profileType tokens/);
  assert.match(doc, /15 background compiler videoMetaMap pass-through block lines/);
  assert.match(doc, /912 compiler pass-through bytes/);
  assert.match(doc, /41 background enqueueVideoMetaMapUpdate block lines/);
  assert.match(doc, /1654 enqueue bytes/);
  assert.match(doc, /3 filter_logic processed videoMetaMap pass-through lines/);
  assert.match(doc, /252 processed pass-through bytes/);
  assert.match(doc, /28 filter_logic _registerVideoMetaMapping block lines/);
  assert.match(doc, /1217 register block bytes/);
  assert.match(doc, /57 _checkCategoryFilters block lines/);
  assert.match(doc, /2683 category block bytes/);
  assert.match(doc, /39 DOM category videoMetaMap block lines/);
  assert.match(doc, /2136 DOM category bytes/);
  assert.match(doc, /170 DOM upload-date videoMetaMap block lines/);
  assert.match(doc, /9701 DOM upload-date bytes/);
  assert.match(doc, /71 DOM duration videoMetaMap block lines/);
  assert.match(doc, /4492 DOM duration bytes/);
  assert.match(doc, /5 runtime video-meta profile\/surface fixtures/);
  assert.match(doc, /global per-video metadata behavior/);
  assert.match(doc, /Kids-host scheduler admission before fetch-host rejection/);
  assert.match(doc, /unpartitioned Main\/Kids compiled-cache patching/);
  assert.match(doc, /filter-logic consumption without a profile-scoped metadata view/);
  assert.match(doc, /DOM route-local category decisions from global metadata/);
  assert.match(doc, /absent shared video-meta profile\/surface authority/);
  assert.match(doc, /`jsonFirstVideoMetaProfileSurfaceContract`, `jsonFirstVideoMetaProfileScopeReport`, `jsonFirstVideoMetaSurfacePermissionReport`, `jsonFirstVideoMetaKidsPolicy`, `jsonFirstVideoMetaListModePolicy`, `jsonFirstVideoMetaSettingsGate`, `jsonFirstVideoMetaConsumerPermissionDecision`, `jsonFirstVideoMetaFetchSurfaceBudget`, `jsonFirstVideoMetaProfileFixtureProvenance`, or `jsonFirstVideoMetaProfileMetricArtifact`/);
});

test('objective coverage ledger records JSON-first video meta freshness eviction boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first video meta freshness\/eviction boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_FRESHNESS_EVICTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-freshness-eviction-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /storage\/cache, compiled-cache, filter-logic, freshness\/eviction/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /profile\/surface proof into freshness\/eviction proof/);
  assert.match(doc, /3 video-meta freshness\/eviction boundary source files/);
  assert.match(doc, /10 freshness\/eviction source\/effect blocks/);
  assert.match(doc, /62 content_bridge persistVideoMetaMapping block lines/);
  assert.match(doc, /2792 persist block bytes/);
  assert.match(doc, /0 persist Date\.now callsites/);
  assert.match(doc, /0 persist fetchedAt tokens/);
  assert.match(doc, /0 persist updatedAt tokens/);
  assert.match(doc, /0 persist expiresAt tokens/);
  assert.match(doc, /1 persist Object\.keys callsite/);
  assert.match(doc, /1 persist eviction slice callsite/);
  assert.match(doc, /76 scheduleVideoMetaFetch block lines/);
  assert.match(doc, /2960 schedule block bytes/);
  assert.match(doc, /1 schedule Date\.now callsite/);
  assert.match(doc, /5 schedule lastWatchMetaFetchAttempt tokens/);
  assert.match(doc, /17 processWatchMetaFetchQueue block lines/);
  assert.match(doc, /727 queue block bytes/);
  assert.match(doc, /19 background ensureVideoMetaMapCache block lines/);
  assert.match(doc, /685 ensure block bytes/);
  assert.match(doc, /13 background enforceVideoMetaMapCap block lines/);
  assert.match(doc, /376 enforce block bytes/);
  assert.match(doc, /1 enforce Object\.keys callsite/);
  assert.match(doc, /1 enforce eviction slice callsite/);
  assert.match(doc, /21 background flushVideoMetaMapUpdates block lines/);
  assert.match(doc, /797 flush block bytes/);
  assert.match(doc, /41 background enqueueVideoMetaMapUpdate block lines/);
  assert.match(doc, /1654 enqueue block bytes/);
  assert.match(doc, /0 enqueue fetchedAt tokens/);
  assert.match(doc, /0 enqueue updatedAt tokens/);
  assert.match(doc, /0 enqueue expiresAt tokens/);
  assert.match(doc, /57 filter_logic queueVideoMetaMapping block lines/);
  assert.match(doc, /2359 queue block bytes/);
  assert.match(doc, /1 filter queue Date\.now callsite/);
  assert.match(doc, /5 seenVideoMetaUpdates tokens/);
  assert.match(doc, /28 filter_logic _registerVideoMetaMapping block lines/);
  assert.match(doc, /1217 register block bytes/);
  assert.match(doc, /3 filter_logic processed videoMetaMap pass-through lines/);
  assert.match(doc, /252 processed pass-through bytes/);
  assert.match(doc, /60000 ms watch fetch cooldown/);
  assert.match(doc, /3000 attempt-map cap/);
  assert.match(doc, /800 attempt-map trim count/);
  assert.match(doc, /2000 videoMetaMap maximum entries/);
  assert.match(doc, /500 videoMetaMap eviction count/);
  assert.match(doc, /5 runtime video-meta freshness\/eviction fixtures/);
  assert.match(doc, /content persistence row cleanup and first-key cap eviction/);
  assert.match(doc, /stale parseable scheduler no-fetch behavior/);
  assert.match(doc, /background stale load\/flush retention with cleaned new writes/);
  assert.match(doc, /background first-key eviction independent of fetchedAt recency/);
  assert.match(doc, /filter logic freshness-only dedupe and no freshness payload/);
  assert.match(doc, /absent shared video-meta freshness\/eviction authority/);
  assert.match(doc, /`jsonFirstVideoMetaFreshnessEvictionContract`, `jsonFirstVideoMetaFreshnessReport`, `jsonFirstVideoMetaAgePolicy`, `jsonFirstVideoMetaRowProvenanceReport`, `jsonFirstVideoMetaFetchFreshnessGate`, `jsonFirstVideoMetaEvictionPolicyReport`, `jsonFirstVideoMetaAttemptCooldownReport`, `jsonFirstVideoMetaStaleRowFixtureProvenance`, `jsonFirstVideoMetaFreshnessMetricArtifact`, or `jsonFirstVideoMetaConsumerFreshnessDecision`/);
});

test('objective coverage ledger records JSON-first video meta merge schema boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first video meta merge\/schema boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_MERGE_SCHEMA_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-merge-schema-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /storage\/cache, compiled-cache, filter-logic, metadata schema, merge policy/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /freshness\/eviction proof into merge\/schema proof/);
  assert.match(doc, /3 video-meta merge\/schema boundary source files/);
  assert.match(doc, /8 merge\/schema source\/effect blocks/);
  assert.match(doc, /62 content_bridge persistVideoMetaMapping block lines/);
  assert.match(doc, /2792 persist block bytes/);
  assert.match(doc, /2 persist delete token occurrences/);
  assert.match(doc, /1 persist spread token occurrence/);
  assert.match(doc, /11 persist lengthSeconds tokens/);
  assert.match(doc, /8 persist category tokens/);
  assert.match(doc, /26 FilterTube_UpdateVideoMetaMap branch lines/);
  assert.match(doc, /1025 branch bytes/);
  assert.match(doc, /1 content update persist callsite/);
  assert.match(doc, /2 content update touch callsites/);
  assert.match(doc, /1 content update rerun callsite/);
  assert.match(doc, /16 background updateVideoMetaMap receiver branch lines/);
  assert.match(doc, /596 receiver branch bytes/);
  assert.match(doc, /4 receiver entries tokens/);
  assert.match(doc, /0 receiver category tokens/);
  assert.match(doc, /0 receiver request\.category tokens/);
  assert.match(doc, /41 background enqueueVideoMetaMapUpdate block lines/);
  assert.match(doc, /1654 enqueue block bytes/);
  assert.match(doc, /1 enqueue delete token occurrence/);
  assert.match(doc, /0 enqueue spread token occurrences/);
  assert.match(doc, /7 enqueue clean tokens/);
  assert.match(doc, /6 enqueue category tokens/);
  assert.match(doc, /21 background flushVideoMetaMapUpdates block lines/);
  assert.match(doc, /797 flush block bytes/);
  assert.match(doc, /15 background compiler videoMetaMap pass-through block lines/);
  assert.match(doc, /912 compiler block bytes/);
  assert.match(doc, /57 filter_logic queueVideoMetaMapping block lines/);
  assert.match(doc, /2359 queue block bytes/);
  assert.match(doc, /7 queue category tokens/);
  assert.match(doc, /28 filter_logic _registerVideoMetaMapping block lines/);
  assert.match(doc, /1217 register block bytes/);
  assert.match(doc, /2 register spread token occurrences/);
  assert.match(doc, /2 register same tokens/);
  assert.match(doc, /0 register category tokens/);
  assert.match(doc, /16 player video-meta harvest block lines/);
  assert.match(doc, /952 harvest block bytes/);
  assert.match(doc, /5 harvest category tokens/);
  assert.match(doc, /5 runtime video-meta merge\/schema fixtures/);
  assert.match(doc, /content\/background category-only partial replacement behavior/);
  assert.match(doc, /filter-logic category-only suppression when length\/date match/);
  assert.match(doc, /local merge with partial outbound queue payloads/);
  assert.match(doc, /legacy single-video category omission/);
  assert.match(doc, /absent shared video-meta merge\/schema authority/);
  assert.match(doc, /`jsonFirstVideoMetaMergeSchemaContract`, `jsonFirstVideoMetaRowCompletenessReport`, `jsonFirstVideoMetaPartialUpdatePolicy`, `jsonFirstVideoMetaCategoryMergeDecision`, `jsonFirstVideoMetaFieldLossReport`, `jsonFirstVideoMetaLegacyMessageSchema`, `jsonFirstVideoMetaStorageMergeReport`, `jsonFirstVideoMetaConsumerSchemaDecision`, `jsonFirstVideoMetaMergeFixtureProvenance`, or `jsonFirstVideoMetaMergeMetricArtifact`/);
});

test('objective coverage ledger records JSON-first renderer traversal mutation boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first renderer traversal\/mutation boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_RENDERER_TRAVERSAL_MUTATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-renderer-traversal-mutation-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /recursive traversal, renderer wrapper, array compaction, object omission/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /readiness\/no-work proof into renderer traversal\/mutation proof/);
  assert.match(doc, /2 renderer traversal\/mutation boundary source files/);
  assert.match(doc, /5 traversal\/mutation source\/effect blocks/);
  assert.match(doc, /40 filter_logic filter block lines/);
  assert.match(doc, /1448 filter block bytes/);
  assert.match(doc, /4 recursive filter call tokens/);
  assert.match(doc, /1 _shouldBlock callsite/);
  assert.match(doc, /1 Array\.isArray callsite/);
  assert.match(doc, /1 filtered\.push callsite/);
  assert.match(doc, /1 return filtered callsite/);
  assert.match(doc, /1 return null callsite/);
  assert.match(doc, /1 Object\.keys callsite/);
  assert.match(doc, /1 Object\.entries callsite/);
  assert.match(doc, /1 result\[key\] assignment/);
  assert.match(doc, /32 processData block lines/);
  assert.match(doc, /1232 processData block bytes/);
  assert.match(doc, /2 processData Date\.now callsites/);
  assert.match(doc, /1 processData filter callsite/);
  assert.match(doc, /23 global interface block lines/);
  assert.match(doc, /892 global interface block bytes/);
  assert.match(doc, /2 global interface processData tokens/);
  assert.match(doc, /2 global interface harvestOnly tokens/);
  assert.match(doc, /44 unwrapRendererForFiltering block lines/);
  assert.match(doc, /1907 unwrap block bytes/);
  assert.match(doc, /2 preferredNestedRenderers tokens/);
  assert.match(doc, /3 wrapperRendererType tokens/);
  assert.match(doc, /3 ViewModel tokens/);
  assert.match(doc, /301 _shouldBlock block lines/);
  assert.match(doc, /15380 _shouldBlock block bytes/);
  assert.match(doc, /11 _shouldBlock return true tokens/);
  assert.match(doc, /11 _shouldBlock return false tokens/);
  assert.match(doc, /20 _shouldBlock whitelist tokens/);
  assert.match(doc, /5 _shouldBlock filterKeywords tokens/);
  assert.match(doc, /4 _shouldBlock filterChannels tokens/);
  assert.match(doc, /1 _checkContentFilters callsite/);
  assert.match(doc, /1 _checkCategoryFilters callsite/);
  assert.match(doc, /1 _shouldBlock postMessage callsite/);
  assert.match(doc, /271 seed processWithEngine block lines/);
  assert.match(doc, /12681 seed processWithEngine block bytes/);
  assert.match(doc, /2 FilterTubeEngine\.processData tokens/);
  assert.match(doc, /4 harvestOnly tokens/);
  assert.match(doc, /4 JSON\.stringify tokens/);
  assert.match(doc, /5 runtime renderer traversal\/mutation fixtures/);
  assert.match(doc, /active no-match traversal container rebuilds/);
  assert.match(doc, /disabled original-reference return/);
  assert.match(doc, /blocked array compaction/);
  assert.match(doc, /nested object child omission/);
  assert.match(doc, /richItemRenderer preferred nested renderer blocking/);
  assert.match(doc, /absent shared renderer traversal\/mutation authority/);
  assert.match(doc, /`jsonFirstRendererTraversalContract`, `jsonFirstRendererMutationBudget`, `jsonFirstRecursiveFilterReport`, `jsonFirstArrayCompactionPolicy`, `jsonFirstObjectOmissionPolicy`, `jsonFirstRendererWrapperPolicy`, `jsonFirstRendererSiblingPolicy`, `jsonFirstFilterNoopIdentityPolicy`, `jsonFirstTraversalMetricArtifact`, or `jsonFirstRendererMutationFixtureProvenance`/);
});

test('objective coverage ledger records JSON-first block decision effect boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first block decision\/effect boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_BLOCK_DECISION_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-block-decision-effect-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /route exception, comment, channel-only, collaboration, decision-order/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /renderer traversal proof into block-decision\/effect proof/);
  assert.match(doc, /1 block decision\/effect boundary source file/);
  assert.match(doc, /9 block decision\/effect source\/effect blocks/);
  assert.match(doc, /301 _shouldBlock block lines/);
  assert.match(doc, /15380 _shouldBlock block bytes/);
  assert.match(doc, /17 collaboration cache block lines/);
  assert.match(doc, /786 collaboration cache block bytes/);
  assert.match(doc, /6 Shorts decision block lines/);
  assert.match(doc, /328 Shorts decision block bytes/);
  assert.match(doc, /15 route exception block lines/);
  assert.match(doc, /460 route exception block bytes/);
  assert.match(doc, /105 whitelist decision block lines/);
  assert.match(doc, /5392 whitelist decision block bytes/);
  assert.match(doc, /17 channel decision block lines/);
  assert.match(doc, /1090 channel decision block bytes/);
  assert.match(doc, /21 keyword decision block lines/);
  assert.match(doc, /1123 keyword decision block bytes/);
  assert.match(doc, /34 comment decision block lines/);
  assert.match(doc, /1947 comment decision block bytes/);
  assert.match(doc, /13 content\/category decision block lines/);
  assert.match(doc, /542 content\/category decision block bytes/);
  assert.match(doc, /11 _shouldBlock return true tokens/);
  assert.match(doc, /11 _shouldBlock return false tokens/);
  assert.match(doc, /6 _logWhitelistDecision tokens/);
  assert.match(doc, /4 _matchesAnyChannel tokens/);
  assert.match(doc, /6 _regexMatches tokens/);
  assert.match(doc, /1 postMessage token/);
  assert.match(doc, /1 hideAllShorts token/);
  assert.match(doc, /2 filterKeywordsComments tokens/);
  assert.match(doc, /1 _checkContentFilters token/);
  assert.match(doc, /1 _checkCategoryFilters token/);
  assert.match(doc, /2 document\.location tokens/);
  assert.match(doc, /6 runtime block decision\/effect fixtures/);
  assert.match(doc, /feed-channels route exception behavior/);
  assert.match(doc, /Shorts-before-route precedence/);
  assert.match(doc, /channel-only keyword skipping with channel-rule blocking/);
  assert.match(doc, /comment whitelist bypass plus keyword blocking/);
  assert.match(doc, /allowed collaboration cache side effects/);
  assert.match(doc, /blocked collaboration cache side effects/);
  assert.match(doc, /absent shared block-decision\/effect authority/);
  assert.match(doc, /`jsonFirstBlockDecisionContract`, `jsonFirstBlockDecisionEffectReport`, `jsonFirstDecisionOrderReport`, `jsonFirstDecisionSideEffectBudget`, `jsonFirstCollaborationEffectDecision`, `jsonFirstRouteExceptionDecision`, `jsonFirstCommentDecisionPolicy`, `jsonFirstChannelOnlyFieldPolicy`, `jsonFirstDecisionShortCircuitReport`, or `jsonFirstBlockDecisionFixtureProvenance`/);
});

test('objective coverage ledger records JSON-first candidate extraction boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first candidate extraction boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_CANDIDATE_EXTRACTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-candidate-extraction-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /candidate extraction, metadata search, video id, playlist id/);
  assert.match(doc, /collaboration, avatar-stack, showSheet/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /block-decision\/effect proof into candidate-extraction proof/);
  assert.match(doc, /1 candidate extraction boundary source file/);
  assert.match(doc, /11 candidate extraction source\/effect blocks/);
  assert.match(doc, /25 collect text block lines/);
  assert.match(doc, /1249 collect text block bytes/);
  assert.match(doc, /23 extract video id block lines/);
  assert.match(doc, /1033 extract video id block bytes/);
  assert.match(doc, /16 extract playlist id block lines/);
  assert.match(doc, /670 extract playlist id block bytes/);
  assert.match(doc, /80 build candidate block lines/);
  assert.match(doc, /4260 build candidate block bytes/);
  assert.match(doc, /15 candidate search text block lines/);
  assert.match(doc, /655 candidate search text block bytes/);
  assert.match(doc, /21 extract title block lines/);
  assert.match(doc, /681 extract title block bytes/);
  assert.match(doc, /34 extract description block lines/);
  assert.match(doc, /1556 extract description block bytes/);
  assert.match(doc, /318 extract channel info block lines/);
  assert.match(doc, /18196 extract channel info block bytes/);
  assert.match(doc, /101 avatar stack extraction block lines/);
  assert.match(doc, /5289 avatar stack extraction block bytes/);
  assert.match(doc, /117 showDialog extraction block lines/);
  assert.match(doc, /7760 showDialog extraction block bytes/);
  assert.match(doc, /94 rule channel extraction block lines/);
  assert.match(doc, /4977 rule channel extraction block bytes/);
  assert.match(doc, /11 build candidate _collectTextFromPaths tokens/);
  assert.match(doc, /3 build candidate metadataText tokens/);
  assert.match(doc, /1 build candidate extractChannelIdentity token/);
  assert.match(doc, /3 extract channel info avatarStackViewModel tokens/);
  assert.match(doc, /11 extract channel info showDialogCommand tokens/);
  assert.match(doc, /4 extract channel info getByPath tokens/);
  assert.match(doc, /3 extract channel info getTextFromPaths tokens/);
  assert.match(doc, /3 extract channel info return collaborators tokens/);
  assert.match(doc, /1 extract channel info return channelInfo token/);
  assert.match(doc, /6 runtime candidate extraction fixtures/);
  assert.match(doc, /identity-gated channel extraction/);
  assert.match(doc, /metadata channel-name keyword matching/);
  assert.match(doc, /video-id validation with playlist mix flags/);
  assert.match(doc, /showDialog collaborator side effects/);
  assert.match(doc, /missing showSheet roster parsing/);
  assert.match(doc, /avatar-stack mix\/radio channel-rule blocking/);
  assert.match(doc, /absent shared candidate extraction authority/);
  assert.match(doc, /`jsonFirstCandidateExtractionContract`, `jsonFirstCandidateExtractionReport`, `jsonFirstCandidateIdentityGate`, `jsonFirstCandidateMetadataSearchPolicy`, `jsonFirstCandidateVideoIdPolicy`, `jsonFirstCandidatePlaylistPolicy`, `jsonFirstCandidateCollaborationSourcePolicy`, `jsonFirstCandidateAvatarStackPolicy`, `jsonFirstCandidateShowSheetPolicy`, or `jsonFirstCandidateExtractionFixtureProvenance`/);
});

test('objective coverage ledger records JSON-first channel match boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first channel match boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_CHANNEL_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-channel-match-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /shared identity, learned identity, channelMap/);
  assert.match(doc, /filter-logic, channel matching, DOM parity/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /candidate-extraction proof into channel-match proof/);
  assert.match(doc, /2 channel match boundary source files/);
  assert.match(doc, /7 channel match source\/effect blocks/);
  assert.match(doc, /11 filter_logic build channel index block lines/);
  assert.match(doc, /370 filter_logic build channel index block bytes/);
  assert.match(doc, /19 filter_logic _matchesAnyChannel block lines/);
  assert.match(doc, /719 filter_logic _matchesAnyChannel block bytes/);
  assert.match(doc, /170 filter_logic _matchesChannel fallback block lines/);
  assert.match(doc, /7880 filter_logic _matchesChannel fallback block bytes/);
  assert.match(doc, /118 shared buildChannelFilterIndex block lines/);
  assert.match(doc, /4624 shared buildChannelFilterIndex block bytes/);
  assert.match(doc, /48 shared channelMetaMatchesIndex block lines/);
  assert.match(doc, /1937 shared channelMetaMatchesIndex block bytes/);
  assert.match(doc, /164 shared channelMatchesFilter block lines/);
  assert.match(doc, /6948 shared channelMatchesFilter block bytes/);
  assert.match(doc, /9 shared isChannelBlocked block lines/);
  assert.match(doc, /467 shared isChannelBlocked block bytes/);
  assert.match(doc, /17 filter_logic _matchesChannel return true tokens/);
  assert.match(doc, /2 filter_logic _matchesChannel return false tokens/);
  assert.match(doc, /17 filter_logic _matchesChannel channelMap tokens/);
  assert.match(doc, /11 shared channelMetaMatchesIndex return true tokens/);
  assert.match(doc, /2 shared channelMetaMatchesIndex return false tokens/);
  assert.match(doc, /18 shared channelMatchesFilter return true tokens/);
  assert.match(doc, /7 shared channelMatchesFilter return false tokens/);
  assert.match(doc, /3 shared buildChannelFilterIndex nameOnlyNames tokens/);
  assert.match(doc, /3 shared buildChannelFilterIndex stableNames tokens/);
  assert.match(doc, /3 shared channelMetaMatchesIndex nameOnlyNames tokens/);
  assert.match(doc, /3 shared channelMetaMatchesIndex stableNames tokens/);
  assert.match(doc, /6 runtime channel match fixtures/);
  assert.match(doc, /stable-id and channelMap boolean matching/);
  assert.match(doc, /direct\/index object-name divergence/);
  assert.match(doc, /name-only string divergence/);
  assert.match(doc, /direct `@handle` weak-name fallback/);
  assert.match(doc, /filter_logic shared-index delegation/);
  assert.match(doc, /legacy fallback divergence/);
  assert.match(doc, /JSON stable-name guard behavior/);
  assert.match(doc, /exact UC id blocking/);
  assert.match(doc, /absent shared channel-match authority/);
  assert.match(doc, /`jsonFirstChannelMatchContract`, `jsonFirstChannelMatchDecisionReport`, `jsonFirstChannelMatchConfidencePolicy`, `jsonFirstChannelMatchIndexDirectParity`, `jsonFirstChannelMatchFallbackScope`, `jsonFirstChannelMatchNameOnlyPolicy`, `jsonFirstChannelMatchStableNameGuard`, `jsonFirstChannelMapProvenanceReport`, `jsonFirstChannelMatchCallerMatrix`, or `jsonFirstChannelMatchFixtureProvenance`/);
});

test('objective coverage ledger records JSON-first keyword match boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first keyword match boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_KEYWORD_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-keyword-match-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /keyword matching, comments, whitelist, DOM parity/);
  assert.match(doc, /shared settings, background compile, filter-logic/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /channel-match proof into keyword-match proof/);
  assert.match(doc, /4 keyword match boundary source files/);
  assert.match(doc, /10 keyword match source\/effect blocks/);
  assert.match(doc, /29 filter_logic keyword regex reconstruction block lines/);
  assert.match(doc, /1445 filter_logic keyword regex reconstruction block bytes/);
  assert.match(doc, /15 filter_logic candidate search text block lines/);
  assert.match(doc, /663 filter_logic candidate search text block bytes/);
  assert.match(doc, /18 filter_logic _regexMatches block lines/);
  assert.match(doc, /488 filter_logic _regexMatches block bytes/);
  assert.match(doc, /15 filter_logic whitelist keyword block lines/);
  assert.match(doc, /687 filter_logic whitelist keyword block bytes/);
  assert.match(doc, /21 filter_logic blocklist keyword block lines/);
  assert.match(doc, /1123 filter_logic blocklist keyword block bytes/);
  assert.match(doc, /34 filter_logic comment keyword block lines/);
  assert.match(doc, /1947 filter_logic comment keyword block bytes/);
  assert.match(doc, /15 settings_shared compileKeywords block lines/);
  assert.match(doc, /740 settings_shared compileKeywords block bytes/);
  assert.match(doc, /23 background compileKeywordEntries block lines/);
  assert.match(doc, /1040 background compileKeywordEntries block bytes/);
  assert.match(doc, /35 background comments keyword fallback block lines/);
  assert.match(doc, /1961 background comments keyword fallback block bytes/);
  assert.match(doc, /36 DOM fallback matchesKeyword block lines/);
  assert.match(doc, /1278 DOM fallback matchesKeyword block bytes/);
  assert.match(doc, /7 filter_logic total _regexMatches tokens/);
  assert.match(doc, /2 filter_logic total filterKeywordsComments tokens/);
  assert.match(doc, /4 settings_shared compileKeywords tokens/);
  assert.match(doc, /4 background compileKeywordEntries tokens/);
  assert.match(doc, /4 DOM fallback matchesKeyword tokens/);
  assert.match(doc, /8 runtime keyword match fixtures/);
  assert.match(doc, /substring larger-word matching/);
  assert.match(doc, /exact Unicode-boundary standalone matching/);
  assert.match(doc, /global regex state reset/);
  assert.match(doc, /candidate search over title\/description\/tags\/metadata\/channel text/);
  assert.match(doc, /serialized comment keyword reconstruction gaps/);
  assert.match(doc, /direct comment `RegExp` blocking/);
  assert.match(doc, /global keyword comment hiding through candidate metadata/);
  assert.match(doc, /whitelist keyword allow\/miss fail-closed behavior/);
  assert.match(doc, /channel-only keyword skipping/);
  assert.match(doc, /absent first-class keyword match authority/);
  assert.match(doc, /`jsonFirstKeywordMatchContract`, `jsonFirstKeywordDecisionReport`, `jsonFirstKeywordBoundaryPolicy`, `jsonFirstKeywordCommentScopeReport`, `jsonFirstKeywordSourceProvenance`, `jsonFirstKeywordDomParityReport`, `jsonFirstKeywordWhitelistMissReport`, `jsonFirstKeywordRegexStateReport`, `jsonFirstChannelDerivedKeywordProvenance`, or `jsonFirstKeywordFixtureProvenance`/);
});

test('objective coverage ledger records JSON-first uppercase title boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first uppercase title boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_UPPERCASE_TITLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-uppercase-title-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /content filters, uppercase-title heuristic, DOM parity/);
  assert.match(doc, /seed active-work, background compile, filter-logic/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /keyword-match proof into uppercase-title proof/);
  assert.match(doc, /4 uppercase title boundary source files/);
  assert.match(doc, /9 uppercase title source\/effect blocks/);
  assert.match(doc, /6 filter_logic content filter defaults block lines/);
  assert.match(doc, /395 filter_logic content filter defaults block bytes/);
  assert.match(doc, /19 filter_logic content filter merge block lines/);
  assert.match(doc, /1098 filter_logic content filter merge block bytes/);
  assert.match(doc, /155 filter_logic check content filters block lines/);
  assert.match(doc, /7747 filter_logic check content filters block bytes/);
  assert.match(doc, /31 filter_logic uppercase-title method block lines/);
  assert.match(doc, /1342 filter_logic uppercase-title method block bytes/);
  assert.match(doc, /9 seed active content-filter predicate block lines/);
  assert.match(doc, /365 seed active content-filter predicate block bytes/);
  assert.match(doc, /11 DOM fallback active content-filter predicate block lines/);
  assert.match(doc, /395 DOM fallback active content-filter predicate block bytes/);
  assert.match(doc, /18 DOM fallback loop content-filter predicate block lines/);
  assert.match(doc, /906 DOM fallback loop content-filter predicate block bytes/);
  assert.match(doc, /280 DOM fallback shouldHideContent tail block lines/);
  assert.match(doc, /14598 DOM fallback shouldHideContent tail block bytes/);
  assert.match(doc, /6 background content filter default block lines/);
  assert.match(doc, /390 background content filter default block bytes/);
  assert.match(doc, /11 filter_logic total uppercase tokens/);
  assert.match(doc, /2 filter_logic total _checkUppercaseTitle tokens/);
  assert.match(doc, /7 filter_logic total contentFilters tokens/);
  assert.match(doc, /2 DOM fallback total uppercase tokens/);
  assert.match(doc, /0 DOM fallback total _checkUppercaseTitle tokens/);
  assert.match(doc, /18 DOM fallback total contentFilters tokens/);
  assert.match(doc, /1 seed total uppercase token/);
  assert.match(doc, /4 seed total contentFilters tokens/);
  assert.match(doc, /1 background total uppercase token/);
  assert.match(doc, /9 background total contentFilters tokens/);
  assert.match(doc, /8 runtime uppercase-title fixtures/);
  assert.match(doc, /`single_word` mode block\/allow behavior/);
  assert.match(doc, /ASCII-only non-ASCII leak behavior/);
  assert.match(doc, /`all_caps` block\/allow behavior/);
  assert.match(doc, /`both` mode behavior/);
  assert.match(doc, /`minWordLength` threshold and zero fallback behavior/);
  assert.match(doc, /channel-only renderer skipping/);
  assert.match(doc, /seed and DOM active predicate wakeups/);
  assert.match(doc, /DOM `shouldHideContent\(\)` missing uppercase enforcement/);
  assert.match(doc, /absent first-class uppercase-title authority/);
  assert.match(doc, /`jsonFirstUppercaseTitleContract`, `jsonFirstUppercaseDecisionReport`, `jsonFirstUppercaseBoundaryPolicy`, `jsonFirstUppercaseDomParityReport`, `jsonFirstUppercaseLocalePolicy`, `jsonFirstUppercaseRendererScope`, `jsonFirstUppercaseNoWorkBudget`, `jsonFirstUppercaseFixtureProvenance`, `jsonFirstUppercaseMetricArtifact`, or `jsonFirstUppercaseSettingsValidityReport`/);
});

test('objective coverage ledger records JSON-first hideAllShorts boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideAllShorts boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_ALL_SHORTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-all-shorts-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /Shorts global filter, renderer traversal, renderer discovery/);
  assert.match(doc, /DOM parity, marker\/restore, seed active-work/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /uppercase-title proof into hide-all-Shorts proof/);
  assert.match(doc, /4 hideAllShorts boundary source files/);
  assert.match(doc, /17 hideAllShorts source\/effect blocks/);
  assert.match(doc, /15 filter_logic Shorts rules block lines/);
  assert.match(doc, /653 filter_logic Shorts rules block bytes/);
  assert.match(doc, /10 filter_logic renderer discovery block lines/);
  assert.match(doc, /464 filter_logic renderer discovery block bytes/);
  assert.match(doc, /21 filter_logic unwrap preferred nested block lines/);
  assert.match(doc, /932 filter_logic unwrap preferred nested block bytes/);
  assert.match(doc, /5 filter_logic build candidate Shorts block lines/);
  assert.match(doc, /219 filter_logic build candidate Shorts block bytes/);
  assert.match(doc, /12 filter_logic videoChannelMap Shorts block lines/);
  assert.match(doc, /556 filter_logic videoChannelMap Shorts block bytes/);
  assert.match(doc, /5 filter_logic hideAllShorts decision block lines/);
  assert.match(doc, /326 filter_logic hideAllShorts decision block bytes/);
  assert.match(doc, /5 filter_logic whitelist Shorts exception block lines/);
  assert.match(doc, /251 filter_logic whitelist Shorts exception block bytes/);
  assert.match(doc, /10 seed active JSON rules block lines/);
  assert.match(doc, /634 seed active JSON rules block bytes/);
  assert.match(doc, /27 DOM fallback active boolean keys block lines/);
  assert.match(doc, /874 DOM fallback active boolean keys block bytes/);
  assert.match(doc, /4 DOM fallback hidden marker block lines/);
  assert.match(doc, /125 DOM fallback hidden marker block bytes/);
  assert.match(doc, /2 DOM fallback restore selector block lines/);
  assert.match(doc, /80 DOM fallback restore selector block bytes/);
  assert.match(doc, /12 DOM fallback disguised Shorts detection block lines/);
  assert.match(doc, /788 DOM fallback disguised Shorts detection block bytes/);
  assert.match(doc, /18 DOM fallback global short video decision block lines/);
  assert.match(doc, /885 DOM fallback global short video decision block bytes/);
  assert.match(doc, /275 DOM fallback Shorts section block lines/);
  assert.match(doc, /13317 DOM fallback Shorts section block bytes/);
  assert.match(doc, /35 background boolean pass-through block lines/);
  assert.match(doc, /3596 background boolean pass-through block bytes/);
  assert.match(doc, /1 background install default block line/);
  assert.match(doc, /34 background install default block bytes/);
  assert.match(doc, /16 background storage refresh keys block lines/);
  assert.match(doc, /461 background storage refresh keys block bytes/);
  assert.match(doc, /2 filter_logic total hideAllShorts tokens/);
  assert.match(doc, /7 filter_logic total shortsLockupViewModelV2 tokens/);
  assert.match(doc, /5 seed total hideAllShorts tokens/);
  assert.match(doc, /8 DOM fallback total hideAllShorts tokens/);
  assert.match(doc, /1 DOM fallback total hideShorts token/);
  assert.match(doc, /15 DOM fallback total hidden-by-hide-all-shorts marker tokens/);
  assert.match(doc, /8 background total hideAllShorts tokens/);
  assert.match(doc, /6 background total hideShorts tokens/);
  assert.match(doc, /6 runtime hideAllShorts fixtures/);
  assert.match(doc, /direct Shorts lockup and reel blocking/);
  assert.match(doc, /direct V2 renderer discovery leak behavior/);
  assert.match(doc, /nested V2 unwrap blocking/);
  assert.match(doc, /ordinary JSON videoRenderer Shorts-URL pass-through behavior/);
  assert.match(doc, /V4 `hideShorts` to `hideAllShorts` compile behavior/);
  assert.match(doc, /seed active-work wakeup behavior/);
  assert.match(doc, /DOM global Shorts selector\/marker\/restore\/disguised-card\/yield behavior/);
  assert.match(doc, /absent first-class hide-all-Shorts authority/);
  assert.match(doc, /`jsonFirstHideAllShortsContract`, `jsonFirstHideAllShortsDecisionReport`, `jsonFirstHideAllShortsRendererDiscoveryPolicy`, `jsonFirstHideAllShortsJsonDomParityReport`, `jsonFirstHideAllShortsV2LeakReport`, `jsonFirstHideAllShortsDisguisedShortPolicy`, `jsonFirstHideAllShortsNoWorkBudget`, `jsonFirstHideAllShortsMarkerRestoreProof`, `jsonFirstHideAllShortsFixtureProvenance`, or `jsonFirstHideAllShortsMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideAllComments boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideAllComments boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_ALL_COMMENTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-all-comments-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /JSON path, settings-mode, no-work optimization/);
  assert.match(doc, /performance-risk, reliability, false-hide\/leak/);
  assert.match(doc, /comments global filter, comment keyword scope/);
  assert.match(doc, /renderer traversal, renderer inventory, comment continuation/);
  assert.match(doc, /DOM parity, mobile marker\/restore, seed active-work/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-all-Shorts proof into hide-all-comments proof/);
  assert.match(doc, /4 hideAllComments boundary source files/);
  assert.match(doc, /21 hideAllComments source\/effect blocks/);
  assert.match(doc, /9 filter_logic comment rules block lines/);
  assert.match(doc, /380 filter_logic comment rules block bytes/);
  assert.match(doc, /1 filter_logic candidate comment flag block line/);
  assert.match(doc, /100 filter_logic candidate comment flag block bytes/);
  assert.match(doc, /105 filter_logic whitelist comment bypass block lines/);
  assert.match(doc, /5392 filter_logic whitelist comment bypass block bytes/);
  assert.match(doc, /34 filter_logic comment decision block lines/);
  assert.match(doc, /1947 filter_logic comment decision block bytes/);
  assert.match(doc, /10 seed active JSON rules block lines/);
  assert.match(doc, /634 seed active JSON rules block bytes/);
  assert.match(doc, /7 seed engine settings log block lines/);
  assert.match(doc, /394 seed engine settings log block bytes/);
  assert.match(doc, /28 seed basic comment hide block lines/);
  assert.match(doc, /1574 seed basic comment hide block bytes/);
  assert.match(doc, /37 seed comment continuation block lines/);
  assert.match(doc, /2266 seed comment continuation block bytes/);
  assert.match(doc, /16 DOM fallback comments CSS block lines/);
  assert.match(doc, /671 DOM fallback comments CSS block bytes/);
  assert.match(doc, /30 DOM fallback collect mobile comments block lines/);
  assert.match(doc, /1386 DOM fallback collect mobile comments block bytes/);
  assert.match(doc, /42 DOM fallback comments global block lines/);
  assert.match(doc, /1934 DOM fallback comments global block bytes/);
  assert.match(doc, /17 DOM fallback comments restore and inputs block lines/);
  assert.match(doc, /781 DOM fallback comments restore and inputs block bytes/);
  assert.match(doc, /76 DOM fallback comments thread filtering block lines/);
  assert.match(doc, /3674 DOM fallback comments thread filtering block bytes/);
  assert.match(doc, /77 DOM fallback comments renderer filtering block lines/);
  assert.match(doc, /4223 DOM fallback comments renderer filtering block bytes/);
  assert.match(doc, /99 DOM fallback comments view-model filtering block lines/);
  assert.match(doc, /5312 DOM fallback comments view-model filtering block bytes/);
  assert.match(doc, /28 DOM fallback active boolean keys block lines/);
  assert.match(doc, /905 DOM fallback active boolean keys block bytes/);
  assert.match(doc, /44 background storage read keys block lines/);
  assert.match(doc, /1408 background storage read keys block bytes/);
  assert.match(doc, /35 background comments keyword fallback block lines/);
  assert.match(doc, /1961 background comments keyword fallback block bytes/);
  assert.match(doc, /22 background V4 comments compile block lines/);
  assert.match(doc, /1515 background V4 comments compile block bytes/);
  assert.match(doc, /3 background boolean comments block lines/);
  assert.match(doc, /182 background boolean comments block bytes/);
  assert.match(doc, /16 background storage refresh keys block lines/);
  assert.match(doc, /461 background storage refresh keys block bytes/);
  assert.match(doc, /3 filter_logic total hideAllComments tokens/);
  assert.match(doc, /1 filter_logic total filterComments token/);
  assert.match(doc, /2 filter_logic total filterKeywordsComments tokens/);
  assert.match(doc, /2 filter_logic total commentRenderer tokens/);
  assert.match(doc, /1 filter_logic total commentThreadRenderer token/);
  assert.match(doc, /0 filter_logic total commentViewModel tokens/);
  assert.match(doc, /9 seed total hideAllComments tokens/);
  assert.match(doc, /2 seed total filterKeywordsComments tokens/);
  assert.match(doc, /1 seed total commentRenderer token/);
  assert.match(doc, /1 seed total commentThreadRenderer token/);
  assert.match(doc, /3 DOM fallback total hideAllComments tokens/);
  assert.match(doc, /1 DOM fallback total hideComments token/);
  assert.match(doc, /1 DOM fallback total filterComments token/);
  assert.match(doc, /3 DOM fallback total filterKeywordsComments tokens/);
  assert.match(doc, /3 DOM fallback total commentRenderer tokens/);
  assert.match(doc, /2 DOM fallback total commentViewModel tokens/);
  assert.match(doc, /5 DOM fallback total mobile-comments-card marker tokens/);
  assert.match(doc, /9 background total hideAllComments tokens/);
  assert.match(doc, /15 background total hideComments tokens/);
  assert.match(doc, /12 background total filterComments tokens/);
  assert.match(doc, /11 background total filterKeywordsComments tokens/);
  assert.match(doc, /7 runtime hideAllComments fixtures/);
  assert.match(doc, /classic JSON comment renderer blocking/);
  assert.match(doc, /empty comment section wrapper behavior/);
  assert.match(doc, /ordinary JSON videoRenderer pass-through behavior/);
  assert.match(doc, /direct commentViewModel leak behavior/);
  assert.match(doc, /comment keyword-only scoping/);
  assert.match(doc, /comment author channel blocking/);
  assert.match(doc, /V4 `hideComments` to `hideAllComments` compile behavior/);
  assert.match(doc, /seed active-work and comment continuation rewrite behavior/);
  assert.match(doc, /DOM comments selector\/thread\/renderer\/ViewModel\/mobile-marker behavior/);
  assert.match(doc, /absent first-class hide-all-comments authority/);
  assert.match(doc, /`jsonFirstHideAllCommentsContract`, `jsonFirstHideAllCommentsDecisionReport`, `jsonFirstCommentsRendererInventoryPolicy`, `jsonFirstCommentsJsonDomParityReport`, `jsonFirstCommentsViewModelLeakReport`, `jsonFirstCommentsStructuralWrapperPolicy`, `jsonFirstCommentsContinuationResponseContract`, `jsonFirstCommentsNoWorkBudget`, `jsonFirstCommentsMarkerRestoreProof`, `jsonFirstCommentsFixtureProvenance`, or `jsonFirstCommentsMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideMixPlaylists boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideMixPlaylists boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_MIX_PLAYLISTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-mix-playlists-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /Mix\/radio playlist global filter/);
  assert.match(doc, /background compile\/cache invalidation/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-all-comments proof into hide-mix-playlists proof/);
  assert.match(doc, /4 hideMixPlaylists boundary source files/);
  assert.match(doc, /16 hideMixPlaylists source\/effect blocks/);
  assert.match(doc, /17 filter_logic radio rules block lines/);
  assert.match(doc, /833 filter_logic radio rules block bytes/);
  assert.match(doc, /7 filter_logic candidate mix flag block lines/);
  assert.match(doc, /314 filter_logic candidate mix flag block bytes/);
  assert.match(doc, /10 seed active JSON rules block lines/);
  assert.match(doc, /634 seed active JSON rules block bytes/);
  assert.match(doc, /48 DOM fallback mix helper block lines/);
  assert.match(doc, /2207 DOM fallback mix helper block bytes/);
  assert.match(doc, /15 DOM fallback mix CSS rules block lines/);
  assert.match(doc, /588 DOM fallback mix CSS rules block bytes/);
  assert.match(doc, /44 background storage read keys block lines/);
  assert.match(doc, /1408 background storage read keys block bytes/);
  assert.match(doc, /35 background boolean pass-through block lines/);
  assert.match(doc, /3596 background boolean pass-through block bytes/);
  assert.match(doc, /16 background storage refresh keys block lines/);
  assert.match(doc, /461 background storage refresh keys block bytes/);
  assert.match(doc, /0 filter_logic total hideMixPlaylists tokens/);
  assert.match(doc, /0 seed total hideMixPlaylists tokens/);
  assert.match(doc, /5 DOM fallback total hideMixPlaylists tokens/);
  assert.match(doc, /10 DOM fallback total start_radio markers/);
  assert.match(doc, /12 background total hideMixPlaylists tokens/);
  assert.match(doc, /6 runtime hideMixPlaylists fixtures/);
  assert.match(doc, /JSON radio renderer pass-through behavior/);
  assert.match(doc, /JSON compact radio renderer pass-through behavior/);
  assert.match(doc, /`RD` playlist id pass-through behavior/);
  assert.match(doc, /Mix-title playlist pass-through behavior/);
  assert.match(doc, /JSON `isMix` candidate classification without a hide decision/);
  assert.match(doc, /seed active-work omission/);
  assert.match(doc, /background refresh-key omission/);
  assert.match(doc, /DOM `start_radio=1` selector behavior/);
  assert.match(doc, /Mixes chip hiding/);
  assert.match(doc, /`data-filtertube-hidden-by-mix-radio` marker behavior/);
  assert.match(doc, /`jsonFirstHideMixPlaylistsContract`, `jsonFirstHideMixPlaylistsDecisionReport`, `jsonFirstMixRendererInventoryPolicy`, `jsonFirstMixJsonDomParityReport`, `jsonFirstMixDomOnlyPolicy`, `jsonFirstMixBackgroundCacheReport`, `jsonFirstMixPlaylistInteractionPolicy`, `jsonFirstMixNoWorkBudget`, `jsonFirstMixMarkerRestoreProof`, `jsonFirstMixFixtureProvenance`, or `jsonFirstMixMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideMembersOnly boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideMembersOnly boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_MEMBERS_ONLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-members-only-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /Members-only global filter/);
  assert.match(doc, /candidate metadata extraction/);
  assert.match(doc, /broad watch\/shelf selector/);
  assert.match(doc, /background compile\/refresh/);
  assert.match(doc, /shared settings/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-mix-playlists proof into hide-members-only proof/);
  assert.match(doc, /5 hideMembersOnly boundary source files/);
  assert.match(doc, /9 hideMembersOnly source\/effect blocks/);
  assert.match(doc, /79 filter_logic candidate builder block lines/);
  assert.match(doc, /4266 filter_logic candidate builder block bytes/);
  assert.match(doc, /10 seed active JSON rules block lines/);
  assert.match(doc, /634 seed active JSON rules block bytes/);
  assert.match(doc, /41 DOM fallback members CSS rules block lines/);
  assert.match(doc, /2483 DOM fallback members CSS rules block bytes/);
  assert.match(doc, /81 DOM fallback members direct block lines/);
  assert.match(doc, /5060 DOM fallback members direct block bytes/);
  assert.match(doc, /38 settings_shared settings keys block lines/);
  assert.match(doc, /1031 settings_shared settings keys block bytes/);
  assert.match(doc, /54 settings_shared build compiled settings block lines/);
  assert.match(doc, /1916 settings_shared build compiled settings block bytes/);
  assert.match(doc, /0 filter_logic total hideMembersOnly tokens/);
  assert.match(doc, /0 seed total hideMembersOnly tokens/);
  assert.match(doc, /3 DOM fallback total hideMembersOnly tokens/);
  assert.match(doc, /18 DOM fallback total membership tokens/);
  assert.match(doc, /13 DOM fallback total yt-badge-shape--membership tokens/);
  assert.match(doc, /7 DOM fallback total data-filtertube-members-only-hidden marker tokens/);
  assert.match(doc, /13 background total hideMembersOnly tokens/);
  assert.match(doc, /23 settings_shared total hideMembersOnly tokens/);
  assert.match(doc, /6 runtime hideMembersOnly fixtures/);
  assert.match(doc, /JSON badge-video pass-through behavior/);
  assert.match(doc, /JSON accessibility-video pass-through behavior/);
  assert.match(doc, /Members-only title playlist pass-through behavior/);
  assert.match(doc, /`UUMO` playlist pass-through behavior/);
  assert.match(doc, /generic metadata extraction without an `isMembersOnly` candidate field/);
  assert.match(doc, /seed active-work omission/);
  assert.match(doc, /background compile and refresh inclusion/);
  assert.match(doc, /DOM broad watch\/shelf selector behavior/);
  assert.match(doc, /`jsonFirstHideMembersOnlyContract`, `jsonFirstHideMembersOnlyDecisionReport`, `jsonFirstMembersOnlyRendererInventoryPolicy`, `jsonFirstMembersOnlyJsonDomParityReport`, `jsonFirstMembersOnlyDomOnlyPolicy`, `jsonFirstMembersOnlyBroadHideReport`, `jsonFirstMembersOnlyNoWorkBudget`, `jsonFirstMembersOnlyMarkerRestoreProof`, `jsonFirstMembersOnlySettingsParityReport`, `jsonFirstMembersOnlyFixtureProvenance`, or `jsonFirstMembersOnlyMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideSponsoredCards boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideSponsoredCards boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_SPONSORED_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-sponsored-cards-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /sponsored-card global filter/);
  assert.match(doc, /ad renderer traversal/);
  assert.match(doc, /ad-surface selector/);
  assert.match(doc, /background compile\/refresh/);
  assert.match(doc, /shared settings/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-members-only proof into hide-sponsored-cards proof/);
  assert.match(doc, /5 hideSponsoredCards boundary source files/);
  assert.match(doc, /7 hideSponsoredCards source\/effect blocks/);
  assert.match(doc, /10 seed active JSON rules block lines/);
  assert.match(doc, /634 seed active JSON rules block bytes/);
  assert.match(doc, /15 DOM fallback sponsored CSS rules block lines/);
  assert.match(doc, /567 DOM fallback sponsored CSS rules block bytes/);
  assert.match(doc, /35 background boolean pass-through block lines/);
  assert.match(doc, /3596 background boolean pass-through block bytes/);
  assert.match(doc, /16 background storage refresh keys block lines/);
  assert.match(doc, /461 background storage refresh keys block bytes/);
  assert.match(doc, /38 settings_shared settings keys block lines/);
  assert.match(doc, /1031 settings_shared settings keys block bytes/);
  assert.match(doc, /54 settings_shared build compiled settings block lines/);
  assert.match(doc, /1916 settings_shared build compiled settings block bytes/);
  assert.match(doc, /0 filter_logic total hideSponsoredCards tokens/);
  assert.match(doc, /0 filter_logic total sponsored-ad-renderer tokens/);
  assert.match(doc, /0 seed total hideSponsoredCards tokens/);
  assert.match(doc, /0 seed total sponsored-ad-renderer tokens/);
  assert.match(doc, /2 DOM fallback total hideSponsoredCards tokens/);
  assert.match(doc, /1 DOM fallback total ytd-ad-slot-renderer token/);
  assert.match(doc, /2 DOM fallback total ytd-promoted selector tokens/);
  assert.match(doc, /1 DOM fallback total engagement-panel-ads token/);
  assert.match(doc, /13 background total hideSponsoredCards tokens/);
  assert.match(doc, /23 settings_shared total hideSponsoredCards tokens/);
  assert.match(doc, /5 runtime hideSponsoredCards fixtures/);
  assert.match(doc, /JSON ad-slot pass-through behavior/);
  assert.match(doc, /JSON promoted-sparkles pass-through behavior/);
  assert.match(doc, /JSON search-PYV pass-through behavior/);
  assert.match(doc, /nested promoted ad-slot pass-through behavior/);
  assert.match(doc, /ordinary video pass-through behavior/);
  assert.match(doc, /seed active-work omission/);
  assert.match(doc, /background compile and refresh inclusion/);
  assert.match(doc, /shared settings compile inclusion/);
  assert.match(doc, /DOM ad slot selector behavior/);
  assert.match(doc, /DOM promoted\/search\/display\/companion selector behavior/);
  assert.match(doc, /DOM engagement-panel ad selector behavior/);
  assert.match(doc, /`jsonFirstHideSponsoredCardsContract`, `jsonFirstHideSponsoredCardsDecisionReport`, `jsonFirstSponsoredRendererInventoryPolicy`, `jsonFirstSponsoredJsonDomParityReport`, `jsonFirstSponsoredDomOnlyPolicy`, `jsonFirstSponsoredAdSurfaceReport`, `jsonFirstSponsoredNoWorkBudget`, `jsonFirstSponsoredCssTargetReport`, `jsonFirstSponsoredSettingsParityReport`, `jsonFirstSponsoredFixtureProvenance`, or `jsonFirstSponsoredMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideHomeFeed boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideHomeFeed boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_HOME_FEED_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-home-feed-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /home-feed global filter/);
  assert.match(doc, /route-scoped browse filtering/);
  assert.match(doc, /desktop\/mobile route parity/);
  assert.match(doc, /marker\/restore/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-sponsored-cards proof into hide-home-feed proof/);
  assert.match(doc, /5 hideHomeFeed boundary source files/);
  assert.match(doc, /9 hideHomeFeed source\/effect blocks/);
  assert.match(doc, /37 seed desktop home browse skip block lines/);
  assert.match(doc, /1625 seed desktop home browse skip block bytes/);
  assert.match(doc, /12 DOM fallback home-feed CSS rules block lines/);
  assert.match(doc, /622 DOM fallback home-feed CSS rules block bytes/);
  assert.match(doc, /23 DOM fallback home-feed marker block lines/);
  assert.match(doc, /1286 DOM fallback home-feed marker block bytes/);
  assert.match(doc, /0 filter_logic total hideHomeFeed tokens/);
  assert.match(doc, /0 seed total hideHomeFeed tokens/);
  assert.match(doc, /3 DOM fallback total hideHomeFeed tokens/);
  assert.match(doc, /4 DOM fallback total data-filtertube-hidden-by-hide-home-feed tokens/);
  assert.match(doc, /4 DOM fallback total ytd-browse home selector tokens/);
  assert.match(doc, /9 DOM fallback total data-filtertube-route-home tokens/);
  assert.match(doc, /13 background total hideHomeFeed tokens/);
  assert.match(doc, /23 settings_shared total hideHomeFeed tokens/);
  assert.match(doc, /5 runtime hideHomeFeed fixtures/);
  assert.match(doc, /does not remove JSON `richItemRenderer`, home section, or lockup rows/);
  assert.match(doc, /desktop home browse continuations with only `hideHomeFeed` run harvest-only/);
  assert.match(doc, /active keyword still call the JSON engine/);
  assert.match(doc, /mobile home browse continuations with only `hideHomeFeed` still call the JSON engine/);
  assert.match(doc, /DOM fallback owns desktop `ytd-browse\[page-subtype="home"\]`, mobile `data-filtertube-route-home`, and `data-filtertube-hidden-by-hide-home-feed` marker behavior/);
  assert.match(doc, /`jsonFirstHideHomeFeedContract`, `jsonFirstHideHomeFeedDecisionReport`, `jsonFirstHomeFeedRoutePolicy`, `jsonFirstHomeFeedJsonDomParityReport`, `jsonFirstHomeFeedDomOnlyPolicy`, `jsonFirstHomeFeedNoWorkBudget`, `jsonFirstHomeFeedMarkerRestoreProof`, `jsonFirstHomeFeedMobileParityReport`, `jsonFirstHomeFeedFixtureProvenance`, or `jsonFirstHomeFeedMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hidePlaylistCards boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hidePlaylistCards boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_PLAYLIST_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-playlist-cards-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /playlist-card global filter/);
  assert.match(doc, /renderer traversal/);
  assert.match(doc, /playlist\/Mix interaction/);
  assert.match(doc, /direct display writer/);
  assert.match(doc, /background compile\/cache invalidation/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-home-feed proof into hide-playlist-cards proof/);
  assert.match(doc, /5 hidePlaylistCards boundary source files/);
  assert.match(doc, /8 hidePlaylistCards source\/effect blocks/);
  assert.match(doc, /16 DOM fallback playlist-card CSS rules block lines/);
  assert.match(doc, /998 DOM fallback playlist-card CSS rules block bytes/);
  assert.match(doc, /26 DOM fallback playlist-card direct block lines/);
  assert.match(doc, /1457 DOM fallback playlist-card direct block bytes/);
  assert.match(doc, /0 filter_logic total hidePlaylistCards tokens/);
  assert.match(doc, /0 seed total hidePlaylistCards tokens/);
  assert.match(doc, /3 DOM fallback total hidePlaylistCards tokens/);
  assert.match(doc, /1 DOM fallback total ytd-playlist-renderer token/);
  assert.match(doc, /1 DOM fallback total ytd-grid-playlist-renderer token/);
  assert.match(doc, /1 DOM fallback total ytd-compact-playlist-renderer token/);
  assert.match(doc, /19 DOM fallback total yt-lockup-view-model tokens/);
  assert.match(doc, /2 DOM fallback total yt-collection-thumbnail-view-model tokens/);
  assert.match(doc, /2 DOM fallback total yt-collections-stack tokens/);
  assert.match(doc, /10 DOM fallback total start_radio=1 tokens/);
  assert.match(doc, /12 background total hidePlaylistCards tokens/);
  assert.match(doc, /23 settings_shared total hidePlaylistCards tokens/);
  assert.match(doc, /6 runtime hidePlaylistCards fixtures/);
  assert.match(doc, /does not remove JSON `playlistRenderer`, `compactPlaylistRenderer`, collection-stack `lockupViewModel`, or radio renderer rows/);
  assert.match(doc, /desktop home browse continuations with only `hidePlaylistCards` run harvest-only/);
  assert.match(doc, /active keyword rule call the JSON engine/);
  assert.match(doc, /background compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /DOM fallback owns classic playlist selectors, collection-stack lockup selectors, direct `list=` lockup hiding, shelf\/horizontal-list container hiding, and `start_radio=1` Mix\/radio exclusion/);
  assert.match(doc, /`jsonFirstHidePlaylistCardsContract`, `jsonFirstHidePlaylistCardsDecisionReport`, `jsonFirstPlaylistCardsRendererInventoryPolicy`, `jsonFirstPlaylistCardsJsonDomParityReport`, `jsonFirstPlaylistCardsDomOnlyPolicy`, `jsonFirstPlaylistCardsNoWorkBudget`, `jsonFirstPlaylistCardsMixExclusionPolicy`, `jsonFirstPlaylistCardsMarkerRestoreProof`, `jsonFirstPlaylistCardsSettingsParityReport`, `jsonFirstPlaylistCardsFixtureProvenance`, or `jsonFirstPlaylistCardsMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideRecommended boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideRecommended boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_RECOMMENDED_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-recommended-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /watch recommendation toggle/);
  assert.match(doc, /watch-next renderer traversal/);
  assert.match(doc, /endpoint no-work/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-playlist-cards proof into hide-recommended proof/);
  assert.match(doc, /6 hideRecommended boundary source files/);
  assert.match(doc, /9 hideRecommended source\/effect blocks/);
  assert.match(doc, /8 DOM fallback recommended CSS rules block lines/);
  assert.match(doc, /215 DOM fallback recommended CSS rules block bytes/);
  assert.match(doc, /44 background storage read keys block lines/);
  assert.match(doc, /1408 background storage read keys block bytes/);
  assert.match(doc, /57 settings_shared build compiled settings block lines/);
  assert.match(doc, /2056 settings_shared build compiled settings block bytes/);
  assert.match(doc, /44 content bridge storage refresh keys block lines/);
  assert.match(doc, /1263 content bridge storage refresh keys block bytes/);
  assert.match(doc, /0 filter_logic total hideRecommended tokens/);
  assert.match(doc, /0 seed total hideRecommended tokens/);
  assert.match(doc, /2 DOM fallback total hideRecommended tokens/);
  assert.match(doc, /1 DOM fallback total #related token/);
  assert.match(doc, /1 DOM fallback total #items\.ytd-watch-next-secondary-results-renderer token/);
  assert.match(doc, /12 background total hideRecommended tokens/);
  assert.match(doc, /23 settings_shared total hideRecommended tokens/);
  assert.match(doc, /1 bridge_settings total hideRecommended token/);
  assert.match(doc, /9 filter_logic total compactVideoRenderer tokens/);
  assert.match(doc, /4 filter_logic total watchCardCompactVideoRenderer tokens/);
  assert.match(doc, /4 filter_logic total endScreenVideoRenderer tokens/);
  assert.match(doc, /6 runtime hideRecommended fixtures/);
  assert.match(doc, /does not remove JSON `compactVideoRenderer`, `watchCardCompactVideoRenderer`, or nested `secondarySearchContainerRenderer` rows/);
  assert.match(doc, /watch recommendation JSON filtering currently belongs to ordinary keyword rules, not `hideRecommended`/);
  assert.match(doc, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideRecommended` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `#related` plus `#items\.ytd-watch-next-secondary-results-renderer`/);
  assert.match(doc, /`jsonFirstHideRecommendedContract`, `jsonFirstHideRecommendedDecisionReport`, `jsonFirstWatchRecommendationsRendererInventoryPolicy`, `jsonFirstWatchRecommendationsJsonDomParityReport`, `jsonFirstWatchRecommendationsDomOnlyPolicy`, `jsonFirstWatchRecommendationsNoWorkBudget`, `jsonFirstWatchRecommendationsCacheInvalidationReport`, `jsonFirstWatchRecommendationsRoutePolicy`, `jsonFirstWatchRecommendationsSettingsParityReport`, `jsonFirstWatchRecommendationsFixtureProvenance`, or `jsonFirstWatchRecommendationsMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideVideoSidebar boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideVideoSidebar boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_SIDEBAR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-video-sidebar-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /watch sidebar toggle/);
  assert.match(doc, /watch-next renderer traversal/);
  assert.match(doc, /endpoint no-work/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-recommended proof into hide-video-sidebar proof/);
  assert.match(doc, /6 hideVideoSidebar boundary source files/);
  assert.match(doc, /9 hideVideoSidebar source\/effect blocks/);
  assert.match(doc, /7 DOM fallback video-sidebar CSS rules block lines/);
  assert.match(doc, /172 DOM fallback video-sidebar CSS rules block bytes/);
  assert.match(doc, /44 background storage read keys block lines/);
  assert.match(doc, /1408 background storage read keys block bytes/);
  assert.match(doc, /57 settings_shared build compiled settings block lines/);
  assert.match(doc, /2056 settings_shared build compiled settings block bytes/);
  assert.match(doc, /44 content bridge storage refresh keys block lines/);
  assert.match(doc, /1263 content bridge storage refresh keys block bytes/);
  assert.match(doc, /0 filter_logic total hideVideoSidebar tokens/);
  assert.match(doc, /0 seed total hideVideoSidebar tokens/);
  assert.match(doc, /2 DOM fallback total hideVideoSidebar tokens/);
  assert.match(doc, /1 DOM fallback total #secondary\.ytd-watch-flexy token/);
  assert.match(doc, /12 background total hideVideoSidebar tokens/);
  assert.match(doc, /23 settings_shared total hideVideoSidebar tokens/);
  assert.match(doc, /1 bridge_settings total hideVideoSidebar token/);
  assert.match(doc, /9 filter_logic total compactVideoRenderer tokens/);
  assert.match(doc, /4 filter_logic total watchCardCompactVideoRenderer tokens/);
  assert.match(doc, /4 filter_logic total endScreenVideoRenderer tokens/);
  assert.match(doc, /6 runtime hideVideoSidebar fixtures/);
  assert.match(doc, /does not remove JSON `compactVideoRenderer`, `watchCardCompactVideoRenderer`, or nested `secondarySearchContainerRenderer` rows/);
  assert.match(doc, /watch sidebar JSON filtering currently belongs to ordinary keyword rules, not `hideVideoSidebar`/);
  assert.match(doc, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideVideoSidebar` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `#secondary\.ytd-watch-flexy`/);
  assert.match(doc, /`jsonFirstHideVideoSidebarContract`, `jsonFirstHideVideoSidebarDecisionReport`, `jsonFirstWatchSidebarRendererInventoryPolicy`, `jsonFirstWatchSidebarJsonDomParityReport`, `jsonFirstWatchSidebarDomOnlyPolicy`, `jsonFirstWatchSidebarNoWorkBudget`, `jsonFirstWatchSidebarCacheInvalidationReport`, `jsonFirstWatchSidebarRoutePolicy`, `jsonFirstWatchSidebarSettingsParityReport`, `jsonFirstWatchSidebarFixtureProvenance`, or `jsonFirstWatchSidebarMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideLiveChat boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideLiveChat boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_LIVE_CHAT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-live-chat-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /live chat toggle/);
  assert.match(doc, /watch-next engagement panel traversal/);
  assert.match(doc, /endpoint no-work/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-video-sidebar proof into hide-live-chat proof/);
  assert.match(doc, /6 hideLiveChat boundary source files/);
  assert.match(doc, /9 hideLiveChat source\/effect blocks/);
  assert.match(doc, /8 DOM fallback live-chat CSS rules block lines/);
  assert.match(doc, /195 DOM fallback live-chat CSS rules block bytes/);
  assert.match(doc, /44 background storage read keys block lines/);
  assert.match(doc, /1408 background storage read keys block bytes/);
  assert.match(doc, /57 settings_shared build compiled settings block lines/);
  assert.match(doc, /2056 settings_shared build compiled settings block bytes/);
  assert.match(doc, /44 content bridge storage refresh keys block lines/);
  assert.match(doc, /1263 content bridge storage refresh keys block bytes/);
  assert.match(doc, /0 filter_logic total hideLiveChat tokens/);
  assert.match(doc, /0 seed total hideLiveChat tokens/);
  assert.match(doc, /2 DOM fallback total hideLiveChat tokens/);
  assert.match(doc, /1 DOM fallback total ytd-live-chat-frame#chat token/);
  assert.match(doc, /1 DOM fallback total #chat-container token/);
  assert.match(doc, /12 background total hideLiveChat tokens/);
  assert.match(doc, /23 settings_shared total hideLiveChat tokens/);
  assert.match(doc, /1 bridge_settings total hideLiveChat token/);
  assert.match(doc, /0 filter_logic total engagementPanelSectionListRenderer tokens/);
  assert.match(doc, /0 filter_logic total liveChatRenderer tokens/);
  assert.match(doc, /6 runtime hideLiveChat fixtures/);
  assert.match(doc, /does not remove JSON `engagementPanelSectionListRenderer` or nested `liveChatRenderer` rows/);
  assert.match(doc, /ordinary keyword rules can remove a neighboring `compactVideoRenderer` row while live chat JSON remains/);
  assert.match(doc, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideLiveChat` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `ytd-live-chat-frame#chat` and `#chat-container`/);
  assert.match(doc, /`jsonFirstHideLiveChatContract`, `jsonFirstHideLiveChatDecisionReport`, `jsonFirstLiveChatRendererInventoryPolicy`, `jsonFirstLiveChatJsonDomParityReport`, `jsonFirstLiveChatDomOnlyPolicy`, `jsonFirstLiveChatNoWorkBudget`, `jsonFirstLiveChatCacheInvalidationReport`, `jsonFirstLiveChatRoutePolicy`, `jsonFirstLiveChatSettingsParityReport`, `jsonFirstLiveChatFixtureProvenance`, or `jsonFirstLiveChatMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideWatchPlaylistPanel boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideWatchPlaylistPanel boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_WATCH_PLAYLIST_PANEL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-watch-playlist-panel-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /watch playlist panel toggle/);
  assert.match(doc, /watch-next playlist panel traversal/);
  assert.match(doc, /endpoint no-work/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-live-chat proof into hide-watch-playlist-panel proof/);
  assert.match(doc, /6 hideWatchPlaylistPanel boundary source files/);
  assert.match(doc, /11 hideWatchPlaylistPanel source\/effect blocks/);
  assert.match(doc, /7 filter_logic shared video renderer rules block lines/);
  assert.match(doc, /344 filter_logic shared video renderer rules block bytes/);
  assert.match(doc, /20 filter_logic playlist panel harvest block lines/);
  assert.match(doc, /949 filter_logic playlist panel harvest block bytes/);
  assert.match(doc, /9 DOM fallback watch-playlist-panel CSS rules block lines/);
  assert.match(doc, /264 DOM fallback watch-playlist-panel CSS rules block bytes/);
  assert.match(doc, /44 background storage read keys block lines/);
  assert.match(doc, /1408 background storage read keys block bytes/);
  assert.match(doc, /57 settings_shared build compiled settings block lines/);
  assert.match(doc, /2056 settings_shared build compiled settings block bytes/);
  assert.match(doc, /44 content bridge storage refresh keys block lines/);
  assert.match(doc, /1263 content bridge storage refresh keys block bytes/);
  assert.match(doc, /0 filter_logic total hideWatchPlaylistPanel tokens/);
  assert.match(doc, /0 seed total hideWatchPlaylistPanel tokens/);
  assert.match(doc, /2 DOM fallback total hideWatchPlaylistPanel tokens/);
  assert.match(doc, /12 background total hideWatchPlaylistPanel tokens/);
  assert.match(doc, /23 settings_shared total hideWatchPlaylistPanel tokens/);
  assert.match(doc, /1 bridge_settings total hideWatchPlaylistPanel token/);
  assert.match(doc, /1 filter_logic total playlistPanelRenderer token/);
  assert.match(doc, /6 filter_logic total playlistPanelVideoRenderer tokens/);
  assert.match(doc, /2 DOM fallback total ytd-playlist-panel-renderer tokens/);
  assert.match(doc, /4 DOM fallback total ytm-playlist-panel-renderer tokens/);
  assert.match(doc, /2 DOM fallback total ytm-playlist-panel-renderer-v2 tokens/);
  assert.match(doc, /6 runtime hideWatchPlaylistPanel fixtures/);
  assert.match(doc, /does not remove JSON `playlistPanelRenderer` or nested `playlistPanelVideoRenderer` rows/);
  assert.match(doc, /ordinary keyword rules can remove a nested `playlistPanelVideoRenderer` row while the playlist panel header remains/);
  assert.match(doc, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideWatchPlaylistPanel` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `ytd-playlist-panel-renderer`, `ytm-playlist-panel-renderer`, and `ytm-playlist-panel-renderer-v2`/);
  assert.match(doc, /`jsonFirstHideWatchPlaylistPanelContract`, `jsonFirstHideWatchPlaylistPanelDecisionReport`, `jsonFirstWatchPlaylistPanelRendererInventoryPolicy`, `jsonFirstWatchPlaylistPanelJsonDomParityReport`, `jsonFirstWatchPlaylistPanelDomOnlyPolicy`, `jsonFirstWatchPlaylistPanelNoWorkBudget`, `jsonFirstWatchPlaylistPanelCacheInvalidationReport`, `jsonFirstWatchPlaylistPanelRoutePolicy`, `jsonFirstWatchPlaylistPanelSettingsParityReport`, `jsonFirstWatchPlaylistPanelFixtureProvenance`, or `jsonFirstWatchPlaylistPanelMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideVideoInfo boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideVideoInfo boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_INFO_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-video-info-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /video-info chrome master toggle/);
  assert.match(doc, /watch metadata renderer traversal/);
  assert.match(doc, /whitelist-mode scaffolding/);
  assert.match(doc, /child video-info control interaction/);
  assert.match(doc, /endpoint no-work/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-watch-playlist-panel proof into hide-video-info proof/);
  assert.match(doc, /6 hideVideoInfo boundary source files/);
  assert.match(doc, /11 hideVideoInfo source\/effect blocks/);
  assert.match(doc, /10 filter_logic watch primary metadata rules block lines/);
  assert.match(doc, /431 filter_logic watch primary metadata rules block bytes/);
  assert.match(doc, /6 filter_logic whitelist watch scaffolding block lines/);
  assert.match(doc, /449 filter_logic whitelist watch scaffolding block bytes/);
  assert.match(doc, /49 DOM fallback video-info CSS rules block lines/);
  assert.match(doc, /1516 DOM fallback video-info CSS rules block bytes/);
  assert.match(doc, /44 background storage read keys block lines/);
  assert.match(doc, /1408 background storage read keys block bytes/);
  assert.match(doc, /58 settings_shared build compiled settings block lines/);
  assert.match(doc, /2100 settings_shared build compiled settings block bytes/);
  assert.match(doc, /44 content bridge storage refresh keys block lines/);
  assert.match(doc, /1263 content bridge storage refresh keys block bytes/);
  assert.match(doc, /0 filter_logic total hideVideoInfo tokens/);
  assert.match(doc, /0 seed total hideVideoInfo tokens/);
  assert.match(doc, /2 DOM fallback total hideVideoInfo tokens/);
  assert.match(doc, /12 background total hideVideoInfo tokens/);
  assert.match(doc, /23 settings_shared total hideVideoInfo tokens/);
  assert.match(doc, /1 bridge_settings total hideVideoInfo token/);
  assert.match(doc, /2 filter_logic total videoPrimaryInfoRenderer tokens/);
  assert.match(doc, /2 filter_logic total videoSecondaryInfoRenderer tokens/);
  assert.match(doc, /6 DOM fallback video-info CSS block hideInfoMaster tokens/);
  assert.match(doc, /1 DOM fallback video-info CSS block #actions\.ytd-watch-metadata token/);
  assert.match(doc, /1 DOM fallback video-info CSS block #owner\.ytd-watch-metadata token/);
  assert.match(doc, /1 DOM fallback video-info CSS block #description\.ytd-watch-metadata token/);
  assert.match(doc, /1 DOM fallback video-info CSS block ytd-merch-shelf-renderer token/);
  assert.match(doc, /7 runtime hideVideoInfo fixtures/);
  assert.match(doc, /does not remove JSON `videoPrimaryInfoRenderer` or `videoSecondaryInfoRenderer` rows/);
  assert.match(doc, /ordinary keyword rules can remove a matching `videoPrimaryInfoRenderer` row while nonmatching watch metadata JSON remains/);
  assert.match(doc, /whitelist mode preserves `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` rows with an empty whitelist even when `hideVideoInfo` is enabled/);
  assert.match(doc, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideVideoInfo` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `#actions\.ytd-watch-metadata`, `#info > #menu-container`, `a\[aria-label="Ask"\]`, `button\[aria-label="Ask"\]`, `#owner\.ytd-watch-metadata`/);
  assert.match(doc, /`jsonFirstHideVideoInfoContract`, `jsonFirstHideVideoInfoDecisionReport`, `jsonFirstVideoInfoRendererInventoryPolicy`, `jsonFirstVideoInfoJsonDomParityReport`, `jsonFirstVideoInfoDomOnlyPolicy`, `jsonFirstVideoInfoWhitelistModeReport`, `jsonFirstVideoInfoNoWorkBudget`, `jsonFirstVideoInfoCacheInvalidationReport`, `jsonFirstVideoInfoRoutePolicy`, `jsonFirstVideoInfoSettingsParityReport`, `jsonFirstVideoInfoFixtureProvenance`, or `jsonFirstVideoInfoMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideVideoButtonsBar boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideVideoButtonsBar boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_BUTTONS_BAR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-video-buttons-bar-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /video-buttons-bar child toggle/);
  assert.match(doc, /watch metadata renderer traversal/);
  assert.match(doc, /whitelist-mode scaffolding/);
  assert.match(doc, /hideVideoInfo master-toggle interaction/);
  assert.match(doc, /endpoint no-work/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-video-info proof into hide-video-buttons-bar proof/);
  assert.match(doc, /6 hideVideoButtonsBar boundary source files/);
  assert.match(doc, /12 hideVideoButtonsBar source\/effect blocks/);
  assert.match(doc, /10 filter_logic watch primary metadata rules block lines/);
  assert.match(doc, /431 filter_logic watch primary metadata rules block bytes/);
  assert.match(doc, /6 filter_logic whitelist watch scaffolding block lines/);
  assert.match(doc, /449 filter_logic whitelist watch scaffolding block bytes/);
  assert.match(doc, /8 DOM fallback video-buttons-bar CSS rules block lines/);
  assert.match(doc, /263 DOM fallback video-buttons-bar CSS rules block bytes/);
  assert.match(doc, /11 DOM fallback video-info mode declaration block lines/);
  assert.match(doc, /445 DOM fallback video-info mode declaration block bytes/);
  assert.match(doc, /44 background storage read keys block lines/);
  assert.match(doc, /1408 background storage read keys block bytes/);
  assert.match(doc, /59 settings_shared build compiled settings block lines/);
  assert.match(doc, /2156 settings_shared build compiled settings block bytes/);
  assert.match(doc, /44 content bridge storage refresh keys block lines/);
  assert.match(doc, /1263 content bridge storage refresh keys block bytes/);
  assert.match(doc, /0 filter_logic total hideVideoButtonsBar tokens/);
  assert.match(doc, /0 seed total hideVideoButtonsBar tokens/);
  assert.match(doc, /2 DOM fallback total hideVideoButtonsBar tokens/);
  assert.match(doc, /12 background total hideVideoButtonsBar tokens/);
  assert.match(doc, /23 settings_shared total hideVideoButtonsBar tokens/);
  assert.match(doc, /1 bridge_settings total hideVideoButtonsBar token/);
  assert.match(doc, /2 filter_logic total videoPrimaryInfoRenderer tokens/);
  assert.match(doc, /2 filter_logic total videoSecondaryInfoRenderer tokens/);
  assert.match(doc, /1 DOM fallback video-buttons-bar CSS block hideInfoMaster token/);
  assert.match(doc, /1 DOM fallback video-buttons-bar CSS block #actions\.ytd-watch-metadata token/);
  assert.match(doc, /1 DOM fallback video-buttons-bar CSS block #info > #menu-container token/);
  assert.match(doc, /7 runtime hideVideoButtonsBar fixtures/);
  assert.match(doc, /does not remove JSON `videoPrimaryInfoRenderer` or `videoSecondaryInfoRenderer` rows/);
  assert.match(doc, /ordinary keyword rules can remove a matching `videoPrimaryInfoRenderer` row while nonmatching watch metadata JSON remains/);
  assert.match(doc, /whitelist mode preserves `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` rows with an empty whitelist even when `hideVideoButtonsBar` is enabled/);
  assert.match(doc, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideVideoButtonsBar` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `#actions\.ytd-watch-metadata` and `#info > #menu-container`/);
  assert.match(doc, /DOM fallback hides the same buttons bar selectors when `hideInfoMaster` is true or when `settings\.hideVideoButtonsBar` is true/);
  assert.match(doc, /`jsonFirstHideVideoButtonsBarContract`, `jsonFirstHideVideoButtonsBarDecisionReport`, `jsonFirstVideoButtonsBarRendererInventoryPolicy`, `jsonFirstVideoButtonsBarJsonDomParityReport`, `jsonFirstVideoButtonsBarDomOnlyPolicy`, `jsonFirstVideoButtonsBarWhitelistModeReport`, `jsonFirstVideoButtonsBarChildControlInteractionReport`, `jsonFirstVideoButtonsBarNoWorkBudget`, `jsonFirstVideoButtonsBarCacheInvalidationReport`, `jsonFirstVideoButtonsBarRoutePolicy`, `jsonFirstVideoButtonsBarSettingsParityReport`, `jsonFirstVideoButtonsBarFixtureProvenance`, or `jsonFirstVideoButtonsBarMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideVideoChannelRow boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideVideoChannelRow boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_CHANNEL_ROW_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-video-channel-row-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /video-channel-row child toggle/);
  assert.match(doc, /watch metadata renderer traversal/);
  assert.match(doc, /whitelist-mode scaffolding/);
  assert.match(doc, /hideVideoInfo master-toggle interaction/);
  assert.match(doc, /endpoint no-work/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-video-buttons-bar proof into hide-video-channel-row proof/);
  assert.match(doc, /6 hideVideoChannelRow boundary source files/);
  assert.match(doc, /12 hideVideoChannelRow source\/effect blocks/);
  assert.match(doc, /10 filter_logic watch primary metadata rules block lines/);
  assert.match(doc, /431 filter_logic watch primary metadata rules block bytes/);
  assert.match(doc, /6 filter_logic whitelist watch scaffolding block lines/);
  assert.match(doc, /449 filter_logic whitelist watch scaffolding block bytes/);
  assert.match(doc, /8 DOM fallback video-channel-row CSS rules block lines/);
  assert.match(doc, /280 DOM fallback video-channel-row CSS rules block bytes/);
  assert.match(doc, /11 DOM fallback video-info mode declaration block lines/);
  assert.match(doc, /445 DOM fallback video-info mode declaration block bytes/);
  assert.match(doc, /44 background storage read keys block lines/);
  assert.match(doc, /1408 background storage read keys block bytes/);
  assert.match(doc, /61 settings_shared build compiled settings block lines/);
  assert.match(doc, /2256 settings_shared build compiled settings block bytes/);
  assert.match(doc, /44 content bridge storage refresh keys block lines/);
  assert.match(doc, /1263 content bridge storage refresh keys block bytes/);
  assert.match(doc, /0 filter_logic total hideVideoChannelRow tokens/);
  assert.match(doc, /0 seed total hideVideoChannelRow tokens/);
  assert.match(doc, /2 DOM fallback total hideVideoChannelRow tokens/);
  assert.match(doc, /12 background total hideVideoChannelRow tokens/);
  assert.match(doc, /23 settings_shared total hideVideoChannelRow tokens/);
  assert.match(doc, /1 bridge_settings total hideVideoChannelRow token/);
  assert.match(doc, /2 filter_logic total videoPrimaryInfoRenderer tokens/);
  assert.match(doc, /2 filter_logic total videoSecondaryInfoRenderer tokens/);
  assert.match(doc, /1 DOM fallback video-channel-row CSS block hideInfoMaster token/);
  assert.match(doc, /1 DOM fallback video-channel-row CSS block #owner\.ytd-watch-metadata token/);
  assert.match(doc, /1 DOM fallback video-channel-row CSS block #top-row\.ytd-video-secondary-info-renderer token/);
  assert.match(doc, /7 runtime hideVideoChannelRow fixtures/);
  assert.match(doc, /does not remove JSON `videoPrimaryInfoRenderer` or `videoSecondaryInfoRenderer` rows/);
  assert.match(doc, /ordinary keyword or channel rules can remove a matching `videoSecondaryInfoRenderer` row while nonmatching watch metadata JSON remains/);
  assert.match(doc, /whitelist mode preserves `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` rows with an empty whitelist even when `hideVideoChannelRow` is enabled/);
  assert.match(doc, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideVideoChannelRow` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `#owner\.ytd-watch-metadata` and `#top-row\.ytd-video-secondary-info-renderer`/);
  assert.match(doc, /DOM fallback hides the same channel row selectors when `hideInfoMaster` is true or when `settings\.hideVideoChannelRow` is true/);
  assert.match(doc, /`jsonFirstHideVideoChannelRowContract`, `jsonFirstHideVideoChannelRowDecisionReport`, `jsonFirstVideoChannelRowRendererInventoryPolicy`, `jsonFirstVideoChannelRowJsonDomParityReport`, `jsonFirstVideoChannelRowDomOnlyPolicy`, `jsonFirstVideoChannelRowWhitelistModeReport`, `jsonFirstVideoChannelRowChildControlInteractionReport`, `jsonFirstVideoChannelRowNoWorkBudget`, `jsonFirstVideoChannelRowCacheInvalidationReport`, `jsonFirstVideoChannelRowRoutePolicy`, `jsonFirstVideoChannelRowSettingsParityReport`, `jsonFirstVideoChannelRowFixtureProvenance`, or `jsonFirstVideoChannelRowMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideVideoDescription boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideVideoDescription boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_DESCRIPTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-video-description-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /video-description child toggle/);
  assert.match(doc, /watch metadata renderer traversal/);
  assert.match(doc, /whitelist-mode scaffolding/);
  assert.match(doc, /hideVideoInfo master-toggle interaction/);
  assert.match(doc, /endpoint no-work/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-video-channel-row proof into hide-video-description proof/);
  assert.match(doc, /6 hideVideoDescription boundary source files/);
  assert.match(doc, /12 hideVideoDescription source\/effect blocks/);
  assert.match(doc, /10 filter_logic watch primary metadata rules block lines/);
  assert.match(doc, /431 filter_logic watch primary metadata rules block bytes/);
  assert.match(doc, /6 filter_logic whitelist watch scaffolding block lines/);
  assert.match(doc, /449 filter_logic whitelist watch scaffolding block bytes/);
  assert.match(doc, /8 DOM fallback video-description CSS rules block lines/);
  assert.match(doc, /291 DOM fallback video-description CSS rules block bytes/);
  assert.match(doc, /11 DOM fallback video-info mode declaration block lines/);
  assert.match(doc, /445 DOM fallback video-info mode declaration block bytes/);
  assert.match(doc, /44 background storage read keys block lines/);
  assert.match(doc, /1408 background storage read keys block bytes/);
  assert.match(doc, /62 settings_shared build compiled settings block lines/);
  assert.match(doc, /2314 settings_shared build compiled settings block bytes/);
  assert.match(doc, /44 content bridge storage refresh keys block lines/);
  assert.match(doc, /1263 content bridge storage refresh keys block bytes/);
  assert.match(doc, /0 filter_logic total hideVideoDescription tokens/);
  assert.match(doc, /0 seed total hideVideoDescription tokens/);
  assert.match(doc, /2 DOM fallback total hideVideoDescription tokens/);
  assert.match(doc, /12 background total hideVideoDescription tokens/);
  assert.match(doc, /23 settings_shared total hideVideoDescription tokens/);
  assert.match(doc, /1 bridge_settings total hideVideoDescription token/);
  assert.match(doc, /2 filter_logic total videoPrimaryInfoRenderer tokens/);
  assert.match(doc, /2 filter_logic total videoSecondaryInfoRenderer tokens/);
  assert.match(doc, /1 DOM fallback video-description CSS block hideInfoMaster token/);
  assert.match(doc, /1 DOM fallback video-description CSS block #description\.ytd-watch-metadata token/);
  assert.match(doc, /1 DOM fallback video-description CSS block ytd-expander\.ytd-video-secondary-info-renderer token/);
  assert.match(doc, /7 runtime hideVideoDescription fixtures/);
  assert.match(doc, /does not remove JSON `videoPrimaryInfoRenderer` or `videoSecondaryInfoRenderer` rows/);
  assert.match(doc, /ordinary keyword rules can remove a matching `videoPrimaryInfoRenderer` row while nonmatching watch metadata JSON remains/);
  assert.match(doc, /whitelist mode preserves `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` rows with an empty whitelist even when `hideVideoDescription` is enabled/);
  assert.match(doc, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideVideoDescription` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `#description\.ytd-watch-metadata` and `ytd-expander\.ytd-video-secondary-info-renderer`/);
  assert.match(doc, /DOM fallback hides the same description selectors when `hideInfoMaster` is true or when `settings\.hideVideoDescription` is true/);
  assert.match(doc, /`jsonFirstHideVideoDescriptionContract`, `jsonFirstHideVideoDescriptionDecisionReport`, `jsonFirstVideoDescriptionRendererInventoryPolicy`, `jsonFirstVideoDescriptionJsonDomParityReport`, `jsonFirstVideoDescriptionDomOnlyPolicy`, `jsonFirstVideoDescriptionWhitelistModeReport`, `jsonFirstVideoDescriptionChildControlInteractionReport`, `jsonFirstVideoDescriptionNoWorkBudget`, `jsonFirstVideoDescriptionCacheInvalidationReport`, `jsonFirstVideoDescriptionRoutePolicy`, `jsonFirstVideoDescriptionSettingsParityReport`, `jsonFirstVideoDescriptionFixtureProvenance`, or `jsonFirstVideoDescriptionMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideAskButton boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideAskButton boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_ASK_BUTTON_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-ask-button-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /Ask button child toggle/);
  assert.match(doc, /watch metadata renderer traversal/);
  assert.match(doc, /whitelist-mode scaffolding/);
  assert.match(doc, /explicit hideAskButton whitelist behavior/);
  assert.match(doc, /hideVideoInfo master-toggle interaction/);
  assert.match(doc, /endpoint no-work/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-video-description proof into hide-ask-button proof/);
  assert.match(doc, /6 hideAskButton boundary source files/);
  assert.match(doc, /12 hideAskButton source\/effect blocks/);
  assert.match(doc, /10 filter_logic watch primary metadata rules block lines/);
  assert.match(doc, /431 filter_logic watch primary metadata rules block bytes/);
  assert.match(doc, /6 filter_logic whitelist watch scaffolding block lines/);
  assert.match(doc, /449 filter_logic whitelist watch scaffolding block bytes/);
  assert.match(doc, /8 DOM fallback Ask button CSS rules block lines/);
  assert.match(doc, /218 DOM fallback Ask button CSS rules block bytes/);
  assert.match(doc, /11 DOM fallback video-info mode declaration block lines/);
  assert.match(doc, /445 DOM fallback video-info mode declaration block bytes/);
  assert.match(doc, /44 background storage read keys block lines/);
  assert.match(doc, /1408 background storage read keys block bytes/);
  assert.match(doc, /60 settings_shared build compiled settings block lines/);
  assert.match(doc, /2200 settings_shared build compiled settings block bytes/);
  assert.match(doc, /44 content bridge storage refresh keys block lines/);
  assert.match(doc, /1263 content bridge storage refresh keys block bytes/);
  assert.match(doc, /0 filter_logic total hideAskButton tokens/);
  assert.match(doc, /0 seed total hideAskButton tokens/);
  assert.match(doc, /2 DOM fallback total hideAskButton tokens/);
  assert.match(doc, /12 background total hideAskButton tokens/);
  assert.match(doc, /23 settings_shared total hideAskButton tokens/);
  assert.match(doc, /1 bridge_settings total hideAskButton token/);
  assert.match(doc, /2 filter_logic total videoPrimaryInfoRenderer tokens/);
  assert.match(doc, /2 filter_logic total videoSecondaryInfoRenderer tokens/);
  assert.match(doc, /1 DOM fallback Ask button CSS block hideInfoMaster token/);
  assert.match(doc, /1 DOM fallback Ask button CSS block a\[aria-label="Ask"\] token/);
  assert.match(doc, /1 DOM fallback Ask button CSS block button\[aria-label="Ask"\] token/);
  assert.match(doc, /7 runtime hideAskButton fixtures/);
  assert.match(doc, /does not remove JSON `videoPrimaryInfoRenderer` or `videoSecondaryInfoRenderer` rows/);
  assert.match(doc, /ordinary keyword rules can remove a matching `videoPrimaryInfoRenderer` row while nonmatching watch metadata JSON remains/);
  assert.match(doc, /whitelist mode preserves `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` rows with an empty whitelist even when `hideAskButton` is enabled/);
  assert.match(doc, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideAskButton` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `a\[aria-label="Ask"\]` and `button\[aria-label="Ask"\]`/);
  assert.match(doc, /DOM fallback hides Ask button selectors when `hideInfoMaster` is true or when `settings\.hideAskButton` is true/);
  assert.match(doc, /explicit `settings\.hideAskButton` is not directly gated by `listMode !== 'whitelist'`/);
  assert.match(doc, /`jsonFirstHideAskButtonContract`, `jsonFirstHideAskButtonDecisionReport`, `jsonFirstAskButtonRendererInventoryPolicy`, `jsonFirstAskButtonJsonDomParityReport`, `jsonFirstAskButtonDomOnlyPolicy`, `jsonFirstAskButtonWhitelistModeReport`, `jsonFirstAskButtonChildControlInteractionReport`, `jsonFirstAskButtonNoWorkBudget`, `jsonFirstAskButtonCacheInvalidationReport`, `jsonFirstAskButtonRoutePolicy`, `jsonFirstAskButtonSettingsParityReport`, `jsonFirstAskButtonFixtureProvenance`, or `jsonFirstAskButtonMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideMerchTicketsOffers boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideMerchTicketsOffers boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_MERCH_TICKETS_OFFERS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-merch-tickets-offers-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /Merch\/Tickets\/Offers child toggle/);
  assert.match(doc, /watch metadata renderer traversal/);
  assert.match(doc, /whitelist-mode scaffolding/);
  assert.match(doc, /explicit hideMerchTicketsOffers whitelist behavior/);
  assert.match(doc, /hideVideoInfo master-toggle interaction/);
  assert.match(doc, /endpoint no-work/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-ask-button proof into hide-merch-tickets-offers proof/);
  assert.match(doc, /6 hideMerchTicketsOffers boundary source files/);
  assert.match(doc, /12 hideMerchTicketsOffers source\/effect blocks/);
  assert.match(doc, /10 filter_logic watch primary metadata rules block lines/);
  assert.match(doc, /431 filter_logic watch primary metadata rules block bytes/);
  assert.match(doc, /6 filter_logic whitelist watch scaffolding block lines/);
  assert.match(doc, /449 filter_logic whitelist watch scaffolding block bytes/);
  assert.match(doc, /10 DOM fallback Merch\/Tickets\/Offers CSS rules block lines/);
  assert.match(doc, /274 DOM fallback Merch\/Tickets\/Offers CSS rules block bytes/);
  assert.match(doc, /11 DOM fallback video-info mode declaration block lines/);
  assert.match(doc, /445 DOM fallback video-info mode declaration block bytes/);
  assert.match(doc, /44 background storage read keys block lines/);
  assert.match(doc, /1408 background storage read keys block bytes/);
  assert.match(doc, /63 settings_shared build compiled settings block lines/);
  assert.match(doc, /2376 settings_shared build compiled settings block bytes/);
  assert.match(doc, /44 content bridge storage refresh keys block lines/);
  assert.match(doc, /1263 content bridge storage refresh keys block bytes/);
  assert.match(doc, /0 filter_logic total hideMerchTicketsOffers tokens/);
  assert.match(doc, /0 seed total hideMerchTicketsOffers tokens/);
  assert.match(doc, /2 DOM fallback total hideMerchTicketsOffers tokens/);
  assert.match(doc, /12 background total hideMerchTicketsOffers tokens/);
  assert.match(doc, /23 settings_shared total hideMerchTicketsOffers tokens/);
  assert.match(doc, /1 bridge_settings total hideMerchTicketsOffers token/);
  assert.match(doc, /2 filter_logic total videoPrimaryInfoRenderer tokens/);
  assert.match(doc, /2 filter_logic total videoSecondaryInfoRenderer tokens/);
  assert.match(doc, /1 DOM fallback Merch\/Tickets\/Offers CSS block hideInfoMaster token/);
  assert.match(doc, /1 DOM fallback Merch\/Tickets\/Offers CSS block #ticket-shelf token/);
  assert.match(doc, /1 DOM fallback Merch\/Tickets\/Offers CSS block ytd-merch-shelf-renderer token/);
  assert.match(doc, /1 DOM fallback Merch\/Tickets\/Offers CSS block #offer-module token/);
  assert.match(doc, /1 DOM fallback Merch\/Tickets\/Offers CSS block #clarify-box token/);
  assert.match(doc, /7 runtime hideMerchTicketsOffers fixtures/);
  assert.match(doc, /does not remove JSON `videoPrimaryInfoRenderer` or `videoSecondaryInfoRenderer` rows/);
  assert.match(doc, /ordinary keyword rules can remove a matching `videoPrimaryInfoRenderer` row while nonmatching watch metadata JSON remains/);
  assert.match(doc, /whitelist mode preserves `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` rows with an empty whitelist even when `hideMerchTicketsOffers` is enabled/);
  assert.match(doc, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideMerchTicketsOffers` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `#ticket-shelf`, `ytd-merch-shelf-renderer`, `#offer-module`, and `#clarify-box`/);
  assert.match(doc, /DOM fallback hides Merch\/Tickets\/Offers selectors when `hideInfoMaster` is true or when `settings\.hideMerchTicketsOffers` is true/);
  assert.match(doc, /explicit `settings\.hideMerchTicketsOffers` is not directly gated by `listMode !== 'whitelist'`/);
  assert.match(doc, /`jsonFirstHideMerchTicketsOffersContract`, `jsonFirstHideMerchTicketsOffersDecisionReport`, `jsonFirstMerchTicketsOffersRendererInventoryPolicy`, `jsonFirstMerchTicketsOffersJsonDomParityReport`, `jsonFirstMerchTicketsOffersDomOnlyPolicy`, `jsonFirstMerchTicketsOffersWhitelistModeReport`, `jsonFirstMerchTicketsOffersChildControlInteractionReport`, `jsonFirstMerchTicketsOffersNoWorkBudget`, `jsonFirstMerchTicketsOffersCacheInvalidationReport`, `jsonFirstMerchTicketsOffersRoutePolicy`, `jsonFirstMerchTicketsOffersSettingsParityReport`, `jsonFirstMerchTicketsOffersFixtureProvenance`, or `jsonFirstMerchTicketsOffersMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideEndscreenVideowall boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideEndscreenVideowall boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_ENDSCREEN_VIDEOWALL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-endscreen-videowall-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /endscreen-videowall toggle/);
  assert.match(doc, /direct endScreenVideoRenderer traversal/);
  assert.match(doc, /compactAutoplayRenderer gap/);
  assert.match(doc, /whitelist-mode behavior/);
  assert.match(doc, /player overlay DOM parity/);
  assert.match(doc, /endpoint no-work/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-merch-tickets-offers proof into hide-endscreen-videowall proof/);
  assert.match(doc, /6 hideEndscreenVideowall boundary source files/);
  assert.match(doc, /13 hideEndscreenVideowall source\/effect blocks/);
  assert.match(doc, /8 filter_logic shared video renderer rules block lines/);
  assert.match(doc, /415 filter_logic shared video renderer rules block bytes/);
  assert.match(doc, /8 filter_logic category renderer allowlist block lines/);
  assert.match(doc, /618 filter_logic category renderer allowlist block bytes/);
  assert.match(doc, /10 filter_logic nested known keys block lines/);
  assert.match(doc, /427 filter_logic nested known keys block bytes/);
  assert.match(doc, /8 filter_logic content renderer allowlist block lines/);
  assert.match(doc, /618 filter_logic content renderer allowlist block bytes/);
  assert.match(doc, /8 DOM fallback endscreen-videowall CSS rules block lines/);
  assert.match(doc, /253 DOM fallback endscreen-videowall CSS rules block bytes/);
  assert.match(doc, /65 settings_shared build compiled settings block lines/);
  assert.match(doc, /2492 settings_shared build compiled settings block bytes/);
  assert.match(doc, /0 filter_logic total hideEndscreenVideowall tokens/);
  assert.match(doc, /0 seed total hideEndscreenVideowall tokens/);
  assert.match(doc, /2 DOM fallback total hideEndscreenVideowall tokens/);
  assert.match(doc, /12 background total hideEndscreenVideowall tokens/);
  assert.match(doc, /23 settings_shared total hideEndscreenVideowall tokens/);
  assert.match(doc, /1 bridge_settings total hideEndscreenVideowall token/);
  assert.match(doc, /4 filter_logic total endScreenVideoRenderer tokens/);
  assert.match(doc, /0 filter_logic total compactAutoplayRenderer tokens/);
  assert.match(doc, /1 DOM fallback endscreen-videowall CSS block #movie_player \.ytp-endscreen-content token/);
  assert.match(doc, /1 DOM fallback endscreen-videowall CSS block #movie_player \.ytp-fullscreen-grid-stills-container token/);
  assert.match(doc, /7 runtime hideEndscreenVideowall fixtures/);
  assert.match(doc, /does not remove JSON `endScreenVideoRenderer` or `compactAutoplayRenderer` rows/);
  assert.match(doc, /ordinary keyword rules can remove a matching supported `endScreenVideoRenderer` row while matching `compactAutoplayRenderer` remains/);
  assert.match(doc, /empty whitelist mode can remove supported `endScreenVideoRenderer` while `compactAutoplayRenderer` still passes through/);
  assert.match(doc, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideEndscreenVideowall` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `#movie_player \.ytp-endscreen-content` and `#movie_player \.ytp-fullscreen-grid-stills-container`/);
  assert.match(doc, /the DOM videowall CSS block is not gated by `listMode !== 'whitelist'`/);
  assert.match(doc, /`jsonFirstHideEndscreenVideowallContract`, `jsonFirstHideEndscreenVideowallDecisionReport`, `jsonFirstEndscreenVideowallRendererInventoryPolicy`, `jsonFirstEndscreenVideowallJsonDomParityReport`, `jsonFirstEndscreenVideowallDomOnlyPolicy`, `jsonFirstEndscreenVideowallWhitelistModeReport`, `jsonFirstEndscreenVideowallPlayerOverlayPolicy`, `jsonFirstEndscreenVideowallNoWorkBudget`, `jsonFirstEndscreenVideowallCacheInvalidationReport`, `jsonFirstEndscreenVideowallRoutePolicy`, `jsonFirstEndscreenVideowallSettingsParityReport`, `jsonFirstEndscreenVideowallFixtureProvenance`, or `jsonFirstEndscreenVideowallMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideEndscreenCards boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideEndscreenCards boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_ENDSCREEN_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-endscreen-cards-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /endscreen-cards toggle/);
  assert.match(doc, /direct endScreenVideoRenderer traversal/);
  assert.match(doc, /compactAutoplayRenderer gap/);
  assert.match(doc, /whitelist-mode behavior/);
  assert.match(doc, /player overlay DOM parity/);
  assert.match(doc, /endpoint no-work/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-endscreen-videowall proof into hide-endscreen-cards proof/);
  assert.match(doc, /6 hideEndscreenCards boundary source files/);
  assert.match(doc, /13 hideEndscreenCards source\/effect blocks/);
  assert.match(doc, /8 filter_logic shared video renderer rules block lines/);
  assert.match(doc, /415 filter_logic shared video renderer rules block bytes/);
  assert.match(doc, /8 filter_logic category renderer allowlist block lines/);
  assert.match(doc, /618 filter_logic category renderer allowlist block bytes/);
  assert.match(doc, /10 filter_logic nested known keys block lines/);
  assert.match(doc, /427 filter_logic nested known keys block bytes/);
  assert.match(doc, /8 filter_logic content renderer allowlist block lines/);
  assert.match(doc, /618 filter_logic content renderer allowlist block bytes/);
  assert.match(doc, /7 DOM fallback endscreen-cards CSS rules block lines/);
  assert.match(doc, /177 DOM fallback endscreen-cards CSS rules block bytes/);
  assert.match(doc, /64 settings_shared build compiled settings block lines/);
  assert.match(doc, /2438 settings_shared build compiled settings block bytes/);
  assert.match(doc, /0 filter_logic total hideEndscreenCards tokens/);
  assert.match(doc, /0 seed total hideEndscreenCards tokens/);
  assert.match(doc, /2 DOM fallback total hideEndscreenCards tokens/);
  assert.match(doc, /12 background total hideEndscreenCards tokens/);
  assert.match(doc, /23 settings_shared total hideEndscreenCards tokens/);
  assert.match(doc, /1 bridge_settings total hideEndscreenCards token/);
  assert.match(doc, /4 filter_logic total endScreenVideoRenderer tokens/);
  assert.match(doc, /0 filter_logic total compactAutoplayRenderer tokens/);
  assert.match(doc, /1 DOM fallback endscreen-cards CSS block #movie_player \.ytp-ce-element token/);
  assert.match(doc, /7 runtime hideEndscreenCards fixtures/);
  assert.match(doc, /does not remove JSON `endScreenVideoRenderer` or `compactAutoplayRenderer` rows/);
  assert.match(doc, /ordinary keyword rules can remove a matching supported `endScreenVideoRenderer` row while matching `compactAutoplayRenderer` remains/);
  assert.match(doc, /empty whitelist mode can remove supported `endScreenVideoRenderer` while `compactAutoplayRenderer` still passes through/);
  assert.match(doc, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideEndscreenCards` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `#movie_player \.ytp-ce-element`/);
  assert.match(doc, /the DOM end-screen card CSS block is not gated by `listMode !== 'whitelist'`/);
  assert.match(doc, /`jsonFirstHideEndscreenCardsContract`, `jsonFirstHideEndscreenCardsDecisionReport`, `jsonFirstEndscreenCardsRendererInventoryPolicy`, `jsonFirstEndscreenCardsJsonDomParityReport`, `jsonFirstEndscreenCardsDomOnlyPolicy`, `jsonFirstEndscreenCardsWhitelistModeReport`, `jsonFirstEndscreenCardsPlayerOverlayPolicy`, `jsonFirstEndscreenCardsNoWorkBudget`, `jsonFirstEndscreenCardsCacheInvalidationReport`, `jsonFirstEndscreenCardsRoutePolicy`, `jsonFirstEndscreenCardsSettingsParityReport`, `jsonFirstEndscreenCardsFixtureProvenance`, or `jsonFirstEndscreenCardsMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideTopHeader boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideTopHeader boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_TOP_HEADER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-top-header-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /top-header toggle/);
  assert.match(doc, /topbar JSON pass-through/);
  assert.match(doc, /masthead DOM parity/);
  assert.match(doc, /endpoint no-work/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-endscreen-cards proof into hide-top-header proof/);
  assert.match(doc, /6 hideTopHeader boundary source files/);
  assert.match(doc, /9 hideTopHeader source\/effect blocks/);
  assert.match(doc, /10 seed active JSON rules block lines/);
  assert.match(doc, /634 seed active JSON rules block bytes/);
  assert.match(doc, /7 DOM fallback top-header CSS rules block lines/);
  assert.match(doc, /162 DOM fallback top-header CSS rules block bytes/);
  assert.match(doc, /3 settings_shared top-header compile block lines/);
  assert.match(doc, /146 settings_shared top-header compile block bytes/);
  assert.match(doc, /0 filter_logic total hideTopHeader tokens/);
  assert.match(doc, /0 seed total hideTopHeader tokens/);
  assert.match(doc, /2 DOM fallback total hideTopHeader tokens/);
  assert.match(doc, /12 background total hideTopHeader tokens/);
  assert.match(doc, /23 settings_shared total hideTopHeader tokens/);
  assert.match(doc, /1 bridge_settings total hideTopHeader token/);
  assert.match(doc, /0 filter_logic total desktopTopbarRenderer tokens/);
  assert.match(doc, /0 filter_logic total topbarRenderer tokens/);
  assert.match(doc, /1 DOM fallback total #masthead-container token/);
  assert.match(doc, /6 runtime hideTopHeader fixtures/);
  assert.match(doc, /does not remove JSON topbar objects or neighboring watch rows/);
  assert.match(doc, /ordinary keyword rules can remove a matching watch row while topbar JSON remains/);
  assert.match(doc, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideTopHeader` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `#masthead-container`/);
  assert.match(doc, /`jsonFirstHideTopHeaderContract`, `jsonFirstHideTopHeaderDecisionReport`, `jsonFirstTopHeaderRendererInventoryPolicy`, `jsonFirstTopHeaderJsonDomParityReport`, `jsonFirstTopHeaderDomOnlyPolicy`, `jsonFirstTopHeaderNoWorkBudget`, `jsonFirstTopHeaderCacheInvalidationReport`, `jsonFirstTopHeaderRoutePolicy`, `jsonFirstTopHeaderSettingsParityReport`, `jsonFirstTopHeaderFixtureProvenance`, or `jsonFirstTopHeaderMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideNotificationBell boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideNotificationBell boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_NOTIFICATION_BELL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-notification-bell-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /notification-bell toggle/);
  assert.match(doc, /notificationRenderer traversal/);
  assert.match(doc, /topbar notification JSON pass-through/);
  assert.match(doc, /DOM parity/);
  assert.match(doc, /endpoint no-work/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-top-header proof into hide-notification-bell proof/);
  assert.match(doc, /6 hideNotificationBell boundary source files/);
  assert.match(doc, /10 hideNotificationBell source\/effect blocks/);
  assert.match(doc, /17 filter_logic notificationRenderer rule block lines/);
  assert.match(doc, /899 filter_logic notificationRenderer rule block bytes/);
  assert.match(doc, /8 DOM fallback notification-bell CSS rules block lines/);
  assert.match(doc, /248 DOM fallback notification-bell CSS rules block bytes/);
  assert.match(doc, /2 settings_shared notification-bell compile block lines/);
  assert.match(doc, /102 settings_shared notification-bell compile block bytes/);
  assert.match(doc, /0 filter_logic total hideNotificationBell tokens/);
  assert.match(doc, /0 seed total hideNotificationBell tokens/);
  assert.match(doc, /2 DOM fallback total hideNotificationBell tokens/);
  assert.match(doc, /12 background total hideNotificationBell tokens/);
  assert.match(doc, /23 settings_shared total hideNotificationBell tokens/);
  assert.match(doc, /1 bridge_settings total hideNotificationBell token/);
  assert.match(doc, /1 filter_logic total notificationRenderer token/);
  assert.match(doc, /0 seed total notificationRenderer tokens/);
  assert.match(doc, /1 DOM fallback total ytd-notification-topbar-button-renderer token/);
  assert.match(doc, /1 DOM fallback total ytd-notification-topbar-button-shape-renderer token/);
  assert.match(doc, /6 runtime hideNotificationBell fixtures/);
  assert.match(doc, /does not remove JSON topbar notification button objects or `notificationRenderer` rows/);
  assert.match(doc, /ordinary keyword rules can remove a matching `notificationRenderer` row while topbar notification button JSON remains/);
  assert.match(doc, /`\/youtubei\/v1\/next` still enters `processData` and does not run harvest-only with only `hideNotificationBell` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `ytd-notification-topbar-button-renderer` and `ytd-notification-topbar-button-shape-renderer`/);
  assert.match(doc, /`jsonFirstHideNotificationBellContract`, `jsonFirstHideNotificationBellDecisionReport`, `jsonFirstNotificationBellRendererInventoryPolicy`, `jsonFirstNotificationBellJsonDomParityReport`, `jsonFirstNotificationBellDomOnlyPolicy`, `jsonFirstNotificationBellNoWorkBudget`, `jsonFirstNotificationBellCacheInvalidationReport`, `jsonFirstNotificationBellRoutePolicy`, `jsonFirstNotificationBellSettingsParityReport`, `jsonFirstNotificationBellFixtureProvenance`, or `jsonFirstNotificationBellMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideExploreTrending boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideExploreTrending boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_EXPLORE_TRENDING_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-explore-trending-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /explore-trending navigation toggle/);
  assert.match(doc, /guide JSON pass-through/);
  assert.match(doc, /browse route no-work/);
  assert.match(doc, /DOM parity/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-notification-bell proof into hide-explore-trending proof/);
  assert.match(doc, /6 hideExploreTrending boundary source files/);
  assert.match(doc, /9 hideExploreTrending source\/effect blocks/);
  assert.match(doc, /9 DOM fallback explore-trending CSS rules block lines/);
  assert.match(doc, /297 DOM fallback explore-trending CSS rules block bytes/);
  assert.match(doc, /1 settings_shared explore-trending compile block line/);
  assert.match(doc, /56 settings_shared explore-trending compile block bytes/);
  assert.match(doc, /0 filter_logic total hideExploreTrending tokens/);
  assert.match(doc, /0 seed total hideExploreTrending tokens/);
  assert.match(doc, /2 DOM fallback total hideExploreTrending tokens/);
  assert.match(doc, /12 background total hideExploreTrending tokens/);
  assert.match(doc, /23 settings_shared total hideExploreTrending tokens/);
  assert.match(doc, /1 bridge_settings total hideExploreTrending token/);
  assert.match(doc, /0 filter_logic total guideEntryRenderer tokens/);
  assert.match(doc, /0 filter_logic total compactLinkRenderer tokens/);
  assert.match(doc, /1 DOM fallback total \/feed\/explore token/);
  assert.match(doc, /1 DOM fallback total \/feed\/trending token/);
  assert.match(doc, /1 DOM fallback total ytd-browse\[page-subtype="trending"\] token/);
  assert.match(doc, /6 runtime hideExploreTrending fixtures/);
  assert.match(doc, /does not remove JSON Explore\/Trending guide entries or neighboring supported rows/);
  assert.match(doc, /ordinary keyword rules can remove a neighboring supported row while Explore\/Trending guide JSON remains/);
  assert.match(doc, /`\/youtubei\/v1\/browse` still enters `processData` and does not run harvest-only with only `hideExploreTrending` enabled on `\/feed\/explore`/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `\/feed\/explore`, `\/feed\/trending`, and `ytd-browse\[page-subtype="trending"\]`/);
  assert.match(doc, /`jsonFirstHideExploreTrendingContract`, `jsonFirstHideExploreTrendingDecisionReport`, `jsonFirstExploreTrendingRendererInventoryPolicy`, `jsonFirstExploreTrendingJsonDomParityReport`, `jsonFirstExploreTrendingDomOnlyPolicy`, `jsonFirstExploreTrendingNoWorkBudget`, `jsonFirstExploreTrendingCacheInvalidationReport`, `jsonFirstExploreTrendingRoutePolicy`, `jsonFirstExploreTrendingSettingsParityReport`, `jsonFirstExploreTrendingFixtureProvenance`, or `jsonFirstExploreTrendingMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideMoreFromYouTube boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideMoreFromYouTube boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_MORE_FROM_YOUTUBE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-more-from-youtube-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /more-from-youtube navigation toggle/);
  assert.match(doc, /guide-section JSON pass-through/);
  assert.match(doc, /guide endpoint no-work/);
  assert.match(doc, /DOM parity/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-explore-trending proof into hide-more-from-youtube proof/);
  assert.match(doc, /6 hideMoreFromYouTube boundary source files/);
  assert.match(doc, /9 hideMoreFromYouTube source\/effect blocks/);
  assert.match(doc, /7 DOM fallback more-from-youtube CSS rules block lines/);
  assert.match(doc, /205 DOM fallback more-from-youtube CSS rules block bytes/);
  assert.match(doc, /1 settings_shared more-from-youtube compile block line/);
  assert.match(doc, /56 settings_shared more-from-youtube compile block bytes/);
  assert.match(doc, /0 filter_logic total hideMoreFromYouTube tokens/);
  assert.match(doc, /0 seed total hideMoreFromYouTube tokens/);
  assert.match(doc, /2 DOM fallback total hideMoreFromYouTube tokens/);
  assert.match(doc, /12 background total hideMoreFromYouTube tokens/);
  assert.match(doc, /23 settings_shared total hideMoreFromYouTube tokens/);
  assert.match(doc, /1 bridge_settings total hideMoreFromYouTube token/);
  assert.match(doc, /1 filter_logic total guideSectionRenderer token/);
  assert.match(doc, /0 filter_logic total guideEntryRenderer tokens/);
  assert.match(doc, /0 filter_logic total compactLinkRenderer tokens/);
  assert.match(doc, /2 DOM fallback total ytd-guide-section-renderer tokens/);
  assert.match(doc, /1 DOM fallback total nth-last-child\(2\) token/);
  assert.match(doc, /6 runtime hideMoreFromYouTube fixtures/);
  assert.match(doc, /does not remove JSON More from YouTube guide sections or neighboring supported rows/);
  assert.match(doc, /ordinary keyword rules can remove a neighboring supported row while More from YouTube guide JSON remains/);
  assert.match(doc, /`\/youtubei\/v1\/guide` still enters `processData` and does not run harvest-only with only `hideMoreFromYouTube` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `#sections > ytd-guide-section-renderer:nth-last-child\(2\)`/);
  assert.match(doc, /`jsonFirstHideMoreFromYouTubeContract`, `jsonFirstHideMoreFromYouTubeDecisionReport`, `jsonFirstMoreFromYouTubeRendererInventoryPolicy`, `jsonFirstMoreFromYouTubeJsonDomParityReport`, `jsonFirstMoreFromYouTubeDomOnlyPolicy`, `jsonFirstMoreFromYouTubeNoWorkBudget`, `jsonFirstMoreFromYouTubeCacheInvalidationReport`, `jsonFirstMoreFromYouTubeRoutePolicy`, `jsonFirstMoreFromYouTubeSettingsParityReport`, `jsonFirstMoreFromYouTubeFixtureProvenance`, or `jsonFirstMoreFromYouTubeMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideSubscriptions boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideSubscriptions boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_SUBSCRIPTIONS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-subscriptions-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /subscriptions navigation toggle/);
  assert.match(doc, /guide-section JSON pass-through/);
  assert.match(doc, /guide endpoint no-work/);
  assert.match(doc, /DOM parity/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-more-from-youtube proof into hide-subscriptions proof/);
  assert.match(doc, /6 hideSubscriptions boundary source files/);
  assert.match(doc, /9 hideSubscriptions source\/effect blocks/);
  assert.match(doc, /9 DOM fallback subscriptions CSS rules block lines/);
  assert.match(doc, /437 DOM fallback subscriptions CSS rules block bytes/);
  assert.match(doc, /1 settings_shared subscriptions compile block line/);
  assert.match(doc, /52 settings_shared subscriptions compile block bytes/);
  assert.match(doc, /0 filter_logic total hideSubscriptions tokens/);
  assert.match(doc, /0 seed total hideSubscriptions tokens/);
  assert.match(doc, /2 DOM fallback total hideSubscriptions tokens/);
  assert.match(doc, /12 background total hideSubscriptions tokens/);
  assert.match(doc, /23 settings_shared total hideSubscriptions tokens/);
  assert.match(doc, /1 bridge_settings total hideSubscriptions token/);
  assert.match(doc, /1 filter_logic total guideSectionRenderer token/);
  assert.match(doc, /0 filter_logic total guideEntryRenderer tokens/);
  assert.match(doc, /0 filter_logic total compactLinkRenderer tokens/);
  assert.match(doc, /2 DOM fallback total ytd-guide-section-renderer tokens/);
  assert.match(doc, /1 DOM fallback subscriptions CSS block \/feed\/subscriptions token/);
  assert.match(doc, /1 DOM fallback subscriptions CSS block page-subtype="subscriptions" token/);
  assert.match(doc, /1 DOM fallback subscriptions CSS block ytd-guide-collapsible-section-entry-renderer token/);
  assert.match(doc, /3 DOM fallback subscriptions CSS block :has\( tokens/);
  assert.match(doc, /1 DOM fallback subscriptions CSS block \/feed\/history token/);
  assert.match(doc, /1 DOM fallback subscriptions CSS block a\[href\^="\/@"\] token/);
  assert.match(doc, /6 runtime hideSubscriptions fixtures/);
  assert.match(doc, /does not remove JSON Subscriptions guide sections or neighboring supported rows/);
  assert.match(doc, /ordinary keyword rules can remove a neighboring supported row while Subscriptions guide JSON remains/);
  assert.match(doc, /`\/youtubei\/v1\/guide` still enters `processData` and does not run harvest-only with only `hideSubscriptions` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `\.yt-simple-endpoint\[href\^="\/feed\/subscriptions"\]`/);
  assert.match(doc, /`ytd-browse\[page-subtype="subscriptions"\]`/);
  assert.match(doc, /`jsonFirstHideSubscriptionsContract`, `jsonFirstHideSubscriptionsDecisionReport`, `jsonFirstSubscriptionsRendererInventoryPolicy`, `jsonFirstSubscriptionsJsonDomParityReport`, `jsonFirstSubscriptionsDomOnlyPolicy`, `jsonFirstSubscriptionsNoWorkBudget`, `jsonFirstSubscriptionsCacheInvalidationReport`, `jsonFirstSubscriptionsRoutePolicy`, `jsonFirstSubscriptionsSettingsParityReport`, `jsonFirstSubscriptionsFixtureProvenance`, or `jsonFirstSubscriptionsMetricArtifact`/);
});

test('objective coverage ledger records JSON-first hideSearchShelves boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first hideSearchShelves boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_SEARCH_SHELVES_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-search-shelves-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /search-shelves toggle/);
  assert.match(doc, /search shelf JSON pass-through/);
  assert.match(doc, /search endpoint harvest-only behavior/);
  assert.match(doc, /DOM parity/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-subscriptions proof into hide-search-shelves proof/);
  assert.match(doc, /6 hideSearchShelves boundary source files/);
  assert.match(doc, /12 hideSearchShelves source\/effect blocks/);
  assert.match(doc, /3 filter_logic shelfRenderer rule block lines/);
  assert.match(doc, /103 filter_logic shelfRenderer rule block bytes/);
  assert.match(doc, /3 filter_logic richShelfRenderer rule block lines/);
  assert.match(doc, /93 filter_logic richShelfRenderer rule block bytes/);
  assert.match(doc, /48 seed search skip block lines/);
  assert.match(doc, /2438 seed search skip block bytes/);
  assert.match(doc, /8 DOM fallback search-shelves CSS rules block lines/);
  assert.match(doc, /314 DOM fallback search-shelves CSS rules block bytes/);
  assert.match(doc, /1 settings_shared search-shelves compile block line/);
  assert.match(doc, /51 settings_shared search-shelves compile block bytes/);
  assert.match(doc, /0 filter_logic total hideSearchShelves tokens/);
  assert.match(doc, /0 seed total hideSearchShelves tokens/);
  assert.match(doc, /2 DOM fallback total hideSearchShelves tokens/);
  assert.match(doc, /12 background total hideSearchShelves tokens/);
  assert.match(doc, /23 settings_shared total hideSearchShelves tokens/);
  assert.match(doc, /1 bridge_settings total hideSearchShelves token/);
  assert.match(doc, /2 filter_logic total shelfRenderer tokens/);
  assert.match(doc, /2 filter_logic total richShelfRenderer tokens/);
  assert.match(doc, /0 filter_logic total gridShelfViewModel tokens/);
  assert.match(doc, /1 seed total shelfRenderer token/);
  assert.match(doc, /1 seed total richShelfRenderer token/);
  assert.match(doc, /1 seed total gridShelfViewModel token/);
  assert.match(doc, /13 DOM fallback total ytd-shelf-renderer tokens/);
  assert.match(doc, /2 DOM fallback total ytd-horizontal-card-list-renderer tokens/);
  assert.match(doc, /7 runtime hideSearchShelves fixtures/);
  assert.match(doc, /does not remove JSON search shelves or neighboring supported rows/);
  assert.match(doc, /ordinary keyword rules can remove a matching `shelfRenderer` while Search Shelves JSON control remains unrelated to that removal/);
  assert.match(doc, /`\/youtubei\/v1\/search` runs harvest-only and does not call `processData` with only `hideSearchShelves` enabled on `\/results`/);
  assert.match(doc, /`\/youtubei\/v1\/search` enters `processData` when an ordinary keyword rule is active with `hideSearchShelves` enabled/);
  assert.match(doc, /background reads and compiles the setting but storage-change invalidation omits it/);
  assert.match(doc, /content bridge storage refresh includes it/);
  assert.match(doc, /DOM fallback owns `#primary > \.ytd-two-column-search-results-renderer ytd-shelf-renderer`/);
  assert.match(doc, /`#primary > \.ytd-two-column-search-results-renderer ytd-horizontal-card-list-renderer`/);
  assert.match(doc, /`jsonFirstHideSearchShelvesContract`, `jsonFirstHideSearchShelvesDecisionReport`, `jsonFirstSearchShelvesRendererInventoryPolicy`, `jsonFirstSearchShelvesJsonDomParityReport`, `jsonFirstSearchShelvesDomOnlyPolicy`, `jsonFirstSearchShelvesNoWorkBudget`, `jsonFirstSearchShelvesCacheInvalidationReport`, `jsonFirstSearchShelvesRoutePolicy`, `jsonFirstSearchShelvesSettingsParityReport`, `jsonFirstSearchShelvesFixtureProvenance`, or `jsonFirstSearchShelvesMetricArtifact`/);
});

test('objective coverage ledger records JSON-first disableAutoplay/disableAnnotations boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first disableAutoplay\/disableAnnotations boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_DISABLE_AUTOPLAY_ANNOTATIONS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-disable-autoplay-annotations-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /player-control toggle/);
  assert.match(doc, /compact autoplay JSON pass-through/);
  assert.match(doc, /watch-next endpoint work/);
  assert.match(doc, /DOM parity/);
  assert.match(doc, /content bridge refresh/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /hide-search-shelves proof into player-control proof/);
  assert.match(doc, /6 disableAutoplay\/disableAnnotations boundary source files/);
  assert.match(doc, /10 disableAutoplay\/disableAnnotations source\/effect blocks/);
  assert.match(doc, /8 filter_logic shared video renderer rules block lines/);
  assert.match(doc, /415 filter_logic shared video renderer rules block bytes/);
  assert.match(doc, /8 DOM fallback autoplay CSS rules block lines/);
  assert.match(doc, /235 DOM fallback autoplay CSS rules block bytes/);
  assert.match(doc, /8 DOM fallback annotations CSS rules block lines/);
  assert.match(doc, /185 DOM fallback annotations CSS rules block bytes/);
  assert.match(doc, /2 settings_shared disable controls compile block lines/);
  assert.match(doc, /102 settings_shared disable controls compile block bytes/);
  assert.match(doc, /0 filter_logic total disableAutoplay tokens/);
  assert.match(doc, /0 filter_logic total disableAnnotations tokens/);
  assert.match(doc, /0 seed total disableAutoplay tokens/);
  assert.match(doc, /0 seed total disableAnnotations tokens/);
  assert.match(doc, /1 DOM fallback total disableAutoplay token/);
  assert.match(doc, /1 DOM fallback total disableAnnotations token/);
  assert.match(doc, /12 background total disableAutoplay tokens/);
  assert.match(doc, /12 background total disableAnnotations tokens/);
  assert.match(doc, /23 settings_shared total disableAutoplay tokens/);
  assert.match(doc, /23 settings_shared total disableAnnotations tokens/);
  assert.match(doc, /1 bridge_settings total disableAutoplay token/);
  assert.match(doc, /1 bridge_settings total disableAnnotations token/);
  assert.match(doc, /0 filter_logic total compactAutoplayRenderer tokens/);
  assert.match(doc, /4 filter_logic total endScreenVideoRenderer tokens/);
  assert.match(doc, /6 runtime disableAutoplay\/disableAnnotations fixtures/);
  assert.match(doc, /compact autoplay and supported end-screen JSON rows pass through unchanged when only `disableAutoplay` and `disableAnnotations` are enabled/);
  assert.match(doc, /ordinary keyword rules can remove a matching supported `endScreenVideoRenderer` while a matching `compactAutoplayRenderer` remains/);
  assert.match(doc, /`\/youtubei\/v1\/next` still enters `processData` with only both disable controls enabled/);
  assert.match(doc, /background reads and compiles both settings but storage-change invalidation omits both/);
  assert.match(doc, /content bridge storage refresh includes both/);
  assert.match(doc, /DOM fallback owns `button\[data-tooltip-target-id="ytp-autonav-toggle-button"\]`, `\.autonav-endscreen`, `\.annotation`, and `\.iv-branding`/);
  assert.match(doc, /`jsonFirstDisableAutoplayAnnotationsContract`, `jsonFirstDisableAutoplayAnnotationsDecisionReport`, `jsonFirstPlayerControlRendererInventoryPolicy`, `jsonFirstPlayerControlJsonDomParityReport`, `jsonFirstPlayerControlDomOnlyPolicy`, `jsonFirstCompactAutoplayGapReport`, `jsonFirstPlayerControlNoWorkBudget`, `jsonFirstPlayerControlCacheInvalidationReport`, `jsonFirstPlayerControlRoutePolicy`, `jsonFirstPlayerControlSettingsParityReport`, `jsonFirstPlayerControlFixtureProvenance`, or `jsonFirstPlayerControlMetricArtifact`/);
});

test('objective coverage ledger records enabled master switch disabled-runtime boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Enabled master switch disabled-runtime boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_ENABLED_MASTER_SWITCH_DISABLED_RUNTIME_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/enabled-master-switch-disabled-runtime-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /dedicated `enabled` master-switch proof/);
  assert.match(doc, /7 enabled disabled-runtime source files/);
  assert.match(doc, /14 source\/effect blocks/);
  assert.match(doc, /1 seed fetch matching response JSON decode site/);
  assert.match(doc, /2 seed fetch matching response stringify sites/);
  assert.match(doc, /5 seed processWithEngine disabled gate block lines/);
  assert.match(doc, /20 engine harvest-before-disabled block lines/);
  assert.match(doc, /68 DOM active-work predicate block lines/);
  assert.match(doc, /21 DOM disabled cleanup gate block lines/);
  assert.match(doc, /0 background storage invalidation `enabled` entries/);
  assert.match(doc, /1 content bridge storage refresh `enabled` entry/);
  assert.match(doc, /1 StateManager external reload `enabled` entry/);
  assert.match(doc, /disabled seed fetch parse\/stringify work without engine work/);
  assert.match(doc, /seed XHR pre-body disabled return/);
  assert.match(doc, /engine original-reference return after harvest ordering/);
  assert.match(doc, /DOM active-work and cleanup behavior/);
  assert.match(doc, /background invalidation omission/);
  assert.match(doc, /content\/UI refresh inclusion/);
  assert.match(doc, /`enabledMasterSwitchRuntimeContract`, `enabledDisabledNoWorkDecisionReport`, `enabledSeedTransportNoWorkBudget`, `enabledEngineHarvestBeforeSkipReport`, `enabledDomFallbackActiveGateReport`, `enabledSettingsRefreshParityReport`, `enabledBackgroundCacheInvalidationReport`, `enabledDisabledRuntimeFixtureProvenance`, `enabledDisabledRuntimeMetricArtifact`, or `enabledRuntimeAuthorityGate`/);
});

test('objective coverage ledger records stats surface legacy metric boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Stats surface legacy metric boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_STATS_SURFACE_LEGACY_METRIC_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/stats-surface-legacy-metric-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /source-pinned metric side-effect proof/);
  assert.match(doc, /6 stats metric boundary source files/);
  assert.match(doc, /14 source\/effect blocks/);
  assert.match(doc, /2 content bridge storage reads for stats in pinned blocks/);
  assert.match(doc, /1 content bridge storage write for stats in pinned blocks/);
  assert.match(doc, /1 background legacy stats storage read/);
  assert.match(doc, /1 background legacy stats storage write/);
  assert.match(doc, /1 StateManager external reload `stats` entry/);
  assert.match(doc, /0 StateManager external reload `statsBySurface` entries/);
  assert.match(doc, /2 dashboard stats rotation listener callsites/);
  assert.match(doc, /2 dashboard stats rotation timer callsites/);
  assert.match(doc, /DOM hide\/restore stats\/media coupling/);
  assert.match(doc, /content `statsBySurface` writes with Main legacy fallback/);
  assert.match(doc, /attribute-based restore accounting/);
  assert.match(doc, /raw legacy `recordTimeSaved` writes/);
  assert.match(doc, /StateManager reload drift/);
  assert.match(doc, /dashboard legacy fallback/);
  assert.match(doc, /JSON-first metric eligibility blockers/);
  assert.match(doc, /`statsSurfaceMetricBoundaryContract`, `statsSideEffectAuthority`, `statsStructuredHideDecisionReport`, `statsLegacyRecordTimeSavedGate`, `statsSurfaceRefreshParityReport`, `statsStorageWriteBudget`, `statsDashboardFallbackDecision`, `statsNoRuleMetricEligibilityReport`, `statsMediaSideEffectSeparationReport`, or `statsMetricArtifact`/);
});

test('objective coverage ledger records prompt release overlay boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Prompt release overlay boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_PROMPT_RELEASE_OVERLAY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/prompt-release-overlay-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /source-pinned prompt owner proof/);
  assert.match(doc, /10 prompt release boundary source files/);
  assert.match(doc, /12 source\/effect blocks/);
  assert.match(doc, /4 browser manifest prompt load-order lists/);
  assert.match(doc, /2 prompt content modules/);
  assert.match(doc, /2 overlay prompt ids/);
  assert.match(doc, /5 background prompt action branches/);
  assert.match(doc, /24 release note data entries/);
  assert.match(doc, /23 release note version rows/);
  assert.match(doc, /staged newest release-note version `3\.3\.2`/);
  assert.match(doc, /packaged extension\/browser version `3\.3\.1`/);
  assert.match(doc, /release-before-first-run-before-content-bridge manifest order/);
  assert.match(doc, /install\/update first-run prompt injection/);
  assert.match(doc, /update release-note payload staging/);
  assert.match(doc, /top-right adjacent overlay placement/);
  assert.match(doc, /local mobile CSS/);
  assert.match(doc, /release and first-run acknowledgement storage writes/);
  assert.match(doc, /direct `request\?\.url` What's New tab opening/);
  assert.match(doc, /content fallback `window\.open`\/`location\.href`/);
  assert.match(doc, /dashboard release-note rendering/);
  assert.match(doc, /release-note\/public-claim drift/);
  assert.match(doc, /`promptReleaseOverlayBoundaryContract`, `promptCoordinatorDecisionReport`, `promptPriorityQueueContract`, `promptAckSenderClassGate`, `promptWhatsNewUrlPolicy`, `promptViewportFitReport`, `promptReleaseNoteVersionGate`, `promptStyleTeardownRegistry`, `promptInstallUpdateFixtureProvenance`, or `promptFirstClassJsonClaimGate`/);
});

test('objective coverage ledger records release build artifact claim boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Release build artifact claim boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_RELEASE_BUILD_ARTIFACT_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/release-build-artifact-claim-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /joined artifact-claim proof/);
  assert.match(doc, /9 release build artifact boundary source files/);
  assert.match(doc, /11 source\/effect blocks/);
  assert.match(doc, /browser\/package version `3\.3\.1`/);
  assert.match(doc, /staged newest release-note version `3\.3\.2`/);
  assert.match(doc, /24 release note data entries/);
  assert.match(doc, /23 release note version rows/);
  assert.match(doc, /broad package directories/);
  assert.match(doc, /common package files/);
  assert.match(doc, /README badge mutation/);
  assert.match(doc, /browser ZIP checksum absence/);
  assert.match(doc, /public non-draft release creation before asset upload proof/);
  assert.match(doc, /mobile `\.sha256` staging/);
  assert.match(doc, /0 package\/public-claim\/artifact manifests/);
  assert.match(doc, /codebase inspection is finding future optimization locations and first-class JSON filter blockers/);
  assert.match(doc, /`releaseBuildArtifactClaimContract`, `releasePackageManifestAuthority`, `releaseReadmeMutationGate`, `releaseDraftFirstGate`, `releaseAssetUploadRollbackPlan`, `releaseMobileArtifactClaimGate`, `releaseZipChecksumManifest`, `releaseGeneratedUiFreshnessGate`, `releaseBrowserManifestParityReport`, `releasePublicClaimFixtureProvenance`, or `releaseFirstClassJsonClaimGate`/);
});

test('objective coverage ledger records content control JSON-first boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Content control JSON-first boundary index addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_CONTROL_JSON_FIRST_BOUNDARY_INDEX_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/content-control-json-first-boundary-index-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /catalog-to-boundary index/);
  assert.match(doc, /4 content control JSON-first boundary source files/);
  assert.match(doc, /7 catalog groups/);
  assert.match(doc, /29 catalog controls/);
  assert.match(doc, /27 controls with JSON-first-named proof docs/);
  assert.match(doc, /27 unique proof docs/);
  assert.match(doc, /27 unique proof tests/);
  assert.match(doc, /2 runtime alias controls/);
  assert.match(doc, /27 direct runtime key controls/);
  assert.match(doc, /2 default-on affordance controls/);
  assert.match(doc, /catalog group sizes `core=3`, `feed=6`, `watch=4`, `video_info=6`, `player=4`, `navigation=5`, and `search=1`/);
  assert.match(doc, /every catalog key from `hideShorts` through `hideSearchShelves`/);
  assert.match(doc, /`hideShorts` maps to `hideAllShorts`/);
  assert.match(doc, /`hideComments` maps to `hideAllComments`/);
  assert.match(doc, /action affordances rather than JSON row-filter controls/);
  assert.match(doc, /StateManager external reload watches `hideAllShorts` and `hideAllComments`/);
  assert.match(doc, /background invalidation includes `hideAllShorts` and `hideComments` but not `hideAllComments` or `hideShorts`/);
  assert.match(doc, /`contentControlJsonFirstBoundaryIndex`, `contentControlRuntimeSettingContract`, `contentControlBoundaryProofManifest`, `contentControlAliasPolicy`, `contentControlJsonDomParityMatrix`, `contentControlNoWorkBudgetMatrix`, `contentControlSettingsInvalidationParityReport`, `contentControlFixtureProvenance`, or `contentControlFirstClassJsonGate`/);
});

test('objective coverage ledger records content control active-work matrix as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Content control active-work matrix addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_CONTROL_ACTIVE_WORK_MATRIX_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/content-control-active-work-matrix-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /work-permission proof/);
  assert.match(doc, /8 content control active-work matrix source files/);
  assert.match(doc, /12 source\/effect blocks/);
  assert.match(doc, /7 catalog groups/);
  assert.match(doc, /29 catalog controls/);
  assert.match(doc, /2 runtime alias controls/);
  assert.match(doc, /2 seed active JSON predicate controls/);
  assert.match(doc, /2 filter_logic direct content-control decision controls/);
  assert.match(doc, /25 DOM active gate controls/);
  assert.match(doc, /26 DOM style controls/);
  assert.match(doc, /4 background exact-runtime invalidation controls/);
  assert.match(doc, /1 background alias-only invalidation control/);
  assert.match(doc, /24 background omitted invalidation controls/);
  assert.match(doc, /29 content bridge refresh controls/);
  assert.match(doc, /29 StateManager reload controls/);
  assert.match(doc, /6 runtime content-control active-work matrix fixtures/);
  assert.match(doc, /seed JSON and filter_logic direct decisions admit only `hideAllShorts` and `hideAllComments`/);
  assert.match(doc, /DOM active gating omits `showQuickBlockButton`, `showBlockMenuItem`, `disableAutoplay`, and `disableAnnotations`/);
  assert.match(doc, /DOM style branches omit `hideShorts`, `showQuickBlockButton`, and `showBlockMenuItem`/);
  assert.match(doc, /background exact invalidation covers `hideAllShorts`, `hideHomeFeed`, `hideSponsoredCards`, and `hideMembersOnly`/);
  assert.match(doc, /`hideComments` is alias-only invalidation for runtime `hideAllComments`/);
  assert.match(doc, /content bridge plus StateManager watch all 29 controls without proving background cache freshness or JSON no-work behavior/);
  assert.match(doc, /`contentControlActiveWorkMatrixContract`, `contentControlJsonWorkDecision`, `contentControlDomWorkDecision`, `contentControlRuntimeKeyManifest`, `contentControlNoWorkBudgetReport`, `contentControlBackgroundInvalidationPolicy`, `contentControlAffordanceWorkPolicy`, `contentControlPlayerDomOnlyPolicy`, `contentControlOptimizationMetricArtifact`, `contentControlActiveWorkFixtureProvenance`, or `contentControlFirstClassJsonPromotionGate`/);
});

test('objective coverage ledger records content control DOM style selector matrix as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Content control DOM style selector matrix addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_CONTROL_DOM_STYLE_SELECTOR_MATRIX_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/content-control-dom-style-selector-matrix-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /selector\/effect proof/);
  assert.match(doc, /2 content-control DOM style selector matrix source files/);
  assert.match(doc, /27 source\/effect blocks/);
  assert.match(doc, /7 catalog groups/);
  assert.match(doc, /29 catalog controls/);
  assert.match(doc, /26 controls that can affect DOM style output/);
  assert.match(doc, /25 direct style selector branches/);
  assert.match(doc, /3 catalog controls without DOM style branch/);
  assert.match(doc, /1 catalog control resolved through DOM style runtime alias/);
  assert.match(doc, /5 unconditional mobile open-app selector rows/);
  assert.match(doc, /111 control-gated selector rows/);
  assert.match(doc, /116 total selector rows/);
  assert.match(doc, /46 `:has\(\)` selector tokens/);
  assert.match(doc, /5 `:not\(:has\(\.\.\.\)\)` selector tokens/);
  assert.match(doc, /6 runtime content-control DOM style selector matrix fixtures/);
  assert.match(doc, /`ensureContentControlStyles\(\)` has 345 lines and 12583 bytes/);
  assert.match(doc, /`hideMembersOnly` is the largest branch with 31 selector rows/);
  assert.match(doc, /catalog `hideComments` maps to runtime `hideAllComments`/);
  assert.match(doc, /explicit `hideAskButton` and `hideMerchTicketsOffers` are not directly wrapped by `listMode !== 'whitelist'`/);
  assert.match(doc, /`contentControlDomStyleSelectorMatrix`, `contentControlDomStyleSelectorManifest`, `contentControlStyleSelectorOwnerReport`, `contentControlStyleSelectorEffectDecision`, `contentControlStyleRestoreProof`, `contentControlStyleSiblingFixtureReport`, `contentControlHasSelectorSupportPolicy`, `contentControlStyleNoWorkBudget`, `contentControlStyleMetricArtifact`, or `contentControlStyleFirstClassJsonGate`/);
});

test('objective coverage ledger records content control DOM style lifecycle restore as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Content control DOM style lifecycle restore addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_CONTROL_DOM_STYLE_LIFECYCLE_RESTORE_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/content-control-dom-style-lifecycle-restore-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /style lifecycle and restore proof/);
  assert.match(doc, /1 content-control DOM style lifecycle source file/);
  assert.match(doc, /6 source\/effect blocks/);
  assert.match(doc, /345 ensureContentControlStyles block lines/);
  assert.match(doc, /12583 ensureContentControlStyles bytes/);
  assert.match(doc, /68 hasActiveDOMFallbackWork block lines/);
  assert.match(doc, /2333 hasActiveDOMFallbackWork bytes/);
  assert.match(doc, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(doc, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(doc, /14 no-active cleanup branch lines/);
  assert.match(doc, /629 no-active cleanup branch bytes/);
  assert.match(doc, /21 disabled cleanup branch lines/);
  assert.match(doc, /959 disabled cleanup branch bytes/);
  assert.match(doc, /26 style writer rules\.push callsites/);
  assert.match(doc, /1 style writer textContent assignment/);
  assert.match(doc, /0 style writer rules\.length empty-state gates/);
  assert.match(doc, /0 clear-stale style node removal callsites/);
  assert.match(doc, /6 runtime content-control DOM style lifecycle fixtures/);
  assert.match(doc, /writer creates one reusable `#filtertube-content-controls-style` node/);
  assert.match(doc, /active writer calls always retain unconditional mobile open-app cleanup CSS/);
  assert.match(doc, /no-active branch can return before `ensureContentControlStyles\(\)` runs/);
  assert.match(doc, /`enabled === false`, `disableAutoplay` alone, and `disableAnnotations` alone are not active DOM fallback work/);
  assert.match(doc, /stale cleanup blanks the shared style node without removing it/);
  assert.match(doc, /`contentControlStyleLifecycleRestoreMatrix`, `contentControlStyleNodeLifecycleReport`, `contentControlStyleRestoreProof`, `contentControlStyleRouteAttributeReport`, `contentControlStyleNoActiveCleanupBudget`, `contentControlStyleDisabledCleanupBudget`, `contentControlStyleOpenAppCleanupPolicy`, `contentControlStyleRegenDecisionReport`, `contentControlStyleNoWorkMetricArtifact`, or `contentControlStyleJsonFirstParityGate`/);
});

test('objective coverage ledger records open app cleanup boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Open App cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_OPEN_APP_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/open-app-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct Open App cleanup proof/);
  assert.match(doc, /1 open-app cleanup boundary source file/);
  assert.match(doc, /4 source\/effect blocks/);
  assert.match(doc, /345 ensureContentControlStyles block lines/);
  assert.match(doc, /12583 ensureContentControlStyles bytes/);
  assert.match(doc, /22 hideYouTubeOpenAppButtons block lines/);
  assert.match(doc, /961 hideYouTubeOpenAppButtons block bytes/);
  assert.match(doc, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(doc, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(doc, /21 disabled cleanup branch lines/);
  assert.match(doc, /959 disabled cleanup branch bytes/);
  assert.match(doc, /1 direct querySelectorAll callsite/);
  assert.match(doc, /1 direct selector literal callsite/);
  assert.match(doc, /5 Open App classification predicates/);
  assert.match(doc, /1 inline `display:none!important` write/);
  assert.match(doc, /0 shared `toggleVisibility\(\)` callsites/);
  assert.match(doc, /5 style-writer Open App CSS selector rows/);
  assert.match(doc, /0 clear-stale marker references/);
  assert.match(doc, /0 disabled-cleanup marker references/);
  assert.match(doc, /1 product runtime marker reference/);
  assert.match(doc, /6 runtime open-app cleanup fixtures/);
  assert.match(doc, /style writer emits Open App CSS and calls direct cleanup once/);
  assert.match(doc, /fake DOM execution hides label, `intent:\/\/`, `youtube:\/\/`, `open_app`, and Play Store candidates/);
  assert.match(doc, /wrapper targets are hidden when `closest\('ytm-button-renderer'\)` succeeds/);
  assert.match(doc, /safe candidates remain visible/);
  assert.match(doc, /query failures are swallowed/);
  assert.match(doc, /no restore owner for `data-filtertube-hidden-open-app`/);
  assert.match(doc, /`openAppCleanupBoundaryContract`, `openAppCleanupDecisionReport`, `openAppCleanupRestoreProof`, `openAppCleanupSelectorPolicy`, `openAppCleanupSettingsGate`, `openAppCleanupRoutePolicy`, `openAppCleanupMetricArtifact`, `openAppCleanupShellVsContentPolicy`, `openAppCleanupNoWorkBudget`, or `openAppCleanupJsonParityGate`/);
});

test('objective coverage ledger records members-only DOM cleanup boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Members-only DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_MEMBERS_ONLY_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/members-only-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct Members-only DOM cleanup proof/);
  assert.match(doc, /1 members-only DOM cleanup boundary source file/);
  assert.match(doc, /5 source\/effect blocks/);
  assert.match(doc, /345 ensureContentControlStyles block lines/);
  assert.match(doc, /12583 ensureContentControlStyles bytes/);
  assert.match(doc, /41 members-only CSS block lines/);
  assert.match(doc, /2483 members-only CSS block bytes/);
  assert.match(doc, /81 members-only direct cleanup block lines/);
  assert.match(doc, /5060 members-only direct cleanup block bytes/);
  assert.match(doc, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(doc, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(doc, /21 disabled cleanup branch lines/);
  assert.match(doc, /959 disabled cleanup branch bytes/);
  assert.match(doc, /1 CSS rules\.push callsite/);
  assert.match(doc, /1 CSS display-none declaration/);
  assert.match(doc, /11 CSS membership class tokens/);
  assert.match(doc, /9 CSS `Members only` tokens/);
  assert.match(doc, /9 CSS `Member-only` tokens/);
  assert.match(doc, /1 CSS watch-shell selector/);
  assert.match(doc, /2 CSS `list=UUMO` tokens/);
  assert.match(doc, /5 direct querySelectorAll callsites/);
  assert.match(doc, /5 direct forEach callsites/);
  assert.match(doc, /5 direct inline display writes/);
  assert.match(doc, /5 generic marker writes/);
  assert.match(doc, /5 specialized marker writes/);
  assert.match(doc, /1 local display restore callsite/);
  assert.match(doc, /1 specialized marker removal callsite/);
  assert.match(doc, /5 direct closest callsites/);
  assert.match(doc, /0 clear-stale specialized marker references/);
  assert.match(doc, /0 disabled-cleanup specialized marker references/);
  assert.match(doc, /7 product runtime specialized marker references/);
  assert.match(doc, /1 product runtime specialized marker removal callsite/);
  assert.match(doc, /6 runtime members-only DOM cleanup fixtures/);
  assert.match(doc, /fake DOM execution hides title-aria, membership-badge, `UUMO` link, and shelf-title evidence/);
  assert.match(doc, /badge cleanup hides both an immediate host and a parent shelf/);
  assert.match(doc, /non-membership badge host stays visible/);
  assert.match(doc, /local toggle-off removes inline display and both generic and specialized markers/);
  assert.match(doc, /stale cleanup plus disabled cleanup omit the specialized Members-only marker/);
  assert.match(doc, /`membersOnlyDomCleanupBoundaryContract`, `membersOnlyDomCleanupDecisionReport`, `membersOnlyDomCleanupRestoreProof`, `membersOnlyDomCleanupSelectorPolicy`, `membersOnlyDomCleanupTargetShapeReport`, `membersOnlyDomCleanupRoutePolicy`, `membersOnlyDomCleanupSiblingFixture`, `membersOnlyDomCleanupStaleCleanupBudget`, `membersOnlyDomCleanupMetricArtifact`, or `membersOnlyDomCleanupJsonParityGate`/);
});

test('objective coverage ledger records playlist/Mix DOM cleanup boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Playlist\/Mix DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_PLAYLIST_MIX_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/playlist-mix-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct playlist\/Mix DOM cleanup proof/);
  assert.match(doc, /1 playlist\/Mix DOM cleanup boundary source file/);
  assert.match(doc, /8 source\/effect blocks/);
  assert.match(doc, /345 ensureContentControlStyles block lines/);
  assert.match(doc, /12583 ensureContentControlStyles bytes/);
  assert.match(doc, /16 playlist-card CSS block lines/);
  assert.match(doc, /998 playlist-card CSS block bytes/);
  assert.match(doc, /15 Mix CSS block lines/);
  assert.match(doc, /588 Mix CSS block bytes/);
  assert.match(doc, /48 playlist\/Mix direct cleanup block lines/);
  assert.match(doc, /2586 playlist\/Mix direct cleanup block bytes/);
  assert.match(doc, /26 playlist-card direct block lines/);
  assert.match(doc, /1457 playlist-card direct block bytes/);
  assert.match(doc, /21 Mix chip direct block lines/);
  assert.match(doc, /1127 Mix chip direct block bytes/);
  assert.match(doc, /13 Mix card decision block lines/);
  assert.match(doc, /564 Mix card decision block bytes/);
  assert.match(doc, /18 explicit marker guard block lines/);
  assert.match(doc, /1301 explicit marker guard block bytes/);
  assert.match(doc, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(doc, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(doc, /21 disabled cleanup branch lines/);
  assert.match(doc, /959 disabled cleanup branch bytes/);
  assert.match(doc, /7 runtime playlist\/Mix DOM cleanup fixtures/);
  assert.match(doc, /playlist CSS excludes Mix\/radio through `start_radio=1`/);
  assert.match(doc, /Mix CSS owns radio renderer and `start_radio=1` selectors/);
  assert.match(doc, /playlist direct cleanup hides valid non-radio collection-stack lockups and their shelf\/horizontal containers/);
  assert.match(doc, /Mix chip cleanup hides and restores only normalized Mixes chips/);
  assert.match(doc, /per-card decision path sets and removes `data-filtertube-hidden-by-mix-radio`/);
  assert.match(doc, /stale cleanup plus disabled cleanup omit that specialized Mix\/radio marker/);
  assert.match(doc, /`playlistMixDomCleanupBoundaryContract`, `playlistMixDomCleanupDecisionReport`, `playlistMixDomCleanupRestoreProof`, `playlistMixDomCleanupSelectorPolicy`, `playlistMixDomCleanupTargetShapeReport`, `playlistMixDomCleanupInteractionPolicy`, `playlistMixDomCleanupStaleCleanupBudget`, `playlistMixDomCleanupDisabledRestoreProof`, `playlistMixDomCleanupMetricArtifact`, or `playlistMixDomCleanupJsonParityGate`/);
});

test('objective coverage ledger records home-feed DOM cleanup boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Home-feed DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_HOME_FEED_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/home-feed-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct home-feed DOM cleanup proof/);
  assert.match(doc, /1 home-feed DOM cleanup boundary source file/);
  assert.match(doc, /8 source\/effect blocks/);
  assert.match(doc, /345 ensureContentControlStyles block lines/);
  assert.match(doc, /12583 ensureContentControlStyles bytes/);
  assert.match(doc, /12 home-feed CSS block lines/);
  assert.match(doc, /622 home-feed CSS block bytes/);
  assert.match(doc, /23 home-feed fallback block lines/);
  assert.match(doc, /1286 home-feed fallback block bytes/);
  assert.match(doc, /68 active DOM fallback work block lines/);
  assert.match(doc, /2333 active DOM fallback work block bytes/);
  assert.match(doc, /14 no-active cleanup branch lines/);
  assert.match(doc, /629 no-active cleanup branch bytes/);
  assert.match(doc, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(doc, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(doc, /21 disabled cleanup branch lines/);
  assert.match(doc, /959 disabled cleanup branch bytes/);
  assert.match(doc, /1 home-feed fallback callsite block line/);
  assert.match(doc, /46 home-feed fallback callsite block bytes/);
  assert.match(doc, /8 runtime home-feed DOM cleanup fixtures/);
  assert.match(doc, /home-feed CSS contains desktop home selectors and mobile route-home selectors/);
  assert.match(doc, /fake DOM execution hides queried targets on `\/` when `hideHomeFeed` is true/);
  assert.match(doc, /writes `data-filtertube-hidden-by-hide-home-feed`/);
  assert.match(doc, /unmarked off-route targets remain untouched/);
  assert.match(doc, /previously marked off-route targets are restored/);
  assert.match(doc, /no-active branch can run stale cleanup before the style writer and home helper/);
  assert.match(doc, /stale cleanup plus disabled cleanup omit the specialized home-feed marker/);
  assert.match(doc, /`homeFeedDomCleanupBoundaryContract`, `homeFeedDomCleanupDecisionReport`, `homeFeedDomCleanupRestoreProof`, `homeFeedDomCleanupSelectorPolicy`, `homeFeedDomCleanupMarkerReport`, `homeFeedDomCleanupRoutePolicy`, `homeFeedDomCleanupMobileParityReport`, `homeFeedDomCleanupStaleCleanupBudget`, `homeFeedDomCleanupDisabledRestoreProof`, `homeFeedDomCleanupMetricArtifact`, or `homeFeedDomCleanupJsonParityGate`/);
});

test('objective coverage ledger records comments DOM cleanup boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Comments DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_COMMENTS_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/comments-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct comments DOM cleanup proof/);
  assert.match(doc, /1 comments DOM cleanup boundary source file/);
  assert.match(doc, /10 source\/effect blocks/);
  assert.match(doc, /345 ensureContentControlStyles block lines/);
  assert.match(doc, /12583 ensureContentControlStyles bytes/);
  assert.match(doc, /16 comments CSS block lines/);
  assert.match(doc, /671 comments CSS block bytes/);
  assert.match(doc, /30 collectMobileCommentEntryCards block lines/);
  assert.match(doc, /1386 collectMobileCommentEntryCards block bytes/);
  assert.match(doc, /42 comments global hide block lines/);
  assert.match(doc, /1934 comments global hide block bytes/);
  assert.match(doc, /17 comments restore\/input block lines/);
  assert.match(doc, /781 comments restore\/input block bytes/);
  assert.match(doc, /68 active DOM fallback work block lines/);
  assert.match(doc, /2333 active DOM fallback work block bytes/);
  assert.match(doc, /14 no-active cleanup branch lines/);
  assert.match(doc, /629 no-active cleanup branch bytes/);
  assert.match(doc, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(doc, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(doc, /21 disabled cleanup branch lines/);
  assert.match(doc, /959 disabled cleanup branch bytes/);
  assert.match(doc, /1 comments fallback callsite block line/);
  assert.match(doc, /46 comments fallback callsite block bytes/);
  assert.match(doc, /9 runtime comments DOM cleanup fixtures/);
  assert.match(doc, /mobile comments collector runs only on `\/watch`/);
  assert.match(doc, /promotes comment-looking candidates/);
  assert.match(doc, /writing `data-filtertube-mobile-comments-card`/);
  assert.match(doc, /global branch returns before reply renderers and modern comment view-model renderers are toggled/);
  assert.match(doc, /marker-only mobile cards without comment-looking text are skipped by local restore/);
  assert.match(doc, /whitelist mode locally restores containers and the composer/);
  assert.match(doc, /stale cleanup plus disabled cleanup omit the mobile comments marker/);
  assert.match(doc, /`commentsDomCleanupBoundaryContract`, `commentsDomCleanupDecisionReport`, `commentsDomCleanupRestoreProof`, `commentsDomCleanupSelectorPolicy`, `commentsDomCleanupMarkerReport`, `commentsDomCleanupRoutePolicy`, `commentsDomCleanupMobileParityReport`, `commentsDomCleanupWhitelistPolicy`, `commentsDomCleanupStaleCleanupBudget`, `commentsDomCleanupDisabledRestoreProof`, `commentsDomCleanupMetricArtifact`, or `commentsDomCleanupJsonParityGate`/);
});

test('objective coverage ledger records Shorts DOM cleanup boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Shorts DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SHORTS_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/shorts-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct Shorts DOM cleanup proof/);
  assert.match(doc, /1 Shorts DOM cleanup boundary source file/);
  assert.match(doc, /12 source\/effect blocks/);
  assert.match(doc, /68 active DOM fallback work block lines/);
  assert.match(doc, /2333 active DOM fallback work block bytes/);
  assert.match(doc, /14 no-active cleanup branch lines/);
  assert.match(doc, /629 no-active cleanup branch bytes/);
  assert.match(doc, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(doc, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(doc, /21 disabled cleanup branch lines/);
  assert.match(doc, /959 disabled cleanup branch bytes/);
  assert.match(doc, /29 Shorts collection block lines/);
  assert.match(doc, /1651 Shorts collection block bytes/);
  assert.match(doc, /22 Shorts container toggle block lines/);
  assert.match(doc, /1165 Shorts container toggle block bytes/);
  assert.match(doc, /29 disguised Shorts detection block lines/);
  assert.match(doc, /1409 disguised Shorts detection block bytes/);
  assert.match(doc, /54 Shorts selector\/extract block lines/);
  assert.match(doc, /2084 Shorts selector\/extract block bytes/);
  assert.match(doc, /141 Shorts card decision block lines/);
  assert.match(doc, /7008 Shorts card decision block bytes/);
  assert.match(doc, /91 container cleanup block lines/);
  assert.match(doc, /5464 container cleanup block bytes/);
  assert.match(doc, /24 home Shorts shelf cleanup block lines/);
  assert.match(doc, /1638 home Shorts shelf cleanup block bytes/);
  assert.match(doc, /18 search Shorts shelf cleanup block lines/);
  assert.match(doc, /1234 search Shorts shelf cleanup block bytes/);
  assert.match(doc, /9 runtime Shorts DOM cleanup fixtures/);
  assert.match(doc, /collection covers Shorts shelves, guide entries, and mobile nav entries/);
  assert.match(doc, /global Shorts hiding writes `data-filtertube-hidden-by-hide-all-shorts`/);
  assert.match(doc, /toggle-off restore is blocked by `data-filtertube-hidden-by-shelf-title`/);
  assert.match(doc, /disguised cards are stamped from Shorts href, `play short`, and `SHORTS` overlay evidence/);
  assert.match(doc, /target promotion can hide parent layout cells/);
  assert.match(doc, /video-id extraction can feed `videoChannelMap`/);
  assert.match(doc, /home\/search cleanup can hide empty Shorts shelves/);
  assert.match(doc, /stale cleanup includes the hide-all-Shorts marker/);
  assert.match(doc, /disabled cleanup omits a direct marker reference/);
  assert.match(doc, /`shortsDomCleanupBoundaryContract`, `shortsDomCleanupDecisionReport`, `shortsDomCleanupRestoreProof`, `shortsDomCleanupSelectorPolicy`, `shortsDomCleanupTargetShapeReport`, `shortsDomCleanupRoutePolicy`, `shortsDomCleanupMobileNavReport`, `shortsDomCleanupDisguisedPolicy`, `shortsDomCleanupVideoIdJoinDecision`, `shortsDomCleanupShelfDecisionReport`, `shortsDomCleanupStaleCleanupBudget`, `shortsDomCleanupDisabledRestoreProof`, `shortsDomCleanupMetricArtifact`, or `shortsDomCleanupJsonParityGate`/);
});

test('objective coverage ledger records sponsored-card DOM cleanup boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Sponsored Cards DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SPONSORED_CARDS_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/sponsored-cards-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct sponsored-card DOM cleanup proof/);
  assert.match(doc, /1 sponsored-card DOM cleanup boundary source file/);
  assert.match(doc, /6 source\/effect blocks/);
  assert.match(doc, /345 ensureContentControlStyles block lines/);
  assert.match(doc, /12583 ensureContentControlStyles bytes/);
  assert.match(doc, /15 sponsored-card CSS block lines/);
  assert.match(doc, /567 sponsored-card CSS block bytes/);
  assert.match(doc, /68 active DOM fallback work block lines/);
  assert.match(doc, /2333 active DOM fallback work block bytes/);
  assert.match(doc, /14 no-active cleanup branch lines/);
  assert.match(doc, /629 no-active cleanup branch bytes/);
  assert.match(doc, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(doc, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(doc, /21 disabled cleanup branch lines/);
  assert.match(doc, /959 disabled cleanup branch bytes/);
  assert.match(doc, /6 runtime sponsored-card DOM cleanup fixtures/);
  assert.match(doc, /CSS branch emits 9 sponsored ad-surface selector rows/);
  assert.match(doc, /style regeneration removes sponsored selectors when the setting turns off/);
  assert.match(doc, /whitelist mode still emits sponsored-card CSS/);
  assert.match(doc, /unsupported `:has\(\)` support does not suppress sponsored selectors/);
  assert.match(doc, /active style-writer passes also call Open App cleanup/);
  assert.match(doc, /DOM active-work includes `hideSponsoredCards`/);
  assert.match(doc, /stale\/disabled cleanup plus product runtime source contain no sponsored-card feature marker/);
  assert.match(doc, /`sponsoredCardsDomCleanupBoundaryContract`, `sponsoredCardsDomCleanupDecisionReport`, `sponsoredCardsDomCleanupStyleSelectorPolicy`, `sponsoredCardsDomCleanupTargetShapeReport`, `sponsoredCardsDomCleanupRoutePolicy`, `sponsoredCardsDomCleanupAdSurfaceReport`, `sponsoredCardsDomCleanupRestoreProof`, `sponsoredCardsDomCleanupStaleCleanupBudget`, `sponsoredCardsDomCleanupDisabledRestoreProof`, `sponsoredCardsDomCleanupMetricArtifact`, or `sponsoredCardsDomCleanupJsonParityGate`/);
});

test('objective coverage ledger records watch playlist panel DOM cleanup boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Watch Playlist Panel DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WATCH_PLAYLIST_PANEL_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/watch-playlist-panel-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct watch playlist panel DOM cleanup proof/);
  assert.match(doc, /1 watch-playlist-panel DOM cleanup boundary source file/);
  assert.match(doc, /6 source\/effect blocks/);
  assert.match(doc, /345 ensureContentControlStyles block lines/);
  assert.match(doc, /12583 ensureContentControlStyles bytes/);
  assert.match(doc, /9 watch-playlist-panel CSS block lines/);
  assert.match(doc, /264 watch-playlist-panel CSS block bytes/);
  assert.match(doc, /68 active DOM fallback work block lines/);
  assert.match(doc, /2333 active DOM fallback work block bytes/);
  assert.match(doc, /14 no-active cleanup branch lines/);
  assert.match(doc, /629 no-active cleanup branch bytes/);
  assert.match(doc, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(doc, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(doc, /21 disabled cleanup branch lines/);
  assert.match(doc, /959 disabled cleanup branch bytes/);
  assert.match(doc, /6 runtime watch-playlist-panel DOM cleanup fixtures/);
  assert.match(doc, /CSS branch emits 3 watch playlist panel selector rows/);
  assert.match(doc, /style regeneration removes watch playlist panel selectors when the setting turns off/);
  assert.match(doc, /whitelist mode still emits watch playlist panel CSS/);
  assert.match(doc, /unsupported `:has\(\)` support does not suppress watch playlist panel selectors/);
  assert.match(doc, /active style-writer passes also call Open App cleanup/);
  assert.match(doc, /DOM active-work includes `hideWatchPlaylistPanel`/);
  assert.match(doc, /stale\/disabled cleanup plus product runtime source contain no watch playlist panel feature marker/);
  assert.match(doc, /`watchPlaylistPanelDomCleanupBoundaryContract`, `watchPlaylistPanelDomCleanupDecisionReport`, `watchPlaylistPanelDomCleanupStyleSelectorPolicy`, `watchPlaylistPanelDomCleanupTargetShapeReport`, `watchPlaylistPanelDomCleanupRoutePolicy`, `watchPlaylistPanelDomCleanupPanelSurfaceReport`, `watchPlaylistPanelDomCleanupRestoreProof`, `watchPlaylistPanelDomCleanupStaleCleanupBudget`, `watchPlaylistPanelDomCleanupDisabledRestoreProof`, `watchPlaylistPanelDomCleanupMetricArtifact`, or `watchPlaylistPanelDomCleanupJsonParityGate`/);
});

test('objective coverage ledger records video sidebar DOM cleanup boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Video Sidebar DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_VIDEO_SIDEBAR_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/video-sidebar-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct video sidebar DOM cleanup proof/);
  assert.match(doc, /1 video-sidebar DOM cleanup boundary source file/);
  assert.match(doc, /6 source\/effect blocks/);
  assert.match(doc, /345 ensureContentControlStyles block lines/);
  assert.match(doc, /12583 ensureContentControlStyles bytes/);
  assert.match(doc, /7 video-sidebar CSS block lines/);
  assert.match(doc, /172 video-sidebar CSS block bytes/);
  assert.match(doc, /68 active DOM fallback work block lines/);
  assert.match(doc, /2333 active DOM fallback work block bytes/);
  assert.match(doc, /14 no-active cleanup branch lines/);
  assert.match(doc, /629 no-active cleanup branch bytes/);
  assert.match(doc, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(doc, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(doc, /21 disabled cleanup branch lines/);
  assert.match(doc, /959 disabled cleanup branch bytes/);
  assert.match(doc, /6 runtime video-sidebar DOM cleanup fixtures/);
  assert.match(doc, /CSS branch emits 1 video sidebar secondary-column selector row/);
  assert.match(doc, /style regeneration removes the video sidebar selector when the setting turns off/);
  assert.match(doc, /whitelist mode still emits video sidebar CSS/);
  assert.match(doc, /unsupported `:has\(\)` support does not suppress video sidebar selectors/);
  assert.match(doc, /active style-writer passes also call Open App cleanup/);
  assert.match(doc, /DOM active-work includes `hideVideoSidebar`/);
  assert.match(doc, /stale\/disabled cleanup plus product runtime source contain no video sidebar feature marker/);
  assert.match(doc, /`videoSidebarDomCleanupBoundaryContract`, `videoSidebarDomCleanupDecisionReport`, `videoSidebarDomCleanupStyleSelectorPolicy`, `videoSidebarDomCleanupTargetShapeReport`, `videoSidebarDomCleanupRoutePolicy`, `videoSidebarDomCleanupSecondaryColumnReport`, `videoSidebarDomCleanupRestoreProof`, `videoSidebarDomCleanupStaleCleanupBudget`, `videoSidebarDomCleanupDisabledRestoreProof`, `videoSidebarDomCleanupMetricArtifact`, or `videoSidebarDomCleanupJsonParityGate`/);
});

test('objective coverage ledger records live chat DOM cleanup boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Live Chat DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_LIVE_CHAT_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/live-chat-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct live chat DOM cleanup proof/);
  assert.match(doc, /1 live-chat DOM cleanup boundary source file/);
  assert.match(doc, /6 source\/effect blocks/);
  assert.match(doc, /345 ensureContentControlStyles block lines/);
  assert.match(doc, /12583 ensureContentControlStyles bytes/);
  assert.match(doc, /8 live-chat CSS block lines/);
  assert.match(doc, /195 live-chat CSS block bytes/);
  assert.match(doc, /68 active DOM fallback work block lines/);
  assert.match(doc, /2333 active DOM fallback work block bytes/);
  assert.match(doc, /14 no-active cleanup branch lines/);
  assert.match(doc, /629 no-active cleanup branch bytes/);
  assert.match(doc, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(doc, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(doc, /21 disabled cleanup branch lines/);
  assert.match(doc, /959 disabled cleanup branch bytes/);
  assert.match(doc, /6 runtime live-chat DOM cleanup fixtures/);
  assert.match(doc, /CSS branch emits 2 live chat selector rows/);
  assert.match(doc, /style regeneration removes live chat selectors when the setting turns off/);
  assert.match(doc, /whitelist mode still emits live chat CSS/);
  assert.match(doc, /unsupported `:has\(\)` support does not suppress live chat selectors/);
  assert.match(doc, /active style-writer passes also call Open App cleanup/);
  assert.match(doc, /DOM active-work includes `hideLiveChat`/);
  assert.match(doc, /stale\/disabled cleanup plus product runtime source contain no live chat feature marker/);
  assert.match(doc, /`liveChatDomCleanupBoundaryContract`, `liveChatDomCleanupDecisionReport`, `liveChatDomCleanupStyleSelectorPolicy`, `liveChatDomCleanupTargetShapeReport`, `liveChatDomCleanupRoutePolicy`, `liveChatDomCleanupChatSurfaceReport`, `liveChatDomCleanupRestoreProof`, `liveChatDomCleanupStaleCleanupBudget`, `liveChatDomCleanupDisabledRestoreProof`, `liveChatDomCleanupMetricArtifact`, or `liveChatDomCleanupJsonParityGate`/);
});

test('objective coverage ledger records video info DOM cleanup boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Video Info DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_VIDEO_INFO_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/video-info-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct video-info DOM cleanup proof/);
  assert.match(doc, /1 video-info DOM cleanup boundary source file/);
  assert.match(doc, /11 source\/effect blocks/);
  assert.match(doc, /345 ensureContentControlStyles block lines/);
  assert.match(doc, /12583 ensureContentControlStyles bytes/);
  assert.match(doc, /49 video-info mode group block lines/);
  assert.match(doc, /1516 video-info mode group block bytes/);
  assert.match(doc, /8 video-buttons-bar CSS block lines/);
  assert.match(doc, /263 video-buttons-bar CSS block bytes/);
  assert.match(doc, /8 ask-button CSS block lines/);
  assert.match(doc, /218 ask-button CSS block bytes/);
  assert.match(doc, /8 video-channel-row CSS block lines/);
  assert.match(doc, /280 video-channel-row CSS block bytes/);
  assert.match(doc, /8 video-description CSS block lines/);
  assert.match(doc, /291 video-description CSS block bytes/);
  assert.match(doc, /10 merch-tickets-offers CSS block lines/);
  assert.match(doc, /274 merch-tickets-offers CSS block bytes/);
  assert.match(doc, /68 active DOM fallback work block lines/);
  assert.match(doc, /2333 active DOM fallback work block bytes/);
  assert.match(doc, /14 no-active cleanup branch lines/);
  assert.match(doc, /629 no-active cleanup branch bytes/);
  assert.match(doc, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(doc, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(doc, /21 disabled cleanup branch lines/);
  assert.match(doc, /959 disabled cleanup branch bytes/);
  assert.match(doc, /6 runtime video-info DOM cleanup fixtures/);
  assert.match(doc, /video-info mode group emits 12 selector rows across 5 child branches/);
  assert.match(doc, /`hideVideoInfo` emits all five child selector branches only in blocklist mode/);
  assert.match(doc, /`hideVideoInfo` in whitelist mode emits no video-info child selectors/);
  assert.match(doc, /explicit whitelist-mode child flags still emit Ask and Merch\/Tickets\/Offers selectors while Buttons Bar, Channel Row, and Description remain suppressed by direct whitelist guards/);
  assert.match(doc, /style regeneration removes video-info selectors when mode or settings change/);
  assert.match(doc, /active style-writer passes also call Open App cleanup/);
  assert.match(doc, /DOM active-work includes all six video-info flags/);
  assert.match(doc, /stale\/disabled cleanup plus product runtime source contain no video-info feature marker/);
  assert.match(doc, /`videoInfoDomCleanupBoundaryContract`, `videoInfoDomCleanupDecisionReport`, `videoInfoDomCleanupMasterModePolicy`, `videoInfoDomCleanupStyleSelectorPolicy`, `videoInfoDomCleanupTargetShapeReport`, `videoInfoDomCleanupWhitelistPolicy`, `videoInfoDomCleanupRestoreProof`, `videoInfoDomCleanupStaleCleanupBudget`, `videoInfoDomCleanupDisabledRestoreProof`, `videoInfoDomCleanupMetricArtifact`, or `videoInfoDomCleanupJsonParityGate`/);
});

test('objective coverage ledger records player/end-screen DOM cleanup boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Player\/End-screen DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_PLAYER_ENDSCREEN_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/player-endscreen-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct player\/end-screen DOM cleanup proof/);
  assert.match(doc, /1 player\/end-screen DOM cleanup boundary source file/);
  assert.match(doc, /9 source\/effect blocks/);
  assert.match(doc, /345 ensureContentControlStyles block lines/);
  assert.match(doc, /12583 ensureContentControlStyles bytes/);
  assert.match(doc, /34 player\/end-screen CSS group block lines/);
  assert.match(doc, /856 player\/end-screen CSS group block bytes/);
  assert.match(doc, /8 endscreen videowall CSS block lines/);
  assert.match(doc, /253 endscreen videowall CSS block bytes/);
  assert.match(doc, /7 endscreen cards CSS block lines/);
  assert.match(doc, /177 endscreen cards CSS block bytes/);
  assert.match(doc, /8 disable autoplay CSS block lines/);
  assert.match(doc, /235 disable autoplay CSS block bytes/);
  assert.match(doc, /8 disable annotations CSS block lines/);
  assert.match(doc, /185 disable annotations CSS block bytes/);
  assert.match(doc, /68 active DOM fallback work block lines/);
  assert.match(doc, /2333 active DOM fallback work block bytes/);
  assert.match(doc, /14 no-active cleanup branch lines/);
  assert.match(doc, /629 no-active cleanup branch bytes/);
  assert.match(doc, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(doc, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(doc, /21 disabled cleanup branch lines/);
  assert.match(doc, /959 disabled cleanup branch bytes/);
  assert.match(doc, /6 runtime player\/end-screen DOM cleanup fixtures/);
  assert.match(doc, /CSS group emits 7 player\/end-screen selector rows across 4 branches/);
  assert.match(doc, /all four controls emit selectors when the style writer runs/);
  assert.match(doc, /`disableAutoplay` and `disableAnnotations` can write CSS directly but are not blocklist active-work keys/);
  assert.match(doc, /`hideEndscreenVideowall` and `hideEndscreenCards` are blocklist active-work keys/);
  assert.match(doc, /style regeneration removes player\/end-screen selector rows when the settings are absent/);
  assert.match(doc, /active style-writer passes also call Open App cleanup/);
  assert.match(doc, /stale\/disabled cleanup plus product runtime source contain no player\/end-screen feature marker/);
  assert.match(doc, /`playerEndscreenDomCleanupBoundaryContract`, `playerEndscreenDomCleanupDecisionReport`, `playerEndscreenDomCleanupStyleSelectorPolicy`, `playerEndscreenDomCleanupTargetShapeReport`, `playerEndscreenDomCleanupActiveWorkPolicy`, `playerEndscreenDomCleanupAutoplayPolicy`, `playerEndscreenDomCleanupAnnotationPolicy`, `playerEndscreenDomCleanupRestoreProof`, `playerEndscreenDomCleanupStaleCleanupBudget`, `playerEndscreenDomCleanupDisabledRestoreProof`, `playerEndscreenDomCleanupMetricArtifact`, or `playerEndscreenDomCleanupJsonParityGate`/);
});

test('objective coverage ledger records navigation/header/search DOM cleanup boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Navigation\/Header\/Search DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_NAVIGATION_HEADER_SEARCH_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/navigation-header-search-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct navigation\/header\/search DOM cleanup proof/);
  assert.match(doc, /1 navigation\/header\/search DOM cleanup boundary source file/);
  assert.match(doc, /11 source\/effect blocks/);
  assert.match(doc, /345 ensureContentControlStyles block lines/);
  assert.match(doc, /12583 ensureContentControlStyles bytes/);
  assert.match(doc, /53 navigation\/header\/search CSS group block lines/);
  assert.match(doc, /1673 navigation\/header\/search CSS group block bytes/);
  assert.match(doc, /7 top header CSS block lines/);
  assert.match(doc, /162 top header CSS block bytes/);
  assert.match(doc, /8 notification bell CSS block lines/);
  assert.match(doc, /248 notification bell CSS block bytes/);
  assert.match(doc, /9 explore trending CSS block lines/);
  assert.match(doc, /297 explore trending CSS block bytes/);
  assert.match(doc, /7 more from YouTube CSS block lines/);
  assert.match(doc, /205 more from YouTube CSS block bytes/);
  assert.match(doc, /9 subscriptions CSS block lines/);
  assert.match(doc, /437 subscriptions CSS block bytes/);
  assert.match(doc, /8 search shelves CSS block lines/);
  assert.match(doc, /314 search shelves CSS block bytes/);
  assert.match(doc, /68 active DOM fallback work block lines/);
  assert.match(doc, /2333 active DOM fallback work block bytes/);
  assert.match(doc, /14 no-active cleanup branch lines/);
  assert.match(doc, /629 no-active cleanup branch bytes/);
  assert.match(doc, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(doc, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(doc, /21 disabled cleanup branch lines/);
  assert.match(doc, /959 disabled cleanup branch bytes/);
  assert.match(doc, /6 runtime navigation\/header\/search DOM cleanup fixtures/);
  assert.match(doc, /CSS group emits 12 navigation\/header\/search selector rows across 6 branches with `:has\(\)` support/);
  assert.match(doc, /all six controls emit selectors when the style writer runs/);
  assert.match(doc, /disabling `:has\(\)` support removes only the dynamic subscriptions guide-section selector/);
  assert.match(doc, /all six flags are blocklist active-work keys/);
  assert.match(doc, /style regeneration removes navigation\/header\/search selector rows when the settings are absent/);
  assert.match(doc, /active style-writer passes also call Open App cleanup/);
  assert.match(doc, /stale\/disabled cleanup plus product runtime source contain no navigation\/header\/search feature marker/);
  assert.match(doc, /`navigationHeaderSearchDomCleanupBoundaryContract`, `navigationHeaderSearchDomCleanupDecisionReport`, `navigationHeaderSearchDomCleanupStyleSelectorPolicy`, `navigationHeaderSearchDomCleanupTargetShapeReport`, `navigationHeaderSearchDomCleanupRoutePolicy`, `navigationHeaderSearchDomCleanupSurfaceReport`, `navigationHeaderSearchDomCleanupHasSelectorPolicy`, `navigationHeaderSearchDomCleanupGuidePositionPolicy`, `navigationHeaderSearchDomCleanupRestoreProof`, `navigationHeaderSearchDomCleanupStaleCleanupBudget`, `navigationHeaderSearchDomCleanupDisabledRestoreProof`, `navigationHeaderSearchDomCleanupMetricArtifact`, or `navigationHeaderSearchDomCleanupJsonParityGate`/);
});

test('objective coverage ledger records recommended DOM cleanup boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Recommended DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_RECOMMENDED_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/recommended-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct recommended DOM cleanup proof/);
  assert.match(doc, /1 recommended DOM cleanup boundary source file/);
  assert.match(doc, /6 source\/effect blocks/);
  assert.match(doc, /345 ensureContentControlStyles block lines/);
  assert.match(doc, /12583 ensureContentControlStyles bytes/);
  assert.match(doc, /8 recommended CSS block lines/);
  assert.match(doc, /215 recommended CSS block bytes/);
  assert.match(doc, /68 active DOM fallback work block lines/);
  assert.match(doc, /2333 active DOM fallback work block bytes/);
  assert.match(doc, /14 no-active cleanup branch lines/);
  assert.match(doc, /629 no-active cleanup branch bytes/);
  assert.match(doc, /33 clearStaleDOMFallbackVisibility block lines/);
  assert.match(doc, /1412 clearStaleDOMFallbackVisibility bytes/);
  assert.match(doc, /21 disabled cleanup branch lines/);
  assert.match(doc, /959 disabled cleanup branch bytes/);
  assert.match(doc, /6 runtime recommended DOM cleanup fixtures/);
  assert.match(doc, /CSS branch emits 2 recommended watch rail selector rows/);
  assert.match(doc, /style regeneration removes recommended selectors when the setting turns off/);
  assert.match(doc, /whitelist mode still emits recommended CSS/);
  assert.match(doc, /unsupported `:has\(\)` support does not suppress recommended selectors/);
  assert.match(doc, /active style-writer passes also call Open App cleanup/);
  assert.match(doc, /DOM active-work includes `hideRecommended`/);
  assert.match(doc, /stale\/disabled cleanup plus product runtime source contain no recommended feature marker/);
  assert.match(doc, /`recommendedDomCleanupBoundaryContract`, `recommendedDomCleanupDecisionReport`, `recommendedDomCleanupStyleSelectorPolicy`, `recommendedDomCleanupTargetShapeReport`, `recommendedDomCleanupRoutePolicy`, `recommendedDomCleanupWatchRailReport`, `recommendedDomCleanupRestoreProof`, `recommendedDomCleanupStaleCleanupBudget`, `recommendedDomCleanupDisabledRestoreProof`, `recommendedDomCleanupMetricArtifact`, or `recommendedDomCleanupJsonParityGate`/);
});

test('objective coverage ledger records content control alias mutation boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Content control alias mutation boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_CONTROL_ALIAS_MUTATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/content-control-alias-mutation-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /executed mutation proof/);
  assert.match(doc, /7 content control alias mutation boundary source files/);
  assert.match(doc, /13 source\/effect blocks/);
  assert.match(doc, /shared settings compile\/save\/load alias blocks/);
  assert.match(doc, /StateManager mutation\/save\/reload alias blocks/);
  assert.match(doc, /background compile\/invalidation alias blocks/);
  assert.match(doc, /seed active-rule fields/);
  assert.match(doc, /filter_logic processed defaults/);
  assert.match(doc, /DOM fallback active keys/);
  assert.match(doc, /5 runtime alias mutation fixtures/);
  assert.match(doc, /`saveSettings\({ hideShorts: true, hideComments: true }\)` compiles runtime `hideAllShorts` and `hideAllComments`/);
  assert.match(doc, /writes root `hideAllShorts` and `hideAllComments`/);
  assert.match(doc, /writes V4 profile `hideShorts` and `hideComments`/);
  assert.match(doc, /does not write root `hideShorts` or `hideComments`/);
  assert.match(doc, /legacy `loadSettings\(\)` maps root `hideAllShorts` and `hideAllComments` back to UI aliases/);
  assert.match(doc, /`contentControlAliasMutationContract`, `contentControlStorageAliasPolicy`, `contentControlAliasReadWriteReport`, `contentControlStateManagerAliasMutationReport`, `contentControlBackgroundInvalidationParityReport`, `contentControlJsonSettingFieldManifest`, `contentControlDomAliasParityReport`, `contentControlAliasNoWorkBudget`, `contentControlAliasFixtureProvenance`, or `contentControlAliasFirstClassJsonGate`/);
});

test('objective coverage ledger records content bridge prefetch identity lifecycle boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Content bridge prefetch identity lifecycle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_PREFETCH_IDENTITY_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-prefetch-identity-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /runtime lifecycle, JSON path, network snapshot consumer, identity hydration, learned-map write, DOM stamp, DOM fallback rerun, no-work optimization/);
  assert.match(doc, /direct content bridge prefetch identity lifecycle proof/);
  assert.match(doc, /1 content bridge prefetch identity lifecycle boundary source file/);
  assert.match(doc, /11 source\/effect blocks/);
  assert.match(doc, /363 prefetch lifecycle cluster block lines/);
  assert.match(doc, /12782 prefetch lifecycle cluster block bytes/);
  assert.match(doc, /20 startCardPrefetchObserver block lines/);
  assert.match(doc, /621 startCardPrefetchObserver block bytes/);
  assert.match(doc, /73 installRightRailWhitelistObserver block lines/);
  assert.match(doc, /2409 installRightRailWhitelistObserver block bytes/);
  assert.match(doc, /91 prefetchIdentityForCard block lines/);
  assert.match(doc, /4064 prefetchIdentityForCard block bytes/);
  assert.match(doc, /152 stamp\/reset identity block lines/);
  assert.match(doc, /6313 stamp\/reset identity block bytes/);
  assert.match(doc, /5 prefetch lifecycle cluster document\.addEventListener callsites/);
  assert.match(doc, /2 prefetch lifecycle cluster MutationObserver callsites/);
  assert.match(doc, /1 prefetch lifecycle cluster IntersectionObserver callsite/);
  assert.match(doc, /6 runtime content bridge prefetch lifecycle fixtures/);
  assert.match(doc, /card observation uses one `IntersectionObserver`, one `visibilitychange` listener/);
  assert.match(doc, /cap one pass at 120 cards/);
  assert.match(doc, /right-rail refresh is whitelist-aware and route-aware/);
  assert.match(doc, /dedupes by video id for 30 seconds/);
  assert.match(doc, /drains with concurrency 2 only while visible/);
  assert.match(doc, /performs no direct `fetch\(\)` in `prefetchIdentityForCard\(\)`/);
  assert.match(doc, /stamp DOM identity, persist learned map entries, and schedule DOM fallback after a successful stamp/);
  assert.match(doc, /`contentBridgePrefetchIdentityLifecycleContract`, `contentBridgePrefetchActiveWorkDecision`, `contentBridgePrefetchObserverBudget`, `contentBridgePrefetchQueueBudget`, `contentBridgePrefetchSnapshotEffectReport`, `contentBridgePrefetchDomStampReport`, `contentBridgePrefetchMapWriteReport`, `contentBridgePrefetchWhitelistPendingPolicy`, `contentBridgePrefetchRoutePausePolicy`, `contentBridgePrefetchFixtureProvenance`, or `contentBridgePrefetchMetricArtifact`/);
});

test('objective coverage ledger records subscription import request lifecycle boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Subscription import request lifecycle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SUBSCRIPTION_IMPORT_REQUEST_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/subscription-import-request-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct subscription import request lifecycle proof/);
  assert.match(doc, /9 subscription import request lifecycle source files/);
  assert.match(doc, /5 JS source files/);
  assert.match(doc, /4 manifest files/);
  assert.match(doc, /13 source\/effect blocks/);
  assert.match(doc, /40 bridge_settings guarded requester block lines/);
  assert.match(doc, /1938 bridge_settings guarded requester block bytes/);
  assert.match(doc, /50 bridge_settings subscription listener block lines/);
  assert.match(doc, /2295 bridge_settings subscription listener block bytes/);
  assert.match(doc, /52 bridge_settings runtime import action block lines/);
  assert.match(doc, /2614 bridge_settings runtime import action block bytes/);
  assert.match(doc, /38 content_bridge requester block lines/);
  assert.match(doc, /1648 content_bridge requester block bytes/);
  assert.match(doc, /71 injector subscription bridge install block lines/);
  assert.match(doc, /2766 injector subscription bridge install block bytes/);
  assert.match(doc, /450 injector fetchSubscribedChannelsFromYoutubei block lines/);
  assert.match(doc, /19755 injector fetchSubscribedChannelsFromYoutubei block bytes/);
  assert.match(doc, /54 StateManager fetchSubscribedChannelsFromImportTab block lines/);
  assert.match(doc, /2213 StateManager fetchSubscribedChannelsFromImportTab block bytes/);
  assert.match(doc, /201 tab-view startSubscribedChannelsImport block lines/);
  assert.match(doc, /8431 tab-view startSubscribedChannelsImport block bytes/);
  assert.match(doc, /8 runtime subscription import lifecycle fixtures/);
  assert.match(doc, /all four manifests load `bridge_settings\.js` before `content_bridge\.js`/);
  assert.match(doc, /timeout clamp changes from 120000 ms to 150000 ms/);
  assert.match(doc, /broader same-window `FilterTube_\*` gate/);
  assert.match(doc, /credentialed YouTubei POST fetch work with abort timers/);
  assert.match(doc, /wildcard progress\/response page messages/);
  assert.match(doc, /profile, lock, tab, request id, source tab, whitelist mutation, and UI progress gates/);
  assert.match(doc, /`subscriptionImportRequestLifecycleContract`, `subscriptionImportRequesterOverrideReport`, `subscriptionImportCapabilityToken`, `subscriptionImportPageMessageTrustReport`, `subscriptionImportProgressResponsePolicy`, `subscriptionImportTimeoutBudget`, `subscriptionImportYoutubeiFetchBudget`, `subscriptionImportManifestLoadOrderReport`, `subscriptionImportProfileMutationReport`, `subscriptionImportUiProgressPolicy`, `subscriptionImportFixtureProvenance`, or `subscriptionImportMetricArtifact`/);
});

test('objective coverage ledger records batch whitelist import persistence boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Batch whitelist import persistence boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BATCH_WHITELIST_IMPORT_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/batch-whitelist-import-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct persistence proof/);
  assert.match(doc, /2 batch whitelist import persistence source files/);
  assert.match(doc, /6 source\/effect blocks/);
  assert.match(doc, /57 background normalizeImportedWhitelistChannelEntry block lines/);
  assert.match(doc, /2426 background normalizeImportedWhitelistChannelEntry block bytes/);
  assert.match(doc, /29 background importedWhitelistEntriesMatch block lines/);
  assert.match(doc, /1228 background importedWhitelistEntriesMatch block bytes/);
  assert.match(doc, /33 background mergeImportedWhitelistChannelEntry block lines/);
  assert.match(doc, /2544 background mergeImportedWhitelistChannelEntry block bytes/);
  assert.match(doc, /44 background mergeImportedWhitelistChannels block lines/);
  assert.match(doc, /1463 background mergeImportedWhitelistChannels block bytes/);
  assert.match(doc, /170 background FilterTube_BatchImportWhitelistChannels action block lines/);
  assert.match(doc, /7012 background FilterTube_BatchImportWhitelistChannels action block bytes/);
  assert.match(doc, /109 StateManager importSubscribedChannelsToWhitelist block lines/);
  assert.match(doc, /4527 StateManager importSubscribedChannelsToWhitelist block bytes/);
  assert.match(doc, /7 runtime batch whitelist import persistence fixtures/);
  assert.match(doc, /StateManager gates lock\/profile state/);
  assert.match(doc, /background requires trusted UI sender, active profile equality, and session authorization/);
  assert.match(doc, /accept UC id, handle, or custom URL identity/);
  assert.match(doc, /track imported\/updated\/duplicates\/skipped counts/);
  assert.match(doc, /preserve existing `filterAllComments`/);
  assert.match(doc, /writes V4 and V3 profile mirrors/);
  assert.match(doc, /optionally writes `channelMap`/);
  assert.match(doc, /schedules `whitelist_subscriptions_imported` backup/);
  assert.match(doc, /sends `FilterTube_RefreshNow` to YouTube tabs/);
  assert.match(doc, /returns `currentMode` without changing blocklist to whitelist/);
  assert.match(doc, /`batchWhitelistImportPersistenceContract`, `batchWhitelistImportMutationReport`, `batchWhitelistImportRollbackPolicy`, `batchWhitelistImportProfileLockReport`, `batchWhitelistImportModeEffectReport`, `batchWhitelistImportChannelMapPolicy`, `batchWhitelistImportV3MirrorPolicy`, `batchWhitelistImportCacheInvalidationReport`, `batchWhitelistImportBackupRefreshBudget`, `batchWhitelistImportFixtureProvenance`, or `batchWhitelistImportMetricArtifact`/);
});

test('objective coverage ledger records list-mode transition persistence boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /List-mode transition persistence boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_LIST_MODE_TRANSITION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/list-mode-transition-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct transition persistence proof/);
  assert.match(doc, /4 list-mode transition persistence source files/);
  assert.match(doc, /8 source\/effect blocks/);
  assert.match(doc, /209 background FilterTube_SetListMode action block lines/);
  assert.match(doc, /9626 background FilterTube_SetListMode action block bytes/);
  assert.match(doc, /38 background SetListMode merge helper block lines/);
  assert.match(doc, /2126 background SetListMode merge helper block bytes/);
  assert.match(doc, /31 background SetListMode write\/side-effect block lines/);
  assert.match(doc, /1151 background SetListMode write\/side-effect block bytes/);
  assert.match(doc, /192 background FilterTube_TransferWhitelistToBlocklist action block lines/);
  assert.match(doc, /9102 background FilterTube_TransferWhitelistToBlocklist action block bytes/);
  assert.match(doc, /173 popup renderListModeControls block lines/);
  assert.match(doc, /7911 popup renderListModeControls block bytes/);
  assert.match(doc, /174 tab-view renderListModeControls block lines/);
  assert.match(doc, /9296 tab-view renderListModeControls block bytes/);
  assert.match(doc, /47 tab-view enableWhitelistModeAfterImport block lines/);
  assert.match(doc, /1554 tab-view enableWhitelistModeAfterImport block bytes/);
  assert.match(doc, /111 StateManager importSubscribedChannelsToWhitelist block lines/);
  assert.match(doc, /4533 StateManager importSubscribedChannelsToWhitelist block bytes/);
  assert.match(doc, /8 runtime list-mode transition persistence fixtures/);
  assert.match(doc, /subscription import mode enablement sends `copyBlocklist:false`/);
  assert.match(doc, /background ignores that flag as an effect gate and always merges blocklist into whitelist/);
  assert.match(doc, /Main whitelist transition clears root legacy blocklist mirrors/);
  assert.match(doc, /blocklist mode label change does not transfer whitelist rows back/);
  assert.match(doc, /separate transfer action moves and clears rows/);
  assert.match(doc, /trusted UI sender checks but no session authorization checks/);
  assert.match(doc, /tab-view managed child editing uses a separate surface mutation path/);
  assert.match(doc, /StateManager import persistence returns `currentMode` before any mode toggle/);
  assert.match(doc, /`listModeTransitionPersistenceContract`, `listModeTransitionMutationReport`, `listModeTransitionCopyFlagPolicy`, `listModeTransitionRollbackPolicy`, `listModeTransitionProfileLockReport`, `listModeTransitionModeEffectReport`, `listModeTransitionLegacyMirrorPolicy`, `listModeTransitionCacheInvalidationReport`, `listModeTransitionBackupRefreshBudget`, `listModeTransitionManagedChildParityReport`, `listModeTransitionFixtureProvenance`, or `listModeTransitionMetricArtifact`/);
});

test('objective coverage ledger records single-channel rule mutation persistence boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Single-channel rule mutation persistence boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SINGLE_CHANNEL_RULE_MUTATION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/single-channel-rule-mutation-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct single-channel persistence proof/);
  assert.match(doc, /3 single-channel rule mutation persistence source files/);
  assert.match(doc, /9 source\/effect blocks/);
  assert.match(doc, /75 StateManager addChannel block lines/);
  assert.match(doc, /3276 StateManager addChannel block bytes/);
  assert.match(doc, /79 StateManager addKidsChannel block lines/);
  assert.match(doc, /3400 StateManager addKidsChannel block bytes/);
  assert.match(doc, /40 background addWhitelistChannelPersistent block lines/);
  assert.match(doc, /1329 background addWhitelistChannelPersistent block bytes/);
  assert.match(doc, /54 background FilterTube_KidsWhitelistChannel block lines/);
  assert.match(doc, /2107 background FilterTube_KidsWhitelistChannel block bytes/);
  assert.match(doc, /43 background FilterTube_KidsBlockChannel block lines/);
  assert.match(doc, /1769 background FilterTube_KidsBlockChannel block bytes/);
  assert.match(doc, /287 background addChannelPersistent action block lines/);
  assert.match(doc, /13345 background addChannelPersistent action block bytes/);
  assert.match(doc, /32 background secondary addFilteredChannel receiver block lines/);
  assert.match(doc, /1186 background secondary addFilteredChannel receiver block bytes/);
  assert.match(doc, /894 background handleAddFilteredChannel block lines/);
  assert.match(doc, /45226 background handleAddFilteredChannel block bytes/);
  assert.match(doc, /55 content_bridge addChannelDirectly block lines/);
  assert.match(doc, /2662 content_bridge addChannelDirectly block bytes/);
  assert.match(doc, /11 runtime single-channel rule mutation persistence fixtures/);
  assert.match(doc, /StateManager action choice follows Main\/Kids mode/);
  assert.match(doc, /Main\/Kids whitelist single adds are trusted-sender gated but not session-locked/);
  assert.match(doc, /Kids block\/legacy block\/secondary content mutation paths lack matching gates/);
  assert.match(doc, /secondary `addFilteredChannel` defaults to blocklist list type/);
  assert.match(doc, /legacy Main block add is a separate inline persistence path/);
  assert.match(doc, /shared helper mixes network identity repair with V4\/V3\/root storage writes and cache invalidation/);
  assert.match(doc, /content quick-block can schedule backup after background success/);
  assert.match(doc, /`singleChannelRuleMutationPersistenceContract`, `singleChannelRuleMutationReport`, `singleChannelRuleMutationSenderPolicy`, `singleChannelRuleMutationProfileLockReport`, `singleChannelRuleMutationListTypePolicy`, `singleChannelRuleMutationStorageWriteReport`, `singleChannelRuleMutationCacheInvalidationReport`, `singleChannelRuleMutationNetworkBudget`, `singleChannelRuleMutationBackupPolicy`, `singleChannelRuleMutationPostEnrichmentPolicy`, `singleChannelRuleMutationFixtureProvenance`, or `singleChannelRuleMutationMetricArtifact`/);
});

test('objective coverage ledger records profile management persistence boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Profile management persistence boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_PROFILE_MANAGEMENT_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/profile-management-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct profile management persistence proof/);
  assert.match(doc, /4 profile management persistence source files/);
  assert.match(doc, /9 source\/effect blocks/);
  assert.match(doc, /357 tab-view renderProfilesManager block lines/);
  assert.match(doc, /17731 tab-view renderProfilesManager block bytes/);
  assert.match(doc, /24 tab-view refreshProfilesUI block lines/);
  assert.match(doc, /954 tab-view refreshProfilesUI block bytes/);
  assert.match(doc, /44 tab-view switchToProfile block lines/);
  assert.match(doc, /1595 tab-view switchToProfile block bytes/);
  assert.match(doc, /48 popup switchToProfile block lines/);
  assert.match(doc, /1659 popup switchToProfile block bytes/);
  assert.match(doc, /120 tab-view create account handler block lines/);
  assert.match(doc, /5004 tab-view create account handler block bytes/);
  assert.match(doc, /107 tab-view create child handler block lines/);
  assert.match(doc, /4589 tab-view create child handler block bytes/);
  assert.match(doc, /53 tab-view saveManagedChildSurface block lines/);
  assert.match(doc, /2341 tab-view saveManagedChildSurface block bytes/);
  assert.match(doc, /67 io_manager load\/save profiles block lines/);
  assert.match(doc, /2563 io_manager load\/save profiles block bytes/);
  assert.match(doc, /42 background profile storage invalidation block lines/);
  assert.match(doc, /1464 background profile storage invalidation block bytes/);
  assert.match(doc, /11 runtime profile management persistence fixtures/);
  assert.match(doc, /tab-view and popup profile switches write `activeProfileId` after local unlock without shared revision reports/);
  assert.match(doc, /profile delete resolves active profile back to Default without backup or revision report/);
  assert.match(doc, /account creation copies backup policy without switching active profile/);
  assert.match(doc, /child creation requires a parent account and defaults Main denied\/Kids allowed/);
  assert.match(doc, /managed child save writes target surface locally without broadcast or compiled revision report/);
  assert.match(doc, /IO profile load can write sanitized or migrated V4 during read-path loading/);
  assert.match(doc, /invalid profile save writes an empty object rather than a structured error report/);
  assert.match(doc, /background profile storage change invalidates both compiled caches without revision report/);
  assert.match(doc, /`profileManagementPersistenceContract`, `profileManagementMutationReport`, `profileManagementSwitchRevisionReport`, `profileManagementLockPolicy`, `profileManagementCreateDeleteReport`, `profileManagementBackupPolicy`, `profileManagementCacheInvalidationReport`, `profileManagementManagedChildReport`, `profileManagementFixtureProvenance`, or `profileManagementMetricArtifact`/);
});

test('objective coverage ledger records YouTube Music surface identity boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /YouTube Music surface identity boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_YOUTUBE_MUSIC_SURFACE_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/youtube-music-surface-identity-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /YouTube Music\/YTM route\/surface/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct YTM surface identity proof/);
  assert.match(doc, /6 YTM surface source files/);
  assert.match(doc, /10 source\/effect blocks/);
  assert.match(doc, /51 `VIDEO_CARD_SELECTORS` block lines/);
  assert.match(doc, /1722 `VIDEO_CARD_SELECTORS` block bytes/);
  assert.match(doc, /10 profile classifier block lines/);
  assert.match(doc, /293 bridge profile classifier block bytes/);
  assert.match(doc, /17 `videoWithContextRenderer` rule block lines/);
  assert.match(doc, /1109 `videoWithContextRenderer` rule block bytes/);
  assert.match(doc, /22 rich item nested renderer preference block lines/);
  assert.match(doc, /932 rich item nested renderer preference block bytes/);
  assert.match(doc, /239 sheet-like collaborator extraction block lines/);
  assert.match(doc, /12385 sheet-like collaborator extraction block bytes/);
  assert.match(doc, /304 YTM style selector cluster block lines/);
  assert.match(doc, /11188 YTM style selector cluster block bytes/);
  assert.match(doc, /38 YTM channel selector cluster block lines/);
  assert.match(doc, /2211 YTM channel selector cluster block bytes/);
  assert.match(doc, /7 runtime YTM surface identity fixtures/);
  assert.match(doc, /YTM is covered by generic `\*\.youtube\.com` manifest patterns and compiled as Main/);
  assert.match(doc, /compact playlist JSON is unwrapped but lacks direct rule authority/);
  assert.match(doc, /show-sheet collaborator extraction is not filter-logic parity/);
  assert.match(doc, /learned `videoChannelMap` fallback can request `mainworld` repair/);
  assert.match(doc, /raw YTM fixture provenance is still partial/);
  assert.match(doc, /`youtubeMusicSurfaceIdentityContract`, `youtubeMusicSurfaceDecisionReport`, `youtubeMusicProfilePolicy`, `youtubeMusicRendererAuthority`, `youtubeMusicDomSelectorPolicy`, `youtubeMusicShowSheetParityReport`, `youtubeMusicCompactPlaylistDecision`, `youtubeMusicFixtureProvenance`, `youtubeMusicMetricArtifact`, or `youtubeMusicJsonDomParityGate`/);
});

test('objective coverage ledger records backup Nanah trusted-state boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Backup Nanah trusted-state boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BACKUP_NANAH_TRUSTED_STATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/backup-nanah-trusted-state-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /backup\/export, Nanah sync, profile\/viewing-space, security\/PIN/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct encrypted full-backup Nanah trusted-state recovery proof/);
  assert.match(doc, /3 backup Nanah trusted-state source files/);
  assert.match(doc, /8 source\/effect blocks/);
  assert.match(doc, /16 `normalizeNanahBackupState\(\)` block lines/);
  assert.match(doc, /492 `normalizeNanahBackupState\(\)` block bytes/);
  assert.match(doc, /485 `importV3\(\)` block lines/);
  assert.match(doc, /30221 `importV3\(\)` block bytes/);
  assert.match(doc, /36 Nanah restore write block lines/);
  assert.match(doc, /1686 Nanah restore write block bytes/);
  assert.match(doc, /31 `exportV3Encrypted\(\)` block lines/);
  assert.match(doc, /1415 `exportV3Encrypted\(\)` block bytes/);
  assert.match(doc, /15 `importV3Encrypted\(\)` block lines/);
  assert.match(doc, /688 `importV3Encrypted\(\)` block bytes/);
  assert.match(doc, /152 `runImportV3FromFile\(\)` block lines/);
  assert.match(doc, /6968 `runImportV3FromFile\(\)` block bytes/);
  assert.match(doc, /5 runtime trusted-state boundary fixtures/);
  assert.match(doc, /full encrypted export can include trusted Nanah state only for full backup scope/);
  assert.match(doc, /full import writes trust only when `restoreTrustedNanahState` is true/);
  assert.match(doc, /tab-view owns the same-device warning and settings-only recommendation/);
  assert.match(doc, /`importV3Encrypted\(\)` still does not forward `targetProfileId`/);
  assert.match(doc, /Nanah main\/kids scoped payloads apply directly without creating a trusted-state recovery authority/);
  assert.match(doc, /`backupNanahTrustedStateBoundaryContract`, `backupNanahTrustedStateDecisionReport`, `backupNanahTrustedStateSameDeviceProof`, `backupNanahTrustedStateExportPolicy`, `backupNanahTrustedStateRestorePolicy`, `backupNanahTrustedStateProfileScopeReport`, `backupNanahTrustedStateTargetProfileReport`, `backupNanahTrustedStateStorageWriteReport`, `backupNanahTrustedStatePostImportRevision`, `backupNanahTrustedStateFixtureProvenance`, `backupNanahTrustedStateMetricArtifact`, or `nanahTrustedRecoveryAuthority`/);
});

test('objective coverage ledger records manifest permission feature-map boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Manifest permission feature-map boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_MANIFEST_PERMISSION_FEATURE_MAP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/manifest-permission-feature-map-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /manifest\/permission, tracked-file, runtime lifecycle, message trust/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct permission feature-map proof/);
  assert.match(doc, /4 browser manifest files/);
  assert.match(doc, /10 runtime permission consumer source files/);
  assert.match(doc, /8 source\/effect blocks/);
  assert.match(doc, /145 broad runtime permission API tokens/);
  assert.match(doc, /56 storage API tokens/);
  assert.match(doc, /18 `storage\.local\.get` tokens/);
  assert.match(doc, /28 `storage\.local\.set` tokens/);
  assert.match(doc, /4 `storage\.onChanged` tokens/);
  assert.match(doc, /61 tabs API tokens/);
  assert.match(doc, /17 `tabs\.query` tokens/);
  assert.match(doc, /5 `tabs\.sendMessage` tokens/);
  assert.match(doc, /10 `tabs\.create` tokens/);
  assert.match(doc, /1 `tabs\.update` token/);
  assert.match(doc, /9 `scripting\.executeScript` tokens/);
  assert.match(doc, /17 downloads API tokens/);
  assert.match(doc, /8 `downloads\.download` tokens/);
  assert.match(doc, /3 `downloads\.search` tokens/);
  assert.match(doc, /3 `downloads\.erase` tokens/);
  assert.match(doc, /4 manifest `activeTab` tokens/);
  assert.match(doc, /0 product runtime `activeTab` tokens/);
  assert.match(doc, /2 build `ensureCollabDialogScriptOrder` tokens/);
  assert.match(doc, /0 build `validateManifestPermissions` tokens/);
  assert.match(doc, /7 runtime manifest permission feature-map fixtures/);
  assert.match(doc, /all manifests keep the same permission and host map/);
  assert.match(doc, /`youtube-nocookie\.com` remains host-permitted but not content-script or web-resource matched/);
  assert.match(doc, /storage\/tabs\/scripting\/downloads consumers are split across feature families/);
  assert.match(doc, /build validation is limited to collaboration script order repair/);
  assert.match(doc, /`manifestPermissionFeatureMapContract`, `manifestPermissionFeatureOwnerReport`, `manifestStoragePermissionOwnerReport`, `manifestTabsPermissionOwnerReport`, `manifestScriptingPermissionOwnerReport`, `manifestDownloadsPermissionOwnerReport`, `manifestActiveTabPermissionUseReport`, `manifestHostPermissionScopeReport`, `manifestPermissionTrustedSenderMatrix`, `manifestPermissionBuildValidationReport`, `manifestPermissionFixtureProvenance`, or `manifestPermissionMetricArtifact`/);
});

test('objective coverage ledger records external navigation surface boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /External navigation surface boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_EXTERNAL_NAVIGATION_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/external-navigation-surface-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /external navigation\/link authority/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /family-level navigation proof into direct open\/link surface proof/);
  assert.match(doc, /15 external navigation source files/);
  assert.match(doc, /10 source\/effect blocks/);
  assert.match(doc, /5 runtime `tabs\.create` callsites/);
  assert.match(doc, /7 runtime `window\.open` callsites/);
  assert.match(doc, /1 runtime `location\.href` assignment/);
  assert.match(doc, /8 runtime `runtime\.getURL` callsites/);
  assert.match(doc, /2 `FilterTube_OpenWhatsNew` tokens/);
  assert.match(doc, /2 `createBrowserTab\(\)` tokens/);
  assert.match(doc, /5 `updateBrowserTab\(\)` tokens/);
  assert.match(doc, /4 `queryBrowserTabs\(\)` tokens/);
  assert.match(doc, /15 static\/component `target="_blank"` tokens/);
  assert.match(doc, /4 static\/component `rel` tokens containing `noopener`/);
  assert.match(doc, /14 static\/component `rel` tokens containing `noreferrer`/);
  assert.ok(doc.includes('15 literal external `href="https://...` tokens'));
  assert.match(doc, /2 `mailto:` href tokens/);
  assert.match(doc, /33 HTTPS literal tokens/);
  assert.match(doc, /7 runtime external-navigation surface fixtures/);
  assert.match(doc, /background What.s New accepts caller-supplied URLs/);
  assert.match(doc, /release banner CTA has three open paths/);
  assert.match(doc, /website external links are split across shared and page-local helpers/);
  assert.match(doc, /public URL literals are not classified by URL class/);
  assert.match(doc, /`externalNavigationSurfaceBoundaryContract`, `externalNavigationDecisionReport`, `externalNavigationUrlClassReport`, `externalNavigationTrustedSenderReport`, `externalNavigationWhatsNewUrlPolicy`, `externalNavigationReleaseFallbackPolicy`, `externalNavigationExtensionHtmlLinkPolicy`, `externalNavigationWebsiteLinkPolicy`, `externalNavigationSubscriptionImportTabPolicy`, `externalNavigationPublicUrlDataReport`, `externalNavigationFixtureProvenance`, or `externalNavigationMetricArtifact`/);
});

test('objective coverage ledger records tab-view lifecycle selector boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Tab-view lifecycle\/selector boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_TAB_VIEW_LIFECYCLE_SELECTOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/tab-view-lifecycle-selector-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /runtime observer\/listener\/timer/);
  assert.match(doc, /DOM selector/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /broad tab-view lifecycle counts into direct tab-view hot-file selector proof/);
  assert.match(doc, /2 tab-view source files/);
  assert.match(doc, /12 selected source\/effect blocks/);
  assert.match(doc, /180 lifecycle primitives/);
  assert.match(doc, /147 `addEventListener` callsites/);
  assert.match(doc, /0 `removeEventListener` callsites/);
  assert.match(doc, /0 `MutationObserver` tokens/);
  assert.match(doc, /0 `IntersectionObserver` tokens/);
  assert.match(doc, /1 `setInterval` callsite/);
  assert.match(doc, /1 `clearInterval` callsite/);
  assert.match(doc, /14 `setTimeout` callsites/);
  assert.match(doc, /4 `clearTimeout` callsites/);
  assert.match(doc, /11 `requestAnimationFrame` callsites/);
  assert.match(doc, /2 `cancelAnimationFrame` callsites/);
  assert.match(doc, /1 runtime `onMessage` listener/);
  assert.match(doc, /5 `window\.addEventListener` callsites/);
  assert.match(doc, /2 `document\.addEventListener` callsites/);
  assert.match(doc, /3 `StateManager\.subscribe` callsites/);
  assert.match(doc, /234 `document\.getElementById` tokens/);
  assert.match(doc, /175 unique JS id literals/);
  assert.match(doc, /100 static HTML ids/);
  assert.match(doc, /85 JS id literals not present as static HTML ids/);
  assert.match(doc, /10 static HTML ids not directly reached by JS id literals/);
  assert.match(doc, /30 `querySelector` tokens/);
  assert.match(doc, /27 `querySelectorAll` tokens/);
  assert.match(doc, /6 runtime tab-view lifecycle\/selector fixtures/);
  assert.match(doc, /responsive navigation has a local data-attribute guard/);
  assert.match(doc, /filter saves use local debounce timers/);
  assert.match(doc, /dashboard stats owns the interval/);
  assert.match(doc, /subscription import progress is request\/source-tab filtered/);
  assert.match(doc, /static HTML alone cannot validate dynamic tab-view ids/);
  assert.match(doc, /`tabViewLifecycleSelectorBoundaryContract`, `tabViewLifecycleDecisionReport`, `tabViewSelectorAuthorityReport`, `tabViewDynamicIdProvenanceReport`, `tabViewStaticIdParityReport`, `tabViewListenerOwnerReport`, `tabViewTimerBudgetReport`, `tabViewRuntimeMessageListenerPolicy`, `tabViewBootstrapSplitReport`, `tabViewSettingsSaveTimerReport`, `tabViewDashboardRotationMetricArtifact`, or `tabViewLifecycleFixtureProvenance`/);
});

test('objective coverage ledger records popup lifecycle selector boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Popup lifecycle\/selector boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_POPUP_LIFECYCLE_SELECTOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/popup-lifecycle-selector-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /popup UI/);
  assert.match(doc, /runtime observer\/listener\/timer/);
  assert.match(doc, /generated shell/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /method-level popup proof into direct popup lifecycle\/selector proof/);
  assert.match(doc, /2 popup source files/);
  assert.match(doc, /11 selected source\/effect blocks/);
  assert.match(doc, /33 lifecycle primitives/);
  assert.match(doc, /30 `addEventListener` callsites/);
  assert.match(doc, /0 `removeEventListener` callsites/);
  assert.match(doc, /0 `MutationObserver` tokens/);
  assert.match(doc, /0 `IntersectionObserver` tokens/);
  assert.match(doc, /0 `setInterval` callsites/);
  assert.match(doc, /0 `clearInterval` callsites/);
  assert.match(doc, /2 `setTimeout` callsites/);
  assert.match(doc, /0 `clearTimeout` callsites/);
  assert.match(doc, /1 `requestAnimationFrame` callsite/);
  assert.match(doc, /0 `cancelAnimationFrame` callsites/);
  assert.match(doc, /3 `document\.addEventListener` callsites/);
  assert.match(doc, /0 `window\.addEventListener` callsites/);
  assert.match(doc, /2 `StateManager\.subscribe` callsites/);
  assert.match(doc, /4 `sendRuntimeMessage` tokens/);
  assert.match(doc, /1 `\.runtime\.sendMessage` callsite/);
  assert.match(doc, /5 `window\.open` callsites/);
  assert.match(doc, /52 `document\.getElementById` tokens/);
  assert.match(doc, /23 unique JS id literals/);
  assert.match(doc, /1 static HTML id/);
  assert.match(doc, /23 JS id literals not present as static HTML ids/);
  assert.match(doc, /1 static HTML id not directly reached by JS id literals/);
  assert.match(doc, /4 `querySelector` tokens/);
  assert.match(doc, /6 `querySelectorAll` tokens/);
  assert.match(doc, /82 `document\.createElement` tokens/);
  assert.match(doc, /5 `innerHTML` writes/);
  assert.match(doc, /6 runtime popup lifecycle\/selector fixtures/);
  assert.match(doc, /popup static HTML is a `#popupRoot` shell/);
  assert.match(doc, /video filter controls bind after 100 ms/);
  assert.match(doc, /list-mode controls use a local runtime message helper/);
  assert.match(doc, /static HTML alone cannot validate popup ids/);
  assert.match(doc, /`popupLifecycleSelectorBoundaryContract`, `popupLifecycleDecisionReport`, `popupSelectorAuthorityReport`, `popupDynamicIdProvenanceReport`, `popupGeneratedShellParityReport`, `popupListenerOwnerReport`, `popupDelayedBindingBudgetReport`, `popupRuntimeMessagePolicy`, `popupListModeMutationReport`, `popupProfileLockMutationReport`, `popupExternalOpenPolicy`, or `popupLifecycleFixtureProvenance`/);
});

test('objective coverage ledger records extension UI CSS page-state boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Extension UI CSS page-state boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_EXTENSION_UI_CSS_PAGE_STATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/extension-ui-css-page-state-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /extension UI CSS/);
  assert.match(doc, /responsive\/accessibility/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /CSS load topology into active UI page-state proof/);
  assert.match(doc, /14 selected source files/);
  assert.match(doc, /5 active extension UI CSS files/);
  assert.match(doc, /2 extension HTML pages/);
  assert.match(doc, /3 generated-shell source files/);
  assert.match(doc, /2 generated-shell output files/);
  assert.match(doc, /2 hand-owned UI runtime files/);
  assert.match(doc, /9,329 counted active CSS lines/);
  assert.match(doc, /240,541 active CSS bytes/);
  assert.match(doc, /1,342 lexical rule blocks/);
  assert.match(doc, /115 `!important` declarations/);
  assert.match(doc, /25 `display:none` declarations/);
  assert.match(doc, /36 `@media` blocks/);
  assert.match(doc, /6 `@keyframes` blocks/);
  assert.match(doc, /3 `\[hidden\]` selectors/);
  assert.match(doc, /16 `:focus-visible` selectors/);
  assert.match(doc, /134 `:hover` selectors/);
  assert.match(doc, /255 dark-theme selector prefixes/);
  assert.match(doc, /331 `data-theme` tokens/);
  assert.match(doc, /54 `data-surface` tokens/);
  assert.match(doc, /7 `data-scene` tokens/);
  assert.match(doc, /47 `\.active` selectors/);
  assert.match(doc, /56 `transition` declarations/);
  assert.match(doc, /90 `transform` declarations/);
  assert.match(doc, /5 runtime extension UI CSS page-state fixtures/);
  assert.match(doc, /generated shell output loads before hand-owned popup\/dashboard runtime/);
  assert.match(doc, /shell runtime owns `root\.dataset\.scene`, `root\.dataset\.theme`, `root\.dataset\.surface`, `body\.dataset\.surface`, `ft-extension-surface`, and popup width `392px`/);
  assert.match(doc, /static HTML alone cannot prove theme, scene, surface, enabled\/disabled, lock, active, hover, focus, hidden, motion, or responsive page states/);
  assert.match(doc, /`extensionUiCssPageStateAuthority`, `extensionUiCssStateSelectorReport`, `extensionUiCssShellStateParityReport`, `extensionUiCssResponsiveFixtureReport`, `extensionUiCssAccessibilityFixtureReport`, `extensionUiCssMotionBudgetReport`, `extensionUiCssVisualRegressionReport`, `extensionUiCssGeneratedShellParityGate`, `extensionUiCssThemeScenePolicy`, `extensionUiCssRuntimeStateOwnerReport`, or `extensionUiCssFixtureProvenance`/);
});

test('objective coverage ledger records legacy layout quarantine package boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Legacy layout quarantine\/package boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_LEGACY_LAYOUT_QUARANTINE_PACKAGE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/legacy-layout-quarantine-package-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /code-burden/);
  assert.match(doc, /package\/quarantine/);
  assert.match(doc, /web-accessible resource/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /method-level legacy layout semantics into package\/load proof/);
  assert.match(doc, /`js\/layout\.js` is 680 lines and 30,604 bytes/);
  assert.match(doc, /48831ccdc2d62c75818d9c6a153d7bfacec9d7be9f2408485f74b1a7c13c57c7/);
  assert.match(doc, /5 exported method declarations/);
  assert.match(doc, /63 selector API sites/);
  assert.match(doc, /52 unique static selector literals/);
  assert.match(doc, /146 direct style property writes/);
  assert.match(doc, /34 `style\.display` writes/);
  assert.match(doc, /32 `filter-tube-visible` token occurrences/);
  assert.match(doc, /0 listeners\/timers\/observers\/fetch calls/);
  assert.match(doc, /4 active manifest files/);
  assert.match(doc, /7 active content-script entries/);
  assert.match(doc, /55 active content-script JS refs/);
  assert.match(doc, /19 active web-accessible resource refs/);
  assert.match(doc, /0 active `js\/layout\.js` load\/exposure refs/);
  assert.match(doc, /3 dist manifest files/);
  assert.match(doc, /5 dist content-script entries/);
  assert.match(doc, /41 dist content-script JS refs/);
  assert.match(doc, /14 dist web-accessible resource refs/);
  assert.match(doc, /0 dist `js\/layout\.js` load\/exposure refs/);
  assert.match(doc, /2 extension HTML files/);
  assert.match(doc, /21 extension HTML script tags/);
  assert.match(doc, /0 extension HTML `js\/layout\.js` script refs/);
  assert.match(doc, /3 byte-identical packaged dist copies/);
  assert.match(doc, /3 renderer-inventory `js\/layout\.js` references/);
  assert.match(doc, /`build\.js` still copies the whole `js` directory/);
  assert.match(doc, /active and dist manifests do not load or web-expose `js\/layout\.js`/);
  assert.match(doc, /no current non-doc runtime caller reaches `window\.filterTubeLayout` outside `js\/layout\.js` itself/);
  assert.match(doc, /renderer inventory layout-fix rows cannot be treated as active filtering coverage proof/);
  assert.match(doc, /`legacyLayoutQuarantineBoundaryContract`, `legacyLayoutPackageInclusionReport`, `legacyLayoutActiveLoadReport`, `legacyLayoutDistCopyParityReport`, `legacyLayoutRuntimeCallerReport`, `legacyLayoutInventoryDependencyReport`, `legacyLayoutWebAccessiblePolicy`, `legacyLayoutNativeSyncParityReport`, `legacyLayoutReactivationFixtureProvenance`, or `legacyLayoutDeletionReadinessArtifact`/);
});

test('objective coverage ledger records quarantined content CSS package boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Quarantined content CSS package boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_QUARANTINED_CONTENT_CSS_PACKAGE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/quarantined-content-css-package-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /quarantined content CSS package\/load proof/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /3 selected quarantined content CSS files/);
  assert.match(doc, /1,262 counted source lines/);
  assert.match(doc, /43,883 bytes/);
  assert.match(doc, /137 lexical rule blocks/);
  assert.match(doc, /478 `!important` declarations/);
  assert.match(doc, /22 `display:none` declarations/);
  assert.match(doc, /72 `:not\(\.filter-tube-visible\)` clauses/);
  assert.match(doc, /167 `filter-tube-visible` tokens/);
  assert.match(doc, /6 `filtertube-hidden` tokens/);
  assert.match(doc, /14 `:has\(\.\.\.\)` selectors/);
  assert.match(doc, /1 `clip-path` declaration/);
  assert.match(doc, /8 `pointer-events:none` declarations/);
  assert.match(doc, /10 `visibility:hidden` declarations/);
  assert.match(doc, /10 `opacity:0` declarations/);
  assert.match(doc, /4 active manifest files/);
  assert.match(doc, /7 active content-script entries/);
  assert.match(doc, /55 active content-script JS refs/);
  assert.match(doc, /0 active content script CSS refs/);
  assert.match(doc, /19 active web-accessible resource refs/);
  assert.match(doc, /0 active quarantined CSS load\/exposure refs/);
  assert.match(doc, /3 dist manifest files/);
  assert.match(doc, /5 dist content-script entries/);
  assert.match(doc, /41 dist content-script JS refs/);
  assert.match(doc, /0 dist content script CSS refs/);
  assert.match(doc, /14 dist web-accessible resource refs/);
  assert.match(doc, /0 dist quarantined CSS load\/exposure refs/);
  assert.match(doc, /3 extension HTML files/);
  assert.match(doc, /10 extension HTML link tags/);
  assert.match(doc, /0 extension HTML quarantined CSS links/);
  assert.match(doc, /9 byte-identical packaged dist CSS copies/);
  assert.match(doc, /`js\/layout\.js` with 32 occurrences/);
  assert.match(doc, /`build\.js` still copies the whole `css` directory/);
  assert.match(doc, /active and dist manifests do not load or web-expose the selected CSS/);
  assert.match(doc, /extension HTML does not link it/);
  assert.match(doc, /old default-hide\/reveal model/);
  assert.match(doc, /active runtime hiding uses `\.filtertube-hidden` \/ `\.filtertube-hidden-shelf`/);
  assert.match(doc, /`quarantinedContentCssPackageBoundaryContract`, `quarantinedContentCssManifestLoadReport`, `quarantinedContentCssDistCopyParityReport`, `quarantinedContentCssLegacyRevealPolicy`, `quarantinedContentCssActivationFixtureProvenance`, `quarantinedContentCssDeletionReadinessArtifact`, `quarantinedContentCssNativeSyncParityReport`, `quarantinedContentCssFalseHideFixtureReport`, `quarantinedContentCssPackageCleanupGate`, or `quarantinedContentCssWebAccessiblePolicy`/);
});

test('objective coverage ledger records storage payload quota boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Storage payload quota boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_STORAGE_PAYLOAD_QUOTA_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/storage-payload-quota-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /payload-size and quota-adjacent proof/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /5 storage payload quota source files/);
  assert.match(doc, /14 source\/effect blocks/);
  assert.match(doc, /196 background map cache cluster block lines/);
  assert.match(doc, /6514 background map cache cluster block bytes/);
  assert.match(doc, /97 background auto-backup block lines/);
  assert.match(doc, /3751 background auto-backup block bytes/);
  assert.match(doc, /96 IO export block lines/);
  assert.match(doc, /3941 IO export block bytes/);
  assert.match(doc, /89 IO auto-backup block lines/);
  assert.match(doc, /4063 IO auto-backup block bytes/);
  assert.match(doc, /30 IO save-backup block lines/);
  assert.match(doc, /1267 IO save-backup block bytes/);
  assert.match(doc, /16 Nanah portable-payload block lines/);
  assert.match(doc, /633 Nanah portable-payload block bytes/);
  assert.match(doc, /50 tab-view Nanah parse block lines/);
  assert.match(doc, /2632 tab-view Nanah parse block bytes/);
  assert.match(doc, /0 selected `getBytesInUse` tokens/);
  assert.match(doc, /0 selected `QUOTA` tokens/);
  assert.match(doc, /background whole-map writes use entry-count caps for video maps rather than byte budgets/);
  assert.match(doc, /`channelMap` has no equivalent entry cap/);
  assert.match(doc, /backup\/export paths stringify entire payloads without byte budgets/);
  assert.match(doc, /backup rotation keeps records rather than bytes/);
  assert.match(doc, /Nanah envelopes stringify and parse settings payloads without size gates/);
  assert.match(doc, /StateManager can write the full `channelMap` directly/);
  assert.match(doc, /`storagePayloadQuotaBoundaryContract`, `storagePayloadByteBudgetReport`, `storageGetBytesInUsePreflight`, `storageQuotaErrorClassifier`, `storageMapEntryAndByteCapPolicy`, `storageBackupPayloadBudget`, `storageNanahEnvelopeSizePolicy`, `storageExportImportPayloadManifest`, `storageBackupRotationByteReport`, or `storageQuotaFixtureProvenance`/);
});

test('objective coverage ledger records backup download blob URL lifecycle boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Backup download Blob URL lifecycle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BACKUP_DOWNLOAD_BLOB_URL_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/backup-download-blob-url-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /direct Blob URL lifecycle proof/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /3 backup download Blob URL lifecycle source files/);
  assert.match(doc, /10 source\/effect blocks/);
  assert.match(doc, /10 background revoke block lines/);
  assert.match(doc, /298 background revoke block bytes/);
  assert.match(doc, /47 background downloads API wrapper block lines/);
  assert.match(doc, /1804 background downloads API wrapper block bytes/);
  assert.match(doc, /16 background auto-backup Blob download block lines/);
  assert.match(doc, /637 background auto-backup Blob download block bytes/);
  assert.match(doc, /9 IO revoke block lines/);
  assert.match(doc, /330 IO revoke block bytes/);
  assert.match(doc, /46 IO downloads wrapper block lines/);
  assert.match(doc, /1988 IO downloads wrapper block bytes/);
  assert.match(doc, /40 IO directory probe block lines/);
  assert.match(doc, /1791 IO directory probe block bytes/);
  assert.match(doc, /29 IO save-backup block lines/);
  assert.match(doc, /1269 IO save-backup block bytes/);
  assert.match(doc, /10 tab-view revoke block lines/);
  assert.match(doc, /363 tab-view revoke block bytes/);
  assert.match(doc, /26 tab-view anchor fallback block lines/);
  assert.match(doc, /956 tab-view anchor fallback block bytes/);
  assert.match(doc, /40 tab-view download folder block lines/);
  assert.match(doc, /2028 tab-view download folder block bytes/);
  assert.match(doc, /6 selected `URL\.createObjectURL` tokens/);
  assert.match(doc, /6 selected `URL\.revokeObjectURL` tokens/);
  assert.match(doc, /0 selected `removeFile` tokens/);
  assert.match(doc, /0 selected `clearObjectUrl` tokens/);
  assert.match(doc, /background object URL cleanup is scheduled only after downloads API resolution/);
  assert.match(doc, /wrappers have settled guards but no timeout owner/);
  assert.match(doc, /IO directory probing writes `\.test`/);
  assert.match(doc, /IO backup save creates its object URL before probing/);
  assert.match(doc, /tab-view anchor fallback uses timed DOM removal and delayed URL revocation/);
  assert.match(doc, /downloads API failure can allocate a second anchor object URL/);
  assert.match(doc, /selected sources use `downloads\.erase` without filesystem deletion proof/);
  assert.match(doc, /`backupDownloadBlobUrlLifecycleContract`, `backupDownloadObjectUrlRegistry`, `backupDownloadRevokePolicy`, `backupDownloadApiResultReport`, `backupDownloadAnchorFallbackPolicy`, `backupDownloadProbePolicy`, `backupDownloadFilesystemDeletionProof`, `backupDownloadTimeoutBudget`, `backupDownloadErrorClassificationReport`, or `backupDownloadCleanupMetricArtifact`/);
});

test('objective coverage ledger records security crypto payload boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Security crypto payload boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SECURITY_CRYPTO_PAYLOAD_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/security-crypto-payload-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /executable crypto payload proof/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /5 security crypto payload source files/);
  assert.match(doc, /10 source\/effect blocks/);
  assert.match(doc, /15 createPinVerifier block lines/);
  assert.match(doc, /565 createPinVerifier block bytes/);
  assert.match(doc, /13 verifyPin block lines/);
  assert.match(doc, /620 verifyPin block bytes/);
  assert.match(doc, /31 encryptJson block lines/);
  assert.match(doc, /1051 encryptJson block bytes/);
  assert.match(doc, /36 decryptJson block lines/);
  assert.match(doc, /1264 decryptJson block bytes/);
  assert.match(doc, /19 background encrypted auto-backup block lines/);
  assert.match(doc, /678 background encrypted auto-backup block bytes/);
  assert.match(doc, /30 IO encrypted export block lines/);
  assert.match(doc, /1415 IO encrypted export block bytes/);
  assert.match(doc, /13 IO encrypted import block lines/);
  assert.match(doc, /686 IO encrypted import block bytes/);
  assert.match(doc, /17 tab-view encrypted decrypt block lines/);
  assert.match(doc, /890 tab-view encrypted decrypt block bytes/);
  assert.match(doc, /0 selected `additionalData` tokens/);
  assert.match(doc, /0 selected `version` tokens/);
  assert.match(doc, /PIN verifier output is deterministic with injected salt/);
  assert.match(doc, /encrypted JSON output is deterministic with injected salt and IV/);
  assert.match(doc, /unsupported KDF\/cipher and invalid payloads throw local errors/);
  assert.match(doc, /wrong passwords surface WebCrypto `OperationError`/);
  assert.match(doc, /background encrypted auto-backup wraps \`\{ meta: \{ encrypted: true \}, encrypted \}\`/);
  assert.match(doc, /`importV3Encrypted\(\)` still delegates without `targetProfileId`/);
  assert.match(doc, /`securityCryptoPayloadBoundaryContract`, `securityCryptoPayloadSchemaReport`, `securityPinVerifierTimingPolicy`, `securityPinVerifierIterationBounds`, `securityEncryptedJsonVersionPolicy`, `securityEncryptedJsonAadPolicy`, `securityEncryptedPayloadSizeBudget`, `securityEncryptedPayloadCompatibilityMatrix`, `securityEncryptedPayloadTamperFixture`, or `securityEncryptedPayloadCallerContract`/);
});

test('objective coverage ledger records UI components portal lifecycle boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /UI components portal lifecycle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_UI_COMPONENTS_PORTAL_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/ui-components-portal-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /direct portal\/timer proof/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /1 UI components portal lifecycle source file/);
  assert.match(doc, /3 source\/effect blocks/);
  assert.match(doc, /26 `flashButtonSuccess` block lines/);
  assert.match(doc, /1132 `flashButtonSuccess` block bytes/);
  assert.match(doc, /378 `createDropdownFromSelect` block lines/);
  assert.match(doc, /14973 dropdown block bytes/);
  assert.match(doc, /20 `showToast` block lines/);
  assert.match(doc, /633 toast block bytes/);
  assert.match(doc, /10 selected `document\.createElement` tokens/);
  assert.match(doc, /7 selected `addEventListener` tokens/);
  assert.match(doc, /3 selected `setTimeout` tokens/);
  assert.match(doc, /4 selected `requestAnimationFrame` tokens/);
  assert.match(doc, /1 selected `MutationObserver` token/);
  assert.match(doc, /0 selected `disconnect` tokens/);
  assert.match(doc, /0 selected `removeEventListener` tokens/);
  assert.match(doc, /`flashButtonSuccess\(\)` uses an uncancelled timer/);
  assert.match(doc, /`createDropdownFromSelect\(\)` has local duplicate guards/);
  assert.match(doc, /appends a dropdown portal to `document\.body`/);
  assert.match(doc, /installs listener and observer work without local removal\/disconnect/);
  assert.match(doc, /dispatches synthetic select events/);
  assert.match(doc, /`showToast\(\)` removes existing `\.ft-toast` nodes/);
  assert.match(doc, /nested timers/);
  assert.match(doc, /`uiComponentsPortalLifecycleContract`, `uiComponentsDropdownPortalRegistry`, `uiComponentsDropdownListenerOwnerReport`, `uiComponentsDropdownObserverTeardownReport`, `uiComponentsFrameBudgetReport`, `uiComponentsToastTimerBudget`, `uiComponentsTransientButtonTimerReport`, `uiComponentsDuplicateEnhancementPolicy`, `uiComponentsBodyPortalCleanupProof`, `uiComponentsAccessibilityStateReport`, `uiComponentsFixtureProvenance`, or `uiComponentsLifecycleMetricArtifact`/);
});

test('objective coverage ledger records StateManager storage reload enrichment lifecycle boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /StateManager storage reload\/enrichment lifecycle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_STATE_MANAGER_STORAGE_RELOAD_ENRICHMENT_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/state-manager-storage-reload-enrichment-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /direct storage reload and enrichment lifecycle proof/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /1 StateManager storage reload\/enrichment lifecycle source file/);
  assert.match(doc, /4 source\/effect blocks/);
  assert.match(doc, /11 `scheduleChannelNameEnrichment` block lines/);
  assert.match(doc, /343 `scheduleChannelNameEnrichment` block bytes/);
  assert.match(doc, /57 `processChannelEnrichmentQueue` block lines/);
  assert.match(doc, /2074 `processChannelEnrichmentQueue` block bytes/);
  assert.match(doc, /58 `saveSettings` block lines/);
  assert.match(doc, /2675 `saveSettings` block bytes/);
  assert.match(doc, /120 `setupStorageListener` block lines/);
  assert.match(doc, /5053 `setupStorageListener` block bytes/);
  assert.match(doc, /5 selected `setTimeout` tokens/);
  assert.match(doc, /0 selected `clearTimeout` tokens/);
  assert.match(doc, /1 selected `chrome\.storage\.onChanged\.addListener` token/);
  assert.match(doc, /4 selected `isSaving` tokens/);
  assert.match(doc, /4 selected `notifyListeners` tokens/);
  assert.match(doc, /39 selected storage key literal rows/);
  assert.match(doc, /`saveSettings\(\)` drops concurrent calls while `isSaving`/);
  assert.match(doc, /channel enrichment uses zero-delay scheduling/);
  assert.match(doc, /sends `addFilteredChannel`/);
  assert.match(doc, /delays next work by randomized 5000-6999 ms backoff/);
  assert.match(doc, /storage listener skips non-local, saving, and map-only `channelMap` changes/);
  assert.match(doc, /theme changes emit `themeChanged`/);
  assert.match(doc, /external reload uses a 150 ms debounce/);
  assert.match(doc, /loads with `notify:false`, `resetEnrichment:false`, and `scheduleEnrichment:false`/);
  assert.match(doc, /no clear\/remove teardown path exists in the selected block/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /reload lifecycle contracts/);
  assert.match(doc, /timer budgets/);
  assert.match(doc, /save queue contracts/);
  assert.match(doc, /storage-key parity reports/);
  assert.match(doc, /first-class StateManager storage reload\/enrichment lifecycle gates/);
});

test('objective coverage ledger records background compiled cache invalidation lifecycle boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Background compiled cache invalidation lifecycle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BACKGROUND_COMPILED_CACHE_INVALIDATION_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/background-compiled-cache-invalidation-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /direct background compiled cache invalidation lifecycle proof/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /1 background compiled cache invalidation lifecycle source file/);
  assert.match(doc, /8 source\/effect blocks/);
  assert.match(doc, /1 cacheShape block line/);
  assert.match(doc, /56 cacheShape block bytes/);
  assert.match(doc, /8 getCompiledSettingsCacheGate block lines/);
  assert.match(doc, /414 getCompiledSettingsCacheGate block bytes/);
  assert.match(doc, /44 getCompiledSettingsStorageKeys block lines/);
  assert.match(doc, /1408 getCompiledSettingsStorageKeys block bytes/);
  assert.match(doc, /4 getCompiledSettingsMigrationWrite block lines/);
  assert.match(doc, /185 getCompiledSettingsMigrationWrite block bytes/);
  assert.match(doc, /10 getCompiledSettingsCacheAssign block lines/);
  assert.match(doc, /336 getCompiledSettingsCacheAssign block bytes/);
  assert.match(doc, /24 runtimeGetCompiledSettingsBranch block lines/);
  assert.match(doc, /1474 runtimeGetCompiledSettingsBranch block bytes/);
  assert.match(doc, /16 applySettingsBranch block lines/);
  assert.match(doc, /855 applySettingsBranch block bytes/);
  assert.match(doc, /41 storageInvalidationListener block lines/);
  assert.match(doc, /1464 storageInvalidationListener block bytes/);
  assert.match(doc, /43 compiler storage key rows/);
  assert.match(doc, /14 background invalidation key rows/);
  assert.match(doc, /30 compiler-only storage key rows/);
  assert.match(doc, /1 invalidation-only storage key row/);
  assert.match(doc, /10 selected `compiledSettingsCache` tokens/);
  assert.match(doc, /7 selected `getCompiledSettings` tokens/);
  assert.match(doc, /2 selected `FilterTube_ApplySettings` tokens/);
  assert.match(doc, /0 selected `compiledSettingsRevision` tokens/);
  assert.match(doc, /cache identity is only `main` and `kids`/);
  assert.match(doc, /compiler and runtime message cache gates can return before storage read/);
  assert.match(doc, /`getCompiledSettings\(\)` reads 43 direct storage keys/);
  assert.match(doc, /can write `storageUpdates` during compilation/);
  assert.match(doc, /`FilterTube_ApplySettings` assigns caller `request\.settings` into cache/);
  assert.match(doc, /storage invalidation watches 14 keys/);
  assert.match(doc, /omits 30 direct compiler keys/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /key parity reports/);
  assert.match(doc, /revision reports/);
  assert.match(doc, /invalidation decision reports/);
  assert.match(doc, /caller-payload policies/);
  assert.match(doc, /first-class background compiled cache invalidation gates/);
});

test('objective coverage ledger records StateManager request refresh fanout boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /StateManager request refresh fanout boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_STATE_MANAGER_REQUEST_REFRESH_FANOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/state-manager-request-refresh-fanout-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /direct request-refresh fanout proof/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /1 StateManager request refresh fanout source file/);
  assert.match(doc, /10 source\/effect blocks/);
  assert.match(doc, /59 saveSettingsBroadcastPath block lines/);
  assert.match(doc, /2677 saveSettingsBroadcastPath block bytes/);
  assert.match(doc, /11 broadcastSettings block lines/);
  assert.match(doc, /309 broadcastSettings block bytes/);
  assert.match(doc, /15 requestRefresh block lines/);
  assert.match(doc, /486 requestRefresh block bytes/);
  assert.match(doc, /302 kidsRequestRefreshMutations block lines/);
  assert.match(doc, /11258 kidsRequestRefreshMutations block bytes/);
  assert.match(doc, /214 mainKeywordRequestRefreshMutations block lines/);
  assert.match(doc, /8120 mainKeywordRequestRefreshMutations block bytes/);
  assert.match(doc, /18 requestRefresh callsite rows/);
  assert.match(doc, /10 selected `await requestRefresh\('main'\)` tokens/);
  assert.match(doc, /8 selected `await requestRefresh\('kids'\)` tokens/);
  assert.match(doc, /3 selected `broadcastSettings\(` tokens/);
  assert.match(doc, /1 selected `FilterTube_ApplySettings` token/);
  assert.match(doc, /0 selected `settingsRevision` tokens/);
  assert.match(doc, /`saveSettings\(\)` can broadcast `result\.compiledSettings` directly/);
  assert.match(doc, /`requestRefresh\(\)` asks background for `getCompiledSettings` with `forceRefresh:true`/);
  assert.match(doc, /Main whitelist branches use `persistMainProfiles\(\)` plus `requestRefresh\('main'\)`/);
  assert.match(doc, /Kids mutation branches use profile persistence plus `requestRefresh\('kids'\)`/);
  assert.match(doc, /Main content\/category changes can produce direct save broadcast plus background force-refresh rebound/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /request-refresh contracts/);
  assert.match(doc, /direct compiled broadcast policies/);
  assert.match(doc, /background refresh rebound policies/);
  assert.match(doc, /first-class StateManager refresh fanout gates/);
});

test('objective coverage ledger records Nanah vendor runtime session lifecycle boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Nanah vendor runtime session lifecycle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_NANAH_VENDOR_RUNTIME_SESSION_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/nanah-vendor-runtime-session-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /generated runtime session proof/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /4 selected source files/);
  assert.match(doc, /`js\/vendor\/nanah\.bundle\.js` at 876 lines and 27692 bytes/);
  assert.match(doc, /1 `WebRtcDataChannelTransport` class at line 489 with 381 lines and 12964 bytes/);
  assert.match(doc, /8 selected `addEventListener` tokens/);
  assert.match(doc, /0 selected `removeEventListener` tokens/);
  assert.match(doc, /0 selected timers/);
  assert.match(doc, /18 selected `crypto\.subtle` tokens/);
  assert.match(doc, /6 selected `getRandomValues` tokens/);
  assert.match(doc, /6 selected `randomUUID` tokens/);
  assert.match(doc, /6 selected `AES-GCM` tokens/);
  assert.match(doc, /6 selected `HKDF` tokens/);
  assert.match(doc, /7 selected `ECDH` tokens/);
  assert.match(doc, /5 selected `MAX_DATA_CHANNEL_MESSAGE_CHARS` tokens/);
  assert.match(doc, /4 selected `incomingChunks` tokens/);
  assert.match(doc, /7 dashboard `client\.on` registrations/);
  assert.match(doc, /3 `nanahClient\.send` call sites/);
  assert.match(doc, /1 `nanahClient\.confirmSas` gate/);
  assert.match(doc, /1 SAS relay impersonation warning/);
  assert.match(doc, /Nanah carries settings payloads rather than YouTube response JSON/);
  assert.match(doc, /without selected remove-listener tokens/);
  assert.match(doc, /no selected timeout\/reconnect\/chunk-expiry tokens/);
  assert.match(doc, /first-class JSON filter parity is not proven/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /connect timeout policies/);
  assert.match(doc, /listener-owner teardown reports/);
  assert.match(doc, /crypto handshake fixtures/);
  assert.match(doc, /first-class Nanah JSON filter parity gates/);
});

test('objective coverage ledger records extension icon logo package parity boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Extension icon\/logo package parity boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_EXTENSION_ICON_LOGO_PACKAGE_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/extension-icon-logo-package-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /direct icon\/logo package parity proof/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /10 selected binary\/vector files/);
  assert.match(doc, /29,560 bytes/);
  assert.match(doc, /7 root icon files/);
  assert.match(doc, /3 website icon\/logo files/);
  assert.match(doc, /4 byte-identical 128px PNG files/);
  assert.match(doc, /13,624 duplicate-group bytes/);
  assert.match(doc, /10,218 duplicate overhead bytes beyond one retained copy/);
  assert.match(doc, /28 active manifest icon references across 4 manifests/);
  assert.match(doc, /12 action icon entries/);
  assert.match(doc, /16 extension icon entries/);
  assert.match(doc, /`icons\/file\.svg` web-accessible exposure in default\/Chrome\/Firefox but not Opera/);
  assert.match(doc, /2 packaged-but-manifest-inactive root icon files/);
  assert.match(doc, /1 dashboard `\.\.\/icons\/icon-128\.png` consumer/);
  assert.match(doc, /2 popup `\.\.\/icons\/icon-48\.png` source\/output consumers/);
  assert.match(doc, /3 website `\/brand\/logo\.png` route\/header consumers/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /package artifact proof/);
  assert.match(doc, /manifest parity reports/);
  assert.match(doc, /native\/store parity proof/);
  assert.match(doc, /first-class icon\/logo package parity gates/);
});

test('objective coverage ledger records release notes JSON version gate boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Release notes JSON version gate boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_RELEASE_NOTES_JSON_VERSION_GATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/release-notes-json-version-gate-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /direct release-note JSON version-gate proof/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`data\/release_notes\.json` at 317 lines/);
  assert.match(doc, /23,039 bytes/);
  assert.match(doc, /sha256 `e012f6c071fffa67958f55544ecae9bbb26e7ec91edd2066df4d06a62de69962`/);
  assert.match(doc, /24 array rows/);
  assert.match(doc, /1 comment row/);
  assert.match(doc, /23 version rows/);
  assert.match(doc, /7 current top-level keys/);
  assert.match(doc, /110 highlight strings/);
  assert.match(doc, /newest staged version `3\.3\.2`/);
  assert.match(doc, /packaged extension\/browser version `3\.3\.1`/);
  assert.match(doc, /one missing `detailsUrl` row for `3\.3\.2`/);
  assert.match(doc, /19 release-tag details URLs/);
  assert.match(doc, /3 commit details URLs/);
  assert.match(doc, /4 manifest prompt loads/);
  assert.match(doc, /13-line background JSON loader/);
  assert.match(doc, /20-line background payload builder/);
  assert.match(doc, /14-line update payload block/);
  assert.match(doc, /64-line background release-note message branch/);
  assert.match(doc, /104-line dashboard loader/);
  assert.match(doc, /250-line content prompt/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /schema reports/);
  assert.match(doc, /package\/manifest parity gates/);
  assert.match(doc, /staged-entry policy/);
  assert.match(doc, /details URL policy/);
  assert.match(doc, /prompt sender gates/);
  assert.match(doc, /What's New URL policy/);
  assert.match(doc, /dashboard render fixtures/);
  assert.match(doc, /native parity reports/);
  assert.match(doc, /first-class JSON filter promotion gates/);
});

test('objective coverage ledger records design token JSON CSS parity boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Design token JSON\/CSS parity boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_DESIGN_TOKEN_JSON_CSS_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/design-token-json-css-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /direct design-token JSON\/CSS parity proof/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /`design\/design_tokens\.json` at 82 lines/);
  assert.match(doc, /1,902 bytes/);
  assert.match(doc, /sha256 `57bada64f3690a22fedea5f07aadc029e129f971465f8c66baab4a005984b3f0`/);
  assert.match(doc, /metadata version `0\.1\.0`/);
  assert.match(doc, /updated `2025-11-18`/);
  assert.match(doc, /6 top-level keys/);
  assert.match(doc, /53 leaf values/);
  assert.match(doc, /`css\/design_tokens\.css` at 302 lines/);
  assert.match(doc, /10,361 bytes/);
  assert.match(doc, /80 base `--ft-\*` definitions/);
  assert.match(doc, /192 total CSS variable declarations/);
  assert.match(doc, /715 selected active `var\(--ft-\.\.\.\)` references/);
  assert.match(doc, /82 unique referenced variables/);
  assert.match(doc, /29 undefined referenced variables/);
  assert.match(doc, /27 unreferenced CSS token definitions/);
  assert.match(doc, /43 mapped JSON leaves/);
  assert.match(doc, /3 exact JSON\/CSS matches/);
  assert.match(doc, /40 divergent mapped values/);
  assert.match(doc, /popup\/dashboard HTML design-token load order/);
  assert.match(doc, /empty troubleshoot HTML/);
  assert.match(doc, /`build\.js` package-copy of `css` but not `design`/);
  assert.match(doc, /no design-token package script/);
  assert.match(doc, /no `build\.js` reference to `design\/design_tokens\.json`/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /schema reports/);
  assert.match(doc, /CSS generation reports/);
  assert.match(doc, /undefined\/unused variable budgets/);
  assert.match(doc, /HTML load reports/);
  assert.match(doc, /theme\/scene parity reports/);
  assert.match(doc, /visual fixture provenance/);
  assert.match(doc, /first-class JSON promotion gates/);
});

test('objective coverage ledger records package lock script optional dependency boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Package lock script\/optional dependency boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_PACKAGE_LOCK_SCRIPT_OPTIONAL_DEPENDENCY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/package-lock-script-optional-dependency-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct lockfile script\/optional dependency proof/);
  assert.match(doc, /`package\.json` at 61 lines/);
  assert.match(doc, /`package-lock\.json` at 1,461 lines/);
  assert.match(doc, /`website\/package\.json` at 23 lines/);
  assert.match(doc, /`website\/package-lock\.json` at 1,678 lines/);
  assert.match(doc, /root lockfile version 3 with 112 package entries/);
  assert.match(doc, /1 install-script marker/);
  assert.match(doc, /26 optional `@esbuild\/\*` entries/);
  assert.match(doc, /website lockfile version 3 with 101 package entries/);
  assert.match(doc, /65 optional entries/);
  assert.match(doc, /6 no-integrity\/no-resolved bundled nested Tailwind wasm entries/);
  assert.match(doc, /7 bundled marker entries/);
  assert.match(doc, /5 peer dependency entries/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /lifecycle-script allowlists/);
  assert.match(doc, /clean-install transcripts/);
  assert.match(doc, /optional platform manifests/);
  assert.match(doc, /dependency-burden budgets/);
  assert.match(doc, /first-class JSON config gates/);
});

test('objective coverage ledger records website remote request privacy performance boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Website remote request privacy\/performance boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WEBSITE_REMOTE_REQUEST_PRIVACY_PERFORMANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/website-remote-request-privacy-performance-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct website remote request proof/);
  assert.match(doc, /29 tracked website source\/config text files/);
  assert.match(doc, /14 selected file fingerprints/);
  assert.match(doc, /39 URL-like literal tokens/);
  assert.match(doc, /23 unique URL-like literal tokens/);
  assert.match(doc, /6 `cdnjs\.cloudflare\.com` browser-logo URL literals/);
  assert.match(doc, /1 `@vercel\/analytics\/next` import/);
  assert.match(doc, /1 `<Analytics \/>` render site/);
  assert.match(doc, /1 `next\/font\/google` import/);
  assert.match(doc, /1 raw `<img` path for `browser\.logo`/);
  assert.match(doc, /1 Next `<Image` path for the local website logo/);
  assert.match(doc, /0 tracked website `fetch\(` callsites/);
  assert.match(doc, /0 `MutationObserver` tokens/);
  assert.match(doc, /0 `new Image` tokens/);
  assert.match(doc, /8 `target="_blank"` tokens/);
  assert.match(doc, /8 `rel="noreferrer"` tokens/);
  assert.match(doc, /0 `rel="noopener noreferrer"` tokens/);
  assert.match(doc, /3 `window\.localStorage` tokens/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /analytics scope reports/);
  assert.match(doc, /remote request manifests/);
  assert.match(doc, /CDN-logo localization decisions/);
  assert.match(doc, /font request policies/);
  assert.match(doc, /privacy-copy parity/);
  assert.match(doc, /route performance budgets/);
  assert.match(doc, /public URL class reports/);
  assert.match(doc, /browser-side request evidence/);
  assert.match(doc, /deploy artifact gates/);
  assert.match(doc, /first-class JSON public-claim gates/);
});

test('objective coverage ledger records JSON-first whitelist decision identity boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first whitelist decision identity boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_WHITELIST_DECISION_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-whitelist-decision-identity-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /whitelist identity proof/);
  assert.match(doc, /1 whitelist decision identity boundary source file/);
  assert.match(doc, /301 _shouldBlock block lines/);
  assert.match(doc, /15380 _shouldBlock block bytes/);
  assert.match(doc, /105 whitelist decision branch lines/);
  assert.match(doc, /5392 whitelist decision branch bytes/);
  assert.match(doc, /9 whitelist no-rule block lines/);
  assert.match(doc, /327 whitelist no-rule block bytes/);
  assert.match(doc, /17 whitelist channel loop lines/);
  assert.match(doc, /961 whitelist channel loop bytes/);
  assert.match(doc, /15 whitelist keyword loop lines/);
  assert.match(doc, /687 whitelist keyword loop bytes/);
  assert.match(doc, /27 whitelist unresolved\/page fallback lines/);
  assert.match(doc, /1379 whitelist unresolved\/page fallback bytes/);
  assert.match(doc, /8 whitelist no-match tail lines/);
  assert.match(doc, /288 whitelist no-match tail bytes/);
  assert.match(doc, /6 _logWhitelistDecision tokens/);
  assert.match(doc, /`allow:matched_channel`/);
  assert.match(doc, /`allow:matched_keyword`/);
  assert.match(doc, /`allow:creator_page_whitelisted`/);
  assert.match(doc, /`block:no_whitelist_rules`/);
  assert.match(doc, /`block:unresolved_identity`/);
  assert.match(doc, /`block:no_whitelist_match`/);
  assert.match(doc, /3 `pageChannelMeta` tokens/);
  assert.match(doc, /5 whitelist-branch `return false` tokens/);
  assert.match(doc, /3 whitelist-branch `return true` tokens/);
  assert.match(doc, /6 runtime whitelist identity fixtures/);
  assert.match(doc, /empty whitelist fail-closed behavior/);
  assert.match(doc, /channel allow behavior/);
  assert.match(doc, /keyword allow\/no-match behavior/);
  assert.match(doc, /creator-page fallback behavior/);
  assert.match(doc, /unresolved identity fail-closed behavior/);
  assert.match(doc, /comment whitelist bypass behavior/);
  assert.match(doc, /absent shared whitelist decision identity authority/);
  assert.match(doc, /No `jsonFirstWhitelistDecisionContract`, `jsonFirstWhitelistIdentityDecisionReport`, `jsonFirstWhitelistEmptyRulePolicy`, `jsonFirstWhitelistChannelAllowReport`, `jsonFirstWhitelistKeywordAllowReport`, `jsonFirstWhitelistCreatorPageFallbackReport`, `jsonFirstWhitelistUnresolvedIdentityPolicy`, `jsonFirstWhitelistCommentPolicy`, `jsonFirstWhitelistNoMatchReason`, or `jsonFirstWhitelistDecisionFixtureProvenance` exists/);
});

test('objective coverage ledger records JSON-first list-mode matrix boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /JSON-first list-mode matrix boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-list-mode-matrix-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct list-mode matrix proof/);
  assert.match(doc, /1 list-mode matrix boundary source file/);
  assert.match(doc, /301 _shouldBlock block lines/);
  assert.match(doc, /15380 _shouldBlock block bytes/);
  assert.match(doc, /5 list-mode setup block lines/);
  assert.match(doc, /368 list-mode setup block bytes/);
  assert.match(doc, /105 whitelist decision branch lines/);
  assert.match(doc, /5392 whitelist decision branch bytes/);
  assert.match(doc, /85 blocklist decision tail lines/);
  assert.match(doc, /4702 blocklist decision tail bytes/);
  assert.match(doc, /32 processData block lines/);
  assert.match(doc, /1240 processData block bytes/);
  assert.match(doc, /7 enabled skip block lines/);
  assert.match(doc, /387 enabled skip block bytes/);
  assert.match(doc, /6 runtime list-mode matrix fixtures/);
  assert.match(doc, /disabled original-payload return/);
  assert.match(doc, /empty blocklist preserve behavior/);
  assert.match(doc, /empty whitelist fail-closed behavior/);
  assert.match(doc, /unknown-mode blocklist fallback/);
  assert.match(doc, /dormant whitelist rows outside exact whitelist mode/);
  assert.match(doc, /blocklist-over-whitelist conflict behavior/);
  assert.match(doc, /whitelist-over-blocklist conflict behavior/);
  assert.match(doc, /comment empty-whitelist bypass behavior/);
  assert.match(doc, /comment author blocklist behavior/);
  assert.match(doc, /absent shared list-mode matrix authority/);
  assert.match(doc, /No `jsonFirstListModeMatrixContract`, `jsonFirstListModeDecisionReport`, `jsonFirstDisabledModeHarvestPolicy`, `jsonFirstEmptyBlocklistPolicy`, `jsonFirstEmptyWhitelistPolicy`, `jsonFirstUnknownListModeFallbackPolicy`, `jsonFirstSimultaneousAllowBlockPolicy`, `jsonFirstBlocklistWhitelistConflictReport`, `jsonFirstCommentListModePolicy`, or `jsonFirstListModeFixtureProvenance` exists/);
});

test('objective coverage ledger records seed fetch no-work list-mode boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Seed fetch no-work\/list-mode boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SEED_FETCH_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/seed-fetch-no-work-list-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /fetch-transport no-work proof/);
  assert.match(doc, /1 seed fetch no-work\/list-mode boundary source file/);
  assert.match(doc, /139 shouldSkipEngineProcessing block lines/);
  assert.match(doc, /6452 shouldSkipEngineProcessing block bytes/);
  assert.match(doc, /99 processWithEngine block lines/);
  assert.match(doc, /4797 processWithEngine block bytes/);
  assert.match(doc, /86 setupFetchInterception block lines/);
  assert.match(doc, /4263 setupFetchInterception block bytes/);
  assert.match(doc, /8 fetch endpoint list block lines/);
  assert.match(doc, /217 fetch endpoint list block bytes/);
  assert.match(doc, /54 fetch body-work block lines/);
  assert.match(doc, /3175 fetch body-work block bytes/);
  assert.match(doc, /37 fetch comment shortcut block lines/);
  assert.match(doc, /2266 fetch comment shortcut block bytes/);
  assert.match(doc, /203 setupXhrInterception comparison block lines/);
  assert.match(doc, /9658 setupXhrInterception comparison block bytes/);
  assert.match(doc, /8 runtime seed fetch no-work\/list-mode fixtures/);
  assert.match(doc, /matching search fetch body work before empty-blocklist harvest-only/);
  assert.match(doc, /whitelist search `processData\(\)` behavior/);
  assert.match(doc, /disabled and missing-settings fetch body work without engine calls/);
  assert.match(doc, /desktop\/mobile home divergence/);
  assert.match(doc, /empty selected category work admission/);
  assert.match(doc, /append-comment synthetic end-marker bypass/);
  assert.match(doc, /reload-comment engine fallback/);
  assert.match(doc, /absent shared seed fetch no-work\/list-mode authority/);
  assert.match(doc, /No `jsonFirstSeedFetchNoWorkListModeContract`, `jsonFirstSeedFetchWorkDecisionReport`, `jsonFirstSeedFetchParseStringifyBudget`, `jsonFirstSeedFetchDisabledPassThroughPolicy`, `jsonFirstSeedFetchMissingSettingsQueueReport`, `jsonFirstSeedFetchHarvestOnlyPolicy`, `jsonFirstSeedFetchMobileHomePolicy`, `jsonFirstSeedFetchCategorySelectedPolicy`, `jsonFirstSeedFetchCommentContinuationPolicy`, or `jsonFirstSeedFetchNoWorkFixtureProvenance` exists/);
});

test('objective coverage ledger records seed XHR no-work list-mode boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Seed XHR no-work\/list-mode boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SEED_XHR_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/seed-xhr-no-work-list-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /XHR-transport no-work proof/);
  assert.match(doc, /1 seed XHR no-work\/list-mode boundary source file/);
  assert.match(doc, /139 shouldSkipEngineProcessing block lines/);
  assert.match(doc, /6452 shouldSkipEngineProcessing block bytes/);
  assert.match(doc, /99 processWithEngine block lines/);
  assert.match(doc, /4797 processWithEngine block bytes/);
  assert.match(doc, /203 setupXhrInterception block lines/);
  assert.match(doc, /9658 setupXhrInterception block bytes/);
  assert.match(doc, /8 XHR endpoint list block lines/);
  assert.match(doc, /242 XHR endpoint list block bytes/);
  assert.match(doc, /79 XHR processor block lines/);
  assert.match(doc, /4199 XHR processor block bytes/);
  assert.match(doc, /25 XHR listener wrapper block lines/);
  assert.match(doc, /1010 XHR listener wrapper block bytes/);
  assert.match(doc, /26 XHR prototype listener patch block lines/);
  assert.match(doc, /1378 XHR prototype listener patch block bytes/);
  assert.match(doc, /11 XHR open patch block lines/);
  assert.match(doc, /529 XHR open patch block bytes/);
  assert.match(doc, /26 XHR send patch block lines/);
  assert.match(doc, /1186 XHR send patch block bytes/);
  assert.match(doc, /8 runtime seed XHR no-work\/list-mode fixtures/);
  assert.match(doc, /search XHR mark\/hook\/body-work before empty-blocklist harvest-only/);
  assert.match(doc, /whitelist search XHR `processData\(\)` behavior/);
  assert.match(doc, /disabled and missing-settings XHR mark\/hook without body work/);
  assert.match(doc, /disabled page listener wrapping without body work/);
  assert.match(doc, /desktop and mobile home XHR `processData\(\)` behavior/);
  assert.match(doc, /empty selected category work admission/);
  assert.match(doc, /player\/next\/guide empty-blocklist `processData\(\)` behavior/);
  assert.match(doc, /fetch-vs-XHR home no-work divergence/);
  assert.match(doc, /absent shared seed XHR no-work\/list-mode authority/);
  assert.match(doc, /No `jsonFirstSeedXhrNoWorkListModeContract`, `jsonFirstSeedXhrWorkDecisionReport`, `jsonFirstSeedXhrHookBudget`, `jsonFirstSeedXhrListenerWrapBudget`, `jsonFirstSeedXhrBodyWorkBudget`, `jsonFirstSeedXhrDisabledNoWorkPolicy`, `jsonFirstSeedXhrMissingSettingsPolicy`, `jsonFirstSeedXhrHarvestOnlyPolicy`, `jsonFirstSeedXhrMobileHomePolicy`, or `jsonFirstSeedXhrEndpointFamilyPolicy` exists/);
});

test('objective coverage ledger records seed initial global no-work list-mode boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Seed initial global no-work\/list-mode boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SEED_INITIAL_GLOBAL_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/seed-initial-global-no-work-list-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /page-global no-work proof/);
  assert.match(doc, /1 seed initial global no-work\/list-mode boundary source file/);
  assert.match(doc, /102 establishDataHooks block lines/);
  assert.match(doc, /5012 establishDataHooks block bytes/);
  assert.match(doc, /45 ytInitialData hook block lines/);
  assert.match(doc, /2221 ytInitialData hook block bytes/);
  assert.match(doc, /45 ytInitialPlayerResponse hook block lines/);
  assert.match(doc, /2436 ytInitialPlayerResponse hook block bytes/);
  assert.match(doc, /70 updateSettings block lines/);
  assert.match(doc, /3450 updateSettings block bytes/);
  assert.match(doc, /99 processWithEngine block lines/);
  assert.match(doc, /4797 processWithEngine block bytes/);
  assert.match(doc, /139 shouldSkipEngineProcessing block lines/);
  assert.match(doc, /6452 shouldSkipEngineProcessing block bytes/);
  assert.match(doc, /29 replayPendingQueueIfReady block lines/);
  assert.match(doc, /993 replayPendingQueueIfReady block bytes/);
  assert.match(doc, /17 cloneData block lines/);
  assert.match(doc, /534 cloneData block bytes/);
  assert.match(doc, /8 runtime seed initial global no-work\/list-mode fixtures/);
  assert.match(doc, /setter debug-size stringify before engine decision/);
  assert.match(doc, /search empty-blocklist harvest-only behavior/);
  assert.match(doc, /search whitelist `processData\(\)` behavior/);
  assert.match(doc, /disabled setter stringify without engine work/);
  assert.match(doc, /missing-settings queue replay with setter reentry/);
  assert.match(doc, /home `ytInitialData` `processData\(\)` behavior/);
  assert.match(doc, /`ytInitialPlayerResponse` `processData\(\)` behavior/);
  assert.match(doc, /existing-global queue\/raw snapshot\/setter replay behavior/);
  assert.match(doc, /absent shared seed initial global no-work\/list-mode authority/);
  assert.match(doc, /No `jsonFirstSeedInitialGlobalNoWorkListModeContract`, `jsonFirstSeedInitialGlobalWorkDecisionReport`, `jsonFirstSeedInitialGlobalDebugSizeBudget`, `jsonFirstSeedInitialGlobalQueueReplayPolicy`, `jsonFirstSeedInitialGlobalRawSnapshotPolicy`, `jsonFirstSeedInitialGlobalSetterAssignmentGuard`, `jsonFirstSeedInitialGlobalHomePolicy`, `jsonFirstSeedInitialPlayerResponsePolicy`, `jsonFirstSeedInitialGlobalFixtureProvenance`, or `jsonFirstSeedInitialGlobalMetricArtifact` exists/);
});

test('objective coverage ledger records seed settings replay provenance boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Seed settings replay provenance boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SEED_SETTINGS_REPLAY_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/seed-settings-replay-provenance-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /cross-owner settings replay proof/);
  assert.match(doc, /5 seed settings replay provenance source files/);
  assert.match(doc, /70 seed updateSettings block lines/);
  assert.match(doc, /3450 seed updateSettings block bytes/);
  assert.match(doc, /25 seed global interface block lines/);
  assert.match(doc, /867 seed global interface block bytes/);
  assert.match(doc, /33 bridge apply-settings message block lines/);
  assert.match(doc, /1454 bridge apply-settings message block bytes/);
  assert.match(doc, /49 bridge seed relay block lines/);
  assert.match(doc, /1284 bridge seed relay block bytes/);
  assert.match(doc, /105 injector seed relay block lines/);
  assert.match(doc, /3946 injector seed relay block bytes/);
  assert.match(doc, /11 StateManager broadcastSettings block lines/);
  assert.match(doc, /309 StateManager broadcastSettings block bytes/);
  assert.match(doc, /16 background apply-settings block lines/);
  assert.match(doc, /855 background apply-settings block bytes/);
  assert.match(doc, /5 runtime seed settings replay provenance fixtures/);
  assert.match(doc, /incoming settings object caching/);
  assert.match(doc, /first update queued-global drain plus setter reentry before raw snapshot replay/);
  assert.match(doc, /duplicate equivalent settings raw snapshot replay/);
  assert.match(doc, /public raw snapshot field replay/);
  assert.match(doc, /disabled raw replay setter stringify without engine calls/);
  assert.match(doc, /split StateManager\/background\/content-bridge\/injector relay ownership/);
  assert.match(doc, /absent shared seed settings replay authority/);
  assert.match(doc, /No `seedSettingsReplayProvenanceContract`, `seedSettingsReplayDecisionReport`, `seedSettingsRevisionReport`, `seedSettingsDirtyKeyPolicy`, `seedSettingsQueueDrainBudget`, `seedSettingsRawSnapshotReplayPolicy`, `seedSettingsSetterReentryGuard`, `seedSettingsRelayOwnerReport`, `seedSettingsDuplicateDeliveryPolicy`, `seedSettingsReplayFixtureProvenance`, or `seedSettingsReplayMetricArtifact` exists/);
});

test('objective coverage ledger records seed page-global patch teardown boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Seed page-global patch teardown boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SEED_PAGE_GLOBAL_PATCH_TEARDOWN_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/seed-page-global-patch-teardown-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /settings replay proof into direct page-global patch teardown proof/);
  assert.match(doc, /1 seed page-global patch teardown source file/);
  assert.match(doc, /102 establishDataHooks block lines/);
  assert.match(doc, /5012 establishDataHooks block bytes/);
  assert.match(doc, /86 setupFetchInterception block lines/);
  assert.match(doc, /4263 setupFetchInterception block bytes/);
  assert.match(doc, /203 setupXhrInterception block lines/);
  assert.match(doc, /9658 setupXhrInterception block bytes/);
  assert.match(doc, /25 seed global interface block lines/);
  assert.match(doc, /867 seed global interface block bytes/);
  assert.match(doc, /20 seed initialization block lines/);
  assert.match(doc, /564 seed initialization block bytes/);
  assert.match(doc, /5 runtime seed page-global patch teardown fixtures/);
  assert.match(doc, /initial seed load fetch\/XHR\/global accessor\/readiness\/global interface installation/);
  assert.match(doc, /ordinary duplicate seed load guard behavior/);
  assert.match(doc, /forced seed re-entry fetch rewrap behavior with XHR prototype stability/);
  assert.match(doc, /processed XHR per-instance response accessor lifetime without a removal owner/);
  assert.match(doc, /global interface no restore\/unpatch\/dispose\/destroy\/teardown\/clear owner behavior/);
  assert.match(doc, /absent shared seed page-global patch teardown authority/);
  assert.match(doc, /No `seedPageGlobalPatchTeardownContract`, `seedPageGlobalPatchOwnerReport`, `seedFetchPatchIdempotenceReport`, `seedXhrPatchIdempotenceReport`, `seedInitialGlobalAccessorOwnerReport`, `seedXhrResponseAccessorLifetimeReport`, `seedPageGlobalPatchRestorePolicy`, `seedPageGlobalPatchLifetimeJustification`, `seedPageGlobalPatchFixtureProvenance`, or `seedPageGlobalPatchMetricArtifact` exists/);
});

test('objective coverage ledger records bridge settings listener timer boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Bridge settings listener\/timer boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BRIDGE_SETTINGS_LISTENER_TIMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/bridge-settings-listener-timer-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /bridge method proof into direct bridge listener\/timer proof/);
  assert.match(doc, /1 bridge settings listener\/timer source file/);
  assert.match(doc, /71 waiter cluster block lines/);
  assert.match(doc, /2340 waiter cluster block bytes/);
  assert.match(doc, /43 subscription request block lines/);
  assert.match(doc, /1942 subscription request block bytes/);
  assert.match(doc, /53 subscription message listener block lines/);
  assert.match(doc, /2299 subscription message listener block bytes/);
  assert.match(doc, /122 runtime listener block lines/);
  assert.match(doc, /5684 runtime listener block bytes/);
  assert.match(doc, /201 seed relay cluster block lines/);
  assert.match(doc, /8139 seed relay cluster block bytes/);
  assert.match(doc, /131 storage refresh cluster block lines/);
  assert.match(doc, /4506 storage refresh cluster block bytes/);
  assert.match(doc, /3 storage listener registration block lines/);
  assert.match(doc, /96 storage listener registration block bytes/);
  assert.match(doc, /6 runtime bridge settings listener\/timer fixtures/);
  assert.match(doc, /5 storage admission executable continuation rows/);
  assert.match(doc, /guarded message\/runtime listener setup/);
  assert.match(doc, /storage listener setup/);
  assert.match(doc, /readiness waiter timeout lifetime/);
  assert.match(doc, /repeated seed retry timer admission/);
  assert.match(doc, /recursive retry behavior/);
  assert.match(doc, /storage force-refresh and debounce behavior/);
  assert.match(doc, /storage admission ignores lone `channelMap` and non-`local` changes/);
  assert.match(doc, /mixed map plus keyword refresh escalates forced reprocess/);
  assert.match(doc, /subscription timeout clear\/rearm\/delete behavior/);
  assert.match(doc, /absent shared bridge settings listener\/timer authority/);
  assert.match(doc, /No `bridgeSettingsListenerTimerContract`, `bridgeSettingsSeedRetryBudgetReport`, `bridgeSettingsSeedReadyListenerOwnerReport`, `bridgeSettingsStorageRefreshDecisionReport`, `bridgeSettingsStorageListenerTeardownReport`, `bridgeSettingsReadinessTimeoutBudget`, `bridgeSettingsSubscriptionRequestLifecycleReport`, `bridgeSettingsRuntimeMessageDecisionReport`, `bridgeSettingsFixtureProvenance`, or `bridgeSettingsMetricArtifact` exists/);
});

test('objective coverage ledger records content bridge startup timing boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Content bridge startup timing boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_STARTUP_TIMING_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-startup-timing-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /startup readiness proof into direct content bridge startup timing proof/);
  assert.match(doc, /2 content bridge startup timing source files/);
  assert.match(doc, /bridge_injection at 127 lines and 4741 bytes/);
  assert.match(doc, /content_bridge at 12985 lines and 579257 bytes/);
  assert.match(doc, /23 fallback block lines/);
  assert.match(doc, /904 fallback block bytes/);
  assert.match(doc, /46 injectMainWorldScripts block lines/);
  assert.match(doc, /1752 injectMainWorldScripts block bytes/);
  assert.match(doc, /236 main-world handler block lines/);
  assert.match(doc, /11060 main-world handler block bytes/);
  assert.match(doc, /12 initialize block lines/);
  assert.match(doc, /392 initialize block bytes/);
  assert.match(doc, /341 initializeDOMFallback block lines/);
  assert.match(doc, /16321 initializeDOMFallback block bytes/);
  assert.match(doc, /26 DOM observer setup slice lines/);
  assert.match(doc, /948 DOM observer setup slice bytes/);
  assert.match(doc, /8 runtime content bridge startup timing fixtures/);
  assert.match(doc, /fallback 50 ms script spacing without script cleanup ownership/);
  assert.match(doc, /post-injection 100 ms settings replay/);
  assert.match(doc, /top-level message listener plus 50 ms initialize timer/);
  assert.match(doc, /initialize injection\/settings sequencing with detached DOM fallback setup/);
  assert.match(doc, /full injector ready handling without bridge-ready handling/);
  assert.match(doc, /1000 ms DOM fallback start gate with possible second settings request/);
  assert.match(doc, /body-or-DOMContentLoaded observer setup/);
  assert.match(doc, /post-fallback lifecycle starts/);
  assert.match(doc, /absent shared content bridge startup timing authority/);
  assert.match(doc, /2026-05-28 startup no-work executable continuation/);
  assert.match(doc, /startup no-work gate executable rows: 4/);
  assert.match(doc, /startup explicit bridge request bypass rows: 1/);
  assert.match(doc, /startup executable continuation behavior changed: no/);
  assert.match(doc, /startup executable continuation approval: `NO-GO`/);
  assert.match(doc, /ASCII startup no-work diagram: present/);
  assert.match(doc, /Mermaid startup no-work diagram: present/);
  assert.match(doc, /null, disabled, and empty blocklist startup settings skip MAIN-world injection/);
  assert.match(doc, /whitelist startup and explicit bridge identity requests still inject and replay settings/);
  assert.match(doc, /No `contentBridgeStartupTimingContract`, `contentBridgeStartupTimerBudgetReport`, `contentBridgeInjectionSettingsReplayReport`, `contentBridgeReadyMessageDecisionReport`, `contentBridgeInitializePromiseContract`, `contentBridgeFirstDomFallbackPolicy`, `contentBridgeDomFallbackSingletonReport`, `contentBridgeStartupObserverOwnerReport`, `contentBridgeStartupFixtureProvenance`, or `contentBridgeStartupMetricArtifact` exists/);
});

test('objective coverage ledger records background script injection trust boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Background script injection trust boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BACKGROUND_SCRIPT_INJECTION_TRUST_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/background-script-injection-trust-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /startup injection proof into direct background-mediated script injection trust proof/);
  assert.match(doc, /2 background script injection trust source files/);
  assert.match(doc, /background at 6270 lines and 282251 bytes/);
  assert.match(doc, /bridge_injection at 127 lines and 4741 bytes/);
  assert.match(doc, /4 manifest scripting permission carriers/);
  assert.match(doc, /47 injectScripts block lines/);
  assert.match(doc, /1612 injectScripts block bytes/);
  assert.match(doc, /33 subscriptions bridge block lines/);
  assert.match(doc, /1207 subscriptions bridge block bytes/);
  assert.match(doc, /14 injectViaScriptingAPI block lines/);
  assert.match(doc, /505 injectViaScriptingAPI block bytes/);
  assert.match(doc, /23 injectViaFallback block lines/);
  assert.match(doc, /904 injectViaFallback block bytes/);
  assert.match(doc, /46 injectMainWorldScripts block lines/);
  assert.match(doc, /1752 injectMainWorldScripts block bytes/);
  assert.match(doc, /8 runtime background script injection trust fixtures/);
  assert.match(doc, /bridge-to-background `injectScripts` requests/);
  assert.match(doc, /sender-tab and sender-frame target derivation/);
  assert.match(doc, /early no-tab and no-scripting failures/);
  assert.match(doc, /caller script name trimming and `js\/\*\.js` mapping/);
  assert.match(doc, /empty file-list success without execution/);
  assert.match(doc, /MAIN-world asynchronous `executeScript`/);
  assert.match(doc, /unclassified path-shape mapping before browser loading/);
  assert.match(doc, /subscriptions bridge fixed isolated file list with caller-supplied tab id/);
  assert.match(doc, /absent trusted sender, allowlist, sender URL, host route, resource reason, nonce, or caller capability gates/);
  assert.match(doc, /No `backgroundScriptInjectionTrustContract`, `backgroundInjectScriptsAllowedScriptReport`, `backgroundInjectScriptsSenderClassReport`, `backgroundInjectScriptsTargetScopeReport`, `backgroundInjectScriptsWorldPolicy`, `backgroundSubscriptionsBridgeInjectionPolicy`, `backgroundScriptingPermissionOwnerReport`, `backgroundScriptInjectionFixtureProvenance`, `backgroundScriptInjectionMetricArtifact`, or `backgroundScriptInjectionWebAccessibleResourceReason` exists/);
});

test('objective coverage ledger records content bridge main-world message dispatch boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Content bridge main-world message dispatch boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_MAIN_WORLD_MESSAGE_DISPATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-main-world-message-dispatch-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /broad page-message proof into direct content bridge main-world receiver dispatch proof/);
  assert.match(doc, /1 content bridge main-world dispatch source file/);
  assert.match(doc, /content_bridge at 12985 lines and 579257 bytes/);
  assert.match(doc, /236 handler lines/);
  assert.match(doc, /11060 handler bytes/);
  assert.match(doc, /12 handler `FilterTube_\*` branches/);
  assert.match(doc, /1 startsWith `FilterTube_` token/);
  assert.match(doc, /1 self-source exclusion token/);
  assert.match(doc, /1 same-window guard/);
  assert.match(doc, /0 event\.origin tokens/);
  assert.match(doc, /0 nonce tokens/);
  assert.match(doc, /0 trustedSource tokens/);
  assert.match(doc, /0 allowedSource tokens/);
  assert.match(doc, /5 pending request lookups/);
  assert.match(doc, /1 pending collab-card lookup/);
  assert.match(doc, /4 clearTimeout tokens/);
  assert.match(doc, /1 setTimeout token/);
  assert.match(doc, /1 requestAnimationFrame token/);
  assert.match(doc, /3 applyDOMFallback tokens/);
  assert.match(doc, /8 runtime content bridge main-world message dispatch fixtures/);
  assert.match(doc, /exact receiver branch inventory/);
  assert.match(doc, /same-window `FilterTube_\*` admission with only `source === 'content_bridge'` exclusion/);
  assert.match(doc, /forced DOM fallback reprocess without pending ownership/);
  assert.match(doc, /learned map persistence and DOM rerun side effects/);
  assert.match(doc, /pending response request-id correlation/);
  assert.match(doc, /unsolicited collaborator cache\/dialog application with `force: true`/);
  assert.match(doc, /absent origin, nonce, trusted-source, allowed-source, sender capability, route, host, or settings revision checks/);
  assert.match(doc, /2026-05-28 content bridge message ingress executable continuation/);
  assert.match(doc, /message dispatch executable ingress rows: 5/);
  assert.match(doc, /message dispatch executable behavior changed: no/);
  assert.match(doc, /message dispatch executable approval: `NO-GO`/);
  assert.match(doc, /ASCII message ingress diagram: present/);
  assert.match(doc, /Mermaid message ingress diagram: present/);
  assert.match(doc, /off-window `FilterTube_\*`, same-window non-`FilterTube_\*`, and same-window self-source messages do not request settings or run DOM fallback/);
  assert.match(doc, /`FilterTube_Refresh` requests settings then forces DOM fallback reprocess/);
  assert.match(doc, /No `contentBridgeMainWorldMessageDispatchContract`, `contentBridgePageMessageSenderPolicy`, `contentBridgePageMessageNonceReport`, `contentBridgeMessageTypeSideEffectReport`, `contentBridgeRefreshOwnershipReport`, `contentBridgeLearnedMapMessagePolicy`, `contentBridgePendingResponseCorrelationReport`, `contentBridgeUnsolicitedCollaboratorPolicy`, `contentBridgeMessageDispatchMetricArtifact`, or `contentBridgeMainWorldMessageFixtureProvenance` exists/);
});

test('objective coverage ledger records injector main-world message dispatch boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Injector main-world message dispatch boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_INJECTOR_MAIN_WORLD_MESSAGE_DISPATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/injector-main-world-message-dispatch-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /injector method proof into direct main-world injector dispatch proof/);
  assert.match(doc, /1 injector main-world dispatch source file/);
  assert.match(doc, /injector at 3536 lines and 153876 bytes/);
  assert.match(doc, /46 subscription handler lines/);
  assert.match(doc, /1795 subscription handler bytes/);
  assert.match(doc, /7 install block lines/);
  assert.match(doc, /355 install block bytes/);
  assert.match(doc, /120 main listener block lines/);
  assert.match(doc, /5391 main listener block bytes/);
  assert.match(doc, /5 selected message types/);
  assert.match(doc, /2 addEventListener tokens/);
  assert.match(doc, /0 removeEventListener tokens/);
  assert.match(doc, /3 postMessage tokens/);
  assert.match(doc, /3 wildcard postMessage target tokens/);
  assert.match(doc, /2 same-window guards/);
  assert.match(doc, /2 injector self-guards/);
  assert.match(doc, /4 content_bridge source gates/);
  assert.match(doc, /1 filter_logic source gate/);
  assert.match(doc, /0 event\.origin tokens/);
  assert.match(doc, /0 nonce tokens/);
  assert.match(doc, /0 capability tokens/);
  assert.match(doc, /0 revision tokens/);
  assert.match(doc, /9 requestId tokens/);
  assert.match(doc, /8 runtime injector main-world message dispatch fixtures/);
  assert.match(doc, /subscription import listener installation before the duplicate-run guard/);
  assert.match(doc, /idempotent listener flagging/);
  assert.match(doc, /`FilterTube_RequestSubscriptionImport` dispatch into `fetchSubscribedChannelsFromYoutubei\(\)`/);
  assert.match(doc, /wildcard subscription responses/);
  assert.match(doc, /`FilterTube_SettingsToInjector` payload merge and queue drain without revision gate/);
  assert.match(doc, /`FilterTube_CacheCollaboratorInfo` cache mutation from `filter_logic`/);
  assert.match(doc, /wildcard collaborator\/channel lookup responses/);
  assert.match(doc, /absent origin, nonce, capability, sender capability, settings revision, route, host, profile, list-mode, or active-rule reason checks/);
  assert.match(doc, /2026-05-28 injector message ingress executable continuation/);
  assert.match(doc, /injector dispatch executable ingress rows: 8/);
  assert.match(doc, /injector dispatch executable behavior changed: no/);
  assert.match(doc, /injector dispatch executable approval: `NO-GO`/);
  assert.match(doc, /ASCII injector ingress diagram: present/);
  assert.match(doc, /Mermaid injector ingress diagram: present/);
  assert.match(doc, /duplicate subscription bridge installs do not add duplicate listeners/);
  assert.match(doc, /off-window, wrong-type, and self-source subscription messages do not fetch or respond/);
  assert.match(doc, /valid `content_bridge` subscription import requests fetch and post wildcard responses/);
  assert.match(doc, /valid `content_bridge` settings messages merge settings, update seed, check network JSON work, and drain queued data when active/);
  assert.match(doc, /No `injectorMainWorldMessageDispatchContract`, `injectorPageMessageSenderPolicy`, `injectorPageMessageNonceReport`, `injectorSettingsMessageRevisionReport`, `injectorSubscriptionImportDispatchPolicy`, `injectorSubscriptionImportActionTokenReport`, `injectorCollaboratorCacheMessagePolicy`, `injectorLookupRequestCorrelationReport`, `injectorMainWorldDispatchMetricArtifact`, or `injectorMainWorldMessageFixtureProvenance` exists/);
});

test('objective coverage ledger records ignored whitelist bundle boundary as current-behavior gates', () => {
  const doc = ledger();

  assert.match(doc, /Ignored whitelist bundle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_IGNORED_WHITELIST_BUNDLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/ignored-whitelist-bundle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /ignored whitelist scratch-file references into direct local evidence exclusion proof/);
  assert.match(doc, /2 ignored whitelist bundle files/);
  assert.match(doc, /`WHITELIST_background\.js` at 32472 lines and 1700002 bytes/);
  assert.match(doc, /`WHITELIST_content\.JS` at 9302 lines and 674344 bytes/);
  assert.match(doc, /2 ignored git-status entries/);
  assert.match(doc, /2 `git check-ignore -v` mappings/);
  assert.match(doc, /selected storage\/runtime\/downloads\/tabs\/observer\/selector\/listener\/timer\/fetch\/postMessage\/token counts/);
  assert.match(doc, /7 active release-surface files with zero exact bundle-name or `WhitelistVideo` references/);
  assert.match(doc, /0 current dist bundle copies/);
  assert.match(doc, /7 runtime ignored whitelist bundle boundary fixtures/);
  assert.match(doc, /both bundles are ignored root evidence, not tracked release source/);
  assert.match(doc, /active manifests, package metadata, build script, README, tracked product source, and current dist output do not reference the bundle names or marker/);
  assert.match(doc, /content bundle carries high observer\/listener\/timer\/selector density/);
  assert.match(doc, /whitelist optimization must target current JSON-first runtime owners rather than ignored historical bundles/);
  assert.match(doc, /No `ignoredWhitelistBundleBoundaryContract`, `ignoredWhitelistBundleReleaseExclusionReport`, `ignoredWhitelistBundleExtractionDecision`, `ignoredWhitelistBundleLifecycleBudget`, `ignoredWhitelistBundleMessageStorageReport`, `ignoredWhitelistBundleFixtureProvenance`, `ignoredWhitelistBundleCurrentRuntimeParityReport`, `ignoredWhitelistBundleOptimizationInputPolicy`, `ignoredWhitelistBundleDeletionReadinessArtifact`, or `ignoredWhitelistBundleMetricArtifact` exists/);
});

test('objective coverage ledger records current dirty worktree boundary without opening implementation gate', () => {
  const doc = ledger();

  assert.match(doc, /Current dirty worktree audit boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CURRENT_DIRTY_WORKTREE_AUDIT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/current-dirty-worktree-audit-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /16 modified tracked files, 321 additions, 170 deletions/);
  assert.match(doc, /14 public\/core documentation claim-surface files/);
  assert.match(doc, /one `js\/state_manager\.js` comment-only header edit with 2 additions and 2 deletions/);
  assert.match(doc, /one `package\.json` audit-script addition with 1 addition and 0 deletions/);
  assert.match(doc, /build\/dev\/browser\/native-sync scripts and package dependency metadata remain unchanged/);
  assert.match(doc, /audit artifacts stay under `docs\/audit` and `tests\/runtime`/);
  assert.match(doc, /`currentDirtyWorktreeAuditBoundaryContract`/);
  assert.match(doc, /`currentDirtyWorktreeRuntimeEffectReport`/);
  assert.match(doc, /`currentDirtyWorktreeOptimizationInputPolicy`/);
  assert.match(doc, /exists in product runtime source yet/);
});

test('objective coverage ledger records ignored local planning text boundary as optimization-exclusion proof', () => {
  const doc = ledger();

  assert.match(doc, /Ignored local planning text boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_IGNORED_LOCAL_PLANNING_TEXT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/ignored-local-planning-text-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct ignored local planning\/text exclusion proof/);
  assert.match(doc, /7 ignored local planning\/text artifacts/);
  assert.match(doc, /7 ignored git-status entries/);
  assert.match(doc, /7 `git check-ignore -v` mappings/);
  assert.match(doc, /line\/byte\/SHA-256 fingerprints for `docs\/MOBILE_APP_UI_SPEC\.md`, `docs\/spa-collab-watchlist-handoff\.md`, `docs\/subscribed-channels-whitelist-import-plan\.md`, `cher\.md`, `import_channels\.txt`, `extracted_watch_paths\.txt`, and `YTM-LOGS\.txt`/);
  assert.match(doc, /selected JSON-adjacent, whitelist, endpoint, selector, observer, listener, and timer token counts/);
  assert.match(doc, /zero exact path references across active release surfaces/);
  assert.match(doc, /zero current dist copies/);
  assert.match(doc, /7 runtime ignored local planning text boundary fixtures/);
  assert.match(doc, /these artifacts remain ignored local evidence rather than tracked release source/);
  assert.match(doc, /build\/package common surfaces exclude them/);
  assert.match(doc, /active manifests\/package\/build\/README\/product-source surfaces do not reference their path names/);
  assert.match(doc, /current dist output does not package them/);
  assert.match(doc, /whitelist optimization must use reviewed current-runtime owners plus reduced fixtures instead of raw planning\/import\/log text/);
  assert.match(doc, /No `ignoredLocalPlanningTextBoundaryContract`, `ignoredLocalPlanningTextReleaseExclusionReport`, `ignoredLocalPlanningTextExtractionDecision`, `ignoredLocalPlanningTextFixtureProvenance`, `ignoredLocalPlanningTextOptimizationInputPolicy`, `ignoredLocalPlanningTextDocClaimGate`, `ignoredLocalPlanningTextPackageBoundaryReport`, `ignoredLocalPlanningTextMetricArtifact`, `ignoredLocalPlanningTextDeletionReadinessReport`, or `ignoredLocalPlanningTextCurrentRuntimeParityReport` exists/);
});

test('objective coverage ledger records background auto-backup scheduler boundary as timer side-effect proof', () => {
  const doc = ledger();

  assert.match(doc, /Background auto-backup scheduler boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BACKGROUND_AUTO_BACKUP_SCHEDULER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/background-auto-backup-scheduler-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct background auto-backup scheduler proof/);
  assert.match(doc, /5 scheduler source files/);
  assert.match(doc, /9 source\/effect blocks/);
  assert.match(doc, /97 background createAutoBackupInBackground block lines/);
  assert.match(doc, /3751 create block bytes/);
  assert.match(doc, /25 background scheduleAutoBackupInBackground block lines/);
  assert.match(doc, /863 scheduler block bytes/);
  assert.match(doc, /8 wait-policy block lines/);
  assert.match(doc, /376 wait-policy block bytes/);
  assert.match(doc, /11 post-block wait block lines/);
  assert.match(doc, /336 wait block bytes/);
  assert.match(doc, /12 FilterTube_ScheduleAutoBackup action block lines/);
  assert.match(doc, /652 action block bytes/);
  assert.match(doc, /StateManager\/content_bridge\/tab-view\/IO-manager scheduler blocks/);
  assert.match(doc, /selected timer\/encryption\/download\/pending-trigger token counts/);
  assert.match(doc, /8 runtime background auto-backup scheduler fixtures/);
  assert.match(doc, /accepts caller trigger\/options plus any finite numeric delay without a local trusted-sender, session, allowlist, or clamp policy/);
  assert.match(doc, /coalesces pending trigger\/options into the latest timer callback/);
  assert.match(doc, /channel-added triggers can wait for post-block enrichment unless the caller disables waiting/);
  assert.match(doc, /encrypted auto-backup can skip with `missing_session_pin`/);
  assert.match(doc, /backup scheduling remains split across background, StateManager, content bridge, tab-view, and IO manager owners/);
  assert.match(doc, /No `backgroundAutoBackupSchedulerContract`, `backgroundAutoBackupTriggerPolicy`, `backgroundAutoBackupSenderPolicy`, `backgroundAutoBackupDelayClampReport`, `backgroundAutoBackupTimerLifecycleReport`, `backgroundAutoBackupPostEnrichmentWaitBudget`, `backgroundAutoBackupEncryptionSkipReport`, `backgroundAutoBackupDownloadRotationReport`, `backgroundAutoBackupSplitOwnerReport`, or `backgroundAutoBackupMetricArtifact` exists/);
});

test('objective coverage ledger records native overlay fullscreen quiet mode boundary as quietness proof', () => {
  const doc = ledger();

  assert.match(doc, /Native overlay\/fullscreen quiet mode boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_NATIVE_OVERLAY_FULLSCREEN_QUIET_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/native-overlay-fullscreen-quiet-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct native-overlay\/fullscreen quiet mode proof/);
  assert.match(doc, /7 quiet-mode source files/);
  assert.match(doc, /5 source\/effect blocks/);
  assert.match(doc, /11 content_bridge native quiet predicate block lines/);
  assert.match(doc, /468 predicate block bytes/);
  assert.match(doc, /342 initializeDOMFallback quiet cluster block lines/);
  assert.match(doc, /16323 initialize cluster bytes/);
  assert.match(doc, /630 fallback menu quiet cluster block lines/);
  assert.match(doc, /25685 fallback cluster bytes/);
  assert.match(doc, /11 quick-block enabled predicate block lines/);
  assert.match(doc, /298 quick predicate bytes/);
  assert.match(doc, /225 quick-block lifecycle setup block lines/);
  assert.match(doc, /9085 quick setup bytes/);
  assert.match(doc, /selected content_bridge quiet\/lifecycle counts/);
  assert.match(doc, /selected block_channel quiet\/lifecycle counts/);
  assert.match(doc, /selected non-content-bridge zero quiet-token owner counts/);
  assert.match(doc, /7 runtime native overlay\/fullscreen quiet mode fixtures/);
  assert.match(doc, /content-bridge quiet predicate recognizes two native window flags and two document attributes/);
  assert.match(doc, /content-bridge DOM fallback, whitelist pending refresh, fallback menu rescans, and warmups use local quiet checks after installation/);
  assert.match(doc, /quick-block lifecycle setup installs styles and page-level listeners before action-level checks/);
  assert.match(doc, /quick-block action state uses `showQuickBlockButton === true` and `listMode !== 'whitelist'`/);
  assert.match(doc, /selected DOM fallback, seed, bridge settings, first-run prompt, and release-notes prompt files do not consume native quiet predicate\/attribute tokens/);
  assert.match(doc, /prompt overlays can still render without local fullscreen\/native-overlay suppression/);
  assert.match(doc, /No `nativeOverlayQuietModeContract`, `nativeOverlayQuietModeConsumerReport`, `fullscreenNonPlayerPauseContract`, `fullscreenNativeOverlayPauseAuthority`, `nonPlayerRuntimePauseReport`, `quickBlockNativeOverlayPauseReport`, `domFallbackFullscreenPauseReport`, `seedFullscreenNoWorkBudget`, `promptOverlayFullscreenPolicy`, or `nativeOverlayMetricArtifact` exists/);
});

test('objective coverage ledger records background identity fetch network budget boundary as network proof', () => {
  const doc = ledger();

  assert.match(doc, /Background identity fetch network budget boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BACKGROUND_IDENTITY_FETCH_NETWORK_BUDGET_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/background-identity-fetch-network-budget-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct background identity fetch network-budget proof/);
  assert.match(doc, /4 identity-fetch source files/);
  assert.match(doc, /13 source\/effect blocks/);
  assert.match(doc, /42 handleFetchShortsIdentityMessage block lines/);
  assert.match(doc, /1658 shorts message bytes/);
  assert.match(doc, /28 handleFetchWatchIdentityMessage block lines/);
  assert.match(doc, /1054 watch message bytes/);
  assert.match(doc, /67 performShortsIdentityFetch block lines/);
  assert.match(doc, /2543 shorts fetch bytes/);
  assert.match(doc, /94 performKidsWatchIdentityFetch block lines/);
  assert.match(doc, /3605 Kids fetch bytes/);
  assert.match(doc, /93 performWatchIdentityFetch block lines/);
  assert.match(doc, /3584 watch fetch bytes/);
  assert.match(doc, /7 fetchShorts\/fetchWatch action branch lines/);
  assert.match(doc, /272 action branch bytes/);
  assert.match(doc, /12 fetchChannelDetails branch lines/);
  assert.match(doc, /607 detail branch bytes/);
  assert.match(doc, /744 fetchChannelInfo block lines/);
  assert.match(doc, /32110 channel-info bytes/);
  assert.match(doc, /content bridge watch\/Shorts\/direct fallback caller blocks/);
  assert.match(doc, /handle_resolver fetchIdForHandle block/);
  assert.match(doc, /DOM fallback unresolved-handle escalation block/);
  assert.match(doc, /selected cache\/pending\/fetch\/credential\/direct-fallback\/escalation token counts/);
  assert.match(doc, /selected zero policy token counts/);
  assert.match(doc, /8 runtime background identity fetch network budget fixtures/);
  assert.match(doc, /background identity actions validate video ids and use caches\/pending maps/);
  assert.match(doc, /credentialed HTML fetches with abort timers and stream-preview limits/);
  assert.match(doc, /identity fetch branches lack local sender\/reason\/route\/tab\/active-rule\/fetch-budget policy/);
  assert.match(doc, /channel detail fetch can perform credentialed channel HTML fetches/);
  assert.match(doc, /content bridge distinguishes background watch\/Shorts identity requests from direct same-origin Shorts fallback/);
  assert.match(doc, /handle resolver can post learned-map updates and rerun DOM fallback/);
  assert.match(doc, /DOM fallback `skipNetwork` background-only escalation can still lead to background network work/);
  assert.match(doc, /No `backgroundIdentityFetchNetworkBudgetContract`, `backgroundIdentityFetchSenderPolicy`, `backgroundIdentityFetchReasonReport`, `backgroundIdentityFetchRouteProfileReport`, `backgroundIdentityFetchCredentialPolicy`, `backgroundIdentityFetchCacheBudgetReport`, `backgroundIdentityFetchActiveRuleGate`, `backgroundIdentityFetchDirectFallbackPolicy`, `backgroundIdentityFetchDomEscalationReport`, or `backgroundIdentityFetchMetricArtifact` exists/);
});

test('objective coverage ledger records content direct identity fallback boundary as side-effect proof', () => {
  const doc = ledger();

  assert.match(doc, /Content direct identity fallback side-effect boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_DIRECT_IDENTITY_FALLBACK_SIDE_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-direct-identity-fallback-side-effect-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct content page-context fallback side-effect proof/);
  assert.match(doc, /3 content direct identity fallback source files/);
  assert.match(doc, /8 source\/effect blocks/);
  assert.match(doc, /14 handle resolver rerun timer block lines/);
  assert.match(doc, /429 rerun timer bytes/);
  assert.match(doc, /134 handle resolver fetchIdForHandle block lines/);
  assert.match(doc, /4787 fetchIdForHandle bytes/);
  assert.match(doc, /45 handle resolver direct handle branch lines/);
  assert.match(doc, /1310 direct handle bytes/);
  assert.match(doc, /69 content bridge Shorts wrapper block lines/);
  assert.match(doc, /2661 Shorts wrapper bytes/);
  assert.match(doc, /124 content bridge Shorts direct fetch block lines/);
  assert.match(doc, /6367 Shorts direct bytes/);
  assert.match(doc, /44 content bridge watch fetch head block lines/);
  assert.match(doc, /1789 watch fetch head bytes/);
  assert.match(doc, /136 clicked-target direct fallback cluster lines/);
  assert.match(doc, /7498 clicked-target cluster bytes/);
  assert.match(doc, /50 DOM fallback background-only escalation block lines/);
  assert.match(doc, /3656 DOM escalation bytes/);
  assert.match(doc, /selected fetch\/same-origin\/allowDirectFetch\/skipNetwork\/backgroundOnly\/pending-map token counts/);
  assert.match(doc, /8 runtime content direct identity fallback fixtures/);
  assert.match(doc, /direct handle fallback can fetch/);
  assert.match(doc, /same-origin credentials after cache and skipNetwork gates/);
  assert.match(doc, /background-only handle repair can send `fetchChannelDetails`, post `FilterTube_UpdateChannelMap`, and schedule a DOM fallback rerun/);
  assert.match(doc, /Shorts wrapper asks background first and calls direct Shorts fetch only when `allowDirectFetch` is true/);
  assert.match(doc, /direct watch fetch skips Kids hosts and uses `pendingWatchFetches` before same-origin/);
  assert.match(doc, /clicked-target fallback tries background watch before legacy direct watch/);
  assert.match(doc, /post-action Shorts fanout keeps `allowDirectFetch` false/);
  assert.match(doc, /DOM unresolved-handle repair uses `skipNetwork` plus `backgroundOnly` rather than page-context direct fetch/);
  assert.match(doc, /No `contentDirectIdentityFallbackContract`, `contentDirectIdentityFetchPolicy`, `contentDirectIdentityUserActionReport`, `contentDirectIdentityCredentialPolicy`, `contentDirectIdentityDomRepairBudget`, `contentDirectIdentityDirectFetchGate`, `contentDirectIdentityMapWriteReport`, `contentDirectIdentityRerunBudget`, `contentDirectIdentityFallbackFixtureProvenance`, or `contentDirectIdentityMetricArtifact` exists/);
});

test('objective coverage ledger records settings refresh cross-context consumer boundary as side-effect proof', () => {
  const doc = ledger();

  assert.match(doc, /Settings refresh cross-context consumer boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SETTINGS_REFRESH_CROSS_CONTEXT_CONSUMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/settings-refresh-cross-context-consumer-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct cross-context settings consumer side-effect proof/);
  assert.match(doc, /7 settings refresh cross-context consumer source files/);
  assert.match(doc, /13 source\/effect blocks/);
  assert.match(doc, /28 background ApplySettings branch lines/);
  assert.match(doc, /1487 background ApplySettings bytes/);
  assert.match(doc, /41 background storage invalidation lines/);
  assert.match(doc, /1464 background storage invalidation bytes/);
  assert.match(doc, /121 bridge runtime listener lines/);
  assert.match(doc, /5684 bridge runtime listener bytes/);
  assert.match(doc, /115 bridge request settings lines/);
  assert.match(doc, /5333 bridge request settings bytes/);
  assert.match(doc, /51 bridge seed delivery lines/);
  assert.match(doc, /1335 bridge seed delivery bytes/);
  assert.match(doc, /92 bridge storage refresh lines/);
  assert.match(doc, /3395 bridge storage refresh bytes/);
  assert.match(doc, /11 content bridge page refresh lines/);
  assert.match(doc, /538 page refresh bytes/);
  assert.match(doc, /23 injector settings receiver lines/);
  assert.match(doc, /871 receiver bytes/);
  assert.match(doc, /21 injector seed update lines/);
  assert.match(doc, /1003 seed update bytes/);
  assert.match(doc, /60 injector process queue lines/);
  assert.match(doc, /2108 process queue bytes/);
  assert.match(doc, /98 seed updateSettings lines/);
  assert.match(doc, /4640 seed updateSettings bytes/);
  assert.match(doc, /63 DOM fallback apply-head lines/);
  assert.match(doc, /2188 DOM fallback apply-head bytes/);
  assert.match(doc, /34 filter logic processData lines/);
  assert.match(doc, /1247 filter logic processData bytes/);
  assert.match(doc, /selected settings refresh token counts/);
  assert.match(doc, /selected zero policy token counts/);
  assert.match(doc, /5 runtime settings refresh cross-context consumer fixtures/);
  assert.match(doc, /3 settings refresh executable continuation rows/);
  assert.match(doc, /background apply-settings can replace compiled cache and push caller settings to tabs/);
  assert.match(doc, /storage invalidation recompiles both profiles without broadcasting/);
  assert.match(doc, /bridge refresh\/apply\/profile-mismatch\/storage paths can deliver settings and force DOM fallback/);
  assert.match(doc, /bridge seed delivery posts settings to main world, retries seed update, and stores pending seed settings/);
  assert.match(doc, /page refresh can pull settings and force DOM fallback/);
  assert.match(doc, /injector merges settings, updates seed, drains queues, and can call the engine/);
  assert.match(doc, /settings refresh executable continuation pins off-window\/self-source settings messages as no-ops, no-work settings as queue-clearing without engine calls, and active settings as queued engine replay/);
  assert.match(doc, /seed updateSettings can process queued data and reprocess stored JSON snapshots/);
  assert.match(doc, /DOM fallback serializes overlapping runs and can clear stale visibility/);
  assert.match(doc, /filter logic harvests before disabled-check filtering/);
  assert.match(doc, /No `settingsRefreshCrossContextConsumerContract`, `settingsRefreshCrossContextConsumerReport`, `settingsRefreshRevisionPolicy`, `settingsRefreshDirtyKeyReport`, `settingsRefreshDomFallbackBudget`, `settingsRefreshSeedReplayBudget`, `settingsRefreshMainWorldCapabilityGate`, `settingsRefreshProfileScopeReport`, `settingsRefreshNoOpDecisionReport`, or `settingsRefreshMetricArtifact` exists/);
});

test('objective coverage ledger records compiled settings profile list-mode assembly boundary as assembly proof', () => {
  const doc = ledger();

  assert.match(doc, /Compiled settings profile\/list-mode assembly boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_COMPILED_SETTINGS_PROFILE_LIST_MODE_ASSEMBLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/compiled-settings-profile-list-mode-assembly-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct compiled settings profile\/list-mode assembly proof/);
  assert.match(doc, /3 compiled settings profile\/list-mode assembly source files/);
  assert.match(doc, /6 source\/effect blocks/);
  assert.match(doc, /55 background profile\/list-mode whitelist lines/);
  assert.match(doc, /3428 background profile\/list-mode whitelist bytes/);
  assert.match(doc, /65 background whitelist channel compiler lines/);
  assert.match(doc, /3878 whitelist channel compiler bytes/);
  assert.match(doc, /31 bridge host normalization lines/);
  assert.match(doc, /1404 bridge host normalization bytes/);
  assert.match(doc, /36 bridge request profile gate lines/);
  assert.match(doc, /1758 request profile gate bytes/);
  assert.match(doc, /125 filter process settings lines/);
  assert.match(doc, /6348 filter process settings bytes/);
  assert.match(doc, /145 filter list-mode identity admission lines/);
  assert.match(doc, /7062 identity admission bytes/);
  assert.match(doc, /selected compiled settings profile\/list-mode token counts/);
  assert.match(doc, /selected zero policy token counts/);
  assert.match(doc, /6 runtime compiled settings profile\/list-mode fixtures/);
  assert.match(doc, /background assigns listMode\/profileType/);
  assert.match(doc, /background can merge Kids whitelist keyword\/channel rows into main under synced whitelist mode and tags synced Kids channels/);
  assert.match(doc, /background compiles whitelist channels with identity, source, collaboration, and dedupe fields/);
  assert.match(doc, /bridge normalization changes a main-profile empty whitelist on Kids hosts to blocklist/);
  assert.match(doc, /bridge request profile gating retries mismatched compiled settings with force refresh/);
  assert.match(doc, /filter logic rebuilds serialized whitelist keyword regexes, lowercases whitelist channel identity fields, preserves object video meta maps, and requires whitelist channel identity only in exact whitelist mode/);
  assert.match(doc, /No `compiledSettingsProfileListModeContract`, `compiledSettingsProfileListModeReport`, `compiledSettingsListModeProfileScopePolicy`, `compiledSettingsWhitelistAssemblyReport`, `compiledSettingsKidsEmptyWhitelistPolicy`, `compiledSettingsBridgeNormalizationReport`, `compiledSettingsFilterLogicConsumerParity`, `compiledSettingsProfileListModeFixtureProvenance`, `compiledSettingsProfileListModeMetricArtifact`, or `compiledSettingsProfileListModeRevisionPolicy` exists/);
});

test('objective coverage ledger records DOM fallback run-state visibility cleanup boundary as cleanup proof', () => {
  const doc = ledger();

  assert.match(doc, /DOM fallback run-state visibility cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_DOM_FALLBACK_RUN_STATE_VISIBILITY_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/dom-fallback-run-state-visibility-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct run-state\/visibility cleanup proof/);
  assert.match(doc, /2 DOM fallback run-state visibility cleanup source files/);
  assert.match(doc, /10 source\/effect blocks/);
  assert.match(doc, /84 helper toggleVisibility lines/);
  assert.match(doc, /3286 helper toggleVisibility bytes/);
  assert.match(doc, /53 helper container visibility lines/);
  assert.match(doc, /2177 helper container visibility bytes/);
  assert.match(doc, /58 explicit hidden detection lines/);
  assert.match(doc, /2864 explicit hidden bytes/);
  assert.match(doc, /68 active-work decision lines/);
  assert.match(doc, /2333 active-work bytes/);
  assert.match(doc, /33 stale cleanup lines/);
  assert.match(doc, /1412 stale cleanup bytes/);
  assert.match(doc, /63 apply run-head lines/);
  assert.match(doc, /2188 run-head bytes/);
  assert.match(doc, /71 scroll\/watch cleanup lines/);
  assert.match(doc, /3055 scroll\/watch cleanup bytes/);
  assert.match(doc, /21 disabled cleanup lines/);
  assert.match(doc, /959 disabled cleanup bytes/);
  assert.match(doc, /22 scroll restore lines/);
  assert.match(doc, /893 scroll restore bytes/);
  assert.match(doc, /11 finally lines/);
  assert.match(doc, /342 finally bytes/);
  assert.match(doc, /selected DOM fallback run-state visibility token counts/);
  assert.match(doc, /selected zero policy token counts/);
  assert.match(doc, /6 runtime DOM fallback run-state visibility cleanup fixtures/);
  assert.match(doc, /helper visibility toggles write and restore class\/attribute\/inline-display markers/);
  assert.match(doc, /recycled rows without explicit reason markers restore when live and processed ids diverge/);
  assert.match(doc, /disabled\/empty blocklist is no-work while exact whitelist and active lists\/toggles\/filters are work/);
  assert.match(doc, /stale cleanup restores hidden\/pending markers and clears content-control CSS/);
  assert.match(doc, /apply fallback serializes overlapping runs and schedules a pending rerun from finally/);
  assert.match(doc, /scroll restoration is guarded by one scroll listener plus recent user-scroll checks/);
  assert.match(doc, /No `domFallbackRunStateVisibilityCleanupContract`, `domFallbackRunStateReport`, `domFallbackStaleVisibilityCleanupPolicy`, `domFallbackScrollRestoreBudget`, `domFallbackPendingRerunBudget`, `domFallbackActiveWorkDecisionReport`, `domFallbackVisibilityOwnershipReport`, `domFallbackCleanupFixtureProvenance`, `domFallbackSelectorBudgetReport`, or `domFallbackMetricArtifact` exists/);
});

test('objective coverage ledger records content bridge whitelist pending refresh boundary as pending placeholder proof', () => {
  const doc = ledger();

  assert.match(doc, /Content bridge whitelist pending refresh boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_WHITELIST_PENDING_REFRESH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-whitelist-pending-refresh-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct whitelist-pending refresh proof/);
  assert.match(doc, /2 content bridge whitelist pending refresh source files/);
  assert.match(doc, /9 source\/effect blocks/);
  assert.match(doc, /75 right-rail observer lines/);
  assert.match(doc, /2413 right-rail observer bytes/);
  assert.match(doc, /60 fallback throttle lines/);
  assert.match(doc, /2297 fallback throttle bytes/);
  assert.match(doc, /69 whitelist pending queue lines/);
  assert.match(doc, /3668 queue bytes/);
  assert.match(doc, /111 whitelist pending apply lines/);
  assert.match(doc, /5760 apply bytes/);
  assert.match(doc, /93 fallback mutation observer lines/);
  assert.match(doc, /4015 mutation observer bytes/);
  assert.match(doc, /12 DOM fallback pending selector lines/);
  assert.match(doc, /468 selector bytes/);
  assert.match(doc, /54 pending state-reset lines/);
  assert.match(doc, /3079 state-reset bytes/);
  assert.match(doc, /16 pending identity-hide lines/);
  assert.match(doc, /960 identity-hide bytes/);
  assert.match(doc, /4 focused-return lines/);
  assert.match(doc, /83 focused-return bytes/);
  assert.match(doc, /selected whitelist pending refresh token counts/);
  assert.match(doc, /selected zero policy token counts/);
  assert.match(doc, /9 runtime content bridge whitelist pending refresh fixtures/);
  assert.match(doc, /pending recheck coalesces to one timer and calls focused DOM fallback/);
  assert.match(doc, /pending hide applies temporary hidden and whitelist-pending markers outside excluded routes/);
  assert.match(doc, /pending hide skips blocklist, home\/search\/feed-channels\/watch routes, selected playlist rows, processed, already pending, and already hidden nodes/);
  assert.match(doc, /mutation queue collection accepts direct\/nested video-card candidates/);
  assert.match(doc, /dedupes candidates, caps at 160, and coalesces work behind one timer/);
  assert.match(doc, /fallback mutation observation queues pending hide and schedules immediate fallback only for relevant content/);
  assert.match(doc, /DOM fallback narrows focused rechecks, clears processed state, and returns before later broad passes/);
  assert.match(doc, /No `contentBridgeWhitelistPendingRefreshContract`, `contentBridgeWhitelistPendingRefreshReport`, `whitelistPendingHideQueueBudget`, `whitelistPendingPlaceholderPolicy`, `whitelistPendingObserverOwnerReport`, `whitelistPendingRouteExclusionPolicy`, `whitelistPendingRerunBudgetReport`, `whitelistPendingDomFallbackConsumerParity`, `whitelistPendingFixtureProvenance`, or `whitelistPendingMetricArtifact` exists/);
  assert.match(doc, /Whitelist Pending Intake No-Work Contract Addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WHITELIST_PENDING_INTAKE_NO_WORK_CONTRACT_CURRENT_BEHAVIOR_2026-05-25\.md/);
  assert.match(doc, /tests\/runtime\/whitelist-pending-intake-no-work-contract-current-behavior\.test\.mjs/);
  assert.match(doc, /12\s+whitelist pending intake no-work contract rows/);
  assert.match(doc, /10 release whitelist-pending\s+intake gate rows\s+covered/);
  assert.match(doc, /9 runtime content bridge whitelist pending refresh\s+fixtures covered/);
  assert.match(doc, /narrow implementation-ready whitelist pending intake rows: 1/);
  assert.match(doc, /runtime whitelist pending intake authority symbols: 0/);
  assert.match(doc, /runtime\s+whitelist pending intake patch now: GO/);
  assert.match(doc, /runtime\s+whitelist optimization patch now: NO-GO/);
  assert.match(doc, /Whitelist Pending Intake Implementation Readiness Gate Addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WHITELIST_PENDING_INTAKE_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-25\.md/);
  assert.match(doc, /14\s+whitelist pending intake implementation readiness rows/);
  assert.match(doc, /8 source inputs\s+covered/);
  assert.match(doc, /10 required future no-work fixture names covered/);
  assert.match(doc, /0 implemented runtime authority symbols/);
  assert.match(doc, /release patch\s+approval: NO-GO/);
  assert.match(doc, /prepare narrow whitelist pending-intake implementation patch:\s+GO/);
  assert.match(doc, /runtime whitelist pending intake patch in this audit slice: GO/);
  assert.match(doc, /Whitelist Pending Intake Patch Source Locus Boundary Addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WHITELIST_PENDING_INTAKE_PATCH_SOURCE_LOCUS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25\.md/);
  assert.match(doc, /12 whitelist pending intake patch\s+source-locus rows/);
  assert.match(doc, /1 allowed runtime source file family/);
  assert.match(doc, /`js\/content_bridge\.js` as the only allowed runtime file/);
  assert.match(doc, /4 read-only parity\s+runtime source loci/);
  assert.match(doc, /8 forbidden runtime source families/);
  assert.match(doc, /narrow semantic-change approval rows: 1/);
  assert.match(doc, /patch\s+source locus approval: GO/);
});

test('objective coverage ledger records quick-block hover lifecycle timer boundary as lifecycle proof', () => {
  const doc = ledger();

  assert.match(doc, /Quick-block hover lifecycle timer boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_QUICK_BLOCK_HOVER_LIFECYCLE_TIMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/quick-block-hover-lifecycle-timer-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct quick-block lifecycle proof/);
  assert.match(doc, /1 quick-block hover lifecycle timer source file/);
  assert.match(doc, /9 source\/effect blocks/);
  assert.match(doc, /8 quick-block globals lines/);
  assert.match(doc, /328 globals bytes/);
  assert.match(doc, /31 surface predicate lines/);
  assert.match(doc, /974 surface predicate bytes/);
  assert.match(doc, /15 viewport RAF lines/);
  assert.match(doc, /490 viewport RAF bytes/);
  assert.match(doc, /64 hover-state lines/);
  assert.match(doc, /1961 hover-state bytes/);
  assert.match(doc, /34 action fallback lines/);
  assert.match(doc, /1448 action fallback bytes/);
  assert.match(doc, /14 wrap hover lines/);
  assert.match(doc, /888 wrap hover bytes/);
  assert.match(doc, /148 ensure-button lines/);
  assert.match(doc, /6428 ensure-button bytes/);
  assert.match(doc, /41 sweep schedule lines/);
  assert.match(doc, /1342 sweep schedule bytes/);
  assert.match(doc, /225 observer setup lines/);
  assert.match(doc, /9085 observer setup bytes/);
  assert.match(doc, /selected quick-block lifecycle token counts/);
  assert.match(doc, /selected zero policy token counts/);
  assert.match(doc, /9 runtime quick-block lifecycle fixtures/);
  assert.match(doc, /active hover sets hover\/sticky markers and schedules sticky cleanup/);
  assert.match(doc, /inactive leave clears hover while keeping sticky for the leave window/);
  assert.match(doc, /overlay, mobile search, or viewport-hidden state clears hover\/sticky without scheduling a sticky timer/);
  assert.match(doc, /viewport refresh coalesces behind one requestAnimationFrame/);
  assert.match(doc, /sweep scheduling coalesces behind one 80 ms timer/);
  assert.match(doc, /setup installs page-level listeners, a MutationObserver, and `yt-navigate-finish` sweep scheduling without local teardown/);
  assert.match(doc, /fallback success can schedule focused DOM fallback after 120 ms/);
  assert.match(doc, /No `quickBlockHoverLifecycleContract`, `quickBlockHoverLifecycleReport`, `quickBlockTimerBudget`, `quickBlockObserverOwnerReport`, `quickBlockPeriodicSweepBudget`, `quickBlockViewportRafBudget`, `quickBlockHoverStickyPolicy`, `quickBlockTeardownRegistry`, `quickBlockActionFallbackRerunBudget`, or `quickBlockLifecycleMetricArtifact` exists/);
});

test('objective coverage ledger records menu observer Kids passive lifecycle boundary as lifecycle proof', () => {
  const doc = ledger();

  assert.match(doc, /Menu observer Kids passive lifecycle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_MENU_OBSERVER_KIDS_PASSIVE_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/menu-observer-kids-passive-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct menu\/Kids lifecycle proof/);
  assert.match(doc, /1 menu observer Kids passive lifecycle source file/);
  assert.match(doc, /10 source\/effect blocks/);
  assert.match(doc, /51 menu injection state lines/);
  assert.match(doc, /1517 menu state bytes/);
  assert.match(doc, /25 dropdown pending state lines/);
  assert.match(doc, /762 dropdown state bytes/);
  assert.match(doc, /124 normal menu observer lines/);
  assert.match(doc, /5014 observer bytes/);
  assert.match(doc, /46 Kids passive listener lines/);
  assert.match(doc, /2558 Kids listener bytes/);
  assert.match(doc, /123 Kids context capture lines/);
  assert.match(doc, /5460 context bytes/);
  assert.match(doc, /97 Kids native block handler lines/);
  assert.match(doc, /3790 Kids handler bytes/);
  assert.match(doc, /25 visible-dropdown retry lines/);
  assert.match(doc, /1027 retry bytes/);
  assert.match(doc, /16 dropdown lock lines/);
  assert.match(doc, /526 lock bytes/);
  assert.match(doc, /245 dropdown internal lines/);
  assert.match(doc, /11707 internal bytes/);
  assert.match(doc, /5 startup timer lines/);
  assert.match(doc, /127 startup bytes/);
  assert.match(doc, /selected menu\/Kids lifecycle token counts/);
  assert.match(doc, /selected zero policy token counts/);
  assert.match(doc, /9 runtime menu\/Kids lifecycle fixtures/);
  assert.match(doc, /non-Kids setup installs a capture click listener, dropdown attribute observers, a body MutationObserver, and a 150 ms visible-dropdown retry/);
  assert.match(doc, /Kids setup installs a capture click listener plus body MutationObserver and suppresses toast fallback for 2000 ms/);
  assert.match(doc, /Kids native block handling uses a 1000 ms action throttle, 15000 ms context TTL, and 10000 ms dedupe timer/);
  assert.match(doc, /dropdown appearance uses a WeakSet lock around internal injection/);
  assert.match(doc, /whitelist mode cleans injected menu items before injection/);
  assert.match(doc, /dropdown internals cancel pending dropdown fetches on hidden state/);
  assert.match(doc, /startup timer still delays 1000 ms before calling both menu and quick-block observer setup/);
  assert.match(doc, /No `menuDropdownLifecycleContract`, `menuDropdownLifecycleReport`, `menuDropdownObserverOwnerReport`, `menuDropdownPendingFetchCancellationPolicy`, `menuDropdownInjectionStateReport`, `kidsPassiveBlockLifecycleContract`, `kidsNativeBlockDedupBudget`, `kidsBlockMessageAuthority`, `menuObserverTeardownRegistry`, or `menuDropdownLifecycleMetricArtifact` exists/);
  assert.match(doc, /2026-05-28 menu bounded-discovery executable continuation/);
  assert.match(doc, /native dropdown discovery stop executable rows:\s+1/);
  assert.match(doc, /native dropdown escape fallback executable rows:\s+1/);
  assert.match(doc, /native dropdown executable continuation behavior changed:\s+no/);
  assert.match(doc, /native dropdown executable continuation approval:\s+`NO-GO`/);
  assert.match(doc, /ASCII bounded-discovery diagram:\s+present/);
  assert.match(doc, /Mermaid bounded-discovery diagram:\s+present/);
  assert.match(doc, /without approving menu lifecycle optimization, close-helper simplification,\s+outside-pointer policy changes, route\/surface authority, whitelist behavior changes,\s+or implementation changes/);
});

test('objective coverage ledger records content bridge menu injection action boundary as action proof', () => {
  const doc = ledger();

  assert.match(doc, /Content bridge menu injection action boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_MENU_INJECTION_ACTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-menu-injection-action-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct content bridge menu action proof/);
  assert.match(doc, /1 content bridge menu injection action source file/);
  assert.match(doc, /7 source\/effect blocks/);
  assert.match(doc, /76 metadata payload lines/);
  assert.match(doc, /3754 metadata payload bytes/);
  assert.match(doc, /123 dropdown cleanup lines/);
  assert.match(doc, /4170 dropdown cleanup bytes/);
  assert.match(doc, /735 menu injection lines/);
  assert.match(doc, /34684 menu injection bytes/);
  assert.match(doc, /71 menu handler lines/);
  assert.match(doc, /2490 menu handler bytes/);
  assert.match(doc, /119 blocked marker\/target lines/);
  assert.match(doc, /5113 marker bytes/);
  assert.match(doc, /1226 handleBlockChannelClick lines/);
  assert.match(doc, /60722 click handler bytes/);
  assert.match(doc, /54 addChannelDirectly lines/);
  assert.match(doc, /2662 direct-add bytes/);
  assert.match(doc, /selected content bridge menu action token counts/);
  assert.match(doc, /selected zero policy token counts/);
  assert.match(doc, /9 runtime content bridge menu action fixtures/);
  assert.match(doc, /metadata payload keeps display handles strict and stores names separately/);
  assert.match(doc, /dropdown cleanup cancels pending fetches and clears injected collaboration state/);
  assert.match(doc, /menu injection remains gated by whitelist mode and disabled block-menu setting/);
  assert.match(doc, /menu handlers gate disabled, toggle, placeholder, multi-step, and block-click paths/);
  assert.match(doc, /blocked markers stamp current optimistic hide metadata/);
  assert.match(doc, /direct add sends the content mutation message and schedules background backup/);
  assert.match(doc, /optimistic hide, restoration on failure, success dropdown close, settings refresh, DOM fallback rerun, and post-action Shorts\/playlist enrichment/);
  assert.match(doc, /No `contentBridgeMenuActionContract`, `contentBridgeMenuActionReport`, `contentBridgePendingDropdownFetchPolicy`, `contentBridgeMenuOptimisticHideReport`, `contentBridgeMenuMutationFanoutBudget`, `contentBridgeMenuDomFallbackBudget`, `contentBridgeMenuBackupSchedulePolicy`, `contentBridgeMenuIdentityEnrichmentPolicy`, `contentBridgeMenuActionFixtureProvenance`, or `contentBridgeMenuActionMetricArtifact` exists/);
});

test('objective coverage ledger records content bridge collaborator enrichment retry boundary as retry proof', () => {
  const doc = ledger();

  assert.match(doc, /Content bridge collaborator enrichment retry boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_ENRICHMENT_RETRY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-collaborator-enrichment-retry-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct collaborator enrichment retry proof/);
  assert.match(doc, /1 content bridge collaborator enrichment retry source file/);
  assert.match(doc, /6 source\/effect blocks/);
  assert.match(doc, /58 pending dialog state lines/);
  assert.match(doc, /2208 pending dialog bytes/);
  assert.match(doc, /17 retry lines/);
  assert.match(doc, /778 retry bytes/);
  assert.match(doc, /54 lookup option lines/);
  assert.match(doc, /2358 lookup bytes/);
  assert.match(doc, /56 enrichment request lines/);
  assert.match(doc, /2572 request bytes/);
  assert.match(doc, /97 apply resolved lines/);
  assert.match(doc, /3596 apply resolved bytes/);
  assert.match(doc, /94 apply by video id lines/);
  assert.match(doc, /3508 apply-by-video bytes/);
  assert.match(doc, /selected collaborator enrichment retry token counts/);
  assert.match(doc, /selected zero authority token counts/);
  assert.match(doc, /10 runtime collaborator enrichment retry fixtures/);
  assert.match(doc, /pending dialog enrichment creates `vid:` keys, pending attributes, partial collaborator storage, expected-count hints, and a 20000 ms expiry/);
  assert.match(doc, /retry scheduling caps at three attempts, clears requested state, and defaults to 700 ms/);
  assert.match(doc, /lookup options merge partial, cached, and channel-info hints while parsing hidden-collaborator labels/);
  assert.match(doc, /request enrichment marks pending before duplicate main-world suppression, applies non-empty responses, and retries empty or failed responses/);
  assert.match(doc, /resolved application writes serialized collaborator state, refreshes active menus and playlist popovers, and schedules zero-delay forced DOM fallback/);
  assert.match(doc, /video-id batch application can create pending entries, call the collaborator dialog module, skip lower-quality rosters unless forced/);
  assert.match(doc, /No `contentBridgeCollaboratorEnrichmentContract`, `contentBridgeCollaboratorRetryPolicy`, `contentBridgeCollaboratorPendingCardReport`, `contentBridgeCollaboratorLookupOptionsPolicy`, `contentBridgeCollaboratorApplicationReport`, `contentBridgeCollaboratorDomFallbackBudget`, `contentBridgeCollaboratorMenuRefreshReport`, `contentBridgeCollaboratorFixtureProvenance`, `contentBridgeCollaboratorMetricArtifact`, or `contentBridgeCollaboratorAuthorityGate` exists/);
});

test('objective coverage ledger records content bridge collaborator metadata extraction boundary as side-effect proof', () => {
  const doc = ledger();

  assert.match(doc, /Content bridge collaborator metadata extraction side-effect boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_METADATA_EXTRACTION_SIDE_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-collaborator-metadata-extraction-side-effect-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /extraction side-effect proof/);
  assert.match(doc, /1 content bridge collaborator metadata extraction source file/);
  assert.match(doc, /5 source\/effect blocks/);
  assert.match(doc, /242 renderer extraction lines/);
  assert.match(doc, /12604 renderer extraction bytes/);
  assert.match(doc, /45 renderer candidate inventory lines/);
  assert.match(doc, /1996 renderer candidate inventory bytes/);
  assert.match(doc, /484 element extraction lines/);
  assert.match(doc, /24961 element extraction bytes/);
  assert.match(doc, /78 cache\/enrich helper lines/);
  assert.match(doc, /3331 cache\/enrich helper bytes/);
  assert.match(doc, /88 YTM byline branch lines/);
  assert.match(doc, /5456 YTM byline branch bytes/);
  assert.match(doc, /selected collaborator metadata extraction token counts/);
  assert.match(doc, /selected zero authority token counts/);
  assert.match(doc, /11 runtime collaborator metadata extraction fixtures/);
  assert.match(doc, /renderer JSON extraction rejects Mix renderer signals/);
  assert.match(doc, /renderer JSON extraction can recover collaborators from bounded deep sheet scans/);
  assert.match(doc, /element extraction can stamp card and wrapper video-id attrs/);
  assert.match(doc, /renderer-derived collaborators cache lockup metadata and expected-count attrs/);
  assert.match(doc, /renderer-derived collaborators can call resolved application twice/);
  assert.match(doc, /hidden DOM collaborator text can cache partial collaborators and request enrichment/);
  assert.match(doc, /plain single-channel name containing `and` remains outside collaborator mode/);
  assert.match(doc, /captured headerless YTM showSheet roster falls back to one partial `Shakira` enrichment seed/);
  assert.match(doc, /No `contentBridgeCollaboratorMetadataExtractionContract`, `contentBridgeCollaboratorMetadataExtractionDecision`, `contentBridgeCollaboratorExtractionSideEffectReport`, `contentBridgeCollaboratorPureReadMode`, `contentBridgeCollaboratorRendererJsonPathPolicy`, `contentBridgeCollaboratorDomSelectorPolicy`, `contentBridgeCollaboratorEnrichmentOptInPolicy`, `contentBridgeCollaboratorExtractionFixtureProvenance`, `contentBridgeCollaboratorExtractionMetricArtifact`, `contentBridgeCollaboratorExtractionAuthorityGate`, `contentBridgeShowSheetCapturedFixtureParityReport`, `contentBridgeShowSheetFilterAuthorityBoundary`, or `contentBridgeShowSheetSideEffectBudget` exists/);
});

test('objective coverage ledger records YTM showSheet enrichment handoff without opening implementation gate', () => {
  const doc = ledger();

  assert.match(doc, /YTM showSheet collaborator roster addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_YTM_SHOW_SHEET_COLLABORATOR_ROSTER_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(doc.includes('tests/runtime/ytm-show-sheet-collaborator-roster-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/ytm-show-sheet-collab-video-with-context-renderer.json'));
  assert.match(doc, /showSheetCommand\.sheetViewModel/);
  assert.match(doc, /UCGnjeahCJW1AF34HBmQTJ-Q -> @shakiraVEVO/);
  assert.match(doc, /UCYLNGLIzMhRTi6ZOLjAPSmw -> @spotify/);
  assert.match(doc, /UCRMqQWxCWE0VMvtUElm-rEA -> @beele/);
  assert.match(doc, /blocklist channel rules for any captured collaborator leak/);
  assert.match(doc, /whitelist channel allow rules for any captured collaborator false-hide/);

  assert.match(doc, /YTM showSheet injector\/filter-logic parity addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_YTM_SHOW_SHEET_INJECTOR_FILTER_LOGIC_PARITY_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(doc.includes('tests/runtime/ytm-show-sheet-injector-filter-logic-parity-current-behavior.test.mjs'));
  assert.match(doc, /cross-owner mismatch/);
  assert.match(doc, /`js\/injector\.js` has 14 `showSheetCommand` tokens/);
  assert.match(doc, /`js\/filter_logic\.js` has 0 `showSheetCommand` tokens/);
  assert.match(doc, /`Shakira and 2 more` display byline identity only/);
  assert.match(doc, /leaks under matching collaborator channel blocklist rules/);
  assert.match(doc, /false-hides under matching collaborator channel whitelist rules/);
  assert.match(doc, /No `ytmShowSheetInjectorFilterLogicParityContract`, `ytmShowSheetMainWorldRosterFilterParityReport`, `ytmShowSheetSnapshotToFilterCandidateContract`, `ytmShowSheetCollaboratorSharedExtractionPolicy`, `ytmShowSheetWhitelistParityFixture`, `ytmShowSheetBlocklistParityFixture`, `ytmShowSheetParitySideEffectBudget`, `ytmShowSheetParityNoWorkBudget`, or `ytmShowSheetParityJsonFirstGate` exists/);

  assert.match(doc, /YTM showSheet enrichment handoff addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_YTM_SHOW_SHEET_ENRICHMENT_HANDOFF_CURRENT_BEHAVIOR_2026-05-24\.md/);
  assert.match(doc, /tests\/runtime\/ytm-show-sheet-enrichment-handoff-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /captured headerless YTM showSheet path/);
  assert.match(doc, /`expectedNames=\["Shakira"\]`/);
  assert.match(doc, /`expectedHandles=\[\]`/);
  assert.match(doc, /expected count `3`/);
  assert.match(doc, /bridge roster fallback flag `false`/);
  assert.match(doc, /injector matcher promotes expected count `3` into roster fallback `true`/);
  assert.match(doc, /fuzzy-matches `Shakira` to `shakiraVEVO`/);
  assert.match(doc, /snapshot lookup returns Shakira, Spotify, and Beele from `lastYtNextResponse`/);
  assert.match(doc, /No `ytmShowSheetEnrichmentHandoffContract`, `ytmShowSheetBridgeLookupOptionReport`, `ytmShowSheetInjectorMatcherReport`, `ytmShowSheetEnrichmentApplicationReport`, `ytmShowSheetFilterAuthorityBoundary`, `ytmShowSheetHandoffSideEffectBudget`, `ytmShowSheetHandoffNoWorkBudget`, or `ytmShowSheetSharedRosterDecisionGate` exists/);
});

test('objective coverage ledger records content bridge collaborator identity promotion handoff as caller proof', () => {
  const doc = ledger();

  assert.match(doc, /Content bridge collaborator identity promotion handoff addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_IDENTITY_PROMOTION_HANDOFF_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-collaborator-identity-promotion-handoff-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /caller-side promotion proof/);
  assert.match(doc, /1 content bridge collaborator identity promotion source file/);
  assert.match(doc, /7 source\/effect blocks/);
  assert.match(doc, /28 warmup lines/);
  assert.match(doc, /1229 warmup bytes/);
  assert.match(doc, /88 YTM promotion lines/);
  assert.match(doc, /3141 YTM promotion bytes/);
  assert.match(doc, /26 DOM signal lines/);
  assert.match(doc, /1247 DOM signal bytes/);
  assert.match(doc, /136 normalization lines/);
  assert.match(doc, /5694 normalization bytes/);
  assert.match(doc, /82 generic promotion lines/);
  assert.match(doc, /2962 generic promotion bytes/);
  assert.match(doc, /32 extract-channel priority handoff lines/);
  assert.match(doc, /1622 priority handoff bytes/);
  assert.match(doc, /24 lockup handoff lines/);
  assert.match(doc, /1290 lockup handoff bytes/);
  assert.match(doc, /selected collaborator identity promotion token counts/);
  assert.match(doc, /selected zero authority token counts/);
  assert.match(doc, /11 runtime collaborator identity promotion fixtures/);
  assert.match(doc, /watch-like warmup parses two-name `and` bylines but skips Mix cards/);
  assert.match(doc, /ampersand-only music Topic bylines such as `Kully B & Gussy G - Topic` stay outside collaborator mode/);
  assert.match(doc, /YTM promotion calls collaborator extraction and returns collaboration-shaped identity with incomplete-roster enrichment needs/);
  assert.match(doc, /generic promotion prefers richer resolved-cache data over weaker extraction/);
  assert.match(doc, /normalization merges existing, resolved-cache, and avatar-stack rosters/);
  assert.match(doc, /can inflate expected count from overlapping raw roster inputs/);
  assert.match(doc, /Mix promotion\/normalization clears collaborator metadata while keeping base identity/);
  assert.match(doc, /2026-05-28 topic stale collaborator state continuation/);
  assert.match(doc, /already-present same-video collaborator attrs or resolved-cache state/);
  assert.match(doc, /topic stale collaborator state rows: 5/);
  assert.match(doc, /topic stale ampersand-topic guard rows: 4/);
  assert.match(doc, /topic stale action-layer trust rows: 0/);
  assert.match(doc, /topic stale installed-tab parity status: MISSING/);
  assert.match(doc, /topic stale collaborator state risk: GATED_FOR_NAME_ONLY_AMPERSAND_TOPIC/);
  assert.match(doc, /runtime behavior changed by this addendum: yes/);
  assert.match(doc, /2026-05-28 collaborator cache provenance readiness continuation/);
  assert.match(doc, /same-video cache validation has one ampersand Topic name-only negative guard/);
  assert.match(doc, /Block All cleanup branch is guarded by `!has\(videoId\)`/);
  assert.match(doc, /collaborator cache provenance readiness rows: 7/);
  assert.match(doc, /collaborator cache ampersand-topic guard rows: 1/);
  assert.match(doc, /collaborator cache source-label write-only rows: 2/);
  assert.match(doc, /collaborator cache stale-delete no-op rows: 1/);
  assert.match(doc, /collaborator cache provenance validation rows: 1/);
  assert.match(doc, /collaborator cache runtime behavior changed: yes/);
  assert.match(doc, /collaborator cache provenance risk: PARTIAL/);
  assert.match(doc, /ASCII collaborator cache provenance diagram: present/);
  assert.match(doc, /Mermaid collaborator cache provenance diagram: present/);
  assert.match(doc, /2026-05-29 installed Topic menu parity continuation/);
  assert.match(doc, /same-video collaborator attrs can already exist before menu or quick-block rendering/);
  assert.match(doc, /installed Topic menu parity rows: 5/);
  assert.match(doc, /installed Topic menu live DOM shape: OBSERVED_BY_USER/);
  assert.match(doc, /ampersand Topic reader guard status: PRESENT/);
  assert.match(doc, /collaborator writer grammar authority: NO-GO/);
  assert.match(doc, /quick-block Topic parity proof: PARTIAL_GO/);
  assert.match(doc, /menu renderer Topic parity proof: PARTIAL_GO_SOURCE/);
  assert.match(doc, /installed-tab byte parity trace: MISSING/);
  assert.match(doc, /runtime behavior changed by this addendum: yes/);
  assert.match(doc, /2026-05-29 Topic writer-side readiness continuation/);
  assert.match(doc, /exact source-side precondition/);
  assert.match(doc, /Topic writer-side readiness rows: 6/);
  assert.match(doc, /writer-side reusable guard available: PRESENT/);
  assert.match(doc, /applyResolved writer guard status: PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY/);
  assert.match(doc, /applyByVideoId writer guard status: PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY/);
  assert.match(doc, /renderer hydration writer guard status: PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY/);
  assert.match(doc, /cache-result writer guard status: PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY/);
  assert.match(doc, /action-layer patch as primary fix: NO-GO/);
  assert.match(doc, /narrow runtime patch approval from this addendum: USED_2026_05_29/);
  assert.match(doc, /runtime behavior changed by this addendum: yes/);
  assert.match(doc, /2026-05-30 installed Topic reload parity gap continuation/);
  assert.match(doc, /Installed Topic Reload Parity Gap Addendum - 2026-05-30/);
  assert.match(doc, /installed Topic reload parity rows: 4/);
  assert.match(doc, /source-focused Topic guard tests: PASS/);
  assert.match(doc, /runtime behavior changed by reload parity addendum: no/);
  assert.match(doc, /installed reloaded-tab byte trace: MISSING/);
  assert.match(doc, /uncovered writer-path proof: MISSING/);
  assert.match(doc, /menu-layer grammar fix approval: NO-GO/);
  assert.match(doc, /current source\/test proof keeps `Kully B & Gussy G - Topic` as one Topic label/);
  assert.match(doc, /stale byte\/open-tab or uncovered-writer proof gap/);
  assert.match(doc, /Installed-tab byte parity, stale open-tab cleanup, uncovered writer-path proof,\s+menu-layer grammar ownership, release\/public-claim use, and broad goal completion\s+remain `NO-GO`/);
  assert.match(doc, /2026-05-30 Topic writer-path source census continuation/);
  assert.match(doc, /Topic Writer-Path Source Census Addendum - 2026-05-30/);
  assert.match(doc, /active-menu refresh, `applyResolvedCollaborators\(\)`, `applyCollaboratorsByVideoId\(\)`, renderer hydration/);
  assert.match(doc, /Topic writer-path source census rows: 9/);
  assert.match(doc, /DOM collaborator attr writer rows covered: 6/);
  assert.match(doc, /resolved-map writer rows covered: 5/);
  assert.match(doc, /entrypoint funnel rows covered: 3/);
  assert.match(doc, /known content_bridge DOM attr writer coverage: PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY/);
  assert.match(doc, /uncovered writer-path proof from source census: PARTIAL_SOURCE_CENSUS/);
  assert.match(doc, /runtime behavior changed by writer-path census addendum: no/);
  assert.match(doc, /broader non-Topic provenance, release\/public-claim use, and broad goal completion at `NO-GO`/);
  assert.match(doc, /2026-05-30 ampersand Topic root-cause boundary continuation/);
  assert.match(doc, /Ampersand Topic Root-Cause Boundary Addendum - 2026-05-30/);
  assert.match(doc, /false `Kully B & Gussy G - Topic` collaborator menu requires upstream collaborator-shaped state/);
  assert.match(doc, /ampersand Topic root-cause rows: 5/);
  assert.match(doc, /menu root-cause status: DOWNSTREAM_RENDERER_NOT_CLASSIFIER/);
  assert.match(doc, /current source fresh parser status: NO_PLAIN_AMPERSAND_SPLIT/);
  assert.match(doc, /current source stale name-only roster status: REJECTED_FOR_VISIBLE_TOPIC_LABEL/);
  assert.match(doc, /true collaborator preservation status: STRONGER_EVIDENCE_STILL_ADMITTED/);
  assert.match(doc, /runtime behavior changed by root-cause addendum: no/);
  assert.match(doc, /2026-05-30 installed Chrome DOM evidence boundary continuation/);
  assert.match(doc, /live connected-profile DOM evidence from the user Chrome YouTube tab `https:\/\/www\.youtube\.com\/watch\?v=aJOTlE1K90k`/);
  assert.match(doc, /installed Chrome DOM evidence rows: 5/);
  assert.match(doc, /installed Chrome FilterTube stamped nodes observed: 301/);
  assert.match(doc, /installed Chrome processed card attrs observed: 235/);
  assert.match(doc, /installed Chrome hidden attrs observed: 20/);
  assert.match(doc, /installed Chrome collaborator attrs observed in sampled tab: 0/);
  assert.match(doc, /installed Chrome source resource probe: BLOCKED_BY_BROWSER_POLICY/);
  assert.match(doc, /installed Chrome extension activity status: OBSERVED_DOM_STAMPS/);
  assert.match(doc, /installed Chrome source byte parity status: NOT_PROVED/);
  assert.match(doc, /runtime behavior changed by installed Chrome DOM evidence addendum: no/);
  assert.match(doc, /installed source byte parity, the `Kully B & Gussy G - Topic` live negative fixture/);
  assert.match(doc, /No `contentBridgeCollaboratorIdentityPromotionContract`, `contentBridgeCollaboratorIdentityPromotionDecision`, `contentBridgeCollaboratorPromotionSideEffectReport`, `contentBridgeCollaboratorPromotionPureReadPolicy`, `contentBridgeCollaboratorPromotionCallerPolicy`, `contentBridgeCollaboratorPromotionRouteScopeReport`, `contentBridgeCollaboratorPromotionCacheWriteReport`, `contentBridgeCollaboratorPromotionFixtureProvenance`, `contentBridgeCollaboratorPromotionMetricArtifact`, or `contentBridgeCollaboratorPromotionAuthorityGate` exists/);
});

test('objective coverage ledger records content bridge collaborator main-world merge mutation as mutation proof', () => {
  const doc = ledger();

  assert.match(doc, /Content bridge collaborator main-world merge mutation addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_MAIN_WORLD_MERGE_MUTATION_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-collaborator-main-world-merge-mutation-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /enrichment-merge mutation proof/);
  assert.match(doc, /1 content bridge collaborator main-world merge source file/);
  assert.match(doc, /4 source\/effect blocks/);
  assert.match(doc, /10 name-normalization lines/);
  assert.match(doc, /293 name-normalization bytes/);
  assert.match(doc, /142 main-world merge lines/);
  assert.match(doc, /5989 merge bytes/);
  assert.match(doc, /26 main-world enrich lines/);
  assert.match(doc, /1235 enrich bytes/);
  assert.match(doc, /55 menu enrichment handoff lines/);
  assert.match(doc, /2880 handoff bytes/);
  assert.match(doc, /selected collaborator main-world merge token counts/);
  assert.match(doc, /selected zero authority token counts/);
  assert.match(doc, /11 runtime collaborator main-world merge fixtures/);
  assert.match(doc, /name normalization lowercases and collapses whitespace/);
  assert.match(doc, /main-world merge mutates DOM-derived collaborators in place/);
  assert.match(doc, /merge repairs weak collaborator names while preserving conflicting existing handle\/id values/);
  assert.match(doc, /merge copies the first collaborator into primary fields/);
  assert.match(doc, /merge recomputes `needsEnrichment`/);
  assert.match(doc, /enrichment is inactive without collaboration identity or video id/);
  assert.match(doc, /enrichment queries a source card by `data-filtertube-video-id`/);
  assert.match(doc, /No `contentBridgeCollaboratorMainWorldMergeContract`, `contentBridgeCollaboratorMainWorldMergeDecision`, `contentBridgeCollaboratorMainWorldMutationReport`, `contentBridgeCollaboratorMainWorldLookupPolicy`, `contentBridgeCollaboratorMergePrimaryIdentityPolicy`, `contentBridgeCollaboratorMergeConflictPolicy`, `contentBridgeCollaboratorMergeCallerBudget`, `contentBridgeCollaboratorMergeFixtureProvenance`, `contentBridgeCollaboratorMergeMetricArtifact`, or `contentBridgeCollaboratorMergeAuthorityGate` exists/);
});

test('objective coverage ledger records content bridge menu blocked-state list-shape as mode proof', () => {
  const doc = ledger();

  assert.match(doc, /Content bridge menu blocked-state list-shape addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_MENU_BLOCKED_STATE_LIST_SHAPE_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-menu-blocked-state-list-shape-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /menu list-shape proof/);
  assert.match(doc, /1 content bridge menu blocked-state source file/);
  assert.match(doc, /3 source\/effect blocks/);
  assert.match(doc, /16 stored entry lookup lines/);
  assert.match(doc, /581 stored entry bytes/);
  assert.match(doc, /57 already-blocked check lines/);
  assert.match(doc, /2949 already-blocked bytes/);
  assert.match(doc, /33 blocked-element sync lines/);
  assert.match(doc, /1521 blocked-element sync bytes/);
  assert.match(doc, /selected menu blocked-state token counts/);
  assert.match(doc, /selected zero mode\/list token counts/);
  assert.match(doc, /11 runtime menu blocked-state fixtures/);
  assert.match(doc, /`findStoredChannelEntry\(\)` returns entries from `currentSettings\.filterChannels`/);
  assert.match(doc, /ignores whitelist arrays/);
  assert.match(doc, /returns `null` when `filterChannels` is absent even if whitelist fields exist/);
  assert.match(doc, /`checkIfChannelBlocked\(\)` reads only storage `filterChannels` and `channelMap`/);
  assert.match(doc, /already-blocked check disables the menu item and hydrates filter-all controls/);
  assert.match(doc, /fallback matching works by normalized handle or exact id/);
  assert.match(doc, /`syncBlockedElementsWithFilters\(\)` keeps stamped blocked elements hidden while `filterChannels` still matches/);
  assert.match(doc, /clears blocked attrs and restores visibility when only whitelist fields remain/);
  assert.match(doc, /No `contentBridgeMenuBlockedStateListModeContract`, `contentBridgeMenuBlockedStateDecision`, `contentBridgeMenuBlockedStateListTargetPolicy`, `contentBridgeMenuStoredEntryReport`, `contentBridgeBlockedElementSyncReport`, `contentBridgeBlockedElementRestorePolicy`, `contentBridgeMenuWhitelistInteractionReport`, `contentBridgeMenuFilterAllStatePolicy`, `contentBridgeMenuBlockedStateFixtureProvenance`, or `contentBridgeMenuBlockedStateMetricArtifact` exists/);
});

test('objective coverage ledger records content bridge menu action list-target as action proof', () => {
  const doc = ledger();

  assert.match(doc, /Content bridge menu action list-target addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_MENU_ACTION_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-menu-action-list-target-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /action list-target proof/);
  assert.match(doc, /1 content bridge menu action list-target source file/);
  assert.match(doc, /5 source\/effect blocks/);
  assert.match(doc, /213 fallback performBlock lines/);
  assert.match(doc, /9930 fallback performBlock bytes/);
  assert.match(doc, /738 primary injection lines/);
  assert.match(doc, /34747 primary injection bytes/);
  assert.match(doc, /71 attached handler lines/);
  assert.match(doc, /2490 attached handler bytes/);
  assert.match(doc, /1226 block-click handler lines/);
  assert.match(doc, /60722 block-click handler bytes/);
  assert.match(doc, /54 direct-add lines/);
  assert.match(doc, /2662 direct-add bytes/);
  assert.match(doc, /selected menu action list-target token counts/);
  assert.match(doc, /selected zero list-target token counts/);
  assert.match(doc, /11 runtime menu action list-target fixtures/);
  assert.match(doc, /primary dropdown injection returns in whitelist mode/);
  assert.match(doc, /clears injected rows when the menu item is disabled/);
  assert.match(doc, /delegate block clicks without repeating list-mode gates/);
  assert.match(doc, /contains no `listMode`, no `showBlockMenuItem`, and no `whitelistChannels` token/);
  assert.match(doc, /contains 8 `addChannelDirectly` callsites plus mutation fanout/);
  assert.match(doc, /fallback `performBlock` contains no local list-mode gate/);
  assert.match(doc, /sends `type: 'addFilteredChannel'` without `listMode`, `whitelistChannels`, `filterChannels`, or `listTarget` payload fields/);
  assert.match(doc, /successful direct add schedules `FilterTube_ScheduleAutoBackup`/);
  assert.match(doc, /YouTube Kids hostnames derive the `kids` profile/);
  assert.match(doc, /No `contentBridgeMenuActionListTargetContract`, `contentBridgeMenuActionListTargetDecision`, `contentBridgeMenuActionProfileTargetReport`, `contentBridgeFallbackMenuMutationGate`, `contentBridgeFallbackMenuListModePolicy`, `contentBridgeMenuDirectAddListTargetReport`, `contentBridgeMenuActionWhitelistBypassReport`, `contentBridgeMenuActionOptimisticHideBudget`, `contentBridgeMenuActionMutationFanoutMetric`, or `contentBridgeMenuActionListTargetFixtureProvenance` exists/);
});

test('objective coverage ledger records background addFilteredChannel list-target as receiver proof', () => {
  const doc = ledger();

  assert.match(doc, /Background addFilteredChannel list-target addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BACKGROUND_ADD_FILTERED_CHANNEL_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/background-add-filtered-channel-list-target-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /background receiver\/helper proof/);
  assert.match(doc, /1 background addFilteredChannel source file/);
  assert.match(doc, /6 source\/effect blocks/);
  assert.match(doc, /39 receiver lines/);
  assert.match(doc, /1579 receiver bytes/);
  assert.match(doc, /893 helper lines/);
  assert.match(doc, /45226 helper bytes/);
  assert.match(doc, /158 helper signature\/input lines/);
  assert.match(doc, /6464 signature\/input bytes/);
  assert.match(doc, /358 identity-repair lines/);
  assert.match(doc, /19385 identity-repair bytes/);
  assert.match(doc, /352 existing\/write lines/);
  assert.match(doc, /18483 existing\/write bytes/);
  assert.match(doc, /28 commit\/return lines/);
  assert.match(doc, /894 commit\/return bytes/);
  assert.match(doc, /selected background addFilteredChannel token counts/);
  assert.match(doc, /selected sender\/list-forwarding token counts/);
  assert.match(doc, /11 runtime background addFilteredChannel list-target fixtures/);
  assert.match(doc, /forwards input, filter-all, collaborator metadata, profile, video id, and normalized list type/);
  assert.match(doc, /declares `listType = 'blocklist'`/);
  assert.match(doc, /caller-provided whitelist list type reaches the helper/);
  assert.match(doc, /Main blocklist writes V4 `main\.channels`/);
  assert.match(doc, /Main whitelist writes V4 `main\.whitelistChannels`/);
  assert.match(doc, /Kids blocklist and whitelist write their matching V4\/V3 lists/);
  assert.match(doc, /identity repair can read channel maps, fetch watch\/Shorts\/Kids identity/);
  assert.match(doc, /null both compiled caches/);
  assert.match(doc, /schedule list-target channel-add backups/);
  assert.match(doc, /No `backgroundAddFilteredChannelListTargetContract`, `backgroundAddFilteredChannelReceiverReport`, `backgroundAddFilteredChannelSenderPolicy`, `backgroundAddFilteredChannelListTypeForwardingPolicy`, `backgroundAddFilteredChannelProfileTargetReport`, `backgroundAddFilteredChannelStorageWriteReport`, `backgroundAddFilteredChannelCacheInvalidationReport`, `backgroundAddFilteredChannelBackupPolicy`, `backgroundAddFilteredChannelIdentityRepairBudget`, or `backgroundAddFilteredChannelFixtureProvenance` exists/);
});

test('objective coverage ledger records Filter All toggle list-target as row-action proof', () => {
  const doc = ledger();

  assert.match(doc, /Filter All toggle list-target addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_FILTER_ALL_TOGGLE_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/filter-all-toggle-list-target-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /per-channel Filter All mutation proof/);
  assert.match(doc, /3 Filter All toggle source files/);
  assert.match(doc, /5 source\/effect blocks/);
  assert.match(doc, /14 background receiver lines/);
  assert.match(doc, /413 receiver bytes/);
  assert.match(doc, /95 background helper lines/);
  assert.match(doc, /3435 helper bytes/);
  assert.match(doc, /66 content bridge checkbox lines/);
  assert.match(doc, /2391 checkbox bytes/);
  assert.match(doc, /34 StateManager Main toggle lines/);
  assert.match(doc, /988 Main toggle bytes/);
  assert.match(doc, /36 StateManager Kids toggle lines/);
  assert.match(doc, /1188 Kids toggle bytes/);
  assert.match(doc, /selected Filter All toggle token counts/);
  assert.match(doc, /selected zero whitelist\/sender token counts/);
  assert.match(doc, /10 runtime Filter All toggle fixtures/);
  assert.match(doc, /content bridge checkbox sends only `channelId` and `value`/);
  assert.match(doc, /forwards only `message\.channelId` and `message\.value`/);
  assert.match(doc, /schedules `filter_all_toggled` backup on success/);
  assert.match(doc, /background helper reads root `filterChannels`/);
  assert.match(doc, /finds exact id\/handle matches only there/);
  assert.match(doc, /writes root `filterChannels` plus active V4 `main\.channels`/);
  assert.match(doc, /does not update whitelist or Kids rows/);
  assert.match(doc, /invalidates both compiled caches/);
  assert.match(doc, /returns `Channel not found` for whitelist-only rows/);
  assert.match(doc, /StateManager Main and Kids UI toggles return `false` in whitelist mode/);
  assert.match(doc, /Kids UI toggles persist `kids\.blockedChannels`, refresh Kids, notify listeners, and schedule `kids_filter_all_toggled`/);
  assert.match(doc, /No `filterAllToggleListTargetContract`, `filterAllToggleReceiverReport`, `filterAllToggleSenderPolicy`, `filterAllToggleListTargetPolicy`, `filterAllToggleProfileTargetReport`, `filterAllToggleStorageWriteReport`, `filterAllToggleCacheInvalidationReport`, `filterAllToggleRowActionParityReport`, `filterAllToggleCommentScopeReport`, or `filterAllToggleFixtureProvenance` exists/);
});

test('objective coverage ledger records Main Filter All comments scope as comments proof', () => {
  const doc = ledger();

  assert.match(doc, /Main Filter All comments scope addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_MAIN_FILTER_ALL_COMMENTS_SCOPE_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/main-filter-all-comments-scope-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /Main comments-scope proof/);
  assert.match(doc, /5 Main Filter All comments scope source files/);
  assert.match(doc, /6 source\/effect blocks/);
  assert.match(doc, /45 StateManager comments toggle lines/);
  assert.match(doc, /1434 StateManager comments toggle bytes/);
  assert.match(doc, /64 RenderEngine keyword comments toggle lines/);
  assert.match(doc, /3192 keyword comments toggle bytes/);
  assert.match(doc, /16 RenderEngine channel-ref lookup lines/);
  assert.match(doc, /669 channel-ref lookup bytes/);
  assert.match(doc, /72 settings_shared syncFilterAllKeywords lines/);
  assert.match(doc, /2967 syncFilterAllKeywords bytes/);
  assert.match(doc, /82 background syncStoredMainKeywordsWithChannels lines/);
  assert.match(doc, /2534 background sync bytes/);
  assert.match(doc, /33 filter_logic comment decision lines/);
  assert.match(doc, /1902 comment decision bytes/);
  assert.match(doc, /selected Main Filter All comments token counts/);
  assert.match(doc, /10 runtime Main Filter All comments scope fixtures/);
  assert.match(doc, /default missing `filterAllComments` to `true`, then persist `false`/);
  assert.match(doc, /recompute saves a channel-derived keyword with `comments: false`/);
  assert.match(doc, /Main whitelist mode returns `false` without save, broadcast, channel update event, or backup/);
  assert.match(doc, /inactive `filterAll: false` rows can still persist latent `filterAllComments`/);
  assert.match(doc, /settings_shared carries `filterAllComments` into `comments` and drops stale channel-derived keywords/);
  assert.match(doc, /routes Main channel-derived comment toggles by `entry\.channelRef` through component, click, and keyboard paths/);
  assert.match(doc, /while suppressing Kids comment controls/);
  assert.match(doc, /mirrors the comments flag without explicit profile\/list-mode fields/);
  assert.match(doc, /JSON comment filtering consumes compiled comment keyword regexes without row provenance/);
  assert.match(doc, /No `mainFilterAllCommentsScopeContract`, `mainFilterAllCommentsToggleReport`, `mainFilterAllCommentsListModePolicy`, `mainFilterAllCommentsChannelRefPolicy`, `mainFilterAllCommentsCompilerParityReport`, `mainFilterAllCommentsJsonProvenanceReport`, `mainFilterAllCommentsInactiveFilterAllReport`, `mainFilterAllCommentsFixtureProvenance`, `mainFilterAllCommentsMetricArtifact`, or `mainFilterAllCommentsAuthorityGate` exists/);
});

test('objective coverage ledger records addFilteredChannel Filter All comments default as add-time comments proof', () => {
  const doc = ledger();

  assert.match(doc, /addFilteredChannel Filter All comments default addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_ADD_FILTERED_CHANNEL_FILTER_ALL_COMMENTS_DEFAULT_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/add-filtered-channel-filter-all-comments-default-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /add-time comments default proof/);
  assert.match(doc, /4 addFilteredChannel Filter All comments default source files/);
  assert.match(doc, /8 source\/effect blocks/);
  assert.match(doc, /54 content direct-add lines/);
  assert.match(doc, /2662 content direct-add bytes/);
  assert.match(doc, /39 background receiver lines/);
  assert.match(doc, /1579 receiver bytes/);
  assert.match(doc, /2 helper signature lines/);
  assert.match(doc, /204 helper signature bytes/);
  assert.match(doc, /21 existing-channel update lines/);
  assert.match(doc, /1247 existing-channel update bytes/);
  assert.match(doc, /20 new-channel object lines/);
  assert.match(doc, /1081 new-channel object bytes/);
  assert.match(doc, /106 background channel-derived helper\/sync lines/);
  assert.match(doc, /3482 helper\/sync bytes/);
  assert.match(doc, /12 StateManager enrichment message lines/);
  assert.match(doc, /460 enrichment message bytes/);
  assert.match(doc, /72 settings_shared syncFilterAllKeywords lines/);
  assert.match(doc, /2967 syncFilterAllKeywords bytes/);
  assert.match(doc, /selected addFilteredChannel Filter All comments token counts/);
  assert.match(doc, /selected zero comments-scope token counts/);
  assert.match(doc, /11 runtime addFilteredChannel Filter All comments default fixtures/);
  assert.match(doc, /content `addChannelDirectly\(\)` sends `filterAll` and no `filterAllComments`/);
  assert.match(doc, /YouTube Kids hostnames still omit `filterAllComments`/);
  assert.match(doc, /secondary background receiver drops caller-provided `filterAllComments`, forwards eight helper arguments/);
  assert.match(doc, /helper signature has no comments-scope parameter/);
  assert.match(doc, /new channel rows store `filterAll: filterAll` without `filterAllComments`/);
  assert.match(doc, /existing channel rows can enable `filterAll` while preserving any existing `filterAllComments`/);
  assert.match(doc, /compilers default missing `filterAllComments` to `comments: true` and preserve explicit `false`/);
  assert.match(doc, /StateManager enrichment sends `filterAll: false` with no comments-scope field/);
  assert.match(doc, /backups do not distinguish add-time comments defaults/);
  assert.match(doc, /JSON comment filtering later receives compiled comment regexes without add-time provenance/);
  assert.match(doc, /No `addFilteredChannelFilterAllCommentsContract`, `addFilteredChannelFilterAllCommentsPayloadPolicy`, `addFilteredChannelFilterAllCommentsReceiverReport`, `addFilteredChannelFilterAllCommentsDefaultPolicy`, `addFilteredChannelFilterAllCommentsCompilerReport`, `addFilteredChannelFilterAllCommentsExistingRowReport`, `addFilteredChannelFilterAllCommentsJsonProvenanceReport`, `addFilteredChannelFilterAllCommentsBackupPolicy`, `addFilteredChannelFilterAllCommentsFixtureProvenance`, or `addFilteredChannelFilterAllCommentsAuthorityGate` exists/);
});

test('objective coverage ledger records JSON comment keyword provenance as direct comments proof', () => {
  const doc = ledger();

  assert.match(doc, /JSON comment keyword provenance addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_KEYWORD_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-keyword-provenance-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct JSON comment provenance proof/);
  assert.match(doc, /3 JSON comment keyword provenance source files/);
  assert.match(doc, /8 source\/effect blocks/);
  assert.match(doc, /15 settings_shared compileKeywords lines/);
  assert.match(doc, /740 compileKeywords bytes/);
  assert.match(doc, /72 settings_shared syncFilterAllKeywords lines/);
  assert.match(doc, /2971 syncFilterAllKeywords bytes/);
  assert.match(doc, /2 buildCompiledSettings comments lines/);
  assert.match(doc, /170 buildCompiledSettings comments bytes/);
  assert.match(doc, /29 filter_logic processSettings regex lines/);
  assert.match(doc, /1445 processSettings regex bytes/);
  assert.match(doc, /95 filter_logic candidate metadata\/search lines/);
  assert.match(doc, /4931 candidate metadata\/search bytes/);
  assert.match(doc, /55 filter_logic global\/comment keyword branch lines/);
  assert.match(doc, /3070 global\/comment keyword branch bytes/);
  assert.match(doc, /7 background V4 comment compile lines/);
  assert.match(doc, /370 V4 comment compile bytes/);
  assert.match(doc, /35 background legacy comments fallback lines/);
  assert.match(doc, /1961 legacy comments fallback bytes/);
  assert.match(doc, /selected JSON comment keyword provenance token counts/);
  assert.match(doc, /10 runtime JSON comment keyword provenance fixtures/);
  assert.match(doc, /settings_shared keeps a `filterAllComments:false` channel-derived keyword in global `filterKeywords`/);
  assert.match(doc, /excludes that keyword from `filterKeywordsComments`/);
  assert.match(doc, /compiled keyword objects expose only `pattern` and `flags`/);
  assert.match(doc, /filter_logic reconstructs global `filterKeywords` and `whitelistKeywords` but not serialized `filterKeywordsComments`/);
  assert.match(doc, /comment text is included in JSON candidate metadata/);
  assert.match(doc, /global keyword branch runs before the comment-specific branch/);
  assert.match(doc, /comment mentioning a Filter All channel is removed by the global keyword branch even when that channel row has `filterAllComments:false`/);
  assert.match(doc, /same comment survives when the global keyword list is removed/);
  assert.match(doc, /serialized comments-only patterns are ignored while direct `RegExp` comment keywords still block/);
  assert.match(doc, /background V4\/legacy comment compilers also emit compiled regex entries without row provenance/);
  assert.match(doc, /No `jsonCommentKeywordProvenanceContract`, `jsonCommentKeywordGlobalPrecedenceReport`, `jsonCommentKeywordChannelScopePolicy`, `jsonCommentKeywordCompiledMetadataReport`, `jsonCommentKeywordSerializedReconstructionReport`, `jsonCommentKeywordDecisionOrderReport`, `jsonCommentKeywordFalseHideBudget`, `jsonCommentKeywordFixtureProvenance`, `jsonCommentKeywordMetricArtifact`, or `jsonCommentKeywordAuthorityGate` exists/);
});

test('objective coverage ledger records JSON comment author channel provenance as direct comments proof', () => {
  const doc = ledger();

  assert.match(doc, /JSON comment author channel provenance addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_AUTHOR_CHANNEL_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-author-channel-provenance-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct JSON comment author\/channel proof/);
  assert.match(doc, /3 JSON comment author channel provenance source files/);
  assert.match(doc, /8 source\/effect blocks/);
  assert.match(doc, /5 filter_logic comment renderer rules lines/);
  assert.match(doc, /229 comment renderer rules bytes/);
  assert.match(doc, /17 filterChannels normalization lines/);
  assert.match(doc, /1026 normalization bytes/);
  assert.match(doc, /45 shouldBlock setup lines/);
  assert.match(doc, /2191 setup bytes/);
  assert.match(doc, /105 whitelist comment bypass lines/);
  assert.match(doc, /5392 bypass bytes/);
  assert.match(doc, /17 global channel branch lines/);
  assert.match(doc, /1090 global channel bytes/);
  assert.match(doc, /34 comment branch author lines/);
  assert.match(doc, /1947 author branch bytes/);
  assert.match(doc, /82 settings_shared sanitizeChannelEntry lines/);
  assert.match(doc, /3619 sanitize bytes/);
  assert.match(doc, /40 background compiled channel object lines/);
  assert.match(doc, /2893 background object bytes/);
  assert.match(doc, /selected JSON comment author channel token counts/);
  assert.match(doc, /10 runtime JSON comment author channel provenance fixtures/);
  assert.match(doc, /`commentRenderer` maps author browse id and author text to channel identity/);
  assert.match(doc, /filter_logic preserves channel row fields during normalization/);
  assert.match(doc, /whitelist fail-closed branch skips comment renderers/);
  assert.match(doc, /global channel branch runs before comment-specific filtering/);
  assert.match(doc, /matching `filterChannels` row removes a comment author even when `filterAll:false` and `filterAllComments:false`/);
  assert.match(doc, /nonmatching row preserves the same comment/);
  assert.match(doc, /whitelist mode still removes the comment when a matching dormant blocklist row remains/);
  assert.match(doc, /empty whitelist without a blocklist row preserves the comment/);
  assert.match(doc, /whitelist channel row alone does not route the comment author through the whitelist allow branch/);
  assert.match(doc, /shared\/background compilers carry `filterAllComments` before filter_logic ignores it for author-channel comment decisions/);
  assert.match(doc, /No `jsonCommentAuthorChannelProvenanceContract`, `jsonCommentAuthorChannelFilterAllCommentsPolicy`, `jsonCommentAuthorChannelGlobalBranchReport`, `jsonCommentAuthorChannelWhitelistModeReport`, `jsonCommentAuthorChannelCompiledMetadataReport`, `jsonCommentAuthorChannelDecisionOrderReport`, `jsonCommentAuthorChannelFalseHideBudget`, `jsonCommentAuthorChannelFixtureProvenance`, `jsonCommentAuthorChannelMetricArtifact`, or `jsonCommentAuthorChannelAuthorityGate` exists/);
});

test('objective coverage ledger records JSON comment ViewModel parity as direct comments proof', () => {
  const doc = ledger();

  assert.match(doc, /JSON comment ViewModel parity addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_VIEW_MODEL_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-view-model-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /modern comment-shape parity proof/);
  assert.match(doc, /3 JSON comment ViewModel parity source files/);
  assert.match(doc, /9 source\/effect blocks/);
  assert.match(doc, /9 filter_logic comment rules lines/);
  assert.match(doc, /380 comment rules bytes/);
  assert.match(doc, /9 no-rule return lines/);
  assert.match(doc, /411 no-rule return bytes/);
  assert.match(doc, /34 comment decision lines/);
  assert.match(doc, /1947 comment decision bytes/);
  assert.match(doc, /10 seed active JSON rules lines/);
  assert.match(doc, /634 active JSON bytes/);
  assert.match(doc, /37 seed comment continuation shortcut lines/);
  assert.match(doc, /2266 continuation shortcut bytes/);
  assert.match(doc, /16 DOM fallback comments CSS lines/);
  assert.match(doc, /671 comments CSS bytes/);
  assert.match(doc, /12 DOM fallback comment setup lines/);
  assert.match(doc, /877 setup bytes/);
  assert.match(doc, /15 DOM fallback global hide lines/);
  assert.match(doc, /535 global hide bytes/);
  assert.match(doc, /99 DOM fallback ViewModel filtering lines/);
  assert.match(doc, /5312 ViewModel filtering bytes/);
  assert.match(doc, /selected JSON comment ViewModel parity token counts/);
  assert.match(doc, /10 runtime JSON comment ViewModel parity fixtures/);
  assert.match(doc, /direct JSON `commentViewModel` remains under `hideAllComments:true`/);
  assert.match(doc, /direct JSON `commentRenderer` is removed under the same setting/);
  assert.match(doc, /direct JSON `commentViewModel` remains under matching `filterKeywordsComments`/);
  assert.match(doc, /direct JSON `commentRenderer` is removed by the same comments-only keyword/);
  assert.match(doc, /direct JSON `commentViewModel` remains under matching global `filterKeywords`/);
  assert.match(doc, /`commentThreadRenderer` wrapping a modern ViewModel survives comment-keyword filtering/);
  assert.match(doc, /continuation response containing `commentViewModel` survives `hideAllComments:true`/);
  assert.match(doc, /continuation response containing `commentRenderer` loses that item under `hideAllComments:true`/);
  assert.match(doc, /source order keeps no-rule return before comment decisions/);
  assert.match(doc, /DOM fallback contains a ViewModel-specific path while JSON renderer rules and seed continuation shortcut do not/);
  assert.match(doc, /No `jsonCommentViewModelParityContract`, `jsonCommentViewModelRendererRuleReport`, `jsonCommentViewModelJsonDecisionReport`, `jsonCommentViewModelContinuationPolicy`, `jsonCommentViewModelDomParityReport`, `jsonCommentViewModelGlobalHidePolicy`, `jsonCommentViewModelKeywordPolicy`, `jsonCommentViewModelStructuralWrapperReport`, `jsonCommentViewModelFalseHideLeakBudget`, or `jsonCommentViewModelAuthorityGate` exists/);
});

test('objective coverage ledger records JSON comment structural wrapper cleanup as direct comments proof', () => {
  const doc = ledger();

  assert.match(doc, /JSON comment structural wrapper cleanup addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_STRUCTURAL_WRAPPER_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-structural-wrapper-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /structural cleanup proof/);
  assert.match(doc, /3 JSON comment structural wrapper cleanup source files/);
  assert.match(doc, /10 source\/effect blocks/);
  assert.match(doc, /10 filter_logic whitelist containers lines/);
  assert.match(doc, /267 whitelist container bytes/);
  assert.match(doc, /9 filter_logic comment rules lines/);
  assert.match(doc, /380 comment rules bytes/);
  assert.match(doc, /34 comment decision lines/);
  assert.match(doc, /1947 comment decision bytes/);
  assert.match(doc, /12 array recursion lines/);
  assert.match(doc, /404 array recursion bytes/);
  assert.match(doc, /11 object renderer removal lines/);
  assert.match(doc, /536 object removal bytes/);
  assert.match(doc, /9 recursive property copy lines/);
  assert.match(doc, /347 property copy bytes/);
  assert.match(doc, /5 seed engine catch lines/);
  assert.match(doc, /220 engine catch bytes/);
  assert.match(doc, /28 seed basic comment hide lines/);
  assert.match(doc, /1574 basic comment hide bytes/);
  assert.match(doc, /16 DOM fallback comments CSS lines/);
  assert.match(doc, /671 comments CSS bytes/);
  assert.match(doc, /15 DOM fallback global hide lines/);
  assert.match(doc, /535 global hide bytes/);
  assert.match(doc, /selected JSON comment structural cleanup token counts/);
  assert.match(doc, /11 runtime JSON comment structural wrapper cleanup fixtures/);
  assert.match(doc, /`hideAllComments:true` removes nested classic comments but leaves a top-level `itemSectionRenderer` comment section with empty `contents`/);
  assert.match(doc, /preserves a mixed `itemSectionRenderer` wrapper when a non-comment sibling remains/);
  assert.match(doc, /generic `itemSectionRenderer` wrapper also remains after nested comments are removed/);
  assert.match(doc, /direct comment-keyword filtering can remove a nested direct `commentRenderer` while leaving the parent section wrapper empty/);
  assert.match(doc, /`commentThreadRenderer` with raw comment fields survives comments-only keyword filtering/);
  assert.match(doc, /continuation action wrappers can remain with empty `continuationItems` after engine filtering removes direct comment renderer items/);
  assert.match(doc, /seed's engine-error fallback removes the whole watch-page comment section by splice while preserving a video sibling/);
  assert.match(doc, /source order keeps renderer-object removal before recursive property copy/);
  assert.match(doc, /DOM fallback has comment-section selectors and a global-hide branch without sharing JSON structural pruning/);
  assert.match(doc, /No `jsonCommentStructuralCleanupContract`, `jsonCommentStructuralWrapperDecisionReport`, `jsonCommentEmptyWrapperPruningPolicy`, `jsonCommentSectionSiblingPolicy`, `jsonCommentContinuationWrapperCleanupReport`, `jsonCommentSeedFallbackParityReport`, `jsonCommentDomStructuralParityReport`, `jsonCommentStructuralFalseHideLeakBudget`, `jsonCommentStructuralFixtureProvenance`, or `jsonCommentStructuralAuthorityGate` exists/);
});

test('objective coverage ledger records XHR comment continuation parity as direct transport proof', () => {
  const doc = ledger();

  assert.match(doc, /XHR comment continuation parity addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_XHR_COMMENT_CONTINUATION_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/xhr-comment-continuation-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct transport parity proof/);
  assert.match(doc, /2 XHR comment continuation parity source files/);
  assert.match(doc, /6 source\/effect blocks/);
  assert.match(doc, /86 seed fetch interception lines/);
  assert.match(doc, /4259 fetch interception bytes/);
  assert.match(doc, /38 seed fetch comment shortcut lines/);
  assert.match(doc, /2266 shortcut bytes/);
  assert.match(doc, /203 seed XHR interception lines/);
  assert.match(doc, /9654 XHR interception bytes/);
  assert.match(doc, /79 seed XHR processor lines/);
  assert.match(doc, /4187 XHR processor bytes/);
  assert.match(doc, /8 seed XHR endpoint lines/);
  assert.match(doc, /242 endpoint bytes/);
  assert.match(doc, /26 seed XHR send hook lines/);
  assert.match(doc, /1186 send hook bytes/);
  assert.match(doc, /selected fetch\/XHR shortcut token counts/);
  assert.match(doc, /8 runtime XHR comment continuation parity fixtures/);
  assert.match(doc, /fetch append comment continuation under `hideAllComments:true` bypasses the engine/);
  assert.match(doc, /returns one synthetic end marker with `continuationEndpoint:null`/);
  assert.match(doc, /XHR text and `responseType:"json"` append comment continuations call `processWithEngine\(\)`/);
  assert.match(doc, /leave empty continuation arrays instead of a synthetic end marker/);
  assert.match(doc, /XHR `commentViewModel` continuations survive `hideAllComments:true`/);
  assert.match(doc, /XHR reload, replace, and `onResponseReceivedActions` append payloads share the generic engine path/);
  assert.match(doc, /disabled XHR still marks and hooks the endpoint without response override/);
  assert.match(doc, /No `xhrCommentContinuationParityContract`, `xhrCommentContinuationDecisionReport`, `xhrCommentContinuationTransportParityReport`, `xhrCommentContinuationSyntheticEndPolicy`, `xhrCommentContinuationEngineBypassReport`, `xhrCommentContinuationBodyModeReport`, `xhrCommentContinuationViewModelParityReport`, `xhrCommentContinuationCommandParityReport`, `xhrCommentContinuationFixtureProvenance`, or `xhrCommentContinuationMetricArtifact` exists/);
});

test('objective coverage ledger records JSON comment entity payload provenance as direct entity proof', () => {
  const doc = ledger();

  assert.match(doc, /JSON comment entity payload provenance addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_ENTITY_PAYLOAD_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-entity-payload-provenance-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct entity payload proof/);
  assert.match(doc, /3 JSON comment entity payload provenance source\/fixture files/);
  assert.match(doc, /7 source\/effect blocks/);
  assert.match(doc, /9 filter_logic comment renderer rule lines/);
  assert.match(doc, /380 rule bytes/);
  assert.match(doc, /46 candidate metadata lines/);
  assert.match(doc, /2507 metadata bytes/);
  assert.match(doc, /34 comment decision lines/);
  assert.match(doc, /1947 decision bytes/);
  assert.match(doc, /11 object renderer removal lines/);
  assert.match(doc, /536 removal bytes/);
  assert.match(doc, /9 recursive property copy lines/);
  assert.match(doc, /347 copy bytes/);
  assert.match(doc, /38 seed fetch comment shortcut lines/);
  assert.match(doc, /2266 shortcut bytes/);
  assert.match(doc, /47 fixture entity payload lines/);
  assert.match(doc, /1834 fixture bytes/);
  assert.match(doc, /selected runtime JS zero-token counts for entity payload authority strings/);
  assert.match(doc, /selected fixture token counts/);
  assert.match(doc, /10 runtime JSON comment entity payload provenance fixtures/);
  assert.match(doc, /reduced fixture ties one visible `commentThreadRenderer` shell to one entity payload/);
  assert.match(doc, /matching `commentKey`, `entityKey`, and payload key values/);
  assert.match(doc, /product runtime JS lacks selected entity payload tokens/);
  assert.match(doc, /global and comments-only keywords matching only entity payload text leave the response unchanged/);
  assert.match(doc, /channel-id and handle filters matching only entity payload author fields leave the response unchanged/);
  assert.match(doc, /`hideAllComments:true` removes the visible continuation item while preserving entity payload text and author identity/);
  assert.match(doc, /`hideAllComments:true` plus the global entity keyword still preserves the entity payload/);
  assert.match(doc, /fetch shortcut bypasses the engine, writes a synthetic end marker, and preserves `frameworkUpdates`/);
  assert.match(doc, /No `jsonCommentEntityPayloadProvenanceContract`, `jsonCommentEntityPayloadDecisionReport`, `jsonCommentEntityPayloadRuleManifest`, `jsonCommentEntityTextExtractionPolicy`, `jsonCommentEntityAuthorExtractionPolicy`, `jsonCommentEntityJoinPolicy`, `jsonCommentEntityCleanupPolicy`, `jsonCommentEntityFetchShortcutPolicy`, `jsonCommentEntityFixtureProvenance`, or `jsonCommentEntityMetricArtifact` exists/);
});

test('objective coverage ledger records JSON comment continuation sibling preservation as direct mixed-continuation proof', () => {
  const doc = ledger();

  assert.match(doc, /JSON comment continuation sibling preservation addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_CONTINUATION_SIBLING_PRESERVATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-continuation-sibling-preservation-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct mixed-continuation proof/);
  assert.match(doc, /2 JSON comment continuation sibling preservation source files/);
  assert.match(doc, /6 source\/effect blocks/);
  assert.match(doc, /38 seed fetch comment shortcut lines/);
  assert.match(doc, /2266 shortcut bytes/);
  assert.match(doc, /7 seed fetch normal processing lines/);
  assert.match(doc, /417 normal-processing bytes/);
  assert.match(doc, /12 filter_logic array recursion lines/);
  assert.match(doc, /404 array recursion bytes/);
  assert.match(doc, /11 object renderer removal lines/);
  assert.match(doc, /536 removal bytes/);
  assert.match(doc, /9 recursive property copy lines/);
  assert.match(doc, /347 copy bytes/);
  assert.match(doc, /34 comment decision lines/);
  assert.match(doc, /1947 decision bytes/);
  assert.match(doc, /selected seed\/filter_logic token counts/);
  assert.match(doc, /fetch shortcut zero-token counts for header\/video sibling detection/);
  assert.match(doc, /8 runtime JSON comment continuation sibling preservation fixtures/);
  assert.match(doc, /engine filtering with `hideAllComments:true` removes a classic comment item from a mixed append continuation while preserving a header-like sibling/);
  assert.match(doc, /fetch shortcut with the same mixed append continuation bypasses the engine and returns only the synthetic continuation item/);
  assert.match(doc, /shortcut drops the header-like sibling, video sibling, and original continuation endpoint/);
  assert.match(doc, /shortcut preserves response metadata and spread fields outside `onResponseReceivedEndpoints`/);
  assert.match(doc, /fetch normal path with `hideAllComments:false` and a comments-only keyword removes the matching comment while preserving siblings/);
  assert.match(doc, /non-comment-only append continuation reaches normal engine processing/);
  assert.match(doc, /No `jsonCommentContinuationSiblingPreservationContract`, `jsonCommentContinuationSiblingDecisionReport`, `jsonCommentContinuationMixedCollectionPolicy`, `jsonCommentContinuationHeaderPreservationPolicy`, `jsonCommentContinuationVideoSiblingPolicy`, `jsonCommentContinuationEndpointPreservationPolicy`, `jsonCommentContinuationFetchReplacementReport`, `jsonCommentContinuationEngineParityReport`, `jsonCommentContinuationSiblingFixtureProvenance`, or `jsonCommentContinuationSiblingMetricArtifact` exists/);
});

test('objective coverage ledger records JSON comment continuation collection-root parity as direct root proof', () => {
  const doc = ledger();

  assert.match(doc, /JSON comment continuation collection-root parity addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_CONTINUATION_COLLECTION_ROOT_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-continuation-collection-root-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct collection-root proof/);
  assert.match(doc, /2 JSON comment continuation collection-root parity source files/);
  assert.match(doc, /5 source\/effect blocks/);
  assert.match(doc, /38 seed fetch comment shortcut lines/);
  assert.match(doc, /2266 shortcut bytes/);
  assert.match(doc, /7 seed fetch normal processing lines/);
  assert.match(doc, /417 normal-processing bytes/);
  assert.match(doc, /12 filter_logic array recursion lines/);
  assert.match(doc, /404 array recursion bytes/);
  assert.match(doc, /11 object renderer removal lines/);
  assert.match(doc, /536 removal bytes/);
  assert.match(doc, /34 comment decision lines/);
  assert.match(doc, /1947 decision bytes/);
  assert.match(doc, /fetch shortcut onResponseReceivedEndpoints tokens: 2/);
  assert.match(doc, /fetch shortcut onResponseReceivedActions tokens: 0/);
  assert.match(doc, /fetch shortcut onResponseReceivedCommands tokens: 0/);
  assert.match(doc, /fetch shortcut appendContinuationItemsAction tokens: 2/);
  assert.match(doc, /fetch shortcut processWithEngine tokens: 0/);
  assert.match(doc, /fetch normal processWithEngine tokens: 1/);
  assert.match(doc, /selected seed\/filter_logic onResponseReceivedCommands tokens: 1/);
  assert.match(doc, /selected seed\/filter_logic onResponseReceivedActions tokens: 2/);
  assert.match(doc, /selected seed\/filter_logic onResponseReceivedEndpoints tokens: 4/);
  assert.match(doc, /8 runtime JSON comment continuation collection-root parity fixtures/);
  assert.match(doc, /endpoint-root append comments trigger the fetch shortcut and bypass the engine/);
  assert.match(doc, /action-root append comments alone miss the shortcut and are removed by the normal engine path/);
  assert.match(doc, /command-root append comments alone miss the shortcut and are removed by the normal engine path/);
  assert.match(doc, /mixed endpoint\/action\/command roots with an endpoint-root comment trigger the shortcut and leave action-root and command-root comments unchanged/);
  assert.match(doc, /endpoint-root non-comment append items do not trigger the shortcut, so action-root and command-root comments reach engine cleanup/);
  assert.match(doc, /endpoint shortcut preserves non-endpoint roots and spread metadata/);
  assert.match(doc, /shortcut source has no `onResponseReceivedActions` or `onResponseReceivedCommands` branch/);
  assert.match(doc, /No `jsonCommentContinuationCollectionRootParityContract`, `jsonCommentContinuationCollectionRootDecisionReport`, `jsonCommentContinuationActionRootPolicy`, `jsonCommentContinuationCommandRootPolicy`, `jsonCommentContinuationRootPrecedencePolicy`, `jsonCommentContinuationCrossRootCleanupPolicy`, `jsonCommentContinuationMixedRootLeakBudget`, `jsonCommentContinuationRootEngineBypassReport`, `jsonCommentContinuationCollectionRootFixtureProvenance`, or `jsonCommentContinuationCollectionRootMetricArtifact` exists/);
});

test('objective coverage ledger records JSON comment continuation command-shape parity as direct command proof', () => {
  const doc = ledger();

  assert.match(doc, /JSON comment continuation command-shape parity addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_CONTINUATION_COMMAND_SHAPE_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-continuation-command-shape-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct command-shape proof/);
  assert.match(doc, /2 JSON comment continuation command-shape parity source files/);
  assert.match(doc, /5 source\/effect blocks/);
  assert.match(doc, /38 seed fetch comment shortcut lines/);
  assert.match(doc, /2266 shortcut bytes/);
  assert.match(doc, /7 seed fetch normal processing lines/);
  assert.match(doc, /417 normal-processing bytes/);
  assert.match(doc, /12 filter_logic array recursion lines/);
  assert.match(doc, /404 array recursion bytes/);
  assert.match(doc, /11 object renderer removal lines/);
  assert.match(doc, /536 removal bytes/);
  assert.match(doc, /34 comment decision lines/);
  assert.match(doc, /1947 decision bytes/);
  assert.match(doc, /fetch shortcut appendContinuationItemsAction tokens: 2/);
  assert.match(doc, /fetch shortcut reloadContinuationItemsCommand tokens: 0/);
  assert.match(doc, /fetch shortcut replaceContinuationItemsCommand tokens: 0/);
  assert.match(doc, /fetch shortcut processWithEngine tokens: 0/);
  assert.match(doc, /fetch normal processWithEngine tokens: 1/);
  assert.match(doc, /2 seed layout continuation-key rows with append\/reload\/replace/);
  assert.match(doc, /6 runtime JSON comment continuation command-shape parity fixtures/);
  assert.match(doc, /endpoint-root append classic comments trigger the fetch shortcut, bypass the engine, and return one synthetic append end marker/);
  assert.match(doc, /endpoint-root reload classic comments do not trigger the shortcut and are removed by the normal engine path/);
  assert.match(doc, /endpoint-root replace classic comments do not trigger the shortcut and are removed by the normal engine path/);
  assert.match(doc, /endpoint-root append non-comment items plus reload\/replace comments do not trigger the shortcut/);
  assert.match(doc, /endpoint-root append classic comments plus reload\/replace classic comments trigger the shortcut and drop reload\/replace entries through root replacement without engine decisions/);
  assert.match(doc, /endpoint-root append classic comments plus reload\/replace non-comment items trigger the shortcut and drop non-comment reload\/replace siblings before engine traversal/);
  assert.match(doc, /No `jsonCommentContinuationCommandShapeParityContract`, `jsonCommentContinuationCommandShapeDecisionReport`, `jsonCommentContinuationAppendCommandPolicy`, `jsonCommentContinuationReloadCommandPolicy`, `jsonCommentContinuationReplaceCommandPolicy`, `jsonCommentContinuationMixedCommandCleanupPolicy`, `jsonCommentContinuationNonCommentCommandSiblingPolicy`, `jsonCommentContinuationCommandEngineBypassReport`, `jsonCommentContinuationCommandFixtureProvenance`, or `jsonCommentContinuationCommandMetricArtifact` exists/);
});

test('objective coverage ledger records JSON comment continuation raw-URL admission as direct URL proof', () => {
  const doc = ledger();

  assert.match(doc, /JSON comment continuation raw-URL admission addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_CONTINUATION_RAW_URL_ADMISSION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-continuation-raw-url-admission-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct comment-continuation URL admission proof/);
  assert.match(doc, /1 JSON comment continuation raw-URL admission source file/);
  assert.match(doc, /4 source\/effect blocks/);
  assert.match(doc, /86 seed fetch interception lines/);
  assert.match(doc, /4259 interception bytes/);
  assert.match(doc, /8 seed fetch admission gate lines/);
  assert.match(doc, /355 admission bytes/);
  assert.match(doc, /38 seed fetch comment shortcut lines/);
  assert.match(doc, /2266 shortcut bytes/);
  assert.match(doc, /5 seed fetch catch fallback lines/);
  assert.match(doc, /247 catch bytes/);
  assert.match(doc, /1 fetch endpoint raw `urlStr\.includes` gate/);
  assert.match(doc, /1 fetch comment shortcut raw `url\.includes` gate/);
  assert.match(doc, /1 Request\.url extraction site/);
  assert.match(doc, /1 response clone JSON site/);
  assert.match(doc, /1 catch original-response return site/);
  assert.match(doc, /0 shortcut `processWithEngine` tokens/);
  assert.match(doc, /1 normal `processWithEngine` token/);
  assert.match(doc, /9 runtime JSON comment continuation raw-URL admission fixtures/);
  assert.match(doc, /exact string `\/youtubei\/v1\/next` returns one synthetic end marker/);
  assert.match(doc, /query-only raw next text on `\/watch`/);
  assert.match(doc, /hash-fragment raw next text on `\/watch`/);
  assert.match(doc, /longer-path `\/youtubei\/v1\/nextExtra`/);
  assert.match(doc, /cross-origin exact `\/youtubei\/v1\/next`/);
  assert.match(doc, /fetch `Request` object follows the string URL shortcut path/);
  assert.match(doc, /fetch `URL` object parses response JSON, skips `processWithEngine\(\)`, skips response rebuild, and returns the original comment body/);
  assert.match(doc, /query-only raw endpoint text with `hideAllComments:false` still reaches normal processing with data label `fetch:\/watch`/);
  assert.match(doc, /nonmatching raw URL avoids clone, parse, process, stringify, and shortcut work/);
  assert.match(doc, /No `jsonCommentContinuationRawUrlAdmissionContract`, `jsonCommentContinuationParsedEndpointDecision`, `jsonCommentContinuationRawUrlDecisionReport`, `jsonCommentContinuationQueryEndpointPolicy`, `jsonCommentContinuationHashEndpointPolicy`, `jsonCommentContinuationLongerPathPolicy`, `jsonCommentContinuationCrossOriginPolicy`, `jsonCommentContinuationUrlObjectPolicy`, `jsonCommentContinuationRawUrlFixtureProvenance`, or `jsonCommentContinuationRawUrlMetricArtifact` exists/);
});

test('objective coverage ledger records Kids latest JSON owner-extension fixture as direct Kids JSON proof', () => {
  const doc = ledger();

  assert.match(doc, /Kids latest JSON owner-extension fixture addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_KIDS_LATEST_JSON_OWNER_EXTENSION_FIXTURE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/kids-latest-json-owner-extension-fixture-boundary-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/kids-latest-compact-video-owner-extension.json'));
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct Kids JSON owner-extension proof/);
  assert.match(doc, /raw capture, YouTube Kids JSON, filter-logic-js, JSON path, settings-mode, blocklist\/list-mode, whitelist\/list-mode, identity, video-map side-effect/);
  assert.match(doc, /3 source\/fixture files/);
  assert.match(doc, /60 `compactVideoRenderer`/);
  assert.match(doc, /60 `kidsVideoOwnerExtension`/);
  assert.match(doc, /60 `externalChannelId`/);
  assert.match(doc, /60 `KIDS_BLOCK`/);
  assert.match(doc, /36 base video rules lines/);
  assert.match(doc, /1575 base video rules bytes/);
  assert.match(doc, /9 shared video renderer mapping lines/);
  assert.match(doc, /415 shared mapping bytes/);
  assert.match(doc, /55 harvest renderer mapping lines/);
  assert.match(doc, /2535 harvest mapping bytes/);
  assert.match(doc, /36 harvest Kids owner lines/);
  assert.match(doc, /1887 harvest Kids owner bytes/);
  assert.match(doc, /17 video channel map registration lines/);
  assert.match(doc, /636 registration bytes/);
  assert.match(doc, /13 video map fallback decision lines/);
  assert.match(doc, /556 fallback bytes/);
  assert.match(doc, /`kidsVideoOwnerExtension`: 2/);
  assert.match(doc, /`compactVideoRenderer`: 9/);
  assert.match(doc, /`videoChannelMap`: 8/);
  assert.match(doc, /`FilterTube_UpdateVideoChannelMap`: 1/);
  assert.match(doc, /6 runtime Kids latest owner extension fixtures/);
  assert.match(doc, /reduced fixture for `yt_kids_latest\.json` carries two adjacent Kids `compactVideoRenderer` siblings/);
  assert.match(doc, /matching blocklist owner removes the first and preserves the nonmatching sibling/);
  assert.match(doc, /stripped byline endpoints still block through `kidsVideoOwnerExtension` harvest into `videoChannelMap` fallback in the same pass/);
  assert.match(doc, /whitelist mode preserves the matching owner and removes the nonmatching sibling/);
  assert.match(doc, /queues `FilterTube_UpdateVideoChannelMap` for both videos/);
  assert.ok(doc.includes('yt_kids_latest.json` to partial-extracted'));
  assert.ok(doc.includes('ytkids_browse?alt=json.json` remains unextracted/malformed direct JSON'));
  assert.match(doc, /No `kidsLatestJsonOwnerExtensionFixtureContract`, `kidsLatestCompactVideoOwnerDecisionReport`, `kidsLatestOwnerExtensionHarvestReport`, `kidsLatestSiblingPreservationFixture`, `kidsLatestWhitelistDecisionPolicy`, `kidsLatestRawCaptureProvenance`, `kidsLatestVideoChannelMapSideEffectReport`, `kidsLatestNativeParityReport`, `kidsLatestMetricArtifact`, or `kidsLatestJsonFirstAuthorityGate` exists/);
});

test('objective coverage ledger records Kids browse malformed fragment as direct Kids JSON proof', () => {
  const doc = ledger();

  assert.match(doc, /Kids browse malformed fragment addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_KIDS_BROWSE_MALFORMED_FRAGMENT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/kids-browse-malformed-fragment-boundary-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/kids-browse-malformed-fragment-compact-video.json'));
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct malformed Kids browse fragment proof/);
  assert.match(doc, /raw capture, malformed direct-JSON container, YouTube Kids JSON, filter-logic-js, JSON path, settings-mode, blocklist\/list-mode, whitelist\/list-mode, owner rail/);
  assert.match(doc, /3 source\/fixture files/);
  assert.match(doc, /direct raw JSON parse failure/);
  assert.match(doc, /5 balanced top-level JSON fragments/);
  assert.match(doc, /browse fragment index 4 at line 688 with 423123 bytes/);
  assert.match(doc, /40 `compactVideoRenderer`/);
  assert.match(doc, /40 `kidsVideoOwnerExtension`/);
  assert.match(doc, /40 `externalChannelId`/);
  assert.match(doc, /40 `KIDS_BLOCK`/);
  assert.match(doc, /5 `kidsSlimOwnerRenderer`/);
  assert.match(doc, /`kidsSlimOwnerRenderer`: 0/);
  assert.match(doc, /`kidsLibraryRenderer`: 0/);
  assert.match(doc, /7 runtime Kids browse malformed fragment fixtures/);
  assert.match(doc, /whole raw capture fails direct `JSON\.parse\(\)`/);
  assert.match(doc, /matching blocklist owner removes the matching compact video while owner rail entries remain visible/);
  assert.match(doc, /whitelist mode preserves the matching compact video and removes the nonmatching compact sibling while owner rail entries remain visible/);
  assert.match(doc, /moves `ytkids_browse\?alt=json\.json` to partial-extracted while preserving the malformed direct-JSON warning/);
  assert.match(doc, /No `kidsBrowseMalformedFragmentContract`, `kidsBrowseRawContainerAdmissionReport`, `kidsBrowseFragmentExtractionPolicy`, `kidsBrowseCompactVideoDecisionReport`, `kidsBrowseOwnerRailDecisionReport`, `kidsBrowseOwnerRailWhitelistPolicy`, `kidsBrowseVideoMapSideEffectReport`, `kidsBrowseNativeWebViewParityReport`, `kidsBrowseMetricArtifact`, or `kidsBrowseJsonFirstAuthorityGate` exists/);
});

test('objective coverage ledger records Main watch get-watch fixture as direct watch JSON proof', () => {
  const doc = ledger();

  assert.match(doc, /Main watch get-watch playlist\/end-screen addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_MAIN_WATCH_GET_WATCH_PLAYLIST_END_SCREEN_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/main-watch-get-watch-playlist-end-screen-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/main-watch-get-watch-playlist-end-screen.json'));
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct get-watch fixture proof/);
  assert.match(doc, /raw capture, Main watch\/next JSON, filter-logic-js, JSON path, settings-mode, blocklist\/list-mode, whitelist\/list-mode, playlist-panel, end-screen/);
  assert.match(doc, /3 source\/fixture files/);
  assert.match(doc, /`get_watch\?prettyPrint=false\.json` as a valid direct JSON array/);
  assert.match(doc, /`watchpage\.json` as a Markdown\/`var ytInitialData` container warning/);
  assert.match(doc, /25 traversed `playlistPanelVideoRenderer` rows/);
  assert.match(doc, /8 traversed `endScreenVideoRenderer` rows/);
  assert.match(doc, /0 `compactAutoplayRenderer` rows/);
  assert.match(doc, /9 runtime Main watch get-watch fixtures/);
  assert.match(doc, /no-rule processing passes through two playlist-panel siblings and two end-screen siblings unchanged/);
  assert.match(doc, /blocklist mode removes matching playlist\/end-screen rows while preserving nonmatching siblings/);
  assert.match(doc, /whitelist mode is global across the reduced response/);
  assert.match(doc, /moves `get_watch\?prettyPrint=false\.json` to partial-extracted while `watchpage\.json` remains a separate embedded-container obligation/);
  assert.match(doc, /No `mainWatchGetWatchPlaylistEndScreenContract`, `mainWatchGetWatchFixtureAdmissionReport`, `mainWatchPlaylistPanelDecisionReport`, `mainWatchEndScreenDecisionReport`, `mainWatchWhitelistFamilyScopePolicy`, `mainWatchVideoMapSideEffectReport`, `mainWatchRawShapeClassifier`, `mainWatchCompactAutoplayFixtureGate`, `mainWatchDomWallParityReport`, or `mainWatchJsonFirstOptimizationBudget` exists/);
});

test('objective coverage ledger records Main upnext watchpage3 fixture as endpoint proof', () => {
  const doc = ledger();

  assert.match(doc, /Main upnext feed watchpage3 autoplay previous\/end-screen addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_MAIN_UPNEXT_FEED_WATCHPAGE3_AUTOPLAY_PREVIOUS_END_SCREEN_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/main-upnext-feed-watchpage3-autoplay-previous-end-screen-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/main-upnext-feed-watchpage3-autoplay-previous-end-screen.json'));
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /unextracted watch\/next evidence to partial extracted endpoint proof/);
  assert.match(doc, /embedded `ytInitialData` admission, Main watch JSON path, autoplay endpoint, previous-button endpoint, player-overlay end-screen/);
  assert.match(doc, /3 source\/fixture files/);
  assert.match(doc, /56516 raw source lines/);
  assert.match(doc, /6000015 raw source bytes/);
  assert.match(doc, /assignment span `23\.\.5942993`/);
  assert.match(doc, /5945215 embedded bytes/);
  assert.match(doc, /2 raw `previousButtonVideo` tokens/);
  assert.match(doc, /zero raw `compactAutoplayRenderer` tokens/);
  assert.match(doc, /29 raw `playlistPanelVideoRenderer` tokens/);
  assert.match(doc, /12 raw `endScreenVideoRenderer` tokens/);
  assert.match(doc, /28 parsed playlist-panel keys/);
  assert.match(doc, /11 parsed end-screen keys/);
  assert.match(doc, /12 runtime watchpage3 fixtures/);
  assert.match(doc, /endpoint-only autoplay\/next\/previous objects queue no map side effects/);
  assert.match(doc, /whitelist nonmatch removes all supported rows while endpoint watch controls remain/);
  assert.match(doc, /No `mainUpnextWatchpage3YtInitialDataContract`, `mainUpnextWatchpage3PreviousEndpointPolicy`, `mainUpnextWatchpage3PlayerOverlayEndScreenParityReport`, `mainUpnextWatchpage3WhitelistEndpointDecisionReport`, `mainUpnextWatchpage3RawShapeExtractor`, `mainUpnextWatchpage3EndpointSideEffectReport`, or `mainUpnextWatchpage3JsonFirstOptimizationBudget` exists/);
});

test('objective coverage ledger records Main upnext watchpage lockup continuation fixture as late watch proof', () => {
  const doc = ledger();

  assert.match(doc, /Main upnext feed watchpage lockup continuation addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_MAIN_UPNEXT_FEED_WATCHPAGE_LOCKUP_CONTINUATION_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/main-upnext-feed-watchpage-lockup-continuation-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/main-upnext-feed-watchpage-lockup-continuation.json'));
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /unextracted watch\/next evidence to partial extracted late watch lockup proof/);
  assert.match(doc, /balanced fragment admission, watch-next-feed continuation, lockupViewModel/);
  assert.match(doc, /3 source\/fixture files/);
  assert.match(doc, /raw direct JSON parse ok: false/);
  assert.match(doc, /19918 raw source lines/);
  assert.match(doc, /852491 raw source bytes/);
  assert.match(doc, /watch-next fragment start line 139/);
  assert.match(doc, /840530 watch-next fragment bytes/);
  assert.match(doc, /parsed continuation targetId `watch-next-feed`/);
  assert.match(doc, /20 parsed `lockupViewModel` keys/);
  assert.match(doc, /zero parsed `compactAutoplayRenderer`, `endScreenVideoRenderer`, and `playlistPanelVideoRenderer` keys/);
  assert.match(doc, /7 runtime watchpage lockup continuation fixtures/);
  assert.match(doc, /no-rule processing preserves the video lockup and Mix playlist sibling/);
  assert.match(doc, /Mix display metadata is keyword-searchable but not creator-channel identity/);
  assert.match(doc, /whitelist channel allow preserves the matching video lockup and removes the unresolved Mix sibling/);
  assert.match(doc, /moves `YT_MAIN_UPNEXT_FEED_WATCHPAGE\.json` to partial-extracted/);
  assert.match(doc, /No `mainUpnextWatchpageLockupContinuationContract`, `mainUpnextWatchpageLockupDecisionReport`, `mainUpnextWatchpageTargetIdPolicy`, `mainUpnextWatchpageMixIdentityPolicy`, `mainUpnextWatchpageMapSideEffectReport`, `mainUpnextWatchpageSiblingPreservationFixture`, `mainUpnextWatchpageMetricArtifact`, or `mainUpnextWatchpageJsonFirstGate` exists/);
});

test('objective coverage ledger records Main upnext watchpage2 claim-prefaced fixture as lockup proof', () => {
  const doc = ledger();

  assert.match(doc, /Main upnext feed watchpage2 claim-prefaced lockup continuation addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_MAIN_UPNEXT_FEED_WATCHPAGE2_CLAIM_PREFACED_LOCKUP_CONTINUATION_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation.json'));
  assert.match(doc, /claim-prefaced raw admission, watch-next-feed continuation, lockupViewModel, collaborator claim boundary/);
  assert.match(doc, /unextracted watch\/next evidence to partial extracted claim-prefaced watch lockup proof/);
  assert.match(doc, /20079 raw source lines/);
  assert.match(doc, /863854 raw source bytes/);
  assert.match(doc, /fragment start line 63/);
  assert.match(doc, /857711 fragment bytes/);
  assert.match(doc, /20 parsed `lockupViewModel` keys/);
  assert.match(doc, /3 parsed `shortsLockupViewModel` keys/);
  assert.match(doc, /zero parsed `compactAutoplayRenderer`, `autoplayVideo`, `nextButtonVideo`, `previousButtonVideo`, `endScreenVideoRenderer`, `playlistPanelVideoRenderer`, `showDialogCommand`, `coAuthors`, `ownerText`, `bylineText`, and `avatarStackViewModel` keys/);
  assert.match(doc, /raw collaborator prose tokens `showDialogCommand=1`, `coAuthors=2`, `ownerText=1`, `bylineText=1`/);
  assert.match(doc, /8 runtime watchpage2 fixtures/);
  assert.match(doc, /no-rule processing preserves two video lockups and queues two channel-map messages plus one video-map payload/);
  assert.match(doc, /whitelist channel allow preserves only the matching row/);
  assert.match(doc, /moves `YT_MAIN_UPNEXT_FEED_WATCHPAGE2\.json` to partial-extracted/);
  assert.match(doc, /No `mainUpnextWatchpage2ClaimPrefacedContract`, `mainUpnextWatchpage2RawClaimClassifier`, `mainUpnextWatchpage2LockupDecisionReport`, `mainUpnextWatchpage2CollaboratorClaimPolicy`, `mainUpnextWatchpage2TargetIdPolicy`, `mainUpnextWatchpage2MapSideEffectReport`, `mainUpnextWatchpage2SiblingPreservationFixture`, or `mainUpnextWatchpage2JsonFirstGate` exists/);
});

test('objective coverage ledger records Main search universal watch-card fixture as wrapper proof', () => {
  const doc = ledger();

  assert.match(doc, /Main search universal watch-card addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_MAIN_SEARCH_UNIVERSAL_WATCH_CARD_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/main-search-universal-watch-card-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/main-search-universal-watch-card-renderer.json'));
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct universal-wrapper fixture proof/);
  assert.match(doc, /raw capture, Main search JSON, escaped `ytInitialData` admission, filter-logic-js, JSON path, settings-mode, blocklist\/list-mode, whitelist\/list-mode, watch-card wrapper/);
  assert.match(doc, /3 source\/fixture files/);
  assert.match(doc, /`strange_ytInitialData\.json` as a non-direct-JSON `var ytInitialData` string literal/);
  assert.match(doc, /2 `universalWatchCardRenderer`/);
  assert.match(doc, /2 `watchCardRichHeaderRenderer`/);
  assert.match(doc, /2 `watchCardHeroVideoRenderer`/);
  assert.match(doc, /21 `searchRefinementCardRenderer`/);
  assert.match(doc, /2 `compactChannelRenderer`/);
  assert.match(doc, /121-line reduced fixture/);
  assert.match(doc, /6 runtime Main search universal watch-card fixtures/);
  assert.match(doc, /no-rule processing passes the hero card through unchanged with no map side effects/);
  assert.match(doc, /blocklist keyword or channel identity removes the wrapper/);
  assert.match(doc, /whitelist mode preserves a matching channel and removes a nonmatching one/);
  assert.match(doc, /raw hero video ID sits under `navigationEndpoint\.watchEndpoint`/);
  assert.match(doc, /No `mainSearchUniversalWatchCardContract`, `mainSearchUniversalWatchCardFixtureAdmissionReport`, `mainSearchUniversalWatchCardDecisionReport`, `mainSearchUniversalWatchCardWhitelistPolicy`, `mainSearchUniversalWatchCardHeroVideoPathPolicy`, `mainSearchDirectWatchCardChildRendererPolicy`, `mainSearchEscapedYtInitialDataAdmissionReport`, `mainSearchWatchCardSiblingLeakReport`, `mainSearchWatchCardMetricArtifact`, or `mainSearchWatchCardJsonFirstOptimizationBudget` exists/);
  assert.match(doc, /2026-05-30 watch recommendation topology linkage/);
  assert.match(doc, /supported `compactVideoRenderer`, `watchCardCompactVideoRenderer`, `endScreenVideoRenderer`, `lockupViewModel`, and universal watch-card title\/channel wrapper rows/);
  assert.match(doc, /unsupported direct watch-card child rows, `compactAutoplayRenderer`, or the universal hero `navigationEndpoint\.watchEndpoint\.videoId` path/);
  assert.match(doc, /`watchRecommendationRendererAuthority` remains missing/);
  assert.match(doc, /JSON-first promotion, whitelist optimization, DOM fallback pruning, recommendation side-effect pruning, release\/public-claim use, and broad-audit completion remain `NO-GO`/);
});

test('objective coverage ledger records Main search compact channel fixture as split-authority proof', () => {
  const doc = ledger();

  assert.match(doc, /Main search compact channel addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_MAIN_SEARCH_COMPACT_CHANNEL_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/main-search-compact-channel-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/main-search-compact-channel-renderer.json'));
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct compact-channel fixture proof/);
  assert.match(doc, /raw capture, Main search JSON, escaped `ytInitialData` admission, filter-logic-js, JSON path, settings-mode, blocklist\/list-mode, whitelist\/list-mode, compact channel renderer, channel-map side effect/);
  assert.match(doc, /3 source\/fixture files/);
  assert.match(doc, /`strange_ytInitialData\.json` as a non-direct-JSON `var ytInitialData` string literal/);
  assert.match(doc, /2 `compactChannelRenderer`/);
  assert.match(doc, /21 `searchRefinementCardRenderer`/);
  assert.match(doc, /2 `universalWatchCardRenderer`/);
  assert.match(doc, /90-line reduced fixture/);
  assert.match(doc, /7 runtime Main search compact channel fixtures/);
  assert.match(doc, /no-rule processing passes the channel card through unchanged while queuing one `FilterTube_UpdateChannelMap` side effect/);
  assert.match(doc, /blocklist keyword and channel rules pass through the captured channel card/);
  assert.match(doc, /whitelist mode preserves the channel card both when the channel matches and when it does not match/);
  assert.match(doc, /matching channel rule removes the supported universal watch-card sibling while leaving the compact channel row visible/);
  assert.match(doc, /`compactChannelRenderer` remains absent from direct `FILTER_RULES`/);
  assert.match(doc, /No `mainSearchCompactChannelContract`, `mainSearchCompactChannelFixtureAdmissionReport`, `mainSearchCompactChannelDecisionReport`, `mainSearchCompactChannelWhitelistPolicy`, `mainSearchCompactChannelSideEffectReport`, `mainSearchCompactChannelSiblingLeakReport`, `mainSearchCompactChannelEscapedYtInitialDataAdmissionReport`, `mainSearchCompactChannelMetricArtifact`, or `mainSearchCompactChannelJsonFirstOptimizationBudget` exists/);
});

test('objective coverage ledger records DOMs.html classification as mixed-DOM proof', () => {
  const doc = ledger();

  assert.match(doc, /DOMs\.html mutated Main DOM classification addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_DOMS_HTML_MUTATED_MAIN_DOM_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/doms-html-mutated-main-dom-classification-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/main-doms-mutated-main-dom.html'));
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct mixed-DOM classification proof/);
  assert.match(doc, /raw capture, Main DOM selector, quick-block, fallback menu, captured mutation state, post\/community absence/);
  assert.match(doc, /3 source\/fixture files/);
  assert.match(doc, /raw `DOMs\.html` sha256 `1e36cfc6bdf9272f1febe54445646ea26c482d4346114727a363cee8cf042c5e`/);
  assert.match(doc, /6759 raw lines/);
  assert.match(doc, /11 pinned raw headings/);
  assert.match(doc, /10 FilterTube mutation markers/);
  assert.match(doc, /8 absent post\/community tokens/);
  assert.match(doc, /reduced mixed-Main DOM fixture/);
  assert.match(doc, /5 runtime DOMs\.html classification fixtures/);
  assert.match(doc, /raw `DOMs\.html` is already mutated by FilterTube quick-block\/fallback-menu and processed\/card identity markers/);
  assert.match(doc, /spans Main home\/search\/watch\/playlist\/Shorts\/Mix\/collaboration DOM headings/);
  assert.match(doc, /lacks clean post\/community selectors, native post header\/action-menu, and `\/post\/\.\.\.` permalink proof/);
  assert.match(doc, /raw extraction index moves `DOMs\.html` to partial-extracted while leaving Main post\/community insertion proof open/);
  assert.match(doc, /No `domsHtmlCaptureClassification`, `rawDomMutationStateReport`, `postCommunityFixtureReadinessReport`, `mainPostMenuInsertionFixture`, `mainPostSiblingVisibilityFixture`, or `mainDomMutatedCapturePolicy` exists/);
});

test('objective coverage ledger records watchpage embedded postRenderer proof', () => {
  const doc = ledger();

  assert.match(doc, /Watchpage embedded postRenderer addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_WATCHPAGE_EMBEDDED_POST_RENDERER_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/watchpage-embedded-post-renderer-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/main-watchpage-embedded-post-renderer.json'));
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /direct embedded postRenderer proof/);
  assert.match(doc, /raw capture, modern post JSON, JSON path, settings-mode, blocklist\/list-mode, whitelist\/list-mode, channel-map side effect, watch\/feed route classification/);
  assert.match(doc, /3 source\/fixture files/);
  assert.match(doc, /raw `watchpage\.json` sha256 `baf8a78adbbc5509c3ab50e4a26131ba294293771b89666498f34324cbd82ab3`/);
  assert.match(doc, /32116 raw lines/);
  assert.match(doc, /4572676 raw bytes/);
  assert.match(doc, /Markdown plus `var ytInitialData` container/);
  assert.match(doc, /embedded object span `10468\.\.4572046`/);
  assert.match(doc, /4561578 embedded bytes/);
  assert.match(doc, /2 parsed `postRenderer` keys/);
  assert.match(doc, /24 `lockupViewModel` keys/);
  assert.match(doc, /18 `shortsLockupViewModel` keys/);
  assert.match(doc, /3 raw text `postRenderer` tokens/);
  assert.match(doc, /8 runtime watchpage embedded postRenderer fixtures/);
  assert.match(doc, /direct raw JSON parsing throws/);
  assert.match(doc, /twoColumnBrowseResultsRenderer` rich-grid content with `FEwhat_to_watch` values rather than `twoColumnWatchNextResults/);
  assert.match(doc, /blocklist keyword and channel rules leave both posts visible/);
  assert.match(doc, /whitelist matching and nonmatching modes leave both posts visible/);
  assert.match(doc, /queues two `FilterTube_UpdateChannelMap` messages/);
  assert.match(doc, /supported `backstagePostRenderer` sibling can be filtered while the captured modern `postRenderer` row remains visible/);
  assert.match(doc, /No `watchpageEmbeddedPostRendererContract`, `watchpageEmbeddedPostRendererFixtureAdmissionReport`, `watchpagePostRendererDecisionReport`, `watchpagePostRendererWhitelistPolicy`, `watchpagePostRendererRouteClassificationPolicy`, `watchpagePostRendererSideEffectReport`, `watchpagePostRendererSiblingFixture`, `watchpagePostRendererDomInsertionFixture`, `watchpagePostRendererNoRuleBudget`, or `watchpagePostRendererJsonFirstAuthorityGate` exists/);
});

test('objective coverage ledger records YTM browse channel-list proof', () => {
  const doc = ledger();

  assert.match(doc, /YTM browse channelListItemRenderer addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_YTM_BROWSE_CHANNEL_LIST_ITEM_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/ytm-browse-channel-list-item-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/ytm-browse-channel-list-item-renderer.json'));
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /raw capture extraction, YouTube Music browse JSON, channel-list renderer paths/);
  assert.match(doc, /3 source\/fixture files/);
  assert.match(doc, /raw `ytm_browse\?prettyPrint=false\.json` sha256 `4444c7dcb6b6a884846a19169bed286f1019cd7275a6d1292392b1c1de95bdf8`/);
  assert.match(doc, /52334 raw lines/);
  assert.match(doc, /3005515 raw bytes/);
  assert.match(doc, /direct JSON object shape/);
  assert.match(doc, /route `browse FEchannels`/);
  assert.match(doc, /983 parsed `channelListItemRenderer` rows/);
  assert.match(doc, /984 raw `channelListItemRenderer` tokens/);
  assert.match(doc, /984 parsed `browseEndpoint` keys/);
  assert.match(doc, /one shelf\/vertical-list root/);
  assert.match(doc, /160-line reduced fixture/);
  assert.match(doc, /8 runtime YTM browse channel-list fixtures/);
  assert.match(doc, /no-rule processing preserves both YTM browse channel-list rows while queuing two `FilterTube_UpdateChannelMap` messages/);
  assert.match(doc, /matching keyword and channel blocklist rules still preserve the rows/);
  assert.match(doc, /whitelist matching and nonmatching modes also preserve the rows/);
  assert.match(doc, /`channelListItemRenderer` remains absent from direct `FILTER_RULES` while map harvest remains possible/);
  assert.match(doc, /No `ytmBrowseChannelListItemContract`, `ytmBrowseChannelListItemDecisionReport`, `ytmBrowseChannelListItemWhitelistPolicy`, `ytmBrowseChannelListItemSideEffectBudget`, `ytmBrowseChannelListItemSiblingPreservationFixture`, `ytmBrowseChannelListItemRoutePolicy`, `ytmBrowseChannelListItemMetricArtifact`, or `ytmBrowseChannelListItemJsonFirstGate` exists/);
});

test('objective coverage ledger records YTM watch-player DOM proof', () => {
  const doc = ledger();

  assert.match(doc, /YTM watch\/player DOM addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_DOM_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/ytm-watch-player-dom-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/ytm-watch-player-dom.html'));
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /raw capture extraction, YouTube Music watch\/player DOM, DOM selector, selected playlist-row policy/);
  assert.match(doc, /3 source\/fixture files/);
  assert.match(doc, /raw `YTM-WATCH PLAYER\.html` sha256 `d0600cc4b7bb5684b532f825d689d32a5c7b24b37c6da6477d0f4dc637303ea3`/);
  assert.match(doc, /16412 raw logical lines/);
  assert.match(doc, /16411 raw newline count/);
  assert.match(doc, /2279232 raw bytes/);
  assert.match(doc, /rendered mobile watch\/player DOM after FilterTube mutation/);
  assert.match(doc, /2 `html5-video-player` tokens/);
  assert.match(doc, /4 `movie_player` tokens/);
  assert.match(doc, /1 `ytm-watch-player-controls` token/);
  assert.match(doc, /25 `ytm-playlist-panel-video-renderer` rows/);
  assert.match(doc, /30 `ytm-video-with-context-renderer` rows/);
  assert.match(doc, /70 quick-block buttons/);
  assert.match(doc, /one 175-line reduced fixture/);
  assert.match(doc, /preserves `#movie_player`, `ytm-watch-player-controls`, one hidden related row, one selected hidden playlist row/);
  assert.match(doc, /confirmed block markers, and channel id `UCfg5XmOVjJ4yoeE0XkqmGAQ`/);
  assert.match(doc, /broad `ytm-playlist-panel-renderer` CSS/);
  assert.match(doc, /selected-row skip\/click logic/);
  assert.match(doc, /No `ytmWatchPlayerDomContract`, `ytmWatchPlayerSelectedRowDecisionReport`, `ytmWatchPlayerSiblingPreservationFixture`, `ytmWatchPlayerWhitelistModeReport`, `ytmWatchPlayerNoPlaybackSideEffectReport`, `ytmWatchPlayerObserverBudget`, `ytmWatchPlayerJsonDomParityReport`, or `ytmWatchPlayerJsonFirstGate` exists/);
});

test('objective coverage ledger records YTM selected-current-row side-effect boundary proof', () => {
  const doc = ledger();

  assert.match(doc, /YTM selected\/current-row side-effect boundary addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_SELECTED_ROW_SIDE_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/ytm-watch-player-selected-row-side-effect-boundary-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/ytm-watch-player-dom.html'));
  assert.match(doc, /without opening the implementation gate/);
  assert.match(doc, /no-playback side-effect, settings-mode, blocklist\/list-mode, whitelist\/list-mode/);
  assert.match(doc, /8 `aria-selected=true` tokens/);
  assert.match(doc, /5 `data-filtertube-hidden=true` tokens/);
  assert.match(doc, /1 confirmed block-state token/);
  assert.match(doc, /1 `html5-main-video` token/);
  assert.match(doc, /selected video `NLDFEkIvcbc`/);
  assert.match(doc, /selected channel `UCfg5XmOVjJ4yoeE0XkqmGAQ`/);
  assert.match(doc, /visible sibling `75NRE2KB8jc`/);
  assert.match(doc, /hidden sibling `BRycGIKZzpQ`/);
  assert.match(doc, /current-watch owner block can pause video, hide the selected row with `skipStats`, click alternate playlist links/);
  assert.match(doc, /playlist click and autoplay-ended guards can synthesize playlist\/player navigation/);
  assert.match(doc, /hidden selected-row retry can pause\/reset video and click a preferred or fallback playlist link/);
  assert.match(doc, /No `ytmWatchPlayerSelectedRowPlaybackPolicy`, `ytmWatchPlayerNoPlaybackSideEffectReport`, `ytmWatchPlayerPlaylistSkipDecisionReport`, `ytmWatchPlayerSelectedRowModeMatrix`, `ytmWatchPlayerAutoplayGuardBudget`, `ytmWatchPlayerSyntheticNavigationBudget`, `ytmWatchPlayerCollapsedPanelBudget`, or `ytmWatchPlayerSelectedRowRestoreReport` exists/);
});

test('objective coverage ledger records content-filter route surface convergence proof', () => {
  const doc = ledger();
  const routeDoc = read('docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_ROUTE_SURFACE_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md');
  const noWorkDoc = read('docs/audit/FILTERTUBE_CONTENT_FILTER_ROUTE_SURFACE_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-29.md');
  const diagnosticDoc = read('docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md');

  assert.match(doc, /2026-05-30 content-filter route\/surface convergence continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_CONTENT_FILTER_FIELD_EFFECT_ROUTE_SURFACE_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md'));
  assert.ok(doc.includes('docs/audit/FILTERTUBE_CONTENT_FILTER_ROUTE_SURFACE_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-29.md'));
  assert.ok(doc.includes('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/content-filter-field-effect-route-surface-matrix-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/content-filter-route-surface-no-work-budget-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for content-filter route\/surface optimization without\s+approving JSON-first promotion, DOM fallback deletion, metadata fetch pruning,\s+or product runtime changes/);
  assert.match(doc, /pins 10 content-filter\s+route\/surface convergence rows, 12 field-effect route\/surface rows,\s+12 no-work budget rows, 9 route\/surface classes, 7 cheap no-work gate\s+families, 6 known over-work gap families/);
  assert.match(doc, /runtime content-filter convergence\s+approvals 0, implementation-ready content-filter convergence rows 0/);
  assert.match(doc, /content-filter JSON-first route authority `NO-GO`, content-filter DOM fallback\s+deletion approval `NO-GO`, runtime behavior changed by this continuation: no,\s+and continued audit remains `GO`/);
  assert.match(routeDoc, /content-filter route\/surface convergence rows: 10/);
  assert.match(noWorkDoc, /no-work budget rows covered by convergence: 12/);
  assert.match(doc, /2026-05-30 diagnostic logging convergence continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(doc.includes('tests/runtime/runtime-diagnostic-logging-policy-matrix-current-behavior.test.mjs'));
  assert.match(doc, /extend objective coverage for diagnostic logging, performance-risk, privacy,\s+JSON-first optimization, whitelist\/cache optimization, no-work budgets,\s+release\/build evidence, metric replacement, reliability, false-hide\/leak/);
  assert.match(doc, /pins\s+10 diagnostic logging convergence rows, 21 diagnostic logging policy source\s+files, 419 active console callsites, 9 diagnostic source-flow rows/);
  assert.match(doc, /runtime diagnostic logging\s+convergence approvals 0, implementation-ready diagnostic logging convergence\s+rows 0/);
  assert.match(doc, /diagnostic logging cleanup approval `NO-GO`, diagnostic metric\s+replacement approval `NO-GO`, diagnostic privacy\/redaction approval `NO-GO`/);
  assert.match(doc, /runtime behavior changed by this continuation: no, and continued audit remains\s+`GO`/);
  assert.match(diagnosticDoc, /Diagnostic Logging Convergence Boundary - 2026-05-30/);
  assert.match(diagnosticDoc, /diagnostic logging convergence rows: 10/);
  assert.match(doc, /2026-05-30 full runtime freshness closure continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md'));
  assert.ok(doc.includes('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md'));
  assert.ok(doc.includes('docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_METHOD_SEMANTIC_REGISTER_2026-05-21.md'));
  assert.ok(doc.includes('docs/audit/FILTERTUBE_SOURCE_OF_TRUTH_CLAIM_REGISTER_2026-05-20.md'));
  assert.match(doc, /extend objective coverage for runtime proof freshness, audit-document drift\s+repair, native-sync freshness references, truth-claim line-reference\s+freshness/);
  assert.match(doc, /initial full runtime rerun result at 4665\/4667 pass with 2 audit freshness\s+failures/);
  assert.match(doc, /focused drift repair proof at 10\/10 pass/);
  assert.match(doc, /fresh full runtime dot\s+rerun exit status 0, 528 runtime test files, 4671 source top-level test\s+declarations/);
  assert.match(doc, /current full runtime proof for the generated 4671 declaration\s+set `GO`/);
  assert.match(doc, /broad codebase audit completion from full runtime proof `NO-GO`/);
  assert.match(doc, /first optimization implementation approval from full runtime proof `NO-GO`/);
  assert.match(doc, /JSON-first first-class promotion from full runtime proof `NO-GO`/);
  assert.match(doc, /whitelist\/cache optimization from full runtime proof `NO-GO`/);
  assert.match(doc, /release\/public-claim use from full runtime proof `NO-GO`/);
});
