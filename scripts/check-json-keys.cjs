// JSON.parse accepts duplicate keys. Store validation does not.
const fs = require('node:fs');
const path = require('node:path');

function assertUniqueJsonKeys(source, filename = '<JSON>') {
    JSON.parse(source); // Validate grammar before walking tokens.
    const tokens = [...source.matchAll(/"(?:[^"\\]|\\[\s\S])*"|[{}\[\]:,]|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g)];
    let cursor = 0;
    const duplicates = [];
    function value() {
        const token = tokens[cursor++][0];
        if (token === '{') {
            const keys = new Set();
            while (tokens[cursor][0] !== '}') {
                const keyToken = tokens[cursor++];
                const key = JSON.parse(keyToken[0]);
                if (keys.has(key)) {
                    const line = source.slice(0, keyToken.index).split('\n').length;
                    duplicates.push(`${filename}:${line}: duplicate JSON key ${JSON.stringify(key)}`);
                }
                keys.add(key);
                cursor++; // colon
                value();
                if (tokens[cursor][0] !== ',') break;
                cursor++;
            }
            cursor++; // closing brace
        } else if (token === '[') {
            while (tokens[cursor][0] !== ']') {
                value();
                if (tokens[cursor][0] !== ',') break;
                cursor++;
            }
            cursor++; // closing bracket
        }
    }
    value();
    if (duplicates.length) throw new Error(duplicates.join('\n'));
}

function validateJsonPaths(paths, include = () => true) {
    let count = 0;
    const errors = [];
    function visit(filename) {
        if (!include(filename) || !fs.existsSync(filename)) return;
        if (fs.statSync(filename).isDirectory()) {
            for (const name of fs.readdirSync(filename).sort()) visit(path.join(filename, name));
        } else if (filename.endsWith('.json')) {
            count++;
            try { assertUniqueJsonKeys(fs.readFileSync(filename, 'utf8'), filename); }
            catch (error) { errors.push(error.message); }
        }
    }
    paths.forEach(visit);
    if (errors.length) throw new Error(errors.join('\n'));
    return count;
}

module.exports = { assertUniqueJsonKeys, validateJsonPaths };
if (require.main === module) {
    try {
        const paths = process.argv.slice(2);
        const count = validateJsonPaths(paths.length ? paths : ['data', '_locales'], filename => !filename.split(path.sep).includes('batches'));
        console.log(`Validated ${count} JSON files: no duplicate keys.`);
    } catch (error) { console.error(error.message); process.exitCode = 1; }
}
