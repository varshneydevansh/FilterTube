# FilterTube YTD/YTK/YTM Regression + Future-Ready Spec

Date: 2026-02-18
Owner: FilterTube Engineering
Scope: Desktop YouTube (YTD), YouTube Kids (YTK), YouTube Mobile Web (YTM)

## 1. Problem Statement
v3.2.8 achieved major YTM support but introduced cross-surface regressions and identity quality issues.

Primary user-facing failures:
1. Quick hover cross was removed from YTD and degraded expected parity with YTK/YTM.
2. Some channel blocks on YTD persisted video titles as channel names.
3. Custom fallback 3-dot entry was missing on cards where YouTube removed/changed native overflow controls (especially mix/playlist/comment surfaces).
4. Main-world identity lookups were returning null in flows where strict expected-name matching was fed weak title-like candidates.

## 2. Non-Negotiable Product Contract
1. Core block affordances must exist on all 3 surfaces: YTD, YTK, YTM.
2. Surfaces stay independent: no YTM behavior leakage that breaks YTD/YTK performance or identity.
3. Persisted channel identity must never prefer video title over channel name.
4. When native 3-dot is absent, a fallback menu entry must still allow block action.

## 3. Evidence From Previous Change Set (`text.txt`)
Confirmed from prior change notes/diff:
1. v3.2.8 explicitly calls out regressions risk (`BUMP: v3.2.8 full YTM support some regressions with YTD/YTK`).
2. `Quick-Block Restriction` explicitly disabled/restricted desktop quick hover behavior to mobile-first.
3. Good additions: round-trip handle/UC validation, tiered enrichment retries, multi-origin enrichment, YTM bottom-sheet support.
4. Risk introduced: optimization intent for desktop stability removed a high-value desktop affordance and left parity gaps.

## 4. Questions We Must Ask First (and Answer)
1. Q: Should quick-cross be surface-specific or parity-first?
A: Parity-first for feature availability. Implementation can be surface-tuned for performance, but capability must exist on YTD/YTK/YTM.

2. Q: Should name heuristics ever trust generic text from arbitrary anchors?
A: No. Channel name must be taken from channel-specific DOM/JSON paths; title-like values must be rejected before persistence.

3. Q: Should expected-name matching for main-world lookup stay strict?
A: Strict only with sanitized channel-name candidates. If candidate may be title-like, pass no expected name.

4. Q: Should fallback 3-dot be watch-page only?
A: No. It must cover missing-native-menu cards across home/search/watch/comments where native overflow disappears.

5. Q: Is broad `isLikelyBadName` patterning (e.g., generic `uc...`) acceptable?
A: No. Keep only strong invalid signatures. Do not reject valid multilingual/custom channel names via broad regex shortcuts.

## 5. Immediate Regression Fixes Implemented In This Patch

### 5.1 Quick Hover Cross Re-enabled for Desktop + Retained for Kids/Mobile
File: `js/content/block_channel.js`
1. Removed desktop hard-disable in `setupQuickBlockObserver`.
2. Kept performance guardrails by throttling pointer-tracking ticks.
3. Expanded menu trigger detection for modern button patterns (`aria-haspopup`, `yt-button-shape`, `yt-icon-button-shape`).

Expected impact:
1. Quick cross works again on YTD.
2. YTK/YTM behavior remains intact.
3. Hover-preview overlays on desktop no longer hide the cross as often due pointer point-resolution path.

### 5.2 Channel Name Poisoning Guard (Title != Channel)
File: `js/content_bridge.js`
1. Added `isLikelyVideoTitleForCard` + `sanitizeChannelNameForCard`.
2. Applied sanitization to Shorts/data-attribute extraction and multiple fallback name paths.
3. Applied sanitization before expected-name lookup and before sending metadata to background.
4. Prevented weak/stale title-like names from becoming `expectedChannelName` for strict lookup.

Expected impact:
1. Blocks no longer persist obvious video titles as channel names in the main flow.
2. Reduced `channel: null` from main-world name mismatch cases driven by bad expected names.

