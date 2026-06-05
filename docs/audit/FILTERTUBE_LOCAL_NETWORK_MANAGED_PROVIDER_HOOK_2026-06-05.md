# Audit: Local-Network Managed Provider Hook

**Generated**: 2026-06-05
**Status**: Dashboard/profile-open provider hook is present for local-network
managed-policy candidates. Built-in LAN peer discovery, LAN transport, server
mailbox pull, and server mailbox decrypt transport remain absent.
**Related plan**:
`docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md`
**Related authority boundary**:
`docs/audit/FILTERTUBE_LOCAL_NETWORK_DISCOVERY_AUTHORITY_BOUNDARY_2026-06-03.md`
**Related inventory**:
`docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md`

## Purpose

This slice adds the first extension-side handoff point for local-network
managed control. When the dashboard opens or the active profile changes, a
protected replica profile can ask an optional local provider for
`filtertube_managed_local_network_candidate` objects and pass each candidate
through the existing managed-policy local-network candidate validator.

The provider hook is not authority. It is discovery convenience only. Runtime
authority still comes from the locally saved managed Nanah link, target profile,
scope, revision, policy hash, device binding, and signature/integrity evidence.

## Optional Provider Shape

```js
window.FilterTubeManagedPolicyLocalNetwork = {
  async discoverManagedPolicyCandidates(request) {
    return { ok: true, candidates: [/* filtertube_managed_local_network_candidate */] };
  }
};
```

Providers may also expose `discoverLocalNetworkCandidates(request)` with the
same result shape. A provider can return an array directly, or an object with:

```text
ok: boolean
reason: string
candidates: array
```

If `ok` is `false` or the provider throws, no candidate is applied.

## Runtime Hooks Added

```text
js/tab-view.js
  NANAH_MANAGED_LOCAL_NETWORK_SYNC_STATE_KEY = ftNanahManagedLocalNetworkSyncState
  loadNanahManagedLocalNetworkSyncState()
  persistNanahManagedLocalNetworkSyncState(...)
  getNanahManagedLocalNetworkProvider()
  buildNanahManagedLocalNetworkDiscoveryRequest(...)
  getNanahManagedLocalNetworkEligibleLinks(...)
  pullNanahManagedLocalNetworkCandidates(...)
  runNanahManagedLocalNetworkSync(...)
```

The dashboard trusted-link card now shows a `Local network` status row for
managed replica links. Visible states are feedback only:

```text
Off
Ready
Checked
Checked, no candidates
Waiting for provider
Rejected by provider
N accepted, M rejected
```

## Eligibility Gates

A link is eligible only when all of these are true:

- `linkType` is `managed_link`.
- Local role is `replica`.
- Remote role is `source`.
- The link and key are not revoked or stale.
- `policy.syncOnProfileOpen === true`.
- `policy.lockedChildMode === "allow_trusted_updates"`.
- Target profile resolves to the active local profile.
- Source device id, source profile id, source public key id, target profile,
  and allowed scopes are present.

The request sent to the provider is redacted metadata: link id, source/target
ids, allowed scopes, key id/version, reason, and timestamp. It does not include
plaintext rules, PINs, viewing history, child action history, or decrypted
mailbox payloads.

## Safety Boundary

```text
runtime provider-gated local-network discovery hook: present
runtime local-network candidate receive bridge: present
runtime local-network candidate authority validator: present
runtime local-network provider failure fail-closed apply guard: present
runtime local-network status persistence: present
runtime built-in LAN peer discovery: absent
runtime built-in LAN delivery: absent
runtime background local-network scheduler: absent
runtime YouTube page hot-path work from this slice: absent
```

Returned candidates still call
`handleNanahIncomingManagedLocalNetworkCandidate(...)`, which sanitizes the
candidate, ignores caller-provided trust, rebuilds trust from local managed-link
state, verifies integrity when possible, validates the candidate, and only then
applies or records protected rejection history.

## Verification

Focused test:

```bash
node --test tests/runtime/managed-local-network-provider-current-behavior.test.mjs
```

Settings lane:

```bash
npm run test:settings
```
