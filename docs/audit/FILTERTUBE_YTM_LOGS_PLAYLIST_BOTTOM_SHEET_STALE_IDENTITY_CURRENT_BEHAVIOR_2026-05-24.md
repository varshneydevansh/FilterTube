# FilterTube YTM Logs Playlist Bottom Sheet Stale Identity - Current Behavior

Status: audit-only proof. Runtime behavior is unchanged.

This slice reduces one concrete YouTube Music evidence pair from
`YTM-LOGS.txt`: a playlist card whose visible owner is Kill Tony and an
observed bottom sheet whose injected FilterTube item points at
`UCWFKCr40YwOZQx8FHU_ZqqQ` / `@JerryRigEverything`. This is not clean runtime
output, not direct JSON, and not authority to change menu injection yet.

## Source Facts

| Artifact | Lines | Bytes | SHA-256 | Notes |
| --- | ---: | ---: | --- | --- |
| `YTM-LOGS.txt` | 8322 logical lines | 500222 | `6b7a29766c22cc167301fd63c2732e91bfebec2fc5fd19647960c432d0e7ac09` | Ignored local log/planning text. |
| `tests/runtime/fixtures/captures/ytm-logs-playlist-bottom-sheet-stale-identity.html` | 124 lines | 6093 | `e6c3cc399d41e4e255e59ff5dcfca064e1a52db82c207b7ed1712dcf239c92f4` | Reduced DOM evidence fixture. |
| `tests/runtime/ytm-logs-playlist-bottom-sheet-stale-identity-current-behavior.test.mjs` | audit test | audit test | audit test | Pins raw facts, reduced fixture, ledger links, and missing future authority. |

Selected raw token counts in `YTM-LOGS.txt`:

| Token | Count |
| --- | ---: |
| `KILL TONY` | 3 |
| `/@KillTony` | 6 |
| `PLD8Xk89jYzqSAjDsjIfndRA1uZKzwIxm-` | 11 |
| `UCWFKCr40YwOZQx8FHU_ZqqQ` | 2 |
| `@JerryRigEverything` | 2 |
| `filtertube-block-channel-item` | 12 |
| `data-filtertube-channel-id` | 18 |
| `bottom-sheet-container` | 54 |
| `yt-list-view-model` | 17 |
| `bottom-sheet-media-menu-item` | 11 |
| `Marzieh Daraei` | 1 |
| `NIN` | 1 |
| `schedulePostBlockEnrichment` | 5 |
| `MutationObserver` | 5 |
| `addEventListener` | 24 |
| `setTimeout` | 21 |
| `querySelector` | 184 |
| `ytInitialData` | 33 |

## Reduced Fixture

The fixture preserves these current evidence points:

- A `ytm-rich-item-renderer` playlist card processed by FilterTube in
  `blocklist` mode.
- Playlist id `PLD8Xk89jYzqSAjDsjIfndRA1uZKzwIxm-`.
- Visible title `KILL TONY`.
- Visible owner handle link `/@KillTony` with
  `data-filtertube-channel-handle="@killtony"`.
- A native YTM `More actions` button and FilterTube quick-block affordance on
  the card.
- An observed `bottom-sheet-container` with `data-filtertube-observing="true"`.
- A FilterTube injected menu item with
  `data-filtertube-channel-id="UCWFKCr40YwOZQx8FHU_ZqqQ"`,
  empty `data-filtertube-channel-handle`, and label
  `Block * @JerryRigEverything`.
- Native sibling actions `Not interested` and `Share`.

The important current-behavior fact is the mismatch:

```text
card visible owner: @KillTony
injected menu label: @JerryRigEverything
injected menu UC id: UCWFKCr40YwOZQx8FHU_ZqqQ
```

The fixture intentionally does not repair or reinterpret the mismatch. It
proves that YTM menu identity must be bound to the menu trigger/card instance
before a block action is trusted.

## Risk Boundary

This evidence is relevant to reliability, false-block risk, menu injection,
quick-block, list-mode behavior, and JSON-first optimization:

- A correct JSON owner can still be defeated by a stale DOM menu target.
- A bottom-sheet observer can carry injected state across card/menu contexts if
  trigger-card identity is not explicit.
- A label/handle mismatch can write or present the wrong channel identity to
  the user.
- The log mentions `schedulePostBlockEnrichment`, but post-action enrichment is
  not a permission source for the immediate bottom-sheet item.
- This raw log is not clean enough to become product behavior proof by itself;
  it needs a current-runtime owner report and negative sibling/menu fixture.

## Non-Completion Boundary

This slice does not make YTM playlist bottom-sheet blocking safe to optimize.
It closes one raw-log extraction gap and keeps implementation blocked until
there is proof for:

- `ytmLogsPlaylistBottomSheetIdentityContract`
- `ytmLogsPlaylistBottomSheetIdentityReport`
- `ytmLogsBottomSheetTriggerCardKeyReport`
- `ytmLogsPlaylistMenuStaleIdentityPolicy`
- `ytmLogsPlaylistOwnerHandleAuthority`
- `ytmLogsPlaylistJsonDomParityGate`
- `ytmLogsMenuInjectionRaceBudget`
- `ytmLogsBottomSheetTeardownReport`
- `ytmLogsStaleMenuNegativeSiblingFixture`
- `ytmLogsPlaylistBlockActionAuthority`

## Verification

```bash
node --test tests/runtime/ytm-logs-playlist-bottom-sheet-stale-identity-current-behavior.test.mjs
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this playlist/mix/player-panel surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, playlist or Mix filtering behavior,
player-panel behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
