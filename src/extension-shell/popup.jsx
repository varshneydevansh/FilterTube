import { Fragment, h, render } from "preact";

import { applyExtensionEnvironment } from "./shared/runtime.js";

function ShellGlow({ className }) {
  return <span className={className} />;
}

function PopupShell() {
  return (
    <div className="ft-popup-shell">
      <div aria-hidden="true" className="ft-popup-shell__media">
        <video
          className="ft-popup-shell__video"
          loop
          muted
          playsInline
          disablePictureInPicture
          preload="none"
          tabIndex="-1"
        >
          <source src="../assets/images/homepage_hero_day.mp4" type="video/mp4" />
        </video>
        <span className="ft-popup-shell__video-scrim" />
        <span className="ft-popup-shell__video-tint" />
      </div>

      <div aria-hidden="true" className="ft-popup-shell__ambient">
        <ShellGlow className="ft-popup-shell__glow ft-popup-shell__glow--sky" />
        <ShellGlow className="ft-popup-shell__glow ft-popup-shell__glow--sun" />
        <ShellGlow className="ft-popup-shell__glow ft-popup-shell__glow--flora" />
      </div>

      <div className="app-container ft-popup-shell__frame">
        <header className="app-header ft-popup-header">
          <div
            id="toggleEnabledBrandBtn"
            className="brand ft-popup-brand"
            role="button"
            tabIndex="0"
            aria-pressed="true"
            title="Toggle Filtering"
            data-ft-i18n-title="popup.toggleFiltering"
          >
            <img src="../icons/icon-48.png" alt="FilterTube" className="logo-icon" />
            <div className="brand-text">
              <h1 className="app-title">FilterTube</h1>
              <span id="extensionStatusText" className="extension-status" data-ft-i18n="popup.enabled">
                Enabled
              </span>
            </div>
            {/* The app's switch (PaperKit.styleSwitch): sage track and a checked paper thumb when on,
                a plain track and a muted thumb when off. The brand card is the button; this only shows it. */}
            <span className="ft-popup-power" aria-hidden="true">
              <span className="ft-popup-power__thumb">
                <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor">
                  <path d="M3.4 8.6l3 2.9 6.2-6.8" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
          </div>

          <div className="header-actions">
            <div id="ftProfileMenuPopup" className="ft-profile-menu">
              <button
                id="ftProfileBadgeBtnPopup"
                className="ft-profile-badge"
                type="button"
                aria-haspopup="listbox"
                aria-expanded="false"
                title="Active profile"
                data-ft-i18n-title="popup.activeProfile"
              />
              <div
                id="ftProfileDropdownPopup"
                className="ft-profile-dropdown"
                role="listbox"
                hidden
              />
            </div>
            <div id="ftTopBarListModeControlsPopup" className="ft-topbar-list-mode" />
            <button
              id="openInTabBtn"
              className="icon-button ft-popup-open"
              title="Open full settings"
              aria-label="Open full settings"
              data-ft-i18n-title="popup.openFullSettings"
              data-ft-i18n-aria-label="popup.openFullSettings"
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M8 8h8v8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path
                  d="M16 8L7 17"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <div
          id="ftManagedTimeStatusPopup"
          className="ft-popup-time-status"
          role="status"
          aria-live="polite"
          hidden
        >
          <span className="ft-popup-time-status__label" data-ft-i18n="popup.youtubeTime">Viewing time</span>
          <strong id="ftManagedTimeStatusValuePopup" className="ft-popup-time-status__value" />
        </div>

        <main className="app-content ft-popup-content">
          <section className="ft-popup-filter-card">
            <div id="popupFiltersTabsContainer" />
          </section>
        </main>

        {/* FilterTube apps: one quiet row, two pills (Android on Google Play, the iPhone guide). */}
        <nav
          id="ftPopupApps"
          className="ft-popup-apps"
          aria-label="FilterTube apps"
          data-ft-i18n-aria-label="popup.apps.label"
        >
          <a
            id="androidAppLinkPopup"
            className="ft-popup-apps__pill ft-popup-apps__pill--android"
            href="https://play.google.com/store/apps/details?id=com.filtertube.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="ft-popup-apps__badge" aria-hidden="true">
              <img src="../assets/images/apps/android_robot.webp" alt="" width="22" height="27" />
            </span>
            <span className="ft-popup-apps__text">
              <strong data-ft-i18n="popup.apps.android">Android</strong>
              <span data-ft-i18n="popup.apps.androidStore">Google Play</span>
            </span>
          </a>
          <a
            id="iosAppLinkPopup"
            className="ft-popup-apps__pill ft-popup-apps__pill--ios"
            href="https://filtertube.in/ios"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="ft-popup-apps__badge" aria-hidden="true">
              <svg width="18" height="20" viewBox="0 0 17 20" fill="currentColor">
                <path d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9C3.6 4.8 2 5.8 1.1 7.4c-1.9 3.2-.5 8 1.3 10.6.9 1.3 1.9 2.7 3.3 2.6 1.3-.1 1.8-.8 3.4-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.2-2.6 1-1.5 1.4-2.9 1.4-3-.1 0-2.8-1.1-3-4.4zM11.5 3c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.1 1.1.1 2.3-.6 3-1.5z" />
              </svg>
            </span>
            <span className="ft-popup-apps__text">
              <strong data-ft-i18n="popup.apps.ios">Now on iPhone</strong>
              <span data-ft-i18n="popup.apps.iosGuide">SideStore guide</span>
            </span>
          </a>
        </nav>
      </div>
    </div>
  );
}

// The background video starts after the first paint so it never delays the
// popup, and stays paused while the system asks for reduced motion.
function startAmbientVideoAfterPaint(video) {
  if (!video) return;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const sync = () => {
    if (reducedMotion?.matches) {
      video.pause();
      return;
    }
    video.preload = "auto";
    const playing = video.play();
    if (playing && typeof playing.catch === "function") playing.catch(() => {});
  };
  requestAnimationFrame(() => setTimeout(sync, 0));
  reducedMotion?.addEventListener?.("change", sync);
}

applyExtensionEnvironment("popup");

const mountNode = document.getElementById("popupRoot");
if (mountNode) {
  render(<PopupShell />, mountNode);
  startAmbientVideoAfterPaint(mountNode.querySelector(".ft-popup-shell__video"));
}
