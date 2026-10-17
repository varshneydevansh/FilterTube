/* Lifetime-view evidence only. Unknown or rounded counts never become zero. */
(function (root) {
    'use strict';
    const digitStarts = [0x0660, 0x06f0, 0x0966, 0x09e6, 0x0a66, 0x0ae6, 0x0b66, 0x0be6, 0x0c66, 0x0ce6, 0x0d66, 0x0e50, 0x0ed0, 0xff10];
    const views = /(?:views?|visualizaciones?|vues?|aufrufe?|visualiza[çc][õo]es?|visualizzazioni|просмотр[а-я]*|перегляд[а-яі]*|wyświetle[ńn]|weergaven|visningar|次观看|次觀看|次播放|回視聴|回再生|조회수?|مشاهد[ةات]+|بازدید|दृश्य|বার দেখা|penayangan|lượt xem|การดู)/iu;
    const zero = /^(?:no views|aucune vue|keine aufrufe|sin visualizaciones|sem visualizações)$/iu;
    const concurrent = /(?:watching|viewers?|concurrent|zuschauer|spectateurs|espectadores|зрител|正在观看|正在觀看|同時視聴|시청 중|يشاهد|en directo|ao vivo)/iu;
    const units = new Map([
        ['k', 1e3], ['thousand', 1e3], ['тыс', 1e3], ['mil', 1e3], ['rb', 1e3], ['ribu', 1e3], ['हज़ार', 1e3], ['हजार', 1e3],
        ['m', 1e6], ['million', 1e6], ['millions', 1e6], ['млн', 1e6], ['jt', 1e6], ['juta', 1e6], ['mi', 1e6],
        ['b', 1e9], ['billion', 1e9], ['млрд', 1e9], ['万', 1e4], ['萬', 1e4], ['만', 1e4],
        ['億', 1e8], ['亿', 1e8], ['억', 1e8], ['lakh', 1e5], ['लाख', 1e5], ['crore', 1e7], ['करोड़', 1e7]
    ]);
    function normalizeDigits(text) {
        return text.replace(/[\u0660-\u0669\u06f0-\u06f9\u0966-\u096f\u09e6-\u09ef\u0a66-\u0a6f\u0ae6-\u0aef\u0b66-\u0b6f\u0be6-\u0bef\u0c66-\u0c6f\u0ce6-\u0cef\u0d66-\u0d6f\u0e50-\u0e59\u0ed0-\u0ed9\uff10-\uff19]/g, char => {
            const code = char.charCodeAt(0), start = digitStarts.find(value => code >= value && code < value + 10);
            return String(code - start);
        }).replace(/\u066b/g, '.').replace(/\u066c/g, ',').replace(/[\u200e\u200f\u061c]/g, '').trim();
    }
    function exact(count) {
        return Number.isSafeInteger(count) && count >= 0
            ? { count, exact: true, lowerBound: count, upperBoundExclusive: count + 1, kind: 'total' } : null;
    }
    function parse(value, { isLive = false, kind = 'total', requireLabel = false } = {}) {
        if (isLive || kind !== 'total' || value === null || value === undefined || typeof value === 'boolean') return null;
        if (typeof value === 'number') return requireLabel ? null : exact(value);
        if (typeof value !== 'string' || value.length > 240) return null;
        let text = normalizeDigits(value).toLowerCase();
        if (!text || concurrent.test(text)) return null;
        if (zero.test(text)) return exact(0);
        if (requireLabel && !views.test(text)) return null;
        // A count must occupy its own field, not a title or an arbitrary card's
        // combined accessibility label containing age, likes and duration.
        text = text.replace(views, '').trim();
        const plain = text.replace(/[\u00a0\u202f]/g, ' ');
        if (/^\d+$/.test(plain)) return exact(Number(plain));
        if (/^\d{1,3}([, .'])\d{3}(?:\1\d{3})*$/.test(plain)
            || /^\d{1,2}(?:,\d{2})*,\d{3}$/.test(plain)) return exact(Number(plain.replace(/[, .']/g, '')));
        const compact = plain.match(/^(\d+(?:[.,]\d{1,2})?)\s*([^\d\s+]+)\.?\s*(\+)?$/u);
        if (!compact) return null;
        const multiplier = units.get(compact[2].replace(/\.$/, ''));
        if (!multiplier) return null;
        const numeric = compact[1].replace(',', '.'), count = Number(numeric) * multiplier;
        if (!Number.isSafeInteger(count) || count < 0) return null;
        const precision = (numeric.split('.')[1] || '').length;
        const step = multiplier / (10 ** precision);
        // Cover both rounded and truncated display formats. A '+' supplies
        // only a lower bound, so it cannot prove a count is below a minimum.
        return { count, exact: false, lowerBound: compact[3] ? count : Math.max(0, count - step / 2),
            upperBoundExclusive: compact[3] ? null : count + step, kind: 'total' };
    }
    function shouldBlock(value, rule = {}, options = {}) {
        const minimum = typeof rule.minViews === 'number' ? rule.minViews
            : (typeof rule.minViews === 'string' && /^\d+$/.test(rule.minViews.trim()) ? Number(rule.minViews) : NaN);
        if (rule.enabled !== true || !Number.isSafeInteger(minimum) || minimum <= 0 || options.isLive || (options.kind && options.kind !== 'total')) return false;
        const evidence = value && typeof value === 'object' && value.kind === 'total' ? value : parse(value, options);
        if (!evidence || !Number.isFinite(evidence.lowerBound) || evidence.lowerBound < 0) return false;
        if (evidence.exact === true) return Number.isSafeInteger(evidence.count) && evidence.count >= 0 && evidence.count < minimum;
        return Number.isFinite(evidence.upperBoundExclusive) && evidence.upperBoundExclusive > evidence.lowerBound
            && evidence.upperBoundExclusive <= minimum;
    }
    root.FilterTubeViewCount = Object.freeze({ parse, shouldBlock });
})(typeof window !== 'undefined' ? window : globalThis);
