# FilterTube Public Release Surface Audit - 2026-05-18

This artifact records public-facing claims and release mechanics that can drift
from runtime behavior. It is audit evidence only.

## Current Release Surface Baseline

| Surface | Current behavior | Risk |
| --- | --- | --- |
| Package and manifests | `package.json`, root manifest, Chrome manifest, Firefox manifest, and Opera manifest are all `3.3.2`. | Low version drift for the packaged extension today. |
| Release notes data | `data/release_notes.json` has a `3.3.2` top release entry aligned with the packaged extension version. | Dashboard/banner copy is version-aligned; future release-note edits still need package/version proof. |
| README privacy copy | README now scopes privacy language to local-first extension storage, no FilterTube account service, no extension analytics, and bounded YouTube resolver requests for weak identity targets. | This is safer than the old broad "No data leaves your browser" / "No External Requests" wording, but it still needs release/store privacy parity proof before public claim expansion. |
| Website privacy page | The privacy page scopes Vercel Web Analytics to `filtertube.in` and says it is not in the extension or native apps. | This is the more precise wording and should become the public wording source. |
| Downloads page | The Android card links "Direct APK releases" to GitHub latest release while the same page says direct APK distribution should happen when a signed APK and checksum are attached. | Users can be sent to a release page before an APK/checksum is actually attached. |
| Build script | `build.js` updates README badges, packages browser zips, can stage Android artifacts with `.sha256`, and prompts for GitHub release publishing in interactive terminals. | CI/release reproducibility is weak unless README mutation and release publishing are split or run in dry-run mode. |
| Homepage hero media | The homepage delegates media to `HeroVideo`, which uses `preload="metadata"`, IntersectionObserver playback, visibility pause, and reduced-motion pause. | The old eager preload risk is reduced, but large route media still needs device/render budget proof. |

## Required Follow-Up Proof Before Publishing Claims

```text
public claim -> code/runtime proof -> release artifact proof -> link enabled
```

Minimum gates:

1. Browser version gates: package and every manifest match the intended release
   tag.
2. Release notes gate: the displayed release-note entry either matches the
   package version or is explicitly marked as staged/upcoming in UI.
3. Privacy gate: README, website privacy page, and store privacy disclosures use
   the same scoped language:
   - extension/app filtering is local-first,
   - website-only Vercel Analytics exists,
   - optional Nanah signaling exists only to help devices meet.
4. Direct APK gate: a GitHub release must contain the signed APK, SHA-256 file,
   and signing fingerprint before a direct APK CTA is treated as available.
5. Release script gate: release publishing must be reproducible in a
   non-interactive dry-run/CI path before relying on it as the public release
   authority.

## Executable Proof

Current behavior is pinned in
`tests/runtime/public-release-surface-current-behavior.test.mjs`.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this release/package/public-claim surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 73
method semantic proof gap lexical callables covered: 6259
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6259
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

Historical compatibility snapshot retained for older current-behavior lanes:

```text
historical pre-managed-policy callable snapshot: 2026-05-25 through 2026-05-30
method semantic proof gap lexical callables covered: 5836
repo-wide lexical callables: 5836
lexical callables requiring semantic proof before behavior changes: 5836
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, release package behavior, public release
claims, prompt release overlays, raw-capture packaging, whitelist behavior,
metric collectors, artifact creation, native sync, or release publication.
