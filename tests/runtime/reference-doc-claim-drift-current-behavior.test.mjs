import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_REFERENCE_DOC_CLAIM_DRIFT_CURRENT_BEHAVIOR_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

test('reference_doc_claim_drift_register_documents_current_scope', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof slice/);
  assert.match(doc, /Runtime behavior remains unchanged/);
  assert.match(doc, /JSON-first, not JSON-complete/);
  assert.match(doc, /Drift Register/);
  assert.match(doc, /README\.md/);
  assert.match(doc, /CHANNEL_BLOCKING_SYSTEM\.md/);
  assert.match(doc, /NETWORK_REQUEST_PIPELINE\.md/);
  assert.match(doc, /YOUTUBE_KIDS_INTEGRATION\.md/);
  assert.match(doc, /THREE_DOT_MENU_IMPROVEMENTS\.md/);
  assert.match(doc, /TECHNICAL\.md/);
  assert.match(doc, /WATCH_PLAYLIST_BREAKDOWN\.md/);
  assert.match(doc, /FUNCTIONALITY\.md/);
  assert.match(doc, /CONTENT_HIDING_PLAYBOOK\.md/);
  assert.match(doc, /Audit Directory Containment Addendum - 2026-05-29/);
  assert.match(doc, /audit artifact directory: docs\/audit/);
  assert.match(doc, /runtime proof directory: tests\/runtime/);
  assert.match(doc, /core product docs currently carrying scoped claim corrections: 14/);
  assert.match(doc, /new top-level audit files outside docs\/audit: 0/);
  assert.match(doc, /product-doc role: concise claim correction and links to audit authority/);
  assert.match(doc, /audit-doc role: source pins, gaps, ledgers, matrices, diagrams, and proof text/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /stale public\/developer claim/);
  assert.match(doc, /```mermaid/);
  assert.match(doc, /`audit_docs_home`/);
  assert.match(doc, /`runtime_proof_home`/);
  assert.match(doc, /`core_doc_claim_corrections`/);
  assert.match(doc, /`claim_authority_boundary`/);
  assert.match(doc, /`release_readability_boundary`/);
});

test('reference_doc_claim_drift_scopes_public_readme_identity_and_privacy_claims', () => {
  const readme = read('README.md');
  const developerGuide = read('docs/DEVELOPER_GUIDE.md');
  const rendererInventory = read('docs/youtube_renderer_inventory.md');

  for (const staleClaim of [
    'Instant Blocking',
    'Zero Flash',
    '100% Private',
    'No External Requests',
    'XHR interception and instant stamping',
    'intercepts the data BEFORE it renders',
    'Everything happens in your browser. No data is sent to external servers.',
    'block instantly',
    'Zero Leakage'
  ]) {
    assert.ok(!readme.includes(staleClaim), `README still contains stale claim: ${staleClaim}`);
  }

  assert.match(readme, /JSON-backed surfaces can be filtered before paint when YouTube exposes the needed fields/);
  assert.match(readme, /weak targets may still use a resolver/);
  assert.match(readme, /bounded fallback resolvers remain for weak watch, Shorts, Kids, playlist, and menu targets/);
  assert.match(readme, /Extension rules and settings stay in browser storage/);
  assert.match(readme, /does not run a FilterTube account service, extension analytics, or ad-tracking profile/);
  assert.match(readme, /Some route-specific surfaces still need DOM enrichment or a bounded\s+background resolver/);
  assert.match(readme, /Local-first runtime/);

  assert.doesNotMatch(developerGuide, /Test zero-network behavior/);
  assert.match(developerGuide, /Test JSON-first behavior plus bounded fallback resolver behavior/);

  assert.doesNotMatch(rendererInventory, /Zero-Network Operation/);
  assert.match(rendererInventory, /Reduced Network Use/);
  assert.match(rendererInventory, /weak watch, Shorts, Kids, playlist, and menu targets can still require bounded fallback resolvers/);
  assert.match(rendererInventory, /JSON Snapshot Identity System/);
  assert.match(rendererInventory, /Resolver Reduction Boundary/);
  assert.doesNotMatch(rendererInventory, /Enhanced Performance:\s*Reduced network calls through proactive data stashing/);
  assert.doesNotMatch(rendererInventory, /Enhanced search across all proactive sources/);

  const architectureDoc = read('docs/ARCHITECTURE.md');
  assert.match(architectureDoc, /JSON-aware channel identity layer/);
  assert.match(architectureDoc, /not a guarantee of before-render identity/);
  assert.match(architectureDoc, /zero fallback resolver work/);
  assert.doesNotMatch(architectureDoc, /proactive channel identity system with performance optimizations/);
  assert.doesNotMatch(architectureDoc, /Instant Channel Names/);
  assert.doesNotMatch(architectureDoc, /Instant 3-dot menu names/);
  assert.doesNotMatch(architectureDoc, /Responsive UI - No Lag/);
  assert.match(architectureDoc, /Proven\/Mapped Channel Names/);
  assert.match(architectureDoc, /Proven 3-dot menu names/);
  assert.match(architectureDoc, /Reduced-Lag UI Intent/);
});

test('reference_doc_claim_drift_scopes_architecture_and_playbook_instant_zero_flash_language', () => {
  const doc = read(docPath);
  const architectureDoc = read('docs/ARCHITECTURE.md');
  const playbook = read('docs/CONTENT_HIDING_PLAYBOOK.md');

  assert.match(doc, /zero-network, proactive, instant, zero-flash, or performance shorthand/);
  assert.match(doc, /scoped optimistic hide wording instead of global instant\/zero-flash labels/);
  assert.match(doc, /optimizations reduce lag/);
  assert.match(doc, /whitelist pre-render filtering is best-effort only when intercepted JSON carries the needed fields/);

  assert.match(architectureDoc, /Scoped Optimistic Hide/);
  assert.match(architectureDoc, /Earlier notes called this a \*\*Zero-Flash\*\* path/);
  assert.match(architectureDoc, /global zero-flash guarantee is not proven/);
  assert.match(architectureDoc, /metadata is missing/);
  assert.match(architectureDoc, /route,\s+mode, source-confidence, no-work, sibling-visible, and restore proof/);
  assert.match(architectureDoc, /additional proof surfaces beyond\s+feed\/search filtering/);
  assert.doesNotMatch(architectureDoc, /Phase 2: Instant Hiding/);
  assert.doesNotMatch(architectureDoc, /hide element \(Zero Flash\)/);
  assert.doesNotMatch(architectureDoc, /This hybrid path keeps \*\*Zero-Flash\*\* guarantees/);

  assert.match(playbook, /performance optimizations reduce lag and improve responsiveness/);
  assert.match(playbook, /without claiming every route\/device is lag-free/);
  assert.match(playbook, /Best-effort pre-render \*\*whitelist\*\* filtering when intercepted JSON carries the needed fields/);
  assert.doesNotMatch(playbook, /performance optimizations eliminate lag/);
  assert.doesNotMatch(playbook, /Zero-flash \*\*whitelist\*\* filtering/);
});

test('reference_doc_claim_drift_pins_stale_network_and_kids_claims', () => {
  const networkDoc = read('docs/NETWORK_REQUEST_PIPELINE.md');
  const kidsDoc = read('docs/YOUTUBE_KIDS_INTEGRATION.md');
  const technicalDoc = read('docs/TECHNICAL.md');
  const developerGuide = read('docs/DEVELOPER_GUIDE.md');
  const background = read('js/background.js');

  assert.match(networkDoc, /Current-behavior boundary \(2026-05-19\)/);
  assert.match(networkDoc, /JSON-first, not JSON-complete/);
  assert.match(networkDoc, /JSON-aware identity pipeline/);
  assert.match(networkDoc, /source-confidence layer rather than a guarantee/);
  assert.match(networkDoc, /background watch\/Shorts\/Kids\/channel resolvers still exist/);
  assert.match(technicalDoc, /Current-behavior boundary \(2026-05-19\)/);
  assert.match(technicalDoc, /"JSON-first" does not\s+> mean "JSON-only"/);
  assert.match(technicalDoc, /fallback resolvers, learned maps/);

  assert.match(networkDoc, /source-confidence layer rather than a guarantee of pre-render identity or instant blocking across every route/);
  assert.match(networkDoc, /Some watch, Shorts, playlist, Kids, and weak menu targets still need learned maps, DOM enrichment, or a background resolver/);
  assert.match(networkDoc, /DOM Stamping \(data-filtertube-\* when identity is known\)/);
  assert.match(networkDoc, /Fallback Network Requests \(scoped resolver path\)/);
  assert.match(networkDoc, /Kids network boundary/);
  assert.match(networkDoc, /not JSON-only/);
  assert.match(networkDoc, /not as a global guarantee that every surface is complete before first paint/);
  assert.match(kidsDoc, /JSON-first, fallback-aware/);
  assert.match(kidsDoc, /JSON-first, Resolver-aware Kids Identity/);
  assert.match(kidsDoc, /not a zero-network guarantee/);
  assert.match(kidsDoc, /scoped background\s+Kids watch resolver/);
  assert.match(kidsDoc, /route-specific/);
  assert.match(kidsDoc, /watch\/player surfaces may expose only a video id/);
  assert.match(kidsDoc, /Do not trigger direct page-context network fetches here/);
  assert.match(developerGuide, /Do not assume Kids is globally zero-network/);
  assert.match(developerGuide, /scoped background Kids watch resolver after cache\/map checks/);
  assert.doesNotMatch(developerGuide, /Use only XHR data, no network fetches/);
  assert.doesNotMatch(developerGuide, /Remember to skip network fetches on Kids/);
  assert.doesNotMatch(networkDoc, /proactive, XHR-first/i);
  assert.doesNotMatch(networkDoc, /enables instant blocking across all surfaces/);
  assert.doesNotMatch(networkDoc, /\*\*XHR-only identity\*\* - relies entirely on intercepted JSON/);
  assert.doesNotMatch(networkDoc, /\*\*Zero-network operation\*\* - no fetch requests for Kids/);
  assert.doesNotMatch(kidsDoc, /provides \*\*zero-network\*\* integration/);
  assert.doesNotMatch(kidsDoc, /Key Principle: No Network Fetches/);
  assert.doesNotMatch(kidsDoc, /Never from network fetches/);
  assert.doesNotMatch(kidsDoc, /Never trigger network fetches on Kids/);
  assert.doesNotMatch(kidsDoc, /relying entirely on proactive XHR interception/);
  assert.doesNotMatch(kidsDoc, /ensures reliable blocking on YouTube Kids/);
  assert.match(technicalDoc, /Kids scoped network boundary/);
  assert.match(technicalDoc, /Fast blocking on proven identity/);
  assert.match(technicalDoc, /route-specific gaps still requiring proof/);
  assert.doesNotMatch(technicalDoc, /Kids zero-network mode\*\* works entirely from intercepted JSON/);
  assert.doesNotMatch(technicalDoc, /Reliable Kids operation\*\* - works even when Kids blocks external requests/);

  const kidsBlock = sliceBetween(
    background,
    'async function performKidsWatchIdentityFetch(videoId)',
    'async function performWatchIdentityFetch(videoId)'
  );
  assert.match(kidsBlock, /storageGet\(\['videoChannelMap'\]\)/);
  assert.match(kidsBlock, /pendingKidsWatchIdentityFetches\.has\(videoId\)/);
  assert.match(kidsBlock, /fetch\(`https:\/\/www\.youtubekids\.com\/watch\?v=\$\{videoId\}`/);

  assert.match(background, /\? \(await performKidsWatchIdentityFetch\(effectiveVideoId\) \|\| await performWatchIdentityFetch\(effectiveVideoId\)\)/);
});

test('reference_doc_claim_drift_pins_channel_system_waterfall_as_source_tier_not_permission', () => {
  const channelDoc = read('docs/CHANNEL_BLOCKING_SYSTEM.md');
  const proactiveDoc = read('docs/PROACTIVE_CHANNEL_IDENTITY.md');
  const register = read(docPath);

  assert.match(register, /docs\/CHANNEL_BLOCKING_SYSTEM\.md/);
  assert.match(register, /source tier rather than source-of-truth wording/);
  assert.match(register, /missing `modeSurfaceEffectAuthority` boundary/);
  assert.match(channelDoc, /JSON-first identity strategy/);
  assert.match(channelDoc, /preferred source tier/);
  assert.match(channelDoc, /not automatic permission to hide, fetch, mutate, stamp,\s+or persist/);
  assert.match(channelDoc, /specific\s+profile, mode, route, renderer family, source tier, and allowed side effect/);
  assert.match(channelDoc, /Current behavior still lacks a shared `modeSurfaceEffectAuthority`/);
  assert.match(channelDoc, /source tier says: where identity came from/);
  assert.match(channelDoc, /mode\/surface says: whether that identity may hide, allow, restore, fetch/);
  assert.match(channelDoc, /Two paths, both source-confidence inputs/);
  assert.match(channelDoc, /Neither path by itself proves that\s+every visible card has complete identity before render/);
  assert.match(channelDoc, /attempt canonical UC ID resolution/);
  assert.doesNotMatch(channelDoc, /preferred source of truth/);
  assert.doesNotMatch(channelDoc, /proactive, XHR-first strategy/);
  assert.doesNotMatch(channelDoc, /Two paths, both proactive/);
  assert.doesNotMatch(channelDoc, /guarantee a canonical UC ID/);

  assert.match(proactiveDoc, /Preferred first evidence tier/);
  assert.match(proactiveDoc, /Secondary page-global evidence tier/);
  assert.doesNotMatch(proactiveDoc, /Preferred first authority/);
  assert.doesNotMatch(proactiveDoc, /Secondary page-global authority/);
});

test('reference_doc_claim_drift_pins_menu_and_dom_overclaims', () => {
  const menuDoc = read('docs/THREE_DOT_MENU_IMPROVEMENTS.md');
  const functionalityDoc = read('docs/FUNCTIONALITY.md');
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');

  assert.match(menuDoc, /Current-behavior boundary \(2026-05-19\)/);
  assert.match(menuDoc, /always-successful DOM extraction/);
  assert.match(menuDoc, /weak watch, Shorts, playlist, Kids, or YTM targets/);
  assert.match(menuDoc, /fallback resolvers or fail/);

  assert.match(menuDoc, /DOM Extraction \(visible-card best effort; can return null\/needsFetch\)/);
  assert.match(menuDoc, /Faster blocking when proactive XHR interception, learned maps, or stamped DOM already prove identity/);
  assert.ok(menuDoc.includes('**Try network fetch** for complete details'));
  assert.ok(menuDoc.includes('**Network fetch time target / historical estimate**: < 2000ms (95th percentile)'));
  assert.match(functionalityDoc, /reduces "Fetching\.\.\." delays/);
  assert.match(functionalityDoc, /weak targets can still enter resolver or failure paths/);
  assert.doesNotMatch(functionalityDoc, /eliminating "Fetching\.\.\." delays/);

  const extractBlock = sliceBetween(
    bridge,
    'function extractChannelFromCard(card)',
    'async function injectFilterTubeMenuItem'
  );
  assert.match(extractBlock, /needsFetch: true/);
  assert.match(extractBlock, /return null/);

  assert.match(bridge, /action: 'fetchChannelDetails'/);
  assert.match(bridge, /fetchChannelFromWatchUrl\(channelInfo\.videoId/);
  assert.match(bridge, /fetchChannelFromShortsUrl\(channelInfo\.videoId/);

  assert.match(background, /sendResponse\(\{ success: false, identity: null, error: 'not_found' \}\)/);
  assert.match(background, /sendResponse\(\{ success: false, error: details\.error \|\| 'Failed to fetch channel info' \}\)/);
});

test('reference_doc_claim_drift_pins_post_block_enrichment_as_post_action_not_passive_loop', () => {
  const playbook = read('docs/CONTENT_HIDING_PLAYBOOK.md');
  const background = read('js/background.js');

  assert.doesNotMatch(playbook, /There is \*\*no proactive enrichment loop\*\*/);
  assert.match(playbook, /does not run a passive, page-wide enrichment loop/);
  assert.match(playbook, /rate-limited post-block enrichment/);
  assert.match(playbook, /after a successful block/);
  assert.match(playbook, /source waterfall \(`XHR JSON -> ytInitial\* -> learned maps -> DOM -> bounded background resolver`\)/);
  assert.match(playbook, /identity priority order, not as permission to hide, write, fetch, or rescan/);
  assert.match(playbook, /identityResolverAuthority/);
  assert.match(playbook, /postActionIdentityFanoutBudget/);
  assert.match(playbook, /networkFetchReasonAuthority/);

  const enrichment = sliceBetween(
    background,
    'function schedulePostBlockEnrichment(channel, profile =',
    'function getChannelDerivedKeywordRef'
  );
  assert.match(enrichment, /source === 'postBlockEnrichment'/);
  assert.match(enrichment, /postBlockEnrichmentAttempted/);
  assert.match(enrichment, /needsEnrichment/);
  assert.match(enrichment, /handleAddFilteredChannel\(/);
  assert.match(background, /schedulePostBlockEnrichment\(finalChannelData, profile,/);
});

test('reference_doc_claim_drift_links_to_source_truth_and_future_authorities', () => {
  const doc = read(docPath);
  const source = [
    'js/background.js',
    'js/content_bridge.js',
    'js/content/handle_resolver.js',
    'js/content/dom_fallback.js',
    'js/filter_logic.js',
    'js/seed.js'
  ].map(read).join('\n');

  for (const token of [
    'performKidsWatchIdentityFetch(videoId)',
    'extractChannelFromCard(card)',
    'handleBlockChannelClick(...)',
    'schedulePostBlockEnrichment(...)',
    'referenceDocClaimAuthority',
    'identityFetchAuthority',
    'menuResolutionAuthority',
    'kidsNetworkPolicyAuthority'
  ]) {
    assert.ok(doc.includes(token), `missing doc token ${token}`);
  }

  assert.doesNotMatch(source, /referenceDocClaimAuthority/);
  assert.doesNotMatch(source, /identityFetchAuthority/);
  assert.doesNotMatch(source, /menuResolutionAuthority/);
  assert.doesNotMatch(source, /kidsNetworkPolicyAuthority/);
});
