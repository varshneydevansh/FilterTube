# Android → extension port ledger

Generated from `PORT_LEDGER.tsv` by `node tools/parity/ledger.mjs render`. Edit the TSV, never this file.
Rules: [HOW_TO_PORT.md](HOW_TO_PORT.md). Sync point: Android `ec9d91080` (Release Android 3.6.1), in the app repository.

**189 rows:** 78 ported, 23 partial, 0 todo, 88 n/a. **77.2%** of 101 applicable rows ported (88.6% counting partial as half).

| Area | ported | partial | todo | n/a | share |
|---|---|---|---|---|---|
| brand-visual | 30 | 2 | 0 | 9 | 96.9% |
| home-viewer | 1 | 0 | 0 | 15 | 100.0% |
| watch | 0 | 0 | 0 | 1 | - |
| study | 24 | 15 | 0 | 7 | 80.8% |
| kids | 0 | 0 | 0 | 3 | - |
| profiles-family | 5 | 4 | 0 | 2 | 77.8% |
| settings-controls | 8 | 0 | 0 | 3 | 100.0% |
| search | 0 | 0 | 0 | 2 | - |
| music | 0 | 0 | 0 | 5 | - |
| nearby-sync | 2 | 1 | 0 | 2 | 83.3% |
| support | 1 | 1 | 0 | 0 | 75.0% |
| strings | 3 | 0 | 0 | 13 | 100.0% |
| tablet-tv | 0 | 0 | 0 | 15 | - |
| infra | 0 | 0 | 0 | 6 | - |
| release | 4 | 0 | 0 | 0 | 100.0% |
| docs-test | 0 | 0 | 0 | 5 | - |

## brand-visual

