# FilterTube Release Notes JSON Version Gate Boundary - Current Behavior - 2026-05-22

Status: audit-only proof. This is not an implementation patch.
Runtime behavior is unchanged.

## Scope

This slice audits the release-note JSON path and the current package/runtime
version gates around it:

- `data/release_notes.json`
- `package.json`
- `manifest.json`
- `manifest.chrome.json`
- `manifest.firefox.json`
- `manifest.opera.json`
- `js/background.js`
- `js/tab-view.js`
- `js/content/release_notes_prompt.js`

The goal is to pin the current JSON/data boundary before any release, package,
public-claim, or first-class JSON filtering behavior changes. This is not a
filter-engine JSON path, but it is a shared product JSON file that exercises the
same class of schema, version, runtime-consumer, and artifact-parity questions
needed before JSON can become a first-class filter contract.

## Pinned Facts

| Surface | Current evidence |
| --- | --- |
| Release notes JSON | `data/release_notes.json` has 318 split lines, 23,020 bytes, sha256 `a8d59b18e9bffd1c828538ee58b3b8e9be7c641fea3ff064220311485a3b1c6b`, 24 array rows, 1 comment row, and 23 version rows. |
| JSON schema shape | Current top-level keys are `_comment`, `bannerSummary`, `detailsUrl`, `headline`, `highlights`, `summary`, and `version`. All 23 version rows have `headline`, `summary`, and `highlights` arrays. 18 version rows have `bannerSummary`. |
| Highlight data | The 23 version rows contain 110 total highlight strings. Per row, the current minimum is 3 and the maximum is 9. |
| Packaged version | `package.json`, `manifest.json`, `manifest.chrome.json`, `manifest.firefox.json`, and `manifest.opera.json` are all `3.3.2`. |
| Current newest row | The newest version row is `3.3.2`, matching the packaged extension/browser version, and all 23 version rows have `detailsUrl`. |
| Current packaged row | Version `3.3.2` exists in the JSON and has a GitHub release-tag `detailsUrl`. |
| Details URL mix | 20 version rows use GitHub release-tag URLs and 3 use GitHub commit URLs. |
| Manifest prompt load | All 4 browser manifests load `js/content/release_notes_prompt.js`; indexes are 12 for default/Chrome/Opera and 11 for Firefox. |

## Runtime Consumers

| Runtime owner | Current source proof |
| --- | --- |
| Background JSON loader | `js/background.js:1719` defines `loadReleaseNotesData()`; the selected block has 13 lines and 521 bytes. It fetches `browserAPI.runtime.getURL('data/release_notes.json')`, caches parsed JSON in `releaseNotesCache`, and falls back to `[]` on failure. |
| Background payload builder | `js/background.js:1737` defines `buildReleaseNotesPayload(version)`; the selected block has 20 lines and 862 bytes. It finds the entry whose `note.version === version` and maps `headline`, `bannerSummary || summary || body`, `link`, and `ctaLabel`. |
| Install/update state | The install storage block initializes `releaseNotesSeenVersion: CURRENT_VERSION` and `releaseNotesPayload: null`. The update release-note block has 14 lines and 693 bytes; it calls `buildReleaseNotesPayload(CURRENT_VERSION)` and stores `releaseNotesPayload: payload` plus `firstRunRefreshNeeded: true`. |
| Background prompt messages | The selected release-note message branch at `js/background.js:3169` has 64 lines and 3,063 bytes. `FilterTube_ReleaseNotesCheck` returns a cached payload when its version differs from `releaseNotesSeenVersion`, otherwise suppresses when seen equals `CURRENT_VERSION`, otherwise builds/stores the current-version payload. `FilterTube_ReleaseNotesAck` writes caller-provided `version || CURRENT_VERSION`. `FilterTube_OpenWhatsNew` opens `request?.url || WHATS_NEW_PAGE_URL`. |
| Dashboard What New render | `js/tab-view.js:2652` defines `loadReleaseNotesIntoDashboard()`; the selected block has 104 lines and 4,045 bytes. It fetches `data/release_notes.json`, filters only for a non-empty `version`, marks cards whose version equals `manifestVersion`, renders up to 4 highlights, and emits `detailsUrl` anchors when present. |
| Content prompt | `js/content/release_notes_prompt.js` has 250 lines and 9,865 bytes. It sends `FilterTube_ReleaseNotesCheck`, creates `#ft-release-notes-banner`, uses one `setTimeout` for removal, registers one `DOMContentLoaded` listener when needed, sends `FilterTube_ReleaseNotesAck`, and delegates the CTA to `FilterTube_OpenWhatsNew`. |

Selected token counts:

- `data/release_notes.json`: 23 `detailsUrl` tokens.
- `js/background.js`: 2 `data/release_notes.json` tokens, 5 `releaseNotesSeenVersion` tokens, 8 `releaseNotesPayload` tokens, and one token each for `FilterTube_ReleaseNotesCheck`, `FilterTube_ReleaseNotesAck`, and `FilterTube_OpenWhatsNew`.
- `js/tab-view.js`: 3 `data/release_notes.json` tokens, 2 `detailsUrl` tokens, and 1 selected `fetch(` token.
- `js/content/release_notes_prompt.js`: one token each for `FilterTube_ReleaseNotesCheck`, `FilterTube_ReleaseNotesAck`, `FilterTube_OpenWhatsNew`, `addEventListener`, and `setTimeout`.

## Current Risks

1. Release-note JSON can carry a current top row with a release-tag
   `detailsUrl` before artifact publication has been independently verified.
   The dashboard renders every valid version row, so version parity and release
   URL presence are not enough by themselves to prove artifact availability.
2. The JSON schema is conventional rather than authority-backed. No runtime
   schema report enforces required fields, `detailsUrl` policy, sorted order,
   changelog URL class, or packaged-version parity before release artifacts are
   built.
3. The background acknowledgement path writes `request.version || CURRENT_VERSION`
   without a sender-class/version membership contract. The current prompt sends
   its cached payload version, but the background branch itself is not a release
   version gate.
4. The What New open path accepts `request?.url || WHATS_NEW_PAGE_URL`. The
   prompt prefers the extension URL, but the background branch itself is not a
   URL policy.
5. This slice confirms a JSON/public-claim pattern, not filter behavior. It does
   not approve any first-class JSON filter expansion; filter JSON still needs
   renderer ownership, path syntax, field-effect, route/surface, settings-mode,
   no-work, DOM parity, native parity, and fixture gates.

## Missing Future Authority Symbols

The following symbols do not exist in selected product source yet:

- `releaseNotesJsonVersionGateContract`
- `releaseNotesJsonSchemaReport`
- `releaseNotesPackageVersionParityReport`
- `releaseNotesManifestVersionParityReport`
- `releaseNotesCurrentVersionEntryReport`
- `releaseNotesStagedEntryPolicy`
- `releaseNotesDetailsUrlPolicy`
- `releaseNotesRuntimeConsumerReport`
- `releaseNotesPromptSenderGate`
- `releaseNotesWhatsNewUrlPolicy`
- `releaseNotesDashboardRenderFixture`
- `releaseNotesNativeParityReport`
- `releaseNotesPublicClaimGate`
- `releaseNotesFirstClassJsonClaimGate`

## Completion Boundary

This closes only the current-behavior proof slice for the release-note JSON
version gate. It does not close release/package, public-claim, native parity,
dashboard render, prompt sender, external-navigation, artifact parity, or
first-class JSON filter promotion rows. Implementation changes remain blocked.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this release/package/public-claim surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 73
method semantic proof gap lexical callables covered: 6161
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6161
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
