# FilterTube Feature Risk Matrix - 2026-05-17

This is an audit index, not a fix plan. It maps product features to the code authority, DOM/JSON dependencies, lifecycle work, and proof gates that must exist before changing behavior.

Related audit artifacts:

- `docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md`
- `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md`
- `docs/audit/FILTERTUBE_FUNCTION_COVERAGE_2026-05-17.md`
- `docs/audit/FILTERTUBE_SELECTOR_LIFECYCLE_INVENTORY_2026-05-17.md`
- `docs/json_paths_encyclopedia.md`
- `docs/youtube_renderer_inventory.md`

## Feature Matrix

| Feature / surface | Main files | Current disease risk | Proof required before fixes |
| --- | --- | --- | --- |
| Seed JSON interception | `js/seed.js`, `js/filter_logic.js` | Fetch/XHR hooks cover `/search`, `/guide`, `/browse`, `/next`, and `/player`. Current skip decisions happen after response clone/JSON parse on fetch, so "skip filtering" is not always "skip work". | Endpoint decision fixture for each YouTube endpoint proving when pass-through avoids parse/rewrite, when harvest-only runs, and when mutation is allowed. |
| JSON filtering engine | `js/filter_logic.js` | Renderer coverage is uneven. Some renderers are over-classified as JSON-first, some are nested-only, and some known renderer families are documented but missing. | Renderer fixture matrix keyed by renderer, route, title, channel identity, keywords, blocklist, whitelist, and expected mutation. |
| DOM fallback enforcement | `js/content/dom_fallback.js`, `js/content/dom_extractors.js`, `js/content/dom_helpers.js`, `js/content_bridge.js` | Fallback can protect gaps, but broad selector scans and hide writes can cause false hides or lag if installed outside active-work gates. | Route-scoped selector fixtures plus no-rule fixture proving zero fallback mutation when no enforcement is active. |
| Whitelist pending hides | `js/content_bridge.js` | Pending hide path intentionally hides unresolved whitelist candidates while identity resolves. This is high-risk because it can hide content before proof, especially if route or identity gating is wrong. | Pending-hide fixture with stable channel, missing channel, Shorts, playlist panel selected row, watch rail, search, and home feed cases. |
| Quick cross / quick block buttons | `js/content/block_channel.js`, `js/content/menu.js`, `js/content_bridge.js` | Selectors cover many desktop/mobile/Kids cards. Observers/listeners/timers can stay active even when the visible affordance is disabled or whitelist mode suppresses quick block. | Visible-affordance gate, teardown counters, mobile/tablet/desktop fixtures, and no-rule/no-affordance zero-work fixture. |
| YouTube 3-dot menu insertion | `js/content/block_channel.js`, `js/content/menu.js`, `js/content_bridge.js` | Native and fallback menu paths are split. Executable source fixtures now prove the primary injected dropdown has whitelist/disabled gates, while fallback playlist buttons and rows can open/bind block actions without those gates. | One action gate for all menu entry points; fixtures for desktop, mobile, playlist, posts, Shorts, Kids passive listener, and disabled/whitelist modes. |
| Channel identity resolution | `js/filter_logic.js`, `js/content/dom_extractors.js`, `js/content/handle_resolver.js`, `js/background.js`, `js/content_bridge.js` | Identity can come from UC ID, handle, custom URL, display name, learned maps, collaborator dialogs, DOM, or network fetch. These sources do not yet emit one confidence/reason object. | `channelMatchResult` fixture covering exact UC, handle, custom, name-only, learned map, stale learned map, collaborator, and no identity. |
| Learned video/channel maps | `js/content/bridge_settings.js`, `js/content_bridge.js`, `js/background.js` | Map writes can refresh runtime and influence future filtering without clear source, route, freshness, or confidence. | Map write budget and schema: source, route, confidence, TTL/cap policy, writer id, and no-rule behavior. |
| Background settings compiler | `js/background.js`, `js/settings_shared.js` | Compile, migrate, normalize, derive keywords, cache, and sometimes write storage are mixed. Executable fixtures now prove `getCompiledSettings()` can write generated V4/profile-derived state during the read path. This weakens background as the single source of runtime truth. | Pure/revisioned compiler proof; migrations explicit; every storage write tied to mutation intent or migration report. |
| State manager and UI mutations | `js/state_manager.js`, `js/tab-view.js`, `js/popup.js`, `js/render_engine.js` | UI can mutate local state, persist asynchronously, broadcast indirectly, or report success after failed or skipped saves. Channel-add fixtures now prove the Main blocklist path and shared `addFilteredChannel` path are separate authorities, and one message path drops `listType`. | Mutation intent schema and save queue/revision fixtures for keyword/channel/profile/content/category/import/Nanah/native actions. |
| Whitelist/blocklist modes | `js/background.js`, `js/state_manager.js`, `js/settings_shared.js`, `js/filter_logic.js`, `js/tab-view.js` | Empty blocklist should be no-op; empty whitelist can fail closed. Mode switch, import, copy/transfer, and migration paths can change list contents. | Mode-transition report fixtures for empty, non-empty, import, copy false, transfer true, legacy V3, Kids, and managed-child profiles. |
| Content/category controls | `js/filter_logic.js`, `js/content/dom_fallback.js`, `js/state_manager.js`, `js/background.js` | `enabled` flags can wake JSON/DOM work even when predicates are incomplete or selected values are empty. Duration defaults can become broad hides. | `compiledRuleState` validator fixtures: disabled, enabled-empty, duration zero, upload-date blank, uppercase, categories empty/non-empty. |
| Comments/end-screen/player/watch page | `js/seed.js`, `js/filter_logic.js`, `js/content/dom_fallback.js`, `js/layout.js`, `js/content_bridge.js` | `/next` and `/player` can be expensive and must not mutate player metadata unless explicitly allowed. End-screen and watch rails need renderer and DOM coverage. | Endpoint-level `/next` and `/player` fixtures; end-screen renderer fixtures; no player-response mutation unless approved. |
| Shorts/reels | `js/filter_logic.js`, `js/content/dom_fallback.js`, `js/content/block_channel.js` | Shorts owner identity paths are partial; whitelist behavior can fail closed when owner is unresolved. | Shorts fixture matrix for `shortsLockupViewModel`, `reelItemRenderer`, owner UC/handle, title-only, mobile/desktop DOM cards. |
| Playlists/radio/mixes | `js/filter_logic.js`, `js/content/dom_fallback.js`, `js/content/block_channel.js` | Some playlist and radio renderers are unwrapped but have no rule, or may promote metadata/collaborators too broadly. | Playlist/radio fixture matrix for compact playlist, playlist panel, selected row, compact radio, radio avatar-stack, Mix metadata. |
| Posts/community | `js/filter_logic.js`, `js/content/dom_fallback.js`, `js/content/block_channel.js` | Web and app posts need the same 3-dot affordance and filtering confidence, but `postRenderer` / `sharedPostRenderer` coverage is partial. | Post renderer fixture for author, shared original, text/body keyword, menu insertion, disabled/whitelist states. |
| YouTube Kids extension/app surface | `js/content/block_channel.js`, `js/filter_logic.js`, app runtime copies | Kids native passive listener and app WebViews share concepts but not identical runtime lifecycles. | Kids surface report proving route, player/watch state, native/block listener, rule profile, and no unintended custom menu injection. |
| Nanah/import/export/sync | `js/nanah_sync_adapter.js`, `js/tab-view.js`, `js/io_manager.js`, `js/security_manager.js`, `js/background.js`, `js/state_manager.js` | Sync/import can create settings shapes and mode transitions outside normal UI flows. | Trusted mutation intent fixture for import, pair, receive, apply, reject, backup, rollback, and mode/list conflict handling. |
| Website/release/public claims | `website/`, `README.md`, docs, release artifacts | Public pages can claim release/privacy/platform behavior before app/extension/runtime proof is synchronized. | Public claim manifest with code proof, release proof, owner, last verified date, and required-before-publish marker. |

