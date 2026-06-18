# FilterTube Content Bridge Collaborator Enrichment Retry Boundary - Current Behavior

Status: current-behavior proof only.

This is not an implementation patch. It is not approval to change runtime filtering, JSON mutation, DOM mutation, storage, message, lifecycle, network, prompt, or settings semantics. This codebase inspection is finding optimization locations and first-class JSON filter blockers before product changes.

## Boundary

This slice pins the content-bridge collaborator enrichment retry path in `js/content_bridge.js`: pending dialog-card state, generated collaborator keys, 20 second pending-card expiry, retry counters, main-world collaborator lookup options, expected collaborator hints, cache hint reuse, resolved roster application, batch application by video id, active menu refresh, playlist fallback refresh, collaborator dialog handoff, and forced DOM fallback reruns.

content bridge collaborator enrichment retry source files: 1

content bridge collaborator enrichment retry source/effect blocks: 6

## Source Fingerprint

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |

## Pinned Blocks

| Block | Start Line | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | ---: | --- |
| `contentBridgeCollaboratorPendingDialogState` | 3299 | 66 | 2426 | `2fb03120d2c077a1700cdfd7c8dc46a906440eee4e63a5f140f77e1298315165` |
| `contentBridgeCollaboratorRetry` | 3365 | 17 | 778 | `cbf39cc96640174f6df8bf2184b155bd8abde10ed01f759208ad577be474760f` |
| `contentBridgeCollaboratorLookupOptions` | 3382 | 54 | 2358 | `710a851d88bb76cd65f3102c489accfdaa68e278a3967c070662cc033be40e7d` |
| `contentBridgeCollaboratorEnrichmentRequest` | 3436 | 56 | 2572 | `80f0359372c11ac0614e4eceb12291bc2c853fe0504e4f195c2eb5c37b60c444` |
| `contentBridgeApplyResolvedCollaborators` | 3492 | 102 | 3877 | `1e7fbf0db7c63fb93aceb9d952f65a97da5d26a442c5bfae080d8d789dc435e4` |
| `contentBridgeApplyCollaboratorsByVideoId` | 3594 | 105 | 3995 | `3774b5599d4a959c83f6ea1c441985ba1b74304cb5d0720a79fd94006818459c` |

## Selected Token Counts

These counts are over the six pinned blocks, not the whole product.

| Token | Count |
| --- | ---: |
| `generateCollabEntryKey` | 2 |
| `pendingCollabCards` | 8 |
| `data-filtertube-collab-key` | 2 |
| `data-filtertube-collab-awaiting-dialog` | 4 |
| `data-filtertube-collab-state` | 5 |
| `data-filtertube-collab-requested` | 5 |
| `data-filtertube-collab-retries` | 4 |
| `data-filtertube-expected-collaborators` | 13 |
| `expiryTimeout` | 3 |
| `20000` | 1 |
| `scheduleCollaboratorRetry` | 3 |
| `maxRetries` | 2 |
| `setTimeout` | 4 |
| `requestCollaboratorEnrichment` | 2 |
| `requestCollaboratorInfoFromMainWorld` | 1 |
| `buildCollaboratorLookupRequestOptions` | 2 |
| `expectedNames` | 5 |
| `expectedHandles` | 5 |
| `allowRosterFallbackForCollabMarkup` | 3 |
| `cachedCollaborators` | 2 |
| `parseCollaboratorNames` | 1 |
| `applyResolvedCollaborators` | 2 |
| `applyCollaboratorsByVideoId` | 2 |
| `resolvedCollaboratorsByVideoId` | 4 |
| `getCollaboratorListQuality` | 6 |
| `force` | 9 |
| `JSON.stringify` | 2 |
| `querySelectorAll` | 2 |
| `shouldStampCardForVideoId` | 2 |
| `data-filtertube-collaborators` | 4 |
| `data-filtertube-collaborators-source` | 1 |
| `data-filtertube-collaborators-ts` | 1 |
| `refreshActiveCollaborationMenu` | 2 |
| `refreshOpenPlaylistFallbackPopoverForVideo` | 2 |
| `applyDOMFallback` | 4 |
| `forceReprocess: true` | 2 |
| `preserveScroll: true` | 2 |
| `collabDialogModule` | 4 |
| `applyCollaboratorsToCard` | 1 |

