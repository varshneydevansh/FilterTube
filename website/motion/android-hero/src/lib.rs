//! Quiet, silent 8-second contour loop for the Android hero. No app UI or claims.
use fframes::{AudioMap, Color, Duration, FFramesContext, Frame, Svgr, Transform, Video, include_media_dir};
include_media_dir!(pub struct FiltertubeHeroMotionMedia, "media");
pub const WIDTH: usize = 1280;
pub const HEIGHT: usize = 720;
#[derive(Debug)]
pub struct FiltertubeHeroMotionVideo;
impl FiltertubeHeroMotionVideo {
    pub fn new(_: &FiltertubeHeroMotionMedia, _: &str) -> Self { Self }
}
impl Video for FiltertubeHeroMotionVideo {
    const FPS: usize = 24;
    const WIDTH: usize = WIDTH;
    const HEIGHT: usize = HEIGHT;
    const BACKGROUND_COLOR: Color = Color::WHITE;
    fn duration(&self) -> Duration<'_> { Duration::Seconds(8.0) }
    fn audio(&self) -> AudioMap<'_> { AudioMap::none() }
    fn render_frame<'a>(&'a self, frame: Frame, _: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let phase = frame.seconds() * std::f32::consts::TAU / 8.0;
        let contours: Vec<Svgr> = (0..9).map(|i| {
            let r = 150.0 + i as f32 * 38.0;
            fframes::svgr!(<ellipse cx="980" cy="350" rx={r} ry={r * 0.82} fill="none" stroke="#819476" stroke-width="1.1" opacity="0.13" />)
        }).collect();
        fframes::svgr!(
            <svg xmlns="http://www.w3.org/2000/svg" width={WIDTH} height={HEIGHT}>
                <defs>
                    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stop-color="#f7fbf2" />
                        <stop offset="1" stop-color="#dde8d8" />
                    </linearGradient>
                    <radialGradient id="warm">
                        <stop offset="0" stop-color="#f1c7a4" stop-opacity="0.75" />
                        <stop offset="1" stop-color="#f1c7a4" stop-opacity="0" />
                    </radialGradient>
                </defs>
                <rect width="1280" height="720" fill="url(#paper)" />
                <ellipse cx={1030.0 + phase.sin() * 35.0} cy={150.0 + phase.cos() * 22.0} rx="510" ry="400" fill="url(#warm)" />
                <g transform={Transform::translate(phase.sin() * 12.0, phase.cos() * 8.0)}>{contours}</g>
            </svg>
        )
    }
}
