# Post-v3.3.7 filtering regression diagnosis and alignment

Date: 2026-09-02

Status: implementation baseline documented; installed-browser acceptance remains open

## Scope and evidence boundary

This document separates three states that must not be conflated:

1. **Released behavior** is the behavior in v3.3.7 (`70cdb405`).
2. **Current local behavior** includes unreleased Watch/direct-access corrections and Hard Timer Whitelist work in the working tree after `cdb956d1`.
3. **Planned alignment** covers the remaining Home, Search, and Channel renderer/lifecycle gaps identified after testing a real 15k+ BlockTube import.

Source tests prove parser, matcher, state-machine, and reduced-renderer behavior. They do not prove an installed extension against a particular signed-in YouTube experiment. A clean-profile browser trace remains required before closing the linked reports.

## Intended filtering contract

| Surface | Primary authority | Fallback authority | Unknown identity policy |
| --- | --- | --- | --- |
| Home | `/browse` and continuation JSON filtering | Incremental DOM card filtering after hydration | Blocklist fails open until a positive match; Allow only fails closed |
| Search | `/search` and continuation JSON filtering | DOM filtering for hydrated/A-B renderer variants | Same blocklist/Allow-only policy |
| Channel | `/browse` JSON plus page channel metadata | DOM cards inherit current creator-page identity; direct blocked-channel route redirects | Page identity may vouch for otherwise ownerless cards |
| Watch | Route video ID plus metadata verified for that exact video | Bounded current-video resolver | Blocklist fails open after bounded unresolved admission; Allow only remains blocked |
| Shorts | Route Short ID plus metadata verified for that exact Short | Bounded current-video resolver and per-item overlay | Same as Watch; the Shorts application shell remains usable |

Rule precedence is `video > channel > keyword`; an allow rule wins an equal-specificity tie. Global Disabled is an authority boundary: no content rule, direct-access guard, overlay, pause listener, redirect, or automatic successor navigation may remain active after it is selected.

## Issue verdicts

| Issue | Released v3.3.7 verdict | Current local state | Remaining proof |
| --- | --- | --- | --- |
| #69 random successor after a blocked Watch item | Confirmed. The released fallback can click YouTube's generic Next button without verifying its destination. | Generic Next fallback and whole-Watch-shell hiding are removed. Only a positively verified allowed playlist row may be selected; otherwise the current item remains blocked. | Installed playlist trace with blocked and allowed successors |
| #75 unrelated Watch/Shorts content blocked | Credible regression. Released admission can consume identity/text that is not proven to belong to the current route video. | Watch admission consumes route-keyed `videoMetaMap[videoId]` only when identity/text verification flags were derived from that exact Player response. Banner reasons are typed. | Reproduce the reporter's exact item and one allowed SPA neighbor |
| #76 large import breaks Search or leaves blocked content visible | The original duplicate-pass/buffering component is likely mitigated by `2cf9db06`. The 15k matcher itself remains correct. Visible-card gaps remain real. | No broad #76 fix is claimed in this baseline. The alignment checklist below owns the remaining work. | Signed-in affected renderer/DOM capture, especially Chrome 151 on Windows 10 |
| #77 Disabled still pauses/skips a blocked Watch item | Confirmed. Released direct-access enforcement can run before Disabled cleanup and return early. | Disabled cleanup now runs before direct-access enforcement and releases playback guards, overlays, markers, hidden current-watch state, and redirect state. | Toggle Disabled while a known blocked Watch item is pending/blocked in Firefox and Chrome |

## Real 15k+ BlockTube import findings

The supplied backup contains a genuine name-only `SML` channel rule. Import/compilation retains name-only BlockTube rules as `source: "blocktube-channel-name"`. Direct probes with approximately 15.45k channel rules confirmed that a standard Search/Home `videoRenderer` from SML is removed regardless of whether the SML rule is at the beginning, middle, or end of the list.

