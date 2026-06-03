# FilterTube Security Crypto Payload Boundary - 2026-05-22

Status: audit-only current-behavior boundary. This is not an implementation patch.
Runtime behavior is unchanged.

This slice pins the current cryptographic container boundary for
`FilterTubeSecurity` PIN verifiers and encrypted JSON backups. It covers the
PBKDF2/SHA-256 verifier shape, PBKDF2/AES-GCM encrypted JSON shape, deterministic
fixture behavior with injected salt/IV, malformed container failures, caller
assumptions in backup/import/UI flows, and the missing authority needed before
profile lock, encrypted backup, Nanah restore, import/export, or JSON-first
payload behavior changes.

Runtime proof:

```text
tests/runtime/security-crypto-payload-boundary-current-behavior.test.mjs
```

## Source Fingerprints

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/security_manager.js` | 198 | 6,374 | `1fb1ec9c8339cbdad57107c5b596d893a025af68870ae7928083977a8d29ebd3` |
| `js/background.js` | 6343 | 286370 | `ce17fee7a80398be91f89e286ef0dea8c85deff0b4363729d79a957c9989cd36` |
| `js/io_manager.js` | 2,030 | 96,914 | `d04bfd75d061ee405c1dfa4cab8c9d0fa6a2f072d046add33e4b6782b1f58a21` |
| `js/tab-view.js` | 11,617 | 526,763 | `1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7` |
| `js/popup.js` | 1,841 | 75,587 | `cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a` |

## Source / Effect Blocks

| Block | Source | Start line | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | ---: | --- |
| `createPinVerifier` | `js/security_manager.js:97` | 97 | 15 | 565 | `a3831ca695ef4ea8fdef257365a3fa8f766ff9c47998bb93dee4e7e032464db3` |
| `verifyPin` | `js/security_manager.js:112` | 112 | 13 | 620 | `eb642568bc033675ae2f945c7b02c1cc0c3dbbdf60db23caaf37d1c1821ca0c5` |
| `encryptJson` | `js/security_manager.js:125` | 125 | 31 | 1,051 | `752dcf24ac84a9bc896b94e83745f7206f0b6289882f7328ff8a38003f1f1549` |
| `decryptJson` | `js/security_manager.js:156` | 156 | 36 | 1,264 | `9a8659936cfea24b95bca95535311f083a098794863f5fbafd9477f575596c6a` |
| `backgroundEncryptedAutoBackup` | `js/background.js:819` | 819 | 19 | 678 | `330f5c26b86b36df286f183f28aaa565aa5d3fa924d1fb1e01e957965fefda81` |
| `ioExportV3Encrypted` | `js/io_manager.js:1729` | 1729 | 30 | 1,415 | `861997baefd50a8347f487b34383dc57628c73b3aadc3d122cdeea303480b7fc` |
| `ioImportV3Encrypted` | `js/io_manager.js:1759` | 1759 | 13 | 686 | `4d7589e51eb4c0bb622645a1dfbe912d61d5c9eb48cc5c16177de5fbd6bcc079` |
| `tabManualEncryptedDecrypt` | `js/tab-view.js:9299` | 9299 | 17 | 890 | `8fbbe7a9da2d4e609eedcf2edd58d4d926b3439d8f087dd3de4e462b9cac6a56` |
| `popupVerifyPinWrapper` | `js/popup.js:1226` | 1226 | 7 | 286 | `777e585119022de23e3c23f64689848b8327494e5ea11ae7c6273258f4794815` |
| `tabVerifyPinWrapper` | `js/tab-view.js:8349` | 8349 | 7 | 286 | `777e585119022de23e3c23f64689848b8327494e5ea11ae7c6273258f4794815` |

## Selected Token Counts

```text
security crypto payload source files pinned | 5
security crypto payload source/effect blocks pinned | 10
security default iterations = 150000 tokens | 2
security randomBytes(16) tokens | 2
security randomBytes(12) tokens | 1
security PBKDF2 tokens | 14
security SHA-256 tokens | 6
security AES-GCM tokens | 5
security Number.isFinite tokens | 2
security got === expected tokens | 1
security JSON.stringify tokens | 1
security JSON.parse tokens | 1
security additionalData tokens | 0
security version tokens | 0
selected Security.encryptJson tokens | 4
selected Security.decryptJson tokens | 4
selected Security.verifyPin tokens | 8
selected Security.createPinVerifier tokens | 4
selected meta.encrypted tokens | 1
```

## Runtime Fixtures Pinned

```text
security_crypto_payload_doc_records_audit_only_boundary
source_fingerprints_for_security_crypto_payload_files_remain_current
source_effect_block_metrics_for_security_crypto_payload_paths_remain_current
selected_security_crypto_payload_token_counts_remain_current
pin_verifier_container_shape_and_verify_behavior_are_executable
encrypted_json_container_shape_and_decrypt_behavior_are_executable
malformed_encrypted_payload_failures_remain_current
caller_blocks_expect_current_security_payload_shape
security_crypto_payload_authority_symbols_are_absent_from_selected_runtime_source
```

## Deterministic Runtime Fixture

Injected verifier salt:

```text
AQIDBAUGBwgJCgsMDQ4PEA==
```

Injected encrypted JSON IV:

```text
oKGio6Slpqeoqaqr
```

The deterministic runtime fixture uses PIN/password strings with surrounding
spaces to pin current trimming behavior. With `iterations: 5`, the PIN verifier
container is:

```json
{
  "kdf": "PBKDF2",
  "hashAlg": "SHA-256",
  "iterations": 5,
  "salt": "AQIDBAUGBwgJCgsMDQ4PEA==",
  "hash": "plx3DxZlRFNLCtO5en/mZdQ2GjETxGU91mJi3BbJlww="
}
```

The deterministic encrypted JSON container for `{ "answer": 42, "rows":
["main", "kids"] }` is:

```json
{
  "kdf": {
    "name": "PBKDF2",
    "hash": "SHA-256",
    "iterations": 5,
    "salt": "AQIDBAUGBwgJCgsMDQ4PEA=="
  },
  "cipher": {
    "name": "AES-GCM",
    "iv": "oKGio6Slpqeoqaqr"
  },
  "data": "UekGIWXP9DYKPpuDhFOnB1ka6r9nVerZ/5xJwibxs3TSocBluuKsIQqmhSUibpsOvLe6ug=="
}
```

## Current Findings

| Boundary | Current behavior | Current proof | Risk before security/import/export/JSON-first changes |
| --- | --- | --- | --- |
| PIN verifier container | `createPinVerifier()` emits `{ kdf, hashAlg, iterations, salt, hash }` using PBKDF2/SHA-256 with a default 150000 iteration count and 16-byte random salt unless injected. | Runtime fixture executes the function through a VM-loaded copy of `js/security_manager.js`. | The verifier has no version field, iteration floor/ceiling policy, timing policy, or caller mutation report. |
| PIN verification | `verifyPin()` accepts only `PBKDF2` and `SHA-256`, rejects missing/non-finite iteration data, derives 256 bits, and compares base64 strings with `got === expected`. | Runtime fixture proves correct PIN true, wrong PIN false, unsupported KDF false, and malformed iteration false. | String equality is a current timing boundary and cannot be changed without caller/UX/timing fixtures. |
| Encrypted JSON container | `encryptJson()` emits `{ kdf, cipher, data }` with PBKDF2/SHA-256 and AES-GCM, 16-byte salt, 12-byte IV, `JSON.stringify(obj)`, and no associated data. | Runtime fixture executes deterministic salt/IV encryption and decrypts it back to the object. | The encrypted container has no version, payload type, profile/scope binding, associated-data policy, or payload-size budget. |
| Malformed encrypted payloads | `decryptJson()` throws `Password required`, `Unsupported KDF`, `Unsupported cipher`, or `Invalid encrypted payload` before WebCrypto decrypt, while wrong passwords surface WebCrypto `OperationError`. | Runtime fixture captures each failure class. | Import/export and Nanah callers need one visible failure classification before UX or restore behavior changes. |
| Background encrypted auto-backup | The encrypted auto-backup block requires a session PIN, requires `Security.encryptJson`, wraps the payload as `{ meta: { encrypted: true }, encrypted }`, and changes the extension to `encrypted.json`. | Source/effect block `backgroundEncryptedAutoBackup`. | Auto-backup encryption policy depends on session state and current container shape, not a shared encrypted payload manifest. |
| IO encrypted helpers | `exportV3Encrypted()` returns encrypted payload containers; `importV3Encrypted()` decrypts then delegates to `importV3()` without forwarding `targetProfileId`. | Source/effect blocks `ioExportV3Encrypted` and `ioImportV3Encrypted`. | Plain and encrypted imports can diverge on target profile, and decrypted payloads do not carry a cryptographic profile binding. |
| Dashboard and popup PIN wrappers | Popup and dashboard wrappers delegate verification to `FilterTubeSecurity.verifyPin`; dashboard encrypted import decrypts via `FilterTubeSecurity.decryptJson`. | Source/effect blocks `popupVerifyPinWrapper`, `tabVerifyPinWrapper`, and `tabManualEncryptedDecrypt`. | UI surfaces assume the same global crypto payload API and need shared availability, error, and compatibility fixtures. |

## Required Future Authority Before Behavior Changes

No selected product runtime source currently defines:

```text
securityCryptoPayloadBoundaryContract
securityCryptoPayloadSchemaReport
securityPinVerifierTimingPolicy
securityPinVerifierIterationBounds
securityEncryptedJsonVersionPolicy
securityEncryptedJsonAadPolicy
securityEncryptedPayloadSizeBudget
securityEncryptedPayloadCompatibilityMatrix
securityEncryptedPayloadTamperFixture
securityEncryptedPayloadCallerContract
```

## Current Verdict

```text
Security crypto payload behavior is proof-pinned.
PIN verifier and encrypted JSON containers are executable current behavior, not a versioned shared authority.
Runtime behavior remains unchanged.
```

This does not close security/PIN, encrypted backup, import/export, Nanah,
profile/viewing-space, storage/cache, JSON-first, performance, reliability,
false-hide/leak, code-burden, cross-feature, or implementation-change rows. It
adds current-behavior evidence only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this security crypto payload boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
