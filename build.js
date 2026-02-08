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
 * - node build.js chrome    # Build only for Chrome/Edge/Brave
 * - node build.js firefox   # Build only for Firefox
 * - node build.js opera     # Build only for Opera
 */

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const https = require('https');
const readline = require('readline');
const { execSync } = require('child_process');
const { version: PACKAGE_VERSION } = require('./package.json');

// Configuration
const ALL_BROWSER_TARGETS = ['chrome', 'firefox', 'opera'];
const VERSION = PACKAGE_VERSION; // Matches manifest/package
const COMMON_DIRS = ['js', 'css', 'html', 'icons', 'data'];
const COMMON_FILES = ['README.md', 'CHANGELOG.md', 'LICENSE'];
const REPO_OWNER = 'varshneydevansh';
const REPO_NAME = 'FilterTube';

const targetBrowser = process.argv[2];
const BROWSER_TARGETS = targetBrowser && ALL_BROWSER_TARGETS.includes(targetBrowser)
    ? [targetBrowser]
    : ALL_BROWSER_TARGETS;

// Stronger filter function for fs.copySync
const filterFunc = (src) => {
    const basename = path.basename(src);
    return basename !== '.DS_Store' &&
        basename !== 'Thumbs.db' &&
        !basename.startsWith('._') &&
        basename !== '__MACOSX';
};

main().catch(err => {
    console.error('❌ Build failed:', err);
    process.exitCode = 1;
});

async function main() {
    console.log('\n📊 Updating README badges with latest stats...');
    await updateReadmeBadges(VERSION);

    // Clean and create dist directory
    // Only clean if we are building everything, otherwise we wipe previous specific builds
    if (!targetBrowser && fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true, force: true });
    }
    fs.existsSync('dist') || fs.mkdirSync('dist');

    const zipPaths = [];

    for (const browser of BROWSER_TARGETS) {
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
            let manifestJSON = null;
            try {
                manifestJSON = fs.readJsonSync(manifestFile);
            } catch (err) {
                console.error(`❌ Error: failed to read ${manifestFile}:`, err);
                continue;
            }

            ensureCollabDialogScriptOrder(manifestJSON);

            try {
                fs.writeJsonSync(path.join(targetDir, 'manifest.json'), manifestJSON, { spaces: 4 });
            } catch (err) {
                console.error(`❌ Error: failed to write dist/${browser}/manifest.json:`, err);
                continue;
            }

            const versionForZip = typeof manifestJSON?.version === 'string' && manifestJSON.version.trim()
                ? manifestJSON.version.trim()
                : VERSION;

            // 4. Create ZIP
            const zipPath = await createZip(browser, targetDir, versionForZip);
            if (zipPath) {
                zipPaths.push(zipPath);
            }
        } else {
            console.error(`❌ Error: ${manifestFile} not found!`);
            continue;
        }
    }

    await maybePromptRelease(VERSION, zipPaths);
}

function ensureCollabDialogScriptOrder(manifestJSON) {
    if (!manifestJSON || typeof manifestJSON !== 'object') return;
    if (!Array.isArray(manifestJSON.content_scripts)) return;

    const collabDialogPath = 'js/content/collab_dialog.js';
    const contentBridgePath = 'js/content_bridge.js';

    for (const entry of manifestJSON.content_scripts) {
        if (!entry || !Array.isArray(entry.js)) continue;
        const bridgeIndex = entry.js.indexOf(contentBridgePath);
        if (bridgeIndex === -1) continue;

        const collabIndex = entry.js.indexOf(collabDialogPath);
        if (collabIndex === -1) {
            entry.js.splice(bridgeIndex, 0, collabDialogPath);
        } else if (collabIndex > bridgeIndex) {
            entry.js.splice(collabIndex, 1);
            entry.js.splice(bridgeIndex, 0, collabDialogPath);
        }
    }
}

function createZip(browser, sourceDir, version) {
    return new Promise((resolve, reject) => {
        const zipName = `filtertube-${browser}-v${version}.zip`;
        const zipPath = path.join('dist', zipName);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            const size = (archive.pointer() / 1024).toFixed(2);
            console.log(`✅ ${zipName} created (${size} KB)`);
            resolve(zipPath);
        });

        output.on('error', reject);
        archive.on('error', reject);

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
    });
}

