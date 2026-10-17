import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';

const source = fs.readFileSync(new URL('../../js/nanah_qr_scanner.js', import.meta.url), 'utf8');
const vendor = fs.readFileSync(new URL('../../js/vendor/jsqr.bundle.js', import.meta.url), 'utf8');
const imageFile = { type: 'image/png', size: 1024 };
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function fixture({ decode = () => null, camera = null, bitmap = null, width = 640, height = 480, pixels = null } = {}) {
  const status = [];
  const codes = [];
  const timers = new Map();
  let timerId = 0;
  let mediaCalls = 0;
  let stopped = 0;
  let closed = 0;
  let frameCalls = 0;
  const media = { getTracks: () => [{ stop: () => { stopped += 1; } }] };
  const video = { videoWidth: width, videoHeight: height, readyState: 2, pause() {}, play: async () => {} };
  const canvas = {
    getContext: () => ({
      drawImage: () => { frameCalls += 1; },
      getImageData: () => ({ data: pixels || new Uint8ClampedArray(canvas.width * canvas.height * 4) })
    })
  };
  const window = {
    navigator: { mediaDevices: { getUserMedia: options => { mediaCalls += 1; assert.equal(options.audio, false); return camera ? camera() : Promise.resolve(media); } } },
    setTimeout: (fn, delay) => { assert.equal(delay, 200); timers.set(++timerId, fn); return timerId; },
    clearTimeout: id => timers.delete(id),
    createImageBitmap: bitmap || (async () => ({ width, height, close: () => { closed += 1; } })),
    jsQR: decode
  };
  vm.runInNewContext(source, { window });
  const scanner = window.FilterTubeNanahQrScanner.create({ video, canvas, onCode: code => codes.push(code), onStatus: value => status.push(value) });
  return {
    scanner, video, canvas, status, codes, timers, window, media,
    get mediaCalls() { return mediaCalls; }, get stopped() { return stopped; }, get closed() { return closed; }, get frameCalls() { return frameCalls; },
    async tick() { const [id, fn] = timers.entries().next().value; timers.delete(id); fn(); await Promise.resolve(); await Promise.resolve(); }
  };
}

test('construction does not request camera; overlapping starts share one permission request', async () => {
  const permission = deferred();
  const f = fixture({ camera: () => permission.promise });
  assert.equal(f.mediaCalls, 0);
  const first = f.scanner.startCamera();
  const second = f.scanner.startCamera();
  assert.equal(first, second);
  assert.equal(f.mediaCalls, 1);
  permission.resolve(f.media);
  assert.equal(await first, true);
  f.scanner.stop();
  assert.equal(f.stopped, 1);
  assert.equal(f.video.srcObject, null);
  assert.equal(f.timers.size, 0);
});

test('stop during pending permission closes late tracks without starting playback', async () => {
  const permission = deferred();
  const f = fixture({ camera: () => permission.promise });
  const pending = f.scanner.startCamera();
  f.scanner.stop();
  permission.resolve(f.media);
  assert.equal(await pending, false);
  assert.equal(f.stopped, 1);
  assert.equal(f.video.srcObject, null);
  assert.equal(f.timers.size, 0);
  assert.deepEqual(f.status, ['requesting-camera', 'stopped']);
});

test('camera scans at a bounded cadence and releases tracks after the first decoded code', async () => {
  let attempts = 0;
  const f = fixture({ decode: () => ++attempts === 2 ? { data: 'nanah://pair?code=ABCD' } : null });
  assert.equal(await f.scanner.startCamera(), true);
  assert.equal(attempts, 1);
  assert.equal(f.timers.size, 1);
  await f.tick();
  assert.deepEqual(f.codes, ['nanah://pair?code=ABCD']);
  assert.equal(f.stopped, 1);
  assert.equal(f.timers.size, 0);
  assert.equal(f.video.srcObject, null);
  f.scanner.stop();
  assert.equal(f.stopped, 1);
});

test('camera denial and unavailable decoder report status without leaving tracks or timers', async () => {
  const f = fixture({ camera: async () => { throw Object.assign(new Error('denied'), { name: 'NotAllowedError' }); } });
  assert.equal(await f.scanner.startCamera(), false);
  assert.equal(f.status.at(-1), 'camera-denied');
  assert.equal(f.timers.size, 0);
  const unavailable = fixture({ decode: null });
  assert.equal(await unavailable.scanner.startCamera(), false);
  assert.equal(unavailable.mediaCalls, 0);
  assert.equal(unavailable.status.at(-1), 'decoder-unavailable');
});

