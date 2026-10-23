/* FilterTube saved-note data contract. No storage, transport, filtering or trust authority. */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.FilterTubeSavedVideoNotes = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';
    const FORMAT = 'filtertube.saved-video-notes';
    const MAX_COUNTER = 9007199254740991;
    function requireValue(ok) { if (!ok) throw new Error('Invalid saved-note record'); }
    function unicode(text) {
        for (let i = 0; i < text.length; i++) {
            const unit = text.charCodeAt(i);
            if (unit >= 0xd800 && unit <= 0xdbff) {
                const next = text.charCodeAt(++i);
                if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
            } else if (unit >= 0xdc00 && unit <= 0xdfff) return false;
        }
        return true;
    }
    function fields(object, names) {
        requireValue(object && typeof object === 'object' && !Array.isArray(object));
        requireValue(Object.keys(object).sort().join('|') === names.slice().sort().join('|'));
    }
    function validKey(key) {
        requireValue(typeof key.profileId === 'string' && key.profileId.length > 0 && key.profileId.length <= 1024 && unicode(key.profileId));
        requireValue(!/^[\u0009-\u000d\u001c-\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+$/.test(key.profileId));
        requireValue(typeof key.videoId === 'string' && /^[A-Za-z0-9_-]{11}$/.test(key.videoId));
    }
    function versionKey(version) { return version.revision.map(dot => dot.actor + '=' + dot.counter).join(','); }
    function clock(version) {
        const result = Object.create(null);
        version.revision.forEach(dot => { result[dot.actor] = dot.counter; });
        return result;
    }
    function dominates(newer, older) {
        const a = clock(newer), b = clock(older);
        return older.revision.every(dot => (a[dot.actor] || 0) >= dot.counter) &&
            newer.revision.some(dot => dot.counter > (b[dot.actor] || 0));
    }
    function record(value) {
        fields(value, ['profileId', 'videoId', 'versions']); validKey(value);
        requireValue(Array.isArray(value.versions) && value.versions.length >= 1 && value.versions.length <= 16);
        const actors = new Set();
        const versions = value.versions.map(raw => {
            fields(raw, ['revision', 'text']);
            requireValue(raw.text === null || typeof raw.text === 'string' && raw.text.length <= 16000 && unicode(raw.text));
            requireValue(Array.isArray(raw.revision) && raw.revision.length >= 1 && raw.revision.length <= 64);
            const seen = new Set();
            const revision = raw.revision.map(dot => {
                fields(dot, ['actor', 'counter']);
                requireValue(typeof dot.actor === 'string' && /^[a-z0-9][a-z0-9._-]{0,95}$/.test(dot.actor) && !seen.has(dot.actor));
                requireValue(Number.isSafeInteger(dot.counter) && dot.counter >= 1);
                seen.add(dot.actor); actors.add(dot.actor);
                return { actor: dot.actor, counter: dot.counter };
            }).sort((a, b) => a.actor < b.actor ? -1 : a.actor > b.actor ? 1 : 0);
            return { revision, text: raw.text };
        }).sort((a, b) => versionKey(a) < versionKey(b) ? -1 : versionKey(a) > versionKey(b) ? 1 : 0);
        requireValue(actors.size <= 64 && new Set(versions.map(versionKey)).size === versions.length);
        requireValue(!versions.some(candidate => versions.some(other => dominates(other, candidate))));
        return { profileId: value.profileId, videoId: value.videoId, versions };
    }
    function merge(left, right) {
        left = record(left); right = record(right);
        requireValue(left.profileId === right.profileId && left.videoId === right.videoId);
        const versions = new Map();
        left.versions.concat(right.versions).forEach(version => {
            const key = versionKey(version), previous = versions.get(key);
            requireValue(!previous || previous.text === version.text);
            versions.set(key, version);
        });
        const all = Array.from(versions.values());
        return record({ profileId: left.profileId, videoId: left.videoId,
            versions: all.filter(candidate => !all.some(other => dominates(other, candidate))) });
    }
    function edit(key, base, actor, text) {
        validKey(key); requireValue(typeof actor === 'string' && /^[a-z0-9][a-z0-9._-]{0,95}$/.test(actor));
        const joined = Object.create(null);
        if (base !== null) {
            base = record(base); requireValue(base.profileId === key.profileId && base.videoId === key.videoId);
            base.versions.forEach(version => version.revision.forEach(dot => {
                joined[dot.actor] = Math.max(joined[dot.actor] || 0, dot.counter);
            }));
        }
        const previous = joined[actor] || 0; requireValue(previous < MAX_COUNTER); joined[actor] = previous + 1;
        return record({ profileId: key.profileId, videoId: key.videoId,
            versions: [{ revision: Object.keys(joined).sort().map(id => ({ actor: id, counter: joined[id] })), text }] });
    }
    function validate(records, profiles) {
        requireValue(Array.isArray(records) && records.length <= 2048 && Array.isArray(profiles));
        const keys = new Set();
        return records.map(value => {
            const normalized = record(value), key = JSON.stringify([normalized.profileId, normalized.videoId]);
            requireValue(profiles.indexOf(normalized.profileId) !== -1 && !keys.has(key)); keys.add(key);
            return normalized;
        }).sort((a, b) => a.profileId < b.profileId ? -1 : a.profileId > b.profileId ? 1 : a.videoId < b.videoId ? -1 : a.videoId > b.videoId ? 1 : 0);
    }
    function byteLength(value) {
        let length = 0;
        for (const symbol of value) { const point = symbol.codePointAt(0); length += point < 128 ? 1 : point < 2048 ? 2 : point < 65536 ? 3 : 4; }
        return length;
    }
    function encode(records, profiles) {
        const raw = JSON.stringify({ format: FORMAT, version: 1, entries: validate(records, profiles) });
        requireValue(byteLength(raw) <= 16777216); return raw;
    }
    function decode(raw, profiles) {
        requireValue(typeof raw === 'string' && raw.length <= 16777216 && unicode(raw) && byteLength(raw) <= 16777216);
        let quoted = false, escaped = false, depth = 0;
        for (const character of raw) {
            if (quoted) { if (escaped) escaped = false; else if (character === '\\') escaped = true; else if (character === '"') quoted = false; }
            else if (character === '"') quoted = true;
            else if (character === '{' || character === '[') { depth++; requireValue(depth <= 8); }
            else if (character === '}' || character === ']') { depth--; requireValue(depth >= 0); }
        }
        requireValue(!quoted && depth === 0);
        const envelope = JSON.parse(raw); fields(envelope, ['format', 'version', 'entries']);
        requireValue(envelope.format === FORMAT && envelope.version === 1);
        return validate(envelope.entries, profiles);
    }
    return Object.freeze({ FORMAT, MAX_COUNTER, record, merge, edit, encode, decode });
}));