### 5.3 Fallback 3-dot Coverage Expanded Beyond Watch-only
File: `js/content_bridge.js`
1. `ensureWatchPlaylistFallbackMenu` now installs globally (not watch-only).
2. Added desktop fallback scan for mix/playlist/comment cards.
3. Expanded YTM fallback scan to include rich-item and comment renderers.
4. Expanded native-menu detection to handle modern `aria-haspopup` menu buttons.
5. Added debounced fallback scan scheduling to avoid mutation-storm CPU spikes.

Expected impact:
1. Missing native overflow cards still expose a FilterTube menu path.
2. Better resilience to YouTube DOM/button variant rollouts.

### 5.4 Enrichment Name Validation Narrowed (Safer)
File: `js/background.js`
1. Tightened `isLikelyBadName` to strong invalid patterns only.
2. Removed broad heuristics that can misclassify legitimate channel names.

Expected impact:
1. Lower risk of false “bad name” classification.
2. Better compatibility with diverse naming styles.

## 6. Good vs Bad in v3.2.8 (Engineering Assessment)
Good:
1. YTM architecture support is real and substantial (menu + identity + enrichment).
2. Round-trip ID/handle validation is correct and should remain mandatory.
3. Tiered enrichment cadence is directionally correct for load control.

Bad:
1. Desktop quick-cross removal broke parity and user expectation.
2. Name-quality gates were incomplete; title-like contamination still slipped through.
3. Fallback menu injection was too narrow in surface scope.
4. Some logic relies on duplicated heuristic blocks across `content_bridge.js` leading to drift.

## 7. JS Directory Audit + Rearrangement Plan (Per File)

| File | Current Role | Risk / Pain | Rearrangement Target |
|---|---|---|---|
| `js/background.js` | Persistence, fetch/enrichment, messaging | Monolithic, mixed concerns | Split into `background/identity`, `background/storage`, `background/enrichment`, `background/handlers` |
| `js/content_bridge.js` | Core content orchestration and menus | Very large, duplicate heuristics | Split into `content/identity_pipeline.js`, `content/menu_injection.js`, `content/fallback_menus.js`, `content/block_flow.js` |
| `js/content/block_channel.js` | Quick-block + menu observer | Surface logic and DOM selector sprawl | Split by concern: `quick_block.js`, `menu_event_router.js`, `kids_native_bridge.js` |
| `js/content/dom_extractors.js` | DOM extraction for identities/content | Selector growth and branch complexity | Split by surface: `extractors/ytd.js`, `extractors/ytm.js`, `extractors/ytk.js`, shared normalizers |
| `js/content/dom_fallback.js` | Hide/show filtering runtime | Heavy coupling to stamped attrs | Keep, but isolate strategy modules by filter type |
| `js/content/menu.js` | Menu style/injection helpers | Mostly fine | Keep with minor cleanup |
| `js/content/dom_helpers.js` | DOM utility helpers | Utility drift | Keep, enforce no business logic |
| `js/content/bridge_injection.js` | Main-world injector bootstrap | Fine | Keep |
| `js/content/bridge_settings.js` | Settings bridge | Fine | Keep |
| `js/content/handle_resolver.js` | Handle/ID resolver helpers | Could merge with identity layer | Move under `content/identity/` |
| `js/content/collab_dialog.js` | Collaboration UI path | Good, but tied to content_bridge state | Keep, stronger interfaces |
| `js/content/release_notes_prompt.js` | release prompt UI | Fine | Keep |
| `js/content/first_run_prompt.js` | first-run UX | Fine | Keep |
| `js/shared/identity.js` | Shared identity primitives | Critical and valuable | Keep as canonical identity contract |
| `js/seed.js` | Main-world network hook seed | Critical, sensitive | Keep, document contracts |
| `js/filter_logic.js` | Network payload filter processing | Needs stricter interfaces with content layer | Split parser vs decision engine |
| `js/render_engine.js` | Dashboard/UI rendering engine | Independent UI domain | Keep under future `ui/` namespace |
| `js/io_manager.js` | Import/export/backup IO | Fine | Keep under future `ui/io` |
| `js/ui_components.js` | Shared extension UI components | Fine | Keep |
| `js/tab-view.js` | Dashboard tab logic | Fine | Keep |
| `js/state_manager.js` | State abstraction | Underused in content path | Either enforce usage or deprecate |
| `js/content_controls_catalog.js` | Controls definitions | Fine | Keep |
| `js/settings_shared.js` | Shared settings schema/helpers | Important | Keep, make single source of defaults |
| `js/security_manager.js` | Security hardening utilities | Fine | Keep |
| `js/injector.js` | Main-world data scan / bridge endpoint | Critical but large | Split extractor + bridge router |
| `js/popup.js` | Extension popup runtime | Fine | Keep |
| `js/layout.js` | UI layout logic | Fine | Keep |