| Android | Date | Subject | Status | Extension | Reason / note |
|---|---|---|---|---|---|
| `173e12bfb` | 2026-11-15 | fix(android): mascots never clipped mid-motion (MascotStage) | partial | `c5c99ef9` | not traced: no clipping seen in the pass 3-5 captures, but MascotStage's padding rule is not ported as such |
| `4ff67ce1b` | 2026-11-15 | feat(android): P2 gates, people and settings motion | partial | `c5c99ef9` | gates, people and settings motion: not traced item by item |
| `3ec1de790` | 2026-11-15 | feat(mascots): idle life on the Study hero, end seal and support sheet; fix the update-check test after the merge | ported | `c5c99ef9`, `e579ae1d` | idle life on the study card, the end seal and the support sheet |
| `f16a0eda4` | 2026-11-15 | feat(android): FilterTube's own crayon icon set (IconKit) | ported | `3e3721c1` | crayon icons exported from the app's vector drawables (scripts/export-crayon-icons.mjs) |
| `8c86d7e04` | 2026-11-15 | fix(android-mascot): loop beats only on the loop's own art | ported | `c5c99ef9` | each sheet plays its own frames at its own timing (mascots.js MOTIONS) |
| `0075d451a` | 2026-11-15 | feat(android-ui): move Study, Support, Profiles, Settings and Nearby onto PaperKit | ported | `f4111820`, `cd62c292` | PaperKit on Study, Support, Profiles, Settings and Sync |
| `cff29654f` | 2026-11-15 | feat(android-mascot): give settled mascots a gentle idle life | ported | `c5c99ef9` | gentle idle life for settled mascots |
| `6f7425410` | 2026-11-15 | feat(android): apply doodles to avatars, Study, TV capability card and paper toast | ported | `812c11ad`, `f4111820`, `6656f8e4` | doodles on avatars, Study and the toast; the TV card is Android-only |
| `bc57eaafd` | 2026-11-15 | feat(android): doodle library with typed catalogue, placement and motions | ported | `3e3721c1`, `f4111820` | doodle library (js/doodles.js) |
| `fa1d74cd5` | 2026-11-15 | feat(android-ui): PaperKit, one paper-and-crayon component kit (Wave 1A) | ported | `f4111820` | PaperKit look (css/paperkit.css) |
| `7cdaeeb9a` | 2026-11-15 | fix(mascots): remove light halos on cut-out edges so mascots sit cleanly on dark and coloured surfaces | ported | `3e3721c1` | mascot frames byte-identical to Android's |
| `184da9e82` | 2026-11-15 | fix(mascots): clear white background gaps between legs and arms so mascots sit cleanly on any colour or dark mode | ported | `3e3721c1` | mascot frames byte-identical to Android's |
| `8f36623fe` | 2026-11-15 | feat(android): sounds, wider duet slot and QA previews for the Wave 2A sheets | ported | `c5c99ef9`, `04561b52` | sounds on the welcome and support sheets |
| `c9b0173b0` | 2026-11-15 | feat(android): split loading moments and lines by Study, General and Kids | ported | `c5c99ef9` | loading moments and lines by Study, General and Kids (mascots.js LoadingPersonality) |
| `ba274f145` | 2026-11-15 | feat(android-motion): one shared network chip for every viewer page | ported | `b2551b5d` | one network strip (offline, slow, back online) on the options page and popup |
| `9f10f06c3` | 2026-11-15 | feat(android): Kriti and Uljhan on the first-install and support sheets | ported | `04561b52`, `f4111820` | Kriti and Uljhan on the welcome and support sheets |
| `648a59238` | 2026-11-15 | feat(android): paper-and-crayon sound pack with a per-profile Sounds setting | ported | `3e3721c1`, `c5c99ef9` | 13 sounds byte-identical; per-profile Sounds setting |
| `cd4c8f191` | 2026-11-15 | feat(android): cast is Kriti and Uljhan only; wire the "Shoo, Uljhan!" duet | ported | `56e71e9b`, `b2551b5d` | only Kriti and Uljhan; the "Shoo, Uljhan!" duet on the blocked card |
| `54dd66dc1` | 2026-11-15 | feat(mascots): peek, blank-sign and salute poses for staging on card edges | ported | `3e3721c1`, `c5c99ef9` | frames byte-identical to Android drawable-nodpi study_* (3e3721c1); sheet timing from StudyMascotView.Motion (c5c99ef9) |
| `fefea8185` | 2026-11-15 | feat(mascots): Kriti good-evening motion; register mug and pencil frames on her hair | ported | `3e3721c1`, `c5c99ef9` | frames byte-identical to Android drawable-nodpi study_* (3e3721c1); sheet timing from StudyMascotView.Motion (c5c99ef9) |
| `78beebd65` | 2026-11-15 | feat(mascots): Kriti break-time mug motion | ported | `3e3721c1`, `c5c99ef9` | frames byte-identical to Android drawable-nodpi study_* (3e3721c1); sheet timing from StudyMascotView.Motion (c5c99ef9) |
| `5e999e841` | 2026-11-15 | feat(mascots): "Shoo, Uljhan!" duet motion for blocked distractions | ported | `3e3721c1`, `c5c99ef9` | frames byte-identical to Android drawable-nodpi study_* (3e3721c1); sheet timing from StudyMascotView.Motion (c5c99ef9) |
| `91434b907` | 2026-11-15 | feat(android): give loading moments personality | ported | `c5c99ef9` | loading moments with personality |
| `5b5a890f0` | 2026-11-15 | feat(mascots): Kriti pencil-tap and open-notebook motions; clear white halos between legs | ported | `3e3721c1`, `c5c99ef9` | frames byte-identical to Android drawable-nodpi study_* (3e3721c1); sheet timing from StudyMascotView.Motion (c5c99ef9) |
| `c0c0d79a6` | 2026-11-15 | feat(android): Wave 0 motion foundation, brand palette, UI sounds and doodle kit | ported | `f4111820`, `3e3721c1` | brand palette, UI sounds and doodle kit |
| `43cfac211` | 2026-11-15 | docs(study): Study v3 plan from the design council; bundle Delius (OFL) for study numerals and titles | ported | `4f0d02e6` | Delius bundled (assets/fonts/delius.ttf) |
| `4a6877824` | 2026-11-15 | feat(android): mascots in loading, refresh, offline, error, blocked and success moments | ported | `c5c99ef9`, `084bca0e` | mascots in loading, offline, error, blocked and success moments |
| `b175a111f` | 2026-11-15 | feat(android): Kriti and friends in empty lists, Study and focus, and a Companion setting | ported | `084bca0e` | companions in empty lists and the Companion setting |
| `2ca0c3bf5` | 2026-11-15 | feat(android-study): FilterTube logo poses, a loading loop and the Kriti-Uljhan sieve story | ported | `3e3721c1`, `c5c99ef9` | frames byte-identical to Android drawable-nodpi study_* (3e3721c1); sheet timing from StudyMascotView.Motion (c5c99ef9) |
| `7566751e2` | 2026-11-15 | feat(android-study): animated Kriti and Uljhan for FilterTube | ported | `3e3721c1`, `c5c99ef9` | frames byte-identical to Android drawable-nodpi study_* (3e3721c1); sheet timing from StudyMascotView.Motion (c5c99ef9) |
| `6faa445b0` | 2026-11-16 | fix(android): restart mascot idle life on any screen interaction | ported | `e579ae1d` | idle life wakes on any pointer, wheel, scroll, key or touch (mascots.js) |
| `ff5c14cfc` | 2026-11-16 | feat(mascots): Uljhan fetch-more motion (hop, catch a play triangle, wave) | ported | `3e3721c1`, `c5c99ef9` | uljhan_fetch frames shipped; fetch timing 160 ms |
| `9d7724808` | 2026-11-15 | fix(paperkit): styleChip no longer crashes inside a MaterialButtonToggleGroup (local media sections); tint instead of replacing the shape | n/a |  | Android platform plumbing (MaterialButtonToggleGroup crash) |
| `aeae54264` | 2026-11-15 | fix(doodles): background scenery video no longer blocks crayon marks (Allowed rules circle, add underline) | n/a |  | Android platform plumbing (z-order of the scenery video under doodles) |
| `c5b1b289e` | 2026-11-15 | fix(android): set the dialog's entering state before its first frame | n/a |  | Android platform plumbing (dialog first frame) |
| `9dcce521e` | 2026-11-15 | feat(android): the launch story: Uljhan dives into Kriti's funnel and a play button drops out | n/a |  | the launch story; an extension has no launch screen |
| `ec2f28701` | 2026-11-15 | fix(android): the launch screen waits for Kriti's funnel story to finish (at most 1.2 s), then fades | n/a |  | the launch screen; an extension has none |
| `977440b08` | 2026-11-15 | feat(android): three Kriti app icons from the real art (waving, calm, cheering) | n/a |  | app icon; the extension's toolbar icon comes from its manifest |
| `60162579d` | 2026-11-15 | feat(android): Kriti app icon option and an animated launch screen | n/a |  | app icon; the extension's toolbar icon comes from its manifest; the animated launch screen has no extension counterpart |
| `29b28e6c3` | 2026-11-16 | feat(android): make the Duo mascot the default app icon | n/a |  | app icon; the extension's toolbar icon comes from its manifest |
| `8d38036fd` | 2026-11-16 | feat(android): Uljhan and duo app icons, a picker with previews, seasonal scaffold | n/a |  | app icon; the extension's toolbar icon comes from its manifest |

