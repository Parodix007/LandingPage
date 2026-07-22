import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CONSENT_KEY,
  getStoredConsent,
  setConsent,
  reopenConsentBanner,
  onConsentReopen,
} from "./consent";

describe("getStoredConsent", () => {
  it("returns null when nothing is stored", () => {
    expect(getStoredConsent()).toBeNull();
  });

  it("returns null for an unrecognized stored value", () => {
    window.localStorage.setItem(CONSENT_KEY, "yes-please");
    expect(getStoredConsent()).toBeNull();
  });
});

describe("setConsent", () => {
  afterEach(() => {
    delete (window as { gtag?: unknown }).gtag;
  });

  it("persists 'granted' — round-trips through getStoredConsent", () => {
    setConsent("granted");
    expect(getStoredConsent()).toBe("granted");
    expect(window.localStorage.getItem(CONSENT_KEY)).toBe("granted");
  });

  it("persists 'denied' — round-trips through getStoredConsent", () => {
    setConsent("denied");
    expect(getStoredConsent()).toBe("denied");
  });

  it("calls window.gtag('consent','update', {...}) when gtag is present", () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    setConsent("granted");

    expect(gtag).toHaveBeenCalledWith("consent", "update", { analytics_storage: "granted" });
  });

  it("does not throw when window.gtag is absent", () => {
    expect(() => setConsent("denied")).not.toThrow();
  });
});

describe("reopenConsentBanner / onConsentReopen", () => {
  it("fires the subscriber when reopenConsentBanner() is called", () => {
    const cb = vi.fn();
    const unsubscribe = onConsentReopen(cb);

    reopenConsentBanner();

    expect(cb).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("unsubscribe stops further notifications", () => {
    const cb = vi.fn();
    const unsubscribe = onConsentReopen(cb);
    unsubscribe();

    reopenConsentBanner();

    expect(cb).not.toHaveBeenCalled();
  });
});
