(function initFilterTubeManagedMailboxClient(global) {
    'use strict';

    const CONFIG_KEY = 'ftManagedMailboxServerConfig';
    const PROVIDER_SCHEMA = 'filtertube_managed_mailbox_server_provider';
    const FORBIDDEN_PLAINTEXT_KEYS = new Set([
        'payload',
        'policy',
        'keywords',
        'channels',
        'videos',
        'videoIds',
        'whitelistKeywords',
        'whitelistChannels',
        'blockedKeywords',
        'blockedChannels',
        'pin',
        'password',
        'privateKey',
        'privateKeyJwk'
    ]);

    function normalizeString(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function safeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function normalizePathSegment(value) {
        const segment = normalizeString(value).replace(/^\/+/, '').replace(/\/+$/, '');
        return segment || '';
    }

    function parseConfig(raw) {
        if (typeof raw === 'string') {
            try {
                return safeObject(JSON.parse(raw));
            } catch (_) {
                return {};
            }
        }
        return safeObject(raw);
    }

    function isPrivateHostname(hostname) {
        const host = normalizeString(hostname).toLowerCase();
        if (!host) return true;
        if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
        if (host === '127.0.0.1' || host === '::1' || host.startsWith('127.')) return true;
        if (/^10\./.test(host)) return true;
        if (/^192\.168\./.test(host)) return true;
        const private172 = host.match(/^172\.(\d+)\./);
        if (private172) {
            const octet = Number(private172[1]);
            if (octet >= 16 && octet <= 31) return true;
        }
        return false;
    }

    function resolveEndpointUrl(endpointUrl) {
        const raw = normalizeString(endpointUrl);
        if (!raw) return null;
        let url;
        try {
            url = new URL(raw);
        } catch (_) {
            return null;
        }
        if (url.protocol !== 'https:') return null;
        if (isPrivateHostname(url.hostname)) return null;
        url.hash = '';
        url.search = '';
        return url;
    }

    function joinEndpoint(baseUrl, pathName) {
        const url = new URL(baseUrl.href);
        const basePath = url.pathname.replace(/\/+$/, '');
        const child = normalizePathSegment(pathName);
        url.pathname = `${basePath}/${child}`.replace(/\/{2,}/g, '/');
        return url.href;
    }

    function hasForbiddenPlaintextKey(value, seen = new WeakSet()) {
        if (!value || typeof value !== 'object') return false;
        if (seen.has(value)) return false;
        seen.add(value);
        if (Array.isArray(value)) {
            return value.some(item => hasForbiddenPlaintextKey(item, seen));
        }
        for (const [key, child] of Object.entries(value)) {
            if (FORBIDDEN_PLAINTEXT_KEYS.has(key)) return true;
            if (hasForbiddenPlaintextKey(child, seen)) return true;
        }
        return false;
    }

    function sanitizeMailboxItem(item) {
        const root = safeObject(item);
        const clean = {};
        for (const key of [
            'schema',
            'version',
            'mailboxItemId',
            'linkId',
            'targetProfileId',
            'sourceDeviceId',
            'sourceProfileId',
            'scope',
            'revision',
            'policyHash',
            'sourcePublicKeyId',
            'keyVersion',
            'cipherSuite',
            'keyAgreementId',
            'encryptedDek',
            'nonce',
            'ciphertext',
            'ciphertextHash',
            'createdAtMs',
            'expiresAtMs',
            'ackState'
        ]) {
            if (root[key] !== undefined) clean[key] = root[key];
        }
        return clean;
    }

    function sanitizeUploadRequest(request) {
        const root = safeObject(request);
        const rows = safeArray(root.items).map(sanitizeMailboxItem).filter(row => normalizeString(row.mailboxItemId));
        return {
            ...root,
            items: rows,
            mailboxItemCount: rows.length
        };
    }

    function sanitizeAckRequest(request) {
        const root = safeObject(request);
        return {
            ...root,
            records: safeArray(root.records).map((record) => {
                const row = safeObject(record);
                return {
                    schema: normalizeString(row.schema) || 'filtertube_nanah_managed_open_sync_ack',
                    version: Number(row.version) || 1,
                    ackedAt: Number(row.ackedAt) || Date.now(),
                    linkId: normalizeString(row.linkId),
                    mailboxItemId: normalizeString(row.mailboxItemId),
                    targetProfileId: normalizeString(row.targetProfileId),
                    sourceDeviceId: normalizeString(row.sourceDeviceId),
                    sourceProfileId: normalizeString(row.sourceProfileId),
                    scope: normalizeString(row.scope).toLowerCase(),
                    revision: Number(row.revision) || null,
                    policyHash: normalizeString(row.policyHash),
                    ackState: normalizeString(row.ackState) || 'rejected',
                    accepted: row.accepted === true,
                    applied: row.applied === true,
                    decision: normalizeString(row.decision),
                    reason: normalizeString(row.reason) || null
                };
            }).filter(row => row.mailboxItemId)
        };
    }

    function sanitizeDeliveryAckPullRequest(request) {
        const root = safeObject(request);
        return {
            schema: normalizeString(root.schema) || 'filtertube_managed_source_delivery_ack_request',
            version: Number(root.version) || 1,
            reason: normalizeString(root.reason) || 'dashboard_open',
            requestedAt: Number(root.requestedAt) || Date.now(),
            linkId: normalizeString(root.linkId),
            remoteDeviceId: normalizeString(root.remoteDeviceId),
            sourceDeviceId: normalizeString(root.sourceDeviceId),
            sourceProfileId: normalizeString(root.sourceProfileId),
            targetProfileId: normalizeString(root.targetProfileId),
            allowedScopes: safeArray(root.allowedScopes).map(scope => normalizeString(scope).toLowerCase()).filter(Boolean),
            sentPolicies: safeArray(root.sentPolicies).map((policy) => {
                const row = safeObject(policy);
                return {
                    scope: normalizeString(row.scope).toLowerCase(),
                    revision: Number(row.revision) || null,
                    policyHash: normalizeString(row.policyHash),
                    sentAt: Number(row.sentAt) || null,
                    lastAckAt: Number(row.lastAckAt) || null,
                    lastAckState: normalizeString(row.lastAckState) || null,
                    lastAckResult: normalizeString(row.lastAckResult) || null
                };
            }).filter(row => row.scope && row.revision && row.policyHash)
        };
    }

    function sanitizeDeliveryAckPayload(payload) {
        const root = safeObject(payload);
        if (hasForbiddenPlaintextKey(root)) return {};
        return {
            schema: normalizeString(root.schema) || 'filtertube_nanah_managed_open_sync_ack',
            version: Number(root.version) || 1,
            ackedAt: Number(root.ackedAt) || Date.now(),
            linkId: normalizeString(root.linkId),
            mailboxItemId: normalizeString(root.mailboxItemId),
            targetProfileId: normalizeString(root.targetProfileId),
            sourceDeviceId: normalizeString(root.sourceDeviceId),
            sourceProfileId: normalizeString(root.sourceProfileId),
            scope: normalizeString(root.scope).toLowerCase(),
            revision: Number(root.revision) || null,
            policyHash: normalizeString(root.policyHash),
            ackState: normalizeString(root.ackState) || 'rejected',
            accepted: root.accepted === true,
            applied: root.applied === true,
            decision: normalizeString(root.decision),
            reason: normalizeString(root.reason) || null
        };
    }

    function normalizeServerResult(result, fallback = {}) {
        if (Array.isArray(result)) return { ok: true, ...fallback, items: result };
        return { ...fallback, ...safeObject(result), ok: safeObject(result).ok !== false };
    }

    function createProvider(config = {}, deps = {}) {
        const parsed = parseConfig(config);
        const endpointUrl = resolveEndpointUrl(parsed.endpointUrl || parsed.url || parsed.baseUrl);
        const fetchImpl = deps.fetch || global.fetch;
        const adapter = deps.adapter || global.FilterTubeNanahAdapter;
        const token = normalizeString(parsed.authToken || parsed.token || parsed.bearerToken);
        const uploadPath = parsed.uploadPath || 'managed-mailbox/upload';
        const pullPath = parsed.pullPath || 'managed-mailbox/pull';
        const ackPath = parsed.ackPath || 'managed-mailbox/ack';
        const ackPullPath = parsed.ackPullPath || parsed.deliveryAckPath || 'managed-mailbox/ack/pull';
        const purgePath = parsed.purgePath || 'managed-mailbox/purge';

        function unavailable(reason) {
            return { schema: PROVIDER_SCHEMA, version: 1, ok: false, reason };
        }

        async function postJson(pathName, body) {
            if (!endpointUrl) return unavailable('mailbox_endpoint_unconfigured');
            if (typeof fetchImpl !== 'function') return unavailable('mailbox_fetch_unavailable');
            if (hasForbiddenPlaintextKey(body)) return unavailable('mailbox_plaintext_refused');
            const response = await fetchImpl(joinEndpoint(endpointUrl, pathName), {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    ...(token ? { authorization: `Bearer ${token}` } : {})
                },
                credentials: 'omit',
                cache: 'no-store',
                body: JSON.stringify(body)
            });
            let payload = {};
            try {
                payload = await response.json();
            } catch (_) {
                payload = {};
            }
            if (!response.ok) {
                return {
                    schema: PROVIDER_SCHEMA,
                    version: 1,
                    ok: false,
                    reason: normalizeString(payload.reason || payload.error) || `mailbox_http_${response.status}`
                };
            }
            return normalizeServerResult(payload);
        }

        async function uploadManagedMailboxItems(request) {
            const sanitized = sanitizeUploadRequest(request);
            return postJson(uploadPath, sanitized);
        }

        async function purgeManagedMailboxItems(request) {
            return postJson(purgePath, safeObject(request));
        }

        async function ackMailboxItems(request) {
            return postJson(ackPath, sanitizeAckRequest(request));
        }

        async function pullManagedDeliveryAcks(request) {
            const result = await postJson(ackPullPath, sanitizeDeliveryAckPullRequest(request));
            if (result.ok === false) return { ...result, acks: [] };
            return {
                ...result,
                acks: safeArray(result.acks || result.items || result.payloads)
                    .map(sanitizeDeliveryAckPayload)
                    .filter(row => row.linkId && row.scope && row.revision && row.policyHash)
            };
        }

        async function pullDecryptedMailboxItems(request) {
            const requestRoot = safeObject(request);
            const { trustedLink, link, ...serverRequest } = requestRoot;
            const result = await postJson(pullPath, serverRequest);
            if (result.ok === false) return result;
            const storageItems = safeArray(result.items || result.mailboxItems);
            if (storageItems.length === 0) return { ...result, items: [] };
            if (!adapter || typeof adapter.openManagedMailboxStorageItem !== 'function') {
                return { ok: false, reason: 'mailbox_decrypt_adapter_unavailable', items: [] };
            }
            const items = [];
            const localTrustedLink = safeObject(trustedLink || link);
            for (const item of storageItems) {
                items.push(await adapter.openManagedMailboxStorageItem(item, {
                    trustedLink: localTrustedLink
                }));
            }
            return { ...result, items };
        }

        return {
            schema: PROVIDER_SCHEMA,
            version: 1,
            configured: !!endpointUrl,
            transport: 'encrypted_mailbox',
            requiresSealedMailboxItems: true,
            endpointHost: endpointUrl?.host || '',
            uploadManagedMailboxItems,
            publishManagedMailboxItems: uploadManagedMailboxItems,
            putManagedMailboxItems: uploadManagedMailboxItems,
            enqueueManagedMailboxItems: uploadManagedMailboxItems,
            pullDecryptedMailboxItems,
            ackMailboxItems,
            ackDecryptedMailboxItems: ackMailboxItems,
            pullManagedDeliveryAcks,
            pullRemoteDeliveryAcks: pullManagedDeliveryAcks,
            getManagedDeliveryAcks: pullManagedDeliveryAcks,
            purgeManagedMailboxItems
        };
    }

    function readConfiguredProvider() {
        const explicit = safeObject(global.FilterTubeManagedMailboxServerConfig);
        const localRaw = (() => {
            try {
                return global.localStorage?.getItem(CONFIG_KEY);
            } catch (_) {
                return '';
            }
        })();
        const config = Object.keys(explicit).length > 0 ? explicit : parseConfig(localRaw);
        if (!normalizeString(config.endpointUrl || config.url || config.baseUrl)) return null;
        return createProvider(config);
    }

    function installConfiguredProvider() {
        if (global.FilterTubeManagedPolicyMailbox) {
            if (!global.FilterTubeManagedPolicyOpenSync) {
                global.FilterTubeManagedPolicyOpenSync = global.FilterTubeManagedPolicyMailbox;
            }
            return global.FilterTubeManagedPolicyMailbox;
        }
        const provider = readConfiguredProvider();
        if (provider && provider.configured) {
            global.FilterTubeManagedPolicyMailbox = provider;
            global.FilterTubeManagedPolicyOpenSync = provider;
        }
        return global.FilterTubeManagedPolicyMailbox || null;
    }

    global.FilterTubeManagedMailboxClient = {
        CONFIG_KEY,
        createProvider,
        installConfiguredProvider
    };

    installConfiguredProvider();
})(typeof window !== 'undefined' ? window : globalThis);