## home-viewer

| Android | Date | Subject | Status | Extension | Reason / note |
|---|---|---|---|---|---|
| `c35d33d70` | 2026-11-15 | feat(android-viewer): IconKit, doodles, Ask a parent and neutral terms in the viewer | ported | `a5d69dd9`, `3e3721c1`, `73f9e350` | the parts that apply: Ask a parent from a blocked video, crayon icons, neutral terms; the viewer itself is native |
| `927d0d4bc` | 2026-11-15 | feat(android-viewer): viewer v2, FilterTube's own calm look for the main viewer | n/a |  | the app's native viewer; the extension filters the site's own pages |
| `dbf7bb417` | 2026-11-15 | fix(android-motion): P4 SOFT_POP cue and focus ring radius on the search pill | n/a |  | the app's native viewer; the extension filters the site's own pages (search pill focus ring) |
| `fa9abbaf5` | 2026-11-15 | feat(android-motion): P3 viewer shell moments | n/a |  | the app's native viewer; the extension filters the site's own pages |
| `8346b520a` | 2026-11-16 | fix(android): keep the page and Uljhan's wait when Load more brings nothing new | n/a |  | the app's native viewer; the extension filters the site's own pages (load-more) |
| `802f80c1a` | 2026-11-16 | fix(android-viewer): Watch ambient glow reaches up under the status bar | n/a |  | the app's native viewer; the extension filters the site's own pages |
| `3252a4d23` | 2026-11-16 | fix(android-viewer): community tools tip only in the Main space, gone on any change | n/a |  | the app's native viewer; the extension filters the site's own pages (community tools tip) |
| `ac6471ca2` | 2026-11-16 | fix(android-viewer): sheet clears the gesture bar, phone notices keep an inset; before and after screens | n/a |  | the app's native viewer; the extension filters the site's own pages |
| `a472fbea5` | 2026-11-16 | feat(android-viewer): full-bleed phone posters, calm playlist page, PaperKit account sheet | n/a |  | the app's native viewer; the extension filters the site's own pages |
| `ddaedcdb7` | 2026-11-16 | fix(viewer): the slow-connection chip steps aside after 6 s even when a page section never stops loading | n/a |  | the 6 s cap is for a chip raised by a pending native page load; the extension's slow strip follows the browser's connection rating |
| `019bb5254` | 2026-11-16 | feat(android-viewer): card-less pull to refresh with the mascot on the page | n/a |  | the app's native viewer; the extension filters the site's own pages (pull to refresh) |
| `715bf3949` | 2026-11-16 | feat(android-viewer): Uljhan fetch is the favourite load-more, one moment per load | n/a |  | the app's native viewer; the extension filters the site's own pages (load-more) |
| `b47b54d12` | 2026-11-16 | feat(android-viewer): Uljhan load-more footer replaces the old continuation spinner | n/a |  | the app's native viewer; the extension filters the site's own pages (load-more footer) |
| `9925ebef5` | 2026-11-16 | fix(android-viewer): broad 16:9 posters on phone, no letterbox bars | n/a |  | the app's native viewer; the extension filters the site's own pages |
| `b57d15711` | 2026-11-16 | fix(android-viewer): viewer redesign leftovers | n/a |  | the app's native viewer; the extension filters the site's own pages |
| `0e626392a` | 2026-11-16 | fix(android-viewer): keep night colours after the first WebView load | n/a |  | Android platform plumbing (WebView night colours) |

## watch

| Android | Date | Subject | Status | Extension | Reason / note |
|---|---|---|---|---|---|
| `a523695fd` | 2026-11-15 | fix(android-watch): the pinned player no longer covers the rows at the top on phone | n/a |  | the app's own player |

## study

