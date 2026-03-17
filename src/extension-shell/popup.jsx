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
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
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
          >
            <img src="../icons/icon-48.png" alt="FilterTube" className="logo-icon" />
            <div className="brand-text">
              <h1 className="app-title">FilterTube</h1>
              <span id="extensionStatusText" className="extension-status">
                Enabled
              </span>
            </div>
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

        <main className="app-content ft-popup-content">
          <section className="ft-popup-filter-card">
            <div className="ft-popup-filter-card__header">
              <div>
                <p className="ft-popup-filter-card__eyebrow">Quick control</p>
                <h3 className="ft-popup-filter-card__title">Update this profile fast</h3>
              </div>
              <span className="ft-popup-filter-card__badge">Local-first</span>
            </div>

            <div id="popupFiltersTabsContainer" />
          </section>
        </main>
      </div>
    </div>
  );
}

applyExtensionEnvironment("popup");

const mountNode = document.getElementById("popupRoot");
if (mountNode) {
  render(<PopupShell />, mountNode);
}
