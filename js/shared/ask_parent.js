// js/shared/ask_parent.js
//
// Ask a parent: the pure parts, ported from the Android app (AskParent.kt;
// docs/app/family/ASK_A_PARENT.md in the app repository). Clock-driven and storage-free, so the
// background, the pages and the tests share one copy:
//
// - ask(): a child asks to watch a video or a channel, with an optional reason chip and a one-line
//   note. Limits: 3 open asks, a 60-second gap, 5 an hour, 60 minutes after "Not now" for the same
//   thing, and asks expire after 6 hours. An ask never decides itself.
// - answerPayload() / askingPayload() / parseAnswer() / checkAnswer(): a parent's answer from another
//   device, the same `filtertube.ask.v1` body the app signs with the parent's Family (managed)
//   Ed25519 key and sends in the `signed` list of a `study_family` Nanah message.
// - canDecide() / canDecideRemote(): who may answer on this device.
// - addPass() / allowsVideo(): "Allow once": the asked video plays for 6 hours, exactly like a
//   parent's allowed-video rule.
// - routes(): same device first, then the next connection to the parent's device.
//
// Exposed as `FilterTubeAskParent` on window/self, and as a CommonJS module for tests.
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    root.FilterTubeAskParent = api;
}(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis), function () {
    'use strict';

    const KIND_VIDEO = 'video';
    const KIND_CHANNEL = 'channel';
    const BLOCKED_CHANNEL = 'channel';
    const BLOCKED_ALLOW_LIST = 'allow_list';
    const BLOCKED_OTHER = 'other';
    const STATUS_OPEN = 'open';
    const STATUS_ALLOWED = 'allowed';
    const STATUS_DECLINED = 'declined';
    const STATUS_EXPIRED = 'expired';
    const STATUS_CANCELLED = 'cancelled';
    const DECISION_ONCE = 'once';
    const DECISION_CHANNEL = 'channel';
    const DECISION_NO = 'no';
    const REASONS = Object.freeze(['school', 'once', 'other']);
    const STATUSES = new Set([STATUS_OPEN, STATUS_ALLOWED, STATUS_DECLINED, STATUS_EXPIRED, STATUS_CANCELLED]);
    const DECISIONS = new Set([DECISION_ONCE, DECISION_CHANNEL, DECISION_NO]);

    const MAX_OPEN = 3;
    const MIN_GAP_MS = 60 * 1000;
    const MAX_PER_HOUR = 5;
    const HOUR_MS = 60 * 60 * 1000;
    const AFTER_NO_MS = 60 * 60 * 1000;
    const TTL_MS = 6 * HOUR_MS;
    const PASS_MS = 6 * HOUR_MS;
    const KEEP_MS = 24 * HOUR_MS;
    const MAX_KEPT = 30;
    const NOTE_MAX = 80;
    const REPLY_MAX = 120;
    const TITLE_MAX = 120;
    const NAME_MAX = 40;
    /** StudyFamilyClock.SKEW_MILLIS */
    const SKEW_MS = 5 * 60 * 1000;
    /** AskParentCheck.MAX_AGE_MILLIS */
    const ANSWER_MAX_AGE_MS = 2 * HOUR_MS;
    const ANSWER_TYPE = 'filtertube.ask.v1';
    const ANSWER_KIND = 'answer';
    const ASKING_KIND = 'asking';

    const ID = /^[A-Za-z0-9_.:-]{6,96}$/;
    const VIDEO_ID = /^[A-Za-z0-9_-]{6,20}$/;
    const CHANNEL_ID = /^[A-Za-z0-9_@.-]{2,64}$/;

    const text = value => (typeof value === 'string' ? value : '');
    const finite = value => (typeof value === 'number' && Number.isFinite(value) ? value : null);
    const validId = value => ID.test(text(value));
    const validVideoId = value => VIDEO_ID.test(text(value));
    const validChannelId = value => CHANNEL_ID.test(text(value));

    /** StudyIds.random: prefix, a dash and 20 hex characters. */
    function randomId(prefix) {
        const bytes = new Uint8Array(10);
        const cryptoApi = (typeof crypto !== 'undefined' && crypto.getRandomValues) ? crypto : null;
        if (cryptoApi) cryptoApi.getRandomValues(bytes);
        else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
        return `${prefix}-${Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')}`;
    }

    /** AskParentRules.cleanLine: trimmed, one line, at most [max] whole code points. */
    function cleanLine(value, max) {
        const line = Array.from(text(value).replace(/\s+/g, ' ').trim()).filter(ch => ch.codePointAt(0) >= 32);
        return line.length <= max ? line.join('') : line.slice(0, max).join('').trim();
    }

    function isOpenAt(ask, now) {
        return ask.status === STATUS_OPEN && now < ask.expiresAt;
    }

    function targetKey(ask) {
        return ask.kind === KIND_VIDEO ? `v:${ask.videoId}` : `c:${ask.channelId}`;
    }

    /** "Always allow this channel" is offered only when a channel rule kept it out. */
    function channelAnswerable(ask) {
        return !!ask.channelId && (ask.kind === KIND_CHANNEL || ask.blockedBy === BLOCKED_CHANNEL);
    }

    /** ParentAsk.from: a stored or received ask, or null. */
    function fromJson(json) {
        if (!json || typeof json !== 'object') return null;
        const id = text(json.id).trim();
        const child = text(json.childProfileId).trim();
        const kind = json.kind === KIND_VIDEO || json.kind === KIND_CHANNEL ? json.kind : '';
        if (!validId(id) || !child || child.length > 128 || !kind) return null;
        const videoId = validVideoId(text(json.videoId).trim()) ? text(json.videoId).trim() : null;
        const channelId = validChannelId(text(json.channelId).trim()) ? text(json.channelId).trim() : null;
        if (kind === KIND_VIDEO && !videoId) return null;
        if (kind === KIND_CHANNEL && !channelId) return null;
        const createdAt = finite(json.createdAt);
        const expiresAt = finite(json.expiresAt);
        if (!createdAt || createdAt <= 0 || !expiresAt || expiresAt <= createdAt || expiresAt - createdAt > TTL_MS) return null;
        if (!STATUSES.has(json.status)) return null;
        const title = cleanLine(json.title, TITLE_MAX);
        if (!title) return null;
        return {
            id, childProfileId: child, kind, videoId, channelId, title,
            channelName: cleanLine(json.channelName, TITLE_MAX),
            blockedBy: json.blockedBy === BLOCKED_CHANNEL || json.blockedBy === BLOCKED_ALLOW_LIST ? json.blockedBy : BLOCKED_OTHER,
            reason: REASONS.includes(json.reason) ? json.reason : '',
            note: cleanLine(json.note, NOTE_MAX),
            createdAt, expiresAt, status: json.status,
            decidedAt: finite(json.decidedAt),
            decision: DECISIONS.has(json.decision) ? json.decision : null,
            reply: cleanLine(json.reply, REPLY_MAX),
            parentName: cleanLine(json.parentName, NAME_MAX)
        };
    }

    /** ParentAsk.toJson: the stored shape. */
    function toJson(ask) {
        const out = { id: ask.id, childProfileId: ask.childProfileId, kind: ask.kind };
        if (ask.videoId) out.videoId = ask.videoId;
        if (ask.channelId) out.channelId = ask.channelId;
        Object.assign(out, {
            title: ask.title, channelName: ask.channelName || '', blockedBy: ask.blockedBy || BLOCKED_OTHER,
            reason: ask.reason || '', note: ask.note || '', createdAt: ask.createdAt, expiresAt: ask.expiresAt, status: ask.status
        });
        if (ask.decidedAt != null) out.decidedAt = ask.decidedAt;
        if (ask.decision != null) out.decision = ask.decision;
        if (ask.reply) out.reply = ask.reply;
        if (ask.parentName) out.parentName = ask.parentName;
        return out;
    }

    /** ParentAsk.wireJson: what crosses to the parent. No decision fields, so a child can't pre-answer. */
    function wireJson(ask) {
        const out = toJson(ask);
        delete out.decidedAt; delete out.decision; delete out.reply; delete out.parentName;
        out.status = STATUS_OPEN;
        return out;
    }

    function listFrom(raw) {
        return (Array.isArray(raw) ? raw : []).map(fromJson).filter(Boolean);
    }

    /** Expires open asks past their time and drops old ones. Never allows: open only becomes expired. */
    function normalize(list, now) {
        const seen = new Set();
        return listFrom(list)
            .map(ask => (ask.status === STATUS_OPEN && now >= ask.expiresAt ? { ...ask, status: STATUS_EXPIRED } : ask))
            .filter(ask => now - ask.createdAt < KEEP_MS && ask.createdAt <= now + SKEW_MS)
            .filter(ask => (seen.has(ask.id) ? false : (seen.add(ask.id), true)))
            .slice(-MAX_KEPT);
    }

    function open(list, now, childProfileId = null) {
        return normalize(list, now).filter(ask => isOpenAt(ask, now) && (childProfileId == null || ask.childProfileId === childProfileId));
    }

    /** What the child is asking about. AskTarget.video / AskTarget.channel. */
    function videoTarget(videoId, title, channelId, channelName, blockedBy) {
        return { kind: KIND_VIDEO, title, videoId, channelId: channelId || null, channelName: channelName || '', blockedBy: blockedBy || BLOCKED_OTHER };
    }

    function channelTarget(channelId, name) {
        return { kind: KIND_CHANNEL, title: name, videoId: null, channelId, channelName: name, blockedBy: BLOCKED_CHANNEL };
    }

    /**
     * AskParentRules.create. Returns {type:'created', ask, list} | {type:'already_open', ask} |
     * {type:'too_many'} | {type:'wait', at} | {type:'recently_declined', at} | {type:'asking_off'} |
     * {type:'invalid'}.
     */
    function create(list, childProfileId, target, reason, note, now, id, askingOff = false) {
        if (askingOff) return { type: 'asking_off' };
        const t = target && typeof target === 'object' ? target : {};
        const videoOk = t.kind === KIND_VIDEO && validVideoId(t.videoId);
        const channelOk = t.kind === KIND_CHANNEL && validChannelId(t.channelId);
        const title = cleanLine(t.title, TITLE_MAX);
        if ((!videoOk && !channelOk) || !title || !text(childProfileId).trim()) return { type: 'invalid' };
        const ask = {
            id, childProfileId, kind: t.kind, videoId: videoOk ? t.videoId : null,
            channelId: validChannelId(t.channelId) ? t.channelId : null, title,
            channelName: cleanLine(t.channelName, TITLE_MAX),
            blockedBy: t.blockedBy === BLOCKED_CHANNEL || t.blockedBy === BLOCKED_ALLOW_LIST ? t.blockedBy : BLOCKED_OTHER,
            reason: REASONS.includes(reason) ? reason : '', note: cleanLine(note, NOTE_MAX),
            createdAt: now, expiresAt: now + TTL_MS, status: STATUS_OPEN, decidedAt: null, decision: null, reply: '', parentName: ''
        };
        const current = normalize(list, now);
        const mine = current.filter(item => item.childProfileId === childProfileId);
        const already = mine.find(item => isOpenAt(item, now) && targetKey(item) === targetKey(ask));
        if (already) return { type: 'already_open', ask: already };
        const declined = mine.filter(item => targetKey(item) === targetKey(ask) && item.status === STATUS_DECLINED && item.decidedAt != null).pop();
        if (declined && now < declined.decidedAt + AFTER_NO_MS) return { type: 'recently_declined', at: declined.decidedAt + AFTER_NO_MS };
        if (mine.filter(item => isOpenAt(item, now)).length >= MAX_OPEN) return { type: 'too_many' };
        if (mine.length) {
            const last = Math.max(...mine.map(item => item.createdAt));
            if (now - last < MIN_GAP_MS) return { type: 'wait', at: last + MIN_GAP_MS };
        }
        const thisHour = mine.filter(item => now - item.createdAt < HOUR_MS).sort((a, b) => a.createdAt - b.createdAt);
        if (thisHour.length >= MAX_PER_HOUR) return { type: 'wait', at: thisHour[0].createdAt + HOUR_MS };
        return { type: 'created', ask, list: [...current, ask].slice(-MAX_KEPT) };
    }

    /** AskParentRules.decide. {type:'decided', ask, list} | {type:'not_open'} | {type:'invalid'}. */
    function decide(list, askId, decision, reply, parentName, now) {
        if (!DECISIONS.has(decision)) return { type: 'invalid' };
        const current = normalize(list, now);
        const ask = current.find(item => item.id === askId);
        if (!ask || !isOpenAt(ask, now)) return { type: 'not_open' };
        if (decision === DECISION_CHANNEL && !ask.channelId) return { type: 'invalid' };
        if (decision === DECISION_ONCE && ask.kind !== KIND_VIDEO) return { type: 'invalid' };
        const decided = {
            ...ask, status: decision === DECISION_NO ? STATUS_DECLINED : STATUS_ALLOWED, decidedAt: now, decision,
            reply: cleanLine(reply, REPLY_MAX), parentName: cleanLine(parentName, NAME_MAX)
        };
        return { type: 'decided', ask: decided, list: current.map(item => (item.id === askId ? decided : item)) };
    }

    function cancel(list, askId, now) {
        return normalize(list, now).map(ask => (ask.id === askId && isOpenAt(ask, now)
            ? { ...ask, status: STATUS_CANCELLED, decidedAt: now } : ask));
    }

    /** The parent's copy of a child's asks: what arrived, minus what's known. Never decided by the child. */
    function receive(local, incoming, childProfileId, now) {
        const known = new Set(normalize(local, now).map(ask => ask.id));
        const fresh = listFrom(incoming)
            .filter(ask => ask.childProfileId === childProfileId && ask.status === STATUS_OPEN && !known.has(ask.id))
            .map(ask => ({ ...ask, decidedAt: null, decision: null, reply: '', parentName: '' }));
        return normalize([...normalize(local, now), ...fresh], now);
    }

    // ---- Who may answer on this device ----------------------------------------------------------

    /**
     * AskParentAuthority.canDecide: never a child profile; only the master (default) profile or the
     * child's own parent; with a PIN, only while the unlock is current.
     */
    function canDecide(active, child, pinRequired, unlocked) {
        if (!active || !child) return false;
        if (active.type === 'child') return false;
        if (active.id === child.id) return false;
        const manages = active.id === 'default' || child.parentProfileId === active.id;
        return manages && (!pinRequired || unlocked);
    }

    function canDecideRemote(active, pinRequired, unlocked) {
        return !!active && active.type !== 'child' && (!pinRequired || unlocked);
    }

    // ---- Signed answers --------------------------------------------------------------------------

    /** NanahAutoSyncStore.canonical: keys sorted, no spaces. */
    function canonical(value) {
        if (value === null || value === undefined) return 'null';
        if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
        if (typeof value === 'object') {
            return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
        }
        return JSON.stringify(value);
    }

    function answerPayload(childProfileId, parentProfileId, askId, decision, reply, parentName, issuedAt, nonce) {
        return canonical({
            type: ANSWER_TYPE, kind: ANSWER_KIND, childProfileId, parentProfileId, askId, decision,
            reply: cleanLine(reply, REPLY_MAX), parentName: cleanLine(parentName, NAME_MAX), issuedAt, nonce
        });
    }

    function askingPayload(childProfileId, parentProfileId, on, issuedAt, nonce) {
        return canonical({ type: ANSWER_TYPE, kind: ASKING_KIND, childProfileId, parentProfileId, asking: on === true, issuedAt, nonce });
    }

    function isAskPayload(payload) {
        try { return JSON.parse(payload).type === ANSWER_TYPE; } catch (e) { return false; }
    }

    /** AskParentAnswerBody.parse. */
    function parseAnswer(payload) {
        let json;
        try { json = JSON.parse(payload); } catch (e) { return null; }
        if (!json || json.type !== ANSWER_TYPE) return null;
        if (json.kind !== ANSWER_KIND && json.kind !== ASKING_KIND) return null;
        if (typeof json.childProfileId !== 'string' || typeof json.parentProfileId !== 'string') return null;
        if (finite(json.issuedAt) === null || !validId(json.nonce)) return null;
        return {
            kind: json.kind, childProfileId: json.childProfileId, parentProfileId: json.parentProfileId,
            issuedAt: json.issuedAt, nonce: json.nonce,
            askId: text(json.askId) || null, decision: text(json.decision) || null,
            reply: cleanLine(json.reply, REPLY_MAX), parentName: cleanLine(json.parentName, NAME_MAX),
            askingOn: typeof json.asking === 'boolean' ? json.asking : null
        };
    }

    function base64UrlToBytes(value) {
        const clean = text(value).replace(/-/g, '+').replace(/_/g, '/');
        const padded = clean + '='.repeat((4 - (clean.length % 4)) % 4);
        try {
            const binary = typeof atob === 'function' ? atob(padded) : Buffer.from(padded, 'base64').toString('binary');
            return Uint8Array.from(binary, ch => ch.charCodeAt(0));
        } catch (e) {
            return null;
        }
    }

    function bytesToBase64Url(bytes) {
        let binary = '';
        for (const byte of bytes) binary += String.fromCharCode(byte);
        const base64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    /**
     * AskParentCheck.check. `verify(publicKeyJwk, messageBytes, signatureBytes)` resolves true or
     * false. Resolves {ok:true, body} or {ok:false, reason}.
     */
    async function checkAnswer(childProfileId, message, signer, seenNonces, asks, now, verify) {
        const body = parseAnswer(text(message?.payload));
        if (!body) return { ok: false, reason: 'malformed' };
        const signature = base64UrlToBytes(message?.signature);
        let verified = false;
        if (signature && signature.length === 64) {
            try { verified = await verify(signer.publicKeyJwk, new TextEncoder().encode(message.payload), signature); } catch (e) { verified = false; }
        }
        if (!verified) return { ok: false, reason: 'bad_signature' };
        if (body.parentProfileId !== signer.parentProfileId) return { ok: false, reason: 'not_this_parent' };
        if (body.childProfileId !== childProfileId) return { ok: false, reason: 'other_child' };
        if (body.issuedAt > now + SKEW_MS || now - body.issuedAt > ANSWER_MAX_AGE_MS) return { ok: false, reason: 'stale' };
        if (seenNonces && (seenNonces.has ? seenNonces.has(body.nonce) : seenNonces.includes(body.nonce))) return { ok: false, reason: 'replayed' };
        if (body.kind === ANSWER_KIND) {
            const ask = normalize(asks, now).find(item => item.id === body.askId && item.childProfileId === childProfileId);
            if (!ask) return { ok: false, reason: 'unknown_ask' };
            if (!isOpenAt(ask, now)) return { ok: false, reason: 'not_open' };
            if (!DECISIONS.has(body.decision)) return { ok: false, reason: 'invalid_decision' };
        } else if (body.askingOn === null) {
            return { ok: false, reason: 'malformed' };
        }
        return { ok: true, body };
    }

    // ---- Passes ("Allow once") -------------------------------------------------------------------

    function passesFrom(raw) {
        return (Array.isArray(raw) ? raw : []).filter(pass => pass && typeof pass === 'object'
            && text(pass.profileId) && validVideoId(pass.videoId) && finite(pass.until) !== null)
            .map(pass => ({ profileId: pass.profileId, videoId: pass.videoId, until: pass.until, askId: text(pass.askId) }));
    }

    function addPass(list, pass, now) {
        return [...passesFrom(list).filter(item => now < item.until && !(item.profileId === pass.profileId && item.videoId === pass.videoId)), pass].slice(-40);
    }

    function allowsVideo(list, profileId, videoId, now) {
        if (!profileId || !videoId) return false;
        return passesFrom(list).some(pass => pass.profileId === profileId && pass.videoId === videoId && now < pass.until);
    }

    /** "Allow once" and "Always allow this channel" both let the asked video play now. */
    function passFor(ask, now) {
        if (!ask || ask.decision === DECISION_NO || !ask.videoId) return null;
        return { profileId: ask.childProfileId, videoId: ask.videoId, until: now + PASS_MS, askId: ask.id };
    }

    // ---- Delivery --------------------------------------------------------------------------------

    /**
     * AskParentDelivery.routes, without nearby discovery (the extension's Nanah sessions choose
     * nearby or the relay themselves): 'same_device', then 'relay' when a parent link exists, else 'none'.
     */
    function routes(parentHere, parentDeviceCount) {
        const out = [];
        if (parentHere) out.push('same_device');
        if (parentDeviceCount > 0) out.push('relay');
        if (!out.length) out.push('none');
        return out;
    }

    return Object.freeze({
        KIND_VIDEO, KIND_CHANNEL, BLOCKED_CHANNEL, BLOCKED_ALLOW_LIST, BLOCKED_OTHER,
        STATUS_OPEN, STATUS_ALLOWED, STATUS_DECLINED, STATUS_EXPIRED, STATUS_CANCELLED,
        DECISION_ONCE, DECISION_CHANNEL, DECISION_NO, REASONS, ANSWER_TYPE,
        MAX_OPEN, MIN_GAP_MS, MAX_PER_HOUR, AFTER_NO_MS, TTL_MS, PASS_MS, KEEP_MS, NOTE_MAX, REPLY_MAX, TITLE_MAX,
        validId, validVideoId, validChannelId, randomId, cleanLine, isOpenAt, targetKey, channelAnswerable,
        fromJson, toJson, wireJson, listFrom, normalize, open, videoTarget, channelTarget, create, decide, cancel, receive,
        canDecide, canDecideRemote, canonical, answerPayload, askingPayload, isAskPayload, parseAnswer, checkAnswer,
        base64UrlToBytes, bytesToBase64Url, passesFrom, addPass, allowsVideo, passFor, routes
    });
}));
