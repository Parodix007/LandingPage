import type { MetadataRoute } from "next";

// required for `output: "export"` (static export) — app-router special routes
// (manifest/sitemap/robots) must opt into force-static or the build fails.
export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://placeholder.invalid";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/demo/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