async function maybePromptRelease(version, zipPaths) {
    if (!process.stdout.isTTY) {
        console.log('ℹ️  Non-interactive terminal detected; skipping release prompt.');
        return;
    }
    if (!zipPaths.length) {
        console.log('ℹ️  No ZIPs produced; skipping release prompt.');
        return;
    }

    const answer = await promptYesNo(`📦 Publish GitHub release v${version}? (y/N): `);
    if (!answer) {
        console.log('ℹ️  Release publishing skipped.');
        return;
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.error('❌ GITHUB_TOKEN is not set; cannot publish release.');
        return;
    }

    const changelogInfo = extractLatestChangelogEntry(version);
    const body = buildReleaseBody({
        version,
        section: changelogInfo?.section,
        previousVersion: changelogInfo?.previousVersion
    });
    const releaseTitle = buildReleaseTitle({
        version,
        subtitle: changelogInfo?.subtitle
    });

    try {
        const release = await createGitHubRelease(token, {
            tagName: `v${version}`,
            name: releaseTitle,
            body
        });

        const uploadUrl = release?.upload_url;
        if (!uploadUrl) {
            console.error('❌ Could not get upload URL from GitHub release response.');
            return;
        }

        for (const zipPath of zipPaths) {
            await uploadReleaseAsset(token, uploadUrl, zipPath);
        }

        console.log('🚀 Release published successfully.');
    } catch (err) {
        console.error('❌ Failed to publish release:', err);
    }
}

function extractLatestChangelogEntry(version) {
    try {
        const raw = fs.readFileSync('CHANGELOG.md', 'utf8');
        const regex = /##\s+Version\s+([0-9.]+)/g;
        const matches = [...raw.matchAll(regex)];
        const idx = matches.findIndex(m => m[1] === version);
        if (idx === -1) return null;

        const current = matches[idx];
        const next = matches[idx + 1];

        const sectionStart = current.index + current[0].length;
        const sectionEnd = next ? next.index : raw.length;
        const section = raw.slice(sectionStart, sectionEnd).trim();

        const subtitle = deriveSubtitle(section);
        const previousVersion = next ? next[1] : null;

        return { section, subtitle, previousVersion };
    } catch (err) {
        console.error('❌ Failed to read CHANGELOG.md:', err);
        return null;
    }
}

function deriveSubtitle(section) {
    if (!section) return '';
    const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
    const bullet = lines.find(l => l.startsWith('- '));
    if (bullet) return bullet.replace(/^-+\s*/, '').trim();
    const headingLine = lines.find(l => l && !l.startsWith('---'));
    return headingLine || '';
}

function buildReleaseTitle({ version }) {
    return `FilterTube v${version}`;
}

function buildReleaseBody({ version, section, previousVersion }) {
    const tag = `v${version}`;
    const compareFrom = previousVersion ? `v${previousVersion}` : null;
    const compareLine = compareFrom
        ? `**Full Changelog:** https://github.com/${REPO_OWNER}/${REPO_NAME}/compare/${compareFrom}...${tag}`
        : `**Full Changelog:** https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${tag}`;

    const assetLink = (browser) =>
        `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${tag}/filtertube-${browser}-v${version}.zip`;

    const whatsNew = section
        ? `## What's New in v${version}\n\n${section.trim()}`
        : `## What's New in v${version}\n\n- Release details unavailable (ensure CHANGELOG.md has a "## Version ${version}" section).`;

    return [
        whatsNew,
        '',
        '---',
        '',
        '## 📥 Installation',
        '',
        '### 🌐 Chrome, Brave, Edge (Chromium)',
        `**Download:** [filtertube-chrome-v${version}.zip](${assetLink('chrome')})`,
        '',
        '1. Download and extract the zip file.',
        "2. Open your browser's extensions page (`chrome://extensions`, `brave://extensions`, or `edge://extensions`).",
        '3. Enable **Developer mode**.',
        '4. Click **Load unpacked**.',
        '5. Select the extracted folder.',
        '',
        '### 🦊 Firefox (Desktop & Android)',
        `**Download:** [filtertube-firefox-v${version}.zip](${assetLink('firefox')})`,
        '',
        '**Desktop:**',
        '1. Download the zip file.',
        '2. Go to `about:debugging`.',
        '3. Click **This Firefox** on the left sidebar.',
        '4. Click **Load Temporary Add-on...**',
        '5. Select the downloaded zip file.',
        '',
        '**Android:**',
        '1. Install Firefox for Android.',
        '2. Download the zip file to your device.',
        '3. In Firefox, go to `about:debugging`.',
        '4. Enable USB debugging and connect via `adb` (see Mozilla docs).',
        '',
        '### 🔴 Opera',
        `**Download:** [filtertube-opera-v${version}.zip](${assetLink('opera')})`,
        '',
        '1. Download and extract the zip file.',
        '2. Go to `opera://extensions`.',
        '3. Enable **Developer mode**.',
        '4. Click **Load unpacked**.',
        '5. Select the extracted folder.',
        '',
        '---',
        '',
        compareLine
    ].join('\n');
}

