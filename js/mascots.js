/* FilterTube's companions in the extension's own pages (docs: study-mode/mascots/BIBLE.md, "Extension").
 * Kriti and Uljhan are the only characters; doodles are accents, never characters.
 * - Popup: a still sparkle doodle beside the hidden counter; Kriti's sieve loop once at 100, 1,000 and
 *   10,000 hidden; Kriti with the upside-down sieve while the allow list (whitelist) is on.
 * - Options page: Kriti holding the logo on the first open after install; Kriti peeking over an empty
 *   keyword or channel list; Uljhan shrugging when a search finds nothing; Kriti's thumbs up after a
 *   backup import; Kriti waving over "Just you so far" in the profiles manager.
 * - Moments (moment()): one pose and one line for loading, empty, nothing-found and done states, with
 *   a slow breath (three cycles, then still) on Lively. Never on the player, a lock or a PIN screen.
 *   Loading is Uljhan fetching, with a line that never repeats one of the last three.
 * - Brand moments: Kriti sieving Uljhan on the dashboard hero (once on Lively, then a few small hops and
 *   rest), Kriti peeking over the sidebar footer, the pair on About, Kriti's thumbs up on a success toast
 *   and Uljhan's shrug on an error toast, Uljhan on the offline, slow and back-online strip (offline he
 *   tangles himself in his string; back online Kriti unwinds him).
 * - The 2026-11-18 moments: Kriti holding a sign with "Locked until <time>" written on it beside a
 *   Self-Control or study-lock refusal (a still); the duo's backup stamp after an export or import, once a
 *   day; Kriti's magnifier and Uljhan's shrug over a search that found nothing.
 * - Support (Donate page and the dashboard card): the words and the pose rotate; every variant says that
 *   FilterTube is free and that support is optional, and claims nothing else.
 * - Sounds (Off by default; Gentle or Playful): never carry meaning on their own, and stay silent
 *   while the page is hidden.
 * - The Companion setting (Lively, Quiet, Off; Quiet by default) lives in chrome.storage.local beside the
 *   theme. Lively: lines appear in paper bubbles, including after events. Quiet: poses only; nothing pops
 *   up, a pose shows its line on hover, focus or click, and empty-list and welcome lines stay as plain
 *   captions. Off: no characters at all.
 * Motion is frame swaps plus transform and opacity. With reduced motion the last frame shows at once.
 * Copy comes from data/ui_locales; nothing names the video site.
 */
