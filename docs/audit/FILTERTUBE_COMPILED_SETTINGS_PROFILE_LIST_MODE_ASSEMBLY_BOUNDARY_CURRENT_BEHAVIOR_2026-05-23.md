# FilterTube Compiled Settings Profile/List-Mode Assembly Boundary - Current Behavior

Date: 2026-05-23

Status: audit-only current-behavior boundary.

Runtime behavior is unchanged for background compilation, Kids/main profile selection, whitelist/list-mode behavior, bridge normalization, JSON filtering, DOM fallback, and filter logic. This is not an implementation patch for that boundary; the 2026-05-26 quick-block startup retry only changes observer availability after settings delivery.

## Boundary

This slice pins the current cross-file path that turns stored profiles and profile/list-mode fields into runtime filter settings:

- Background compiled settings chooses `main` or `kids`, assigns `listMode` and `profileType`, compiles whitelist keyword/channel rows, and can merge Kids allow-list entries into main when sync is active and both profiles are in whitelist mode.
- Isolated-world bridge code derives the requested profile from the host, retries background compilation on profile mismatch, and normalizes a main-profile empty whitelist on Kids hosts to blocklist mode.
- Filter logic consumes the resulting settings by rebuilding RegExp instances, normalizing channel identity fields, deciding whether channel identity extraction is needed, and applying the whitelist branch.

This is narrower than the compiled-settings field register and the list-mode matrix. It does not prove compiler parity; it records the profile/list-mode assembly and consumer boundary that future whitelist optimization and first-class JSON filtering must preserve or intentionally replace.

## Source Fingerprints

| Source file | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6,313 | 284,710 | `46442f904cf18c3fa8345e71f608171edcf277207a420136a78a195c3b7c57eb` |
| `js/content/bridge_settings.js` | 651 | 26,462 | `c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b` |
| `js/filter_logic.js` | 3,498 | 165,151 | `4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641` |

compiled settings profile/list-mode assembly source files pinned: 3

## Pinned Source/Effect Blocks

| Block | Source | Start line | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | ---: | --- |
| `backgroundProfileListModeWhitelist` | `js/background.js:1981` | 1,981 | 55 | 3,428 | `fd9e0cc5b9219b358e72f5ede15556df10bf8a9b80af1a98d4518575269fc258` |
| `backgroundWhitelistChannelCompiler` | `js/background.js:2149` | 2,149 | 65 | 3,878 | `433527aec588525d8f3747ce7ffe20b1d2d78905c6812a6fcf6703bbee507322` |
| `bridgeNormalizeSettingsForHost` | `js/content/bridge_settings.js:322` | 322 | 31 | 1,404 | `5f05ac1dba540e69103fe5725ad258d203f03e72762a1cc887d8c70e847988ac` |
| `bridgeRequestProfileGate` | `js/content/bridge_settings.js:379` | 379 | 36 | 1,758 | `713d4c00573258982f7dbf77cc451307b24a421ad8916fed859445df88fdadb8` |
| `filterProcessSettings` | `js/filter_logic.js:938` | 938 | 125 | 6,348 | `666c5725170dcd5eb01aa66cbfd27e64d33fa0ae937d1c5553665b4ede149e0f` |
| `filterListModeIdentityAdmission` | `js/filter_logic.js:1706` | 1,706 | 145 | 7,062 | `33b7bb414b7eb887a12cd14b6d1f0f69c8de7672a9854907ff83bf4384771032` |

compiled settings profile/list-mode assembly source/effect blocks pinned: 6

## Selected Token Counts

Counts below are over the pinned source/effect blocks, not whole files.

| Token | Count |
| --- | ---: |
| `compiledSettings.listMode` | 1 |
| `compiledSettings.profileType` | 1 |
| `rawWhitelistKeywords` | 2 |
| `compileKeywordEntries(rawWhitelistKeywords)` | 1 |
| `rawWhitelistChannels` | 2 |
| `compileWhitelistChannels(rawWhitelistChannels)` | 1 |
| `syncKidsToMain` | 4 |
| `mainModeFromV4` | 4 |
| `kidsModeFromV4` | 4 |
| `__ftFromKids` | 1 |
| `profileType` | 9 |
| `forceRefresh: true` | 1 |
| `normalizeSettingsForHost` | 3 |
| `listMode: 'blocklist'` | 2 |
| `settings.whitelistKeywords` | 5 |
| `settings.whitelistChannels` | 7 |
| `processed.whitelistKeywords` | 1 |
| `processed.whitelistChannels` | 1 |
| `new RegExp` | 2 |
| `toLowerCase()` | 16 |
| `_hasChannelPolicyRules` | 2 |
| `needsChannelIdentity` | 2 |
| `extractChannelIdentity` | 2 |