| Android | Date | Subject | Status | Extension | Reason / note |
|---|---|---|---|---|---|
| `678188f11` | 2026-11-15 | fix(android-study): stamp spring crash, Kriti fits per pose, break drain, sounds, preview safety | partial | `5a539088` | not traced: stamp spring, per-pose fit and break drain |
| `79a3d892c` | 2026-11-15 | feat(android-study): Study v3 home renders in place, colours the page by state, sage-led crayon ring | partial | `06b3bf31`, `5a953666` | ring and sage are in; colouring the page by state is not traced |
| `b753aa71f` | 2026-11-15 | fix(android-study): setup polish from the emulator critique | partial | `06b3bf31` | the extension's setup is a compact pack picker; the setup polish targets the app's step flow |
| `6c3f9f0d5` | 2026-11-15 | feat(android-study): in-session moments on paper — break sun, Skip break with Undo, gate card, Home strip | partial | `2964d665`, `5a539088` | break sun and the gate card on paper are in; Skip break with Undo and the Home strip are not traced |
| `3bbad1d03` | 2026-11-15 | feat(android-study): redesigned study setup on paper — what for, grouped exams, school, streams, grouped review, add a channel | partial | `06b3bf31` | the extension's setup is a compact pack picker: no what-for step, grouped exams, grouped review or add-a-channel sheet |
| `789f3fbf5` | 2026-11-15 | fix(android-study): one continuous Day Ring and a balanced home hero | partial | `06b3bf31` | the ring is in; the balanced hero is the app's layout |
| `88d53bc09` | 2026-11-15 | feat(android-study): paper Study home with the crayon Day Ring and the end seal | partial | `06b3bf31` | the ring is in; the end seal is not traced |
| `980a58b67` | 2026-11-15 | feat(android-study): free round and break lengths, channel avatars, Kriti and Uljhan | partial | `43bdfb37` | free round (5-240) and break (0-120) lengths are in; study channel avatars are not traced |
| `fcd8018b8` | 2026-11-15 | feat(android-study): study pages: the gate card, hidden counts, Up next, Kids feed, loosening sheets | partial | `7cbae66d`, `a4306a68` | gate card and tighten-only changes are in; hidden counts, Up next and loosening sheets are native pages |
| `2280f4ee3` | 2026-11-15 | fix(android-study): Self-Control expiry on the guarded clock, found on the emulator | partial | `43a28703` | clock guard is in; Self-Control expiry on the guarded clock is not traced |
| `910016a10` | 2026-11-15 | feat(android-study): P1 enforcement: local media, fail closed, silent-device notice | partial | `199cce4f` | fail closed is in; the silent-device notice is not traced; local media is Android-only |
| `9ed6a1e27` | 2026-11-15 | fix(android): Study review leftovers (skip chip, break Back, truthful lines) | partial | `06b3bf31`, `2964d665` | not traced: skip chip, break Back, truthful lines |
| `ee59f65b4` | 2026-11-15 | fix(android): Study and focus review fixes, large-text Controls grid | partial | `06b3bf31` | not traced; the large-text Controls grid is Android-only |
| `17ea3465f` | 2026-11-16 | feat(android-study): Kids learning by age keeps the Kids space Kids | partial | `5f476d8f` | Kids study time and the "Kids learning for this age shows in Kids" note are in; the Kids catalogue browse by age is the app's native Kids Home |
| `028e59c94` | 2026-11-16 | fix(android-study): study search finds lessons in the plan's own channels | partial | `ddf3ecb0`, `0a7e56ee` | "How search works while studying" is in, with its topics through topicLabel; the app's own search of plan channels can't exist on the site's search page |
| `17a81affe` | 2026-11-15 | fix(study-setup): keep acronyms upper case in topic chips (DBMS, GATE CSE) | ported | `0a7e56ee` | StudyTopicLabel as study_engine.js topicLabel, used by the search explainer; StudyTopicLabelTest ported |
| `8d8c9a270` | 2026-11-15 | feat(android-study): StudyPaper uses FilterTube's brand colours (cream, ink, brick, hero pastels) | ported | `f4111820`, `5a953666` | StudyPaper brand colours |
| `e8ab8e644` | 2026-11-15 | feat(android-study): StudyPaper, the shared paper-and-crayon foundation for the study redesign | ported | `f4111820` | paper-and-crayon foundation |
| `79f10fec8` | 2026-11-15 | feat(android-study): catalog v3 slice: school streams, global school packs, no cross-country school packs | ported | `4a8d88e1` | catalog v3 slice; packs-v1.json byte-identical |
| `ce156df15` | 2026-11-15 | fix(android-study): branches pick their channels and topics; breaks can be skipped | ported | `5f476d8f`, `2964d665`, `b3256609` | branch channels and topics, Skip break, and the merge keeps a parent's round and break lengths (StudyMergeTest case ported) |
| `e64d74490` | 2026-11-15 | fix(android-study): a merge keeps "Pack channels only", and a parent's choice under their plan | ported | `b3256609` | mergeStudy keeps a parent's packChannelsOnly under their plan, else the incoming value when set; StudyMergeTest case ported |
| `ccc767cab` | 2026-11-15 | fix(android-study): one decision for the study Home, the top-up and the Watch gate | ported | `7cbae66d`, `2ca24cd8` | one engine decides the feed and the Watch gate (study_engine.js) |
| `0ddbfedec` | 2026-11-15 | feat(android-study): P3 matching precision, study Home ranking, copy fixes | ported | `199cce4f`, `e6a935ff` | title-only pack words, synonyms, failing closed |
| `16113e01c` | 2026-11-15 | feat(android-study): P2 pages: tighten-only settings and sync, calm study states | ported | `a4306a68` | tighten-only settings and sync under a parent's plan |
| `5b6f8f6e7` | 2026-11-15 | feat(android-study): P0 enforcement: Watch gate, clock anchors, profile-switch guard | ported | `7cbae66d`, `43a28703`, `300205ac` | Watch gate, clock guard, profile-switch guard |
| `31080e0d5` | 2026-11-15 | feat(android): Study Family control screens for parents and children | ported | `06b3bf31` | parents' study plans on the options page |
| `114904612` | 2026-11-15 | feat(android): Study Family control rules, codes and signed messages | ported | `ee748d4a`, `d8af2824` | Family scopes and signed study messages |
| `35303c7df` | 2026-11-15 | feat(android): Study and focus phone UI | ported | `06b3bf31` | popup strip, options study card, planner |
| `361cfd06a` | 2026-11-15 | feat(android): Study engine with layered rules on the clock | ported | `44857de1`, `c22576dd`, `2ca24cd8` | study engine, layered rules, the clock |
| `57c1508d4` | 2026-11-15 | feat(android): bundle the v2 Study pack catalog with class packs | ported | `a86825b1` | v2 pack catalog with class packs |
| `37a494d80` | 2026-11-15 | feat(android): Study plan clock and the plan's daily limit | ported | `44857de1` | plan clock and daily limit |
| `6af9d0ab7` | 2026-11-15 | feat(android): bundled Study pack catalog and loader | ported | `6602f030` | bundled pack catalog and loader |
| `1fa4bc2b8` | 2026-11-15 | feat(android): Family scopes for study, focus_lock and schedule | ported | `ee748d4a` | Family scopes study, focus_lock and schedule |
| `d95c866c6` | 2026-11-15 | feat(android): Study merges like keywords and never copies a running lock | ported | `43bdfb37` | study merges like keywords; a running lock is never copied |
| `6973fdaa7` | 2026-11-15 | feat(android): Study model on each profile (study v1) and layered rules | ported | `79b831f1`, `1da48c8d` | study object per profile and layered rules |
| `52d52ce5e` | 2026-11-15 | docs: day planner is the main Study plan screen | ported | `d8af2824` | the live policy change in nanah_managed_live_policy.js |
| `ec84c6817` | 2026-11-16 | fix(android-study): keep other branches' lectures out of a chosen branch | ported | `5f476d8f` | other-branch titles drop out of a chosen branch (study_engine.js studyBranchFilter) |
| `0c08ba48b` | 2026-11-16 | feat(android-study): a light country accent on study setup | ported | `1d4a1011` | CountryAccent table, mark and 6 % wash in study_packs.js; the CrayonStripe and motif on the row that lists the country's packs; CountryAccentTest ported. The setup's step dots and squiggle have no extension counterpart (no step flow) |
| `bd6b6adb4` | 2026-11-16 | feat(android-study): study packs for more countries | ported | `a99f051b`, `5f476d8f` | data/study/packs-v1.json byte-identical to the Android asset (ledger.mjs shared) |
| `49a8ba846` | 2026-11-15 | fix(android-study): keep the planner's scroll only once it has been laid out | n/a |  | Android platform plumbing (planner scroll restore) |
| `c2fcb8b71` | 2026-11-15 | fix(android-study): no focus wash over the page (the slate dark mode); chip check sits with its words | n/a |  | Android platform plumbing (focus highlight over the native page) |
| `4a27d8595` | 2026-11-15 | fix(android-study): cream switch thumbs in dark setup | n/a |  | Android platform plumbing (Material switch tint) |
| `a31245c7e` | 2026-11-15 | fix(android-study): study Shorts spread over many channels | n/a |  | the app's native study Home feed |
| `7e5c030a8` | 2026-11-15 | feat(android-study): the WebView runtime follows the extension's study rules | n/a |  | Android adopting the extension's study runtime (2ca24cd8, c22576dd); the extension is the source |
| `c632312b3` | 2026-11-15 | feat(android-study): "N hidden until study ends" on the Downloads panel | n/a |  | downloads |
| `3f517954e` | 2026-11-15 | fix(android-study): a study Home of pack channels, never a blank page | n/a |  | the app's native study Home |

