import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vendor = path.join(root, 'js/vendor');
await fs.mkdir(vendor, { recursive: true });
await build({
  stdin: {
    contents: 'import jsQR from "jsqr"; window.jsQR = jsQR;',
    resolveDir: root,
    sourcefile: 'qr-scanner-vendor-entry.js'
  },
  outfile: path.join(vendor, 'jsqr.bundle.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome111', 'firefox109'],
  minify: true,
  banner: { js: '// jsQR 1.4.0, Apache-2.0. Source: https://github.com/cozmo/jsQR. License: jsqr.LICENSE.txt' },
  logLevel: 'info'
});
const license = await fs.readFile(path.join(root, 'node_modules/jsqr/LICENSE'), 'utf8');
await fs.writeFile(path.join(vendor, 'jsqr.LICENSE.txt'), license.trimEnd() + '\n');
