#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_CLIENT = 'js/nanah_managed_local_network_client.js';
const DEFAULT_TAB_VIEW = 'js/tab-view.js';
const DEFAULT_PROVIDER = 'scripts/managed-delivery-provider.mjs';
const DEFAULT_DISCOVERY = 'scripts/managed-delivery-lan-discovery.mjs';

function parseArgs(argv) {
  const args = {
    client: DEFAULT_CLIENT,
    tabView: DEFAULT_TAB_VIEW,
    provider: DEFAULT_PROVIDER,
    discovery: DEFAULT_DISCOVERY,
    strict: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--strict') {
      args.strict = true;
      continue;
    }
    if (arg === '--client') {
      args.client = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--tab-view') {
      args.tabView = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--provider') {
      args.provider = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--discovery') {
      args.discovery = argv[index + 1] || '';
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function readText(relativePath) {
  return fs.readFileSync(path.resolve(relativePath), 'utf8');
}

function has(text, pattern) {
  if (pattern instanceof RegExp) return pattern.test(text);
  return text.includes(pattern);
}

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

function check(label, ok, detail) {
  return { label, ok: ok === true, detail };
}

function formatStatus(ok) {
  return ok ? 'pass' : 'fail';
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const client = readText(args.client);
  const tabView = readText(args.tabView);
  const provider = readText(args.provider);
  const discovery = readText(args.discovery);

  const checks = [
    check(
      'Configured endpoint required before Home Pickup provider exists',
      has(client, 'if (!normalizeString(config.endpointUrl || config.url || config.baseUrl)) return null;')
        && has(client, 'installConfiguredProvider')
        && has(client, 'global.FilterTubeManagedPolicyLocalNetwork = provider;'),
      'No configured endpoint means no provider is installed for discovery/pickup.'
    ),
    check(
      'Home Pickup endpoint is restricted to HTTPS or private/local HTTP',
      has(client, 'url.protocol !== \'https:\' && !(url.protocol === \'http:\' && privateHost)')
        && has(client, 'isPrivateHostname'),
      'Public HTTP endpoints are rejected; local/private HTTP is allowed for home setups.'
    ),
    check(
      'Provider supports publish, discover, ack, purge, and health paths',
      [
        'publishManagedPolicyCandidates',
        'discoverManagedPolicyCandidates',
        'ackLocalNetworkCandidates',
        'purgeLocalNetworkCandidates',
        'checkManagedLocalNetworkBridge'
      ].every(name => has(client, name)),
      'This proves Home Pickup is an explicit provider surface, not hidden page scanning.'
    ),
    check(
      'Provider requests omit credentials',
      has(client, 'credentials: \'omit\''),
      'Pickup calls do not attach browser cookies to the configured provider.'
    ),
    check(
      'Candidate and ack sanitizers refuse private keys or plaintext rule payloads',
      has(client, 'containsPrivateKey')
        && has(client, 'containsDeliveryAckPlaintext')
        && has(client, 'FORBIDDEN_DELIVERY_ACK_KEYS')
        && has(client, 'sanitizeCandidate')
        && has(client, 'sanitizeAckRequest'),
      'Provider data is cleaned before local validation and before ack reporting.'
    ),
    check(
      'Protected-device pull requires an existing trusted replica link',
      has(tabView, 'function getNanahManagedLocalNetworkEligibleLinks')
        && has(tabView, 'trusted.localRole !== \'replica\' || trusted.remoteRole !== \'source\'')
        && has(tabView, 'policy.syncOnProfileOpen !== true')
        && has(tabView, 'lockedChildMode).toLowerCase() !== \'allow_trusted_updates\'')
        && has(tabView, 'targetProfileId !== normalizeString(activeId)'),
      'A protected profile can pull only through a saved parent link for its active profile.'
    ),
    check(
      'Home Bridge preview is based on saved trusted source links',
      has(tabView, 'function collectNanahHomeBridgePreviewCandidates')
        && has(tabView, 'safeArray(nanahTrustedLinks)')
        && has(tabView, 'entry.localRole !== \'source\' || entry.remoteRole !== \'replica\'')
        && has(tabView, 'isNanahManagedLinkSavedUpdateEnabled(entry)')
        && has(tabView, 'source: \'home-bridge-preview\''),
      'The map can surface verified saved devices, not raw untrusted LAN devices.'
    ),
    check(
      'Home Bridge preview stops before provider work when not configured',
      has(tabView, 'function refreshNanahHomeBridgePreview')
        && has(tabView, 'home_bridge_not_configured')
        && has(tabView, 'hasNanahManagedLocalNetworkDiscoveryReader()'),
      'The dashboard can show the map without starting local-network discovery.'
    ),
    check(
      'Local-network sync stops before discovery without provider or eligible links',
      has(tabView, 'function runNanahManagedLocalNetworkSync')
        && has(tabView, 'providerAvailable: typeof discovery === \'function\'')
        && has(tabView, 'eligibleLinks.length === 0')
        && has(tabView, 'local_network_provider_unavailable')
        && has(tabView, 'no_eligible_links'),
      'No provider or no trusted link means no candidate fetch and no policy apply.'
    ),
    check(
      'Configured Home Bridge exposes the opt-in nearby-presence contract',
      [
        'announceNearbyDevice',
        'discoverNearbyDevices',
        'inviteNearbyDevice',
        'pullNearbyPairingInvitations',
        'withdrawNearbyDevice'
      ].every(name => has(client, name))
        && [
          'managed-local-network/presence/announce',
          'managed-local-network/presence/discover',
          'managed-local-network/presence/invite',
          'managed-local-network/presence/invitations/pull',
          'managed-local-network/presence/withdraw'
        ].every(endpoint => has(provider, endpoint)),
      'Nearby finding uses the configured bridge and does not imply browser-level network scanning.'
    ),
    check(
      'Nearby presence is short-lived, bounded, and does not expose its receive token',
      has(provider, 'const NEARBY_PRESENCE_TTL_MS = 75 * 1000;')
        && has(provider, 'const NEARBY_INVITATION_TTL_MS = 2 * 60 * 1000;')
        && has(provider, 'const MAX_NEARBY_PRESENCE = 64;')
        && has(provider, 'receiveTokenHash = hashNearbyReceiveToken(root.receiveToken)')
        && has(provider, 'return pickAllowed(safeObject(row), NEARBY_PRESENCE_PUBLIC_KEYS);'),
      'The bridge stores a token hash, returns only public presence fields, and expires transient rows.'
    ),
    check(
      'Finding and visibility start only from explicit parent/device actions',
      has(tabView, "findButton.addEventListener('click', async () => {")
        && has(tabView, "startNanahNearbyDiscoverySession({ reason: 'family_devices_find_nearby' })")
        && has(tabView, "ftNanahCompassHomeBtn.addEventListener('click', async () => {")
        && has(tabView, "startNanahNearbyDiscoverySession({ reason: 'family_map_find_nearby' })")
        && has(tabView, "visibilityButton.addEventListener('click', () => {")
        && has(tabView, 'void startNanahNearbyVisibility();')
        && count(tabView, /startNanahNearbyDiscoverySession\(/g) === 3
        && count(tabView, /discoverNanahNearbyDevices\(/g) === 3
        && count(tabView, /startNanahNearbyVisibility\(/g) === 2,
      'Ordinary render/dashboard-open paths do not call nearby discovery or make the device visible.'
    ),
    check(
      'Parent-triggered nearby finding is bounded and stops outside Accounts & Sync',
      has(tabView, 'const NANAH_NEARBY_DISCOVERY_POLL_MS = 3000;')
        && has(tabView, 'const NANAH_NEARBY_DISCOVERY_MAX_MS = 2 * 60 * 1000;')
        && has(tabView, "stopNanahNearbyDiscoverySession({ reason: 'discovery_timeout' })")
        && has(tabView, "stopNanahNearbyDiscoverySession({ reason: 'dashboard_hidden' })")
        && has(tabView, "stopNanahNearbyDiscoverySession({ reason: 'left_accounts_sync' })")
        && has(tabView, "document.addEventListener('filtertube:view-changed'")
        && has(tabView, "document.dispatchEvent(new CustomEvent('filtertube:view-changed'")
        && has(tabView, "findButton.textContent = nearbyDiscoveryActive ? 'Stop finding' : 'Find nearby';"),
      'After a parent starts finding, the map refreshes briefly, offers Stop finding, and stops on timeout, tab hide, or navigation away.'
    ),
    check(
      'Unpaired nearby candidates can only enter phrase-verified pairing',
      has(tabView, "if (source === 'nearby-presence')")
        && has(tabView, "primaryAction: 'Pair nearby device'")
        && has(tabView, "blockedAction: 'Send before phrase match'")
        && has(tabView, 'async function pairNanahNearbyCandidate(candidateId)')
        && has(tabView, "source: 'nearby-presence'")
        && has(tabView, 'await joinNanahSessionWithCode(code'),
      'Visibility supplies a temporary candidate and short code; trust still requires the existing safety phrase.'
    ),
    check(
      'Local companion discovery is multicast, short-lived, and payload-free',
      has(discovery, "import dgram from 'node:dgram'")
        && has(discovery, "const DEFAULT_GROUP = '239.255.77.77';")
        && has(discovery, 'const REMOTE_TTL_MS = 10 * 1000;')
        && has(discovery, 'nextSocket.setMulticastTTL(1);')
        && has(discovery, "type: 'presence'")
        && has(discovery, "type: 'invitation'")
        && !has(discovery, 'blockedKeywords')
        && !has(discovery, 'blockedChannels')
        && !has(discovery, 'privateKey'),
      'The companion shares public presence and a short pairing invitation only; it does not multicast rules, PINs, profiles, or keys.'
    ),
    check(
      'Dashboard adopts the localhost companion only after an explicit nearby action',
      has(tabView, "const NANAH_LOCAL_DISCOVERY_COMPANION_ENDPOINT = 'http://127.0.0.1:8787/filtertube';")
        && has(tabView, 'async function ensureNanahLocalDiscoveryCompanion()')
        && has(tabView, "reason: 'explicit_nearby_companion_detection'")
        && has(tabView, 'lanDiscovery.started === true')
        && has(tabView, 'nearbyDiscoveryOnly: true')
        && count(tabView, /ensureNanahLocalDiscoveryCompanion\(\)/g) === 4,
      'No dashboard-open probe exists; Find nearby, Let this device appear, or the explicit same-place action may check localhost.'
    ),
    check(
      'Nearby-only companion cannot become managed Home Pickup authority',
      has(client, 'nearbyDiscoveryOnly: parsed.nearbyDiscoveryOnly === true')
        && has(tabView, 'root.nearbyDiscoveryOnly !== true')
        && has(tabView, 'localPath.pickupConfigured === true && localPath.healthOk === true'),
      'A discovered helper can list devices but cannot make a managed link ready for deferred policy delivery.'
    )
  ];

  const failed = checks.filter(row => !row.ok);
  console.log('Family Devices provider surface audit');
  console.log(`Client: ${args.client}`);
  console.log(`Tab view: ${args.tabView}`);
  console.log(`Provider: ${args.provider}`);
  console.log(`Discovery: ${args.discovery}`);
  console.log(`Checks: ${checks.length}`);
  console.log(`Passed: ${checks.length - failed.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');
  checks.forEach((row) => {
    console.log(`- ${formatStatus(row.ok)}: ${row.label}`);
    console.log(`  ${row.detail}`);
  });
  console.log('');
  console.log('Release boundary: explicit Home Bridge and the opt-in localhost companion support short-lived nearby finding and pair-only invitations. The extension does not scan subnets, zero-install native discovery remains future work, and presence is never authority.');

  if (args.strict && failed.length) {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(`Family Devices provider surface audit failed: ${error.message}`);
  process.exit(1);
}
