// DoodleKit's passing moments, ported from the app (DoodleKit.heartPop and DoodleKit.sparkle) and
// placed where the app plays them: the onboarding commit and the Support variants' crayon touch.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function load({ reducedMotion = false } = {}) {
    const added = [];
    const make = tag => ({
        tag, className: '', style: {}, attributes: {}, src: '', alt: '', removed: false, animations: [],
        setAttribute(key, value) { this.attributes[key] = value; },
        style: {},
        remove() { this.removed = true; },
        animate(frames, options) { const animation = { frames, options, onfinish: null }; this.animations.push(animation); return animation; }
    });
    const body = { appendChild(node) { added.push(node); return node; } };
    const window = {
        document: { createElement: make, body, documentElement: {} },
        matchMedia: () => ({ matches: reducedMotion }),
        requestAnimationFrame: fn => fn()
    };
    window.window = window;
    vm.runInNewContext(fs.readFileSync('js/doodles.js', 'utf8'), { window, globalThis: window });
    const anchor = { getBoundingClientRect: () => ({ left: 100, top: 50, width: 40, height: 20 }) };
    return { Doodles: window.FilterTubeDoodles, added, anchor };
}

test('heartPop: one heart over the anchor\'s centre, popping then leaving, then removed', () => {
    const { Doodles, added, anchor } = load();
    const heart = Doodles.heartPop(anchor);
    assert.equal(added.length, 1);
    assert.match(heart.src, /doodles\/heart\.webp$/);
    assert.equal(heart.style.left, `${120 - 15}px`, '30 px wide, centred');
    assert.equal(heart.style.top, `${60 - 15}px`);
    assert.equal(heart.attributes['aria-hidden'], 'true');
    heart.animations[0].onfinish();
    heart.animations[1].onfinish();
    assert.equal(heart.removed, true);
});

test('sparkle: 3 to 5 stars and sparkles burst out and are removed', () => {
    const { Doodles, added, anchor } = load();
    assert.equal(Doodles.sparkle(anchor, 3).length, 3);
    assert.equal(Doodles.sparkle(anchor, 9).length, 5);
    assert.equal(Doodles.sparkle(anchor, 1).length, 3);
    assert.deepEqual(added.slice(0, 3).map(node => /star\.webp$/.test(node.src) ? 'star' : 'sparkle'), ['star', 'sparkle', 'star']);
    added[0].animations[0].onfinish();
    assert.equal(added[0].removed, true);
});

test('with reduced motion the heart and sparkle simply don\'t happen (DoodleKit.plan)', () => {
    const { Doodles, added, anchor } = load({ reducedMotion: true });
    assert.equal(Doodles.heartPop(anchor), null);
    assert.equal(Doodles.sparkle(anchor).length, 0);
    assert.equal(added.length, 0);
});

test('placed where the app plays them: the onboarding commit and the Support touches', () => {
    const mascots = fs.readFileSync('js/mascots.js', 'utf8');
    assert.match(mascots, /root\.FilterTubeDoodles\?\.sparkle\?\.\(next\);\n\s+close\(\);/);
    assert.match(mascots, /id: 'classic'[^\n]*touch: 'heartOnPick'/);
    assert.match(mascots, /id: 'morning'[^\n]*touch: 'sparkleLogo'/);
    assert.match(mascots, /id: 'sieve'[^\n]*touch: 'underlineTitle'/);
    assert.match(mascots, /playSupportTouch\(doc, variant, blocks\[0\]\)/);
});
