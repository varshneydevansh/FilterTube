# Issue 54 Dashboard Sidebar Height - 2026-04-29

## Problem

On shorter desktop windows, the dashboard left sidebar could cut off lower navigation items such as Help or Donate. Users had to zoom out to reach them.

## Cause

The desktop sidebar was constrained to viewport height and used `overflow: hidden`, while the navigation list itself did not scroll. The brand, nav rows, and footer could exceed the available height.

## Fix

- The nav list is now the scrollable sidebar region.
- The brand and footer remain fixed in the sidebar layout.
- Short desktop heights use tighter sidebar spacing and smaller nav-row vertical rhythm.

## Expected Behavior

All dashboard navigation items remain reachable on short desktop viewports without page zoom changes.
