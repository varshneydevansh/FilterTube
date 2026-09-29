import fs from 'node:fs';
import path from 'node:path';

const [sourcePath, ...translationPaths] = process.argv.slice(2);
if (!sourcePath || !translationPaths.length) {
  throw new Error('Usage: node scripts/merge-ui-locale-drafts.mjs <english-map.json> <translations-1.json> [...]');
}

const root = process.cwd();
const read = file => JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8'));
const source = read(sourcePath);
const english = source.english || source;
const keys = Object.keys(english);
const targets = read('data/ui_locales/targets.json').locales.map(item => item.code);
const expected = targets.filter(locale => locale !== 'en');
const translations = {};
const placeholders = value => [...String(value).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
  .map(match => match[1]).sort().join(',');

for (const file of translationPaths) {
  const batch = read(file);
  if (JSON.stringify(batch.keys) !== JSON.stringify(keys)) {
    throw new Error(`${file}: key order differs from English source`);
  }
  for (const [locale, values] of Object.entries(batch.translations || {})) {
    if (!expected.includes(locale) || translations[locale]) throw new Error(`${file}: unexpected or duplicate locale ${locale}`);
    if (!Array.isArray(values) || values.length !== keys.length) throw new Error(`${file}: ${locale} length mismatch`);
    values.forEach((value, index) => {
      if (typeof value !== 'string' || !value.trim()) throw new Error(`${file}: ${locale} missing ${keys[index]}`);
      if (placeholders(value) !== placeholders(english[keys[index]])) {
        throw new Error(`${file}: ${locale} placeholder mismatch at ${keys[index]}`);
      }
    });
    translations[locale] = values;
  }
}
const missing = expected.filter(locale => !translations[locale]);
if (missing.length) throw new Error(`Missing locale translations: ${missing.join(', ')}`);

const writes = [];
for (const locale of targets) {
  const file = path.join(root, 'data/ui_locales', `${locale}.json`);
  const catalog = JSON.parse(fs.readFileSync(file, 'utf8'));
  keys.forEach((key, index) => {
    const value = locale === 'en' ? english[key] : translations[locale][index];
    if (catalog[key] !== undefined && catalog[key] !== value) throw new Error(`${locale}: conflicting ${key}`);
    catalog[key] = value;
  });
  writes.push([file, `${JSON.stringify(catalog, null, 2)}\n`]);
}
for (const [file, body] of writes) fs.writeFileSync(file, body);
process.stdout.write(`Merged ${keys.length} keys into ${targets.length} locale catalogs.\n`);
