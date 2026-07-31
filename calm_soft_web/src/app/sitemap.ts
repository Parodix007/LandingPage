import type { MetadataRoute } from "next";
import { services } from "@/content/services";

// required for `output: "export"` (static export) — app-router special routes
// (manifest/sitemap/robots) must opt into force-static or the build fails.
export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://placeholder.invalid";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl },
    { url: `${siteUrl}/pricing/` },
    { url: `${siteUrl}/work/` },
    // Derived from services, never hand-written (2026-07-31 service-pages-restructure design)
    // — one /uslugi/<slug>/ entry per service, in services.ts's own order. The old mockup index
    // page is retired outright (see design doc "Cost accepted") — not redirected, not kept
    // unlinked.
    ...services.map((s) => ({ url: `${siteUrl}/uslugi/${s.slug}/` })),
  ];
}
