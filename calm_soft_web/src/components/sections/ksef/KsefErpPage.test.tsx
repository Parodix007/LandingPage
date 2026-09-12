import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { KsefErpPage } from "./KsefErpPage";
import { ksef } from "@/content/ksef";

vi.mock("@/components/interactive/KsefPlanCta", () => ({
  KsefPlanCta: ({ label }: { label: string }) => <button type="button">{label}</button>,
}));
vi.mock("@/components/sections/service-sales/ServiceDisclosure", () => ({
  ServiceDisclosure: ({ title, children }: { title: string; children: React.ReactNode }) => <div><h3>{title}</h3>{children}</div>,
}));
vi.mock("@/components/sections/service-sales/ServiceStickyCta", () => ({
  ServiceStickyCta: () => null,
}));
vi.mock("@/components/sections/service-sales/SalesContact", () => ({
  SalesContact: () => <div id="contact" />,
}));
vi.mock("./KsefPricingTable", () => ({
  KsefPricingTable: () => <div data-testid="pricing-table" />,
}));

describe("KsefErpPage", () => {
  it("renderuje sekcje w kolejności briefu i zachowuje CTA oraz kotwice", () => {
    const html = renderToStaticMarkup(<KsefErpPage page={ksef.erps[0]!} />);
    const root = document.createElement("div");
    root.innerHTML = html;
    const headings = [...root.querySelectorAll("h1, h2")].map((heading) => heading.textContent?.trim());

    expect(headings).toEqual([
      ksef.erps[0]!.hero.h1,
      ksef.erps[0]!.legacy.title,
      ksef.erps[0]!.development.title,
      ksef.erps[0]!.coverage.title,
      ksef.erps[0]!.monitoring.title,
      ksef.erps[0]!.pricing.title,
      ksef.erps[0]!.comparison.title,
      ksef.erps[0]!.otherErp.title,
      ksef.erps[0]!.howItWorks.title,
      ksef.erps[0]!.audience.title,
      ksef.erps[0]!.faq.title,
      ksef.erps[0]!.finalCta.title,
    ]);
    expect(root.querySelector('a[href="#cennik"]')?.textContent).toContain(ksef.erps[0]!.hero.pricingCta);
    expect(root.querySelector(`a[href="${ksef.erps[0]!.contactHref}"]`)?.textContent).toContain(ksef.erps[0]!.hero.cta);
    expect(root.querySelector("button")?.textContent).toContain(ksef.erps[0]!.otherErp.cta);
    expect(root.querySelector("[data-testid='pricing-table']")).toBeTruthy();
  });
});
