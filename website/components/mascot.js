import { poses } from "@/data/mascots";

/** A still Kriti or Uljhan pose. Decorative by default; pass `describe` to keep the alt text. */
export function Mascot({ pose, describe = false, className = "", style }) {
  const art = poses[pose];
  if (!art) return null;
  return (
    <img
      alt={describe ? art.alt : ""}
      className={`ft-mascot pointer-events-none select-none ${className}`}
      decoding="async"
      height={art.height}
      loading="lazy"
      src={art.src}
      style={style}
      width={art.width}
    />
  );
}
