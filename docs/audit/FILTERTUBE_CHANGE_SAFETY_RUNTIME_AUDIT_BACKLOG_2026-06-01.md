# FilterTube Change-Safety Runtime Audit Backlog

Date: 2026-06-01
Status: broad audit backlog, not a release-lane gate

## Command

```bash
node --test --test-reporter=tap tests/runtime/*.test.mjs > /tmp/filtertube-runtime.tap 2>&1
```

## Result

```text
tests: 4731
pass: 4610
fail: 121
duration_ms: 35290.977291
```

## Boundary

The focused release lanes are the per-change proof system. The broad
`audit:runtime` suite is older current-boundary inventory and is still useful,
but it is not clean enough to be treated as a release blocker today.

Adjacent fingerprint proof is now cleaner than the broad suite result. This
command currently reports no stale source fingerprint proof rows:

```bash
node scripts/audit-proof-drift.mjs --all --report-only
```

## Failure Clusters

| Cluster | Examples | Current meaning |
|---|---|---|
| Callable, source-locus, and index drift | remaining source-locus ownership rows, route component callable/render primitive counts | `all-callable-index-current-behavior` has been refreshed and promoted into `test:smoke`; `first-optimization-source-locus-callable-anchor-boundary` has been refreshed and promoted into `test:performance`; remaining source-locus ownership closure rows and route component register rows need regenerated proof before they can become broad gates. |
| Audit goal and completion ledgers | audit completion gap register, collector verification output, JSON route/surface contract coverage links | Older goal ledgers still point at stale broad-suite counts or prerequisite gates. |
| Docs/audit boundary, packaging, and generated artifacts | audit markdown boundary, `compress-video`, design tokens, release notes, external navigation, generated main runtime assets, dist/website generated output | Release and generated-output proof remains useful, but several broad inventory rows need refresh. |
| Settings and content-control registers | settings mode source/effect, settings refresh cross-context consumer rows, source-of-truth claim register | `compiled-settings-field-register` has been refreshed and promoted into `test:settings`; `content-control-active-work-matrix` has been refreshed and promoted into `test:performance`; `content-control-alias-mutation-boundary` has been refreshed and promoted into `test:settings`; `settings-mode-source-effect`, `source-of-truth-claim-register`, `settings-refresh-cross-context-consumer-boundary`, `settings-refresh-optimization-readiness-boundary`, `settings-refresh-optimization-candidate-binding-matrix`, and `settings-refresh-optimization-candidate-evidence-packet-contract` have been refreshed and promoted into `test:settings`; remaining rows are settings-refresh dirty-key join/key-parity ledger cleanup. |
| DOM selector, hide, and lifecycle registers | JSON content-control DOM hide boundary rows, tab-view lifecycle selector boundary, Shorts overlay owner proof | `direct-hide-writer-register` has been refreshed and promoted into `test:dom`; `dom-selector-instance-register` has been refreshed for `js/content/dom_state.js` selector patch sites and promoted into `test:dom`; `lifecycle-instance-register` and `repo-lifecycle-primitive-coverage` have been refreshed for website component lifecycle drift and promoted into `test:performance`; remaining lifecycle selector and JSON content-control hide rows belong in smaller DOM/JSON batches. |
| JSON comment continuation and provenance registers | comment author/channel provenance, keyword provenance, structural wrapper cleanup, continuation shortcut counts | Comment JSON proof rows need focused JSON/blocking refresh before they can be broad gates. |
| JSON content-control hide boundary registers | hideAllComments, hideAskButton, hideHomeFeed, hideMixPlaylists, hideVideoInfo, hideWatchPlaylistPanel, and related boundaries | Many older JSON content-control boundary docs still pin stale source counts or anchors. |
| JSON-first renderer, reference, metric, and video-meta registers | candidate extraction, implementation locus, metric artifact gate, reference docs, renderer traversal, video-meta parity/fetch/merge docs | JSON-first proof is still split across older NO-GO gates and focused lane tests. |
| YTM and YouTube Music parity slices | YTM showSheet enrichment, YTM injector/filter-logic parity, playlist selected-row parity | `ytm-show-sheet-injector-filter-logic-parity` and `ytm-show-sheet-enrichment-handoff` have been refreshed and promoted into `test:json`; remaining YTM proof slices are still partial and should be refreshed in focused whitelist/JSON/menu batches. |

## Release Lane Decision

Keep using focused lanes for logical changes:

```text
test:release
test:whitelist
test:blocking
test:json
test:dom
test:menu
test:performance
test:settings
test:smoke
test:audit-drift
```

Use `audit:runtime` as a cleanup backlog until the stale proof clusters above
are refreshed in smaller, reviewable batches.
