import { beforeEach, describe, expect, it, vi } from "vitest";

const importAnalytics = async () => await import("./analytics");

describe("getAnalyticsScriptProps", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns { src, domain } when both env vars are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_SRC", "https://analytics.test/script.js");
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_DOMAIN", "calmsoft.com");
    const { getAnalyticsScriptProps } = await importAnalytics();
    expect(getAnalyticsScriptProps()).toEqual({
      src: "https://analytics.test/script.js",
      domain: "calmsoft.com",
    });
  });

  it("returns null when NEXT_PUBLIC_ANALYTICS_SRC is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_DOMAIN", "calmsoft.com");
    const { getAnalyticsScriptProps } = await importAnalytics();
    expect(getAnalyticsScriptProps()).toBeNull();
  });

  it("returns null when NEXT_PUBLIC_ANALYTICS_DOMAIN is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_SRC", "https://analytics.test/script.js");
    const { getAnalyticsScriptProps } = await importAnalytics();
    expect(getAnalyticsScriptProps()).toBeNull();
  });

  it("returns null when neither env var is set", async () => {
    const { getAnalyticsScriptProps } = await importAnalytics();
    expect(getAnalyticsScriptProps()).toBeNull();
  });
});
