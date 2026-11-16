/* DoodleKit for the extension's own pages (the app's DoodleKit.kt, docs/app/design-system/DOODLES.md).
 * Nothing is drawn by code: each mark reveals one of the owner's real aKriti doodles, tinted brick
 * (or an area ink) through a CSS mask.
 * - check(): a crayon check wipes on along its stroke over DRAW (260 ms, the enter curve).
 * - underline(text): a crayon swoosh wipes in under a line of text.
 * - scribble(node): a scribble circle draws round an item, clockwise from twelve o'clock.
 * - clear(node): takes a mark away again.
 * - heartPop(anchor): a heart pops over the anchor's centre, holds a beat and leaves.
 * - sparkle(anchor, count): 3 to 5 tiny stars burst about 24 px from the anchor's centre and fade.
 * The check, underline and circle mark state, so they stay. With reduced motion they simply appear.
 * The heart and sparkle are decoration (DoodleKit.plan: HEART and SPARKLE are not persistent): with
 * reduced motion, or no Web Animations, they simply don't happen.
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
        scribble: 'assets/images/doodles/scribble_circle.webp',
        heart: 'assets/images/doodles/heart.webp',
        star: 'assets/images/doodles/star.webp',
        sparkle: 'assets/images/doodles/sparkle.webp'
    });
    // DoodleKit sizes (dp, read as CSS px).
    const HEART_PX = 30;
    const SPARK_MIN_PX = 9;
    const SPARK_MAX_PX = 14;
    const BURST_PX = 24;
    // NativeMotion: SHORT hold, EXIT 200 ms, MEDIUM 300 ms; springHeart overshoots a little.
    const HOLD_MS = 150;
    const EXIT_MS = 200;
    const MEDIUM_MS = 300;
    const EXIT = 'cubic-bezier(0.3, 0, 1, 1)';
    const SPRING_POP = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

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

    /** A moment that passes: a fixed sprite over the anchor's centre, removed when it ends. */
    function sprite(kind, size, cx, cy) {
        const node = root.document.createElement('img');
        node.className = `pk-doodle-moment pk-doodle-moment--${kind}`;
        node.setAttribute('aria-hidden', 'true');
        node.alt = '';
        node.src = url(ART[kind]);
        Object.assign(node.style, {
            position: 'fixed', left: `${cx - size / 2}px`, top: `${cy - size / 2}px`, width: `${size}px`, height: 'auto',
            pointerEvents: 'none', zIndex: '2147483000', opacity: '0', transform: 'scale(0.6)'
        });
        (root.document.body || root.document.documentElement).appendChild(node);
        return node;
    }

    function centre(anchor) {
        const rect = anchor?.getBoundingClientRect?.();
        if (!rect || (!rect.width && !rect.height)) return null;
        return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
    }

    /** DoodleKit.heartPop: a heart pops over [anchor]'s centre (springHeart), holds a beat and leaves. */
    function heartPop(anchor) {
        if (reduced() || !root.document?.createElement) return null;
        const at = centre(anchor);
        if (!at) return null;
        const heart = sprite('heart', HEART_PX, at.cx, at.cy);
        if (!heart.animate) { heart.remove(); return null; }
        const pop = heart.animate([{ opacity: 1, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }],
            { duration: MEDIUM_MS, easing: SPRING_POP, fill: 'forwards' });
        pop.onfinish = () => {
            const leave = heart.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1)' }],
                { duration: EXIT_MS, delay: HOLD_MS, easing: EXIT, fill: 'forwards' });
            leave.onfinish = () => heart.remove();
        };
        return heart;
    }

    /** DoodleKit.sparkle: 3 to 5 tiny stars burst out about 24 px from [anchor]'s centre and fade. */
    function sparkle(anchor, count = 4) {
        if (reduced() || !root.document?.createElement) return [];
        const at = centre(anchor);
        if (!at) return [];
        const n = Math.max(3, Math.min(5, Math.round(count)));
        // Not a metronome: each star gets its own angle offset, size and reach (DoodleKit).
        const angleJitter = [-8, 11, -4, 7, -12];
        const reachScale = [1, 0.82, 1.1, 0.9, 1.04];
        const stars = [];
        for (let i = 0; i < n; i += 1) {
            const size = SPARK_MAX_PX - (SPARK_MAX_PX - SPARK_MIN_PX) * (i % 3) / 2;
            const star = sprite(i % 2 === 0 ? 'star' : 'sparkle', size, at.cx, at.cy);
            if (!star.animate) { star.remove(); continue; }
            const angle = (-90 + i * 360 / n + angleJitter[i]) * Math.PI / 180;
            const dx = Math.cos(angle) * BURST_PX * reachScale[i];
            const dy = Math.sin(angle) * BURST_PX * reachScale[i];
            const burst = star.animate([
                { opacity: 0, transform: 'translate(0, 0) scale(0.6)' },
                { opacity: 1, transform: `translate(${dx * 0.15}px, ${dy * 0.15}px) scale(0.72)`, offset: 0.15 },
                { opacity: 1, transform: `translate(${dx * 0.45}px, ${dy * 0.45}px) scale(1)`, offset: 0.45 },
                { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(0.6)` }
            ], { duration: MEDIUM_MS, easing: ENTER, fill: 'forwards' });
            burst.onfinish = () => star.remove();
            stars.push(star);
        }
        return stars;
    }

    root.FilterTubeDoodles = Object.freeze({ DRAW_MS, ART, check, underline, scribble, clear, heartPop, sparkle });
})(typeof window !== 'undefined' ? window : globalThis);
