import Image from "next/image";

import { poses } from "@/data/mascots";
import { devices } from "@/data/screenshots";

// The hero's device composition: real captures from data/screenshots.js (owned by the capture
// pass), so fresh screens flow in without touching this file. Kriti stands with the devices;
// Uljhan hops off the edge of the iPad, cleared from the feed with no hard feelings.
const extra = (deviceId, file) => devices[deviceId]?.extras?.find((screen) => screen.src.endsWith(`/${file}.webp`));

const shots = [
  { key: "ipad", kind: "tablet", screen: devices.ipad?.captures?.home, label: "iPad" },
  { key: "study", kind: "phone", screen: extra("androidPhone", "phone-study-session"), label: "Android phone, study session" },
  { key: "android", kind: "phone", screen: devices.androidPhone?.captures?.home, label: "Android phone" },
  { key: "iphone", kind: "phone", screen: devices.iphone?.captures?.home, label: "iPhone" },
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
          sizes={kind === "tablet" ? "(min-width: 1024px) 34vw, 70vw" : "(min-width: 1024px) 12vw, 26vw"}
          src={screen.src}
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
    <div aria-label="FilterTube on iPad, Android phones and iPhone during a study round" className="ft-hero-showcase" role="group">
      <span aria-hidden="true" className="ft-hero-ground" />
      {shots.map((shot, index) => <Device index={index} key={shot.key} shot={shot} />)}
      <Pose describe pose="kritiWave" slot="kriti" />
      <Pose pose="uljhanHop" slot="uljhan" />
    </div>
  );
}
