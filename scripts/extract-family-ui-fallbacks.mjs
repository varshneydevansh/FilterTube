import fs from 'node:fs';

const sources = ['js/managed_parent_command_center.js', 'js/tab-view.js'];
const english = JSON.parse(fs.readFileSync('data/ui_locales/en.json', 'utf8'));
const core = JSON.parse(fs.readFileSync('data/ui_locales/batches/family-control.json', 'utf8'));
const calls = /(?:familyUiText|tabViewUiText)\(\s*'(family\.[^']+)'\s*,\s*'((?:\\.|[^'\\])*)'/g;
const missing = new Map();

for (const filename of sources) {
  const source = fs.readFileSync(filename, 'utf8');
  for (const match of source.matchAll(calls)) {
    const [, key, fallback] = match;
    if (Object.hasOwn(core, key)) {
      if (english[key] !== fallback) throw new Error(`${filename}: English fallback drift for ${key}`);
      continue;
    }
    if (Object.hasOwn(english, key) && english[key] !== fallback) throw new Error(`${filename}: English fallback drift for ${key}`);
    if (missing.has(key) && missing.get(key) !== fallback) throw new Error(`${filename}: conflicting ${key}`);
    missing.set(key, fallback);
  }
}

// This fallback interpolates runtime data before lookup; its catalog form uses
// the existing {ack} value passed by the call site.
if (!Object.hasOwn(core, 'family.commandCenter.status.acknowledgementLabel')) {
  missing.set('family.commandCenter.status.acknowledgementLabel', 'Ack: {ack}');
}

const output = Object.fromEntries([...missing].sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync('data/ui_locales/batches/family-control-deferred.json', `${JSON.stringify(output, null, 2)}\n`);
process.stdout.write(`Extracted ${missing.size} family UI fallbacks outside the core batch.\n`);
