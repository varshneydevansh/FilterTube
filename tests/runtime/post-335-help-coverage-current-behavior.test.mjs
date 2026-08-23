import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const help = fs.readFileSync(path.join(root, 'html/tab-view.html'), 'utf8');
const helpStyles = fs.readFileSync(path.join(root, 'css/serene-shell.css'), 'utf8');

test('Help has one discoverable version-neutral feature overview', () => {
  assert.match(help, /FilterTube Feature Guide/);
  assert.doesNotMatch(help, /New After FilterTube 3\.3\.5/);
  assert.doesNotMatch(help, /These features are part of the next extension release/);
  assert.match(help, /Self-Control Sessions and time limits for every profile/);
  assert.match(help, /Blocked and Always allowed rule collections/);
  assert.match(help, /Direct-access and description checks/);
  assert.match(help, /Safer complete BlockTube migration/);
  assert.match(help, /Official category filtering/);
  assert.match(help, /Current Watch, Mix, comments, and YouTube layouts/);
});

test('Help documents the user-facing safety and performance boundaries', () => {
  assert.match(help, /no FilterTube cancel button/);
  assert.match(help, /browser owner can still disable or uninstall/i);
  assert.match(help, /applied as a transaction/);
  assert.match(help, /Imported JavaScript stays inactive/);
  assert.match(help, /ordinary YouTube links on Google Search or other websites/);
  assert.match(help, /small bounded batches/);
  assert.match(help, /comments, navigation chips, or Mix queue rows/);
});

test('Help uses a high-contrast responsive reading surface', () => {
  assert.match(helpStyles, /#helpView \.help-list \{[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(helpStyles, /@media \(min-width: 768px\) \{[\s\S]*#helpView \.help-list/);
  assert.match(helpStyles, /#helpView \.help-item-body[\s\S]*font-size: 1rem;[\s\S]*line-height: 1\.65/);
  assert.match(helpStyles, /#helpView \.help-item-body \{[\s\S]*background: transparent/);
  assert.match(helpStyles, /#helpView \.help-toolbar-card \.search-input::placeholder[\s\S]*opacity: 1/);
  assert.match(helpStyles, /html\[data-theme="dark"\][\s\S]*#helpView \.help-item/);
});

test('Dark tab-view surfaces do not inherit whitewashed light controls', () => {
  assert.match(helpStyles, /data-theme="dark"[\s\S]*\.sidebar \.brand-name[\s\S]*color: #1b1a18/);
  assert.match(helpStyles, /data-theme="dark"[\s\S]*\.dashboard-structure-note[\s\S]*color: #f4ddd7/);
  assert.match(helpStyles, /data-theme="dark"[\s\S]*\.dashboard-stats-source[\s\S]*background: #111923/);
  assert.match(helpStyles, /data-theme="dark"[\s\S]*\.btn-secondary \{[\s\S]*background: #1b2531[\s\S]*color: #eef3f8/);
  assert.match(helpStyles, /data-theme="dark"[\s\S]*\.btn-secondary:disabled[\s\S]*color: #aeb8c5/);
  assert.match(helpStyles, /#helpView \.help-family-devices-steps article[\s\S]*background: #111923/);
  assert.match(helpStyles, /data-theme="dark"[\s\S]*\.ft-about-action,[\s\S]*background: #17212c[\s\S]*color: #f3f6fa/);
});
