import type { Metadata } from "next";
import { getAnalyticsScriptProps } from "@/lib/analytics";
import { site } from "@/content/site";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://placeholder.invalid";
const title = `${site.name} — ${site.hero.code.h1}`;
const description = site.hero.code.lead;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    images: ["/og.png"],
    type: "website",
    url: "/",
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
  const analytics = getAnalyticsScriptProps();
  return (
    <html lang="en" data-scroll-behavior="smooth" className="antialiased">
      <head>
        {analytics ? <script defer src={analytics.src} data-domain={analytics.domain} /> : null}
      </head>
      <body className="flex min-h-screen flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
