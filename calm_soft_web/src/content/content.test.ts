import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { services } from "./services";
import { cases, getCaseBySlug } from "./cases";
import { steps } from "./steps";
import { demos, getDemoBySlug } from "./demos";
import { site } from "./site";
import { pricing } from "./pricing";

describe("content completeness (SPEC §5.3)", () => {
  it("ma 4 usługi z pełnymi polami", () => {
    expect(services).toHaveLength(4);
    for (const s of services) {
      expect(s.cardBody.length).toBeGreaterThan(0);
      expect(s.chips).toHaveLength(4);
      expect(s.fit).toHaveLength(4);
      expect(s.fit.every((f) => f.trim().length > 0)).toBe(true);
      expect(s.deliver.length).toBeGreaterThanOrEqual(5);
      expect(s.deliver.length).toBeLessThanOrEqual(6);
      expect(s.deliver.every((d) => d.n.trim().length > 0 && d.d.trim().length > 0)).toBe(true);
      expect(s.relatedSlugs.length).toBeGreaterThan(0);
    }
  });
  it("servicePicker options mapują 1:1 na ServiceId usług (kontrakt radio→payload)", () => {
    const pickerIds = new Set(site.contact.form.servicePicker.options.map((o) => o.id));
    const serviceIds = new Set(services.map((s) => s.id));
    expect(pickerIds).toEqual(serviceIds);
  });
  it("lewa kolumna kontaktu ma 3 checki", () => {
    expect(site.contact.checks).toHaveLength(3);
  });
  it("każdy case ma niepuste challenge/approach/results i pierwszą metrykę", () => {
    for (const c of cases) {
      expect(c.challenge.trim().length).toBeGreaterThan(0);
      expect(c.approach.trim().length).toBeGreaterThan(0);
      expect(c.results.trim().length).toBeGreaterThan(0);
      expect(c.m1v.trim().length).toBeGreaterThan(0);
      expect(c.m1l.trim().length).toBeGreaterThan(0);
    }
  });
  it("ma 7 case studies z unikalnymi slugami", () => {
    expect(cases).toHaveLength(7);
    expect(new Set(cases.map((c) => c.slug)).size).toBe(7);
  });
  it("relatedSlugs i featuredCaseSlugs wskazują istniejące case'y", () => {
    for (const s of services) for (const slug of s.relatedSlugs) expect(getCaseBySlug(slug)).toBeDefined();
    expect(site.featuredCaseSlugs.length).toBeGreaterThanOrEqual(1);
    for (const slug of site.featuredCaseSlugs) expect(getCaseBySlug(slug)).toBeDefined();
  });
  it("ma 4 kroki procesu 00–03", () => {
    expect(steps.map((s) => s.number)).toEqual(["00", "01", "02", "03"]);
  });
  it("stopki modali są niepuste", () => {
    expect(site.modals.serviceNote.length).toBeGreaterThan(0);
    expect(site.modals.caseNote.length).toBeGreaterThan(0);
    expect(site.modals.demoNote.length).toBeGreaterThan(0);
  });
  it("ma 5 demo z unikalnymi slugami i niepustymi polami", () => {
    expect(demos).toHaveLength(5);
    expect(new Set(demos.map((d) => d.slug)).size).toBe(5);
    for (const d of demos) {
      expect(d.href).toBe(`/demo/${d.slug}/index.html`);
      expect(d.shot).toBe(`/demo-shots/${d.slug}.webp`);
      expect(d.name.trim().length).toBeGreaterThan(0);
      expect(d.tag.trim().length).toBeGreaterThan(0);
      expect(d.description.trim().length).toBeGreaterThan(0);
      expect(d.tagline.trim().length).toBeGreaterThan(0);
      expect(d.detail.trim().length).toBeGreaterThan(0);
      expect(d.shotAlt.trim().length).toBeGreaterThan(0);
      expect(d.features.length).toBeGreaterThanOrEqual(3);
      expect(d.features.every((f) => f.trim().length > 0)).toBe(true);
    }
  });
  it("featuredDemoSlugs wskazują istniejące dema", () => {
    expect(site.featuredDemoSlugs.length).toBeGreaterThanOrEqual(1);
    for (const slug of site.featuredDemoSlugs) expect(getDemoBySlug(slug)).toBeDefined();
  });
  it("sekcja demos ma niepusty techLegend", () => {
    expect(site.sections.demos.techLegend.trim().length).toBeGreaterThan(0);
  });
  it("desktopOnly jest ustawione dokładnie dla healthlab i merdi-panel, desktopNote jest niepuste", () => {
    expect(demos.filter((d) => d.desktopOnly).map((d) => d.slug)).toEqual([
      "healthlab",
      "merdi-panel",
    ]);
    expect(site.sections.demos.desktopNote.trim().length).toBeGreaterThan(0);
  });
  it("każde demo ma zcommitowane assety pod public/demo/<slug>/ (verbatim, niedotykane)", () => {
    for (const d of demos) {
      const dir = join(process.cwd(), "public", "demo", d.slug);
      expect(existsSync(join(dir, "index.html"))).toBe(true);
      expect(existsSync(join(dir, "support.js"))).toBe(true);
      expect(existsSync(join(dir, "image-slot.js"))).toBe(true);
    }
  });
});

