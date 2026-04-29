# Issue 51 Firefox Export Failure - 2026-04-29

## Problem

Firefox and Waterfox on Windows could show exported FilterTube JSON files as failed extension downloads. The report covered both normal JSON export and encrypted JSON export.

## Likely Cause

The dashboard export path used extension-driven blob downloads, and the blob URL was revoked shortly after `downloads.download()` or the anchor fallback started. Firefox-derived browsers can still be reading the blob when the URL is revoked, especially on Windows. Some Firefox builds are also less reliable with extension download filenames that include subfolders.

## Fix

- Manual dashboard exports use the direct anchor-download path on Firefox/Waterfox for both plain and encrypted JSON.
- Blob URLs are now kept alive for a longer cleanup window instead of being revoked immediately.
- Background auto-backup downloads and the shared IO backup helper now support both callback-style and Promise-style downloads APIs.
- Auto-backup blob URLs also use delayed revocation.

## Expected Behavior

- Chrome/Chromium keeps using `downloads.download()` with the `FilterTube Export/` subfolder.
- Firefox/Waterfox manual export saves the file directly through the browser download flow, avoiding the subfolder/blob failure path.
- Encrypted export uses the same stable Firefox path as plain export.
