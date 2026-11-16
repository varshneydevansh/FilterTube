/* DoodleKit for the extension's own pages (the app's DoodleKit.kt, docs/app/design-system/DOODLES.md).
 * Nothing is drawn by code: each mark reveals one of the owner's real aKriti doodles, tinted brick
 * (or an area ink) through a CSS mask.
 * - check(): a crayon check wipes on along its stroke over DRAW (260 ms, the enter curve).
 * - underline(text): a crayon swoosh wipes in under a line of text.
 * - scribble(node): a scribble circle draws round an item, clockwise from twelve o'clock.
 * - clear(node): takes a mark away again.
 * The check, underline and circle mark state, so they stay. With reduced motion they simply appear.
 * Doodles are marks, not characters: the Companion setting does not remove them.
 */
(function (root) {
    'use strict';
    if (!root || root.FilterTubeDoodles) return;

    const DRAW_MS = 260;
    const ENTER = 'cubic-bezier(0.2, 0, 0, 1)';
    const ART = Object.freeze({
        check: 'assets/images/doodles/check.webp',
        underline: 'assets/images/doodles/underline_swoosh.webp',
        scribble: 'assets/images/doodles/scribble_circle.webp'
    });

    function url(path) {
        try {
            const api = typeof chrome !== 'undefined' ? chrome : (typeof browser !== 'undefined' ? browser : null);
            const full = api?.runtime?.getURL?.(path);
            if (full) return full;
        } catch (e) {
        }
        return `../${path}`;
    }

    function reduced() {
        try {
            return !!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        } catch (e) {
            return false;
        }
    }

    function mark(kind, className) {
        const node = root.document.createElement('span');
        node.className = `pk-doodle-mark pk-doodle-mark--${kind}${className ? ` ${className}` : ''}`;
        node.setAttribute('aria-hidden', 'true');
        node.style.setProperty('--pk-doodle-art', `url("${url(ART[kind])}")`);
        return node;
    }

    /** Wipes [node] in: across (left to right, or right to left in RTL) or around (clockwise from 12). */
    function reveal(node, wipe, delay = 0) {
        if (!node.animate || reduced()) return;
        const rtl = root.document?.documentElement?.dir === 'rtl';
        try {
            if (wipe === 'around') {
                node.animate([{ '--pk-doodle-sweep': '0deg' }, { '--pk-doodle-sweep': '360deg' }],
                    { duration: DRAW_MS, delay, easing: ENTER, fill: 'backwards' });
            } else {
                node.animate([{ clipPath: rtl ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
                    { duration: DRAW_MS, delay, easing: ENTER, fill: 'backwards' });
            }
        } catch (e) {
        }
    }

    /** A crayon check (an element to place), drawn on after [delay] ms. */
    function check({ className = '', delay = 0 } = {}) {
        const node = mark('check', className);
        root.requestAnimationFrame?.(() => reveal(node, 'across', delay));
        return node;
    }

    function clear(target) {
        target?.querySelectorAll?.(':scope > .pk-doodle-mark--underline, :scope > .pk-doodle-mark--scribble').forEach(node => node.remove());
        target?.classList?.remove('pk-doodle-host');
    }

    /** A crayon underline under [target]'s text; stays until clear(). */
    function underline(target, { delay = 0 } = {}) {
        if (!target) return null;
        clear(target);
        const node = mark('underline');
        target.classList.add('pk-doodle-host');
        target.appendChild(node);
        reveal(node, 'across', delay);
        return node;
    }

    /** A scribble circle round [target]; stays until clear(). */
    function scribble(target, { delay = 0 } = {}) {
        if (!target) return null;
        clear(target);
        const node = mark('scribble');
        target.classList.add('pk-doodle-host');
        target.appendChild(node);
        reveal(node, 'around', delay);
        return node;
    }

    root.FilterTubeDoodles = Object.freeze({ DRAW_MS, ART, check, underline, scribble, clear });
})(typeof window !== 'undefined' ? window : globalThis);