describe("pricing content (2026-07-20 pricing/Calendly/reorder design doc)", () => {
  const PRICE_KINDS = ["from", "free", "promo", "individual"];
  const TONES = ["accent", "accent2"];

  it("has 6 groups, each with a valid tone and at least one card", () => {
    expect(pricing.groups).toHaveLength(6);
    for (const g of pricing.groups) {
      expect(TONES).toContain(g.tone);
      expect(g.cards.length).toBeGreaterThan(0);
      expect(g.eyebrow.trim().length).toBeGreaterThan(0);
      expect(g.sub.trim().length).toBeGreaterThan(0);
    }
  });

  it("every card has a non-empty title/desc and a price of a valid kind", () => {
    for (const g of pricing.groups) {
      for (const c of g.cards) {
        expect(c.title.trim().length).toBeGreaterThan(0);
        expect(c.desc.trim().length).toBeGreaterThan(0);
        expect(PRICE_KINDS).toContain(c.price.kind);
      }
    }
  });

  it("heading, lead, badges, foot, ctaLabel and disclaimer are all non-empty", () => {
    expect(pricing.heading.line1.trim().length).toBeGreaterThan(0);
    expect(pricing.heading.line2.trim().length).toBeGreaterThan(0);
    expect(pricing.lead.trim().length).toBeGreaterThan(0);
    expect(pricing.badges.length).toBeGreaterThan(0);
    expect(pricing.foot.billing.trim().length).toBeGreaterThan(0);
    expect(pricing.foot.fine.trim().length).toBeGreaterThan(0);
    expect(pricing.ctaLabel.trim().length).toBeGreaterThan(0);
    expect(pricing.disclaimer.trim().length).toBeGreaterThan(0);
  });

  it("filters block has 5 unique, fully-labelled price tiers and non-empty UI strings", () => {
    expect(pricing.filters.tiers).toHaveLength(5);
    expect(new Set(pricing.filters.tiers.map((t) => t.id)).size).toBe(5);
    for (const tier of pricing.filters.tiers) {
      expect(tier.label.trim().length).toBeGreaterThan(0);
    }
    expect(pricing.filters.categoryLegend.trim().length).toBeGreaterThan(0);
    expect(pricing.filters.priceLegend.trim().length).toBeGreaterThan(0);
    expect(pricing.filters.clearLabel.trim().length).toBeGreaterThan(0);
    expect(pricing.filters.countLabel.trim().length).toBeGreaterThan(0);
    expect(pricing.filters.emptyTitle.trim().length).toBeGreaterThan(0);
    expect(pricing.filters.emptyBody.trim().length).toBeGreaterThan(0);
  });
});
