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
const crypto = require('crypto');
const https = require('https');
const readline = require('readline');
const { execSync } = require('child_process');
const { version: PACKAGE_VERSION } = require('./package.json');

// Configuration
const ALL_BROWSER_TARGETS = ['chrome', 'firefox', 'opera'];
const VERSION = PACKAGE_VERSION; // Matches manifest/package
const COMMON_DIRS = ['js', 'css', 'html', 'icons', 'data', 'assets'];
const COMMON_FILES = ['README.md', 'CHANGELOG.md', 'LICENSE'];
const REPO_OWNER = 'varshneydevansh';
const REPO_NAME = 'FilterTube';
const MOBILE_ARTIFACT_FILE_RE = /^FilterTube-mobile-tablet-v([0-9][A-Za-z0-9._-]*)-code([0-9]+)-(release|debug)\.(apk|aab)$/;
const LOCAL_MOBILE_ARTIFACTS_DIR = path.join('release-artifacts', 'mobile');
const SIBLING_APP_MOBILE_ARTIFACTS_DIR = path.resolve(__dirname, '..', 'FilterTubeApp', 'release-artifacts', 'android-mobile-tablet');
const TEXT_LOC_EXTENSIONS = new Set([
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    '.css',
    '.html',
    '.json',
    '.md',
    '.txt',
    '.swift',
    '.yml',
    '.yaml'
]);
const TEXT_LOC_BASENAMES = new Set([
    'LICENSE'
]);

const cliArgs = process.argv.slice(2);
const targetBrowser = cliArgs.find(arg => ALL_BROWSER_TARGETS.includes(arg));
const mobileArtifactsArg = cliArgs.find(arg => arg.startsWith('--mobile-artifacts='));
const mobileArtifactsDirFromArg = mobileArtifactsArg
    ? mobileArtifactsArg.slice('--mobile-artifacts='.length).trim()
    : '';
const mobileArtifactsDirFromEnv = (process.env.FILTERTUBE_MOBILE_ARTIFACTS_DIR || '').trim();
const mobileArtifactsRequested = cliArgs.includes('--mobile-artifacts') || Boolean(mobileArtifactsDirFromArg || mobileArtifactsDirFromEnv);
const includeAllMobileArtifacts = cliArgs.includes('--all-mobile-artifacts');
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
    console.log('\n🎨 Building extension UI shells...');
    execSync('node scripts/build-extension-ui.mjs', { stdio: 'inherit' });

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

    const mobileArtifactPaths = await maybeCollectMobileArtifacts(VERSION);
    await maybePromptRelease(VERSION, zipPaths, mobileArtifactPaths);
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

async function maybeCollectMobileArtifacts(version) {
    const defaultDir = resolveDefaultMobileArtifactsDir();
    let sourceDir = mobileArtifactsDirFromArg || mobileArtifactsDirFromEnv;

    if (!sourceDir && mobileArtifactsRequested) {
        sourceDir = defaultDir;
    }

    if (!sourceDir && process.stdout.isTTY) {
        const include = await promptYesNo(`📱 Attach Android mobile/tablet APK/AAB artifacts to release v${version}? (y/N): `);
        if (!include) return [];
        sourceDir = await promptText(`   Artifact directory [${defaultDir}]: `);
        sourceDir = sourceDir.trim() || defaultDir;
    }

    if (!sourceDir) return [];

    const resolvedSourceDir = path.resolve(sourceDir);
    if (!fs.existsSync(resolvedSourceDir) || !fs.statSync(resolvedSourceDir).isDirectory()) {
        console.warn(`⚠️  Mobile artifact directory not found: ${resolvedSourceDir}`);
        return [];
    }

    const matchedSourceFiles = fs.readdirSync(resolvedSourceDir)
        .filter(name => MOBILE_ARTIFACT_FILE_RE.test(name))
        .filter(name => parseMobileArtifactName(name)?.version === version)
        .sort();

    if (!matchedSourceFiles.length) {
        console.warn(`⚠️  No mobile artifacts matched FilterTube mobile/tablet v${version} in ${resolvedSourceDir}`);
        return [];
    }

    const sourceFiles = includeAllMobileArtifacts
        ? matchedSourceFiles
        : selectLatestMobileArtifacts(matchedSourceFiles);

    if (sourceFiles.length !== matchedSourceFiles.length) {
        const latestCode = extractAndroidVersionCode(sourceFiles[0]);
        console.log(`ℹ️  Mobile artifacts: selected v${version} latest versionCode ${latestCode}. Use --all-mobile-artifacts to attach every matching file for this version.`);
    }

    const selectedArtifactSummary = summarizeMobileArtifacts(sourceFiles);
    if (!selectedArtifactSummary.hasApk || !selectedArtifactSummary.hasAab) {
        console.warn(`⚠️  Mobile artifacts for v${version} code${selectedArtifactSummary.latestCode || 'unknown'} do not include both APK and AAB files.`);
    }

    const targetDir = path.join('dist', 'mobile');
    fs.ensureDirSync(targetDir);

    const copiedPaths = [];
    for (const fileName of sourceFiles) {
        const sourcePath = path.join(resolvedSourceDir, fileName);
        const targetPath = path.join(targetDir, fileName);
        fs.copyFileSync(sourcePath, targetPath);
        copiedPaths.push(targetPath);

        const checksumPath = `${targetPath}.sha256`;
        fs.writeFileSync(checksumPath, `${sha256File(targetPath)}  ${fileName}\n`, 'utf8');
        copiedPaths.push(checksumPath);

        console.log(`✅ Mobile artifact staged: ${fileName}`);
    }

    return copiedPaths;
}

