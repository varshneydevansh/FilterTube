# Time limits, autoplay and preference reset — implementation and evidence

This implements the three decisions in the [pre-change review](TIME_LIMITS_RESET_AUTOPLAY_REVIEW.md). The starting revision was `29eb7b5b`. Changes are limited to the extension. No native mirror, Android/iOS build, real profile reset, trust enrollment, push, publication, store submission or issue comment was performed.

## Result

- **Settings → Restore this profile’s preferences** reviews the named profile and ordinary display/playback defaults before applying them. An authorized parent can use the existing child editing scope. Children cannot use this action. Cancel is the initial confirmation focus.
- **Autoplay** waits for real native play intent before automatically replacing a paused main source. Explicit pause, route changes, profile changes and player-node replacement cancel stale work. Hiding end-screen cards or the video wall no longer deletes the entire autoplay endpoint set; blocked successor filtering and Disable Autoplay still apply.
- **Time limits** serialize the shared usage ledger transaction across tabs/profiles, preserve fractional intervals, validate persisted policy and verify writes before advancing accounting. A failed or stale heartbeat does not clear confirmed exhaustion.

## Reset boundaries

The shared explicit contract contains 32 ordinary display/playback flags. Missing or non-boolean legacy values also become explicit defaults, so another linked profile does not inherit a different fallback. Some defaults are intentionally On. The two profile creation factories share this contract.

The action retains filter lists and modes, the global enabled state, content/category/language restrictions, Kids strictness, Notes, profile ownership, PINs, verified devices and grants, viewing access, daily time policy and usage, and hard/self-control sessions. It is not an installation wipe or list-clearing action.

The review lists enabled personal Settings Auto-sync destinations. The write follows the existing ordinary settings path; it does not silently disable Auto-sync or promise local-only changes. Fresh parent/session authority, named actor/target, edit-scope identity/value, legacy snapshots and Settings Auto-sync consent are checked around asynchronous work. The final write uses the Auto-sync enrollment lock before the Nanah storage lock. Dropped/failed writes and changed authorization are not reported as success. Existing signed parent delivery remains a separate action.

## Time accounting boundaries

The entire read/count/write ledger is serialized because unrelated profiles share one storage key. Chromium callback and Firefox Promise storage APIs are handled separately. A bounded in-memory receipt reconciles an ambiguous successful write whose verification read failed, avoiding a second charge on retry. Policy, active profile and calendar day are revalidated around asynchronous storage work. An IPC timeout releases a stuck request without allowing its late callback to complete a newer request.

These repairs do not create a trusted clock or a pooled family/device allowance. Usage remains local per installation, profile and day. The approximately five-second heartbeat and ten-second sleep cap remain. Worker restart and clock manipulation have the limits recorded in the original review. Installed restart/foreground/background enforcement is still a separate gate.

## Validation

| Check | Result | Evidence level |
| --- | --- | --- |
| Focused time, native playback, reset, personal and managed two-endpoint tests | 322/322 pass | Production modules/handlers in disposable runtime fixtures |
| Release lane | 742/742 pass | Source, package and audit checks |
| Smoke lane | 1,482/1,482 pass | Runtime fixtures and inventory checks |
| Settings lane | 1,160 pass; 95 fail | Same 95 failed test titles as the prior baseline |
| Chrome, Firefox, Opera packages | Build succeeds | Local build only |
| Source/unpacked/ZIP parity | 18 assets match in each of 3 packages | SHA-256 and byte equality |
| Native playlist autoplay | Shakira → YENA → Demi Lovato continues without another Play click | Actual installed Chrome/YouTube |
| Intentional pause | Remains paused at 37.076693 seconds across elapsed independent work | Actual installed Chrome/YouTube |
| English captions | English text rendered while lecture continues playing | Actual installed Chrome/YouTube; restored Off afterward |

The user confirmed reloading the unpacked extension. Browser tooling did not read installed extension package bytes, so that confirmation and observed page behavior are distinct from local package parity. The playlist was shortened using native keyboard seeking; this was not a startup latency benchmark or proof about every YouTube video. YENA reported `adaptive_source_unavailable` while YouTube continued playing normally, so a main-source replacement is not claimed on every item. The lecture reported `native_ready`; its caption test establishes native UI/rendering continuity, not successful source replacement. Audible output and alternate-language/multi-track selection were not verified.

[Structured results and package hashes](artifacts/controls-hardening-2026-10-25/validation.json) and [baseline lane comparison](artifacts/controls-hardening-2026-10-25/baseline-comparison.json) retain the exact scope. Current-source fingerprint/location contracts were refreshed without approving unresolved semantic audit gaps. Old end-screen contracts were revised to require permitted autoplay preservation. Broader baseline failures remain a release gate; a passing focused test does not waive them.

Three independent subagents implemented/reviewed time accounting, playback and reset. An additional subagent compared the remaining broad suites against the unchanged revision. FreeLLMAPI GPT-OSS 120B completed a bounded adversarial review; its suggestions were checked against source/tests. A requested Qwen 397B answer was truncated and discarded as validation evidence. No external model output is treated as correctness proof.

## Remaining gates

1. Review and execute the reset on disposable installed profiles, including parent-selected child scope and keyboard/screen-reader behavior. Browser tooling blocks extension-management/protocol surfaces, so no real user's preferences were reset.
2. Installed time-limit worker restart, multiple active tabs, exhausted state and foreground/background tests.
3. Pair the two installed Chrome profiles, then validate offline reconnect and actual settings/rules/Notes delivery. The earlier user reload did not complete pairing. Two-endpoint fixture tests are not installed-device proof.
4. Resolve the remaining broad-suite historical failures, and review translations beyond the English fallback.
5. Native Android/iOS adoption remains a separate implementation task. No native support or parity is claimed by these extension packages.
