# FilterTube Prompt And Onboarding Authority Audit - 2026-05-18

Status: current-behavior audit. This is not an implementation patch.

This artifact covers the user-facing prompt/onboarding surfaces that can appear
inside YouTube pages or the extension dashboard:

- first-run / post-update refresh prompt
- release-notes banner
- What’s New dashboard deep link
- dashboard toast helpers
- managed-child editor banner

It exists because prompt failures look small, but they sit on the same runtime
message, storage, injection, and page-overlay authority paths as filtering.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Source Map

| Surface | Primary files | Current owner |
| --- | --- | --- |
| First-run refresh prompt | `js/content/first_run_prompt.js`; `js/background.js:2584`, `2593`, `2634`, `3208` | Background storage flag plus isolated content-script overlay |
| Release-notes banner | `js/content/release_notes_prompt.js`; `js/background.js:1719`, `2625`, `3169`; `data/release_notes.json` | Background release payload plus isolated content-script overlay |
| What’s New dashboard | `html/tab-view.html:875`; `js/tab-view.js:2543`, `2652`; `data/release_notes.json` | Dashboard route parser plus dashboard fetch/render |
| Extension toasts | `js/ui_components.js:940`; `js/tab-view.js:11607`; `css/components.css:1563`; `css/tab-view.css:889` | UI helper functions with direct DOM insertion |
| Managed child banner | `html/tab-view.html`; `js/tab-view.js:4339`; `css/serene-shell.css:1938` | Tab-view state and profile editor mode |

## Current Behavior Findings

| Area | Current behavior | Proof | Risk | Future gate |
| --- | --- | --- | --- | --- |
| Prompt content-script order | `release_notes_prompt.js` and `first_run_prompt.js` are both manifest-loaded in isolated world at `document_start`, before `content_bridge.js`. | `manifest.json:52-55` | Two independent prompts can initialize on the same YouTube page before any page-runtime coordinator exists. | Add one prompt coordinator or explicit priority contract before changing prompt behavior. |
| Update overlap | On update, background sets `releaseNotesPayload` and `firstRunRefreshNeeded: true`. It then injects `first_run_prompt.js` into open YouTube tabs. The regular manifest-loaded release prompt can also render when `releaseNotesPayload.version !== releaseNotesSeenVersion`. | `js/background.js:2625-2629`, `2634-2647`, `3169-3191`, `3208-3215` | Post-update users can see refresh and release-note prompts competing for the same top-right viewport space. | One update-flow fixture: refresh prompt, release banner, or dashboard CTA should win by explicit priority. |
| Overlay placement | First-run prompt uses `#ft-first-run-refresh-prompt`, top/right `16px`, width `clamp(280px, 32vw, 360px)`, z-index `2147483647`. Release prompt uses `#ft-release-notes-banner`, same top/right/width, z-index `2147483646`. | `js/content/first_run_prompt.js:45-52`; `js/content/release_notes_prompt.js:94-103` | The first-run prompt visually covers the release banner instead of queueing or suppressing it. | Add stacking/queue fixture with both prompts eligible. |
| Storage/message authority | `FilterTube_FirstRunComplete` writes `firstRunRefreshNeeded=false`; `FilterTube_ReleaseNotesAck` writes caller-provided version or current version; neither branch uses the trusted UI sender guard. | `js/background.js:3198-3207`, `3213-3220`; trusted guard exists at `js/background.js:369` | Any extension content-script route that can send these messages can mark onboarding/release prompts complete, making prompt replay/debug hard. | Sender-class fixture: only the intended content-script prompt instance or trusted UI should ack prompt state. |
| Open What’s New authority | Release banner delegates `FilterTube_OpenWhatsNew` with `url: targetLink`; background opens `request.url || WHATS_NEW_PAGE_URL`. | `js/content/release_notes_prompt.js:162-165`; `js/background.js:3221-3224` | This shares the same arbitrary tab-open risk already found in message-trust audit. | Allowlist `WHATS_NEW_PAGE_URL` and fixture rejection for caller URLs. |
| No central prompt lifecycle | There is no source token for a `PromptCoordinator`, `promptQueue`, `activePromptOwner`, or single overlay registry across prompt files. | Source-wide absence proof | Prompt surfaces cannot prove one-at-a-time display, replay, teardown, or debug state. | Add a coordinator report: owner, reason, priority, display status, ack status, and dismissed source. |
| Dashboard rendering | What’s New dashboard fetches packaged `data/release_notes.json`, renders note content using created elements and `textContent`, and only uses `innerHTML` for internal empty-state messages. | `js/tab-view.js:2652-2755` | Lower risk than page overlays; still public-claim sensitive because packaged release data drives both dashboard and banner claims. | Add release-note schema fixture: version order, current manifest coverage, allowed internal/external links. |
| Toast helpers | `UIComponents.showToast()` removes existing `.ft-toast` nodes before appending a new one. `showSuccessToast()` appends independent `.ft-success-toast` nodes and removes them after `3000ms`. | `js/ui_components.js:940-958`; `js/tab-view.js:11607-11616` | There are two toast systems with different replacement semantics. This can confuse future UI status tests. | Add UI notification owner matrix before changing toast or coachmark UX. |

## Why This Matters For The Larger Audit

Prompt/onboarding bugs do not directly hide YouTube videos, but they share the
same disease:

```text
storage flags + release data + runtime messages
        |
        v
independent prompt scripts at document_start
        |
        +--> first-run overlay
        +--> release-notes overlay
        +--> background tab-open
        +--> dashboard deep link

Result:
  prompt display order is implicit,
  prompt completion messages are not sender-classed,
  release public claims and page overlays share mutable state,
  replay/debug behavior is hard to prove.
```

## Required Before Prompt/Coachmark Changes

Do not redesign or add new coachmarks until these are fixture-backed:

1. Fresh install: exactly one prompt state should be eligible and visible.
2. Extension update: refresh prompt and release banner priority must be explicit.
3. Prompt replay: dashboard/settings-triggered replay must have a named prompt
   owner and should not rely on stale storage flags.
4. Prompt acknowledgement: reject spoofed completion/ack messages from the wrong
   sender class.
5. What’s New CTA: tab-open URL must be allowlisted.
6. Mobile viewport: prompt or coachmark arrow must fit within the viewport and
   avoid YouTube app chrome.
7. Dashboard release data: current manifest version must be present in
   `data/release_notes.json`, or public release banners should use a fallback
   that clearly says details are pending.

## Current Verdict

Prompt/onboarding UX is mapped but not implementation-ready. The next safe work
is fixtures and a small coordinator contract, not more independent prompt DOM.