function resolveDefaultMobileArtifactsDir() {
    const candidates = [SIBLING_APP_MOBILE_ARTIFACTS_DIR, LOCAL_MOBILE_ARTIFACTS_DIR];
    const existing = candidates.find(candidate => {
        const resolved = path.resolve(candidate);
        return fs.existsSync(resolved) && fs.statSync(resolved).isDirectory();
    });
    return existing || LOCAL_MOBILE_ARTIFACTS_DIR;
}

function parseMobileArtifactName(fileName) {
    const match = String(fileName).match(MOBILE_ARTIFACT_FILE_RE);
    if (!match) return null;
    return {
        version: match[1],
        code: Number.parseInt(match[2], 10),
        variant: match[3],
        extension: match[4]
    };
}

function summarizeMobileArtifacts(fileNames) {
    const parsed = fileNames
        .map(parseMobileArtifactName)
        .filter(Boolean);
    return {
        latestCode: Math.max(...parsed.map(item => item.code).filter(Number.isFinite)),
        hasApk: parsed.some(item => item.extension === 'apk'),
        hasAab: parsed.some(item => item.extension === 'aab')
    };
}

function selectLatestMobileArtifacts(fileNames) {
    const latestCode = Math.max(...fileNames.map(extractAndroidVersionCode).filter(Number.isFinite));
    if (!Number.isFinite(latestCode)) return fileNames;
    return fileNames.filter(name => extractAndroidVersionCode(name) === latestCode);
}

function extractAndroidVersionCode(fileName) {
    return parseMobileArtifactName(fileName)?.code ?? Number.NaN;
}

function sha256File(filePath) {
    const hash = crypto.createHash('sha256');
    hash.update(fs.readFileSync(filePath));
    return hash.digest('hex');
}