## Minimal Disease-Level Test Set

These tests should land before optimization or behavior cleanup:

```text
1. Empty blocklist install:
   no rules, no affordances, enabled=true
   expected: no JSON rewrite, no broad DOM hide, no quick sweep, no fallback menu insertion, no map write.

2. Empty whitelist mode:
   explicit whitelist mode with no allow rules
   expected: documented fail-closed behavior or activation prevented with UI confirmation.

3. Active one-keyword blocklist:
   one keyword, no channel rules
   expected: only matching renderers/cards hide; unrelated search results stay visible.

4. Active one-channel blocklist:
   one UC ID and one handle case
   expected: channel-owned cards hide; name-only weak matches do not over-hide without policy.

5. Active whitelist with one channel:
   exact UC/handle match, unresolved identity, stale learned map, Shorts, playlist, watch rail
   expected: allowed content remains visible; unresolved pending behavior is explicit and restored.

6. Mode switch and import:
   blocklist entries plus imported whitelist entries with copyBlocklist=false
   expected: no implicit destructive transfer.

7. `/player` endpoint:
   any active/no-rule state
   expected: metadata harvest only unless a fixture proves safe mutation.

8. Quick block and menu disabled:
   showQuickBlockButton=false and showBlockMenuItem=false
   expected: no persistent observer/timer work and no fallback mutation path.
```

## Current Audit Verdict

```text
Do not delete random scans first.
Do not broaden DOM fallback to compensate for JSON gaps.
Do not call a renderer JSON-first without a fixture.
Do not add simultaneous allow/block UI until mode migration and mutation authority are proven.

The next implementation branch should be instrumentation and fixtures only.
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.
