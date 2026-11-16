// Static lane data for scripts/run-test-lane.mjs.
// Keep this file declarative; execution belongs in the runner.
export const MANUAL_YOUTUBE_SMOKE_LANE_REASONS = Object.freeze({
  release: 'release packaging, public claims, installed-extension parity, and artifact handoff behavior',
  whitelist: 'whitelist-only leaks, Shorts, watch/end-screen, Kids/YTM allow behavior',
  blocking: 'keyword/channel/comment hiding and blocklist false-hide/leak behavior',
  json: 'JSON-first filtering, network interception, and SPA response mutation',
  dom: 'DOM fallback hiding/restores and recycled YouTube nodes',
  menu: '3-dot menus, quick-block, collaborator actions, and native dropdown state',
  performance: 'empty-rule/no-work and repeated YouTube SPA navigation responsiveness',
  settings: 'profile/mode/storage changes reprocessing already-rendered cards'
});
export const LIVE_SMOKE_ARTIFACT_TEMPLATE = 'docs/audit/artifacts/release-live-youtube-spa-smoke/template.json';
export const LIVE_SMOKE_RUNNER_COMMAND = 'npm run smoke:youtube';
export const LIVE_SMOKE_VERIFY_COMMAND =
  'npm run smoke:youtube:verify -- docs/audit/artifacts/release-live-youtube-spa-smoke/<artifact>.json';
export const LIVE_SMOKE_ARTIFACT_VERIFIER =
  'node docs/audit/artifacts/release-live-youtube-spa-smoke/verify-live-smoke-artifact.mjs docs/audit/artifacts/release-live-youtube-spa-smoke/<artifact>.json';
export const MANAGED_REMOTE_DELIVERY_SMOKE_ARTIFACT_TEMPLATE =
  'docs/audit/artifacts/managed-remote-delivery-smoke/template.json';
export const MANAGED_REMOTE_DELIVERY_SMOKE_ARTIFACT_VERIFIER =
  'node docs/audit/artifacts/managed-remote-delivery-smoke/verify-managed-smoke-artifact.mjs docs/audit/artifacts/managed-remote-delivery-smoke/<artifact>.json';
export const MANAGED_EXTENSION_INSTALLED_SMOKE_ARTIFACT_TEMPLATE =
  'docs/audit/artifacts/managed-extension-installed-smoke/template.json';
export const MANAGED_EXTENSION_INSTALLED_SMOKE_ARTIFACT_GENERATOR =
  'npm run managed:extension-smoke -- --input <redacted-observation.json> --confirm-manual-smoke-passed';
export const MANAGED_EXTENSION_INSTALLED_SMOKE_ARTIFACT_VERIFIER =
  'node docs/audit/artifacts/managed-extension-installed-smoke/verify-managed-extension-smoke-artifact.mjs docs/audit/artifacts/managed-extension-installed-smoke/<artifact>.json';
export const MANAGED_PICKUP_PROVIDER_OWNERSHIP_ARTIFACT_TEMPLATE =
  'docs/audit/artifacts/managed-pickup-provider-ownership/template.json';
export const MANAGED_PICKUP_PROVIDER_OWNERSHIP_ARTIFACT_GENERATOR =
  'npm run managed:provider-ownership -- --input <redacted-provider-ownership.json> --confirm-provider-ownership-reviewed';
export const MANAGED_PICKUP_PROVIDER_OWNERSHIP_ARTIFACT_VERIFIER =
  'node docs/audit/artifacts/managed-pickup-provider-ownership/verify-provider-ownership-artifact.mjs docs/audit/artifacts/managed-pickup-provider-ownership/<artifact>.json';
export const MANAGED_APP_PARITY_SMOKE_ARTIFACT_TEMPLATE =
  'docs/audit/artifacts/managed-app-parity-smoke/template.json';
export const MANAGED_APP_PARITY_SMOKE_ARTIFACT_GENERATOR =
  'npm run managed:app-parity-smoke -- --input <redacted-app-smoke.json> --confirm-installed-app-smoke-passed';
export const MANAGED_APP_PARITY_SMOKE_ARTIFACT_VERIFIER =
  'node docs/audit/artifacts/managed-app-parity-smoke/verify-managed-app-parity-smoke-artifact.mjs docs/audit/artifacts/managed-app-parity-smoke/<artifact>.json';
export const MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_ARTIFACT_TEMPLATE =
  'docs/audit/artifacts/managed-native-runtime-sync-handoff/template.json';
export const MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_ARTIFACT_GENERATOR =
  'npm run managed:native-handoff -- --confirm-sync-command-passed';
export const MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_ARTIFACT_VERIFIER =
  'node docs/audit/artifacts/managed-native-runtime-sync-handoff/verify-native-runtime-sync-handoff-artifact.mjs docs/audit/artifacts/managed-native-runtime-sync-handoff/<artifact>.json';
