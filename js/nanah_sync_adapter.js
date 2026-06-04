(function (global) {
    'use strict';

    const APP_ID = 'filtertube';
    const PAYLOAD_VERSION = 'v3';
    const MANAGED_POLICY_ENVELOPE_TYPE = 'filtertube_managed_policy';
    const MANAGED_MAILBOX_ITEM_SCHEMA = 'filtertube_managed_mailbox_item';
    const MANAGED_POLICY_ALLOWED_SCOPES = [
        'main',
        'kids',
        'videos',
        'keywords',
        'channels',
        'viewing_space',
        'time_limits'
    ];
    const DEFAULT_DEVICE_CAPABILITIES = [
        'sync.send',
        'sync.receive',
        'control.propose'
    ];

    function normalizeString(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function normalizeScope(scope) {
        const raw = normalizeString(scope).toLowerCase();
        if (raw === 'main' || raw === 'kids' || raw === 'active' || raw === 'full') {
            return raw;
        }
        return 'active';
    }

    function normalizeManagedPolicyScope(scope) {
        const raw = normalizeString(scope).toLowerCase();
        return MANAGED_POLICY_ALLOWED_SCOPES.includes(raw) ? raw : '';
    }

    function safeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function normalizeNonNegativeInteger(value) {
        const num = typeof value === 'number' ? value : Number(value);
        if (!Number.isInteger(num)) return null;
        return num >= 0 ? num : null;
    }

    function validationResult(reason, extra = {}) {
        return { accepted: false, reason, ...extra };
    }

    function getManagedPayloadScopeFamily(payload) {
        const root = safeObject(payload);
        const explicitScope = normalizeManagedPolicyScope(root.scope);
        if (explicitScope) return explicitScope;
        const operations = safeArray(root.operations);
        const firstOperation = normalizeString(operations[0]?.op).toLowerCase();
        if (firstOperation.includes('keyword')) return 'keywords';
        if (firstOperation.includes('channel')) return 'channels';
        if (firstOperation.includes('video')) return 'videos';
        if (Object.prototype.hasOwnProperty.call(root, 'dailyBudgetMinutes') || root.timeLimitPolicy) return 'time_limits';
        if (
            root.viewingSpace
            || Object.prototype.hasOwnProperty.call(root, 'allowMain')
            || Object.prototype.hasOwnProperty.call(root, 'allowKids')
            || Object.prototype.hasOwnProperty.call(root, 'defaultLaunchTarget')
        ) {
            return 'viewing_space';
        }
        return '';
    }

    function validateManagedPayloadScope(scope, payload) {
        const family = getManagedPayloadScopeFamily(payload);
        if (!family) return validationResult('payload_scope_unknown');
        if (family !== scope) return validationResult('payload_scope_mismatch');
        const root = safeObject(payload);
        const operations = safeArray(root.operations);
        if (scope === 'keywords' && operations.some(operation => !normalizeString(operation?.op).toLowerCase().includes('keyword'))) {
            return validationResult('payload_scope_mismatch');
        }
        if (scope === 'channels' && operations.some(operation => !normalizeString(operation?.op).toLowerCase().includes('channel'))) {
            return validationResult('payload_scope_mismatch');
        }
        if (scope === 'videos' && operations.some(operation => !normalizeString(operation?.op).toLowerCase().includes('video'))) {
            return validationResult('payload_scope_mismatch');
        }
        if (
            scope === 'time_limits'
            && !(Number.isInteger(root.dailyBudgetMinutes) && root.dailyBudgetMinutes >= 0)
            && !root.timeLimitPolicy
        ) {
            return validationResult('invalid_time_limit_payload');
        }
        if (
            scope === 'viewing_space'
            && !(root.viewingSpace
                || Object.prototype.hasOwnProperty.call(root, 'allowMain')
                || Object.prototype.hasOwnProperty.call(root, 'allowKids')
                || Object.prototype.hasOwnProperty.call(root, 'defaultLaunchTarget'))
        ) {
            return validationResult('invalid_viewing_space_payload');
        }
        return null;
    }

    function validateManagedIntegrityBinding(envelope) {
        const signed = safeObject(safeObject(envelope.integrity).signedFields);
        if (Object.keys(signed).length === 0) return validationResult('missing_integrity_binding');
        for (const field of ['linkId', 'scope', 'targetProfileId', 'sourceDeviceId', 'revision', 'policyHash']) {
            if (signed[field] !== envelope[field]) return validationResult(`integrity_${field}_mismatch`);
        }
        if (signed.payloadScope !== getManagedPayloadScopeFamily(envelope.payload)) {
            return validationResult('integrity_payload_scope_mismatch');
        }
        return null;
    }

    function stableManagedNanahJson(value) {
        if (Array.isArray(value)) {
            return `[${value.map(stableManagedNanahJson).join(',')}]`;
        }
        if (value && typeof value === 'object') {
            return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableManagedNanahJson(value[key])}`).join(',')}}`;
        }
        return JSON.stringify(value);
    }

    function decodeManagedNanahBase64Url(value) {
        const raw = normalizeString(value);
        if (!raw || typeof global.atob !== 'function') return null;
        const base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
        const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
        try {
            const binary = global.atob(padded);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i += 1) {
                bytes[i] = binary.charCodeAt(i);
            }
            return bytes;
        } catch (e) {
            return null;
        }
    }

    function encodeManagedNanahBase64Url(value) {
        const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || []);
        if (!bytes.length || typeof global.btoa !== 'function') return '';
        let binary = '';
        for (let index = 0; index < bytes.length; index += 1) {
            binary += String.fromCharCode(bytes[index]);
        }
        return global.btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/g, '');
    }

    function getManagedNanahSourcePublicKeyJwk(trustedLink) {
        const trusted = safeObject(trustedLink);
        const policy = safeObject(trusted.policy);
        const jwk = safeObject(trusted.sourcePublicKeyJwk || policy.sourcePublicKeyJwk || policy.publicKeyJwk);
        return Object.keys(jwk).length > 0 ? jwk : null;
    }

    function buildManagedPolicySignedFields(envelope) {
        const root = safeObject(envelope);
        return {
            linkId: normalizeString(root.linkId),
            scope: normalizeManagedPolicyScope(root.scope),
            targetProfileId: normalizeString(root.targetProfileId),
            sourceDeviceId: normalizeString(root.sourceDeviceId),
            revision: normalizeNonNegativeInteger(root.revision) || 0,
            policyHash: normalizeString(root.policyHash),
            payloadScope: getManagedPayloadScopeFamily(root.payload)
        };
    }

    async function createManagedNanahSigningKeyPair(options = {}) {
        const subtle = global.crypto?.subtle;
        if (!subtle || typeof subtle.generateKey !== 'function' || typeof subtle.exportKey !== 'function') {
            throw new Error('Managed Nanah signing requires WebCrypto key generation');
        }
        const keyVersion = normalizeNonNegativeInteger(options.managedKeyVersion || options.keyVersion || options.sourceKeyVersion) || 1;
        const keyId = normalizeString(options.managedPublicKeyId || options.sourcePublicKeyId || options.publicKeyId)
            || `managed-${generateId()}`;
        const generated = await subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
        const publicKeyJwk = await subtle.exportKey('jwk', generated.publicKey);
        const privateKeyJwk = await subtle.exportKey('jwk', generated.privateKey);
        return {
            managedPublicKeyId: keyId,
            managedPublicKeyJwk: publicKeyJwk,
            managedKeyVersion: keyVersion,
            sourcePublicKeyId: keyId,
            sourcePublicKeyJwk: publicKeyJwk,
            keyVersion,
            privateKeyJwk,
            algorithm: 'ed25519',
            createdAt: Date.now()
        };
    }

    async function signManagedPolicyEnvelope(envelope, privateKeyJwk) {
        const root = safeObject(envelope);
        const keyJwk = safeObject(privateKeyJwk || root.privateKeyJwk);
        const subtle = global.crypto?.subtle;
        if (!subtle || typeof subtle.importKey !== 'function' || typeof subtle.sign !== 'function') {
            throw new Error('Managed Nanah signing requires WebCrypto signing support');
        }
        if (!Object.keys(keyJwk).length) {
            throw new Error('Managed Nanah signing requires a private key');
        }
        if (typeof global.TextEncoder !== 'function') {
            throw new Error('Managed Nanah signing requires TextEncoder');
        }
        const signedFields = buildManagedPolicySignedFields(root);
        const bindingDecision = validateManagedIntegrityBinding({
            ...root,
            integrity: {
                signedFields
            }
        });
        if (bindingDecision) {
            throw new Error(`Managed Nanah signing refused: ${bindingDecision.reason}`);
        }
        const key = await subtle.importKey('jwk', keyJwk, { name: 'Ed25519' }, false, ['sign']);
        const data = new global.TextEncoder().encode(stableManagedNanahJson(signedFields));
        const signature = await subtle.sign({ name: 'Ed25519' }, key, data);
        const { privateKeyJwk: _discardPrivateKey, ...publicEnvelope } = root;
        return {
            ...publicEnvelope,
            integrity: {
                algorithm: 'ed25519',
                signedFields,
                signature: encodeManagedNanahBase64Url(signature)
            }
        };
    }

    async function verifyManagedNanahPolicyIntegritySignature(envelope, trustedLink) {
        const root = safeObject(envelope);
        const integrity = safeObject(root.integrity);
        const algorithm = normalizeString(integrity.algorithm).toLowerCase();
        if (algorithm !== 'ed25519') return { verified: false, reason: 'unsupported_signature_algorithm' };
        const publicKeyJwk = getManagedNanahSourcePublicKeyJwk(trustedLink);
        if (!publicKeyJwk) return { verified: false, reason: 'missing_public_key_material' };
        const subtle = global.crypto?.subtle;
        if (!subtle || typeof subtle.importKey !== 'function' || typeof subtle.verify !== 'function') {
            return { verified: false, reason: 'webcrypto_unavailable' };
        }
        if (typeof global.TextEncoder !== 'function') return { verified: false, reason: 'text_encoder_unavailable' };
        const signature = decodeManagedNanahBase64Url(integrity.signature);
        if (!signature) return { verified: false, reason: 'signature_decode_failed' };
        try {
            const key = await subtle.importKey('jwk', publicKeyJwk, { name: 'Ed25519' }, false, ['verify']);
            const signedFields = safeObject(integrity.signedFields);
            const data = new global.TextEncoder().encode(stableManagedNanahJson(signedFields));
            const verified = await subtle.verify({ name: 'Ed25519' }, key, signature, data);
            return verified
                ? { verified: true, verifier: 'webcrypto_ed25519' }
                : { verified: false, reason: 'signature_invalid' };
        } catch (e) {
            return { verified: false, reason: 'signature_verifier_error' };
        }
    }

    function managedPolicyProfileMap(context) {
        return safeObject(context.profiles || safeObject(context.profilesV4).profiles);
    }

    function getAcceptedManagedPolicyState(context) {
        const accepted = safeObject(context.accepted);
        if (Number.isInteger(accepted.revision) && normalizeString(accepted.policyHash)) return accepted;
        return null;
    }

    function normalizeMailboxTimestampMs(value) {
        const integer = normalizeNonNegativeInteger(value);
        if (integer !== null) return integer;
        const normalized = normalizeString(value);
        if (!normalized) return null;
        const parsed = Date.parse(normalized);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    }

    function validateManagedPolicyEnvelope(envelope, context = {}) {
        const root = safeObject(envelope);
        const trustedLink = safeObject(context.trustedLink);
        if (!root || Object.keys(root).length === 0) return validationResult('missing_envelope');
        if (root.type !== MANAGED_POLICY_ENVELOPE_TYPE) return validationResult('wrong_type');
        for (const field of [
            'linkId',
            'scope',
            'targetProfileId',
            'sourceProfileId',
            'sourceDeviceId',
            'revision',
            'policyHash',
            'sourcePublicKeyId',
            'keyVersion',
            'integrity',
            'payload'
        ]) {
            if (root[field] === undefined || root[field] === null || root[field] === '') {
                return validationResult(`missing_${field}`);
            }
        }

        const scope = normalizeManagedPolicyScope(root.scope);
        if (!scope) return validationResult('scope_not_allowed');
        if (!Number.isInteger(root.revision) || root.revision <= 0) return validationResult('invalid_revision');
        if (!Number.isInteger(root.keyVersion) || root.keyVersion <= 0) return validationResult('invalid_keyVersion');
        if (!root.integrity?.algorithm || !root.integrity?.signature) return validationResult('missing_integrity');

        const payloadDecision = validateManagedPayloadScope(scope, root.payload);
        if (payloadDecision) return payloadDecision;
        const integrityDecision = validateManagedIntegrityBinding(root);
        if (integrityDecision) return integrityDecision;

        if (trustedLink.type !== 'managed_link') return validationResult('link_not_managed');
        if (trustedLink.localRole !== 'replica' || trustedLink.remoteRole !== 'source') return validationResult('wrong_link_roles');
        if (trustedLink.revoked) return validationResult('link_revoked');
        if (trustedLink.keyRevoked) return validationResult('key_revoked');
        if (trustedLink.stalePairing) return validationResult('stale_pairing');
        if (root.linkId !== trustedLink.id && root.linkId !== trustedLink.linkId) return validationResult('wrong_link_id');
        if (root.sourceDeviceId !== trustedLink.sourceDeviceId) return validationResult('wrong_source_device');
        if (safeArray(context.duplicateDeviceIds).includes(root.sourceDeviceId)) return validationResult('duplicate_source_device_id');
        if (root.sourceProfileId !== trustedLink.sourceProfileId) return validationResult('wrong_source_profile');
        if (root.targetProfileId !== trustedLink.targetProfileId) return validationResult('wrong_target_profile');
        if (!safeArray(trustedLink.allowedScopes).includes(scope) && !safeArray(safeObject(trustedLink.policy).allowedScopes).includes(scope)) {
            return validationResult('scope_not_allowed');
        }
        if (root.sourcePublicKeyId !== trustedLink.sourcePublicKeyId) return validationResult('wrong_public_key');
        if (root.keyVersion !== trustedLink.keyVersion) return validationResult('wrong_key_version');

        const profiles = managedPolicyProfileMap(context);
        const sourceProfile = safeObject(profiles[root.sourceProfileId]);
        const targetProfile = safeObject(profiles[root.targetProfileId]);
        if (!sourceProfile || Object.keys(sourceProfile).length === 0 || sourceProfile.type === 'child') {
            return validationResult('source_not_parent_authority');
        }
        if (!targetProfile || Object.keys(targetProfile).length === 0 || targetProfile.type !== 'child') {
            return validationResult('target_not_protected_child');
        }
        if (normalizeString(targetProfile.parentProfileId) !== root.sourceProfileId) {
            return validationResult('source_not_bound_to_target');
        }

        if (context.signatureVerified !== true && context.integrityVerified !== true) {
            const verifier = context.verifyIntegritySignature || context.verifyManagedPolicySignature;
            if (typeof verifier !== 'function') return validationResult('missing_signature_verifier');
            const verification = verifier({
                envelope: root,
                integrity: safeObject(root.integrity),
                signedFields: safeObject(root.integrity?.signedFields),
                payloadScope: getManagedPayloadScopeFamily(root.payload),
                trustedLink
            });
            if (verification && typeof verification.then === 'function') {
                return validationResult('async_signature_verifier_unsupported');
            }
            const verificationObject = safeObject(verification);
            const verified = verification === true || verificationObject.verified === true || verificationObject.accepted === true;
            if (!verified) {
                return validationResult(normalizeString(verificationObject.reason) || 'signature_invalid');
            }
        }

        const accepted = getAcceptedManagedPolicyState(context);
        if (accepted) {
            if (root.revision < accepted.revision) return validationResult('stale_revision');
            if (root.revision === accepted.revision && root.policyHash !== accepted.policyHash) {
                return validationResult('equal_revision_hash_conflict');
            }
            if (root.revision === accepted.revision && root.policyHash === accepted.policyHash) {
                return {
                    accepted: true,
                    decision: 'idempotent_same_hash',
                    scope,
                    targetProfileId: root.targetProfileId,
                    revision: root.revision,
                    policyHash: root.policyHash
                };
            }
        }

        return {
            accepted: true,
            decision: 'accept_newer_revision',
            scope,
            targetProfileId: root.targetProfileId,
            revision: root.revision,
            policyHash: root.policyHash
        };
    }

    function getManagedMailboxEnvelope(item) {
        const root = safeObject(item);
        return safeObject(root.decryptedEnvelope || root.envelope || root.managedPolicyEnvelope);
    }

    function validateManagedMailboxBinding(item, envelope) {
        const root = safeObject(item);
        const policy = safeObject(envelope);
        for (const field of [
            'linkId',
            'targetProfileId',
            'sourceDeviceId',
            'sourceProfileId',
            'scope',
            'revision',
            'policyHash',
            'sourcePublicKeyId',
            'keyVersion'
        ]) {
            if (root[field] !== policy[field]) {
                return validationResult(`ciphertext_binding_${field}_mismatch`, { ackState: 'rejected' });
            }
        }
        return null;
    }

    function validateManagedMailboxItem(item, context = {}) {
        const root = safeObject(item);
        const trustedLink = safeObject(context.trustedLink);
        if (!root || Object.keys(root).length === 0 || root.schema !== MANAGED_MAILBOX_ITEM_SCHEMA) {
            return validationResult('missing_mailbox_item', { ackState: 'rejected' });
        }
        if (root.version !== 1) return validationResult('wrong_mailbox_version', { ackState: 'rejected' });
        if (trustedLink.type !== 'managed_link') return validationResult('missing_trusted_link', { ackState: 'rejected' });
        if (trustedLink.localRole !== 'replica' || trustedLink.remoteRole !== 'source') {
            return validationResult('wrong_link_roles', { ackState: 'rejected' });
        }
        if (trustedLink.revoked) return validationResult('link_revoked', { ackState: 'revoked' });
        if (trustedLink.keyRevoked) return validationResult('key_revoked', { ackState: 'revoked' });

        const expiresAtMs = normalizeMailboxTimestampMs(root.expiresAtMs || root.expiresAt);
        const nowMs = normalizeMailboxTimestampMs(context.nowMs) || Date.now();
        if (expiresAtMs !== null && expiresAtMs <= nowMs) {
            return validationResult('mailbox_item_expired', { ackState: 'expired' });
        }
        for (const field of ['mailboxItemId', 'linkId', 'targetProfileId', 'sourceDeviceId', 'sourceProfileId', 'scope', 'revision', 'policyHash', 'sourcePublicKeyId', 'keyVersion']) {
            if (root[field] === undefined || root[field] === null || root[field] === '') {
                return validationResult(`missing_${field}`, { ackState: 'rejected' });
            }
        }
        if (!root.ciphertext || !root.encryptedDek || !root.nonce) {
            return validationResult('missing_ciphertext', { ackState: 'rejected' });
        }
        if (root.linkId !== trustedLink.id && root.linkId !== trustedLink.linkId) {
            return validationResult('wrong_link_id', { ackState: 'rejected' });
        }
        if (root.targetProfileId !== trustedLink.targetProfileId) {
            return validationResult('wrong_target_profile', { ackState: 'rejected' });
        }
        if (root.sourceDeviceId !== trustedLink.sourceDeviceId) {
            return validationResult('wrong_source_device', { ackState: 'rejected' });
        }
        if (root.sourceProfileId !== trustedLink.sourceProfileId) {
            return validationResult('wrong_source_profile', { ackState: 'rejected' });
        }
        const scope = normalizeManagedPolicyScope(root.scope);
        if (!scope || (!safeArray(trustedLink.allowedScopes).includes(scope) && !safeArray(safeObject(trustedLink.policy).allowedScopes).includes(scope))) {
            return validationResult('scope_not_allowed', { ackState: 'rejected' });
        }
        if (root.sourcePublicKeyId !== trustedLink.sourcePublicKeyId) {
            return validationResult('wrong_public_key', { ackState: 'rejected' });
        }
        if (root.keyVersion !== trustedLink.keyVersion) {
            return validationResult('wrong_key_version', { ackState: 'rejected' });
        }
        const envelope = getManagedMailboxEnvelope(root);
        if (!envelope || Object.keys(envelope).length === 0) {
            return validationResult('missing_managed_policy_envelope', { ackState: 'rejected' });
        }
        const bindingDecision = validateManagedMailboxBinding(root, envelope);
        if (bindingDecision) return bindingDecision;
        const envelopeDecision = validateManagedPolicyEnvelope(envelope, context);
        if (envelopeDecision.accepted !== true) {
            const ackState = envelopeDecision.reason === 'equal_revision_hash_conflict'
                ? 'conflict'
                : (envelopeDecision.reason === 'link_revoked' || envelopeDecision.reason === 'key_revoked' ? 'revoked' : 'rejected');
            return {
                ...envelopeDecision,
                ackState,
                mailboxItemId: normalizeString(root.mailboxItemId)
            };
        }
        return {
            ...envelopeDecision,
            accepted: true,
            ackState: 'delivered',
            mailboxItemId: normalizeString(root.mailboxItemId),
            envelope
        };
    }

    function parsePackedChannelKeywordSource(sourceValue) {
        const raw = normalizeString(sourceValue);
        if (!raw.toLowerCase().startsWith('channel:')) return null;
        const ref = raw.slice(raw.indexOf(':') + 1).split('|')[0].trim().toLowerCase();
        return ref ? { source: 'channel', channelRef: ref } : null;
    }

    function normalizeKeywordEntry(entry) {
        if (typeof entry === 'string') return entry;
        const item = safeObject(entry);
        const word = normalizeString(item.word);
        if (!word) return null;
        const packedSource = parsePackedChannelKeywordSource(item.source);
        const channelRef = normalizeString(item.channelRef) || packedSource?.channelRef || '';
        const source = (item.source === 'channel' || packedSource || channelRef) ? 'channel' : item.source;
        return {
            ...item,
            word,
            source: source === 'channel' ? 'channel' : (normalizeString(source) || 'user'),
            channelRef: source === 'channel' ? (channelRef || null) : null
        };
    }

    function normalizeKeywordList(list) {
        return safeArray(list)
            .map(normalizeKeywordEntry)
            .filter(Boolean);
    }

    function keywordKey(entry) {
        if (typeof entry === 'string') {
            return normalizeString(entry).toLowerCase();
        }
        const item = safeObject(entry);
        const word = normalizeString(item.word).toLowerCase();
        if (!word) return '';
        return [
            word,
            item.exact === true ? '1' : '0',
            item.comments === false ? '0' : '1',
            item.semantic === true ? '1' : '0'
        ].join('|');
    }

    function channelKey(entry) {
        const item = safeObject(entry);
        const id = normalizeString(item.id).toLowerCase();
        const handle = normalizeString(item.handle || item.canonicalHandle || item.handleDisplay).toLowerCase();
        const customUrl = normalizeString(item.customUrl).toLowerCase();
        const name = normalizeString(item.name).toLowerCase();
        return id || handle || customUrl || name;
    }

    function mergeKeywordLists(base, incoming) {
        const seen = new Map();
        safeArray(base).forEach((entry) => {
            const normalized = normalizeKeywordEntry(entry);
            const key = keywordKey(normalized);
            if (key) seen.set(key, normalized);
        });
        safeArray(incoming).forEach((entry) => {
            const normalized = normalizeKeywordEntry(entry);
            const key = keywordKey(normalized);
            if (key) seen.set(key, normalized);
        });
        return Array.from(seen.values());
    }

    function mergeChannelLists(base, incoming) {
        const seen = new Map();
        safeArray(base).forEach((entry) => {
            const item = safeObject(entry);
            const key = channelKey(item);
            if (key) seen.set(key, item);
        });
        safeArray(incoming).forEach((entry) => {
            const item = safeObject(entry);
            const key = channelKey(item);
            if (key) seen.set(key, item);
        });
        return Array.from(seen.values());
    }

    function mergeStringLists(base, incoming) {
        const seen = new Map();
        safeArray(base).forEach((entry) => {
            const value = normalizeString(entry);
            if (value) seen.set(value.toLowerCase(), value);
        });
        safeArray(incoming).forEach((entry) => {
            const value = normalizeString(entry);
            if (value) seen.set(value.toLowerCase(), value);
        });
        return Array.from(seen.values());
    }

    function normalizeMainProfileAliasFields(main) {
        const out = { ...safeObject(main) };
        const mode = normalizeString(out.mode) === 'whitelist' ? 'whitelist' : 'blocklist';
        out.mode = mode;
        out.channels = safeArray(out.channels);
        out.keywords = safeArray(out.keywords);
        out.whitelistChannels = safeArray(out.whitelistChannels);
        out.whitelistKeywords = safeArray(out.whitelistKeywords);
        if (mode === 'blocklist') {
            out.blockedChannels = out.channels;
            out.blockedKeywords = out.keywords;
        } else {
            out.blockedChannels = [];
            out.blockedKeywords = [];
        }
        return out;
    }

    function applyMainSurfaceData(currentMain, data, replace) {
        const current = safeObject(currentMain);
        const incoming = safeObject(data);
        const incomingChannels = Array.isArray(incoming.channels) ? incoming.channels : incoming.blockedChannels;
        const incomingKeywords = Array.isArray(incoming.keywords) ? incoming.keywords : incoming.blockedKeywords;
        return normalizeMainProfileAliasFields({
            ...current,
            ...incoming,
            mode: normalizeString(incoming.mode) === 'whitelist' ? 'whitelist' : (current.mode === 'whitelist' ? 'whitelist' : 'blocklist'),
            channels: replace
                ? safeArray(incomingChannels)
                : mergeChannelLists(current.channels, incomingChannels),
            keywords: replace
                ? normalizeKeywordList(incomingKeywords)
                : mergeKeywordLists(current.keywords, incomingKeywords),
            whitelistChannels: replace
                ? safeArray(incoming.whitelistChannels)
                : mergeChannelLists(current.whitelistChannels, incoming.whitelistChannels),
            whitelistKeywords: replace
                ? normalizeKeywordList(incoming.whitelistKeywords)
                : mergeKeywordLists(current.whitelistKeywords, incoming.whitelistKeywords),
            videoIds: replace
                ? safeArray(incoming.videoIds).map(normalizeString).filter(Boolean)
                : mergeStringLists(current.videoIds, incoming.videoIds)
        });
    }

    function applyKidsSurfaceData(currentKids, data, replace) {
        const current = safeObject(currentKids);
        const incoming = safeObject(data);
        return {
            ...current,
            ...incoming,
            mode: normalizeString(incoming.mode) === 'whitelist' ? 'whitelist' : (current.mode === 'whitelist' ? 'whitelist' : 'blocklist'),
            strictMode: Object.prototype.hasOwnProperty.call(incoming, 'strictMode')
                ? incoming.strictMode !== false
                : current.strictMode !== false,
            blockedChannels: replace
                ? safeArray(incoming.blockedChannels)
                : mergeChannelLists(current.blockedChannels, incoming.blockedChannels),
            blockedKeywords: replace
                ? safeArray(incoming.blockedKeywords)
                : mergeKeywordLists(current.blockedKeywords, incoming.blockedKeywords),
            whitelistChannels: replace
                ? safeArray(incoming.whitelistChannels)
                : mergeChannelLists(current.whitelistChannels, incoming.whitelistChannels),
            whitelistKeywords: replace
                ? normalizeKeywordList(incoming.whitelistKeywords)
                : mergeKeywordLists(current.whitelistKeywords, incoming.whitelistKeywords),
            videoIds: replace
                ? safeArray(incoming.videoIds).map(normalizeString).filter(Boolean)
                : mergeStringLists(current.videoIds, incoming.videoIds)
        };
    }

    function cloneJson(value) {
        return JSON.parse(JSON.stringify(value));
    }

    async function buildScopedPortablePayload(io, scope) {
        if (typeof io.loadProfilesV4 !== 'function') {
            throw new Error('Profile-scoped Nanah sync requires loadProfilesV4');
        }

        const profilesV4 = safeObject(await io.loadProfilesV4());
        const activeId = normalizeString(profilesV4.activeProfileId) || 'default';
        const activeProfile = safeObject(safeObject(profilesV4.profiles)[activeId]);
        const profileName = normalizeString(activeProfile.name) || activeId;

        if (!activeProfile || Object.keys(activeProfile).length === 0) {
            throw new Error('Active profile is not available');
        }

        if (scope === 'main') {
            return {
                version: PAYLOAD_VERSION,
                meta: {
                    exportType: 'nanah-scope',
                    scope: 'main',
                    profileId: activeId,
                    profileName
                },
                section: 'main',
                profileId: activeId,
                profileName,
                data: cloneJson(safeObject(activeProfile.main))
            };
        }

        if (scope === 'kids') {
            return {
                version: PAYLOAD_VERSION,
                meta: {
                    exportType: 'nanah-scope',
                    scope: 'kids',
                    profileId: activeId,
                    profileName
                },
                section: 'kids',
                profileId: activeId,
                profileName,
                data: cloneJson(safeObject(activeProfile.kids))
            };
        }

        throw new Error(`Unsupported scoped payload: ${scope}`);
    }

    async function applyScopedPortablePayload(io, portable, { strategy = 'merge', targetProfileId = null } = {}) {
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            throw new Error('Profile-scoped Nanah sync requires load/saveProfilesV4');
        }

        const root = safeObject(portable);
        const scope = normalizeScope(root.section || safeObject(root.meta).scope);
        if (scope !== 'main' && scope !== 'kids') {
            throw new Error('Invalid profile-scoped Nanah payload');
        }

        const profilesV4 = safeObject(await io.loadProfilesV4());
        const activeId = normalizeString(profilesV4.activeProfileId) || 'default';
        const resolvedTargetProfileId = normalizeString(targetProfileId) || activeId;
        const profiles = {
            ...safeObject(profilesV4.profiles)
        };
        const activeProfile = safeObject(profiles[resolvedTargetProfileId]);
        if (!activeProfile || Object.keys(activeProfile).length === 0) {
            throw new Error('Target profile is not available');
        }

        const data = safeObject(root.data);
        const replace = strategy === 'replace';

        if (scope === 'main') {
            profiles[resolvedTargetProfileId] = {
                ...activeProfile,
                main: applyMainSurfaceData(activeProfile.main, data, replace)
            };
        } else {
            profiles[resolvedTargetProfileId] = {
                ...activeProfile,
                kids: applyKidsSurfaceData(activeProfile.kids, data, replace)
            };
        }

        await io.saveProfilesV4({
            ...profilesV4,
            profiles
        });

        return {
            ok: true,
            scope,
            profileId: resolvedTargetProfileId,
            strategy: replace ? 'replace' : 'merge'
        };
    }

    function managedPayloadSurface(payload, fallback = 'main') {
        const raw = normalizeString(payload.surface || payload.targetSurface || payload.section).toLowerCase();
        return raw === 'kids' ? 'kids' : (fallback === 'kids' ? 'kids' : 'main');
    }

    function managedPayloadListKind(payload, fallback = 'blocklist') {
        const raw = normalizeString(payload.list || payload.targetList || payload.listKind || payload.mode).toLowerCase();
        if (raw.includes('white') || raw === 'allow') return 'whitelist';
        if (raw.includes('block') || raw === 'deny') return 'blocklist';
        return fallback === 'whitelist' ? 'whitelist' : 'blocklist';
    }

    function managedPayloadReplace(payload) {
        const raw = normalizeString(payload.strategy || payload.applyMode || payload.mode).toLowerCase();
        return raw === 'replace' || payload.replace === true;
    }

    function managedOperationKind(operation) {
        const raw = normalizeString(operation?.op || operation?.action).toLowerCase();
        if (raw.includes('remove') || raw.includes('delete')) return 'remove';
        if (raw.includes('replace') || raw.includes('set')) return 'replace';
        return 'add';
    }

    function managedKeywordFromOperation(operation) {
        const item = safeObject(operation);
        const candidate = safeObject(item.keyword || item.entry);
        const word = normalizeString(candidate.word || item.word || item.value);
        if (!word) return null;
        return normalizeKeywordEntry({
            ...candidate,
            word,
            source: normalizeString(candidate.source || item.source) || 'managed'
        });
    }

    function managedChannelFromOperation(operation) {
        const item = safeObject(operation);
        const candidate = safeObject(item.channel || item.entry);
        const channel = {
            ...candidate,
            id: normalizeString(candidate.id || item.id || item.channelId),
            handle: normalizeString(candidate.handle || item.handle),
            customUrl: normalizeString(candidate.customUrl || item.customUrl),
            name: normalizeString(candidate.name || item.name || item.value),
            source: normalizeString(candidate.source || item.source) || 'managed'
        };
        return channelKey(channel) ? channel : null;
    }

    function managedVideoIdFromOperation(operation) {
        const item = safeObject(operation);
        return normalizeString(item.videoId || item.id || item.value);
    }

    function mergeWithFactory(base, incoming, entryFactory, keyFn) {
        const seen = new Map();
        safeArray(base).forEach((entry) => {
            const key = keyFn(entry);
            if (key) seen.set(key, entry);
        });
        safeArray(incoming).forEach((entry) => {
            const normalized = entryFactory(entry);
            const key = keyFn(normalized);
            if (key) seen.set(key, normalized);
        });
        return Array.from(seen.values());
    }

    function removeEntriesByKeys(list, incoming, keyFn) {
        const removeKeys = new Set(safeArray(incoming).map(keyFn).filter(Boolean));
        if (removeKeys.size === 0) return safeArray(list);
        return safeArray(list).filter(entry => !removeKeys.has(keyFn(entry)));
    }

    function applyManagedListPayload(list, payload, entryFactory, keyFn, listFields) {
        const root = safeObject(payload);
        const operations = safeArray(root.operations);
        let next = managedPayloadReplace(root) || operations.some(operation => managedOperationKind(operation) === 'replace')
            ? []
            : safeArray(list);
        const directEntries = listFields.flatMap(field => safeArray(root[field]));
        if (directEntries.length > 0) {
            next = mergeWithFactory(next, directEntries, entryFactory, keyFn);
        }
        for (const operation of operations) {
            const kind = managedOperationKind(operation);
            const entry = entryFactory(operation);
            if (!entry) continue;
            if (kind === 'remove') {
                next = removeEntriesByKeys(next, [entry], keyFn);
            } else {
                next = mergeWithFactory(next, [entry], value => value, keyFn);
            }
        }
        return next;
    }

    function applyManagedKeywordPolicy(profile, payload) {
        const surface = managedPayloadSurface(payload);
        const listKind = managedPayloadListKind(payload);
        if (surface === 'kids') {
            const kids = safeObject(profile.kids);
            const listKey = listKind === 'whitelist' ? 'whitelistKeywords' : 'blockedKeywords';
            return {
                ...profile,
                kids: {
                    ...kids,
                    [listKey]: applyManagedListPayload(kids[listKey], payload, managedKeywordFromOperation, keywordKey, [
                        listKey,
                        listKind === 'whitelist' ? 'keywords' : 'blockedKeywords'
                    ])
                }
            };
        }
        const main = normalizeMainProfileAliasFields(profile.main);
        const listKey = listKind === 'whitelist' ? 'whitelistKeywords' : 'keywords';
        return {
            ...profile,
            main: normalizeMainProfileAliasFields({
                ...main,
                [listKey]: applyManagedListPayload(main[listKey], payload, managedKeywordFromOperation, keywordKey, [
                    listKey,
                    listKind === 'whitelist' ? 'whitelistKeywords' : 'blockedKeywords',
                    'keywords'
                ])
            })
        };
    }

    function applyManagedChannelPolicy(profile, payload) {
        const surface = managedPayloadSurface(payload);
        const listKind = managedPayloadListKind(payload);
        if (surface === 'kids') {
            const kids = safeObject(profile.kids);
            const listKey = listKind === 'whitelist' ? 'whitelistChannels' : 'blockedChannels';
            return {
                ...profile,
                kids: {
                    ...kids,
                    [listKey]: applyManagedListPayload(kids[listKey], payload, managedChannelFromOperation, channelKey, [
                        listKey,
                        listKind === 'whitelist' ? 'channels' : 'blockedChannels'
                    ])
                }
            };
        }
        const main = normalizeMainProfileAliasFields(profile.main);
        const listKey = listKind === 'whitelist' ? 'whitelistChannels' : 'channels';
        return {
            ...profile,
            main: normalizeMainProfileAliasFields({
                ...main,
                [listKey]: applyManagedListPayload(main[listKey], payload, managedChannelFromOperation, channelKey, [
                    listKey,
                    listKind === 'whitelist' ? 'whitelistChannels' : 'blockedChannels',
                    'channels'
                ])
            })
        };
    }

    function applyManagedVideoPolicy(profile, payload) {
        const surface = managedPayloadSurface(payload);
        const target = surface === 'kids' ? safeObject(profile.kids) : safeObject(profile.main);
        const operations = safeArray(payload.operations);
        let next = managedPayloadReplace(payload) || operations.some(operation => managedOperationKind(operation) === 'replace')
            ? []
            : safeArray(target.videoIds);
        next = mergeStringLists(next, safeArray(payload.videoIds || payload.videos));
        for (const operation of operations) {
            const videoId = managedVideoIdFromOperation(operation);
            if (!videoId) continue;
            if (managedOperationKind(operation) === 'remove') {
                next = next.filter(existing => normalizeString(existing).toLowerCase() !== videoId.toLowerCase());
            } else {
                next = mergeStringLists(next, [videoId]);
            }
        }
        if (surface === 'kids') {
            return {
                ...profile,
                kids: {
                    ...target,
                    videoIds: next
                }
            };
        }
        return {
            ...profile,
            main: normalizeMainProfileAliasFields({
                ...target,
                videoIds: next
            })
        };
    }

    function applyManagedViewingSpacePolicy(profile, payload) {
        const current = safeObject(profile.settings);
        const hasMain = Object.prototype.hasOwnProperty.call(payload, 'allowMain')
            || Object.prototype.hasOwnProperty.call(payload, 'allowMainViewing');
        const hasKids = Object.prototype.hasOwnProperty.call(payload, 'allowKids')
            || Object.prototype.hasOwnProperty.call(payload, 'allowKidsViewing');
        const allowMainViewing = hasMain
            ? (Object.prototype.hasOwnProperty.call(payload, 'allowMainViewing') ? payload.allowMainViewing !== false : payload.allowMain !== false)
            : current.allowMainViewing !== false;
        const allowKidsViewing = hasKids
            ? (Object.prototype.hasOwnProperty.call(payload, 'allowKidsViewing') ? payload.allowKidsViewing !== false : payload.allowKids !== false)
            : current.allowKidsViewing !== false;
        if (!allowMainViewing && !allowKidsViewing) {
            throw new Error('Managed viewing-space policy cannot disable every viewing space');
        }
        return {
            ...profile,
            settings: {
                ...current,
                allowMainViewing,
                allowKidsViewing,
                ...(normalizeString(payload.defaultLaunchTarget)
                    ? { defaultLaunchTarget: normalizeString(payload.defaultLaunchTarget) }
                    : {})
            }
        };
    }

    function applyManagedTimeLimitPolicy(profile, payload, envelope) {
        const current = safeObject(profile.settings);
        const incoming = safeObject(payload.timeLimitPolicy || payload);
        const root = safeObject(envelope);
        const now = Date.now();
        const nextPolicy = Object.prototype.hasOwnProperty.call(payload, 'timeLimitPolicy')
            ? incoming
            : (() => {
                const currentPolicy = safeObject(current.timeLimitPolicy);
                const budgetMinutes = normalizeNonNegativeInteger(incoming.dailyBudgetMinutes);
                const budgetSeconds = normalizeNonNegativeInteger(incoming.dailyBudgetSeconds)
                    ?? (budgetMinutes == null ? null : budgetMinutes * 60);
                if (budgetSeconds == null) throw new Error('Managed time-limit policy requires a non-negative budget');
                return {
                    ...currentPolicy,
                    schema: 'filtertube_managed_time_limit',
                    version: 1,
                    enabled: incoming.enabled !== false,
                    timezone: normalizeString(incoming.timezone) || normalizeString(currentPolicy.timezone) || 'UTC',
                    dailyBudgetSeconds: budgetSeconds,
                    surfaceBudgets: safeObject(incoming.surfaceBudgets || currentPolicy.surfaceBudgets || {
                        main: budgetSeconds,
                        kids: budgetSeconds
                    }),
                    countingMode: normalizeString(incoming.countingMode) || normalizeString(currentPolicy.countingMode) || 'active_youtube_tab',
                    activeDeviceBudgetPolicy: normalizeString(incoming.activeDeviceBudgetPolicy)
                        || normalizeString(currentPolicy.activeDeviceBudgetPolicy)
                        || 'single_active_tab_no_double_count',
                    resetPolicy: normalizeString(incoming.resetPolicy) || normalizeString(currentPolicy.resetPolicy) || 'policy_timezone_midnight',
                    graceSeconds: normalizeNonNegativeInteger(incoming.graceSeconds)
                        ?? normalizeNonNegativeInteger(currentPolicy.graceSeconds)
                        ?? 0,
                    parentGrant: safeObject(incoming.parentGrant || currentPolicy.parentGrant || {
                        enabled: false,
                        extraSeconds: 0,
                        expiresAt: null,
                        reason: ''
                    }),
                    policyRevision: normalizeNonNegativeInteger(root.revision) || normalizeNonNegativeInteger(currentPolicy.policyRevision) || 1,
                    policyHash: normalizeString(root.policyHash) || normalizeString(incoming.policyHash) || normalizeString(currentPolicy.policyHash),
                    issuedAt: normalizeNonNegativeInteger(incoming.issuedAt) || now,
                    validFrom: normalizeNonNegativeInteger(incoming.validFrom) || now,
                    validUntil: incoming.validUntil == null ? null : normalizeNonNegativeInteger(incoming.validUntil)
                };
            })();
        if (!normalizeString(nextPolicy.policyHash)) throw new Error('Managed time-limit policy requires policyHash');
        return {
            ...profile,
            settings: {
                ...current,
                timeLimitPolicy: nextPolicy
            }
        };
    }

    function applyManagedPolicyPayloadToProfile(profile, envelope) {
        const root = safeObject(envelope);
        const scope = normalizeManagedPolicyScope(root.scope);
        const payload = safeObject(root.payload);
        const replace = managedPayloadReplace(payload);
        if (scope === 'main') {
            return {
                ...profile,
                main: applyMainSurfaceData(profile.main, safeObject(payload.data || payload), replace)
            };
        }
        if (scope === 'kids') {
            return {
                ...profile,
                kids: applyKidsSurfaceData(profile.kids, safeObject(payload.data || payload), replace)
            };
        }
        if (scope === 'keywords') return applyManagedKeywordPolicy(profile, payload);
        if (scope === 'channels') return applyManagedChannelPolicy(profile, payload);
        if (scope === 'videos') return applyManagedVideoPolicy(profile, payload);
        if (scope === 'viewing_space') return applyManagedViewingSpacePolicy(profile, payload);
        if (scope === 'time_limits') return applyManagedTimeLimitPolicy(profile, payload, envelope);
        throw new Error('Unsupported managed policy scope');
    }

    function withAcceptedManagedPolicyState(profile, envelope) {
        const root = safeObject(envelope);
        const scope = normalizeManagedPolicyScope(root.scope);
        const linkId = normalizeString(root.linkId);
        const existingState = safeObject(profile.managedPolicyState);
        const remotePolicies = safeObject(existingState.remoteManagedPolicies);
        const linkPolicies = safeObject(remotePolicies[linkId]);
        return {
            ...profile,
            managedPolicyState: {
                ...existingState,
                remoteManagedPolicies: {
                    ...remotePolicies,
                    [linkId]: {
                        ...linkPolicies,
                        [scope]: {
                            revision: root.revision,
                            policyHash: normalizeString(root.policyHash),
                            sourceProfileId: normalizeString(root.sourceProfileId),
                            sourceDeviceId: normalizeString(root.sourceDeviceId),
                            sourcePublicKeyId: normalizeString(root.sourcePublicKeyId),
                            keyVersion: root.keyVersion,
                            acceptedAt: Date.now()
                        }
                    }
                }
            }
        };
    }

    async function applyManagedPolicyEnvelope(envelope, context = {}) {
        const root = safeObject(envelope);
        if (!context || Object.keys(safeObject(context)).length === 0) {
            return validationResult('missing_managed_validation_context');
        }
        const validation = validateManagedPolicyEnvelope(root, context);
        if (validation.accepted !== true) return validation;
        if (validation.decision === 'idempotent_same_hash') {
            return {
                ok: true,
                accepted: true,
                decision: 'idempotent_same_hash',
                scope: validation.scope,
                profileId: validation.targetProfileId,
                revision: validation.revision,
                policyHash: validation.policyHash,
                applied: false
            };
        }

        const io = await getIO();
        if (typeof io.loadProfilesV4 !== 'function' || typeof io.saveProfilesV4 !== 'function') {
            throw new Error('Managed policy apply requires load/saveProfilesV4');
        }
        const profilesV4 = safeObject(await io.loadProfilesV4());
        const profiles = { ...safeObject(profilesV4.profiles) };
        const targetProfile = safeObject(profiles[root.targetProfileId]);
        const sourceProfile = safeObject(profiles[root.sourceProfileId]);
        if (!targetProfile || Object.keys(targetProfile).length === 0 || targetProfile.type !== 'child') {
            return validationResult('target_not_protected_child');
        }
        if (!sourceProfile || Object.keys(sourceProfile).length === 0 || sourceProfile.type === 'child') {
            return validationResult('source_not_parent_authority');
        }
        if (normalizeString(targetProfile.parentProfileId) !== root.sourceProfileId) {
            return validationResult('source_not_bound_to_target');
        }
        const latestAccepted = safeObject(safeObject(safeObject(targetProfile.managedPolicyState).remoteManagedPolicies)[root.linkId])[
            normalizeManagedPolicyScope(root.scope)
        ];
        if (Number.isInteger(latestAccepted?.revision)) {
            if (root.revision < latestAccepted.revision) return validationResult('stale_revision');
            if (root.revision === latestAccepted.revision && root.policyHash !== latestAccepted.policyHash) {
                return validationResult('equal_revision_hash_conflict');
            }
            if (root.revision === latestAccepted.revision && root.policyHash === latestAccepted.policyHash) {
                return {
                    ok: true,
                    accepted: true,
                    decision: 'idempotent_same_hash',
                    scope: normalizeManagedPolicyScope(root.scope),
                    profileId: root.targetProfileId,
                    revision: root.revision,
                    policyHash: root.policyHash,
                    applied: false
                };
            }
        }

        const updatedProfile = withAcceptedManagedPolicyState(
            applyManagedPolicyPayloadToProfile(targetProfile, root),
            root
        );
        profiles[root.targetProfileId] = updatedProfile;
        await io.saveProfilesV4({
            ...profilesV4,
            schemaVersion: 4,
            profiles
        });
        return {
            ok: true,
            accepted: true,
            decision: validation.decision,
            scope: validation.scope,
            profileId: validation.targetProfileId,
            revision: validation.revision,
            policyHash: validation.policyHash,
            applied: true
        };
    }

    async function applyManagedMailboxItem(item, context = {}) {
        const mailboxDecision = validateManagedMailboxItem(item, context);
        if (mailboxDecision.accepted !== true) return mailboxDecision;
        if (mailboxDecision.decision === 'idempotent_same_hash') {
            return {
                ok: true,
                accepted: true,
                decision: 'idempotent_same_hash',
                scope: mailboxDecision.scope,
                profileId: mailboxDecision.targetProfileId,
                revision: mailboxDecision.revision,
                policyHash: mailboxDecision.policyHash,
                applied: false,
                ackState: 'delivered',
                mailboxItemId: mailboxDecision.mailboxItemId
            };
        }
        const result = await applyManagedPolicyEnvelope(mailboxDecision.envelope, context);
        return {
            ...result,
            ackState: result.accepted === true ? 'delivered' : (mailboxDecision.ackState || 'rejected'),
            mailboxItemId: mailboxDecision.mailboxItemId
        };
    }

    function generateId() {
        if (global.crypto && typeof global.crypto.randomUUID === 'function') {
            return global.crypto.randomUUID();
        }
        return `nanah-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function summarizePortablePayload(payload, scope) {
        const root = safeObject(payload);
        const meta = safeObject(root.meta);
        const exportType = normalizeString(meta.exportType).toLowerCase();
        const profileName = normalizeString(meta.profileName) || normalizeString(meta.profileId);

        if (scope === 'kids') return 'FilterTube YouTube Kids settings';
        if (scope === 'main') return 'FilterTube main YouTube settings';
        if (scope === 'full' || exportType === 'full') return 'Full FilterTube backup';
        if (scope === 'active' && profileName) return `FilterTube profile: ${profileName}`;
        return 'FilterTube settings';
    }

    async function getIO() {
        const io = global.FilterTubeIO || null;
        if (!io || typeof io.exportV3 !== 'function' || typeof io.importV3 !== 'function') {
            throw new Error('FilterTubeIO export/import is not available');
        }
        return io;
    }

    async function buildPortablePayload({ scope = 'active', auth = null } = {}) {
        const io = await getIO();
        const normalizedScope = normalizeScope(scope);
        const payload = (normalizedScope === 'main' || normalizedScope === 'kids')
            ? await buildScopedPortablePayload(io, normalizedScope)
            : await io.exportV3({ scope: normalizedScope, auth });
        return {
            app: APP_ID,
            scope: normalizedScope,
            payloadVersion: PAYLOAD_VERSION,
            summary: summarizePortablePayload(payload, normalizedScope),
            portable: payload
        };
    }

    async function buildSyncEnvelope({ scope = 'active', auth = null } = {}) {
        const built = await buildPortablePayload({ scope, auth });
        return {
            t: 'app_sync',
            id: generateId(),
            app: APP_ID,
            scope: built.scope,
            payloadVersion: built.payloadVersion,
            payload: JSON.stringify(built.portable)
        };
    }

    async function buildControlProposal({ scope = 'active', strategy = 'merge', auth = null } = {}) {
        const built = await buildPortablePayload({ scope, auth });
        return {
            t: 'control_proposal',
            id: generateId(),
            app: APP_ID,
            mode: 'proposal',
            action: 'filtertube.apply_sync_payload',
            scope: built.scope,
            payloadVersion: built.payloadVersion,
            summary: built.summary,
            payload: JSON.stringify({
                targetScope: built.scope,
                strategy: strategy === 'replace' ? 'replace' : (strategy === 'preview' ? 'preview' : 'merge'),
                portable: built.portable
            })
        };
    }

    function extractPortableFromEnvelope(envelope) {
        const root = safeObject(envelope);
        if (root.type === MANAGED_POLICY_ENVELOPE_TYPE) {
            throw new Error('Managed policy envelopes require validated managed apply flow');
        }
        if (root.t === 'app_sync') {
            return {
                scope: normalizeScope(root.scope),
                portable: JSON.parse(root.payload)
            };
        }
        if (root.t === 'control_proposal') {
            const proposal = safeObject(JSON.parse(root.payload));
            return {
                scope: normalizeScope(proposal.targetScope || root.scope),
                portable: proposal.portable
            };
        }
        throw new Error('Unsupported Nanah envelope for FilterTube');
    }

    async function applyIncomingEnvelope(envelope, { strategy = 'merge', auth = null, scope = null, targetProfileId = null } = {}) {
        const io = await getIO();
        const extracted = extractPortableFromEnvelope(envelope);
        const effectiveScope = normalizeScope(scope || extracted.scope);
        const effectiveStrategy = strategy === 'replace' ? 'replace' : (strategy === 'preview' ? 'preview' : 'merge');
        if (effectiveStrategy === 'preview') {
            return {
                ok: true,
                preview: true,
                scope: effectiveScope,
                portable: extracted.portable,
                summary: summarizePortablePayload(extracted.portable, effectiveScope)
            };
        }
        if (effectiveScope === 'main' || effectiveScope === 'kids') {
            return applyScopedPortablePayload(io, extracted.portable, {
                strategy: effectiveStrategy,
                targetProfileId
            });
        }
        return io.importV3(extracted.portable, {
            strategy: effectiveStrategy,
            scope: effectiveScope,
            auth,
            targetProfileId
        });
    }

    function getDeviceDescriptor(overrides = {}) {
        const root = safeObject(overrides);
        const label = normalizeString(root.deviceLabel)
            || normalizeString(global.navigator?.userAgentData?.platform)
            || normalizeString(global.navigator?.platform)
            || 'Browser device';
        const platform = normalizeString(root.platform)
            || normalizeString(global.navigator?.userAgentData?.platform)
            || normalizeString(global.navigator?.platform)
            || 'browser';
        const managedPublicKeyId = normalizeString(root.managedPublicKeyId || root.sourcePublicKeyId || root.publicKeyId);
        const managedPublicKeyJwk = safeObject(root.managedPublicKeyJwk || root.sourcePublicKeyJwk || root.publicKeyJwk);
        const managedKeyVersion = normalizeNonNegativeInteger(root.managedKeyVersion || root.keyVersion || root.sourceKeyVersion);
        const descriptor = {
            deviceId: normalizeString(root.deviceId) || generateId(),
            deviceLabel: label,
            app: APP_ID,
            appVersion: normalizeString(root.appVersion) || '',
            platform,
            capabilities: Array.isArray(root.capabilities) && root.capabilities.length > 0
                ? root.capabilities
                : DEFAULT_DEVICE_CAPABILITIES.slice()
        };
        if (managedPublicKeyId && Object.keys(managedPublicKeyJwk).length > 0 && managedKeyVersion > 0) {
            descriptor.managedPublicKeyId = managedPublicKeyId;
            descriptor.managedPublicKeyJwk = managedPublicKeyJwk;
            descriptor.managedKeyVersion = managedKeyVersion;
            descriptor.sourcePublicKeyId = managedPublicKeyId;
            descriptor.sourcePublicKeyJwk = managedPublicKeyJwk;
            descriptor.keyVersion = managedKeyVersion;
        }
        return descriptor;
    }

    global.FilterTubeNanahAdapter = {
        appId: APP_ID,
        payloadVersion: PAYLOAD_VERSION,
        supportedScopes: ['main', 'kids', 'active', 'full'],
        getDeviceDescriptor,
        summarizePortablePayload,
        buildPortablePayload,
        buildSyncEnvelope,
        buildControlProposal,
        validateManagedPolicyEnvelope,
        validateManagedMailboxItem,
        verifyManagedNanahPolicyIntegritySignature,
        createManagedNanahSigningKeyPair,
        signManagedPolicyEnvelope,
        applyManagedPolicyEnvelope,
        applyManagedMailboxItem,
        applyIncomingEnvelope,
        extractPortableFromEnvelope
    };
})(typeof window !== 'undefined' ? window : this);
