# FilterTube P0 Fixture Gate Register - 2026-05-18

Status: source-derived audit register. This is not an implementation patch.

Completion is not proven. This register turns the readiness gate into a counted
fixture wall so the next implementation work cannot optimize one symptom while
leaving the same authority split alive elsewhere.

## Source Boundary

The register is derived from the `Minimum Gate Before First Behavior Patch`
section in `docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md`.

It does not prove future behavior. It proves the current minimum proof backlog:

```text
P0 fixture families: 23
P0 fixture names: 217
Behavior changes allowed before this wall is green: no
Allowed work: current-behavior tests, minimal fixtures, counters, and docs
```

The companion family proof index is
`docs/audit/FILTERTUBE_P0_FAMILY_PROOF_COVERAGE_2026-05-19.md` with runtime proof in
`tests/runtime/p0-family-proof-coverage-current-behavior.test.mjs`. It proves
that each of the 23 P0 families has a current-behavior doc/test pair. It does
not make any family future-proof or implementation-ready.

## Family Counts

| P0 family | Required fixture names | Primary risk blocked |
| --- | ---: | --- |
| no-work | 4 | Empty install and disabled-mode lag. |
| endpoint policy | 5 | False interception, parse/rewrite overwork, and route leaks. |
| network/fetch authority | 12 | YouTube-visible fetches, credentials, and external open budgets. |
| external navigation/link authority | 10 | Caller-supplied opens and inconsistent link policies. |
| release package parity | 10 | Package contents and public asset claims drifting from source. |
| native runtime sync authority | 9 | Extension/app runtime drift and raw capture contamination. |
| content/category predicates | 10 | Blank enabled controls waking JSON/DOM work. |
| keyword match authority | 10 | JSON/DOM/comment/exactness drift and false matches. |
| stats/time-saved authority | 10 | Stats writes from untrusted or non-hide side effects. |
| backup/export authority | 12 | Split backup/import/encryption/rotation authority. |
| profile/viewing-space authority | 10 | Profile, child, Main/Kids, and compile permission drift. |
| watch/player control authority | 12 | Watch-page controls, comments, rails, player, and fullscreen drift. |
| capture fixture traceability | 11 | Raw captures not yet mined into minimal behavior fixtures. |
| message trust | 14 | Spoofable or split message senders and side effects. |
| lifecycle | 5 | Observers/listeners/timers active without feature authority. |
| hide/restore authority | 12 | False hides, stale inline styles, stats/media coupling. |
| selector authority | 12 | Global selectors without route/surface/action ownership. |
| storage/cache key authority | 12 | Compiler/invalidation/reload key drift. |
| mutation | 4 | Lost/destructive settings mutations and revision drift. |
| prompt/onboarding | 7 | Competing prompt owners and unsafe acknowledgement/open paths. |
| manifest/permission | 7 | Browser package startup/permission/resource drift. |
| security/PIN lock | 8 | Locked profile and child/parent mutation bypasses. |
| rule mutation authority | 11 | Rule writes without shared actor/target/revision reports. |

## Five-Way Review Convergence

Five parallel read-only review passes converged on the same blocker: the code
has enough current-behavior evidence to explain the disease, but not enough
P0 fixtures to safely change behavior.

| Review slice | Converged finding | Gate impact |
| --- | --- | --- |
| JSON/renderers | `compactPlaylistRenderer`, modern collaborator `showSheetCommand`, direct watch cards, Shorts owner identity, shelves, and Mix cards still need blocklist, whitelist, identity-confidence, and false-hide fixtures. | Strengthens renderer JSON expansion and capture fixture traceability gates. |
| DOM/lifecycle | Members-only and playlist CSS/JS can target broad watch/shelf containers; fallback menu and quick-block lifecycles do page-wide work before final action gates; global card selectors still mix surfaces. | Strengthens lifecycle, hide/restore, and selector authority gates. |
| Endpoint/network/performance | Fetch/XHR interception still parses and rewrites before no-rule/disabled pass-through; substring endpoint matching is too broad; fallback identity fetches and synthetic clicks need explicit engagement budgets. | Strengthens no-work, endpoint policy, network/fetch, and engagement proof gates. |
| Settings/mutation/security | V3/V4 settings writes, list-mode transfer, sender trust, profile/PIN lock, storage invalidation, and Nanah scoped apply remain split across owners. | Strengthens mutation, storage, message trust, profile, security, and rule mutation gates. |
| Release/static/native | Build packaging is broader than manifest truth, public release creation is not draft-first, website/download claims can exceed artifact proof, and native runtime sync still has mirror drift/manual freshness gaps. | Strengthens release package parity, native runtime sync, public claim, static/generated/vendor, and raw-capture exclusion gates. |

