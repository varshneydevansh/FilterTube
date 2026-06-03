# FilterTube Content Bridge Prefetch Identity Lifecycle Boundary Current Behavior - 2026-05-22

Status: current-behavior proof with narrow SPA hot-path fixes. Runtime behavior
changed only for duplicate right-rail whitelist refresh timer fanout and
duplicate/no-op DOM fallback scheduling after learned identity stamps. This is
not a broad implementation patch, prefetch patch, JSON filtering patch, or
permission to change whitelist policy.

## Purpose

This slice isolates the `js/content_bridge.js` prefetch and identity hydration
cluster. The cluster starts card observation, queues visible cards, reuses DOM
identity, asks the main-world `ytInitialData` snapshot path for missing channel
identity, stamps DOM identity attributes, persists learned `videoChannelMap`
entries, and can schedule a DOM fallback rerun after stamping.

The boundary matters for JSON-first filter work because it is neither a pure
JSON reader nor a pure DOM fallback. It is a lifecycle owner that can convert
snapshot evidence into DOM and learned-map side effects.

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13623 | 603362 | `c651b34aad0ded2668a5cde55bfd4f499fab098f2f04e9ee0f50c5ede5d47b0c` |

Related proof layers:

- `docs/audit/FILTERTUBE_CONTENT_BRIDGE_LIFECYCLE_CALLBACK_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_ENGAGEMENT_SIDE_EFFECT_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md`

## Current Counts

```text
content bridge prefetch identity lifecycle boundary source files: 1
prefetch lifecycle cluster block lines: 488
prefetch lifecycle cluster block bytes: 16731
schedulePrefetchScan block lines: 19
schedulePrefetchScan block bytes: 518
attachPrefetchObservers block lines: 28
attachPrefetchObservers block bytes: 1189
startCardPrefetchObserver block lines: 22
startCardPrefetchObserver block bytes: 747
installPlaylistPanelPrefetchHook block lines: 43
installPlaylistPanelPrefetchHook block bytes: 1181
installRightRailWhitelistObserver block lines: 96
installRightRailWhitelistObserver block bytes: 3087
queuePrefetchForCard block lines: 53
queuePrefetchForCard block bytes: 2211
drainPrefetchQueue block lines: 10
drainPrefetchQueue block bytes: 368
withTimeout block lines: 5
withTimeout block bytes: 156
prefetchIdentityForCard block lines: 91
prefetchIdentityForCard block bytes: 4064
stamp/reset identity block lines: 152
stamp/reset identity block bytes: 6771
prefetch lifecycle cluster document.addEventListener callsites: 5
prefetch lifecycle cluster MutationObserver callsites: 2
prefetch lifecycle cluster IntersectionObserver callsites: 1
prefetch lifecycle cluster setTimeout callsites: 3
prefetch lifecycle cluster requestAnimationFrame callsites: 1
prefetch lifecycle cluster disconnect callsites: 2
prefetch lifecycle cluster querySelectorAll callsites: 2
prefetch lifecycle cluster querySelector callsites: 3
prefetch lifecycle cluster persistVideoChannelMapping callsites: 5
prefetch lifecycle cluster stampChannelIdentity callsites: 7
prefetch lifecycle cluster applyDOMFallback mentions: 3
runtime content bridge prefetch lifecycle fixtures: 6
runtime behavior changed: yes, duplicate right-rail timer fanout and no-op stamp reruns only
not completion proof for content bridge prefetch lifecycle authority
```

## Current Behavior Matrix

| Boundary | Current behavior | Current risk boundary | Missing proof before implementation |
| --- | --- | --- | --- |
| Card observer boot | `startCardPrefetchObserver()` returns if an observer already exists or `IntersectionObserver` is unavailable; otherwise it creates one observer, listens to `visibilitychange`, and calls `attachPrefetchObservers()`. | The observer itself has no local route/list-mode/settings active-work decision and no local `prefetchObserver.disconnect()` path. | Prefetch active-work decision with route, profile, list mode, native overlay/fullscreen state, and teardown reason. |
| Card attachment | `attachPrefetchObservers()` watches playlist-panel rows on playlist watch pages plus all `VIDEO_CARD_SELECTORS`, tracks cards in `observedPrefetchCards`, and caps each attach pass at 120. | The attach cap limits one pass, but there is no shared no-rule or disabled-mode budget for scan frequency. | Selector owner report with positive and negative route/surface fixtures and attach-count budget. |
| Playlist panel hook | `installPlaylistPanelPrefetchHook()` installs a scroll listener, one `MutationObserver`, and a `yt-navigate-finish` retry path that disconnects and reattaches the panel observer. | The hook is separate from the card observer and can schedule scans because a panel exists, not because a filter decision requires it. | Panel lifecycle budget tied to playlist route, JSON availability, and teardown equivalence. |
| Right-rail whitelist hook | `installRightRailWhitelistObserver()` only schedules refresh work when `currentSettings.listMode === 'whitelist'` and the route is not `/watch`; it coalesces one immediate and one 120 ms follow-up DOM fallback rerun through a route-rechecked runner. | The hook is whitelist-aware but still installs a MutationObserver and navigation listener before a shared owner contract exists. | Whitelist pending-hide policy proving route-specific need, rerun limits, and restore outcome. |
| Queue admission | `queuePrefetchForCard()` resets stale card identity, clears untrusted channel attributes when no prior video id is stamped, uses cached DOM or handle evidence when possible, dedupes by video id for 30 seconds, caps the queue at 10, and drains immediately. | Queue admission can still become DOM stamp/map-write work without a shared effect report for the evidence tier. | Queue budget and identity source report with sibling-visible stale-node fixtures. |
| Queue draining | `drainPrefetchQueue()` pauses on `prefetchPaused` or `document.hidden` and runs up to two concurrent `prefetchIdentityForCard()` calls. | Visibility pause exists, but there is no route/profile/list-mode no-work decision. | Concurrency budget plus route/no-rule negative fixtures. |
| Identity hydration | `prefetchIdentityForCard()` avoids direct `fetch()` calls, uses Kids DOM or main-world snapshot lookup, uses normal-page DOM extraction first, asks main-world `ytInitialData` when needed, stamps DOM identity, and persists UC mappings. | Main-world snapshot evidence can become DOM attributes and learned map state through caller code. | Snapshot-effect report covering cache, map writes, DOM stamps, reruns, and hide/allow consequences. |
| Stamp follow-up | `stampChannelIdentity()` now writes `data-filtertube-channel-*` attributes only when the incoming value changes, returns a changed/not-changed result, and skips its local 120 ms fallback timer when the caller passes `scheduleFallback: false`. | A successful identity stamp can still re-enter DOM fallback, but unchanged stamps no longer schedule a no-op pass and batch receivers can own one rerun. | DOM-stamp and DOM-rerun budget with exact-card and sibling-visible fixtures. |

