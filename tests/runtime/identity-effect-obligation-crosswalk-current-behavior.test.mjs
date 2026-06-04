import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_IDENTITY_EFFECT_OBLIGATION_CROSSWALK_2026-05-20.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const identityFamilyDocs = [
  docPath,
  'docs/audit/FILTERTUBE_IDENTITY_RESOLVER_FANOUT_CURRENT_BEHAVIOR_2026-05-20.md',
  'docs/audit/FILTERTUBE_IDENTITY_WATERFALL_REVIEW_CONVERGENCE_2026-05-20.md',
  'docs/audit/FILTERTUBE_IDENTITY_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-20.md',
  'docs/audit/FILTERTUBE_IDENTITY_FLOW_DIAGRAM_REGISTER_2026-05-20.md',
  'docs/audit/FILTERTUBE_IDENTITY_WATERFALL_ASSERTION_BOUNDARY_2026-05-20.md',
  'docs/audit/FILTERTUBE_IDENTITY_INFORMATION_WATERFALL_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_IDENTITY_RESOLVER_CACHE_DEDUPE_CURRENT_BEHAVIOR_2026-05-20.md',
  'docs/audit/FILTERTUBE_LEARNED_IDENTITY_MAP_WRITE_ENTRYPOINT_REGISTER_2026-05-20.md',
  'docs/audit/FILTERTUBE_LEARNED_IDENTITY_MAP_CACHE_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_LEARNED_IDENTITY_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_P0_LEARNED_IDENTITY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_DOM_IDENTITY_CONFIDENCE_CURRENT_BEHAVIOR_2026-05-20.md',
  'docs/audit/FILTERTUBE_SURFACE_INFORMATION_AVAILABILITY_CURRENT_BEHAVIOR_2026-05-20.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('website/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function crosswalkRows() {
  return read(docPath)
    .split('\n')
    .filter(line => line.startsWith('| `'))
    .map(line => line.split('|').map(cell => cell.trim()))
    .map(cells => ({
      obligation: cells[1].replace(/^`|`$/g, ''),
      currentSourceProof: cells[2],
      currentRisk: cells[3],
      futureProof: cells[4]
    }));
}

test('identity effect obligation crosswalk is audit-only and blocks runtime changes', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /does not prove which visible effect is allowed/);
  assert.match(doc, /Until those authorities or equivalent fixture-backed contracts exist/);
});

