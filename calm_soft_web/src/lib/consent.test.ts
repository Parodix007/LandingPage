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

  it("calls window.gtag('consent','update', {...}) with all 4 signals when granted", () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    setConsent("granted");

    expect(gtag).toHaveBeenCalledWith("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
  });

  it("calls window.gtag('consent','update', {...}) with all 4 signals when denied", () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    setConsent("denied");

    expect(gtag).toHaveBeenCalledWith("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
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
