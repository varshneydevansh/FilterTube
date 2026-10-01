# Historical post-v3.3.5 source index

Moved unchanged in substance from the top-level changelog so it cannot be mistaken for the v3.4.0 release delta. The v3.3.7 and later per-release inventories remain in [CHANGELOG.md](../CHANGELOG.md).

## Post-v3.3.5 source-history index

The following index records every commit after the v3.3.5 stability baseline
(`2fd04d3`) through the v3.3.6 source train. The detailed contracts remain in
the existing topic documents linked below; this table is the chronological
index, not a replacement for those documents. The v3.3.7 delta after release commit `3513cef9` is documented in the main changelog.

| Date | Commit | Recorded change | Canonical detail |
| --- | --- | --- | --- |
| 2026-07-05 | `4a658584` | Explicit MVP Android artifact reuse and honest version/code claims | [App release workflow](APP_RELEASE_AND_RUNTIME_SYNC_WORKFLOW.md) |
| 2026-07-05 | `6f7d7b46` | Restore bounded collaborator warmup on identity fast paths | [Renderer inventory](youtube_renderer_inventory.md) |
| 2026-07-06 | `54c35a22` | Simplify website language and add the internal Android testing ask | [Website surface changelog](WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md) |
| 2026-07-06 | `c0b3584c` | Add the website-style extension About surface | [Website surface changelog](WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md) |
| 2026-07-06 | `d73bd68c` | Move the Android testing CTA above dashboard statistics | [Website surface changelog](WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md) |
| 2026-07-06 | `9ac63173` | Align the dashboard Android CTA and stats panel | [Website surface changelog](WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md) |
| 2026-07-11 | `fdd98db8` | Add nearby-device discovery and simplify family controls | [Nanah plan](NANAH_P2P_PROJECT_PLAN.md) |
| 2026-07-11 | `eb14f105` | Resolve camelCase YouTube Music collaborator rosters | [Renderer inventory](youtube_renderer_inventory.md) |
| 2026-07-11 | `bd1cd6d4` | Link merged creator aliases for collaborator actions | [Functionality](FUNCTIONALITY.md) |
| 2026-07-11 | `31033f7c` | Preserve collaborator avatars through alias merging | [Renderer inventory](youtube_renderer_inventory.md) |
| 2026-07-15 | `7906a77c` | Document You/channel/account and channel-tab contracts | [JSON encyclopedia](json_paths_encyclopedia.md) |
| 2026-07-18 | `3ba76a33` | Document age-verification-on-video evidence | [Renderer inventory](youtube_renderer_inventory.md) |
| 2026-07-21 | `876d5a4c` | Bind managed policies to target devices | [Nanah plan](NANAH_P2P_PROJECT_PLAN.md) |
| 2026-07-21 | `7953a9fd` | Record native managed-policy decisions | [Technical docs](TECHNICAL.md) |
| 2026-07-21 | `c03ef03c` | Record native managed runtime synchronization | [Technical docs](TECHNICAL.md) |
| 2026-07-21 | `762b6580` | Preserve managed mailbox target binding | [Nanah plan](NANAH_P2P_PROJECT_PLAN.md) |
| 2026-07-21 | `d90a92f9` | Preserve keyed-profile managed decisions | [Technical docs](TECHNICAL.md) |
| 2026-07-21 | `3e063a35` | Preserve managed Pickup target-device binding | [Nanah plan](NANAH_P2P_PROJECT_PLAN.md) |
| 2026-07-21 | `21b71571` | Document mobile LIVE and ended-LIVE contracts | [JSON encyclopedia](json_paths_encyclopedia.md) |
| 2026-07-21 | `86c4802e` | Clarify adaptive-quality preference versus effective quality | [JSON encyclopedia](json_paths_encyclopedia.md) |
| 2026-07-22 | `a5b78c09` | Document mobile hashtag-browse contracts | [JSON encyclopedia](json_paths_encyclopedia.md) |
| 2026-07-22 | `5e8a1fbb` | Map native hashtag-browse fields | [Renderer inventory](youtube_renderer_inventory.md) |
| 2026-07-22 | `9466f9e0` | Document mobile Watch chapter contracts | [JSON encyclopedia](json_paths_encyclopedia.md) |
| 2026-07-25 | `77fc9ed4` | Map dismissible Home rich-shelf feedback | [Renderer inventory](youtube_renderer_inventory.md) |
| 2026-07-25 | `9b5168c0` | Add the independent Hide YouTube Playables control | [Playables audit](audit/FILTERTUBE_HIDE_YOUTUBE_PLAYABLES_CONTROL_2026-07-25.md) |
| 2026-07-25 | `c550c04e` | Record optional rich-shelf feedback boundaries | [Renderer inventory](youtube_renderer_inventory.md) |
| 2026-08-08 | `0f2f7349` | Improve JSON-first category filtering and document its scheduler/ownership contract | [Category behavior](CATEGORY_FILTER_CURRENT_BEHAVIOR_2026-08-08.md) |
| 2026-08-23 | `0920969b` | Checkpoint direct access, time/self-control, rule collections, BlockTube migration, Advert Void, experimental language/audio, UI/help, and focused proof | [Functionality](FUNCTIONALITY.md) |
| 2026-08-23 | `8c73613a` | Distribute the post-v3.3.5 work across canonical product, runtime, website, renderer, sync, and audit documentation | [Documentation index](../README.md) |
| 2026-08-23 | `73d4386c` | Add the reviewed device-wide update-refresh-reminder opt-out | [Update reminder audit](audit/FILTERTUBE_UPDATE_REFRESH_NOTIFICATION_RELEASE_SETTING_2026-08-23.md) |
| 2026-08-23 | `828c19b0` | Preserve Aysajan Eziz's original PR #66 contribution in the integrated history | [PR #66](https://github.com/varshneydevansh/FilterTube/pull/66) |
| 2026-08-23 | `e72ea70c` | Apply maintainer-reviewed opt-out semantics, Help copy, rollback behavior, and focused proof to PR #66 | [Update reminder audit](audit/FILTERTUBE_UPDATE_REFRESH_NOTIFICATION_RELEASE_SETTING_2026-08-23.md) |
| 2026-08-23 | `2f4612ea` | Merge the reviewed two-commit PR #66 history into master | [PR #66](https://github.com/varshneydevansh/FilterTube/pull/66) |

The `0920969b` checkpoint and its subsequent documentation and PR #66 review
commits form the v3.3.6 source train. Website edits are tracked in the
[website surface changelog](WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md), and
the [post-v3.3.5 ledger](POST_3_3_5_CHANGE_LEDGER_2026-08-23.md) retains the
file-level cross-check behind the canonical topic documentation.
