# Linked issue acceptance follow-up — October 18, 2026

This follows [the October 17 issue review](ISSUE_REVIEW_69_75_76_77_79_80_81_2026-10-17.md). Changes remain local. No GitHub issue reply/closure, push, release publication, store submission or downstream native-runtime synchronization is authorized by this report.

## Reproduced defects and corrections

- **#79, blank video-card areas:** the supplied export imports and compiles locally without invalid rules or data loss. Its category settings exercise the pending-card path. A queued metadata request returned `true` beyond the nominal eight-second placeholder deadline, preventing expiration. The processed-card shortcut could also skip the recheck. Pending visual state now has a per-card deadline keyed to video and category policy. Queued requests cannot extend it, rescans cannot restart it, and a delayed callback reprocesses current settings. Offscreen cards start a wait only when a visible lookup is requested; scrolling offscreen preserves an already-started deadline. Block-selected cards become usable after the deadline; actual metadata still applies category decisions. Allow-only unknown cards remain unavailable. This reproduces and corrects a mechanism consistent with the report, not yet the reporter's Firefox Android rendering session.
- **Comment false blocking:** an actual compiled title-only channel rule could hide another author's comment mentioning that channel, despite an explicit empty comment-rule list. Comment renderers now use their dedicated keyword path. Author blocking, explicit comment rules, absent-list legacy fallback and Disabled behavior are preserved. Four failing cases were reproduced before the change; twelve regressions pass afterward.
- **#69, selected playlist row:** the current-watch owner enforcer hid the selected row despite the generic card pass protecting it. The actual enforcer and visibility helper reproduced this across desktop/mobile variants. The selected row now remains visible while current-video blocking metadata and player admission remain active. Modern mobile V2 rows use the same enumeration. Eight failures were reproduced before the change; nine regressions pass afterward. This removes a source-level trigger for YouTube-driven advancement; installed playlist behavior remains a separate check.

The new regression group contains **34 passing checks**: five category-lifetime cases, eight entire-DOM-pass/timer cases, twelve compiler-to-comment-engine cases and nine current-watch/selected-row cases. The DOM harness executes the production pass and callback with unrelated browser services stubbed; it does not establish compositor, network or physical-device behavior.

## Remaining acceptance boundaries

- Firefox 158 was downloaded from Mozilla's official archive and installed in a new isolated Android emulator. Its first-run Terms of Use require user confirmation before proceeding. The existing Android TV emulator was preserved.
- The exact #75 reporter-specific false block has not been reproduced. Exact current-video metadata, permitted adjacent-video metadata and the reporter's relevant rule settings remain necessary to establish that case.
- Post-deadline card tap followed by current-video admission, actual Firefox Android mobile/desktop rendering, installed BlockTube import/save/reopen and native/physical-device parity must not be inferred from VM tests or successful builds.
- Argon Medium challenged deadline/tap behavior and recycled-card identity. The identity reset and explicit comment-list boundaries have executable coverage; the installed tap/admission scenario remains a device check. API proposals that truncated or misstated the contracts were rejected as validation.

Broader audit-lane repairs and final package checks are recorded separately after their complete rerun. Historical source inventories remain historical; current source reviews do not promote missing security, semantic or physical-device proof.
