//! A silent explainer of FilterTube device sync for parents, in the same five steps as the home
//! page's Look inside diagrams: Pair, Verify, Choose, Send, Stay in sync. Two drawn devices (a parent's
//! phone and a child's tablet) talk straight to each other. Facts follow docs/app/TECHNICAL_RUNTIME.md
//! (Nanah): a 4-character code or QR, safety phrase compared on both screens, a chosen share,
//! an encrypted direct connection, and opt-in auto-sync. Kriti closes it.
use fframes::{AudioMap, Color, Duration, FFramesContext, Frame, Svgr, Transform, Video, include_media_dir};

include_media_dir!(pub struct SyncMedia, "media");

pub const WIDTH: usize = 1280;
pub const HEIGHT: usize = 720;
const LENGTH: f32 = 23.5;

const INK: &str = "#1b1a18";
const MUTED: &str = "#5f5b54";
const ACCENT: &str = "#ab4438";
const SAGE: &str = "#3f7a5a";
const LINE: &str = "#ddd3c4";
const SCREEN: &str = "#fbf8f3";

/// When each scene starts; the page seeks to these times when a step is clicked (keep in sync
/// with components/p2p-sync-video.js).
pub const STARTS: [f32; 6] = [0.0, 4.0, 8.0, 12.0, 16.5, 20.5];
const STEPS: [&str; 5] = ["1  Pair", "2  Verify", "3  Choose", "4  Send", "5  Stay in sync"];
const CAPTIONS: [[&str; 2]; 6] = [
    ["Pair with a short code or QR.", "Your phone and your child\u{2019}s device, nothing else."],
    ["Check both show the same safety phrase.", "Then you know it\u{2019}s really their device."],
    ["Choose what to share.", "Filter words and Kids rules, for example."],
    ["It goes straight to their device, locked.", "No FilterTube server keeps a copy."],
    ["Later changes stay in sync.", "Turn on Auto-sync to keep them matched."],
    ["Your devices talk to each other.", "Nothing in between can read it."],
];

// Device geometry: the parent's phone on the left, the child's tablet on the right.
const PHONE: (f32, f32, f32, f32) = (246.0, 128.0, 184.0, 352.0);
const TABLET: (f32, f32, f32, f32) = (812.0, 148.0, 262.0, 332.0);
const BEZEL: f32 = 11.0;

fn smooth(a: f32, b: f32, t: f32) -> f32 {
    let x = ((t - a) / (b - a)).clamp(0.0, 1.0);
    x * x * (3.0 - 2.0 * x)
}

fn ease_out(a: f32, b: f32, t: f32) -> f32 {
    let x = ((t - a) / (b - a)).clamp(0.0, 1.0);
    1.0 - (1.0 - x).powi(3)
}

fn scene_end(i: usize) -> f32 {
    if i + 1 < STARTS.len() { STARTS[i + 1] } else { LENGTH }
}

/// How visible scene `i` is at time `t`. The old scene fades out before the new one fades in, so
/// two captions never sit on top of each other. The first frame already shows scene 0.
fn weight(i: usize, t: f32) -> f32 {
    let start = STARTS[i];
    let end = scene_end(i);
    let out = 1.0 - smooth(end - 0.42, end - 0.12, t);
    if i == 0 {
        return out;
    }
    smooth(start - 0.08, start + 0.3, t) * out
}

/// Seconds since scene `i` began (negative before it).
fn local(i: usize, t: f32) -> f32 { t - STARTS[i] }

#[derive(Debug)]
pub struct SyncVideo;
impl SyncVideo {
    pub fn new(_: &SyncMedia, _: &str) -> Self { Self }
}

fn label<'a>(x: f32, y: f32, text: &'static str, size: f32, color: &'static str, opacity: f32) -> Svgr<'a> {
    if opacity <= 0.001 { return Svgr::empty(); }
    fframes::svgr!(<text x={x} y={y} font-family="DM Sans" font-size={size} font-weight="500" fill={color} opacity={opacity}>{text}</text>)
}

