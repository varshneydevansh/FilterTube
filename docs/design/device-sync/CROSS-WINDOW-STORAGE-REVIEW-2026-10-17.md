# Cross-window device storage review

## Confirmed problems and correction

Production-function tests reproduced a second form of trust resurrection after
the earlier sequential-cache correction: page B read current trust and paused
before its write; page A removed the grant durably; B then wrote its previously
prepared row back. Fresh reads alone cannot prevent this overlap.

The shared `js/nanah_storage_lock.js` coordinator now requests the exclusive
`filtertube-nanah-trusted-storage-v1` Web Lock. Dashboard trust commits hold it
from checked read through candidate authorization, persistence and key rotation.
Device identity provisioning, signing-key generation/persistence and descriptor
repair participate too. Cached device identity is checked against storage again.
Nested calls forward an opaque active token; fabricated, foreign or expired
tokens reject. There is no page-global bypass. Unsupported or rejected locking
does not fall back to an unsafe local queue.

The whole public IO import participates, including encrypted imports after
decryption. This is necessary because failed imports restore a complete storage
snapshot, which includes trust and signing state even for ordinary profile
imports. Snapshot, mutation, verification and rollback remain inside the lock.
The dashboard restore keeps its local queue and waits for pending identity
provisioning before IO acquires the shared lock, avoiding a nested wait cycle.
Both popup and dashboard load the coordinator before IO.

Required IO snapshot, recovery-preflight and rollback reads now propagate actual
storage errors, including callback/Promise settlement conflicts. Failed reads
cannot masquerade as an empty trust list or trigger blind rollback cleanup.

## Multiple profiles during recovery

Actual IO imports reproduced four cases where merge recovery retained only one
link for a remote physical device while returning a verified receipt. Distinct
children, distinct parents and even existing links untouched by the incoming
backup were affected.

Recovery now preserves distinct explicit link IDs and their parent/device/fixed
recipient bindings. Same-ID conflicting bindings reject before settings loaders
or writes in merge and replace modes. Equal logical IDs can update their own
row; different IDs are preserved without migration. Legacy rows without IDs use
their available role/profile binding; unknown legacy rows remain separate rather
than being guessed into one device-wide identity. Unapproved recovery data stays
ignored. No new grant, key migration or ID rewrite was introduced.

## Evidence

- Integrated focused suite: **657/657**, including new coordinator, actual IO
  recovery and two-page production-function regressions.
- Independent reviews: shared-lock subset **60/60** and recovery/coordinator
  subset **37/37**; no blocker found in those scoped changes.
- Existing BlockTube import/rollback behavior: **6/6**. Its separate static
  untranslated-title assertion still fails; the preceding package also lacks
  that old literal because the title is localized. The assertion was preserved.
- All three browser packages rebuilt. Source/archive parity: **132 assets / 396
  matching entries**, including the coordinator and popup script dependency.
- Installed Chrome for Testing started both existing endpoints with the native
  API, reconnected the unchanged Agreement link, and completed the separate
  review/send flow. A seventh synthetic child rule arrived in Agreement child;
  the receiving parent's Kids list remained empty. Both endpoints retained their
  existing trust. This is live one-computer acceptance, not two physical peers.
- A completed bounded GPT-OSS 120B checker identified nested reacquisition as the
  key deadlock case. Its imprecise claim about same-realm scope was not adopted;
  cross-window coordination comes from the browser lock, while ownership tokens
  are valid only within the callback's realm and lifetime. Earlier truncated
  Qwen/Gemini responses supply no review evidence.

The [Web Locks specification](https://w3c.github.io/web-locks/) and
[MDN API documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)
describe origin-scoped asynchronous exclusion and nested-lock deadlock risks.
Current manifest version floors exceed the published Chrome/Firefox introduction
versions. Runtime feature detection and rejection handling remain necessary.

## Limits still requiring acceptance

This coordinates participating extension contexts using the same browser lock
manager. It is not a general storage compare-and-swap, a cross-device lock or a
cryptographic proof. Native clients, older open code, distinct origins/partitions
and unrelated background/profile writers are outside this guarantee. In
particular, full import rollback is not a proof that unrelated concurrent profile
or background changes are preserved. Installed overlapping-window acceptance,
Firefox/private-context behavior and native transaction integration remain open.
Physical LAN/NAT, camera and mobile/TV gates remain in the main checklist.

No native runtime mirror, emulator, existing installed trust or release state was
reset, deleted, migrated or published in this correction.
