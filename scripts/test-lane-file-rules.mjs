// Declarative path ownership, split from test-lane-config.mjs to keep workflow files bounded.
export const FILE_LANE_RULES = Object.freeze([
  { id: 'release-and-readme-documentation-evidence', patterns: [/^docs\/audit\/artifacts\/(?:readme-sync-docs|release-preparation)-\d{4}-\d{2}-\d{2}\//], lanes: ['release', 'smoke'] },
  { id: 'design-captures', patterns: [/^docs\/design\/[a-z0-9-]+-\d{4}-\d{2}-\d{2}\/(?:[a-z0-9-]+\/)?[a-z0-9_-]+\.(?:webp|txt)$/], lanes: ['release', 'smoke'] },
  { id: 'website-simplification-evidence', patterns: [/^docs\/audit\/artifacts\/website-simplification-\d{4}-\d{2}-\d{2}\/.*\.(?:json|png|jpg|log)$/], lanes: ['release', 'smoke'] },
  { id: 'profile-reset-and-time-transactions', patterns: [/^js\/profile_preference_defaults\.js$/, /^tests\/runtime\/(?:profile-preference-reset|managed-time-usage-transactions)\.test\.mjs$/], lanes: ['release', 'settings', 'smoke'] },
  { id: 'controls-hardening-evidence', patterns: [/^docs\/audit\/artifacts\/controls-hardening-[^/]+\//], lanes: ['release', 'settings', 'smoke'] },
  { id: 'time-autoplay-review-evidence', patterns: [/^docs\/audit\/artifacts\/time-limits-and-autoplay-review\//], lanes: ['release', 'settings', 'smoke'] },
  { id: 'two-endpoint-sync-evidence', patterns: [/^tests\/runtime\/fixtures\/auto-sync-two-endpoint-harness\.js$/, /^docs\/audit\/artifacts\/auto-sync-two-endpoint-[^/]+\//], lanes: ['release', 'settings', 'smoke'] },
  { id: 'opt-in-device-auto-sync', patterns: [/^js\/(?:auto_sync_(?:queue|wakeup)|device_auto_sync(?:_ui)?|managed_auto_sync|personal_sync|personal_auto_sync_runtime)\.js$/, /^tests\/runtime\/(?:auto-sync-.*|device-auto-sync.*|managed-auto-sync.*|personal-sync|personal-auto-sync.*)\.test\.mjs$/, /^css\/device-auto-sync\.css$/], lanes: ['release', 'settings', 'smoke'] },
  { id: 'study-mode-data-and-catalog', patterns: [/^js\/shared\/study_(?:model|packs|setup)\.js$/, /^data\/study\/[^/]+\.json$/, /^scripts\/build-study-packs\.mjs$/, /^tests\/runtime\/(?:study-.*|nanah-keyword-merge-identity)\.test\.mjs$/], lanes: ['release', 'settings', 'smoke'] },
  { id: 'study-mode-engine', patterns: [/^js\/shared\/study_(?:engine|clock_guard|plan_drag)\.js$/, /^js\/study_background\.js$/, /^js\/study_ui\.js$/, /^css\/study\.css$/, /^js\/content\/study_overlay\.js$/, /^js\/shared\/effective_mode\.js$/, /^tests\/runtime\/effective-mode\.test\.mjs$/], lanes: ['release', 'whitelist', 'blocking', 'json', 'dom', 'settings', 'smoke'] },
  { id: 'extension-companions', patterns: [/^js\/mascots\.js$/, /^js\/doodles\.js$/, /^js\/paperkit_parity\.js$/, /^css\/mascots\.css$/, /^js\/dashboard_home\.js$/, /^js\/shared\/hidden_log\.js$/, /^css\/dashboard-home\.css$/, /^assets\/images\/mascots\/[a-z0-9_]+\.webp$/], lanes: ['release', 'settings', 'smoke'] },
  { id: 'extension-paperkit-and-avatars', patterns: [/^css\/paperkit(?:-edges|-parity)?\.css$/, /^scripts\/export-crayon-icons\.mjs$/, /^assets\/images\/homepage_hero_poster\.webp$/, /^assets\/images\/apps\/[a-z0-9_]+\.webp$/, /^assets\/images\/doodles\/[a-z0-9_]+\.webp$/, /^assets\/icons\/crayon\/[a-z0-9_]+\.svg$/, /^assets\/sounds\/[a-z0-9_]+\.ogg$/, /^assets\/fonts\/[A-Za-z0-9_-]+\.(?:ttf|txt)$/, /^tests\/runtime\/(?:profile-avatar-roundtrip|neutral-terminology)\.test\.mjs$/], lanes: ['release', 'settings', 'smoke'] },
  { id: 'app-parity-pass4', patterns: [/^js\/(?:shared\/ask_parent|ask_parent_background|shared\/live_chat_filter|content\/live_chat_(?:filter|identity))\.js$/, /^tests\/runtime\/app-parity-[a-z0-9-]+\.test\.mjs$/, /^tests\/runtime\/fixtures\/app-parity\//], lanes: ['release', 'blocking', 'whitelist', 'json', 'dom', 'settings', 'smoke'] },
  // Lossless backup contract: integrity check, app preferences and the PIN gate (FilterTubeApp SETTINGS_SYNC_MATRIX.md).
  { id: 'lossless-backup-runtime-and-contract', patterns: [/^js\/shared\/backup_integrity\.js$/, /^tests\/runtime\/lossless-backup\.test\.mjs$/, /^tests\/runtime\/fixtures\/lossless\//], lanes: ['release', 'settings', 'smoke'] },
  { id: 'kids-youtube-profiles-runtime', patterns: [/^js\/(?:shared\/kids_youtube_profiles|kids_youtube_profiles_background)\.js$/, /^tests\/runtime\/kids-youtube-profiles\.test\.mjs$/], lanes: ['release', 'settings', 'smoke'] },
  { id: 'local-playlists-runtime-and-contract', patterns: [/^js\/(?:shared\/local_playlists|local_playlists_store)\.js$/, /^tests\/runtime\/local-playlists\.test\.mjs$/], lanes: ['release', 'settings', 'smoke'] },
  { id: 'video-notes-runtime-and-contract', patterns: [/^js\/(?:shared\/saved_video_notes|content\/video_notes|video_notes_(?:background|editor|store))\.js$/, /^tests\/runtime\/(?:video-notes-.*\.test\.mjs|fixtures\/video-notes\/)/, /^html\/video-notes\.html$/, /^css\/video-notes\.css$/, /^docs\/design\/VIDEO_NOTES_/, /^docs\/audit\/artifacts\/watch-notes-/], lanes: ['release', 'blocking', 'whitelist', 'json', 'dom', 'performance', 'settings', 'smoke'] },
  { id: 'advert-streaming-backoff-evidence', patterns: [/^docs\/audit\/artifacts\/advert-streaming-backoff-[^/]+\/.*\.json$/], lanes: ['release', 'performance', 'smoke'] },
  { id: 'content-only-playback-evidence', patterns: [/^docs\/audit\/artifacts\/content-only-playback-[^/]+\//], lanes: ['release', 'performance', 'smoke'] },
  { id: 'content-only-playback-runtime', patterns: [/^js\/(?:shared\/content_playback_(?:source|resolver)|content\/content_playback(?:_(?:admission|captions|native|player|response|transport))?)\.js$/], lanes: ['release', 'blocking', 'whitelist', 'json', 'dom', 'performance', 'settings', 'smoke'] },
  { id: 'test-lane-file-rules', patterns: [/^scripts\/test-lane-file-rules\.mjs$/], lanes: ['release', 'performance', 'smoke'] },
  { id: 'installed-firefox-android-evidence', patterns: [/^docs\/audit\/FIREFOX_ANDROID_.*\.json$/], lanes: ['release', 'smoke'] },
  { id: 'minimum-view-count-runtime', patterns: [/^js\/shared\/view_count(?:_isolated)?\.js$/], lanes: ['blocking', 'whitelist', 'json', 'dom', 'settings', 'performance'] },
  { id: 'search-suggestions-filter', patterns: [/^js\/shared\/(?:search_suggestions_filter|paced_fetch|channel_search)\.js$/, /^js\/content\/(?:search_suggestions_dom|channel_search_shelf)\.js$/, /^tests\/runtime\/(?:search-suggestions-filter|paced-fetch|channel-search|manifest-world-split)\.test\.mjs$/], lanes: ['release', 'blocking', 'whitelist', 'json', 'smoke'] },
  { id: 'allowlist-feed', patterns: [/^js\/shared\/(?:allowlist_feed|feed_guard|narrowed_mode)\.js$/, /^js\/content\/(?:allowlist_feed_view|narrowed_view)\.js$/, /^tests\/runtime\/(?:allowlist-feed|narrowed-mode)\.test\.mjs$/], lanes: ['release', 'blocking', 'whitelist', 'json', 'dom', 'smoke'] },
  { id: 'external-playback-admission-runtime', patterns: [/^js\/content\/(?:external_youtube_guard|external_youtube_network|admission_overlay)\.js$/], lanes: ['release', 'blocking', 'whitelist', 'json', 'dom', 'performance', 'settings'] },
  { id: 'ui-localization-catalogs', patterns: [/^(?:data\/ui_locales|_locales)\//], lanes: ['release', 'settings', 'smoke'] },
  { id: 'localization-validation-tools', patterns: [/^scripts\/(?:audit-ui-copy\.py|(?:check|extract|merge)-(?:json-keys|ui-locales|release-note-locales|family-ui-fallbacks|static-ui-copy|ui-locale-batch|ui-locale-drafts)\.(?:mjs|cjs|py))$/], lanes: ['release', 'settings', 'smoke'] },
  { id: 'family-device-evidence-tools', patterns: [/^scripts\/(?:create-family-device-(?:capture-checklist|evidence-packet)|import-family-device-downloaded-evidence|report-family-device-(?:phase11-status|phase12-status|provider-surface|release-readiness)|update-family-device-evidence-log|validate-family-device-evidence)\.mjs$/], lanes: ['release', 'settings', 'smoke'] },
  { id: 'family-device-review-evidence', patterns: [/^docs\/design\/device-sync\//, /^docs\/audit\/(?:issue-safety-formal|artifacts\/responsive-settings-[^/]+|evidence\/family-devices-[^/]+)\//], lanes: ['release', 'settings', 'smoke'] },
  { id: 'release-design-evidence', patterns: [/^docs\/design\/(?:ANDROID-PLAY-STORE-CTA-[^/]+\.md|store-listing-drafts\/|EXTENSION_UX_AUDIT_[^/]+\.md|EXTENSION_ANDROID_PARITY_AUDIT_[^/]+\.md|PARITY_PASS\d+\.md|screens-\d{4}-\d{2}-\d{2}(?:-[a-z0-9]+)?\/|\d{4}-\d{2}-\d{2}-[a-z0-9-]+\/)/, /^funding\.json$/], lanes: ['release', 'smoke'] },
  { id: 'android-port-ledger', patterns: [/^docs\/parity\/(?:HOW_TO_PORT\.md|PORT_LEDGER\.(?:tsv|md)|FILE_MAP\.tsv)$/, /^docs\/parity\/screens\/\d{4}-\d{2}-\d{2}-[a-z0-9-]+\//, /^tools\/parity\/(?:lib|ledger|derive-file-map)\.mjs$/, /^tools\/parity\/ledger\.test\.mjs$/], lanes: ['release', 'smoke'] },
  { id: 'nanah-storage-lock-fixture', patterns: [/^tests\/runtime\/helpers\/nanah-storage-lock-fixture\.mjs$/], lanes: ['release', 'settings', 'smoke'] },
  {
    id: 'seed-json-runtime',
    patterns: [/^js\/seed\.js$/],
    lanes: ['json', 'performance']
  },
  {
    id: 'injector-main-world-json',
    patterns: [/^js\/injector\.js$/],
    lanes: ['json', 'whitelist', 'performance']
  },
  {
    id: 'filter-logic-core',
    patterns: [/^js\/filter_logic\.js$/],
    lanes: ['json', 'blocking', 'whitelist', 'performance']
  },
  {
    id: 'dom-fallback-runtime',
    patterns: [/^js\/content\/(?:dom_fallback|queue_blocked_skip)\.js$/],
    lanes: ['whitelist', 'dom', 'blocking', 'performance']
  },
  {
    id: 'quick-block-menu-runtime',
    patterns: [/^js\/content\/block_channel\.js$/],
    lanes: ['menu', 'blocking', 'performance']
  },
  {
    id: 'content-menu-runtime',
    patterns: [/^js\/content\/menu\.js$/],
    lanes: ['menu']
  },
  {
    id: 'content-bridge-injection-runtime',
    patterns: [/^js\/content\/bridge_injection\.js$/],
    lanes: ['release', 'json', 'performance', 'settings']
  },
  {
    id: 'collab-dialog-runtime',
    patterns: [/^js\/content\/collab_dialog\.js$/],
    lanes: ['whitelist', 'blocking', 'menu', 'performance']
  },
  {
    id: 'dom-helper-state-runtime',
    patterns: [/^js\/content\/(?:dom_helpers|dom_state)\.js$/],
    lanes: ['whitelist', 'blocking', 'dom', 'performance']
  },
  {
    id: 'prompt-overlay-runtime',
    patterns: [/^js\/content\/(?:first_run_prompt|release_notes_prompt)\.js$/],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'content-bridge-runtime',
    patterns: [/^js\/content_bridge\.js$/],
    lanes: ['menu', 'settings', 'blocking', 'json', 'dom', 'whitelist', 'performance']
  },
  {
    id: 'bridge-settings-runtime',
    patterns: [/^js\/content\/bridge_settings\.js$/],
    lanes: ['settings', 'json', 'performance']
  },
  {
    id: 'background-runtime',
    patterns: [/^js\/background\.js$/],
    lanes: ['release', 'whitelist', 'blocking', 'json', 'performance', 'settings']
  },
  {
    id: 'shared-settings-runtime',
    patterns: [/^js\/settings_shared\.js$/],
    lanes: ['settings', 'blocking', 'whitelist']
  },
  {
    id: 'state-io-runtime',
    patterns: [/^js\/(?:state_manager|io_manager|imported_channel_enrichment)\.js$/],
    lanes: ['settings']
  },
  {
    id: 'extension-ui-runtime',
    patterns: [/^js\/(?:popup|tab-view|render_engine|ui_components|managed_parent_command_center|rule_list_import_reports|family_device_navigation|ui_localization|ui_localization_boot|ui_static_copy_capture)\.js$/],
    lanes: ['release', 'whitelist', 'blocking', 'menu', 'settings', 'smoke']
  },
  {
    id: 'content-controls-catalog-runtime',
    patterns: [/^js\/content_controls_catalog\.js$/],
    lanes: ['whitelist', 'blocking', 'json', 'dom', 'menu', 'performance', 'settings']
  },
  { id: 'nanah-sync-runtime', patterns: [/^js\/(?:nanah_sync_adapter|nanah_qr_scanner|nanah_storage_lock|nanah_pairing_ui)\.js$/, /^tests\/runtime\/(?:managed-policy-payload-integrity|nanah-pairing-ui)\.test\.mjs$/], lanes: ['release', 'settings', 'smoke'] },
  {
    id: 'nanah-managed-policy-runtime',
    patterns: [/^js\/nanah_managed_(?:live_policy|open_sync|mailbox_client|local_network_client)\.js$/],
    lanes: ['release', 'settings', 'smoke']
  },
  { id: 'managed-admin-authority-runtime', patterns: [/^js\/managed_admin_authority\.js$/], lanes: ['release', 'settings', 'smoke'] },
  { id: 'parent-mode-runtime', patterns: [/^js\/parent_mode\.js$/], lanes: ['release', 'settings', 'smoke'] },
  { id: 'security-crypto-runtime', patterns: [/^js\/security_manager\.js$/], lanes: ['release', 'settings', 'smoke'] },
  { id: 'legacy-layout-quarantine', patterns: [/^js\/layout\.js$/], lanes: ['release', 'dom', 'smoke'] },
  { id: 'identity-runtime', patterns: [/^js\/shared\/identity\.js$/, /^js\/content\/(?:dom_extractors|handle_resolver)\.js$/], lanes: ['blocking', 'menu', 'whitelist'] },
  {
    id: 'extension-ui-build-helper-surface',
    patterns: [/^scripts\/build-extension-ui\.mjs$/, /^scripts\/verify-managed-app-policy-contract\.mjs$/],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'vendor-sync-build-helper-surface',
    patterns: [/^scripts\/(?:build-nanah-vendor\.mjs|build-lock\.cjs)$/],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'managed-delivery-reference-provider-surface',
    patterns: [/^scripts\/managed-delivery-(?:provider|lan-discovery)\.mjs$/],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'release-build-surface',
    patterns: [/^manifest(?:\.[a-z]+)?\.json$/, /^build\.js$/, /^scripts\/build-.*\.mjs$/],
    lanes: ['release']
  },
  { id: 'root-metadata-surface', patterns: [/^package(?:-lock)?\.json$/, /^\.gitignore$/], lanes: ['release', 'smoke'] },
  {
    id: 'root-legal-doc-surface',
    patterns: [/^LICENSE$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'root-product-doc-surface',
    patterns: [/^(?!README\.md$|CHANGELOG\.md$)[^/]+\.md$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'lane-workflow-surface',
    patterns: [/^scripts\/(?:run-test-lane|test-lane-config|audit-proof-drift)\.mjs$/, /^docs\/audit\/TEST_LANE_MATRIX\.md$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'live-smoke-artifact-surface',
    patterns: [/^docs\/audit\/artifacts\/release-live-youtube-spa-smoke\/.*\.(?:json|mjs)$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'managed-remote-delivery-smoke-artifact-surface',
    patterns: [/^docs\/audit\/artifacts\/managed-remote-delivery-smoke\/.*\.(?:json|mjs)$/],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'managed-extension-installed-smoke-artifact-surface',
    patterns: [
      /^docs\/audit\/artifacts\/managed-extension-installed-smoke\/.*\.(?:json|mjs)$/,
      /^scripts\/create-managed-extension-installed-smoke-artifact\.mjs$/
    ],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'managed-pickup-provider-ownership-surface',
    patterns: [
      /^docs\/audit\/FILTERTUBE_MANAGED_PICKUP_PROVIDER_OWNERSHIP_GATE_2026-06-21\.md$/,
      /^docs\/audit\/artifacts\/managed-pickup-provider-ownership\/.*\.(?:json|mjs)$/,
      /^scripts\/create-managed-pickup-provider-ownership-artifact\.mjs$/
    ],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'managed-app-parity-smoke-artifact-surface',
    patterns: [
      /^docs\/audit\/artifacts\/managed-app-parity-smoke\/.*\.(?:json|mjs)$/,
      /^scripts\/create-managed-app-parity-smoke-artifact\.mjs$/
    ],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'managed-native-runtime-sync-handoff-surface',
    patterns: [
      /^docs\/audit\/artifacts\/managed-native-runtime-sync-handoff\/.*\.(?:json|mjs)$/,
      /^scripts\/create-managed-native-runtime-sync-handoff\.mjs$/
    ],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'audit-performance-artifact-surface',
    patterns: [/^docs\/audit\/artifacts\/empty-install-idle-probe\.mjs$/],
    lanes: ['performance', 'smoke']
  },
  {
    id: 'managed-app-policy-contract-artifact',
    patterns: [/^docs\/audit\/artifacts\/managed-app-policy-contract-v\d+\.json$/],
    lanes: ['settings', 'release', 'smoke']
  },
  {
    id: 'public-release-copy',
    patterns: [/^README\.md$/, /^CHANGELOG\.md$/, /^data\/release_notes\.json$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'product-doc-surface',
    patterns: [/^docs\/(?!audit\/)[^/]+\.md$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'extension-popup-shell-surface',
    patterns: [
      /^html\/popup\.html$/,
      /^css\/popup\.css$/,
      /^js\/ui-shell\/popup-shell\.js$/,
      /^src\/extension-shell\/popup\.jsx$/
    ],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'extension-tab-view-settings-shell-surface',
    patterns: [/^html\/tab-view\.html$/],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'quarantined-content-css-surface',
    patterns: [/^css\/(?:content|filter|layout)\.css$/],
    lanes: ['release', 'dom', 'smoke']
  },
  {
    id: 'extension-ui-surface',
    patterns: [/^html\/.*\.html$/, /^css\/.*\.css$/, /^js\/ui-shell\/.*\.js$/, /^src\/extension-shell\//],
    lanes: ['release', 'smoke']
  },
  {
    id: 'extension-static-asset-surface',
    patterns: [/^assets\/.*\.(?:png|mp4)$/, /^icons\/.*\.(?:png|svg)$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'design-token-surface',
    patterns: [/^design\/.*\.json$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'vendor-bundle-surface',
    patterns: [/^js\/vendor\/.*(?:\.bundle\.js|\.LICENSE\.txt)$/],
    lanes: ['release', 'settings', 'smoke']
  },
  {
    id: 'release-helper-script-surface',
    patterns: [/^scripts\/(?:compress-video\.swift|sync-native-runtime\.mjs)$/],
    lanes: ['release', 'smoke']
  },
  {
    id: 'website-public-surface',
    patterns: [/^website\//],
    lanes: ['release', 'smoke']
  },
  {
    id: 'audit-release-proof-doc',
    patterns: [/^docs\/audit\/.*(?:RELEASE|PACKAGE|MANIFEST|PUBLIC|BUILD|ROOT_PACKAGE|SOURCE_BOUNDARY|TRACKED_PUBLIC).*\.md$/i],
    lanes: ['release']
  },
  {
    id: 'audit-whitelist-proof-doc',
    patterns: [/^docs\/audit\/.*WHITELIST.*\.md$/i],
    lanes: ['whitelist']
  },
  {
    id: 'audit-blocking-proof-doc',
    patterns: [/^docs\/audit\/.*(?:BLOCK|KEYWORD|CHANNEL|COMMENT).*\.md$/i],
    lanes: ['blocking']
  },
  {
    id: 'audit-json-proof-doc',
    patterns: [/^docs\/audit\/(?!.*RELEASE_NOTES_JSON).*(?:JSON|YTM|YOUTUBE_MUSIC|INJECTOR).*\.md$/i],
    lanes: ['json']
  },
  {
    id: 'audit-dom-proof-doc',
    patterns: [/^docs\/audit\/.*DOM.*\.md$/i],
    lanes: ['dom']
  },
  {
    id: 'audit-visual-hide-proof-doc',
    patterns: [/^docs\/audit\/.*(?:DIRECT_HIDE|HIDE_RESTORE|DOM_HIDE|BROAD_HIDE|CSS_STYLE_HIDE|VISIBILITY_CLEANUP|P0_HIDE_RESTORE).*\.md$/i],
    lanes: ['dom']
  },
  {
    id: 'audit-menu-proof-doc',
    patterns: [/^docs\/audit\/.*(?:MENU|QUICK|COLLAB|DROPDOWN).*\.md$/i],
    lanes: ['menu']
  },
  {
    id: 'audit-identity-proof-doc',
    patterns: [/^docs\/audit\/.*(?:IDENTITY|RESOLVER|HANDLE|WATERFALL).*\.md$/i],
    lanes: ['whitelist', 'blocking', 'menu']
  },
  {
    id: 'audit-list-state-proof-doc',
    patterns: [/^docs\/audit\/.*(?:ALIAS|LIST_MODE|ROW_LIST_MODE).*\.md$/i],
    lanes: ['whitelist', 'blocking', 'settings']
  },
  {
    id: 'audit-renderer-surface-proof-doc',
    patterns: [/^docs\/audit\/.*(?:RENDERER|LOCKUP|WATCH|UPNEXT|SEARCH|SHORTS|ENDSCREEN|END_SCREEN|AUTOPLAY|PLAYER|PLAYLIST|KIDS_BROWSE|CARD).*\.md$/i],
    lanes: ['whitelist', 'blocking', 'json', 'dom']
  },
  {
    id: 'audit-filter-logic-rule-proof-doc',
    patterns: [/^docs\/audit\/.*FILTER_LOGIC_(?:METHOD_SEMANTIC_REGISTER|RULE_FIELD_EFFECT_SEMANTIC_REGISTER|RULE_PATH_SEMANTIC_REGISTER|DIRECT_RENDERER_RULE_SEMANTIC_REGISTER).*\.md$/i],
    lanes: ['whitelist', 'blocking', 'json', 'dom', 'performance']
  },
  {
    id: 'audit-managed-local-network-proof-doc',
    patterns: [/^docs\/audit\/.*(?:LOCAL_NETWORK|LAN).*MANAGED.*\.md$/i, /^docs\/audit\/.*MANAGED.*(?:LOCAL_NETWORK|LAN).*\.md$/i],
    lanes: ['settings']
  },
  {
    id: 'audit-network-transport-proof-doc',
    patterns: [/^docs\/audit\/.*(?:NETWORK|FETCH|XHR|CREDENTIAL).*\.md$/i],
    lanes: ['json', 'performance']
  },
  {
    id: 'audit-message-trust-injection-proof-doc',
    patterns: [/^docs\/audit\/.*(?:_|\/)(?:MAIN_WORLD_MESSAGE|INJECTION|TRUST|STARTUP_INJECTION)(?:_|\.md$)/i],
    lanes: ['release', 'json', 'settings']
  },
  {
    id: 'audit-message-state-proof-doc',
    patterns: [/^docs\/audit\/.*MESSAGE.*\.md$/i],
    lanes: ['settings']
  },
  {
    id: 'audit-page-lifecycle-proof-doc',
    patterns: [/^docs\/audit\/.*(?:CONTENT_BRIDGE_LIFECYCLE|CONTENT_BRIDGE_STARTUP_TIMING|EMPTY_INSTALL_IDLE_OBSERVER|LIFECYCLE_EFFECT|LIFECYCLE_INSTANCE|LIFECYCLE_OWNER|LIFECYCLE_TEARDOWN|PAGE_RUNTIME_LIFECYCLE|P0_LIFECYCLE|SELECTOR_LIFECYCLE).*\.md$/i],
    lanes: ['dom', 'performance']
  },
  {
    id: 'audit-seed-startup-proof-doc',
    patterns: [/^docs\/audit\/.*(?:DOCUMENT_START_ZERO_FLASH|SEED_PAGE_GLOBAL_PATCH_TEARDOWN).*\.md$/i],
    lanes: ['json', 'performance']
  },
  {
    id: 'audit-performance-proof-doc',
    patterns: [/^docs\/audit\/.*(?:_|\/)(?:PERFORMANCE|NO_WORK|CACHE|SPA|LAG|ACTIVE_WORK|ACTIVE_RULE|DISABLED_RUNTIME|MASTER_SWITCH|DIAGNOSTIC|LOGGING|CONSOLE)(?:_|\.md$)/i],
    lanes: ['performance']
  },
  {
    id: 'audit-code-burden-proof-doc',
    patterns: [/^docs\/audit\/.*(?:CODE_BURDEN|DECLUTTER|STRUCTURAL_BURDEN|LARGE_FILE|LARGE_SOURCE).*\.md$/i],
    lanes: ['performance']
  },
  {
    id: 'audit-source-locus-proof-doc',
    patterns: [/^docs\/audit\/.*SOURCE_LOCUS.*\.md$/i],
    lanes: ['performance']
  },
  {
    id: 'audit-settings-proof-doc',
    patterns: [/^docs\/audit\/.*(?:SETTING|PROFILE|STORAGE|IMPORT|EXPORT|SYNC|COMPILED|BACKUP|NANAH|ALIAS|MANAGED_POLICY|ACTION_HISTORY).*\.md$/i],
    lanes: ['settings']
  },
  {
    id: 'audit-managed-child-local-authority-proof-doc',
    patterns: [/^docs\/audit\/FILTERTUBE_MANAGED_CHILD_LOCAL_AUTHORITY_CONTRACT_.*\.md$/],
    lanes: ['settings']
  },
  {
    id: 'audit-source-truth-claim-proof-doc',
    patterns: [/^docs\/audit\/FILTERTUBE_SOURCE_OF_TRUTH_CLAIM_REGISTER_.*\.md$/i],
    lanes: ['settings']
  },
  {
    id: 'audit-proof-doc',
    patterns: [/^docs\/audit\/.*\.md$/],
    lanes: ['smoke']
  },
  {
    id: 'runtime-release-test',
    patterns: [/^tests\/runtime\/.*(?:release|package|manifest|public|build|root-package).*\.test\.mjs$/i],
    lanes: ['release']
  },
  {
    id: 'runtime-whitelist-test',
    patterns: [/^tests\/runtime\/.*whitelist.*\.test\.mjs$/i],
    lanes: ['whitelist']
  },
  {
    id: 'runtime-blocking-test',
    patterns: [/^tests\/runtime\/.*(?:block|keyword|channel|comment).*\.test\.mjs$/i],
    lanes: ['blocking']
  },
  {
    id: 'runtime-json-test',
    patterns: [/^tests\/runtime\/.*(?:json|seed|xhr|network|ytm|youtube-music).*\.test\.mjs$/i],
    lanes: ['json']
  },
  {
    id: 'runtime-dom-test',
    patterns: [/^tests\/runtime\/.*dom.*\.test\.mjs$/i],
    lanes: ['dom']
  },
  {
    id: 'runtime-visual-hide-test',
    patterns: [/^tests\/runtime\/.*(?:direct-hide|hide-restore|dom-hide|broad-hide|css-style-hide|visibility-cleanup).*\.test\.mjs$/i],
    lanes: ['dom']
  },
  {
    id: 'runtime-menu-test',
    patterns: [/^tests\/runtime\/.*(?:menu|quick|collab|dropdown).*\.test\.mjs$/i],
    lanes: ['menu']
  },
  {
    id: 'runtime-performance-test',
    patterns: [/^tests\/runtime\/.*(?:performance|no-work|cache|spa|active-work).*\.test\.mjs$/i],
    lanes: ['performance']
  },
  {
    id: 'runtime-code-burden-test',
    patterns: [/^tests\/runtime\/.*(?:code-burden|declutter|large-file|structural-burden).*\.test\.mjs$/i],
    lanes: ['performance']
  },
  {
    id: 'runtime-source-locus-test',
    patterns: [/^tests\/runtime\/.*source-locus.*\.test\.mjs$/i],
    lanes: ['performance']
  },
  {
    id: 'runtime-settings-test',
    patterns: [/^tests\/runtime\/.*(?:setting|profile|storage|import|export|sync|compiled|alias).*\.test\.mjs$/i],
    lanes: ['settings']
  },
  {
    id: 'runtime-source-truth-claim-test',
    patterns: [/^tests\/runtime\/source-of-truth-claim-register-current-behavior\.test\.mjs$/],
    lanes: ['settings']
  },
  {
    id: 'runtime-filter-engine-harness',
    patterns: [/^tests\/runtime\/harness\/load-filter-engine\.mjs$/],
    lanes: ['whitelist', 'blocking', 'json', 'dom', 'menu', 'performance', 'settings', 'smoke']
  },
  {
    id: 'runtime-seed-harness',
    patterns: [/^tests\/runtime\/harness\/load-seed-runtime\.mjs$/],
    lanes: ['whitelist', 'json', 'performance', 'smoke']
  },
  {
    id: 'youtube-json-fixture-surface',
    patterns: [/^tests\/runtime\/fixtures\/.*\.json$/],
    lanes: ['json', 'smoke']
  },
  {
    id: 'youtube-dom-fixture-surface',
    patterns: [/^tests\/runtime\/fixtures\/.*\.html$/],
    lanes: ['dom', 'smoke']
  },
  {
    id: 'youtube-whitelist-fixture-surface',
    patterns: [/^tests\/runtime\/fixtures\/.*(?:whitelist|allow|kids|shorts|watch|upnext|endscreen|autoplay|playlist|ytm).*$/i],
    lanes: ['whitelist']
  },
  {
    id: 'youtube-blocking-fixture-surface',
    patterns: [/^tests\/runtime\/fixtures\/.*(?:block|keyword|channel|comment|guide|post).*$/i],
    lanes: ['blocking']
  },
  {
    id: 'youtube-collaborator-fixture-surface',
    patterns: [/^tests\/runtime\/fixtures\/.*(?:collab|dialog|show-sheet).*$/i],
    lanes: ['whitelist', 'blocking', 'menu']
  },
  {
    id: 'youtube-menu-fixture-surface',
    patterns: [/^tests\/runtime\/fixtures\/.*(?:menu|quick|bottom-sheet).*$/i],
    lanes: ['menu']
  },
  {
    id: 'youtube-fixture-surface',
    patterns: [/^tests\/runtime\/fixtures\//],
    lanes: ['smoke']
  },
  {
    id: 'runtime-test-surface',
    patterns: [/^tests\/runtime\/.*\.test\.mjs$/],
    lanes: ['smoke']
  }
]);
