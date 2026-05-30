# FilterTube Public Release Claim Boundary Current Behavior - 2026-05-19

This is current-behavior proof only. It does not change the website, build
script, extension runtime, native app builds, or release behavior. The
implementation gate remains closed.

## Purpose

Public download claims must not move faster than artifact proof. The website can
describe future Android, iOS, and TV paths, but every public install CTA should
have matching proof for the exact artifact, store URL, checksum, signing
identity, version, and platform boundary before it is treated as available.

## Current Behavior

| Surface | Current behavior | Boundary risk |
| --- | --- | --- |
| Browser extension | The downloads page marks the browser extension as `Available now` and links to real Chrome Web Store, Firefox Add-ons, and GitHub release pages. | Low. The public install links point to established browser distribution surfaces. |
| Android phone/tablet | The downloads page marks Android as `Final release testing`, but the `Direct APK releases` action already points to GitHub latest release. The page text correctly says the direct APK should be signed, checksummed, and fingerprinted when attached. | Medium. Users can be sent to the latest GitHub release before a release APK, `.sha256`, and signing fingerprint are proven present for that release. |
| iPhone and iPad | The downloads page keeps iOS/iPadOS status-only: it references TestFlight and App Store review, links to an internal status anchor, and says public IPA downloads are not the normal install path. | Low. There is no public random IPA CTA today. |
| Android TV / Fire TV | The downloads page and Android distribution doc keep TV as a separate future app/package, not part of the phone/tablet APK. | Low if this boundary remains enforced in release artifacts. |
| Build script | `build.js` can stage matching Android mobile artifacts and generate `.sha256` files, but it has no public claim manifest, claim IDs, signing fingerprint gate, or APK/AAB pair gate. | Medium. Artifact staging exists, but public claim authority does not. |
| Release notes/version state | `package.json` and browser manifests are `3.3.1`; `data/release_notes.json` has staged `3.3.2` notes at the top. | Medium. Dashboard/banner copy can describe a staged release before packaged browser version is bumped. |

## Missing Authority

There is no committed product authority named `publicReleaseClaimAuthority`
today. The future release gate should make public download claims data-backed
instead of copy-backed:

```text
publicReleaseClaimAuthority {
  claimId,
  surface,
  label,
  href,
  platform,
  status,
  requiredArtifact,
  requiredChecksum,
  requiredSigningFingerprint,
  requiredStoreUrl,
  requiredVersion,
  lastVerifiedAt,
  proofStatus
}
```

## Direct APK Gate

Before the Android direct APK CTA is treated as available, the release should
prove:

1. The APK is a signed release APK, not the Play Console developer-verification
   APK and not a debug QA build.
2. The APK package name is `com.filtertube.app`.
3. The GitHub release contains the APK and matching `.sha256`.
4. The release page or website publishes the SHA-256 checksum and signing certificate fingerprint.
5. The APK has been installed from the exact public release asset on a clean
   Android device or emulator.
6. Android TV / Fire TV behavior is not exposed in the phone/tablet artifact.

## iOS Gate

The current iOS/iPadOS copy is safer than direct IPA distribution because it
keeps the path to TestFlight and App Store review. If an iOS public link is
added later, it should be a TestFlight or App Store URL, not an arbitrary IPA
asset.

## TV Gate

The website and docs correctly describe Android TV / Fire TV as a future
separate app/package. The current phone/tablet APK must not be used as the TV
release path.

## Executable Proof

Current behavior is pinned in:

```bash
node --test tests/runtime/public-release-claim-boundary-current-behavior.test.mjs
```

## First Optimization Metric Collector Parity Rollout Boundary Addendum

First optimization metric collector parity rollout boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-parity-rollout-boundary-current-behavior.test.mjs`
maps this public release claim boundary into first-collector parity and rollout
requirements. The addendum pins 12 collector parity rollout rows, 12 collector
fixture provenance rows covered, 12 route/surface obligations covered, 2
evidence parity rollout rows covered, 8 parity and release boundary source docs
covered, 0 runtime collector parity rollout proofs approved, and 0
implementation-ready parity rollout rows. A local metric, JSON-first fixture, or
runtime source change still cannot become an availability, performance,
platform, Android APK, iOS, TV, or public download claim without artifact proof.

## First Optimization Parity Rollout Contract Addendum

First optimization parity rollout contract addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-parity-rollout-contract-current-behavior.test.mjs`
maps public release claim boundaries into the future `parity-rollout.json`
contract without creating rollout artifacts, release assets, website content, or
public claims. The addendum pins 12 parity rollout contract rows, 1 reserved
parity rollout path covered, 0 committed parity rollout files, 0 runtime metric
collector approvals, and 0 implementation-ready parity rollout contract rows.
Local JSON-first or whitelist optimization evidence still cannot become an
availability, platform, performance, APK, iOS, TV, or public download claim.

## First Optimization Rollback Unclaimed Surface Boundary Addendum

First optimization rollback unclaimed surface boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ROLLBACK_UNCLAIMED_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-rollback-unclaimed-surface-boundary-current-behavior.test.mjs`
isolates rollback, unclaimed-surface, native sync, release package,
raw-capture, diagnostic performance, and public-claim limits before any
metric-foundation artifact is committed or runtime behavior changes. The
addendum pins 12 rollback/unclaimed boundary rows, 8 release/native/public
source docs covered, 0 committed rollback/unclaimed artifacts, 0 runtime
rollback approvals, 0 runtime unclaimed-surface approvals, 0 runtime metric
collector approvals, 0 implementation-ready rollback/unclaimed rows, expected
runtime audit tests 4457, expected runtime audit pass: 4457, and expected
runtime audit fail 0. It keeps JSON-first, whitelist, collector, native,
release, and public claim work blocked until measured surfaces, unclaimed
surfaces, rollback command, artifact absence, authority absence, raw-capture
exclusion, and release/public claim limits are proved.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this release/package/public-claim surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, release package behavior, public release
claims, prompt release overlays, raw-capture packaging, whitelist behavior,
metric collectors, artifact creation, native sync, or release publication.
