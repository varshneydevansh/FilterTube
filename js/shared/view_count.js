/* Lifetime-view evidence only. Unknown or rounded counts never become zero. */
(function (root) {
    'use strict';
    const digitStarts = [0x0660, 0x06f0, 0x0966, 0x09e6, 0x0a66, 0x0ae6, 0x0b66, 0x0be6, 0x0c66, 0x0ce6, 0x0d66, 0x0e50, 0x0ed0, 0xff10];
    // Localized "views" labels as YouTube renders them in its display language.
    // Prefix labels (조회수, 視聴回数, 观看次数) and suffix labels (回視聴, 次观看)
    // are both stripped; a bare 회/回/次 counter word is removed only afterwards.
    const labelSource = '(?:(?:de|di|x)\\s+)?(?:views?|visualizaciones?|vues?|aufrufe?|visualiza[çc][õo]es?|visualizzazion[ei]|просмотр[а-я]*|перегляд[а-яі]*|wyświetle[ńn]|wyświetlenia|weergaven?|visningar|görüntülenme|görüntüleme|zhlédnutí|megtekintés|ditonton|penayangan|lượt xem|การดู|次观看|次觀看|次播放|回視聴|回再生|視聴回数|观看次数|觀看次數|播放次数|播放次數|조회수?|مشاهد[ةات]+|بازدید|बार देखा गया|दृश्य|বার দেখা হয়েছে|বার দেখা)';
    const views = new RegExp(labelSource, 'iu');
    const viewsAll = new RegExp(labelSource, 'giu');
    const zero = /^(?:no views|aucune vue|keine aufrufe|sin visualizaciones|sem visualizações|nessuna visualizzazione|нет просмотров|немає переглядів|brak wyświetleń|geen weergaven|inga visningar|görüntüleme yok|henüz görüntülenme yok|belum ada penayangan|chưa có lượt xem nào|조회수 없음|視聴回数 0 回|0 回視聴|0 次观看|0 次觀看|无观看次数|沒有觀看次數)$/iu;
    const concurrent = /(?:watching|viewers?|waiting|concurrent|zuschauer|spectateurs|spettatori|espectadores|assistindo|зрител|смотрят|izleyici|正在观看|正在觀看|人在看|同時視聴|視聴中|待機中|시청 중|대기 중|يشاهد|en directo|ao vivo)/iu;
    const units = new Map([
        ['k', 1e3], ['thousand', 1e3], ['tausend', 1e3], ['mille', 1e3], ['тыс', 1e3], ['тис', 1e3], ['mil', 1e3], ['mila', 1e3], ['tsd', 1e3], ['tys', 1e3], ['rb', 1e3], ['ribu', 1e3],
        ['हज़ार', 1e3], ['हजार', 1e3], ['হাজার', 1e3], ['ألف', 1e3], ['هزار', 1e3], ['千', 1e3], ['천', 1e3], ['พัน', 1e3],
        ['m', 1e6], ['million', 1e6], ['millions', 1e6], ['millionen', 1e6], ['millones', 1e6], ['milhões', 1e6], ['milioni', 1e6], ['mio', 1e6], ['mln', 1e6], ['mill', 1e6], ['mi', 1e6], ['млн', 1e6], ['jt', 1e6], ['juta', 1e6],
        ['مليون', 1e6], ['میلیون', 1e6], ['ล้าน', 1e6],
        ['b', 1e9], ['billion', 1e9], ['milliarden', 1e9], ['md', 1e9], ['mrd', 1e9], ['mld', 1e9], ['млрд', 1e9], ['مليار', 1e9],
        ['万', 1e4], ['萬', 1e4], ['만', 1e4], ['億', 1e8], ['亿', 1e8], ['억', 1e8],
        ['lakh', 1e5], ['लाख', 1e5], ['লাখ', 1e5], ['crore', 1e7], ['करोड़', 1e7], ['কোটি', 1e7]
    ]);
    // Abbreviations whose meaning depends on the display language. Turkish
    // "B" is bin (thousand), Indonesian "M" is miliar, Vietnamese "N" is nghìn.
    const localUnits = [
        [/görüntülen?me/iu, new Map([['b', 1e3], ['bin', 1e3], ['mn', 1e6], ['mr', 1e9], ['milyon', 1e6], ['milyar', 1e9]])],
        [/ditonton|penayangan/iu, new Map([['m', 1e9]])],
        [/lượt xem/iu, new Map([['n', 1e3], ['nghìn', 1e3], ['tr', 1e6], ['triệu', 1e6], ['t', 1e9], ['tỷ', 1e9]])]
    ];
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
        const raw = normalizeDigits(value).toLowerCase().replace(/[\u00a0\u202f\u2009]/g, ' ').replace(/\s+/g, ' ').trim();
        if (!raw || concurrent.test(raw)) return null;
        if (zero.test(raw)) return exact(0);
        if (requireLabel && !views.test(raw)) return null;
        // A count must occupy its own field, not a title or an arbitrary card's
        // combined accessibility label containing age, likes and duration.
        const plain = raw.replace(viewsAll, ' ').trim().replace(/\s*[회回次]$/u, '').replace(/^[:：]\s*/u, '').trim();
        if (/^\d+$/.test(plain)) return exact(Number(plain));
        if (/^\d{1,3}([, .'])\d{3}(?:\1\d{3})*$/.test(plain)
            || /^\d{1,2}(?:,\d{2})*,\d{3}$/.test(plain)) return exact(Number(plain.replace(/[, .']/g, '')));
        const compact = plain.match(/^(\d+(?:[.,]\d{1,2})?)\s*([^\d\s+]+)\.?\s*(\+)?$/u);
        if (!compact) return null;
        const unit = compact[2].replace(/\.$/, '');
        const local = localUnits.find(([label]) => label.test(raw));
        const multiplier = (local && local[1].get(unit)) || units.get(unit);
        if (!multiplier) return null;
        // Round away binary float noise (1.1 * 1e3 is 1100.0000000000002).
        const numeric = compact[1].replace(',', '.'), count = Math.round(Number(numeric) * multiplier);
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
