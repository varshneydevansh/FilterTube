import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import test from 'node:test';

test('UI copy audit recognizes the wired packaged dashboard inventory, not user data', () => {
  const output = execFileSync('python3', ['scripts/audit-ui-copy.py'], { encoding: 'utf8' });
  const covered = output.match(/(\d+) exact packaged fragments covered by early static capture/);
  assert.ok(covered && Number(covered[1]) > 0);
  assert.match(output, /html\/tab-view\.html: 0 candidate unkeyed fragments/);
  assert.match(output, /55 explicit help tooltips covered by catalog-backed display lookup/);
  assert.match(output, /JS counts are a lower-bound heuristic/);
  const candidates = JSON.parse(execFileSync('python3', ['scripts/audit-ui-copy.py', '--json'], { encoding: 'utf8' }));
  assert.ok(candidates.some(item => item.kind === 'js-literal'), 'dynamic candidates remain visible');
  assert.ok(candidates.every(item => item.file !== 'html/tab-view.html'));
});

test('static audit subtraction requires exact English copy and capture before the controller', () => {
  const source = fs.readFileSync('scripts/audit-ui-copy.py', 'utf8');
  assert.ok(source.includes('if 0 <= capture < controller:'));
  assert.ok(source.includes('entry["kind"] != "data-filtertube-help" and entry["text"] in static_copy'));
  assert.ok(!source.includes('entry["text"] in static_copy.values()'), 'source keys, not translated values, determine coverage');
  const output = execFileSync('python3', ['-c', `import runpy
module = runpy.run_path('scripts/audit-ui-copy.py')
parser = module['CopyInventory']('fixture.html')
parser.feed('<main><p>New uncovered message</p><p data-ft-i18n="known">Keyed text</p><input title="New title" data-filtertube-help="New unkeyed help"></main>')
import json
print(json.dumps(parser.entries))`], { encoding: 'utf8' });
  assert.deepEqual(JSON.parse(output).map(item => item.text), ['New uncovered message', 'New title', 'New unkeyed help']);
});