fn centered<'a>(x: f32, y: f32, text: &'static str, size: f32, color: &'static str, opacity: f32) -> Svgr<'a> {
    if opacity <= 0.001 { return Svgr::empty(); }
    fframes::svgr!(<text x={x} y={y} text-anchor="middle" font-family="DM Sans" font-size={size} font-weight="500" fill={color} opacity={opacity}>{text}</text>)
}

/// A padlock: body plus shackle, drawn around (cx, cy) at scale `s`.
fn lock<'a>(cx: f32, cy: f32, s: f32, color: &'static str) -> Svgr<'a> {
    let path = format!(
        "M{} {} v{} a{} {} 0 0 1 {} 0 v{}",
        cx - 6.0 * s, cy - 1.0 * s, -5.0 * s, 6.0 * s, 6.0 * s, 12.0 * s, 5.0 * s
    );
    fframes::svgr!(
        <g>
            <path d={path} fill="none" stroke={color} stroke-width={2.4 * s} stroke-linecap="round" />
            <rect x={cx - 9.0 * s} y={cy - 1.0 * s} width={18.0 * s} height={14.0 * s} rx={3.0 * s} fill={color} />
            <circle cx={cx} cy={cy + 5.5 * s} r={1.8 * s} fill="#ffffff" />
        </g>
    )
}

fn check<'a>(cx: f32, cy: f32, r: f32, progress: f32) -> Svgr<'a> {
    if progress <= 0.001 { return Svgr::empty(); }
    let scale = 0.86 + 0.14 * progress;
    let path = format!("M{} {} l{} {} l{} {}", cx - r * 0.42, cy + r * 0.02, r * 0.3, r * 0.3, r * 0.56, -r * 0.62);
    fframes::svgr!(
        <g opacity={progress} transform={format!("translate({} {}) scale({})", cx * (1.0 - scale), cy * (1.0 - scale), scale)}>
            <circle cx={cx} cy={cy} r={r} fill={SAGE} />
            <path d={path} fill="none" stroke="#ffffff" stroke-width={r * 0.22} stroke-linecap="round" stroke-linejoin="round" />
        </g>
    )
}

/// A small fixed QR-like pattern (decorative; it encodes nothing).
fn qr<'a>(x: f32, y: f32, size: f32) -> Svgr<'a> {
    let n = 11;
    let cell = size / n as f32;
    let finder = |cx: usize, cy: usize| -> bool { cx < 3 && cy < 3 };
    let mut cells: Vec<Svgr> = Vec::new();
    for gy in 0..n {
        for gx in 0..n {
            let in_finder = finder(gx, gy) || finder(n - 1 - gx, gy) || finder(gx, n - 1 - gy);
            if in_finder { continue; }
            if (gx * 7 + gy * 13 + gx * gy) % 5 < 2 {
                cells.push(fframes::svgr!(<rect x={x + gx as f32 * cell} y={y + gy as f32 * cell} width={cell} height={cell} fill={INK} />));
            }
        }
    }
    let f = cell * 3.0;
    let finder_box = |fx: f32, fy: f32| -> Svgr<'a> {
        fframes::svgr!(
            <g>
                <rect x={fx + cell * 0.25} y={fy + cell * 0.25} width={f - cell * 0.5} height={f - cell * 0.5} fill="none" stroke={INK} stroke-width={cell * 0.5} />
                <rect x={fx + cell} y={fy + cell} width={cell} height={cell} fill={INK} />
            </g>
        )
    };
    fframes::svgr!(
        <g>
            {cells}
            {finder_box(x, y)}
            {finder_box(x + size - f, y)}
            {finder_box(x, y + size - f)}
        </g>
    )
}

