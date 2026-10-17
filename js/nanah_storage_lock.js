(function (global) {
    'use strict';

    const LOCK_NAME = 'filtertube-nanah-trusted-storage-v1';
    const activeTokens = new WeakSet();

    async function run(operation, activeToken = null) {
        if (typeof operation !== 'function') throw new TypeError('A secure device storage operation is required.');
        if (activeToken !== null) {
            if ((typeof activeToken !== 'object' && typeof activeToken !== 'function')
                || activeToken === null || !activeTokens.has(activeToken)) {
                throw new Error('The secure device storage lock token is invalid or expired.');
            }
            return operation(activeToken);
        }
        const locks = global.navigator?.locks;
        if (typeof locks?.request !== 'function') {
            throw new Error('Secure device storage locking is unsupported in this browser. Update your browser before changing device trust or importing settings.');
        }
        return locks.request(LOCK_NAME, { mode: 'exclusive' }, async lock => {
            if (!lock) throw new Error('Secure device storage could not be locked. Try again.');
            const token = Object.freeze({});
            activeTokens.add(token);
            try {
                return await operation(token);
            } finally {
                activeTokens.delete(token);
            }
        });
    }

    global.FilterTubeNanahStorageLock = Object.freeze({ run });
})(typeof window !== 'undefined' ? window : globalThis);
