(function initFilterTubeManagedLocalNetworkClient(global) {
    'use strict';

    const CONFIG_KEY = 'ftManagedLocalNetworkProviderConfig';
    const PROVIDER_SCHEMA = 'filtertube_managed_local_network_provider';
    const PRIVATE_KEY_NAMES = new Set([
        'pin',
        'password',
        'privateKey',
        'privateKeyJwk',
        'authSecret',
        'secret'
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
        if (!host) return false;
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
        const privateHost = isPrivateHostname(url.hostname);
        if (url.protocol !== 'https:' && !(url.protocol === 'http:' && privateHost)) return null;
        url.hash = '';
        url.search = '';
        return url;
    }

    function normalizePathSegment(value) {
        return normalizeString(value).replace(/^\/+/, '').replace(/\/+$/, '');
    }

    function joinEndpoint(baseUrl, pathName) {
        const url = new URL(baseUrl.href);
        const basePath = url.pathname.replace(/\/+$/, '');
        const child = normalizePathSegment(pathName);
        url.pathname = `${basePath}/${child}`.replace(/\/{2,}/g, '/');
        return url.href;
    }

    function containsPrivateKey(value, seen = new WeakSet()) {
        if (!value || typeof value !== 'object') return false;
        if (seen.has(value)) return false;
        seen.add(value);
        if (Array.isArray(value)) return value.some(item => containsPrivateKey(item, seen));
        for (const [key, child] of Object.entries(value)) {
            if (PRIVATE_KEY_NAMES.has(key)) return true;
            if (containsPrivateKey(child, seen)) return true;
        }
        return false;
    }

    function normalizeServerResult(result, fallback = {}) {
        if (Array.isArray(result)) return { ok: true, ...fallback, candidates: result };
        return { ...fallback, ...safeObject(result), ok: safeObject(result).ok !== false };
    }

    function sanitizePeer(value) {
        const root = safeObject(value);
        const clean = {};
        for (const key of [
            'deviceId',
            'sourceDeviceId',
            'targetDeviceId',
            'publicKeyId',
            'sourcePublicKeyId',
            'managedPublicKeyId',
            'keyVersion',
            'networkReachable',
            'duplicateDeviceId',
            'source'
        ]) {
            if (root[key] !== undefined) clean[key] = root[key];
        }
        return clean;
    }

    function sanitizeEnvelopeCandidate(value) {
        const root = safeObject(value);
        if (!root || Object.keys(root).length === 0) return {};
        if (containsPrivateKey(root)) return {};
        return root;
    }

    function sanitizeCandidate(candidate) {
        const root = safeObject(candidate);
        const envelope = sanitizeEnvelopeCandidate(root.envelope || root.managedPolicyEnvelope || root.policy);
        const clean = {
            schema: normalizeString(root.schema) || 'filtertube_managed_local_network_candidate',
            version: Number(root.version) || 1,
            transport: 'local_network',
            candidateId: normalizeString(root.candidateId || root.localNetworkCandidateId),
            localNetworkCandidateId: normalizeString(root.localNetworkCandidateId || root.candidateId),
            linkId: normalizeString(root.linkId),
            targetProfileId: normalizeString(root.targetProfileId),
            sourceDeviceId: normalizeString(root.sourceDeviceId),
            sourceProfileId: normalizeString(root.sourceProfileId),
            scope: normalizeString(root.scope).toLowerCase(),
            revision: Number(root.revision) || null,
            policyHash: normalizeString(root.policyHash),
            sourcePublicKeyId: normalizeString(root.sourcePublicKeyId),
            keyVersion: Number(root.keyVersion) || 0,
            source: normalizeString(root.source),
            networkReachable: root.networkReachable,
            expiresAt: root.expiresAt ?? null,
            expiresAtMs: root.expiresAtMs ?? null,
            createdAtMs: root.createdAtMs ?? null
        };
        if (Object.keys(envelope).length > 0) clean.envelope = envelope;
        const peer = sanitizePeer(root.peer || root.discoveredPeer || root.discovery);
        if (Object.keys(peer).length > 0) clean.peer = peer;
        return clean;
    }

    function sanitizeDeliveryRequest(request) {
        const root = safeObject(request);
        const candidates = safeArray(root.candidates)
            .map(sanitizeCandidate)
            .filter(row => normalizeString(row.candidateId));
        return {
            ...root,
            transport: 'local_network',
            candidates,
            candidateCount: candidates.length
        };
    }

    function sanitizeDiscoveryRequest(request) {
        const root = safeObject(request);
        return {
            schema: normalizeString(root.schema) || 'filtertube_managed_local_network_discovery_request',
            version: Number(root.version) || 1,
            transport: 'local_network',
            reason: normalizeString(root.reason) || 'candidate_probe',
            requestedAt: Number(root.requestedAt) || Date.now(),
            linkId: normalizeString(root.linkId),
            targetProfileId: normalizeString(root.targetProfileId),
            sourceProfileId: normalizeString(root.sourceProfileId),
            sourceDeviceId: normalizeString(root.sourceDeviceId),
            targetDeviceId: normalizeString(root.targetDeviceId),
            remoteDeviceId: normalizeString(root.remoteDeviceId),
            scopes: safeArray(root.scopes || root.allowedScopes).map(item => normalizeString(item)).filter(Boolean),
            allowedScopes: safeArray(root.allowedScopes || root.scopes).map(item => normalizeString(item)).filter(Boolean)
        };
    }

    function sanitizeAckRequest(request) {
        const root = safeObject(request);
        return {
            ...root,
            schema: normalizeString(root.schema) || 'filtertube_managed_local_network_candidate_ack',
            transport: 'local_network',
            records: safeArray(root.records).map((record) => {
                const row = safeObject(record);
                return {
                    schema: normalizeString(row.schema) || 'filtertube_nanah_managed_open_sync_ack',
                    version: Number(row.version) || 1,
                    ackedAt: Number(row.ackedAt) || Date.now(),
                    linkId: normalizeString(row.linkId),
                    localNetworkCandidateId: normalizeString(row.localNetworkCandidateId || row.candidateId),
                    candidateId: normalizeString(row.candidateId || row.localNetworkCandidateId),
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
            }).filter(row => row.candidateId)
        };
    }

    function createProvider(config = {}, deps = {}) {
        const parsed = parseConfig(config);
        const endpointUrl = resolveEndpointUrl(parsed.endpointUrl || parsed.url || parsed.baseUrl);
        const fetchImpl = deps.fetch || global.fetch;
        const token = normalizeString(parsed.authToken || parsed.token || parsed.bearerToken);
        const publishPath = parsed.publishPath || 'managed-local-network/publish';
        const discoverPath = parsed.discoverPath || 'managed-local-network/discover';
        const ackPath = parsed.ackPath || 'managed-local-network/ack';

        function unavailable(reason) {
            return { schema: PROVIDER_SCHEMA, version: 1, ok: false, reason };
        }

        async function postJson(pathName, body) {
            if (!endpointUrl) return unavailable('local_network_endpoint_unconfigured');
            if (typeof fetchImpl !== 'function') return unavailable('local_network_fetch_unavailable');
            if (containsPrivateKey(body)) return unavailable('local_network_private_secret_refused');
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
                    reason: normalizeString(payload.reason || payload.error) || `local_network_http_${response.status}`
                };
            }
            return normalizeServerResult(payload);
        }

        async function publishManagedPolicyCandidates(request) {
            if (containsPrivateKey(request)) return unavailable('local_network_private_secret_refused');
            return postJson(publishPath, sanitizeDeliveryRequest(request));
        }

        async function discoverManagedPolicyCandidates(request) {
            const result = await postJson(discoverPath, sanitizeDiscoveryRequest(request));
            if (result.ok === false) return { ...result, candidates: [] };
            return {
                ...result,
                candidates: safeArray(result.candidates || result.items).map(sanitizeCandidate)
            };
        }

        async function ackLocalNetworkCandidates(request) {
            return postJson(ackPath, sanitizeAckRequest(request));
        }

        return {
            schema: PROVIDER_SCHEMA,
            version: 1,
            configured: !!endpointUrl,
            transport: 'local_network',
            endpointHost: endpointUrl?.host || '',
            publishManagedPolicyCandidates,
            deliverManagedPolicyCandidates: publishManagedPolicyCandidates,
            publishLocalNetworkCandidates: publishManagedPolicyCandidates,
            putManagedPolicyCandidates: publishManagedPolicyCandidates,
            discoverManagedPolicyCandidates,
            discoverLocalNetworkCandidates: discoverManagedPolicyCandidates,
            ackLocalNetworkCandidates,
            ackManagedPolicyCandidates: ackLocalNetworkCandidates
        };
    }

    function readConfiguredProvider() {
        const explicit = safeObject(global.FilterTubeManagedLocalNetworkConfig);
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
        if (global.FilterTubeManagedPolicyLocalNetwork) return global.FilterTubeManagedPolicyLocalNetwork;
        const provider = readConfiguredProvider();
        if (provider && provider.configured) {
            global.FilterTubeManagedPolicyLocalNetwork = provider;
        }
        return global.FilterTubeManagedPolicyLocalNetwork || null;
    }

    global.FilterTubeManagedLocalNetworkClient = {
        CONFIG_KEY,
        createProvider,
        installConfiguredProvider
    };

    installConfiguredProvider();
})(typeof window !== 'undefined' ? window : globalThis);
