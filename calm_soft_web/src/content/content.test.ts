import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { services, getServiceForLine, getServiceBySlug } from "./services";
import { cases, getCaseBySlug } from "./cases";
import { steps } from "./steps";
import { demos, getDemoBySlug } from "./demos";
import { site } from "./site";
import { pricing } from "./pricing";
import { solutions, allSolutionLines, getSolutionLineBySlug } from "./solutions";
import type { AreaId, BudgetId } from "./types";

const AREA_IDS: AreaId[] = ["core", "automation", "rescue", "web", "not-sure"];
const BUDGET_IDS: BudgetId[] = ["under-10k", "10-30k", "30-80k", "80k-plus", "no-idea"];

describe("content completeness (SPEC §5.3)", () => {
  it("ma 4 usługi z pełnymi polami, w kolejności core → automation → web → refactor", () => {
    expect(services).toHaveLength(4);
    expect(services.map((s) => s.id)).toEqual(["core", "automation", "web", "refactor"]);
    for (const s of services) {
      expect(s.fit).toHaveLength(4);
      expect(s.fit.every((f) => f.trim().length > 0)).toBe(true);
      expect(s.deliver.length).toBeGreaterThanOrEqual(5);
      expect(s.deliver.length).toBeLessThanOrEqual(6);
      expect(s.deliver.every((d) => d.n.trim().length > 0 && d.d.trim().length > 0)).toBe(true);
      expect(s.relatedSlugs.length).toBeGreaterThan(0);
    }
  });
  it("każda usługa ma niepuste slug/metaTitle/metaDescription/pageH1 strony /uslugi/<slug>/ (2026-07-31 service-pages-restructure design)", () => {
    for (const s of services) {
      expect(s.slug.trim().length).toBeGreaterThan(0);
      expect(s.metaTitle.trim().length).toBeGreaterThan(0);
      expect(s.metaDescription.trim().length).toBeGreaterThan(0);
      expect(s.pageH1.trim().length).toBeGreaterThan(0);
    }
  });
  it("slugi usług są unikalne", () => {
    const slugs = services.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("slugi usług są kebab-case", () => {
    for (const s of services) {
      expect(s.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
  it("metaDescription każdej usługi mieści się w limicie snippetu Google (≤160 znaków)", () => {
    for (const s of services) {
      expect(s.metaDescription.length).toBeLessThanOrEqual(160);
    }
  });
  it("getServiceBySlug zwraca właściwą usługę dla istniejącego sluga i undefined dla nieistniejącego", () => {
    for (const s of services) {
      expect(getServiceBySlug(s.slug)).toBe(s);
    }
    expect(getServiceBySlug("nie-istnieje")).toBeUndefined();
  });
  it("pageSections każdej usługi jest niepustą tablicą (wszystkie cztery usługi mają już treść)", () => {
    for (const s of services) {
      expect(Array.isArray(s.pageSections)).toBe(true);
      expect(s.pageSections.length).toBeGreaterThan(0);
    }
  });
  it("każda sekcja w pageSections ma niepusty heading i co najmniej jedną grupę z co najmniej jedną pozycją; każda pozycja ma niepuste n/d", () => {
    for (const s of services) {
      for (const section of s.pageSections) {
        expect(section.heading.trim().length).toBeGreaterThan(0);
        expect(section.groups.length).toBeGreaterThan(0);
        for (const group of section.groups) {
          expect(group.items.length).toBeGreaterThan(0);
          for (const item of group.items) {
            expect(item.n.trim().length).toBeGreaterThan(0);
            expect(item.d.trim().length).toBeGreaterThan(0);
          }
        }
      }
    }
  });
  // Kontrakt SEO (2026-07-31 service-pages-restructure design, etap 2): te nazwy systemów
  // odpowiadają frazom, na które właściciel licytuje kampanię — dla wszystkich czterech usług
  // (core, automation, web, refactor). Gdyby ktoś kiedyś je usunął z pageSections, strona usługi
  // traci pokrycie fraz, za które płaci — test to wyłapuje.
  it("systemy-i-integracje wymienia Subiekt GT, enova365 i WooCommerce; automatyzacja wymienia n8n i Make.com; platformy-webowe wymienia Next.js, Angular i PostgreSQL; legacy wymienia 4GL, Oracle i Java", () => {
    const core = getServiceBySlug("systemy-i-integracje");
    const automation = getServiceBySlug("automatyzacja");
    const web = getServiceBySlug("platformy-webowe");
    const refactor = getServiceBySlug("legacy");
    const coreNames = core!.pageSections.flatMap((sec) => sec.groups.flatMap((g) => g.items.map((i) => i.n)));
    const automationNames = automation!.pageSections.flatMap((sec) =>
      sec.groups.flatMap((g) => g.items.map((i) => i.n)),
    );
    const webNames = web!.pageSections.flatMap((sec) => sec.groups.flatMap((g) => g.items.map((i) => i.n)));
    const refactorNames = refactor!.pageSections.flatMap((sec) =>
      sec.groups.flatMap((g) => g.items.map((i) => i.n)),
    );
    expect(coreNames).toEqual(
      expect.arrayContaining(["Subiekt GT", "enova365", "WooCommerce"]),
    );
    expect(automationNames).toEqual(expect.arrayContaining(["n8n", "Make.com"]));
    expect(webNames).toEqual(expect.arrayContaining(["Next.js", "Angular", "PostgreSQL"]));
    expect(refactorNames).toEqual(expect.arrayContaining(["4GL", "Oracle", "Java"]));
    for (const n of [...coreNames, ...automationNames, ...webNames, ...refactorNames]) {
      expect(n).not.toMatch(/\*\*/);
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
  it("site.sections.services.detailsCta jest niepuste (2026-07-31 service-pages-restructure design)", () => {
    expect(site.sections.services.detailsCta.trim().length).toBeGreaterThan(0);
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
  it("ma 8 demo z unikalnymi slugami i niepustymi polami", () => {
    expect(demos).toHaveLength(8);
    expect(new Set(demos.map((d) => d.slug)).size).toBe(8);
    for (const d of demos) {
      expect(d.href).toBe(`/demo/${d.slug}/index.html`);
      expect(d.shot).toBe(`/demo-shots/${d.slug}.webp`);
      expect(d.name.trim().length).toBeGreaterThan(0);
      expect(d.tag.trim().length).toBeGreaterThan(0);
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
  it("logoId jest ustawione dokładnie dla cadence, airlift i puls", () => {
    expect(demos.filter((d) => d.logoId).map((d) => d.slug)).toEqual(["cadence", "airlift", "puls"]);
    expect(demos.find((d) => d.slug === "cadence")?.logoId).toBe("cadence");
    expect(demos.find((d) => d.slug === "airlift")?.logoId).toBe("airlift");
    expect(demos.find((d) => d.slug === "puls")?.logoId).toBe("puls");
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

describe("solutions content (2026-07-26 solutions restructure design)", () => {
  it("ma 2 grupy, slugi operacyjne → branzowe w tej kolejności", () => {
    expect(solutions.groups).toHaveLength(2);
    expect(solutions.groups.map((g) => g.slug)).toEqual(["operacyjne", "branzowe"]);
  });

  it("ma 5 linii rozwiązań, slugi w tej kolejności", () => {
    expect(allSolutionLines).toHaveLength(5);
    expect(allSolutionLines.map((l) => l.slug)).toEqual([
      "integracje",
      "automatyzacje",
      "migracje",
      "weterynaria",
      "kliniki-laboratoria",
    ]);
  });

  it("każdy demoSlug w każdym items rozwiązuje się przez getDemoBySlug", () => {
    for (const line of allSolutionLines) {
      for (const item of line.items) {
        expect(getDemoBySlug(item.demoSlug)).toBeDefined();
      }
    }
  });

  it("suma demoSlug po wszystkich liniach pokrywa dokładnie zbiór slugów z demos, każdy dokładnie raz", () => {
    const allDemoSlugs = allSolutionLines.flatMap((l) => l.items.map((i) => i.demoSlug));
    expect(allDemoSlugs).toHaveLength(demos.length);
    expect(new Set(allDemoSlugs).size).toBe(demos.length);
    expect(new Set(allDemoSlugs)).toEqual(new Set(demos.map((d) => d.slug)));
  });

  it("proof.caseSlug (tam, gdzie proof istnieje) rozwiązuje się przez getCaseBySlug", () => {
    for (const line of allSolutionLines) {
      if (line.proof) {
        expect(getCaseBySlug(line.proof.caseSlug)).toBeDefined();
      }
    }
  });

  it("getSolutionLineBySlug zwraca linię dla poprawnego sluga i undefined dla nieznanego", () => {
    expect(getSolutionLineBySlug("weterynaria")?.slug).toBe("weterynaria");
    expect(getSolutionLineBySlug("nieistniejacy-slug")).toBeUndefined();
  });

  it("każda linia ma niepuste kluczowe pola oraz niepuste intro/items", () => {
    for (const line of allSolutionLines) {
      expect(line.headline.trim().length).toBeGreaterThan(0);
      expect(line.audience.trim().length).toBeGreaterThan(0);
      expect(line.kicker.trim().length).toBeGreaterThan(0);
      expect(line.intro.length).toBeGreaterThanOrEqual(1);
      expect(line.items.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("solutions.page ma niepuste kluczowe pola, mechanism.body ma 3 elementy", () => {
    expect(solutions.page.mechanism.heading.trim().length).toBeGreaterThan(0);
    expect(solutions.page.mechanism.body).toHaveLength(3);
    expect(solutions.page.paths.heading.trim().length).toBeGreaterThan(0);
    expect(solutions.page.clickLabel.trim().length).toBeGreaterThan(0);
    expect(solutions.page.audienceLabel.trim().length).toBeGreaterThan(0);
  });
  it("solutions.page.proposalLabel jest niepuste (2026-07-31 service-pages-restructure design)", () => {
    expect(solutions.page.proposalLabel.trim().length).toBeGreaterThan(0);
  });
});

describe("services ↔ solutions crosslink (2026-07-26 services-solutions crosslink design)", () => {
  it("każdy slug w solutionSlugs każdej usługi rozwiązuje się przez getSolutionLineBySlug", () => {
    for (const s of services) {
      for (const slug of s.solutionSlugs) {
        expect(getSolutionLineBySlug(slug)).toBeDefined();
      }
    }
  });

  it("żadna linia rozwiązania nie należy do dwóch usług", () => {
    const allSlugs = services.flatMap((s) => s.solutionSlugs);
    expect(new Set(allSlugs).size).toBe(allSlugs.length);
  });

  it("suma solutionSlugs po wszystkich usługach pokrywa dokładnie zbiór wszystkich pięciu linii, każdą dokładnie raz", () => {
    const allSlugs = services.flatMap((s) => s.solutionSlugs);
    expect(allSlugs).toHaveLength(allSolutionLines.length);
    expect(new Set(allSlugs)).toEqual(new Set(allSolutionLines.map((l) => l.slug)));
  });

  it("getServiceForLine zwraca dokładnie tę usługę, której solutionSlugs zawiera daną linię", () => {
    for (const line of allSolutionLines) {
      const service = getServiceForLine(line.slug);
      expect(service).toBeDefined();
      expect(service!.solutionSlugs).toContain(line.slug);
    }
  });

  it("site.sections.services.solutionsLabel i solutions.page.serviceLabel są niepuste", () => {
    expect(site.sections.services.solutionsLabel.trim().length).toBeGreaterThan(0);
    expect(solutions.page.serviceLabel.trim().length).toBeGreaterThan(0);
  });
});

describe("keyword emphasis marker parity (2026-07-27 keyword-emphasis-and-audience-block-design)", () => {
  // `**` is a paired marker (RichText/stripEmphasis, src/components/ui/RichText.tsx) — an odd
  // count means a typo (an unclosed or extra `**`) would ship as literal asterisks on the page.
  // Runs today before any content carries markers — that's the point: it stands guard before the
  // next step introduces them.
  const countMarkers = (text: string) => (text.match(/\*\*/g) ?? []).length;

  it("has an even number of ** markers in every intro/audience/item/detail string covered by the convention", () => {
    for (const line of allSolutionLines) {
      for (const paragraph of line.intro) {
        expect(countMarkers(paragraph) % 2).toBe(0);
      }
      expect(countMarkers(line.audience) % 2).toBe(0);
      for (const item of line.items) {
        expect(countMarkers(item.text) % 2).toBe(0);
      }
    }
    for (const d of demos) {
      expect(countMarkers(d.detail) % 2).toBe(0);
    }
  });

  it("has an even number of ** markers in every service pageSections intro/item.d string", () => {
    for (const service of services) {
      for (const section of service.pageSections) {
        if (section.intro) {
          expect(countMarkers(section.intro) % 2).toBe(0);
        }
        for (const group of section.groups) {
          for (const item of group.items) {
            expect(countMarkers(item.d) % 2).toBe(0);
          }
        }
      }
    }
  });

  // ServicesSlider on the home page renders service.intro/fit/deliver/approach as plain text —
  // no RichText there. A `**` marker in any of these fields would leak onto the home page as
  // literal asterisks. This test guards that trap: these fields must stay marker-free, even
  // though pageSections (a separate field, rendered only on /uslugi/<slug>/) is allowed markers.
  it("service fields shared with ServicesSlider (intro/fit/deliver/approach) never carry ** markers", () => {
    for (const service of services) {
      expect(countMarkers(service.intro)).toBe(0);
      for (const f of service.fit) {
        expect(countMarkers(f)).toBe(0);
      }
      for (const d of service.deliver) {
        expect(countMarkers(d.n)).toBe(0);
        expect(countMarkers(d.d)).toBe(0);
      }
      expect(countMarkers(service.approach)).toBe(0);
    }
  });
});
