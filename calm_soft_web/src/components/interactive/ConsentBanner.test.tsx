import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentBanner } from "./ConsentBanner";
import { site } from "@/content/site";
import { CONSENT_KEY, reopenConsentBanner } from "@/lib/consent";

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
    expect(gtag).toHaveBeenCalledWith("consent", "update", { analytics_storage: "granted" });
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
});