Selected missing policy/report tokens over pinned blocks:

| Token | Count |
| --- | ---: |
| `settingsRevision` | 0 |
| `compiledSettingsRevision` | 0 |
| `compiledSettingsProfileListModeContract` | 0 |
| `profileListModeDecisionReport` | 0 |
| `emptyWhitelistPolicy` | 0 |
| `kidsEmptyWhitelistFailOpenReport` | 0 |

## Current Behavior Pinned

`backgroundProfileListModeWhitelist`: background compilation reads the active profile settings, derives `syncKidsToMain`, converts main and Kids modes to exact `whitelist` or `blocklist`, assigns `compiledSettings.listMode`, assigns `compiledSettings.profileType`, compiles `whitelistKeywords`, and can merge Kids whitelist keywords and channels into main when sync is active and both profiles are in whitelist mode. Synced Kids whitelist channels are tagged with `__ftFromKids`.

`backgroundWhitelistChannelCompiler`: background compilation compiles the already-selected whitelist channel list into objects with id, handle, display handle, canonical handle, collaboration metadata, and source fields, dedupes channel rows, and assigns `compiledSettings.whitelistChannels`.

`bridgeNormalizeSettingsForHost`: bridge normalization returns the original settings outside Kids hosts, returns original Kids-profile settings on Kids hosts, and only changes main-profile Kids-host settings when `listMode` is whitelist and both `whitelistChannels` and `whitelistKeywords` are empty. That case returns a shallow copy with `listMode: 'blocklist'`.

`bridgeRequestProfileGate`: settings requests derive `profileType` from the host, send `getCompiledSettings`, retry with `forceRefresh: true` if the resolved profile mismatches the host-derived profile, normalize the response, send settings to the main world, and resolve normalized settings.

`filterProcessSettings`: filter logic starts with blocklist defaults, spreads incoming settings over those defaults, rebuilds serialized blocklist and whitelist keyword patterns into RegExp objects, normalizes blocklist and whitelist channel `id`, `handle`, and `name` fields to lowercase, and carries `videoMetaMap` only when it is an object.

`filterListModeIdentityAdmission`: filter logic treats only exact `listMode === 'whitelist'` as whitelist mode, asks for channel identity when blocklist channel rules exist or whitelist channel rules exist in whitelist mode, and passes `extractChannelIdentity: needsChannelIdentity` into candidate extraction.

## Runtime Fixtures

runtime compiled settings profile/list-mode fixtures: 6

- Kids host with a main-profile empty whitelist currently normalizes to `listMode: 'blocklist'`.
- Kids host with a Kids-profile empty whitelist currently keeps whitelist mode.
- Kids host with a main-profile non-empty whitelist currently keeps whitelist mode.
- Non-Kids host with a main-profile empty whitelist currently keeps whitelist mode.
- Filter logic currently rebuilds serialized whitelist keyword patterns and lowercases whitelist channel identity fields.
- Filter logic currently requires whitelist channel identity only in exact whitelist mode when whitelist channel rows exist.

## Risk Boundary

This assembly path is a high-risk input to whitelist optimization because the same stored profile state can be interpreted by multiple layers: background compilation, bridge host normalization, seed/injector delivery, and filter logic. In current behavior, a main-profile empty whitelist delivered to Kids hosts can become blocklist before reaching the main-world consumers, while filter logic itself still treats empty whitelist as fail-closed when it receives exact whitelist mode.

This means an implementation that promotes JSON filtering or whitelist decisions to first-class behavior cannot use only filter-logic list-mode fixtures. It also needs compiled profile/list-mode provenance, host normalization proof, and explicit profile/list-mode parity between background, bridge, seed, DOM fallback, and filter logic.

## Future Proof Still Missing

This file does not close the implementation gate. Compiled settings profile/list-mode assembly still needs:

- a profile/list-mode compiler contract;
- background/bridge/filter parity reports;
- settings revision and profile scope policies;
- explicit Kids empty-whitelist policy;
- sync-Kids-to-main merge reports;
- whitelist channel/keyword provenance fixtures;
- host normalization reports;
- JSON-first consumer parity fixtures;
- metric artifacts for no-work decisions.

No `compiledSettingsProfileListModeContract`, `compiledSettingsProfileListModeReport`, `compiledSettingsListModeProfileScopePolicy`, `compiledSettingsWhitelistAssemblyReport`, `compiledSettingsKidsEmptyWhitelistPolicy`, `compiledSettingsBridgeNormalizationReport`, `compiledSettingsFilterLogicConsumerParity`, `compiledSettingsProfileListModeFixtureProvenance`, `compiledSettingsProfileListModeMetricArtifact`, or `compiledSettingsProfileListModeRevisionPolicy` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this list/settings-mode surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, whitelist behavior, settings-mode behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
