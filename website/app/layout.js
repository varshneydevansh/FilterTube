import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

import { SceneController } from "@/components/scene-controller";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

// Fonts are bundled in app/fonts (Latin variable WOFF2 from Google Fonts, SIL Open Font
// License) so builds never fetch fonts over the network; Vercel builds failed when that fetch did.
const displayFont = localFont({
  src: "./fonts/outfit-latin.woff2",
  variable: "--font-display",
  weight: "400 800",
  display: "swap",
});

const bodyFont = localFont({
  src: "./fonts/plus-jakarta-sans-latin.woff2",
  variable: "--font-body",
  weight: "400 800",
  display: "swap",
});

const editorialFont = localFont({
  src: "./fonts/cormorant-garamond-italic-latin.woff2",
  variable: "--font-editorial",
  weight: "400 600",
  style: "italic",
  display: "swap",
});

const monoFont = localFont({
  src: "./fonts/jetbrains-mono-latin.woff2",
  variable: "--font-mono",
  weight: "500 700",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://filtertube.in"),
  title: {
    default: "FilterTube",
    template: "%s | FilterTube",
  },
  description:
    "Calmer viewing on Android and in your browser. Explore family profiles, local filtering, verified peer-to-peer sharing, a direct iPhone and iPad install, and TV development.",
  openGraph: {
    title: "FilterTube",
    description:
      "Your feed, your rules. FilterTube brings local filtering, family controls and verified encrypted device sharing to Android phones, tablets and TVs, iPhone, iPad and browsers.",
    url: "https://filtertube.in",
    siteName: "FilterTube",
    images: [
      {
        url: "/brand/logo.png",
        width: 512,
        height: 512,
        alt: "FilterTube logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FilterTube",
    description:
      "Local-first video filtering for calmer feeds and safer family setups.",
    images: ["/brand/logo.png"],
  },
  alternates: {
    canonical: "https://filtertube.in",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-scene="day"
      data-theme="light"
      data-theme-preference="light"
      suppressHydrationWarning
      className={`${displayFont.variable} ${bodyFont.variable} ${editorialFont.variable} ${monoFont.variable}`}
    >
      <body className="bg-[var(--color-cream)] text-[var(--color-ink)] antialiased">
        <Script id="filtertube-js" strategy="beforeInteractive">
          {`document.documentElement.classList.add('js');
try {
  const root = document.documentElement;
  const storedTheme = window.localStorage.getItem('filtertube-theme') === 'dark' ? 'dark' : 'light';
  const hour = new Date().getHours();
  const scene =
    hour >= 20 || hour < 5
      ? 'night'
      : hour >= 17
        ? 'sunset'
        : hour >= 10
          ? 'day'
          : 'dawn';
  root.dataset.themePreference = storedTheme;
  root.dataset.theme = storedTheme;
  root.dataset.scene = scene;
  root.style.colorScheme = storedTheme;
} catch (error) {
  document.documentElement.dataset.themePreference = 'light';
  document.documentElement.dataset.theme = 'light';
  document.documentElement.dataset.scene = 'day';
  document.documentElement.style.colorScheme = 'light';
}`}
        </Script>
        <SceneController />
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <div className="relative overflow-clip">
          <SiteHeader />
          <main id="content" className="relative z-10">
            {children}
          </main>
          <SiteFooter />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