fn device<'a>(rect: (f32, f32, f32, f32), radius: f32, name: &'static str) -> Svgr<'a> {
    let (x, y, w, h) = rect;
    fframes::svgr!(
        <g>
            <ellipse cx={x + w / 2.0} cy={y + h + 14.0} rx={w * 0.46} ry="9" fill={INK} opacity="0.09" />
            <rect x={x} y={y} width={w} height={h} rx={radius} fill="#15171b" />
            <rect x={x + 1.0} y={y + 1.0} width={w - 2.0} height={h - 2.0} rx={radius - 1.0} fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1.5" />
            <rect x={x + BEZEL} y={y + BEZEL} width={w - 2.0 * BEZEL} height={h - 2.0 * BEZEL} rx={radius - 8.0} fill={SCREEN} />
            <text x={x + w / 2.0} y={y + h + 50.0} text-anchor="middle" font-family="DM Sans" font-size="21" font-weight="500" fill={MUTED}>{name}</text>
        </g>
    )
}

/// A row with a checkbox: ticked when `on` > 0.
fn share_row<'a>(x: f32, y: f32, w: f32, text: &'static str, on: f32, opacity: f32) -> Svgr<'a> {
    if opacity <= 0.001 { return Svgr::empty(); }
    let tick = format!("M{} {} l4 4 l8 -9", x + 9.0, y + 12.0);
    fframes::svgr!(
        <g opacity={opacity}>
            <rect x={x} y={y} width={w} height="38" rx="10" fill="#ffffff" stroke={LINE} stroke-width="1.2" />
            <rect x={x + 6.0} y={y + 10.0} width="18" height="18" rx="5" fill={SAGE} opacity={on} />
            <rect x={x + 6.0} y={y + 10.0} width="18" height="18" rx="5" fill="none" stroke={if on > 0.5 { SAGE } else { "#b9ad9b" }} stroke-width="1.6" />
            <path d={tick} transform={Transform::translate(0.0, 0.0)} fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity={on} />
            <text x={x + 34.0} y={y + 25.0} font-family="DM Sans" font-size="16" font-weight="500" fill={INK}>{text}</text>
        </g>
    )
}

fn word_pill<'a>(cx: f32, y: f32, text: &'static str, appear: f32, highlight: bool) -> Svgr<'a> {
    if appear <= 0.001 { return Svgr::empty(); }
    let w = 116.0;
    fframes::svgr!(
        <g opacity={appear} transform={Transform::translate(0.0, (1.0 - appear) * 10.0)}>
            <rect x={cx - w / 2.0} y={y} width={w} height="34" rx="17" fill={if highlight { "#f3e1dc" } else { "#ffffff" }} stroke={if highlight { ACCENT } else { LINE }} stroke-width="1.4" />
            <text x={cx} y={y + 23.0} text-anchor="middle" font-family="DM Sans" font-size="17" font-weight="500" fill={INK}>{text}</text>
        </g>
    )
}

/// The locked parcel that travels between the devices.
fn parcel<'a>(x: f32, y: f32, opacity: f32, scale: f32) -> Svgr<'a> {
    if opacity <= 0.001 { return Svgr::empty(); }
    fframes::svgr!(
        <g opacity={opacity} transform={format!("translate({} {}) scale({})", x, y, scale)}>
            <rect x="-34" y="-26" width="68" height="52" rx="14" fill={ACCENT} />
            <rect x="-34" y="-26" width="68" height="52" rx="14" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="1.5" />
            {lock(0.0, -3.0, 1.15, "#ffffff")}
        </g>
    )
}

impl Video for SyncVideo {
    const FPS: usize = 24;
    const WIDTH: usize = WIDTH;
    const HEIGHT: usize = HEIGHT;
    const BACKGROUND_COLOR: Color = Color::WHITE;
    fn duration(&self) -> Duration<'_> { Duration::Seconds(LENGTH) }
    fn audio(&self) -> AudioMap<'_> { AudioMap::none() }

    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let w: Vec<f32> = (0..6).map(|i| weight(i, t)).collect();

