(function (root) {
    'use strict';

    const FRAME_DELAY_MS = 200;
    const MAX_FRAME_SIDE = 1024;
    const MAX_SOURCE_SIDE = 8192;
    const MAX_SOURCE_PIXELS = 32 * 1024 * 1024;
    const MAX_FILE_BYTES = 10 * 1024 * 1024;

    function create({ video, canvas, onCode = () => {}, onStatus = () => {}, decode = root.jsQR } = {}) {
        if (!video || !canvas) throw new TypeError('QR scanner requires a video and canvas');
        let generation = 0;
        let stream = null;
        let timer = null;
        let pendingStart = null;

        function releaseStream(value) {
            value?.getTracks().forEach(track => track.stop());
        }

        function close(notify) {
            generation += 1;
            if (timer !== null) root.clearTimeout(timer);
            timer = null;
            pendingStart = null;
            releaseStream(stream);
            stream = null;
            video.pause();
            video.srcObject = null;
            if (notify) onStatus('stopped');
        }

        function stop() {
            close(true);
        }

        async function readFrame(source, width, height, token) {
            if (token !== generation || !width || !height) return false;
            if (width > MAX_SOURCE_SIDE || height > MAX_SOURCE_SIDE || width * height > MAX_SOURCE_PIXELS) {
                throw new Error('image_dimensions_exceeded');
            }
            const scale = Math.min(1, MAX_FRAME_SIDE / Math.max(width, height));
            canvas.width = Math.max(1, Math.round(width * scale));
            canvas.height = Math.max(1, Math.round(height * scale));
            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (!context) throw new Error('canvas_unavailable');
            context.drawImage(source, 0, 0, canvas.width, canvas.height);
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
            const result = await decode(pixels.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
            if (token !== generation) return false;
            const text = typeof result === 'string' ? result : result?.data;
            if (typeof text !== 'string' || !text.trim() || text.length > 4096) return false;
            close(false);
            onStatus('found');
            onCode(text);
            return true;
        }

        async function cameraPass(token) {
            if (token !== generation) return;
            try {
                if (video.readyState >= 2 && await readFrame(video, video.videoWidth, video.videoHeight, token)) return;
            } catch (_) {
                if (token === generation) {
                    close(false);
                    onStatus('scan-failed');
                }
                return;
            }
            if (token === generation) timer = root.setTimeout(() => { void cameraPass(token); }, FRAME_DELAY_MS);
        }

        function startCamera() {
            if (pendingStart) return pendingStart;
            if (stream) return Promise.resolve(true);
            if (typeof decode !== 'function') {
                onStatus('decoder-unavailable');
                return Promise.resolve(false);
            }
            if (!root.navigator?.mediaDevices?.getUserMedia) {
                onStatus('camera-unavailable');
                return Promise.resolve(false);
            }
            close(false);
            const token = generation;
            onStatus('requesting-camera');
            const request = (async () => {
                let requestedStream;
                try {
                    requestedStream = await root.navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
                    });
                    if (token !== generation) {
                        releaseStream(requestedStream);
                        return false;
                    }
                    stream = requestedStream;
                    video.srcObject = stream;
                    video.muted = true;
                    video.playsInline = true;
                    await video.play();
                    if (token !== generation) return false;
                    onStatus('scanning');
                    void cameraPass(token);
                    return true;
                } catch (error) {
                    if (token !== generation) return false;
                    close(false);
                    onStatus(['NotAllowedError', 'SecurityError'].includes(error?.name) ? 'camera-denied' : 'camera-unavailable');
                    return false;
                }
            })();
            pendingStart = request;
            request.finally(() => { if (pendingStart === request) pendingStart = null; });
            return request;
        }

        async function scanFile(file) {
            close(false);
            const token = generation;
            if (typeof decode !== 'function') {
                onStatus('decoder-unavailable');
                return false;
            }
            if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
                || !(file.size > 0) || file.size > MAX_FILE_BYTES || typeof root.createImageBitmap !== 'function') {
                onStatus('invalid-image');
                return false;
            }
            let bitmap;
            onStatus('scanning');
            try {
                bitmap = await root.createImageBitmap(file);
                if (token !== generation) return false;
                const found = await readFrame(bitmap, bitmap.width, bitmap.height, token);
                if (!found && token === generation) onStatus('no-code');
                return found;
            } catch (_) {
                if (token === generation) onStatus('invalid-image');
                return false;
            } finally {
                bitmap?.close();
            }
        }

        return Object.freeze({ startCamera, scanFile, stop });
    }

    root.FilterTubeNanahQrScanner = Object.freeze({ create });
})(typeof window === 'undefined' ? globalThis : window);
