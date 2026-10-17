// Shared keyboard navigation for the extension and downstream device pickers.
(function (root) {
    'use strict';

    const controls = 'button, input, select, textarea, summary, a[href]';
    const dynamicControls = '[data-family-device-id][data-source], [data-family-device-focus-key]';

    function available(element) {
        if (!element || element.disabled || element.matches(':disabled')) return false;
        if (element.tabIndex < 0 || element.getAttribute('aria-disabled') === 'true') return false;
        if (element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
        const view = element.ownerDocument.defaultView;
        const style = view?.getComputedStyle(element);
        if (style?.visibility === 'hidden' || style?.display === 'none') return false;
        const bounds = element.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0 && element.getClientRects().length > 0;
    }

    function focusControl(element) {
        element.focus({ preventScroll: true });
        element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    }

    function keepsNativeArrows(element) {
        return element.isContentEditable || !!element.closest('[contenteditable="true"]')
            || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
    }

    function findNext(container, current, key) {
        const origin = current.getBoundingClientRect();
        const horizontal = key === 'ArrowLeft' || key === 'ArrowRight';
        const sign = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
        const primary = horizontal ? 'left' : 'top';
        const primarySize = horizontal ? 'width' : 'height';
        const secondary = horizontal ? 'top' : 'left';
        const secondarySize = horizontal ? 'height' : 'width';
        const originCenter = origin[primary] + origin[primarySize] / 2;
        const originSideCenter = origin[secondary] + origin[secondarySize] / 2;
        const candidates = Array.from(container.querySelectorAll(controls))
            .filter(element => element !== current && available(element))
            .map(element => {
                const bounds = element.getBoundingClientRect();
                const distance = sign * (bounds[primary] + bounds[primarySize] / 2 - originCenter);
                const crossDistance = Math.abs(bounds[secondary] + bounds[secondarySize] / 2 - originSideCenter);
                const inLane = bounds[secondary] < origin[secondary] + origin[secondarySize]
                    && bounds[secondary] + bounds[secondarySize] > origin[secondary];
                return { element, distance, crossDistance, inLane };
            })
            // Left/right stays within the row; a single-column layout uses up/down.
            .filter(candidate => candidate.distance > 1 && (!horizontal || candidate.inLane))
            .sort((a, b) => Number(b.inLane) - Number(a.inLane)
                || (a.distance + a.crossDistance / 2) - (b.distance + b.crossDistance / 2));
        return candidates[0]?.element || null;
    }

    function install(container) {
        if (!container?.addEventListener) return () => {};
        const document = container.ownerDocument;
        let selectedDevice = null;
        let activation = 0;
        let installed = true;
        const onClick = event => {
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            const tile = event.target?.closest('button[data-family-device-id][data-source]');
            if (!tile || !container.contains(tile) || !available(tile) || tile.dataset.selected !== 'true') return;
            selectedDevice = {
                deviceId: tile.dataset.familyDeviceId,
                source: tile.dataset.source,
                profileId: tile.dataset.profileId || '',
                sourceProfileId: tile.dataset.sourceProfileId || ''
            };
            const active = document.activeElement;
            const request = ++activation;
            // Tile listeners update the review first. Let their queued work run,
            // while preserving a dialog or another deliberate focus change.
            Promise.resolve().then(() => {
                if (!installed || request !== activation || event.defaultPrevented || document.activeElement !== active) return;
                if (active !== tile && active !== document.body && active !== document.documentElement) return;
                const action = container.querySelector('#ftNanahDeviceSelectionActionBtn');
                if (available(action)) focusControl(action);
            });
        };
        const onKeyDown = event => {
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            const current = document.activeElement;
            if (!current || !container.contains(current) || keepsNativeArrows(current)) return;
            if (event.key === 'Escape') {
                if (!selectedDevice || !current.closest('#ftNanahDeviceSelectionPreview')
                    || current.closest('dialog, [role="dialog"], [aria-modal="true"]')) return;
                const availableTiles = Array.from(container.querySelectorAll('button[data-family-device-id][data-source]')).filter(available);
                const exactTile = availableTiles.find(element => element.dataset.familyDeviceId === selectedDevice.deviceId
                    && element.dataset.source === selectedDevice.source);
                const mergedTiles = selectedDevice.source === 'live-session' && selectedDevice.deviceId
                    && selectedDevice.profileId && selectedDevice.sourceProfileId
                    ? availableTiles.filter(element => element.dataset.liveSessionDeviceId === selectedDevice.deviceId
                        && element.dataset.liveSessionProfileId === selectedDevice.profileId
                        && element.dataset.liveSessionSourceProfileId === selectedDevice.sourceProfileId) : [];
                const tile = exactTile || (mergedTiles.length === 1 ? mergedTiles[0] : null);
                const fallback = Array.from(container.querySelectorAll('[data-family-device-focus-fallback]')).find(available);
                if (!tile && !fallback) return;
                ++activation;
                event.preventDefault();
                focusControl(tile || fallback);
                return;
            }
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
            if (!current.matches(controls) || !available(current)) return;
            const next = findNext(container, current, event.key);
            if (!next) return;
            event.preventDefault();
            focusControl(next);
        };
        container.addEventListener('click', onClick);
        container.addEventListener('keydown', onKeyDown);
        return () => {
            installed = false;
            container.removeEventListener('click', onClick);
            container.removeEventListener('keydown', onKeyDown);
        };
    }

    function captureFocus(container) {
        const active = container?.ownerDocument?.activeElement;
        if (!active || !container.contains(active)) return null;
        const device = active.closest(dynamicControls);
        if (!device || !container.contains(device)) return null;
        return {
            element: active,
            deviceId: device.dataset.familyDeviceId || '',
            source: device.dataset.source || '',
            focusKey: device.dataset.familyDeviceFocusKey || ''
        };
    }

    function restoreFocus(container, snapshot) {
        if (!container || !snapshot) return false;
        const document = container.ownerDocument;
        const active = document.activeElement;
        // A dialog or a user's next action takes priority over background discovery.
        if (active && active !== snapshot.element && active !== document.body && active !== document.documentElement) return false;
        if (container.contains(snapshot.element) && available(snapshot.element)) return true;
        const replacement = Array.from(container.querySelectorAll(dynamicControls)).find(element => {
            if (!available(element)) return false;
            return snapshot.focusKey
                ? element.dataset.familyDeviceFocusKey === snapshot.focusKey
                : element.dataset.familyDeviceId === snapshot.deviceId && element.dataset.source === snapshot.source;
        });
        const fallback = Array.from(container.querySelectorAll('[data-family-device-focus-fallback]')).find(available);
        const next = replacement || fallback;
        if (!next) return false;
        focusControl(next);
        return true;
    }

    root.FilterTubeFamilyDeviceNavigation = Object.freeze({ install, captureFocus, restoreFocus });
})(typeof window === 'undefined' ? globalThis : window);
