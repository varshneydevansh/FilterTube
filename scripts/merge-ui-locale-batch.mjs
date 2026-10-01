import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const batchPath = process.argv[2];
if (!batchPath) throw new Error('Usage: node scripts/merge-ui-locale-batch.mjs <batch.json>');
const batch = JSON.parse(fs.readFileSync(path.resolve(root, batchPath), 'utf8'));
// Independently owned locale drafts can be validated and merged without
// copying their translations into another large intermediate artifact.
batch.translations ||= {};
for (const draftPath of process.argv.slice(3)) {
    const draft = JSON.parse(fs.readFileSync(path.resolve(root, draftPath), 'utf8'));
    if (JSON.stringify(draft.keys) !== JSON.stringify(Object.keys(batch.english))) {
        throw new Error(`${draftPath}: key order differs from English source`);
    }
    for (const [locale, values] of Object.entries(draft.translations || {})) {
        if (Object.hasOwn(batch.translations, locale)) throw new Error(`${draftPath}: duplicate locale ${locale}`);
        batch.translations[locale] = values;
    }
}
const targets = JSON.parse(fs.readFileSync(path.join(root, 'data/ui_locales/targets.json'), 'utf8')).locales;
const expected = targets.map(item => item.code).sort();
const translated = expected.filter(locale => locale !== 'en');
if (JSON.stringify(Object.keys(batch.translations).sort()) !== JSON.stringify(translated)) {
    throw new Error('Translation batch must include every non-English target locale exactly once');
}
const keys = Object.keys(batch.english);
for (const [key, terms] of Object.entries(batch.protectedLiterals || {})) {
    if (!Object.hasOwn(batch.english, key) || !Array.isArray(terms) || terms.some(term => typeof term !== 'string' || !term || !batch.english[key].includes(term))) {
        throw new Error(`Invalid protected literals for ${key}`);
    }
}
const placeholders = value => [...value.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(match => match[1]).sort().join(',');
for (const locale of translated) {
    const values = batch.translations[locale];
    if (!Array.isArray(values) || values.length !== keys.length || values.some(value => typeof value !== 'string' || !value.trim())) {
        throw new Error(`${locale}: missing or empty batch translation`);
    }
    keys.forEach((key, index) => {
        if (placeholders(values[index]) !== placeholders(batch.english[key])) throw new Error(`${locale}: changed placeholders for ${key}`);
        for (const term of ['FilterTube', 'YouTube', 'Advert Void', 'Home Bridge', 'Home Pickup', 'Internet Pickup']) {
            if (batch.english[key].includes(term) && !values[index].includes(term)) throw new Error(`${locale}: changed protected term ${term} for ${key}`);
        }
        for (const term of batch.protectedLiterals?.[key] || []) {
            if (!values[index].includes(term)) throw new Error(`${locale}: changed protected literal ${term} for ${key}`);
        }
    });
}
const prepared = [];
for (const locale of expected) {
    const file = path.join(root, 'data/ui_locales', `${locale}.json`);
    const catalog = JSON.parse(fs.readFileSync(file, 'utf8'));
    keys.forEach((key, index) => {
        const value = locale === 'en' ? batch.english[key] : batch.translations[locale][index];
        if (catalog[key] !== undefined && catalog[key] !== value) throw new Error(`${locale}: conflicting ${key}`);
        catalog[key] = value;
    });
    prepared.push([file, `${JSON.stringify(catalog, null, 2)}\n`]);
}
// Validate every catalog conflict before changing even the English catalog.
for (const [file, contents] of prepared) fs.writeFileSync(file, contents);
process.stdout.write(`Merged ${keys.length} English keys and translations into ${expected.length} locale catalogs.\n`);
