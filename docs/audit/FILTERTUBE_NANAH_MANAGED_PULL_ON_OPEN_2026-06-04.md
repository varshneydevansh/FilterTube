# Audit: Nanah Managed Pull-On-Open Hook

**Generated**: 2026-06-04
**Status**: Provider-gated dashboard/profile-open hook and provider ack handoff
are present. Server mailbox client, mailbox decryption client, and
local-network discovery are still absent.
**Related plan**:
`docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md`
**Related inventory**:
`docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md`
**Related mailbox protocol**:
`docs/audit/FILTERTUBE_MANAGED_POLICY_ENCRYPTED_MAILBOX_PROTOCOL_2026-06-04.md`

## Purpose

This slice adds the first safe runtime steps toward parent/caregiver
pull-on-open sync. When the FilterTube dashboard opens or the active profile is
switched, a protected replica profile can check eligible trusted managed links,
ask an optional local provider for already-decrypted mailbox items, and hand
redacted delivery acknowledgements back to the same provider.

The hook is intentionally not a mailbox server client. It does not poll from
YouTube pages, does not add a service-worker scheduler, and does not make
network discovery authority. If no provider is installed, it records a local
status of `pull_provider_unavailable` and leaves the last valid policy active.
If the provider reports `ok: false` or throws, returned items are discarded,
no mailbox item is applied, no ack is sent, and the last valid policy remains
active.

## Runtime Shape

```mermaid
flowchart TD
  A["Dashboard/profile opens"] --> B["Load trusted Nanah links"]
  B --> C["Collect replica -> source managed links"]
  C --> D{"syncOnProfileOpen enabled?"}
  D -->|No| E["No work"]
  D -->|Yes| F{"Trusted local provider exists?"}
  F -->|No| G["Persist provider-unavailable status"]
  F -->|Yes| H["Request decrypted mailbox items"]
  H --> I["Validate mailbox binding and managed signature"]
  I --> J{"Accepted?"}
  J -->|Yes| K["Apply policy and write protected history"]
  J -->|No| L["Reject and keep last valid policy"]
  K --> M["Send redacted provider ack"]
  L --> M
```

## Runtime Hooks Added

```text
js/nanah_managed_open_sync.js
  FilterTubeNanahManagedOpenSync.create(...)
  collectManagedOpenSyncLinks(...)
  runOpenSync(...)

js/tab-view.js
  NANAH_MANAGED_OPEN_SYNC_STATE_KEY = ftNanahManagedOpenSyncState
  loadNanahManagedOpenSyncState()
  persistNanahManagedOpenSyncState(...)
  formatNanahManagedOpenSyncStatus(...)
  runNanahManagedOpenSync(...)
```

The optional provider shape is:

```js
window.FilterTubeManagedPolicyOpenSync = {
  async pullDecryptedMailboxItems(request) {
    return { ok: true, items: [/* filtertube_managed_mailbox_item */] };
  },
  async ackDecryptedMailboxItems(ack) {
    return { ok: true, ackedItemCount: ack.records.length };
  }
};
```

The request and ack objects are redacted and contain only
link/profile/scope/revision/hash/result metadata. They do not contain plaintext
filters, PINs, channel names, video titles, viewing history, or action-history
summaries. Providers may also expose `ackMailboxItems(...)` for the same ack
payload shape.

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

This keeps pull-on-open aligned with the existing parent-approved trusted link
policy and avoids silently applying updates to a sibling profile.

## UI Feedback

The managed link modal now includes:

```text
Check for parent updates when this profile opens
```

The trusted-link card now shows an `Open sync` row with one of the visible
states:

```text
Off
Ready
Checked
Checked, no updates
Waiting for provider
Apply unavailable
Rejected by provider
N applied, M rejected
N applied, M rejected, A ack failed
```

This is feedback/status only. It does not grant authority.

## Remaining Boundaries

```text
runtime pull-on-open candidate gate: present
runtime provider-gated decrypted item pull: present
runtime provider-gated mailbox ack handoff: present
runtime provider failure fail-closed item apply guard: present
runtime mailbox item apply reuse: present
runtime pull status persistence: present
runtime server mailbox pull client: absent
runtime mailbox decryption client: absent
runtime local-network discovery: absent
runtime background scheduler: absent
runtime YouTube page hot-path work from this slice: absent
```

## Release Safety Notes

- No YouTube content script, JSON interceptor, DOM fallback, menu observer,
  timer, or SPA listener is touched by this slice.
- No provider means no remote pull. The hook fails closed with a persisted
  status row.
- Provider failures and thrown provider errors do not apply or ack returned
  items. They surface as a provider rejection status and keep the last valid
  policy active.
- Returned items still go through `handleNanahIncomingManagedMailboxItem(...)`,
  `validateManagedMailboxItem(...)`, managed signature verification, accepted
  revision/hash checks, and protected action-history recording.
- Ack records are result metadata only. They never include decrypted payload
  contents and are sent only when the same local provider offers an ack method.
- This does not replace manual live Nanah sessions. It only creates the
  extension-side hook that downstream app/local-network/mailbox providers can
  use safely later.
