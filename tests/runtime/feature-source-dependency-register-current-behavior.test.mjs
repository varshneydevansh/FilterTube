import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FEATURE_SOURCE_DEPENDENCY_REGISTER_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

test('feature_source_dependency_register_is_audit_only_and_defines_dependency_columns', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /This is not an implementation patch/);
  assert.match(source, /Runtime behavior is unchanged/);

  for (const column of [
    'Rule-state source',
    'Content/text source',
    'Identity source',
    'DOM/lifecycle source',
    'Side effects',
    'Current dependency risk',
    'Proof gate'
  ]) {
    assert.ok(source.includes(`| ${column} |`), `missing column definition for ${column}`);
  }
});

test('feature_source_dependency_register_lists_required_feature_rows', () => {
  const source = doc();

  for (const feature of [
    'Empty install / disabled / no-rule runtime',
    'Blocklist keyword filtering',
    'Blocklist channel filtering',
    'Whitelist mode and pending hides',
    'Simultaneous allow/block future workflow',
    'Content/category/date/duration controls',
    'Comments filtering',
    'Watch/player/current-video controls',
    'End-screen and watch recommendations',
    'Shorts/reels',
    'Playlists/radio/mixes',
    'Native and fallback 3-dot menus',
    'Quick-cross / quick block',
    'Collaborator / showDialog / showSheet / avatar-stack recovery',
    'Posts/community',
    'YouTube Kids surface',
    'YouTube Music surface',
    'Import/export/Nanah/sync',
    'Subscribed-channel whitelist import',
    'Stats/time-saved/dashboard',
    'Security/PIN/profile viewing spaces',
    'Prompt/onboarding/release-note coachmarks',
    'Release website/download/public claims'
  ]) {
    assert.ok(source.includes(`| ${feature} |`), `missing feature dependency row ${feature}`);
  }
});

test('feature_source_dependency_register_pins_non_obvious_dependency_rows_from_review', () => {
  const source = doc();

  for (const phrase of [
    '`js/seed.js` missing-settings gates',
    'stale `blockedKeywords` / `blockedChannels` aliases',
    '`showDialogCommand` and `showSheetCommand` are not equivalent',
    'avatar stacks can be non-collaborator identity',
    'It is not the same as generic import/export',
    'YouTube-observable workflow',
    'Prompt owners are split',
    'acknowledgement and What’s New navigation need sender/URL authority',
    'False hides can be counted as product success',
    'Some mutation paths are UI-guarded while lower-level writers can still affect locked/child profiles'
  ]) {
    assert.ok(source.includes(phrase), `missing reviewed dependency phrase ${phrase}`);
  }
});

test('feature_source_dependency_register_requires_source_confidence_and_side_effect_gates', () => {
  const source = doc();

  for (const gate of [
    'source and confidence tier',
    'allowed side effects',
    'positive fixture',
    'negative nonmatching/sibling-visible fixture',
    'no-work or budget fixture when page-resident',
    'restore/cleanup fixture when DOM state is written',
    'Until those fields are proven, the implementation gate stays closed'
  ]) {
    assert.match(source, new RegExp(gate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('feature_source_dependency_register_cites_current_source_surfaces_for_rows', () => {
  const source = doc();

  for (const token of [
    'js/background.js',
    'js/settings_shared.js',
    'js/seed.js',
    'js/filter_logic.js',
    'js/content/dom_fallback.js',
    'js/content_bridge.js',
    'js/content/collab_dialog.js',
    'js/injector.js',
    'js/tab-view.js',
    'js/content/release_notes_prompt.js'
  ]) {
    assert.ok(source.includes(token), `missing source citation token ${token}`);
  }
});

test('feature_source_dependency_register_source_backs_reviewed_hidden_dependency_rows', () => {
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');
  const fallback = read('js/content/dom_fallback.js');
  const filter = read('js/filter_logic.js');
  const injector = read('js/injector.js');
  const tabView = read('js/tab-view.js');
  const prompt = read('js/content/release_notes_prompt.js');

  assert.match(bridge, /enrichVisibleShortsWithChannelInfo\(channelInfo\.id/);
  assert.match(bridge, /enrichVisiblePlaylistRowsWithChannelInfo\(channelInfo\.id/);
  assert.match(bridge, /fetchChannelFromShortsUrl\(videoId, null, \{ allowDirectFetch: false \}\)/);
  assert.match(bridge, /fetchWatchIdentityFromBackground\(videoId\)/);

  assert.match(filter, /shortsLockupViewModel:\s*\{/);
  assert.match(filter, /reelItemRenderer:\s*\{/);
  assert.doesNotMatch(filter, /\n\s*sharedPostRenderer\s*:/);

  assert.match(fallback, /nameOnlyNames/);
  assert.match(fallback, /stableNames/);
  assert.match(fallback, /getCurrentPageChannelMeta/);
  assert.match(fallback, /data-filtertube-whitelist-pending/);

  assert.match(injector, /browseId:\s*'FEchannels'/);
  assert.match(tabView, /copyBlocklist:\s*false/);

  assert.match(prompt, /FilterTube_OpenWhatsNew/);
  assert.match(background, /FilterTube_OpenWhatsNew/);
  assert.match(background, /recordTimeSaved/);
});

test('feature_source_dependency_register_has_no_runtime_authority_symbol_yet', () => {
  const source = doc();

  assert.match(source, /No runtime symbol exists yet/);
  assert.match(source, /This register is a current audit artifact, not a runtime arbiter/);

  const runtime = [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/background.js',
    'js/state_manager.js',
    'js/settings_shared.js'
  ].map(read).join('\n');

  assert.doesNotMatch(runtime, /featureSourceDependencyAuthority/);
  assert.doesNotMatch(runtime, /featureDependencyReport/);
  assert.doesNotMatch(runtime, /sourceConfidenceByFeature/);
});

test('feature_source_dependency_register_is_linked_from_objective_and_stabilization_docs', () => {
  const ledger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const fixOrder = read('docs/audit/FILTERTUBE_STABILIZATION_FIX_ORDER_2026-05-19.md');

  assert.match(ledger, /Feature source dependency register addendum/);
  assert.match(ledger, /rule-state source, content\/text source, identity source/);
  assert.match(fixOrder, /Feature source dependency register/);
  assert.match(fixOrder, /feature-source dependency proof/);
});
