import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const directory = path.join(root, 'data/ui_locales');
const english = JSON.parse(fs.readFileSync(path.join(directory, 'en.json'), 'utf8'));
const sourceKeys = Object.keys(english).sort();
const targets = JSON.parse(fs.readFileSync(path.join(directory, 'targets.json'), 'utf8')).locales;
const protectedTerms = ['FilterTube', 'YouTube', 'Advert Void'];
const placeholders = value => [...String(value).matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)]
    .map(match => match[1]).sort().join(',');
const errors = [];
const requiredLocales = new Set(['en']);
for (const value of process.argv.slice(2)) {
    if (value.startsWith('--require-locale=')) requiredLocales.add(value.slice('--require-locale='.length));
}
if (process.argv.includes('--require-all-static')) {
    for (const target of targets) requiredLocales.add(target.code);
}
const catalogNames = fs.readdirSync(directory).filter(value => /^[a-z]{2,3}(?:-[A-Za-z0-9]+)*\.json$/.test(value));

if (targets.length !== 38 || new Set(targets.map(entry => entry.code)).size !== 38) {
    errors.push('Expected 38 unique target locales');
}
for (const target of targets) {
    if (Intl.getCanonicalLocales(target.code)[0] !== target.code) errors.push(`Invalid target locale: ${target.code}`);
}

for (const name of catalogNames) {
    const catalog = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
    const locale = name.slice(0, -5);
    const keys = Object.keys(catalog).sort();
    if (requiredLocales.has(locale)) {
        for (const key of sourceKeys.filter(value => !Object.hasOwn(catalog, value))) errors.push(`${locale}: missing ${key}`);
    }
    for (const key of keys.filter(value => !Object.hasOwn(english, value))) errors.push(`${locale}: extra ${key}`);
    for (const key of sourceKeys.filter(value => Object.hasOwn(catalog, value))) {
        const value = catalog[key];
        if (typeof value !== 'string' || !value.trim()) {
            errors.push(`${locale}: empty or non-text ${key}`);
            continue;
        }
        if (placeholders(value) !== placeholders(english[key])) errors.push(`${locale}: changed placeholders in ${key}`);
        if (/<[^>]+>/.test(value)) errors.push(`${locale}: markup in ${key}`);
        for (const term of protectedTerms) {
            if (english[key].includes(term) && !value.includes(term)) errors.push(`${locale}: changed protected term ${term} in ${key}`);
        }
    }
    process.stdout.write(`${locale}: ${keys.length}/${sourceKeys.length} catalog keys checked\n`);
}
for (const locale of requiredLocales) {
    if (!catalogNames.includes(`${locale}.json`)) errors.push(`${locale}: required catalog missing`);
}

const missingCatalogs = targets.map(entry => entry.code).filter(code => !catalogNames.includes(`${code}.json`));
process.stdout.write(`${catalogNames.length}/${targets.length} target locales have catalog seeds; ${missingCatalogs.length} have none\n`);
if (process.argv.includes('--require-all') && missingCatalogs.length) {
    errors.push(`Incomplete target catalogs: ${missingCatalogs.join(', ')}`);
}