        // Screen origins.
        let (px, py, pw, _) = PHONE;
        let (sx, sy, sw) = (px + BEZEL, py + BEZEL, pw - 2.0 * BEZEL);
        let pcx = sx + sw / 2.0;
        let (tx, ty, tw, _) = TABLET;
        let (rx, ry, rw) = (tx + BEZEL, ty + BEZEL, tw - 2.0 * BEZEL);
        let tcx = rx + rw / 2.0;

        // 1 · Pair: the phone shows a code and QR; the code is typed on the tablet.
        let pair = {
            let o = w[0];
            let l = local(0, t);
            let typed = (((l - 0.9) / 0.32).floor().clamp(0.0, 4.0)) as usize;
            let code: &'static str = &"K7QM"[..typed];
            let joined = ease_out(2.4, 2.9, l);
            fframes::svgr!(
                <g opacity={o}>
                    {centered(pcx, sy + 46.0, "Pairing code", 15.0, MUTED, 1.0)}
                    <text x={pcx} y={sy + 96.0} text-anchor="middle" font-family="DM Sans" font-size="40" font-weight="500" letter-spacing="7" fill={INK}>"K7QM"</text>
                    {qr(pcx - 52.0, sy + 128.0, 104.0)}
                    {centered(pcx, sy + 270.0, "or scan the QR", 14.0, MUTED, 1.0)}
                    {centered(tcx, ry + 66.0, "Enter the code", 17.0, MUTED, 1.0)}
                    <rect x={tcx - 82.0} y={ry + 92.0} width="164" height="58" rx="14" fill="#ffffff" stroke={if typed == 4 { SAGE } else { LINE }} stroke-width="1.6" />
                    <text x={tcx} y={ry + 132.0} text-anchor="middle" font-family="DM Sans" font-size="34" font-weight="500" letter-spacing="7" fill={INK}>{code}</text>
                    {check(tcx, ry + 200.0, 18.0, joined)}
                    {centered(tcx, ry + 244.0, "Connected", 16.0, SAGE, joined)}
                </g>
            )
        };

        // 2 · Verify: the same safety phrase on both screens, then a tick on each.
        let verify = {
            let o = w[1];
            let l = local(1, t);
            let words = ["otter", "lantern", "maple"];
            let mut items: Vec<Svgr> = Vec::new();
            for (k, word) in words.iter().enumerate() {
                let a = ease_out(0.3 + k as f32 * 0.25, 0.75 + k as f32 * 0.25, l);
                items.push(word_pill(pcx, sy + 78.0 + k as f32 * 46.0, word, a, false));
                items.push(word_pill(tcx, ry + 78.0 + k as f32 * 46.0, word, a, false));
            }
            let ok = ease_out(1.9, 2.4, l);
            fframes::svgr!(
                <g opacity={o}>
                    {centered(pcx, sy + 50.0, "Safety phrase", 15.0, MUTED, 1.0)}
                    {centered(tcx, ry + 50.0, "Safety phrase", 15.0, MUTED, 1.0)}
                    {items}
                    {check(pcx, sy + 258.0, 17.0, ok)}
                    {check(tcx, ry + 258.0, 17.0, ok)}
                    {centered(640.0, 300.0, "same on both", 18.0, SAGE, ok)}
                </g>
            )
        };

        // 3 · Choose: tick what to share on the phone; the tablet waits.
        let choose = {
            let o = w[2];
            let l = local(2, t);
            let a = ease_out(0.7, 1.0, l);
            let b = ease_out(1.3, 1.6, l);
            let dots = ((l * 3.0).floor() as i32).rem_euclid(4) as usize;
            let waiting: &'static str = &"Waiting..."[..7 + dots.min(3)];
            fframes::svgr!(
                <g opacity={o}>
                    {label(sx + 14.0, sy + 50.0, "Share", 20.0, INK, 1.0)}
                    {share_row(sx + 12.0, sy + 72.0, sw - 24.0, "Filter words", a, 1.0)}
                    {share_row(sx + 12.0, sy + 120.0, sw - 24.0, "Kids rules", b, 1.0)}
                    {share_row(sx + 12.0, sy + 168.0, sw - 24.0, "Notes", 0.0, 1.0)}
                    <rect x={sx + 12.0} y={sy + 262.0} width={sw - 24.0} height="44" rx="22" fill={ACCENT} opacity={0.35 + 0.65 * b} />
                    {centered(pcx, sy + 290.0, "Send", 17.0, "#ffffff", 1.0)}
                    {label(tcx - 40.0, ry + 160.0, waiting, 18.0, MUTED, 1.0)}
                </g>
            )
        };

