/* Backup integrity check and app preferences for FilterTube's plain JSON exports.
 * Shared contract with Android and iOS: docs/parity/SETTINGS_SYNC_MATRIX.md, "Lossless backup contract"
 * (FilterTubeApp). The digest covers FTC1 of the export root without its "integrity" block:
 * JSON.stringify of the value with every object's keys sorted (Array.prototype.sort, UTF-16 code units).
 * HMAC-SHA256 with a PBKDF2-SHA256 key from the master PIN when the exporter has it, else SHA-256.
 * WebCrypto only; no other primitives. */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.FilterTubeBackupIntegrity = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const INTEGRITY_KEY = 'integrity';
    const INTEGRITY_FORMAT = 'filtertube-integrity';
    const DEFAULT_ITERATIONS = 150000;
    const MIN_ITERATIONS = 1000;
    const MAX_ITERATIONS = 1000000;
    const APP_PREFERENCES_KEY = 'appPreferences';
    const APP_PREFERENCES_FORMAT = 'filtertube-app-preferences';
    // The extension's own namespace: an explicit allowlist of non-secret device preferences.
    // Never Nanah identity or trust keys, signing keys, tokens, device IDs or sessions.
    const EXTENSION_PREFERENCE_KEYS = Object.freeze([
        'ftThemePreference',
        'ftUiLocalePreference',
        'ftUiSounds',
        'ftCompanionMode',
        'ftNanahUiMode',
        'ftAutoBackupEnabled',
        'ftRuleListUrlAutoCheckEnabled',
        'ftRuleListUrlAutoCheckLastRun',
        'showUpdateRefreshPrompt'
    ]);
    // Stored in the backup but never applied on import (timestamps and other per-device state).
    const EXTENSION_DEVICE_BOUND_KEYS = Object.freeze(['ftRuleListUrlAutoCheckLastRun']);
    const own = (value, key) => !!value && Object.prototype.hasOwnProperty.call(value, key);
    const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);

    function subtle() {
        const api = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
        return api && api.subtle ? api : null;
    }

    function available() {
        return !!subtle() && typeof TextEncoder === 'function';
    }

    /** FTC1: JSON.stringify of the value with every object's keys sorted by UTF-16 code units. */
    function ftc1(value) {
        const sort = (v) => {
            if (v === null || typeof v !== 'object') {
                if (typeof v === 'number' && !Number.isFinite(v)) throw new Error('ftc1: non-finite number');
                return v;
            }
            if (Array.isArray(v)) return v.map(sort);
            const out = {};
            for (const key of Object.keys(v).sort()) out[key] = sort(v[key]);
            return out;
        };
        return JSON.stringify(sort(value));
    }

    function withoutIntegrity(rootValue) {
        const copy = { ...rootValue };
        delete copy[INTEGRITY_KEY];
        return copy;
    }

    function toHex(buffer) {
        return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function toBase64(bytes) {
        let binary = '';
        for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
    }

    function fromBase64(value) {
        const binary = atob(String(value || ''));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    async function sha256Hex(bytes) {
        return toHex(await subtle().subtle.digest('SHA-256', bytes));
    }

    async function hmacHex(pin, saltBase64, iterations, bytes) {
        const api = subtle().subtle;
        const base = await api.importKey('raw', new TextEncoder().encode(pin), { name: 'PBKDF2' }, false, ['deriveBits']);
        const bits = await api.deriveBits({ name: 'PBKDF2', salt: fromBase64(saltBase64), iterations, hash: 'SHA-256' }, base, 256);
        const key = await api.importKey('raw', bits, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        return toHex(await api.sign('HMAC', key, bytes));
    }

    /** The integrity block for an export root. With a PIN it is an HMAC; otherwise a plain content hash. */
    async function integrityBlock(rootValue, { pin = null, saltBase64 = null, iterations = DEFAULT_ITERATIONS, isProtected = false } = {}) {
        const body = new TextEncoder().encode(ftc1(withoutIntegrity(rootValue)));
        if (pin) {
            let salt = saltBase64;
            if (!salt) {
                const random = new Uint8Array(16);
                subtle().getRandomValues(random);
                salt = toBase64(random);
            }
            return {
                format: INTEGRITY_FORMAT, version: 1, alg: 'hmac-sha256', protected: isProtected === true,
                kdf: { name: 'pbkdf2-sha256', iterations, salt },
                digest: await hmacHex(pin, salt, iterations, body)
            };
        }
        return { format: INTEGRITY_FORMAT, version: 1, alg: 'sha256', protected: isProtected === true, digest: await sha256Hex(body) };
    }

    /** 'missing' | 'valid' | 'mismatch' | 'needs_pin' | 'malformed' */
    async function verify(rootValue, pin = null) {
        const block = rootValue?.[INTEGRITY_KEY];
        if (block === undefined) return 'missing';
        if (!block || block.format !== INTEGRITY_FORMAT || block.version !== 1 || typeof block.digest !== 'string') return 'malformed';
        if (!available()) return 'needs_pin';
        const body = new TextEncoder().encode(ftc1(withoutIntegrity(rootValue)));
        if (block.alg === 'sha256') return (await sha256Hex(body)) === block.digest ? 'valid' : 'mismatch';
        if (block.alg !== 'hmac-sha256') return 'malformed';
        const kdf = block.kdf || {};
        if (kdf.name !== 'pbkdf2-sha256' || !Number.isInteger(kdf.iterations) || kdf.iterations < MIN_ITERATIONS
            || kdf.iterations > MAX_ITERATIONS || typeof kdf.salt !== 'string') return 'malformed';
        if (!pin) return 'needs_pin';
        try {
            return (await hmacHex(pin, kdf.salt, kdf.iterations, body)) === block.digest ? 'valid' : 'mismatch';
        } catch (e) {
            return 'malformed';
        }
    }

    /** Tries each PIN in turn; the first that verifies wins, else the last status seen. */
    async function verifyWithAnyPin(rootValue, pins = []) {
        const candidates = Array.from(new Set((pins || []).filter(pin => typeof pin === 'string' && pin)));
        let status = await verify(rootValue, null);
        if (status !== 'needs_pin') return status;
        for (const pin of candidates) {
            status = await verify(rootValue, pin);
            if (status === 'valid') return status;
        }
        return status;
    }

    function profilePinVerifier(profile) {
        const security = isObject(profile?.security) ? profile.security : {};
        const verifier = security.profilePinVerifier || security.pinVerifier || null;
        return isObject(verifier) ? verifier : null;
    }

    function masterPinVerifier(profilesV4) {
        const master = isObject(profilesV4?.profiles) ? profilesV4.profiles.default : null;
        const security = isObject(master?.security) ? master.security : {};
        const verifier = security.masterPinVerifier || security.masterPin || null;
        return isObject(verifier) ? verifier : null;
    }

    /** The export's "protected" flag: any exported profile has a PIN verifier or is locked. */
    function isProtectedTree(profilesV4) {
        const profiles = isObject(profilesV4?.profiles) ? profilesV4.profiles : {};
        if (masterPinVerifier(profilesV4)) return true;
        return Object.values(profiles).some(profile => isObject(profile)
            && (profile.locked === true || !!profilePinVerifier(profile)));
    }

    /** Adds the root integrity block to a plain JSON export, in place. No WebCrypto: left without one. */
    async function attach(payload, { pin = null } = {}) {
        if (!isObject(payload) || !available()) return payload;
        delete payload[INTEGRITY_KEY];
        payload[INTEGRITY_KEY] = await integrityBlock(payload, { pin: pin || null, isProtected: isProtectedTree(payload.profilesV4) });
        return payload;
    }

    /** The extension namespace, built fresh from live storage values by the allowlist. */
    function extensionPreferences(storageValues) {
        const out = {};
        for (const key of EXTENSION_PREFERENCE_KEYS) {
            if (!own(storageValues, key)) continue;
            const value = storageValues[key];
            if (value === undefined || value === null || typeof value === 'function') continue;
            out[key] = value;
        }
        return out;
    }

    /** profilesV4.appPreferences with the other platforms' namespaces passed through unchanged. */
    function withExtensionPreferences(existing, storageValues) {
        const base = isObject(existing) ? existing : {};
        return { ...base, format: APP_PREFERENCES_FORMAT, version: 1, extension: extensionPreferences(storageValues) };
    }

    /** The values of an incoming extension namespace this device applies (allowlisted, not device-bound). */
    function extensionPreferencesToApply(appPreferences) {
        const ext = isObject(appPreferences) && isObject(appPreferences.extension) ? appPreferences.extension : {};
        const out = {};
        for (const key of EXTENSION_PREFERENCE_KEYS) {
            if (EXTENSION_DEVICE_BOUND_KEYS.includes(key) || !own(ext, key)) continue;
            const value = ext[key];
            if (value === undefined || value === null || (typeof value === 'object')) continue;
            out[key] = value;
        }
        return out;
    }

    return Object.freeze({
        INTEGRITY_KEY,
        INTEGRITY_FORMAT,
        DEFAULT_ITERATIONS,
        APP_PREFERENCES_KEY,
        APP_PREFERENCES_FORMAT,
        EXTENSION_PREFERENCE_KEYS,
        EXTENSION_DEVICE_BOUND_KEYS,
        available,
        ftc1,
        integrityBlock,
        verify,
        verifyWithAnyPin,
        isProtectedTree,
        attach,
        extensionPreferences,
        withExtensionPreferences,
        extensionPreferencesToApply
    });
}));
