(function () {
    'use strict';

    if (window.FilterTubeDomState?.virtualAttributesReady) {
        return;
    }

    const virtualAttributes = new Set([
        'data-filtertube-video-id',
        'data-filtertube-unique-id',
        'data-filtertube-processed',
        'data-filtertube-last-processed-id',
        'data-filtertube-last-processed-mode',
        'data-filtertube-channel-id',
        'data-filtertube-channel-handle',
        'data-filtertube-channel-name',
        'data-filtertube-channel-custom',
        'data-filtertube-collaborators',
        'data-filtertube-collaborators-source',
        'data-filtertube-collaborators-ts',
        'data-filtertube-expected-collaborators',
        'data-filtertube-collab-key',
        'data-filtertube-collab-state',
        'data-filtertube-collab-awaiting-dialog',
        'data-filtertube-collab-requested',
        'data-filtertube-collab-retries',
        'data-filtertube-blocked-channel-id',
        'data-filtertube-blocked-channel-handle',
        'data-filtertube-blocked-channel-name',
        'data-filtertube-blocked-state',
        'data-filtertube-blocked-ts'
    ]);

    const elementState = new WeakMap();
    const indexes = new Map();

    const elementProto = window.Element?.prototype;
    const documentProto = window.Document?.prototype;
    const fragmentProto = window.DocumentFragment?.prototype;

    if (!elementProto || elementProto.__filtertubeDomStatePatched) {
        window.FilterTubeDomState = {
            virtualAttributesReady: true,
            isVirtualAttribute: name => virtualAttributes.has(String(name || '').toLowerCase())
        };
        return;
    }

    const native = {
        setAttribute: elementProto.setAttribute,
        getAttribute: elementProto.getAttribute,
        hasAttribute: elementProto.hasAttribute,
        removeAttribute: elementProto.removeAttribute,
        matches: elementProto.matches || elementProto.webkitMatchesSelector || elementProto.msMatchesSelector,
        closest: elementProto.closest,
        elementQuerySelector: elementProto.querySelector,
        elementQuerySelectorAll: elementProto.querySelectorAll,
        documentQuerySelector: documentProto?.querySelector,
        documentQuerySelectorAll: documentProto?.querySelectorAll,
        fragmentQuerySelector: fragmentProto?.querySelector,
        fragmentQuerySelectorAll: fragmentProto?.querySelectorAll
    };

    function normalizeName(name) {
        return String(name || '').toLowerCase();
    }

    function getState(element, create = false) {
        if (!element) return null;
        let state = elementState.get(element);
        if (!state && create) {
            state = new Map();
            elementState.set(element, state);
        }
        return state || null;
    }

    function getIndex(name, create = false) {
        let byValue = indexes.get(name);
        if (!byValue && create) {
            byValue = new Map();
            indexes.set(name, byValue);
        }
        return byValue || null;
    }

    function addToIndex(element, name, value) {
        const byValue = getIndex(name, true);
        let elements = byValue.get(value);
        if (!elements) {
            elements = new Set();
            byValue.set(value, elements);
        }
        elements.add(element);
    }

    function removeFromIndex(element, name, value) {
        const byValue = getIndex(name);
        if (!byValue) return;
        const elements = byValue.get(value);
        if (!elements) return;
        elements.delete(element);
        if (elements.size === 0) {
            byValue.delete(value);
        }
        if (byValue.size === 0) {
            indexes.delete(name);
        }
    }

    function setVirtualAttribute(element, name, value) {
        const attr = normalizeName(name);
        const stringValue = String(value);
        const state = getState(element, true);
        const oldValue = state.get(attr);
        if (oldValue === stringValue) return;
        if (oldValue !== undefined) {
            removeFromIndex(element, attr, oldValue);
        }
        state.set(attr, stringValue);
        addToIndex(element, attr, stringValue);
        try {
            native.removeAttribute.call(element, attr);
        } catch (e) {
        }
    }

    function getVirtualAttribute(element, name) {
        const state = getState(element);
        if (!state) return null;
        const value = state.get(normalizeName(name));
        return value === undefined ? null : value;
    }

    function hasVirtualAttribute(element, name) {
        const state = getState(element);
        return Boolean(state && state.has(normalizeName(name)));
    }

    function removeVirtualAttribute(element, name) {
        const attr = normalizeName(name);
        const state = getState(element);
        if (state) {
            const oldValue = state.get(attr);
            if (oldValue !== undefined) {
                removeFromIndex(element, attr, oldValue);
                state.delete(attr);
            }
        }
        try {
            native.removeAttribute.call(element, attr);
        } catch (e) {
        }
    }

    function splitSelectorList(selector) {
        const parts = [];
        let current = '';
        let depth = 0;
        let quote = '';
        for (const char of String(selector || '')) {
            if (quote) {
                current += char;
                if (char === quote) quote = '';
                continue;
            }
            if (char === '"' || char === "'") {
                quote = char;
                current += char;
                continue;
            }
            if (char === '[') depth++;
            if (char === ']') depth = Math.max(0, depth - 1);
            if (char === ',' && depth === 0) {
                if (current.trim()) parts.push(current.trim());
                current = '';
                continue;
            }
            current += char;
        }
        if (current.trim()) parts.push(current.trim());
        return parts;
    }

    function parseVirtualAttrSelectors(selector) {
        const matches = [];
        const pattern = /\[\s*(data-filtertube-[\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]+)))?\s*\]/gi;
        let match;
        while ((match = pattern.exec(String(selector || '')))) {
            const name = normalizeName(match[1]);
            if (!virtualAttributes.has(name)) continue;
            matches.push({
                raw: match[0],
                name,
                value: match[2] ?? match[3] ?? match[4] ?? null
            });
        }
        return matches;
    }

    function selectorHasVirtualAttribute(selector) {
        return parseVirtualAttrSelectors(selector).length > 0;
    }

    function nativeSelectorWithoutVirtualAttrs(selector, virtualParts) {
        let nativeSelector = String(selector || '');
        virtualParts.forEach(part => {
            nativeSelector = nativeSelector.replace(part.raw, '');
        });
        nativeSelector = nativeSelector.replace(/\s+/g, ' ').trim();
        if (!nativeSelector) return '*';
        return nativeSelector;
    }

    function virtualPartMatches(element, part) {
        if (!hasVirtualAttribute(element, part.name)) return false;
        if (part.value === null) return true;
        return getVirtualAttribute(element, part.name) === part.value;
    }

    function matchesSingleSelector(element, selector) {
        const virtualParts = parseVirtualAttrSelectors(selector);
        if (virtualParts.length === 0) {
            return native.matches.call(element, selector);
        }
        if (!virtualParts.every(part => virtualPartMatches(element, part))) {
            return false;
        }
        const nativeSelector = nativeSelectorWithoutVirtualAttrs(selector, virtualParts);
        try {
            return native.matches.call(element, nativeSelector);
        } catch (e) {
            return nativeSelector === '*';
        }
    }

    function matchesSelector(element, selector) {
        const selectors = splitSelectorList(selector);
        if (selectors.length === 0) return false;
        return selectors.some(part => matchesSingleSelector(element, part));
    }

    function isWithinRoot(root, element) {
        if (!root || root === document) return true;
        if (root === element) return true;
        if (typeof root.contains === 'function') return root.contains(element);
        return false;
    }

    function collectVirtualCandidates(selector) {
        const candidates = new Set();
        const parts = parseVirtualAttrSelectors(selector);
        parts.forEach(part => {
            const byValue = getIndex(part.name);
            if (!byValue) return;
            if (part.value !== null) {
                byValue.get(part.value)?.forEach(element => candidates.add(element));
                return;
            }
            byValue.forEach(elements => {
                elements.forEach(element => candidates.add(element));
            });
        });
        return candidates;
    }

    function sortElementsInDocumentOrder(elements) {
        return elements.sort((a, b) => {
            if (a === b) return 0;
            if (typeof a.compareDocumentPosition !== 'function') return 0;
            const position = a.compareDocumentPosition(b);
            return (position & Node.DOCUMENT_POSITION_PRECEDING) ? 1 : -1;
        });
    }

    function queryAllWithVirtual(root, selector, nativeQueryAll) {
        const results = [];
        const seen = new Set();
        const add = element => {
            if (!element || seen.has(element)) return;
            seen.add(element);
            results.push(element);
        };

        try {
            nativeQueryAll.call(root, selector).forEach(add);
        } catch (e) {
        }

        if (!selectorHasVirtualAttribute(selector)) {
            return results;
        }

        collectVirtualCandidates(selector).forEach(element => {
            if (!element?.isConnected && root === document) return;
            if (!isWithinRoot(root, element)) return;
            if (matchesSelector(element, selector)) {
                add(element);
            }
        });

        return sortElementsInDocumentOrder(results);
    }

    elementProto.setAttribute = function patchedSetAttribute(name, value) {
        const attr = normalizeName(name);
        if (virtualAttributes.has(attr)) {
            setVirtualAttribute(this, attr, value);
            return undefined;
        }
        return native.setAttribute.call(this, name, value);
    };

    elementProto.getAttribute = function patchedGetAttribute(name) {
        const attr = normalizeName(name);
        if (virtualAttributes.has(attr)) {
            return getVirtualAttribute(this, attr);
        }
        return native.getAttribute.call(this, name);
    };

    elementProto.hasAttribute = function patchedHasAttribute(name) {
        const attr = normalizeName(name);
        if (virtualAttributes.has(attr)) {
            return hasVirtualAttribute(this, attr);
        }
        return native.hasAttribute.call(this, name);
    };

    elementProto.removeAttribute = function patchedRemoveAttribute(name) {
        const attr = normalizeName(name);
        if (virtualAttributes.has(attr)) {
            removeVirtualAttribute(this, attr);
            return undefined;
        }
        return native.removeAttribute.call(this, name);
    };

    elementProto.matches = function patchedMatches(selector) {
        if (selectorHasVirtualAttribute(selector)) {
            return matchesSelector(this, selector);
        }
        return native.matches.call(this, selector);
    };

    elementProto.closest = function patchedClosest(selector) {
        if (!selectorHasVirtualAttribute(selector)) {
            return native.closest.call(this, selector);
        }
        let current = this;
        while (current && current instanceof Element) {
            if (matchesSelector(current, selector)) return current;
            current = current.parentElement;
        }
        return null;
    };

    elementProto.querySelectorAll = function patchedElementQuerySelectorAll(selector) {
        return queryAllWithVirtual(this, selector, native.elementQuerySelectorAll);
    };

    elementProto.querySelector = function patchedElementQuerySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
    };

    if (documentProto?.querySelectorAll) {
        documentProto.querySelectorAll = function patchedDocumentQuerySelectorAll(selector) {
            return queryAllWithVirtual(this, selector, native.documentQuerySelectorAll);
        };
    }

    if (documentProto?.querySelector) {
        documentProto.querySelector = function patchedDocumentQuerySelector(selector) {
            return this.querySelectorAll(selector)[0] || null;
        };
    }

    if (fragmentProto?.querySelectorAll) {
        fragmentProto.querySelectorAll = function patchedFragmentQuerySelectorAll(selector) {
            return queryAllWithVirtual(this, selector, native.fragmentQuerySelectorAll);
        };
    }

    if (fragmentProto?.querySelector) {
        fragmentProto.querySelector = function patchedFragmentQuerySelector(selector) {
            return this.querySelectorAll(selector)[0] || null;
        };
    }

    Object.defineProperty(elementProto, '__filtertubeDomStatePatched', {
        value: true,
        configurable: false
    });

    function queryAllFromRoot(root, selector) {
        const target = root || document;
        const queryAll = target instanceof Element
            ? native.elementQuerySelectorAll
            : (target instanceof DocumentFragment
                ? native.fragmentQuerySelectorAll
                : native.documentQuerySelectorAll);
        return queryAllWithVirtual(target, selector, queryAll);
    }

    window.FilterTubeDomState = {
        virtualAttributesReady: true,
        isVirtualAttribute: name => virtualAttributes.has(normalizeName(name)),
        get: getVirtualAttribute,
        set: setVirtualAttribute,
        has: hasVirtualAttribute,
        remove: removeVirtualAttribute,
        querySelectorAll: queryAllFromRoot,
        querySelector: (root, selector) => (queryAllFromRoot(root || document, selector)[0] || null),
        virtualAttributeNames: () => Array.from(virtualAttributes)
    };
})();
