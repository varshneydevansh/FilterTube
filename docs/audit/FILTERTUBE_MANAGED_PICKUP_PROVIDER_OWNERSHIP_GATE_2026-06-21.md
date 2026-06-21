# Gate: Managed Pickup Provider Ownership

**Generated**: 2026-06-21
**Status**: Provider ownership and release-claim gate added. Runtime behavior
changed: no.
**Goal slice**: Internet Pickup/Home Pickup later-delivery ownership,
deployment, retention, purge/revocation, redacted ack history, and public
wording.

## Purpose

Parents should not need to understand mailbox or LAN internals. The product
model stays simple:

```text
open both devices -> pair -> verify -> Send Update
```

If a protected device is not open, a pickup service can help it fetch a waiting
update later. That service is only delivery. It never decides policy. The
protected device still validates trusted link, target profile, source device,
scope, revision, policy hash, device binding, and signature before applying any
change.

## Decision States

| Decision | Allowed claim | Blocked claim |
| --- | --- | --- |
| `reference_provider_only` | Developers can self-host the reference provider to test endpoint shape. | FilterTube-hosted later delivery, guaranteed later delivery. |
| `user_supplied_provider_only` | Families/schools can configure a compatible provider they operate. | FilterTube operates or guarantees the service. |
| `filtertube_hosted_provider` | FilterTube can claim hosted Internet Pickup only after endpoint, deployment, CORS, health, retention, purge, ack, and installed round-trip smoke pass. | Provider reachability as policy authority; automatic LAN discovery as authority. |

## Required Artifact

```text
docs/audit/artifacts/managed-pickup-provider-ownership/template.json
docs/audit/artifacts/managed-pickup-provider-ownership/verify-provider-ownership-artifact.mjs
```

The artifact must pass before release wording can move beyond optional
configured pickup hooks. It records:

- owner, operator, support contact, retention, purge/revocation, abuse/rate
  limit policy, and privacy boundary;
- Internet Pickup and Home Pickup status;
- hosted endpoint and deployment proof only when FilterTube actually owns a
  deployed provider;
- redacted receipt proof;
- release wording boundary.

The reference provider endpoint behavior is lane-owned by
`tests/runtime/managed-delivery-provider-reference-current-behavior.test.mjs`.
That test proves bearer-token handling, CORS preflight, ciphertext-only Internet
Pickup storage/pull/purge, redacted mailbox receipts, Home Pickup signed
candidate storage/discovery, and redacted Home Pickup receipts. It is proof of
endpoint shape only, not proof of a hosted FilterTube service.

## Required Rows

```text
FT-PICKUP-PROVIDER-00-owner-decision
FT-PICKUP-PROVIDER-01-endpoint-deployment
FT-PICKUP-PROVIDER-02-retention-purge-revocation
FT-PICKUP-PROVIDER-03-redacted-ack-history
FT-PICKUP-PROVIDER-04-authority-boundary
FT-PICKUP-PROVIDER-05-release-wording
```

## Authority Boundary

Provider facts are not policy facts:

```text
pickup item exists
  -> protected device pulls or receives candidate
  -> local managed policy validation
  -> apply only if trusted link + target + scope + revision + hash + signature pass
```

Blocked:

- provider URL selects a protected profile;
- mailbox row grants authority;
- LAN reachability grants authority;
- discovery result creates trust;
- provider ack rewrites policy;
- release copy says guaranteed later delivery without a deployed and smoked
  FilterTube-hosted provider.

## Release Wording

Allowed today:

- Verified devices can receive signed live updates when both devices are open.
- Internet Pickup and Home Pickup are optional configured pickup paths.
- Self-hosted/reference provider proof exists for endpoint shape.
- Protected devices keep the last accepted policy if no newer valid update is
  available.

Blocked until a passing provider ownership artifact exists:

- FilterTube-hosted Internet Pickup service.
- Guaranteed later parent-to-child delivery.
- Automatic same-network device discovery.
- Network presence or provider reachability as authority.

## Verification

```bash
node --test tests/runtime/managed-pickup-provider-ownership-gate-current-behavior.test.mjs
node --test tests/runtime/managed-delivery-provider-reference-current-behavior.test.mjs
```
