import type { Metadata } from "next";
import localFont from "next/font/local";
import { getGaId } from "@/lib/analytics";
import { CONSENT_KEY } from "@/lib/consent";
import { site } from "@/content/site";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { ConsentBanner } from "@/components/interactive/ConsentBanner";
import { RevealOnScroll } from "@/components/interactive/RevealOnScroll";
import { PointerFx } from "@/components/interactive/PointerFx";
import { PageTransition } from "@/components/interactive/PageTransition";
import "./globals.css";

// BRIEF #4 (spec 2026-11-06 §2b): Inter + JetBrains Mono self-hosted przez next/font/local.
// Pliki zmienne woff2 w src/fonts/ (subsety latin + latin-ext, licencje OFL 1.1 obok plików).
// Zero CDN — CSP `font-src 'self'` bez zmian. W Next 16 `next/font/local` NIE ma opcji
// `unicodeRanges`/`adjustFallback` (zweryfikowane w dist/compiled/@next/font types) —
// równoważnik: jeden `localFont` na subset + `declarations` z `unicode-range` (range'e z
// Google Fonts css2). Bez range'ów przeglądarka pobrałby zawsze ostatni plik (latin-ext)
// i polskie diakryty nie wpasowałyby się w subset latin. BRIEF #4a: pliki *-latin-ext.woff2
// to MIKRO-SUBSET PL (Google css2 `text=<zestaw PL>`): Inter-ext 10 KB zamiast 85 KB,
// JBM-ext 4,5 KB zamiast 11,6 KB — strona jest wyłącznie po polsku, więc znaki latin-ext
// spoza zestawu PL renderują się fallbackiem systemowym (udokumentowane ograniczenie).
// `preload: false` zostaje tylko jako flaga next/font: Next 16 i tak NIE emituje
// <link rel="preload"> dla fontów CSS-variable w eksporcie statycznym (discoveries
// 2026-11-06) — preload wszystkich 4 plików (~94 KB łącznie, budżet ≤120 KB z §2b)
// wstrzykuje postbuild: scripts/gen-font-preload.mjs. Kolejność zmiennych w
// globals.css (@theme): najpierw *-ext (wąski range), potem latin z kalibrowanym
// fallbackiem — inaczej fallback system-ui "zjadłby" znaki latin-ext przed webfontem.
// UWAGA: transform SWC wymaga w wartościach localFont literałów — zakresów nie wolno
// wyciągać do wspólnych stałych ("Font loader values must be explicitly written literals").
const inter = localFont({
  src: "../fonts/inter-latin.woff2",
  weight: "400 700",
  display: "swap",
  // kalibracja metryk fallbacku (CLS) — next/font/local przyjmuje 'Arial' | 'Times New Roman' | false
  adjustFontFallback: "Arial",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
  variable: "--font-inter",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

// Subset EXT = mikro-subset PL (brief #4a): polskie diakryty ą ę ł ż ź ć ń ś ó (+ wersje
// wielkie) i interpunkcja „ ” « » – — ° § z zakresami pokrewnymi wg Google css2 `text=`.
// Znaki latin-ext spoza tego zestawu → fallback systemowy (strona wyłącznie PL).
// Brak fallbacków/adjust w zmiennej: rodzina wpasowuje się wyłącznie przez własny
// unicode-range, a metryki i tak kalibruje wywołanie `inter` stojące za nią w stacku.
const interExt = localFont({
  src: "../fonts/inter-latin-ext.woff2",
  weight: "400 700",
  display: "swap",
  // preload:false = flaga next/font (Next 16 i tak nie emituje preload dla CSS-variable);
  // faktyczny preload wstrzykuje scripts/gen-font-preload.mjs w postbuild.
  preload: false,
  adjustFontFallback: false,
  variable: "--font-inter-ext",
  declarations: [
    {
      prop: "unicode-range",
      // mikro-subset PL z Google css2 (inter.css, v20) — literal, patrz uwaga SWC wyżej
      value:
        "U+41, U+43, U+45, U+4e-4f, U+53, U+5a, U+61, U+63, U+65, U+6e-6f, U+73, U+7a, U+a7, U+ab, U+b0, U+bb, U+c1, U+c9, U+d3, U+e1, U+e9, U+f3, U+104-107, U+10a-10b, U+116-119, U+141-144, U+15a-15b, U+179-17c, U+1ea-1eb, U+226-227, U+22e-22f, U+301, U+307, U+328, U+1e44-1e45, U+1e60-1e61, U+1e64-1e65, U+2013-2014, U+201d-201e",
    },
  ],
});

const jetbrainsMono = localFont({
  src: "../fonts/jetbrains-mono-latin.woff2",
  weight: "400 600",
  display: "swap",
  // false: kalibracja 'Arial'/'Times New Roman' nie ma sensu dla fontu mono; systemowy
  // fallback monospace ma zbliżoną szerokość znaku (mierzony CLS ≈ 0 na akcentach mono)
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "Liberation Mono", "monospace"],
  variable: "--font-jetbrains-mono",
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    },
  ],
});