Therefore the known failure is not list truncation, list order, Windows string comparison, or a broken channel index. Large lists amplify settings, hydration, mutation, and renderer timing, but matching remains deterministic.

## Confirmed remaining surface gaps

### 1. Home late-identity reprocessing

The incremental Home optimization can process a card before channel identity exists and mark it `data-filtertube-processed`. When enrichment later stamps `data-filtertube-channel-id` or `data-filtertube-channel-handle`, the scheduled incremental pass can skip the card because it is already processed and now has an identity attribute. The correct blocked identity is present, but policy is not reevaluated.

Alignment requirement: a newly stamped or changed channel identity must invalidate the card's processed identity/signature and force one bounded reevaluation without restoring broad whole-feed scans.

### 2. Search compact channel cards

`compactChannelRenderer` carries channel identity but has no direct `FILTER_RULES` entry. Existing reduced-capture tests intentionally pin the current leak. The renderer needs explicit blocklist and Allow-only decisions while preserving its channel-map side effect.

### 3. Direct `richGridMedia`

Rules exist for `richGridMedia`, but the recursive admission path currently recognizes only keys ending in `Renderer` or `ViewModel`. Direct `richGridMedia` content can therefore bypass JSON filtering.

Alignment requirement: admit this exact known content key without turning arbitrary layout objects into policy-owned cards.

### 4. Ownerless Search Shorts

Some Shorts lockups expose title/video identity without creator identity. They cannot be channel-matched until an exact video-to-channel mapping is available.

Alignment result: modern `belowThumbnailMetadata` owner name, UC ID, and canonical handle paths are now direct rule evidence. Genuinely ownerless items preserve fail-open blocklist behavior, then reevaluate once an exact video-to-channel mapping arrives; creator identity is never inferred from neighboring cards.

## Current local implementation baseline

The current extension working tree contains the following implementation work and is intended to be committed before surface alignment begins:

- Hard Timer Whitelist session type, UI, expiry alarm/reconciliation, exact pre-session profile restoration, mutation locks, tests, and specification/checklist updates.
- Global Disabled direct-access cleanup for #77.
- Exact current-video Player identity/text verification for Watch/Shorts admission.
- Reason-specific direct-access banners for blocked video, channel, keyword, and Allow-only decisions.
- Verified playlist-successor-only behavior for #69.
- Focused direct-access, metadata, lifecycle, and audit-register test updates.

This baseline does **not** claim an installed-browser fix for #75, #76, or #77 until the acceptance matrix below is executed.

## Alignment checklist

- [x] Add a focused source contract for a Home card processed before identity and restamped afterward.
- [x] Invalidate and reevaluate exactly that card when its channel identity changes.
- [x] Add `compactChannelRenderer` JSON policy with blocklist, Allow-only, no-rule, and map-side-effect fixtures.
- [x] Admit direct `richGridMedia` as a known policy renderer and add blocked/preserved fixtures.
- [x] Add Search Shorts mapped-owner coverage without neighboring-card inference.
- [x] Re-run the representative 15k rule list at beginning/middle/end rule positions.
- [x] Build Chrome and Firefox packages.
- [ ] Verify cold load and SPA navigation on Home, Search, Channel, Watch, and Shorts.
- [ ] Reproduce Chrome 151 / Windows 10 if that browser build and environment are available.
- [ ] Verify Firefox/macOS #77 by disabling FilterTube while the direct-access guard is pending and while it is blocked.

## Acceptance evidence to capture

For each affected card/item, record:

- route and video ID;
- raw renderer key;
- compiled channel rule count and the exact matching rule;
- `data-filtertube-processed` and last-processed identity;
- stamped channel ID/handle/name;
- hidden reason marker and computed display;
- settings dispatch revision;
- Watch/Shorts direct-access state and overlay text where applicable.

An item is fixed only when the blocked example is removed/blocked, an allowed neighbor remains usable, Disabled restores normal behavior immediately, and the result survives cold load plus SPA navigation.