async function maybePromptRelease(version, zipPaths, mobileArtifactPaths = []) {
    if (!process.stdout.isTTY) {
        console.log('ℹ️  Non-interactive terminal detected; skipping release prompt.');
        return;
    }
    const releaseAssetPaths = [...zipPaths, ...mobileArtifactPaths];
    if (!releaseAssetPaths.length) {
        console.log('ℹ️  No release assets produced; skipping release prompt.');
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
        previousVersion: changelogInfo?.previousVersion,
        mobileArtifactPaths
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

        for (const assetPath of releaseAssetPaths) {
            await uploadReleaseAsset(token, uploadUrl, assetPath);
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

function buildReleaseBody({ version, section, previousVersion, mobileArtifactPaths = [] }) {
    const tag = `v${version}`;
    const compareFrom = previousVersion ? `v${previousVersion}` : null;
    const compareLine = compareFrom
        ? `**Full Changelog:** https://github.com/${REPO_OWNER}/${REPO_NAME}/compare/${compareFrom}...${tag}`
        : `**Full Changelog:** https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${tag}`;

    const assetLink = (browser) =>
        `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${tag}/filtertube-${browser}-v${version}.zip`;
    const releaseAssetLink = (fileName) =>
        `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${tag}/${encodeURIComponent(fileName)}`;

    const whatsNew = section
        ? `## What's New in v${version}\n\n${section.trim()}`
        : `## What's New in v${version}\n\n- Release details unavailable (ensure CHANGELOG.md has a "## Version ${version}" section).`;

    const androidApkNames = mobileArtifactPaths
        .map(assetPath => path.basename(assetPath))
        .filter(name => name.endsWith('.apk'));
    const androidApk = androidApkNames.find(name => name.includes('-release.')) || androidApkNames[0];
    const androidApkIsDebug = Boolean(androidApk && androidApk.includes('-debug.'));
    const androidAab = mobileArtifactPaths
        .map(assetPath => path.basename(assetPath))
        .find(name => name.endsWith('.aab'));
    const androidInstallNote = androidApkIsDebug
        ? 'The debug APK is attached for QA/direct device validation and must stay clearly marked as QA-only. The AAB is for store upload workflows, not normal sideloading.'
        : 'The APK is for direct installs on Android devices, including GrapheneOS and other non-Play setups. The AAB is for store upload workflows, not normal sideloading.';

    const mobileSection = mobileArtifactPaths.length
        ? [
            '',
            '### Android phone/tablet',
            androidApk
                ? `**${androidApkIsDebug ? 'QA debug APK' : 'Direct APK'}:** [${androidApk}](${releaseAssetLink(androidApk)})`
                : '**Direct APK:** Not attached in this release.',
            androidApk
                ? `**Checksum:** [${androidApk}.sha256](${releaseAssetLink(`${androidApk}.sha256`)})`
                : '',
            androidAab
                ? `**Play/App bundle artifact:** [${androidAab}](${releaseAssetLink(androidAab)})`
                : '',
            '',
            androidInstallNote,
        ].filter(Boolean)
        : [
            '',
            '### Android phone/tablet',
            'Android builds are distributed through Play testing and will be linked from https://filtertube.in/downloads when a public APK is attached to this release.',
        ];

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
        ...mobileSection,
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
            'Authorization': `Bearer ${token}`,
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
                'Authorization': `Bearer ${token}`,
                'User-Agent': `${REPO_NAME}-release-script`,
                'Content-Type': contentTypeForAsset(fileName),
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

function contentTypeForAsset(fileName) {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.zip')) return 'application/zip';
    if (lower.endsWith('.apk')) return 'application/vnd.android.package-archive';
    if (lower.endsWith('.sha256') || lower.endsWith('.txt')) return 'text/plain; charset=utf-8';
    return 'application/octet-stream';
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

function promptText(question) {
    return new Promise(resolve => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(question, answer => {
            rl.close();
            resolve(answer);
        });
    });
}

async function updateReadmeBadges(version) {
    try {
        const trackedFiles = execSync('git ls-files', { encoding: 'utf8' })
            .split('\n')
            .map(file => file.trim())
            .filter(Boolean);

        const totalFiles = trackedFiles.filter(shouldCountInTotalLoC);
        const jsFiles = trackedFiles.filter(file => path.extname(file).toLowerCase() === '.js');

        const totalLines = sumFileLines(totalFiles);
        const jsLines = sumFileLines(jsFiles);

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

function shouldCountInTotalLoC(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath);
    return TEXT_LOC_EXTENSIONS.has(ext) || TEXT_LOC_BASENAMES.has(basename);
}

function sumFileLines(files) {
    return files.reduce((total, filePath) => {
        if (!fs.existsSync(filePath)) {
            return total;
        }
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const newlineCount = (content.match(/\n/g) || []).length;
            const lineCount = content.length === 0 ? 0 : newlineCount + 1;
            return total + lineCount;
        } catch (err) {
            console.warn(`⚠️  Skipping ${filePath} during LoC count: ${err.message}`);
            return total;
        }
    }, 0);
}