// EXT mikro-subset PL dla JBM (brief #4a) — te same zakresy co w inter.css (jbm.css v24);
// akcenty mono z polskimi znakami (eyebrow, liczby, watermark) renderują się webfontem.
const jetbrainsMonoExt = localFont({
  src: "../fonts/jetbrains-mono-latin-ext.woff2",
  weight: "400 600",
  display: "swap",
  preload: false, // patrz interExt — preload wstrzykuje gen-font-preload.mjs
  adjustFontFallback: false,
  variable: "--font-jetbrains-mono-ext",
  declarations: [
    {
      prop: "unicode-range",
      // mikro-subset PL z Google css2 (jbm.css) — literal, patrz uwaga SWC wyżej
      value:
        "U+41, U+43, U+45, U+4e-4f, U+53, U+5a, U+61, U+63, U+65, U+6e-6f, U+73, U+7a, U+a7, U+ab, U+b0, U+bb, U+c1, U+c9, U+d3, U+e1, U+e9, U+f3, U+104-107, U+10a-10b, U+116-119, U+141-144, U+15a-15b, U+179-17c, U+1ea-1eb, U+226-227, U+22e-22f, U+301, U+307, U+328, U+1e44-1e45, U+1e60-1e61, U+1e64-1e65, U+2013-2014, U+201d-201e",
    },
  ],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://placeholder.invalid";
// HANDOFF §8 (2026-07-22 pl-copy): explicit PL title/description rather than deriving from
// site.hero.code.h1/lead — the mandated metadata copy differs slightly from the hero's own
// h1/lead wording.
const title = `${site.name} — Spokojna strona oprogramowania`;
const description =
  "Systemy klasy enterprise bez enterprise'owej dramy: jeden inżynier, jasny proces i uczciwe terminy. Rozmawiasz z osobą, która pisze kod.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: "/" },
  verification: {
    other: {
      "facebook-domain-verification": "k01jqcwthdd7f650elabjxpp17lm3q",
    },
  },
  openGraph: {
    title,
    description,
    images: ["/og.png"],
    type: "website",
    url: "/",
    locale: "pl_PL",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = getGaId();
  return (
    <html
      lang="pl"
      data-scroll-behavior="smooth"
      className={`antialiased ${inter.variable} ${interExt.variable} ${jetbrainsMono.variable} ${jetbrainsMonoExt.variable}`}
    >
      <head>
        {gaId ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            {/* Consent Mode v2 "advanced" bootstrap (SPEC: 2026-07-22 GA4 addendum) — gtag.js
                itself loads async above, but this inline script must run first and
                synchronously: it (1) sets up dataLayer/gtag before any queued call, (2)
                defaults every consent signal to denied with a short wait_for_update so gtag.js
                has a moment to see a real decision before pinging, (3) restores a returning
                visitor's stored decision from localStorage (cs-consent-v1) before hydration —
                so ConsentBanner never causes a visible consent "flash"; since the 2026-07-23
                Google Ads conversion hookup the stored decision drives all four Consent Mode
                signals (analytics + the three Ads signals), not analytics alone — then (4)
                configures the tag. 'unsafe-inline' is already required in script-src for this
                pattern (documented owner-accepted CSP deviation, spec §8.5). */}
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
try{var c=localStorage.getItem(${JSON.stringify(CONSENT_KEY)});if(c==='granted'||c==='denied'){gtag('consent','update',{analytics_storage:c,ad_storage:c,ad_user_data:c,ad_personalization:c});}}catch(e){}
gtag('js',new Date());
gtag('config',${JSON.stringify(gaId)});`,
              }}
            />
          </>
        ) : null}
        {/* Kurtyna wejściowa tranzycji (brief #9): klasa musi powstać PRZED pierwszym
            paintem, dlatego inline w <head> — ten sam wzór co bootstrap GA. */}
        <script
          id="cs-tr-in"
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("cs-tr"))document.documentElement.classList.add("tr-in")}catch(e){}`,
          }}
        />
      </head>
      <body className="relative min-h-screen">
        <div aria-hidden="true" className="global-background pointer-events-none fixed inset-0 z-0" />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
          {gaId ? <ConsentBanner /> : null}
          <RevealOnScroll />
          <PointerFx />
          <PageTransition />
        </div>
      </body>
    </html>
  );
}