test('identity effect obligation crosswalk references the current proof slices it depends on', () => {
  const doc = read(docPath);

  for (const artifact of [
    'docs/audit/FILTERTUBE_IDENTITY_INFORMATION_WATERFALL_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_SOURCE_TIER_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md',
    'docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md',
    'docs/audit/FILTERTUBE_JSON_RUNTIME_COVERAGE_GAP_REGISTER_2026-05-20.md',
    'docs/audit/FILTERTUBE_DOM_IDENTITY_CONFIDENCE_CURRENT_BEHAVIOR_2026-05-20.md',
    'docs/audit/FILTERTUBE_IDENTITY_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-20.md',
    'docs/audit/FILTERTUBE_IDENTITY_RESOLVER_FANOUT_CURRENT_BEHAVIOR_2026-05-20.md',
    'docs/audit/FILTERTUBE_IDENTITY_WATERFALL_REVIEW_CONVERGENCE_2026-05-20.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing proof artifact ${artifact}`);
    assert.ok(fs.existsSync(path.join(repoRoot, artifact)), `missing referenced file ${artifact}`);
  }
});

test('identity and learned-identity docs carry the method proof gap blocker', () => {
  const gap = read(methodGapPath);

  for (const token of [
    'tracked JS/JSX/MJS files: 69',
    'repo-wide lexical callables: 5827',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5827',
    'runtime behavior changed: no'
  ]) {
    assert.ok(gap.includes(token), `method gap index missing token ${token}`);
  }

  for (const auditDoc of identityFamilyDocs) {
    const text = read(auditDoc);
    for (const token of [
      methodGapPath,
      'method semantic proof gap files covered: 69',
      'method semantic proof gap lexical callables covered: 5827',
      'files with complete per-callable semantic proof: 0',
      'lexical callables requiring semantic proof before behavior changes: 5827',
      'affected callable semantic proof: NO-GO',
      'runtime behavior changed: no',
      'JSON-first promotion',
      'optimization',
      'whitelist behavior changes'
    ]) {
      assert.ok(text.includes(token), `${auditDoc} missing blocker token ${token}`);
    }
  }
});

test('identity effect obligation crosswalk enumerates every required identity effect obligation', () => {
  const rows = crosswalkRows();
  const obligations = rows.map(row => row.obligation);

  assert.equal(rows.length, 14);
  assert.deepEqual(obligations, [
    'endpoint_body_no_work',
    'direct_json_renderer_effect',
    'harvest_only_map_write',
    'learned_map_join_effect',
    'dom_stable_link_effect',
    'dom_display_name_effect',
    'current_page_owner_injection',
    'whitelist_pending_hide_effect',
    'network_resolver_effect',
    'post_action_fanout_effect',
    'playlist_mix_identity_effect',
    'kids_ytm_surface_effect',
    'comments_posts_author_effect',
    'hide_restore_stats_effect'
  ]);

  for (const row of rows) {
    assert.match(row.currentSourceProof, /js\/|docs\//, `${row.obligation} lacks source proof`);
    assert.notEqual(row.currentRisk, '', `${row.obligation} lacks current risk`);
    assert.match(row.futureProof, /fixture|proof|report|counter|budget|authority/i, `${row.obligation} lacks future proof gate`);
  }
});

test('identity effect obligation crosswalk is source-backed by current runtime tokens', () => {
  const runtime = productRuntimeSource();

  for (const token of [
    'response.clone().json()',
    'JSON.parse(trimmed)',
    'processWithEngine',
    'harvestOnly',
    'FilterTube_UpdateVideoChannelMap',
    'FilterTube_UpdateVideoMetaMap',
    'videoChannelMap',
    'applyWhitelistPendingHide',
    'fetchChannelFromShortsUrl(videoId, null, { allowDirectFetch: false })',
    'enrichVisibleShortsWithChannelInfo(channelInfo.id',
    'enrichVisiblePlaylistRowsWithChannelInfo(channelInfo.id',
    'performShortsIdentityFetch(videoId',
    'performKidsWatchIdentityFetch(videoId)',
    'performWatchIdentityFetch(videoId)',
    'fetchChannelDetails',
    'toggleVisibility('
  ]) {
    assert.ok(runtime.includes(token), `missing runtime token ${token}`);
  }

  const filterLogic = read('js/filter_logic.js');
  for (const token of [
    'shortsLockupViewModel',
    'reelItemRenderer',
    'radioRenderer',
    'compactRadioRenderer',
    'commentRenderer',
    'backstagePostRenderer',
    'kidsVideoOwnerExtension'
  ]) {
    assert.ok(filterLogic.includes(token), `missing filter logic token ${token}`);
  }
});

test('identity effect obligation crosswalk names the future decision shape and confirms it is absent', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const field of [
    'routeSurface',
    'profileId',
    'profileType',
    'listMode',
    'activeRuleFamily',
    'sourceTier',
    'sourceFieldsPresent',
    'sourceConfidence',
    'targetKind',
    'userActionClass',
    'allowedEffects',
    'deniedEffects',
    'networkPolicy'
  ]) {
    assert.ok(doc.includes(field), `missing decision field ${field}`);
  }

  for (const authority of [
    'identityEffectDecision',
    'identityEffectObligationRegistry',
    'endpointBodyNoWorkDecision',
    'directJsonRendererEffectAuthority',
    'harvestOnlyMapWriteAuthority',
    'learnedMapJoinAuthority',
    'domDisplayNameEffectAuthority',
    'whitelistPendingHideAuthority',
    'postActionFanoutAuthority'
  ]) {
    assert.ok(doc.includes(authority), `missing authority token ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} unexpectedly exists in runtime source`);
  }
});