(function (root) {
    'use strict';
    if (!root || root.FilterTubeMascots) return;

    const COMPANION_KEY = 'ftCompanionMode';
    const MILESTONES_KEY = 'ftMascotMilestonesSeen';
    const WELCOME_KEY = 'ftMascotWelcomePending';
    const LAST_LIST_MODE_KEY = 'ftMascotLastListMode';
    // The local day the popup's counter card last played its first-of-the-day moment.
    const TALLY_DAY_KEY = 'ftMascotTallyDay';
    const MODES = Object.freeze(['lively', 'quiet', 'off']);
    const DEFAULT_MODE = 'quiet';
    const MILESTONES = Object.freeze([100, 1000, 10000]);
    const SIEVE_FRAME_MS = 180;
    const SIEVE_LOOPS = 2;
    const SIEVE_FRAME_COUNT = 5;
    const BUBBLE_MAX_CHARS = 48;
    const EVENT_BUBBLE_MS = 5000;
    const ASSET_DIR = 'assets/images/mascots/';
    // The app's own art (res/drawable-nodpi/study_*.webp), byte for byte, under the extension's names.
    const ASSETS = Object.freeze({
        counterMark: '../doodles/sparkle.webp',
        // KRITI_LOGO_HUG and KRITI_LOGO_SIEVE (the app's whitelist pose); the other three logo poses
        // come up in the loading moments only.
        kritiLogo: 'kriti_logo_01.webp',
        kritiAllow: 'kriti_logo_03.webp',
        kritiLogoHat: 'kriti_logo_02.webp',
        kritiLogoBadge: 'kriti_logo_04.webp',
        kritiLogoTelescope: 'kriti_logo_05.webp',
        kritiPeek: 'kriti_peek.webp',
        // Perched low over an edge (the sidebar footer, the popup's counter card).
        kritiPeekLow: 'kriti_peek_low.webp',
        // Looking hard: a search's wait (LoadingPersonality, search scene).
        kritiMagnifier: 'kriti_magnifier.webp',
        kritiThumbsUp: 'kriti_thumbsup.webp',
        kritiWave: 'kriti_pose_01.webp',
        kritiReading: 'kriti_pose_04.webp',
        kritiThinking: 'kriti_pose_03.webp',
        uljhanShrug: 'uljhan_pose_02.webp',
        // Kriti holding the logo funnel is the sieve loop's last frame (ASSETS.sieve[4]); the old kitchen
        // sieve pose is gone (Android KRITI_FUNNEL -> study_kriti_loading_05).
        // Self-Control and study-lock refusals: Kriti holds a blank sign; the page writes "Locked until <time>".
        kritiLockedSign: 'kriti_locked_sign.webp',
        kritiNotebook: 'kriti_notebook.webp',
        kritiPointing: 'kriti_pose_08.webp',
        // Study's perch poses (StudyFocusActivity.KritiPerch): before a session she reads, on a break she's
        // happy, in the last five minutes she holds up a blank sign (the page writes "5 min" on it), after
        // Skip break she salutes, and the end card's seal brings her medal.
        // The owner's 2026-11-18 poses (kriti_pose_01..08, uljhan_pose_01..06; POSES names them): cheer.
        kritiHappy: 'kriti_pose_02.webp',
        kritiSignRaised: 'kriti_sign_raised.webp',
        kritiSalute: 'kriti_salute.webp',
        // Proud, for achievements (the Study end card's seal).
        kritiMedal: 'kriti_pose_06.webp',
        // Sleepy (late night), shh (Study focus).
        kritiSleepy: 'kriti_pose_05.webp',
        kritiShh: 'kriti_pose_07.webp',
        // Ask a parent: Kriti with her crayon beside the child's ask (AskParentUi.buildAsk, KRITI_CRAYON).
        kritiCrayon: 'kriti_crayon.webp',
        // The child's "Not this time" answer with no note (AskParentUi.answerCard, KRITI_FRONT).
        kritiFront: 'kriti_front.webp',
        uljhanFront: 'uljhan_front.webp',
        // Hop.
        uljhanHappy: 'uljhan_pose_04.webp',
        // Peeking from behind a card (an empty list), knotted (an error), tiptoeing (a slow connection),
        // asleep (resting, nothing to do).
        uljhanPeek: 'uljhan_pose_01.webp',
        uljhanKnotted: 'uljhan_pose_03.webp',
        uljhanTiptoe: 'uljhan_pose_05.webp',
        uljhanAsleep: 'uljhan_pose_06.webp',
        sieve: Object.freeze([1, 2, 3, 4, 5].map(index => `kriti_sieve_0${index}.webp`)),
        // Picture-book sheets (aKriti frames): swapped stills, never warped.
        kritiMug: Object.freeze([1, 2, 3, 4, 5, 6].map(index => `kriti_mug_0${index}.webp`)),
        kritiEvening: Object.freeze([1, 2, 3, 4, 5, 6].map(index => `kriti_evening_0${index}.webp`)),
        uljhanFetch: Object.freeze([1, 2, 3, 4, 5, 6].map(index => `uljhan_fetch_0${index}.webp`)),
        // The owner's v3 red-funnel sieve, eleven frames (the old six drew two funnels on frame 5).
        duoSieve: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(index => `duo_sieve_${String(index).padStart(2, '0')}.webp`)),
        duoShoo: Object.freeze([1, 2, 3, 4, 5, 6].map(index => `duo_shoo_0${index}.webp`)),
        kritiJump: Object.freeze([1, 2, 3, 4, 5].map(index => `kriti_jump_0${index}.webp`)),
        // In a round (KRITI_OPEN_NOTEBOOK then KRITI_PENCIL_TAP): frames 1-3 open the notebook, 3-6 tap the pencil.
        kritiPencil: Object.freeze([1, 2, 3, 4, 5, 6].map(index => `kriti_pencil_0${index}.webp`)),
        // The rest screen's stretch (KRITI_STRETCH).
        kritiStretch: Object.freeze([1, 2, 3, 4, 5].map(index => `kriti_stretch_0${index}.webp`)),
        uljhanLeaves: Object.freeze([1, 2, 3, 4, 5].map(index => `uljhan_wave_0${index}.webp`)),
        // The 2026-11-18 moments (aKriti duo_offline_untangle, duo_backup_saved, duo_search_empty). Offline:
        // Uljhan tangles himself in his string. Back online: Kriti kneels, unwinds him, he hops free (sheet
        // frames 3, 5 and 6). Backup saved: Kriti stamps a check, Uljhan claps (sheet frames 1, 3, 4 and 6).
        // No results: Kriti searches with her magnifier, Uljhan peeks in and shrugs.
        uljhanTangle: Object.freeze([1, 2, 3].map(index => `uljhan_tangle_0${index}.webp`)),
        duoUntangle: Object.freeze([1, 2, 3].map(index => `duo_untangle_0${index}.webp`)),
        duoBackup: Object.freeze([1, 2, 3, 4].map(index => `duo_backup_0${index}.webp`)),
        duoSearchEmpty: Object.freeze([1, 2, 3, 4].map(index => `duo_search_empty_0${index}.webp`)),
        // The second 2026-11-18 batch: a time-saved medal (sheet frames 1, 3, 5, 6), Uljhan's idle bounce and
        // Kriti's idle breath (alternate frames), the sweep after a list is cleared and the high five after a
        // sync (alternate frames).
        duoMedal: Object.freeze([1, 2, 3, 4].map(index => `duo_medal_0${index}.webp`)),
        uljhanBounce: Object.freeze([1, 2, 3, 4, 5, 6].map(index => `uljhan_bounce_0${index}.webp`)),
        kritiBreath: Object.freeze([1, 2, 3, 4].map(index => `kriti_breath_0${index}.webp`)),
        duoSweep: Object.freeze([1, 2, 3, 4, 5, 6].map(index => `duo_sweep_0${index}.webp`)),
        duoHighFive: Object.freeze([1, 2, 3, 4, 5, 6].map(index => `duo_high_five_0${index}.webp`))
    });
    /** The pose registry (Android StudyMascotView.Pose, 2026-11-18): each named pose and the art it uses. */
    const POSES = Object.freeze({
        kriti: Object.freeze({ wave: 'kritiWave', cheer: 'kritiHappy', think: 'kritiThinking', read: 'kritiReading',
            sleepy: 'kritiSleepy', proud: 'kritiMedal', shh: 'kritiShh', point: 'kritiPointing' }),
        uljhan: Object.freeze({ peek: 'uljhanPeek', shrug: 'uljhanShrug', knotted: 'uljhanKnotted', hop: 'uljhanHappy',
            tiptoe: 'uljhanTiptoe', asleep: 'uljhanAsleep' })
    });
    /**
     * The app's frame animations (StudyMascotView.Motion): which frames play, in what order (0-based,
     * a frame may repeat), and how long each stays. Each plays once and rests on its last frame; with
     * reduced motion only that frame shows. leaves: slide out and fade after the last frame.
     */
    const MOTIONS = Object.freeze({
        // The v3 sieve played once: frames 1 to 7, resting with Uljhan in the funnel.
        duoSieve: Object.freeze({ order: Object.freeze([0, 1, 2, 3, 4, 5, 6]), ms: 420, holds: Object.freeze([420, 420, 300, 300, 360, 700, 700]) }),
        duoShoo: Object.freeze({ order: Object.freeze([0, 1, 2, 3, 4, 5]), ms: 420 }),
        kritiMug: Object.freeze({ order: Object.freeze([0, 1, 2, 2, 3, 4, 5]), ms: 380 }),
        kritiEvening: Object.freeze({ order: Object.freeze([0, 1, 2, 3, 4, 5]), ms: 420 }),
        uljhanFetch: Object.freeze({ order: Object.freeze([0, 1, 2, 3, 4, 5]), ms: 160 }),
        kritiJump: Object.freeze({ order: Object.freeze([0, 1, 2, 3, 4, 1, 0]), ms: 95 }),
        // KRITI_PENCIL_TAP: one cycle; Study plays it three times, then rests on frame 3 (reading).
        kritiPencil: Object.freeze({ order: Object.freeze([2, 3, 3, 4, 5, 5, 2]), ms: 300 }),
        kritiStretch: Object.freeze({ order: Object.freeze([0, 1, 2, 3, 3, 4, 0]), ms: 280 }),
        uljhanLeaves: Object.freeze({ order: Object.freeze([0, 1, 2, 1, 2, 3, 4]), ms: 170, leaves: true }),
        // The same frames played another way (frames: whose pictures). KRITI_OPEN_NOTEBOOK opens her
        // notebook and rests reading; Uljhan's wave in a fetch-more footer stays put (no leaving).
        kritiOpenNotebook: Object.freeze({ frames: 'kritiPencil', order: Object.freeze([0, 1, 2]), ms: 260 }),
        uljhanWave: Object.freeze({ frames: 'uljhanLeaves', order: Object.freeze([0, 1, 2, 1, 2, 3, 4]), ms: 170 }),
        // StudyMascotView.Motion ULJHAN_TANGLE, DUO_UNTANGLE (leaves after), DUO_BACKUP_SAVED and DUO_SEARCH_EMPTY,
        // with the same total length over the frames the extension ships.
        uljhanTangle: Object.freeze({ order: Object.freeze([0, 1, 2]), ms: 420 }),
        duoUntangle: Object.freeze({ order: Object.freeze([0, 1, 2]), ms: 400, leaves: true }),
        duoBackup: Object.freeze({ order: Object.freeze([0, 1, 2, 3]), ms: 390 }),
        duoSearchEmpty: Object.freeze({ order: Object.freeze([0, 1, 2, 3]), ms: 420 }),
        // The v3 loop (Android About card): frames 1 to 11 with their own holds, 11 back to 1; at rest, frame 1.
        duoSieveLoop: Object.freeze({ frames: 'duoSieve', order: Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), ms: 420, loop: true, still: 0,
            holds: Object.freeze([3200, 420, 300, 300, 360, 700, 700, 420, 300, 360, 600]) }),
        duoMedal: Object.freeze({ order: Object.freeze([0, 1, 2, 3]), ms: 450 }),
        uljhanBounce: Object.freeze({ order: Object.freeze([0, 1, 2, 3, 4, 5]), ms: 140 }),
        kritiBreath: Object.freeze({ order: Object.freeze([0, 1, 2, 3, 2, 1, 0]), ms: 260 }),
        duoSweep: Object.freeze({ order: Object.freeze([0, 1, 2, 3, 4, 5]), ms: 300 }),
        duoHighFive: Object.freeze({ order: Object.freeze([0, 1, 2, 3, 4, 5]), ms: 300 })
    });
    /** The pictures a sheet plays (its own, or the frames it borrows). Pure. */
    function sheetAssets(sheet) {
        return ASSETS[MOTIONS[sheet]?.frames || sheet];
    }
    const SHEET_FRAME_MS = 180;
    // The still a sheet rests on (0-based): the last frame its motion plays.
    const SHEET_STILL = Object.freeze(Object.fromEntries(Object.entries(MOTIONS).filter(([, motion]) => !motion.frames)
        .map(([name, motion]) => [name, motion.order[motion.order.length - 1]])));
    // A borrowed sheet rests on the last frame it plays.
    const BORROWED_STILL = Object.freeze(Object.fromEntries(Object.entries(MOTIONS).filter(([, motion]) => motion.frames)
        .map(([name, motion]) => [name, Number.isInteger(motion.still) ? motion.still : motion.order[motion.order.length - 1]])));

    // NativeMotion: the springs and idle rhythm the app's mascots use (StudyMascotView, MascotIdle).
    const SPRINGS = Object.freeze({
        settle: Object.freeze({ stiffness: 1500, damping: 0.8 }),
        pop: Object.freeze({ stiffness: 1500, damping: 0.55 }),
        mascot: Object.freeze({ stiffness: 700, damping: 0.55 }),
        bob: Object.freeze({ stiffness: 800, damping: 0.45 }),
        stamp: Object.freeze({ stiffness: 700, damping: 0.5 }),
        wiggle: Object.freeze({ stiffness: 500, damping: 0.25 })
    });
    const IDLE = Object.freeze({
        firstMin: 6000,
        firstMax: 12000,
        gaps: Object.freeze([12000, 20000, 30000]),
        jitter: 0.15,
        budget: 120000,
        sparkleChance: 0.15,
        bobVelocity: -125,
        hopVelocity: -250,
        squashVelocity: -1,
        wiggleVelocity: 95,
        tapVelocity: -420
    });
    // MascotIdle.beatsFor: the beats that fit the art she rests on.
    const IDLE_BEATS = Object.freeze({
        uljhan: Object.freeze(['wiggle', 'bob', 'hop', 'sparkle']),
        uljhanTangled: Object.freeze(['wiggle', 'bob']),
        // Standing Uljhan bounces (uljhan_bounce); asleep he only breathes; peeking he only wiggles.
        uljhanStanding: Object.freeze(['bounce', 'wiggle', 'bob', 'sparkle']),
        uljhanAsleep: Object.freeze(['squash']),
        uljhanPeek: Object.freeze(['wiggle']),
        // Standing Kriti breathes (kriti_breath) between the small beats.
        kritiStanding: Object.freeze(['breath', 'bob', 'sparkle']),
        sieve: Object.freeze(['bob', 'squash', 'sieve', 'sparkle']),
        seated: Object.freeze(['bob', 'squash', 'sparkle']),
        perched: Object.freeze(['squash', 'sparkle']),
        duo: Object.freeze(['bob', 'squash', 'sparkle']),
        kriti: Object.freeze(['bob', 'hop', 'squash', 'sparkle'])
    });
    // LoadingPersonality (GENERAL scene): which moment a wait shows, weighted; the duo sieve most.
    const LOADING_WEIGHTS = Object.freeze([
        ['duoSieve', 6], ['sieve', 2], ['duoShoo', 2], ['kritiJump', 2], ['kritiPeek', 2],
        ['kritiLogo', 1], ['kritiLogoHat', 1], ['kritiAllow', 1], ['kritiLogoBadge', 1], ['kritiLogoTelescope', 1]
    ]);
    /**
     * LoadingPersonality's other scenes: Kids (the duo, a jump, Uljhan's wave, Kriti's wave), Study
     * (the duo sieve, then her reading and notebook moments), a search (Kriti with her magnifier
     * among the general moments) and a fetch-more (UljhanLoadMore: Uljhan alone, the fetch most).
     */
    const LOADING_SCENES = Object.freeze({
        general: LOADING_WEIGHTS,
        kids: Object.freeze([['duoSieve', 4], ['duoShoo', 2], ['kritiJump', 2], ['uljhanWave', 2], ['kritiWave', 2]]),
        study: Object.freeze([['duoSieve', 3], ['sieve', 1], ['kritiReading', 1], ['kritiNotebook', 1], ['kritiPencil', 1], ['kritiOpenNotebook', 1]]),
        search: Object.freeze([['kritiMagnifier', 4], ['duoSieve', 3], ['sieve', 1], ['kritiPeek', 1]]),
        fetch: Object.freeze([['uljhanFetch', 4], ['uljhanWave', 1], ['uljhanHop', 1], ['uljhanWiggle', 1]])
    });
    // Fetch-more's still actions: Uljhan hops or wiggles where he stands (UljhanLoadMore BOUNCE, WIGGLE).
    const FETCH_STILLS = Object.freeze({ uljhanHop: 'uljhanHappy', uljhanWiggle: 'uljhanFront' });
    // Any interaction on the page (pointer, wheel or scroll, a key) wakes resting idle life and gives
    // it a fresh two-minute budget; one throttled, passive listener on the document. No sound.
    const IDLE_WAKE_EVENTS = Object.freeze(['pointerdown', 'keydown', 'wheel', 'scroll', 'touchstart']);
    const IDLE_WAKE_THROTTLE_MS = 1000;
    const LOADING_REVEAL_MS = 600;
    const LOOP_CAP_MS = 30000;
    const REPLAY_REST_MS = 1200;
    const POPUP_MOTION_MS = 400;
    const SEARCH_EMPTY_REPLAY_MS = 10000;
    // The sign's writable area in kriti_locked_sign.webp, as fractions of the picture (between her hands),
    // and the type: the time 1.45 times the words, lines 1.12 apart (Android LockedSignView).
    const LOCKED_SIGN = Object.freeze({ left: 0.5, top: 0.646, right: 0.846, bottom: 0.882, aspect: 247 / 280, timeScale: 1.45, lineHeight: 1.12 });
    const LOCKED_COPY = Object.freeze(['study.lockedUntil', 'Locked until {time}']);
    const BACKUP_MOMENT_KEY = 'backup_saved';
    const SWEEP_WINDOW_MS = 2500;
    const TIME_MILESTONES_HOURS = Object.freeze([1, 10, 100]);
    const TIME_MILESTONES_KEY = 'ftMascotTimeMilestonesSeen';
    const TIME_SAVED_COPY = Object.freeze({ one: 'You\u2019ve saved {count} hour so far.', other: 'You\u2019ve saved {count} hours so far.' });

    const COPY = Object.freeze({
        welcome: ['mascot.welcome.line', "I'll keep what you block out of sight."],
        welcomeDismiss: ['mascot.welcome.dismiss', 'Got it'],
        hiddenCount: ['mascot.popup.hiddenCount', '{count} hidden so far'],
        milestone: ['mascot.popup.milestone', '{count} things kept out of your way.'],
        allowOnly: ['mascot.popup.allowOnly', 'Only allowed channels get through.'],
        emptyKeywords: ['mascot.options.emptyKeywords', 'Add a word to start filtering.'],
        emptyChannels: ['mascot.options.emptyChannels', 'Block a channel to hide it everywhere.'],
        imported: ['mascot.options.imported', 'Settings imported.'],
        noMatches: ['mascot.moment.noMatches', 'Nothing here. Try fewer words.'],
        loading: ['mascot.moment.loading', 'Sorting the good stuff…'],
        error: ['mascot.moment.error', 'That didn\'t load. Try again.']
    });

    // Lines that name the characters or run longer than a bubble live outside COPY (the app's own words).
    const LOADING_LINES = Object.freeze([
        ['mascot.loading.1', 'Uljhan is hiding somewhere…'],
        ['mascot.loading.2', 'Kriti is sieving, hang tight…'],
        ['mascot.loading.3', 'Sorting the keepers from the rest…'],
        ['mascot.loading.4', 'Checking the funnel twice…'],
        ['mascot.loading.5', 'Noodling on it…'],
        ['mascot.loading.6', 'Polishing the shortlist…']
    ]);
    const RECENT_LOADING_LINES = 3;
    const NETWORK_COPY = Object.freeze({
        offline: ['mascot.net.offline', 'You’re offline'],
        offlineBody: ['mascot.net.offlineBody', 'Your filters still work. Sync will wait.'],
        slow: ['mascot.net.slow', 'Slow connection, still sifting…'],
        restored: ['mascot.net.restored', 'Back online']
    });
    // Offline: Uljhan tangled in his string; back online: Kriti has unwound him (each a sheet's still).
    const NETWORK_ART = Object.freeze({ offline: 'uljhanTangle', slow: 'uljhanTiptoe', restored: 'duoUntangle' });
    const RESTORED_MS = 3500;
    const DUO_COPY = Object.freeze({
        hello: ['mascot.hello', 'Hi, I\'m Kriti. I keep the good stuff flowing.'],
        aboutTitle: ['mascot.about.title', 'Kriti and Uljhan'],
        aboutUljhan: ['mascot.about.uljhan', 'Uljhan is the tangle of distraction she sieves out.']
    });
    const SESSION_SAVED = Object.freeze(['parentMode.savedFor', 'Saved for {name}']);
    // Support variants (the app's SupportSheetVariants, the ones that are true for the extension).
    // Each note says, in its own voice, that FilterTube is free and that support is optional.
    const SUPPORT_HISTORY_KEY = 'ftSupportVariantHistory';
    const SUPPORT_REMEMBERED = 2;
    const SUPPORT_VARIANTS = Object.freeze([
        // touch: the variant's one crayon touch (Android SupportSheetVariants.Touch).
        Object.freeze({ id: 'classic', image: 'kritiLogo', characters: false, time: 'any', touch: 'heartOnPick' }),
        Object.freeze({ id: 'sieve', image: 'sieve', characters: true, time: 'any', touch: 'underlineTitle' }),
        Object.freeze({ id: 'onePerson', image: 'kritiNotebook', characters: false, time: 'any', touch: 'underlineTitle' }),
        Object.freeze({ id: 'morning', image: 'kritiWave', characters: true, time: 'morning', touch: 'sparkleLogo' }),
        Object.freeze({ id: 'evening', image: 'kritiEvening', characters: true, time: 'evening', touch: 'none' })
    ]);
    const SUPPORT_PRICE = Object.freeze(['support.price.line', 'Even $1 a month on Ko-fi is a big help. A yearly option works too, about $10\u201312 a year.']);
    // The motion each variant plays on the support sheet (Android SupportSheetVariants.motion).
    const SUPPORT_MOTIONS = Object.freeze({
        sieve: Object.freeze({ sheet: 'sieve', times: 3 }),
        onePerson: Object.freeze({ sheet: 'kritiPencil', times: 3, restOn: 'kritiNotebook' }),
        evening: Object.freeze({ sheet: 'kritiEvening', times: 1 })
    });
    const SUPPORT_COPY = Object.freeze({
        classic: Object.freeze({
            title: ['support.variant.classic.title', 'Help keep FilterTube free'],
            body: ['support.variant.classic.body', 'One developer, no company and no ads. Support pays for fixes, test devices and store fees. Nothing is locked, now or later.'],
            note: ['support.variant.classic.note', 'Free for everyone, always. Supporting is optional.']
        }),
        sieve: Object.freeze({
            title: ['support.variant.sieve.title', 'Kriti\'s been sieving all day'],
            body: ['support.variant.sieve.body', 'Every video you didn\'t want to see got caught in her tiny crayon sieve. Your support keeps it sharp.'],
            note: ['support.variant.sieve.note', 'The sieve stays free for everyone. Chipping in is up to you.']
        }),
        onePerson: Object.freeze({
            title: ['support.variant.onePerson.title', 'Made by one person, on purpose'],
            body: ['support.variant.onePerson.body', 'One developer, no company, no ads and no servers keeping your data. Support pays for the next fix.'],
            note: ['support.variant.onePerson.note', 'Every feature stays free. Supporting is optional.']
        }),
        morning: Object.freeze({
            title: ['support.variant.morning.title', 'Good morning from Kriti'],
            body: ['support.variant.morning.body', 'Your feed is already sieved and ready. One developer keeps it that way, with no ads and no servers keeping your data.'],
            note: ['support.variant.morning.note', 'Free every morning, and every night. Support is optional.']
        }),
        evening: Object.freeze({
            title: ['support.variant.evening.title', 'Kriti\'s heading to bed'],
            body: ['support.variant.evening.body', 'Your feed stays filtered all night while she sleeps. Thanks for spending your day with FilterTube.'],
            note: ['support.variant.evening.note', 'Free by day and by night. Support only if you\'d like to.']
        })
    });

    // Sounds (aKriti sounds, assets/sounds): Off by default. Gentle plays the big moments only.
    const SOUNDS_KEY = 'ftUiSounds';
    const SOUND_MODES = Object.freeze(['off', 'gentle', 'playful']);
    // The app's thirteen cues (UiSound.Cue, docs/app/design-system/SOUNDS.md), the same files.
    const SOUND_FILES = Object.freeze({
        stamp: 'stamp_thunk.ogg', celebrate: 'celebrate.ogg', bell: 'break_bell.ogg',
        success: 'success.ogg', select: 'select.ogg', error: 'gentle_error.ogg',
        scribble: 'crayon_scribble.ogg', page: 'paper_flip.ogg', pencil: 'pencil_tap.ogg',
        pop: 'soft_pop.ogg', boing: 'uljhan_boing.ogg', giggle: 'kriti_giggle_chime.ogg', undo: 'undo_swish.ogg'
    });
    // Gentle plays the app's BIG cues only: the seal, a celebration, the break bell.
    const GENTLE_SOUNDS = Object.freeze(['stamp', 'celebrate', 'bell']);
    // NativeMotion: one sound per 400 ms, the same cue not within 1.5 s, at most six a minute.
    const SOUND_GAP_MS = 400;
    const SOUND_SAME_CUE_COOLDOWN_MS = 1500;
    const SOUND_RATE_WINDOW_MS = 60000;
    const SOUND_RATE_CAP = 6;
    // Moment poses: one character and one line each (BIBLE.md moments map).
    const MOMENTS = Object.freeze({
        loading: Object.freeze({ image: 'uljhanFetch', copy: 'loading', character: 'Uljhan' }),
        empty: Object.freeze({ image: 'uljhanPeek', copy: null, character: 'Uljhan' }),
        // character 'Duo': Kriti and Uljhan together on one picture.
        noMatches: Object.freeze({ image: 'duoSearchEmpty', copy: 'noMatches', character: 'Duo' }),
        error: Object.freeze({ image: 'uljhanKnotted', copy: 'error', character: 'Uljhan' }),
        done: Object.freeze({ image: 'kritiThumbsUp', copy: null, character: 'Kriti' }),
        hello: Object.freeze({ image: 'kritiWave', copy: null, character: 'Kriti' }),
        reading: Object.freeze({ image: 'kritiReading', copy: null, character: 'Kriti' }),
        break: Object.freeze({ image: 'kritiMug', copy: null, character: 'Kriti' }),
        offline: Object.freeze({ image: 'uljhanTangle', copy: null, character: 'Uljhan' }),
        slow: Object.freeze({ image: 'uljhanTiptoe', copy: null, character: 'Uljhan' }),
        // Nothing to do (nothing got past today): Uljhan asleep.
        resting: Object.freeze({ image: 'uljhanAsleep', copy: null, character: 'Uljhan' }),
        restored: Object.freeze({ image: 'duoUntangle', copy: null, character: 'Duo' }),
        // Waiting for the other device (the app's KRITI_THINKING), and a win (KRITI_JUMP, Lively plays it).
        thinking: Object.freeze({ image: 'kritiThinking', copy: null, character: 'Kriti' }),
        celebrate: Object.freeze({ image: 'kritiJump', copy: null, character: 'Kriti' })
    });

    // ---- Pure rules (unit-tested) ----------------------------------------------------------------

    function normalizeMode(value) {
        const mode = typeof value === 'string' ? value.trim().toLowerCase() : '';
        return MODES.includes(mode) ? mode : DEFAULT_MODE;
    }

    /** How a character line appears. kind: 'static' (welcome, empty lists) or 'event' (milestone, allow list, import). */
    function linePresentation(mode, kind) {
        const normalized = normalizeMode(mode);
        if (normalized === 'off') return 'none';
        if (normalized === 'lively') return 'bubble';
        return kind === 'static' ? 'caption' : 'on-demand';
    }

    function showsCharacters(mode) {
        return normalizeMode(mode) !== 'off';
    }

    function normalizeSeen(value) {
        const list = Array.isArray(value) ? value : [];
        return MILESTONES.filter(milestone => list.some(entry => Number(entry) === milestone));
    }

    /**
     * Which milestone to celebrate, once each. Every reached milestone is marked seen; when several were
     * crossed since the last look, only the highest plays. Off still marks them so they never arrive late.
     */
    function evaluateMilestone(total, seenValue, mode = DEFAULT_MODE) {
        const count = Math.max(0, Math.floor(Number(total) || 0));
        const seen = normalizeSeen(seenValue);
        const reached = MILESTONES.filter(milestone => count >= milestone);
        const fresh = reached.filter(milestone => !seen.includes(milestone));
        const nextSeen = MILESTONES.filter(milestone => seen.includes(milestone) || reached.includes(milestone));
        const celebrate = fresh.length && showsCharacters(mode) ? fresh[fresh.length - 1] : null;
        return { celebrate, seen: nextSeen, changed: nextSeen.length !== seen.length };
    }

    /** Lifetime hidden count: the sum of every surface's running total, with the legacy main entry as fallback. */
    function totalHidden(storage) {
        const data = storage && typeof storage === 'object' ? storage : {};
        const bySurface = data.statsBySurface && typeof data.statsBySurface === 'object' && !Array.isArray(data.statsBySurface)
            ? data.statsBySurface : {};
        let total = 0;
        let sawMain = false;
        for (const [surface, entry] of Object.entries(bySurface)) {
            if (!entry || typeof entry !== 'object') continue;
            if (surface === 'main') sawMain = true;
            total += Math.max(0, Number(entry.totalHiddenCount) || 0);
        }
        if (!sawMain && data.stats && typeof data.stats === 'object') {
            total += Math.max(0, Number(data.stats.totalHiddenCount) || 0);
        }
        return Math.floor(total);
    }

    /** Frame numbers (1-based) for the sieve loop; reduced motion jumps to the last frame. */
    function sieveFrames(reducedMotion) {
        if (reducedMotion) return [SIEVE_FRAME_COUNT];
        const frames = [];
        for (let loop = 0; loop < SIEVE_LOOPS; loop++) {
            for (let frame = 1; frame <= SIEVE_FRAME_COUNT; frame++) frames.push(frame);
        }
        return frames;
    }

    /** Whether the allow-list bubble should pop: only when the mode turned on since the popup last looked. */
    function allowListSwitchedOn(previous, current) {
        return current === 'whitelist' && previous !== 'whitelist' && previous !== undefined && previous !== null;
    }

    /** Frames to show for a sheet (0-based): the whole sheet once, or only its resting still with reduced motion. */
    function sheetFrames(sheet, reducedMotion) {
        const frames = sheetAssets(sheet);
        if (!Array.isArray(frames) && !(frames && typeof frames.length === 'number')) return [];
        const still = Number.isInteger(BORROWED_STILL[sheet]) ? BORROWED_STILL[sheet]
            : Number.isInteger(SHEET_STILL[sheet]) ? SHEET_STILL[sheet] : frames.length - 1;
        if (reducedMotion) return [still];
        const motion = MOTIONS[sheet];
        return motion ? [...motion.order] : Array.from({ length: frames.length }, (_, index) => index);
    }

    /** How long each frame of a sheet stays (the app's Motion.frameMillis). */
    function sheetFrameMs(sheet) {
        return MOTIONS[sheet]?.ms || SHEET_FRAME_MS;
    }

    /** How long the [index]th frame a sheet plays stays (its own hold, else the sheet's frame time). Pure. */
    function sheetHoldMs(sheet, index) {
        const hold = MOTIONS[sheet]?.holds?.[index];
        return Number.isFinite(hold) ? hold : sheetFrameMs(sheet);
    }

    /**
     * A damped spring sampled at 60 fps (Android SpringAnimation from rest with a start velocity, in
     * units per second): the offsets from rest, ending at 0. Pure.
     */
    function springSamples(spec, velocity, { from = 0, step = 1000 / 60, settle = 0.05, maxMs = 1500 } = {}) {
        const omega = Math.sqrt(spec.stiffness);
        const zeta = spec.damping;
        const samples = [from];
        const decay = zeta * omega;
        const damped = omega * Math.sqrt(Math.max(1e-6, 1 - zeta * zeta));
        let quiet = 0;
        for (let time = step; time <= maxMs; time += step) {
            const seconds = time / 1000;
            const value = zeta < 1
                ? Math.exp(-decay * seconds) * (from * Math.cos(damped * seconds) + ((velocity + decay * from) / damped) * Math.sin(damped * seconds))
                : (from + (velocity + omega * from) * seconds) * Math.exp(-omega * seconds);
            samples.push(value);
            quiet = Math.abs(value) < settle ? quiet + 1 : 0;
            if (quiet >= 3 && time > 120) break;
        }
        samples.push(0);
        return samples;
    }

    /** Which idle beats fit an art file (MascotIdle.beatsFor). Pure. */
    function idleBeatsFor(name) {
        const file = String(name || '').replace(/^.*\//, '');
        if (/^uljhan_tangle_/.test(file) || file === 'uljhan_pose_03.webp') return IDLE_BEATS.uljhanTangled;
        if (file === 'uljhan_pose_06.webp') return IDLE_BEATS.uljhanAsleep;
        if (file === 'uljhan_pose_01.webp') return IDLE_BEATS.uljhanPeek;
        if (file === 'uljhan_front.webp' || file === 'uljhan_pose_04.webp' || file === 'uljhan_pose_02.webp') return IDLE_BEATS.uljhanStanding;
        if (file === 'kriti_pose_01.webp' || file === 'kriti_front.webp') return IDLE_BEATS.kritiStanding;
        if (/^uljhan_/.test(file)) return IDLE_BEATS.uljhan;
        if (/^kriti_sieve_/.test(file)) return IDLE_BEATS.sieve;
        if (file === 'kriti_pose_04.webp' || file === 'kriti_notebook.webp') return IDLE_BEATS.seated;
        if (file === 'kriti_peek.webp') return IDLE_BEATS.perched;
        if (/^duo_/.test(file)) return IDLE_BEATS.duo;
        return IDLE_BEATS.kriti;
    }

    /** The wait before idle beat number [index] (0 = the first), jittered. Pure. */
    function idleDelay(index, random = Math.random) {
        if (index <= 0) return Math.round(IDLE.firstMin + (IDLE.firstMax - IDLE.firstMin) * random());
        const base = IDLE.gaps[Math.min(index - 1, IDLE.gaps.length - 1)];
        return Math.round(base * (1 - IDLE.jitter + 2 * IDLE.jitter * random()));
    }

    /** One idle beat for the art: a sparkle at most once per rhythm, otherwise any other beat. Pure. */
    function pickIdleBeat(beats, sparkled, random = Math.random) {
        const list = Array.isArray(beats) && beats.length ? beats : IDLE_BEATS.kriti;
        if (!sparkled && list.includes('sparkle') && random() < IDLE.sparkleChance) return 'sparkle';
        const others = list.filter(beat => beat !== 'sparkle');
        return others[Math.min(others.length - 1, Math.floor(random() * others.length))];
    }

    /** Whether an interaction at [now] may wake idle life, given the last wake (throttled). Pure. */
    function idleWakeDue(lastWakeAt, now) {
        return !Number.isFinite(lastWakeAt) || now - lastWakeAt >= IDLE_WAKE_THROTTLE_MS;
    }

    /**
     * What a wake does to one rhythm: the budget restarts from now; a rhythm that had gone still
     * (no beat waiting) starts again from its first rest. A waiting beat keeps its time. Pure.
     */
    function idleWake(state, now) {
        const next = { ...state, started: now };
        if (!state.pending) Object.assign(next, { index: 0, sparkled: false, restart: true });
        else next.restart = false;
        return next;
    }

    /**
     * The loading moment for a wait (LoadingPersonality), weighted, from a scene's set (general by
     * default). [avoid] is never picked twice in a row when the scene has another (fetch-more). Pure.
     */
    function pickLoadingMoment(random = Math.random, scene = 'general', avoid = '') {
        const all = LOADING_SCENES[scene] || LOADING_WEIGHTS;
        const weights = all.length > 1 && avoid ? all.filter(([name]) => name !== avoid) : all;
        const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
        let roll = random() * total;
        for (const [name, weight] of weights) {
            roll -= weight;
            if (roll < 0) return name;
        }
        return weights[0][0];
    }

    /**
     * Which LoadingPersonality scene a waiting holder is in, from where it sits: a fetch-more footer
     * (a list that loads page after page), Study, a Kids space, a search, else general. Pure on the
     * node's closest() answers.
     */
    function loadingScene(node) {
        const near = selector => { try { return !!node?.closest?.(selector); } catch (e) { return false; } };
        if (near('[data-ft-fetch-more], .subscriptions-import-inline')) return 'fetch';
        if (near('#studyView, .ft-study, [data-pk-area="study"]')) return 'study';
        if (near('#kidsView, [data-pk-area="kids"]')) return 'kids';
        if (near('[data-ft-search-wait], [role="search"]')) return 'search';
        return 'general';
    }

    /**
     * What the popup's "hidden so far" card shows beside the count (Android has no mascot there; the
     * extension keeps the app's moments map): the logo sieve while the allow list is on; with nothing
     * hidden yet, Kriti peeking low over the card; the first look of the day (Lively) "Shoo, Uljhan!"
     * once, else the duo sieve; in the evening her good-evening sheet; in the morning a wave. Quiet
     * shows the still, Off nothing. Pure.
     */
    function popupTallyPose({ total = 0, listMode = 'blocklist', hour = 12, firstToday = false, mode = DEFAULT_MODE } = {}) {
        if (!showsCharacters(mode)) return null;
        if (listMode === 'whitelist') return { pose: 'allow', art: 'kritiAllow', play: '' };
        if (!(Number(total) > 0)) return { pose: 'waiting', art: 'kritiPeekLow', play: '' };
        const lively = mode === 'lively';
        if (hour >= 19 || hour < 4) return { pose: 'evening', art: 'kritiEvening', play: lively && firstToday ? 'kritiEvening' : '' };
        if (hour >= 5 && hour < 11 && firstToday) return { pose: 'morning', art: 'kritiWave', play: '' };
        if (firstToday) return { pose: 'shoo', art: 'duoShoo', play: lively ? 'duoShoo' : '' };
        return { pose: 'sieve', art: 'duoSieve', play: '' };
    }

    /**
     * The empty-state pose for a list (MascotMoments.emptyState): a first keyword list points the way,
     * a first channel list reads, a Kids list peeks, and a search that found nothing gets Uljhan. Pure.
     */
    function emptyListPose(list, { kids = false } = {}) {
        if (list === 'search') return 'duoSearchEmpty';
        if (kids) return 'kritiPeek';
        return list === 'channels' ? 'kritiReading' : 'kritiPointing';
    }

    /**
     * The popup closes when it loses focus, so a sheet there plays its first, middle and last frames
     * (frames 1, 4 and 6 of a six-frame sheet) in 400 ms at most (BIBLE, extension popup). Pure.
     */
    function popupSheet(sheet) {
        const order = MOTIONS[sheet]?.order;
        if (!order?.length) return { order: [], ms: 0 };
        const last = order.length - 1;
        const picks = [order[0], order[Math.round(last * 0.6)], order[last]].filter((value, index, all) => index === 0 || value !== all[index - 1]);
        return { order: picks, ms: Math.floor(POPUP_MOTION_MS / picks.length) };
    }

    /**
     * The lines written on Kriti's sign (Android LockedSignView.lines): the translated "Locked until {time}"
     * split around the time, so each locale keeps its own order. The words before and after are small
     * lines, the time is the big one; blank parts drop out. Pure.
     */
    function signLines(template, time) {
        const text = String(template || '');
        const clean = value => value.replace(/\s+/g, ' ').trim();
        const at = text.indexOf('{time}');
        if (at < 0) {
            const lines = [clean(text), String(time)].filter(Boolean);
            return { lines, timeIndex: lines.length - 1 };
        }
        const before = clean(clean(text.slice(0, at)).replace(/[,،:]+$/, ''));
        const after = clean(clean(text.slice(at + '{time}'.length)).replace(/^[,،:]+/, '').replace(/[,،]+$/, ''));
        const lines = before ? [before] : [];
        const timeIndex = lines.length;
        lines.push(String(time));
        if (after) lines.push(after);
        return { lines, timeIndex };
    }

    /**
     * The largest label size (px) at which every line fits width x height (the time drawn timeScale times
     * bigger); everything shrinks together. measure(text, px, bold) gives a line's width. 0 if nothing fits.
     */
    function fitSignSize(sign, width, height, measure) {
        const lines = sign?.lines || [];
        if (!lines.length || !(width > 0) || !(height > 0)) return 0;
        const scale = index => (index === sign.timeIndex ? LOCKED_SIGN.timeScale : 1);
        let size = height / lines.reduce((sum, _, index) => sum + scale(index) * LOCKED_SIGN.lineHeight, 0);
        while (size > 1) {
            const widest = Math.max(...lines.map((line, index) => measure(line, size * scale(index), index === sign.timeIndex)));
            if (widest <= width) return size;
            size *= 0.94;
        }
        return 0;
    }

    /** The time on the sign: the clock time today, with the short weekday on a later day. */
    function signTime(until, now = Date.now(), lang = locale()) {
        const end = new Date(Number(until));
        const sameDay = end.toDateString() === new Date(now).toDateString();
        const options = sameDay ? { hour: 'numeric', minute: '2-digit' } : { weekday: 'short', hour: 'numeric', minute: '2-digit' };
        try {
            return new Intl.DateTimeFormat(lang, options).format(end);
        } catch (e) {
            return new Intl.DateTimeFormat('en', options).format(end);
        }
    }

    /** A list emptied within 2.5 s of a removal gets the sweep. Pure. */
    function sweepAfterRemoval(removedAt, now) {
        return Number(removedAt) > 0 && now - Number(removedAt) <= SWEEP_WINDOW_MS;
    }

    /** The running time saved (seconds) across surfaces: totalSavedSeconds, else today's savedSeconds. Pure. */
    function totalSavedSeconds(storage) {
        const data = storage && typeof storage === 'object' ? storage : {};
        const bySurface = data.statsBySurface && typeof data.statsBySurface === 'object' && !Array.isArray(data.statsBySurface) ? data.statsBySurface : {};
        let total = 0;
        let sawMain = false;
        const read = entry => Math.max(0, Number.isFinite(Number(entry.totalSavedSeconds)) ? Number(entry.totalSavedSeconds) : Number(entry.savedSeconds) || 0);
        for (const [surface, entry] of Object.entries(bySurface)) {
            if (!entry || typeof entry !== 'object') continue;
            if (surface === 'main') sawMain = true;
            total += read(entry);
        }
        if (!sawMain && data.stats && typeof data.stats === 'object') total += read(data.stats);
        return Math.floor(total);
    }

    /**
     * Time-saved milestones (1, 10 and 100 hours): each once, Lively only (Quiet and Off mark it seen without
     * playing), the highest when several are crossed at once. Pure, like evaluateMilestone.
     */
    function evaluateTimeMilestone(seconds, seenValue, mode = DEFAULT_MODE) {
        const seen = (Array.isArray(seenValue) ? seenValue : []).map(Number).filter(value => TIME_MILESTONES_HOURS.includes(value))
            .filter((value, index, all) => all.indexOf(value) === index);
        const hours = Math.max(0, Number(seconds) || 0) / 3600;
        const reached = TIME_MILESTONES_HOURS.filter(value => hours >= value && !seen.includes(value));
        const next = [...seen, ...reached].sort((a, b) => a - b);
        const celebrate = reached.length && normalizeMode(mode) === 'lively' ? reached[reached.length - 1] : null;
        return { celebrate, seen: next, changed: reached.length > 0 };
    }

    /** "You've saved 10 hours so far." in the page's language, plural-aware (mascot.timeSaved.one / .other). */
    function timeMilestoneLine(hours) {
        const lang = locale();
        let category = 'other';
        try { category = new Intl.PluralRules(lang).select(hours); } catch (e) { }
        const count = formatCount(hours);
        const fallback = category === 'one' ? TIME_SAVED_COPY.one : TIME_SAVED_COPY.other;
        try {
            const text = root.FilterTubeUiLocalization?.text?.(`mascot.timeSaved.${category}`, { count });
            if (typeof text === 'string' && text.trim() && !text.startsWith('mascot.timeSaved')) return text;
        } catch (e) { }
        return fallback.replace('{count}', count);
    }

    /** Backup saved plays the duo at most once a local day (Android takeBackupSavedToday). Pure. */
    function backupSavedDue(storedDay, today) {
        return storedDay !== today;
    }

    /** A search list redraws on every keystroke: the no-results sheet replays at most every 10 s. Pure. */
    function searchEmptyPlays(lastPlayedAt, now) {
        return !(Number(lastPlayedAt) > 0) || now - Number(lastPlayedAt) >= SEARCH_EMPTY_REPLAY_MS;
    }

    /** The picture a pose rests on: a single image, or a sheet's still. */
    function stillImage(name) {
        if (FETCH_STILLS[name]) return stillImage(FETCH_STILLS[name]);
        if (MOTIONS[name]?.frames) {
            const frames = sheetAssets(name);
            return frames[BORROWED_STILL[name]] || '';
        }
        const entry = ASSETS[name];
        if (typeof entry === 'string') return entry;
        if (entry && typeof entry.length === 'number') return entry[Number.isInteger(SHEET_STILL[name]) ? SHEET_STILL[name] : entry.length - 1];
        return '';
    }

    /** A loading line (index) that is none of the last three shown. random is Math.random-like. */
    function pickLoadingLine(recent, random = Math.random) {
        const seen = (Array.isArray(recent) ? recent : []).slice(-RECENT_LOADING_LINES);
        const pool = LOADING_LINES.map((_, index) => index).filter(index => !seen.includes(index));
        const from = pool.length ? pool : LOADING_LINES.map((_, index) => index);
        return from[Math.min(from.length - 1, Math.floor(random() * from.length))];
    }

    /** offline, slow, restored (online again after offline) or ok. */
    function networkState(previous, { online = true, effectiveType = '', saveData = false } = {}) {
        if (online === false) return 'offline';
        if (previous === 'offline') return 'restored';
        if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
        return 'ok';
    }

    function supportTimeFits(time, hour) {
        if (time === 'morning') return hour >= 5 && hour < 12;
        if (time === 'evening') return hour >= 18 || hour < 4;
        return true;
    }

    /**
     * The support variant for this opening. The first one ever is classic; none of the last two comes
     * back; morning and evening ones keep to their hours; with the Companion off, only the variants
     * that name no character.
     */
    function pickSupportVariant(history, hour, mode = DEFAULT_MODE, random = Math.random) {
        const past = (Array.isArray(history) ? history : []).filter(id => SUPPORT_VARIANTS.some(variant => variant.id === id));
        if (!past.length) return SUPPORT_VARIANTS[0];
        const clock = Number.isFinite(Number(hour)) ? ((Math.floor(Number(hour)) % 24) + 24) % 24 : 12;
        const fitting = SUPPORT_VARIANTS.filter(variant => supportTimeFits(variant.time, clock)
            && (showsCharacters(mode) || !variant.characters));
        const recent = past.slice(-SUPPORT_REMEMBERED);
        let pool = fitting.filter(variant => !recent.includes(variant.id));
        if (!pool.length) pool = fitting.filter(variant => variant.id !== past[past.length - 1]);
        if (!pool.length) pool = fitting;
        return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
    }

    function rememberSupportVariant(history, id) {
        const past = (Array.isArray(history) ? history : []).filter(entry => typeof entry === 'string');
        return [...past, id].slice(-SUPPORT_REMEMBERED);
    }

    function clampLine(value) {
        const line = String(value || '').trim();
        return [...line].length > BUBBLE_MAX_CHARS ? [...line].slice(0, BUBBLE_MAX_CHARS - 1).join('') + '…' : line;
    }

    // ---- Environment helpers ---------------------------------------------------------------------

    function t(entry, values = {}) {
        const [key, fallback] = entry;
        try {
            const localized = root.FilterTubeUiLocalization?.text?.(key, values);
            if (typeof localized === 'string' && localized.trim()) return localized;
        } catch (e) {
        }
        return String(fallback).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, name) =>
            Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match);
    }

    function locale() {
        return root.FilterTubeUiLocalization?.locale || root.navigator?.language || 'en';
    }

    function formatCount(value) {
        const count = Math.max(0, Math.floor(Number(value) || 0));
        try {
            return new Intl.NumberFormat(locale()).format(count);
        } catch (e) {
            return String(count);
        }
    }

    function api() {
        if (typeof chrome !== 'undefined' && chrome?.storage?.local) return chrome;
        if (typeof browser !== 'undefined' && browser?.storage?.local) return browser;
        return null;
    }

    function storageGet(keys) {
        return new Promise(resolve => {
            const area = api()?.storage?.local;
            if (!area?.get) { resolve({}); return; }
            let settled = false;
            const finish = value => {
                if (settled) return;
                settled = true;
                resolve(value && typeof value === 'object' ? value : {});
            };
            try {
                const pending = area.get(keys, finish);
                if (pending && typeof pending.then === 'function') pending.then(finish, () => finish({}));
            } catch (e) {
                finish({});
            }
        });
    }

    function storageSet(items) {
        return new Promise(resolve => {
            const area = api()?.storage?.local;
            if (!area?.set) { resolve(false); return; }
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                resolve(true);
            };
            try {
                const pending = area.set(items, finish);
                if (pending && typeof pending.then === 'function') pending.then(finish, finish);
            } catch (e) {
                finish();
            }
        });
    }

    function assetUrl(name) {
        const path = `${ASSET_DIR}${name}`;
        try {
            const url = api()?.runtime?.getURL?.(path);
            if (url) return url;
        } catch (e) {
        }
        return `../${path}`;
    }

    function prefersReducedMotion() {
        try {
            return !!root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        } catch (e) {
            return false;
        }
    }

    function el(tag, className, content) {
        const node = root.document.createElement(tag);
        if (className) node.className = className;
        if (content !== undefined && content !== null) node.textContent = String(content);
        return node;
    }

    function image(name, className, height) {
        const node = el('img', className);
        node.src = assetUrl(name);
        node.alt = '';
        node.setAttribute('aria-hidden', 'true');
        node.decoding = 'async';
        node.draggable = false;
        if (/(^|\/)(uljhan|kriti|duo)_/.test(name)) node.dataset.character = name.replace(/^.*\//, '').split('_')[0];
        if (height) node.height = height;
        return node;
    }

    // ---- Shared state ----------------------------------------------------------------------------

    let companionMode = DEFAULT_MODE;
    let modeLoaded = false;
    const modeListeners = new Set();

    function onModeChange(listener) {
        modeListeners.add(listener);
        return () => modeListeners.delete(listener);
    }

    function applyMode(next) {
        const normalized = normalizeMode(next);
        const changed = normalized !== companionMode || !modeLoaded;
        companionMode = normalized;
        modeLoaded = true;
        if (root.document?.documentElement) root.document.documentElement.dataset.ftCompanion = normalized;
        if (changed) modeListeners.forEach(listener => { try { listener(normalized); } catch (e) { } });
    }

    let modeReady = null;

    /** Reads the stored Companion setting once per page; later changes arrive through storage.onChanged. */
    function loadMode() {
        if (!modeReady) {
            modeReady = storageGet([COMPANION_KEY]).then(stored => {
                applyMode(stored[COMPANION_KEY]);
                return companionMode;
            });
        }
        return modeReady;
    }

    async function setMode(value) {
        const normalized = normalizeMode(value);
        await storageSet({ [COMPANION_KEY]: normalized });
        applyMode(normalized);
        return normalized;
    }

    // ---- Speech line: a paper bubble, a caption, or a pose that speaks on demand ------------------

    /**
     * A character figure with its line. Returns { root, figure, picture, line, say(text, options), reveal(), hush() }.
     */
    function createCharacter({ className, imageName, height, kind, tail = 'left' }) {
        const wrap = el('div', `ft-mascot ${className || ''}`.trim());
        wrap.dataset.kind = kind;
        const presentation = linePresentation(companionMode, kind);
        // Event poses are buttons, so their line can be read again after it fades (and in Quiet, at all).
        const figure = kind === 'event' && presentation !== 'none' ? el('button', 'ft-mascot__figure') : el('span', 'ft-mascot__figure');
        if (figure.tagName === 'BUTTON') {
            figure.type = 'button';
            figure.setAttribute('aria-expanded', 'false');
        }
        const picture = image(imageName, 'ft-mascot__image', height);
        figure.appendChild(picture);
        const line = el('div', 'ft-mascot__line');
        line.dataset.tail = tail;
        line.hidden = true;
        wrap.append(figure, line);

        let hideTimer = 0;
        let pinned = false;
        let currentText = '';

        function reveal(text, { autoHideMs = 0 } = {}) {
            if (text) currentText = clampLine(text);
            if (!currentText) return;
            line.textContent = currentText;
            line.hidden = false;
            line.classList.remove('is-leaving');
            line.classList.add('is-visible');
            if (figure.tagName === 'BUTTON') figure.setAttribute('aria-expanded', 'true');
            root.clearTimeout(hideTimer);
            if (autoHideMs > 0) hideTimer = root.setTimeout(() => hush(), autoHideMs);
        }

        function hush() {
            root.clearTimeout(hideTimer);
            if (line.hidden) return;
            if (figure.tagName === 'BUTTON') figure.setAttribute('aria-expanded', 'false');
            line.classList.remove('is-visible');
            line.classList.add('is-leaving');
            const done = () => {
                if (line.classList.contains('is-leaving')) {
                    line.hidden = true;
                    line.classList.remove('is-leaving');
                }
            };
            if (prefersReducedMotion()) done();
            else root.setTimeout(done, 150);
        }

        /** Sets the line. Static lines show at once; event lines pop only in Lively. */
        function say(text, { event = false, autoHideMs = 0 } = {}) {
            currentText = clampLine(text);
            const mode = linePresentation(companionMode, kind);
            if (figure.tagName === 'BUTTON') figure.setAttribute('aria-label', currentText);
            line.classList.toggle('ft-mascot__line--bubble', mode === 'bubble');
            line.classList.toggle('ft-mascot__line--caption', mode === 'caption');
            line.classList.toggle('ft-mascot__line--popover', mode === 'on-demand');
            line.textContent = currentText;
            if ((mode === 'bubble' || mode === 'caption') && (event || kind === 'static')) {
                reveal(currentText, { autoHideMs: mode === 'bubble' ? autoHideMs : 0 });
            }
        }

        /** Swaps the words (a language change) without showing or hiding anything. */
        function retext(text) {
            currentText = clampLine(text);
            line.textContent = currentText;
            if (figure.tagName === 'BUTTON') figure.setAttribute('aria-label', currentText);
        }

        if (figure.tagName === 'BUTTON') {
            figure.addEventListener('click', () => {
                pinned = line.hidden || !pinned;
                if (pinned) reveal(); else hush();
            });
            figure.addEventListener('mouseenter', () => reveal());
            figure.addEventListener('mouseleave', () => { if (!pinned) hush(); });
            figure.addEventListener('focus', () => reveal());
            figure.addEventListener('blur', () => { pinned = false; hush(); });
            figure.addEventListener('keydown', event => {
                if (event.key === 'Escape') { pinned = false; hush(); }
            });
        }

        return { root: wrap, figure, picture, line, say, retext, reveal, hush };
    }

    function announce(host, text) {
        if (!host || !text || !showsCharacters(companionMode)) return;
        let region = host.querySelector?.('.ft-mascot-live');
        if (!region) {
            region = el('span', 'ft-mascot-live');
            region.setAttribute('role', 'status');
            region.setAttribute('aria-live', 'polite');
            host.appendChild(region);
        }
        region.textContent = '';
        root.setTimeout(() => { region.textContent = text; }, 50);
    }

    // ---- Popup -----------------------------------------------------------------------------------

    function preload(names) {
        return Promise.all(names.map(name => new Promise(resolve => {
            const probe = new root.Image();
            probe.onload = probe.onerror = () => resolve();
            probe.src = assetUrl(name);
        })));
    }

    function readListMode(doc) {
        const pill = doc.querySelector('#ftTopBarListModeControlsPopup .ft-list-mode-pill');
        if (!pill) return null;
        return pill.classList.contains('toggle-variant-red') ? 'blocklist' : 'whitelist';
    }

    function mountPopup(doc) {
        const header = doc.querySelector('.ft-popup-header');
        if (!header || doc.getElementById('ftMascotTallyPopup')) return null;

        const tally = el('div', 'ft-mascot-tally');
        tally.id = 'ftMascotTallyPopup';
        const counter = el('p', 'ft-mascot-tally__counter');
        const mark = image(ASSETS.counterMark, 'ft-mascot-tally__mark', 20);
        const count = el('span', 'ft-mascot-tally__count');
        counter.append(mark, count);
        const stage = el('div', 'ft-mascot-tally__stage');
        tally.append(counter, stage);
        header.insertAdjacentElement('afterend', tally);

        const state = {
            total: 0,
            seen: [],
            listMode: null,
            lastListMode: undefined,
            character: null,
            pose: null,
            frameTimer: 0
        };

        function stopFrames() {
            root.clearTimeout(state.frameTimer);
            state.frameTimer = 0;
        }

        function clearStage() {
            stopFrames();
            state.character = null;
            state.pose = null;
            stage.replaceChildren();
        }

        function renderCount() {
            count.textContent = t(COPY.hiddenCount, { count: formatCount(state.total) });
            mark.hidden = !showsCharacters(companionMode);
        }

        function showCharacter(pose, imageName, kind = 'event') {
            clearStage();
            if (!showsCharacters(companionMode)) return null;
            const character = createCharacter({ className: `ft-mascot--popup ft-mascot--popup-${pose}`, imageName, height: 48, kind, tail: 'up' });
            stage.appendChild(character.root);
            character.root.classList.add('is-entering');
            root.requestAnimationFrame?.(() => character.root.classList.remove('is-entering'));
            state.character = character;
            state.pose = pose;
            return character;
        }

        function playMilestone(milestone) {
            const character = showCharacter('milestone', ASSETS.sieve[0]);
            if (!character) return;
            const line = t(COPY.milestone, { count: formatCount(milestone) });
            const frames = sieveFrames(prefersReducedMotion());
            mark.classList.remove('is-popping');
            void mark.offsetWidth;
            if (!prefersReducedMotion()) mark.classList.add('is-popping');
            let index = 0;
            const step = () => {
                character.picture.src = assetUrl(ASSETS.sieve[frames[index] - 1]);
                index += 1;
                if (index < frames.length) {
                    state.frameTimer = root.setTimeout(step, SIEVE_FRAME_MS);
                    return;
                }
                state.frameTimer = 0;
                character.root.classList.add('is-resting');
                idleLife(character.picture);
            };
            preload(ASSETS.sieve).then(() => {
                if (state.character !== character) return;
                step();
                character.say(line, { event: true, autoHideMs: EVENT_BUBBLE_MS });
                announce(tally, line);
            });
        }

        function showAllowList({ switched }) {
            if (state.pose === 'allow') return;
            const character = showCharacter('allow', ASSETS.kritiAllow);
            if (!character) return;
            const line = t(COPY.allowOnly);
            character.say(line, { event: switched, autoHideMs: EVENT_BUBBLE_MS });
            if (switched) announce(tally, line);
        }

        /** The card's resting company (popupTallyPose): peeking, the duo, a wave or good evening. */
        function showRestingPose() {
            const spec = popupTallyPose({ total: state.total, listMode: state.listMode || 'blocklist', hour: new Date().getHours(),
                firstToday: state.firstToday, mode: companionMode });
            if (!spec) { clearStage(); return; }
            if (spec.pose === 'allow' || state.pose === spec.pose) return;
            const character = showCharacter(spec.pose, stillImage(spec.art), 'static');
            if (!character) return;
            character.root.classList.add('is-resting');
            if (spec.pose !== 'waiting' && state.firstToday) {
                state.firstToday = false;
                storageSet({ [TALLY_DAY_KEY]: localDay() });
            }
            if (spec.play && !prefersReducedMotion()) {
                preload([...sheetAssets(spec.play)]).then(() => {
                    if (state.character !== character) return;
                    root.setTimeout(() => playSheet(character.picture, spec.play, { onDone: () => idleLife(character.picture) }), 260);
                });
            } else idleLife(character.picture);
        }

        function syncListMode() {
            const mode = readListMode(doc);
            if (!mode) return;
            const previous = state.listMode === null ? state.lastListMode : state.listMode;
            state.listMode = mode;
            if (mode !== state.lastListMode) {
                state.lastListMode = mode;
                storageSet({ [LAST_LIST_MODE_KEY]: mode });
            }
            if (state.pose === 'milestone' && state.frameTimer) return;
            if (mode === 'whitelist') showAllowList({ switched: allowListSwitchedOn(previous, mode) });
            else showRestingPose();
        }

        function refreshPoses() {
            renderCount();
            const pose = state.pose;
            clearStage();
            if (pose === 'milestone' && showsCharacters(companionMode)) {
                const character = showCharacter('milestone', ASSETS.sieve[SIEVE_FRAME_COUNT - 1]);
                character?.root.classList.add('is-resting');
                character?.say(t(COPY.milestone, { count: formatCount(state.milestone || 0) }));
                return;
            }
            state.listMode = null;
            syncListMode();
        }

        async function start() {
            const stored = await storageGet(['stats', 'statsBySurface', MILESTONES_KEY, LAST_LIST_MODE_KEY, TALLY_DAY_KEY]);
            await loadMode();
            state.firstToday = stored[TALLY_DAY_KEY] !== localDay();
            state.total = totalHidden(stored);
            state.seen = normalizeSeen(stored[MILESTONES_KEY]);
            const lastMode = stored[LAST_LIST_MODE_KEY];
            state.lastListMode = lastMode === 'whitelist' || lastMode === 'blocklist' ? lastMode : undefined;
            renderCount();
            const verdict = evaluateMilestone(state.total, state.seen, companionMode);
            if (verdict.changed) {
                state.seen = verdict.seen;
                storageSet({ [MILESTONES_KEY]: verdict.seen });
            }
            if (verdict.celebrate) {
                state.milestone = verdict.celebrate;
                playMilestone(verdict.celebrate);
            }
            syncListMode();
        }

        const pillHost = doc.getElementById('ftTopBarListModeControlsPopup');
        if (pillHost && typeof root.MutationObserver === 'function') {
            new root.MutationObserver(() => syncListMode()).observe(pillHost, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        }

        onModeChange(() => refreshPoses());
        root.addEventListener?.('filtertube-ui-locale-changed', () => {
            renderCount();
            if (state.pose === 'milestone') state.character?.retext(t(COPY.milestone, { count: formatCount(state.milestone || 0) }));
            if (state.pose === 'allow') state.character?.retext(t(COPY.allowOnly));
        });
        api()?.storage?.onChanged?.addListener?.((changes, area) => {
            if (area && area !== 'local') return;
            if (changes.stats || changes.statsBySurface) {
                storageGet(['stats', 'statsBySurface']).then(stored => {
                    const before = state.total;
                    state.total = totalHidden(stored);
                    renderCount();
                    // The first thing hidden while the card is open: she stops peeking and the duo arrives.
                    if (!(before > 0) && state.total > 0 && state.pose === 'waiting') showRestingPose();
                    const verdict = evaluateMilestone(state.total, state.seen, companionMode);
                    if (!verdict.changed) return;
                    state.seen = verdict.seen;
                    storageSet({ [MILESTONES_KEY]: verdict.seen });
                    if (verdict.celebrate) {
                        state.milestone = verdict.celebrate;
                        playMilestone(verdict.celebrate);
                    }
                });
            }
        });

        start();
        return { tally, refresh: refreshPoses };
    }

    // ---- Options page ----------------------------------------------------------------------------

    const decoratedEmptyLists = new Set();
    // RenderEngine's empty-list copy keys. Blocked lists get Kriti peeking, a search with no matches gets Uljhan; an allow list stays plain. A search with
    // no matches or an empty allow list needs different words.
    const EMPTY_LIST_KEYS = Object.freeze({
        'render.emptyKeywordsBlocked': 'keywords',
        'render.emptyChannelsBlocked': 'channels',
        'render.emptyKeywordsFound': 'search',
        'render.emptyChannelsFound': 'search'
    });

    /** Which list an empty-state node belongs to, read from RenderEngine's copy record; null otherwise. */
    function emptyListKind(node) {
        const record = node?.__ftRendererCopy?.textContent
            || node?.querySelector?.('.ft-mascot-empty__label')?.__ftRendererCopy?.textContent;
        return record && Object.prototype.hasOwnProperty.call(EMPTY_LIST_KEYS, record.key) ? EMPTY_LIST_KEYS[record.key] : null;
    }

    /** Puts Kriti (empty list) or Uljhan (no matches) on a keyword or channel list on the options page. */
    function decorateEmptyList(node, list, details = {}) {
        if (!node || !root.document || details.minimal) return;
        if (!root.document.getElementById('viewContainer')) return;
        if ([...decoratedEmptyLists].some(entry => entry.node === node)) return;
        decoratedEmptyLists.add({ node, list, details });
        drawEmptyList(node, list, details);
    }

    function scanEmptyLists(scope) {
        const nodes = scope?.matches?.('.empty-state-large') ? [scope] : [...(scope?.querySelectorAll?.('.empty-state-large') || [])];
        for (const node of nodes) {
            const list = emptyListKind(node);
            if (list) decorateEmptyList(node, list);
        }
    }

    /** RenderEngine redraws lists by replacing their children; watch for fresh empty states. */
    function watchEmptyLists(doc) {
        const container = doc.getElementById('viewContainer');
        if (!container) return;
        // Removals are when a list may be emptied (StateManager announces keywordRemoved, channelRemoved...).
        const listen = (tries = 0) => {
            const manager = typeof StateManager !== 'undefined' ? StateManager : root.StateManager;
            if (manager?.subscribe) manager.subscribe(eventType => { if (/Removed|Cleared/i.test(String(eventType))) lastRemovalAt = Date.now(); });
            else if (tries < 10) root.setTimeout(() => listen(tries + 1), 500);
        };
        listen();
        scanEmptyLists(container);
        if (typeof root.MutationObserver !== 'function') return;
        new root.MutationObserver(records => {
            for (const record of records) {
                for (const added of record.addedNodes) {
                    if (added.nodeType === 1 && !added.closest?.('.ft-mascot')) scanEmptyLists(added);
                }
            }
        }).observe(container, { childList: true, subtree: true });
    }

    let lastSearchEmptyAt = 0;
    let lastRemovalAt = 0;

    function drawEmptyList(node, list, details) {
        // RenderEngine rewrites the node's textContent on a language change. Move its copy record onto a
        // child span first, so that refresh rewrites only the label and leaves the character in place.
        if (!node.querySelector?.('.ft-mascot-empty__label')) {
            const label = el('span', 'ft-mascot-empty__label', node.textContent);
            if (node.__ftRendererCopy) {
                label.__ftRendererCopy = node.__ftRendererCopy;
                delete node.__ftRendererCopy;
            }
            node.replaceChildren(label);
        }
        node.querySelector?.('.ft-mascot--empty')?.remove();
        node.classList.remove('ft-mascot-empty');
        if (!showsCharacters(companionMode)) return;
        if (list === 'search') {
            // Kriti searches with her magnifier and Uljhan peeks in and shrugs (DUO_SEARCH_EMPTY), once,
            // then rests on the shrug; the list redraws on each keystroke, so it replays at most every 10 s.
            const pose = emptyListPose('search');
            const now = Date.now();
            const plays = !prefersReducedMotion() && searchEmptyPlays(lastSearchEmptyAt, now);
            if (plays) lastSearchEmptyAt = now;
            const character = createCharacter({ className: 'ft-mascot--empty ft-mascot--search', imageName: plays ? sheetAssets(pose)[0] : stillImage(pose), height: 88, kind: 'static', tail: 'up' });
            node.classList.add('ft-mascot-empty');
            node.insertBefore(character.root, node.firstChild);
            character.say(t(COPY.noMatches));
            enter(character.picture);
            if (plays) root.setTimeout(() => playSheet(character.picture, pose, { onDone: () => idleLife(character.picture) }), 240);
            else idleLife(character.picture);
            return;
        }
        if (details.searching || details.mode === 'whitelist') return;
        // MascotMoments.emptyState: pointing over a first keyword list, reading over a first channel list,
        // peeking over a Kids list.
        const pose = emptyListPose(list, { kids: !!node.closest?.('#kidsView') });
        // A removal just emptied the list: Kriti and Uljhan sweep the card clean once, then her pose.
        const sweeping = !prefersReducedMotion() && sweepAfterRemoval(lastRemovalAt, Date.now());
        if (sweeping) lastRemovalAt = 0;
        const character = createCharacter({ className: `ft-mascot--empty ft-mascot--${pose}`, imageName: sweeping ? ASSETS.duoSweep[0] : stillImage(pose), height: 112, kind: 'static', tail: 'up' });
        node.classList.add('ft-mascot-empty');
        node.insertBefore(character.root, node.firstChild);
        character.say(t(list === 'channels' ? COPY.emptyChannels : COPY.emptyKeywords));
        enter(character.picture);
        if (sweeping) {
            root.setTimeout(() => playSheet(character.picture, 'duoSweep', {
                onDone: () => root.setTimeout(() => {
                    if (!character.picture.isConnected) return;
                    character.picture.src = assetUrl(stillImage(pose));
                    enter(character.picture);
                    idleLife(character.picture);
                }, 500)
            }), 240);
        } else {
            idleLife(character.picture);
        }
    }

    function redrawEmptyLists() {
        for (const entry of [...decoratedEmptyLists]) {
            if (!entry.node.isConnected) {
                decoratedEmptyLists.delete(entry);
                continue;
            }
            drawEmptyList(entry.node, entry.list, entry.details);
        }
    }

    // The app's first-install welcome (FirstInstallWelcomePlan, three pages), in the extension's terms:
    // what FilterTube does, block once and it's hidden everywhere, and that it stays free. Kriti holds
    // the logo beside it and says hello on the first page; with the Companion Off the words stand alone.
    const WELCOME_PAGES = Object.freeze([
        Object.freeze({
            title: ['welcome.one.title', 'Welcome to FilterTube'],
            subtitle: ['welcome.one.subtitle', 'You choose what shows up.'],
            body: ['welcome.one.body', 'Block a channel, word or topic once. FilterTube hides it on every page, in search and in what plays next.'],
            facts: Object.freeze([['welcome.fact.account', 'No FilterTube account.'], ['welcome.fact.ads', 'No ads and no tracking profile.']])
        }),
        Object.freeze({
            title: ['welcome.two.title', 'Block once, hidden everywhere'],
            body: ['welcome.two.body', 'Add a channel or word and it disappears from Home, Search, Clips and Watch. Kids gets its own space with its own rules.']
        }),
        Object.freeze({
            title: ['welcome.three.title', 'Free, and it stays free'],
            body: ['support.variant.classic.note', 'Free for everyone, always. Supporting is optional.']
        })
    ]);
    const WELCOME_NAV = Object.freeze({ next: ['welcome.next', 'Next'], back: ['welcome.back', 'Back'] });

    function mountWelcome(doc) {
        const container = doc.getElementById('viewContainer');
        if (!container) return;
        let card = null;
        const draw = async () => {
            const stored = await storageGet([WELCOME_KEY]);
            if (stored[WELCOME_KEY] !== true) {
                card?.remove();
                return;
            }
            // First open after install: show once, then clear the flag so it never returns.
            storageSet({ [WELCOME_KEY]: false });
            let page = 0;
            card = el('section', 'ft-mascot-welcome ft-mascot-welcome--pages');
            card.setAttribute('aria-roledescription', 'carousel');
            const character = showsCharacters(companionMode)
                ? createCharacter({ className: 'ft-mascot--welcome', imageName: ASSETS.kritiLogo, height: 160, kind: 'static', tail: 'left' })
                : null;
            const body = el('div', 'ft-mascot-welcome__body');
            const title = el('h2', 'ft-mascot-welcome__title');
            title.tabIndex = -1;
            const subtitle = el('p', 'ft-mascot-welcome__subtitle');
            const text = el('p', 'ft-mascot-welcome__text');
            const facts = el('ul', 'ft-mascot-welcome__facts');
            const nav = el('div', 'ft-mascot-welcome__nav');
            const dots = el('div', 'ft-mascot-welcome__dots');
            dots.setAttribute('aria-hidden', 'true');
            const back = el('button', 'btn-secondary ft-mascot-welcome__back');
            back.type = 'button';
            const next = el('button', 'btn-primary ft-mascot-welcome__dismiss');
            next.type = 'button';
            nav.append(dots, back, next);
            body.append(title, subtitle, text, facts, nav);
            if (character) {
                character.root.setAttribute('aria-hidden', 'true');
                card.append(character.root);
            }
            card.append(body);
            const close = () => {
                card.classList.add('is-leaving');
                const remove = () => card.remove();
                if (prefersReducedMotion()) remove();
                else root.setTimeout(remove, 150);
            };
            const render = (focus = false) => {
                const spec = WELCOME_PAGES[page];
                title.textContent = t(spec.title);
                subtitle.textContent = spec.subtitle ? t(spec.subtitle) : '';
                subtitle.hidden = !spec.subtitle;
                text.textContent = t(spec.body);
                facts.replaceChildren(...(spec.facts || []).map(entry => el('li', '', t(entry))));
                facts.hidden = !spec.facts;
                dots.replaceChildren(...WELCOME_PAGES.map((_, index) => el('span', index === page ? 'is-current' : '')));
                back.textContent = t(WELCOME_NAV.back);
                back.hidden = page === 0;
                next.textContent = page === WELCOME_PAGES.length - 1 ? t(COPY.welcomeDismiss) : t(WELCOME_NAV.next);
                card.setAttribute('aria-label', `${t(spec.title)} (${page + 1}/${WELCOME_PAGES.length})`);
                if (focus) title.focus({ preventScroll: true });
            };
            back.addEventListener('click', () => { if (page > 0) { page -= 1; render(true); } });
            next.addEventListener('click', () => {
                if (page < WELCOME_PAGES.length - 1) { page += 1; render(true); playSound('page'); }
                else {
                    // The commit: a small sparkle lands with the tap (Android LauncherActivity), then the card leaves.
                    root.FilterTubeDoodles?.sparkle?.(next);
                    close();
                }
            });
            container.insertBefore(card, container.firstChild);
            render();
            root.addEventListener?.('filtertube-ui-locale-changed', () => render());
            card.classList.add('is-entering');
            root.requestAnimationFrame?.(() => root.requestAnimationFrame?.(() => card.classList.remove('is-entering')));
        };
        draw();
    }

    let importMoment = null;

    /**
     * After a verified import (a restore): the duo's backup moment once a day, else Kriti's thumbs up
     * beside the backup importer.
     */
    function celebrateImport() {
        return backupSaved('ftImportV3Btn', { line: t(COPY.imported), thumbsFallback: true });
    }

    /**
     * A finished backup or restore the person asked for (Android MascotPaperToast.backupSaved): Kriti stamps
     * a check on the page and Uljhan claps (DUO_BACKUP_SAVED) beside the button, at most once a local day.
     * Reduced motion shows the clapping still; Companion Off shows nothing (the toast says it).
     */
    async function backupSaved(buttonId = 'ftExportV3Btn', { line = '', thumbsFallback = false } = {}) {
        const doc = root.document;
        const button = doc?.getElementById?.(buttonId);
        const item = button?.closest?.('.help-item') || button?.parentElement;
        if (!item) return false;
        importMoment?.remove();
        importMoment = null;
        if (!showsCharacters(companionMode)) return false;
        if (!(await takeMoment(BACKUP_MOMENT_KEY, localDay()))) {
            if (thumbsFallback) thumbsUp(item, line);
            return false;
        }
        const plays = !prefersReducedMotion();
        const character = createCharacter({ className: 'ft-mascot--stamp ft-mascot--backup', imageName: plays ? ASSETS.duoBackup[0] : stillImage('duoBackup'),
            height: 80, kind: 'event', tail: 'left' });
        const holder = el('div', 'ft-mascot-import');
        holder.appendChild(character.root);
        item.appendChild(holder);
        importMoment = holder;
        if (line) {
            character.say(line, { event: true });
            announce(holder, line);
        }
        enter(character.picture);
        if (plays) {
            root.setTimeout(() => playSheet(character.picture, 'duoBackup', { onDone: () => idleLife(character.picture) }), 240);
            // The stamp lands on the second frame the extension ships (the sheet's third).
            root.setTimeout(() => playSound('stamp'), 240 + sheetFrameMs('duoBackup'));
        } else {
            idleLife(character.picture);
        }
        return true;
    }

    /** Kriti's thumbs up beside the importer (an import after today's backup moment). */
    function thumbsUp(item, line) {
        const character = createCharacter({ className: 'ft-mascot--stamp', imageName: ASSETS.kritiThumbsUp, height: 80, kind: 'event', tail: 'left' });
        const holder = el('div', 'ft-mascot-import');
        holder.appendChild(character.root);
        item.appendChild(holder);
        importMoment = holder;
        if (!prefersReducedMotion()) {
            character.root.classList.add('is-stamping');
            character.root.addEventListener('animationend', () => character.root.classList.remove('is-stamping'), { once: true });
        }
        character.say(line, { event: true });
        announce(holder, line);
        playSound('page');
    }

    // ---- Kriti's locked sign (Android LockedSignView) ---------------------------------------------

    /**
     * Kriti holding the sign with "Locked until <time>" written on it, for a Self-Control or study-lock
     * refusal: a decision surface, so always a still (no sheet, no idle beats, no sound). Decorative for
     * screen readers: the words beside her say the same. Null with the Companion Off or no end time.
     */
    function lockedSign(until, { height = 120, className = '' } = {}) {
        const end = Number(until);
        const doc = root.document;
        if (!doc || !showsCharacters(companionMode) || !Number.isFinite(end) || end <= Date.now()) return null;
        const sign = signLines(t(LOCKED_COPY, { time: '{time}' }), signTime(end));
        const holder = el('div', `pk-locked-sign${className ? ` ${className}` : ''}`);
        holder.setAttribute('aria-hidden', 'true');
        holder.style.height = `${height}px`;
        holder.style.width = `${Math.round(height * LOCKED_SIGN.aspect)}px`;
        const art = image(ASSETS.kritiLockedSign, 'pk-locked-sign__art', height);
        const words = el('div', 'pk-locked-sign__words');
        words.style.left = `${LOCKED_SIGN.left * 100}%`;
        words.style.top = `${LOCKED_SIGN.top * 100}%`;
        words.style.width = `${((LOCKED_SIGN.right - LOCKED_SIGN.left) * 100).toFixed(1)}%`;
        words.style.height = `${((LOCKED_SIGN.bottom - LOCKED_SIGN.top) * 100).toFixed(1)}%`;
        let family = 'sans-serif';
        try { family = root.getComputedStyle?.(doc.body)?.fontFamily || family; } catch (e) { }
        words.style.fontFamily = family;
        let context = null;
        try { context = doc.createElement('canvas').getContext?.('2d') || null; } catch (e) { }
        const measure = (text, px, bold) => {
            if (!context) return [...text].length * px * 0.56;
            context.font = `${bold ? 700 : 400} ${px}px ${family}`;
            return context.measureText(text).width;
        };
        const areaWidth = height * LOCKED_SIGN.aspect * (LOCKED_SIGN.right - LOCKED_SIGN.left);
        const areaHeight = height * (LOCKED_SIGN.bottom - LOCKED_SIGN.top);
        // A little margin inside the sign's edges.
        const size = fitSignSize(sign, areaWidth * 0.92, areaHeight * 0.96, measure);
        sign.lines.forEach((line, index) => {
            const time = index === sign.timeIndex;
            const span = el('span', time ? 'pk-locked-sign__time' : 'pk-locked-sign__label', line);
            span.style.fontSize = `${(size * (time ? LOCKED_SIGN.timeScale : 1)).toFixed(2)}px`;
            words.appendChild(span);
        });
        words.hidden = !(size > 0);
        holder.append(art, words);
        return holder;
    }

    /** Puts the locked sign on the toast just shown (a refused profile switch during Self-Control). */
    function lockedToast(until) {
        const toasts = root.document?.querySelectorAll?.('.ft-toast');
        const toast = toasts?.length ? toasts[toasts.length - 1] : null;
        if (!toast) return false;
        const sign = lockedSign(until, { height: 96, className: 'pk-toast-sign' });
        if (!sign) return false;
        toast.querySelector('.pk-toast-art')?.remove();
        toast.classList.add('has-mascot', 'has-sign');
        toast.insertBefore(sign, toast.firstChild);
        return true;
    }

    // ---- Motion: springs, sheets, idle life and moments (StudyMascotView, MascotIdle) -------------

    const ENTER_EASE = 'cubic-bezier(0.2, 0, 0, 1)';
    const EXIT_EASE = 'cubic-bezier(0.3, 0, 1, 1)';
    const MICRO_MS = 120;

    function transformFor(channel, value) {
        if (channel === 'y') return `translateY(${value.toFixed(2)}px)`;
        if (channel === 'x') return `translateX(${value.toFixed(2)}px)`;
        if (channel === 'scaleY') return `scaleY(${(1 + value).toFixed(4)})`;
        if (channel === 'scale') return `scale(${(1 + value).toFixed(4)})`;
        return `rotate(${value.toFixed(2)}deg)`;
    }

    /**
     * Runs one of the app's springs on a transform channel of [node] (y and x in px, scale and scaleY
     * as an offset from 1, rotate in degrees), from [from] with a start [velocity] per second, to rest.
     * Never with reduced motion. Returns the Animation, or null.
     */
    function spring(node, channel, spec, velocity, { from = 0, origin = '50% 100%' } = {}) {
        if (!node?.animate || prefersReducedMotion()) return null;
        const scale = channel === 'scale' || channel === 'scaleY';
        const samples = springSamples(spec, velocity, { from, settle: scale ? 0.0015 : 0.05 });
        node.style.transformOrigin = origin;
        try {
            return node.animate(samples.map(value => ({ transform: transformFor(channel, value) })),
                { duration: Math.round((samples.length - 1) * 1000 / 60), easing: 'linear' });
        } catch (e) {
            return null;
        }
    }

    /** A mascot arrives (springMascot: scale 0.86 to 1, with alpha over MICRO). */
    function enter(node) {
        if (!node?.animate || prefersReducedMotion()) return;
        try { node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MICRO_MS, easing: ENTER_EASE }); } catch (e) { }
        spring(node, 'scale', SPRINGS.mascot, 0, { from: -0.14, origin: '50% 100%' });
    }

    /**
     * Plays a sheet on an image once at the app's own frame timing, then rests on its last frame (or,
     * for a leaving motion, slides out and fades). With reduced motion the resting still shows at once.
     * Returns a stop function.
     */
    function playSheet(picture, sheet, { onDone = null, popup = false } = {}) {
        const names = sheetAssets(sheet);
        const reduced = prefersReducedMotion();
        // The popup plays the short form (popupSheet) and never slides a leaving character out.
        const order = popup && !reduced ? popupSheet(sheet).order : sheetFrames(sheet, reduced);
        if (!picture || !order.length) return () => {};
        if (order.length === 1) {
            picture.src = assetUrl(names[order[0]]);
            onDone?.();
            return () => {};
        }
        const frameMs = popup ? popupSheet(sheet).ms : sheetFrameMs(sheet);
        let timer = 0;
        let stopped = false;
        picture.dataset.ftPlaying = sheet;
        const finish = () => {
            delete picture.dataset.ftPlaying;
            if (MOTIONS[sheet]?.leaves && !popup && picture.animate && !stopped) {
                timer = root.setTimeout(() => {
                    try {
                        picture.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${Math.round((picture.width || 80) * 0.6)}px)`, opacity: 0 }],
                            { duration: 300, easing: EXIT_EASE, fill: 'forwards' });
                    } catch (e) { }
                }, frameMs);
            }
            onDone?.();
        };
        preload([...names]).then(() => {
            let index = 0;
            const step = () => {
                if (stopped || !picture.isConnected) { delete picture.dataset.ftPlaying; return; }
                picture.src = assetUrl(names[order[index]]);
                index += 1;
                if (index < order.length) timer = root.setTimeout(step, popup ? frameMs : sheetHoldMs(sheet, index - 1));
                else finish();
            };
            step();
        });
        return () => { stopped = true; root.clearTimeout(timer); delete picture.dataset.ftPlaying; };
    }

    /** The sieve loop (Kriti's funnel: frames 1 to 5 at 180 ms) for [loops] cycles, then its last frame. */
    function playSieve(picture, loops = 1, onDone = null) {
        const frames = prefersReducedMotion() ? [SIEVE_FRAME_COUNT] : [].concat(...Array.from({ length: loops }, () => [1, 2, 3, 4, 5]));
        let index = 0;
        let timer = 0;
        let stopped = false;
        picture.dataset.ftPlaying = 'sieve';
        const step = () => {
            if (stopped || !picture.isConnected) { delete picture.dataset.ftPlaying; return; }
            picture.src = assetUrl(ASSETS.sieve[frames[index] - 1]);
            index += 1;
            if (index < frames.length) timer = root.setTimeout(step, SIEVE_FRAME_MS);
            else { delete picture.dataset.ftPlaying; onDone?.(); }
        };
        preload(ASSETS.sieve).then(step);
        return () => { stopped = true; root.clearTimeout(timer); delete picture.dataset.ftPlaying; };
    }

    /** DoodleKit's sparkle beside a mascot's head: pops (springHeart) and fades. */
    function sparkleBeside(picture) {
        const host = picture?.parentElement;
        if (!host || prefersReducedMotion()) return;
        const mark = image(ASSETS.counterMark, 'pk-idle-sparkle', 18);
        host.classList.add('pk-idle-host');
        host.appendChild(mark);
        spring(mark, 'scale', { stiffness: 800, damping: 0.45 }, 0, { from: -0.4, origin: '50% 50%' });
        root.setTimeout(() => {
            try {
                const fade = mark.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: EXIT_EASE, fill: 'forwards' });
                fade.onfinish = () => mark.remove();
            } catch (e) { mark.remove(); }
        }, 700);
    }

    function currentArt(picture) {
        return String(picture?.getAttribute?.('src') || picture?.src || '').replace(/^.*\//, '');
    }

    /** One idle beat on the art she rests on (bob, hop, squash, wiggle, sparkle or one sieve cycle). */
    function idleBeat(picture, beat) {
        if (beat === 'bob') return spring(picture, 'y', SPRINGS.bob, IDLE.bobVelocity);
        if (beat === 'hop') return spring(picture, 'y', SPRINGS.mascot, IDLE.hopVelocity);
        if (beat === 'squash') return spring(picture, 'scaleY', SPRINGS.mascot, IDLE.squashVelocity);
        if (beat === 'wiggle') return spring(picture, 'rotate', SPRINGS.wiggle, IDLE.wiggleVelocity);
        if (beat === 'sparkle') return sparkleBeside(picture);
        if (beat === 'sieve') {
            const rest = picture.src;
            playSieve(picture, 1, () => { if (picture.isConnected) picture.src = rest; });
        }
        if (beat === 'bounce' || beat === 'breath') {
            const rest = picture.src;
            const popup = !!root.document?.getElementById?.('popupRoot');
            playSheet(picture, beat === 'bounce' ? 'uljhanBounce' : 'kritiBreath', { popup, onDone: () => { if (picture.isConnected) picture.src = rest; } });
        }
        return null;
    }

    const idleLives = new WeakMap();
    const liveIdle = new Set();
    let idleWakeInstalled = false;
    let lastIdleWake = -Infinity;

    /** One throttled, passive, document-level listener wakes every resting mascot on the page. */
    function installIdleWake(doc) {
        if (idleWakeInstalled || !doc?.addEventListener) return;
        idleWakeInstalled = true;
        const onInteraction = () => {
            const now = Date.now();
            if (!idleWakeDue(lastIdleWake, now)) return;
            lastIdleWake = now;
            for (const life of [...liveIdle]) {
                if (!life.picture.isConnected) { liveIdle.delete(life); continue; }
                life.wake(now);
            }
        };
        for (const type of IDLE_WAKE_EVENTS) doc.addEventListener(type, onInteraction, { passive: true, capture: true });
    }

    /**
     * Idle life for a mascot that rests on a page (StudyMascotView.idle): now and then one small beat
     * that fits the pose, the first after 6 to 12 seconds, then wider gaps (12, 20, 30 s, jittered), and
     * none after two minutes until a tap, a re-entry or a new pose. Lively only, never with reduced
     * motion, only while she is on screen in a visible page and no sheet is playing. A tap hops her
     * and starts the rhythm over.
     */
    function idleLife(picture) {
        if (!picture || idleLives.has(picture)) return idleLives.get(picture) || null;
        let timer = 0;
        let index = 0;
        let started = Date.now();
        let sparkled = false;
        const may = () => companionMode === 'lively' && !prefersReducedMotion();
        const onScreen = () => {
            if (!picture.isConnected || root.document?.visibilityState === 'hidden' || !picture.offsetParent) return false;
            const box = picture.getBoundingClientRect?.();
            return !box || (box.bottom > 0 && box.top < (root.innerHeight || 1e6) && box.right > 0 && box.left < (root.innerWidth || 1e6));
        };
        let pending = false;
        const schedule = () => {
            root.clearTimeout(timer);
            pending = false;
            if (!picture.isConnected || !may()) return;
            const delay = idleDelay(index);
            if (Date.now() + delay - started > IDLE.budget) return;
            pending = true;
            timer = root.setTimeout(tick, delay);
        };
        const tick = () => {
            pending = false;
            if (!picture.isConnected) return;
            if (onScreen() && !picture.dataset.ftPlaying) {
                const beat = pickIdleBeat(idleBeatsFor(currentArt(picture)), sparkled);
                if (beat === 'sparkle') sparkled = true;
                idleBeat(picture, beat);
            }
            index += 1;
            schedule();
        };
        const restart = () => {
            index = 0;
            sparkled = false;
            started = Date.now();
            schedule();
        };
        const tap = () => {
            if (!may() || picture.dataset.ftPlaying) return;
            spring(picture, 'y', SPRINGS.bob, IDLE.tapVelocity);
            playSound('pop');
            restart();
        };
        (picture.closest?.('button') || picture).addEventListener('click', tap);
        const wake = now => {
            const next = idleWake({ pending, index, sparkled, started }, now);
            started = next.started;
            if (next.restart) { index = next.index; sparkled = next.sparkled; schedule(); }
        };
        const life = { restart, wake, picture, stop: () => { root.clearTimeout(timer); pending = false; } };
        idleLives.set(picture, life);
        liveIdle.add(life);
        installIdleWake(root.document);
        onModeChange(() => { if (picture.isConnected) restart(); });
        restart();
        return life;
    }

    /**
     * A looping sheet on a page card (the dashboard greeting's duo): mountLoop(host, 'duoSieve' |
     * 'duoShoo' | any sheet | 'sieve', {height, className}). Lively plays it again after a 1.2 s rest,
     * for 30 seconds, then rests with idle life until the next interaction on the page starts it again;
     * it waits while the page is hidden or the card is off screen. Quiet plays it once and rests on the
     * last frame. Reduced motion shows only that still. Off draws nothing (the holder stays, hidden).
     * The Companion setting switching later redraws it. Returns {root, stop()} or null for an unknown
     * sheet or no host.
     */
    function mountLoop(host, sheet = 'duoSieve', { height = 120, className = '' } = {}) {
        if (!host || !root.document || !(MOTIONS[sheet] || sheet === 'sieve')) return null;
        host.querySelector?.(':scope > .pk-loop')?.remove();
        const wrap = el('div', `pk-loop${className ? ` ${className}` : ''}`);
        wrap.dataset.ftLoop = sheet;
        wrap.setAttribute('aria-hidden', 'true');
        host.appendChild(wrap);
        let picture = null;
        let timer = 0;
        let stopSheet = null;
        let started = 0;
        let resting = false;
        let stopped = false;
        const still = () => stillImage(sheet);
        const visible = () => !!picture?.isConnected && root.document.visibilityState !== 'hidden' && !!picture.offsetParent;
        const cycle = () => {
            root.clearTimeout(timer);
            if (stopped || !picture?.isConnected) return;
            if (!visible()) { timer = root.setTimeout(cycle, 2000); return; }
            if (Date.now() - started > LOOP_CAP_MS) { resting = true; picture.src = assetUrl(still()); idleLife(picture); return; }
            const motion = MOTIONS[sheet];
            const gap = motion?.loop ? sheetHoldMs(sheet, motion.order.length - 1) : REPLAY_REST_MS;
            const next = () => { timer = root.setTimeout(cycle, gap); };
            stopSheet = sheet === 'sieve' ? playSieve(picture, 1, next) : playSheet(picture, sheet, { onDone: next });
        };
        const draw = () => {
            root.clearTimeout(timer);
            stopSheet?.();
            stopSheet = null;
            wrap.replaceChildren();
            picture = null;
            resting = false;
            wrap.hidden = !showsCharacters(companionMode);
            if (wrap.hidden || stopped) return;
            picture = image(still(), 'pk-loop__art', height);
            wrap.appendChild(picture);
            started = Date.now();
            if (prefersReducedMotion()) return;
            if (companionMode !== 'lively') {
                root.setTimeout(() => { if (picture?.isConnected) stopSheet = sheet === 'sieve' ? playSieve(picture, 1) : playSheet(picture, sheet); }, 360);
                return;
            }
            timer = root.setTimeout(cycle, 360);
        };
        // Any interaction on the page starts a resting loop again (the idle wake's one listener).
        const life = {
            picture: { get isConnected() { return wrap.isConnected; } },
            wake: () => {
                if (!resting || stopped || companionMode !== 'lively' || prefersReducedMotion() || !picture) return;
                resting = false;
                started = Date.now();
                cycle();
            }
        };
        liveIdle.add(life);
        installIdleWake(root.document);
        draw();
        onModeChange(() => { if (wrap.isConnected) draw(); });
        return { root: wrap, stop: () => { stopped = true; root.clearTimeout(timer); stopSheet?.(); liveIdle.delete(life); } };
    }

    const recentLoadingLines = [];

    function nextLoadingLine() {
        const index = pickLoadingLine(recentLoadingLines);
        recentLoadingLines.push(index);
        if (recentLoadingLines.length > RECENT_LOADING_LINES) recentLoadingLines.shift();
        return t(LOADING_LINES[index]);
    }

    /** The still a loading moment shows (and rests on between plays). */
    function loadingStill(name) {
        if (name === 'duoShoo') return ASSETS.duoShoo[4];
        if (name === 'kritiJump') return ASSETS.kritiJump[0];
        return stillImage(name);
    }

    /**
     * Runs a loading moment until the wait ends (the holder leaves the page) or for 30 seconds at
     * most: a once-through sheet plays again after a 1.2 s rest, the sieve loops, and a still pose
     * floats with a small bob.
     */
    function runLoading(holder, art, name, scene = 'general') {
        const startedAt = Date.now();
        const alive = () => holder.isConnected && Date.now() - startedAt < LOOP_CAP_MS;
        if (prefersReducedMotion()) return;
        const again = fn => root.setTimeout(() => { if (alive()) fn(); }, REPLAY_REST_MS);
        if (scene === 'fetch') {
            // UljhanLoadMore: he hops up into the footer, then one weighted action after another (never
            // the same twice in a row), each followed by a short hold with a bob.
            let last = name;
            const act = action => {
                if (!alive()) return;
                last = action;
                holder.dataset.ftLoading = action;
                if (MOTIONS[action]) playSheet(art, action, { onDone: () => hold() });
                else {
                    art.src = assetUrl(stillImage(action));
                    spring(art, action === 'uljhanWiggle' ? 'rotate' : 'y', action === 'uljhanWiggle' ? SPRINGS.wiggle : SPRINGS.mascot,
                        action === 'uljhanWiggle' ? IDLE.wiggleVelocity : IDLE.hopVelocity);
                    hold();
                }
            };
            const hold = () => root.setTimeout(() => {
                if (!alive()) return;
                spring(art, 'y', SPRINGS.bob, IDLE.bobVelocity);
                root.setTimeout(() => act(pickLoadingMoment(Math.random, 'fetch', last)), 700);
            }, 600);
            try {
                art.animate?.([{ transform: 'translateY(85%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
                    { duration: 260, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
            } catch (e) { }
            root.setTimeout(() => act(name), 260);
            return;
        }
        if (name === 'uljhanHop' || name === 'uljhanWiggle') {
            const beat = () => { if (!alive()) return; idleBeat(art, name === 'uljhanHop' ? 'bounce' : 'wiggle'); root.setTimeout(beat, 1600); };
            root.setTimeout(beat, 300);
        } else if (name === 'sieve') {
            const loop = () => playSieve(art, 1, () => { if (alive()) loop(); });
            loop();
        } else if (MOTIONS[name]) {
            const play = () => playSheet(art, name, { onDone: () => again(play) });
            play();
        } else {
            const bob = () => { if (!alive()) return; spring(art, 'y', SPRINGS.bob, IDLE.bobVelocity); root.setTimeout(bob, 1600); };
            root.setTimeout(bob, 400);
        }
    }

    /**
     * One pose and one line for a state: loading, empty, noMatches, error, done, hello, reading, break,
     * offline, slow or restored. Loading picks one of the app's loading moments (the duo sieve most
     * often), shows only after 600 ms, and carries a line in Lively. Returns null with the Companion
     * set to Off, so the caller's words stand alone.
     */
    function moment(kind, { line = '', height = 96 } = {}) {
        const spec = MOMENTS[kind];
        if (!spec || !root.document || !showsCharacters(companionMode)) return null;
        const holder = el('div', `pk-moment pk-moment--${kind}`);
        holder.dataset.ftMoment = kind;
        // The scene is read when the wait shows (the caller has placed the holder by then); until then
        // the art is a general pick, hidden behind is-waiting.
        let loadingName = kind === 'loading' ? pickLoadingMoment() : '';
        const art = image(kind === 'loading' ? loadingStill(loadingName) : stillImage(spec.image), 'pk-moment__art', height);
        art.style.setProperty('--pk-moment-size', `${height}px`);
        holder.appendChild(art);
        let text = line || (spec.copy && kind !== 'loading' ? t(COPY[spec.copy]) : '');
        if (!text && kind === 'loading' && companionMode === 'lively') text = nextLoadingLine();
        if (text) holder.appendChild(el('p', 'pk-moment__line', kind === 'loading' ? text : clampLine(text)));
        if (kind === 'loading') {
            holder.dataset.ftLoading = loadingName;
            holder.classList.add('is-waiting');
            root.setTimeout(() => {
                if (!holder.isConnected) return;
                const scene = loadingScene(holder);
                if (scene !== 'general') {
                    loadingName = pickLoadingMoment(Math.random, scene);
                    holder.dataset.ftLoading = loadingName;
                    holder.dataset.ftScene = scene;
                    art.src = assetUrl(loadingStill(loadingName));
                }
                holder.classList.remove('is-waiting');
                if (scene !== 'fetch') enter(art);
                runLoading(holder, art, loadingName, scene);
            }, LOADING_REVEAL_MS);
            return holder;
        }
        const sheet = typeof ASSETS[spec.image] === 'string' ? '' : spec.image;
        root.requestAnimationFrame?.(() => {
            if (!holder.isConnected) return;
            enter(art);
            if (sheet && MOTIONS[sheet]) root.setTimeout(() => playSheet(art, sheet, { onDone: () => idleLife(art) }), 360);
            else idleLife(art);
        });
        return holder;
    }

    // ---- Brand moments on the options page -------------------------------------------------------

    function onLocaleChange(listener) {
        root.addEventListener?.('filtertube-ui-locale-changed', listener);
    }

    /**
     * Kriti sieving Uljhan on the dashboard, standing on the profile card's top edge: the duo sieve
     * once on Lively (420 ms a frame), then the app's idle rhythm. Quiet keeps the last frame still.
     * Her hello shows on hover, focus or click only.
     */
    /** Kriti peeks over the sidebar footer on every page: present, and out of the way. */
    function mountSidebar(doc) {
        const footer = doc.querySelector('#sidebarNav .sidebar-footer');
        if (!footer) return;
        let peek = null;
        const draw = () => {
            peek?.remove();
            peek = null;
            if (!showsCharacters(companionMode)) return;
            peek = el('div', 'pk-sidebar-peek');
            peek.appendChild(image(ASSETS.kritiPeekLow, 'pk-sidebar-peek__art', 36));
            footer.insertBefore(peek, footer.firstChild);
        };
        draw();
        onModeChange(draw);
    }

    /** About: who the two are, in their own words. */
    function mountAbout(doc) {
        const shell = doc.querySelector('#aboutView .ft-about-site');
        const anchor = shell?.querySelector('.ft-about-feature-grid');
        if (!shell) return;
        let card = null;
        const draw = () => {
            card?.remove();
            card = null;
            // The page's own "Kriti and Uljhan" story section, when it has one, already introduces them.
            if (!showsCharacters(companionMode) || doc.querySelector('#aboutView [data-ft-duo-story]')) return;
            card = el('section', 'pk-duo-card');
            const art = el('div', 'pk-duo-card__art');
            art.append(image(ASSETS.kritiWave, 'pk-duo-card__kriti', 132), image(ASSETS.uljhanFront, 'pk-duo-card__uljhan', 96));
            const body = el('div', 'pk-duo-card__body');
            const title = el('h3', 'pk-duo-card__title', t(DUO_COPY.aboutTitle));
            const kriti = el('p', 'pk-duo-card__line', t(DUO_COPY.hello));
            const uljhan = el('p', 'pk-duo-card__line', t(DUO_COPY.aboutUljhan));
            body.append(title, kriti, uljhan);
            card.append(art, body);
            if (anchor) shell.insertBefore(card, anchor);
            else shell.appendChild(card);
            for (const picture of art.querySelectorAll('img')) idleLife(picture);
        };
        draw();
        onModeChange(draw);
        onLocaleChange(draw);
    }

    /**
     * Support: the Donate hero and the dashboard card take this opening's variant. The note under the
     * body always says that FilterTube is free and that support is optional.
     */
    /**
     * The variant's one crayon touch (Android SupportOfferSheet.playTouch): a sparkle on the logo, an
     * underline under the title, or a heart that pops on Kriti when a way to support is picked.
     */
    function playSupportTouch(doc, variant, entry) {
        const Doodles = root.FilterTubeDoodles;
        if (!Doodles || !variant || !entry) return;
        if (variant.touch === 'underlineTitle') Doodles.underline?.(entry.title);
        else if (variant.touch === 'sparkleLogo') {
            const logo = doc.querySelector('#donateView .donate-hero img, .app-logo img, .brand img') || entry.art;
            root.setTimeout?.(() => Doodles.sparkle?.(logo), 300);
        } else if (variant.touch === 'heartOnPick') {
            doc.querySelectorAll?.('#donateView a[href], #donateView button').forEach(link => {
                link.addEventListener('click', () => Doodles.heartPop?.(entry.art.querySelector('img') || link), { once: true });
            });
        }
    }

    /**
     * The variant's motion, as the app's support sheet plays it (SupportSheetVariants): the sieve loops
     * three times, one person taps her pencil three times, morning waves, evening says good night,
     * classic hugs the logo. Lively plays it; Quiet and reduced motion keep the still; then idle life.
     */
    function playSupportMotion(picture, variant) {
        if (!picture || !variant) return;
        const rest = () => idleLife(picture);
        if (companionMode !== 'lively' || prefersReducedMotion()) { rest(); return; }
        const motion = SUPPORT_MOTIONS[variant.id];
        if (!motion) { rest(); return; }
        if (motion.sheet === 'sieve') {
            playSieve(picture, motion.times, () => { picture.src = assetUrl(stillImage(variant.image)); rest(); });
            return;
        }
        let left = motion.times;
        const once = () => playSheet(picture, motion.sheet, { onDone: () => {
            left -= 1;
            if (left > 0 && picture.isConnected) root.setTimeout(once, 240);
            else { if (motion.restOn) picture.src = assetUrl(stillImage(motion.restOn)); rest(); }
        } });
        root.setTimeout(once, 360);
    }

    function mountSupport(doc) {
        const hero = doc.querySelector('#donateView .donate-hero');
        const promo = doc.querySelector('.donate-promo-text')?.parentElement || null;
        if (!hero && !promo) return;
        let variant = null;
        const blocks = [];
        const build = (className, artHeight) => {
            const block = el('div', `pk-support ${className}`);
            const art = el('div', 'pk-support__art');
            const body = el('div', 'pk-support__body');
            const title = el('h2', 'pk-support__title');
            const text = el('p', 'pk-support__text');
            const note = el('p', 'pk-support__note');
            // What a small amount does (owner, 2026-11-17): monthly from $1 on Ko-fi, or yearly.
            const price = el('p', 'pk-support__price');
            body.append(title, text, note, price);
            block.append(art, body);
            return { block, art, title, text, note, price, artHeight };
        };
        const fill = () => {
            if (!variant) return;
            const copy = SUPPORT_COPY[variant.id];
            for (const entry of blocks) {
                entry.block.dataset.variant = variant.id;
                entry.title.textContent = t(copy.title);
                entry.text.textContent = t(copy.body);
                entry.note.textContent = t(copy.note);
                entry.price.textContent = t(SUPPORT_PRICE);
                entry.art.replaceChildren();
                if (showsCharacters(companionMode)) entry.art.appendChild(image(stillImage(variant.image), 'pk-support__image', entry.artHeight));
                entry.art.hidden = !showsCharacters(companionMode);
            }
        };
        const start = async () => {
            const stored = await storageGet([SUPPORT_HISTORY_KEY]);
            variant = pickSupportVariant(stored[SUPPORT_HISTORY_KEY], new Date().getHours(), companionMode);
            storageSet({ [SUPPORT_HISTORY_KEY]: rememberSupportVariant(stored[SUPPORT_HISTORY_KEY], variant.id) });
            if (hero) {
                const entry = build('pk-support--hero', 168);
                blocks.push(entry);
                hero.classList.add('has-support-variant');
                hero.insertBefore(entry.block, hero.firstChild);
            }
            if (promo) {
                const entry = build('pk-support--card', 96);
                blocks.push(entry);
                promo.classList.add('has-support-variant');
                promo.insertBefore(entry.block, promo.firstChild);
            }
            fill();
            playSupportTouch(doc, variant, blocks[0]);
            const heroArt = blocks[0]?.art.querySelector('img');
            playSupportMotion(heroArt, variant);
        };
        start();
        onModeChange(() => {
            // A variant that names Kriti gives way to a plain one when the Companion is switched off.
            if (variant && variant.characters && !showsCharacters(companionMode)) variant = SUPPORT_VARIANTS[0];
            fill();
        });
        onLocaleChange(fill);
    }

    /** "Saved for {name}" on the parent session bar after a change to a child's space saves (Kriti's thumbs up). */
    function mountSessionSaved(doc) {
        let hideTimer = 0;
        doc.addEventListener?.('filtertube:parent-session-saved', event => {
            const bar = doc.querySelector('#managedChildGlobalBanner.ft-session-bar');
            const name = String(event?.detail?.name || '').trim();
            if (!bar || !name) return;
            bar.querySelector('.pk-session-saved')?.remove();
            root.clearTimeout(hideTimer);
            const chip = el('span', 'pk-session-saved');
            chip.setAttribute('role', 'status');
            if (showsCharacters(companionMode)) chip.appendChild(image(ASSETS.kritiThumbsUp, 'pk-session-saved__art', 28));
            chip.appendChild(el('span', 'pk-session-saved__text', t(SESSION_SAVED, { name })));
            bar.appendChild(chip);
            playSound('success');
            hideTimer = root.setTimeout(() => chip.remove(), 2600);
        });
    }

    /**
     * Kriti keeps the Study status card company on the options page: reading when no session is on,
     * with her notebook during a round, her mug on a break, a thumbs up when the day is done. A clock
     * hold has no character, and the in-session strip in the popup never does.
     */
    function watchStudyStatus(doc) {
        const container = doc.getElementById('viewContainer');
        if (!container) return;
        const poseFor = node => {
            if (node.classList.contains('is-hold')) return '';
            if (node.classList.contains('is-break')) return 'kritiMug';
            if (node.classList.contains('is-done')) return 'kritiThumbsUp';
            if (node.classList.contains('is-normal')) return 'kritiReading';
            // In a focus round: Kriti's finger to her lips.
            return 'kritiShh';
        };
        const scan = () => {
            for (const node of container.querySelectorAll('.ft-study-status')) {
                const pose = showsCharacters(companionMode) ? poseFor(node) : '';
                const existing = node.querySelector(':scope > .pk-study-kriti');
                if (existing && existing.dataset.pose === pose) continue;
                existing?.remove();
                if (!pose) continue;
                const art = image(stillImage(pose), 'pk-study-kriti', 76);
                art.dataset.pose = pose;
                node.appendChild(art);
                if (pose === 'kritiMug' && companionMode === 'lively') playSheet(art, 'kritiMug', { onDone: () => idleLife(art) });
                else idleLife(art);
            }
        };
        scan();
        if (typeof root.MutationObserver === 'function') {
            let queued = false;
            new root.MutationObserver(() => {
                if (queued) return;
                queued = true;
                root.setTimeout(() => { queued = false; scan(); }, 0);
            }).observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        }
        onModeChange(scan);
    }

    /**
     * The app's paper toast (MascotPaperToast): a success shows Kriti's thumbs up in Lively (she
     * arrives with the mascot spring, then the stamp spring), and a crayon check drawn in the leading
     * slot otherwise; an error shows Uljhan's shrug. With the Companion Off a success still gets the
     * check, which is a mark, not a character. The words stay the message.
     */
    function watchToasts(doc) {
        if (typeof root.MutationObserver !== 'function' || !doc.body) return;
        new root.MutationObserver(records => {
            for (const record of records) {
                for (const added of record.addedNodes) {
                    if (added.nodeType !== 1 || !added.classList?.contains('ft-toast') || added.querySelector('.pk-toast-art, .pk-toast-check, .pk-locked-sign')) continue;
                    const success = added.classList.contains('ft-toast-success');
                    const error = added.classList.contains('ft-toast-error');
                    // A moment may ask for its own pose (Android MascotPaperToast.kriti): Kriti waving after a
                    // profile switch, jumping when pairing ends; "check" keeps the crayon check only.
                    const wanted = added.dataset?.ftMascot || '';
                    if (success && wanted === 'check') {
                        added.classList.add('has-mascot');
                        added.insertBefore(root.FilterTubeDoodles?.check?.({ className: 'pk-toast-check', delay: 220 }) || el('span', 'pk-toast-check'), added.firstChild);
                    } else if (success && companionMode === 'lively' && wanted === 'highfive') {
                        // A sync landed: Kriti and Uljhan high-five (Lively; reduced motion shows the still).
                        const plays = !prefersReducedMotion();
                        const art = image(plays ? ASSETS.duoHighFive[0] : stillImage('duoHighFive'), 'pk-toast-art pk-toast-art--duo', 48);
                        added.classList.add('has-mascot');
                        added.insertBefore(art, added.firstChild);
                        enter(art);
                        if (plays) root.setTimeout(() => playSheet(art, 'duoHighFive'), 160);
                    } else if (success && companionMode === 'lively' && (wanted === 'wave' || wanted === 'jump')) {
                        const art = image(wanted === 'wave' ? ASSETS.kritiWave : stillImage('kritiJump'), 'pk-toast-art', 36);
                        added.classList.add('has-mascot');
                        added.insertBefore(art, added.firstChild);
                        enter(art);
                        if (wanted === 'jump') root.setTimeout(() => playSheet(art, 'kritiJump'), 160);
                    } else if (success && companionMode === 'lively') {
                        const art = image(ASSETS.kritiThumbsUp, 'pk-toast-art', 36);
                        added.classList.add('has-mascot');
                        added.insertBefore(art, added.firstChild);
                        enter(art);
                        root.setTimeout(() => spring(art, 'scale', SPRINGS.stamp, 0, { from: -0.12 }), 220);
                    } else if (success) {
                        added.classList.add('has-mascot');
                        added.insertBefore(root.FilterTubeDoodles?.check?.({ className: 'pk-toast-check', delay: 220 }) || el('span', 'pk-toast-check'), added.firstChild);
                    } else if (wanted === 'shrug' && showsCharacters(companionMode)) {
                        // Nothing to bring in, a filter that wasn't added: Uljhan shrugs.
                        added.classList.add('has-mascot');
                        const art = image(ASSETS.uljhanShrug, 'pk-toast-art', 36);
                        added.insertBefore(art, added.firstChild);
                        enter(art);
                    } else if (error && showsCharacters(companionMode)) {
                        // Something went wrong: Uljhan is knotted up.
                        added.classList.add('has-mascot');
                        const art = image(ASSETS.uljhanKnotted, 'pk-toast-art', 36);
                        added.insertBefore(art, added.firstChild);
                        enter(art);
                    }
                }
            }
        }).observe(doc.body, { childList: true });
    }

    /** Uljhan on a slim strip when the connection drops, crawls or comes back. Filters never need it. */
    function mountNetwork(doc) {
        const host = doc.querySelector('.main-content') || doc.getElementById('popupRoot');
        if (!host || !root.navigator) return;
        const strip = el('div', 'pk-net');
        strip.setAttribute('role', 'status');
        strip.setAttribute('aria-live', 'polite');
        strip.hidden = true;
        const art = el('span', 'pk-net__art');
        const title = el('strong', 'pk-net__title');
        const body = el('span', 'pk-net__body');
        strip.append(art, title, body);
        const anchor = doc.getElementById('viewContainer');
        if (anchor && anchor.parentElement === host) host.insertBefore(strip, anchor);
        else host.insertBefore(strip, host.firstChild);
        let state = 'ok';
        let hideTimer = 0;
        const read = () => {
            const connection = root.navigator.connection || {};
            return { online: root.navigator.onLine !== false, effectiveType: connection.effectiveType || '', saveData: connection.saveData === true };
        };
        const draw = () => {
            root.clearTimeout(hideTimer);
            // The popup builds its shell late: keep the strip under the hidden counter, inside the frame.
            const tally = doc.getElementById('ftMascotTallyPopup');
            if (tally && strip.previousElementSibling !== tally) tally.insertAdjacentElement('afterend', strip);
            strip.dataset.state = state;
            if (state === 'ok') {
                strip.hidden = true;
                return;
            }
            title.textContent = t(NETWORK_COPY[state]);
            body.textContent = state === 'offline' ? t(NETWORK_COPY.offlineBody) : '';
            body.hidden = !body.textContent;
            art.replaceChildren();
            if (showsCharacters(companionMode)) {
                // Offline: Uljhan tangles himself in his string once and sits there (ULJHAN_TANGLE). Back
                // online: Kriti kneels and unwinds him, he hops free (DUO_UNTANGLE). Reduced motion: the
                // stills. The popup plays the short form (400 ms).
                const current = state;
                const sheet = current === 'offline' ? 'uljhanTangle' : current === 'restored' ? 'duoUntangle' : '';
                const plays = !!sheet && !prefersReducedMotion();
                const picture = image(plays ? sheetAssets(sheet)[0] : stillImage(NETWORK_ART[current]), 'pk-net__image', 40);
                art.appendChild(picture);
                enter(picture);
                const popup = !!doc.getElementById('popupRoot');
                const rest = () => { if (current === 'offline') idleLife(picture); };
                if (plays) root.setTimeout(() => playSheet(picture, sheet, { popup, onDone: rest }), 240);
                else rest();
            }
            art.hidden = !showsCharacters(companionMode);
            strip.hidden = false;
            if (state === 'restored') {
                hideTimer = root.setTimeout(() => { state = networkState('ok', read()); draw(); }, RESTORED_MS);
            }
        };
        const update = () => {
            const next = networkState(state, read());
            if (next === state) return;
            state = next;
            draw();
        };
        root.addEventListener?.('online', update);
        root.addEventListener?.('offline', update);
        root.navigator.connection?.addEventListener?.('change', update);
        onModeChange(draw);
        onLocaleChange(draw);
        update();
    }

    /** Kriti peeks beside "No keywords blocked" in the popup (48 px; the popup's lists are small). */
    function watchPopupEmptyLists(doc) {
        const rootNode = doc.getElementById('popupRoot');
        if (!rootNode) return;
        const scan = () => {
            for (const node of rootNode.querySelectorAll('.empty-state')) {
                const kind = emptyListKind(node);
                const existing = node.querySelector('.pk-popup-peek');
                if (!showsCharacters(companionMode) || (kind !== 'keywords' && kind !== 'channels')) {
                    existing?.remove();
                    node.classList.remove('has-mascot');
                    continue;
                }
                if (existing) continue;
                if (!node.querySelector('.ft-mascot-empty__label')) {
                    const label = el('span', 'ft-mascot-empty__label', node.textContent);
                    if (node.__ftRendererCopy) {
                        label.__ftRendererCopy = node.__ftRendererCopy;
                        delete node.__ftRendererCopy;
                    }
                    node.replaceChildren(label);
                }
                node.classList.add('has-mascot');
                // An empty list in the popup: Uljhan peeks from behind the card (the owner's 2026-11-18 pose).
                const peek = image(ASSETS.uljhanPeek, 'pk-popup-peek', 48);
                node.insertBefore(peek, node.firstChild);
                idleLife(peek);
            }
        };
        scan();
        if (typeof root.MutationObserver === 'function') {
            let queued = false;
            new root.MutationObserver(() => {
                if (queued) return;
                queued = true;
                root.setTimeout(() => { queued = false; scan(); }, 0);
            }).observe(rootNode, { childList: true, subtree: true });
        }
        onModeChange(scan);
    }

    // ---- Sounds -----------------------------------------------------------------------------------

    let soundMode = 'off';
    const soundCache = new Map();

    function normalizeSoundMode(value) {
        const mode = typeof value === 'string' ? value.trim().toLowerCase() : '';
        return SOUND_MODES.includes(mode) ? mode : 'off';
    }

    /** Whether a sound plays in a mode: Off never, Gentle the big moments only, Playful all. Pure. */
    function soundAllowed(mode, name) {
        const normalized = normalizeSoundMode(mode);
        if (normalized === 'off' || !Object.prototype.hasOwnProperty.call(SOUND_FILES, name)) return false;
        return normalized === 'playful' || GENTLE_SOUNDS.includes(name);
    }

    const soundLog = [];

    /** The app's sound gates (UiSound): 400 ms between any two, 1.5 s for the same cue, six a minute. Pure. */
    function soundGateOpen(log, name, now) {
        const recent = (Array.isArray(log) ? log : []).filter(entry => now - entry.at < SOUND_RATE_WINDOW_MS);
        if (recent.length >= SOUND_RATE_CAP) return false;
        const last = recent[recent.length - 1];
        if (last && now - last.at < SOUND_GAP_MS) return false;
        return !recent.some(entry => entry.name === name && now - entry.at < SOUND_SAME_CUE_COOLDOWN_MS);
    }

    function playSound(name) {
        if (!soundAllowed(soundMode, name)) return false;
        if (root.document?.visibilityState === 'hidden' || typeof root.Audio !== 'function') return false;
        // Never over a playing video on the page (the app's "no sound while media plays").
        if ([...(root.document?.querySelectorAll?.('video') || [])].some(video => !video.paused && !video.muted)) return false;
        const now = Date.now();
        if (!soundGateOpen(soundLog, name, now)) return false;
        soundLog.push({ name, at: now });
        while (soundLog.length > SOUND_RATE_CAP) soundLog.shift();
        try {
            let audio = soundCache.get(name);
            if (!audio) {
                const path = `assets/sounds/${SOUND_FILES[name]}`;
                const url = api()?.runtime?.getURL ? api().runtime.getURL(path) : `../${path}`;
                audio = new root.Audio(url);
                audio.volume = 0.45;
                soundCache.set(name, audio);
            }
            audio.currentTime = 0;
            const played = audio.play();
            played?.catch?.(() => {});
            return true;
        } catch (_) {
            return false;
        }
    }

    async function loadSoundMode() {
        const stored = await storageGet([SOUNDS_KEY]);
        soundMode = normalizeSoundMode(stored[SOUNDS_KEY]);
        return soundMode;
    }

    function mountSoundSetting(doc) {
        const select = doc.getElementById('ftUiSounds');
        if (!select) return;
        loadSoundMode().then(mode => { select.value = mode; });
        select.addEventListener('change', async () => {
            soundMode = normalizeSoundMode(select.value);
            await storageSet({ [SOUNDS_KEY]: soundMode });
            // The preview the app plays: the stamp on Gentle, the soft pop on Playful.
            playSound(soundMode === 'gentle' ? 'stamp' : 'pop');
        });
    }

    function mountCompanionSetting(doc) {
        const select = doc.getElementById('ftCompanionMode');
        if (!select) return;
        select.value = companionMode;
        select.addEventListener('change', () => { setMode(select.value); });
        onModeChange(mode => { if (select.value !== mode) select.value = mode; });
    }


    // ---- First filter and the hub peek (the app's FirstFilterMoment) -----------------------------
    // Once per profile, the first rule gets Kriti and Uljhan sieving above the list with "That one's
    // sieved out now." (the allowed-only form when it went on the allowed list): the bubble at 300 ms,
    // the giggle chime on frame 5, the last frame held 600 ms; a still for 2 s on Quiet or with reduced
    // motion. With no rules at all, Kriti peeks over the hub's tiles at most once a day per profile and
    // offers "Add a first filter".
    const MOMENTS_KEY = 'ftMotionMomentsV1';
    const FIRST_COPY = Object.freeze({
        firstFilter: ['filters.firstFilter.bubble', 'That one\'s sieved out now.'],
        allowedOnly: ['filters.allowedOnly.bubble', 'Only your allowed list gets through now.'],
        emptySieve: ['controls.emptySieve.bubble', 'Nothing in the sieve yet. Add a first filter.'],
        emptySieveAction: ['controls.emptySieve.action', 'Add a first filter']
    });
    const FIRST_FILTER_HOLD_MS = 600;
    const FIRST_FILTER_STILL_MS = 2000;

    function localDay(date = new Date()) {
        const pad = value => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    async function takeMoment(key, value) {
        const stored = (await storageGet([MOMENTS_KEY]))[MOMENTS_KEY];
        const moments = stored && typeof stored === 'object' ? stored : {};
        if (value === undefined ? moments[key] : moments[key] === value) return false;
        await storageSet({ [MOMENTS_KEY]: { ...moments, [key]: value === undefined ? Date.now() : value } });
        return true;
    }

    async function firstFilterMoment({ profileId = 'default', anchor = null, allowed = false } = {}) {
        if (!root.document || !showsCharacters(companionMode) || !anchor?.parentNode) return false;
        if (!(await takeMoment(`first_filter:${profileId}`))) return false;
        if (!anchor.parentNode) return false;
        const character = createCharacter({ className: 'ft-mascot--first-filter', imageName: stillImage('duoSieve'), height: 96, kind: 'event', tail: 'left' });
        const holder = el('div', 'pk-first-filter');
        holder.appendChild(character.root);
        anchor.parentNode.insertBefore(holder, anchor);
        const line = t(allowed ? FIRST_COPY.allowedOnly : FIRST_COPY.firstFilter);
        root.setTimeout(() => character.say(line, { event: true }), 300);
        announce(holder, line);
        const close = () => {
            holder.classList.add('is-leaving');
            root.setTimeout(() => holder.remove(), prefersReducedMotion() ? 0 : 300);
        };
        if (companionMode === 'lively' && !prefersReducedMotion()) {
            enter(character.picture);
            playSheet(character.picture, 'duoSieve', { onDone: () => root.setTimeout(close, FIRST_FILTER_HOLD_MS) });
            root.setTimeout(() => playSound('giggle'), 4 * sheetFrameMs('duoSieve'));
        } else {
            root.setTimeout(close, FIRST_FILTER_STILL_MS);
        }
        return true;
    }

    function ruleCount(state) {
        const size = value => (Array.isArray(value) ? value.length : 0);
        const kids = state?.kids || {};
        return size(state?.userKeywords) + size(state?.channels) + size(state?.userWhitelistKeywords) + size(state?.whitelistChannels)
            + size(kids.blockedKeywords) + size(kids.blockedChannels) + size(kids.whitelistKeywords) + size(kids.whitelistChannels);
    }

    function mountHubPeek(doc) {
        let peek = null;
        let subscribed = false;
        let tries = 0;
        const manager = () => (typeof StateManager !== 'undefined' ? StateManager : null);
        const later = ms => root.setTimeout(() => { draw().catch(() => {}); }, ms);
        const draw = async () => {
            const sm = manager();
            if (sm?.subscribe && !subscribed) {
                subscribed = true;
                sm.subscribe(eventType => { if (/Added|Removed|^load$/.test(eventType)) later(0); });
            }
            const grid = doc.querySelector('#dashboardView .pk-hub__grid');
            const state = sm?.getState?.();
            if (!grid || !state?.isLoaded) {
                if (tries++ < 12) later(800);
                return;
            }
            if (ruleCount(state) > 0 || !showsCharacters(companionMode)) { peek?.remove(); peek = null; return; }
            if (peek?.isConnected) return;
            const profileId = state.activeProfileId || 'default';
            if (!(await takeMoment(`hub_peek:${profileId}`, localDay()))) return;
            if (peek?.isConnected) return;
            // Android FirstFilterMoment.buildHubPeek: Kriti with the logo sieve (KRITI_LOGO_SIEVE), 96 px;
            // Lively gives her a bubble, Quiet a plain brick action beside her; tapping her adds a first filter.
            peek = el('div', 'pk-hub-peek');
            const openFilters = () => doc.querySelector('.nav-item[data-tab="filters"]:not(.nav-item--sub)')?.click();
            const art = image(ASSETS.kritiAllow, 'pk-hub-peek__art', 96);
            art.setAttribute('role', 'button');
            art.setAttribute('tabindex', '0');
            art.setAttribute('aria-label', t(FIRST_COPY.emptySieveAction));
            art.addEventListener('click', openFilters);
            art.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openFilters(); } });
            peek.appendChild(art);
            if (companionMode === 'lively') {
                const words = el('button', 'pk-hub-peek__line', t(FIRST_COPY.emptySieve));
                words.type = 'button';
                words.addEventListener('click', openFilters);
                peek.appendChild(words);
            } else {
                const action = el('button', 'pk-hub-peek__action', t(FIRST_COPY.emptySieveAction));
                action.type = 'button';
                action.addEventListener('click', openFilters);
                peek.appendChild(action);
            }
            grid.parentNode.insertBefore(peek, grid);
            if (companionMode === 'lively' && !prefersReducedMotion() && art.animate) {
                root.setTimeout(() => art.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-10px)' }, { transform: 'translateY(0)' }],
                    { duration: 900, easing: 'cubic-bezier(0.2, 0, 0, 1)' }), 200);
            }
        };
        later(600);
        onModeChange(() => later(0));
    }

    /**
     * Time saved: at 1, 10 and 100 hours Kriti holds up her medal and Uljhan cheers (duo_milestone_medal) on
     * the Home "Time saved" card, once each, Lively only. Reduced motion shows the last frame.
     */
    function mountTimeMilestones(doc) {
        const card = doc.querySelector('.stat-card[data-stat="saved"]');
        const value = doc.getElementById('statSavedTime');
        if (!card || !value) return;
        let busy = false;
        const check = async () => {
            if (busy) return;
            busy = true;
            try {
                const stored = await storageGet(['stats', 'statsBySurface', TIME_MILESTONES_KEY]);
                const verdict = evaluateTimeMilestone(totalSavedSeconds(stored), stored[TIME_MILESTONES_KEY], companionMode);
                if (verdict.changed) await storageSet({ [TIME_MILESTONES_KEY]: verdict.seen });
                if (!verdict.celebrate || !card.isConnected) return;
                card.querySelector(':scope > .pk-medal')?.remove();
                const plays = !prefersReducedMotion();
                const character = createCharacter({ className: 'ft-mascot--medal', imageName: plays ? ASSETS.duoMedal[0] : stillImage('duoMedal'), height: 72, kind: 'event', tail: 'up' });
                const holder = el('div', 'pk-medal');
                holder.appendChild(character.root);
                card.appendChild(holder);
                const line = timeMilestoneLine(verdict.celebrate);
                character.say(line, { event: true });
                announce(holder, line);
                enter(character.picture);
                if (plays) {
                    root.setTimeout(() => playSheet(character.picture, 'duoMedal', { onDone: () => idleLife(character.picture) }), 240);
                    root.setTimeout(() => playSound('celebrate'), 240 + 2 * sheetFrameMs('duoMedal'));
                }
            } finally {
                busy = false;
            }
        };
        let queued = 0;
        if (typeof root.MutationObserver === 'function') {
            new root.MutationObserver(() => { root.clearTimeout(queued); queued = root.setTimeout(check, 600); })
                .observe(value, { childList: true, characterData: true, subtree: true });
        }
        root.setTimeout(check, 800);
    }

    /** About: the owner's v3 sieve cycles on "Kriti and Uljhan" (Android About card); Companion Off keeps the picture. */
    function mountAboutLoop(doc) {
        const host = doc.querySelector('#aboutView .ft-about-duo__art');
        const picture = host?.querySelector('.ft-about-duo__picture');
        if (!host || !picture) return;
        const loop = mountLoop(host, 'duoSieveLoop', { height: 196, className: 'ft-about-duo__loop' });
        const sync = () => { picture.hidden = !!loop && showsCharacters(companionMode); };
        sync();
        onModeChange(sync);
    }

    function mountOptions(doc) {
        mountCompanionSetting(doc);
        mountSoundSetting(doc);
        mountWelcome(doc);
        mountHubPeek(doc);
        mountSidebar(doc);
        mountAbout(doc);
        mountSupport(doc);
        mountNetwork(doc);
        watchToasts(doc);
        mountTimeMilestones(doc);
        mountAboutLoop(doc);
        mountSessionSaved(doc);
        watchStudyStatus(doc);
        watchEmptyLists(doc);
        onModeChange(() => redrawEmptyLists());
        root.addEventListener?.('filtertube-ui-locale-changed', () => redrawEmptyLists());
    }

    // ---- Boot ------------------------------------------------------------------------------------

    // ---- The profile switch moment (Android ProfileSwitchMoment, 4ff67ce1b) ---------------------------
    /** Kriti's wave after a switch plays at most this often a day; other switches get the crayon check. */
    const SWITCH_KRITI_PER_DAY = 3;
    const SWITCH_KEY = 'ftProfileSwitchMomentV1';

    function switchKritiAllowed(storedDay, storedCount, today) {
        return (storedDay === today ? Number(storedCount) || 0 : 0) < SWITCH_KRITI_PER_DAY;
    }

    /** A Kids space on one side of the switch only: the page's tone crossfades. */
    function switchCrossesKids(fromKids, toKids) { return !!fromKids !== !!toKids; }

    /**
     * After a switch has landed (never over a PIN gate): "Switched to Aarav's space." with Kriti's wave,
     * at most three times a day (counted on this device), else with the crayon check.
     */
    function profileSwitched(name, showToast) {
        const today = new Date().toISOString().slice(0, 10);
        let stored = {};
        try { stored = JSON.parse(root.localStorage?.getItem(SWITCH_KEY) || '{}') || {}; } catch (e) { stored = {}; }
        const wave = switchKritiAllowed(stored.day, stored.count, today);
        if (wave) {
            try { root.localStorage?.setItem(SWITCH_KEY, JSON.stringify({ day: today, count: (stored.day === today ? Number(stored.count) || 0 : 0) + 1 })); } catch (e) { }
        }
        const words = t(['people.profileSwitched', 'Switched to {name}\u2019s space.'], { name });
        showToast?.(words, 'success');
        const toast = root.document?.querySelector?.('.ft-toast');
        if (toast) toast.dataset.ftMascot = wave ? 'wave' : 'check';
        return wave;
    }

    root.FilterTubeMascots = Object.freeze({
        COMPANION_KEY, MILESTONES_KEY, WELCOME_KEY, MODES, DEFAULT_MODE, MILESTONES,
        SIEVE_FRAME_MS, SIEVE_LOOPS, BUBBLE_MAX_CHARS, COPY, ASSETS,
        SOUNDS_KEY, SOUND_MODES, SOUND_FILES, MOMENTS,
        SHEET_FRAME_MS, SHEET_STILL, MOTIONS, SPRINGS, IDLE, IDLE_BEATS, LOADING_WEIGHTS, LOADING_REVEAL_MS, LOOP_CAP_MS,
        REPLAY_REST_MS, GENTLE_SOUNDS, SOUND_GAP_MS, SOUND_SAME_CUE_COOLDOWN_MS, SOUND_RATE_CAP,
        LOADING_LINES, NETWORK_COPY, DUO_COPY, SESSION_SAVED,
        SUPPORT_HISTORY_KEY, SUPPORT_REMEMBERED, SUPPORT_VARIANTS, SUPPORT_COPY,
        LOADING_SCENES, SUPPORT_MOTIONS, loadingScene, popupTallyPose, emptyListPose, sheetAssets, mountLoop,
        sheetFrames, sheetFrameMs, springSamples, idleBeatsFor, idleDelay, pickIdleBeat, pickLoadingMoment, soundGateOpen,
        idleLife, spring, playSheet, idleWakeDue, idleWake, IDLE_WAKE_EVENTS, IDLE_WAKE_THROTTLE_MS,
        stillImage, pickLoadingLine, networkState, pickSupportVariant, rememberSupportVariant,
        normalizeMode, linePresentation, showsCharacters, evaluateMilestone, totalHidden, sieveFrames,
        allowListSwitchedOn, clampLine, loadMode, setMode,
        normalizeSoundMode, soundAllowed, playSound, loadSoundMode, moment,
        get mode() { return companionMode; },
        emptyListKind, decorateEmptyList, celebrateImport, mountPopup, firstFilterMoment, ruleCount,
        NETWORK_ART, LOCKED_SIGN, popupSheet, signLines, fitSignSize, signTime, lockedSign, lockedToast,
        backupSavedDue, backupSaved, searchEmptyPlays,
        POSES, TIME_MILESTONES_HOURS, sheetHoldMs, sweepAfterRemoval, totalSavedSeconds, evaluateTimeMilestone, timeMilestoneLine,
        SWITCH_KRITI_PER_DAY, switchKritiAllowed, switchCrossesKids, profileSwitched
    });

    function autoMount() {
        const doc = root.document;
        if (!doc?.getElementById) return;
        api()?.storage?.onChanged?.addListener?.((changes, area) => {
            if ((!area || area === 'local') && changes[COMPANION_KEY]) applyMode(changes[COMPANION_KEY].newValue);
            if ((!area || area === 'local') && changes[SOUNDS_KEY]) soundMode = normalizeSoundMode(changes[SOUNDS_KEY].newValue);
        });
        loadSoundMode();
        loadMode().then(() => {
            if (doc.getElementById('viewContainer')) mountOptions(doc);
        });
        if (doc.getElementById('popupRoot')) {
            loadMode().then(() => {
                mountNetwork(doc);
                watchPopupEmptyLists(doc);
            });
            const tryPopup = () => mountPopup(doc);
            if (!tryPopup() && typeof root.MutationObserver === 'function') {
                const watcher = new root.MutationObserver(() => { if (tryPopup()) watcher.disconnect(); });
                watcher.observe(doc.getElementById('popupRoot'), { childList: true, subtree: true });
            }
        }
    }
    if (root.document) {
        if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', autoMount, { once: true });
        else autoMount();
    }
})(typeof window !== 'undefined' ? window : globalThis);
