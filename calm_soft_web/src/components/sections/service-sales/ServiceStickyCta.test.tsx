import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { ServiceStickyCta } from "./ServiceStickyCta";
import { serviceSales } from "@/content/serviceSales";

const mockPrefillContactMessage = vi.fn();
const mockRequestContactScroll = vi.fn();
const mockFocusContactField = vi.fn();

vi.mock("@/components/providers/InquiryProvider", () => ({
  useInquiry: () => ({
    prefillContactMessage: mockPrefillContactMessage,
    requestContactScroll: mockRequestContactScroll,
    focusContactField: mockFocusContactField,
  }),
}));

let intersectionCallback: IntersectionObserverCallback | undefined;
let intersectionOptions: IntersectionObserverInit | undefined;
let observedTargets: Element[] = [];

beforeEach(() => {
  intersectionCallback = undefined;
  intersectionOptions = undefined;
  observedTargets = [];
  mockPrefillContactMessage.mockReset();
  mockRequestContactScroll.mockReset();
  mockFocusContactField.mockReset();
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) { intersectionCallback = callback; intersectionOptions = options; }
    observe(target: Element) { observedTargets.push(target); }
    disconnect() {}
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("ServiceStickyCta", () => {
  it.each([
    [serviceSales.core.contactHref, serviceSales.core.contact.stickyCta],
    [serviceSales.automation.contactHref, serviceSales.automation.contact.stickyCta],
    [serviceSales.web.contactHref, serviceSales.web.contact.stickyCta],
  ])("uses the fixture root-relative href %s", (href, label) => {
    render(<ServiceStickyCta href={href} label={label} />);
    const cta = screen.getByRole("link", { name: label });
    expect(cta).toHaveAttribute("href", href);
    expect(cta).toHaveClass("min-[900px]:hidden", "min-h-11");
    expect(cta).toHaveAttribute("tabindex", "0");
    expect(cta).toHaveAttribute("aria-hidden", "false");
    expect(cta).toHaveClass("transition-[filter,transform,opacity]");
    expect(cta).not.toHaveClass("transition-[filter]");
  });

  it("hides while contact is intersecting and returns when contact is no longer visible", async () => {
    const { rerender } = render(<><div id="contact" /><ServiceStickyCta href={serviceSales.core.contactHref} label={serviceSales.core.contact.stickyCta} /></>);
    const cta = screen.getByRole("link", { name: serviceSales.core.contact.stickyCta, hidden: true });
    await act(async () => intersectionCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    rerender(<><div id="contact" /><ServiceStickyCta href={serviceSales.core.contactHref} label={serviceSales.core.contact.stickyCta} /></>);
    expect(cta).toHaveAttribute("aria-hidden", "true");
    expect(cta).toHaveAttribute("tabindex", "-1");
    await act(async () => intersectionCallback?.([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(cta).toHaveAttribute("aria-hidden", "false");
    expect(cta).toHaveAttribute("tabindex", "0");
  });

  it("keeps reduced-motion handling in the production stylesheet while continuously pulsing floating color", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("transition-duration: 0.01ms !important");
    expect(css).toContain(".service-sticky-cta-floating::after");
    expect(css).toContain("service-sticky-cta-floating-pulse 2.4s ease-in-out infinite");
    expect(css).toContain("@media (prefers-reduced-motion: no-preference)");
  });

  it("keeps floating CTA hidden until start passes above the sticky nav and handles partial batches", async () => {
    const FloatingStickyCta = ServiceStickyCta as unknown as ComponentType<{
      href: string;
      label: string;
      floating: { startId: string; hideIds?: string[] };
    }>;
    const { container } = render(
      <>
        <div id="nexo-switch-banner" />
        <div id="contact" />
        <FloatingStickyCta href="/ksef/rachmistrz-nexo/#contact" label="Rabat za InsPunkty" floating={{ startId: "nexo-switch-banner", hideIds: ["contact"] }} />
      </>,
    );
    const cta = container.querySelector("a")!;
    const start = document.getElementById("nexo-switch-banner")!;
    const contact = document.getElementById("contact")!;
    const entry = (target: Element, isIntersecting: boolean, bottom: number) => ({ target, isIntersecting, boundingClientRect: { bottom } } as IntersectionObserverEntry);

    expect(cta).toHaveAttribute("aria-hidden", "true");
    expect(cta).toHaveAttribute("tabindex", "-1");
    expect(observedTargets).toEqual([start, contact]);
    expect(intersectionOptions).toEqual({ rootMargin: "-65px 0px 0px 0px", threshold: 0 });

    await act(async () => intersectionCallback?.([entry(start, false, 65)], {} as IntersectionObserver));
    expect(cta).toHaveAttribute("aria-hidden", "false");
    await act(async () => intersectionCallback?.([entry(contact, true, 100)], {} as IntersectionObserver));
    expect(cta).toHaveAttribute("aria-hidden", "true");
    await act(async () => intersectionCallback?.([entry(contact, false, 900)], {} as IntersectionObserver));
    expect(cta).toHaveAttribute("aria-hidden", "false");
    await act(async () => intersectionCallback?.([entry(start, true, 40)], {} as IntersectionObserver));
    expect(cta).toHaveAttribute("aria-hidden", "true");
    await act(async () => intersectionCallback?.([entry(start, false, 900)], {} as IntersectionObserver));
    expect(cta).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps a floating CTA hidden when the start target is missing", () => {
    const FloatingStickyCta = ServiceStickyCta as unknown as ComponentType<{
      href: string;
      label: string;
      floating: { startId: string; hideIds?: string[] };
    }>;
    render(<FloatingStickyCta href="/ksef/rachmistrz-nexo/#contact" label="Rabat za InsPunkty" floating={{ startId: "missing" }} />);
    const cta = document.querySelector('a[href="/ksef/rachmistrz-nexo/#contact"]')!;
    expect(cta).toHaveAttribute("aria-hidden", "true");
    expect(cta).toHaveAttribute("tabindex", "-1");
    expect(observedTargets).toHaveLength(0);
  });

  it("uses KsefPlanCta for a floating prefill and forwards hidden state", async () => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 0; });
    const { container } = render(
      <>
        <div id="nexo-switch-hero" />
        <div id="contact" />
        <ServiceStickyCta href="/ksef/rachmistrz-nexo/#contact" label="Rabat za InsPunkty" floating={{ startId: "nexo-switch-hero", hideIds: ["contact"], prefill: "Chcę skorzystać z rabatu." }} />
      </>,
    );
    const cta = container.querySelector("button")!;
    const start = document.getElementById("nexo-switch-hero")!;

    expect(cta).toHaveAttribute("aria-hidden", "true");
    expect(cta).toHaveAttribute("tabindex", "-1");
    expect(cta).toHaveClass("fixed");
    expect(cta).not.toHaveClass("relative");
    expect(cta).not.toHaveClass("service-sticky-cta-floating-pulse");
    await act(async () => intersectionCallback?.([{ target: start, isIntersecting: false, boundingClientRect: { bottom: 65 } } as unknown as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(cta).toHaveAttribute("aria-hidden", "false");
    expect(cta).toHaveAttribute("tabindex", "0");
    expect(cta).toHaveClass("service-sticky-cta-floating-pulse");

    fireEvent.click(cta);
    expect(mockPrefillContactMessage).toHaveBeenCalledWith("Chcę skorzystać z rabatu.");
    expect(mockRequestContactScroll).toHaveBeenCalledTimes(1);
    expect(mockFocusContactField).toHaveBeenCalledTimes(1);
  });
});
