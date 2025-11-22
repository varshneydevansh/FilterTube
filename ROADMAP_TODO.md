# FilterTube 2026 Roadmap & TODOs

_Last updated: 2025-11-18_

## How to use this document
1. **Start with the Context Snapshot** for the current state of the codebase and design decisions.
2. Follow the phases in order; each item links back to the file or doc where work happens.
3. Mark checklist items when completed and add date/initials for hand-off clarity.
4. Append meeting notes or external analyses in the "References" block so future collaborators stay aligned.

## Context Snapshot (Nov 2025)
- Architecture: Data interception v3.0 (see @js/filter_logic.js) with renderer coverage tracked in @docs/youtube_renderer_inventory.md.
- Recent work: Phase A/B renderer reorder + coverage for chips, community posts, notifications, podcasts, playlist overlays.@js/filter_logic.js#126-460
- Outstanding renderers (non-ad): `watchCardHeroVideoRenderer`, `watchCardSectionSequenceRenderer`, `compactAutoplayRenderer`, `reelShelfRenderer`, `sharedPostRenderer`, `endScreenVideoRenderer`.
- UI direction: Neuroinclusive theme aligning with red logo, serene illustrated accents, simple typography. Kids mode planned with teal variant and PIN gating.
- ML stack decision: Transformers.js v3 (WebGPU via ONNX Runtime Web) with TF.js/WASM fallback; TinyCLIP for thumbnails; quantized MiniLM-class for semantics.
- Scope exclusions: Ad renderers and ad UX (per user directive).

## References & Resources
- Antigravity IDE strategy brief (2025-11-18) – see session notes.
- ROADMAP visual inspiration: serene/pixelated art style (user-provided images).
- Design tokens draft palette: background `#F7F6F2`, accent red (logo), primary blue `#3D6EA4`, support colors (green `#2F7A63`, amber `#C87C31`, violet `#6B5CAA`).
- ML benchmarking: Transformers.js + ONNX Runtime Web (Nov 2025 release notes).

## Phase 0 – Alignment & Foundations (Week 0)
- [ ] **Finalize neuroinclusive design tokens** – capture in `design/design_tokens.json` with CSS export; include brand red accent usage guidelines and kids mode variant.
- [ ] **Theme guidelines document** – add section to `docs/UX_GUIDE.md` covering serene imagery slots, typography (Inter/Open Sans), focus states, accessibility notes for ADHD/PTSD users.
- [ ] **ML stack approval** – document rationale and fallbacks in `docs/ML_STRATEGY.md`; include model shortlist (MiniLM variants, TinyCLIP) and storage plan (IndexedDB caching).

## Phase 1 – UI/UX System (Weeks 1-2)
- [ ] **Design tokens implementation** – create `css/design_tokens.css` + CSS variables, plus `design/tokens.scss` if needed; update build pipeline.
- [ ] **Information architecture prototype** – wireframe popup + full settings; reference nav order (Overview → Home → Watch → Search → Channel → Library → Notifications → Kids Mode → Advanced).
- [ ] **Component library** – build accessible button, toggle, surface card, navigation tab, chip components in `ui/components/`; ensure keyboard focus (`outline: #2F7A63 2px`) and WCAG AA contrast.
- [ ] **Kids mode visuals** – define teal background tokens (`#EFF8F8`) and icon badges for parent/child state.

## Phase 2 – Feature Surfaces (Weeks 3-4)
- [ ] **Kids Mode scaffold** – implement PIN modal (Web Crypto SHA-256 hash stored in `chrome.storage.local`), kids-only nav filtering, UI messaging.
- [ ] **Surface toggles wiring** – add toggles for Watch Next chips, Community posts, Notifications, Playlist overlays to the settings UI; map to config keys consumed by background script.
- [ ] **Settings schema update** – extend settings object (see `js/content_bridge.js` and `js/background.js`) to persist per-surface toggles and whitelist/blacklist lists.
- [ ] **Documentation** – update `docs/SETTINGS_SCHEMA.md` with new keys and default behaviors.

## Phase 3 – Renderer Coverage (Weeks 4-5)
- [ ] **Implement missing renderers** – add rule entries for `watchCardHeroVideoRenderer`, `watchCardSectionSequenceRenderer`, `compactAutoplayRenderer`, `reelShelfRenderer`, `sharedPostRenderer`, `endScreenVideoRenderer`; update docs with status.
- [ ] **Regression tests** – capture JSON samples for new renderers under `samples/renderers/` and add unit coverage for extraction helpers.
- [ ] **Metadata-row validation** – ensure `getMetadataRowsText` handles `contentMetadataViewModel` variants (Subscriptions, Playlists, Podcasts). Document in `docs/youtube_renderer_inventory.md`.

## Phase 4 – Semantic Filtering (Weeks 6-8)
- [ ] **ML worker harness** – create `js/ml_worker.js` to load Transformers.js pipelines (feature-extraction) with q8 models and manage message protocol.
- [ ] **Semantic tree generator** – implement clustering pipeline (MiniLM embeddings → K-means/UMAP) and generate graph structure stored in settings.
- [ ] **UI integration** – build semantic tree editor component (D3/Cytoscape) with block/whitelist state chips; provide tooltips ("This hides: Apex Legends, ALGS, Scrims").
- [ ] **Import/export** – support JSON export/import of semantic configuration for parental sharing.

## Phase 5 – Thumbnail Filtering (Weeks 8-10)
- [ ] **Heuristic pass** – implement quick image checks (dominant red, text OCR) within worker prior to ML inference.
- [ ] **TinyCLIP integration** – load zero-shot classifier (45 MB) via Transformers.js WebGPU; define labels (`safe`, `blood`, `weapon`, `scary face`).
- [ ] **User controls** – add UI options (Hide, Blur, Warn) and ensure fallback when model unavailable.
- [ ] **Performance safeguards** – lazy-load model on first toggle; cache weights in IndexedDB; monitor memory usage (<200 MB target).

## Phase 6 – Polishing & Testing (Weeks 10-12)
- [ ] **Accessibility & neurodiversity testing** – recruit testers with ADHD/PTSD, capture feedback, iterate on copy/layout.
- [ ] **Performance profiling** – measure frame timings with ML enabled, worker throughput, memory; optimize as needed.
- [ ] **Docs & release notes** – update `docs/RELEASE_NOTES.md`, create Kids Mode manual, ML privacy FAQ, and UI style guide.

## Backlog / Watchlist
- [ ] Evaluate `adSlotRenderer`/`promotedSparklesWebRenderer` **only if** scope expands to ads.
- [ ] Monitor WebNN progress for potential accelerator gains (Chrome origin trials, Edge, Safari rollout).
- [ ] Explore cross-device sync (encrypted cloud storage) after MVP stabilization.
- [ ] Consider live chat filtering (`liveChatRenderer`) once baseline experience is stable.

## Session Log (append as work progresses)
- 2025-11-18: Phase A/B renderer reorg; roadmap drafted; ML stack decision recorded.
- 2025-11-18: Added neuroinclusive design tokens (JSON + CSS), created UX guide, loaded tokens into popup/tab view, refactored popup button/inputs to use tokens.
- _Add future entries here with date, author, summary of changes._
