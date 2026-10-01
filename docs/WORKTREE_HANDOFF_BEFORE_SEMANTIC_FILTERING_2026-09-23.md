# Worktree handoff before semantic filtering (2026-09-23)

This is a snapshot of the worktree before Jev-inspired work. It distinguishes committed code from local changes; no local changes have been staged or committed as part of this handoff.

## Git boundary

- HEAD `09bd05e9` — Advert Void ownership fix. Prior checkpoint `4edfc734` — external playback admission documentation and code.
- Git index: clean (`git diff --cached --stat` produced no entries).
- Working tree: 15 modified tracked files and 3 untracked files. Preserve them as the current playback, issue follow-up and presentation work. Do not treat them as part of semantic filtering.

## Unstaged tracked files

| Files | Local work represented |
| --- | --- |
| `CHANGELOG.md`, `html/tab-view.html` | Unreleased behavior and help text for the current admission/playlist fixes. |
| `js/content/dom_fallback.js`, `js/content_bridge.js` | Preserve SPA play intent; stop automatic playlist successor selection; narrow membership badge hiding; candidate-scoped Watch/Search refresh; shared Watch overlay use. |
| `js/content/external_youtube_guard.js`, `js/content/external_youtube_network.js` | Google/embedded player identity and pending admission recovery, including the live recommendation-thumbnail ownership fix. |
| `manifest.json`, `manifest.chrome.json`, `manifest.firefox.json`, `manifest.opera.json` | Load the shared admission presentation in the current extension surfaces. |
| `tests/runtime/direct-access-admission-current-behavior.test.mjs`, `tests/runtime/external-youtube-admission-overlay-current-behavior.test.mjs`, `tests/runtime/external-youtube-playback-guard-current-behavior.test.mjs`, `tests/runtime/large-rule-list-runtime-optimization-current-behavior.test.mjs` | Focused regression coverage for the above. |
| `docs/EXTERNAL_YOUTUBE_PLAYBACK_ADMISSION_2026-09-04.md` | Live finding that a recommendation thumbnail was mistaken for selected media. |

## Untracked files already present

- `js/content/admission_overlay.js` — shared themed banner presentation.
- `tests/runtime/membership-card-scope-regression.test.mjs` — membership card scope regression test.
- `docs/ISSUES_69_75_76_77_FOLLOWUP_2026-09-22.md` — status and remaining validation for those reports.

## Verification boundary

Focused source tests previously passed. The installed Chrome experience and 30-second allowed-player delay have not been proven fixed after the latest recommendation-identity change. Semantic filtering must be opt-in and must not join or delay the current video admission decision until its own behavior is validated.
