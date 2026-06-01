# FilterTube Change-Safety Runtime Audit Backlog

Date: 2026-06-01
Status: broad audit backlog, not a release-lane gate

## Command

```bash
node --test --test-reporter=tap tests/runtime/*.test.mjs > /tmp/filtertube-runtime.tap 2>&1
```

## Result

```text
tests: 4727
pass: 4591
fail: 136
duration_ms: 40287.160708
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
| Callable, source-locus, and index drift | all-callable index counts, source-locus anchors, route component callable/render primitive counts | Repo-wide callable/source-locus registers need regenerated proof before they can become broad gates. |
| Audit goal and completion ledgers | audit completion gap register, collector verification output, JSON route/surface contract coverage links | Older goal ledgers still point at stale broad-suite counts or prerequisite gates. |
| Docs/audit boundary, packaging, and generated artifacts | audit markdown boundary, `compress-video`, design tokens, release notes, external navigation, generated main runtime assets, dist/website generated output | Release and generated-output proof remains useful, but several broad inventory rows need refresh. |
| Settings and content-control registers | compiled settings fields, content-control active-work matrix, content-control alias mutation | `compiled-settings-field-register` has been refreshed and promoted into `test:settings`; `content-control-active-work-matrix` has been refreshed and promoted into `test:performance`; content-control alias mutation still needs refreshed source/effect rows before serving as broad proof. |
| DOM selector, hide, and lifecycle registers | direct hide writers, DOM selector instance register, lifecycle primitive inventories, tab-view lifecycle selector boundary | DOM/lifecycle inventories have current-source drift that belongs in smaller DOM/performance batches. |
| JSON comment continuation and provenance registers | comment author/channel provenance, keyword provenance, structural wrapper cleanup, continuation shortcut counts | Comment JSON proof rows need focused JSON/blocking refresh before they can be broad gates. |
| JSON content-control hide boundary registers | hideAllComments, hideAskButton, hideHomeFeed, hideMixPlaylists, hideVideoInfo, hideWatchPlaylistPanel, and related boundaries | Many older JSON content-control boundary docs still pin stale source counts or anchors. |
| JSON-first renderer, reference, metric, and video-meta registers | candidate extraction, implementation locus, metric artifact gate, reference docs, renderer traversal, video-meta parity/fetch/merge docs | JSON-first proof is still split across older NO-GO gates and focused lane tests. |
| YTM and YouTube Music parity slices | YTM showSheet enrichment, YTM injector/filter-logic parity, playlist selected-row parity | YTM proof slices remain partial and should be refreshed in focused whitelist/JSON/menu batches. |

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
