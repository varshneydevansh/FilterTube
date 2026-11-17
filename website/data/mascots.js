// Kriti and Uljhan, the only FilterTube characters. Art is cut from the aKriti brand
// library by tools/cut-mascots.py; sizes are the real file sizes (no layout shift).
// Uljhan never wears clothes; never add other characters here.

export const poses = {
  kritiWave: { src: "/mascots/kriti-wave.webp", width: 202, height: 280, alt: "Kriti waving hello" },
  kritiCheer: { src: "/mascots/kriti-cheer.webp", width: 229, height: 273, alt: "Kriti cheering with both arms up" },
  kritiRead: { src: "/mascots/kriti-read.webp", width: 188, height: 280, alt: "Kriti reading a book" },
  kritiPoint: { src: "/mascots/kriti-point.webp", width: 211, height: 280, alt: "Kriti pointing ahead" },
  kritiShh: { src: "/mascots/kriti-shh.webp", width: 172, height: 276, alt: "Kriti with a finger to her lips, asking for quiet" },
  kritiProud: { src: "/mascots/kriti-proud.webp", width: 174, height: 278, alt: "Kriti standing proud, hands on her hips" },
  kritiThink: { src: "/mascots/kriti-think.webp", width: 196, height: 276, alt: "Kriti thinking" },
  kritiSleepy: { src: "/mascots/kriti-sleepy.webp", width: 171, height: 275, alt: "Kriti yawning" },
  uljhanPeek: { src: "/mascots/uljhan-peek.webp", width: 240, height: 237, alt: "Uljhan peeking out from behind a blank card" },
  uljhanShrug: { src: "/mascots/uljhan-shrug.webp", width: 238, height: 211, alt: "Uljhan shrugging" },
  uljhanTangled: { src: "/mascots/uljhan-tangled.webp", width: 235, height: 205, alt: "Uljhan tangled up in loose threads" },
  uljhanAsleep: { src: "/mascots/uljhan-asleep.webp", width: 187, height: 175, alt: "Uljhan sitting, fast asleep" },
  uljhanHop: { src: "/mascots/uljhan-hop.webp", width: 209, height: 240, alt: "Uljhan hopping happily" },
  uljhanTiptoe: { src: "/mascots/uljhan-tiptoe.webp", width: 173, height: 222, alt: "Uljhan tiptoeing past" },
};

// Horizontal strips: `frames` cells of frameWidth x height, played with CSS steps().
export const motions = {
  sieve: {
    src: "/mascots/duo-sieve-v3.webp", frames: 12, frameWidth: 235, height: 260, fps: 7, still: 5,
    alt: "Kriti holds the red FilterTube funnel. Uljhan hops in, wriggles through, and hops out the other side.",
  },
  medal: {
    src: "/mascots/duo-medal.webp", frames: 6, frameWidth: 273, height: 240, fps: 4, still: 5,
    alt: "Kriti puts a gold medal on Uljhan, and they both cheer.",
  },
  untangle: {
    src: "/mascots/duo-untangle.webp", frames: 6, frameWidth: 376, height: 260, fps: 3, still: 5,
    alt: "Uljhan is tangled in loose thread. Kriti kneels, untangles it, and Uljhan hops free.",
  },
};
