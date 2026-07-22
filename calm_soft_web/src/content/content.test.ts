import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { services } from "./services";
import { cases, getCaseBySlug } from "./cases";
import { steps } from "./steps";
import { demos, getDemoBySlug } from "./demos";
import { site } from "./site";
import { pricing } from "./pricing";
import type { AreaId, BudgetId } from "./types";

const AREA_IDS: AreaId[] = ["core", "automation", "rescue", "web", "not-sure"];
const BUDGET_IDS: BudgetId[] = ["under-10k", "10-30k", "30-80k", "80k-plus", "no-idea"];

describe("content completeness (SPEC §5.3)", () => {
  it("ma 4 usługi z pełnymi polami, w kolejności core → refactor → automation → web", () => {
    expect(services).toHaveLength(4);
    expect(services.map((s) => s.id)).toEqual(["core", "refactor", "automation", "web"]);
    for (const s of services) {
      expect(s.fit).toHaveLength(4);
      expect(s.fit.every((f) => f.trim().length > 0)).toBe(true);
      expect(s.deliver.length).toBeGreaterThanOrEqual(5);
      expect(s.deliver.length).toBeLessThanOrEqual(6);
      expect(s.deliver.every((d) => d.n.trim().length > 0 && d.d.trim().length > 0)).toBe(true);
      expect(s.relatedSlugs.length).toBeGreaterThan(0);
    }
  });
  it("sekcja services (2026-07-22 services-slider design) ma dokładnie nowe nagłówki i niepuste etykiety slidera", () => {
    const s = site.sections.services;
    expect(s.line1).toBe("Cztery obszary.");
    expect(s.line2).toBe("Jeden inżynier odpowiedzialny za całość.");
    for (const label of [
      s.sliderLabel,
      s.overviewLabel,
      s.fitLabel,
      s.deliverLabel,
      s.approachLabel,
      s.proofLabel,
      s.readCaseCta,
      s.cta,
      s.note,
    ]) {
      expect(label.trim().length).toBeGreaterThan(0);
    }
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
  it("ma 7 case studies z unikalnymi slugami, zawiera localhost-academy (rename), nie zawiera starego sluga", () => {
    expect(cases).toHaveLength(7);
    const slugs = cases.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(7);
    expect(slugs).toContain("localhost-academy");
    expect(slugs).not.toContain("premium-online-school-edtech");
  });
  it("dokładnie jeden case jest archiwalny: international-automotive-sales-platform", () => {
    const archived = cases.filter((c) => c.archived);
    expect(archived.map((c) => c.slug)).toEqual(["international-automotive-sales-platform"]);
  });
  it("relatedSlugs i featuredCaseSlugs wskazują istniejące case'y", () => {
    for (const s of services) for (const slug of s.relatedSlugs) expect(getCaseBySlug(slug)).toBeDefined();
    expect(site.featuredCaseSlugs.length).toBeGreaterThanOrEqual(1);
    for (const slug of site.featuredCaseSlugs) expect(getCaseBySlug(slug)).toBeDefined();
  });
  it("featuredCaseSlugs zgadza się z handoffem", () => {
    expect(site.featuredCaseSlugs).toEqual([
      "public-sector-poland",
      "e-delivery-platform-nationwide",
      "localhost-academy",
    ]);
  });
  it("ma 5 kroków procesu 00–04", () => {
    expect(steps.map((s) => s.number)).toEqual(["00", "01", "02", "03", "04"]);
  });
  it("stopki modali są niepuste", () => {
    expect(site.modals.caseNote.length).toBeGreaterThan(0);
    expect(site.modals.demoNote.length).toBeGreaterThan(0);
  });
  it("ma 7 demo z unikalnymi slugami i niepustymi polami", () => {
    expect(demos).toHaveLength(7);
    expect(new Set(demos.map((d) => d.slug)).size).toBe(7);
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
      expect(d.uiLang.trim().length).toBeGreaterThan(0);
    }
  });
  it("merdi zostaje pierwszym demem (modal test używa demos[0])", () => {
    expect(demos[0].slug).toBe("merdi");
  });
  it("uiLang === 'en' dokładnie dla cadence i airlift", () => {
    expect(demos.filter((d) => d.uiLang === "en").map((d) => d.slug)).toEqual(["cadence", "airlift"]);
  });
  it("logoId jest ustawione dokładnie dla cadence i airlift", () => {
    expect(demos.filter((d) => d.logoId).map((d) => d.slug)).toEqual(["cadence", "airlift"]);
    expect(demos.find((d) => d.slug === "cadence")?.logoId).toBe("cadence");
    expect(demos.find((d) => d.slug === "airlift")?.logoId).toBe("airlift");
  });
  it("featuredDemoSlugs wskazują istniejące dema i zgadzają się z handoffem", () => {
    expect(site.featuredDemoSlugs.length).toBeGreaterThanOrEqual(1);
    for (const slug of site.featuredDemoSlugs) expect(getDemoBySlug(slug)).toBeDefined();
    expect(site.featuredDemoSlugs).toEqual(["cadence", "airlift", "healthlab"]);
  });
  it("sekcja demos ma niepusty techLegend i langChip (etykieta chipu dla dem uiLang==='en')", () => {
    expect(site.sections.demos.techLegend.trim().length).toBeGreaterThan(0);
    expect(site.sections.demos.langChip.trim().length).toBeGreaterThan(0);
  });
  it("sekcja demos ma niepusty flowsLegend (2026-07-23 hero-demo-detail-slider design)", () => {
    expect(site.sections.demos.flowsLegend.trim().length).toBeGreaterThan(0);
  });
  it("site.navCta jest niepuste (2026-07-23 CTA-consistency sub-feature)", () => {
    expect(site.navCta.trim().length).toBeGreaterThan(0);
  });
  it("desktopOnly jest ustawione dokładnie dla healthlab i merdi-panel, desktopNote jest niepuste", () => {
    expect(demos.filter((d) => d.desktopOnly).map((d) => d.slug)).toEqual([
      "healthlab",
      "merdi-panel",
    ]);
    expect(site.sections.demos.desktopNote.trim().length).toBeGreaterThan(0);
  });
  it("sekcja cases ma dwie niepuste linie intro", () => {
    expect(site.sections.cases.intro).toHaveLength(2);
    expect(site.sections.cases.intro[0].trim().length).toBeGreaterThan(0);
    expect(site.sections.cases.intro[1].trim().length).toBeGreaterThan(0);
    expect(site.sections.cases.footnote.trim().length).toBeGreaterThan(0);
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

describe("contact form v2 content (2026-07-22 pl-copy handoff)", () => {
  it("areaOptions ids to dokładnie zbiór AreaId, 5 unikalnych", () => {
    const ids = site.contact.form.success.details.areaOptions.map((o) => o.id);
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    expect(new Set(ids)).toEqual(new Set(AREA_IDS));
  });
  it("budgetOptions ids to dokładnie zbiór BudgetId, 5 unikalnych", () => {
    const ids = site.contact.form.success.details.budgetOptions.map((o) => o.id);
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    expect(new Set(ids)).toEqual(new Set(BUDGET_IDS));
  });
  it("wszystkie etykiety area/budget są niepuste", () => {
    for (const o of site.contact.form.success.details.areaOptions) {
      expect(o.label.trim().length).toBeGreaterThan(0);
    }
    for (const o of site.contact.form.success.details.budgetOptions) {
      expect(o.label.trim().length).toBeGreaterThan(0);
    }
  });
  it("pola formularza kroku 1 i komunikaty błędów są niepuste", () => {
    const form = site.contact.form;
    expect(form.title.trim().length).toBeGreaterThan(0);
    expect(form.intro.trim().length).toBeGreaterThan(0);
    expect(form.fields.name.trim().length).toBeGreaterThan(0);
    expect(form.fields.email.trim().length).toBeGreaterThan(0);
    expect(form.fields.message.trim().length).toBeGreaterThan(0);
    expect(form.messagePlaceholder.trim().length).toBeGreaterThan(0);
    expect(form.fieldErrors.name.trim().length).toBeGreaterThan(0);
    expect(form.fieldErrors.emailRequired.trim().length).toBeGreaterThan(0);
    expect(form.fieldErrors.emailInvalid.trim().length).toBeGreaterThan(0);
    expect(form.fieldErrors.message.trim().length).toBeGreaterThan(0);
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

describe("consent banner content (2026-07-22 GA4 + Consent Mode addendum)", () => {
  it("site.consent has all four non-empty fields", () => {
    expect(site.consent.text.trim().length).toBeGreaterThan(0);
    expect(site.consent.accept.trim().length).toBeGreaterThan(0);
    expect(site.consent.decline.trim().length).toBeGreaterThan(0);
    expect(site.consent.settingsLabel.trim().length).toBeGreaterThan(0);
  });
});
