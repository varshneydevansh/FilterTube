import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function classifyTrackedFile(file) {
  if ([
    '.gitignore',
    'CHANGELOG.md',
    'LICENSE',
    'README.md',
    'package-lock.json',
    'package.json',
    'channel-identity-watch-mix-collab-recovery-plan.md'
  ].includes(file)) return 'root-project-metadata';

  if (/^manifest(\.|$)/.test(file)) return 'browser-manifests';
  if (file === 'build.js' || file.startsWith('scripts/')) return 'build-release-sync-scripts';
  if (file.startsWith('html/')) return 'extension-html';
  if (file.startsWith('icons/')) return 'extension-icons';
  if (file.startsWith('assets/')) return 'extension-assets';
  if (file.startsWith('data/') || file.startsWith('design/')) return 'data-design-inputs';
  if (file.startsWith('docs/')) return 'tracked-docs';
  if (file.startsWith('src/')) return 'generated-ui-source';
  if (file.startsWith('js/vendor/')) return 'vendor-bundles';
  if (file.startsWith('js/ui-shell/')) return 'generated-ui-output';
  if (file === 'js/layout.js') return 'quarantined-legacy-js';
  if (/^css\/(filter|content|layout)\.css$/.test(file)) return 'quarantined-content-css';
  if (file.startsWith('css/')) return 'extension-ui-css';
  if (
    /^js\/content\//.test(file) ||
    [
      'js/content_bridge.js',
      'js/injector.js',
      'js/seed.js',
      'js/filter_logic.js',
      'js/shared/identity.js'
    ].includes(file)
  ) return 'content-runtime-js';
  if (file.startsWith('js/')) return 'extension-ui-background-js';
  if (file.startsWith('website/app/')) return 'website-app-routes';
  if (file.startsWith('website/components/')) return 'website-components';
  if (file.startsWith('website/public/') || file.startsWith('website/assets/')) return 'website-assets';
  if (file.startsWith('website/')) return 'website-config';

  return 'UNCLASSIFIED';
}

function parseRows(source) {
  return source
    .split('\n')
    .filter(line => line.startsWith('| `'))
    .map(line => {
      const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
      return {
        path: cells[0]?.replace(/^`|`$/g, ''),
        family: cells[1]?.replace(/^`|`$/g, ''),
        proof: cells[2] || '',
        status: cells[3] || ''
      };
    });
}

function trackedSourceFiles() {
  return git(['ls-files', ':(exclude)docs/audit/**', ':(exclude)tests/**']);
}

function assertSettingsModeStopGoPropagation(doc) {
  const stopGoDoc = read('docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md');
  const modeSurfaceDoc = read('docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md');

  assert.match(doc, /Settings Mode Stop\/Go Propagation Continuation/);
  assert.match(doc, /2026-05-28 settings-mode stop\/go propagation continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md'));
  assert.ok(doc.includes('docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md'));
  assert.match(doc, /ASCII plus Mermaid stop\/go diagrams/);
  assert.match(doc, /open\s+settings-mode, JSON-first no-work, lifecycle, DOM\/native action gate/);
  assert.match(doc, /`js\/seed\.js`, `js\/injector\.js`, `js\/filter_logic\.js`/);
  assert.match(doc, /`js\/content_bridge\.js`, `js\/content\/dom_fallback\.js`/);
  assert.match(doc, /`js\/io_manager\.js`, `build\.js`, and `scripts\/\*\.mjs`/);
  assert.match(doc, /6\s+settings-mode cross-feature stop\/go rows/);
  assert.match(doc, /broad empty-state shortcut\s+approval, broad JSON-first promotion, lifecycle pruning, and release\/public\s+claim use at `NO-GO`; runtime behavior changed by this propagation: no/);
  assert.match(stopGoDoc, /Settings Mode Cross-Feature Stop\/Go Continuation - 2026-05-28/);
  assert.match(stopGoDoc, /settings-mode stop\/go continuation rows: 6/);
  assert.match(stopGoDoc, /flowchart TD/);
  assert.match(modeSurfaceDoc, /Settings Mode Cross-Feature Continuation - 2026-05-28/);
  assert.match(modeSurfaceDoc, /No-rule optimization must include content-control validity and route ownership/);
}

function assertListenerOptionShapeContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Event Listener Option Shape Continuation/);
  assert.match(doc, /2026-05-28 listener-option shape continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for listener option shapes without closing any file row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer, menu\/quick-block, dashboard\/popup, vendor\/generated\s+freshness/);
  assert.match(doc, /292 `addEventListener` option rows, 232 omitted-option listeners, 23 boolean\s+capture listeners, 30 object-option listeners, 1 explicit bubble listener, and\s+2 generated expression\/identifier option listeners/);
  assert.match(doc, /listener option\s+cleanup authority, lifecycle pruning authority, route-teardown authority, and\s+release\/public-claim use at `NO-GO`; runtime behavior changed by this\s+continuation: no/);
  assert.match(lifecycleDoc, /Event Listener Option Shape Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII listener option flow diagram: present/);
}

function assertListenerEventTypeContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Event Listener Event-Type Continuation/);
  assert.match(doc, /2026-05-28 listener-event type continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for listener event types without closing any file row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer, menu\/quick-block, dashboard\/popup, vendor\/generated\s+freshness, media engagement, route events/);
  assert.match(doc, /292 `addEventListener` event rows, 114 click\s+listeners, 57 change listeners, 20 input listeners, 14 keydown listeners, 8\s+`DOMContentLoaded` listeners, 1 `ended` media listener, 74 other literal event\s+listeners, 4 non-literal event expressions, and 0 missing event arguments/);
  assert.match(doc, /listener event cleanup authority, lifecycle pruning authority,\s+route-teardown authority, media side-effect authority, and release\/public-claim\s+use at `NO-GO`; runtime behavior changed by this continuation: no/);
  assert.match(lifecycleDoc, /Event Listener Event-Type Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII listener event flow diagram: present/);
}

function assertListenerTargetContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Event Listener Target Continuation/);
  assert.match(doc, /2026-05-28 listener-target continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for listener target expressions without closing any file\s+row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer, menu\/quick-block, dashboard\/popup, vendor\/generated\s+freshness, document\/window page-global listeners/);
  assert.match(doc, /292 `addEventListener` target rows, 205 local\s+element targets, 17 optional local element targets, 41 document targets, 19\s+window targets, 8 vendor transport targets, and 2 generated shell targets/);
  assert.match(doc, /listener target cleanup authority, lifecycle pruning authority,\s+route-teardown authority, generated-output parity, vendor session authority,\s+and release\/public-claim use at `NO-GO`; runtime behavior changed by this\s+continuation: no/);
  assert.match(lifecycleDoc, /Event Listener Target Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII listener target flow diagram: present/);
}

function assertListenerEventTargetMatrixContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Event Listener Event-Target Matrix Continuation/);
  assert.match(doc, /2026-05-28 listener event-target matrix continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for listener event-target pairs without closing any file\s+row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer, menu\/quick-block, dashboard\/popup, native-menu\s+document click handling, SPA route listeners, storage\/message trust/);
  assert.match(doc, /292 `addEventListener` event-target matrix rows, 10 document\s+click pairs, 7 document `DOMContentLoaded` pairs, 3 document keydown pairs, 4\s+document pointer\/mouse pairs, 4 window message pairs, 2 window route pairs, 9\s+window scroll\/resize\/orientation pairs, 1 window storage\/visibility pair, 104\s+local click pairs, 70 local change\/input\/keydown pairs, 8 vendor transport\s+lifecycle pairs, and 2 generated shell nonliteral pairs/);
  assert.match(doc, /listener\s+event-target cleanup authority, lifecycle pruning authority, route-teardown\s+authority, native\/menu timing authority, generated-output parity, vendor\s+session authority, and release\/public-claim use at `NO-GO`; runtime behavior\s+changed by this continuation: no/);
  assert.match(lifecycleDoc, /Event Listener Event-Target Matrix Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII listener event-target flow diagram: present/);
}

function assertObserverObserveTargetContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Observer Observe Target Continuation/);
  assert.match(doc, /2026-05-28 observer-observe target continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for observer observe target expressions without closing\s+any file row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer, menu\/quick-block, dashboard\/popup, DOM fallback,\s+right-rail\/playlist whitelist observation, native dropdown\/menu observation/);
  assert.match(doc, /17 observer observe\s+rows, 4 card\/row observe targets, 3 `document\.body` observe targets, 4 dropdown\s+observe targets, 3 generic target expressions, 2 panel\/rail observe targets,\s+and 1 select observe target/);
  assert.match(doc, /observer observe target cleanup\s+authority, lifecycle pruning authority, route-teardown authority,\s+dropdown\/native menu authority, and release\/public-claim use at `NO-GO`;\s+runtime behavior changed by this continuation: no/);
  assert.match(lifecycleDoc, /Observer Observe Target Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII observer observe target flow diagram: present/);
}

function assertObserverObserveOptionShapeContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Observer Observe Option Shape Continuation/);
  assert.match(doc, /2026-05-28 observer observe option-shape continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for observer observe option shapes without closing any\s+file row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer, menu\/quick-block, dashboard\/UI, DOM fallback,\s+prefetch\/whitelist, collaborator identity, native dropdown\/menu observation,\s+observer option ownership, wake-frequency proof, stale-route policy, no-work\s+budget/);
  assert.match(doc, /17 observer\s+observe option rows, 9 observer observe childList subtree option rows, 1\s+observer observe childList only option row, 2 observer observe no-options rows,\s+5 observer observe attribute filter rows, 2 observer observe style hidden\s+attribute filter rows, 1 observer observe aria-hidden attribute filter row, 1\s+observer observe disabled attribute filter row, 1 observer observe collaborator\s+identity attribute filter row, 16 content runtime observer observe option rows,\s+and 1 extension UI background observer observe option row/);
  assert.match(doc, /observer\s+observe option-shape cleanup authority, lifecycle pruning authority,\s+route-teardown authority, dropdown\/native menu authority, and\s+release\/public-claim use at `NO-GO`; runtime behavior changed by this\s+continuation: no/);
  assert.match(lifecycleDoc, /Observer Observe Option Shape Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII observer observe option-shape flow diagram: present/);
}

function assertListenerCallbackIdentityContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Event Listener Callback Identity Continuation/);
  assert.match(doc, /2026-05-28 listener-callback identity continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for listener callback argument shapes without closing any\s+file row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer\/frame, listener teardown, duplicate-install risk,\s+closure-capture proof, native menu behavior, quick-block\/menu timing, SPA route\s+work/);
  assert.match(doc, /292 `addEventListener` callback rows, 252 inline arrow listener\s+callbacks, 37 identifier listener callbacks, 1 member-reference listener\s+callback, 2 generated expression listener callbacks, 0 missing callback\s+arguments, 74 content-runtime callbacks, 201 extension UI\/background\s+callbacks, 2 generated-output callbacks, 8 vendor-bundle callbacks, and 3\s+website-component callbacks/);
  assert.match(doc, /listener callback cleanup authority,\s+lifecycle pruning authority, route-teardown authority, native\/menu timing\s+authority, and release\/public-claim use at `NO-GO`; runtime behavior changed\s+by this continuation: no/);
  assert.match(lifecycleDoc, /Event Listener Callback Identity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII listener callback flow diagram: present/);
}

function assertListenerAddRemoveParityContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Event Listener Add\/Remove Parity Continuation/);
  assert.match(doc, /2026-05-28 listener add\/remove parity continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for listener add\/remove parity without closing any file\s+row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer\/frame, listener teardown, page-lifetime listeners,\s+quick-block pointermove recovery, native menu behavior, SPA route work/);
  assert.match(doc, /292 `addEventListener` install rows,\s+13 `removeEventListener` teardown rows, a 279 install-minus-remove delta, 13\s+capture-equivalent listener remove pairs, 12 exact option-shape listener remove\s+pairs, 1 capture-equivalent option-shape mismatch listener pair, 0 listener\s+remove rows without a capture-equivalent add pair, 51 page-global listener\s+installs without explicit remove, 252 inline listener installs without remove\s+handle, 70 content-runtime listener add\/remove delta, 201 extension\s+UI\/background listener add\/remove delta, 0 generated-output listener\s+add\/remove delta, 8 vendor-bundle listener add\/remove delta, 0\s+website-component listener add\/remove delta, 7 document listener removes, 2\s+window listener removes, and 2 generated shell listener removes/);
  assert.match(doc, /listener add\/remove cleanup authority, lifecycle pruning authority,\s+route-teardown authority, native\/menu timing authority, and release\/public-claim\s+use at `NO-GO`; runtime behavior changed by this continuation: no/);
  assert.match(lifecycleDoc, /Event Listener Add\/Remove Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII listener add\/remove parity flow diagram: present/);
}

function assertContentRuntimePageGlobalListenerBoundaryContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Content Runtime Page-Global Listener Boundary Continuation/);
  assert.match(doc, /2026-05-28 content-runtime page-global listener boundary continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for content-runtime document\/window listener rows without\s+closing any file row/);
  assert.match(doc, /open\s+lifecycle, observer\/listener\/timer\/frame, page-global listener teardown, SPA\s+route work, quick-block\/menu timing, native dropdown\/comment menu behavior,\s+whitelist prefetch, fallback menu, page-message trust, DOM fallback, prompt\s+boot, no-work budget, performance, reliability, false-hide\/leak,\s+code-burden,\s+cross-feature, and source\/evidence rows/);
  assert.match(doc, /42 content-runtime page-global listener rows, 32 document listener rows,\s+10 window listener rows, 8 source files, 12 quick-block global listener rows,\s+3 native menu global listener rows, 1 Kids passive menu listener row, 5 content\s+bridge prefetch\/whitelist listener rows, 7 content bridge fallback menu\s+listener rows, 1 content bridge main-world message listener row, 2 injector\s+main-world message listener rows, 7 click listener rows, 6 DOMContentLoaded\s+listener rows, 5 `yt-navigate-finish` listener rows, 4 message listener rows,\s+and 4 scroll listener rows/);
  assert.match(doc, /content-runtime page-global listener\s+cleanup authority, lifecycle pruning authority, route-teardown authority,\s+native\/menu timing authority, page-message trust authority, metric artifact use,\s+and release\/public-claim use at `NO-GO`/);
  assert.match(lifecycleDoc, /Content Runtime Page-Global Listener Boundary Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII content runtime page-global listener flow diagram: present/);
}

function assertContentRuntimePageGlobalListenerRowContextContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Content Runtime Page-Global Listener Row Context Continuation/);
  assert.match(doc, /2026-05-28 content-runtime page-global listener row-context continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for current content-runtime page-global listener\s+owner\/route\/surface\/predicate rows without closing any file row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer\/frame, page-global listener teardown, SPA route work,\s+quick-block\/menu timing, native dropdown\/comment menu behavior, whitelist\s+prefetch, fallback menu, page-message trust, DOM fallback, prompt boot,\s+duplicate install, no-work budget, performance, reliability, false-hide\/leak,\s+code-burden, cross-feature, and source\/evidence rows/);
  assert.match(doc, /42 row-context rows, 16 route scopes, 16\s+surface scopes, 14 active predicate classes, 20 duplicate-install boundary\s+classes, 12 quick-block enabled-gated rows, 6 fallback menu eager-or-hover\s+gated rows, 4 main-world message source-gated rows, 3 identity prefetch-work\s+gated rows, and 2 whitelist non-watch gated rows/);
  assert.match(doc, /content-runtime\s+page-global row-context cleanup authority, native\/menu impact authority,\s+page-message trust authority, no-work budget authority, fixture authority,\s+teardown\/page-lifetime justification authority, metric artifact use, and\s+release\/public-claim use at `NO-GO`/);
  assert.match(lifecycleDoc, /Content Runtime Page-Global Listener Row Context Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII content runtime page-global row-context flow diagram: present/);
}

function assertContentRuntimePageGlobalListenerImpactFixtureContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Content Runtime Page-Global Listener Impact And Fixture Continuation/);
  assert.match(doc, /2026-05-28 content-runtime page-global listener impact and fixture\s+continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for current content-runtime page-global listener\s+impact\/trust\/no-work\/fixture\/page-lifetime rows without closing any file row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer\/frame, page-global listener teardown, SPA route work,\s+quick-block\/menu timing, native dropdown\/comment menu behavior, whitelist\s+prefetch, fallback menu, page-message trust, no-work budget, positive\/negative\s+fixtures, teardown\/page-lifetime justification, performance, reliability,\s+false-hide\/leak, code-burden, cross-feature, and source\/evidence rows/);
  assert.match(doc, /42 impact rows, 10 native\/menu impact\s+classes, 6 page-message trust classes, 14 no-work budget classes, 13 positive\s+fixture classes, 12 negative fixture classes, 6 page-lifetime classes, 12\s+quick-block affordance impact rows, 7 custom fallback menu impact rows, 5\s+page-message impact rows, 37 no page-message trust impact rows, and 30 module\s+singleton page-lifetime rows/);
  assert.match(doc, /content-runtime page-global\s+impact\/fixture cleanup authority, native\/menu impact authority,\s+page-message trust authority, no-work budget authority, fixture authority,\s+teardown\/page-lifetime justification authority, metric artifact use, and\s+release\/public-claim use at `NO-GO`/);
  assert.match(lifecycleDoc, /Content Runtime Page-Global Listener Impact And Fixture Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII content runtime page-global impact fixture flow diagram: present/);
}

function assertObserverDisconnectContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Observer Disconnect Continuation/);
  assert.match(doc, /2026-05-28 observer-disconnect continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for observer disconnect receiver expressions without\s+closing any file row/);
  assert.match(doc, /open\s+lifecycle, observer\/listener\/timer, menu\/quick-block, collaborator dialog, DOM\s+fallback, playlist fallback popover, prefetch\/whitelist route reattach/);
  assert.match(doc, /10 observer\s+disconnect rows, 5 local `observer` variable disconnects, 2 dropdown close\s+observer disconnects, 1 dropdown discovery observer disconnect, 1 collaborator\s+dialog observer disconnect, and 1 playlist fallback row observer state\s+disconnect/);
  assert.match(doc, /observer disconnect cleanup authority, lifecycle pruning\s+authority, route-teardown authority, dropdown\/native menu authority, and\s+release\/public-claim use at `NO-GO`; runtime behavior changed by this\s+continuation: no/);
  assert.match(lifecycleDoc, /Observer Disconnect Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII observer disconnect flow diagram: present/);
}

function assertObserverObserveReleaseParityContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Observer Observe\/Release Parity Continuation/);
  assert.match(doc, /2026-05-28 observer observe\/release parity continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for observer observe\/release parity without closing any\s+file row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer, menu\/quick-block, collaborator dialog, dashboard\/UI,\s+prefetch\/whitelist, native dropdown\/menu observation, stale-route policy,\s+no-work budget/);
  assert.match(doc, /17 observer observe rows for release parity, 11 observer release rows for\s+parity, 10 observer disconnect release rows, 1 observer unobserve release row,\s+a 6 observer observe-minus-release delta, 10 local observer variable observe\s+rows, 2 local obs variable observe rows, 5 exact named observer observe rows,\s+4 exact named observer observe rows with release, 1 exact named observer\s+observe row without release, 1 prefetch observer observe row without release,\s+5 content-runtime observer observe\/release delta, and 1 extension UI\/background\s+observer observe\/release delta/);
  assert.match(doc, /observer observe\/release cleanup\s+authority, lifecycle pruning authority, route-teardown authority,\s+dropdown\/native menu authority, and release\/public-claim use at `NO-GO`;\s+runtime behavior changed by this continuation: no/);
  assert.match(lifecycleDoc, /Observer Observe\/Release Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII observer observe\/release parity flow diagram: present/);
}

function assertObserverConstructorObserveTypeParityContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Observer Constructor\/Observe Type Parity Continuation/);
  assert.match(doc, /2026-05-28 observer constructor\/observe type parity continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for observer constructor\/observe type parity without\s+closing any file row/);
  assert.match(doc, /open\s+lifecycle,\s+observer\/listener\/timer, menu\/quick-block, dashboard\/UI,\s+prefetch\/whitelist, native dropdown\/menu observation, observer type ownership,\s+stale-route policy, no-work budget/);
  assert.match(doc, /17 observer constructor rows for type parity, 15\s+`MutationObserver` constructor rows for type parity, 2 `IntersectionObserver`\s+constructor rows for type parity, 17 observer observe rows for type parity, 15\s+mutation observer observe rows for type parity, 2 intersection observer observe\s+rows for type parity, 0 observer constructor-minus-observe delta, 0 mutation\s+observer constructor-minus-observe delta, 0 intersection observer\s+constructor-minus-observe delta, 0 content runtime observer\s+constructor\/observe delta, and 0 extension UI background observer\s+constructor\/observe delta/);
  assert.match(doc, /observer constructor\/observe type cleanup\s+authority, lifecycle pruning authority, route-teardown authority,\s+dropdown\/native menu authority, and release\/public-claim use at `NO-GO`;\s+runtime behavior changed by this continuation: no/);
  assert.match(lifecycleDoc, /Observer Constructor\/Observe Type Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII observer constructor\/observe type parity flow diagram: present/);
}

function assertObserverConstructorCallbackIdentityContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Observer Constructor Callback Identity Continuation/);
  assert.match(doc, /2026-05-28 observer constructor callback identity continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for observer constructor callback shapes without closing\s+any file row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer, menu\/quick-block, dashboard\/UI, prefetch\/whitelist,\s+native dropdown\/menu observation, observer callback ownership, wake-frequency\s+proof, stale-route policy, no-work budget/);
  assert.match(doc, /17 observer constructor callback rows, 17\s+inline arrow observer constructor callbacks, 0 identifier observer constructor\s+callbacks, 0 missing observer constructor callbacks, 9 observer callbacks with\s+a mutations parameter, 2 observer callbacks with an entries parameter, 6\s+observer callbacks with no parameter, 16 content runtime observer constructor\s+callbacks, and 1 extension UI background observer constructor callback/);
  assert.match(doc, /observer constructor callback cleanup authority, lifecycle pruning\s+authority, route-teardown authority, dropdown\/native menu authority, and\s+release\/public-claim use at `NO-GO`; runtime behavior changed by this\s+continuation: no/);
  assert.match(lifecycleDoc, /Observer Constructor Callback Identity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII observer constructor callback flow diagram: present/);
}

function assertTimerDelayShapeContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Timer Delay Shape Continuation/);
  assert.match(doc, /2026-05-28 timer-delay shape continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for timer delay arguments without closing any file row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer, menu\/quick-block, JSON replay, background flush,\s+retry\/watchdog, SPA lag, no-rule budget/);
  assert.match(doc, /126 timer delay rows, 123 `setTimeout` delay\s+rows, 3 `setInterval` delay rows, 16 zero-delay timers, 16 1-99ms timers, 18\s+100-199ms timers, 17 200-999ms timers, 13 1000-4999ms timers, 4 5000ms-plus\s+timers, 37 named\/expression timers, 5 `Math\.max\(\.\.\.\)` expression timers, and\s+0 missing delay arguments/);
  assert.match(doc, /timer delay cleanup authority, lifecycle\s+pruning authority, route-teardown authority, native\/menu timing authority, and\s+release\/public-claim use at `NO-GO`; runtime behavior changed by this\s+continuation: no/);
  assert.match(lifecycleDoc, /Timer Delay Shape Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII timer delay flow diagram: present/);
}

function assertTimerCallbackIdentityContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Timer Callback Identity Continuation/);
  assert.match(doc, /2026-05-28 timer-callback identity continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for timer callback argument shapes without closing any\s+file row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer\/frame, timer pruning, callback coalescing, debounce\s+behavior, SPA refresh cadence, menu\/quick-block timing, JSON replay timing/);
  assert.match(doc, /126 timer callback rows, 123 `setTimeout` callback rows, 3 `setInterval`\s+callback rows, 107 inline arrow timer callbacks, 19 identifier timer\s+callbacks, 0 inline function timer callbacks, 0 member-reference timer\s+callbacks, 0 missing callback arguments, 86 content-runtime timer callbacks,\s+39 extension UI\/background timer callbacks, and 1 website-component timer\s+callback/);
  assert.match(doc, /timer callback cleanup authority, lifecycle pruning\s+authority, route-teardown authority, native\/menu timing authority, and\s+release\/public-claim use at `NO-GO`; runtime behavior changed by this\s+continuation: no/);
  assert.match(lifecycleDoc, /Timer Callback Identity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII timer callback flow diagram: present/);
}

function assertTimerScheduleClearParityContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Timer Schedule\/Clear Parity Continuation/);
  assert.match(doc, /2026-05-28 timer schedule\/clear parity continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for timer schedule\/clear parity without closing any file\s+row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer\/frame, timer teardown, debounce behavior, SPA refresh\s+cadence, menu\/quick-block timing, JSON replay timing, background flush/);
  assert.match(doc, /123 `setTimeout` schedule rows, 34 `clearTimeout` rows, 3\s+`setInterval` schedule rows, 4 `clearInterval` rows, an 89 timeout\s+schedule-minus-clear delta, -1 interval schedule-minus-clear delta, 11 timeout\s+schedules with assigned local id handles, 24 timeout schedules with assigned\s+named state handles, 10 timeout schedules with assigned property-held handles,\s+63 timeout fire-and-forget schedules, 14 timeout promise sleep or timeout\s+schedules, 1 timeout returned handle schedule, 3 interval schedules with\s+assigned named state handles, 32 `clearTimeout` rows with direct schedule\s+handle, 2 `clearTimeout` rows without direct schedule handle, 26 handled\s+timeout schedule rows with clear handle, 19 handled timeout schedule rows\s+without clear handle, 18 distinct scheduled timeout handles without clear, 4\s+`clearInterval` rows with direct schedule handle, 0 `clearInterval` rows\s+without direct schedule handle, 3 handled interval schedule rows with clear\s+handle, 0 handled interval schedule rows without clear handle, and 0 distinct\s+scheduled interval handles without clear/);
  assert.match(doc, /timer schedule\/clear cleanup\s+authority, lifecycle pruning authority, route-teardown authority,\s+native\/menu timing authority, and release\/public-claim use at `NO-GO`; runtime\s+behavior changed by this continuation: no/);
  assert.match(lifecycleDoc, /Timer Schedule\/Clear Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII timer schedule\/clear parity flow diagram: present/);
}

function assertTimerOwnerDomainContextContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Timer Owner Domain Context Continuation/);
  assert.match(doc, /2026-05-30 timer owner-domain context continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for timer owner-domain rows without closing any file\s+row/);
  assert.match(doc, /126 timer owner-context rows, 13 timer owner\s+domains, 123 `setTimeout` rows, 3 `setInterval` rows, 86 content-runtime\s+timer owner-context rows, 39 extension UI\/background timer owner-context rows/);
  assert.match(doc, /37 content bridge timer rows, 16\s+quick\/menu timer rows, 15 dashboard timer rows, 10 background timer rows, and\s+10 DOM fallback timer rows/);
  assert.match(doc, /timer owner-context cleanup authority,\s+lifecycle pruning authority, route-teardown authority, native\/menu timing\s+authority, metric artifact use, and release\/public-claim use at `NO-GO`;\s+runtime behavior changed by this continuation: no/);
  assert.match(lifecycleDoc, /Timer Owner Domain Context Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer owner-context rows: 126/);
  assert.match(lifecycleDoc, /ASCII timer owner-domain flow diagram: present/);
}

function assertTimerOwnerDelayBudgetContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Timer Owner Delay Budget Continuation/);
  assert.match(doc, /2026-05-30 timer owner delay-budget continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for timer owner delay-budget rows without closing any file\s+row/);
  assert.match(doc, /126 timer owner delay-budget rows, 16 immediate-zero timer rows, 34\s+short-under-200ms timer rows, 17 medium-200-999ms timer rows, 17\s+long-1000ms-plus timer rows, 5 bounded-expression timer rows, 37\s+named-or-expression timer rows/);
  assert.match(doc, /13 content bridge immediate-or-short timer\s+rows, 9 quick\/menu immediate-or-short timer rows, 6 DOM fallback\s+immediate-or-short timer rows, and 5 dashboard immediate-or-short timer rows/);
  assert.match(doc, /timer owner delay-budget cleanup authority, lifecycle pruning\s+authority, route-teardown authority, native\/menu timing authority, metric\s+artifact use, whitelist\/cache optimization, JSON-first promotion, and\s+release\/public-claim use at `NO-GO`; runtime behavior changed by this\s+continuation: no/);
  assert.match(lifecycleDoc, /Timer Owner Delay Budget Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer owner delay-budget rows: 126/);
  assert.match(lifecycleDoc, /ASCII timer owner delay-budget flow diagram: present/);
}

function assertTimerImmediateShortRowContextContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Timer Immediate\/Short Row Context Continuation/);
  assert.match(doc, /2026-05-30 timer immediate\/short row-context continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for zero-delay and sub-200ms timer side effects without\s+closing any file row/);
  assert.match(doc, /50 immediate\/short timer context rows, 10\s+owner domains, 31 side-effect classes, 13 content bridge context rows, 9\s+quick\/menu context rows, 6 DOM fallback context rows/);
  assert.match(doc, /3 native dropdown\s+injection timer rows, 4 DOM fallback playlist navigation timer rows, and 2\s+content bridge whitelist refresh timer rows/);
  assert.match(doc, /immediate\/short timer\s+cleanup authority, timer delay-change authority, lifecycle pruning authority,\s+route-teardown authority, native\/menu timing authority, metric artifact use,\s+whitelist\/cache optimization, JSON-first promotion, and release\/public-claim\s+use at `NO-GO`; runtime behavior changed by this continuation: no/);
  assert.match(lifecycleDoc, /Timer Immediate\/Short Row Context Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer immediate-short context cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII immediate\/short timer row-context flow diagram: present/);
}

function assertTimerImmediateShortAdmissionGateContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Timer Immediate\/Short Admission Gate Continuation/);
  assert.match(doc, /2026-05-30 timer immediate\/short admission-gate continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for zero-delay and sub-200ms timer admission triggers\s+without closing any file row/);
  assert.match(doc, /50 immediate\/short timer admission rows, 4\s+admission families, 29 admission trigger classes, 22 user\/menu\/navigation\s+admission rows, 11 DOM rerun\/scan admission rows, 9 bootstrap\/readiness\s+admission rows/);
  assert.match(doc, /8 storage\/cache admission rows, 2 whitelist non-watch observer\s+admission rows, 3 native dropdown injection trigger rows, and 4 watch playlist\s+navigation admission rows/);
  assert.match(doc, /immediate\/short timer admission cleanup\s+authority, timer delay-change authority, lifecycle pruning authority,\s+route-teardown authority, native\/menu timing authority, metric artifact use,\s+whitelist\/cache optimization, JSON-first promotion, and release\/public-claim\s+use at `NO-GO`; runtime behavior changed by this continuation: no/);
  assert.match(lifecycleDoc, /Timer Immediate\/Short Admission Gate Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer immediate-short admission cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII immediate\/short timer admission flow diagram: present/);
}

function assertTimerImmediateShortNoWorkPredicateContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Timer Immediate\/Short No-Work Predicate Continuation/);
  assert.match(doc, /2026-05-30 timer immediate\/short no-work predicate continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for zero-delay and sub-200ms timer active\/no-work\s+predicates without closing any file row/);
  assert.match(doc, /50 immediate\/short timer no-work predicate\s+rows, 7 predicate classes, 20 direct user-action gated rows, 2 page-global\s+user-input gated rows, 2 explicit list-mode route-gated rows/);
  assert.match(doc, /4 eager\s+surface-gated rows, 5 DOM fallback inherited rows, 9 bootstrap\/readiness gated\s+rows, and 8 storage dirty-state gated rows/);
  assert.match(doc, /immediate\/short timer\s+no-work predicate cleanup authority, timer delay-change authority, lifecycle\s+pruning authority, route-teardown authority, native\/menu timing authority,\s+metric artifact use, whitelist\/cache optimization, JSON-first promotion, and\s+release\/public-claim use at `NO-GO`; runtime behavior changed by this\s+continuation: no/);
  assert.match(lifecycleDoc, /Timer Immediate\/Short No-Work Predicate Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer immediate-short no-work predicate cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII immediate\/short timer no-work predicate flow diagram: present/);
}

function assertTimerImmediateShortSurfaceOwnershipContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Timer Immediate\/Short Surface Ownership Continuation/);
  assert.match(doc, /2026-05-30 timer immediate\/short surface ownership continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for zero-delay and sub-200ms timer route\/surface\s+ownership without closing any file row/);
  assert.match(doc, /50 immediate\/short timer surface rows, 7 surface classes, 33\s+YouTube SPA content runtime rows, 5 extension dashboard UI rows, 2 extension\s+popup UI rows/);
  assert.match(doc, /3 content prompt overlay rows, 2 background storage runtime\s+rows, 4 state\/import runtime rows, and 1 extension UI render-engine row/);
  assert.match(doc, /immediate\/short timer surface cleanup authority, timer delay-change\s+authority, lifecycle pruning authority, route-teardown authority, native\/menu\s+timing authority, metric artifact use, whitelist\/cache optimization,\s+JSON-first promotion, and release\/public-claim use at `NO-GO`; runtime\s+behavior changed by this continuation: no/);
  assert.match(lifecycleDoc, /Timer Immediate\/Short Surface Ownership Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /timer immediate-short surface cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII immediate\/short timer surface ownership flow diagram: present/);
}

function assertYouTubeSpaImmediateShortPredicateCrosswalkContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /YouTube SPA Immediate\/Short Predicate Crosswalk Continuation/);
  assert.match(doc, /2026-05-30 YouTube SPA immediate\/short predicate crosswalk continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for YouTube SPA content-surface hot timer predicates\s+without closing any file row/);
  assert.match(doc, /33 YouTube SPA immediate\/short predicate crosswalk rows, 7 predicate classes,\s+12 direct user-action gated rows, 6 bootstrap\/readiness gated rows/);
  assert.match(doc, /5 DOM\s+fallback inherited rows, 4 eager surface-gated rows, 2 explicit list-mode\s+route-gated rows, 2 page-global user-input gated rows, and 2 storage\s+dirty-state gated rows/);
  assert.match(doc, /YouTube SPA immediate\/short predicate\s+crosswalk cleanup authority, timer delay-change authority, lifecycle pruning\s+authority, route-teardown authority, native\/menu timing authority, metric\s+artifact use, whitelist\/cache optimization, JSON-first promotion, and\s+release\/public-claim use at `NO-GO`; runtime behavior changed by this\s+continuation: no/);
  assert.match(lifecycleDoc, /YouTube SPA Immediate\/Short Predicate Crosswalk Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA immediate-short predicate crosswalk cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII YouTube SPA immediate\/short predicate crosswalk flow diagram: present/);
}

function assertYouTubeSpaEagerHotTimerCandidateContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /YouTube SPA Eager Hot Timer Candidate Continuation/);
  assert.match(doc, /2026-05-30 YouTube SPA eager hot timer candidate continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for YouTube SPA eager-surface hot timer candidates\s+without closing any file row/);
  assert.match(doc, /4 YouTube SPA eager\s+hot timer rows, 2 candidate classes, 3 fallback menu eager hot timer rows, 1\s+quick-block eager sweep hot timer row/);
  assert.match(doc, /4 rule-list independent YouTube SPA\s+eager hot timer rows/);
  assert.match(doc, /YouTube SPA eager hot timer cleanup authority,\s+timer delay-change authority, lifecycle pruning authority, route-teardown\s+authority, native\/menu timing authority, quick-block affordance changes,\s+metric artifact use, whitelist\/cache optimization, JSON-first promotion, and\s+release\/public-claim use at `NO-GO`; runtime behavior changed by this\s+continuation: no/);
  assert.match(lifecycleDoc, /YouTube SPA Eager Hot Timer Candidate Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA eager hot timer cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII YouTube SPA eager hot timer candidate flow diagram: present/);
}

function assertYouTubeSpaEagerHotTimerRouteAdmissionContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /YouTube SPA Eager Hot Timer Route Admission Continuation/);
  assert.match(doc, /2026-05-30 YouTube SPA eager hot timer route admission continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for YouTube SPA eager hot timer route\/surface admission\s+without closing any file row/);
  assert.match(doc, /4 YouTube SPA eager\s+hot timer route admission rows, 3 fallback menu mobile\/coarse route-admitted\s+hot timer rows, 1 quick-block mobile\/coarse route-admitted hot timer row/);
  assert.match(doc, /0\s+source-admitted desktop hover\/fine eager hot timer rows, 4 rule-list\s+independent YouTube SPA eager hot timer rows, and no shared eager surface\s+classifier/);
  assert.match(doc, /YouTube SPA eager hot timer route admission cleanup\s+authority, timer delay-change authority, lifecycle pruning authority,\s+route-teardown authority, native\/menu timing authority, quick-block affordance\s+changes, metric artifact use, whitelist\/cache optimization, JSON-first\s+promotion, and release\/public-claim use at `NO-GO`; runtime behavior changed\s+by this continuation: no/);
  assert.match(lifecycleDoc, /YouTube SPA Eager Hot Timer Route Admission Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA eager hot timer route admission cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII YouTube SPA eager hot timer route admission flow diagram: present/);
}

function assertYouTubeSpaDesktopResidualHotTimerContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /YouTube SPA Desktop Hover\/Fine Residual Hot Timer Continuation/);
  assert.match(doc, /2026-05-30 YouTube SPA desktop hover\/fine residual hot timer continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for the normal desktop residual hot timer set after\s+mobile\/coarse eager rows are excluded without closing any file row/);
  assert.match(doc, /29 YouTube SPA desktop hover\/fine residual hot timer rows, 6 residual\s+predicate classes, 12 direct user-action gated rows, 6 bootstrap\/readiness\s+gated rows/);
  assert.match(doc, /5 DOM fallback inherited rows, 2 explicit list-mode route-gated\s+rows, 2 page-global user-input gated rows, 2 storage dirty-state gated rows,\s+and 0 residual eager-surface gated rows/);
  assert.match(doc, /YouTube SPA desktop\s+hover\/fine residual cleanup authority, timer delay-change authority, lifecycle\s+pruning authority, route-teardown authority, native\/menu timing authority,\s+quick-block affordance changes, metric artifact use, whitelist\/cache\s+optimization, JSON-first promotion, and release\/public-claim use at `NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Hover\/Fine Residual Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /YouTube SPA desktop hover\/fine residual cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII YouTube SPA desktop residual hot timer flow diagram: present/);
}

function assertYouTubeSpaDesktopDirectUserActionHotTimerContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /YouTube SPA Desktop Direct User-Action Hot Timer Continuation/);
  assert.match(doc, /2026-05-30 YouTube SPA desktop direct user-action hot timer continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for the direct user-action subset inside the normal\s+desktop residual hot timer set without closing any file row/);
  assert.match(doc, /12 YouTube SPA desktop direct user-action hot timer rows, 12 `setTimeout`\s+rows, 4 `content_bridge` rows, 4 `block_channel` rows, 4 `dom_fallback` rows,\s+3 native dropdown injection rows/);
  assert.match(doc, /2 block-action menu close rows,\s+4 watch playlist navigation rows, 1 quick-block fallback rerun row,\s+1 fallback row feedback row, and 1 native focus-release row/);
  assert.match(doc, /YouTube\s+SPA desktop direct user-action cleanup authority, native\/menu timing rewrite\s+authority, timer delay-change authority, lifecycle pruning authority,\s+route-teardown authority, menu close rewrites, playlist navigation rewrites,\s+quick-block fallback rewrites, metric artifact use, whitelist\/cache\s+optimization, JSON-first promotion, and release\/public-claim use at `NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Direct User-Action Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /desktop direct user-action cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII YouTube SPA desktop direct user-action hot timer flow diagram: present/);
}

function assertYouTubeSpaDesktopStartupReadinessHotTimerContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /YouTube SPA Desktop Startup\/Readiness Hot Timer Continuation/);
  assert.match(doc, /2026-05-30 YouTube SPA desktop startup\/readiness hot timer continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for the bootstrap\/readiness subset inside the normal\s+desktop residual hot timer set without closing any file row/);
  assert.match(doc, /6 YouTube SPA\s+desktop startup\/readiness hot timer rows, 5 `setTimeout` rows, 1 `setInterval`\s+row, 1 content bridge startup row, 2 bridge injection rows, 2 quick\/menu body\s+readiness rows, and 1 injector readiness poll row/);
  assert.match(doc, /YouTube SPA\s+desktop startup\/readiness cleanup authority, timer delay-change authority,\s+lifecycle pruning authority, route-teardown authority, native\/menu timing\s+authority, bridge injection changes, metric artifact use, whitelist\/cache\s+optimization, JSON-first promotion, and release\/public-claim use at `NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Startup\/Readiness Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /desktop startup\/readiness cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII YouTube SPA desktop startup\/readiness hot timer flow diagram: present/);
}

function assertYouTubeSpaDesktopDomFallbackInheritedHotTimerContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /YouTube SPA Desktop DOM-Fallback Inherited Hot Timer Continuation/);
  assert.match(doc, /2026-05-30 YouTube SPA desktop DOM-fallback inherited hot timer continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for the DOM-fallback inherited subset inside the normal\s+desktop residual hot timer set without closing any file row/);
  assert.match(doc, /5 YouTube SPA desktop DOM-fallback\s+inherited hot timer rows, 5 `setTimeout` rows, 3 `content_bridge` rows,\s+2 `dom_fallback` rows, 2 collaborator rerun rows, 1 identity stamp rerun row,\s+1 active yield row, and 1 pending rerun row/);
  assert.match(doc, /YouTube SPA desktop\s+DOM-fallback inherited cleanup authority, timer delay-change authority,\s+lifecycle pruning authority, route-teardown authority, collaborator rerun\s+changes, identity-stamp rerun changes, metric artifact use, whitelist\/cache\s+optimization, JSON-first promotion, and release\/public-claim use at `NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop DOM-Fallback Inherited Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /desktop DOM-fallback inherited cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII YouTube SPA desktop DOM-fallback inherited hot timer flow diagram: present/);
}

function assertYouTubeSpaDesktopStorageDirtyStateHotTimerContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /YouTube SPA Desktop Storage Dirty-State Hot Timer Continuation/);
  assert.match(doc, /2026-05-30 YouTube SPA desktop storage dirty-state hot timer continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for the storage dirty-state subset inside the normal\s+desktop residual hot timer set without closing any file row/);
  assert.match(doc, /2 YouTube SPA desktop storage dirty-state\s+hot timer rows, 2 `setTimeout` rows, 2 `filter_logic` rows,\s+1 `videoChannelMap` flush row, 1 `videoMetaMap` flush row, and 2 bridge\s+message consumers/);
  assert.match(doc, /YouTube SPA desktop storage dirty-state cleanup\s+authority, timer delay-change authority, lifecycle pruning authority,\s+route-teardown authority, map freshness rewrites, bridge message rewrites,\s+metric artifact use, whitelist\/cache optimization, JSON-first promotion, and\s+release\/public-claim use at `NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Storage Dirty-State Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /desktop storage dirty-state cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII YouTube SPA desktop storage dirty-state hot timer flow diagram: present/);
}

function assertYouTubeSpaDesktopExplicitListModeRouteHotTimerContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /YouTube SPA Desktop Explicit List-Mode Route Hot Timer Continuation/);
  assert.match(doc, /2026-05-30 YouTube SPA desktop explicit list-mode route hot timer\s+continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for the explicit list-mode route subset inside the normal\s+desktop residual hot timer set without closing any file row/);
  assert.match(doc, /2 YouTube SPA desktop explicit list-mode\s+route hot timer rows, 2 `setTimeout` rows, 1 immediate refresh row,\s+1 follow-up refresh row, 2 `content_bridge` rows, and 2 force-reprocess rows/);
  assert.match(doc, /YouTube SPA desktop explicit list-mode route cleanup authority, timer\s+delay-change authority, lifecycle pruning authority, route-teardown authority,\s+whitelist refresh rewrites, DOM fallback pruning, metric artifact use,\s+whitelist\/cache optimization, JSON-first promotion, and release\/public-claim\s+use at `NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Explicit List-Mode Route Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /desktop explicit list-mode route cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII YouTube SPA desktop explicit list-mode route hot timer flow diagram: present/);
}

function assertYouTubeSpaDesktopPageGlobalQuickBlockRefreshHotTimerContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /YouTube SPA Desktop Page-Global Quick-Block Refresh Hot Timer Continuation/);
  assert.match(doc, /2026-05-30 YouTube SPA desktop page-global quick-block refresh hot timer\s+continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for the page-global quick-block refresh subset inside the\s+normal desktop residual hot timer set without closing any file row/);
  assert.match(doc, /2 YouTube SPA\s+desktop page-global quick-block refresh hot timer rows, 2 `setTimeout` rows,\s+1 focusout refresh row, 1 click refresh row, and 2 runtime refresh rows/);
  assert.match(doc, /YouTube SPA desktop page-global quick-block refresh cleanup authority,\s+timer delay-change authority, lifecycle pruning authority, route-teardown\s+authority, quick-block refresh rewrites, native\/menu timing rewrites, metric\s+artifact use, whitelist\/cache optimization, JSON-first promotion, and\s+release\/public-claim use at `NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Page-Global Quick-Block Refresh Hot Timer Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /desktop page-global quick-block cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII YouTube SPA desktop page-global quick-block refresh flow diagram: present/);
}

function assertYouTubeSpaDesktopResidualHotTimerClassClosureContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /YouTube SPA Desktop Residual Hot Timer Class-Closure Continuation/);
  assert.match(doc, /2026-05-30 YouTube SPA desktop residual hot timer class-closure continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for joining the six predicate-specific desktop residual\s+timer addenda back to the full normal desktop residual set without closing any\s+file row/);
  assert.match(doc, /29 YouTube SPA\s+desktop residual class-closure hot timer rows, 6 predicate classes,\s+6 source files, 12 direct user-action rows, 6 startup\/readiness rows,\s+5 DOM-fallback inherited rows, 2 storage dirty-state rows, 2 page-global\s+quick-block rows, 2 explicit list-mode route rows/);
  assert.match(doc, /10 `content_bridge` rows,\s+8 `block_channel` rows, 6 `dom_fallback` rows, 2 `bridge_injection` rows,\s+2 `filter_logic` rows, 1 `injector` row/);
  assert.match(doc, /YouTube SPA desktop residual\s+class-closure cleanup authority, timer delay-change authority, lifecycle\s+pruning authority, owner merge authority, route-teardown authority,\s+native\/menu timing rewrites, metric artifact use, whitelist\/cache\s+optimization, JSON-first promotion, and release\/public-claim use at `NO-GO`/);
  assert.match(lifecycleDoc, /YouTube SPA Desktop Residual Hot Timer Class-Closure Addendum - 2026-05-30/);
  assert.match(lifecycleDoc, /desktop residual class-closure cleanup approval: NO-GO/);
  assert.match(lifecycleDoc, /ASCII YouTube SPA desktop residual hot timer class-closure flow diagram: present/);
}

function assertExplicitTeardownHandleContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Explicit Teardown Handle Continuation/);
  assert.match(doc, /2026-05-28 explicit-teardown handle continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for explicit teardown handles without closing any file\s+row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer\/frame, listener removal, timer clear, interval clear,\s+frame cancel, generated shell freshness, stale-route policy, recycled-node\s+risk, no-work budget/);
  assert.match(doc, /50 explicit teardown handle rows, 9 `removeEventListener` rows, 34\s+`clearTimeout` rows, 4 `clearInterval` rows, 3 `cancelAnimationFrame` rows, 5\s+listener document targets, 2 listener window targets, 2 generated shell\s+listener targets, 12 local timeout id handles, 14 named timeout state handles,\s+8 property-held timeout handles, 2 engine-check interval handles, 1 warmup\s+interval handle, 1 dashboard rotation interval handle, 2 profile dropdown\s+frame handles, and 1 generic position frame handle/);
  assert.match(doc, /explicit teardown\s+cleanup authority, lifecycle pruning authority, route-teardown authority,\s+native\/menu timing authority, and release\/public-claim use at `NO-GO`;\s+runtime behavior changed by this continuation: no/);
  assert.match(lifecycleDoc, /Explicit Teardown Handle Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII explicit teardown flow diagram: present/);
}

function assertAnimationFrameScheduleContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Animation Frame Schedule Continuation/);
  assert.match(doc, /2026-05-28 animation-frame schedule continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for animation frame schedule rows without closing any file\s+row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer\/frame, dashboard scroll timing, profile dropdown\s+positioning, quick-block\/menu frame timing, fallback scan cadence, timer-hop\s+work, stale-route policy, no-work budget/);
  assert.match(doc, /29 `requestAnimationFrame` schedule rows, 2\s+assigned positioning frame handle schedules, 15 inline anonymous frame\s+schedules, 5 identifier callback frame schedules, 5 inline `scrollIntoView`\s+frame schedules, 2 inline timeout-hop frame schedules, 13 content-runtime frame\s+schedules, 16 extension UI\/background frame schedules, 1 `positionRaf`\s+assignment, and 1 `profileDropdownPositionRaf` assignment/);
  assert.match(doc, /animation\s+frame schedule cleanup authority, lifecycle pruning authority, route-teardown\s+authority, native\/menu timing authority, and release\/public-claim use at\s+`NO-GO`; runtime behavior changed by this continuation: no/);
  assert.match(lifecycleDoc, /Animation Frame Schedule Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII animation frame schedule flow diagram: present/);
}

function assertAnimationFrameScheduleCancelParityContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Animation Frame Schedule\/Cancel Parity Continuation/);
  assert.match(doc, /2026-05-28 animation-frame schedule\/cancel parity continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for animation frame schedule\/cancel parity rows without\s+closing any file row/);
  assert.match(doc, /open\s+lifecycle, observer\/listener\/timer\/frame, profile dropdown positioning, shared\s+UI positioning, quick-block\/menu frame timing, fallback scan cadence,\s+unretained one-shot frame scheduling, stale-route policy, no-work budget/);
  assert.match(doc, /29\s+`requestAnimationFrame` schedule rows for parity, 3 `cancelAnimationFrame` rows\s+for parity, 26 animation-frame schedule-minus-cancel delta, 27 frame schedules\s+without assigned handles, 2 frame schedules with assigned handles, 3\s+`cancelAnimationFrame` rows with direct schedule handles, 0\s+`cancelAnimationFrame` rows without direct schedule handles, 2 handled frame\s+schedule rows with cancel handles, 0 handled frame schedule rows without cancel\s+handles, 0 distinct scheduled frame handles without cancel, 13 content-runtime\s+frame schedule\/cancel delta, 13 extension UI\/background frame schedule\/cancel\s+delta, 1 `positionRaf` cancel row, and 2 `profileDropdownPositionRaf` cancel\s+rows/);
  assert.match(doc, /animation frame schedule\/cancel cleanup authority, lifecycle\s+pruning authority, route-teardown authority, native\/menu timing authority, and\s+release\/public-claim use at `NO-GO`; runtime behavior changed by this\s+continuation: no/);
  assert.match(lifecycleDoc, /Animation Frame Schedule\/Cancel Parity Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII animation frame schedule\/cancel parity flow diagram: present/);
}

function assertBackgroundTimerOwnerReasonContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Background Timer Owner\/Reason Continuation/);
  assert.match(doc, /2026-05-28 background timer owner\/reason continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for background timer owner\/reason rows without closing any\s+file row/);
  assert.match(doc, /open lifecycle,\s+observer\/listener\/timer\/frame, background cache flush timing, auto-backup\s+scheduling, post-block enrichment waits, identity fetch timeout behavior,\s+storage write pressure, stale-state\/revision policy, no-work budget/);
  assert.match(doc, /14 background timer\s+lifecycle rows, 10 background `setTimeout` schedule rows, 4 background\s+`clearTimeout` rows, 3 backup\/download background timer rows, 2 post-block\s+enrichment background timer rows, 3 identity map flush background timer rows,\s+6 identity fetch network timeout rows/);
  assert.match(doc, /1 auto-backup debounce schedule row, 1\s+auto-backup debounce clear row, 1 background blob URL revoke delay row, 1\s+post-block enrichment wait-cap row, 1 post-block enrichment jitter row, 1\s+channel map flush debounce row, 1 video channel map flush debounce row, 1\s+video meta map flush debounce row, 3 fetch abort timeout schedule rows, 3\s+fetch abort timeout clear rows, and 0 explicit revision-token rows/);
  assert.match(doc, /background timer owner\/reason cleanup authority, lifecycle pruning authority,\s+background cache revision authority, metric artifact use, and\s+release\/public-claim use at `NO-GO`; runtime behavior changed by this\s+continuation: no/);
  assert.match(lifecycleDoc, /Background Timer Owner\/Reason Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII background timer owner\/reason flow diagram: present/);
}

function assertGeneratedVendorLifecycleFreshnessContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Generated\/Vendor Lifecycle Freshness Continuation/);
  assert.match(doc, /2026-05-28 generated\/vendor lifecycle freshness continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for generated\/vendor lifecycle freshness rows without\s+closing any file row/);
  assert.match(doc, /open\s+lifecycle, observer\/listener\/timer\/frame, generated output freshness, vendor\s+provenance, release package parity, UI shell load-order, source\/hash evidence,\s+no-work budget/);
  assert.match(doc, /12 generated\/vendor lifecycle rows, 8 vendor bundle lifecycle rows, 4\s+generated shell output lifecycle rows, 8 vendor lifecycle `addEventListener`\s+rows, 0 vendor lifecycle `removeEventListener` rows, 2 generated shell\s+lifecycle `addEventListener` rows, 2 generated shell lifecycle\s+`removeEventListener` rows, 2 generated shell lifecycle files, 1 vendor\s+lifecycle file, 3 generated shell source files, 2 generated shell output\s+files, 1 generated UI build script file, 2 vendor bundle files, and 0\s+committed generated freshness manifest files/);
  assert.match(doc, /generated\/vendor\s+lifecycle freshness cleanup authority, lifecycle pruning authority, release\s+package freshness authority, metric artifact use, and release\/public-claim use\s+at `NO-GO`; runtime behavior changed by this continuation: no/);
  assert.match(lifecycleDoc, /Generated\/Vendor Lifecycle Freshness Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII generated\/vendor lifecycle freshness flow diagram: present/);
}

function assertWebsiteComponentLifecycleBoundaryContinuation(doc) {
  const lifecycleDoc = read('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md');

  assert.match(doc, /Website Component Lifecycle Boundary Continuation/);
  assert.match(doc, /2026-05-28 website component lifecycle boundary continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md'));
  assert.ok(doc.includes('tests/runtime/lifecycle-instance-register-current-behavior.test.mjs'));
  assert.match(doc, /tracked-file context for website component lifecycle boundary rows without\s+closing any file row/);
  assert.match(doc, /open\s+website component, runtime lifecycle, route hydration, localStorage\/theme sync,\s+timer budget, visibility\/background behavior, deploy artifact, browser\s+fixture, public-claim/);
  assert.match(doc, /9 website component lifecycle rows, 4 install-or-schedule rows, 5\s+explicit-teardown rows, 3 website component `addEventListener` rows, 3 website\s+component `removeEventListener` rows, 1 website component `setTimeout` row, 2\s+website component `clearTimeout` rows, 2 website lifecycle source files, 5\s+scene scheduler lifecycle rows, 4 theme sync lifecycle rows, 2 scene scheduler\s+install-or-schedule rows, 3 scene scheduler explicit-teardown rows, 2 theme\s+sync install-or-schedule rows, and 2 theme sync explicit-teardown rows/);
  assert.match(doc, /website component lifecycle cleanup authority, lifecycle pruning\s+authority, route hydration authority, website deploy\/public-claim use, metric\s+artifact use, and release\/public-claim use at `NO-GO`; runtime behavior\s+changed by this continuation: no/);
  assert.match(lifecycleDoc, /Website Component Lifecycle Boundary Addendum - 2026-05-28/);
  assert.match(lifecycleDoc, /ASCII website component lifecycle boundary flow diagram: present/);
}

test('tracked_file_obligation_index_is_audit_only_and_keeps_completion_open', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /Completion is not proven/);
  assert.match(doc, /one obligation row for every current `git ls-files` path/);
  assert.match(doc, /not permission to delete, merge, rewrite, ship, or optimize any file/);
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

test('tracked_file_obligation_index_links_whitelist_cache_hot_path_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Whitelist Cache Hot Path Boundary Addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_WHITELIST_CACHE_HOT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md'));
  assert.ok(doc.includes('tests/runtime/whitelist-cache-hot-path-boundary-current-behavior.test.mjs'));
  assert.match(doc, /`js\/content_bridge\.js`, `js\/background\.js`, `js\/content\/bridge_settings\.js`,/);
  assert.match(doc, /`js\/content\/handle_resolver\.js`, and `js\/filter_logic\.js`/);
  assert.match(doc, /5\s+whitelist cache hot-path source files/);
  assert.match(doc, /7 cache hot-path source\/effect blocks/);
  assert.match(doc, /3\s+content bridge cache hot-path blocks/);
  assert.match(doc, /2 background map cache blocks/);
  assert.match(doc, /1 bridge\s+settings refresh block/);
  assert.match(doc, /1 handle resolver cache block/);
  assert.match(doc, /21 selected cache\s+hot-path token counts/);
  assert.match(doc, /runtime behavior changed: yes for duplicate learned-map\s+persistence only/);
  assert.match(doc, /narrow learned-map persistence\/deduped-DOM approval: GO/);
  assert.match(doc, /broader\s+runtime whitelist cache optimization approval: NO-GO/);
  assert.match(doc, /runtime JSON-first\s+cache optimization\s+approval: NO-GO/);
  assert.match(doc, /cache authority/);
  assert.match(doc, /learned-map revision\/freshness/);
  assert.match(doc, /JSON-first cache write effects/);
});

test('tracked_file_obligation_index_represents_every_tracked_file_exactly_once', () => {
  const files = trackedSourceFiles();
  const rows = parseRows(read(docPath));
  const rowPaths = rows.map(row => row.path);

  assert.equal(files.length, 156);
  assert.equal(rows.length, files.length);
  assert.deepEqual([...rowPaths].sort(), [...files].sort());
  assert.equal(new Set(rowPaths).size, files.length);

  for (const row of rows) {
    assert.equal(row.family, classifyTrackedFile(row.path), `${row.path} has stale family`);
    assert.equal(row.status, 'obligation-open', `${row.path} should remain open`);
    assert.notEqual(row.proof.length, 0, `${row.path} is missing proof obligation`);
  }
});

test('tracked_file_obligation_index_covers_runtime_release_docs_vendor_and_website_proof_classes', () => {
  const doc = read(docPath);

  for (const phrase of [
    'Route, mode, source-confidence, side-effect, no-work, teardown, and sibling-visible behavior proof.',
    'Storage mutation, compiled-settings, profile/mode, message trust, UI action, and sync proof.',
    'Claim-to-runtime/test/fixture traceability or explicit unsupported/quarantine classification proof.',
    'Manifest-inactive quarantine and package-risk proof before deletion or activation.',
    'Upstream version/hash, license, API contract, and package freshness proof.',
    'Build, route, metadata, policy/download claim, and responsive browser proof.',
    'Build/deploy/root-directory/env/version compatibility proof.'
  ]) {
    assert.ok(doc.includes(phrase), `missing proof class: ${phrase}`);
  }

  assert.match(doc, /FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25/);
  assert.match(doc, /69 method semantic proof gap files covered/);
  assert.match(doc, /5,789 method semantic proof gap lexical callables covered/);
  assert.match(doc, /0 files with complete per-callable semantic proof/);
});

test('tracked_file_obligation_index_has_no_runtime_authority_yet', () => {
  const doc = read(docPath);
  assert.match(doc, /No runtime symbol exists yet/);
  assert.match(doc, /trackedFileObligationAuthority/);
  assert.match(doc, /perFileBehaviorProofRegistry/);
  assert.match(doc, /trackedFileImplementationReady/);

  const runtime = [
    'js/background.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/filter_logic.js',
    'js/seed.js',
    'js/state_manager.js'
  ].map(read).join('\n');

  assert.doesNotMatch(runtime, /trackedFileObligationAuthority/);
  assert.doesNotMatch(runtime, /perFileBehaviorProofRegistry/);
  assert.doesNotMatch(runtime, /trackedFileImplementationReady/);
});

test('tracked_file_obligation_index_links_static_html_support_script_surface_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Static HTML\/support script surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_STATIC_HTML_SUPPORT_SCRIPT_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/static-html-support-script-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /`html\/popup\.html`, `html\/tab-view\.html`, `html\/troubleshoot\.html`, and `scripts\/compress-video\.swift`/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /loader-order, CSP\/resource, route-state, external-navigation, package, and UI smoke proof/);
  assert.match(doc, /`html\/troubleshoot\.html` still needs a surface decision/);
  assert.match(doc, /empty and has no current product opener/);
  assert.match(doc, /`scripts\/compress-video\.swift` still needs dry-run, atomic output, and failure-mode proof/);
  assert.match(doc, /deletes existing output before export success/);
});

test('tracked_file_obligation_index_links_current_dirty_worktree_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Current dirty worktree audit boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CURRENT_DIRTY_WORKTREE_AUDIT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/current-dirty-worktree-audit-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open implementation-change, source\/evidence, package metadata, tracked-doc claim, runtime-file/);
  assert.match(doc, /16 modified tracked files, 321 additions, 170 deletions/);
  assert.match(doc, /14 public\/core documentation claim-surface rows/);
  assert.match(doc, /one `js\/state_manager\.js` comment-only header edit/);
  assert.match(doc, /one `package\.json` audit-script addition/);
  assert.match(doc, /audit artifact placement under `docs\/audit` and `tests\/runtime`/);
  assert.match(doc, /current tracked JavaScript runtime diff is only StateManager header wording/);
  assert.match(doc, /package diff only exposes `audit:runtime`/);
  assert.match(doc, /public\/core docs remain claim surfaces rather than behavior proof/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /diff classification contracts/);
  assert.match(doc, /runtime-effect reports/);
  assert.match(doc, /package-script gates/);
  assert.match(doc, /public-doc claim review/);
  assert.match(doc, /first-class dirty-worktree audit authority gates are still missing/);
});

test('tracked_file_obligation_index_links_compress_video_script_failure_mode_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Compress-video script failure-mode boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_COMPRESS_VIDEO_SCRIPT_FAILURE_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/compress-video-script-failure-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open support-script, website media optimization, build\/release, performance, reliability, code-burden, and source\/evidence rows/);
  assert.match(doc, /`scripts\/compress-video\.swift`, `package\.json`, `build\.js`, website route\/media docs, and tracked media assets/);
  assert.match(doc, /97 counted source lines/);
  assert.match(doc, /3,339 bytes/);
  assert.match(doc, /196c1ebf918b94e3d36fd2bd04658c4fa4762a85ad5657b49ede7aaa93e2e36b/);
  assert.match(doc, /1 selected `CompressionError` enum/);
  assert.match(doc, /5 selected error cases/);
  assert.match(doc, /1 selected `presetName\(for:\)` function/);
  assert.match(doc, /4 selected `AVAssetExportPreset\*` tokens/);
  assert.match(doc, /1 selected `CommandLine\.arguments` read/);
  assert.match(doc, /1 selected `AVURLAsset` construction/);
  assert.match(doc, /2 selected `AVAssetExportSession` tokens/);
  assert.match(doc, /1 selected `fileExists` check/);
  assert.match(doc, /1 selected `removeItem` call/);
  assert.match(doc, /1 selected `\.mp4` support check/);
  assert.match(doc, /1 selected `shouldOptimizeForNetworkUse` write/);
  assert.match(doc, /1 selected modern `export\(to:as:\)` call/);
  assert.match(doc, /1 selected legacy `exportAsynchronously` call/);
  assert.match(doc, /3 selected `DispatchSemaphore`\/semaphore tokens/);
  assert.match(doc, /1 selected `exporter\.status` switch/);
  assert.match(doc, /2 selected `attributesOfItem` reads/);
  assert.match(doc, /1 selected stdout print/);
  assert.match(doc, /1 selected stderr write/);
  assert.match(doc, /1 selected `exit\(1\)` call/);
  assert.match(doc, /0 selected package scripts referencing `compress-video`/);
  assert.match(doc, /0 selected `build\.js` references/);
  assert.match(doc, /0 selected tracked non-doc source callers outside the script itself/);
  assert.match(doc, /existing output deletion happens before `\.mp4` support checking and before both export paths/);
  assert.match(doc, /no dry-run, temporary-output, move\/replace, source-output manifest, package-script gate, media budget, or failure fixture exists/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /preset manifests/);
  assert.match(doc, /output destruction reports/);
  assert.match(doc, /dry-run plans/);
  assert.match(doc, /temporary-output contracts/);
  assert.match(doc, /atomic replacement contracts/);
  assert.match(doc, /source-output media manifests/);
  assert.match(doc, /package-script gates/);
  assert.match(doc, /media budgets/);
  assert.match(doc, /failure fixtures/);
});

test('tracked_file_obligation_index_links_media_asset_duplicate_derivative_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Media asset duplicate\/derivative boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_MEDIA_ASSET_DUPLICATE_DERIVATIVE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/media-asset-duplicate-derivative-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open extension-assets, website-assets, support-script, build\/release/);
  assert.match(doc, /website route\/media, performance, code-burden, release\/package, public-claim, and source\/evidence rows/);
  assert.match(doc, /`assets\/images\/homepage_hero_day\.mp4`/);
  assert.match(doc, /`website\/assets\/videos\/README\.md`/);
  assert.match(doc, /`website\/assets\/videos\/homepage\/dawn\/prompt\.txt`/);
  assert.match(doc, /`website\/assets\/videos\/homepage\/day\/homepage_hero_day\.mp4`/);
  assert.match(doc, /`website\/assets\/videos\/homepage\/night\/prompt\.txt`/);
  assert.match(doc, /`website\/assets\/videos\/homepage\/sunset\/prompt\.txt`/);
  assert.match(doc, /`website\/assets\/videos\/ios\/ios\.mp4`/);
  assert.match(doc, /`website\/public\/videos\/homepage\/day\/homepage_hero_day\.mp4`/);
  assert.match(doc, /`website\/public\/videos\/homepage\/homepage_hero_day\.mp4`/);
  assert.match(doc, /`website\/public\/videos\/ios\/ios_hero_slow_540\.mp4`/);
  assert.match(doc, /`website\/components\/route-content\.js`/);
  assert.match(doc, /`src\/extension-shell\/popup\.jsx`/);
  assert.match(doc, /`src\/extension-shell\/tab-view-decor\.jsx`/);
  assert.match(doc, /`js\/ui-shell\/popup-shell\.js`/);
  assert.match(doc, /`js\/ui-shell\/tab-view-decor\.js`/);
  assert.match(doc, /10 tracked media\/provenance files/);
  assert.match(doc, /6 selected MP4 files/);
  assert.match(doc, /50,128,618 selected MP4 bytes/);
  assert.match(doc, /4 selected text provenance files/);
  assert.match(doc, /5,999 selected text provenance bytes/);
  assert.match(doc, /3 byte-identical website homepage MP4 files/);
  assert.match(doc, /37,258,272 homepage duplicate-group bytes/);
  assert.match(doc, /24,838,848 duplicate overhead beyond one retained copy/);
  assert.match(doc, /6,152,963 bytes to 2,179,940 bytes/);
  assert.match(doc, /3,973,023 iOS derivative byte reduction/);
  assert.match(doc, /4 selected extension ambient video source\/output references/);
  assert.match(doc, /2 selected website served media URL families/);
  assert.match(doc, /0 selected current source references to `\/videos\/homepage\/homepage_hero_day\.mp4`/);
  assert.match(doc, /0 selected package scripts referencing `compress-video`/);
  assert.match(doc, /0 selected `build\.js` `compress-video` references/);
  assert.match(doc, /0 selected tracked non-doc callers outside `scripts\/compress-video\.swift`/);
  assert.match(doc, /root extension builds copy `assets` wholesale/);
  assert.match(doc, /generated extension shells refer to `\.\.\/assets\/images\/homepage_hero_day\.mp4`/);
  assert.match(doc, /route data serves `\/videos\/homepage\/day\/homepage_hero_day\.mp4` and `\/videos\/ios\/ios_hero_slow_540\.mp4`/);
  assert.match(doc, /one public homepage alias is byte-identical but unreferenced/);
  assert.match(doc, /iOS compression provenance is changelog text plus current file hashes/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /media provenance manifests/);
  assert.match(doc, /derivative manifests/);
  assert.match(doc, /route consumer reports/);
  assert.match(doc, /byte budgets/);
  assert.match(doc, /duplicate cleanup gates/);
  assert.match(doc, /reduced-motion budgets/);
  assert.match(doc, /browser ZIP size budgets/);
  assert.match(doc, /public-claim gates/);
});

test('tracked_file_obligation_index_links_website_route_asset_surface_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Website route\/asset surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WEBSITE_ROUTE_ASSET_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/website-route-asset-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /open `website\/app`, `website\/components`, `website\/assets`, `website\/public`, and website config rows/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /route screenshots\/build proof/);
  assert.match(doc, /public claim artifact gates/);
  assert.match(doc, /asset provenance\/derivative manifests/);
  assert.match(doc, /external navigation\/remotes/);
  assert.match(doc, /media performance budgets/);
  assert.match(doc, /deploy evidence/);
  assert.match(doc, /legacy public-copy deletion proof/);
});

test('tracked_file_obligation_index_links_css_load_style_surface_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /CSS load\/style surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CSS_LOAD_STYLE_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/css-load-style-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /open root CSS rows and `website\/app\/globals\.css`/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /extension popup\/dashboard visual fixtures/);
  assert.match(doc, /responsive\/accessibility proof/);
  assert.match(doc, /manifest\/package proof/);
  assert.match(doc, /false-hide proof for quarantined content CSS/);
  assert.match(doc, /dynamic style lifecycle ownership/);
  assert.match(doc, /website\/extension boundary proof/);
  assert.match(doc, /deletion readiness/);
});

test('tracked_file_obligation_index_links_extension_asset_data_package_surface_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Extension asset\/data package surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_EXTENSION_ASSET_DATA_PACKAGE_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/extension-asset-data-package-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /open `assets\/images`, `icons`, `data\/release_notes\.json`, and `design\/design_tokens\.json` rows/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /package artifact proof/);
  assert.match(doc, /byte and startup budgets/);
  assert.match(doc, /visual fixtures/);
  assert.match(doc, /reduced-motion proof/);
  assert.match(doc, /store\/app icon parity/);
  assert.match(doc, /web-accessible icon parity/);
  assert.match(doc, /release-version gating/);
  assert.match(doc, /native\/app parity/);
  assert.match(doc, /design-token parity/);
  assert.match(doc, /deletion readiness/);
});

test('tracked_file_obligation_index_links_browser_manifest_runtime_load_order_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Browser manifest runtime load-order addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BROWSER_MANIFEST_RUNTIME_LOAD_ORDER_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/browser-manifest-runtime-load-order-current-behavior\.test\.mjs/);
  assert.match(doc, /open `manifest\.json`, `manifest\.chrome\.json`, `manifest\.firefox\.json`, and `manifest\.opera\.json` rows/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /browser package artifacts/);
  assert.match(doc, /startup readiness reports/);
  assert.match(doc, /host-scope classification/);
  assert.match(doc, /resource reasons/);
  assert.match(doc, /permission-feature mapping/);
  assert.match(doc, /package quarantine proof/);
  assert.match(doc, /build validation/);
  assert.match(doc, /browser-specific smoke fixtures/);
});

test('tracked_file_obligation_index_links_root_package_metadata_script_surface_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Root package metadata script surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_ROOT_PACKAGE_METADATA_SCRIPT_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/root-package-metadata-script-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /open `.gitignore`, `CHANGELOG\.md`, `LICENSE`, `README\.md`, `channel-identity-watch-mix-collab-recovery-plan\.md`, `package\.json`, and `package-lock\.json` rows/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /package script execution proof/);
  assert.match(doc, /dependency reproducibility and deprecation review/);
  assert.match(doc, /public claim parity/);
  assert.match(doc, /release-version gating/);
  assert.match(doc, /reduced JSON fixture provenance/);
  assert.match(doc, /dev-manifest dirty-worktree gates/);
  assert.match(doc, /raw-capture evidence boundaries/);
  assert.match(doc, /first-class JSON filter promotion gates/);
});

test('tracked_file_obligation_index_links_json_first_reference_docs_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first reference doc surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_REFERENCE_DOC_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/json-first-reference-doc-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /open `docs\/JSON_FIRST_FILTERING_PLAN\.md`, `docs\/json_paths_encyclopedia\.md`, `docs\/watch_json_paths\.md`, and `docs\/youtube_renderer_inventory\.md` rows/);
  assert.match(doc, /This does not close those rows/);
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
  assert.match(doc, /first-class JSON filter promotion gates/);
});

test('tracked_file_obligation_index_links_tracked_public_doc_claim_surface_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Tracked public doc claim surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_TRACKED_PUBLIC_DOC_CLAIM_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/tracked-public-doc-claim-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /all open tracked-doc rows except the four JSON-reference rows/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /claim-to-runtime traceability/);
  assert.match(doc, /line-specific reliability proof/);
  assert.match(doc, /route\/surface\/profile\/list-mode fixtures/);
  assert.match(doc, /release artifact parity/);
  assert.match(doc, /native app revision and generated-runtime freshness proof/);
  assert.match(doc, /performance metric artifacts/);
  assert.match(doc, /network\/lifecycle no-work budgets/);
  assert.match(doc, /ignored-doc migration decisions/);
  assert.match(doc, /public docs deletion readiness/);
  assert.match(doc, /first-class JSON filter promotion gates/);
});

test('tracked_file_obligation_index_links_generated_local_output_dependency_surface_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Generated local output\/dependency surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_GENERATED_LOCAL_OUTPUT_DEPENDENCY_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/generated-local-output-dependency-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /does not add tracked-file rows/);
  assert.match(doc, /`dist`, `node_modules`, `website\/\.next`, `website\/\.vercel`, and `website\/node_modules` remain ignored local output or dependency caches/);
  assert.match(doc, /outside `git ls-files`/);
  assert.match(doc, /open rows for `build\.js`, `\.gitignore`, `package\.json`, `package-lock\.json`, website config, website package metadata/);
  assert.match(doc, /generated UI output, vendor bundles, quarantined CSS, empty HTML, and release\/public-claim surfaces/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /package manifest authority/);
  assert.match(doc, /ZIP checksum release gates/);
  assert.match(doc, /clean dependency reproducibility/);
  assert.match(doc, /website route screenshot\/deploy evidence/);
  assert.match(doc, /generated output freshness/);
  assert.match(doc, /cleanup decisions/);
  assert.match(doc, /first-class JSON filter package gates/);
});

test('tracked_file_obligation_index_links_website_package_config_dependency_surface_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Website package\/config dependency surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WEBSITE_PACKAGE_CONFIG_DEPENDENCY_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/website-package-config-dependency-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /open `website\/\.gitignore`, `website\/\.vercelignore`, `website\/jsconfig\.json`, `website\/next\.config\.mjs`, `website\/package\.json`, `website\/package-lock\.json`, and `website\/postcss\.config\.mjs` rows/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /clean dependency reproducibility/);
  assert.match(doc, /build proof/);
  assert.match(doc, /route smoke proof/);
  assert.match(doc, /analytics scope proof/);
  assert.match(doc, /config parity with generated `\.next`\/`\.vercel` output/);
  assert.match(doc, /deploy artifact gates/);
  assert.match(doc, /first-class JSON public-claim gates/);
});

test('tracked_file_obligation_index_links_json_first_whitelist_decision_identity_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first whitelist decision identity boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_WHITELIST_DECISION_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-whitelist-decision-identity-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /adds current-behavior proof for the open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, filter-logic, whitelist mode, identity confidence, creator-page fallback, comment bypass, and cross-feature rows in `js\/filter_logic\.js`/);
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
  assert.match(doc, /empty whitelist fail-closed behavior/);
  assert.match(doc, /channel allow behavior/);
  assert.match(doc, /keyword allow\/no-match behavior/);
  assert.match(doc, /creator-page fallback behavior/);
  assert.match(doc, /unresolved identity fail-closed behavior/);
  assert.match(doc, /comment whitelist bypass behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /decision contracts/);
  assert.match(doc, /identity reports/);
  assert.match(doc, /empty-rule policies/);
  assert.match(doc, /channel allow reports/);
  assert.match(doc, /keyword allow reports/);
  assert.match(doc, /creator-page fallback reports/);
  assert.match(doc, /unresolved identity policies/);
  assert.match(doc, /comment policies/);
  assert.match(doc, /no-match reasons/);
  assert.match(doc, /first-class whitelist decision identity authority gates/);
});

test('tracked_file_obligation_index_links_website_client_lifecycle_surface_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Website client lifecycle surface addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WEBSITE_CLIENT_LIFECYCLE_SURFACE_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/website-client-lifecycle-surface-current-behavior\.test\.mjs/);
  assert.match(doc, /open website app\/component rows/);
  assert.match(doc, /`website\/app\/layout\.js`, `website\/components\/scene-controller\.js`, `website\/components\/site-header\.js`, and `website\/components\/theme-toggle\.js`/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /route smoke proof/);
  assert.match(doc, /browser screenshots/);
  assert.match(doc, /accessibility fixtures/);
  assert.match(doc, /timer\/listener budgets/);
  assert.match(doc, /localStorage error and cross-tab fixtures/);
  assert.match(doc, /analytics\/remote request policy/);
  assert.match(doc, /deploy artifact evidence/);
  assert.match(doc, /public-claim parity proof/);
  assert.match(doc, /first-class JSON public-claim gates/);
});

test('tracked_file_obligation_index_links_website_route_component_render_graph_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Website route\/component render graph addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WEBSITE_ROUTE_COMPONENT_RENDER_GRAPH_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/website-route-component-render-graph-current-behavior\.test\.mjs/);
  assert.match(doc, /open website app\/component rows/);
  assert.match(doc, /22 app\/component JavaScript files/);
  assert.match(doc, /route exports/);
  assert.match(doc, /component imports/);
  assert.match(doc, /render primitive counts/);
  assert.match(doc, /dynamic platform route behavior/);
  assert.match(doc, /sitemap route generation/);
  assert.match(doc, /`route-content\.js` data ownership/);
  assert.match(doc, /unimported `website\/components\/site-data\.js` burden/);
  assert.match(doc, /2026-05-27 `BrowserLogoRail` method-semantic addendum/);
  assert.match(doc, /dated one-callable obligation slice/);
  assert.match(doc, /`website\/components\/browser-logo-rail\.js`/);
  assert.match(doc, /external anchor and plain image rendering/);
  assert.match(doc, /six remote logo rows/);
  assert.match(doc, /no extension runtime side effects/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /route smoke\/build proof/);
  assert.match(doc, /browser screenshots/);
  assert.match(doc, /accessibility fixtures/);
  assert.match(doc, /external-navigation policy/);
  assert.match(doc, /media budgets/);
  assert.match(doc, /deploy artifact evidence/);
  assert.match(doc, /public-claim parity/);
  assert.match(doc, /runtime\/native parity/);
  assert.match(doc, /deletion readiness for legacy data/);
  assert.match(doc, /first-class JSON public-claim gates/);
});

test('tracked_file_obligation_index_links_website_dynamic_route_method_semantics_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Website dynamic route method semantic register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WEBSITE_DYNAMIC_ROUTE_METHOD_SEMANTIC_REGISTER_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/website-dynamic-route-method-semantic-register-current-behavior\.test\.mjs/);
  assert.match(doc, /open `website\/app\/\[slug\]\/page\.js`, `website\/components\/route-content\.js`, `website\/components\/site-shell-data\.js`, and `website\/components\/scenic-detail-page\.js` rows/);
  assert.match(doc, /dynamic route method rows/);
  assert.match(doc, /static params/);
  assert.match(doc, /metadata/);
  assert.match(doc, /render-time `notFound\(\)`/);
  assert.match(doc, /related-page filtering/);
  assert.match(doc, /platform\/detail data parity/);
  assert.match(doc, /zero route-local fetch\/timer\/listener\/observer primitives/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /route manifests/);
  assert.match(doc, /route smoke\/build proof/);
  assert.match(doc, /browser screenshots/);
  assert.match(doc, /accessibility fixtures/);
  assert.match(doc, /metadata\/public-claim parity/);
  assert.match(doc, /media budgets/);
  assert.match(doc, /release artifact references/);
  assert.match(doc, /native runtime freshness/);
  assert.match(doc, /related-page negative fixtures/);
  assert.match(doc, /first-class JSON public-claim gates/);
});

test('tracked_file_obligation_index_links_website_route_build_smoke_artifacts_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Website route build-smoke artifact boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WEBSITE_ROUTE_BUILD_SMOKE_ARTIFACT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/website-route-build-smoke-artifact-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open website app, component, route-data, package\/config, generated-output, public-claim, and deployment rows/);
  assert.match(doc, /current ignored `\.next` route artifact set/);
  assert.match(doc, /13 source-derived public routes with generated html\/rsc\/meta triplets/);
  assert.match(doc, /18 generated prerender routes/);
  assert.match(doc, /1 generated dynamic route/);
  assert.match(doc, /13 sitemap `<loc>` entries/);
  assert.match(doc, /build id `mU-54AWzEaOTVx1n8fwjP`/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /fresh build command reports/);
  assert.match(doc, /clean dependency reproducibility/);
  assert.match(doc, /browser screenshots/);
  assert.match(doc, /accessibility fixtures/);
  assert.match(doc, /hydration proof/);
  assert.match(doc, /media budgets/);
  assert.match(doc, /deploy artifact evidence/);
  assert.match(doc, /public-claim parity/);
  assert.match(doc, /native runtime freshness/);
  assert.match(doc, /first-class JSON public-claim gates/);
});

test('tracked_file_obligation_index_links_storage_access_callsite_register_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Storage access callsite register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_STORAGE_ACCESS_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-21\.md/);
  assert.match(doc, /tests\/runtime\/storage-access-callsite-register-current-behavior\.test\.mjs/);
  assert.match(doc, /open storage-affecting rows/);
  assert.match(doc, /`js\/background\.js`, `js\/content\/bridge_settings\.js`, `js\/content\/handle_resolver\.js`, `js\/content_bridge\.js`, `js\/io_manager\.js`, `js\/settings_shared\.js`, `js\/state_manager\.js`, and `js\/tab-view\.js`/);
  assert.match(doc, /57 raw direct storage rows/);
  assert.match(doc, /27 wrapper callsite rows/);
  assert.match(doc, /storage listener split across background\/content\/dashboard owners/);
  assert.match(doc, /compile read-path write behavior/);
  assert.match(doc, /learned-map write surfaces/);
  assert.match(doc, /payload-shaped writes/);
  assert.match(doc, /dynamic Nanah trusted-link storage through `\[key\]`/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /row-level fixtures/);
  assert.match(doc, /schema ownership/);
  assert.match(doc, /settings-mode matrices/);
  assert.match(doc, /listener parity/);
  assert.match(doc, /revision reports/);
  assert.match(doc, /map-only budgets/);
  assert.match(doc, /dashboard\/content refresh parity/);
  assert.match(doc, /no-work evidence/);
  assert.match(doc, /first-class storage authority gates/);
});

test('tracked_file_obligation_index_links_message_transport_callsite_register_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Message transport callsite register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_MESSAGE_TRANSPORT_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/message-transport-callsite-register-current-behavior\.test\.mjs/);
  assert.match(doc, /open message-affecting rows/);
  assert.match(doc, /`js\/background\.js`, `js\/content\/bridge_injection\.js`, `js\/content\/bridge_settings\.js`, `js\/content\/collab_dialog\.js`, `js\/content\/first_run_prompt\.js`, `js\/content\/handle_resolver\.js`, `js\/content\/release_notes_prompt\.js`, `js\/content_bridge\.js`, `js\/filter_logic\.js`, `js\/injector\.js`, `js\/popup\.js`, `js\/seed\.js`, `js\/state_manager\.js`, and `js\/tab-view\.js`/);
  assert.match(doc, /64 message transport rows/);
  assert.match(doc, /4 runtime receivers/);
  assert.match(doc, /27 runtime senders/);
  assert.match(doc, /3 tab-message senders/);
  assert.match(doc, /4 page-message receivers/);
  assert.match(doc, /26 page-message senders/);
  assert.match(doc, /split background\/content\/dashboard\/main-world receivers/);
  assert.match(doc, /runtime mutation senders/);
  assert.match(doc, /learned-map page-message rows/);
  assert.match(doc, /settings relay/);
  assert.match(doc, /subscription import/);
  assert.match(doc, /tab-message rows/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /sender-class fixtures/);
  assert.match(doc, /pending-request proof/);
  assert.match(doc, /nonce\/origin policy/);
  assert.match(doc, /tab-route proof/);
  assert.match(doc, /settings-revision ownership/);
  assert.match(doc, /no-work budgets/);
  assert.match(doc, /teardown decisions/);
  assert.match(doc, /negative-spoof fixtures/);
  assert.match(doc, /first-class message transport gates/);
});

test('tracked_file_obligation_index_links_network_fetch_xhr_callsite_register_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Network fetch\/XHR callsite register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_NETWORK_FETCH_XHR_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/network-fetch-xhr-callsite-register-current-behavior\.test\.mjs/);
  assert.match(doc, /open network-affecting rows/);
  assert.match(doc, /`js\/background\.js`, `js\/content\/handle_resolver\.js`, `js\/content_bridge\.js`, `js\/injector\.js`, `js\/seed\.js`, and `js\/tab-view\.js`/);
  assert.match(doc, /29 network fetch\/XHR rows/);
  assert.match(doc, /16 request primitive rows/);
  assert.match(doc, /13 response consumption rows/);
  assert.match(doc, /13 fetch rows/);
  assert.match(doc, /3 XHR prototype rows/);
  assert.match(doc, /3 stream reader rows/);
  assert.match(doc, /3 JSON body rows/);
  assert.match(doc, /7 text body rows/);
  assert.match(doc, /extension release notes/);
  assert.match(doc, /background identity\/channel fetches/);
  assert.match(doc, /direct handle\/watch\/Shorts fetches/);
  assert.match(doc, /subscription import/);
  assert.match(doc, /seed passive fetch decode/);
  assert.match(doc, /seed XHR patches/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /network owner/);
  assert.match(doc, /credentials/);
  assert.match(doc, /dedupe/);
  assert.match(doc, /body-parse budget/);
  assert.match(doc, /XHR patch budget/);
  assert.match(doc, /JSON-first body decisions/);
  assert.match(doc, /no-rule\/disabled proof/);
  assert.match(doc, /sibling-visible fixtures/);
  assert.match(doc, /first-class network authority gates/);
});

test('tracked_file_obligation_index_links_compiled_settings_field_register_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Compiled settings field register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_COMPILED_SETTINGS_FIELD_REGISTER_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/compiled-settings-field-register-current-behavior\.test\.mjs/);
  assert.match(doc, /open compiled-settings and settings-consumer rows/);
  assert.match(doc, /`js\/background\.js`, `js\/settings_shared\.js`, `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content_bridge\.js`, and `js\/content\/bridge_settings\.js`/);
  assert.match(doc, /274 raw compiled\/settings field rows/);
  assert.match(doc, /130 unique file-field-operation rows/);
  assert.match(doc, /44 background compiled fields/);
  assert.match(doc, /36 shared UI compiled fields/);
  assert.match(doc, /8 background-only compiled fields/);
  assert.match(doc, /7 filter-logic processed fields/);
  assert.match(doc, /10 seed cached-settings fields/);
  assert.match(doc, /6 content-bridge current-settings fields/);
  assert.match(doc, /4 bridge-settings settings fields/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /field ownership/);
  assert.match(doc, /compiler parity/);
  assert.match(doc, /JSON-first field decisions/);
  assert.match(doc, /profile\/list-mode authority/);
  assert.match(doc, /storage revision policy/);
  assert.match(doc, /message relay policy/);
  assert.match(doc, /seed\/filter\/bridge work budgets/);
  assert.match(doc, /DOM\/native parity/);
  assert.match(doc, /negative fixtures/);
  assert.match(doc, /first-class compiled-settings authority gates/);
});

test('tracked_file_obligation_index_links_settings_refresh_key_parity_register_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Settings refresh key parity register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SETTINGS_REFRESH_KEY_PARITY_REGISTER_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/settings-refresh-key-parity-register-current-behavior\.test\.mjs/);
  assert.match(doc, /open settings refresh and invalidation rows/);
  assert.match(doc, /`js\/background\.js`, `js\/settings_shared\.js`, `js\/content\/bridge_settings\.js`, and `js\/state_manager\.js`/);
  assert.match(doc, /7 key owner sets/);
  assert.match(doc, /49 unique keys/);
  assert.match(doc, /43 background compiler read keys/);
  assert.match(doc, /14 background invalidation keys/);
  assert.match(doc, /36 shared settings keys/);
  assert.match(doc, /42 content bridge refresh keys/);
  assert.match(doc, /39 StateManager reload keys/);
  assert.match(doc, /30 compiler keys not invalidated by background/);
  assert.match(doc, /map-only video key refresh behavior/);
  assert.match(doc, /`channelMap` early return/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /one refresh key manifest/);
  assert.match(doc, /settings revision contract/);
  assert.match(doc, /dirty-key\/no-op decisions/);
  assert.match(doc, /consumer refresh matrix/);
  assert.match(doc, /seed\/main-world\/UI\/DOM refresh decisions/);
  assert.match(doc, /per-key work budgets/);
  assert.match(doc, /negative fixtures/);
  assert.match(doc, /first-class settings refresh authority gates/);
});

test('tracked_file_obligation_index_links_json_first_active_work_predicate_register_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first active work predicate register addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-active-work-predicate-register-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, no-work, lifecycle, endpoint, DOM fallback, quick-block, and category-metadata rows/);
  assert.match(doc, /`js\/seed\.js`, `js\/filter_logic\.js`, `js\/content\/dom_fallback\.js`, `js\/content\/block_channel\.js`, and `js\/content_bridge\.js`/);
  assert.match(doc, /11 predicate anchors/);
  assert.match(doc, /2 endpoint key sets with 5 entries each/);
  assert.match(doc, /3 seed content-filter branches/);
  assert.match(doc, /6 seed JSON active-rule branches/);
  assert.match(doc, /3 seed skip route classes/);
  assert.match(doc, /4 work classes in `processWithEngine\(\)`/);
  assert.match(doc, /36 DOM fallback active triggers/);
  assert.match(doc, /28 DOM fallback boolean keys/);
  assert.match(doc, /fallback menu warmup work/);
  assert.match(doc, /quick-block setup delay/);
  assert.match(doc, /no quick-block periodic timer after the 2026-05-25 SPA drag optimization addendum/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /unified active-work decision/);
  assert.match(doc, /category selected-value proof/);
  assert.match(doc, /parse\/stringify budgets/);
  assert.match(doc, /harvest\/mutation budgets/);
  assert.match(doc, /DOM scan budgets/);
  assert.match(doc, /menu repair budgets/);
  assert.match(doc, /quick-block lifecycle budgets/);
  assert.match(doc, /metadata fetch budgets/);
  assert.match(doc, /negative fixtures/);
  assert.match(doc, /sibling-visible fixtures/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class JSON work authority gates/);
});

test('tracked_file_obligation_index_links_json_first_metric_artifact_gate_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first metric artifact gate addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_METRIC_ARTIFACT_GATE_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-metric-artifact-gate-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, no-work optimization, performance-risk, runtime lifecycle, resolver, network, storage, stats, DOM fallback, false-hide\/leak, code-burden, cross-feature, source\/evidence, and implementation-change rows in `js\/seed\.js`, `js\/filter_logic\.js`, `js\/content_bridge\.js`, `js\/content\/dom_fallback\.js`, `js\/content\/block_channel\.js`, `js\/content\/handle_resolver\.js`, `js\/background\.js`, `js\/state_manager\.js`, and `js\/settings_shared\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /route\/surface\/list-mode sample artifacts/);
  assert.match(doc, /parse\/stringify\/processData\/harvest\/listener\/observer\/timer\/network\/storage\/hide\/restore counters/);
  assert.match(doc, /DOM\/native parity measurement/);
  assert.match(doc, /resolver budget metrics/);
  assert.match(doc, /storage budget metrics/);
  assert.match(doc, /optimization measurement fixtures/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class JSON metric authority gates/);
});

test('tracked_file_obligation_index_links_json_first_response_mutation_contract_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first response mutation contract addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-response-mutation-contract-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first response mutation and network transport row in `js\/seed\.js`/);
  assert.match(doc, /5 fetch endpoints/);
  assert.match(doc, /5 XHR endpoints/);
  assert.match(doc, /2 fetch response replacement branches/);
  assert.match(doc, /3 preserved response metadata fields/);
  assert.match(doc, /3 fetch pass-through branches/);
  assert.match(doc, /2 XHR body parse modes/);
  assert.match(doc, /2 XHR modified response fields/);
  assert.match(doc, /2 per-instance XHR property overrides/);
  assert.match(doc, /4 listener hook sites/);
  assert.match(doc, /nonmatching\/non-OK\/invalid JSON pass-through behavior/);
  assert.match(doc, /active fetch response rebuild metadata preservation/);
  assert.match(doc, /harvest-only matching fetch parse\/stringify cost/);
  assert.match(doc, /substring endpoint matching/);
  assert.match(doc, /This does not close that row/);
  assert.match(doc, /parsed endpoint policy/);
  assert.match(doc, /content-type\/cache\/stream response contract/);
  assert.match(doc, /active-rule mutation permission/);
  assert.match(doc, /disabled\/no-rule response budgets/);
  assert.match(doc, /comment-continuation sibling proof/);
  assert.match(doc, /XHR override compatibility/);
  assert.match(doc, /negative endpoint fixtures/);
  assert.match(doc, /sibling-visible fixtures/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class response mutation authority gates/);
});

test('tracked_file_obligation_index_links_json_first_endpoint_match_policy_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first endpoint match policy addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_ENDPOINT_MATCH_POLICY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-endpoint-match-policy-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first endpoint classification and network transport row in `js\/seed\.js`/);
  assert.match(doc, /5 fetch endpoints/);
  assert.match(doc, /5 XHR endpoints/);
  assert.match(doc, /duplicated local endpoint arrays/);
  assert.match(doc, /4 raw substring match sites/);
  assert.match(doc, /2 parsed pathname label sites/);
  assert.match(doc, /0 pre-match parsed URL policy gates/);
  assert.match(doc, /query-only endpoint text current positive matches/);
  assert.match(doc, /longer-path endpoint text current positive matches/);
  assert.match(doc, /nonmatching bypass fixtures/);
  assert.match(doc, /Request-object fetch admission/);
  assert.match(doc, /URL-object XHR admission/);
  assert.match(doc, /XHR send re-mark behavior/);
  assert.match(doc, /This does not close that row/);
  assert.match(doc, /parsed origin\/hostname\/pathname\/search policy/);
  assert.match(doc, /endpoint segment-boundary proof/);
  assert.match(doc, /exact endpoint fixtures/);
  assert.match(doc, /negative query-only fixtures/);
  assert.match(doc, /negative longer-path fixtures/);
  assert.match(doc, /malformed\/relative URL fixtures/);
  assert.match(doc, /shared fetch\/XHR\/comment shortcut parity/);
  assert.match(doc, /route\/surface\/list-mode permission/);
  assert.match(doc, /body-work permission/);
  assert.match(doc, /first-class endpoint match authority gates/);
});

test('tracked_file_obligation_index_links_json_first_url_normalization_contract_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first URL normalization contract addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_URL_NORMALIZATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-url-normalization-contract-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first URL normalization and network transport row in `js\/seed\.js`/);
  assert.match(doc, /2 parsed pathname helper definitions/);
  assert.match(doc, /1 unique parsed pathname helper body/);
  assert.match(doc, /0 pre-match parsed pathname callsites/);
  assert.match(doc, /2 post-match parsed pathname label callsites/);
  assert.match(doc, /2 parsed URL base-origin fallback sites/);
  assert.match(doc, /2 split-query fallback sites/);
  assert.match(doc, /3 raw URL stringification sites before match/);
  assert.match(doc, /1 Request\.url extraction site/);
  assert.match(doc, /1 raw object includes shortcut site/);
  assert.match(doc, /0 origin\/hostname\/hash\/query gates before match/);
  assert.match(doc, /relative URL admission/);
  assert.match(doc, /cross-origin exact-path admission/);
  assert.match(doc, /hash-fragment endpoint-text admission/);
  assert.match(doc, /malformed raw endpoint admission/);
  assert.match(doc, /fetch URL-object parse-without-process behavior/);
  assert.match(doc, /fetch Request-object processing/);
  assert.match(doc, /XHR URL-object marking/);
  assert.match(doc, /This does not close that row/);
  assert.match(doc, /one parsed URL decision/);
  assert.match(doc, /same-origin\/cross-origin policy/);
  assert.match(doc, /relative\/malformed URL policy/);
  assert.match(doc, /hash\/query negative fixtures/);
  assert.match(doc, /URL value-kind policy/);
  assert.match(doc, /shared fetch\/XHR parser parity/);
  assert.match(doc, /comment shortcut permission/);
  assert.match(doc, /body-work permission/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class URL normalization authority gates/);
});

test('tracked_file_obligation_index_links_json_first_comment_continuation_shortcut_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first comment continuation shortcut addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_COMMENT_CONTINUATION_SHORTCUT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-comment-continuation-shortcut-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first comment continuation and network transport row in `js\/seed\.js`/);
  assert.match(doc, /1 fetch-only shortcut branch/);
  assert.match(doc, /1 raw `\/youtubei\/v1\/next` shortcut gate/);
  assert.match(doc, /1 `hideAllComments` guard/);
  assert.match(doc, /1 response collection root checked by the shortcut/);
  assert.match(doc, /1 continuation command shape checked by the shortcut/);
  assert.match(doc, /2 comment renderer item shapes checked by the shortcut/);
  assert.match(doc, /1 synthetic response replacement branch/);
  assert.match(doc, /1 synthetic end marker item/);
  assert.match(doc, /1 `continuationEndpoint: null` writer site/);
  assert.match(doc, /3 metadata fields preserved by the shortcut response/);
  assert.match(doc, /append comment endpoint engine-bypass behavior/);
  assert.match(doc, /reload\/replace command misses/);
  assert.match(doc, /`onResponseReceivedActions` miss behavior/);
  assert.match(doc, /non-comment fallback behavior/);
  assert.match(doc, /disabled-shortcut fallback behavior/);
  assert.match(doc, /non-next endpoint fallback behavior/);
  assert.match(doc, /This does not close that row/);
  assert.match(doc, /parsed endpoint policy/);
  assert.match(doc, /collection-root parity/);
  assert.match(doc, /append\/reload\/replace command parity/);
  assert.match(doc, /XHR parity/);
  assert.match(doc, /comment renderer shape provenance/);
  assert.match(doc, /sibling-preservation proof/);
  assert.match(doc, /no-work budgets/);
  assert.match(doc, /response metadata\/body-mode proof/);
  assert.match(doc, /route\/surface\/list-mode permission/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class comment continuation authority gates/);
});

test('tracked_file_obligation_index_links_json_first_xhr_response_override_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first XHR response override contract addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_XHR_RESPONSE_OVERRIDE_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-xhr-response-override-contract-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first XHR response override and network transport row in `js\/seed\.js`/);
  assert.match(doc, /5 XHR endpoints/);
  assert.match(doc, /2 pre-body mark sites/);
  assert.match(doc, /2 send-time ready\/load hooks/);
  assert.match(doc, /2 listener wrapper hook sites/);
  assert.match(doc, /7 pre-parse guards/);
  assert.match(doc, /2 body parse modes/);
  assert.match(doc, /2 modified response backing fields/);
  assert.match(doc, /2 per-instance getter overrides/);
  assert.match(doc, /text-like response string reads/);
  assert.match(doc, /JSON response object\/string split reads/);
  assert.match(doc, /late guard no-mutation cases/);
  assert.match(doc, /listener wrapper read-order behavior/);
  assert.match(doc, /This does not close that row/);
  assert.match(doc, /shared endpoint policy/);
  assert.match(doc, /body-mode decisions/);
  assert.match(doc, /listener-hook permission/);
  assert.match(doc, /mutation permission/);
  assert.match(doc, /getter compatibility/);
  assert.match(doc, /page-listener read-order proof/);
  assert.match(doc, /override lifetime\/teardown proof/);
  assert.match(doc, /pass-through reason records/);
  assert.match(doc, /negative fixtures/);
  assert.match(doc, /route\/surface\/list-mode permission/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class XHR response override authority gates/);
});

test('tracked_file_obligation_index_links_json_first_fetch_response_rebuild_metadata_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first fetch response rebuild metadata contract addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_FETCH_RESPONSE_REBUILD_METADATA_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-fetch-response-rebuild-metadata-contract-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first fetch response rebuild and network transport row in `js\/seed\.js`/);
  assert.match(doc, /5 fetch endpoints/);
  assert.match(doc, /1 clone JSON body-read site/);
  assert.match(doc, /2 response rebuild branches/);
  assert.match(doc, /2 `new Response` body writer sites/);
  assert.match(doc, /2 `JSON\.stringify` rebuild body sites/);
  assert.match(doc, /3 selected metadata fields preserved per rebuild/);
  assert.match(doc, /6 selected metadata assignment sites/);
  assert.match(doc, /2 headers object pass-through sites/);
  assert.match(doc, /0 header clone\/copy sites/);
  assert.match(doc, /0 content-type decision sites/);
  assert.match(doc, /0 body-mode decision sites/);
  assert.match(doc, /0 response identity metadata writer sites/);
  assert.match(doc, /normal and comment shortcut rebuild identity drift/);
  assert.match(doc, /3 original-response pass-through branches/);
  assert.match(doc, /This does not close that row/);
  assert.match(doc, /shared endpoint policy/);
  assert.match(doc, /body-mode decisions/);
  assert.match(doc, /content-type policy/);
  assert.match(doc, /header clone\/copy policy/);
  assert.match(doc, /response identity compatibility/);
  assert.match(doc, /stream\/cache\/trailer\/body-used policy/);
  assert.match(doc, /pass-through reason records/);
  assert.match(doc, /active-rule mutation permission/);
  assert.match(doc, /route\/surface\/list-mode permission/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class fetch response rebuild authority gates/);
});

test('tracked_file_obligation_index_links_json_first_pending_queue_replay_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first pending queue replay contract addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_PENDING_QUEUE_REPLAY_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-pending-queue-replay-contract-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first pending queue, startup replay, lifecycle timer, settings-mode, and network transport rows in `js\/seed\.js`/);
  assert.match(doc, /1 queue state declaration/);
  assert.match(doc, /2 replay timer state declarations/);
  assert.match(doc, /1 replay function/);
  assert.match(doc, /1 schedule function/);
  assert.match(doc, /a 250 ms delay/);
  assert.match(doc, /1 direct no-settings queue push site/);
  assert.match(doc, /0 direct no-settings cap\/schedule sites/);
  assert.match(doc, /1 `queueForLater\(\)` push site/);
  assert.match(doc, /the 60\/40 helper cap policy/);
  assert.match(doc, /2 helper reason callsites/);
  assert.match(doc, /2 queued data clone sites/);
  assert.match(doc, /`-queued` and `-replay` suffixes/);
  assert.match(doc, /2 queued global assignment branches/);
  assert.match(doc, /fetch no-settings queue behavior/);
  assert.match(doc, /direct no-settings over-cap behavior/);
  assert.match(doc, /engine-missing timer replay behavior/);
  assert.match(doc, /queued global setter reentry/);
  assert.match(doc, /This does not close that row/);
  assert.match(doc, /queue admission reasons/);
  assert.match(doc, /queue cap policy/);
  assert.match(doc, /settings revision at admission\/replay/);
  assert.match(doc, /engine readiness state/);
  assert.match(doc, /active-rule state/);
  assert.match(doc, /queued item size\/age/);
  assert.match(doc, /timer install\/teardown policy/);
  assert.match(doc, /replay work budgets/);
  assert.match(doc, /response effect policy/);
  assert.match(doc, /global assignment guard/);
  assert.match(doc, /setter reentry policy/);
  assert.match(doc, /pass-through reasons/);
  assert.match(doc, /route\/surface\/list-mode permission/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class pending queue replay authority gates/);
});

test('tracked_file_obligation_index_links_json_first_network_snapshot_stash_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first network snapshot stash contract addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_STASH_CONTRACT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-stash-contract-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first network snapshot, learned-identity, subscription import, endpoint, settings-mode, and cross-feature consumer rows in `js\/seed\.js` and `js\/injector\.js`/);
  assert.match(doc, /4 seed endpoint families written/);
  assert.match(doc, /1 intercepted endpoint family not written/);
  assert.match(doc, /latest search\/next\/browse\/player snapshot fields/);
  assert.match(doc, /recent search\/browse arrays with a 12-entry retained tail/);
  assert.match(doc, /3 process\/stash callsites/);
  assert.match(doc, /2 settings-update initial-global snapshot assignments/);
  assert.match(doc, /3 injector consumer clusters/);
  assert.match(doc, /search\/browse recent cap behavior/);
  assert.match(doc, /next\/player latest-only behavior/);
  assert.match(doc, /missing guide snapshot behavior/);
  assert.match(doc, /harvest-only original-data stashing/);
  assert.match(doc, /This does not close that row/);
  assert.match(doc, /snapshot admission decisions/);
  assert.match(doc, /endpoint-to-snapshot policy/);
  assert.match(doc, /freshness and timestamp policy/);
  assert.match(doc, /clone\/mutation isolation/);
  assert.match(doc, /retention policy/);
  assert.match(doc, /guide endpoint policy/);
  assert.match(doc, /next\/player history policy/);
  assert.match(doc, /consumer route\/profile permission/);
  assert.match(doc, /source-effect provenance/);
  assert.match(doc, /stale\/missing snapshot fixtures/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class network snapshot authority gates/);
});

test('tracked_file_obligation_index_links_json_first_network_snapshot_consumer_freshness_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first network snapshot consumer freshness addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_FRESHNESS_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-freshness-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first network snapshot, learned-identity, subscription import, settings-mode, and cross-feature consumer rows in `js\/injector\.js`/);
  assert.match(doc, /4 consumer functions with direct snapshot reads/);
  assert.match(doc, /2 subscription import snapshot seed functions/);
  assert.match(doc, /2 identity snapshot consumer functions/);
  assert.match(doc, /a writer-retained recent browse read horizon/);
  assert.match(doc, /a 6-entry recent search read horizon/);
  assert.match(doc, /no latest search\/next\/player timestamp reads by consumers/);
  assert.match(doc, /no latest browse timestamp reads outside the subscription import timestamp picker/);
  assert.match(doc, /0 explicit max-age checks/);
  assert.match(doc, /0 settings revision gates/);
  assert.match(doc, /0 current-route permission gates for identity snapshots/);
  assert.match(doc, /stale browse import behavior/);
  assert.match(doc, /route-only import seed gating/);
  assert.match(doc, /stale browse timestamp reads outside seed collection/);
  assert.match(doc, /stale recent search identity behavior/);
  assert.match(doc, /latest search\/next\/browse identity roots ignoring timestamp fields/);
  assert.match(doc, /This does not close that row/);
  assert.match(doc, /consumer cluster authority/);
  assert.match(doc, /max-age policy/);
  assert.match(doc, /route permission/);
  assert.match(doc, /profile permission/);
  assert.match(doc, /settings revision gates/);
  assert.match(doc, /current-video gates/);
  assert.match(doc, /import age budgets/);
  assert.match(doc, /stale\/missing snapshot reasons/);
  assert.match(doc, /source-effect provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class network snapshot consumer freshness authority gates/);
});

test('tracked_file_obligation_index_links_json_first_network_snapshot_clone_isolation_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first network snapshot clone isolation addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CLONE_ISOLATION_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-clone-isolation-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first network snapshot, learned-identity, subscription import, endpoint, no-work, performance, false-hide\/leak, and cross-feature consumer rows in `js\/seed\.js` and `js\/injector\.js`/);
  assert.match(doc, /4 direct latest snapshot object assignments/);
  assert.match(doc, /2 direct recent entry data writes/);
  assert.match(doc, /2 recent tail writes/);
  assert.match(doc, /0 clone calls in the snapshot writer/);
  assert.match(doc, /0 freeze\/seal calls in the snapshot writer/);
  assert.match(doc, /3 direct stash source-effect callsites/);
  assert.match(doc, /1 post-processing fetch response stringify site/);
  assert.match(doc, /1 subscription import object-identity dedupe site/);
  assert.match(doc, /search\/browse latest-recent alias behavior/);
  assert.match(doc, /next\/player latest-only direct-reference behavior/);
  assert.match(doc, /fallback direct-reference behavior/);
  assert.match(doc, /harvest-only direct-reference behavior/);
  assert.match(doc, /response-body separation from later snapshot mutations/);
  assert.match(doc, /This does not close that row/);
  assert.match(doc, /clone policy/);
  assert.match(doc, /mutation isolation reports/);
  assert.match(doc, /reference alias reports/);
  assert.match(doc, /freeze\/read-only policy/);
  assert.match(doc, /consumer mutation budgets/);
  assert.match(doc, /response-body isolation policy/);
  assert.match(doc, /source-effect provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class network snapshot clone isolation authority gates/);
});

test('tracked_file_obligation_index_links_json_first_network_snapshot_endpoint_admission_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first network snapshot endpoint admission addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_ENDPOINT_ADMISSION_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-endpoint-admission-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first network snapshot, endpoint, no-work, performance, reliability, false-hide\/leak, and cross-feature consumer rows in `js\/seed\.js`/);
  assert.match(doc, /5 fetch endpoint entries/);
  assert.match(doc, /5 XHR endpoint entries/);
  assert.match(doc, /4 snapshot writer endpoint branches/);
  assert.match(doc, /1 fetch endpoint family without a snapshot branch/);
  assert.match(doc, /1 raw fetch endpoint gate/);
  assert.match(doc, /2 raw XHR endpoint mark sites/);
  assert.match(doc, /2 parsed data label callsites/);
  assert.match(doc, /4 snapshot label substring branch sites/);
  assert.match(doc, /exact search\/browse\/next\/player snapshot behavior/);
  assert.match(doc, /guide processing without a snapshot family/);
  assert.match(doc, /longer-path search snapshot admission/);
  assert.match(doc, /query\/hash\/relative processing without snapshot admission/);
  assert.match(doc, /cross-origin browse snapshot admission/);
  assert.match(doc, /XHR raw mark behavior/);
  assert.match(doc, /This does not close that row/);
  assert.match(doc, /parsed endpoint family decisions/);
  assert.match(doc, /endpoint boundary policy/);
  assert.match(doc, /guide endpoint policy/);
  assert.match(doc, /false-positive reports/);
  assert.match(doc, /fetch\/XHR transport parity/);
  assert.match(doc, /body-work versus snapshot-admission parity/);
  assert.match(doc, /route\/surface\/profile permission/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class network snapshot endpoint admission authority gates/);
});

test('tracked_file_obligation_index_links_json_first_network_snapshot_permission_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first network snapshot permission boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_PERMISSION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-permission-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first network snapshot, endpoint, settings-mode, profile\/surface, no-work, performance, reliability, false-hide\/leak, and cross-feature consumer rows in `js\/seed\.js`/);
  assert.match(doc, /1 snapshot writer function/);
  assert.match(doc, /0 snapshot writer route or hostname reads/);
  assert.match(doc, /0 snapshot writer profile or list-mode reads/);
  assert.match(doc, /0 snapshot writer enabled-state reads/);
  assert.match(doc, /2 pre-writer settings gates/);
  assert.match(doc, /0 settings-update endpoint snapshot clear sites/);
  assert.match(doc, /0 global endpoint snapshot initializers/);
  assert.match(doc, /route\/surface-agnostic enabled snapshot writes/);
  assert.match(doc, /host-agnostic enabled snapshot writes/);
  assert.match(doc, /profile\/list-mode-agnostic enabled snapshot writes/);
  assert.match(doc, /no-settings and disabled pre-writer stop behavior/);
  assert.match(doc, /disabled profile switch snapshot retention/);
  assert.match(doc, /lazy endpoint snapshot fields/);
  assert.match(doc, /This does not close that row/);
  assert.match(doc, /producer and consumer permission decisions/);
  assert.match(doc, /route\/surface\/host\/profile\/list-mode policy/);
  assert.match(doc, /settings revision gates/);
  assert.match(doc, /disabled-state invalidation/);
  assert.match(doc, /retention policy/);
  assert.match(doc, /read\/write permission parity/);
  assert.match(doc, /source-effect provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class network snapshot permission authority gates/);
});

test('tracked_file_obligation_index_links_json_first_network_snapshot_consumer_permission_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first network snapshot consumer permission addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_PERMISSION_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-permission-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first network snapshot, subscription import, learned-identity, settings-mode, profile\/surface, no-work, performance, reliability, false-hide\/leak, and cross-feature consumer rows in `js\/injector\.js`/);
  assert.match(doc, /4 consumer functions with direct snapshot reads/);
  assert.match(doc, /1 subscription import route gate/);
  assert.match(doc, /1 identity watch-context calculation/);
  assert.match(doc, /1 identity current-video calculation/);
  assert.match(doc, /0 snapshot consumer `currentSettings` reads/);
  assert.match(doc, /0 snapshot consumer `settingsReceived` reads/);
  assert.match(doc, /0 snapshot consumer profile\/list-mode reads/);
  assert.match(doc, /0 snapshot consumer enabled-state reads/);
  assert.match(doc, /host-agnostic subscription import snapshot reads/);
  assert.match(doc, /disabled-settings mirror import reads/);
  assert.match(doc, /route-agnostic channel identity reads/);
  assert.match(doc, /disabled-settings mirror identity reads/);
  assert.match(doc, /collaborator snapshot reads on Shorts/);
  assert.match(doc, /route-only import blocking off `\/feed\/channels`/);
  assert.match(doc, /This does not close that row/);
  assert.match(doc, /consumer permission decisions/);
  assert.match(doc, /consumer cluster reports/);
  assert.match(doc, /route\/host\/profile\/list-mode policy/);
  assert.match(doc, /settings revision gates/);
  assert.match(doc, /read-denial reasons/);
  assert.match(doc, /producer\/consumer revision parity/);
  assert.match(doc, /stale reason reporting/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class network snapshot consumer permission authority gates/);
});

test('tracked_file_obligation_index_links_json_first_network_snapshot_consumer_source_precedence_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first network snapshot consumer source precedence addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_SOURCE_PRECEDENCE_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-source-precedence-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first network snapshot, subscription import, learned-identity, settings-mode, profile\/surface, no-work, performance, reliability, false-hide\/leak, and cross-feature consumer rows in `js\/injector\.js`/);
  assert.match(doc, /1 subscription import ordered seed candidate array/);
  assert.match(doc, /5 fixed subscription import candidate slots before the recent spread/);
  assert.match(doc, /1 recent browse spread slot/);
  assert.match(doc, /1 subscription import merge function/);
  assert.match(doc, /10 channel identity root push sites/);
  assert.match(doc, /1 channel identity first-result break site/);
  assert.match(doc, /7 collaborator identity root push sites/);
  assert.match(doc, /1 collaborator identity score arbitration site/);
  assert.match(doc, /1 collaborator identity strict-greater score update site/);
  assert.match(doc, /maxChannels-first browse behavior/);
  assert.match(doc, /duplicate merge strong-name retention/);
  assert.match(doc, /channel search before next root precedence/);
  assert.match(doc, /page `ytInitialData` before snapshot roots/);
  assert.match(doc, /collaborator equal-score tie retention/);
  assert.match(doc, /collaborator higher-score later-root replacement/);
  assert.match(doc, /This does not close that row/);
  assert.match(doc, /source-precedence decisions/);
  assert.match(doc, /root-order decisions/);
  assert.match(doc, /winning-root reports/);
  assert.match(doc, /rejected-root reports/);
  assert.match(doc, /score reports/);
  assert.match(doc, /explicit tie policy/);
  assert.match(doc, /merge policy/);
  assert.match(doc, /freshness override policy/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class network snapshot consumer source-precedence authority gates/);
});

test('tracked_file_obligation_index_links_json_first_network_snapshot_consumer_traversal_budget_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first network snapshot consumer traversal budget addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_TRAVERSAL_BUDGET_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-traversal-budget-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first network snapshot, subscription import, learned-identity, settings-mode, profile\/surface, no-work, performance, reliability, false-hide\/leak, lifecycle\/work-budget, and cross-feature consumer rows in `js\/injector\.js`/);
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
  assert.match(doc, /deep subscription traversal behavior/);
  assert.match(doc, /deep channel traversal behavior/);
  assert.match(doc, /collaborator depth-12 acceptance/);
  assert.match(doc, /collaborator depth-13 cutoff/);
  assert.match(doc, /channel recent-search six-entry horizon behavior/);
  assert.match(doc, /collaborator recent-search six-entry horizon behavior/);
  assert.match(doc, /This does not close that row/);
  assert.match(doc, /traversal decisions/);
  assert.match(doc, /visited-node reports/);
  assert.match(doc, /depth policy/);
  assert.match(doc, /array-cap policy/);
  assert.match(doc, /recent-root horizon policy/);
  assert.match(doc, /cutoff reasons/);
  assert.match(doc, /traversal metric artifacts/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /traversal duration reports/);
  assert.match(doc, /first-class network snapshot consumer traversal-budget authority gates/);
});

test('tracked_file_obligation_index_links_json_first_network_snapshot_consumer_effect_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first network snapshot consumer effect boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-effect-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first network snapshot, subscription import, learned-identity, settings-mode, profile\/surface, no-work, performance, reliability, false-hide\/leak, lifecycle\/work-budget, message\/effect, and cross-feature consumer rows in `js\/injector\.js` and `js\/content_bridge\.js`/);
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
  assert.match(doc, /channel response no-cache behavior/);
  assert.match(doc, /collaborator response injector-local cache behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /response effect decisions/);
  assert.match(doc, /cache effect reports/);
  assert.match(doc, /map-write effect reports/);
  assert.match(doc, /DOM stamp reports/);
  assert.match(doc, /DOM rerun reports/);
  assert.match(doc, /target scope reports/);
  assert.match(doc, /allowed\/blocked effect records/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class network snapshot consumer effect-boundary authority gates/);
});

test('tracked_file_obligation_index_links_json_first_network_snapshot_consumer_request_transport_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first network snapshot consumer request transport addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_REQUEST_TRANSPORT_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-request-transport-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first network snapshot, subscription import, learned-identity, settings-mode, profile\/surface, no-work, performance, reliability, false-hide\/leak, lifecycle\/work-budget, message\/effect, request\/response transport, and cross-feature consumer rows in `js\/injector\.js` and `js\/content_bridge\.js`/);
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
  assert.match(doc, /channel retry\/timeout behavior/);
  assert.match(doc, /channel response clear-and-suppress behavior/);
  assert.match(doc, /collaborator retry\/timeout behavior/);
  assert.match(doc, /unsolicited collaborator response apply-resolved behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /request transport decisions/);
  assert.match(doc, /request nonces/);
  assert.match(doc, /pending request registries/);
  assert.match(doc, /retry policy/);
  assert.match(doc, /timeout policy/);
  assert.match(doc, /response correlation reports/);
  assert.match(doc, /sender capability/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class network snapshot consumer request-transport authority gates/);
});

test('tracked_file_obligation_index_links_json_first_network_snapshot_consumer_application_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first network snapshot consumer application addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_APPLICATION_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-application-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first network snapshot, subscription import, learned-identity, settings-mode, profile\/surface, no-work, performance, reliability, false-hide\/leak, lifecycle\/work-budget, message\/effect, request\/response transport, cache\/DOM application, active menu, playlist fallback, DOM fallback rerun, and cross-feature consumer rows in `js\/content_bridge\.js`/);
  assert.match(doc, /1 resolved collaborator cache map/);
  assert.match(doc, /1 active collaboration menu map/);
  assert.match(doc, /7 `applyResolvedCollaborators` token occurrences/);
  assert.match(doc, /6 `applyResolvedCollaborators` callsites outside declaration/);
  assert.match(doc, /4 `refreshActiveCollaborationMenu` token occurrences/);
  assert.match(doc, /3 `refreshActiveCollaborationMenu` callsites outside declaration/);
  assert.match(doc, /5 resolved collaborator map set callsites/);
  assert.match(doc, /8 resolved collaborator map get callsites/);
  assert.match(doc, /card collaborator serialized\/source-label\/timestamp\/resolved-state writes/);
  assert.match(doc, /pending-dialog\/requested cleanup/);
  assert.match(doc, /active menu refresh/);
  assert.match(doc, /playlist fallback refresh/);
  assert.match(doc, /zero-delay DOM fallback rerun/);
  assert.match(doc, /matching-card stamp\/cache\/rerun behavior/);
  assert.match(doc, /no-card cache-and-rerun behavior/);
  assert.match(doc, /richer global cache rejection behavior/);
  assert.match(doc, /force-downgrade per-card skip behavior/);
  assert.match(doc, /active-menu richer resolved-cache behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /application decisions/);
  assert.match(doc, /resolved-cache reports/);
  assert.match(doc, /DOM stamp reports/);
  assert.match(doc, /active-menu refresh reports/);
  assert.match(doc, /playlist popover refresh reports/);
  assert.match(doc, /DOM fallback rerun budgets/);
  assert.match(doc, /cache downgrade policies/);
  assert.match(doc, /card-stamp correlation reports/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class network snapshot consumer application authority gates/);
});

test('tracked_file_obligation_index_links_json_first_network_snapshot_consumer_stale_cache_cleanup_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first network snapshot consumer stale cache cleanup addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_STALE_CACHE_CLEANUP_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-stale-cache-cleanup-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first network snapshot, learned-identity, settings-mode, profile\/surface, no-work, performance, reliability, false-hide\/leak, lifecycle\/work-budget, message\/effect, request\/response transport, cache\/DOM application, stale cache cleanup, recycled-card restore, hide\/restore, and cross-feature consumer rows in `js\/content_bridge\.js`/);
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
  assert.match(doc, /broad stale reset cleanup behavior/);
  assert.match(doc, /live-id mismatch cleanup behavior/);
  assert.match(doc, /stamped-id mismatch cache-retention behavior/);
  assert.match(doc, /no-live validation video-id retention behavior/);
  assert.match(doc, /mismatch validation source\/timestamp and resolved-map retention behavior/);
  assert.match(doc, /matched-cache return behavior/);
  assert.match(doc, /collaborator-only cleanup behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /stale-cache cleanup decisions/);
  assert.match(doc, /card video-id evidence reports/);
  assert.match(doc, /stale marker reports/);
  assert.match(doc, /global cache retention policies/);
  assert.match(doc, /stamp rejection cleanup policies/);
  assert.match(doc, /no-live cache retention policies/);
  assert.match(doc, /recycled-card restore proof/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class network snapshot consumer stale-cache cleanup authority gates/);
});

test('tracked_file_obligation_index_links_json_first_network_snapshot_consumer_card_video_id_evidence_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first network snapshot consumer card video-id evidence addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_CARD_VIDEO_ID_EVIDENCE_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-card-video-id-evidence-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first network snapshot, learned-identity, settings-mode, profile\/surface, no-work, performance, reliability, false-hide\/leak, lifecycle\/work-budget, message\/effect, request\/response transport, cache\/DOM application, stale cache cleanup, card video-id evidence, recycled-card restore, hide\/restore, and cross-feature consumer rows in `js\/content\/dom_extractors\.js` and `js\/content_bridge\.js`/);
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
  assert.match(doc, /href-over-stale-stamp behavior/);
  assert.match(doc, /high-risk no-cached cleanup with retained inline display behavior/);
  assert.match(doc, /high-risk cached-mismatch display restore with retained collaborator marker behavior/);
  assert.match(doc, /lower-risk fast cached-return behavior/);
  assert.match(doc, /link-proof stamp behavior/);
  assert.match(doc, /direct collaborator-cache video-id stamping/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /video-id evidence reports/);
  assert.match(doc, /evidence contracts/);
  assert.match(doc, /evidence decisions/);
  assert.match(doc, /live-id provenance reports/);
  assert.match(doc, /href proof policies/);
  assert.match(doc, /stamped-id trust policies/);
  assert.match(doc, /ensure-video-id side-effect reports/);
  assert.match(doc, /fast-return policies/);
  assert.match(doc, /restore proof/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class network snapshot consumer card video-id evidence authority gates/);
});

test('tracked_file_obligation_index_links_json_first_network_snapshot_consumer_stale_marker_matrix_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first network snapshot consumer stale marker matrix addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_STALE_MARKER_MATRIX_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-network-snapshot-consumer-stale-marker-matrix-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first network snapshot, learned-identity, settings-mode, profile\/surface, no-work, performance, reliability, false-hide\/leak, lifecycle\/work-budget, message\/effect, request\/response transport, cache\/DOM application, stale cache cleanup, card video-id evidence, stale marker retention, recycled-card restore, hide\/restore, and cross-feature consumer rows in `js\/content\/dom_extractors\.js`, `js\/content_bridge\.js`, and `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /extractor no-cached retained-display behavior/);
  assert.match(doc, /extractor cached-mismatch retained-collaborator-marker behavior/);
  assert.match(doc, /bridge reset retained last-mode\/whitelist-pending behavior/);
  assert.match(doc, /validated-cache retained source\/timestamp\/hidden\/custom\/processed behavior/);
  assert.match(doc, /DOM fallback stale-hidden explicit-marker early-return boundary/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /stale marker reports/);
  assert.match(doc, /stale marker matrices/);
  assert.match(doc, /cleanup decisions/);
  assert.match(doc, /retention policies/);
  assert.match(doc, /hidden-marker restore proof/);
  assert.match(doc, /collaborator-marker retention policies/);
  assert.match(doc, /processed-marker policies/);
  assert.match(doc, /blocked-marker policies/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class network snapshot consumer stale-marker matrix authority gates/);
});

test('tracked_file_obligation_index_links_json_first_video_meta_dom_rerun_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first video meta DOM rerun addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_DOM_RERUN_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-dom-rerun-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first metadata, settings-mode, no-work, performance, reliability, false-hide\/leak, lifecycle\/timer, message\/effect, network fetch, cache\/DOM application, processed-marker, background storage flush, and cross-feature rows in `js\/content_bridge\.js`, `js\/content\/dom_fallback\.js`, and `js\/background\.js`/);
  assert.match(doc, /8 source\/effect blocks/);
  assert.match(doc, /62 persistVideoMetaMapping block lines/);
  assert.match(doc, /10 persist block videoMetaMap tokens/);
  assert.match(doc, /1 persist runtime sendMessage callsite/);
  assert.match(doc, /16 rerun schedule block lines/);
  assert.match(doc, /550 ms content DOM rerun debounce/);
  assert.match(doc, /1 rerun setTimeout callsite/);
  assert.match(doc, /1 rerun clearTimeout callsite/);
  assert.match(doc, /57 touchDomForVideoMetaUpdate block lines/);
  assert.match(doc, /3 touch removeAttribute callsites/);
  assert.match(doc, /1 touch setAttribute callsite/);
  assert.match(doc, /2 touch querySelectorAll callsites/);
  assert.match(doc, /101 watch meta fetch queue block lines/);
  assert.match(doc, /3 watch meta fetch concurrency limit/);
  assert.match(doc, /60000 ms fetch cooldown/);
  assert.match(doc, /98 fetchVideoMetaFromWatchUrl block lines/);
  assert.match(doc, /1 watch fetch callsite/);
  assert.match(doc, /1 watch JSON\.parse callsite/);
  assert.match(doc, /26 FilterTube_UpdateVideoMetaMap branch lines/);
  assert.match(doc, /39 DOM fallback category videoMetaMap block lines/);
  assert.match(doc, /2 category-block scheduleVideoMetaFetch tokens/);
  assert.match(doc, /41 background enqueueVideoMetaMapUpdate block lines/);
  assert.match(doc, /75 ms background videoMetaMap flush debounce/);
  assert.match(doc, /40 background videoMetaMap tokens/);
  assert.match(doc, /persistence cleaned-row forwarding/);
  assert.match(doc, /targeted DOM touch marker-retention behavior/);
  assert.match(doc, /550 ms rerun timer replacement behavior/);
  assert.match(doc, /message-triggered rerun only after DOM touch/);
  assert.match(doc, /satisfied-metadata no-fetch behavior/);
  assert.match(doc, /pending duplicate fetch suppression/);
  assert.match(doc, /invalid-id rejection/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /DOM rerun contracts/);
  assert.match(doc, /DOM touch reports/);
  assert.match(doc, /fetch budgets/);
  assert.match(doc, /message effect reports/);
  assert.match(doc, /map persistence policies/);
  assert.match(doc, /timer registries/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /category fetch policies/);
  assert.match(doc, /background flush authority/);
  assert.match(doc, /first-class video-meta DOM rerun authority gates/);
});

test('tracked_file_obligation_index_links_json_first_video_meta_background_storage_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first video meta background storage addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_BACKGROUND_STORAGE_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-background-storage-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first metadata, settings-mode, no-work, performance, reliability, false-hide\/leak, lifecycle\/timer, message\/effect, cache\/DOM application, processed-marker, background storage flush, compiled-cache, storage\/cache, and cross-feature rows in `js\/background\.js`/);
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
  assert.match(doc, /cache-load once behavior/);
  assert.match(doc, /storage-error empty-cache recovery/);
  assert.match(doc, /cleaned-row enqueue behavior/);
  assert.match(doc, /loaded-cache and compiled-cache patching/);
  assert.match(doc, /one-pending-timer scheduling/);
  assert.match(doc, /cap-enforced flush behavior/);
  assert.match(doc, /array-form category preservation/);
  assert.match(doc, /legacy single-video category omission/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /storage contracts/);
  assert.match(doc, /flush reports/);
  assert.match(doc, /compiled-cache patch reports/);
  assert.match(doc, /message schemas/);
  assert.match(doc, /revision policies/);
  assert.match(doc, /eviction reports/);
  assert.match(doc, /storage error reports/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /content rerun parity/);
  assert.match(doc, /first-class video-meta background storage authority gates/);
});

test('tracked_file_obligation_index_links_json_first_video_meta_category_parity_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first video meta category parity addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_CATEGORY_PARITY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-category-parity-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first metadata, settings-mode, no-work, performance, reliability, false-hide\/leak, lifecycle\/timer, filter-logic, DOM fallback, cache\/DOM application, marker, fetch-demand, and cross-feature rows in `js\/filter_logic\.js`, `js\/content\/dom_fallback\.js`, and `js\/content_bridge\.js`/);
  assert.match(doc, /57 filter_logic category method block lines/);
  assert.match(doc, /2683 filter_logic category method block bytes/);
  assert.match(doc, /3 filter_logic category method videoMetaMap tokens/);
  assert.match(doc, /2 filter_logic scheduleVideoMetaFetch tokens/);
  assert.match(doc, /9 filter_logic category tokens/);
  assert.match(doc, /19 filter_logic category renderer allowlist entries/);
  assert.match(doc, /12 filter_logic content\/category call block lines/);
  assert.match(doc, /39 DOM fallback category block lines/);
  assert.match(doc, /2136 DOM fallback category block bytes/);
  assert.match(doc, /3 DOM fallback videoMetaMap tokens/);
  assert.match(doc, /2 DOM fallback scheduleVideoMetaFetch tokens/);
  assert.match(doc, /10 DOM fallback category tokens/);
  assert.match(doc, /2 DOM fallback pendingCategory tokens/);
  assert.match(doc, /75 DOM fallback pending metadata block lines/);
  assert.match(doc, /4103 DOM fallback pending metadata block bytes/);
  assert.match(doc, /2 DOM fallback pending metadata setTimeout callsites/);
  assert.match(doc, /6 DOM fallback pending category attribute tokens/);
  assert.match(doc, /8 DOM fallback category marker block lines/);
  assert.match(doc, /333 DOM fallback category marker block bytes/);
  assert.match(doc, /2 DOM fallback category marker attribute tokens/);
  assert.match(doc, /94 content_bridge scheduleVideoMetaFetch function lines/);
  assert.match(doc, /3689 content_bridge scheduleVideoMetaFetch function bytes/);
  assert.match(doc, /4 content_bridge scheduleVideoMetaFetch category tokens/);
  assert.match(doc, /JSON engine block\/allow decisions/);
  assert.match(doc, /JSON missing-category fetch scheduling with no hide decision/);
  assert.match(doc, /DOM fallback present-category parity/);
  assert.match(doc, /DOM fallback pending category state for allow mode or home\/search routes/);
  assert.match(doc, /pending-category timestamp and 8120 ms recheck behavior/);
  assert.match(doc, /category hidden-marker write conditions/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /category parity contracts/);
  assert.match(doc, /JSON\/DOM category decision reports/);
  assert.match(doc, /pending policies/);
  assert.match(doc, /marker reports/);
  assert.match(doc, /fetch policies/);
  assert.match(doc, /no-work budgets/);
  assert.match(doc, /allow\/block parity reports/);
  assert.match(doc, /revision policies/);
  assert.match(doc, /first-class video-meta category parity authority gates/);
});

test('tracked_file_obligation_index_links_json_first_video_meta_fetch_policy_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first video meta fetch policy addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_FETCH_POLICY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-fetch-policy-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first metadata, settings-mode, no-work, performance, reliability, false-hide\/leak, lifecycle\/timer, filter-logic, DOM fallback, network fetch, cache\/DOM application, route\/profile, and cross-feature rows in `js\/content_bridge\.js`, `js\/content\/dom_fallback\.js`, and `js\/filter_logic\.js`/);
  assert.match(doc, /76 content_bridge scheduleVideoMetaFetch body lines/);
  assert.match(doc, /2960 schedule body bytes/);
  assert.match(doc, /8 schedule needDuration tokens/);
  assert.match(doc, /8 schedule needDates tokens/);
  assert.match(doc, /8 schedule needCategory tokens/);
  assert.match(doc, /5 last-attempt tokens/);
  assert.match(doc, /17 processWatchMetaFetchQueue body lines/);
  assert.match(doc, /727 queue body bytes/);
  assert.match(doc, /98 fetchVideoMetaFromWatchUrl body lines/);
  assert.match(doc, /3382 fetch body bytes/);
  assert.match(doc, /1 fetch callsite/);
  assert.match(doc, /1 JSON\.parse callsite/);
  assert.match(doc, /1 persistence callsite/);
  assert.match(doc, /1 DOM touch callsite/);
  assert.match(doc, /1 DOM rerun callsite/);
  assert.match(doc, /3 watch meta fetch concurrency limit/);
  assert.match(doc, /60000 ms cooldown/);
  assert.match(doc, /3000 attempt-map cap/);
  assert.match(doc, /800 attempt-map trim count/);
  assert.match(doc, /8 DOM fallback scheduleVideoMetaFetch token occurrences/);
  assert.match(doc, /2 filter_logic scheduleVideoMetaFetch token occurrences/);
  assert.match(doc, /1 DOM fallback category fetch callsite/);
  assert.match(doc, /1 DOM fallback upload-date fetch callsite/);
  assert.match(doc, /1 DOM fallback explicit duration fetch callsite/);
  assert.match(doc, /1 DOM fallback default duration fetch callsite/);
  assert.match(doc, /1 filter_logic category fetch callsite/);
  assert.match(doc, /JSON category\/DOM category\/DOM upload-date\/DOM explicit-duration\/DOM default-duration callsite behavior/);
  assert.match(doc, /satisfied-metadata no-fetch behavior/);
  assert.match(doc, /invalid-id rejection/);
  assert.match(doc, /duplicate same-video suppression/);
  assert.match(doc, /default duration-request behavior/);
  assert.match(doc, /three-active-fetch concurrency behavior/);
  assert.match(doc, /Kids host early return/);
  assert.match(doc, /YouTube watch HTML same-origin fetch behavior/);
  assert.match(doc, /parsed metadata persistence/);
  assert.match(doc, /DOM rerun after touch/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /fetch policy contracts/);
  assert.match(doc, /reason matrices/);
  assert.match(doc, /budget reports/);
  assert.match(doc, /callsite authority/);
  assert.match(doc, /need-flag reports/);
  assert.match(doc, /concurrency policies/);
  assert.match(doc, /Kids policies/);
  assert.match(doc, /revision policies/);
  assert.match(doc, /first-class video-meta fetch policy authority gates/);
});

test('tracked_file_obligation_index_links_json_first_video_meta_content_parity_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first video meta content parity addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_CONTENT_PARITY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-content-parity-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first metadata, settings-mode, no-work, performance, reliability, false-hide\/leak, lifecycle\/timer, filter-logic, DOM fallback, network fetch, cache\/DOM application, marker, route\/profile, and cross-feature rows in `js\/filter_logic\.js`, `js\/content\/dom_fallback\.js`, and `js\/content_bridge\.js`/);
  assert.match(doc, /234 filter_logic extract duration block lines/);
  assert.match(doc, /11823 extract duration block bytes/);
  assert.match(doc, /4 extract duration videoMetaMap tokens/);
  assert.match(doc, /7 extract duration lengthSeconds tokens/);
  assert.match(doc, /126 extract published time block lines/);
  assert.match(doc, /6495 extract published time block bytes/);
  assert.match(doc, /3 extract published time videoMetaMap tokens/);
  assert.match(doc, /2 extract published time uploadDate tokens/);
  assert.match(doc, /2 extract published time publishDate tokens/);
  assert.match(doc, /155 check content filters block lines/);
  assert.match(doc, /7739 check content filters block bytes/);
  assert.match(doc, /19 content renderer allowlist entries/);
  assert.match(doc, /10 content call block lines/);
  assert.match(doc, /170 DOM fallback upload-date block lines/);
  assert.match(doc, /9701 DOM upload-date block bytes/);
  assert.match(doc, /3 DOM upload-date videoMetaMap tokens/);
  assert.match(doc, /2 DOM upload-date scheduleVideoMetaFetch tokens/);
  assert.match(doc, /11 DOM upload-date parseDateMs tokens/);
  assert.match(doc, /71 DOM fallback duration block lines/);
  assert.match(doc, /4480 DOM duration block bytes/);
  assert.match(doc, /4 DOM duration videoMetaMap tokens/);
  assert.match(doc, /4 DOM duration scheduleVideoMetaFetch tokens/);
  assert.match(doc, /1 DOM duration cache marker setAttribute callsite/);
  assert.match(doc, /75 DOM pending metadata block lines/);
  assert.match(doc, /4091 DOM pending metadata block bytes/);
  assert.match(doc, /6 DOM pending upload-date attribute tokens/);
  assert.match(doc, /2 DOM pending metadata setTimeout callsites/);
  assert.match(doc, /JSON duration block\/allow behavior from videoMetaMap/);
  assert.match(doc, /JSON upload-date blank-cutoff behavior/);
  assert.match(doc, /DOM upload-date metadata\/fetch\/pending behavior/);
  assert.match(doc, /DOM duration cache-marker and fetch behavior/);
  assert.match(doc, /pending upload-date timestamp and 8120 ms recheck behavior/);
  assert.match(doc, /stale pending-marker cleanup/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /content parity contracts/);
  assert.match(doc, /duration decision reports/);
  assert.match(doc, /upload-date decision reports/);
  assert.match(doc, /JSON\/DOM content decision reports/);
  assert.match(doc, /pending upload-date policies/);
  assert.match(doc, /duration cache policies/);
  assert.match(doc, /no-work budgets/);
  assert.match(doc, /first-class video-meta content parity authority gates/);
});

test('tracked_file_obligation_index_links_json_first_video_meta_no_work_budget_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first video meta no-work budget addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-no-work-budget-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first metadata, settings-mode, no-work, performance, reliability, false-hide\/leak, lifecycle\/timer, filter-logic, DOM fallback, network fetch, queue\/cooldown, route\/profile, and cross-feature rows in `js\/content_bridge\.js`, `js\/content\/dom_fallback\.js`, and `js\/filter_logic\.js`/);
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
  assert.match(doc, /invalid-id\/satisfied-metadata\/all-false need no-work behavior/);
  assert.match(doc, /default duration scheduling/);
  assert.match(doc, /queue video-id-only execution/);
  assert.match(doc, /duplicate pending cooldown refresh behavior/);
  assert.match(doc, /blank-cutoff upload-date fetch admission/);
  assert.match(doc, /mix-like no-options duration fetch admission/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /scheduler skip reports/);
  assert.match(doc, /need-reason reports/);
  assert.match(doc, /cooldown policies/);
  assert.match(doc, /queue reason-retention policies/);
  assert.match(doc, /duplicate pending retry policies/);
  assert.match(doc, /upload-date cutoff work gates/);
  assert.match(doc, /default duration fetch policies/);
  assert.match(doc, /first-class video-meta no-work authority gates/);
});

test('tracked_file_obligation_index_links_json_first_video_meta_revision_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first video meta revision boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_REVISION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-revision-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first metadata, settings-mode, no-work, performance, reliability, false-hide\/leak, lifecycle\/timer, message\/effect, network fetch, storage\/cache, compiled-cache, filter-logic, DOM fallback, route\/profile\/surface, and cross-feature rows in `js\/content_bridge\.js`, `js\/background\.js`, and `js\/filter_logic\.js`/);
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
  assert.match(doc, /content persistence mutates disabled currentSettings and strips revision\/provenance fields/);
  assert.match(doc, /filter logic queueing dedupes across revision-only changes/);
  assert.match(doc, /background update patches both main and kids compiled caches with one unpartitioned metadata map/);
  assert.match(doc, /consumers pass videoMetaMap by reference/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /revision contracts/);
  assert.match(doc, /revision reports/);
  assert.match(doc, /settings revision policies/);
  assert.match(doc, /profile scope policies/);
  assert.match(doc, /message revision gates/);
  assert.match(doc, /background revision gates/);
  assert.match(doc, /consumer revision decisions/);
  assert.match(doc, /first-class video-meta revision authority gates/);
});

test('tracked_file_obligation_index_links_json_first_video_meta_profile_surface_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first video meta profile\/surface boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_PROFILE_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-profile-surface-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first metadata, settings-mode, no-work, performance, reliability, false-hide\/leak, lifecycle\/timer, message\/effect, network fetch, storage\/cache, compiled-cache, filter-logic, DOM fallback, route\/profile\/surface, host\/Kids, list-mode, and cross-feature rows in `js\/content_bridge\.js`, `js\/background\.js`, `js\/filter_logic\.js`, and `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /content persistence accepts Kids\/whitelist\/disabled settings without row profile fields/);
  assert.match(doc, /Kids-host scheduling is admitted before the watch-fetch host guard/);
  assert.match(doc, /background updates patch Main and Kids compiled caches with one unpartitioned map/);
  assert.match(doc, /filter logic consumes the same map under a Kids profile/);
  assert.match(doc, /DOM fallback route-local category logic reads a global metadata row/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /profile\/surface contracts/);
  assert.match(doc, /profile scope reports/);
  assert.match(doc, /surface permission reports/);
  assert.match(doc, /Kids policies/);
  assert.match(doc, /list-mode policies/);
  assert.match(doc, /settings gates/);
  assert.match(doc, /consumer permission decisions/);
  assert.match(doc, /fetch surface budgets/);
  assert.match(doc, /first-class video-meta profile\/surface authority gates/);
});

test('tracked_file_obligation_index_links_json_first_video_meta_freshness_eviction_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first video meta freshness\/eviction boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_FRESHNESS_EVICTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-freshness-eviction-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first metadata, settings-mode, no-work, performance, reliability, false-hide\/leak, lifecycle\/timer, message\/effect, network fetch, storage\/cache, compiled-cache, filter-logic, freshness\/eviction, and cross-feature rows in `js\/content_bridge\.js`, `js\/background\.js`, and `js\/filter_logic\.js`/);
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
  assert.match(doc, /0 schedule fetchedAt tokens/);
  assert.match(doc, /0 schedule updatedAt tokens/);
  assert.match(doc, /0 schedule expiresAt tokens/);
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
  assert.match(doc, /content persistence row cleanup and first-key cap eviction/);
  assert.match(doc, /stale parseable scheduler no-fetch behavior/);
  assert.match(doc, /background stale load\/flush retention with cleaned new writes/);
  assert.match(doc, /background first-key eviction independent of fetchedAt recency/);
  assert.match(doc, /filter logic freshness-only dedupe with no freshness payload/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /freshness contracts/);
  assert.match(doc, /age policies/);
  assert.match(doc, /row provenance reports/);
  assert.match(doc, /fetch freshness gates/);
  assert.match(doc, /eviction policy reports/);
  assert.match(doc, /attempt cooldown reports/);
  assert.match(doc, /consumer freshness decisions/);
  assert.match(doc, /first-class video-meta freshness\/eviction authority gates/);
});

test('tracked_file_obligation_index_links_json_first_video_meta_merge_schema_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first video meta merge\/schema boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_VIDEO_META_MERGE_SCHEMA_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-video-meta-merge-schema-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first metadata, settings-mode, no-work, performance, reliability, false-hide\/leak, lifecycle\/timer, message\/effect, storage\/cache, compiled-cache, filter-logic, metadata schema, merge policy, and cross-feature rows in `js\/content_bridge\.js`, `js\/background\.js`, and `js\/filter_logic\.js`/);
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
  assert.match(doc, /content\/background category-only partial replacement behavior/);
  assert.match(doc, /filter-logic category-only suppression when length\/date match/);
  assert.match(doc, /local merge with partial outbound queue payloads/);
  assert.match(doc, /legacy single-video category omission/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /merge schema contracts/);
  assert.match(doc, /row completeness reports/);
  assert.match(doc, /partial update policies/);
  assert.match(doc, /category merge decisions/);
  assert.match(doc, /field-loss reports/);
  assert.match(doc, /legacy message schemas/);
  assert.match(doc, /storage merge reports/);
  assert.match(doc, /consumer schema decisions/);
  assert.match(doc, /first-class video-meta merge\/schema authority gates/);
});

test('tracked_file_obligation_index_links_json_first_renderer_traversal_mutation_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first renderer traversal\/mutation boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_RENDERER_TRAVERSAL_MUTATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-renderer-traversal-mutation-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, response mutation, filter-logic, recursive traversal, renderer wrapper, array compaction, object omission, and cross-feature rows in `js\/filter_logic\.js` and `js\/seed\.js`/);
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
  assert.match(doc, /active no-match traversal container rebuilds/);
  assert.match(doc, /disabled original-reference return/);
  assert.match(doc, /blocked array compaction/);
  assert.match(doc, /nested object child omission/);
  assert.match(doc, /richItemRenderer preferred nested renderer blocking/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /traversal contracts/);
  assert.match(doc, /mutation budgets/);
  assert.match(doc, /recursive filter reports/);
  assert.match(doc, /array compaction policies/);
  assert.match(doc, /object omission policies/);
  assert.match(doc, /renderer wrapper policies/);
  assert.match(doc, /renderer sibling policies/);
  assert.match(doc, /no-op identity policies/);
  assert.match(doc, /first-class renderer traversal\/mutation authority gates/);
});

test('tracked_file_obligation_index_links_json_first_block_decision_effect_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first block decision\/effect boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_BLOCK_DECISION_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-block-decision-effect-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, message\/effect, filter-logic, route exception, comment, channel-only, collaboration, decision-order, and cross-feature rows in `js\/filter_logic\.js`/);
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
  assert.match(doc, /feed-channels route exception behavior/);
  assert.match(doc, /Shorts-before-route precedence/);
  assert.match(doc, /channel-only keyword skipping with channel-rule blocking/);
  assert.match(doc, /comment whitelist bypass plus keyword blocking/);
  assert.match(doc, /allowed collaboration cache side effects/);
  assert.match(doc, /blocked collaboration cache side effects/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /block-decision contracts/);
  assert.match(doc, /effect reports/);
  assert.match(doc, /decision-order reports/);
  assert.match(doc, /side-effect budgets/);
  assert.match(doc, /collaboration effect decisions/);
  assert.match(doc, /route exception decisions/);
  assert.match(doc, /comment policies/);
  assert.match(doc, /channel-only field policies/);
  assert.match(doc, /short-circuit reports/);
  assert.match(doc, /first-class block-decision\/effect authority gates/);
});

test('tracked_file_obligation_index_links_json_first_candidate_extraction_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first candidate extraction boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_CANDIDATE_EXTRACTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-candidate-extraction-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, filter-logic, candidate extraction, metadata search, video id, playlist id, collaboration, avatar-stack, showSheet, and cross-feature rows in `js\/filter_logic\.js`/);
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
  assert.match(doc, /identity-gated channel extraction/);
  assert.match(doc, /metadata channel-name keyword matching/);
  assert.match(doc, /video-id validation with playlist mix flags/);
  assert.match(doc, /showDialog collaborator side effects/);
  assert.match(doc, /missing showSheet roster parsing/);
  assert.match(doc, /avatar-stack mix\/radio channel-rule blocking/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /extraction contracts/);
  assert.match(doc, /candidate reports/);
  assert.match(doc, /identity gates/);
  assert.match(doc, /metadata search policies/);
  assert.match(doc, /video-id policies/);
  assert.match(doc, /playlist policies/);
  assert.match(doc, /collaboration source policies/);
  assert.match(doc, /avatar-stack policies/);
  assert.match(doc, /showSheet policies/);
  assert.match(doc, /first-class candidate extraction authority gates/);
});

test('tracked_file_obligation_index_links_json_first_channel_match_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first channel match boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_CHANNEL_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-channel-match-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, shared identity, learned identity, channelMap, filter-logic, channel matching, DOM parity, and cross-feature rows in `js\/filter_logic\.js` and `js\/shared\/identity\.js`/);
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
  assert.match(doc, /stable-id and channelMap boolean matching/);
  assert.match(doc, /direct\/index object-name divergence/);
  assert.match(doc, /name-only string divergence/);
  assert.match(doc, /direct `@handle` weak-name fallback/);
  assert.match(doc, /filter_logic shared-index delegation/);
  assert.match(doc, /legacy fallback divergence/);
  assert.match(doc, /JSON stable-name guard behavior/);
  assert.match(doc, /exact UC id blocking/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /channel match contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /confidence policies/);
  assert.match(doc, /index\/direct parity/);
  assert.match(doc, /fallback-scope reports/);
  assert.match(doc, /name-only policies/);
  assert.match(doc, /stable-name guards/);
  assert.match(doc, /channelMap provenance reports/);
  assert.match(doc, /caller matrices/);
  assert.match(doc, /first-class channel-match authority gates/);
});

test('tracked_file_obligation_index_links_json_first_keyword_match_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first keyword match boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_KEYWORD_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-keyword-match-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, keyword matching, comment, whitelist, DOM parity, background compile, shared settings, filter-logic, and cross-feature rows in `js\/filter_logic\.js`, `js\/settings_shared\.js`, `js\/background\.js`, and `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /substring larger-word matching/);
  assert.match(doc, /exact Unicode-boundary standalone matching/);
  assert.match(doc, /global regex state reset/);
  assert.match(doc, /candidate search over title\/description\/tags\/metadata\/channel text/);
  assert.match(doc, /serialized comment keyword reconstruction gaps/);
  assert.match(doc, /direct comment `RegExp` blocking/);
  assert.match(doc, /global keyword comment hiding through candidate metadata/);
  assert.match(doc, /whitelist keyword allow\/miss fail-closed behavior/);
  assert.match(doc, /channel-only keyword skipping/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /keyword match contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /boundary policies/);
  assert.match(doc, /comment-scope reports/);
  assert.match(doc, /source provenance/);
  assert.match(doc, /JSON\/DOM parity reports/);
  assert.match(doc, /whitelist miss reports/);
  assert.match(doc, /regex state reports/);
  assert.match(doc, /channel-derived keyword provenance/);
  assert.match(doc, /first-class keyword-match authority gates/);
});

test('tracked_file_obligation_index_links_json_first_uppercase_title_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first uppercase title boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_UPPERCASE_TITLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-uppercase-title-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, content filters, uppercase-title heuristic, DOM parity, seed active-work, background compile, filter-logic, and cross-feature rows in `js\/filter_logic\.js`, `js\/content\/dom_fallback\.js`, `js\/seed\.js`, and `js\/background\.js`/);
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
  assert.match(doc, /single-word\/all-caps\/both uppercase mode behavior/);
  assert.match(doc, /ASCII-only non-ASCII leak behavior/);
  assert.match(doc, /minWordLength zero fallback behavior/);
  assert.match(doc, /channel-only renderer skipping/);
  assert.match(doc, /seed and DOM active predicate wakeups/);
  assert.match(doc, /DOM shouldHideContent missing uppercase enforcement/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /uppercase title contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /boundary policies/);
  assert.match(doc, /DOM parity reports/);
  assert.match(doc, /locale policies/);
  assert.match(doc, /renderer-scope reports/);
  assert.match(doc, /no-work budgets/);
  assert.match(doc, /settings validity reports/);
  assert.match(doc, /first-class uppercase-title authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_all_shorts_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideAllShorts boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_ALL_SHORTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-all-shorts-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, Shorts global filter, renderer traversal, renderer discovery, DOM parity, marker\/restore, seed active-work, background compile, filter-logic, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, and `js\/background\.js`/);
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
  assert.match(doc, /direct Shorts lockup and reel blocking/);
  assert.match(doc, /direct V2 renderer discovery leak behavior/);
  assert.match(doc, /nested V2 unwrap blocking/);
  assert.match(doc, /ordinary JSON videoRenderer Shorts-URL pass-through behavior/);
  assert.match(doc, /seed active-work wakeup behavior/);
  assert.match(doc, /background settings alias compile behavior/);
  assert.match(doc, /DOM global Shorts selector\/marker\/restore\/disguised-card\/yield behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-all-Shorts contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /renderer discovery policies/);
  assert.match(doc, /JSON\/DOM parity reports/);
  assert.match(doc, /V2 leak reports/);
  assert.match(doc, /disguised Shorts policies/);
  assert.match(doc, /no-work budgets/);
  assert.match(doc, /marker restore proof/);
  assert.match(doc, /first-class hide-all-Shorts authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_all_comments_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideAllComments boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_ALL_COMMENTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-all-comments-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, comments global filter, comment keyword scope, renderer traversal, renderer inventory, comment continuation, DOM parity, mobile marker\/restore, seed active-work, background compile, filter-logic, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, and `js\/background\.js`/);
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
  assert.match(doc, /classic JSON comment renderer blocking/);
  assert.match(doc, /empty comment section wrapper behavior/);
  assert.match(doc, /ordinary JSON videoRenderer pass-through behavior/);
  assert.match(doc, /direct commentViewModel leak behavior/);
  assert.match(doc, /comment keyword-only scoping/);
  assert.match(doc, /comment author channel blocking/);
  assert.match(doc, /seed active-work and continuation rewrite behavior/);
  assert.match(doc, /background settings alias compile behavior/);
  assert.match(doc, /DOM comments selector\/thread\/renderer\/ViewModel\/mobile-marker behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-all-comments contracts/);
  assert.match(doc, /comment decision reports/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM comment parity reports/);
  assert.match(doc, /modern comment ViewModel leak reports/);
  assert.match(doc, /structural wrapper cleanup policies/);
  assert.match(doc, /comment continuation response contracts/);
  assert.match(doc, /no-work budgets/);
  assert.match(doc, /marker restore proof/);
  assert.match(doc, /first-class hide-all-comments authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_mix_playlists_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideMixPlaylists boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_MIX_PLAYLISTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-mix-playlists-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, Mix\/radio playlist global filter, renderer traversal, candidate classification, DOM parity, chip marker\/restore, playlist-card interaction, seed active-work, background compile\/cache invalidation, filter-logic, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, and `js\/background\.js`/);
  assert.match(doc, /4 hideMixPlaylists boundary source files/);
  assert.match(doc, /16 hideMixPlaylists source\/effect blocks/);
  assert.match(doc, /17 filter_logic radio rules block lines/);
  assert.match(doc, /833 filter_logic radio rules block bytes/);
  assert.match(doc, /15 filter_logic extract playlist id block lines/);
  assert.match(doc, /676 filter_logic extract playlist id block bytes/);
  assert.match(doc, /7 filter_logic candidate mix flag block lines/);
  assert.match(doc, /314 filter_logic candidate mix flag block bytes/);
  assert.match(doc, /8 filter_logic category renderer allowlist block lines/);
  assert.match(doc, /618 filter_logic category renderer allowlist block bytes/);
  assert.match(doc, /48 DOM fallback mix helper block lines/);
  assert.match(doc, /2207 DOM fallback mix helper block bytes/);
  assert.match(doc, /27 DOM fallback playlist cards exclude radio block lines/);
  assert.match(doc, /1459 DOM fallback playlist cards exclude radio block bytes/);
  assert.match(doc, /21 DOM fallback mix chip direct block lines/);
  assert.match(doc, /1127 DOM fallback mix chip direct block bytes/);
  assert.match(doc, /14 DOM fallback mix card decision block lines/);
  assert.match(doc, /566 DOM fallback mix card decision block bytes/);
  assert.match(doc, /24 DOM fallback chip filtering block lines/);
  assert.match(doc, /968 DOM fallback chip filtering block bytes/);
  assert.match(doc, /0 filter_logic total hideMixPlaylists tokens/);
  assert.match(doc, /2 filter_logic total isMix tokens/);
  assert.match(doc, /5 filter_logic total radioRenderer tokens/);
  assert.match(doc, /5 filter_logic total compactRadioRenderer tokens/);
  assert.match(doc, /11 filter_logic total playlistId tokens/);
  assert.match(doc, /0 seed total hideMixPlaylists tokens/);
  assert.match(doc, /3 DOM fallback total hidden-by-mix-radio marker tokens/);
  assert.match(doc, /10 DOM fallback total start_radio markers/);
  assert.match(doc, /12 background total hideMixPlaylists tokens/);
  assert.match(doc, /JSON radio renderer pass-through behavior/);
  assert.match(doc, /JSON compact radio renderer pass-through behavior/);
  assert.match(doc, /`RD` playlist id pass-through behavior/);
  assert.match(doc, /Mix-title playlist pass-through behavior/);
  assert.match(doc, /ordinary playlist\/video pass-through behavior/);
  assert.match(doc, /JSON `isMix` candidate classification without a hide decision/);
  assert.match(doc, /seed active-work omission/);
  assert.match(doc, /background refresh-key omission/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-mix-playlists contracts/);
  assert.match(doc, /Mix decision reports/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM Mix parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /stale background cache reports/);
  assert.match(doc, /playlist\/Mix interaction policies/);
  assert.match(doc, /first-class hide-mix-playlists authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_members_only_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideMembersOnly boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_MEMBERS_ONLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-members-only-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, Members-only global filter, renderer traversal, candidate metadata extraction, DOM parity, broad watch\/shelf selector, marker\/restore, seed active-work, background compile\/refresh, shared settings, filter-logic, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, and `js\/settings_shared\.js`/);
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
  assert.match(doc, /35 background boolean pass-through block lines/);
  assert.match(doc, /3596 background boolean pass-through block bytes/);
  assert.match(doc, /16 background storage refresh keys block lines/);
  assert.match(doc, /461 background storage refresh keys block bytes/);
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
  assert.match(doc, /3 DOM fallback total UUMO markers/);
  assert.match(doc, /13 background total hideMembersOnly tokens/);
  assert.match(doc, /23 settings_shared total hideMembersOnly tokens/);
  assert.match(doc, /JSON badge-video pass-through behavior/);
  assert.match(doc, /JSON accessibility-video pass-through behavior/);
  assert.match(doc, /Members-only title playlist pass-through behavior/);
  assert.match(doc, /`UUMO` playlist pass-through behavior/);
  assert.match(doc, /generic metadata extraction without an `isMembersOnly` candidate field/);
  assert.match(doc, /background compile and refresh inclusion/);
  assert.match(doc, /shared settings compile inclusion/);
  assert.match(doc, /DOM broad watch\/shelf selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-members-only contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /broad-hide reports/);
  assert.match(doc, /settings parity reports/);
  assert.match(doc, /first-class hide-members-only authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_sponsored_cards_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideSponsoredCards boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_SPONSORED_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-sponsored-cards-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, sponsored-card global filter, ad renderer traversal, DOM parity, ad-surface selector, seed active-work, background compile\/refresh, shared settings, filter-logic, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, and `js\/settings_shared\.js`/);
  assert.match(doc, /5 hideSponsoredCards boundary source files/);
  assert.match(doc, /7 hideSponsoredCards source\/effect blocks/);
  assert.match(doc, /10 seed active JSON rules block lines/);
  assert.match(doc, /634 seed active JSON rules block bytes/);
  assert.match(doc, /15 DOM fallback sponsored CSS rules block lines/);
  assert.match(doc, /567 DOM fallback sponsored CSS rules block bytes/);
  assert.match(doc, /28 DOM fallback active boolean keys block lines/);
  assert.match(doc, /905 DOM fallback active boolean keys block bytes/);
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
  assert.match(doc, /JSON ad-slot pass-through behavior/);
  assert.match(doc, /JSON promoted-sparkles pass-through behavior/);
  assert.match(doc, /JSON search-PYV pass-through behavior/);
  assert.match(doc, /nested promoted ad-slot pass-through behavior/);
  assert.match(doc, /ordinary video pass-through behavior/);
  assert.match(doc, /background compile and refresh inclusion/);
  assert.match(doc, /shared settings compile inclusion/);
  assert.match(doc, /DOM ad slot selector behavior/);
  assert.match(doc, /DOM promoted\/search\/display\/companion selector behavior/);
  assert.match(doc, /DOM engagement-panel ad selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-sponsored-cards contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /ad-surface reports/);
  assert.match(doc, /CSS target reports/);
  assert.match(doc, /first-class hide-sponsored-cards authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_home_feed_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideHomeFeed boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_HOME_FEED_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-home-feed-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, home-feed global filter, route-scoped browse filtering, desktop\/mobile route parity, DOM parity, marker\/restore, seed active-work, background compile\/refresh, shared settings, filter-logic, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, and `js\/settings_shared\.js`/);
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
  assert.match(doc, /JSON rich-item pass-through behavior/);
  assert.match(doc, /JSON home section and lockup pass-through behavior/);
  assert.match(doc, /desktop harvest-only home browse behavior/);
  assert.match(doc, /desktop active-keyword processData behavior/);
  assert.match(doc, /mobile home browse processData pass-through behavior/);
  assert.match(doc, /DOM desktop home browse selector behavior/);
  assert.match(doc, /DOM mobile route-home selector behavior/);
  assert.match(doc, /DOM hide-home-feed marker behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-home-feed contracts/);
  assert.match(doc, /route policies/);
  assert.match(doc, /JSON\/DOM parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /mobile parity reports/);
  assert.match(doc, /first-class hide-home-feed authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_playlist_cards_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hidePlaylistCards boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_PLAYLIST_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-playlist-cards-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, playlist-card global filter, renderer traversal, DOM parity, playlist\/Mix interaction, direct display writer, seed active-work, background compile\/cache invalidation, shared settings, filter-logic, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, and `js\/settings_shared\.js`/);
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
  assert.match(doc, /JSON playlistRenderer pass-through behavior/);
  assert.match(doc, /JSON compactPlaylistRenderer pass-through behavior/);
  assert.match(doc, /JSON collection-stack lockup pass-through behavior/);
  assert.match(doc, /JSON radio renderer pass-through behavior/);
  assert.match(doc, /desktop harvest-only home browse behavior/);
  assert.match(doc, /desktop active-keyword processData behavior/);
  assert.match(doc, /background compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /DOM classic playlist selector behavior/);
  assert.match(doc, /DOM collection-stack lockup selector behavior/);
  assert.match(doc, /DOM direct `list=` lockup hiding behavior/);
  assert.match(doc, /DOM shelf\/horizontal-list container hiding behavior/);
  assert.match(doc, /DOM `start_radio=1` Mix\/radio exclusion behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-playlist-cards contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /Mix exclusion policies/);
  assert.match(doc, /settings parity reports/);
  assert.match(doc, /first-class hide-playlist-cards authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_recommended_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideRecommended boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_RECOMMENDED_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-recommended-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, watch recommendation toggle, watch-next renderer traversal, DOM parity, endpoint no-work, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON compactVideoRenderer pass-through behavior/);
  assert.match(doc, /JSON watchCardCompactVideoRenderer pass-through behavior/);
  assert.match(doc, /JSON secondarySearchContainerRenderer pass-through behavior/);
  assert.match(doc, /ordinary keyword-rule watch recommendation removal behavior/);
  assert.match(doc, /watch-next processData no-work gap behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /DOM #related selector behavior/);
  assert.match(doc, /DOM watch-next secondary results selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-recommended contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM watch recommendation parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /endpoint no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-recommended authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_video_sidebar_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideVideoSidebar boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_SIDEBAR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-video-sidebar-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, watch sidebar toggle, watch-next renderer traversal, DOM parity, endpoint no-work, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON compactVideoRenderer pass-through behavior/);
  assert.match(doc, /JSON watchCardCompactVideoRenderer pass-through behavior/);
  assert.match(doc, /JSON secondarySearchContainerRenderer pass-through behavior/);
  assert.match(doc, /ordinary keyword-rule watch sidebar removal behavior/);
  assert.match(doc, /watch-next processData no-work gap behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /DOM #secondary\.ytd-watch-flexy selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-video-sidebar contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM watch sidebar parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /endpoint no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-video-sidebar authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_live_chat_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideLiveChat boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_LIVE_CHAT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-live-chat-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, live chat toggle, watch-next engagement panel traversal, DOM parity, endpoint no-work, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON engagementPanelSectionListRenderer pass-through behavior/);
  assert.match(doc, /JSON liveChatRenderer pass-through behavior/);
  assert.match(doc, /neighboring compactVideoRenderer keyword-removal behavior/);
  assert.match(doc, /watch-next processData no-work gap behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /DOM ytd-live-chat-frame#chat selector behavior/);
  assert.match(doc, /DOM #chat-container selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-live-chat contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM live chat parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /endpoint no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-live-chat authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_watch_playlist_panel_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideWatchPlaylistPanel boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_WATCH_PLAYLIST_PANEL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-watch-playlist-panel-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, watch playlist panel toggle, watch-next playlist panel traversal, DOM parity, endpoint no-work, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON playlistPanelRenderer pass-through behavior/);
  assert.match(doc, /JSON playlistPanelVideoRenderer pass-through behavior/);
  assert.match(doc, /nested playlistPanelVideoRenderer keyword-removal behavior/);
  assert.match(doc, /watch-next processData no-work gap behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /DOM ytd-playlist-panel-renderer selector behavior/);
  assert.match(doc, /DOM ytm-playlist-panel-renderer selector behavior/);
  assert.match(doc, /DOM ytm-playlist-panel-renderer-v2 selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-watch-playlist-panel contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM watch playlist panel parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /selected\/current row reports/);
  assert.match(doc, /endpoint no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-watch-playlist-panel authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_video_info_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideVideoInfo boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_INFO_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-video-info-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, video-info chrome master toggle, watch metadata renderer traversal, whitelist-mode scaffolding, child video-info control interaction, DOM parity, endpoint no-work, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON videoPrimaryInfoRenderer pass-through behavior/);
  assert.match(doc, /JSON videoSecondaryInfoRenderer pass-through behavior/);
  assert.match(doc, /videoPrimaryInfoRenderer keyword-removal behavior/);
  assert.match(doc, /whitelist-mode watch metadata scaffolding preservation behavior/);
  assert.match(doc, /watch-next processData no-work gap behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /DOM #actions\.ytd-watch-metadata selector behavior/);
  assert.match(doc, /DOM #owner\.ytd-watch-metadata selector behavior/);
  assert.match(doc, /DOM #description\.ytd-watch-metadata selector behavior/);
  assert.match(doc, /DOM ytd-merch-shelf-renderer selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-video-info contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM video-info parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /whitelist-mode reports/);
  assert.match(doc, /child-control interaction reports/);
  assert.match(doc, /endpoint no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-video-info authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_video_buttons_bar_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideVideoButtonsBar boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_BUTTONS_BAR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-video-buttons-bar-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, video-buttons-bar child toggle, watch metadata renderer traversal, whitelist-mode scaffolding, hideVideoInfo master-toggle interaction, DOM parity, endpoint no-work, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON videoPrimaryInfoRenderer pass-through behavior/);
  assert.match(doc, /JSON videoSecondaryInfoRenderer pass-through behavior/);
  assert.match(doc, /videoPrimaryInfoRenderer keyword-removal behavior/);
  assert.match(doc, /whitelist-mode watch metadata scaffolding preservation behavior/);
  assert.match(doc, /watch-next processData no-work gap behavior/);
  assert.match(doc, /hideVideoInfo master-toggle shared selector behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /DOM #actions\.ytd-watch-metadata selector behavior/);
  assert.match(doc, /DOM #info > #menu-container selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-video-buttons-bar contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM video-buttons-bar parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /whitelist-mode reports/);
  assert.match(doc, /child-control interaction reports/);
  assert.match(doc, /endpoint no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-video-buttons-bar authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_video_channel_row_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideVideoChannelRow boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_CHANNEL_ROW_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-video-channel-row-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, video-channel-row child toggle, watch metadata renderer traversal, whitelist-mode scaffolding, hideVideoInfo master-toggle interaction, DOM parity, endpoint no-work, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON videoPrimaryInfoRenderer pass-through behavior/);
  assert.match(doc, /JSON videoSecondaryInfoRenderer pass-through behavior/);
  assert.match(doc, /videoSecondaryInfoRenderer keyword-or-channel-removal behavior/);
  assert.match(doc, /whitelist-mode watch metadata scaffolding preservation behavior/);
  assert.match(doc, /watch-next processData no-work gap behavior/);
  assert.match(doc, /hideVideoInfo master-toggle shared selector behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /DOM #owner\.ytd-watch-metadata selector behavior/);
  assert.match(doc, /DOM #top-row\.ytd-video-secondary-info-renderer selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-video-channel-row contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM video-channel-row parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /whitelist-mode reports/);
  assert.match(doc, /child-control interaction reports/);
  assert.match(doc, /endpoint no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-video-channel-row authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_video_description_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideVideoDescription boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_VIDEO_DESCRIPTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-video-description-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, video-description child toggle, watch metadata renderer traversal, whitelist-mode scaffolding, hideVideoInfo master-toggle interaction, DOM parity, endpoint no-work, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON videoPrimaryInfoRenderer pass-through behavior/);
  assert.match(doc, /JSON videoSecondaryInfoRenderer pass-through behavior/);
  assert.match(doc, /videoPrimaryInfoRenderer keyword-removal behavior/);
  assert.match(doc, /whitelist-mode watch metadata scaffolding preservation behavior/);
  assert.match(doc, /watch-next processData no-work gap behavior/);
  assert.match(doc, /hideVideoInfo master-toggle shared selector behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /DOM #description\.ytd-watch-metadata selector behavior/);
  assert.match(doc, /DOM ytd-expander\.ytd-video-secondary-info-renderer selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-video-description contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM video-description parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /whitelist-mode reports/);
  assert.match(doc, /child-control interaction reports/);
  assert.match(doc, /endpoint no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-video-description authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_ask_button_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideAskButton boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_ASK_BUTTON_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-ask-button-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, Ask button child toggle, watch metadata renderer traversal, whitelist-mode scaffolding, explicit hideAskButton whitelist behavior, hideVideoInfo master-toggle interaction, DOM parity, endpoint no-work, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON videoPrimaryInfoRenderer pass-through behavior/);
  assert.match(doc, /JSON videoSecondaryInfoRenderer pass-through behavior/);
  assert.match(doc, /videoPrimaryInfoRenderer keyword-removal behavior/);
  assert.match(doc, /whitelist-mode watch metadata scaffolding preservation behavior/);
  assert.match(doc, /watch-next processData no-work gap behavior/);
  assert.match(doc, /hideVideoInfo master-toggle shared selector behavior/);
  assert.match(doc, /explicit hideAskButton whitelist behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /DOM a\[aria-label="Ask"\] selector behavior/);
  assert.match(doc, /DOM button\[aria-label="Ask"\] selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-ask-button contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM Ask button parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /whitelist-mode reports/);
  assert.match(doc, /child-control interaction reports/);
  assert.match(doc, /endpoint no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-ask-button authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_merch_tickets_offers_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideMerchTicketsOffers boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_MERCH_TICKETS_OFFERS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-merch-tickets-offers-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, Merch\/Tickets\/Offers child toggle, watch metadata renderer traversal, whitelist-mode scaffolding, explicit hideMerchTicketsOffers whitelist behavior, hideVideoInfo master-toggle interaction, DOM parity, endpoint no-work, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON videoPrimaryInfoRenderer pass-through behavior/);
  assert.match(doc, /JSON videoSecondaryInfoRenderer pass-through behavior/);
  assert.match(doc, /videoPrimaryInfoRenderer keyword-removal behavior/);
  assert.match(doc, /whitelist-mode watch metadata scaffolding preservation behavior/);
  assert.match(doc, /watch-next processData no-work gap behavior/);
  assert.match(doc, /hideVideoInfo master-toggle shared selector behavior/);
  assert.match(doc, /explicit hideMerchTicketsOffers whitelist behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /DOM #ticket-shelf selector behavior/);
  assert.match(doc, /DOM ytd-merch-shelf-renderer selector behavior/);
  assert.match(doc, /DOM #offer-module selector behavior/);
  assert.match(doc, /DOM #clarify-box selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-merch-tickets-offers contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM Merch\/Tickets\/Offers parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /whitelist-mode reports/);
  assert.match(doc, /child-control interaction reports/);
  assert.match(doc, /endpoint no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-merch-tickets-offers authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_endscreen_videowall_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideEndscreenVideowall boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_ENDSCREEN_VIDEOWALL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-endscreen-videowall-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, endscreen-videowall toggle, direct endScreenVideoRenderer traversal, compactAutoplayRenderer gap, whitelist-mode behavior, player overlay DOM parity, endpoint no-work, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON endScreenVideoRenderer pass-through behavior under hideEndscreenVideowall alone/);
  assert.match(doc, /JSON compactAutoplayRenderer pass-through behavior/);
  assert.match(doc, /endScreenVideoRenderer keyword-removal behavior/);
  assert.match(doc, /compactAutoplayRenderer leak behavior/);
  assert.match(doc, /whitelist-mode supported end-screen fail-closed behavior/);
  assert.match(doc, /watch-next processData no-work gap behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /DOM #movie_player \.ytp-endscreen-content selector behavior/);
  assert.match(doc, /DOM #movie_player \.ytp-fullscreen-grid-stills-container selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-endscreen-videowall contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM endscreen-videowall parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /whitelist-mode reports/);
  assert.match(doc, /player overlay policies/);
  assert.match(doc, /endpoint no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-endscreen-videowall authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_endscreen_cards_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideEndscreenCards boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_ENDSCREEN_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-endscreen-cards-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, endscreen-cards toggle, direct endScreenVideoRenderer traversal, compactAutoplayRenderer gap, whitelist-mode behavior, player overlay DOM parity, endpoint no-work, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON endScreenVideoRenderer pass-through behavior under hideEndscreenCards alone/);
  assert.match(doc, /JSON compactAutoplayRenderer pass-through behavior/);
  assert.match(doc, /endScreenVideoRenderer keyword-removal behavior/);
  assert.match(doc, /compactAutoplayRenderer leak behavior/);
  assert.match(doc, /whitelist-mode supported end-screen fail-closed behavior/);
  assert.match(doc, /watch-next processData no-work gap behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /DOM #movie_player \.ytp-ce-element selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-endscreen-cards contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM endscreen-cards parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /whitelist-mode reports/);
  assert.match(doc, /player overlay policies/);
  assert.match(doc, /endpoint no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-endscreen-cards authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_top_header_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideTopHeader boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_TOP_HEADER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-top-header-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, top-header toggle, topbar JSON pass-through, masthead DOM parity, endpoint no-work, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON topbar pass-through behavior under hideTopHeader alone/);
  assert.match(doc, /neighboring watch row keyword-removal behavior/);
  assert.match(doc, /watch-next processData no-work gap behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /shared settings compile inclusion/);
  assert.match(doc, /DOM #masthead-container selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-top-header contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM top-header parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /route no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-top-header authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_notification_bell_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideNotificationBell boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_NOTIFICATION_BELL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-notification-bell-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, notification-bell toggle, notificationRenderer traversal, topbar notification JSON pass-through, DOM parity, endpoint no-work, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON notification button pass-through behavior under hideNotificationBell alone/);
  assert.match(doc, /notificationRenderer keyword-removal behavior/);
  assert.match(doc, /watch-next processData no-work gap behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /shared settings compile inclusion/);
  assert.match(doc, /DOM notification topbar button selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-notification-bell contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM notification-bell parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /route no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-notification-bell authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_explore_trending_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideExploreTrending boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_EXPLORE_TRENDING_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-explore-trending-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, explore-trending navigation toggle, guide JSON pass-through, browse route no-work, DOM parity, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON Explore\/Trending guide pass-through behavior under hideExploreTrending alone/);
  assert.match(doc, /neighboring row keyword-removal behavior/);
  assert.match(doc, /browse processData no-work gap behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /shared settings compile inclusion/);
  assert.match(doc, /DOM Explore\/Trending route selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-explore-trending contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM Explore\/Trending parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /route no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-explore-trending authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_more_from_youtube_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideMoreFromYouTube boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_MORE_FROM_YOUTUBE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-more-from-youtube-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, more-from-youtube navigation toggle, guide-section JSON pass-through, guide endpoint no-work, DOM parity, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON More from YouTube guide-section pass-through behavior under hideMoreFromYouTube alone/);
  assert.match(doc, /neighboring row keyword-removal behavior/);
  assert.match(doc, /guide processData no-work gap behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /shared settings compile inclusion/);
  assert.match(doc, /DOM #sections > ytd-guide-section-renderer:nth-last-child\(2\) selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-more-from-youtube contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM More from YouTube parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /route no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-more-from-youtube authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_subscriptions_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideSubscriptions boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_SUBSCRIPTIONS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-subscriptions-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, subscriptions navigation toggle, guide-section JSON pass-through, guide endpoint no-work, DOM parity, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON Subscriptions guide-section pass-through behavior under hideSubscriptions alone/);
  assert.match(doc, /neighboring row keyword-removal behavior/);
  assert.match(doc, /guide processData no-work gap behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /shared settings compile inclusion/);
  assert.match(doc, /DOM subscriptions guide and route selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-subscriptions contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM Subscriptions parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /route no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-subscriptions authority gates/);
});

test('tracked_file_obligation_index_links_json_first_hide_search_shelves_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first hideSearchShelves boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_HIDE_SEARCH_SHELVES_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-hide-search-shelves-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, search-shelves toggle, search shelf JSON pass-through, search endpoint harvest-only behavior, DOM parity, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON Search Shelves pass-through behavior under hideSearchShelves alone/);
  assert.match(doc, /shelf-title keyword-removal behavior/);
  assert.match(doc, /search harvest-only no-work behavior/);
  assert.match(doc, /active-keyword search processData behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /shared settings compile inclusion/);
  assert.match(doc, /DOM search shelf selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hide-search-shelves contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM Search Shelves parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /route no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class hide-search-shelves authority gates/);
});

test('tracked_file_obligation_index_links_json_first_disable_autoplay_annotations_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first disableAutoplay\/disableAnnotations boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_DISABLE_AUTOPLAY_ANNOTATIONS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-disable-autoplay-annotations-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, player-control toggle, compact autoplay JSON pass-through, watch-next endpoint work, DOM parity, background compile\/cache invalidation, content bridge refresh, shared settings, filter-logic, seed active-work, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/content\/bridge_settings\.js`/);
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
  assert.match(doc, /JSON player-control pass-through behavior under disableAutoplay\/disableAnnotations alone/);
  assert.match(doc, /supported endScreenVideoRenderer keyword-removal behavior/);
  assert.match(doc, /compactAutoplayRenderer leak behavior/);
  assert.match(doc, /watch-next processData no-work gap behavior/);
  assert.match(doc, /background read and compile inclusion with storage-change invalidation omission/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /shared settings compile inclusion/);
  assert.match(doc, /DOM autonav selector behavior/);
  assert.match(doc, /DOM annotation selector behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /player-control contracts/);
  assert.match(doc, /renderer inventory policies/);
  assert.match(doc, /JSON\/DOM player control parity reports/);
  assert.match(doc, /DOM-only policy reports/);
  assert.match(doc, /compact-autoplay gap reports/);
  assert.match(doc, /route no-work budgets/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /first-class disable-autoplay\/annotations authority gates/);
});

test('tracked_file_obligation_index_links_quick_block_block_menu_affordance_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Quick-block\/block-menu affordance boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_QUICK_BLOCK_BLOCK_MENU_AFFORDANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/quick-block-block-menu-affordance-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, settings-mode, DOM selector, lifecycle\/listener\/observer\/timer, no-work, performance, reliability, false-hide\/leak, code-burden, quick-block affordance, block-menu affordance, fallback menu action, storage\/cache refresh, StateManager, content bridge, block-channel, and cross-feature rows in `js\/content_controls_catalog\.js`, `js\/settings_shared\.js`, `js\/background\.js`, `js\/content\/bridge_settings\.js`, `js\/state_manager\.js`, `js\/content\/block_channel\.js`, and `js\/content_bridge\.js`/);
  assert.match(doc, /7 quick-block\/block-menu affordance boundary source files/);
  assert.match(doc, /16 quick-block\/block-menu affordance source\/effect blocks/);
  assert.match(doc, /10 catalog feed affordance controls block lines/);
  assert.match(doc, /488 catalog feed affordance controls block bytes/);
  assert.match(doc, /38 settings_shared settings keys block lines/);
  assert.match(doc, /1031 settings_shared settings keys block bytes/);
  assert.match(doc, /2 settings_shared affordance compile block lines/);
  assert.match(doc, /126 settings_shared affordance compile block bytes/);
  assert.match(doc, /35 background boolean pass-through block lines/);
  assert.match(doc, /3596 background boolean pass-through block bytes/);
  assert.match(doc, /16 background storage refresh keys block lines/);
  assert.match(doc, /461 background storage refresh keys block bytes/);
  assert.match(doc, /44 content bridge storage refresh keys block lines/);
  assert.match(doc, /1263 content bridge storage refresh keys block bytes/);
  assert.match(doc, /33 state manager valid setting keys block lines/);
  assert.match(doc, /1063 state manager valid setting keys block bytes/);
  assert.match(doc, /41 state manager external reload keys block lines/);
  assert.match(doc, /1604 state manager external reload keys block bytes/);
  assert.match(doc, /44 quick block card selectors block lines/);
  assert.match(doc, /1519 quick block card selectors block bytes/);
  assert.match(doc, /10 quick block enabled gate block lines/);
  assert.match(doc, /296 quick block enabled gate block bytes/);
  assert.match(doc, /209 quick block setup lifecycle block lines/);
  assert.match(doc, /8699 quick block setup lifecycle block bytes/);
  assert.match(doc, /14 normal menu injection gate block lines/);
  assert.match(doc, /411 normal menu injection gate block bytes/);
  assert.match(doc, /31 fallback menu button creation block lines/);
  assert.match(doc, /1533 fallback menu button creation block bytes/);
  assert.match(doc, /127 fallback menu scan lifecycle block lines/);
  assert.match(doc, /4115 fallback menu scan lifecycle block bytes/);
  assert.match(doc, /104 fallback popover open block lines/);
  assert.match(doc, /3500 fallback popover open block bytes/);
  assert.match(doc, /212 fallback perform block action block lines/);
  assert.match(doc, /9930 fallback perform block action block bytes/);
  assert.match(doc, /43 quick block selector entries/);
  assert.match(doc, /11 quick block setup addEventListener callsites/);
  assert.match(doc, /1 quick block setup MutationObserver callsite/);
  assert.match(doc, /18 fallback menu scan selector literals/);
  assert.match(doc, /catalog exposure behavior/);
  assert.match(doc, /default-on compile behavior/);
  assert.match(doc, /background invalidation omission/);
  assert.match(doc, /quick-block lifecycle overwork behavior/);
  assert.match(doc, /fallback menu gate drift behavior/);
  assert.match(doc, /fallback row hide\/mutation\/rerun behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /affordance contracts/);
  assert.match(doc, /fallback parity reports/);
  assert.match(doc, /selector inventory policies/);
  assert.match(doc, /false-hide\/restore reports/);
  assert.match(doc, /first-class affordance authority gates/);
});

test('tracked_file_obligation_index_links_quick_block_default_migration_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Quick-block default migration boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_QUICK_BLOCK_DEFAULT_MIGRATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/quick-block-default-migration-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open settings-mode, install\/update mutation, storage\/cache, quick-block affordance, reliability, false-hide\/leak, performance, code-burden, migration\/versioning, background source, and cross-feature rows in `js\/background\.js`/);
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
  assert.match(doc, /semver comparison/);
  assert.match(doc, /already-applied skip/);
  assert.match(doc, /current-version-below-target skip/);
  assert.match(doc, /previous-version-at-target skip/);
  assert.match(doc, /pre-target update root\/profile writes/);
  assert.match(doc, /install root default write before migration call/);
  assert.match(doc, /update migration call with `details\.previousVersion \|\| ''`/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /migration contracts/);
  assert.match(doc, /per-profile mutation reports/);
  assert.match(doc, /install\/update decision reports/);
  assert.match(doc, /root\/profile precedence policies/);
  assert.match(doc, /marker\/version intent reports/);
  assert.match(doc, /failure\/rollback reports/);
  assert.match(doc, /storage revisions/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class affordance migration gates/);
});

test('tracked_file_obligation_index_links_keyword_comments_scope_migration_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Keyword-comments scope migration boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_KEYWORD_COMMENTS_SCOPE_MIGRATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/keyword-comments-scope-migration-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open settings-mode, install\/update mutation, storage\/cache, keyword\/comment scope, comments global filter, reliability, false-hide\/leak, performance, code-burden, migration\/versioning, background source, and cross-feature rows in `js\/background\.js`/);
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
  assert.match(doc, /already-applied skip/);
  assert.match(doc, /disabled-comments root row clearing/);
  assert.match(doc, /comments-enabled root row preservation plus root filterComments clearing/);
  assert.match(doc, /V4 profile settings filterComments deletion/);
  assert.match(doc, /V4 main row migration/);
  assert.match(doc, /alias-row preservation outside the local migration target/);
  assert.match(doc, /catch-path marker\/filterComments write/);
  assert.match(doc, /install\/update migration call sequencing/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /migration contracts/);
  assert.match(doc, /per-row mutation reports/);
  assert.match(doc, /root\/profile comments-scope decision reports/);
  assert.match(doc, /list-mode parity reports/);
  assert.match(doc, /alias row policies/);
  assert.match(doc, /Kids row policies/);
  assert.match(doc, /install\/update sequencing reports/);
  assert.match(doc, /failure\/rollback reports/);
  assert.match(doc, /storage revisions/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class comments-scope migration gates/);
});

test('tracked_file_obligation_index_links_kids_comments_filter_all_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Kids comments Filter All boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_KIDS_COMMENTS_FILTER_ALL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/kids-comments-filter-all-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open settings-mode, Kids row-action, keyword\/comment scope, channel-derived Filter All, JSON comment filtering/);
  assert.match(doc, /`js\/state_manager\.js`, `js\/render_engine\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/filter_logic\.js`/);
  assert.match(doc, /5 Kids comments Filter All boundary source files/);
  assert.match(doc, /8 Kids comments Filter All source\/effect blocks/);
  assert.match(doc, /33 StateManager toggleKidsKeywordComments block lines/);
  assert.match(doc, /1187 toggleKidsKeywordComments bytes/);
  assert.match(doc, /35 StateManager toggleKidsChannelFilterAll block lines/);
  assert.match(doc, /1184 toggleKidsChannelFilterAll bytes/);
  assert.match(doc, /64 RenderEngine keyword comments gate block lines/);
  assert.match(doc, /3192 keyword comments gate bytes/);
  assert.match(doc, /44 RenderEngine channel Filter All toggle block lines/);
  assert.match(doc, /2100 channel Filter All toggle bytes/);
  assert.match(doc, /47 background Kids compile block lines/);
  assert.match(doc, /2401 background Kids compile bytes/);
  assert.match(doc, /27 background compiled channel object block lines/);
  assert.match(doc, /1850 background channel object bytes/);
  assert.match(doc, /72 settings_shared syncFilterAllKeywords block lines/);
  assert.match(doc, /34 filter_logic comment decision block lines/);
  assert.match(doc, /7 runtime Kids comments Filter All fixtures/);
  assert.match(doc, /Kids blocklist keyword comments API mutation/);
  assert.match(doc, /Kids whitelist keyword comments API mutation/);
  assert.match(doc, /Kids channel Filter All `filterAll` mutation with `filterAllComments` preservation/);
  assert.match(doc, /Kids whitelist write-silent Filter All/);
  assert.match(doc, /RenderEngine Kids comments toggle suppression/);
  assert.match(doc, /Main channel-derived comments toggle retention/);
  assert.match(doc, /background Kids compile channel-derived comment merge/);
  assert.match(doc, /shared compiler `filterAllComments` policy/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /Kids comments row contracts/);
  assert.match(doc, /row-action parity reports/);
  assert.match(doc, /Kids channel comments-scope policies/);
  assert.match(doc, /compiler parity reports/);
  assert.match(doc, /JSON comment keyword provenance reports/);
  assert.match(doc, /first-class Kids comments Filter All gates/);
});

test('tracked_file_obligation_index_links_enabled_master_switch_disabled_runtime_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Enabled master switch disabled-runtime boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_ENABLED_MASTER_SWITCH_DISABLED_RUNTIME_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/enabled-master-switch-disabled-runtime-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open settings-mode, JSON-first, no-work, endpoint\/XHR, DOM fallback, storage\/cache refresh, StateManager, performance, reliability, false-hide\/leak, code-burden, cross-feature, and optimization rows in `js\/seed\.js`, `js\/filter_logic\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/settings_shared\.js`, `js\/content\/bridge_settings\.js`, and `js\/state_manager\.js`/);
  assert.match(doc, /7 enabled disabled-runtime source files/);
  assert.match(doc, /14 source\/effect blocks/);
  assert.match(doc, /disabled seed fetch parse\/stringify work without engine work/);
  assert.match(doc, /seed XHR disabled pre-body return/);
  assert.match(doc, /engine harvest-before-disabled ordering/);
  assert.match(doc, /DOM fallback active-work and disabled cleanup gates/);
  assert.match(doc, /background compiled settings inclusion/);
  assert.match(doc, /background storage invalidation omission/);
  assert.match(doc, /shared settings inclusion/);
  assert.match(doc, /content bridge refresh inclusion/);
  assert.match(doc, /StateManager valid-key inclusion/);
  assert.match(doc, /StateManager external reload inclusion/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /disabled pass-through budgets/);
  assert.match(doc, /XHR listener budgets/);
  assert.match(doc, /engine harvest permission/);
  assert.match(doc, /DOM restore proof/);
  assert.match(doc, /settings refresh parity/);
  assert.match(doc, /JSON-first promotion gates/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class enabled runtime authority gates/);
});

test('tracked_file_obligation_index_links_learned_identity_map_cache_persistence_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Learned identity map cache persistence boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_LEARNED_IDENTITY_MAP_CACHE_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/learned-identity-map-cache-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open learned-identity, storage\/cache, settings refresh, JSON-first, DOM stamp, DOM fallback rerun, performance, reliability, false-hide\/leak, code-burden, cross-feature, and source\/evidence rows in `js\/background\.js`, `js\/content_bridge\.js`, `js\/content\/bridge_settings\.js`, `js\/state_manager\.js`, and `js\/filter_logic\.js`/);
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
  assert.match(doc, /38 selected background compiledSettingsCache tokens/);
  assert.match(doc, /93 selected background channelMap tokens/);
  assert.match(doc, /46 selected background videoChannelMap tokens/);
  assert.match(doc, /40 selected background videoMetaMap tokens/);
  assert.match(doc, /31 selected content_bridge applyDOMFallback tokens/);
  assert.match(doc, /11 runtime learned identity map cache persistence fixtures/);
  assert.match(doc, /filter_logic producers validate and batch before page messages/);
  assert.match(doc, /background uses three debounced flush timers without revision reports/);
  assert.match(doc, /background map message receivers accept updates without sender policy or profile gates/);
  assert.match(doc, /content_bridge helpers patch local settings before background persistence/);
  assert.match(doc, /page-message receivers can stamp DOM, rerun fallback, and bypass background cache through direct custom URL storage/);
  assert.match(doc, /bridge_settings and StateManager map storage paths have asymmetric refresh behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /cache persistence contracts/);
  assert.match(doc, /direct storage bypass reports/);
  assert.match(doc, /producer\/receiver parity reports/);
  assert.match(doc, /first-class learned identity map cache persistence authority gates/);
});

test('tracked_file_obligation_index_links_stats_surface_legacy_metric_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Stats surface legacy metric boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_STATS_SURFACE_LEGACY_METRIC_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/stats-surface-legacy-metric-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open stats, false-hide\/leak, performance, reliability, hide\/restore, storage\/cache, dashboard, settings-mode, JSON-first, cross-feature, and implementation-change rows in `js\/content\/dom_helpers\.js`, `js\/content_bridge\.js`, `js\/background\.js`, `js\/settings_shared\.js`, `js\/state_manager\.js`, and `js\/tab-view\.js`/);
  assert.match(doc, /6 stats metric boundary source files/);
  assert.match(doc, /14 source\/effect blocks/);
  assert.match(doc, /DOM hide\/restore stats\/media coupling/);
  assert.match(doc, /content `statsBySurface` read\/write behavior/);
  assert.match(doc, /Main legacy stats fallback writes/);
  assert.match(doc, /attribute-based restore accounting/);
  assert.match(doc, /background legacy `recordTimeSaved` raw seconds writes/);
  assert.match(doc, /shared settings metric-key inclusion/);
  assert.match(doc, /StateManager metric load and reload drift/);
  assert.match(doc, /dashboard surface\/legacy fallback behavior/);
  assert.match(doc, /dashboard listener\/timer behavior/);
  assert.match(doc, /JSON-first metric eligibility blockers/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /structured hide eligibility/);
  assert.match(doc, /trusted\/ranged legacy metric writes/);
  assert.match(doc, /restore accounting/);
  assert.match(doc, /dashboard refresh parity/);
  assert.match(doc, /storage-write budgets/);
  assert.match(doc, /JSON-side metric eligibility/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class stats side-effect authority gates/);
});

test('tracked_file_obligation_index_links_prompt_release_overlay_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Prompt release overlay boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_PROMPT_RELEASE_OVERLAY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/prompt-release-overlay-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open prompt\/onboarding, release-note, manifest load-order, background message, dashboard, external-navigation, mobile viewport, public-claim, JSON-first public-claim, cross-feature, and implementation-change rows in `manifest\.json`, `manifest\.chrome\.json`, `manifest\.firefox\.json`, `manifest\.opera\.json`, `package\.json`, `data\/release_notes\.json`, `js\/content\/first_run_prompt\.js`, `js\/content\/release_notes_prompt\.js`, `js\/background\.js`, and `js\/tab-view\.js`/);
  assert.match(doc, /10 prompt release boundary source files/);
  assert.match(doc, /12 source\/effect blocks/);
  assert.match(doc, /4 browser manifest prompt load-order lists/);
  assert.match(doc, /2 prompt content modules/);
  assert.match(doc, /2 overlay prompt ids/);
  assert.match(doc, /5 background prompt action branches/);
  assert.match(doc, /24 release note data entries/);
  assert.match(doc, /23 release note version rows/);
  assert.match(doc, /release-before-first-run-before-content-bridge manifest order/);
  assert.match(doc, /install\/update first-run prompt injection/);
  assert.match(doc, /update release-note payload staging/);
  assert.match(doc, /adjacent top-right overlay placement/);
  assert.match(doc, /local mobile CSS/);
  assert.match(doc, /release and first-run acknowledgement storage writes/);
  assert.match(doc, /direct `request\?\.url` What's New tab opening/);
  assert.match(doc, /content fallback navigation/);
  assert.match(doc, /dashboard release-note rendering/);
  assert.match(doc, /staged release-note\/public-claim drift/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /prompt owner and priority/);
  assert.match(doc, /acknowledgement sender-class proof/);
  assert.match(doc, /URL navigation policy/);
  assert.match(doc, /mobile viewport fit/);
  assert.match(doc, /release version gates/);
  assert.match(doc, /style-node teardown/);
  assert.match(doc, /JSON-first public-claim gates/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class prompt overlay authority gates/);
});

test('tracked_file_obligation_index_links_release_build_artifact_claim_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Release build artifact claim boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_RELEASE_BUILD_ARTIFACT_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/release-build-artifact-claim-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open release\/package, build artifact, README public-copy, manifest version, mobile artifact, generated UI freshness, public-claim, first-class JSON filter claim, performance direction, reliability, code-burden, source\/evidence, and implementation-change rows in `build\.js`, `package\.json`, `README\.md`, `CHANGELOG\.md`, `manifest\.json`, `manifest\.chrome\.json`, `manifest\.firefox\.json`, `manifest\.opera\.json`, and `data\/release_notes\.json`/);
  assert.match(doc, /9 release build artifact boundary source files/);
  assert.match(doc, /11 source\/effect blocks/);
  assert.match(doc, /browser\/package version `3\.3\.1`/);
  assert.match(doc, /staged newest release-note version `3\.3\.2`/);
  assert.match(doc, /24 release note data entries/);
  assert.match(doc, /23 release note version rows/);
  assert.match(doc, /package source directories `js`, `css`, `html`, `icons`, `data`, and `assets`/);
  assert.match(doc, /common package files `README\.md`, `CHANGELOG\.md`, and `LICENSE`/);
  assert.match(doc, /README badge mutation/);
  assert.match(doc, /browser ZIP checksum absence/);
  assert.match(doc, /public non-draft release creation before asset upload proof/);
  assert.match(doc, /mobile `\.sha256` staging/);
  assert.match(doc, /0 package\/public-claim\/artifact manifests/);
  assert.match(doc, /codebase inspection is finding future optimization locations and first-class JSON filter blockers/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /package manifests/);
  assert.match(doc, /README mutation gates/);
  assert.match(doc, /draft-first release flow/);
  assert.match(doc, /upload rollback/);
  assert.match(doc, /mobile artifact claim gates/);
  assert.match(doc, /ZIP checksum manifests/);
  assert.match(doc, /generated UI freshness/);
  assert.match(doc, /browser manifest parity/);
  assert.match(doc, /public claim fixtures/);
  assert.match(doc, /first-class JSON claim gates/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class release artifact authority gates/);
  assert.match(doc, /First optimization structural burden queue addendum/);
  assert.match(doc, /12 structural burden queue rows/);
  assert.match(doc, /5 large runtime source files over 1000 lines covered/);
  assert.match(doc, /0 implementation-ready structural cleanup rows/);
  assert.match(doc, /0 JSON-first structural optimization approvals/);
  assert.match(doc, /runtime structural cleanup, JSON-first structural optimization, whitelist structural optimization/);
});

test('tracked_file_obligation_index_links_content_control_json_first_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content control JSON-first boundary index addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_CONTROL_JSON_FIRST_BOUNDARY_INDEX_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/content-control-json-first-boundary-index-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, content catalog, JSON-first, settings-mode, DOM parity, no-work, performance, reliability, false-hide\/leak, code-burden, cache invalidation, StateManager, shared settings, background compile, and cross-feature rows in `js\/content_controls_catalog\.js`, `js\/settings_shared\.js`, `js\/state_manager\.js`, and `js\/background\.js`/);
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
  assert.match(doc, /shared settings uses `hideAllShorts` and `hideAllComments`/);
  assert.match(doc, /StateManager valid UI keys use `hideShorts` and `hideComments`/);
  assert.match(doc, /background invalidation includes `hideAllShorts` and `hideComments` but not `hideAllComments` or `hideShorts`/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /catalog\/runtime key contracts/);
  assert.match(doc, /alias policies/);
  assert.match(doc, /route\/surface matrices/);
  assert.match(doc, /settings-mode matrices/);
  assert.match(doc, /JSON\/DOM parity matrices/);
  assert.match(doc, /settings invalidation parity reports/);
  assert.match(doc, /per-control no-work budgets/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class content-control JSON gates/);
});

test('tracked_file_obligation_index_links_content_control_active_work_matrix_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content control active-work matrix addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_CONTROL_ACTIVE_WORK_MATRIX_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/content-control-active-work-matrix-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, content catalog, JSON-first, settings-mode, DOM fallback, no-work, performance, reliability, false-hide\/leak, code-burden, cache invalidation, content bridge refresh, StateManager reload, background compile, and cross-feature rows in `js\/content_controls_catalog\.js`, `js\/seed\.js`, `js\/filter_logic\.js`, `js\/content\/dom_fallback\.js`, `js\/background\.js`, `js\/content\/bridge_settings\.js`, `js\/settings_shared\.js`, and `js\/state_manager\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /runtime key manifests/);
  assert.match(doc, /JSON work decisions/);
  assert.match(doc, /DOM work decisions/);
  assert.match(doc, /background invalidation policies/);
  assert.match(doc, /affordance-work policies/);
  assert.match(doc, /player DOM-only policies/);
  assert.match(doc, /no-work budgets/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class JSON promotion gates/);
});

test('tracked_file_obligation_index_links_content_control_dom_style_selector_matrix_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content control DOM style selector matrix addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_CONTROL_DOM_STYLE_SELECTOR_MATRIX_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/content-control-dom-style-selector-matrix-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, content catalog, JSON-first, settings-mode, DOM selector, DOM fallback, no-work, performance, reliability, false-hide\/leak, code-burden, route-attribute, `:has\(\)` support, list-mode, runtime alias, restore, and cross-feature rows in `js\/content\/dom_fallback\.js` and `js\/content_controls_catalog\.js`/);
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
  assert.match(doc, /26 `rules\.push` callsites/);
  assert.match(doc, /1 `style\.textContent` assignment/);
  assert.match(doc, /`hideMembersOnly` is the largest branch with 31 selector rows/);
  assert.match(doc, /catalog `hideComments` maps to runtime `hideAllComments`/);
  assert.match(doc, /explicit `hideAskButton` and `hideMerchTicketsOffers` are not directly wrapped by `listMode !== 'whitelist'`/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /selector ownership/);
  assert.match(doc, /route\/surface scope/);
  assert.match(doc, /target-shape reports/);
  assert.match(doc, /`:has\(\)` support policy/);
  assert.match(doc, /list-mode effect reports/);
  assert.match(doc, /restore proof/);
  assert.match(doc, /negative sibling-visible fixtures/);
  assert.match(doc, /no-work budgets/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /JSON\/DOM parity decisions/);
});

test('tracked_file_obligation_index_links_content_control_dom_style_lifecycle_restore_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content control DOM style lifecycle restore addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_CONTROL_DOM_STYLE_LIFECYCLE_RESTORE_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/content-control-dom-style-lifecycle-restore-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, JSON-first, settings-mode, DOM selector, DOM fallback, disabled-state, no-work, performance, reliability, false-hide\/leak, code-burden, route-attribute, restore, player-control, open-app cleanup, and cross-feature rows in `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /6 style-writer callsite block lines/);
  assert.match(doc, /371 style-writer callsite block bytes/);
  assert.match(doc, /21 disabled cleanup branch lines/);
  assert.match(doc, /959 disabled cleanup branch bytes/);
  assert.match(doc, /26 style writer rules\.push callsites/);
  assert.match(doc, /1 style writer textContent assignment/);
  assert.match(doc, /0 style writer rules\.length empty-state gates/);
  assert.match(doc, /1 clear-stale style text blanking callsite/);
  assert.match(doc, /0 clear-stale style node removal callsites/);
  assert.match(doc, /1 disabled cleanup style text blanking callsite/);
  assert.match(doc, /6 runtime content-control DOM style lifecycle fixtures/);
  assert.match(doc, /one reusable `#filtertube-content-controls-style` node/);
  assert.match(doc, /unconditional mobile open-app cleanup CSS on active writer calls/);
  assert.match(doc, /`hideHomeFeed` toggle-off CSS regeneration/);
  assert.match(doc, /no-active return before the style writer/);
  assert.match(doc, /disabled\/player-only active-gate omissions/);
  assert.match(doc, /stale cleanup blanking without style node removal/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /style node lifecycle reports/);
  assert.match(doc, /selector-owner restore proof/);
  assert.match(doc, /route-attribute policies/);
  assert.match(doc, /no-active cleanup budgets/);
  assert.match(doc, /disabled cleanup budgets/);
  assert.match(doc, /open-app cleanup policies/);
  assert.match(doc, /regeneration decision reports/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /JSON\/DOM parity gates/);
  assert.match(doc, /player DOM-only policies/);
});

test('tracked_file_obligation_index_links_open_app_cleanup_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Open App cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_OPEN_APP_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/open-app-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, JSON-first, settings-mode, DOM selector, DOM fallback, disabled-state, no-work, performance, reliability, false-hide\/leak, code-burden, mobile shell cleanup, open-app cleanup, restore, and cross-feature rows in `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /1 nearest `ytm-button-renderer` target-promotion callsite/);
  assert.match(doc, /1 inline `display:none!important` write/);
  assert.match(doc, /1 marker write/);
  assert.match(doc, /0 marker removal callsites/);
  assert.match(doc, /0 shared `toggleVisibility\(\)` callsites/);
  assert.match(doc, /1 swallowed catch block/);
  assert.match(doc, /5 style-writer Open App CSS selector rows/);
  assert.match(doc, /0 clear-stale marker references/);
  assert.match(doc, /0 disabled-cleanup marker references/);
  assert.match(doc, /1 product runtime marker reference/);
  assert.match(doc, /6 runtime open-app cleanup fixtures/);
  assert.match(doc, /Open App CSS plus direct cleanup call coupling/);
  assert.match(doc, /label\/href classification for app-open candidates/);
  assert.match(doc, /wrapper-versus-anchor target selection/);
  assert.match(doc, /safe-candidate preservation/);
  assert.match(doc, /swallowed query failures/);
  assert.match(doc, /no stale or disabled cleanup restore owner for `data-filtertube-hidden-open-app`/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /app-shell cleanup contracts/);
  assert.match(doc, /selector policies/);
  assert.match(doc, /target-shape reports/);
  assert.match(doc, /route\/surface policies/);
  assert.match(doc, /sibling-visible fixtures/);
  assert.match(doc, /restore owners/);
  assert.match(doc, /disabled-state restore proof/);
  assert.match(doc, /stale cleanup budgets/);
  assert.match(doc, /error metric artifacts/);
  assert.match(doc, /CSS\/direct-writer parity reports/);
  assert.match(doc, /JSON\/DOM parity gates/);
});

test('tracked_file_obligation_index_links_members_only_dom_cleanup_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Members-only DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_MEMBERS_ONLY_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/members-only-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, JSON-first, settings-mode, DOM selector, DOM fallback, disabled-state, no-work, performance, reliability, false-hide\/leak, code-burden, Members-only cleanup, broad-hide, restore, and cross-feature rows in `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /title-aria, membership-badge, `UUMO` link, and shelf-title evidence can hide direct DOM targets/);
  assert.match(doc, /badge evidence can hide both host and parent shelf/);
  assert.match(doc, /safe badge hosts remain visible/);
  assert.match(doc, /local toggle-off removes inline display and both markers/);
  assert.match(doc, /stale\/disabled cleanup omit the specialized Members-only marker/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /DOM cleanup contracts/);
  assert.match(doc, /selector policies/);
  assert.match(doc, /target-shape reports/);
  assert.match(doc, /route\/surface policies/);
  assert.match(doc, /sibling-visible fixtures/);
  assert.match(doc, /broad-hide decision reports/);
  assert.match(doc, /shared restore owners/);
  assert.match(doc, /stale cleanup budgets/);
  assert.match(doc, /disabled-state restore proof/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /CSS\/direct-writer parity reports/);
  assert.match(doc, /JSON\/DOM parity gates/);
  assert.match(doc, /explicit DOM-only policies/);
});

test('tracked_file_obligation_index_links_playlist_mix_dom_cleanup_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Playlist\/Mix DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_PLAYLIST_MIX_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/playlist-mix-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, JSON-first, settings-mode, DOM selector, DOM fallback, disabled-state, no-work, performance, reliability, false-hide\/leak, code-burden, playlist cleanup, Mix cleanup, marker ownership, restore, and cross-feature rows in `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /1 playlist direct querySelectorAll callsite/);
  assert.match(doc, /3 playlist direct inline display writes/);
  assert.match(doc, /3 playlist direct generic marker writes/);
  assert.match(doc, /1 Mix chip inline display write/);
  assert.match(doc, /1 Mix chip local display restore callsite/);
  assert.match(doc, /1 Mix card marker write callsite/);
  assert.match(doc, /1 Mix card marker removal callsite/);
  assert.match(doc, /0 clear-stale cleanup Mix marker references/);
  assert.match(doc, /0 disabled cleanup Mix marker references/);
  assert.match(doc, /3 product runtime Mix marker references/);
  assert.match(doc, /7 runtime playlist\/Mix DOM cleanup fixtures/);
  assert.match(doc, /playlist CSS excludes Mix\/radio through `start_radio=1`/);
  assert.match(doc, /Mix CSS owns radio renderer and `start_radio=1` selectors/);
  assert.match(doc, /valid non-radio collection-stack playlist lockups hide along with shelf\/horizontal containers/);
  assert.match(doc, /radio, missing-stack, and missing-`list=` lockups remain visible/);
  assert.match(doc, /Mix chip cleanup hides and restores only normalized Mixes chips/);
  assert.match(doc, /per-card path sets and removes `data-filtertube-hidden-by-mix-radio`/);
  assert.match(doc, /stale\/disabled cleanup omit that specialized Mix\/radio marker/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /DOM cleanup contracts/);
  assert.match(doc, /selector policies/);
  assert.match(doc, /target-shape reports/);
  assert.match(doc, /playlist\/Mix interaction policies/);
  assert.match(doc, /route\/surface policies/);
  assert.match(doc, /sibling-visible fixtures/);
  assert.match(doc, /shared restore owners/);
  assert.match(doc, /stale cleanup budgets/);
  assert.match(doc, /disabled-state restore proof/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /CSS\/direct-writer parity reports/);
  assert.match(doc, /JSON\/DOM parity gates/);
  assert.match(doc, /explicit DOM-only policies/);
});

test('tracked_file_obligation_index_links_home_feed_dom_cleanup_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Home-feed DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_HOME_FEED_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/home-feed-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, JSON-first, settings-mode, DOM selector, DOM fallback, route-attribute, disabled-state, no-work, performance, reliability, false-hide\/leak, code-burden, home-feed route cleanup, marker ownership, restore, and cross-feature rows in `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /1 home CSS rules\.push callsite/);
  assert.match(doc, /1 home CSS display-none declaration/);
  assert.match(doc, /2 home CSS desktop browse selectors/);
  assert.match(doc, /4 home CSS route-home attribute selectors/);
  assert.match(doc, /4 home CSS mobile browse selectors/);
  assert.match(doc, /1 home fallback querySelectorAll callsite/);
  assert.match(doc, /4 home fallback marker references/);
  assert.match(doc, /1 home fallback marker write callsite/);
  assert.match(doc, /1 home fallback marker removal callsite/);
  assert.match(doc, /1 home fallback hide toggle callsite/);
  assert.match(doc, /1 home fallback restore toggle callsite/);
  assert.match(doc, /1 no-active cleanup clearStale callsite/);
  assert.match(doc, /0 clear-stale cleanup home-feed marker references/);
  assert.match(doc, /0 disabled cleanup home-feed marker references/);
  assert.match(doc, /4 product runtime home-feed marker references/);
  assert.match(doc, /8 runtime home-feed DOM cleanup fixtures/);
  assert.match(doc, /home-feed CSS owns desktop home and mobile route-home selectors/);
  assert.match(doc, /fake DOM execution hides queried home targets on `\/`/);
  assert.match(doc, /unmarked off-route targets remain untouched/);
  assert.match(doc, /previously marked off-route targets are restored by removing `data-filtertube-hidden-by-hide-home-feed`/);
  assert.match(doc, /no-active cleanup can run before the style writer and home helper/);
  assert.match(doc, /stale\/disabled cleanup omit that specialized home-feed marker/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /DOM cleanup contracts/);
  assert.match(doc, /selector policies/);
  assert.match(doc, /target-shape reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /mobile parity reports/);
  assert.match(doc, /sibling-visible fixtures/);
  assert.match(doc, /shared restore owners/);
  assert.match(doc, /stale cleanup budgets/);
  assert.match(doc, /disabled-state restore proof/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /CSS\/direct-writer parity reports/);
  assert.match(doc, /JSON\/DOM parity gates/);
  assert.match(doc, /explicit DOM-only policies/);
});

test('tracked_file_obligation_index_links_comments_dom_cleanup_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Comments DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_COMMENTS_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/comments-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, JSON-first, settings-mode, DOM selector, DOM fallback, disabled-state, no-work, performance, reliability, false-hide\/leak, code-burden, comments cleanup, mobile marker ownership, whitelist-mode restore, and cross-feature rows in `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /1 comments CSS rules\.push callsite/);
  assert.match(doc, /1 comments CSS display-none declaration/);
  assert.match(doc, /1 comments CSS mobile-card marker reference/);
  assert.match(doc, /4 comments CSS mobile ytm selector tokens/);
  assert.match(doc, /1 mobile collector querySelectorAll callsite/);
  assert.match(doc, /1 mobile collector marker reference/);
  assert.match(doc, /1 mobile collector watch-route guard callsite/);
  assert.match(doc, /1 comments global mobile marker write callsite/);
  assert.match(doc, /1 comments restore marker removal callsite/);
  assert.match(doc, /0 clear-stale cleanup comments mobile marker references/);
  assert.match(doc, /0 disabled cleanup comments mobile marker references/);
  assert.match(doc, /5 product runtime comments mobile marker references/);
  assert.match(doc, /9 runtime comments DOM cleanup fixtures/);
  assert.match(doc, /mobile comments collector runs only on `\/watch`/);
  assert.match(doc, /comment-looking candidates promote to the closest mobile comment container/);
  assert.match(doc, /writing `data-filtertube-mobile-comments-card`/);
  assert.match(doc, /global branch returns before reply and modern comment view-model renderers are toggled/);
  assert.match(doc, /toggle-off restore removes the marker only from collected cards/);
  assert.match(doc, /marker-only mobile cards without comment-looking text remain marked/);
  assert.match(doc, /whitelist mode locally restores containers and the composer/);
  assert.match(doc, /stale\/disabled cleanup omit the mobile comments marker/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /DOM cleanup contracts/);
  assert.match(doc, /selector policies/);
  assert.match(doc, /target-shape reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /mobile marker reports/);
  assert.match(doc, /shared restore owners/);
  assert.match(doc, /stale cleanup budgets/);
  assert.match(doc, /disabled-state restore proof/);
  assert.match(doc, /whitelist-mode comments policies/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /CSS\/direct-writer parity reports/);
  assert.match(doc, /JSON\/DOM parity gates/);
  assert.match(doc, /explicit DOM-only policies/);
});

test('tracked_file_obligation_index_links_shorts_dom_cleanup_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Shorts DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SHORTS_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/shorts-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, JSON-first, settings-mode, DOM selector, DOM fallback, disabled-state, no-work, performance, reliability, false-hide\/leak, code-burden, Shorts cleanup, mobile navigation, disguised-card detection, video-id join, empty-shelf cleanup, restore, and cross-feature rows in `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /3 Shorts collection querySelectorAll callsites/);
  assert.match(doc, /6 Shorts collection mobile nav selector tokens/);
  assert.match(doc, /2 Shorts collection closest callsites/);
  assert.match(doc, /3 Shorts container marker references/);
  assert.match(doc, /1 Shorts container marker write callsite/);
  assert.match(doc, /1 Shorts container marker removal callsite/);
  assert.match(doc, /1 Shorts container ignore-empty write/);
  assert.match(doc, /1 Shorts container shelf-title guard reference/);
  assert.match(doc, /1 Shorts container hide toggle callsite/);
  assert.match(doc, /1 Shorts container restore toggle callsite/);
  assert.match(doc, /1 disguised detection querySelectorAll callsite/);
  assert.match(doc, /4 Shorts selector data-short references/);
  assert.match(doc, /5 Shorts card videoChannelMap references/);
  assert.match(doc, /2 clear-stale cleanup hide-all-Shorts marker references/);
  assert.match(doc, /0 disabled cleanup hide-all-Shorts marker references/);
  assert.match(doc, /15 product runtime hide-all-Shorts marker references/);
  assert.match(doc, /8 product runtime data-filtertube-short references/);
  assert.match(doc, /9 runtime Shorts DOM cleanup fixtures/);
  assert.match(doc, /Shorts shelves, guide entries, and mobile nav entries share global collection/);
  assert.match(doc, /`hideAllShorts` writes `data-filtertube-hidden-by-hide-all-shorts`/);
  assert.match(doc, /restore removes that marker but skips toggle restore when shelf-title ownership remains/);
  assert.match(doc, /disguised normal video cards can be stamped as Shorts/);
  assert.match(doc, /target promotion can hide rich-item or grid-shelf parents/);
  assert.match(doc, /Shorts video-id extraction can consult `videoChannelMap`/);
  assert.match(doc, /home\/search cleanup can hide empty Shorts shelves/);
  assert.match(doc, /stale\/disabled cleanup have asymmetric marker coverage/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /DOM cleanup contracts/);
  assert.match(doc, /selector policies/);
  assert.match(doc, /target-shape reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /mobile navigation reports/);
  assert.match(doc, /disguised Shorts policies/);
  assert.match(doc, /video-id join decisions/);
  assert.match(doc, /shelf cleanup decisions/);
  assert.match(doc, /shared restore owners/);
  assert.match(doc, /stale cleanup budgets/);
  assert.match(doc, /disabled-state restore proof/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /CSS\/direct-writer parity reports/);
  assert.match(doc, /JSON\/DOM parity gates/);
  assert.match(doc, /explicit DOM-only policies/);
});

test('tracked_file_obligation_index_links_sponsored_cards_dom_cleanup_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Sponsored Cards DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SPONSORED_CARDS_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/sponsored-cards-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, JSON-first, settings-mode, DOM selector, DOM fallback, disabled-state, no-work, performance, reliability, false-hide\/leak, code-burden, sponsored-card cleanup, ad-surface selectors, style lifecycle, Open App coupling, restore, and cross-feature rows in `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /1 sponsored-card CSS rules\.push callsite/);
  assert.match(doc, /1 sponsored-card CSS display-none declaration/);
  assert.match(doc, /9 sponsored-card CSS selector rows/);
  assert.match(doc, /1 sponsored-card CSS ad-slot selector token/);
  assert.match(doc, /1 sponsored-card CSS in-feed ad selector token/);
  assert.match(doc, /2 sponsored-card CSS promoted selector tokens/);
  assert.match(doc, /1 sponsored-card CSS search PYV selector token/);
  assert.match(doc, /1 sponsored-card CSS display ad selector token/);
  assert.match(doc, /1 sponsored-card CSS companion ad selector token/);
  assert.match(doc, /1 sponsored-card CSS action companion ad selector token/);
  assert.match(doc, /1 sponsored-card CSS engagement-panel ads selector token/);
  assert.match(doc, /1 ensureContentControlStyles hideSponsoredCards reference/);
  assert.match(doc, /1 ensureContentControlStyles style\.textContent write/);
  assert.match(doc, /1 ensureContentControlStyles Open App direct cleanup call/);
  assert.match(doc, /1 active DOM fallback hideSponsoredCards reference/);
  assert.match(doc, /0 clear-stale cleanup hideSponsoredCards references/);
  assert.match(doc, /0 disabled cleanup hideSponsoredCards references/);
  assert.match(doc, /0 clear-stale cleanup sponsored-card marker references/);
  assert.match(doc, /0 disabled cleanup sponsored-card marker references/);
  assert.match(doc, /0 product runtime sponsored-card marker references/);
  assert.match(doc, /2 product runtime hideSponsoredCards tokens/);
  assert.match(doc, /6 runtime sponsored-card DOM cleanup fixtures/);
  assert.match(doc, /`hideSponsoredCards` is CSS-owned in the shared content-control style node/);
  assert.match(doc, /style regeneration removes sponsored selector rows when the setting turns off/);
  assert.match(doc, /whitelist mode still emits sponsored CSS/);
  assert.match(doc, /unsupported `:has\(\)` support does not suppress sponsored selectors/);
  assert.match(doc, /style writer also calls Open App cleanup/);
  assert.match(doc, /no feature-local marker, stale cleanup owner, or disabled cleanup owner exists for sponsored-card CSS effects/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /DOM cleanup contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /style selector policies/);
  assert.match(doc, /target-shape reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /ad-surface reports/);
  assert.match(doc, /restore proof/);
  assert.match(doc, /stale cleanup budgets/);
  assert.match(doc, /disabled-state restore proof/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /JSON\/DOM parity gates/);
  assert.match(doc, /explicit DOM-only policies/);
});

test('tracked_file_obligation_index_links_watch_playlist_panel_dom_cleanup_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Watch Playlist Panel DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WATCH_PLAYLIST_PANEL_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/watch-playlist-panel-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, JSON-first, settings-mode, DOM selector, DOM fallback, disabled-state, no-work, performance, reliability, false-hide\/leak, code-burden, watch playlist panel cleanup, panel selectors, style lifecycle, Open App coupling, restore, and cross-feature rows in `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /1 watch-playlist-panel CSS rules\.push callsite/);
  assert.match(doc, /1 watch-playlist-panel CSS display-none declaration/);
  assert.match(doc, /3 watch-playlist-panel CSS selector rows/);
  assert.match(doc, /1 watch-playlist-panel CSS desktop selector token/);
  assert.match(doc, /1 watch-playlist-panel CSS mobile v1 selector token/);
  assert.match(doc, /1 watch-playlist-panel CSS mobile v2 selector token/);
  assert.match(doc, /1 ensureContentControlStyles hideWatchPlaylistPanel reference/);
  assert.match(doc, /1 ensureContentControlStyles style\.textContent write/);
  assert.match(doc, /1 ensureContentControlStyles Open App direct cleanup call/);
  assert.match(doc, /1 active DOM fallback hideWatchPlaylistPanel reference/);
  assert.match(doc, /0 clear-stale cleanup hideWatchPlaylistPanel references/);
  assert.match(doc, /0 disabled cleanup hideWatchPlaylistPanel references/);
  assert.match(doc, /0 clear-stale cleanup watch-playlist-panel marker references/);
  assert.match(doc, /0 disabled cleanup watch-playlist-panel marker references/);
  assert.match(doc, /0 product runtime watch-playlist-panel marker references/);
  assert.match(doc, /2 product runtime hideWatchPlaylistPanel tokens/);
  assert.match(doc, /6 runtime watch-playlist-panel DOM cleanup fixtures/);
  assert.match(doc, /`hideWatchPlaylistPanel` is CSS-owned in the shared content-control style node/);
  assert.match(doc, /style regeneration removes watch playlist panel selector rows when the setting turns off/);
  assert.match(doc, /whitelist mode still emits watch playlist panel CSS/);
  assert.match(doc, /unsupported `:has\(\)` support does not suppress watch playlist panel selectors/);
  assert.match(doc, /style writer also calls Open App cleanup/);
  assert.match(doc, /no feature-local marker, stale cleanup owner, or disabled cleanup owner exists for watch playlist panel CSS effects/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /DOM cleanup contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /style selector policies/);
  assert.match(doc, /target-shape reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /panel surface reports/);
  assert.match(doc, /restore proof/);
  assert.match(doc, /stale cleanup budgets/);
  assert.match(doc, /disabled-state restore proof/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /JSON\/DOM parity gates/);
  assert.match(doc, /explicit DOM-only policies/);
});

test('tracked_file_obligation_index_links_video_sidebar_dom_cleanup_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Video Sidebar DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_VIDEO_SIDEBAR_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/video-sidebar-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, JSON-first, settings-mode, DOM selector, DOM fallback, disabled-state, no-work, performance, reliability, false-hide\/leak, code-burden, video sidebar cleanup, secondary-column selectors, style lifecycle, Open App coupling, restore, and cross-feature rows in `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /1 video-sidebar CSS rules\.push callsite/);
  assert.match(doc, /1 video-sidebar CSS display-none declaration/);
  assert.match(doc, /1 video-sidebar CSS selector row/);
  assert.match(doc, /1 video-sidebar CSS secondary column selector token/);
  assert.match(doc, /1 ensureContentControlStyles hideVideoSidebar reference/);
  assert.match(doc, /1 ensureContentControlStyles style\.textContent write/);
  assert.match(doc, /1 ensureContentControlStyles Open App direct cleanup call/);
  assert.match(doc, /1 active DOM fallback hideVideoSidebar reference/);
  assert.match(doc, /0 clear-stale cleanup hideVideoSidebar references/);
  assert.match(doc, /0 disabled cleanup hideVideoSidebar references/);
  assert.match(doc, /0 clear-stale cleanup video-sidebar marker references/);
  assert.match(doc, /0 disabled cleanup video-sidebar marker references/);
  assert.match(doc, /0 product runtime video-sidebar marker references/);
  assert.match(doc, /2 product runtime hideVideoSidebar tokens/);
  assert.match(doc, /6 runtime video-sidebar DOM cleanup fixtures/);
  assert.match(doc, /`hideVideoSidebar` is CSS-owned in the shared content-control style node/);
  assert.match(doc, /style regeneration removes the video sidebar selector row when the setting turns off/);
  assert.match(doc, /whitelist mode still emits video sidebar CSS/);
  assert.match(doc, /unsupported `:has\(\)` support does not suppress video sidebar selectors/);
  assert.match(doc, /style writer also calls Open App cleanup/);
  assert.match(doc, /no feature-local marker, stale cleanup owner, or disabled cleanup owner exists for video sidebar CSS effects/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /DOM cleanup contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /style selector policies/);
  assert.match(doc, /target-shape reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /secondary-column reports/);
  assert.match(doc, /restore proof/);
  assert.match(doc, /stale cleanup budgets/);
  assert.match(doc, /disabled-state restore proof/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /JSON\/DOM parity gates/);
  assert.match(doc, /explicit DOM-only policies/);
});

test('tracked_file_obligation_index_links_live_chat_dom_cleanup_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Live Chat DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_LIVE_CHAT_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/live-chat-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, JSON-first, settings-mode, DOM selector, DOM fallback, disabled-state, no-work, performance, reliability, false-hide\/leak, code-burden, live chat cleanup, chat surface selectors, style lifecycle, Open App coupling, restore, and cross-feature rows in `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /1 live-chat CSS rules\.push callsite/);
  assert.match(doc, /1 live-chat CSS display-none declaration/);
  assert.match(doc, /2 live-chat CSS selector rows/);
  assert.match(doc, /1 live-chat CSS frame selector token/);
  assert.match(doc, /1 live-chat CSS container selector token/);
  assert.match(doc, /1 ensureContentControlStyles hideLiveChat reference/);
  assert.match(doc, /1 ensureContentControlStyles style\.textContent write/);
  assert.match(doc, /1 ensureContentControlStyles Open App direct cleanup call/);
  assert.match(doc, /1 active DOM fallback hideLiveChat reference/);
  assert.match(doc, /0 clear-stale cleanup hideLiveChat references/);
  assert.match(doc, /0 disabled cleanup hideLiveChat references/);
  assert.match(doc, /0 clear-stale cleanup live-chat marker references/);
  assert.match(doc, /0 disabled cleanup live-chat marker references/);
  assert.match(doc, /0 product runtime live-chat marker references/);
  assert.match(doc, /2 product runtime hideLiveChat tokens/);
  assert.match(doc, /6 runtime live-chat DOM cleanup fixtures/);
  assert.match(doc, /`hideLiveChat` is CSS-owned in the shared content-control style node/);
  assert.match(doc, /style regeneration removes live chat selector rows when the setting turns off/);
  assert.match(doc, /whitelist mode still emits live chat CSS/);
  assert.match(doc, /unsupported `:has\(\)` support does not suppress live chat selectors/);
  assert.match(doc, /style writer also calls Open App cleanup/);
  assert.match(doc, /no feature-local marker, stale cleanup owner, or disabled cleanup owner exists for live chat CSS effects/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /DOM cleanup contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /style selector policies/);
  assert.match(doc, /target-shape reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /chat surface reports/);
  assert.match(doc, /restore proof/);
  assert.match(doc, /stale cleanup budgets/);
  assert.match(doc, /disabled-state restore proof/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /JSON\/DOM parity gates/);
  assert.match(doc, /explicit DOM-only policies/);
});

test('tracked_file_obligation_index_links_video_info_dom_cleanup_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Video Info DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_VIDEO_INFO_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/video-info-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, JSON-first, settings-mode, DOM selector, DOM fallback, disabled-state, no-work, performance, reliability, false-hide\/leak, code-burden, video info cleanup, watch metadata selectors, master-mode coupling, whitelist-mode coupling, style lifecycle, Open App coupling, restore, and cross-feature rows in `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /5 video-info mode group rules\.push callsites/);
  assert.match(doc, /5 video-info mode group display-none declarations/);
  assert.match(doc, /12 video-info mode group selector rows/);
  assert.match(doc, /6 video-info mode group hideInfoMaster references/);
  assert.match(doc, /4 video-info mode group listMode whitelist guards/);
  assert.match(doc, /1 video-info mode group hideVideoInfo reference/);
  assert.match(doc, /1 video-info mode group hideVideoButtonsBar reference/);
  assert.match(doc, /1 video-info mode group hideAskButton reference/);
  assert.match(doc, /1 video-info mode group hideVideoChannelRow reference/);
  assert.match(doc, /1 video-info mode group hideVideoDescription reference/);
  assert.match(doc, /1 video-info mode group hideMerchTicketsOffers reference/);
  assert.match(doc, /1 ensureContentControlStyles style\.textContent write/);
  assert.match(doc, /1 ensureContentControlStyles Open App direct cleanup call/);
  assert.match(doc, /6 active DOM fallback video-info flag references/);
  assert.match(doc, /0 clear-stale cleanup video-info flag references/);
  assert.match(doc, /0 disabled cleanup video-info flag references/);
  assert.match(doc, /0 product runtime video-info feature marker references/);
  assert.match(doc, /2 product runtime hideVideoInfo tokens/);
  assert.match(doc, /2 product runtime hideVideoButtonsBar tokens/);
  assert.match(doc, /2 product runtime hideAskButton tokens/);
  assert.match(doc, /2 product runtime hideVideoChannelRow tokens/);
  assert.match(doc, /2 product runtime hideVideoDescription tokens/);
  assert.match(doc, /2 product runtime hideMerchTicketsOffers tokens/);
  assert.match(doc, /6 runtime video-info DOM cleanup fixtures/);
  assert.match(doc, /`hideVideoInfo` is a master-mode flag that fans out into five child style branches only in blocklist mode/);
  assert.match(doc, /`hideVideoInfo` in whitelist mode emits no video-info child selectors/);
  assert.match(doc, /explicit whitelist-mode child flags still emit Ask and Merch\/Tickets\/Offers selectors while Buttons Bar, Channel Row, and Description remain suppressed by direct whitelist guards/);
  assert.match(doc, /style writer also calls Open App cleanup/);
  assert.match(doc, /no feature-local marker, stale cleanup owner, or disabled cleanup owner exists for video-info CSS effects/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /DOM cleanup contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /master-mode policies/);
  assert.match(doc, /style selector policies/);
  assert.match(doc, /target-shape reports/);
  assert.match(doc, /whitelist policies/);
  assert.match(doc, /restore proof/);
  assert.match(doc, /stale cleanup budgets/);
  assert.match(doc, /disabled-state restore proof/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /JSON\/DOM parity gates/);
  assert.match(doc, /explicit DOM-only policies/);
});

test('tracked_file_obligation_index_links_player_endscreen_dom_cleanup_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Player\/End-screen DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_PLAYER_ENDSCREEN_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/player-endscreen-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, JSON-first, settings-mode, DOM selector, DOM fallback, disabled-state, no-work, performance, reliability, false-hide\/leak, code-burden, player end-screen cleanup, end-screen selectors, autoplay selectors, annotations selectors, active-work coupling, style lifecycle, Open App coupling, restore, and cross-feature rows in `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /4 player\/end-screen CSS group rules\.push callsites/);
  assert.match(doc, /4 player\/end-screen CSS group display-none declarations/);
  assert.match(doc, /7 player\/end-screen CSS group selector rows/);
  assert.match(doc, /1 ensureContentControlStyles hideEndscreenVideowall reference/);
  assert.match(doc, /1 ensureContentControlStyles hideEndscreenCards reference/);
  assert.match(doc, /1 ensureContentControlStyles disableAutoplay reference/);
  assert.match(doc, /1 ensureContentControlStyles disableAnnotations reference/);
  assert.match(doc, /1 ensureContentControlStyles style\.textContent write/);
  assert.match(doc, /1 ensureContentControlStyles Open App direct cleanup call/);
  assert.match(doc, /1 active DOM fallback hideEndscreenVideowall reference/);
  assert.match(doc, /1 active DOM fallback hideEndscreenCards reference/);
  assert.match(doc, /0 active DOM fallback disableAutoplay references/);
  assert.match(doc, /0 active DOM fallback disableAnnotations references/);
  assert.match(doc, /0 clear-stale cleanup player\/end-screen flag references/);
  assert.match(doc, /0 disabled cleanup player\/end-screen flag references/);
  assert.match(doc, /0 product runtime player\/end-screen feature marker references/);
  assert.match(doc, /2 DOM fallback source hideEndscreenVideowall tokens/);
  assert.match(doc, /2 DOM fallback source hideEndscreenCards tokens/);
  assert.match(doc, /1 DOM fallback source disableAutoplay token/);
  assert.match(doc, /1 DOM fallback source disableAnnotations token/);
  assert.match(doc, /6 runtime player\/end-screen DOM cleanup fixtures/);
  assert.match(doc, /all four controls emit player\/end-screen selector rows when the style writer runs/);
  assert.match(doc, /direct style-writer execution can emit `disableAutoplay` and `disableAnnotations` selectors while blocklist active-work returns false for those flags alone/);
  assert.match(doc, /`hideEndscreenVideowall` and `hideEndscreenCards` are active DOM fallback keys/);
  assert.match(doc, /style regeneration removes player\/end-screen selector rows when the settings are absent/);
  assert.match(doc, /style writer also calls Open App cleanup/);
  assert.match(doc, /no feature-local marker, stale cleanup owner, or disabled cleanup owner exists for player\/end-screen CSS effects/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /DOM cleanup contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /style selector policies/);
  assert.match(doc, /target-shape reports/);
  assert.match(doc, /active-work policies/);
  assert.match(doc, /autoplay policies/);
  assert.match(doc, /annotation policies/);
  assert.match(doc, /restore proof/);
  assert.match(doc, /stale cleanup budgets/);
  assert.match(doc, /disabled-state restore proof/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /JSON\/DOM parity gates/);
  assert.match(doc, /explicit DOM-only policies/);
});

test('tracked_file_obligation_index_links_navigation_header_search_dom_cleanup_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Navigation\/Header\/Search DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_NAVIGATION_HEADER_SEARCH_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/navigation-header-search-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, JSON-first, settings-mode, DOM selector, DOM fallback, disabled-state, no-work, performance, reliability, false-hide\/leak, code-burden, navigation header search cleanup, top header selectors, notification selectors, explore\/trending selectors, More from YouTube selectors, subscriptions selectors, search shelves selectors, `:has\(\)` support coupling, style lifecycle, Open App coupling, restore, and cross-feature rows in `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /6 navigation\/header\/search CSS group rules\.push callsites/);
  assert.match(doc, /6 navigation\/header\/search CSS group display-none declarations/);
  assert.match(doc, /12 navigation\/header\/search CSS group selector rows with `:has\(\)` support/);
  assert.match(doc, /3 navigation\/header\/search CSS group `:has\(\)` tokens/);
  assert.match(doc, /1 navigation\/header\/search CSS group `:not\(:has\(\.\.\.\)\)` token/);
  assert.match(doc, /1 navigation\/header\/search CSS group supportsHasSelector reference/);
  assert.match(doc, /1 ensureContentControlStyles hideTopHeader reference/);
  assert.match(doc, /1 ensureContentControlStyles hideNotificationBell reference/);
  assert.match(doc, /1 ensureContentControlStyles hideExploreTrending reference/);
  assert.match(doc, /1 ensureContentControlStyles hideMoreFromYouTube reference/);
  assert.match(doc, /1 ensureContentControlStyles hideSubscriptions reference/);
  assert.match(doc, /1 ensureContentControlStyles hideSearchShelves reference/);
  assert.match(doc, /1 ensureContentControlStyles style\.textContent write/);
  assert.match(doc, /1 ensureContentControlStyles Open App direct cleanup call/);
  assert.match(doc, /6 active DOM fallback navigation\/header\/search flag references/);
  assert.match(doc, /0 clear-stale cleanup navigation\/header\/search flag references/);
  assert.match(doc, /0 disabled cleanup navigation\/header\/search flag references/);
  assert.match(doc, /0 product runtime navigation\/header\/search feature marker references/);
  assert.match(doc, /2 DOM fallback source hideTopHeader tokens/);
  assert.match(doc, /2 DOM fallback source hideNotificationBell tokens/);
  assert.match(doc, /2 DOM fallback source hideExploreTrending tokens/);
  assert.match(doc, /2 DOM fallback source hideMoreFromYouTube tokens/);
  assert.match(doc, /2 DOM fallback source hideSubscriptions tokens/);
  assert.match(doc, /2 DOM fallback source hideSearchShelves tokens/);
  assert.match(doc, /6 runtime navigation\/header\/search DOM cleanup fixtures/);
  assert.match(doc, /all six controls emit navigation\/header\/search selector rows when the style writer runs/);
  assert.match(doc, /disabling `:has\(\)` support removes only the dynamic subscriptions guide-section selector while fixed subscription selectors remain/);
  assert.match(doc, /all six flags are active DOM fallback keys/);
  assert.match(doc, /style regeneration removes navigation\/header\/search selector rows when the settings are absent/);
  assert.match(doc, /style writer also calls Open App cleanup/);
  assert.match(doc, /no feature-local marker, stale cleanup owner, or disabled cleanup owner exists for navigation\/header\/search CSS effects/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /DOM cleanup contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /style selector policies/);
  assert.match(doc, /target-shape reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /navigation surface reports/);
  assert.match(doc, /`:has\(\)` support policies/);
  assert.match(doc, /positional guide-section policies/);
  assert.match(doc, /restore proof/);
  assert.match(doc, /stale cleanup budgets/);
  assert.match(doc, /disabled-state restore proof/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /JSON\/DOM parity gates/);
  assert.match(doc, /explicit DOM-only policies/);
});

test('tracked_file_obligation_index_links_recommended_dom_cleanup_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Recommended DOM cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_RECOMMENDED_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/recommended-dom-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open every-feature, JSON-first, settings-mode, DOM selector, DOM fallback, disabled-state, no-work, performance, reliability, false-hide\/leak, code-burden, recommended cleanup, watch rail selectors, style lifecycle, Open App coupling, restore, and cross-feature rows in `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /1 recommended CSS rules\.push callsite/);
  assert.match(doc, /1 recommended CSS display-none declaration/);
  assert.match(doc, /2 recommended CSS selector rows/);
  assert.match(doc, /1 recommended CSS #related selector token/);
  assert.match(doc, /1 recommended CSS secondary-results selector token/);
  assert.match(doc, /1 ensureContentControlStyles hideRecommended reference/);
  assert.match(doc, /1 ensureContentControlStyles style\.textContent write/);
  assert.match(doc, /1 ensureContentControlStyles Open App direct cleanup call/);
  assert.match(doc, /1 active DOM fallback hideRecommended reference/);
  assert.match(doc, /0 clear-stale cleanup hideRecommended references/);
  assert.match(doc, /0 disabled cleanup hideRecommended references/);
  assert.match(doc, /0 clear-stale cleanup recommended marker references/);
  assert.match(doc, /0 disabled cleanup recommended marker references/);
  assert.match(doc, /0 product runtime recommended marker references/);
  assert.match(doc, /2 product runtime hideRecommended tokens/);
  assert.match(doc, /6 runtime recommended DOM cleanup fixtures/);
  assert.match(doc, /`hideRecommended` is CSS-owned in the shared content-control style node/);
  assert.match(doc, /style regeneration removes recommended selector rows when the setting turns off/);
  assert.match(doc, /whitelist mode still emits recommended CSS/);
  assert.match(doc, /unsupported `:has\(\)` support does not suppress recommended selectors/);
  assert.match(doc, /style writer also calls Open App cleanup/);
  assert.match(doc, /no feature-local marker, stale cleanup owner, or disabled cleanup owner exists for recommended CSS effects/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /DOM cleanup contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /style selector policies/);
  assert.match(doc, /target-shape reports/);
  assert.match(doc, /route policies/);
  assert.match(doc, /watch rail reports/);
  assert.match(doc, /restore proof/);
  assert.match(doc, /stale cleanup budgets/);
  assert.match(doc, /disabled-state restore proof/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /JSON\/DOM parity gates/);
  assert.match(doc, /explicit DOM-only policies/);
});

test('tracked_file_obligation_index_links_content_control_alias_mutation_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content control alias mutation boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_CONTROL_ALIAS_MUTATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/content-control-alias-mutation-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open settings-mode, JSON-first, storage\/cache, StateManager mutation, shared settings persistence, background compile\/cache invalidation, seed active-work, filter-logic, DOM fallback, performance, reliability, false-hide\/leak, code-burden, and cross-feature rows in `js\/content_controls_catalog\.js`, `js\/settings_shared\.js`, `js\/state_manager\.js`, `js\/background\.js`, `js\/seed\.js`, `js\/filter_logic\.js`, and `js\/content\/dom_fallback\.js`/);
  assert.match(doc, /7 content control alias mutation boundary source files/);
  assert.match(doc, /13 source\/effect blocks/);
  assert.match(doc, /shared settings compile\/save\/load alias behavior/);
  assert.match(doc, /StateManager mutation\/save\/reload alias behavior/);
  assert.match(doc, /background compile\/invalidation alias behavior/);
  assert.match(doc, /seed active JSON alias consumers/);
  assert.match(doc, /filter_logic processed defaults/);
  assert.match(doc, /DOM fallback alias-active keys/);
  assert.match(doc, /5 runtime alias mutation fixtures/);
  assert.match(doc, /`saveSettings\({ hideShorts: true, hideComments: true }\)` compiles runtime `hideAllShorts` and `hideAllComments`/);
  assert.match(doc, /writes root `hideAllShorts` and `hideAllComments`/);
  assert.match(doc, /writes V4 profile `hideShorts` and `hideComments`/);
  assert.match(doc, /does not write root `hideShorts` or `hideComments`/);
  assert.match(doc, /legacy `loadSettings\(\)` maps root `hideAllShorts` and `hideAllComments` back to UI-facing aliases/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /catalog\/runtime alias contracts/);
  assert.match(doc, /storage alias policies/);
  assert.match(doc, /V4\/root precedence reports/);
  assert.match(doc, /StateManager mutation reports/);
  assert.match(doc, /background invalidation parity reports/);
  assert.match(doc, /JSON setting-field manifests/);
  assert.match(doc, /DOM alias parity reports/);
  assert.match(doc, /per-alias no-work budgets/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /metric artifacts/);
  assert.match(doc, /first-class alias JSON gates/);
});

test('tracked_file_obligation_index_links_content_bridge_prefetch_identity_lifecycle_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content bridge prefetch identity lifecycle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_PREFETCH_IDENTITY_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-prefetch-identity-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open runtime lifecycle, JSON-first, network snapshot consumer, identity hydration, learned-map write, DOM stamp, DOM fallback rerun, no-work, performance, reliability, false-hide\/leak, code-burden, cross-feature, content bridge, and source\/evidence rows in `js\/content_bridge\.js`/);
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
  assert.match(doc, /3 prefetch lifecycle cluster setTimeout callsites/);
  assert.match(doc, /1 prefetch lifecycle cluster requestAnimationFrame callsite/);
  assert.match(doc, /2 prefetch lifecycle cluster disconnect callsites/);
  assert.match(doc, /5 prefetch lifecycle cluster persistVideoChannelMapping callsites/);
  assert.match(doc, /7 prefetch lifecycle cluster stampChannelIdentity callsites/);
  assert.match(doc, /3 prefetch lifecycle cluster applyDOMFallback mentions/);
  assert.match(doc, /6 runtime content bridge prefetch lifecycle fixtures/);
  assert.match(doc, /one `IntersectionObserver`, one `visibilitychange` listener/);
  assert.match(doc, /cap one pass at 120 cards/);
  assert.match(doc, /right-rail refresh work is whitelist-aware and route-aware/);
  assert.match(doc, /dedupes by video id for 30 seconds/);
  assert.match(doc, /drains with concurrency 2 only while visible/);
  assert.match(doc, /performs no direct `fetch\(\)` in `prefetchIdentityForCard\(\)`/);
  assert.match(doc, /can stamp DOM identity, persist learned map entries, and schedule DOM fallback after a successful stamp/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /lifecycle contracts/);
  assert.match(doc, /active-work decisions/);
  assert.match(doc, /observer budgets/);
  assert.match(doc, /queue budgets/);
  assert.match(doc, /snapshot-effect reports/);
  assert.match(doc, /DOM-stamp reports/);
  assert.match(doc, /map-write reports/);
  assert.match(doc, /whitelist pending policies/);
  assert.match(doc, /route pause policies/);
  assert.match(doc, /first-class content bridge prefetch authority gates/);
});

test('tracked_file_obligation_index_links_subscription_import_request_lifecycle_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Subscription import request lifecycle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SUBSCRIPTION_IMPORT_REQUEST_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/subscription-import-request-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open runtime-message, page-message, settings-mode, JSON-first, whitelist import, network fetch, lifecycle timer, profile mutation, UI progress, performance, reliability, false-hide\/leak, code-burden, cross-feature, and source\/evidence rows/);
  assert.match(doc, /`js\/content\/bridge_settings\.js`, `js\/content_bridge\.js`, `js\/injector\.js`, `js\/state_manager\.js`, `js\/tab-view\.js`, `manifest\.json`, `manifest\.chrome\.json`, `manifest\.firefox\.json`, and `manifest\.opera\.json`/);
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
  assert.match(doc, /5 content_bridge message handler header block lines/);
  assert.match(doc, /229 content_bridge message handler header block bytes/);
  assert.match(doc, /27 content_bridge subscription progress\/response block lines/);
  assert.match(doc, /1412 content_bridge subscription progress\/response block bytes/);
  assert.match(doc, /71 injector subscription bridge install block lines/);
  assert.match(doc, /2766 injector subscription bridge install block bytes/);
  assert.match(doc, /450 injector fetchSubscribedChannelsFromYoutubei block lines/);
  assert.match(doc, /19755 injector fetchSubscribedChannelsFromYoutubei block bytes/);
  assert.match(doc, /54 StateManager fetchSubscribedChannelsFromImportTab block lines/);
  assert.match(doc, /2213 StateManager fetchSubscribedChannelsFromImportTab block bytes/);
  assert.match(doc, /109 StateManager importSubscribedChannelsToWhitelist block lines/);
  assert.match(doc, /4527 StateManager importSubscribedChannelsToWhitelist block bytes/);
  assert.match(doc, /22 tab-view runtime progress listener block lines/);
  assert.match(doc, /874 tab-view runtime progress listener block bytes/);
  assert.match(doc, /5 wildcard page-message target callsites/);
  assert.match(doc, /5 selected setTimeout callsites/);
  assert.match(doc, /6 selected clearTimeout callsites/);
  assert.match(doc, /1 injector fetch import fetch\(\) callsite/);
  assert.match(doc, /2 injector fetch import AbortController tokens/);
  assert.match(doc, /8 runtime subscription import lifecycle fixtures/);
  assert.match(doc, /manifests load bridge_settings before content_bridge/);
  assert.match(doc, /timeout clamp is split between 120000 ms and 150000 ms/);
  assert.match(doc, /different page-message trust gates for subscription progress\/response/);
  assert.match(doc, /credentialed YouTubei POST fetches with abort timers and continuation delays/);
  assert.match(doc, /lock, profile, tab, request id, source tab, whitelist mutation, restore-tab, and UI progress gates/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /lifecycle contracts/);
  assert.match(doc, /requester override reports/);
  assert.match(doc, /capability tokens/);
  assert.match(doc, /page-message trust reports/);
  assert.match(doc, /YouTubei fetch budgets/);
  assert.match(doc, /first-class subscription import lifecycle authority gates/);
});

test('tracked_file_obligation_index_links_batch_whitelist_import_persistence_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Batch whitelist import persistence boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BATCH_WHITELIST_IMPORT_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/batch-whitelist-import-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open settings mutation, whitelist import, settings-mode, storage\/cache, channel identity merge, channelMap write, V3\/V4 mirror, profile lock, backup, refresh, list-mode effect, performance, reliability, false-hide\/leak, code-burden, cross-feature, and source\/evidence rows in `js\/background\.js` and `js\/state_manager\.js`/);
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
  assert.match(doc, /1 selected isTrustedUiSender token/);
  assert.match(doc, /1 selected isProfileSessionAuthorized token/);
  assert.match(doc, /19 selected targetProfileId tokens/);
  assert.match(doc, /2 selected mergeImportedWhitelistChannels tokens/);
  assert.match(doc, /1 selected storage\.local\.set token/);
  assert.match(doc, /2 selected compiledSettingsCache tokens/);
  assert.match(doc, /1 selected scheduleAutoBackupInBackground token/);
  assert.match(doc, /1 selected tabs\.query token/);
  assert.match(doc, /1 selected sendMessageToTabQuietly token/);
  assert.match(doc, /4 selected channelMap tokens/);
  assert.match(doc, /3 selected ftProfilesV3 tokens/);
  assert.match(doc, /3 selected FT_PROFILES_V4_KEY tokens/);
  assert.match(doc, /1 selected whitelistedChannels token/);
  assert.match(doc, /7 selected currentMode tokens/);
  assert.match(doc, /14 selected counts tokens/);
  assert.match(doc, /7 selected sendResponse callsites/);
  assert.match(doc, /16 selected errorCode tokens/);
  assert.match(doc, /7 runtime batch whitelist import persistence fixtures/);
  assert.match(doc, /StateManager checks lock and profile stability before handoff/);
  assert.match(doc, /background requires trusted UI sender, active target profile equality, and session authorization/);
  assert.match(doc, /merge helpers accept id\/handle\/custom URL identity/);
  assert.match(doc, /skip identity-less rows/);
  assert.match(doc, /preserve stronger existing names/);
  assert.match(doc, /preserve existing `filterAllComments`/);
  assert.match(doc, /background writes V4 and V3 profile mirrors/);
  assert.match(doc, /optionally writes `channelMap`/);
  assert.match(doc, /returns `currentMode` without changing blocklist to whitelist/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /mutation contracts/);
  assert.match(doc, /rollback policies/);
  assert.match(doc, /profile-lock reports/);
  assert.match(doc, /mode-effect reports/);
  assert.match(doc, /channel-map policies/);
  assert.match(doc, /V3 mirror policies/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /backup\/refresh budgets/);
  assert.match(doc, /first-class batch whitelist import persistence authority gates/);
});

test('tracked_file_obligation_index_links_list_mode_transition_persistence_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /List-mode transition persistence boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_LIST_MODE_TRANSITION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/list-mode-transition-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open settings-mode transition, UI toggle intent, storage\/cache, destructive migration, legacy root mirror, profile-lock, backup\/refresh, managed child, subscription import mode-effect, performance, reliability, false-hide\/leak, code-burden, cross-feature, and source\/evidence rows in `js\/background\.js`, `js\/popup\.js`, `js\/tab-view\.js`, and `js\/state_manager\.js`/);
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
  assert.match(doc, /1 selected background shouldCopyBlocklist token/);
  assert.match(doc, /1 selected background copyBlocklist token/);
  assert.match(doc, /2 selected background mergeAndClearBlocklistIntoWhitelist tokens/);
  assert.match(doc, /0 selected background isProfileSessionAuthorized tokens/);
  assert.match(doc, /2 selected background storage\.local\.set tokens/);
  assert.match(doc, /4 selected background compiledSettingsCache tokens/);
  assert.match(doc, /2 selected background scheduleAutoBackupInBackground tokens/);
  assert.match(doc, /2 selected background FilterTube_RefreshNow tokens/);
  assert.match(doc, /8 runtime list-mode transition persistence fixtures/);
  assert.match(doc, /subscription import mode enablement sends `copyBlocklist:false`/);
  assert.match(doc, /background declares `shouldCopyBlocklist` but still merges blocklist rows into whitelist whenever whitelist is requested/);
  assert.match(doc, /Main whitelist transition clears root legacy blocklist mirrors/);
  assert.match(doc, /blocklist mode change does not transfer whitelist rows back/);
  assert.match(doc, /separate transfer action moves and clears rows/);
  assert.match(doc, /background mode-action blocks lack session authorization checks/);
  assert.match(doc, /tab-view managed child editing uses `saveManagedChildSurface\(\)`/);
  assert.match(doc, /StateManager import persistence returns `currentMode` before mode activation/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /copy-flag policies/);
  assert.match(doc, /managed-child parity reports/);
  assert.match(doc, /first-class list-mode transition persistence authority gates/);
});

test('tracked_file_obligation_index_links_single_channel_rule_mutation_persistence_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Single-channel rule mutation persistence boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SINGLE_CHANNEL_RULE_MUTATION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/single-channel-rule-mutation-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open rule-mutation, settings-mode, Main\/Kids action selection, content quick-block, legacy Main block add, sender\/lock policy, list-type inference, storage\/cache, network identity repair, channelMap\/videoChannelMap write, backup, post-enrichment, performance, reliability, false-hide\/leak, code-burden, cross-feature, and source\/evidence rows in `js\/background\.js`, `js\/state_manager\.js`, and `js\/content_bridge\.js`/);
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
  assert.match(doc, /2 selected background isTrustedUiSender tokens/);
  assert.match(doc, /0 selected background isProfileSessionAuthorized tokens/);
  assert.match(doc, /5 selected background handleAddFilteredChannel tokens/);
  assert.match(doc, /1 selected background addChannelPersistent token/);
  assert.match(doc, /1 selected background addFilteredChannel token/);
  assert.match(doc, /39 selected background channelMap tokens/);
  assert.match(doc, /6 selected background fetchChannelInfo tokens/);
  assert.match(doc, /7 selected background performWatchIdentityFetch tokens/);
  assert.match(doc, /14 selected background targetListType tokens/);
  assert.match(doc, /20 selected background sendResponse tokens/);
  assert.match(doc, /11 runtime single-channel rule mutation persistence fixtures/);
  assert.match(doc, /StateManager chooses Main and Kids channel-add actions from mode/);
  assert.match(doc, /Main\/Kids whitelist single adds are trusted-sender gated but not session-locked/);
  assert.match(doc, /Kids block, legacy Main block, and secondary content mutation paths lack matching gates/);
  assert.match(doc, /content quick-block defaults to blocklist list type/);
  assert.match(doc, /legacy `addChannelPersistent` is an inline persistence path separate from `handleAddFilteredChannel\(\)`/);
  assert.match(doc, /shared helper mixes network identity repair, map writes, V4\/V3\/root storage writes, cache invalidation, and post-block enrichment/);
  assert.match(doc, /content_bridge can schedule another backup after background success/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /sender policies/);
  assert.match(doc, /post-enrichment policies/);
  assert.match(doc, /first-class single-channel rule mutation persistence authority gates/);
});

test('tracked_file_obligation_index_links_profile_management_persistence_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Profile management persistence boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_PROFILE_MANAGEMENT_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/profile-management-persistence-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open profile\/viewing-space, settings-mode, profile-lock, storage\/cache, backup, UI profile manager, managed-child, read-path mutation, cache invalidation, performance, reliability, false-hide\/leak, code-burden, cross-feature, and source\/evidence rows in `js\/tab-view\.js`, `js\/popup\.js`, `js\/io_manager\.js`, and `js\/background\.js`/);
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
  assert.match(doc, /15 selected tab-view ensureProfileUnlocked tokens/);
  assert.match(doc, /28 selected tab-view saveProfilesV4 tokens/);
  assert.match(doc, /52 selected tab-view loadProfilesV4 tokens/);
  assert.match(doc, /66 selected tab-view activeProfileId tokens/);
  assert.match(doc, /38 selected background compiledSettingsCache tokens/);
  assert.match(doc, /7 selected background getCompiledSettings tokens/);
  assert.match(doc, /11 runtime profile management persistence fixtures/);
  assert.match(doc, /tab-view and popup profile switches write active profile after local unlock without revision reports/);
  assert.match(doc, /profile manager delete writes resolved active profile without backup or revision report/);
  assert.match(doc, /account profile creation copies backup policy without switching active profile/);
  assert.match(doc, /child profile creation requires parent account and defaults Main denied\/Kids allowed/);
  assert.match(doc, /managed child save writes target surface locally without broadcast or compiled revision report/);
  assert.match(doc, /IO profile load can write sanitized or migrated V4 during read-path loading/);
  assert.match(doc, /invalid profile save writes an empty object instead of an error report/);
  assert.match(doc, /background profile storage change invalidates both compiled caches without a revision report/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /switch revision reports/);
  assert.match(doc, /managed-child reports/);
  assert.match(doc, /first-class profile management persistence authority gates/);
});

test('tracked_file_obligation_index_links_youtube_music_surface_identity_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /YouTube Music surface identity boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_YOUTUBE_MUSIC_SURFACE_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/youtube-music-surface-identity-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open settings-mode, YouTube Music\/YTM route\/surface, JSON path, DOM selector, learned-identity, capture provenance, performance, reliability, false-hide\/leak, code-burden, cross-feature, and source\/evidence rows in `js\/background\.js`, `js\/content\/bridge_settings\.js`, `js\/content\/dom_extractors\.js`, `js\/filter_logic\.js`, `js\/content_bridge\.js`, and `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /86 YTM video card extraction block lines/);
  assert.match(doc, /4663 YTM video card extraction block bytes/);
  assert.match(doc, /33 mapped YTM fallback block lines/);
  assert.match(doc, /1503 mapped YTM fallback block bytes/);
  assert.match(doc, /304 YTM style selector cluster block lines/);
  assert.match(doc, /11188 YTM style selector cluster block bytes/);
  assert.match(doc, /38 YTM channel selector cluster block lines/);
  assert.match(doc, /2211 YTM channel selector cluster block bytes/);
  assert.match(doc, /14 selected `VIDEO_CARD_SELECTORS` `ytm-` tokens/);
  assert.match(doc, /0 selected bridge profile classifier `music\.youtube\.com` tokens/);
  assert.match(doc, /0 selected manifest `music\.youtube\.com` patterns/);
  assert.match(doc, /7 runtime YTM surface identity fixtures/);
  assert.match(doc, /YTM uses generic `\*\.youtube\.com` manifest admission and Main profile classification/);
  assert.match(doc, /show-sheet collaborator extraction is not filter-logic parity/);
  assert.match(doc, /learned-map fallback can join `videoChannelMap` and request `mainworld` repair/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /host\/profile policies/);
  assert.match(doc, /JSON\/DOM parity gates/);
  assert.match(doc, /first-class YouTube Music surface identity authority gates/);
});

test('tracked_file_obligation_index_links_backup_nanah_trusted_state_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Backup Nanah trusted-state boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BACKUP_NANAH_TRUSTED_STATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/backup-nanah-trusted-state-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open backup\/export, Nanah sync, profile\/viewing-space, security\/PIN, storage\/cache, settings-mode, mutation, runtime refresh, performance, reliability, false-hide\/leak, code-burden, cross-feature, and source\/evidence rows in `js\/io_manager\.js`, `js\/tab-view\.js`, and `js\/nanah_sync_adapter\.js`/);
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
  assert.match(doc, /82 `runExportV3Encrypted\(\)` block lines/);
  assert.match(doc, /3969 `runExportV3Encrypted\(\)` block bytes/);
  assert.match(doc, /152 `runImportV3FromFile\(\)` block lines/);
  assert.match(doc, /6968 `runImportV3FromFile\(\)` block bytes/);
  assert.match(doc, /93 Nanah portable\/apply cluster block lines/);
  assert.match(doc, /3587 Nanah portable\/apply cluster block bytes/);
  assert.match(doc, /2 selected `includeTrustedNanahState` tokens/);
  assert.match(doc, /1 selected `containsNanahTrustedState` token/);
  assert.match(doc, /10 selected `targetProfileId` tokens in `importV3\(\)`/);
  assert.match(doc, /0 selected `targetProfileId` tokens in `importV3Encrypted\(\)`/);
  assert.match(doc, /5 runtime trusted-state boundary fixtures/);
  assert.match(doc, /full encrypted export includes trusted Nanah state only for full backup scope/);
  assert.match(doc, /merge restore combines trusted links and writes incoming device id/);
  assert.match(doc, /encrypted import helper does not forward `targetProfileId`/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /same-device proofs/);
  assert.match(doc, /post-import revisions/);
  assert.match(doc, /first-class backup Nanah trusted-state authority gates/);
});

test('tracked_file_obligation_index_links_manifest_permission_feature_map_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Manifest permission feature-map boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_MANIFEST_PERMISSION_FEATURE_MAP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/manifest-permission-feature-map-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open manifest\/permission, tracked-file, runtime lifecycle, message trust, external navigation, release\/static\/native, storage\/cache, settings-mode, performance, reliability, false-hide\/leak, code-burden, cross-feature, JSON-first filter readiness, and source\/evidence rows in `manifest\.json`, `manifest\.chrome\.json`, `manifest\.firefox\.json`, `manifest\.opera\.json`, `js\/background\.js`, `js\/io_manager\.js`, `js\/tab-view\.js`, `js\/popup\.js`, `js\/state_manager\.js`, `js\/content\/bridge_injection\.js`, `js\/content\/bridge_settings\.js`, `js\/content_bridge\.js`, `js\/settings_shared\.js`, `js\/content\/handle_resolver\.js`, and `build\.js`/);
  assert.match(doc, /4 browser manifest files/);
  assert.match(doc, /10 runtime permission consumer source files/);
  assert.match(doc, /8 source\/effect blocks/);
  assert.match(doc, /145 broad runtime permission API tokens/);
  assert.match(doc, /56 selected storage API tokens/);
  assert.match(doc, /18 selected `storage\.local\.get` tokens/);
  assert.match(doc, /28 selected `storage\.local\.set` tokens/);
  assert.match(doc, /4 selected `storage\.onChanged` tokens/);
  assert.match(doc, /61 selected tabs API tokens/);
  assert.match(doc, /17 selected `tabs\.query` tokens/);
  assert.match(doc, /5 selected `tabs\.sendMessage` tokens/);
  assert.match(doc, /10 selected `tabs\.create` tokens/);
  assert.match(doc, /1 selected `tabs\.update` token/);
  assert.match(doc, /9 selected `scripting\.executeScript` tokens/);
  assert.match(doc, /17 selected downloads API tokens/);
  assert.match(doc, /8 selected `downloads\.download` tokens/);
  assert.match(doc, /3 selected `downloads\.search` tokens/);
  assert.match(doc, /3 selected `downloads\.erase` tokens/);
  assert.match(doc, /4 manifest `activeTab` tokens/);
  assert.match(doc, /0 product runtime `activeTab` tokens/);
  assert.match(doc, /2 build `ensureCollabDialogScriptOrder` tokens/);
  assert.match(doc, /0 build `validateManifestPermissions` tokens/);
  assert.match(doc, /7 runtime manifest permission feature-map fixtures/);
  assert.match(doc, /all manifests keep the same permission and host map/);
  assert.match(doc, /storage\/tabs\/scripting\/downloads consumers are split across storage, backup, prompt injection, navigation, refresh, import\/export, content bridge, popup, tab-view, background, and StateManager flows/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /activeTab use reports/);
  assert.match(doc, /first-class manifest permission authority gates/);
});

test('tracked_file_obligation_index_links_external_navigation_surface_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /External navigation surface boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_EXTERNAL_NAVIGATION_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/external-navigation-surface-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open external navigation\/link authority, prompt\/onboarding, release-note, manifest\/permission, message trust, static HTML, website route, public claim, storage\/cache, settings-mode, performance, reliability, false-hide\/leak, code-burden, cross-feature, and source\/evidence rows/);
  for (const filePath of [
    'js/background.js',
    'js/popup.js',
    'js/tab-view.js',
    'js/content/release_notes_prompt.js',
    'html/popup.html',
    'html/tab-view.html',
    'website/components/marketing-ui.js',
    'website/components/site-header.js',
    'website/components/site-footer.js',
    'website/components/browser-logo-rail.js',
    'website/components/scenic-detail-page.js',
    'website/components/site-shell-data.js',
    'website/app/page.js',
    'website/app/downloads/page.js',
    'website/app/privacy/page.js',
  ]) {
    assert.match(doc, new RegExp(`\`${filePath.replaceAll('/', '\\/')}\``));
  }
  assert.match(doc, /15 external navigation source files/);
  assert.match(doc, /10 source\/effect blocks/);
  assert.match(doc, /5 selected `tabs\.create` callsites/);
  assert.match(doc, /7 selected `window\.open` callsites/);
  assert.match(doc, /1 selected `location\.href` assignment/);
  assert.match(doc, /8 selected `runtime\.getURL` callsites/);
  assert.match(doc, /2 selected `FilterTube_OpenWhatsNew` tokens/);
  assert.match(doc, /2 selected `createBrowserTab\(\)` tokens/);
  assert.match(doc, /5 selected `updateBrowserTab\(\)` tokens/);
  assert.match(doc, /4 selected `queryBrowserTabs\(\)` tokens/);
  assert.match(doc, /15 selected `target="_blank"` tokens/);
  assert.match(doc, /4 selected `rel` tokens containing `noopener`/);
  assert.match(doc, /14 selected `rel` tokens containing `noreferrer`/);
  assert.ok(doc.includes('15 selected literal external `href="https://...` tokens'));
  assert.match(doc, /2 selected `mailto:` href tokens/);
  assert.match(doc, /33 selected HTTPS literal tokens/);
  assert.match(doc, /7 runtime external-navigation surface fixtures/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /URL class reports/);
  assert.match(doc, /trusted-sender reports/);
  assert.match(doc, /first-class external navigation authority gates/);
});

test('tracked_file_obligation_index_links_tab_view_lifecycle_selector_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Tab-view lifecycle\/selector boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_TAB_VIEW_LIFECYCLE_SELECTOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/tab-view-lifecycle-selector-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open runtime observer\/listener\/timer, DOM selector, settings-mode, profile\/viewing-space, dashboard UI, subscription import, stats, storage\/cache refresh, reliability, false-hide\/leak, performance, code-burden, cross-feature, and source\/evidence rows in `js\/tab-view\.js` and `html\/tab-view\.html`/);
  assert.match(doc, /2 tab-view source files/);
  assert.match(doc, /12 selected source\/effect blocks/);
  assert.match(doc, /180 selected lifecycle primitives/);
  assert.match(doc, /147 selected `addEventListener` callsites/);
  assert.match(doc, /0 selected `removeEventListener` callsites/);
  assert.match(doc, /0 selected `MutationObserver` tokens/);
  assert.match(doc, /0 selected `IntersectionObserver` tokens/);
  assert.match(doc, /1 selected `setInterval` callsite/);
  assert.match(doc, /1 selected `clearInterval` callsite/);
  assert.match(doc, /14 selected `setTimeout` callsites/);
  assert.match(doc, /4 selected `clearTimeout` callsites/);
  assert.match(doc, /11 selected `requestAnimationFrame` callsites/);
  assert.match(doc, /2 selected `cancelAnimationFrame` callsites/);
  assert.match(doc, /1 selected runtime `onMessage` listener/);
  assert.match(doc, /5 selected `window\.addEventListener` callsites/);
  assert.match(doc, /2 selected `document\.addEventListener` callsites/);
  assert.match(doc, /3 selected `StateManager\.subscribe` callsites/);
  assert.match(doc, /234 selected `document\.getElementById` tokens/);
  assert.match(doc, /175 selected unique JS id literals/);
  assert.match(doc, /100 selected static HTML ids/);
  assert.match(doc, /85 selected JS id literals not present as static HTML ids/);
  assert.match(doc, /10 selected static HTML ids not directly reached by JS id literals/);
  assert.match(doc, /30 selected `querySelector` tokens/);
  assert.match(doc, /27 selected `querySelectorAll` tokens/);
  assert.match(doc, /6 runtime tab-view lifecycle\/selector fixtures/);
  assert.match(doc, /responsive navigation uses a local idempotence guard/);
  assert.match(doc, /filter saves use local debounce timers/);
  assert.match(doc, /dashboard stats owns the interval and guarded buttons/);
  assert.match(doc, /subscription import progress is request\/source-tab filtered/);
  assert.match(doc, /static HTML cannot validate dynamic tab-view selector coverage alone/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /dynamic id provenance/);
  assert.match(doc, /static id parity/);
  assert.match(doc, /first-class tab-view lifecycle\/selector authority gates/);
});

test('tracked_file_obligation_index_links_popup_lifecycle_selector_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Popup lifecycle\/selector boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_POPUP_LIFECYCLE_SELECTOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/popup-lifecycle-selector-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open popup UI, runtime observer\/listener\/timer, DOM selector, generated shell, settings-mode, list-mode, profile\/lock, runtime message, external open, content-control, video-filter, reliability, false-hide\/leak, performance, code-burden, cross-feature, and source\/evidence rows in `js\/popup\.js` and `html\/popup\.html`/);
  assert.match(doc, /2 popup source files/);
  assert.match(doc, /11 selected source\/effect blocks/);
  assert.match(doc, /33 selected lifecycle primitives/);
  assert.match(doc, /30 selected `addEventListener` callsites/);
  assert.match(doc, /0 selected `removeEventListener` callsites/);
  assert.match(doc, /0 selected `MutationObserver` tokens/);
  assert.match(doc, /0 selected `IntersectionObserver` tokens/);
  assert.match(doc, /0 selected `setInterval` callsites/);
  assert.match(doc, /0 selected `clearInterval` callsites/);
  assert.match(doc, /2 selected `setTimeout` callsites/);
  assert.match(doc, /0 selected `clearTimeout` callsites/);
  assert.match(doc, /1 selected `requestAnimationFrame` callsite/);
  assert.match(doc, /0 selected `cancelAnimationFrame` callsites/);
  assert.match(doc, /3 selected `document\.addEventListener` callsites/);
  assert.match(doc, /0 selected `window\.addEventListener` callsites/);
  assert.match(doc, /2 selected `StateManager\.subscribe` callsites/);
  assert.match(doc, /4 selected `sendRuntimeMessage` tokens/);
  assert.match(doc, /1 selected `\.runtime\.sendMessage` callsite/);
  assert.match(doc, /5 selected `window\.open` callsites/);
  assert.match(doc, /52 selected `document\.getElementById` tokens/);
  assert.match(doc, /23 selected unique JS id literals/);
  assert.match(doc, /1 selected static HTML id/);
  assert.match(doc, /23 selected JS id literals not present as static HTML ids/);
  assert.match(doc, /1 selected static HTML id not directly reached by JS id literals/);
  assert.match(doc, /4 selected `querySelector` tokens/);
  assert.match(doc, /6 selected `querySelectorAll` tokens/);
  assert.match(doc, /82 selected `document\.createElement` tokens/);
  assert.match(doc, /5 selected `innerHTML` writes/);
  assert.match(doc, /6 runtime popup lifecycle\/selector fixtures/);
  assert.match(doc, /popup static HTML is a shell/);
  assert.match(doc, /video filter controls bind after 100 ms/);
  assert.match(doc, /list-mode controls use a local runtime message helper/);
  assert.match(doc, /static HTML cannot validate popup selector coverage alone/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /generated shell parity/);
  assert.match(doc, /delayed binding budgets/);
  assert.match(doc, /first-class popup lifecycle\/selector authority gates/);
});

test('tracked_file_obligation_index_links_extension_ui_css_page_state_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Extension UI CSS page-state boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_EXTENSION_UI_CSS_PAGE_STATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/extension-ui-css-page-state-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open active extension UI CSS, static popup\/dashboard HTML, generated shell, shell runtime, popup\/dashboard UI, responsive\/accessibility, motion, reliability, performance, code-burden, cross-feature, and source\/evidence rows/);
  for (const filePath of [
    'css/design_tokens.css',
    'css/components.css',
    'css/popup.css',
    'css/tab-view.css',
    'css/serene-shell.css',
    'html/popup.html',
    'html/tab-view.html',
    'src/extension-shell/popup.jsx',
    'src/extension-shell/tab-view-decor.jsx',
    'src/extension-shell/shared/runtime.js',
    'js/ui-shell/popup-shell.js',
    'js/ui-shell/tab-view-decor.js',
    'js/popup.js',
    'js/tab-view.js',
  ]) {
    assert.match(doc, new RegExp(`\`${filePath.replaceAll('/', '\\/')}\``));
  }
  assert.match(doc, /14 selected source files/);
  assert.match(doc, /5 selected active extension UI CSS files/);
  assert.match(doc, /2 selected extension HTML pages/);
  assert.match(doc, /3 selected generated-shell source files/);
  assert.match(doc, /2 selected generated-shell output files/);
  assert.match(doc, /2 selected hand-owned UI runtime files/);
  assert.match(doc, /9,329 selected active CSS lines/);
  assert.match(doc, /240,541 selected active CSS bytes/);
  assert.match(doc, /1,342 selected lexical rule blocks/);
  assert.match(doc, /115 selected `!important` declarations/);
  assert.match(doc, /25 selected `display:none` declarations/);
  assert.match(doc, /36 selected `@media` blocks/);
  assert.match(doc, /6 selected `@keyframes` blocks/);
  assert.match(doc, /3 selected `\[hidden\]` selectors/);
  assert.match(doc, /16 selected `:focus-visible` selectors/);
  assert.match(doc, /134 selected `:hover` selectors/);
  assert.match(doc, /255 selected dark-theme selector prefixes/);
  assert.match(doc, /331 selected `data-theme` tokens/);
  assert.match(doc, /54 selected `data-surface` tokens/);
  assert.match(doc, /7 selected `data-scene` tokens/);
  assert.match(doc, /47 selected `\.active` selectors/);
  assert.match(doc, /56 selected `transition` declarations/);
  assert.match(doc, /90 selected `transform` declarations/);
  assert.match(doc, /5 runtime extension UI CSS page-state fixtures/);
  assert.match(doc, /popup and dashboard active CSS load order is fixed/);
  assert.match(doc, /generated shell output loads before hand-owned popup\/dashboard runtime/);
  assert.match(doc, /shell runtime owns theme\/scene\/surface data attributes, `ft-extension-surface`, and popup width `392px`/);
  assert.match(doc, /popup shell source\/output both carry 13 `ft-popup-shell` tokens/);
  assert.match(doc, /tab-view decor source\/output both carry 11 `ft-tab-view-ambient` tokens/);
  assert.match(doc, /static HTML cannot validate page-state selector coverage alone/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /generated source-output parity manifests/);
  assert.match(doc, /browser visual fixtures/);
  assert.match(doc, /first-class extension UI CSS page-state authority gates/);
});

test('tracked_file_obligation_index_links_legacy_layout_quarantine_package_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Legacy layout quarantine\/package boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_LEGACY_LAYOUT_QUARANTINE_PACKAGE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/legacy-layout-quarantine-package-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open quarantined legacy JS, build\/package, browser manifest, extension HTML, renderer inventory, code-burden, false-hide\/leak, performance, cross-feature, native\/runtime sync, and source\/evidence rows/);
  for (const filePath of [
    'js/layout.js',
    'build.js',
    'manifest.json',
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.opera.json',
    'html/popup.html',
    'html/tab-view.html',
    'docs/youtube_renderer_inventory.md',
  ]) {
    assert.match(doc, new RegExp(`\`${filePath.replaceAll('/', '\\/')}\``));
  }
  assert.match(doc, /`js\/layout\.js` at 680 lines/);
  assert.match(doc, /30,604 bytes/);
  assert.match(doc, /48831ccdc2d62c75818d9c6a153d7bfacec9d7be9f2408485f74b1a7c13c57c7/);
  assert.match(doc, /5 exported method declarations/);
  assert.match(doc, /63 selector API sites/);
  assert.match(doc, /52 unique static selector literals/);
  assert.match(doc, /146 direct style property writes/);
  assert.match(doc, /34 selected `style\.display` writes/);
  assert.match(doc, /32 selected `filter-tube-visible` token occurrences/);
  assert.match(doc, /0 selected listeners\/timers\/observers\/fetch calls/);
  assert.match(doc, /4 selected active manifest files/);
  assert.match(doc, /7 selected active content-script entries/);
  assert.match(doc, /59 selected active content-script JS refs/);
  assert.match(doc, /19 selected active web-accessible resource refs/);
  assert.match(doc, /0 selected active `js\/layout\.js` load\/exposure refs/);
  assert.match(doc, /3 selected dist manifest files/);
  assert.match(doc, /5 selected dist content-script entries/);
  assert.match(doc, /44 selected dist content-script JS refs/);
  assert.match(doc, /14 selected dist web-accessible resource refs/);
  assert.match(doc, /0 selected dist `js\/layout\.js` load\/exposure refs/);
  assert.match(doc, /2 selected extension HTML files/);
  assert.match(doc, /21 selected extension HTML script tags/);
  assert.match(doc, /0 selected extension HTML `js\/layout\.js` script refs/);
  assert.match(doc, /3 selected byte-identical packaged dist copies/);
  assert.match(doc, /3 selected renderer-inventory `js\/layout\.js` references/);
  assert.match(doc, /`build\.js` copies the whole `js` directory/);
  assert.match(doc, /active and dist manifests do not load or web-expose `js\/layout\.js`/);
  assert.match(doc, /popup\/dashboard HTML do not load it/);
  assert.match(doc, /no current non-doc runtime caller reaches `window\.filterTubeLayout` outside `js\/layout\.js` itself/);
  assert.match(doc, /renderer inventory layout-fix rows are not active filtering coverage proof/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /package cleanup proof/);
  assert.match(doc, /activation\/deletion gates/);
  assert.match(doc, /renderer inventory parity/);
  assert.match(doc, /first-class legacy layout quarantine authority gates/);
});

test('tracked_file_obligation_index_links_quarantined_content_css_package_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Quarantined content CSS package boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_QUARANTINED_CONTENT_CSS_PACKAGE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/quarantined-content-css-package-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open quarantined content CSS, build\/package, browser manifest, extension HTML, CSS selector, code-burden, false-hide\/leak, performance, cross-feature, native\/runtime sync, first-class JSON filtering, and source\/evidence rows/);
  for (const filePath of [
    'css/content.css',
    'css/filter.css',
    'css/layout.css',
    'build.js',
    'manifest.json',
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.opera.json',
    'html/popup.html',
    'html/tab-view.html',
    'html/troubleshoot.html',
  ]) {
    assert.match(doc, new RegExp(`\`${filePath.replaceAll('/', '\\/')}\``));
  }
  assert.match(doc, /3 selected quarantined content CSS files/);
  assert.match(doc, /1,262 counted source lines/);
  assert.match(doc, /43,883 bytes/);
  assert.match(doc, /137 selected lexical rule blocks/);
  assert.match(doc, /478 selected `!important` declarations/);
  assert.match(doc, /22 selected `display:none` declarations/);
  assert.match(doc, /72 selected `:not\(\.filter-tube-visible\)` clauses/);
  assert.match(doc, /167 selected `filter-tube-visible` tokens/);
  assert.match(doc, /6 selected `filtertube-hidden` tokens/);
  assert.match(doc, /14 selected `:has\(\.\.\.\)` selectors/);
  assert.match(doc, /1 selected `clip-path` declaration/);
  assert.match(doc, /8 selected `pointer-events:none` declarations/);
  assert.match(doc, /10 selected `visibility:hidden` declarations/);
  assert.match(doc, /10 selected `opacity:0` declarations/);
  assert.match(doc, /4 selected active manifest files/);
  assert.match(doc, /7 selected active content-script entries/);
  assert.match(doc, /59 selected active content-script JS refs/);
  assert.match(doc, /0 selected active content script CSS refs/);
  assert.match(doc, /19 selected active web-accessible resource refs/);
  assert.match(doc, /0 selected active quarantined CSS load\/exposure refs/);
  assert.match(doc, /3 selected dist manifest files/);
  assert.match(doc, /5 selected dist content-script entries/);
  assert.match(doc, /44 selected dist content-script JS refs/);
  assert.match(doc, /0 selected dist content script CSS refs/);
  assert.match(doc, /14 selected dist web-accessible resource refs/);
  assert.match(doc, /0 selected dist quarantined CSS load\/exposure refs/);
  assert.match(doc, /3 selected extension HTML files/);
  assert.match(doc, /10 selected extension HTML link tags/);
  assert.match(doc, /0 selected extension HTML quarantined CSS links/);
  assert.match(doc, /9 selected byte-identical packaged dist CSS copies/);
  assert.match(doc, /`js\/layout\.js` with 32 occurrences/);
  assert.match(doc, /`build\.js` copies the whole `css` directory/);
  assert.match(doc, /browser dist copies of `css\/content\.css`, `css\/filter\.css`, and `css\/layout\.css` match source/);
  assert.match(doc, /active and dist manifests do not load or web-expose the selected CSS/);
  assert.match(doc, /extension HTML does not link it/);
  assert.match(doc, /old default-hide\/reveal model/);
  assert.match(doc, /active runtime hiding uses `\.filtertube-hidden` \/ `\.filtertube-hidden-shelf`/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /package cleanup proof/);
  assert.match(doc, /activation\/deletion gates/);
  assert.match(doc, /first-class JSON\/DOM parity/);
  assert.match(doc, /first-class quarantined content CSS authority gates/);
});

test('tracked_file_obligation_index_links_storage_payload_quota_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Storage payload quota boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_STORAGE_PAYLOAD_QUOTA_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/storage-payload-quota-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open storage\/cache, import\/export, Nanah, learned-identity, settings-mode, JSON-first, performance, reliability, false-hide\/leak, code-burden, cross-feature, and source\/evidence rows/);
  for (const filePath of [
    'js/background.js',
    'js/io_manager.js',
    'js/nanah_sync_adapter.js',
    'js/tab-view.js',
    'js/state_manager.js',
  ]) {
    assert.match(doc, new RegExp(`\`${filePath.replaceAll('/', '\\/')}\``));
  }
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
  assert.match(doc, /15 StateManager persistChannelMap block lines/);
  assert.match(doc, /464 StateManager persistChannelMap block bytes/);
  assert.match(doc, /0 selected `getBytesInUse` tokens/);
  assert.match(doc, /0 selected `QUOTA` tokens/);
  assert.match(doc, /background whole-map writes use entry-count caps for video maps rather than byte budgets/);
  assert.match(doc, /`channelMap` has no equivalent entry cap/);
  assert.match(doc, /backup\/export paths stringify entire payloads without byte budgets/);
  assert.match(doc, /backup rotation keeps records rather than bytes/);
  assert.match(doc, /Nanah envelopes stringify and parse settings payloads without size gates/);
  assert.match(doc, /StateManager can write the full `channelMap` directly/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /byte-budget reports/);
  assert.match(doc, /quota preflight/);
  assert.match(doc, /quota error classification/);
  assert.match(doc, /first-class storage payload quota gates/);
});

test('tracked_file_obligation_index_links_backup_download_blob_url_lifecycle_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Backup download Blob URL lifecycle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BACKUP_DOWNLOAD_BLOB_URL_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/backup-download-blob-url-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open backup\/export, storage\/cache, import\/export, extension UI, browser permission, performance, reliability, code-burden, cross-feature, and source\/evidence rows/);
  for (const filePath of [
    'js/background.js',
    'js/io_manager.js',
    'js/tab-view.js',
  ]) {
    assert.match(doc, new RegExp(`\`${filePath.replaceAll('/', '\\/')}\``));
  }
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
  assert.match(doc, /4 selected `Blob\(\[` tokens/);
  assert.match(doc, /8 selected `downloads\.download` tokens/);
  assert.match(doc, /3 selected `downloads\.search` tokens/);
  assert.match(doc, /3 selected `downloads\.erase` tokens/);
  assert.match(doc, /0 selected `removeFile` tokens/);
  assert.match(doc, /0 selected `clearObjectUrl` tokens/);
  assert.match(doc, /background auto-backup object URL cleanup waits for downloads API resolution/);
  assert.match(doc, /wrappers have settled guards but no timeout owner/);
  assert.match(doc, /IO directory probing writes `FilterTube Backup\/\.test`/);
  assert.match(doc, /IO save creates its object URL before directory probing/);
  assert.match(doc, /tab-view anchor fallback uses timed DOM removal and delayed URL revocation/);
  assert.match(doc, /downloads API failure can allocate a second anchor object URL/);
  assert.match(doc, /selected sources use `downloads\.erase` without filesystem deletion proof/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /object URL registries/);
  assert.match(doc, /revoke policies/);
  assert.match(doc, /timeout budgets/);
  assert.match(doc, /first-class backup download Blob URL lifecycle gates/);
});

test('tracked_file_obligation_index_links_security_crypto_payload_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Security crypto payload boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SECURITY_CRYPTO_PAYLOAD_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/security-crypto-payload-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open security\/PIN, encrypted backup, import\/export, Nanah, profile\/viewing-space, storage\/cache, settings-mode, JSON-first, performance, reliability, false-hide\/leak, code-burden, cross-feature, and source\/evidence rows/);
  for (const filePath of [
    'js/security_manager.js',
    'js/background.js',
    'js/io_manager.js',
    'js/tab-view.js',
    'js/popup.js',
  ]) {
    assert.match(doc, new RegExp(`\`${filePath.replaceAll('/', '\\/')}\``));
  }
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
  assert.match(doc, /7 popup PIN wrapper block lines/);
  assert.match(doc, /286 popup PIN wrapper block bytes/);
  assert.match(doc, /7 tab-view PIN wrapper block lines/);
  assert.match(doc, /286 tab-view PIN wrapper block bytes/);
  assert.match(doc, /0 selected `additionalData` tokens/);
  assert.match(doc, /0 selected `version` tokens/);
  assert.match(doc, /PBKDF2\/SHA-256 PIN verifier output is deterministic with injected salt/);
  assert.match(doc, /PBKDF2\/SHA-256\/AES-GCM encrypted JSON output is deterministic with injected salt and IV/);
  assert.match(doc, /malformed verifier shapes return false/);
  assert.match(doc, /wrong passwords surface WebCrypto `OperationError`/);
  assert.match(doc, /background encrypted auto-backup wraps \`\{ meta: \{ encrypted: true \}, encrypted \}\`/);
  assert.match(doc, /IO encrypted import still delegates without `targetProfileId`/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /schema reports/);
  assert.match(doc, /iteration bounds/);
  assert.match(doc, /timing policy/);
  assert.match(doc, /version policy/);
  assert.match(doc, /associated-data policy/);
  assert.match(doc, /first-class security crypto payload gates/);
});

test('tracked_file_obligation_index_links_ui_components_portal_lifecycle_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /UI components portal lifecycle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_UI_COMPONENTS_PORTAL_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/ui-components-portal-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open runtime observer\/listener\/timer, DOM selector, shared extension UI, settings-mode surface, reliability, leak, performance, code-burden, cross-feature, and source\/evidence rows/);
  assert.match(doc, /`js\/ui_components\.js`/);
  assert.match(doc, /1 UI components portal lifecycle source file/);
  assert.match(doc, /3 source\/effect blocks/);
  assert.match(doc, /26 `flashButtonSuccess` block lines/);
  assert.match(doc, /1132 `flashButtonSuccess` block bytes/);
  assert.match(doc, /378 `createDropdownFromSelect` block lines/);
  assert.match(doc, /14973 dropdown block bytes/);
  assert.match(doc, /20 `showToast` block lines/);
  assert.match(doc, /633 toast block bytes/);
  assert.match(doc, /10 selected `document\.createElement` tokens/);
  assert.match(doc, /2 selected `document\.body\.appendChild` tokens/);
  assert.match(doc, /7 selected `addEventListener` tokens/);
  assert.match(doc, /3 selected `setTimeout` tokens/);
  assert.match(doc, /0 selected `clearTimeout` tokens/);
  assert.match(doc, /1 selected `MutationObserver` token/);
  assert.match(doc, /0 selected `disconnect` tokens/);
  assert.match(doc, /0 selected `removeEventListener` tokens/);
  assert.match(doc, /button success feedback uses an uncancelled restore timer/);
  assert.match(doc, /enhanced select dropdowns use local duplicate guards and body portals/);
  assert.match(doc, /dropdown listeners, animation-frame positioning, disabled-state observation, and synthetic select events are local to the helper/);
  assert.match(doc, /toast replacement uses body append plus nested removal timers/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /portal lifecycle contracts/);
  assert.match(doc, /dropdown registries/);
  assert.match(doc, /observer teardown reports/);
  assert.match(doc, /toast timer budgets/);
  assert.match(doc, /first-class UI components portal lifecycle gates/);
});

test('tracked_file_obligation_index_links_state_manager_storage_reload_enrichment_lifecycle_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /StateManager storage reload\/enrichment lifecycle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_STATE_MANAGER_STORAGE_RELOAD_ENRICHMENT_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/state-manager-storage-reload-enrichment-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open runtime observer\/listener\/timer, settings-mode, storage\/cache, message mutation, learned identity, performance, reliability, false-hide\/leak, code-burden, cross-feature, and source\/evidence rows/);
  assert.match(doc, /`js\/state_manager\.js`/);
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
  assert.match(doc, /broadcasts only compiled settings/);
  assert.match(doc, /channel enrichment uses zero-delay scheduling/);
  assert.match(doc, /sends `addFilteredChannel`/);
  assert.match(doc, /delays next work by randomized 5000-6999 ms backoff/);
  assert.match(doc, /storage listener skips non-local, saving, and map-only `channelMap` changes/);
  assert.match(doc, /theme changes emit `themeChanged`/);
  assert.match(doc, /external reload uses a 150 ms debounce/);
  assert.match(doc, /loads with `notify:false`, `resetEnrichment:false`, and `scheduleEnrichment:false`/);
  assert.match(doc, /reruns pending reloads with a zero-delay timer/);
  assert.match(doc, /no clear\/remove teardown path exists in the selected block/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /reload lifecycle contracts/);
  assert.match(doc, /race reports/);
  assert.match(doc, /save queue contracts/);
  assert.match(doc, /listener teardown registries/);
  assert.match(doc, /first-class StateManager storage reload\/enrichment lifecycle gates/);
});

test('tracked_file_obligation_index_links_background_compiled_cache_invalidation_lifecycle_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Background compiled cache invalidation lifecycle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BACKGROUND_COMPILED_CACHE_INVALIDATION_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/background-compiled-cache-invalidation-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open storage\/cache key authority, runtime listener, settings-mode, message mutation, profile\/viewing-space, JSON-first readiness, performance, reliability, false-hide\/leak, code-burden, cross-feature, and source\/evidence rows/);
  assert.match(doc, /`js\/background\.js`/);
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
  assert.match(doc, /0 selected `cacheInvalidationReport` tokens/);
  assert.match(doc, /cache identity is only `main` and `kids`/);
  assert.match(doc, /compiler and runtime message cache gates can return before storage read/);
  assert.match(doc, /`getCompiledSettings\(\)` reads 43 direct storage keys/);
  assert.match(doc, /compiler and message branch both assign cache/);
  assert.match(doc, /`FilterTube_ApplySettings` assigns caller `request\.settings` into cache/);
  assert.match(doc, /broadcasts it without sender or revision proof/);
  assert.match(doc, /storage invalidation watches 14 keys/);
  assert.match(doc, /omits 30 direct compiler keys/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /key parity reports/);
  assert.match(doc, /cache source reports/);
  assert.match(doc, /caller-payload policies/);
  assert.match(doc, /first-class background compiled cache invalidation gates/);
});

test('tracked_file_obligation_index_links_state_manager_request_refresh_fanout_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /StateManager request refresh fanout boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_STATE_MANAGER_REQUEST_REFRESH_FANOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/state-manager-request-refresh-fanout-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open settings-mode, storage\/cache, message mutation, profile\/viewing-space, JSON-first readiness, performance, reliability, false-hide\/leak, code-burden, cross-feature, and source\/evidence rows/);
  assert.match(doc, /`js\/state_manager\.js`/);
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
  assert.match(doc, /`broadcastSettings\(\)` sends caller payloads through `FilterTube_ApplySettings`/);
  assert.match(doc, /`requestRefresh\(\)` asks background for `getCompiledSettings` with `forceRefresh:true`/);
  assert.match(doc, /Main whitelist branches use `persistMainProfiles\(\)` plus `requestRefresh\('main'\)`/);
  assert.match(doc, /Kids mutation branches use profile persistence plus `requestRefresh\('kids'\)`/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /callsite reports/);
  assert.match(doc, /direct compiled broadcast policies/);
  assert.match(doc, /background refresh rebound policies/);
  assert.match(doc, /first-class StateManager refresh fanout gates/);
});

test('tracked_file_obligation_index_links_native_runtime_sync_manifest_freshness_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Native runtime sync manifest freshness boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_NATIVE_RUNTIME_SYNC_MANIFEST_FRESHNESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/native-runtime-sync-manifest-freshness-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open native sync, release\/package, generated runtime, release-note parity, first-class JSON filtering parity/);
  assert.match(doc, /`scripts\/sync-native-runtime\.mjs`/);
  assert.match(doc, /`package\.json`/);
  assert.match(doc, /`build\.js`/);
  assert.match(doc, /\/Users\/devanshvarshney\/FilterTubeApp\/tools\/sync-runtime-from-extension\.mjs/);
  assert.match(doc, /\/Users\/devanshvarshney\/FilterTubeApp\/tools\/runtime-sync-manifest\.json/);
  assert.match(doc, /public wrapper at 34 lines and 1070 bytes/);
  assert.match(doc, /app sync script at 1758 lines and 76587 bytes/);
  assert.match(doc, /app runtime sync manifest at 198 lines and 8178 bytes/);
  assert.match(doc, /public repo HEAD `[0-9a-f]{40}`/);
  assert.match(doc, /app repo HEAD `[0-9a-f]{40}`/);
  assert.match(doc, /46 dirty app paths/);
  assert.match(doc, /28 manifest entries/);
  assert.match(doc, /0 `destinationKind` fields/);
  assert.match(doc, /28 direct manifest copy hash matches/);
  assert.match(doc, /43 broad source-mirror hash matches/);
  assert.match(doc, /15 `runtimeBundleOrder` entries including `js\/layout\.js`/);
  assert.match(doc, /6 generated app runtime artifact hashes/);
  assert.match(doc, /Android\/iOS native release-note resources that differ from current public `data\/release_notes\.json`/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /sync reports/);
  assert.match(doc, /dirty-state policies/);
  assert.match(doc, /generated runtime hash reports/);
  assert.match(doc, /release-note parity reports/);
  assert.match(doc, /layout quarantine gates/);
  assert.match(doc, /first-class JSON parity gates/);
});

test('tracked_file_obligation_index_links_nanah_vendor_runtime_session_lifecycle_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Nanah vendor runtime session lifecycle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_NANAH_VENDOR_RUNTIME_SESSION_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/nanah-vendor-runtime-session-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open vendor bundle, runtime observer\/listener\/timer, crypto\/session, dashboard Nanah sync, storage payload carrier, reliability, leak, performance, code-burden, cross-feature, JSON-first readiness, source\/evidence, native parity, and implementation-change rows/);
  assert.match(doc, /`js\/vendor\/nanah\.bundle\.js`/);
  assert.match(doc, /`js\/tab-view\.js`/);
  assert.match(doc, /`js\/nanah_sync_adapter\.js`/);
  assert.match(doc, /`html\/tab-view\.html`/);
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
  assert.match(doc, /vendor session listeners are not paired with selected remove-listener tokens/);
  assert.match(doc, /no selected timeout\/reconnect\/chunk-expiry token exists/);
  assert.match(doc, /dashboard reset\/apply ownership remains split/);
  assert.match(doc, /first-class JSON filter parity is not established/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /connect timeout policies/);
  assert.match(doc, /listener-owner teardown reports/);
  assert.match(doc, /crypto handshake fixtures/);
  assert.match(doc, /first-class Nanah JSON filter parity gates/);
});

test('tracked_file_obligation_index_links_extension_icon_logo_package_parity_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Extension icon\/logo package parity boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_EXTENSION_ICON_LOGO_PACKAGE_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/extension-icon-logo-package-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open extension-icons, website-assets, website app icon, browser manifest, extension HTML, generated popup shell, website metadata\/header, package\/release, public identity, performance, code-burden, and source\/evidence rows/);
  for (const file of [
    'icons/file.svg',
    'icons/icon-128.png',
    'icons/icon-128.svg',
    'icons/icon-16.png',
    'icons/icon-32.png',
    'icons/icon-48.png',
    'icons/icon-64.png',
    'website/app/icon.png',
    'website/assets/images/logo.png',
    'website/public/brand/logo.png',
    'manifest.json',
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.opera.json',
    'html/tab-view.html',
    'src/extension-shell/popup.jsx',
    'js/ui-shell/popup-shell.js',
    'website/app/layout.js',
    'website/components/site-header.js',
    'build.js',
  ]) {
    assert.match(doc, new RegExp(`\`${file.replace(/[/.]/g, '\\$&')}\``));
  }
  assert.match(doc, /10 selected binary\/vector files/);
  assert.match(doc, /29,560 selected bytes/);
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
  assert.match(doc, /visual fixtures/);
  assert.match(doc, /first-class icon\/logo package parity gates/);
});

test('tracked_file_obligation_index_links_release_notes_json_version_gate_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Release notes JSON version gate boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_RELEASE_NOTES_JSON_VERSION_GATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/release-notes-json-version-gate-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON path, data asset, release\/package, public-claim, browser manifest, prompt\/dashboard, external-navigation, native parity, first-class JSON claim, reliability, performance, code-burden, source\/evidence, and cross-feature rows/);
  for (const file of [
    'data/release_notes.json',
    'package.json',
    'manifest.json',
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.opera.json',
    'js/background.js',
    'js/tab-view.js',
    'js/content/release_notes_prompt.js',
  ]) {
    assert.match(doc, new RegExp(`\`${file.replace(/[/.]/g, '\\$&')}\``));
  }
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

test('tracked_file_obligation_index_links_design_token_json_css_parity_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Design token JSON\/CSS parity boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_DESIGN_TOKEN_JSON_CSS_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/design-token-json-css-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON path, data-design-input, CSS load, extension UI, package, visual\/accessibility, performance, code-burden, public-claim, first-class JSON claim, source\/evidence, and implementation-change rows/);
  for (const file of [
    'design/design_tokens.json',
    'css/design_tokens.css',
    'css/components.css',
    'css/popup.css',
    'css/tab-view.css',
    'html/popup.html',
    'html/tab-view.html',
    'html/troubleshoot.html',
    'build.js',
    'package.json',
  ]) {
    assert.match(doc, new RegExp(`\`${file.replace(/[/.]/g, '\\$&')}\``));
  }
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

test('tracked_file_obligation_index_links_package_lock_script_optional_dependency_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Package lock script\/optional dependency boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_PACKAGE_LOCK_SCRIPT_OPTIONAL_DEPENDENCY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/package-lock-script-optional-dependency-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON path, package metadata, dependency-health, install lifecycle, release\/package, performance, code-burden, source\/evidence, first-class JSON config, and implementation-change rows/);
  for (const file of [
    'package.json',
    'package-lock.json',
    'website/package.json',
    'website/package-lock.json',
  ]) {
    assert.match(doc, new RegExp(`\`${file.replace(/[/.]/g, '\\$&')}\``));
  }
  assert.match(doc, /`package\.json` at 61 lines/);
  assert.match(doc, /2,405 bytes/);
  assert.match(doc, /`package-lock\.json` at 1,461 lines/);
  assert.match(doc, /49,916 bytes/);
  assert.match(doc, /`website\/package\.json` at 23 lines/);
  assert.match(doc, /477 bytes/);
  assert.match(doc, /`website\/package-lock\.json` at 1,678 lines/);
  assert.match(doc, /55,337 bytes/);
  assert.match(doc, /root lockfile version 3 with 112 package entries/);
  assert.match(doc, /1 install-script marker \(`node_modules\/esbuild`\)/);
  assert.match(doc, /26 optional `@esbuild\/\*` entries/);
  assert.match(doc, /0 missing integrity entries/);
  assert.match(doc, /website lockfile version 3 with 101 package entries/);
  assert.match(doc, /1 install-script marker \(`node_modules\/sharp`\)/);
  assert.match(doc, /65 optional entries/);
  assert.match(doc, /6 no-integrity\/no-resolved bundled nested Tailwind wasm entries/);
  assert.match(doc, /7 bundled marker entries/);
  assert.match(doc, /5 peer dependency entries/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /lifecycle-script allowlists/);
  assert.match(doc, /clean-install transcripts/);
  assert.match(doc, /integrity exception reports/);
  assert.match(doc, /dependency-burden budgets/);
  assert.match(doc, /first-class JSON config gates/);
});

test('tracked_file_obligation_index_links_website_remote_request_privacy_performance_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Website remote request privacy\/performance boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WEBSITE_REMOTE_REQUEST_PRIVACY_PERFORMANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/website-remote-request-privacy-performance-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open website app, website components, website config, public-claim, privacy, remote request, external URL, performance, code-burden, source\/evidence, first-class JSON public-claim, and implementation-change rows/);
  for (const file of [
    'website/app/[slug]/page.js',
    'website/app/downloads/page.js',
    'website/app/globals.css',
    'website/app/layout.js',
    'website/app/page.js',
    'website/app/privacy/page.js',
    'website/app/robots.js',
    'website/app/sitemap.js',
    'website/components/browser-logo-rail.js',
    'website/components/route-content.js',
    'website/components/site-data.js',
    'website/components/site-header.js',
    'website/components/site-shell-data.js',
    'website/next.config.mjs',
  ]) {
    assert.match(doc, new RegExp(`\`${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\``));
  }
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

test('tracked_file_obligation_index_links_json_first_list_mode_matrix_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON-first list-mode matrix boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/json-first-list-mode-matrix-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, filter-logic, disabled mode, empty blocklist, empty whitelist, unknown `listMode`, simultaneous allow\/block, comment policy, and cross-feature rows in `js\/filter_logic\.js`/);
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
  assert.match(doc, /disabled original-payload return/);
  assert.match(doc, /empty blocklist preserve behavior/);
  assert.match(doc, /empty whitelist fail-closed behavior/);
  assert.match(doc, /unknown-mode blocklist fallback/);
  assert.match(doc, /dormant whitelist rows outside exact whitelist mode/);
  assert.match(doc, /blocklist-over-whitelist conflict behavior/);
  assert.match(doc, /whitelist-over-blocklist conflict behavior/);
  assert.match(doc, /comment empty-whitelist bypass behavior/);
  assert.match(doc, /comment author blocklist behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /matrix contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /disabled-mode harvest policies/);
  assert.match(doc, /empty blocklist policies/);
  assert.match(doc, /empty whitelist policies/);
  assert.match(doc, /unknown-mode fallback policies/);
  assert.match(doc, /simultaneous allow\/block policies/);
  assert.match(doc, /conflict reports/);
  assert.match(doc, /comment list-mode policies/);
  assert.match(doc, /first-class list-mode matrix authority gates/);
});

test('tracked_file_obligation_index_links_seed_fetch_no_work_list_mode_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Seed fetch no-work\/list-mode boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SEED_FETCH_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/seed-fetch-no-work-list-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, seed transport, endpoint\/fetch, disabled mode, empty blocklist, empty whitelist, content\/category, comment shortcut, and cross-feature rows in `js\/seed\.js`/);
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
  assert.match(doc, /matching search fetch parse\/stringify before empty-blocklist harvest-only/);
  assert.match(doc, /whitelist search `processData\(\)` behavior/);
  assert.match(doc, /disabled and missing-settings fetch body work without engine calls/);
  assert.match(doc, /desktop home harvest-only versus mobile home `processData\(\)` behavior/);
  assert.match(doc, /empty selected category work admission/);
  assert.match(doc, /append-comment synthetic end-marker bypass/);
  assert.match(doc, /reload-comment engine fallback/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /no-work\/list-mode contracts/);
  assert.match(doc, /work-decision reports/);
  assert.match(doc, /parse\/stringify budgets/);
  assert.match(doc, /disabled pass-through policies/);
  assert.match(doc, /missing-settings queue reports/);
  assert.match(doc, /harvest-only policies/);
  assert.match(doc, /mobile home policies/);
  assert.match(doc, /category selected policies/);
  assert.match(doc, /comment continuation policies/);
  assert.match(doc, /first-class seed fetch no-work\/list-mode authority gates/);
});

test('tracked_file_obligation_index_links_seed_xhr_no_work_list_mode_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Seed XHR no-work\/list-mode boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SEED_XHR_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/seed-xhr-no-work-list-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, seed transport, endpoint\/XHR, disabled mode, empty blocklist, empty whitelist, content\/category, hook\/listener, transport parity, and cross-feature rows in `js\/seed\.js`/);
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
  assert.match(doc, /search XHR mark\/hook\/body-work before empty-blocklist harvest-only/);
  assert.match(doc, /whitelist search XHR `processData\(\)` behavior/);
  assert.match(doc, /disabled and missing-settings XHR mark\/hook without body work/);
  assert.match(doc, /disabled page listener wrapping without body work/);
  assert.match(doc, /desktop and mobile home XHR `processData\(\)` behavior/);
  assert.match(doc, /empty selected category work admission/);
  assert.match(doc, /player\/next\/guide empty-blocklist `processData\(\)` behavior/);
  assert.match(doc, /fetch-vs-XHR home no-work divergence/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /no-work\/list-mode contracts/);
  assert.match(doc, /work-decision reports/);
  assert.match(doc, /hook budgets/);
  assert.match(doc, /listener-wrap budgets/);
  assert.match(doc, /body-work budgets/);
  assert.match(doc, /disabled no-work policies/);
  assert.match(doc, /missing-settings policies/);
  assert.match(doc, /endpoint-family policies/);
  assert.match(doc, /first-class seed XHR no-work\/list-mode authority gates/);
});

test('tracked_file_obligation_index_links_seed_initial_global_no_work_list_mode_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Seed initial global no-work\/list-mode boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SEED_INITIAL_GLOBAL_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22\.md/);
  assert.match(doc, /tests\/runtime\/seed-initial-global-no-work-list-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, seed transport, page-global hook, disabled mode, missing-settings queue, raw snapshot replay, player response, home\/search route, and cross-feature rows in `js\/seed\.js`/);
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
  assert.match(doc, /future setter debug-size stringify/);
  assert.match(doc, /search empty-blocklist harvest-only behavior/);
  assert.match(doc, /search whitelist `processData\(\)` behavior/);
  assert.match(doc, /disabled setter stringify without engine work/);
  assert.match(doc, /missing-settings queue replay with setter reentry/);
  assert.match(doc, /home `ytInitialData` `processData\(\)` behavior/);
  assert.match(doc, /`ytInitialPlayerResponse` `processData\(\)` behavior/);
  assert.match(doc, /existing-global queue\/raw snapshot\/setter replay behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /no-work\/list-mode contracts/);
  assert.match(doc, /work-decision reports/);
  assert.match(doc, /debug-size budgets/);
  assert.match(doc, /queue replay policies/);
  assert.match(doc, /raw snapshot policies/);
  assert.match(doc, /setter assignment guards/);
  assert.match(doc, /home policies/);
  assert.match(doc, /player-response policies/);
  assert.match(doc, /first-class seed initial global no-work\/list-mode authority gates/);
});

test('tracked_file_obligation_index_links_seed_settings_replay_provenance_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Seed settings replay provenance boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SEED_SETTINGS_REPLAY_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/seed-settings-replay-provenance-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open settings replay provenance, JSON-first, settings-mode, no-work, performance, reliability, false-hide\/leak, seed transport, page-global hook, content bridge, injector, StateManager, background relay, disabled mode, duplicate settings delivery, raw snapshot replay, and cross-feature rows in `js\/seed\.js`, `js\/content\/bridge_settings\.js`, `js\/injector\.js`, `js\/state_manager\.js`, and `js\/background\.js`/);
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
  assert.match(doc, /incoming settings object caching/);
  assert.match(doc, /first update queued-global drain plus setter reentry before raw snapshot replay/);
  assert.match(doc, /duplicate equivalent settings raw snapshot replay/);
  assert.match(doc, /public raw snapshot field replay/);
  assert.match(doc, /disabled raw replay setter stringify without engine calls/);
  assert.match(doc, /split StateManager\/background\/content-bridge\/injector relay ownership/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /provenance contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /revision reports/);
  assert.match(doc, /dirty-key policies/);
  assert.match(doc, /queue drain budgets/);
  assert.match(doc, /raw snapshot replay policies/);
  assert.match(doc, /setter reentry guards/);
  assert.match(doc, /relay owner reports/);
  assert.match(doc, /duplicate delivery policies/);
  assert.match(doc, /first-class seed settings replay authority gates/);
});

test('tracked_file_obligation_index_links_seed_page_global_patch_teardown_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Seed page-global patch teardown boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SEED_PAGE_GLOBAL_PATCH_TEARDOWN_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/seed-page-global-patch-teardown-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open runtime lifecycle, page-global patch teardown, JSON-first, no-work, performance, reliability, false-hide\/leak, seed transport, fetch patch, XHR prototype patch, initial-global accessor, response override, duplicate seed execution, and cross-feature rows in `js\/seed\.js`/);
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
  assert.match(doc, /initial seed load fetch\/XHR\/global accessor\/readiness\/global interface installation/);
  assert.match(doc, /ordinary duplicate seed load guard behavior/);
  assert.match(doc, /forced seed re-entry fetch rewrap behavior with XHR prototype stability/);
  assert.match(doc, /processed XHR per-instance response accessor lifetime without a removal owner/);
  assert.match(doc, /global interface no restore\/unpatch\/dispose\/destroy\/teardown\/clear owner behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /teardown contracts/);
  assert.match(doc, /owner reports/);
  assert.match(doc, /fetch idempotence reports/);
  assert.match(doc, /XHR idempotence reports/);
  assert.match(doc, /initial-global accessor owner reports/);
  assert.match(doc, /response accessor lifetime reports/);
  assert.match(doc, /restore policies/);
  assert.match(doc, /lifetime justifications/);
  assert.match(doc, /first-class seed page-global patch teardown authority gates/);
});

test('tracked_file_obligation_index_links_bridge_settings_listener_timer_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Bridge settings listener\/timer boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BRIDGE_SETTINGS_LISTENER_TIMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/bridge-settings-listener-timer-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open runtime observer\/listener\/timer, settings-mode, storage refresh, seed relay, subscription import, JSON-first no-work, performance, reliability, false-hide\/leak, content bridge, and cross-feature rows in `js\/content\/bridge_settings\.js`/);
  assert.match(doc, /1 bridge settings listener\/timer source file/);
  assert.match(doc, /71 waiter cluster block lines/);
  assert.match(doc, /2340 waiter cluster block bytes/);
  assert.match(doc, /43 subscription request block lines/);
  assert.match(doc, /1942 subscription request block bytes/);
  assert.match(doc, /53 subscription message listener block lines/);
  assert.match(doc, /2299 subscription message listener block bytes/);
  assert.match(doc, /122 runtime listener block lines/);
  assert.match(doc, /5701 runtime listener block bytes/);
  assert.match(doc, /201 seed relay cluster block lines/);
  assert.match(doc, /8139 seed relay cluster block bytes/);
  assert.match(doc, /131 storage refresh cluster block lines/);
  assert.match(doc, /4506 storage refresh cluster block bytes/);
  assert.match(doc, /3 storage listener registration block lines/);
  assert.match(doc, /96 storage listener registration block bytes/);
  assert.match(doc, /guarded message\/runtime listener setup/);
  assert.match(doc, /storage listener setup/);
  assert.match(doc, /readiness waiter timeout lifetime/);
  assert.match(doc, /repeated seed retry timer admission/);
  assert.match(doc, /recursive retry behavior/);
  assert.match(doc, /storage force-refresh and debounce behavior/);
  assert.match(doc, /5 storage admission executable continuation rows/);
  assert.match(doc, /lone `channelMap`, non-`local`, map-only, and mixed map-plus-keyword storage changes/);
  assert.match(doc, /subscription timeout clear\/rearm\/delete behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /listener\/timer contracts/);
  assert.match(doc, /seed retry budget reports/);
  assert.match(doc, /seed-ready listener owner reports/);
  assert.match(doc, /storage refresh decision reports/);
  assert.match(doc, /storage listener teardown reports/);
  assert.match(doc, /readiness timeout budgets/);
  assert.match(doc, /subscription request lifecycle reports/);
  assert.match(doc, /runtime message decision reports/);
  assert.match(doc, /first-class bridge settings listener\/timer authority gates/);
});

test('tracked_file_obligation_index_links_content_bridge_startup_timing_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content bridge startup timing boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_STARTUP_TIMING_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-startup-timing-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open runtime observer\/listener\/timer, startup injection, settings-mode, DOM fallback startup, JSON-first no-work, performance, reliability, false-hide\/leak, content bridge, and cross-feature rows in `js\/content\/bridge_injection\.js` and `js\/content_bridge\.js`/);
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
  assert.match(doc, /runtime content bridge startup timing fixtures: 10/);
  assert.match(doc, /Empty or disabled startup settings skip MAIN-world injection/);
  assert.match(doc, /explicit bridge identity requests still bypass the startup active-work gate/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /startup timing contracts/);
  assert.match(doc, /startup timer budget reports/);
  assert.match(doc, /injection settings replay reports/);
  assert.match(doc, /ready-message decision reports/);
  assert.match(doc, /initialize promise contracts/);
  assert.match(doc, /first DOM fallback policies/);
  assert.match(doc, /DOM fallback singleton reports/);
  assert.match(doc, /startup observer owner reports/);
  assert.match(doc, /first-class content bridge startup timing authority gates/);
});

test('tracked_file_obligation_index_links_background_script_injection_trust_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Background script injection trust boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BACKGROUND_SCRIPT_INJECTION_TRUST_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/background-script-injection-trust-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open message trust, manifest\/permission, startup injection, content bridge, settings-mode, JSON-first filter readiness, performance, reliability, false-hide\/leak, code-burden, and cross-feature rows in `js\/background\.js` and `js\/content\/bridge_injection\.js`/);
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
  assert.match(doc, /bridge-to-background `injectScripts` request behavior/);
  assert.match(doc, /sender-tab and sender-frame target derivation/);
  assert.match(doc, /early no-tab and no-scripting failure behavior/);
  assert.match(doc, /caller script trim and `js\/\*\.js` mapping behavior/);
  assert.match(doc, /empty file-list success without execution/);
  assert.match(doc, /MAIN-world asynchronous `executeScript`/);
  assert.match(doc, /unclassified path-shape mapping before browser loading/);
  assert.match(doc, /subscriptions bridge fixed isolated script list with caller-supplied tab id/);
  assert.match(doc, /absent trusted sender or script allowlist authority/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /trusted sender contracts/);
  assert.match(doc, /script allowlist reports/);
  assert.match(doc, /sender class reports/);
  assert.match(doc, /target scope reports/);
  assert.match(doc, /world policies/);
  assert.match(doc, /subscription bridge injection policies/);
  assert.match(doc, /scripting permission owner reports/);
  assert.match(doc, /web-accessible resource reason reports/);
  assert.match(doc, /first-class background script injection trust authority gates/);
});

test('tracked_file_obligation_index_links_content_bridge_main_world_message_dispatch_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content bridge main-world message dispatch boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_MAIN_WORLD_MESSAGE_DISPATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-main-world-message-dispatch-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open message trust, runtime listener, content bridge, settings refresh, learned identity, collaborator, storage\/cache, JSON-first filter readiness, performance, reliability, false-hide\/leak, code-burden, and cross-feature rows in `js\/content_bridge\.js`/);
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
  assert.match(doc, /same-window receiver admission behavior/);
  assert.match(doc, /exact 12-message branch inventory/);
  assert.match(doc, /readiness and refresh settings request behavior/);
  assert.match(doc, /forced DOM fallback reprocess behavior without pending ownership/);
  assert.match(doc, /learned map persistence and DOM rerun behavior/);
  assert.match(doc, /custom URL storage write behavior/);
  assert.match(doc, /pending response request-id correlation/);
  assert.match(doc, /subscription timeout rearm behavior/);
  assert.match(doc, /unsolicited collaborator cache\/dialog application with `force: true`/);
  assert.match(doc, /absent origin\/nonce\/sender capability gates/);
  assert.match(doc, /2026-05-28 content bridge message ingress executable continuation/);
  assert.match(doc, /message dispatch executable ingress rows: 5/);
  assert.match(doc, /message dispatch executable behavior changed: no/);
  assert.match(doc, /message dispatch executable approval: `NO-GO`/);
  assert.match(doc, /same-window self-source no-work proof/);
  assert.match(doc, /off-window no-work proof/);
  assert.match(doc, /non-`FilterTube_\*` no-work proof/);
  assert.match(doc, /readiness settings request proof/);
  assert.match(doc, /refresh forced DOM fallback proof/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /page-message sender policies/);
  assert.match(doc, /nonce reports/);
  assert.match(doc, /side-effect reports/);
  assert.match(doc, /refresh ownership reports/);
  assert.match(doc, /learned-map message policies/);
  assert.match(doc, /pending response correlation reports/);
  assert.match(doc, /unsolicited collaborator policies/);
  assert.match(doc, /first-class content bridge main-world dispatch authority gates/);
});

test('tracked_file_obligation_index_links_injector_main_world_message_dispatch_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Injector main-world message dispatch boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_INJECTOR_MAIN_WORLD_MESSAGE_DISPATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/injector-main-world-message-dispatch-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open message trust, runtime listener, injector\/main-world bridge, settings relay, subscription import, learned identity lookup, collaborator cache, JSON-first filter readiness, network\/fetch, performance, reliability, false-hide\/leak, code-burden, and cross-feature rows in `js\/injector\.js`/);
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
  assert.match(doc, /subscription listener pre-duplicate-run installation behavior/);
  assert.match(doc, /idempotent installed-flag behavior/);
  assert.match(doc, /subscription import dispatch to `fetchSubscribedChannelsFromYoutubei\(\)`/);
  assert.match(doc, /wildcard subscription response behavior/);
  assert.match(doc, /caller settings payload merge and queue drain behavior/);
  assert.match(doc, /collaborator cache mutation from `filter_logic`/);
  assert.match(doc, /wildcard collaborator\/channel response behavior/);
  assert.match(doc, /absent origin\/nonce\/capability\/revision gates/);
  assert.match(doc, /2026-05-28 injector message ingress executable continuation/);
  assert.match(doc, /injector dispatch executable ingress rows: 8/);
  assert.match(doc, /injector dispatch executable behavior changed: no/);
  assert.match(doc, /injector dispatch executable approval: `NO-GO`/);
  assert.match(doc, /duplicate install no-listener-growth proof/);
  assert.match(doc, /subscription wrong-source no-work proof/);
  assert.match(doc, /subscription content_bridge fetch-and-wildcard-response proof/);
  assert.match(doc, /settings wrong-source no-work proof/);
  assert.match(doc, /settings content_bridge seed-update-and-queue-drain proof/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /page-message sender policies/);
  assert.match(doc, /settings revision reports/);
  assert.match(doc, /subscription import dispatch policies/);
  assert.match(doc, /action-token reports/);
  assert.match(doc, /collaborator cache message policies/);
  assert.match(doc, /lookup request correlation reports/);
  assert.match(doc, /first-class injector main-world dispatch authority gates/);
});

test('tracked_file_obligation_index_links_ignored_whitelist_bundle_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Ignored whitelist bundle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_IGNORED_WHITELIST_BUNDLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/ignored-whitelist-bundle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open source\/evidence, ignored corpus, whitelist optimization scope, release\/package exclusion, runtime listener\/timer\/observer inventory, storage\/message trust, performance, reliability, false-hide\/leak, code-burden, and cross-feature rows involving ignored root evidence files `WHITELIST_background\.js` and `WHITELIST_content\.JS`/);
  assert.match(doc, /2 ignored whitelist bundle files/);
  assert.match(doc, /`WHITELIST_background\.js` at 32472 lines and 1700002 bytes/);
  assert.match(doc, /`WHITELIST_content\.JS` at 9302 lines and 674344 bytes/);
  assert.match(doc, /2 ignored git-status entries/);
  assert.match(doc, /2 `git check-ignore -v` mappings/);
  assert.match(doc, /selected storage\/runtime\/downloads\/tabs\/observer\/selector\/listener\/timer\/fetch\/postMessage\/marker token counts/);
  assert.match(doc, /7 active release-surface files with zero exact bundle-name or `WhitelistVideo` references/);
  assert.match(doc, /0 tracked product-source bundle references/);
  assert.match(doc, /0 current dist bundle copies/);
  assert.match(doc, /both bundles are ignored root evidence and untracked release source/);
  assert.match(doc, /active release surfaces do not reference them/);
  assert.match(doc, /current dist output does not package them/);
  assert.match(doc, /whitelist optimization must not use ignored historical bundle behavior as active JSON-first runtime behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /release-exclusion reports/);
  assert.match(doc, /extraction decisions/);
  assert.match(doc, /lifecycle budgets/);
  assert.match(doc, /message\/storage reports/);
  assert.match(doc, /current-runtime parity reports/);
  assert.match(doc, /optimization input policies/);
  assert.match(doc, /deletion-readiness artifacts/);
  assert.match(doc, /first-class ignored whitelist bundle authority gates/);
});

test('tracked_file_obligation_index_links_ignored_local_planning_text_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Ignored local planning text boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_IGNORED_LOCAL_PLANNING_TEXT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/ignored-local-planning-text-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open source\/evidence, ignored corpus, whitelist optimization scope, release\/package exclusion, tracked-doc claim, first-class JSON filtering, runtime listener\/timer\/observer inventory, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows involving ignored local planning\/text artifacts/);
  assert.match(doc, /7 ignored local planning\/text artifacts/);
  assert.match(doc, /7 ignored git-status entries/);
  assert.match(doc, /7 `git check-ignore -v` mappings/);
  assert.match(doc, /line\/byte\/SHA-256 fingerprints for `docs\/MOBILE_APP_UI_SPEC\.md`, `docs\/spa-collab-watchlist-handoff\.md`, `docs\/subscribed-channels-whitelist-import-plan\.md`, `cher\.md`, `import_channels\.txt`, `extracted_watch_paths\.txt`, and `YTM-LOGS\.txt`/);
  assert.match(doc, /selected JSON-adjacent, whitelist, endpoint, selector, observer, listener, and timer token counts/);
  assert.match(doc, /zero active release-surface path references/);
  assert.match(doc, /zero current dist copies/);
  assert.match(doc, /7 runtime ignored local planning text boundary fixtures/);
  assert.match(doc, /all seven artifacts are ignored local evidence and untracked release source/);
  assert.match(doc, /active release surfaces do not reference them/);
  assert.match(doc, /current dist output does not package them/);
  assert.match(doc, /whitelist optimization must not treat raw planning\/import\/log text as active first-class JSON filtering behavior/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /release-exclusion reports/);
  assert.match(doc, /extraction decisions/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /optimization input policies/);
  assert.match(doc, /doc claim gates/);
  assert.match(doc, /package boundary reports/);
  assert.match(doc, /current-runtime parity reports/);
  assert.match(doc, /deletion-readiness artifacts/);
  assert.match(doc, /first-class ignored local planning text authority gates/);
});

test('tracked_file_obligation_index_links_background_auto_backup_scheduler_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Background auto-backup scheduler boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BACKGROUND_AUTO_BACKUP_SCHEDULER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/background-auto-backup-scheduler-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open runtime timer\/listener, message trust, backup\/export, storage\/cache, profile\/list mutation side-effect, post-block enrichment, download\/rotation, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/background\.js`, `js\/state_manager\.js`, `js\/content_bridge\.js`, `js\/tab-view\.js`, and `js\/io_manager\.js`/);
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
  assert.match(doc, /background schedule action accepts caller trigger\/options and finite delay without trusted-sender\/session\/allowlist\/clamp proof/);
  assert.match(doc, /timer scheduling coalesces to the latest pending trigger\/options/);
  assert.match(doc, /channel-added triggers can wait for post-block enrichment/);
  assert.match(doc, /encrypted auto-backup can skip with `missing_session_pin`/);
  assert.match(doc, /backup scheduling remains split across runtime and dashboard owners/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /trigger policies/);
  assert.match(doc, /sender policies/);
  assert.match(doc, /delay-clamp reports/);
  assert.match(doc, /timer lifecycle reports/);
  assert.match(doc, /post-block wait budgets/);
  assert.match(doc, /encryption skip reports/);
  assert.match(doc, /download\/rotation reports/);
  assert.match(doc, /split-owner reports/);
  assert.match(doc, /first-class background auto-backup scheduler authority gates/);
});

test('tracked_file_obligation_index_links_native_overlay_fullscreen_quiet_mode_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Native overlay\/fullscreen quiet mode boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_NATIVE_OVERLAY_FULLSCREEN_QUIET_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/native-overlay-fullscreen-quiet-mode-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open runtime observer\/listener\/timer, native overlay\/fullscreen quiet mode, whitelist optimization scope, JSON-first no-work, DOM fallback, quick-block, fallback menu, prompt overlay, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/content_bridge\.js`, `js\/content\/block_channel\.js`, `js\/content\/dom_fallback\.js`, `js\/seed\.js`, `js\/content\/bridge_settings\.js`, `js\/content\/first_run_prompt\.js`, and `js\/content\/release_notes_prompt\.js`/);
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
  assert.match(doc, /content-bridge predicate recognizes two native window flags and two document attributes/);
  assert.match(doc, /content-bridge DOM fallback, whitelist pending refresh, fallback menu rescans, and fallback menu warmups use local quiet checks after installation/);
  assert.match(doc, /quick-block setup installs styles and page-level listeners before action checks/);
  assert.match(doc, /quick-block action state uses `showQuickBlockButton === true` plus `listMode !== 'whitelist'`/);
  assert.match(doc, /selected DOM fallback, seed, bridge settings, first-run prompt, and release-notes prompt files do not consume native quiet predicate\/attribute tokens/);
  assert.match(doc, /prompt overlays can render without local fullscreen\/native-overlay suppression/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /shared quiet-state contracts/);
  assert.match(doc, /per-owner consumer reports/);
  assert.match(doc, /fullscreen non-player pause contracts/);
  assert.match(doc, /quick-block pause reports/);
  assert.match(doc, /DOM fallback pause reports/);
  assert.match(doc, /seed no-work budgets/);
  assert.match(doc, /prompt overlay policies/);
  assert.match(doc, /timer\/listener\/observer pause budgets/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /first-class native overlay\/fullscreen quiet mode authority gates/);
});

test('tracked_file_obligation_index_links_background_identity_fetch_network_budget_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Background identity fetch network budget boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BACKGROUND_IDENTITY_FETCH_NETWORK_BUDGET_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/background-identity-fetch-network-budget-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open network\/fetch authority, background message trust, identity repair, whitelist optimization scope, JSON-first readiness, DOM unresolved-handle escalation, cache\/pending behavior, credentials, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/background\.js`, `js\/content_bridge\.js`, `js\/content\/handle_resolver\.js`, and `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /sender policies/);
  assert.match(doc, /reason reports/);
  assert.match(doc, /route\/profile reports/);
  assert.match(doc, /credential policies/);
  assert.match(doc, /cache-budget reports/);
  assert.match(doc, /active-rule gates/);
  assert.match(doc, /direct fallback policies/);
  assert.match(doc, /DOM escalation reports/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /first-class background identity fetch network budget authority gates/);
});

test('tracked_file_obligation_index_links_content_direct_identity_fallback_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content direct identity fallback side-effect boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_DIRECT_IDENTITY_FALLBACK_SIDE_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-direct-identity-fallback-side-effect-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open network\/fetch authority, identity resolver, whitelist optimization scope, JSON-first readiness, clicked-target retry, DOM unresolved-handle repair, learned-map update, same-origin credentials, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/content_bridge\.js`, `js\/content\/handle_resolver\.js`, and `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /fetch policies/);
  assert.match(doc, /user-action reports/);
  assert.match(doc, /credential policies/);
  assert.match(doc, /DOM repair budgets/);
  assert.match(doc, /direct-fetch gates/);
  assert.match(doc, /map-write reports/);
  assert.match(doc, /rerun budgets/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /first-class content direct identity fallback authority gates/);
});

test('tracked_file_obligation_index_links_settings_refresh_cross_context_consumer_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Settings refresh cross-context consumer boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_SETTINGS_REFRESH_CROSS_CONTEXT_CONSUMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/settings-refresh-cross-context-consumer-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open settings-mode, storage\/cache, message trust, runtime listener\/timer, content bridge, injector\/main-world, seed replay, JSON-first readiness, DOM fallback, whitelist optimization scope, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/background\.js`, `js\/content\/bridge_settings\.js`, `js\/content_bridge\.js`, `js\/injector\.js`, `js\/seed\.js`, `js\/content\/dom_fallback\.js`, and `js\/filter_logic\.js`/);
  assert.match(doc, /7 settings refresh cross-context consumer source files/);
  assert.match(doc, /13 source\/effect blocks/);
  assert.match(doc, /28 background ApplySettings branch lines/);
  assert.match(doc, /1487 background ApplySettings bytes/);
  assert.match(doc, /41 background storage invalidation lines/);
  assert.match(doc, /1464 background storage invalidation bytes/);
  assert.match(doc, /121 bridge runtime listener lines/);
  assert.match(doc, /5701 bridge runtime listener bytes/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /consumer contracts/);
  assert.match(doc, /revision policies/);
  assert.match(doc, /dirty-key reports/);
  assert.match(doc, /DOM fallback budgets/);
  assert.match(doc, /seed replay budgets/);
  assert.match(doc, /main-world capability gates/);
  assert.match(doc, /profile scope reports/);
  assert.match(doc, /no-op refresh decisions/);
  assert.match(doc, /first-class settings refresh cross-context consumer authority gates/);
});

test('tracked_file_obligation_index_links_compiled_settings_profile_list_mode_assembly_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Compiled settings profile\/list-mode assembly boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_COMPILED_SETTINGS_PROFILE_LIST_MODE_ASSEMBLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/compiled-settings-profile-list-mode-assembly-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open compiled-settings, settings-mode, profile\/viewing-space, whitelist optimization scope, JSON-first readiness, Kids\/main host handling, sync-Kids-to-main behavior, bridge normalization, filter-logic consumer parity, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/background\.js`, `js\/content\/bridge_settings\.js`, and `js\/filter_logic\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /compiler contracts/);
  assert.match(doc, /profile scope policies/);
  assert.match(doc, /revision policies/);
  assert.match(doc, /whitelist assembly reports/);
  assert.match(doc, /Kids empty-whitelist policies/);
  assert.match(doc, /bridge normalization reports/);
  assert.match(doc, /filter consumer parity/);
  assert.match(doc, /fixture provenance/);
  assert.match(doc, /first-class compiled settings profile\/list-mode authority gates/);
});

test('tracked_file_obligation_index_links_dom_fallback_run_state_visibility_cleanup_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /DOM fallback run-state visibility cleanup boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_DOM_FALLBACK_RUN_STATE_VISIBILITY_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/dom-fallback-run-state-visibility-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open content-runtime-js, DOM fallback, DOM helper, DOM selector, runtime listener\/timer, hide\/restore, stale visibility, scroll preservation, whitelist optimization scope, JSON-first readiness, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/content\/dom_helpers\.js` and `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /helper visibility toggles write and restore hidden class\/attribute\/inline-display markers/);
  assert.match(doc, /recycled hidden rows without explicit reason markers restore when live and processed ids diverge/);
  assert.match(doc, /disabled\/empty blocklist is no-work while exact whitelist and active lists\/toggles\/filters are work/);
  assert.match(doc, /stale cleanup restores hidden\/pending nodes and clears content-control CSS/);
  assert.match(doc, /apply fallback serializes overlapping runs and schedules a pending rerun from finally/);
  assert.match(doc, /scroll restoration is guarded by one scroll listener plus recent user-scroll checks/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /run-state contracts/);
  assert.match(doc, /stale marker cleanup policies/);
  assert.match(doc, /scroll budgets/);
  assert.match(doc, /active-work decision reports/);
  assert.match(doc, /visibility ownership reports/);
  assert.match(doc, /selector budgets/);
  assert.match(doc, /first-class DOM fallback run-state visibility cleanup authority gates/);
});

test('tracked_file_obligation_index_links_content_bridge_whitelist_pending_refresh_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content bridge whitelist pending refresh boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_WHITELIST_PENDING_REFRESH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-whitelist-pending-refresh-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open content-runtime-js, content bridge, DOM fallback, whitelist pending placeholders, runtime observer\/listener\/timer, DOM selector, route exclusion, scroll-preserving rerun, whitelist optimization scope, JSON-first readiness, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/content_bridge\.js` and `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /refresh contracts/);
  assert.match(doc, /queue budgets/);
  assert.match(doc, /placeholder policies/);
  assert.match(doc, /observer\/timer owner reports/);
  assert.match(doc, /route exclusion policies/);
  assert.match(doc, /focused-rerun parity/);
  assert.match(doc, /first-class content bridge whitelist pending refresh authority gates/);
  assert.match(doc, /Whitelist Pending Intake No-Work Contract Addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WHITELIST_PENDING_INTAKE_NO_WORK_CONTRACT_CURRENT_BEHAVIOR_2026-05-25\.md/);
  assert.match(doc, /tests\/runtime\/whitelist-pending-intake-no-work-contract-current-behavior\.test\.mjs/);
  assert.match(doc, /12\s+whitelist pending\s+intake no-work contract rows/);
  assert.match(doc, /10 release whitelist-pending\s+intake gate rows\s+covered/);
  assert.match(doc, /9 runtime content bridge whitelist pending refresh\s+fixtures covered/);
  assert.match(doc, /narrow implementation-ready whitelist pending intake rows: 1/);
  assert.match(doc, /runtime whitelist\s+pending intake authority symbols: 0/);
  assert.match(doc, /runtime\s+whitelist pending intake patch now: GO/);
  assert.match(doc, /runtime whitelist optimization\s+patch now: NO-GO/);
  assert.match(doc, /Whitelist Pending Intake Implementation Readiness Gate Addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WHITELIST_PENDING_INTAKE_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-25\.md/);
  assert.match(doc, /14 whitelist pending\s+intake implementation readiness rows/);
  assert.match(doc, /8 source inputs covered/);
  assert.match(doc, /10 required\s+future no-work fixture names covered/);
  assert.match(doc, /0\s+implemented runtime authority symbols/);
  assert.match(doc, /release patch approval: NO-GO/);
  assert.match(doc, /prepare narrow whitelist pending-intake implementation patch: GO/);
  assert.match(doc, /runtime\s+whitelist pending intake patch in this audit slice: GO/);
  assert.match(doc, /Whitelist Pending Intake Patch Source Locus Boundary Addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_WHITELIST_PENDING_INTAKE_PATCH_SOURCE_LOCUS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25\.md/);
  assert.match(doc, /12 whitelist pending intake\s+patch source-locus rows/);
  assert.match(doc, /1 allowed runtime source file family/);
  assert.match(doc, /`js\/content_bridge\.js` as the only allowed runtime file/);
  assert.match(doc, /4 read-only parity\s+runtime source loci/);
  assert.match(doc, /8 forbidden runtime source families/);
  assert.match(doc, /narrow semantic-change approval rows: 1/);
  assert.match(doc, /patch\s+source locus approval: GO/);
});

test('tracked_file_obligation_index_links_quick_block_hover_lifecycle_timer_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Quick-block hover lifecycle timer boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_QUICK_BLOCK_HOVER_LIFECYCLE_TIMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/quick-block-hover-lifecycle-timer-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open content-runtime-js, quick-block, runtime observer\/listener\/timer, DOM selector, hover\/sticky UI, fallback action rerun, whitelist optimization scope, native overlay\/fullscreen quiet mode, DOM fallback, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/content\/block_channel\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /hover lifecycle contracts/);
  assert.match(doc, /timer budgets/);
  assert.match(doc, /observer owner reports/);
  assert.match(doc, /route sweep budgets/);
  assert.match(doc, /viewport RAF budgets/);
  assert.match(doc, /hover sticky policies/);
  assert.match(doc, /teardown registries/);
  assert.match(doc, /fallback rerun budgets/);
  assert.match(doc, /first-class quick-block lifecycle authority gates/);
});

test('tracked_file_obligation_index_links_menu_observer_kids_passive_lifecycle_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Menu observer Kids passive lifecycle boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_MENU_OBSERVER_KIDS_PASSIVE_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/menu-observer-kids-passive-lifecycle-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open content-runtime-js, normal menu observer, YouTube Kids passive native-block listener, runtime observer\/listener\/timer, DOM selector, dropdown state, pending fetch cancellation, whitelist-mode menu quietness, route identity stamping, background message shape, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/content\/block_channel\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /menu lifecycle contracts/);
  assert.match(doc, /observer owner reports/);
  assert.match(doc, /pending-fetch cancellation policies/);
  assert.match(doc, /injected-state reports/);
  assert.match(doc, /Kids passive lifecycle contracts/);
  assert.match(doc, /Kids dedupe budgets/);
  assert.match(doc, /Kids block message authority/);
  assert.match(doc, /teardown registries/);
  assert.match(doc, /first-class menu observer lifecycle authority gates/);
  assert.match(doc, /2026-05-28 menu bounded-discovery executable continuation/);
  assert.match(doc, /2500 ms dropdown discovery shutdown timer/);
  assert.match(doc, /no-helper outside-pointer Escape fallback/);
  assert.match(doc, /native dropdown discovery stop executable rows:\s+1/);
  assert.match(doc, /native dropdown escape fallback executable rows:\s+1/);
  assert.match(doc, /native dropdown executable continuation behavior changed:\s+no/);
  assert.match(doc, /native dropdown executable continuation approval:\s+`NO-GO`/);
  assert.match(doc, /route\/surface authority, outside-pointer policy, close-helper simplification,\s+fixture provenance, and metric artifacts/);
});

test('tracked_file_obligation_index_links_content_bridge_menu_injection_action_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content bridge menu injection action boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_MENU_INJECTION_ACTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-menu-injection-action-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open content-runtime-js, content bridge menu injection, 3-dot block action, pending dropdown fetches, collaborator enrichment, optimistic hide\/restore, direct channel mutation, backup scheduling, settings refresh, DOM fallback rerun, post-action enrichment, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/content_bridge\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /content bridge menu action contracts/);
  assert.match(doc, /pending dropdown fetch policies/);
  assert.match(doc, /optimistic hide reports/);
  assert.match(doc, /mutation fanout budgets/);
  assert.match(doc, /DOM fallback budgets/);
  assert.match(doc, /backup scheduling policies/);
  assert.match(doc, /identity enrichment policies/);
  assert.match(doc, /first-class content bridge menu action gates/);
});

test('tracked_file_obligation_index_links_content_bridge_collaborator_enrichment_retry_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content bridge collaborator enrichment retry boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_ENRICHMENT_RETRY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-collaborator-enrichment-retry-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open content-runtime-js, collaborator enrichment, pending dialog-card state, retry timers, main-world lookup options, resolved collaborator application, active menu refresh, playlist fallback refresh, forced DOM fallback rerun, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/content_bridge\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /collaborator enrichment contracts/);
  assert.match(doc, /retry policies/);
  assert.match(doc, /pending-card reports/);
  assert.match(doc, /lookup option policies/);
  assert.match(doc, /application reports/);
  assert.match(doc, /DOM fallback budgets/);
  assert.match(doc, /menu refresh reports/);
  assert.match(doc, /first-class collaborator enrichment gates/);
});

test('tracked_file_obligation_index_links_content_bridge_collaborator_metadata_extraction_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content bridge collaborator metadata extraction side-effect boundary addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_METADATA_EXTRACTION_SIDE_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-collaborator-metadata-extraction-side-effect-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open content-runtime-js, collaborator metadata extraction, renderer JSON path handling, DOM selector handling, video-id stamping, collaborator cache attrs, resolved collaborator application, enrichment opt-in, reliability, performance, false-hide\/leak, code-burden, JSON-first, and cross-feature rows in `js\/content_bridge\.js`/);
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
  assert.match(doc, /showSheet filter authority boundaries/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /collaborator metadata extraction contracts/);
  assert.match(doc, /extraction decisions/);
  assert.match(doc, /side-effect reports/);
  assert.match(doc, /pure-read extraction/);
  assert.match(doc, /renderer JSON path policies/);
  assert.match(doc, /DOM selector policies/);
  assert.match(doc, /enrichment opt-in policies/);
  assert.match(doc, /first-class collaborator extraction gates/);
});

test('tracked_file_obligation_index_links_ytm_show_sheet_enrichment_handoff_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /YTM showSheet enrichment handoff addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_YTM_SHOW_SHEET_ENRICHMENT_HANDOFF_CURRENT_BEHAVIOR_2026-05-24\.md/);
  assert.match(doc, /tests\/runtime\/ytm-show-sheet-enrichment-handoff-current-behavior\.test\.mjs/);
  assert.match(doc, /open content-runtime-js, injector-js, filter-logic-js, YTM collaborator, JSON-first whitelist optimization/);
  assert.match(doc, /3 source files/);
  assert.match(doc, /reduced YTM showSheet fixture/);
  assert.match(doc, /bridge partial expected name `Shakira`/);
  assert.match(doc, /bridge expected count `3`/);
  assert.match(doc, /bridge roster fallback flag `false`/);
  assert.match(doc, /injector roster fallback flag `true`/);
  assert.match(doc, /injector fuzzy match from `Shakira` to `shakiraVEVO`/);
  assert.match(doc, /full Shakira\/Spotify\/Beele snapshot recovery from `lastYtNextResponse`/);
  assert.match(doc, /zero `showSheetCommand` tokens in `js\/filter_logic\.js`/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /enrichment handoff contracts/);
  assert.match(doc, /lookup option reports/);
  assert.match(doc, /injector matcher reports/);
  assert.match(doc, /filter authority boundaries/);
  assert.match(doc, /side-effect\/no-work budgets/);
  assert.match(doc, /first-class YTM showSheet filter gates/);
});

test('tracked_file_obligation_index_links_content_bridge_collaborator_identity_promotion_handoff_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content bridge collaborator identity promotion handoff addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_IDENTITY_PROMOTION_HANDOFF_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-collaborator-identity-promotion-handoff-current-behavior\.test\.mjs/);
  assert.match(doc, /open content-runtime-js, collaborator identity promotion, watch\/YTM warmup, collaboration DOM signal classification, channel-info normalization, `extractChannelFromCard\(\)` handoff, resolved-cache preference, collaborator cache writes, reliability, performance, false-hide\/leak, code-burden, JSON-first, and cross-feature rows in `js\/content_bridge\.js`/);
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
  assert.match(doc, /10 runtime collaborator identity promotion fixtures/);
  assert.match(doc, /watch-like warmup parses two-name bylines but skips Mix cards/);
  assert.match(doc, /YTM promotion calls collaborator extraction and returns collaboration-shaped identity with incomplete-roster enrichment needs/);
  assert.match(doc, /generic promotion prefers richer resolved-cache data over weaker extraction/);
  assert.match(doc, /normalization merges existing, resolved-cache, and avatar-stack rosters/);
  assert.match(doc, /can inflate expected count from overlapping raw roster inputs/);
  assert.match(doc, /Mix promotion\/normalization clears collaborator metadata while keeping base identity/);
  assert.match(doc, /2026-05-28 topic stale collaborator state continuation/);
  assert.match(doc, /same-video cached collaborator attrs or resolved collaborator cache state/);
  assert.match(doc, /topic stale collaborator state rows: 5/);
  assert.match(doc, /topic stale ampersand-topic guard rows: 4/);
  assert.match(doc, /topic stale action-layer trust rows: 0/);
  assert.match(doc, /topic stale installed-tab parity status: MISSING/);
  assert.match(doc, /topic stale collaborator state risk: GATED_FOR_NAME_ONLY_AMPERSAND_TOPIC/);
  assert.match(doc, /runtime behavior changed by this addendum: yes/);
  assert.match(doc, /2026-05-28 collaborator cache provenance readiness continuation/);
  assert.match(doc, /cache provenance and invalidation source gap/);
  assert.match(doc, /collaborator cache provenance readiness rows: 7/);
  assert.match(doc, /collaborator cache ampersand-topic guard rows: 1/);
  assert.match(doc, /collaborator cache source-label write-only rows: 2/);
  assert.match(doc, /collaborator cache stale-delete no-op rows: 1/);
  assert.match(doc, /collaborator cache provenance validation rows: 1/);
  assert.match(doc, /collaborator cache runtime behavior changed: yes/);
  assert.match(doc, /collaborator cache provenance risk: PARTIAL/);
  assert.match(doc, /ASCII collaborator cache provenance diagram: present/);
  assert.match(doc, /Mermaid collaborator cache provenance diagram: present/);
  assert.match(doc, /2026-05-30 Topic writer-path source census continuation/);
  assert.match(doc, /tracked `js\/content_bridge\.js`, `js\/content\/block_channel\.js`, `js\/filter_logic\.js`, `js\/injector\.js`, and `js\/content\/dom_extractors\.js` obligations open/);
  assert.match(doc, /known current-source writer and non-writer boundaries for `Kully B & Gussy G - Topic`/);
  assert.match(doc, /Topic writer-path source census rows: 9/);
  assert.match(doc, /DOM collaborator attr writer rows covered: 6/);
  assert.match(doc, /resolved-map writer rows covered: 5/);
  assert.match(doc, /entrypoint funnel rows covered: 3/);
  assert.match(doc, /known content_bridge DOM attr writer coverage: PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY/);
  assert.match(doc, /uncovered writer-path proof from source census: PARTIAL_SOURCE_CENSUS/);
  assert.match(doc, /installed reloaded-tab byte trace: MISSING/);
  assert.match(doc, /runtime behavior changed by writer-path census addendum: no/);
  assert.match(doc, /menu-layer grammar fix approval: NO-GO/);
  assert.match(doc, /2026-05-30 ampersand Topic root-cause boundary continuation/);
  assert.match(doc, /false `Kully B & Gussy G - Topic` menu symptom from the classifier cause/);
  assert.match(doc, /Block All collaborator menu requires upstream collaborator-shaped state/);
  assert.match(doc, /ampersand Topic root-cause rows: 5/);
  assert.match(doc, /menu root-cause status: DOWNSTREAM_RENDERER_NOT_CLASSIFIER/);
  assert.match(doc, /current source fresh parser status: NO_PLAIN_AMPERSAND_SPLIT/);
  assert.match(doc, /current source stale name-only roster status: REJECTED_FOR_VISIBLE_TOPIC_LABEL/);
  assert.match(doc, /true collaborator preservation status: STRONGER_EVIDENCE_STILL_ADMITTED/);
  assert.match(doc, /runtime behavior changed by root-cause addendum: no/);
  assert.match(doc, /2026-05-30 installed Chrome DOM evidence boundary continuation/);
  assert.match(doc, /connected-profile installed-DOM evidence without claiming source-byte parity/);
  assert.match(doc, /sampled URL `https:\/\/www\.youtube\.com\/watch\?v=aJOTlE1K90k`/);
  assert.match(doc, /installed Chrome FilterTube stamped nodes observed: 301/);
  assert.match(doc, /installed Chrome processed card attrs observed: 235/);
  assert.match(doc, /installed Chrome hidden attrs observed: 20/);
  assert.match(doc, /installed Chrome collaborator attrs observed in sampled tab: 0/);
  assert.match(doc, /installed Chrome source resource probe: BLOCKED_BY_BROWSER_POLICY/);
  assert.match(doc, /installed Chrome extension activity status: OBSERVED_DOM_STAMPS/);
  assert.match(doc, /installed Chrome source byte parity status: NOT_PROVED/);
  assert.match(doc, /runtime behavior changed by installed Chrome DOM evidence addendum: no/);
  assert.match(doc, /This does not close installed source byte parity, the `Kully B & Gussy G - Topic` live negative fixture/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /collaborator identity promotion contracts/);
  assert.match(doc, /promotion decisions/);
  assert.match(doc, /side-effect reports/);
  assert.match(doc, /pure-read promotion policies/);
  assert.match(doc, /caller policies/);
  assert.match(doc, /route-scope reports/);
  assert.match(doc, /cache-write reports/);
  assert.match(doc, /first-class collaborator promotion gates/);
});

test('tracked_file_obligation_index_links_content_bridge_collaborator_main_world_merge_mutation_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content bridge collaborator main-world merge mutation addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_MAIN_WORLD_MERGE_MUTATION_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-collaborator-main-world-merge-mutation-current-behavior\.test\.mjs/);
  assert.match(doc, /open content-runtime-js, collaborator main-world merge, in-place roster mutation, primary identity mutation, lookup option construction, document video-id targeting, menu enrichment handoff, reliability, performance, false-hide\/leak, code-burden, JSON-first, and cross-feature rows in `js\/content_bridge\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /collaborator main-world merge contracts/);
  assert.match(doc, /merge decisions/);
  assert.match(doc, /mutation reports/);
  assert.match(doc, /lookup policies/);
  assert.match(doc, /primary identity policies/);
  assert.match(doc, /conflict policies/);
  assert.match(doc, /caller budgets/);
  assert.match(doc, /first-class collaborator merge gates/);
});

test('tracked_file_obligation_index_links_content_bridge_menu_blocked_state_list_shape_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content bridge menu blocked-state list-shape addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_MENU_BLOCKED_STATE_LIST_SHAPE_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-menu-blocked-state-list-shape-current-behavior\.test\.mjs/);
  assert.match(doc, /open content-runtime-js, menu blocked-state, stored-entry lookup, already-blocked row state, filter-all hydration, blocked-element refresh sync, whitelist\/list-mode interaction, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/content_bridge\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /menu blocked-state contracts/);
  assert.match(doc, /list target policies/);
  assert.match(doc, /whitelist\/list-mode reports/);
  assert.match(doc, /profile target reports/);
  assert.match(doc, /blocked-element sync reports/);
  assert.match(doc, /restore policies/);
  assert.match(doc, /filter-all state policies/);
  assert.match(doc, /first-class menu blocked-state gates/);
});

test('tracked_file_obligation_index_links_content_bridge_menu_action_list_target_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Content bridge menu action list-target addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_CONTENT_BRIDGE_MENU_ACTION_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/content-bridge-menu-action-list-target-current-behavior\.test\.mjs/);
  assert.match(doc, /open content-runtime-js, menu action list targets, primary dropdown gating, attached interaction delegation, fallback popover mutation, direct background add messages, filter-all payloads, backup scheduling, optimistic hide\/restore, DOM fallback rerun, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/content_bridge\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /menu action list-target contracts/);
  assert.match(doc, /action decisions/);
  assert.match(doc, /profile target reports/);
  assert.match(doc, /fallback mutation gates/);
  assert.match(doc, /fallback list-mode policies/);
  assert.match(doc, /direct-add list-target reports/);
  assert.match(doc, /whitelist bypass reports/);
  assert.match(doc, /optimistic-hide budgets/);
  assert.match(doc, /mutation fanout metrics/);
  assert.match(doc, /first-class menu action list-target gates/);
});

test('tracked_file_obligation_index_links_background_add_filtered_channel_list_target_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Background addFilteredChannel list-target addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_BACKGROUND_ADD_FILTERED_CHANNEL_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/background-add-filtered-channel-list-target-current-behavior\.test\.mjs/);
  assert.match(doc, /open background-runtime-js, addFilteredChannel receiver, helper list target, profile\/list storage, list-type forwarding, sender\/session policy, identity repair, channel-map writes, V4\/V3\/root storage writes, compiled-cache invalidation, backup scheduling, Kids refresh, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/background\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /background addFilteredChannel list-target contracts/);
  assert.match(doc, /receiver reports/);
  assert.match(doc, /sender policies/);
  assert.match(doc, /list-type forwarding policies/);
  assert.match(doc, /profile target reports/);
  assert.match(doc, /storage-write reports/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /backup policies/);
  assert.match(doc, /identity-repair budgets/);
  assert.match(doc, /first-class background addFilteredChannel gates/);
});

test('tracked_file_obligation_index_links_filter_all_toggle_list_target_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Filter All toggle list-target addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_FILTER_ALL_TOGGLE_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/filter-all-toggle-list-target-current-behavior\.test\.mjs/);
  assert.match(doc, /open background-runtime-js, content-runtime-js, state-manager-js, Filter All toggle list targets, content bridge checkbox payload, secondary background toggle receiver, root `filterChannels` mutation, active V4 Main mirror, StateManager Main\/Kids mode gates, sender\/session policy, storage\/cache invalidation, backup scheduling, listener notification, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/background\.js`, `js\/content_bridge\.js`, and `js\/state_manager\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /Filter All toggle list-target contracts/);
  assert.match(doc, /receiver reports/);
  assert.match(doc, /sender policies/);
  assert.match(doc, /list-target policies/);
  assert.match(doc, /profile target reports/);
  assert.match(doc, /storage-write reports/);
  assert.match(doc, /cache invalidation reports/);
  assert.match(doc, /row-action parity reports/);
  assert.match(doc, /comment-scope reports/);
  assert.match(doc, /first-class Filter All toggle gates/);
});

test('tracked_file_obligation_index_links_main_filter_all_comments_scope_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Main Filter All comments scope addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_MAIN_FILTER_ALL_COMMENTS_SCOPE_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/main-filter-all-comments-scope-current-behavior\.test\.mjs/);
  assert.match(doc, /open state-manager-js, render-engine-js, background-runtime-js, shared-settings-js, filter-logic-js, Main channel-derived Filter All comments scope, Main comment row actions, StateManager `filterAllComments` mutation, inactive Filter All row behavior, whitelist-mode write-silence, shared\/background compiler parity, JSON comment keyword provenance, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/state_manager\.js`, `js\/render_engine\.js`, `js\/background\.js`, `js\/settings_shared\.js`, and `js\/filter_logic\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /Main Filter All comments scope contracts/);
  assert.match(doc, /toggle mutation reports/);
  assert.match(doc, /list-mode policies/);
  assert.match(doc, /channel-ref policies/);
  assert.match(doc, /compiler parity reports/);
  assert.match(doc, /JSON comment provenance reports/);
  assert.match(doc, /inactive-row policies/);
  assert.match(doc, /first-class Main Filter All comments scope gates/);
});

test('tracked_file_obligation_index_links_add_filtered_channel_filter_all_comments_default_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /addFilteredChannel Filter All comments default addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_ADD_FILTERED_CHANNEL_FILTER_ALL_COMMENTS_DEFAULT_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/add-filtered-channel-filter-all-comments-default-current-behavior\.test\.mjs/);
  assert.match(doc, /open content-runtime-js, background-runtime-js, state-manager-js, shared-settings-js, content direct-add payloads, secondary background addFilteredChannel receiver behavior, helper signature, new\/existing channel row comments defaults, background\/shared compiler defaults, StateManager enrichment messages, backup triggers, JSON comment provenance, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/content_bridge\.js`, `js\/background\.js`, `js\/state_manager\.js`, and `js\/settings_shared\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /addFilteredChannel Filter All comments default contracts/);
  assert.match(doc, /default comments policies/);
  assert.match(doc, /existing-row merge reports/);
  assert.match(doc, /JSON comment provenance reports/);
  assert.match(doc, /first-class addFilteredChannel Filter All comments default gates/);
});

test('tracked_file_obligation_index_links_json_comment_keyword_provenance_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON comment keyword provenance addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_KEYWORD_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-keyword-provenance-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open filter-logic-js, shared-settings-js, background-runtime-js, JSON comment keyword provenance, channel-derived Filter All keyword compilation, comments-scope metadata loss, serialized comments keyword reconstruction, global-before-comment keyword precedence, background\/shared compiler parity, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/filter_logic\.js`, `js\/settings_shared\.js`, and `js\/background\.js`/);
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
  assert.match(doc, /218 filter_logic candidate metadata\/search lines/);
  assert.match(doc, /10724 candidate metadata\/search bytes/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /JSON comment keyword provenance contracts/);
  assert.match(doc, /global precedence reports/);
  assert.match(doc, /channel-scope policies/);
  assert.match(doc, /compiled metadata reports/);
  assert.match(doc, /serialized reconstruction reports/);
  assert.match(doc, /decision-order reports/);
  assert.match(doc, /false-hide budgets/);
  assert.match(doc, /first-class JSON comment keyword provenance gates/);
});

test('tracked_file_obligation_index_links_json_comment_author_channel_provenance_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON comment author channel provenance addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_AUTHOR_CHANNEL_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-author-channel-provenance-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open filter-logic-js, shared-settings-js, background-runtime-js, JSON comment author channel provenance, commentRenderer author identity paths, filterChannels normalization, whitelist comment bypass, global channel branch, comment author branch, filterAllComments policy, dormant whitelist-mode block rows, background\/shared channel compiler parity, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/filter_logic\.js`, `js\/settings_shared\.js`, and `js\/background\.js`/);
  assert.match(doc, /3 JSON comment author channel provenance source files/);
  assert.match(doc, /8 source\/effect blocks/);
  assert.match(doc, /5 filter_logic comment renderer rules lines/);
  assert.match(doc, /229 comment renderer rules bytes/);
  assert.match(doc, /17 filterChannels normalization lines/);
  assert.match(doc, /1026 normalization bytes/);
  assert.match(doc, /45 shouldBlock setup lines/);
  assert.match(doc, /2191 setup bytes/);
  assert.match(doc, /110 whitelist comment bypass lines/);
  assert.match(doc, /5535 bypass bytes/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /JSON comment author channel provenance contracts/);
  assert.match(doc, /filterAllComments policies/);
  assert.match(doc, /global branch reports/);
  assert.match(doc, /whitelist-mode reports/);
  assert.match(doc, /compiled metadata reports/);
  assert.match(doc, /decision-order reports/);
  assert.match(doc, /false-hide budgets/);
  assert.match(doc, /first-class JSON comment author channel gates/);
});

test('tracked_file_obligation_index_links_json_comment_view_model_parity_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON comment ViewModel parity addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_VIEW_MODEL_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-view-model-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open filter-logic-js, seed-runtime-js, dom-fallback-js, JSON comment ViewModel parity, modern comment renderer inventory, no-rule return behavior, hideAllComments direct modern comment shape, comments-only keyword parity, global keyword parity, continuation shortcut renderer detection, DOM fallback ViewModel selector parity, global hide branch behavior, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, and `js\/content\/dom_fallback\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /JSON comment ViewModel parity contracts/);
  assert.match(doc, /renderer-rule reports/);
  assert.match(doc, /JSON decision reports/);
  assert.match(doc, /continuation policies/);
  assert.match(doc, /DOM parity reports/);
  assert.match(doc, /global-hide policies/);
  assert.match(doc, /keyword policies/);
  assert.match(doc, /structural wrapper reports/);
  assert.match(doc, /false-hide\/leak budgets/);
  assert.match(doc, /first-class JSON comment ViewModel gates/);
});

test('tracked_file_obligation_index_links_json_comment_structural_wrapper_cleanup_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON comment structural wrapper cleanup addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_STRUCTURAL_WRAPPER_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-structural-wrapper-cleanup-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open filter-logic-js, seed-runtime-js, dom-fallback-js, JSON comment structural wrapper cleanup, recursive renderer removal, empty parent wrapper retention, itemSectionRenderer comment sections, continuation action wrapper retention, seed engine-error fallback splicing, DOM comment selector parity, sibling preservation, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, and `js\/content\/dom_fallback\.js`/);
  assert.match(doc, /3 JSON comment structural wrapper cleanup source files/);
  assert.match(doc, /10 source\/effect blocks/);
  assert.match(doc, /10 filter_logic whitelist containers lines/);
  assert.match(doc, /267 whitelist container bytes/);
  assert.match(doc, /9 filter_logic comment rules lines/);
  assert.match(doc, /380 comment rules bytes/);
  assert.match(doc, /34 comment decision lines/);
  assert.match(doc, /1947 comment decision bytes/);
  assert.match(doc, /20 array recursion lines/);
  assert.match(doc, /726 array recursion bytes/);
  assert.match(doc, /11 object renderer removal lines/);
  assert.match(doc, /536 object removal bytes/);
  assert.match(doc, /18 recursive property copy lines/);
  assert.match(doc, /743 property copy bytes/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /JSON comment structural cleanup contracts/);
  assert.match(doc, /wrapper decision reports/);
  assert.match(doc, /empty-wrapper pruning policies/);
  assert.match(doc, /section sibling policies/);
  assert.match(doc, /continuation wrapper cleanup reports/);
  assert.match(doc, /seed fallback parity reports/);
  assert.match(doc, /DOM structural parity reports/);
  assert.match(doc, /false-hide\/leak budgets/);
  assert.match(doc, /first-class JSON comment structural cleanup gates/);
});

test('tracked_file_obligation_index_links_xhr_comment_continuation_parity_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /XHR comment continuation parity addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_XHR_COMMENT_CONTINUATION_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/xhr-comment-continuation-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open seed-runtime-js, filter-logic-js, XHR comment continuation parity, fetch-only synthetic end behavior, XHR response override body modes, `\/youtubei\/v1\/next` transport parity, modern comment ViewModel handling, reload\/replace\/actions command parity, disabled-mode hook work, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/seed\.js` and `js\/filter_logic\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /XHR comment continuation parity contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /transport parity reports/);
  assert.match(doc, /synthetic-end policies/);
  assert.match(doc, /engine-bypass reports/);
  assert.match(doc, /body-mode reports/);
  assert.match(doc, /ViewModel parity reports/);
  assert.match(doc, /command parity reports/);
  assert.match(doc, /first-class XHR comment continuation parity gates/);
});

test('tracked_file_obligation_index_links_json_comment_entity_payload_provenance_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON comment entity payload provenance addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_ENTITY_PAYLOAD_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-entity-payload-provenance-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open filter-logic-js, seed-runtime-js, comment entity payload provenance, reduced Main append-continuation fixture evidence, `frameworkUpdates\.entityBatchUpdate\.commentEntityPayload` text and author identity, visible shell\/entity join behavior, global\/comment keyword misses, author channel misses, hide-all entity retention, fetch shortcut entity retention, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/filter_logic\.js`, `js\/seed\.js`, and `tests\/runtime\/fixtures\/captures\/main-comment-append-entity-response\.json`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /JSON comment entity payload provenance contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /rule manifests/);
  assert.match(doc, /text extraction policies/);
  assert.match(doc, /author extraction policies/);
  assert.match(doc, /join policies/);
  assert.match(doc, /cleanup policies/);
  assert.match(doc, /fetch shortcut policies/);
  assert.match(doc, /first-class JSON comment entity payload gates/);
});

test('tracked_file_obligation_index_links_json_comment_continuation_sibling_preservation_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON comment continuation sibling preservation addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_CONTINUATION_SIBLING_PRESERVATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-continuation-sibling-preservation-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open seed-runtime-js, filter-logic-js, mixed comment continuation sibling preservation, fetch shortcut collection replacement, engine array-recursion sibling retention, header\/control sibling preservation, video sibling preservation, original continuation item overwrite, metadata preservation, comment keyword contrast, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/seed\.js` and `js\/filter_logic\.js`/);
  assert.match(doc, /2 JSON comment continuation sibling preservation source files/);
  assert.match(doc, /6 source\/effect blocks/);
  assert.match(doc, /38 seed fetch comment shortcut lines/);
  assert.match(doc, /2266 shortcut bytes/);
  assert.match(doc, /7 seed fetch normal processing lines/);
  assert.match(doc, /417 normal-processing bytes/);
  assert.match(doc, /20 filter_logic array recursion lines/);
  assert.match(doc, /726 array recursion bytes/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /JSON comment continuation sibling preservation contracts/);
  assert.match(doc, /decision reports/);
  assert.match(doc, /mixed collection policies/);
  assert.match(doc, /header preservation policies/);
  assert.match(doc, /video sibling policies/);
  assert.match(doc, /endpoint preservation policies/);
  assert.match(doc, /fetch replacement reports/);
  assert.match(doc, /engine parity reports/);
  assert.match(doc, /first-class JSON comment continuation sibling preservation gates/);
});

test('tracked_file_obligation_index_links_json_comment_continuation_collection_root_parity_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON comment continuation collection-root parity addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_CONTINUATION_COLLECTION_ROOT_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-continuation-collection-root-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open seed-runtime-js, filter-logic-js, JSON comment continuation collection-root parity, endpoint\/action\/command root handling, fetch shortcut bypass, mixed-root leak behavior, action-root cleanup, command-root cleanup, root precedence, spread-metadata preservation, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/seed\.js` and `js\/filter_logic\.js`/);
  assert.match(doc, /2 JSON comment continuation collection-root parity source files/);
  assert.match(doc, /5 source\/effect blocks/);
  assert.match(doc, /38 seed fetch comment shortcut lines/);
  assert.match(doc, /2266 shortcut bytes/);
  assert.match(doc, /7 seed fetch normal processing lines/);
  assert.match(doc, /417 normal-processing bytes/);
  assert.match(doc, /20 filter_logic array recursion lines/);
  assert.match(doc, /726 array recursion bytes/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /JSON comment continuation collection-root parity contracts/);
  assert.match(doc, /action-root policies/);
  assert.match(doc, /command-root policies/);
  assert.match(doc, /root precedence policies/);
  assert.match(doc, /cross-root cleanup policies/);
  assert.match(doc, /mixed-root leak budgets/);
  assert.match(doc, /engine-bypass reports/);
  assert.match(doc, /first-class JSON comment continuation collection-root parity gates/);
});

test('tracked_file_obligation_index_links_json_comment_continuation_command_shape_parity_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON comment continuation command-shape parity addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_CONTINUATION_COMMAND_SHAPE_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-continuation-command-shape-parity-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open seed-runtime-js, filter-logic-js, JSON comment continuation command-shape parity, append\/reload\/replace command handling, append shortcut bypass, reload cleanup, replace cleanup, mixed-command cleanup, non-comment command sibling loss, layout continuation-key drift, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows in `js\/seed\.js` and `js\/filter_logic\.js`/);
  assert.match(doc, /2 JSON comment continuation command-shape parity source files/);
  assert.match(doc, /5 source\/effect blocks/);
  assert.match(doc, /38 seed fetch comment shortcut lines/);
  assert.match(doc, /2266 shortcut bytes/);
  assert.match(doc, /7 seed fetch normal processing lines/);
  assert.match(doc, /417 normal-processing bytes/);
  assert.match(doc, /20 filter_logic array recursion lines/);
  assert.match(doc, /726 array recursion bytes/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /JSON comment continuation command-shape parity contracts/);
  assert.match(doc, /append command policies/);
  assert.match(doc, /reload command policies/);
  assert.match(doc, /replace command policies/);
  assert.match(doc, /mixed-command cleanup policies/);
  assert.match(doc, /non-comment command sibling policies/);
  assert.match(doc, /command engine-bypass reports/);
  assert.match(doc, /first-class JSON comment continuation command-shape parity gates/);
});

test('tracked_file_obligation_index_links_json_comment_continuation_raw_url_admission_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /JSON comment continuation raw-URL admission addendum/);
  assert.match(doc, /docs\/audit\/FILTERTUBE_JSON_COMMENT_CONTINUATION_RAW_URL_ADMISSION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23\.md/);
  assert.match(doc, /tests\/runtime\/json-comment-continuation-raw-url-admission-boundary-current-behavior\.test\.mjs/);
  assert.match(doc, /open seed-runtime-js, JSON comment continuation raw URL admission, parsed endpoint policy, query\/hash\/longer-path endpoint text, cross-origin endpoint text, Request object behavior, URL object catch fallback, shortcut false-hide\/leak, pass-through behavior, reliability, performance, code-burden, and cross-feature rows in `js\/seed\.js`/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /JSON comment continuation raw-URL admission contracts/);
  assert.match(doc, /parsed endpoint decisions/);
  assert.match(doc, /raw URL decision reports/);
  assert.match(doc, /query endpoint policies/);
  assert.match(doc, /hash endpoint policies/);
  assert.match(doc, /longer-path policies/);
  assert.match(doc, /cross-origin policies/);
  assert.match(doc, /URL object policies/);
  assert.match(doc, /first-class JSON comment continuation raw-URL admission gates/);
});

test('tracked_file_obligation_index_links_kids_latest_json_owner_extension_fixture_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Kids latest JSON owner-extension fixture addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_KIDS_LATEST_JSON_OWNER_EXTENSION_FIXTURE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/kids-latest-json-owner-extension-fixture-boundary-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/kids-latest-compact-video-owner-extension.json'));
  assert.match(doc, /open raw capture, YouTube Kids JSON, filter-logic-js, JSON path, settings-mode, whitelist\/list-mode, blocklist\/list-mode, identity, map side-effect, reliability, performance, false-hide\/leak, code-burden, and cross-feature rows/);
  assert.match(doc, /in `yt_kids_latest\.json`, `js\/filter_logic\.js`, and the reduced Kids capture fixture/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /Kids JSON owner-extension contracts/);
  assert.match(doc, /compact-video owner decision reports/);
  assert.match(doc, /owner-extension harvest reports/);
  assert.match(doc, /sibling preservation fixtures/);
  assert.match(doc, /whitelist decision policies/);
  assert.match(doc, /video-channel map side-effect reports/);
  assert.match(doc, /first-class Kids JSON owner-extension gates/);
});

test('tracked_file_obligation_index_links_kids_browse_malformed_fragment_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Kids browse malformed fragment addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_KIDS_BROWSE_MALFORMED_FRAGMENT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/kids-browse-malformed-fragment-boundary-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/kids-browse-malformed-fragment-compact-video.json'));
  assert.match(doc, /open raw capture, malformed direct-JSON container, YouTube Kids JSON, filter-logic-js, JSON path, settings-mode, whitelist\/list-mode, blocklist\/list-mode, owner rail/);
  assert.match(doc, /in `ytkids_browse\?alt=json\.json`, `js\/filter_logic\.js`, and the reduced Kids browse capture fixture/);
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
  assert.match(doc, /queues three `FilterTube_UpdateChannelMap` messages and one `FilterTube_UpdateVideoChannelMap` message/);
  assert.match(doc, /moves `ytkids_browse\?alt=json\.json` to partial-extracted while preserving the malformed direct-JSON warning/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /Kids browse raw-container contracts/);
  assert.match(doc, /fragment extraction policies/);
  assert.match(doc, /compact-video decision reports/);
  assert.match(doc, /owner-rail decision reports/);
  assert.match(doc, /owner-rail whitelist policies/);
  assert.match(doc, /video-map side-effect reports/);
  assert.match(doc, /first-class Kids browse malformed-fragment gates/);
});

test('tracked_file_obligation_index_links_main_watch_get_watch_fixture_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Main watch get-watch playlist\/end-screen addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_MAIN_WATCH_GET_WATCH_PLAYLIST_END_SCREEN_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/main-watch-get-watch-playlist-end-screen-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/main-watch-get-watch-playlist-end-screen.json'));
  assert.match(doc, /open raw capture, Main watch\/next JSON, filter-logic-js, JSON path, settings-mode, blocklist\/list-mode, whitelist\/list-mode, playlist-panel, end-screen/);
  assert.match(doc, /in `get_watch\?prettyPrint=false\.json`, `watchpage\.json`, `js\/filter_logic\.js`, and the reduced watch fixture/);
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
  assert.match(doc, /queues one `FilterTube_UpdateChannelMap` message and one `FilterTube_UpdateVideoChannelMap` message/);
  assert.match(doc, /moves `get_watch\?prettyPrint=false\.json` to partial-extracted while `watchpage\.json` remains a separate embedded-container obligation/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /DOM wall/);
  assert.match(doc, /compact autoplay/);
  assert.match(doc, /direct watch-card/);
  assert.match(doc, /selected playlist shell/);
  assert.match(doc, /route-scoped no-work/);
});

test('tracked_file_obligation_index_links_main_upnext_watchpage3_fixture_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Main upnext feed watchpage3 autoplay previous\/end-screen addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_MAIN_UPNEXT_FEED_WATCHPAGE3_AUTOPLAY_PREVIOUS_END_SCREEN_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/main-upnext-feed-watchpage3-autoplay-previous-end-screen-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/main-upnext-feed-watchpage3-autoplay-previous-end-screen.json'));
  assert.match(doc, /open raw-capture, embedded `ytInitialData`, Main watch JSON path, autoplay endpoint, previous-button endpoint, player-overlay end-screen/);
  assert.match(doc, /in `YT_MAIN_UPNEXT_FEED_WATCHPAGE3\.json`, `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content_bridge\.js`, `js\/content\/dom_fallback\.js`, `js\/content\/dom_extractors\.js`, and the reduced watchpage3 fixture/);
  assert.match(doc, /56516 lines/);
  assert.match(doc, /6000015 bytes/);
  assert.match(doc, /assignment span `23\.\.5942993`/);
  assert.match(doc, /5945215 embedded bytes/);
  assert.match(doc, /2 `previousButtonVideo` tokens/);
  assert.match(doc, /0 `compactAutoplayRenderer` tokens/);
  assert.match(doc, /29 raw `playlistPanelVideoRenderer` tokens/);
  assert.match(doc, /12 raw `endScreenVideoRenderer` tokens/);
  assert.match(doc, /28 parsed playlist-panel keys/);
  assert.match(doc, /11 parsed end-screen keys/);
  assert.match(doc, /no-rule processing preserves the embedded response and queues five supported-row video-map side effects/);
  assert.match(doc, /endpoint-only autoplay\/next\/previous has no map side effects/);
  assert.match(doc, /whitelist nonmatch removes supported rows while endpoint watch controls remain/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /player-overlay\/playlist\/endpoint parity/);
  assert.match(doc, /\/player` metadata-only proof/);
  assert.match(doc, /first-class watchpage3 endpoint authority gates/);
});

test('tracked_file_obligation_index_links_main_upnext_watchpage_lockup_fixture_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Main upnext feed watchpage lockup continuation addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_MAIN_UPNEXT_FEED_WATCHPAGE_LOCKUP_CONTINUATION_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/main-upnext-feed-watchpage-lockup-continuation-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/main-upnext-feed-watchpage-lockup-continuation.json'));
  assert.match(doc, /open raw-capture, balanced fragment admission, Main watch JSON path, watch-next-feed continuation, lockupViewModel/);
  assert.match(doc, /in `YT_MAIN_UPNEXT_FEED_WATCHPAGE\.json`, `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content_bridge\.js`, `js\/content\/dom_fallback\.js`, `js\/content\/dom_extractors\.js`, and the reduced watchpage lockup fixture/);
  assert.match(doc, /19918 lines/);
  assert.match(doc, /852491 bytes/);
  assert.match(doc, /direct raw JSON parse failure/);
  assert.match(doc, /watch-next fragment start line 139/);
  assert.match(doc, /840530 watch-next fragment bytes/);
  assert.match(doc, /targetId `watch-next-feed`/);
  assert.match(doc, /20 parsed `lockupViewModel` keys/);
  assert.match(doc, /0 `compactAutoplayRenderer`, 0 `endScreenVideoRenderer`, and 0 `playlistPanelVideoRenderer` keys/);
  assert.match(doc, /no-rule processing preserves the video lockup and Mix sibling/);
  assert.match(doc, /Mix display metadata is keyword-searchable but not creator-channel identity/);
  assert.match(doc, /whitelist channel allow preserves the matching video lockup and removes the unresolved Mix sibling/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /YT_MAIN_UPNEXT_FEED_WATCHPAGE2\.json/);
  assert.match(doc, /watch-rail scaffold proof/);
  assert.match(doc, /first-class watchpage lockup authority gates/);
});

test('tracked_file_obligation_index_links_main_upnext_watchpage2_claim_prefaced_fixture_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Main upnext feed watchpage2 claim-prefaced lockup continuation addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_MAIN_UPNEXT_FEED_WATCHPAGE2_CLAIM_PREFACED_LOCKUP_CONTINUATION_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation.json'));
  assert.match(doc, /open raw-capture, claim-prefaced raw admission, Main watch JSON path, watch-next-feed continuation, lockupViewModel, collaborator claim boundary/);
  assert.match(doc, /in `YT_MAIN_UPNEXT_FEED_WATCHPAGE2\.json`, `js\/filter_logic\.js`, `js\/seed\.js`, `js\/content_bridge\.js`, `js\/content\/dom_fallback\.js`, `js\/content\/dom_extractors\.js`, and the reduced watchpage2 fixture/);
  assert.match(doc, /20079 lines/);
  assert.match(doc, /863854 bytes/);
  assert.match(doc, /direct raw JSON parse failure/);
  assert.match(doc, /fragment start line 63/);
  assert.match(doc, /857711 fragment bytes/);
  assert.match(doc, /targetId `watch-next-feed`/);
  assert.match(doc, /20 parsed `lockupViewModel` keys/);
  assert.match(doc, /3 parsed `shortsLockupViewModel` keys/);
  assert.match(doc, /0 `compactAutoplayRenderer`, 0 `autoplayVideo`, 0 `nextButtonVideo`, 0 `previousButtonVideo`, 0 `endScreenVideoRenderer`, 0 `playlistPanelVideoRenderer`/);
  assert.match(doc, /0 parsed `showDialogCommand`, 0 parsed `coAuthors`, 0 parsed `ownerText`, and 0 parsed `bylineText` keys/);
  assert.match(doc, /raw collaborator prose tokens are not parsed collaborator roster proof/);
  assert.match(doc, /no-rule processing preserves two video lockups while queuing two channel-map messages and one video-map payload/);
  assert.match(doc, /whitelist channel allow preserves only the matching row/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /parsed collaborator roster proof/);
  assert.match(doc, /first-class watchpage2 authority gates/);
});

test('tracked_file_obligation_index_links_main_search_universal_watch_card_fixture_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Main search universal watch-card addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_MAIN_SEARCH_UNIVERSAL_WATCH_CARD_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/main-search-universal-watch-card-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/main-search-universal-watch-card-renderer.json'));
  assert.match(doc, /open raw capture, Main search JSON, escaped `ytInitialData` admission, filter-logic-js, JSON path, settings-mode, blocklist\/list-mode, whitelist\/list-mode, watch-card wrapper/);
  assert.match(doc, /in `strange_ytInitialData\.json`, `js\/filter_logic\.js`, and the reduced search hero fixture/);
  assert.match(doc, /3 source\/fixture files/);
  assert.match(doc, /`strange_ytInitialData\.json` as a non-direct-JSON escaped `var ytInitialData` string literal/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /direct child renderer policy/);
  assert.match(doc, /hero-video path policy/);
  assert.match(doc, /search refinement sibling policy/);
  assert.match(doc, /compact channel policy/);
  assert.match(doc, /first-class Main search watch-card gates/);
});

test('tracked_file_obligation_index_links_main_search_compact_channel_fixture_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Main search compact channel addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_MAIN_SEARCH_COMPACT_CHANNEL_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/main-search-compact-channel-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/main-search-compact-channel-renderer.json'));
  assert.match(doc, /open raw capture, Main search JSON, escaped `ytInitialData` admission, filter-logic-js, JSON path, settings-mode, blocklist\/list-mode, whitelist\/list-mode, compact channel renderer/);
  assert.match(doc, /in `strange_ytInitialData\.json`, `js\/filter_logic\.js`, and the reduced search channel fixture/);
  assert.match(doc, /3 source\/fixture files/);
  assert.match(doc, /`strange_ytInitialData\.json` as a non-direct-JSON escaped `var ytInitialData` string literal/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /direct rule policy/);
  assert.match(doc, /whitelist decision policy/);
  assert.match(doc, /channel-map side-effect policy/);
  assert.match(doc, /sibling leak policy/);
  assert.match(doc, /first-class Main search compact-channel gates/);
});

test('tracked_file_obligation_index_links_DOMs_html_classification_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /DOMs\.html mutated Main DOM classification addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_DOMS_HTML_MUTATED_MAIN_DOM_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/doms-html-mutated-main-dom-classification-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/main-doms-mutated-main-dom.html'));
  assert.match(doc, /open raw capture, DOM selector, quick-block, fallback menu, captured mutation state, post\/community fixture readiness/);
  assert.match(doc, /in `DOMs\.html` and the reduced mixed-Main DOM fixture/);
  assert.match(doc, /3 source\/fixture files/);
  assert.match(doc, /raw `DOMs\.html` sha256 `1e36cfc6bdf9272f1febe54445646ea26c482d4346114727a363cee8cf042c5e`/);
  assert.match(doc, /6759 raw lines/);
  assert.match(doc, /11 pinned raw headings/);
  assert.match(doc, /10 FilterTube mutation markers/);
  assert.match(doc, /8 absent post\/community tokens/);
  assert.match(doc, /one reduced mixed-Main DOM fixture/);
  assert.match(doc, /5 runtime DOMs\.html classification fixtures/);
  assert.match(doc, /`DOMs\.html` is a mixed already-mutated Main DOM snapshot/);
  assert.match(doc, /carries quick-block\/fallback-menu\/processed\/card identity markers before any clean no-rule interpretation/);
  assert.match(doc, /lacks clean post\/backstage\/header\/action-menu\/permalink tokens/);
  assert.match(doc, /raw capture indexing moves `DOMs\.html` to partial-extracted while leaving clean Main post\/community proof unfulfilled/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /clean Main post\/community DOM fixtures/);
  assert.match(doc, /native action-menu insertion proof/);
  assert.match(doc, /negative sibling-visible proof/);
  assert.match(doc, /first-class DOMs\.html classification gates/);
});

test('tracked_file_obligation_index_links_watchpage_embedded_postRenderer_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /Watchpage embedded postRenderer addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_WATCHPAGE_EMBEDDED_POST_RENDERER_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/watchpage-embedded-post-renderer-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/main-watchpage-embedded-post-renderer.json'));
  assert.match(doc, /open raw capture, modern post JSON, JSON path, settings-mode, blocklist\/list-mode, whitelist\/list-mode, channel-map side effect/);
  assert.match(doc, /in `watchpage\.json`, `js\/filter_logic\.js`, and the reduced embedded post fixture/);
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
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /postRenderer rule decisions/);
  assert.match(doc, /sharedPostRenderer decisions/);
  assert.match(doc, /DOM action-menu insertion fixtures/);
  assert.match(doc, /first-class watchpage embedded postRenderer gates/);
});

test('tracked_file_obligation_index_links_ytm_browse_channel_list_item_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /YTM browse channelListItemRenderer addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_YTM_BROWSE_CHANNEL_LIST_ITEM_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/ytm-browse-channel-list-item-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/ytm-browse-channel-list-item-renderer.json'));
  assert.match(doc, /open raw capture, YouTube Music browse JSON, channel-list renderer paths/);
  assert.match(doc, /in `ytm_browse\?prettyPrint=false\.json`, `js\/filter_logic\.js`, and the reduced YTM browse fixture/);
  assert.match(doc, /52334 lines/);
  assert.match(doc, /3005515 bytes/);
  assert.match(doc, /SHA-256 `4444c7dcb6b6a884846a19169bed286f1019cd7275a6d1292392b1c1de95bdf8`/);
  assert.match(doc, /direct JSON object shape/);
  assert.match(doc, /route `browse FEchannels`/);
  assert.match(doc, /root path `contents\.singleColumnBrowseResultsRenderer\.tabs\.0\.tabRenderer\.content\.sectionListRenderer\.contents\.0\.shelfRenderer\.content\.verticalListRenderer\.items`/);
  assert.match(doc, /983 parsed `channelListItemRenderer` rows/);
  assert.match(doc, /984 raw `channelListItemRenderer` tokens/);
  assert.match(doc, /984 parsed `browseEndpoint` keys/);
  assert.match(doc, /one shelf\/vertical-list root/);
  assert.match(doc, /two adjacent reduced channel rows/);
  assert.match(doc, /one 160-line reduced fixture/);
  assert.match(doc, /no-rule processing preserves both rows while queuing two `FilterTube_UpdateChannelMap` messages/);
  assert.match(doc, /matching keyword and channel blocklist rules preserve the rows/);
  assert.match(doc, /whitelist match and nonmatch modes preserve the rows/);
  assert.match(doc, /no direct `channelListItemRenderer` filter rule today/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /direct decision policy/);
  assert.match(doc, /whitelist decision policy/);
  assert.match(doc, /channel-map side-effect permission/);
  assert.match(doc, /disabled\/no-work browse budget/);
  assert.match(doc, /negative sibling-visible proof/);
  assert.match(doc, /video\/playlist browse guardrails/);
  assert.match(doc, /first-class YTM browse channel-list gates/);
});

test('tracked_file_obligation_index_links_ytm_watch_player_dom_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /YTM watch\/player DOM addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_DOM_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/ytm-watch-player-dom-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/ytm-watch-player-dom.html'));
  assert.match(doc, /open raw capture, YouTube Music watch\/player DOM, DOM selector, selected playlist-row policy/);
  assert.match(doc, /in `YTM-WATCH PLAYER\.html`, `js\/content\/dom_fallback\.js`, `js\/content_bridge\.js`, `js\/filter_logic\.js`, and the reduced YTM watch\/player fixture/);
  assert.match(doc, /16412 logical lines/);
  assert.match(doc, /16411 newline count/);
  assert.match(doc, /2279232 bytes/);
  assert.match(doc, /SHA-256 `d0600cc4b7bb5684b532f825d689d32a5c7b24b37c6da6477d0f4dc637303ea3`/);
  assert.match(doc, /rendered mobile watch\/player DOM after FilterTube mutation/);
  assert.match(doc, /2 `html5-video-player` tokens/);
  assert.match(doc, /4 `movie_player` tokens/);
  assert.match(doc, /1 `ytm-watch-player-controls` token/);
  assert.match(doc, /25 `ytm-playlist-panel-video-renderer` rows/);
  assert.match(doc, /30 `ytm-video-with-context-renderer` rows/);
  assert.match(doc, /70 quick-block buttons/);
  assert.match(doc, /one 175-line reduced fixture/);
  assert.match(doc, /preserves the player shell, one hidden related row, one selected hidden playlist row/);
  assert.match(doc, /raw selected-row markup carries `aria-selected=true`, `filtertube-hidden`, confirmed block markers/);
  assert.match(doc, /broad `ytm-playlist-panel-renderer` CSS/);
  assert.match(doc, /selected-row skip\/click logic/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /settings-mode pass-through/);
  assert.match(doc, /whitelist selected\/current-row behavior/);
  assert.match(doc, /no-playback side-effect proof/);
  assert.match(doc, /observer\/timer budget/);
  assert.match(doc, /JSON\/DOM parity/);
  assert.match(doc, /first-class YTM watch\/player DOM gates/);
});

test('tracked_file_obligation_index_links_ytm_selected_current_row_side_effect_boundary_without_closing_rows', () => {
  const doc = read(docPath);

  assert.match(doc, /YTM selected\/current-row side-effect boundary addendum/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_SELECTED_ROW_SIDE_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'));
  assert.ok(doc.includes('tests/runtime/ytm-watch-player-selected-row-side-effect-boundary-current-behavior.test.mjs'));
  assert.ok(doc.includes('tests/runtime/fixtures/captures/ytm-watch-player-dom.html'));
  assert.match(doc, /open YouTube Music watch\/player DOM, selected playlist-row policy, no-playback side-effect/);
  assert.match(doc, /in `YTM-WATCH PLAYER\.html`, `js\/content\/dom_fallback\.js`, and the reduced YTM watch\/player fixture/);
  assert.match(doc, /8 `aria-selected=true` tokens/);
  assert.match(doc, /5 `data-filtertube-hidden=true` tokens/);
  assert.match(doc, /1 confirmed block-state token/);
  assert.match(doc, /1 `html5-main-video` token/);
  assert.match(doc, /selected row as video `NLDFEkIvcbc`, channel `UCfg5XmOVjJ4yoeE0XkqmGAQ`/);
  assert.match(doc, /visible sibling `75NRE2KB8jc`/);
  assert.match(doc, /hidden sibling `BRycGIKZzpQ`/);
  assert.match(doc, /selected-row detection includes YTM playlist rows and `aria-selected=true`/);
  assert.match(doc, /current-watch owner block can pause media, hide the selected row with `skipStats`, click alternate playlist links/);
  assert.match(doc, /manual next\/previous, autoplay-ended, selected-row scan, and hidden-selected-row retry paths are separate side-effect owners/);
  assert.match(doc, /This does not close those rows/);
  assert.match(doc, /selected-row playback policy/);
  assert.match(doc, /no-playback side-effect reports/);
  assert.match(doc, /playlist-skip decision reports/);
  assert.match(doc, /selected-row mode matrix/);
  assert.match(doc, /autoplay guard budgets/);
  assert.match(doc, /synthetic navigation budgets/);
  assert.match(doc, /collapsed panel budgets/);
  assert.match(doc, /restore reports/);
  assert.match(doc, /first-class YTM selected-row side-effect gates/);
  assert.match(doc, /Full Runtime Freshness Closure Continuation/);
  assert.match(doc, /2026-05-30 full runtime freshness closure continuation/);
  assert.ok(doc.includes('docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md'));
  assert.ok(doc.includes('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md'));
  assert.ok(doc.includes('docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_METHOD_SEMANTIC_REGISTER_2026-05-21.md'));
  assert.ok(doc.includes('docs/audit/FILTERTUBE_SOURCE_OF_TRUTH_CLAIM_REGISTER_2026-05-20.md'));
  assert.match(doc, /tracked-file context for current runtime proof freshness and audit-document\s+drift repair without closing any tracked file row/);
  assert.match(doc, /initial full runtime rerun at\s+4665\/4667 pass with 2 audit freshness failures/);
  assert.match(doc, /focused drift repair proof at\s+10\/10 pass/);
  assert.match(doc, /current broad runtime backlog boundary for 537 runtime test files,\s+4731 source top-level test declarations, 4580 pass, and 151 fail/);
  assert.match(doc, /current broad\s+runtime proof for the generated 4731 declaration set `NO-GO`/);
  assert.match(doc, /full codebase\s+audit completion from full\s+runtime proof `NO-GO`/);
  assert.match(doc, /first optimization\s+implementation approval from full runtime proof `NO-GO`/);
  assert.match(doc, /JSON-first first-class\s+promotion from full runtime proof `NO-GO`/);
  assert.match(doc, /whitelist\/cache optimization from\s+full runtime proof `NO-GO`/);
  assert.match(doc, /release\/public-claim use from full runtime proof\s+`NO-GO`/);
});
