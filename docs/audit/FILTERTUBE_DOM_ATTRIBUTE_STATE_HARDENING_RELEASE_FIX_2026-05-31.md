# FilterTube DOM Attribute State Hardening Release Fix - 2026-05-31

Status: release-fix proof slice for GitHub issue #59. Runtime behavior changed:
sensitive FilterTube card state is now stored in an isolated-world virtual
attribute store instead of being stamped into YouTube-visible DOM attributes.

## Scope

| File | Role |
| --- | --- |
| `js/content/dom_state.js` | Early isolated-world virtual attribute store for sensitive `data-filtertube-*` state. |
| `manifest.json` | Loads `dom_state.js` before DOM readers and `content_bridge.js`. |
| `manifest.chrome.json` | Chrome package parity for the same load order. |
| `manifest.firefox.json` | Firefox package parity for the same load order. |
| `manifest.opera.json` | Opera package parity for the same load order. |
| `tests/runtime/dom-state-virtual-attributes-current-behavior.test.mjs` | Runtime proof for virtual get/set/query/closest behavior and manifest order. |

## Virtualized Attributes

The fix virtualizes the high-identifiability and runtime-state attributes:

```text
data-filtertube-video-id
data-filtertube-unique-id
data-filtertube-processed
data-filtertube-last-processed-id
data-filtertube-last-processed-mode
data-filtertube-channel-id
data-filtertube-channel-handle
data-filtertube-channel-name
data-filtertube-channel-custom
data-filtertube-collaborators
data-filtertube-collaborators-source
data-filtertube-collaborators-ts
data-filtertube-expected-collaborators
data-filtertube-collab-key
data-filtertube-collab-state
data-filtertube-collab-awaiting-dialog
data-filtertube-collab-requested
data-filtertube-collab-retries
data-filtertube-blocked-channel-id
data-filtertube-blocked-channel-handle
data-filtertube-blocked-channel-name
data-filtertube-blocked-state
data-filtertube-blocked-ts
```

Visual and CSS-control attributes stay real DOM attributes for now, including
`data-filtertube-hidden`, whitelist pending markers, quick-block hover/sticky
state, mobile-surface state, overlay-open state, and debug flags.

## Behavior Contract

Existing content code can keep using `setAttribute`, `getAttribute`,
`hasAttribute`, `removeAttribute`, `querySelector`, `querySelectorAll`,
`matches`, and `closest` for the virtualized attributes. The patched DOM APIs
return the virtual values inside the extension isolated world, but
`setAttribute()` removes the corresponding real DOM attribute so YouTube and page
scripts do not see the identifier.

The query patch supports the selector forms used by FilterTube today:

```text
[data-filtertube-video-id="..."]
[data-filtertube-channel-id], [data-filtertube-channel-handle]
a#thumbnail[data-filtertube-channel-handle]
[data-filtertube-collab-awaiting-dialog="true"]
```

## Proof

Focused runtime proof:

```text
node --test tests/runtime/dom-state-virtual-attributes-current-behavior.test.mjs --test-reporter=spec
```

Passing assertions:

1. `data-filtertube-video-id` and `data-filtertube-processed` remain readable
   through `getAttribute()` but are absent from the backing DOM attribute map.
2. `data-filtertube-hidden` remains a normal DOM attribute, preserving CSS and
   visibility behavior.
3. Virtual `querySelector`, `querySelectorAll`, and `closest` preserve existing
   video-id, channel-identity, and collaborator flows.
4. All extension manifests load `js/content/dom_state.js` before DOM helper
   scripts and before `js/content_bridge.js`.

## Release Notes

This reduces page-visible fingerprinting without changing blocklist, whitelist,
quick-block, collaborator, or DOM fallback call sites. The implementation is
intentionally early-loaded and scoped to a fixed allowlist of sensitive
attributes so existing CSS-visible state remains unchanged.
