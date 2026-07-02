# FilterTube Post-3.3.2 Release Changelog Audit - 2026-07-02

Baseline: `v3.3.2` / `43e548cb` / `2026-05-31 23:08:56 +0530`

Prepared release: `v3.3.3`

This file records the release-facing work after the May 31, 2026 v3.3.2
release. It is intentionally under `docs/audit/` so the release proof does not
turn core product docs into a commit ledger.

## Release Scope Summary

v3.3.3 is an extension-first release focused on:

- parent/caregiver control that is easier to understand
- protected profile policy updates to verified devices
- explicit Home Pickup and Internet Pickup provider paths
- protected profile YouTube time limits
- reviewed rule-list imports for issue #62
- date-limited keyword rules for issue #63
- parent-first Help and fast help bubbles
- current YouTube desktop/YTM mobile DOM compatibility
- clearer release boundaries for future app/provider work

## Commit Lanes Since v3.3.2

| Lane | Main outcome | Representative commits |
| --- | --- | --- |
| Change-safety audit and lanes | Turned the paused broad audit into focused proof lanes and test/audit registries. | `0bb8783d`, `82ad089e`, `633735d9` |
| Managed parent/caregiver controls | Added protected profile authority, parent-managed edits, local policy state, profile-open checks, history, and conflict/reauth boundaries. | `378cd262`, `4ffba641`, `a32c928e`, `9ba5fb4b` |
| Family Device Updates | Simplified Accounts & Sync into family device flows with live send, explicit Home Pickup, explicit Internet Pickup, saved-update checks, and trusted-link validation. | `d3d0c4f6`, `bc507b6f`, `4367189e`, `bb8e04fe` |
| Pickup provider | Added self-hosted provider hooks, setup guidance, status page, queue counts, receipt cleanup, purge/expiry handling, and provider proof boundaries. | `0fe8e303`, `32620a30`, `1d69ac71`, `f60c4e47`, `14790ffb` |
| Protected profile time limits | Added and then fixed release-facing daily YouTube time limits, including already-open YouTube tab enforcement. | `dfc4305c`, `4b85957c` |
| Rule-list imports / issue #62 | Added reviewed CSV/TXT/simple JSON/BlockTube/raw HTTPS list imports with preview, target selection, templates, list management, pause/resume/remove, stale checks, and refresh. | `5fcb87f6`, `60d733ee`, `7895d3ab` |
| Date keyword filters / issue #63 | Added date-limited keyword rules, field validation, single-bound modes, and comment behavior based on parent video upload date. | `dfc4305c`, `1cba43c7`, `368368af`, `63d0cf23` |
| Help and UI simplification | Reworked Help and control-surface wording for parents/everyday users, documented two PIN types, and added fast help bubbles. | `9936e88a`, `3221dd8b`, `8542fa23`, `1c2dc4cc`, `a049c709`, `2fcbad38` |
| Current YouTube DOM refresh | Adapted/documented current desktop lockup DOM, playlist rows, stale setting refresh, and route-scoped chip handling. | `bc715923`, `e766237d` |

## What Changed For Users

### Parent / Caregiver Controls

The parent path is now:

1. Create or choose a protected profile.
2. Set what that profile can watch: Main YouTube, YouTube Kids, or both.
3. Set rules, list mode, keywords, channels, rule lists, and optional daily
   YouTube time.
4. Pair a verified device when rules need to reach another device.
5. Send now if both devices are open, or use a configured pickup provider for
   later collection.

The protected device still validates everything locally. A pickup endpoint is
transport, not authority.

### Two PINs

- Protected/child profile PIN: stops siblings or other local users from casually
  switching into that profile and can open receive-only sync.
- Parent/account/Master unlock: controls rules, trusted devices, backups,
  viewing access, time limits, and profile policy.

### Rule List Imports

Rule lists now cover the foundation requested in issue #62:

- CSV
- TXT
- simple JSON
- BlockTube-style JSON
- raw HTTPS URLs pointing to one of those formats

Every import previews parsed channels, keywords, skipped rows, and target
surface before it writes anything. Imported lists can be managed later.

Not claimed: a silent public list catalog that auto-applies arbitrary remote
lists. That needs governance, safety review, and user trust design.

### Date-Based Keywords

Keyword rows can now be date-limited:

- released on or after one date
- released on or before one date
- released between two dates

For comments, the date gate uses the parent video upload/publish date when
YouTube exposes it in player/video metadata. FilterTube does not invent a
comment upload date.

### YouTube And YTM DOM Refresh

The current desktop YouTube UI moved more card surfaces to camelCase lockup
classes. The current mobile YouTube/YTM UI also uses camelCase host classes:

- `YtmChipCloudRendererHost`
- `YtmBadgeAndBylineRendererHost`
- `YtmChannelThumbnailWithLinkRendererHost`
- `YtmCompactMediaItemHost`
- `YtmThumbnailOverlayResumePlaybackRendererHost`

Observed mobile chips:

- Home: `ytm-feed-filter-chip-bar-renderer` containing
  `ytm-chip-cloud-chip-renderer` rows.
- Watch: `ytm-single-column-watch-next-results-renderer` with
  `ytm-chip-cloud-renderer.YtmChipCloudRendererHost.chip-bar`.

Runtime boundary:

- Home/Search chip labels may be filtered.
- Watch chips are recommendation/navigation controls, not content cards.
- Video/card/comment/playlist filtering still applies to actual rows underneath
  the chip bar.

## Release Notes Updated

- `CHANGELOG.md`: added `## Version 3.3.3`.
- `data/release_notes.json`: added newest-first `3.3.3` dashboard entry.
- `README.md`: refreshed the visible What's New section.
- Browser manifests/package metadata: bumped from `3.3.2` to `3.3.3`.
- `docs/youtube_renderer_inventory.md`: updated YTM mobile DOM history and chip
  route boundaries.

## Explicitly Not Claimed Complete

- Hosted FilterTube Internet Pickup service deployment.
- Automatic LAN peer discovery.
- Silent public auto-subscribe list catalogs.
- Native Android/iOS parity for every new extension UI.
- User-installed two-device manual smoke evidence for final release.

## Release Check Notes

Minimum static release checks after this documentation prep:

```bash
node -e "JSON.parse(require('fs').readFileSync('data/release_notes.json', 'utf8'))"
node --check build.js
git diff --check
```

Full browser ZIP creation still runs through:

```bash
npm run build
```