        // 4 · Send: a locked parcel goes straight across; the tablet shows it for review.
        let send = {
            let o = w[3];
            let l = local(3, t);
            let p = smooth(0.5, 2.3, l);
            let x0 = px + pw - 10.0;
            let x1 = tx + 10.0;
            let px_ = x0 + (x1 - x0) * p;
            let py_ = 300.0 - (p * std::f32::consts::PI).sin() * 70.0;
            let travelling = smooth(0.3, 0.5, l) * (1.0 - smooth(2.3, 2.55, l));
            let arrived = ease_out(2.4, 2.9, l);
            let accept = ease_out(3.3, 3.6, l);
            let trail = format!("M{} 300 Q{} 160 {} 300", x0, (x0 + x1) / 2.0, x1);
            fframes::svgr!(
                <g opacity={o}>
                    <path d={trail} fill="none" stroke={ACCENT} stroke-opacity="0.28" stroke-width="2" stroke-dasharray="3 9" stroke-linecap="round" />
                    {lock(pcx, sy + 120.0, 2.4, ACCENT)}
                    {centered(pcx, sy + 196.0, "Locked and sent", 16.0, INK, 1.0)}
                    {centered(pcx, sy + 220.0, "straight to the tablet", 14.0, MUTED, 1.0)}
                    {parcel(px_, py_, travelling, 1.0)}
                    <g opacity={arrived}>
                        {centered(tcx, ry + 56.0, "Update from Your phone", 15.0, MUTED, 1.0)}
                        {word_pill(tcx, ry + 78.0, "Filter words", 1.0, false)}
                        {word_pill(tcx, ry + 122.0, "Kids rules", 1.0, false)}
                        <rect x={tcx - 70.0} y={ry + 190.0} width="140" height="44" rx="22" fill={SAGE} opacity={0.45 + 0.55 * accept} />
                        {centered(tcx, ry + 218.0, "Accept", 17.0, "#ffffff", 1.0)}
                        {check(tcx, ry + 270.0, 15.0, accept)}
                    </g>
                </g>
            )
        };

        // 5 · Stay in sync: a new word on the phone shows up on the tablet.
        let stay = {
            let o = w[4];
            let l = local(4, t);
            let added = ease_out(0.6, 1.0, l);
            let p = smooth(1.2, 2.4, l);
            let x0 = px + pw - 10.0;
            let x1 = tx + 10.0;
            let travelling = smooth(1.05, 1.2, l) * (1.0 - smooth(2.4, 2.6, l));
            let arrived = ease_out(2.45, 2.85, l);
            fframes::svgr!(
                <g opacity={o}>
                    {centered(pcx, sy + 50.0, "Blocked words", 15.0, MUTED, 1.0)}
                    {word_pill(pcx, sy + 74.0, "scary", 1.0, false)}
                    {word_pill(pcx, sy + 118.0, "horror", 1.0, false)}
                    {word_pill(pcx, sy + 162.0, "jumpscare", added, true)}
                    {centered(tcx, ry + 50.0, "Blocked words", 15.0, MUTED, 1.0)}
                    {word_pill(tcx, ry + 74.0, "scary", 1.0, false)}
                    {word_pill(tcx, ry + 118.0, "horror", 1.0, false)}
                    {word_pill(tcx, ry + 162.0, "jumpscare", arrived, true)}
                    {centered(tcx, ry + 250.0, "Up to date", 16.0, SAGE, arrived)}
                    {parcel(x0 + (x1 - x0) * p, 300.0 - (p * std::f32::consts::PI).sin() * 50.0, travelling, 0.7)}
                </g>
            )
        };

