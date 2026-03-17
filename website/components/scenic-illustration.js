const scenePresets = {
  mobile: {
    sky: "bg-[linear-gradient(180deg,#8fd0f4_0%,#d3eff7_52%,#f6f1e8_100%)]",
    orb: "bg-[#fff2cb]",
    horizon: "bg-[linear-gradient(180deg,#7dc0d0_0%,#91bfab_100%)]",
    midground: "bg-[linear-gradient(180deg,#85b476_0%,#4d7f5d_100%)]",
    foreground: "bg-[linear-gradient(180deg,#89ac6e_0%,#567a45_100%)]",
    accent: "bg-[#f4c7a7]/70",
    detail: "bg-[#eef7ff]/74",
  },
  ios: {
    sky: "bg-[linear-gradient(180deg,#b5d8f8_0%,#edf6ff_56%,#fbf1e6_100%)]",
    orb: "bg-[#fff7dd]",
    horizon: "bg-[linear-gradient(180deg,#82bee2_0%,#7ca3d9_100%)]",
    midground: "bg-[linear-gradient(180deg,#9abdd9_0%,#6588ab_100%)]",
    foreground: "bg-[linear-gradient(180deg,#ecceb3_0%,#d1a285_100%)]",
    accent: "bg-[#f7d6c6]/70",
    detail: "bg-[#ffffff]/74",
  },
  ipados: {
    sky: "bg-[linear-gradient(180deg,#95cdf2_0%,#def1ff_54%,#f7f3ed_100%)]",
    orb: "bg-[#fff4d2]",
    horizon: "bg-[linear-gradient(180deg,#7ab2d7_0%,#8bc8c5_100%)]",
    midground: "bg-[linear-gradient(180deg,#7ca0a9_0%,#4e7283_100%)]",
    foreground: "bg-[linear-gradient(180deg,#d9d4c1_0%,#b0a487_100%)]",
    accent: "bg-[#dcefff]/72",
    detail: "bg-[#ffffff]/78",
  },
  android: {
    sky: "bg-[linear-gradient(180deg,#94d0e7_0%,#dff0e8_52%,#f4efe5_100%)]",
    orb: "bg-[#fff5cf]",
    horizon: "bg-[linear-gradient(180deg,#7eb89a_0%,#7ca18b_100%)]",
    midground: "bg-[linear-gradient(180deg,#6f9469_0%,#48663f_100%)]",
    foreground: "bg-[linear-gradient(180deg,#506945_0%,#31412b_100%)]",
    accent: "bg-[#efd3a9]/68",
    detail: "bg-[#ecf6ef]/72",
  },
  tv: {
    sky: "bg-[linear-gradient(180deg,#7eb5ef_0%,#f6c29a_54%,#f9ede2_100%)]",
    orb: "bg-[#ffe7c1]",
    horizon: "bg-[linear-gradient(180deg,#7da3c8_0%,#c58f77_100%)]",
    midground: "bg-[linear-gradient(180deg,#6b8a7a_0%,#4b6657_100%)]",
    foreground: "bg-[linear-gradient(180deg,#8a9a69_0%,#5f6b45_100%)]",
    accent: "bg-[#f6d0bc]/72",
    detail: "bg-[#ffffff]/76",
  },
  "android-tv": {
    sky: "bg-[linear-gradient(180deg,#5b86c3_0%,#8bc4dc_42%,#f7d8b8_100%)]",
    orb: "bg-[#fce1bc]",
    horizon: "bg-[linear-gradient(180deg,#536f93_0%,#7b92a6_100%)]",
    midground: "bg-[linear-gradient(180deg,#445669_0%,#2e3f4f_100%)]",
    foreground: "bg-[linear-gradient(180deg,#343d4c_0%,#1f2630_100%)]",
    accent: "bg-[#b8d7f4]/60",
    detail: "bg-[#f4efe8]/72",
  },
  "fire-tv": {
    sky: "bg-[linear-gradient(180deg,#7c98d2_0%,#f2b98e_48%,#f6e6d3_100%)]",
    orb: "bg-[#ffe2bf]",
    horizon: "bg-[linear-gradient(180deg,#8f6f5f_0%,#b88d69_100%)]",
    midground: "bg-[linear-gradient(180deg,#6b594a_0%,#4b3e35_100%)]",
    foreground: "bg-[linear-gradient(180deg,#533f31_0%,#2f241d_100%)]",
    accent: "bg-[#f1cd8e]/62",
    detail: "bg-[#fff5ea]/72",
  },
  kids: {
    sky: "bg-[linear-gradient(180deg,#8ecff4_0%,#f6f2ff_46%,#fff0ea_100%)]",
    orb: "bg-[#fff5db]",
    horizon: "bg-[linear-gradient(180deg,#a0c8d4_0%,#9acb96_100%)]",
    midground: "bg-[linear-gradient(180deg,#e8b9c9_0%,#d691a6_100%)]",
    foreground: "bg-[linear-gradient(180deg,#96c07d_0%,#5f8f4e_100%)]",
    accent: "bg-[#ffdfe8]/78",
    detail: "bg-[#fffaf4]/78",
  },
  "ml-ai": {
    sky: "bg-[linear-gradient(180deg,#09111d_0%,#1c2c48_42%,#415d7c_100%)]",
    orb: "bg-[#e5eefb]",
    horizon: "bg-[linear-gradient(180deg,#243850_0%,#33445b_100%)]",
    midground: "bg-[linear-gradient(180deg,#202d3c_0%,#14202b_100%)]",
    foreground: "bg-[linear-gradient(180deg,#111922_0%,#091018_100%)]",
    accent: "bg-[#81a9e3]/42",
    detail: "bg-[#ffffff]/10",
  },
  footer: {
    sky: "bg-[linear-gradient(180deg,#0e1a2e_0%,#234782_36%,#6992d0_68%,#b9d8ff_100%)]",
    orb: "bg-[#eef6ff]",
    horizon: "bg-[linear-gradient(180deg,#274d79_0%,#3d6898_100%)]",
    midground: "bg-[linear-gradient(180deg,#325676_0%,#203d5b_100%)]",
    foreground: "bg-[linear-gradient(180deg,#17304d_0%,#0b1a2e_100%)]",
    accent: "bg-[#dceeff]/32",
    detail: "bg-[#ffffff]/12",
  },
};

