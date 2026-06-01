# FilterTube Change-Safety Runtime Audit Backlog

Date: 2026-06-01
Status: broad audit backlog, not a release-lane gate

## Command

```bash
node --test --test-reporter=tap tests/runtime/*.test.mjs > /tmp/filtertube-runtime.tap 2>&1
```

## Result

```text
tests: 4719
pass: 4491
fail: 228
```

## Boundary

The focused release lanes are the per-change proof system. The broad
`audit:runtime` suite is older current-boundary inventory and is still useful,
but it is not clean enough to be treated as a release blocker today.

## Failure Clusters

| Cluster | Examples | Current meaning |
|---|---|---|
| Source fingerprint and method-gap drift | `js/filter_logic.js`, `html/tab-view.html`, `manifest.json`, `data/release_notes.json`, older method-gap assertions for `63` files / `5473` callables | Existing proof rows need refresh after recent release, lag-fix, and callable-index work. |
| Generated/local artifact drift | `dist/*v3.3.1.zip`, `website/.next/BUILD_ID`, native runtime mirrors | Local build output and native/app mirror snapshots are stale relative to the working tree. |
| Inventory counter drift | callable, lifecycle, selector, network, message-transport, website render graph registers | Repo-wide registers need regenerated proof before they can be used as broad gates. |
| Website route surface drift | `website/components/footer-signal-art.js`, `website/components/hero-video.js`, downloads page, website client lifecycle counts | Website/dashboard release-copy work changed the route/component surface. |
| Version/package drift | package/manifests now target `3.3.2` while older tests still pin `3.3.1` boundaries | Release-candidate bump invalidated older staged-version assertions. |
| Optimization and route-surface gate drift | first optimization collector/contract gates, JSON-first route-surface fixture and metric gates | Older NO-GO proof gates still point at stale upstream counts, source anchors, or artifact prerequisites. |
| Native/runtime mirror drift | Nanah/native runtime mirror freshness, generated main runtime assets, broad extension source mirror drift | Mirror freshness proof remains useful but is not current enough to serve as a release blocker. |
| YouTube Music and YTM provenance drift | YouTube Music surface identity, YTM showSheet enrichment, YTM injector/filter-logic parity | YTM proof slices remain partial and several current-source fingerprints need refresh. |

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
