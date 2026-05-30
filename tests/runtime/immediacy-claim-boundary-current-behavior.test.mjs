import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_IMMEDIACY_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-21.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

test('immediacy_claim_boundary_is_audit_only_and_not_a_runtime_patch', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /This is not an implementation patch/);
  assert.match(source, /separates valid local immediacy from unsafe global claims/);
  assert.match(source, /"instant", "zero delay",\s+"before render", and "nothing escapes" are not safe as global behavior claims/);
});

test('immediacy_claim_boundary_distinguishes_safe_local_claims_from_global_claims', () => {
  const source = doc();

  for (const phrase of [
    'A clicked quick-block or menu target may hide optimistically after a user action',
    'Every matching item disappears instantly everywhere.',
    'JSON/player/page-global payloads are preferred when they expose stable channel or video fields.',
    'XHR JSON always proves identity before the DOM renders.',
    'A `videoId` by itself means channel identity is known.',
    'DOM fallback always succeeds and cannot false-hide.',
    'Post-action fanout is exact-target only, zero cost, or guaranteed complete.',
    'Installing FilterTube with no rules is already guaranteed zero-work.'
  ]) {
    assert.ok(source.includes(phrase), `missing boundary phrase: ${phrase}`);
  }
});

test('immediacy_claim_boundary_pins_unsafe_historical_reference_claims', () => {
  const source = doc();
  const watchDoc = read('docs/WATCH_PLAYLIST_BREAKDOWN.md');
  const architectureDoc = read('docs/ARCHITECTURE.md');
  const referenceDrift = read('docs/audit/FILTERTUBE_REFERENCE_DOC_CLAIM_DRIFT_CURRENT_BEHAVIOR_2026-05-19.md');

  for (const phrase of [
    'Instant playlist identity',
    'nothing escapes during race conditions',
    'hide any stray playlist rows instantaneously',
    'nothing selectable remains',
    'Zero-Flash guarantees for Shorts even when metadata is missing',
    'Zero-delay enforcement'
  ]) {
    assert.ok(source.includes(phrase), `missing unsafe claim boundary: ${phrase}`);
  }

  assert.match(watchDoc, /Instant playlist identity/);
  assert.match(watchDoc, /nothing escapes during race conditions/);
  assert.match(watchDoc, /hide any stray playlist rows instantaneously/);
  assert.match(watchDoc, /nothing selectable remains/);
  assert.match(architectureDoc, /Zero-Flash/);
  assert.match(referenceDrift, /docs\/WATCH_PLAYLIST_BREAKDOWN\.md/);
  assert.match(referenceDrift, /nothing escapes during race conditions/);
});

test('immediacy_claim_boundary_is_backed_by_current_local_immediate_paths', () => {
  const source = doc();
  const blockChannel = read('js/content/block_channel.js');
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');

  assert.match(source, /Quick block has an optimistic hide path for the clicked card/);
  assert.match(source, /3-dot block flow can optimistically hide the clicked video\/card\/comment/);
  assert.match(source, /visible Shorts and playlist rows may be enriched/);

  const quickHide = sliceBetween(
    blockChannel,
    'function applyQuickBlockImmediateHide(videoCard, channelInfo)',
    'async function runQuickBlockAction'
  );
  assert.match(quickHide, /targetToHide\.style\.display = 'none'/);

  const optimistic = sliceBetween(
    bridge,
    'let didOptimisticHide = false;',
    'if (didOptimisticHide && !blockPersisted)'
  );
  assert.match(optimistic, /didOptimisticHide = true/);
  assert.match(optimistic, /style\.display = 'none'/);

  assert.match(bridge, /enrichVisibleShortsWithChannelInfo\(channelInfo\.id/);
  assert.match(bridge, /enrichVisiblePlaylistRowsWithChannelInfo\(channelInfo\.id/);
  assert.match(background, /schedulePostBlockEnrichment\(finalChannelData, profile,/);
});

test('immediacy_claim_boundary_records_required_future_proof_before_fast_path_changes', () => {
  const source = doc();

  for (const phrase of [
    'route and surface',
    'Main/Kids/YTM/profile/list-mode state',
    'active-rule state, including empty blocklist and empty whitelist behavior',
    'identity source tier and confidence',
    'exact, sibling fanout, selected playlist row, or player',
    'allowed side effects: parse, mutate JSON, scan DOM, hide, restore, fetch',
    'no-work budget when no active rule can use the data',
    'negative sibling-visible fixture for nonmatching content',
    'restore/teardown proof for every DOM write, observer, timer, and listener'
  ]) {
    assert.ok(source.includes(phrase), `missing required proof phrase: ${phrase}`);
  }
});

test('immediacy_claim_boundary_confirms_missing_runtime_authority_tokens', () => {
  const source = doc();
  const runtime = [
    'js/background.js',
    'js/content_bridge.js',
    'js/content/block_channel.js',
    'js/content/dom_fallback.js',
    'js/filter_logic.js',
    'js/seed.js'
  ].map(read).join('\n');

  for (const token of [
    'immediacyClaimAuthority',
    'immediateHideDecision',
    'noEscapeBehaviorAuthority',
    'exactTargetFanoutDecision',
    'noRuleImmediateWorkBudget',
    'optimisticHideTransactionAuthority'
  ]) {
    assert.match(source, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