const staticSourceFile = path.join(directory, 'en_static.json');
if (fs.existsSync(staticSourceFile)) {
    const staticSource = JSON.parse(fs.readFileSync(staticSourceFile, 'utf8'));
    const staticKeys = Object.keys(staticSource);
    const staticCatalogNames = fs.readdirSync(directory).filter(value => /^[a-z]{2,3}(?:-[A-Za-z0-9]+)*_static\.json$/.test(value) && value !== 'en_static.json');
    for (const locale of requiredLocales) {
        if (locale !== 'en' && !staticCatalogNames.includes(`${locale}_static.json`)) {
            errors.push(`${locale}: required static catalog missing`);
        }
    }
    for (const name of staticCatalogNames) {
        const locale = name.slice(0, -'_static.json'.length);
        const translated = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
        for (const [source, value] of Object.entries(translated)) {
            if (!Object.hasOwn(staticSource, source)) errors.push(`${locale}: unknown static source ${source}`);
            if (typeof value !== 'string' || !value.trim()) errors.push(`${locale}: empty static translation for ${source}`);
            if (/<[^>]+>/.test(value)) errors.push(`${locale}: markup in static translation for ${source}`);
            if (placeholders(value) !== placeholders(source)) errors.push(`${locale}: changed static placeholders in ${source}`);
            for (const term of protectedTerms) {
                if (source.includes(term) && !value.includes(term)) errors.push(`${locale}: changed protected term ${term} in static translation for ${source}`);
            }
        }
        if (requiredLocales.has(locale)) {
            for (const source of staticKeys.filter(value => !Object.hasOwn(translated, value))) {
                errors.push(`${locale}: missing static translation for ${source}`);
            }
        }
        process.stdout.write(`${locale}: ${Object.keys(translated).length}/${staticKeys.length} dashboard static fragments translated\n`);
    }
}

const batchDirectory = path.join(directory, 'batches');
if (fs.existsSync(batchDirectory)) {
    for (const name of fs.readdirSync(batchDirectory).filter(value => value.endsWith('.json'))) {
        const batch = JSON.parse(fs.readFileSync(path.join(batchDirectory, name), 'utf8'));
        const keys = Object.keys(batch.english || {});
        const expected = targets.map(entry => entry.code).filter(code => code !== 'en').sort();
        if (JSON.stringify(Object.keys(batch.translations || {}).sort()) !== JSON.stringify(expected)) {
            errors.push(`${name}: missing or extra target translations`);
        }
        for (const target of targets) {
            const catalogFile = path.join(directory, `${target.code}.json`);
            if (!fs.existsSync(catalogFile)) continue;
            const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
            const values = target.code === 'en' ? keys.map(key => batch.english[key]) : batch.translations?.[target.code];
            if (!Array.isArray(values) || values.length !== keys.length) {
                errors.push(`${name}: incomplete ${target.code} batch`);
                continue;
            }
            keys.forEach((key, index) => {
                if (catalog[key] !== values[index]) errors.push(`${name}: ${target.code} catalog differs for ${key}`);
            });
        }
        process.stdout.write(`${name}: ${keys.length} keyed messages checked across ${targets.length} locales\n`);
    }
}

const notes = JSON.parse(fs.readFileSync(path.join(root, 'data/release_notes.json'), 'utf8'));
const latest = notes.find(entry => /^\d+\.\d+\.\d+$/.test(entry?.version || ''));
for (const name of fs.readdirSync(directory).filter(value => /^release_notes\.[a-z]{2,3}(?:-[A-Za-z0-9]+)*\.json$/.test(value))) {
    const locale = name.slice('release_notes.'.length, -5);
    const translated = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
    const current = translated[latest.version];
    if (!current) {
        errors.push(`${locale}: missing current release ${latest.version}`);
        continue;
    }
    for (const field of ['headline', 'summary', 'bannerSummary', 'ctaLabel']) {
        if (typeof current[field] !== 'string' || !current[field].trim()) errors.push(`${locale}: missing ${field} for ${latest.version}`);
    }
    if (!Array.isArray(current.highlights) || current.highlights.length !== latest.highlights.length ||
        current.highlights.some(value => typeof value !== 'string' || !value.trim())) {
        errors.push(`${locale}: incomplete highlights for ${latest.version}`);
    }
    if (current.detailsUrl !== undefined) errors.push(`${locale}: release URL must stay canonical`);
    process.stdout.write(`${locale}: current release ${latest.version} translation draft checked\n`);
}

if (errors.length) {
    for (const error of errors) process.stderr.write(`${error}\n`);
    process.exitCode = 1;
} else {
    process.stdout.write('Catalog structure is valid. This does not certify full UI coverage or translation quality.\n');
}
