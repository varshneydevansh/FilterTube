import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function declarations(file, selector) {
  const css = fs.readFileSync(file, 'utf8');
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]+)\\}`));
  assert.ok(block, `${file}: ${selector}`);
  return block[1];
}

test('shared category labels and selection marks follow the selected reading direction', () => {
  for (const file of ['css/popup.css', 'css/tab-view.css']) {
    assert.match(declarations(file, '.ft-category-pill'), /text-align:\s*start;/);
    const mark = declarations(file, '.ft-category-selection-mark');
    assert.match(mark, /margin-inline-start:\s*2px;/);
    assert.doesNotMatch(mark, /margin-left:/);
  }
});

test('collaboration accents and rule-editor indents mirror without a separate RTL copy', () => {
  for (const [file, selector] of [
    ['css/popup.css', '.keyword-item.collaboration-member'],
    ['css/tab-view.css', '.channel-item.collaboration-entry']
  ]) {
    const block = declarations(file, selector);
    assert.match(block, /border-inline-start:\s*4px solid/);
    assert.match(block, /padding-inline-start:/);
    assert.doesNotMatch(block, /border-left:|padding-left:/);
  }
  assert.match(declarations('css/tab-view.css', '.channel-body-row'), /padding-inline-start:\s*3\.25rem;/);
  const css = fs.readFileSync('css/tab-view.css', 'utf8');
  assert.match(css, /\.video-filter-compact-fields\s*\{[^}]*margin-inline-start:\s*0;/);
});
