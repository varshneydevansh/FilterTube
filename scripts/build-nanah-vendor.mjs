import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const nanahDir = path.resolve(rootDir, '..', 'nanah');
const vendorDir = path.resolve(rootDir, 'js', 'vendor');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function buildQrcodeBundle() {
  const qrcodeEntry = path.resolve(rootDir, 'node_modules', 'qrcode', 'lib', 'browser.js');
  await esbuild.build({
    entryPoints: [qrcodeEntry],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    globalName: 'FilterTubeQrCode',
    outfile: path.resolve(vendorDir, 'qrcode.bundle.js'),
    logLevel: 'info'
  });
}

async function buildNanahBundle() {
  const coreEntry = path.resolve(nanahDir, 'packages', 'core', 'src', 'index.ts');
  const clientEntry = path.resolve(nanahDir, 'packages', 'client', 'src', 'index.ts');

  await esbuild.build({
    stdin: {
      contents: `
        import * as Core from ${JSON.stringify(coreEntry)};
        import * as Client from ${JSON.stringify(clientEntry)};
        window.FilterTubeNanah = {
          ...Core,
          ...Client
        };
      `,
      sourcefile: 'nanah-entry.js',
      loader: 'js',
      resolveDir: rootDir
    },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    outfile: path.resolve(vendorDir, 'nanah.bundle.js'),
    logLevel: 'info'
  });
}

async function main() {
  await ensureDir(vendorDir);
  await buildQrcodeBundle();
  await buildNanahBundle();
}

main().catch((error) => {
  console.error('Failed to build Nanah vendor bundles');
  console.error(error);
  process.exitCode = 1;
});
