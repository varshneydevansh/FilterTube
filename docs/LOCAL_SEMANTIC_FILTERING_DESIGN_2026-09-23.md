# Local semantic filtering: implementation boundary (2026-09-23)

This is a design and acceptance contract, not an enabled filter. The earlier Jev API prototype was removed before release: it required a remote request and API key, contrary to the local-only requirement.

## What “our own Jev” means here

FilterTube owns the preferences, metadata extraction, decisions, cache, explanations, and browser integration. A small, redistributable text-embedding model may be bundled with the extension; inference must run inside the browser with remote model loading explicitly disabled. This is not a claim that FilterTube trained a new foundation model or that Jev itself runs locally.

## Proposed first slice

1. Read the selected video's authoritative `videoId`, title, channel identity, and description from the Player/Watch JSON already used by admission. Never infer channel ownership from a Google query, title mention, recommendation, or thumbnail.
2. Run existing explicit rules first. They remain deterministic and keep their current authority. A semantic result must not reclassify a verified channel mismatch as a blocked channel.
3. Compute local embeddings for short, bounded text: the selected video's title and relevant description excerpt, and each user topic phrase. Cache by model version, normalized text hash, and rule revision. Batch feed-card work only when idle/visible.
4. Compare topic similarity locally. A positive topic match may override a negative topic match for card presentation. Return a distinct `semantic-topic` reason with score and topic; never emit a channel/video reason from a semantic result.
5. Start opt-in on YouTube cards only, outside playback admission. Extend to playback only after a labeled false-positive/false-negative set, browser-specific startup benchmarks, and direct/SPA/embed regression tests show the rule is reliable. A model load failure must not create a false “blocked video” banner.

## Offline and performance gates

- Ship model weights, tokenizer, inference runtime, and any WASM binaries in the extension package. No CDN, inference API, optional remote fallback, API key, or page-text upload.
- Pin model/runtime versions and license; audit the release archive to ensure every required file is present. A candidate, not yet adopted, is the Apache-2.0 [`Xenova/all-MiniLM-L6-v2` int8 ONNX model](https://huggingface.co/Xenova/all-MiniLM-L6-v2/tree/main/onnx) (~23 MB). Its English-language limitation and package-size cost need explicit product review. [Transformers.js local-model settings](https://huggingface.co/docs/transformers.js/api/env) permit disabling remote model loads.
- Lazy-load once per extension context and avoid model initialization on Watch navigation. Reuse warm embeddings; do not hold an otherwise allowed video while experimental semantic work runs.
- Measure cold start, warm batch latency, memory, package size, and hit/miss behavior on Chrome, Firefox, and Opera before enabling the UI.

## Acceptance examples

- Blocking the Shakira channel must not block a different channel's video merely because its title says Shakira.
- Direct YouTube, SPA navigation, and Google embedded playback must return the same explicit-rule decision for the same video ID.
- With global Disabled, neither card hiding nor a semantic playback hold occurs.
- A semantic model failure stays `unavailable` and is never labeled “blocked channel.”

No semantic UI or runtime path is enabled by this document. The next implementation checkpoint is an offline model-loading proof in an isolated extension context, followed by a reviewed opt-in card pilot.
