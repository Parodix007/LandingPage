import type { MetadataRoute } from "next";

// required for `output: "export"` (static export) — app-router special routes
// (manifest/sitemap/robots) must opt into force-static or the build fails.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "calm_soft",
    short_name: "calm_soft",
    start_url: "/",
    display: "browser",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
  };
}