## Highest-Risk Gate Clusters

### Empty Install And Disabled Mode

The audit already proves that empty blocklist and disabled mode can still parse,
stringify, harvest, install observers, or scan selectors. The P0 gate therefore
requires true no-work counters before changing endpoint or DOM behavior:

The first current-behavior slice for this family is
`docs/audit/FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md` and
`tests/runtime/p0-no-work-current-behavior.test.mjs`.

```text
empty_blocklist_desktop_home_no_work
empty_blocklist_mobile_home_no_work
empty_blocklist_watch_no_player_mutation
disabled_extension_no_mutation
seed_interception_no_rule_passes_through_without_parse
quick_block_disabled_zero_lifecycle_work
menu_disabled_zero_fallback_insertion
```

### Content / Category Predicate Authority

Content and category controls can wake JSON, DOM, metadata, and refresh work
even when visible keyword/channel rows are empty. The gate therefore requires
one predicate authority before changing duration, upload-date, uppercase,
category, route boolean, or metadata-fetch behavior.

The first current-behavior proof slice for this cluster is now
`docs/audit/FILTERTUBE_P0_CONTENT_CATEGORY_CURRENT_BEHAVIOR_2026-05-19.md` and
`tests/runtime/p0-content-category-current-behavior.test.mjs`. It pins
enabled-empty category activation drift, blank upload-date activation drift,
zero-duration `longer` false-hide behavior, stale threshold save behavior,
route-scope gaps for home/watch booleans, category storage refresh splits,
Main/Kids source-local independence, broad boolean route-scope gaps, and
metadata-fetch pending reason gaps.

```text
content_predicate_enabled_empty_category_is_inactive
content_predicate_blank_upload_date_is_inactive
content_predicate_zero_duration_longer_is_inactive
content_predicate_blank_duration_save_clears_old_threshold
content_predicate_route_scope_home_does_not_scan_watch_controls
content_predicate_route_scope_watch_does_not_scan_home_feed_controls
content_predicate_category_storage_change_refreshes_runtime
content_predicate_kids_and_main_are_independent
content_predicate_boolean_controls_are_route_scoped
content_predicate_metadata_fetch_requires_valid_pending_reason
```

### False-Hide Boundaries

Current evidence points to broad shelf/container/watch-shell risks. The P0 gate
therefore requires negative sibling-visible and owner-marker proof before
changing DOM fallback or renderer rules:

```text
selector_authority_watch_selectors_do_not_target_primary_player_shell_without_policy
selector_authority_members_only_badge_does_not_hide_watch_shell_without_fixture
hide_restore_members_only_restore_clears_members_marker_and_generic_marker
hide_restore_no_rule_path_does_not_leave_inline_display_none
watch_whitelist_mode_keeps_watch_metadata_and_rail_scaffolding_visible
```

### Hide / Restore Authority

Visual hiding currently crosses the shared helper, direct inline writers,
generated CSS rules, pending whitelist, optimistic user-action paths,
members/playlist fallback paths, shell cleanup, and recycled-card cleanup. The
gate therefore requires one hide/restore authority before changing visual hide,
restore, stats, media, or cleanup behavior.

The first current-behavior proof slice for this cluster is now
`docs/audit/FILTERTUBE_P0_HIDE_RESTORE_CURRENT_BEHAVIOR_2026-05-19.md` and
`tests/runtime/p0-hide-restore-current-behavior.test.mjs`. It pins shared
helper signature gaps, direct display writer/restorer gaps, disabled cleanup
marker gaps, generated CSS route-owner gaps, members-only local/broad behavior,
open-app shell cleanup classification gaps, pending whitelist identity-outcome
gaps, recycled-card cleanup invariants, shelf-title local restore behavior,
current-watch playback side effects, no-rule stale-inline gaps, and missing
writer registry proof.

