import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ServiceStickyCta } from "./ServiceStickyCta";
import { serviceSales } from "@/content/serviceSales";

let intersectionCallback: IntersectionObserverCallback | undefined;

beforeEach(() => {
  intersectionCallback = undefined;
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersectionCallback = callback; }
    observe() {}
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

  it("keeps reduced-motion handling in the production stylesheet while animating only transform and opacity", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("transition-duration: 0.01ms !important");
  });
});
