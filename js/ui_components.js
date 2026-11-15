/**
 * FilterTube UI Components Library
 * Centralized, reusable UI components (React-like approach)
 */

const UIComponents = (() => {
    'use strict';

    // ============================================================================
    // THEME & COLORS
    // ============================================================================
    const Colors = {
        brandPrimary: '#C0392B',
        brandSecondary: '#2F7A63',
        statusSuccess: '#2F7A63',
        statusDanger: '#B44339',
        textPrimary: '#1A1A1A',
        textSecondary: '#595959',
        textMuted: '#8C8C8C',
        borderNeutral: '#E0E0E0',
        bgBase: '#F9F8F6',
        bgSurface: '#FFFFFF',
        bgPanel: '#F0EFEA'
    };

    function localizedComponentText(key, fallback, values = {}) {
        try {
            const localized = window.FilterTubeUiLocalization?.text?.(key, values);
            if (typeof localized === 'string' && localized.trim()) return localized;
        } catch (e) {
        }
        return String(fallback).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
    }

    function isDarkTheme() {
        try {
            return document.documentElement.getAttribute('data-theme') === 'dark';
        } catch (e) {
            return false;
        }
    }

    function hashHue(value) {
        const str = typeof value === 'string' ? value.trim() : '';
        let hash = 0;
        for (let i = 0; i < str.length; i += 1) {
            hash = (hash * 31 + str.charCodeAt(i)) % 360;
        }
        return hash;
    }

    function getProfileColors(seed) {
        const h = hashHue(seed);
        const dark = isDarkTheme();

        const accent = dark
            ? `hsl(${h} 70% 62%)`
            : `hsl(${h} 70% 42%)`;

        return {
            bg: dark
                ? `hsl(${h} 55% 32%)`
                : `hsl(${h} 65% 85%)`,
            fg: dark
                ? `hsl(${h} 80% 92%)`
                : `hsl(${h} 40% 22%)`,
            accent,
            accentBg: dark
                ? `hsl(${h} 70% 28% / 0.42)`
                : `hsl(${h} 70% 45% / 0.16)`,
            accentBorder: dark
                ? `hsl(${h} 70% 62% / 0.6)`
                : `hsl(${h} 70% 38% / 0.55)`
        };
    }

    // ============================================================================
    // PROFILE AVATARS (Android ProfileAvatar.kt, docs/app/profiles/PROFILES_REDESIGN.md)
    // ============================================================================
    // A profile shows crayon initials or a doodle avatar ("avatar": "doodle:<name>"). The role
    // decides the ring: Parent (Default) a double scribble, Adult one wobbly ring, Kids a ring plus a
    // corner sticker on initials. Avatars are drawn, never photos, and never Kriti or Uljhan.
    const PROFILE_AVATAR_DOODLES = Object.freeze([
        { value: 'doodle:heart', file: 'heart', mask: false, key: 'heart', label: 'Heart' },
        { value: 'doodle:flower', file: 'flower', mask: false, key: 'flower', label: 'Flower' },
        { value: 'doodle:star', file: 'star', mask: false, key: 'star', label: 'Star' },
        { value: 'doodle:sparkle', file: 'sparkle', mask: false, key: 'sparkle', label: 'Sparkle' },
        { value: 'doodle:cloud', file: 'cloud', mask: false, key: 'cloud', label: 'Cloud' },
        { value: 'doodle:crayon', file: 'crayon', mask: false, key: 'crayon', label: 'Crayon' },
        { value: 'doodle:clip', file: 'clip', mask: false, key: 'clip', label: 'Paper clip' },
        { value: 'doodle:stamp', file: 'stamp', mask: false, key: 'stamp', label: 'Stamp' },
        { value: 'doodle:magnifier', file: 'magnifier', mask: false, key: 'magnifier', label: 'Magnifier' },
        { value: 'doodle:bubble', file: 'bubble', mask: false, key: 'bubble', label: 'Bubble' },
        { value: 'doodle:seal', file: 'seal', mask: true, key: 'seal', label: 'Seal' },
        { value: 'doodle:note', file: 'note', mask: false, key: 'note', label: 'Note' },
        { value: 'doodle:waves', file: 'waves', mask: true, key: 'waves', label: 'Waves' },
        { value: 'doodle:arrow', file: 'arrow', mask: true, key: 'arrow', label: 'Arrow' },
        { value: 'doodle:tick', file: 'tick', mask: true, key: 'tick', label: 'Tick mark' }
    ].map(Object.freeze));
    const PROFILE_AVATAR_STICKERS = Object.freeze(['heart', 'star', 'sparkle']);
    const PROFILE_AVATAR_MAX_LENGTH = 64;
    const DOODLE_DIR = 'assets/images/doodles/';

    /** "parent" for Default, "kids" for a child profile, else "adult". Pure. */
    function profileRole(profileId, type) {
        if (profileId === 'default') return 'parent';
        return type === 'child' ? 'kids' : 'adult';
    }

    /** The stored value kept as-is when it is a short string; null otherwise (initials). Pure. */
    function normalizeProfileAvatar(value) {
        return (typeof value === 'string' && value.trim() && value.length <= PROFILE_AVATAR_MAX_LENGTH) ? value : null;
    }

    /** The doodle for a stored value; null for no value or one this version doesn't know. Pure. */
    function profileAvatarDoodle(value) {
        const avatar = normalizeProfileAvatar(value);
        return avatar ? (PROFILE_AVATAR_DOODLES.find(entry => entry.value === avatar) || null) : null;
    }

    /** With nothing chosen, a Kids profile gets a corner sticker picked from its id. Pure. */
    function profileAvatarSticker(profileId, role) {
        if (role !== 'kids') return null;
        const id = String(profileId || '');
        let hash = 0;
        for (const ch of id) hash = (hash * 31 + ch.codePointAt(0)) & 0x7FFFFFFF;
        return PROFILE_AVATAR_STICKERS[hash % PROFILE_AVATAR_STICKERS.length];
    }

    /** The first letter (a whole code point), upper-cased; "?" for a blank name. Pure. */
    function profileInitial(name) {
        const trimmed = String(name || '').trim();
        if (!trimmed) return '?';
        return String.fromCodePoint(trimmed.codePointAt(0)).toUpperCase();
    }

    function doodleUrl(file) {
        const path = `${DOODLE_DIR}${file}.webp`;
        try {
            const runtime = (typeof chrome !== 'undefined' && chrome?.runtime) || (typeof browser !== 'undefined' && browser?.runtime);
            if (runtime && typeof runtime.getURL === 'function') return runtime.getURL(path);
        } catch (e) {
        }
        return `../${path}`;
    }

    let crayonFilterInstalled = false;
    function ensureCrayonFilter(doc) {
        if (crayonFilterInstalled || !doc?.body) return;
        crayonFilterInstalled = true;
        const ns = 'http://www.w3.org/2000/svg';
        const svg = doc.createElementNS(ns, 'svg');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.style.position = 'absolute';
        svg.innerHTML = '<defs><filter id="ftCrayonEdge" x="-10%" y="-10%" width="120%" height="120%">'
            + '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="grain"/>'
            + '<feDisplacementMap in="SourceGraphic" in2="grain" scale="1.6" xChannelSelector="R" yChannelSelector="G"/>'
            + '</filter></defs>';
        doc.body.appendChild(svg);
    }

    /**
     * Fills `host` with a profile avatar: {id, name, type, avatar, size}. Decorative: the caller's
     * text (name and role word) carries the meaning, so the drawing is hidden from screen readers.
     */
    function renderProfileAvatar(host, { id = '', name = '', type = '', avatar = null, size = 36 } = {}) {
        if (!host) return host;
        const doc = host.ownerDocument || document;
        ensureCrayonFilter(doc);
        const role = profileRole(id, type);
        const doodle = profileAvatarDoodle(avatar);
        const px = Math.max(16, Math.round(Number(size) || 36));
        host.textContent = '';
        host.classList.add('ft-avatar', `ft-avatar--${role}`);
        host.classList.toggle('ft-avatar--doodle', !!doodle);
        host.classList.toggle('ft-avatar--small', px < 28);
        host.style.setProperty('--ft-avatar-size', `${px}px`);
        host.dataset.ftAvatar = doodle ? doodle.value : 'initial';
        host.setAttribute('aria-hidden', 'true');

        const ns = 'http://www.w3.org/2000/svg';
        const ring = doc.createElementNS(ns, 'svg');
        ring.setAttribute('class', 'ft-avatar__ring');
        ring.setAttribute('viewBox', '0 0 40 40');
        ring.setAttribute('focusable', 'false');
        const rings = role === 'parent'
            ? '<circle cx="20" cy="20" r="17.2" /><circle class="ft-avatar__ring-second" cx="20.6" cy="19.5" r="18.4" />'
            : '<circle cx="20" cy="20" r="17.6" />';
        ring.innerHTML = rings;
        host.appendChild(ring);

        if (doodle) {
            const art = doc.createElement('span');
            const tinted = doodle.mask || role !== 'kids';
            art.className = `ft-avatar__doodle${tinted ? ' ft-avatar__doodle--mask' : ''}`;
            const url = `url("${doodleUrl(doodle.file)}")`;
            if (tinted) {
                art.style.webkitMaskImage = url;
                art.style.maskImage = url;
            } else {
                art.style.backgroundImage = url;
            }
            host.appendChild(art);
            return host;
        }

        const initial = doc.createElement('span');
        initial.className = 'ft-avatar__initial';
        initial.textContent = profileInitial(name || id);
        host.appendChild(initial);
        const sticker = px >= 34 ? profileAvatarSticker(id, role) : null;
        if (sticker) {
            const mark = doc.createElement('span');
            mark.className = 'ft-avatar__sticker';
            mark.style.backgroundImage = `url("${doodleUrl(sticker)}")`;
            host.appendChild(mark);
        }
        return host;
    }

    // ============================================================================
    // PLATFORM LABELS (Android PlatformLabelNeutralizer.kt, TERMINOLOGY.md "Labels the video service sends")
    // ============================================================================
    // A label the video service sent (a shelf, tab, chip or playlist name) shown in the extension's
    // own UI, in FilterTube's words. Only whole labels and a few affixes ("Mix – X", "YouTube X",
    // "X on YouTube") are mapped. Never call it for content: titles, channel names, comments.
    const PLATFORM_LABEL_FORMS = Object.freeze({
        clips: ['Shorts', 'YouTube Shorts', 'Short videos', 'ショート', 'ショート動画', '쇼츠', '숏츠', 'शॉर्ट्स', 'शॉर्ट वीडियो', 'شورتس', 'شورتز',
            'شارٹس', 'শর্টস', 'ชอร์ต', 'ஷார்ட்ஸ்', 'షార్ట్స్', 'ಶಾರ್ಟ್ಸ್', 'શોર્ટ્સ', 'ሾርትስ', 'Шортс'],
        followingTab: ['Subscriptions', 'Your subscriptions', 'Suscripciones', 'Tus suscripciones', 'Inscrições', 'Suas inscrições', 'Abonnements',
            'Vos abonnements', 'Abos', 'Deine Abos', 'Iscrizioni', 'Le tue iscrizioni', 'Подписки', 'Ваши подписки', '登録チャンネル', '구독', '订阅',
            '订阅内容', '訂閱', '訂閱內容', 'الاشتراكات', 'اشتراكاتك', 'सदस्यताएं', 'सदस्यताएँ', 'सब्सक्रिप्शन', 'Abonelikler', 'Langganan',
            'Subscription', 'Kênh đăng ký', 'การติดตาม', 'Mga Subscription', 'اشتراک‌ها', 'سبسکرپشنز', 'Usajili', 'সাবস্ক্রিপশন', 'சந்தாக்கள்',
            'సబ్‌స్క్రిప్షన్‌లు', 'सदस्यत्वे', 'સબ્સ્ક્રિપ્શન', 'ಸಬ್‌ಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು'],
        follow: ['Subscribe', 'Suscribirse', 'Suscríbete', 'Inscrever-se', "S'abonner", 'S’abonner', 'Abonnieren', 'Iscriviti', 'チャンネル登録',
            '구독하기', '订阅频道', '訂閱頻道', 'اشترِك', 'اشتراك', 'सदस्यता लें', 'सब्सक्राइब करें', 'Abone ol', 'Đăng ký', 'Mag-subscribe',
            'সাবস্ক্রাইব করুন', 'குழுசேர்', 'సబ్‌స్క్రయిబ్ చేయండి', 'सदस्यता घ्या', 'સબ્સ્ક્રાઇબ કરો', 'ಸಬ್‌ಸ್ಕ್ರೈಬ್ ಮಾಡಿ', 'سبسکرائب کریں'],
        followingState: ['Subscribed', 'Suscrito', 'Inscrito', 'Abonné', 'Abonniert', 'Iscritto', '登録済み', '구독중', '구독 중', '已订阅', '已訂閱',
            'مشترك', 'सदस्यता ली गई', 'सब्सक्राइब किया हुआ', 'Abone olundu', 'Đã đăng ký', 'Naka-subscribe', 'সাবস্ক্রাইব করা হয়েছে'],
        saved: ['Watch later', 'Ver más tarde', 'Ver después', 'Assistir mais tarde', 'À regarder plus tard', 'Später ansehen', 'Guarda più tardi',
            'Смотреть позже', '後で見る', '나중에 볼 동영상', '稍后观看', '稍後觀看', 'مشاهدة لاحقًا', 'المشاهدة لاحقًا', 'बाद में देखें', 'Daha sonra izle',
            'Tonton Nanti', 'Xem sau', 'ดูภายหลัง', 'Panoorin Mamaya', 'পরে দেখুন', 'பின்னர் பார்', 'తర్వాత చూడండి', 'नंतर पहा', 'પછી જુઓ',
            'ನಂತರ ವೀಕ್ಷಿಸಿ', 'بعد میں دیکھیں', 'Tazama baadaye'],
        popular: ['Trending', 'Tendencias', 'Tendencia', 'Em alta', 'Tendances', 'Trends', 'Tendenze', 'В тренде', 'Популярное на YouTube', '急上昇',
            '인기 급상승', '인기 급상승 동영상', '时下流行', '發燒影片', 'المحتوى الرائج', 'रुझान में', 'ट्रेंडिंग', 'Trendler', 'Thịnh hành', 'มาแรง',
            'ট্রেন্ডিং', 'ترند'],
        posts: ['Community', 'Community posts', 'Comunidad', 'Comunidade', 'Communauté', 'Сообщество', 'コミュニティ', '커뮤니티', '社区', '社群',
            'المنتدى', 'المجتمع', 'कम्युनिटी', 'समुदाय', 'Topluluk', 'Komunitas', 'Cộng đồng', 'ชุมชน', 'কমিউনিটি', 'Komunidad'],
        paidChat: ['Super Chat', 'Super Chats', 'スーパーチャット', '슈퍼챗', '超级留言', '超級留言'],
        music: ['YouTube Music', 'YT Music', 'YouTube Музыка', 'YouTube音乐', 'YouTube 音樂'],
        kids: ['YouTube Kids', 'YouTube Niños', 'YouTube Детям'],
        autoPlaylist: ['Mix', 'My Mix', 'Your Mix', 'Mi mix', 'Mon mix', 'Mein Mix', 'Il mio mix', 'Meu mix', 'Мой микс', 'Микс', 'マイミックス',
            'ミックス', '믹스', '내 믹스', '合辑', '合輯', 'ميكس', 'मिक्स'],
        autoPlaylists: ['Mixes', 'My Mixes', 'Your Mixes', 'Mis mixes', 'Mes mix', 'Meine Mixe', 'Миксы', 'ミックスリスト']
    });
    const PLATFORM_LABEL_WORDS = Object.freeze({
        clips: 'Clips', followingTab: 'Following', follow: 'Follow', followingState: 'Following', saved: 'Saved', popular: 'Popular',
        posts: 'Posts', paidChat: 'Paid chat', music: 'Sangeet', kids: 'Kids', autoPlaylist: 'Auto playlist', autoPlaylists: 'Auto playlists'
    });
    const platformLabelKey = label => String(label).trim().replace(/\s+/g, ' ').replace(/[:：]+$/, '').toLowerCase();
    const PLATFORM_LABEL_INDEX = (() => {
        const index = new Map();
        for (const [term, forms] of Object.entries(PLATFORM_LABEL_FORMS)) {
            for (const form of forms) if (!index.has(platformLabelKey(form))) index.set(platformLabelKey(form), term);
        }
        return index;
    })();
    const PLATFORM_MIX_PREFIX = /^(?:Mix|My Mix|Mezcla|Микс|ミックス|믹스|合辑|合輯|ميكس|मिक्स)(?:\s*[–—:|]\s*|\s+-\s+)(.+)$/iu;
    const PLATFORM_BRAND_PREFIX = /^(?:YouTube|YT)\s+(.+)$/iu;
    const PLATFORM_BRAND_SUFFIX = /^(.+?)\s+(?:on|from|en|sur|auf|su|no|na|в|на)\s+YouTube$/iu;

    /** FilterTube's (localized) word for a platform UI label, or the label unchanged. Display only. */
    function neutralizePlatformLabel(raw, words = null) {
        if (typeof raw !== 'string') return raw;
        const label = raw.trim();
        if (!label) return raw;
        const word = term => (words && typeof words[term] === 'string')
            ? words[term] : localizedComponentText(`platformLabel.${term}`, PLATFORM_LABEL_WORDS[term]);
        const whole = PLATFORM_LABEL_INDEX.get(platformLabelKey(label));
        if (whole) return word(whole);
        const mix = label.match(PLATFORM_MIX_PREFIX);
        if (mix) {
            const name = mix[1].trim();
            return (words && typeof words.autoPlaylistNamed === 'string')
                ? words.autoPlaylistNamed.replace('{name}', name)
                : localizedComponentText('platformLabel.autoPlaylistNamed', 'Auto playlist · {name}', { name });
        }
        const suffix = label.match(PLATFORM_BRAND_SUFFIX);
        if (suffix) return neutralizePlatformLabel(suffix[1], words);
        const prefix = label.match(PLATFORM_BRAND_PREFIX);
        if (prefix) return neutralizePlatformLabel(prefix[1], words);
        return raw;
    }

    // ============================================================================
    // BUTTONS
    // ============================================================================

    /**
     * Create a primary button
     * @param {Object} options - Button options
     * @param {string} options.text - Button text
     * @param {Function} options.onClick - Click handler
     * @param {string} options.id - Optional ID
     * @param {string} options.className - Additional classes
     * @param {boolean} options.small - Use small size
     * @returns {HTMLButtonElement}
     */
    function createButton({ text, onClick, id, className = '', small = false }) {
        const btn = document.createElement('button');
        btn.className = `btn-primary ${small ? 'btn-small' : ''} ${className}`.trim();
        btn.textContent = text;
        if (id) btn.id = id;
        if (onClick) btn.addEventListener('click', onClick);
        return btn;
    }

    /**
     * Flash a button with success feedback
     * @param {HTMLButtonElement} button - Button element
     * @param {string} successText - Text to show on success (default: "Saved!")
     * @param {number} duration - Duration in ms (default: 1500)
     */
    function flashButtonSuccess(button, successText = localizedComponentText('render.saved', 'Saved!'), duration = 1500) {
        if (!button) return;

        // Store original text in dataset if not already stored
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
        }
        const originalBg = button.style.backgroundColor;
        const originalColor = button.style.color;
        const originalBorder = button.style.borderColor;

        button.textContent = successText;
        button.style.backgroundColor = Colors.statusSuccess;
        button.style.color = 'white';
        button.style.borderColor = Colors.statusSuccess;
        button.classList.add('btn-success-flash');

        setTimeout(() => {
            button.textContent = button.dataset.originalText; // Restore from dataset
            delete button.dataset.originalText; // Clean up dataset
            button.style.backgroundColor = originalBg;
            button.style.color = originalColor;
            button.style.borderColor = originalBorder;
            button.classList.remove('btn-success-flash');
        }, duration);
    }

    /**
     * Create a toggle button (like Exact)
     * @param {Object} options - Toggle options
     * @param {string} options.text - Button text
     * @param {boolean} options.active - Initial active state
     * @param {Function} options.onToggle - Toggle handler
     * @param {string} options.className - Additional classes
     * @param {string} options.title - Optional hover/focus help text
     * @param {string} options.ariaLabel - Optional accessible label
     * @returns {HTMLElement}
     */
    function createToggleButton({ text, active = false, onToggle, className = '', title = '', ariaLabel = '' }) {
        const toggle = document.createElement('div');
        toggle.className = `exact-toggle ${active ? 'active' : ''} ${className}`.trim();
        toggle.textContent = text;
        if (title) toggle.title = title;
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('aria-pressed', active);
        if (ariaLabel || title) toggle.setAttribute('aria-label', ariaLabel || `${text}: ${title}`);
        toggle.setAttribute('tabindex', '0');

        toggle.addEventListener('click', () => {
            const newState = !toggle.classList.contains('active');
            toggle.classList.toggle('active');
            toggle.setAttribute('aria-pressed', newState);
            if (onToggle) onToggle(newState);
        });

        // Keyboard accessibility
        toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle.click();
            }
        });

        return toggle;
    }

    /**
     * Create a delete button
     * @param {Function} onClick - Click handler
     * @returns {HTMLButtonElement}
     */
    function createDeleteButton(onClick) {
        const btn = document.createElement('button');
        btn.className = 'delete-btn';
        const deleteLabel = localizedComponentText('render.deleteRule', 'Delete');
        btn.setAttribute('aria-label', deleteLabel);
        btn.setAttribute('title', deleteLabel);
        btn.setAttribute('data-ft-i18n-aria-label', 'render.deleteRule');
        btn.setAttribute('data-ft-i18n-title', 'render.deleteRule');
        btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        if (onClick) btn.addEventListener('click', onClick);
        return btn;
    }

    // ============================================================================
    // INPUTS
    // ============================================================================

    /**
     * Create a text input
     * @param {Object} options - Input options
     * @param {string} options.placeholder - Placeholder text
     * @param {string} options.value - Initial value
     * @param {Function} options.onInput - Input handler
     * @param {Function} options.onEnter - Enter key handler
     * @param {string} options.id - Optional ID
     * @param {string} options.className - Additional classes
     * @returns {HTMLInputElement}
     */
    function createInput({ placeholder = '', value = '', onInput, onEnter, id, className = '' }) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = `text-input ${className}`.trim();
        input.placeholder = placeholder;
        input.value = value;
        if (id) input.id = id;

        if (onInput) {
            input.addEventListener('input', (e) => onInput(e.target.value));
        }

        if (onEnter) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') onEnter();
            });
        }

        return input;
    }

    /**
     * Create a search input
     * @param {Object} options - Search input options
     * @param {string} options.placeholder - Placeholder text
     * @param {Function} options.onSearch - Search handler (receives search term)
     * @param {string} options.id - Optional ID
     * @returns {HTMLInputElement}
     */
    function createSearchInput({ placeholder = 'Search...', onSearch, id }) {
        const input = createInput({
            placeholder,
            id,
            className: 'search-input',
            onInput: onSearch
        });
        return input;
    }

    // ============================================================================
    // TABS
    // ============================================================================

    /**
     * Create a tabbed interface
     * @param {Object} options - Tab options
     * @param {Array} options.tabs - Array of {id, label, content}
     * @param {string} options.defaultTab - Default active tab ID
     * @param {Function} options.onTabChange - Tab change handler
     * @returns {Object} - {container, switchTab, getCurrentTab}
     */
    function createTabs({ tabs, defaultTab, onTabChange }) {
        const container = document.createElement('div');
        container.className = 'tabs-container';

        // Tab buttons
        const tabButtons = document.createElement('div');
        tabButtons.className = 'tab-buttons';

        // Tab content area
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';

        let currentTab = defaultTab || tabs[0]?.id;

        tabs.forEach(tab => {
            // Create button
            const btn = document.createElement('button');
            btn.className = `tab-button ${tab.id === currentTab ? 'active' : ''}`;
            btn.innerHTML = tab.label;
            btn.setAttribute('data-tab-id', tab.id);
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-selected', tab.id === currentTab);

            btn.addEventListener('click', () => switchTab(tab.id));

            tabButtons.appendChild(btn);

            // Create content wrapper
            const contentWrapper = document.createElement('div');
            contentWrapper.className = `tab-pane ${tab.id === currentTab ? 'active' : ''}`;
            contentWrapper.setAttribute('data-tab-id', tab.id);
            contentWrapper.setAttribute('role', 'tabpanel');

            if (typeof tab.content === 'string') {
                contentWrapper.innerHTML = tab.content;
            } else if (tab.content instanceof HTMLElement) {
                contentWrapper.appendChild(tab.content);
            }

            tabContent.appendChild(contentWrapper);
        });

        function switchTab(tabId) {
            // Update buttons
            tabButtons.querySelectorAll('.tab-button').forEach(btn => {
                const isActive = btn.getAttribute('data-tab-id') === tabId;
                btn.classList.toggle('active', isActive);
                btn.setAttribute('aria-selected', isActive);
            });

            // Update content
            tabContent.querySelectorAll('.tab-pane').forEach(pane => {
                const isActive = pane.getAttribute('data-tab-id') === tabId;
                pane.classList.toggle('active', isActive);
            });

            currentTab = tabId;
            if (onTabChange) onTabChange(tabId);
        }

        function getCurrentTab() {
            return currentTab;
        }

        container.appendChild(tabButtons);
        container.appendChild(tabContent);

        return {
            container,
            switchTab,
            getCurrentTab
        };
    }

    // ============================================================================
    // LISTS & CARDS
    // ============================================================================

    /**
     * Create a list item for keywords/channels
     * @param {Object} options - List item options
     * @param {string} options.text - Item text
     * @param {boolean} options.exact - Exact match state (for keywords)
     * @param {Function} options.onToggleExact - Exact toggle handler
     * @param {Function} options.onDelete - Delete handler
     * @returns {HTMLElement}
     */
    function createListItem({ text, exact, onToggleExact, onDelete }) {
        const item = document.createElement('div');
        item.className = 'list-item';

        const textSpan = document.createElement('span');
        textSpan.className = 'item-word';
        textSpan.textContent = text;

        const controls = document.createElement('div');
        controls.className = 'item-controls';

        // Add exact toggle if handler provided
        if (typeof onToggleExact === 'function') {
            const exactToggle = createToggleButton({
                text: 'Exact',
                active: exact || false,
                onToggle: onToggleExact,
                title: exact
                    ? 'Exact is on: this keyword matches as its own word.'
                    : 'Exact is off: broader matching can catch plurals and longer forms.'
            });
            controls.appendChild(exactToggle);
        }

        // Add delete button
        const deleteBtn = createDeleteButton(onDelete);
        controls.appendChild(deleteBtn);

        item.appendChild(textSpan);
        item.appendChild(controls);

        return item;
    }

    /**
     * Create an empty state message
     * @param {string} message - Message to display
     * @returns {HTMLElement}
     */
    function createEmptyState(message) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = message;
        return empty;
    }

    // ============================================================================
    // CHECKBOXES & SWITCHES
    // ============================================================================

    /**
     * Create a checkbox with label and description
     * @param {Object} options - Checkbox options
     * @param {string} options.id - Checkbox ID
     * @param {string} options.label - Label text
     * @param {string} options.description - Description text (optional)
     * @param {boolean} options.checked - Initial checked state
     * @param {Function} options.onChange - Change handler
     * @param {boolean} options.disabled - Disabled state
     * @returns {HTMLElement} Checkbox container
     */
    function createCheckbox({ id, label, description, checked = false, onChange, disabled = false }) {
        const container = document.createElement('div');
        container.className = 'toggle-row';

        const labelContainer = document.createElement('div');
        labelContainer.className = 'toggle-label';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'toggle-title';
        titleSpan.textContent = label;
        labelContainer.appendChild(titleSpan);

        if (description) {
            const descSpan = document.createElement('span');
            descSpan.className = 'toggle-desc';
            descSpan.textContent = description;
            labelContainer.appendChild(descSpan);
        }

        // Create switch
        const switchLabel = document.createElement('label');
        switchLabel.className = 'switch';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = id;
        checkbox.checked = checked;
        checkbox.disabled = disabled;

        if (onChange) {
            checkbox.addEventListener('change', (e) => onChange(e.target.checked));
        }

        const slider = document.createElement('span');
        slider.className = 'slider round';

        switchLabel.appendChild(checkbox);
        switchLabel.appendChild(slider);

        container.appendChild(labelContainer);
        container.appendChild(switchLabel);

        return container;
    }

    // ============================================================================
    // SELECT DROPDOWNS
    // ============================================================================

    /**
     * Create a select dropdown
     * @param {Object} options - Select options
     * @param {string} options.id - Select ID
     * @param {Array} options.options - Array of {value, label}
     * @param {string} options.value - Initial value
     * @param {Function} options.onChange - Change handler
     * @param {string} options.className - Additional classes
     * @returns {HTMLSelectElement}
     */
    function createSelect({ id, options = [], value, onChange, className = '' }) {
        const select = document.createElement('select');
        select.className = `select-input ${className}`.trim();
        if (id) select.id = id;

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === value) option.selected = true;
            select.appendChild(option);
        });

        if (onChange) {
            select.addEventListener('change', (e) => onChange(e.target.value));
        }

        return select;
    }

    function createDropdownFromSelect(selectEl, { className = '', showAvatar = false, showSubtitle = false } = {}) {
        const select = selectEl;
        if (!select || !(select instanceof HTMLSelectElement)) return null;

        try {
            if (select.dataset.ftSelectEnhanced === 'true') {
                return null;
            }
            if (select.closest('.ft-select-menu')) {
                return null;
            }
        } catch (e) {
        }

        const wrapper = document.createElement('div');
        wrapper.className = `ft-select-menu ${className}`.trim();

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'select-input ft-select-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');

        const dropdown = document.createElement('div');
        dropdown.className = 'ft-profile-dropdown ft-select-dropdown';
        dropdown.setAttribute('role', 'listbox');
        dropdown.hidden = true;
        // Move dropdown to body to prevent clipping by parent containers
        document.body.appendChild(dropdown);

        const originalParent = select.parentNode;
        if (originalParent) {
            originalParent.insertBefore(wrapper, select);
        }

        const updateTriggerLabel = () => {
            const currentValue = select.value;
            let selected = null;
            if (currentValue) {
                selected = Array.from(select.options).find(opt => opt.value === currentValue) || null;
            }
            if (!selected && select.selectedIndex >= 0) {
                selected = select.options[select.selectedIndex];
            }
            if (!selected && select.options.length > 0) {
                selected = select.options[0];
            }
            trigger.textContent = selected ? selected.textContent : '';
        };

        const close = () => {
            dropdown.hidden = true;
            dropdown.style.visibility = '';
            dropdown.style.left = '';
            dropdown.style.top = '';
            trigger.setAttribute('aria-expanded', 'false');
            dropdown.style.transform = '';
        };

        const syncDisabled = () => {
            try {
                trigger.disabled = !!select.disabled;
                trigger.setAttribute('aria-disabled', select.disabled ? 'true' : 'false');
                if (select.disabled) {
                    close();
                }
            } catch (e) {
            }
        };

        const position = () => {
            if (dropdown.hidden) return;
            try {
                const triggerRect = trigger.getBoundingClientRect();
                // Force a layout calculation to get actual dropdown dimensions
                dropdown.style.visibility = 'hidden';
                dropdown.style.display = 'block';
                const dropdownHeight = dropdown.offsetHeight || 280;
                const dropdownWidth = dropdown.offsetWidth || triggerRect.width;
                dropdown.style.display = '';
                dropdown.style.visibility = 'hidden';
                
                const pad = 8;
                const maxRight = window.innerWidth - pad;
                const maxBottom = window.innerHeight - pad;

                // Calculate available space above and below
                const spaceBelow = maxBottom - triggerRect.bottom;
                const spaceAbove = triggerRect.top - pad;
                
                // Decide whether to show above or below
                let top;
                if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
                    // Show below (default)
                    top = triggerRect.bottom + pad;
                } else {
                    // Show above
                    top = triggerRect.top - dropdownHeight - pad;
                }
                
                // Ensure dropdown doesn't go off-screen vertically
                if (top + dropdownHeight > maxBottom) {
                    top = maxBottom - dropdownHeight;
                }
                if (top < pad) {
                    top = pad;
                }

                // Horizontal positioning
                let left = triggerRect.left;
                
                // Ensure dropdown doesn't go off right edge
                if (left + dropdownWidth > maxRight) {
                    left = maxRight - dropdownWidth;
                }
                // Ensure dropdown doesn't go off left edge
                if (left < pad) {
                    left = pad;
                }

                dropdown.style.top = `${top}px`;
                dropdown.style.left = `${left}px`;
                dropdown.style.minWidth = `${triggerRect.width}px`;
                // Reveal only after we have a valid position to avoid a flash at (0,0)
                dropdown.style.visibility = '';
            } catch (e) {
            }
        };

        let positionRaf = 0;

        const schedulePosition = () => {
            if (dropdown.hidden) return;
            if (positionRaf) return;
            positionRaf = requestAnimationFrame(() => {
                positionRaf = 0;
                position();
            });
        };

        const toggle = () => {
            if (select.disabled) {
                syncDisabled();
                return;
            }
            const next = !dropdown.hidden;
            if (next) {
                // Closing
                if (positionRaf) {
                    cancelAnimationFrame(positionRaf);
                    positionRaf = 0;
                }
                dropdown.hidden = true;
                trigger.setAttribute('aria-expanded', 'false');
                return;
            }
            // Opening
            applyAccentVars();
            updateTriggerLabel();
            rebuildOptions();
            dropdown.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            // Keep invisible and near trigger until positioned to avoid first-click jump
            dropdown.style.visibility = 'hidden';
            const trigRect = trigger.getBoundingClientRect();
            dropdown.style.left = `${trigRect.left}px`;
            dropdown.style.top = `${trigRect.bottom}px`;
            // Position twice (layout + paint) before revealing
            requestAnimationFrame(() => {
                position();
                requestAnimationFrame(() => {
                    position();
                    dropdown.style.visibility = '';
                });
            });
        };

        const resolveContextSubtitle = () => {
            try {
                const explicit = (select.getAttribute('data-subtitle') || '').trim();
                if (explicit) return explicit;

                const container = select.closest('.sort-controls, .date-range-controls, .toggle-row, .import-export-actions, .actions')
                    || select.parentElement;
                if (!container) return '';

                const labelEl = container.querySelector('.label, .toggle-title');
                const raw = (labelEl?.textContent || '').trim();
                if (!raw) return '';
                return raw.replace(/\s*:\s*$/, '');
            } catch (e) {
                return '';
            }
        };

        const contextSubtitle = resolveContextSubtitle();

        const getAccentVars = () => {
            try {
                const rootEl = document.documentElement;
                // First check inline styles (set by renderProfileSelectorTab)
                let accent = (rootEl.style.getPropertyValue('--ft-select-accent') || '').trim();
                let accentBg = (rootEl.style.getPropertyValue('--ft-select-accent-bg') || '').trim();
                let accentBorder = (rootEl.style.getPropertyValue('--ft-select-border') || '').trim();
                
                // Fallback to computed styles if not found inline
                if (!accent || !accentBg || !accentBorder) {
                    const rootStyles = window.getComputedStyle(rootEl);
                    accent = accent || (rootStyles.getPropertyValue('--ft-select-accent') || '').trim();
                    accentBg = accentBg || (rootStyles.getPropertyValue('--ft-select-accent-bg') || '').trim();
                    accentBorder = accentBorder || (rootStyles.getPropertyValue('--ft-select-border') || '').trim();
                }
                
                // Fallback to brand colors if not set
                return { 
                    accent: accent || 'rgba(74, 157, 127, 1)', 
                    accentBg: accentBg || 'rgba(74, 157, 127, 0.16)', 
                    accentBorder: accentBorder || 'rgba(74, 157, 127, 0.65)' 
                };
            } catch (e) {
                return { 
                    accent: 'rgba(74, 157, 127, 1)', 
                    accentBg: 'rgba(74, 157, 127, 0.16)', 
                    accentBorder: 'rgba(74, 157, 127, 0.65)' 
                };
            }
        };

        const applyAccentVars = () => {
            const vars = getAccentVars();
            if (vars.accent) wrapper.style.setProperty('--ft-profile-accent', vars.accent);
            if (vars.accentBg) wrapper.style.setProperty('--ft-profile-accent-bg', vars.accentBg);
            if (vars.accentBorder) wrapper.style.setProperty('--ft-profile-accent-border', vars.accentBorder);
        };

        const rebuildOptions = () => {
            dropdown.innerHTML = '';
            Array.from(select.options).forEach((opt) => {
                const value = opt.value;
                const label = opt.textContent;

                if (opt.disabled && !value) {
                    const header = document.createElement('div');
                    header.className = 'ft-profile-dropdown-group';
                    header.setAttribute('role', 'presentation');
                    header.textContent = label || '';
                    dropdown.appendChild(header);
                    return;
                }

                if (opt.disabled) {
                    return;
                }

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `ft-profile-dropdown-item ft-select-option${select.value === value ? ' is-active' : ''}`;
                btn.setAttribute('role', 'option');
                btn.setAttribute('aria-selected', select.value === value ? 'true' : 'false');

                applyAccentVars();
                const vars = getAccentVars();
                if (vars.accent) btn.style.setProperty('--ft-profile-accent', vars.accent);
                if (vars.accentBg) btn.style.setProperty('--ft-profile-accent-bg', vars.accentBg);
                if (vars.accentBorder) btn.style.setProperty('--ft-profile-accent-border', vars.accentBorder);

                if (showAvatar) {
                    const avatar = document.createElement('div');
                    avatar.className = 'ft-profile-dropdown-avatar';
                    const initial = (label || '').trim().slice(0, 1).toUpperCase() || '?';
                    avatar.textContent = initial;
                    avatar.style.backgroundColor = vars.accentBg || 'rgba(74, 157, 127, 0.16)';
                    avatar.style.color = vars.accent || 'rgba(74, 157, 127, 1)';
                    avatar.style.borderColor = vars.accentBorder || '';
                    btn.appendChild(avatar);
                }

                const meta = document.createElement('div');
                meta.className = 'ft-profile-dropdown-meta';

                const nameEl = document.createElement('div');
                nameEl.className = 'ft-profile-dropdown-name';
                nameEl.textContent = label || '';
                meta.appendChild(nameEl);

                if (showSubtitle) {
                    const subtitleEl = document.createElement('div');
                    subtitleEl.className = 'ft-profile-dropdown-subtitle';
                    subtitleEl.textContent = ((opt.getAttribute('data-subtitle') || '').trim() || contextSubtitle);
                    meta.appendChild(subtitleEl);
                }

                btn.appendChild(meta);

                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Update select value and dispatch change
                    select.value = value;
                    // Force change event to bubble up properly
                    const changeEvent = new Event('change', { 
                        bubbles: true, 
                        cancelable: true,
                        composed: true
                    });
                    select.dispatchEvent(changeEvent);
                    // Also trigger input event for completeness
                    select.dispatchEvent(new Event('input', { bubbles: true }));
                    updateTriggerLabel();
                    close();
                });

                dropdown.appendChild(btn);
            });
        };

        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle();
        });

        window.addEventListener('resize', () => {
            schedulePosition();
        });

        window.addEventListener('scroll', () => {
            schedulePosition();
        }, true);

        document.addEventListener('click', (e) => {
            try {
                if (wrapper.contains(e.target) || dropdown.contains(e.target)) return;
                close();
            } catch (err) {
                close();
            }
        });

        select.addEventListener('change', () => {
            applyAccentVars();
            syncDisabled();
            updateTriggerLabel();
            rebuildOptions();
        });

        // Allow external code to update the select value and refresh the UI without triggering change handlers
        select.addEventListener('input', () => {
            updateTriggerLabel();
            rebuildOptions();
        });

        try {
            const obs = new MutationObserver(() => {
                syncDisabled();
            });
            obs.observe(select, { attributes: true, attributeFilter: ['disabled'] });
        } catch (e) {
        }

        select.style.display = 'none';

        try {
            select.dataset.ftSelectEnhanced = 'true';
        } catch (e) {
        }

        applyAccentVars();
        syncDisabled();
        updateTriggerLabel();
        rebuildOptions();

        wrapper.appendChild(trigger);
        // dropdown is already appended to document.body earlier
        wrapper.appendChild(select);

        return { wrapper, trigger, dropdown, select };
    }

    // ============================================================================
    // ICON BUTTONS
    // ============================================================================

    /**
     * Create an icon button
     * @param {Object} options - Icon button options
     * @param {string} options.icon - SVG icon HTML
     * @param {string} options.title - Tooltip title and accessible name fallback
     * @param {string} options.ariaLabel - Optional accessible name
     * @param {Function} options.onClick - Click handler
     * @param {string} options.className - Additional classes
     * @returns {HTMLButtonElement}
     */
    function createIconButton({ icon, title, ariaLabel = '', onClick, className = '' }) {
        const btn = document.createElement('button');
        btn.className = `icon-btn ${className}`.trim();
        btn.innerHTML = icon;
        if (title) btn.title = title;
        const accessibleLabel = ariaLabel || title;
        if (accessibleLabel) btn.setAttribute('aria-label', accessibleLabel);
        if (onClick) btn.addEventListener('click', onClick);
        return btn;
    }

    // ============================================================================
    // BADGES & LABELS
    // ============================================================================

    /**
     * Create a badge
     * @param {Object} options - Badge options
     * @param {string} options.text - Badge text
     * @param {string} options.variant - Badge variant: 'success', 'warning', 'info', 'danger'
     * @param {string} options.title - Tooltip title
     * @param {string} options.className - Additional classes
     * @returns {HTMLElement}
     */
    function createBadge({ text, variant = 'info', title, className = '' }) {
        const badge = document.createElement('span');
        badge.className = `badge badge-${variant} ${className}`.trim();
        badge.textContent = text;
        if (title) badge.title = title;
        return badge;
    }

    /**
     * Create a channel logo image
     * @param {Object} options - Logo options
     * @param {string} options.src - Image source URL
     * @param {string} options.alt - Alt text
     * @param {string} options.size - Size: 'small', 'medium', 'large'
     * @returns {HTMLImageElement}
     */
    function createChannelLogo({ src, alt = 'Channel logo', size = 'medium' }) {
        const img = document.createElement('img');
        img.className = `channel-logo channel-logo-${size}`;

        const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';

        img.src = src || defaultAvatar;
        img.alt = alt;
        img.onerror = () => { img.src = defaultAvatar; };

        return img;
    }

    // ============================================================================
    // COMPOSITE COMPONENTS
    // ============================================================================

    /**
     * Create an input row with input and button
     * @param {Object} options - Input row options
     * @param {HTMLInputElement} options.input - Input element
     * @param {HTMLButtonElement} options.button - Button element
     * @returns {HTMLElement}
     */
    function createInputRow({ input, button }) {
        const row = document.createElement('div');
        row.className = 'input-row';
        if (input) row.appendChild(input);
        if (button) row.appendChild(button);
        return row;
    }

    // ============================================================================
    // UTILITIES
    // ============================================================================

    /**
     * Show a toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type: 'success', 'error', 'info'
     * @param {number} duration - Duration in ms (default: 3000)
     */
    function showToast(message, type = 'info', duration = 3000) {
        // Remove existing toasts
        document.querySelectorAll('.ft-toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `ft-toast ft-toast-${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    return {
        Colors,
        getProfileColors,
        PROFILE_AVATAR_DOODLES,
        profileRole,
        normalizeProfileAvatar,
        profileAvatarDoodle,
        profileAvatarSticker,
        profileInitial,
        renderProfileAvatar,
        neutralizePlatformLabel,
        createButton,
        flashButtonSuccess,
        createToggleButton,
        createDeleteButton,
        createInput,
        createSearchInput,
        createCheckbox,
        createSelect,
        createDropdownFromSelect,
        createIconButton,
        createBadge,
        createChannelLogo,
        createInputRow,
        createTabs,
        createListItem,
        createEmptyState,
        showToast
    };
})();

try {
    if (typeof window !== 'undefined') {
        window.UIComponents = UIComponents;
    }
} catch (e) {
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIComponents;
}