```text
hide_restore_shared_toggle_reports_writer_reason_and_marker
hide_restore_direct_display_writes_have_registered_restorers
hide_restore_disabled_extension_clears_all_filtertube_hide_markers
hide_restore_css_control_rules_have_route_owner_and_disable_path
hide_restore_members_only_restore_clears_members_marker_and_generic_marker
hide_restore_open_app_button_hide_is_excluded_from_content_filter_stats
hide_restore_pending_whitelist_restore_requires_identity_outcome
hide_restore_recycled_card_cleanup_clears_identity_and_hide_markers
hide_restore_shelf_title_restore_clears_specific_marker
hide_restore_current_watch_owner_block_has_playback_side_effect_reason
hide_restore_no_rule_path_does_not_leave_inline_display_none
hide_restore_writer_registry_covers_toggle_visibility_direct_style_and_css
```

### Mutation / Revision Authority

The generic P0 mutation family is now separately pinned by
`docs/audit/FILTERTUBE_P0_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md` and
`tests/runtime/p0-mutation-current-behavior.test.mjs`. This slice keeps the
message-sender and security-lock findings connected to lower-level mutation
correctness:

```text
set_list_mode_copy_false_does_not_clear_blocklist
apply_settings_payload_cannot_override_background_revision
two_mutations_during_save_are_not_dropped
v3_to_v4_preserves_modes_and_whitelists
```

Current proof says the wall is not green: list-mode switching can still
merge/clear rows without a mutation plan, caller settings payloads can become
compiled cache truth, a second StateManager save can be skipped while one save
is in flight, and read-path V3-to-V4 migration does not preserve legacy
mode/whitelist state. Future work needs one `mutationAuthority` report with
actor, target profile/list, before/after revision, queued-save result,
destructive dry-run plan, storage keys, cache revision, broadcast scope, and
migration result.

### Keyword Match Authority

Keyword rows can affect JSON filtering, DOM fallback, comments,
channel-derived Filter All rows, Kids-to-Main sync, imports, and whitelist
fail-closed decisions. The gate therefore requires one keyword authority before
changing substring/exact behavior, comment scope, channel-derived metadata, or
whitelist keyword misses.

The first current-behavior proof slice for this cluster is now
`docs/audit/FILTERTUBE_P0_KEYWORD_MATCH_CURRENT_BEHAVIOR_2026-05-19.md` and
`tests/runtime/p0-keyword-match-current-behavior.test.mjs`. It pins non-exact
substring behavior, JSON/DOM exact-boundary drift, DOM normalized fallback
boundary drift, serialized comment keyword reconstruction gaps, global keyword
reach into comments, channel-derived metadata/comments drift, Kids-to-Main
source/action gaps, whitelist fail-closed keyword miss reporting, and legacy
compiled exactness migration gaps.

```text
keyword_non_exact_substring_policy_is_explicit
keyword_exact_unicode_boundary_matches_json_and_dom
keyword_dom_normalized_fallback_requires_both_boundaries
keyword_comment_serialized_rules_are_reconstructed
keyword_global_rules_do_not_affect_comments_unless_enabled
keyword_channel_derived_metadata_round_trips
keyword_channel_derived_comments_policy_round_trips
keyword_kids_to_main_sync_preserves_source_and_action
keyword_whitelist_keyword_miss_reports_fail_closed_reason
keyword_import_legacy_compiled_exactness_round_trips
```

### Selector Authority

DOM selection currently crosses global card selectors, feature-local fallback
selectors, watch/player selectors, Kids/YTM-shaped tags, fallback menus,
quick-block affordances, selected playlist rows, legacy layout code, and raw
capture-derived inventory docs. The gate therefore requires one selector
authority before splitting, deleting, or broadening selector behavior.

The first current-behavior proof slice for this cluster is now
`docs/audit/FILTERTUBE_P0_SELECTOR_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md` and
`tests/runtime/p0-selector-authority-current-behavior.test.mjs`. It pins global
mixed-surface selector state, DOM fallback no-rule zero-scan partiality,
quick-block disabled selector/lifecycle gaps, fallback menu primary-action gate
drift, broad watch/player selector gaps, members-only watch-shell targets,
selected playlist-row preservation gaps, Kids and YTM selector gate gaps,
legacy layout quarantine, inventory proof-status drift, and raw DOM fixture
boundaries.

