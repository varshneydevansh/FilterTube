//! A silent 12-second loop of one Study session on a real Pixel: round, comments off, break, done.
//! The phone shows the website's own Android captures; Kriti is the cut-out art from
//! data/mascots.js. No other characters, no sound, no claims beyond what the screens show.
use fframes::{AudioMap, Color, Duration, FFramesContext, Frame, Svgr, Transform, Video, include_media_dir};

include_media_dir!(pub struct StudyLoopMedia, "media");

pub const WIDTH: usize = 1280;
pub const HEIGHT: usize = 720;
const LOOP: f32 = 12.0;
const FADE: f32 = 0.55;

const INK: &str = "#1b1a18";
const MUTED: &str = "#625f58";
const ACCENT: &str = "#ab4438";
const SAGE: &str = "#3f7a5a";
const AMBER: &str = "#d99a2b";

struct Stage {
    starts: f32,
    screen: &'static str,
    kriti: &'static str,
    eyebrow: &'static str,
    title: [&'static str; 2],
    body: [&'static str; 2],
}

// Times are when each stage begins; the last one ends where the loop crossfades back to the first.
const STAGES: [Stage; 4] = [
    Stage { starts: 0.0, screen: "phone_study_session.png", kriti: "kriti_read.png", eyebrow: "STUDY ROUND",
        title: ["Only the channels", "in your plan."], body: ["Home, search and Up next come", "from what you chose to study."] },
    Stage { starts: 3.4, screen: "phone_watch_study.png", kriti: "kriti_shh.png", eyebrow: "STUDY ROUND",
        title: ["Comments stay", "off for now."], body: ["Kriti keeps the chatter out", "while you study."] },
    Stage { starts: 6.4, screen: "phone_study_break.png", kriti: "kriti_sleepy.png", eyebrow: "BREAK",
        title: ["A real break.", ""], body: ["Stand up, drink some water,", "look at something far away."] },
    Stage { starts: 9.0, screen: "phone_study_done.png", kriti: "kriti_cheer.png", eyebrow: "DONE",
        title: ["That counts.", ""], body: ["Every round is counted", "at the end of the day."] },
];
const BACK_TO_START: f32 = 11.45;

fn smooth(a: f32, b: f32, t: f32) -> f32 {
    let x = ((t - a) / (b - a)).clamp(0.0, 1.0);
    x * x * (3.0 - 2.0 * x)
}

/// How visible stage `i` is at time `t` (0..1). Crossfades last FADE seconds.
fn weight(i: usize, t: f32) -> f32 {
    let start = STAGES[i].starts;
    let end = if i + 1 < STAGES.len() { STAGES[i + 1].starts } else { BACK_TO_START };
    if i == 0 {
        // The first stage also fades back in at the end, so frame 0 follows the last frame.
        return (1.0 - smooth(end, end + FADE, t)) + smooth(BACK_TO_START, BACK_TO_START + FADE, t);
    }
    smooth(start, start + FADE, t) - smooth(end, end + FADE, t)
}

/// 0..1 progress along the Round / Break / Done bar, eased back to 0 during the loop seam.
fn progress(t: f32) -> f32 {
    let forward = (t / BACK_TO_START).clamp(0.0, 1.0);
    forward * (1.0 - smooth(BACK_TO_START, BACK_TO_START + FADE, t))
}

#[derive(Debug)]
pub struct StudyLoopVideo;
impl StudyLoopVideo {
    pub fn new(_: &StudyLoopMedia, _: &str) -> Self { Self }
}

fn image<'a>(ctx: &FFramesContext<'a, '_>, name: &str, x: f32, y: f32, w: f32, h: f32, opacity: f32, dy: f32) -> Svgr<'a> {
    if opacity <= 0.001 { return Svgr::empty(); }
    match ctx.get_image(name) {
        Some(img) => fframes::svgr!(
            <g opacity={opacity} transform={Transform::translate(0.0, dy)}>
                <image href={img.href()} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMax meet" />
            </g>
        ),
        None => Svgr::empty(),
    }
}

impl Video for StudyLoopVideo {
    const FPS: usize = 24;
    const WIDTH: usize = WIDTH;
    const HEIGHT: usize = HEIGHT;
    const BACKGROUND_COLOR: Color = Color::WHITE;
    fn duration(&self) -> Duration<'_> { Duration::Seconds(LOOP) }
    fn audio(&self) -> AudioMap<'_> { AudioMap::none() }

    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();

        // Phone screens: the incoming one rises a little as it fades in.
        let screens: Vec<Svgr> = STAGES.iter().enumerate().map(|(i, s)| {
            let w = weight(i, t);
            image(ctx, s.screen, 196.0, 74.0, 270.0, 600.0, w, (1.0 - w) * 18.0)
        }).collect();

        // Kriti beside the copy, one pose per stage.
        let kritis: Vec<Svgr> = STAGES.iter().enumerate().map(|(i, s)| {
            let w = weight(i, t);
            image(ctx, s.kriti, 1010.0, 400.0, 190.0, 250.0, w, (1.0 - w) * 22.0)
        }).collect();

        let copy: Vec<Svgr> = STAGES.iter().enumerate().map(|(i, s)| {
            let w = weight(i, t);
            if w <= 0.001 { return Svgr::empty(); }
            let eyebrow_color = match i { 2 => AMBER, 3 => SAGE, _ => ACCENT };
            let body_y = if s.title[1].is_empty() { 330.0 } else { 400.0 };
            fframes::svgr!(
                <g opacity={w * w} transform={Transform::translate(0.0, (1.0 - w) * 16.0)}>
                    <text x="560" y="196" font-family="DM Sans" font-size="20" font-weight="500" letter-spacing="5" fill={eyebrow_color}>{s.eyebrow}</text>
                    <text x="556" y="268" font-family="DM Sans" font-size="64" font-weight="500" letter-spacing="-2.4" fill={INK}>{s.title[0]}</text>
                    <text x="556" y="338" font-family="DM Sans" font-size="64" font-weight="500" letter-spacing="-2.4" fill={INK}>{s.title[1]}</text>
                    <text x="560" y={body_y} font-family="DM Sans" font-size="28" font-weight="500" fill={MUTED}>{s.body[0]}</text>
                    <text x="560" y={body_y + 40.0} font-family="DM Sans" font-size="28" font-weight="500" fill={MUTED}>{s.body[1]}</text>
                </g>
            )
        }).collect();

        // Round / Break / Done bar: segment widths follow the stage lengths.
        let bar_x = 560.0;
        let bar_w = 420.0;
        let round_end = STAGES[2].starts / BACK_TO_START;
        let break_end = STAGES[3].starts / BACK_TO_START;
        let p = progress(t);
        let fill = |from: f32, to: f32| ((p - from) / (to - from)).clamp(0.0, 1.0);
        let seg = |from: f32, to: f32, color: &'static str| -> Svgr<'a> {
            let x = bar_x + from * bar_w + 3.0;
            let w = (to - from) * bar_w - 6.0;
            let fw = w * fill(from, to);
            let filled = if fw > 0.5 {
                fframes::svgr!(<rect x={x} y="606" width={fw} height="10" rx="5" fill={color} />)
            } else { Svgr::empty() };
            fframes::svgr!(
                <g>
                    <rect x={x} y="606" width={w} height="10" rx="5" fill="#e6ddcf" />
                    {filled}
                </g>
            )
        };
        let marker_x = bar_x + p * bar_w;

        fframes::svgr!(
            <svg xmlns="http://www.w3.org/2000/svg" width={WIDTH} height={HEIGHT}>
                <defs>
                    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stop-color="#fbf8f2" />
                        <stop offset="1" stop-color="#f1e9dc" />
                    </linearGradient>
                    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0" stop-color="#e9d9bf" stop-opacity="0.9" />
                        <stop offset="1" stop-color="#e9d9bf" stop-opacity="0" />
                    </radialGradient>
                    <clipPath id="screen">
                        <rect x="196" y="74" width="270" height="600" rx="30" />
                    </clipPath>
                </defs>
                <rect width="1280" height="720" fill="url(#paper)" />
                <ellipse cx="331" cy="380" rx="300" ry="330" fill="url(#glow)" />
                <ellipse cx="331" cy="698" rx="170" ry="14" fill="#1b1a18" opacity="0.10" />
                // The phone: a dark body, a hairline highlight, then the screen.
                <rect x="184" y="62" width="294" height="624" rx="40" fill="#121417" />
                <rect x="185" y="63" width="292" height="622" rx="39" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1.5" />
                <rect x="196" y="74" width="270" height="600" rx="30" fill="#f6f2eb" />
                <g clip-path="url(#screen)">{screens}</g>
                {copy}
                {kritis}
                <ellipse cx="1105" cy="652" rx="78" ry="8" fill="#1b1a18" opacity="0.08" />
                <text x="560" y="582" font-family="DM Sans" font-size="17" font-weight="500" letter-spacing="3" fill={MUTED}>"ROUND"</text>
                <text x={bar_x + round_end * bar_w + 3.0} y="582" font-family="DM Sans" font-size="17" font-weight="500" letter-spacing="3" fill={MUTED}>"BREAK"</text>
                <text x={bar_x + break_end * bar_w + 3.0} y="582" font-family="DM Sans" font-size="17" font-weight="500" letter-spacing="3" fill={MUTED}>"DONE"</text>
                {seg(0.0, round_end, ACCENT)}
                {seg(round_end, break_end, AMBER)}
                {seg(break_end, 1.0, SAGE)}
                <circle cx={marker_x} cy="611" r="9" fill="#ffffff" stroke={INK} stroke-width="2" />
            </svg>
        )
    }
}
