import { h, render } from "preact";

import { applyExtensionEnvironment } from "./shared/runtime.js";

function TabViewDecor() {
  return (
    <div aria-hidden="true" className="ft-tab-view-ambient">
      <div className="ft-tab-view-ambient__media">
        <video
          className="ft-tab-view-ambient__video"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        >
          <source src="../assets/images/homepage_hero_day.mp4" type="video/mp4" />
        </video>
        <span className="ft-tab-view-ambient__media-scrim" />
        <span className="ft-tab-view-ambient__media-tint" />
      </div>
      <span className="ft-tab-view-ambient__glow ft-tab-view-ambient__glow--left" />
      <span className="ft-tab-view-ambient__glow ft-tab-view-ambient__glow--right" />
      <span className="ft-tab-view-ambient__glow ft-tab-view-ambient__glow--lower" />
    </div>
  );
}

applyExtensionEnvironment("tab-view");

const mountNode = document.getElementById("tabViewShellDecor");
if (mountNode) {
  render(<TabViewDecor />, mountNode);
}
