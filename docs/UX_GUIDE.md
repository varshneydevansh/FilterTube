# FilterTube Neuroinclusive Design Guide

_Last updated: 2025-11-18_

## Brand Alignment
- Primary accent derived from extension icon triangle/filter outline: `#FF2F2F`.
- Keep accent usage focused on interactive states (active tabs, primary buttons, badges) to reduce overstimulation.
- Neutral backgrounds favor warm greys and calm blues to mirror the serene illustration direction selected for web/app surfaces.

## Color Tokens
- Authoritative source: `design/design_tokens.json` (machine readable) and `css/design_tokens.css` (runtime variables).
- Apply CSS custom properties in new UI components, e.g.:
  ```css
  .ft-button-primary {
    background: var(--ft-color-interactive-primary);
    color: var(--ft-color-text-inverse);
    box-shadow: var(--ft-shadow-floating);
  }
  .ft-button-primary:hover {
    background: var(--ft-color-interactive-primary-hover);
  }
  ```
- Use `body[data-theme="kids"]` to switch into Kids Mode palette (`--ft-color-bg-kids`, same typography with higher accent restraint).

## Typography Tokens
- Base font stack: `var(--ft-font-family-base)` (Inter/Open Sans).
- Default size: `var(--ft-font-size-base)` with line height `var(--ft-line-height-base)`.
- Provide “comfort mode” by toggling `--ft-font-size-comfort` via CSS class or root override.

## Spacing & Radius System
- Spacing scale uses `--ft-space-*` tokens. Example layout spacing:
  ```css
  .ft-card {
    padding: var(--ft-space-lg);
    border-radius: var(--ft-radius-lg);
  }
  ```
- Rounded pills (chips) should use `--ft-radius-pill`.

## Focus & Accessibility
- Use `--ft-color-focus-outline` for keyboard focus rings (2px) to keep focus states accessible to ADHD/PTSD users who rely on clear navigation cues.
- Maintain WCAG AA contrast for text/background combinations; tokens are pre-vetted, but double-check when layering illustrations.

## Theming Guidance
- Background imagery: reserve for hero/banner areas, drawing from serene city+nature illustration motifs provided by design references.
- Keep content cards on neutral surfaces (`--ft-color-bg-surface`) to reduce cognitive load.
- Kids Mode hides advanced controls and reinforces calm via teal background; avoid red in kids mode except for urgent warnings.

## Next Steps
- Update popup/options HTML to load `css/design_tokens.css` prior to other style sheets.
- When building new components, prefer tokens over hard-coded values and note deviations in this guide.
