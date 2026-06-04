# FilterTube Main Search Refinement Card Current Behavior - 2026-05-24

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch.

This slice reduces the real Main mobile search refinement album card from
`strange_ytInitialData.json` into a runnable proof before any search-card,
whitelist, no-work, or JSON-first filtering change. It proves that
`searchRefinementCardRenderer` can carry query text, playlist endpoint data,
and byline channel identity while remaining not first-class Main search JSON filter authority.

The search refinement card is now a no-work boundary for empty and disabled
search fetches: the seed `/youtubei/v1/search` fetch path bypasses clone, parse,
stringify, and engine work when no JSON rules are active. Active blocklist rules
and whitelist mode still parse and rebuild the response.

## Source Boundary

| Source | Current shape | Count / fingerprint |
| --- | --- | --- |
| `strange_ytInitialData.json` | `var ytInitialData = '...'` string literal with escaped JSON; not direct JSON. | 141 lines; 244,201 bytes; sha256 `01e6010a3f46041c3bcb3b6b399e871b5aa2fc28a0f234eca237226162b476b7`. |
| `js/filter_logic.js` | Existing runtime rule owner; not changed in this slice. | 3,652 lines; 172,174 bytes; sha256 `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5`. |

Raw token counts in `strange_ytInitialData.json`:

```text
searchRefinementCardRenderer: 21
universalWatchCardRenderer: 2
watchCardRichHeaderRenderer: 2
watchCardHeroVideoRenderer: 2
compactChannelRenderer: 2
```

The whole raw file fails direct `JSON.parse()`. The fixture is admitted as a
reduced fragment from the escaped page-global container, not as direct endpoint
JSON.

## Reduced Fixture

`tests/runtime/fixtures/captures/main-search-refinement-card-renderer.json` is an
85-line, 2,467-byte reduced fixture with sha256
`4ea0a59ef1d9e905b2c53b8f030d1116e07bafe76093edd6e167130facc291d9`.

It carries the mobile search refinement album card:

| Renderer | Raw JSON path | Entity / endpoint | Identity |
| --- | --- | --- | --- |
| `searchRefinementCardRenderer` | `contents.sectionListRenderer.contents[].itemSectionRenderer.contents[].horizontalCardListRenderer.cards[].searchRefinementCardRenderer` | query `Solaris Es`; album playlist `OLAK5uy_nTVbEFZIQVr5xnvka7ZwGGylVWlZjwPnk` | byline `Nyusha`; `UCm9VWKAFz0aXpuEHPHMae7w`; `/channel/UCm9VWKAFz0aXpuEHPHMae7w` |

## Current Runtime Result

`searchRefinementCardRenderer` has no direct `FILTER_RULES` entry today.

Pinned behavior:

- With no active rule, the reduced refinement card passes through unchanged.
- Blocklist keywords matching `Solaris` or `Nyusha` preserve the card.
- A blocklist channel matching `UCm9VWKAFz0aXpuEHPHMae7w` preserves the card.
- `horizontalCardListRenderer` preserves the refinement child when matching
  keyword and channel rules are active.
- Whitelist mode preserves the refinement card when the captured channel is
  allowed.
- Whitelist mode also preserves the refinement card when the allow list does
  not match.
- In a sibling payload, the same matching rule removes a supported
  `universalWatchCardRenderer` sibling while leaving the
  `searchRefinementCardRenderer` row visible.
- No channel-map side effect is queued by the reduced refinement fixture.

## Seed Search No-Work Boundary

The seed `/youtubei/v1/search` fetch path now treats empty and disabled settings
as no-work transport pass-through:

| Settings state | Current seed behavior |
| --- | --- |
| Empty blocklist on `/results` | Bypasses response clone/JSON parse/stringify, does not call `harvestOnly()`, and does not call `processData()`. |
| Active blocklist keyword | Parses response, rebuilds response, and calls `processData()` for `fetch:/youtubei/v1/search`. |
| Whitelist mode | Parses response, rebuilds response, and calls `processData()` for `fetch:/youtubei/v1/search`. |
| Disabled filtering | Bypasses response clone/JSON parse/stringify; no `harvestOnly()` or `processData()` call. |

## Risk Boundary

This is a false-hide/leak and optimization boundary, not an implementation
permission. The card exposes enough data to look tempting for JSON-first
filtering, but current runtime does not treat it as a hide/allow decision point.

That matters for whitelist work: a future patch can otherwise make the supported
search hero card obey whitelist mode while leaving adjacent refinement cards
visible. It also matters for no-work work: empty blocklist search is now a
transport bypass, while whitelist search is active engine work.

The same raw source also contains `universalWatchCardRenderer`,
`watchCardRichHeaderRenderer`, `watchCardHeroVideoRenderer`, and
`compactChannelRenderer` tokens. This fixture does not change those policies:
the universal watch-card wrapper has its own supported wrapper proof, direct
watch-card child renderers remain separate gaps, and compact channel cards
remain split-authority channel-map proof.

## Future Authority Fields

No product runtime symbol exists yet for:

- `mainSearchRefinementCardContract`
- `mainSearchRefinementCardFixtureAdmissionReport`
- `mainSearchRefinementCardDecisionReport`
- `mainSearchRefinementCardWhitelistPolicy`
- `mainSearchRefinementCardSiblingLeakReport`
- `mainSearchRefinementCardSeedNoWorkBudget`
- `mainSearchRefinementCardEscapedYtInitialDataAdmissionReport`
- `mainSearchRefinementCardJsonFirstOptimizationBudget`

This document and its test are audit evidence only. They do not permit renderer
expansion, search refinement behavior changes, endpoint admission changes,
watch-card changes, compact-channel changes, no-work optimization changes, or
whitelist optimization changes.

## Executable Proof

```bash
node --test tests/runtime/main-search-refinement-card-current-behavior.test.mjs
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this home/search/navigation surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5830
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5830
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, home-feed behavior, search behavior,
navigation-header behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
