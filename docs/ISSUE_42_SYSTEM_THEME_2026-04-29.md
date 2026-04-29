# Issue 42 Browser Theme Detection - 2026-04-29

## Problem

New installs defaulted to light theme even when the browser or operating system was already in dark mode.

## Cause

The extension shell stamped `data-theme="light"` before settings loaded, and the shared settings loader treated a missing `ftThemePreference` value as light. That prevented the existing `prefers-color-scheme` CSS from taking effect.

## Fix

- The early popup/dashboard shell now uses `prefers-color-scheme` when no explicit theme is already present.
- Shared settings now resolves a missing `ftThemePreference` to the current system theme without persisting a user preference.
- Manual theme toggles still save explicit `light` or `dark`, so existing user choices remain stable.

## Expected Behavior

- Fresh installs open in dark UI when the browser/OS is dark.
- Fresh installs open in light UI when the browser/OS is light.
- Once a user toggles the theme, that explicit choice continues to win over system detection.
