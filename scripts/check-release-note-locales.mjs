import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = process.argv.includes('--require-all');
const targetLocales = JSON.parse(fs.readFileSync(path.join(root, 'data/ui_locales/targets.json'), 'utf8'))
  .locales.map(item => item.code).filter(code => code !== 'en');
const source = JSON.parse(fs.readFileSync(path.join(root, 'data/release_notes.json'), 'utf8'))
  .filter(note => /^\d+\.\d+\.\d+$/.test(note?.version || ''));
const urls = value => [...String(value).matchAll(/https?:\/\/[^\s)]+/g)].map(match => match[0]);
let incomplete = false;

for (const locale of targetLocales) {
  const file = path.join(root, 'data/ui_locales', `release_notes.${locale}.json`);
  const translated = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  let complete = 0;
  for (const note of source) {
    const entry = translated[note.version];
    const fieldsValid = ['headline', 'summary'].every(field =>
      typeof entry?.[field] === 'string' && entry[field].trim()
      && entry[field].trim() !== note[field].trim());
    const highlightsValid = Array.isArray(entry?.highlights)
      && entry.highlights.length === (note.highlights || []).length
      && entry.highlights.every((item, index) => typeof item === 'string' && item.trim()
        && item.trim() !== note.highlights[index].trim()
        && JSON.stringify(urls(item)) === JSON.stringify(urls(note.highlights[index])));
    if (fieldsValid && highlightsValid) complete += 1;
  }
  if (complete !== source.length) incomplete = true;
  process.stdout.write(`${locale}: ${complete}/${source.length} release entries translated\n`);
}

if (required && incomplete) {
  process.stderr.write('Historical release-note translations are incomplete.\n');
  process.exitCode = 1;
}
