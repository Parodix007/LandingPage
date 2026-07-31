// next.config.ts intentionally DUPLICATES the header/CSP values from scripts/csp.mjs instead of
// importing them — see the comment at the top of next.config.ts: `server.js` (Passenger) loads
// next.config.ts at production process startup, so it must be self-sufficient and cannot risk a
// boot-time crash from an import Hostinger's build pipeline might not copy into the runtime
// directory. That constraint means the two copies CAN silently drift apart. This test is the
// guard against that: it imports both next.config.ts's headers() and scripts/csp.mjs's builders
// for the same env values and asserts they produce identical output, turning any future edit to
// one copy without the other into a red test.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiOriginFrom, buildCsp, buildDemoHeaders, buildSecurityHeaders, DEMO_CSP } from "../../scripts/csp.mjs";

const API_BASE_URL = "https://api.calmsoft.pro";
const GA_ID = "G-TESTID1234";

describe("next.config.ts headers() vs scripts/csp.mjs (anti-drift)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", API_BASE_URL);
    vi.stubEnv("NEXT_PUBLIC_GA_ID", GA_ID);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("the /:path* entry has exactly the same key/value pairs as buildSecurityHeaders()", async () => {
    const { default: nextConfig } = await import("../../next.config");
    const entries = await nextConfig.headers!();

    const mainEntry = entries.find((entry) => entry.source === "/:path*");
    expect(mainEntry).toBeDefined();

    const expected = buildSecurityHeaders({ apiOrigin: apiOriginFrom(API_BASE_URL), gaId: GA_ID });
    expect(mainEntry!.headers).toEqual(expected);
  });

  it("the /demo/:path* entry has exactly the same key/value pairs as buildDemoHeaders()", async () => {
    const { default: nextConfig } = await import("../../next.config");
    const entries = await nextConfig.headers!();

    const demoEntry = entries.find((entry) => entry.source === "/demo/:path*");
    expect(demoEntry).toBeDefined();
    expect(demoEntry!.headers).toEqual(buildDemoHeaders());
  });

  it("lists /demo/:path* AFTER /:path*, so the looser demo CSP wins (last-match-wins per Next docs)", async () => {
    const { default: nextConfig } = await import("../../next.config");
    const entries = await nextConfig.headers!();

    const mainIndex = entries.findIndex((entry) => entry.source === "/:path*");
    const demoIndex = entries.findIndex((entry) => entry.source === "/demo/:path*");
    expect(mainIndex).toBeGreaterThanOrEqual(0);
    expect(demoIndex).toBeGreaterThan(mainIndex);
  });

  it("the CSP strings themselves are character-for-character identical between the two copies", async () => {
    const { default: nextConfig } = await import("../../next.config");
    const entries = await nextConfig.headers!();

    const mainCsp = entries
      .find((entry) => entry.source === "/:path*")!
      .headers.find((h) => h.key === "Content-Security-Policy")!.value;
    const demoCsp = entries
      .find((entry) => entry.source === "/demo/:path*")!
      .headers.find((h) => h.key === "Content-Security-Policy")!.value;

    expect(mainCsp).toBe(buildCsp({ apiOrigin: apiOriginFrom(API_BASE_URL), gaId: GA_ID }));
    expect(demoCsp).toBe(DEMO_CSP);
  });
});