        // End: both devices settled, Kriti cheering between them.
        let end = {
            let o = w[5];
            let l = local(5, t);
            let k = ease_out(0.1, 0.7, l);
            let kriti = match ctx.get_image("kriti_cheer.png") {
                Some(img) => fframes::svgr!(
                    <g opacity={o * k} transform={Transform::translate(0.0, (1.0 - k) * 18.0)}>
                        <image href={img.href()} x="555" y="186" width="170" height="203" preserveAspectRatio="xMidYMax meet" />
                    </g>
                ),
                None => Svgr::empty(),
            };
            fframes::svgr!(
                <g>
                    <g opacity={o}>
                        {lock(pcx, sy + 150.0, 2.0, SAGE)}
                        {centered(pcx, sy + 214.0, "In sync", 17.0, SAGE, 1.0)}
                        {lock(tcx, ry + 150.0, 2.0, SAGE)}
                        {centered(tcx, ry + 214.0, "In sync", 17.0, SAGE, 1.0)}
                    </g>
                    {kriti}
                </g>
            )
        };

        // Step chips along the top; the current step is filled.
        let chip_w = [92.0, 108.0, 112.0, 96.0, 160.0];
        let gap = 12.0;
        let total: f32 = chip_w.iter().sum::<f32>() + gap * 4.0;
        let mut cx = (WIDTH as f32 - total) / 2.0;
        let mut chips: Vec<Svgr> = Vec::new();
        for (i, name) in STEPS.iter().enumerate() {
            let on = w[i].clamp(0.0, 1.0);
            let wdt = chip_w[i];
            chips.push(fframes::svgr!(
                <g>
                    <rect x={cx} y="34" width={wdt} height="40" rx="20" fill="#ffffff" fill-opacity="0.7" stroke={LINE} stroke-width="1.2" />
                    <rect x={cx} y="34" width={wdt} height="40" rx="20" fill={ACCENT} opacity={on} />
                    <text x={cx + wdt / 2.0} y="60" text-anchor="middle" font-family="DM Sans" font-size="16" font-weight="500" fill={MUTED} opacity={1.0 - on}>{*name}</text>
                    <text x={cx + wdt / 2.0} y="60" text-anchor="middle" font-family="DM Sans" font-size="16" font-weight="500" fill="#ffffff" opacity={on}>{*name}</text>
                </g>
            ));
            cx += wdt + gap;
        }

        let captions: Vec<Svgr> = CAPTIONS.iter().enumerate().map(|(i, c)| {
            let o = w[i];
            if o <= 0.001 { return Svgr::empty(); }
            fframes::svgr!(
                <g opacity={o * o} transform={Transform::translate(0.0, (1.0 - o) * 10.0)}>
                    <text x="640" y="604" text-anchor="middle" font-family="DM Sans" font-size="38" font-weight="500" letter-spacing="-1" fill={INK}>{c[0]}</text>
                    <text x="640" y="648" text-anchor="middle" font-family="DM Sans" font-size="23" font-weight="500" fill={MUTED}>{c[1]}</text>
                </g>
            )
        }).collect();

        fframes::svgr!(
            <svg xmlns="http://www.w3.org/2000/svg" width={WIDTH} height={HEIGHT}>
                <defs>
                    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stop-color="#fbf8f2" />
                        <stop offset="1" stop-color="#f1e9dc" />
                    </linearGradient>
                </defs>
                <rect width="1280" height="720" fill="url(#paper)" />
                {chips}
                {device(PHONE, 34.0, "Your phone")}
                {device(TABLET, 26.0, "Your child\u{2019}s tablet")}
                {pair}
                {verify}
                {choose}
                {send}
                {stay}
                {end}
                {captions}
            </svg>
        )
    }
}