## 8. Cross-Surface Isolation Rules (Must Enforce)
1. Any surface feature flag must default to parity-on unless explicitly experimental.
2. Surface-only selectors stay in surface modules; shared modules only accept normalized identity objects.
3. Never use YTM-only DOM assumptions in YTD path and vice versa.
4. Identity object contract: `{ id, handle, customUrl, name, logo, videoId, source }` with explicit trust levels.

## 9. Performance Optimization Plan (Beyond File Restructure)
1. Mutation budget control: debounced scans + bounded selectors + per-surface early exits.
2. Name/identity sanitizer consolidation: single helper, no copy-pasted heuristics.
3. Main-world lookup cache tuning: avoid strict expected-name when candidate confidence is low.
4. Selector telemetry (debug mode only): count misses/hits by renderer tag to detect breakages early.
5. Card lifecycle hygiene: strict stale-stamp clearing when `videoId` changes.

## 10. Regression Test Matrix (Minimum)
1. YTD Home/Search/Watch/Shorts/Mix: quick-cross visible and actionable.
2. YTK Home/Watch: quick-cross still present and block persists.
3. YTM Home/Search/Watch/Comments/Mix: native menu injection or fallback menu always available.
4. Block persist correctness: stored `name` equals channel name, never video title.
5. Main-world fallback: no repeated null loops for same clicked item with valid identity present.

## 11. Phase Plan
Phase 0 (done in this patch):
1. Re-enable quick-cross parity.
2. Fix name poisoning path.
3. Expand fallback 3-dot coverage.
4. Tighten enrichment name validator.

Phase 1:
1. Extract identity sanitizer + title detector into shared identity module.
2. Split `content_bridge.js` into focused files without behavior change.
3. Add per-surface smoke test script for YTD/YTK/YTM menu + quick-cross + persist flow.

Phase 2:
1. Introduce explicit surface adapters for upcoming mobile/tablet/browser-app integration.
2. Add API-facing identity normalization layer for future Chromium webview app embedding.

## 12. Open Risks After This Patch
1. YouTube may continue changing menu trigger DOM; selector maintenance will remain ongoing.
2. Fallback button host placement on some uncommon card variants may still need visual tuning.
3. Additional title-like edge cases in non-Latin scripts may need iterative sanitizer refinements.

## 13. 2026-02-18 Root-Cause Addendum (From Live Logs)
Validated against current logs and code:
1. `postBlockEnrichment` could still overwrite an already-good stored channel name if incoming enrichment name passed weak validation.
2. Some Mix card rows provide `channelId` without a reliable `videoId`; main-world lookup failed when only `videoId` path was used.
3. Preview/watch fallback extraction could still accept weak CTA/title-like strings (for example, `Like this video?`) as `name`.
4. YTM fallback menu injection was too restrictive for some `ytm-video-with-context-renderer` cards with missing native 3-dot.

Remediation applied:
1. Background merge policy now keeps existing good names during post-enrichment and only replaces when existing is weak/missing.
2. Main-world channel lookup now supports `channelId` fallback path end-to-end.
3. Additional name sanitizers added in background/shared/content layers for CTA/mix/and-more placeholders.
4. YTM fallback injection now allows `ytm-video-with-context-renderer` cards when native menu is absent.
