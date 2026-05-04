import {
  Cormorant_Garamond,
  JetBrains_Mono,
  Outfit,
  Plus_Jakarta_Sans,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

import { SceneController } from "@/components/scene-controller";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const displayFont = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});

const editorialFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-editorial",
  weight: ["400", "500", "600"],
  style: ["italic"],
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["500", "700"],
});

export const metadata = {
  metadataBase: new URL("https://filtertube.in"),
  title: {
    default: "FilterTube",
    template: "%s | FilterTube",
  },
  description:
    "Local-first YouTube filtering for calmer feeds, safer family setups, and upcoming mobile, iPad, and TV control surfaces.",
  openGraph: {
    title: "FilterTube",
    description:
      "Calm the feed before it renders. FilterTube blocks channels, keywords, Shorts, comments, and more without sending your data anywhere.",
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
      "Local-first YouTube filtering for calmer feeds and safer family setups.",
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
