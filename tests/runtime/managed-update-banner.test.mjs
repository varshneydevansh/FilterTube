import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Banner = require('../../js/content/managed_update_banner.js');
const now = 1_700_000_000_000;
const notice = extra => ({ schema: 'filtertube_managed_update_notice', version: 1, id: 'Child:1', createdAt: now - 1000, expiresAt: now + 60000, ...extra });

test('the banner shows a fresh notice once and ignores stale, seen or malformed ones', () => {
    assert.equal(Banner.readableNotice(notice({ activeChanged: true }), now).activeChanged, true);
    assert.equal(Banner.readableNotice(notice({ seen: true }), now), null);
    assert.equal(Banner.readableNotice(notice({ createdAt: now - 3 * 60 * 1000 }), now), null, 'older than 2 minutes');
    assert.equal(Banner.readableNotice({ ...notice(), schema: 'x' }, now), null);
    assert.equal(Banner.readableNotice('nope', now), null);
});

test('active profile: "Parent sent an update"; another profile: "Rules updated for {profile}"', () => {
    const active = Banner.readableNotice(notice({ activeChanged: true }), now);
    assert.equal(Banner.bannerText(active).title, 'Parent sent an update');
    const other = Banner.readableNotice(notice({ activeChanged: false, profileName: 'Mia' }), now);
    assert.equal(Banner.bannerText(other).title, 'Rules updated for Mia');
    const hi = JSON.parse(fs.readFileSync(new URL('../../data/ui_locales/hi.json', import.meta.url), 'utf8'));
    assert.notEqual(Banner.bannerText(active, hi).title, 'Parent sent an update', 'translated from ui_locales');
    assert.ok(Banner.bannerText(other, hi).title.includes('Mia'));
});

test('the banner and courier frame need no new permission', () => {
    for (const file of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
        const manifest = JSON.parse(fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8'));
        assert.deepEqual(manifest.permissions, ['storage', 'unlimitedStorage', 'activeTab', 'scripting', 'tabs', 'downloads', 'alarms'], file);
        assert.ok(manifest.content_scripts.some(entry => entry.js.includes('js/content/managed_update_banner.js')), file);
    }
});