```text
selector_authority_global_card_selector_split_by_surface_route_action
selector_authority_dom_fallback_no_rule_zero_card_scan
selector_authority_quick_block_disabled_zero_selector_scan
selector_authority_fallback_menu_uses_primary_menu_action_gate
selector_authority_watch_selectors_do_not_target_primary_player_shell_without_policy
selector_authority_members_only_badge_does_not_hide_watch_shell_without_fixture
selector_authority_playlist_selected_row_preserves_current_watch_card
selector_authority_kids_selectors_have_kids_surface_gate
selector_authority_ytm_selectors_are_not_claimed_for_main_release_without_fixture
selector_authority_legacy_layout_selectors_remain_quarantined_or_loaded_explicitly
selector_authority_inventory_rows_require_runtime_source_or_fixture_status
selector_authority_raw_capture_extracts_minimal_committed_dom_fixture
```

### Endpoint Policy

The endpoint-policy family is now started as a current-behavior slice in
`docs/audit/FILTERTUBE_P0_ENDPOINT_POLICY_CURRENT_BEHAVIOR_2026-05-18.md` and
`tests/runtime/p0-endpoint-policy-current-behavior.test.mjs`.

```text
seed_search_no_rule_pass_through
seed_browse_mobile_home_no_rule_pass_through
seed_next_watch_no_rule_pass_through
seed_player_metadata_only
seed_guide_no_rule_pass_through
```

### Lifecycle

The lifecycle family is now started as a current-behavior slice in
`docs/audit/FILTERTUBE_P0_LIFECYCLE_CURRENT_BEHAVIOR_2026-05-18.md` and
`tests/runtime/p0-lifecycle-current-behavior.test.mjs`.

```text
quick_block_disabled_zero_lifecycle_work
menu_disabled_zero_fallback_insertion
native_overlay_quiet_mode_pauses_runtime
fullscreen_pauses_non_player_runtime
navigation_disconnects_route_observers
```

### Watch / Player Control Authority

Watch-page behavior crosses UI toggles, background compiled settings,
content-script refresh keys, `/next`, `/player`, comments, playlist panels,
end-screen surfaces, whitelist rails, and fullscreen/native state. The gate
therefore requires one watch/player surface authority before changing watch,
player, comment, end-screen, or fullscreen behavior.

The first current-behavior proof slice for this cluster is now
`docs/audit/FILTERTUBE_P0_WATCH_PLAYER_CURRENT_BEHAVIOR_2026-05-19.md` and
`tests/runtime/p0-watch-player-current-behavior.test.mjs`. It pins
background invalidation drift, content refresh schema drift, no-rule `/next`
and `/player` rewrite gaps, comment continuation/scaffold authority gaps,
route-scoped sidebar drift, playlist panel identity-safety gaps, end-screen
JSON/DOM split, whitelist watch scaffolding partial guards, and fullscreen
non-player pause absence.

```text
watch_controls_background_invalidation_covers_all_compiled_keys
watch_controls_content_refresh_is_derived_from_background_schema
watch_next_no_rule_pass_through_without_json_rewrite
watch_player_no_rule_metadata_only_without_recommendation_mutation
watch_comments_hide_all_uses_comment_continuation_rewrite_only_for_comments
watch_comments_keyword_filter_does_not_hide_non_comment_watch_scaffolding
watch_sidebar_toggle_is_route_scoped_to_watch
watch_playlist_panel_toggle_does_not_disable_playlist_card_identity_fixtures
watch_endscreen_videowall_json_and_dom_have_separate_fixtures
watch_endscreen_cards_do_not_depend_on_broad_movie_player_hide
watch_whitelist_mode_keeps_watch_metadata_and_rail_scaffolding_visible
watch_fullscreen_pauses_non_player_dom_work
```

### Network / Fetch Authority

The network/fetch authority family is now started as a current-behavior slice in
`docs/audit/FILTERTUBE_P0_NETWORK_AUTHORITY_CURRENT_BEHAVIOR_2026-05-18.md` and
`tests/runtime/p0-network-authority-current-behavior.test.mjs`.

