import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const batchPath = process.argv[2];
if (!batchPath) throw new Error('Usage: node scripts/merge-ui-locale-batch.mjs <batch.json>');
const batch = JSON.parse(fs.readFileSync(path.resolve(root, batchPath), 'utf8'));
const targets = JSON.parse(fs.readFileSync(path.join(root, 'data/ui_locales/targets.json'), 'utf8')).locales;
const expected = targets.map(item => item.code).sort();
const translated = expected.filter(locale => locale !== 'en');
if (JSON.stringify(Object.keys(batch.translations).sort()) !== JSON.stringify(translated)) {
    throw new Error('Translation batch must include every non-English target locale exactly once');
}
const keys = Object.keys(batch.english);
for (const locale of translated) {
    const values = batch.translations[locale];
    if (!Array.isArray(values) || values.length !== keys.length || values.some(value => typeof value !== 'string' || !value.trim())) {
        throw new Error(`${locale}: missing or empty batch translation`);
    }
}
for (const locale of expected) {
    const file = path.join(root, 'data/ui_locales', `${locale}.json`);
    const catalog = JSON.parse(fs.readFileSync(file, 'utf8'));
    keys.forEach((key, index) => {
        const value = locale === 'en' ? batch.english[key] : batch.translations[locale][index];
        if (catalog[key] !== undefined && catalog[key] !== value) throw new Error(`${locale}: conflicting ${key}`);
        catalog[key] = value;
    });
    fs.writeFileSync(file, `${JSON.stringify(catalog, null, 2)}\n`);
}
process.stdout.write(`Merged ${keys.length} English keys and translations into ${expected.length} locale catalogs.\n`);
