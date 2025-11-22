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
 */

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

// Configuration
const ALL_BROWSER_TARGETS = ['chrome', 'firefox'];
const VERSION = '3.0.0'; // Read from manifest or package.json in production
const COMMON_DIRS = ['js', 'css', 'html', 'icons', 'docs'];
const COMMON_FILES = ['README.md', 'CHANGELOG.md', 'LICENSE'];

// Determine which browsers to build for based on command line arguments
const targetBrowser = process.argv[2]; // Get the first argument
const BROWSER_TARGETS = targetBrowser && ALL_BROWSER_TARGETS.includes(targetBrowser)
    ? [targetBrowser]  // Build for specific browser if specified
    : ALL_BROWSER_TARGETS; // Build for all browsers by default

// Clean and create dist directory
fs.existsSync('dist') || fs.mkdirSync('dist');

// Process each browser target
BROWSER_TARGETS.forEach(browser => {
    console.log(`\n🔧 Building for ${browser}...`);

    const targetDir = path.join('dist', browser);
    fs.removeSync(targetDir); // Clean previous build
    fs.mkdirSync(targetDir);

    // 1. Copy common directories
    COMMON_DIRS.forEach(dir => {
        if (fs.existsSync(dir)) {
            console.log(`  - Copying ${dir}/ directory`);
            fs.copySync(dir, path.join(targetDir, dir));
        } else {
            console.log(`  ⚠️ Warning: ${dir}/ directory not found, skipping`);
        }
    });

    // 2. Copy common files
    COMMON_FILES.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`  - Copying ${file}`);
            fs.copySync(file, path.join(targetDir, file));
        } else {
            console.log(`  ⚠️ Warning: ${file} not found, skipping`);
        }
    });

    // 3. Copy browser-specific manifest
    const manifestFile = `manifest.${browser}.json`;
    if (fs.existsSync(manifestFile)) {
        console.log(`  - Using ${manifestFile} as manifest.json`);
        fs.copySync(manifestFile, path.join(targetDir, 'manifest.json'));
    } else {
        console.error(`  ❌ Error: ${manifestFile} not found!`);
        console.error(`  ❌ Build for ${browser} failed.`);
        return;
    }

    // 4. Create ZIP archive
    createZip(browser, targetDir, VERSION);
});

/**
 * Creates a ZIP archive of the extension
 */
function createZip(browser, sourceDir, version) {
    const zipName = `filtertube-${browser}-v${version}.zip`;
    const zipPath = path.join('dist', zipName);

    console.log(`\n📦 Creating ${zipName}...`);

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        const size = (archive.pointer() / 1024 / 1024).toFixed(2);
        console.log(`✅ ${zipName} created (${size} MB)`);
    });

    archive.on('error', (err) => {
        throw err;
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
}

console.log(`\n🚀 Build script completed. Check the 'dist/' directory for packaged extensions.`); 