function createGitHubRelease(token, { tagName, name, body }) {
    const payload = JSON.stringify({
        tag_name: tagName,
        name,
        body,
        draft: false,
        prerelease: false
    });

    const options = {
        method: 'POST',
        hostname: 'api.github.com',
        path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases`,
        headers: {
            'Authorization': `token ${token}`,
            'User-Agent': `${REPO_NAME}-release-script`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    return httpRequest(options, payload);
}

function uploadReleaseAsset(token, uploadUrlTemplate, filePath) {
    return new Promise((resolve, reject) => {
        const cleanUrl = uploadUrlTemplate.split('{')[0];
        const fileName = path.basename(filePath);
        const uploadUrl = `${cleanUrl}?name=${encodeURIComponent(fileName)}`;
        const stat = fs.statSync(filePath);

        const options = {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'User-Agent': `${REPO_NAME}-release-script`,
                'Content-Type': 'application/zip',
                'Content-Length': stat.size
            }
        };

        const req = https.request(uploadUrl, options, res => {
            const chunks = [];
            res.on('data', d => chunks.push(d));
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`📎 Uploaded ${fileName}`);
                    resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
                } else {
                    reject(new Error(`Upload failed for ${fileName}: ${res.statusCode} ${res.statusMessage}`));
                }
            });
        });

        req.on('error', reject);
        fs.createReadStream(filePath).pipe(req);
    });
}

function httpRequest(options, payload) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            const chunks = [];
            res.on('data', d => chunks.push(d));
            res.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf8');
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(body));
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    reject(new Error(`GitHub API error: ${res.statusCode} ${res.statusMessage} - ${body}`));
                }
            });
        });
        req.on('error', reject);
        if (payload) {
            req.write(payload);
        }
        req.end();
    });
}

function promptYesNo(question) {
    return new Promise(resolve => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim().toLowerCase() === 'y');
        });
    });
}

async function updateReadmeBadges(version) {
    try {
        // Calculate total lines of code
        const totalLinesRaw = execSync('git ls-files | xargs wc -l 2>/dev/null | tail -1', { encoding: 'utf8' });
        const totalLines = parseInt(totalLinesRaw.trim().split(/\s+/)[0], 10);

        // Calculate JavaScript lines
        const jsLinesRaw = execSync("git ls-files | grep '\\.js$' | xargs wc -l 2>/dev/null | tail -1", { encoding: 'utf8' });
        const jsLines = parseInt(jsLinesRaw.trim().split(/\s+/)[0], 10);

        if (!totalLines || !jsLines) {
            console.warn('⚠️  Could not calculate LoC stats; skipping badge update.');
            return;
        }

        // Format numbers (e.g., 61617 -> "61.6k")
        const formatLoC = (num) => {
            if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'k';
            }
            return num.toString();
        };

        const totalFormatted = formatLoC(totalLines);
        const jsFormatted = formatLoC(jsLines);

        console.log(`   Total lines: ${totalLines.toLocaleString()} (${totalFormatted})`);
        console.log(`   JavaScript: ${jsLines.toLocaleString()} (${jsFormatted})`);

        // Read README
        const readmePath = 'README.md';
        let readme = fs.readFileSync(readmePath, 'utf8');

        // Update version badge
        readme = readme.replace(
            /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-[^)]+\)/,
            `![Version](https://img.shields.io/badge/version-${version}-blue.svg)`
        );

        // Update total lines badge
        readme = readme.replace(
            /!\[Lines of Code\]\(https:\/\/img\.shields\.io\/badge\/total%20lines-[^)]+\)/,
            `![Lines of Code](https://img.shields.io/badge/total%20lines-${totalFormatted}-brightgreen.svg)`
        );

        // Update JavaScript LoC badge
        readme = readme.replace(
            /!\[JavaScript LoC\]\(https:\/\/img\.shields\.io\/badge\/javascript-[^)]+\)/,
            `![JavaScript LoC](https://img.shields.io/badge/javascript-${jsFormatted}%20lines-yellow.svg)`
        );

        // Write updated README
        fs.writeFileSync(readmePath, readme, 'utf8');
        console.log('✅ README.md badges updated successfully.');

    } catch (err) {
        console.warn('⚠️  Failed to update README badges:', err.message);
    }
}
