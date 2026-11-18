import Image from "next/image";

import { poses } from "@/data/mascots";
import { devices } from "@/data/screenshots";

// The hero keeps two devices: the Study plan on a tablet behind, Sangeet on the live Android phone in front; the rest live in
// the screenshots and Study sections. Real captures from data/screenshots.js (owned by the capture
// pass), so fresh screens flow in without touching this file. Kriti stands with the devices;
// Uljhan hops off the edge of the iPad, cleared from the feed with no hard feelings.
const shots = [
  { key: "ipad", kind: "tablet", screen: devices.ipad?.captures?.study, label: "iPad, Study plan" },
  { key: "android", kind: "phone", screen: devices.androidPhone?.captures?.sangeet, label: "Android phone, Sangeet" },
];

function Device({ shot, index }) {
  const { screen, kind, key } = shot;
  if (!screen) return null;
  return (
    <figure className="ft-hero-device" data-kind={kind} data-slot={key} style={{ "--enter-delay": `${120 + index * 110}ms` }}>
      <span className="ft-hero-device-screen">
        <Image
          alt={screen.alt}
          height={screen.height}
          priority={key === "android" || key === "ipad"}
          sizes={kind === "tablet" ? "(min-width: 1024px) 38vw, 78vw" : "(min-width: 1024px) 15vw, 32vw"}
          src={screen.src}
          // The captures are small webp already; resizing them at quality 75 blurred the UI text.
          unoptimized
          width={screen.width}
        />
      </span>
    </figure>
  );
}

function Pose({ pose, slot, describe = false }) {
  const art = poses[pose];
  return (
    <img
      alt={describe ? art.alt : ""}
      className="ft-hero-mascot"
      data-slot={slot}
      decoding="async"
      draggable="false"
      height={art.height}
      src={art.src}
      width={art.width}
    />
  );
}

export function HeroShowcase() {
  return (
    <div aria-label="FilterTube Study plan on an iPad and Sangeet on an Android phone" className="ft-hero-showcase" role="group">
      <span aria-hidden="true" className="ft-hero-ground" />
      {shots.map((shot, index) => <Device index={index} key={shot.key} shot={shot} />)}
      <Pose describe pose="kritiWave" slot="kriti" />
      <Pose pose="uljhanHop" slot="uljhan" />
    </div>
  );
}
