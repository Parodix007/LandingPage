import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentBanner } from "./ConsentBanner";
import { site } from "@/content/site";
import { CONSENT_KEY, reopenConsentBanner } from "@/lib/consent";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const consent = site.consent;

describe("ConsentBanner", () => {
  afterEach(() => {
    delete (window as { gtag?: unknown }).gtag;
  });

  it("shows when no consent decision is stored", () => {
    render(<ConsentBanner />);

    expect(screen.getByRole("region", { name: consent.settingsLabel })).toBeInTheDocument();
    expect(screen.getByText(consent.text)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: consent.accept })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: consent.decline })).toBeInTheDocument();
  });

  it("does not render when a decision is already stored", () => {
    window.localStorage.setItem(CONSENT_KEY, "granted");

    render(<ConsentBanner />);

    expect(screen.queryByRole("region", { name: consent.settingsLabel })).not.toBeInTheDocument();
  });

  it("accept persists 'granted', calls gtag consent update, and hides the banner", async () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    const user = userEvent.setup();
    render(<ConsentBanner />);

    await user.click(screen.getByRole("button", { name: consent.accept }));

    expect(window.localStorage.getItem(CONSENT_KEY)).toBe("granted");
    // 2026-07-23 Google Ads conversion hookup — setConsent now drives all 4 Consent Mode
    // signals from this one decision (see lib/consent.ts); its own unit tests cover the
    // "denied" case, this component test just checks the wiring still fires gtag correctly.
    expect(gtag).toHaveBeenCalledWith("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
    expect(screen.queryByRole("region", { name: consent.settingsLabel })).not.toBeInTheDocument();
  });

  it("decline persists 'denied' and hides the banner", async () => {
    const user = userEvent.setup();
    render(<ConsentBanner />);

    await user.click(screen.getByRole("button", { name: consent.decline }));

    expect(window.localStorage.getItem(CONSENT_KEY)).toBe("denied");
    expect(screen.queryByRole("region", { name: consent.settingsLabel })).not.toBeInTheDocument();
  });

  it("reopenConsentBanner() re-shows an already-decided banner", () => {
    window.localStorage.setItem(CONSENT_KEY, "granted");
    render(<ConsentBanner />);
    expect(screen.queryByRole("region", { name: consent.settingsLabel })).not.toBeInTheDocument();

    act(() => {
      reopenConsentBanner();
    });

    expect(screen.getByRole("region", { name: consent.settingsLabel })).toBeInTheDocument();
  });

  it("uses compact mobile spacing and stays above the service sticky CTA without sharing state", () => {
    render(<ConsentBanner />);
    const banner = screen.getByRole("region", { name: consent.settingsLabel });
    expect(banner).toHaveClass("px-3", "pb-3", "sm:px-4", "sm:pb-4", "z-[70]");
    expect(banner).toHaveTextContent(consent.text);
    expect(screen.getByRole("button", { name: consent.decline })).toHaveTextContent(consent.decline);
    expect(screen.getByRole("button", { name: consent.accept })).toHaveTextContent(consent.accept);

    const bannerSource = readFileSync(resolve(process.cwd(), "src/components/interactive/ConsentBanner.tsx"), "utf8");
    const stickySource = readFileSync(resolve(process.cwd(), "src/components/sections/service-sales/ServiceStickyCta.tsx"), "utf8");
    expect(bannerSource).not.toContain("ServiceStickyCta");
    expect(stickySource).not.toContain("ConsentBanner");
    expect(stickySource).toContain("z-[60]");
  });
});