export const LIVE_SMOKE_CHANGE_CONTEXT_ENV = Object.freeze([
  'FILTERTUBE_LOGICAL_CHANGE_TYPE',
  'FILTERTUBE_REQUIRED_LANES',
  'FILTERTUBE_AUTOMATED_PROOF_COMMAND',
  'FILTERTUBE_AUTOMATED_PROOF_STATUS=passed',
  'FILTERTUBE_AUTOMATED_PROOF_SUMMARY',
  'FILTERTUBE_AUTOMATED_PROOF_LANES'
]);
export const LIVE_SMOKE_REQUIRED_ROWS = Object.freeze([
  'FT-LIVE-SPA-00-home-to-search',
  'FT-LIVE-SPA-01-search-to-channel',
  'FT-LIVE-SPA-02-channel-to-watch',
  'FT-LIVE-SPA-03-watch-to-home',
  'FT-LIVE-SPA-04-watch-rail-scroll',
  'FT-LIVE-SPA-05-cache-repeat-navigation'
]);
export const LIVE_SMOKE_MANAGED_CONTROL_ROWS = Object.freeze([
  'FT-MANAGED-LIVE-00-protected-profile-preflight',
  'FT-MANAGED-LIVE-01-main-kids-route-gate',
  'FT-MANAGED-LIVE-02-time-budget-active-tab',
  'FT-MANAGED-LIVE-03-zero-budget-timeout-overlay',
  'FT-MANAGED-LIVE-04-parent-history-redaction',
  'FT-MANAGED-LIVE-05-command-center-bulk-rail',
  'FT-MANAGED-LIVE-06-no-policy-no-work'
]);
export const MANAGED_REMOTE_DELIVERY_SMOKE_REQUIRED_ROWS = Object.freeze([
  'FT-MANAGED-REMOTE-00-trust-link-preflight',
  'FT-MANAGED-REMOTE-01-keyword-policy-apply',
  'FT-MANAGED-REMOTE-02-channel-policy-apply',
  'FT-MANAGED-REMOTE-03-video-policy-apply',
  'FT-MANAGED-REMOTE-04-viewing-space-gate',
  'FT-MANAGED-REMOTE-05-time-limit-policy',
  'FT-MANAGED-REMOTE-06-offline-last-policy',
  'FT-MANAGED-REMOTE-07-revoked-replay-reject',
  'FT-MANAGED-REMOTE-08-action-history-redaction',
  'FT-MANAGED-REMOTE-09-command-center-conflict-review',
  'FT-MANAGED-REMOTE-10-key-rotation-repair-status',
  'FT-MANAGED-REMOTE-11-no-work-idle',
  'FT-MANAGED-REMOTE-12-encrypted-history-summary-boundary',
  'FT-MANAGED-REMOTE-13-command-center-delivery-path-detail',
  'FT-MANAGED-REMOTE-14-managed-list-policy-apply'
]);
export const MANAGED_EXTENSION_INSTALLED_SMOKE_REQUIRED_ROWS = Object.freeze([
  'FT-MANAGED-EXT-00-install-preflight',
  'FT-MANAGED-EXT-01-parent-admin-unlock',
  'FT-MANAGED-EXT-02-create-protected-profile',
  'FT-MANAGED-EXT-03-set-main-kids-access',
  'FT-MANAGED-EXT-04-set-time-limit',
  'FT-MANAGED-EXT-05-edit-rules-keyword-channel-video',
  'FT-MANAGED-EXT-06-send-update-live-nanah',
  'FT-MANAGED-EXT-07-protected-device-apply-and-history',
  'FT-MANAGED-EXT-08-main-kids-route-gate',
  'FT-MANAGED-EXT-09-timeout-overlay',
  'FT-MANAGED-EXT-10-protected-user-cannot-admin',
  'FT-MANAGED-EXT-11-no-policy-no-work-spa',
  'FT-MANAGED-EXT-12-three-dot-and-quick-block-regression',
  'FT-MANAGED-EXT-13-pickup-provider-status-boundary'
]);
export const MANAGED_PICKUP_PROVIDER_OWNERSHIP_REQUIRED_ROWS = Object.freeze([
  'FT-PICKUP-PROVIDER-00-owner-decision',
  'FT-PICKUP-PROVIDER-01-endpoint-deployment',
  'FT-PICKUP-PROVIDER-02-retention-purge-revocation',
  'FT-PICKUP-PROVIDER-03-redacted-ack-history',
  'FT-PICKUP-PROVIDER-04-authority-boundary',
  'FT-PICKUP-PROVIDER-05-release-wording'
]);
export const MANAGED_APP_PARITY_SMOKE_REQUIRED_ROWS = Object.freeze([
  'FT-MANAGED-APP-00-contract-sync',
  'FT-MANAGED-APP-01-parent-admin-lock',
  'FT-MANAGED-APP-02-child-pin-not-admin',
  'FT-MANAGED-APP-03-main-route-gate',
  'FT-MANAGED-APP-04-kids-route-gate',
  'FT-MANAGED-APP-05-time-budget-startup',
  'FT-MANAGED-APP-06-time-budget-resume-heartbeat-pause',
  'FT-MANAGED-APP-07-reduced-budget-clamp',
  'FT-MANAGED-APP-08-timeout-surface',
  'FT-MANAGED-APP-09-history-redaction',
  'FT-MANAGED-APP-10-no-policy-no-work',
  'FT-MANAGED-APP-11-native-settings-lock',
  'FT-MANAGED-APP-12-keyword-rule-apply',
  'FT-MANAGED-APP-13-channel-rule-apply',
  'FT-MANAGED-APP-14-video-rule-apply',
  'FT-MANAGED-APP-15-managed-list-policy-apply',
  'FT-MANAGED-APP-16-family-device-map-delivery'
]);
export const MANAGED_NATIVE_RUNTIME_SYNC_HANDOFF_REQUIRED_ROWS = Object.freeze([
  'FT-NATIVE-SYNC-00-contract-hash',
  'FT-NATIVE-SYNC-01-sync-command',
  'FT-NATIVE-SYNC-02-generated-manifest',
  'FT-NATIVE-SYNC-03-no-native-claim',
  'FT-NATIVE-SYNC-04-app-smoke-pending'
]);
export const RUNTIME_FIXTURE_LANE_REASONS = Object.freeze({
  whitelist: 'whitelist allow/leak fixtures for touched YouTube surfaces',
  blocking: 'keyword/channel/comment hide-decision fixtures',
  json: 'JSON renderer, endpoint, response, or no-work fixtures',
  dom: 'DOM selector, cleanup, restore, or recycled-node fixtures',
  menu: '3-dot menu, quick-block, collaborator, or native dropdown fixtures',
  performance: 'empty-rule/no-work, SPA, timer, observer, or cache fixtures',
  settings: 'profile, storage, import/export, or compiled-mode fixtures'
});
export const AUDIT_PROOF_PATH_PATTERN = /^docs\/audit\//;
export const RUNTIME_TEST_PROOF_PATH_PATTERN = /^tests\/runtime\/.*\.test\.mjs$/;
export const RUNTIME_FIXTURE_PROOF_PATH_PATTERN = /^tests\/runtime\/(?:fixtures\/|harness\/|.*\.test\.mjs$)/;
export const NON_PROOF_LANE = 'smoke';
const FILTER_LOGIC_AUDIT_PROOF_TESTS = Object.freeze([
  'tests/runtime/filter-logic-direct-renderer-rule-semantic-register-current-behavior.test.mjs',
  'tests/runtime/filter-logic-method-semantic-register-current-behavior.test.mjs',
  'tests/runtime/filter-logic-rule-field-effect-semantic-register-current-behavior.test.mjs',
  'tests/runtime/filter-logic-rule-path-semantic-register-current-behavior.test.mjs'
]);
const SAFETY_AND_PREFERENCE_TESTS = Object.freeze([
  'tests/runtime/managed-time-usage-transactions.test.mjs',
  'tests/runtime/profile-preference-reset.test.mjs',
]);
const AUTO_SYNC_TESTS = Object.freeze([
  'tests/runtime/auto-sync-two-endpoint.test.mjs',
  'tests/runtime/managed-auto-sync-two-endpoint.test.mjs',
  'tests/runtime/personal-auto-sync-adversarial.test.mjs',
  'tests/runtime/nanah-pairing-ui.test.mjs',
  'tests/runtime/auto-sync-queue.test.mjs',
  'tests/runtime/auto-sync-wakeup.test.mjs',
  'tests/runtime/device-auto-sync-ui.test.mjs',
  'tests/runtime/device-auto-sync.test.mjs',
  'tests/runtime/managed-auto-sync.test.mjs',
  'tests/runtime/managed-auto-sync-reservation.test.mjs',
  'tests/runtime/managed-auto-sync-storage-reservation.test.mjs',
  'tests/runtime/managed-policy-payload-integrity.test.mjs',
  'tests/runtime/personal-sync.test.mjs',
  'tests/runtime/personal-auto-sync-runtime.test.mjs',
  'tests/runtime/personal-auto-sync-independent.test.mjs',
  'tests/runtime/video-notes-sync.test.mjs',
  'tests/runtime/local-playlists.test.mjs',
  'tests/runtime/kids-youtube-profiles.test.mjs',
  'tests/runtime/auto-sync-background-authority.test.mjs',
  'tests/runtime/auto-sync-dashboard-integration.test.mjs',
]);
const STUDY_TESTS = Object.freeze([
  'tests/runtime/nanah-keyword-merge-identity.test.mjs',
  'tests/runtime/study-model.test.mjs',
  'tests/runtime/study-backup-roundtrip.test.mjs',
  'tests/runtime/study-personal-sync.test.mjs',
  'tests/runtime/study-family-scopes.test.mjs',
  'tests/runtime/study-scope-routes.test.mjs',
  'tests/runtime/study-packs-catalog.test.mjs',
  'tests/runtime/study-layered-rules.test.mjs',
  'tests/runtime/study-engine-clock.test.mjs',
  'tests/runtime/study-engine-apply.test.mjs',
  'tests/runtime/study-background-controller.test.mjs',
  'tests/runtime/study-overlay-content.test.mjs',
  'tests/runtime/study-shorts-allow-mode.test.mjs',
  'tests/runtime/study-title-only-keywords.test.mjs',
  'tests/runtime/study-clock-guard.test.mjs',
  'tests/runtime/study-ui.test.mjs',
  'tests/runtime/study-topic-synonyms.test.mjs',
  'tests/runtime/study-branch-kids-parity.test.mjs',
]);
// Parity with the Android app: filtering decisions, Ask a parent, live chat (docs/design/PARITY_PASS4.md).
const APP_PARITY_TESTS = Object.freeze([
  'tests/runtime/app-parity-channel-decisions.test.mjs',
  'tests/runtime/app-parity-ask-parent.test.mjs',
  'tests/runtime/app-parity-live-chat.test.mjs',
  'tests/runtime/app-parity-comments-note.test.mjs',
  'tests/runtime/app-parity-doodles.test.mjs',
  'tests/runtime/app-parity-pass5.test.mjs',
  'tests/runtime/app-parity-country-accent.test.mjs',
  'tests/runtime/app-parity-study-topic-label.test.mjs',
  'tests/runtime/app-parity-study-merge.test.mjs',
  'tests/runtime/app-parity-rule-options.test.mjs',
  'tests/runtime/app-parity-study-skip-break.test.mjs',
  'tests/runtime/app-parity-study-setup.test.mjs',
  'tests/runtime/app-parity-study-session-end.test.mjs',
  'tests/runtime/app-parity-study-break-sun.test.mjs',
  'tests/runtime/app-parity-study-page-theme.test.mjs',
  'tests/runtime/app-parity-study-silent-device.test.mjs',
  'tests/runtime/app-parity-study-review-leftovers.test.mjs',
  // The Android -> extension port ledger's own checks (docs/parity/HOW_TO_PORT.md).
  'tools/parity/ledger.test.mjs',
]);
// Companion characters in the popup and options page (js/mascots.js).
const COMPANION_TESTS = Object.freeze([
  'tests/runtime/mascots.test.mjs',
]);
// App parity: profile avatars (Android ProfileAvatarCodec), the profile picker's look and the
// neutral terminology guard (docs/app/design-system/TERMINOLOGY.md in the app repo).
const PROFILE_AVATAR_TESTS = Object.freeze([
  'tests/runtime/profile-avatar-roundtrip.test.mjs',
  'tests/runtime/neutral-terminology.test.mjs',
]);
const VIDEO_NOTES_TESTS = Object.freeze([
  'tests/runtime/video-notes-contract.test.mjs',
  'tests/runtime/video-notes-store.test.mjs',
  'tests/runtime/video-notes-background.test.mjs',
  'tests/runtime/video-notes-watch.test.mjs',
  'tests/runtime/video-notes-editor.test.mjs',
]);
const CONTENT_PLAYBACK_TESTS = Object.freeze([
  'tests/runtime/content-playback-admission-current-behavior.test.mjs',
  'tests/runtime/content-playback-source-current-behavior.test.mjs',
  'tests/runtime/content-playback-captions-current-behavior.test.mjs',
  'tests/runtime/content-playback-player.test.mjs',
  'tests/runtime/content-playback-response.test.mjs',
  'tests/runtime/content-playback-coordinator.test.mjs',
  'tests/runtime/content-playback-resolver.test.mjs',
  'tests/runtime/content-playback-transport.test.mjs',
  'tests/runtime/content-playback-native.test.mjs',
  'tests/runtime/ad-void-native-ownership-current-behavior.test.mjs',
  'tests/runtime/managed-content-playback-permit.test.mjs',
  'tests/runtime/content-only-playback-settings.test.mjs'
]);
export const LANES = Object.freeze({
  release: {
    description: 'Build, package, release docs, public claims, and artifact boundaries.',
    checks: ['build.js'],
    tests: [
      ...AUTO_SYNC_TESTS,
      ...SAFETY_AND_PREFERENCE_TESTS,
      ...VIDEO_NOTES_TESTS,
      ...STUDY_TESTS,
      ...APP_PARITY_TESTS,
      ...COMPANION_TESTS,
      ...PROFILE_AVATAR_TESTS,
      'tests/runtime/ad-void-native-ownership-current-behavior.test.mjs',
      'tests/runtime/popup-intrinsic-sizing.test.mjs',
      'tests/runtime/build-release-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/build-script-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/build-website-callable-current-behavior.test.mjs',
      'tests/runtime/browser-manifest-runtime-load-order-current-behavior.test.mjs',
      'tests/runtime/css-load-style-surface-current-behavior.test.mjs',
      'tests/runtime/public-release-surface-current-behavior.test.mjs',
      'tests/runtime/public-release-claim-boundary-current-behavior.test.mjs',
      'tests/runtime/p0-release-package-current-behavior.test.mjs',
      'tests/runtime/quarantined-content-css-package-boundary-current-behavior.test.mjs',
      'tests/runtime/release-audit-proof-directory-boundary-current-behavior.test.mjs',
      'tests/runtime/release-build-artifact-claim-boundary-current-behavior.test.mjs',
      'tests/runtime/release-live-youtube-spa-smoke-artifact-verifier-current-behavior.test.mjs',
      'tests/runtime/release-live-youtube-spa-smoke-boundary-current-behavior.test.mjs',
      'tests/runtime/managed-policy-sync-remote-delivery-smoke-artifact-verifier-current-behavior.test.mjs',
      'tests/runtime/managed-extension-installed-smoke-artifact-verifier-current-behavior.test.mjs',
      'tests/runtime/managed-extension-installed-smoke-artifact-generator-current-behavior.test.mjs',
      'tests/runtime/managed-pickup-provider-ownership-gate-current-behavior.test.mjs',
      'tests/runtime/managed-pickup-provider-ownership-generator-current-behavior.test.mjs',
      'tests/runtime/managed-delivery-provider-reference-current-behavior.test.mjs',
      'tests/runtime/managed-native-runtime-sync-handoff-current-behavior.test.mjs',
      'tests/runtime/managed-native-runtime-sync-handoff-generator-current-behavior.test.mjs',
      'tests/runtime/managed-app-parity-smoke-artifact-verifier-current-behavior.test.mjs',
      'tests/runtime/managed-app-parity-smoke-artifact-generator-current-behavior.test.mjs',
      'tests/runtime/release-notes-json-version-gate-boundary-current-behavior.test.mjs',
      'tests/runtime/release-package-parity-current-behavior.test.mjs',
      'tests/runtime/root-package-metadata-script-surface-current-behavior.test.mjs',
      'tests/runtime/background-script-injection-trust-boundary-current-behavior.test.mjs',
      'tests/runtime/bridge-injection-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/page-message-trust-current-behavior.test.mjs',
      'tests/runtime/startup-injection-readiness-current-behavior.test.mjs',
      'tests/runtime/test-lane-matrix-current-behavior.test.mjs',
      'tests/runtime/test-lane-classifier-workflow-current-behavior.test.mjs',
      'tests/runtime/test-lane-workflow-large-file-release-current-behavior.test.mjs'
    ]
  },
  whitelist: {
    description: 'Whitelist-only mode, pending hides, allow-list leaks, Shorts, watch, end-screen, Kids, and YTM allow behavior.',
    tests: [
      ...VIDEO_NOTES_TESTS,
      ...STUDY_TESTS,
      'tests/runtime/ad-void-native-ownership-current-behavior.test.mjs',
      'tests/runtime/content-playback-admission-current-behavior.test.mjs',
      'tests/runtime/content-playback-coordinator.test.mjs',
      'tests/runtime/managed-content-playback-permit.test.mjs',
      'tests/runtime/content-only-playback-settings.test.mjs',
      ...FILTER_LOGIC_AUDIT_PROOF_TESTS,
      'tests/runtime/json-first-whitelist-decision-identity-boundary-current-behavior.test.mjs',
      'tests/runtime/content-bridge-whitelist-pending-refresh-boundary-current-behavior.test.mjs',
      'tests/runtime/whitelist-pending-intake-no-work-contract-current-behavior.test.mjs',
      'tests/runtime/whitelist-cache-hot-path-boundary-current-behavior.test.mjs',
      'tests/runtime/whitelist-cache-spa-metric-packet-gate-current-behavior.test.mjs',
      'tests/runtime/whitelist-optimization-readiness-gap-matrix-current-behavior.test.mjs',
      'tests/runtime/right-rail-whitelist-observer-current-behavior.test.mjs',
      'tests/runtime/batch-whitelist-import-persistence-boundary-current-behavior.test.mjs',
      'tests/runtime/main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation-current-behavior.test.mjs',
      'tests/runtime/main-watch-initial-lockup-shorts-json-current-behavior.test.mjs',
      'tests/runtime/main-watch-initial-shorts-owner-absent-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-all-shorts-boundary-current-behavior.test.mjs',
      'tests/runtime/shorts-dom-cleanup-boundary-current-behavior.test.mjs',
      'tests/runtime/shorts-reel-overlay-owner-authority-boundary-current-behavior.test.mjs',
      'tests/runtime/main-watch-autoplay-video-endpoint-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-endscreen-videowall-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-endscreen-cards-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-disable-autoplay-annotations-boundary-current-behavior.test.mjs',
      'tests/runtime/player-endscreen-dom-cleanup-boundary-current-behavior.test.mjs',
      'tests/runtime/kids-latest-json-owner-extension-fixture-boundary-current-behavior.test.mjs',
      'tests/runtime/youtube-music-surface-identity-boundary-current-behavior.test.mjs',
      'tests/runtime/ytm-watch-player-whitelist-selected-row-mode-boundary-current-behavior.test.mjs'
    ]
  },
  blocking: {
    description: 'Keyword, channel, comment, blocklist, list-target, and hide-decision behavior.',
    tests: [
      ...VIDEO_NOTES_TESTS,
      ...STUDY_TESTS,
      'tests/runtime/ad-void-native-ownership-current-behavior.test.mjs',
      'tests/runtime/content-playback-admission-current-behavior.test.mjs',
      'tests/runtime/content-playback-coordinator.test.mjs',
      'tests/runtime/managed-content-playback-permit.test.mjs',
      'tests/runtime/content-only-playback-settings.test.mjs',
      'tests/runtime/watch-selected-playlist-row-admission.test.mjs',
      'tests/runtime/category-pending-lifetime.test.mjs',
      'tests/runtime/category-pending-dom-pipeline.test.mjs',
      'tests/runtime/json-comment-explicit-keyword-scope-current-behavior.test.mjs',
      'tests/runtime/minimum-view-count-current-behavior.test.mjs',
      'tests/runtime/external-youtube-playback-guard-current-behavior.test.mjs',
      ...FILTER_LOGIC_AUDIT_PROOF_TESTS,
      'tests/runtime/filter-engine-current-behavior.test.mjs',
      'tests/runtime/keyword-match-authority-current-behavior.test.mjs',
      'tests/runtime/p0-keyword-match-current-behavior.test.mjs',
      'tests/runtime/json-first-keyword-match-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-channel-match-boundary-current-behavior.test.mjs',
      'tests/runtime/json-comment-author-channel-provenance-boundary-current-behavior.test.mjs',
      'tests/runtime/json-comment-keyword-provenance-boundary-current-behavior.test.mjs',
      'tests/runtime/main-profile-blocklist-keyword-alias-current-behavior.test.mjs',
      'tests/runtime/background-add-filtered-channel-list-target-current-behavior.test.mjs',
      'tests/runtime/content-bridge-menu-action-list-target-current-behavior.test.mjs',
      'tests/runtime/filter-all-toggle-list-target-current-behavior.test.mjs',
      'tests/runtime/add-filtered-channel-filter-all-comments-default-current-behavior.test.mjs',
      'tests/runtime/single-channel-rule-mutation-persistence-boundary-current-behavior.test.mjs',
      'tests/runtime/shorts-reel-overlay-owner-authority-boundary-current-behavior.test.mjs',
      'tests/runtime/hide-decision-pipeline-current-behavior.test.mjs'
    ]
  },
  json: {
    description: 'JSON-first filtering, network interception, response mutation, list mode, and endpoint work gates.',
    tests: [
      ...VIDEO_NOTES_TESTS,
      ...STUDY_TESTS,
      ...CONTENT_PLAYBACK_TESTS,
      'tests/runtime/get-watch-streaming-interception.test.mjs',
      'tests/runtime/ad-void-duration-seek-current-behavior.test.mjs',
      'tests/runtime/advert-content-interception.test.mjs',
      'tests/runtime/advert-runtime-startup.test.mjs',
      'tests/runtime/json-comment-explicit-keyword-scope-current-behavior.test.mjs',
      'tests/runtime/minimum-view-count-current-behavior.test.mjs',
      'tests/runtime/external-youtube-playback-guard-current-behavior.test.mjs',
      ...FILTER_LOGIC_AUDIT_PROOF_TESTS,
      'tests/runtime/seed-network-current-behavior.test.mjs',
      'tests/runtime/seed-fetch-no-work-list-mode-boundary-current-behavior.test.mjs',
      'tests/runtime/seed-xhr-no-work-list-mode-boundary-current-behavior.test.mjs',
      'tests/runtime/xhr-no-work-boundary-current-behavior.test.mjs',
      'tests/runtime/network-fetch-xhr-callsite-register-current-behavior.test.mjs',
      'tests/runtime/json-first-active-work-predicate-register-current-behavior.test.mjs',
      'tests/runtime/json-first-filter-readiness-gate-current-behavior.test.mjs',
      'tests/runtime/json-first-implementation-authority-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-implementation-locus-register-current-behavior.test.mjs',
      'tests/runtime/json-first-block-decision-effect-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-candidate-extraction-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-renderer-traversal-mutation-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-network-snapshot-clone-isolation-current-behavior.test.mjs',
      'tests/runtime/json-first-network-snapshot-consumer-application-current-behavior.test.mjs',
      'tests/runtime/json-first-network-snapshot-consumer-traversal-budget-current-behavior.test.mjs',
      'tests/runtime/json-first-list-mode-matrix-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-response-mutation-contract-current-behavior.test.mjs',
      'tests/runtime/json-first-whitelist-decision-identity-boundary-current-behavior.test.mjs',
      'tests/runtime/content-control-json-first-boundary-index-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-all-comments-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-comment-continuation-shortcut-current-behavior.test.mjs',
      'tests/runtime/json-comment-author-channel-provenance-boundary-current-behavior.test.mjs',
      'tests/runtime/json-comment-keyword-provenance-boundary-current-behavior.test.mjs',
      'tests/runtime/json-comment-entity-payload-provenance-boundary-current-behavior.test.mjs',
      'tests/runtime/json-comment-structural-wrapper-cleanup-boundary-current-behavior.test.mjs',
      'tests/runtime/json-comment-continuation-collection-root-parity-boundary-current-behavior.test.mjs',
      'tests/runtime/json-comment-continuation-command-shape-parity-boundary-current-behavior.test.mjs',
      'tests/runtime/json-comment-continuation-sibling-preservation-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-ask-button-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-explore-trending-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-home-feed-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-live-chat-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-members-only-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-merch-tickets-offers-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-mix-playlists-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-more-from-youtube-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-notification-bell-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-playlist-cards-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-recommended-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-search-shelves-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-sponsored-cards-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-subscriptions-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-top-header-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-video-buttons-bar-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-video-channel-row-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-video-description-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-video-info-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-video-sidebar-boundary-current-behavior.test.mjs',
      'tests/runtime/json-first-hide-watch-playlist-panel-boundary-current-behavior.test.mjs',
      'tests/runtime/shorts-reel-overlay-owner-authority-boundary-current-behavior.test.mjs',
      'tests/runtime/youtube-music-surface-identity-boundary-current-behavior.test.mjs',
      'tests/runtime/ytm-show-sheet-injector-filter-logic-parity-current-behavior.test.mjs',
      'tests/runtime/ytm-show-sheet-enrichment-handoff-current-behavior.test.mjs',
      'tests/runtime/bridge-injection-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/content-bridge-main-world-message-dispatch-boundary-current-behavior.test.mjs',
      'tests/runtime/injector-main-world-message-dispatch-boundary-current-behavior.test.mjs',
      'tests/runtime/startup-injection-readiness-current-behavior.test.mjs'
    ]
  },
  dom: {
    description: 'DOM fallback selectors, hide/restore state, cleanup passes, and recycled node behavior.',
    tests: [
      ...VIDEO_NOTES_TESTS,
      ...STUDY_TESTS,
      'tests/runtime/content-playback-admission-current-behavior.test.mjs',
      'tests/runtime/content-playback-coordinator.test.mjs',
      'tests/runtime/managed-content-playback-permit.test.mjs',
      'tests/runtime/content-only-playback-settings.test.mjs',
      'tests/runtime/watch-selected-playlist-row-admission.test.mjs',
      'tests/runtime/category-pending-lifetime.test.mjs',
      'tests/runtime/category-pending-dom-pipeline.test.mjs',
      'tests/runtime/external-youtube-admission-overlay-current-behavior.test.mjs',
      ...FILTER_LOGIC_AUDIT_PROOF_TESTS,
      'tests/runtime/dom-fallback-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/dom-fallback-selector-semantic-register-current-behavior.test.mjs',
      'tests/runtime/dom-selector-instance-register-current-behavior.test.mjs',
      'tests/runtime/dom-fallback-run-state-visibility-cleanup-boundary-current-behavior.test.mjs',
      'tests/runtime/css-style-hide-authority-current-behavior.test.mjs',
      'tests/runtime/dom-hide-side-effect-current-behavior.test.mjs',
      'tests/runtime/direct-hide-writer-register-current-behavior.test.mjs',
      'tests/runtime/dom-broad-hide-boundary-current-behavior.test.mjs',
      'tests/runtime/dom-state-virtual-attributes-current-behavior.test.mjs',
      'tests/runtime/dom-target-source-current-behavior.test.mjs',
      'tests/runtime/comments-dom-cleanup-boundary-current-behavior.test.mjs',
      'tests/runtime/home-feed-dom-cleanup-boundary-current-behavior.test.mjs',
      'tests/runtime/quarantined-content-css-package-boundary-current-behavior.test.mjs',
      'tests/runtime/shorts-dom-cleanup-boundary-current-behavior.test.mjs',
      'tests/runtime/player-endscreen-dom-cleanup-boundary-current-behavior.test.mjs',
      'tests/runtime/watch-playlist-panel-dom-cleanup-boundary-current-behavior.test.mjs'
    ]
  },
  menu: {
    description: '3-dot menu, quick-block, collaborator menus, native dropdown close state, and affordance gates.',
    tests: [
      'tests/runtime/native-dropdown-close-state-current-behavior.test.mjs',
      'tests/runtime/quick-block-block-menu-affordance-boundary-current-behavior.test.mjs',
      'tests/runtime/quick-block-default-migration-boundary-current-behavior.test.mjs',
      'tests/runtime/quick-block-hover-lifecycle-timer-boundary-current-behavior.test.mjs',
      'tests/runtime/block-channel-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/content-menu-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/content-bridge-menu-action-list-target-current-behavior.test.mjs',
      'tests/runtime/content-bridge-menu-blocked-state-list-shape-current-behavior.test.mjs',
      'tests/runtime/content-bridge-menu-injection-action-boundary-current-behavior.test.mjs',
      'tests/runtime/content-bridge-collaborator-identity-promotion-handoff-current-behavior.test.mjs',
      'tests/runtime/collab-dialog-lifecycle-current-behavior.test.mjs',
      'tests/runtime/main-collab-resolved-search-card-dialog-current-behavior.test.mjs',
      'tests/runtime/ytm-show-sheet-collaborator-roster-current-behavior.test.mjs'
    ]
  },
  performance: {
    description: 'No-rule/no-work budgets, SPA lag guards, disabled mode, active-rule gates, and identity work budgets.',
    tests: [
      ...VIDEO_NOTES_TESTS,
      ...STUDY_TESTS,
      ...CONTENT_PLAYBACK_TESTS,
      'tests/runtime/get-watch-streaming-interception.test.mjs',
      'tests/runtime/ad-void-duration-seek-current-behavior.test.mjs',
      'tests/runtime/popup-intrinsic-sizing.test.mjs',
      ...FILTER_LOGIC_AUDIT_PROOF_TESTS,
      'tests/runtime/empty-install-idle-observer-budget-current-behavior.test.mjs',
      'tests/runtime/empty-install-performance-current-behavior.test.mjs',
      'tests/runtime/visible-empty-runtime-active-current-behavior.test.mjs',
      'tests/runtime/enabled-master-switch-disabled-runtime-boundary-current-behavior.test.mjs',
      'tests/runtime/active-rule-authority-current-behavior.test.mjs',
      'tests/runtime/content-control-active-work-matrix-current-behavior.test.mjs',
      'tests/runtime/content-filter-route-surface-no-work-budget-current-behavior.test.mjs',
      'tests/runtime/json-first-no-work-optimization-crosswalk-current-behavior.test.mjs',
      'tests/runtime/whitelist-pending-intake-no-work-contract-current-behavior.test.mjs',
      'tests/runtime/whitelist-cache-spa-metric-packet-gate-current-behavior.test.mjs',
      'tests/runtime/managed-viewing-space-route-gate-current-behavior.test.mjs',
      'tests/runtime/managed-time-budget-enforcement-current-behavior.test.mjs',
      'tests/runtime/seed-fetch-no-work-list-mode-boundary-current-behavior.test.mjs',
      'tests/runtime/seed-xhr-no-work-list-mode-boundary-current-behavior.test.mjs',
      'tests/runtime/xhr-no-work-boundary-current-behavior.test.mjs',
      'tests/runtime/network-fetch-xhr-callsite-register-current-behavior.test.mjs',
      'tests/runtime/performance-claim-evidence-boundary-current-behavior.test.mjs',
      'tests/runtime/identity-work-budget-current-behavior.test.mjs',
      'tests/runtime/lifecycle-instance-register-current-behavior.test.mjs',
      'tests/runtime/repo-lifecycle-primitive-coverage-current-behavior.test.mjs',
      'tests/runtime/runtime-diagnostic-logging-policy-matrix-current-behavior.test.mjs',
      'tests/runtime/code-burden-declutter-boundary-current-behavior.test.mjs',
      'tests/runtime/first-optimization-source-locus-callable-anchor-boundary-current-behavior.test.mjs',
      'tests/runtime/test-lane-workflow-large-file-release-current-behavior.test.mjs',
      'tests/runtime/p0-no-work-current-behavior.test.mjs'
    ]
  },
  settings: {
    description: 'Settings compile, profiles, storage refresh, migrations, import/export, backups, and sync boundaries.',
    tests: [
      ...AUTO_SYNC_TESTS,
      ...SAFETY_AND_PREFERENCE_TESTS,
      ...VIDEO_NOTES_TESTS,
      ...STUDY_TESTS,
      ...APP_PARITY_TESTS,
      ...COMPANION_TESTS,
      ...PROFILE_AVATAR_TESTS,
      'tests/runtime/content-playback-admission-current-behavior.test.mjs',
      'tests/runtime/content-playback-coordinator.test.mjs',
      'tests/runtime/managed-content-playback-permit.test.mjs',
      'tests/runtime/content-only-playback-settings.test.mjs',
      'tests/runtime/minimum-view-count-current-behavior.test.mjs',
      'tests/runtime/minimum-views-controls-current-behavior.test.mjs',
      'tests/runtime/nanah-storage-lock-current-behavior.test.mjs',
      'tests/runtime/nanah-qr-scanner-current-behavior.test.mjs',
      'tests/runtime/family-device-navigation-current-behavior.test.mjs',
      'tests/runtime/ui-localization-runtime-current-behavior.test.mjs',
      'tests/runtime/ui-localization-catalog-current-behavior.test.mjs',
      'tests/runtime/settings-shared-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/settings-mode-coverage-matrix-current-behavior.test.mjs',
      'tests/runtime/settings-mode-source-effect-current-behavior.test.mjs',
      'tests/runtime/settings-refresh-fanout-current-behavior.test.mjs',
      'tests/runtime/settings-refresh-cross-context-consumer-boundary-current-behavior.test.mjs',
      'tests/runtime/settings-refresh-dirty-key-producer-matrix-current-behavior.test.mjs',
      'tests/runtime/settings-refresh-dirty-key-consumer-matrix-current-behavior.test.mjs',
      'tests/runtime/settings-refresh-key-parity-register-current-behavior.test.mjs',
      'tests/runtime/settings-refresh-dirty-key-producer-consumer-join-matrix-current-behavior.test.mjs',
      'tests/runtime/settings-refresh-optimization-readiness-boundary-current-behavior.test.mjs',
      'tests/runtime/settings-refresh-optimization-candidate-binding-matrix-current-behavior.test.mjs',
      'tests/runtime/settings-refresh-optimization-candidate-evidence-packet-contract-current-behavior.test.mjs',
      'tests/runtime/source-of-truth-claim-register-current-behavior.test.mjs',
      'tests/runtime/compiled-settings-field-register-current-behavior.test.mjs',
      'tests/runtime/content-control-alias-mutation-boundary-current-behavior.test.mjs',
      'tests/runtime/compiled-settings-profile-list-mode-assembly-boundary-current-behavior.test.mjs',
      'tests/runtime/compiled-cache-authority-current-behavior.test.mjs',
      'tests/runtime/compiler-parity-current-behavior.test.mjs',
      'tests/runtime/state-manager-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/state-manager-request-refresh-fanout-boundary-current-behavior.test.mjs',
      'tests/runtime/profile-management-persistence-boundary-current-behavior.test.mjs',
      'tests/runtime/list-mode-transition-persistence-boundary-current-behavior.test.mjs',
      'tests/runtime/import-export-nanah-authority-current-behavior.test.mjs',
      'tests/runtime/managed-parent-authority-inventory-current-behavior.test.mjs',
      'tests/runtime/managed-locked-child-revision-gate-current-behavior.test.mjs',
      'tests/runtime/managed-policy-schema-revision-contract-current-behavior.test.mjs',
      'tests/runtime/managed-child-local-authority-current-behavior.test.mjs',
      'tests/runtime/local-network-discovery-authority-boundary-current-behavior.test.mjs',
      'tests/runtime/managed-policy-encrypted-mailbox-protocol-current-behavior.test.mjs',
      'tests/runtime/managed-nanah-pairing-key-descriptor-current-behavior.test.mjs',
      'tests/runtime/managed-nanah-signing-keypair-current-behavior.test.mjs',
      'tests/runtime/managed-nanah-live-signed-send-current-behavior.test.mjs',
      'tests/runtime/managed-nanah-open-sync-current-behavior.test.mjs',
      'tests/runtime/managed-device-picker-delivery-current-behavior.test.mjs',
      'tests/runtime/managed-transport-provider-clients-current-behavior.test.mjs',
      'tests/runtime/managed-delivery-provider-reference-current-behavior.test.mjs',
      'tests/runtime/managed-policy-sync-remote-delivery-readiness-gate-current-behavior.test.mjs',
      'tests/runtime/managed-remote-transport-app-parity-gate-current-behavior.test.mjs',
      'tests/runtime/managed-controls-extension-mvp-handoff-current-behavior.test.mjs',
      'tests/runtime/managed-controls-completion-audit-current-behavior.test.mjs',
      'tests/runtime/managed-policy-sync-remote-delivery-smoke-artifact-verifier-current-behavior.test.mjs',
      'tests/runtime/managed-extension-installed-smoke-artifact-verifier-current-behavior.test.mjs',
      'tests/runtime/managed-extension-installed-smoke-artifact-generator-current-behavior.test.mjs',
      'tests/runtime/managed-pickup-provider-ownership-gate-current-behavior.test.mjs',
      'tests/runtime/managed-pickup-provider-ownership-generator-current-behavior.test.mjs',
      'tests/runtime/managed-delivery-provider-reference-current-behavior.test.mjs',
      'tests/runtime/managed-native-runtime-sync-handoff-current-behavior.test.mjs',
      'tests/runtime/managed-native-runtime-sync-handoff-generator-current-behavior.test.mjs',
      'tests/runtime/managed-app-parity-smoke-artifact-verifier-current-behavior.test.mjs',
      'tests/runtime/managed-app-parity-smoke-artifact-generator-current-behavior.test.mjs',
      'tests/runtime/managed-viewing-space-route-gate-current-behavior.test.mjs',
      'tests/runtime/managed-child-time-limit-schema-current-behavior.test.mjs',
      'tests/runtime/managed-time-budget-enforcement-current-behavior.test.mjs',
      'tests/runtime/managed-app-policy-contract-parity-current-behavior.test.mjs',
      'tests/runtime/managed-policy-action-history-model-current-behavior.test.mjs',
      'tests/runtime/managed-parent-ui-surface-current-behavior.test.mjs',
      'tests/runtime/backup-export-authority-current-behavior.test.mjs',
      'tests/runtime/io-manager-method-semantic-register-current-behavior.test.mjs',
      'tests/runtime/background-message-action-semantic-register-current-behavior.test.mjs',
      'tests/runtime/background-message-authority-current-behavior.test.mjs',
      'tests/runtime/content-bridge-main-world-message-dispatch-boundary-current-behavior.test.mjs',
      'tests/runtime/message-sender-class-matrix-current-behavior.test.mjs',
      'tests/runtime/message-side-effect-register-current-behavior.test.mjs',
      'tests/runtime/message-transport-callsite-register-current-behavior.test.mjs',
      'tests/runtime/p0-message-mutation-current-behavior.test.mjs'
    ]
  },
  smoke: {
    description: 'Small release confidence lane for common lag, blocking, menu, and release-surface regressions.',
    checks: ['build.js'],
    tests: [
      ...AUTO_SYNC_TESTS,
      ...SAFETY_AND_PREFERENCE_TESTS,
      ...VIDEO_NOTES_TESTS,
      ...STUDY_TESTS,
      ...APP_PARITY_TESTS,
      ...COMPANION_TESTS,
      ...PROFILE_AVATAR_TESTS,
      ...CONTENT_PLAYBACK_TESTS,
      'tests/runtime/get-watch-streaming-interception.test.mjs',
      'tests/runtime/ad-void-duration-seek-current-behavior.test.mjs',
      'tests/runtime/popup-intrinsic-sizing.test.mjs',
      'tests/runtime/advert-content-interception.test.mjs',
      'tests/runtime/advert-runtime-startup.test.mjs',
      'tests/runtime/active-rule-authority-current-behavior.test.mjs',
      'tests/runtime/filter-engine-current-behavior.test.mjs',
      'tests/runtime/main-profile-blocklist-keyword-alias-current-behavior.test.mjs',
      'tests/runtime/json-first-whitelist-decision-identity-boundary-current-behavior.test.mjs',
      'tests/runtime/content-bridge-whitelist-pending-refresh-boundary-current-behavior.test.mjs',
      'tests/runtime/main-watch-autoplay-video-endpoint-current-behavior.test.mjs',
      'tests/runtime/storage-refresh-force-reprocess-coalescing-current-behavior.test.mjs',
      'tests/runtime/native-dropdown-close-state-current-behavior.test.mjs',
      'tests/runtime/quick-block-block-menu-affordance-boundary-current-behavior.test.mjs',
      'tests/runtime/dom-state-virtual-attributes-current-behavior.test.mjs',
      'tests/runtime/empty-install-performance-current-behavior.test.mjs',
      'tests/runtime/runtime-diagnostic-logging-policy-matrix-current-behavior.test.mjs',
      'tests/runtime/public-release-surface-current-behavior.test.mjs',
      'tests/runtime/release-audit-proof-directory-boundary-current-behavior.test.mjs',
      'tests/runtime/release-live-youtube-spa-smoke-artifact-verifier-current-behavior.test.mjs',
      'tests/runtime/release-live-youtube-spa-smoke-boundary-current-behavior.test.mjs',
      'tests/runtime/managed-controls-extension-mvp-handoff-current-behavior.test.mjs',
      'tests/runtime/managed-policy-sync-remote-delivery-smoke-artifact-verifier-current-behavior.test.mjs',
      'tests/runtime/managed-extension-installed-smoke-artifact-verifier-current-behavior.test.mjs',
      'tests/runtime/managed-extension-installed-smoke-artifact-generator-current-behavior.test.mjs',
      'tests/runtime/managed-pickup-provider-ownership-gate-current-behavior.test.mjs',
      'tests/runtime/managed-pickup-provider-ownership-generator-current-behavior.test.mjs',
      'tests/runtime/managed-delivery-provider-reference-current-behavior.test.mjs',
      'tests/runtime/managed-native-runtime-sync-handoff-current-behavior.test.mjs',
      'tests/runtime/managed-native-runtime-sync-handoff-generator-current-behavior.test.mjs',
      'tests/runtime/managed-app-parity-smoke-artifact-verifier-current-behavior.test.mjs',
      'tests/runtime/managed-app-parity-smoke-artifact-generator-current-behavior.test.mjs',
      'tests/runtime/all-callable-index-current-behavior.test.mjs',
      'tests/runtime/audit-runtime-backlog-current-behavior.test.mjs',
      'tests/runtime/source-of-truth-claim-register-current-behavior.test.mjs',
      'tests/runtime/change-safety-goal-requirement-audit-current-behavior.test.mjs',
      'tests/runtime/test-lane-visible-safety-current-behavior.test.mjs',
      'tests/runtime/test-lane-matrix-current-behavior.test.mjs',
      'tests/runtime/test-lane-classifier-workflow-current-behavior.test.mjs',
      'tests/runtime/test-lane-workflow-large-file-release-current-behavior.test.mjs'
    ]
  }
});
export { FILE_LANE_RULES } from './test-lane-file-rules.mjs';
