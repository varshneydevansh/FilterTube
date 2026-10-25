# iOS simulator crash observed during website media capture

Status: reproduced on the existing iOS 26.3 simulator; cause and fix remain open.
No native source was edited or rebuilt during this website task.

The user-supplied crash report and a second local report show FilterTube 3.3.6,
build 30316, terminating with EXC_BAD_ACCESS / SIGSEGV in JavaScriptCore:

`JSRopeString::resolveToBuffer → resolveRope → operationCompareStringEq →
JSContext.evaluateScript → SignatureSolver.solve → batchSolve →
Extraction.applySignature → YouTube.loadStreams →
NativeOwnedMainYouTubeMediaSourceResolver.resolvePlan → background preload`.

The earlier report uses string-to-number coercion in the same extraction path.
These are native engine faults; the JavaScript exception handler cannot recover
from SIGSEGV. This does not implicate the website hero or SwiftUI layout.

A read-only source/bundle comparison found that the current and installed
`yt_ejs_helper.js` are byte-identical, SHA-256
`38104781f8218ae5e05eace3f2b97b3f3fccb32a49669181fd5c754ee8b34f92`.
The existing `chunks.push` / `chunks.join('')` mitigation is already installed.
Rebuilding merely to include it is not an evidenced fix. Concurrent solving is
visible, but each solver owns a separate VM/context; concurrency alone does not
prove shared-context misuse. A diagnostic no-JIT launch also terminated, so it
is not recorded as a workaround.

A separate clean iPhone 17 Pro / iOS 26.4 simulator was created for the authorized
screenshot work and installed with the same existing app binary. Launcher,
controls and empty Filters views were stable enough to capture. Its empty feed
did not exercise the failing populated-feed preloader. This is **not** proof that
26.4 fixes the crash, that playback works, or that the app is release ready.
Original simulator data and the parallel dirty native checkout were preserved.

## Next native investigation

In an isolated test checkout, reproduce with the same player script and bounded
challenge metadata; distinguish preprocessing from transform execution. Compare
one extraction with concurrent extractions on the same runtime. Review redundant
solver work on empty/duplicate challenges, execution bounds and shared player-JS
cache isolation. These are candidates, not established causes. Retain app,
profile, caption/audio and native playback gates before promoting a fix.

Raw reports contain local identifiers and are intentionally not copied here.
