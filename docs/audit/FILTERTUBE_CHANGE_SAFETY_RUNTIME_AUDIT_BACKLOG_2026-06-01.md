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
pass: 4571
fail: 148
```

## Boundary

The focused release lanes are the per-change proof system. The broad
`audit:runtime` suite is older current-boundary inventory and is still useful,
but it is not clean enough to be treated as a release blocker today.

## Failure Clusters

| Cluster | Examples | Current meaning |
|---|---|---|
| Source fingerprint drift | `js/filter_logic.js`, `html/tab-view.html`, `manifest.json`, `data/release_notes.json` | Existing proof rows need refresh after recent release and lag-fix work. |
| Generated/local artifact drift | `dist/*v3.3.1.zip`, `website/.next/BUILD_ID`, native runtime mirrors | Local build output and native/app mirror snapshots are stale relative to the working tree. |
| Inventory counter drift | callable, lifecycle, selector, network, message-transport, website render graph registers | Repo-wide registers need regenerated proof before they can be used as broad gates. |
| Website route surface drift | `website/components/footer-signal-art.js`, `website/components/hero-video.js`, downloads page, website client lifecycle counts | Website/dashboard release-copy work changed the route/component surface. |
| Version/package drift | package/manifests now target `3.3.2` while older tests still pin `3.3.1` boundaries | Release-candidate bump invalidated older staged-version assertions. |

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