## Source-Derived Anchors

```text
prefetchClusterStart: `js/content_bridge.js:988`
schedulePrefetchScan: `js/content_bridge.js:1087`
attachPrefetchObservers: `js/content_bridge.js:1108`
startCardPrefetchObserver: `js/content_bridge.js:1138`
installPlaylistPanelPrefetchHook: `js/content_bridge.js:1166`
installRightRailWhitelistObserver: `js/content_bridge.js:1211`
queuePrefetchForCard: `js/content_bridge.js:1311`
drainPrefetchQueue: `js/content_bridge.js:1366`
withTimeout: `js/content_bridge.js:1378`
prefetchIdentityForCard: `js/content_bridge.js:1385`
stampChannelIdentity: `js/content_bridge.js:1478`
persistVideoChannelMapping: `js/content_bridge.js:1632`
```

## Runtime Proof

The runtime fixture proves:

1. The card prefetch observer uses one `IntersectionObserver`, one
   `visibilitychange` listener, and per-card `queuePrefetchForCard()` admission.
2. Attach scans include playlist-panel rows plus `VIDEO_CARD_SELECTORS`, use a
   `WeakSet`, and stop each pass at 120 attached cards.
3. Playlist-panel and right-rail hooks add separate observer/listener/timer
   work; right-rail refresh work is whitelist-aware, route-aware, and locally
   coalesced to one pending immediate plus one pending follow-up timer.
4. Queue admission resets stale identity, clears untrusted attributes, dedupes
   by video id for 30 seconds, caps the queue at 10, and drains with concurrency
   2 only while visible.
5. Identity hydration performs no direct `fetch()` in `prefetchIdentityForCard()`,
   but can stamp DOM identity, persist learned map entries, and schedule DOM
   fallback after a successful stamp.

## Non-Completion Boundary

Content bridge prefetch identity behavior still needs a lifecycle contract,
active-work decision, observer budget, queue budget, snapshot-effect report,
DOM-stamp report, map-write report, whitelist pending policy, route pause
policy, fixture provenance, and metric artifact before first-class JSON filter
promotion or no-work optimization changes rely on this owner.

No `contentBridgePrefetchIdentityLifecycleContract`,
`contentBridgePrefetchActiveWorkDecision`, `contentBridgePrefetchObserverBudget`,
`contentBridgePrefetchQueueBudget`, `contentBridgePrefetchSnapshotEffectReport`,
`contentBridgePrefetchDomStampReport`, `contentBridgePrefetchMapWriteReport`,
`contentBridgePrefetchWhitelistPendingPolicy`,
`contentBridgePrefetchRoutePausePolicy`,
`contentBridgePrefetchFixtureProvenance`, or
`contentBridgePrefetchMetricArtifact` exists in product runtime source yet.

## Runnable Proof

```bash
node --test tests/runtime/content-bridge-prefetch-identity-lifecycle-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this content bridge prefetch identity surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: yes, duplicate right-rail timer fanout and no-op stamp reruns only
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, prefetch identity changes, map-write policy
changes, whitelist pending behavior changes, or observer/timer authority
changes.

## Scoped Collaborator Warmup Note - 2026-06-03

The collaborator reliability follow-up added
`window.FilterTube_prefetchCollaboratorsForCard` outside the broad prefetch
observer queue. The broad `needsIdentityPrefetchWork(settings)` gate still only
wakes identity prefetch for whitelist mode or existing channel rules. This
preserves the no-rule/no-work lag fix while allowing quick-block/menu paths to
warm one interacted card.

Current prefetch gate status:

```text
broad identity prefetch gate changed: no
single-card collaborator warmup added: yes
no-rule full-card observer wakeup restored: no
quick-block collaborator lookup reliability: IMPROVED_BY_SCOPED_WARMUP
runtime behavior changed by 2026-06-03 scoped warmup: yes
```