The recommendation-risk side-effect budget is started as a current-behavior
slice in `docs/audit/FILTERTUBE_ENGAGEMENT_BUDGET_CURRENT_BEHAVIOR_2026-05-19.md`
and `tests/runtime/engagement-budget-current-behavior.test.mjs`. This slice
does not add new counted P0 names; it strengthens the network/fetch,
watch/player, hide/restore, lifecycle, and message side-effect gates by proving
which current paths can fetch, click, scroll, pause, stop, or write identity
maps without one shared side-effect budget.

```text
network_authority_counts_all_tracked_fetch_xhr_open_surfaces
network_authority_release_note_fetches_are_extension_resource_only
network_authority_watch_identity_fetch_requires_valid_video_id_and_active_reason
network_authority_kids_identity_fetch_requires_kids_surface_reason
network_authority_channel_detail_fetch_rejects_untrusted_sender
network_authority_content_bridge_watch_fetch_requires_metadata_or_identity_reason
network_authority_subscription_import_fetch_requires_explicit_user_import
network_authority_seed_interception_no_rule_passes_through_without_parse
network_authority_fetch_credentials_policy_is_declared_per_owner
network_authority_website_remotes_are_website_only_claims
network_authority_external_tab_open_urls_are_allowlisted
network_authority_raw_capture_urls_never_become_runtime_fetch_targets
```

### External Navigation / Link Authority

The external navigation/link authority family is now started as a
current-behavior slice in
`docs/audit/FILTERTUBE_P0_EXTERNAL_NAVIGATION_CURRENT_BEHAVIOR_2026-05-19.md` and
`tests/runtime/p0-external-navigation-current-behavior.test.mjs`. It pins the
current runtime tab/window-opening counts, caller-supplied What’s New URL gap,
release-banner fallback navigation, popup internal dashboard routing, Ko-fi
support link, YouTube subscriptions import tab, extension target-blank rel
policy drift, website external-link component drift, missing URL-class
manifest, and raw-capture URL exclusion boundary.

```text
external_navigation_authority_counts_extension_runtime_open_surfaces
external_navigation_authority_open_whats_new_rejects_caller_supplied_url
external_navigation_authority_release_banner_fallbacks_use_allowlisted_extension_url
external_navigation_authority_popup_internal_opens_use_runtime_geturl
external_navigation_authority_kofi_link_is_fixed_and_user_initiated
external_navigation_authority_subscription_import_tab_uses_fixed_youtube_channels_url
external_navigation_authority_extension_target_blank_links_have_noopener_policy
external_navigation_authority_website_external_links_share_one_component_policy
external_navigation_authority_public_link_data_is_classified_by_url_class
external_navigation_authority_raw_capture_urls_never_become_open_targets
```

### Stats / Time-Saved Authority

The stats/time-saved family is now started as a current-behavior slice in
`docs/audit/FILTERTUBE_P0_STATS_TIME_SAVED_CURRENT_BEHAVIOR_2026-05-19.md` and
`tests/runtime/p0-stats-time-saved-current-behavior.test.mjs`. It pins the
current legacy background metric writer, missing sender/range validation,
missing structured hide-decision ids, DOM-attribute restore accounting,
`skipStats` media coupling, surface/legacy drift, dashboard refresh drift,
immediate storage writes, and no-rule hide count gaps.

```text
stats_rejects_untrusted_record_time_saved
stats_rejects_negative_or_nonfinite_seconds
stats_records_only_structured_hide_decisions
stats_restore_decrements_only_prior_counted_hide
stats_skipstats_does_not_pause_media_without_side_effect_reason
stats_surface_scope_main_and_kids_are_separate
stats_dashboard_refreshes_on_stats_by_surface_change
stats_storage_write_is_batched_or_debounced
stats_legacy_background_path_cannot_override_surface_stats
stats_no_rule_hide_path_does_not_increment_dashboard
```

### Renderer Leaks And Whitelist Confidence

JSON-first work is the right direction, but the gate must prove both sides:
content that should be removed is removed, and unrelated content remains
visible. The next renderer fixtures must cover blocklist, whitelist,
identity-confidence, and false-hide outcomes.