## kids

| Android | Date | Subject | Status | Extension | Reason / note |
|---|---|---|---|---|---|
| `af5605c62` | 2026-11-15 | feat(android-kids): warm "Set up Kids on this device" card | n/a |  | the app's native Kids provider setup card |
| `32313208b` | 2026-11-15 | feat(android-kids): Kids viewer parity with the Main viewer shell | n/a |  | the app's native Kids viewer |
| `b44b981a4` | 2026-11-15 | feat(android-study): Kids study Home cue and subject chips, switch back when study ends | n/a |  | the app's native Kids Home |

## profiles-family

| Android | Date | Subject | Status | Extension | Reason / note |
|---|---|---|---|---|---|
| `5b9b8d079` | 2026-11-15 | feat(android): Ask a parent opens the child's space as a parent-mode session | partial | `9effc66a` | a parent answers in the dashboard after a fresh PIN; no framed session in the child's space |
| `c95f2c6a8` | 2026-11-15 | feat(android): parent mode, a framed session inside a Kids profile | partial | `812c11ad` | parent session bar; the framed parent-mode session inside a Kids profile is not traced |
| `9af03736d` | 2026-11-16 | feat(android-family): finish parent mode: live sync badge, one exit, in-page wording, slim bar, gate hardening | partial | `812c11ad`, `6a9feba6` | parent session bar and the fresh-unlock gate are in; the live sync badge, one exit and in-page wording are not traced |
| `685cf9b23` | 2026-11-16 | fix(android): parent-mode bar polish from device shots, plus screenshots | partial | `812c11ad` | parent session bar exists; the polish from device shots is not compared side by side |
| `d5434b55b` | 2026-11-15 | feat(android-family): Ask a parent, child asks and parent answers | ported | `a5d69dd9`, `9effc66a` | Ask a parent: ask model and limits, signed filtertube.ask.v1, Requests, Allow once |
| `d800183ba` | 2026-11-15 | feat(android): doodle avatars for profiles | ported | `812c11ad` | the avatar field (doodle:<name>) survives every rewrite and draws the doodle |
| `f26f976ca` | 2026-11-15 | feat(android-ui): Settings creates profiles through ProfileCreateFlow; PaperKit polish | ported | `812c11ad` | profiles are created through the one create sheet (tab-view.js ProfileCreateSheet) |
| `92b4e95cb` | 2026-11-15 | feat(android-profiles): crayon avatars, role-clear picker and a gated create sheet | ported | `812c11ad` | crayon avatars, role words, gated create |
| `495ed51ee` | 2026-11-16 | fix(android-ask-parent): pick the ask from the typed block reason | ported | `a5d69dd9`, `9effc66a` | verified: the ask's blockedBy comes from the typed decision kind (dom_fallback.js), never page text; "Always allow this channel" only for a channel rule (shared/ask_parent.js channelAnswerable) |
| `25fad1d90` | 2026-11-15 | fix(android): PIN gate verifies off main and handles insets | n/a |  | Android platform plumbing (PIN checks off the main thread, insets) |
| `b2237068b` | 2026-11-15 | fix(android): verify PINs off the main thread | n/a |  | Android platform plumbing (PIN checks off the main thread) |