test('uploaded QR decoding is local, rescales frames, and closes decoded image resources', async () => {
  let frame;
  const f = fixture({ width: 4096, height: 2048, decode: (_, width, height) => { frame = [width, height]; return { data: 'ABCD' }; } });
  assert.equal(await f.scanner.scanFile(imageFile), true);
  assert.deepEqual(frame, [1024, 512]);
  assert.deepEqual(f.codes, ['ABCD']);
  assert.equal(f.closed, 1);
  assert.equal(f.mediaCalls, 0);
});

test('unsupported, oversized and excessive-dimension images never decode', async () => {
  let attempts = 0;
  const f = fixture({ decode: () => { attempts += 1; }, width: 9000 });
  for (const file of [{ type: 'text/html', size: 10 }, { type: 'image/png', size: 11 * 1024 * 1024 }, imageFile]) {
    assert.equal(await f.scanner.scanFile(file), false);
    assert.equal(f.status.at(-1), 'invalid-image');
  }
  assert.equal(attempts, 0);
  assert.equal(f.closed, 1);
});

test('stopping a pending image or decoder cannot emit a late code', async () => {
  const image = deferred();
  let closed = 0;
  const f = fixture({ bitmap: () => image.promise, decode: () => ({ data: 'ABCD' }) });
  const reading = f.scanner.scanFile(imageFile);
  f.scanner.stop();
  image.resolve({ width: 100, height: 100, close: () => { closed += 1; } });
  assert.equal(await reading, false);
  assert.equal(closed, 1);
  assert.deepEqual(f.codes, []);
  const decoder = deferred();
  const g = fixture({ decode: () => decoder.promise });
  const decoding = g.scanner.scanFile(imageFile);
  await Promise.resolve();
  g.scanner.stop();
  decoder.resolve({ data: 'ABCD' });
  assert.equal(await decoding, false);
  assert.deepEqual(g.codes, []);
});

test('a QR-free image has no-code status without starting camera', async () => {
  const f = fixture();
  assert.equal(await f.scanner.scanFile(imageFile), false);
  assert.equal(f.status.at(-1), 'no-code');
  assert.equal(f.closed, 1);
  assert.equal(f.mediaCalls, 0);
});

test('the shipped jsQR vendor decodes an actual generated Nanah pairing QR', async () => {
  const uri = 'nanah://pair?app=filtertube&code=ABCD';
  const qr = QRCode.create(uri, { errorCorrectionLevel: 'M' });
  const side = (qr.modules.size + 8) * 4;
  const pixels = new Uint8ClampedArray(side * side * 4).fill(255);
  for (let y = 0; y < qr.modules.size; y += 1) {
    for (let x = 0; x < qr.modules.size; x += 1) {
      if (!qr.modules.get(y, x)) continue;
      for (let dy = 0; dy < 4; dy += 1) for (let dx = 0; dx < 4; dx += 1) {
        const offset = (((y + 4) * 4 + dy) * side + (x + 4) * 4 + dx) * 4;
        pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 0;
      }
    }
  }
  const window = {};
  vm.runInNewContext(vendor, { window });
  const f = fixture({ decode: window.jsQR, width: side, height: side, pixels });
  assert.equal(await f.scanner.scanFile(imageFile), true);
  assert.deepEqual(f.codes, [uri]);
  assert.equal(f.mediaCalls, 0);
});

test('dashboard QR acceptance rejects unrelated links and malformed pairing strings', () => {
  const dashboard = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
  const start = dashboard.indexOf('    function extractNanahQrPairingCode(input) {');
  const end = dashboard.indexOf('    function formatNanahStage', start);
  assert.ok(start > 0 && end > start);
  const context = { URL, normalizeString: value => typeof value === 'string' ? value.trim() : '' };
  vm.runInNewContext(dashboard.slice(start, end), context);
  for (const valid of ['ABCD', ' abcd ', 'nanah://pair?app=filtertube&code=ABCD', 'nanah://pair?code=abcd']) {
    assert.equal(context.extractNanahQrPairingCode(valid), 'ABCD');
  }
  for (const invalid of ['https://example.com/?code=ABCD', 'https://pair?code=ABCD', 'nanah://wrong?code=ABCD', 'nanah://pair?code=ABCD!!', 'nanah://pair?code=AB', 'ordinary unrelated text', '<script>ABCD</script>', 'AB0D', 'ABCD234567', null]) {
    assert.equal(context.extractNanahQrPairingCode(invalid), '');
  }
});
