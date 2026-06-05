# Audit: Locked Child Managed Update Revision Gate

**Generated**: 2026-06-05  
**Status**: Runtime locked-child trusted-update bypass now requires signed,
revision-bound managed-policy details before it can skip a local child-profile
unlock.  
**Goal slice**: Managed parent/caregiver control authority hardening.  
**Lane proof**: `test:settings` focused Nanah managed-authority proof.  
**Owner repo**: `/Users/devanshvarshney/FilterTube`

## Purpose

This proof closes a narrow authority gap in the Nanah incoming apply path. A
managed replica can be configured with `allow_trusted_updates` so a trusted
parent/source device can update a locked child profile. That option must not
mean that every legacy sync payload from a trusted device can bypass a local
unlock. The bypass now requires a signed, revision-bound
`filtertube_managed_policy` details object.

## Runtime Boundary

The guarded path is `ensureNanahIncomingAuth(...)` in
`/Users/devanshvarshney/FilterTube/js/tab-view.js`.

```text
runtime locked child legacy proposal bypass: blocked
runtime signed managed-policy locked child apply path: validator/apply path only
runtime revision-bound bypass predicate: hasRevisionBoundManagedPolicyDetails(...)
runtime local child unlock required for legacy proposal/app_sync: present
runtime YouTube hot-path work from this slice: absent
```

The new predicate checks:

```text
details.type == managed_policy
managedEnvelope.type == filtertube_managed_policy
managedEnvelope.revision is a positive integer
managedEnvelope.policyHash is present
managedEnvelope.integrity.signature is present
managedEnvelope.integrity.signedFields.revision matches revision
managedEnvelope.integrity.signedFields.policyHash matches policyHash
```

## Behavior

- Legacy `control_proposal` and `app_sync` managed receives must still unlock
  locally when the target is a locked child profile.
- Saved managed links still need `managed_link`, local `replica`, remote
  `source`, non-peer authority, and `allow_trusted_updates`.
- Signed, revision-bound `filtertube_managed_policy` metadata can satisfy the
  locked-child trusted-update predicate, but the actual envelope still travels
  through the managed validator/apply path.
- Missing signature, missing policy hash, revision mismatch, hash mismatch,
  peer mode, or wrong link role fail closed.

## Non-Goals

- No YouTube observer, timer, network interception, JSON filtering, DOM
  fallback, menu, or quick-block runtime changed.
- This does not add mailbox runtime delivery, local-network peer discovery, or
  a server queue.
- This does not turn legacy Nanah proposals into managed-policy authority.

## Verification

```bash
node --check js/tab-view.js
node --test tests/runtime/managed-locked-child-revision-gate-current-behavior.test.mjs
```

## Release Meaning

This change narrows remote child-profile authority without changing visible
dashboard UI. It should remain a separate logical commit because it protects
future pull-on-open, local-network, and mailbox work from treating trusted
transport reachability as policy authority.
