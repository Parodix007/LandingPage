import type { Metadata } from "next";
import { getGaId } from "@/lib/analytics";
import { CONSENT_KEY } from "@/lib/consent";
import { site } from "@/content/site";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { ConsentBanner } from "@/components/interactive/ConsentBanner";
import "./globals.css";

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
    <html lang="pl" data-scroll-behavior="smooth" className="antialiased">
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
      </head>
      <body className="flex min-h-screen flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
        {gaId ? <ConsentBanner /> : null}
      </body>
    </html>
  );
}
