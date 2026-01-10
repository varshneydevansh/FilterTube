(function (global) {
    'use strict';

    const cryptoApi = (typeof globalThis !== 'undefined' && globalThis.crypto) ? globalThis.crypto : null;
    const subtle = cryptoApi?.subtle;

    function ensureCrypto() {
        if (!cryptoApi || !subtle) {
            throw new Error('WebCrypto unavailable');
        }
    }

    function normalizeString(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function toBase64(bytes) {
        let binary = '';
        const len = bytes.length;
        for (let i = 0; i < len; i += 1) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function fromBase64(base64) {
        const normalized = normalizeString(base64);
        if (!normalized) return new Uint8Array();
        const binary = atob(normalized);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    function randomBytes(length = 16) {
        ensureCrypto();
        const out = new Uint8Array(length);
        cryptoApi.getRandomValues(out);
        return out;
    }

    function safeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    async function deriveBitsPBKDF2(password, saltBytes, iterations, bitLength) {
        ensureCrypto();
        const enc = new TextEncoder();
        const passphrase = normalizeString(password);
        const baseKey = await subtle.importKey(
            'raw',
            enc.encode(passphrase),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );
        return subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: saltBytes,
                iterations,
                hash: 'SHA-256'
            },
            baseKey,
            bitLength
        );
    }

    async function deriveAesKeyPBKDF2(password, saltBytes, iterations) {
        ensureCrypto();
        const enc = new TextEncoder();
        const passphrase = normalizeString(password);
        const baseKey = await subtle.importKey(
            'raw',
            enc.encode(passphrase),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        return subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: saltBytes,
                iterations,
                hash: 'SHA-256'
            },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    async function createPinVerifier(pin, { iterations = 150000, saltBytes = null } = {}) {
        const normalized = normalizeString(pin);
        if (!normalized) throw new Error('PIN required');

        const salt = saltBytes instanceof Uint8Array ? saltBytes : randomBytes(16);
        const bits = await deriveBitsPBKDF2(normalized, salt, iterations, 256);
        return {
            kdf: 'PBKDF2',
            hashAlg: 'SHA-256',
            iterations,
            salt: toBase64(salt),
            hash: toBase64(new Uint8Array(bits))
        };
    }

    async function verifyPin(pin, verifier) {
        const v = safeObject(verifier);
        if (v.kdf !== 'PBKDF2' || v.hashAlg !== 'SHA-256') return false;
        const iterations = typeof v.iterations === 'number' && Number.isFinite(v.iterations) ? v.iterations : 0;
        if (!iterations) return false;
        const salt = fromBase64(v.salt);
        const expected = normalizeString(v.hash);
        if (!salt.length || !expected) return false;
        const bits = await deriveBitsPBKDF2(pin, salt, iterations, 256);
        const got = toBase64(new Uint8Array(bits));
        return got === expected;
    }

    async function encryptJson(obj, password, { iterations = 150000, saltBytes = null, ivBytes = null } = {}) {
        const passphrase = normalizeString(password);
        if (!passphrase) throw new Error('Password required');

        const salt = saltBytes instanceof Uint8Array ? saltBytes : randomBytes(16);
        const iv = ivBytes instanceof Uint8Array ? ivBytes : randomBytes(12);
        const key = await deriveAesKeyPBKDF2(passphrase, salt, iterations);

        const json = JSON.stringify(obj);
        const enc = new TextEncoder();
        const ciphertext = await subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            enc.encode(json)
        );

        return {
            kdf: {
                name: 'PBKDF2',
                hash: 'SHA-256',
                iterations,
                salt: toBase64(salt)
            },
            cipher: {
                name: 'AES-GCM',
                iv: toBase64(iv)
            },
            data: toBase64(new Uint8Array(ciphertext))
        };
    }

    async function decryptJson(encrypted, password) {
        const payload = safeObject(encrypted);
        const passphrase = normalizeString(password);
        if (!passphrase) throw new Error('Password required');

        const kdf = safeObject(payload.kdf);
        const cipher = safeObject(payload.cipher);

        if (kdf.name !== 'PBKDF2' || kdf.hash !== 'SHA-256') {
            throw new Error('Unsupported KDF');
        }
        if (cipher.name !== 'AES-GCM') {
            throw new Error('Unsupported cipher');
        }

        const iterations = typeof kdf.iterations === 'number' && Number.isFinite(kdf.iterations) ? kdf.iterations : 0;
        const salt = fromBase64(kdf.salt);
        const iv = fromBase64(cipher.iv);
        const data = fromBase64(payload.data);

        if (!iterations || !salt.length || !iv.length || !data.length) {
            throw new Error('Invalid encrypted payload');
        }

        const key = await deriveAesKeyPBKDF2(passphrase, salt, iterations);
        const plaintext = await subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );

        const dec = new TextDecoder();
        const json = dec.decode(plaintext);
        return JSON.parse(json);
    }

    global.FilterTubeSecurity = {
        createPinVerifier,
        verifyPin,
        encryptJson,
        decryptJson
    };
})(typeof window !== 'undefined' ? window : this);