The first DOM/renderer bridge slice is
`docs/audit/FILTERTUBE_P0_DOM_RENDERER_CURRENT_BEHAVIOR_2026-05-19.md` and
`tests/runtime/p0-dom-renderer-current-behavior.test.mjs`. It binds renderer
gaps to DOM target and capture-boundary proof so JSON expansion cannot move
without matching selector/false-hide fixtures.

The first P0 renderer authority fixture slice is
`docs/audit/FILTERTUBE_P0_RENDERER_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md` and
`tests/runtime/p0-renderer-authority-current-behavior.test.mjs`. It pins
capture-backed blocklist and whitelist behavior for compact playlists and
show-sheet collaborators, direct watch-card pass-through, Shorts owner identity
drift, Mix avatar-stack false hides, shelf-title container false hides, and
inventory wording that is not runtime authority.

```text
renderer_authority_compact_playlist_blocklist_and_whitelist_gap
renderer_authority_show_sheet_collaborator_blocklist_and_whitelist_gap
renderer_authority_direct_watch_card_parts_gap
renderer_authority_shorts_owner_identity_gap
renderer_authority_mix_avatar_stack_false_hide_gap
renderer_authority_shelf_title_container_false_hide_gap
renderer_authority_inventory_claims_need_fixture_status
capture_traceability_main_next_compact_autoplay_renderer
capture_traceability_reel_item_owner_identity
capture_traceability_collab_homepage_avatar_stack_false_positive
capture_traceability_post_menu_insertion_boundaries
capture_traceability_playlist_json_creator_identity
```

### Mutation And Trust

Future simultaneous allow/block mode is blocked until current mutation paths
are made observable. The gate therefore requires rule mutation reports, sender
classes, profile authority, storage revision, and Nanah apply proof before any
data-shape migration.

The first current-behavior proof slice for this cluster is now
`docs/audit/FILTERTUBE_P0_MESSAGE_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md` and
`tests/runtime/p0-message-mutation-current-behavior.test.mjs`. It pins uneven
sender gates, caller-owned settings apply, injection/navigation/fetch/page
message spoof gaps, list-mode transfer behavior, secondary channel-add authority,
and Nanah scoped apply authority before any runtime behavior is changed.

The second current-behavior proof slice is now
`docs/audit/FILTERTUBE_P0_SETTINGS_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md` and
`tests/runtime/p0-settings-mutation-current-behavior.test.mjs`. It pins
locked-profile session gaps across list-mode, whitelist-add, whitelist-transfer,
and Kids mutations; list-mode transfer report gaps; encrypted import
target-profile drift; Nanah envelope validation gaps; and Nanah scoped apply
revision/lock/refresh gaps.

```text
set_list_mode_copy_false_does_not_clear_blocklist
apply_settings_payload_cannot_override_background_revision
rule_mutation_report_exists_for_background_add_filtered_channel
rule_mutation_report_exists_for_state_manager_add_keyword
rule_mutation_report_exists_for_state_manager_add_channel
rule_mutation_report_exists_for_kids_block_and_whitelist
rule_mutation_report_exists_for_list_mode_transfer
rule_mutation_report_exists_for_managed_child_edit
rule_mutation_report_exists_for_import_v3
rule_mutation_report_exists_for_nanah_scoped_apply
rule_mutation_report_exists_for_learned_identity_writes
content_script_channel_add_requires_allowed_youtube_action
page_world_identity_update_requires_owned_request
nanah_apply_requires_target_profile_authority
```

### Storage / Cache Key Authority

Storage changes currently flow through separate background compiler,
background invalidation, content-bridge refresh, StateManager reload,
shared-settings load/save, learned-map, stats, import/export, and Nanah paths.
The gate therefore requires one storage-key authority before changing cache,
refresh, map, migration, or sync behavior.

The first current-behavior proof slice for this cluster is now
`docs/audit/FILTERTUBE_P0_STORAGE_CACHE_CURRENT_BEHAVIOR_2026-05-19.md` and
`tests/runtime/p0-storage-cache-current-behavior.test.mjs`. It pins
compiler/invalidation drift, bridge map-only refresh as a local policy,
StateManager reload drift, settings load-key classification gaps, video map
cache/DOM policy splits, `statsBySurface` dashboard drift, read-path V4
writes, import/Nanah target-profile revision gaps, unknown-key no-op gaps, and
raw capture exclusion.

