const scenicSurface =
  "bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(246,241,234,0.76))]";
const scenicChip =
  "border-black/10 bg-white/72 text-[#1d1b18] shadow-[inset_0_1px_0_rgba(255,255,255,0.56)]";
const scenicIconShell =
  "bg-[rgba(255,255,255,0.62)] shadow-[inset_0_1px_0_rgba(255,255,255,0.68)]";

export const tonePresets = {
  sage: {
    heroBackdrop:
      "bg-[radial-gradient(circle_at_18%_18%,rgba(189,216,178,0.86),transparent_28%),radial-gradient(circle_at_80%_16%,rgba(247,212,184,0.6),transparent_26%),linear-gradient(180deg,#f7fbf2_0%,#edf4e7_56%,#dde8d8_100%)]",
    surface: scenicSurface,
    primaryOrb: "bg-[#c6ddb6]/60",
    secondaryOrb: "bg-[#f1c7a4]/55",
    accentText: "text-[#8e4a3d]",
    accentBadge: "bg-[#f0d9d2]/82 text-[#824038]",
    chip: scenicChip,
    iconShell: `${scenicIconShell} text-[#5f7553]`,
  },
  pearl: {
    heroBackdrop:
      "bg-[radial-gradient(circle_at_20%_16%,rgba(237,239,248,0.92),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(247,220,214,0.6),transparent_24%),linear-gradient(180deg,#fafbff_0%,#f2f2f7_58%,#e8e8ef_100%)]",
    surface: scenicSurface,
    primaryOrb: "bg-[#d8deef]/58",
    secondaryOrb: "bg-[#f4d6cf]/52",
    accentText: "text-[#8a4d43]",
    accentBadge: "bg-[#f4e1da]/80 text-[#83433b]",
    chip: scenicChip,
    iconShell: `${scenicIconShell} text-[#697089]`,
  },
  sky: {
    heroBackdrop:
      "bg-[radial-gradient(circle_at_22%_18%,rgba(194,221,247,0.92),transparent_30%),radial-gradient(circle_at_78%_14%,rgba(250,223,204,0.6),transparent_22%),linear-gradient(180deg,#f6fbff_0%,#e9f4fb_56%,#d7e7ef_100%)]",
    surface: scenicSurface,
    primaryOrb: "bg-[#c7def2]/62",
    secondaryOrb: "bg-[#f4d3b8]/56",
    accentText: "text-[#8e5442]",
    accentBadge: "bg-[#f1dfd5]/80 text-[#885143]",
    chip: scenicChip,
    iconShell: `${scenicIconShell} text-[#587482]`,
  },
  forest: {
    heroBackdrop:
      "bg-[radial-gradient(circle_at_20%_18%,rgba(178,209,188,0.92),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(235,210,169,0.55),transparent_24%),linear-gradient(180deg,#f4faf5_0%,#e7f0e6_56%,#d5e1d3_100%)]",
    surface: scenicSurface,
    primaryOrb: "bg-[#bbd6bf]/62",
    secondaryOrb: "bg-[#ead2ae]/52",
    accentText: "text-[#84513e]",
    accentBadge: "bg-[#efddd3]/76 text-[#7f4b3c]",
    chip: scenicChip,
    iconShell: `${scenicIconShell} text-[#56715c]`,
  },
  sunset: {
    heroBackdrop:
      "bg-[radial-gradient(circle_at_20%_20%,rgba(250,214,187,0.94),transparent_28%),radial-gradient(circle_at_78%_16%,rgba(220,210,247,0.44),transparent_24%),linear-gradient(180deg,#fdf7f2_0%,#f6eadf_50%,#eadccf_100%)]",
    surface: scenicSurface,
    primaryOrb: "bg-[#f2cca9]/60",
    secondaryOrb: "bg-[#ddd6f3]/45",
    accentText: "text-[#92493b]",
    accentBadge: "bg-[#f3ddd5]/82 text-[#884135]",
    chip: scenicChip,
    iconShell: `${scenicIconShell} text-[#8b624d]`,
  },
  amber: {
    heroBackdrop:
      "bg-[radial-gradient(circle_at_18%_18%,rgba(244,215,164,0.92),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(240,201,180,0.55),transparent_24%),linear-gradient(180deg,#fff9ef_0%,#f8eedf_56%,#eddfca_100%)]",
    surface: scenicSurface,
    primaryOrb: "bg-[#efd19b]/58",
    secondaryOrb: "bg-[#f0cab3]/48",
    accentText: "text-[#8f5339]",
    accentBadge: "bg-[#f5e1d5]/78 text-[#88503a]",
    chip: scenicChip,
    iconShell: `${scenicIconShell} text-[#8f6a47]`,
  },
  rose: {
    heroBackdrop:
      "bg-[radial-gradient(circle_at_20%_20%,rgba(243,209,217,0.9),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(248,223,200,0.56),transparent_24%),linear-gradient(180deg,#fdf8f8_0%,#f6ecec_58%,#eddfdf_100%)]",
    surface: scenicSurface,
    primaryOrb: "bg-[#efccd4]/58",
    secondaryOrb: "bg-[#f4d5bf]/48",
    accentText: "text-[#8a4552]",
    accentBadge: "bg-[#f5dde3]/78 text-[#843c49]",
    chip: scenicChip,
    iconShell: `${scenicIconShell} text-[#8f6070]`,
  },
  ink: {
    heroBackdrop:
      "bg-[radial-gradient(circle_at_22%_20%,rgba(179,198,214,0.24),transparent_28%),radial-gradient(circle_at_80%_14%,rgba(205,168,150,0.24),transparent_24%),linear-gradient(180deg,#14181f_0%,#1a212a_54%,#202731_100%)]",
    surface:
      "bg-[linear-gradient(180deg,rgba(29,36,46,0.96),rgba(16,22,30,0.98))]",
    primaryOrb: "bg-[#7992a8]/28",
    secondaryOrb: "bg-[#b68b75]/22",
    accentText: "text-[#f3c4b4]",
    accentBadge: "bg-white/12 text-white/84",
    chip: "border-white/12 bg-[color:var(--color-glass)] text-white/78",
    iconShell: "bg-[color:var(--color-glass)] text-white/80",
  },
};

export function getTonePreset(tone) {
  return tonePresets[tone] ?? tonePresets.sage;
}
