import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { serviceSales } from "@/content/serviceSales";
import { cases } from "@/content/cases";
import { getCaseBySlug } from "@/content/cases";
import { demos } from "@/content/demos";
import { services } from "@/content/services";
import { InquiryProvider } from "@/components/providers/InquiryProvider";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { ServiceSalesPage } from "./ServiceSalesPage";

describe("ServiceSalesPage compositions", () => {
  function renderPage(page: (typeof serviceSales)[keyof typeof serviceSales]) {
    const service = services.find((item) => item.id === page.id)!;
    const props = { page, art: service.art };
    return render(<InquiryProvider><ModalProvider cases={cases} demos={demos}><ServiceSalesPage {...props} /></ModalProvider></InquiryProvider>);
  }

  it.each([serviceSales.core, serviceSales.automation, serviceSales.web])("renders the responsive service art as the hero background", (page) => {
    const service = services.find((item) => item.id === page.id)!;
    const { container } = renderPage(page);
    const heroArt = container.querySelector(".service-sales-hero-art")!;
    expect(heroArt).toHaveAttribute("aria-hidden", "true");
    expect(heroArt.querySelector("source")).toHaveAttribute("media", "(min-width: 900px)");
    expect(heroArt.querySelector("source")).toHaveAttribute("srcset", service.art.desktop);
    expect(heroArt.querySelector("img")).toHaveAttribute("src", service.art.mobile);
    expect(heroArt.querySelector("img")).toHaveAttribute("width", "1200");
    expect(heroArt.querySelector("img")).toHaveAttribute("height", "1200");
    expect(heroArt.querySelector("img")).toHaveAttribute("loading", "eager");
    expect(heroArt.querySelector("img")).toHaveAttribute("decoding", "sync");
    expect(heroArt.querySelector("img")).toHaveAttribute("fetchpriority", "high");
  });

  it.each([
    ["core", serviceSales.core, [serviceSales.core.problems.title, serviceSales.core.systems.title, serviceSales.core.proof.title, serviceSales.core.scope.title, serviceSales.core.process.title, serviceSales.core.demosTitle, serviceSales.core.pricing.title, serviceSales.core.faqTitle]],
    ["automation", serviceSales.automation, [serviceSales.automation.candidates.title, serviceSales.automation.proof.title, serviceSales.automation.criteria.title, serviceSales.automation.scope.title, serviceSales.automation.process.title, serviceSales.automation.demosTitle, serviceSales.automation.pricing.title, serviceSales.automation.faqTitle]],
    ["web", serviceSales.web, [serviceSales.web.demosTitle, serviceSales.web.appTypes.title, serviceSales.web.proof.title, serviceSales.web.scope.title, serviceSales.web.process.title, serviceSales.web.deliverablesTitle, serviceSales.web.pricing.title, serviceSales.web.faqTitle]],
  ])("renders the %s renderer's approved section order", (_id, page, expected) => {
    const { container } = renderPage(page);
    const headings = [...container.querySelectorAll("main h2")].map((heading) => heading.textContent);
    expect(headings).toEqual(expected);
  });

  it.each([serviceSales.core, serviceSales.automation, serviceSales.web])("keeps the mobile hero CTA before the note and restores the desktop visual order", (page) => {
    const { container } = renderPage(page);
    const hero = container.querySelector(".service-hero")!;
    const heroCta = [...hero.querySelectorAll("a")].find((link) => link.textContent === page.hero.cta)!;
    const note = [...hero.querySelectorAll("p")].find((paragraph) => paragraph.textContent === page.hero.note)!;
    expect(heroCta.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(heroCta.parentElement).toHaveClass("order-3", "min-[900px]:order-4");
    expect(note.parentElement).toHaveClass("order-4", "min-[900px]:order-3");
  });

  it.each([serviceSales.core, serviceSales.automation, serviceSales.web])("uses compact mobile hero geometry while restoring desktop sizing", (page) => {
    const { container } = renderPage(page);
    const main = container.querySelector("main")!;
    const hero = container.querySelector(".service-hero")!;
    const inner = hero.firstElementChild!;
    const heading = hero.querySelector("h1")!;
    const lead = [...hero.querySelectorAll("p")].find((paragraph) => paragraph.textContent === page.hero.lead)!;
    const cta = [...hero.querySelectorAll("a")].find((link) => link.textContent === page.hero.cta)!;
    expect(main).toHaveClass("py-5", "min-[900px]:py-[110px]");
    expect(hero).toHaveClass("!p-4", "min-[900px]:!px-10", "min-[900px]:!py-12");
    expect(inner).toHaveClass("flex", "flex-col");
    expect(heading).toHaveClass("mt-2", "text-[30px]", "leading-[1.08]", "min-[900px]:mt-4", "min-[900px]:text-[clamp(36px,4.5vw,56px)]");
    expect(lead).toHaveClass("mt-3", "text-[16px]", "leading-[1.4]", "min-[900px]:mt-4", "min-[900px]:text-[18px]");
    expect(cta.parentElement).toHaveClass("mt-4", "w-full", "min-[900px]:mt-7", "min-[900px]:w-fit");
    expect(cta).toHaveClass("hit-44", "rounded-[var(--radius-pill)]");
  });

  it.each([serviceSales.core, serviceSales.automation, serviceSales.web])("renders homepage-style contact columns with Calendly above the form", (page) => {
    const { container } = renderPage(page);
    const contact = container.querySelector("#contact");
    expect(contact).toBeInTheDocument();
    const contactInner = contact?.querySelector(".grid");
    expect(contactInner).toHaveClass("grid", "min-[900px]:grid-cols-[0.85fr_1.15fr]");
    const columns = contactInner?.children;
    expect(columns).toHaveLength(2);
    expect(columns?.[0]).toHaveTextContent(page.contact.title);
    expect(columns?.[0]).toHaveTextContent(page.contact.intro);
    const paths = columns?.[1]?.children;
    expect(paths).toHaveLength(2);
    expect(paths?.[0]).toHaveTextContent(page.contact.calendlyTitle);
    expect(paths?.[1]).toHaveTextContent(page.contact.form.title);
    expect((paths?.[0] as Element)?.querySelector("a")).toHaveAttribute("href", expect.stringContaining("calendly.com"));
  });

  it.each([serviceSales.core, serviceSales.automation, serviceSales.web])("uses native disclosures with a current-color chevron and animated content hook", (page) => {
    const { container } = renderPage(page);
    const disclosure = container.querySelector(".service-disclosure")!;
    const summary = disclosure.querySelector("summary")!;
    const chevron = summary.querySelector("svg")!;
    expect(disclosure.tagName).toBe("DETAILS");
    expect(summary).toBeInTheDocument();
    expect(chevron).toHaveClass("service-disclosure-chevron");
    expect(chevron).toHaveAttribute("stroke", "currentColor");
    expect(disclosure.querySelector("[data-disclosure-content]")).toHaveClass("service-disclosure-content");
    // Brief #10A: marker `service-card-glow-interactive` usunięty (nie miał żadnej reguły CSS).
    // Równoważny pinn: disclosure nosi dziecko `.card-glow` (geometrię/barwę daje globals.css).
    expect(disclosure.querySelector(":scope > .card-glow")).toBeInTheDocument();
    // brief #11: FAQ/ServiceDisclosure pozostaje bez poświaty za kursorem i bez watermarku
    // (decyzja właściciela 2026-11-07) — tylko statyczna, ambientowa poświata kafla.
    expect(disclosure).not.toHaveAttribute("data-glow");
    expect(disclosure.querySelector(".service-card-watermark")).toBeNull();
  });

  it("adds ambient glow to informational cards and lift hooks only to proof cards", () => {
    const { container } = renderPage(serviceSales.core);
    const proofCard = container.querySelector('[aria-labelledby="sales-proof"] article')!;
    const infoCard = container.querySelector('[aria-labelledby^="sales-"] article')!;
    // Brief #10A: `service-card-interactive` był martwy (brak reguły CSS); realną cechę
    // klikalności wnosi HOVER_LIFT (`hover:-translate-y-1`), HOVER_BORDER go nie niesie.
    expect(proofCard).toHaveClass("service-card", "hover:-translate-y-1");
    expect(proofCard.querySelector(".card-glow")).toBeInTheDocument();
    expect(infoCard).toHaveClass("service-card");
    expect(infoCard).not.toHaveClass("hover:-translate-y-1");
    expect(infoCard.querySelector(".card-glow")).toBeInTheDocument();
  });

  it("keeps process cards on the shared surface and the stretched proof CTA anchored to the card host", () => {
    const { container } = renderPage(serviceSales.core);
    const processCard = container.querySelector("ol li.service-card")!;
    const proofCard = container.querySelector('[aria-labelledby="sales-proof"] article')!;
    const stretched = proofCard.querySelector(".pill-stretched")!;
    // Brief #10A: wspólna twarda powierzchnia kafli to teraz klasa `.service-card`
    // (bg-surface w globals.css, @layer components), nie utility TSX.
    expect(processCard).toHaveClass("service-card");
    expect(processCard).not.toHaveClass("bg-surface");
    let ancestor = stretched.parentElement;
    while (ancestor && ancestor !== proofCard) {
      expect(ancestor).not.toHaveClass("relative");
      ancestor = ancestor.parentElement;
    }
    expect(ancestor).toBe(proofCard);
  });

  it.each([serviceSales.core, serviceSales.automation, serviceSales.web])("keeps every internal CTA root-relative", (page) => {
    const { container } = renderPage(page);
    const links = [...container.querySelectorAll("a[href]")].filter((link) => !(link.getAttribute("href") ?? "").startsWith("http"));
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      expect(href).toMatch(/^\/(?!\/)/);
    }
    expect(links.filter((link) => link.getAttribute("href") === page.contactHref).length).toBeGreaterThanOrEqual(2);
  });

  it("keeps the approved web section order in the rendered DOM", () => {
    const { container } = renderPage(serviceSales.web);
    const headings = [...container.querySelectorAll("h2")].map((heading) => heading.textContent);
    expect(headings.indexOf(serviceSales.web.scope.title)).toBeLessThan(headings.indexOf(serviceSales.web.process.title));
    expect(headings.indexOf(serviceSales.web.process.title)).toBeLessThan(headings.indexOf(serviceSales.web.deliverablesTitle!));
    expect(headings.indexOf(serviceSales.web.deliverablesTitle!)).toBeLessThan(headings.indexOf(serviceSales.web.pricing.title));
  });

  it("renders proof metrics from approved sales content", () => {
    const { container } = renderPage(serviceSales.core);
    const proofCards = [...container.querySelectorAll('[aria-labelledby="sales-proof"] article')];
    expect(proofCards).toHaveLength(2);
    serviceSales.core.proof.caseSlugs.forEach((slug, index) => {
      const item = getCaseBySlug(slug)!;
      expect(proofCards[index]).toHaveTextContent(item.m1v);
      expect(proofCards[index]).toHaveTextContent(item.m1l);
      if (item.m2v && item.m2l) {
        expect(proofCards[index]).toHaveTextContent(item.m2v);
        expect(proofCards[index]).toHaveTextContent(item.m2l);
      }
    });
    expect(container).not.toHaveTextContent("m1v");
  });

  it("uses primary FilledPill styling for every contact CTA and secondary styling for pricing", () => {
    const { container } = renderPage(serviceSales.core);
    const contactLinks = [...container.querySelectorAll(`a[href="${serviceSales.core.contactHref}"]`)].filter((link) => link.textContent);
    expect(contactLinks.length).toBeGreaterThanOrEqual(3);
    for (const link of contactLinks) expect(link).toHaveClass("bg-accent", "text-black", "text-[17px]");
    const pricingLink = [...container.querySelectorAll('a[href="/pricing/"]')][0];
    expect(pricingLink).toHaveClass("text-accent");
    expect(pricingLink).not.toHaveClass("bg-accent");
  });

  it("renders bullet groups as responsive service-card tiles with checks and watermarks", () => {
    const { container } = renderPage(serviceSales.core);
    const scope = [...container.querySelectorAll("section")].find((section) => section.textContent?.includes(serviceSales.core.scope.title))!;
    const list = scope.querySelector("ul")!;
    // brief #10B: w trybie 1-kolumnowym kontener to flex-kolumna (sticky stack), grid dopiero od 900px
    expect(list).toHaveClass("flex", "flex-col", "min-[900px]:grid", "min-[900px]:grid-cols-2");
    expect(list.querySelectorAll(":scope > li")).toHaveLength(serviceSales.core.scope.bullets!.length);
    expect(list.querySelectorAll(":scope > li.service-card .card-glow")).toHaveLength(serviceSales.core.scope.bullets!.length);
    expect(list.querySelectorAll(":scope > li svg")).toHaveLength(serviceSales.core.scope.bullets!.length);
    expect(list.querySelectorAll(":scope > li .service-card-watermark")).toHaveLength(serviceSales.core.scope.bullets!.length);
    // brief #11: kafelek bulleta jest powierzchnią poświaty za kursorem (data-glow), a watermark
    // jest widoczny w każdym viewportcie — bez `hidden`/`min-[900px]:block`.
    expect(list.querySelectorAll(":scope > li[data-glow]")).toHaveLength(serviceSales.core.scope.bullets!.length);
    for (const watermark of list.querySelectorAll<HTMLElement>(":scope > li > .service-card-watermark")) {
      expect(watermark).not.toHaveClass("hidden");
      expect(watermark).not.toHaveClass("min-[900px]:block");
    }
  });

  it("marks proof, process and pricing tiles with pointer glow and paints the hero watermark after the hero art", () => {
    const { container } = renderPage(serviceSales.core);
    const proofArticles = [...container.querySelectorAll('[aria-labelledby="sales-proof"] article')];
    expect(proofArticles.length).toBeGreaterThan(0);
    for (const article of proofArticles) expect(article).toHaveAttribute("data-glow");
    const processItems = [...container.querySelectorAll("ol li.service-card")];
    expect(processItems).toHaveLength(serviceSales.core.process.steps.length);
    for (const item of processItems) expect(item).toHaveAttribute("data-glow");
    const pricingCard = container.querySelector("section.service-card")!;
    expect(pricingCard).toHaveAttribute("data-glow");
    const hero = container.querySelector(".service-sales-hero")!;
    const heroArt = hero.querySelector(".service-sales-hero-art")!;
    const heroWatermark = hero.querySelector(".service-card-watermark")!;
    // kolejność DOM decyduje o malowaniu: watermark musi leżeć PO warstwie art i PO poświacie
    expect(heroWatermark.compareDocumentPosition(heroArt) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(heroWatermark.compareDocumentPosition(hero.querySelector(":scope > .card-glow")!) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it("renders canonical proof cases in the approved order with both metric pairs", () => {
    const { container } = renderPage(serviceSales.web);
    const proofCards = [...container.querySelectorAll('[aria-labelledby="sales-proof"] article')];
    serviceSales.web.proof.caseSlugs.forEach((slug, index) => {
      const item = getCaseBySlug(slug)!;
      expect(proofCards[index]).toHaveTextContent(item.tag);
      expect(proofCards[index]).toHaveTextContent(item.headline);
      expect(proofCards[index]).toHaveTextContent(item.teaser);
      expect(proofCards[index]).toHaveTextContent(item.m1v);
      expect(proofCards[index]).toHaveTextContent(item.m1l);
      if (item.m2v && item.m2l) {
        expect(proofCards[index]).toHaveTextContent(item.m2v);
        expect(proofCards[index]).toHaveTextContent(item.m2l);
      }
      expect(proofCards[index]).toHaveTextContent("calm_soft");
    });
  });
});
