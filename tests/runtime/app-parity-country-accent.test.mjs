// Android CountryAccentTest (Ports Android 0c08ba48b): Study's light country accent. Marks clear 3:1
// on paper, the page and the washed card; ink, muted text and brick keep 4.5:1 on the wash; a flag red
// never becomes the mark; countries without an entry keep Study's sage.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Packs = require('../../js/shared/study_packs.js');

// BrandPalette.Tones (light, night).
const TONES = {
    false: { paper: 0xFFFCF6, canvas: 0xF6F2EB, ink: 0x1B1A18, muted: 0x625F58, brick: 0xA93E31, sageMark: 0x3E7D5B },
    true: { paper: 0x151C24, canvas: 0x0F141B, ink: 0xEDF2F7, muted: 0xB8C3CE, brick: 0xE0796B, sageMark: 0x7FB89A },
};
const MIN_TEXT = 4.5;
const MIN_ICON = 3.0;

function luminance(color) {
    const channel = shift => {
        const c = ((color >> shift) & 0xFF) / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0);
}
const contrast = (a, b) => { const la = luminance(a); const lb = luminance(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
const all = [...Packs.ACCENT_CODES.map(Packs.countryAccent), Packs.DEFAULT_ACCENT];
const check = (name, fg, bg, min) => assert.ok(contrast(fg, bg) >= min, `${name} is ${contrast(fg, bg).toFixed(2)}:1, needs ${min}:1`);

test('every stripe and mark clears 3:1 on paper, the page and the washed card', () => {
    for (const night of [false, true]) {
        const t = TONES[night];
        for (const accent of all) {
            const name = `${accent.code || 'default'} ${night ? 'dark' : 'light'}`;
            for (const color of [...accent.stripes(night), accent.mark(night)]) {
                check(`${name} mark on paper`, color, t.paper, MIN_ICON);
                check(`${name} mark on page`, color, t.canvas, MIN_ICON);
                check(`${name} mark on the card`, color, accent.wash(night), MIN_ICON);
            }
        }
    }
});

test('text on the washed card keeps 4.5:1', () => {
    for (const night of [false, true]) {
        const t = TONES[night];
        for (const accent of all) {
            const wash = accent.wash(night);
            check(`${accent.code} ink`, t.ink, wash, MIN_TEXT);
            check(`${accent.code} muted`, t.muted, wash, MIN_TEXT);
            check(`${accent.code} brick`, t.brick, wash, MIN_TEXT);
        }
    }
});

test('the mark is never red, so brick stays the only action colour', () => {
    for (const accent of all) {
        const mark = accent.stripeCrayons.find(item => !item.red);
        if (!mark) assert.equal(accent.mark(false), Packs.DEFAULT_ACCENT.mark(false));
        else assert.equal(accent.mark(false), mark.light);
        assert.notEqual(accent.mark(false), TONES.false.brick);
    }
});

test('countries without an entry fall back to sage and plain paper', () => {
    assert.equal(Packs.countryAccent(null).mark(false), TONES.false.sageMark);
    assert.equal(Packs.countryAccent('ZZ').mark(false), TONES.false.sageMark);
    assert.equal(Packs.countryAccent('ZZ').mark(true), TONES.true.sageMark);
    assert.ok(Packs.countryAccent('zz').isDefault);
    assert.equal(Packs.DEFAULT_ACCENT.wash(false), TONES.false.paper);
    assert.equal(Packs.DEFAULT_ACCENT.motif, null);
});

test("the owner's countries have accents of one to three colours, and a 6 % wash", () => {
    for (const code of ['PK', 'BD', 'NP', 'LK', 'ID', 'PH', 'NG', 'KE', 'EG', 'SA', 'AE', 'TR', 'BR', 'MX', 'ES', 'DE', 'FR', 'GB',
        'US', 'JP', 'KR', 'VN', 'TH', 'IN']) {
        const accent = Packs.countryAccent(code.toLowerCase());
        assert.equal(accent.code, code);
        assert.ok(accent.stripes(false).length >= 1 && accent.stripes(false).length <= 3, code);
    }
    // Motifs are doodles from the library, never a character.
    for (const accent of all) if (accent.motif) assert.ok(fs.existsSync(`assets/images/doodles/${accent.motif}.webp`), accent.motif);
    // 6 % of the way from paper to the mark (India's mark is saffron, its first non-red colour).
    assert.equal(Packs.cssColor(Packs.countryAccent('IN').wash(false)), '#f9f2e8');
    assert.equal(Packs.blendColor(0x000000, 0xFFFFFF, 0.06), 0x0F0F0F);
});

test("the pack picker's row wears the stripe, the motif and the wash, hidden from assistive technology", () => {
    const make = tag => ({
        tag, className: '', children: [], attributes: {}, dataset: {}, props: {}, classes: new Set(),
        style: { setProperty(key, value) { this.owner.props[key] = value; } },
        classList: { add(...names) { names.forEach(n => this.owner.classes.add(n)); } },
        setAttribute(key, value) { this.attributes[key] = value; },
        appendChild(child) { this.children.push(child); return child; },
        prepend(child) { this.children.unshift(child); },
        addEventListener() {}
    });
    const node = tag => { const n = make(tag); n.style.owner = n; n.classList.owner = n; return n; };
    const context = {
        document: { createElement: node, createElementNS: (_ns, tag) => node(tag), readyState: 'complete', getElementById: () => null },
        navigator: { language: 'pt-BR' }, setTimeout: () => 0, clearTimeout: () => {}, Date, Math, JSON, Promise, Intl, Number, String, Array, Object,
        chrome: { runtime: { lastError: null, getURL: path => `ext://${path}`, sendMessage(_m, cb) { cb?.({}); } }, storage: { local: { get: (_k, cb) => cb({}) } } }
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('js/study_ui.js', 'utf8'), context);
    const row = node('div');
    context.FilterTubeStudyUi.applyCountryAccent(row, Packs.countryAccent('BR'), Packs);
    assert.ok(row.classes.has('ft-study-accent') && row.classes.has('is-country'));
    assert.equal(row.dataset.country, 'BR');
    assert.equal(row.props['--ft-accent-1-light'], '#2f6b45');
    assert.equal(row.props['--ft-accent-3-dark'], '#8db4ea');
    assert.equal(row.props['--ft-accent-wash-light'], Packs.cssColor(Packs.countryAccent('BR').wash(false)));
    const strip = row.children[0];
    assert.equal(strip.attributes['aria-hidden'], 'true');
    const svg = strip.children[0];
    assert.equal(svg.attributes.viewBox, '0 0 84 10');
    assert.equal(svg.children.length, 3);
    assert.equal(strip.children[1].src, 'ext://assets/images/doodles/star.webp');
    // A country without an entry: the sage stripe, plain paper, no motif.
    const plain = node('div');
    context.FilterTubeStudyUi.applyCountryAccent(plain, Packs.countryAccent('ZZ'), Packs);
    assert.ok(!plain.classes.has('is-country'));
    assert.equal(plain.children[0].children.length, 1);
    assert.equal(plain.children[0].children[0].children.map(p => p.attributes.class).join(' '),
        'ft-study-accent__dash is-1 ft-study-accent__dash is-1 ft-study-accent__dash is-1');
});