## Runtime Fixtures

The paired verifier is `tests/runtime/content-bridge-collaborator-enrichment-retry-boundary-current-behavior.test.mjs`.

It pins current harness behavior:

- `markCardForDialogEnrichment()` creates a `vid:` key when video id exists, marks the card pending, stores partial collaborators, records expected-count hints, and schedules a 20000 ms expiry that removes pending attributes.
- `scheduleCollaboratorRetry()` caps at three retries, increments `data-filtertube-collab-retries`, clears `data-filtertube-collab-requested`, and uses a 700 ms default retry delay unless a caller supplies another delay.
- `buildCollaboratorLookupRequestOptions()` merges partial, cached, and channel-info hints into expected names and handles, parses hidden-collaborator labels, raises expected collaborator count, and marks roster fallback as allowed when markup implies hidden collaborators.
- `requestCollaboratorEnrichment()` marks pending state before duplicate main-world suppression, sends one main-world request for unrequested cards, applies non-empty responses through `applyResolvedCollaborators()`, and schedules retry on empty or failed responses.
- `applyResolvedCollaborators()` writes serialized collaborators, optional source label, timestamp, resolved state, pending cleanup, expected count, resolved cache, active-menu refresh, playlist-popover refresh, and a zero-delay forced DOM fallback rerun.
- `applyCollaboratorsByVideoId()` can create a pending entry from a matching stamped card, skip lower-quality rosters unless forced, hand resolved data to `window.collabDialogModule.applyCollaboratorsToCard()`, refresh menus/popovers, and schedule the same forced DOM fallback rerun.

## Risk Boundary

This boundary is where passive or menu-driven collaborator discovery becomes DOM state, menu state, retry timers, and global fallback reprocessing. It is relevant to reliability, false-hide/leak, performance, code-burden, JSON-first readiness, collaborator source confidence, pending request ownership, stale-card handling, route/profile scope, and cross-feature interaction with whitelist mode, playlist fallback buttons, and menu actions.

Current behavior is intentionally broad: enrichment can mark a card pending before the request is sent, retry after empty or failed main-world lookups, cache collaborator rosters even when no visible card is updated, and rerun DOM fallback after collaborator application. This audit slice does not approve changing those semantics; it makes their current side effects explicit before optimization work.

## 2026-06-19 Recovery Note

YouTube's desktop lockup/menu rollout can open collaborator menus from newer
`yt-lockup-view-model` and `button-view-model` wrappers before FilterTube has
stamped the visible card with `data-filtertube-video-id`. The retry boundary now
documents a targeted recovery rule: collaborator application must locate cards
by stamped video id, watch/shorts anchors, parsed URL matches, and
`content-id-<videoId>` lockup classes before treating a main-world collaborator
response as detached from the visible card.

This is not a looser collaborator detector. The existing false-collab gates,
ampersand-topic rejection, expected-collaborator count checks, and roster
quality comparison remain in force. The change only hardens card lookup and menu
refresh after collaborator identity has already been requested or returned.

## Missing Future Proof

No product runtime symbol exists yet for:

- `contentBridgeCollaboratorEnrichmentContract`
- `contentBridgeCollaboratorRetryPolicy`
- `contentBridgeCollaboratorPendingCardReport`
- `contentBridgeCollaboratorLookupOptionsPolicy`
- `contentBridgeCollaboratorApplicationReport`
- `contentBridgeCollaboratorDomFallbackBudget`
- `contentBridgeCollaboratorMenuRefreshReport`
- `contentBridgeCollaboratorFixtureProvenance`
- `contentBridgeCollaboratorMetricArtifact`
- `contentBridgeCollaboratorAuthorityGate`

This slice does not close the audit rows for collaborator enrichment authority, retry policy, pending-card ownership, lookup option provenance, application side effects, DOM fallback budgets, menu refresh reports, playlist fallback refresh reports, route/profile/list-mode negative fixtures, fixture provenance, metrics, or first-class collaborator enrichment gates.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this menu/dialog/injector/quick-block
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, menu action behavior, dialog lifecycle
behavior, injector behavior, quick-block behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
