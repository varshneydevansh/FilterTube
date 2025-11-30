/**
 * FilterTube Build Script
 * 
 * This script packages the extension for Chrome and Firefox by:
 * 1. Creating dist directories for each browser
 * 2. Copying all common files
 * 3. Copying the browser-specific manifest
 * 4. Creating ZIP archives for distribution
 * 
 * Usage:
 * - npm install fs-extra archiver
 * - node build.js           # Build for all browsers
 * - node build.js chrome    # Build only for Chrome
 * - node build.js firefox   # Build only for Firefox
 * - node build.js opera     # Build only for Opera
 */

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

// Configuration
const ALL_BROWSER_TARGETS = ['chrome', 'firefox', 'opera'];
const VERSION = '3.0.6'; // Matches manifest
const COMMON_DIRS = ['js', 'css', 'html', 'icons'];
const COMMON_FILES = ['README.md', 'CHANGELOG.md', 'LICENSE'];

const targetBrowser = process.argv[2];
const BROWSER_TARGETS = targetBrowser && ALL_BROWSER_TARGETS.includes(targetBrowser)
    ? [targetBrowser]
    : ALL_BROWSER_TARGETS;

// Clean and create dist directory
// Only clean if we are building everything, otherwise we wipe previous specific builds
if (!targetBrowser && fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
}
fs.existsSync('dist') || fs.mkdirSync('dist');

// Stronger filter function for fs.copySync
const filterFunc = (src) => {
    const basename = path.basename(src);
    return basename !== '.DS_Store' &&
        basename !== 'Thumbs.db' &&
        !basename.startsWith('._') &&
        basename !== '__MACOSX';
};

BROWSER_TARGETS.forEach(browser => {
    console.log(`\n🔧 Building for ${browser}...`);

    const targetDir = path.join('dist', browser);
    // Clean specific target dir if it exists
    if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
    }
    fs.mkdirSync(targetDir);

    // 1. Copy common directories
    COMMON_DIRS.forEach(dir => {
        if (fs.existsSync(dir)) {
            fs.copySync(dir, path.join(targetDir, dir), { filter: filterFunc });
        }
    });

    // 2. Copy common files
    COMMON_FILES.forEach(file => {
        if (fs.existsSync(file)) {
            fs.copySync(file, path.join(targetDir, file), { filter: filterFunc });
        }
    });

    // 3. Copy manifest
    const manifestFile = `manifest.${browser}.json`;
    if (fs.existsSync(manifestFile)) {
        fs.copySync(manifestFile, path.join(targetDir, 'manifest.json'));
    } else {
        console.error(`❌ Error: ${manifestFile} not found!`);
        return;
    }

    // 4. Create ZIP
    createZip(browser, targetDir, VERSION);
});

function createZip(browser, sourceDir, version) {
    const zipName = `filtertube-${browser}-v${version}.zip`;
    const zipPath = path.join('dist', zipName);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        const size = (archive.pointer() / 1024).toFixed(2);
        console.log(`✅ ${zipName} created (${size} KB)`);
    });

    archive.pipe(output);

    // GLOB patterns to strictly exclude system junk from the ZIP
    archive.glob('**/*', {
        cwd: sourceDir,
        ignore: [
            '**/.DS_Store',
            '**/__MACOSX',
            '**/._*',
            '**/Thumbs.db'
        ]
    });

    archive.finalize();
}