## settings-controls

| Android | Date | Subject | Status | Extension | Reason / note |
|---|---|---|---|---|---|
| `d00381a36` | 2026-11-15 | feat(android-controls): Controls v2 on paper (hub, filters, channel sheet, content groups) | ported | `cd62c292`, `c57418ae`, `be37c650` | Controls on paper, keyword and channel rows in the app's layout |
| `993471e15` | 2026-11-15 | feat(android-privacy): carry out the network audit's owner decisions | ported | `77bdd2b8` | the part that applies: relay consent (InternetSyncRelayConsent); updates, cookie policy and off-platform links are Android-only |
| `076bd6efa` | 2026-11-15 | fix(android-motion): P1 polish from the emulator pass | ported | `95652e4e`, `9944ced3` | undo bar, row wash and first-filter moment |
| `eddef5258` | 2026-11-15 | feat(android-motion): P1 Filters and Controls moments | ported | `95652e4e`, `9944ced3`, `db0a0677` | undo after removal, wash on a new row, first-filter moment, rolling numbers |
| `93cf50d53` | 2026-11-15 | fix(android): translated filter-button label and merged-tile tests | ported | `db2aa87f` | the button's label is the translated "More options" in all 38 catalogs; the merged-tile test half is the app's account tile (n/a) |
| `a5efd779d` | 2026-11-15 | feat(android): one search row with a date and sort sheet on Keywords and Channels | ported | `db2aa87f` | verified against NativeMainRuleFilterSheet: 56 px button, 18 px corners, 22 px brand icon, 8 px gap, brick-soft while narrowed; date and sort move into a panel (the options page's stand-in for the bottom sheet), Main and Kids |
| `c6f69ca2b` | 2026-11-15 | fix(android): drop the repeated Filters hero text | ported | `4f0d02e6` | no repeated hero copy |
| `99aa992a4` | 2026-11-15 | fix(android): brand palette for Controls buttons, toggles and search | ported | `cd62c292` | brand palette for buttons, toggles and search |
| `63f195a2a` | 2026-11-15 | feat(android-privacy): switch and disclosure for the HD decoder | n/a |  | the app's own HD decoder |
| `77eb12252` | 2026-11-15 | fix(android-privacy): send account cookies only to platform hosts | n/a |  | Android platform plumbing (account cookies in the native viewer) |
| `5dcb77603` | 2026-11-15 | feat(android): merge the Accounts tile into Accounts & Sync | n/a |  | the app's account tile; the extension has no account sign-in |

## search

| Android | Date | Subject | Status | Extension | Reason / note |
|---|---|---|---|---|---|
| `b21f5841d` | 2026-11-15 | feat(android-motion): animate the search clear button (P3 3.7) | n/a |  | the app's native viewer; the extension filters the site's own pages (search clear button) |
| `5c11cc103` | 2026-11-16 | feat(android): allowed-only search also searches the allowed channels | n/a |  | the site owns search results; the extension can filter them but not add allowed channels' videos |

## music

| Android | Date | Subject | Status | Extension | Reason / note |
|---|---|---|---|---|---|
| `60e7fd4c2` | 2026-11-15 | fix(android-study): keep Music queue tracks as music and skip refused ones | n/a |  | Sangeet, the app's music space (no music player in a browser extension) |
| `7b4ca2b15` | 2026-11-15 | feat(android-study): music while studying | n/a |  | Sangeet, the app's music space (no music player in a browser extension) (music while studying) |
| `a03a27bd2` | 2026-11-16 | fix(android): Sangeet load error no longer names the video service | n/a |  | Sangeet, the app's music space (no music player in a browser extension) |
| `a33a26dd9` | 2026-11-16 | fix(android-music): theme the Home/Explore/Library switch; keep chosen ink | n/a |  | Sangeet, the app's music space (no music player in a browser extension) |
| `743231d94` | 2026-11-16 | fix(android-music): themed-surface contract for the kit on Music | n/a |  | Sangeet, the app's music space (no music player in a browser extension) |

## nearby-sync

| Android | Date | Subject | Status | Extension | Reason / note |
|---|---|---|---|---|---|
| `3c204e3fe` | 2026-11-15 | fix(android): a Kids profile can't change pickup or merge Nearby rules alone | partial |  | a child can't set up pickup (tab-view.js configureNanahManagedMailboxServer refuses a child profile); a Nearby rules merge asking the managing parent's PIN every time is not traced |
| `fad68cd40` | 2026-11-16 | fix(android): Study scopes over Internet Pickup and nearby delivery | ported | `b9242c7b` | extension commit cites it: Internet Pickup accepts signed Study scopes |
| `21f2d3acb` | 2026-11-16 | fix(android): let a 3.6.2 child receive signed Study scopes | ported | `b9242c7b`, `390feeb2` | the extension child already receives signed study/focus_lock/schedule scopes (study-family-scopes test) |
| `1c5d3de2e` | 2026-11-15 | fix(android): confirm nanah://pair links; Settings PIN checks off main | n/a |  | Android platform plumbing (nanah:// deep links, Settings threading) |
| `34760beb2` | 2026-11-15 | fix(android-privacy): keep the device name out of doorbell rings | n/a |  | the doorbell ring; the extension has no doorbell |

## support

| Android | Date | Subject | Status | Extension | Reason / note |
|---|---|---|---|---|---|
| `d4c6fee30` | 2026-11-15 | feat(android-support): rotating support sheet variants with mascot moments | partial | `c5c99ef9`, `9c7ec12a` | 5 of 9 variants on purpose: caught and shoo say "no data on servers", unlocked promises the sheet stops showing, tea talks about cancelling |
| `8dfad6d2d` | 2026-11-16 | fix(android-copy): say no servers keep your data, not that FilterTube has none | ported | `9c7ec12a`, `b2551b5d` | support copy says "no servers keeping your data"; caught/shoo stay out on purpose (see d4c6fee30) |

## strings

| Android | Date | Subject | Status | Extension | Reason / note |
|---|---|---|---|---|---|
| `ad8a49443` | 2026-11-15 | feat(android): use FilterTube's own words instead of platform product names | ported | `73f9e350`, `c687123e` | neutral terms in the interface catalogs and the options page |
| `f1b19dbff` | 2026-11-16 | feat(android): name the music space Sangeet in every locale | ported | `30c55dac`, `c687123e` | the music space is Sangeet in the extension's words and in neutralized platform labels |
| `a5d4eae0b` | 2026-11-16 | fix(android-viewer): show FilterTube's words for platform-sent labels | ported | `30c55dac` | UIComponents.neutralizePlatformLabel ports PlatformLabelNeutralizer |
| `116d9b71b` | 2026-11-15 | i18n(android): move sync, pairing and settings dialogs to resources | n/a |  | Android string-resource move; the extension's words already live in data/ui_locales (sync, pairing and settings dialogs) |
| `501a2ede2` | 2026-11-15 | i18n(android): move main viewer sheets and dialogs to resources | n/a |  | Android string-resource move; the extension's words already live in data/ui_locales (native viewer sheets) |
| `fa0c423d8` | 2026-11-15 | i18n(android): move offline library and local playlist text to resources | n/a |  | Android string-resource move; the extension's words already live in data/ui_locales (offline library) |
| `ca20c4b83` | 2026-11-15 | i18n(android): translate 223 English-only strings into all 37 locales | n/a |  | translations of native player and music strings |
| `21d6f576d` | 2026-11-15 | fix(android-study): block list wording and Arabic plurals in study translations | n/a |  | strings for the loosening sheet and hidden counts, neither of which the extension has |
| `8cf0c778f` | 2026-11-16 | fix(android-viewer): move the last English viewer, playlist and queue text to resources | n/a |  | Android string-resource move; the extension's words already live in data/ui_locales (native viewer) |
| `4088b1f19` | 2026-11-16 | fix(android-viewer): move leftover English viewer text to resources | n/a |  | Android string-resource move; the extension's words already live in data/ui_locales (native viewer) |
| `513b1bd0b` | 2026-11-16 | i18n(android): Context-free plan models carry string resources; shared status keys get display roles | n/a |  | Android string-resource move; the extension's words already live in data/ui_locales (native plan models) |
| `4a8950fb7` | 2026-11-16 | i18n(android): device sync status and the incoming review summary are localized | n/a |  | Android string-resource move; the extension's words already live in data/ui_locales (native sync status) |
| `0e467a114` | 2026-11-16 | i18n(android): comment controls get the screen's resources on both viewers | n/a |  | Android string-resource move; the extension's words already live in data/ui_locales (native comment controls) |
| `0f8b6e34c` | 2026-11-16 | i18n(android): offline downloads and saved-copy labels follow the app language | n/a |  | Android string-resource move; the extension's words already live in data/ui_locales (downloads) |
| `fa9e0c9ce` | 2026-11-16 | i18n(android-ja): Study gate says "Saved for later" in the glossary wording | n/a |  | the study gate's "Save for later" action, which the extension's gate doesn't offer (see fcd8018b8) |
| `8dfc76fc8` | 2026-11-16 | i18n(android): native locale catalogs follow the shipped resources; generator runs clean | n/a |  | Android native locale catalog generator |

## tablet-tv

| Android | Date | Subject | Status | Extension | Reason / note |
|---|---|---|---|---|---|
| `4c42930fc` | 2026-11-15 | feat(android-tv): About this TV card with Full/Light mode and its real adjustments | n/a |  | Android TV only |
| `63804caea` | 2026-11-15 | feat(android-motion): P4 downloads, local media and TV focus | n/a |  | downloads, local media and TV focus |
| `061cb01e3` | 2026-11-15 | fix(android-study): TV break and dashboard focus, centred planner stop | n/a |  | Android TV only |
| `84d75e243` | 2026-11-15 | feat(android-tv): the study Watch gate covers TV playback | n/a |  | Android TV only |
| `041c17a62` | 2026-11-15 | feat(android-study): Study screens on tablet and TV | n/a |  | tablet and TV Study screens |
| `068506787` | 2026-11-16 | fix(android-tablet): fill the Search result grid like Home | n/a |  | tablet search grid in the native viewer |
| `77638b8e5` | 2026-11-16 | feat(android): finish tablet and TV leftovers, follower counts in our words | n/a |  | tablet and TV leftovers; follower counts are rewritten on native screens only (the extension never rewrites the site's counts) |
| `7201bce57` | 2026-11-16 | fix(android-tv): first-install sheet fits the remote | n/a |  | Android TV only |
| `bad2fecc2` | 2026-11-16 | feat(android): IconKit in the TV rail and in place of stock icons | n/a |  | IconKit on the TV rail and the native player controls; the extension ships the crayon icons (3e3721c1) |
| `59b2e15cc` | 2026-11-16 | fix(android-tv): no stray dot beside the logo in the collapsed rail | n/a |  | Android TV only |
| `3f48ce3cc` | 2026-11-16 | chore(android-tv): debug previews in the TV debug build | n/a |  | Android TV only (debug previews) |
| `7cc22c894` | 2026-11-16 | feat(android-tv): network chip and loading moments as still frames | n/a |  | Android TV only |
| `703097d26` | 2026-11-16 | fix(android-tv): Controls tiles no longer cut their titles | n/a |  | Android TV only |
| `2a1c9ce8b` | 2026-11-16 | feat(android-tablet): Ask a parent page keeps a 720 dp column | n/a |  | tablet column for the native Ask a parent page; Requests sit in the options page's own column |
| `696b632f2` | 2026-11-16 | feat(android-tablet): Filters use the width, form beside a grid of rules | n/a |  | tablet two-pane Filters; the options page has its own wide layout |

## infra

| Android | Date | Subject | Status | Extension | Reason / note |
|---|---|---|---|---|---|
| `e951eeac0` | 2026-11-15 | perf(android-direct): read the active profile for update prompts off main | n/a |  | Android platform plumbing (direct-build update prompt) |
| `dc8c6666f` | 2026-11-15 | fix(android): keep subscriptions import card clear of system bars | n/a |  | Android platform plumbing (system bar insets) |
| `4646cd314` | 2026-11-15 | fix(android): enter foreground before rejecting a download start | n/a |  | downloads |
| `2b64a4e90` | 2026-11-15 | fix(android): refuse controller-supplied media items on the exported session | n/a |  | the app's media session |
| `9d8e7c78f` | 2026-11-15 | fix(android-privacy): keep debug logs out of release logcat | n/a |  | Android platform plumbing (release logcat) |
| `ee1165064` | 2026-11-15 | fix(android): don't crash when sign-in is refused during study | n/a |  | Android platform plumbing (native sign-in) |

## release

| Android | Date | Subject | Status | Extension | Reason / note |
|---|---|---|---|---|---|
| `785223edb` | 2026-11-16 | docs(release-notes): 3.6.2 fixes mention Study updates reaching children | ported | `8b539c8b` | mirrored into data/release_notes.json |
| `2c6b16a26` | 2026-11-16 | docs(release-notes): 3.6.2 says Kriti and Uljhan are the new app icon | ported | `7e860c80` | mirrored into data/release_notes.json |
| `61155633e` | 2026-11-16 | docs(release-notes): 3.6.2 fixes mention the Study load-more flash | ported | `d33a7764` | mirrored into data/release_notes.json |
| `8702dfff5` | 2026-11-16 | Release Android 3.6.2 (30605) | ported | `462f298b` | release notes mirrored; the extension keeps its own version number |

## docs-test

| Android | Date | Subject | Status | Extension | Reason / note |
|---|---|---|---|---|---|
| `0c020cb71` | 2026-11-15 | test(android-viewer): the shelf dismiss label is now a localized string | n/a |  | Android test only |
| `8394adbcc` | 2026-11-15 | test: guard the background scenery video on every hero screen (owner: it is our identity) | n/a |  | Android test only |
| `8a5e12d89` | 2026-11-15 | test(android): guard locale coverage and hardcoded layout text | n/a |  | Android test only |
| `ea77b7384` | 2026-11-15 | chore(android-viewer): debug-only fixture preview for viewer screenshots | n/a |  | Android debug fixture |
| `a4f6cd9af` | 2026-11-16 | test(android-viewer): guard the Main 16:9 poster frame | n/a |  | Android test only |

Android and extension files per row are in the TSV (`android_files`, `ext_files`); `ledger.mjs files <sha>` adds the FILE_MAP counterparts.