function Tree({ className }) {
  return (
    <div className={`absolute ${className}`}>
      <div className="absolute left-1/2 top-10 h-16 w-2 -translate-x-1/2 rounded-full bg-[#3d2d24]/70" />
      <div className="absolute left-1/2 top-0 h-14 w-14 -translate-x-1/2 rounded-full bg-[#f2d4df]/86 blur-[1px]" />
      <div className="absolute left-[60%] top-5 h-10 w-10 -translate-x-1/2 rounded-full bg-[#f7e8ee]/66" />
      <div className="absolute left-[34%] top-6 h-8 w-8 -translate-x-1/2 rounded-full bg-[#efd2db]/72" />
    </div>
  );
}

function Lamp({ className }) {
  return (
    <div className={`absolute ${className}`}>
      <div className="absolute left-1/2 top-0 h-24 w-1.5 -translate-x-1/2 rounded-full bg-[#151a22]/76" />
      <div className="absolute left-1/2 top-3 h-5 w-5 -translate-x-1/2 rounded-full bg-[#f5f0cb]/90 shadow-[0_0_30px_rgba(255,245,189,0.68)]" />
    </div>
  );
}

export function ScenicIllustration({
  variant = "mobile",
  className = "",
  label,
  title,
  subtitle,
  footer = false,
}) {
  const scene = scenePresets[variant] ?? scenePresets.mobile;

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-white/14 ${className}`}
    >
      <div className={`absolute inset-0 ${scene.sky}`} />
      <div
        className={`absolute left-[14%] top-[14%] h-[4.5rem] w-[4.5rem] rounded-full blur-[2px] ${scene.orb} ${
          footer ? "h-20 w-20" : ""
        }`}
      />
      <div className={`absolute inset-x-[8%] bottom-[28%] h-[32%] rounded-[50%] blur-sm ${scene.horizon}`} />
      <div className={`absolute inset-x-[4%] bottom-[14%] h-[30%] rounded-[50%] ${scene.midground}`} />
      <div className={`absolute inset-x-0 bottom-0 h-[28%] ${scene.foreground}`} />
      <div className={`absolute bottom-[16%] left-[8%] h-14 w-14 rounded-full blur-3xl ${scene.accent}`} />
      <div className={`absolute right-[10%] top-[18%] h-20 w-20 rounded-full blur-3xl ${scene.accent}`} />

      {variant === "kids" ? (
        <>
          <Tree className="bottom-[18%] left-[12%] h-28 w-20" />
          <Tree className="bottom-[12%] right-[10%] h-32 w-24 scale-[0.86]" />
        </>
      ) : null}

      {variant === "footer" ? (
        <>
          <Lamp className="bottom-[20%] left-[7%] h-28 w-8" />
          <Lamp className="bottom-[20%] right-[9%] h-32 w-8" />
          <div className="absolute bottom-[14%] left-[14%] h-10 w-10 rounded-full bg-[#dbeaff]/35 blur-lg" />
          <div className="absolute bottom-[10%] right-[18%] h-12 w-12 rounded-full bg-[#dbeaff]/26 blur-lg" />
          <div className="absolute bottom-[12%] left-[20%] h-16 w-[18%] rounded-[50%] border border-white/8 bg-[#0b1422]/28" />
          <div className="absolute bottom-[10%] right-[22%] h-12 w-[12%] rounded-[50%] border border-white/8 bg-[#0c1627]/26" />
        </>
      ) : null}

      {variant === "ml-ai" ? (
        <>
          <div className="absolute left-[18%] top-[22%] h-1.5 w-1.5 rounded-full bg-white/90" />
          <div className="absolute left-[30%] top-[18%] h-1 w-1 rounded-full bg-white/80" />
          <div className="absolute right-[22%] top-[22%] h-1.5 w-1.5 rounded-full bg-white/90" />
          <div className="absolute right-[30%] top-[14%] h-1 w-1 rounded-full bg-white/70" />
          <div className="absolute bottom-[18%] left-1/2 h-20 w-20 -translate-x-1/2 rounded-full border border-white/18 bg-[#0d1724]/56" />
          <div className="absolute bottom-[22%] left-1/2 h-10 w-10 -translate-x-1/2 rounded-full bg-[#81a9e3]/20 blur-xl" />
        </>
      ) : null}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_42%,rgba(9,12,18,0.22)_100%)]" />
      <div className={`absolute inset-0 ${scene.detail} mix-blend-soft-light`} />

      {(label || title || subtitle) && !footer ? (
        <div className="absolute inset-x-6 bottom-6 rounded-[1.6rem] border border-white/16 bg-[rgba(10,14,20,0.26)] p-5 text-white shadow-[0_20px_50px_-40px_rgba(0,0,0,0.7)] backdrop-blur-md">
          {label ? (
            <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/70">
              {label}
            </p>
          ) : null}
          {title ? (
            <h3 className="mt-3 max-w-[14ch] text-balance font-display text-3xl tracking-[-0.05em]">
              {title}
            </h3>
          ) : null}
          {subtitle ? (
            <p className="mt-3 max-w-[34ch] text-sm leading-7 text-white/76">
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
