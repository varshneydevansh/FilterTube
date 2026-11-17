import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Chrome injects a given content-script file once per frame, even across worlds: a file listed in a
// MAIN entry and again in an ISOLATED entry for the same pages runs in only one of them (verified on
// the live site through the DevTools protocol: the isolated world had no FilterTubeSearchSuggestions).
// So no file may sit in both worlds for overlapping pages.
//
// Known: js/shared/view_count.js is in both and, live, FilterTubeViewCount is missing from the isolated
// world. It predates this check and is tracked separately; nothing new may join it.
const KNOWN_BOTH_WORLDS = new Set(['js/shared/view_count.js']);

const MANIFESTS = ['manifest.json', 'manifest.chrome.json', 'manifest.opera.json', 'manifest.firefox.json'];

function overlaps(a, b) {
    return (a.matches || []).some(pattern => (b.matches || []).includes(pattern));
}

test('no content script is listed in both the main and the isolated world for the same pages', () => {
    for (const name of MANIFESTS) {
        const entries = JSON.parse(fs.readFileSync(new URL(`../../${name}`, import.meta.url), 'utf8')).content_scripts;
        const main = entries.filter(entry => entry.world === 'MAIN');
        const isolated = entries.filter(entry => entry.world !== 'MAIN');
        for (const first of main) {
            for (const second of isolated) {
                if (!overlaps(first, second)) continue;
                const both = first.js.filter(file => second.js.includes(file) && !KNOWN_BOTH_WORLDS.has(file));
                assert.deepEqual(both, [], `${name}: ${both.join(', ')} in both worlds for ${first.matches.join(' ')}`);
            }
        }
    }
});