```text
storage_key_background_invalidation_covers_compiler_dependencies
storage_key_content_bridge_map_only_refresh_policy_is_named
storage_key_state_manager_reload_keys_match_ui_claims
storage_key_settings_shared_load_keys_are_classified
storage_key_video_channel_map_change_has_cache_and_dom_policy
storage_key_video_meta_map_change_has_cache_and_dom_policy
storage_key_stats_by_surface_change_refreshes_dashboard
storage_key_channel_map_only_change_does_not_force_dom_reprocess
storage_key_read_path_write_reports_migration_revision
storage_key_import_nanah_profile_write_reports_target_profile_revision
storage_key_unknown_key_is_ignored_with_no_runtime_reprocess
storage_key_raw_capture_evidence_never_becomes_storage_authority
```

### Prompt / Onboarding Authority

The prompt/onboarding family is now started as a current-behavior slice in
`docs/audit/FILTERTUBE_P0_PROMPT_ONBOARDING_CURRENT_BEHAVIOR_2026-05-19.md` and
`tests/runtime/p0-prompt-onboarding-current-behavior.test.mjs`. It pins that
install one-prompt behavior is only source-local, update can make release and
refresh prompts eligible, replay has no named owner, prompt acknowledgement is
not sender-classed, What’s New accepts caller URL, mobile viewport fit is only
partial, current manifest release notes exist, and no `promptCoordinator`
exists yet.

```text
install_shows_one_prompt_owner
update_prompt_priority_is_explicit
replay_prompt_has_named_owner
prompt_ack_rejects_wrong_sender_class
whats_new_url_is_allowlisted
prompt_overlay_fits_mobile_viewport
current_manifest_version_has_release_note_entry
```

### Manifest / Permission Authority

The manifest/permission family is now started as a current-behavior slice in
`docs/audit/FILTERTUBE_P0_MANIFEST_PERMISSION_CURRENT_BEHAVIOR_2026-05-19.md` and
`tests/runtime/p0-manifest-permission-current-behavior.test.mjs`. It pins that
default/Chrome have source-local MAIN-world seed startup, Firefox relies on
fallback injection without a seed-ready report, Opera has no proven explicit
world model, YouTube NoCookie is host-permitted but not actively matched by
content scripts or web-accessible resources, web-accessible resources are only
source-local allowlisted, build manifest validation is narrow, and permissions
are not mapped to trusted sender classes.

```text
chrome_manifest_main_world_seed_ready
firefox_fallback_injection_reports_seed_ready
opera_world_model_is_proven_or_not_claimed
youtube_nocookie_host_scope_is_classified
web_accessible_resources_are_allowlisted
build_rejects_manifest_permission_drift
permissions_map_to_trusted_sender_features
```

## Register Rules

1. A P0 fixture name is not satisfied by appearing in this register.
2. A current-behavior test is acceptable only when it pins today's behavior and
   clearly states which future expectation must replace or flip it.
3. A fixture is implementation-ready only when it has positive behavior,
   negative behavior, route/surface/mode context, side-effect counters, and raw
   capture provenance when applicable.
4. Raw root-level HTML/JSON/TXT captures remain evidence only. They must be
   reduced into minimal committed fixtures before they can prove a renderer,
   endpoint, selector, or DOM claim.
5. Behavior changes remain blocked while any P0 family lacks runnable proof for
   its named fixture obligations.

## Current Verdict

```text
The P0 fixture wall has 217 named obligations across 23 families.
The wall is not green.
The implementation gate remains closed.
```

Related artifacts:

- `docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md`
- `docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md`
- `docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md`
- `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md`
- `docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_ENDPOINT_POLICY_CURRENT_BEHAVIOR_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_LIFECYCLE_CURRENT_BEHAVIOR_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_NETWORK_AUTHORITY_CURRENT_BEHAVIOR_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_DOM_RENDERER_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_P0_MESSAGE_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_P0_SETTINGS_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_P0_STORAGE_CACHE_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_P0_WATCH_PLAYER_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_P0_HIDE_RESTORE_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_P0_MANIFEST_PERMISSION_CURRENT_BEHAVIOR_2026-05-19.md`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this P0 fixture gate can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
