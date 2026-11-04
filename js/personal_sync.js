/* Private personal-profile sync contract. Transport and local authorization belong to the caller. */
(function (root, factory) {
    const notes = typeof module === 'object' && module.exports
        ? require('./shared/saved_video_notes.js') : root.FilterTubeSavedVideoNotes;
    const playlists = typeof module === 'object' && module.exports
        ? require('./shared/local_playlists.js') : root.FilterTubeLocalPlaylists;
    const api = factory(notes, playlists, root);
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.FilterTubePersonalSync = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (notes, playlists, root) {
    'use strict';
    // Settings and notes together stay within 512 KiB. The playlists area has its own 2 MiB
    // budget (UTF-8 bytes of its encoded envelope), the same cap Android and iOS use.
    const MAX_BYTES = 512 * 1024;
    const PLAYLISTS_MAX_BYTES = 2 * 1024 * 1024;
    const MESSAGE_MAX_BYTES = 3 * 1024 * 1024;
    const GRANT_SCHEMA = 'filtertube.personal-sync-grant';
    const MESSAGE_SCHEMA = 'filtertube.personal-sync';
    const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
    const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
    const AREAS = ['settings', 'notes', 'playlists'];
    const booleanSettings = [
        'enabled', 'syncKidsToMain', 'hideShorts', 'hideComments', 'hideHomeFeed',
        'hideSponsoredCards', 'contentOnlyPlayback', 'hidePlayables', 'hideWatchPlaylistPanel',
        'hidePlaylistCards', 'hideMembersOnly', 'hideMixPlaylists', 'hideVideoSidebar',
        'hideRecommended', 'hideLiveChat', 'hideVideoInfo', 'hideVideoButtonsBar', 'hideAskButton',
        'hideVideoChannelRow', 'hideVideoDescription', 'hideMerchTicketsOffers',
        'hideEndscreenVideowall', 'hideEndscreenCards', 'disableAutoplay', 'skipBlockedAutoplay', 'alwaysUseOriginalAudio',
        'disableAnnotations', 'hideTopHeader', 'hideNotificationBell', 'hideExploreTrending',
        'hideMoreFromYouTube', 'hideSubscriptions', 'showQuickBlockButton', 'showBlockMenuItem',
        'hideSearchShelves'
    ];
    const sectionFields = {
        settings: [...booleanSettings, 'contentFilters', 'categoryFilters', 'languageFilters'],
        main: ['mode', 'channels', 'keywords', 'whitelistChannels', 'whitelistKeywords', 'videoIds', 'allowedVideoIds'],
        kids: ['mode', 'strictMode', 'blockedChannels', 'blockedKeywords', 'whitelistChannels', 'whitelistKeywords', 'videoIds', 'contentFilters', 'categoryFilters']
    };
    const contentGroups = {
        views: ['enabled', 'minViews'],
        duration: ['enabled', 'condition', 'value', 'minMinutes', 'maxMinutes', 'mode'],
        uploadDate: ['enabled', 'condition', 'value', 'fromDate', 'toDate', 'unit', 'valueMax', 'unitMax'],
        uppercase: ['enabled', 'mode', 'minWordLength']
    };
    const durationAliases = { minMinutes: ['minutes', 'valueMinutes', 'minutesMin'], maxMinutes: ['minutesMax', 'valueMinutesMax'] };
    const channelFields = ['id', 'name', 'handle', 'handleDisplay', 'canonicalHandle', 'logo', 'customUrl',
        'filterAll', 'filterAllComments', 'source', 'originalInput', 'addedAt', 'modeBootstrapCopy'];
    const keywordFields = ['word', 'exact', 'semantic', 'source', 'channelRef', 'comments', 'matchMode',
        'regexFlags', 'scope', 'dateFilter', 'modeBootstrapCopy', 'addedAt'];
    function requireValue(ok, reason = 'invalid_personal_sync') { if (!ok) throw Error(reason); }
    function object(value) {
        requireValue(value !== null && typeof value === 'object' && !Array.isArray(value));
        const proto = Object.getPrototypeOf(value);
        requireValue(proto === Object.prototype || proto === null);
        for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
            requireValue(!forbidden.has(key) && descriptor.enumerable && own(descriptor, 'value'));
        }
        requireValue(Object.getOwnPropertySymbols(value).length === 0);
        return value;
    }
    function fields(value, names, required = names) {
        object(value);
        requireValue(Object.keys(value).every(key => names.includes(key)) && required.every(key => own(value, key)));
    }
    function validUnicode(value) {
        for (let i = 0; i < value.length; i++) {
            const unit = value.charCodeAt(i);
            if (unit >= 0xd800 && unit <= 0xdbff) {
                const next = value.charCodeAt(++i);
                if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
            } else if (unit >= 0xdc00 && unit <= 0xdfff) return false;
        }
        return true;
    }
    function id(value) {
        requireValue(typeof value === 'string' && value.length > 0 && value.length <= 1024
            && value.trim().length > 0 && validUnicode(value));
        return value; // Profile and grant IDs are exact, including case and meaningful whitespace.
    }
    function generation(value) { requireValue(Number.isSafeInteger(value) && value > 0); return value; }
    function plain(value, depth = 0, count = { keys: 0 }) {
        requireValue(depth <= 10 && ++count.keys <= 300000);
        if (value === null || typeof value === 'boolean') return value;
        if (typeof value === 'number') { requireValue(Number.isFinite(value)); return value; }
        if (typeof value === 'string') {
            requireValue(value.length <= MAX_BYTES && validUnicode(value)); return value;
        }
        if (Array.isArray(value)) {
            requireValue(value.length <= 10000 && Object.keys(value).length === value.length
                && Object.getOwnPropertySymbols(value).length === 0);
            for (let index = 0; index < value.length; index++) {
                const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
                requireValue(!!descriptor && descriptor.enumerable && own(descriptor, 'value'));
            }
            return value.map(item => plain(item, depth + 1, count));
        }
        object(value);
        const result = {};
        for (const key of Object.keys(value).sort()) {
            requireValue(key.length <= 1024 && validUnicode(key));
            result[key] = plain(value[key], depth + 1, count);
        }
        return result;
    }
    function canonical(value, limit = MAX_BYTES) {
        const result = JSON.stringify(plain(value));
        requireValue(new TextEncoder().encode(result).length <= limit, 'personal_sync_too_large');
        return result;
    }
    function clone(value) { return JSON.parse(canonical(value)); }
    function publicKey(value) {
        fields(value, ['kty', 'crv', 'x', 'ext', 'key_ops', 'alg'], ['kty', 'crv', 'x']);
        requireValue(value.kty === 'OKP' && value.crv === 'Ed25519'
            && typeof value.x === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value.x));
        if (own(value, 'ext')) requireValue(typeof value.ext === 'boolean');
        if (own(value, 'key_ops')) requireValue(Array.isArray(value.key_ops)
            && value.key_ops.length === 1 && value.key_ops[0] === 'verify');
        if (own(value, 'alg')) requireValue(value.alg === 'EdDSA' || value.alg === 'Ed25519');
        return { kty: 'OKP', crv: 'Ed25519', x: value.x };
    }
    function normalizeGrant(value) {
        fields(value, ['schema', 'version', 'localDeviceId', 'localProfileId', 'remoteDeviceId', 'remoteProfileId',
            'localGrantId', 'remoteGrantId', 'localGeneration', 'remoteGeneration', 'areas', 'enabled',
            'localPublicKeyJwk', 'remotePublicKeyJwk'], ['localDeviceId', 'localProfileId', 'remoteDeviceId',
            'remoteProfileId', 'localGrantId', 'remoteGrantId', 'localGeneration', 'remoteGeneration',
            'areas', 'enabled', 'localPublicKeyJwk', 'remotePublicKeyJwk']);
        if (own(value, 'schema')) requireValue(value.schema === GRANT_SCHEMA);
        if (own(value, 'version')) requireValue(value.version === 1);
        requireValue(typeof value.enabled === 'boolean');
        requireValue(Array.isArray(value.areas) && value.areas.length >= 1 && value.areas.length <= AREAS.length
            && new Set(value.areas).size === value.areas.length
            && value.areas.every(area => AREAS.includes(area)));
        const result = { schema: GRANT_SCHEMA, version: 1, enabled: value.enabled, areas: value.areas.slice().sort() };
        for (const key of ['localDeviceId', 'localProfileId', 'remoteDeviceId', 'remoteProfileId', 'localGrantId', 'remoteGrantId']) result[key] = id(value[key]);
        requireValue(result.localDeviceId !== result.remoteDeviceId, 'same_device_identity');
        result.localGeneration = generation(value.localGeneration);
        result.remoteGeneration = generation(value.remoteGeneration);
        result.localPublicKeyJwk = publicKey(value.localPublicKeyJwk);
        result.remotePublicKeyJwk = publicKey(value.remotePublicKeyJwk);
        return clone(result);
    }
    function peerBinding(links, remoteDeviceId) {
        try {
            id(remoteDeviceId);
            if (!Array.isArray(links)) return null;
            const matches = links.filter(link => link && link.remoteDeviceId === remoteDeviceId
                && link.linkType === 'peer_link' && link.localRole === 'peer' && link.remoteRole === 'peer'
                && link.enabled !== false && !['revoked', 'keyRevoked', 'stalePairing', 'quarantined']
                    .some(key => link[key] === true || link.policy?.[key] === true));
            if (matches.length !== 1) return null;
            const link = object(matches[0]), policy = link.policy === undefined ? {} : object(link.policy);
            const result = { linkId: link.linkId ?? null, createdAt: link.createdAt ?? null,
                linkType: link.linkType, localRole: link.localRole, remoteRole: link.remoteRole, remoteDeviceId };
            for (const key of ['sourcePublicKeyId', 'sourcePublicKeyJwk', 'keyVersion']) {
                if (link[key] != null && policy[key] != null && canonical(link[key]) !== canonical(policy[key])) return null;
                result[key] = link[key] ?? policy[key] ?? null;
            }
            if (result.linkId !== null) id(result.linkId);
            if (result.createdAt !== null) id(result.createdAt);
            if (result.sourcePublicKeyId !== null) id(result.sourcePublicKeyId);
            if (result.keyVersion !== null) requireValue(Number.isSafeInteger(result.keyVersion) && result.keyVersion >= 0);
            if (result.sourcePublicKeyJwk !== null && Object.keys(object(result.sourcePublicKeyJwk)).length) {
                result.sourcePublicKeyJwk = publicKey(result.sourcePublicKeyJwk);
            }
            return canonical(result);
        } catch (_) { return null; }
    }
    function validateList(list, name) {
        requireValue(Array.isArray(list) && list.length <= 10000);
        const videos = name === 'videoIds' || name === 'allowedVideoIds';
        const channels = /Channels$/.test(name) || name === 'channels';
        for (const entry of list) {
            if (videos) { requireValue(typeof entry === 'string' && /^[A-Za-z0-9_-]{11}$/.test(entry)); continue; }
            if (channels && typeof entry === 'string') { id(entry); continue; }
            fields(entry, channels ? channelFields : keywordFields, channels ? [] : ['word']);
            if (channels) requireValue(['id', 'handle', 'name', 'customUrl'].some(key => typeof entry[key] === 'string' && entry[key].length));
            for (const [key, value] of Object.entries(entry)) {
                if (['filterAll', 'filterAllComments', 'modeBootstrapCopy', 'exact', 'semantic', 'comments'].includes(key)) requireValue(typeof value === 'boolean');
                else if (key === 'addedAt') requireValue(value === null || (Number.isFinite(value) && value >= 0));
                else if (key === 'dateFilter' && value !== null) {
                    fields(value, ['enabled', 'condition', 'fromDate', 'toDate']);
                    requireValue(typeof value.enabled === 'boolean' && ['before', 'after', 'between'].includes(value.condition)
                        && typeof value.fromDate === 'string' && typeof value.toDate === 'string');
                } else requireValue(value === null || typeof value === 'string');
            }
            if (!channels) {
                requireValue(typeof entry.word === 'string' && entry.word.length > 0 && entry.word.length <= 16000);
                if (own(entry, 'matchMode')) requireValue(['literal', 'regex'].includes(entry.matchMode));
                if (own(entry, 'regexFlags')) requireValue(typeof entry.regexFlags === 'string' && /^[gimsuy]*$/.test(entry.regexFlags));
                if (own(entry, 'scope')) requireValue(entry.scope === null || ['title', 'channel_name', 'comment'].includes(entry.scope));
            }
        }
    }
    function validateSettings(value) {
        canonical(value); fields(value, ['settings', 'main', 'kids']);
        for (const section of Object.keys(sectionFields)) {
            fields(value[section], sectionFields[section], []);
            for (const [key, item] of Object.entries(value[section])) {
                if (key === 'contentFilters') validateContentFilters(item);
                else if (key === 'categoryFilters' || key === 'languageFilters') validateSelection(item, key === 'languageFilters');
                else if (section === 'settings') {
                    requireValue(typeof item === 'boolean');
                } else if (key === 'mode') requireValue(item === 'whitelist' || item === 'blocklist');
                else if (key === 'strictMode') requireValue(typeof item === 'boolean');
                else validateList(item, key);
            }
        }
        return clone(value);
    }
    function validateSelection(value, language) {
        fields(value, ['enabled', 'mode', 'selected'], []);
        if (own(value, 'enabled')) requireValue(typeof value.enabled === 'boolean');
        if (own(value, 'mode')) requireValue(value.mode === 'allow' || value.mode === 'block');
        if (own(value, 'selected')) {
            requireValue(Array.isArray(value.selected) && value.selected.length <= 256
                && new Set(value.selected).size === value.selected.length);
            for (const selected of value.selected) requireValue(typeof selected === 'string' && selected.length > 0
                && selected.length <= 128 && (!language || /^[A-Za-z]{2,8}(?:[-_][A-Za-z0-9]{1,8})*$/.test(selected)));
        }
    }
    function validateContentFilters(value) {
        fields(value, Object.keys(contentGroups), []);
        const numeric = number => typeof number === 'number' && Number.isFinite(number) && number >= 0 && number <= Number.MAX_SAFE_INTEGER;
        for (const [group, rule] of Object.entries(value)) {
            fields(rule, contentGroups[group], []);
            for (const [key, item] of Object.entries(rule)) {
                if (key === 'enabled') requireValue(typeof item === 'boolean');
                else if (key === 'minViews') requireValue(Number.isSafeInteger(item) && item >= 0);
                else if (key === 'minWordLength') requireValue(Number.isSafeInteger(item) && item >= 0 && item <= 16000);
                else if (['minMinutes', 'maxMinutes', 'valueMax'].includes(key)) requireValue(numeric(item));
                else if (key === 'condition') requireValue((group === 'duration' ? ['longer', 'shorter', 'between'] : ['newer', 'older', 'between']).includes(item));
                else if (key === 'mode') requireValue((group === 'uppercase' ? ['single_word', 'all_caps', 'both'] : ['allow', 'block']).includes(item));
                else if (key === 'unit' || key === 'unitMax') requireValue(['', 'days', 'weeks', 'months', 'years'].includes(item));
                else if (key === 'fromDate' || key === 'toDate') requireValue(typeof item === 'string' && item.length <= 40
                    && (item === '' || /^\d{4}-\d{2}-\d{2}(?:T[0-9:.]+Z)?$/.test(item) && Number.isFinite(Date.parse(item))));
                else if (key === 'value') requireValue(numeric(item) || typeof item === 'string' && item.length <= 80
                    && /^(?:\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?)?$/.test(item));
            }
        }
    }
    function selectedContentFilters(value) {
        object(value); const result = {};
        for (const [group, names] of Object.entries(contentGroups)) {
            if (!own(value, group)) continue;
            const rule = object(value[group]), selected = {};
            for (const key of names) {
                const alias = group === 'duration' ? durationAliases[key]?.find(name => own(rule, name)) : null;
                if (own(rule, key)) selected[key] = rule[key];
                else if (alias) selected[key] = rule[alias];
            }
            result[group] = selected;
        }
        return result;
    }
    function snapshotSettings(profile) {
        object(profile);
        // This is a data selector, never permission to edit a child or managed profile.
        const result = { settings: {}, main: {}, kids: {} };
        for (const [section, keys] of Object.entries(sectionFields)) {
            const source = profile[section] === undefined ? {} : object(profile[section]);
            for (const key of keys) {
                const alias = section === 'main' ? { channels: 'blockedChannels', keywords: 'blockedKeywords', videoIds: 'blockedVideoIds' }[key] : null;
                const legacy = section === 'settings' && ['contentFilters', 'categoryFilters', 'languageFilters', 'syncKidsToMain'].includes(key)
                    ? profile.main?.[key === 'syncKidsToMain' ? 'applyKidsRulesOnMain' : key] : undefined;
                const value = own(source, key) ? source[key] : alias && own(source, alias) ? source[alias] : legacy;
                if (value === undefined) continue;
                if (key === 'contentFilters') {
                    result[section].contentFilters = selectedContentFilters(value);
                } else if (key === 'categoryFilters' || key === 'languageFilters') {
                    const selection = object(value);
                    result[section][key] = Object.fromEntries(['enabled', 'mode', 'selected'].filter(field => own(selection, field)).map(field => [field, selection[field]]));
                } else if (Array.isArray(value) && !['videoIds', 'allowedVideoIds'].includes(key)) {
                    const channels = /Channels$/.test(key) || key === 'channels';
                    result[section][key] = value.map(entry => typeof entry === 'string' ? entry
                        : Object.fromEntries((channels ? channelFields : keywordFields).filter(field => own(object(entry), field)).map(field => [field, entry[field]])));
                } else result[section][key] = value;
            }
        }
        return validateSettings(result);
    }
    function mergeSettings(base, local, remote) {
        base = validateSettings(base); local = validateSettings(local); remote = validateSettings(remote);
        const next = { settings: {}, main: {}, kids: {} }, conflicts = [];
        const same = (a, b, key) => own(a, key) === own(b, key) && (!own(a, key) || canonical(a[key]) === canonical(b[key]));
        for (const section of Object.keys(next)) for (const key of sectionFields[section]) {
            if (key === 'contentFilters') {
                const combined = {};
                for (const group of Object.keys(contentGroups)) {
                    const b = base[section].contentFilters || {}, l = local[section].contentFilters || {}, r = remote[section].contentFilters || {};
                    let selected;
                    if (same(l, r, group)) selected = l;
                    else if (same(l, b, group)) selected = r;
                    else if (same(r, b, group)) selected = l;
                    else { conflicts.push(section + '.contentFilters.' + group); continue; }
                    if (own(selected, group)) combined[group] = selected[group];
                }
                if (Object.keys(combined).length || own(local[section], key) && own(remote[section], key)) next[section][key] = combined;
                continue;
            }
            let source;
            if (same(local[section], remote[section], key)) source = local[section];
            else if (same(local[section], base[section], key)) source = remote[section];
            else if (same(remote[section], base[section], key)) source = local[section];
            else { conflicts.push(section + '.' + key); continue; }
            if (own(source, key)) next[section][key] = source[key];
        }
        return { ok: conflicts.length === 0, snapshot: conflicts.length ? local : validateSettings(next), conflicts };
    }
    function applySettings(profile, snapshot) {
        object(profile); snapshot = validateSettings(snapshot);
        const result = clone(profile);
        for (const [section, keys] of Object.entries(sectionFields)) {
            const target = result[section] === undefined ? {} : object(result[section]);
            for (const key of keys) {
                if (key === 'contentFilters') {
                    const retained = target.contentFilters === undefined ? {} : clone(object(target.contentFilters));
                    for (const [group, names] of Object.entries(contentGroups)) {
                        const rule = retained[group] === undefined ? {} : object(retained[group]);
                        for (const name of names) {
                            delete rule[name];
                            if (own(snapshot[section].contentFilters?.[group] || {}, name)) rule[name] = snapshot[section].contentFilters[group][name];
                        }
                        if (group === 'duration') for (const [name, aliases] of Object.entries(durationAliases)) for (const alias of aliases) {
                            if (own(rule, alias)) { delete rule[alias]; if (own(rule, name)) rule[alias] = rule[name]; }
                        }
                        if (Object.keys(rule).length || own(snapshot[section].contentFilters || {}, group)) retained[group] = rule; else delete retained[group];
                    }
                    if (Object.keys(retained).length) target.contentFilters = retained; else delete target.contentFilters;
                } else if (key === 'categoryFilters' || key === 'languageFilters') {
                    const retained = target[key] === undefined ? {} : clone(object(target[key]));
                    for (const name of ['enabled', 'mode', 'selected']) { delete retained[name]; if (own(snapshot[section][key] || {}, name)) retained[name] = snapshot[section][key][name]; }
                    if (Object.keys(retained).length || own(snapshot[section], key)) target[key] = retained; else delete target[key];
                } else { delete target[key]; if (own(snapshot[section], key)) target[key] = snapshot[section][key]; }
            }
            result[section] = target;
        }
        // Existing aliases must never retain a removed rule after a reviewed snapshot is applied.
        for (const [alias, canonicalKey] of [['blockedChannels', 'channels'], ['blockedKeywords', 'keywords'], ['blockedVideoIds', 'videoIds']]) {
            if (own(result.main, alias)) {
                delete result.main[alias];
                if (own(result.main, canonicalKey)) result.main[alias] = clone(result.main[canonicalKey]);
            }
        }
        for (const key of ['contentFilters', 'categoryFilters', 'languageFilters', 'applyKidsRulesOnMain']) {
            if (!own(result.main, key)) continue;
            const canonicalKey = key === 'applyKidsRulesOnMain' ? 'syncKidsToMain' : key;
            delete result.main[key];
            if (own(result.settings, canonicalKey)) result.main[key] = clone(result.settings[canonicalKey]);
        }
        return result;
    }
    function noteEnvelope(value, profileId) {
        requireValue(!!notes, 'notes_contract_unavailable');
        canonical(value);
        return notes.decode(JSON.stringify(value), [profileId]);
    }
    function mergeNotes(localEntries, remoteEnvelope, grant) {
        grant = normalizeGrant(grant);
        requireValue(grant.enabled && grant.areas.includes('notes'), 'notes_not_authorized');
        const local = notes.decode(notes.encode(localEntries, [grant.localProfileId]), [grant.localProfileId]);
        const remote = noteEnvelope(remoteEnvelope, grant.remoteProfileId);
        const rows = new Map(local.map(row => [row.videoId, row]));
        for (const incoming of remote) {
            const mapped = notes.record({ ...incoming, profileId: grant.localProfileId });
            rows.set(mapped.videoId, rows.has(mapped.videoId) ? notes.merge(rows.get(mapped.videoId), mapped) : mapped);
        }
        return notes.decode(notes.encode(Array.from(rows.values()), [grant.localProfileId]), [grant.localProfileId]);
    }
    function playlistEnvelope(value, profileId) {
        requireValue(!!playlists, 'playlists_contract_unavailable');
        canonical(value, PLAYLISTS_MAX_BYTES);
        return playlists.decode(JSON.parse(JSON.stringify(value)), [profileId]);
    }
    function encodePlaylists(list, profileId) {
        const encoded = playlists.encode(list, [profileId]);
        requireValue(new TextEncoder().encode(encoded).length <= PLAYLISTS_MAX_BYTES, 'personal_sync_too_large');
        return JSON.parse(encoded);
    }
    /** Joins a peer's lists into this profile's lists. Same merge as backup restore. */
    function mergePlaylists(localEnvelope, remoteEnvelope, grant) {
        grant = normalizeGrant(grant);
        requireValue(grant.enabled && grant.areas.includes('playlists'), 'playlists_not_authorized');
        const local = playlistEnvelope(localEnvelope, grant.localProfileId);
        const remote = playlistEnvelope(remoteEnvelope, grant.remoteProfileId)
            .map(playlist => ({ ...playlist, profileId: grant.localProfileId }));
        // The merged result is stored locally whatever its size; sending it later is what the cap limits.
        return JSON.parse(playlists.encode(playlists.mergeAll(local, remote), [grant.localProfileId]));
    }
    function payload(value, grant, incoming) {
        canonical(value, MESSAGE_MAX_BYTES); fields(value, AREAS, []);
        canonical(Object.fromEntries(Object.entries(value).filter(([area]) => area !== 'playlists')));
        const areas = Object.keys(value).sort();
        requireValue(areas.length > 0 && areas.every(area => grant.areas.includes(area)), 'area_not_authorized');
        const result = {};
        if (own(value, 'settings')) result.settings = validateSettings(value.settings);
        if (own(value, 'notes')) {
            const profileId = incoming ? grant.remoteProfileId : grant.localProfileId;
            result.notes = { format: notes.FORMAT, version: 1, entries: noteEnvelope(value.notes, profileId) };
        }
        if (own(value, 'playlists')) {
            const profileId = incoming ? grant.remoteProfileId : grant.localProfileId;
            result.playlists = encodePlaylists(playlistEnvelope(value.playlists, profileId), profileId);
        }
        return result;
    }
    function base64(bytes) {
        let string = ''; for (const byte of bytes) string += String.fromCharCode(byte);
        const encoded = typeof root.btoa === 'function' ? root.btoa(string) : Buffer.from(bytes).toString('base64');
        return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function unbase64(value, length) {
        requireValue(typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value));
        const raw = value.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = typeof root.atob === 'function' ? root.atob(raw) : Buffer.from(raw, 'base64').toString('binary');
        const bytes = Uint8Array.from(decoded, char => char.charCodeAt(0));
        requireValue(bytes.length === length && base64(bytes) === value); return bytes;
    }
    function create({ crypto = root.crypto } = {}) {
        requireValue(!!crypto?.subtle, 'personal_sync_crypto_unavailable');
        const bytes = value => new TextEncoder().encode(canonical(value, MESSAGE_MAX_BYTES));
        async function digest(value) { return base64(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes(value)))); }
        async function sign(rawGrant, rawPayload, { privateKey, sequence, messageId } = {}) {
            const grant = normalizeGrant(rawGrant);
            requireValue(grant.enabled, 'personal_sync_disabled');
            const data = payload(rawPayload, grant, false);
            const body = {
                schema: MESSAGE_SCHEMA, version: 1,
                sourceDeviceId: grant.localDeviceId, sourceProfileId: grant.localProfileId,
                targetDeviceId: grant.remoteDeviceId, targetProfileId: grant.remoteProfileId,
                sourceGrantId: grant.localGrantId, targetGrantId: grant.remoteGrantId,
                sourceGeneration: grant.localGeneration, targetGeneration: grant.remoteGeneration,
                sequence: generation(sequence), messageId: id(messageId), areas: Object.keys(data).sort(),
                payload: data, digest: await digest(data)
            };
            const signature = base64(new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, privateKey, bytes(body))));
            const verifyKey = await crypto.subtle.importKey('jwk', grant.localPublicKeyJwk, { name: 'Ed25519' }, false, ['verify']);
            requireValue(await crypto.subtle.verify({ name: 'Ed25519' }, verifyKey, unbase64(signature, 64), bytes(body)), 'wrong_local_signing_key');
            const result = { ...body, signature }; canonical(result, MESSAGE_MAX_BYTES); return result;
        }
        async function verify(rawGrant, envelope, { lastSequence = 0 } = {}) {
            const grant = normalizeGrant(rawGrant);
            requireValue(grant.enabled, 'personal_sync_disabled');
            canonical(envelope, MESSAGE_MAX_BYTES);
            fields(envelope, ['schema', 'version', 'sourceDeviceId', 'sourceProfileId', 'targetDeviceId', 'targetProfileId',
                'sourceGrantId', 'targetGrantId', 'sourceGeneration', 'targetGeneration', 'sequence', 'messageId', 'areas', 'payload', 'digest', 'signature']);
            requireValue(envelope.schema === MESSAGE_SCHEMA && envelope.version === 1);
            const bindings = { sourceDeviceId: grant.remoteDeviceId, sourceProfileId: grant.remoteProfileId,
                targetDeviceId: grant.localDeviceId, targetProfileId: grant.localProfileId,
                sourceGrantId: grant.remoteGrantId, targetGrantId: grant.localGrantId,
                sourceGeneration: grant.remoteGeneration, targetGeneration: grant.localGeneration };
            for (const [key, value] of Object.entries(bindings)) requireValue(envelope[key] === value, 'personal_sync_binding_changed');
            id(envelope.messageId); generation(envelope.sequence);
            requireValue(Number.isSafeInteger(lastSequence) && lastSequence >= 0 && envelope.sequence > lastSequence, 'stale_personal_sync');
            const data = payload(envelope.payload, grant, true);
            requireValue(canonical(envelope.areas) === canonical(Object.keys(data).sort()), 'area_not_authorized');
            requireValue(envelope.digest === await digest(data), 'personal_sync_digest_mismatch');
            const { signature, ...body } = envelope;
            const key = await crypto.subtle.importKey('jwk', grant.remotePublicKeyJwk, { name: 'Ed25519' }, false, ['verify']);
            requireValue(await crypto.subtle.verify({ name: 'Ed25519' }, key, unbase64(signature, 64), bytes(body)), 'personal_sync_signature_invalid');
            return { payload: data, sequence: envelope.sequence, messageId: envelope.messageId, digest: envelope.digest };
        }
        return Object.freeze({ digest, sign, verify });
    }
    return Object.freeze({ MAX_BYTES, PLAYLISTS_MAX_BYTES, MESSAGE_MAX_BYTES, GRANT_SCHEMA, MESSAGE_SCHEMA, normalizeGrant, peerBinding,
        snapshotSettings, validateSettings, mergeSettings, applySettings, mergeNotes, mergePlaylists, create });
}));
