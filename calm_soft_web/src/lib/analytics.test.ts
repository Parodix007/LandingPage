import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const importAnalytics = async () => await import("./analytics");

describe("getGaId", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns the measurement id when NEXT_PUBLIC_GA_ID is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    const { getGaId } = await importAnalytics();
    expect(getGaId()).toBe("G-TEST123");
  });

  it("returns null when NEXT_PUBLIC_GA_ID is unset", async () => {
    const { getGaId } = await importAnalytics();
    expect(getGaId()).toBeNull();
  });
});

describe("track", () => {
  afterEach(() => {
    delete (window as { gtag?: unknown }).gtag;
  });

  it("no-ops without throwing when window.gtag is undefined", async () => {
    const { track, EVENT_LEAD } = await importAnalytics();
    expect(() => track(EVENT_LEAD)).not.toThrow();
  });

  it("delegates to window.gtag with the event name and params when gtag is present", async () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    const { track, EVENT_LEAD_DETAILS } = await importAnalytics();

    track(EVENT_LEAD_DETAILS, { area: "core" });

    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", EVENT_LEAD_DETAILS, { area: "core" });
  });

  it("forwards undefined params when called without them", async () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    const { track, EVENT_CALENDLY } = await importAnalytics();

    track(EVENT_CALENDLY);

    expect(gtag).toHaveBeenCalledWith("event", EVENT_CALENDLY, undefined);
  });
});
